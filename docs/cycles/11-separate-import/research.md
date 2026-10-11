# 사이클 11 조사: 가져오기 따로 하기, 힙 줄이기

확인일 2026-10-12. dev 코드는 읽기만 함(경로는 dev 저장소 기준). 공식 문서는 PostgreSQL 18(페이지 머리 18.6), JDK 25.

## 1. 지금 가져오기 코드에서 끊는 자리 (dev 코드)

- 실행: `CatalogImportRunner`(`@Profile("collection-import")`) → `CatalogImporter.run` → 끝에서 `catalogLoad.replaceAll(...)` 한 번 (`backend/src/main/java/com/chaekcheck/collection/internal/importer/CatalogImporter.java` L73-157)
- `JdbcCatalogLoad.load` (`backend/src/main/java/com/chaekcheck/catalog/internal/JdbcCatalogLoad.java` L103-170) 순서: 세션 `SET` → `DROP/CREATE SCHEMA catalog_next` → 임시 표 `load_*` → COPY → `match`(`Ids.decide`) → `write`(`catalog_next`에 `LIKE … INCLUDING DEFAULTS IDENTITY GENERATED STORAGE COMPRESSION` + `INSERT … ORDER BY book_id` + 시퀀스 `setval`) → 커밋(L138) → 임시 표 지움(L148-150) → `index`(L152-154) → `analyze`(L156-161) → `swap`(L163-165, L279-316)
- **끊는 자리**: `write` 커밋과 임시 표 정리 뒤, `index` 앞(L152). 이때 `catalog_next`에는 네 표가 차 있고 색인·제약은 없음(NOT NULL·기본값·IDENTITY·시퀀스 값만)
- 색인·제약은 **그 DB의 `catalog` 표 정의를 읽어** 만듦(`pg_get_constraintdef`, `pg_get_indexdef`, L230-272). 운영 DB에서 돌리면 운영 DB 정의를 씀. pg_bigm GIN 색인이 있어 두 DB 모두 pg_bigm 필요(`db/changelog/catalog/001-catalog-schema.yaml` L113-124)

## 2. 번호 잇기가 읽는 것 (dev 코드) — 두 DB가 같아야 하는 이유

`Ids.decide`(`JdbcCatalogLoad.java` L524-559)는 바꿔 끼우기 **전에, 가져오는 DB의 지금 `catalog` 표**를 읽음:
- `catalog.holding`의 `max(id)`와 시퀀스 `last_value` 중 큰 값(L562-570)
- `load_holding LEFT JOIN catalog.holding ON (library_id, item_key)` → 옛 `id`, `book_id`(L531-537)
- `catalog.book` 줄 수, 가장 큰 번호(L550-551)
- `book_contributor` 번호는 잇지 않음(최대+1부터, L211-212)

→ 내 PC DB의 `catalog.holding (id, book_id, library_id, item_key)`, `catalog.book` 번호, 두 시퀀스 값이 운영과 같아야 번호가 이어짐. 다른 길은 번호 잇기(match)를 운영에서 하는 것.

## 3. 도서관 목록이 같아야 하는 것 (dev 코드)

- 가져오기는 `library.library`의 enabled = true인 곳(id, base_url, platform_type)을 씀(`library/internal/LibraryService.java` L191-196). base_url이 다르면 건너뜀(`CollectedCatalog.libraries` L101-141)
- `collection.collection_link`(collection_library_id PK, library_id UNIQUE)는 Liquibase `loadData`로 넣음(`collection/002-collection-seed-candidates.yaml`)
- 지금 두 DB를 비교하는 코드는 없음. 비교할 수 있는 것: Liquibase `databasechangelog`(id, filename, md5sum), 또는 내용 해시(예: `md5(string_agg(...))`)

## 4. 가져오기 기록·설정·실행 (dev 코드)

