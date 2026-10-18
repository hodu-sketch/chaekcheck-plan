# 개발 인계서: 사이클 22 첫 화면 사용성 (지역 먼저 묻기 · 결과는 내 도서관부터 · 방문 가입 표시)

- 작성 2026-10-18 (planner 초안 → plan 세션 정리). 기준 문서: plan `docs/cycles/22-first-screen-usability/design-delta.md`(D1~D11, 모두 [확정] 2026-10-18), `spec.md`(R1~R12, AC-1~21), `flow.md`. `architect-proposal.md`는 결정 기록이고 그 안의 "결정 6 B"(debounce 0.7초)와 그림은 **무효**입니다.
- ADR: 0135(범위 스위치 없음, 전국은 그 검색만), 0136(결과 묶음 넷·꼬리표), 0137(`RegionGrid`, 체크는 저장만). 모두 Accepted, 2026-10-18. ADR-0138(첫 화면 줄 하나로 합침·브라우저 저장 칸·도서관 목록 캐시)은 인계서 검토 뒤 씀.
- 이 인계서의 자리: plan `docs/cycles/22-first-screen-usability/handoff.md`. `docs/current/handoff.md`는 사이클 20 인계서로 두고 끝에 22를 알리는 한 줄만 넣음(사이클 14·16·21 선례). dev에서는 `../chaekcheck-plan/docs/cycles/22-first-screen-usability/handoff.md`로 읽습니다.
- **웹만 바뀝니다.** 백엔드 모듈·API·표·Liquibase·이벤트·이용 기록 항목은 그대로입니다(AC-18). `scope`는 늘 `joinable`이고, `all`은 전국 링크·상세검색 칸으로 한 그 검색에서만 씁니다.

## 목표

처음 온 사람이 첫 화면에서 사는 곳을 고르면, 그 지역에서 가입할 수 있는 도서관부터 결과를 봅니다. 결과에서는 다른 지역의 "어디 살든 가입" 도서관도 가입할 수 있다는 것과, 방문 가입인 곳(가입하려면 직접 가야 하는 곳)을 바로 알 수 있습니다.

## 순서와 전제

- **지금 운영**: chaekcheck.com v1.0.1(2026-10-18 공개, dev 17 세션 알림). 사이클 20 1단계는 dev main에 있음.
- **순서** [확인 필요: 사용자에게 질문]: 사이클 22를 사이클 20 2단계(확장 모드)보다 먼저 만들지 뒤에 만들지. 둘은 결과 목록 파일(`ResultList.tsx`, `ResultRow.tsx`, 「확인하지 못한 도서관」 묶음)을 같이 고칩니다. main에 나중에 들어가는 쪽이 rebase해서 충돌을 풉니다.
- 이 사이클은 API가 호환되는 새 기능이라 **MINOR v1.1.0 후보**입니다 [안: 배포 때 dev가 정함]. `CHANGELOG.md` 맨 위 절 초안은 아래.
- 구현이 이 인계서와 달라져야 하면 조용히 바꾸지 않습니다. 먼저 사용자에게 알리고 dev `docs/plan-feedback.md`의 새 `# 사이클 22` 절에 적습니다. `[안]` 이름(부품·함수·칸)은 dev가 바꿀 수 있고, 바꾸면 그 절에 알리기만 합니다.
- **바꾸지 않는 것** [확정]
  - 체크는 저장만 합니다. 자동 재검색과 debounce는 없습니다(사용자: "체크와 검색이 따로. 기다리는 시간도, 체크마다 검색도 없습니다").
  - 범위 스위치는 없습니다.
  - 묶음 판정 D3'와 소절 끝 붙이기 D3.
  - 아래 문구표 전부. `RegionGrid` 크기 D11의 뜻("크기만 키워")은 [확정], 숫자(16px·40px·640px)는 [안] — 다르게 하면 보고.
  - 서버 요청·응답 모양.
- 단계마다 `web/`에서 `npm run build`와 vitest가 통과해야 다음 단계로 갑니다. 백엔드는 바꾸지 않으므로 `ModularityTests` 대상이 아닙니다. 끝에 `git diff --stat main -- backend/`가 비어 있는지 봅니다.
- 경로 약어: `S` = `web/src/features/search/`, `G` = `web/src/features/region/`, `M` = `web/src/features/mylibrary/`

