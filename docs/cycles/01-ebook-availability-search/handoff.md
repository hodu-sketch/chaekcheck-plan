# 개발 인계서: 사이클 01 도서 제목 검색 → 전자도서관 대출 가능 여부

## 요약

로그인 없이 책 제목을 입력하면 시범 전자도서관 2곳(서울 강서구 = YES24, 고흥군 = 교보)의 보유·대출·예약 수량을 먼저 응답한 도서관부터 보여 줍니다. 사용자가 거주·직장 지역을 고르면 가입할 수 있는 도서관만 보여 줍니다. 백엔드는 `region`, `library`, `availability` 모듈(Spring Modulith), SSE 검색 스트림, 더 보기 API, 3분 캐시, 도서관 호스트별 호출 간격 제어로 이루어집니다. 웹은 S1(검색+결과)과 S2(지역 모달) 두 화면입니다. `backend/`와 `web/`은 아직 없으므로 프로젝트 생성부터 시작합니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 이 파일을 고치지 마세요.**
- 구현이 이 인계서와 달라져야 하면(값, 이름, 구조, 순서) 먼저 사용자에게 알리고, 그 내용을 맨 아래 "개발 후 plan 쪽에 알려줄 것"에 쌓아 두세요. 다음 사이클에서 plan이 기록합니다.
- 태그 뜻: `[확정]` 사용자가 확정함, `[안]` 제안(바꿔도 되지만 바꾸면 알릴 것), `[확인 필요]` 모름(아래 "개발 시작 전 확인" 참고). 확인되지 않은 값을 확정된 것처럼 코드에 넣지 마세요. 설정값으로 빼고 TODO를 남기세요.
- 단계마다 적힌 확인 명령이 통과해야 다음 단계로 넘어갑니다. 백엔드는 `backend/`에서 `./gradlew build`, 웹은 `web/`에서 `npm run build`를 씁니다.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/01-ebook-availability-search/spec.md`: 규칙(4~6장), 수용 기준 AC-1~AC-20(7장), 도서관 URL(11장)
- `../chaekcheck-plan/docs/cycles/01-ebook-availability-search/flow.md`: S1/S2 화면 요소, 상태, 문구
- `../chaekcheck-plan/docs/cycles/01-ebook-availability-search/design-delta.md`: 테이블 컬럼·제약, API 요청·응답 예시, SSE 이벤트, 설정 키
- `../chaekcheck-plan/docs/cycles/01-ebook-availability-search/skill-change-api-design.md`: api-design 스킬 교체 내용
- `../chaekcheck-plan/docs/adr/0001` ~ `0008`: 모듈 경계, 모듈별 스키마, 지역 ID, 자격 규칙, SSE, 캐시, 호출 간격, 오류 형식
- `../chaekcheck-plan/docs/current/api.md`: 오류 코드 표

이 인계서에는 컬럼, 제약, JSON 예시를 옮기지 않았습니다. 구현할 때는 design-delta.md를 그대로 따르세요.

## 개발 시작 전 확인

아래는 **사용자에게 묻거나 공식 문서·호출로 확인**해야 하는 항목입니다. 괄호 안에 확인 방법과 막히는 단계를 적었습니다.

- [ ] Gradle group ID와 base package (사용자에게 질문. 1단계를 막음). 절대 지어내지 마세요. 아래 경로의 `<base-package>`는 이 값으로 바꿉니다.
- [ ] 설정 접두어 `<app-prefix>` (예: `<app-prefix>.availability.cache-ttl`) (사용자에게 질문. 4단계를 막음)
- [ ] 지역 내부 ID를 매기는 규칙. 제안은 시도 2자리, 시군구 4자리 `[안]`입니다 (사용자에게 질문. 2단계 seed를 막음). **ID는 브라우저에 저장되므로 seed가 한 번 들어가면 바꿀 수 없습니다.** 시험용 폐지 데이터에 쓸 ID 범위(실제 규칙과 겹치지 않게)도 함께 정합니다.
- [ ] 전국 시도·시군구(일반구 제외)의 2026-07-01 이후 법정동 코드 (행정안전부 2026.7.1. 시행 변경내역 첨부 파일 `jscode20260701`, 행정표준코드관리시스템 https://www.code.go.kr/stdcode/regCodeL.do 참고. 2단계를 막음). 파일을 받을 수 없으면 사용자에게 파일을 요청하세요.
- [ ] 버전: Spring Boot 4.1.1에 맞는 Spring Modulith 2.x 버전, Caffeine, jsoup(또는 다른 HTML 파서), Testcontainers (Context7과 공식 문서로 확인. 1단계). Modulith 호환표 https://docs.spring.io/spring-modulith/reference/appendix.html 에서 2026-09-27에는 4.1 행을 확인하지 못했습니다.
- [ ] Spring Boot 4.1에서 ProblemDetail을 켜는 설정 이름과 기본값 (Context7. 5단계)
- [ ] Spring MVC SSE 방식(`SseEmitter` 등), 스레드 모델(가상 스레드 사용 여부), `Accept: text/event-stream, application/problem+json` 요청에 검증 실패 시 400/422 ProblemDetail이 제대로 나가는지 (Context7 + 프로토타입. 6단계)
- [ ] HTTP 클라이언트(예: `RestClient` + JDK `HttpClient`)에서 연결 3초 / 읽기 5초를 정확히 거는 방법 (Context7. 4단계)
- [ ] Liquibase OSS YAML에서 CHECK 제약, 부분 유니크 인덱스(`WHERE`), `UNIQUE NULLS NOT DISTINCT`를 표현하는 방법. 지원되지 않으면 YAML changeset 안의 `sql` 변경을 씁니다 (Context7. 2단계)
- [ ] 테스트 DB: Docker가 있어서 Testcontainers PostgreSQL 18을 쓸 수 있는지, 아니면 로컬 PostgreSQL을 쓸지. 로컬 DB 접속 정보는 `.env`에 사용자가 직접 넣습니다 (guard가 `.env` 편집을 막음. `.env.example`만 작성) (사용자에게 질문. 1단계)
- [ ] 더 보기 페이지 확인: 교보 `recordCount=50&pageIndex=2`가 51~100번째를 빠짐없이 주는지, YES24 `page_num` + `sort=now`에서 페이지가 겹치지 않는지 (실제 호출 시험, 1초 간격. 4단계)
- [ ] 두 사이트 HTML에서 제목·저자·출판사·공급 업체·전체 건수를 읽을 선택자. 확정된 것은 수량 위치(YES24 `div.stat`, 교보 `p.use`)뿐입니다 (실제 호출로 HTML 확인. 4단계)
- [ ] 교보(고흥) 검색어 인코딩(UTF-8인지)과 `https://www.ghlib.go.kr:446` TLS 연결이 JDK 25에서 되는지. 강서구는 UTF-8이고 인증서 체인도 확인됐습니다 (실제 호출. 4단계)
- [ ] 스트림의 지역 ID 파라미터 형식(쉼표 구분 `[안]`, 해석 API와 같게)과 최대 개수. 최대 개수는 정해지지 않았습니다 (사용자에게 질문. 6단계)
- [ ] 웹 선택: 라우터(React Router Declarative `[안]`), 서버 상태 라이브러리(TanStack Query `[안]`), CSS 방식과 breakpoint, UI 라이브러리. dev `docs/frontend-minimum.md` 10장에서 미정인 항목입니다 (사용자에게 질문. 8단계)
- [ ] 연락처 값(페이지 바닥)과 User-Agent의 서비스 URL·연락처 (사용자에게 질문. 공개 전까지. 그 전에는 TODO 자리만 둡니다)

