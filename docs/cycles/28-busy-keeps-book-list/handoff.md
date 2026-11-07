# 개발 인계서: 사이클 28 자리가 다 차도 책 목록은 보여 주기 (번외, 화면만)

- 기준 문서: plan `docs/cycles/28-busy-keeps-book-list/design-delta.md`(다안, 결정 10개 모두 승인 2026-11-07, 결정 페이지 `easy/2026-11-01-decisions.html`). 범위·명세·흐름은 `scope.md`, `spec.md`(AC-1~AC-7), `flow.md`. 대안 비교와 코드 근거는 `architect-proposal.md`
- ADR: 0173(동시 검색 자리가 없을 때 서버는 503 그대로, 화면이 책 목록을 지킴). Accepted, 2026-11-07
- 이 인계서의 자리: plan `docs/cycles/28-busy-keeps-book-list/handoff.md`(dev에서는 `../chaekcheck-plan/docs/cycles/28-busy-keeps-book-list/handoff.md`). `docs/current/handoff.md`에는 한 줄 안내만 있음
- 만들 dev 세션: `chaekcheck-dev-cycle-28` [안]

## 목표 한 줄

「바로 보기」의 첫 대출 조회 스트림(`GET /api/v1/book-availabilities/stream`)이 503 `server_busy`를 받아도, 결과 자리를 안내문으로 바꾸지 않습니다. 이미 받은 책 목록을 책 줄로 보여 주고, 안내 줄과 「대출 정보 다시 확인」 단추를 둡니다. 책 화면도 같은 안내 줄과 단추를 보이고, 사실과 다른 "이 책을 가진 도서관을 모두 조회했습니다"는 숨깁니다. 서버·API·스트림 이벤트·오류 코드는 바꾸지 않습니다 [확정].

## 일정과 다른 사이클과의 순서

- **화면만 고칩니다.** `web/`만 바뀌고 `backend/`는 그대로입니다. 백엔드 테스트도 바뀌지 않습니다 [확정]
- 다른 사이클을 기다리지 않습니다. 언제든 **따로 dev worktree·브랜치**에서 만들 수 있습니다. 24(AI 책 찾기, dev 진행 중)와는 `web/src/features/search/` 아래 파일이 겹칠 수 있습니다. main에 나중에 들어가는 쪽이 rebase로 맞춥니다
- 배포는 사이클 27의 전환 방식으로 **화면만 올리는 릴리스**로 합니다: `deploy/prod/bin/release.sh X.Y.Z web`. 백엔드는 다시 배포하지 않습니다
- **ADR-0170**: Liquibase changelog가 없으므로 DB 변경 체크리스트는 "해당 없음"입니다. 확인했다고 plan-feedback에 한 줄 적습니다. API가 바뀌지 않으므로 블루·그린 전환 중 옛 판과 새 판이 섞여도 문제가 없습니다
- 판 번호: 화면만 바뀌는 변경이라 PATCH 후보입니다 [안: 배포 때 dev가 정함]. dev 사본의 `web/package.json` 판은 1.23.1입니다(2026-11-07 확인)

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요**
- 구현이 이 인계서와 달라져야 하면 조용히 바꾸지 않습니다. 먼저 사용자에게 알리고, dev **`docs/cycles/28/plan-feedback.md`**(새 파일)에 무엇을 왜 바꿨는지 적습니다. 사용자 발언은 그대로 옮깁니다. 기존 `docs/cycles/plan-feedback.md`는 동결되어 있으므로 거기에는 쓰지 않습니다 (plan `docs/current/handoff.md` "plan-feedback 기록 규칙", 2026-11-05)
- `[안]`은 dev가 코드에 맞춰 바꿀 수 있습니다. 바꾸면 plan-feedback에 알리기만 합니다. 예: 새 컴포넌트·파일 이름, 다시 확인 상태를 어디에 둘지, 테스트 이름
- **바꾸지 않는 것** [확정] (사용자 승인, 결정 페이지 2026-11-07)
  - 안내 줄 문구(「바로 보기」): "지금 찾는 사람이 많아 대출 정보는 알 수 없어요. 책 목록만 먼저 보여 드려요."
  - 안내 줄 문구(책 화면): "지금 찾는 사람이 많아 대출 정보는 알 수 없어요."
  - 단추 이름 「대출 정보 다시 확인」. 기다리는 동안 안내 줄은 "대출 정보 확인 중…"이고 단추는 잠깁니다
  - 누를 때만 다시 조회합니다. 자동 재시도, 몇 초 기다리기, 대기열은 없습니다
  - 책 줄은 `BookList.tsx`의 줄과 같은 모양입니다: 제목, 저자·출판사·연도, "보유 도서관 N곳", 누르면 책 화면
  - 그대로 두는 것: 429(`too_many`), 「결과 더 보기」 거절, 추천도서 책 창, 직접 찾기, `BLOCKED_TEXT` 문구, 서버 코드, 사용 기록, 거절 세는 법(요약 로그 거절 수, 상태 신호 빨강 10초)
