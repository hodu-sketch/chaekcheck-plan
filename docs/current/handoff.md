# 개발 인계서: 사이클 08 다듬기 + 가져오기 바꿔 끼우기 + 메모리 줄이기

## 요약

이번 사이클은 세 가지를 합니다. 사이클 07에서 남은 작은 수정과 화면 수정을 끝냅니다. 가져오기는 새 표(`catalog_next`)에 다 쓴 뒤 짧은 트랜잭션에서 바꿔 끼워, 가져오는 동안에도 책 검색이 멈추지 않게 합니다. DB·캐시·Java 메모리는 **먼저 재고 나서** 속도를 잃지 않는 선까지 줄입니다.
- 바꿔 끼울 때 책 번호(ADR-0062)와 소장 번호(ADR-0070)는 옛 번호를 그대로 잇습니다.
- 국가서지는 원문을 남겨 두고 다시 씁니다(ADR-0069).
- 교보 대여·혼합 도서관 11곳은 seed에서 지웁니다(ADR-0067).
- `updated_at`은 DB 트리거가 적습니다(ADR-0068).

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다.
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) **조용히 바꾸지 말고** 먼저 사용자에게 알리세요. 내용과 이유는 dev `docs/plan-feedback.md`의 **새 `# 사이클 08` 절**에 쌓습니다. 사용자 발언이면 그대로 옮깁니다.
- `[안]`·`[안 이름]`·`[안 경로]`로 표시한 이름은 dev가 코드에 맞춰 바꿀 수 있습니다. 바꾸면 `# 사이클 08` 절에 알리기만 합니다. 규칙과 뜻은 바꾸지 않습니다.
  - 해당 이름 예: `catalog_next`, `holdingsOf(bookIds, libraryIds)`, `mobile_site_differs`/`mobileSiteDiffers`, `collected_from`/`collected_to`, `step_seconds`와 그 키, `national_bibliography_record`/`_source`, `set_updated_at()`, changelog 파일 번호, 설정·환경 변수 이름
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 확정된 것처럼 코드에 넣지 말고 `TODO(확인 필요)`로 둔 뒤, 확인하고 보고합니다.
- **새 의존성은 원칙적으로 없습니다.** Actuator·Micrometer도 넣지 않습니다 [확정] (ADR-0066). 글꼴 서브셋 도구처럼 의존성이 필요해지면(Python 패키지 포함) 먼저 사용자 승인을 받습니다.
- 단계마다 아래 확인이 통과해야 다음 단계로 넘어갑니다.
  - 백엔드: `backend/`에서 `./gradlew build` (`ModularityTests`의 `ApplicationModules.of(ChaekcheckApplication.class).verify()`, `DocumentationTests` 포함)
  - 웹: `web/`에서 `npm test`, `npm run build`, `npm run lint`
- **구현 기준은 `design-delta.md`입니다.** `architect-proposal.md`는 기록일 뿐 구현 기준이 아닙니다.
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), 사이클 05~07 인계서의 제약을 그대로 따릅니다. 아래에는 이번에 더하거나 바뀌는 것만 적습니다.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/08-polish-swap-memory/design-delta.md`: **기준 문서**. 흐름 A(가져오기)·B(계획·소장 읽기)·C(막힘), 데이터 표, "정리 규칙을 바꿀 때" 표, API, 웹, 메모리 측정과 설정, 이름 고치기, 확인 필요
- `.../08-polish-swap-memory/spec.md`: R1~R10, 상태별 동작, AC-1~AC-21(AC-8b, AC-8c 포함), 비목표
- `.../08-polish-swap-memory/flow.md`: 화면별 바뀜, "검토 결과", 빠진 책·소장 문구
- `.../08-polish-swap-memory/research.md`
  - 7절: 측정 순서
  - 9절: 코드에서 본 메모리 쓰임과 파일 위치
  - 10절: 가져오기 단계와 시간, 잠금에 대한 공식 사실, 방향 비교
- `.../08-polish-swap-memory/scope.md`
- ADR (`../chaekcheck-plan/docs/adr/`)
  - 0065: 새 표에 쓰고 바꿔 끼움
  - 0066: 메모리 줄이는 구조
  - 0067: 교보 대여·혼합 제외
  - 0068: `updated_at` 트리거
  - 0069: 국가서지 원문, 정리 규칙을 바꿀 때의 순서
  - 0070: 소장 번호 잇기, 빠진 책·소장 안내
  - 그대로 따르는 것: 0004, 0006, 0053, 0054, 0055, 0060, 0062
- `../chaekcheck-plan/docs/research/library-join/name-changes-2026-10-10.md` 2절: 이름 고칠 곳, 흡수된 학교
- `../chaekcheck-plan/docs/research/deploy/db-memory.md`: DB 메모리 안 1~5
- `../chaekcheck-plan/docs/research/ebook-catalog/crawl-runbook.md` 8-2-1절, `collection-by-vendor-2026-10-09.md`: 교보 대여·혼합
- 사이클 07: `../chaekcheck-plan/docs/cycles/07-candidate-libraries/retro.md`, dev `docs/plan-feedback.md` `# 사이클 07`(14~17단계, 측정 기준선)
- 데이터
  - 가져오기 원본: `../chaekcheck-data/snapshots/ebook-catalog-2026-10-05-0745.sqlite` (읽기만) [확정]
  - 측정 기준선: dev `data/cycle07/`

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0065 | 준비 스키마에 색인 없이 쓰기 → 색인·제약 → `VACUUM (ANALYZE)` → 짧은 트랜잭션에서 옛 표 `DROP` + 새 표 `SET SCHEMA`. 옛 표는 바로 지움. **쓰기 단계 안의 시간을 먼저 나눠 잼** |
| 0066 | `planSearch`는 들어갈 도서관만 SQL로 읽음. `holdingsOf`는 계획 도서관 줄만 읽음. 캐시 통계를 켜고 캐시마다 상한을 둠. 재는 도구는 `jcmd`·로그·PG 통계만. DB 메모리 값은 compose에 둠. 본문 복사를 줄임. 멈추는 기준은 첫 쪽 1초, 기준 대비 20% |
| 0067 | 대여·혼합 230곳은 수집도 서비스도 하지 않음. 서비스에 들어간 11곳(2664~2674)은 seed에서 지움 |
| 0068 | `BEFORE UPDATE FOR EACH ROW` 트리거. 함수는 모듈 스키마마다 둠. `postgres-patterns` 스킬에 지침을 더함 |
| 0069 | 국가서지 원문과 파일 지문을 `collection`에 남김. 다듬기는 매번 지금 규칙으로 함. 정리 규칙을 바꿀 때의 순서를 `3-import.md`에 적음 |
| 0070 | 같은 (도서관, `item_key`)는 옛 `holding.id`를 씀. 빠진 소장은 `holding_not_found`, 빠진 책은 `book_not_found` + 안내 한 줄 |

## 지켜야 할 제약

