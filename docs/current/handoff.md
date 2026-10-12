# 개발 인계서: 사이클 11 가져오기 따로 하기 + 가져오기 힙 줄이기

> **알림 (2026-10-12, 사이클 14 미리 함)**: plan이 사이클 14(인기 도서 → 사서추천도서, 국립중앙도서관 Open API, 새 모듈 `picks`, `popular` 지움)를 미리 설계·인계했습니다. **사이클 12·13 개발이 끝나고 커밋된 뒤에** 시작하세요. 인계서: plan `docs/cycles/14-librarian-picks/handoff.md` (`../chaekcheck-plan/docs/cycles/14-librarian-picks/handoff.md`)

> **알림 (2026-10-12, 사이클 13 미리 함)**: plan이 사이클 13(수집기 dev로 갈아타기 + 새 도서관 넣기 명령 `library-insert`, `library`의 `LibraryRegistry`, 반영 파일 판 2, `/about` 가입 조사 기준일 한 줄)을 미리 설계·인계했습니다. **사이클 12와 나란히 따로 뺀 작업 폴더와 따로 띄운 DB 묶음(`chaekcheck-13`, 포트 5442~5444)에서 1~8단계**를 하고, 실데이터·main 합치기는 11·12가 합쳐진 뒤입니다. 사이클 14는 13 뒤입니다. 인계서: plan `docs/cycles/13-crawler-to-dev/handoff.md` (`../chaekcheck-plan/docs/cycles/13-crawler-to-dev/handoff.md`)

> **알림 (2026-10-12)**: 사이클 12(책 묶기 기준 다시 보기) 인계서는 plan `docs/cycles/12-grouping-rules/handoff.md`에 따로 있습니다. 사이클 12는 별도 worktree에서 진행합니다. 사이클 11 작업은 이 인계서대로 계속하면 됩니다.

- 승인: [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-handoff-review.html` #3). plan이 사이클 폴더(`docs/cycles/11-separate-import/handoff.md`)에 둡니다. `docs/current/handoff.md`에 바꿔 넣는 것은 사이클 10 개발 결과를 본 뒤입니다.
- **시작 조건** [확정] (scope, design-delta 상태 줄, 사용자 승인 2026-10-12 `easy/2026-10-12-design-delta.html` #2)
  - 사이클 10 dev(인기 도서)가 **끝나고 커밋된 뒤에** 시작합니다. 작업 폴더, 로컬 DB(`db` 5432, `db-test` 5433)가 같고 worktree는 따로 만들지 않습니다.
  - plan이 사이클 10 회고(2026-10-12, `docs/cycles/10-popular-books/retro.md`)를 마치고 이 인계서를 `docs/current/handoff.md`에 바꿔 넣었으며, `docs/current/`에 사이클 11을 "설계됨(미구현, 사이클 11)"으로 합쳤습니다 [확정] (사용자 승인, 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-retro-decisions.html` #5). 인기 도서 화면 디자인 다듬기는 사이클 밖이고, 그 작업이 커밋된 뒤 시작합니다.
  - `collection` changeset 번호는 시작할 때 dev의 마지막 `collection` changeset을 보고 정합니다. plan이 2026-10-12에 읽었을 때는 `collection/004-national-bibliography.yaml`까지 있었으므로 지금 기준 다음 번호는 005입니다.

- **사이클 10 결과에서 이 사이클에 닿는 것** (dev `docs/plan-feedback.md` `# 사이클 10`, plan 확인 2026-10-12. 사이클 10 회고 때 다시 맞춤)
  - 인기 도서 받기는 `collection-import` 프로필에서 꺼짐(`application-collection-import.yml` 14-15행). 그래서 `export`·`apply`·`finish`·`discard`는 진짜 사이트를 부르지 않음. 다만 7단계에서 `db-ops`에 붙여 띄우는 서비스(기본 프로필)는 로컬 `.env`의 `CHAEKCHECK_POPULAR_FETCH_ENABLED=false`를 그대로 써야 함(기본값은 true라 켜지면 시작 받기가 진짜 사이트를 부름)
  - db-test 연결 한도 100에 테스트 문맥 수가 걸림(문맥마다 연결 4개, 사이클 10에서 "too many clients"). 새 테스트 클래스(`CatalogTransferTests`, `CatalogImportModesTests` 등)는 기존 설정과 같은 문맥을 쓰거나 `@DirtiesContext`로 닫음
  - `popular`는 `catalog.BookLookup.byIsbn13`으로 책 번호를 찾고 공용 캐시를 10분마다 새로 고침. `catalog` 표를 외래 키로 가리키지 않으므로 바꿔 끼우기의 바깥 외래 키 검사에 걸리지 않음. 바꿔 끼운 뒤 새로 생기거나 사라진 책 번호는 다음 캐시 새로 고침(최대 10분)까지 인기 도서에 늦게 보일 수 있음(받아들임, 이번에 고치지 않음)
  - master changelog 맨 끝은 `popular/001-popular-schema.yaml`. 사이클 10 디자인 다듬기는 끝남(dev `b214645`, 2026-10-12, plan 회고 덧붙임). 그래도 번호·줄 번호는 시작 때 다시 봄. 사이클 10 dev가 끝날 때 작업 폴더에 다른 세션의 수정(`docs/maintenance/3-import.md`, `scripts/catalog/` 두 파일, `.claude/worktrees/`)이 남아 있었음 — 아래 시작 확인의 `git status`가 깨끗하지 않으면 사용자에게 물어 정리

## 요약

가져오기를 내 PC에서 끝까지 돌립니다. 그렇게 만든 `catalog_next` 네 표와 작은 표 `load_manifest`를 `pg_dump -Fc` 파일 하나에 담아 운영 역할 DB(같은 PC의 `db-ops`, 5434, `mem_limit` 1GB)로 옮기고, 사이클 08의 바꿔 끼우기로 반영합니다(A). 이어서 책 묶기를 `current`·`compact`·`sql` 세 방식으로 만들어 설정으로 고르게 합니다. 세 방식의 결과가 책·소장 번호까지 같은지 확인하고, 여섯 관점에서 방식마다 두 번 잽니다(B). 화면과 REST API는 바뀌지 않고, 새 모듈과 새 이벤트도 없습니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다.
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) **조용히 바꾸지 말고** 먼저 사용자에게 알립니다. 내용과 이유는 dev `docs/plan-feedback.md`의 **새 `# 사이클 11` 절**에 적습니다. 사용자 발언이면 그대로 옮깁니다.
- `[안]`·`[안 이름]`·`[안 경로]`로 표시한 것은 dev가 코드에 맞춰 바꿀 수 있습니다. 바꾸면 `# 사이클 11` 절에 알리기만 합니다.
  - 해당 예: 클래스·메서드 이름(`PgTools`, `ImportTransfer`, `DatabaseFingerprint`, `BookGrouper`, `CurrentGrouping`·`CompactGrouping`·`SqlGrouping`, `DryRunDump`), `load_manifest` 칸 이름, 설정 키 `mode`·`file`·`dry-run-output`·`pg-dump-command`·`pg-restore-command`, Gradle 속성 `bootRunJvmArgs`, changelog 파일 이름, compose 서비스·볼륨 이름(`db-ops`, `db-ops-data`), 해시 계산식, `[안]`인 `step_seconds` 키, 스크립트 이름
  - **바꾸지 않는 것** [확정] (design-delta, 사용자 승인 2026-10-12)
    - 모드 값 `in-place`(기본)·`export`·`apply`·`finish`·`discard`
    - 묶는 방식 값 `current`(기본)·`compact`·`sql`과 그 설정 자리 `chaekcheck.collection.import.grouping`
    - 새 칸 `collection.catalog_import.export_id`·`exported_at`의 뜻
    - `failure_reason` 값 `mismatch`
    - `step_seconds` 키 `restore`·`index`·`analyze`·`swap`
    - 파일 형식 `pg_dump -Fc` 하나, 작은 표 이름 `catalog_next.load_manifest`
    - 비교 항목(도서관 해시, `collection_link` 해시, `book`·`holding`의 줄 수·가장 큰 번호·시퀀스 값, 네 표 칸 구조 해시)
    - 반영 순서, `db-ops` 포트 5434와 `mem_limit` 1GB