## 1단계: 범위 읽기, 브라우저 저장, 검색 당시 값

1. **`readScope(params)`** (`S/useLibraryScope.ts`를 `S/readScope.ts`로 바꿈 [안: 이름])
   - 주소가 `scope=all`이면 `all`, 아니면 `joinable`입니다. `joinableLabel()`과 `change`는 지웁니다.
   - 쓰는 곳: `S/SearchPage.tsx`, `web/src/features/book/BookPage.tsx` 24·36행, `web/src/features/picks/usePicksPlan.ts` 16행.
   - 규칙: R4-1, D9, D10, ADR-0135.
2. **스위치를 화면에서 뺌** (`S/SearchPage.tsx`)
   - `LibraryScopeToggle` 사용과 `scopeValue`(180행)의 "전체 도서관"을 지웁니다. `S/LibraryScopeToggle.tsx`와 `.module.css`를 지웁니다.
3. **브라우저 저장** (`S/searchSettings.ts`, D5)
   - `SearchPrefs`에서 `guestScope`를 뺍니다. `loadMyScope`·`saveMyScope`를 지웁니다. `DROPPED_PREFS`에 `guestScope`, `myScope`를 더합니다.
   - 칸 셋을 더합니다: `planCount {key, count}`(`key` = `source|residence|work|libraryIds|visit`, 지문이 같을 때만 수를 보임, `scope=all` 검색의 수는 저장하지 않음), `openCount`, `saveHintClosed`. 읽을 때 꼴이 틀리면 기본값(`loadPrefs` 방식).
4. **검색 당시 값 고정** (`S/SearchPage.tsx` 79~105행, `S/DirectResults.tsx` 49행) [확정: 동작 / 안: 방법]
   - 지금은 `bookQuery`가 지역·`libraryIds`를 바로 읽어서 바꾸면 다시 찾습니다(D6 위반).
   - `searchedWith {residence, work, libraryIds}` 스냅샷을 둡니다. 스냅샷은 ① 주소의 검색을 처음 `ready`로 돌릴 때(페이지 열기) ② `search()`(검색 단추) ③ 결과 안의 단추 넷(4단계)에서만 새로 잡습니다. `bookQuery`와 `DirectResults`는 스냅샷 값을 씁니다.
   - **방문 빼기**: 상자와 ⚙의 스위치는 `prefs.visit`만 저장합니다. `search()`는 주소에 `prefs.visit`을 씁니다. 결과는 주소의 `visit`을 씁니다.
5. **로그인한 사람이 계정을 읽을 때까지 기다림** (`G/RegionContext.tsx` 75~80행, D7)
   - 읽는 동안에는 `ready=false`로 둡니다(지금은 `true`이고 지역 없이 찾음). `myLibrary.status === 'error'`이면 `ready=true`, 지역 없이 찾고 `accountFailed=true`를 내보냅니다 [안: 이름].
- 시험: `S/searchPrefs.test.ts`(옛 칸 지워짐, 새 칸 기본값·깨진 값), `readScope` 단위 시험, `S/myLibrarySearch.test.tsx`(지역을 바꿔도 요청이 다시 나가지 않음, `search()` 뒤에는 새 지역으로), `M/regionSource.test.tsx`(계정을 읽는 동안 검색 요청 0), `BookPage.test.tsx`·`PicksPage.test.tsx`·`PicksLists.test.tsx`(저장된 스위치 값이 없어도 `joinable`).
- 확인: AC-10(스위치 없음), AC-18, AC-20, AC-21.

## 2단계: 지역 격자 부품과 저장

1. **`G/RegionGrid.tsx` + `.module.css` 새로** (`G/RegionModal.tsx`의 격자를 떼어 냄)
   - props: `field`(residence/work), `value`, `onToggle`, `full`, 트리 상태 [안].
   - 왼쪽에 시도 16개(고른 수 배지), 오른쪽에 시군구 체크 칸, 위에 꼬리표 "{shortName} {시군구} ×".
   - 크기(D11): 글자 16px 이상, 칸 높이 40px 이상, 너비 100%(PC 상자 최대 약 640px, 4칸 → 좁으면 3·2칸), 폰은 화면 너비 전체 [안: 숫자].
   - 20개가 차면 남은 칸을 비활성으로 하고 "최대 20곳이에요". 세종도 시군구를 한 번 더 고릅니다(자동 선택 없음). 목록을 받는 동안 "불러오는 중…", 실패하면 "지역 목록을 불러오지 못했어요 [다시 시도]". 해석 안내(`/regions/resolutions`)는 꼬리표 아래.
   - 규칙: R12-1~4, flow 결정 #1·#5.
