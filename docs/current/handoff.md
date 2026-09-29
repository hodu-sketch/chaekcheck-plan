# 개발 인계서: 사이클 03 검색 조건 강화 (제목 / 저자 / 출판사 중 하나)

> **사이클 03 구현은 끝났습니다** (plan 회고 `../chaekcheck-plan/docs/cycles/03-search-conditions/retro.md`, 2026-09-30). 아래 "사이클 03 후속" 한 가지만 남았습니다. 그 아래 본문은 기록으로 남겨 둔 것입니다.

## 사이클 03 후속: 방문 가입 도서관의 조회 순서 (2026-09-30, 사용자 결정)

C3-U-1에서 방문 가입을 "무리 안에서 맨 뒤"로 구현했습니다. 회고에서 사용자가 지역이 있을 때의 순서를 다시 정했습니다 (plan ADR-0027).

- 지역 있음 [확정]: 내 시군구(방문 없음) → 내 시도(방문 없음) → 누구나(방문 없음) → 내 시군구(방문) → 내 시도(방문) → 누구나(방문) → 확인 필요
- 규칙으로 쓰면: **가입 가능한 무리(`Eligibility`가 `OPEN`/`ELIGIBLE`인 무리)에서는 방문 가입이 아닌 도서관을 무리 순서대로 모두 먼저 놓고, 그다음 방문 가입 도서관을 같은 무리 순서대로 놓습니다.** 확인 필요 무리는 그 뒤이고, 그 안에서는 지금처럼 방문 가입이 뒤입니다.
- 지역 없음: 이 규칙을 적용해도 지금과 같습니다. 누구나(방문 없음) → 누구나(방문) → 자격 필요 → 확인 필요. 자격 필요 무리는 가입 가능이 확정되지 않았으므로 방문 가입을 앞으로 모으지 않고, 그 무리 안에서만 뒤로 둡니다 [안].
- 각 도서관의 `priorityGroup` 값은 바꾸지 않습니다. 내 시군구의 방문 가입 도서관은 여전히 `MY_SIGUNGU`입니다. 웹은 `targets` 순서로 계획을 만들고 `priorityGroup`은 표시에만 쓰므로 웹은 바꿀 것이 없습니다(2026-09-30 코드 확인: `ResultRow.tsx` 24행, `SearchPage.tsx` 118행).
- 무리 안의 나머지 기준(후순위 포털 → 주의 → 보유 수 → id)은 그대로입니다.
- 결과 정렬(`sortBatch.ts`, 같은 책 안: 가입 가능 → 가입 가능(주의) → 가입 가능(방문) → 확인 필요)은 그대로이며 [확정]입니다.
- 고칠 곳: `library/internal/LibraryService`의 계획 순서 만들기. 테스트는 `LibraryCatalogTests.visitOnlyLibrariesComeAfterTheRestOfTheirGroup`을 새 순서로 바꾸고, 지역이 있을 때 "내 시군구(방문)가 누구나(방문 없음) 뒤"를 확인하는 테스트를 더합니다.
- 확인: `backend/`에서 `./gradlew build` (`ModularityTests` 포함). 실제 서버에서 지역을 넣은 `targets` 순서를 보고, 결과를 dev `docs/plan-feedback.md`의 `# 사이클 03` 절에 적습니다.

## 요약

지금은 제목으로만 검색합니다. 이번 사이클에서는 제목, 저자, 출판사 중 **조건 하나**를 골라 검색할 수 있게 합니다. 바뀌는 곳은 백엔드 `availability` 모듈과 웹뿐입니다.
- 새 모듈, 새 테이블, Liquibase 변경은 없습니다. `library`, `region`, `fetch-service/`도 바뀌지 않습니다.
- 이미 있는 것:
  - 내부 `SearchField`(TITLE, AUTHOR, PUBLISHER)와 `SearchQuery(value, field)`
  - 캐시 키 `PageKey(libraryId, field, query, page)` (ADR-0009)
  - 교보, YES24, 강남구 adapter의 필드별 URL
- 해야 할 일:
  - 세 API가 `q` 대신 `title` / `author` / `publisher` 중 정확히 하나를 받게 합니다 (ADR-0025).
  - 포털 adapter는 저자·출판사 검색 때 `table.do`에 거르기 값을 붙여 부릅니다 (ADR-0026).
  - 웹 검색창 안 왼쪽에 드롭다운을 둡니다.

