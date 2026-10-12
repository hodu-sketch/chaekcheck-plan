# 개발 인계서: 사이클 13 수집기 (dev로 갈아타기 + 도서관 넣기 명령)

- 승인: [확정] (사용자 승인, 2026-10-12). plan이 사이클 폴더에 둡니다. `docs/current/handoff.md`에는 이 파일 링크와 짧은 알림만 넣습니다 (사용자: "이거 handoff 이 사이클용으로 작성하고 공용 handoff에는 이 사이클용 문서 링크하고 간단히만 알려줘", 2026-10-12)

## 시작 조건

- 사이클 13은 plan에서 **미리** 설계한 것입니다(ADR-0083~0088·0093 머리 표시). **사이클 12 개발과 나란히, 따로 뺀 작업 폴더(git worktree)에서** 진행합니다 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-separate-db.html`)
  - **DB 묶음을 따로** 띄웁니다: 작업 폴더의 `.env`에 `DB_PORT=5442`, `TEST_DB_PORT=5443`, `OPS_DB_PORT=5444`(예시), compose 프로젝트 이름은 `docker compose -p chaekcheck-13 …`(`compose.yaml`의 `name: chaekcheck`보다 `-p`가 먼저). 띄운 뒤 `docker compose ls`로 12의 `chaekcheck`와 따로 보이는지 확인. 12·11이 쓰는 5432·5433·5434 DB는 건드리지 않습니다
  - 새 DB는 비어서 시작하고 Liquibase가 표·도서관 seed를 만듭니다. 그래서 2단계 칸 이름은 파일 고침만으로 되고, 이 DB에는 "로컬 DB 맞추기" SQL이 필요 없습니다
  - **지금 할 것: 1~8단계.** 9단계(실데이터: 6곳 넣기, 운영 흉내 반영), 10단계 마지막 대조, main에 합치기는 **사이클 11·12가 main에 합쳐진 뒤** 그 위로 옮겨서(rebase) 합니다. 그때 12와 겹치는 파일(아래 표)의 충돌을 풀고, 12·11이 쓰던 `db`·`db-ops`에 "로컬 DB 맞추기" SQL을 돌립니다
  - 데이터 폴더(수집 DB)는 하나라 1단계 수집(여주대 빈 곳 채우기) 동안 다른 수집은 돌리지 않습니다
- 사이클 14(사서추천도서, plan `docs/cycles/14-librarian-picks/handoff.md`)는 이 사이클이 끝나고 커밋된 뒤에 시작합니다
- 작업은 dev 저장소(`chaekcheck-dev`)에서 합니다. 수집 데이터 폴더는 `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data`(git 밖)이고, 수집 DB `ebook-catalog.sqlite`(약 16.5GB)와 `snapshots\`가 있습니다. 로컬 DB(`db` 5432, `db-test` 5433, `db-ops` 5434)는 앞 사이클과 같이 씁니다
- 수집은 이번 사이클 내내 **집 PC**에서 합니다. 클라우드·프록시는 backlog입니다 [확정] (scope 포함 4)
- **사이클 13 개발이 끝난 뒤부터 수집·도서관 넣기는 dev 쪽 별도 "수집" 세션에서 돌립니다.** plan은 조사·원칙·결정만 합니다. 개발 세션과 섞지 않고, 수집 도중 코드가 바뀌지 않게 개발이 쉬는 때 돌리거나 따로 작업 폴더를 씁니다 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-where-to-crawl.html`)
- **`*.dkyobobook.co.kr`(교보 구독형 서버)에는 요청을 보내지 않습니다.** 우리 IP를 막았고, 대여·혼합은 제외(ADR-0067)라 받을 것도 없습니다 [확정] (spec R1-6)
- 사이클 11·12·14와 겹치는 파일 (병합 충돌 주의)

| 파일 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|
| `collection/internal/importer/CatalogImportRunner.java` | 모드 | `GROUPINGS` | apply 순서는 `ImportTransfer` 쪽, 러너는 새 프로필과 따로 | — |
| `ImportTransfer.java` | export/apply | — | `Notes.libraryPart`, 도서관 부분 → 비교 | — |
| `ImportReport.java`, `ImportRecords.java` | 칸 | 카운터 | `candidateLibraries` 이름 바꿈 | — |
| `CollectedCatalog.java` | — | 거르기 | `FIRST_CANDIDATE_ID`·`candidate()` 이름 바꿈 [안] | — |
| `CatalogImporterTests`, `CatalogImportRecordTests`, `CatalogImportModesTests` | 있음 | 있음 | 칸 이름, 판 2 | — |
| `catalog/internal/JdbcCatalogLoad.java`·`Manifests.java` | 판 1 | — | `FORMAT_VERSION = 2` | `BookLookup`만(다른 파일) |
| `db.changelog-master.yaml` 끝줄 | `collection/005` | — | `library/015`, `collection/006` | `popular/001` 지움, `picks/001` |
| `web/src/features/about/AboutPage.tsx` | — | — | 문단 ② | 문단 ③ |
| `ModularityTests`, `AuthEnabledSecurityTests` | — | — | 새 GET | `popular` → `picks` |

## 요약

데이터 폴더의 옛 Python 수집기를 dev `scripts/crawl/`로 갈아탑니다(첫 시험: 여주대 수집 102084 빈 곳 채우기, 옛 코드는 `_old-scripts-2026-10-12`로 옮겨 남김). 새 도서관은 Liquibase seed가 아니라 `collection` 모듈의 명령 `library-insert`(미리 보기 → 보고서 → 넣기, 앱 재시작 없음)로 넣고, `library`에는 처음으로 쓰기 공개 API `LibraryRegistry`가 생깁니다. 운영에는 반영 파일 판 2(`load_manifest.notes.libraryPart`)로 "도서관 → 비교 → 책" 순서로 옮깁니다. "후보" 이름 없애기, 1215 이름 고치기, `/about`에 가입 조건 조사 기준일 한 줄.

## 이 인계서를 쓰는 규칙

- 이 파일은 plan이 관리합니다. dev에서 고치지 않습니다
- 구현이 인계서·design-delta와 달라져야 하면 먼저 사용자에게 알리고, dev `docs/plan-feedback.md`의 **새 `# 사이클 13` 절**에 내용과 이유를 적습니다
- **이름은 모두 [안]이고 dev가 바꿀 수 있습니다** [확정] (사용자 선택 "이름은 [안]으로 두고 dev가 바꿔도 됨", 2026-10-12). 바꾸면 `# 사이클 13`에 알리기만 합니다(프로필·설정 키·표·칸·제약·클래스·메서드·경로·명령·파일 이름)
- 바꾸지 않는 것 [확정]
  - 넣기는 두 단계(미리 보기 → 보고서 번호로 넣기), 보고서와 다르면 넣지 않음
  - 한 트랜잭션(도서관·가입 규칙 → 짝 표 → 실행 기록)
  - 비교 대상은 서비스 DB 전체와 수집 사본
  - seed로 도서관 번호를 넣지 않음, 넣는 것은 새로 생긴 곳만
  - API 경로 `GET /api/v1/join-surveys/latest`(ADR-0093)
  - 판 2와 반영 순서
  - 보관 폴더 이름 `_old-scripts-2026-10-12`
  - 공지 문구와 자리