## 구현 단계

단계 순서는 의존 순서입니다. 각 단계가 끝나면 빌드와 테스트가 통과해야 합니다.

### 0단계: api-design 스킬 고치기

1. **스킬 교체** (파일: `.claude/skills/api-design/SKILL.md`)
   - 할 일: `../chaekcheck-plan/docs/cycles/01-ebook-availability-search/skill-change-api-design.md`의 1~6번 교체를 적용합니다. 성공 응답은 감싸지 않고, 오류는 RFC 9457 ProblemDetail에 `code`와 `errors`를 둡니다.
   - 이유: ADR-0008. 스킬을 고치기 전까지는 ADR-0008이 스킬보다 우선합니다.
   - 확인: 스킬 파일에 `{ "data": ... }` 래퍼와 `{ "error": {...} }` 예시가 남아 있지 않습니다.
   - 참고: dev 루트의 `skill-change-api-design.md`는 같은 내용의 사본입니다. 적용한 뒤 지울지 사용자에게 물어보세요.
   - 위험: 낮음

### 1단계: 프로젝트 생성 (의존: 개발 시작 전 확인의 group ID, base package, 버전, 테스트 DB)

1. **Gradle 프로젝트** (파일: `backend/settings.gradle`, `backend/build.gradle`, `backend/gradlew*`, `backend/src/main/java/<base-package>/<App>Application.java`, `backend/src/main/resources/application.yml`)
   - 할 일: dev `CLAUDE.md`의 스택과 규칙(Groovy DSL, Wrapper)을 따릅니다. 의존성은 web, data-jpa, liquibase, postgresql, validation, Spring Modulith(core, starter-test), Caffeine, HTML 파서, Testcontainers이고 버전은 확인한 값을 씁니다. `spring.jpa.hibernate.ddl-auto`는 스키마를 만들거나 바꾸지 않는 값(`validate` 또는 `none` `[안]`)으로 둡니다.
   - 확인: `./gradlew build`
   - 위험: 중간 (Boot 4.1과 Modulith 버전 호환)
