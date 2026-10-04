# 개발 인계서: 사이클 06 내 도서관 (지역·직장 저장과 검색 연결)

## 요약

로그인한 사람의 거주지·직장 지역과 직접 고른 도서관(최대 20곳)을 서버에 저장합니다. 검색 화면의 "전체 도서관 | 내 도서관" 스위치가 이 값을 바로 씁니다. 로그인하지 않은 사람은 사이클 05까지와 똑같이 씁니다.
- 새 모듈 `mylibrary`(패키지 `com.chaekcheck.mylibrary`, 스키마 `mylibrary`)를 만듭니다. 이 모듈은 `auth`의 `AccountDeleted`를 처음으로 실제로 받아 처리합니다.
- `auth`에는 다른 모듈이 쓸 공개 장치 셋을 더합니다: 계정 줄 잠금, `AccountId` 인자 해석기, 켜고 끄기 표시.
- 검색 쪽(`library`, `catalog`, `availability`)에는 `libraryIds` 한 칸과 "직접 추가" 표시(`chosen`, `JoinTier.CHOSEN`)가 더해집니다. 검색 모듈은 여전히 회원을 모릅니다(ADR-0037).
- `library`에 로그인 없이 쓰는 공개 목록 `GET /api/v1/libraries`가 생깁니다.
- 웹에는 다음이 생기거나 바뀝니다.
  - S1: "내 도서관" 줄, 스위치 글자와 기본값
  - S2: 로그인 후에는 서버에 저장
  - S10 `/my-libraries`(새 화면), S11 지역 옮기기 창(새 창)
  - 결과 줄의 "직접 추가" 표시
  - 동의·처리방침·탈퇴 안내 문구
- 사이클 05 보완 셋도 함께 합니다: `signup_success`, `withdraw_request_expired`, `withdraw_state_mismatch`.

## 목표

로그인한 사람의 거주지·직장 지역과 직접 고른 도서관이 서버에 저장되고, 검색 화면의 "내 도서관만" 스위치로 바로 쓰인다(`scope.md` 목표 [확정]).

**포함**
- `mylibrary` 모듈: Liquibase 새 changelog, `JdbcClient` 저장소, 저장 API 다섯 개, `AccountDeleted` listener
- `auth` 추가
  - `AccountPresence.lockIfExists`: 호출한 트랜잭션 안에서 계정 줄을 잠금
  - `AccountId` 인자 해석기
  - `ConditionalOnAuthEnabled`를 `auth` 루트로 옮김 [안]
- 검색 쪽 변경
  - `libraryIds` 파라미터, `SearchTarget.chosen`, 계획 규칙(ADR-0050), `JoinTier.CHOSEN`
  - `GET /api/v1/libraries`
- 발행 저장소 설정 `republish-outstanding-events-on-restart`와 재시작 시험
- 웹 화면: S1, S2, S10, S11과 결과 줄 변경
- 문구 변경: S6, S9(동의 항목 추가, 버전 그대로), S7(지워지는 것)
- 사이클 05 보완 셋

**제외**: 관심 책·알림, 책 번호 유지, 소속 기관 자격, 연락처·별명, 검색 화면 다듬기, 배포. 자세한 내용은 "이번에 하지 않는 것"에 있습니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다.
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) **조용히 바꾸지 말고** 먼저 사용자에게 알리세요.
  - 내용과 이유는 dev `docs/plan-feedback.md`의 **새 `# 사이클 06` 절**에 쌓습니다. 사용자 발언이면 그대로 옮깁니다.
- 세부 이름은 `design-delta.md`대로 씁니다. 해당 이름: `AccountPresence.lockIfExists`, `library_limit_reached`, `matchedBy`, `cautioned`, `JoinTier.CHOSEN`, `chosen`, `chaekcheck.regionImport.v1`, 표·changelog 이름.
  - dev가 코드에 맞춰 바꾸면 `# 사이클 06` 절에 알리기만 합니다 [확정] (사용자 승인, 2026-10-04, design-delta 검토).
  - 아래에서 [안]으로 표시한 이름은 이런 "바꿀 수 있는 세부 이름"입니다.
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값입니다.
  - `[안]`: 제안입니다.
  - `[확인 필요]`: 모르는 값입니다. 확정된 것처럼 코드에 넣지 말고(필요하면 `TODO(확인 필요)` 주석), 확인한 뒤 결과를 보고합니다.
- 이번 사이클은 **새 의존성이 없습니다**. 의존성이 필요해지면(테스트용 포함) 사용자에게 먼저 알리고 승인받습니다.
- 단계마다 적힌 확인이 통과해야 다음 단계로 넘어갑니다.
  - 백엔드: `backend/`에서 `./gradlew build` (`ModularityTests`, `DocumentationTests` 포함)
  - 웹: `web/`에서 `npm test`, `npm run build`, `npm run lint`
  - `fetch-service/`는 바뀌지 않습니다.
- **구현 기준은 `design-delta.md`입니다.** JSON 예시와 표 정의 전체는 여기 다 옮기지 않았습니다.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/06-my-libraries/design-delta.md`: **기준 문서**
  - 구조 그림(모듈 구성도, 흐름 셋, 도메인 모델), 모듈 표, 검색 계획 규칙 표
  - 데이터(ER, 칼럼 표), API 표와 예시, 브라우저 저장 표, 그 밖의 변경, 확인 필요
- `../chaekcheck-plan/docs/cycles/06-my-libraries/design-diagrams.md`: 설계 그림 모음(설계 수준 클래스 그림, 시퀀스 5, 흐름도 3, 화면 상태, 예상 설계 패턴). 클래스 이름은 예시 [안]
- `../chaekcheck-plan/docs/cycles/06-my-libraries/spec.md`: R1~R9, R8-1, R8-2, 상태별 동작, AC-1~AC-18, 비목표
- `../chaekcheck-plan/docs/cycles/06-my-libraries/flow.md`
  - S1(변경), S2(변경), S10(새), S11(새)
  - S4(그대로), S6·S9·S7(문구만)
  - AC·상태 대응표
- `../chaekcheck-plan/docs/cycles/06-my-libraries/scope.md`: 사이클 05 보완 표(탈퇴 코드 문구)
- ADR (`../chaekcheck-plan/docs/adr/`)
  - 0048: 둘째 회원 모듈은 `mylibrary`. ADR-0036의 `member`를 대체합니다.
  - 0049: S10이 쓰는 목록(`GET /api/v1/libraries`)과 저장 방법(지역은 통째로, 도서관은 하나씩)
  - 0050: 직접 추가한 도서관은 검색에서 맨 앞에 두고, 자격 규칙의 예외로 다룹니다.
  - 0051: 계정 줄 잠금 + 재시작 때 남은 이벤트를 다시 처리합니다.
  - 그대로 따르는 것: 0001, 0003, 0008, 0013, 0027, 0037, 0038, 0041, 0044
- 사이클 05: `../chaekcheck-plan/docs/cycles/05-login-account/handoff.md`(C1~C34, 결과 코드 규칙 C21), `retro.md`

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0048 | 새 모듈 `mylibrary`. `auth`에는 `AccountId`, `AccountDeleted`, 계정 줄 잠금으로만 기댐. 관심 책은 넣지 않음 |
| 0049 | `GET /api/v1/libraries`(공개, 회원 모름). 지역 저장은 `PUT /api/v1/me/regions`(통째로), 도서관은 `PUT`/`DELETE /api/v1/me/libraries/{libraryId}`(하나씩). S11 답과 스위치 값은 브라우저에만 저장 |
| 0050 | `libraryIds`의 켜진 도서관은 자격과 상관없이 계획에 넣고 `chosen` 표시를 붙여 맨 앞에 둠("전체"여도). `priorityGroup`은 원래 값 유지. `visit=none`이어도 남김. 가입 자격 배지 대신 "직접 추가" 표시 |
| 0051 | `AccountPresence.lockIfExists`(`SELECT … FOR NO KEY UPDATE`, 호출한 트랜잭션 안). `republish-outstanding-events-on-restart: true` |

인계서에도 옮겨 적는 사항이 둘 있습니다(cycle-close 검토). 이미 확정된 ADR은 고칠 수 없어서 `docs/current/`와 이 인계서에 적습니다.
- ADR-0037에는 `member`라고 적혀 있지만 이번 모듈 이름은 `mylibrary`이고, `libraryIds` 상한은 20입니다 [확정] (spec R3).
- `auth`가 계정 번호를 다른 모듈에 넘기는 장치(`AccountId` 인자 해석기)와 켜고 끄기 표시를 공개로 옮기는 일은 이 사이클에서 합니다.

## 지켜야 할 제약

dev `CLAUDE.md`, 스킬 규칙(`.claude/skills/spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), 사이클 05 인계서 C1~C34를 그대로 따릅니다. 이 사이클에서 더하거나 바뀌는 것만 적습니다.

