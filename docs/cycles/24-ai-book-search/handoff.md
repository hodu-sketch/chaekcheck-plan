# 개발 인계서: 사이클 24 AI 책 찾기 (첫 화면 "AI" 탭 + 대화 화면 `/ai-search`, Haiku 5.5 실시간)

- 승인: 사용자 "승인" (2026-10-24, 인계서 확인 페이지 #1, https://claude.ai/artifact/GCQh8FYZNSmRWyFT1J4xha). dev는 클라우드 세션으로 진행할 예정이라 사용자가 시작 글을 직접 전달함 → [to-dev-start.md](to-dev-start.md)

## 요약

첫 화면 검색창에 탭 두 개 "AI"·"직접"을 둡니다. 처음 열면 AI 탭이 열려 있습니다. AI 탭에 문장을 쓰면 대화 화면 S30 `/ai-search`가 열리고, 서버는 Claude Haiku 5.5를 두 번 부릅니다. 1차는 질문을 낱말로 바꾸고, 2차는 후보 가운데 책을 고르고 글을 씁니다. 고른 책은 우리 DB의 추천도서 목록 책 가운데 내 계획 도서관에 있는 책 0~8권이고, 질문에 맞춘 글과 함께 조금씩 흘려 보냅니다. 새 모듈은 `aisearch` 하나입니다. 질문 글은 우리 서버 어디에도 남기지 않습니다. 기능은 기본으로 꺼 두고, 운영에서 키를 넣은 뒤 켭니다.

## 참고 문서

- plan `docs/cycles/24-ai-book-search/scope.md`, `spec.md`(R1~R13, AC-1~19), `flow.md`(S1 탭, S30), `design-delta.md`
  - **기준은 `design-delta.md`입니다.** "검토 뒤 덧붙임"과 "확인 필요" 절까지 포함합니다. `architect-proposal.md`는 결정 기록일 뿐입니다. 그 안의 이름 `search_line`, `SearchLineTransfer`, `search-lines` 모드는 **무효**이고, `search_book`, `AiSearchBookTexts`, `book-texts`가 맞습니다.
- ADR(모두 Accepted, 2026-10-24)
  - ADR-0150: `aisearch` 모듈, 두 번 호출, `LlmClient` 하나
  - ADR-0151: `book-texts` 넣기 명령, DB 낱말 맞추기
  - ADR-0152: 질문을 저장하지 않음, IP 횟수는 메모리, 비용은 DB
  - ADR-0153: 번호를 먼저 확인하고 흘려 보냄, 제목 줄
- plan `docs/settings-index.md` 10절: 이 사이클의 설정값 전부
- plan `docs/research/ai-recommend/llm-test-set.md`: 질문 20개, 2차 지시문 초안(3절), 채점표(4절)
- plan `docs/cycles/16-notices-and-policies/privacy-inputs.md` 8절, `drafts/privacy-policy.md` §2, `drafts/ops-sql.md` §4: Cloudflare를 처리방침에 적은 방식과 처리방침 새 판을 넣는 SQL
- plan `docs/cycles/17-first-deploy/design-delta.md`: Parameter Store `/chaekcheck/prod/` → `deploy/prod/bin/up.sh` → env 파일 → compose
- plan `docs/cycles/24-ai-book-search/to-cycle23-batch-proposal.md`: 23과 PC 배치를 합치자는 제안. 사용자가 아직 결정하지 않았습니다.

## 사이클 23과 나란히 만들 때 지킬 것 [확정]

사용자가 "(나) 23과 나란히"를 골랐습니다(2026-10-24, 범위 결정 #4).

- 사이클 23(「나에게 맞는 책」)은 다른 plan 브랜치(`claude/server-status-library-crawl-test-uv7s8b`)에 있고 아직 main에 없습니다.
- **24는 23의 꼬리표와 탭 추천 글 없이 동작해야 합니다.** 23의 결과는 나중에 낱말 맞추기 칸과 Haiku 입력에 더합니다. 이번에는 `ListedBook`에 그 칸을 만들지 않습니다.
- 겹치는 곳에서 지킬 규칙

| 곳 | 규칙 |
|---|---|
| `picks` | **새 파일만** 만듭니다(`ListedBooks`와 그 구현). 기존 파일과 `PicksCache`는 고치지 않습니다. 23이 `PicksCache`를 바꾸면 합칠 때 `ListedBooks` 구현을 다시 확인합니다. |
| `usagelog` Liquibase | 파일 번호는 **두 브랜치를 합칠 때** 다음 번호로 정합니다. changeSet id는 이름 `usagelog-ai-search-event`로 둡니다(번호에 기대지 않음). |
| 반영 파일 형식 번호 | 건드리지 않습니다. `book-texts`는 따로 도는 모드입니다. |
| 번호 | 흐름 61~63(처음 55~57로 적었으나 23·26이 55~60을 먼저 써서 main에 합칠 때 바꿈, 2026-10-28), 화면 S30, ADR 0150~0153은 24 것입니다. 23은 ADR 0147~0149를 씁니다. |
| 화면 | 첫 화면(S1)은 24만, 추천도서·「나에게 맞는 책」 화면은 23만 고칩니다. |

## 개발 시작 전 확인

- [ ] **0단계 보고**(아래)를 dev `docs/plan-feedback.md`의 새 `# 사이클 24` 절에 적고, 설계와 어긋나는 것이 있으면 사용자에게 먼저 알립니다.
- [ ] Haiku 시험용·dev용 Anthropic API 키를 어디에 둘지 [확인 필요: 사용자에게 질문] (`llm-test-set.md` 5절)
- [ ] 1차·2차 `max_tokens` [확인 필요: 1단계 프로토타입]
- [ ] `anthropic-version` 헤더 값, base URL, 스트림 이벤트에서 `usage`가 오는 자리 [확인 필요: 공식 문서 https://platform.claude.com/docs 확인, 확인 날짜를 적음]
- [x] **몇 번째 질문(`turn_no`)**: 서버는 `history`를 최대 5개만 받으므로, **요청 본문에 `turnNo`(1~20)를 더해 웹이 보냄** [확정] (사용자 선택 "(가) 화면이 숫자를 보냄", 2026-10-24, 인계서 확인 #2). 서버는 1~20 밖이면 400 `validation_error`
- [ ] 서버 전체에서 동시에 도는 AI 찾기 상한과 스레드 모델 [확인 필요: dev 코드 읽기 → 사용자에게 질문]. 한 요청이 최대 약 21초 걸립니다. 값은 사용자가 정하기 전까지 넣지 않습니다.
- [ ] 예시 질문 칩 3개의 문구 [안: dev가 제안 → 사용자 확인]. 후보는 `llm-test-set.md`의 1·3·7번입니다.
- [ ] 처리방침 Anthropic 줄의 보유 기간 [확인 필요: Anthropic 상업 API 데이터 보관 기간, 공식 문서]
- [ ] Anthropic Console 사용 한도를 바깥 울타리로 둘지 [확인 필요: 공식 문서 확인 → 사용자에게 질문]
- [ ] 추천도서 목록 표지의 이용 조건 [확인 필요]. 사이클 21 인계서 #17에서 넘어온 공개 배포 전 확인입니다.
- `<base-package>`는 dev 코드에 이미 정해져 있습니다. 이 세션에서는 볼 수 없어 아래 경로에 자리 표시로 남깁니다. 지금 쓰는 base package를 그대로 씁니다.

## 구현 단계

경로 약어
- `B` = `backend/src/main/java/<base-package>/`
- `CL` = `backend/src/main/resources/db/changelog/`
- `W` = `web/src/`

`[안]` 이름(클래스, 메서드, 부품, 저장 키)은 dev가 바꿀 수 있습니다. 바꾸면 `# 사이클 24` 절에 알리기만 하면 됩니다. `[확정]` 값과 문구는 바꾸기 전에 사용자에게 먼저 묻습니다.

### 0단계: dev 쪽에서 읽고 대조하기 (코드 변경 없음)

이 plan 세션은 dev 폴더(Windows 경로)를 열지 못했습니다. 그래서 설계는 plan 문서에 적힌 dev 관례에만 맞춰져 있습니다(design-delta 머리말).

1. **dev `CLAUDE.md`와 스킬을 읽고 설계와 대조합니다.** 스킬은 `.claude/skills/spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`입니다.
   - 할 일: 모듈 공개 API를 두는 자리, `allowedDependencies`, 표·색인·CHECK 이름 규칙, ProblemDetail 코드, SSE 관례가 design-delta와 맞는지 봅니다.
   - 의존: 없음 / 위험: 낮음
2. **지금 코드를 읽고, 아래 확인 항목마다 "맞음 / 다름(어떻게) / 없음"을 적습니다.**

| # | 확인 항목 (design-delta "확인 필요" + 덧붙임) | 볼 곳 |
|---|---|---|
| 1 | `PicksCache`의 모양(책마다 `bookId`·`libraryIds`·`ShownTitle`·표지 주소, 10분마다 다시 읽음) | `B/picks/...` |
| 2 | 넣기 명령(`collection-import` 프로필)에서 `ListedBooks.loadFromDb()`가 서버 캐시와 같은 책·같은 제목을 줄 수 있는지 | `picks` 캐시를 채우는 코드 |
| 3 | 지금 있는 SSE 컨트롤러 관례(`/api/v1/ebook-searches/stream` 등): 스트림을 열기 전 오류 처리, `produces` 없음, 스레드·executor·시간 제한 | 해당 컨트롤러 |
| 4 | 웹 스트림 읽기 함수(`fetch` + `ReadableStream`)를 POST 본문에도 다시 쓸 수 있는지 | `W/...` 스트림 읽기 함수 |
| 5 | CSRF: `POST /api/v1/usage-events`가 로그인 기능이 켜졌을 때 어떻게 처리되는지 | 보안 설정 |
| 6 | 실제 사용자 IP. Cloudflare 터널 → nginx `real_ip_header CF-Connecting-IP` → 앱의 `X-Real-IP`로 이어지는지, 지금 코드가 IP를 읽는 방법. 23 브랜치 ADR-0140 규칙이 dev에 이미 있는지 | nginx 템플릿, 앱의 IP 읽는 곳 |
| 7 | nginx: `deploy/nginx/` 템플릿과 `deploy/prod/nginx/prod.conf`의 스트림 경로 버퍼링·gzip 설정, `proxy_read_timeout` 값(약 21초보다 길어야 함), 접속 기록 `log_format`에 본문이 없는지 | `deploy/...` |
| 8 | `usagelog` 정리(보관) 규칙과 `usagelog.enabled`, `UsageLog`의 모양, `UsageRequest` | `B/usagelog/...` |
| 9 | 웹이 "AI 기능 꺼짐"을 알 수 있는 길(지금 있는 설정 API나 빌드 값). 없으면 dev가 안을 내고 보고 | 웹·서버 설정 |
| 10 | `LibraryCatalog.planSearch`(이름 [안])의 모양과, `/api/v1/books`의 계획 값 칸(`residenceRegionIds`, `workRegionIds`, `libraryIds`, `scope`, `visit`) | `B/library/...` |
| 11 | pg_bigm 확장이 어느 스키마에 있는지, `gin_bigm_ops`를 다른 스키마(`aisearch`)에서 쓸 수 있는지 | `catalog` changelog |
| 12 | 외부 HTTP 시험 방식(가짜 서버를 무엇으로 띄우는지), JDK `HttpClient`를 쓰는 기존 예(`picks`의 `NlkTransport`) | 시험 코드 |
| 13 | 추천목록 AI 요약 배치(ADR-0142)를 PC에서 어떻게 돌렸는지(스크립트 자리, 키) | dev 저장소 |
| 14 | `collection` 넣기 모드 구조(`chaekcheck.collection.import.mode`), 새 모드를 더하는 자리 | `B/collection/...` |
| 15 | 추천도서 목록 책 수, 그 가운데 우리 책과 맞춰진 수, PC 수집 DB에 소개 원문(`intro_raw`)이 있는 수 (spec 확인 필요 #4·#5) | dev DB, PC 수집 DB |

   - 이유: 설계가 dev 관례와 어긋난 채로 코드를 쓰면, 23과 합칠 때나 리뷰할 때 다시 고쳐야 합니다.
   - 의존: 1 / 위험: 낮음
- 완료: `# 사이클 24` 절에 위 표를 채웁니다. "다름"이 있으면 1단계 전에 사용자에게 알립니다.

### 1단계: 프로토타입 (본 구현 전, Haiku 5.5 실제 호출)

1. **질문 20개 시험 도구** (빌드·CI 밖. 자리는 dev가 정함. 예: `backend/src/test/...`의 수동 실행 태그 시험이나 dev `tools/` 스크립트)
   - 할 일
     - `llm-test-set.md`의 질문 20개로 **1차와 2차 지시문·json_schema**를 Haiku 5.5(`claude-haiku-5-5` [확정])에 실제로 보냅니다.
     - 1차 스키마 [안]: `{notBook: boolean, titleLike: boolean, title: string, refersToShown: boolean, keywords: string[] maxItems 8}`, 모두 required. 1차 system 지시문은 문서에 없습니다. dev가 이 스키마를 바탕으로 초안을 쓰고 글 전체를 보고합니다 [안].
     - 2차 스키마 [안]: `{head: string, picks: [{no: integer, text: string}] maxItems 8}`, 칸 모두 required.
     - 2차 지시문은 `llm-test-set.md` 3절을 바탕으로 두 가지를 바꿉니다. 후보 줄은 `번호. 제목: … / 저자: … / 한 줄: …`로 쓰고(꼬리표·소개 없음, R10), 맨 앞에 머리말 `head`를 쓰라고 더합니다.
     - 후보는 2단계 전이라 한 줄이 없을 수 있습니다. 그때는 제목·저자만으로 돌립니다. 2단계 뒤 한 줄을 넣고 다시 한 번 돌립니다.
     - 1차 질문 몇 개에는 앞 대화 예시를 붙여 `refersToShown`도 봅니다("이 중에 소설만" 같은 것).
     - 제목만 넣은 경우(예: "채식주의자")도 넣어 `titleLike`를 봅니다.
   - 잴 것
     - 1차·2차 걸린 시간(첫 바이트, 끝)
     - 입력·출력 토큰과 질문 하나의 비용(가격 $0.10/$0.50 per 1M [확정])
     - **thinking을 끄거나 effort를 낮춰야 1차가 5초 안에 드는지.** Haiku 5.5는 기본이 adaptive thinking이고 effort는 `medium`입니다 [확정: models overview, 2026-10-24].
     - **스트리밍할 때 칸 차례**(`head` → `picks[i].no` → `picks[i].text`)가 지켜지는지
     - `maxItems` 8을 지키는지
     - `anthropic-version` 값과 base URL, 스트림 끝의 `usage`가 어느 이벤트로 오는지
     - JSON을 모두 읽을 수 있는지, 후보 밖 번호 수
   - 이유: 시간 제한(5초/15초), 비용 상한, `max_tokens`가 모두 이 값에 달려 있습니다. settings-index 10절의 [확인 필요] 줄도 이 값으로 채웁니다.
   - 의존: 0단계 / 위험: 중간 (thinking을 끌 수 없거나 5초를 넘으면 시간 제한을 다시 정해야 함 → plan에 알림)
- 완료: 질문마다 한 줄씩 기록을 `# 사이클 24` 절에 적습니다. 칸은 채점표 4절의 자동 칸과 시간·토큰입니다. **본 구현에 들어가기 전에 plan에 값을 알립니다.**

### 2단계: 찾기용 한 줄 PC 배치 (R10, 사용자 PC에서)

1. **PC Haiku 배치로 찾기용 한 줄 만들기** (PC 도구 자리는 0단계 #13과 같은 방식)
   - 할 일
     - 사용자 PC의 수집 DB에서 추천도서 목록 책마다 제목·저자·출판사와 전자도서관 소개 원문(`intro_raw`)을 읽어 Haiku로 한 줄을 만듭니다.
     - 한 줄에 담을 것: 무엇을 다루는지, 분위기, 읽는 사람, 길이·짜임. 최대 300자 [확정].
     - 원문이 없으면 서지만으로 만들고, 모르면 쓰지 않습니다 [확정: R10-3].
     - **원문은 PC 밖으로 나가지 않습니다.**
   - 출력 TSV: 머리줄 `kind\tbook_id\tsource\tmade_on\ttext`, UTF-8. `kind=search_line`, `source`는 `intro` 또는 `bibliographic`. 줄 안에 탭·줄바꿈이 없어야 합니다 [안].
   - 배치 지시문 글 전체와 비용·걸린 시간을 보고합니다.
   - 사이클 23과 하나의 배치로 합치자는 제안이 열려 있습니다(꼬리표와 한 줄을 한 번에 만들기, `to-cycle23-batch-proposal.md`). **사용자가 아직 결정하지 않았으므로 합치는 일은 만들지 않습니다.** 파일의 `kind` 칸만 지켜 두면 됩니다.
   - 의존: 0단계(#13, #15) / 위험: 중간 (원문이 있는 책 수가 적으면 낱말 맞추기 품질이 떨어짐 → 수를 보고)
- 완료: TSV 파일, 줄 수, `intro`/`bibliographic` 수, 쓰지 않은 책 수를 보고합니다. 파일은 4단계에서 넣습니다.

### 3단계: `picks`의 `ListedBooks` (새 파일만)

1. **`ListedBooks` 공개 API** (파일: `B/picks/ListedBooks.java`, 구현 `B/picks/internal/...` [안: 자리는 picks 관례])
   - 할 일
     - `current()`는 `PicksCache` 사본을 줍니다(DB 호출 없음). `loadFromDb()`는 캐시 없이 DB에서 바로 읽습니다(넣기 명령용).
     - 모양 [안]: `Snapshot(builtAt, books)`, `ListedBook(bookId, title /* ShownTitle */, author, coverUrl, libraryIds, listKeys)`
     - `bookId`가 없는 줄은 뺍니다. 여러 목록에 같은 책이 있으면 한 줄로 합칩니다.
   - 이유: `aisearch`가 `picks` 안을 직접 보지 않게 합니다. 23과 겹치는 곳을 새 파일로만 줄입니다.
   - 의존: 0단계 / 위험: 낮음 (23이 `PicksCache`를 바꾸면 합칠 때 다시 확인)
- 시험
  - `current()`와 `loadFromDb()`가 같은 책 수, 같은 `bookId`·`title`을 주는지(시험 데이터로)
  - `bookId` 없는 줄이 빠지는지, 같은 책이 한 줄로 합쳐지는지
  - `ModularityTests`(`ApplicationModules.of(...).verify()`) 통과
- 되돌리기: 파일 두 개를 지웁니다. 다른 곳에 영향이 없습니다.

### 4단계: `aisearch` 모듈 뼈대 + 표 + `book-texts` 넣기 명령

1. **모듈과 Liquibase** (파일: `B/aisearch/package-info.java`, `CL/aisearch/001-aisearch-schema.yaml` [안], master에 include)
   - 할 일
     - `@ApplicationModule(allowedDependencies = {"picks", "library", "usagelog"})` [안]
     - 스키마 `aisearch`와 표 둘을 만듭니다. 칸·CHECK·색인은 design-delta "데이터" 표 그대로입니다.
       - `search_book`: `book_id` PK CHECK `>= 1`, 다른 모듈로 가는 FK 없음 / `title` NOT NULL / `author` / `line` CHECK 1~300자 / `line_source` IN ('intro','bibliographic') / `line_made_on` / `search_text` NOT NULL / `imported_at`
       - 색인 `search_book_search_text_bigm` GIN `gin_bigm_ops`
       - `daily_usage`: `day` PK와 수를 세는 칸들
   - 의존: 3단계 / 위험: 낮음
2. **`AiSearchBookTexts.replace(rows)`** (파일: `B/aisearch/AiSearchBookTexts.java` + 내부 구현)
   - 할 일
     - 넘겨받은 목록 책 **전부**를 넣습니다. 한 줄이 없는 책은 `line`을 NULL로 둡니다.
     - 한 트랜잭션에서 지우고 다시 넣습니다.
     - `search_text`는 NFKC → 소문자 → 빈칸을 지운 제목+저자+한 줄입니다 [안].
     - 돌려주는 값: 넣은 수, 한 줄이 있는 수, 목록에 없는 번호 수
   - 의존: 4-1 / 위험: 낮음
3. **`collection`의 `book-texts` 모드** (파일: `B/collection/...` 넣기 모드 자리, 0단계 #14)
   - 할 일
     - 명령 [안]: `--spring.profiles.active=collection-import --chaekcheck.collection.import.mode=book-texts --chaekcheck.collection.import.book-texts-file=<path>`
     - TSV를 읽어 `kind=search_line` 줄만 `aisearch`에 넘깁니다. 모르는 `kind`는 건너뛰고 수를 보고합니다. 줄 안 탭·줄바꿈과 300자 넘는 줄은 거절합니다.
     - 목록 책은 `ListedBooks.loadFromDb()`로 읽습니다. **0권이면 넣기를 거부하고 표를 지우지 않습니다.**
     - 새 의존 `collection → aisearch`
   - 이유: ADR-0151. 23의 탭 추천 글도 나중에 `kind`만 더해 같은 명령으로 넣을 수 있게 합니다.
   - 의존: 4-2 / 위험: 중간 (프로필이 달라 캐시가 비는 문제 → `loadFromDb`로 피함)
- 시험
  - 넣기 통합 시험: 정상 / 모르는 `kind` 건너뜀 / 목록에 없는 `book_id` 건너뜀 / 목록 책 0권이면 거부하고 기존 줄 그대로 / 다시 넣으면 바뀐 줄로 / `search_text` 정리
  - 300자 넘는 `line`은 DB CHECK와 입력 검사 둘 다에서 막힘
  - `ModularityTests` 통과(새 의존 `collection → aisearch`, 고리 없음)
- 2단계 TSV를 dev DB에 넣어 보고 수를 보고합니다.
- 되돌리기: 새 changelog만이므로 `DROP SCHEMA aisearch CASCADE`와 Liquibase 기록을 정리합니다. `collection` 모드는 지워도 다른 모드에 영향이 없습니다.

### 5단계: 후보 뽑기 `CandidateQuery`

1. **낱말 맞추기** (파일: `B/aisearch/internal/match/CandidateQuery.java` [안])
   - 할 일
     - 먼저 서버가 `ListedBooks.current()`의 `libraryIds`와 계획 도서관을 맞춰, 책마다 **계획 도서관 수**를 셉니다(메모리). 1곳 이상인 책만 남깁니다(R3-3).
     - SQL에 대상 책 번호와 그 수를 함께 넘겨, 점수 → 계획 도서관 수 → `book_id` 차례로 정렬한 뒤 30권을 자릅니다.
       - 모양: `JOIN unnest(:ids, :planCounts)`, `LIKE`를 하나 맞을 때마다 1점(design-delta "낱말 맞추기")
       - 30권을 먼저 자르면 동점 책이 `book_id` 순으로 잘리므로 이 순서를 지킵니다(검토 지적 #5).
     - 낱말은 `search_text`와 같은 방법으로 정리하고, 정리 뒤 2자 이상만, 최대 8개입니다 [안].
     - 낱말의 `%`, `_`는 escape합니다.
   - **잴 것**: 목록 책 전체(spec의 약 2,800권 [확인 필요: 0단계 #15])에서 색인이 있을 때와 없을 때의 걸린 시간. `EXPLAIN ANALYZE`를 보고합니다.
   - 의존: 4단계 / 위험: 중간
- 시험: 점수 순, 동점이면 계획 도서관 수 순, 계획 도서관 0곳인 책 제외, 30권 상한, escape, 2자 미만 낱말 버림
- 되돌리기: 클래스 하나

### 6단계: `LlmClient`와 `AnthropicLlmClient`

1. **LLM 경계** (파일: `B/aisearch/internal/llm/LlmClient.java`, `AnthropicLlmClient.java` [안])
   - 할 일
     - 모양은 architect-proposal 결정 6입니다: `complete(call, timeout)`, `stream(call, timeout, listener)`, `LlmCall(system, messages, jsonSchema, maxTokens)`, `LlmUsage`, `LlmFailure {TIMEOUT, HTTP_ERROR, OVERLOADED, BAD_OUTPUT}` [안]
     - JDK `HttpClient`로 Messages API를 직접 부릅니다(새 라이브러리 없음, 결정 #5).
     - 요청에 `output_config.format`의 `json_schema`를 넣고, thinking·effort는 1단계 결과대로 둡니다.
     - 2차는 SSE 줄을 직접 읽습니다.
   - 설정 [안: 이름]
     - `chaekcheck.aisearch.llm.anthropic.api-key` ← env `CHAEKCHECK_AISEARCH_ANTHROPIC_API_KEY`
     - `…model=claude-haiku-5-5` [확정]
     - `…base-url` [확인 필요], `anthropic-version` [확인 필요]
   - **키는 로그와 예외 메시지에 남기지 않습니다.** 키가 비어 있으면 1차·2차 모두 실패로 보고 대신하는 길로 갑니다.
   - 의존: 1단계 값 / 위험: 중간 (스트림 해석을 직접 만듦, ADR-0150 감수)
- 시험(가짜 HTTP 서버, 0단계 #12 방식)
  - 정상 응답, 429·5xx·overloaded, 시간 초과, 스트림 중간 끊김, `usage`를 읽는지
  - 요청 헤더·본문 모양
  - 키가 로그에 없는지(`OutputCaptureExtension` 등)

### 7단계: 횟수·비용 상한과 이용 기록

1. **`AiSearchQuota`와 `InMemoryAiSearchQuota`** (파일: `B/aisearch/internal/quota/...` [안])
   - 할 일
     - 같은 IP의 1분 10번, 하루 100번을 메모리에서 셉니다 [확정]. IP는 0단계 #6에서 확인한 방법(`X-Real-IP`)으로 읽고, 저장하지 않습니다.
     - 하루 경계는 Asia/Seoul 자정입니다 [안].
     - `Retry-After`는 1분 제한이면 남은 초, 하루 제한이면 한국 자정까지입니다 [안].
     - 시험이 쉽게 `Clock`을 주입합니다.
     - 이어서 묻는 질문도 똑같이 셉니다(R11-7).
2. **`DailyBudget`** (`aisearch.daily_usage` UPSERT)
   - 할 일
     - 질문을 **시작할 때만** 오늘 비용이 $2 [확정] 아래인지 봅니다. 이미 돌고 있는 질문만큼은 넘을 수 있고, 이는 감수합니다(design-delta 덧붙임).
     - 끝날 때 1차·2차 토큰으로 `cost_micro_usd`를 더합니다(입력 × 0.10 + 출력 × 0.50 per 1M).
     - 스트림이 끊겨 `usage`가 오지 않으면 출력은 `max_tokens`로 셉니다 [안].
     - 429는 `rate_limited_count`, 503은 `paused_count`에 셉니다.
3. **`usagelog`: `UsageLog.recordAiSearch(UsageRequest, AiSearchRecord)`와 표 `usagelog.ai_search_event`** (파일: `B/usagelog/...`, `CL/usagelog/00N-ai-search-event.yaml`, changeSet id `usagelog-ai-search-event`)
   - 할 일
     - 칸: `occurred_at`, `elapsed_ms`, `turn_no`, `keyword_result`, `title_like`, `pick_result`, `candidate_count`, `picked_book_ids`, `input_tokens`, `output_tokens` [확정: 결정 #7]
     - CHECK
       - `turn_no` 1~20
       - `keyword_result` IN ('ok','failed','timeout')
       - `pick_result` IN ('ok','no_match','no_text','partial','skipped')
       - `picked_book_ids` 최대 8
     - **질문 글·IP·`visit_key`·`account_id`는 넣지 않습니다.**
     - `usagelog.enabled`를 따릅니다. 꺼져 있어도 비용 상한은 동작합니다.
     - 지금 있는 `usagelog` 정리 작업에 이 표를 더하고, 실제로 적용된 보관 기간을 보고합니다 [확인 필요].
   - 의존: 4단계 / 위험: 낮음 (23과 changelog 번호가 부딪히면 합칠 때 번호만 고침)
- 시험
  - `Clock`으로 1분 11번째와 하루 101번째가 막히는지
  - 자정에 횟수가 풀리는지
  - 비용이 상한을 넘은 뒤 시작한 질문이 막히는지
  - 재시작하면 IP 횟수는 처음부터지만 비용은 이어지는지
  - `recordAiSearch` 칸, `ModularityTests`
- 되돌리기: `usagelog.ai_search_event`를 DROP합니다(새 changeSet만). `daily_usage`는 4단계와 함께 지웁니다.

### 8단계: `AiSearchFlow`, `PickStreamParser`, 컨트롤러 (서버 끝까지)

1. **`PickStreamParser`** (파일: `B/aisearch/internal/flow/PickStreamParser.java` [안])
   - 할 일
     - 2차 스키마 하나만 읽는 작은 상태 기계입니다. `head` 조각 → `picks[i].no` → `picks[i].text` 조각 차례로 읽습니다.
     - 조각 경계에 걸린 escape(`\"`, `\uXXXX`)를 이어 읽습니다.
     - Jackson 비동기 파서를 쓸지는 dev가 확인합니다. 문자열이 끝나야 값을 주는지가 걸려 있습니다 [확인 필요].
   - 위험: 중간
2. **`AiSearchFlow`** (파일: `B/aisearch/internal/flow/AiSearchFlow.java` [안])
   - 차례(design-delta 순서 그림)
     1. 검증
     2. 횟수·비용 확인
     3. `planSearch`로 계획 도서관을 구하고, `ListedBooks.current()`로 대상 책과 계획 도서관 수를 셈
     4. 1차 호출(5초 [확정])
     5. `titleLike`면 `title-guess`
     6. 후보 30권
     7. 2차 스트림(호출 전체 15초 [확정])
     8. 카드·글을 흘려 보냄
     9. 비용을 더함
     10. `done`
     11. `recordAiSearch`
   - 규칙
     - 1차가 실패하거나 시간을 넘기면 질문을 띄어쓰기로 나눈 낱말을 씁니다(R6-1). 화면에는 드러내지 않습니다.
     - `notBook`이거나 후보가 0권이면 2차를 부르지 않고 `done {result:no_match}`를 보냅니다(R3-5, R5).
     - 책 번호가 오면 후보 안인지, 중복이 아닌지 확인합니다. **통과한 책만** `card`를 보내고 그 뒤 `card-delta`를 보냅니다. 통과하지 못한 책은 번호도 글도 보내지 않습니다(R12-2).
     - 8권을 넘으면 버립니다. 카드 글은 300자에서 끊습니다(R12-3).
     - 카드 0장에서 2차가 실패하면 후보 앞 8권을 글 없이 `card`로 보내고 `no_text`로 끝냅니다(R6-2). 카드가 나온 뒤 끊기면 `partial`로 끝냅니다(R12-4).
     - 이어서 묻기
       - `refersToShown`이면 후보 = 마지막 턴 `bookIds` + 낱말로 맞춘 책입니다. 마지막 턴 책은 계획 도서관이 있는 책으로 거릅니다 [안].
       - 아니면 `history`에서 보여 준 책을 후보에서 뺍니다(R11-4, R11-8).
       - 앞 대화의 `bookIds`는 서버가 `ListedBooks` 제목으로 바꿔 넣습니다(R11-9).
     - **Haiku에 보내지 않는 것**: 회원 번호, 이용 기록, IP, 계획 도서관 이름(R4-4)
     - `title-guess`의 제목은 질문 글 안에 있는 말만 씁니다. 아니면 질문 전체를 씁니다(ADR-0153).
     - 카드 칸(`title`, `author`, `coverUrl`, `myLibraryCount`)은 `ListedBooks`에서 붙입니다. Haiku는 글만 씁니다.
3. **`AiSearchController`** (파일: `B/aisearch/web/AiSearchController.java` [안])
   - `POST /api/v1/ai-searches/stream` [안]. 요청·이벤트 모양은 design-delta "API" 그대로입니다.
     - 요청: `question`, `history`(최대 5, 한 턴 `bookIds` 최대 8, 목록 밖 번호는 조용히 버림), 계획 칸들, `turnNo`(1~20, 웹이 셈) [확정]
     - 이벤트: `title-guess`, `head-delta`, `card`, `card-delta`, `done`, `error`
   - 스트림을 열기 전 오류(ProblemDetail)
     - 400 `validation_error`
     - 400 `invalid_query`: 앞뒤 빈칸을 뗀 뒤 2자 미만이거나 200자 초과
     - 422 `invalid_region`
     - 429 `too_many_requests` + `Retry-After`
     - 503 `ai_search_paused`(새 코드)
     - 404 `not_found`: `chaekcheck.aisearch.enabled=false`
   - 스트림 관례와 CSRF는 0단계 #3·#5의 지금 방식을 따릅니다.
   - **질문 글을 로그·예외 메시지·MDC에 남기지 않습니다.** 검증 오류 메시지에도 넣지 않습니다.
   - 의존: 5·6·7단계 / 위험: 높음 (이 사이클에서 가장 큰 부분)
- 시험(가짜 LLM: `LlmClient` 가짜 구현이나 가짜 HTTP 서버)
  - 정상 흐름 이벤트 차례
  - 모의 2차 응답에 후보 밖 번호와 중복 번호를 섞었을 때 그 책의 `card`·`card-delta`가 **한 번도** 나가지 않는지
  - 1차를 막았을 때 낱말 나누기로 결과가 나오는지
  - 2차를 막았을 때 `no_text`와 앞 8권
  - 흐르는 중 끊었을 때 `partial`
  - `notBook` → `no_match`
  - 제목만 넣었을 때 `title-guess`가 맨 먼저 오고 평소 답도 오는지
  - 300자에서 끊는지, 8권 상한
  - 400·429·503·404
  - Haiku로 나가는 본문에 IP·도서관 이름·회원 번호가 없는지
  - 로그 출력과 DB 전체(`ai_search_event`, `daily_usage`)에 질문 글이 없는지
  - `ModularityTests`

### 9단계: 웹 S1 탭 "AI" / "직접"

1. **첫 화면 탭** (파일: `W/features/search/SearchPage.tsx`·`SearchForm.tsx` 부근 [확인 필요: 지금 파일], 새 `W/features/aisearch/AiSearchTab.tsx` [안])
   - 할 일
     - 검색창 위에 탭 [AI] [직접]을 둡니다. AI가 왼쪽이고, 처음 열면 AI입니다 [확정].
     - 직접 탭은 지금 검색 그대로입니다.
     - AI 탭: 입력칸(안내 글 문구표), [찾기], 예시 칩 3개(누르면 바로 찾기). [상세검색 ⌄]과 [⚙]는 보이지 않습니다 [확정].
     - 찾을 도서관 줄은 두 탭 모두 지금 그대로입니다.
     - 2자 미만이면 찾지 않고 "두 글자 이상 써 주세요"를 보입니다. 200자에서 더 쳐지지 않습니다(`maxLength`).
     - 탭을 바꿔도 각 탭의 입력 글은 그 화면을 떠나기 전까지 남습니다(R1-3).
     - 찾기를 누르면 첫 질문을 sessionStorage 대화에 넣고 `/ai-search`로 갑니다. **주소에 질문을 넣지 않습니다**(R2-2).
     - AI 기능이 꺼져 있으면 AI 탭을 숨기고 직접 탭을 엽니다. 꺼짐을 아는 방법은 0단계 #9 결과대로입니다.
     - 폰: 탭 두 개가 한 줄을 반씩 쓰고, 칩은 가로로 넘깁니다 [안].
   - 의존: 0단계 #9 (서버 8단계 없이도 화면 시험 가능) / 위험: 중간 (첫 화면은 22에서 많이 바뀜)
- 시험(vitest): 처음 AI 탭이 열림, 직접 탭 검색이 그대로 됨, 탭을 바꿔도 글이 남음, 2자 미만 안내, 200자 상한, 꺼짐이면 AI 탭 없음, `/ai-search` 이동 주소에 질문 없음

### 10단계: 웹 S30 `/ai-search` 대화 화면

1. **화면과 스트림** (새 `W/features/aisearch/AiChatPage.tsx`, `aiChatStore.ts`(sessionStorage), `aiSearchStream.ts`(POST + `ReadableStream`, 0단계 #4의 함수를 다시 씀), `aiSearchText.ts`(문구) [안], 라우터에 `/ai-search`)
   - 맨 위 얇은 줄: [새 대화], AI 표시 한 줄 [확정], 찾을 도서관 요약 [안]
   - 가운데: 내 질문은 오른쪽 말풍선, 답은 왼쪽(머리말 + 카드)입니다. 카드는 맨 위 한 권 크게 + 두 권씩, 폰은 한 권씩입니다 [확정: AC-11]. 카드 = 표지, 제목, 저자, "내 도서관 N곳", 글
   - 맨 아래: 고정 입력칸 [보내기]
   - 동작
     - 답이 다 나올 때까지 보내기를 막습니다 [안].
     - 요청마다 이번 질문 + 앞 대화 최근 5번(질문, `bookIds`) + 계획 값을 본문으로 보냅니다.
     - 한 대화가 20번을 넘으면 "새 대화를 시작해 주세요"와 [새 대화]를 보입니다. 이 수는 웹이 셉니다.
     - [새 대화]를 누르면 대화를 비웁니다.
     - 대화는 이 탭의 sessionStorage에만 둡니다. 새로 고쳐도 남고, 탭을 닫으면 사라집니다(R11-6). 서버에는 저장하지 않습니다.
     - 카드를 누르면 `/books/{bookId}`로 갑니다. 뒤로 오면 같은 대화, 같은 자리입니다 [안].
     - `title-guess`를 받으면 답 맨 위에 제목 줄을 붙입니다. [직접 찾기에서 보기]를 누르면 S1 직접 탭에서 그 글로 지금 검색을 합니다. 이때 제목은 지금 직접 검색처럼 주소에 들어갑니다. 사용자가 누른 것이라 ADR-0153에서 감수했습니다.
   - 상태별 화면: 로딩, 정상, `no_text`, `no_match`(+ 예시 칩), `partial`, 429, 503(+ [직접 찾기로]), 연결 오류(+ [다시 시도]), `error`
   - 의존: 8·9단계 / 위험: 중간
- 시험(vitest, 가짜 스트림)
  - 이벤트 차례대로 그리기
  - 이어서 물을 때 앞 답이 그대로 있고 새 답이 아래에 붙음
  - 새로 고침 뒤에도 대화가 남음
  - [새 대화]를 누르면 다음 요청 `history`가 비어 있음
  - 21번째 → 안내
  - `partial`일 때 남은 자리 문구
  - 429·503 안내와 단추
  - 제목 줄을 누르면 직접 탭 검색
  - 주소에 질문이 없음

### 11단계: 배포·운영 준비 (설정, nginx, 처리방침)

1. **nginx** (파일: `deploy/nginx/` 템플릿, `deploy/prod/nginx/prod.conf`)
   - `/api/v1/ai-searches/stream`의 버퍼링을 끄고(`X-Accel-Buffering: no` 또는 `proxy_buffering off`), gzip을 하지 않습니다.
   - `proxy_read_timeout`이 약 21초보다 길게 되어 있는지 봅니다 [확인 필요: 0단계 #7].
   - 접속 기록에 요청 본문이 없는지 봅니다.
   - 사이클 15·17이 넣은 기존 설정과 겹치지 않게 합칩니다.
2. **설정과 비밀** (파일: `backend/src/main/resources/application*.yml`, `deploy/prod/prod.env`)
   - `chaekcheck.aisearch.enabled`는 기본 `false`입니다 [안]. settings-index 10절의 값을 모두 yml에 넣습니다.
   - 운영
     - Parameter Store `/chaekcheck/prod/CHAEKCHECK_AISEARCH_ANTHROPIC_API_KEY`(SecureString)에 키를 넣습니다 [안: 이름]. `up.sh`가 env로 넘깁니다(사이클 17 방식).
     - 켜기는 `prod.env`의 `CHAEKCHECK_AISEARCH_ENABLED=true` [안]입니다.
   - 운영에서 켜는 차례 [안]
     1. 처리방침 새 판 시행
     2. 키를 Parameter Store에
     3. 운영 DB에 `book-texts` 넣기
     4. `enabled=true`
     5. `up.sh`
3. **처리방침 새 판: Anthropic을 위탁 + 국외 이전에 한 줄** (사용자 선택 "Cloudflare처럼 한 줄 적음", 2026-10-24, 명세 규칙 #7)
   - 처리방침은 이미 공개된 판이라 seed(`sitecontent/002-sitecontent-seed.yaml`)는 고치지 않습니다. dev `docs/maintenance/5-sitecontent.md`(plan `drafts/ops-sql.md` §4)의 **새 판 SQL**로 넣습니다. 판은 고치지 않고 새로 넣습니다(ADR-0098).
   - §2에 Cloudflare 다음으로 더할 문구 [안: 문구, 사용자 확인 필요]
     ```
     - **Anthropic, PBC**
       - 맡긴 일: AI 책 찾기의 답 쓰기
       - 나라: 미국
       - 옮기는 항목과 방법: AI 책 찾기에 쓴 문장(이어서 물을 때 앞 질문 포함) / 찾기를 누를 때 네트워크로 전송
       - 보유 기간: [확인 필요: Anthropic 공식 문서]
     ```
     - 받는 자, 나라, 항목은 spec 확인 필요 #2에 적힌 값입니다. 보유 기간은 공식 문서로 확인하기 전까지 빈칸입니다.
     - §1(수집 항목)에 **"AI 책 찾기에 쓴 문장은 우리 서버에 저장하지 않습니다."** 한 문장을 더함 [확정] (사용자 "처리방침 수집 항목 쪽에 \"AI 책 찾기에 쓴 문장은 우리 서버에 저장하지 않습니다\" 쪽에 해줘 왜냐면 나중에 내가 llm을 다룰 수도 있어서", 2026-10-24, 인계서 확인 #4). "Anthropic에 보낼 뿐" 같은 업체 이름 문장은 넣지 않음(업체는 §2 위탁 줄에만)
   - 시행일은 AI 기능을 켜는 날과 같거나 그보다 앞입니다. 알리는 공지는 ops-sql §4와 같은 방식이고, 공지를 낼지는 [안]입니다.
   - 판 본문이 확정되면 plan `drafts/privacy-policy.md`도 맞춰야 하니 plan에 알립니다.
4. **AI 표시 한 줄**(R9-2, 화면): "책 설명은 AI가 질문에 맞춰 썼어요. 실제 내용과 다를 수 있어요" [확정]. S30 맨 위에 한 번만 두고 카드마다 붙이지 않습니다. 10단계에서 만듭니다.
- 되돌리기
  - 운영에서 `enabled=false` → `up.sh`. 서버는 404를 주고 웹은 AI 탭을 숨겨 직접 탭을 엽니다.
  - Parameter Store의 키를 지우거나 Console에서 키를 폐기합니다.
  - 처리방침은 Anthropic을 뺀 새 판을 넣습니다(판은 지우지 않음).
  - DB는 4·7단계 되돌리기를 따릅니다.

### 12단계: 마무리 시험

- **AC-12**: dev 서버 전체(실제 Haiku, 2단계 한 줄을 넣은 상태)로 질문 20개를 돌립니다. JSON을 모두 읽을 수 있는지, 후보 밖 번호가 0인지 확인하고, 질문마다 기록을 `# 사이클 24` 절에 적습니다.
- Playwright: 데스크톱 1440px을 먼저, 그다음 태블릿(768px [안])과 폰 375px. S1(두 탭, 꺼짐), S30(모든 상태)를 봅니다.
- `CHANGELOG.md` 맨 위 절을 씁니다. API가 호환되는 새 기능이므로 MINOR 후보입니다 [안: 배포 때 dev가 정함].

## 문구표 (화면 글)

| 자리 | 문구 | 근거 |
|---|---|---|
| 탭 | "AI" / "직접" | [확정] R1-1 |
| AI 입력칸 안내 | "어떤 책을 찾으세요? 예: 잠들기 전에 조금씩 읽을 과학책" | flow S1 [안] |
| 2자 미만 | "두 글자 이상 써 주세요" | AC-16 |
| AI 표시 | "책 설명은 AI가 질문에 맞춰 썼어요. 실제 내용과 다를 수 있어요" | [확정] R9-2 |
| 로딩 | "책을 찾고 있어요" | spec 상태별 동작 |
| 카드 | "내 도서관 N곳" | 범위 |
| 글 없이·끊김 | "지금은 설명을 쓰지 못했어요" | [확정] R6-2, R12-4 |
| 맞는 책 없음 | "맞는 책을 찾지 못했어요. 다른 말로 써 보시겠어요?" + 예시 칩 | [확정] R5-1 |
| 횟수 초과 | "잠시 뒤에 다시 써 주세요" | R7-1 |
| 비용 상한 | "오늘은 AI 책 찾기를 쉬어요. 직접 찾기를 써 주세요" + [직접 찾기로] | R8-1 [안] |
| 연결 오류 | "연결이 원활하지 않아요" [다시 시도] | flow S30 [안] |
| 제목 줄 | "「○○」을(를) 찾으시나요? [직접 찾기에서 보기]" ("을(를)"을 글자 그대로) | [확정] R13-3, AC-15 |
| 20번 뒤 | "새 대화를 시작해 주세요" + [새 대화] | R11-3 |
| 이어 묻기 입력칸 | "이어서 물어보세요. 예: 이 중에 소설만" | flow S30 [안] |
| 도서관 요약 | "내 도서관: 서울 강남구" | flow S30 [안] |
| 예시 칩 3개 | [안: dev가 제안 → 사용자 확인] | flow 화면 흐름 #1 |

## 테스트

- **단위**: `CandidateQuery`(정렬, 자르기, escape), `PickStreamParser`(조각 경계, escape, 차례), 낱말 정리, `InMemoryAiSearchQuota`(`Clock`), `DailyBudget` 비용 계산, `book-texts` TSV 읽기
- **통합(모듈 시험)**: `ListedBooks`, `book-texts` 넣기, `AiSearchFlow`·컨트롤러(가짜 LLM), `recordAiSearch`, 질문 글이 로그와 DB에 없는지, `ApplicationModules.of(...).verify()`(3·4·7·8단계마다)
- **실제 호출 기록**: 1단계 프로토타입, 12단계 AC-12. 빌드 밖에서 수동으로 돌립니다(키와 비용 때문).
- **화면**: vitest(9·10단계), Playwright(데스크톱 먼저), 폰 화면이 바뀌므로 사용자 실제 폰 확인

### 수용 기준과 시험 대응표

| AC | 단계 | 시험 |
|---|---|---|
| AC-1 AI 탭이 처음 열림, 직접 탭은 그대로 | 9 | vitest 탭 시험, Playwright S1 |
| AC-2 1~8권 + 칸 + AI 표시 한 줄 | 8, 10, 12 | 통합 시험(가짜 LLM) 이벤트 모양, vitest 카드, 실제 Haiku로 "잠들기 전에 조금씩 읽을 과학책" 화면 확인 |
| AC-3 목록 책이고 계획 도서관 1곳 이상 | 5, 8 | 응답 `bookIds`가 모두 대상 책인지 확인하는 통합 시험 |
| AC-4 후보 밖 번호 버림 | 8 | 모의 2차 응답 통합 시험 |
| AC-5 "오늘 점심 뭐 먹지" → 못 찾음 | 8, 12 | `notBook` 모의 시험 + 실제 Haiku 20번 질문 |
| AC-6 2차를 막으면 글 없이, 1차를 막아도 결과 | 6, 8 | 가짜 LLM 실패·시간 초과 시험 |
| AC-7 주소·접속 기록·사용 기록에 질문 없음 | 8, 9, 10, 11 | 로그 출력·DB 검사 통합 시험, vitest 주소, nginx `log_format` 확인 |
| AC-8 1분 11번째 → 횟수 초과, 직접 탭은 그대로 | 7, 8, 10 | `Clock` 시험 + 컨트롤러 429 + 직접 검색 요청이 막히지 않는 시험 |
| AC-9 비용 상한 → 쉼 안내 + 직접 탭 단추 | 7, 8, 10 | `budget.daily-usd`를 아주 낮게 둔 통합 시험 + vitest 503 화면 |
| AC-10 카드 → 책 화면 | 10 | vitest 링크, Playwright |
| AC-11 PC·태블릿·폰 짜임 | 10, 12 | Playwright 1440·768 [안]·375 + 사용자 실제 폰 |
| AC-12 질문 20개 JSON 읽힘, 후보 밖 0 | 1, 12 | 실제 Haiku 기록 |
| AC-13 이어서 묻기, 앞 답 남음, 기록에 질문 없음 | 8, 10 | `refersToShown` 통합 시험 + vitest 대화 쌓기 |
| AC-14 새 대화 → 앞 대화 없이 | 10 | vitest 다음 요청 `history` 비어 있음 |
| AC-15 제목만 → 제목 줄 → 직접 탭 검색 | 8, 10 | `title-guess` 통합 시험 + vitest 단추 |
| AC-16 한 글자 → 안내 | 8, 9 | vitest + 컨트롤러 400 `invalid_query` |
| AC-17 21번째 → 새 대화 안내 | 10 | vitest |
| AC-18 흐르다 끊김 → 남은 자리 문구, 후보 밖은 잠깐도 안 나옴 | 8, 10 | 가짜 스트림 끊김 통합 시험 + 이벤트 기록에 버린 번호가 없음 + vitest `partial` |
| AC-19 하루 101번째 → 횟수 초과 | 7, 8 | `Clock` 시험 |

## 완료 기준

- [ ] AC-1~AC-19를 위 표대로 확인하고, AC 확인표를 dev `docs/plan-feedback.md` `# 사이클 24` 절에 적습니다.
- [ ] `./gradlew build` 통과, 모듈 검증 시험(`ApplicationModules.of(...).verify()`) 통과
- [ ] `web/`에서 `npm run build`와 vitest 통과
- [ ] 1단계 프로토타입 값과 12단계 AC-12 기록을 plan에 보냈습니다.
- [ ] 질문 글이 우리 서버 어디에도 남지 않습니다: 주소, nginx 접속 기록, 앱 로그, `usagelog`, `aisearch` 표
- [ ] `enabled=false`이면 서버는 404이고 웹은 직접 탭만 보입니다. `enabled=true`이고 키가 비어 있으면 대신하는 길로 결과가 나옵니다.
- [ ] 운영에서 켜기 전에 처리방침 새 판(Anthropic 위탁 + 국외 이전)의 시행일이 지났습니다.
- [ ] Playwright로 데스크톱 1440px을 먼저, 그다음 태블릿·폰 375px에서 S1(두 탭)과 S30(모든 상태)을 봤습니다.
- [ ] 폰 화면(S1 탭·칩, S30 대화·고정 입력칸)을 새로 만들거나 바꾸므로, 사이클을 닫기 전에 사용자가 **자기 폰(Samsung Internet)**으로 dev 웹 서버 `web-lan-5174`(`.claude/launch.json`, 같은 Wi-Fi)에 붙어 확인합니다. Chrome 폰 흉내만으로는 안 됩니다. 실제 폰에서만 보인 입력칸 넘침과 터치 문제를 놓친 적이 있습니다(사용자 결정 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-design-addendum-decisions.html` #3).
- [ ] `CHANGELOG.md` 맨 위 절

## 이번에 하지 않는 것

- 로컬 LLM(Ollama), vast.ai(vLLM) 연결과 튜닝(LoRA). `LlmClient` 경계만 둡니다.
- 사이클 23의 꼬리표·탭 추천 글을 쓰는 일. `ListedBook`의 nullable 칸, 꼬리표 번호 맞추기, `kind=for_you_blurb` 같은 다른 `kind`도 만들지 않습니다.
- 23과 PC 배치를 하나로 합치는 일(사용자가 결정하지 않음)
- 소개 원문 대 내용 메모 비교 시험(PC에서 따로)
- 추천도서 목록 밖의 책, 서버가 `catalog`에서 제목을 찾는 일
- 대화를 서버에 저장하기, 주소 공유, 다른 기기에서 이어 보기, 회원별 결과(본 책 반영)
- 정렬·거르기 선택, 모델 이름 표시
- 목록 책이 늘 때 자동으로 다시 넣기. 다음 `book-texts` 넣기 때까지는 AI 찾기에 나오지 않고, 이는 감수합니다(결정 #3).
- 서버 전체 동시 상한 값(사용자가 정하기 전까지)
- plan `docs/current/`, `docs/settings-index.md`, `drafts/privacy-policy.md` 고치기. plan이 보고를 받고 고칩니다.
- 23의 화면(추천도서, 「나에게 맞는 책」)

## 개발 후 plan 쪽에 알려 줄 것 (dev `docs/plan-feedback.md` `# 사이클 24`)

- 시작 커밋, 작업 폴더·브랜치, 23 dev와의 앞뒤(누가 먼저 main에 합쳤는지), 합칠 때 정한 `usagelog` changelog 번호
- **0단계 대조표**(15개 항목). design-delta와 다른 점, dev 스킬 관례 때문에 바꾼 이름
- **1단계 잰 값.** settings-index 10절의 [확인 필요] 줄을 채울 값입니다.
  - 1차·2차 걸린 시간(평균·최대), 토큰, 질문 하나 비용
  - thinking을 끄거나 effort를 낮췄을 때의 1차 시간
  - 정한 `max_tokens`
  - `anthropic-version` 값, base URL, `usage` 자리(공식 문서 URL과 확인 날짜)
  - 스트리밍할 때 칸 차례와 `maxItems`를 지키는지
  - 5초/15초 처음 값을 다시 맞춰야 하는지
- 1차·2차 지시문 글 전체와 스키마, 2단계 배치 지시문
- 2단계 수: 목록 책 수, 우리 책과 맞춰진 수, 원문이 있는 수, `intro`/`bibliographic`/쓰지 않은 수, 배치 비용
- 5단계 낱말 맞추기 속도(색인 있음·없음)
- AI 꺼짐을 웹이 아는 방법
- 실제 IP를 읽는 방법, CSRF 처리, nginx `proxy_read_timeout` 값과 버퍼링 설정
- `ai_search_event`에 적용된 보관 기간, `pick_result` `skipped`의 실제 뜻
- 서버 스레드 모델과, 동시 상한에 대한 dev 의견(사용자에게 물을 거리)
- 처리방침 새 판 문구와 시행일, 공지를 냈는지
- 예시 칩 문구 제안, 화면 확인과 실제 폰 확인에서 사용자가 고친 것(사용자 발언은 그대로)
- 새로 알게 된 제약, 설계와 달라진 점, CHANGELOG 버전과 배포 날짜
