# 설계 제안: 사이클 11 가져오기 따로 하기 + 가져오기 힙 줄이기

- architect 서브에이전트 제안 (2026-10-12). dev 코드는 읽기만 함. 결정은 `easy/2026-10-12-design-decisions.html`에서
- REST API·JPA·화면 변경 없음. 새 모듈·새 이벤트 없음. 모듈 방향(`collection → catalog, library`) 그대로

## 결정 기록 (`easy/2026-10-12-design-decisions.html`)

| 페이지 # | 이 문서 | 결과 |
|---|---|---|
| 1 | 결정 2 `load_manifest` | 질문("실제 예시로") → 페이지에 예시로 답함, [확정] (사용자 승인, 2026-10-12) |
| 2 | 결정 7 표 구조 비교 더함 | [확정] (사용자 승인, 2026-10-12) |
| 3 | 결정 6 모드 설정, `in-place` 남김 | 질문("정확히 어떤 명령어") → 명령 예시로 답함, [확정] (사용자 승인, 2026-10-12) |
| 4 | 결정 3 A안 컨테이너 안 18판 도구를 Java가 부름 | [확정] (사용자 승인, 2026-10-12) |
| 5 | 결정 1 A안 `CatalogLoad`에 더함 | 질문("CatalogLoad는 어디에") → 위치·역할로 답함, [확정] (사용자 승인, 2026-10-12) |
| 6 | 결정 5 A안 기다리는 새 표 보호 | [확정] (사용자 승인, 2026-10-12) |
| 7 | 결정 4 A안 기록 줄 | [확정] (사용자 승인, 2026-10-12) |
| 8 | 결정 8 A안 `chaekcheck.collection.import.grouping` | [확정] (사용자 승인, 2026-10-12) |
| 9 | 결정 9 A안 128비트 열쇠 | [확정] (사용자 승인, 2026-10-12) |
| 10 | 결정 10 A안 TEMPORARY 표 | [확정] (사용자 승인, 2026-10-12) |
| 11 | 결과 비교 도구 | [확정] (사용자 승인, 2026-10-12) |
| 12 | 반영 `maintenance_work_mem` 256MB, `db-ops` `mem_limit` 1GB, 처음 복사 | 질문("메모리 종류별 설정을 그림으로") → 표·그림으로 답함, [확정] (사용자 승인, 2026-10-12) |

## 요약

- **A. 따로 하기**: `catalog`의 `JdbcCatalogLoad`를 단계 메서드(쓰기 / 복원 / 색인 / analyze / 바꿔 끼우기)로 나누고 세 길로 엮음
  - 내보내기(내 PC): `catalog_next`를 만들고 남긴 채 `pg_dump -Fc` [확정 형식]
  - 반영(운영): 비교 → 복원 → 색인 → `VACUUM (ANALYZE)` → 바꿔 끼우기 [확정 순서]
  - 마저 바꿔 끼우기 / 지우기(내 PC) [확정 시점]
- 파일 하나 안에 `catalog_next` 네 표 + 작은 표 `catalog_next.load_manifest`(비교 값, 내보내기 번호, `collection`이 맡긴 짐) [안]
- 운영은 복원 **전에** 파일에서 manifest만 읽어(`pg_restore -a -n catalog_next -t load_manifest -f -`) 비교 → 다르면 DB에 손대지 않음 [안]
- pg 도구는 Java `ProcessBuilder`가 DB 컨테이너 이미지 안의 18판 바이너리를 부름 [안]. 이미지가 `FROM postgres:18` [확정: dev `docker/postgres-bigm/Dockerfile` 4행, 2026-10-12]
- `collection`은 이미 쓰는 `LibraryCatalog.enabledLibraryRefs()`(`LibraryRef(id, baseUrl, platformType)`, id 순)로 도서관 해시를 만듦 [확정: dev `LibraryRef.java` 7행, `LibraryService` 192-196행]
- 데이터: `collection.catalog_import`에 `export_id`·`exported_at` 칸 2개, changeset 1개 [안]. `failure_reason`에는 값 CHECK가 없어 `mismatch`를 더하는 데 changeset이 필요 없음 [확정: dev `003-import-period-and-timings.yaml` 30-42행]
- **B. 힙 줄이기**: `collection.internal.importer`에 묶기 인터페이스 하나 + 구현 셋(`current`·`compact`·`sql`) [확정 값 셋], 설정으로 고름. `sql` 임시 표는 가져오기 세션의 TEMPORARY 표 [안]. 결과 비교는 dry run 책별·줄별 파일 diff, 번호 비교는 방식마다 "내보내기 → 번호 뽑기 → 지우기" [안]

