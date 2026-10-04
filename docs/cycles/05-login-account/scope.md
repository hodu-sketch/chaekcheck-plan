# 사이클 05: 로그인·계정 (네이버·카카오 소셜 로그인)

- 시작: 2026-10-01. 사이클 04 회고: `../04-and-search/retro.md`
- 밑그림·근거: `docs/research/member-and-alerts/integration-plan.md`(구조, 사용자 결정 3가지), `outline.md`, `signup-security.md`(공식 문서 확인)
- 이 사이클 문서: `spec.md`(동작 규칙·수용 기준), `research.md`(아래 "먼저 조사할 것" 중 확인한 결과), `flow.md`(화면 흐름)
- 번호 대응: integration-plan의 "05a" = 이 사이클(05), "05b" = 사이클 06 내 도서관·검색 연결, "06 알림" = 사이클 07 (사용자 확인, 2026-10-01)

## 목표 (한 문장)

네이버 또는 카카오 계정으로 chaekcheck에 로그인하고, 로그아웃·탈퇴할 수 있다. 서버에 남는 것은 계정(제공자 + 제공자 쪽 번호)과 동의 기록뿐이다.

## 포함

사용자 선택 (2026-10-01): "공통 + 웹훅 + 이벤트·저장소". `/feature-spec`에서 더 정한 것(사용자, 2026-10-01): 계정 표를 둘로(우리 계정 + 연결된 소셜 계정, 연결 기능은 나중), 로그인 유지는 JWT(짧은 액세스 토큰 + DB 리프레시 토큰, 2026-10-03에 "세션은 DB"에서 바꿈), 탈퇴 전 본인 확인(네이버·카카오 둘 다), 네이버 연결끊기 Callback 포함, 이용약관 동의 포함, 로그인 유지 30일. 자세한 규칙은 `spec.md`.

- 새 모듈 `auth` [안 이름]: Spring Security `oauth2Login`으로 네이버·카카오 provider 등록, 우리 계정 표와 연결된 소셜 계정 표(provider + provider_user_id, UNIQUE), 동의 기록 표
- 로그인 상태 유지: JWT [확정] (사용자, 2026-10-03). 짧은 액세스 토큰 + DB에 저장하는 리프레시 토큰(쓸 때마다 교체, 30일), 둘 다 `Secure`·`HttpOnly`·`SameSite` 쿠키
- 동의 화면(개인정보 보호법 제15조② 고지 4가지 + 이용약관·개인정보 수집·이용·만 14세 이상 확인란)과 이용약관·개인정보 처리방침 페이지(제30조), 문서 버전 기록
- 네이버 연결끊기 Callback 수신 주소: 네이버 쪽에서 동의를 철회하면 같은 삭제 처리 뒤 204
- `GET /api/v1/me`(계정 정보·동의 상태, 비로그인 401 `unauthorized`), `POST /api/v1/auth/signup`(가입 동의. 처음 적은 `POST /api/v1/me/consents`를 바꿈), `POST /api/v1/auth/logout`(처음 적은 `POST /logout`을 바꿈), `DELETE /api/v1/me`(탈퇴) [확정] (사용자 승인, 2026-10-04: 인증 주소를 `/api/v1/auth` 아래에 모음)
- 탈퇴: 가입한 제공자로 본인 확인 → 카카오 `unlink`·네이버 연동 해제 호출 → 계정·소셜 연결·동의 기록 물리 삭제 → 리프레시 토큰 전부 삭제
- 카카오 연결 해제 웹훅 수신 주소: 카카오 쪽에서 연결을 끊으면 같은 삭제 처리 뒤 3초 내 200
- `AccountDeleted` 이벤트 발행 + Spring Modulith 영속 발행 저장소(Liquibase로 표 생성). 이번에는 받는 모듈이 없음. 사이클 06의 `member`가 첫 소비자
- CSRF: Spring 기본 유지, SPA용 `csrf.spa()`. 변경 메서드에 토큰
- 웹: 로그인 버튼(네이버·카카오), 로그인 상태 표시, 설정 창 "계정" 절(로그아웃, 탈퇴), 동의 화면, 처리방침 페이지
- 네이버 사전 검수 준비(검수 항목 충족: 가입 시 별도 비밀번호 요구 없음, 제공 정보 사용처, 브랜딩)와 카카오 앱 설정(처리방침 URL 등록). 검수 신청 자체는 사용자가 함
- 비회원은 지금 기능을 전부 그대로 씀. 기존 검색·조회 API는 바꾸지 않음