### 모듈 경계
- C1. 의존 방향은 `mylibrary → auth, library, region` 하나뿐입니다(ADR-0048).
  - `mylibrary`가 쓰는 공개 API
    - `auth`: `AccountId`, `AccountDeleted`, `AccountPresence`, `ConditionalOnAuthEnabled`
    - `library`: `LibraryCatalog.findEnabledTarget`
    - `region`: `RegionDirectory.expandForMatching`
  - 다른 모듈의 `internal`, 표, 저장소는 쓰지 않습니다.
  - `catalog`·`availability`는 `mylibrary`·`auth`를 모릅니다(ADR-0037).
  - `auth`는 여전히 다른 모듈에 의존하지 않습니다.
  - `ModularityTests`에서 순환이 없어야 합니다.
- C2. `mylibrary` 표는 `auth.account`에 FK를 두지 않습니다(모듈 경계). 다른 스키마와 JOIN하지 않습니다. 탈퇴 정리는 이벤트로만 합니다(ADR-0036·0048).
- C3. `module-map`의 문장 "다른 모듈은 auth에 의존하지 않습니다"는 이제 "`mylibrary`만 auth의 공개 타입에 의존"으로 바뀝니다. `auth/package-info.java`의 설명("No other module depends on this one")도 함께 고칩니다.

### 계정 잠금과 탈퇴
- C4. `AccountPresence.lockIfExists(AccountId): boolean` [안 이름]은 **호출한 트랜잭션 안에서만** 동작합니다(`Propagation.MANDATORY`) [확정] (ADR-0051).
  - 잠금 문장은 `SELECT … FROM auth.account WHERE id = ? FOR NO KEY UPDATE`입니다.
  - `mylibrary`의 저장은 처음에 반드시 이것을 부릅니다. `false`이면 줄을 만들지 않고 401 `unauthorized`를 줍니다.
  - ADR-0051 원문은 "모든 저장의 처음"입니다. `DELETE /api/v1/me/libraries/{id}`에도 잠금을 걸지는 dev가 정하고 보고합니다.
- C5. `AccountDeleted` listener는 `mylibrary.account_region`, `mylibrary.account_library`에서 `WHERE account_id = ?`로 지웁니다. 두 번 와도 결과가 같아야 합니다(멱등, spec R8). 이벤트 모양(accountId만)은 바꾸지 않습니다(사이클 05 C3).
- C6. `spring.modulith.events.republish-outstanding-events-on-restart: true` [확정] (ADR-0051). 사이클 05 C28의 세 값은 그대로 둡니다.

### 켜고 끄기
- C7. `mylibrary`의 모든 빈(컨트롤러, 저장소, listener, 설정)은 `chaekcheck.auth.enabled`에 묶습니다 [안].
  - 꺼져 있으면 `/api/v1/me/regions`, `/api/v1/me/libraries/**`는 404(루트 핸들러의 `not_found`)입니다.
  - 표는 늘 만듭니다 [안] (사이클 05와 같음).
  - `GET /api/v1/libraries`와 `libraryIds`는 로그인 기능과 상관없이 늘 동작합니다(공개).
- C8. `ConditionalOnAuthEnabled`를 `com.chaekcheck.auth`(루트)로 옮겨 공개합니다 [안]. 옮긴 뒤에도 `ModularityTests`가 통과하는지는 [확인 필요]입니다.
  - 지금 이 annotation은 `auth.internal.AuthToggleEnvironmentPostProcessor.ENABLED`를 씁니다. 같은 모듈 안이라 괜찮을 것으로 보지만 확인합니다.
  - 통과하지 않으면 멈추고 사용자에게 알립니다.

### API
- C9. `/api/v1/me/**`에는 이미 액세스 쿠키, 요청마다의 계정 확인, 변경 메서드의 `X-XSRF-TOKEN`이 적용되어 있습니다(ADR-0044, 사이클 05 `SecurityConfiguration.PROTECTED`). 보안 설정은 바꾸지 않습니다.
- C10. 계정은 `AccountId` 인자 해석기로만 받습니다. 주소에 계정 번호를 넣지 않습니다(사이클 05 C5).
- C11. `PUT /api/v1/me/libraries/{libraryId}`의 처리 순서 [확정] (사용자 승인, 2026-10-04, 마무리 검토)
  1. 잠금. 계정이 없으면 401입니다.
  2. 켜진 도서관인지 확인합니다(`findEnabledTarget`). 없음, 꺼짐, 숫자 아님이면 404 `library_not_found`입니다.
  3. **이미 직접 추가돼 있으면 204**입니다. 20곳이 차 있어도 오류가 아닙니다.
  4. 없는데 이미 20곳이면 409 `library_limit_reached` [안 이름]입니다.
  5. `INSERT … ON CONFLICT DO NOTHING` 뒤 204를 줍니다.
  - 꺼진 도서관도 뺄 때까지 20곳에 셉니다 [확정].
- C12. 오류는 RFC 9457 + `code`입니다(ADR-0008). 새 컨트롤러의 400·404·409·422는 모듈 자신의 `@RestControllerAdvice(basePackageClasses = …)`로 씁니다. 지금 `catalog.internal.web.CatalogErrors`, `availability.internal.web.AvailabilityErrors`와 같은 방식입니다. 루트 `ApiExceptionHandler`는 바꾸지 않습니다.
- C13. `libraryIds` 검사 [안] (지역 ID 규칙과 같게)
  - 쉼표로 구분한 양의 정수, 최대 20개, 중복은 합칩니다.
  - 400 `validation_error`, `errors[].field: libraryIds`, `code`는 `invalid_format` 또는 `too_many`입니다.
  - 검사 순서: 조건 → `filter` → `scope` → `visit` → `libraryIds` → 지역.
  - 꺼졌거나 없는 번호는 **오류 없이 무시**합니다(AC-10).

### 검색 계획 (ADR-0050)
- C14. 계획 규칙 [확정]
  - `libraryIds`의 켜진 도서관은 자격과 상관없이 계획에 넣습니다. **지역을 보냈을 때 `place()`가 `null`이라 빠지던 도서관도 넣습니다.**
  - `scope=joinable`이면 `joinable() || chosen`을 남깁니다.
  - `visit=none`이면 방문 가입이라도 `chosen`이면 남깁니다.
  - 순서: `chosen` 묶음이 맨 앞이고, 묶음 안은 지금 `IN_GROUP` 비교로 정렬합니다. 그 뒤는 ADR-0027 순서입니다. 스위치가 "전체"여도 같습니다.
  - `priorityGroup`은 원래 값을 유지합니다.
- C15. `chosen`인데 지역 규칙이 안 맞는 도서관(지금은 빠지던 도서관)의 `eligibility`는 `UNKNOWN`입니다 [안 내부 값]. 화면에는 보이지 않습니다.
  - 이 경우의 `priorityGroup` 값은 설계에 없습니다. dev가 정하고 보고합니다.
- C16. 다음 묶음 두 API(`/api/v1/ebook-searches/batches/stream` 계열, `/api/v1/book-availabilities/batches/stream` 계열)와 도서관별 더 보기는 바꾸지 않습니다 [안]. 계획에서 나온 후보만 받습니다.
  - 이 API들은 `findEnabledTarget`(지역 없이 둔 자리)로 대상을 다시 만듭니다. 그래서 웹은 `chosen`을 **첫 스트림의 `targets`에서** 읽어 유지합니다.
- C17. `libraryIds`는 화면 주소창(웹 주소)에 넣지 않습니다 [안]. 지역 ID처럼 API로만 보냅니다.

### 웹
- C18. 로그인한 동안 화면은 서버 값만 씁니다 [확정] (spec R1).
  - `chaekcheck.regions.v1`은 읽지도 쓰지도 지우지도 않습니다. 로그아웃하면 다시 그 값을 씁니다.
  - 로그인하지 않았으면 서버로 지역을 보내지 않습니다(AC-2).
- C19. 서버에 저장된 지역이 폐지·대체됐을 때(R6) [확정]
  - 화면은 해석한 값으로 검색하고 안내합니다.
  - **서버 값을 자동으로 고쳐 저장하지 않습니다.** 이용자가 다시 저장할 때 고쳐집니다.
  - 예외는 S11뿐입니다. S11은 해석한 값으로 PUT합니다.
- C20. 계정 확인이 필요한 요청(`/api/v1/me/**`)은 기존 `meRequest`(`web/src/api/auth.ts`)를 거칩니다. 401 갱신(Web Locks)과 CSRF 한 번 재시도를 그대로 씁니다.
- C21. React에서 `dangerouslySetInnerHTML`을 쓰지 않습니다(사이클 05 C22). S10의 도서관 이름과 검색 결과도 마찬가지입니다.
- C22. 새 결과 코드(`withdraw_request_expired`, `withdraw_state_mismatch`, 그리고 서버 코드로 정해진다면 `signup_success`)는 사이클 05 C21을 따릅니다. 목록에 있는 코드만 정해진 문구로 보이고, 코드 글자는 화면에 찍지 않습니다.