- 단계마다 `web/`에서 `npm run lint`, `npm test`, `npm run build`가 통과해야 다음 단계로 갑니다(명령 이름은 dev `CLAUDE.md` 기준). `backend/`의 `./gradlew build`(`ModularityTests`·`DocumentationTests` 포함)는 마지막에 한 번 돌려 바뀐 것이 없음을 확인합니다
- dev `CLAUDE.md`와 스킬을 그대로 따릅니다

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `design-delta.md` "웹" 표: **기준**
- `spec.md`: 입력과 출력, 동작 규칙 1~7, 상태별 동작, AC-1~AC-7
- `flow.md`: 1절 상태 그림, 2절 요청 순서, 3절 화면별로 바뀌는 자리 (그림 원본 보기 `easy/flow-original.html`)
- `easy/2026-11-01-decisions.html`: PC·태블릿·폰 화면 그림. 폰에서는 단추가 안내 줄 아래로 갑니다
- `architect-proposal.md` "코드에서 확인한 것"

## 개발 시작 전 확인

- [ ] base package `com.chaekcheck` [확정]. 이번에는 쓰지 않습니다(백엔드 변경 없음)
- [ ] 시작 커밋은 지금 dev main 끝입니다. 아래 줄 번호는 plan이 2026-11-07에 dev 사본에서 다시 확인한 값입니다. 시작 커밋에서 다르면 plan-feedback에 적습니다
- [ ] worktree, 브랜치, 포트 [안: dev가 정해 보고]

### plan이 다시 확인한 dev 위치 (2026-11-07)

| 무엇 | 위치 | 비고 |
|---|---|---|
| 첫 스트림 거절 때 결과 자리 전체를 안내문으로 바꿈 | `web/src/features/search/InstantResults.tsx` 131~141행 (131 `noHoldings`, 132 `blocked`, 134~141 `if (noHoldings && blocked) return <p … notice>`) | design-delta와 같음 |
| 「다음 책 N권 보기」 `loadMore` | 같은 파일 81~96행 (89행 `open(page.items, planOptions())`) | design-delta와 같음 |
| 책 줄 | `web/src/features/search/BookList.tsx` 107~117행(`<li>` 안 `Link`: title, meta, count, chevron). 108행 링크는 `bookLinkSearch` prop을 씀 | design-delta와 같음 |
| 책 화면 결과 자리 | `web/src/features/book/BookPage.tsx` 208~232행 (230행 `finishedText="이 책을 가진 도서관을 모두 조회했습니다"`) | design-delta와 같음 |
| 위 안내 줄 | `ResultList.tsx` 184~188행, 스타일 `ResultList.module.css` **220행** `.blocked` | design-delta도 220행으로 맞춤 |
| 거절 상태 | `useHoldings.ts` 72~74행(`open` 실패), 87~89행(`startBatch` 실패), `holdingPlan.ts` 54~68행(`batch-start`가 `blocked`를 지우고, `batch-failed`가 넣음) | |
| `InstantResults`를 쓰는 곳 | `SearchPage.tsx` 648행. `bookLinkSearch`는 473~476행에서 만들어 642행에서 `BookList`에만 넘김 | |
| 시험 자리 수 설정 | `application.yml` **257행** `max-concurrent-searches: 60`, 환경 변수 `CHAEKCHECK_AVAILABILITY_MAXCONCURRENTSEARCHES` | scope.md에는 232행(2026-11-01 사본)으로 적혀 있음. 환경 변수로 덮어쓰기는 사이클 20에서 확인됨 |

