# 사이클 06 회고: 내 도서관

- 작성: 2026-10-05. 근거: dev `docs/plan-feedback.md` "# 사이클 06"(1166행~), "사이클 밖: 화면 디자인"(1458행~), "# 사이클 06 마무리 확인"(1529행~), dev 코드(`backend/src/main/java/com/chaekcheck/{mylibrary,auth,library}`, `mylibrary/001-mylibrary-schema.yaml`, `web/src/features/mylibrary/`), Modulith 문서 출력(`backend/build/spring-modulith-docs/`), 이 사이클 `design-delta.md`·`flow.md`·`handoff.md`
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`으로 표시합니다. 사용자 말은 dev가 `plan-feedback.md`에 그대로 옮긴 것을 다시 옮겼습니다.
- dev가 구현을 마친 범위: 1~14단계 전부. AC-1~AC-18 모두 통과(dev 확인표 1406행). 사용자가 실제 카카오 계정으로 확인한 것: AC-3, AC-11(탈퇴 뒤 DB 확인), AC-15, AC-17

## 계획대로 된 것

- 새 모듈 `mylibrary`(`allowedDependencies = auth, library, region`), 표 둘 `mylibrary.account_region`·`account_library`(칸·CHECK·PK·FK 없음이 설계와 같음), 저장 API 다섯 개, `AccountDeleted` listener(멱등, 재시작 때 남은 이벤트 다시 처리)
- `auth` 공개 장치 셋: `AccountPresence.lockIfExists`, `AccountId` 인자 해석기, `ConditionalOnAuthEnabled`를 `auth` 루트로
- 검색 쪽 `libraryIds`, `SearchTarget.chosen`, `JoinTier.CHOSEN`(맨 앞), 공개 목록 `GET /api/v1/libraries`(칸 이름 설계 그대로)
- [안]으로 둔 세부 이름은 dev가 하나도 바꾸지 않음(`library_limit_reached`, `matchedBy`, `cautioned`, `chaekcheck.regionImport.v1` 등)
- Modulith `components.puml`(2026-10-05)의 관계가 `docs/current/module-map.md` 구성도와 같음
- 사이클 05 보완 셋(가입 직후 안내, `withdraw_request_expired`, `withdraw_state_mismatch`)
- 새 의존성 없음(사이클 06 범위). 화면 디자인 작업에서 글꼴 하나가 바뀜(아래)

## 달라진 것과 이유

| 계획 | 실제 | 이유 |
|---|---|---|
| S10 여섯 구역 (flow [확정]) | 세 구역: ① 지역 선택([변경] 하나, 안에 거주 / 거주 지역으로 자동 N곳 / 직장 / 직장 지역으로 자동 N곳) ② 직접 도서관 추가 ③ 직접 추가한 도서관 N/20. [변경]은 S2를 거주 탭으로 엶 | 사용자: "지금 지역 선택 누르면 '변경'이 나오지만 안에 토글로 거주/직장이 나오자나 그러면 그냥 지역 선택으로만 두고…", "훔 보니까 따로 지역으로 자동 칸을 두지 말고 지역 선택에 거주 아래에 거주 지역으로 자동 직장 다음에 직장 지역으로 자동 둬라…" (2026-10-05) |
| 결과 줄: 직접 추가면 자격 줄·조건·주의를 숨김(11단계), 가입 정보 버튼은 폰에서만(사이클 03 U-12) | 모든 폭에서 도서관 이름을 누르면 오른쪽(폭 640px 이하는 아래) 작은 창으로 가입 정보. "가입 자격 확인 필요"도 그 안으로. 직접 추가 도서관도 같은 정보를 보임 | 사용자: "태블릿이랑 웹에서도 가입 방법은 따로 아이콘 누르면 아래로 내려서 보이거나 모달로 보이거나 그렇게 해줘 … '직접 추가'도서관도 그 방법에 맞게 보이도록 해줘", "도서관 글자를 클릭하면 보이는 걸로 해줘", "아래가 아니라 오른쪽에 나오도록 해줘" (2026-10-05) |
| 결과 거르기 기본 "전체" (사이클 04 [안]) | 기본 "지금 빌릴 수 있는 책만", 그 탭이 왼쪽. 주소는 "전체"일 때만 `filter=all` | 사용자: "정렬이 지금 빌릴 수 있는 책만이 기본으로 하고 / 왼쪽에 나오도록 해줘", 해석 확인 "응" (2026-10-05) |
| S1 결과 머리 "N월 N일 기준 수집 목록 · 책 N권" (사이클 04) | 없앰. 정렬은 결과 판의 탭 줄 오른쪽, 옆에 "기본 순서" 설명 "?" | 사용자: "'9월 30일~10월 3일 기준 수집 목록 · 책 4권' 이거 정보 필요 없다고 생각해 빼고…", "정렬은 전체/지금 빌릴 수 있는 책만으로 가는게 옳다고 봐 내려줘", "이것도 사용자가 알 수 있도록 설명하는게 필요할 것 같은데" (2026-10-05) |
| 안내 줄: 한 번 보이고 닫을 수 있음 | 다른 페이지로 가면 사라짐(모든 안내에 같음) | 사용자: "바로 가입햇어요가 뜨긴 하는데 이거 한 번만 보여주고 페이지 바꾸면 사라졌으면 해" (2026-10-05) |
| 화면 체계 (사이클 밖) | 토스증권 참고: 회색 바탕 + 흰 카드, 둥근 네모, 글자 크기 6단계 토큰(`--text-xs`~`--text-2xl`), 글꼴 나눔바른고딕, 머리말 "전자도서관 대출 가능 확인", 첫 화면 제목 "지금 빌릴 수 있는 / 전자도서관을 찾아 드려요", S6·S8·S9는 화면 전체를 흰 카드 하나로. 그림자 없음(2026-09-27)은 지킴 | 사용자: "전반적으로 폰트 크기가 너무 작아 그리고 테마도 좀 바꾸고 싶은데 … 토스처럼 좀 바꿔줄래? 메인 컬러인 보라색은 바꾸지 말고", "나눔바른고딕으로 해봐" 등 (2026-10-05). dev는 "다음 사이클의 화면 설계 때 이 값을 기준으로" 써 달라고 함 |
| 결과 줄 도서관 이름 옆 "구독형" 표시 (ADR-0019) | 뺌. 오른쪽 상태 "구독형 · 바로 대출"과 겹침. "월 예산 소진 시 이용 불가"는 그 상태를 누르면 열리는 창으로 | 사용자: "따로 도서관에 구독형이라는 정보는 안 줘도 될 것 같아", "예산 소진 시 이용 불가 이거 … 구독형 바로 대출 이거 누르면 나오는 설명으로 해줘" (2026-10-05) |
| `signup_success` 결과 코드 | 서버 코드가 아니라 웹 상태로 | 사용자 선택 (dev 기록, 2026-10-04) |
| 직접 추가했지만 지역 규칙이 안 맞는 도서관의 `priorityGroup`: "원래 값 유지" | `QUALIFIED` (`eligibility=UNKNOWN`과 짝) | [이유 미확인: dev가 정함] |
| DELETE `/me/libraries/{id}`: 오류 401만 적음 | DELETE도 계정 줄을 잠금. 숫자 아닌 경로·0·음수는 PUT·DELETE 모두 404 `library_not_found` | [이유 미확인: dev가 정함] |
| `PUT /me/regions` 422 예시 `regionId` | `errors[]` = `{field, message, code, value}`, 본문이 JSON 아니면 400 `bad_request`, 순서 400 → 401 → 422 | [이유 미확인: dev가 정함] |
| `/books` 검증 순서 "filter → scope → visit → libraryIds → 지역" | scope → visit → libraryIds → page·pageSize → 지역 (`/books`에는 `filter` 없음) | 설계 문장의 오류 |

## 새로 알게 된 제약

- 모듈 사이에 외래 키가 없으므로, 계정을 앱의 탈퇴가 아니라 SQL로 지우면 `AccountDeleted`가 나가지 않아 `mylibrary` 줄이 남음(dev 시험 계정 10~12번에서 실제로 생김). 시험 계정은 `mylibrary` 줄부터 지움 (dev 1537행)
- 로그인 확인 전에는 웹이 브라우저 지역을 읽지 않고 검색이 기다림(`source=waiting`) → 로그인 전 첫 검색이 `/me` 응답 한 번만큼 늦어짐
- 공개 목록 `GET /api/v1/libraries`: 278곳에 약 48KB(gzip 약 4.2KB) (dev 측정). 후보 도서관이 들어오면 약 2,500곳 → 다음 사이클에서 다시 잼
- 글꼴 파일이 큼: 나눔바른고딕 woff2 보통 1.45MB + 굵게 1.55MB
- 다른 세션이 띄운 Vite가 옛 코드를 보내는 일이 있었음(사용자 보고 "직접 추가 N곳 안 보임"은 재현 안 됨, 사용자 "보여"로 닫음)

## 확인하지 못한 것(남은 일)

- 네이버 실제 제공자 확인(사이클 05부터, 키를 받은 뒤)
- 로그인 꺼짐 화면은 테스트로만 확인(`MyLibraryDisabledTests`, `AuthDisabledTests`)
- 사이클 05 retro의 문장 "15분 동안 다른 모듈 API에서 통과"는 지금 코드와 맞지 않음 → dev 제안: "다른 경로는 토큰을 읽지 않는다" (dev 1250행). `../05-login-account/retro.md`에 덧붙임 필요
- plan이 정할 것 셋(dev 1563행): S8·S9에서 이전 화면으로 돌아가는 길, 브라우저 탭 제목("책첵 · 전자도서관 대출 가능 여부")이 머리말 소개와 다름, 글꼴 서브셋 → 사이클 07 `scope.md` C

## Modulith 문서와 `docs/current/` 비교

- `backend/build/spring-modulith-docs/components.puml`(2026-10-05): Catalog→Library, Library→Region, Availability→Library·Catalog, Mylibrary→Auth(uses, listens to), Mylibrary→Library, Mylibrary→Region. `module-map.md` 구성도와 같음
- 공개 API 칸에 없던 것: `library`의 `LibraryEligibility`(안쪽 `RegionBasis`), `auth`의 `ConditionalOnAuthEnabled.PROPERTY`. `RegionIdsParam`은 `library/internal/web`에 복사(모듈끼리 internal을 나눠 쓰지 않으려는 중복)
- `docs/current/`는 이 회고와 함께 "설계됨(미구현)" 표시를 구현됨으로, 위 차이를 반영해 고침 (2026-10-05)

## 다음 사이클 후보

- **사이클 07: 후보 도서관 넣기 + 수집 방법 재구성 + DB·검색 최적화** (사용자 선택, 2026-10-05) → `../07-candidate-libraries/scope.md`
- 책 번호 유지(책 묶기 기준 포함) → 구독형 한도 알리기 → 알림 (`docs/backlog.md`)
- 화면 디자인 기준: dev "사이클 밖: 화면 디자인" 절을 다음 화면 설계의 바탕으로