**포함**
- 조건 파라미터 도우미와 컨트롤러 3개
- 포털 저자·출판사 URL
- 나머지 6종 adapter의 URL 테스트, 조건별 캐시 테스트
- 웹 드롭다운, 주소, 다시 검색, 조건별 문구
- 사이클 02 테스트의 `q=`를 모두 고치기

**제외**: "이번에 하지 않는 것" 절을 보세요. 대표적으로 여러 조건 AND, 옮긴이, 옛 `?q=` 주소 처리가 빠집니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 이 파일을 고치지 마세요.**
- 구현이 이 인계서와 달라져야 하면(값, 이름, 구조, 순서) 먼저 사용자에게 알리세요. 내용과 이유(사용자 발언이면 그대로)는 dev `docs/plan-feedback.md`의 **새 `# 사이클 03` 절**에 쌓아 두세요. 다음 `/cycle-start` 회고의 입력이 됩니다.
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 호출 시험·공식 문서로 확인한 값입니다.
  - `[안]`: 제안입니다. dev가 바꿔도 되지만, 바꾸면 알려야 합니다.
  - `[확인 필요]`: 모르는 값입니다. 확정된 것처럼 코드에 넣지 말고, 측정하거나 사용자에게 물은 뒤 결과를 보고하세요.
- 단계마다 적힌 확인이 통과해야 다음 단계로 넘어갑니다.
  - 백엔드: `backend/`에서 `./gradlew build` (`ModularityTests` 포함)
  - 웹: `web/`에서 `npm run build`와 `npm test`(Vitest)
  - `fetch-service/`: 바뀌지 않으므로 빌드 대상이 아닙니다.
- JSON 예시와 오류 본문은 이 인계서에 옮기지 않았습니다. 구현할 때는 `design-delta.md`를 기준으로 삼으세요.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/03-search-conditions/design-delta.md`: **기준 문서**. 조건 파라미터 규칙 표, 외부 연동 표(화면 종류별 URL), 포털 adapter 주의, 웹 변경 표, 테스트 목록
- `../chaekcheck-plan/docs/cycles/03-search-conditions/spec.md`
  - 3장: 화면 종류별 지원과 "포털 재조사"
  - 4~6장: 입력, 동작, 상태
  - 7장: AC-1~AC-8
  - 9장: 확인 필요
- `../chaekcheck-plan/docs/cycles/03-search-conditions/flow.md`: S1 드롭다운, 안내 문구, 상태 표, 배치 메모
- ADR (`../chaekcheck-plan/docs/adr/`)
  - 0009: 검색 필드와 캐시 키
  - 0025: 이름 있는 조건 파라미터 하나, 옛 주소 변환 없음 (0024를 대체)
  - 0026: 포털 저자·출판사는 검색어에 정확히 일치하는 거르기를 더함
- `../chaekcheck-plan/docs/current/api.md`: 조건 파라미터 규칙과 오류 코드 표
- `../chaekcheck-plan/docs/cycles/02-library-expansion/retro.md`: "남은 확인", "dev에 전달할 것" (사이클 02 마무리)

## 지켜야 할 제약

- dev `CLAUDE.md`와 스킬 규칙을 따릅니다. 이번 사이클에는 `CLAUDE.md`를 바꿀 일이 없습니다.
- `SearchField`는 지금처럼 `availability/internal`에 둡니다. Modulith 공개 Java API는 바뀌지 않습니다.
- 호출 예의와 묶음 규칙은 그대로입니다 [확정].
  - 캐시 3분, 같은 호스트 동시 1건·1초 간격, User-Agent, 8초
  - 20줄, P=5, K=50, 바쁜 호스트 건너뛰기 (ADR-0020)
- **포털에는 `search_type=AUTHOR`·`TITLE`·`PUBLER`를 절대 보내지 않습니다** [확정]. 이 값은 필드가 아니라 자료 종류입니다. 경기교육청은 이 값을 받으면 0건을 돌려줍니다.
- 웹은 `q`를 읽지 않습니다. 옛 `?q=` 주소를 바꿔 주는 처리도 두지 않습니다 [확정] (사용자: "배포 안 되었는데 불필요해").
- 드롭다운은 마지막에 쓴 조건을 기억하지 않습니다. localStorage 등에 저장하지 마세요 [확정].

## 개발 시작 전 확인

### 사이클 02 마무리 (사이클 03 단계와 별개, 먼저 처리)

사이클 02 retro의 "남은 확인"과 "dev에 전달할 것"입니다.
- [ ] `web/`에서 `npm test`(Vitest)를 실행하고 통과 기록을 남깁니다.
- [ ] `npm run build`로 다시 빌드합니다. 가로 스크롤 CSS 수정(2026-09-29 11:31Z)이 마지막 빌드(11:25Z)보다 나중이기 때문입니다.
- [ ] dev `docs/plan-feedback.md`의 `# 사이클 02` 절에 **spec AC-1~AC-24 확인표**를 적습니다.
  - AC마다 확인 방법과 결과를 적습니다.
  - AC-11(세종 거주 → 천안)과 AC-12(금정 책이음 문구)는 실제 seed로 확인한 기록을 포함합니다.
