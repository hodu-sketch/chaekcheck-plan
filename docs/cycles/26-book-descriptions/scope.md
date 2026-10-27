# 사이클 26: 책 설명 한 곳에 모으기

- 시작 2026-10-27, 세션 `chaekcheck-plan-cycle-26` (사용자: "니가 좀 담당해보자", "지금 dev 23,24는 진행중이고 plan 25도 진행중이야")
- 계기: dev `docs/plan-feedback.md` "### [plan으로] 책 설명을 한 곳에 모으기 (2026-10-27)" (dev main `905eab7` 기준 6973행). dev 세션이 낸 제안을 plan에서 정하는 사이클
- 직전 사이클 회고: 22는 회고 끝, 23·24는 dev 진행 중이라 회고는 각자 dev 뒤 (이 사이클 시작 조건에서 생략)

## 목표 (한 문장)

같은 책이면 추천목록·책첵 추천·AI 검색·책 상세 어디서나 같은 요약과 표지가 보이도록, 책 설명 자료를 한 모듈에 모은다 [안].

## 지금 상태 (dev main `905eab7`, 2026-10-27 코드에서 직접 확인) [확정]

| 자료 | 모듈 | 저장 | 기준 | 쓰는 길 | 읽는 곳 |
|---|---|---|---|---|---|
| 추천목록 책 AI 요약 | `picks` | 빌드에 실린 파일 `picks/ai-summaries.tsv` (`list`, `isbn13`, `title`, `summary`) | ISBN-13, 없으면 목록+제목 | 손으로 확인한 Haiku 결과를 저장소에 커밋 (dev `docs/maintenance/4-picks.md` 8절) | `GET /api/v1/picks/{list}`, `picks.ListedBooks.ListedBook.aiSummary` → `foryou`, `aisearch` |
| 책첵 추천 요약 (해요체) | `foryou` | `foryou.book_blurb` (`book_id` PK, `blurb` 1~300자, `made_on`) | `book_id` | `book-texts` kind `for_you_blurb` | `foryou` 카드, 공개 API `foryou.BookBlurbs` → `aisearch` 카드 (목록 요약이 없을 때) |
| 표지 연결 | `foryou` | `foryou.book_cover` (`book_id` PK, `file_key` sha1) | `book_id` | `book-texts` kind `cover_file` | `foryou` 카드, 공개 API `foryou.BookCovers` → `aisearch` (목록 표지가 없을 때) |
| AI 검색 찾기용 한 줄 | `aisearch` | `aisearch.search_book.line` (표 전체가 사본) | `book_id` | `book-texts` kind `search_line` | `aisearch` 두 번째 호출 입력만 (카드에는 안 보임) |
| 책 프로필 (분야·대상·수준·형식…) | `aisearch` | 모델 폴더 파일 `book-profiles.tsv` | 벡터를 만든 내보내기의 `book_id` | `scripts/aisearch/eval/export_first_call.py` | `MlFirstCall` (`first-call.mode: ml`일 때)만 |
| 꼬리표 + 사전 | `picks` | `picks.book_tag`, `picks.tag_dictionary` | `book_id` | `book-texts` kind `tags`, 모드 `tag-dictionary` | `ListedBook.tags` → `foryou` (지금 0줄) |

- 화면: 요약은 추천목록 책 창(`PicksBookDialog`, 「AI 요약 ⓘ」)에서만 보임. 추천목록·책첵 추천·AI 검색에서 이 창을 엶. 일반 검색 결과(`SearchPage`)와 책 상세(`/books/:bookId`, `BookPage`)에는 요약도 표지도 없음 [확정]
- 책 번호: dev 메모의 "다시 가져오면 책 번호가 새로 매겨짐"은 **2026-10-05부터 맞지 않음**. 다시 가져오기는 소장 겹침(`library_id`, `item_key`)으로 옛 번호를 이어 줌. 합쳐진 책은 가장 작은 옛 번호가 남고, 갈라지거나 새로 생긴 책만 새 번호, 사라진 번호는 따로 옮겨 주는 표 없이 버림 (dev `catalog/internal/JdbcCatalogLoad.java` `Ids.decide`, `docs/maintenance/3-import.md` 7절) [확정]
- 가져오기 번호(`export_id`) 검사는 `neighbours` 넣기에만 있고 `book-texts`에는 없음. `book-texts`는 사람이 손으로 확인 [확정]
- 바뀌지 않는 키: `catalog.book.isbn13`(UNIQUE, NULL 허용), `catalog.holding (library_id, item_key)`. 작품 키는 저장하지 않고 조회 때 계산 [확정]