### 동의 문서
- C23. 동의 항목은 문구만 더합니다. **문서 버전은 올리지 않습니다** [확정] (사용자: "아직 배포 전이라서 뭐 버전 올릴 것도 없어", 2026-10-04).
  - `application.yml`의 `chaekcheck.auth.documents.*`와 `web/src/features/auth/documentVersions.json`은 바꾸지 않습니다.
  - 이미 가입한 계정에 다시 동의를 받는 화면은 만들지 않습니다.

### 알고 받아들인 한계 (버그로 고치지 않음)
- 두 탭에서 동시에 지역을 바꾸면 나중 저장이 이깁니다(ADR-0049).
- S11 답과 스위치 값은 그 브라우저에만 있습니다. 다른 기기는 모릅니다(ADR-0049).
- 실패한 listener 기록은 다음 재시작까지 남습니다(ADR-0051).
- 서버가 여러 대일 때 재시작 다시 처리의 동작은 문서에 없습니다 [확인 불가].
- `auth`의 `last_login_at` 갱신이 잠금 때문에 잠깐 기다릴 수 있습니다(밀리초 단위 추정, ADR-0051).
- 이용자가 실제로 가입하지 않은 도서관을 직접 추가해도 경고가 없습니다(ADR-0050).

## 개발 시작 전 확인

### dev가 확인하거나 할 것