- `collection.catalog_import`: `001-collection-schema.yaml` L38-58, `003-import-period-and-timings.yaml` L10-42. `status` SUCCEEDED/FAILED, `failure_reason` `lock_not_acquired`·`outside_foreign_key`·`error`, `failure_detail` 1000자. 쓰는 곳은 `importer/ImportRecords.java` L33-62 하나
- 설정 `chaekcheck.catalog.load.*`(`CatalogLoadSettings` L21-35): `lock-timeout` 2초, `swap-attempts` 5, `swap-retry-wait` 10초, 세션 메모리 셋. `chaekcheck.collection.import.*`: `sqlite-path`, `ttl-path`, `dry-run`, `placeholder-date-libraries`
- 실행: `./gradlew bootRun -PbootRunXmx=6g --args='--spring.profiles.active=collection-import …'` (`docs/maintenance/3-import.md` L32-37)
- dry run은 `same_text`까지 하고 아무것도 쓰지 않음, 기록 줄도 없음(국가서지 지문이 바뀌었으면 `national_bibliography_record`는 다시 씀)
- 국가서지: 지문(파일 경로·크기·시각)이 같으면 DB 표 `collection.national_bibliography_record`에서 읽음. 그래서 `ttl-path`는 여전히 필요

## 5. 로컬 DB (dev 코드)

- `compose.yaml`: 이미지 `chaekcheck/postgres-bigm:18`(`postgres:18` + pg_bigm), 서비스 `db`(포트 `${DB_PORT:-5432}`, 볼륨 `db-data`, `shared_buffers=64MB`·`effective_cache_size=768MB`·`work_mem=4MB`), `db-test`(5433, tmpfs). **컨테이너 메모리 상한은 설정돼 있지 않음**(주석에만 1GB)
- 앱은 `DB_PORT`·`DB_NAME`·`spring.datasource.url`로 다른 DB에 붙음. Liquibase가 시작 때 그 DB를 맞춤
- 2026-10-05에 포트 5434로 `db` 복사본을 쓴 적 있음(`docs/maintenance/3-import.md` L54)

## 6. Java·GC (dev 코드)

- Java 25 툴체인, Spring Boot 4.1.1(`backend/build.gradle` L10-14). `bootRun` `-Xmx${bootRunXmx ?: 512m}`
- GC 옵션·GC 로그 설정 없음 → 기본 G1. 힙은 `report.noteHeap()` 로그
- 4g: 전체 GC 반복으로 실패(살아 있는 데이터 4,066MB). 6g: 전체 GC 2번, 살아 있는 데이터 약 4.8GB(`3-import.md` L34, L57, L63)

## 7. 묶기에 쓰는 Java 정리 코드 (안 3을 SQL로 할 때) (dev 코드)

`backend/src/main/java/com/chaekcheck/catalog/normalize/`:

| 코드 | 하는 일 | SQL로 옮기기 |
|---|---|---|
| `CatalogText.titleNorm` | NFKC → 소문자 → 공백 모두 제거 | 쉬움. 단 Java `\s`와 PostgreSQL `\s`가 유니코드에서 조금 다름 |
| `CatalogText.mainTitleNorm` | 앞 `〈…〉`·`<…>`·`[…]` 빼고 ` : `·` - ` 앞까지 | 중간(정규식) |
| `CatalogText.publisherNorm` | `(주)`·`주식회사`·`도서출판`·Inc/Ltd/Co 빼기 | 중간. 뒤돌아보기 정규식을 고쳐 써야 함 |
| `Contributors.parse` (155줄) | 저자 칸 나누기, 역할어 약 30개, `외 N명`, 별칭, 글그림 | **가장 어려움**. 묶기에는 첫 저자(`firstAuthor`)만 필요 |
| `PublishedDates.representative` | 가장 많이 나온 날짜, 동점이면 이른 날짜 | 쉬움 |
| `Isbn.fromKyoboCode` | `480…` 코드 → ISBN-13, 검사 숫자 | 쉬움~중간 |

- 묶기 자체(같은 코드 → ISBN → 국가서지 키 → 같은 글로 사슬처럼 잇기)가 SQL에서 가장 큰 일: 반복해서 이어 붙이기(재귀 질의 또는 꼬리표 전파)가 필요
- 대표값 동점: Java는 가장 많은 값, 동점이면 `String.compareTo`로 작은 값(`BookGrouping` L370-380)

## 8. 측정 도구 (dev 코드)

`scripts/catalog/`: `measure_round.py`(메모리 한 차례), `probe_during_import.py`(가져오는 동안 검색·책 화면 응답, 15초마다 DB 크기), `measure_books.py`·`compare_books.py`(검색 응답 저장·비교), `save_plans.py`, `summarize_times.py`. 지난 가져오기 시간 기록은 `docs/maintenance/3-import.md` L49-66