## 개발 단계

### 1단계: 책 줄 공용 조각 빼기 (동작 변화 없음)

1. **`BookRow` 컴포넌트** (새 파일: `web/src/features/search/BookRow.tsx` [안: 이름])
   - 할 일: `BookList.tsx` 107~117행의 `<Link>`(title, meta, count, chevron)를 옮깁니다. props는 `book: BookItem`, `bookLinkSearch: string`입니다. 스타일은 `BookList.module.css`(`.book` 11행, `.title` 38행, `.meta` 46행, `.count` 53행, `.chevron` 61행, 폰 111행)를 그대로 import합니다. CSS는 옮기지 않습니다 [안]
   - `BookList.tsx`는 `<li key={book.id}><BookRow … /></li>`로 바꿉니다. `<ol className={styles.list} aria-label="찾은 책">`은 그대로 둡니다
   - 이유: `BookList`는 `/books`를 스스로 다시 부르므로(12~25행) 통째로 다시 쓸 수 없습니다. 그래서 줄만 함께 씁니다 [확정]
   - 의존: 없음
   - 위험: 낮음
   - 확인: 기존 `blocked.test.tsx`의 `BookList` 시험 두 개(92~111행)가 그대로 통과합니다

### 2단계: 안내 줄 + 단추 조각

1. **`BusyRetryNotice` 컴포넌트** (새 파일: `web/src/features/search/BusyRetryNotice.tsx` [안: 이름])
   - props [안]: `text: string`, `checking: boolean`, `onRetry: () => void`
   - 기존 `.blocked` 줄(`ResultList.module.css` 220행 모양) 안에 문구와 단추를 둡니다. `role="alert"`를 둡니다
   - `checking`이면 문구는 "대출 정보 확인 중…"이고 단추는 `disabled`입니다
   - 폰 폭에서는 단추가 안내 줄 아래로 갑니다(결정 페이지 그림). 같은 모듈 CSS에 작은 클래스를 더합니다. 단추 스타일은 기존 단추 모양(예: `SearchPage.module.css` 324행 `.noticeAction` 또는 `ResultList`의 `moreButton`) 중 결정 페이지 그림에 가까운 것으로 고릅니다 [안]
   - 문구 상수는 이 파일에 둡니다 [안]: `BUSY_KEEP_LIST_TEXT`("지금 찾는 사람이 많아 대출 정보는 알 수 없어요. 책 목록만 먼저 보여 드려요."), `BUSY_BOOK_TEXT`("지금 찾는 사람이 많아 대출 정보는 알 수 없어요."), `BUSY_CHECKING_TEXT`("대출 정보 확인 중…"), 단추 「대출 정보 다시 확인」. 문구 자체는 [확정]입니다. `BLOCKED_TEXT`(`blocked.ts` 11~14행)는 바꾸지 않습니다
   - `blocked.ts` 3~7행 머리 주석의 "there is no retry button [확정]"을 바로잡습니다. 이제 「바로 보기」와 책 화면의 첫 대출 조회 거절에는 단추가 있다는 것을 적고, 사이클 28과 ADR-0173을 가리킵니다. 주석만 고칩니다
   - 의존: 없음
   - 위험: 낮음