- [ ] dev `docs/library-maintenance.md` 문구 세 곳을 고칩니다 (행 번호는 2026-09-29 기준).
  1. 432행 "인증서 체인이 불완전한 사이트(PKIX 오류)를 넣을지 …"는 이미 정해진 일입니다. "중간 인증서를 체인 재료로 더해 넣음(2026-09-29, 사용자 결정, plan ADR-0022). 검증 끄기는 금지"로 고칩니다.
  2. 433행 뒤에 다음 줄을 더합니다: "`TlsCompatibility`는 JVM 전체에 적용됨. 운영에서 DB 등을 TLS로 붙이면 거기에도 RSA 키 교환이 허용됨 — 처리 방법은 사용자 결정 대기"
  3. 3절 또는 TLS 관련 줄에 plan `docs/adr/0022-library-site-tls-compatibility.md` 링크를 더합니다.

### 사이클 03

- [ ] base package는 `com.chaekcheck`로 이미 정해졌습니다. 새로 정할 것은 없습니다.
- [ ] 포털 "도서관에서 보기"(`librarySearchUrl`) 처리: 2단계 전에 `table.do?…author_name=…` 주소를 브라우저 새 창으로 열어 모양이 깨지는지 봅니다.
  - 권장 [안]: 제목 검색 주소(`index.do?search_text=`)로 대신 엽니다.
  - 결과와 고른 방식은 보고합니다.
- [ ] `validation_error`의 `errors[].field` 값, 문구, 검증 순서는 dev가 정하고 보고합니다. design-delta에 [안]이 있습니다.

## 구현 단계

### 1단계: 조건 파라미터 도우미 + 컨트롤러 3개 (의존: 없음)

1. **조건 파라미터 도우미** (새 파일: `backend/src/main/java/com/chaekcheck/availability/internal/web/SearchConditionParam.java` [안 이름])
   - 할 일: 요청의 `title` / `author` / `publisher`를 읽어 `SearchQuery.of(value, field)`를 돌려줍니다. 오류는 design-delta "조건 파라미터 규칙" 표를 따릅니다.
     - 셋 다 없음, 또는 값이 비어 있음(`?author=`), 또는 `q`만 옴 → 400 `validation_error`, `code: required`
     - 둘 이상 → `too_many`. 들어온 파라미터마다 `errors[]` 한 줄 [안]
     - 같은 이름 두 번(`?author=a&author=b`) → `duplicate` [안]
     - 값이 정규화 후 1자이거나 51자 이상 → 지금처럼 `InvalidQueryException`(400 `invalid_query`)
   - 주의
     - `@RequestParam String`은 같은 이름의 값을 쉼표로 합칩니다. 그래서 `duplicate`를 가리려면 `getParameterValues`(또는 `MultiValueMap`)로 읽어야 합니다.
     - 지금 `InvalidParamException`은 `errors[]` 한 줄만 담습니다. `too_many`의 여러 줄을 담도록 넓히거나 새 예외를 둡니다. `AvailabilityErrors`의 처리도 함께 고칩니다.
   - 이유: ADR-0025. 기존 `RegionIdsParam`, `CandidatesParam`과 같은 자리에 둡니다 (design-delta "모듈").
   - 위험: 낮음
