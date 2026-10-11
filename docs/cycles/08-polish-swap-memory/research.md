# 사이클 08 조사: DB·캐시·Java 메모리를 속도 잃지 않고 줄이는 방법

- 작성: 2026-10-05. 범위: `scope.md` "메모리 줄이기" 12~16, "먼저 조사할 것"의 메모리 항목
- 목표 (사용자): "DB메모리도 어떻게 해야 최적인가(너무 메모리에 맞춰서 줄였다가 느려지면 또 그건 별로니까) 찾아보자" [확정]
- 방법과 공식 안내만 적습니다. 모듈·표·API 설계는 없습니다. 측정값이 아직 없으므로 숫자 기준은 모두 [안]입니다.
- 앞선 조사: `../../research/deploy/db-memory.md` (흩어짐 측정, 안 1~5)
- 외부 사실의 확인일은 모두 2026-10-05입니다.

## 0. 지금 상태 (dev 코드 읽기, 2026-10-05) [확정: 코드 확인]

| 항목 | 지금 | 근거 (dev) |
|---|---|---|
| DB | PostgreSQL 18 + pg_bigm, Docker(WSL Ubuntu 안). 메모리 설정 없음. `shared_preload_libraries=pg_bigm`만 | `compose.yaml`, `docker/postgres-bigm/Dockerfile` |
| 컨테이너 메모리 제한·`shm_size` | 없음 | `compose.yaml` |
| 서비스 | Spring Boot 4.1.1, Java 25 | `backend/build.gradle` |
| Actuator / Micrometer | **없음** (의존성에 `spring-boot-starter-actuator` 없음) | `backend/build.gradle` |
| 캐시 두 개 | `Caffeine.newBuilder().expireAfterWrite(3m).maximumSize(1000).buildAsync()`. `recordStats()` 없음. Spring `CacheManager`를 거치지 않고 직접 만듦 | `CaffeineSearchPageCache`, `CaffeineDetailVerdictCache`, `application.yml` `cache-ttl`·`cache-max-size` |
| 검색 쪽 캐시 값 | `FetchedPage(ParsedPage, URI, Instant)`. `ParsedPage` = `totalCount` + `ParsedItem` 목록. `ParsedItem` = 문자열 5개(title, author, publisher, supplier, detailPath) + `Integer` 3개 + 판정 enum | `ParsedPage.java`, `ParsedItem.java` |
| 한 쪽의 항목 수 | 어댑터별 10 또는 20, 교보는 설정값(`recordCount`) | 각 어댑터 `PAGE_SIZE` |
| 상세 판정 캐시 값 | `DetailPage(ParsedDetail, Instant)`. `ParsedDetail` = `Integer` 3개 + enum. 검색 쪽보다 훨씬 작음 [안: 코드 읽기로 본 추정] | `DetailVerdictCache.java` |
| 검색 목록 쿼리 | `catalog.book`만 읽음(pg_bigm `LIKE`, `library_ids` 거르기) | `PgBigmBookSearch` |
| 대출 현황 스트림 쿼리 | `holdingsOf`: `WHERE book_id = ANY(:ids) ORDER BY book_id, library_id, id` → 결과 책의 **모든 도서관** `holding` 줄 | `JdbcCatalogHoldings` |
| 측정 스크립트 | `scripts/catalog/measure_books.py`: 질의 9개 × 조건 3개(없음, 지역 1101, joinable) × 1·2쪽, 스트림은 첫 이벤트(targets)까지. `times.tsv`에 클라이언트 벽시계 ms | 스크립트 머리말 |

캐시 한 칸의 실제 바이트 수는 재지 않았습니다 [확인 필요].

## 1. PostgreSQL 메모리 설정 (PostgreSQL 18 문서)

출처: https://www.postgresql.org/docs/18/runtime-config-resource.html , https://www.postgresql.org/docs/18/runtime-config-query.html (확인 2026-10-05)

| 설정 | 기본값 [확정: 공식 문서] | 공식 안내 요지 [확정: 공식 문서] | 이 서비스에서 볼 점 |
|---|---|---|---|
| `shared_buffers` | 보통 128MB | 전용 서버라면 메모리의 25%가 "합리적인 시작값". 40%를 넘겨도 더 나아질 가능성은 낮음. PostgreSQL은 OS 캐시에도 기댐 | 지금 128MB 그대로일 가능성이 큼 [확인 필요: `SHOW shared_buffers`]. 서버 재시작해야 바뀜 |
| `effective_cache_size` | 4GB | 메모리를 잡지 않음. **계획기의 추정에만** 쓰임. 크면 인덱스 스캔, 작으면 순차 스캔 쪽으로 기움. shared buffers와 OS 디스크 캐시 중 PostgreSQL 파일에 쓰일 부분을 함께 생각할 것 | 줄여도 메모리는 안 줄고 계획만 바뀜. 실제 쓸 수 있는 캐시보다 크게 두면 계획이 낙관적이 됨 |
| `work_mem` | 4MB | 정렬·해시 **한 동작마다** 이만큼 쓸 수 있고, 한 쿼리가 여러 동작을 동시에 함. 해시는 `hash_mem_multiplier`(기본 2.0)배 | `holdingsOf`의 `ORDER BY`, 검색의 `ORDER BY ... LIMIT`이 정렬을 씀. `EXPLAIN`의 `Sort Method: external merge`가 보이면 부족 |
| `maintenance_work_mem` | 64MB | 색인 만들기·VACUUM 등 | 가져오기(새 표에 색인 만들기, `CLUSTER`) 속도에 영향. 평소 검색과는 무관 |
| `huge_pages` | `try` | 되면 쓰고 안 되면 일반 쪽으로 | Docker/WSL에서 실제로 쓰이는지 [확인 필요] |
| `random_page_cost` | 4.0 | DB가 거의 RAM에 있으면 `seq_page_cost`와 같게 두는 것이 말이 됨 | 메모리를 줄여 캐시에 다 안 들어가면 기본값이 맞음. 바꾸지 않는 것을 먼저 [안] |

### OS 캐시와 겹침 (이중 버퍼링)

