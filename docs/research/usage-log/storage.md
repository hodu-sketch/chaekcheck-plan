# 검색·도서관 클릭 기록을 어디에 저장할까 (사이클 15 준비 조사)

- 작성: 2026-10-12. 사용자: "사용자가 검색을 하거나 도서관 페이지를 클릭할 때 정보를 기록해서 나중에 통계에 쓸까 해", "통계는 다음이고 지금은 기록이야", "어디에 저장할지부터 좀 조사를 해줘"
- 사이클 15가 될 일입니다 [확정: 번호만] (사용자: "이거는 15가 될건데 파악만 해줘"). 사이클 12·13·14는 dev에서 따로 개발 중입니다
- 여기에는 조사와 방법만 적습니다. 모듈·표·API는 사이클 15의 `/design-delta`에서 정합니다
- 외부 사실은 공식 문서로 확인했습니다 (확인 2026-10-12)
- **2026-10-13~14에 바뀐 것** (이 문서는 2026-10-12 조사 기록이라 본문은 그대로 둠, 지금 기준은 [사이클 15 spec.md](../../cycles/15-usage-log/spec.md)): 클릭 알림은 `sendBeacon` 대신 `fetch` keepalive + CSRF(spec R2-1), IP를 남김 — 30일 뒤 비움(spec R1-5, [ADR-0096](../../adr/0096-usage-log-storage-and-fields.md)), 로그인 쿠키가 검색 주소로도 감(`/api/v1`, [ADR-0102](../../adr/0102-access-cookie-api-v1-and-login-status-reader.md)). 아래 4·6절의 IP·sendBeacon 문장은 당시 결정입니다

## 1. 지금 코드 상태 (dev, 2026-10-12 읽음)

### 1.1 검색

- 검색 요청은 모두 GET이고 로그인 없이 됩니다 [확정] (dev `SecurityConfiguration.java:47-48,74`, `/api/v1/me/**`만 로그인 필요)
- 검색 요청에는 회원 정보가 실리지 않습니다 [확정]. 로그인 쿠키 `access_token`의 경로가 `/api/v1/me`라서 브라우저가 검색 주소로는 쿠키를 보내지 않습니다 (`AuthCookies.java:9`). 로그인 기능 자체도 기본은 꺼져 있습니다 (`application.yml:54`)
- 거주지·직장 지역, 고른 도서관은 브라우저 localStorage에 두고 검색할 때마다 주소 값으로 보냅니다 [확정] (`regionStorage.ts:21`, `chosenLibraryStorage.ts:17`)
- "검색 한 번"이 서버에 들어오는 입구는 두 가지입니다 [확정]
  - 수집 목록 검색: `GET /api/v1/books` (`catalog` 모듈, `BookSearchController.java:37-42`). 값: `title`·`author`·`publisher`, `exact`, `roles`, `sort`, `page`, `scope`, `visit`, `libraryIds`, `residenceRegionIds`, `workRegionIds`
  - 도서관에서 직접 찾기: `GET /api/v1/ebook-searches/stream` (`availability` 모듈, SSE). 같은 검색 조건과 `filter`
  - 이어지는 요청(다음 묶음 `…/batches/stream`, 대출 수 `…/book-availabilities/stream`, 책 상세 `/api/v1/books/{bookId}`)은 같은 검색의 뒷부분이라 "검색 한 번"으로 세지 않습니다 [확정] (사용자 승인, 2026-10-12, 6절 2)

### 1.2 도서관으로 넘어가는 클릭

- 서버는 지금 클릭을 전혀 모릅니다 [확정]. 모두 `<a href target="_blank">`로 새 탭에서 바로 전자도서관 사이트로 갑니다
- 클릭할 수 있는 곳 [확정]:
  1. 결과 카드 전체 (`ResultRow.tsx:184-190`): 책 상세 주소, 없으면 도서관 검색 주소
  2. 도서관 이름 팝오버의 가입 링크 (`ResultRow.tsx:97`)
  3. "전자도서관에서 가입 안내 보기" (`ResultRow.tsx:107`)
  4. "도서관 첫 화면" (`ResultRow.tsx:63`, 조사 안내가 있는 도서관만)
  5. 도서관 로고 (`LibraryLogo.tsx:35`, 결과 줄과 내 도서관 화면)
  6. 도서관 요약 막대의 이름 (`LibrarySummaryBar.tsx:127`)