2. **Liquibase master** (파일: `backend/src/main/resources/db/changelog/db.changelog-master.yaml`)
   - 할 일: include만 둡니다. 모듈별 파일은 2~3단계에서 추가합니다.
   - **주의**: dev guard 훅이 이미 있는 changelog 파일의 수정을 막습니다(`runOnChange:true`가 아니면 막힘, master는 예외). **파일은 한 번에 완성해서 쓰고**, 틀리면 새 파일을 추가하세요.
3. **모듈 검증 테스트** (파일: `backend/src/test/java/<base-package>/ModularityTests.java`)
   - 할 일: `ApplicationModules.of(<App>Application.class).verify()`. 이후 모든 단계에서 함께 돌립니다.
   - 확인: `./gradlew test`
4. **Vite 앱** (파일: `web/`)
   - 할 일: React 19 + Vite 8 + TypeScript로 만듭니다(생성 명령은 dev `docs/frontend-minimum.md` 4.1). `vite.config.ts`의 `server.proxy`로 `/api`를 Spring으로 넘깁니다. 포트는 `[확인 필요]`입니다. 테스트는 Vitest + React Testing Library `[안]`입니다(dev `react-testing` 스킬).
   - 확인: `npm run build`
   - 위험: 낮음

### 2단계: region 모듈 (의존: 1단계, 지역 ID 규칙, 법정동 코드)

1. **스키마·테이블 changelog** (파일: `backend/src/main/resources/db/changelog/region/001-region-schema.yaml` `[안]`)
   - 할 일: `CREATE SCHEMA region`, 그리고 `region.region`, `region.region_replacement`의 컬럼, CHECK, 부분 유니크 인덱스, 인덱스를 design-delta.md "데이터"에 적힌 그대로 만듭니다. `region.id`는 자동 증가가 없습니다.
   - 확인: `./gradlew bootRun`으로 적용한 뒤 `\d region.region`. 앱 기동 성공.
2. **지역 seed changelog** (파일: `.../db/changelog/region/002-region-seed.yaml` (+ CSV `[안]`))
   - 할 일: 전국 시도·시군구(일반구 제외). 모두 `ACTIVE`이고 ID는 확정된 규칙으로 직접 넣습니다.
   - 위험: 높음 (나중에 ID를 바꿀 수 없음. 파일도 고칠 수 없음)
3. **시험용 폐지 데이터** (파일: `.../db/changelog/region/900-region-test-abolished.yaml` `[안]`, Liquibase context `test`)
   - 할 일: 폐지 지역 1개를 사용 중인 지역 1개로 대체(REPLACED)하고, 폐지 지역 1개를 2개로 나눔(SPLIT). 운영에는 들어가지 않고 로컬과 테스트에서만 적용합니다(context 설정 방법은 Context7로 확인). AC-20 확인용입니다.
4. **공개 API와 구현** (파일: `backend/src/main/java/<base-package>/region/RegionDirectory.java`, 공개 예외(예: `region/RegionNotUsableException.java` `[안]`), `region/internal/` 아래 엔티티, 리포지토리, 서비스, `RegionController`)
   - `expandForMatching(Set<Long> sigunguIds)`: ID마다 {자기, 상위 시도}를 돌려줍니다. 사용 중인 시군구가 아니면(폐지, 없음, 시도 ID) 예외를 냅니다.
   - `resolve(Set<Long> ids)`: `ACTIVE / REPLACED / SPLIT / UNKNOWN`. 대체 연결을 끝까지 따라가고 순환은 막습니다.
   - `GET /api/v1/regions`: 사용 중인 시도 → 시군구 트리. 법정동 코드는 응답에 넣지 않습니다.
   - `GET /api/v1/regions/resolutions?ids=`: 최대 20개 `[확정]`. 넘거나 숫자가 아니면 400 `validation_error`.
   - 테스트: 펼치기(서울 마포구 → {마포구, 서울}), 폐지·시도 ID 예외, 해석 4종과 연쇄(A→B→C), 대체 기록 순환 검사 `[안]`, 컨트롤러 슬라이스 테스트(ProblemDetail 모양 포함)
   - 확인: `./gradlew test` (모듈 검증 포함)
   - 위험: 중간

### 3단계: library 모듈 (의존: 2단계)

1. **스키마·테이블 changelog** (파일: `.../db/changelog/library/001-library-schema.yaml` `[안]`)
   - 할 일: `CREATE SCHEMA library`, `library.library`, `library.eligibility_rule`(CHECK, `UNIQUE NULLS NOT DISTINCT`, 인덱스)를 design-delta.md대로 만듭니다. `region`으로 가는 FK는 **두지 않습니다**.
