# 사이클 13 회고: 수집기 dev로 갈아타기 + 새 도서관 넣기 명령

- 작성: 2026-10-14
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`. 사용자 말은 dev가 `plan-feedback.md`에 옮긴 것
- dev가 적은 사정은 사실로만 둠

## 근거

- dev `docs/plan-feedback.md` "# 사이클 13" (3549~3714행)
  - 사용자 결정 표: 3561~3569행
  - 달라진 점: 3571~3581행
  - 바꾼 이름: 3583~3605행
  - 1단계 결과: 3607~3616행
  - 9단계 결과: 3677~3693행
  - 완료 기준 표: 3695~3713행
- dev 문서
  - `docs/library-left-out.md` (2026-10-12, 보고서 `1af0721e4a3e` 기준)
  - `docs/library-maintenance.md` 13절 2026-10-12 줄들 (681행: 새 6곳, 102084·102101 응답 약 5.2초)
- dev 코드 (로컬 main, push 전)
  - 사이클 13 합침: `a21bde5` (빨리 감기)
  - 9단계 결과 문서: `196a846`
  - 그 뒤 사이클 14 문서 커밋 `2c1290d`가 main 끝 (dev `.git/logs/refs/heads/main`에서 읽음, 2026-10-14)
- 읽은 코드
  - `library/LibraryRegistry.java:11-31`, `library/RegisteredLibrary.java:10-11`, `library/NewLibrary.java:16-20`
  - `library/internal/JdbcLibraryRegistry.java:35` (`Propagation.MANDATORY`), `:81-82` (`setval`), `:92-93` (`nextId`), `:102` (`listAll` SELECT)
  - `collection/package-info.java:1-13`
  - `collection/internal/web/JoinSurveyController.java:25-37`
  - `collection/internal/libraryinsert/` (`LibraryInsertCommand.java:32` 잠금 키, `LibraryInsertException.java:4`, `LibraryPart.java`, `InsertReport.java`, `RuleSet.java`)
  - `collection/internal/importer/ImportTransfer.java:86-101,162`, `ImportRecords.java:51`, `CollectedCatalog.java:46-47`, `CatalogImportRunner.java:67-100`
  - `catalog/internal/JdbcCatalogLoad.java:76` (`FORMAT_VERSION = 2`)
  - Liquibase: `collection/001-collection-schema.yaml:36-53`, `collection/006-library-insert-run.yaml:1-34`, `library/015-library-name-1215.yaml`, `db.changelog-master.yaml` 끝 (`# cycle 13` 아래 `library/015` → `collection/006`, 그 뒤 `# cycle 14` `picks/001`)
  - 웹: `web/src/features/about/AboutPage.tsx:39`, `web/src/api/client.ts:169-173`
  - 규칙 폴더: `scripts/library/rules/` (TSV 12개 + `join_surveyed_on.txt` + `README.md`, 그중 `gone_known.tsv` 새로 생김)
- Modulith `Documenter` 출력
  - `backend/build/spring-modulith-docs/` 파일이 2026-10-12 19:42 것뿐
  - 원래 폴더 빌드라 사이클 13·14가 들어가기 전임 (아직 `Popular` 모듈이 있고 `Picks`는 없음)
  - 그래서 사이클 13 뒤 그림과 대조하지 못함 [확인 필요: dev가 main에서 `./gradlew build`를 다시 돌린 뒤 대조]
  - 그때 그림에서도 `Collection → Catalog`·`Collection → Library` 관계는 `docs/current/module-map.md`와 같음 (`components.puml`)

## dev가 마친 범위

- 0~10단계를 모두 마침
- 1~8·10단계: 작업 폴더 `../chaekcheck-dev-c13`, 묶음 `chaekcheck-c13`
- 9단계(실데이터): 사이클 11·12가 main에 들어간 뒤 원래 `db`·`db-ops`에서 함
  - 사용자 결정: "전부 진행" (2026-10-14, dev 3675행)
- 확인 (dev 3657·3674·3711행)
  - `./gradlew build` 전체
  - `npm test` 370, `npm run lint`, `npm run build`
  - Python 시험 44
- push는 하지 않음. 로컬 main만 있음

## 계획대로 된 것

### 갈아타기 (R1)