2. **`G/RegionContext.tsx` 저장 차례** (D6)
   - 체크하면 바로 `setRegions`. 로그인 전: `localStorage`. 로그인 뒤: `PUT /api/v1/me/regions`를 **한 번에 하나씩**(보내는 중에 또 바뀌면 마지막 값만 다음에). 실패하면 마지막 저장값으로 되돌리고 "저장하지 못했어요. 잠시 뒤 다시 해 주세요". 422 `invalid_region`이면 해석 안내.
   - `region_change`는 저장마다 보냅니다(지금과 같은 모양, 줄 수는 체크마다라 늘어남). PUT 연타가 nginx 요청 제한(429)에 걸리지 않는지 확인하고 보고 [확인 필요].
3. **마이페이지** (`M/MyLibrariesPage.tsx` 111~139행·183~225행 부근, `.module.css`)
   - [변경]과 `RegionModal`을 지우고, 칸 안에 "사는 곳"·"일하는 곳" 줄(꼬리표 + `RegionGrid`). "거주 지역으로 자동 N곳 ▸"은 그대로(체크 뒤 목록 다시 받음). 첫 문장과 어디 살든 가입 줄은 문구표(149·150행 포함).
   - 규칙: R11, AC-13.
- 시험: `G/RegionGrid.test.tsx` 새로(`RegionModal.test.tsx`의 격자 시험을 옮기고 그 파일은 3단계에서 지움): 체크 → 꼬리표, 다시 누름 → 풀림, 20 한도, 목록 실패 줄; `RegionContext` PUT 차례(연달아 세 번 체크 → PUT은 겹치지 않고 마지막 값으로 끝남, 실패하면 되돌림); `M/MyLibrariesPage.test.tsx`([변경] 없음, 격자, 첫 문장).
- 확인: AC-9, AC-13, AC-20(마이페이지). 화면 1440px·375px.

## 3단계: 찾을 도서관 줄 (첫 화면·결과 화면·폰 칩·⚙)

1. **`S/LibraryScopeLine.tsx` + `.module.css` 새로** [안: 이름] (R1, R2, R3)
   - 처음 온 사람(지역도 직접 추가도 없음): "어디서 빌리실 건가요? [사는 곳·일하는 곳 고르기]"와 작은 글. 단추를 누르면 상자가 사는 곳 격자로 열립니다.
   - 그 밖: 접힌 줄(문구표). "N곳"은 `planCount`의 지문이 맞을 때만(R3-3, D5). 결과 화면이면 첫 묶음 `targets.libraries[]`의 길이로 `planCount`·`openCount`를 갱신.
   - 펼친 상자: 검색창 아래에 떠 있고 목록을 밀지 않음, 밖을 누르거나 Esc로 닫힘, 안의 차례는 R1-4. 직접 추가 이름은 `GET /api/v1/libraries`(지역 없이)를 직접 추가가 있을 때만 받아 씀(React Query `['libraries','','']`, staleTime 5분, D4). 꺼진 도서관이면 "꺼진 도서관".
   - 전국으로 찾는 중(`readScope`가 `all`): 옆에 주황 "전국에서 찾는 중 · N곳"과 [내 도서관만](주소에서 `scope`를 지움 → 스냅샷 → 다시 찾음).
   - 계정 읽기 실패(D7): "내 도서관을 불러오지 못했어요 [다시 시도]"(`myLibrary.retry`).
