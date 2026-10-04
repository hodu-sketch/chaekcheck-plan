# 설계 제안: 사이클 06 내 도서관 (지역·직접 추가 도서관 저장과 검색 연결)

- 작성: 2026-10-04 (architect 서브에이전트). 근거: `scope.md`, `spec.md`, `flow.md`, `docs/current/*`, ADR-0001·0003·0013·0027·0036·0037·0038·0041, `integration-plan.md` 3.2~3.5, 사이클 05 `retro.md`, dev 코드(읽기만).
- 이 문서의 이름·경로·코드 값은 따로 표시하지 않았으면 모두 [안]입니다. 사용자가 정한 것([확정])은 다시 열지 않았습니다.
- 쉬운 설명과 결정: `easy/2026-10-04-design-decisions.html`

## 현재 상태 (dev 코드, 2026-10-04 확인)

| 대상 | 지금 |
|---|---|
| 매핑 모듈 | 없음. `auth` 안의 `AccountDeletedLog`만 `AccountDeleted`를 받음 |
| 표 | `modulith.event_publication`은 있음(`completion-mode: delete`). 재시작 때 다시 보내기 설정은 **없음** |
| `auth` 공개 API | `AccountId(long)`, `AccountDeleted(AccountId)`. `AccountDeletion`·`ConditionalOnAuthEnabled`는 `auth.internal` |
| 보호 경로 | `SecurityConfiguration.PROTECTED` = `/api/v1/me`, `/api/v1/me/**`. 액세스 쿠키 `Path=/api/v1/me`. CSRF `csrf.spa()`, 웹훅 두 개만 뺌 |
| 계정 존재 확인 | `AccountJwtAuthenticationConverter`가 `/api/v1/me/**` 요청마다 `auth.account`에 계정이 있는지 이미 확인(없으면 401, DB 오류 500). retro의 "15분 통과"는 `/api/v1/me/**` 밖 경로에만 해당. 남는 틈은 "확인 → 다른 탭의 탈퇴 커밋 → 우리 쓰기 커밋" 하나(결정 6) |
| `library` | `planSearch(residenceIds, workIds, PlanOptions(scope, visit))`. 지역이 있을 때 지역 규칙이 맞지 않는 도서관은 계획에서 빠짐(`place()`가 null). `findEnabledTarget(id)` 있음 |
| 정렬 | 서버 `JoinTier`(MY_SIGUNGU, MY_SIDO, OPEN, VISIT_ONLY, NEEDS_CHECK)가 `/api/v1/books` 정렬 첫 키. 웹 `sortBatch.ts`의 `joinTier`(0~3)가 한 책 안의 순서 |
| `planSearch`를 부르는 API | `GET /api/v1/books`, `GET /api/v1/books/{bookId}`, `GET /api/v1/ebook-searches/stream`, `GET /api/v1/book-availabilities/stream`. 다음 묶음 두 API는 계획에서 나온 `candidates`만 받음 |
| 도서관 목록 REST | **없음**(이름은 스트림 `targets`에서만 나옴) |
| 웹 | `regionStorage.ts`(`chaekcheck.regions.v1`, 칸마다 20곳, 고른 순서), `LibraryScopeToggle`(`all`/`joinable`) |

## 이번 슬라이스가 요구하는 것

| 요구/AC | 설계에서 필요한 것 |
|---|---|
| R1, AC-1·2 | 지역 읽기·통째로 바꾸기 API(로그인 필요) |
| R2, AC-3, S11 | 지역 읽기가 비었는지로 판단. "다시 묻지 않음"은 브라우저 저장 |
| R3, AC-5·8·10 | 하나씩 추가·빼기, 20곳 검사(동시 요청 포함), 켜진 도서관 확인, 꺼진 도서관 알아보기 |
| R4, AC-4, S10 2·4번 | 거주·직장별 가입 가능 도서관을 나눠 주는 방법(결정 2) |
| S10 5번 | 서비스 도서관 이름 목록(결정 2·5) |
| R5, AC-6·7·16 | 검색 API 4곳에 `libraryIds`, 자격 무관 포함, `scope=joinable`이어도 남김(결정 4) |
| R3 직접 추가가 앞 [확정] | 계획 순서, `JoinTier`, 웹 `sortBatch` 세 곳에 같은 규칙(결정 4) |
| R6, AC-9 | 서버는 저장 값 그대로 돌려주고 웹이 `/regions/resolutions`로 해석. 저장할 때는 쓸 수 없는 ID를 422로 막음 |
| R7, AC-15 | `PRIVACY_COLLECTION` 문구에 항목 추가, 버전 그대로 [확정]. 스키마 변경 없음 |
| R8, AC-11 | `AccountDeleted` listener(멱등), 실패 기록 다시 보내기(결정 7) |
| R8, AC-12 | 요청 필터 확인(있음) + 쓰기 트랜잭션 안의 확인(결정 6) |
| AC-13 | 빈 목록이면 행 없음 |
| R8-1 [확정] | 새 모듈 이름(결정 1), 경로(결정 3) |
| R9, AC-14 | `libraryIds`가 없으면 지금과 같음. 로그인이 꺼져 있으면 매핑 API 404 |