2. **도서관 seed changelog** (파일: `.../db/changelog/library/002-library-seed.yaml` `[안]`)
   - 할 일: 강서구(YES24, `https://ebook.gangseo.seoul.kr`, 자격 문구 "서울 거주·재직·재학", 가입 방법 "도서관 방문 회원증 발급 또는 서울시민카드 간편가입", 규칙 RESIDENCE/WORK/SCHOOL × REGION(서울특별시 ID) 3행)와 고흥(KYOBO, `https://www.ghlib.go.kr:446`, 규칙 없음, 가입 방법 "도서관 홈페이지 가입 후 로그인")을 넣습니다. 모두 `[확정]`입니다. 규칙과 문구는 같은 changeset에 둡니다.
3. **공개 API와 구현** (파일: `library/LibraryCatalog.java`, 공개 record·enum(예: `LibraryTarget`, `Eligibility {OPEN, ELIGIBLE, UNKNOWN}`, `JoinPolicy {OPEN, QUALIFIED}`, `Platform {KYOBO, YES24}`, `SearchTarget(id, platform, baseUrl)` `[안]`), `library/internal/...`)
   - `findTargets(residenceIds, workIds)`: design-delta.md의 "대상 도서관 판정" 표를 그대로 따릅니다. `enabled`는 요청마다 DB에서 읽습니다. SCHOOL과 AFFILIATION은 비교하지 않습니다.
   - `findEnabledSearchTarget(libraryId)`: 없거나 꺼진 도서관이면 빈 값을 돌려줍니다.
   - 지역 오류: `RegionDirectory`의 예외를 library의 공개 예외(어느 필드인지와 ID 포함)로 바꿔서 냅니다 `[안]`. 그러면 `availability`가 `region`에 직접 의존하지 않습니다.
   - 테스트(AC-2~AC-5, AC-19 논리): 지역 없음 → 강서구 UNKNOWN + 고흥 OPEN / 서울 마포구 거주 → 강서구 ELIGIBLE + 고흥 / 부산 해운대구 거주 → 고흥만 / 고양시 거주 + 서울 중구 직장 → 둘 다 / `enabled=false` → 제외
   - 확인: `./gradlew test`
   - 위험: 중간

### 4단계: availability 조회 핵심 (의존: 3단계, HTML 선택자, HTTP 클라이언트 확인)

1. **설정** (파일: `availability/internal/config/AvailabilityProperties.java`, `application.yml`)
   - 키는 design-delta.md "외부 연동"에 있습니다: `cache-ttl=3m`, `cache-max-size=1000`, `host-max-concurrency=1`, `host-min-interval=1s`, `connect-timeout=3s`, `read-timeout=5s`, `request-deadline=8s`, `search-deadline=8s`, `kyobo.record-count=50`(값은 모두 `[확정]`), `user-agent`.
   - `user-agent` 형식은 `chaekcheck/<버전> (+<서비스 URL>; <연락처>)` `[안]`입니다. URL과 연락처는 **TODO로 둡니다**. 지어내지 마세요. AC-18은 `chaekcheck` 식별 문자열이 들어가면 확인할 수 있습니다.
2. **검색어 정규화** (파일: `availability/internal/SearchQuery.java` `[안]`)
   - 앞뒤 공백을 빼고 연속 공백을 하나로 줄인 뒤 2~50자인지 확인합니다. 어기면 `invalid_query`. 캐시 키에도 이 값을 씁니다.
3. **플랫폼 adapter** (파일: `availability/internal/adapter/PlatformAdapter.java`, `KyoboAdapter.java`, `Yes24Adapter.java`)
   - YES24: `GET {baseUrl}/search/?src_key=<q>&page_num=<N>&sort=now`, 페이지당 10건 고정, `div.stat`의 `보유 N` `대출 N` `예약 N`
   - 교보: `GET {baseUrl}/elibrary-front/search/searchList.ink?schClst=all&schDvsn=000&schTxt=<q>&recordCount=50&pageIndex=<N>`, `p.use`의 `대출 : X/Y  예약 : Z` → 보유 Y, 대출 중 X, 예약 Z
   - 출력: 제목, 저자, 출판사, 공급 업체, 수량, 전체 건수, `librarySearchUrl`. 설명문과 표지는 읽지도 않고 넘기지도 않습니다(AC-11).
   - 테스트: 실제 HTML을 한 번씩 받아 `backend/src/test/resources/fixtures/{kyobo,yes24}/`에 두고 파싱 단위 테스트를 씁니다. fixture에서 설명문과 표지 부분은 지우고 저장합니다 `[안]`. 결과 없음 HTML도 포함합니다.
   - 위험: 높음 (공식 API가 아님. 선택자 미확인)