## 9. PostgreSQL 공식 문서

| 사실 | 원문 (짧게) | 출처 |
|---|---|---|
| `pg_dump -t`로 표만 | "Dump only tables with names matching pattern." | https://www.postgresql.org/docs/18/app-pgdump.html |
| `-Fc` | "custom-format archive suitable for input into pg_restore… compressed by default" | 같은 곳 |
| `pg_dump -j`는 디렉터리 형식만 | "You can only use this option with the directory output format" | 같은 곳 |
| `pg_restore -j` | "Only the custom and directory archive formats are supported", `--single-transaction`과 함께 못 씀 | https://www.postgresql.org/docs/18/app-pgrestore.html |
| `pg_restore -n` | "Restore only objects that are in the named schema." | 같은 곳 |
| post-data | "definitions of indexes, triggers, rules and constraints other than validated check constraints" | 같은 곳 |
| 복원할 때 스키마 이름 바꾸기 | 문서에 그런 옵션 없음(없다는 문장도 없음) | 같은 곳 |
| `ALTER TABLE … SET SCHEMA` | "Associated indexes, constraints, and sequences owned by table columns are moved as well." | https://www.postgresql.org/docs/18/sql-altertable.html |
| COPY 바이너리 | "less portable across machine architectures and PostgreSQL versions" | https://www.postgresql.org/docs/18/sql-copy.html |
| `mode()` 동점 | "arbitrarily choosing the first one if there are multiple equally-frequent values" → 동점 값을 정할 수 없음 | https://www.postgresql.org/docs/18/functions-aggregate.html |
| C 정렬 | "sort by byte values rather than natural language order"; `ucs_basic` "sorts using the Unicode code point values… same behavior as … C in UTF8 encoding" | https://www.postgresql.org/docs/18/collation.html |
| 재귀 질의 | UNION은 "discard duplicate rows and rows that duplicate any previous result row" | https://www.postgresql.org/docs/18/queries-with.html |
| `work_mem` | "before writing to temporary disk files" | https://www.postgresql.org/docs/18/runtime-config-resource.html |
| `temp_bytes` | "Total amount of data written to temporary files by queries in this database." | https://www.postgresql.org/docs/18/monitoring-stats.html |
| `pg_database_size` | "Computes the total disk space used by the database" | https://www.postgresql.org/docs/18/functions-admin.html |

**쓰는 법에 대한 판단 (Claude, 문서 문장 아님)**: 내 PC에서 `catalog_next` 스키마 네 표를 그대로 덤프하면, 운영에서도 `catalog_next`에 복원되므로 스키마 이름을 바꿀 필요가 없음. `mode()`는 동점을 정할 수 없어서 Java와 같은 결과를 내려면 개수 큰 순 + 값 순(C 정렬)으로 직접 고름. Java `compareTo`는 UTF-16 단위 순, C 정렬(UTF-8)은 코드 포인트 순이라 보조 평면 문자(이모지 등)와 U+E000~U+FFFF 사이에서만 순서가 다름 → 결과 비교에서 잡음.

## 10. Java 공식 문서

| 사실 | 원문 (짧게) | 출처 |
|---|---|---|
| `String.compareTo` | "The comparison is based on the Unicode value of each character"; String은 UTF-16, 인덱스는 char 단위 | https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/String.html |
| 글자 합치기 옵션이 합치는 것 | "We are not actually deduplicating the String objects, only their backing character arrays." | https://openjdk.org/jeps/192 |
| 기본은 꺼짐, 나이 기준 3 | JDK 25 java 명령 문서 | https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html |
| G1 밖 GC 지원 | JDK 18에서 ParallelGC·ZGC·SerialGC에 더함(JDK-8267185, -8267186, -8272609). 별도 JEP 없음 | https://bugs.openjdk.org/browse/JDK-8267185 |
| 객체 머리 줄이기 | "Reduce the size of object headers … from between 96 and 128 bits down to 64 bits" | https://openjdk.org/jeps/450 |
| Java 25에서 정식 | `-XX:+UseCompactObjectHeaders`만으로 켬(실험 옵션 해제 필요 없음), 기본값은 아님 | https://openjdk.org/jeps/519 |
| 효과 | "reduces memory footprint in the Java heap by 4 bytes per object (on average)" | https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html |
| GC 로그 | `-Xlog:gc`, `PrintGCDetails` → `-Xlog:gc*` | https://openjdk.org/jeps/158, 위 java 문서 |

