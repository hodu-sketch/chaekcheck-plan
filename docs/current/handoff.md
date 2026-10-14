# 개발 인계서: 사이클 15 사용자 행동 기록 (usagelog)

- 기준 문서: plan `docs/cycles/15-usage-log/design-delta.md` (특히 "부를 자리", dev main 2026-10-14 확인: 사이클 12·13·14 합친 뒤)
- ADR: 0096, 0097, 0102 (모두 Accepted)
- 승인: 이 인계서대로 dev에 넘김 [확정] (사용자 승인, 2026-10-14, `easy/2026-10-14-handoff-review.html` #1)
- **dev 순서** [확정] (사용자 승인, 2026-10-14, `easy/2026-10-14-handoff-review.html` #4): 사이클 15는 지금 시작하고, 사이클 19(꺾쇠 저자 표기, `docs/cycles/19-author-angle-brackets`)는 명세·인계가 끝나는 대로 이어서 합니다. 둘 다 사이클 17 첫 배포 전에 들어갑니다. 19가 책 목록을 다시 가져올 때 15 개발과 겹치면 DB 묶음을 따로 둡니다

## 시작 조건

- **dev main에 사이클 12·13·14가 합쳐진 상태에서 시작합니다** [확정] (design-delta "부를 자리"는 이 상태를 기준으로 확인했습니다). 브랜치 이름 `cycle-15-usage-log` [안]
- 시작할 때 아래 둘을 다시 봅니다. 줄 번호는 2026-10-14 기준이라 바뀌었을 수 있습니다
  - master 맨 끝 include. plan 읽기(2026-10-14)로는 `db.changelog-master.yaml:92-95` `# cycle 14` + `picks/001-picks-schema.yaml`
  - "부를 자리" 표의 각 파일과 줄
- **사이클 16(공지·처리방침)도 Liquibase changelog를 하나 더할 수 있습니다** (schema `sitecontent` [안]). 두 사이클은 schema가 달라 서로 기대지 않으므로 어느 쪽이 먼저 합쳐져도 됩니다. 규칙 [안] (design-delta "부를 자리" Liquibase 줄):
  - main에 합치는 순서대로 master 끝에 붙입니다
  - 나중에 합치는 사이클이 rebase해서 자기 include 줄을 맨 끝으로 옮깁니다
  - **이미 어떤 DB에서든 돈 changeset은 고치지 않습니다.** dev에 `PRE_DEPLOYMENT` 표시 파일이 있어도 15에서는 다른 changeset을 고치지 않고 새 파일만 더합니다
- 사이클 16(공지·처리방침)과 동시에 개발하면 사이클 14처럼 따로 작업 폴더·docker 프로젝트·포트를 씁니다(이름·포트는 사이클 14 방식을 따라 dev가 정함 [안]). 16 인계가 아직이면 15 먼저 합니다 [확정] (사용자 승인, 2026-10-14, `easy/2026-10-14-handoff-review.html` #2)
  - **사이클 16 인계됨 (2026-10-14)**: 인계서는 plan `docs/cycles/16-notices-and-policies/handoff.md`(이 파일은 15 인계서 그대로). 15와 나란히, 따로 작업 폴더에서 개발합니다
- 기록은 화면에 보이지 않습니다 [확정] (flow.md: 화면 모양·문구 변경 없음). 확인은 SQL과 시험으로 합니다

## 요약

새 모듈 `usagelog`를 만듭니다. 이 모듈은 다음 기록을 같은 PostgreSQL의 `usagelog` schema 표 여덟에 남깁니다:
- 검색, 책 상세, 더 보기
- 도서관 클릭, 화면 행동
- 도서관 응답 하루 요약
- 이상한 알림, 버린 묶음

`catalog`·`availability`는 공개 창구 `UsageLog`를 직접 부릅니다. 화면이 서버 모르게 하는 행동은 웹이 `fetch` keepalive로 `POST /api/v1/usage-events`에 알립니다. 쓰기는 메모리 버퍼(최대 1만 줄)에 모았다가 5초마다 한 트랜잭션(비동기 커밋)으로 넣습니다.

`auth`에서 바뀌는 것:
- `access_token` 쿠키 경로를 `/api/v1`로 넓힙니다
- 로그인 상태 판별 부품 `LoginStatusReader`를 공개합니다

운영 장치:
- 기록 켜기 설정(`chaekcheck.usagelog.enabled`, 기본 꺼짐)
- 04:30 정리 작업
- nginx 사용 알림 한도와 로봇 거절, `robots.txt`

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) **조용히 바꾸지 않습니다.** 먼저 사용자에게 알리고, 내용과 이유를 dev `docs/plan-feedback.md`의 **새 `# 사이클 15` 절**에 적습니다. 사용자 발언이면 그대로 옮깁니다
- `[안]`·`[안: 이름]`이 붙은 값은 dev가 코드에 맞춰 바꿀 수 있습니다. 바꾸면 `# 사이클 15` 절에 알리기만 합니다
  - 해당 예: 공개 API `UsageLog`의 메서드·record 이름, `LoginStatusReader`·`LoginStatus` 이름, 안쪽 패키지·클래스, 설정 키(`chaekcheck.usagelog.cleanup.*`), 환경 변수 이름, changeset id, 제약 이름, 사용 알림 JSON 칸 이름, 웹 함수·파일 위치, nginx zone 이름, 시험 클래스 이름
- **바꾸지 않는 것** [확정]
  - 모듈 `usagelog`, schema `usagelog`, `allowedDependencies = { "library", "auth" }`
  - 표 여덟의 이름: `search_event`, `book_view`, `search_more`, `library_click`, `screen_event`, `library_response_daily`, `rejected_event`, `dropped_batch`
  - 칸 뜻과 CHECK 값 목록. design-delta "데이터" 표에서 [확정]인 것
  - changelog 경로 `db/changelog/usagelog/001-usagelog-schema.yaml`, master 맨 끝에 둠
  - 주소 `POST /api/v1/usage-events`, 늘 204. 로그인 기능 켜짐에서 CSRF 표시가 없으면 403
  - 설정 키 `chaekcheck.usagelog.enabled`, 기본 꺼짐
  - 버퍼 최대 1만 줄, 5초 묶음, 한 트랜잭션, 기록 트랜잭션만 비동기 커밋, Spring Modulith 이벤트 안 씀
  - 보관: IP 30일 뒤 비움, `rejected_event` 30일, 나머지 1년, 매일 04:30 Asia/Seoul
  - 세 가지 셈 규칙(아래 C5)
  - `access_token` 쿠키 경로 `/api/v1`. 옛 경로 쿠키를 지우는 코드는 넣지 않음
- 태그
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 확정된 것처럼 코드에 넣지 말고 `TODO(확인 필요)`로 둔 뒤 확인하고 보고합니다
- **새 의존성 없음** [안]. `JdbcTemplate`(`batchUpdate`), Spring 예약 기능, `SmartLifecycle`, 지금 있는 Spring Security·Nimbus JWT만 씁니다. 새 라이브러리가 필요하면 먼저 보고합니다
- 단계마다 통과해야 다음 단계로 갑니다
  - `backend/`: `./gradlew build` (`ModularityTests`·`DocumentationTests` 포함)
  - 웹을 고친 단계는 `web/`: `npm test`, `npm run build`, `npm run lint`
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), 앞 사이클 인계서의 제약을 그대로 따릅니다. 아래에는 더하거나 바뀌는 것만 적습니다

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `docs/cycles/15-usage-log/design-delta.md`: **기준 문서**
  - 구조 그림: 모듈, 검색·직접 찾기·사용 알림·쓰기 흐름, 도메인, ER
  - 모듈 표, 웹, **부를 자리**, 데이터 표, API, 외부 연동, 확인 필요
  - 그림을 실제로 그린 페이지: `easy/design-delta-original.html`
- `docs/cycles/15-usage-log/spec.md`: R1~R6, 상태별 동작, AC, 비목표
- `docs/cycles/15-usage-log/flow.md`: 화면별 기록 자리, 화면 상태 (모양 변경 없음)
- `docs/cycles/15-usage-log/scope.md`
- `docs/cycles/15-usage-log/to-cycle-17.md`: 배포 설정과 맞출 것(nginx realip, 한도). `to-cycle-16.md`: 처리방침에 넘긴 수집 항목
- `architect-proposal.md`는 결정 기록일 뿐입니다. 구현 기준은 design-delta입니다
- ADR (`docs/adr/`)
  - 0096: 저장 장소·남길 칸·보관
  - 0097: 모듈·쓰기 방법·운영 장치
  - 0102: 쿠키 경로·로그인 판별 부품
- 회고 결정(2026-10-14): `easy/2026-10-14-retro-decisions.html` #1~#4 (건너뜀, 다시 보내기 한 번, 켜진 도서관만, ADR 확정)

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0096 | 같은 PostgreSQL 새 schema. 남기는 것: 검색 조건(지역·고른 도서관 포함), 결과 수, 로그인 여부, IP. 남기지 않는 것: 회원 번호·쿠키 값·User-Agent. IP 30일 뒤 비움, 나머지 1년. 이상한 사용 알림은 IP와 함께 30일. 같은 IP로 30일 안에서 이어 보기는 허용 |
| 0097 | 모듈 `usagelog`. `catalog`·`availability`가 공개 창구를 직접 부름(이벤트 아님). 메모리 1만 줄 → 5초마다 `batchUpdate` 한 트랜잭션 + 비동기 커밋. 실패 묶음은 버리고 `dropped_batch`에 남김. 표 여덟. 사용 알림은 fetch keepalive + CSRF. IP는 `X-Real-IP`에서 읽음. 운영 장치: `chaekcheck.usagelog.enabled`, 04:30 정리, nginx 로봇 거절, `robots.txt` |
| 0102 | `access_token` 쿠키 경로 `/api/v1`. `auth`의 판별 부품 하나: 서명이 맞으면 만료돼도 `signed_in`, 없거나 틀리면 `signed_out`, 로그인 꺼짐이면 쿠키를 보지 않고 `login_off`. 기록에만 쓰고 권한에는 쓰지 않음. 옛 경로 쿠키는 지우지 않음. `POST /api/v1/usage-events`는 CSRF 검사만 받고 로그인은 요구하지 않음 |

## 지켜야 할 제약

- **C1. 모듈 경계** [확정]
  - `usagelog/package-info.java`에 `@ApplicationModule(allowedDependencies = { "library", "auth" })`를 씁니다. 예시는 `picks/package-info.java:20`
  - 새 의존 방향은 `catalog → usagelog`, `availability → usagelog`이고 순환이 없어야 합니다. `catalog`·`availability`의 `package-info.java`에 `allowedDependencies`가 선언돼 있으면 `"usagelog"`를 더합니다
  - `catalog`·`availability`는 로그인을 모릅니다. `auth`를 부르는 곳은 `usagelog`뿐입니다
  - 다른 schema로 FK·조인 없음. 번호만 남깁니다 (`library_id`, `book_id`는 FK 없음)
  - JPA 엔티티를 두지 않고 `JdbcTemplate`/`JdbcClient`를 씁니다 [안]
- **C2. 기록이 검색을 막지 않음** [확정] (R3-1·R3-3, AC-14)
  - `record…`는 검사한 뒤 큐에 넣기만 하고 곧바로 돌아갑니다
  - 기록 쪽 어떤 예외도 부른 쪽으로 새지 않습니다(안에서 잡고 로그)
  - DB 쓰기 실패는 검색 결과·링크에 영향이 없습니다
- **C3. 요청 정보는 요청 스레드에서 잡음** [안]
  - 직접 찾기 첫 묶음 기록은 SSE가 끝날 때 다른 스레드에서 남깁니다. 그래서 `HttpServletRequest`를 나중에 읽으면 안 됩니다
  - 컨트롤러에서 요청을 받을 때 "요청 정보"를 한 번 잡아 둡니다. 예: `UsageLog.capture(HttpServletRequest) → UsageRequest` [안: 이름]. 잡는 것은 받은 시각, IP, 로봇 여부, 로그인 상태입니다
  - 기록 시각은 **요청을 받은 때**입니다 [확정] (R1-4)
- **C4. 기록 설정 꺼짐** [확정 키·기본값] [안: 동작 방식]
  - `chaekcheck.usagelog.enabled=false`면 모든 `record…`가 곧바로 돌아갑니다. 큐·도서관 응답 요약·사용 알림 모두 남기지 않고, 사용 알림 주소는 그대로 204입니다
  - 부르는 쪽은 설정을 모릅니다
  - 꺼짐이면 로그인 판별도 하지 않습니다 [안]
- **C5. 정한 뜻** [확정] (회고 결정 2026-10-14, 사용자 승인)
  - **건너뜀(`skipped`)**: 직접 찾기에서 시작 마감(`LAUNCH_CUTOFF` 3초, `BatchRunner.runTasks` `:271-301`)까지 요청을 보내지 못한 후보 도서관 하나마다 1 (#1)
  - **조회 서버 바꿔 보내기**(`FetchServiceSiteFetcher` `:97-102`)는 도서관에 물어본 한 번으로 셉니다 (#2). 결과는 마지막 결과, 시간은 처음 시작부터 끝까지 [안]
  - **사용 알림의 도서관 번호**는 `LibraryCatalog.enabledLibraryRefs()`(`library/LibraryCatalog.java:44`, 켜진 도서관만)에 있을 때만 정상입니다. 아니면 `rejected_event` `unknown_library` (#3). `LibraryRegistry.listAll()`은 꺼진 도서관도 돌려주므로 쓰지 않습니다
- **C6. 남기지 않는 것** [확정] (AC-12)
  - 회원 번호, User-Agent, 쿠키 값은 칸에 두지 않습니다
  - 로그에도 쿠키·토큰 값을 찍지 않습니다
- **C7. 로봇** [확정] (R1-5)
  - User-Agent에 `bot`·`crawler`·`spider`가 들면(대소문자 무시 [안]) 기록하지 않습니다
  - 서버 기록과 사용 알림 모두에 적용합니다 [안: 사용 알림에도 적용]
  - 도서관 응답 요약은 요청자와 무관한 도서관 사실이라 UA와 상관없이 셉니다 [안]
- **C8. 시험은 진짜 도서관 사이트를 부르지 않음.** 지금 availability 시험의 가짜 fetcher·가짜 서버 방식을 그대로 씁니다

## 개발 시작 전 확인

### dev가 확인할 것
- [ ] 시작 커밋(main, 12·13·14 합친 뒤)을 `# 사이클 15` 절에 적습니다
- [ ] base package `com.chaekcheck`, 새 모듈 패키지 `com.chaekcheck.usagelog` [확정] (dev `CLAUDE.md`)
- [ ] master 맨 끝 include. 16이 먼저 합쳐졌으면 그 뒤에 붙입니다
- [ ] "부를 자리" 표의 줄 번호와 모양이 그대로인지. 다르면 고친 위치를 보고합니다
- [ ] dev pgjdbc 실제 버전 [확인 필요: 의존성 트리] (`./gradlew dependencies`)
- [ ] 예약 작업 실행기 구성. `@Scheduled`가 공용 스레드 하나를 쓰는지 확인합니다(5초 비우기가 회원 정리·사서추천 받기와 서로 막지 않게)
- [ ] 16과 동시에 개발하는지 확인하고, 그렇다면 따로 작업 폴더·DB 묶음·포트를 정해 `# 사이클 15` 절에 적음 (위 시작 조건, [확정] (사용자 승인, 2026-10-14, `easy/2026-10-14-handoff-review.html` #2))

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 16과 동시 개발이면 따로 작업 폴더·포트 (정해짐: 위 시작 조건) | 시작 전 | 확인 |
| 실제 폰 확인 (Samsung Internet, `web-lan-5174`): 링크가 새 탭으로 바로 열리고 기록이 생기는지 | 10단계 | 확인 결과 |

## 구현 단계

### 1단계: `auth` — 쿠키 경로와 로그인 상태 판별 부품 (의존: 없음)

1. **쿠키 경로** (`backend/src/main/java/com/chaekcheck/auth/internal/security/AuthCookies.java:9`)
   - 할 일: `access_token` 경로 `/api/v1/me` → `/api/v1` [확정]. 쿠키를 만드는 곳·지우는 곳(로그아웃·탈퇴)이 모두 새 경로를 쓰는지 봅니다. 리프레시 쿠키(`/api/v1/auth`)와 `Secure`·`HttpOnly`·`SameSite=Lax`는 그대로입니다
   - 옛 경로 쿠키를 지우는 코드는 넣지 않습니다 [확정] (R1-6, 액세스 쿠키 15분 `application.yml:104`)
   - `AccessTokenCookieResolver(PROTECTED)`는 지금처럼 `PROTECTED`(`/api/v1/me/**`)에서만 토큰을 읽어야 합니다. 경로가 넓어져도 검색 요청에서 만료 토큰 때문에 401이 나면 안 됩니다 (R1-6 "쿠키 확인 실패는 오류가 아님")
   - 위험: 중간 (로그인·로그아웃 회귀)
2. **판별 부품** (`auth/LoginStatusReader.java`, `auth/LoginStatus.java`, 모듈 루트 = 공개 API [안: 이름])
   - 할 일: `LoginStatus read(HttpServletRequest)`. 값 `SIGNED_IN`/`SIGNED_OUT`/`LOGIN_OFF`, DB 값 `signed_in`/`signed_out`/`login_off` [확정 뜻] [안: 값 이름]
   - 켜짐 구현 (`auth/internal/...`, `@ConditionalOnAuthEnabled`)
     - `access_token` 쿠키의 **HS256 서명만** 확인합니다. 만료돼도 서명이 맞으면 `SIGNED_IN`이고, 없거나 틀리거나 못 읽으면 `SIGNED_OUT`입니다 [확정]
     - 지금 `jwtDecoder`(`SecurityConfiguration.java:105-108`)는 만료를 거절하므로 이 부품에는 시각 검사 없이 서명만 보는 디코더를 따로 둡니다 [안]
     - 예외를 던지지 않습니다
   - 꺼짐 구현: `@ConditionalOnAuthEnabled`의 반대 조건으로, 쿠키를 보지 않고 늘 `LOGIN_OFF`를 돌려주는 no-op 빈입니다 [확정]. 반대 조건 어노테이션이 없으면 `auth` 안에 만듭니다 [안]. `auth/ConditionalOnAuthEnabled.java`, `AuthToggleEnvironmentPostProcessor.java:45-56`를 참고합니다
   - 쿠키·서명 확인 코드는 `auth` 안에만 둡니다 [확정] (ADR-0102)
   - 위험: 중간
3. **CSRF 범위** (`SecurityConfiguration.java:47-48,75`)
   - 할 일: `POST /api/v1/usage-events`가 로그인 기능 켜짐에서 **CSRF 검사는 받고 로그인은 요구하지 않게** 합니다 [확정] (ADR-0102). 방법은 [안: 개발 때]
   - plan이 다시 읽어 본 점(2026-10-14)
     - 지금 `.csrf(csrf.spa()…ignoringRequestMatchers(WEBHOOKS))`는 웹훅 말고 모든 POST에 CSRF를 검사하는 모양입니다. 그래서 따로 고칠 것이 없을 수도 있습니다
     - **`PROTECTED`에 넣으면 로그인을 요구하게 되므로 넣지 않습니다**
     - 고칠 것이 없으면 시험으로만 증명하고 보고합니다
   - 위험: 중간
- 테스트
  - `AuthEnabledSecurityTests`에 더함:
    - 로그인 응답의 `Set-Cookie: access_token=…; Path=/api/v1` (AC-26)
    - 만료된 쿠키를 실은 `GET /api/v1/books`가 200 (회귀)
    - 로그아웃이 새 경로 쿠키를 지움
  - `LoginStatusReaderTests` [안] (로그인 켬): 쿠키 없음 → `SIGNED_OUT`, 다른 키로 서명 → `SIGNED_OUT`, 깨진 값 → `SIGNED_OUT`, 만료 + 우리 서명 → `SIGNED_IN`, 정상 → `SIGNED_IN` (AC-25 판별 부분)
  - `AuthDisabledTests`에 더함: 꺼짐에서 `LoginStatusReader`가 쿠키가 있어도 `LOGIN_OFF` (AC-20 일부)
  - CSRF 시험은 6단계(주소가 생긴 뒤)

### 2단계: `usagelog` 뼈대, 표 여덟, 설정 (의존: 1단계)

1. **모듈 선언** (`backend/src/main/java/com/chaekcheck/usagelog/package-info.java`)
   - `@ApplicationModule(allowedDependencies = { "library", "auth" })` [확정]
   - Javadoc: 책임, ADR-0096·0097·0102, "기록은 검색을 막지 않음"
   - 안쪽 패키지 [안]: `internal/buffer`, `internal/write`, `internal/cleanup`, `internal/web`
2. **Liquibase** (`backend/src/main/resources/db/changelog/usagelog/001-usagelog-schema.yaml` [확정 경로])
   - master 맨 끝에 `# cycle 15: usage log (ADR-0096, ADR-0097)` + include [안: 주석]
   - `CREATE SCHEMA usagelog`
   - 표·칸은 design-delta "데이터" 표 그대로입니다. 요점:
     - `id bigint GENERATED ALWAYS AS IDENTITY` PK: `library_response_daily` 빼고 모든 표 [안] (뺄지는 AC-16 측정으로, [확인 필요: 프로토타입])
     - `received_at timestamptz NOT NULL` (`dropped_batch`는 `dropped_at`)
     - `login_status text NOT NULL` CHECK (`signed_in`,`signed_out`,`login_off`). `client_ip inet` NULL 가능. `rejected_event`·`library_response_daily`·`dropped_batch`에는 `login_status`가 없음
     - `search_event`
       - `kind` CHECK (`catalog`,`direct`)
       - `title`/`author`/`publisher` text, 셋 중 하나 이상 NOT NULL CHECK
       - `exact boolean`·`roles text[]`·`sort text`(수집 목록만), `filter text`(직접 찾기만, `all`/`available`). kind에 맞지 않으면 NULL CHECK [안]
       - `scope`·`visit` text NOT NULL
       - `residence_region_ids`·`work_region_ids`·`library_ids` `bigint[] NOT NULL DEFAULT '{}'`
       - `result_count integer` NULL 가능
     - `book_view`: `book_id bigint NOT NULL`, 지역·도서관 배열 `NOT NULL DEFAULT '{}'`
     - `search_more`
       - `kind` CHECK (`direct_next_batch`,`library_more`,`catalog_next_page`)
       - `seq integer NOT NULL` [안], `library_id bigint`는 `library_more`일 때만 NOT NULL CHECK [안]
       - 검색 기록과 같은 조건 칸 전부 [확정]
     - `library_click`
       - `library_id bigint NOT NULL`
       - `place` CHECK (`result_card`,`join_link`,`join_guide`,`home_page`,`logo`,`summary_bar`)
       - `screen` CHECK (`direct_results`,`catalog_results`,`book_page`,`picks`,`my_libraries`)
       - `book_id bigint` NULL 가능
     - `screen_event`
       - `kind` CHECK (`picks_list_view`,`picks_book_view`,`region_change`,`my_library_add`,`my_library_remove`)
       - 종류별 칸 `picks_category text`, `book_id bigint`, `residence_region_ids`·`work_region_ids bigint[]`, `library_id bigint`. 종류에 맞지 않는 칸은 NULL CHECK [확정]
       - 칸 짝 [안]: `picks_list_view` = category / `picks_book_view` = category + book / `region_change` = 두 배열 / `my_library_*` = library
       - JSON 칸·회원 번호 없음
     - `library_response_daily`
       - PK `(day date, library_id bigint, source text)`, `source` CHECK (`direct_search`,`holding_fill`), `day`는 서울 날짜
       - `ok_count`·`failed_count`·`timeout_count`·`skipped_count integer`, `ok_ms_total bigint`, `ok_ms_max integer`. NOT NULL DEFAULT 0, `>= 0` [안]
     - `rejected_event`
       - `client_ip inet`
       - `reason` CHECK (`unknown_library`,`invalid_place`,`invalid_screen`,`invalid_book_id`,`malformed`,`unknown_type`,`invalid_value`)
       - `raw_values jsonb`. 2KB가 넘으면 잘라 내는 일은 코드에서 합니다 [확정]
     - `dropped_batch`: `dropped_at timestamptz NOT NULL`, `row_count integer NOT NULL`, `reason` CHECK (`db_failure`,`buffer_full`)
     - 색인: 각 표 BRIN `(received_at)` [확정] (`library_response_daily`는 `day` [안], `dropped_batch`는 `dropped_at` [안]). 부분 색인 `WHERE client_ip IS NOT NULL` [안] ([확인 필요: 프로토타입·AC-16])
     - 파티션 없음 [확정]. 다른 schema로 FK 없음
   - changeset id `usagelog-001-*` [안: id], 제약 이름은 `postgres-patterns` 관례 [안: 이름]. 기존 changeset은 고치지 않음
3. **설정** (`application.yml`, `application-test.yml`, `.env.example`, `usagelog/internal/UsageLogProperties.java` [안: 이름])
   - `chaekcheck.usagelog.enabled: ${CHAEKCHECK_USAGELOG_ENABLED:false}` [확정 키·기본값] [안: 환경 변수 이름]
   - 값 [확정]: 버퍼 1만 줄, 비우기 간격 5s, 정리 cron `0 30 4 * * *`, zone `Asia/Seoul`
   - 키 이름 [안]: `chaekcheck.usagelog.buffer-capacity`, `flush-interval`, `cleanup.cron`, `cleanup.zone`, `cleanup.batch-size`
   - 정리 한 번에 지우는 줄 수 1만 [안]
   - `.env.example`: `CHAEKCHECK_USAGELOG_ENABLED=false` ("첫 배포 때 꺼 둠, 처리방침 공개일에 켬")
4. **기존 시험 고침**
   - `ModularityTests`: `usagelog` 의존(`library`·`auth`), `catalog`·`availability` → `usagelog`
   - `ApplicationModules.of(...).verify()` 통과
   - `DocumentationTests`: 새 `module-usagelog.puml`
- 테스트: `UsageLogSchemaTests` [안] (`db-test`)
  - CHECK 위반: 틀린 `kind`·`place`·`screen`·`reason`·`login_status`, 검색어 셋 다 NULL, `screen_event` 종류와 맞지 않는 칸
  - 표 정의에 `user_id`·`account_id`·`user_agent`·`cookie` 같은 칸 없음 (AC-12, `information_schema.columns`로)
- 위험: 낮음

### 3단계: 쓰기 경로 — `UsageLog`, 버퍼, 5초 비우기, 종료 비우기 (의존: 2단계)

1. **공개 API** (`usagelog/UsageLog.java` + 공개 record, 모듈 루트 [안: 이름])
   - `UsageRequest capture(HttpServletRequest)` (C3)
     - IP는 `X-Real-IP`. 없거나 IP 모양이 아니면 NULL [안]
     - 로봇 여부(C7), `LoginStatusReader.read(...)`, 받은 시각(`Clock`)
     - 꺼짐이면 빈 표시를 돌려주고 판별하지 않음 [안]
   - `recordSearch(UsageRequest, SearchRecord)`
     - `SearchRecord`: kind, title/author/publisher, exact, roles, sort, filter, scope, visit, 지역 둘, libraryIds, `Integer resultCount`
   - `recordBookView(UsageRequest, long bookId, 지역 둘, libraryIds)`
   - `recordMore(UsageRequest, MoreRecord)`: kind, seq, `Long libraryId`, 검색 조건 칸 전부
   - `recordLibraryResponse(long libraryId, Source, Result, long elapsedMs)`
     - `Source` = `DIRECT_SEARCH`/`HOLDING_FILL`, `Result` = `OK`/`FAILED`/`TIMEOUT`/`SKIPPED`
     - 요청 정보 없음, 날짜는 끝난 때 서울 날짜 [안]
2. **버퍼** (`internal/buffer` [안])
   - 줄 기록용 큐 하나, 최대 **1만 줄** [확정]
   - 넘치면 새 기록을 버리고 버린 수를 셉니다. 다음 비우기 때 `dropped_batch`(`buffer_full`, 그동안 버린 줄 수) 한 줄 [확정 뜻] [안: 모으는 단위]
   - 도서관 응답은 큐가 아니라 `(day, libraryId, source)`별 누적 맵입니다. 수, `ok_ms_total`, `ok_ms_max`. 1만 줄 상한에 넣지 않습니다 [안]
3. **비우기** (`internal/write/UsageLogFlusher.java` [안])
   - 5초마다(`fixedDelay`) [확정]. 자기 단일 스레드 [안]
   - 큐와 누적 맵을 통째로 빼 옵니다
   - 이번 묶음에 든 사용 알림 도서관 번호를 `LibraryCatalog.enabledLibraryRefs()`로 **한 번** 확인합니다. 없는 번호는 `rejected_event`(`unknown_library`)로 옮깁니다 (C5)
   - **한 트랜잭션**
     - `SET LOCAL synchronous_commit TO OFF` [확정]
     - 표마다 `JdbcTemplate.batchUpdate` [확정]
     - `library_response_daily`는 아래 upsert [확정]
     - 지난번까지 버린 묶음 → `dropped_batch`
     - COMMIT
   - upsert:
     ```sql
     INSERT INTO usagelog.library_response_daily AS d (day, library_id, source, ok_count, failed_count, timeout_count, skipped_count, ok_ms_total, ok_ms_max)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (day, library_id, source) DO UPDATE SET
       ok_count = d.ok_count + EXCLUDED.ok_count,
       failed_count = d.failed_count + EXCLUDED.failed_count,
       timeout_count = d.timeout_count + EXCLUDED.timeout_count,
       skipped_count = d.skipped_count + EXCLUDED.skipped_count,
       ok_ms_total = d.ok_ms_total + EXCLUDED.ok_ms_total,
       ok_ms_max = GREATEST(d.ok_ms_max, EXCLUDED.ok_ms_max)
     ```
   - 배열은 `createArrayOf("bigint"/"text", …)`, IP는 `?::inet` [안]
   - 데이터소스 URL 전체 설정(`reWriteBatchedInserts` 등)은 바꾸지 않습니다. 바꾸고 싶으면 측정과 함께 보고합니다 [안]
   - **실패**: 그 묶음(도서관 응답 누적 포함 [안])을 버립니다. 버린 사실(시각, 줄 수, `db_failure`)을 메모리에 들고 있다가 다음 성공 때 함께 넣습니다. 서버 로그 WARN 한 줄 [확정]. 메모리에 들고 있을 버린 묶음 기록의 상한은 dev가 정해 보고합니다 [안]
4. **종료 비우기** (`SmartLifecycle` [안])
   - 정상 종료 때 남은 것을 넣고 끝냅니다 [확정] (R3-4)
   - phase는 웹 서버 정지보다 늦고 DataSource가 닫히기 전 [확인 필요: 프로토타입]. 순서를 확인해 보고합니다
5. **꺼짐·로봇**: C4, C7을 `UsageLog` 구현 맨 앞에 둡니다
- 테스트
  - `UsageLogBufferTests` [안] (단위): 1만 1번째는 버려지고 `buffer_full` 수가 셈 / 누적 맵 합·최댓값 / 로봇 UA 세 가지는 큐에 안 들어감(AC-6 단위)
  - `UsageLogWriteTests` [안] (`@SpringBootTest`, `db-test`, 이 클래스에서만 `enabled=true`)
    - 비우기 한 번에 표마다 줄이 들어감
    - 같은 (day, library, source)를 두 번 비우면 더해지고 `ok_ms_max`는 큰 값
    - DB 실패 흉내(예: 쓰기 부품을 실패로 바꿔 끼움) → 그 묶음 없음, 다음 성공 때 `dropped_batch` `db_failure` 한 줄 + 로그 붙잡기로 WARN 확인 (AC-19)
  - `UsageLogDisabledTests` [안]: `enabled=false`에서 `record…`·비우기 뒤 여덟 표 모두 0줄, 켜면 생김 (AC-21)
  - `UsageLogShutdownTests` [안]: 기록 직후 문맥을 닫으면 줄이 남아 있음 (AC-15)
  - db-test 연결 한도: 새 `@SpringBootTest` 클래스는 기존 문맥을 함께 쓰거나 `@DirtiesContext`(사이클 10 회고)
- 위험: 높음 (트랜잭션·종료 순서·스레드)

### 4단계: `catalog` 호출 — 검색 첫 쪽, 다음 쪽, 책 상세 (의존: 3단계)

1. **수집 목록 검색** (`catalog/internal/web/BookSearchController.java:37-38`, `GET /api/v1/books`)
   - 할 일: 검색이 성공해 응답을 만든 뒤
     - `page`(`BookParams.java:74`, 기본 1)가 1이면 `recordSearch(kind=catalog, …, totalCount)`. `totalCount`는 `PgBigmBookSearch.java:83`
     - 2 이상이면 `recordMore(catalog_next_page, seq=page, 같은 조건)`
   - 검색어는 서버가 다듬은 값입니다 (`BookParams.java:26-28,131`)
   - 400·422(`CatalogErrors.java`)는 기록 없음 [확정]
   - 0권도 기록합니다 [확정]
   - 위험: 낮음
2. **책 상세** (`BookSearchController.java:44-45`, `GET /api/v1/books/{bookId}`): 찾으면 `recordBookView`. 404는 기록 없음 [확정]
- 테스트: `CatalogUsageLogTests` [안] (MockMvc, `db-test`, `enabled=true`, 비우기를 시험에서 직접 부름 [안])
  - "채식주의자" 검색 → `search_event` 한 줄, 검색어·`result_count`·지역·고른 도서관·`login_status`·`client_ip`(머리글 `X-Real-IP` 넣음) (AC-1)
  - `page=2` → `search_event` 그대로, `search_more` `catalog_next_page` seq 2 (AC-2)
  - 검색어 1자(400)·없는 지역(422) → 0줄 (AC-5)
  - UA `Googlebot` → 0줄, 결과는 같음 (AC-6)
  - 책 상세 → `book_view` 한 줄, 없는 책 404 → 0줄 (AC-17 일부)
- 위험: 낮음

### 5단계: `availability` 호출 — 직접 찾기, 더 보기, 도서관 응답, 요청마다 로그 (의존: 3단계)

1. **직접 찾기 첫 묶음** (`availability/internal/web/EbookSearchStreamController.java:43-48`, 끝: `search/BatchSession.java:167-193`)
   - 컨트롤러에서 `capture`(C3) 뒤 세션에 넘깁니다
   - **세션마다 한 번만** [안: "기록함" 표시 하나, `AtomicBoolean`]
     - 첫 `batch-done`을 보낸 순간 `recordSearch(kind=direct, resultCount=countedRows)` (R1-4, `StreamEvents.java:30-42,97-127`)
     - 그 전에 끝나면 `recordSearch(resultCount=null)`: `clientGone`(`BatchSession.send` `:195-200`), `finish()`, emitter 시간 초과(`streamDuration()+5s`), 오류 중 먼저 온 하나
   - 보낼 것이 없어 끊김을 모르는 경우도 묶음 마감(8초) 뒤 `finish()`가 `done`을 보내다 알게 되므로 늦어도 그때 남습니다
   - 지금 `SseEmitter`의 `onCompletion`·`onTimeout`·`onError`가 없습니다. 더할지는 dev가 정하고, 더해도 "한 번만"을 지킵니다 [안]
   - 위험: 높음 (경합, 두 번 기록)
2. **다음 묶음** (`web/EbookBatchStreamController.java:32`, `batchNo` ≥ 2): `recordMore(direct_next_batch, seq=batchNo, 같은 조건)`. 조건 칸은 이 요청 파라미터나 세션에서 얻습니다. 못 얻는 칸이 있으면 보고합니다 [안]
3. **도서관별 더 보기** (`web/LibraryEbookController.java:50-52`)
   - `recordMore(library_more, libraryId, seq=page)`
   - `:58` `fetcher.fetch(...)` 앞뒤로 시간을 재서 `recordLibraryResponse(source=direct_search)`. 성공은 `OK`, `UpstreamException`은 Kind에 따라 `FAILED`/`TIMEOUT` [안]
4. **도서관 응답 — 직접 찾기** (`search/BatchRunner.java:161-174`, `fetchAsync(...).whenComplete`)
   - 요청 시작 시각을 잡아 끝날 때 ms를 계산합니다 [안]
   - 분류 [확정]
     - 성공 → `OK`
     - `UpstreamException.Kind.ERROR` → `FAILED`
     - `TIMEOUT` 또는 묶음 마감(`deadlinePassed`) → `TIMEOUT`
     - 시작 마감까지 못 보낸 후보 → 하나마다 `SKIPPED` (C5)
   - 조회 서버를 바꿔 다시 보내도 한 번입니다 (C5)
   - 끊긴 뒤에도 이미 보낸 요청은 끝날 때 셉니다 [확정] (R6-4)
5. **도서관 응답 — 대출 수 채우기** (`BatchRunner.java:225-250` `startHolding`, `requestedAt` `:234`)
   - `source=holding_fill`, 분류는 4와 같음 [안]
   - 구독형(요청 없이 끝남, `:226-228`)과 도서관 주소 밖 상세 주소(요청 없이 실패, `:230-232`)는 세지 않습니다 [안]
   - 대출 수 채우기는 `book_view`·`search_more`로 세지 않습니다 [확정] (R5-1, R6-1)
6. **요청마다 서버 로그 한 줄**
   - 위 두 `whenComplete`(와 3의 도서관별 더 보기)에서 INFO `library=… source=… result=… ms=…` [안: 형식]. IP 없음
   - 지금 실패만 남기는 `BatchSession.java:116`, `HoldingSession.java:104`와 겹치지 않게 정리합니다 [안]
   - 서비스 로그 보관 14일은 배포 설정입니다 [확정: 17]
- 테스트 (가짜 fetcher, 진짜 사이트 없음)
  - `DirectSearchUsageLogTests` [안]
    - 첫 묶음 끝 → `search_event` direct 한 줄, `result_count` = countedRows (AC-3)
    - 다음 묶음·도서관별 더 보기 → `search_event` 그대로, `search_more` 한 줄씩 (AC-3)
    - 첫 묶음 전 끊김 → `result_count` NULL 한 줄. 보낼 것 없이 닫힘 → 마감 뒤 한 줄. 끊김과 `finish`가 겹쳐도 한 줄 (AC-4)
  - `LibraryResponseSummaryTests` [안]
    - 가짜 fetcher로 성공·ERROR·TIMEOUT·마감 넘김·시작 마감 못 넘긴 후보·조회 서버 바꿔 보내기를 섞음
    - (오늘, 도서관, `direct_search`/`holding_fill`) 줄의 수·시간 합·최댓값이 맞음
    - 대출 수 채우기는 `book_view`를 늘리지 않음 (AC-24, AC-17)
    - 로그 붙잡기로 요청마다 INFO 한 줄 (AC-24)
- 위험: 높음

### 6단계: 사용 알림 주소 `POST /api/v1/usage-events` (의존: 1·3단계)

1. **컨트롤러** (`usagelog/internal/web/UsageEventController.java` [안])
   - JSON 하나, `type`으로 구분 [확정]. 칸 이름 [안]: design-delta "API" 표
   - 늘 **204**, 본문 없음 [확정]
   - 로그인 기능 켜짐에서 CSRF 표시가 없거나 틀리면 403입니다(Spring Security가 냄)
2. **검사** [확정 이유 값]
   - JSON을 못 읽음 → `malformed`
   - 모르는 `type` → `unknown_type`
   - `library_click`
     - `place` 여섯 밖 → `invalid_place`
     - `screen` 다섯 밖 → `invalid_screen`
     - `bookId`가 양의 정수가 아님 → `invalid_book_id` (책이 있는지는 보지 않음, `usagelog`는 `catalog`에 기대지 않음 [안])
   - 그 밖의 정하지 않은 값 → `invalid_value`. 예: 지역 배열 각 20개 넘음 [안], 카테고리 빈 값·20자 넘음 [안], 빠진 칸
   - 도서관 번호는 비우기 때 `enabledLibraryRefs()`로 → `unknown_library` (C5, `screen_event`의 `my_library_*`도 같음)
   - 이상한 값은 `rejected_event`에 시각·IP·이유·받은 값(2KB 넘으면 잘라 냄)을 남깁니다 [확정]
   - 본문 크기 상한은 [안: 예 8KB, dev가 정해 보고]
   - 사서추천 분야 값은 사이클 14 뒤 새 코드가 생길 수 있어 목록으로 막지 않습니다 [안]
3. **꺼짐·로봇**: C4·C7 그대로. 꺼짐이어도 204
- 테스트
  - `UsageEventApiTests` [안] (로그인 꺼짐 기본)
    - `type`별 정상 → `library_click`/`screen_event` 한 줄, 회원 번호 칸 없음 (AC-23 서버 쪽)
    - 없는 도서관·**꺼진 도서관** 번호, 틀린 `place`·`screen`·`bookId`, 깨진 JSON, 모르는 `type`, 틀린 값 → 204, 클릭 기록 0, `rejected_event`에 IP·이유 (AC-10)
    - 2KB 넘는 값은 잘림
  - `AuthEnabledSecurityTests`(또는 `UsageEventCsrfTests` [안], 로그인 켬)
    - 표시 없이 POST → 403
    - `XSRF-TOKEN` 쿠키 + `X-XSRF-TOKEN` 머리글 → 204이고 줄 생김
    - 로그인 쿠키 없이도 204 (AC-9)
  - `AuthDisabledTests`: 표시 없이 204, 줄 생김 (AC-9)
- 위험: 중간

### 7단계: 04:30 정리 작업 (의존: 2·3단계)

1. **정리** (`usagelog/internal/cleanup/UsageLogCleanup.java` [안])
   - 예시: `auth/internal/cleanup/DailyAccountCleanup.java:65` (cron·zone 설정 값)
   - `@Scheduled(cron = "${chaekcheck.usagelog.cleanup.cron}", zone = "${…zone}")`, 04:30 Asia/Seoul [확정 시각] [안: 키]
   - 순서 [안]
     1. 다섯 기록 표에서 `received_at < now() - interval '30 days' AND client_ip IS NOT NULL` → `client_ip = NULL`
     2. `rejected_event` 30일 지남 → 지움
     3. 기록 표·`dropped_batch`(`dropped_at`)는 `received_at < now() - interval '1 year'` → 지움, `library_response_daily`는 `day`로 [안]
   - "1년" = 받은 시각부터 [확정]
   - 1만 줄씩 나눠서 [안]
   - 기록 설정이 꺼져 있어도 정리는 돕니다 [안]. 지인 기간 기록도 결국 지워지도록 하기 위함입니다
   - 지운·비운 줄 수를 INFO 한 줄로 남깁니다
- 테스트: `UsageLogCleanupTests` [안] (`Clock` 고정, `db-test`)
  - 1년 1일 전 줄은 지워지고 364일 전 줄은 남음 (AC-13)
  - 31일 된 줄은 IP가 NULL이고 나머지 칸은 남음. 29일 된 줄은 IP 있음 (AC-18)
  - `rejected_event` 31일 지움, 29일 남김
  - 나눠 지우기에서 1만 줄 넘는 경우
- 위험: 낮음

### 8단계: 웹 — 공용 보내기 함수, 클릭 알림, 화면 행동 알림 (의존: 6단계, 화면 쪽은 가짜 응답으로 먼저 가능)

1. **공용 보내기** (`web/src/api/usageEvents.ts` [안: 위치], 이름 예 `sendUsageEvent`)
   - `fetch('/api/v1/usage-events', { method: 'POST', keepalive: true, credentials: 'same-origin', JSON })` [확정 keepalive]
   - 로그인 기능 켜짐일 때만 CSRF 표시를 붙입니다(`/api/v1/me` 404 = 꺼짐, `api/auth.ts:111-113`)
     - `XSRF-TOKEN` → `X-XSRF-TOKEN`
     - 없으면 `GET /api/v1/auth/csrf-token`
     - 403 `csrf_invalid`면 한 번 더
     - `api/auth.ts:48` `send` 방식을 따릅니다 [안]
   - 로그인 기능 상태를 아직 모를 때 어떻게 할지는 dev가 정해 보고합니다 [안]
   - 로그인 여부는 보내지 않습니다 [확정]
   - **실패해도 아무것도 보이지 않고 다시 보내지 않습니다** [확정] (R2-7). 예외를 밖으로 던지지 않습니다
2. **클릭 알림**: 링크는 지금처럼 새 탭으로 바로 열립니다. `preventDefault` 없이 같은 클릭에서 보냅니다 [확정]
   - `features/search/ResultRow.tsx`
     - 카드 `:185-191` → `result_card`
     - 가입 링크 `:97-101` → `join_link`
     - 가입 안내 `:106-113` → `join_guide`
     - 도서관 첫 화면 `:62-69` → `home_page`
     - 로고 `:131` → `logo`
     - 결과 줄은 **어느 화면인지**를 넘겨받습니다 (spec R2-2)
   - `components/LibraryLogo.tsx:34-39`: 도서관 번호·화면을 넘겨받게 합니다
   - 요약 막대 이름: `LibrarySummaryBar.tsx`의 `LibraryCell` 첫 화면 링크 `:126-130` (`DirectResults.tsx:122-128` `LibraryCountButton` 안) → `summary_bar`
   - 화면 값과 책 번호 [확정]
     - `direct_results`: `DirectResults`, 책 번호 비움
     - `catalog_results`: `InstantResults.tsx:137`, 책 번호 담음
     - `book_page`: `features/book/BookPage.tsx:149`, 책 번호 담음
     - `picks`: `features/picks/PicksBookDialog.tsx:163`, 책 번호 담음
     - `my_libraries`: `features/mylibrary/MyLibrariesPage.tsx:253,268`, 로고만, 책 번호 비움
   - 가운데 버튼·길게 누르기로 여는 경우까지 셀지는 dev가 보고합니다 [안]
3. **화면 행동 알림** [확정 종류]
   - 사서 추천 목록 보기 `features/picks/PicksPage.tsx:317-325` → `picks_list_view`(`category.code`)
   - 책 창 열기 `PicksPage.tsx:355-362` → `picks_book_view`(분야, 책)
   - 지역 저장 `features/region/RegionContext.tsx:113-128` → `region_change`. 로그인 전 `regionStorage.ts:32`, 뒤 `putMyRegions` 모두 같은 자리에서 보냅니다
   - 내 도서관 넣기·빼기 `MyLibraryContext.tsx:118-157` → `my_library_add`/`my_library_remove`. 로그인 전후 같은 자리에서 보냅니다. 서버 `mylibrary` 코드는 고치지 않습니다 [확정]
   - 목록 보기를 다시 그릴 때마다 보내지 않게 합니다. 분야를 바꾸거나 처음 열 때 한 번 [안]
- 테스트 (Vitest, 가짜 `fetch`)
  - `usageEvents.test.ts` [안]
    - 켜짐: 머리글 붙음, 표시 없으면 받아 옴, 403 `csrf_invalid` 한 번 더
    - 꺼짐: 머리글 없음
    - `keepalive: true`
    - 실패해도 던지지 않음
  - `ResultRow`·`LibraryLogo`·`LibrarySummaryBar` 시험
    - 여섯 곳마다 올바른 `place`·`screen`·`bookId`
    - 링크 `target="_blank"` 그대로, 기본 동작을 막지 않음 (AC-7, AC-8)
  - `PicksPage`·`RegionContext`·`MyLibraryContext` 시험: 종류별 한 번, 로그인 전후 (AC-23)
- 위험: 중간 (여러 화면에 손이 감)

### 9단계: nginx와 robots.txt (의존: 6단계)

1. **사용 알림 한도** (`deploy/nginx/rate-limits.conf:15,20` 근처, `chaekcheck-locations.conf`)
   - 새 zone, 예 `chaekcheck_usage_events` [안: 이름], `rate=60r/m` per `$binary_remote_addr` [확정]
   - `location = /api/v1/usage-events`
     - `limit_req` + 넘치면 기록하지 않고 **204** [확정]. 예: `limit_req_status 429` + `error_page 429 = @usage_events_limited` → `return 204` [안]
     - burst 값은 [안: 지금 도서관 호출 location과 같은 `burst=20 nodelay`, 보고]
     - `proxy_set_header X-Real-IP $remote_addr` 등은 `location /api/`(`:13-21`)와 같게
2. **로봇 거절** [확정 대상] [안: 응답 코드 403]
   - http 단계 `map $http_user_agent $chaekcheck_named_bot { default 0; ~*(bot|crawler|spider) 1; }` [안]
   - 직접 찾기·대출 조회 location에서 서버에 넘기기 전에 `return 403`
     - `:27-29` `^/api/v1/(ebook-searches|book-availabilities)(/batches)?/stream$`
     - `:45` `^~ /api/v1/availability/`
3. `chaekcheck.conf`, `local-test.conf`, `tunnel-test.conf` 셋 모두 새 zone·map을 읽는지 확인합니다. `deploy/nginx/README.md` 표에 한 줄 씁니다
4. **robots.txt** (`web/public/robots.txt` [안: 위치]): `User-agent: *` / `Disallow: /api/` [확정 금지 범위]. nginx에서 `/robots.txt`가 `index.html`이 아니라 이 파일로 나가는지 봅니다(`location /` `:113`)
5. 사용자 IP 복원(`real_ip_header CF-Connecting-IP`, `set_real_ip_from` compose 네트워크 범위)은 **사이클 17 배포 설정**입니다. 15에서는 하지 않습니다
- 테스트 (로컬 nginx 확인 `local-test.conf`, API 호출)
  - UA `…bot…`으로 직접 찾기 → 403, 서비스 로그에 그 요청 없음, `search_event` 0 (AC-6b)
  - `curl /robots.txt`에 `Disallow: /api/` (AC-6b)
  - 같은 IP에서 1분에 80번 POST → 모두 204, 기록 줄은 60 + burst 이하 (AC-11). 실제 줄 수 보고
- 위험: 낮음

### 10단계: 마무리 확인 — 로그인 켬·끔, 성능, 화면 (의존: 1~9단계)

1. **로그인 켬·끔 두 벌** (AC-20, AC-25)
   - 4·5·6단계 통합 시험의 요점(검색·책 상세·더 보기·사용 알림·도서관 응답)을 로그인 켬과 끔에서 각각 돌립니다(시험 클래스 둘 또는 매개변수 [안])
   - 끔에서는 `login_status = login_off`이고 쿠키를 읽지 않습니다(쿠키를 실어도 `login_off`)
   - 켬에서 `GET /api/v1/books`를 네 가지로 보냅니다: 로그인한 쿠키 / 쿠키 없음 / 틀린 서명 / 만료된 우리 서명. 각각 `signed_in` / `signed_out` / `signed_out` / `signed_in`이고, 응답 본문은 넷 다 같아야 합니다
2. **성능 측정** (AC-16, 결과는 `# 사이클 14`가 아니라 `# 사이클 15` 절에)
   - 같은 검색 묶음을 `enabled=false`와 `true`로 돌립니다. 수집 목록 검색과 직접 찾기(가짜 또는 로컬 fetcher) [안: 묶음 구성, 보고]
   - 기준 [확정]: 검색 응답 시간 중앙값 차이 10% 안, 서비스·DB 컨테이너 메모리(`docker stats`) 차이 각각 50MB 안
   - Prometheus·Grafana·node_exporter(사이클 17)를 켠 상태로 재고 그 메모리도 적습니다 [안]. dev에 없으면 없이 재고 그렇다고 적습니다
   - 함께 볼 것: 비우기 한 번 시간, `id` PK·부분 색인 유무 비교, 넣기가 정렬용 메모리를 쓰는지(`EXPLAIN ANALYZE`) [확인 필요: 프로토타입]
3. **Playwright** (데스크톱 1280 먼저, 그다음 768·375)
   - 여섯 곳 클릭 → 새 탭이 열리고 `POST /api/v1/usage-events` 204
   - 사서 추천 목록·책 창, 지역 저장, 내 도서관 넣기·빼기 → 알림 하나씩
   - 화면 모양은 바뀌지 않음 [확정]
   - 끝나면 브라우저 창 크기를 되돌립니다
4. **사용자 실제 폰 확인**: 아래 완료 기준의 폰 줄
5. **dev 운영 메모** (`docs/maintenance/` 아래 [안: 파일 이름]):
   - 기록 켜고 끄기(`CHAEKCHECK_USAGELOG_ENABLED`)
   - 표 여덟 읽는 법과 값 뜻: `login_status`, `place`·`screen`, `reason`, 건너뜀·다시 보내기 셈법
   - 04:30 정리
   - 요청마다 로그 줄 형식
   - 지인 기간 시험 뒤 그 기간 기록 지우는 SQL [안]
- 위험: 중간

## 테스트

- 단위
  - 버퍼 상한·누적 맵, 로봇 UA, 사용 알림 검사(이유 일곱), 2KB 자르기
  - 판별 부품 다섯 경우
  - 웹: 보내기 함수·클릭 자리·화면 행동
- 통합(`db-test`)
  - `UsageLogSchemaTests`, `UsageLogWriteTests`, `UsageLogDisabledTests`, `UsageLogShutdownTests`
  - `CatalogUsageLogTests`, `DirectSearchUsageLogTests`, `LibraryResponseSummaryTests`, `UsageEventApiTests`, `UsageLogCleanupTests`
  - `AuthEnabledSecurityTests`, `AuthDisabledTests`, `ModularityTests`(`ApplicationModules.of(...).verify()`), `DocumentationTests`, 기존 시험 전부
- nginx: `local-test.conf`로 API 호출(AC-6b, AC-11)
- 화면: Vitest, Playwright(데스크톱 먼저), 사용자 실제 폰
- 측정: AC-16
- 빌드 시험은 진짜 도서관 사이트를 부르지 않습니다 (C8)

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 수집 목록 검색 → `search_event` 한 줄(검색어·`totalCount`·지역·도서관) | `CatalogUsageLogTests` + SQL | 4 |
| AC-2 `page=2` → 검색 기록 그대로, `search_more` 한 줄 | `CatalogUsageLogTests` | 4 |
| AC-3 직접 찾기 첫 묶음 → 한 줄·결과 수, 더 보기 둘 → `search_more` | `DirectSearchUsageLogTests` | 5 |
| AC-4 첫 묶음 전 닫힘 → 결과 수 빈 한 줄, 보낼 것 없이 닫힘도 마감 뒤 한 줄 | `DirectSearchUsageLogTests` | 5 |
| AC-5 400·422 → 기록 없음 | `CatalogUsageLogTests` | 4 |
| AC-6 UA `Googlebot` → 기록 없음 | `UsageLogBufferTests` + `CatalogUsageLogTests` | 3, 4 |
| AC-6b nginx 로봇 거절, `robots.txt` | 로컬 nginx API 호출 | 9 |
| AC-7 여섯 누른 곳 → 새 탭 + `library_click` | Vitest + `UsageEventApiTests` + Playwright | 6, 8, 10 |
| AC-8 책 페이지 → 책 번호 있음, 직접 찾기 → 비움 | Vitest + Playwright | 8, 10 |
| AC-9 켬: CSRF 표시로 기록·없으면 403 / 끔: 표시 없이 기록 | `UsageEventCsrfTests`·`AuthDisabledTests` + `usageEvents.test.ts` | 6, 8 |
| AC-10 없는 도서관·틀린 누른 곳 → 204, `rejected_event` IP·이유 | `UsageEventApiTests` | 6 |
| AC-11 IP당 1분 60번 넘음 → 기록 안 됨 | 로컬 nginx | 9 |
| AC-12 회원 번호·UA·쿠키 칸 없음 | `UsageLogSchemaTests` | 2 |
| AC-13 1년 1일 전 지움, 364일 전 남김 | `UsageLogCleanupTests` | 7 |
| AC-14 DB 쓰기 실패에도 검색·링크 정상 | `UsageLogWriteTests`(실패 흉내 중 검색 200) | 3 |
| AC-15 정상 종료 → 직전 기록 남음 | `UsageLogShutdownTests` | 3 |
| AC-16 끔·켬 응답 시간 중앙값 10% 안, 메모리 각 50MB 안 | 측정 | 10 |
| AC-17 책 페이지 → `book_view` 한 줄, 대출 수 채우기로 안 늘어남 | `CatalogUsageLogTests` + `LibraryResponseSummaryTests` | 4, 5 |
| AC-18 31일 IP NULL, 29일 IP 있음 | `UsageLogCleanupTests` | 7 |
| AC-19 실패 뒤 성공 → `dropped_batch` 한 줄 + 로그 | `UsageLogWriteTests` | 3 |
| AC-20 로그인 켬·끔 모두 통과, 끔은 `login_off`·쿠키 안 읽음 | 두 벌 통합 시험 | 1, 10 |
| AC-21 설정 꺼짐 → 기록 없음, 켬 → 생김 | `UsageLogDisabledTests` | 3 |
| AC-23 사서 추천 목록·책 창, 지역, 내 도서관 → `screen_event` 각 한 줄(로그인 전후) | Vitest + `UsageEventApiTests` + Playwright | 6, 8, 10 |
| AC-24 도서관별 하루 줄에 수·시간 합·최댓값, 요청마다 로그 | `LibraryResponseSummaryTests` | 5 |
| AC-25 켬: 로그인함/안 함/틀린 서명/만료 → signed_in/out/out/in, 결과 같음 | `LoginStatusReaderTests` + 10단계 통합 | 1, 10 |
| AC-26 `access_token` 경로 `/api/v1` | `AuthEnabledSecurityTests` | 1 |

- 참고: spec에는 AC-22가 없습니다(번호가 비어 있음).

## 완료 기준

- [ ] spec의 수용 기준(AC-1~AC-21, AC-6b, AC-23~AC-26)을 위 표의 방법으로 모두 확인하고, AC 확인표를 `# 사이클 15` 절에 적음
- [ ] `./gradlew build` 통과(`ModularityTests`의 `ApplicationModules.of(...).verify()`, `usagelog` 의존 `library`·`auth`, `DocumentationTests` 포함)
- [ ] `npm test`, `npm run build`, `npm run lint` 통과, Playwright 데스크톱 → 태블릿 → 폰
- [ ] 로그인 기능 켬·끔 두 설정에서 기록 시험 통과
- [ ] `chaekcheck.usagelog.enabled` 기본값이 false이고 `.env.example`에 있음
- [ ] 화면 모양·문구는 바뀌지 않지만 폰에서 링크를 누르는 동작이 바뀝니다. 그래서 사용자가 자기 폰(Samsung Internet)에서 dev 웹 서버 `web-lan-5174`(`.claude/launch.json`, 같은 Wi-Fi)로 직접 확인한 뒤 사이클을 닫습니다 [확정] (사용자 승인, 2026-10-14, `easy/2026-10-14-handoff-review.html` #3)
  - 확인할 것: 결과 카드·로고·가입 링크를 누르면 새 탭이 지금처럼 바로 열리고, 사용 알림이 기록되는지(SQL)
  - Chrome 폰 흉내로 갈음하지 않습니다(사용자 결정, 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-design-addendum-decisions.html` #3)
- [ ] AC-16 측정 기록
- [ ] [확인 필요] 결과와 설계와 달라진 점을 `# 사이클 15` 절에 적음

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 막는 단계 |
|---|---|---|
| `SmartLifecycle` 정지 phase와 Hikari 닫힘 순서 | 프로토타입 (`UsageLogShutdownTests`) | 3 |
| dev pgjdbc 실제 버전 | 의존성 트리 | 3 |
| `id` PK·부분 색인을 둘지 (넣기 비용), 넣기가 정렬용 메모리를 쓰는지 | 프로토타입, AC-16 측정 (`docker stats`, `EXPLAIN ANALYZE`) | 없음 (10단계에서 보고) |
| nginx 이미지의 realip 모듈, compose 네트워크 범위, Cloudflare "Remove visitor IP headers" 꺼짐 | 배포 때 `nginx -V`, 지인 기간 시험에서 기록된 IP 확인 (사이클 17) | 없음 (배포 때) |
| 광고 차단으로 빠지는 알림 비율 | 지인 기간 실서버 시험 | 없음 |
| Google 등 검색 로봇이 화면 실행 중 검색 API를 부르는지 | 운영 뒤 서버 로그 | 없음 |

## 이번에 하지 않는 것

- 기록을 보는 화면, 통계·그래프 (다음 사이클)
- 회원 번호·쿠키로 같은 사람 잇기, 검색과 클릭을 잇는 칸 (R2-6)
- 화면 머문 시간, 스크롤, 그 밖의 버튼
- 사용자가 기록을 끄는 설정, 빠진 알림 다시 보내기
- 분석 전용 저장소로 옮기기
- 옛 경로(`/api/v1/me`) 쿠키 지우기 코드
- `mylibrary` 서버 저장 코드 고치기
- nginx 사용자 IP 복원(`real_ip_header`, `set_real_ip_from`), WAF·Cloudflare 요청 한도 규칙, 접속 기록·백업·서비스 로그 보관 설정 (사이클 17)
- 운영 배포와 기록 켜기 (첫 배포는 꺼짐, 지인 기간 시험·공개일 켜기는 운영 일)
- 처리방침 문구 (사이클 16)
- 수집기(책 목록 수집)의 도서관 응답 세기 [확정 제외] (R6-4)

## 15 밖이지만 dev가 알아 둘 것

- **nginx 화면 주소 목록과 `/picks`**: design-delta(2026-10-14 확인)는 `deploy/nginx/chaekcheck-locations.conf:90`의 화면 주소 정규식에 `/picks`가 없다고 적었고, 사이클 17이 배포 설정에서 고치기로 했습니다(회고 결정 #5). plan이 인계서를 쓰며 dev 작업 폴더를 다시 읽어 보니(2026-10-14) 이미 `:91`에 `picks`가 들어 있고 "2026-10-14 터널로 열다 발견" 주석이 있었습니다. 15에서는 고치지 않습니다. main에 커밋된 상태인지만 확인해서 `# 사이클 15` 절에 한 줄 적어 주세요
- **사이클 11 측정 데이터 정리**: 약 14GB를 지워도 됩니다(사용자 승인, 2026-10-14). 작업 폴더 둘, 운영 흉내 DB 볼륨 약 9GB, 결과 파일 약 4GB, 덤프 1.2GB가 대상입니다. **`data/cycle13/` 백업은 남깁니다**(사이클 11 운영 흉내 반영 기록의 근거). 15 개발과 섞지 말고 따로 하고, 지운 것과 크기를 `# 사이클 15` 절에 적습니다

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 15`** 절에 **무엇이 달라졌는지와 이유**를 적습니다(사용자 발언은 그대로). 쿠키·토큰 값은 적지 않습니다.

- 시작 상태: 시작 커밋, master 맨 끝 include, 16과 합친 순서와 rebase로 옮긴 줄
- 정한 이름: `UsageLog` 메서드·record, `LoginStatusReader`·`LoginStatus`, 안쪽 패키지·클래스, 설정 키·환경 변수, changeset id·제약 이름, JSON 칸 이름, 웹 함수 위치, nginx zone·map 이름, burst 값
- `auth`
  - CSRF 범위를 실제로 고쳤는지, 기본 CSRF로 이미 덮였는지
  - 서명만 보는 디코더를 어떻게 만들었는지
  - 쿠키 경로를 바꾸고 로그인·로그아웃에서 회귀가 없었는지
  - 반대 조건 어노테이션을 새로 만들었는지
- 직접 찾기 "한 번만" 기록 방법(`SseEmitter` 콜백을 더했는지), 다음 묶음에서 조건 칸을 얻은 곳과 못 얻은 칸
- 도서관 응답 분류에서 설계와 다른 경우(`UpstreamException` Kind, 다시 보내기 시간, 대출 수 채우기에서 세지 않은 경우), 요청마다 로그 줄 형식
- 버퍼·비우기
  - 실패 때 도서관 응답 누적도 버렸는지
  - 버린 묶음 기록 메모리 상한
  - 비우기 스레드
  - `SmartLifecycle` phase와 종료 순서 확인 결과
- 사용 알림 검사에서 정한 상한(본문 크기, 배열 길이, 분야 값), 로그인 기능 상태를 모를 때의 처리, 가운데 버튼 클릭을 셌는지
- AC-11 실제 줄 수, AC-16 측정값(응답 시간 중앙값, 메모리, 비우기 시간, `id`·부분 색인 비교, 모니터링 도구를 켰는지)
- 사용자 실제 폰 확인 결과
- "15 밖" 두 줄의 결과(`/picks` 커밋 여부, 지운 데이터)
- [확인 필요] 표 각 행의 결과, 설계와 달라진 점, 새로 알게 된 제약, AC 확인표