## 포함 [안]

- 책 설명 표(요약·표지·꼬리표+사전)를 한 모듈로 옮기고, 다른 모듈은 그 모듈의 공개 API로만 읽음
- 추천목록 요약 파일을 표로 옮김 (책 번호로 바꿔 넣음)
- 한 책에 요약 하나: 여러 출처가 있으면 정한 순서로 하나만 보임
- 다시 가져오기 때 사라진 책 번호의 설명을 지움, `book-texts`에 가져오기 번호 검사
- 책 상세 화면에 요약(·표지) 보이기
- 옛 표·파일을 지우는 순서

## 제외 (backlog.md로)

- 요약이 없는 책 12,666권의 요약 만들기 (Haiku 배치는 23·24 흐름 그대로)
- AI 검색 찾기용 한 줄은 `aisearch`에 그대로 (검색 전용 사본) [안]
- 책 프로필 파일의 DB 이동 [안] — 결정 #5에서 정함

## 완료 기준 (사용자가 화면에서 확인할 수 있는 것) [안]

1. 추천목록 책 창, 책첵 추천 카드, AI 검색 카드에서 같은 책을 열면 같은 요약이 보인다
2. 일반 검색에서 책을 눌러 들어간 책 상세 화면에 요약이 보인다 (요약이 있는 책)
3. 다시 가져오기 뒤에도 요약·표지가 엉뚱한 책에 붙지 않는다 (사라진 번호의 설명은 지워지고, 이어진 번호는 그대로)
4. 지금 보이던 요약·표지가 옮긴 뒤에도 하나도 빠지지 않는다 (옮기기 전후 수 비교)

## 먼저 조사할 것 [확인 필요]

| 항목 | 확인 방법 |
|---|---|
| 추천목록 요약 파일 줄 중 책 번호로 바꿀 수 없는 줄 수 | dev에서 `ai-summaries.tsv`를 `ListedBooks`와 맞춰 보기 (dev 일) |
| 요약 출처 둘이 겹치는 책 수 (목록 요약과 책첵 요약이 모두 있는 책) | dev 운영 역할 DB 조회 |
| 사이클 23·24 dev가 끝날 때 이 표들이 더 바뀌는지 | 23·24 dev 끝난 뒤 dev main 다시 읽기 |
| 사이클 25(plan 진행 중)가 같은 표를 건드리는지 | 사이클 25 세션 문서가 올라오면 확인 |

## 슬라이스 선택 기록

- ICE 점수 없음. 사용자가 dev 제안을 보고 이 세션에 맡김 ("니가 좀 담당해보자", 2026-10-27)
- dev 순서: 23·24 dev 뒤 [안] (결정 #6)

## 영향 받을 모듈 [안]

`catalog`(또는 새 모듈), `picks`, `foryou`, `aisearch`, `collection`(`book-texts`), 웹(`BookPage`, 책 창)

## 관련 문서

- dev `docs/plan-feedback.md` 6973행~ (제안 원문)
- [사이클 23 design-delta](../23-for-you-picks/design-delta.md) (`foryou.book_blurb`, `book_cover`)
- 사이클 24 design-delta (plan 브랜치 `claude/compassionate-lovelace-mzvp4f`, main에 아직 없음) — `book-texts` 모드, ADR-0151
- [docs/research/ai-recommend/tag-vocabulary.md](../../research/ai-recommend/tag-vocabulary.md) (꼬리표 사전)
- 결정 페이지: [easy/2026-10-27-scope-decisions.html](easy/2026-10-27-scope-decisions.html)
