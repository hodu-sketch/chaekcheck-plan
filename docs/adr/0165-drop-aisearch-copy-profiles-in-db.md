# ADR-0165: AI 검색 사본 표(`aisearch.search_book`)를 없애고 `catalog`에서 찾으며, 책 프로필은 DB에 두고 서버 시작 때 한 번 읽음

Status: Accepted
Date: 2026-10-28
Cycle: 26-book-descriptions
Supersedes: ADR-0151의 "`aisearch` 표의 사본에서 DB 낱말 맞추기" 부분

## 배경
AI 검색은 `catalog`의 제목·저자·소장 도서관을 복사한 사본 표(76,759권)에서 찾고, 프로필은 모델 폴더 파일(77,551권)에서 시작 때 읽음. 사용자는 중복 저장을 원하지 않음.

## 결정
- `aisearch.search_book`을 없앤다. 찾기용 한 줄·찾기 글 색인(pg_bigm)·찾기 전용 `library_ids`(ADR-0160)는 `catalog.book_search`에 두고, 제목·저자는 `catalog.book`에서 읽는다. AI 검색 대상은 `book_search` 행이고 `collection`이 지금처럼 고른다(추천목록 책 + 보유 많은 책 상위 N − 뺄 책)
- 표지·요약은 AI 호출과 겹쳐 읽는 지금 방식을 유지한다
- 책 프로필은 `catalog.book_profile`(형식 있는 칸)에 두고, 새 넣기 모드 `book-profiles`(`# export_id=`)로 전체를 바꾼다. AI 검색은 서버 시작 때 한 번 메모리에 읽는다(책 벡터와 같은 때)

## 표 단위로 (사용자 "뭐가 뭔지 모르겠어"에 답한 그대로, 2026-10-28)

| 표 | 지금 | 바꾼 뒤 |
|---|---|---|
| `aisearch.search_book` | `title`·`author`(`catalog.book`에서 복사), `line`·`search_text`, `library_ids`(`catalog.book`에서 복사) | **표 전체를 지움** |
| `catalog.book_search` (새) | — | `line`, `search_text`, `library_ids` |
| `catalog.book` | `title`, `author`, `library_ids` | 그대로 |

- 속도를 위해 남긴 것은 `library_ids` 칸: AI 검색 모듈 표에서 `catalog.book_search`로 자리만 옮겨 남음. `catalog.book`과 같은 값이 두 번 → 예외(ADR-0160). 찾기 질의는 표 이름만 바뀌어 속도는 지금과 같음
- 없어지는 것: `title`·`author` 복사본과 AI 검색 모듈의 표 자체. 제목·저자는 찾은 뒤 카드에 쓸 몇 권만 `catalog.book`에서 읽음
- 책 프로필(`catalog.book_profile`) 시작 때 한 번 읽기는 이 표와 별개: AI 검색 첫 단계(`MlFirstCall`)가 질문마다 77,551권을 훑으므로 백엔드 메모리(약 12~16MB [추론])에 두고, 같은 단계의 책 벡터 파일(`book-vectors.bin`)도 시작 때 읽으므로 같은 때 읽어 어긋나지 않게 함. 새로 넣으면 서버를 다시 켬

## 이유 (사용자 발언)
- "지금 더 군데 중복저장되는거는 없었으면해" (2026-10-27)
- "책 프로필도 DB로 / AI 검색이든 뭐든 사용하는데 지장없도록 해" (2026-10-27)
- 대상 위치·프로필 칸·시작 때 읽기: [이유 미확인] (설계 결정 #5·#7 승인)
- "기록해" (2026-10-28, 위 표 설명을 본 뒤)
- dev 24 제약(2026-10-27): 표지·요약 겹쳐 읽기 유지, 프로필은 요청마다 DB를 읽지 않음

## 검토한 대안
### A안: 사본 없앰, 프로필 DB (채택)
### B안: 찾기용 한 줄만 옮기고 사본은 둠
- 채택하지 않은 이유: "지금 더 군데 중복저장되는거는 없었으면해" (2026-10-27)
### C안: 찾기용 한 줄·프로필을 지금 자리에 둠
- 채택하지 않은 이유: 위와 같음
### D안: 프로필 jsonb 한 칸
- 채택하지 않은 이유: [이유 미확인]

## 결과
- 좋아지는 점: 다른 모듈로의 복사가 없어짐, 프로필을 다른 기능도 쓸 수 있음
- 감수하는 점: AI 검색 찾기 글의 제목이 추천목록에 보이는 이름에서 `catalog.book.title`로 바뀜(옮긴 뒤 결과·첫 글 시간 비교), 새 프로필을 넣으면 서버를 다시 켬