- 태그: `[확정]` 사용자 결정 또는 확인된 값, `[안]` 제안, `[확인 필요]` 모르는 값(코드에는 `TODO(확인 필요)`)
- 새 의존성 없음. HTML 글자 풀기는 JDK·Spring에 있는 것으로 하고, 무엇을 썼는지 보고 [안]
- 단계마다 `backend/`에서 `./gradlew build`(`ModularityTests`·`DocumentationTests` 포함), 웹을 고친 단계는 `web/`에서 `npm test`·`npm run build`·`npm run lint`를 통과해야 다음으로 갑니다

## 참고 문서 (plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/13-crawler-to-dev/design-delta.md`: **기준 문서**(구조 그림, 모듈 표, 데이터 표, API, 스크립트·이름 바꾸기 목록, 겹치는 곳, 확인 필요). 그림: `easy/2026-10-12-design-delta.html`
- `.../13-crawler-to-dev/spec.md`: R1~R5, 상태별 동작, AC-1~12
- `.../13-crawler-to-dev/flow.md`: C0·C1·P1·P2·I1·I2, S12
- `.../13-crawler-to-dev/research.md`: 1절(지금 스크립트 규칙·옮길 때 조심할 것), 4-1절(사이클 11과 만나는 곳), 7절(기대값 6곳)
- `architect-proposal.md`는 결정 과정 기록일 뿐, 구현 기준은 design-delta
- ADR: 0083(`LibraryRegistry.add`·`nextId`), 0084(넣기 명령), 0085(규칙 TSV), 0086(판 2), 0087(기준일·공지), 0088(갈아타기), 0093(`listAll`, 실행 기록 옮기기, 경로)

## 개발 시작 전 확인

### dev가 확인할 것
- [ ] 13용 작업 폴더(worktree)와 따로 띄운 DB 묶음(`chaekcheck-13`)을 만듦. main에 합칠 때는 사이클 11·12가 커밋·합쳐졌는지 봄
- [ ] base package `com.chaekcheck`(dev `CLAUDE.md`). 고칠 패키지: `com.chaekcheck.library`, `com.chaekcheck.library.internal`, `com.chaekcheck.collection.internal.importer`, `com.chaekcheck.catalog.internal`. 새로: `com.chaekcheck.collection.internal.libraryinsert`, `com.chaekcheck.collection.internal.web` [안]
- [ ] master 끝줄과 모듈별 마지막 번호. plan 읽기(2026-10-12) 기준 master 끝은 `collection/005-import-export.yaml`(85-88행), `collection` 005, `library` 014 → 새 파일 `collection/006-library-insert-run.yaml`, `library/015-library-name-1215.yaml` [안]. 사이클 11·12가 더 넣었으면 그다음 번호
- [ ] `PRE_DEPLOYMENT` 표지(`backend/src/main/resources/db/changelog/PRE_DEPLOYMENT`)가 아직 있는지. 없으면 `collection/001`을 그 자리에서 고칠 수 없으므로 멈추고 사용자에게 물음
- [ ] 내 PC `db`에 사이클 11 판 1 내보내기가 기다리고 있지 않은지(`catalog_next.load_manifest`). 있으면 사용자에게 물어 `finish` 또는 `discard`. 판 2 앱에서는 판 1 파일을 `finish`할 수 없음(ADR-0086)
- [ ] 수집기가 돌고 있지 않은지(`crawl_catalog.py` 프로세스 없음)
- [ ] 기준선: `./gradlew build`, `python -m unittest scripts/library/test_build_candidate_seed.py`, `web/`에서 `npm test`가 지금 그대로 통과

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 데이터 폴더의 옛 `scripts\`, `resume.cmd`를 `_old-scripts-2026-10-12\`로 옮기는 것 승인(dev 세션이 할지, 사용자가 직접 할지) | 1단계 | 승인 |
| (없음) 로컬 DB 이름 바꾸기는 dev 세션이 함 (2단계 "로컬 DB 맞추기") | — | — |
| 미리 보기 보고서에 의심·바뀐 곳·사라진 곳이 있으면 답하기(R2-8). 2026-10-12 사본 기대값은 모두 0 | 9단계 | 답 |

## 구현 단계

### 0단계: 시작 확인 (의존: 없음)
1. 위 확인을 모두 하고 결과를 `# 사이클 13` 절 머리에 적음. 위험: 낮음

### 1단계: 수집기 갈아타기 (Python, 의존: 0단계) — AC-1, AC-2
1. **`vendor` 칸과 `migrate`** (`scripts/crawl/crawl_catalog.py` 71행 근처 `CREATE TABLE library`, 153행 `migrate`)
   - 데이터 폴더 옛 수집기(`chaekcheck-data\scripts\crawl_catalog.py`)에 2026-10-12 더해진 `library.vendor` 칸을 dev에 옮김. 새 DB는 표 만들기, 있는 DB는 `migrate`의 `ALTER TABLE library ADD COLUMN vendor TEXT`. 옛 파일과 dev 파일의 차이(10-05 복사 뒤 바뀐 것)를 먼저 비교해 `vendor` 말고 빠진 것이 있는지 보고
   - 이유: 갈아타기 결정 3, spec R1-2. 넣기 명령이 `vendor`를 읽음(R2-6)
   - 위험: 중간 (수집 DB 16.5GB에 `ALTER`, 이미 칸이 있으면 건너뜀)
2. **빈 곳 채우기 명령** (같은 파일, 하위 명령 `refill-pubdt` [안])
   - 데이터 폴더 `refill_pubdt.py`가 하던 일(한 도서관 목록을 출판일 순서로 다시 읽어 빠진 책을 채움, 982행 근처 `refilled … in pubdt order` 로직)을 하위 명령으로. 인자: 수집 도서관 번호. 지우지 않고 더하기만
   - 시작·끝에 그 도서관의 `holding` 줄 수를 로그에, 끝에 `refill done` [확정] (AC-1 문구)
   - 호출 예절 그대로(IP마다 한 줄, 1건, 1초). 403·시간 초과가 이어지면 그 도서관만 받지 않음 표시(R1-7)
   - 위험: 중간
3. **`resume.cmd` 손보기** (`scripts/crawl/resume.cmd`)
   - 38행 `--include-big-subscription`을 뺌. 31-32행 `host-slots.txt` 읽기도 빼거나, 파일이 있으면 무시한다는 경고만 [안] (spec R1-6: 그 4건 설정은 쓰지 않음)
   - 수집기 안에서도 `*.dkyobobook.co.kr` 호스트를 건너뛰는 안전장치를 둘지 dev가 판단 [안]. 두면 로그 한 줄
   - 33행 두 벌 실행 검사가 `full`만 봄. `refill-pubdt`도 같은 검사로 막을지 [안]
   - 이유: 막힌 서버에 요청을 보내지 않음. 위험: **높음** (빠뜨리면 막힌 서버를 다시 부름)