- 결과 줄은 수집 목록 검색, 직접 찾기, 책 페이지, 사서 추천(옛 인기 도서) 창에서 같은 부품을 씁니다

### 1.3 이미 있는 기록

- 분석 스크립트(GA, Umami 등) 없음, 요청 기록 필터 없음 [확정]. nginx는 기본 접속 기록만 (`deploy/nginx/*`에 `access_log` 설정 없음)
- 서버는 IP를 저장하지 않습니다. nginx 요청 수 제한에만 씁니다 [확정] (`rate-limits.conf:15,20`)
- 실행 기록 표는 있습니다: `collection.catalog_import`, `popular.fetch_run` [확정]
- 개인정보 처리방침 초안(`legalText.ts`, 아직 검토 전)에는 접속·검색 기록, IP, 쿠키 이야기가 없습니다 [확정]

### 1.4 DB와 서버

- PostgreSQL 18 + pg_bigm, 모듈마다 schema 하나 (`region`, `library`, `catalog`, `auth`, `modulith`, `mylibrary`, `collection`, `popular`) [확정]
- 배포: EC2 한 대(t4g.medium, 2 vCPU·4GiB, gp3 40GiB)에 nginx·서비스·DB를 Docker로 [확정] (`docs/research/deploy/aws-layout.md` 32·96행). DB 컨테이너 상한 1GB, DB 크기 약 8.5GiB, 가져오기 중 최대 19.1GiB

## 2. 저장할 곳 후보

### 2.1 같은 PostgreSQL에 기록 표 (새 schema)

