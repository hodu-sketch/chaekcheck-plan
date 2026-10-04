# 사이클 05 조사: 명세의 "확인 필요" 다섯 가지

- 조사일: 2026-10-01 (chaekcheck-plan 세션). 아래 "확인 날짜"는 모두 이날입니다.
- 대상: `spec.md` "확인 필요" 표 중 설계를 막지 않는다고 적은 다섯 가지. 결과는 `spec.md`에 반영했습니다.
- 앞선 조사: `docs/research/member-and-alerts/signup-security.md` (소셜 로그인·세션·개인정보법). 이 문서는 그 뒤에 더 확인한 것만 적습니다.
- 확인 방법 주의: 페이지를 직접 열어 요약 도구로 읽었습니다. 네이버 콜백 절은 원문을 그대로 옮겨 받았고, 나머지는 요약이므로 값(색 코드 등)을 코드에 넣기 전에 원문을 한 번 더 봅니다.

## 1. PKCE를 네이버·카카오가 받는가

| 제공자 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|
| 네이버 | OIDC 연동 절(3.5.4 연동 URL 생성, 3.5.6 접근 토큰 발급)에 `code_challenge`("해시처리된 PKCE value"), `code_challenge_method`("PKCE 알고리즘"), `code_verifier`("PKCE로 동작하는 경우 추가")가 있음 | https://github.com/naver/naver-openapi-guide/blob/master/ko/login/devguide/devguide.md | [확정] OIDC 흐름에 있음. 일반 OAuth 2.0 흐름에서도 받는지는 [확인 필요: 호출 시험] |
| 카카오 | 인가 코드 요청 파라미터는 `client_id`, `redirect_uri`, `response_type`, `scope`, `prompt`, `login_hint`, `service_terms`, `state`, `nonce`. 토큰 요청은 `grant_type`, `client_id`, `redirect_uri`, `code`, `client_secret`. PKCE 파라미터 없음 | https://developers.kakao.com/docs/ko/kakaologin/rest-api | [확정] 문서에 없음 |

- 뜻: Spring Security는 제공자마다 PKCE를 켜고 끌 수 있습니다(`requireProofKey`, `signup-security.md` A3-2). 카카오는 끄고 세션에 묶인 `state`로 막습니다(RFC 9700: PKCE를 받지 않는 서버면 `state`). 네이버는 호출 시험에서 받으면 켭니다 [안].
- 설계에서 볼 것: 네이버·카카오 모두 OIDC를 제공합니다(카카오 `nonce` 파라미터, 네이버 3.5절). OIDC로 붙이면 식별자를 ID 토큰의 `sub`로 받는데, 그 값이 프로필 API의 `id`·회원번호와 같은지는 확인하지 않았습니다 [확인 필요: 공식 문서 확인]. OAuth 2.0 + 프로필 API로 갈지 OIDC로 갈지는 `design-delta`에서 정합니다.

## 2. 네이버에서 식별자만 받을 수 있는가