### 3단계: 다시 확인 상태 (`useHoldings`)

화면이 알아야 하는 것은 두 가지입니다. (a) 마지막으로 거절된 스트림이 **첫 스트림(`open`)**인지 「결과 더 보기」(`startBatch`)인지, (b) 단추를 누른 뒤 답을 기다리는 중인지입니다. 지금 reducer는 둘을 구별하지 않습니다. `batch-start`가 `blocked`를 지우므로, 다시 확인 중에는 거절 상태가 사라져 지금 코드라면 책 줄이 바로 없어집니다.

1. **`useHoldings`에 다시 열기** (파일: `web/src/features/search/useHoldings.ts`)
   - 할 일 [안: 방법은 dev가 정해 보고]
     - `open` 50~75행: 마지막 `items`와 `options`를 ref(`lastOpen`)에 기억합니다
     - `open`이 `busy`로 실패했을 때만 켜지는 `openRefused` 표시를 둡니다(reducer 필드나 `useState`). 다음 `open`의 `targets`가 오거나, 다른 이유로 실패하거나, `startBatch`가 시작되면 지웁니다
     - `reopen()`: `lastOpen`으로 `open`을 다시 부릅니다
     - 반환 101행에 `reopen`, `openRefused`를 더합니다
   - 같은 책을 다시 열면 `batches`에 빈 묶음이 하나 더 생깁니다. `holdingBatchViews`·`ResultList`에서 빈 묶음이 화면에 남지 않는지 봅니다
   - 의존: 없음
   - 위험: 중간. 같은 hook을 `BookPage`와 `PicksBookDialog`도 씁니다. 추천도서 책 창은 동작이 바뀌지 않아야 합니다
   - 시험: `holdingsReducer`나 hook 단위 시험으로 확인합니다. 첫 스트림 503 → `openRefused` 참 → `reopen` 중 → `targets`를 받으면 거짓

### 4단계: 「바로 보기」 첫 스트림 거절 → 책 줄 목록

1. **결과 자리 바꾸기** (파일: `web/src/features/search/InstantResults.tsx` 131~141행)
   - 할 일
     - "책 목록만" 상태를 정합니다 [안]: (`noHoldings && blocked === 'busy' && openRefused`) 또는 (다시 확인 중이고 `order.length === 0`)
     - 이 상태에서는 `<section>`에 `BusyRetryNotice`(문구 `BUSY_KEEP_LIST_TEXT`, `checking`=다시 확인 중, `onRetry`=`holdings.reopen`)를 그리고, 그 아래 `books.items`를 `/books` 순서대로 `BookRow`로 그립니다(`<ol aria-label="찾은 책">`)
     - `blocked === 'too_many'`이면 134~141행의 지금 안내문을 그대로 씁니다 [확정]
     - 다시 확인한 뒤 `targets`가 오면(`order.length > 0`) 보통 `ResultList`로 바뀝니다("도서관 N곳 조회 중" → 결과). 책 줄과 안내 줄은 사라집니다
     - 또 503이면 "책 목록만" 상태로 돌아가고 단추를 다시 누를 수 있습니다
   - 책 줄 링크에 필요한 주소 조각을 받도록 Props(11~23행)에 `bookLinkSearch: string`을 더합니다. `SearchPage.tsx` 648행에서 `bookLinkSearch.toString()`(473~476행에서 만든 것, `BookList`에 넘기는 것과 같음)을 넘깁니다
   - 이 상태에서 정렬(`SortSelect`)·거르기 도구줄과 「다음 책 N권 보기」는 그리지 않습니다 [안. 결정 페이지 그림과 다르면 그림을 따릅니다]
   - 의존: 1, 2, 3단계
   - 위험: 중간

