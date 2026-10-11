# 개발 인계서: 사이클 10 인기 도서 (분야별 판매 순위 → 내 도서관 전자책)

- 승인: [확정] (사용자 승인, 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-handoff-review.html` #2 "넘김", #1은 "앞의 3곳만 확인"으로)
- **시작 조건** [확정] (사용자 승인, 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-sequential-decision.html`)
  - 사이클 09 dev가 끝나고 **커밋된 뒤에** 시작합니다(사용자 보고: dev 871fbd4, 2026-10-12). 작업 폴더도 같고 로컬 DB·포트도 같으며, worktree는 따로 만들지 않습니다.
  - plan이 이 인계서를 `docs/current/handoff.md`에 바꿔 넣으며 `docs/current/`(module-map·data-model·api·flows)에 `popular`를 "설계됨(미구현, 사이클 10)"으로 합쳤습니다(2026-10-12). 개발 기준은 아래 `design-delta.md`입니다.

## 요약

새 모듈 `popular`가 하는 일:
- 출판유통통합전산망(bnk.kpipa.or.kr)에서 지난달 순위를 매달 받습니다. 대상은 "전체" + 16분류, 분류마다 Top50입니다.
- 분류별 판매 부수 16건도 함께 받아 분류 순서를 정하고, 작은 표지는 미리 받아 둡니다.
- 받은 값은 `popular` 스키마의 표 다섯 개에 저장하고, 화면용 API 두 개(`GET /api/v1/popular-books`, `GET /api/v1/popular-books/covers/{coverId}`)로 내보냅니다.

`catalog`에는 공개 API `BookLookup.byIsbn13` 하나를 더하고, `availability`의 소장 대출 스트림에 "계획 순서로 앞의 N곳만" 옵션(`holdingLimit` [안 이름])을 더합니다. 순위 책과 우리 책은 저장하지 않고 볼 때 ISBN으로 맞춥니다. 책 정보는 10분마다 새로 고치는 공용 캐시에 둡니다.

웹에서 하는 일:
- 머리에 "인기 도서" 링크를 더하고, 설명 글 "전자도서관 대출 가능 확인"을 지웁니다.
- 새 화면 `/popular`(S13)를 만듭니다. 3×3 표지 격자, 좌우 세모, 아래로 내리면 다음 분류가 이어지는 구조입니다.
- 분류 목록(S13c), 도움말(S13i), 가운데 창(S14), 신청 안내(S15)를 만듭니다. 폰에서는 이 네 창이 모두 사이클 08의 아래 창(BottomSheet)을 함께 씁니다.

순위·표지는 이용 허락 답을 기다리지 않고 배포할 수 있습니다(사용자 결정, 2026-10-12, 아래 C5).

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다.
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) **조용히 바꾸지 말고** 먼저 사용자에게 알립니다. 내용과 이유는 dev `docs/plan-feedback.md`의 **새 `# 사이클 10` 절**에 적습니다. 사용자 발언이면 그대로 옮깁니다.
- `[안]`·`[안 이름]`·`[안 경로]`로 표시한 것은 dev가 코드에 맞춰 바꿀 수 있습니다. 바꾸면 `# 사이클 10` 절에 알리기만 합니다.
  - 해당 예: `popular` 안쪽 패키지·클래스 이름, changelog 파일 이름, 웹 컴포넌트 이름, 픽스처 파일 이름, 환경 변수 이름, 캐시 새로 고침 설정 키 이름
  - **바꾸지 않는 이름** [확정] (design-delta, 사용자 승인 2026-10-11): 모듈 `popular`, 스키마 `popular`, 표 `fetch_run`·`ranking_month`·`ranking_category`·`ranking_entry`·`cover`와 그 칸 이름, `fetch_run.status` 값 `SUCCEEDED`·`FAILED`, `trigger` 값 `STARTUP`·`SCHEDULED`, `failure_reason` 값 `session_failed`·`request_rejected`·`format_changed`·`too_few_books`·`network_error`, 공개 API `BookLookup.byIsbn13(Collection<String>) → List<IsbnBook(String isbn13, long bookId, long[] libraryIds)>`, 설정 `chaekcheck.popular.fetch.enabled`, enum `PopularCategory`, 경로 `/api/v1/popular-books`·`/api/v1/popular-books/covers/{coverId}`, 오류 코드 `cover_not_found`, 응답 칸 `month`·`fetchedAt`·`categories[].code·name·books[]`·`rank`·`title`·`coverUrl`·`bookId`·`available`, 화면 경로 `/popular`
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 확정된 것처럼 코드에 넣지 말고 `TODO(확인 필요)`로 둔 뒤, 확인하고 보고합니다.
- **새 의존성은 없습니다.**
  - HTTP는 `java.net.http.HttpClient`를 쓰고, HTML은 이미 있는 Jsoup 1.23.2(`backend/build.gradle:23,49`)로 읽습니다.
  - 테스트용 가짜 서버가 필요하면 JDK `com.sun.net.httpserver.HttpServer`나 직접 만든 가짜 구현을 씁니다. WireMock 등이 필요해지면 먼저 사용자 승인을 받습니다.
- 단계마다 아래 확인을 통과해야 다음 단계로 넘어갑니다.
  - 백엔드: `backend/`에서 `./gradlew build` (`ModularityTests`의 `ApplicationModules.of(ChaekcheckApplication.class).verify()`, `DocumentationTests` 포함)
  - 웹: `web/`에서 `npm test`, `npm run build`, `npm run lint`
