# ADR-0162: 설명은 책 번호로 저장하고, 다시 가져오기 때 버려진 번호의 설명을 같은 작업에서 지우며, 설명 넣기 파일에 가져오기 번호를 검사함

Status: Accepted
Date: 2026-10-28
Cycle: 26-book-descriptions
Supersedes: 없음

## 배경
dev 메모는 "다시 가져오면 책 번호가 새로 매겨진다"고 적었으나, 2026-10-05부터 다시 가져오기는 소장 겹침으로 옛 번호를 이어 줌(dev `Ids.decide`). 합쳐진 책의 큰 번호와 사라진 책 번호는 버려지고 옮겨 주는 표가 없음. `book-texts` 넣기에는 가져오기 번호 검사가 없어 사람이 손으로 확인함.

## 결정
- 설명 표는 `book_id`로 저장하고 `catalog.book`으로의 FK는 두지 않는다(가져오기 때 `book`을 DROP하므로)
- 바꿔 끼우기(`swap`)의 같은 트랜잭션, DROP 앞에서 `catalog_next.book`에 없는 `book_id`의 설명을 지우고 지운 수를 기록한다
- `book-texts`와 새 `book-profiles` 넣기 파일 첫 줄에 `# export_id=<uuid>`를 적고, 마지막 SUCCEEDED 가져오기와 다르면 파일 전체를 거절한다(`neighbours`와 같은 강제 설정)

## 구체적으로 (사용자 요청 "어느 모듈 테이블 어느 컬럼 그리고 어느 상황?", 2026-10-28)
- 상황 1, 책 목록 다시 가져오기(`collection` 가져오기 명령 → `JdbcCatalogLoad.swap`): 새 책 목록을 `catalog_next`에 만든 뒤 한 트랜잭션에서 `catalog.book`·`book_contributor`·`holding`·`catalog_library_snapshot`을 바꿔 끼움. 그 트랜잭션 안, 네 표를 버리기 직전에 `catalog.book_summary`·`book_cover`·`book_profile`·`book_search`·`book_tag`의 줄 가운데 `catalog_next.book.id`에 없는 `book_id`를 지움. 지운 수는 `collection.catalog_import.description_deleted_count`(새 칸). 예: 「채식주의자」 두 판(5, 9)이 합쳐지면 5가 남고 9의 요약·표지·찾기 줄이 지워짐. 버려진 번호는 다시 쓰지 않음(새 책은 지금까지 쓴 번호보다 큰 번호)
- 상황 2, PC 설명 파일 넣기(`collection` `book-texts`·`book-profiles` 명령): 파일 첫 줄 `# export_id=<uuid>`(PC가 책 번호를 가져온 가져오기)를 운영 `collection.catalog_import`의 마지막 SUCCEEDED 줄 `export_id`와 비교, 다르면 아무것도 넣지 않음. 예: PC가 15번 기준으로 만든 파일을 14번이 적용된 운영에 넣으려 하면 멈춤

## 이유 (사용자 발언)
- [이유 미확인] (범위 결정 #2 승인 2026-10-27, ADR 초안 승인 2026-10-28)

## 검토한 대안
### A안: 책 번호 + 정리 + 번호 검사 (채택)
### B안: ISBN 기준
- 단점: ISBN 없는 책은 설명을 가질 수 없음, 지금 요약 6.8만 권을 바꿔야 함
- 채택하지 않은 이유: [이유 미확인]
### C안: 작품 키를 만들어 저장
- 단점: 가져오기에 새 단계
- 채택하지 않은 이유: [이유 미확인]

## 결과
- 좋아지는 점: 설명이 엉뚱한 책에 붙지 않음, 넣기 실수를 명령이 막음
- 감수하는 점: 새 번호(새 책·갈라진 책)는 다음 넣기 때까지 설명 없음