확인 못 함: GC 로그 `2159M->402M(3000M)`이 "GC 전 → 후(용량)"라는 문서 문장(관례로는 그렇게 읽음). JDK 18 릴리스 노트 본문(403).

**쓰는 법에 대한 판단 (Claude)**: dev가 쓰는 Java 25에서는 두 옵션 모두 명령에 붙이기만 하면 되므로, `current` 방식에 옵션만 바꿔 재는 것은 코드 변경 없이 가능. 객체 머리 줄이기는 묶음마다 객체가 많은(개수표 6개 등) 지금 방식에서 효과가 있을 수 있음(크기는 재 봐야 앎).

## 11. 설계 때 더 확인한 공식 문서 (2026-10-12)

| 사실 | 원문 (짧게) | 출처 |
|---|---|---|
| `pg_dump -n`은 스키마와 그 안 모든 객체 | "selects both the schema itself, and all its contained objects" | https://www.postgresql.org/docs/18/app-pgdump.html |
| 시퀀스 값은 기본으로 들어감 | `--sequence-data` "This is the default behavior except when --no-data, --schema-only, or --statistics-only is specified" | 같은 곳 |
| 통계는 기본으로 안 들어감 | `--no-statistics` "This is the default." | 같은 곳 |
| `-Fc` 압축 | 기본 gzip, `-Z`로 `gzip`·`lz4`·`zstd`·`none` | 같은 곳 |
| `pg_restore -j`는 표준 입력 안 됨 | "The input must be a regular file or directory (not, for example, a pipe or standard input)" | https://www.postgresql.org/docs/18/app-pgrestore.html |
| `shared_buffers` 기본 | "typically 128 megabytes" | https://www.postgresql.org/docs/18/runtime-config-resource.html |
| `work_mem` 여러 배 | "the total memory used could be many times the value of work_mem" | 같은 곳 |
| `maintenance_work_mem` 기본 64MB, `CREATE INDEX`·`VACUUM` | "defaults to 64 megabytes" | 같은 곳 |
| 병렬 유지보수 명령의 메모리 | "a limit to be applied to the entire utility command, regardless of the number of parallel worker processes" | 같은 곳 |
| `autovacuum_work_mem` 기본 | "-1, indicating that the value of maintenance_work_mem should be used instead" | 같은 곳 |
| `temp_buffers` | "session-local buffers used only for access to temporary tables … default is eight megabytes" → `sql` 방식 임시 표는 대부분 디스크로 감 | 같은 곳 |
| `effective_cache_size` | "has no effect on the size of shared memory allocated … used only for estimation purposes" | https://www.postgresql.org/docs/18/runtime-config-query.html |
| compose `mem_limit` | "configures a limit on the amount of memory a container can allocate", `deploy` `limits.memory`와 같아야 함 | https://docs.docker.com/reference/compose-file/services/ |
| Java 힙 기본 상한 | "Maximum heap size of 1/4 of physical memory" | https://docs.oracle.com/en/java/javase/25/gctuning/ergonomics.html |
| Java 클래스 정보(Metaspace) | "allocated in native memory", 기본 상한 "by default unlimited" | https://docs.oracle.com/en/java/javase/25/gctuning/other-considerations.html |

- 사이클 08 실제 사례: 컨테이너 상한 512MB에서 세션 `maintenance_work_mem` 1GB로 가져오다 DB가 `OOMKilled` (`../08-polish-swap-memory/retro.md` 59행) → 설계 #12(반영 256MB, 상한 1GB)의 근거
- 조회 서버(`fetch-service`)는 힙 상한 설정이 없음(dev `fetch-service/build.gradle`, `application.yml`, 2026-10-12 확인) → 실메모리의 1/4
- 메모리 종류 쉬운 설명: `docs/research/deploy/easy/2026-10-12-memory-kinds.html`
