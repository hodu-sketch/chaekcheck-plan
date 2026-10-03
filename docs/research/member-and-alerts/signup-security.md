# 회원가입·로그인 보안과 개인정보 — 공식 문서 확인 결과

- 확인일: 2026-10-01 (chaekcheck-plan 세션, 서브에이전트가 공식 문서를 열어 확인. 본문의 "확인 날짜"는 모두 2026-10-01)
- 대상: 네이버·카카오 소셜 로그인만, 비밀번호 없음. 저장하는 것은 소셜 계정 식별자 + 거주지·직장 시군구 코드 + 내 도서관 목록 (`outline.md` 2.1).
- 성격: 사이클 밖 준비 자료. 회원 사이클의 `design-delta.md`·ADR이 여기서 값을 골라 확정합니다.
- 이어진 조사 (사이클 05, 2026-10-01): `docs/cycles/05-login-account/research.md` — PKCE(네이버 OIDC에 있음, 카카오 문서에 없음), 네이버 제공 항목, 네이버 연결끊기 Callback 원문, 버튼 지침, 처리방침 작성지침·보호책임자. 카카오 연결 끊기(어드민 키), 재인증 파라미터, Spring Session·Modulith 표는 같은 폴더 `spec.md` "데이터 출처"
- 관련: 회원·알림 밑그림 `outline.md`(같은 폴더. 2.5절 "사이클에서 정할 것"이 이 문서 3절을 가리킴), `docs/backlog.md` "회원" 절, 문서 색인 `docs/reference-index.md` 5절
- 태그: [확정] = 공식 문서에서 확인. [확인 필요] = 못 찾았거나 시험이 필요.
- 쉬운 설명: 이 문서를 풀어 쓴 페이지를 2026-10-01 대화에서 보냄(`signup-security-easy.html`, scratchpad).

## 1. 결론

1. **최소 구현**: Spring Security `oauth2Login()`(authorization code)으로 네이버·카카오를 커스텀 provider로 등록. 서버 세션(HttpSession) + Spring 기본 CSRF(SPA면 `csrf.spa()`) + 세션 쿠키 `Secure`/`HttpOnly`/`SameSite`. `state`는 Spring이 자동 처리하고 두 IdP가 요구·권장. PKCE는 confidential client에도 강력 권장(RFC 9700)이나 네이버·카카오 문서에 PKCE 언급이 없음 [확인 필요: 호출 시험].
2. **회원 식별 키는 `(provider, provider_user_id)`** 만. 카카오 회원번호·네이버 id 모두 "앱별로 다른 값". 이메일은 바뀔 수 있어 식별자로 쓰지 말 것(카카오 공식). 두 IdP 사이 동일인 판별은 불가.
3. **법적 최소 의무**: 수집·이용 동의(제15조② 고지 4가지), 최소 수집(제16조, 입증책임은 처리자), 처리방침 게시(제30조 + 시행령 제31조), 안전조치(제29조 → 고시 제2026-9호), 탈퇴 시 지체 없는 파기(제21조). 소상공인이면 보호책임자 별도 지정 없이 대표자가 책임자(제31조②). 만 14세 미만은 법정대리인 동의(제22조의2) → 연령을 안 받으면 확인 불가하므로 정책 결정 필요.
4. **정식 오픈 전 검수**: 네이버는 검수 전 등록된 테스트 ID만 로그인 가능. 카카오는 이메일 동의항목이 비즈 앱(사업자 정보) 전용 → 개인 개발자·비영리는 이메일을 못 받을 수 있음. **알림 사이클(연락처)에 직접 영향**.
5. **가장 큰 위험**: (a) 탈퇴/연결 끊기 누락 — 카카오는 탈퇴 시 연결 끊기 API 호출 + 즉시 파기, 연결 해제 웹훅에 3초 내 200 응답. (b) 유출 시 과징금(제64조의2: 매출액 3% 또는 매출 없으면 20억 이하)과 법정손해배상(제39조의2: 300만원 이하). "안전조치를 다한 경우"는 과징금 제외 → 고시 준수 증빙이 방어선.

## 2. 항목별 확인 표