4. **데이터 폴더 도구 옮기기** (`scripts/library/fetch.py`, `probe_logos.py`, `probe_home_logos.py`)
   - 데이터 폴더에서 dev로 복사, 경로는 `--data-dir`·`CHAEKCHECK_DATA` 규칙(spec 입력 표). `apply_rename.py`는 옮기지 않음 [확정]. `refill_pubdt.py`는 2번이 대신
   - dev `CLAUDE.md` "Library Research Record" 규칙대로 `docs/library-maintenance.md`에 도구 위치. 위험: 낮음
5. **옛 코드 보관** (데이터 폴더, git 밖)
   - 사용자 승인 뒤 `chaekcheck-data\scripts\`와 `chaekcheck-data\resume.cmd`를 `chaekcheck-data\_old-scripts-2026-10-12\`로 **옮김, 지우지 않음** [확정]. 옮긴 뒤 데이터 폴더 맨 위에 `resume.cmd`가 없는지. 위험: 낮음
6. **첫 실행**
   - dev `crawl_catalog.py --data-dir … status`(읽기 전용). 전체 성공 기록 없는 곳 2곳(무주초 100252, 창원문성대 102020)이 기대값(research 7절 7)
   - `migrate` 후 `refill-pubdt 102084`
   - AC-1: 끝까지 돌고 102084 줄 수가 전보다 늘거나 같음(10-12 기준 83,756줄, 빈 책 약 20권 [추정]), 로그에 `refill done`
   - AC-2: 데이터 폴더에 옛 `resume.cmd` 없음, 보관 폴더에 옛 코드 있음, dev `resume.cmd`만 수집 시작(두 벌 검사 메시지 확인)
7. **문서**: plan `docs/research/ebook-catalog/crawl-runbook.md`의 진행 상태·진행 표(1·2·3·8절)를 dev `docs/maintenance/2-crawl.md`로 옮기고(plan에는 결정 기록만 남음) [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-where-to-crawl.html`). `scripts/crawl/README.md`, `docs/maintenance/2-crawl.md`에 갈아타기, `refill-pubdt`, 보관 폴더, "교보 구독형 서버 요청 안 함", robots.txt 기록만(R1-7), User-Agent 연락처는 서비스 주소가 생기면(R1-8)
- 확인: `python -m py_compile scripts/crawl/crawl_catalog.py`. `vendor` `migrate`가 두 번 돌아도 되는지 작은 SQLite 단위 시험 [안]: `scripts/crawl/test_crawl_migrate.py`

### 2단계: Liquibase와 칸 이름 바꾸기 (의존: 0단계) — AC-9, AC-11 일부
1. **`collection/001` 그 자리에서 고침** (`backend/src/main/resources/db/changelog/collection/001-collection-schema.yaml` 49·50행)
   - `candidate_library_count` → `other_library_count`, `catalog_import_candidate_library_count_check` → `catalog_import_other_library_count_check` [안 이름, 바꿈·방식은 확정 (사용자 선택 "기존 파일을 고침", 2026-10-12)]
   - 배포 전 규칙(`PRE_DEPLOYMENT`)에 따른 수정이라는 주석. 사이클 14 `popular/001` 처리와 같은 방식. 위험: 중간 (체크섬)
2. **새 표** (`collection/006-library-insert-run.yaml` [안], master 끝에 `# cycle 13: library insert (ADR-0084, ADR-0093)` 주석과 include)
   - `collection.library_insert_run`: design-delta 데이터 표 그대로 — `id` IDENTITY PK, `report_id` text NOT NULL CHECK `^[0-9a-f]{12}$`, `ran_at` timestamptz NOT NULL DEFAULT now(), `snapshot` text NOT NULL, `inserted_count` int NOT NULL CHECK ≥ 0, `join_surveyed_on` date NULL, `status` CHECK IN ('SUCCEEDED','FAILED'), `failure_detail` text + CHECK `(status = 'FAILED') = (failure_detail IS NOT NULL)`, `payload` jsonb NOT NULL, 부분 UNIQUE `(report_id) WHERE status = 'SUCCEEDED'`
   - CHECK·IDENTITY는 001처럼 raw `sql` change. 제약 이름은 `postgres-patterns` 스킬 규칙. 위험: 낮음
3. **1215 이름** (`library/015-library-name-1215.yaml` [안], master 끝)
   - `UPDATE library.library SET name = '한화S&C' WHERE id = 1215 AND name = '한화S&amp;C'` (013처럼 (번호, 옛 이름)) [확정 값]. 이미 적용된 `008-library-candidates.csv` 936행은 고치지 않음. 위험: 낮음
4. **Java 칸 이름** (`collection/internal/importer/ImportReport.java` 29-32·132·143행, `ImportRecords.java` 51·54·63행, `ImportTransfer.java` 73·81·95행 `Notes.candidateLibraries`)
   - `candidateLibraries` → `otherLibraries` [안], 로그 문구 `candidates %d`도
   - `Notes` JSON 키가 바뀌지만 판 1 파일은 판 2에서 어차피 거절(7단계)
   - `CollectedCatalog.java` 43-58·143행 `FIRST_CANDIDATE_ID`·`candidate()` → 예 `FIRST_COLLECTED_ONLY_ID`·`addedLater()` [안. design-delta 목록 밖이라 보탬, 보고]
   - 위험: 낮음 (사이클 12와 충돌 가능)
5. **로컬 DB 새로 만들기** (dev `CLAUDE.md` Database Migrations 예외 규칙)
   - `collection/001`을 고치면 체크섬이 바뀌어 `db-test`·`db`·`db-ops`(사이클 11에서 `db`를 복사함) 모두 그대로는 켜지지 않음
   - `db-test`: tmpfs라 컨테이너를 다시 띄움
   - `db`·`db-ops`: 아래 "로컬 DB 맞추기"의 SQL로 이름만 바꾸고 데이터 유지
   - 위험: 중간
- 테스트
  - `CandidateSeedTests` → `LibrarySeedTests` [안] (`backend/src/test/java/com/chaekcheck/collection/LibrarySeedTests.java`), 상수 `CANDIDATES` → `OTHERS` [안], 수는 그대로(280·2,383·2,663·253), 1215 이름이 `한화S&C`인지 단언 더함(AC-9)
  - `CatalogImporterTests`(65행 주석 포함), `CatalogImportRecordTests` 85행 칸 이름
  - `LibraryCatalogTests` 501행 `CandidateLibraries` → 예 `LibrariesAddedLater` [안, 보탬]
  - 새 표 제약 시험 `LibraryInsertRunSchemaTests` [안]: `report_id` 꼴, `status` 값, `failure_detail` 짝, 같은 `report_id` 성공 두 줄 거절, 실패 줄 여러 개 허용
- 확인: `./gradlew build`, 새로 만든 `db`에서 앱이 체크섬 오류 없이 켜지고 `/api/v1/libraries`에서 1215가 `한화S&C`

#### 로컬 DB 맞추기 [확정] (사용자 선택 "가벼운 방법", "이름도 니가 바꿔줘", 2026-10-12)
- 데이터(가져온 책, 국가서지 저장 표, 사이클 11 측정 결과)를 지키는 가벼운 방법으로 함. **dev 세션(Claude)이 직접 돌림**, 사용자가 손으로 할 일 없음
- **main에 합치는 때에** `db`와 `db-ops`(5434) 각각에서 한 트랜잭션으로:

