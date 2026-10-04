# 개발 인계서: 사이클 05 로그인·계정 (네이버·카카오 소셜 로그인)

## 요약

네이버나 카카오 계정으로 로그인하고, 로그아웃하고, 탈퇴할 수 있게 합니다. 서버에 남는 것은 계정 번호, 로그인 수단(제공자 + 제공자 쪽 번호), 동의 기록, 리프레시 토큰뿐입니다.
- 새 모듈 `auth`(패키지 `com.chaekcheck.auth`)를 만들고, 스키마 `auth`, `modulith`를 더합니다. 기존 모듈 넷(`region`, `library`, `catalog`, `availability`)과 기존 API는 바뀌지 않습니다.
- 서버 설정 하나(`chaekcheck.auth.enabled`, 기본 꺼짐)로 로그인 기능 전체를 켜고 끕니다. 꺼져 있으면 사이클 04와 똑같이 동작해야 합니다. 그래서 **켜고 끄는 설정을 가장 먼저** 만들고, 이후 단계는 모두 "꺼짐이면 사이클 04 그대로"를 지키면서 쌓습니다.
- 웹에는 다음이 생깁니다.
  - 위쪽 로그인·로그아웃 버튼, 로그인 선택 창(S5), `/signup`(S6), `/auth/complete`
  - 설정 창 "계정" 절(탈퇴만), 탈퇴 안내 창(S7), `/terms`(S8), `/privacy`(S9)
  - 안내 줄 문구, Web Locks를 쓴 갱신, CSRF 헤더

**포함**
- 의존성 넷과 켜고 끄는 설정
- Liquibase `auth`·`modulith` 스키마
- 앱 전체 `SecurityFilterChain`(보호 경로는 `/api/v1/me/**`뿐)
- JWT 발급·검증, 리프레시 토큰 교체, 로그아웃
- 네이버·카카오 `oauth2Login`, 가입 대기(HttpSession)·동의·가입·가입 취소
- 재인증을 거친 탈퇴, 카카오 연결 해제 웹훅, 네이버 연결끊기 Callback
- `AccountDeleted` 이벤트와 발행 저장소, `auth` 안의 listener 하나
- 하루 한 번 도는 작업 셋: 만료된 리프레시 줄 정리, 카카오 연결 대조, 마지막 로그인이 1년을 넘은 계정 정리
- 웹 화면, 운영 웹 서버 설정 예시 파일(보안 헤더)

**제외**: 회원 자료(`member`)·내 도서관·지역 저장(사이클 06), 알림(사이클 07), 직접 회원가입(이메일·비밀번호), Expo 앱 로그인, 닉네임·프로필 사진 표시, Redis(Spring Session Redis), 저장소 분리. 자세한 내용은 "이번에 하지 않는 것"에 있습니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다.
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) **조용히 바꾸지 말고** 먼저 사용자에게 알리세요.
  - 설계와 맞지 않는 사실을 발견했을 때도 같습니다. 예: 콘솔이 돌아올 주소를 하나만 받음, Spring 기본 동작이 설계의 가정과 다름.
  - 내용과 이유는 dev `docs/plan-feedback.md`의 **새 `# 사이클 05` 절**에 쌓습니다. 사용자 발언이면 그대로 옮깁니다. 이 절이 다음 `/cycle-start` 회고의 입력이 됩니다.
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값입니다.
  - `[확인 필요]`: 모르는 값입니다. 확정된 것처럼 코드에 넣지 마세요(필요하면 `TODO(확인 필요)` 주석). 확인한 뒤 결과를 보고합니다.
- **설계가 dev에게 맡긴 선택 가운데 아래 셋은 dev가 안을 만들어 사용자에게 묻고, 사용자가 고른 뒤에 구현합니다.**
  1. 웹이 로그인 기능이 켜져 있는지 아는 방법
  2. 기능이 꺼져 있을 때 `auth`·`modulith` 표를 만들지 말지
  3. `spring-modulith-starter-jdbc`를 어디에 둘지(항상 classpath에 둘지, 켜짐일 때만 동작하게 할지 등)
- 이 셋 말고 인계서가 "dev가 정함"이라고 적은 것(클래스·패키지·파일 이름, 환경 변수 이름, 엔티티와 `JdbcClient` 중 무엇을 쓸지)은 dev가 정하고 `# 사이클 05` 절에 보고합니다.
- **비밀 값은 환경 변수로만 받습니다.** JWT 서명 키, 네이버 client secret, 카카오 REST API 키·client secret·어드민 키가 해당합니다.
  - 코드, `application.yml`, 테스트 고정 파일, 커밋, 로그, 대화에 값을 쓰지 않습니다.
  - 로컬에서는 기존 방식대로 저장소 밖에 커밋되지 않는 `.env`에 둡니다(`application.yml`의 `spring.config.import` 참고).
  - `.env.example`에는 **이름만** 더합니다.
- 새 의존성 넷은 사용자가 승인했습니다 [확정] (2026-10-04, 설계 검토 11). 그 밖의 의존성은 **사용자에게 먼저 알리고 승인받은 뒤** 더합니다. 테스트용 의존성(보안 테스트 starter, HTTP 목 서버 등)도 마찬가지입니다.
- 단계마다 적힌 확인이 통과해야 다음 단계로 넘어갑니다.
  - 백엔드: `backend/`에서 `./gradlew build` (`ModularityTests`, `DocumentationTests` 포함)
  - 웹: `web/`에서 `npm test`, `npm run build`, `npm run lint`
  - `fetch-service/`는 바뀌지 않습니다.