- C1. 모듈 의존 방향과 이벤트는 바뀌지 않습니다 [확정]: `collection → catalog, library`, `availability → catalog, library`, `catalog → library → region`. 표 바꿔 끼우기 SQL은 `catalog` 안(`catalog/internal/JdbcCatalogLoad.java`)에 둡니다. 국가서지 원문 표는 `collection` 안에 둡니다. `collection`은 지금처럼 `CatalogLoad.replaceAll`만 부릅니다.
- C2. **외래 키 다시 확인** [확정]: 옛 표를 `DROP`하고 새 표를 `SET SCHEMA`하기 전에, 다른 모듈 표가 `catalog.book`·`book_contributor`·`holding`·`catalog_library_snapshot`을 가리키지 않는지 다시 봅니다. 2026-10-06 확인 뒤 바뀌었을 수 있습니다.
  - 구현 직전: dev changelog를 검색하고, `pg_constraint`에서 `confrelid`가 이 네 표인 외래 키를 조회합니다.
  - 실행 때 [안]: 바꿔 끼우기 직전에 같은 조회를 하고, `catalog`·`catalog_next` 밖의 외래 키가 있으면 바꿔 끼우지 않고 실패로 기록합니다.
  - `catalog` 안의 외래 키(`book_contributor_book_id_fkey`, `holding_book_id_fkey`)는 새 표끼리 다시 만듭니다.
- C3. Liquibase 형식 [확정]
  - 트리거·함수는 formatted SQL(`.sql`)로 씁니다. 첫 줄은 정확히 `--liquibase formatted sql`이고, changeset에 `splitStatements:false`, `runOnChange:true`를 붙이며, `CREATE OR REPLACE`로 씁니다(dev `CLAUDE.md`).
  - 나머지는 YAML입니다. CHECK가 필요하면 `sql` change를 씁니다.
- C4. `PRE_DEPLOYMENT`가 있으므로 이미 적용된 seed CSV를 고칠 수 있습니다(교보 11곳). 고친 뒤 로컬 `db`·`db-test`를 초기화해 다시 적용합니다. **초기화하면 `catalog`도 비므로 가져오기를 다시 해야 합니다**(1단계 실행 순서 참고).
- C5. 바꿔 끼우는 순간 말고는 `/books`, `/books/{id}`, 대출 현황 스트림이 기다리지 않아야 합니다 [확정]. 가져오기는 서비스와 다른 프로세스(`collection-import` 프로필)로 돌리고, 서비스는 켜 둔 채로 둡니다.
- C6. 외부 사이트를 확인할 때는 같은 사이트에 1건씩, 요청 사이 1초를 둡니다 [확정]. 도서관 조사(이름 고치기, 흡수된 학교)는 dev `CLAUDE.md` "Library Research Record" 규칙대로 `docs/library-maintenance.md`에 기록합니다.
- C7. 폰 설정 창을 바텀 시트로 바꿀 때 **지금 작은 창(팝오버) 코드를 지우지 않고**, 한 곳에서 되돌릴 수 있게 둡니다 [확정] (사용자: "일단 만들고 나서 내가 이전으로돌아가라고 하면 돌아가줘", 2026-10-06).
- C8. React에서 `dangerouslySetInnerHTML`을 쓰지 않습니다(새 안내 문구 포함).

## 개발 시작 전 확인

### dev가 확인할 것
- [ ] base package는 `com.chaekcheck`입니다(dev `CLAUDE.md`). 새 모듈은 없습니다.
- [ ] 사본 `ebook-catalog-2026-10-05-0745.sqlite`가 읽히는지 봅니다.
- [ ] 국가서지 TTL 파일이 지금 위치(`data/`)에 있는지 봅니다.
- [ ] C2 외래 키 확인(changelog 검색)
- [ ] 교보 11곳: `library/008-library-candidates.csv`와 `collection/002-collection-link.csv`에 각 11줄이 있습니다(plan이 2026-10-11에 셈). 가입 규칙 CSV와 로고 CSV에는 없습니다. 다시 확인합니다.
- [ ] 수집기(`chaekcheck-data`)가 지금 도는지 봅니다. 10단계 표시 작업의 순서를 정하는 데 씁니다.
- [ ] **0단계 기준 측정을 코드 변경 전에** 합니다. 바꾼 뒤에는 다시 잴 수 없습니다.

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 이름 고침 목록 승인: dev가 다시 검증한 새 이름 문자열·꼴 | 11단계 중 | 고칠 곳과 이름 |
| 흡수된 학교 7곳의 "주소 바꿈 / 끄기" 결정 | 11단계 확인 뒤 | 곳마다 할 일. **이번 사이클에는 바꾸지 않음** |
| 글꼴 서브셋 도구가 새 의존성이면 승인 | 7단계 전 | 승인 여부 |
| 바텀 시트를 써 보고 유지할지 되돌릴지 | 7단계 뒤 | 유지 / 되돌림 |
| 문구 [안] 확인: YES24 폰 안내, "고르는 즉시 저장돼요" | 12단계 화면 | 바꿀 점 |
| 메모리 측정표를 보고 고른 값 확인 | 9단계 뒤 | 승인 |

## 구현 단계

### 0단계: 기준 재기 (코드 변경 없음) (의존: 없음)

1. **응답·메모리 기준** (`research.md` 7절 1번)
   - DB
     - `SHOW shared_buffers, effective_cache_size, work_mem, maintenance_work_mem`
     - `docker stats`(db), WSL VM 메모리
     - `pg_statio_user_tables` 적중률
     - `pg_buffercache` 표별 쪽 수. 확장은 측정용으로 로컬 `db`에 손으로 `CREATE EXTENSION`하고, Liquibase에는 넣지 않습니다 [안]. 이미지에 들어 있는지는 [확인 필요: 실행해 봄].
   - 응답
     - `scripts/catalog/measure_books.py`(9질의 × 3조건 × 1·2쪽)를 데우기 1번 + 3회 돌려 첫 쪽 p50·p95를 냅니다.
     - 책 몇 권의 `holdingsOf`에 `EXPLAIN (ANALYZE, BUFFERS)`
   - Java(서비스): `jcmd <pid> GC.heap_info`, `VM.native_memory summary`(시작 때 `-XX:NativeMemoryTracking=summary`), `GC.class_histogram`
2. **계획 기준(AC-17)**: 아래 입력 묶음으로 지금 `planSearch` 결과(도서관 번호와 순서)를 저장합니다. 묶음은 dev가 정합니다 [안].
   - 지역 없음 / 거주 1 / 거주+직장
   - 직접 추가 없음 / 미조사 도서관 직접 추가
   - `scope=all` / `scope=joinable`
   - 로그인 전·후
3. 저장 위치: git 밖 `data/cycle08/` [안 경로]
- 위험: 낮음

### 1단계: 가져오기 단계별 시간 + 수집 기간 (지금 쓰기 방식 그대로) (의존: 0단계)

ADR-0065 "먼저 쓰기 단계 안의 시간을 나눠 잰 뒤"를 따릅니다. 바꿔 끼우기 코드보다 먼저 합니다.

1. **Liquibase** `collection/003-import-period-and-timings.yaml` [안 파일 이름. design-delta의 `004`는 번호 [안]이고, 지금 `collection/`에는 001·002만 있음]
   - `collection.catalog_import`에 칸 셋을 더합니다.
     - `collected_from timestamptz NULL`
     - `collected_to timestamptz NULL`
     - `step_seconds jsonb NOT NULL DEFAULT '{}'`