2. **컨트롤러 3개** (파일: `backend/src/main/java/com/chaekcheck/availability/internal/web/EbookSearchStreamController.java`, `EbookBatchStreamController.java`, `LibraryEbookController.java`)
   - 할 일: `@RequestParam q`를 없애고 도우미를 부릅니다.
     - 검증 순서 [안]: 조건 → `filter` → `scope` → 지역. 지금 `q`가 있던 자리에 조건이 들어갑니다.
     - 모든 검증은 스트림을 열기 전에 끝냅니다.
   - `targets` 이벤트 (파일: `backend/src/main/java/com/chaekcheck/availability/internal/search/StreamEvents.java`)
     - `query` 칸을 없앱니다.
     - 요청과 같은 이름의 칸 하나(`title` / `author` / `publisher`)에 검색어를 담습니다 [확정] (ADR-0025).
     - 나머지 두 칸은 JSON에 나오지 않게 합니다. 예를 들어 null 칸을 생략하는 방식입니다 [안].
   - 페이지 객체(`LibraryPage`)의 `query`는 검색어 그대로 둡니다 [확정].
   - 테스트
     - 새 `SearchConditionParamTests`: 하나 → 그 필드, 없음·빈 값·`q`만 → `required`, 둘 이상 → `too_many`, 같은 이름 두 번 → `duplicate`, 1자·51자 → `invalid_query`
     - `EbookSearchStreamControllerTests`
       - `?author=김달`이면 `BatchRunner`가 AUTHOR로 호출됩니다.
       - `targets`에 `"author"`가 있고 `query`는 없습니다.
       - 400들은 스트림을 열기 전에 나옵니다. 요청 헤더가 `Accept: text/event-stream, application/problem+json`일 때도 ProblemDetail이 나와야 합니다.
     - `EbookBatchStreamControllerTests`: **지금 파일이 없으므로 새로 만듭니다.** 조건이 전달되는지, 조건 오류 400을 확인합니다.
     - `LibraryEbookControllerTests`: `?publisher=`가 전달되는지, `validation_error`(이 API에서는 처음 생김)를 확인합니다.
   - 수용 기준: AC-7(서버 쪽), AC-4(조건 전달)
   - 확인: `./gradlew build`. `bootRun` 뒤 `curl -N "http://localhost:8080/api/v1/ebook-searches/stream?author=%EA%B9%80%EB%8B%AC"`와 `?title=a&author=b`(400)를 불러 봅니다.
   - 위험: 낮음

### 2단계: 포털 adapter 저자·출판사 (의존: 없음. 1단계와 병행 가능)

1. **검색 URL** (파일: `backend/src/main/java/com/chaekcheck/availability/internal/adapter/ElibPortalV1Adapter.java`)
   - 할 일: `searchUri`를 필드에 따라 나눕니다.
     - TITLE: 지금 그대로입니다. 1쪽은 `index.do`, 2쪽부터 `table.do`, 기본 검색입니다 [확정].
     - AUTHOR: **1쪽부터** `…/module/elib/search/table.do?menu_idx=M&type=&search_type=&author_name={q}&book_pubname=&book_year=&device=&search_text={q}&rowCount=10&viewPage=N` [확정]
     - PUBLISHER: 위와 같고 `author_name=`은 비우며 `book_pubname={q}`를 넣습니다 [확정].
     - `search_type`은 모든 경우에 빈 값입니다. `search_text`를 비우면 0건이 나오므로 항상 같은 검색어를 넣습니다.
     - `menu_idx`를 `base_url`에서 읽는 부분(강원)은 그대로 둡니다.
   - 클래스 주석의 "no title-only field" 설명에 ADR-0026 내용을 더합니다.
