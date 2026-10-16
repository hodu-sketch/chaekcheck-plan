# ADR-0128: 이동진 추천도서는 수집기가 YouTube Data API(공식)와 국립중앙도서관 ISBN 서지 API로 모아 목록 파일(dev `scripts/crawl/lists/` TSV)에 적음

Status: Accepted (사용자 승인, 2026-10-16, 설계 정리 페이지)
Date: 2026-10-16
Cycle: 21-recommended-books
Supersedes: 없음

## 배경
이동진 추천도서는 공식 목록 API가 없다. 사용자는 수집 서비스가 이것도 같이 하기를 원했다(범위 결정 #2 메모). 유튜브 약관은 자동화된 수단으로 서비스에 접근하는 것을 막고(발효 2022-01-05, https://www.youtube.com/t/terms), API 정보는 30일까지만 저장할 수 있다(YouTube API 개발자 정책 III.E.4.d).

## 결정
- 수집기가 한 달에 한 번(사람이 수집을 돌릴 때 함께) YouTube Data API로 재생목록 「이달의 책」과 채널 업로드 재생목록의 12월 올해의 책 영상을 읽는다. 키는 dev `.env`. 페이지는 프로그램으로 읽지 않는다
- 제목·설명란의 괄호 안 책 이름 → 국립중앙도서관 ISBN 서지 API로 ISBN·저자·출판사·KDC·표지. 못 찾거나 여럿이면 "확인 필요". KDC로 분야를 자동으로 넣고 확정(대응표 `kdc_fields.tsv`, 분야 목록 `fields.tsv`)
- 목록 파일에는 영상 ID와 추천 연·월만, 영상 제목·설명은 저장하지 않음. 같은 분야 안 겹치면 최신만 남김

## 이유 (사용자 발언)
- "수집 서비스가 이것도 같이 하도록 했으면 좋겠어" (2026-10-15, 범위 결정 #2 메모)
- "다른 선택: 수집기가 분야까지 자동으로 넣고 바로 확정 … 이렇게 해줘 분야도 맘대로 첨삭하고" (2026-10-15)
- "책이 같은 카테고리 내에서 중복이 되면 최신 것을 살리고 나머지를 지워" (2026-10-15)
- 수집기 결정 #1·#2·#4, 설계 결정 #2·#8 제안 → 승인 (2026-10-15~16)

## 검토한 대안
### A안: YouTube Data API (채택)
- 장점: 약관에 맞음, 할당량 넉넉(재생목록 읽기 1단위). 단점: API 키가 필요
### B안: 사람이 매달 손으로
- 채택하지 않은 이유: 사용자 "수집 서비스가 이것도 같이 하도록" (2026-10-15)
### C안: 페이지를 프로그램으로 읽기
- 채택하지 않은 이유: 유튜브 약관(자동화된 수단 금지)

## 결과
- 바뀜 (사용자 승인, 2026-10-16, API 시험 뒤 결정 #1·#2): ISBN 서지 API가 이동진 책에 KDC를 주지 않아(43/43 빔, dev 0단계) "KDC로 분야를 자동으로 넣고 확정"은 "수집기가 주제 한 자리로 제안, 사람이 정함"으로 바뀜. 지금 44권은 조사 때 분야 그대로. 표지는 수집 DB 전자책 표지로(결정 #3)
- 근거: https://developers.google.com/youtube/v3/determine_quota_cost , https://developers.google.com/youtube/terms/developer-policies , https://www.nl.go.kr/NL/contents/N31101030500.do (2026-10-15 확인)
- 근거 문서: `docs/cycles/21-recommended-books/architect-proposal.md`, `design-delta.md`