2. **「다음 책 N권 보기」 뒤 503** (같은 파일 81~96행, 148~176행)
   - 지금 동작: 앞 결과는 남고, 위에 `ResultList` 184~188행 안내 줄이 보입니다. 새 책은 보이지 않습니다
   - 이 사이클: 그대로 두고, `openRefused`이면 안내 줄에 「대출 정보 다시 확인」 단추만 더합니다. 단추는 그 페이지 책들로 다시 엽니다(`reopen`, 즉 `books.last.items`). 새 책의 책 줄은 그리지 않습니다 [확정]
   - 방법 [안]: `ResultList`에 선택 prop(예: `onRetryBlocked?: () => void`, `retrying?: boolean`)을 더하고, 184~188행 안 `blocked === 'busy'`일 때만 단추를 그립니다. 문구는 `BLOCKED_TEXT.busy` 그대로 둡니다. 「결과 더 보기」(`startBatch`) 거절에서는 이 prop을 넘기지 않아 단추가 없어야 합니다(AC-5)
   - **알아 둘 점(고치지 않음)**: 이 경우 `holdings.remaining`이 0이고 `books.last.hasMore`가 참이라 아래 단추가 다시 「다음 책 N권 보기」로 보입니다. 누르면 `loadMore`가 `books.last.page + 1`을 받아 와서, 거절된 페이지의 책들은 건너뛰는 것으로 보입니다. 이번 범위가 아니므로 바꾸지 않습니다. 실제로 그런지 확인해 plan-feedback에 적습니다
   - 의존: 3단계
   - 위험: 중간

### 5단계: 책 화면

1. **결과 자리 바꾸기** (파일: `web/src/features/book/BookPage.tsx` 208~232행)
   - 할 일: `holdingLibraryCount > 0`이고 "책 목록만" 상태와 같은 조건(`phase !== 'streaming'`, `blocked === 'busy'`, `openRefused`, `order`가 빔, 또는 다시 확인 중이고 `order`가 빔)이면 `ResultList` 대신 `BusyRetryNotice`(문구 `BUSY_BOOK_TEXT`, `onRetry`=`holdings.reopen`)만 그립니다
   - 책 머리(184~206행)와 조건 카드(207행)는 그대로입니다. 도서관 줄은 없습니다
   - 이렇게 하면 230행 `finishedText`("이 책을 가진 도서관을 모두 조회했습니다")가 보이지 않습니다 [확정]
   - 429와 그 밖의 경우는 지금 그대로입니다
   - 의존: 2, 3단계
   - 위험: 낮음
2. **추천도서 책 창** (`web/src/features/picks/PicksBookDialog.tsx`): 바꾸지 않습니다. 3단계 hook 변경 뒤에도 222~226행 문구 "대출 정보를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요."가 그대로 나오는지만 봅니다

### 6단계: 테스트

1. **`web/src/features/search/blocked.test.tsx`** (사이클 08 AC-3)
   - 113~130행 `'바로 보기: a refused holding stream shows the busy line'`의 기대값을 바꿉니다
     - `BLOCKED_TEXT.busy` 대신 `BUSY_KEEP_LIST_TEXT`가 보입니다
     - `link { name: /사랑의 기술/ }`이 보이고 `href`는 `/books/7…`입니다
     - "보유 도서관 3곳"이 보입니다
     - 버튼 「대출 정보 다시 확인」이 보입니다
     - 안내 줄이 책 줄보다 앞에 있습니다
     - `holdingStream`은 1번만 불렸습니다
   - 새 시험 [안: 이름]
     - (a) 단추를 누르면 `holdingStream`이 같은 `bookIds`(그리고 같은 filter·scope 등)로 다시 불립니다. 답을 기다리는 동안(끝나지 않는 Promise) "대출 정보 확인 중…"이 보이고 단추는 `disabled`입니다
     - (b) 다시 503이면 책 줄과 안내 줄이 그대로이고 단추를 다시 누를 수 있습니다
     - (c) 다시 확인에서 `targets` + `holding-result` + `done`이 오면 책 줄과 안내 줄이 사라지고 보통 결과가 보입니다
     - (d) 첫 스트림 429는 지금 안내문(`BLOCKED_TEXT.too_many`) 그대로이고 책 줄과 단추가 없습니다
     - (e) 「결과 더 보기」(`holdingBatchStream`) 503은 결과가 남고 `BLOCKED_TEXT.busy` 줄이 보이며 「대출 정보 다시 확인」은 없습니다
     - (f) 「다음 책 N권 보기」 뒤 `holdingStream` 503은 앞 결과가 남고 안내 줄에 단추가 있습니다. 누르면 그 페이지 책들로 `holdingStream`을 다시 부릅니다
   - 기존 `BookList` 시험 두 개(92~111행)와 reducer 시험(132~140행)은 그대로 통과합니다