4. **HTTP 호출** (파일: `availability/internal/fetch/UpstreamClient.java` `[안]`)
   - 연결 3초, 읽기 5초로 설정하고 모든 요청에 User-Agent를 붙입니다. 요청마다 로그를 남깁니다: `host`, 경로, 시작·종료 시각, 상태, User-Agent (AC-17, AC-18). 오류 응답과 파싱 실패는 `upstream_error`(502), 시간 초과는 `upstream_timeout`(504)으로 분류합니다.
5. **호스트별 간격 제어** (파일: `availability/internal/fetch/HostThrottle.java`, ADR-0007)
   - `host:port`마다 공정한 세마포어 1개와 마지막 종료 시각을 둡니다. 차례를 받으면 "이전 종료 + 1초"까지 기다립니다. 기다리는 시간도 요청당 8초에 포함하고, 넘으면 504로 끝냅니다.
   - 테스트(AC-17): 같은 호스트에 동시 요청 2건 → 겹치지 않고, 두 번째 시작 ≥ 첫 번째 종료 + 1초. 다른 호스트끼리는 병렬. 대기가 8초를 넘으면 504. 시계는 주입해서 테스트합니다 `[안]`.
6. **캐시** (파일: `availability/internal/fetch/SearchPageCache.java`(인터페이스), `CaffeineSearchPageCache.java`, ADR-0006)
   - 키는 (libraryId, 정규화한 q, page)이고 쓰기 후 3분 만료, 최대 1,000건입니다. 같은 키 동시 요청은 한 번만 조회하고, 실패는 캐시하지 않습니다. 값에 `fetchedAt`을 넣고, `cached`와 `cacheAgeSeconds`는 서버 시계로 계산합니다. hit/miss 로그를 남깁니다(AC-16). 나중에 Redis로 바꿀 수 있게 인터페이스 뒤에 둡니다.
   - 테스트(AC-16): 3분 안의 같은 키 → adapter 호출 1번. 3분 뒤 → 다시 호출(Caffeine 가짜 ticker). 실패 뒤 → 다시 호출. 동시 요청 → 1번.
7. **페이지 조회 서비스** (파일: `availability/internal/fetch/LibraryPageFetcher.java` `[안]`)
   - 흐름: 캐시 → 간격 제어 → adapter. 결과는 design-delta.md 4)의 페이지 객체입니다: `pageSize`(교보 50 / YES24 10), `totalCount`, `hasMore = page × pageSize < totalCount`, `loanRate`(보유 합계가 0이면 null), `rank = (page−1)×pageSize + 순번`, `available = holdings − loaned`.
   - 호출한 쪽(브라우저)이 연결을 끊어도 조회는 끝까지 하고 캐시에 넣습니다.
   - 확인: `./gradlew test`

### 5단계: 더 보기 API와 ProblemDetail 오류 (의존: 4단계, ProblemDetail 설정 확인)

1. **더 보기 컨트롤러** (파일: `availability/internal/web/LibraryEbookController.java` `[안]`)
   - `GET /api/v1/availability/libraries/{libraryId}/ebooks?q=&page=`
   - 오류: `invalid_query`와 `invalid_page`(page < 1 또는 숫자 아님)는 400, 없거나 꺼진 도서관(`findEnabledSearchTarget`가 빈 값)은 404 `library_not_found`, `upstream_error`는 502, `upstream_timeout`은 504.
2. **오류 형식** (ADR-0008)
   - 모듈 예외는 ProblemDetail로 바꾸고 `code`와 필요하면 `errors`를 확장 멤버로 넣습니다(예: `ErrorResponseException` 상속 `[안]`). Spring 기본 예외(타입 변환 실패 등)를 처리하는 advice는 base package 루트에 둡니다 `[안]`. 공통 모듈은 만들지 않습니다. `detail`에 스택, SQL, 도서관 응답 본문을 넣지 않습니다.
   - 테스트: 오류 코드마다 `Content-Type: application/problem+json`, `status`, `code`를 확인합니다. 정상 응답에 설명문·표지 필드가 없는 것도 확인합니다(AC-11).
   - 확인: `./gradlew test`, 그리고 `bootRun` 뒤 `사랑`으로 page=2를 호출해 51~100번째인지 봅니다(AC-15 일부).
   - 위험: 중간

### 6단계: SSE 검색 스트림 (의존: 5단계, SSE 확인)

