# 사이클 26 → dev 23·24 세션: 책 설명 표가 `catalog`로 옮겨집니다

- 작성 2026-10-27, plan 세션 `chaekcheck-plan-cycle-26`. 이 파일 하나를 계속 고쳐 씀 (요약 왕복 대신)
- 사용자 결정 (2026-10-27): "지금 이거 먼저 하고 DEV23,24에게 알려줘서 알아서 고치라고 해", "그쪽을 바꿔야 하면 DEV24, 추천을 바꿔야하면 DEV23에게 알려주고"
- 지금 단계 (2026-10-28): **인계 끝** (`handoff.md`, ADR-0160~0166). 3절이 바뀌는 표·API
- **바뀜 (사용자 "26 dev가 같이하고 dev/plan 23/24에게 알려줘", 2026-10-28)**: 3절의 "dev 23 몫"·"dev 24 몫"은 **dev 26이 배포 1에서 main의 지금 코드에 직접** 합니다. 23·24는 진행 중인 브랜치를 그 뒤 rebase해서 `catalog` API 쪽으로 맞추면 됩니다. dev 24는 AI 검색 전후 비교(AC-7·12)와 운영 프로필 줄 수 확인만 맡습니다

## 1. 정해진 방향 [확정]

| 지금 | 옮겨 갈 곳 | 영향 받는 세션 |
|---|---|---|
| `foryou.book_blurb` (책첵 요약) | `catalog` 표, 요약은 책마다 하나 | dev 23 (`foryou` 카드), dev 24 (`aisearch` 카드가 `foryou.BookBlurbs`를 부름) |
| `foryou.book_cover` | `catalog` 표 | dev 23, dev 24 (`foryou.BookCovers`) |
| `picks.book_tag`, `picks.tag_dictionary` | `catalog` 표 | dev 23 (`ListedBook.tags`) |
| `book-profiles.tsv` (aisearch 모델 폴더) | `catalog` 표 (DB) | dev 24 (`MlFirstCall`) |
| `picks/ai-summaries.tsv` (추천목록 요약) | **없앰**, 요약은 책첵 요약 한 종류 | dev 23·24 (`ListedBook.aiSummary`를 읽는 곳) |
| `aisearch.search_book` (표 전체) | **없앰**. 찾기용 한 줄·찾기 글·`library_ids`는 `catalog.book_search`로(ADR-0165, 예외 ADR-0160), 제목·저자는 `catalog.book`에서 | dev 24 |

- 다른 모듈은 `catalog` 공개 API로만 읽음. `foryou.BookBlurbs`·`BookCovers`는 없어질 예정
- 기준은 지금처럼 `book_id`. 다시 가져오기에서 버려진 번호의 설명은 `catalog`가 같은 작업에서 지움. `book-texts`에 가져오기 번호 검사가 생김
- dev 순서: **사이클 26이 먼저**. 23·24는 3절이 채워지면 맞춰 고침

## 2. 지금 부탁 [안]

- 위 표의 자료를 **새로 읽거나 쓰는 코드를 더 만들 때는** 한 곳(작은 읽기 클래스 하나)을 거치게 해 두면, 26 뒤에 고칠 곳이 그 한 곳으로 줄어듭니다. 이미 만든 것을 지금 고칠 필요는 없습니다

## 2-1. 받은 답

- dev 24 (2026-10-27): 받음, design-delta 뒤 맞춤. 제약 두 개(카드 표지·요약 비동기 읽기 유지, 프로필은 요청마다 DB를 읽지 않게)는 `scope.md` "dev 세션이 알려 준 제약"에 적음

## 3. 바뀌는 표·API와 고칠 것 (2026-10-28, 상세는 `design-delta.md`)

- 새 `catalog` 표: `book_summary`, `book_cover`, `book_profile`, `book_search`, `tag_dictionary`, `book_tag`
- 새 `catalog` 공개 API [안: 이름]: 읽기 `BookTexts`(`summaries`, `coverUrls`, `listCoverUrls`, `tags`), `CoverUrls`(`of(fileKey)`), `BookProfiles`(`all`, `version`), `AiSearchIndex`(`find`, `planCounts`, `lines`, `books`, `version`, `compact`) / 쓰기 `BookTextsTransfer`
- 배포 순서: 26 배포 1(새 표 + 복사 + `picks`·`foryou`·`aisearch` 읽는 곳 바꿈) → 확인 → 134만 표지·프로필 넣기 → 26 배포 2(옛 표 지움). 23·24 브랜치는 rebase 때 옛 표·API(`foryou.BookBlurbs`·`BookCovers`, `aisearch.search_book`, `book-profiles.tsv` 파일 읽기)를 쓰는 새 코드가 없게 맞춤

### `foryou`에서 바뀌는 것 (dev 26이 함, dev 23은 rebase로 맞춤)
- `BookTexts`(internal)의 요약·표지 질의 → `catalog.BookTexts.summaries`/`coverUrls`
- `BookBlurbs`·`BookCovers`·`ForYouTransfer`의 요약·표지 쓰기 없앰 (`ForYouTransfer`는 이웃만)
- 카드 응답의 `aiSummary` 칸 없애고 `blurb` 하나, 웹 `forYouBook.ts`의 `aiSummary ?? blurb`도
- 꼬리표는 `ListedBook.tags`(picks가 `catalog`에서 읽음) 그대로

### `aisearch`에서 바뀌는 것 (dev 26이 함, dev 24는 rebase로 맞춤 + 전후 비교)
- `CandidateQuery`(find·planCounts·lines) → `catalog.AiSearchIndex`, 질의는 표 이름만 바뀜(`library_ids` 남음)
- `SearchBooks` → `AiSearchIndex.books()/version()`(1분 확인 그대로)
- 카드 표지·요약: `foryou.BookCovers`/`BookBlurbs` → `catalog.BookTexts`, **겹쳐 읽기(beside) 그대로**
- `MlFirstCall`: `BookProfiles.all()`을 시작 때 한 번(파일 대신)
- 찾기 글 제목이 추천목록에 보이는 이름 → `catalog.book.title`로 바뀜: 같은 질문 묶음으로 후보·첫 글 시간을 전후 비교해 `plan-feedback.md`에 (AC-7·AC-12)
- `build_100k.py` 결과를 `book-texts`(요약·찾기용 한 줄) + `book-profiles` 파일로, 둘 다 첫 줄 `# export_id=`

### 둘 다
- Liquibase 번호: 26은 `catalog/002`, `collection/007`, 배포 2에 `foryou/002`·`picks/007`·`aisearch/005`. 23·24 브랜치가 같은 번호를 쓰면 그쪽을 올림