| # | 주제 | 확인한 사실 | 출처 | 태그 |
|---|---|---|---|---|
| A1-1 | 네이버 로그인 흐름 | OAuth 2.0 authorization code. 인증 요청 필수 `response_type=code, client_id, redirect_uri, state`. state는 CSRF 방지용으로 필수. 엔드포인트 `nid.naver.com/oauth2.0/authorize`, `/oauth2.0/token`, 프로필 `openapi.naver.com/v1/nid/me` | https://github.com/naver/naver-openapi-guide/blob/master/ko/login/devguide/devguide.md , …/ko/login/api/api.md (네이버 공식 GitHub 원본. developers.naver.com 사이트는 도구에서 접속 차단) | [확정] |
| A1-2 | 네이버 제공 항목 | 필수: 이용자 식별자(id, 64자 이내 BASE64), 닉네임. 추가(거부 가능): 이름, 이메일, 성별, 연령대, 생일, 출생연도, 프로필 이미지, 휴대전화. 항목은 앱 API 설정에서 선택 | 위 devguide.md, https://github.com/naver/naver-openapi-guide/blob/master/ko/login/profile/profile.md | [확정] |
| A1-3 | 네이버 id 규칙 | 네이버 아이디마다 고유한 일련번호. "같은 네이버 회원이라도 애플리케이션이 다르면 id값이 다름", 앱 간 비공유, 외부 노출 금지 | profile.md, devguide.md | [확정] |
| A1-4 | 네이버 토큰 수명 | access_token `expires_in` 예시 3600초. refresh_token 유효기간 수치는 문서에 없음 | devguide.md, api.md | access [확정] / refresh [확인 필요: 호출 시험 또는 문의] |
| A1-5 | 네이버 연동 해제·검수 | 연동 해제 API, 토큰 폐기 `/oauth2.0/revoke`. "정식 오픈하려면 반드시 사전 검수 통과", 검수 전엔 등록 테스터만. 검수 항목: 서비스 내용, 로그인 흐름(가입 시 별도 비밀번호 요구 금지), 제공 정보 사용처, 브랜딩 | devguide.md, https://github.com/naver/naver-openapi-guide/blob/master/ko/login/verify/verify.md | [확정] |
| A2-1 | 카카오 회원번호 | `id` = 앱별 사용자 고유 ID, 불변, 식별자로 권장. 이메일은 바뀔 수 있어 식별·동일인 판단에 쓰지 말 것. 이메일 쓸 때 `is_email_valid`/`is_email_verified` 확인 | https://developers.kakao.com/docs/latest/ko/kakaologin/common , …/kakaologin/utilize | [확정] |
| A2-2 | 카카오 토큰 수명 | 액세스: REST 6시간, JavaScript 2시간, Android/iOS 12시간. 리프레시: 2달, 만료 1달 남은 시점부터 갱신 가능 | …/kakaologin/common , …/kakaologin/rest-api | [확정] |
| A2-3 | 카카오 인가 파라미터 | `GET https://kauth.kakao.com/oauth/authorize` (`client_id, redirect_uri, response_type=code`). `state` 선택이나 권장. PKCE 언급 없음 | …/kakaologin/rest-api | state [확정] / PKCE [확인 필요: 호출 시험] |
| A2-4 | 카카오 동의항목·비즈 앱 | 이메일(`account_email`) 동의 설정은 비즈 앱·테스트 앱만. 일부 항목은 추가 권한 신청·검수(3~5 영업일). 앱에 개인정보 처리방침 URL 등록 필요 | https://developers.kakao.com/docs/latest/ko/kakaologin/prerequisite , …/utilize | [확정] (비즈 앱 전환에 사업자등록번호가 필요한지 [확인 필요]: 앱 설정 문서 404) |
| A2-5 | 카카오 연결 끊기·탈퇴 의무 | 탈퇴 시 `POST https://kapi.kakao.com/v1/user/unlink` 호출 포함. 운영정책 제1조②: 탈퇴 시 모든 개인정보 파기, 24시간 내 미가입 시 파기, 카카오 제공 개인정보 송수신 암호화 | …/kakaologin/common , https://developers.kakao.com/terms/ko/site-policies (시행 2026-04-20) | [확정] |
| A2-6 | 카카오 연결 해제 웹훅 | 사용자가 카카오 쪽에서 연결 끊기·계정 탈퇴 시 발송. 페이로드 `app_id, user_id, referrer_type`. 서비스는 처리 뒤 **3초 내 HTTP 200** | https://developers.kakao.com/docs/latest/ko/kakaologin/callback | [확정] |
| A3-1 | Spring Security OAuth2 Login | `oauth2Login()` = Authorization Code Grant. 커스텀 provider 설정 `spring.security.oauth2.client.registration.{id}.*` + `provider.{id}.{authorization-uri, token-uri, user-info-uri, user-name-attribute}`. 네이버·카카오는 `CommonOAuth2Provider`에 없음. 네이버 응답은 `response` 객체로 중첩 → `OAuth2UserService` 커스터마이즈 필요 | https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html , …/login/advanced.html | [확정] |
| A3-2 | Spring PKCE·state | confidential client는 `requireProofKey=true`로 PKCE 켤 수 있음(provider 미지원이면 끔). state는 자동 생성·검증 | https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorization-grants.html | [확정] |
| A3-3 | Spring CSRF·세션 | CSRF 기본 켜짐. SPA는 `csrf.spa()`(쿠키 `XSRF-TOKEN`, 헤더 `X-XSRF-TOKEN`). CSRF 켜진 상태에서 로그아웃은 POST만. 세션 고정 보호 기본 `changeSessionId`. `maximumSessions(1)` 가능 | https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html , …/servlet/authentication/session-management.html | [확정] |
| B4-1 | OWASP 세션 관리 | 세션 ID 엔트로피 최소 64비트(자체 생성 시 128비트 CSPRNG). 기본 이름(JSESSIONID) 바꾸기. 쿠키 `Secure`, `HttpOnly`, `SameSite=Strict`(선호) 또는 `Lax`, `__Host-` 접두사, Domain·Expires 미설정. 로그인 시 세션 ID 재발급. idle 저위험 15~30분, absolute 4~8시간 예시. 로그아웃 시 `Clear-Site-Data` | https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html | [확정] |
| B4-2 | OWASP CSRF | Synchronizer token 우선. 프레임워크 내장 방어 먼저. SameSite는 보조이지 대체가 아님. 로그인 CSRF도 별도 대응 | https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html | [확정] |
| B4-3 | OWASP OAuth2 | "모든 client는 Authorization Code + PKCE". state(또는 OIDC nonce), redirect URI 정확 일치, implicit grant 금지, refresh token은 sender-constrained 또는 rotation | https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html | [확정] |
| B4-4 | OWASP 인증·헤더 | 계정 열거 방지 일반 오류. 민감 작업 전 재인증. 헤더: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, 민감 응답 `Cache-Control: no-store` | https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html , …/HTTP_Headers_Cheat_Sheet.html | [확정] |
| B5 | OWASP ASVS 5.0.0 (2025-05-30) L1 | V7 세션: 7.2.1 검증은 백엔드에서, 7.2.3 토큰 CSPRNG 128비트 이상, 7.2.4 인증 시 새 세션·기존 종료, 7.4.2 계정 삭제 시 모든 세션 종료. V8 인가: 8.2.2 데이터 단위(IDOR). V14: 14.2.1 민감 데이터 URL 금지 | https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/en | [확정] |
| B6-1 | NIST SP 800-63B Rev.4 (2025-08-26 최종) | AAL1: 재인증 30일 이내 SHOULD. AAL2: 24시간 / 비활성 1시간. 세션 비밀은 approved RBG, 최소 64비트. 쿠키 `Secure`·`HttpOnly` SHOULD, `SameSite` 권장 | https://pages.nist.gov/800-63-4/sp800-63b.html | [확정] (절 번호 [확인 필요]) |
| B6-2 | NIST SP 800-63C Rev.4 | 3.4: 연합 식별자는 RP에서 한 subscriber에만. IdP 간 식별자 동일성 가정 금지. 3.10: 최소 데이터만 교환 | https://pages.nist.gov/800-63-4/sp800-63c.html | [확정] |
| B7-1 | RFC 6749 | §10.12 state SHOULD. §4.1.2 authorization code 1회 사용·최대 10분 권장. §10.4 refresh token 기밀 유지 | https://www.rfc-editor.org/rfc/rfc6749.html | [확정] |
| B7-2 | RFC 7636 | PKCE `S256` MUST(가능하면), code_verifier 43~128자 | https://www.rfc-editor.org/rfc/rfc7636.html | [확정] |
| B7-3 | RFC 9700 / BCP 240 (2025-01) | public client PKCE MUST, confidential도 강력 권장. redirect URI 정확 일치. implicit SHOULD NOT. PKCE 미지원 AS면 세션에 묶인 state | https://www.rfc-editor.org/rfc/rfc9700.html | [확정] |
| C8-1 | 개인정보 보호법 현행 | [시행 2026-09-11] [법률 제21445호]. 제2조1호나목(결합 용이한 정보도 개인정보). 제15조① 동의 수집, ② 고지 4가지(목적, 항목, 보유·이용 기간, 거부권·불이익). 제16조① 최소 수집·입증책임은 처리자, ③ 선택항목 미동의로 서비스 거부 금지. 제21조 지체 없이 파기·복구 불가. 제22조의2 만 14세 미만 법정대리인 동의. 제29조 안전조치. 제30조 처리방침 항목·공개. 제31조 보호책임자(단서: 소상공인은 미지정 가능, 그 경우 대표자). 제6장(정보통신서비스 제공자 특례) 삭제 <2023-03-14> | https://www.law.go.kr/법령/개인정보보호법 | [확정] |
| C8-2 | 손해배상·과징금 | 제39조 손해배상(고의·중과실 유출 5배 이내). 제39조의2 유출 시 300만원 이하 법정손해배상(2026-03-10 개정). 제64조의2 과징금: 매출액 3% 이하, 매출 없으면 20억 이하 — "제29조 안전조치를 다한 경우" 제외. 보호책임자 미지정 과태료 3천만원 이하 | law.go.kr, https://www.easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1257&ccfNo=3&cciNo=2&cnpClsNo=2 | [확정] |
| C8-3 | 시행령 | [시행 2026-09-11] [대통령령 제36671호]. 제16조 전자파일 복원 불가 삭제. 제17조 동의 4요건. 제17조의2 법정대리인 동의 확인 7가지 방법. 제31조 처리방침 추가 항목·지속 게재. 제32조① 소상공인 = 「소상공인기본법」 제2조① | https://www.law.go.kr/법령/개인정보보호법시행령 | [확정] |
| C8-4 | 시군구 코드의 개인정보 해당성 | 계정과 결합된 시군구 코드는 제2조1호나목상 개인정보로 취급하는 것이 안전. PIPC의 시군구 코드 명시 해석례는 못 찾음 | law.go.kr 제2조; https://www.privacy.go.kr/front/bbs/bbsView.do?bbsNo=BBSMSTR_000000000049&bbscttNo=20569 | [확인 필요: 해석례 PDF 원문 또는 PIPC 문의] |
| C9 | 개인정보의 안전성 확보조치 기준 | [시행 2026-07-01] [개인정보보호위원회고시 제2026-9호]. 제4조① 내부 관리계획 — 1만명 미만 정보주체 처리 소상공인·개인·단체는 생략 가능. 제5조 접근권한 최소, 변경 기록 3년, 인증 실패 제한. 제6조② 외부 접속 시 안전한 인증수단, ④ 미사용 자동 차단. 제7조① 인증정보 암호화(비밀번호 일방향), ② 고유식별정보·계좌 등 암호화, ④ 인터넷 구간 암호화. 제8조① 접속기록 1년 이상(5만명 이상·고유식별·민감정보면 2년). 제13조 파기 방법 | https://www.law.go.kr/행정규칙/개인정보의안전성확보조치기준 | [확정] |
| C10-1 | 정보통신망법 잔존 의무 | 개인정보 조항(제22조~제32조의4 등)은 삭제 <2020-02-04>. 남은 것: 제22조의2 앱 접근권한, 제50조 영리목적 광고성 정보 전송 제한 등. 회원 개인정보 처리는 개인정보 보호법으로 일원화 | https://www.law.go.kr/법령/정보통신망이용촉진및정보보호등에관한법률 | [확정] |
| C10-2 | 보호책임자(1인 운영) | 소상공인이면 미지정 가능, 대표자가 책임자. 처리방침에 성명·연락처 기재 | law.go.kr 법·시행령, easylaw | [확정] (비영리 개인 운영이 소상공인인지 [확인 필요: 사용자에게 사업자 형태 질문]) |