```sql
BEGIN;
ALTER TABLE collection.catalog_import RENAME COLUMN candidate_library_count TO other_library_count;
ALTER TABLE collection.catalog_import RENAME CONSTRAINT catalog_import_candidate_library_count_check TO catalog_import_other_library_count_check;
UPDATE databasechangelog SET md5sum = NULL WHERE id = 'collection-001-catalog-import' AND filename LIKE '%collection/001-collection-schema.yaml';
COMMIT;
```
- `databasechangelog`가 있는 스키마는 dev Liquibase 설정을 보고 맞춤. `md5sum`이 NULL이면 다음 Liquibase 실행 때 새 값으로 다시 채움 [확인 필요: 앱을 켜서 체크섬 오류 없이 지나가는지 확인]
- 새 이름은 [안](dev가 바꾸면 SQL도 같이)
- 미리 하지 않음: 합치기 전에 이름만 바꾸면 지금 코드(`candidate_library_count`를 씀)와 사이클 11 측정이 깨짐. **13 작업 폴더의 따로 띄운 DB에는 필요 없고, main에 합칠 때 `db`·`db-ops`(5432·5434)에 돌림**
- `db-test`는 컨테이너를 다시 띄움(tmpfs)

### 3단계: `library` 공개 API `LibraryRegistry` (의존: 2단계)
1. **공개 API** (`backend/src/main/java/com/chaekcheck/library/LibraryRegistry.java`, 레코드 `NewLibrary`·`NewEligibilityRule`·`RegisteredLibrary` 같은 패키지 [안 이름])
   - `void add(List<NewLibrary>)`: 번호까지 정해진 도서관과 가입 규칙 줄을 넣음. `@Transactional(propagation = MANDATORY)` [확정] (ADR-0083). 같은 번호면 실패. 값 검사는 DB CHECK·UNIQUE
   - `long nextId()`: `GREATEST(max(id), 시퀀스 값) + 1`, **시퀀스를 소비하지 않고** 읽음(예 `pg_sequences.last_value`·`is_called`). dev seed 기준(`RESTART WITH 2675`, 2664~2674 비어 있음) 새 `db`의 첫 번호는 2675 예상 [추정, 9단계 AC-6에서 옛 스크립트와 대조]
   - 넣은 뒤 `setval(pg_get_serial_sequence('library.library','id'), GREATEST(max(id), 시퀀스 값))` [안]. `eligibility_rule.id`는 IDENTITY에 맡김
   - `List<RegisteredLibrary> listAll()`: 모든 도서관(꺼진 곳 포함, id 순) (ADR-0093). 칸 `id`, `name`, `baseUrl`, `vendor`, `lendingModel`, `orderNo`, `enabled`, **`platformType`** [안] (spec R2-4가 화면 종류도 비교)
   - `NewLibrary` 칸은 옛 스크립트 `LIBRARY_FIELDS`(`build_candidate_seed.py` 100행)와 같은 `library.library` 칸(`vendor`·`order_no`·`lending_model`·`join_survey` 포함, `enabled` true, `homepage_url` = `base_url`(R2-6)). `NewEligibilityRule`은 `008-eligibility-rule-candidates.csv` 머리 칸. seed의 글자 `'NULL'`·`'true'`가 아니라 진짜 NULL·boolean(research 1-4)
2. **구현** (`library/internal/JdbcLibraryRegistry.java` [안], `JdbcClient` INSERT)
   - `Library.java` 19·104행 Javadoc "Java never saves a library" → "seed와 `LibraryRegistry.add`(ADR-0083)만 넣음". 엔티티는 계속 읽기 전용(`insertable = false` 그대로)
   - `library/package-info.java`가 있으면 공개 API 설명 한 줄. 위험: 중간 (`library` 첫 쓰기 API)
- 테스트 `LibraryRegistryTests` [안] (`@SpringBootTest`, `db-test`, `@Transactional`): `add`가 도서관·규칙 줄을 넣고 `listAll`에 나옴, 넣은 뒤 IDENTITY 기본값 INSERT가 넣은 번호보다 큼, 같은 번호면 실패, 트랜잭션 밖이면 `IllegalTransactionStateException`, `nextId` 두 번 같은 값, `listAll`에 꺼진 곳(59·131)이 있고 개수가 표 전체와 같음, `(name, vendor, lending_model, order_no)` 중복이면 실패. db-test 연결 한도(사이클 10 기록): 기존 문맥 설정 그대로
- 확인: `./gradlew build`, `ModularityTests`(`library`가 `collection`을 모름)

### 4단계: 규칙 폴더와 옛 스크립트 이름 바꾸기 (Python, 의존: 0단계, 3단계와 나란히 가능) — AC-6 준비, AC-11 일부
1. **규칙 폴더** (`scripts/library/rules/` [안], ADR-0085)
   - TSV 하나씩: `name_overrides`, `same_site`, `demo_or_closed`, `same_host_kept`, `scope_overrides`, `public_join`, `library_kinds`, `kyobo_probe`, `bookcube_volume`, `final_origins` + 순번 2 허용 목록 + 한 줄 날짜 파일 `join_surveyed_on.txt`(값 `2026-10-05` [확정])
   - 출처: 옛 스크립트 상수(`DEMO_OR_CLOSED` 82행, `SAME_SITE` 86행, `SAME_HOST_KEPT` 89행, `SCOPE_OVERRIDES` 114행), 지금 파일(`scripts/library/name_overrides.tsv`, `final-origins.tsv`, `bookcube-volume-2026-10-11.tsv` + 데이터 폴더 `bookcube-volume-recheck-2026-10-12.tsv` 합침, 바뀌는 곳 없음 research 6절), 데이터 폴더(`library-join\public-join-2026-10-05.tsv`, `candidate-kinds-2026-10-05.tsv` → `library_kinds`, `other-platforms\kyobo-institutions-probe-2026-10-03.tsv`)
   - 지금 `scripts/library/name_overrides.tsv`·`final-origins.tsv`를 다른 곳도 읽는지(예 `CheckFinalOrigins.java`) 보고, 옮길지·그 자리에 두고 가리킬지 dev가 정해 보고 [안]
   - `same_host_kept`에 여주대 **100584·102084** [확정] (spec R2-7-1, 사용자 "둘 다 넣음")
   - `public_join`의 지역은 번호로 미리 풀어 적음. 도우미 `scripts/library/resolve_regions.py` [안] (`region/002-region-seed.csv`를 읽음)
   - **요약 문구(`eligibility_summary`)에 지역 이름이 필요함.** `collection`은 `region`을 모르므로 도우미가 요약 문구(또는 지역 이름)도 같이 적어 둠 [확인 필요: 프로토타입, 정한 방법 보고]
   - 위험: 중간 (옮기며 값이 빠지면 AC-6이 깨짐)
