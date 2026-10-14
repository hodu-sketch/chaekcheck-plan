# 개발 인계서: 사이클 16 공지사항과 안내·약관 페이지를 DB로 (sitecontent)

- 기준 문서: plan `docs/cycles/16-notices-and-policies/design-delta.md` (설계 확정 2026-10-14, design-reviewer 검토, dev main(사이클 12·13·14 합친 뒤)과 맞춰 봄)
- ADR: 0098, 0099, 0100, 0101 (모두 Accepted, 2026-10-14)
- 승인: 이 인계서대로 dev에 넘김 [확정] (사용자 승인, 2026-10-14, `easy/2026-10-14-handoff-review.html` #1)
- 이 인계서는 plan `docs/cycles/16-notices-and-policies/handoff.md`에 둡니다. `docs/current/handoff.md`는 사이클 15 인계서이므로 고치지 않고, 알림 한 줄과 링크만 둡니다 [확정] (사이클 13·14와 같은 방식)

## 시작 조건

- **dev main에 사이클 12·13·14가 합쳐진 상태에서 시작합니다** [확정] (design-delta "모듈"·"데이터"는 이 상태를 기준으로 확인함). 브랜치 이름 `cycle-16-notices-and-policies` [안]
- **사이클 15(usagelog)와 동시에 개발합니다.** 사이클 14처럼 따로 작업 폴더(git worktree), docker compose 프로젝트 이름, 포트를 씁니다 [확정] (사용자 승인, 2026-10-14, 사이클 15 `easy/2026-10-14-handoff-review.html` #2)
  - 이름과 포트는 사이클 14 방식을 따라 dev가 정합니다 [안]. 예: 폴더 `../chaekcheck-dev-c16`, `docker compose -p chaekcheck-c16 …`, worktree `.env`(git 밖, 새로 만듦)에 `DB_PORT`·`TEST_DB_PORT`, 서버 포트, 웹 포트 + `API_PROXY_TARGET`
  - 이미 쓰는 번호와 겹치지 않게 합니다: 원래 프로젝트 5432·5433, 사이클 13 5442~5444, 사이클 14 5452·5453·8082·5176, dev `.claude/launch.json`의 `c14-backend-8083`·`c14-web-lan-5177`, 사이클 15가 정한 번호(15 `# 사이클 15` 절)
  - docker 명령은 늘 `-p <16 프로젝트>`로 합니다. 켜고 끄기 전에 `docker compose ls`로 확인합니다. **원래 프로젝트 `chaekcheck`와 사이클 15 프로젝트는 켜고 끄지 않습니다**
  - 새 DB는 비어 있는 상태에서 Liquibase로 만들어도 됩니다 [안]. 이 사이클의 화면에는 책 목록이 필요 없습니다. `/about`의 기준일 줄(`GET /api/v1/join-surveys/latest`)은 값이 없으면 줄이 빠집니다. 원래 DB를 복사할지는 dev가 정해 보고합니다
- **Liquibase 규칙** [확정] (design-delta "데이터", 사이클 15 인계서와 같은 규칙)
  - main에 합치는 순서대로 master 끝에 붙입니다
  - 나중에 합치는 사이클이 rebase해서 자기 include 줄을 맨 끝으로 옮깁니다
  - **이미 어떤 DB에서든 돈 changeset은 고치지 않습니다.** 작업 폴더마다 DB가 따로라서, 고치면 다른 작업 폴더 DB의 체크섬이 깨집니다(사이클 14 dev 기록). dev에 `PRE_DEPLOYMENT` 표시가 있어도 이 사이클에서는 다른 changeset을 고치지 않고 새 파일만 더합니다. 예외는 아래 "공개 전에 할 것"의 seed 바꾸기 하나뿐이고, 이 사이클 개발 중에는 하지 않습니다
- **사이클 15와 겹치는 곳** (합칠 때 나중 쪽이 rebase로 풂)
  - `db.changelog-master.yaml` 끝: 15는 `usagelog/001-usagelog-schema.yaml`을 붙이고, 16은 `sitecontent/001`·`sitecontent/002`·`auth/002`를 붙입니다
  - `ModularityTests.java` 의존 줄: 15는 `usagelog → auth`를 더하고, 16은 `:27` `assertThat(dependenciesOf("auth")).isEmpty()`를 `auth → sitecontent`로 바꿉니다. 두 줄을 함께 남깁니다
  - 그 밖에 plan이 읽어 보니 겹칠 수 있는 곳 [안]: `auth/package-info.java` Javadoc(15가 `LoginStatusReader`를 공개 타입으로 더함), `AuthEnabledSecurityTests.java`(15가 시험을 더하고, 16은 `:113-121`의 동의 값을 바꿈), `application.yml`(16은 `chaekcheck.auth.documents`를 지우고, 15는 `chaekcheck.usagelog`를 더함), `docs/plan-feedback.md` 끝
- **시작할 때 줄 번호를 다시 봅니다** (plan 읽기 2026-10-14, dev main)
  - master 맨 끝 `:92-95` `# cycle 14: librarian picks (ADR-0089)` + `picks/001-picks-schema.yaml`. 15가 먼저 합쳐졌으면 그 뒤에 붙입니다
  - `ModularityTests.java:27`, `application.yml:92-97`(`documents:`), `AuthPropertiesTests.java:45-46,61-62`, `SignupTests.java:42-43,53-54,90-91,148-149,162`, `AuthEnabledSecurityTests.java:113-121`, `AuthSchemaTests.java:40-41`, `AccountDeletionTests.java:93-94`, `Footer.tsx:20-31`, `main.tsx:45-60`, `deploy/nginx/chaekcheck-locations.conf:91`

## 요약

새 모듈 `sitecontent`(schema 같은 이름)를 만듭니다. 이 모듈은 공지(`notice`, `notice_version`)와 네 문서(`document_version`: `ABOUT`, `TERMS_OF_SERVICE`, `PRIVACY_POLICY`, `PRIVACY_COLLECTION`)의 모든 판을 DB에 둡니다.
- 판은 글마다 1부터 붙는 순번입니다. 고치지 않고 새로 넣습니다
- 지금 판 = 시행일이 오늘(Asia/Seoul) 이전인 판 중 순번이 가장 큰 것
- 로그인 없이 읽는 REST가 둘입니다: `GET /api/v1/notices`(목록·글), `GET /api/v1/documents/{documentKey}`. 쓰기는 운영 SQL(Claude)로만 합니다

`auth`에서 바뀌는 것:
- 가입 문서 버전을 서버 설정(`chaekcheck.auth.documents`) 대신 `sitecontent`의 Java 공개 API `SiteDocuments.currentVersion(...)`에서 받습니다
- 동의 기록에는 판 순번 글자(`"1"`)를 남깁니다. 테스트 계정 기록 `'2026-10-04'` → `'1'`, 형식 CHECK를 더합니다(`auth/002`)
- 새 의존 `auth → sitecontent` 하나

웹에서 바뀌는 것:
- 새 화면 S16 `/notices`, S17 `/notices/:noticeId`
- S8 `/terms`, S9 `/privacy`, S12 `/about`, S6 가입이 API 글을 `react-markdown@10`으로 그림(HTML은 그리지 않음)
- 제목 아래 날짜 고르기 칸, "이전 버전" 표시, 접힌 "바뀐 점 보기"
- 바닥글 링크 한 줄, "문의: 준비 중" 지움, `/privacy`의 `LoginOnly` 지움
- `legalText.ts`·`documentVersions.json`·`NOT_REVIEWED` 지움

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) **조용히 바꾸지 않습니다.** 먼저 사용자에게 알리고, 내용과 이유를 dev `docs/plan-feedback.md`의 **새 `# 사이클 16` 절**에 적습니다. 사용자 발언이면 그대로 옮깁니다
- `[안]`이 붙은 값은 dev가 코드에 맞춰 바꿀 수 있습니다. 바꾸면 `# 사이클 16` 절에 알리기만 합니다
  - 해당 예: `SiteDocuments`·`ConsentDocument` 이름(design-delta [안: 이름은 dev가 정해도 됨]), 안쪽 패키지·클래스, 제약·PK·색인 이름과 CHECK 식의 글자 모양(design-delta "데이터" 태그 읽는 법), changeset id, 웹 컴포넌트·파일 위치, 시험 클래스 이름, 운영 메모 경로
- **바꾸지 않는 것** [확정] (design-delta, 사용자 승인 2026-10-13·14)
  - 모듈 `sitecontent`, schema `sitecontent`, 표 셋과 칸·규칙(design-delta "데이터" 표)
  - `document_key` 값 넷: `ABOUT`, `TERMS_OF_SERVICE`, `PRIVACY_POLICY`, `PRIVACY_COLLECTION`. 주소의 key: `about`, `terms-of-service`, `privacy-policy`, `privacy-collection`
  - 경로 `GET /api/v1/notices`(`page`), `GET /api/v1/notices/{noticeId}`(`version`), `GET /api/v1/documents/{documentKey}`(`version`)
  - 오류 코드 400 `validation_error`(`errors[]`: `field`·`message`·`code`), 404 `notice_not_found`·`document_not_found`·`version_not_found`
  - 응답 칸 이름(design-delta 예시): `pinned`, `items`, `page`, `pageSize`, `totalCount`, `hasMore`, `id`, `title`, `postedOn`, `editedOn`, `version{number, effectiveOn, current, body, changeSummary, consentItems[{label, text}]}`, `versions[{number, effectiveOn, supersededOn}]`, `key`
  - 로그인 없음, 서버 캐시 없음, 쓰기 API 없음. 오늘 = `Asia/Seoul` 날짜
  - 의존 `auth → sitecontent` 하나, `sitecontent`는 어떤 모듈에도 의존하지 않음. 가입 버전 전달에 이벤트를 쓰지 않음
  - 동의 기록 = 판 순번 글자, CHECK `^[1-9][0-9]*$`(NULL 허용, `AGE_OVER_14`). 409 `document_version_mismatch` 동작 그대로
  - 이용약관 REST는 로그인 기능이 꺼져도 열어 두고, 웹 경로 `/terms`만 숨김. `/privacy`는 로그인 기능과 상관없이 늘 보임(ADR-0100)
  - changelog 경로 `db/changelog/sitecontent/001-sitecontent-schema.yaml`, `sitecontent/002-sitecontent-seed.yaml`, `auth/002-consent-version-number.yaml`
- 태그
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 확정된 것처럼 코드에 넣지 말고 `TODO(확인 필요)`로 둔 뒤 확인하고 보고합니다
- **새 의존성은 `react-markdown@10` 하나** [확정] (spec R1-2, 데이터 출처: https://github.com/remarkjs/react-markdown, 확인 2026-10-12). `rehype-raw` 같은 HTML 플러그인은 넣지 않습니다. 백엔드는 지금 있는 Spring·`JdbcClient`만 씁니다. 다른 라이브러리가 필요하면 먼저 보고합니다
- 단계마다 통과해야 다음 단계로 갑니다
  - `backend/`: `./gradlew build` (`ModularityTests`·`DocumentationTests` 포함)
  - 웹을 고친 단계는 `web/`: `npm test`, `npm run build`, `npm run lint`
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), 앞 사이클 인계서의 제약을 그대로 따릅니다. 아래에는 더하거나 바뀌는 것만 적습니다

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `docs/cycles/16-notices-and-policies/design-delta.md`: **기준 문서**
  - 구조 그림: 모듈, 공지·문서·가입·운영 흐름, 도메인, ER
  - 모듈 표, 데이터 표, API·응답 예시, 운영 SQL 요점, 확인 필요
  - 그림을 실제로 그린 페이지: `easy/design-delta-original.html`
- `spec.md`: R1~R8, 상태별 동작, AC-1~AC-13, 비목표
- `flow.md`: 바닥글, S16, S17, S12, S8·S9, 이전 버전 공통, S6
- `scope.md`
- `drafts/`: 승인된 글 다섯(`privacy-policy.md`, `privacy-collection.md`, `terms-of-service.md`, `about.md`, `notice-first.md`)과 운영 SQL 초안 `ops-sql.md`(시험 전)
- `privacy-inputs.md`: 처리방침에 넣은 다른 사이클 값(이번 개발에는 문구 출처로만 씀)
- `research.md` 1절: react-markdown 기본 동작(HTML 안 그림, 링크 스킴)
- `architect-proposal.md`는 결정 기록일 뿐입니다. 구현 기준은 design-delta입니다
- 결정 페이지: `easy/2026-10-13-flow-pc.html`(화면 모양), `easy/2026-10-14-close-review-decisions.html`(#1 쿠키 문구, #2 S6 글 못 불러옴 상태), `easy/2026-10-14-about-align-decisions.html`(서비스 안내 첫 판)
- ADR (`docs/adr/`): 0098, 0099, 0100, 0101

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0098 | 새 모듈·schema `sitecontent`, 표 `notice`·`notice_version`·`document_version`. 판 순번, 옛 판 안 지움, 지금 판 규칙. 로그인 없는 읽기 REST만, 쓰기는 SQL. 고정은 1쪽 맨 위만, 숨김은 DB에 남김. 제한된 마크다운(`react-markdown`, HTML 안 그림). 동의문 4항목은 `consent_items` jsonb 배열, 정확히 4개를 DB가 검사. `sitecontent/001`·`002` |
| 0099 | 가입 문서 버전의 원본을 `SiteDocuments.currentVersion`으로. 동의 기록 = 판 순번 글자, 테스트 계정 `'2026-10-04'` → `'1'` + 형식 CHECK(`auth/002`). `chaekcheck.auth.documents`·`documentVersions.json` 비교 시험 지움(사이클 05 제약 27 폐기). `auth → sitecontent`(AC-18 변경). 409 그대로. 다시 동의 칸 없음 |
| 0100 | `/privacy`와 바닥글 처리방침 링크는 로그인 기능과 상관없이 보임. `/terms`와 그 링크는 로그인 기능이 꺼지면 안 보임 |
| 0101 | 가벼운 변경은 공지 + 앞날 시행일, 중요한 변경은 다시 동의(화면은 backlog). 그 전에는 다시 동의가 필요한 변경을 넣지 않음. 운영 SQL에 그대로 적음 |

## 지켜야 할 제약

- **C1. 모듈 경계** [확정]
  - `sitecontent/package-info.java`: `@ApplicationModule(allowedDependencies = {})` [안: 빈 목록을 적을지는 dev 판단]. 어떤 모듈에도 의존하지 않습니다
  - 공개 API(모듈 루트)는 `SiteDocuments`, `ConsentDocument { TERMS_OF_SERVICE, PRIVACY_COLLECTION }` 둘뿐입니다 [안: 이름]. 표·쿼리·REST 부품은 `sitecontent/internal/...`에 둡니다
  - `auth`는 `SiteDocuments`만 부릅니다. `sitecontent`는 `auth`(그 설정 포함)를 모릅니다. 그래서 이용약관 REST는 로그인 기능과 상관없이 열립니다
  - 다른 schema와 FK·JOIN 없음. `auth`는 판 순번 값만 기억합니다
  - JPA 엔티티를 두지 않고 `JdbcClient`를 씁니다 [안] (사이클 14 `picks`와 같음)
- **C2. 글은 HTML로 그리지 않음** [확정] (spec R1-2, 사이클 05 C22)
  - 웹은 `react-markdown`의 기본 동작 그대로 씁니다: `rehype-raw` 없음, `urlTransform`은 기본값, `dangerouslySetInnerHTML` 없음
  - 그리는 요소는 제목·문단·목록·굵게·링크입니다(`allowedElements`로 좁힐지 [안]). 링크는 http·https·mailto 등만 남습니다(research.md 1절). `mailto:`는 살아야 합니다(AC-12)
- **C3. 지금 판과 오늘** [확정]
  - 오늘 = `Asia/Seoul` 날짜. 시험에서 날짜를 고정할 수 있게 `Clock`을 주입합니다 [안]
  - 지금 판 = `effective_on <= 오늘`인 판 중 `version_no` 최대
  - 앞날 판은 목록·`versions`·`?version=`·가입 API 어디에도 나오지 않습니다(`?version=`으로 부르면 404 `version_not_found`)
  - 서버는 글을 메모리에 들고 있지 않습니다. 넣은 글은 새로고침하면 바로 보입니다 (R8-2)
- **C4. 공지 규칙** [확정] (spec R4, design-delta API)
  - 목록에 나오는 공지: `hidden = false`이고 판 1의 `effective_on <= 오늘`인 것
  - 숨긴 공지, 판 1이 앞날인 공지, 없는 번호는 목록과 주소 모두 404 `notice_not_found`
  - 10개씩. 정렬은 게시일(판 1의 시행일) 최신순, 같으면 번호 큰 순
  - 고정 공지는 1쪽의 `pinned`에만 넣고, 10개 셈과 `totalCount`에서 뺍니다. 고정 공지끼리 순서는 일반 공지와 같게 합니다 [안]
  - 없는 쪽(`?page=99`)은 마지막 쪽으로 맞추고, 응답 `page`에 맞춘 쪽을 줍니다. 공지가 0개면 `page` 1, `items` 빈 목록, `hasMore` false [안]
  - 목록의 제목은 지금 판 제목입니다. 목록에는 고친 날이 없습니다(AC-13)
  - 글의 `postedOn` = 판 1 시행일. `editedOn` = 지금 판이 2 이상일 때 지금 판 시행일, 아니면 null [안: 옛 판을 볼 때도 같은 값]
- **C5. 오류 처리는 dev 방식** [확정] (design-delta "모듈" 오류 처리)
  - `sitecontent/internal/web/SitecontentErrors.java`: `@RestControllerAdvice(basePackageClasses = …)` + `@Order(Ordered.HIGHEST_PRECEDENCE)`. 예시는 `picks/internal/web/PicksErrors.java`
  - `page`·`version`이 정수가 아니거나 1보다 작으면 400 `validation_error` + `errors[]`. 루트 `ApiExceptionHandler`의 400 `bad_request`로 새지 않게 이 모듈 advice가 먼저 받습니다(형 변환 실패 포함)
  - 500은 공통 처리(`internal_error`) 그대로
- **C6. 서비스 안내의 기준일 줄** [확정] (spec R5-1, flow S12, AC-10)
  - 사이클 13의 "가입 조건은 ○○에 조사한 내용입니다." 줄은 DB 글에 넣지 않습니다. 화면이 지금처럼 `GET /api/v1/join-surveys/latest`로 붙이고, 위치는 **DB 글 바로 아래**입니다
  - 지금 dev `AboutPage.tsx:39`는 첫 문단 아래에 두지만, 글 전체 아래로 옮깁니다 [확정] (사용자 승인, 2026-10-14, `easy/2026-10-14-handoff-review.html` #3)
- **C7. 보이는 문구는 바꾸지 않음**. 화면 글자는 flow.md 그대로 씁니다: "공지사항", "아직 공지가 없어요", "글을 불러오지 못했어요" + "다시 시도", "찾을 수 없어요", "목록으로", "고정", "이전 버전", "바뀐 점 보기", "시행 YYYY-MM-DD", "약관 글을 불러오지 못했어요", "약관이 바뀌었어요. 다시 확인해 주세요"
- **C8. 노랑 바탕을 쓰지 않음** [확정] (flow 색 결정: "노랑은 이 테마에 안 맞아"). "고정" 표시, "이전 버전" 표시, "바뀐 점 보기"의 색은 dev 테마 안에서 정합니다

## 개발 시작 전 확인

### dev가 확인할 것
- [ ] 시작 커밋(main, 12·13·14 합친 뒤)과 작업 폴더·docker 프로젝트·포트를 `# 사이클 16` 절에 적음
- [ ] base package `com.chaekcheck`, 새 모듈 패키지 `com.chaekcheck.sitecontent` [확정] (dev `CLAUDE.md`)
- [ ] 위 "시작할 때 줄 번호" 목록이 그대로인지. 다르면 고친 위치를 보고함
- [ ] 사이클 15가 main에 먼저 합쳐졌는지, 그렇다면 master 끝과 `ModularityTests`·`auth/package-info.java`가 어떤 모양인지
- [ ] `react-markdown@10`이 dev의 React 19.3과 맞는지(설치 시험), 묶음 크기 차이 [확인 필요: dev 설치 시험] (design-delta 확인 필요 #2)

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 동시 개발용 작업 폴더·포트 (규칙은 위 시작 조건, 이름·번호는 dev가 정해 알림) | 시작 전 | 확인 |
| 화면 확인: 공지 목록·글, 약관·처리방침·서비스 안내의 날짜 고르기 칸·"이전 버전"·"바뀐 점 보기", 가입 화면 | 10단계 | 바꿀 점 |
| 실제 폰 확인 (Samsung Internet, `web-lan-5174`, 같은 Wi-Fi) | 10단계 | 확인 결과 |
| 공개일 정하기, 공개 전 값 채우기 (아래 "공개 전에 할 것") | 사이클 17이 `PRE_DEPLOYMENT`를 지우기 전 | 날짜·값 |

## 구현 단계

### 0단계: 작업 폴더와 DB (코드 변경 없음)

1. **작업 폴더**: main(12·13·14 합친 뒤)에서 worktree와 브랜치 `cycle-16-notices-and-policies` [안]를 만듭니다. 원래 폴더와 사이클 15 폴더의 파일·브랜치·커밋 안 한 변경은 건드리지 않습니다
2. **DB**: worktree `.env`에 포트를 적고 `docker compose -p <16 프로젝트> up -d db db-test`로 켭니다. 처음 켤 때 `docker volume ls`로 저장 공간이 16 프로젝트 쪽에 따로 생겼는지 봅니다
3. 아래 단계의 "로컬 `db`·`db-test`"는 모두 **이 worktree의 DB**를 뜻합니다. 원래 `db`(5432)에는 10단계 합친 뒤에만 붙습니다
- 위험: 낮음

### 1단계: `sitecontent` 뼈대와 표 (`sitecontent/001`) (의존: 0단계)

1. **모듈 선언** (`backend/src/main/java/com/chaekcheck/sitecontent/package-info.java`)
   - C1의 `@ApplicationModule`
   - Javadoc: 책임(공지와 네 문서의 모든 판, 로그인 없이 읽기), ADR-0098·0099, "판은 고치지 않고 새로 넣음", "쓰기는 운영 SQL"
   - 안쪽 패키지 [안]: `internal/document`, `internal/notice`, `internal/web`
2. **Liquibase** (`backend/src/main/resources/db/changelog/sitecontent/001-sitecontent-schema.yaml` [확정 경로])
   - master 맨 끝에 `# cycle 16: notices and documents (ADR-0098, ADR-0099)` + include [안: 주석]
   - 표·CHECK는 `sql` changeset입니다 [확정] (design-delta). changeset id `sitecontent-001-*` [안]
   - `CREATE SCHEMA sitecontent`
   - `notice` [확정]
     - `id bigint GENERATED BY DEFAULT AS IDENTITY` PK `notice_pkey`
     - `pinned boolean NOT NULL DEFAULT false`, `hidden boolean NOT NULL DEFAULT false`
     - `created_at timestamptz NOT NULL DEFAULT now()`
   - `notice_version` [확정]
     - `notice_id bigint NOT NULL`, FK `notice_version_notice_id_fkey` → `sitecontent.notice(id)`
     - `version_no integer NOT NULL` CHECK `version_no >= 1`
     - `effective_on date NOT NULL`
     - `title text NOT NULL` CHECK `btrim(title) <> ''`, `body text NOT NULL` CHECK `btrim(body) <> ''`
     - `created_at timestamptz NOT NULL DEFAULT now()`
     - PK `notice_version_pkey (notice_id, version_no)`. 다른 색인은 두지 않습니다 [확정]
   - `document_version` [확정]
     - `document_key text NOT NULL` CHECK `document_key IN ('ABOUT','TERMS_OF_SERVICE','PRIVACY_POLICY','PRIVACY_COLLECTION')`
     - `version_no integer NOT NULL` CHECK `>= 1`, `effective_on date NOT NULL`
     - `body text NOT NULL` CHECK `btrim(body) <> ''`
     - `change_summary text` NULL, CHECK `document_key <> 'ABOUT' OR change_summary IS NULL`
     - `consent_items jsonb` NULL
       - CHECK `(document_key = 'PRIVACY_COLLECTION') = (consent_items IS NOT NULL)`
       - CHECK `consent_items IS NULL OR (jsonb_typeof(consent_items) = 'array' AND jsonb_array_length(consent_items) = 4)`
     - `created_at timestamptz NOT NULL DEFAULT now()`
     - PK `document_version_pkey (document_key, version_no)`
   - `updated_at` 없음, 그래서 트리거도 없음 [확정]. 제약 이름은 design-delta 표 그대로 쓰거나 `postgres-patterns` 관례로 [안]
3. **기존 시험 고침**
   - `ModularityTests`: 새 시험 하나 [안: 이름]. `sitecontent`는 의존 없음(`isEmpty()`), `auth` 밖의 모듈은 `sitecontent`에 기대지 않음. `auth` 줄(`:27`)은 4단계에서 바꿉니다
   - `ApplicationModules.of(...).verify()` 통과
   - `DocumentationTests`: `module-sitecontent.puml` 있음 줄 [안]
- 테스트: `SitecontentSchemaTests` [안] (`db-test`, `@Transactional`)
  - 세 표가 있음
  - 위반: `version_no` 0, 빈 제목·빈 본문(공백만), 모르는 `document_key`, `ABOUT`에 `change_summary`, `PRIVACY_COLLECTION`에 `consent_items` 없음, 다른 문서에 `consent_items` 있음, 3개·5개 배열, 배열이 아닌 객체, 같은 `(document_key, version_no)` 두 번, 없는 `notice_id`
- 위험: 낮음

### 2단계: 개발 DB 첫 판 (`sitecontent/002` seed) (의존: 1단계)

1. **파일** (`db/changelog/sitecontent/002-sitecontent-seed.yaml` [확정 경로], master에서 `001` 바로 뒤)
   - `sql` + 본문 `$$ … $$` + `splitStatements: false` [안: dev 적용 시험] (design-delta 확인 필요 #4: 본문 안의 세미콜론·`$$`)
   - 공지는 넣지 않습니다 [확정]
   - 네 문서 모두 `version_no` 1, `effective_on` `2026-10-04` [확정] (지금 동의 기록과 이어짐), `change_summary` NULL [안]
   - 이 seed는 `db-test`에도 들어갑니다. 시험은 이 판 1을 전제로 씁니다
2. **본문** (지금 웹 코드의 글을 마크다운으로 옮김) [확정] (spec R2-3, design-delta "데이터")
   - `TERMS_OF_SERVICE`: `legalText.ts`의 `TERMS_OF_SERVICE_BODY` 두 문단
   - `PRIVACY_COLLECTION`
     - `consent_items`: `legalText.ts`의 `COLLECTION_NOTICE` 4줄(`label`·`text`). 라벨 글자는 지금 웹 그대로 둘지, drafts 라벨(목적·항목·보유 기간·거부할 권리)로 맞출지 [안: 지금 웹 그대로, 보고]
     - `body`: `PRIVACY_COLLECTION_BODY` 두 문단
   - `PRIVACY_POLICY`: `PRIVACY_POLICY_SECTIONS` 8절을 `## 제목` + 문단으로
   - 동의문·처리방침의 로그인 수단은 **카카오만** [확정] (사용자, 2026-10-13): "네이버 또는 카카오의 회원 식별 번호" → "카카오 회원 식별 번호"
   - 자리 글 표시 [확정] (spec R8-4): 개발 DB의 판 1은 본문 첫 줄 "검토 전 자리 글입니다"로만 알 수 있어야 합니다. 이용약관·동의문 본문은 이미 "이 문서는 검토 전 자리 글입니다…"로 시작합니다. 처리방침 본문 맨 앞에도 같은 한 줄을 둡니다 [안: 문장]
   - `ABOUT`: **`drafts/about.md` 본문(주석 아래 네 문단)** [확정] (design-delta "데이터": 서비스 안내 첫 판은 drafts/about.md, dev main `AboutPage.tsx`와 맞춘 판, 사용자 승인 2026-10-14)
     - 지금 `AboutPage.tsx` 문장과 다른 점: 첫 문단의 "수량은 … 보여 줘요"가 빠지고, "연락처는 정해지면 이곳에 안내할게요" 두 문장이 연락처 한 줄 `문의·로고·표지 내림 요청: <chaekcheck9104@gmail.com>`로 바뀜
     - 이메일은 `<…>` 꼴이라 react-markdown이 메일 쓰기 링크로 그립니다(AC-12)
     - 사이클 14가 `AboutPage.tsx:41-43`에 둔 `TODO(확인 필요): 배포 전 국립중앙도서관 표지 이용 조건 확인`은 코드에서 글이 빠져도 잃지 않게 `AboutPage.tsx`나 운영 메모에 옮겨 둡니다 [안]
- 테스트: `SitecontentSchemaTests`에 더함. 네 key 모두 판 1, 시행일 2026-10-04, `PRIVACY_COLLECTION`의 `consent_items` 4개, `ABOUT` 본문에 `chaekcheck9104@gmail.com`
- 위험: 중간 (YAML 안 SQL 따옴표·세미콜론)

### 3단계: 읽기 — `SiteDocuments`와 REST 둘 (의존: 2단계)

1. **Java 공개 API** (`sitecontent/SiteDocuments.java`, `sitecontent/ConsentDocument.java` [안: 이름])
   - `int currentVersion(ConsentDocument document)` [확정 모양]: C3의 지금 판 순번
   - 지금 판이 없으면 `IllegalStateException` [안]. seed가 있으므로 정상이면 일어나지 않습니다
   - 구현 `sitecontent/internal/document/JdbcSiteDocuments.java` [안]
2. **문서 REST** (`sitecontent/internal/web/DocumentController.java` [안])
   - `GET /api/v1/documents/{documentKey}?version=n` [확정]
   - key 넷(`about`, `terms-of-service`, `privacy-policy`, `privacy-collection`) ↔ `document_key`. 모르는 key는 404 `document_not_found`
   - `version`이 없으면 지금 판. 없는 판이거나 앞날 판이면 404 `version_not_found`
   - 응답(design-delta 예시 그대로)
     - `key`
     - `version{number, effectiveOn, current, body, changeSummary, consentItems}`. `consentItems`는 동의문만, 나머지는 null
     - `versions[]`: 시행 중이거나 지난 판만, 순번 큰 순 [안]. `supersededOn` = 그다음 판의 `effectiveOn`, 지금 판은 null
   - 날짜는 `YYYY-MM-DD`
3. **공지 REST** (`sitecontent/internal/web/NoticeController.java` [안])
   - `GET /api/v1/notices?page=n` [확정]: 기본 1, C4 규칙. 질의 둘(일반 공지 수 + 쪽 맞춤, 그 쪽 공지의 지금 판 제목·판 1 게시일 + 1쪽이면 고정 공지) [안: design-delta 흐름 그림]
   - `GET /api/v1/notices/{noticeId}?version=n` [확정]
     - 먼저 공지를 봅니다(없음·숨김·판 1이 앞날 → 404 `notice_not_found`). 그다음 판을 봅니다(없음·앞날 → 404 `version_not_found`)
     - 응답: `id`, `title`(보이는 판의 제목 [안]), `postedOn`, `editedOn`(C4), `version{number, effectiveOn, current, body}`, `versions[]`(문서와 같은 규칙)
   - `noticeId`가 정수가 아니면 400 `validation_error` [안] (404가 낫다고 보면 보고)
4. **오류 처리** (`sitecontent/internal/web/SitecontentErrors.java` [안: 이름]): C5. `errors[]` 예 `{ "field": "page", "message": "must be greater than or equal to 1", "code": "Min" }`. 정수가 아닌 값의 `code` [안: 예 `typeMismatch`, 보고]
5. **보안**: `SecurityConfiguration`은 `PROTECTED` 밖을 `permitAll`로 두므로 고칠 것이 없는지만 봅니다
- 테스트
  - `SiteDocumentsTests` [안] (`db-test`, `Clock` 고정)
    - seed만 → 1
    - 오늘 시행 판 2 → 2 (AC-3 준비)
    - 내일 시행 판 2 → 1 (AC-4)
    - 같은 날 판 2·3 → 3
  - `DocumentApiTests` [안] (MockMvc, `db-test`, `@Transactional`)
    - 네 key 200
    - `ABOUT` 판 2를 넣으면 지금 판 2, `versions` 두 줄과 `supersededOn` (AC-2)
    - `?version=1` → 판 1, `current` false (AC-2)
    - 앞날 판은 `versions`에 없고 `?version=`으로 부르면 404 `version_not_found` (AC-4, AC-9)
    - `?version=99` → 404 `version_not_found` (AC-9)
    - `?version=0`·`abc` → 400 `validation_error` + `errors[]`
    - `/api/v1/documents/nope` → 404 `document_not_found`
    - 처리방침 판 2의 `changeSummary`가 응답에 있음 (AC-11)
    - 동의문 `consentItems` 4개
  - `NoticeApiTests` [안]
    - 0개 → 빈 목록
    - 새 공지 하나 → 목록 첫 줄(고정 다음) (AC-1)
    - 고정은 1쪽 `pinned`에만, 10개 셈·`totalCount`에서 빠짐
    - 일반 23개 + `?page=99` → `page` 3
    - 같은 날 둘은 번호 큰 순
    - 판 1이 내일인 공지는 목록·주소 모두 404 (AC-4)
    - `hidden=true` → 목록에서 빠지고 주소 404 `notice_not_found` (AC-5)
    - 판 2를 넣으면 목록 제목은 판 2, 목록 줄에 고친 날 칸 없음, 글에 `editedOn` (AC-13)
    - `?version=1` 옛 글, `?version=9` 404 `version_not_found` (AC-9)
    - `page=0`·`abc` → 400
  - `AuthEnabledSecurityTests`(`:85-96` 근처): 로그인 켠 설정에서 쿠키 없이 `GET /api/v1/notices`, `/api/v1/documents/terms-of-service`, `/api/v1/documents/privacy-policy` → 200
  - `AuthDisabledTests`(또는 로그인 끈 기본 문맥): 같은 세 주소 200 (이용약관 REST는 로그인이 꺼져도 열림)
- 위험: 중간 (판·날짜 경계)

### 4단계: `auth` — 가입 버전을 `sitecontent`에서, 동의 기록 판 순번 (의존: 3단계)

1. **Liquibase** (`db/changelog/auth/002-consent-version-number.yaml` [확정 경로], master에서 `sitecontent/002` 뒤 [안])
   - `UPDATE auth.account_consent SET document_version = '1' WHERE document_version = '2026-10-04'` [확정 값]
   - 그다음 CHECK `account_consent_document_version_format_check (document_version IS NULL OR document_version ~ '^[1-9][0-9]*$')` [확정]
   - 다른 값의 줄이 있으면 CHECK를 더할 때 실패합니다. 실패하면 값을 고치지 말고 그 줄을 보고합니다
   - `auth/001`은 고치지 않습니다
2. **가입 서비스** (`auth/internal/signup/SignupService.java`)
   - `documents()`가 `AuthProperties.Documents` 대신 `SiteDocuments.currentVersion(TERMS_OF_SERVICE / PRIVACY_COLLECTION)`을 글자로(`String.valueOf`) 돌려줍니다
   - `check(...)`는 지금처럼 POST 때 다시 묻고, 다르면 `DocumentVersionMismatchException` → 409 (`SignupController.java:86-87` 그대로)
   - Javadoc의 "chaekcheck.auth.documents are the source (C27)" → "sitecontent의 지금 판(ADR-0099)"
   - `GET /api/v1/auth/signup` 응답 모양은 그대로이고, 값만 `"1"` 꼴이 됩니다
3. **설정 지움**
   - `auth/internal/AuthProperties.java`: `Documents` record(`:154-161`), 생성자 기본값(`:42`), 칸(`:33`)
   - `application.yml:92-97` `documents:` 블록. `application-test.yml`에 같은 키가 있으면 같이 지웁니다
4. **모듈 문서** (`auth/package-info.java`)
   - "This module depends on no other module (AC-18)" → "depends only on `sitecontent`'s public API `SiteDocuments` for the sign-up document versions (ADR-0099)" [안: 문장]
   - 사이클 15가 먼저 합쳐졌으면 15가 더한 문장과 함께 둡니다
   - `allowedDependencies = { "sitecontent" }`를 적을지는 dev 판단 [안]
5. **시험 고침**
   - `ModularityTests.java:27`: `assertThat(dependenciesOf("auth")).isEmpty()` → `containsExactly("sitecontent")` [확정 방향]. `:21-22` Javadoc 한 줄 더함
   - `DocumentVersionsMatchWebTests.java`: **지움** [확정] (제약 27 폐기)
   - `AuthPropertiesTests.java:45-46,61-62`: `chaekcheck.auth.documents.*` 값 지움
   - `SignupTests.java`
     - `:42-43` 속성 지움. 버전은 DB 판 기준(seed 판 1 → `"1"`)
     - `VALID`(`:53-54`), `:90-91`, `:148-149`의 `"2026-10-01"`·`"2026-10-02"` → `"1"`
     - `:162` 불일치 시험은 `"1"` → `"9"` 같은 다른 순번으로 [안]
     - 이 클래스는 `@Transactional`이라 시험 안에서 넣은 판은 되돌려집니다
   - `AuthEnabledSecurityTests.java:113-121`, `AuthSchemaTests.java:40-41`(그리고 `:82`·`:92` 근처), `AccountDeletionTests.java:93-94`: 넣는 동의 값 `'2026-10-04'` → `'1'`. `/me` 응답 기대값 `"version":"2026-10-04"` → `"1"`. 새 CHECK 때문에 고치지 않으면 실패합니다(plan 읽기에서 찾음)
   - `AuthSchemaTests`
     - 형식 시험을 더함: `'2026-10-04'`·`'0'`·`'01'` 위반, `'1'`·`'12'` 통과, `AGE_OVER_14`의 NULL 통과
     - `@ApplicationModuleTest`는 기본 모드라 `sitecontent` 빈이 없을 수 있습니다. 문맥이 안 뜨면 `BootstrapMode.DIRECT_DEPENDENCIES`(예: `library/LibraryCatalogTests.java:27`) [안] (design-delta "모듈")
   - `SignupConcurrencyTests.java:68-69`는 `signups.documents()`를 쓰므로 그대로 통과하는지만 봅니다
- 테스트 (`SignupTests`에 더함)
  - `GET /api/v1/auth/signup` → `"1"`, `"1"`
  - **AC-3**: 시험 안에서 `TERMS_OF_SERVICE` 판 2(시행일 오늘)를 넣음 → GET이 `"2"` → `"2"`로 POST 201 → `auth.account_consent`에 `TERMS_OF_SERVICE:2`
  - **AC-4**: 판 2를 내일로 넣음 → GET이 그대로 `"1"`, `"2"`로 POST하면 409
  - 화면을 연 뒤 새 판이 시행됨: GET `"1"` → 판 2(오늘) 넣음 → `"1"`로 POST → 409 `document_version_mismatch`
- 위험: 중간 (가입 회귀, 시험 여러 곳)

### 5단계: 운영 SQL 시험 (의존: 2단계, 4단계와 나란히 가능)

`drafts/ops-sql.md`는 아직 실제 DB에서 돌려 보지 않았습니다 [확인 필요: 실제 DB에서 돌려 보기] (plan PC에 PostgreSQL 없음, 2026-10-14). 표가 생긴 **worktree 개발 DB `db`**에서 1~6절의 모든 문장을 한 번씩 돌리고 결과를 보고합니다. `db-test`에서는 하지 않습니다(시험 데이터와 섞임).

1. 할 일 (절마다)
   - 1절 새 공지(고정 아님, 고정): 돌려준 번호, `GET /api/v1/notices`에 보이는지
   - 2절 공지 고치기
     - 정상 → 1줄
     - 없는 번호 → 0줄
     - 마지막 판보다 이른 날짜 → 0줄
   - 3절 숨기기·다시 보이기·고정·풀기: 각 1줄, API 결과
   - 4절 문서 새 판 + 알리는 공지
     - 정상 → 1줄 + 공지 1줄
     - 이른 날짜 → 0줄
     - `ABOUT`에 `change_summary` NULL로
   - 5절 동의문 새 판
     - 정상 → 1줄
     - 4항목이 아닌 배열 → CHECK 위반
   - 6절 확인 질의 셋: 결과가 API와 같은지
2. 함께 볼 것 [안]
   - 문장을 한 번에 실행하면 `COMMIT;`까지 가서 "0줄이면 ROLLBACK"을 할 틈이 없습니다. 운영 순서는 `BEGIN;` + 넣기만 먼저 돌리고, 줄 수를 본 뒤 `COMMIT;`/`ROLLBACK;`을 따로 보내는 것입니다. psql에서 그렇게 되는지 확인합니다
   - 앞날 날짜로 넣은 공지·판이 그날 전까지 API에 안 나오는지(AC-4, `Clock`을 못 바꾸면 내일 날짜로 넣고 확인만)
   - `notice.id` identity 시퀀스 이름(예 `sitecontent.notice_id_seq`)을 적습니다. 운영 DB 계정 권한에 씁니다
3. 시험한 SQL을 dev 운영 메모(10단계 6)에 옮깁니다. 고친 문장과 이유는 `# 사이클 16` 절에 적습니다. plan의 `drafts/ops-sql.md`는 고치지 않습니다
4. 시험으로 넣은 줄은 끝나면 지웁니다 [안]. 화면 확인(10단계)에 쓸 공지 몇 개는 남겨도 되고, 남긴 것은 적습니다
- 위험: 낮음

### 6단계: 웹 공통 — 마크다운, API, 날짜 고르기 칸 (의존: 3단계, 가짜 응답으로 먼저 가능)

1. **설치**: `web/`에서 `npm install react-markdown@10` [확정 판]. 맞는지와 `npm run build` 묶음 크기 차이를 적습니다 [확인 필요: dev 설치 시험]
2. **마크다운 부품** (`web/src/components/Markdown.tsx` [안]): C2 그대로. 링크 모양·제목 크기는 지금 `LegalPage.module.css`(`.body`, `.heading`)에 맞춥니다
3. **API·타입** (`web/src/api/client.ts`, `web/src/api/types.ts` [안: 위치])
   - `fetchNotices(page, signal)`, `fetchNotice(noticeId, version, signal)`, `fetchDocument(key, version, signal)`
   - 타입은 design-delta 응답 칸 이름 그대로입니다(`NoticeList`, `Notice`, `SiteDocument`, `DocumentVersionInfo` [안: 이름])
   - 404의 `code`(`notice_not_found`/`document_not_found`/`version_not_found`)를 `ApiError`로 구분합니다
4. **날짜 고르기 칸** (`web/src/components/VersionPicker.tsx` [안])
   - 자리: 제목 아래 [확정]. 칸에는 지금 보는 판의 날짜가 보입니다
   - 항목 문구 [확정] (사용자 승인, 2026-10-13)
     - 지난 판: "A ~ (B-1일) 적용". B = `supersededOn`
     - 같은 날 바뀐 판: "A 적용 (같은 날 바뀜)"
     - 지금 판: "A ~ 지금"
   - 고르면 같은 화면이 `?version=순번`으로 바뀝니다. 지금 판을 고르면 `version` 없는 주소로 [안]
   - `versions`가 하나면 칸을 숨깁니다 [확정]
   - 구현은 기본 `<select>`로 할지 다른 고르기로 할지 dev가 정합니다. 폰에서 어떤 고르기 화면으로 열리는지는 프로토타입으로 확인합니다 [확인 필요: dev 구현 때 프로토타입] (design-delta 확인 필요 #6)
5. **"이전 버전" 표시**: `version.current`가 false면 제목 옆에 작은 "이전 버전" [확정]. 큰 띠 없음
6. **"바뀐 점 보기"** (`web/src/components/ChangeSummary.tsx` [안]): `changeSummary`가 있을 때만 제목 아래 접힌 한 줄 "바뀐 점 보기 ▾". 누르면 그 자리에서 펼침(`aria-expanded`), 본문은 마크다운 [확정]
7. **공통 상태** [확정] (spec 상태별 동작)
   - 로딩: 글 자리에 회색 줄
   - 오류·지연: "글을 불러오지 못했어요" + 다시 시도
   - `version_not_found`: "찾을 수 없어요" + 지금 판 링크
- 테스트 (Vitest)
  - `Markdown.test.tsx` [안] (AC-6)
    - `<script>alert(1)</script>`와 `<img onerror=…>`가 요소로 생기지 않음
    - `[x](javascript:alert(1))`의 `href`가 `javascript:`가 아님
    - `<chaekcheck9104@gmail.com>` → `href="mailto:chaekcheck9104@gmail.com"` (AC-12)
    - 제목·목록·굵게가 그려짐
  - `VersionPicker.test.tsx` [안]: 세 문구, 하나면 숨김, 고르면 주소 `?version=`
  - `ChangeSummary.test.tsx` [안]: 접힘 → 펼침 (AC-11)
- 위험: 중간 (새 의존성)

### 7단계: 웹 화면 — S16·S17, S8·S9, S12, 바닥글, 경로 (의존: 6단계)

1. **경로** (`web/src/main.tsx`)
   - 더함: `/notices` → S16, `/notices/:noticeId` → S17 [확정 주소]. 로그인 없이 열림
   - `/privacy`의 `<LoginOnly>`를 지움 [확정] (ADR-0100, `:53-60`)
   - `/terms`는 `<LoginOnly>` 그대로 [확정]
2. **S16 공지 목록** (`web/src/features/notices/NoticesPage.tsx` [안])
   - 제목 "공지사항"
   - 줄 = 제목 + 게시일. 고정은 맨 위에 "고정" 표시(C8). 목록에 "고침"은 없음 [확정]
   - 10개씩 숫자 페이지 `?page=n` [확정]
     - PC·태블릿: 1~10
     - 폰(640px 이하): ‹ ›와 숫자 5개
   - 서버가 맞춘 `page`가 주소와 다르면 주소를 그 쪽으로 바꿉니다(`replace`) [안]
   - 배치 [확정]
     - PC·태블릿: 가운데 한 열(S12 흰 카드 폭), 제목 왼쪽·날짜 오른쪽
     - 폰: 제목 한두 줄, 그 아래 날짜
   - 상태: 로딩(회색 줄) / "아직 공지가 없어요" / 오류 + 다시 시도
   - 분류·N 표시·조회수·검색 없음 [확정]
3. **S17 공지 글** (`web/src/features/notices/NoticePage.tsx` [안])
   - 제목, 게시일, 고친 공지는 "2026-11-03 · 고침 2026-11-04" 꼴 [확정], 날짜 고르기 칸(고친 공지만, 판이 하나면 숨김), 본문(마크다운), 맨 아래 "목록으로"
   - "목록으로"는 보던 쪽으로 돌아갑니다 [확정]. 방법(라우터 state, 주소 값 등)은 dev가 정합니다 [안]
   - 이전글·다음글 없음 [확정]
   - PC·태블릿·폰 모두 한 열 흰 카드, 폰은 옆 여백만 좁게 [확정]
   - 상태
     - 로딩
     - `notice_not_found`: "찾을 수 없어요" + 공지 목록 링크
     - `version_not_found`: "찾을 수 없어요" + 지금 판 링크
     - 오류
4. **S8·S9** (`web/src/features/auth/LegalPage.tsx`)
   - `terms` → `fetchDocument('terms-of-service', version)`, `privacy` → `fetchDocument('privacy-policy', version)` [확정 key]. 지금처럼 S9가 동의문 버전을 보이는 일은 없어집니다
   - 제목 아래 "시행 YYYY-MM-DD"(지금의 "버전 X · 시행일 X"를 대신함), 같은 줄에 날짜 고르기 칸, "바뀐 점 보기", 본문 [확정]
   - `NOT_REVIEWED` 표시를 지움 [확정] (AC-8)
   - 머리말에서 로그인 버튼·머리 링크를 숨기는 것은 지금 그대로 [확정] (`AppLayout.tsx`)
   - Javadoc의 C27·`documentVersions.json` 설명을 고칩니다
5. **S12** (`web/src/features/about/AboutPage.tsx`)
   - 제목 "서비스 안내", 그 아래 게시일 하나(지금 판 `effectiveOn`)와 날짜 고르기 칸 [확정]
   - DB 본문(마크다운). 그 **바로 아래** 기준일 줄은 지금 `fetchLatestJoinSurvey` + `surveyMonthLabel` 그대로 (C6)
   - 하드코딩 문단(`:35-50`)은 지웁니다
   - 상태: 로딩 / 오류(글이 없을 일은 없음)
6. **바닥글** (`web/src/components/Footer.tsx`)
   - 링크 한 줄 "공지사항 · 서비스 안내 · 이용약관 · 개인정보 처리방침" [확정]. 맨 위 수량 안내 문장은 그대로
   - 이용약관은 로그인 기능이 켜져 있을 때만(지금 `showLegal` 조건), 처리방침은 늘 보입니다 [확정]
   - "문의: 준비 중"(`:30-31`)과 그 TODO를 지웁니다 [확정]
   - 배치는 지금 그대로입니다(PC 왼쪽 안내·오른쪽 링크, 폰은 쌓고 줄바꿈)
   - 머리말에는 공지사항 링크를 두지 않습니다 [확정]
7. **지울 파일** [확정]: `web/src/features/auth/legalText.ts`(이 안의 `NOT_REVIEWED` 포함), `web/src/features/auth/documentVersions.json`. 쓰지 않게 된 CSS(`.draft` 등)도 정리합니다. 남은 참조는 `rg "legalText|documentVersions|NOT_REVIEWED|검토 전 문구" web/src`로 0건인지 봅니다
- 테스트 (Vitest, 가짜 응답)
  - `NoticesPage.test.tsx` [안]
    - 고정 다음에 새 공지 (AC-1)
    - 숨긴 공지는 응답에 없으니 안 보임 (AC-5, 서버 쪽은 `NoticeApiTests`)
    - 줄에 고친 날 없음 (AC-13)
    - 빈 상태·오류·로딩
    - 쪽 번호, 폰 폭의 ‹ ›
  - `NoticePage.test.tsx` [안]
    - "고침" 날짜 (AC-13)
    - 판 하나면 고르기 칸 없음
    - 옛 판에서 "이전 버전" 표시
    - 두 가지 404 문구와 링크 (AC-5, AC-9)
    - "목록으로"
  - `LegalPage.test.tsx` (고침)
    - `documentVersions` 대신 가짜 응답
    - "시행 2026-10-04"
    - "검토 전 문구" 없음 (AC-8)
    - "바뀐 점 보기" (AC-11)
    - `?version=` 옛 판 (AC-2와 같은 방식), `version_not_found` (AC-9)
    - 로그인 꺼짐에서 `/privacy`가 열리고 `/terms`는 안 그려짐 (AC-7)
  - Footer 시험(지금 `LegalPage.test.tsx:83-96`)
    - 켜짐: 링크 넷
    - 꺼짐: 이용약관만 빠짐
    - "문의: 준비 중" 없음 (AC-7)
  - `AboutPage.test.tsx`
    - DB 본문 다음에 기준일 줄 (AC-10)
    - `mailto:` 링크 (AC-12)
    - 날짜 고르기 칸과 옛 판 "이전 버전" (AC-2)
    - 기준일 응답 실패 → 줄만 빠짐
  - `AuthScreens.test.tsx`: `documentVersions` 사용을 가짜 응답으로 바꿈
- 위험: 중간 (여러 화면)

### 8단계: S6 가입 — 보인 글 = 동의할 판 (의존: 4·6단계)

1. **불러오기** (`web/src/features/auth/SignupPage.tsx`) [확정] (design-delta 가입 흐름, flow S6)
   - `getSignup()`의 `documents[].version`을 받습니다
   - 그 판 번호로 `fetchDocument('terms-of-service', v)`, `fetchDocument('privacy-collection', v)`를 부릅니다
   - 동의 표(목적·항목·보유 기간·거부할 권리 자리)는 `consentItems`의 `label`·`text`로 그립니다
   - "전문 보기"는 이용약관 `body`, 동의문 `body`를 마크다운으로 그립니다
   - 화면 배치는 그대로입니다
2. **글을 못 불러옴** [확정] (사용자 승인, 2026-10-14, `close-review-decisions.html` #2)
   - 둘 중 하나라도 실패하면 체크 칸(모두 동의 포함)과 가입 버튼을 잠급니다
   - "약관 글을 불러오지 못했어요" + "다시 시도"(같은 판을 다시 읽음)를 보입니다
   - 첫 화면으로 돌려보내지 않습니다. "취소"는 그대로 쓸 수 있습니다 [안]
3. **409**: 지금처럼 "약관이 바뀌었어요. 다시 확인해 주세요", 체크를 비움, `getSignup()` 다시. **새 판 번호로 두 글을 다시 읽습니다**
4. `NOT_REVIEWED` 표시(`:129`)와 `legalText` import를 지웁니다 [확정]
- 테스트 (`SignupPage.test.tsx`)
  - 받은 판 번호로 두 문서를 부름(주소에 `version=1`)
  - 표 4줄이 `consentItems`에서 나옴
  - "검토 전 문구" 없음 (AC-8)
  - 하나 실패 → 체크 칸·가입 잠김 + 문구 → 다시 시도 성공 → 풀림
  - 409 → 새 판으로 다시 읽음
- 위험: 중간

### 9단계: nginx 화면 주소 (의존: 7단계) — 이 사이클에서 함 [확정] (사용자 승인, 2026-10-14, `easy/2026-10-14-handoff-review.html` #2)

- 사실: `deploy/nginx/chaekcheck-locations.conf:91`의 화면 주소 정규식 `^/(search|signup|terms|privacy|about|my-libraries|picks|auth/complete|books/[^/]+)$`에 `notices`가 없습니다(2026-10-14 dev main). 배포 뒤 `/notices`나 `/notices/3`을 바로 열거나 새로고침하면 `location /`의 `try_files $uri =404`로 404가 납니다(`:113-117`)
- 할 일: 정규식에 `notices|notices/[0-9]+`를 더하고, 주석과 `deploy/nginx/README.md` 표(`:27`, `:65` 근처)에 한 줄 씁니다. `local-test.conf`로 `/notices`, `/notices/1`, `/notices?page=2` 직접 열기 200 `text/html`
- 결과를 `# 사이클 16` 절에 적습니다. 사이클 17 배포 설정과 같은 파일이므로 합칠 때 겹치면 rebase로 풂
- 위험: 낮음

### 10단계: 마무리 — 합치기, 원래 DB, 화면, 폰, 운영 메모 (의존: 1~9단계)

1. **합치기**: main을 다시 받아 rebase합니다. 15가 먼저 들어갔으면:
   - master 끝: 15 줄 뒤에 16 줄(`sitecontent/001`, `002`, `auth/002`)을 옮깁니다
   - `ModularityTests`: `usagelog` 줄과 `auth → sitecontent` 줄을 함께 둡니다
   - `auth/package-info.java`·`AuthEnabledSecurityTests`·`application.yml`·`plan-feedback.md` 끝도 같이 풉니다
   - 16이 먼저면 15가 같은 일을 합니다
   - 합친 뒤 `./gradlew build` 전체 통과
2. **원래 DB 확인** (합친 뒤, 원래 `db` 5432)
   - `bootRun`으로 새 changeset 셋이 돌았는지 `databasechangelog`로 봅니다
   - 테스트 계정 동의 값: `SELECT consent_type, document_version FROM auth.account_consent;` → `TERMS_OF_SERVICE`·`PRIVACY_COLLECTION`이 `'1'`
   - 로그인 켬으로 `/api/v1/me`의 동의 판이 `"1"`인지 봅니다
3. **Playwright** (데스크톱 1280 먼저, 그다음 768·375. 끝나면 브라우저 창 크기를 되돌립니다)
   - 운영 SQL(5단계)로 공지를 넣고 새로고침 → S16 맨 위(고정 다음) (AC-1). 숨기기 → 목록에서 빠지고 주소 "찾을 수 없어요" (AC-5)
   - 공지 고치기 → 목록에 고친 날 없음, 글에 "고침" (AC-13)
   - `ABOUT` 새 판 → `/about` 새 글, 날짜 고르기 칸에 옛 판 적용 기간, 고르면 옛 글 + "이전 버전" (AC-2), 기준일 줄이 글 아래 (AC-10), 이메일을 누르면 `mailto:` (AC-12)
   - 처리방침 판 2(`change_summary` 있음) → "바뀐 점 보기" 펼침 (AC-11)
   - `?version=99` → "찾을 수 없어요" (AC-9)
   - `<script>`·`javascript:` 링크를 담은 공지 → 실행 없음, 콘솔 오류 없음 (AC-6)
   - 바닥글: 로그인 켬(`backend`)과 끔(`backend-no-login`)에서 링크 넷/셋, "문의: 준비 중" 없음 (AC-7), `/privacy`는 둘 다 열림
   - 가입 흐름(가짜 또는 실제 카카오, 지금 dev 방식): 표·전문, 글 못 불러옴 잠금(API 막기로 흉내), 409 (AC-3·AC-4는 서버 시험이 근거)
   - 시험용으로 넣은 판·공지는 끝나면 지웁니다. `ABOUT`·약관 판 2가 남아 있으면 가입 버전이 바뀝니다
4. **사용자 화면 확인**: 위 화면을 사용자에게 보이고 바꿀 점을 받습니다
5. **사용자 실제 폰 확인**: 아래 완료 기준의 폰 줄
6. **dev 운영 메모** (`docs/maintenance/` 아래 [안: 파일 이름])
   - 5단계에서 시험한 운영 SQL(새 공지, 고치기, 숨기기·고정, 문서 새 판 + 알리는 공지, 동의문 새 판, 확인 질의)
   - "지키는 것"(`drafts/ops-sql.md`): 사용자 확인 뒤에 넣음, 한 트랜잭션, 판은 고치지 않음, 날짜 순서, 한국 날짜, `$$`, 다시 동의가 필요한 변경은 넣지 않음(ADR-0101), 약관·동의문·처리방침을 바꾸면 공지도 함께(R7-1)
   - 표 읽는 법, 지금 판 규칙, `notice.id` 시퀀스 이름
- 위험: 중간

## 테스트

- 단위
  - 웹: 마크다운 안전(AC-6), 날짜 고르기 칸 문구, 바뀐 점 펼침
  - 서버: 판 고르기 규칙(지금 판·앞날·같은 날)
- 통합(`db-test`)
  - 새 시험: `SitecontentSchemaTests`, `SiteDocumentsTests`, `DocumentApiTests`, `NoticeApiTests`
  - 고친 시험: `SignupTests`, `AuthSchemaTests`, `AuthEnabledSecurityTests`, `AuthDisabledTests`, `AuthPropertiesTests`, `AccountDeletionTests`, `ModularityTests`(`ApplicationModules.of(...).verify()`, `auth → sitecontent`, `sitecontent` 의존 없음), `DocumentationTests`, 기존 시험 전부
  - 지운 시험: `DocumentVersionsMatchWebTests`
  - db-test 연결 한도: 새 `@SpringBootTest` 클래스는 기존 문맥을 함께 쓰거나 `@DirtiesContext`(사이클 10 회고)
- 운영 SQL: 5단계 개발 DB 실행 기록
- 화면: Vitest, Playwright(데스크톱 먼저), 사용자 실제 폰

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 공지를 넣고 새로고침 → 배포 없이 목록 맨 위(고정 다음) | `NoticeApiTests` + `NoticesPage.test` + Playwright(운영 SQL 1절) | 3, 5, 7, 10 |
| AC-2 서비스 안내 새 판 → `/about` 새 글, 날짜 고르기 칸에 옛 판 적용 기간, 고르면 옛 글 + "이전 버전" | `DocumentApiTests` + `VersionPicker.test`·`AboutPage.test` + Playwright | 3, 6, 7, 10 |
| AC-3 이용약관 새 판(시행일 오늘) 뒤 가입 → `account_consent`에 새 판 | `SignupTests`(API 호출 시험) + `SiteDocumentsTests` | 3, 4 |
| AC-4 앞날 판은 그날 전까지 화면·가입 API에 안 나옴 | `SiteDocumentsTests` + `DocumentApiTests` + `NoticeApiTests` + `SignupTests` | 3, 4 |
| AC-5 숨긴 공지 → 목록에서 빠지고 주소 "찾을 수 없어요" | `NoticeApiTests` + `NoticePage.test` + Playwright(운영 SQL 3절) | 3, 5, 7, 10 |
| AC-6 `<script>`·`javascript:` 링크가 실행되지 않음 | `Markdown.test` + Playwright | 6, 10 |
| AC-7 바닥글 링크 넷, "문의: 준비 중" 없음, 로그인 꺼짐이면 이용약관만 빠짐 | Footer 시험 + `LegalPage.test` + Playwright(켬·끔) | 7, 10 |
| AC-8 이용약관·처리방침(·가입)에 "검토 전 문구" 없음 | `LegalPage.test` + `SignupPage.test` + `rg` 0건 | 7, 8 |
| AC-9 없는 판 주소 → "찾을 수 없어요" | `DocumentApiTests`·`NoticeApiTests`(404 `version_not_found`) + `NoticePage.test`·`LegalPage.test` + Playwright | 3, 7, 10 |
| AC-10 서비스 안내 DB 글 아래 기준일 줄 | `AboutPage.test` + Playwright | 7, 10 |
| AC-11 "바뀐 점"이 있는 판은 "바뀐 점 보기"로 펼침 | `DocumentApiTests` + `ChangeSummary.test`·`LegalPage.test` + Playwright | 3, 6, 7, 10 |
| AC-12 서비스 안내에 `chaekcheck9104@gmail.com`, 누르면 메일 쓰기 | seed 확인(`SitecontentSchemaTests`) + `Markdown.test`·`AboutPage.test` + Playwright | 2, 6, 7, 10 |
| AC-13 목록에 고친 날 없음, 고친 공지 글에서 보임 | `NoticeApiTests` + `NoticesPage.test`·`NoticePage.test` + Playwright | 3, 7, 10 |

- 상태별 동작(spec): 로딩·오류 = S16·S17·S12·S8·S9 각 시험, 공지 없음 = `NoticesPage.test`, S6 글 못 불러옴 = `SignupPage.test`

## 완료 기준

- [ ] spec의 수용 기준 AC-1~AC-13을 위 표의 방법으로 모두 확인하고, AC 확인표를 `# 사이클 16` 절에 적음
- [ ] `./gradlew build` 통과(`ModularityTests`의 `ApplicationModules.of(...).verify()`, `auth → sitecontent`만, `sitecontent` 의존 없음, `DocumentationTests` 포함)
- [ ] `npm test`, `npm run build`, `npm run lint` 통과, Playwright 데스크톱 → 태블릿 → 폰
- [ ] 저장소에 `legalText.ts`, `documentVersions.json`, `NOT_REVIEWED`, `DocumentVersionsMatchWebTests`, `chaekcheck.auth.documents`가 없음
- [ ] 원래 `db`의 테스트 계정 동의 값이 `'1'`이고 형식 CHECK가 있음
- [ ] 운영 SQL 1~6절 실행 결과(5단계)와 고친 문장을 `# 사이클 16` 절에, 시험한 SQL을 dev 운영 메모에 적음
- [ ] 새 화면(S16·S17)과 바뀐 화면(S8·S9·S12·S6, 바닥글)이 있으므로, 사용자가 자기 폰(Samsung Internet)에서 dev 웹 서버 `web-lan-5174`(`.claude/launch.json`, 같은 Wi-Fi)로 직접 확인한 뒤 사이클을 닫음. Chrome 폰 흉내로 갈음하지 않음(사용자 결정, 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-design-addendum-decisions.html` #3)
  - 확인할 것: 공지 목록 줄(제목 한두 줄 + 날짜)과 ‹ › 페이지, 공지 글, **날짜 고르기 칸이 폰에서 어떻게 열리는지**, "이전 버전" 표시, "바뀐 점 보기", 바닥글 줄바꿈, 서비스 안내 이메일을 누르면 메일 앱, 가입 화면 표·전문
- [ ] [확인 필요] 결과와 설계와 달라진 점을 `# 사이클 16` 절에 적음

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 막는 단계 |
|---|---|---|
| `react-markdown@10`과 dev의 React 판, 묶음 크기 (design-delta #2) | dev 설치 시험 | 6 |
| seed 본문의 세미콜론·`$$` 처리 (design-delta #4) | dev 적용 시험 | 2 |
| 사이클 15와 병합: master 끝줄, `ModularityTests` 의존 줄 (design-delta #5) | 규칙은 위 시작 조건. 병합 때 확인 | 10 |
| 날짜 고르기 칸이 폰에서 어떤 고르기 화면으로 열리는지 (design-delta #6) | dev 구현 때 프로토타입 + 사용자 실제 폰 | 6, 10 |
| 운영 SQL 초안이 실제로 도는지 (`drafts/ops-sql.md`) | 개발 DB에서 실행 (5단계) | 없음 (보고) |
| 운영 첫 판의 공개 전 값: AWS 계약 법인, Cloudflare 연락처·보유 기간·쿠키 여부, 공개일 (design-delta #7) | 사용자에게 질문(공개일), 사이클 17 배포 때 계정·계약서(나머지) | 공개 전 (이 사이클 개발은 막지 않음) |

## 공개 전에 할 것 (이 사이클 개발 밖, 순서를 놓치지 않게)

- **공개일 정하기** [확인 필요: 사용자에게 질문]. 공개일 = 모르는 사람에게도 공개하는 날이고, 첫 배포일이 아닙니다 [확정] (사용자, 2026-10-13)
- **seed를 검토한 글로 바꾸기** [확정] (design-delta "운영 첫 판", 사용자 승인·제안 2026-10-13)
  - 언제: **사이클 17이 `db/changelog/PRE_DEPLOYMENT`를 지우기 전**. 이미 돈 `sitecontent/002`를 고치는 일이라 표시가 있는 동안에만 할 수 있습니다
  - 할 일
    - `sitecontent/002`의 네 문서를 `drafts/terms-of-service.md`·`privacy-collection.md`·`privacy-policy.md`·`about.md`의 승인된 본문으로 바꿉니다. 시행일·게시일 = 공개일, `{{공개일}}`을 채웁니다. `[확인 필요]` 값을 채운 뒤에 합니다
    - 개발 DB 초기화: 모든 작업 폴더의 `db`·`db-test`에서 모듈 schema와 Liquibase 표를 지우고 다시 적용합니다(dev `CLAUDE.md`의 PRE_DEPLOYMENT 방법)
    - 테스트 계정은 다시 가입합니다
  - 이것은 별도 작업으로, 사용자가 시킬 때 합니다
- **첫 공지** `drafts/notice-first.md`("책첵을 시작했어요", 판 1, 고정 아님): 공개일에 운영 SQL 1절로 넣습니다 [확정] (scope 포함 1)
- **사이클 17에 전할 것** [확정] (design-delta "인계서에 넣을 운영 예시 SQL")
  - 17이 정한 "`sitecontent` schema 쓰기만 있는 DB 계정"에는 `sitecontent` 표 셋의 SELECT·INSERT·UPDATE와 `notice.id` identity 시퀀스 USAGE가 필요합니다(시퀀스 이름은 5단계 결과)
  - seed 바꾸기는 17이 `PRE_DEPLOYMENT`를 지우기 전에 해야 합니다
  - nginx `/notices` 줄은 16 9단계에서 더함(17 배포 설정과 같은 파일)

## 이번에 하지 않는 것

- 운영자 화면(브라우저에서 공지·약관 쓰기, 관리자 권한) — backlog
- 다시 동의 화면과 "다시 동의 필요" 칸 — backlog (ADR-0101, R7-3)
- 새 공지 알림(N 표시, 첫 화면 공지 띠·팝업, 메일·푸시) — backlog
- 쿠키 허용/거부 창(쿠키 배너) — backlog
- 앱 전체의 없는 주소(`*` 경로) 화면 — backlog "첫 배포 전 작은 일"
- 공지 검색·분류·조회수·댓글·첨부, 버전 자동 비교, 다른 언어 — spec 비목표
- 운영 DB 첫 판 넣기, seed를 검토한 글로 바꾸기, 첫 공지 게시 — 위 "공개 전에 할 것"
- 처리방침에서 AWS 위탁 빼기(서버를 옮길 때 운영 SQL 4절로)
- 사이클 15의 기록 코드, 사이클 17 배포 설정

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 16`** 절에 **무엇이 달라졌는지와 이유**를 적습니다(사용자 발언은 그대로).

- 시작 상태: 시작 커밋, 작업 폴더·docker 프로젝트·포트, master 맨 끝 include, 15와 합친 순서와 rebase로 옮긴 줄
- 정한 이름: `SiteDocuments`·`ConsentDocument`, 안쪽 패키지·클래스, changeset id·제약 이름, 웹 컴포넌트·파일 위치, 시험 클래스 이름, 운영 메모 경로
- seed: `$$`·`splitStatements: false`가 그대로 됐는지, 동의문 라벨을 어떻게 했는지, 처리방침 첫 줄 문장
- API: 정수 아닌 값의 `code`, `noticeId`가 정수 아닐 때 400/404, 공지 0개일 때 응답, 고정 공지 순서, `editedOn`·`title`을 옛 판에서 어떻게 했는지
- `auth`: `AuthSchemaTests`에 `DIRECT_DEPENDENCIES`가 필요했는지, 고친 시험 목록, `auth/002`가 원래 `db`에서 바꾼 줄 수
- 웹: `react-markdown@10` 설치 결과·묶음 크기, `allowedElements`를 썼는지, 날짜 고르기 칸 구현과 폰에서 열리는 모양, "목록으로" 보던 쪽 방법, 지금 판을 고를 때 주소
- 운영 SQL 5단계 결과(절마다 줄 수·오류, `BEGIN`/`COMMIT` 나눠 보내기, 시퀀스 이름), 고친 문장
- 9단계 nginx `/notices` 결과
- 사용자 화면 확인·실제 폰 확인 결과
- [확인 필요] 표 각 행의 결과, 설계와 달라진 점, 새로 알게 된 제약, AC 확인표