- 수집기 dev로 갈아타기 (dev 3607~3616행)
  - `vendor` 칸·`migrate`
  - `refill-pubdt` (`crawl_catalog.py refill-pubdt --only ID[,ID]`)
  - `resume.cmd` 두 벌 실행 검사: dev `resume.cmd`를 실제로 돌려 "already running"으로 멈추는 것을 확인 (AC-2)
- 옛 코드 보관: `chaekcheck-data\_old-scripts-2026-10-12\`, `scripts\` 16개 + `resume.cmd`, 지우지 않음 (dev 3565행)
- 데이터 폴더 도구 `fetch.py`·`probe_logos.py`·`probe_home_logos.py`를 dev `scripts/library/`로 옮김
- `crawl-runbook.md` 1·8절을 dev `docs/maintenance/2-crawl.md`로 옮김 (dev 3654행)
- 호출 예절 그대로 (R1-6): `*.dkyobobook.co.kr`은 요청 직전에도 막음(`BlockedHost`), 403이나 재시도 뒤 시간 초과면 그 도서관만 `crawl_skip`

### 도서관 넣기 명령 (R2)

- `library` 공개 API `LibraryRegistry` (설계와 같음)
  - `add(List<NewLibrary>)`: `Propagation.MANDATORY`, 넣은 뒤 `setval`로 시퀀스를 올림
  - `nextId()`: 시퀀스 값을 쓰지 않고 다음 번호만 셈
  - `listAll()`: 꺼진 곳 포함 번호 순
- `collection` 넣기 명령
  - 프로필 `library-insert`, 설정 `chaekcheck.collection.library-insert.{mode,sqlite-path,rules-dir,report-dir,report-id}`
  - 보고서 `library-insert-<id>.json`, 번호 = SHA-256 앞 12자리
  - 종료 코드 0~4는 설계대로, 5를 보탬 (아래 "달라진 것")
- 모듈 경계는 설계대로 (`collection/package-info.java:12`)
  - `allowedDependencies = { "catalog", "catalog :: normalize", "library" }`
  - `collection`은 `library` 표를 읽지 않음
  - 시험 `collectionUsesLibraryAndLibraryNotCollection`을 더함 (dev 3640행)
- 표 `collection.library_insert_run`: 칸·CHECK가 design-delta와 같음
  - 부분 UNIQUE 이름은 `library_insert_run_report_id_succeeded_key` (`006-library-insert-run.yaml:33-34`)
- 1215 이름: `library/015-library-name-1215.yaml`, 화면에 "한화S&C" (AC-9)

### 운영 반영 판 2 (R3)

- `FORMAT_VERSION = 2` (`JdbcCatalogLoad.java:76`)
- `load_manifest.notes.libraryPart` = 성공한 실행 기록 전부 (`reportId`, `ranAt`, `snapshot`, `insertedCount`, `joinSurveyedOn`, `payload`)
- 반영 순서: 도서관 부분 → 비교 → 책
- 운영 흉내 반영 (`db-ops`, dev 3690행)
  - 도서관 부분 1.0초, `compare` 4.1초, 전체 4분 35초
  - `mismatch` 없음

### 공지 (R5)

- `GET /api/v1/join-surveys/latest`
  - 인증 없음. 시험 `joinSurveyDateNeedsNoLogin` (dev 3641행)
  - `{"surveyedOn":"2026-10-05"}`, 기록이 없으면 `null`
  - "최신" = 성공한 줄의 `join_surveyed_on` 최댓값 (`JoinSurveyController.java:28-32`)
- `/about` 첫 문단 아래 "가입 조건은 2026년 10월에 조사한 내용입니다." (`AboutPage.tsx:39`)
  - 문단 순서는 사이클 14와 맞춘 대로 (dev 3639행)

### "후보" 이름 정리 (R4)

- 칸·제약·Java·스크립트·폴더·절차 문서 이름을 바꿈 (dev 3644~3657행)
  - `other_library_count`, `catalog_import_other_library_count_check`
  - `otherLibraries`, `FIRST_COLLECTED_ONLY_ID`·`addedLater()`
  - `build_library_seed.py`, `discover/`, `LibrarySeedTests`
- 남은 검색 결과는 예외로 분류함: 검색 후보, Liquibase 이름, 지난 기록

### 새 도서관 6곳 (실데이터, 서비스 번호 2675~2680)

| 서비스 번호 | 도서관 | 수집 번호 | 화면 종류 | 업체·대출 방식 | 주소 |
|---|---|---|---|---|---|
| 2675 | 여주대학교 | 100584 | `KYOBO_V1` | KYOBO·OWNED | `https://ebook.yit.ac.kr:446` |
| 2676 | 한국선원복지고용센터 | 102029 | `YES24_V1` | | |
| 2677 | 여주대학교 | 102084 | `YES24_V2` | | |
| 2678 | 김천대학교 | 102092 | `YES24_V3` | | |
| 2679 | 경운대학교 | 102101 | `YES24_V2` | | |
| 2680 | 천상중학교 | 102171 | `YES24_V2` | | |