- 프로필 API 응답에는 `id`, `nickname`, `name`, `email`, `gender`, `age`, `birthday`, `profile_image`, `birthyear`, `mobile`이 있고, `id`는 항상 옵니다. (https://github.com/naver/naver-openapi-guide/blob/master/ko/login/profile/profile.md) [확정]
- 검수 가이드는 "권한 선택: 실제 활용되는 정보만 선택"을 요구합니다. 앱 등록 화면에서 제공 정보를 고른다는 뜻입니다. (같은 저장소 `verify/verify.md`) [확정]
- **아무 항목도 고르지 않았을 때 `id`만 오는지**는 문서에 없습니다 [확인 필요: 사용자가 네이버 개발자센터 앱 등록 화면에서 확인]. `signup-security.md` A1-2는 "필수 제공: 이용자 식별자, 닉네임"으로 읽었는데, 닉네임이 빠질 수 있는지 이 화면에서 같이 봅니다.
- 닉네임이 빠지지 않더라도 **저장하지 않고 화면에도 쓰지 않습니다** [확정: spec "저장하는 것", 사용자 2026-10-01]. 그 경우 동의 고지의 "항목"에는 "네이버가 제공하는 닉네임(저장하지 않음)"을 적을지 검토합니다 [확인 필요: 처리방침 문구].
- 카카오는 동의항목 없이 회원번호와 `connected_at`만 받을 수 있습니다 [확정] (spec 데이터 출처).

## 3. 네이버 연결끊기 Callback의 암호 세부 (원문 확인)

출처: https://github.com/naver/naver-openapi-guide/blob/master/ko/login/devguide/devguide.md 4.4절. 모두 [확정].

- 요청: `POST <등록한 Callback URL>`, `Content-Type: application/x-www-form-urlencoded`. 등록 위치는 네이버 개발자센터 > 애플리케이션 > API 설정 > 연결끊기 Callback URL.
- 변수: `clientId`(발급받은 Client ID), `encryptUniqueId`(암호화한 이용자 고유 식별자), `timestamp`(unix epoch 초), `signature`(서명).
- 응답: 성공 204(본문 없음). 그 밖에 400, 403, 404, 50x. **"네이버에서는 실패 요청에 대해서 재시도를 수행하지 않습니다."**
- 키: `CLIENT_SECRET`을 MD5 한 바이트 배열의 앞 16바이트. 암호화와 서명에 같은 키를 씁니다.
- 식별자 암호화: AES128 / CBC / PKCS5Padding. `encryptUniqueId = base64( iv(16바이트) + 암호문 )`. 예제 코드는 URL-safe Base64(`encodeBase64URLSafeString`)를 씁니다. 복호화는 앞 16바이트를 IV로 떼고 나머지를 풉니다.
- 서명: HmacSHA256. 서명 원문은 `clientId=<값>&encryptUniqueId=<값>&timestamp=<값>`, 결과는 URL-safe Base64. 우리가 같은 방식으로 계산한 값이 `signature`와 같아야 합니다.
- 설계에서 정할 것 [안]: `timestamp`가 너무 오래된 요청을 거절할지(문서에 기준 없음), `clientId`가 우리 것과 다른 요청 거절, 서명 비교는 시간 차가 드러나지 않는 비교로.

## 4. 로그인 버튼 디자인 지침

| 제공자 | 지침 | 출처 | 태그 |
|---|---|---|---|
| 카카오 | 버튼 바탕 `#FEE500`, 말풍선 심볼 `#000000`, 글자 `#000000` 85%. 이 색을 벗어나면 안 됨. 심볼은 필수이고 모양·비율·색을 바꿀 수 없음. 글자는 "카카오 로그인" 또는 줄여서 "로그인"(영문 "Login with Kakao"). 모서리 12px. 폭은 양쪽 여백을 같게 늘려 조절 가능. 다른 로그인 버튼을 돋보이게 하려고 카카오 버튼을 덜 눈에 띄게 하면 안 됨 | https://developers.kakao.com/docs/ko/kakaologin/design-guide | [확정] |
| 네이버 | 완성형(로고+글자, 권장)과 아이콘형. 지정 색은 바꿀 수 없고 녹색 바탕 권장. 글자는 네이버 로그인의 목적에 맞으면 됨("네이버로 간편가입", "Log in with Naver" 등). 로고 모양 변형·그러데이션 금지. 다른 로그인 버튼과 나란히 둘 때 네이버 버튼만 작게 하면 안 됨 | https://github.com/naver/naver-openapi-guide/blob/master/ko/login/bi/bi.md | [확정] 규칙 / 녹색의 색 코드는 [확인 필요: 원문 값 확인. 공식 제공 버튼 이미지를 쓰면 값 확인 없이 지킬 수 있음] |

- 화면에 주는 영향: 두 버튼을 **같은 크기로 나란히** 둡니다. 우리 서비스 색으로 칠하지 않습니다. 네이버 검수 항목(브랜딩)과 이어집니다.

## 5. 약관·처리방침 문구와 보호책임자

- 처리방침에 담을 법정 항목은 개인정보 보호법 제30조①과 시행령 제31조①입니다 (`signup-security.md` C8-1, C8-3) [확정].
- 개인정보보호위원회가 「개인정보 처리방침 작성지침(2025.4.)」을 공개했습니다(2025-04-21). 사례와 작성 방법이 들어 있습니다. (https://www.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=D010030000&nttId=11134 , https://www.privacy.go.kr/front/bbs/bbsView.do?bbsNo=BBSMSTR_000000000049&bbscttNo=20806) [확정] 문서가 있음 / 본문 PDF는 열지 못함 [확인 필요: PDF를 읽고 문구 초안 작성].
- 보호책임자:
  - "소상공인"은 「중소기업기본법」상 소기업 중 상시 근로자 수가 10명 미만이고, 업종별 기준(광업·제조업·건설업·운수업 10명 미만, 그 밖의 업종 5명 미만)에 맞는 자입니다. (소상공인기본법 제2조, 시행령 제3조. 확인은 생활법령정보 https://easylaw.go.kr/CSP/CnpClsMain.laf?csmSeq=1973&ccfNo=1&cciNo=1&cnpClsNo=1 요약으로 했고 law.go.kr 조문 화면은 열리지 않음) [확정: 요약 출처]
  - 소상공인이면 보호책임자를 따로 지정하지 않아도 되고 대표자가 책임자가 됩니다 (개인정보 보호법 제31조, 시행령 제32조①, `signup-security.md` C10-2) [확정].
  - 사업자등록이 없는 개인 운영자가 "소기업"에 들어가는지는 확인하지 못했습니다 [확인 필요: 사용자에게 사업자 형태 질문, 필요하면 개인정보보호위원회 문의].
  - **어느 쪽이든 결과는 같습니다** [안]: 운영자 본인을 보호책임자로 처리방침에 적습니다(소상공인이면 법에 따라, 아니면 지정해서). 그래서 설계와 구현을 막지 않습니다.
- 이용약관: 법이 정한 필수 기재 양식은 확인하지 못했습니다 [확인 필요: 공식 문서 확인 — 약관의 규제에 관한 법률, 공정거래위원회 표준약관 중 해당하는 것이 있는지]. 이번 사이클은 "이용약관 페이지와 버전, 가입 때 동의 기록"까지 만들고, 문구는 배포 전에 사용자가 검토합니다 [확정: 사용자 2026-10-01 "이용약관도"].

## 6. 남은 것 (누가, 언제)

| 항목 | 누가 | 언제 |
|---|---|---|
| 네이버 앱 등록 화면에서 아무 항목도 고르지 않으면 `id`만 오는지 | 사용자 (개발자센터 로그인 필요) | 구현 전 |
| 네이버 일반 OAuth 2.0 흐름이 PKCE를 받는지 | dev (호출 시험) | 구현 |
| OIDC의 `sub`가 프로필 `id`·회원번호와 같은지 | plan (공식 문서 확인) | `design-delta` |
| 네이버 버튼 녹색의 색 코드 | dev (원문 또는 공식 이미지 사용) | 구현 |
| 처리방침 작성지침 PDF 읽고 문구 초안 | plan → 사용자 검토 | 배포 전 |
| 사업자 형태(보호책임자 기재 방식), 이용약관 문구 | 사용자 | 배포 전 |

## 7. 카카오 앱 준비와 비즈 앱 (2026-10-03 추가 확인)

사용자 요청("너가 더 검색해봐")으로 더 확인한 것입니다. 확인 날짜 2026-10-03.

| 항목 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|
| 사업자등록증 | 카카오 로그인은 사업자 없이 쓸 수 있음. 카카오 직원 답변: "카카오로그인은 사업자 제한 없이 누구나 창의적으로 사용할 수 있습니다." 동의받을 수 있는 개인정보 범위는 단계별로 제한 | https://devtalk.kakao.com/t/topic/150363 (2026-06-25 답변) | [확정] |
| 앱 생성 입력 항목 | 앱 이름(필수), 회사명(필수), 카테고리(필수), 앱 아이콘(250KB 이하, 128×128 권장). 개인이 "회사명"에 무엇을 적는지는 안내 없음 | https://developers.kakao.com/docs/ko/app-setting/app | [확정] / 회사명 기재 [확인 필요: 화면] |
| 사이트 도메인 등록 | REST API만 쓰면 필수가 아님. JavaScript SDK를 쓸 때 "JavaScript SDK 도메인" 등록이 필요 | 같은 문서 | [확정] |
| 키 | REST API 키(Client Secret 기본 활성), JavaScript 키, 네이티브 앱 키, 어드민 키(앱 소유자만, 서버에서만 사용) | 같은 문서 | [확정] |
| 카카오 로그인 자체의 검수 | 문서에 요구 없음. 추가 기능 신청 대상은 비즈니스 정보 심사, 카카오톡 친구 목록 조회, 카카오톡 메시지 발송, 비즈니스 채널 연결. 심사 기간은 문서에 없음 | 같은 문서 | [확정] |
| 비즈 앱 전환 | 국내 사업자는 사업자등록번호. **사업자등록번호가 없는 개인·단체도 "개인 개발자 비즈 앱"으로 전환 가능**: 앱 소유자 카카오계정 본인인증 + 카카오비즈니스 통합 서비스 약관 동의. 메뉴 [앱] > [일반] > [비즈니스 정보] > [개인 개발자 비즈 앱] | 같은 문서 | [확정] |
| 비즈 앱이면 되는 것 | 카카오 로그인 동의항목 중 이메일을 필수 동의로 설정, 테스트 앱 생성(원본 앱당 최대 5개), 와일드카드 서브 도메인, 비즈니스 인증 동의항목, 키워드광고 API | 같은 문서 | [확정] |
| 개인 개발자 비즈 앱의 제한 | 사업자 정보가 없어 비즈니스 채널을 연결할 수 없음. 이메일 필수 동의가 되는지는 문서에 따로 적혀 있지 않음 | 같은 문서 | [확정] 채널 불가 / [확인 필요: 전환 뒤 동의항목 화면] 이메일 |

- **정정**: 2026-10-01에 `signup-security.md` A2-4 등에서 "카카오 이메일 동의는 비즈 앱(사업자 정보) 전용이라 개인·비영리는 못 받을 수 있다"고 적은 것은 좁게 본 추정이었습니다. 사업자등록번호 없이도 비즈 앱이 될 수 있으므로, 알림 사이클(07)에서 이메일을 전달 수단으로 쓸 길이 있습니다. 관련 문서 아홉 곳을 2026-10-03에 고쳤습니다.
- 사이클 05에 주는 영향: 없음. 이번에는 동의항목을 켜지 않고 회원번호만 받습니다. 카카오 쪽에서 사용자가 준비할 것은 앱 생성, 카카오 로그인 활성화, Redirect URI, 키 전달, (배포 준비 때) 연결 해제 웹훅 URL과 개인정보 처리방침 URL입니다.

## 8. 로그인 상태를 유지하는 방식: 세션과 JWT (2026-10-03)

사용자 요청: "jwt와 세션 이라던가 로그인 정보를 저장하는 방식의 원리와 장단점에 대해서 조사해서 근거있게 설명해줘". 계기: 사용자 "나는 가능하면 jwt로 했으면 좋겠어 세션을 쓰더라도 나중에 확장될 멀티 서버 환경에서 redis등이 필요해지는데 음 가능하면 줄이고 싶어" (2026-10-03). 쉬운 설명: `easy/2026-10-03-login-state-methods.html`. **결정 (2026-10-03)**: 사용자 "jwt로 가려고 해" → 방식 "라"(짧은 JWT + DB 리프레시 토큰). `spec.md` R4를 고침. 2026-10-01의 "세션을 DB에"를 바꿈.

### 확인한 사실 (확인 날짜 2026-10-03)

| 주제 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|
| 세션의 원리 | 세션 ID는 뜻이 없어야 하고, 로그인 정보는 서버 쪽 "session objects or a session management database or repository"에 둠. 민감한 정보가 있으면 저장소를 암호화·보호 | https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html | [확정] |
| JWT의 정의 | "a compact, URL-safe means of representing claims to be transferred between two parties". 점으로 나뉜 base64url 조각. `exp` 뒤에는 받지 않음(4.1.4), `jti`는 토큰 식별자(4.1.7). 암호로 보호되지 않은 내용은 신뢰 판단에 쓸 수 없음(11.1) | https://www.rfc-editor.org/rfc/rfc7519.html | [확정] |
| 토큰 종류 구분 | 세션 관리에는 "self-contained or reference tokens"를 쓰고(7.2.2), reference token은 CSPRNG로 128비트 이상(7.2.3), 인증·재인증 때 새 토큰 발급(7.2.4) | https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x16-V7-Session-Management.md | [확정] |
| 세션 종료와 self-contained token | 7.4.1: self-contained token을 쓰면 "maintaining a list of terminated tokens, disallowing tokens produced before a per-user date and time or rotating a per-user signing key" 같은 방법이 필요. 7.4.2: 계정이 비활성·삭제되면 모든 활성 세션 종료 (둘 다 Level 1) | 같은 문서 | [확정] |
| JWT를 세션에 쓸 때 | "if you use JWTs for user sessions, you will need a solution for managing session invalidation … you might want to consider using a plain session system". 폐기 목록의 키는 토큰 원문·해시가 아니라 `jti`와 `iss`를 쓸 것 | https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html | [확정] |
| Spring Security 기본 | 로그인 정보는 기본으로 `HttpSession`에 저장(`SecurityContextRepository`). 세션을 만들지 않으려면 `SessionCreationPolicy.STATELESS`. 여러 대는 "Clustered sessions with Spring Session" | https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html | [확정] |
| Spring의 JWT 지원 범위 | Resource Server는 받은 JWT의 서명과 `exp`·`nbf`·`iss`를 **검증**함. 자체 키는 `NimbusJwtDecoder.withPublicKey`/`withSecretKey`. **(2026-10-03 정정)** 서명해 만드는 부품 `NimbusJwtEncoder`도 Spring Security에 있음(5.6부터, `withSecretKey`·`withKeyPair`는 7.0부터: https://docs.spring.io/spring-security/reference/api/java/org/springframework/security/oauth2/jwt/NimbusJwtEncoder.html). 없는 것은 "로그인 뒤 내주고 갱신하는" 흐름. 토큰은 기본으로 `Authorization` 헤더에서 읽으므로 쿠키에서 읽으려면 `BearerTokenResolver`를 직접 구현(bearer-tokens 문서). OAuth 로그인 요청(`state`)은 기본으로 `HttpSession`에 보관(`HttpSessionOAuth2AuthorizationRequestRepository`), 쿠키 등으로 바꾸려면 `AuthorizationRequestRepository` 구현(authorization-grants 문서) | https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html | [확정] |
| 세션 저장소 | Spring Session은 JDBC(표 `SPRING_SESSION`, 세션 ID 그대로 저장)와 Redis(키 `spring:session:sessions:<세션ID>`)를 지원. 둘 다 여러 대에서 공유됨 | `spec.md` 데이터 출처, https://docs.spring.io/spring-session/reference/configuration/redis.html | [확정] |
| 리프레시 토큰 | 교체(rotation)하거나 보낸 쪽에 묶을 것 | RFC 9700 2.2.2 (`signup-security.md` B7-3) | [확정] |
| 뜻 없는 토큰(opaque / reference token)을 헤더로 | Bearer token = "any party in possession of the token (a bearer) can use the token"(1.2). 보내는 형식 `Authorization: Bearer <토큰>`(2.1). TLS 필수, 평문으로 갈 수 있는 쿠키에 두지 말 것(5.3) | https://www.rfc-editor.org/rfc/rfc6750.html | [확정] |
| Spring Session의 헤더 방식 | `HeaderHttpSessionIdResolver.xAuthToken()`: 세션 ID를 쿠키 대신 `X-Auth-Token` 헤더로 주고받음. 로그인 응답 헤더로 받고, 이후 요청 헤더에 넣음. 세션을 무효화하면 빈 값으로 응답 | https://docs.spring.io/spring-session/reference/guides/java-rest.html | [확정] |

### 방식 넷과 chaekcheck 적용 [안]

| 방식 | 여러 대 | 즉시 끊기 | chaekcheck |
|---|---|---|---|
| 가. 메모리 세션 | 안 됨 | 됨 | 서버 재시작 때 전원 로그아웃 → 2026-10-01에 사용자 선택에서 빠짐 |
| 나. 저장소 세션 (DB) | 됨, Redis 불필요 | 됨 | 2026-10-01 결정. 만들 것이 가장 적음. 로그인한 요청마다 세션 표를 한 번 읽음. 앱은 나중에 토큰 경로 추가 |
| 다. JWT 하나(만료 김) | 됨 | 안 됨 | 탈퇴·연결 끊기 때 끊을 수 없어 명세 R6·R7, ASVS 7.4.2와 충돌 → 쓸 수 없음 |
| 라. 짧은 JWT + 리프레시 토큰(DB, 교체) | 됨, Redis 불필요 | 리프레시는 즉시, JWT는 만료까지(예: 15분) | 요청마다 DB를 안 읽음. 웹과 앱이 같은 방식. 발급·갱신·폐기·서명 키 관리를 직접 만듦. 계정이 삭제되면 계정 자료를 읽는 API는 바로 실패 |

- "여러 대면 Redis가 필요하다"는 가 → 나로 옮길 때의 이야기이고, 나의 저장소는 PostgreSQL이어도 됨. 그래서 Redis를 피하는 목적은 나·라 모두 충족.
- 고르는 기준 [안]: 이번 사이클을 작게 하고 탈퇴 즉시 끊기를 확실히 하려면 나. 폰 앱(Expo)을 곧 만들어 웹과 한 방식으로 가려면 라. Claude 추천: 나로 시작하고 앱 사이클에서 토큰 경로를 더함(그때 로그인한 사용자는 한 번 다시 로그인). 사용자 결정 대기.
- (JWT로 정해져 해당 없음, 기록으로 남김) **세션 방식(나)으로 가면 폰 앱은 세션 ID를 헤더로 주고받는 방식으로 붙임** [확정] (사용자: "이거 세션 방식일 경우에 폰에서 하면 좋은 방법이라는 추천안 맞아? 그렇다면 그렇게 해두고", 2026-10-03). 세션이냐 JWT냐 자체는 아직 미정.
- 폰 앱에 JWT가 꼭 필요한 것은 아님: 나(DB 세션)에서 앱에는 같은 세션 ID를 헤더로 주고받게 하면(Spring Session 헤더 방식) 웹과 앱이 같은 세션 표를 쓰고 즉시 끊기도 같음. 앱은 토큰을 기기의 보안 저장소에 둠. 헤더로만 보내는 요청은 브라우저가 자동으로 붙이지 않으므로 CSRF 토큰이 필요 없음(웹 쿠키 경로에는 그대로 필요). 2026-10-03 사용자 질문 "이건 정확히 뭐야?"에 답하며 추가.
- JWT(라)로 갈 때 만드는 것 (2026-10-03 다시 셈, 처음의 "만들 것이 많다"는 과장이었음): 서명 키를 환경 변수로, 로그인 성공 때 JWT를 `HttpOnly` 쿠키로 내주기, 쿠키에서 읽는 `BearerTokenResolver`, 리프레시 토큰 표 1개와 갱신 API(교체), 웹의 401 → 갱신 → 재요청(여러 탭 동시 갱신 포함), 로그아웃·탈퇴 때 리프레시 줄 삭제, 로그인 도중 임시 값(`state`, 동의 전 제공자 식별자)을 둘 곳(쿠키 저장소를 만들거나 로그인 도중 몇 분만 세션 사용). 코드 몇백 줄과 표 하나 수준. 차이의 핵심은 양이 아니라 즉시 끊기(세션 즉시 / JWT 최대 액세스 토큰 수명)와 리프레시 교체 코드를 직접 책임지는 점. 사용자: "자세히 보니 jwt가 그렇게까지 해야 할게 많은 것 같지도 않은데" (2026-10-03).
- 어느 쪽이든 이 결정은 ADR로 기록함(`integration-plan.md` 6.1 "인증 방식").

## 9. OAuth와 Spring Security가 각각 막는 것: CSRF, XSS 등 (2026-10-03)

사용자 요청: "spring security랑 oath이런게 있는데 이게 각각이 보안 csfr 뭐 xxs 뭐 이런 것들과 관련해서 서로 어떤 것을 하는지 무엇을 어떤 원리로 할 수 있는지". 쉬운 설명: `easy/2026-10-03-security-who-does-what.html`. 확인 날짜 2026-10-03. OAuth `state`·PKCE·redirect URI, 세션 고정 보호, `csrf.spa()`의 출처는 `docs/research/member-and-alerts/signup-security.md` A3·B4·B7.

| 주제 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|
| Spring Security의 동작 방식 | "Spring Security's Servlet support is based on Servlet Filters". 순서: `CsrfFilter` → 인증 필터 → `AuthorizationFilter`. 인증 안 됨·거부는 `ExceptionTranslationFilter`가 처리 | https://docs.spring.io/spring-security/reference/servlet/architecture.html | [확정] |
| CSRF가 가능한 이유 | 다른 사이트는 쿠키를 볼 수 없지만 "the cookies associated with your bank are still sent along with the request" | https://docs.spring.io/spring-security/reference/features/exploits/csrf.html | [확정] |
| CSRF 토큰의 원리 | 토큰은 브라우저가 자동으로 붙이지 않는 자리(HTTP 파라미터나 헤더)에 있어야 함. 쿠키에만 두면 소용없음 | 같은 문서 | [확정] |
| `SameSite` | 유일한 방어가 아니라 보조(defense in depth)로 권고 | 같은 문서 | [확정] |
| CSRF 토큰이 저장되는 곳 | 기본: "stores the expected CSRF token in the `HttpSession`"(`HttpSessionCsrfTokenRepository`), 요청에서는 헤더 `X-CSRF-TOKEN` 또는 파라미터 `_csrf`로 읽음. `CookieCsrfTokenRepository`: "writes to a cookie named `XSRF-TOKEN` and reads it from an HTTP request header named `X-XSRF-TOKEN` or the request parameter `_csrf`", 서버에 따로 저장하지 않고 쿠키 값과 헤더 값을 비교. `HttpOnly`를 false로 두는 것은 자바스크립트가 읽어야 해서. `csrf.spa()`는 이 쿠키 저장소 + SPA용 요청 처리기(BREACH 보호)를 묶은 설정. 로그인·로그아웃 성공 때 쿠키를 지우고 새 토큰은 필요할 때 다시 줌. 특정 경로 제외는 `ignoringRequestMatchers` | https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html (2026-10-03, 사용자 질문 "이 토큰이 어디에 저장되는 거야?") | [확정] |
| CSRF 방어 대상 | "any request that could be processed by a browser by normal users". 무상태여도 쿠키를 쓰면 취약. 로그인·로그아웃 요청도 대상 | 같은 문서 | [확정] |
| 기본 보안 헤더 | 기본: `Cache-Control`, `X-Content-Type-Options`, HSTS, `X-Frame-Options`, `X-XSS-Protection`(브라우저 XSS Auditor 끔). 기본이 **아닌** 것: Content-Security-Policy("a reasonable default is impossible to know"), Referrer-Policy, Permissions-Policy | https://docs.spring.io/spring-security/reference/servlet/exploits/headers.html | [확정] 기본 여부 / 각 헤더의 기본값은 요약으로 확인 [확인 필요: 구현 때 원문] |
| XSS 방어 | 모든 변수를 검증하고 이스케이프·sanitize. HTML 본문에는 `& < > " '`를 엔티티로. 프레임워크의 빈틈: React `dangerouslySetInnerHTML`. HTML을 허용해야 하면 DOMPurify. 쿠키 속성과 CSP는 피해를 줄이는 보조이고 CSP를 1차 방어로 삼지 말 것 | https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html | [확정] |
| React가 값을 넣을 때 기본으로 이스케이프한다는 점 | OWASP 문서가 프레임워크 보호와 그 빈틈으로 설명. React 공식 문서는 이번에 열지 않음 | 위 OWASP 문서 | [확인 필요: React 공식 문서] |

### chaekcheck 설계에 주는 것 [안]

- 웹훅·콜백 주소(`/api/v1/kakao/unlink-callback`, 네이버 콜백)는 제공자 서버가 보내므로 CSRF 토큰 대상에서 빼고, 대신 어드민 키·서명으로 확인함. `design-delta`의 API 표에 적을 것.
- CSP·Referrer-Policy는 Spring 기본이 아님 → 넣을지와 정책은 `design-delta`에서 정함. 웹 화면(React 정적 파일)을 어디서 서빙하는지에 따라 헤더를 넣는 곳이 달라짐 [확인 필요: 배포 구성].
- 도서관 사이트에서 읽어 온 글자(제목·저자·출판사)는 바깥에서 온 값이므로 화면에서 글자로만 출력. `dangerouslySetInnerHTML` 금지를 인계서 제약에 넣을 것.
- 내 자료 API는 세션의 계정 번호만 사용(ASVS 8.2.2, `signup-security.md` 3절 10번).
- 로그인 유지 방식을 JWT로 바꿔도 토큰을 쿠키에 두면 CSRF 방어는 그대로 필요.

## 10. 세션으로 시작해도 나중에 JWT 전환과 폰 앱이 되는가 (2026-10-03)

사용자 요청: "나중에 jwt로 전환할 때 로그인이 안되는 부분이 된다거나 하는 걸 줄이고 싶어 그리고 나중에 폰 앱에서도 되게 할거야 이를 고려해서 세션 방식으로 가능한가 알아보고 되면 이야기해줘" (2026-10-03). 결론: **가능함.** 아래 "지금 지킬 것" 다섯 가지를 사이클 05 설계 조건으로 두면 됨 [안].

### 확인한 사실 (확인 날짜 2026-10-03)

| 주제 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|
| 계정별 세션 찾기 | Spring Session의 JDBC와 Redis 저장소는 `FindByIndexNameSessionRepository`를 구현함. `findByPrincipalName(이름)`으로 한 사용자의 세션을 모두 찾을 수 있고, Spring Security를 쓰면 사용자 이름이 자동으로 색인됨. JDBC 표에 `PRINCIPAL_NAME` 칸이 있음 | https://docs.spring.io/spring-session/reference/api.html , https://docs.spring.io/spring-session/reference/guides/boot-findbyusername.html | [확정] |
| JDBC 세션 이벤트 | `JdbcIndexedSessionRepository`는 세션 이벤트 발행을 지원하지 않음 | 같은 API 문서 | [확정] |
| 세션 ID를 헤더로 | `HeaderHttpSessionIdResolver.xAuthToken()` 빈을 두면 세션 ID를 `X-Auth-Token` 헤더로 주고받음 | 8절 (Spring Session REST 가이드) | [확정] |
| 쿠키(웹)와 헤더(앱)를 한 서버에서 같이 받기 | 문서에서 직접 확인하지 못함. 요청에 헤더가 있으면 헤더로, 없으면 쿠키로 읽는 resolver를 직접 두는 방식이 필요해 보임 | — | [확인 필요: 앱 사이클에서 Spring Session API 문서 확인·프로토타입] |
| 폰 앱의 소셜 로그인 | 네이티브 앱은 OAuth 인가 요청에 시스템 브라우저(external user-agent)를 써야 함(5절). 돌아오는 주소는 앱 전용 URI scheme, 앱이 소유한 https 주소, loopback 중 하나(7절). 공개 클라이언트는 PKCE 필수(6절) | https://www.rfc-editor.org/rfc/rfc8252.html | [확정] |
| 여러 인증 방식을 한 서버에서 | Spring Security는 필터 사슬에서 세션 기반 로그인과 JWT 검증(Resource Server)을 각각 제공함. 둘을 한 사슬에 같이 두는 설정은 이번에 문서로 확인하지 않음 | 8절 출처 | [확인 필요: 전환 때 공식 문서 확인·프로토타입] |

### 폰 앱 [안]

- 로그인 유지: 세션 ID를 헤더로 주고받음(8절, 사용자 결정 2026-10-03). 웹과 같은 세션 표, 탈퇴 때 즉시 끊김.
- 로그인 절차: 앱이 시스템 브라우저를 열어 네이버·카카오 로그인 → 우리 서버로 돌아옴 → 서버가 앱으로 돌려보내며 **한 번만 쓰는 짧은 코드**를 줌 → 앱이 그 코드를 서버에 내고 세션 ID를 받음. 세션 ID를 주소에 실어 보내지 않기 위함. 이 "코드 → 세션 ID" 교환 API는 앱 사이클에서 만듦 [안].
- 대안: 네이버·카카오의 앱용 SDK로 로그인해 받은 토큰을 우리 서버에 보내 확인하는 방식 [확인 필요: 앱 사이클에서 공식 문서 확인].
- 사이클 05가 이를 막지 않으려면: 로그인 성공 뒤 "어디로 돌아갈지"를 정하는 부분을 한 곳에 모아 둠(웹 주소 / 나중에 앱 주소).

### 나중에 JWT로 바꿀 때 로그인이 풀리지 않게 [안]

전환 방법: **한동안 둘 다 받고, 세션으로 온 요청에 JWT를 조용히 내줌.**

1. JWT 발급·검증을 더한 새 버전을 배포. 서버는 세션 쿠키와 JWT를 둘 다 받음.
2. 세션만 가진 요청이 오면, 그 세션이 유효할 때 같은 계정의 JWT(와 리프레시 토큰)를 응답 쿠키로 내줌. 사용자는 다시 로그인하지 않음.
3. 세션의 최대 수명(30일 비활성, 절대 만료 [안] 90일)이 지나면 세션을 받는 코드를 지움. 그동안 한 번도 오지 않은 사용자만 다시 로그인함.

이 전환이 가능하려면 **지금 지킬 것** 다섯 가지 (사이클 05 설계 조건 [안]):

| # | 지킬 것 | 이유 |
|---|---|---|
| 1 | 세션에는 계정 번호만 넣음. 다른 상태(장바구니 같은 것, 화면 설정, 토큰)를 넣지 않음 | 세션의 내용이 JWT의 `sub` 하나로 그대로 옮겨짐 |
| 2 | 우리 코드는 `HttpSession`을 직접 읽지 않고 "현재 계정"(`AccountId`)만 받음 (ADR-0036의 공개 타입) | 로그인 유지 방식을 바꿔도 컨트롤러·서비스 코드가 그대로 |
| 3 | 웹 화면은 로그인 여부를 `/api/v1/me`로만 알고, 쿠키 이름·내용을 읽지 않음 | JWT도 `HttpOnly` 쿠키로 주면 웹 코드가 그대로 |
| 4 | "이 계정의 로그인을 모두 끊기"를 한 군데(인터페이스)로 모음. 지금 구현은 세션 표에서 `PRINCIPAL_NAME`으로 찾아 지우기 | 나중 구현은 리프레시 토큰 줄 지우기로 바뀜. 탈퇴·웹훅·콜백 코드는 그대로 |
| 5 | CSRF 토큰을 세션이 아니라 쿠키에 둠(`csrf.spa()`) | 세션이 없어져도 CSRF 방어가 그대로 |

- 2·4번은 ADR-0021("본 서비스 1대, 설계는 여러 대 대비": 바뀔 부분을 인터페이스 뒤에)과 같은 방식.
- 로그인 도중의 임시 값(OAuth `state`, 동의 전의 제공자 식별자)은 몇 분짜리라 세션에 둬도 전환에 영향 없음.
- 전환이 실제로 필요한 때: 로그인한 요청이 많아져 요청마다 세션 표를 읽는 것이 부담이 될 때. 지금은 그 수치가 없음 [확인 필요: 운영 뒤 측정].

## 11. 공격 네 가지와 "쿠키냐 헤더냐"의 근거 (2026-10-03)

사용자 요청: 로그인 가로채기·세션 고정·탈취·클릭재킹·남의 자료 접근을 "원리랑 해서 자세히 근거 있게", 그리고 "세션이면 CSRF를 고려할 필요가 없지 않나"에 대한 답을 공식 문서 근거와 함께. 쉬운 설명: `easy/2026-10-03-four-attacks.html`, `easy/2026-10-03-cookie-or-header.html`. 확인 날짜 2026-10-03.

| 주제 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|
| 가짜 돌아오기 요청(로그인 CSRF) | `state`를 요청과 돌아오기 사이의 상태 유지에 쓰고 CSRF 방지에 써야 함(SHOULD). 사용자 에이전트의 인증 상태에 묶을 것 | https://www.rfc-editor.org/rfc/rfc6749.html 10.12 | [확정] (공격 절차 문장은 요약으로 읽음. 페이지의 설명은 Claude가 풀어 쓴 것) |
| `code`의 수명·사용 횟수 | "The authorization code MUST expire shortly after it is issued", 최대 10분 권고, 한 번만 사용 | 같은 문서 10.5 | [확정] |
| `code` 가로채기와 PKCE | 폰에서 나쁜 앱이 같은 URI scheme을 등록해 `code`를 가로챔(1절). `code_verifier` 43~128자 무작위, `code_challenge`는 그 해시(S256), 서버가 비교해 다르면 토큰 거부(4절) | https://www.rfc-editor.org/rfc/rfc7636.html | [확정] |
| 세션 고정 | 3단계: 유효한 세션 ID 획득 → 피해자가 그 ID로 인증하게 유도 → 그 ID로 세션 사용. 원인: "When authenticating a user, it doesn't assign a new session ID" | https://community.owasp.org/attacks/Session_fixation | [확정] |
| 세션 탈취 경로 | 예측 가능한 토큰, 스니핑, 클라이언트 쪽 공격(XSS 등), 중간자, 브라우저 내 공격 | https://community.owasp.org/attacks/Session_hijacking_attack | [확정] |
| 쿠키 속성 | `HttpOnly`: 스크립트가 `document.cookie`로 쿠키에 접근하지 못하게 함. 단 XSS와 CSRF가 결합되면 브라우저가 쿠키를 붙여 보냄. `Secure`: HTTPS로만 전송. 권한이 바뀌면 세션 ID를 새로 만들 것 | https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html | [확정] |
| HSTS 등 기본 헤더의 값 | `Strict-Transport-Security: max-age=31536000 ; includeSubDomains ; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Cache-Control: no-cache, no-store, max-age=0, must-revalidate` | https://docs.spring.io/spring-security/reference/features/exploits/headers.html | [확정] (9절의 "기본값 [확인 필요]"를 이것으로 해소) |
| 클릭재킹 | 정의: 페이지를 프레임에 넣고 CSS로 속여 의도하지 않은 것을 누르게 함. 방어: `X-Frame-Options`(`DENY`는 어떤 도메인도 프레임 불가, `SAMEORIGIN`은 같은 사이트만) 또는 CSP `frame-ancestors`(있으면 `X-Frame-Options`보다 우선), `SameSite` 쿠키, 프레임 탈출 스크립트(우회 가능) | https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html , 위 Spring 문서 | [확정] |
| 남의 자료 접근(IDOR) | 정의: 식별자를 바꿔 다른 객체에 접근·수정. 예: `/users/123` → `/users/124`. 방어: 객체마다 접근 검사, 현재 사용자를 세션 정보에서 정함, 긴 무작위 식별자는 보조 | https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html | [확정] |
| 인가 요구 | 8.2.1 기능 단위, 8.2.2 자료 단위(IDOR·BOLA), 8.3.1 신뢰할 수 있는 서비스 계층에서 강제(클라이언트 자바스크립트에 의존하지 않음). 모두 Level 1 | https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x17-V8-Authorization.md | [확정] |
| CSRF의 원인 | "Since browser requests automatically include all cookies including session cookies, this attack works unless proper authorization is used." | https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html | [확정] |
| XSS와 CSRF 방어의 관계 | "Cross-Site Scripting (XSS) can defeat all CSRF mitigation techniques!" `SameSite`는 보조이며 CSRF 방어를 대신하지 않음. 사용자 정의 헤더가 붙은 요청은 브라우저가 preflight를 보냄 | 같은 문서 | [확정] |
| 로그인 값을 localStorage에 | "Do not store session identifiers in local storage as the data is always accessible by JavaScript. Cookies can mitigate this risk using the `httpOnly` flag." "A single Cross Site Scripting can be used to steal all the data in these objects" | https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html | [확정] |

### 설계에 주는 것 [안]

- 웹은 토큰을 `HttpOnly` 쿠키에 두고 CSRF 토큰으로 막음(사용자 질문에 대한 답이자 `spec.md` R4와 같은 방향). CSRF 대상: 로그아웃, 가입 동의, 탈퇴, 토큰 갱신.
- Spring Security의 보안 헤더는 Spring이 보내는 응답에만 붙음. React 정적 파일을 다른 서버가 내려 주면 그 서버에도 `X-Frame-Options`(또는 CSP `frame-ancestors`), HSTS를 설정해야 함 [확인 필요: 배포 구성].
- 내 자료 API는 주소에 계정 번호를 넣지 않고(`/api/v1/me/...`) 토큰의 계정 번호로만 찾음. 인계서 제약에 넣을 것.

## 12. 명세 제안 검토에서 나온 질문 여섯 (2026-10-04)

사용자가 캔버스에서 남긴 것: 4 "이유를 알려줬으면 해", 6 "이거 일반적인 기간이야? 30일? 너무 긴 거 아닌가 해서 조사해서 알려줘", 8 "Lax안전한거야? 다른 네이버/카카오 로그인을 사용하는 사이트는 어떻게 해?", 11 "여러 방법에 대해서 추가로 더 근거 있게 꼼꼼히 조사하고 /easy 스킬 써서 알려준 다음에 판단하자", 13 "네이버/카카오 로그인을 건드는게 정확히 뭐야?", 15 "탈퇴할 때 추가로 본인 확인을 하는 건? 다른 서비스들은 보통 어떻게 해?". 쉬운 설명: `easy/2026-10-04-spec-questions.html`. 확인 날짜 2026-10-04.

| 번호 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|
| 6 | AAL1: "A definite reauthentication overall timeout SHALL be established, which SHOULD be no more than 30 days at AAL1." "An inactivity timeout MAY be applied but is not required at AAL1." AAL2는 전체 24시간·미사용 1시간, AAL3는 12시간·15분. **30일은 로그인한 때부터 세는 전체 기한**임 (`spec.md`가 "마지막 사용 뒤 30일"의 근거로 든 것은 잘못이었음) | https://pages.nist.gov/800-63-4/sp800-63b.html | [확정] |
| 6 | "Common idle timeouts ranges are 2-5 minutes for high-value applications and 15-30 minutes for low risk applications." 전체 기한은 하루 종일 쓰는 업무용이면 4~8시간 | https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html | [확정] |
| 6 | 7.1.1(L2): 미사용 기한과 전체 기한을 문서에 적고 NIST SP 800-63B와 다르면 이유를 적을 것. 7.3.1·7.3.2(L2): 두 기한을 위험 분석에 따라 둘 것 | https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x16-V7-Session-Management.md | [확정] |
| 6 | Auth0 리프레시 토큰 미사용 기한 기본 2,592,000초(30일), 최대 1년 | https://auth0.com/docs/secure/tokens/refresh-tokens/configure-refresh-token-expiration | [확정] (전체 기한의 기본값은 이 페이지에서 확인 못 함) |
| 6 | 카카오 REST API 리프레시 토큰 5,184,000초(60일), 액세스 토큰 43,199초 | https://developers.kakao.com/docs/ko/kakaologin/rest-api | [확정] |
| 6 | 구글 리프레시 토큰: "The refresh token has not been used for six months."이면 무효 | https://developers.google.com/identity/protocols/oauth2 | [확정] |
| 8 | Lax: 같은 사이트 요청, 그리고 다른 사이트에서 시작된 요청 중 최상위 이동이면서 안전한 메서드인 것에만 쿠키를 보냄. `fetch()`, `<img>`, `<iframe>` 안의 요청, POST·PUT·DELETE는 제외. 표시가 없어 Lax가 기본으로 적용될 때는 설정 후 2분 안의 POST에도 붙는 느슨한 판이 쓰임 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie | [확정] |
| 8 | 세션 쿠키는 "SameSite=Strict (preferred) or SameSite=Lax" | OWASP Session Management Cheat Sheet (위) | [확정] |
| 8 | "SameSite is useful as a defense-in-depth control but it does not replace a proper CSRF defense in most deployments." "If any state-changing operation in the application is reachable via a GET request, SameSite=Lax will not stop it." SameSite는 등록 도메인 단위라 하위 도메인끼리는 같은 사이트 | https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html | [확정] |
| 8 | Spring Session `DefaultCookieSerializer`의 `sameSite` 기본값은 `Lax` | https://docs.spring.io/spring-session/reference/guides/java-custom-cookie.html | [확정] |
| 8 | 네이버·카카오 로그인을 쓰는 다른 사이트들의 쿠키 설정 | 공식 자료 없음 | [확인 필요] (확인할 방법 없음. 기본값으로 대신 설명함) |
| 11 | 7.4.1(L1) 로그아웃·만료 시 그 세션을 더 쓰지 못하게, 7.4.2(L1) 계정 삭제 시 모든 활성 세션 종료. self-contained token의 방법 셋은 8절 표 | ASVS 5.0 V7 (위) | [확정] |
| 11 | 리프레시 토큰 교체: "If a refresh token is compromised and subsequently used by both the attacker and the legitimate client, one of them will present an invalidated refresh token, which will inform the authorization server of the breach." 액세스 토큰은 수명을 짧게 | https://www.rfc-editor.org/rfc/rfc9700.txt 4.14.2 | [확정] (인용은 요약 도구로 읽음) |
| 11 | Resource Server의 JWT 검증에는 폐기·거부 목록 기능이 없음. 검증에 `OAuth2TokenValidator<Jwt>`를 더할 수 있음. 시계 오차 기본 60초. 기본 변환은 사용자 조회 없이 JWT의 `sub`만 씀 | https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html | [확정] |
| 11 | OWASP JWT Cheat Sheet의 거부 목록 절 원문 | 페이지가 404 (2026-10-04) | [확인 필요] (8절의 이전 확인에 의존) |
| 13 | 카카오 로그아웃 `/v1/user/logout`: 토큰을 폐기해 카카오 로그인 세션을 종료. 브라우저의 카카오계정 세션에는 영향 없음. "카카오계정과 함께 로그아웃" `/oauth/logout`: 카카오계정 세션까지 끝내고 로그아웃 리다이렉트 URI로 302. 연결 끊기: 동의 철회 + 토큰 폐기 | https://developers.kakao.com/docs/ko/kakaologin/rest-api | [확정] |
| 13 | 네이버 개발 가이드에 "로그아웃"이라는 낱말이 없음. 있는 것은 토큰 폐기(구 "연동 해제"). 갱신 토큰 유효기간도 적혀 있지 않음 | https://github.com/naver/naver-openapi-guide/blob/master/ko/login/devguide/devguide.md | [확정] (문서에 없음) / 네이버 쪽 로그아웃을 서비스가 해도 되는지의 정책 [확인 필요] |
| 15 | "it's important to require the current credentials for an account before updating sensitive account information … or before sensitive transactions" | https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html | [확정] |
| 15 | 7.5.1(L2): 인증에 영향을 주는 민감한 계정 속성을 바꾸기 전에 완전한 재인증. 7.5.3(L3): 매우 민감한 작업 전에 추가 인증 | ASVS 5.0 V7 (위) | [확정] |
| 15 | GitHub sudo 모드: 계정 삭제가 대상에 들어 있음. "GitHub has a two-hour session timeout period before prompting you for authentication again." | https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/sudo-mode | [확정] |
| 15 | 네이버·카카오 자신의 탈퇴 화면 절차 | 공식 문서에서 찾지 못함 | [확인 필요] |

### 다시 낸 제안 [안]

- 4: 이유를 알려 주는 것은 [확정] (사용자). 문구 셋(취소 / 제공자 쪽 문제 / 시간 지남)은 [안].
- 6: 기한을 "로그인한 지 30일" 하나로. 처음 제안(미사용 30일 + 전체 90일)은 NIST AAL1 권고보다 길어 ASVS 7.1.1에 따라 이유를 적어야 함.
- 8: `SameSite=Lax` 유지. 규칙 둘을 인계서 제약에: 상태를 바꾸는 요청을 GET으로 만들지 않음, 상태를 바꾸는 요청에 CSRF 토큰.
- 11: 액세스 토큰에 로그인 번호를 넣고, 로그인이 필요한 요청마다 그 로그인 기록(리프레시 토큰 줄)이 있는지 확인. ASVS가 든 예 셋에는 없는 길로, Claude가 "리프레시 토큰을 DB에 둔다"는 결정에 맞춰 낸 것. 계정 확인(처음 제안)과 DB 읽기 횟수가 같고 로그아웃까지 바로 끊음.
- 13: 로그아웃은 우리 쪽만. 제공자 로그인은 그대로.
- 15: 재인증 유지(네이버 연결을 끊으려면 새 토큰이 필요), 유효 시간 5분.

### 두 번째 질문 (2026-10-04)

사용자: 11 "리프레시 토큰을 db에 두면 세션이랑 다를 바가 없어 보여서 … 다른 큰 서비스들은 어떻게 해?", 13 "네이버/카카오 자체 서비스 로그인은 왜 물어보는거야?", 15 "네이버/카카오 다르게 하는 건? 그리고 보통 네이버 소셜 로그인 서비스는 어떻게 탈퇴하는지". 쉬운 설명: `easy/2026-10-04-spec-questions-2.html`.

| 번호 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|
| 11 | "Refresh tokens are credentials used to obtain access tokens." "The token denotes an identifier used to retrieve the authorization information." "refresh tokens are intended for use only with authorization servers and are never sent to resource servers." | https://www.rfc-editor.org/rfc/rfc6749.txt 1.5 | [확정] |
| 11 | "Auth0 limits the amount of active refresh tokens to 200 tokens per user per application." 리프레시 토큰은 폐기할 수 있음 | https://auth0.com/docs/secure/tokens/refresh-tokens | [확정] |
| 11 | `OAuth2AuthorizationService`가 액세스·리프레시 토큰을 담은 `OAuth2Authorization`을 저장. `JdbcOAuth2AuthorizationService`는 JDBC로 DB에 저장 | https://docs.spring.io/spring-authorization-server/reference/core-model-components.html | [확정] |
| 11 | 각 회사가 내부에서 리프레시 토큰을 어떤 저장소에 두는지 | 공개 문서 없음 | [확인 필요] (확인할 방법 없음) |
| 15 | 탈퇴 등으로 연동을 더 쓰지 않으면 Token Revocation API(`/oauth2.0/revoke`)로 연결을 끊음. 접근 토큰이 만료됐으면 갱신 토큰으로 재발급. 사용자가 네이버 "연결된 서비스 관리"에서 직접 철회할 수도 있음 | https://github.com/naver/naver-openapi-guide/blob/master/ko/login/devguide/devguide.md | [확정] |
| 15 | 네이버 로그인 서비스들이 탈퇴 때 갱신 토큰 저장과 재인증 중 어느 쪽을 많이 쓰는지 | 자료 없음 | [확인 필요] (확인할 방법 없음) |

- 13: 사용자 말대로 확정. 로그아웃은 우리 쪽만, 탈퇴는 제공자에 연결 끊기를 알림. 제공자 자체 로그인은 건드리지 않음.
- 11 다시 낸 제안 [안]: 계정이 있는지만 확인("나"). 로그인 기록 확인("다")은 사실상 세션이라 추천에서 내림.
- 15 다시 낸 제안 [안]: 둘 다 재인증 유지. 다른 길: 카카오만 확인 창(어드민 키로 끊음) / 둘 다 확인 창 + 네이버 갱신 토큰 저장.
- 앱 등록의 "회사명"(카카오): 필수, "서비스의 상호, 법인 또는 단체명". 개인 개발자는 개발자 정보나 서비스를 대표하는 정보를 넣어도 됨. 동의 화면에 보임. https://developers.kakao.com/docs/ko/app-setting/app , https://devtalk.kakao.com/t/topic/140241 (2026-10-04) [확정]

### 큰 서비스들은 로그아웃한 토큰을 어떻게 다루나 (2026-10-04)

사용자: "다른 큰 유명한 사이트들을 이걸 어떻게 하는지 조사해서 알려줘" (11번을 정하기 위해). 확인 날짜 2026-10-04.

| 서비스 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|
| Firebase (구글) | ID 토큰 수명 1시간. 리프레시 토큰을 폐기해도 이미 내준 ID 토큰은 만료까지 유효. 요청마다 폐기 여부를 보는 선택 기능(`checkRevoked`)이 있으나 "an expensive operation, requiring an extra network round trip" | https://firebase.google.com/docs/auth/admin/manage-sessions | [확정] |
| AWS Cognito | "revoked tokens will still be valid if they are verified using any JWT library that verifies the signature and expiration of the token." 폐기된 토큰은 Cognito 자체 API에서만 거절됨 | https://docs.aws.amazon.com/cognito/latest/developerguide/token-revocation.html | [확정] |
| Microsoft Entra | 액세스 토큰 기본 수명 60~90분(평균 75분). 더 빨리 끊으려는 조직용으로 Continuous Access Evaluation이 따로 있음 | https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens | [확정] (폐기 불가 문장은 이 페이지에서 직접 확인 못 함) |
| Supabase | 액세스 토큰 기본 1시간. 로그아웃해도 액세스 토큰은 만료까지 유효. 바로 끊으려면 JWT의 `session_id`를 `auth.sessions` 표에서 확인 | https://supabase.com/docs/guides/auth/sessions | [확정] |
| Okta | 로컬 검증은 빠름. 원격 검증(introspection)은 느리지만 "when you want to guarantee that the access token hasn't been revoked" | https://developer.okta.com/docs/guides/validate-access-tokens/dotnet/main/ | [확정] |
| GitHub | 웹 세션 목록을 보여 주고 세션별로 끊을 수 있음(서버가 세션을 기억하는 방식) | https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/viewing-and-managing-your-sessions | [확정] |
| 네이버·카카오·국내 쇼핑몰 등의 자체 웹 로그인 내부 방식 | 공개 문서 없음 | — | [확인 필요] (확인할 방법 없음) |

- 읽은 결과: JWT를 내주는 인증 서비스들의 기본은 "요청마다 확인하지 않음, 만료까지 유효(대개 1시간)"이고, 요청마다 확인하는 길은 비용을 감수하는 선택 기능으로 둠. Supabase의 선택 기능이 11번의 "다"와 같은 방식(`session_id` 확인).

### 중요한 기능의 재인증 (2026-10-04)

사용자: "로그인이 필요한 기능 중 중요한 부분들을 사용자 인증을 받는 식으로 가는게 어떨까". 근거는 위 표의 15번 행들(OWASP Authentication Cheat Sheet, ASVS 7.5.1·7.5.3, GitHub sudo 모드)과 `spec.md` 데이터 출처의 Firebase(계정 삭제는 최근 로그인한 사용자만).

- GitHub가 재인증을 요구하는 작업: 계정 삭제, 이메일 변경, SSH 키 추가, 앱 권한 부여, 토큰·웹훅 관리, 복구 코드 보기 등. 저장소 보기·글쓰기 같은 일상 작업은 대상이 아님 [확정: 위 GitHub 문서].
- 기준 [확정] (사용자: "응 그 기준으로 확정해줘", 2026-10-04): ① 되돌릴 수 없는 일 ② 로그인 수단을 바꾸는 일 ③ 연락처를 바꾸는 일에만 재인증. 그 밖의 일상 기능에는 요구하지 않음.
- 대상 [확정] (같은 날, 기준과 함께 승인): 사이클 05 탈퇴. 나중: 다른 소셜 계정 연결·해제, 알림 받을 연락처 등록·변경, 직접 회원가입의 비밀번호·이메일 변경. 대상 아님: 지역·내 도서관 저장과 수정, 알림 켜고 끄기.

## 13. 설계 검토에서 나온 질문 (2026-10-04)

사용자가 캔버스에서 남긴 것: 1 "각각의 장단점에 대해서 추가로 설명해 줘", 2 "여러 기기에서 로그인한 경우가 걱정되는데 어덯게 돼?", 3 "redis를 통해서 이러 정보드를 메모리에 올리는 것이 안전한지도 좀 알려줘", 6 "이렇게 해도 보안 상 안전한거니?". 쉬운 설명: `easy/2026-10-04-design-questions.html`. 확인 날짜 2026-10-04.

| 번호 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|
| 1 | 방식 바꿔치기: "An 'RS256' … parameter value can be changed into 'HS256' …, and some libraries would try to validate the signature using HMAC-SHA256 and using the RSA public key as the HMAC shared secret." 대책: "Libraries MUST enable the caller to specify a supported set of algorithms and MUST NOT use any other algorithms" | https://www.rfc-editor.org/rfc/rfc8725.txt 2.1, 3.1 | [확정] |
| 1 | 약한 대칭 키: "Human-memorizable passwords MUST NOT be directly used as the key to a keyed-MAC algorithm such as 'HS256'." | 같은 문서 2.2, 3.5 | [확정] |
| 1 | 서명 크기(HS256 32바이트, ES256 64바이트, RS256 2048비트 키면 256바이트)와 속도 비교 | 알고리즘의 일반적 성질. 직접 재지 않음 | [확인 필요] (필요하면 dev에서 측정) |
| 3 | "Redis is designed to be accessed by trusted clients inside trusted environments." 포트를 밖에 열면 `FLUSHALL` 하나로 전체 삭제 가능. protected mode(3.2.0부터), 인증은 ACL 권장(6부터) 또는 `requirepass`, `AUTH`를 포함한 명령은 암호화 없이 전송되므로 TLS는 선택 지원 | https://redis.io/docs/latest/operate/oss_and_stack/management/security/ | [확정] |
| 3 | Redis가 메모리·디스크의 값을 스스로 암호화하는지 | 위 문서에 없음 | [확인 필요] (Redis 도입 때 공식 문서 확인) |
| 3 | Spring Session은 `springSessionRepositoryFilter`로 `HttpSession`을 Redis 저장으로 바꾸며 `HttpSession`을 쓰는 코드는 고칠 필요 없음. 사용자별 세션 찾기 같은 기능은 `RedisIndexedSessionRepository` 필요 | https://docs.spring.io/spring-session/reference/configuration/redis.html | [확정] (요약으로 읽음) |
| 6 | 결과 코드를 주소에 붙이는 것의 안전 | 공식 문서의 직접 판정은 없음. 근거는 설계: 코드에 민감한 값이 없고, 서버가 코드로 판단하지 않으며, 돌아갈 주소를 서버가 받지 않음 | [안] → 사용자 조건부 확정("안전하면 이렇게 해줘"). dev 테스트로 확인 |

- 2번의 답은 조사가 아니라 구조에서 나옴: 리프레시 토큰 줄이 브라우저마다 따로(명세 R4 [확정])이므로 다른 기기의 갱신은 서로 다른 줄을 바꿈.

- 3번 후속 질문("암호화해서 redis나 메모리에 두는 건 안전하나?"): OWASP Cryptographic Storage Cheat Sheet — "The best way to protect sensitive information is to not store it in the first place", 열쇠는 자료와 다른 곳에, AES(256비트 권장)와 GCM/CCM. https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html (2026-10-04) [확정]. 적용: 메모리 구현은 암호화하지 않음, Redis로 바꿀 때 민감한 값을 암호화(backlog).

- 2번 후속 질문("보통 다른 서비스들도 이렇게 해?"), 2026-10-04, 요약 도구로 읽음:
  - Supabase: 리프레시 토큰은 한 번만 쓰되 "reuse interval" 기본 10초 안의 재사용은 허용, 그 밖이면 세션 전체 폐기 (https://supabase.com/docs/guides/auth/sessions) [확정]. 클라이언트(auth-js `GoTrueClient.ts`)는 `navigator.locks`로 갱신을 직렬화하고 `BroadcastChannel`로 탭에 알림 (https://github.com/supabase/auth-js) [확정]
  - Okta auth-js: "selecting a single tab to handle the network requests to refresh the tokens and broadcasting to the other tabs", 이유는 "to avoid all tabs sending refresh requests simultaneously" (https://github.com/okta/okta-auth-js README) [확정]
  - Auth0: Reuse Interval 설정 있음, 기본 꺼짐(12절 표). auth0-spa-js의 탭 간 잠금은 FAQ에서 확인 못 함 [확인 필요]
  - "원래 요청을 먼저 다시 보내 본다"는 순서를 다른 서비스가 쓰는지 [확인 필요] (확인할 자료 없음. 우리 구조가 HttpOnly 쿠키라 생긴 순서)

- 7번 후속 질문("탈퇴용으로 따로 두면 카카오/네이버가 승인할까?"), 2026-10-04: 카카오 Redirect URI는 앱 설정에서 등록(심사 언급 없음. 문서의 "10개"는 로그아웃 리다이렉트 URI 한도) https://developers.kakao.com/docs/ko/kakaologin/prerequisite · 네이버 Callback URL은 내 애플리케이션에서 등록, 개수·용도 제한과 재인증의 별도 승인에 관한 문장 없음, 검수 항목은 서비스 내용·로그인 구현 형태·정보 사용·로고와 앱 이름 (devguide.md, verify.md). 등록 가능 개수는 두 제공자 모두 [확인 필요: 콘솔에서 직접 확인].

- 8번 후속 질문("서버 기록이 뭐 로그 이런 거야? db이런데 넣으면 안 되나"), 2026-10-04: OWASP Logging Cheat Sheet — 기록 대상에 "addition or deletion of users", 기록 위치는 파일 시스템·데이터베이스(쓰기 전용 계정 권장)·원격 수집, 제외할 값은 비밀번호·세션 식별 값·접근 토큰, 보관 기간 준수. https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html [확정]. 다른 서비스의 탈퇴 기록 위치는 [확인 필요](자료 없음).

- ADR-0039 초안 검토 중 질문("카카오나 네이버에서 사용자 이름 정보 가져올 수 있나? 나중에 아이디/별명 설정 이런것도 기존 소셜 로그인에 넣을 수 있으려나"), 2026-10-04: 카카오 개인정보 동의항목의 필요 권한 — 닉네임·프로필 사진 "기본 제공", 카카오계정(이메일) "비즈 앱, 테스트 앱", 이름·성별·연령대·생일·전화번호 "동의 단계 설정 권한, 테스트 앱" (https://developers.kakao.com/docs/ko/kakaologin/utilize, 요약으로 읽음) [확정]. 네이버 항목은 2절. 네이버 항목별 추가 조건은 [확인 필요].
