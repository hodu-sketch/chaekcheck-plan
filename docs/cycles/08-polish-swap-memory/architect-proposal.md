# 설계 제안 (architect, 2026-10-06): 가져오기 시간 줄이기, 가져오는 동안 검색 유지, 메모리 줄이기

- 기록용입니다. 구현 기준은 이 사이클의 `design-delta.md`입니다(아직 없음). 모든 이름·숫자는 [안]입니다.
- 사용자가 자는 동안 만든 안입니다. 사용자 결정은 아직 하나도 없습니다.
- 결정 1(가져오기)은 사용자가 "바꿔 끼우기로 한다는 게 아니라 가능한 여러 방향을 조사해 장단점을" 달라고 해서(2026-10-06), `research.md` 10절 조사 결과와 함께 다시 봅니다.
- 경로는 dev `backend/src/main/java/com/chaekcheck/` 기준입니다.

## 현재 상태 (코드 확인, 2026-10-06)

- 가져오기 순서: 사본 한 번 읽기(`collection/internal/importer/CatalogImporter.java:78`) → 국가서지 TTL 7.7GB를 파일마다 차례로 한 줄씩 읽기(`NationalBibliography.java:59-61`) → `replaceAll`(`CatalogImporter.java:110-123`)
- `replaceAll`(`catalog/internal/JdbcCatalogLoad.java`): 임시 표 `load_*`에 COPY(`:64-67`) → 옛 `holding`과 `(library_id, item_key)`로 맞대기(`:287-297`) → `TRUNCATE` + 색인이 달린 실제 표에 INSERT(`:190-211`) → 커밋 뒤 `VACUUM`(`:85`)
- 검색이 멈추는 까닭: `TRUNCATE`가 잡은 전용 잠금이 커밋까지 감. 색인 12개(`catalog/001-catalog-schema.yaml:113-124`)를 줄마다 고치는 것이 쓰기 시간의 큰 몫으로 보임 [확인 필요: 단계별 시간]
- 소장 번호(`holding.id`)는 가져올 때마다 1부터 다시 매김(`JdbcCatalogLoad.java:35,224-227`). 열린 화면의 "더 보기"(`BookAvailabilityBatchStreamController.java:48`)가 가져온 뒤 다른 소장 줄을 가리킬 수 있음. 지금도 있는 빈틈이고, 검색이 멈추지 않게 하면 겉으로 드러남

## 결정 1: 가져오기를 짧게, 그동안 검색은 그대로 (`research.md` 10절과 함께 다시 봄)

| 안 | 바뀌는 것 | 장점 | 단점 | 되돌리기 |
|---|---|---|---|---|
| A 새 표를 다 만든 뒤 바꿔 끼우기 [추천 안] | `JdbcCatalogLoad` 안에서: 준비 스키마 `catalog_next`에 색인 없이 표 → 임시 표에서 `INSERT … ORDER BY` 최종 `book_id`(R8 함께 해결) → 색인·제약 한 번에 만들기 → `VACUUM (ANALYZE)` → 짧은 트랜잭션에서 옛 표 지우고 `ALTER TABLE catalog_next.x SET SCHEMA catalog`. 공개 `CatalogLoad`는 그대로 | 검색 대기 거의 0, 색인을 나중에 만들어 쓰기가 빨라질 가능성, 데드 튜플 없음 | 디스크: 옛 표 + 임시 표 + 새 표 (지금과 거의 같음) | 작음 (`catalog_next`만 지움) |
| B 지금 흐름 + 쓰기만 빠르게 | 같은 트랜잭션에서 TRUNCATE → 색인 지우기 → `book_id` 순 INSERT → 색인 다시 만들기. 가져오기 세션만 `maintenance_work_mem`·`work_mem` 올림 | 코드 변경 가장 적음 | 검색은 여전히 멈춤(시간만 줄어듦) | 작음 |
| C 바뀐 줄만 고치기 | `(library_id, item_key)`로 비교해 INSERT·UPDATE·DELETE | 같은 사본이면 거의 안 씀, 검색 안 멈춤 | 데드 튜플(사용자가 싫다고 함, `catalog-refresh.md` 5.1), `book_id` 순서가 다시 흩어짐(R8과 충돌), 책 묶기는 어차피 전체 재계산 | 큼 |

