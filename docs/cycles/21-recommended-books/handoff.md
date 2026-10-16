# 개발 인계서: 사이클 21 추천도서 (이동진 추천도서 · 사서 추천도서 · 서울대 100선)

- 기준 문서: plan `docs/cycles/21-recommended-books/design-delta.md`(최신판, 검토를 마쳤고 결정도 모두 정함)를 따라 구현합니다. `architect-proposal.md`는 결정 기록입니다. 그 문서의 "구조 그림"과 "데이터" 절은 옛 모양(`pick` 표, 캐시가 고정 판을 맞춤)이므로 따르지 않습니다
- 이 인계서의 자리: plan `docs/cycles/21-recommended-books/handoff.md`. `docs/current/handoff.md`는 사이클 19 인계서이고, 거기에는 21을 알리는 한 줄만 들어갑니다(사이클 14 선례). dev에서는 `../chaekcheck-plan/docs/cycles/21-recommended-books/handoff.md`로 읽습니다
- ADR: 0122, 0123, 0124, 0125, 0126, 0127, 0128, 0129 (모두 Accepted, 2026-10-16). 그대로 따르는 ADR: 0062, 0078, 0086, 0089, 0090(맞추는 길. 고르기 규칙은 0125, 화면 이름은 0129로 바뀜), 0091
- ADR-0121(모든 화면 같은 머리말)은 사이클 20이 확정할 초안(Proposed)입니다. 21은 spec R1-6(`from-cycle-20-header-light.md`)대로 머리말을 만듭니다. 사이클 20이 방향을 바꾸면 design-delta "웹" 표의 머리말 행을 다시 봅니다
- 승인: 사용자 승인 (2026-10-16, [인계서 검토](easy/2026-10-16-handoff-review.html) #1·#2, 외부용 페이지 https://claude.ai/artifact/KdmUJ1a1txMmsbMfHWfdE9)

## 일정과 다른 사이클과의 순서

- **dev는 21을 먼저 만듭니다** [확정] (사용자: "순서는 안 중요해 이거 먼저 할거야", 2026-10-15)
- **사이클 19는 자기 작업 폴더에서 나란히 개발합니다** [확정] (사용자: "나란히 개발할래", 2026-10-15)
  - 21이 10-17까지 dev main에 들어가지 않으면 19만 먼저 다시 가져오기와 운영 역할 반영을 합니다. 21은 그 뒤에 따로 반영합니다. 둘 다 main에 있으면 한 번에 합니다 [확정] (사용자 승인, 2026-10-16, 사이클 19 인계서 검토 #2, plan `CLAUDE.md`, `../19-author-angle-brackets/handoff.md` "일정")
  - 공개 배포(사이클 17)는 19 반영 뒤입니다. 21이 공개 배포에 들어가는지는 아래 "확인 필요"의 배포 줄을 따릅니다
- **Liquibase 번호** [확정] (사용자 승인, 2026-10-16, 설계 검토 #4)
  - 19는 `usagelog/002`, 21은 `usagelog/003`과 `picks/002`, 20은 `usagelog/004`를 씁니다
  - 번호는 바꾸지 않습니다. **main에 나중에 합치는 쪽**이 rebase해서 자기 include를 master 맨 끝으로 옮깁니다
- **파일 형식 번호 3** [확정] (ADR-0123, 설계 검토 3 #2; ADR-0086과 같은 감수)
  - 21이 들어간 프로그램은 형식 번호 2 반영 파일을 `apply`·`finish`하지 않습니다(지금 `Manifests.java` 208행 검사)
  - 21 코드로 내 PC 가져오기나 운영 반영을 돌리기 **전에** 확인합니다. 내 PC `catalog_next`에 기다리는 형식 2 내보내기(19의 것 포함)가 있으면, 그 파일을 만든 쪽 코드로 `finish`하거나 `discard`합니다
  - 그다음 21 코드로 **새로** `export`합니다
  - 19가 형식 2로 내보낸 뒤 반영을 기다리는 동안에는 21을 합친 코드로 그 `finish`를 돌리지 않습니다
- **main에 합치는 조건**: 형식 3 `export`는 목록 폴더가 없으면 멈춥니다(5단계). 그래서 21을 main에 합칠 때는 8단계 목록 파일 셋과 표지가 함께 들어가야 합니다
  - ~~8단계의 KDC 분야 확정~~ → 0단계 뒤 없어짐(44권 분야는 조사 때 그대로, API 시험 뒤 결정 #2). 19는 이미 main에 들어갔습니다(dev 0단계 기록)

## 요약

추천 목록 셋을 `picks` 모듈 하나에 담습니다. 표는 `list_field`·`list_book`이고, `pick` 표는 옮긴 뒤 지웁니다. 사서 추천도서는 지금처럼 서버가 주 1회 받아 `librarian` 줄로 적습니다. 이동진 추천도서와 서울대 100선은 다음 길로 들어옵니다.
- 수집기(Python)가 YouTube Data API와 ISBN 서지 API로 목록 파일을 만들고, 고정 판을 고르고, 표지를 줄입니다
- 내 PC `export`가 그 목록을 `catalog_next`에 대고 맞춰 `notes.listPart`(형식 번호 3)에 싣습니다
- `apply`·`finish`·`in-place`가 책 표를 바꿔 끼운 **뒤** 작은 트랜잭션 하나로 그 목록을 넣습니다

같은 책 고르기(`BookChoice`)는 이렇게 바뀝니다. 켜진 도서관만 보고, 구독형은 몇 곳이든 1로 셉니다. 보유량이 같으면 1권을 먼저 고릅니다. 화면 책 이름은 맞춘 책의 제목에서 판 표시를 덜어 낸 이름입니다. API는 `GET /api/v1/picks/{listKey}`, 이용 기록 칸은 `picks_list`입니다. 웹은 머리말을 정보나루식 큰 메뉴로 바꾸고 목록 화면 셋을 둡니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) 조용히 바꾸지 않습니다. 먼저 사용자에게 알리고, dev `docs/plan-feedback.md`의 새 **`# 사이클 21`** 절에 무엇을 왜 바꿨는지 적습니다. 사용자 발언은 그대로 옮깁니다
- `[안]`·`[안: 이름]`은 dev가 코드에 맞춰 바꿀 수 있습니다 [확정] (design-delta 머리말). 바꾸면 `# 사이클 21` 절에 알리기만 합니다
  - 예: `CuratedListTransfer`·`ListPart`·`lendingKinds`·`byIds`·`preparedLookup`의 이름, 설정 키 `lists-dir`, `listPart` 안 칸 이름, 목록 파일 칸 이름, 응답 칸 `id`·`listTitle`·`yearBook`·`videoId`·`tocNo`, changeset id, CHECK 이름, 수집기 파일·함수 이름, 시험 클래스 이름
  - **바꾸지 않는 것** [확정]
    - 표 둘과 `pick` 지우기, 누가 어느 줄을 바꾸는지(design-delta "데이터" 끝 bullet)
    - `book_id`는 이동진·서울대만 export 때 저장하고, 사서는 캐시 때 맞춥니다
    - 고정 판 맞추기 순서 ①~④
    - `BookChoice` 공식(켜진 도서관만, 구독형 1, 1권 먼저, 그다음 번호 작은 것)
    - 판 표시를 덜어 낸 화면 이름(ADR-0129)
    - 바꿔 끼운 **뒤** 작은 트랜잭션(바꿔 끼우는 트랜잭션 안이 아님)
    - 목록 폴더가 없으면 멈춤, 형식 번호 3
    - 경로 `/api/v1/picks/{listKey}`와 목록 이름 셋(`librarian`·`leedongjin`·`snu100`), 404 `list_not_found`
    - 이용 기록 `list` 필수
    - 머리말 동작(0.5초, 덮지 않음, 640px 이하 ☰, 점 자리, `legal` 분기 없음)
    - spec의 문구 전부(R5-5, R6, R7-1)
    - 유튜브 쪽 규칙: 페이지 요청 0건, 영상 제목·설명을 저장하지 않음, 30일 다시 확인
    - 표지 200px·품질 0.8·원본 5MB
    - 모듈 의존 방향(`collection → picks`만 새로)
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 확정된 것처럼 코드에 넣지 말고 `TODO(확인 필요)`로 둔 뒤 확인하고 보고합니다
- 단계마다 통과해야 다음 단계로 갑니다
  - `backend/`에서 `./gradlew build`(`ModularityTests`·`DocumentationTests` 포함)
  - 웹 단계는 `web/`에서 `npm run build`와 시험
  - 수집기 단계는 `python -m unittest …`
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), `docs/maintenance/3-import.md`, 사이클 11·13·14 인계서의 제약을 그대로 따릅니다. 아래에는 더하거나 바뀌는 것만 적습니다
- 낱말: 이 인계서에서 "판"은 **책의 판(출판사 판)**만 뜻합니다. 가져오기 파일 맨 앞의 번호는 **파일 형식 번호**라고 부릅니다

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `docs/cycles/21-recommended-books/design-delta.md`: **기준 문서**
  - "한눈에", 구조 그림(흐름 a·b·c, 도메인, 수집기 상태)
  - "모듈" 표와 그 아래 bullet(맞추기 순서, `BookChoice`, 화면 책 이름)
  - "데이터"(칸 표, 목록별 CHECK, 잠금, Liquibase 순서 1~4), "첫 목록 파일 만들기"
  - "반영 파일 `notes.listPart`", "목록 파일", "API", "웹", "외부 연동", "시험 (AC별)", "확인 필요"
- `.../21-recommended-books/spec.md`: R1~R7, 상태별 동작, AC-1~AC-16, 데이터 출처, 확인 필요
- `.../21-recommended-books/flow.md`: H·S13·S13c·S13i·S14·S15. 화면 결정 #2 메모와 #4(아래 "화면 당부")
- `.../21-recommended-books/scope.md`: 결정 14개, 사이클 19와의 순서
- `.../21-recommended-books/from-cycle-20-header-light.md`: 머리말의 조회 상태 점 자리
- `.../19-author-angle-brackets/handoff.md`(= `docs/current/handoff.md`)와 `to-cycle-21.md`: 겹치는 파일, 19 AC-14
- 바탕 사이클: `docs/cycles/14-librarian-picks/`의 spec(아래 "C14"), flow, handoff
- 조사
  - `docs/research/leedongjin-picks/picks.md`: 44권 목록 4·5절, 분류 3절, 맞춘 수 8절
  - `docs/research/snu-100/picks.md`: 판 고르기 2절, 100권과 저자 열쇠 3절, 못 찾은 책 4절
  - `docs/reference-index.md` 4-1절(표지 방법), 6절(재작업 항목)
- 화면 그림
  - 머리말: `.../21-recommended-books/easy/2026-10-15-menu-decisions-2.html`
  - 목록 화면: `docs/research/leedongjin-picks/easy/2026-10-15-picks-screen-and-holdings.html`
  - "어느 목록인지" 안 A~D: `easy/2026-10-15-flow-decisions.html` 4번

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0122 | `picks` 하나가 맡고, 책 줄은 `list_book` 하나입니다(`list_key`로 나눔). 분야는 `list_field`에 둡니다. `pick`은 옮긴 뒤 지웁니다. 사서 받기는 `librarian` 줄만 고칩니다 |
| 0123 | 이동진·서울대 목록과 줄인 표지를 `notes.listPart`(형식 번호 3)로 보냅니다. `apply`·`finish`·`in-place`는 책 표를 바꿔 끼운 **뒤** 작은 트랜잭션에서 `replace`합니다. 서버는 새 목록 표지를 바깥에서 받지 않습니다 |
| 0124 | 고정 판은 수집기가 내 PC DB를 읽어 고릅니다. export 때 `catalog_next`에 대고 맞춰 `list_book.book_id`에 저장합니다. 서버는 읽기만 합니다. `manual` 고정 판은 덮어쓰지 않습니다. Java·Python 보유량 비교 시험을 둡니다 |
| 0125 | 보유량 = 켜진 도서관 가운데 구독형이 아닌 수 + 켜진 구독형이 하나라도 있으면 1 |
| 0126 | `GET /api/v1/picks/{listKey}`를 둡니다. 옛 `GET /api/v1/picks`는 지웁니다. 사용 알림에 `list`(필수)를 받고, 칸은 `screen_event.picks_list`입니다 |
| 0127 | 머리말 큰 메뉴 「추천도서」·「마이페이지」. PC는 올림 0.5초로 펼치고 덮지 않습니다. 640px 이하는 ☰ + 어둡게 덮기 |
| 0128 | 목록 파일은 dev `scripts/crawl/lists/`(UTF-8 TSV)에 둡니다. 유튜브는 YouTube Data API만 쓰고, 책은 ISBN 서지 API로 찾습니다 |
| 0129 | 맞춘 줄은 우리 책 제목에서 판 표시를 덜어 낸 이름, 못 맞춘 줄은 목록 이름입니다. 다르면 `listTitle`을 채웁니다 |

## 공통 제약

- **C1. 모듈 경계** [확정] (design-delta "모듈")
  - `collection`의 `allowedDependencies`에 `picks`만 더합니다(`backend/src/main/java/com/chaekcheck/collection/package-info.java` 12행). 고리는 없습니다. `picks`는 `collection`을 모르고, `CatalogLoad`도 부르지 않습니다
  - `picks`의 의존(`catalog, catalog :: normalize, library`)은 그대로입니다(`picks/package-info.java` 20행). 이 모듈에 처음으로 공개 Java 타입(`CuratedListTransfer`와 그 결과)이 생기므로 Javadoc도 고칩니다
  - 새 이벤트는 없습니다. 공용 모듈도 만들지 않습니다
- **C2. Liquibase** [확정]
  - 새 파일은 `picks/002-curated-lists.yaml`과 `usagelog/003-screen-event-picks-list.yaml` 둘입니다. master 끝에 `# cycle 21` 주석과 include를 둡니다
  - `PRE_DEPLOYMENT` 표시가 있어도(plan 읽기 2026-10-16: 있음) 기존 changeset은 고치지 않습니다. 사이클 17 첫 배포가 21보다 먼저일 수 있습니다
  - plan 읽기 2026-10-16 기준으로 master 맨 끝은 `# cycle 15` + `usagelog/001`(110~113행)입니다. 19가 먼저 들어오면 그 뒤가 끝입니다
- **C3. 사서 추천도서는 지금과 같게 보입니다(AC-10)**: 바뀌는 것은 같은 책 고르기 규칙(ADR-0125, 1권 먼저)과 화면 이름(ADR-0129)뿐입니다. 받기 일정, 실패 처리, 표지 받기는 C14 그대로입니다
- **C4. 쓰는 줄 나누기** [확정] (ADR-0122)
  - 서버 사서 받기는 `list_key = 'librarian'` 줄만 고칩니다
  - `replace`는 `leedongjin`·`snu100` 줄만 고칩니다
  - 겹칠 때는 목록별 `pg_advisory_xact_lock` 하나를 씁니다 [안]
  - 표지 정리("어느 `list_book.cover_source`도 쓰지 않는 `cover`" 지우기)는 두 쓰기 뒤에 모두 합니다
- **C5. 유튜브 약관** [확정] (spec 데이터 출처, ADR-0128)
  - 수집기는 `www.googleapis.com/youtube/v3`만 부릅니다. `www.youtube.com` 페이지 요청은 0건입니다
  - `search.list`는 쓰지 않습니다
  - 영상 제목·설명은 메모리에서 책 이름을 뽑는 데만 쓰고, 어느 파일·로그에도 남기지 않습니다
- **C6. 비밀 값**: 키(YouTube, ISBN 서지)는 dev `.env`에만 둡니다. 로그·파일·기록에 남기지 않습니다(C14 R1-7과 같음)
- **C7. 국립중앙도서관 예절**: ISBN 서지 API는 사람 손 속도로 부릅니다(1초 간격 [안], 사이클 14 `RequestPacer`와 같은 꼴). 하루 한도는 [확인 필요]이므로 0단계에서 확인합니다
- **C8. 다른 사이클과 겹치는 파일**
  - 19와 겹침: `collection` 가져오기(`ImportTransfer`, `CatalogImportRunner` `Settings`), `catalog.normalize`, 내 PC export 파일
  - 20과 겹침: `web/src/components/AppLayout.tsx`(조회 상태 점)
  - 나중에 main에 들어가는 쪽이 rebase로 충돌을 풉니다

## 개발 시작 전 확인

### dev가 확인할 것

- [ ] base package `com.chaekcheck` [확정] (dev `CLAUDE.md`)
- [ ] 시작 커밋: 지금 dev main 끝. `# 사이클 21` 절에 적습니다. 19가 이미 main에 들어갔으면 그 위에서 시작하고 master 끝줄을 다시 읽습니다
- [ ] 작업 폴더·브랜치·docker 프로젝트·포트 [안: dev가 정해 보고]
  - 예: worktree `../chaekcheck-dev-c21`, 브랜치 `cycle-21-recommended-books`, `docker compose -p chaekcheck-c21`
  - 포트는 13·14·18·19가 쓰는 번호와 겹치지 않게 정합니다. 켜기 전에 `docker compose ls`로 봅니다
  - 원래 프로젝트 `chaekcheck`과 다른 사이클의 docker 프로젝트는 켜고 끄지 않습니다
  - 따로 만든 DB에는 원래 서비스 DB를 한 번 복사합니다(원래 DB는 읽기만)
- [ ] **원래 DB(5432)에서 export를 하지 않습니다**: export는 `catalog_next`를 남겨 두므로, 19의 `export`가 "기다리는 내보내기"로 멈춥니다(`ImportTransfer.requireNoWaitingExport`). 19 인계서 0단계도 "21이 원래 DB에 가져오기를 했으면 멈춤"입니다. 실데이터 연습은 21의 복사본 DB에서만 합니다(10단계) [확정] (사용자 승인, 2026-10-16, 인계서 검토 #1)
- [ ] 키 확인: ISBN 서지 API 키(사서추천 키 `CHAEKCHECK_PICKS_NLK_API_KEY`로 되는지 0단계에서 확인), YouTube Data API 키(없으면 사용자에게 요청). `.env` 변수 이름은 [안: dev]
- [ ] 줄 번호는 plan이 2026-10-16에 dev main 작업 트리를 읽고 적은 것입니다. 19가 먼저 들어오면 다시 확인합니다

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| YouTube Data API 키 발급(Google Cloud 프로젝트), dev `.env`에 넣기 | 0단계 전 | 키 |
| (사서추천 키로 ISBN 서지 API가 안 되면) 국립중앙도서관 ISBN 서지 인증키 신청 → 담당자 승인 | 0단계 결과 뒤 | 키 |
| ~~ISBN 서지 KDC·표지 빈 값이 많을 때 R4-4 다시 정하기~~ → 정함 (2026-10-16, API 시험 뒤 결정 #1~#5) | — | — |
| 새 이동진 책 분야 정하기 (수집기가 확인 필요 파일에 제안) | 7단계 뒤 매달 | 목록 파일 분야 칸 |
| 화면 확인(PC 펼친 칸 정렬, "어느 목록인지" A/C) | 9단계 끝 | 진행 / 안 A~D 나란히 보기 |
| 실제 폰(Samsung Internet) 확인 | 9단계 끝 | 진행 / 고침 |
| 운영 역할 DB 반영 승인 | 10단계 | 승인 |

## 구현 단계

경로 약어
- `P` = `backend/src/main/java/com/chaekcheck/picks/`
- `C` = `backend/src/main/java/com/chaekcheck/catalog/`
- `I` = `backend/src/main/java/com/chaekcheck/collection/internal/importer/`
- `L` = `backend/src/main/resources/db/changelog/`

### 0단계: API 호출 시험 (코드 변경 없음, 결과를 plan에 먼저 보고)

1. **ISBN 서지 API** (`https://www.nl.go.kr/seoji/SearchApi.do`, 안내 https://www.nl.go.kr/NL/contents/N31101030500.do)
   - 할 일: 이동진 44권과 서울대 100권의 이름으로 부릅니다(조사 문서의 이름). 아래를 적습니다
     - (a) 사서추천 키로 되는지
     - (b) 하루 한도(문서나 응답 머리에 있으면)
     - (c) `KDC` 빈 값 비율
     - (d) `TITLE_URL` 빈 값 비율
     - (e) `TITLE_URL`의 호스트·경로, `http://`인지, 인증키가 붙는지, 열리는지
     - (f) 한 이름에 여러 줄이 오는 비율
   - 이유: `cover_source` CHECK, 수집기 설계, spec R4-4가 이 결과에 달려 있습니다
   - 의존: 없음
   - 위험: 중간(빈 값이 많으면 R4-4를 다시 물음 → 7·8단계가 막힘)
2. **YouTube Data API v3**
   - 할 일: `playlistItems.list`로 「이달의 책」(`PLUpgTv3bu9rGxQBAMVaMvam27P0YbiY29`)을 끝까지 읽습니다
     - `channels.list`(`part=contentDetails`)의 업로드 재생목록 ID를 얻는 법을 공식 문서로 확인하고 불러 봅니다 [확인 필요: 공식 문서 확인]
     - 영상 ID 꼴을 공식 문서로 확인합니다 [확인 필요]
     - 쓴 할당량 단위를 적습니다
   - **2026-10-15 이후 새 이달의 책이 있는지 적습니다**: AC-5의 "첫 권 = 2026년 6월 「히스토리아 비테이」"는 2026-10-15 기준이라, 새 영상이 있으면 기대값이 바뀝니다
   - 요청은 `www.googleapis.com`만 보냅니다(C5)
   - 의존: 사용자 키
   - 위험: 낮음
3. **보고**: `# 사이클 21` 절에 적고 사용자에게 알립니다. 1단계 CHECK(`cover_source` 접두, `video_id` 꼴)는 이 결과를 보고 정합니다. changeset은 나중에 고치지 않으므로 먼저 정합니다
4. **기준 빌드**: 시작 커밋에서 `./gradlew build` 통과를 확인합니다

### 1단계: Liquibase 두 파일

1. **`L/picks/002-curated-lists.yaml`** (design-delta "데이터" Liquibase 1~4) [확정: 순서·옮기기 / 안: 파일·changeset 이름]
   - 할 일
     - ① `list_field`·`list_book`을 만듭니다(칸 표와 목록별 CHECK `list_book_<list>_check`, 부분 UNIQUE, FK `(list_key, field_code)` ON DELETE CASCADE, 색인. CHECK·색인은 changeset 안 `sql`)
     - ② 사서 분야를 넣습니다. 아는 다섯(11 문학, 6 인문, 5 사회, 4 자연, 425 테마, `position` 1~5) + `pick`의 그 밖 `dr_code`를 `DISTINCT`로 넣고, `position`은 6부터 코드 순서입니다
     - ③ `INSERT … SELECT FROM picks.pick`. `position` = `ROW_NUMBER() OVER (PARTITION BY dr_code ORDER BY recom_month DESC, registered_on DESC NULLS LAST, recom_no DESC)`(`P/internal/cache/PicksCache.java` 52~55행 `BOOK_ORDER`와 같음). `source_no` = `recom_no`
     - ④ `DROP TABLE picks.pick`
   - 이름이 빈 새 코드는 "기타"로 넣습니다 [확정] (C14 R2-5, 지금 `PicksCache.OTHER_NAME`과 같음, AC-10)
   - 이유: 옮기지 않으면 켜자마자 다시 받는 1~2분 동안 비고, 그날 이미 받았으면 다음 날 05:00까지 빕니다(`FetchDecision` 규칙 1·2)
   - 의존: 0단계 3
   - 위험: 중간(옮긴 순서가 지금 화면과 달라질 수 있음 → AC-10 시험)
2. **`L/usagelog/003-screen-event-picks-list.yaml`** [확정: 칸 / 안: 파일 이름]
   - 할 일: `screen_event.picks_list`를 더합니다 → 있던 `picks_*` 줄을 `librarian`으로 채웁니다 → CHECK IN(셋)을 겁니다
     - 종류별 칸 CHECK(`usagelog/001` 184~193행 부근)를 지우고 `picks_*`일 때 `picks_list IS NOT NULL`, 그 밖일 때 NULL로 다시 겁니다
   - 의존: 없음
   - 위험: 낮음
3. **master** `L/db.changelog-master.yaml` 끝: `# cycle 21: recommended lists (ADR-0122, ADR-0126)` + include 둘 [안 문구]
- 시험
  - 스키마 시험(`db-test`): CHECK마다 맞는 줄과 틀린 줄
  - **옮기기 시험**: 사이클 14 꼴 `pick` 줄(아는 코드, 모르는 코드, `registered_on` NULL)을 넣은 뒤 002를 돌리면 사서 응답이 옮기기 전과 같은 순서·분류가 됩니다
  - `UsageLogSchemaTests`: `picks_list` 칸과 CHECK
- 확인: AC-10의 옮기기 부분

### 2단계: `catalog` 공개 API

1. **결과 레코드에 칸 둘** (`C/IsbnBook.java`, `C/TitleAuthorBook.java`): `title`(책 제목), `publisherNorm`을 더합니다 [확정] (설계 검토 3 #1)
   - 출판사 정리 함수는 plan 읽기로 `catalog.normalize.CatalogText.publisherNorm(String)`(107행)입니다. 같은 값인지 dev가 확인합니다
2. **`BookLookup.byIds(Collection<Long>)`** (`C/BookLookup.java`, 구현 `C/internal/JdbcBookLookup.java`) [확정: 동작 / 안: 이름·결과 레코드]
   - 결과는 `bookId, title, publisherNorm, libraryIds`입니다. 없는 번호는 뺍니다. 쿼리 하나로 읽습니다
3. **`CatalogLoad.preparedLookup()`** (`C/CatalogLoad.java`) [확정: 있음 / 안: 이름]
   - prepare가 채운 `catalog_next`를 읽는 `BookLookup`을 돌려줍니다
   - 색인이 없으므로 ISBN 묶음 쿼리와 제목+저자 묶음 쿼리 둘로 찾습니다 [안]. 걸린 시간을 잽니다 [확인 필요: 프로토타입]
4. **`FORMAT_VERSION` 2 → 3** (`C/internal/JdbcCatalogLoad.java` 76행). 거절 문구는 `Manifests.java` 208~210행 그대로입니다
- 이유: export 때 고정 판을 맞추고(ADR-0124), 화면 이름을 덜어 내고(ADR-0129), 출판사로 좁히기 위해서입니다
- 의존: 0단계
- 위험: 중간(`catalog_next` 쿼리 시간)
- 시험: `BookLookupTests` [안](`byIds`, 새 칸), `preparedLookup`이 `catalog`가 아니라 `catalog_next`를 읽는지, `ManifestsTests`(형식 2 파일 거절)

### 3단계: `library.lendingKinds()`

1. **`LibraryCatalog.lendingKinds()`** (`backend/src/main/java/com/chaekcheck/library/LibraryCatalog.java`) [확정: ADR-0125 / 안: 이름·모양]
   - 켜진 도서관 번호마다 구독형인지 돌려줍니다(`lending_model = SUBSCRIPTION`). 꺼진 도서관은 넣지 않습니다
   - 의존: 없음
   - 위험: 낮음
- 시험: 켜진 구독형, 켜진 보통, 꺼진 도서관(없음)

### 4단계: `picks` (저장, 고르기, 이름, 가져오기 API, 캐시, 컨트롤러)

1. **`PicksStore`를 `list_book`으로** (`P/internal/store/PicksStore.java`) [확정] (설계 검토 3 #1)
   - `hasPicks()`(39행)와 받기의 "같은 목록인가" 비교(`saveSucceeded` 70행 부근)는 `librarian` 줄만 봅니다
   - 저장: 한 트랜잭션에서 `librarian` 줄만 지우고 넣고, 새 분야는 `list_field` 끝에 붙이고, `fetch_run`을 씁니다. 목록 잠금은 C4입니다
   - `missingCoverSources()`(128행)는 **`librarian` 줄만** 봅니다. 서버는 새 목록 표지를 받지 않습니다(ADR-0123)
   - `deleteUnusedCovers()`(156행)는 모든 `list_book.cover_source`를 기준으로 합니다
   - `PickCategory` 상수와 `KeptPicks.CODE_ORDER`가 하던 분야 이름·순서는 `list_field`에서 읽습니다
   - 의존: 1단계
   - 위험: 중간
2. **`BookChoice`** (`P/internal/cache/BookChoice.java`) [확정] (ADR-0125, 설계 검토 #3·#7)
   - 보유량 = 켜진 도서관 가운데 구독형이 아닌 수 + (켜진 구독형이 하나라도 있으면 1). `lendingKinds()`에 없는 번호는 세지 않습니다
   - 같으면 1권을 먼저 고릅니다(판 표시를 덜어 낸 제목 끝 권 번호가 `1`·`(상)`이거나 권 번호 없는 판). 그다음 책 번호가 작은 것입니다
   - `Candidate`에 제목을 더합니다
   - 의존: 2·3단계
   - 위험: 중간(사서 맞춘 책이 바뀜 → 10단계에서 72/108과 견줌)
3. **화면 책 이름 덜어 내기** (새 `P/internal/…/ShownTitle.java` [안: 이름·자리]) [확정: ADR-0129 / 안: 규칙 세부]
   - 덜어 낼 것: 끝 괄호 안의 판·언어 표시, 끝 낱말 "오리지널판", 끝 권 번호 `1`·`(상)`, 앞 `[시리즈]`. 덜어 내 비면 그대로 둡니다
   - 2의 1권 판정과 같은 코드를 씁니다. 사이클 19 `SameTextKey` 앞 괄호 떼기와 같은 꼴입니다
   - 의존: 없음
   - 위험: 중간(지나치게 덜어 내면 다른 제목이 됨)
4. **`CuratedListTransfer`** (새 공개 타입 `P/CuratedListTransfer.java`, 구현은 `P/internal/…`) [확정: ADR-0123·0124 / 안: 이름]
   - `read(Path listsDir, BookLookup lookup)` → `ListPart`(JSON 글자 + 목록별 줄 수·맞춘 수·못 맞춘 수)
     - 파일 검사: 분야·번호·연월·영상 ID·표지 파일 꼴. 틀리면 파일·몇째 줄·무엇을 오류에 담습니다
     - 고정 판 맞추기 ①~④(design-delta "모듈" bullet)
     - `checked_on`이 30일을 넘긴 줄은 경고합니다
     - `listPart.covers`에는 줄이 쓰는 표지만 싣습니다
   - **검사 시점** [안]: design-delta는 "검사 실패 → 사본을 읽기 전에 멈춤"이면서 `read`가 `preparedLookup`(prepare 뒤)을 받습니다. 그래서 파일 검사만 하는 함수(예 `check(Path)`)를 prepare **전에**, 맞추기를 prepare 뒤에 부르게 나눕니다. 나눈 모양을 `# 사이클 21` 절에 보고합니다
   - `replace(String listPart)`: 자기 트랜잭션 하나에서 목록 잠금 → `leedongjin`·`snu100`의 `list_book` 지우기 → `list_field` 지우기 → 넣기
     - 표지는 `ON CONFLICT (source_url) DO NOTHING`, `content_type = image/jpeg`, `byte_size`, `fetched_at`
     - 그 뒤 쓰지 않는 표지를 지우고 셈을 돌려줍니다
   - 의존: 1·2·3
   - 위험: 중간
5. **`PicksCache`를 목록별로** (`P/internal/cache/PicksCache.java`) [확정: 캐시 주기·실패 시 앞 사본]
   - 목록마다 사본 하나를 둡니다. 사서 줄은 지금처럼 `byIsbn13` → `byTitleAndAuthor` + 새 `BookChoice`로 맞춥니다. 이동진·서울대 줄은 저장된 `book_id`를 `byIds`로 읽습니다(보유 도서관과 제목)
   - 순서
     - 사서: `BOOK_ORDER`
     - 이동진: `recommended_month` 최근 먼저, 같은 달은 `position`
     - 서울대: `toc_no`
     - 분야: 「전체」 다음 `list_field.position`. 0권 분야는 숨깁니다
   - 책마다 화면 이름(3)과 `listTitle`(목록 이름이 다를 때만)을 둡니다
   - 의존: 1~4
   - 위험: 중간
6. **컨트롤러** (`P/internal/web/PicksController.java`, `PicksErrors.java`) [확정: ADR-0126]
   - `GET /api/v1/picks/{listKey}`를 둡니다. 모르는 이름은 404 `list_not_found`(ProblemDetail)이고, 400·422·500은 지금과 같습니다
   - `GET /api/v1/picks`는 지웁니다. 표지 경로는 그대로입니다
   - 응답 칸은 design-delta "API"를 따릅니다(`id`는 사서 = `source_no`, 그 밖 = `list_book.id`)
- 시험
  - `BookChoiceTests`: 구독형 셋 = 1, 꺼진 도서관은 세지 않음, 같으면 1권 먼저, 그다음 번호 작은 것
  - `ShownTitleTests`: 「햄릿(Hamlet)」 → 「햄릿」, 「오디세이아(고대 그리스어 완역본)」 → 「오디세이아」, 「토지. 1(1부 1권)」 → 「토지」, 「위대한 유산(상)」 → 「위대한 유산」, 「백석의 사슴 오리지널판」 → 「백석의 사슴」, 덜어 내 비면 그대로
    - 시험 입력은 목록 이름이 아니라 그 목록에 맞춘 **우리 책 제목**입니다(조사 `snu-100/picks.md` 3절)
  - `CuratedListTransferTests`: 검사 실패 줄 번호, 고정 판 → 책 번호(ISBN / 제목+저자+출판사 / 못 맞춤 NULL), `replace`가 사서 줄을 건드리지 않음, 표지 정리가 다른 목록 표지를 지우지 않음
  - 사서 받기 시험: `librarian` 줄만 바뀌고 이동진·서울대 줄은 그대로(AC-10)
  - `PicksControllerTests`: 세 목록, 404, 빈 목록이면 200 빈 `categories`
  - `ModularityTests` 통과(`picks` 공개 타입이 생김)
- 확인: AC-4·5·6·7·10·15·16의 시험 부분

### 5단계: `collection` 가져오기

1. **설정 `lists-dir`** (`I/CatalogImportRunner.java` `Settings`, `backend/src/main/resources/application-collection-import.yml`) [확정: 동작 / 안: 키 `chaekcheck.collection.import.lists-dir`, 기본값 `../scripts/crawl/lists`]
   - `export`·`in-place`에서 폴더나 `fields.tsv`·`leedongjin.tsv`·`snu100.tsv`가 없으면 **사본을 읽기 전에** 멈춥니다(사이클 19 `rules-dir`와 같은 꼴) [확정] (설계 검토 3 #2)
2. **`Notes.listPart`** (`I/ImportTransfer.java` `Notes` 88~92행)
   - `export`(126행): prepare 전에 목록 파일 검사(4-4), prepare 뒤에 `read(listsDir, catalogLoad.preparedLookup())`, `Notes`에 실어 형식 3으로 씁니다. 기록에 목록별 맞춘 수·못 맞춘 수를 남깁니다
3. **바꿔 끼운 뒤 `replace`** [확정] (설계 검토 3 #3: "(B) 바꿔 끼운 뒤 작은 트랜잭션"; 같은 트랜잭션 안은 미승인 "나는 시간이 늘어나는게 싫어")
   - `apply`(154행): `catalogLoad.apply(file)`가 성공한 **뒤** `replace(notes.listPart())`
   - `finish`(213행): `finishPrepared` 뒤
   - `in-place`: 바꿔 끼운 뒤 그 `catalog`를 읽는 `BookLookup`으로 `read` → `replace` [안]
   - 지문이 다르거나 바꿔 끼우기가 실패하면 목록은 그대로입니다
   - 목록 넣기만 실패하면 옛 목록이 남고, 가져오기 기록·로그에 남깁니다. 기록 칸은 [안: dev]
4. `collection/package-info.java`: `allowedDependencies`에 `"picks"`를 더하고 Javadoc을 고칩니다
- 이유: ADR-0123, ADR-0124
- 의존: 2·4단계
- 위험: 중간(19와 같은 파일, C8)
- 시험(`db-test`, 가져오기 시험)
  - 형식 3 manifest 읽기, 목록 폴더 없음 → 멈춤
  - 지문 다름 → 목록 그대로, 바꿔 끼우기 실패 → 목록 그대로, 목록 넣기 실패 → 옛 목록 + 기록
  - `finish`·`in-place` 뒤 목록 들어감
  - `ModularityTests`(`collection → picks` 허용), `DocumentationTests`
- 확인: design-delta "시험" 표 "가져오기" 행

### 6단계: `usagelog` `list` 받기

1. `backend/src/main/java/com/chaekcheck/usagelog/internal/web/UsageEventReader.java` 62~63행
   - `picks_list_view`·`picks_book_view`에 `list`를 필수로 받습니다. 셋 밖이거나 없으면 `rejected_event`입니다(지금 규칙)
2. `usagelog/internal/write/UsageLogWriter.java` 49행 INSERT에 `picks_list`를 더합니다
- 의존: 1단계 2
- 위험: 낮음
- 시험: 읽기 시험(없음·틀림 → 거절), 쓰기 시험

### 7단계: 수집기 (Python, `scripts/crawl/`)

1. **새 수집기** (예 `scripts/crawl/recommended_lists.py` [안: 이름]). 파일 꼴은 design-delta "목록 파일"을 따릅니다 [확정: ADR-0128 위치 / 안: 칸 이름]
   - 할 일
     - YouTube: 「이달의 책」과 업로드 재생목록을 **처음부터 끝까지** 다시 읽습니다
       - 업로드 재생목록(dev 0단계: `channels.list` `contentDetails.relatedPlaylists.uploads`)에서는 제목에 **"올해의"**·"베스트북"이 든 12월 영상을 찾아 확인 필요 파일에 넣습니다 [확정] (사용자 승인, 2026-10-16, [올해의 책 찾기](easy/2026-10-16-yearbook-search.html) #1, 메모: "그렇게 하되 다른 ai가 잘 파악하게 문서 구조화랑 스크리트 이런거 잘 해두고")
       - **사용자 당부** (위 메모): 다른 Claude 세션이 문서만 읽고 수집기를 찾아 돌리고 고칠 수 있게 합니다. 찾는 낱말·분야 제안표·표지 차례는 규칙 파일(TSV)이나 주석 단 상수로 두고, `docs/maintenance/rules-index.md`에 "어디에 / 뜻 / 확인하는 법 / 바꾸는 법" 한 줄씩, `docs/maintenance/4-picks.md`(또는 `2-crawl.md`)에 수집기 실행·입력·출력·확인 필요 파일 다루는 법, `scripts/crawl/lists/README.md`에 파일마다 칸 뜻을 적습니다 (사이클 19 R7과 같은 꼴)
       - 목록 파일에 없는 영상은 새 영상입니다
       - 있는 영상이 아직 공개면 `checked_on`을 고칩니다. 사라졌거나 비공개면 줄을 지우고 기록합니다(30일 규칙, 개발자 정책 III.E.4)
     - 책 이름: 제목·설명란의 `[ ]`·`《 》`·`〈 〉`·`『 』` 안, 또는 🔖 뒤입니다(R4-2). 메모리에서만 씁니다(C5)
     - ISBN 서지 API: ISBN·저자·출판사·`SUBJECT`·`TITLE_URL`. 분야는 정하지 않고 `subject_fields.tsv`로 **제안만** 해서 새 책을 `leedongjin_pending.tsv`에 넣습니다. 사람이 분야를 정해 `leedongjin.tsv`로 옮깁니다 [확정] (사용자 승인, 2026-10-16, 사이클 21 API 시험 뒤 결정 #1)
       - 이름 없음·여럿 → `leedongjin_pending.tsv`(영상 ID·연월·까닭만)
       - 같은 분야에 같은 책이 겹치면 최신만 남깁니다(R3-5)
       - 한 영상에 책이 여럿이면 같은 달로 따로 넣습니다
     - 고정 판: 내 PC DB(`catalog.book`·`book_contributor`·`library.library.lending_model`)를 SELECT만 해서 같은 책 판들의 보유량을 셉니다
       - **Java `BookChoice`와 같은 공식**(켜진 도서관만, 구독형 1, 1권 먼저, 번호 작은 것)입니다
       - 서울대는 R3-3 범위와 거르기(출판사 "어린이", 저자 "번역AI", "[100분 고전]" 같은 요약 시리즈)를 씁니다
       - `manual` 줄은 덮어쓰지 않고, `collector` 줄은 다시 고릅니다
       - DB 접속이 실패하면 고정 판 칸은 그대로 두고 한 줄 기록합니다
     - 표지 차례: ① 고정 판 ISBN으로 국립중앙도서관 표지가 있으면 그것 ② 없으면 수집 DB 표지 가운데 YES24(`image.yes24.com`)·교보(`dcontent.dkyobobook.co.kr`) 주소 ③ 그것도 없으면 그 책의 첫 주소, 받지 못하면 다음 차례, 다 안 되면 제목 글자 표지 [확정] (사용자 승인, 2026-10-16, [표지 순서](easy/2026-10-16-cover-order.html) #1)
     - 표지: 없는 표지만 받습니다. 폭 200px, JPEG 품질 0.8, 원본 5MB가 넘으면 받지 않습니다(ADR-0091, dev `application.yml` 211~215행과 같은 값). `http://`는 `https://`로 적습니다 [안, 0단계 결과로 확인]. 파일은 `covers/<sha1(cover_url)>.jpg`
     - 실패(키 거절·할당량·응답 없음) → 목록 파일을 건드리지 않고 기록에 한 줄 남깁니다(R4-6)
     - 요청마다 호스트를 기록합니다(AC-12 근거)
   - 새 의존성(그림 줄이기, PostgreSQL 접속)은 `requirements.txt`에 더하고 보고합니다 [안: 라이브러리]
   - 돌리는 때: 사람이 수집기를 돌릴 때 지난 갱신 뒤 한 달이 넘었으면 함께 돌립니다(R4-6). `docs/maintenance/2-crawl.md`에 한 줄 적습니다
   - 의존: 0단계
   - 위험: 중간
2. **Java·Python 보유량 비교 시험** [확정] (ADR-0124)
   - 같은 입력 자료(작은 JSON [안: 자리])를 Java 시험(`BookChoiceTests`)과 Python 시험이 함께 읽어 같은 판을 고르는지 봅니다
- 시험(`python -m unittest`, 네트워크 없음, API 응답 저장본)
  - 새 영상 → 새 줄(영상 ID, 연·월, 책 이름, 저자, ISBN, 분야), 파일에 제목·설명 없음(AC-11)
  - `www.youtube.com` 요청 0건(AC-12)
  - 키 틀림 → 파일 그대로 + 기록 한 줄(AC-13)
  - 책 이름 없는 영상 → pending, 목록에는 없음(AC-14)
  - 사라진 영상 → 줄 지움 + 기록, 남은 영상 → `checked_on` 고침
  - `manual` 보존, 서울대 거르기, 같은 분야 겹침 → 최신만
  - 표지 줄이기(폭, 5MB 상한)
- 확인: AC-6·7(수집기 부분), AC-11~AC-14

### 8단계: 첫 목록 파일 (design-delta "첫 목록 파일 만들기") [확정] (설계 검토 3 #1)

1. 조사 문서를 옮깁니다
   - 이동진 44권은 `docs/research/leedongjin-picks/picks.md`(영상 ID·연월·책)에서, 서울대 100권은 `docs/research/snu-100/picks.md`(목차 번호·분야·저자 열쇠)에서 옮깁니다 → `fields.tsv`·`leedongjin.tsv`·`snu100.tsv`
   - `pinned_by`는 비워 둡니다. 서울대 「미국의 민주주의」·「페더랄리스트」는 사람이 `manual`로 적습니다 → 고를 판은 [확인 필요: 사용자에게 질문], plan에 물음
   - 분야 코드는 [안] 이름(예 `korean_fiction`, `korean_lit`)이고, 분야 이름과 순서는 spec R5-1·R5-2 [확정]입니다
   - 「마음 깊은 숨」은 넣지 않습니다(R3-5)
2. ~~KDC로 다시 매기기~~ → 하지 않습니다. 44권 분야는 조사 문서 5절 그대로 [확정] (사용자 승인, 2026-10-16, 사이클 21 API 시험 뒤 결정 #2). 서울대 두 권 고정 판: 「미국의 민주주의」 607617, 「페더랄리스트」 463760 (`manual`) [확정] (사용자 승인, 2026-10-16, 사이클 21 API 시험 뒤 결정 #4·#5)
3. 수집기를 한 번 돌려 고정 판과 표지 파일을 채우고, 맞춘 수를 조사 때 값과 견줍니다(이동진 36/44, 서울대 87/100, 2026-10-14·15 측정)
- 의존: 0·7단계, 2는 사용자 확정
- 위험: 중간(확정을 기다림, 위 "main에 합치는 조건")
- 확인: AC-4·5의 자료, 9단계 화면의 자료

### 9단계: 웹

1. **머리말** (`web/src/components/AppLayout.tsx`, `AppLayout.module.css`, `AppLayout.test.tsx`) [확정: ADR-0127, spec R1]
   - 큰 메뉴 「추천도서」(이동진 추천도서 → `/picks/leedongjin`, 사서 추천도서 → `/picks/librarian`, 서울대 100선 → `/picks/snu100`)와 「마이페이지」(내 도서관 관리 → `/my-libraries`)를 둡니다
   - PC: 0.5초 멈추면 열고, 나간 뒤 0.5초에 닫습니다. 두 칸이 함께 펼쳐지고 덮지 않습니다(그림자·선). 큰 메뉴 글자를 누르면 첫 항목으로 갑니다
   - 641px 이상 태블릿은 누르면 펼칩니다. 640px 이하는 ☰와 어둡게 덮기, ✕나 바깥을 누르면 닫힙니다
   - 키보드는 Tab, Enter·↓, Esc입니다. 작은 메뉴를 누르면 닫힙니다
   - 지금 화면 표시: 「추천도서」에 밑줄, 펼친 칸과 ☰ 안에서는 목록 이름을 굵게 합니다
   - **`legal` 분기(13행)를 없앱니다**: 약관·처리방침도 같은 머리말입니다(AC-3)
   - 조회 상태 점 **자리**만 둡니다(「로그인」 바로 왼쪽, 폰은 ☰ 왼쪽). 점 자체는 사이클 20이 만듭니다. 320px 시험에서는 폰 점 크기의 자리 표시로 한 줄을 확인합니다 [안]
2. **경로** (`web/src/main.tsx` 44행): `/picks/:listKey` 셋을 둡니다. `/picks` → `/picks/librarian`으로 넘기고, 모르는 이름은 지금 없는 주소 처리와 같게 합니다 [안]
3. **API·타입** (`web/src/api/client.ts` 187~194행, `api/types.ts` 374~398행, `api/usageEvents.ts` 15행)
   - 목록 이름 경로로 바꿉니다. `recomNo` → `id`이고, `list`·`listTitle`·`yearBook`·`videoId`·`tocNo`를 더합니다. 사용 알림에 `list`를 넣습니다(`PicksPage.tsx` 291행 등)
4. **목록 화면** (`web/src/features/picks/*`)
   - 표지 아래: 이동진 "26.06", 서울대 목차 번호, 사서 그대로
   - 맨 위 제목: PC·641px 이상(A). 폰은 떠 있는 버튼에 [목록 이름 · 분야 ▾](C)
   - 책 창: 화면 이름, 다르면 "목록 이름 「…」" 한 줄, 목록별 한 줄(R6-1·R6-2)
     - 이동진 [영상 보기]: 새 탭. PC·태블릿은 "책 검색 >>" 옆, 폰은 아래 줄. S15 희망도서 안내에도 둡니다
     - 영상 주소는 `videoId`로만 만들고 `safeUrl` 규칙을 따릅니다
   - 기준 보기 글과 출처 줄은 spec R5-5 문구 그대로입니다. YouTube 서비스 약관 링크는 https://www.youtube.com/t/terms 입니다
   - 상태 문구 R7-1, 자리 기억은 목록마다(`picksPosition.ts`)
- 시험(vitest)
  - 머리말: 열기·닫기 시간, 덮지 않음, ☰·덮기, 키보드, `/terms`·`/privacy` 같은 머리말
  - 경로 넘기기, 목록별 표지 아래 글자, 책 창 줄, [영상 보기] `target=_blank`, 출처 줄
  - 흐린 제목 글자 표지 → S15
  - C14 AC-2·3·5·7~10·16·18~21을 세 목록에서
- 화면 확인
  - Playwright로 데스크톱 1280을 먼저 보고, 그다음 태블릿 768과 폰 375·320을 봅니다
  - 화면 확인 때 사용자에게 PC 펼친 칸 정렬과 "어느 목록인지"를 보입니다(아래 "화면 당부")
  - 그다음 사용자 실제 폰을 확인합니다(완료 기준)
- 의존: 4·6단계 (8단계 자료가 있으면 실데이터로 확인)
- 위험: 중간
- 확인: AC-1·2·3·4·5·8·9·15·16(화면)

### 10단계: 실데이터 확인과 반영

1. **연습(21 복사본 DB, 원래 DB는 건드리지 않음)**
   - 복사본에서 `export` → 운영 역할 꼴 복사본에 `apply`를 돌립니다
   - 잴 것
     - export에 더해진 시간(목록 검사·`catalog_next` 맞추기)
     - `listPart` 크기
     - apply에서 바꿔 끼우기 대기 시간과 `replace` 트랜잭션 시간
     - 목록별 맞춘 수·못 맞춘 수: 이동진 36/44·서울대 87/100과 견줌(spec R2-4: 못 찾은 책은 서울대 13, 이동진 8), 사서 72/108(새 `BookChoice` 기준)
   - 21 코드 서비스를 켠 채 `in-place`(또는 두 번째 apply)를 하면, 다시 켜지 않아도 10분 안에 화면에 바뀐 목록이 나오는지 봅니다(R4-7) [안]
   - 반영 중 검색 5xx: `probe_during_import.py`(사이클 11 방법) [안]
2. **진짜 반영**: 위 "일정" 규칙을 따릅니다
   - 21이 10-17까지 main에 있으면 19의 13단계와 한 번에 합니다
   - 아니면 19 반영 뒤 따로 합니다
   - 형식 2 기다림을 먼저 정리합니다
   - 운영 역할 DB는 `db-ops`(5434) 또는 그때의 운영 역할 DB입니다. 사용자 승인 뒤 반영합니다
   - 21 Liquibase(`picks/002`가 `pick`을 지움)는 21 코드가 처음 그 DB에 붙을 때 돕니다
     - 옛 코드 서비스는 그 뒤 캐시 읽기가 실패해 앞 사본을 유지합니다(`PicksCache` 실패 처리)
     - 반영 뒤 바로 새 코드로 다시 켭니다
     - 가져오기 명령이 Liquibase를 먼저 돌리는지는 dev가 확인해 순서를 보고합니다 [확인 필요: dev]
3. **반영 뒤 확인**
   - AC-4·5·6(구운몽의 `bookId`가 보유량 최대 판)·7(토지 1권)·10·15(광장)·16(햄릿)
   - 19가 반영된 뒤라면 세 목록 맞춘 수를 다시 잽니다(19 AC-14)
- 위험: 중간

## 화면 당부 (사용자가 dev에 전하라고 한 것)

- **PC 펼친 칸 정렬** [확정] (flow 화면 결정 #2 메모, 사용자: "그 pc버전 정렬은 이 예시처럼이면 안 돼.. 개발할 때 조심해.. 다른 사이트 보면서 파악하고")
  - 결정 페이지 그림을 따라 칸을 왼쪽에 몰지 않습니다
  - dev가 **도서관 정보나루(https://www.data4library.kr) 등 실제 사이트를 열어** 각 칸을 자기 큰 메뉴 바로 아래에 맞춥니다. 칸 배경은 화면 전체 폭입니다
    - plan 측정(2026-10-15, PC 1622px): 정보나루 큰 메뉴 241px, 칸은 그 안쪽 15px부터
  - 화면 확인 때 사용자에게 보입니다
- **"지금 어느 목록인지" 안 네 가지** [확정] (flow #4, 사용자: "pc는 a 폰은 c", 설계 결정 #12)
  - A 맨 위 제목: 첫 분야 위에 목록 제목 한 줄, 넘기면 함께 올라감. 근거: 정보나루, 교보문고 PC
  - B 목록 바꾸기 탭 줄: 화면 위 둥근 칸. 근거: 교보문고 폰, 리디. spec 비목표지만 비교용으로만 만듭니다
  - C 떠 있는 버튼에 함께: 아래 가운데 [이동진 추천도서 · 외국 소설 ▾]
  - D 머리말 메뉴 표시만: 밑줄·굵게만
  - **고른 것: PC·641px 이상 태블릿 = A, 폰 = C**
  - 사용자가 화면 확인 때 이상하다고 하면, dev가 안마다 다른 화면을 만들어 나란히 보여 줍니다(사용자: "근데 실제로 작동시켜봐야 알 것 같은데 dev에서 내가 이상하다고 하면 각각 다른 화면을 만들어서 보여주도록 dev에게 이 방법들을 알려줘", 2026-10-15). 고른 결과는 `# 사이클 21` 절에 적습니다

## 테스트

- **단위**: `BookChoiceTests`, `ShownTitleTests`, 목록 파일 검사, `lendingKinds`, 사용 알림 읽기, 수집기 시험, Java·Python 보유량 비교
- **통합(`db-test`, 모듈 시험)**
  - Liquibase 스키마와 옮기기 시험
  - `BookLookupTests`(`byIds`, `preparedLookup`), `ManifestsTests`
  - `CuratedListTransferTests`, 사서 받기 시험, `PicksControllerTests`
  - 가져오기 시험(export·apply·finish·in-place, 실패 경우)
  - `UsageLogSchemaTests`·쓰기 시험
  - `ModularityTests`(`ApplicationModules.of(ChaekcheckApplication.class).verify()`, `collection → picks` 허용, `picks` 공개 타입), `DocumentationTests`, 기존 시험 전부
- **화면**: vitest, Playwright 데스크톱 → 태블릿 → 폰, 사용자 화면 확인, 사용자 실제 폰 확인
- **데이터**: 10단계 측정

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 PC 0.5초 두 칸, 어둡지 않음 | 웹 시험 + 화면 확인(정렬) | 9 |
| AC-2 375px ☰·덮기, 320px 한 줄 | 웹 시험 + Playwright + 실제 폰 | 9 |
| AC-3 약관·처리방침 같은 머리말 | 웹 시험 | 9 |
| AC-4 서울대 첫 9권 목차 1~9, 분야 순서 | 캐시 순서 시험 + 웹 + 반영 뒤 | 4, 8, 9, 10 |
| AC-5 이동진 첫 권 최신, "26.06" (0단계에서 새 영상 확인) | 캐시 순서 시험 + 웹 + 반영 뒤 | 0, 4, 8, 9, 10 |
| AC-6 구운몽 보유량 최대(구독형 1) | `BookChoiceTests` + 수집기 + 비교 시험 + 반영 뒤 `bookId` | 4, 7, 10 |
| AC-7 토지 1권 | `BookChoiceTests`·`ShownTitleTests` + 수집기 + 반영 뒤 | 4, 7, 10 |
| AC-8 책 창 추천 줄·[영상 보기] 새 탭, 서울대 분야·번호 없음 | 웹 시험 | 9 |
| AC-9 이동진 출처 줄 관계없음 | 웹 시험 | 9 |
| AC-10 사서 그대로, 고르기만 바뀜 | 옮기기 시험 + 사서 받기 시험 + 웹 + 반영 뒤 72/108 견줌 | 1, 4, 9, 10 |
| AC-11 새 영상 → 새 줄, 제목·설명 없음 | 수집기 시험 | 7 |
| AC-12 `www.youtube.com` 0건 | 수집기 시험 + 8단계 실행 기록 | 7, 8 |
| AC-13 키 틀림 → 파일 그대로 + 기록 | 수집기 시험 | 7 |
| AC-14 책 이름 없음 → 확인 필요 | 수집기 시험 | 7 |
| AC-15 광장 흐린 글자 표지 → 희망도서 안내 | `CuratedListTransferTests`(NULL) + 웹 + 반영 뒤 | 4, 9, 10 |
| AC-16 햄릿 화면 이름, "목록 이름" 줄 | `ShownTitleTests` + 웹 + 반영 뒤 | 4, 9, 10 |
| C14 AC-2·3·5·7~10·16·18~21 (세 목록) | 웹 시험 | 9 |
| 가져오기(design-delta 시험 표) | 가져오기 시험 | 5 |

## 완료 기준

- [ ] AC-1~AC-16과 C14 AC(세 목록)를 위 표의 단계에서 확인하고, AC 확인표를 `# 사이클 21` 절에 적습니다
- [ ] 단계마다 `backend/` `./gradlew build` 통과(`ModularityTests`·`DocumentationTests` 포함), `web/` `npm run build`·시험 통과, 수집기 시험 통과
- [ ] Java·Python 보유량 비교 시험 통과
- [ ] 기존 changeset을 고치지 않았습니다. master 끝 순서가 맞습니다(19와 합친 뒤 다시 확인)
- [ ] 0단계 결과를 plan에 보냈습니다(끝남, 2026-10-16)
- [ ] 목록 파일 셋과 표지가 main에 함께 들어갔습니다(형식 3 export가 멈추지 않음)
- [ ] 21 코드로 돌리기 전에 기다리는 형식 2 내보내기를 정리했습니다
- [ ] 사용자가 화면 확인에서 PC 펼친 칸 정렬과 "어느 목록인지"(A/C, 필요하면 A~D 나란히)를 보고 승인했습니다
- [ ] 이 사이클은 폰 화면(머리말 ☰, 목록 화면 셋, 책 창 [영상 보기])을 바꿉니다. 사이클을 닫기 전에 사용자가 **자기 폰(Samsung Internet)**으로 dev 웹 서버 `web-lan-5174`(`.claude/launch.json`, 같은 Wi-Fi)에 붙어 확인합니다. Chrome 폰 흉내만으로는 안 됩니다(사용자 결정, 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-design-addendum-decisions.html` #3)
- [ ] 운영 역할 DB 반영 성공, 운영 역할 서비스를 새 코드로 다시 켰습니다. 세 목록이 보입니다
- [ ] [확인 필요] 결과, 설계와 달라진 점, 새로 알게 된 제약을 `# 사이클 21` 절에 적습니다

## [확인 필요] 항목과 개발 중 확인 방법

| # | 항목 | 누가·어떻게 | 결과에 따라 | 막는 단계 |
|---|---|---|---|---|
| 1 | `TITLE_URL`의 호스트·경로, 인증키가 붙는지 | dev, API 호출 시험 | `cover_source` CHECK 접두, 표지 받기, `https://` 바꾸기 | 1(CHECK), 7 |
| 2 | 사서추천 키로 ISBN 서지 API가 되는지, 하루 한도, KDC·표지 빈 값 비율 | dev, API 호출 시험(44+100권) | 안 되면 사용자가 키 신청. 빈 값이 많으면 plan이 R4-4를 다시 물음 | 7, 8 |
| 3 | 유튜브 영상 ID 꼴 | dev, 공식 문서 확인 | `video_id` CHECK | 1 |
| 4 | 업로드 재생목록 ID를 얻는 법(`channels.list` `contentDetails`) | dev, 공식 문서 확인 + 호출 | 올해의 책 찾기 | 7 |
| 5 | YouTube API 키 | 사용자 | 0단계 시험 | 0 |
| 6 | 색인 없는 `catalog_next`에서 고정 판을 맞추는 시간 | dev, 프로토타입 | 늦으면 쿼리 모양 바꾸고 보고 | 5, 10 |
| 7 | 출판사 정리 함수 | dev 코드 확인(plan 읽기: `CatalogText.publisherNorm` 107행) | 맞추기 ② | 2 |
| 8 | 수집기의 내 PC DB 접속(dev `.env` 주소 [안]) | dev | 판 고르기 | 7 |
| 9 | 2026-10-15 이후 새 이달의 책(AC-5 기대값) | dev, 0단계 | AC-5 기대값 | 0 |
| 10 | ~~「미국의 민주주의」·「페더랄리스트」 고정 판~~ → 정함: 607617 · 463760 (API 시험 뒤 결정 #4·#5) | — | — | — |
| 11 | ~~이동진 44권 KDC 다시 매기기 차이~~ → 없어짐 (API 시험 뒤 결정 #2) | — | — | — |
| 12 | 형식 3과 19 병합 순서, 기다리는 형식 2 내보내기 | dev(위 "일정"대로) | 정리 뒤 진행 | 10, 배포 |
| 13 | ~~사서 새 분야 이름이 빌 때~~ → 정함: "기타" (C14 R2-5 [확정], plan이 design-delta를 고침 2026-10-16) | — | — | — |
| 14 | 목록 파일 검사를 prepare 전에 하도록 API 나누기 | dev가 모양을 정해 보고 | 이름·모양 | 4, 5 |
| 15 | 가져오기 명령이 Liquibase를 먼저 돌리는지(운영 반영 순서) | dev 확인 | 10단계 순서 | 10 |
| 16 | 사이클 19 반영 뒤 세 목록 맞춘 수 | dev 측정(19 AC-14) | 보고 | 19 반영 뒤 |
| 17 | ISBN 서지 표지·서지의 이용 허락 범위, 서울대 100선 목록 게시 | plan·사용자(공식 문서 확인, 사용자에게 질문) | 안 되면 제목 글자 표지 등 | 공개 배포(개발은 막지 않음) |

## 이번에 하지 않는 것

- 사서 추천도서를 가져오기 길로 옮기기 [확정] (사용자: "아니다 사서 추천은 따로 가자", 2026-10-16)
- 추천 글·영상 설명·해제 글 보여 주기, 영상 퍼가기 재생
- 머리말 「알림·안내」, 다른 평론가·대학 목록
- 목록 바꾸기 탭 줄(B)을 실제로 넣기. 사용자가 화면 확인에서 요청하면 비교 화면으로만 만듭니다
- 관리 화면에서 목록 고치기
- 조회 상태 점의 동작(사이클 20). 21은 자리만 둡니다. Chrome 확장(사이클 20)
- 도서관 클릭 기록에 목록 이름 남기기, 목록 반영 기록 표(design-delta backlog 후보)
- 「마음 깊은 숨」 넣기
- 사이클 19 작업(저자 표기, 공급사 코드), 사이클 17 공개 배포
- plan `docs/current/` 고치기(plan이 `/cycle-close`에서 함)

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 21`** 절에 **무엇이 달라졌는지와 이유**를 적습니다(사용자 발언은 그대로).

- **시작 상태**: 작업 폴더·브랜치·docker 프로젝트·포트, 시작 커밋, 기준 빌드 결과
- **0단계 API 시험 결과** (나오는 대로 바로 알림)
  - ISBN 서지: 키 사용 여부, 하루 한도, KDC·`TITLE_URL` 빈 값 비율, `TITLE_URL` 호스트·경로·키·`http` 여부, 여러 줄 비율
  - YouTube: 업로드 재생목록 ID 얻는 법, 영상 ID 꼴, 쓴 할당량, 2026-10-15 이후 새 영상
- **분야 제안**: `subject_fields.tsv` 내용, 첫 수집 때 확인 필요 파일에 들어간 새 책
- **서울대 두 권**의 후보 판과 보유량, 사용자가 고른 판
- **측정값**
  - 목록별 맞춘 수·못 맞춘 수(이동진 36/44, 서울대 87/100과 견줌, 사서 72/108 새 규칙 기준. 달라졌으면 원인)
  - export에 더해진 시간, `catalog_next` 맞추기 시간
  - `listPart` 크기
  - apply 바꿔 끼우기 대기 시간과 `replace` 넣기 시간
  - 반영 중 5xx 수, 10분 안에 화면에 나왔는지(R4-7)
- **바꾼 이름과 모양**: `CuratedListTransfer`·`ListPart`·검사 함수 나누기, `byIds` 결과 레코드, `preparedLookup`, `lendingKinds`, `lists-dir`, `listPart` 칸, 목록 파일 칸, 응답 칸, changeset id, 수집기 파일·의존성, `.env` 변수 이름
- **설계와 달라진 점**: CHECK 접두·꼴, 목록 넣기 실패 기록 자리, 운영 반영 순서(확인 필요 #15), 화면 확인에서 고른 안(A/C 그대로인지, A~D 비교를 했는지), PC 정렬을 맞춘 기준 사이트
- **알림**
  - **21이 main에 들어가면 바로**: `# 사이클 21` 절에 적고 사용자에게 알립니다. plan 19·dev 19 세션에도 전합니다(겹치는 파일, master 끝줄, 형식 번호 3, 10-17 규칙)
  - 10-17까지 못 들어갈 것 같으면 그 즉시 알립니다
- [확인 필요] 표 각 행의 결과, 새로 알게 된 제약, AC 확인표