- 출처: dev 3623행, `library-maintenance.md` 681행
- 6곳 모두 순번 1, `MEMBERS_ONLY`, 규칙 줄 없음
- 102029의 종류는 이름으로만 정한 `GOV`(`sure`=N)
  - 사용자: "이대로 넣기" (2026-10-12, dev 3667행)
- 책 수 (`db`·`db-ops` 같음, dev 3692행): 2675 2,199 / 2676 27,021 / 2677 83,756 / 2678 67,834 / 2679 63,681 / 2680 1,199

## 완료 기준 결과

출처: dev 3695~3713행, 9단계 3677~3693행

| AC | 결과 | 근거 |
|---|---|---|
| AC-1 여주대(102084) 빈 곳 채우기 | **뺌** | 사용자: "여주대는 빼자" (2026-10-12). 22분 만에 980줄에서 멈춤. 줄 수 83,756 그대로, `quick_check` ok (dev 3568행) |
| AC-2 옛 코드 보관, dev만 시작 | 통과 | 3614행 |
| AC-3 미리 보기 기대값 | 통과 | 보고서 `1af0721e4a3e`: 새 6, 바뀐 곳 0, 의심 0, 순번 2 이상 0. 사라진 곳은 0이지만 확인한 곳 3(`gone_known.tsv`)이 따로 나옴. 기대값 "사라진 곳 0"과 달라 사용자가 정함 (아래 표) |
| AC-4 재시작 없이 "직접 추가"에서 여주대 두 곳 | 통과 | 시험, 실제 `db`, 사용자 폰. 사용자: "둘 다 돼" (2026-10-14) |
| AC-5 규칙이 바뀌면 넣지 않음 | 통과 | 종료 4, "rules files [demo_or_closed.tsv]", 쓰기 0 |
| AC-6 옛 스크립트와 같음 | 통과 | 옛 스크립트 번호 규칙을 `nextId`에 맞춘 뒤 (아래 표) |
| AC-7 운영 반영 `mismatch` 없음 + 운영 기준일 API | 통과 | `db-ops` 서비스(8084)에서 `2026-10-05` |
| AC-8 다시 돌리면 0 | 통과 | 보고서 `b2174dfd426d` |
| AC-9 1215 "한화S&C" | 통과 | |
| AC-10 `/about` 한 줄 | 통과 | 앱 안 브라우저 세 폭, 사용자 폰 (Samsung Internet) |
| AC-11 "후보" 이름 없음 | 통과 (예외 하나는 plan이 정함) | 사이클 12의 `exclude-candidate-libraries`가 남음 (dev 3673행) |
| AC-12 실행 기록 한 줄 | 통과 | 보고서 번호, 사본 이름, 6, `2026-10-05`, `SUCCEEDED` |

## 달라진 것과 이유