- 추가만 하는 표 하나 또는 둘. 지금 구조(모듈마다 schema)를 그대로 따름
- 시간 범위로 나누기(파티션): `PARTITION BY RANGE`로 달마다 나누면, 오래된 달은 `DROP`·`DETACH PARTITION … CONCURRENTLY`로 통째로 지울 수 있어 대량 `DELETE`의 청소(VACUUM) 부담이 없습니다 [확정] (https://www.postgresql.org/docs/current/ddl-partitioning.html, 확인 2026-10-12). 공식 문서는 이 이점이 표가 매우 클 때, 대략 서버 메모리보다 클 때 의미가 있다고 합니다 [확정] (같은 주소) → 처음에는 나누지 않고 시작해도 됨 [안]
- 시각 칸 색인: BRIN은 들어온 순서대로 커지는 날짜 칸에 맞고 색인이 매우 작습니다 [확정] (https://www.postgresql.org/docs/current/brin.html, 확인 2026-10-12)
- 검색 조건처럼 모양이 바뀔 수 있는 값은 `jsonb`가 있습니다. 공식 문서는 대부분 `jsonb`를 쓰라고 권합니다 [확정] (https://www.postgresql.org/docs/current/datatype-json.html, 확인 2026-10-12)
- 같은 DB 안 schema끼리는 권한만 있으면 한 쿼리에서 묶어 볼 수 있습니다 [확정] (https://www.postgresql.org/docs/current/ddl-schemas.html, 확인 2026-10-12). 자원(메모리·디스크)은 운영 DB와 같이 씁니다
- 크기 어림: 기록 한 줄 0.3~0.5KB, 하루 1만 건이면 하루 3~5MB, 1년 1~2GB [안] (이용자 수를 모르므로 어림. 실제는 운영 뒤 측정 [확인 필요: 운영 측정])

### 2.2 직접 설치하는 분석 도구

| 도구 | 저장소 | 라이선스 | 우리 서버(4GiB)에 대한 부담 | 출처 (확인 2026-10-12) |
|---|---|---|---|---|
| Umami | PostgreSQL 12.14 이상 (MySQL은 v3에서 지원 끝) | MIT | Node.js 서비스 하나가 더 돎 | https://docs.umami.is/docs/install , https://docs.umami.is/docs/guides/migrate-mysql-postgresql |
| PostHog | ClickHouse·Postgres·Redis·Kafka 등 | MIT (Compose판) | 공식 미지원, 최소 4 vCPU·16GB RAM → 맞지 않음 | https://posthog.com/docs/self-host |
| Plausible CE | ClickHouse | AGPLv3 | RAM 2GB 이상 권장 → 맞지 않음 | https://github.com/plausible/community-edition |
| Matomo | MySQL 8.0+ / MariaDB 10.6+ (PostgreSQL 없음) | GPL v3+ | PHP·MySQL을 따로 돌려야 함 | https://matomo.org/faq/on-premise/matomo-requirements/ |

- 이 도구들은 "몇 명이 어느 페이지를 봤나" 같은 웹 분석용이라, 검색 조건·도서관 번호처럼 우리 데이터와 맞춰 보는 통계에는 결국 따로 꺼내 붙여야 합니다 [안]

### 2.3 외부 분석 서비스

- GA4: 개별 이벤트 데이터 보관은 Standard에서 2개월 또는 14개월 [확정] (https://support.google.com/analytics/answer/7667196, 확인 2026-10-12). BigQuery로 내보내기는 하루 100만 이벤트까지 [확정] (https://support.google.com/analytics/answer/9358801, 확인 2026-10-12)
- PostHog Cloud: 서버 위치는 미국·EU(프랑크푸르트)뿐 [확정] (https://posthog.com/docs/privacy/data-storage, 확인 2026-10-12). 무료 월 100만 이벤트·보관 1년 [확인 필요: 가격 페이지 본문 직접 확인]
- 둘 다 국외 이전이 되어 처리방침에 적을 것이 늘어납니다 (`aws-layout.md` 56행에도 같은 지적). 한국에서 쿠키 동의 창이 필요한지는 확인하지 못했습니다 [확인 필요: PIPC 문서 또는 전문가 질의]

### 2.4 로그 파일 → S3 → Athena

- 서비스가 JSON 한 줄씩 기록 파일에 쓰고 S3로 옮긴 뒤 Athena로 SQL 조회. Athena는 S3 파일을 바로 SQL로 읽고 실행한 쿼리만큼 비용을 냅니다 [확정] (https://docs.aws.amazon.com/athena/latest/ug/what-is.html, 확인 2026-10-12). JSON은 한 줄에 하나씩이어야 합니다 [확정] (https://docs.aws.amazon.com/athena/latest/ug/json-serde.html)
- CloudWatch Logs는 기본 무기한 보관, 로그 그룹마다 기간 설정 [확정] (https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html)
- 운영 DB와 완전히 떨어지지만, 옮기는 길을 따로 만들어야 하고 아직 S3를 쓰지 않습니다 (S3·CloudFront는 나중 [확정], `aws-layout.md` 32행)

### 2.5 ClickHouse 같은 분석 전용 DB

- 열 단위로 저장해 큰 집계가 빠른 DB [확정] (https://clickhouse.com/docs/intro, 확인 2026-10-12). 지금 규모에는 과하다고 봅니다 [안]

### 2.6 JSONL 파일 기록 (사용자 질문, 2026-10-12)

사용자: "나는 jsonl 파일 기록도 생각하고 있어 각각의 장단점에 대해서 구체적으로 알려줘 그리고 지금 서비스에 맞는가"

- Spring Boot 4.1.1은 구조화 로그를 지원: `logging.structured.format.file`에 `ecs`·`gelf`·`logstash` 또는 직접 만든 형식. 파일로 쓰려면 `logging.file.name`/`logging.file.path` 필요, 기본 10MB마다 교체, `max-history` 기본 7 [확정] (https://docs.spring.io/spring-boot/reference/features/logging.html, 확인 2026-10-12)
- Logback `SizeAndTimeBasedRollingPolicy`: `maxHistory` 기본 0(지우지 않음), `totalSizeCap` 기본 0(제한 없음) [확정] (https://logback.qos.ch/manual/appenders-rolling.html). `immediateFlush` 기본 true [확정] (https://logback.qos.ch/manual/appenders.html)
- Logback `AsyncAppender`: `queueSize` 256, 남은 칸 20% 이하이면 TRACE/DEBUG/INFO를 버림, `neverBlock` 기본 false(가득 차면 요청 스레드가 기다림), 종료 때 `maxFlushTime`까지만 기다림 [확정] (https://logback.qos.ch/manual/appenders-async-sift.html)
- Docker 기본 `json-file` 드라이버는 기본으로 교체하지 않음(`max-size` -1) [확정] (https://docs.docker.com/engine/logging/drivers/json-file/) → 표준 출력으로 남기면 디스크가 계속 참. 파일은 컨테이너 밖 폴더에
- 나중에 보기: DuckDB `read_json`(`format='newline_delimited'`), 여러 파일·`.json.gz` 한 번에 [확정] (https://duckdb.org/docs/current/data/json/loading_json.html). PostgreSQL `COPY` text 형식은 백슬래시를 특별하게 다뤄 JSON 줄을 그대로 넣는 방법은 [확인 필요: 시험] (https://www.postgresql.org/docs/current/sql-copy.html)
- 서버가 갑자기 꺼질 때 파일 끝이 얼마나 빠지는지 Logback 문서에 없음 [확인 필요: 시험]

| | DB 기록 칸 | JSONL 파일 |
|---|---|---|
| DB 부담 | 작음 (2.7) | 없음 |
| 바로 보기 | SQL, 도서관 정보와 같이 | DuckDB로 보거나 DB로 옮겨 넣어야 함 |
| 잃을 수 있는 것 | 비동기 커밋 시 마지막 약 0.6초, DB 손상 없음 | 파일 끝부분 [확인 필요], 서버를 새로 만들면 옮겨 두지 않은 파일 |
| 1년 뒤 지우기 | 정기 삭제 작업 | `maxHistory` 설정 |
| 백업 | DB 백업에 포함 | 따로 |
| Docker | 지금 그대로 | 컨테이너 밖 폴더 연결 |

### 2.7 DB에 남길 때 부담 (사용자 질문, 2026-10-12)

사용자: "db가 가장 걱정되는게 db에 부담이 될까 트랜잭션 걱정이야 실제 서비스 되는거에 램에 많이 영향을 줄까?"

- 잠금: INSERT는 ROW EXCLUSIVE, SELECT는 ACCESS SHARE로 서로 충돌하지 않음 [확정] (https://www.postgresql.org/docs/current/explicit-locking.html, 확인 2026-10-12)
- 트랜잭션: 여러 줄은 한 트랜잭션으로, 행마다 커밋하면 행마다 일이 많음 [확정] (https://www.postgresql.org/docs/current/populate.html). `SET LOCAL synchronous_commit TO OFF`로 그 트랜잭션만 비동기 커밋 가능, 크래시 때 최근 트랜잭션 일부만 잃고 손상 없음, 최대 구간은 `wal_writer_delay`(기본 200ms)의 3배 [확정] (https://www.postgresql.org/docs/current/wal-async-commit.html, https://www.postgresql.org/docs/current/runtime-config-wal.html)
- 연결: HikariCP 기본 `maximumPoolSize` 10, `connectionTimeout` 30초 [확정] (https://github.com/brettwooldridge/HikariCP). dev 설정에 덮어쓴 값 없음 (dev `application.yml`, 2026-10-12 확인)
- 검색 쪽(`catalog`·`availability`)에는 `@Transactional`이 없음 (dev 2026-10-12 확인) → 기록을 검색 요청 안에서 넣으면 검색과 연결을 다툼
- 메모리: `work_mem`은 정렬·해시용(기본 4MB) [확정] (https://www.postgresql.org/docs/current/runtime-config-resource.html). 단순 INSERT가 쓰지 않는다는 문장은 없음 [확인 필요: 시험]. 표 끝에만 붙으므로 공유 버퍼에는 마지막 몇 쪽만 [안]
- autovacuum: 넣기만 하는 표도 `autovacuum_vacuum_insert_threshold` 1000 + `scale_factor` 0.2 기준으로 정리, 페이지를 all-visible로 표시하고 동결 [확정] (https://www.postgresql.org/docs/current/runtime-config-autovacuum.html, https://www.postgresql.org/docs/current/routine-vacuuming.html)
- Spring Modulith 이벤트로 기록하면 이벤트마다 `event_publication`에 INSERT + 완료 UPDATE/DELETE가 더 생김(기록 한 줄에 쓰기 세 번) [확정]. 지금 쓰는 곳은 회원 탈퇴(`AccountDeleted`) 하나 (dev 2026-10-12 확인) (https://docs.spring.io/spring-modulith/reference/events.html) → 기록에는 쓰지 않음 [안]
- Hibernate는 IDENTITY 키 엔티티의 INSERT를 묶지 못함 [확정] (https://docs.hibernate.org/orm/current/userguide/html_single/Hibernate_User_Guide.html) → 묶어 넣기는 JDBC 배치나 여러 줄 INSERT로 [안]
- 서비스 메모리: 모아 두는 동안 1,000줄 × 0.5KB ≈ 0.5MB [안] (힙 512MB)
- 조건 [안]: 검색 응답과 떨어져서 쓰기, 몇 초마다 묶어 한 트랜잭션, 기록 트랜잭션만 비동기 커밋

### 2.8 다른 서비스들은 어디에 저장하나 (사용자 질문, 2026-10-12)

사용자: "이거 보통 어디에 저장해? 이런 서비스에서는? 유명한 사이트들 정보 알려줘". 각 회사가 직접 낸 글만 (확인 2026-10-12)

| 회사 | 저장 경로 | 규모·계기 | 출처 |
|---|---|---|---|
| Plausible | PostgreSQL → 2020-05 ClickHouse [확정] | 그래프 5~6초, 큰 고객 감당 못 함 → 이전 뒤 약 500ms [확정] | https://plausible.io/blog/may-2020-recap |
| PostHog | Postgres → 이벤트는 ClickHouse, 회원·설정은 Postgres [확정] | "월간 활성 사용자 1만 명을 넘기 어렵다", 옮기는 동안 두 곳에 넣음 [확정] | https://posthog.com/blog/clickhouse-announcement , https://posthog.com/blog/how-we-turned-clickhouse-into-our-eventmansion |
| Umami | PostgreSQL 12.14+ 하나 [확정] | — | https://github.com/umami-software/umami |
| Snowplow | 웨어하우스(Snowflake·BigQuery·Redshift·Databricks). Postgres Loader는 "not recommended for production use, especially with large data volumes" [확정] | — | https://docs.snowplow.io/docs/pipeline-components-and-applications/loaders-storage-targets/snowplow-postgres-loader/ |
| GitLab | Snowplow 자체 운영 → S3 [확정] | 숫자 없음 | https://handbook.gitlab.com/handbook/enterprise-data/platform/snowplow/ |
| Spotify | Event Service → Pub/Sub → GCS → BigQuery [확정] | 하루 5,000억 건 (2019) [확정] | https://engineering.atspotify.com/2019/11/spotifys-event-delivery-life-in-the-cloud |
| Pinterest | Singer → Kafka → S3 [확정] | 피크 초당 4,000만 건 이상 (2020) [확정] | https://www.confluent.io/blog/running-kafka-at-scale-at-pinterest/ |
| 우아한형제들 | 2017 JSON 스키마로 적재, 2023 이벤트 로그 → 1시간마다 Hive, 2024 추천용 Kafka → Flink → MongoDB(TTL) [확정] | 숫자 없음 | https://techblog.woowahan.com/2536/ , https://techblog.woowahan.com/9935/ , https://techblog.woowahan.com/17383/ |
| 쏘카 | 서버 로그 MSK → GCS → BigQuery [확정] | 지연 1~2시간 → 약 3분 [확정] | https://tech.socar.kr/data/2025/02/26/log-pipeline-revamp |

- 당근·29CM·Netflix·Airbnb(Medium 블로그 접속 거부)와 리디는 열지 못함 [확인 필요]. 토스·카카오·네이버·오늘의집은 행동 로그 저장 공식 글을 찾지 못함
- 경향 [안]: 작은 분석 서비스는 PostgreSQL로 시작해 집계가 느려지면 기록만 분석 전용 DB로 옮김(회원·설정은 Postgres에 남김). 하루 수천억 건 규모는 큐(Kafka·Pub/Sub) → 객체 저장소 → 웨어하우스. Kafka는 사용자가 요청하기 전까지 쓰지 않음 (dev `CLAUDE.md`, plan `scope-guard.md`)

### 2.9 서버 메모리 4GB에서 (사용자 질문, 2026-10-12)

사용자: "근데 나는 aws 크라우드 뭐든 램 4gb로 할건데 그게 걱정되어서"

- 4GB 나눠 쓰기는 `docs/research/deploy/aws-layout.md` 6절: 서비스 힙 상한 512MB(측정 Java 전체 350MB, 로컬 PC), DB 컨테이너 상한 1GB·`shared_buffers` 64MB, 조회 서버·OS 재지 않음, 나머지는 파일 캐시 [확정: 값은 그 문서 기준]
- 기록을 DB에 남겨도 바뀌는 상한 없음: 연결 10개(HikariCP 기본), 공유 버퍼 고정, 컨테이너 상한 고정 [안]. 서비스 쪽 모으기 약 0.5MB [안]
- 파일 캐시: 기록 칸은 끝에만 붙어 최근 몇 쪽만 올라옴, 책·소장 파일이 밀려나는 양은 작다고 봄 [확인 필요: 사이클에서 기록 켜기 전·후 `docker stats`·캐시 적중률 측정]
- 디스크: 1년 1~2GB [안]. 반영 때 책 표 두 벌(약 16GB) 계산에 더함
- JSONL도 OS 파일 캐시를 써서 메모리 면 차이는 거의 없다고 봄 [안]
- 메모리가 문제 되는 때는 통계 집계(정렬·해시는 `work_mem`) → 통계 사이클에서 하루치 미리 합치기 등을 함께 정함 [안]

## 3. 브라우저에서 클릭을 서버로 보내는 방법

외부 링크는 새 탭으로 바로 넘어가므로, 클릭을 남기려면 브라우저가 따로 알려야 합니다.

| 방법 | 내용 | 출처 (확인 2026-10-12) |
|---|---|---|
| `navigator.sendBeacon` | 분석 데이터용 POST, 화면 이동을 늦추지 않음, 64 KiB까지, 서버 응답은 못 받음 | https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon |
| `fetch(…, {keepalive: true})` | 페이지가 닫혀도 요청 유지, 64 KiB까지, 응답 받을 수 있음 | https://developer.mozilla.org/en-US/docs/Web/API/RequestInit |
| `<a ping>` | 링크를 따라가면 지정 주소로 POST. Firefox는 설정을 켜야 동작 | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a |
| 우리 서버를 거쳐 이동 | 우리 주소 → 302 → 전자도서관. 서버가 확실히 앎. 공식 표준 문서는 못 찾음 [확인 필요] | — |

- 화면과 API가 같은 주소(ADR-0042)라 `sendBeacon`이 같은 사이트로 가서 쿠키·CORS 문제가 없습니다 [안]
- 광고 차단 프로그램이 `sendBeacon`이나 분석 주소를 막을 수 있어 일부 클릭은 빠질 수 있습니다 [확인 필요: 프로토타입]
- 서버를 거쳐 이동하면 빠짐이 없지만, 링크 주소가 우리 주소로 바뀌고 넘어갈 때 한 번 더 왕복합니다 [안]

## 4. 개인정보 (법 조문 기준)

- 개인정보 보호법: 법률 제21445호, 2026-09-11 시행 [확정] (https://www.law.go.kr/법령/개인정보보호법, 확인 2026-10-12)
- 제2조 제1호: 그것만으로 사람을 알아볼 수 없어도 다른 정보와 쉽게 결합해 알아볼 수 있으면 개인정보 [확정]
- 제58조의2: 더 이상 개인을 알아볼 수 없는 정보에는 이 법을 적용하지 않음 [확정]
- 제3조: 목적에 필요한 최소한만 수집, 목적 외 사용 금지, 처리방침 공개 [확정]
- 제21조: 보유기간이 지나면 지체 없이 파기 [확정]
- 제30조 제1항: 처리방침에 처리 목적, 보유 기간, 파기 방법, 그리고 제7호 "인터넷 접속정보파일 등 개인정보를 자동으로 수집하는 장치의 설치·운영 및 그 거부에 관한 사항"을 적어야 함 [확정]
- 제28조의2: 통계작성 등에는 동의 없이 가명정보 처리 가능 [확정]
- PIPC 2024-01-31 행태정보 정책 방안: 개인을 알아보지 않는 행태정보는 동의 없이 처리할 수 있는 방향, 다만 쌓이고 결합되며 알아볼 수 있게 되지 않도록 [확정] (https://www.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS074&mCode=C020010000&nttId=9888, 확인 2026-10-12). 맞춤형 광고 대상이라 서비스 통계에 그대로 적용되는지는 [확인 필요: 전문가 질의]
- IP 주소·쿠키 식별값이 개인정보인지 PIPC가 명시한 대목은 찾지 못함 [확인 필요: PIPC 해석 사례집 원문 또는 질의]
- 서비스 개선 통계에 동의가 필요한지, 처리방침 공개로 충분한지 법 조문만으로는 단정 못함 [확인 필요: PIPC 처리방침 작성지침 원문 또는 전문가 질의]

정리하면, **회원 번호·IP·브라우저 식별값을 남기지 않고 검색 조건과 도서관 번호만 남기면** 개인을 알아볼 수 없는 기록에 가까워져 위 확인 필요 항목의 부담이 가장 작습니다 [안]. 검색어 자체에 이름 같은 개인정보가 들어갈 수는 있습니다(예: 저자 칸에 자기 이름) [안].

## 5. 방향 (안 1 승인, 2026-10-12, 6절)

| 안 | 내용 | 좋은 점 | 아쉬운 점 |
|---|---|---|---|
| **1 (추천)** | 같은 PostgreSQL에 새 schema 기록 표. 검색은 서버가 요청을 받을 때 바로 남기고, 클릭은 브라우저가 `sendBeacon`으로 우리 서버에 알림 | 새 프로그램 없음, 도서관 표와 바로 맞춰 볼 수 있음, 지금 구조(Modulith·Liquibase) 그대로 | 운영 DB 디스크·메모리를 같이 씀, 이용이 많아지면 나누기·옮기기 필요 |
| 2 | Umami를 같은 서버에 설치(같은 PostgreSQL) | 화면 방문 통계 화면이 바로 생김 | Node 서비스 추가(4GiB 서버), 검색 조건 통계는 결국 따로 |
| 3 | GA4 | 설치·운영 부담 없음 | 국외 이전, 개별 기록 최대 14개월, 우리 데이터와 맞춰 보기 어려움, 동의 창 문제 |
| 4 | JSON 기록 파일 → S3 → Athena | 운영 DB와 완전히 분리 | 옮기는 길을 새로 만듦, 아직 S3 안 씀, 바로 보기 어려움 |

- 안 1에서 나중에 이용이 많아지면 같은 표를 달마다 나누거나(2.1), 기록만 다른 DB로 옮기는 길이 있습니다 [안]

## 6. 결정 (2026-10-12, 결정 페이지 `easy/2026-10-12-storage-decisions.html`)

1. 저장할 곳: 같은 PostgreSQL에 새 schema 기록 칸 (5절 안 1) [확정] (사용자 승인, 2026-10-12). 승인 전에 사용자가 물은 것: JSONL 비교(2.6), DB 부담(2.7), 다른 서비스(2.8), 4GB 메모리(2.9). 쓰는 방식 조건(검색 응답과 떨어져서, 몇 초마다 묶어 한 트랜잭션, 기록 트랜잭션만 비동기 커밋, Modulith 이벤트 안 씀)은 [안]으로 사이클 15 설계에서 정함
2. "검색 한 번"은 처음 검색 요청만 한 줄로 남김(다음 묶음·대출 수·다음 쪽은 남기지 않음), 수집 목록 검색과 직접 찾기 둘 다 [확정] (사용자 승인, 2026-10-12). 덧붙임 (사용자: "검색 요청을 한 사용자의 정보도 남겼으면 해 지역(직장/거주) 도서관 .. 이런거라던가"): 검색할 때 함께 오는 거주 지역·직장 지역·고른 도서관·범위(`residenceRegionIds`, `workRegionIds`, `libraryIds`, `scope`, `visit`)도 같은 줄에 남김 [확정] (사용자 승인, 2026-10-12). 이 값들은 이미 검색 요청에 실려 오므로 회원 번호 없이 남길 수 있음
3. 클릭: 링크는 그대로 새 탭으로 열고, 브라우저가 (2026-10-13 바뀜: `fetch` keepalive, 사이클 15 spec R2-1) `sendBeacon`으로 "이 도서관 눌렀음"만 우리 서버에 따로 보냄 [확정] (사용자 승인, 2026-10-12)
4. 회원 번호·IP·브라우저 식별값은 남기지 않음 (2026-10-13 바뀜: 모든 기록에 IP를 남기고 30일 뒤 비움, 사이클 15 spec R1-5·ADR-0096). 남기는 것: 시각, 검색 조건(2의 지역·도서관 포함), 결과 수, 누른 도서관과 누른 곳 [확정] (사용자 승인, 2026-10-12)
5. 원본 기록은 1년 보관 뒤 지움 [확정] (사용자 승인, 2026-10-12)

- 2와 4를 함께 보면: 거주 지역 + 직장 지역 + 고른 도서관 조합은 사람마다 꽤 다를 수 있어, 다른 정보와 합치면 알아볼 가능성이 있는지 [확인 필요: 전문가 질의]. 회원 번호·IP가 없으면 그 조합을 사람과 잇는 값은 기록에 없음 [안]

## 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 하루 기록 수와 크기 | 운영 뒤 측정 |
| 광고 차단기가 클릭 알림을 막는 비율 | 프로토타입 |
| 서버를 거쳐 이동하는 방식의 표준 근거 | 공식 문서 확인 |
| PostHog Cloud 무료 한도·보관 기간 | 공식 문서 확인 (가격 페이지 본문) |
| 한국에서 분석 쿠키 동의 창 필요 여부 | 공식 문서 확인 (PIPC), 전문가 질의 |
| IP·쿠키 식별값이 개인정보인지 | 공식 문서 확인 (PIPC 해석 사례집) |
| 서비스 통계에 동의가 필요한지, 처리방침 공개로 충분한지 | 공식 문서 확인 (PIPC 처리방침 작성지침), 전문가 질의 |
| 행태정보 정책이 광고 밖 통계에도 적용되는지 | 전문가 질의 |
| 거주·직장 지역과 고른 도서관 조합이 사람을 알아볼 수 있게 하는지 | 전문가 질의 |