2. **옛 스크립트 이름과 입력**
   - `scripts/library/build_candidate_seed.py` → `build_library_seed.py`, `test_build_candidate_seed.py` → `test_build_library_seed.py` [안, 보탬], `name_candidates()` → `name_libraries()`, `FIRST_CANDIDATE_ID`·`candidate-kinds` 인자 이름, `scripts/library/candidates/` → `scripts/library/discover/`(안의 `probe_*.py` 문구 포함)
   - 옛 스크립트가 **규칙 폴더를 읽게** 바꿈(코드 속 상수 대신) → 새 명령과 같은 입력으로 비교(ADR-0085). 넣기 역할은 끝났으므로 seed 파일을 쓰지 않고 비교 출력(`--changes-only` 식)만 [안] (R4-3)
   - 위험: 중간
- 확인: `python -m unittest scripts/library/test_build_library_seed.py`. 규칙 폴더를 읽은 옛 스크립트가 2026-10-12 사본에서 상수판과 같은 결과(`--changes-only` 출력 비교), 다른 점은 같은 호스트 범위(research 7절 3-2)뿐

### 5단계: 넣기 명령 `library-insert` (의존: 2·3·4단계) — AC-3, AC-5, AC-8, AC-12
1. **러너** (`backend/src/main/java/com/chaekcheck/collection/internal/libraryinsert/LibraryInsertRunner.java` [안], `@Profile("library-insert")`, `@ConfigurationProperties("chaekcheck.collection.library-insert")`)
   - 설정 [안]: `mode`(`preview`|`insert`), `sqlite-path`(사본, 읽기 전용 `open_mode=1`, `CatalogImportRunner`와 같은 방식), `rules-dir`, `report-dir`(데이터 폴더), `report-id`(insert에 필요)
   - 프로필 파일 `backend/src/main/resources/application-library-insert.yml` [안]: `application-collection-import.yml`처럼 `web-application-type: none`, `chaekcheck.auth.enabled: false`, `chaekcheck.popular.fetch.enabled: false`
   - 종료 코드 [안]: 0 정상, 1 규칙 오류(보고서 없음), 2 같은 호스트 의심, 3 순번 2 이상, 4 보고서와 다름 (`SpringApplication.exit` + `ExitCodeGenerator`)
   - 커밋되는 설정 파일에 내 PC 경로를 넣지 않음. 위험: 낮음
2. **규칙 읽기** (`RuleSet` [안]): 모르는 종류·업체, 못 읽는 지역이면 보고서 없이 이유를 보이고 종료 1(spec 상태별 동작)
3. **계산** (`LibraryInsertPlanner` [안], 단위 시험이 쉬운 순수 클래스)
   - 서비스 쪽은 `LibraryRegistry.listAll()`과 `collection.collection_link`만 읽음. `library` 표를 직접 읽지 않음 (ADR-0093). seed 파일도 읽지 않음
   - 고르기(R2-5, 처음 걸리는 것으로 빠짐): 교보 대여·혼합(probe `model`) → `crawl_skip` → 전체 수집 성공 없음 → 체험용·운영 중단 → 같은 사이트 → 종류 TEST. 남은 곳에 종류가 없으면 멈춤(종료 1)
   - 값(R2-6)
     - 번호: `nextId()`부터 수집 번호 순
     - 이름: 수집 이름 → `name_overrides` → HTML 글자 풀기
     - 업체: 수집 `vendor`, 없으면 화면 종류 대응표(옛 `VENDORS` 93행)
     - 대출 방식: 교보 구독형은 probe, 북큐브는 권수 0이면 구독, 통합 포털은 NULL, 나머지는 소장
     - 순번: **서비스 전체**를 보고 (이름, 업체, 대출 방식)별로
     - 가입 조사 상태·규칙 줄: `public_join`·종류(소속 전용 종류는 `MEMBERS_ONLY`)
     - `base_url`은 `final_origins`의 최종 주소, `homepage_url`도 같은 값
   - 네 목록(R2-4): 새로 넣을 곳 / 바뀐 곳(사이트 주소, 기관 이름, 화면 종류·대출 방식, 받지 않음·실패 — 최종 주소·이름 바꾸기를 **먼저 적용한 값**으로 비교) / 사라진 곳 / 의심(같은 호스트 + 책 코드 겹침, 순번 2 이상)
   - 같은 호스트(R2-7): **새 곳이 하나라도 낀 쌍**만(새 곳끼리, 새 곳과 서비스 전체). `same_host_kept`의 번호는 뺌. 책 코드는 사본 `holding(library_id, item_key, removed_at IS NULL)`
   - 옮길 때 조심(research 1-4): 주소 비교 세 가지(probe는 끝 `/`를 뗌, 최종 주소는 글자 그대로, 같은 호스트는 호스트 이름만), `_`가 든 호스트(`java.net.URI#getHost`가 null일 수 있음), 순서가 정해져 있을 것
   - 위험: **높음** (Python 규칙 이식, AC-6)
4. **보고서** (`InsertReport` [안])
   - 정규화 JSON(만든 시각 제외), 보고서 번호 = SHA-256 앞 12자리, 파일 `report-dir/library-insert-<id>.json` [안], 끝에 `joinSurveyedOn`
   - **규칙 파일마다 SHA-256과 사본 파일 이름을 보고서에 넣음** [안] → 결과에 영향이 없는 줄을 바꿔도 AC-5("규칙 파일을 하나 바꾸면 넣지 않음")가 지켜지고 무엇이 다른지 파일 이름으로 보임
   - 명령 창: 네 목록 개수와 보고서 경로. 0이면 "넣을 도서관 없음"
5. **넣기** (`mode=insert`)
   - 보고서 번호 파일이 없으면 종료 4. 다시 계산해 다르면 다른 항목(목록·도서관·규칙 파일)을 보이고 종료 4. 의심이 남아 있으면 종료 2·3
   - 한 트랜잭션(`TransactionTemplate`): ① `pg_advisory_xact_lock(<상수 키>)` [안 키, 지금 dev에 다른 advisory 잠금 없음] ② `LibraryRegistry.add` ③ `collection_link` INSERT ④ `library_insert_run` SUCCEEDED 한 줄(`payload` = 넣은 도서관·규칙·짝 줄, `join_surveyed_on` = 규칙 폴더 날짜, `snapshot` = 사본 파일 이름)
   - 제약 위반이면 롤백 뒤 **새 트랜잭션에서** FAILED 줄(`failure_detail` 1000자 안, `payload`는 넣으려던 내용)
   - 같은 사본으로 다시 돌리면 새로 넣을 곳 0, 할 일 없음(R2-10, AC-8). 위험: 중간