1. **스트림 컨트롤러** (파일: `availability/internal/web/EbookSearchStreamController.java`, `availability/internal/search/SearchStreamService.java` `[안]`)
   - `GET /api/v1/ebook-searches/stream?q=&residenceRegionIds=&workRegionIds=`
   - **스트림을 열기 전에** 검증합니다. 검색어가 틀리면 400 `invalid_query`, 지역이 틀리면 422 `invalid_region`(+`errors`)을 일반 ProblemDetail로 돌려줍니다. 브라우저는 `Accept: text/event-stream, application/problem+json`으로 요청하므로, 이 헤더로 요청했을 때 상태 코드와 ProblemDetail 본문이 제대로 나가는지 테스트로 확인하세요.
   - 이벤트 순서(design-delta.md 3)의 모양 그대로): `targets`(항상 첫 이벤트, 꺼진 도서관 제외, `regionFilterApplied`, `joinPolicy`, `eligibility`) → 도서관마다 `library-result`(page 1 페이지 객체) 또는 `library-failed`(`problem`)가 **정확히 한 번**, 응답 순서대로 → `done`(`succeeded`, `failed`) → 서버가 닫습니다.
   - 대상 도서관을 병렬로 조회합니다. 스트림을 연 시각부터 8초(`search-deadline`)가 지나면, 남은 도서관마다 `upstream_timeout` 실패를 보내고 `done`을 보냅니다. 늦게 끝난 조회도 캐시에는 넣습니다.
   - 여러 스레드에서 이벤트를 보내므로 한 번에 하나만 보내도록 직렬화하세요. 이벤트 `id`와 `Last-Event-ID`는 쓰지 않습니다 `[안]`.
   - 테스트: 가짜 adapter로 확인합니다. 빠른 도서관 → 느린 도서관 순서(AC-13), 한 곳이 deadline을 넘기면 `library-failed` + `done`(AC-14, 테스트에서는 deadline을 짧게 설정 `[안]`), 한 곳이 실패해도 나머지 결과가 나옴, 꺼진 도서관은 `targets`에 없고 요청도 없음(AC-19), 결과 없음이면 `items` 빈 배열.
   - 확인: `./gradlew test`. `bootRun` 뒤 `curl -N "http://localhost:<port>/api/v1/ebook-searches/stream?q=채식주의자"`로 이벤트 순서를 봅니다.
   - 위험: 높음 (비동기, 프록시 버퍼링, 오류 응답의 content negotiation)

### 7단계: 백엔드 마무리 확인 (의존: 6단계)

- `./gradlew build` 통과, `ModularityTests` 통과(의존 방향은 `availability → library → region`만 있고 순환과 internal 접근이 없음)
- 실제 사이트로 확인하고 서버 로그를 봅니다: AC-16(3분 안의 재검색은 hit, 3분 뒤는 miss), AC-17(같은 호스트 요청이 겹치지 않고 간격 ≥ 1초), AC-18(User-Agent), AC-19(`UPDATE library.library SET enabled=false WHERE id=...` 뒤 요청 없음, 확인 후 되돌림)

### 8단계: 웹 S1/S2 (의존: 7단계, 웹 선택 확인)

1. **API 타입과 호출** (파일: `web/src/api/types.ts`, `web/src/api/client.ts`, `web/src/api/searchStream.ts` `[안]`)
   - 응답 타입은 design-delta.md의 필드 이름(camelCase)과 맞춥니다. ProblemDetail은 `code`로 분기합니다.
   - `searchStream`: **`EventSource`가 아니라 `fetch`로 엽니다** `[확정]` (design-delta.md 3)).
     - 헤더 `Accept: text/event-stream, application/problem+json`
     - 응답이 200이 아니면 본문을 ProblemDetail로 읽습니다. `invalid_region`이면 해석 API를 다시 불러 저장된 지역을 처리한 뒤 한 번만 다시 검색합니다. `invalid_query`면 입력 오류 문구를 보여 줍니다.
     - 200이면 본문을 읽으며 `event:` / `data:` 줄을 나눠 `targets`, `library-result`, `library-failed`, `done`을 처리합니다. 이벤트를 나누는 부분은 단위 테스트로 확인합니다(줄이 중간에 잘려 도착하는 경우 포함).
     - `done`을 받았을 때, 새 검색을 시작할 때, 화면을 떠날 때 `AbortController`로 요청을 끊습니다. 자동 재연결은 없습니다.
2. **내 지역 저장과 해석** (파일: `web/src/features/region/regionStorage.ts`, `useRegionResolution.ts` `[안]`)
   - localStorage에 `{ residence: number[], work: number[] }`(키 이름 `[안]`)를 저장합니다. 서버에는 저장하지 않습니다(AC-6).
   - 앱을 열 때 저장값이 있으면 `/api/v1/regions/resolutions`를 부릅니다. REPLACED면 바꿔서 저장하고 "행정구역 변경으로 OO이 △△로 바뀌었습니다", SPLIT이면 "OO이 여러 지역으로 나뉘었습니다. 내 지역을 다시 골라 주세요 · 설정", UNKNOWN이면 뺍니다 `[안]` (AC-20).