2. **"도서관에서 보기" 주소** [안] (파일: `backend/src/main/java/com/chaekcheck/availability/internal/adapter/PlatformAdapter.java`, `ElibPortalV1Adapter.java`, `backend/src/main/java/com/chaekcheck/availability/internal/fetch/LibraryPageFetcher.java`)
   - 지금 `LibraryPageFetcher.toPage`는 `librarySearchUrl`에 가져온 페이지의 `searchUri`를 그대로 씁니다. 그래서 포털 저자·출판사에서는 `table.do`(화면 조각)가 들어갑니다.
   - 할 일 [안]: `PlatformAdapter`에 기본 메서드(예: `librarySearchUri(baseUrl, query, fetchedUri)`)를 둡니다.
     - 기본은 받은 주소를 그대로 돌려줍니다.
     - 포털은 AUTHOR·PUBLISHER일 때 `index.do?menu_idx=M&search_text={q}` 주소를 돌려줍니다.
     - `toPage`에는 `baseUrl`을 넘겨야 합니다.
   - `detailUri`는 계속 실제로 가져온 `searchUri`를 기준으로 풉니다. `table.do`와 `index.do`는 같은 폴더라 상세 주소가 같습니다.
   - "개발 시작 전 확인"에서 `table.do`가 깨지지 않는다고 판단하면 이 항목은 하지 않고 보고만 합니다.
   - 테스트 (`backend/src/test/java/com/chaekcheck/availability/internal/adapter/ElibPortalV1AdapterTests.java`)
     - AUTHOR·PUBLISHER의 1쪽과 2쪽이 모두 `table.do`이고, `search_text`와 거르기 값이 같습니다. 다른 거르기 칸은 빈 값입니다.
     - `search_type=`은 빈 값이고 `AUTHOR`·`TITLE`·`PUBLER`가 URL 어디에도 없습니다.
     - TITLE URL이 지금과 같은지 회귀 테스트를 둡니다 (`firstPageIsIndexAndLaterPagesAreTheTableFragment` 유지).
     - 강원 `menu_idx=2`가 저자 URL에도 쓰입니다.
     - 거르기 결과 fixture를 새로 둡니다. 부산 저자 "김달" 3건, 예: `backend/src/test/resources/fixtures/elib-portal-v1/busan-table-author-p1.html` [안 이름]. 기존 fixture처럼 설명문·표지·스크립트를 지우고 저장합니다. 이 fixture로 파싱과 빈 판정(`BLANK`)을 확인합니다.
     - (2번을 하면) 포털 저자·출판사의 `librarySearchUrl`은 `index.do`이고 `detailUrl`은 지금 모양 그대로입니다.
   - 수용 기준: AC-1·AC-2(포털 부분), AC-4(포털 2쪽)
   - 확인: `./gradlew build`. `bootRun`으로 부산·대구·경기교육청에서 저자 "김달"을, 전북에서 출판사 "빅피시" 1·2쪽을 실제 조회합니다(1초 간격). 서버 로그에서 URL을 봅니다.
   - 위험: 중간
     - 공식 API가 아닙니다.
     - 사이클 02 retro에 "대구 `table.do`는 검색어와 상관없는 책을 돌려줌"이라는 [확인 필요]가 남아 있습니다. 대구 저자 검색 결과가 맞는지 꼭 확인하세요.

### 3단계: 나머지 6종 URL 테스트 + 조건별 캐시 테스트 (의존: 없음)

1. **adapter URL 테스트** (파일: `backend/src/test/java/com/chaekcheck/availability/internal/adapter/`의 `KyoboSubscriptionV1AdapterTests.java`, `Yes24V1AdapterTests.java`, `Yes24V3AdapterTests.java`, `GangnamV1AdapterTests.java`)
   - 할 일: AUTHOR·PUBLISHER URL 테스트를 더합니다.
     - 교보 구독형: `schClst=autr` / `pbcm`
     - YES24 V1·V3: `srch_order=author` / `publisher`
     - 강남구: `search=author` / `publisher`
     - YES24 V1·V3와 강남구는 검색어가 **EUC-KR 퍼센트 인코딩**인지 봅니다 (예: "김달", "빅피시").
   - `KyoboV1AdapterTests`와 `Yes24V2AdapterTests`에는 이미 테스트가 있습니다.
   - 코드 변경은 없을 것으로 봅니다(design-delta 외부 연동 표). 테스트가 실패하면 고치고 알려 주세요.
2. **조건별 캐시** (파일: `backend/src/test/java/com/chaekcheck/availability/internal/fetch/LibraryPageFetcherTests.java`)
   - 테스트: 같은 도서관·검색어·쪽이어도 TITLE "김달"과 AUTHOR "김달"은 가져오기를 두 번 합니다(캐시 공유 없음). 같은 조건으로 다시 부르면 `cached: true`입니다.
   - 참고: `CaffeineSearchPageCacheTests`에 AUTHOR 키 테스트가 이미 있습니다.
   - 수용 기준: AC-1·AC-2·AC-3의 URL 부분, AC-6
   - 확인: `./gradlew test`
   - 위험: 낮음

### 4단계: 웹 (의존: 1단계)

1. **API 타입과 요청** (파일: `web/src/api/types.ts`, `web/src/api/searchStream.ts`, `web/src/api/client.ts`)
   - `types.ts`
     - `SearchField = 'title' | 'author' | 'publisher'`를 더합니다.
     - `targets` 타입은 `query` 대신 `title?` / `author?` / `publisher?`를 가집니다.
   - `searchStream.ts`: 첫 묶음과 다음 묶음 요청 모두 `q=` 대신 `{field}=값`을 보냅니다.
   - `client.ts`: `fetchLibraryPage(libraryId, field, query, page)` 모양으로 바꿉니다 [안].