- PostgreSQL은 자기 버퍼(`shared_buffers`)와 OS 페이지 캐시를 함께 씀. 공식 문서는 `effective_cache_size` 설명에서 "일부 데이터는 두 곳에 다 있을 수 있다"고 적음 [확정: 위 문서]
- 그래서 `shared_buffers`를 줄여도 OS 캐시가 그 자리를 채우면 속도는 거의 그대로일 수 있고, 반대로 컨테이너·WSL 메모리를 줄이면 OS 캐시가 줄어 느려질 수 있음. **줄이는 대상이 두 가지**(PostgreSQL 설정, 컨테이너/VM이 쓸 수 있는 메모리)라는 점을 측정에서 나눠 봐야 함 [안]
- 로컬 PC에서는 OS 캐시가 WSL2 VM 안에 있음. `.wslconfig`의 `memory` 기본값은 "Windows 전체 메모리의 50%", `[experimental] autoMemoryReclaim` 기본값은 `dropCache` [확정: https://learn.microsoft.com/en-us/windows/wsl/wsl-config , 확인 2026-10-05]. 32GB PC라면 VM 상한은 약 16GB [안: 계산]. 운영 서버(배포 보류)와는 조건이 다름

## 2. 재는 방법 (PostgreSQL 18 문서)

| 도구 | 무엇을 보나 | 준비 | 출처 [확정: 확인 2026-10-05] |
|---|---|---|---|
| `EXPLAIN (ANALYZE, BUFFERS)` | 쿼리 한 번의 `shared hit`(버퍼에서 찾음) / `read`(버퍼 밖에서 읽음) 쪽 수, 실행 시간. PG18은 `ANALYZE`만 줘도 `BUFFERS`가 켜짐. 위 노드의 수는 아래 노드를 포함함 | 없음 | https://www.postgresql.org/docs/18/using-explain.html , https://www.postgresql.org/docs/18/sql-explain.html |
| `pg_stat_statements` | 쿼리 모양별 누적: `shared_blks_hit`, `shared_blks_read`, `mean_exec_time`, `stddev_exec_time`. **백분위(p95) 칸은 없음** | `shared_preload_libraries`에 추가(재시작), `CREATE EXTENSION`. `pg_stat_statements_reset()`으로 초기화 | https://www.postgresql.org/docs/18/pgstatstatements.html |
| `pg_statio_user_tables` | 표별 `heap_blks_read`/`heap_blks_hit`, `idx_blks_read`/`idx_blks_hit` → 적중률 = hit / (hit + read) | 없음 | https://www.postgresql.org/docs/18/monitoring-stats.html |
| `pg_buffercache` | 지금 `shared_buffers`에 어느 표·색인이 몇 쪽 올라와 있나. 표별 집계 예시 쿼리가 문서에 있음. `pg_buffercache_summary()`, `pg_buffercache_usage_counts()`. PG18에는 `pg_buffercache_evict_relation()`·`pg_buffercache_evict_all()`(superuser)도 있음 | `CREATE EXTENSION pg_buffercache`. superuser 또는 `pg_monitor` | https://www.postgresql.org/docs/18/pgbuffercache.html |
| `pg_prewarm` | 표를 미리 OS 캐시나 `shared_buffers`에 올림(`prefetch`/`read`/`buffer`). autoprewarm은 재시작 뒤 버퍼 내용을 다시 올림(기본 켜짐, 300초마다 기록) | autoprewarm은 `shared_preload_libraries` 필요 | https://www.postgresql.org/docs/18/pgprewarm.html |
| `track_io_timing` | I/O 대기 시간을 `EXPLAIN (BUFFERS)`, `pg_stat_statements` 등에 보임. 기본 꺼짐(플랫폼에 따라 부담). `pg_test_timing`으로 부담을 잼 | 설정 | https://www.postgresql.org/docs/18/runtime-config-statistics.html |

**주의** [확정: monitoring-stats 문서]: PostgreSQL 통계의 "read"는 디스크에서 온 것과 **OS 페이지 캐시에서 온 것을 구별하지 않음**. 문서는 OS 도구와 함께 보라고 권함. 그래서 "read가 늘었다"만으로 느려졌다고 볼 수 없고, **응답 시간을 함께 재야** 함. `track_io_timing`을 켜면 read에 걸린 시간을 볼 수 있음 [안].

### 차갑게 / 따뜻하게

- 처음 한 번(차가움)과 반복(따뜻함)은 크게 다름. 최적점은 **따뜻한 상태에서 사용자가 실제로 보는 응답 시간**으로 정하고, 재시작 직후 값은 따로 적음 [안]
- 버퍼만 비우기: `pg_buffercache_evict_all()`(PG18). OS 캐시까지 비우려면 컨테이너/WSL 재시작이 필요 [안: 공식 문서에 OS 캐시 비우는 방법은 없음]

## 3. 같은 책 줄을 붙여 저장하기 (CLUSTER vs 정렬해 쓰기)

출처: https://www.postgresql.org/docs/18/sql-cluster.html , https://www.postgresql.org/docs/18/view-pg-stats.html (확인 2026-10-05)

| | `CLUSTER holding USING <book_id 색인>` | 새 표에 `book_id` 순으로 써 넣기 (`scope.md` 10) |
|---|---|---|
| 공식 문서 [확정] | **한 번만** 정렬함. 그 뒤 바뀐 줄은 정렬되지 않음. 다시 하려면 다시 실행 | (문서 없음: `INSERT ... SELECT ... ORDER BY` / `COPY`를 정렬된 순서로 쓰면 그 순서로 쌓이는 것은 일반 동작) [확인 필요: 프로토타입으로 상관도 확인] |
| 잠금 [확정] | `ACCESS EXCLUSIVE` — 끝날 때까지 **읽기도 막힘** → 검색이 멈춤 | 새 표에 쓰는 동안 기존 표는 그대로 읽힘(바꿔 끼우기와 잘 맞음) |
| 디스크 [확정] | 색인 순 방법: 표 + 색인 크기만큼 여유. 정렬 방법: 최대 표 크기의 2배 + 색인 | 새 표 + 색인만큼 (바꿔 끼우는 동안 두 벌) |
| 뒤처리 [확정] | 끝난 뒤 `ANALYZE` 권장(계획기가 순서 통계를 씀) | 같음 |

- 정렬 정도 보기: `pg_stats.correlation` — 물리 순서와 값 순서의 상관, -1~+1. ±1에 가까우면 인덱스 스캔이 싸게 추정됨 [확정: view-pg-stats]. 지금 `book_id`는 0.01 [확정: 측정, `db-memory.md`]
- 이 서비스는 가져오기에서 표 전체를 새로 쓰므로(바꿔 끼우기), 가져오기마다 정렬해 쓰면 흩어질 일이 없음 [안]. 도서관 단위 갱신이 생기면 다시 흩어짐 → 그때 다시 봄 (`db-memory.md` 4절)
- 붙인 뒤 `holdingsOf`가 읽는 쪽 수는 `EXPLAIN (ANALYZE, BUFFERS)`로 전후 비교 [안]

## 4. Docker 컨테이너 메모리 (Docker 공식 문서)

출처: https://docs.docker.com/engine/containers/resource_constraints/ , https://docs.docker.com/reference/compose-file/services/ , https://docs.docker.com/reference/cli/dockerd/ , https://hub.docker.com/_/postgres (확인 2026-10-05)

- 기본으로 컨테이너에는 **제한이 없음**. `-m/--memory`로 상한(최소 6m), `--memory-reservation`은 경합 때만 쓰는 약한 상한, `--memory-swap`은 스왑 포함 상한 [확정]
- Compose에서는 `mem_limit`, `mem_reservation`, `memswap_limit`, `shm_size` [확정]
- 메모리가 모자라면 커널이 OOM으로 프로세스를 죽임 [확정] → 상한을 너무 낮추면 느려지는 게 아니라 **DB가 죽을 수 있음**
- `/dev/shm` 기본 크기 64MiB (`dockerd --default-shm-size`) [확정]. postgres 공식 이미지 안내의 Compose 예시는 `shm_size: 128mb` [확정]
- PostgreSQL의 주 공유 메모리(`shared_buffers`)는 `shared_memory_type` 기본 `mmap`, 병렬 쿼리 등의 동적 공유 메모리는 `dynamic_shared_memory_type` 기본 `posix`(= `/dev/shm`) [확정: runtime-config-resource]. 그래서 `/dev/shm` 64MiB는 `shared_buffers` 크기와는 직접 관계없고 **병렬 쿼리**에 영향 [안: 문서 두 곳을 이어 읽은 해석, 확인 필요]
- 설정은 이미지 명령에 `-c shared_buffers=...`를 붙이거나 `postgresql.conf`를 붙여 줄 수 있음 [확정: postgres 이미지 안내]. dev Dockerfile은 이미 `CMD ["postgres", "-c", ...]` 모양
- 컨테이너 메모리 상한에 그 컨테이너가 만든 OS 페이지 캐시가 포함되는지(cgroup v2) [확인 필요: 리눅스 커널 cgroup v2 문서]. 포함된다면 상한을 낮추는 것 자체가 OS 캐시를 줄여 느려질 수 있음

## 5. Caffeine 캐시 크기 상한 (Caffeine 공식 위키·소스)

출처: https://github.com/ben-manes/caffeine/wiki/Eviction , https://github.com/ben-manes/caffeine/wiki/Statistics , https://github.com/ben-manes/caffeine/blob/master/caffeine/src/main/java/com/github/benmanes/caffeine/cache/Caffeine.java (확인 2026-10-05)

- `maximumSize`: 항목 크기가 비슷할 때. `maximumWeight` + `weigher`: 크기가 들쭉날쭉할 때 [확정]
- 무게는 **만들거나 바뀔 때 한 번 계산하고 그 뒤 고정** [확정]. `maximumSize`와 `maximumWeight`는 함께 쓸 수 없음 [확정]
- 무게는 "넘쳤는지" 판단에만 쓰이고 어느 것을 내보낼지는 고르지 않음. 무게 0은 크기 기준 축출에서 빠짐 [확정: 소스 javadoc]
- 지금 캐시는 `buildAsync()`(값이 `CompletableFuture`). 비동기 캐시에서 아직 끝나지 않은 값의 무게가 어떻게 매겨지는지 [확인 필요: Caffeine javadoc `AsyncCache`/`Weigher` 확인]
- `recordStats()`를 켜면 `stats()`로 `hitRate()`, `evictionCount()`, `averageLoadPenalty()` [확정]. 지금은 꺼져 있고 적중/실패는 검색 쪽 캐시만 로그(`search cache hit/miss`)로 남김 [확정: 코드]
- 무게 단위 후보 [안]: (가) 항목 수(`ParsedPage.items().size()`) — 계산 쉬움, 문자열 길이 무시 / (나) 문자열 글자 수 합 — 바이트에 더 가깝지만 계산 비용 / (다) 지금처럼 개수 상한 유지 + 값에서 안 쓰는 칸 빼기
- 한 칸의 실제 크기 재는 법 [확정: 도구 존재]
  - JOL(Java Object Layout): 객체 배치와 그래프 전체 크기를 JVM에서 직접 읽음. https://openjdk.org/projects/code-tools/jol/
  - `jcmd <pid> GC.class_histogram`: 클래스별 인스턴스 수·바이트(부담 큼). `ParsedItem`, `FetchedPage` 수와 바이트를 캐시 가득 찬 상태에서 봄. https://docs.oracle.com/en/java/javase/25/docs/specs/man/jcmd.html

## 6. Java 메모리 상한과 재기 (Oracle Java 25, Spring Boot 4.1.1, Micrometer)

| 항목 | 내용 | 출처 (확인 2026-10-05) |
|---|---|---|
| 기본 최대 힙 | 물리 메모리의 1/4, 초기 1/64. 2코어 이상·1792MB 이상이면 G1 [확정] | https://docs.oracle.com/en/java/javase/25/gctuning/ergonomics.html |
| `-Xmx` | 최대 힙. 기본은 실행 때 시스템 구성으로 정함 [확정] | https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html |
| `-XX:MaxRAMPercentage` | 메모리 대비 힙 비율, 기본 25 [확정: Java 8 문서 https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html]. Java 25 문서의 같은 항목은 페이지가 잘려 직접 읽지 못함 [확인 필요] | |
| `-XX:+UseContainerSupport` | 리눅스에서 컨테이너 메모리·CPU를 알아봄, 기본 켜짐 [확정] | java 25 man page |
| 힙 밖 메모리 | `-XX:NativeMemoryTracking=summary` + `jcmd <pid> VM.native_memory summary`로 힙·클래스·스레드·코드 등 나눠 봄 [확정]. 프로세스 전체 = 힙 + 이것들 | java, jcmd man page |
| Actuator 메트릭 | `jvm.` 이름으로 메모리·GC·스레드 등 [확정]. HTTP로는 기본 `health`만 열림 → `management.endpoints.web.exposure.include=metrics` [확정] | https://docs.spring.io/spring-boot/reference/actuator/metrics.html , https://docs.spring.io/spring-boot/reference/actuator/endpoints.html |
| 캐시 메트릭 | Spring Boot는 **시작 때 설정된 캐시만** 자동 연결(Caffeine 포함), 나머지는 직접 등록 [확정]. dev 캐시는 `CacheManager` 밖에서 만들므로 Micrometer `CaffeineCacheMetrics.monitor(registry, cache, name)`로 직접 묶어야 함, `recordStats()` 필요 [확정: https://docs.micrometer.io/micrometer/reference/reference/cache.html]. `AsyncCache`를 그대로 넘길 수 있는지 [확인 필요] | |

- dev에는 Actuator가 없음. 넣을지, 측정 때만 `jcmd`/로그로 볼지는 설계에서 [안]
- 가져오기(`scope.md` 16)는 지금 8GB에서 끝남 [확정: dev 보고]. `-Xmx`를 단계로 낮춰 같은 사본으로 돌리고 끝나는지·걸린 시간·GC 시간을 적음 [안]

## 7. 제안하는 측정 순서 [안]

모든 단계에서 같은 질의 묶음을 씀: `measure_books.py`(9질의 × 3조건 × 1·2쪽) + 책 화면 몇 권의 `holdingsOf`(`EXPLAIN (ANALYZE, BUFFERS)`). 각 단계는 한 번 데운 뒤 3회 반복해 p50·p95를 냄. `measure_books.py`는 클라이언트 벽시계만 적으므로 p95는 반복값에서 계산함 (`pg_stat_statements`에는 백분위가 없음).

1. **기준 재기 (줄이기 전)**: `SHOW shared_buffers, effective_cache_size, work_mem`; `docker stats`의 DB 메모리; WSL VM 메모리; `pg_statio_user_tables` 적중률; `pg_buffercache` 표별 쪽 수; Java는 `jcmd GC.heap_info`, `VM.native_memory summary`; 캐시는 `recordStats()`를 켠 측정 빌드로 적중률·항목 수, `GC.class_histogram`으로 캐시 값 바이트
2. **줄 붙이기 먼저** (`scope.md` 10~11): 새 표를 `book_id` 순으로 쓰고 `ANALYZE` → `correlation`, `holdingsOf`의 읽은 쪽 수, `pg_buffercache` 비교. 메모리 설정을 줄이기 **전에** 하는 이유: 같은 응답 시간에 필요한 메모리 자체가 줄어 최적점이 바뀜
3. **`shared_buffers` 단계로 낮추기**: 예) 지금 값 → 4GB → 2GB → 1GB → 512MB → 256MB(숫자는 [안]). 단계마다 재시작, 데우기, 측정. 컨테이너 상한은 이 단계에서는 두지 않음(OS 캐시 효과를 따로 보려고)
4. **컨테이너 메모리 상한 낮추기**: 3에서 고른 `shared_buffers`로 고정하고 `mem_limit`을 단계로 낮춤. OOM 로그를 함께 봄. `effective_cache_size`는 상한에 맞춰 함께 낮춤
5. **멈추는 기준**: 검색 첫 쪽 p95가 1초(사이클 07 기준, `scope.md` 완료 기준)를 넘거나, 기준선보다 p95가 눈에 띄게(예: 20%) 늘어난 첫 단계의 **바로 앞 단계**를 최적점으로 봄. 퍼센트는 [안], 사용자에게 물음
6. **`work_mem`**: 측정 중 `EXPLAIN`에 `external merge`·디스크 정렬이 보일 때만 올림. 안 보이면 기본값 유지
7. **캐시**: 1의 적중률·한 칸 크기로 (가)/(나)/(다) 중 고름. 상한을 줄인 뒤 같은 질의로 적중률이 떨어지는지 봄 (같은 질의를 3분 안에 반복하는 측정이라 적중률이 실제보다 높게 나옴 → 해석 주의)
8. **Java 힙**: 캐시를 고친 뒤 서비스 `-Xmx`를 단계로 낮춰 같은 측정 + GC 시간. 가져오기는 따로 `-Xmx` 단계 시험
9. 결과를 "줄이기 전 / 뒤" 표 하나로 정리 (`scope.md` 완료 기준)

로컬 PC(WSL2, 32GB)에서 찾은 값은 운영 서버 크기가 정해지면 다시 재야 함 (`db-memory.md` 4절 "2의 값") [안].

## 8. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 지금 DB의 `shared_buffers` 등 실제 값 | API 호출 시험 (dev가 `SHOW` 실행) |
| 캐시 한 칸(검색 쪽 `FetchedPage`)의 바이트, 가득 찼을 때 총량 | 프로토타입 (`GC.class_histogram` 또는 JOL) |
| 두 캐시의 실제 적중률 | 프로토타입 (`recordStats()` 측정 빌드) |
| 비동기 캐시(`buildAsync`)에서 `weigher`가 끝나지 않은 값을 어떻게 세는지 | 공식 문서 확인 (Caffeine javadoc `AsyncCache`, `Caffeine.weigher`) |
| Micrometer `CaffeineCacheMetrics`에 `AsyncCache`를 넘길 수 있는지 | 공식 문서 확인 (Micrometer javadoc) |
| Java 25에서 `MaxRAMPercentage` 기본 25 | 공식 문서 확인 (java 25 man page 해당 항목) |
| cgroup v2 메모리 상한에 페이지 캐시가 포함되는지 | 공식 문서 확인 (Linux kernel cgroup-v2 문서) |
| `/dev/shm` 64MiB가 병렬 쿼리에 모자라는지 | 프로토타입 (병렬 계획이 나오는 쿼리를 상한 낮춘 상태로 실행, 로그의 공유 메모리 오류 확인) |
| Docker/WSL에서 `huge_pages=try`가 실제로 쓰이는지 | 프로토타입 (`SHOW huge_pages_status`) [확인 필요: PG18 문서에서 이 설정 이름 확인] |
| `book_id` 순 `INSERT`/`COPY` 뒤 `correlation`이 1에 가까워지는지 | 프로토타입 |
| 멈추는 기준 (p95 1초, 기준 대비 몇 %) | 사용자에게 질문 |
| 단계 값 (4GB, 2GB, …) | 사용자에게 질문 (설계에서 [안]으로 냄) |

## 9. 코드에서 본 메모리 쓰임 (dev 코드 읽기, 2026-10-06) [확정: 코드 확인]

경로는 dev `backend/src/main/java/com/chaekcheck/` 기준입니다. 크기는 재지 않았고 코드 모양으로 본 것입니다.

### 9-1. 메모리에 두는 것
| 무엇 | 키 → 값 | 상한 | 근거 |
|---|---|---|---|
| 검색 쪽 캐시 | `PageKey(libraryId, field, query, page)` → `FetchedPage(ParsedPage, URI, Instant)`. 한 쪽 10(교보·YES24)~20(북큐브)줄, 줄마다 문자열 5개 + Integer 3개 + enum. 원본 본문은 담지 않음 | 3분, 1,000개 | `availability/internal/fetch/CaffeineSearchPageCache.java:23-32`, `PageKey.java:6`, `adapter/ParsedItem.java:12-13`, `application.yml:120-121,134,157` |
| 상세 판정 캐시 | `DetailKey(libraryId, detailUrl 전체 문자열)` → `ParsedDetail`(Integer 3개 + enum) | 3분, 1,000개 | `resolve/CaffeineDetailVerdictCache.java:16-24`, `DetailVerdictCache.java:20` |
| 호스트 간격 표 | 호스트 이름 → Semaphore + Instant. 지우지 않음(도서관 수만큼, 약 2.7천에서 멈춤) | 없음 | `fetch/InMemoryHostThrottle.java:31,42` |
| 조회 서버 쉼 표 | 서버 → Instant (2대) | — | `fetch/FetchServiceSiteFetcher.java:59,99` |
| 묶음 실행 중 표 | 진행 중 요청·전달 대기 등. 묶음이 끝나면 버림 | 동시 검색 20 | `search/BatchRunner.java:332-335`, `BatchSession.java:36-40`, `SearchSlots.java:22,29-34` |
| 도서관·가입 규칙·지역 | **메모리에 두지 않음.** `@Cacheable` 없음, 시작 때 읽어 두는 것 없음 | — | 코드 검색 |

### 9-2. 요청마다 만드는 것
- `GET /api/v1/libraries`: 켜진 도서관 약 2.7천 줄을 JPA 엔티티로 읽고(칸 약 12개 글자), 가입 규칙을 도서관 번호 약 2.7천 개를 IN 목록으로 넘겨 읽고, 새 레코드를 만들어 671KB JSON으로 씀. **요청마다 다시 함** (`library/internal/web/LibraryListController.java:34-39`, `LibraryService.java:158-159,175-177,247-251`)
- `planSearch`(검색 계획): `/books`, `/books/{id}`, 두 스트림을 열 때마다 같은 전체 읽기. 주석에 "enabled는 요청마다 읽음"(ADR-0004) (`LibraryService.java:76-146,85`). 지역 펼치기도 요청마다 DB (`region/internal/RegionService.java:39,142-143`)
- 스트림 첫 이벤트 `targets`: 계획의 도서관마다 18칸(글자 약 9개) 레코드 (`search/StreamEvents.java:77-81`)
- 도서관 응답 본문: 최대 4MB까지 `ByteArrayOutputStream`에 모은 뒤 `toByteArray`로 한 번 더 복사 (`fetch/BodyLimit.java:43,75-77,88`). 조회 서버 경유면 Base64 JSON → 문자열 → 디코드로 약 세 벌 (`FetchServiceSiteFetcher.java:121,147-150`). 동시 약 100건 × 수백 KB면 수십 MB [안: 추정]
- 실행기: 가상 스레드, 대기열 없음. 묶음마다 동시 5건 (`AvailabilityConfiguration.java:44-47`, `application.yml:145`)

### 9-3. DB를 읽는 모양
- `holdingsOf`: `id, book_id, library_id, platform, detail_url, title_raw, author_raw, publisher_raw`를 `book_id = ANY(최대 20권)`으로 **모든 도서관** 줄을 읽고, 계획에 없는 도서관은 Java에서 버림 (`catalog/internal/JdbcCatalogHoldings.java:19-21,38`, `BookAvailabilityStreamController.java:37,64,95-99`)
- `find(bookId)`(책 화면 S3): `holding`을 `book_id AND library_id = ANY(계획)`으로 읽음 (`catalog/internal/search/PgBigmBookSearch.java:110-133`)
- `/books` 목록: `holding`을 읽지 않음. `count(*) OVER ()` 때문에 맞는 책 전부에 점수를 매긴 뒤 LIMIT (`PgBigmBookSearch.java:66-87,83`)
- 서비스가 실행 중에 **읽지 않는** `holding` 칸: `item_key`, `content_type`, `published_raw`, `supplier`, `alt_code`, `first_seen_at` (가져오기만 씀). `holding_library_item_key` 고유 색인(1,075MB)도 가져오기의 맞대기에만 씀 (`JdbcCatalogLoad.java:159-164,205-210,292`, `catalog/001-catalog-schema.yaml:91`)

### 9-4. 설정
- Java 힙·GC 설정 없음(`build.gradle` bootRun, `.claude/launch.json`), Tomcat은 일반 스레드, Hikari 풀 기본값 (`application.yml:7-10`)
- DB 컨테이너 메모리 설정·상한 없음 (`compose.yaml:13-29`, `docker/postgres-bigm/Dockerfile:21`)
- Actuator·Micrometer 없음 (`build.gradle:34-60`)

## 10. 가져오기·교체 시간을 줄이는 방향 (조사)

- 작성: 2026-10-06. 범위: `scope.md` C절 9 "가져오기·교체 시간 줄이기"
- 사용자: "기존 표를 두고 새 표에 쓴 뒤 바꿔 끼우기 — 이거 꼭 이 방향이 아니고 db가져오기? 교체? 시간을 줄이기 위한 것이거든. 시간 오래걸린다는 거. 그래서 이걸로 한다는 게 아니라 그게 가능한 여러 방향을 조사해봤으면 해. 각각의 장단점에 대해서 알려주고" (2026-10-06) [확정]
- 방향과 장단점만 적습니다. 모듈·표·API 설계는 하지 않습니다(고른 뒤 `design-delta.md`에서).
- 외부 사실의 확인일은 모두 **2026-10-06**입니다. 줄어드는 시간은 잰 값이 아니면 모두 [안: 추정]입니다.

### 10-1. 지금 걸리는 시간 [확정: dev `docs/plan-feedback.md` "사이클 07" 14~17단계, "plan에 넘길 요약" 10]

| 실행 | 전체 | 읽기 | 묶기 | 국가서지 | 쓰기 |
|---|---|---|---|---|---|
| 첫 가져오기 (책 번호 잇기 전) | 35분 45초 | 8분 46초 | 5초 | 8분 52초 | 17분 51초 (두 번째 읽기 + COPY 포함) |
| 책 번호 잇기 뒤 1회차 (빈 DB) | 36분 43초 | 6분 57초 | — | 6분 45초 | 22분 43초 |
| 2회차 (옛 소장과 실제로 맞댐) | 40분 36초 | 9분 9초 | — | 6분 28초 | 26분 55초 |

규모: 원본 줄 22,051,238, 소장 20,383,882, 책 1,617,445 [확정: 측정]. 쓰기 안의 단계별 시간(두 번째 읽기, 임시 표 COPY, 맞대기, 옮겨 쓰기, VACUUM)은 **나눠 재지 않았습니다** [확인 필요].

### 10-2. 코드에서 본 순서 (dev 코드 읽기, 2026-10-06) [확정: 코드 확인]

경로: dev `backend/src/main/java/com/chaekcheck/` 기준.

| # | 단계 | 무엇을 하나 | 검색 | 근거 |
|---|---|---|---|---|
| 1 | 첫 번째 읽기 | SQLite `holding` 약 2,205만 줄을 **모두** 읽음(서비스에 없는 도서관 줄도 SQL에서 거르지 않고 Java에서 거름). 줄마다 날짜 해석·주소 고치기 뒤 `BookGrouping.add`로 묶음 단위에 셈 | 영향 없음 | `collection/internal/importer/CollectedCatalog.java:159-200`, `CatalogImporter.java:75-79` |
| 2 | 묶기 ①② | 메모리 안, 5초 | 영향 없음 | `CatalogImporter.java:83-85` |
| 3 | 국가서지 ③ | TTL 파일(7.7GB)을 **한 스레드로 처음부터 끝까지** 읽고, ISBN 있는 기록마다 제목·저자·출판사를 정규화해 키를 만든 뒤 찾는 키와 비교. **데이터가 그대로여도 매번 다시 함** | 영향 없음 | `NationalBibliography.java:46-64,142-157` |
| 4 | 같은 글자 ④ | 메모리 안 | 영향 없음 | `CatalogImporter.java:98` |
| 5 | 책 쓰기 | 임시 표 `load_book`에 COPY, 사람은 임시 파일에 모았다가 `load_book_contributor`에 COPY | 영향 없음 | `catalog/internal/JdbcCatalogLoad.java:63-67,124-151,234-246` |
| 6 | 두 번째 읽기 + 소장 쓰기 | SQLite를 **다시 처음부터** 읽어 `load_holding`(임시 표, 색인 없음)에 COPY | 영향 없음 | `CatalogImporter.java:116-119`, `JdbcCatalogLoad.java:153-173` |
| 7 | 책 번호 정하기 (5.2) | 임시 표 `ANALYZE` → `load_holding` 약 2천만 줄과 `catalog.holding` 약 2천만 줄을 `(library_id, item_key)`로 맞대어 `load_book_id` 만듦 | 영향 없음 (읽기만) | `JdbcCatalogLoad.java:280-316` |
| 8 | 비우고 옮겨 쓰기 | `TRUNCATE` 네 표 → `INSERT … SELECT`로 책·사람·소장을 옮김. 이때 **색인을 줄마다 고침**(책 표 색인 9개, 사람 표 4개, 소장 표 3개), 외래 키 2개·`detail_url` 정규식 검사도 줄마다 | **멈춤 시작** (`TRUNCATE`가 `ACCESS EXCLUSIVE`) | `JdbcCatalogLoad.java:188-228`, `catalog/001-catalog-schema.yaml:74-92,111-124` |
| 9 | 커밋 | — | **멈춤 끝** | `JdbcCatalogLoad.java:72` |
| 10 | `VACUUM (ANALYZE)` 네 표 | 커밋 뒤 | 읽기는 됨 (10-3) | `JdbcCatalogLoad.java:82-87` |

정리 [안: 코드 읽기로 본 것]:
- **모든 단계가 차례로** 돎. 3(국가서지)은 1의 결과(찾을 키)가 있어야 비교하지만, TTL 해석(키 만들기)은 찾을 키와 상관없어서 미리 해 둘 수 있음
- **매번 다시 하는 것**: SQLite 전체 읽기 두 번, TTL 7.7GB 해석, 소장 약 2천만 줄을 두 번 씀(임시 표 → 진짜 표), 모든 색인을 줄마다 고치며 새로 채움
- 검색이 멈추는 구간은 8~9. 이 구간이 쓰기 22~27분 중 얼마인지는 재지 않음 [확인 필요]
- 지금도 임시 표 `load_*`(색인 없는 catalog 표 한 벌)를 만들기 때문에 **가져오는 동안 디스크를 이미 한 벌 가까이 더 씀** [안: 코드로 본 것, 크기 미측정]

### 10-3. 잠금에 대한 공식 사실 [확정: 공식 문서, 확인 2026-10-06]

출처: https://www.postgresql.org/docs/18/explicit-locking.html , https://www.postgresql.org/docs/18/sql-altertable.html

| 명령 | 잠금 | 검색(`SELECT`)이 기다리나 |
|---|---|---|
| `TRUNCATE`, `DROP TABLE`, `CLUSTER`, `VACUUM FULL` | `ACCESS EXCLUSIVE` | 기다림 ("Only an ACCESS EXCLUSIVE lock blocks a SELECT") |
| `ALTER TABLE … RENAME` | 문서에 예외로 적혀 있지 않으므로 `ACCESS EXCLUSIVE` ("An ACCESS EXCLUSIVE lock is acquired unless explicitly noted") | 기다림. 이름만 바꾸므로 짧음 [안] |
| `VACUUM`(FULL 아님), `ANALYZE`, `CREATE INDEX CONCURRENTLY` | `SHARE UPDATE EXCLUSIVE` | 안 기다림 |
| `ATTACH PARTITION` | 부모 `SHARE UPDATE EXCLUSIVE` + 붙이는 표 `ACCESS EXCLUSIVE` | 부모를 읽는 검색은 안 기다림 |
| `DETACH PARTITION CONCURRENTLY` | 두 트랜잭션으로 나눠 낮은 잠금. 트랜잭션 블록 안에서는 못 씀, 기본(default) 파티션이 있으면 못 씀 | 안 기다림 |

- `ACCESS EXCLUSIVE`를 기다리는 동안 그 뒤에 온 검색도 줄을 서는지(잠금 대기열)는 위 두 쪽에 적혀 있지 않음 [확인 필요]

### 10-4. 방향별 정리

#### A. 새 표에 다 쓴 뒤 바꿔 끼우기 (이름 바꾸기 / A·B 스키마)

- **무엇**: 지금 표는 그대로 두고 `holding_new`·`book_new`·`book_contributor_new`(또는 다른 스키마)에 다 쓰고, 색인·`ANALYZE`까지 끝낸 뒤 한 트랜잭션에서 이름을 바꿈. 옛 표는 지움(또는 한 번 남겨 되돌리기용)
- **줄어드는 것**: 검색 멈춤이 8~9단계 전체 → **이름 바꾸는 순간**(진행 중인 검색이 끝나길 기다리는 시간 포함) [안: 추정]. 전체 시간은 그대로이거나, D와 함께 하면 줄어듦
- **장점**
  - 쓰는 동안 검색이 옛 표를 그대로 읽음
  - 책 번호 잇기(5.2)와 잘 맞음: 맞대기 상대(옛 `catalog.holding`)가 끝까지 남아 있음
  - 되돌리기 쉬움(옛 표를 남겨 두면 이름만 다시 바꿈)
  - `TRUNCATE`·`DELETE`가 없어 옛 줄(dead tuple)이 쌓이지 않음 (사용자 뜻과 같음, `catalog-refresh.md` 5.1)
  - 새 표는 빈 상태에서 쓰므로 D-1(색인 나중에)을 그대로 쓸 수 있음. `book_id` 순으로 써 넣으면 3절의 "같은 책 줄 붙이기"도 함께 됨 [안]
- **단점·위험**
  - 색인·제약 **이름**은 스키마 안에서 하나여야 해서 표와 함께 색인·제약 이름도 바꿔야 함. Liquibase 정의와 가져오기가 만드는 표가 어긋나지 않게 할 장치 필요 [확인 필요: `CREATE TABLE … LIKE … INCLUDING ALL`의 이름 규칙]
  - 외래 키는 표 자체(이름이 아님)를 가리킴 [안: 일반 동작, 공식 문서 문장 미확인]. 지금 다른 모듈 표에서 `catalog.book`을 가리키는 외래 키는 없음 [확정: dev changelog 검색 2026-10-06]. 회원이 책을 저장하는 표가 외래 키로 `catalog.book`을 가리키게 되면 바꿔 끼울 때 함께 고쳐야 함 [안]
  - 이름을 바꾼 뒤 서비스가 준비해 둔 쿼리가 새 표를 보는지 [확인 필요]
  - 바꾸는 순간 진행 중인 대출 조회의 옛 소장 번호는 실패로 보임 (`catalog-refresh.md` 5.1 3번, 이미 알려진 것)
  - A·B 스키마 방식(서비스가 `catalog_a`/`catalog_b` 중 하나를 보게)은 이름 바꾸기 대신 보는 곳을 바꾸는 장치(검색 경로나 뷰)가 더 필요해 복잡 [안]
- **모듈 경계**: 표 만들기·바꿔 끼우기 SQL은 `catalog`(`JdbcCatalogLoad`) 안, `collection`은 지금처럼 `CatalogLoad`만 부름 → 경계 그대로 [안]
- **디스크**: 바꾸는 순간 catalog 표가 두 벌. 지금 `holding` 8,353MB + `book` 1,123MB + `book_contributor` 324MB [확정: 측정, 2026-10-05] → 최대 약 10GB 더 [안: 계산값]. 다만 지금도 임시 표 한 벌을 쓰므로 **지금보다 더 드는 것은 주로 색인만큼** [안: 추정]
- **메모리**: 바꾼 직후 새 표는 캐시에 없어 첫 검색 몇 번이 느릴 수 있음 [안]

#### B. 바뀐 것만 고치기 (차분 갱신, `MERGE`)

- **무엇**: 새 사본과 지금 표를 비교해 새 소장은 넣고, 사라진 소장은 지우고, 바뀐 칸만 고침. 도서관 단위 또는 전체. `MERGE`의 `WHEN NOT MATCHED BY SOURCE THEN DELETE`(원본에 없는 줄 지우기)는 PostgreSQL 17에서 추가 [확정: https://www.postgresql.org/docs/18/sql-merge.html , https://www.postgresql.org/docs/release/17.0/ , 확인 2026-10-06]. `MERGE` 자체가 15부터인지는 [확인 필요]
- **줄어드는 것**: 쓰기가 "바뀐 줄 수"에 비례. 검색은 줄 잠금만 만나므로 **멈추지 않음** [안]. 주간 변경량을 모르므로 얼마나 줄지 모름 [확인 필요]
- **장점**: 바뀐 게 적으면 가장 빠름. 디스크 두 벌이 필요 없음. 소장 번호(`holding.id`)도 남길 수 있어 진행 중 조회가 실패하지 않음
- **단점·위험**
  - **옛 줄이 쌓임**: `UPDATE`·`DELETE`는 옛 줄을 바로 지우지 않고, 일반 `VACUUM`은 공간을 다시 쓰게만 할 뿐 OS에 돌려주지 않음 [확정: https://www.postgresql.org/docs/18/routine-vacuuming.html]. 사용자가 피하고 싶다고 한 것 ("업데이트도 생각했지만 데드 튜플 쌓이는게 싫어서", 2026-09-30)
  - 자동 청소 기준 기본값: 50 + 0.2 × 줄 수 (최대 1억) [확정: https://www.postgresql.org/docs/18/runtime-config-autovacuum.html] → 소장 약 2,038만 줄이면 약 408만 줄이 바뀌어야 자동 청소가 돎 [안: 계산값]. 표마다 낮출 수 있음 [확정, 같은 출처]
  - 책 묶기는 **모든 도서관을 함께** 봄(`BookGrouping`: 여러 도서관의 같은 책 코드·ISBN·글자로 묶음) → 소장만 조금 바뀌어도 `book` 표의 `library_ids`·대표 제목이 바뀌어 `book` 표에도 옛 줄이 생김 [안: 코드 읽기로 본 것]
  - 3절의 `book_id` 순 정렬이 갱신마다 다시 흩어짐 (`db-memory.md` 4절)
  - 비교 SQL이 복잡해짐(칸마다 바뀌었는지)
- **책 번호 잇기**: 소장이 그대로인 책은 번호가 저절로 이어짐. 묶기가 바뀐 책만 5.2 규칙 적용 [안]
- **모듈 경계**: 비교·고치기는 catalog 표를 직접 다루므로 `catalog` 안. `collection`은 "이 도서관의 소장 목록" 단위로 넘기는 모양이 될 것 [안]

#### C. 도서관별 파티션 (`holding`을 `library_id`로 나눔)

- **무엇**: `holding`을 도서관별 LIST 파티션으로 나누고, 한 도서관만 새 표에 써서 `ATTACH`/`DETACH … CONCURRENTLY`로 갈아 끼움. 문서: 파티션을 붙이고 떼어 대량 넣기·지우기를 할 수 있고, 떼거나 `DROP`하는 것이 대량 작업보다 훨씬 빠름 [확정: https://www.postgresql.org/docs/18/ddl-partitioning.html]
- **줄어드는 것**: 한 도서관만 바꿀 때 그 도서관 줄만 씀. 검색은 멈추지 않음 [안]
- **장점**: 옛 줄이 쌓이지 않으면서(파티션째 버림) 도서관 단위로 바꿀 수 있음
- **단점·위험**
  - 소장이 있는 서비스 도서관 약 2,650곳 → 파티션 약 2,650개. 문서: 계획기는 "몇천 개까지는 대체로 잘 다룸" [확정, 같은 출처] → 경계선
  - **대출 현황 조회는 `book_id`로 모든 도서관을 읽음**(9-3 `holdingsOf`) → 파티션을 걸러 낼 수 없어 모든 파티션의 색인을 찾음 → 검색이 느려질 위험 큼 [안]
  - 고유·기본 키에 파티션 키가 들어가야 함 [확정, 같은 출처] → `holding_pkey (id)`를 바꿔야 함
  - HASH 파티션은 도서관 하나만 갈아 끼울 수 없음 [안]
  - B와 같은 이유로 `book` 표는 매번 다시 만들어야 함
  - 문서: 많은 데이터를 다시 나누는 것은 매우 느리므로 처음에 잘 정해야 함 [확정, 같은 출처]
- **판단** [안]: 지금 읽는 모양(책 번호로 모든 도서관)과 맞지 않음. 권하지 않음

#### D. 더 빨리 쓰기 (색인 나중에, 로그 줄이기)

PostgreSQL "Populating a Database" [확정: https://www.postgresql.org/docs/18/populate.html]:
- 새로 만든 표라면 COPY로 넣은 뒤 색인을 만드는 것이 가장 빠름. 이미 있는 데이터에 색인을 만드는 것이 줄마다 고치는 것보다 빠름
- 외래 키는 줄마다보다 한꺼번에 검사하는 것이 효율적. 수백만 줄이면 트리거 대기열이 메모리를 넘칠 수 있음
- `maintenance_work_mem`을 잠시 올리면 `CREATE INDEX`·`ADD FOREIGN KEY`가 빨라짐(COPY 자체에는 별 효과 없음)
- `max_wal_size`(기본 1GB [확정: https://www.postgresql.org/docs/18/runtime-config-wal.html])를 잠시 올리면 체크포인트가 줄어 빨라짐
- `wal_level=minimal`이면 같은 트랜잭션에서 만들거나 `TRUNCATE`한 표에 COPY할 때 WAL을 쓰지 않음. 단 서버 시작 때만 바꿀 수 있고, 시점 복구·복제를 못 씀 [확정, 같은 두 출처]
- 끝나면 `ANALYZE` 권장

색인 병렬 만들기 [확정: https://www.postgresql.org/docs/18/sql-createindex.html]: B-tree·GIN·BRIN이 병렬로 만들어짐. `max_parallel_maintenance_workers`로 일꾼 수를 정하고, 일꾼마다 `maintenance_work_mem`의 32MB 이상 몫이 필요. pg_bigm 색인(`gin_bigm_ops`)도 병렬로 되는지는 [확인 필요].

| 세부 방향 | 효과 [안: 추정] | 위험·비용 |
|---|---|---|
| D-1 색인·외래 키 없이 COPY → 색인 병렬 생성 → 외래 키 한 번에 | 8단계의 "줄마다 색인 고치기"를 없앰. 쓰기 단계에서 효과가 가장 클 것으로 봄 | 빈 새 표에서만 의미 있음 → **A와 함께**. 지금 방식(`TRUNCATE` 뒤 같은 표)에서 하면 색인을 만드는 동안에도 검색이 멈춤 |
| D-2 소장을 한 번만 쓰기 | 지금은 임시 표 → 진짜 표로 약 2천만 줄을 두 번 씀. 맞대기에 필요한 것은 `(library_id, item_key, 묶음)`뿐이라 **좁은 맞대기 표**만 먼저 만들고, 책 번호가 정해진 뒤 진짜(새) 표에 바로 쓰면 넓은 줄 쓰기가 한 번으로 줄어듦 | 좁은 표를 어느 읽기에서 만들지 정해야 함. 설계 사항 |
| D-3 UNLOGGED 표 | UNLOGGED는 WAL에 쓰지 않아 상당히 빠르지만, 충돌·비정상 종료 뒤 비워지고 복제되지 않음 [확정: https://www.postgresql.org/docs/18/sql-createtable.html]. 중간 표에만 맞음(지금은 임시 표를 씀) | 서비스가 읽는 표를 UNLOGGED로 두면 서버가 죽은 뒤 검색 결과가 빔. `SET LOGGED`로 바꾸는 비용은 문서에 적혀 있지 않음 [확인 필요] |
| D-4 `synchronous_commit=off` (트랜잭션마다 가능) | 커밋을 기다리지 않는 것뿐이라 **큰 트랜잭션 하나에는 거의 효과 없음** [안]. 위험은 최근 커밋 일부를 잃는 것이고 DB가 깨지지는 않음 [확정: runtime-config-wal] | — |
| D-5 가져오기 동안만 `max_wal_size`·`maintenance_work_mem` 올리기 | 체크포인트 줄임, 색인 생성 빨라짐 | 메모리 줄이기(이 사이클 목표)와 겨룸 → 가져오기 동안만 [안] |
| D-6 `wal_level=minimal` | WAL을 거의 안 씀 | 운영 백업 방식(시점 복구·복제)과 충돌, 재시작 필요. 운영 백업 방식이 정해지지 않음 [확인 필요] |
| D-7 트리거 끄기 | 외래 키 검사를 줄마다 하지 않음 | 공식 문서가 권하는 길은 D-1(외래 키 나중에). 트리거를 따로 끄는 방법은 권하지 않음 [안] |

#### E. 다시 하지 않기 (결과 남겨 두기, 안 바뀐 것 건너뛰기)

| 세부 방향 | 효과 [안: 추정] | 장점 | 단점·위험 |
|---|---|---|---|
| E-1 국가서지 해석 결과 남기기 (기록용: 판 번호 대신 원문을 남기기로 ADR-0069가 바꿈): TTL을 한 번 풀어 "키 → ISBN(애매하면 없음)"을 표나 파일로 남기고, TTL 파일·정규화 코드가 같으면 다시 씀 | 국가서지 6분 28초~8분 52초 → 남긴 결과를 읽는 시간만 [확인 필요: 결과 크기와 읽는 시간] | 데이터가 같으면 결과도 같음. 키를 만드는 일은 찾는 키와 상관없음(`NationalBibliography.java:105-114`) | **정규화 코드가 바뀌면 다시 만들어야 함** → 버전 표시(TTL 파일 이름·크기 + 정규화 버전) 필요. 남길 곳은 `collection` 쪽 [안] |
| E-2 안 바뀐 도서관 건너뛰기: 도서관마다 수집 시각(`last_full_success_at`)이 지난 가져오기와 같으면 그 도서관 줄을 다시 쓰지 않음 | 전체 다시 쓰기(A)에서는 효과 없음. B·C 같은 부분 갱신에서만 의미 | 수집 시각이 이미 있음(`CollectedCatalog.java:113-136`) | 책 묶기가 전체를 함께 보므로 "읽기"는 건너뛸 수 없음 |
| E-3 지난 묶기 결과 다시 쓰기 | 묶기가 5초뿐이라 효과 없음 | — | — |

#### F. Java 쪽 병렬·읽기 줄이기

| 세부 방향 | 효과 [안: 추정] | 장점 | 단점·위험 |
|---|---|---|---|
| F-1 국가서지 TTL 파일을 파일마다 병렬로 해석 (지금은 파일 목록을 차례로 읽음, `NationalBibliography.java:53-61`) | 코어 수만큼 줄 수 있음. 디스크 읽기가 막히면 덜 줄어듦 | 고치는 곳이 한 클래스 | 같은 키가 여러 파일에 있을 때 "애매함" 판정이 같게 나와야 함 [안]. E-1을 하면 필요가 줄어듦 |
| F-2 두 번째 SQLite 읽기 없애기: 첫 번째 읽기에서 남길 줄을 임시 파일에 써 두고 다시 읽음 | 두 번째 읽기 시간(미측정)만큼 | SQLite 읽기·주소 정리 반복이 없어짐 | 약 2천만 줄 임시 파일 디스크. 메모리 때문에 두 번 읽기를 고른 결정(ADR-0054)과 맞는지 다시 봄 [안] |
| F-3 SQL에서 먼저 거르기: 서비스에 없는 도서관 줄과 지운 줄을 `WHERE`로 뺌 | 첫 가져오기 기준 서비스에 없는 줄 1,467,650 / 22,051,238 ≈ 7% 줄어듦 [안: 계산값] | 간단 | 건너뜀 이유 셈(보고서)을 따로 해야 함 |
| F-4 SQLite를 여러 연결로 나눠 읽기 | 모름 | — | 묶기가 한 스레드 전제(`BookGrouping` 맵). 병목이 SQLite인지 Java 정규화인지 아직 모름 [확인 필요] |

#### G. 가져오기만 쓰는 고유 색인 `holding_library_item_key` 없애기

- **무엇**: 이 색인(1,075MB [확정: 측정])은 서비스가 쓰지 않고 가져오기의 맞대기에만 씀(9-3). 없애고 고유함은 가져오기에서 검사
- **효과**: 8단계에서 고칠 색인이 하나 줄고, 디스크·메모리 약 1GB 줄어듦 [안: 추정]
- **위험**: 약 2천만 대 2천만 맞대기가 색인 없이 얼마나 걸리는지 모름(지금도 색인 대신 해시 조인일 수 있음) [확인 필요]. 같은 (도서관, 책 코드)가 두 번 들어가는 것을 DB가 막아 주지 않음(수집 DB에서는 고유함 [확정: `BookGrouping.java:74` 주석]). A를 하면 맞대기 상대는 옛 표이므로, "없애기"보다 "새 표에서 나중에 만들기"(D-1)가 나을 수 있음 [안]

#### H. 다른 DB·인스턴스에서 가져온 뒤 옮기기 (`pg_dump`/`pg_restore`, 논리 복제)

- **무엇**: 따로 띄운 DB에서 가져오기를 마치고 결과를 서비스 DB로 옮김. `pg_restore --jobs`는 데이터 넣기·색인 만들기를 여러 세션으로 동시에 하며, custom·directory 형식에서만 되고 `--single-transaction`과 함께 못 씀 [확정: https://www.postgresql.org/docs/18/app-pgrestore.html]
- **판단** [안]: **지금 규모에는 지나침.** 옮기는 단계(덤프 + 복원 + 색인)가 결국 서비스 DB에서 A+D와 같은 일을 다시 함. 서버도 한 대. 운영 서버가 작아서 가져오기 부하를 서비스 DB에서 떼어 내야 할 때 다시 봄

### 10-5. 한눈에 비교

| 방향 | 줄어드는 시간 | 검색 멈춤 | 장점 | 단점 | 크기 |
|---|---|---|---|---|---|
| 지금 | — (36~41분) [확정: 측정] | 8~9단계 내내 (길이 미측정) | 단순 | 매번 전부, 소장 두 번 쓰기 | 임시 표 한 벌 더 |
| A 새 표 + 이름 바꾸기 | 전체는 비슷 [안: 추정] | **이름 바꾸는 순간만** [안] | 옛 줄 없음, 되돌리기 쉬움, 5.2와 맞음 | 색인·제약 이름 맞추기, Liquibase와 같게 유지 | 바꾸는 동안 두 벌 (지금보다 색인만큼 더) [안: 추정] |
| B 차분 갱신 (`MERGE`) | 변경량에 비례 (변경량 미측정) | 없음 [안] | 바뀐 게 적으면 가장 빠름 | **옛 줄 쌓임**, 책 표도 바뀜, 정렬 흩어짐 | 한 벌 + 옛 줄 |
| C 도서관별 파티션 | 한 도서관만 바꿀 때 큼 [안: 추정] | 없음 [안] | 옛 줄 없이 부분 교체 | 책 번호로 읽는 조회가 모든 파티션을 봄, 키 바꿈 | 한 벌 |
| D 색인 나중에 등 | 쓰기 단계의 상당 부분 [안: 추정] | A와 함께면 없음 | 공식 문서 권장 | 혼자 쓰면 색인 만드는 동안 멈춤 | 가져오기 동안 `maintenance_work_mem`↑ |
| E-1 국가서지 결과 남기기 | 6분 28초~8분 52초 중 대부분 [안: 추정] | 영향 없음 | 간단, 결과 같음 | 정규화 코드가 바뀌면 다시 | 결과 파일·표 (크기 미측정) |
| F 병렬·읽기 줄이기 | 국가서지·두 번째 읽기 일부 [안: 추정] | 영향 없음 | 코드만 고침 | 병목 미확인, 묶기는 한 스레드 전제 | 임시 파일(F-2) |
| G 고유 색인 없애기 | 색인 하나만큼 [안: 추정] | — | 약 1GB 줄어듦 | 맞대기가 느려질 수 있음, DB가 중복을 막지 않음 | 약 −1GB |
| H 다른 DB에서 | 없음 또는 늘어남 [안] | 옮길 때 | 서비스 DB 부하 분리 | 지나침 | DB 두 벌 |

### 10-6. 고를 수 있는 조합 [안]

단순한 것부터:

1. **안 1 — A + D-1**: 새 표에 색인 없이 쓰고, 색인·외래 키·`ANALYZE`를 마친 뒤 이름 바꾸기. 사용자가 처음 말한 방향. 검색 멈춤(완료 기준 "가져오기를 돌리는 동안 첫 화면에서 책을 검색하면 결과가 나온다")을 바로 풂. 새 표에 `book_id` 순으로 써 넣으면 3절 정렬도 함께 됨. 전체 시간은 크게 줄지 않을 수 있음
2. **안 2 — 안 1 + E-1 (필요하면 F-1)**: 국가서지를 매번 다시 해석하지 않아 전체 시간이 6~9분 줄 것으로 봄 [안: 추정]. 고치는 곳이 `collection` 안에 머묾
3. **안 3 — 안 2 + D-2 / F-2 / F-3 / G 중 잰 결과로 고름**: 10-7의 단계별 시간을 잰 뒤 가장 오래 걸리는 곳만 고침

- B(차분)·C(파티션)는 지금 권하지 않음: B는 옛 줄이 쌓이고(사용자가 피하려던 것), C는 지금 읽는 모양과 맞지 않음. 도서관별 자동 갱신(사이클 09 후보)이 생기면 주간 변경량을 잰 뒤 B를 다시 봄
- H는 지나침

### 10-7. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 쓰기 22~27분의 단계별 시간(두 번째 읽기, 임시 표 COPY, 맞대기, `TRUNCATE`~커밋, `VACUUM`)과 그중 검색이 멈춘 시간 | 프로토타입 (dev가 단계마다 시간 로그를 넣고 같은 사본으로 다시 가져옴) |
| 첫 번째 읽기의 병목이 SQLite인지 Java 정규화인지 | 프로토타입 (아무 일도 안 하는 sink로 읽기만 잼) |
| `ALTER TABLE … RENAME`을 기다리는 동안 뒤에 온 검색도 줄을 서는지, `lock_timeout`으로 막을 수 있는지 | 공식 문서 확인 (`runtime-config-client` `lock_timeout`), 프로토타입 |
| 이름을 바꾼 뒤 서비스(JDBC·Hikari)가 준비해 둔 쿼리가 새 표를 보는지 | 프로토타입 |
| 외래 키가 이름이 아니라 표 자체를 가리키는지 | 공식 문서 확인, 프로토타입 |
| `CREATE TABLE … LIKE … INCLUDING ALL`로 만든 색인·제약 이름 규칙, 바꿔 끼운 뒤 Liquibase 정의와 같은지 확인하는 방법 | 공식 문서 확인 (`sql-createtable` LIKE), 프로토타입 |
| pg_bigm(`gin_bigm_ops`) 색인이 병렬로 만들어지는지, 색인을 나중에 만들면 쓰기가 얼마나 줄어드는지 | 프로토타입 (`max_parallel_maintenance_workers`, `maintenance_work_mem` 단계별) |
| `ALTER TABLE … SET LOGGED`의 비용(표 전체를 WAL에 쓰는지) | 공식 문서에 없음 → 프로토타입 (WAL 양 측정) |
| `MERGE`가 PostgreSQL 15부터인지 | 공식 문서 확인 (15 릴리스 노트) |
| 운영 DB의 백업 방식(시점 복구·복제) → `wal_level=minimal`을 쓸 수 있는지 | 사용자에게 질문 |
| 주간 소장 변경량 (B를 다시 볼 때) | 프로토타입 (사본 두 개의 `(library, item_key)` 차이 셈) |
| 국가서지 결과(키 → ISBN)의 크기와 다시 읽는 시간 | 프로토타입 |
| `holding_library_item_key` 없이 맞대기 시간 | 프로토타입 (`EXPLAIN (ANALYZE, BUFFERS)`) |
| 바꿔 끼우는 동안 디스크 최대 사용량, 지금 임시 표 크기 | 프로토타입 (가져오기 중 `pg_database_size`·`pg_total_relation_size` 기록) |