## 결정할 것

### 결정 1: `catalog` 공개 API 모양
- **A안 [안] (추천)**: `CatalogLoad`에 메서드를 더함. `replaceAll` 그대로 + `prepare(source, loader)`, `export(file, notes)`, `readManifest(file)`, `baseline()`, `apply(file)`, `finishPrepared(file)`, `discardPrepared()`. 레코드 `Manifest(formatVersion, exportId, exportedAt, baseline, notes)`, `Baseline(bookCount, bookMaxId, bookSequence, holdingCount, holdingMaxId, holdingSequence)`. `NotSwappedException` reason에 `mismatch`. 공개 타입이 하나라 `catalog_next` 상태를 다루는 코드가 한 곳에 모임. 단점: 메서드 8개
- B안: 새 인터페이스 `CatalogTransfer`(export, readManifest, apply)로 나눔. 순서 규칙이 두 곳에 걸침
- 비교 책임(하나의 설계): `collection`이 도서관·연결표 해시와 `baseline()`을 비교해 기록. `catalog.apply`는 복원 전에 기준값을 한 번 더 보고 다르면 `mismatch`

### 결정 2: 비교 값·기록을 싣는 자리
- **A안 [안] (추천)**: `catalog_next.load_manifest` 한 줄(`format_version`, `export_id`, `exported_at`, 기준값 6칸, `notes jsonb`). `catalog`는 `notes`를 해석하지 않고 실어 나름. 복원 뒤 지움(`swap`의 `DROP SCHEMA catalog_next`가 CASCADE 없이 돌기 때문). 파일 하나 [확정]을 지키면서 복원 전에 비교
- B안: 덤프 옆 JSON 파일 → 파일 둘, 스펙과 어긋남
- C안: `COMMENT ON SCHEMA`에 JSON → 어색함
- 해시: 도서관은 `id\tbaseUrl\tplatformType\n` 이은 글자의 SHA-256 + 개수, 연결표는 `collection_library_id, library_id` 순 SHA-256(`created_at` 제외) [안]. `mismatch` 때 `failure_detail`에 무엇이 다른지(1000자 안) [안]