## 결정 1: 매핑 모듈의 이름 (패키지·스키마)

- **A안 `mylibrary`** (`com.chaekcheck.mylibrary`, 스키마 `mylibrary`): 화면 이름 "내 도서관"·주소 `/my-libraries`와 같은 말. 맡은 일이 이름에 드러나 관심 책 같은 다른 회원 자료가 들어오기 어려움. 지역 저장도 여기 있어 이름보다 조금 넓지만 지역은 도서관을 고르는 입력이라 범위 안. 되돌리기 쉬움(배포 전)
- B안 `patron`: 도서관 용어. 사람 자료가 모두 들어올 자리처럼 보여 "매핑 전용"과 어긋날 위험
- C안 `member` 그대로: 문서 수정이 적지만 사용자가 이 이름 대신 매핑 전용을 고름
- **추천: A안** [안]. 표 `mylibrary.account_region`, `mylibrary.account_library`. ADR-0036에 덧붙임

## 결정 2: S10의 자동 목록(거주·직장 따로)과 "누구나 가입" 줄을 얻는 방법

- **A안 `library`의 공개 REST 하나**: `GET /api/v1/libraries?residenceRegionIds=&workRegionIds=`(인증 없음, 회원을 모름). 켜진 도서관 모두 + 줄마다 `eligibility`, `matchedBy`(RESIDENCE/WORK). 웹이 거주 자동·직장 자동·누구나·직접 추가 줄의 이름과 배지·꺼진 도서관·이름 검색을 모두 이 목록으로 만듦. `LibraryCatalog.eligibilityFor(residenceIds, workIds)` 추가. 장점: API 하나, 자격 판정은 `library`에만, R6·ADR-0037 그대로. 단점: 278곳 전체를 내려줌(크기 [확인 필요: dev 측정]), 도서관이 수천 곳이 되면 서버 이름 검색으로 바꿔야 함
- B안 매핑 모듈이 서버에서 계산해 `/api/v1/me/…`에 넣음: 웹 호출 하나. 단점: 폐지 지역 해석이 서버·웹 두 곳, 매핑 모듈이 자격을 다뤄 "매핑 전용"이 흐려짐, 이름 검색은 따로 필요
- C안 `library` REST가 세 목록으로 나눠 줌: 응답이 작지만 이름·배지·이름 검색에 API가 하나 더 필요
- **추천: A안** [안]. 지역이 맞지 않는 도서관(이름 검색·직접 추가에 필요)의 `eligibility`는 지금 값 `UNKNOWN`("가입 자격 확인 필요")을 씀 [안, 사용자에게 질문]

## 결정 3: 저장 API 모양 (경로는 `/api/v1/me/` 아래로 고정)

`/api/v1/me/` 아래면 `auth`를 고치지 않고 로그인 확인·계정 존재 확인·CSRF가 그대로 적용됨. 다른 경로는 쿠키 경로와 `SecurityConfiguration`을 바꿔야 해서(ADR-0042·0044) 후보에서 뺌.

- **A안 지역은 통째로, 직접 추가는 하나씩**: `GET`/`PUT /api/v1/me/regions`, `GET /api/v1/me/libraries`, `PUT`/`DELETE /api/v1/me/libraries/{libraryId}`. 즉시 저장과 맞고, 두 탭에서 고쳐도 덮어쓰지 않음, 20곳 초과·꺼진 도서관을 409/404로 알림, 멱등. 단점: 로그인 직후 GET 둘
- B안 둘 다 통째로: 단순하지만 누를 때마다 전체 전송, 다른 탭의 변경을 덮어씀
- C안 문서 하나(`/api/v1/me/library-settings`): GET 하나지만 덮어쓰기 위험이 가장 큼
- **추천: A안** [안]

## 결정 4: `libraryIds`를 계획에 넣고 "직접 추가가 앞"을 지키는 방법

공통 [안]: `PlanOptions`에 `Set<Long> libraryIds`. 꺼졌거나 없는 ID는 무시(AC-10). 지역 규칙이 안 맞아 빠지던 도서관도 직접 추가했으면 계획에 넣고 자격은 `UNKNOWN`. `scope=joinable`이면 `joinable() || 직접 추가`를 남김. 받는 API는 `planSearch`를 부르는 네 곳. 웹만 순서를 바꾸는 방법은 `/api/v1/books`가 서버에서 정렬·페이지를 나눠 맞출 수 없어 뺌.

