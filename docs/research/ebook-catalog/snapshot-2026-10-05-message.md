# plan 세션에 붙여 넣을 메시지: 배포용 수집 DB 사본 (2026-10-05)

- 사용자가 다음 사이클·배포를 진행하는 plan 세션에 붙여 넣습니다. 아래 회색 상자 안을 그대로 복사합니다
- 기록 원본: `docs/research/ebook-catalog/snapshot-2026-10-05.md`

```
수집 세션에서 배포용 수집 DB 사본을 만들었어(2026-10-05 07:42 시점). 배포와 다음 사이클에 반영해 줘.

- 파일: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\snapshots\ebook-catalog-2026-10-05-0745.sqlite (약 14GB, git 밖, quick_check ok). 수집기는 원본 DB에서 계속 돎
- 기록: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\research\ebook-catalog\snapshot-2026-10-05.md

사본에 든 것:
- 등록 도서관(서비스 도서관 278곳): 274곳 다 받음, 4곳은 받지 않음(국회·전북교육청·군포 YES24·김천시립). 소장 4,954,368줄, 책 코드 916,032개
- 후보 도서관(웹러브 북스 기관 2,738곳): 2,412곳 다 받음, 8곳 받는 중(받은 데까지), 217곳 아직(대부분 교보 대여·혼합), 실패 2, 받지 않음 99(등록 도서관과 같은 사이트, crawl_skip 표시). 소장 16,987,955줄, 책 코드 2,641,750개

배포에 쓰는 법:
- dev 가져오기(catalog-import)의 sqlite-path를 이 사본으로. 지금 가져오기 코드는 등록 도서관만 옮기고(사이클 04 범위), 등록 도서관은 다 받아 둠
- 후보 도서관 책까지 배포에 넣으려면 "후보 도서관도 서비스에 넣기" 사이클이 먼저야(배포 전에 하기로 정함, collection-areas.md 2-1절). 그 사이클 뒤 같은 사본으로 다시 가져오면 돼. 그때 crawl_skip이 "same site as registered library"인 99곳은 빼
- 서비스 DB 크기와 EC2 크기는 아직 안 쟀어. 가져온 뒤 dev에 표·인덱스 크기를 재 달라고 해 줘(aws-layout.md "서버 크기")

배포 일정(목표 10월 6일 새벽)에 맞춰 후보 도서관 넣기를 어디까지 할지 나한테 물어봐 줘.
```