- JSON 예시, 표 정의, 결과 코드 표 전체는 여기 다 옮기지 않았습니다. **구현 기준은 `design-delta.md`입니다.**

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/05-login-account/design-delta.md`: **기준 문서**
  - 정해진 것 표, 구조 그림(흐름 넷), 모듈 표, 데이터(표 넷 + 발행 저장소)
  - API 표와 예시, 결과 코드 표, "로그인 기능 켜고 끄기", 외부 연동 표, "인계서에 넣을 제약" 1~32, 확인 필요
- `../chaekcheck-plan/docs/cycles/05-login-account/spec.md`: R1~R10, 상태별 동작, AC-1~AC-21, 비목표
- `../chaekcheck-plan/docs/cycles/05-login-account/flow.md`: S1(변경), S4(계정 절), S5, S6, S7, S8, S9, 상태와 정해진 문구
- `../chaekcheck-plan/docs/cycles/05-login-account/scope.md`: "설계 단계에서 바뀐 것" 표
- `../chaekcheck-plan/docs/cycles/05-login-account/research.md`
  - 1절 PKCE
  - 2절 네이버 제공 항목
  - **3절 네이버 연결끊기 Callback 암호 세부(키 유도, IV 위치, 서명 원문)**
  - **4절 버튼 디자인 지침**
  - 5절 약관·처리방침
  - 7절 카카오 앱 준비
  - 9·11절 CSRF·보안 헤더
  - 13절 카카오 `/v1/user/ids`, 대기 시간
- ADR (`../chaekcheck-plan/docs/adr/`)
  - 0036: `auth`와 `member` 분리
  - 0037: 검색은 회원을 모름. 이번에는 구현 없음
  - 0038: JWT(15분) + DB 리프레시 토큰, 받아들인 한계
  - 0039: `login_method(method, subject)`, 프로필 API
  - 0040: 임시 값은 `HttpSession`(10분)
  - 0041: `AccountDeleted`, 발행 저장소, 완료 기록 삭제
  - 0042: 같은 출처, `/api/v1/auth/**`, 쿠키 Path
  - 0043: 재인증 기준과 전용 등록
  - 0044: `auth`가 `SecurityFilterChain`을 가짐
  - 0045: 결과 코드를 주소로 전달
  - 0046: 켜고 끄는 설정, 저장소는 나누지 않음
- 공식 출처: `spec.md` "데이터 출처" 표와 `research.md`의 URL. 제공자 엔드포인트 호스트, 요청 파라미터, client 인증 방식은 **코드에 넣기 전에 원문을 한 번 더 확인합니다.**

## 지켜야 할 제약

dev `CLAUDE.md`와 스킬 규칙(`.claude/skills/spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`)을 따릅니다. 아래는 `design-delta.md` "인계서에 넣을 제약" 1~32를 주제별로 다시 묶은 것입니다. 괄호 안 번호는 원래 번호입니다.

### 모듈 경계
- C1. `auth`는 다른 모듈에 의존하지 않고, 다른 모듈도 `auth`에 의존하지 않습니다(AC-18).
  - 보안 설정이 다른 모듈의 경로를 다룰 때는 문자열 규칙으로만 다룹니다.
  - 공개 타입은 `com.chaekcheck.auth.AccountId`(record), `com.chaekcheck.auth.AccountDeleted(accountId)` [확정 이름]입니다.
- C2. 루트 `ApiExceptionHandler`는 바꾸지 않습니다. 보안 필터 단계의 401/403은 `auth`의 `AuthenticationEntryPoint`·`AccessDeniedHandler`가 ProblemDetail(`code`)로 직접 씁니다. 필터 단계 오류는 MVC advice에 오지 않습니다 (11).
- C3. `AccountDeleted` 안에는 accountId만 넣습니다. 엔티티나 제공자 번호는 넣지 않습니다 (10).

### 요청과 CSRF
- C4. 상태를 바꾸는 요청은 GET으로 만들지 않습니다 (1).
  - 변경 메서드는 모두 CSRF(`X-XSRF-TOKEN`)를 요구합니다.
  - 예외는 웹훅 두 곳(`/api/v1/auth/webhooks/kakao-unlink`, `/api/v1/auth/webhooks/naver-unlink`)뿐이고, `ignoringRequestMatchers`로 뺍니다.
  - CSRF 403은 모두 `code: csrf_invalid`입니다.
- C5. 내 자료 API는 `/api/v1/me/...`입니다. 주소에 계정 번호를 넣지 않고, 계정은 토큰의 `sub`로만 정합니다 (2).
- C6. Security를 넣어도 기존 경로는 모두 `permitAll`이고, 보호 경로는 `/api/v1/me/**`뿐입니다 (6).
  - 기본 form login, HTTP Basic, 자동 생성 사용자 비밀번호는 끕니다.
- C7. `POST /api/v1/auth/signup`은 201이지만 `Location` 헤더를 주지 않습니다 (23).
  - `auth.refresh_token.rotated_at`과 `AccountId`는 이번에 쓰는 곳이 적습니다. 사이클 06을 위한 준비입니다.

### 토큰과 쿠키
- C8. JWT는 HS256 하나로 고정합니다 (15).
  - 클레임은 `sub`(계정 번호)와 `exp`만 넣고, `iat`는 넣지 않습니다.
  - 키는 환경 변수의 무작위 32바이트 이상 값(base64)입니다. 사람이 지은 문자열은 쓰지 않습니다.
  - 근거: RFC 7518 3.2절, RFC 8725 3.5.
- C9. 리프레시 토큰은 CSPRNG 256비트이고, DB에는 SHA-256 해시만 둡니다 (15).
- C10. 갱신은 `token_hash`와 `previous_token_hash` 둘 다로 줄을 찾습니다(`FOR UPDATE`) (20).
  - 지금 값이면 교체합니다(`expires_at`은 그대로).
  - 바로 앞 값이면 그 줄을 삭제합니다(재사용).
  - 어느 쪽도 아니면 줄을 지우지 않고 401을 줍니다.
- C11. 쿠키 (19)

  | 쿠키 | 속성 | `Path` | `Max-Age` |
  |---|---|---|---|
  | `access_token` | `Secure`, `HttpOnly`, `SameSite=Lax`, `Domain` 없음 | `/api/v1/me` | 15분 |
  | `refresh_token` | 같음 | `/api/v1/auth` | 남은 로그인 기간 |

  - 쿠키를 지우는 응답(로그아웃, 갱신 실패, 탈퇴)은 발급 때와 **같은 이름·`Path`·속성**으로 만료시킵니다.
- C12. 세션 쿠키(로그인 도중의 임시 값용)는 `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/api/v1`, 수명 10분입니다 [확정] (31).
  - 로그인 상태를 담지 않고, 공개 API는 이 쿠키를 보지 않습니다.
- C13. 웹은 토큰 쿠키와 세션 쿠키를 읽지 않습니다 (4).
  - 웹이 읽는 쿠키는 `XSRF-TOKEN` 하나뿐입니다(`HttpOnly` 아님, `Secure`, `SameSite=Lax`). 그 값을 `X-XSRF-TOKEN` 헤더에 넣습니다.
  - 로그인 여부는 `/api/v1/me`로만 압니다.
  - 토큰을 `localStorage`·`sessionStorage`에 두지 않습니다. `sessionStorage`에는 돌아올 주소만 둡니다.
- C14. JWT 서명 키를 바꾸는 절차는 환경 변수를 바꾸고 재시작하는 것입니다 (21).
  - 옛 키의 액세스 토큰은 401이 되고, 웹이 갱신으로 새 토큰을 받습니다.
  - 자동 교체는 하지 않습니다.

### 제공자와 임시 값
- C15. 제공자 토큰은 DB에도 서버 로그에도 남기지 않습니다 (5).
  - Spring 기본 `InMemoryOAuth2AuthorizedClientService`가 제공자 토큰을 메모리에 계속 쌓지 않게 설정합니다 [확인 필요: Spring 문서].
  - oauth2Login 성공이 세션 로그인을 만들지 않게 합니다(SecurityContext 저장소 교체).
- C16. 임시 값(가입 대기, 재인증 증명, 네이버 접근 토큰)은 `HttpSession` 속성으로만 다룹니다 (14).
  - 정적 변수나 직접 만든 메모리 맵에 들고 있지 않습니다.
  - 나중에 Spring Session(Redis)을 설정으로 켰을 때 코드가 그대로 동작해야 합니다. 세션에 넣는 값은 직렬화 가능해야 합니다.
- C17. 세션이 만료될 때(10분) 가입 대기가 남아 있으면 제공자 연결을 끊습니다(카카오 `unlink`, 네이버 `revoke`) (18).
  - 실패는 서버 로그에만 남깁니다.
  - 서버를 다시 켜면 메모리 세션이 사라져 그 연결은 끊기지 않습니다. 알고 받아들인 한계입니다.
- C18. redirect URI는 설정 값(환경 변수, 이름은 dev가 정함)으로 명시합니다 (7).
  - Vite `changeOrigin: true`인 채로 `{baseUrl}`을 쓰지 않습니다.
  - 같은 이유로, 콜백 뒤 `/auth/complete`·`/signup`으로 보내는 302의 `Location`도 요청의 `Host`로 만들지 않습니다. 상대 경로를 쓰거나 설정 값으로 만들고, 고른 방법을 보고합니다.
- C19. 웹훅·콜백은 멱등입니다 (9).
  - 서명·키 비교는 시간이 일정한 비교(`MessageDigest.isEqual`)로 합니다.
  - 카카오 웹훅은 3초 안에 응답합니다.
- C20. 제공자 호출 대기 시간은 연결 3초, 응답 5초입니다 [확정] (사용자 승인, 2026-10-04). 근거 문서가 있는 값은 아니므로 실제 호출로 맞는지 봅니다.
  - Spring Security의 토큰·프로필 호출에도 적용합니다.
  - `availability`의 도서관 호출 설정(`chaekcheck.availability.*`)은 바꾸지 않습니다. 전역 `spring.http.clients.*`를 쓰면 기존 호출에 영향이 없는지 확인합니다.

### 결과 코드와 화면
- C21. 결과 코드 (13)
  - 주소에는 `design-delta.md` 결과 코드 표에 있는 코드만 넣습니다. 토큰·회원번호 같은 값은 넣지 않습니다.
  - 웹은 목록에 있는 코드만 정해진 문구로 바꿔 보이고, 코드 글자를 화면에 그대로 찍지 않습니다.
  - `provider`는 `naver`, `kakao`만 받고 그 밖의 값은 무시합니다.
  - 서버는 코드로 판단하지 않습니다.
  - 돌아갈 주소는 `/`로 시작하고 `//`로 시작하지 않는 경로만 씁니다.
- C22. React에서 `dangerouslySetInnerHTML`을 쓰지 않습니다. 도서관에서 읽어 온 글자와 약관 본문도 마찬가지입니다 (3).
- C23. `/api/v1/me` 응답의 `loginMethods`는 화면에 보이지 않습니다 (22).
  - 쓰는 곳은 두 군데뿐입니다: 재인증 시작 주소 고르기, S7 안내의 제공자 이름 한 줄 (32).
  - 별명·프로필 사진은 받지 않습니다. 다만 나중에 `auth.account`에 칸을 더할 수 있게, 응답과 화면 위쪽 배치를 그 확장을 막는 모양으로 굳히지 않습니다 (17).
- C24. 가입 화면에서 `409 document_version_mismatch`가 오면 다음 순서로 처리합니다 [확정] (24).
  1. "약관이 바뀌었어요. 다시 확인해 주세요"를 보입니다.
  2. `GET /api/v1/auth/signup`으로 새 버전을 받습니다.
  3. 확인란을 모두 비운 상태로 다시 보입니다.
- C25. `403 reauthentication_required`는 `reauthentication_expired`와 같은 문구("본인 확인 시간이 지났어요. 탈퇴를 다시 눌러 주세요")로 보입니다 [확정] (25).
- C26. `POST /api/v1/auth/signup`이 같은 `(method, subject)`로 두 번 와서 UNIQUE에 걸리면, 오류로 답하지 않습니다. 먼저 만들어진 계정으로 로그인 처리합니다(같은 201과 쿠키) [확정] (26).
- C27. 문서 버전의 원본은 서버 설정입니다 [확정] (27).
  - 형식은 `YYYY-MM-DD`(시행 날짜)입니다.
  - 웹의 약관·처리방침 파일에 적힌 버전·시행일이 서버 설정과 같은지 확인하는 테스트를 둡니다.

### 삭제와 정리 작업
- C28. 발행 저장소는 `completion-mode=delete`입니다 (16).
  - 설정: `spring.modulith.events.jdbc.schema=modulith`, `spring.modulith.events.jdbc.schema-initialization.enabled=false`, `spring.modulith.events.completion-mode=delete` [확정].
- C29. 카카오 연결 대조 [확정] (28)
  - 하루 한 번 `GET /v1/user/ids`(어드민 키, 한 번에 100명, 분당 100회)로 연결된 회원번호를 **끝까지** 받습니다.
  - 우리 `login_method(KAKAO, …)`에 있는데 목록에 없는 계정을 탈퇴와 같은 순서(삭제 + `AccountDeleted`)로 지웁니다.
  - 목록을 끝까지 받지 못한 날(호출 실패, 한도 초과)은 아무도 지우지 않습니다.
- C30. 오래 로그인하지 않은 계정 정리 [확정] (29)
  - 하루 한 번 `last_login_at`이 1년을 넘은 계정을 탈퇴와 같은 순서로 지웁니다.
  - 제공자 연결 끊기는 카카오만 어드민 키로 시도합니다. 네이버는 토큰이 없어 건너뜁니다.
  - 1년은 근거 문서가 있는 값이 아니라 제안을 승인한 값입니다.
- C31. 만료된 `refresh_token` 줄은 하루 한 번 정리합니다 [확정].

### 켜고 끄기와 탈퇴 안내
- C32. `chaekcheck.auth.enabled`(기본 꺼짐)가 꺼져 있으면 사이클 04와 같이 동작합니다 (30).
  - 로그인 주소가 없고(404), 보안 필터가 없습니다(사이클 04와 같은 응답과 헤더).
  - 웹에 로그인 관련 요소가 없고, 네이버·카카오·JWT 키 없이 서버가 켜집니다.
  - 정리 작업 셋도 돌지 않습니다.
  - 설정 이름은 설계의 제안이므로 바꾸면 보고합니다.
- C33. 탈퇴 안내 창(S7)에 "네이버와 chaekcheck의 연결도 끊어요"를 보입니다. 카카오로 로그인한 사람에게는 "카카오와 chaekcheck의 연결도 끊어요"입니다 [확정] (32).
  - 제공자 이름이 보이는 곳은 이 창 한 곳뿐입니다(AC-5는 그대로).
- C34. 테스트 목록 (12)은 아래 "테스트" 절에 모두 반영했습니다.

### 알고 받아들인 한계 (ADR-0038, 0040)

이 한계는 버그로 고치지 말고 그대로 둡니다.
- 로그아웃 전에 누가 빼낸 액세스 토큰은 만료까지 최대 15분(시계 오차 60초를 더하면 약 16분) 동안 통과합니다. OWASP ASVS 5.0 7.4.1에 이만큼 못 미칩니다.
  - 탈퇴한 계정의 토큰은 계정 확인 때문에 바로 막힙니다.
- 갱신 응답이 유실되면 그 브라우저는 다음 갱신 때 로그아웃됩니다(서버가 바로 앞 값을 봐주지 않음).
- 재사용 감지는 바로 앞 값까지만 합니다.
- 서버를 다시 켜면 그 순간 로그인 중(제공자 화면, 동의 화면)이던 사람은 처음부터 다시 합니다. 버려진 가입 대기의 제공자 연결도 끊기지 않습니다.
- 탈퇴 재인증이 실제로 일어났는지는 제공자에 보낸 요청(`prompt=login`, `auth_type=reauthenticate`)을 믿는 수준입니다(ADR-0039).

## 개발 시작 전 확인

### dev가 확인하거나 할 것

- [ ] base package는 `com.chaekcheck`로 정해져 있습니다(`backend/build.gradle`의 `group`). 새 모듈 패키지는 `com.chaekcheck.auth`입니다.
- [ ] **사용자에게 물어 정할 것 세 가지**(위 "이 인계서를 쓰는 규칙"). 1단계 전에 안을 만들어 묻습니다.
  1. 웹이 켜짐·꺼짐을 아는 방법. 빌드 때 값을 넣을지, 실행 중 서버에 물을지 등 장단점을 함께 보입니다.
  2. 꺼짐일 때 `auth`·`modulith` 표를 만들지 말지. Liquibase는 지금 모든 changeset을 적용합니다.
  3. `spring-modulith-starter-jdbc`를 어디에 둘지. 꺼짐 + 표 없음일 때 JDBC 발행 저장소가 시작 단계에서 표를 찾다가 실패하지 않는지도 함께 확인합니다 [확인 필요: Spring Modulith 문서·프로토타입].
- [ ] 의존성 이름 확인: Boot 4.1 공식 Starters 표에서 `spring-boot-starter-security-oauth2-client`, `spring-boot-starter-security-oauth2-resource-server`가 맞는지 봅니다 [확인 필요]. 근거로 든 것은 https://github.com/spring-projects/spring-boot/issues/50294 제목과 제3자 글뿐입니다.
  - 테스트용 보안 starter 등 짝 의존성이 필요하면 이름·버전을 공식 출처로 확인한 뒤 사용자 승인을 받습니다.
- [ ] Spring Modulith 2.1.1(`build.gradle`의 BOM)과 Boot 4.1.1의 호환, `event_publication` 공식 DDL(https://docs.spring.io/spring-modulith/reference/appendix.html)을 확인합니다 [확인 필요].
- [ ] dev 문서 수정 요청 (`docs/reference-index.md` 7절, 아직 열려 있음. 2026-10-04 dev 파일로 확인)
  - `docs/library-maintenance.md` 41~42행 표가 깨져 3절 도구 표의 `CheckYes24Sites.java` 행이 1절 데이터 구조 표 안으로 들어가 있습니다. 3절 표에 되돌립니다.
  - 4-10 표(275행 부근)에 `YES24_V3`가 빠져 있습니다.
  - 절 번호 순서를 정리합니다. 4-9가 4-11 뒤에 있고, 13절과 14절 순서가 뒤바뀌어 있습니다.
  - C2-U-7에 대한 사용자 답 [확정] (2026-10-01): "절차 원본 = dev `library-maintenance.md`, 조사 기록 = plan". `plan-feedback.md` C2-U-7 항목에 이 답을 적습니다.
  - 고치기 전에 사용자에게 알리고, 고친 뒤 `# 사이클 05` 절에 적습니다.
- [ ] 운영 웹 서버 설정 예시를 새 폴더에 두면, dev `CLAUDE.md` Directory Layout에 한 줄 더할지 사용자에게 묻습니다(사이클 04 `docker/` 때와 같은 방식).
- [ ] 정리 작업 셋은 04:00(Asia/Seoul)에 돕니다 [확정] (사용자 승인, 2026-10-04, 인계서 검토). 값은 서버 설정으로 둡니다.
  - [ ] dev `CLAUDE.md`의 낡은 줄 "Group ID and base package: not decided yet"을 실제 값(`com.chaekcheck`)에 맞게 고칩니다(사용자 승인, 2026-10-04). 고치기 전에 사용자에게 알립니다.

### 사용자가 할 것 (dev는 필요한 주소 문자열을 만들어 사용자에게 줌)

| 할 일 | 언제 | 결과를 dev에 알려 줄 것 |
|---|---|---|
| 네이버 개발자센터에 앱을 등록하고 Callback URL을 **두 줄**(`naver`용, `naver-reauth`용) 넣어 보기 | 5단계 전 | **두 줄이 모두 받아지는지**. client id·secret은 환경 변수로만 전달 |
| 네이버 앱 등록의 제공 항목 화면에서 아무 항목도 고르지 않으면 식별자만 오는지, 닉네임이 빠질 수 있는지 보기 | 13단계(동의 고지 문구) 전 | 화면에서 본 것. 동의 고지의 "항목" 문구가 이것에 달려 있음 |
| 네이버 검수 전 테스터 아이디 등록 | 5단계 실제 로그인 전 | 등록 여부 |
| 카카오 앱 생성, 카카오 로그인 켜기, Redirect URI **두 줄**(`kakao`, `kakao-reauth`), client secret 켜기, 동의항목은 켜지 않음 | 5단계 전 | **두 줄이 모두 받아지는지**. REST API 키·client secret·어드민 키는 환경 변수로만 |
| 카카오 웹훅 헤더의 "대표 어드민 키"와 unlink의 "서비스 앱 어드민 키"가 같은 키인지 콘솔에서 보기 | 9단계 전 | 같은지 다른지 |
| 카카오 연결 해제 웹훅 URL 등록, 콘솔에서 POST로 받을 수 있는지 보기 | 공개 주소가 생긴 뒤(배포 준비) | GET만 되는지 POST도 되는지 |
| 네이버 연결끊기 Callback URL 등록 | 공개 주소가 생긴 뒤(배포 준비) | 등록 여부 |
| 카카오 앱에 개인정보 처리방침 URL 등록 | `/privacy`가 공개 주소로 열린 뒤 | 등록 여부 (scope 완료 기준) |
| 이용약관·처리방침·동의 고지 문구 검토, 보호책임자 기재, 문서 버전(시행 날짜) 결정 | 배포 전 | 문구와 버전. 그 전에는 dev가 "검토 전" 표시를 단 자리 글로 둠 |

### 무엇이 어느 단계를 막는가

| 막는 것 | 막히는 단계 | 막히지 않는 것 |
|---|---|---|
| 사용자 질문 세 가지(웹이 켜짐을 아는 방법, 꺼짐일 때 표, starter 위치) | 1단계(2, 3번), 11단계(1번) | — |
| starter 이름, Modulith 호환 확인 | 1단계 | — |
| 네이버·카카오 앱 등록과 키 | 5·6·8단계의 **실제 제공자 확인**, 17단계 | 5~10단계의 자동 테스트(가짜 제공자 응답) |
| 콘솔이 돌아올 주소 두 줄을 받는지 | 8단계(재인증 등록 방식) | 5·6단계 |
| 카카오 웹훅 GET/POST, 어드민 키 동일 여부 | 9단계 카카오 부분의 최종 모양 | 9단계 네이버 부분 |
| 웹훅·Callback URL 등록(공개 주소) | AC-13·14의 실제 제공자 확인 | AC-13·14의 직접 만든 요청으로 확인 |
| 약관·처리방침 문구, 버전 | 배포 | 15단계 화면(자리 글로 진행) |
| CSP 문장 | 배포 | 16단계(빌드 결과로 시험) |

## 구현 단계

### 1단계: 의존성과 켜고 끄는 설정 (의존: "개발 시작 전 확인"의 사용자 답 2·3번)

1. **의존성** (파일: `backend/build.gradle`)
   - 할 일: `spring-boot-starter-security`, `spring-boot-starter-security-oauth2-client`, `spring-boot-starter-security-oauth2-resource-server`, `spring-modulith-starter-jdbc`를 더합니다. 이름은 확인한 공식 이름으로 씁니다.
   - 위험: 중간. Security를 classpath에 넣는 순간 Boot 자동 설정이 모든 경로를 막고 비밀번호를 만듭니다.
2. **설정과 모듈 뼈대** (새 폴더: `backend/src/main/java/com/chaekcheck/auth/`. `AccountId.java`, `AccountDeleted.java`, 설정 클래스. 하위 패키지 참고안: `internal.web`, `internal.security`, `internal.account`, `internal.provider`. 실제 배치는 dev가 정함)
   - 할 일
     - `chaekcheck.auth.enabled`(기본 `false`)를 `application.yml`에 둡니다.
     - 꺼짐이면 사이클 04와 같아야 합니다: Spring Security 자동 설정(필터 체인, 기본 사용자, OAuth2 client·resource server 자동 설정)이 끼어들지 않고, `/api/v1/auth/**`·`/api/v1/me`가 없어(404, 루트 핸들러의 `not_found`), 키 환경 변수가 없어도 시작합니다.
     - 켜짐이면 필요한 키(네이버·카카오·JWT)가 없을 때 **시작 단계에서 분명한 메시지로 실패**하게 합니다.
     - 고른 방법(자동 설정 제외 방식, 조건부 빈 등)을 보고합니다.
   - 테스트
     - 꺼짐 컨텍스트가 키 없이 뜹니다.
     - `GET /api/v1/me`, `GET /api/v1/auth/csrf-token`이 404입니다.
     - 기존 API 하나의 응답 헤더에 Security 기본 헤더(`X-Frame-Options` 등)가 없습니다.
     - 기존 컨트롤러 테스트가 모두 그대로 통과합니다.
     - `ModularityTests`, `DocumentationTests`(모듈 문서에 `auth`)가 통과합니다.
   - AC: AC-21(서버 부분), AC-17, AC-18
   - 확인: `./gradlew build`. `bootRun`(꺼짐) 뒤 사이클 04 검색 화면이 그대로 도는지 봅니다.
   - 위험: 중간

### 2단계: Liquibase 스키마 (의존: 1단계, 사용자 답 2번)

1. **`auth` 스키마** (새 파일: `backend/src/main/resources/db/changelog/auth/001-auth-schema.yaml`)
   - 할 일: `CREATE SCHEMA auth`, 표 `account`, `login_method`, `account_consent`, `refresh_token`. 칼럼·제약·인덱스는 `design-delta.md` "데이터" 그대로입니다.
     - CHECK, IDENTITY, `UNIQUE (account_id, consent_type, document_version) NULLS NOT DISTINCT`는 `sql` changeset으로 씁니다(`library/001`, `catalog/001`과 같은 방식).
     - FK는 모두 `ON DELETE CASCADE`입니다.
     - `login_method`에 `UNIQUE(account_id)`를 **걸지 않습니다**(ADR-0039).
2. **발행 저장소** (새 파일: `backend/src/main/resources/db/changelog/modulith/001-event-publication.yaml`)
   - 할 일: `CREATE SCHEMA modulith` + Spring Modulith 2.1.1 공식 DDL 그대로입니다. 이 표는 어느 모듈 소유도 아니고, 어느 모듈의 코드도 직접 읽지 않습니다. 테스트만 예외입니다.
3. **master** (파일: `backend/src/main/resources/db/changelog/db.changelog-master.yaml`)
   - include 두 줄을 더하고, 새 파일만 더합니다 [확정]. `PRE_DEPLOYMENT`가 있으므로 같은 사이클 안의 수정은 허용됩니다. 수정하면 로컬 `db`·`db-test`를 초기화합니다.
   - 꺼짐일 때 표를 만들지 않기로 정해졌다면 그 조건을 changeset에 반영합니다(방법은 보고).
4. **JPA 매핑 또는 `JdbcClient`** (dev가 정함)
   - cascade는 DB FK에 맡기고 JPA 연관 cascade는 쓰지 않습니다. 계정 삭제는 `account` 한 줄 삭제 쿼리로 합니다.
   - 엔티티를 두면 `ddl-auto: validate`를 통과해야 합니다.
- 테스트(`db-test`)
  - 스키마가 적용됩니다.
  - `AGE_OVER_14`가 아닌데 `document_version`이 NULL이면 거절됩니다.
  - `(method, subject)` UNIQUE가 걸립니다.
  - `account` 삭제 시 하위 세 표가 cascade로 지워집니다.
- 확인: `./gradlew build`, `psql`로 `\d auth.*`, `\d modulith.*`
- 위험: 중간 (SQL changeset, 공식 DDL 버전)

### 3단계: 보안 필터 체인, JWT 검증, `GET /api/v1/me` (의존: 2단계)

1. **`SecurityFilterChain`** (켜짐일 때만. `auth.internal.security`)
   - `/api/v1/me/**`만 인증하고 나머지는 `permitAll`입니다. form login, HTTP Basic, 자동 생성 사용자는 끕니다.
   - CSRF: `csrf.spa()`(쿠키 `XSRF-TOKEN`, 헤더 `X-XSRF-TOKEN`), 웹훅 두 경로는 `ignoringRequestMatchers`로 뺍니다.
     - `XSRF-TOKEN`이 C13의 속성을 갖게 합니다. 화면 경로(`/search` 등)의 스크립트가 읽을 수 있는 `Path`인지도 확인합니다 [확인 필요: 구현 때 Spring 문서·브라우저 확인].
   - 401/403 처리기는 ProblemDetail로 씁니다: 401 `unauthorized`, CSRF 403 `csrf_invalid`. 401 예시 본문은 `design-delta.md` API 절에 있습니다.
   - 세션: SecurityContext를 세션에 저장하지 않습니다. 세션 쿠키 속성은 C12, 수명 10분입니다.
2. **`GET /api/v1/auth/csrf-token`**: 204 + `XSRF-TOKEN` 쿠키. `csrf.spa()`에서 새 토큰을 주려면 따로 무엇이 필요한지 확인합니다 [확인 필요: 공식 문서·프로토타입].
3. **JWT 검증**
   - `oauth2ResourceServer().jwt()` + 쿠키 `access_token`에서 읽는 `BearerTokenResolver`를 직접 구현합니다.
     - **보호 경로에서만 토큰을 읽게** 합니다. 공개 경로에 잘못된·만료된 토큰이 붙어도 401이 나면 안 됩니다(AC-17).
   - 디코더는 HS256 고정, 키는 환경 변수입니다.
   - `jwtAuthenticationConverter`에서 `auth.account`를 PK로 조회해 없으면 401을 줍니다.
4. **`GET /api/v1/me`**: `{"id", "loginMethods", "consents"}`(`design-delta.md` 예시)
- 테스트
  - 테스트에서 직접 서명한 토큰으로: 200, 만료 401, 다른 키 401, `alg` 다른 토큰 401, 계정 삭제 후 401.
  - CSRF 없는 POST에 403 `csrf_invalid`.
  - 기존 공개 API와 기존 SSE에 토큰 쿠키·`Authorization` 헤더를 붙여도 그대로 응답합니다.
  - 켜짐에서 기존 컨트롤러 테스트가 통과합니다.
  - `ModularityTests`
- AC: AC-17, AC-18 (AC-6~9의 기반)
- 확인: `./gradlew build`
- 위험: 높음 (모든 요청이 지나는 곳)

### 4단계: 토큰 발급, 리프레시 교체, 로그아웃, 만료 줄 정리 (의존: 3단계)

1. **발급** (한 곳에 모음. 가입·다시 로그인·갱신이 같은 코드를 씀)
   - `NimbusJwtEncoder`로 HS256, 15분, `sub`·`exp`만 넣습니다.
   - 리프레시 값은 CSPRNG 256비트이고, DB에는 SHA-256만 둡니다. `expires_at`은 지금 + 30일입니다.
   - 쿠키는 C11대로 씁니다.
2. **`POST /api/v1/auth/refresh`** (CSRF 필요): C10 규칙
   - 성공: 204 + 쿠키 둘(새 리프레시 쿠키의 `Max-Age` = 남은 기간)
   - 실패: 401 `unauthorized` + 쿠키 만료
3. **`POST /api/v1/auth/logout`** (CSRF 필요, 멱등)
   - 그 브라우저의 `refresh_token` 줄을 삭제하고 쿠키 둘을 만료시킵니다. 리프레시 쿠키가 없어도 204입니다.
4. **만료 줄 정리**: 하루 한 번 `expires_at < now()`인 줄을 삭제합니다. 켜짐일 때만 돌고, 실행 시각은 04:00(Asia/Seoul) [확정]이고 설정 값으로 둡니다.
- 테스트
  - 교체: 값이 바뀌고 `previous_token_hash`·`rotated_at`이 채워집니다. `expires_at`은 그대로입니다.
  - 재사용: 바로 앞 값으로 요청하면 줄이 삭제되고 401입니다.
  - 모르는 값: 줄을 지우지 않고 401입니다.
  - 만료: 401입니다.
  - **동시 갱신**: 같은 값으로 두 요청을 동시에 보내도 둘 다 교체에 성공하는 일이 없습니다(`FOR UPDATE`).
  - 로그아웃이 줄을 지우고, 만료 쿠키의 이름·`Path`·속성이 발급 때와 같습니다.
  - CSRF 없는 로그아웃은 403입니다.
  - JWT에 `sub`·`exp` 말고 클레임이 없습니다.
  - 정리 작업이 만료 줄만 지웁니다.
- AC: AC-6, AC-7, AC-8 (서버 부분)
- 확인: `./gradlew build`
- 위험: 높음

### 5단계: 네이버·카카오 로그인과 가입 대기 (의존: 4단계. 실제 확인은 사용자 앱 등록 뒤)

1. **등록 넷**: `naver`, `kakao`, `naver-reauth`, `kakao-reauth`. 이 단계에서는 `naver`·`kakao`만 씁니다.
   - 시작 주소는 `/api/v1/auth/oauth2/authorization/{registrationId}`, 돌아올 주소는 `/api/v1/auth/login/oauth2/code/{registrationId}`입니다.
   - redirect URI는 환경 변수입니다(C18).
   - 제공자 엔드포인트, 프로필 API(네이버 `/v1/nid/me`의 `response.id`, 카카오 `/v2/user/me`의 `id`), client 인증 방식은 공식 문서로 확인해 설정합니다.
   - 카카오 동의항목(scope)은 요청하지 않습니다. 카카오 `id`는 문자열로 저장합니다.
   - PKCE는 카카오는 끕니다. 네이버는 일반 흐름이 받으면 켭니다 [확인 필요: Spring Security 7.1 기본값, 네이버 호출 시험].
2. **인가 요청 저장소 감싸기**: 세션에 저장된 요청이 없으면 `login_expired`, 있는데 `state`가 다르면 `login_state_mismatch`입니다 [확인 필요: Spring Security 소스에서 기본 동작].
3. **성공 처리기**: SecurityContext를 세션에 저장하지 않고, `AuthorizedClientService`에 토큰을 쌓지 않습니다(C15).
   - `login_method(method, subject)`가 **있으면**(R3): `last_login_at`을 갱신하고, 4단계 발급 코드로 쿠키를 냅니다. 그다음 302 `/auth/complete?result=login_success`로 보냅니다.
   - **없으면**: 세션에 가입 대기(`method`, `subject`, `createdAt`, 네이버면 접근 토큰)를 저장하고 302 `/signup`으로 보냅니다. DB에는 아무것도 쓰지 않습니다.
4. **실패 처리기**: 제공자 `error=access_denied`이면 `login_cancelled`입니다.
   - 그 밖의 제공자 오류, 토큰 교환·프로필 실패는 `login_provider_error&provider=<naver|kakao>`입니다(경로의 registrationId로 정함).
   - 네이버가 취소 때 보내는 `error` 값 [확인 필요: 호출 시험]
- 테스트 (가짜 제공자 응답. 새 의존성이 필요하면 승인부터)
  - 콜백 결과 코드 다섯 가지, 다시 로그인에서 `last_login_at`이 갱신되는지(R3), 처음 온 계정은 DB 행 0 + 세션에 가입 대기
  - 성공 뒤 세션에 SecurityContext가 없음, 제공자 토큰이 로그에 없음
  - 타임아웃(C20)이 걸려 `login_provider_error`가 되는지
- 확인: `./gradlew build`. 앱 등록 뒤에는 실제 네이버·카카오로 로그인해 봅니다(검수 전이면 테스터 아이디).
- AC: AC-4(서버), AC-1(시작 주소)
- 위험: 높음 (Spring 확장점 여러 곳, 제공자 차이)

### 6단계: 동의와 가입, 가입 취소, 버려진 가입 대기 (의존: 5단계)

1. **문서 버전 설정**: 이용약관·수집 이용 고지 버전(`YYYY-MM-DD`)은 서버 설정이 원본입니다. 키 이름은 dev가 정하고, 값은 사용자 답을 받을 때까지 `TODO(확인 필요)`로 둡니다.
2. **`GET /api/v1/auth/signup`**: 200 `{provider, documents[]}`, 가입 대기가 없으면 404 `signup_not_found`
3. **`POST /api/v1/auth/signup`** (CSRF)
   - 확인란 셋이 모두 있어야 합니다. 없으면 400 `validation_error`(`errors[].code: required`)입니다.
   - 버전이 다르면 409 `document_version_mismatch`, 대기가 없으면 404입니다.
   - 한 트랜잭션에서 `account`, `login_method`, `account_consent` ×3, `refresh_token`을 만들고 201 + 쿠키 둘(`Location` 없음)을 줍니다.
   - UNIQUE 충돌이면 C26대로 처리합니다.
   - 성공하면 세션에서 가입 대기를 지웁니다.
4. **`DELETE /api/v1/auth/signup`** (CSRF)
   - 가입 대기를 지우고, 카카오는 `unlink`(어드민 키, `target_id_type=user_id`), 네이버는 대기 중 토큰으로 `revoke`를 한 번 요청합니다.
   - 실패해도 204이고, 서버 로그에만 남깁니다(토큰 값은 남기지 않음). 대기가 없으면 404입니다.
5. **세션 만료 처리**(C17): 세션이 사라질 때 가입 대기가 남아 있으면 4번과 같은 연결 끊기를 합니다. 가입·취소로 이미 지운 대기에는 하지 않습니다.
- 테스트
  - 가입 행 수(AC-2), 확인란 누락 400, 버전 불일치 409, 두 번 가입하면 같은 계정 로그인(C26)
  - 취소 뒤 DB 행 0 + 제공자 호출 한 번(AC-3)
  - 세션 만료 때 가입 대기가 있으면 연결 끊기, 없으면 호출 없음
  - 탈퇴 뒤 같은 제공자 번호로 다시 오면 가입 대기(AC-11)
- AC: AC-2, AC-3, AC-11 (서버)
- 확인: `./gradlew build`
- 위험: 중간

### 7단계: 계정 삭제 한 곳 + `AccountDeleted` + 발행 저장소 (의존: 2단계. 8~10단계 전에)

1. **삭제 한 곳**(탈퇴·웹훅·콜백·정리 작업이 같이 씀)
   - 한 트랜잭션에서 `account` 한 줄을 삭제하고(cascade로 수단·동의·리프레시 모두 삭제) `AccountDeleted(accountId)`를 발행합니다.
2. **listener 하나**(`auth` 안): 서버 로그에 한 줄을 남깁니다(계정 번호 말고 개인 값은 없음).
3. **설정**: C28의 세 값. `republish-outstanding-events-on-restart` 등 그 밖의 값은 설계에 없으므로 바꾸면 보고합니다.
- 테스트
  - 발행 → `modulith.event_publication`에 listener당 1줄 → listener 완료 뒤 0줄
  - **테스트 전용 실패 listener**를 둔 컨텍스트에서는 기록이 남음
  - 이벤트에 accountId만 있음
- AC: AC-15
- 확인: `./gradlew build`, `ModularityTests`
- 위험: 중간

### 8단계: 탈퇴 (재인증) (의존: 5, 7단계. 돌아올 주소 두 줄 등록 결과)

1. **재인증 등록** `naver-reauth`(`auth_type=reauthenticate`), `kakao-reauth`(`prompt=login`)
   - `OAuth2AuthorizationRequestResolver`로 파라미터를 붙입니다.
   - **콘솔이 돌아올 주소를 하나만 받으면** 그 제공자는 등록 하나 + 목적 표시 방식으로 바꿉니다(ADR-0043 D안). 바꾸기 전에 사용자에게 알리고 `# 사이클 05` 절에 적습니다.
2. **재인증 콜백 처리**
   - 취소이면 `withdraw_cancelled`, 제공자 오류이면 `withdraw_provider_error&provider=…`입니다.
   - 리프레시 쿠키로 현재 계정을 찾습니다. 줄이 없거나 만료면 `withdraw_login_expired`입니다.
   - 돌아온 계정이 현재 계정과 다르면 `withdraw_account_mismatch`입니다.
   - 같으면 세션에 재인증 증명(`accountId`, `method`, `verifiedAt`, 네이버 접근 토큰)을 두고 `withdraw_reauthenticated`로 보냅니다.
   - 이 콜백도 세션 로그인을 만들지 않고, 리프레시 줄을 새로 만들지 않습니다.
3. **`DELETE /api/v1/me`** (access 쿠키 + CSRF)
   - 증명이 없으면 403 `reauthentication_required`, 5분이 지났으면 403 `reauthentication_expired`, 증명의 계정이 토큰의 계정과 다르면 403 `reauthentication_required`입니다.
   - 유효하면 카카오 `unlink`(어드민 키)나 네이버 `revoke`(증명의 토큰)를 **한 번만** 요청합니다. 실패해도 다시 요청하지 않고 다음으로 가며, 서버 로그만 남깁니다.
   - 그다음 7단계 삭제를 하고 204 + 쿠키 둘을 만료시키고, 세션의 증명을 지웁니다.
   - 우리 쪽 삭제가 실패하면 500 `internal_error`입니다.
- 테스트
  - 결과 코드 다섯 가지
  - 5분 경계(시계 주입), 증명 없음 403
  - 제공자 끊기 실패에도 삭제 + 204
  - 삭제 뒤 다른 브라우저의 액세스 토큰 401, 리프레시 401
  - 쿠키 만료 `Path`
- 확인: `./gradlew build`. 실제 제공자로 두 브라우저 확인(AC-9), 다른 계정으로 재인증(AC-10), 제공자 "연결된 서비스" 화면(AC-12)
- AC: AC-9, AC-10, AC-12 (서버)
- 위험: 높음

### 9단계: 카카오 연결 해제 웹훅, 네이버 연결끊기 Callback (의존: 7단계)

1. **`POST /api/v1/auth/webhooks/kakao-unlink`** (CSRF 제외)
   - `Authorization: KakaoAK <키>`와 `app_id`(환경 변수의 우리 앱 번호)를 확인합니다. 다르면 401 `unauthorized`이고 삭제하지 않습니다.
   - 확인되면 `login_method(KAKAO, user_id)`를 삭제하고, 남은 수단이 없으면 계정 삭제 + `AccountDeleted`입니다(이번에는 늘 계정 삭제).
   - 없는 사용자여도 200이고, 3초 안에 응답합니다.
   - GET으로만 보낼 수 있다고 확인되면 **그 주소 하나에 한해** GET을 받는 예외를 제약에 더합니다. 그 전에 사용자에게 알립니다.
2. **`POST /api/v1/auth/webhooks/naver-unlink`** (CSRF 제외, form)
   - `clientId`가 우리 것과 다르거나, 서명이 틀리거나, `timestamp`가 지금과 5분 넘게 다르면 [확정] 401이고 삭제하지 않습니다.
   - 서명은 `research.md` 3절 원문대로 확인합니다.
     - 키는 `CLIENT_SECRET`을 MD5 한 바이트 배열의 앞 16바이트입니다.
     - 서명 원문은 `clientId=…&encryptUniqueId=…&timestamp=…`이고, HmacSHA256 후 URL-safe Base64입니다.
     - 복호화는 AES128/CBC/PKCS5Padding이고, Base64를 풀어 앞 16바이트를 IV로 씁니다.
   - 확인되면 같은 삭제를 하고 204(본문 없음)입니다. 없는 사용자도 204입니다.
- 테스트
  - research 3절 방식으로 테스트 안에서 만든 요청(키는 테스트 전용 값): 정상 204 + 삭제, 서명 틀림·`clientId` 다름·5분 초과면 401 + 삭제 없음, 같은 요청 두 번이면 둘 다 204
  - 카카오: 키 틀림 401, 없는 `user_id` 200, 처리 시간 측정
  - CSRF 없이 통과
  - 비교가 `MessageDigest.isEqual`인지
- 확인: `./gradlew build`, `bootRun` 뒤 `curl`로 직접 보냄. 실제 제공자 전송은 URL 등록 뒤에 합니다.
- AC: AC-13, AC-14
- 위험: 중간

### 10단계: 하루 한 번 작업 둘 (의존: 7단계. 카카오 부분은 8단계의 unlink 코드)

1. **카카오 연결 대조**(C29)
   - `GET /v1/user/ids`를 `limit` 100, `from_id`로 끝까지 받습니다. 분당 100회를 넘지 않습니다.
   - 전부 받은 경우에만 비교하고 삭제합니다.
   - 목록을 받기 시작한 시각 이후에 만들어진 `login_method`는 그 날 비교에서 뺍니다 [확정] (사용자 승인, 2026-10-04, 인계서 검토). 방금 가입한 계정이 지워지지 않게 하기 위함입니다.
2. **1년 정리**(C30): `last_login_at < now() - 1년`. 카카오는 `unlink` 한 번 시도(실패는 로그), 네이버는 건너뛰고 삭제 + `AccountDeleted`
- 두 작업 모두 켜짐일 때만 돕니다. 실행 시각은 04:00(Asia/Seoul) [확정]이고 설정 값으로 둡니다.
- 테스트(가짜 카카오 응답, 시계 주입)
  - 목록에 없는 계정만 삭제되고 이벤트가 발행됨
  - 중간 페이지 실패·한도 초과면 삭제 0
  - 1년 경계 하루 앞뒤
  - 카카오 unlink 실패에도 삭제
- AC: AC-19, AC-20
- 확인: `./gradlew build`
- 위험: 중간 (잘못 지우면 되돌릴 수 없음)

### 11단계: 웹 API 층과 로그인 상태 (의존: 3·4단계, 사용자 답 1번)

1. **API** (파일: `web/src/api/types.ts`, 새 파일 예: `web/src/api/auth.ts`. 이름은 dev가 정함)
   - `fetchMe`, `fetchCsrfToken`, `refresh`, `logout`, `getSignup`, `postSignup`, `cancelSignup`, `deleteMe`
   - 변경 요청에는 `XSRF-TOKEN` 쿠키 값을 `X-XSRF-TOKEN` 헤더로 넣습니다. 쿠키가 없으면 먼저 `GET /api/v1/auth/csrf-token`을 부릅니다.
   - 403 `csrf_invalid`이면 새 토큰을 받아 **한 번만** 다시 보냅니다.
     - Spring은 로그인 성공 때 CSRF 쿠키를 지울 수 있으므로, 재인증에서 돌아온 직후의 DELETE가 이 경로를 탈 수 있습니다.
   - 기존 `ApiError`·`readProblem`(`web/src/api/client.ts`)을 그대로 씁니다.
2. **갱신 (Web Locks)**: `/api/v1/me` 계열이 401이면 다음 순서로 처리합니다. 공개 API는 이 경로를 타지 않습니다.
   1. `navigator.locks.request('auth-refresh', …)`로 차례를 받습니다.
   2. 원래 요청을 먼저 다시 보냅니다.
   3. 또 401이면 `POST /api/v1/auth/refresh`를 부릅니다.
   4. 204이면 원래 요청을 다시 보내고, 401이면 로그인 전 상태로 바꿉니다(안내 없음).
   - `http://localhost` 개발 환경에서 `Secure` 쿠키와 Web Locks가 동작하는지 [확인 필요: 프로토타입]
3. **로그인 상태 공급자**(예: `web/src/features/auth/`): 화면이 열릴 때 `GET /api/v1/me`를 한 번 부릅니다. 상태는 확인 중 / 로그인 전 / 로그인 후입니다.
   - 꺼짐이면 아무것도 부르지 않고 로그인 요소를 그리지 않습니다(사용자 답 1번 방식).
- 테스트(Vitest. jsdom에는 `navigator.locks`가 없으니 목으로)
  - 두 탭 흉내로 갱신이 한 번만 일어남
  - 차례를 받은 쪽이 원래 요청을 먼저 다시 보냄
  - 갱신 실패 → 로그인 전
  - CSRF 403 → 한 번만 재시도
  - 쿠키에서는 `XSRF-TOKEN`만 읽음
- 확인: `npm test`, `npm run build`, `npm run lint`
- 위험: 중간

### 12단계: 위쪽 로그인·로그아웃, S5, `/auth/complete`, 안내 줄 (의존: 11단계)

1. **위쪽 영역** (파일: `web/src/components/AppLayout.tsx`)
   - 로그인 전에는 "로그인", 로그인 후에는 "로그아웃"을 보입니다. 확인 중에는 자리를 비워 둡니다. S1·S3 공통입니다.
   - `/terms`, `/privacy`에서는 버튼을 두지 않습니다.
   - 자리: 공통 머리(`AppLayout`)의 오른쪽 끝, 상표의 반대편 [확정] (사용자 승인, 2026-10-04, 인계서 검토). 설정 버튼 ⚙는 지금처럼 `SearchForm`의 검색 줄에 둡니다.
   - 로그아웃은 확인 창 없이 즉시 하고, 보던 화면에 머뭅니다.
2. **S5 로그인 선택 창**(Radix Dialog 등, 모바일은 아래에서 올라옴)
   - "네이버 로그인"·"카카오 로그인" 버튼(글자 [확정] (사용자 승인, 2026-10-04, 인계서 검토))을 같은 크기로 세로로 나란히 두고, 안내 "처음이면 회원가입을 먼저 진행해요"와 닫기를 둡니다.
   - 버튼 지침은 `research.md` 4절을 따릅니다.
     - 카카오: `#FEE500`, 말풍선 심볼, "카카오 로그인", 모서리 12px
     - 네이버: 공식 제공 이미지를 쓰거나 원문 색 코드를 확인 [확인 필요]
   - 버튼을 누르면 지금 주소(경로 + 검색 조건)를 `sessionStorage`에 적고, 버튼을 비활성화한 뒤 `/api/v1/auth/oauth2/authorization/{naver|kakao}`로 페이지를 이동합니다.
3. **`/auth/complete`** (파일: `web/src/main.tsx`에 라우트 + 새 화면)
   - `result`를 목록과 대조합니다.
   - `login_success`이면 저장된 주소로 갑니다. C21 검사를 통과하지 못하면 `/`로 갑니다.
   - 실패 코드는 정해진 문구를 S1 안내 줄로 넘기고 주소에서 코드를 지웁니다.
   - 목록에 없는 코드는 문구 없이 S1으로 갑니다.
4. **안내 줄**(한 번 보이고 닫을 수 있음): 문구는 `design-delta.md` 결과 코드 표 그대로입니다.
   - `login_provider_error`·`withdraw_provider_error`는 `provider`로 "네이버"/"카카오"를 고릅니다.
- 테스트: 버튼 상태 셋, 로그아웃 뒤 버튼 바뀜, 코드별 문구, 모르는 코드·`provider` 무시, 돌아갈 주소 검사(`//evil`, `https://…` 거부), 화면에 제공자 이름·`loginMethods` 없음
- 확인: `npm test`, `npm run build`, Playwright 1280 → 768 → 375
- AC: AC-1, AC-4, AC-5, AC-6, AC-7 (화면)
- 위험: 중간

### 13단계: S6 `/signup` (의존: 6·11단계)

- 화면은 가운데 한 단입니다.
  - 수집·이용 고지 표 4가지(목적, 항목, 보유·이용 기간, 거부할 권리와 불이익)
  - 확인란 셋(이용약관과 수집·이용은 "전문 보기"를 그 자리에서 펼침), "모두 동의", "가입"(셋 다 표시해야 눌림), "취소"
- 보유·이용 기간은 "탈퇴할 때까지, 또는 마지막 로그인 뒤 1년" [확정]입니다.
- 목적·항목 문구는 사용자 검토 전 자리 글로 둡니다 [확인 필요: 네이버 제공 항목 확인, 사용자 검토].
- 상태
  - 들어오면 `GET /api/v1/auth/signup`을 부릅니다. 404이면 S1으로 보냅니다.
  - 확인란 미표시이면 어느 항목이 빠졌는지 표시합니다.
  - 그 밖에 저장 중, 저장 실패(다시 시도), 409(C24), 가입 대기 만료(처음부터 다시 로그인 안내)가 있습니다.
  - 문구 [확정] (사용자 승인, 2026-10-04, 인계서 검토): 빠진 확인란 옆 "필수 항목이에요", 저장 실패 "가입하지 못했어요. 잠시 뒤 다시 해 주세요", 가입 대기 만료 "시간이 지났어요. 처음부터 다시 로그인해 주세요".
- 가입 성공(201)이면 `sessionStorage`의 주소로 가고, 취소하면 `DELETE` 뒤 S1(로그인 전)으로 갑니다.
- 꺼짐이면 라우트를 그리지 않습니다.
- 테스트: 셋 중 하나라도 비면 비활성, 모두 동의, 409 뒤 새 버전과 빈 확인란, 404 → S1, 취소
- 확인: `npm test`, `npm run build`, Playwright
- AC: AC-2, AC-3 (화면)
- 위험: 낮음

### 14단계: S4 "계정" 절과 S7 탈퇴 (의존: 8·12단계)

1. **S4** (파일: `web/src/features/search/SettingsPanel.tsx`)
   - 로그인 후에만 "계정" 절을 보이고, 그 안에 "탈퇴" 하나만 둡니다 [확정]. 로그인·로그아웃은 여기에 두지 않습니다.
   - 기존 두 절은 그대로입니다.
2. **S7 탈퇴 안내 창**(S4 위의 확인 창)
   - 지워지는 것(계정, 동의 기록, 사이클 06부터 지역·내 도서관), "되돌릴 수 없어요"
   - "네이버와(카카오와) chaekcheck의 연결도 끊어요"(`loginMethods`로 고름)
   - "가입한 계정으로 한 번 더 로그인해 확인합니다", "계속", "그만두기"(S4로)
   - "계속"을 누르면 `/api/v1/auth/oauth2/authorization/{naver|kakao}-reauth`로 페이지를 이동합니다.
3. **재인증에서 돌아온 뒤** (`/auth/complete?result=withdraw_reauthenticated`)
   - "탈퇴 처리 중"을 잠깐 보이고 `DELETE /api/v1/me`를 부릅니다.
   - 응답별 처리

     | 응답 | 화면 |
     |---|---|
     | 204 | 로그인 전 S1 + "탈퇴했습니다" |
     | 401 | 갱신 뒤 다시 시도. 갱신이 실패하면 로그인 전 S1 + `withdraw_login_expired` 문구 |
     | 403 | C25의 문구 |
     | 500 | `internal_error` 문구 |
     | `fetch` 예외 | "인터넷 연결을 확인하고 다시 해 주세요" |

   - 탈퇴가 멈춘 경우는 로그인 상태 그대로 S1 안내 줄에 보입니다.
   - 탈퇴 뒤 S1이 `/`인지, 탈퇴를 시작한 검색 주소인지는 flow에 적혀 있지 않습니다. dev가 정하고 보고합니다.
- 테스트: 로그인 전 계정 절 없음, 제공자 이름 한 줄, 응답별 문구, 403 두 코드 같은 문구
- 확인: `npm test`, `npm run build`, Playwright
- AC: AC-9, AC-10 (화면)
- 위험: 중간

### 15단계: S8 `/terms`, S9 `/privacy`, 화면 아래 링크 (의존: 6단계의 버전 설정)

- 라우트 `/terms`, `/privacy`. 화면에는 제목, 버전·시행일, 본문이 있습니다.
  - 본문은 React 요소나 글자로만 그립니다(C22).
  - 문구는 사용자 검토 전이라는 표시를 단 자리 글입니다 [확인 필요].
  - 처리방침의 법정 항목은 제30조①, 시행령 제31조①입니다(`research.md` 5절). 보호책임자는 운영자 본인입니다.
- `web/src/components/Footer.tsx`에 두 링크를 둡니다(S1·S3·S4·S8·S9 어디서든).
- 꺼짐이면 두 페이지와 화면 아래 링크를 보이지 않습니다 [확정] (사용자 승인, 2026-10-04, 인계서 검토).
- 테스트
  - **웹 파일의 버전·시행일 = 서버 설정 값**(C27). 비교 방법(공유 파일, 빌드 때 값 주입, 백엔드 테스트가 웹 파일을 읽음 등)은 dev가 정하고 보고합니다.
  - 로그인 없이 열림, S6 "전문 보기"
- 확인: `npm test`, `npm run build`, Playwright
- AC: AC-16
- 위험: 낮음

### 16단계: 운영 웹 서버 설정 예시 (의존: 웹 빌드)

- 설정 예시 파일을 저장소에 둡니다. 제품과 위치는 배포 때 정하고, 폴더 위치는 dev가 정해 사용자에게 알립니다.
  - 화면 파일을 내려 줍니다.
  - 화면 라우트(`/search`, `/books/…`, `/signup`, `/auth/complete`, `/terms`, `/privacy`)를 `index.html`로 돌립니다.
  - `/api`를 Spring으로 넘깁니다(같은 출처).
- 화면 파일 응답에 `Content-Security-Policy`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`을 붙입니다 [확정 모양].
  - CSP 문장은 빌드 결과(Radix가 넣는 `<style>`, 글꼴)로 시험해 정합니다 [확인 필요].
- API 응답 헤더는 Spring Security가 붙입니다(켜짐일 때).
- 확인: 예시 설정으로 로컬에서 띄워 헤더와 화면 동작(로그인 흐름 포함)을 봅니다. 시험한 CSP를 보고합니다.
- 위험: 낮음

### 17단계: 실제 제공자로 전체 확인 (의존: 1~16단계, 사용자의 앱 등록)

- 아래 AC 표의 "수동" 항목을 실제 네이버·카카오로 확인하고, 결과를 `# 사이클 05` 절의 AC 확인표에 적습니다.
- 켜짐과 꺼짐을 모두 확인합니다.

## 테스트

- 단위
  - JWT 발급·검증(클레임 둘, HS256 고정)
  - 리프레시 해시·교체 규칙
  - 쿠키 작성기(속성·`Path`·`Max-Age`)
  - 결과 코드 대응
  - 네이버 서명·복호화(research 3절 방식으로 만든 값)
  - 돌아갈 주소 검사
- 통합(모듈)
  - `ModularityTests`: `ApplicationModules.of(ChaekcheckApplication.class).verify()`. 새 모듈 `auth`, `auth`와 다른 모듈 사이 의존 없음, 순환 없음
  - `DocumentationTests`
  - `db-test`: 스키마, cascade, 가입 트랜잭션, 교체·재사용·만료·**동시 갱신**
  - 웹훅·콜백 검증 실패
  - **AC-15 발행 저장소**: 기록 생김 → 완료 뒤 없음 / 테스트 전용 실패 listener면 남음
  - 다시 로그인(R3)
  - 세션 만료 때 가입 대기의 제공자 연결 끊기
  - 로그아웃이 리프레시 줄을 지움
  - 쿠키 만료 응답의 `Path`
  - **비로그인 요청과 토큰이 붙은 요청 모두에서 기존 SSE와 공개 API**
  - **켜짐·꺼짐 두 컨텍스트**
- 웹(Vitest): 11~15단계 테스트, Web Locks 목
- 화면: Playwright, 데스크톱 1280 → 태블릿 768 → 모바일 375. 사이클 04처럼 앱 안 브라우저로 했으면 보고합니다.
- 수동(실제 제공자, 브라우저 개발자 도구, DB 조회)

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 "로그인" → 네이버·카카오 두 버튼 | 웹 테스트 + Playwright | 12 |
| AC-2 처음이면 동의, 셋 다 표시해야 가입, DB 1·1·3줄 | 백엔드 통합 테스트 + 웹 테스트 + 수동(실제 제공자, DB 조회) | 6, 13, 17 |
| AC-3 취소·닫기 뒤 DB 행 0 | 통합 테스트(취소, 세션 만료) + 수동 | 6, 13, 17 |
| AC-4 가입된 계정은 동의 없이, 보던 주소(검색 조건 포함)로 | 통합 테스트(R3) + 웹 테스트(`sessionStorage`) + 수동 | 5, 12, 17 |
| AC-5 "로그아웃"만, 제공자 이름·닉네임 없음 | 웹 테스트 + Playwright | 12 |
| AC-6 새로고침·브라우저 재시작·**서버 재시작** 뒤 유지, 15분 뒤 자동 갱신 | 갱신 통합 테스트 + 웹 테스트 + **수동**(세 가지 재시작, 15분 넘게 기다리거나 짧은 수명 설정으로 시험) | 4, 11, 17 |
| AC-7 로그아웃 뒤 같은 화면, `/me` 401, CSRF 없는 로그아웃 거절 | 통합 테스트 + 웹 테스트 + 수동 | 4, 12 |
| AC-8 쿠키 속성, 갱신마다 값 바뀜, 쓴 값 거절, JWT에 개인정보 없음 | 통합 테스트 + **브라우저 개발자 도구**(쿠키 속성, JWT 내용 디코드) | 4, 17 |
| AC-9 탈퇴 → 재인증 → 완료, DB 행 없음, 다른 브라우저 `/me` 401·갱신 불가 | 통합 테스트 + **수동(두 브라우저, 실제 제공자)** | 8, 14, 17 |
| AC-10 다른 계정으로 재인증하면 탈퇴 안 됨 | 통합 테스트 + 수동(같은 제공자의 다른 계정) | 8, 14, 17 |
| AC-11 탈퇴한 계정으로 다시 로그인하면 동의부터 | 통합 테스트 + 수동 | 6, 17 |
| AC-12 제공자 "연결된 서비스 관리"에 chaekcheck 없음 | **수동**(네이버·카카오 화면) | 17 |
| AC-13 카카오 웹훅: 올바른 키면 3초 안 200 + 삭제, 틀리면 거절, 없는 `user_id` 200 | 통합 테스트 + `curl` 직접 요청 + (URL 등록 뒤) 카카오 화면에서 연결 끊기 | 9, 17 |
| AC-14 네이버 콜백: 올바른 서명이면 204 + 삭제, 틀리면 거절 | 통합 테스트 + `curl` 직접 요청 + (URL 등록 뒤) 네이버 화면에서 철회 | 9, 17 |
| AC-15 발행 저장소 기록이 생겼다가 지워짐, 실패면 남음 | **자동 테스트로만** | 7 |
| AC-16 약관·처리방침이 로그인 없이 열림, 동의 화면 링크 | 웹 테스트 + Playwright | 15 |
| AC-17 로그인 전후 검색·조회가 사이클 04와 같음, 쿠키·토큰 없이 그대로 | 기존 테스트(켜짐·꺼짐) + 토큰 붙은 요청 테스트 + 수동 검색 | 1, 3, 17 |
| AC-18 `ModularityTests`, 백엔드 빌드, 웹 테스트·빌드·lint | `./gradlew build`, `npm test`·`build`·`lint` | 전 단계 |
| AC-19 카카오 목록에 없는 계정 삭제, 다 받지 못한 날 삭제 0 | 통합 테스트(가짜 응답) + (가능하면) 실제 `/v1/user/ids` 한 번 호출 | 10 |
| AC-20 1년 넘은 계정 삭제 + `AccountDeleted`, 안 된 계정 유지 | 통합 테스트(시계 주입) | 10 |
| AC-21 끄면 사이클 04와 같음, 두 경로 404, 웹 요소 없음, 키 없이 시작 | 꺼짐 컨텍스트 테스트 + 웹 테스트 + 수동(키 없는 `bootRun`) | 1, 11, 17 |

## 완료 기준

- [ ] spec AC-1~AC-21을 위 표의 방법으로 모두 확인함(수동 항목은 실제 제공자로)
- [ ] `backend/`에서 `./gradlew build` 통과(`ModularityTests` verify, `DocumentationTests` 포함). 켜짐·꺼짐 테스트 모두 통과
- [ ] `web/`에서 `npm test`, `npm run build`, `npm run lint` 통과, 1280/768/375 확인
- [ ] 저장소와 로그에 비밀 값·제공자 토큰이 없음(`git grep`과 로그 확인)
- [ ] `chaekcheck.auth.enabled` 기본값이 꺼짐
- [ ] 운영 웹 서버 설정 예시 파일이 저장소에 있고, 시험한 CSP를 보고함
- [ ] reference-index 7절의 dev 문서 수정을 마쳤거나 사용자 결정으로 미룸
- [ ] "확인 필요" 결과, 사용자 답, 설계와 달라진 점을 `docs/plan-feedback.md` `# 사이클 05` 절에 정리하고 사용자에게 전달함

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 결과에 따라 할 일 | 막는 단계 |
|---|---|---|---|
| 네이버·카카오 콘솔이 돌아올 주소를 둘 이상 받는지 | 사용자가 앱 등록 때 두 줄을 넣어 봄 | 둘 다 받으면 설계대로. 한 줄만 받는 제공자는 등록 하나 + 목적 표시 방식(ADR-0043 D안)으로 바꾸고, 사용자에게 알린 뒤 보고 | 8 |
| Boot 4.1 starter 이름 (`-security-oauth2-client`, `-security-oauth2-resource-server`) | 공식 Starters 표 | 다르면 공식 이름으로 넣고 보고 | 1 |
| Spring Modulith 2.1.1 + Boot 4.1.1 호환, 발행 저장소 DDL | dev BOM, 공식 appendix | DDL을 그대로 옮김. 호환이 안 되면 멈추고 사용자에게 | 1, 2 |
| Spring Security 7.1의 confidential client PKCE 기본값, 네이버 일반 흐름이 PKCE를 받는지 | 공식 문서, 네이버 호출 시험 | 네이버는 받으면 켬, 카카오는 끔 | 5 |
| `csrf.spa()`에서 새 토큰을 주는 데 필요한 것(`/csrf-token`의 역할), `XSRF-TOKEN` 쿠키의 `Path`·`Secure`·`SameSite` | 공식 문서, 프로토타입 | C13 속성과 화면 경로에서 읽힘을 맞춤 | 3 |
| 기본 인가 요청 저장소가 "요청 없음"과 "`state` 다름"을 같은 오류로 처리하는지 | Spring Security 소스 | 같으면 감싸서 구분, 다르면 오류 코드로 대응 | 5 |
| 네이버가 취소 때 보내는 `error` 값, 네이버 revoke를 부르면 우리 Callback이 오는지 | 호출 시험 | 취소 판정에 반영. Callback이 오면 멱등 처리로 충분한지 보고 | 5, 8 |
| `InMemoryOAuth2AuthorizedClientService`가 토큰을 쌓지 않게 하는 설정 | 공식 문서 | C15를 지키는 방법을 보고 | 5 |
| 카카오 웹훅 "대표 어드민 키" = unlink "서비스 앱 어드민 키"인지 | 공식 문서, 카카오 콘솔(사용자) | 다르면 환경 변수 둘 | 9 |
| 카카오 연결 해제 웹훅을 POST로만 받을 수 있는지(문서는 "GET 또는 POST") | 공식 문서, 콘솔 | GET만 되면 그 주소 하나에 한해 GET을 받는 예외(사용자에게 먼저 알림) | 9 |
| `http://localhost`에서 `Secure` 쿠키와 Web Locks가 동작하는지 | 프로토타입 | 안 되면 개발 환경 우회 방법을 사용자에게 묻고 보고 | 11 |
| 제공자 호출 대기 시간(연결 3초, 응답 5초 [확정])이 실제 호출에 맞는지 | 호출해 봄 | 맞지 않으면 측정값과 함께 사용자에게 제안 | 5 |
| 네이버 앱에서 아무 항목도 고르지 않으면 식별자만 오는지 | 사용자가 등록 화면에서 확인 | 동의 고지 "항목" 문구에 반영(닉네임이 오면 저장하지 않는다는 문구 검토) | 13 |
| 네이버 버튼 녹색 색 코드 | 원문 확인 또는 공식 버튼 이미지 사용 | 공식 이미지면 값 확인이 필요 없음 | 12 |
| CSP 문장 | dev 빌드 결과로 시험 | 시험한 문장을 보고 | 16 (배포) |
| 이용약관·처리방침·동의 고지 문구, 보호책임자, 문서 버전 | 사용자 검토 | 자리 글을 바꾸고 버전 설정 | 배포 |
| 꺼짐 + 표 없음일 때 JDBC 발행 저장소가 시작에 실패하지 않는지 | 공식 문서, 프로토타입 | 사용자 답 2·3번과 함께 정함 | 1 |
| Spring Session(Redis)으로 바꿀 때 세션 만료 알림, 값 암호화 | 공식 문서 | 이번에는 없음(backlog) | 없음 |

## 이번에 하지 않는 것

- 회원 자료 모듈 `member`, 지역·내 도서관 저장, `libraryIds` 검색 연결(사이클 06). ADR-0037은 이번에 구현하지 않습니다.
- 관심 책·알림(사이클 07), 이메일·전화 등 연락처 받기
- 직접 회원가입(이메일·비밀번호). 표는 `method`에 `PASSWORD`를 나중에 더할 수 있는 모양만 둡니다.
- 다른 소셜 계정 연결·해제(표 구조만 열어 둠)
- 닉네임·이름·프로필 사진 받기와 표시, "네이버로 로그인됨" 표시
- Expo 앱 로그인(헤더로 토큰 보내기)
- Spring Session Redis, 여러 대 서버 구성. 임시 값은 메모리 세션만 씁니다.
- 저장소 분리(취소됨)
- 만 14세 미만 가입, 약관 버전이 바뀌었을 때 다시 동의받는 흐름
- "모든 기기에서 로그아웃", 동시 로그인 수 제한, 로그인 기록 보기, 탈퇴 유예 기간
- JWT 서명 키 자동 교체, 운영자 계정 관리 화면
- 제공자 자체 로그아웃(카카오 "카카오계정과 함께 로그아웃" 등)
- 네이버 검수 신청 자체(사용자가 함), 운영 배포와 웹 서버 제품 선택
- `region`, `library`, `catalog`, `availability`, `fetch-service/`, 기존 API 변경
- 사이클 04 마무리(실제 가져오기, 측정, AC-1~14 확인) — backlog

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 `# 사이클 05` 절에 **무엇이 달라졌는지와 이유**를 적습니다. 사용자 발언이면 그대로 옮깁니다.

- 사용자 답
  - 질문 세 가지(웹이 켜짐을 아는 방법, 꺼짐일 때 표, starter 위치)
  - 정리 작업 실행 시각, 문구, 버전
- [확인 필요] 표 각 행의 결과. 특히 다음은 꼭 적습니다.
  - 돌아올 주소 두 줄 등록 여부와 바꾼 방식
  - PKCE 결과, 네이버 취소 `error` 값
  - 카카오 웹훅 GET/POST, 어드민 키 동일 여부
  - CSP 문장
- 정한 이름: 패키지 배치, 환경 변수 이름, 설정 키(켜고 끄기, 문서 버전, 리다이렉트), 엔티티 / `JdbcClient` 선택, 웹 파일 이름
- 구현 방법을 보고하라고 한 것
  - 꺼짐일 때 Security 자동 설정을 빼는 방법
  - 302 `Location`을 만드는 방법
  - SecurityContext 저장소 교체, AuthorizedClient 처리
  - 세션 만료 감지 방법
  - 버전 일치 테스트 방법
  - 탈퇴 뒤 S1 주소
- 설계와 달라진 점, 새로 알게 된 제약
  - 예: Spring 기본 동작이 설계 가정과 다른 곳
  - 제공자 응답의 특이점
  - 여러 대 서버에서 하루 한 번 작업이 겹칠 수 있음 등
- 실제 제공자로 한 AC 확인표(17단계)
- reference-index 7절 dev 문서 수정 결과

## 인계서 검토에서 정해진 것 (2026-10-04)

인계서를 쓰면서 찾은 어긋남과 설계에 없던 것을 사용자가 정했습니다. 위 본문에 반영돼 있고, 한곳에 모아 둡니다.

| 무엇 | 결정 |
|---|---|
| S5 버튼 글자 | "네이버 로그인", "카카오 로그인" |
| "로그인" 버튼 자리 | 공통 머리(`AppLayout`)의 오른쪽 끝. ⚙는 검색 줄에 그대로 |
| 카카오 대조와 새 가입 | 목록을 받기 시작한 뒤에 만들어진 `login_method`는 그 날 비교에서 뺌 |
| 하루 한 번 작업의 시각 | 04:00(Asia/Seoul), 설정 값 |
| 꺼짐일 때 약관·처리방침 | 두 화면과 화면 아래 링크를 보이지 않음 |
| S6 문구 | "필수 항목이에요", "가입하지 못했어요. 잠시 뒤 다시 해 주세요" |
| 로그인이 필요한 요청의 DB 읽기 | 보호 경로만 계정을 PK로 조회, 공개 경로는 아무것도 읽지 않음(`design-delta.md` 기준) |
| 설정 창 "계정" 절 | 로그인 후에만, "탈퇴" 하나 |

## 카카오 앱 등록에서 확인된 것 (2026-10-04, 인계서를 넘긴 뒤 사용자 콘솔에서 확인)

위 "[확인 필요] 항목" 표와 "사용자가 할 것" 표 가운데 카카오에 관한 것 일부가 풀렸습니다. 자세한 것은 `research.md` 14절.

- 카카오는 돌아올 주소를 둘 이상 받습니다 [확정]. `kakao`, `kakao-reauth` 두 등록을 설계대로 씁니다. 등록 위치는 [앱] > [플랫폼 키] > REST API 키 수정 화면입니다.
- 지금 등록된 값은 `http://localhost:5173/api/v1/auth/login/oauth2/code/kakao`와 `.../kakao-reauth`입니다. dev가 정한 redirect URI가 이와 다르면 사용자에게 알려 콘솔 값을 고칩니다.
- 어드민 키는 하나입니다(대표 = unlink용) [확정]. 환경 변수는 하나면 됩니다.
- 클라이언트 시크릿은 켜져 있습니다 [확정]. 토큰 요청에 넣어야 합니다.
- 호출 허용 IP 주소는 비워 두었습니다. 운영 서버의 고정 IP가 생기면 등록합니다(배포 때, 사용자).
- 네이버는 사용자가 직접 등록합니다. 네이버의 돌아올 주소 두 줄과 제공 항목 화면은 아직 [확인 필요]입니다.