2. **시간 기록** (`collection/internal/importer/CatalogImporter.java`, `ImportReport.java`, `ImportRecords.java`, `catalog/CatalogLoad.java`의 `Result`, `catalog/internal/JdbcCatalogLoad.java`)
   - 키 [안]: `read`, `nb`, `normalize`, `match`, `write`, `index`, `analyze`, `swap`
   - 지금 방식에서는 쓰기 안을 조각 넷(두 번째 읽기, 임시 표 COPY, 맞대기, `TRUNCATE`~커밋 옮겨 쓰기)과 `VACUUM`으로 나눠 잽니다. 키 이름은 dev가 정해 보고합니다.
   - **`TRUNCATE`부터 커밋까지(검색이 멈춘 시간)를 따로 적습니다.**
   - `CatalogLoad.Result`에 단계별 시간을 더합니다(모양 [안]).
3. **수집 기간**: 가져오기에 들어간 도서관의 `collected_at` 최솟값과 최댓값입니다. 건너뛴 도서관은 뺍니다 [확정]. 값은 `catalog_library_snapshot`에 넣는 값과 같은 출처를 씁니다(AC-7).
4. **실행 순서**: 2단계(교보 11곳, DB 초기화)를 마친 **뒤에** 이 코드로 같은 사본을 한 번 가져옵니다(=**가져오기 #1**).
   - 전체 시간, 단계별 시간, 검색 멈춘 시간을 `# 사이클 08` 절에 적습니다.
   - 이것이 AC-8b의 이번 기준이고, 8단계 AC-10의 "kept" 비교 대상입니다.
   - 사이클 07 2회차 값(40분 36초, 쓰기 26분 55초)과 함께 적습니다.
- 테스트: 표본 가져오기 뒤 기록 줄에 `collected_from/to`가 스냅숏 최소·최대와 같음, `step_seconds` 키가 있음
- 위험: 낮음

### 2단계: DB 변경 파일 (의존: 0단계. 1단계와 나란히)

1. **교보 대여·혼합 11곳 지우기** [확정] (ADR-0067)
   - `scripts/library/build_candidate_seed.py`에 "교보 대여·혼합은 넣지 않음" 규칙을 더합니다. 뺀 이유별 셈에 이름을 붙입니다(예: `kyobo_rental_mixed` [안]).
     - 지금도 `crawl_skip`이 있으면 빠지므로, 10단계 표시가 끝나면 두 번 걸립니다. 규칙은 `crawl_skip`과 따로 둡니다 [안].
     - **등록 도서관(278곳, `library/008`의 `lending_model` UPDATE에 RENTAL·MIXED가 있는 곳)과 공공도서관 구독 21곳은 빼지 않습니다.** 대상은 후보 대여·혼합뿐입니다.
   - 스크립트를 다시 돌려 `library/008-library-candidates.csv`, `collection/002-collection-link.csv`에서 2664~2674 줄이 빠지는지 봅니다. diff가 그 22줄뿐이어야 합니다.
     - 다른 줄이 바뀌면 멈추고 보고합니다. 번호·이름은 처음 정한 대로 유지해야 합니다.
     - `RESTART WITH 2675`는 그대로 둡니다. 번호는 다시 쓰지 않습니다.
   - 로컬 `db`·`db-test`를 초기화해 다시 적용합니다(C4). 그 도서관을 직접 추가한 계정·브라우저의 번호는 꺼진 도서관처럼 건너뜁니다(사이클 06 규칙, 코드 변경 없음).
2. **`updated_at` 트리거** [확정] (ADR-0068)
   - 새 파일: `library/011-updated-at-trigger.sql`, `region/003-updated-at-trigger.sql` [안 파일 이름]. 함수는 `library.set_updated_at()`, `region.set_updated_at()` [안 이름]이고, `NEW.updated_at := now()`로 씁니다.
   - 트리거: `library.library`, `region.region`에 `BEFORE UPDATE FOR EACH ROW`. 형식은 C3을 따릅니다. 트리거도 다시 적용될 수 있게 `DROP TRIGGER IF EXISTS` 뒤 `CREATE` 또는 `CREATE OR REPLACE TRIGGER`로 씁니다(PG14부터).
   - master에서는 이번 사이클의 다른 UPDATE changeset(아래 3, 11단계 이름 고침)보다 **앞에** 둡니다. 그래야 그 UPDATE에도 시각이 찍힙니다.
   - 다른 스키마에 `updated_at` 칸이 있는지 changelog를 검색합니다(2026-10-11 plan 검색: `library`, `region` 둘뿐). 있으면 같은 방식으로 하고 보고합니다.
3. **`mobile_site_differs`** (`library/012-library-mobile-site-differs.yaml` [안])
   - `boolean NOT NULL DEFAULT false`를 더하고, dev `docs/library-site-issues.md` 10-1의 13곳을 번호로 `UPDATE`합니다.
   - `Library` 엔티티에 매핑합니다.
4. **국가서지 원문 표** (`collection/004-national-bibliography.yaml` [안])
   - `national_bibliography_record(id bigint PK, isbn13 text NOT NULL, title_raw text NOT NULL, author_raw text NULL, publisher_raw text NULL)`. 색인은 없습니다 [확정].
   - `national_bibliography_source(source_fingerprint text NOT NULL, built_at timestamptz NOT NULL)`. 항상 한 줄입니다.
5. **스킬 지침** (dev `.claude/skills/postgres-patterns/SKILL.md`): dev가 씁니다 [확정]. 아래 내용을 짧게 더합니다.
   - `updated_at` 칸을 두는 표에는 같은 changeset 묶음에서 `BEFORE UPDATE` 트리거를 함께 둡니다.
   - 함수는 모듈 스키마 안에 두고 formatted SQL로 씁니다.
   - 앱 코드에서 `updated_at`을 직접 적지 않습니다.
- 테스트
  - `UPDATE library.library SET enabled = enabled WHERE id = 1` 뒤 `updated_at`이 바뀜. `region.region`도 같음(AC-6)
  - `mobile_site_differs`는 13곳만 true(AC-20)
  - 2664~2674가 `library.library`와 `collection_link`에 없음
- 확인 방법: 초기화 → `./gradlew build` → `psql`로 `\d library.library`, `\d collection.*`, 트리거 목록 확인
- 위험: 중간 (seed 재생성 diff)

### 3단계: 국가서지 원문 남기기 (`collection`) (의존: 1·2단계)

(파일: `collection/internal/importer/NationalBibliography.java`, 원문 저장소 새 클래스 [안])
1. **지문** [확정 형식]: TTL 파일 이름, 크기(바이트), 고친 시각을 `|`로 잇습니다. TTL 파일이 여럿이면 파일마다 지문을 이어 붙입니다 [안].
2. **지문이 같으면**: TTL을 풀지 않고 원문 표를 처음부터 끝까지 읽습니다.
3. **지문이 다르거나 처음이면** [확정 순서]
   1. 지문 줄을 지우고 커밋합니다.
   2. 원문 표를 비운 뒤 TTL에서 뽑아 씁니다(COPY).
   3. **맨 마지막에** 지문 줄을 씁니다.
   - 2에서 멈추면 다음 가져오기가 처음부터 다시 풉니다.
4. 다듬기는 항상 지금 `catalog :: normalize` 규칙으로 원문에서 합니다. 규칙 판 번호는 두지 않습니다. 결과(키 → ISBN, 애매하면 없음)는 지금 TTL 경로와 같아야 합니다.
5. 시간 키: `nb`(원문 읽기 또는 TTL 풀기), `normalize`
- 테스트
  - 작은 TTL로 첫 실행: 표가 채워지고 지문은 마지막에 써짐
  - 두 번째 실행: TTL을 읽지 않음(파일을 못 읽게 해도 성공)
  - 파일 크기를 바꾸면 다시 풂
  - ②에서 실패를 주입하면 지문이 없음
  - TTL 경로와 원문 경로의 키 → ISBN 결과가 같음
- 위험: 중간

### 4단계: 새 표에 쓰고 바꿔 끼우기 (`catalog`) (의존: 1·2단계. 1단계 시간표를 보고 시작)

(파일: `catalog/internal/JdbcCatalogLoad.java`, `catalog/CatalogLoad.java` Javadoc. 공개 모양은 그대로 두고 결과에 단계별 시간을 더함)
1. **준비**
   - 남은 `catalog_next` 스키마가 있으면(지난 실패) 지우고 새로 만듭니다 [안].
   - 가져오기 세션에서만 `maintenance_work_mem`, `max_parallel_maintenance_workers`, 필요하면 `work_mem`을 올립니다(값 [확인 필요: 측정]). 서비스 설정은 바꾸지 않습니다.
2. **번호 잇기** (흐름 A)
   - 좁은 맞대기 표 `(library_id, item_key, load_book_id)`를 옛 `catalog.holding`과 맞대 책 번호를 정합니다(ADR-0062 규칙 그대로).
   - **소장 번호도 같은 맞대기에서 정합니다** [확정] (ADR-0070): 같은 (도서관, `item_key`)는 옛 `holding.id`를 쓰고, 새 소장만 옛 최대값 + 1부터 받습니다.
   - 새 책 IDENTITY = max(옛 최대값, 옛 시퀀스) + 1
   - 넓은 줄(소장 약 2천만)은 한 번만 쓰는 쪽을 권합니다(`research.md` 10-4 D-2) [안]. 방법은 1단계 시간표를 보고 정해 보고합니다.
3. **쓰기**
   - `catalog_next`에 네 표를 색인·제약 없이 만듭니다. 칸·기본값은 운영 표와 같게 하고, IDENTITY 시작값은 위 규칙을 따릅니다.
   - **소장은 책 번호 순으로** 씁니다(R8. 목표는 `pg_stats` `book_id` 상관도 0.9 이상 [확정]).
4. **색인·제약**
   - 운영 표 정의를 `pg_get_indexdef`·`pg_get_constraintdef`로 읽어 **같은 이름으로** `catalog_next` 표에 만듭니다. 내부 외래 키 둘과 `detail_url` 검사도 포함합니다.
   - 정의 문자열의 스키마 이름만 바꿉니다. 바꾸는 방법은 dev가 정합니다.
5. `VACUUM (ANALYZE)` `catalog_next` 네 표 (트랜잭션 밖)
6. **바꿔 끼우기** [확정]
   - C2 외래 키 조회를 합니다.
   - 짧은 트랜잭션: `SET LOCAL lock_timeout = '2s'` → 옛 네 표 `DROP` → `catalog_next` 네 표 `ALTER TABLE … SET SCHEMA catalog` → `catalog_next` 스키마 지움 → 커밋
   - 잠금을 못 얻으면 10초 쉬고 다시 합니다. 최대 5번입니다.
   - 값 근거: `lock_timeout` 기본 0은 한도 없음, https://www.postgresql.org/docs/18/runtime-config-client.html (2026-10-11 확인). 값은 측정 뒤 바꿀 수 있습니다.
   - 시간 키: `index`, `analyze`, `swap`(잠금을 기다린 시간 포함)
7. **실패 처리** [확정]
   - 바꿔 끼우기 전 어디서 실패해도(5번 다 못 얻음 포함) `catalog_next`를 지우고 옛 표는 그대로 둡니다.
   - `collection.catalog_import`에 실패를 남깁니다. 이유는 예: 잠금 못 얻음.
   - 기록 칸 모양(상태 칸을 더할지, `skipped_by_reason`에 넣을지)은 dev가 정해 보고합니다 [안].
8. **디스크**: 가져오는 동안 `pg_database_size`의 최대값을 적습니다.
- 테스트(`db-test`)
  - 표본 가져오기 두 번: 책·소장 번호가 이어짐. 새 소장은 옛 최대 + 1부터 받음. 빠진 소장 번호는 다시 쓰지 않음
  - 바꿔 끼운 표의 색인·제약·칸 목록이 Liquibase로 만든 새 DB와 같음(`pg_get_indexdef`·`pg_get_constraintdef` 비교)
  - 다른 세션이 `catalog.book`에 잠금을 오래 잡으면 → 5번 시도 뒤 실패, 옛 표 그대로, `catalog_next` 없음
  - 쓰기 중 실패를 주입하면 옛 표가 그대로 남음
  - 바깥 모듈 외래 키를 만들어 두면 바꿔 끼우지 않고 실패함(C2)
  - 가져오는 동안 다른 연결의 검색이 옛 결과를 줌
- 위험: **높음** (잠금, 정의 맞추기, 번호 잇기)

### 5단계: `availability` (의존: 2단계. 4단계와 나란히)

1. **`holding_not_found`** [확정] (ADR-0070)
   - 파일: `availability/internal/search/HoldingSession.java` `notFound`, `BookAvailabilityBatchStreamController.java`
   - 소장 번호가 지금 목록에 없으면 `holding_not_found`, 도서관이 없거나 꺼졌으면 `library_not_found`로 나눕니다.
   - Javadoc과 오류 문서도 고칩니다.
2. **`holdingsOf(bookIds, libraryIds)`** [안 이름] (ADR-0066)
   - `catalog/CatalogHoldings.java`에 더하고, `catalog/internal/JdbcCatalogHoldings.java`에서 `book_id = ANY AND library_id = ANY`로 읽습니다.
   - `BookAvailabilityStreamController`가 계획 도서관 번호를 넘깁니다.
   - 옛 `holdingsOf(bookIds)`는 쓰는 곳이 없으면 지웁니다 [안].
3. **503 `Retry-After: 5`** [확정] (`availability/internal/web/AvailabilityErrors.java` `server_busy`)
   - 묶음 스트림과 "더 보기"가 같은 응답을 씁니다.
   - 429는 nginx가 이미 `Retry-After 2`를 붙이므로 그대로 둡니다(`deploy/nginx/chaekcheck-locations.conf`).
4. **캐시** [확정 방향] (`fetch/CaffeineSearchPageCache.java`, `resolve/CaffeineDetailVerdictCache.java`, `config/AvailabilityProperties.java`, `application.yml`)
   - 두 캐시에 `recordStats()`를 켭니다.
   - 상한 설정을 캐시마다 나눕니다(지금 `cache-max-size` 하나). 값은 지금 1,000 그대로 시작합니다.
   - 몇 분마다 [안: 5분] 적중률, 항목 수, 내보낸 수를 로그로 씁니다. 비동기 캐시에서 통계를 읽는 방법(`synchronous().stats()`)은 [확인 필요: Caffeine javadoc].
   - 무게 상한은 쓰지 않습니다 [확정].
5. **본문 복사 줄이기** [확정 방향, 방법 안]
   - `fetch/BodyLimit.java`: `Content-Length`가 있으면 그 값(4MB 상한 안)으로 처음 크기를 정하고, 다시 복사하지 않게 합니다.
   - `fetch/FetchServiceSiteFetcher.java`: 조회 서버 응답의 본문을 문자열을 거치지 않고 `byte[]`로 받습니다. 예: Jackson이 Base64 칸을 `byte[]`로 바로 읽음 [안].
   - `fetch-service/`는 바꾸지 않는 것을 기본으로 합니다. 바꿔야 하면 보고합니다.
- 테스트
  - 다음 묶음에 없는 소장 번호 → `holding_not_found`, 꺼진 도서관 → `library_not_found`
  - `holdingsOf`가 계획 밖 도서관 줄을 주지 않음, 스트림 결과는 이전과 같음
  - 503 응답에 `Retry-After: 5`(AC-18. 기존 `EbookSearchStreamControllerTests`, `LibraryEbookControllerTests`에 더함)
  - 같은 fixture로 바꾸기 전과 판정·결과가 같음(4MB 넘는 본문 자르기, `Content-Length` 없음·틀림 포함)(AC-19)
  - 캐시 통계가 켜졌는지
- 위험: 중간

### 6단계: `library` (의존: 2단계. 4·5단계와 나란히)

1. **`planSearch`** (`library/internal/LibraryService.java` 76행~, 저장소)
   - 켜진 도서관 중 `join_survey IN ('SURVEYED','NOT_FOUND') OR id = ANY(:chosen)`만 읽고, 가입 규칙도 그 도서관 것만 읽습니다 [확정] (ADR-0066).
   - 켜짐은 요청마다 읽습니다(ADR-0004).
   - `eligibilityFor`(`GET /api/v1/libraries`)는 S10 이름 찾기에 필요하므로 지금처럼 전부 읽습니다.
2. **`mobileSiteDiffers`** [안 이름]: `LibraryEligibility`, `SearchTarget`, `availability/internal/search/StreamEvents.java`(`targets.libraries[]`), `LibraryListController`
- 테스트
  - 0단계 2의 입력 묶음에서 계획 결과(번호·순서)가 같음(AC-17)
  - 미조사 도서관은 직접 추가했을 때만 나옴(사이클 07 회귀)
  - `mobileSiteDiffers`가 두 API에 나옴
- 위험: 중간 (세 검색이 함께 씀)

### 7단계: 웹 (의존: 5·6단계)

1. **검색 설정 기억** (`web/src/features/search/searchSettings.ts`, 쓰는 곳)
   - `SearchPrefs`에서 `sort`·`exact`·`roles`를 빼고, 읽을 때 남아 있으면 `chaekcheck.searchSettings.v1`에서 지웁니다(AC-1, AC-2).
   - 주소에 값이 있으면 그대로 이깁니다.
2. **막힘 안내** (API 오류 처리, `SearchPage` 쪽) [확정 문구]
   - 429: "검색을 너무 자주 했어요. 1분쯤 뒤에 다시 해 주세요."
   - 503: "지금 찾는 사람이 많아요. 잠시 뒤에 다시 해 주세요."
   - 결과 자리 위에 안내 줄 하나를 둡니다. 받은 결과는 지우지 않고, 다시 검색 버튼은 두지 않습니다.
3. **YES24 폰 안내**: `mobileSiteDiffers`이고 폭 640px 이하일 때만 보입니다. 링크는 막지 않습니다.
   - 자리 [확정]: 결과 카드 이름 아래, S3 책 화면 줄, 직접 찾기 결과, 가입 정보 창 첫 화면 링크 옆
   - 문구: "폰에서는 사이트가 다른 화면을 보여요. PC에서 열어 주세요" [안]
   - "확인 실패"여도 안내는 보입니다.
4. **빠진 책·소장** [확정 문구]
   - `web/src/features/book/BookPage.tsx` `book_not_found`: "책을 찾을 수 없어요" 아래 "도서관 목록을 새로 받으면서 빠진 책일 수 있어요. 다시 검색해 주세요.", 그 아래 "처음으로"
   - 책 화면 줄의 `holding_not_found`: "이 도서관 목록에서 빠졌어요"
5. **화면 질문 여섯** (`flow.md` "검토 결과")
   - 폰 설정 창 → 바텀 시트(손잡이, 바깥 누름·아래로 끌기로 닫힘, 내용·순서 그대로). `SettingsPanel.tsx`의 팝오버는 **남기고**, 한 상수·한 곳으로 되돌릴 수 있게 합니다(C7). 되돌리는 방법을 `# 사이클 08` 절에 적습니다.
   - 폰 직접 찾기 정렬 자리: 흐린 "정렬 없음 ⓘ". 누르면 "도서관 사이트 검색에서는 정렬을 쓸 수 없어요"
   - 상태 칸 색: "대출 중 · 예약", "확인 실패", "대출 정보 조회 중", "대출 가능 여부 확인 필요"를 `--brand-faint`(연보라)로. 예약 묶음의 연주황은 그대로
   - 카드 전체 링크: 그대로
   - S8·S9: 맨 아래 오른쪽 "← 돌아가기"(이전 화면, 없으면 S1)
   - S10·S2: 오른쪽 아래 "← 돌아가기" + 제목 옆 ⓘ "고르는 즉시 저장돼요". 로그인 전 "이 브라우저에", 로그인 뒤 "계정에" [안 문구]
   - 글꼴: 나눔바른고딕을 자주 쓰는 한글만 담아 줄이고, **다른 글꼴 이름**으로 둡니다 [확정].
     - 서브셋 도구가 새 의존성이면 먼저 승인받습니다.
     - OFL 예약 이름 여부는 [확인 필요: 네이버 나눔글꼴 라이선스 원문].
     - 줄이기 전후 파일 합을 적습니다(AC-13).
- 테스트(Vitest): 저장·지움(AC-1, AC-2), 429·503 문구와 결과 유지(AC-3), 폰 안내 폭·대상(AC-4), 두 빠짐 문구(AC-8c 화면 쪽), 바텀 시트·팝오버 전환, 돌아가기(이전 기록 있음/없음)
- 위험: 중간

### 8단계: 같은 사본으로 바꿔 끼우는 가져오기와 확인 (의존: 1~7단계)

서비스를 켠 채로 가져오기 **#2**를 돌립니다. 같은 사본이고, 새 코드입니다.
1. **AC-8**: 가져오는 동안 `/api/v1/books?title=사랑` 첫 쪽(지역 없음)을 계속 부릅니다(간격 [안]). p95가 1초 안이어야 합니다. 바꿔 끼우는 순간 검색·책 화면 요청의 5xx와 끊김이 0건이어야 합니다.
2. **AC-8b**: 전체 시간과 검색이 기다린 시간(=`swap`)을 사이클 07 2회차(40분 36초)와 가져오기 #1과 비교합니다. 목표는 기다림 10초 안, 전체는 더 짧게입니다 [확정].
3. **AC-8c**: 바꿔 끼우기 전에 책 화면을 열어 받은 소장 번호로, 바꿔 끼운 뒤 다음 묶음을 부릅니다 → 모두 정상이어야 합니다. 빠진 소장 화면은 `db-test`에서 줄을 지워 재현합니다.
4. **AC-10**
   - kept가 가져오기 #1의 책 수와 같고 new·dropped = 0이어야 합니다.
   - 사이클 07 2회차 1,617,445와의 차이(교보 11곳을 빼서 생긴 것)를 보고합니다.
   - `pg_stats`에서 `catalog.holding.book_id` 상관도가 0.9 이상이어야 합니다.
5. **AC-9**: 두 가지로 실패시킵니다. 둘 다 검색 결과가 가져오기 전과 같고 `catalog_next`가 남지 않아야 합니다.
   - 시작 때 실패(사본 경로를 틀리게)
   - 색인 단계에서 프로세스를 멈춤
6. **AC-15**: 두 번째 가져오기의 `nb` 시간이 6.5~9분보다 짧아야 합니다. 지문 순서는 3단계 테스트로 봅니다.
7. **AC-21** [확인 필요: 프로토타입]: 바꿔 끼우기 **전에** 서비스의 Hikari 연결에서 같은 검색을 여러 번 돌려, 드라이버가 서버 준비 문장을 쓰게 합니다. 바꿔 끼운 뒤 같은 연결로 검색해 새 표 결과가 나오는지 봅니다.
   - 근거: PostgreSQL은 쓰는 객체에 정의 변경이 있으면 준비된 문장을 다시 분석·계획한다고 적고 있습니다, https://www.postgresql.org/docs/18/sql-prepare.html (2026-10-11 확인).
   - 오류(예: 계획 결과 형식이 바뀌었다는 오류)가 나면 멈추고 보고합니다.
8. **잠금 줄 서기** [확인 필요: 프로토타입]
   - 긴 `SELECT`가 잠금을 잡은 동안 바꿔 끼우기가 기다릴 때, 그 뒤에 온 검색도 줄을 서는지 봅니다.
   - `lock_timeout` 2초 안에 줄이 풀리는지와 실제 잠금 시간을 잽니다.
9. 디스크 최대 사용량, `step_seconds` 전체, `pg_total_relation_size`(표·색인)를 기록합니다.
- 위험: 높음

### 9단계: 메모리 측정과 줄이기 (의존: 8단계. 소장 줄이 붙은 뒤에 해야 함)

순서는 `research.md` 7절 [확정 순서·기준]입니다. 단계마다 같은 측정 묶음을 쓰고, 데우기 1번 + 3회로 첫 쪽 p50·p95, 책 화면 `holdingsOf` 버퍼를 냅니다.
1. **설정 자리** (`compose.yaml` `db`) [확정 자리]
   - `command:`에 `-c 이름=${환경 변수:-기본값}` 꼴로 `shared_buffers`, `effective_cache_size`, `work_mem`을 둡니다.
   - **Dockerfile `CMD`를 덮으므로 `-c shared_preload_libraries=pg_bigm`을 반드시 함께 둡니다.**
   - 기본값은 처음에는 지금 실제 값(0단계 `SHOW`)으로 두어 동작이 바뀌지 않게 하고, 끝나면 고른 값으로 바꿉니다 [안].
   - 환경 변수는 `.env.example`에 적습니다. `db-test`는 그대로 둡니다 [안].
2. **기준 다시 재기**: 줄 붙이기 뒤의 기준을 잽니다. 0단계 값과 함께 적습니다.
3. **`shared_buffers` 단계로 낮추기**: 예: 지금 → 4GB → 2GB → 1GB → 512MB → 256MB [안]. 단계마다 재시작, 데우기, 측정을 합니다. 컨테이너 상한은 두지 않습니다.
4. **컨테이너 상한 낮추기**
   - 3에서 고른 값으로 고정하고 `mem_limit`을 단계로 낮춥니다. `effective_cache_size`도 함께 낮춥니다.
   - `mem_limit`·`shm_size: 128mb`는 **측정 동안에만** compose에 두고 커밋하지 않습니다 [확정].
   - OOM이 나면 그 단계는 "못 씀"으로 적고 앞 단계로 돌아갑니다.
5. **`work_mem`**: `EXPLAIN`에 `external merge`·디스크 정렬이 보일 때만 올립니다.
6. **캐시**: 통계 로그로 적중률·항목 수를 보고, `GC.class_histogram`으로 캐시 값 바이트를 봅니다. 그 값으로 캐시마다 상한을 정합니다. 같은 질의를 3분 안에 반복하면 적중률이 실제보다 높게 나오는 점을 결과에 함께 적습니다. 상한을 바꾸면 ADR-0006 값이 바뀌므로 보고합니다.
7. **Java 힙**
   - 서비스는 `-Xmx`를 단계로 낮추며 같은 측정 + GC 시간을 봅니다. 자리는 `backend/build.gradle` bootRun과 `.claude/launch.json`입니다.
   - 가져오기는 실행 명령의 `-Xmx`를 따로 단계 시험합니다. 지금 8GB입니다(AC-12).
8. **멈추는 기준** [확정]: 첫 쪽 p95가 1초를 넘거나 기준보다 20% 넘게 늘어나는 **첫 단계의 바로 앞 단계**를 고릅니다.
9. 결과: "줄이기 전 / 뒤" 표 하나(AC-11)
   - 표에 넣을 것: DB 설정, 컨테이너 메모리, 버퍼 적중률, 표별 버퍼, Java 힙, 두 캐시의 항목 수·적중률·바이트, p50·p95
   - 고른 값을 compose·실행 설정 기본값으로 둡니다. 로컬 PC(WSL2, 32GB) 기준 값이라고 적습니다.
- 위험: 중간 (측정 시간이 김)

### 10단계: 데이터 폴더와 dev 문서 (의존: 없음. 아무 때나)

1. **교보 대여·혼합 표시** (`chaekcheck-data` 수집 DB `ebook-catalog.sqlite`. plan은 하지 않음)
   - 230곳에 `crawl_skip` 표시를 합니다. 이유는 "교보 대여·혼합 제외" [안 값]이고, 줄은 지우지 않습니다. 남은 202곳 수집은 멈춥니다 [확정].
   - 대상은 `kyobo-institutions-probe-2026-10-03.tsv`의 `library_model` 대여·혼합으로 골라 셉니다. 230과 다르면 멈추고 보고합니다.
   - 수집기가 돌고 있으면 쓰기 충돌이 없게 멈춘 뒤나 쉴 때 합니다 [확인 필요: 수집기 상태].
   - 사본 `snapshots/…0745.sqlite`는 건드리지 않습니다.
   - 기록: dev `docs/maintenance/2-crawl.md`, `docs/library-site-issues.md`
2. **도서관 411** [확정]: 수집 DB 주소를 `https://gsenc.bookcube.biz/FxLibrary`로 고치고 다시 수집합니다. 411은 서비스 번호이므로 수집 번호는 `collection_link`로 찾습니다. 서비스에 다시 들어오는 것은 다음 사본 때입니다.
3. **`docs/maintenance/1-libraries.md`**: "확인" 단계에 "리다이렉트 뒤 최종 주소(호스트)를 확인해 그 주소로 넣음"을 더합니다.
4. **`docs/maintenance/3-import.md`** [확정] (ADR-0069, AC-16)
   - 바꿔 끼우기 흐름, 실패 처리, `step_seconds` 읽는 법, 결과 표(8단계 값)
   - 아래 표를 그대로 넣습니다.

| 상황 | 할 일 |
|---|---|
| 새 사본으로 갱신 (규칙 그대로) | 가져오기 → 바꿔 끼우기. 서비스는 그대로 |
| 묶기·대표값·날짜 규칙을 고침 | 새 코드로 가져오기 → 바꿔 끼우기. 서비스는 그대로 |
| 검색어 다듬기 규칙을 고침 | 옛 서비스 켜 둔 채 새 코드로 가져오기 → 바꿔 끼우자마자 서비스를 새 코드로 다시 켬 |

- 위험: 낮음

### 11단계: 이름 고치기와 흡수된 학교 (의존: 2단계. 사용자 답 필요)

1. **이름 다시 검증**: 아래 곳마다 공식 출처와 사이트 제목을 다시 열어 새 이름 문자열과 근거를 확인합니다(C6).
   - 대상: `name-changes-2026-10-10.md` 2절의 434, 456, 2264, 2563, 2611, 2161, 1079와 오타 1016
   - 새 이름의 꼴(예: "경상국립대학교"인지, 라벨이 붙는지)은 [확인 필요: 사용자 확인]입니다.
   - 확인한 목록을 사용자에게 보이고 곳마다 답을 받습니다. 1203·408은 바꿀 것이 없습니다.
2. **목록 파일** `scripts/library/name_overrides.tsv` [안 경로]
   - 칸 [확정]: `library_id`, `old_name`, `new_name`, `changed_on`, `source_url`, `checked_on`
   - seed 생성 스크립트가 이 목록을 읽어 다음 seed에서도 새 이름을 유지합니다. 목록에 없는 이름은 바꾸지 않습니다.
   - 적용하는 스크립트는 `build_candidate_seed.py`입니다 [확정] (사용자 승인, 2026-10-11, 인계서 검토). 대상이 모두 후보 번호(≥ 281)입니다. 이 스크립트는 "이미 있는 후보는 번호와 이름을 그대로 둔다"(21행) 뒤에 목록을 덮어써야 합니다.
3. **changeset** `library/013-library-name-overrides.yaml` [안]: 이미 적용된 seed는 고치지 않고 번호로 `UPDATE`합니다. `library.name` UNIQUE 위반이 없는지 봅니다.
4. **흡수된 학교 7곳**(428, 429, 769, 2257, 607, 895, 1002) [확정 방법]
   - 이름은 고치지 않습니다. 사이트가 따로 도는지만 봅니다. 895는 682와 같은 사이트인지도 봅니다.
   - 곳마다 "주소 바꿈(새 주소) / 끄기 / 그대로" 제안 목록과 근거를 사용자에게 보입니다.
   - **이번에는 바꾸지 않고 보고만 합니다.**
5. 기록: `docs/library-maintenance.md`에 방법, 출처 URL, 확인일, 사용자 결정을 적습니다(dev 규칙).
- 테스트: seed 스크립트가 목록을 읽어 이름을 바꾸고 번호는 그대로 둠, 목록에 없는 이름은 그대로임. 적용 뒤 S10 이름 찾기에 새 이름으로 나오고 옛 이름으로는 안 나옴(AC-5)
- 위험: 낮음

### 12단계: 전체 확인 (의존: 1~11단계)

- Playwright로 1280 → 768 → 375 → 320 폭을 봅니다.
  - S1: 막힘 안내, 폰 안내, 상태 칸 색, 정렬 없음 ⓘ, 바텀 시트
  - S3: 빠짐 문구
  - S8·S9·S10·S2: 돌아가기와 ⓘ
  - 글꼴
- 사용자 확인: 바텀 시트 유지·되돌림, 문구 [안]
- 아래 AC 표의 결과를 `# 사이클 08` 절에 적습니다.

## 테스트

- 단위
  - 설정 저장과 지움
  - 지문 비교와 원문 다듬기
  - 소장 번호 정하기
  - `BodyLimit`
  - 캐시 설정
  - 이름 고침 목록 읽기(Python 테스트)
- 통합(`db-test`)
  - `ModularityTests`(의존 방향 그대로, `CatalogHoldings` 공개 메서드 변경), `DocumentationTests`
  - 트리거, `mobile_site_differs`, 교보 11곳 없음
  - 바꿔 끼우기: 번호 잇기, 정의 비교, 잠금 실패, 중간 실패, 바깥 외래 키 가드
  - 국가서지 원문
  - `holding_not_found`, `holdingsOf(bookIds, libraryIds)`, 503 `Retry-After`
  - `planSearch` 결과 비교
  - 사이클 05~07 기존 테스트 전부
- 웹(Vitest): 7단계 항목
- 실데이터: 0·1·8·9단계
- 화면: Playwright 1280/768/375/320

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 설정 기억(정렬·완전 일치는 안 남음) | Vitest + Playwright | 7, 12 |
| AC-2 옛 저장값 지움 | Vitest(옛 형식 저장값으로 시작) | 7 |
| AC-3 429·503 문구 | Vitest + 수동(nginx 로컬 또는 상한 낮춤) | 7, 12 |
| AC-4 YES24 폰 안내(375에서만, 13곳만) | Vitest + Playwright | 7, 12 |
| AC-5 고친 이름, 번호 유지 | seed 테스트 + 수동(S10) | 11, 12 |
| AC-6 `updated_at` 트리거 | 통합 | 2 |
| AC-7 수집 기간 = 스냅숏 최소·최대 | 통합 + 실데이터 SQL | 1, 8 |
| AC-8 가져오는 동안 첫 쪽 p95 1초, 바꿀 때 5xx 0 | 실데이터 측정 | 8 |
| AC-8b 전체·기다린 시간이 사이클 07 2회차보다 짧음, 기다림 10초 안 | `step_seconds` 비교 | 1, 8 |
| AC-8c 옛 소장 번호 요청 정상, 빠진 소장·책 문구 | 통합 + Vitest + 실데이터 | 4, 5, 7, 8 |
| AC-9 실패하면 결과 그대로 | 통합(실패 주입) + 실데이터 두 경우 | 4, 8 |
| AC-10 kept·new·dropped, 상관도 0.9 이상 | 실데이터 SQL | 8 |
| AC-11 메모리 측정표, p95 1초, 기준 대비 20% 안 | 측정표 | 0, 9 |
| AC-12 고른 Java 힙으로 가져오기 끝까지 | 실데이터 | 9 |
| AC-13 화면 질문 여섯, 글꼴 파일 합 감소 | Playwright 4폭 + 파일 크기 | 7, 12 |
| AC-14 회귀(빌드, 측정 묶음 결과 목록 같음) | `./gradlew build`, `npm` 세 명령, `measure_books.py` 결과 비교 | 모든 단계, 8 |
| AC-15 국가서지 원문 재사용과 순서 | 통합 + 실데이터(`nb` 시간) | 3, 8 |
| AC-16 정리 규칙 바꿀 때 순서가 `3-import.md`에 | 문서 확인 | 10 |
| AC-17 계획 결과 같음 | 0단계 기준과 비교 | 0, 6 |
| AC-18 503 `Retry-After: 5` | 통합 | 5 |
| AC-19 본문 복사 줄인 뒤 결과 같음 | fixture 비교 | 5 |
| AC-20 `mobile_site_differs` 13곳만 true | 통합 | 2 |
| AC-21 바꿔 끼운 뒤 풀 연결의 준비 문장이 새 표를 봄 | 프로토타입 | 8 |

## 완료 기준

- [ ] spec AC-1~AC-21(AC-8b, AC-8c 포함)을 위 표의 방법으로 모두 확인함
- [ ] `backend/`에서 `./gradlew build` 통과(`ModularityTests`의 모듈 검증, `DocumentationTests` 포함)
- [ ] `web/`에서 `npm test`, `npm run build`, `npm run lint` 통과, 1280/768/375/320 확인
- [ ] 가져오기 #1(지금 방식)과 #2(바꿔 끼우기)의 `step_seconds`, 검색 멈춘 시간, 디스크 최대값을 `# 사이클 08` 절과 `3-import.md`에 적음
- [ ] 메모리 "줄이기 전 / 뒤" 표, 고른 값을 compose·실행 설정 기본값으로 반영함. `mem_limit`·`shm_size`는 커밋하지 않음
- [ ] 교보 11곳 삭제 diff 확인, 로컬 DB 초기화·재적용, 수집 DB 230곳 표시
- [ ] `postgres-patterns` 스킬 지침, `1-libraries.md`·`3-import.md` 갱신
- [ ] 이름 고침 목록과 changeset(사용자가 고른 곳만), 흡수된 학교 제안 목록을 사용자에게 전달함
- [ ] 바텀 시트를 되돌리는 방법을 기록함
- [ ] [확인 필요] 결과와 설계와 달라진 점을 `# 사이클 08` 절에 적음

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 결과에 따라 | 막는 단계 |
|---|---|---|---|
| 바꿔 끼운 뒤 Hikari 풀 연결의 준비 문장이 새 표를 보는지(AC-21) | 프로토타입 | 안 되면 멈추고 보고 | 8 |
| `DROP`·`SET SCHEMA`를 기다리는 동안 뒤에 온 검색이 줄을 서는지, 실제 잠금 시간, `lock_timeout` 2초·5번이 맞는지 | 공식 문서(PG18 explicit-locking) + 프로토타입 | 값을 바꾸면 보고 | 8 |
| 쓰기 단계 조각별 시간 → 더 고칠 곳(두 번째 읽기, 7% 안 읽기, 넓은 줄 한 번 쓰기, 국가서지 병렬) | 1단계 측정 | 가장 느린 곳만 고치고 보고 | 4 |
| pg_bigm 색인(`gin_bigm_ops`)을 나중에 만들 때 시간·병렬 여부 | 프로토타입 | 보고 | 4 |
| 가져오기 세션 `maintenance_work_mem` 등 값 | 측정 | 보고 | 4 |
| 국가서지 원문 크기와 다시 읽는 시간 | 프로토타입 | 보고 | 3 |
| 바꿔 끼우는 동안 디스크 최대 사용량 | `pg_database_size` | 보고 | 8 |
| 바깥 모듈 외래 키 없음(C2) | changelog + `pg_constraint` | 있으면 멈추고 보고 | 4 |
| 비동기 캐시 통계 읽기(`synchronous().stats()`) | 공식 문서(Caffeine javadoc) | 보고 | 5 |
| 캐시 한 칸 바이트, 적중률, 캐시마다 상한 값 | 측정 | ADR-0006 값 변경을 보고 | 9 |
| `pg_buffercache` 확장 사용 가능 여부 | 실행해 봄 | 안 되면 `pg_statio`만 | 0 |
| cgroup v2 상한에 페이지 캐시가 포함되는지, `/dev/shm`과 병렬 쿼리 | 공식 문서 + 프로토타입 | 보고 | 9 |
| DB·Java 메모리 단계 값과 고른 값 | 측정(멈추는 기준) | 표로 보고 | 9 |
| 교보 대여·혼합 대상 수 230, 수집기 상태 | probe TSV 대조, 수집기 확인 | 다르면 멈춤 | 10 |
| 이름 고칠 새 이름 문자열·꼴 | 출처 재검증 → 사용자 | 사용자 답대로 | 11 |
| 흡수된 학교 7곳 처리 | 사이트 확인 → 사용자 | 이번에는 보고만 | 11 |
| 나눔바른고딕 OFL 예약 이름, 서브셋 도구 의존성 | 공식 라이선스 원문, 사용자 승인 | 다른 글꼴 이름은 [확정] | 7 |
| 국가서지 지문이 TTL 파일 여럿을 덮는 방법 | dev 확인 | 보고 | 3 |
| 가져오기 실패 기록 칸 모양 | dev가 정함 | 보고 | 4 |

## 이번에 하지 않는 것

- 배포, 운영 설정, 운영 서버용 메모리 값(운영 서버가 정해지면 다시 잼), `PRE_DEPLOYMENT` 지우기
- 요청 제한 숫자 확정, 실제 사용자 IP 받기(배포 때). nginx 429 설정은 바꾸지 않음
- 새 사본으로 가져오기, 후보 도서관 더 넣기(411을 서비스에 다시 넣는 것 포함), 정해진 때마다 자동 갱신, 도서관 단위 부분 갱신, 수집기를 서비스로 옮기기, 책 묶기 기준 다시 보기
- 흡수된 학교 7곳의 주소 변경·끄기(사용자 답을 받아 다음에 함)
- 옛 이름으로도 찾기
- 이름 고침 목록 밖의 회사·학교 개명 전수 확인
- 교보 공공도서관 구독 21곳·소장형 1,182곳 변경, 등록 도서관의 `lending_model` 변경
- Redis 등 바깥 캐시, 캐시 무게 상한, Actuator·Micrometer
- 소장 표 나누기, 상세 주소 저장하지 않기(DB 메모리 안 4·5), 가져오기용 고유 색인 없애기
- 도서관 목록(`GET /libraries`) 메모리 기억(ADR-0004 유지)
- 구독형 한도 알리기, 알림, 회원 데이터의 책 번호 고쳐 쓰기, 도서관 수집 기간
- `fetch-service/` 변경(필요해지면 보고)

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 08`** 절에 **무엇이 달라졌는지와 이유**를 적습니다. 사용자 발언이면 그대로 옮깁니다.

- 사용자 답: 이름 고침 목록, 흡수된 학교 7곳 제안과 답, 글꼴 도구 승인, 바텀 시트 유지·되돌림, 문구 [안] 수정, 메모리 고른 값 승인
- 측정
  - 가져오기 #1·#2의 `step_seconds` 전체, 검색 멈춘 시간, 디스크 최대값, 표·색인 크기
  - AC-8 가져오는 동안의 p95, AC-10 숫자와 상관도
  - 메모리 "줄이기 전 / 뒤" 표, 캐시 통계와 고른 상한, 서비스·가져오기 `-Xmx`
- [확인 필요] 표 각 행의 결과. 특히 다음은 꼭 적습니다.
  - AC-21 준비 문장
  - 잠금 줄 서기
  - pg_bigm 색인 시간
  - 국가서지 원문 크기
- 정한 이름과 방법
  - `catalog_next`, `step_seconds` 키, 수집 기간·국가서지 표·트리거 함수·changelog 파일 이름과 번호
  - `holdingsOf` 모양, 캐시 설정 이름, 환경 변수 이름
  - 실패 기록 칸, 지문 형식
  - 넓은 줄을 한 번 쓰는 방법, 소장 정렬 방법
  - 바텀 시트 되돌리는 방법
  - 이름 고침 목록을 읽는 스크립트
- 설계와 달라진 점, 새로 알게 된 제약
  - 교보 11곳을 뺀 뒤 책 수 차이
  - `SET SCHEMA`·정의 복사에서 막힌 점
  - 본문 복사를 줄이려고 `fetch-service`를 고쳐야 했는지
  - 계획 비교(AC-17)에서 다른 점
- AC 확인표(12단계)