| 무엇 | 계획 | 실제 | 이유 |
|---|---|---|---|
| AC-1 여주대 빈 곳 채우기 | 첫 실행으로 끝까지 돌림 | 이번 사이클에서 뺌. 끝까지 약 30시간 예상이었음. 여주대 두 곳 넣기는 그대로 | 사용자: "여주대는 빼자" (2026-10-12). 왜 뺐는지는 [이유 미확인] |
| 새 곳에 최종 주소 줄이 없을 때 | [확인 필요]: 수집 DB 값으로 대체할지 | `final_origins.tsv` 줄이 꼭 있어야 하고, 없으면 규칙 오류(종료 1). 옛 스크립트도 같은 규칙. 6곳을 `CheckFinalOrigins.java`로 확인해 채움 (100584만 `https://ebook.yit.ac.kr:446`) | 사용자: "빠진 곳은 확인해 채움" (2026-10-12, dev 3566행) |
| 사라진 곳 | 기대값 0 | 3곳이 나옴: 44 국회도서관, 261 군포시도서관, 269 김천시립도서관. 다시 열어 10-01 기록과 같음을 확인한 뒤 새 규칙 파일 `gone_known.tsv`에 적음. 보고서에는 `goneKnown`에 번호만. 서비스에서는 그대로 켜 둠 | 사용자: "확인하고 빼줘 파일로 적어줘" (2026-10-12, dev 3567행) |
| "사라진 곳"을 보는 범위 | 짝이 있는 곳 | 켜진 서비스 도서관만 봄. 꺼진 59·131·135·2194·2198은 비교하지 않음 | dev가 정함. [이유 미확인] (dev 3574행) |
| 새 번호 | 서비스 최대 번호 + 1 | `nextId()` = `GREATEST(max(id)+1, IDENTITY 다음 값)`. seed의 `RESTART WITH 2675` 때문에 2675부터. 옛 스크립트는 2664~2669(사이클 08에서 비운 번호)를 주었는데, 옛 스크립트도 마지막 `RESTART WITH`부터 매기게 고침 | dev가 정함. [이유 미확인] (dev 3573행). 2664~2674를 비워 두는 것은 ADR-0067과 맞음 |
| 종료 코드 | 0~4 | 5를 더함: DB가 줄을 거절하면 롤백하고 `FAILED` 줄 하나 | dev가 정함. [이유 미확인] (dev 3577행) |
| 넣기 때 다시 확인 | 보고서와 같은지 | 잠금 뒤 `nextId()`가 보고서 첫 번호와 다르면 종료 4 | dev가 정함. [이유 미확인] (dev 3578행) |
| 넣을 곳 0일 때 | 정하지 않음 | 실행 기록을 남기지 않음 | dev가 정함. [이유 미확인] (dev 3579행) |
| 규칙 파일 해시 | 정하지 않음 | 줄 끝을 `\n`으로 맞춘 글로 셈. git이 `\r\n`으로 꺼내도 같은 보고서 번호 | dev가 정함. [이유 미확인] (dev 3580행) |
| 운영 반영의 도서관 부분 | 운영에 없는 도서관만 넣고, 있는 번호는 건너뜀 | 이미 있는 번호가 다른 도서관(이름·주소가 다름)이거나 짝이 다른 도서관을 가리키면 멈춤(롤백, `FAILED`, `failure_reason` `error`, `failure_detail` `library part: …`). `step_seconds`에 `library part` 단계를 더함 | dev 리뷰(java-reviewer)에서 보탬. [이유 미확인] (dev 3581·3659~3662행) |
| `listAll()`이 주는 값 | 번호·이름·주소·업체·대출 방식·순번·꺼짐 여부 (+ 화면 종류 [안]) | `platformType` 포함 (`RegisteredLibrary.java:10-11`) | design-delta [안]대로 (spec R2-4 "바뀐 곳"이 화면 종류도 비교) |
| 같은 호스트 남김 | 사람이 "다른 도서관"으로 정한 곳은 빼고 봄 | 옛 스크립트처럼 **새 곳 쪽 번호**가 `same_host_kept.tsv`에 있으면 뺌 | dev가 정함. [이유 미확인] (dev 3576행) |
| 규칙 폴더 파일 | TSV + `join_surveyed_on.txt` + 순번 2 허용 목록 | 설계 파일 + `final_origins.tsv`·`name_overrides.tsv`를 데이터 폴더에서 옮김 + 새 `gone_known.tsv`·`scope_overrides.tsv`(지역 도우미만 읽음). 칸 이름 `collection_id` | 옮김: dev가 정함, [이유 미확인]. `gone_known.tsv`: 위 사용자 결정 |
| 작업 폴더·DB 묶음 | `chaekcheck-13`, 5442~5444 | 13: `chaekcheck-c13`, DB 5442·5443·5444, 서버 8082, 웹 5176. 14: `chaekcheck-c14`, 5452·5453 | 사용자: "13=544x, 14=545x", "chaekcheck-c13 / chaekcheck-c14" (2026-10-12, dev 3555행). 웹 5175는 이미 `web-tunnel-5175`가 써서 피함 |
| `collection/001` 이름 고친 줄 | 49·50행 | 설명 주석이 붙어 52·53행 (`001-collection-schema.yaml:36-53`) | 내용은 같음 |
| 옛 스크립트 함수 `name_candidates()` | `name_libraries()`로 바꿈 | 원래 없던 함수 | dev 3600행 |
| 서비스에서 뺀 도서관 목록 | 계획에 없음 | dev `docs/library-left-out.md`와 만드는 스크립트 `scripts/library/list_left_out.py` (A 수집했지만 안 넣은 349곳, B 서비스에 있지만 문제 있는 8곳) | 사용자: "둘 다", "기존 DB에 있는 도서관은 기본으로 포함" (2026-10-12, dev 3569행) |
| 9단계 중 원래 DB | 13만 씀 | 13의 export가 도는 동안 다른 세션이 사이클 14를 합치고 원래 DB를 정리함(02:11~02:15). apply·finish는 14가 들어간 main 코드로 돌았고 문제 없음. `db-ops`를 다시 복사하기 전 사이클 11 때의 `collection.catalog_import` 10줄을 dev `data/cycle13/db-ops-catalog_import-before-recopy-2026-10-14.sql`로 백업 | 나란히 진행한 결과. [이유 미확인] (dev 3679·3688·3693행) |

