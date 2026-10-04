# 사이클 05 회고: 로그인·계정

- 작성: 2026-10-04. 근거: dev `docs/plan-feedback.md` "사이클 05" 절(2026-10-04 기록), dev 코드 구조(`backend/src/main/java/com/chaekcheck/{auth,region,library,catalog,availability}`)와 Modulith 문서 출력(`backend/build/spring-modulith-docs/module-*.puml` 5개), 이 사이클 `design-delta.md`·`handoff.md`
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`으로 표시합니다.
- dev가 구현을 마친 범위: 백엔드 1~10단계, 웹 11~16단계, 17단계(실제 제공자 확인)는 **카카오만** 끝남. 네이버 실제 확인은 키를 받은 뒤.

## 계획대로 된 것

- 모듈 다섯 개(`auth`, `region`, `library`, `catalog`, `availability`)가 `docs/current/module-map.md`와 같음. `auth`는 다른 모듈에 의존하지 않고, `ModularityTests` 통과 (dev 기록).
- 표 네 개(`auth.account`, `auth.login_method`, `auth.account_consent`, `auth.refresh_token`)와 `modulith.event_publication`. `JdbcClient`로 접근(엔티티 없음).
- JWT 액세스 15분 + DB 리프레시 30일(쓸 때마다 교체, 동시 갱신은 `FOR UPDATE`로 한쪽만 성공), 로그아웃, 가입·가입 취소·버려진 가입 대기 처리, 탈퇴(재인증 5분), 카카오 연결 해제 웹훅, 네이버 연결끊기 Callback, 하루 한 번 작업 둘(카카오 연결 대조, 1년 미로그인 정리).
- 계정 삭제 한 곳(`AccountDeletion`) + `AccountDeleted` 이벤트 + 발행 저장소. 이번 사이클에는 받는 곳이 서버 기록 listener 하나뿐이고, 사이클 06 이후의 `member`가 첫 실제 소비자.
- 웹: 로그인 창(켜진 제공자만), 로그인·로그아웃 버튼, `/signup`, `/auth/complete`, 설정 "계정" 절과 탈퇴, `/terms`, `/privacy`, 운영 웹 서버(nginx) 설정 예시와 보안 헤더·CSP.
- 로그인을 끄면 사이클 04와 같음(AC-21, 키 없이 시작, 로그인 요소 없음). 제공자별 켜고 끄기(AC-22)도 구현.
- 실제 카카오로 확인한 것(2026-10-04): AC-2, 3, 4, 6(새로고침·브라우저 재시작·서버 재시작), 7, 9, 11, 12.

## 달라진 것과 이유

| 계획 | 실제 | 이유 |
|---|---|---|
| `oauth2ResourceServer().jwt()` + 직접 만든 토큰 해석기 | `BearerTokenAuthenticationFilter`를 직접 등록 | 그 설정이 "토큰을 찾은 요청"을 CSRF 검사에서 자동으로 빼는데, 우리 토큰은 브라우저가 알아서 붙이는 쿠키라 변경 요청이 CSRF 없이 통과함. dev 리뷰에서 발견하고 테스트로 확인(제약 C4 "변경 메서드는 모두 CSRF"를 지키기 위함). 사용자 말은 없음 [이유 미확인: dev가 정함] |
| 웹이 켜짐·꺼짐을 아는 방법 미정 | `GET /api/v1/me`의 응답으로 판단: 404 꺼짐, 401 켜짐·로그인 전, 200 로그인함 | 사용자가 dev가 보여 준 안 중 추천안을 고름(2026-10-04) |
| 꺼짐일 때 표를 만들지 말지 미정 | `auth`·`modulith` 표를 항상 만듦 | 사용자가 추천안을 고름(2026-10-04). dev 설명: 엔티티가 있으면 `ddl-auto: validate`가 표를 검사 |
| (설계에 없음) 웹이 켜진 제공자를 아는 방법 | `GET /api/v1/auth/providers` 공개 API | 사용자 결정(2026-10-04): dev가 안 셋(공개 API / `/api/v1/me` 401 본문 / 웹 빌드 값)을 보여 줌 → "공개 API 하나" |
| 가입 대기 10분을 세션 유휴 시간으로 | 제공자 로그인 시각부터 10분(`pending-signup-ttl`) | dev 보안 리뷰(오래 열어 둔 탭이 탈퇴한 계정을 새 로그인 없이 다시 만들 수 없게) [이유 미확인: dev가 정함] |
| (설계에 없음) 하루 한 번 작업의 안전장치 | 카카오 연결 목록이 비어 있으면 삭제하지 않고 경고만 남김 | 어드민 키·앱이 잘못돼도 빈 목록이 올 수 있고 계정 삭제는 되돌릴 수 없어서(dev). 사용자 승인(2026-10-04, 캔버스 항목 6) |
| PKCE | 카카오는 끔(문서에 없음), 네이버는 **지금 끔**(실제 호출 시험 뒤 받으면 켬) | 가짜 응답만으로는 확인할 수 없음. 네이버 실제 확인 때 정함 |
| 네이버 토큰 요청에 `state` | 보냄 | 공식 문서가 토큰 요청 파라미터로 적음(Spring 기본은 보내지 않음) |
| 시작 가능한 이름 | `naver`, `kakao`만. 그 밖(`google`, `naver-reauth` 등)은 404 | dev 보안 리뷰: 등록에 없는 이름은 Spring 기본 동작이 500 + 오류 기록이었음 |
| 재인증 콜백 실패 코드 | 로그인과 같은 `login_expired`, `login_state_mismatch` 임시 사용 | 결과 코드 표에 탈퇴용 코드가 없어서 dev가 임시로 정함. 사용자 미승인(2026-10-04: "탈퇴 전용 코드 있어야 할 것 같아") → 사이클 06 "사이클 05 보완"에서 정함 |
| 토큰 확인 중 DB 오류 | 401이 아니라 500 `internal_error` | 401이면 웹이 로그인을 버림 [이유 미확인: dev]. 사용자 승인(2026-10-04) |
| CSRF 아닌 403 | `forbidden`(지금은 나오지 않음) | 사용자 승인(2026-10-04) |
| 로그인 성공 뒤 우리 쪽 오류 | 돌아오는 주소에서 500, 전용 결과 코드 없음 | 사용자 승인(2026-10-04: 새 코드를 만드는 다른 선택은 고르지 않음) |
| 이벤트 발행 저장소 자동 생성 설정 | `spring.modulith.events.jdbc.schema-initialization.enabled=false` 명시 | Modulith 문서 표(기본 `true`)와 2.1.1 jar 메타데이터(`false`)가 달라서, Liquibase 밖에서 표를 만들지 않게 명시 |
| 테스트 DB 연결 | `application-test.yml`에서 연결 풀을 4로 줄임 | 켜짐·꺼짐 테스트 설정이 늘어 컨텍스트마다 연결을 잡아 100개를 넘음(`too many clients`) |

## 새로 알게 된 제약

- Spring Boot 4.1에서 `@WebMvcTest` 조각 테스트는 `spring-boot-security-test`가 classpath에 있을 때만 Security를 넣음. 켜짐 동작은 전체 컨텍스트 테스트로 확인.
- Spring의 세션 인가 요청 저장소는 "저장된 요청 없음"과 "`state` 다름"을 구분하지 않음 → 저장소를 감싸서 `login_expired` / `login_state_mismatch`로 나눔(state가 다를 때는 저장된 요청을 지우지 않음). `api.md`의 [확인 필요] 해소.
- `XSRF-TOKEN` 쿠키는 `Path=/`, `Secure`, `SameSite=Lax`, `HttpOnly` 없음. Safari는 `http://localhost`에서 `Secure` 쿠키를 받지 않음(개발 환경만의 문제).
- 카카오 호출 허용 IP를 비워 두어도 토큰 교환·사용자 정보·연결 끊기가 됨(`-401` 없음, 2026-10-04). `research.md` 14절의 [확인 필요] 해소.
- 카카오 연결 해제 웹훅이 GET만 보내는 것은 아님(문서상 GET/POST). 설계대로 POST만 받음. 콘솔에서 POST를 고를 수 있는지는 웹훅 등록 때 확인 [확인 필요].
- `modulith` 스키마 표가 없으면 종료 때 WARN이 남음(표를 항상 만들기로 해서 사라짐).
- 액세스 토큰은 계정이 지워진 뒤에도 만료(15분)까지 다른 모듈 API에서 통과함(ADR-0038의 받아들인 한계). 단 `/api/v1/me/**` 밖 경로에만 해당함: `/api/v1/me/**`는 요청마다 계정을 확인함(dev `AccountJwtAuthenticationConverter`, 사이클 06 설계 검토). 사이클 06의 `member`(지금은 `mylibrary`, ADR-0048)가 계정 번호로 줄을 만들 때 계정 존재를 확인해야 함.
- 제공자 끊기 뒤 우리 삭제가 실패하면 계정은 남고 제공자 연결만 끊김(다시 로그인하면 됨).
- 실패한 이벤트 listener의 남은 기록을 다시 보내는 방법은 정하지 않음 [확인 필요: 받는 쪽이 생길 때(사이클 06 이후)].
- 가끔 실패하는 가짜 시계 테스트가 있음(`CaffeineSearchPageCacheTests.loadsAgainAfterThreeMinutes`, 이번 변경과 무관).