## 3. chaekcheck 회원 사이클에서 지켜야 할 것 (표의 행 번호 참조)

1. `member` 식별 키는 `(provider, provider_user_id)` UNIQUE. 이메일·닉네임을 식별자나 병합 기준으로 쓰지 않음 (A1-3, A2-1, B6-2)
2. 저장 항목은 provider, provider_user_id, 거주지·직장 시군구 코드, 내 도서관, 생성·탈퇴 시각으로 제한. 요청 scope도 최소 (C8-1 제16조, B7-3)
3. 시군구 코드는 계정과 결합되므로 개인정보로 취급 → 처리방침·동의·파기 대상 (C8-4)
4. 가입 화면에서 제15조② 4가지 고지 + 동의, 시행령 제17조 4요건 문구. 처리방침(제30조 + 시행령 제31조)을 상시 게재하고 카카오 앱 설정에 URL 등록 (C8-1, C8-3, A2-4)
5. 탈퇴: 카카오 `/v1/user/unlink`·네이버 연동 해제/`revoke` 호출 → 회원 행·내 도서관·지역 코드 즉시 물리 삭제 → 세션 전부 종료. 소프트 삭제는 법령 근거 있을 때만 (A1-5, A2-5, C8-1 제21조, C9 제13조, B5 7.4.2)
6. 카카오 연결 해제 웹훅 엔드포인트: `user_id`로 회원을 찾아 5번과 같이 파기, 3초 내 200. 미가입 임시 데이터는 24시간 내 파기 (A2-6, A2-5)
7. Spring Security `oauth2Login` + provider 프로퍼티. 네이버는 중첩 `response.id`라 커스텀 `OAuth2UserService`. `requireProofKey`는 두 IdP의 PKCE 지원을 호출 시험 뒤 결정. state는 끄지 않음 (A3-1, A3-2, A2-3)
8. 세션: 서버 세션, 로그인 시 세션 ID 재발급(기본), 쿠키 `Secure; HttpOnly; SameSite=Lax`(또는 Strict) + `__Host-`·Domain 미설정, JSESSIONID 이름 변경, idle 30분 이내·절대 타임아웃 [안: 값은 사이클에서], 로그아웃 POST + `Clear-Site-Data` (B4-1, B5 V7, B6-1, A3-3)
9. CSRF는 Spring 기본 유지, SPA용 `csrf.spa()`. 세션·토큰을 URL에 싣지 않음 (A3-3, B4-2, B5 14.2.1)
10. 내 도서관·지역 코드 조회·수정 API는 현재 세션의 member id로만(IDOR 방지). 클라이언트가 보낸 member id를 믿지 않음 (B5 8.2.2)
11. 정식 오픈 전 네이버 사전 검수, 카카오 동의항목 검수. 이메일이 필요해지는 알림 사이클 전에 카카오 비즈 앱 전환 가능 여부 확인 (A1-5, A2-4)
12. 안전조치 최소: 운영자 계정별 발급·안전한 인증수단, DB 접속 IP 제한, 운영자 접속기록 1년 이상, TLS, 악성코드 방지. 1만명 미만 소상공인이면 내부 관리계획 생략 가능. 비밀번호를 저장하지 않으므로 제7조① 일방향 암호화 의무 없음 (C9)
13. 보호책임자: 소상공인이면 대표자(운영자)가 자동 책임자, 처리방침에 성명·연락처. 해당 여부는 사용자에게 질문 (C10-2)
14. 만 14세 미만 정책: 연령을 받지 않으면 법정대리인 동의 확인 불가 → "만 14세 이상만 가입" 확인란 [안] 등을 사이클에서 결정 (C8-1 제22조의2, C8-3 제17조의2)
15. 알림 사이클 대비: 이메일·전화·카카오 메시지 채널을 저장하면 수집 항목·목적이 바뀌어 재동의. 카카오 이메일은 `is_email_verified`·`is_email_valid` 확인. 광고성 정보(정보통신망법 제50조) 해당 여부는 알림 사이클에서 검토 (C8-1, A2-1, C10-1)

## 4. 검증 못 한 것

- developers.naver.com 사이트 자체는 도구에서 열지 못해 네이버 공식 GitHub(`naver/naver-openapi-guide`)로 확인. 사이트 최신본과 차이는 사용자가 브라우저로 1회 확인 권장
- 네이버 refresh_token 유효기간 수치 → 호출 시험 또는 네이버 문의
- 네이버·카카오 PKCE(`code_challenge`) 지원 → 프로토타입으로 시험
- 카카오 비즈 앱 전환 조건(사업자등록번호 필수 여부, 개인·비영리 가능 여부) → 카카오디벨로퍼스 앱 관리 화면에서 확인
- 시군구 코드의 개인정보 해당성에 대한 PIPC 명시 해석 → 해석례 PDF 원문 또는 PIPC 문의
- 비영리 1인 운영이 「소상공인기본법」상 소상공인인지 → 사용자에게 사업자 형태 질문
- NIST 800-63B Rev.4 AAL별 절 번호(값은 일치)
- 정보통신망법 제50조(광고성 정보)의 알림 적용 여부 → 알림 사이클