- A안 세부: 색인·제약 정의는 운영 표에서 `pg_get_indexdef`·`pg_get_constraintdef`로 읽어 같은 이름으로 다시 만듦(스키마가 달라 이름이 겹치지 않음). SET SCHEMA는 색인·제약·열 소유 시퀀스를 같이 옮김 [확정: https://www.postgresql.org/docs/18/sql-altertable.html , 2026-10-06]. 새 DB를 Liquibase로 만든 정의와 비교하는 시험을 둠
- 책 번호: 새 `book` identity 시퀀스를 옛 최대값·옛 시퀀스 중 큰 쪽으로 맞춤("번호를 다시 쓰지 않음" 유지). 소장 번호도 옛 최대값 다음부터 → 옛 번호는 "없음"으로 실패하고 다른 줄을 가리키지 않음
- 잠금: RENAME·SET SCHEMA는 ACCESS EXCLUSIVE [확정: 같은 문서], 바꿔 끼우는 순간만. `SET LOCAL lock_timeout`을 짧게 두고 다시 시도 [확정: lock_timeout 기본 0, https://www.postgresql.org/docs/18/runtime-config-client.html , 2026-10-06]. 값·횟수 [안]
- 함께 할 수 있는 것: 국가서지 결과를 "TTL 파일 묶음 + 정리 규칙 판"을 키로 `collection`에 저장해 다시 씀(6~9분 줄 가능성), TTL 파일을 나눠 동시에 읽음(겹침 판정은 순서와 무관, `NationalBibliography.java:142-157`)
- 추천 이유(architect): R7(검색 안 멈춤)과 R8(같은 책 줄 붙이기)을 한 번에 채우는 유일한 안

## 결정 2: 도서관·자격 규칙을 요청마다 읽기 (`library/internal/LibraryService.java:85-87,158-159,247-251`)

| 안 | 내용 | 장단점 |
|---|---|---|
| A 필요한 줄만 읽기 [추천 안] | `planSearch`가 SQL에서 `join_survey IN ('SURVEYED','NOT_FOUND') OR id = ANY(:chosen)`로 거름(지금은 2,674줄 읽고 Java에서 버림, `:93-96`) | 약 390줄로 줄어 객체·DB 읽기 함께 줄어듦. ADR-0004(요청마다 읽음) 유지. `/libraries`는 전부 필요해 그대로 |
| B 메모리에 짧게(예: 30초) | 도서관·규칙을 캐시 | DB 읽기 거의 없음 / ADR-0004 바꿔야 함, SQL로 고친 것이 최대 30초 늦게 반영, 메모리에 늘 수 MB |
| C `/libraries` JSON 미리 만들기 | 지역 없을 때만 | 효과 작음 |

## 결정 3: 소장을 읽는 길

- A 계획 도서관 거르기를 SQL로 [추천 안]: `CatalogHoldings.holdingsOf(bookIds, libraryIds)`를 더하고 `AND library_id = ANY(:planned)`(기존 `(book_id, library_id)` 색인). 지금은 모든 도서관 줄을 읽고 Java에서 버림(`catalog/internal/JdbcCatalogHoldings.java:38`, `availability/.../BookAvailabilityStreamController.java:64,95-99`). 결정 1 A로 줄을 붙인 뒤에는 DB 쪽 차이가 작을 수 있어 측정 뒤 확정(R9-4)
- `holding_library_item_key`(1,075MB): 남김 [추천 안]. 검색이 읽지 않아 평소 버퍼를 차지하지 않고, 고유성과 번호 잇기 맞대기(`JdbcCatalogLoad.java:292`)에 씀. 다른 길: 지우고 가져오기 때만 임시 색인 — 맞대기가 실제로 이 색인을 쓰는지 [확인 필요: `EXPLAIN`]
- 원문 칸(`title_raw` 등): 남김 [추천 안]. 원문 보존 [확정], 표 나누기는 spec 비목표

## 결정 4: Caffeine 캐시

- 크기 추정 [안: 코드 모양으로 셈]: 검색 쪽 한 칸 약 15KB(20줄 × 문자열 5개) × 1,000 ≈ 15MB, 상세 판정 한 칸 약 0.3KB × 1,000 ≈ 0.3MB → Java 메모리의 큰 몫이 아닐 가능성이 큼
- A 개수 상한 유지 + `recordStats()` + 캐시마다 설정 나누기 [추천 안] (지금 `application.yml:120-121` 하나를 같이 씀). 상세 판정 캐시는 상한을 올려도 메모리 거의 안 늘어남. 값은 `evictionCount`를 본 뒤. ADR-0006(1,000칸) 갱신 필요
- B `maximumWeight` + weigher(무게 = 줄 수): 비동기 캐시 무게 계산 [확인 필요], 크기가 고르지 않다는 근거 없음
- C 값에서 안 쓰는 칸 빼기: 줄어드는 양 작음
- 2,700곳에 1,000칸: 계획 도서관은 약 390곳, 한 묶음 50곳 이하라 사용자가 적으면 충분해 보임. 축출 수로 판단

## 결정 5: 응답 본문 복사 (작은 개선)

- `BodyLimit`(`availability/internal/fetch/BodyLimit.java:43,75-77,88`): `Content-Length`로 처음 크기를 정하고 복사를 줄임. 위험 낮음
- 조회 서버 경로(`FetchServiceSiteFetcher.java:147-150`): `FetchResult.body`를 `byte[]`로 받아 Jackson이 Base64를 바로 풂 [확인 필요: Jackson 3 시험]
- 기본 모드가 `direct`(`application.yml:167`)라 우선순위 낮음. 측정에서 보일 때만

## 결정 6: 재는 법과 설정 자리

- 잴 도구: A Actuator 없이 `jcmd`(`GC.heap_info`, `VM.native_memory`) + 캐시 통계를 몇 분마다 로그 [추천 안] (의존성·공개 경로 없음, ADR-0044와 안 부딪힘) / B Actuator를 측정 프로필에서만, localhost 관리 포트
- Java 힙: bootRun·실행 설정에 `-Xmx`를 단계로. 가져오기는 따로
- PostgreSQL 설정: compose `command:`에 `-c shared_buffers=${DB_SHARED_BUFFERS:-128MB}` 식 [추천 안] (재시작만, `db-test` 영향 없음). 다른 길: Dockerfile CMD(`docker/postgres-bigm/Dockerfile:21`, 바꿀 때마다 빌드), `postgresql.conf`
- 컨테이너: `mem_limit`, `shm_size: 128mb`는 측정 단계에서만 (`compose.yaml:13-29`)
- 가져오기 세션에서만 `SET work_mem`·`maintenance_work_mem` 올림 → 서버 전체 값은 낮게

## 작은 항목 (추천 하나씩)

- `updated_at` 트리거: 모듈마다 자기 스키마에 함수(`library.set_updated_at()`, `region.set_updated_at()`), `BEFORE UPDATE FOR EACH ROW` 조건 없이(AC-6), Liquibase `sql` changeset `splitStatements: false` (근거 `library/001:55`, `region/001:67`)
- YES24 모바일 표시: `library.library.mobile_site_differs boolean NOT NULL DEFAULT false`, 새 changeset으로 13곳 UPDATE, `LibraryEligibility`·`targets.libraries[]`에 칸 추가
- 이름 고치기: 적용된 seed는 checksum 때문에 안 고침. 새 changeset에서 id로 UPDATE(`010-library-disabled.yaml`처럼) + `scripts/library/name_overrides.tsv`를 seed 스크립트가 읽음(`join_overrides.tsv`와 같은 방식). 이름 UNIQUE 확인
- 수집 기간: `collection.catalog_import.collected_from`, `collected_to timestamptz NULL`(옛 줄 NULL). `CatalogImporter.java:120-122`의 `collectedAt`으로 `collection` 안에서 계산
- 429·503: API 오류표와 웹만

## 확인 필요 / 사용자 결정 필요

1. 결정 1의 단계별 시간과 실제 단축 효과 (`research.md` 10절, 프로토타입)
2. 소장 번호를 이어 매길지
3. 옛 표를 바로 지울지, 다음 가져오기까지 남길지
4. 바꿔 끼울 때 잠금 기다리는 시간·다시 시도 횟수
5. ADR 갱신: ADR-0006(캐시 상한), 결정 2에서 B를 고르면 ADR-0004
6. `book_id` 맞대기가 `holding_library_item_key`를 쓰는지 (`EXPLAIN`)
7. Micrometer 없이 `AsyncCache.synchronous()` 통계를 로그로 남길 수 있는지 (공식 문서 확인)

## backlog 후보

- 운영 모니터링(Actuator·Prometheus), `/libraries` HTTP 캐시(ETag), 도서관 단위 갱신(사이클 09)