2. **`web/src/features/book/BookPage.test.tsx`**에 describe 하나를 더합니다(사이클 28 AC-4)
   - `fetchBook` → `holdingLibraryCount: 2`, `holdingStream` → `ApiError(503, server_busy)`
   - 책 제목 heading, `BUSY_BOOK_TEXT`, 단추가 보입니다
   - "이 책을 가진 도서관을 모두 조회했습니다"는 없습니다
   - "책 목록만 먼저 보여 드려요."도 없습니다
   - 단추를 누르면 `holdingStream`이 두 번째로 불립니다
3. 백엔드: 바꾸지 않습니다. `./gradlew build`(`ModularityTests`의 `ApplicationModules.of(...).verify()`, `DocumentationTests` 포함)가 그대로 통과하는지 확인만 합니다. 모듈 변경이 없으므로 새 모듈 검증 시험은 없습니다

### 7단계: 손으로 확인과 문서

1. 로컬에서 자리 1개로 확인합니다(아래 "수용 기준"의 방법)
2. 화면 확인은 Playwright로 데스크톱 폭을 먼저 봅니다. 그다음 폰 폭(375px)에서 단추가 안내 줄 아래로 가는지, 글자가 넘치지 않는지 봅니다. 끝나면 브라우저 창 크기를 되돌립니다
3. **사용자 실제 폰 확인**: 결과 화면과 책 화면의 폰 모습이 바뀌므로, 사이클을 닫기 전에 사용자가 자기 폰(Samsung Internet)에서 같은 Wi-Fi로 dev 화면 서버 `web-lan-5174`(`.claude/launch.json`)를 열어 확인합니다. Chrome 폰 흉내로는 충분하지 않습니다(사용자 결정 2026-10-12)
4. dev `docs/maintenance/settings-index.md` 동시 검색 자리 줄(13행)에 "사이클 28부터 「바로 보기」 첫 조회 거절은 책 목록을 보임(화면만)"을 한 줄 더합니다 [안: 자리]. 값은 바뀌지 않습니다
5. `CHANGELOG`(있으면)에 화면 변경을 한 줄 적습니다

## 수용 기준과 확인 방법

공통 시험 환경: 백엔드를 `CHAEKCHECK_AVAILABILITY_MAXCONCURRENTSEARCHES=1`로 띄웁니다(`application.yml`에 `${…}` 자리가 없어도 환경 변수가 이깁니다. 사이클 20에서 확인). 다른 탭에서 대출 조회 하나를 열어 둡니다. 책 화면에서 보유 도서관이 많은 책을 열면 스트림이 몇 초 동안 자리를 잡습니다. 흔한 낱말 검색은 1~2초에 끝나 자리가 빨리 비므로 피합니다(사이클 20 기록). `GET /api/v1/lookup-status`의 `inUse`가 1인 동안 시험 탭에서 검색합니다.