- **구현 기준은 `design-delta.md`입니다.** `architect-proposal.md`는 기록일 뿐입니다. 특히 받기 기록을 쓰는 순서(아래 4단계)는 design-delta의 "받기 기록 쓰는 순서"를 따릅니다.
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), 사이클 05~09 인계서의 제약을 그대로 따릅니다. 아래에는 이번에 더하거나 바뀌는 것만 적습니다.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/10-popular-books/design-delta.md`: **기준 문서**. 모듈 표, 판단 규칙 `shouldFetch`, 설정 값, 데이터 표·제약, 받기 기록 쓰는 순서, 지우기 규칙, API와 응답 예시, 웹, 외부 연동, 확인 필요
- `.../10-popular-books/spec.md`: R1~R7, 상태별 동작, AC-1~AC-21, 비목표
- `.../10-popular-books/flow.md`: S13·S13c·S13i·S14·S15, "폰 아래 창 공통", 화면 크기별 배치, 상태
- `.../10-popular-books/scope.md`: "이미 정한 것", "개발 순서와 인계", "사이클 08 중간 요약에서 맞춰 볼 것", "사이클 08 retro·09 인계·11 초안에서 맞춰 본 것"
- `../chaekcheck-plan/docs/research/popular-books/kpipa.md`
  - 2절: 세션 GET → `JSESSIONID` + `m_sCsrf`, POST 헤더·본문, 선택자, 1단계 분류 ID 표
  - 2-1절: 판매 부수 POST, `dataX1`, 202609 부수
  - "토큰 하나로 두 화면", "당월 값과 지난달 값"
  - 4절: 일치율 27.8%
- ADR (`../chaekcheck-plan/docs/adr/`): 0072, 0073, 0074, 0075, 0077
- `../chaekcheck-plan/docs/cycles/08-polish-swap-memory/retro.md`: 바텀 시트 유지, 힙 512MB, 바꿔 끼우기 `lock_timeout` 2초
- `../chaekcheck-plan/docs/cycles/09-library-naming/handoff.md`·`retro.md`: S3 도서관 줄(`ResultRow`)에 분류 글자가 붙은 상태. S14가 그 줄을 그대로 씁니다

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0072 | 출처는 출판유통통합전산망 공개 통계 화면(순위 + 분류별 판매 부수)이고, 매달 한 번 우리 서버가 받습니다. 회원 전용 Open API는 쓰지 않습니다. 받는 범위 "21분류"는 0077이 16분류로 바꿨습니다. "화면 게시 허락은 공개 전까지 이용 문의로 받는다"는 2026-10-12 사용자 결정으로 "허락 답 없이 배포"로 바뀌었습니다(scope "개발 순서와 인계") |
| 0073 | 새 모듈 `popular`(스키마 `popular`, 표 다섯 개)를 만들고 `allowedDependencies = {"catalog", "library"}`로 둡니다. 새 이벤트는 없습니다. 자기 스케줄링으로 매일 05:00(KST)과 서버가 켜질 때 받을지 따집니다 |
| 0074 | 짝은 저장하지 않습니다. `BookLookup.byIsbn13`로 찾고, 그달 순위와 ISBN별 책 정보는 공용 캐시 한 벌에 둡니다(10분마다, 그리고 새 달 저장 뒤 바로 새로 고침). 이용자별 계산은 캐시하지 않습니다. 제목으로는 맞추지 않습니다 |
| 0075 | 작은 표지(`s_<id>.jpg`)를 2초 간격으로 미리 받아 `popular.cover`에 저장하고 우리 주소로 넘겨줍니다. CSP는 바꾸지 않습니다. 최근 두 달에 쓰인 표지만 남깁니다. 몇 장이 실패해도 그달 순위는 성공으로 둡니다 |
| 0077 | 만화·어린이·청소년·기타·의학·스포츠는 받지도 보이지도 않습니다. 한 달 요청은 35건 이하, 표지는 첫 달 최대 850장(약 28분), 저장은 두 달 약 90MB, 캐시는 ISBN 최대 850개입니다 |

## 지켜야 할 제약

- **C1. 모듈 경계** [확정]
  - 새 모듈은 `popular` 하나이고 `@ApplicationModule(allowedDependencies = {"catalog", "library"})`로 둡니다.
  - `popular`에는 Java 공개 API가 없습니다(REST만 둠). 다른 모듈은 `popular`에 기대지 않습니다.
  - `catalog`에는 공개 인터페이스 `BookLookup` 하나만 더합니다. `availability`는 소장 대출 스트림에 선택 파라미터 하나만 더합니다(모듈 의존은 그대로).
  - JPA 엔티티는 두지 않고 `JdbcClient`를 씁니다. 다른 모듈 스키마와 FK·조인을 두지 않고, `catalog`와는 `isbn13` 값으로만 이어집니다.
  - Kafka·Kubernetes·서비스 나누기는 하지 않습니다.
- **C2. Liquibase는 새 파일만** [확정]
  - 이미 적용된 changeset은 고치지 않습니다.
  - 로컬 `db`·`db-test`는 초기화하지 않습니다.
  - `updated_at` 칸이 없으므로 트리거도 없습니다(ADR-0068 대상 아님).
  - 문자열에 세미콜론이 들어갈 수 있는 `sql` change는 `splitStatements: false`를 씁니다(사이클 09 retro "새로 알게 된 제약").
- **C3. 테스트는 진짜 사이트를 부르지 않습니다** [확정]
  - 저장해 둔 HTML 픽스처와 가짜 전송(서버)만 씁니다.
  - `chaekcheck.popular.fetch.enabled`는 다음 세 곳에서 false입니다: `collection-import` 프로필, 테스트(`application-test.yml`), 로컬 개발(`.env`). 기본값은 true입니다. 로컬에서는 받기를 시험할 때만 켭니다 (사용자 승인, 2026-10-12, `easy/2026-10-12-sequential-decision.html`).
  - 받기를 켠 채 테스트하는 클래스는 그 클래스 안에서만 켜고, 가짜 전송을 넣습니다.
- **C4. 예의 바른 받기** [확정]
  - `bnk.kpipa.or.kr`로 가는 모든 요청(세션 GET, 순위·부수 POST, 표지 GET) 사이에 **2초 이상** 간격을 둡니다. 한 번에 하나씩, 단일 스레드로 보냅니다.
  - 한 번 받기의 비표지 요청은 **35건 이하**입니다(세션 1~2 + 순위 17 + 부수 16).
  - User-Agent는 `chaekcheck (+<서비스 주소>)`입니다. 주소는 배포 때 정하므로 `TODO(확인 필요)`로 둡니다.
  - 연결 5초, 읽기 10초 [확정 값, 측정 뒤 조정 가능].
  - 조회 서버(GET만 받는 곳)와 2단계 세부분류는 부르지 않습니다.
  - 한 번 받는 동안 같은 요청을 다시 보내지 않습니다 [안]. 실패하면 다음 날 다시 받습니다(R1-3).
- **C5. 배포와 게시 허락** [확정] (사용자: "허락 답 없이 올리자", "어차피 책 표지는 검색하면 그냥 다 나오는 거니까 올려도 된다고 봐", 2026-10-12): 순위·표지는 이용 허락 답을 기다리지 않고 배포할 수 있습니다. 이용 문의 메일은 사용자가 보낼 수 있고, 답이 오면 출처 문구·표지 사용을 그 답에 맞춥니다. 운영 배포 자체는 이 사이클 범위 밖(배포 사이클)입니다.
- **C6. 폰 아래 창은 사이클 08 `BottomSheet`를 씁니다** [확정]
  - 손잡이 끌어내리기·ⓧ·바깥 누름으로 닫힙니다. 필요하면 공용 컴포넌트로 뽑아냅니다.
  - **검색 설정 창(`SettingsPanel`)에 ⓧ를 더하는 일은 이번 범위가 아닙니다**(plan backlog). 뽑아낸 뒤에도 검색 설정 창의 동작과 모양은 그대로여야 합니다.
- **C7. 바깥 HTML은 믿지 않는 입력입니다** [안]
  - Jsoup으로 글자(`text()`)와 속성 값만 꺼내고, HTML 조각은 저장하지 않습니다.
  - 표지 경로는 같은 사이트의 상대 경로(`/files/isbn/`로 시작, `..`·`//`·스킴 없음)만 받습니다. 나머지는 `cover_path` NULL로 둡니다(그 책은 제목 글자로 보임).
  - 웹에서 `dangerouslySetInnerHTML`을 쓰지 않습니다.