## 새로 알게 된 제약

### 교보 구독형 서버를 다시 수집하지 않음

- R1-6 [확정]의 결과로, 서비스에 있는 교보 구독형 서버(`*.dkyobobook.co.kr`) 소장 사이트도 더는 다시 수집되지 않음 (dev 3616행)
  - 수집 DB에서 이 서버의 도서관은 1,480곳
  - 서비스에 있는 곳 수는 ADR-0094 배경에 적힌 수(소장형 1,182 + 공공 구독 21) [확인 필요: 서비스 DB에서 다시 셈]
- `probe_kyobo_limits.py`도 같은 이유로 시작하자마자 멈춤 (dev 3655행)
- 다시 받는 방법은 backlog "교보 구독형 서버를 다른 우리 IP에서 다시 받기·조회하기"와 ADR-0094(Proposed)가 다룸

### 서비스 읽기 제한 5초를 넘는 새 도서관

- 102084(서비스 2677 여주대 YES24), 102101(서비스 2679 경운대)이 약 5.2초 만에 응답함
  - 출처: dev `library-maintenance.md` 681행, `plan-feedback.md` 3566행
- 서비스 대출 조회의 읽기 제한은 5초 (`application.yml:130` `availability.read-timeout: 5s`)
- 그래서 두 곳의 대출 조회가 자주 시간 초과일 수 있음 [확인 필요: 실제 조회로 실패율 재기]

### 작업 폴더 시험

- 시험 도우미 `TestPgCommand` 기본값은 묶음 `chaekcheck`의 `db-test`를 가리킴 (dev 3556행, 사이클 14 3731행도 같음)
- 그래서 작업 폴더에서는 `TEST_PG_COMMAND=wsl,-d,Ubuntu,--exec,docker,compose,-p,<프로젝트>,exec,-T,db-test`를 줘야 사이클 11 시험이 통과함
- 주지 않으면 원래 `db-test`에 붙음(읽기)
- `.claude/launch.json` `backend`에 원래 폴더 경로가 박혀 있음

### 수집·넣기 결과