3. **S2 지역 모달** (파일: `web/src/features/region/RegionModal.tsx`)
   - 거주/직장 탭, 시도 → 시군구 다중 선택, 칩 삭제, 저장/취소/모두 지우기. 로딩과 오류 상태("지역 목록을 불러오지 못했습니다 · 다시 시도")를 둡니다. 저장할 때 검색어가 있으면 같은 검색어로 다시 검색합니다(flow.md S2).
4. **정렬 함수** (파일: `web/src/features/search/sortResults.ts` + 테스트, spec 5.4 `[확정]`)
   - 1단계: `available ≥ 1`이면 "지금 빌릴 수 있어요", 아니면 "예약하고 기다려요"
   - 2단계: 그룹 안에서 `eligibility`가 OPEN/ELIGIBLE인 줄이 먼저, UNKNOWN("가입 자격 확인 필요" 배지)이 뒤. 결과 줄의 `libraryId`로 `targets`에서 찾습니다.
   - 3단계, 빌릴 수 있는 그룹: 재고 많은 순 → 도서관 대출률 낮은 순 → `rank` 오름차순
   - 3단계, 예약 그룹: 예약 적은 순 → 보유 많은 순 → `rank` 오름차순
   - 도서관 대출률은 **page 1의 `loanRate`로 고정**하고, 더 보기를 해도 바꾸지 않습니다. null은 맨 뒤로 보냅니다 `[안]`. 모든 기준이 같은 다른 도서관 줄끼리는 `targets` 순서로 정합니다 `[안]`.
   - 테스트(AC-9, AC-10): 기준마다 동점과 역전 케이스, 더 보기 뒤에도 대출률이 그대로인지
5. **S1 검색 화면** (파일: `web/src/features/search/SearchPage.tsx`, `LibrarySummaryBar.tsx`, `ResultList.tsx`, `ResultRow.tsx`, `web/src/components/Footer.tsx` `[안]`)
   - 주소는 `/`와 `/search?q=`입니다. `q`가 있으면 입력칸을 채우고 바로 검색합니다.
   - 입력: `maxLength=50`, 정규화한 뒤 2글자 미만이면 요청하지 않고 "2글자 이상 입력하세요"(AC-1). 51자를 넘는 입력을 거부할 때의 문구는 개발 중에 정합니다.
   - 도서관 요약 줄: 조회 중 / 가져온 건수/전체 건수 / 결과 없음 / 조회 실패. `cached`면 "N분 전 조회"(`cacheAgeSeconds`가 60 미만이면 "방금 조회"). `hasMore`면 "더 보기" → `page+1` 호출 → 정렬해서 합칩니다(AC-15).
   - 결과 한 줄(AC-7): 제목 / 저자·출판사 / 공급 업체 / 도서관명 + 가입 조건("누구나 가입" 또는 `eligibilitySummary`) / 보유·대출 중·예약 / 대출 가능 여부 / 가입 방법 / "도서관에서 보기"(새 창, `librarySearchUrl`). 같은 책도 도서관별로 따로 표시합니다(AC-8).
   - 알림: 자격 필요 도서관 없음 = `regionFilterApplied && QUALIFIED 도서관 0곳` → "선택한 지역에서 자격이 되는 시범 도서관이 없습니다"(AC-4). 전체 결과 없음 = "조회한 도서관 N곳에 이 제목의 전자책이 없습니다" + 도서관 이름(N은 `targets` 수 `[안]`).
   - 페이지 바닥: "각 도서관의 공개 검색 결과 기준" + 연락처. 연락처는 **TODO 자리**로 둡니다(AC-12는 값을 받은 뒤 완료).
   - 반응형: 데스크톱 먼저 만든 뒤 태블릿·모바일을 맞춥니다. 요약 줄은 가로 스크롤 칩, 결과 줄은 세로로 쌓고, 모바일 S2는 전체 화면 `[안]`.
   - 확인: `npm run build`, 단위 테스트, Playwright MCP로 데스크톱 → 태블릿 → 모바일 순서(폭은 breakpoint가 정해지면 그 값, 전에는 1280 / 768 / 375 `[안]`)
   - 위험: 중간

## 테스트