- **나중을 위해 열어 둘 것 (사이클 13)** [확정] (사용자 승인, 2026-10-12, `docs/easy/2026-10-12-remaining-followup-decisions.html` #6; 사이클 13 사전 결정 6, `docs/cycles/13-crawler-to-dev/scope.md`): 사이클 13에서는 새 도서관을 내 PC의 "도서관 넣기" 명령으로 넣고, 운영에는 이 사이클의 반영 파일에 새 도서관·가입 규칙·짝 표를 함께 실어 "도서관 → 짝 표 → 책" 순서로 넣을 예정입니다. 그때 반영 명령의 두 DB 비교(spec R-A3)가 "파일에 실린 도서관 변경을 먼저 넣고 비교"로 넓어질 수 있습니다. **이번 사이클은 지금 범위대로** 하되, 반영 파일 형식(`load_manifest` 등)이 나중에 도서관 부분을 더할 자리를 막지 않게 해 주세요. 예: `load_manifest`에 형식 번호를 두고, 반영 명령이 모르는 형식 번호를 만나면 시작하지 않음 [안]
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 확정된 것처럼 코드에 넣지 말고 `TODO(확인 필요)`로 둔 뒤, 확인하고 보고합니다.
- **새 의존성은 없습니다.** pg 도구는 DB 컨테이너 이미지(`chaekcheck/postgres-bigm:18`, `FROM postgres:18`, `docker/postgres-bigm/Dockerfile` 4행) 안의 18판을 Java `ProcessBuilder`로 부릅니다. JSON은 Jackson 3(`tools.jackson.*`, dev `CLAUDE.md`)을 씁니다. 비교 스크립트는 Python 표준 라이브러리만 씁니다.
- 단계마다 아래 확인을 통과해야 다음 단계로 넘어갑니다.
  - `backend/`에서 `./gradlew build`. 여기에는 `ModularityTests`의 `ApplicationModules.of(ChaekcheckApplication.class).verify()`와 `DocumentationTests`가 들어 있습니다.
  - 웹은 바뀌지 않으므로 웹 확인은 없습니다.
- **구현 기준은 `design-delta.md`입니다.** `architect-proposal.md`는 결정 기록일 뿐입니다.
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`), 사이클 05~10 인계서의 제약을 그대로 따릅니다. 아래에는 이번에 더하거나 바뀌는 것만 적습니다.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/11-separate-import/design-delta.md`: **기준 문서**. 구조 그림, 흐름 셋, `catalog_next` 상태, 모듈 표, 데이터, compose, 반영 세션 메모리, B 묶는 방식, 확인 필요
- `.../11-separate-import/spec.md`: R-A1~R-A10, R-B1~R-B7, 상태별 동작, AC-1~AC-15, 비목표
- `.../11-separate-import/flow.md`: 운영자 절차 1~4, 운영 역할 DB 상태
- `.../11-separate-import/research.md`: 1~8절은 dev 코드에서 끊는 자리와 번호 잇기, 9~11절은 PostgreSQL 18·JDK 25 공식 문서(확인 2026-10-12)
- `.../11-separate-import/scope.md`: "이미 정한 것", 포함 1~7, 측정 뒤 기본값
- ADR (`../chaekcheck-plan/docs/adr/`): 0078, 0079. 이어 쓰는 것은 0062(책 번호 잇기), 0065(새 표에 쓰고 바꿔 끼우기), 0070(소장 번호 잇기)
- `../chaekcheck-plan/docs/cycles/08-polish-swap-memory/retro.md` 59행: 상한 512MB에서 `maintenance_work_mem` 1GB로 DB가 `OOMKilled`된 사례(반영 256MB의 근거)
- dev `docs/maintenance/3-import.md` 5절: 지난 가져오기 숫자. 사이클 08 #3c는 약 33분, `-Xmx6g`, 살아 있는 데이터 약 4.8GB였습니다.

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0078 | 모드 다섯(`in-place`·`export`·`apply`·`finish`·`discard`). 내 PC가 번호 잇기와 `catalog_next` 쓰기까지 하고 파일 하나로 내보냄. 운영은 `load_manifest`만 먼저 읽어 비교하고, 다르면 `mismatch`. 같으면 남은 `catalog_next` 지우기 → 복원 → 색인·제약(운영 정의, 256MB) → `VACUUM (ANALYZE)` → 바꿔 끼우기. 기다리는 새 표는 보호하고, `discard`는 어느 DB에서든 남은 `catalog_next`를 지움. 기록은 운영 반영마다 한 줄, 내 PC `finish` 뒤 한 줄이며 둘을 `export_id`로 이음. `CatalogLoad`에 기능 7개 |
| 0079 | `chaekcheck.collection.import.grouping` = `current`·`compact`·`sql`. 세 방식 모두 "책의 첫 줄을 읽은 순서"로 책을 만듦. 결과 비교는 번호까지 같아야 통과. 측정은 여섯 관점 × 두 번, `current`에 Java 옵션 둘을 붙인 경우 포함, GC 기록. 묶는 규칙 자체는 바꾸지 않음 |

## 지켜야 할 제약

- **C1. 모듈 경계** [확정] (design-delta "모듈")
  - 모듈 방향은 `collection → catalog, library` 그대로입니다(`collection/package-info.java` 8행의 `allowedDependencies`는 고치지 않음). 새 모듈과 새 이벤트는 없습니다.
  - `catalog`는 `collection`을 모릅니다. `load_manifest.notes`는 `catalog`가 해석하지 않는 짐입니다.
  - `collection`은 `catalog` 표를 직접 읽지 않습니다. 기준값 6개와 표 구조 해시는 `catalog`가 `baseline()`·`Manifest`로 돌려줍니다.
  - 도서관 해시는 공개 API `LibraryCatalog.enabledLibraryRefs()`로 만듭니다. 번호 비교 도구(`compare_grouping.py`)는 앱 밖에서 psql로 읽습니다.
- **C2. Liquibase는 새 파일만** [확정]
  - 이미 적용된 changeset은 고치지 않습니다. 로컬 `db`·`db-test`는 초기화하지 않습니다. **예외 한 가지**: 0단계의 `popular/001` `display_order` CHECK 고침(사이클 10 후속) [확정] (사용자 제안, 2026-10-12, 사이클 10 회고 결정 #4: "아직 실제 서비스로 배포 안 되었으니까 liquibase 기존 changeset고치고 너가 알아서 changelog-sync든 아니면 새로 설치하든 뭐든 해")
  - `failure_reason`에는 값 CHECK가 없으므로(`collection/003-import-period-and-timings.yaml` 30-42행) `mismatch`를 더하는 데 changeset이 필요 없습니다.
  - `catalog_next.load_manifest`는 실행 중에만 생기는 표이고 Liquibase 대상이 아닙니다.
- **C3. 반영은 운영 서비스와 같은 앱 판으로** [확정] (architect-proposal 결정 6)
  - `apply`는 앱이 운영 DB에 붙어 시작하므로, 그 판의 Liquibase가 먼저 적용됩니다.
  - 절차 문서에 "운영 서비스와 같은 커밋으로 돌림"을 적습니다.
- **C4. 반영 세션 메모리**
  - `apply` 연결: `maintenance_work_mem` 256MB [확정] (spec R-A4, 설계 #12)
  - 내 PC `export`·`in-place`: 지금 값(1GB, 병렬 4) 그대로 [확정] (design-delta "반영 세션 메모리")
  - 내 PC `finish`: 1GB 그대로 둡니다 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-handoff-review.html` #1). `finish`는 상한이 없는 내 PC `db`에서 돕니다. 256MB는 운영 `apply`에만 겁니다(design-delta 문구도 같게 고침).
  - 서버 기본 `maintenance_work_mem`(64MB)과 compose `db`의 `command:`는 바꾸지 않습니다.
  - 값은 이미 있는 설정 `chaekcheck.catalog.load.maintenance-work-mem`(`CatalogLoadSettings` 21-23행)을 명령에서 줍니다.
- **C5. 실패하면 운영은 그대로** [확정] (spec 상태별 동작)
  - 비교가 다르면 운영 표에 손대지 않습니다.
  - 복원·색인·통계가 실패하면 `catalog_next`를 지우고 `error`로 기록합니다.
  - 잠금 5번 실패는 `lock_not_acquired`입니다(사이클 08 그대로: `lock_timeout` 2초, 10초 쉬고, 최대 5번).
  - 도중에 죽으면 다음 `apply`가 시작할 때 남은 것을 지웁니다.
- **C6. 기다리는 새 표 보호** [확정] (spec R-A7, R-A10)
  - `load_manifest`가 있는 `catalog_next`는 `export`·`in-place`가 지우지 않습니다. 이때는 시작하지 않고 "먼저 finish 또는 discard"를 알립니다.
  - `load_manifest`가 없는 `catalog_next`(죽고 남은 것)는 지금처럼 지우고 시작합니다.
  - `finish`는 `load_manifest`를 바꿔 끼우는 트랜잭션 **안에서** 지웁니다.
- **C7. 결과 같음** [확정] (spec R-B5, ADR-0079)
  - 세 방식은 같은 사본에서 책 내용과 책·소장 번호까지 같아야 합니다. 다른 책이 한 권이라도 있으면 그 방식은 쓰지 않습니다.
  - 묶는 규칙(same-book-isbn 5절)은 바꾸지 않습니다. 기본값은 측정이 끝날 때까지 `current`입니다(R-B1). 측정 뒤 기본값은 사용자가 정합니다(R-B7). dev는 바꾸지 않고 추천만 보고합니다.
- **C8. 자동 갱신 없음** [확정]
  - 정해진 때 혼자 도는 갱신, 진짜 운영 서버, 인터넷으로 파일 보내기는 하지 않습니다.
  - 동시에 두 번 반영되지 않게 막는 장치(`pg_advisory_lock`)는 backlog입니다.

## 개발 시작 전 확인

### dev가 확인할 것
- [ ] 사이클 10 dev 변경(디자인 다듬기 포함)이 커밋되었는지 봅니다(`git status` 깨끗, `popular/001` 포함). plan 회고 때(2026-10-12) `# 사이클 10`은 8단계까지 끝, 디자인 다듬기 진행 중이었습니다.
- [x] `docs/current/handoff.md`가 이 인계서로 바뀜(2026-10-12).
- [ ] base package는 `com.chaekcheck`입니다(dev `CLAUDE.md`, `build.gradle` 7행). 고치는 패키지는 `com.chaekcheck.catalog`와 `com.chaekcheck.collection.internal.importer`입니다.
- [ ] 마지막 `collection` changeset 번호와 master 맨 끝 include를 봅니다. plan이 읽었을 때는 `collection/004-national-bibliography.yaml`이었고, master 맨 끝은 `popular/001-popular-schema.yaml`(81-84행)이었습니다. 새 파일은 그다음 번호(지금이면 `collection/005-import-export.yaml` [안 이름])로 하고, master 맨 끝에 `# cycle 11` 주석과 함께 둡니다.
- [ ] 디스크 여유를 봅니다 [확인 필요: dev 측정].
  - `db-ops` 복사본: `db` 약 8.5GB(3-import.md 62행)
  - 덤프 파일 여러 개 [확인 필요: 프로토타입 크기]
  - 바꿔 끼우는 동안 DB 두 벌: 사이클 08에서 최대 19.1GiB
  - `sql` 방식 임시 표: 수 GB 예상 [확인 필요]
- [ ] `data/cycle08/psql.sh`(git 밖)를 측정 스크립트가 쓰고 있는지 봅니다(`probe_during_import.py` 21-22행, `measure_round.py` 46행). 이번에는 `db-ops`에도 써야 합니다.

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 수집기가 쉬고 있는지 알려 주기. 원본 `chaekcheck-data\ebook-catalog.sqlite`를 `snapshots\`에 복사(scope 포함 7. 411은 2026-10-11 22:54 다시 수집 끝남) | 7단계 전 | 새 사본 파일 이름 |
| 긴 측정 실행 승인. 한 번에 약 33~45분이고, 방식 넷 × 두 번에 힙 줄이기 실행이 더해집니다 | 10단계 전 | 승인 |
| 측정 표를 보고 기본 묶는 방식 정하기(R-B7 기준) | 10단계 뒤 | 기본값 |

## 구현 단계

A(1~7단계)를 먼저 끝내고 B(8~11단계)로 갑니다 [확정] (scope "순서"). 각 단계는 따로 빌드·테스트할 수 있습니다.

### 0단계: 시작 확인과 사이클 10 후속 (의존: 없음)

1. 위 "dev가 확인할 것"을 모두 확인합니다. `./gradlew build`가 지금 그대로 통과하는지 봅니다(기준선).
   - 위험: 낮음
2. **사이클 10 후속: `display_order` CHECK를 0..14로** [확정] (사용자 제안, 2026-10-12, 사이클 10 회고 결정 #4: "아직 실제 서비스로 배포 안 되었으니까 liquibase 기존 changeset고치고 너가 알아서 changelog-sync든 아니면 새로 설치하든 뭐든 해") (ADR-0080, plan 사이클 10 회고)
   - `backend/src/main/resources/db/changelog/popular/001-popular-schema.yaml`의 `ranking_category_display_order_check`를 `0..16` → `0..14`로 **그 자리에서** 고칩니다(아직 배포 전). 주석에 사이클 10 회고·ADR-0080을 적습니다.
   - 로컬 `db`: (1) 2026-09에서 언어(`00000000000000000178`)·기술·공학(`00000000000000001991`)의 `ranking_category`·`ranking_entry` 줄을 지우고, 남은 분류의 `display_order`를 지금 `CategoryOrder` 규칙(전체 0, 판매 부수 큰 순, 같으면 사이트 ID 순)으로 0~14로 다시 매깁니다. (2) 제약을 SQL로 `DROP`·`ADD`해 0..14로 바꿉니다. (3) 그 changeset의 `databasechangelog.md5sum`을 `NULL`로 둡니다(다음 시작 때 Liquibase가 새 체크섬을 씀). 체크섬만 비우면 changeset이 다시 돌지 않으므로 (2)가 필요합니다. 근거: "Set the checksum to null for the row … The next update writes the correct checksum" (https://docs.liquibase.com/concepts/changelogs/changeset-checksums.html , 확인 2026-10-12)
   - 진짜 사이트를 다시 부르는 방법(인기 도서 표를 비우고 다시 받기)은 쓰지 않습니다 [안]. dev가 다른 방법(DB를 새로 만들기 등)이 낫다고 보면 사용자에게 묻고 보고합니다.
   - `db-test`는 tmpfs라 새로 만들어질 때 고친 changeset이 그대로 적용됩니다. 테스트 `PopularBooksApiTests.listsLeftOutLaterAreNotShown`처럼 17분류 옛 달을 흉내 내는 테스트는 0~14 안의 값으로 바꿉니다.
   - 확인: `./gradlew build` 통과, 로컬 앱이 체크섬 오류 없이 켜짐, 인기 도서 2026-09가 14분류로 보임. `# 사이클 11` 절에 결과를 적습니다.
   - 위험: 낮음

### 1단계: 프로토타입 (앱 코드 변경 없음, 의존: 0단계)

작은 표와 손 명령으로 확인합니다. 작업 파일은 `data/cycle11/`(git 밖) [안 경로]에 둡니다. **하나라도 실패하면 design-delta에 적힌 대안으로 가고 `# 사이클 11` 절에 보고합니다.**

1. **시퀀스 값이 덤프·복원에서 그대로 넘어가는지** (design-delta 확인 필요 1행, spec 확인 필요)
   - 할 일: `db-test`나 임시 DB에서 `catalog_next` 스키마에 `LIKE … INCLUDING IDENTITY` 표를 만들고 `setval`로 값을 넣습니다. 그다음 `pg_dump -Fc -n catalog_next --no-owner --no-privileges`로 덤프하고, 그 스키마를 지운 뒤 `pg_restore --single-transaction --exit-on-error --no-owner --no-privileges`로 복원합니다. 마지막으로 `last_value`·`is_called`를 맞대 봅니다.
   - 공식 문서상으로는 넘어갑니다(`--sequence-data` 기본, https://www.postgresql.org/docs/18/app-pgdump.html , 확인 2026-10-12, research 11절).
   - 실패하면: 복원 뒤 manifest의 `book_sequence`·`holding_sequence`로 `setval`을 다시 겁니다 [안]. 보고합니다.
   - 위험: 중간 (번호 잇기 R-A1의 전제)
2. **`wsl -d Ubuntu --exec docker compose … exec -T <서비스> pg_dump …` 파이프로 받은 `-Fc` 바이너리가 깨지지 않는지** (design-delta 확인 필요 2행)
   - 할 일: 컨테이너 안에서 파일로 쓴 덤프와 파이프로 받은 덤프의 SHA-256을 비교합니다. 복원 파이프(표준 입력)도 같은 방법으로 봅니다.
   - 실패하면: bind mount로 파일을 주고받거나 `docker cp`를 씁니다(design-delta 대안).
   - compose 프로젝트 지정 방법(`-p chaekcheck`, `--project-directory`, `-f compose.yaml` 중 무엇이 되는지)도 정해 보고합니다.
   - 위험: 중간
3. **컨테이너 안 도구가 암호 없이 로컬 소켓으로 붙는지** (design-delta 확인 필요 3행)
   - 할 일: `exec -T db pg_dump -U <DB_USERNAME> -d <DB_NAME> …`처럼 암호 없이 됩니다. 암호가 필요하면 그 방법을 보고하고, 암호는 명령줄이나 로그에 남기지 않습니다.
   - 위험: 낮음
4. **Java가 죽었을 때 컨테이너 안 `pg_restore`가 계속 도는지** (design-delta 확인 필요 4행, AC-13)
   - 할 일: 작은 Java(또는 셸) 부모 프로세스가 `PGAPPNAME=chaekcheck-restore` [안 이름]으로 `pg_restore`를 띄웁니다. 그다음 부모를 죽이고 `pg_stat_activity`에서 그 세션이 남는지, 트랜잭션이 끝나는지(롤백·커밋)를 봅니다.
   - 결과에 따라 `discard`가 해야 할 일이 달라집니다. 세션이 남는다면 `discard`는 먼저 그 이름의 세션이 있는지 보고, 있으면 "복원이 아직 돌고 있음"을 알리고 멈춥니다 [안]. 이 판단은 Claude의 판단이고 확인한 것이 아닙니다.
   - 위험: 중간
5. **파이프로 쓴 `-Fc` 파일에서 `load_manifest`만 읽기** [확인 필요]
   - 할 일: 크기를 키운 표(수백만 줄) 하나와 `load_manifest`를 함께 덤프합니다. 그 파일에 `pg_restore -a -n catalog_next -t load_manifest -f -`를 걸어 걸리는 시간과 출력(COPY 글)을 봅니다. 같은 파일을 표준 입력으로 넣은 전체 복원이 되는지도 봅니다.
   - 판단(Claude, 공식 문서 문장으로 확인하지 않음): `pg_dump`가 파이프로 쓰면 목차에 데이터 위치가 없을 수 있습니다. 그러면 표 하나만 읽을 때 파일을 처음부터 훑어야 할 수 있습니다.
   - 느리면: `load_manifest`를 먼저 덤프되게 하는 방법을 찾거나, 컨테이너 안에서 파일로 쓰는 방법(bind mount)으로 바꿉니다 [안]. 보고합니다.
   - 위험: 중간
- 결과(성공/실패, 고른 대안, 명령 앞부분 실제 값, 걸린 시간)를 `# 사이클 11` 절 "프로토타입"에 적습니다.

### 2단계: 가져오기 기록 칸 (의존: 0단계)

1. **Liquibase** (파일: `backend/src/main/resources/db/changelog/collection/005-import-export.yaml` [안 이름. 번호는 0단계에서 확인], master 맨 끝에 `# cycle 11` 주석과 include)
   - 할 일:
     - `collection.catalog_import`에 `export_id uuid NULL`, `exported_at timestamp with time zone NULL`을 더합니다.
     - CHECK `(export_id IS NULL) = (exported_at IS NULL)`을 답니다. 제약 이름은 `catalog_import_export_check` [안 이름]이고, 003 파일처럼 raw `sql` change로 씁니다.
     - 파일 머리 주석에 사이클 11, ADR-0078, "`failure_reason`에 `mismatch`가 더해짐(값 CHECK 없음)"을 적습니다.
   - 이유: spec R-A5, design-delta "데이터" [칸·뜻 확정]
   - 위험: 낮음
2. **`ImportRecords`** (파일: `backend/src/main/java/com/chaekcheck/collection/internal/importer/ImportRecords.java` 33-62행)
   - 할 일:
     - INSERT에 `export_id`·`exported_at`을 더합니다(기존 호출은 NULL).
     - "다른 DB에서 온 기록 + 이 DB 단계 시간" 한 줄을 넣는 메서드를 더합니다 [안 이름 `insertApplied`].
     - Javadoc의 reason 목록에 `mismatch`를 더합니다.
   - 위험: 낮음
- 테스트: `CatalogImportRecordTests` [안 이름] (`@SpringBootTest`, `db-test`): 두 칸이 모두 있거나 모두 NULL이면 들어감, 하나만 있으면 CHECK 위반, `FAILED`/`mismatch` 줄이 들어감. 기존 `CatalogImporterTests` 전부 통과
- `./gradlew build` 통과

### 3단계: `JdbcCatalogLoad`를 단계 메서드로 나누기 (동작 변경 없음, 의존: 0단계)

1. **나누기** (파일: `backend/src/main/java/com/chaekcheck/catalog/internal/JdbcCatalogLoad.java`)
   - 할 일: 지금 `load`(103-170행)를 단계로 나눕니다.
     - `prepare`: 세션 `SET` → 남은 `catalog_next` 처리 → 임시 표 COPY → `Ids.decide` → `write` → 커밋 → 임시 표 지움(103-150행)
     - `index`: `createIndexesAndConstraints`, 230-272행
     - `analyze`: 156-161행
     - `swap`: 279-316행
   - `replaceAll` = prepare + index + analyze + swap이고, **지금과 결과·`step_seconds` 키가 같아야 합니다.**
   - `swap`이 "같은 트랜잭션에서 먼저 실행할 문장"(`DROP TABLE catalog_next.load_manifest`)을 받을 수 있게 합니다(`finish`용, R-A10).
   - 이유: 끊는 자리는 `write` 커밋과 임시 표 정리 뒤, `index` 앞입니다(research 1절).
   - 위험: 중간 (사이클 08 동작 회귀)
2. **세션 설정을 단계별로** (`CatalogLoadSettings` 21-35행)
   - 할 일: 지금은 `load` 첫 연결에서만 `maintenance_work_mem` 등을 겁니다(109-117행). `apply`·`finish`는 새 연결에서 색인을 만드므로, 색인·통계 연결에도 같은 `SET`을 겁니다.
   - 위험: 낮음
- 테스트: 기존 `CatalogLoadSwapTests`(빈 상태, 소장 번호 잇기, Liquibase 정의와 같음, 잠금 실패, 쓰는 중 실패, 바깥 외래 키, 쓰는 동안 검색)와 `CatalogLoadBookIdTests`가 **고치지 않고** 통과해야 합니다.
- `./gradlew build` 통과

### 4단계: `catalog` 공개 API와 pg 도구 (의존: 1·3단계)

1. **공개 API** (파일: `backend/src/main/java/com/chaekcheck/catalog/CatalogLoad.java`)
   - 할 일 (모양 [확정] (설계 #5), 이름 [안]): `replaceAll`(34행)은 그대로 두고 다음을 더합니다.
     - `prepare(String source, Loader loader)` → `Result`(바꿔 끼우기 전까지의 단계 시간)
     - `export(Path file, String notes)` → `Manifest`
     - `readManifest(Path file)` → `Manifest`
     - `baseline()` → `Baseline`(이 DB `catalog`의 기준값 6개 + 네 표 칸 구조 해시)
     - `apply(Path file)` → `Result`
     - `finishPrepared(Path file)` → `Result`
     - `discardPrepared()` → `boolean`(무엇을 지웠는지)
   - 레코드: `Manifest(formatVersion, exportId, exportedAt, Baseline baseline, String columnsHash, String notes)`, `Baseline(bookCount, bookMaxId, bookSequence, holdingCount, holdingMaxId, holdingSequence)`(design-delta 도메인 모델). `columnsHash`를 `Baseline` 안에 둘지 밖에 둘지는 dev가 정합니다 [안].
   - `NotSwappedException`(41-54행) Javadoc reason에 `mismatch`를 더합니다.
   - Javadoc에 "기다리는 새 표"(C6), "`notes`는 해석하지 않음", ADR-0078을 적습니다. `catalog/package-info.java` Javadoc에도 한 줄 더합니다.
   - 위험: 낮음
2. **기준값과 칸 구조 해시** (`JdbcCatalogLoad` 안 [안 위치])
   - 기준값: `count(*)`, `max(id)`, 시퀀스 값입니다. 시퀀스 값은 `Ids.highest`(562-570행)와 같은 뜻으로 맞춥니다. 표 이름을 받아 `catalog`나 `catalog_next` 어느 쪽에서든 계산할 수 있게 합니다 [안].
   - 칸 구조: `information_schema.columns`에서 네 표(`book`, `book_contributor`, `holding`, `catalog_library_snapshot`)의 (표, 칸, 타입) 목록을 정해진 순서로 이어 SHA-256을 냅니다. 항목 [확정], 계산식 [안]
   - `load_manifest`의 기준값은 **내 PC `catalog`(마지막 반영분)** 의 값입니다(design-delta).
   - 위험: 중간 (`holding` 약 1,770만 줄 `count(*)` 시간, 확인 필요)
3. **pg 도구** (파일: `backend/src/main/java/com/chaekcheck/catalog/internal/PgTools.java` [안 이름], 설정은 `CatalogLoadSettings`에 `pgDumpCommand`·`pgRestoreCommand` `List<String>` [안 이름])
   - 할 일:
     - 명령 앞부분(예: `wsl -d Ubuntu --exec docker compose -p chaekcheck exec -T -e PGAPPNAME=… db`, 실제 값은 1단계 결과)에 도구 인자를 붙여 `ProcessBuilder`로 실행합니다.
     - 덤프 옵션: `-Fc -n catalog_next --no-owner --no-privileges`. 출력은 `<file>.part`에 쓰고 성공하면 이름을 바꿉니다.
     - 복원 옵션: `--single-transaction --exit-on-error --no-owner --no-privileges`, 파일을 표준 입력으로 넣습니다.
     - manifest 읽기: `pg_restore -a -n catalog_next -t load_manifest -f -`의 COPY 글을 해석합니다.
     - stderr 끝부분은 예외 메시지로 넘겨 `failure_detail`(1000자)에 남깁니다.
     - 설정이 없으면 `export`·`apply`·`finish`는 시작하지 않고 "pg-dump-command를 설정하세요"를 알립니다.
     - 커밋되는 설정 파일에 내 PC 경로를 넣지 않습니다. 명령 앞부분은 `.env`·인자로 줍니다(`CatalogImportRunner` Javadoc 원칙).
   - 위험: 중간
4. **`export`** (design-delta "주요 흐름: 내보내기")
   - 할 일:
     - `prepare`가 끝난 뒤 `catalog_next.load_manifest`를 만들고 한 줄 넣습니다. 칸: `format_version` 1 [안], `export_id` 새 UUID, `exported_at`, 기준값 6칸, `notes jsonb`(칸 구조 해시 포함).
     - `pg_dump` → `.part`. 끝나면 그 `.part`에 `readManifest`를 걸어 `export_id`가 DB 값과 같은지 확인하고 이름을 바꿉니다.
     - 실패하면 `catalog_next`를 지우고 예외를 던집니다(`collection`이 `FAILED error` 기록).
   - 성공하면 `catalog_next`를 **남깁니다**(색인 없음, R-A2).
   - 위험: 중간
5. **`prepare` 앞의 보호** (C6, R-A7)
   - `export`·`in-place`(`replaceAll`) 시작 때 `to_regclass('catalog_next.load_manifest')`가 있으면 아무것도 지우지 않고 `IllegalStateException("먼저 finish 또는 discard …")` [안 문구]를 던집니다.
   - 없으면 지금처럼 `DROP SCHEMA IF EXISTS catalog_next CASCADE`(119행) 합니다.
   - 위험: 낮음
6. **`apply`** (design-delta "주요 흐름: 반영", R-A4)
   - 할 일:
     1. 기준값을 한 번 더 봅니다. 다르면 `NotSwappedException("mismatch", …)`
     2. 남은 `catalog_next`를 지웁니다(CASCADE).
     3. `pg_restore`(`restore`)
     4. `catalog_next.load_manifest`의 `export_id`가 파일 값과 같은지 확인하고 `load_manifest`를 지웁니다.
     5. 색인·제약(`index`, **운영 `catalog` 정의**, 230-272행 그대로)
     6. `VACUUM (ANALYZE)`(`analyze`)
     7. 바꿔 끼우기(`swap`)
   - 실패하면 `catalog_next`를 지웁니다(지금 `cleanUp` 339-354행과 같은 꼴).
   - 위험: 중간
7. **`finishPrepared`** (design-delta "마저 바꿔 끼우기", R-A10)
   - 할 일:
     1. `catalog_next`와 `load_manifest`가 있고 `export_id`·기준값이 파일과 같은지 봅니다. 아니면 멈추고 DB는 그대로 둡니다. 안내 문구: "같은 파일을 내 PC에 apply로 되살림".
     2. **다시 돌릴 때**: `catalog_next` 네 표에 이미 있는 색인·제약(NOT NULL 제외)을 지웁니다. `pg_index`·`pg_constraint`에서 `catalog_next` 쪽을 읽고, `load_manifest`는 빼고 지웁니다.
     3. 색인·제약 → `VACUUM (ANALYZE)`
     4. 바꿔 끼우기 트랜잭션 안에서 `DROP TABLE catalog_next.load_manifest` + 옛 표 지움 + `SET SCHEMA catalog` + `DROP SCHEMA catalog_next`
   - 색인·통계에서 실패하면 **`catalog_next`와 `load_manifest`를 남깁니다**(기다림 유지). 잠금 5번 실패도 남깁니다 [안. design-delta에는 색인·통계 실패만 적혀 있어 보고 대상].
   - 위험: 중간
8. **`discardPrepared`** (R-A8)
   - `DROP SCHEMA IF EXISTS catalog_next CASCADE`. 기록 줄은 남기지 않습니다.
   - `load_manifest`가 있었으면 WARN 로그로 "운영 반영이 실패했을 때만 지우세요"를 남깁니다. 지운 것이 무엇인지(없음 / 죽고 남은 표 / 기다리던 표)를 돌려줍니다.
   - 1단계 4번 결과에 따라 복원 세션이 남아 있는지도 봅니다 [안].
   - 위험: 낮음
- 테스트: `CatalogTransferTests` [안 이름] (`@SpringBootTest`, `db-test`)
  - 진짜 pg 도구를 `db-test` 컨테이너로 부릅니다 [안]. 테스트용 명령 앞부분은 `application-test.yml` 또는 테스트 클래스 속성에 둡니다.
  - **한 DB가 두 역할을 번갈아** 합니다: `export` → `discard` → 같은 파일 `apply`.
  - 확인할 것:
    - `export` 뒤 `catalog` 그대로(AC-1), 파일 생김, `catalog_next`·`load_manifest` 남음
    - 시퀀스 값이 넘어옴
    - `apply` 뒤 책·소장 번호가 `export` 때 `catalog_next`와 같음(AC-2)
    - 기준값 하나를 바꾸면 `mismatch`, `catalog` 그대로
    - `catalog.book`에만 칸 하나를 더하면 `mismatch`(AC-11)
    - `export` 두 번이면 두 번째가 멈추고 남겨 둔 새 표 그대로(AC-12)
    - `finish` 색인 단계 실패 흉내(예: 일부 색인을 미리 만들어 둠) → 다시 `finish` 끝까지(AC-15 일부)
    - `discard`는 세 경우(없음, 죽고 남음, 기다림) 모두 지움
    - 복원 실패 흉내(깨진 파일) → `catalog` 그대로, `catalog_next` 없음
  - pg 도구를 테스트에서 부르기 어렵다고 판단하면 `PgTools` 가짜를 쓰고, 진짜 도구는 7단계 실데이터로만 확인합니다. 어느 쪽을 골랐는지 보고합니다 [안].
- `./gradlew build` 통과

### 5단계: `collection` 실행 모드, 비교, 기록 (의존: 2·4단계)

1. **설정** (파일: `backend/src/main/java/com/chaekcheck/collection/internal/importer/CatalogImportRunner.java` 44-51행)
   - 할 일:
     - `Settings`에 `mode`(`in-place` 기본·`export`·`apply`·`finish`·`discard`), `file`(`Path`), `grouping`(`current` 기본, 8단계에서 쓰임), `dryRunOutput`(`Path`, 8단계)을 더합니다. 모드·방식 값과 `grouping` 자리는 [확정], 나머지 이름은 [안].
     - `sqlite-path` 확인(57-59행)은 `in-place`·`export`에서만 합니다. `export`·`apply`·`finish`에는 `file`이 필요합니다.
     - 잘못된 값이면 시작하지 않습니다.
   - 위험: 낮음
2. **두 DB 비교** (파일: `DatabaseFingerprint.java` [안 이름], 같은 패키지)
   - 도서관 해시: `enabledLibraryRefs()`(id 순)의 `id\tbaseUrl\tplatformType\n`을 이은 글자의 SHA-256 + 개수
   - 연결표 해시: `collection.collection_link`를 `collection_library_id, library_id` 순으로 SHA-256 + 개수(`created_at` 제외)
   - 계산식은 [안]입니다(design-delta "해시").
   - `mismatch`일 때 `failure_detail`에 무엇이 달랐는지(도서관 / 연결표 / 책 표 어느 값 / 표 구조, 양쪽 값) 1000자 안으로 적습니다 [안].
   - 위험: 낮음
3. **모드 실행** (파일: `ImportTransfer.java` [안 이름]. `CatalogImporter`(73-157행)는 읽기·묶기만 하게 두고 마지막 쓰기 호출을 모드에 따라 고름)
   - `in-place`: 지금 그대로 `replaceAll`. 다만 기다리는 새 표가 있으면 멈춥니다(C6).
   - `export`:
     1. `prepare` + `export(file, notes)`
     2. `notes` JSON에 넣는 것: 내 PC 기록(`ImportReport`의 책·소장·건너뜀 수, 도서관 수, `collected_from`/`to`, `step_seconds`, `source`), 도서관 해시, 연결표 해시, 묶는 방식 [안]
     3. 성공하면 기록 줄을 남기지 않고 [확정] (설계 #4), 로그에 파일 경로·크기·`export_id`를 남깁니다.
     4. 실패하면 지금처럼 `FAILED`(136-143행)
   - `apply`:
     1. `readManifest` → 자기 DB 해시 두 개와 `baseline()`을 `notes`·manifest와 비교(`compare`)
     2. 다르면 `FAILED`/`mismatch` 한 줄(`export_id`·`exported_at` 포함)을 남기고 끝납니다.
     3. 같으면 `apply(file)`
     4. 성공하면 내 PC 기록 + 이 DB 단계(`compare`·`restore`·`index`·`analyze`·`swap`·`apply`) + `export_id`로 `SUCCEEDED` 한 줄(R-A5, AC-7). 실패하면 `error` 또는 `lock_not_acquired` 한 줄
   - `finish`: `finishPrepared(file)` → 성공하면 `SUCCEEDED` 한 줄(`export_id`, 단계 `index`·`analyze`·`swap`·`finish`). 실패할 때 줄을 남길지는 design-delta에 정해져 있지 않습니다. 로그만 남기고 줄은 없음 [안], 보고합니다.
   - `discard`: `discardPrepared()`, 기록 없음 [확정].
   - 위험: 중간
4. **`step_seconds` 키** (design-delta 데이터 표)
   - 내보내기: 지금 키 + `dump`·`export`
   - 반영: `compare`·`restore`·`index`·`analyze`·`swap`·`apply`
   - 마저: `index`·`analyze`·`swap`·`finish`
   - `restore`·`index`·`analyze`·`swap`은 [확정], 나머지는 [안]입니다.
- 테스트: `CatalogImportModesTests` [안 이름] (`@SpringBootTest`, `db-test`, `CatalogImporterTests`의 작은 SQLite 픽스처를 다시 씀)
  - `export` → 기록 줄 없음, 파일 생김
  - `discard` → `apply` → `SUCCEEDED` 한 줄에 내 PC 단계와 반영 단계, `export_id`(AC-7)
  - 도서관 하나를 끄거나 `base_url`을 바꾸면 `mismatch`와 "도서관"(AC-4)
  - `collection_link` 한 줄을 바꾸면 `mismatch`와 "연결표"(AC-4)
  - 책 줄 하나를 지우면 `mismatch`와 "책 표"(AC-4)
  - 기다리는 새 표가 있을 때 `in-place`·`export`는 멈춤(AC-12)
  - `finish` 뒤 `export_id` 줄
  - 기존 `CatalogImporterTests`(in-place) 통과
- `ModularityTests`: 모듈 의존이 바뀌지 않았는지 봅니다(`collection` → `catalog`·`catalog :: normalize`·`library`).
- `./gradlew build` 통과

### 6단계: compose, Gradle, 스크립트, 절차 문서 (의존: 1단계, 5단계와 나란히 가능)

1. **compose** (파일: `compose.yaml`)
   - 할 일: 서비스 `db-ops` [안 이름]를 둡니다.
     - 이미지 `chaekcheck/postgres-bigm:18`, `db`와 같은 `environment`·`command:`(25-34행)·`healthcheck`
     - 포트 `${OPS_DB_PORT:-5434}:5432`, 볼륨 `db-ops-data` [안 이름]
     - `mem_limit: 1g` [확정 값] (설계 #12, spec R-A6). compose 문서: `mem_limit`는 "configures a limit on the amount of memory a container can allocate"이고 `deploy` `limits.memory`와 같아야 합니다(https://docs.docker.com/reference/compose-file/services/ , research 11절). `deploy` 쪽은 두지 않습니다.
   - `volumes:`에 `db-ops-data`를 더하고 머리 주석에 사이클 11 운영 역할 DB라고 적습니다. `.env.example`에 `OPS_DB_PORT=5434`를 넣습니다.
   - **처음에 `db`를 통째로 복사** [확정: 설계 #12]합니다. 방법(볼륨 복사, 덤프·복원 등)은 dev가 정하고 [안], 절차를 3-import.md에 적습니다. 복사한 뒤 두 DB의 `baseline()`·해시가 같은지 확인합니다.
   - 위험: 낮음
2. **Gradle** (파일: `backend/build.gradle` 68-73행)
   - `-PbootRunJvmArgs="…"` [안 이름]를 공백으로 나눠 `jvmArgs`에 더합니다. 예: `-XX:+UseStringDeduplication -XX:+UseCompactObjectHeaders -Xlog:gc*:file=…`
   - `-PbootRunXmx`는 그대로 둡니다. 주석에 사이클 11 측정용이라고 적습니다.
   - 위험: 낮음
3. **측정 스크립트 손보기** (`scripts/catalog/probe_during_import.py` 20-22행, `measure_round.py` 46행)
   - 서비스 주소(`BASE`)와 compose 서비스(`db`/`db-ops`)를 인자나 환경 변수로 받게 합니다. 기본값은 지금과 같습니다.
   - 위험: 낮음
4. **절차 문서** (파일: `docs/maintenance/3-import.md`)
   - 할 일: 새 절을 더합니다 [안 위치: 13절 "따로 하기"].
     - 운영자 절차 1~4(flow.md)를 명령 예시와 함께
     - 같은 앱 판으로 돌릴 것(C3)
     - `mismatch`일 때 무엇을 맞출지
     - "기다림" 상태와 `finish`·`discard`
     - `discard`는 운영 반영이 실패했을 때만
     - 죽고 남은 표
     - `db-ops` 만들기·복사
     - 반영 메모리(C4)
   - 3절 설정 목록에 `mode`·`file`·`grouping`·`dry-run-output`·`pg-dump-command`·`pg-restore-command`를 더합니다.
   - 9절 실패 이유에 `mismatch`를, 10절 키 목록에 이번 키를 더합니다.
   - 위험: 낮음
- `./gradlew build` 통과

### 7단계: A 실데이터 시험 (의존: 5·6단계, 새 사본)

순서: `db` → `db-ops` 복사 → 내 PC `export`(새 사본, `current`, `-Xmx6g`) → 파일을 `db-ops`에 `apply` → 내 PC `finish`

1. **AC-1**: `export` 전후에 내 PC 서비스에서 `measure_books.py` → `compare_books.py`로 검색 응답이 같은지 봅니다. 덤프 크기와 `dump` 시간을 적습니다.
2. **AC-2, AC-3, AC-14**
   - `db-ops`에 붙은 서비스를 하나 띄웁니다. 포트는 8081 [안], `DB_PORT=5434`, 기본 힙 512MB입니다.
   - `probe_during_import.py`(그 서비스, `db-ops`)를 켠 채 `apply`를 돌립니다. `maintenance-work-mem=256MB`로 돌립니다.
   - 확인할 것:
     - 기다린 시간 1초 안, 5xx 0
     - `restore`·`index`·`analyze`·`swap` 시간
     - `db-ops` 크기 최대
     - 컨테이너 메모리 최고와 `OOMKilled` 없음(`docker inspect`)
   - 반영 뒤 `db-ops`와 내 PC `catalog_next`의 번호(SQL)와 검색 응답(`compare_books.py`)을 비교합니다.
3. **AC-6**: `finish` 뒤 두 DB의 기준값 6개, 칸 구조 해시, 도서관·연결표 해시가 같은지 봅니다(psql 또는 다음 `apply`의 비교 단계).
4. **AC-4, AC-11**: `db-ops`에서 도서관 한 곳 `base_url`, `collection_link` 한 줄, 책 한 줄, `catalog.book`의 칸 하나를 차례로 바꿔 `apply`를 돌립니다. 매번 `mismatch`가 나오고 검색이 그대로여야 합니다. 시험 뒤에는 되돌리고, 칸을 더한 것은 지웁니다.
5. **AC-5, AC-13**
   - `apply`의 복원 도중 Java를 멈춥니다. 검색이 그대로인지 보고 `pg_stat_activity`를 봅니다(1단계 4번 결과).
   - 그다음 한 번은 `discard`(AC-13), 한 번은 다음 `apply`로 끝까지 갑니다(AC-5).
6. **AC-12, AC-15**
   - 내 PC에서 `export` 뒤 다시 `export`를 돌려 멈추는지 봅니다.
   - `finish`를 색인 단계에서 멈춥니다. 그다음 `export`가 멈추는지 보고, 다시 `finish`하면 끝까지 되는지 봅니다.
- 새 사본 로그에서 도서관 411(새 주소)이 `library_base_url_mismatch`로 빠지지 않는지 봅니다 [확인 필요].
- 위험: 중간 (긴 실행, 디스크)

### 8단계: B 묶기 인터페이스, `current`, 결과 비교 도구 (의존: 5단계, A와 독립)

1. **인터페이스** (파일: `backend/src/main/java/com/chaekcheck/collection/internal/importer/BookGrouper.java` [안 이름])
   - 할 일: `CatalogImporter`가 지금 부르는 모양을 인터페이스로 뽑습니다(81-129행).
     - `add(Row, ImportReport)`
     - `groupByCodes(ImportReport)`
     - `bibliographyKeys()`
     - `attachBibliography(Map<String,String>, ImportReport)`
     - `mergeSameText(ImportReport)`
     - `forEachBook(ToLongFunction<Book>)`
     - 둘째 읽기의 짝 찾기: `long bookOf(Row)` [안]
     - 정리: `AutoCloseable` [안]
   - **design-delta에 적힌 `bookOf`는 지금 코드에 없습니다.** 지금은 `forEachBook`이 `long[] bookOfUnit`을 돌려주고, 둘째 읽기가 `bookOfUnit[grouping.unitOf(row)]`(121-127행)을 씁니다. `sql`에는 묶음 배열이 없으므로 `bookOf(Row)`로 감쌉니다. 정한 모양을 보고합니다.
   - `Book` 레코드의 `units`(`BookGrouping` 54-57행)는 `CatalogImporter`가 쓰지 않습니다. 인터페이스 쪽에서는 빼거나 선택으로 둡니다 [안].
   - 위험: 중간
2. **`current`**: `BookGrouping`이 `BookGrouper`를 구현하게 합니다. 이름은 `CurrentGrouping`으로 바꾸거나 그대로 둡니다 [안]. **동작은 바꾸지 않습니다.**
3. **고르기**: 러너가 `grouping` 값으로 구현을 고르고, 시작 로그에 방식을 남깁니다. 기록 칸은 더하지 않습니다(backlog). `notes`·로그에만 남깁니다 [안].
4. **dry run 결과 파일** (파일: `DryRunDump.java` [안 이름], 설정 `dry-run-output` 폴더)
   - dry run에서 `mergeSameText` 뒤 다음 두 파일을 씁니다.
     - `books.tsv.gz`: 책 순번(첫 줄 순서), 제목, 저자, 출판사, 출판일, ISBN, 종류, 도서관 목록
     - `rows.tsv.gz`: 둘째 읽기로 (도서관, 책 코드) → 책 순번
   - 설정이 없으면 지금처럼 숫자만 냅니다(110-116행). [확정: 설계 #11]
   - 위험: 낮음 (둘째 읽기만큼 dry run이 길어짐)
5. **비교 도구** (파일: `scripts/catalog/compare_grouping.py`, [확정: 설계 #11·검토 결정 #2])
   - 두 dry run 폴더를 비교합니다: 다른 책 수, 줄의 책이 다른 수, 예시 목록(앞 N개).
   - 번호 비교:
     - 방식마다 `export`한 뒤 psql로 `catalog_next.book`(id + 내용 칸)과 `catalog_next.holding`(`library_id, item_key, id, book_id`)을 `ORDER BY`로 뽑습니다.
     - 두 방식의 출력을 흘려 가며 비교합니다. 파일이 크므로 줄 단위로 보고 앞 N개 차이만 남깁니다.
     - 끝나면 `discard`합니다.
   - psql은 `data/cycle08/psql.sh`와 같은 방법(`wsl … docker compose exec`)으로 부릅니다. 앱 코드에는 넣지 않습니다(C1).
   - 위험: 낮음
- 테스트: `BookGrouperContractTests` [안 이름] (단위)
  - 작은 줄 목록으로 ①~④ 단계별 책 수, 대표값 동점, 첫 줄 순서, `bookOf`를 봅니다. 이 테스트는 9·10단계에서 세 구현 모두에 같은 기대값으로 돕니다.
  - 기존 `CatalogImporterTests` 통과
- 확인: `current` dry run 두 번을 `compare_grouping.py`로 비교하면 차이 0(도구 자체 확인)
- `./gradlew build` 통과

**세 방식이 같은 결과를 내려면 지켜야 할 지금 규칙** (`BookGrouping.java`에서 읽음, plan 2026-10-12)
- ① 묶음 열쇠: 공유 번호 화면(`SHARED_CODE_KINDS` 44-45행)이면 `SHARED`, 아니면 `LIB<서비스 번호>`와 `item_key`(164-168행)
- ② 묶음이 가진 **모든** 교보식 ISBN 값으로 잇습니다(181행, 대표값만이 아님). 그다음 묶음 ISBN = 가장 많은 값(185행)
- ③ 묶음 순서(첫 묶음 순)대로 돌며, 같은 ISBN의 첫 묶음과 잇습니다(215-240행).
- ④ 같은 글 열쇠는 ④ 시작 때의 묶음으로 한 번에 계산합니다(253-258행).
- 이을 때는 작은 번호가 남고 ISBN은 남는 쪽 것이 먼저입니다(`putIfAbsent`, 422-435행).
- 대표값은 개수 큰 순, 같으면 `String.compareTo`로 작은 값(370-380행). 출판일은 `PublishedDates.representative`
- 책 순서 = 첫 묶음(= 첫 줄) 순(383-403행)
- `ImportReport` 숫자(`booksAfter*`, `sameTextMerged`, `sameTextWideDates`와 표본, `nationalBibliographyIsbnAttached`)도 세 방식이 같게 채웁니다.

### 9단계: `compact` (의존: 8단계)

1. **구현** (파일: `CompactGrouping.java` [안 이름]) [확정 방향: 스펙 R-B2, 설계 #9]
   - 제목·저자·출판사·공급자 필드별로 같은 글자를 하나로 합칩니다.
   - `Votes` 6개 대신 묶음 안의 칸을 둡니다: 첫 값 + `int` 개수, ISBN `long`, 날짜 epochDay, 종류 `byte`. 두 번째 값부터만 작은 맵에 둡니다.
   - 도서관 목록은 `int[]`로 둡니다.
   - 묶음 열쇠는 `space|itemKey`의 64비트 해시 둘(128비트)을 원시 배열 해시표에 둡니다(결정 9 A안).
   - 위 "지금 규칙"을 그대로 따릅니다.
   - 위험: 중간 (동점·순서 차이)
- 테스트: `BookGrouperContractTests`가 `compact`로 통과. 128비트 열쇠 표는 늘어나기와 겹침 처리 단위 테스트
- 확인: 새 사본 dry run에서 `current`와 `compact`를 비교해 다른 책 0
- `./gradlew build` 통과

### 10단계: `sql` (의존: 8단계, 9단계와 독립)

1. **구현** (파일: `SqlGrouping.java` [안 이름]) [확정 방향: 스펙 R-B3·B4·B5, 설계 #10]
   - 러너가 따로 연 연결의 `TEMPORARY` 표(결정 10 A안)를 씁니다.
   - 처리 순서:
     1. 첫 읽기: Java가 줄마다 정리값(`title_norm`, `main_title_norm`, `publisher_norm`, `first_author`, 교보식 ISBN, 출판일)과 읽은 순번 `seq`를 COPY합니다. 이 시간은 `step_seconds` 키 `rows_copy` [안]입니다.
     2. 묶음 번호는 `row_number() OVER (ORDER BY min(seq))`입니다.
     3. 사슬 잇기는 바뀐 줄이 0이 될 때까지 `label := min`을 되풀이합니다. 횟수 상한 값은 dev가 정해 보고합니다 [안]. 상한에 닿으면 틀린 결과로 넘어가지 않고 실패합니다.
     4. 대표값은 개수 큰 순, 같으면 `COLLATE "C"` 순으로 고릅니다(`mode()`는 쓰지 않음). `mode()`는 동점에서 "arbitrarily choosing the first one"입니다(https://www.postgresql.org/docs/18/functions-aggregate.html , research 9절).
     5. ③ 국가서지와 ④ 같은 글은 한 번씩 합니다.
     6. 책을 `label` 순으로 흘려 Java가 씁니다.
     7. 둘째 읽기는 `seq` 순으로 흘려 짝짓고, 매 줄 (도서관, 책 코드)를 확인합니다.
   - Java `compareTo`(UTF-16)와 C 정렬(코드 포인트)은 보조 평면 문자와 U+E000~U+FFFF 사이에서만 다를 수 있습니다. 이 차이는 결과 비교로 잡습니다(R-B4).
   - `temp_buffers` 기본은 8MB입니다(https://www.postgresql.org/docs/18/runtime-config-resource.html , 확인 2026-10-12). 그래서 임시 표는 대부분 디스크로 가고, `temp_bytes`·`pg_database_size`로 잽니다.
   - 위험: 높음 (일이 크고, 사슬 시간·디스크를 모름)
- 테스트: `BookGrouperContractTests`가 `sql`로(`db-test`) 통과. 동점 값이 C 정렬과 `compareTo`에서 같은 경우·다른 경우(보조 평면 문자) 표본. 사슬이 긴 경우
- 확인: 새 사본 dry run에서 `current`와 `sql`을 비교해 다른 책 0
- `./gradlew build` 통과

### 11단계: B 결과 비교와 측정 (의존: 7·9·10단계)

**측정하는 동안 내 PC `catalog`는 그대로 둡니다.** 모든 `export`는 `discard`로 끝내므로 세 방식이 같은 기준에서 번호를 받습니다. 7단계의 `finish`는 모든 B 측정보다 **앞에** 끝냅니다 [안].

1. **결과 비교 (AC-8, AC-9)**
   - 새 사본으로 세 방식 dry run(`dry-run-output`) → `compare_grouping.py`
   - 방식마다 `export` → 번호 뽑기 → `discard` → `compare_grouping.py`
   - 다른 책이 0권이고 책·소장 번호가 모두 같아야 통과입니다. 다르면 예시 목록을 남깁니다.
2. **측정 (AC-10)** [확정: 스펙 R-B6, scope "측정"]
   - 실행 넷, 같은 사본·같은 PC:
     - `current`
     - `current` + `-XX:+UseStringDeduplication -XX:+UseCompactObjectHeaders`
     - `compact`
     - `sql`
   - 방식마다 `export` 두 번, 모두 `-Xlog:gc*:file=…`를 켭니다.
   - 관점 여섯:
     - 메모리: GC 기록 최고와 `noteHeap`
     - 시간: 전체와 `step_seconds`
     - DB 디스크: `pg_database_size` 최대, `pg_stat_database.temp_bytes` 전후 차이
     - CPU: Java `getProcessCpuTime` [안 위치: 끝 로그], DB 컨테이너 cgroup `cpu.stat` 전후 [확인 필요: 경로]
     - 가져오는 동안 검색 p95·오류(`probe_during_import.py`)
     - 결과(1번)
   - **힙 줄이기**: 방식마다 6→4→3→2→1GB로 끝까지 되는 가장 작은 값까지 내려갑니다. 줄이는 실행은 단계마다 한 번 [안], 처음 실패한 값에서 멈춥니다.
   - 시작 힙은 6GB입니다(#3c). 측정 두 번은 6GB에서 합니다 [안].
3. **옛 사본 한 번** [확정: 점검 #2]: `ebook-catalog-2026-10-05-0745.sqlite`로 `current` 방식, 힙 6GB 측정 한 번만 해서 사이클 08 #3c(약 33분)와 바로 비교합니다 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-handoff-review.html` #2).
4. **기본값 추천** (R-B7): 결과 비교를 통과하고 전체 시간이 43분 안(#3c 약 33분 + 10분)인 것 중 힙이 가장 작은 것. **기본값은 바꾸지 않고** 추천만 보고합니다.
- 결과 표(방식 × 관점 × 두 번, 힙 줄이기 표)를 `# 사이클 11` 절과 3-import.md 5절에 남깁니다.
- 위험: 중간 (실행 시간이 깁니다)

## 테스트

- 단위: 해시 계산(같은 입력이면 같은 값, 순서), manifest COPY 글 해석, `BookGrouperContractTests`(세 구현), 128비트 열쇠 표, 동점 규칙
- 통합(`db-test`):
  - 새 테스트: `CatalogImportRecordTests`, `CatalogTransferTests`, `CatalogImportModesTests`, `BookGrouperContractTests`의 `sql` 쪽
  - 기존 테스트(고치지 않고 통과): `CatalogLoadSwapTests`, `CatalogLoadBookIdTests`, `CatalogImporterTests`, `NationalBibliographyTests`
  - `ModularityTests`(모듈 의존 변화 없음, `verify()`), `DocumentationTests`, 사이클 05~10 기존 테스트 전부
- 실데이터: 7단계(A), 11단계(B)
- 화면: 없음(웹 변경 없음). AC-1·AC-2의 검색 응답 비교는 `measure_books.py`·`compare_books.py`로 합니다.

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 내보내기 → 파일 하나, 내 PC `catalog` 그대로 | `CatalogTransferTests` + 실데이터 `compare_books.py` 전후 | 4, 7 |
| AC-2 반영 뒤 운영 책 수·책 번호·소장 번호 = 내 PC `catalog_next` | `CatalogTransferTests` + 실데이터 SQL 번호 비교와 `compare_books.py` | 4, 7 |
| AC-3 반영 중 기다림 1초 안, 5xx 0 | `probe_during_import.py`(`db-ops` 서비스) | 6, 7 |
| AC-4 도서관·연결표·책 표를 바꾸면 시작 안 함, `mismatch` + 다른 곳 | `CatalogImportModesTests` + 실데이터 | 5, 7 |
| AC-5 복원 도중 멈춤 → 검색 그대로, 다음 반영이 지우고 끝까지 | `CatalogTransferTests`(깨진 파일) + 실데이터 멈춤 | 4, 7 |
| AC-6 `finish` 뒤 두 DB 비교 값 같음 | 실데이터 기준값·해시 비교 | 7 |
| AC-7 운영 기록 한 줄에 내 PC 단계 + 반영 단계 | `CatalogImportModesTests` + 실데이터 `step_seconds` | 5, 7 |
| AC-8 세 방식 dry run 끝까지 | 실데이터 dry run 셋 | 11 |
| AC-9 세 방식 다른 책 0, 책·소장 번호 같음, 다르면 예시 | `compare_grouping.py` + 계약 테스트 | 8~11 |
| AC-10 측정 표(방식 × 관점 × 두 번, 힙 최소값) | 11단계 측정 | 11 |
| AC-11 칸 구조가 다르면 `mismatch`(표 구조) | `CatalogTransferTests` + 실데이터 | 4, 7 |
| AC-12 기다릴 때 `export` 다시 → 멈춤, 둘 다 그대로 | `CatalogTransferTests`·`CatalogImportModesTests` + 실데이터 | 4, 5, 7 |
| AC-13 반영 도중 멈춘 뒤 `discard` → 지워짐, 검색 그대로 | `CatalogTransferTests`(`discard` 세 경우) + 실데이터 | 4, 7 |
| AC-14 상한 1GB `db-ops`에서 반영 끝까지(256MB), 색인 시간 기록 | 실데이터 + `docker inspect` | 6, 7 |
| AC-15 `finish`를 색인에서 멈춤 → 기다림 유지·`export` 멈춤, 다시 `finish` → 끝까지·비교 값 같음 | `CatalogTransferTests`(일부) + 실데이터 | 4, 7 |

## 완료 기준

- [ ] spec AC-1~AC-15를 위 표의 방법으로 모두 확인함
- [ ] `backend/`에서 `./gradlew build` 통과(`ModularityTests` `verify()`, `DocumentationTests` 포함)
- [ ] 이미 적용된 changeset은 바뀌지 않음(`git diff`에 새 `collection` 파일과 master include만)
- [ ] `in-place`(기본)·`current`(기본)로 돌린 가져오기가 사이클 08과 같은 결과·같은 `step_seconds` 키를 냄
- [ ] 1단계 프로토타입 다섯 개의 결과와, 실패했다면 고른 대안을 보고함
- [ ] 3-import.md에 따로 하기 절차, 설정, 실패 이유, 키를 적음
- [ ] 측정 표와 기본값 추천을 `# 사이클 11` 절에 적음(기본값은 `current` 그대로)
- [ ] [확인 필요] 결과와 설계와 달라진 점을 `# 사이클 11` 절에 적음

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 결과에 따라 | 막는 단계 |
|---|---|---|---|
| IDENTITY 시퀀스 값이 덤프·복원으로 넘어가는지 | 1단계 프로토타입(공식 문서상 넘어감) | 안 되면 복원 뒤 `setval` | 4 |
| `wsl … exec -T` 파이프로 바이너리가 깨지지 않는지 | 1단계 체크섬 | 깨지면 bind mount / `docker cp` | 4 |
| 컨테이너 안 도구가 암호 없이 붙는지 | 1단계 | 방법 보고 | 4 |
| Java가 죽었을 때 `pg_restore`가 계속 도는지 | 1단계 `PGAPPNAME` + `pg_stat_activity` | `discard`가 남은 세션을 볼지 | 4 |
| 파이프로 쓴 `-Fc` 파일에서 manifest만 읽는 시간 | 1단계(Claude 판단, 문서 확인 안 함) | 느리면 파일 쓰기 방식 바꿈 | 4 |
| 덤프 크기, 복원 시간, 운영 디스크 최대, 상한 1GB에서 색인 시간 | 7단계 측정 | 보고 | 없음 |
| 기준값 계산(`count(*)` 약 1,770만 줄 등) 시간 | 7단계 `compare` 시간 | 길면 보고 | 없음 |
| `sql` 사슬 반복 수·시간·임시 표 디스크, 43분 안인지 | 10·11단계 | 보고 | 없음 |
| DB 컨테이너 cgroup `cpu.stat` 경로 | 11단계 전 dev 확인 | 방법 보고 | 11 (값만) |
| 디스크 여유 | 0단계 | 부족하면 사용자에게 알림 | 6 |
| 새 사본에서 도서관 411이 빠지지 않는지(`library_base_url_mismatch`) | 7단계 로그 | 보고 | 없음 |
| `db` → `db-ops` 처음 복사 방법 | 6단계 dev가 정함 | 절차 문서 | 7 |

## 이번에 하지 않는 것

- 정해진 때 혼자 도는 자동 갱신(backlog 메모만), 진짜 운영 서버 배포, 인터넷으로 파일 보내기
- 반영이 동시에 두 번 돌지 않게 막기(`pg_advisory_lock`), `catalog_import`에 묶는 방식 칸, 복원 파일을 받아 `pg_restore -j`, `sql` 방식의 국가서지 맞대기를 SQL로(모두 backlog 후보)
- 책 묶기 기준 다시 보기(사이클 12), 묶는 규칙·대표값 규칙 바꾸기
- 측정 뒤 기본 방식 바꾸기(사용자 결정 뒤 다음 사이클), 쓰지 않는 방식 지우기
- 수집기를 서비스 쪽으로 옮기기, 새로 수집하기
- 화면·REST API 변경, 새 모듈·이벤트
- 운영에서 책 표를 직접 고치는 기능
- 이미 적용된 changeset 고치기, 로컬 `db`·`db-test` 초기화
- 사이클 10과 엮는 "반영 끝" 즉시 인기 도서 캐시 새로 고침

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 11`** 절에 **무엇이 달라졌는지와 이유**를 적습니다. 사용자 발언이면 그대로 옮깁니다.

- 프로토타입 다섯 개의 결과, 고른 대안, pg 도구 명령 앞부분의 실제 모양(경로·암호 값은 빼고)
- 정한 이름과 방법
  - `CatalogLoad` 메서드·레코드 이름
  - `columnsHash` 위치, `load_manifest` 칸 이름·`format_version`
  - 해시 계산식, 설정 키·Gradle 속성 이름
  - changeset 파일 이름·번호와 제약 이름
  - `BookGrouper` 모양(`bookOf` 대신 무엇을 썼는지, `Book.units` 처리)
  - `sql` 사슬 상한 값
  - `db-ops` 이름·복사 방법, 측정 스크립트 이름·인자
- 설계에 정해져 있지 않아 dev가 정한 것
  - `finish` 실패 때 기록 줄을 남겼는지
  - 잠금 5번 실패 때 `finish`가 새 표를 남겼는지
  - `mismatch` `failure_detail`의 꼴
  - dry run이 기다리는 새 표와 함께 도는지
  - 테스트에서 진짜 pg 도구를 썼는지
- 7단계 숫자
  - `dump` 시간과 파일 크기
  - `compare`·`restore`·`index`·`analyze`·`swap`·`apply` 시간
  - 반영 중 검색 p95·5xx
  - `db-ops` 디스크 최대, 컨테이너 메모리 최고, `OOMKilled` 여부
  - `finish` 시간
  - AC-4·AC-5·AC-11~AC-15 결과
- 11단계 표
  - 방식 넷 × 관점 여섯 × 두 번, 힙 줄이기 표(끝까지 된 가장 작은 값과 실패 모양)
  - GC 기록 요약, `temp_bytes`, `pg_database_size` 최대, CPU
  - 결과 비교(다른 책 수, 번호 차이 수, 예시)
  - 옛 사본 한 번과 사이클 08 #3c 비교
  - 기본값 추천과 그 근거(R-B7 기준)
- 새 사본: 파일 이름·복사한 때, 읽은 줄·건너뜀·책 수(3-import.md 5절 꼴), 411 결과
- [확인 필요] 표 각 행의 결과, 설계와 달라진 점, 새로 알게 된 제약, AC 확인표