2. **`M/SaveHint.tsx` 새로** [안: 이름] (R9): 로그인 전에 저장한 직후 저장한 부품 바로 아래 한 줄, ×를 누르면 `saveHintClosed`. [카카오 로그인]은 지금 머리말 로그인 흐름. 로그인한 사람에게는 안 보임.
3. **`S/SearchPage.tsx`**: PC(641px 이상)의 `scopeRow`를 `LibraryScopeLine` 하나로. `notices`의 "설정"(251행)과 `SearchError`의 `onEditRegions`는 상자를 엽니다(폰은 시트). `RegionModal` 사용(305행)을 지웁니다.
4. **폰 칩과 ⚙** (`S/SearchForm.tsx`, `S/SettingsPanel.tsx`, `.module.css`): 폰(640px 이하) 검색창 아래 칩을 늘 보임, 누르면 시트의 "찾을 도서관" 칸이 펼쳐진 채 열림. 그 칸은 상자와 같은 몸체(스위치 없음, 격자는 화면 너비 전체). PC ⚙ 작은 창에는 "직접 가야 가입되는 도서관은 빼기" 스위치 한 줄만(지역은 두지 않음). 규칙: R2, R8-1, flow 결정 #3.
5. **지움**: `S/VisitToggle.tsx`, `S/ScopeSummary.tsx`(+css, `SearchPage`의 `scopeStyles` 가져오기 포함), `G/RegionSummary.tsx`, `G/RegionModal.tsx`(+css·test), `M/MyLibrarySummary.tsx`. 머리말 메뉴 `web/src/components/headerMenus.ts`의 "내 도서관 관리"는 마이페이지 메뉴라 **그대로**.
- 시험: `LibraryScopeLine.test.tsx` 새로(처음 온 사람 줄, 접힌 줄 문구, N곳은 지문이 같을 때만, 상자 차례와 밖 누름·Esc, 전국 표시와 [내 도서관만], 계정 실패 줄), `SaveHint`(×, 로그인한 사람), `S/SettingsPanel.test.tsx`(폰 칸 차례, PC 스위치 이름), `S/SearchForm.test.tsx`(폰 칩).
- 확인: AC-1, AC-2, AC-7, AC-8(접힌 줄), AC-10, AC-14, AC-15, AC-21. 화면 1440px(첫 화면·결과·상자), 375px(칩·시트).

## 4단계: 결과 묶음·꼬리표·전국 링크·방문 빼기 (ADR-0136)