- 단위: 검색어 정규화, adapter 파싱(fixture), 간격 제어, 캐시(가짜 ticker), 대상 도서관 판정, 지역 펼치기와 해석, 프론트 정렬 함수, 프론트 SSE 이벤트 나누기
- 통합(모듈): `ModularityTests`(verify), region/library 리포지토리와 Liquibase 적용(Testcontainers PG 18 `[확인 필요]`), 컨트롤러 슬라이스 테스트(ProblemDetail), SSE 스트림 테스트(가짜 adapter)
- 실제 사이트와 서버 로그: AC-7, AC-15, AC-16, AC-17, AC-18, AC-19. 요청은 수동으로 적게 보내고 1초 간격을 지킵니다.
- 화면(Playwright MCP, 데스크톱 먼저): 아래 표의 화면 항목

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 | 프론트 단위 테스트(요청 없음) + Playwright(네트워크 탭에 요청 없음, 51자 입력 불가) | 8 |
| AC-2 | library 판정 테스트 + Playwright(`채식주의자`, 지역 없음, 가입 조건 문구) | 3, 8 |
| AC-3, AC-4, AC-5 | library 판정 테스트 + Playwright(S2 선택 뒤 결과와 AC-4 안내) | 3, 8 |
| AC-6 | Playwright(새로고침 뒤 유지, 지역을 저장하는 요청 없음) | 8 |
| AC-7 | Playwright + 같은 시점의 도서관 사이트 화면과 수량 비교 | 4, 8 |
| AC-8 | 정렬/목록 테스트(도서관별 줄) + Playwright | 8 |
| AC-9, AC-10 | `sortResults` 단위 테스트 + Playwright | 8 |
| AC-11 | API 응답 테스트(필드 없음) + 화면 | 4, 5 |
| AC-12 | Playwright(바닥 문구. 연락처 값을 받은 뒤 완료) | 8 |
| AC-13 | 스트림 테스트(응답 순서) + Playwright(먼저 온 결과가 먼저 그려지고 다시 정렬됨) | 6, 8 |
| AC-14 | 스트림 테스트(deadline) + 화면("조회 실패") | 6, 8 |
| AC-15 | page=2 호출 + Playwright(`사랑`: 고흥 50/전체, 강서 10/전체, 더 보기) | 5, 8 |
| AC-16 | 캐시 단위 테스트 + 서버 로그 + 화면("N분 전 조회") | 4, 7 |
| AC-17 | 간격 제어 단위 테스트 + 서버 로그 | 4, 7 |
| AC-18 | 서버 로그(User-Agent) | 4, 7 |
| AC-19 | 판정·스트림 테스트 + SQL로 끈 뒤 로그와 화면 | 3, 6, 7 |
| AC-20 | region 해석 테스트 + 시험용 폐지 데이터로 Playwright(localStorage에 폐지 ID를 넣고 새로고침) | 2, 8 |

## 완료 기준

- [ ] 0단계: api-design 스킬 교체
- [ ] spec.md 7장 AC-1~AC-20을 위 표의 방법으로 모두 확인. AC-12의 연락처와 AC-18의 URL·연락처는 TODO 자리로 두고, 남은 일로 사용자에게 알림
- [ ] `backend/`에서 `./gradlew build` 통과(`ModularityTests` 포함)
- [ ] `web/`에서 `npm run build`와 단위 테스트 통과
- [ ] Playwright로 데스크톱·태블릿·모바일 확인
- [ ] "개발 시작 전 확인"에서 정한 값과 달라진 점을 아래 목록에 정리해서 사용자에게 전달

## 이번에 하지 않는 것

- 회원가입과 로그인, 서버에 지역·자격 저장
- 학교 지역과 소속 기관 입력, 기관 테이블(`scope_institution_id` 행 없음), SCHOOL/AFFILIATION 비교
- 같은 책 묶기, 저자·출판사 검색, 정렬 옵션, 페이지 번호 이동, 모든 페이지 한 번에 가져오기
- 인기 도서 사전 수집, 시범 외 도서관과 플랫폼
- 이벤트와 event publication registry, Redis, Kafka, Kubernetes, 배포와 CORS 설정(개발은 Vite proxy만 씀)
- 도서관 사용 여부를 바꾸는 관리 화면(SQL로 바꿈)
- 서지 설명문과 표지 표시·저장

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. 개발 중에 사용자에게 알리고 여기에 모아 두세요.

- 정한 값: group ID, base package, 설정 접두어, 지역 ID 규칙, 시험용 폐지 데이터의 ID 범위, 라이브러리 버전(Modulith, Caffeine, 파서, Testcontainers)
- 확인 결과: ProblemDetail 설정, SSE 방식, `Accept: text/event-stream, application/problem+json` 요청에 대한 오류 응답이 실제로 어떻게 나갔는지, 타임아웃 설정 방법, 교보·YES24 페이지 겹침과 누락, 교보 인코딩과 TLS, 두 사이트의 선택자
- `[안]`으로 구현했거나 바꾼 것: Liquibase 파일 이름, library가 지역 예외를 감싸는 방식, 프론트 SSE 이벤트 나누기 방식, null 대출률과 도서관 사이 동점 처리, 전체 결과 없음의 N, 지역 파라미터 형식과 최대 개수
- 새로 알게 된 제약: 사이트 구조 변경, 응답 시간, 캐시·간격 로그에서 본 것
- 남은 TODO: User-Agent의 서비스 URL과 연락처, 페이지 바닥 연락처