- 전체 수집 성공 기록이 없는 곳: 100252, 102020 (교보 구독형 서버·받지 않음을 뺀 수, dev 3613행)
- 같은 사이트 규칙(`same_site.tsv`) 8곳은 모두 `crawl_skip`이 먼저 걸려 이번 보고서에서는 0으로 셈 (dev 3622행)
- 데이터 폴더 `library-naming/apply_rename.py`는 옛 `scripts\`를 import하므로 보관 뒤에는 돌지 않음 (옮기지 않기로 한 일회용 도구, dev 3615행)

### 운영 반영 시간 (export 쪽, 2026-10-14)

- export 38분 (`export` 2,279초, `load` 863초, `dump` 97초)
- 파일 608MB
- 내 PC `finish` 1분 49초 (dev 3689·3691행)

### 사이클 18과 겹침

- `gone_known.tsv`의 3곳(국회 44, 군포 261, 김천 269)과 `library-left-out.md` B절은 사이클 18(`docs/cycles/18-empty-library-holdings/`)의 대상과 겹침
- 이 회고는 설계하지 않음
- 사이클 13은 "서비스에서는 그대로 켜 둠"으로 정했음. 끌지는 18이 정함

## 다음 사이클 후보

- 여주대(102084) 빈 곳 채우기 다시 돌리기 (약 30시간)
  - backlog "여주대 빠진 책 채우기 다시 할지는 수집 세션이 사용자에게 물음"에 이미 있음
- 교보 구독형 서버 다시 수집: backlog와 ADR-0094(Proposed)
  - 사이클 18도 이 서버의 곳은 원인만 적기로 함
- 응답 5초 넘는 도서관의 대출 조회: 2677·2679. 사이클 15(사용 기록) 뒤 실패율을 보고 정할 수 있음
- 작업 폴더 시험이 `TEST_PG_COMMAND` 없이도 자기 묶음의 `db-test`를 쓰게 하기 (dev 도구)
- 사이클 12 설정 이름 `exclude-candidate-libraries` 정리 (아래 질문 2)
- Modulith `Documenter` 그림을 main에서 다시 만들어 `docs/current/module-map.md`와 대조
- 수집기 코드 구조 정리: backlog에 이미 있음

## docs/current 반영 (나중에 적용)

이 회고에서는 `docs/current/`를 고치지 않습니다. 고칠 목록(정확한 줄과 바꿀 글)은 따로 넘깁니다. 바뀌는 것은 아래와 같습니다.

### 공통

- 사이클 13의 "설계됨(미구현, 사이클 13)"을 모두 "구현됨 (사이클 13, 회고 2026-10-14)"로 바꿈
  - 대상: `module-map.md`, `data-model.md`, `api.md`, `flows.md`, `reference-index.md`
  - 그림 글자 "(사이클 13, 설계됨)"도 같이 바꿈

### `module-map.md`

- `library` 줄: `listAll()` 값에 화면 종류 `platformType`
- `collection` 줄
  - 종료 코드 5
  - 넣기 때 `nextId` 다시 확인
  - 넣을 곳 0이면 기록 없음
  - 규칙 파일 `final_origins.tsv`(새 곳 필수)·`gone_known.tsv`
  - 운영 반영에서 같은 번호가 다른 도서관이면 멈춤
  - 수집기 `refill-pubdt` 이름 확정, 첫 시험 여주대는 뺌(AC-1)
- "후보" 이름 목록: `name_candidates()`는 원래 없었음, 사이클 12 설정 하나는 남음

### `data-model.md`

- `collection/006` 번호 확정
- 부분 UNIQUE 이름 `library_insert_run_report_id_succeeded_key`
- `collection/001` 고친 줄 52·53행
- `format_version` 2
- 새 번호 2675부터 (`RESTART WITH 2675`)
- "확인 필요 (사이클 13)" 표에 결과를 적음

### `api.md`

- `/api/v1/join-surveys/latest` 구현됨
- "최신" = 성공한 줄의 `join_surveyed_on` 최댓값

### `flows.md`

- 흐름 32: 종료 5, `nextId` 다시 확인, 첫 실행(여주대 빈 곳 채우기) 뺌
- 흐름 33: 다른 도서관이 같은 번호면 멈춤
- S12 한 줄 구현됨

### `code-overview.md`

- 바꾸지 않음
- 2026-10-04 시점 설명이라 `collection`·`LibraryRegistry`가 원래 없음
- 다시 쓸지는 따로 정함

### `reference-index.md`

- 사이클 13 줄들을 구현됨으로
- dev `docs/library-left-out.md`·`list_left_out.py`, `gone_known.tsv`를 더함
- `crawl-runbook.md` 1·8절이 dev `2-crawl.md`로 옮겨졌음을 적음
- `probe_kyobo_limits.py` 위치·상태를 고침
- "받지 않는 도서관 4곳" 줄에 `gone_known.tsv`·사이클 18을 잇기

### ADR

- 사이클 13 ADR(0083~0088·0093)은 모두 Accepted라 고치지 않음
- 넣기 명령 보탬(최종 주소 줄 필수, 확인한 사라진 곳 파일, 번호, 종료 5, 반영 때 다른 도서관이면 멈춤)은 새 ADR 하나로 [안]
- ADR-0094(Proposed) 배경에 "사이클 13 결과 서비스에 있는 교보 구독형 사이트도 다시 수집되지 않음" 한 줄 [안]

## 사용자에게 물을 것

### 1. 용어 "후보 도서관"

- 상황: dev는 문서에서 "수집 목록에서 찾은 도서관"(또는 "수집으로 찾은 도서관")으로 바꿨음 (dev 3647행)
- plan `reference-index.md` 24·59행에는 "등록 도서관 / 후보 도서관"(사용자가 2026-10-04에 정한 말)이 남아 있음
- 추천 [안]: plan 지금 문서도 dev와 같은 말로 바꿈. 지난 사이클 기록·ADR 제목은 그대로
  - 좋은 점: dev와 plan이 같은 말을 씀
  - 나쁜 점: 말이 길어짐. 지난 기록과 말이 달라짐

### 2. 사이클 12 설정 `exclude-candidate-libraries`

- 대상: Java `excludeCandidateLibraries`, 건너뛴 이유 `library_excluded_candidate`
- 추천 [안]: 다음에 가져오기 코드를 고치는 dev 일(예: 사이클 18)에 함께 `addedLater`에 맞춘 이름으로 바꿈
  - 좋은 점: AC-11 규칙과 맞음
  - 나쁜 점: 사이클 12 기록·dry run 결과 파일의 이름과 달라짐
- 다른 안: 시험용(dry run 전용) 설정이라 AC-11 예외로 그대로 둠
  - 좋은 점: 일이 없음
  - 나쁜 점: "후보" 이름이 하나 남음

### 3. 서비스에 있는 교보 구독형 소장 사이트의 책 목록

- 상황: 이제 다시 수집되지 않음
- 추천 [안]: 따로 정하지 않고 backlog "교보 구독형 서버를 다른 우리 IP에서 다시 받기"(ADR-0094, Proposed)로 다룸
  - 그때까지는 10-07 전 마지막 목록을 그대로 씀
  - 좋은 점: 결정이 하나로 모임
  - 나쁜 점: 그 일이 시작될 때까지 이 도서관들의 새 책이 검색에 안 나옴

### 4. 응답 약 5.2초인 2677 여주대(YES24)·2679 경운대

- 상황: 대출 조회 읽기 제한 5초를 넘음
- 추천 [안]: 지금은 그대로 두고, 운영 뒤 사용 기록(사이클 15)으로 실패가 잦으면 그때 정함
  - 좋은 점: 설정을 미리 늘리지 않음
  - 나쁜 점: 그동안 두 곳이 "확인 실패"로 보일 수 있음
- 다른 안: 읽기 제한을 6초로 올림
  - 나쁜 점: 모든 도서관의 느린 실패가 1초 늦게 끝남

### 5. 여주대 빈 곳 채우기(약 30시간)

- 추천 [안]: 이번에는 하지 않고, 집 PC가 오래 비는 날 수집 세션에서 사용자에게 물음 (지금 backlog 줄 그대로)
  - 좋은 점: PC를 오래 묶지 않음
  - 나쁜 점: 여주대 YES24(2677) 목록의 빈 곳이 그대로 남음

### 6. 작업 폴더 시험 `TEST_PG_COMMAND`

- 추천 [안]: backlog에 dev 도구 일로 적음 (작업 폴더 `.env`의 묶음 이름을 시험 도우미가 읽게)
  - 좋은 점: 다음 나란히 작업에서 원래 `db-test`에 붙는 실수가 없어짐
  - 나쁜 점: 작은 dev 일이 하나 생김

### 7. 사이클 11 운영 흉내 반영 기록 10줄

- 상황: 9단계에서 `db-ops`를 다시 복사하며 git 밖 백업 파일로만 남음 (dev `data/cycle13/db-ops-catalog_import-before-recopy-2026-10-14.sql`)
- 추천 [안]: 사이클 11 최종 회고가 이 파일을 근거로 적고, 파일은 지우지 않음
  - 좋은 점: 측정 기록을 잃지 않음
  - 나쁜 점: 근거가 git 밖에 있음

### 8. 새 ADR 초안 (넣기 명령 보탬, ADR-0084·0085·0086 보완)

- 질문: 이 내용으로 기록할지
- 추천 [안]: 기록함
  - 좋은 점: Accepted ADR과 실제 코드의 차이가 남음
  - 나쁜 점: 이유 칸 대부분이 [이유 미확인] (dev가 정한 것)