## 제외 (backlog.md로 보낸 항목)

- 지역·직접 추가 도서관 저장, `libraryIds` 검색 연결, "내 도서관만" 스위치 → 사이클 06
- 관심 책·알림 → 사이클 07
- 이메일·전화·카카오 메시지 등 연락처 수집 (재동의 필요. 카카오 이메일은 비즈 앱에서 설정하며 개인도 "개인 개발자 비즈 앱"으로 전환 가능: `research.md` 7절)
- Expo 앱 로그인(JWT라서 같은 토큰을 헤더로 보내는 길을 앱 사이클에서 추가: backlog), 여러 대용 세션 공유 저장소(Redis), 관리자 화면, 소속 기관(대학·회사) 자격, 내 서재, 회원 간 기능
- 사이클 04 마무리(전체 수집·가져오기·측정·AC) — backlog "미뤄 둔 사이클 04 마무리 작업"

## 완료 기준 (사용자가 화면에서 확인할 수 있는 것)

- [ ] 검색 화면에서 "네이버로 로그인" / "카카오로 로그인"을 누르면 그 사이트로 갔다가 돌아오고, 처음이면 동의 화면이 먼저 나온다. 동의하지 않으면 계정이 만들어지지 않는다
- [ ] 로그인하면 화면에 로그인 상태가 보이고, 새로고침·브라우저 재시작 뒤에도 유지된다(세션 만료 전까지)
- [ ] 로그아웃하면 상태가 사라지고 `GET /api/v1/me`가 401을 준다
- [ ] 탈퇴하면 계정이 지워지고(DB에 행 없음), 같은 소셜 계정으로 다시 로그인하면 새 계정으로 동의부터 다시 한다
- [ ] 카카오 계정 관리 화면에서 chaekcheck 연결을 끊으면 우리 쪽 계정도 지워진다 (시험 방법 [확인 필요])
- [ ] 처리방침 페이지가 열리고, 카카오 앱 설정에 그 주소가 등록돼 있다
- [ ] 로그인 전과 후 모두 검색·조회가 지금과 똑같이 된다
- [ ] `ModularityTests`(새 모듈 `auth`, 다른 모듈이 `auth`를 부르지 않음), 백엔드 빌드, 웹 테스트·빌드·lint 통과

## 먼저 조사할 것 [확인 필요]

| 항목 | 확인 방법 |
|---|---|
| 네이버·카카오가 PKCE(`code_challenge`)를 받는지 → Spring `requireProofKey` 켤지 | 프로토타입 호출 시험 (`signup-security.md` A2-3, A3-2) |
| 네이버·카카오 연결 끊기 API가 액세스 토큰을 요구하는지 → 토큰을 저장해야 하는지 | 공식 문서 확인 (네이버 devguide `revoke`, 카카오 `/v1/user/unlink` 인증 방식) |
| 네이버 refresh token 유효기간 | 공식 문서에 없음 → 호출 시험 또는 문의 |
| 카카오 연결 해제 웹훅을 로컬에서 시험하는 방법(공개 URL 필요 여부), 요청 검증 방법 | 공식 문서 확인 (kakaologin/callback) |
| 네이버 사전 검수에 서비스 URL이 필요한지(배포 전 검수 가능한지) | 공식 문서 확인 (verify.md), 사용자에게 질문 |
| Spring Security(Boot 4.1) `oauth2Login` 커스텀 provider 설정, `csrf.spa()`, 세션 고정 보호 | 공식 문서 확인 (docs.spring.io) — `signup-security.md` A3-1~3에 있음, 버전만 재확인 |
| Spring Session JDBC의 Boot 4 호환·표 정의 vs 메모리 세션(재시작 시 로그아웃) | 공식 문서 확인, 사용자에게 질문 |
| Spring Modulith 영속 발행 저장소(JDBC)의 표 정의를 Liquibase로 만드는 방법 | 공식 문서 확인 (spring-modulith events) |
| 만 14세 미만 정책("만 14세 이상" 확인란 [안]) | 사용자에게 질문 |
| 운영자가 「소상공인기본법」상 소상공인인지(보호책임자 기재 방식) | 사용자에게 질문 |
| 처리방침에 넣을 항목과 문구 | 공식 문서 확인 (개인정보 보호법 제30조, 시행령 제31조 — `signup-security.md` C8-1·C8-3) |