| AC (spec.md 그대로) | 어떻게 확인 | 단계 |
|---|---|---|
| AC-1: 자리가 하나도 없는 상태(시험: `max-concurrent-searches=1`로 띄우고 다른 창에서 대출 조회 하나를 열어 둠)에서 「바로 보기」로 검색하면, 책마다 한 줄(제목·저자·출판사·보유 도서관 N곳)이 `/books` 순서대로 보이고, 목록 위에 안내 줄과 「대출 정보 다시 확인」이 보인다. 책 줄을 누르면 책 화면으로 간다 | 단위: `blocked.test.tsx` 바뀐 시험. 손: 위 환경에서 검색한 뒤 개발자 도구 Network에서 `/api/v1/books`의 `items` 순서와 화면 줄 순서가 같은지 봅니다. 스트림은 503입니다. 줄을 누르면 `/books/{id}?…`(filter·scope·visit 유지)로 갑니다 | 4, 6 |
| AC-2: 자리가 생긴 뒤 「대출 정보 다시 확인」을 누르면 보통 결과 화면이 되고 책 줄·안내 줄이 사라진다. 도서관 요청은 다시 확인 때 처음 보낸다(그 전에는 0건, 서버 로그) | 단위: 시험 (a)·(c). 손: 다른 탭의 조회가 끝난 뒤(`inUse` 0) 단추를 누르면 "대출 정보 확인 중…" → "도서관 N곳 조회 중" → 결과로 바뀝니다. 백엔드 로그에서 거절 시각부터 단추를 누르기 전까지 시험 탭의 책들에 대한 도서관 상세 요청 로그가 0건이고, 누른 뒤에 처음 생기는지 봅니다 | 3, 4, 6 |
| AC-3: 자리가 없는 채로 단추를 누르면 같은 화면이 유지되고 단추를 다시 누를 수 있다 | 단위: 시험 (b). 손: 다른 탭 조회를 열어 둔 채 단추를 누르면 잠깐 "대출 정보 확인 중…"이 보인 뒤 같은 책 줄과 안내 줄로 돌아오고 단추가 다시 눌립니다. Network에 새 스트림 요청이 503으로 한 건 생깁니다 | 3, 4, 6 |
| AC-4: 같은 상태에서 책 화면은 책 머리 + 안내 줄 + 단추를 보이고 "이 책을 가진 도서관을 모두 조회했습니다"는 보이지 않는다 | 단위: `BookPage.test.tsx` 새 describe. 손: 자리를 채운 상태에서 `/books/{id}`를 열어 확인합니다 | 5, 6 |
| AC-5: 같은 상태에서 직접 찾기와 「결과 더 보기」는 지금 동작·문구 그대로다 | 단위: 시험 (e). 손: 직접 찾기는 안내 줄 "지금 찾는 사람이 많아요. 잠시 뒤에 다시 해 주세요."가 보이고 단추가 없습니다. 「결과 더 보기」는 결과를 먼저 받은 뒤 자리를 채우고 누르면 결과가 남고 같은 안내 줄이 보이며, 다시 「결과 더 보기」로 묻습니다. 추천도서 책 창도 지금 문구 그대로인지 봅니다 | 4, 5, 6 |
| AC-6: 거절 1건마다 1분 요약 로그 거절 수가 1 오르고 `/api/v1/lookup-status`가 10초 동안 `RED`다(지금과 같음) | 손: `CHAEKCHECK_AVAILABILITY_OPSSUMMARY_INTERVAL=15s`도 함께 켜면 빨리 볼 수 있습니다(사이클 20에서 쓴 값). 거절 1건(첫 스트림 또는 다시 확인 503) 뒤 요약 로그의 거절 수가 1 오르는지, `GET /api/v1/lookup-status`의 `level`이 약 10초 동안 `RED`인지 봅니다. 다시 확인 503도 1건으로 셉니다(서버가 그대로이므로) | 7 |
| AC-7: 서버 코드·API는 바뀌지 않는다(백엔드 테스트 변경 0, `api.md` 변경 없음) | `git diff --stat main...<브랜치> -- backend/`가 비어 있음. `./gradlew build` 통과. 배포는 `release.sh X.Y.Z web`만 | 전체 |

## 완료 기준