### 결정 3: `pg_dump`·`pg_restore` 부르는 방법
- **A안 [안] (추천)**: Java `ProcessBuilder` + 명령 앞부분을 설정(`chaekcheck.catalog.load.pg-dump-command`, `pg-restore-command` [안 이름])으로. 예: `wsl -d Ubuntu --exec docker compose exec -T db-ops …`. 덤프는 `<file>.part`에 쓰고 다 되면 이름 바꿈. 옵션: 덤프 `-Fc -n catalog_next --no-owner --no-privileges`, 복원 `--single-transaction --exit-on-error --no-owner --no-privileges` [안]. 엉뚱한 DB 막기: 덤프·복원 뒤 `export_id`를 JDBC로 맞대 봄
- B안: 운영자 스크립트가 Java 단계 사이에 실행 → 기록 한 줄(AC-7)이 어려움
- C안: JDBC `CopyManager`로 자체 파일 → 스펙의 `pg_dump -Fc` 결정을 다시 열어야 함
- 표준 입력으로 복원하면 `pg_restore -j`를 못 씀("The input must be a regular file or directory (not, for example, a pipe or standard input)", https://www.postgresql.org/docs/18/app-pgrestore.html , 2026-10-12). 시간 대부분이 `holding` 한 표라 잃는 것이 작다고 봄 [확인 필요: 프로토타입]

### 결정 4: 가져오기 기록 줄
- **A안 [안] (추천)**: 내 PC는 내보내기 성공 때 줄 없음(실패는 지금처럼 `FAILED`), 마저 바꿔 끼우기가 끝나면 `SUCCEEDED` 한 줄. 운영은 반영마다 한 줄. 두 줄은 `export_id`로 이어짐. `status` 값 목록 그대로, "그 DB의 `catalog`가 바뀐 때 한 줄" 뜻 유지
- B안: 내보낼 때 `EXPORTED` 줄 → CHECK 변경, 새 뜻
- `step_seconds` 키 [안]: 내보내기 = 지금 키 + `dump`·`export`, 반영 = `restore`·`index`·`analyze`·`swap` [확정] + `compare`·`apply`, 마저 바꿔 끼우기 = `index`·`analyze`·`swap`·`finish`

### 결정 5: 남겨 둔 `catalog_next` 보호
- **A안 [안] (추천)**: 같은 DB에서 다음 가져오기·내보내기가 시작될 때 `catalog_next.load_manifest`가 있으면(= 끝난 내보내기가 기다리는 중) 멈추고 "먼저 finish 또는 discard". manifest 없는 `catalog_next`는 죽고 남은 것으로 보고 지움(사이클 08 AC-9)
- B안: 늘 지움 → 운영만 새 표가 되면 다음 가져오기가 `mismatch`. 되살리기는 같은 파일을 내 PC에 `apply`

### 결정 6: 명령 모양
- **A안 [안] (추천)**: 프로필 `collection-import` 하나, 설정 `chaekcheck.collection.import.mode` = `in-place`(지금 동작, 기본) | `export` | `apply` | `finish` | `discard`, 파일 `chaekcheck.collection.import.file` [안 이름]
- B안: 프로필을 셋으로
- `in-place`를 남길지: 남김 추천(개발 DB 하나로 시험)
- 반영 명령은 앱이 운영 DB에 붙어 시작하므로 그 앱 판의 Liquibase가 먼저 적용됨 → 운영 서비스와 같은 판으로 돌리는 것이 절차 전제

### 결정 7: 비교에 표 구조를 더할지 (스펙에 없던 것)
- **A안 [안] (추천)**: manifest에 네 표의 (표, 칸, 타입) 목록 해시를 넣고 다르면 `mismatch`(표 구조). 앱 판이 달라 칸이 다르면 Liquibase 정의와 다른 표가 조용히 바꿔 끼워질 수 있음
- B안: 스펙대로 세 가지만

### 결정 8: 묶는 방식 설정 자리
- scope [확정] "설정 이름은 dev가 `chaekcheck.catalog.load.*`에 맞춰 정함". 묶기는 `collection`의 일
- **A안 [안] (추천)**: `chaekcheck.collection.import.grouping`("맞춰"를 "같은 꼴로"로 읽음)
- B안: 글자 그대로 `chaekcheck.catalog.load.grouping`

### 결정 9: `compact`의 묶음 열쇠
- **A안 [안] (추천)**: `space|itemKey`의 64비트 해시 두 개(128비트)를 열쇠로, 원시 배열 해시표. 760만 개에서 충돌 확률 약 10^-25(Claude 계산, n²/2^129). 그래도 생기면 결과 비교(AC-9)가 잡음
- B안: 숫자로만 된 `itemKey`는 `(space, long)`으로 정확하게, 아니면 글자 열쇠. 충돌 없음, 두 갈래 코드, 효과는 숫자 열쇠 비율에 달림 [확인 필요: dev 데이터]

### 결정 10: `sql` 임시 표 자리
- **A안 [안] (추천)**: 가져오기 실행기가 따로 연 연결의 `TEMPORARY` 표. 끊기면 저절로 지워짐
- B안: `collection` 스키마의 `UNLOGGED` 표. 측정 중 들여다보기 쉬움, 죽으면 남음
- 디스크: 줄 표(약 1,770만 줄)에 원문·정리값이 있어 수 GB 예상 [확인 필요: 측정]

## 모듈 변경

| 모듈 | 공개 API | 내부 | 이벤트 | 소유 표 |
|---|---|---|---|---|
| `catalog` | `CatalogLoad`에 메서드 7개, `Manifest`·`Baseline`, reason `mismatch` [안] | `JdbcCatalogLoad`를 단계 메서드로(`replaceAll` = prepare + index + analyze + swap), 내부 `PgTools`, 설정 `pg-dump-command`·`pg-restore-command` [안] | 없음 | 실행 중에만 `catalog_next.load_manifest` |
| `collection` | 없음 | `CatalogImportRunner`에 `mode`·`file`·`grouping`·`dry-run-output`, `ImportTransfer`, `DatabaseFingerprint`, 기록 JSON, `BookGrouper` + `CurrentGrouping`·`CompactGrouping`·`SqlGrouping`, `DryRunDump` [안 이름] | 없음 | `catalog_import` 칸 2개 |
| `library` | 그대로 | 없음 | 없음 | 없음 |
| 인프라 | — | compose `db-ops`(5434, 자기 볼륨 `db-ops-data`), `bootRun`에 `-PbootRunJvmArgs`, `scripts/catalog/compare_grouping.py` [안] | — | — |

## 데이터

- `collection.catalog_import` (changeset `collection/005-import-export.yaml` [안]): `export_id uuid NULL`, `exported_at timestamptz NULL`, CHECK `(export_id IS NULL) = (exported_at IS NULL)` [안]. `mismatch`는 changeset 없음
- `catalog_next.load_manifest` (실행 중에만, Liquibase 아님): `format_version int`, `export_id uuid`, `exported_at timestamptz`, `book_count`·`book_max_id`·`book_sequence`·`holding_count`·`holding_max_id`·`holding_sequence bigint`, `notes jsonb` [안]
- compose `db-ops`: 같은 이미지·`command:`, 포트 `${OPS_DB_PORT:-5434}:5432`, 볼륨 `db-ops-data` [안 이름]. 처음에는 `db`를 통째로 복사해 기준을 같게 [안]

## B. 묶기 스케치

- 인터페이스 `BookGrouper`: 지금 `CatalogImporter`가 부르는 모양(`add`, `groupByCodes`, `bibliographyKeys`, `attachBibliography`, `mergeSameText`, `forEachBook`, `bookOf`) 그대로
- `compact`: 제목·저자·출판사·공급자 필드별 interning, `Votes` 6개 대신 칸(첫 값 + `int` 개수, ISBN `long`, 날짜 epochDay, 종류 `byte`), 두 번째 값부터만 작은 맵, 도서관 `int[]`
- `sql`: Java가 줄마다 정리값과 읽은 순번(`seq`)을 TEMP 표에 COPY → 묶음 번호는 `row_number() OVER (ORDER BY min(seq))` → 사슬 잇기는 바뀐 줄이 0이 될 때까지 `label := min` 반복(상한 둠) → 대표값은 개수 큰 순, 같으면 `COLLATE "C"` 순(`mode()` 안 씀) → ③ 국가서지·④ 같은 글은 한 번씩 → 책을 `label` 순으로 흘려 Java가 쓰기 → 둘째 읽기는 `seq` 순으로 흘려 짝지음
- 결과 비교: dry run이 `books.tsv`·`rows.tsv`(gzip)를 남기고 `compare_grouping.py`가 비교. 번호는 방식마다 export → 번호 뽑기 → discard
- 측정: `-XX:+UseStringDeduplication`, `-XX:+UseCompactObjectHeaders`, `-Xlog:gc*:file=…` [확정 옵션], `temp_bytes` 전후 차이, `pg_database_size` 최대, Java CPU 시간, DB 컨테이너 cgroup `cpu.stat`

## 흐름·구조 그림

결정 페이지 `easy/2026-10-12-design-decisions.html`에 그림으로 그림(내보내기, 반영과 실패, 마저 바꿔 끼우기, 내 PC `catalog_next` 상태). 결정 뒤 `design-delta.md`에 Mermaid로 옮김.

## 확인 필요

| 항목 | 방법 |
|---|---|
| `pg_dump -n catalog_next`가 IDENTITY 시퀀스 값까지 넣는지 | 공식 문서: `-n`은 "the schema itself, and all its contained objects", `--sequence-data`는 "Include sequence data in the dump. This is the default behavior …" (https://www.postgresql.org/docs/18/app-pgdump.html , 2026-10-12) → 들어감. 프로토타입으로 `last_value` 맞대 확인 |
| PG18 `pg_dump` 통계 기본 | "`--no-statistics` … This is the default." (같은 문서, 2026-10-12) → 통계는 안 들어감, 반영 쪽 `VACUUM (ANALYZE)` 필요 [확정] |
| 압축 | `-Fc` 기본 gzip, `-Z`로 `gzip`·`lz4`·`zstd`·`none` (같은 문서, 2026-10-12) |
| `wsl --exec docker compose exec -T` 파이프로 바이너리가 깨지지 않는지 | 프로토타입(체크섬 비교). 깨지면 bind mount / `docker cp` |
| 컨테이너 안 도구가 암호 없이 로컬 소켓으로 붙는지 | 프로토타입 |
| Java가 죽었을 때 컨테이너 안 `pg_restore`가 계속 도는지(최종 스펙 AC-13) | 프로토타입. `PGAPPNAME` + `pg_stat_activity` |
| manifest를 COPY 글로 읽는 것 | 프로토타입 |
| 덤프 크기, 복원 시간, 운영 디스크 최대 | 측정 |
| `sql` 사슬 반복 수·시간·TEMP 디스크, 43분 안 | dev 프로토타입·측정 |
| 숫자로만 된 `item_key` 비율(결정 9 B안) | dev 데이터 |

## backlog 후보

- 운영 반영이 동시에 두 번 돌지 않게(`pg_advisory_lock`)
- `catalog_import`에 묶기 방식 칸
- 복원을 파일로 받아 `pg_restore -j`
- `sql` 방식 국가서지 맞대기를 SQL로
- 진짜 운영 서버의 반영 명령 앞부분과 파일 옮기기 — 배포 사이클