1. **`S/resultGroups.ts` + `.test.ts` 새로**: `groupBatches(views, libraryById)` (D3, D3')
   - 판정 `libraryGroup`: `chosen` 또는 `priorityGroup` MY_SIGUNGU·MY_SIDO 또는 `eligibility` ELIGIBLE → MINE; `eligibility` OPEN → OPEN; 그 밖 → OTHER. 실패·UNKNOWN 줄은 지금처럼 `sortBatch.unchecked`에서 UNCHECKED.
   - 묶음 안은 `sortBatch` 결과를 소절별로 이어 붙임: 빌릴 수 있어요 → 예약 → 조회 중. 다음 배치 줄은 자기 소절 끝(R5-3). `sortBatch.ts`와 `holdingView.ts`는 고치지 않음.
2. **`S/GroupSection.tsx` 새로** (`S/BatchSection.tsx` 자리): 묶음 제목(수 포함), 작은 글, 소절 줄. "더 찾은 결과 · 도서관 N곳" 구분 줄은 없앰. "지금까지 N곳에서 … 찾지 못했습니다"(`S/resultFilter.ts`)는 목록 맨 아래 「결과 더 보기」 바로 위 한 줄로.
3. **`S/ResultList.tsx`·`.module.css`**에 `grouped` prop(기본 true)
   - 묶음 순서 ①②③④. ②·③이 비면 숨김. "내 도서관에는 없어요 (0) · [전국에서 찾기]"는 지역이나 직접 추가가 있고 첫 배치가 끝난 뒤에만(R5-4).
   - 녹색 안내 줄(R7): 지역도 직접 추가도 없고 `scope`가 `all`이 아니고 계정 실패가 아닐 때. × 없음. [사는 곳 고르기]로 지역을 체크하면 저장만 되고 줄은 "[검색]을 눌러 다시 찾아 주세요"로 바뀜(R7-2).
   - 맨 아래에 [결과 더 보기] [전국에서 더 찾기].
   - **결과 안 단추 넷은 누르면 바로 다시 찾음**(주소를 바꾸고 스냅샷을 다시 잡음): [전국에서 찾기]·[전국에서 더 찾기] → `scope=all`; [그 N곳 빼기] → `visit=none`과 `prefs.visit`; [다시 넣기] → 둘 다 원래대로.
   - 방문 빼기 줄의 N = 지금 보이는 ② 줄 가운데 `visitRequired`인 사이트 수(R8-2). 뺀 뒤에는 "방문 가입 도서관을 뺐어요 · [다시 넣기]"(D8).
   - `grouped=false`일 때는 지금 화면 그대로(`BatchSection`을 남기든 `GroupSection`의 한 묶음 모드로 하든 dev가 정하고 보고 [안]).
4. **`S/ResultRow.tsx`·`.module.css`**에 `tags` prop(기본 false) (R6, D1, D2)
   - 도서관 이름 뒤에 알약: [직접 추가] / [내 지역] / [어디 살든 가입] 가운데 하나 + 방문 가입이면 주황 [방문 가입]. ③ 줄은 `eligibilitySummary`를 회색으로.
   - 말풍선은 radix Popover(지금 가입 정보 창과 같은 방식), 누르면 열리고 PC는 마우스를 올려도 열림. "가입 방법 보기"는 지금 가입 정보 창을 엶. 로고 자리는 그대로.
   - 가입 정보 창의 자격 요약(105행) "누구나 가입" → "어디 살든 온라인 가입". 모든 화면에 적용(AC-17 예외, D9).
5. **연결**: `S/InstantResults.tsx`·`S/DirectResults.tsx`에 `grouped`와 `tags=true`; `web/src/features/book/BookPage.tsx`에 `grouped=false`; `web/src/features/picks/PicksBookDialog.tsx`에 `tags=false`; `S/SortSelect.tsx` 89행 정렬 도움말을 문구표대로; `web/src/features/picks/picksText.ts` 27행 "고른 지역·범위 기준이에요" → "고른 지역 기준이에요".
- 시험: `resultGroups.test.ts`(판정 표, 배치 둘 → 소절 끝, 수), `S/ResultList.test.tsx`(묶음 순서, 빈 ①, 녹색 줄 조건, 전국 링크 → 요청 `scope=all`, 빼기 → `visit=none`, 바닥 한 줄), `S/ResultRow.test.tsx`(꼬리표 넷, 말풍선 문구, `tags=false`면 없음), `S/libraryClicks.test.tsx`(기록 그대로), `BookPage.test.tsx`·`PicksBookDialog.test.tsx`(변경 전과 같음, 가입 창 문구만 다름).
- 확인: AC-3, AC-4, AC-5, AC-6, AC-11, AC-16, AC-17. 화면 1440px·375px(결과 지역 있음·없음·전국·방문 뺌).

## 5단계: 상세검색의 사는 곳·일하는 곳·도서관·범위 줄

1. **`S/SearchForm.tsx`·`.module.css`** (R10, flow 결정 #4)
   - 출판사 아래에 넷: "사는 곳" 줄과 "일하는 곳" 줄(꼬리표 + `RegionGrid`) / "도서관" 줄("도서관 이름으로 찾기" 입력 → 찾은 목록 10곳씩 더 보기, 줄마다 [더하기], "직접 추가 N/20"과 이름 꼬리표 ×; 찾기는 `M/libraryNames.ts`의 `findByName`(NFC + 공백 제거 + 부분 일치, ADR-0049·0058)과 D4 캐시) / "범위" 줄("☐ 전국에서 찾기 · 이번 검색만").
   - 지역과 도서관은 바로 저장만, 검색은 [검색]으로. 전국 칸은 저장하지 않음: 체크하고 [검색]하면 새 주소에 `scope=all`, 검색 뒤 칸은 풀림(D10). 폰은 지금 접히는 패널 아래에 줄을 더함. 책 링크(`bookLinkSearch`)는 주소에 있던 `scope=all`을 이어서 실음(지금 동작).
- 시험(`S/SearchForm.test.tsx`): 줄 넷, 더하기 → `MyLibraryContext`에 들어가고 결과에 [직접 추가], 전국 칸 → 주소에 `scope=all`·다음 새 검색은 `joinable`, 지역을 바꿔도 요청이 다시 나가지 않음.
- 확인: AC-8, AC-11(상세검색 입구), AC-12, AC-19, AC-20. 화면 1440px·375px.

## 6단계: 마무리

- 문구표 전부를 화면에서 대조. 화면 글에 "누구나 가입"이 남지 않았는지 `web/src`에서 찾음(주석·시험·등급 이름 `OPEN`은 그대로).
- `CHANGELOG.md` 맨 위 절 초안(아래).
- Playwright: 데스크톱 1440px을 먼저, 그다음 폰 375px. 그다음 사용자 실제 폰(완료 기준).

## 문구표 (화면에 보이는 글 전부)

| 자리 | 문구 | 근거 |
|---|---|---|
| 처음 온 사람 줄 | "어디서 빌리실 건가요?" [사는 곳·일하는 곳 고르기] | R1-2 |
| 그 아래 작은 글 | "고르면 그 지역 기준으로 찾아요 · 안 고르면 어디 살든 가입되는 도서관에서 찾아요 · [일하는 곳도 더하기]" | R1-2 |
| 접힌 줄 | "내 도서관: 서울 강남구(· 일하는 곳 성남시)(· 방문 가입 뺌)(· 직접 추가 2)(· 68곳) ▾". 사는 곳 여럿은 "서울 강남구·서초구", 넷부터 "서울 강남구 외 2곳". 사는 곳 없이 일하는 곳만 있으면 "내 도서관: 일하는 곳 성남시 …" [안] | R3 |
| 폰 칩 | "내 도서관: 서울 강남구 · 68곳 ▾" / "어디서 빌리실 건가요? ▾" | R2-1 |
| 상자 | "사는 곳", "일하는 곳", [일하는 곳도 더하기], "직접 추가 N곳" + 이름 + "상세검색이나 마이페이지에서 이름으로 더할 수 있어요", "직접 가야 가입되는 도서관은 빼기", "어디 살든 가입되는 도서관 {openCount}곳은 늘 들어 있어요"(수를 모르면 수 없이), [마이페이지에서 전체 보기] | R1-4, R3-4 |
| 전국 중 | "전국에서 찾는 중 · N곳" [내 도서관만] | R4-2 |
| 계정 실패 | "내 도서관을 불러오지 못했어요 [다시 시도]" | D7 |
| 격자 | "{shortName} {시군구} ×", "최대 20곳이에요", "불러오는 중…", "지역 목록을 불러오지 못했어요 [다시 시도]" | R12 |
| 저장 실패 | "저장하지 못했어요. 잠시 뒤 다시 해 주세요" | 사이클 06 |
| 저장 안내 | "이 브라우저에만 저장됐어요. 로그인하면 다른 기기에서도 그대로예요 [카카오 로그인] ×" | R9 |
| 녹색 줄 | "사는 곳을 고르지 않아 어디 살든 가입되는 도서관 {N}곳에서 찾았어요. 사는 곳을 고르면 그 지역 도서관부터 보여요 [사는 곳 고르기]" → 지역 체크 뒤 "[검색]을 눌러 다시 찾아 주세요" | R7 |
| 묶음 ① | "내 도서관에 있어요 (n) · {사는 곳}에서 가입할 수 있는 곳과 직접 추가한 곳" / 비면 "내 도서관에는 없어요 (0) · [전국에서 찾기]" | R5-4·5 |
| 묶음 ② | "어디 살든 가입되는 도서관에 있어요 (n) · 온라인으로 바로 가입할 수 있어요" + "· 이 중 N곳은 가입하려면 도서관에 가야 해요 [그 N곳 빼기]" / 뺀 뒤 "방문 가입 도서관을 뺐어요 · [다시 넣기]" | R5-5, D8 |
| 묶음 ③·④ | "그 밖의 도서관에 있어요 (n) · 그 지역에 살거나 일해야 가입돼요" / "확인하지 못한 도서관 (n)"(사이클 20 그대로) | R5 |
| 소절 | "● 지금 빌릴 수 있어요 (n)", "예약하고 기다려요" | R5-2 |
| 맨 아래 | "지금까지 N곳에서 … 찾지 못했습니다" 한 줄, [결과 더 보기 …](v1.0.1 문구 그대로) [전국에서 더 찾기] | R4-2, D3 |
| 꼬리표 | [직접 추가] [내 지역] [어디 살든 가입] [방문 가입], ③은 `eligibilitySummary` | R6-1 |
| 말풍선 | "그 지역에 살지 않아도 온라인으로 가입할 수 있어요 · 가입 방법 보기" / "가입하려면 {도서관 이름}에 한 번 가야 해요 · 가입 방법 보기" / "사는 곳으로 / 일하는 곳으로 / 사는 곳이나 일하는 곳으로 가입할 수 있어요 · 가입 방법 보기" / "직접 추가한 도서관이에요 · 마이페이지에서 빼기" | R6-2, D1, D2 |
| 가입 정보 창 | "누구나 가입" → "어디 살든 온라인 가입" | R6-5, D9 |
| 상세검색 | "사는 곳", "일하는 곳", "도서관", "도서관 이름으로 찾기", [더하기], "직접 추가 N/20", "범위", "전국에서 찾기 · 이번 검색만" | R10 |
| ⚙ | "직접 가야 가입되는 도서관은 빼기" | R8-1 |
| 마이페이지 | "검색하면 여기 있는 도서관에서 먼저 찾아요" / "어디 살든 가입되는 도서관 {n}곳도 늘 내 도서관에 들어 있어요 ▸" / 폰 짧은 글 "어디 살든 가입 {n}곳은 늘 포함돼요" [안] | R11-2 |
| 정렬 도움말 | "묶음(내 도서관 → 어디 살든 가입 → 그 밖) 안에서: 직접 추가 → 내 시군구 → 내 시도 → 방문 가입 → 가입 자격 확인 필요" [안] | R6-5 |
| 추천도서 안내 글 | "고른 지역 기준이에요" | R6-5 |

## 수용 기준과 시험

| AC | 시험 | 단계 |
|---|---|---|
| 1, 2, 7, 14, 15 | `LibraryScopeLine`·`SaveHint`·`SettingsPanel` 시험 + 화면 | 3 |
| 3, 4, 5, 6, 16 | `resultGroups`·`ResultList`·`ResultRow` 시험 + 화면 | 4 |
| 8 | 접힌 줄(3) + 상세검색(5) + 마이페이지(2) | 2, 3, 5 |
| 9, 13 | `RegionGrid`·`MyLibrariesPage` 시험 | 2 |
| 10 | 스위치 없음(1, 3) + 마이페이지 첫 문장(2) | 1~3 |
| 11, 19 | 전국 링크(4) + 상세검색 칸(5), 새 검색 → `joinable` | 4, 5 |
| 12 | `SearchForm` 시험 | 5 |
| 17 | `BookPage`·`PicksBookDialog` 시험(가입 창 문구만 예외) | 4 |
| 18 | 요청 모양 시험(`myLibrarySearch`, `useSearch`), 백엔드 diff 없음 | 1, 6 |
| 20 (자동 재검색 없음) | 지역을 바꿔도 요청 0, [검색]이나 결과 단추 넷에서만 요청 | 1, 2, 5 |
| 21 (계정 읽는 동안·실패) | `regionSource`·`LibraryScopeLine` 시험 | 1, 3 |

## 완료 기준

- [ ] AC-1~AC-21을 위 표대로 확인하고 AC 확인표를 `# 사이클 22` 절에 적습니다.
- [ ] `web/`에서 `npm run build`와 vitest가 통과합니다. `backend/` 변경이 없습니다.
- [ ] 화면 글에 "누구나 가입"이 없습니다(가입 정보 창 포함).
- [ ] Playwright로 1440px과 375px에서 첫 화면(지역 없음·있음), 상자, 결과(①②④, 전국 ①②③④, 방문 뺌), 상세검색, ⚙ 시트, 마이페이지를 봤습니다.
- [ ] 폰 화면(첫 화면 칩, ⚙ 시트, 결과 꼬리표·말풍선, 상세검색, 마이페이지 격자)을 바꾸므로, 사이클을 닫기 전에 사용자가 **자기 폰(Samsung Internet)**으로 dev 웹 서버 `web-lan-5174`(`.claude/launch.json`, 같은 Wi-Fi)에 붙어 확인합니다. Chrome 폰 흉내만으로는 안 됩니다(사용자 결정 2026-10-12).
- [ ] `CHANGELOG.md` 맨 위 절을 쓰고, 배포 때 `release.sh`로 버전을 냅니다.

## CHANGELOG 절 초안 [안]

```
## v1.1.0 (YYYY-MM-DD)

- 첫 화면 검색창 아래에서 사는 곳·일하는 곳을 바로 고름(내 지역 창을 없애고 고르는 칸을 크게). 고르면 "내 도서관: 서울 강남구 · N곳"으로 접힘. 폰은 검색창 아래 칩
- 범위 스위치(가입 가능한 곳 | 전체 도서관)를 없앰. 검색은 늘 빌릴 수 있는 도서관에서 하고, 전국은 결과의 「전국에서 찾기」·「전국에서 더 찾기」나 상세검색 「전국에서 찾기」로 그 검색만
- 검색 결과를 「내 도서관에 있어요」 → 「어디 살든 가입되는 도서관에 있어요」 → (전국일 때) 「그 밖의 도서관」 → 「확인하지 못한 도서관」으로 묶고, 줄마다 내 지역·직접 추가·어디 살든 가입·방문 가입 꼬리표와 설명
- 방문 가입 도서관을 결과에서 「그 N곳 빼기」로 한 번에 빼고 「다시 넣기」로 되돌림. 「방문 없이 가입」 단추는 ⚙ 「직접 가야 가입되는 도서관은 빼기」로
- 상세검색에 사는 곳·일하는 곳·도서관 이름·전국에서 찾기 줄
- 지역을 바꾸면 저장만 하고, 다시 찾는 것은 「검색」을 누를 때
- 로그인 전에 저장하면 「이 브라우저에만 저장됐어요」 안내 한 줄
- 로그인한 사람은 내 도서관을 읽은 뒤 검색(전에는 읽는 동안 전체 도서관으로 찾음)
- API 주소와 응답 모양은 그대로
```

## 하지 않는 것

- 서버 변경 전부: `targets`에 `matchedBy`나 도서관 시도 싣기, 가벼운 도서관 이름 API(백로그 후보).
- 책 먼저 고르기(`BookList`)·책 화면·추천도서 창의 묶음과 꼬리표(가입 정보 창 문구와 정렬 도움말 글만 바뀜).
- 꼬리표·말풍선·묶음 클릭을 이용 기록에 남기기(`api/usageEvents.ts`, `api/types.ts`는 고치지 않음).
- "이번 검색만 다른 지역", 전국을 기본으로 기억하기, 묶음 접기·묶음별 정렬, ③ 줄에서 바로 직접 추가.
- 상자를 닫을 때 "지역이 바뀌었어요 · 다시 찾기" 줄(넣지 않기로 함).
- 현재 위치로 지역 찾기, 처음 한 번 뜨는 안내 창.
- 사이클 20 2·3단계, `PRE_DEPLOYMENT` 표지 정리.
- plan `docs/current/`·`docs/settings-index.md` 고치기(새 서버 값 없음).

## plan-feedback.md `# 사이클 22`에 보고할 것

- 시작 커밋, 작업 폴더·브랜치, 사이클 20 2단계와의 앞뒤(정해진 결과).
- 검색 당시 값 고정을 어떻게 했는지(스냅샷을 잡는 때, 같은 주소로 [검색]을 다시 눌렀을 때의 동작, 뒤로·앞으로 이동).
- `grouped=false`를 `BatchSection`으로 남겼는지 한 묶음 모드로 했는지.
- 바꾼 이름: `readScope`, `LibraryScopeLine`, `SaveHint`, `RegionGrid` props, `accountFailed`, 저장 칸 이름. 격자 크기 숫자(16px·40px·640px)를 다르게 했으면 그 값.
- 문구가 달라진 곳: 접힌 줄 덧붙임 차례, 일하는 곳만 있을 때, 마이페이지 폰 짧은 글, 정렬 도움말.
- 잰 값: 서울 강남구 거주 계획 길이(68곳과 같은지), 지역 없음 `openCount`(39와 같은지), 전국 계획 길이(약 376곳과 같은지). PUT 연타와 nginx 요청 제한.
- 화면 확인과 실제 폰 확인에서 사용자가 고친 것(사용자 발언은 그대로).
- CHANGELOG에 쓴 버전과 배포 날짜. 새로 알게 된 제약, 설계와 달라진 점.