2. **주소 읽기·쓰기** (파일: `web/src/features/search/SearchPage.tsx`, 필요하면 새 `web/src/features/search/searchCondition.ts` + 테스트 [안])
   - 주소에서 `title` / `author` / `publisher`를 읽고 `q`는 읽지 않습니다.
   - 조건이 둘 이상이면 title → author → publisher 순서로 하나만 씁니다 [확정].
   - 조건이 없으면 첫 화면이고 드롭다운은 제목입니다.
   - 검색하면 `/search?author=김달`처럼 씁니다. `filter`와 `scope`는 지금처럼 유지합니다.
3. **검색창 드롭다운** (파일: `web/src/features/search/SearchForm.tsx` + CSS 모듈)
   - 알약 모양 입력창 **안 왼쪽**에 제목 / 저자 / 출판사 드롭다운을 둡니다 [확정]. 기본은 항상 제목입니다 [확정].
   - 안내 문구 [안]: "책 제목을 입력하세요" / "저자 이름을 입력하세요" / "출판사 이름을 입력하세요"
   - 숨긴 label은 고른 조건 이름으로 둡니다 [안]. 지금 `id="q"`, `name="q"`, `q-error`는 이름만 바꿔도 됩니다 [안].
   - 결과가 보이는 상태에서 드롭다운을 바꾸면
     - 입력창 글자가 정규화 후 2~50자이면 검색 버튼 없이 바로 새 조건으로 검색합니다(주소 변경) [확정].
     - 2자 미만이면 요청 없이 입력 오류 문구만 보이고 이전 결과는 그대로 둡니다 [안].
   - 검색 전 화면에서는 안내 문구만 바뀝니다 [안].
   - 모바일(1024px·640px 이하)도 같은 한 줄입니다. 드롭다운은 짧은 이름만 보여 입력 칸 폭을 지킵니다 [안].
4. **검색 상태** (파일: `web/src/features/search/useSearch.ts`)
   - 옵션과 다시 검색하는 기준(effect 의존 값)에 조건을 넣습니다. 조건이 바뀌면 계획과 모든 묶음을 버리고 첫 묶음부터 시작합니다.
   - 다음 묶음(`loadMore`)과 도서관별 더 보기(`fetchLibraryPage`)에 상태의 조건을 넘깁니다.
   - `invalid_region` 재시도를 막는 `retriedFor`는 조건 + 검색어로 비교합니다 [안].
   - `searchPlan.ts`, `rowVerdict.ts`, `sortBatch.ts`는 바꾸지 않습니다.
5. **결과 없음 문구** (파일: `web/src/features/search/SearchPage.tsx` 157행 근처)
   - 제목: "조회한 도서관 N곳에 이 제목의 전자책이 없습니다" (지금 그대로)
   - 저자: "… 저자 '김달'의 전자책이 없습니다" [안 문구]
   - 출판사: "… 출판사 '빅피시'의 전자책이 없습니다" [안 문구]
   - `BatchSection.tsx`의 "지금까지 N곳에서 찾지 못했습니다"는 그대로 둡니다.
   - 테스트 (Vitest)
     - 주소: 조건 하나, 없음, 둘 이상(title > author > publisher), `?q=`만 있으면 첫 화면
     - `useSearch`: 조건 변경 → 모든 묶음을 버리고 첫 묶음. 다음 묶음·도서관별 더 보기 요청에 조건이 들어감
     - 새 `SearchForm.test.tsx`: 결과 있을 때 조건 변경 → 바로 검색 / 2자 미만 → 요청 없음과 오류 문구 / 검색 전 → 문구만 바뀜
     - `searchStream`·`client`가 만드는 요청 주소에 `q=`가 없음
   - 수용 기준: AC-5, AC-7(화면 쪽), AC-1·AC-2의 화면
   - 확인: `npm run build`, `npm test`. Playwright MCP로 데스크톱 1280 → 태블릿 → 모바일(breakpoint 1024/640) 순서로 봅니다.
   - 위험: 중간 (드롭다운 변경과 다시 검색 사이의 상태)

### 5단계: 사이클 02 테스트·문서의 `q=` 고치기 (의존: 1·4단계. 각 단계와 함께 해도 됨)