6. **`collection/package-info.java`** Javadoc: 명령 프로필 둘(`collection-import`, `library-insert`), 공개 REST 하나(6단계), `LibraryRegistry` 사용. `allowedDependencies`는 그대로(`catalog`, `catalog :: normalize`, `library`)
- 테스트
  - `LibraryInsertPlannerTests` [안] (단위): 고르기 순서별 하나씩 빠짐, 종류 없음·모르는 업체 오류, 이름 바꾸기 + `한화S&amp;C` → `한화S&C`, 업체 대체표, 대출 방식 네 규칙, 서비스 전체 기준 순번(김천대 서비스 467 BOOKCUBE와 새 YES24는 순번 1), 같은 호스트(새-새, 새-서비스, 남김 파일로 빠짐, `_` 호스트, 포트만 다른 같은 호스트(여주대 8091/80)), 최종 주소 적용, 바뀐 곳 비교, 사라진 곳, 같은 입력이면 보고서 번호가 같고 규칙 파일 하나를 바꾸면 번호가 바뀜
  - `LibraryInsertCommandTests` [안] (`@SpringBootTest`, `db-test`, `CatalogImporterTests`처럼 작은 SQLite 픽스처): preview는 DB 쓰기 0 + 보고서 파일, insert는 도서관·규칙·짝·실행 기록 한 줄(AC-12 칸 다섯), 규칙 파일을 바꾼 뒤 같은 번호로 insert면 종료 4·쓰기 0(AC-5), 다시 preview하면 0(AC-8), 의심이면 preview 종료 2·insert 거절, 제약 위반 흉내(주소 중복)면 아무것도 안 들어가고 FAILED 한 줄, 보고서 번호 없으면 멈춤, 넣은 뒤 같은 문맥의 `LibraryCatalog.eligibilityFor`/`/api/v1/libraries`에 바로 보임(AC-4 단위 확인)
- 확인: `./gradlew build`, `ModularityTests`

### 6단계: 기준일 API (의존: 2단계) — AC-7 일부, AC-10 준비
1. **컨트롤러** (`backend/src/main/java/com/chaekcheck/collection/internal/web/JoinSurveyController.java` [안])
   - `GET /api/v1/join-surveys/latest` [확정]. 인증 없음. `{"surveyedOn":"2026-10-05"}`, 기록이 없으면 `{"surveyedOn":null}`. 오류는 일반 500(Problem Details)
   - 값: `SELECT max(join_surveyed_on) FROM collection.library_insert_run WHERE status = 'SUCCEEDED'` [안. "최신"을 날짜 최대로 읽음, 마지막 실행 값으로 할지는 보고]
   - 기본 프로필(서비스)에서 켜져야 함(명령 프로필에만 두지 않음). `api-design` 스킬(복수형, Problem Details)
- 테스트: `JoinSurveyApiTests` [안](줄 없으면 null, 성공 줄 둘이면 최신, FAILED 무시), `AuthEnabledSecurityTests`(로그인 켬)에 새 GET이 로그인 없이 200(`popularBooksNeedNoLogin` 78행 꼴, 사이클 14가 같은 파일을 고침), `ModularityTests`에 `collection` 의존이 `catalog`·`catalog :: normalize`·`library`뿐이고 `library`는 `collection`을 모른다는 단언 [안]
- 확인: `./gradlew build`

### 7단계: 반영 파일 판 2 (의존: 5단계) — AC-7
1. **판 번호** (`catalog/internal/JdbcCatalogLoad.java` 72행 `FORMAT_VERSION = 2`). `Manifests.java` 208행 거절은 그대로. `catalog`는 `notes`를 해석하지 않음(ADR-0086). 위험: 낮음
2. **export** (`collection/internal/importer/ImportTransfer.java` `Notes`, `export`)
   - `Notes`에 `libraryPart` [안 키] = **성공한 넣기 실행 기록 전부**(`report_id`, `ran_at`, `snapshot`, `inserted_count`, `join_surveyed_on`, `payload`). 지문은 지금처럼 넣기 뒤의 내 PC 값. 위험: 낮음
3. **apply** (같은 파일 `apply`, 135-171행)
   - 지금 "비교 → `catalogLoad.apply`"를 바꿈. 한 트랜잭션에서: ① 같은 advisory 잠금 ② 실행 기록마다(`ran_at` 순) 같은 `report_id` 성공 줄이 있으면 건너뜀 ③ 없으면 `listAll()`에 없는 번호만 `LibraryRegistry.add` ④ 짝 줄 INSERT(있으면 건너뜀) ⑤ 실행 기록 줄(원래 `ran_at` 유지 [안]) ⑥ `DatabaseFingerprint` 비교
   - 다르면 롤백하고 지금처럼 `mismatch` 한 줄, 끝. 같으면 커밋하고 `catalogLoad.apply(file)`(복원·색인·바꿔 끼우기, 사이클 11 그대로)
   - 도서관 부분이 실패하면 롤백하고 반영을 시작하지 않음 [확정]. 기록 줄은 `FAILED` + `error`(detail에 "library part") [안]
   - 도서관 부분 커밋 뒤 책 쪽이 실패(`lock_not_acquired` 등)하면 도서관은 남음. 다시 돌리면 건너뛰므로 안전
   - 새 표가 없으므로 "바꿔 끼우기 전에 지움"은 지금 `load_manifest` 지우기로 끝남. 위험: **높음** (운영 반영 순서)
- 테스트: `CatalogImportModesTests` 확장(넣기 뒤 `export` → `notes.libraryPart`에 실행 기록 / 도서관이 없는 DB 흉내(넣은 줄을 지우고 `discard` → `apply`)에서 도서관·짝·실행 기록을 넣고 `SUCCEEDED` / 같은 파일 다시 `apply` → 건너뜀 / 도서관 부분 실패 흉내(같은 번호, 다른 주소) → 반영 안 함, catalog 그대로 / `mismatch`면 도서관 줄도 롤백), `CatalogTransferTests`(판 2 기록, 판 1 manifest 거절, **긴 `notes`(수십 KB)를 `Manifests.parse`가 그대로 읽는지**)
- 확인: `./gradlew build`. `docs/maintenance/3-import.md`에 판 2, 반영 순서, "판 2 배포 전에 내 PC 판 1 `finish`·`discard`", "로컬 DB를 새로 만들면 seed 뒤 `library-insert`를 다시"

### 8단계: `/about` 공지 한 줄 (의존: 6단계) — AC-10
1. **API 함수** (`web/src/api/client.ts`에 `fetchLatestJoinSurvey(signal)` [안], 타입 `web/src/api/types.ts`)
2. **화면** (`web/src/features/about/AboutPage.tsx`)
   - 첫 문단(17-18행) 바로 아래, 제휴 안내 문단(20행) 위에 "가입 조건은 {YYYY}년 {M}월에 조사한 내용입니다." [확정 문구·자리]
   - 날짜는 `"2026-10-05"` 문자열을 나눠 만듦(`Date` 시간대 변환 안 씀) [안]
   - 로딩 중에는 그 줄 자리를 비우고 나머지 글은 바로 보임. `null`·오류면 그 줄 없음 [확정]
   - 문단 순서 [안]: ① 첫 문단 → ② 이 줄 → ③ 사이클 14 사서추천도서 문단 → ④ 제휴 문단 → ⑤ 로고 내림 문단. 위험: 낮음
- 테스트: `AboutPage.test.tsx`에 날짜가 있으면 "2026년 10월", null·오류면 줄 없음, 로딩 중이면 줄 없이 나머지 글
- 확인: `npm test`, `npm run build`, `npm run lint`, Playwright 데스크톱 → 태블릿 → 모바일(S12 흰 카드 한 열), 사용자 폰(Samsung Internet)에서 `web-lan-5174`(`.claude/launch.json`, 같은 Wi-Fi)