- [ ] AC-1~AC-7을 위 방법으로 확인하고 결과를 dev `docs/cycles/28/plan-feedback.md`의 AC 확인표에 적었음
- [ ] `web/`에서 lint·test·build 통과. 바뀐 `blocked.test.tsx`와 새 `BookPage.test.tsx` 시험 포함
- [ ] `backend/`에서 `./gradlew build` 통과(`ModularityTests` `ApplicationModules.verify()`, `DocumentationTests`). `backend/` 변경 0
- [ ] ADR-0170 체크리스트 "해당 없음(Liquibase 변경 없음)"을 확인하고 적었음
- [ ] Playwright로 데스크톱 폭, 그다음 폰 폭에서 결과 화면과 책 화면을 확인했음
- [ ] **사용자가 자기 폰(Samsung Internet)에서 dev 화면 서버 `web-lan-5174`(`.claude/launch.json`, 같은 Wi-Fi)로 「바로 보기」 책 줄 목록 + 안내 줄 + 단추, 책 화면 안내 줄 + 단추를 확인했음.** 사이클을 닫기 전에 합니다. Chrome 폰 흉내로는 충분하지 않습니다 (사용자 결정 2026-10-12, plan `docs/cycles/10-popular-books/easy/2026-10-12-design-addendum-decisions.html` #3)
- [ ] 화면만 올리는 릴리스로 운영에 반영했음(`release.sh X.Y.Z web`, 사이클 27 방식)

## 이번에 하지 않는 것

- 첫 스트림 거절 때 도서관별 줄과 도서관 책 페이지 링크 보여 주기. 서버를 바꿔야 하는 가안 방식이며 plan `docs/backlog.md`에 한 줄로 두었습니다
- 서버 변경 전부: 스트림 안 `holding-failed server_busy`(가안), 새 이벤트 `lookups-unavailable`(나안), `Retry-After`, `SearchSlots`, `RefusalRecord`, `LookupOpsCounters`
- 자동 재시도, 기다린 뒤 다시 묻기, 대기열, 자리 수 60 바꾸기
- 429 처리, 「결과 더 보기」 거절 문구, 추천도서 책 창 문구, 직접 찾기, 도서관별 더 보기, AI 책 찾기의 503
- 「다음 책 N권 보기」 거절 뒤 아래 단추가 거절된 페이지를 건너뛰는 것으로 보이는 문제(4단계 2). 확인해 보고만 합니다
- `usagelog`에 새 기록 더하기
- plan `docs/current/`(`flows.md` 흐름 22, `api.md` `server_busy` 행 설명)와 plan `docs/settings-index.md`는 plan이 cycle-close에서 이미 고쳤습니다(2026-11-07)

## 개발 후 plan 쪽에 알려줄 것

dev **`docs/cycles/28/plan-feedback.md`**(새 파일, 사이클별 규칙)에 적습니다.

- 시작 상태: worktree, 브랜치, 시작 커밋, 위 "plan이 다시 확인한 dev 위치"와 줄 번호가 달랐던 곳
- 정한 것: 새 컴포넌트·파일 이름, `openRefused`·`reopen`을 어디에 두었는지(reducer 필드인지 hook 상태인지), `ResultList`에 더한 prop 이름, 단추 스타일, "책 목록만" 상태에서 정렬·거르기 도구줄을 숨겼는지
- 설계와 달라진 점과 그 이유(사용자 발언은 그대로)
- 새로 알게 된 제약
  - 같은 책을 다시 열 때 빈 묶음이 남는지
  - 「다음 책 N권 보기」 거절 뒤 아래 단추가 페이지를 건너뛰는지(4단계 2)
  - 추천도서 책 창에 영향이 없었는지
- AC 확인표, Playwright 캡처 위치, 사용자 실제 폰 확인 결과와 날짜
- ADR-0170 "해당 없음" 확인, 배포한 판 번호와 `release.sh … web` 결과 줄
