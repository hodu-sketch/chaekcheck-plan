# dev에 맡기는 작은 일: 사이클 21 회고 고침 (2026-10-17)

- 근거: 회고 `docs/cycles/21-recommended-books/retro.md` "사용자에게 확인할 것" 2 → [확정] (사용자 승인, 2026-10-17, 회고 결정 #2; 결정 페이지 `easy/2026-10-17-retro-decisions.html`)
- 지침: `docs/research/recommended-lists/matching-guide.md` 2-2절·4절, ADR-0124 "결과" 바뀜 줄
- 크기: 수집기 Python 한 곳 + 시험 + dev 문서 한 줄 + 수집기 다시 돌리기. 새 모듈·표·칸·API 없음

## 무엇을 바꾸나

수집기 판 고르기(dev `scripts/crawl/recommended_lists.py` `choose_editions`, 490~500행 근처)의 **"저자를 보지 않고 다시 고르기"를 없앱니다** [확정] (회고 결정 #2).

지금 동작 (dev 코드, 2026-10-17 읽음):

1. 시작 판(고정 판 ISBN → 고정 판 제목 → 줄 ISBN → 줄 제목 + 첫 저자)에서 `Catalog.same_book`으로 같은 책 판(본제목 + 저자 하나 이상 같음, 같은 출판사 세트 권)을 모음
2. `excluded()`(`collector_words.tsv`)로 거른 뒤 `choose()`
3. **남은 판이 없으면** `same_book(dict(anchor, authors=set()))`(같은 본제목, 저자 무관)과 `same_book({'main': text_key(row['title']), 'authors': set()})`(목록 줄의 제목, 저자 무관)로 다시 모아 고름 ← 이것을 지움

바꾼 뒤: 3을 지우고, 2에서 남은 판이 없으면 지금 `best is None` 길 그대로 고정 판 칸(`pinned_title`·`pinned_author`·`pinned_publisher`·`pinned_isbn13`·`pinned_by`)을 비우고 기록 줄을 남깁니다. `manual` 줄은 지금처럼 건드리지 않습니다.

이유 (사용자가 고른 안): 명세 R3-3 "같은 책 = 본제목 + 저자"와 어긋나고, 다른 사람이 쓴 같은 제목 책에 맞출 수 있음(「체호프 희곡선」 같은 오매칭 길). 그런 줄은 "못 맞춤"(흐린 표지, 누르면 희망도서 안내 — 명세 R2-4, 결과 검토 #2)으로 두고, 바른 판이 있는 책만 사람이 `manual`로 고정합니다(지침 4절).

## 함께 고칠 것

- 시험 `scripts/crawl/test_recommended_lists.py` `EditionTests.test_excluded_editions_fall_back_to_the_title`(실천이성비판): "같은 저자 판이 모두 걸러지고 다른 저자의 같은 제목 판만 있으면 → 고르지 않음(`{}`), 고정 판 칸이 빔"으로 바꿈. 이름도 그 뜻으로. 같은 저자의 걸러지지 않은 판이 있으면 그것을 고르는 경우는 남김
- 공용 시험 자료 `scripts/crawl/testdata/book_choice_cases.json`: `choose()`(보유량 공식)만 다루므로 바꿀 것 없음 [안: 바꿀 일이 보이면 Java `BookChoiceTests`와 함께]. Java 쪽(`picks`)에는 이 대체 고르기가 없으므로 Java 코드는 바뀌지 않음 (dev 코드 확인 2026-10-17: 대체는 수집기 `choose_editions`에만 있음)
- 기록 줄: `best is None`일 때 지금 `edition: none left for …`는 고정 판이 있던 줄에만 남음 → 거르기로 모두 빠진 줄도 알아볼 수 있게 한 줄 남김(예: `edition: every same-author edition excluded for …`, 글은 dev가 정함 [안])
- dev 문서: `docs/maintenance/4-picks.md` 132행 "다 걸러지면 같은 본제목 판 전체(저자 무관)에서 다시 고르고"를 지우고 "다 걸러지면 고정 판을 비움 → 못 맞춤이면 지침 4절대로 사람이 `manual`"로. `docs/plan-feedback.md` 4775행은 기록이라 그대로 두고 아래 보고에 "바뀜"을 적음
- 표지 쪽 `KakaoBooks`의 "same title by anyone"(710행)은 표지 차례(`cover_sources.tsv`)에 카카오가 없어 불리지 않으므로 이번 일이 아님

## 다시 돌리기와 보고

1. 수집기를 이동진·서울대 두 목록 모두 다시 돌립니다(YouTube 확인은 평소 차례대로, 판 고르기가 바뀌는 것만 보면 됨)
2. 바뀌기 전 목록 파일(`scripts/crawl/lists/leedongjin.tsv`·`snu100.tsv`)과 견줘 **고정 판이 바뀌거나 비게 된 줄**을 모두 셉니다
3. dev `docs/plan-feedback.md` "# 사이클 21" 끝에 절 하나(예: "### plan 21 회고 고침: 저자 무관 다시 고르기 지움 (날짜)")로 보고합니다
   - 줄마다: 목록, 번호(서울대 목차 번호 / 이동진 영상 달), 목록 제목·저자, 전 고정 판(제목·출판사·ISBN·책 번호), 뒤(빔 또는 다른 판)
   - 명세 R3-4가 "자동으로 풀림"이라 적은 춘향전·실천이성비판·연암집이 뒤에도 맞는지 따로 적음
   - 고정 판이 빈 줄이 export ④(목록 줄 ISBN → 제목 + 저자)에서 다시 맞춰지는지, 맞춰지면 그 책이 거르기 낱말에 걸리는 판(어린이·요약·번역AI 등)인지 적음 — 걸리는 판에 맞춰지면 고치지 말고 plan에 알림(정하지 않은 길)
   - 맞춘 수 전·뒤 (지금 서울대 87/100, 이동진 36/43)
4. 바른 판이 카탈로그에 있는데 비게 된 줄은 dev가 고정하지 말고 표로만 올립니다. plan이 사용자에게 묻고, 정해지면 지침 4절대로 `manual`(메모 칸에 근거)로 고정합니다

## 다 됐다고 보는 기준

- `choose_editions`에 저자 무관으로 다시 모으는 길이 없음(`authors=set()`로 `same_book`을 부르는 곳 없음)
- 수집기 시험 모두 통과(바꾼 실천이성비판 시험 포함), `./gradlew build`는 Java가 바뀌지 않으면 돌리지 않아도 됨
- 두 목록을 다시 돌린 목록 파일, 위 3번 보고가 plan-feedback "# 사이클 21"에 있음
- `docs/maintenance/4-picks.md` 문장 고침
- 운영 반영은 이번 일에 넣지 않음: 다음 정기 가져오기 때 목록이 함께 실려 감(ADR-0123·0124) [안: 바로 반영할지는 보고를 본 뒤 사용자가 정함]