- [ ] base package는 `com.chaekcheck`로 정해져 있습니다(dev `CLAUDE.md`). 새 모듈 패키지는 `com.chaekcheck.mylibrary`입니다.
- [ ] Spring Modulith 2.1.1의 `republish-outstanding-events-on-restart`가 **실패(`FAILED`) 상태 기록**도 다시 처리하는지 확인합니다 [확인 필요].
  - 방법: 공식 문서(https://docs.spring.io/spring-modulith/reference/events.html) + 6단계 시험
  - 다시 처리하지 않으면 멈추고 사용자에게 알립니다. ADR-0051의 D안(주기 작업) 등을 다시 정해야 할 수 있습니다.
- [ ] `ConditionalOnAuthEnabled`를 루트로 옮겨도 `ModularityTests`가 통과하는지 확인합니다 [확인 필요]. 1단계에서 먼저 시험합니다.
- [ ] `signup_success`를 서버 결과 코드로 둘지 웹 상태로 둘지 [확인 필요]. dev가 안을 만들어 사용자에게 묻습니다.
  - 참고(dev 코드, 2026-10-04 읽음): 지금 가입은 서버 리다이렉트가 아니라 웹의 `postSignup`(201) 뒤 `navigate(takeReturnPath())`로 끝납니다(`web/src/features/auth/SignupPage.tsx`).
- [ ] 사이클 05 retro의 "15분 동안 다른 모듈 API에서 통과"가 `/api/v1/me/**` 밖 경로만 뜻하는지 확인합니다. 지금 코드는 `/api/v1/me/**`마다 계정을 확인합니다(`AccountJwtAuthenticationConverter`). 결과를 `# 사이클 06` 절에 적습니다.

### 사용자가 할 것

| 할 일 | 언제 | 결과를 dev에 알려 줄 것 |
|---|---|---|
| `signup_success`를 서버 코드로 둘지 웹 상태로 둘지 고르기(dev 안을 보고) | 7단계 전 | 고른 방식 |
| S10·S1 화면 문구 세부와 "직접 추가" 표시 글자 확인: 불러오기 실패, 20곳 찼음, 꺼진 도서관, 검색 결과 없음, `library_not_found` 안내 | 12단계 화면을 본 뒤 | 바꿀 문구 |
| S10 "지역 선택"의 [변경]이 S2를 거주(또는 직장) 칸이 열린 채로 여는지, 줄의 [빼기]가 오른쪽 끝인지 확인 | 12단계 화면을 본 뒤 | 그대로인지, 바꿀지 |
| 동의 고지·처리방침 문구 최종 검토. 목적 문구를 얼마나 구체적으로 써야 하는지(개인정보보호위원회 안내서), 필수 동의로 받는 근거(설계의 해석) 확인 | **배포 전**. 배포 뒤 다른 가입자가 생긴 뒤 문구를 바꾸면 다시 동의를 받아야 함 | 문구 |
| 문서 버전(시행 날짜) 결정(사이클 05에서 넘어옴) | 배포 전 | 날짜 |

### 무엇이 어느 단계를 막는가

| 막는 것 | 막히는 단계 | 막히지 않는 것 |
|---|---|---|
| `ConditionalOnAuthEnabled` 루트 이동 시험 | 1단계(이동), 5단계(빈 조건) | 2~4단계 |
| `FAILED` 기록 재처리 확인 | 6단계 완료 | 1~5단계, 웹 |
| `signup_success` 방식 | 7단계의 그 부분 | 탈퇴 코드 둘, 다른 웹 단계 |
| 문구 검토 | 배포 | 모든 단계(자리 글 + `reviewed: false`로 진행) |

## 구현 단계

### 1단계: `auth` 공개 장치 셋 (의존: 없음)

1. **`ConditionalOnAuthEnabled`를 루트로** (파일: `backend/src/main/java/com/chaekcheck/auth/internal/ConditionalOnAuthEnabled.java` → `backend/src/main/java/com/chaekcheck/auth/ConditionalOnAuthEnabled.java`) [안]
   - 할 일: 패키지를 옮기고 `auth` 안의 import를 모두 고칩니다. 동작(`@ConditionalOnBooleanProperty(…ENABLED)`)은 같습니다.
   - 이유: `mylibrary`의 빈을 같은 스위치에 묶기 위해서입니다(C7).
   - 위험: 낮음. 다만 Modulith 검증 결과가 [확인 필요]입니다.
2. **`AccountPresence`** (새 파일: `backend/src/main/java/com/chaekcheck/auth/AccountPresence.java`, 구현은 `auth/internal/account/` 아래. 이름은 dev가 정함)
   - 할 일: `boolean lockIfExists(AccountId)`를 만듭니다.
     - `@Transactional(propagation = Propagation.MANDATORY)`
     - `SELECT 1 FROM auth.account WHERE id = ? FOR NO KEY UPDATE`
     - 줄이 있으면 `true`, 없으면 `false`
     - `@ConditionalOnAuthEnabled`
   - 이유: ADR-0051. 저장과 탈퇴가 겹쳐도 지워진 계정의 줄이 생기지 않게 하고, 20곳 상한이 동시 요청에서도 정확하게 지켜지게 합니다.
   - 위험: 중간. 두 모듈이 한 트랜잭션을 함께 씁니다.
3. **`AccountId` 인자 해석기** (`auth/internal/web/` 또는 `auth/internal/security/`, 이름은 dev가 정함)
   - 할 일: `HandlerMethodArgumentResolver`를 만들어, 컨트롤러 메서드의 `AccountId` 인자를 현재 인증(`JwtAuthenticationToken`의 `sub`)으로 채웁니다.
     - `WebMvcConfigurer`로 앱 전체에 등록하고 `@ConditionalOnAuthEnabled`를 붙입니다.
     - 인증이 없으면 401 `unauthorized`입니다(ProblemDetail).
   - 이유: 다른 모듈 컨트롤러가 `auth.internal`이나 Spring Security 타입을 모른 채 계정을 받게 합니다.
   - 위험: 낮음
4. **설명 고치기** (파일: `backend/src/main/java/com/chaekcheck/auth/package-info.java`): C3
- 테스트
  - `lockIfExists`: 트랜잭션 없이 부르면 예외(`IllegalTransactionStateException`), 있는 계정은 `true`, 없는 계정은 `false`
  - **잠금 확인**: 한 트랜잭션이 잠근 동안 다른 스레드의 `AccountDeletion.delete`가 기다리는지(시간 측정 또는 latch)
  - 해석기: 테스트 전용 `/api/v1/me/**` 컨트롤러로 `AccountId` 값 확인, 토큰 없으면 401
  - 꺼짐 컨텍스트(`AuthDisabledTests`)가 그대로 통과
  - `ModularityTests`, `DocumentationTests`
- 확인 방법: `./gradlew build`
- 위험: 중간

### 2단계: `library` 계획 규칙 (`libraryIds`, `chosen`) (의존: 없음. 1단계와 나란히 해도 됨)

1. **`PlanOptions`** (파일: `backend/src/main/java/com/chaekcheck/library/PlanOptions.java`)
   - 할 일
     - `Set<Long> libraryIds`(빈 집합 가능) 칸을 더합니다. `DEFAULT`는 빈 집합입니다.
     - `apply()`의 거르기를 `scope == ALL || joinable() || chosen`, `visit == ANY || !visitRequired() || chosen`으로 바꿉니다(C14).
   - 위험: 낮음
2. **`SearchTarget.chosen`** (파일: `backend/src/main/java/com/chaekcheck/library/SearchTarget.java`)
   - 할 일: `boolean chosen` 칸을 더합니다. 이 레코드를 만드는 곳(`LibraryService.toTarget`, 테스트의 `availability/internal/TestTargets.java` 등)을 모두 고칩니다.
   - 위험: 낮음(기계적 수정)
3. **`LibraryService.planSearch`** (파일: `backend/src/main/java/com/chaekcheck/library/internal/LibraryService.java`)
   - 할 일
     - `options.libraryIds()`에 있는 켜진 도서관은 `place()`가 `null`이어도 계획에 넣습니다(C14, C15). 꺼졌거나 없는 번호는 무시합니다.
     - 그 도서관들에 `chosen=true`를 붙입니다.
     - 순서: `chosen` 묶음(`IN_GROUP`)을 먼저 두고, 나머지는 지금 순서 계산(ADR-0027)대로 둡니다. 같은 도서관이 두 번 들어가지 않게 합니다.
     - `findEnabledTarget`은 `chosen=false`를 줍니다.
   - 이유: ADR-0050, spec R3·R5
   - 위험: 중간. 계획 순서는 세 검색이 함께 씁니다.
- 테스트 (`backend/src/test/java/com/chaekcheck/library/LibraryCatalogTests.java`에 더함)
  - 지역 규칙이 안 맞아 빠지던 도서관이 `libraryIds`로 들어오고 `chosen=true`, `eligibility=UNKNOWN`
  - `scope=joinable`에서 가입 불가인 `chosen`이 남음
  - `visit=none`에서 방문 가입인 `chosen`이 남음
  - `chosen`이 맨 앞(`scope=all`, `scope=joinable` 둘 다), 원래 `priorityGroup` 유지
  - 꺼진 번호·없는 번호는 오류 없이 빠짐(AC-10)
  - `libraryIds`가 비면 지금과 같은 계획(회귀)
- 확인 방법: `./gradlew build`
- 위험: 중간

### 3단계: `GET /api/v1/libraries` (의존: 2단계)

1. **`LibraryCatalog.eligibilityFor(residenceIds, workIds)`** [안 이름] (파일: `LibraryCatalog.java`, 구현은 `LibraryService`)
   - 할 일: 켜진 도서관 전체를 id 순서로 돌려주고, 줄마다 다음 값을 붙입니다.
     - `eligibility`
     - `matchedBy`(`RESIDENCE`·`WORK` 중 맞은 것. 둘 다 맞으면 둘 다)
     - `visitRequired`
     - `cautioned`(`joinCaution` 있음)
     - `eligibilitySummary`
   - 판정은 `place()`와 같은 규칙을 씁니다. 다만 거주·직장을 따로 비교해 `matchedBy`를 채우고, 지역 규칙이 안 맞는 줄은 빼지 않고 `UNKNOWN`으로 둡니다.
   - 다른 모듈이 쓰지 않으면 공개하지 않아도 됩니다(dev가 정하고 보고).
2. **컨트롤러** (새 파일 예: `backend/src/main/java/com/chaekcheck/library/internal/web/LibraryListController.java`, 오류 advice 예: `LibraryErrors.java`)
   - 할 일: `GET /api/v1/libraries?residenceRegionIds=&workRegionIds=` → 200 `{"libraries":[…]}`(`design-delta.md` 예시 모양). 로그인이 없고 페이지도 없습니다.
     - 지역 ID는 쉼표로 구분하고 칸마다 최대 20입니다. 400 `validation_error`, 422 `invalid_region`(지금 스트림과 같은 모양)입니다.
     - **응답 설명(Javadoc·API 문서)에 적을 것**: 지역 규칙이 안 맞는 줄의 `eligibility=UNKNOWN`은 지금의 뜻("지역을 보내지 않음")과 다르다는 점 [안].
   - 이유: ADR-0049. S10의 여섯 구역, 누구나 가입 줄, 이름 검색, 직접 추가 줄의 이름에 씁니다.
- 테스트
  - 지역 없이 호출하면 OPEN 줄의 `matchedBy`가 빈 배열
  - 직장 "서울 중구"이면 서울 재직 가능 도서관의 `matchedBy`에 `WORK`(AC-4 서버 쪽)
  - 거주·직장 둘 다 맞으면 둘 다 들어감
  - 9001(폐지 시험 데이터)은 422, 형식이 틀리면 400
  - 꺼진 도서관은 목록에 없음
- 확인 방법: `./gradlew build`. **응답 크기(278곳)를 측정**해 보고합니다 [확인 필요].
- 위험: 낮음

### 4단계: `catalog`·`availability`가 `libraryIds`를 받음 (의존: 2단계)

1. **`JoinTier.CHOSEN`** (파일: `backend/src/main/java/com/chaekcheck/catalog/internal/search/JoinTier.java`)
   - 할 일: `CHOSEN`을 **첫 값**으로 더합니다. `of()`는 `target.chosen()`이면 `CHOSEN`을 줍니다.
   - 위험: 중간. `PgBigmBookSearch`가 `ordinal()`과 `values()[tier]`로 정렬하므로 순서 값이 하나씩 밀립니다. 양쪽이 같은 enum을 쓰므로 맞을 것으로 보지만, SQL 안에 숫자를 직접 쓴 곳이 없는지 확인합니다.
2. **`/api/v1/books`, `/api/v1/books/{bookId}`** (파일: `catalog/internal/web/BookParams.java`, `BookSearchController.java`)
   - 할 일: `libraryIds`를 C13 규칙으로 읽어 `PlanOptions`에 넣습니다(지역보다 먼저). 응답 항목의 `joinTier`에 `"CHOSEN"`이 나옵니다.
3. **스트림 두 곳** (파일: `availability/internal/web/EbookSearchStreamController.java`, `BookAvailabilityStreamController.java`, 새 파서 예: `LibraryIdsParam.java`. 기존 `IdListParam`을 다시 써도 됨)
   - 할 일: `libraryIds`를 `visit` 뒤, 지역 앞에서 검사해 `PlanOptions`에 넣습니다.
   - `StreamEvents.Library`(파일: `availability/internal/search/StreamEvents.java`)에 `chosen`을 더합니다(`targets.libraries[].chosen`).
4. 다음 묶음 두 API와 `LibraryEbookController`는 바꾸지 않습니다(C16).
- 테스트
  - 각 API에서 `libraryIds` 400(`invalid_format`, `too_many`, 오류 순서: `visit` 오류가 먼저, 지역 오류가 나중)
  - `targets`에 `chosen`이 있고 맨 앞(AC-6 서버 쪽)
  - `/books`에서 `CHOSEN`이 가장 먼저 정렬
  - `libraryIds`가 없으면 지금 응답과 같음(기존 테스트 회귀, AC-14)
- 확인 방법: `./gradlew build`
- 위험: 중간

### 5단계: `mylibrary` 모듈 (의존: 1·2단계)

1. **Liquibase** (새 파일: `backend/src/main/resources/db/changelog/mylibrary/001-mylibrary-schema.yaml` [안], master `db.changelog-master.yaml`에 include 한 줄을 `modulith/001` 뒤에)
   - 할 일: `CREATE SCHEMA mylibrary`, 표 `account_region`, `account_library`를 만듭니다. 칼럼, PK, CHECK는 `design-delta.md` "데이터" 표 그대로입니다.
     - CHECK는 `sql` changeset으로 씁니다(Liquibase OSS YAML에는 `addCheckConstraint`가 없음).
     - FK는 없습니다. 다른 인덱스도 없습니다.
   - `PRE_DEPLOYMENT`가 있으므로 같은 사이클 안의 수정은 허용됩니다. 수정하면 로컬 `db`·`db-test`를 초기화합니다.
2. **모듈 선언** (새 파일: `backend/src/main/java/com/chaekcheck/mylibrary/package-info.java`)
   - 할 일: `@ApplicationModule(allowedDependencies = { "auth", "library", "region" })`를 두고 모듈 설명을 씁니다.
   - 루트에 공개 타입은 두지 않습니다 [안].
3. **저장소** (`mylibrary/internal/`, `JdbcClient`, JPA 엔티티 없음 [안])
   - 지역 [확정]
     - 읽기: `kind`별로 `position` 순서
     - 통째로 바꾸기: 같은 트랜잭션에서 `DELETE … WHERE account_id = ?` 뒤 INSERT, `position`은 고른 순서
     - 두 칸이 모두 비면 행이 없습니다(AC-13).
   - 도서관
     - 목록: `added_at, library_id` 순서 [안]
     - 개수: `count(*)`
     - 추가: `INSERT … ON CONFLICT DO NOTHING`
     - 빼기: 없어도 성공
4. **컨트롤러** (`mylibrary/internal/web/` 등, `@ConditionalOnAuthEnabled`, 계정은 `AccountId` 인자)

   | 메서드·경로 | 처리 |
   |---|---|
   | `GET /api/v1/me/regions` | 200 `{"residenceRegionIds":[…],"workRegionIds":[…]}`. 폐지된 ID도 그대로 줌 |
   | `PUT /api/v1/me/regions` | 두 칸 필수(빈 배열 가능), 칸마다 최대 20, 순서 유지 [확정], 중복 합침 [안] → 잠금(없으면 401) → `RegionDirectory.expandForMatching`으로 검증(422 `invalid_region`: `abolished`/`not_found`/`not_sigungu`, `errors[].field`는 칸 이름) → 바꾸기 → 200 저장한 값. 400 `validation_error`(`required`/`invalid_format`/`too_many`) |
   | `GET /api/v1/me/libraries` | 200 `{"libraryIds":[…],"max":20}`(꺼진 도서관 포함) |
   | `PUT /api/v1/me/libraries/{libraryId}` | C11 순서 그대로 |
   | `DELETE /api/v1/me/libraries/{libraryId}` | 204(없어도). 잠금 여부는 C4 |

   - 같은 트랜잭션 경계는 서비스 메서드 하나(`@Transactional`)로 둡니다. `lockIfExists`가 그 안에서 불려야 합니다(`MANDATORY`).
5. **`AccountDeleted` listener** (`mylibrary/internal/`, `@ApplicationModuleListener`, `@ConditionalOnAuthEnabled`)
   - 할 일: C5
- 테스트 (켜짐 컨텍스트, `db-test`)
  - 스키마가 적용되고 CHECK(`kind`, `region_id > 0`, `position` 0~19, `library_id > 0`)가 걸림
  - API별 정상·오류 응답 전부. CSRF 없는 PUT·DELETE는 403 `csrf_invalid`, 토큰이 없으면 401
  - 꺼짐 컨텍스트에서 다섯 경로 모두 404
  - AC-1(서버): PUT 뒤 GET이 같은 값, 순서 유지
  - AC-13: 두 칸을 빈 배열로 PUT하고 직접 추가를 모두 빼면 두 표에 그 계정 행이 0
  - AC-8: 21번째는 409, 이미 있는 도서관을 20곳 찬 상태에서 다시 PUT하면 204
  - AC-10: 꺼진 도서관 PUT은 404, 이미 저장된 꺼진 도서관은 GET에 그대로 나오고 20곳에 셈
  - AC-12: 지운 계정의 유효한 액세스 토큰으로 PUT하면 401이고 행 0. 필터를 거치지 않고 서비스를 지운 계정 번호로 직접 불러도 행 0
  - **동시성 1**: 19곳인 계정에 서로 다른 도서관 두 개를 동시에 PUT하면 하나만 204, 하나는 409이고 최종 20곳. 여러 번 반복
  - **동시성 2(저장과 탈퇴 경합)**
    - (a) 저장 트랜잭션이 잠금을 잡은 채 멈춘 동안 `AccountDeletion.delete`를 시작합니다. 삭제가 기다렸다가 진행되고, listener 뒤 두 표 행이 0이 됩니다(`await`).
    - (b) 삭제가 먼저 커밋되면 저장은 401이고 행 0입니다.
    - 멈추는 방법(latch, 테스트 전용 훅 등)은 dev가 정합니다.
  - AC-11: 탈퇴 뒤 두 표 행 0, `modulith.event_publication`에 그 이벤트의 완료 기록 없음. 같은 이벤트를 두 번 처리해도 오류가 없음
  - `ModularityTests`(허용 의존 셋 밖의 의존이 생기면 실패하는지), `DocumentationTests`(모듈 문서에 `mylibrary`)
- 확인 방법: `./gradlew build`, `psql`로 `\d mylibrary.*`
- 위험: 높음(잠금, 트랜잭션 경계, 동시성)

### 6단계: 재시작 때 남은 이벤트 다시 처리 (의존: 5단계)

1. **설정** (파일: `backend/src/main/resources/application.yml`)
   - 할 일: `spring.modulith.events.republish-outstanding-events-on-restart: true` [확정] (ADR-0051), 주석으로 ADR 번호를 적습니다.
2. **시험**: listener를 일부러 실패시킨 뒤 재시작합니다(새 테스트 클래스 예: `backend/src/test/java/com/chaekcheck/mylibrary/AccountDeletedRepublishTests.java`)
   1. 첫 컨텍스트: `mylibrary` listener가 실패하게 만든 상태(방법은 dev가 정함. 예: 테스트 설정으로 예외를 던지게 함)에서 행이 있는 계정을 지웁니다. 두 표 행이 남고, 발행 저장소에 그 listener의 미완료 기록이 남는지 확인합니다.
   2. 컨텍스트를 닫고, 실패하지 않는 상태로 **새 컨텍스트를 띄웁니다**(재시작).
   3. 두 표 행이 0이 되고 발행 기록이 지워지는지 `await`로 확인합니다(AC-11).
   - 1번에서 기록이 `FAILED` 상태로 남는 경우에도 2·3번이 성립하는지가 [확인 필요] 항목입니다. 성립하지 않으면 멈추고 사용자에게 알립니다.
   - 주의: `db-test`는 함께 쓰는 DB이므로, 재시작 다시 처리가 켜지면 **다른 테스트 컨텍스트가 뜰 때 남은 기록이 다시 처리됩니다**. 기존 `AccountDeletedFailedListenerTests`의 정리(`@AfterEach`)가 계속 동작하는지 확인하고, 새 시험도 끝에 자기 기록을 지웁니다.
- 확인 방법: `./gradlew build`
- 위험: 중간

### 7단계: 사이클 05 보완 (서버와 웹 문구) (의존: 없음)

1. **탈퇴 전용 코드** (파일: `backend/src/main/java/com/chaekcheck/auth/internal/login/LoginFailureHandler.java`)
   - 할 일: 재인증 콜백(`-reauth`)에서 다음처럼 바꿉니다 [확정] (사용자 승인, 2026-10-04).
     - `Missing.EXPIRED`이면 `withdraw_request_expired`
     - `Missing.STATE_MISMATCH`이면 `withdraw_state_mismatch`
     - 로그인 콜백은 지금 코드(`login_expired`, `login_state_mismatch`) 그대로입니다.
   - 클래스 설명의 "A missing or mismatched state keeps the login codes" 문장도 고칩니다.
2. **웹 문구** (파일: `web/src/features/auth/authResult.ts`)
   - `withdraw_request_expired` → "본인 확인 시간이 지났어요. 탈퇴를 다시 눌러 주세요"
   - `withdraw_state_mismatch` → "안전하지 않은 요청이라 멈췄어요. 탈퇴를 다시 눌러 주세요"
   - 두 문구 모두 [확정] (`scope.md`)
3. **첫 가입 안내 `signup_success`** [확정 이름] (방식은 [확인 필요]. 사용자 답에 따라)
   - 첫 가입을 마친 직후에만 S1 안내 줄에 "가입했어요"를 한 번 보입니다. 다시 로그인할 때(`login_success`)는 보이지 않습니다.
   - 서버 코드로 정하면 C22를 따릅니다. 웹 상태로 정하면 `SignupPage`의 201 뒤에 기존 `NoticeContext`로 넘깁니다.
- 테스트
  - `LoginCallbackTests`: 재인증 콜백의 만료·`state` 불일치가 새 코드로 가고, 계정이 남아 있음(AC-18)
  - 로그인 콜백 코드는 그대로
  - 웹: 두 코드 문구(`authResult.test.ts`), 가입 직후 한 번만 "가입했어요", 다시 로그인하면 없음(AC-17)
- 확인 방법: `./gradlew build`, `npm test`
- 위험: 낮음

### 8단계: 웹 API 층과 타입 (의존: 3·4·5단계)

1. **타입** (파일: `web/src/api/types.ts`)
   - `TargetLibrary.chosen: boolean`
   - `JoinTier`에 `'CHOSEN'`
   - 공개 목록 줄 타입: `id`, `name`, `eligibility`, `matchedBy`, `visitRequired`, `cautioned`, `eligibilitySummary`
   - 저장 API 응답 타입
2. **검색 요청** (파일: `web/src/api/client.ts`, `web/src/api/searchStream.ts`)
   - 계획 파라미터에 `libraryIds: number[]`를 더합니다. 비어 있지 않을 때만 `libraryIds=`를 붙입니다.
   - 화면 주소에는 넣지 않습니다(C17).
3. **공개 목록** (`client.ts`): `fetchLibraries(residence, work)` → `GET /api/v1/libraries`
4. **내 도서관 API** (새 파일 예: `web/src/api/myLibraries.ts`)
   - `getMyRegions`, `putMyRegions`, `getMyLibraries`, `addMyLibrary`, `removeMyLibrary`
   - 모두 `meRequest`를 거칩니다(C20). 변경 요청은 CSRF 헤더를 붙입니다(기존 `send` 규칙).
- 테스트(Vitest): 주소에 `libraryIds`가 들어가고 빈 배열이면 없음(`requests.test.ts`), 저장 API가 `meRequest`·CSRF를 거침, 401 → 갱신 경로
- 확인 방법: `npm test`, `npm run build`, `npm run lint`
- 위험: 낮음

### 9단계: 내 도서관 상태, 지역 저장 위치, S2, S11 (의존: 8단계)

1. **상태 공급자** (새 파일 예: `web/src/features/mylibrary/MyLibraryContext.tsx`. `main.tsx`에서 `AuthProvider` 안쪽에 둠)
   - 로그인 상태가 되면 `GET /api/v1/me/regions`와 `GET /api/v1/me/libraries`를 **동시에** 부릅니다.
   - 상태는 불러오는 중 / 실패 / 다 불러옴입니다. "다시 시도"를 둡니다.
   - 로그아웃하면 상태를 비웁니다.
2. **지역 저장 위치** (파일: `web/src/features/region/RegionContext.tsx`)
   - 로그인 전: 지금과 같습니다(`regionStorage.ts`).
   - 로그인 후: 서버 값을 씁니다(C18).
     - 읽은 뒤 `/api/v1/regions/resolutions`로 해석해 대체·제외 안내를 냅니다(`applyResolutions` 재사용, AC-9).
     - 서버에 다시 저장하지는 않습니다(C19).
   - 읽기가 끝나기 전에는 검색을 막지 않습니다. 지역 없이 전체 기준입니다 [확정] (flow S1).
3. **S2 저장** (파일: `web/src/features/region/RegionModal.tsx` 등)
   - 로그인 후에는 "저장"이 `PUT /api/v1/me/regions`입니다.
   - 상태
     - 저장 중: 버튼 비활성
     - 저장 실패: "저장하지 못했어요. 잠시 뒤 다시 해 주세요". 창은 열린 채 값을 유지합니다.
     - 401: 로그인이 풀렸다는 안내 후 로그인 전 상태
   - 422가 오면 지금처럼 해석 후 다시 고르게 합니다.
4. **S11 지역 옮기기 창** (새 파일 예: `web/src/features/mylibrary/RegionImportDialog.tsx`)
   - 열리는 조건(모두 맞을 때): 로그인 직후, 서버 지역이 비었음, 브라우저에 지역이 있음, `chaekcheck.regionImport.v1`에 이 계정 번호가 없음
   - 문구 [확정]: "이 브라우저에 고른 지역이 있어요. 계정에 저장할까요?", 지역 이름(거주·직장), [계정에 저장] [저장하지 않기]
   - 창이 뜰 때 브라우저 지역을 `/api/v1/regions/resolutions`로 해석합니다.
     - 바뀐 지역: "행정구역이 바뀌어 △△로 저장돼요"
     - 나뉘었거나 모르는 지역: 빼고, 저장 뒤 "다시 골라 주세요" 안내
   - [계정에 저장]: 해석한 값으로 PUT하고, S1이 그 지역 기준이 됩니다.
   - [저장하지 않기]: 서버에 아무것도 보내지 않습니다.
   - **두 답 모두** 이 계정 번호를 `chaekcheck.regionImport.v1`에 적습니다. 답 없이 닫거나 새로고침하면 적지 않습니다(다음 로그인 때 다시 물음) [확정].
   - 브라우저의 `chaekcheck.regions.v1`은 그대로 둡니다.
   - 상태: 저장 중 / 저장 실패(창 안에 실패 문구, 다시 누를 수 있음)
   - 배치: 가운데 작은 창, 모바일은 아래에서 올라옵니다 [확정].
- 테스트(Vitest)
  - 로그인 후 `localStorage` 지역을 읽지도 쓰지도 않음
  - 로그아웃 뒤 브라우저 값으로 돌아감
  - 로그인 전 지역 선택에 서버 요청 없음(AC-2)
  - S11 조건 넷, 두 답 모두 키에 기록, 닫기는 미기록(AC-3)
  - 해석 결과에 따른 PUT 본문(대체·제외)
  - 서버 지역 9001 → 대체 안내, 9002 → 다시 고르라는 안내(AC-9)
  - S2 실패·401
- 확인 방법: `npm test`, `npm run build`, `npm run lint`
- 위험: 중간(로그인 상태와 지역 출처 전환)

### 10단계: S1 "내 도서관" 줄, 스위치, 검색 연결 (의존: 9단계)

1. **"내 도서관" 줄** (새 파일 예: `web/src/features/mylibrary/MyLibrarySummary.tsx`. 로그인 후 `web/src/features/search/SearchPage.tsx`에서 `RegionSummary` 자리에)
   - 글자 [확정]
     - 기본: `내 도서관 · 거주 서울 마포구 · 직장 서울 중구 · 직접 추가 3곳 · 관리`
     - 비어 있음: `내 도서관이 비어 있어요. 지역을 고르거나 도서관을 추가하세요 · 관리`
     - 불러오는 중: "불러오는 중"
     - 실패: "내 도서관을 불러오지 못했어요 · 다시 시도"(스위치는 전체로)
   - 모바일에서 줄이 길면 지역 이름을 줄이고 "외"를 붙입니다 [확정].
   - [관리]를 누르면 `/my-libraries`로 갑니다. **S10으로 들어가는 길은 이것 하나뿐입니다** [확정]. S4(`SettingsPanel.tsx`)는 바꾸지 않습니다.
   - 이 줄은 메인 화면(검색 전)과 검색 결과 화면에서 같은 자리(검색창 바로 아래)에 있습니다.
2. **스위치 글자** (파일: `web/src/features/search/LibraryScopeToggle.tsx`)
   - 로그인 후: `전체 도서관 | 내 도서관` [확정]
   - 로그인 전: 지금 그대로(`가입 가능한 곳` / 지역 없으면 `누구나 가입`)
3. **기본값과 유지**: 로그인했고 내 도서관이 있으면 처음부터 "내 도서관"이 켜져 있습니다. 사용자가 바꾼 값은 이 브라우저에서 새로고침해도 유지됩니다 [확정] (spec R5, AC-16).
   - 저장 위치는 기존 검색 설정 저장소(`web/src/features/search/searchSettings.ts`, `chaekcheck.searchSettings.v1`)입니다.
   - 지금 `scope`는 주소(`scope=joinable`)에도 있습니다. 주소 값과 저장 값 가운데 어느 쪽이 이기는지는 설계에 없으므로 dev가 정하고 보고합니다.
4. **검색에 넘기기** (`SearchPage.tsx`, `InstantResults.tsx`, `DirectResults.tsx`, `useHoldings.ts`, `web/src/features/book/BookPage.tsx`)
   - 로그인 후에는 스위치와 상관없이 직접 추가 `libraryIds`와 서버 지역을 보냅니다.
   - "내 도서관"이면 `scope=joinable`, "전체"면 `scope=all`입니다.
   - 두 검색(도서관에서 직접 찾기, 수집 목록 책 검색)과 책 화면에 모두 같은 규칙을 씁니다.
5. **다 불러온 뒤 다시 검색** [확정] (사용자 승인, 2026-10-04, 마무리 검토)
   - 읽기가 끝나기 전에 시작한 검색이 있으면, 다 불러온 뒤 "내 도서관" 기준으로 첫 묶음부터 한 번 다시 합니다(스위치를 바꿀 때와 같은 동작).
- 테스트(Vitest)
  - 줄 상태 넷, 스위치 글자(로그인 전후)
  - 기본값 "내 도서관"(내 도서관 있음) / 끈 값이 새로고침 뒤 유지(AC-16)
  - 요청에 `libraryIds`가 두 스위치 값 모두에서 들어감(AC-6), 비어 있으면 `scope=joinable` + `libraryIds` 없음(AC-7)
  - 다 불러온 뒤 한 번 다시 검색
  - 로그인 전 요청이 사이클 05와 같음(AC-14)
- 확인 방법: `npm test`, `npm run build`, `npm run lint`
- 위험: 중간

### 11단계: 결과 줄의 "직접 추가"와 정렬 (의존: 8단계)

1. **정렬** (파일: `web/src/features/search/sortBatch.ts`)
   - `SortContext`에 `chosen: ReadonlySet<number>`를 더하고, 제목 안 순서의 가장 앞 단계로 둡니다(`chosen` → 지금의 0~3). 설명 주석도 고칩니다.
   - `chosen` 집합은 첫 `targets`에서 만듭니다(C16). `holdingView.ts`, `DirectResults.tsx`의 컨텍스트 만들기도 고칩니다.
2. **결과 줄** (파일: `web/src/features/search/ResultRow.tsx`)
   - `chosen`이면 가입 자격 배지("가입 자격 확인 필요", 자격 요약)와 가입 주의 문구(`joinCaution`)를 숨기고, "직접 추가" 표시 하나만 보입니다 [확정 규칙] (사용자 제안, 2026-10-04). 글자 "직접 추가"는 [안]입니다.
3. **책 먼저 고르기** (파일: `web/src/features/search/BookList.tsx` 등): `joinTier: 'CHOSEN'`을 받아도 깨지지 않게 합니다(목록의 표시·정렬).
- 테스트: `sortBatch.test.ts`(`chosen`이 가입 가능·주의·방문·확인 필요보다 앞), `ResultRow.test.tsx`(`chosen`이면 배지·주의 없음 + "직접 추가", AC-5)
- 확인 방법: `npm test`, `npm run build`, `npm run lint`
- 위험: 낮음

### 12단계: S10 `/my-libraries` (의존: 9·10단계)

1. **라우트** (파일: `web/src/main.tsx`, 새 화면 예: `web/src/features/mylibrary/MyLibrariesPage.tsx`)
   - 로그인 확인이 끝날 때까지 "불러오는 중"을 보입니다. 로그인 전으로 확인되면 S1로 보냅니다.
   - 로그인 기능이 꺼져 있으면 라우트를 그리지 않습니다(기존 `LoginOnly`와 같은 방식).
   - [확정] (사용자 승인, 2026-10-04, 마무리 검토)
2. **화면** (가운데 한 단, 데스크톱·태블릿·모바일 공통)
   - 맨 위 한 줄: "누구나 가입하는 도서관 N곳도 늘 내 도서관에 들어 있어요 ▸"(눌러서 펼침, `eligibility=OPEN` 줄)
   - 여섯 구역을 위에서 아래로 둡니다 [확정] (사용자 제안, 2026-10-04).
     1. 거주 지역 선택: 고른 시군구 + [변경] → S2
     2. 거주 지역으로 자동: `matchedBy`에 `RESIDENCE`. 빼기 버튼 없음. "N곳 ▸"로 접어 둠
     3. 직장 지역 선택: 고른 시군구 + [변경] → S2
     4. 직장 지역으로 자동: `matchedBy`에 `WORK`. 빼기 버튼 없음. 접어 둠. 둘 다 맞는 도서관은 두 목록 모두에 보임
     5. 직접 도서관 추가
        - 이름 검색 칸. 거르기는 화면 안에서 합니다(NFC + 공백 제거 + 부분 일치 [안]).
        - 이름이 맞는 서비스 도서관 → [추가]
        - **이미 직접 추가한 곳만** "이미 있음"으로 흐리게 합니다. 지역으로 자동 들어온 곳, 누구나 가입하는 곳도 [추가]할 수 있습니다 [확정] (사용자 승인, 2026-10-04, 마무리 검토).
     6. 직접 추가한 도서관 N/20: 줄마다 이름 · [빼기]. 가입 자격 배지는 없습니다. 꺼진 도서관(공개 목록에 없는 번호)은 "지금은 쓸 수 없는 도서관이에요" + [빼기]이고 N에 셉니다.
   - [변경]이 S2를 거주(또는 직장) 칸이 열린 채로 여는지는 [안]입니다(사용자 확인).
   - 공개 목록은 **해석한 지역 ID**로 부릅니다(ADR-0049).
3. **추가·빼기는 누르는 즉시 저장**합니다. 따로 "저장" 버튼은 없습니다 [확정].
   - 화면에 먼저 반영하고 요청을 보냅니다. 응답별 처리:

     | 응답 | 화면 |
     |---|---|
     | 409 | 되돌리고 "직접 추가는 20곳까지예요. 하나를 빼면 추가할 수 있어요" |
     | 404 `library_not_found` | 되돌리고 안내(문구는 flow에 없음. dev 자리 글, 사용자 확인) |
     | 500·연결 끊김 | 되돌리고 "저장하지 못했어요. 잠시 뒤 다시 해 주세요" |
     | 401 | 로그인 전 S1 |
     | 403 `csrf_invalid` | 한 번 다시(기존 규칙) |

   - 20곳이 차면 [추가]가 흐려지고 위 409 문구를 보입니다(AC-8).
4. **그 밖의 상태** [안 문구, 규칙 확정]
   - 불러오는 중 / 불러오기 실패("다시 시도")
   - 비어 있음: "지역을 고르거나 도서관을 추가하세요"
   - 검색 결과 없음: "이름이 맞는 도서관이 없어요"
5. 뒤로 가면 보던 S1입니다. 화면에서 바꾼 내용은 S1 줄과 다음 검색에 반영됩니다.
- 테스트(Vitest)
  - 여섯 구역과 누구나 가입 줄의 분류(`matchedBy`, OPEN)
  - 이름 검색(NFC·공백)
  - 자동·누구나 가입 도서관도 [추가] 가능, 이미 있음 흐림
  - 즉시 저장과 응답별 되돌리기
  - 20곳 찼음, 꺼진 도서관 줄
  - 로그인 전 직접 접근 → S1, 새로고침 때 "불러오는 중"
  - 도서관 이름을 글자로만 그림
- 확인 방법: `npm test`, `npm run build`, `npm run lint`, Playwright
- 위험: 중간

### 13단계: 동의·처리방침·탈퇴 안내 문구 (의존: 없음)

1. **S6 고지 표와 동의 본문** (파일: `web/src/features/auth/legalText.ts`의 `COLLECTION_NOTICE`, 필요하면 `PRIVACY_COLLECTION_BODY`)
   - 항목에 더할 것: "거주지 지역(시군구), 직장 지역(시군구), 직접 추가한 도서관(고른 경우)"
   - 목적에 더할 것: "내 지역에서 가입할 수 있는 도서관을 찾아 검색에 쓰기"(지역), "직접 고른 도서관을 검색 결과에서 먼저 보여 주기"(직접 추가)
   - 이 내용은 [확정] (사용자 승인, 2026-10-04, 마무리 검토)입니다. 최종 문구는 배포 전 사용자 검토라서 `reviewed: false`를 유지합니다.
   - 보유 기간은 지금 문구 그대로입니다.
2. **S9 처리방침** (같은 파일 `PRIVACY_POLICY_SECTIONS`의 "처리하는 개인정보와 목적", "정보주체의 권리와 행사 방법")
   - 같은 항목과 목적을 더합니다.
   - 내 도서관 화면에서 언제든 비우거나 지울 수 있다는 점을 적습니다(spec R7).
3. **버전은 그대로**입니다(C23). `DocumentVersionsMatchWebTests`가 그대로 통과해야 합니다.
4. **S7 탈퇴 안내** (파일: `web/src/features/auth/WithdrawDialog.tsx`): 지워지는 것 목록에 "저장한 지역과 내 도서관"을 더합니다 [확정].
- 테스트: `SignupPage.test.tsx`·`LegalPage.test.tsx`(새 항목 보임, AC-15), `Withdraw.test.tsx`(새 줄), 백엔드 `DocumentVersionsMatchWebTests`
- 확인 방법: `npm test`, `npm run build`, `./gradlew build`
- 위험: 낮음

### 14단계: 화면 확인과 전체 확인 (의존: 1~13단계)

- Playwright로 데스크톱 1280 → 태블릿 768 → 모바일 375를 봅니다.
  - S1(로그인 전·후, 빈 줄, 긴 줄의 "외")
  - S2 저장 상태
  - S10 여섯 구역과 접힘
  - S11(모바일은 아래에서 올라옴)
  - 결과 줄 "직접 추가"
  - S6·S9·S7 문구
- 켜짐과 꺼짐을 모두 봅니다. 꺼짐이면 사이클 05와 같아야 합니다(줄, 스위치, 라우트).
- 두 브라우저(또는 일반 창 + 시크릿 창)로 AC-1을 봅니다.
- 아래 AC 표의 결과를 `# 사이클 06` 절에 적습니다.

## 테스트

- 단위
  - `PlanOptions.apply`(`chosen` 예외)
  - `JoinTier.of`
  - `libraryIds` 파서
  - `sortBatch`, `authResult`, S10 이름 거르기, S11 조건
- 통합(모듈, `db-test`)
  - `ModularityTests`: `ApplicationModules.of(ChaekcheckApplication.class).verify()`. 새 모듈 `mylibrary`(`allowedDependencies = auth, library, region`), 순환 없음, `catalog`·`availability`가 `auth`·`mylibrary`에 의존하지 않음
  - `DocumentationTests`
  - `LibraryCatalogTests`(계획 규칙), `GET /api/v1/libraries`, 검색 4곳의 `libraryIds`
  - `mylibrary` API 전부, 켜짐·꺼짐 두 컨텍스트
  - **동시성**: 19곳에서 동시에 두 개 추가, 저장과 탈퇴 경합 두 순서, 잠금 대기
  - **발행 저장소**: 정상 처리 뒤 기록 없음, 실패 listener 뒤 재시작으로 다시 처리
  - 사이클 05 기존 테스트 전부(회귀)
- 웹(Vitest): 8~13단계 테스트
- 화면: Playwright 1280 → 768 → 375. 앱 안 브라우저로 했으면 보고합니다.

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 다른 브라우저에서 로그인해도 같은 지역 | 통합(PUT→GET) + 웹 테스트 + 수동(두 브라우저) | 5, 9, 14 |
| AC-2 로그인 전 지역 선택에 서버 저장 요청 없음 | 웹 테스트 + 수동(개발자 도구 네트워크) | 9, 14 |
| AC-3 처음 로그인 때 S11 한 번, 저장/저장하지 않기 | 웹 테스트 + 수동(DB 조회로 행 유무) | 9, 14 |
| AC-4 직장 "서울 중구" → "지역으로 자동"에 서울 재직 가능 도서관 | 통합(`matchedBy`) + 웹 테스트 + Playwright | 3, 12 |
| AC-5 직접 추가 → S10에 보이고 계획 맨 앞, 배지 없이 "직접 추가", 빼면 사라짐 | 통합(계획) + 웹 테스트(`ResultRow`, S10) + Playwright | 2, 4, 11, 12 |
| AC-6 "내 도서관만" = 자동 ∪ 직접 추가, "전체"에서도 직접 추가가 맨 앞 | 통합(스트림 `targets`) + 웹 테스트(요청 파라미터) + 수동(`targets` 확인) | 2, 4, 10 |
| AC-7 비어 있으면 누구나 가입만 | 통합(`scope=joinable`, 지역·`libraryIds` 없음) + 웹 테스트 | 2, 10 |
| AC-8 21번째 막기 | 통합(409, **동시 추가**) + 웹 테스트(S10) | 5, 12 |
| AC-9 폐지·대체 지역(9001·9002) | 웹 테스트 + 수동(서버에 9001·9002를 넣은 뒤 화면) | 9, 14 |
| AC-10 꺼진 도서관은 계획에 없고 S10에서 안내 | 통합(계획에서 무시, PUT 404, GET 유지) + 웹 테스트 | 2, 5, 12 |
| AC-11 탈퇴하면 두 표 행 없음, 발행 기록 없음 | 통합(listener, 멱등, **재시작 다시 처리**) + 수동(DB 조회) | 5, 6 |
| AC-12 지운 계정 토큰으로 저장해도 줄 없음 | 통합(지운 계정 토큰 401, 서비스 직접 호출, **저장·탈퇴 경합**) | 1, 5 |
| AC-13 모두 비우면 행 없음 | 통합 + 수동(S10에서 비운 뒤 DB 조회) | 5, 12 |
| AC-14 로그인 전 검색·지역·스위치가 사이클 05와 같음 | 기존 테스트(켜짐·꺼짐) + 웹 테스트 + Playwright | 4, 10, 14 |
| AC-15 S6 고지 표·S9에 새 항목 | 웹 테스트 + Playwright | 13 |
| AC-16 처음부터 "내 도서관", 끈 값이 새로고침 뒤 유지 | 웹 테스트 + 수동 | 10, 14 |
| AC-17 첫 가입 직후에만 "가입했어요" | 웹 테스트(+ 서버 방식이면 통합) + 수동(실제 제공자로 가입·재로그인) | 7, 14 |
| AC-18 탈퇴 재인증 만료·`state` 불일치 문구, 계정 유지 | 통합(`LoginCallbackTests`) + 웹 테스트 | 7 |

## 완료 기준

- [ ] spec AC-1~AC-18을 위 표의 방법으로 모두 확인함(수동 항목 포함)
- [ ] `backend/`에서 `./gradlew build` 통과. 포함 항목: `ModularityTests`(`mylibrary` 허용 의존 셋), `DocumentationTests`, 켜짐·꺼짐 테스트, 동시성 테스트, 재시작 다시 처리 테스트
- [ ] `web/`에서 `npm test`, `npm run build`, `npm run lint` 통과, 1280/768/375 확인
- [ ] 문서 버전 값(`application.yml`, `documentVersions.json`)이 바뀌지 않음
- [ ] 기존 changeset을 고쳤다면 로컬 `db`·`db-test`를 초기화해 다시 적용함
- [ ] "[확인 필요]" 결과, 사용자 답, 설계와 달라진 점을 `docs/plan-feedback.md` `# 사이클 06` 절에 정리하고 사용자에게 전달함

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 결과에 따라 할 일 | 막는 단계 |
|---|---|---|---|
| `republish-outstanding-events-on-restart`가 Modulith 2.1.1에서 실패(`FAILED`) 기록도 다시 처리하는지 | 공식 문서(https://docs.spring.io/spring-modulith/reference/events.html) + 6단계 시험 | 처리하면 설계대로. 안 하면 멈추고 사용자에게(ADR-0051 D안 등 재결정) | 6 |
| `ConditionalOnAuthEnabled`를 `auth` 루트로 옮겨도 `ModularityTests` 통과 | dev 프로토타입 | 통과하면 설계대로. 안 되면 다른 방법을 사용자에게 제안 | 1, 5 |
| `GET /api/v1/libraries` 응답 크기(278곳) | dev 측정(바이트, 압축 전후) | 측정값 보고. 너무 크면 사용자에게 알림(ADR-0049 "감수하는 점") | 3 |
| `signup_success`를 서버 결과 코드로 둘지 웹 상태로 둘지 | dev 안 → 사용자 선택 | 고른 방식으로 7단계 | 7 |
| retro "15분 동안 다른 모듈 API에서 통과"가 `/api/v1/me/**` 밖 경로만 뜻하는지 | dev 코드 확인 | 결과 보고 | 없음 |
| 서버가 여러 대일 때 재시작 다시 처리의 동작 | 확인 불가(문서에 없음) | 이번에는 없음. 여러 대로 늘릴 때 다시 확인 | 나중 |
| 동의 목적 문구를 얼마나 구체적으로 써야 하는지, 필수 동의 근거 | 공식 문서 확인(개인정보보호위원회 안내서), 사용자 검토 | 자리 글(`reviewed: false`)로 진행, 배포 전 사용자 검토 | 배포 |
| S10 [변경]이 S2를 해당 칸이 열린 채로 여는지 | 화면을 사용자에게 보임 | 사용자 답대로 | 12(마무리) |
| 화면 문구 세부(불러오기 실패, 20곳 찼음, 꺼진 도서관, 검색 결과 없음, `library_not_found`), "직접 추가" 표시 글자, 줄의 [빼기] 위치 | 화면을 사용자에게 보임 | 사용자 답대로 | 11, 12(마무리) |
| `chosen`인데 지역 규칙이 안 맞는 도서관의 `priorityGroup` 값 | 설계에 없음. dev가 정함 | 정한 값 보고 | 2 |
| 스위치 값 저장(`searchSettings`)과 주소 `scope`의 관계 | 설계에 없음. dev가 정함 | 정한 방식 보고 | 10 |

## 이번에 하지 않는 것

- 책 번호 유지(수집기를 갱신 가능하게 바꾸는 일 포함), 관심 책, 알림, 책을 저장하는 모든 기능. 관심 책은 `mylibrary`에 넣지 않습니다(ADR-0048).
- 대학·회사 등 소속 기관 전자도서관 자격의 입력과 판정
- 이메일·전화 등 연락처, 별명·프로필 사진
- 지역 자동 감지(위치 권한, IP), 여러 프로필·가족 계정, 내 도서관 공유
- 직접 추가한 도서관별 메모·정렬 직접 지정
- 로그인하지 않은 상태에서 서버에 저장하는 것
- 자동으로 들어온 도서관을 하나씩 빼기(R4 [확정]: 지역을 바꿔서 조절)
- 이미 가입한 계정에 다시 동의를 받는 화면, 문서 버전 올리기
- 설정 창(S4)에 내 도서관 입구 두기
- 다음 묶음 API·도서관별 더 보기에 `libraryIds` 더하기
- `region`의 판정 규칙, `auth`의 로그인 동작, 보안 필터 경로, `fetch-service/`
- 검색 화면 다듬기(책 묶기 안내, 책검색 화면, 정렬, 이상한 곳 수정), 배포

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 `# 사이클 06` 절에 **무엇이 달라졌는지와 이유**를 적습니다. 사용자 발언이면 그대로 옮깁니다.

- 사용자 답: `signup_success` 방식, S10·S1 문구, "직접 추가" 글자, [변경]·[빼기] 위치
- [확인 필요] 표 각 행의 결과. 특히 다음은 꼭 적습니다.
  - `FAILED` 기록 재처리 여부와 6단계 시험 결과
  - `ConditionalOnAuthEnabled` 이동 결과
  - `GET /api/v1/libraries` 응답 크기
  - retro 문장 확인 결과
- 정한 이름과 방법
  - 클래스·패키지 배치, 해석기 등록 방법
  - `lockIfExists`를 `DELETE`에도 걸었는지
  - `chosen` 줄의 `priorityGroup`
  - 스위치 값 저장과 주소 `scope`의 관계
  - 재시작 시험에서 listener를 실패시킨 방법
  - 웹 파일 이름
- 설계와 달라진 점, 새로 알게 된 제약. 예:
  - `JoinTier` 순서 값이 밀려 생긴 영향
  - 다음 묶음에서 `chosen` 표시가 유지되지 않는 곳
  - 잠금 대기 시간 측정값
  - 재시작 다시 처리가 테스트 DB에서 다른 테스트에 준 영향
- AC 확인표(14단계)