- **A안 `SearchTarget.chosen` 표시 칸 추가, `priorityGroup`은 그대로**: 계획은 직접 추가 묶음이 맨 앞, 그 뒤는 지금 순서(ADR-0027). `JoinTier`에 첫 값 `CHOSEN`, 웹 `sortBatch`는 `chosen`을 가장 먼저. 장점: 원래 무리·배지(내 시군구 등) 유지, 웹의 `priorityGroup` 코드 그대로. 단점: 응답 칸·값 하나 추가(호환됨)
- B안 새 무리 값 `PriorityGroup.CHOSEN`: 칸이 늘지 않지만 원래 무리를 잃고 웹 코드·테스트를 바꿔야 함(ADR-0027이 같은 이유로 새 무리 값을 고르지 않음)
- **추천: A안** [안]. 검증 순서: 조건 → `filter` → `scope` → `visit` → `libraryIds` → 지역. 쉼표 구분 양의 정수, 최대 20, 중복 합침. 오류 400 `validation_error`, `invalid_format`/`too_many`

## 결정 5: S10 이름 검색 API

결정 2를 A안으로 정하면 따로 정할 것 없음(브라우저가 같은 목록을 거름. NFC + 공백 제거 + 부분 일치 [안]). B·C안일 때만: `GET /api/v1/libraries?name=`(서버가 거름) 또는 이름 목록 한 번 받아 브라우저가 거름(추천).

## 결정 6: 쓰기 때 계정이 아직 있는지 확인 (AC-12)