## 슬라이스 선택 기록

- ICE 점수는 매기지 않음. 사이클은 사용자가 정함.
- 순서 근거 (사용자, 2026-10-01): "나는 다음으로는 '회원'을 생각 중이야", "그 다음에 '알림'기능". 자르기: integration-plan 5절 안 Y(로그인·계정 → 내 도서관·검색 연결 → 알림) 선택 [이유 미확인]. 포함 범위 "공통 + 웹훅 + 이벤트·저장소" 선택 [이유 미확인].
- 회원의 목적 (사용자): "회원이 있는 이유는 직장/거주지 지역이라던가 알아서 도서관 매핑해주기 위함이야" — 이 사이클은 그 앞 단계(계정)만.

## 결정 기록 (사이클 시작 때)

- [ADR-0036](../../adr/0036-auth-and-member-modules.md) 계정(`auth`)과 회원 자료(`member`)를 다른 모듈로 둠 — 사용자 선택 2026-10-01
- [ADR-0037](../../adr/0037-search-unaware-of-member-library-ids.md) 검색 모듈은 회원을 모르고, 웹이 "내 도서관"을 파라미터로 넘김 — 사용자 선택 2026-10-01 (구현은 사이클 06)

`design-delta.md`를 쓸 때 이 두 ADR을 "결정 기록"에 옮깁니다.

## 영향 받을 모듈 [안]

- 새 모듈 `auth` (스키마 `auth`: `account`, `account_consent`, 이벤트 발행 저장소 표). 다른 모듈에 의존하지 않음
- 웹: 로그인 버튼, 상태 표시, 설정 창 계정 절, 동의 화면, 처리방침 페이지, CSRF 토큰 헤더
- 루트 `ApiExceptionHandler`: 401 `unauthorized`(403 `forbidden`은 쓸 일이 있으면)
- 새 의존성(사용자 승인 필요): `spring-boot-starter-security`, `spring-boot-starter-oauth2-client`, Spring Modulith events JDBC 저장소, (선택) Spring Session JDBC
- 바뀌지 않는 것: `region`, `library`, `catalog`, `availability`, `fetch-service/`, 기존 API

## 설계 단계에서 바뀐 것 (2026-10-04)

이 문서의 위쪽 문장 가운데 설계 단계의 사용자 결정으로 바뀐 것입니다. 지금의 내용은 `design-delta.md`가 기준입니다.

| 위에 적힌 것 | 바뀐 것 | 근거 |
|---|---|---|
| 표: `account`, `account_consent` / "provider + provider_user_id" | `auth.account`, `auth.login_method(method, subject)`, `auth.account_consent`, `auth.refresh_token` | ADR-0038, ADR-0039 |
| 이벤트 발행 저장소 표를 스키마 `auth`에 | 별도 스키마 `modulith`, 완료 기록은 삭제 | ADR-0041 |
| 의존성 `spring-boot-starter-oauth2-client`, (선택) Spring Session JDBC | `spring-boot-starter-security`, `-security-oauth2-client`, `-security-oauth2-resource-server`, `spring-modulith-starter-jdbc`. Spring Session JDBC는 쓰지 않음 | `architect-proposal.md` 검토 결과 11, ADR-0038 |
| 401을 루트 `ApiExceptionHandler`에서 처리 | 보안 필터 단계의 401/403은 `auth`의 `AuthenticationEntryPoint`·`AccessDeniedHandler`가 ProblemDetail로 직접 씀 | `design-delta.md` 모듈 표 |
| 완료 기준의 "(세션 만료 전까지)" | 로그인한 때부터 30일(JWT + 리프레시 토큰) | ADR-0038 |
| 설정 창 "계정" 절(로그아웃, 탈퇴) | 로그인 후에만 보이고 "탈퇴" 하나만 둠. 로그인·로그아웃은 화면 위 버튼으로만 | `flow.md` S4 (사용자 제안, 2026-10-04) |
| (포함에 없던 것) | 운영 웹 서버 설정 예시와 화면 쪽 보안 헤더, 서버 여러 대 대비(임시 값을 `HttpSession`으로만) | 사용자 승인: ADR-0042("이것도 지금에서 하는 게 맞다고 보는데 화면에서 보안적인 구성"), ADR-0040 |