- 백엔드: `EbookSearchStreamControllerTests.java`(11곳), `LibraryEbookControllerTests.java`(9곳)의 `q=`를 `title=`로 바꿉니다. `targets`의 `query` 확인은 `title`로 바꿉니다.
- 백엔드: `FetchServiceSiteFetcherTests.java`의 `https://lib.test/search?q=x`는 도서관 쪽 가짜 주소이므로 **고치지 않습니다**.
- 웹: `ErrorBoundary.test.tsx`(`/search?q=a`, `?q=b`), `useSearch.test.ts`를 고칩니다. `SearchForm.tsx`와 `SearchPage.tsx`의 `?q=` 주석도 고칩니다. 나머지 테스트(`LibrarySummaryBar`, `ResultRow`, `searchPlan`)는 `targets.query`나 `fetchLibraryPage` 인자를 쓰는지 보고 맞춥니다.
- dev 문서: `docs/library-maintenance.md` 423행(`stream?q=`)과 426행(`ebooks?q=`)을 `title=`로 바꿉니다.
- 확인: `backend/`에서 `grep -rn "q=" src/test`를 돌려 남은 것이 도서관 쪽 주소뿐인지 봅니다. `./gradlew build`, `npm test`, `npm run build`
- 위험: 낮음

## 테스트

- 단위
  - 백엔드: `SearchConditionParam`, 포털과 나머지 6종 adapter URL(EUC-KR 포함), 포털 거르기 fixture 파싱
  - 웹: 주소 규칙, `useSearch` 초기화와 조건 전달, `SearchForm` 조건 변경
- 통합(모듈): `ModularityTests`(verify, 모듈 의존 변화 없음), `DocumentationTests`, 컨트롤러 3개 테스트(스트림을 열기 전의 400), `LibraryPageFetcherTests`(조건별 캐시)
- 실제 사이트와 서버 로그: 요청은 수동으로 적게 보내고 1초 간격을 지킵니다.
- 화면: Playwright MCP, 데스크톱 먼저 봅니다.

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 저자 검색 URL·결과 (포털은 정확히 일치) | adapter URL 테스트 + 포털 fixture + 실제 조회 로그 + 화면 | 2, 3, 4 |
| AC-2 출판사 검색 URL·결과, 포털에 `search_type=AUTHOR/PUBLER` 없음 | adapter URL 테스트 + 로그 + 화면 | 2, 3, 4 |
| AC-3 제목은 사이클 02와 같음 | 기존 URL 테스트(회귀) + 로그 | 2, 3, 5 |
| AC-4 저자 검색의 두 종류 "더 보기"(포털 2쪽 포함) | 다음 묶음·도서관별 컨트롤러 테스트 + `useSearch` 테스트 + 로그(page=2, `table.do` + `author_name`) | 1, 2, 4 |
| AC-5 드롭다운 변경 시 바로 다시 검색, 새로고침 유지 | `SearchForm`·`useSearch` 테스트 + Playwright | 4 |
| AC-6 조건별 캐시 | `LibraryPageFetcherTests` + API 응답 `cached` | 3 |
| AC-7 조건 없음·둘 이상 400, 1자·51자 | `SearchConditionParamTests` + 컨트롤러 테스트 + 화면 입력 오류 | 1, 4 |
| AC-8 호출 예의 | 기존 throttle·캐시 테스트 + 로그(같은 호스트 ≥ 1초, User-Agent) | 변경 없음, 2단계 실제 조회 때 로그 확인 |

## 완료 기준

- [ ] 사이클 02 마무리 4항목(Vitest 기록, 다시 빌드, AC-1~24 확인표, `library-maintenance.md` 세 곳)
- [ ] spec 7장 AC-1~AC-8을 위 표의 방법으로 모두 확인함
- [ ] `backend/`에서 `./gradlew build` 통과 (`ModularityTests` verify 포함, `availability → library → region` 외 의존 없음)
- [ ] `web/`에서 `npm run build`와 `npm test` 통과, Playwright로 데스크톱·태블릿·모바일 확인
- [ ] 저장소의 테스트·문서에 우리 API를 `q=`로 부르는 곳이 없음
- [ ] 측정 결과, "[안] 값 목록"에서 바꾼 것, "[확인 필요]" 결과를 `docs/plan-feedback.md` `# 사이클 03` 절에 정리해 사용자에게 전달함

## [안] 값 목록 (dev가 바꿀 수 있음. 바꾸면 알릴 것)

- 클래스·파일 이름
  - `SearchConditionParam`, 포털 "도서관에서 보기" 메서드 이름
  - 새 fixture 이름, 웹 `searchCondition.ts`
  - `fetchLibraryPage` 인자 모양