### 9단계: 실데이터 넣기와 운영 반영 (의존: 1~8단계) — AC-3~9, AC-12
순서 [안]: 로컬 DB 맞추기(2단계) → `db`에 preview → insert → `db`에서 `export` → `db-ops`에 `apply` → `db`에서 `finish`
1. **AC-3**: 사본 `chaekcheck-data\snapshots\ebook-catalog-2026-10-12-0135.sqlite`로 `preview`. 기대: 새로 넣을 곳 6곳(여주대 100584 교보·102084 YES24, 한국선원복지고용센터 102029, 김천대 102092, 경운대 102101, 천상중 102171), 바뀐 곳 0, 사라진 곳 0, 의심 0, 순번 2 이상 0. 다르면 넣지 않고 보고서를 사용자에게(R2-8). 바뀐 곳이 비교 소음 때문이면 고치는 방법을 보고. 1단계 refill 뒤 새 사본을 떴다면 그 사본으로도 같은지(여주대 102084 책 수만 다름)
2. **AC-6**: 같은 사본·규칙 폴더로 `build_library_seed.py`(비교 출력)를 돌려 6곳의 번호·이름·업체·대출 방식·순번·가입 조사 상태·가입 규칙·짝 줄 대조. 다른 점은 HTML 글자 풀기와 같은 호스트 범위뿐. 첫 번호(2675 예상 [추정])도
3. **AC-4, AC-12**: 서비스(`bootRun`, `db`)를 켠 채 `insert`(보고서 번호). 앱을 다시 켜지 않고 웹 "내 도서관 → 직접 추가"에서 "여주대학교" → 두 곳(교보·YES24). `library_insert_run` 한 줄에 실행 시각·사본·넣은 수 6·보고서 번호·`2026-10-05`
4. **AC-5**: 새 preview 뒤 규칙 파일 하나를 바꾸고(시험용 사본 폴더 [안]) 같은 번호로 insert → 종료 4, 쓰기 0, 다른 파일 이름 보임. 시험 뒤 되돌림
5. **AC-8**: 같은 사본으로 다시 preview → 0
6. **AC-9**: 웹에서 1215가 "한화S&C"
7. **AC-7**: 사이클 11 절차(`docs/maintenance/3-import.md` 13절): `db`에서 `export`(같은 사본) → `db-ops`에 `apply`(같은 앱 판) → `db`에서 `finish`. 기대: `apply`가 `mismatch` 없이 끝나고, `db-ops`에 6곳·짝·실행 기록 줄과 그 책, `db-ops`에 붙은 서비스의 `GET /api/v1/join-surveys/latest`가 `2026-10-05`
- 위험: 중간 (긴 실행. `db`가 비어 있으면 첫 export가 TTL을 다시 읽음)

### 10단계: "후보" 이름 정리와 문서 (의존: 2·4단계, 마지막에 대조) — AC-11
1. **이름 바꾸기** (design-delta "스크립트" 절 목록 + 이 인계서가 보탠 것 [안])
   - 2·4단계에서 한 것: `catalog_import` 칸·제약, `ImportReport`·`ImportRecords`·`Notes`, `CatalogImporterTests`·`CatalogImportRecordTests`, `CandidateSeedTests` → `LibrarySeedTests`, 스크립트·함수·폴더
   - 보탬 [안]: `CollectedCatalog` 상수·메서드, `LibraryCatalogTests.CandidateLibraries`, `test_build_candidate_seed.py`, `JoinSurvey.java` 5행 Javadoc, `web/src/api/types.ts` 8행·`ResultRow.tsx` 44행 주석, `LibraryLogo.test.tsx` 19·24행 `name="후보"`, `scripts/crawl/README.md`, `scripts/library/find_front_pages.py`·`discover/*.py` 문구
   - 절차 문서: `docs/maintenance/README.md`, `1-libraries.md`(새 도서관 넣기 절차를 preview → insert로), `2-crawl.md`, `3-import.md`, `platforms.md`, `docs/library-maintenance.md`, `docs/library-site-issues.md`의 "후보 도서관"
   - **그대로 둠** [확정]: 이미 적용된 Liquibase 파일 이름(`library/008-library-seed-candidates.yaml`, `collection/002-collection-seed-candidates.yaml`, csv)과 changeset id, master 주석 / 지난 기록(`docs/plan-feedback.md` 지난 절, `cycle08-interim-for-plan.md`, `cycle09-for-collection.md`, `library-research/*`) / 도서관과 무관한 검색 후보(`availability`의 `candidates` 파라미터·`Candidate`·`LookupTask.Candidate`, `Contributors`, `SqlGrouping.Candidate`, `application.yml` `max-candidates`, `searchPlan.test.ts`)
2. **대조**: AC-11은 단어 전체 검색이 아니라 위 목록과 대조. 목록의 각 줄이 바뀌었는지 표로 `# 사이클 13`에 남기고, 남은 "candidate"·"후보" 검색 결과는 예외 분류(Liquibase 이름 / 지난 기록 / 검색 후보)를 붙여 적음
3. **도서관 연구 기록** (dev `CLAUDE.md` "Library Research Record"): 새로 넣은 6곳과 가입 조사 상태(소속 전용 `MEMBERS_ONLY`, 규칙 4-8·4-10), 기준일 2026-10-05, 넣기 명령 절차를 `docs/library-maintenance.md`에
- 확인: `./gradlew build`, `npm test`

## 시험

- 단위: `LibraryInsertPlannerTests`, 기존 단위 시험 전부, Python `test_build_library_seed.py`, `test_crawl_migrate.py` [안]
- 통합(`db-test`): 새로 `LibraryRegistryTests`, `LibraryInsertRunSchemaTests`, `LibraryInsertCommandTests`, `JoinSurveyApiTests` / 고침 `LibrarySeedTests`(이름 바꿈 + 1215), `CatalogImportModesTests`·`CatalogTransferTests`(판 2), `CatalogImporterTests`·`CatalogImportRecordTests`(칸 이름), `AuthEnabledSecurityTests`(새 GET), `ModularityTests`(`verify()` + 의존 방향 단언), `DocumentationTests`
- 화면: `AboutPage.test.tsx`, Playwright 데스크톱 먼저 그다음 태블릿·모바일, 사용자 실제 폰

| AC | 시험 |
|---|---|
| AC-1 여주대 빈 곳 채우기 | 1단계 6 (`refill done`, 줄 수 전후) |
| AC-2 옛 코드 보관, dev만 시작 | 1단계 5·6 |
| AC-3 미리 보기 기대값 | `LibraryInsertCommandTests` preview, 9단계 1 |
| AC-4 재시작 없이 직접 추가 | `LibraryInsertCommandTests`, 9단계 3 |
| AC-5 보고서와 다르면 넣지 않음 | `LibraryInsertPlannerTests`, `LibraryInsertCommandTests`(종료 4), 9단계 4 |
| AC-6 옛 스크립트와 같음 | 4단계 확인, 9단계 2 |
| AC-7 운영 반영 mismatch 없이 + 기준일 | `CatalogImportModesTests` 확장, 9단계 7 |
| AC-8 다시 돌리면 0 | `LibraryInsertCommandTests`, 9단계 5 |
| AC-9 1215 이름 | `LibrarySeedTests`, 9단계 6 |
| AC-10 공지 한 줄 | `AboutPage.test.tsx`, Playwright, 사용자 폰 |
| AC-11 이름 없음 | 10단계 대조표 |
| AC-12 실행 기록 한 줄 | `LibraryInsertCommandTests`, 9단계 3 |