- A안 지금 필터 확인만: 변경 없음. 같은 사람이 저장과 탈퇴를 거의 동시에 하면 지워진 계정의 줄이 남고 영영 안 지워짐
- **B안 쓰기 트랜잭션 안에서 `auth` 공개 API로 계정 줄을 잠금**: `AccountPresence.lockIfExists(AccountId)`(호출한 트랜잭션 안에서만), `SELECT 1 FROM auth.account WHERE id = ? FOR NO KEY UPDATE`. 탈퇴의 DELETE는 FOR UPDATE를 잡아 우리 커밋까지 기다리고, 커밋 뒤 listener가 새 줄까지 지움. 탈퇴가 먼저면 줄이 없어 401. 같은 계정의 저장이 한 줄로 서서 20곳 상한도 동시 요청에서 정확. 근거: PostgreSQL 13.3 Row-Level Locks(https://www.postgresql.org/docs/current/explicit-locking.html, 2026-10-04 확인, architect) [확정: 공식 문서]. 단점: `auth` 공개 메서드 하나, 두 모듈이 한 트랜잭션을 나눠 씀(나중에 분리하면 C안으로)
- C안 하루 한 번 대조해 지움: 분리해도 그대로지만 최대 하루 남음(AC-12에 엄밀히 맞지 않음)
- **추천: B안** [안]. 함께: `auth`가 `AccountId` 인자 해석기를 등록해 다른 모듈 컨트롤러가 `AccountId`를 인자로 받음

## 결정 7: 실패한 `AccountDeleted` listener 기록 다시 보내기

공식 문서(https://docs.spring.io/spring-modulith/reference/events.html, 2026-10-04 확인, architect): `spring.modulith.events.republish-outstanding-events-on-restart`, 2.0부터 `IncompleteEventPublications`·`FailedEventPublications`. 여러 대일 때 동작은 문서에 없음.

- **A안 재시작 때 자동으로 다시 보내기** (`republish-outstanding-events-on-restart: true`): 설정 한 줄, 서버 한 대 방침에 맞음, listener 멱등. 단점: 다음 재시작까지 남음
- B안 주기 작업으로 다시 보내기: 재시작 없이 회복되지만 작업을 둘 자리와 주기를 정해야 함
- **추천: A안** [안]

## 모듈·데이터·API 초안 (추천안 기준)

- 모듈 `mylibrary`: `com.chaekcheck.mylibrary`(루트 공개 없음), `mylibrary.internal`(JdbcClient 저장소, 컨트롤러, listener). 구독 `AccountDeleted` → 두 표 `DELETE … WHERE account_id = ?`(멱등). 발행 없음. 모든 빈을 `chaekcheck.auth.enabled`에 묶음(`ConditionalOnAuthEnabled`를 `auth` 루트로 옮겨 공개 [안]). 표는 항상 만듦
- `auth` 추가 [안]: `AccountId` 인자 해석기, `AccountPresence`
- `library` 추가 [안]: `PlanOptions.libraryIds`, `SearchTarget.chosen`, `LibraryCatalog.eligibilityFor`, REST `GET /api/v1/libraries`
- `catalog`: `JoinTier.CHOSEN`, `BookParams.libraryIds`. `availability`: 스트림 두 곳 `libraryIds` 파서

표 [안] (스키마 `mylibrary`, Liquibase `db/changelog/mylibrary/001-mylibrary-schema.yaml`):

| 표.컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| account_region.account_id | bigint | NOT NULL | `auth.account.id`(FK 없음) |
| account_region.kind | text | NOT NULL, CHECK IN ('RESIDENCE','WORK') | |
| account_region.region_id | bigint | NOT NULL, CHECK > 0 | `region` ID(FK 없음). 폐지돼도 남음 |
| account_region.position | smallint | NOT NULL, CHECK 0~19 | 고른 순서 [안, 사용자에게 질문] |
| account_region.created_at | timestamptz | NOT NULL DEFAULT now() | |
| PK (account_id, kind, region_id) | | | 저장은 같은 트랜잭션에서 DELETE 뒤 INSERT |
| account_library.account_id | bigint | NOT NULL | (FK 없음) |
| account_library.library_id | bigint | NOT NULL, CHECK > 0 | `library` ID(FK 없음). 꺼져도 남음 |
| account_library.added_at | timestamptz | NOT NULL DEFAULT now() | 목록 순서 |
| PK (account_id, library_id) | | | `INSERT … ON CONFLICT DO NOTHING`, 20곳은 잠금 뒤 count. 꺼진 도서관도 20곳에 셀지 [안, 사용자에게 질문] |

API [안]:

| 메서드 | 경로 | 모듈 | 성공 | 오류 |
|---|---|---|---|---|
| GET | `/api/v1/me/regions` | mylibrary | 200 `{"residenceRegionIds":[1114],"workRegionIds":[1101]}` | 401, 500 |
| PUT | `/api/v1/me/regions` | mylibrary | 200 (저장한 값) | 400 `validation_error`, 422 `invalid_region`, 401, 403 `csrf_invalid`, 500 |
| GET | `/api/v1/me/libraries` | mylibrary | 200 `{"libraryIds":[12,207],"max":20}` | 401, 500 |
| PUT | `/api/v1/me/libraries/{libraryId}` | mylibrary | 204 | 404 `library_not_found`, 409 `library_limit_reached`, 401, 403, 500 |
| DELETE | `/api/v1/me/libraries/{libraryId}` | mylibrary | 204(없어도) | 401, 403, 500 |
| GET | `/api/v1/libraries?residenceRegionIds=&workRegionIds=` | library | 200 `{"libraries":[{"id":12,"name":"…","eligibility":"ELIGIBLE","matchedBy":["WORK"],"visitRequired":false,"cautioned":false,"eligibilitySummary":"…"}]}` | 400, 422 |
| 기존 4곳 | `/api/v1/books`, `/books/{id}`, `/ebook-searches/stream`, `/book-availabilities/stream` | 기존 | + `libraryIds`, `targets.libraries[].chosen`, `joinTier` `CHOSEN` | 400 `libraryIds` |

그 밖의 작은 제안 [안]: S11 "다시 묻지 않음"은 브라우저 저장(`chaekcheck.regionImport.v1`, 저장하지 않기를 누른 계정 번호). "내 도서관만" 스위치 값도 브라우저 저장. 첫 가입 안내 결과 코드 `signup_success`. 동의 문구 초안: 수집 항목 "거주지 지역(시군구), 직장 지역(시군구), 직접 추가한 도서관(고른 경우)", 목적 "내 지역에서 가입할 수 있는 도서관을 찾아 검색에 쓰기".

## 확인 필요 / 사용자 결정 필요

| 항목 | 확인 방법 |
|---|---|
| 결정 1~4·6·7 | 사용자에게 질문(캔버스) |
| 지역 자격이 맞지 않는 직접 추가 도서관의 배지를 `UNKNOWN`으로 | 사용자에게 질문 |
| `visit=none`일 때 직접 추가한 방문 가입 도서관도 뺄지(제안: 뺀다) | 사용자에게 질문 |
| 스위치가 "전체"일 때도 `libraryIds`를 보내 직접 추가를 앞에 둘지(제안: 보낸다) | 사용자에게 질문 |
| 꺼진 도서관도 지울 때까지 20곳에 셀지 | 사용자에게 질문 |
| 지역을 고른 순서대로 보일지(`position`) | 사용자에게 질문 |
| `GET /api/v1/libraries` 응답 크기 | dev 측정 |
| `ConditionalOnAuthEnabled`를 루트로 옮겨도 `ModularityTests` 통과 | dev 프로토타입 |
| republish가 2.1.1에서 FAILED 기록도 다시 보내는지 | 공식 문서 + 테스트 |
| 여러 대일 때 republish 동작 | 확인 불가(문서에 없음) |
| 동의 목적 문구의 구체성 | 공식 문서 확인(spec에서 넘어옴) |
| `signup_success`를 서버 결과 코드로 둘지 웹 상태로 둘지 | dev 확인 |