- 오류
  - `errors[].code` 값 `required` / `too_many` / `duplicate`
  - `required`일 때 `field` 값(`title`), 문구
  - `too_many`는 파라미터마다 한 줄
  - 검증 순서: 조건 → `filter` → `scope` → 지역
- `targets`: 쓰지 않는 조건 칸을 생략하는 방식
- 포털 `librarySearchUrl`: 저자·출판사일 때 `index.do?search_text=`로 엽니다.
- 웹 규칙
  - 검색 전에 드롭다운을 바꾸면 문구만 바뀝니다.
  - 결과가 있을 때 2자 미만이면 오류 문구만 보이고 이전 결과는 그대로 둡니다.
  - 모바일 드롭다운은 짧은 이름만 보입니다.
  - 입력창 id·name, 숨긴 label 문구
- 문구
  - 안내 문구 "저자 이름을 입력하세요", "출판사 이름을 입력하세요"
  - 결과 없음 "… 저자 '…'의 전자책이 없습니다", "… 출판사 '…'의 전자책이 없습니다"

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 막는 단계 |
|---|---|---|
| 포털 저자·출판사 검색을 1쪽부터 `table.do`로 부르면, 목록 판정 칸이 비는 포털(부산·대구·경기교육청)의 상세 요청이 얼마나 늘고 30초 안에 끝나는지 | 프로토타입 (dev 실측, 사이클 02 방식) | 2 |
| 포털 저자 표기("김달 저", 공저 "A, B")가 거르기 값과 달라 빠지는 책이 얼마나 되는지 | 호출 시험. 저자 몇 명으로 기본 검색과 거르기 결과를 비교 | 없음 (정확히 일치는 사용자 결정) |
| `table.do` 주소를 "도서관에서 보기"로 열면 모양이 깨지는지 | 브라우저로 직접 열어 봄 | 2 |
| 대구 포털 `table.do`가 검색어와 관계없는 책을 돌려주는지 (사이클 02 retro) | 저자·출판사 실제 조회 결과 확인 | 2 |
| `validation_error`의 `errors[].field` 값과 문구, 검증 순서 | dev가 정하고 보고 | 1 |

## 이번에 하지 않는 것

- 여러 조건 AND 검색, 여러 조건 주소를 AND로 해석하기 (지금은 title > author > publisher로 하나만 씀)
- 옮긴이 검색. YES24 저자 칸의 옮긴이를 걸러 내거나 따로 안내하는 것
- 옛 `?q=` 주소를 바꿔 주는 처리, 마지막에 쓴 조건 기억하기
- ISBN·키워드·분야 등 다른 조건. 저자 표기 통일, 자동 완성, 최근 검색어
- `titleKey`에 저자·출판사 넣기, 같은 책 묶기(ISBN), 조건별 결과 순서
- 포털 결과의 오디오북 거르기
- 읽는 코드가 없는 화면 7종 추가, 느리거나 실패하는 도서관 기억하기, `targets` 크기 줄이기, 회원
- `library`·`region`·`fetch-service/` 변경, 테이블·Liquibase 변경

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 `# 사이클 03` 절에 **무엇이 달라졌는지와 이유**(사용자 발언이면 그대로)를 적습니다.

- 측정
  - 포털 저자·출판사 검색에서 늘어난 상세 판정 요청 수와 걸린 시간. 부산·대구·경기교육청을 각각, 같은 검색어의 제목 검색과 비교합니다. 30초 안에 끝났는지도 적습니다.
  - 정확히 일치 때문에 빠진 포털 책 수. 저자 몇 명으로 기본 검색 건수와 거르기 건수를 비교하고, "김달 저"나 공저 같은 표기 예를 적습니다.
  - `table.do`를 "도서관에서 보기"로 열었을 때 모양이 깨지는지와 고른 방식
  - 대구 `table.do` 저자·출판사 결과가 검색어와 맞는지
- 정한 값: `errors[].field`와 문구, 검증 순서, 도우미·메서드 이름, 문구 최종안
- `[안]`으로 구현했거나 바꾼 것 ("[안] 값 목록" 기준)
- 설계와 달라진 점: 나머지 6종 adapter에 코드 변경이 필요했는지, `InvalidParamException`을 넓힌 방식, 웹 상태 구조 변경
- 새로 알게 된 제약: 사이트별 저자·출판사 검색의 이상 동작, 응답 시간 변화
- 사이클 02 마무리 결과: Vitest 통과 수, 다시 빌드한 크기, AC-1~24 확인표의 위치