## 확인하지 못한 것(남은 일)

- 네이버 실제 확인(키 대기): PKCE, 취소 `error` 값, 재인증 등록 방식(콘솔이 한 줄만 받는지는 다음 확인에서). 이것이 이번 사이클 마감 조건이라 17단계는 "카카오만 끝남".
- AC-10(다른 계정으로 재인증)은 자동 테스트로만(사용자에게 다른 카카오 계정 없음).
- AC-6의 15분 뒤 자동 갱신(실제 브라우저)은 하지 않음. 사용자가 나중에 알려주기로 함(2026-10-04: "15분 아깝다").
- AC-2 세 칸 체크, AC-4 보던 주소 복귀, AC-17 켜짐 검색: 사용자가 실제 화면에서 확인했다고 승인(2026-10-04, 캔버스 항목 7~9).
- 사용자가 할 일: 카카오 앱 ID를 `.env`의 `KAKAO_APP_ID`에 넣기, 약관·처리방침 문구 확인과 시행 날짜 정하기(지금 `2026-10-04`는 임시 값, 화면에 "검토 전 문구" 표시), 배포 주소(`AUTH_PUBLIC_BASE_URL`)와 카카오 콘솔 등록.

## Modulith 문서와 `docs/current/` 비교

- `module-auth.puml` 포함 5개 모듈 문서가 생성됨. `docs/current/module-map.md`의 모듈·의존 방향(`auth`는 아무 모듈도 부르지 않음)과 같음. 차이 없음.
- 이번 회고에서 `docs/current/` 네 문서(`api.md`, `data-model.md`, `flows.md`, `module-map.md`)의 "설계됨(미구현, 사이클 05)"를 "구현됨"으로 고침. `api.md`에는 `GET /api/v1/auth/providers`, `forbidden`, DB 오류 500, 로그인 성공 뒤 500을 더함.

## 다음 사이클 후보

- **사이클 06 내 도서관** (사용자 승인, 2026-10-04): 지역·직장 저장, 직장 기준 도서관 자동 포함, 도서관 직접 추가, "내 도서관만" 스위치. `docs/cycles/06-my-libraries/scope.md`
- **검색 화면 다듬기**(책 묶기 안내, 책검색 화면, 정렬, 이상한 곳 수정): 06 다음 사이클 후보
- **책 번호 유지**: 별개의 사이클 (사용자, 2026-10-04: "수집기를 update가능한 형태로 바꿔야 하는 거니까"). 정책은 `catalog-refresh.md` 5.2절. 책을 저장하는 알림보다 먼저.
- **알림**: 책 번호 유지 뒤. (사이클 05 `scope.md`는 알림을 07로 적었으나 순서가 바뀜)
- 배포(EC2 한 대, `docs/research/deploy/aws-layout.md`)는 사이클 밖에서 병행
- 하루 한 번 작업의 카카오 호출 허용 IP를 비운 채로 운영해도 되는지는 운영 때 다시 확인