- **C8. 바꿔 끼우기와 부딪힘**: 사이클 08의 `catalog` 바꿔 끼우기 중에는 `byIsbn13`가 최대 `lock_timeout` 2초 기다릴 수 있습니다. 캐시 새로 고침이 실패하면 **앞 캐시를 그대로 두고** 경고 로그만 남깁니다 [안].
- **C9. 예약 스레드**: Spring 기본 예약 스레드는 하나이고 `RefreshTokenCleanup`(04:00)과 함께 씁니다. 받기(표지까지 최대 약 28분)는 **`popular` 자기 단일 스레드 실행기**에서 돌려 예약 스레드를 막지 않습니다. 겹침은 `AtomicBoolean`으로 막습니다 [확정] (설계 #7).

- **C10. 표지 저작권 대응** [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-cover-copyright.html`): 서비스 안내 화면(`/about`)에 "인기 도서 순위·표지는 출판유통통합전산망 자료, 표지 게시를 원하지 않는 권리자는 [연락처]로" 문구(연락처는 배포 때, `TODO(확인 필요)`). 요청 오면 그 표지를 지워 제목 글자로(방법은 운영 메모에). 표지는 작은 그림(`s_`)만, 큰 그림·확대 보기는 만들지 않음. 근거 `docs/research/popular-books/cover-copyright.md`

## 개발 시작 전 확인

### dev가 확인할 것
- [ ] 사이클 09 dev 변경이 커밋되었는지 봅니다(`git status` 깨끗, `library/014` 포함). 사이클 10은 그 위에서 시작합니다.
- [ ] base package는 `com.chaekcheck`입니다(dev `CLAUDE.md`). 새 모듈 패키지는 `com.chaekcheck.popular`입니다 [확정].
- [ ] master의 마지막 include가 무엇인지 봅니다(plan 2026-10-12 읽기: `library/014-library-classification.yaml`, `db.changelog-master.yaml:78-80`). `popular/001`은 그 뒤에 둡니다.
- [ ] `ResultRow`(S3 도서관 줄)가 사이클 09 뒤의 모양인지 봅니다(이름 다음 줄에 분류 글자). S14는 이것을 그대로 씁니다.
- [ ] `book-availabilities/stream`이 계획 순서대로 소장을 묶음(`row-limit` 20)에 넣는 코드를 봅니다. 5단계 다음 "5-1단계"의 `holdingLimit`을 그 순서 앞에서 자르게 둡니다.

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 이용 문의 메일 보내기(초안 `easy/2026-10-11-followup-decisions.html` 3번 카드), 원하면 | 아무 때나 | 답이 오면 plan에 알림. 답을 기다리지 않고 배포 가능(C5) |
| 로컬 받기 시험 때 User-Agent의 `<서비스 주소>` 자리에 무엇을 넣을지 | 8단계 전 | 값, 또는 "비워 두고 `chaekcheck`만" |
| 픽스처를 받으려고 진짜 사이트를 한 번 부르는 것(요청 3건, 2초 간격) 확인 | 0단계 | 승인 |
| 화면 확인: 3×3 격자, 작은 표지 화질, 흐림 정도, S14·S15 문구(S15 문구는 "화면 단계에서 다시 봄") | 8단계 | 바꿀 점 |
| 측정 결과 확인(인기 도서 API p95, 표지 응답, 캐시 메모리) | 8단계 뒤 | 받아들임 / 다른 방법 |

## 구현 단계

### 0단계: 픽스처 받기 (코드 변경 없음, 의존: 없음)

1. **사이트 응답 저장** (파일: `backend/src/test/resources/fixtures/kpipa/` [안 경로], 기존 `fixtures/<site>/` 관례)
   - 할 일: 사용자 승인 뒤 손으로 한 번만 받습니다. 요청 사이는 2초 이상입니다.
     - `adiStatsCtgSaleRank` 화면 GET: `m_sCsrf`와 분류 링크 `a[data-name="searchCtg"]`를 확인하는 용도
     - 순위 POST 1건: "전체" 또는 소설, `txtDate`=지난달
     - 판매 부수 POST 1건: 소설
   - 이름 예 [안]: `rank-page.html`, `rank-search-all.html`, `sales-count-novel.html`
   - 저장한 순위 조각을 손으로 줄여 다음 시험용 파일을 만듭니다: 49권(`too_few_books`), `.book-grid-item`이 없는 꼴(`format_changed`), ISBN이 비었거나 틀린 책(`missing_isbn_count`), `dataX1`이 없는 부수 응답(`format_changed`)
   - 이유: C3. 테스트가 진짜 사이트를 부르지 않게 합니다.
   - 확인할 것: 작은 표지 경로가 `img`의 `src`에 `s_<id>.jpg`로 있는지, 아니면 `data-originalsrc`에서 만들어야 하는지 [확인 필요] (조사 문서 "당월 값과 지난달 값" 마지막 줄)
   - 위험: 낮음

### 1단계: `catalog` 공개 API `BookLookup.byIsbn13` (의존: 없음)

1. **인터페이스** (파일: `backend/src/main/java/com/chaekcheck/catalog/BookLookup.java`, 같은 곳에 `IsbnBook` record [안 위치])
   - 할 일: `List<IsbnBook> byIsbn13(Collection<String> isbn13s)`. `IsbnBook(String isbn13, long bookId, long[] libraryIds)`. 맞는 책이 없는 ISBN은 결과에서 빠집니다. 빈 입력은 빈 목록입니다.
   - Javadoc: "ADR-0074, 인기 도서가 ISBN으로 우리 책을 찾음. `libraryIds`는 `catalog.book.library_ids` 그대로(꺼진 도서관이 섞일 수 있음, 쓰는 쪽이 계획과 겹치는지 봄)"
   - 위험: 낮음
2. **구현** (파일: `backend/src/main/java/com/chaekcheck/catalog/internal/JdbcBookLookup.java` [안 이름], `JdbcCatalogHoldings`와 같은 꼴)
   - 할 일: `SELECT id, isbn13, library_ids FROM catalog.book WHERE isbn13 = ANY(CAST(:isbns AS text[]))`. UNIQUE `book_isbn13_key`를 씁니다. 입력은 중복을 없애고, `^97[89][0-9]{10}$`에 맞지 않는 값은 보내지 않습니다 [안].
   - 위험: 낮음
3. **`catalog/package-info.java` Javadoc**에 "ISBN으로 책 찾기(인기 도서)" 한 줄을 더합니다.
- 테스트: `BookLookupTests` [안 이름] (`@SpringBootTest @Transactional`, `db-test`): 맞는 ISBN → 번호·`libraryIds`, 없는 ISBN → 빠짐, 빈 입력 → 빈 목록, 같은 ISBN 두 번 → 한 줄, 850개 입력도 한 번 질의
- 위험: 낮음

### 2단계: `popular` 뼈대, 스키마, 분류 상수, 설정 (의존: 1단계)

1. **모듈 선언** (파일: `backend/src/main/java/com/chaekcheck/popular/package-info.java`)
   - `@ApplicationModule(allowedDependencies = { "catalog", "library" })`. Javadoc에 책임(받기·예약·표지·공용 캐시·REST)과 ADR-0072~0075·0077을 적습니다.
   - 안쪽 패키지 [안]: `internal/fetch`, `internal/schedule`, `internal/store`, `internal/cache`, `internal/web`
   - 위험: 낮음
2. **Liquibase** (파일: `backend/src/main/resources/db/changelog/popular/001-popular-schema.yaml` [안 경로], master 맨 뒤에 `# cycle 10` 주석과 include)
   - `CREATE SCHEMA popular`: 다른 모듈 001과 같은 방식
   - 표·칸·제약은 design-delta "데이터" 표 그대로:
     - `fetch_run`: identity PK, `target_month` CHECK 1일, `trigger`·`status`·`failure_reason` CHECK, "`FAILED`일 때만 `failure_reason` NOT NULL" CHECK, 셈 칸 다섯 개 NOT NULL DEFAULT 0 `>= 0`, 색인 `(target_month, started_at)`
     - `ranking_month`: PK `target_month`, FK `fetch_run_id` NOT NULL, `fetched_at`
     - `ranking_category`: PK `(target_month, category_code)`, FK `ranking_month` ON DELETE CASCADE, `sales_copies`(`ALL`이면 NULL, 아니면 `>= 0`), `display_order` 0..16, UNIQUE `(target_month, display_order)`
     - `ranking_entry`: PK `(target_month, category_code, rank)`, FK `ranking_category` ON DELETE CASCADE, `rank` 1..50, `isbn13` NULL CHECK `^97[89][0-9]{10}$`, `title` NOT NULL, `thema` NULL, `cover_path` NULL이며 `/`로 시작
     - `cover`: identity PK, `source_path` NOT NULL UNIQUE, `content_type` NOT NULL, `image bytea` NOT NULL, `byte_size >= 0`, `fetched_at`
   - YAML이 지원하지 않는 CHECK는 raw `sql` change로 씁니다(사이클 09와 같은 방식).
   - 제약 이름은 `postgres-patterns` 스킬 관례로 짓고 [안 이름], 보고합니다. 칸 이름 `rank`·`trigger`는 PostgreSQL 예약어가 아니므로 그대로 둡니다. 쓰는 데 문제가 있으면 보고합니다 [안].
   - 파일 머리 주석에 사이클 10, ADR-0073·0075, "저자 칸 없음"
   - 위험: 낮음
3. **분류 상수** (파일: `popular/internal/PopularCategory.java` [안 위치]) [확정] (설계 #4, ADR-0077)
   - 17개. `code`(`ALL` 또는 20자리 사이트 ID), `siteId`(전체는 빈 값), `shortName`. 사이트 ID는 조사 문서 2절 표에서:

     | shortName | siteId |
     |---|---|
     | 전체 | (빈 값, code `ALL`) |
     | 소설 | 00000000000000000303 |
     | 문학·인물 | 00000000000000000223 |
     | 사회 | 00000000000000000449 |
     | 언어 | 00000000000000000178 |
     | 철학·종교 | 00000000000000001621 |
     | 경제·경영 | 00000000000000000721 |
     | 자기계발 | 00000000000000002344 |
     | 예술 | 00000000000000000001 |
     | 컴퓨터·IT | 00000000000000002169 |
     | 생활·취미 | 00000000000000002476 |
     | 과학 | 00000000000000001443 |
     | 역사 | 00000000000000001381 |
     | 기술·공학 | 00000000000000001991 |
     | 법 | 00000000000000000876 |
     | 참고·정보 | 00000000000000000408 |
     | 지리·환경 | 00000000000000001782 |

   - 뺀 것: 의학 1155, 스포츠 1861, 만화 2725, 어린이·청소년 2766, 기타 9999...9
   - 0단계 화면 픽스처의 링크 이름으로 한 번 대조하고, 다르면 멈추고 보고합니다.
   - 위험: 낮음
4. **설정** (파일: `application.yml`, `application-collection-import.yml`, `backend/src/test/resources/application-test.yml`, `.env.example`)
   - `chaekcheck.popular.fetch.enabled: ${CHAEKCHECK_POPULAR_FETCH_ENABLED:true}`. 키 이름 [확정], 환경 변수 이름 [안]
   - 나머지 값은 design-delta "설정"대로, 키 위치는 `chaekcheck.popular.fetch.*` [안 위치]: `cron: "0 0 5 * * *"` [확정], `zone: Asia/Seoul`, `request-interval: 2s` [확정], `connect-timeout: 5s`, `read-timeout: 10s` [확정 값], `base-url: https://bnk.kpipa.or.kr` [확정], `user-agent: "chaekcheck (+<서비스 주소>)"`(주소 자리는 `TODO(확인 필요)` 주석, 지금 `availability.user-agent` 주석과 같은 꼴)
   - 캐시 새로 고침 간격 `10m` [확정 값], 키 이름 [안] (예: `chaekcheck.popular.cache.refresh-interval`)
   - `collection-import` 프로필과 `application-test.yml`에는 `enabled: false`. `.env.example`에는 `CHAEKCHECK_POPULAR_FETCH_ENABLED=false`와 설명 한 줄("로컬은 꺼 둠, 받기 시험 때만 true")
   - 설정 클래스: `popular/internal/PopularProperties.java` (`@ConfigurationProperties`) [안 이름]
   - 위험: 낮음
5. **`ModularityTests`**: `dependencyDirections()`에 `assertThat(dependenciesOf("popular")).containsExactlyInAnyOrder("catalog", "library")`. 다른 모듈이 `popular`에 기대지 않음도 확인
- 테스트: `./gradlew build`, `PopularSchemaTests` [안 이름]: `failure_reason` 위반 두 경우, `rank` 0·51, `display_order` 17, 같은 달 같은 `display_order`, 틀린 `isbn13`, `/`로 시작하지 않는 `cover_path`, 같은 `source_path` 모두 위반, `ranking_month` 지우면 분류·책도 지워짐
- 위험: 낮음

### 3단계: 받기 클라이언트와 해석 (의존: 0·2단계)

1. **전송과 간격** (파일: `popular/internal/fetch/KpipaClient.java`, `KpipaTransport.java` [안 이름])
   - `HttpClient`에 `CookieManager`, 연결 시간 제한, 요청마다 읽기 시간 제한, `followRedirects(NEVER)`(`302 → accessDenied`를 `request_rejected`로 알아보려고)
   - 모든 요청(세션·POST·표지)은 한 간격 지킴이를 거칩니다. 앞 요청이 끝난 뒤 `request-interval` 이상 기다립니다 [안: 끝난 때부터 셈]. 테스트에서는 실제로 기다리지 않고 기록만.
   - 요청마다 INFO 로그: 방법, 경로, 분류, 응답 코드, 걸린 시간, 앞 요청과의 간격(AC-12)
   - 공통 헤더: `User-Agent`(설정 값)
   - 위험: 중간 (쿠키 Path=/home, 토큰 처리)
2. **세션**: `GET {base}/home/v3/addition/adiStatsCtgSaleRank` → 쿠키와 `var m_sCsrf = "<값>";`(정규식). 200이 아니거나 토큰이 없으면 `session_failed`. 토큰 하나로 두 화면을 부릅니다(조사 문서 "토큰 하나로 두 화면"). 세션 GET 1번이면 되고 2번도 됩니다. dev가 정하고 보고 [확정] (design-delta)
3. **순위 POST 17건** (`PopularCategory` 순서): `POST {base}/home/v3/addition/adiStatsCtgSaleRank/search`, 헤더 `Content-Type: application/x-www-form-urlencoded`, `X-CSRF-TOKEN`, `X-Requested-With: XMLHttpRequest`, `Referer: {base}/home/v3/addition/adiStatsCtgSaleRank`, 본문 `rdoSearchType=bookType&txtDate=<YYYYMM>&searchCtg=<siteId>&strTypeArr=&searchOrder=&depth=1depth&gubun=N`
4. **판매 부수 POST 16건** ("전체" 빼고): `POST {base}/home/v3/addition/adiStatsCtgSaleCnt/search`, 본문 `rdoSearchType=bookType&rdoSearchPeriod=month&txtFromDate=<YYYYMM>&txtToDate=<YYYYMM>&searchCtg=<siteId>&depth=1depth`. `Referer`는 판매량 화면 주소 [안], 8단계에서 통하는지 보고 [확인 필요]
5. **해석** (파일: `RankPageParser.java`, `SalesCountParser.java` [안 이름])
   - 순위: `.book-grid-item` 순서가 순위. 제목 `.figcaption`, ISBN `.info .number`(하이픈 지움, `^97[89][0-9]{10}$` 아니면 NULL + `missing_isbn_count`), 세부분류 `.info .category`, 표지 경로(0단계에서 확인한 속성, C7 검사). 저자 `.info .writer`는 읽지 않음 [확정]. 50권보다 많으면 앞 50권 [안]. 50권 미만이면 `too_few_books`, 목록 꼴이 없거나 제목이 비면 `format_changed`
   - 부수: `dataX1 = Number("…")`. 없거나 숫자가 아니면 `format_changed`
   - 실패는 `FetchFailure(reason, detail)` 예외 하나로 [안]. 200이 아니거나 302·403이면 `request_rejected`, `IOException`·시간 초과는 `network_error`
6. **분류 순서 계산**: "전체" 0, 나머지 16개는 판매 부수 큰 순(같으면 사이트 ID 순) 1~16 [확정] (R2-2·R2-3)
- 테스트 (단위, 사이트 요청 없음)
  - 해석: 50권, 순서, ISBN 하이픈 제거, 빈·틀린 ISBN NULL과 셈, 저자 안 읽음, 표지 경로, 49권 → `too_few_books`, 꼴 바뀜 → `format_changed`, 부수 `dataX1`
  - 클라이언트(가짜 전송 또는 JDK `HttpServer`): 세션 GET 뒤 POST에 쿠키·`X-CSRF-TOKEN`·`X-Requested-With`·`Referer`·`User-Agent`·본문, 토큰 없음 → `session_failed`, 302 → `request_rejected`, 시간 초과 → `network_error`
  - 간격: 요청 34~35건 사이 기다림이 모두 2초 이상으로 기록됨(AC-12)
  - 분류 순서: 202609 부수(조사 문서 2-1절)를 넣으면 AC-4 순서. 같은 부수면 사이트 ID 순
- 위험: 중간

### 4단계: 저장, 받기 실행, 예약, 표지 (의존: 3단계)

1. **저장** (파일: `popular/internal/store/PopularStore.java` [안 이름], `JdbcClient`)
   - 성공: **한 트랜잭션**에서 [확정] (사용자 승인, 2026-10-12, 인계 전 결정 #1)
     1. `fetch_run`에 `SUCCEEDED`(`finished_at` = 순위 저장 시각, `request_count`·`book_count`·`missing_isbn_count`, 표지 수 0)
     2. 그 달 `ranking_month` 지움(CASCADE)
     3. `ranking_month`(`fetch_run_id` = 방금 줄, `fetched_at`), `ranking_category` 17줄, `ranking_entry` 최대 850줄
   - 실패: 순위는 넣지 않고 `FAILED` 줄 하나(`failure_reason`, `failure_detail`), `log.error`
   - 표지가 끝나면 그 `fetch_run`의 `cover_fetched_count`·`cover_failed_count`만 UPDATE
   - 순위 표는 지우지 않음(R1-5)
   - 위험: 중간
2. **판단** (파일: `popular/internal/schedule/FetchDecision.java` [안 이름], `Clock` 주입 [안]): `shouldFetch(today)` Asia/Seoul [확정] (설계 #7~#9)
   1. 저장된 달이 없으면 받음
   2. 대상은 지난달
   3. 그 달이 다음 달 3일 00:00 뒤에 저장됐으면 안 받음
   4. 3일 이후 그 달 `FAILED`가 2번이면 안 받음
   5. 오늘이 3일 이후면 받음
   6. 그 밖에는 안 받음
   - 첫 배포가 1~2일이면 ①로 받고, 3일에 ③·⑤에 따라 한 번 더 받아 바꿈. 순위가 하나도 없을 때 실패하면 받을 때까지 매일(spec R1-6)
   - 위험: 중간 (날짜 경계)
3. **실행과 예약** (파일: `FetchScheduler.java`, `FetchJob.java`, `PopularConfiguration.java` [안 이름])
   - `PopularConfiguration`에 `@EnableScheduling`. 받기용 단일 스레드 실행기 빈, 앱이 꺼질 때 멈춤
   - `ApplicationReadyEvent` → `shouldFetch`이면 실행기에 넘김(`trigger = STARTUP`), 앱 시작을 막지 않음
   - `@Scheduled(cron, zone)` 05:00 → 같은 판단(`trigger = SCHEDULED`)
   - `fetch.enabled=false`이면 받기 예약·시작 받기를 모두 안 함. 캐시 새로 고침은 꺼지지 않음(5단계)
   - `AtomicBoolean`으로 겹침 막음
   - 위험: 중간
4. **표지** (`FetchJob` 안 또는 `CoverFetcher.java` [안])
   - 순위 저장 뒤, 그달 `cover_path` 중 `cover`에 없는 경로만 `GET {base}{path}`, 간격 2초 이상
   - 200이고 `Content-Type`이 `image/`로 시작하면 넣음(`content_type`, `byte_size`, `fetched_at`), 아니면 실패 셈만
   - 본문 크기 상한 [안: 값은 dev가 정해 보고, 작은 표지 약 51KB]
   - 최근 두 달(`ranking_month` 최신 두 줄)의 `ranking_entry.cover_path`에 없는 `cover` 줄을 지움 [확정] (설계 후속 #2)
   - 표지 수를 UPDATE하고 캐시를 바로 새로 고침
   - 표지 받는 중에 서버가 꺼지면 순위와 성공 기록은 남고 표지 수는 0 [확정]. 다음 받기에서 없는 표지만 다시 받음
   - 위험: 중간 (첫 달 최대 850장, 약 28분)
- 테스트
  - `FetchDecisionTests` [안] (날짜 고정): 순위 없음 → 받음(1일에도), 1~2일 앞 달 있음 → 안 받음, 3일 대상 달 없음 → 받음, 3일 실패 1번 → 4일 받음, 3·4일 실패 2번 → 5일 안 받음, 2일에 저장 → 3일 받음, 3일 이후 저장 → 안 받음, 순위 없음 + 실패 계속 → 매일 받음
  - `PopularFetchTests` [안] (`@SpringBootTest`, `db-test`, 가짜 전송, 이 클래스에서만 `fetch.enabled=true`): 성공(`SUCCEEDED`, 17분류·850권, `display_order`, `request_count` 34 또는 35), 49권 → 그달 순위 없음·앞 달 그대로·`FAILED`/`too_few_books`·오류 로그(AC-11), 같은 달 다시 받기 → 그 달만 바뀜, 표지(새 경로만, 2장 실패 → 순위 성공 + `cover_failed_count` 2(AC-17), 세 달째 뒤 첫 달에만 쓰인 표지 지워짐), 표지 중 멈춤 흉내 → 순위와 `SUCCEEDED` 남음·표지 수 0
  - `PopularStartupFetchTests` [안]: 빈 상태로 띄우면 `STARTUP` 받기가 돌고 기록(AC-13). `enabled=false`면 요청 0건
- 위험: 중간

### 5단계: 공용 캐시와 REST API (의존: 1·4단계)

1. **공용 캐시** (파일: `popular/internal/cache/PopularCache.java` [안 이름])
   - 최근 달 한 벌(`month`, `fetchedAt`, 분류 순서대로 책 `rank`·`title`·`isbn13`·`coverId`)과 ISBN별 `(bookId, libraryIds)`. `coverId`는 `cover_path` → `cover.id`
   - `AtomicReference`로 통째로 바꿔 끼움
   - 새로 고침: 10분마다 [확정], 새 달 저장 직후, 표지 끝난 뒤. 앱이 켜질 때 한 번 [안]
   - 실패하면 앞 값 유지 + 경고 로그(C8). 이용자별 값은 캐시하지 않음 [확정] (ADR-0074)
   - 순위 저장 뒤 표지가 끝나기 전에 10분 새로 고침이 돌면 새 책 일부가 잠시 `coverUrl` null(제목 글자)일 수 있음. 받아들이고, 다르게 하려면 보고 [안]
   - 위험: 중간
2. **계획 파라미터** (파일: `popular/internal/web/PopularPlanParams.java` [안 이름]): `residenceRegionIds`, `workRegionIds`, `scope`(`all`|`joinable`), `visit`(`any`|`none`), `libraryIds`. `/api/v1/books`와 같은 이름·검증 규칙(`catalog/internal/web/BookParams.java` 규칙: 쉼표로 나눈 양의 정수, 각 20개 이하, 두 번 오면 `duplicate`). 다른 모듈 안쪽이라 복사(ADR-0073 "감수하는 점"). 오류 순서: scope·visit·libraryIds 먼저, 지역은 마지막
3. **컨트롤러** (파일: `PopularBooksController.java`, `PopularErrors.java` [안 이름])
   - `GET /api/v1/popular-books`: 검증(400 `validation_error` + `errors[]`) → `LibraryCatalog.planSearch(residence, work, options)`(422 `invalid_region`) → 캐시 → `available` = `bookId`가 있고 그 책 `libraryIds` ∩ 계획 ≠ ∅(요청마다 `HashSet`)
   - 응답은 design-delta 예시 그대로. `month` `"YYYY-MM"`, `fetchedAt` +09:00 ISO [안], `categories`는 `display_order` 순, `name`은 줄인 이름, `coverUrl` `/api/v1/popular-books/covers/{coverId}` 또는 null. 값이 없으면 `{"month": null, "fetchedAt": null, "categories": []}` [확정]
   - `GET /api/v1/popular-books/covers/{coverId}`: 저장된 `Content-Type`, `Cache-Control: public, max-age=2592000, immutable` [확정], 없거나 숫자가 아니면 404 `cover_not_found` [확정]
   - `PopularErrors`는 `CatalogErrors`와 같은 꼴. 500은 공통 처리 그대로 `internal_error`
   - 인증 없음 [확정] (R7-3). 로그인을 켠 설정에서도 200인지 테스트
   - nginx `limit_req` 대상 아님. `deploy/nginx`가 `/api`의 `Cache-Control`을 덮어쓰지 않는지 봄 [확인 필요: dev 확인]
   - 위험: 중간
- 테스트: `PopularBooksApiTests` [안] (MockMvc, `db-test`): 값 없음 → 200 빈 꼴, 17분류 순서·50권, `available`(계획 도서관 true, 계획 밖만 false·`bookId` 있음, ISBN 없음 null·false)(AC-6), 지역·`libraryIds`를 바꾸면 `available`이 바뀜(AC-7), 400·422, 로그인 켠 설정에서 쿠키 없이 200(AC-16), 표지 200 + 헤더·지운 표지 404(AC-17), `byIsbn13` 실패 흉내 → 앞 값으로 200
- 위험: 중간

### 5-1단계: 소장 대출 스트림에 "앞의 N곳만" 옵션 (`availability`, 의존: 없음. 1~5단계와 나란히 가능)

결정: 가운데 창은 내 도서관 순서로 앞의 3곳만 확인 [확정] (사용자: "가. 앞의 3곳만 확인 이걸로 해줘 api좀 손봐줘", 2026-10-12, `easy/2026-10-12-handoff-review.html` #1)

1. **파라미터** (파일: `availability/internal/web/` 소장 스트림 컨트롤러와 파라미터 파서, `BookAvailabilityStreamController` 근처 [안 위치])
   - `GET /api/v1/book-availabilities/stream`에 선택 파라미터 `holdingLimit` [안 이름, 바꾸면 보고]: 1~20 정수
   - 있으면: 그 책들을 가진 계획 도서관 소장 가운데 **지금 계획 순서(직접 추가 → 가입 단계 …) 그대로 앞의 N개만** `targets.holdings[]`에 넣고 그것만 도서관 사이트에 요청. 없으면 지금과 똑같음(S1·S3 영향 없음)
   - 검증: 정수가 아니거나 1~20 밖 → 400 `validation_error`(`invalid_format`), 두 번 → `duplicate`. 기존 검증 순서의 맨 끝 [안]
   - 다음 묶음 스트림(`…/batches/stream`)에는 넣지 않음 [안]
   - 위험: 낮음 (선택 파라미터, 기본 동작 그대로)
- 테스트: 기존 소장 스트림 테스트 전부 통과(파라미터 없음 = 지금과 같음), `holdingLimit=3`이면 `targets.holdings` 3개·요청 3건 이하·계획 순서 앞 3곳, 400 경우(0, 21, `x`, 두 번)
- `docs/current/api.md` 반영은 plan이 함(이 인계서를 바꿔 넣을 때)

### 6단계: 웹 공용 부품과 머리 (의존: 없음. 백엔드와 나란히 가능)

1. **아래 창 뽑아내기** (파일: `web/src/components/BottomSheet.tsx`, `BottomSheet.module.css` [안 경로], 원본 `web/src/features/search/SettingsPanel.tsx:192-247`과 그 CSS)
   - 지금 동작(손잡이 끌어내리기 `CLOSE_DRAG_PX` 80, 바깥 누름, `data-testid="sheet-handle"`)은 그대로. 더할 것: 트리거 없이 열고 닫는 방식(`trigger` 선택 사항), ⓧ 닫기 버튼 선택 사항(`aria-label="닫기"`)
   - `SettingsPanel`은 공용 부품을 쓰되 **ⓧ 없이**(C6) 지금과 똑같이
   - 폰 뒤로 가기가 창만 닫게 하는 훅 [안 이름: `useBackToClose`]은 인기 도서 창에만. 방법은 dev가 정해 보고 [안]
   - 위험: 중간 (검색 설정 창 회귀, 히스토리 칸)
2. **머리** (파일: `web/src/components/AppLayout.tsx`, `AppLayout.module.css`)
   - 로고 오른쪽·로그인 왼쪽에 "인기 도서" 글자 링크(`/popular`). `/terms`·`/privacy`에서는 숨김(21행 조건과 같음) [확정]
   - 설명 글 `<span className={styles.tagline}>전자도서관 대출 가능 확인</span>`(18행)과 그 CSS를 모든 폭에서 지움 [확정]
   - 위험: 낮음
- 테스트 (Vitest): `BottomSheet.test.tsx`(80px 넘게 끌면 닫힘, 바깥 닫힘, ⓧ 있을 때 닫힘·없을 때 버튼 없음), `SettingsPanel.test.tsx` 그대로 통과·ⓧ 없음, `AppLayout.test.tsx` [새](링크 있음, `/terms`·`/privacy`에서 없음, 설명 글 없음, AC-15)

### 7단계: 웹 인기 도서 화면 (의존: 5·6단계. 화면 조각은 가짜 응답으로 먼저 가능)

1. **API·타입** (`web/src/api/client.ts`, `types.ts`): `fetchPopularBooks(plan: PlanParams, signal)`, 타입 `PopularBooks`·`PopularCategory`·`PopularBook` [안 이름]
2. **경로** (`web/src/main.tsx`): `<Route path="/popular" element={<PopularPage />} />` [확정 경로]
3. **계획 만들기** (`web/src/features/popular/usePopularPlan.ts` [안]): `BookPage`와 같은 방식(`useRegions()`의 `ready`, `useLibraryScope(params)`, `readVisit(params, loadPrefs().visit)`). 로그인 전 브라우저 저장값, 로그인 뒤 계정 값(AC-7·AC-16)
4. **S13** (`PopularPage.tsx`, `CategorySection.tsx`, `CoverGrid.tsx`, `CoverCard.tsx`, CSS [안 이름])
   - 제목 줄 "인기 도서 · 2026년 9월 판매 순위" 꼴, 분류 칸 [전체 ▾], ⓘ
   - 분류 묶음이 아래로 이어지고, 한 묶음이 화면 높이를 채움(PC도) [확정]. 묶음 = 분류 이름 + ◀ 3×3 ▶
   - 세모: 9권씩(1~9 … 46~50), 첫 쪽 ◀ 없음, 마지막 쪽 ▶ 없음·5권(AC-2). 분류마다 쪽을 따로 기억
   - 폰·태블릿은 좌우 밀기로도 넘김(AC-19), 기준 거리 [안]
   - 분류 칸 글씨는 화면 가운데 묶음을 따라감(`IntersectionObserver` [안])(AC-3). 분류를 고를 때 화면은 **부드럽게 미끄러지지 않고 정해진 자리로 바로 이동**(사용자 시안 피드백: "스크롤이 이동하는 거 너무 어지러워 그냥 정해진 좌표로 이동하는 걸로 해줘", 2026-10-11)
   - 카드는 표지만(`<img loading="lazy">`), 왼쪽 위에 작은 순위 숫자. `available=false`면 표지만 흐리게, 글자 없음(AC-6). 그림이 안 열리거나 `coverUrl` null이면 제목 글자 카드(AC-14). 화면 읽기용 이름 [안]: "N위 제목, 전자책 있음/없음"
   - 맨 아래 출처 줄: "출처: 출판유통통합전산망 (교보문고·예스24·알라딘·영풍문고·지역서점 종이책 판매 합산) · 2026년 9월 · 10월 3일 받음" 꼴 [확정] (R7-1)
   - 상태: 로딩 = 첫 분류 자리에 회색 빈 카드 9개, `month` null = "아직 인기 도서를 준비하고 있어요", 요청 실패 = S1 안내 줄과 같은 자리·꼴 "인기 도서를 불러오지 못했어요. 잠시 뒤에 다시 해 주세요." [확정]
   - 배치: PC·태블릿은 가운데 정렬, ◀ ▶는 격자 바깥 좌우. 폰은 3×3이 폭을 채우고 ◀ ▶는 격자 좌우 끝에 작게 [확정]
   - 위험: 중간
5. **보던 자리 남기기** (AC-20): 분류별 쪽과 스크롤 위치를 히스토리 상태에(`navigate(…, { replace: true, state })` 또는 `history.replaceState` [안]). S3에서 뒤로 오면 되살림 [확정]
6. **S13c 분류 목록** (`CategoryPicker.tsx` [안]): PC·태블릿은 펼쳐지는 목록(Radix Popover 등), Esc·바깥으로 닫힘. 폰은 `BottomSheet`(ⓧ 있음), 폰 기준 폭은 `(width <= 640px)` [안]. 17줄, 지금 분류 진하게, 길면 목록 안에서 내림. 고르면 닫히고 그 분류 쪽을 1로, 그 묶음으로 바로 이동, 칸 글씨 바뀜(AC-5)
7. **S13i 도움말** (`PopularHelp.tsx` [안]): PC는 ⓘ 옆 작은 말풍선(`web/src/components/InfoTip.tsx`를 쓸 수 있으면), 폰은 `BottomSheet`. 내용 [확정]: 출처와 합산 서점, 기준 달·받은 날, "종이책 순위라서 전자책이 없는 책도 있어요", "흐린 책은 내 도서관에 전자책이 없어요", "있음/없음은 검색 화면에서 고른 지역·범위 기준이에요"
8. **S14 가운데 창** (`PopularBookDialog.tsx`, `pickLibraryRows.ts` [안])
   - PC·태블릿은 Radix Dialog 가운데 창(뒤 흐림, Esc·바깥·ⓧ), 폰은 `BottomSheet`(ⓧ, 뒤로 가기는 창만 닫음)
   - 표지: 격자에서 누른 그 `coverUrl`, 없으면 제목 글자
   - 제목·지은이·출판사: `fetchBook(bookId, plan)`(우리 값, R6-2). 404 `book_not_found` → "책을 찾을 수 없어요", 그 밖의 오류·끊김 → S3 문구(`BookPage.tsx:100-111`과 같음)(AC-21)
   - 도서관 줄: `useHoldings().open([그 책], { filter, ...plan, holdingLimit: 3 })`(`BookPage.tsx:61-75`와 같은 꼴, 5-1단계 옵션), `loadNext`는 부르지 않음. 줄 컴포넌트는 S3의 `ResultRow`. 결과 전 "확인 중". 그 3곳의 순서: 대출 가능·구독형(바로 대출) → 대출 중(예약 적은 순) → 확인 실패 맨 뒤, "외 N곳" 없음 [확정] (R6-3·R6-5, (사용자: "가. 앞의 3곳만 확인 이걸로 해줘 api좀 손봐줘", 2026-10-12, `easy/2026-10-12-handoff-review.html` #1)). 순서 규칙은 순수 함수로 뽑아 단위 시험
   - 줄을 누르면 그 도서관 사이트 책 페이지가 새 창(`ResultRow` 지금 동작)(AC-9)
   - [책 검색 >>]: 5번의 자리를 저장한 뒤 `/books/{bookId}`로(AC-9·AC-20)
   - 공용 캐시가 최대 10분 늦어서 계획 도서관 중 가진 곳이 0이면 S3 문구 "조건에 맞는 도서관이 없어요" [안]
9. **S15 신청 안내** (`RequestNotice.tsx` [안]): 제목 한 줄 위에, 그 아래 "아직 내 도서관에 전자책이 없어요. 이용하는 전자도서관 사이트에서 희망도서로 신청해 보세요."(문구는 8단계 화면 확인에서 다시 봄) [확정]. PC는 작은 창(ⓧ·바깥·Esc), 폰은 `BottomSheet`(AC-10)
- 테스트 (Vitest, 가짜 응답)
  - `PopularPage.test.tsx`: 첫 쪽 9권·순위 숫자·출처 줄(AC-1), ◀ 없음 → ▶ → 10~18 → 마지막 쪽 5권·▶ 없음(AC-2), 분류 순서가 응답 순서 그대로(AC-4), 흐림과 글자 없음(AC-6), 저장된 지역·범위·직접 추가가 요청 주소에(AC-7), `img` 오류 → 제목 글자(AC-14), 로딩 9칸·빈 상태·오류 문구, 분류마다 쪽 따로 기억
  - `CategoryPicker.test.tsx`: 17줄, 지금 분류 진하게, "역사" 고르면 닫히고 칸 글씨 바뀜(AC-5)
  - `pickLibraryRows.test.ts`: 대출 가능·구독형 먼저, 대출 중은 예약 적은 순, 실패 맨 뒤, 3줄까지(AC-8)
  - `PopularBookDialog.test.tsx`: 3줄, "외 N곳" 없음, [책 검색 >>] 주소, 404 문구, 그 밖 오류 문구(AC-8·9·21)
  - `RequestNotice.test.tsx`: 문구(AC-10)
  - 폰 폭 흉내: 네 창이 아래 창이고 ⓧ·끌어내리기·바깥으로 닫힘, 뒤로 가기는 창만 닫음(AC-18)
- 위험: 중간

### 8단계: 받기 시험, 측정, 화면 확인 (의존: 1~7단계)

1. **로컬 받기 시험** (진짜 사이트, **한 번**, C4)
   - `popular` 스키마가 빈 상태에서 `CHAEKCHECK_POPULAR_FETCH_ENABLED=true` → `STARTUP` 받기
   - 로그로 확인: 요청 수(34 또는 35), 모든 간격 2초 이상, 걸린 시간, 응답 시간(연결 5초·읽기 10초가 맞는지), 판매량 POST `Referer`가 통했는지
   - 표지가 끝날 때까지(최대 약 28분) 기다림. `fetch_run` 줄(셈 칸 모두), 표지 수·실패 수, `popular.cover` 전체 크기
   - 끝나면 다시 끔. 다시 켜도 같은 달이 있으므로 ③에 따라 받지 않는지(요청 0건)
   - 위험: 중간 (사이트 응답이 조사 때와 다를 수 있음 → 다르면 멈추고 보고)
2. **측정** (결과는 `# 사이클 10` 절에)
   - **인기 도서 API p95 < 1초** [확정 기준] (사이클 07 spec R7-1과 같은 값): `bootRun` 기본 힙 512MB, 캐시가 찬 상태, 계획 셋 [안: 지역 없음 / 서울 거주 하나 / 부산 거주 + 직접 추가 몇 곳], p50·p95, 응답 크기(압축 전·gzip)
   - **표지 응답 시간**: 첫 요청과 브라우저 저장 뒤 p50·p95, **재서 보고만** [확정]
   - **공용 캐시 메모리**: 한 벌의 크기, 새로 고침 한 번 걸린 시간, `byIsbn13` 850개 `EXPLAIN ANALYZE`, **재서 보고만** [확정]
   - **서비스 DB ISBN 일치율**: 받은 달의 서로 다른 ISBN 중 맞은 비율, 수집 DB 측정 **27.8%**(조사 문서 4절, 202609)와 비교. 분류별 맞은 권수, 계획 하나 [안: 서울 거주]의 `available` 권수
3. **Playwright** 1280 → 768 → 375 → 320 (데스크톱 먼저): 머리 링크와 설명 글 없음, S13 한 화면에 3×3 하나·세모 유무·아래로 다음 분류·칸 글씨, S13c PC 펼침과 폰 아래 창, S13i, S14 3줄과 [책 검색 >>] → S3 → 뒤로(보던 분류·쪽·스크롤), S15, 폰 밀기, 폰 뒤로 가기, 표지 실패 칸
4. **사용자 화면 확인**: 작은 표지 화질(`s_`)이 3×3에 충분한지 [확인 필요], 흐림 정도, S14·S15 문구. AC 표 결과를 `# 사이클 10` 절에
5. **dev 문서** [안]: `docs/maintenance/`에 짧은 운영 메모 [안 이름: `4-popular.md`, `README.md` 목차에 한 줄]: 받기 켜고 끄기(`CHAEKCHECK_POPULAR_FETCH_ENABLED`), `popular.fetch_run`을 읽는 법과 `failure_reason` 뜻, 실패하면 다음 날 05:00에 다시 받는다는 점
- 위험: 중간

## 테스트

- 단위: 해석(픽스처), 클라이언트 헤더·쿠키·토큰·오류 구분, 간격, 분류 순서, `shouldFetch` 날짜 경계, 웹 격자·쪽·도서관 줄 고르기
- 통합(`db-test`): `BookLookupTests`, `PopularSchemaTests`, `PopularFetchTests`, `PopularStartupFetchTests`, `PopularBooksApiTests`, `ModularityTests`(`popular` → `catalog`·`library`만), `DocumentationTests`, 사이클 05~09 기존 테스트 전부
- 화면: Vitest, Playwright 1280/768/375/320 (데스크톱 먼저)
- 실데이터: 8단계 받기 시험 한 번과 측정. **테스트에서는 진짜 사이트를 부르지 않습니다**(C3)

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 "전체" 1~9위 3×3 + 순위 숫자, 출처 줄 기준 달·받은 날 (PC·태블릿·폰) | Vitest `PopularPage` + Playwright 4폭 | 7, 8 |
| AC-2 첫 쪽 ◀ 없음, ▶ → 10~18, 46~50 쪽 ▶ 없음·5권 | Vitest + Playwright | 7, 8 |
| AC-3 내리면 다음 분류, 칸 글씨 바뀜 | Playwright | 8 |
| AC-4 분류 순서(202609 값이면 전체, 소설 … 지리·환경), 뺀 다섯 분류 없음 | 단위(분류 순서) + `PopularBooksApiTests` + Vitest | 3, 5, 7 |
| AC-5 PC 펼침 목록 → "역사" → 닫히고 이동, 폰 아래 창 | Vitest `CategoryPicker` + Playwright | 7, 8 |
| AC-6 ISBN 같고 내 도서관이 가지면 있음, 아니면 흐림(글자 없음) | `PopularBooksApiTests` + Vitest | 5, 7 |
| AC-7 검색 기준을 바꾸면 있음/없음 바뀜 | API 테스트 + Vitest + Playwright(S1에서 바꾼 뒤 S13) | 5, 7, 8 |
| AC-8 S14 앞의 3곳만 조회(요청 3건 이하), 그 안에서 대출 가능 먼저, "외 N곳" 없음 | 소장 스트림 `holdingLimit` 테스트 + Vitest `pickLibraryRows`·`PopularBookDialog`(요청 주소에 `holdingLimit=3`) + Playwright | 5-1, 7, 8 |
| AC-9 [책 검색 >>] → 책 화면, 도서관 줄 → 새 창 | Vitest + Playwright | 7, 8 |
| AC-10 흐린 책 → 신청 안내 | Vitest + Playwright | 7, 8 |
| AC-11 50권 미만 → 저장 안 함, 앞 달 그대로, 기록 한 줄·오류 로그, 다음 날 다시 | `PopularFetchTests` + `FetchDecisionTests` | 4 |
| AC-12 한 번에 35건 이하, 간격 2초 이상 (로그) | 간격 단위 테스트 + `request_count` + 8단계 실제 로그 | 3, 4, 8 |
| AC-13 순위 없이 켜면 곧바로 받고 기록 | `PopularStartupFetchTests` + 8단계 시험 | 4, 8 |
| AC-14 표지 안 열림 → 제목 글자 | Vitest + Playwright | 7, 8 |
| AC-15 머리 링크(약관·개인정보 제외), 설명 글 없음 | Vitest `AppLayout` + Playwright 4폭 | 6, 8 |
| AC-16 로그인 없이 보임 | API 테스트(로그인 켠 설정, 쿠키 없음 200) + Playwright 로그아웃 상태 | 5, 8 |
| AC-17 새 표지 저장, 표지 수·실패 수 기록, 일부 실패해도 순위 성공, 지운 표지 404 `cover_not_found` | `PopularFetchTests` + `PopularBooksApiTests` + 8단계 시험 | 4, 5, 8 |
| AC-18 폰 아래 창 네 개: 손잡이·ⓧ·바깥으로 닫힘, 뒤로 가기는 창만, PC는 Esc | Vitest `BottomSheet`·폰 폭 흉내 + Playwright 375/320·1280 | 6, 7, 8 |
| AC-19 폰·태블릿 좌우 밀기 = 세모 | Vitest(포인터 이벤트) + Playwright 768/375 | 7, 8 |
| AC-20 S3 갔다 뒤로 → 보던 분류·쪽·스크롤 | Playwright | 7, 8 |
| AC-21 S14 책 정보가 404 아닌 오류 → S3 오류 문구 | Vitest `PopularBookDialog` | 7 |

## 완료 기준

- [ ] spec AC-1~AC-21을 위 표의 방법으로 모두 확인함
- [ ] `backend/`에서 `./gradlew build` 통과(`ModularityTests`에 `popular` 의존 방향, `DocumentationTests` 포함)
- [ ] `web/`에서 `npm test`, `npm run build`, `npm run lint` 통과, Playwright 1280/768/375/320 확인
- [ ] 테스트가 진짜 사이트를 부르지 않음(`fetch.enabled` false: 테스트·`collection-import`·로컬 `.env`)
- [ ] 이미 적용된 changeset은 바뀌지 않음(`git diff`에 `popular/001`과 master include만)
- [ ] 검색 설정 창은 ⓧ 없이 사이클 08과 같게 동작함
- [ ] 8단계 받기 시험 한 번: 요청 수·간격·`fetch_run`·표지 수 기록
- [ ] 측정: 인기 도서 API p95(1초 기준), 표지 응답, 캐시 메모리, 응답 크기, 서비스 DB ISBN 일치율(27.8%와 비교)
- [ ] [확인 필요] 결과와 설계와 달라진 점을 `# 사이클 10` 절에 적음

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 결과에 따라 | 막는 단계 |
|---|---|---|---|
| 이용 문의 답(출처 문구·표지) | 공식 문의(사용자, 원하면) | 답이 오면 문구·표지 사용 고침 | 없음 (허락 답 없이 배포, C5) |
| User-Agent의 `<서비스 주소>` | 배포 때 정함. 로컬 시험 값은 사용자에게 질문 | `TODO(확인 필요)` 유지 | 8 (값만) |
| 작은 표지 경로가 `src`에 있는지 | 0단계 픽스처 | 경로 만드는 방법 보고 | 3 |
| 줄인 이름 ↔ 사이트 분류 ID 짝 | 0단계 화면 픽스처의 링크 이름 대조 | 다르면 멈추고 보고 | 2 |
| 판매량 POST `Referer` 값 | 8단계 시험 | 통한 값 보고 | 없음 |
| 세션 GET 1번 / 2번 | dev가 정함 | 보고 | 없음 |
| 연결 5초·읽기 10초가 맞는지 | 8단계 응답 시간 | 조정하면 보고 | 없음 |
| 작은 표지(`s_`) 화질 | 8단계 사용자 화면 확인 | 큰 표지로 바꿀지 plan에 | 없음 |
| 캐시 새로 고침 시간·메모리, ISBN 850개 질의 시간 | 8단계 측정 | 보고만 | 없음 |
| 서비스 DB ISBN 일치율 | 8단계 측정 | 보고(27.8%와 비교) | 없음 |
| `deploy/nginx`가 `/api` `Cache-Control`을 덮어쓰는지 | dev가 설정 읽기 | 덮으면 보고 | 없음 |
| 지난달 값이 들어온 뒤 고쳐지는지(11-03 vs 11-10) | 나중 확인(이번 범위 밖) | 받는 날 다시 봄 | 운영 |

## 이번에 하지 않는 것

- 운영 배포(배포 사이클), 이용 문의 메일 보내기(사용자 일)
- 검색 설정 아래 창에 ⓧ 더하기(plan backlog)
- 2단계 세부분류, 독자 통계(성별·연령), 화제의 책 200선, 회원 전용 Open API
- 뺀 다섯 분류(만화·어린이·청소년·기타·의학·스포츠)
- 지난 달·다른 달 고르기, 다시 보여 주기(값은 남김)
- 제목(+저자)으로 전자책 더 맞추기
- 희망도서 신청 사이트 링크
- 관리자 다시 받기 명령, 관리자 화면, 받기 실패 알림(메일 등)
- 서버 여러 대용 받기 잠금(advisory lock·ShedLock)
- 우리 검색 기록으로 만드는 인기 도서
- "있는 책만 보기", 순위 정렬 바꾸기·검색, 공유·즐겨찾기
- 11-03·11-10 지난달 값 비교(나중 확인)
- 사이클 11(가져오기 서버 분리)과 엮는 "반영 끝" 즉시 새로 고침
- `catalog` 다시 가져오기, 로컬 DB 초기화, 이미 적용된 changeset 고치기

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 10`** 절에 **무엇이 달라졌는지와 이유**를 적습니다. 사용자 발언이면 그대로 옮깁니다.

- 사용자 답: User-Agent 주소 자리, 픽스처 받기 승인, 화면 확인(표지 화질, 흐림, S14·S15 문구), 측정 결과 받아들임
- 받기 시험: 날짜, 대상 달, 요청 수(세션 1·2번 중 무엇), 가장 짧은 간격, 전체 걸린 시간, 요청별 응답 시간, 판매량 POST `Referer`, `fetch_run` 줄 값, 표지 받은 수·실패 수, `popular.cover` 전체 크기, 사이트 응답이 조사 문서와 달랐던 점
- 측정: 인기 도서 API p50·p95(계획별)·응답 크기(압축 전·gzip), 표지 응답 p50·p95, 공용 캐시 메모리와 새로 고침 시간, `byIsbn13` 850개 `EXPLAIN ANALYZE`, 서비스 DB ISBN 일치율(전체·분류별)과 27.8% 비교, 계획 하나의 `available` 권수, 다음 배포 사이클의 힙 512MB 다시 재기에 넘길 숫자
- 정한 이름과 방법: `popular` 안쪽 패키지·클래스 이름, changelog 파일 이름, 제약 이름, 환경 변수·캐시 설정 키 이름, 간격을 세는 기준, 표지 본문 상한, 50권보다 많을 때 처리, 픽스처 파일 이름·받은 날, `BottomSheet` 공용 경로와 바꾼 props, 뒤로 가기 처리 방법, 폰 기준 폭, 밀기 기준 거리, 보던 자리 저장 방법, 웹 컴포넌트 이름, 운영 메모 문서 경로
- `holdingLimit` 이름·검증 순서를 바꿨으면 그 내용, 앞 3곳 밖에만 빌릴 수 있는 곳이 있었던 예
- 표지가 끝나기 전 10분 새로 고침으로 제목 글자가 잠시 보인 일이 있었는지
- [확인 필요] 표 각 행의 결과, 설계와 달라진 점, 새로 알게 된 제약, AC 확인표(8단계)