| 상황 | 기대 | 시험 |
|---|---|---|
| 넣을 곳 0 | "넣을 도서관 없음", 종료 0 | `LibraryInsertCommandTests` |
| 의심 있음 | 보고서에 표시, 종료 2·3, insert 거절 | 같음 |
| 규칙 오류(종류 없음·모르는 업체·지역) | 보고서 없음, 종료 1 | `LibraryInsertPlannerTests` |
| 보고서 번호 없음·내용 다름 | 쓰기 0, 종료 4, 다른 점 표시 | `LibraryInsertCommandTests` |
| DB 제약 위반 | 전체 롤백, FAILED 한 줄 | 같음 |
| 운영 반영: 도서관 부분 실패 | 반영 시작 안 함 | `CatalogImportModesTests` |
| 운영 반영: 해시 다름 | 도서관 줄도 롤백, `mismatch` | 같음 |
| 운영 반영: 책 쪽 실패 뒤 다시 | 도서관 건너뜀, 끝까지 | 같음(흉내) |
| 판 1 파일 | 거절 | `CatalogTransferTests` |
| 수집: 옛 수집기가 돎 | 시작 안 함 | 1단계 6(손 확인) |
| 수집: 사이트가 막음 | 그 도서관만 받지 않음 | 1단계(로그 확인) |

## 완료 기준

- [ ] AC-1~AC-12 각각 위 표대로 통과
- [ ] `./gradlew build` 통과(`ModularityTests`의 `ApplicationModules.of(ChaekcheckApplication.class).verify()`, 의존 방향 단언, `DocumentationTests` 포함)
- [ ] `web/`에서 `npm test`·`npm run build`·`npm run lint` 통과
- [ ] Python 시험 통과
- [ ] `/about` 공지 줄을 Playwright로 데스크톱 → 태블릿 → 모바일 폭에서 확인
- [ ] 사용자가 자기 폰(Samsung Internet)에서 `web-lan-5174`로 `/about` 공지 줄과 "내 도서관 → 직접 추가"의 여주대 두 곳 확인 (Chrome 폰 흉내로는 부족, 사용자 결정 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-design-addendum-decisions.html` #3)
- [ ] 수집 중 `*.dkyobobook.co.kr` 요청 0(로그 확인)
- [ ] 데이터 폴더 옛 코드가 `_old-scripts-2026-10-12`에 있고 지워진 것이 없음
- [ ] dev `docs/plan-feedback.md` `# 사이클 13` 절 작성(아래)

## 이번에 하지 않는 것

- 수집기 코드 구조 정리(갈래별·화면별 나누기), Java로 다시 쓰기: backlog / 하지 않음 [확정]
- 오래 도는 수집을 사람 없이(클라우드·프록시): 다음 사이클, backlog [확정]
- 있는 도서관의 이름 바꾸기·끄기·주소 고치기를 명령으로: 하지 않음, 지금처럼 SQL·changeset (1215만 `library/015`) [확정]
- 바뀐 곳·사라진 곳 고치기: 보고만 [확정]
- 보고서를 웹 화면에서 보기, 도서관마다 조사일 보이기 [확정]
- 넣기 자동 실행·자동 갱신 [확정]
- 교보 구독형 서버 다시 수집 [확정]
- 앞으로 도서관 seed changeset 만들기 [확정] (ADR-0084)
- 사이클 14(`popular` → `picks`) 일

## 확인 필요

| 항목 | 왜 | 확인 방법 | 막는 단계 |
|---|---|---|---|
| 데이터 폴더 옛 수집기와 dev 복사본의 차이가 `vendor` 말고도 있는지 | R1-2 | 파일 비교(1단계 1) | 1단계 |
| `md5sum` NULL 뒤 앱이 체크섬 오류 없이 켜지는지 | 2단계 로컬 DB 맞추기 | 앱 켜서 확인 | 2단계 |
| `public_join` 지역 번호와 요약 문구(지역 이름)를 어떻게 미리 적을지 | ADR-0085, `eligibility_summary` | 프로토타입 | 4단계 |
| 새 곳의 최종 주소가 `final_origins`에 없을 때 | R2-6 `base_url` | 프로토타입(수집 DB 값으로 대체할지) | 5단계 |
| "바뀐 곳" 비교가 2026-10-12 사본에서 0인지(최종 주소·이름 바꾸기 먼저 적용) | R2-4 | 프로토타입 | 9단계 |
| `nextId` 첫 값(2675 예상)이 옛 스크립트와 같은지 | AC-6 | 9단계 2 | 9단계 |
| 긴 `notes`를 `Manifests.parse`가 맞게 읽는지 | ADR-0086 | `CatalogTransferTests` | 7단계 |
| 판 2 배포 때 내 PC에 판 1 내보내기가 기다리면 `finish` 거절 | 배포 순서 | 0단계 확인, 3-import.md에 적기 | 배포 |
| 순번 2 이상을 그대로 넣고 싶을 때 | R2-7 | 사용자에게 질문(생길 때, 허용 목록 파일) | 없음 |
| 도서관 종류는 이름 기준(원문 확인은 공공도서관 120곳만) | R2-5 | Claude가 보고서의 새 곳 종류를 보고 이상하면 사용자에게 물음(R2-8) | 9단계 |
| 기준일을 날짜 파일 대신 조사 파일에서 뽑을지 | ADR-0087 | 사용자에게 질문(다음 가입 조사 때) | 없음 |

## 개발 후 plan 쪽에 알려줄 것 (dev `docs/plan-feedback.md` `# 사이클 13`)

- 바꾼 이름 전부(프로필·설정 키·종료 코드·표·칸·제약·클래스·파일·명령·`libraryPart` 키·`refill-pubdt`)와 이유
- `listAll()`에 `platformType`을 더했는지
- 기준일 API의 "최신" 계산(날짜 최대 / 마지막 실행)
- AC-11 대조표와 이 인계서가 보탠 이름 목록(design-delta 목록 밖)
- 로컬 DB 이름 바꾸기 SQL을 돌린 결과(`db`·`db-ops`), 체크섬이 다시 채워졌는지
- 옛 수집기와 dev 복사본의 차이에서 새로 찾은 것, `resume.cmd`에서 뺀 것(`--include-big-subscription`, `host-slots.txt`)
- AC-3·AC-6 실제 결과(6곳의 번호·이름·업체·대출 방식·순번·가입 상태), 옛 스크립트와 다른 점
- AC-7 실행 숫자(파일 크기, `apply` 단계 시간, 도서관 부분 시간)
- 여주대 refill 전후 줄 수와 시간
- 규칙 폴더 꼴(파일별 칸), 지역 요약 문구 방법, 이름 바꾸기·최종 주소 파일을 옮겼는지
- 사이클 14에 알릴 것: 새 `application-library-insert.yml`에도 `chaekcheck.popular.*` 줄이 있음(14가 함께 지워야 함), master 끝줄 순서, `AboutPage.tsx` 문단 ② 위치, `ModularityTests`·`AuthEnabledSecurityTests`에 더한 단언
