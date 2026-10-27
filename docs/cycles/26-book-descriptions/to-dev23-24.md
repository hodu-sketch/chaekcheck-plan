# 사이클 26 → dev 23·24 세션: 책 설명 표가 `catalog`로 옮겨집니다

- 작성 2026-10-27, plan 세션 `chaekcheck-plan-cycle-26`. 이 파일 하나를 계속 고쳐 씀 (요약 왕복 대신)
- 사용자 결정 (2026-10-27): "지금 이거 먼저 하고 DEV23,24에게 알려줘서 알아서 고치라고 해", "그쪽을 바꿔야 하면 DEV24, 추천을 바꿔야하면 DEV23에게 알려주고"
- 지금 단계: **범위만 정해짐** (`scope.md`). 표·API 이름과 옮기는 순서는 design-delta 뒤에 이 파일 3절에 적음. 그 전에는 아래 1절만 참고

## 1. 정해진 방향 [확정]

| 지금 | 옮겨 갈 곳 | 영향 받는 세션 |
|---|---|---|
| `foryou.book_blurb` (책첵 요약) | `catalog` 표, 요약은 책마다 하나 | dev 23 (`foryou` 카드), dev 24 (`aisearch` 카드가 `foryou.BookBlurbs`를 부름) |
| `foryou.book_cover` | `catalog` 표 | dev 23, dev 24 (`foryou.BookCovers`) |
| `picks.book_tag`, `picks.tag_dictionary` | `catalog` 표 | dev 23 (`ListedBook.tags`) |
| `book-profiles.tsv` (aisearch 모델 폴더) | `catalog` 표 (DB) | dev 24 (`MlFirstCall`) |
| `picks/ai-summaries.tsv` (추천목록 요약) | **없앰**, 요약은 책첵 요약 한 종류 | dev 23·24 (`ListedBook.aiSummary`를 읽는 곳) |
| `aisearch.search_book.line` | 그대로 `aisearch` [안] | — |

- 다른 모듈은 `catalog` 공개 API로만 읽음. `foryou.BookBlurbs`·`BookCovers`는 없어질 예정
- 기준은 지금처럼 `book_id`. 다시 가져오기에서 버려진 번호의 설명은 `catalog`가 같은 작업에서 지움. `book-texts`에 가져오기 번호 검사가 생김
- dev 순서: **사이클 26이 먼저**. 23·24는 3절이 채워지면 맞춰 고침

## 2. 지금 부탁 [안]

- 위 표의 자료를 **새로 읽거나 쓰는 코드를 더 만들 때는** 한 곳(작은 읽기 클래스 하나)을 거치게 해 두면, 26 뒤에 고칠 곳이 그 한 곳으로 줄어듭니다. 이미 만든 것을 지금 고칠 필요는 없습니다

## 2-1. 받은 답

- dev 24 (2026-10-27): 받음, design-delta 뒤 맞춤. 제약 두 개(카드 표지·요약 비동기 읽기 유지, 프로필은 요청마다 DB를 읽지 않게)는 `scope.md` "dev 세션이 알려 준 제약"에 적음

## 3. 바뀌는 표·API와 고칠 것 (design-delta 뒤에 채움)

아직 없음.
