# ADR-0073: 인기 도서는 새 모듈 popular가 받기·저장·API를 맡는다

Status: Accepted
Date: 2026-10-11
Cycle: 10-popular-books
Supersedes: 없음

## 배경
순위 받기(바깥 사이트 HTTP·HTML 해석·매달 예약), 우리 DB 저장, 화면용 API를 둘 곳이 필요했다. `collection`은 `collection-import` 프로필로 따로 켜서 도는 가져오기 프로세스이고, 가져오기를 `catalog` 밖으로 뺀 결정(ADR-0060)이 있다 (`docs/cycles/10-popular-books/architect-proposal.md` 결정 1).

## 결정
- 새 모듈 `popular`(스키마 `popular`, 표 `fetch_run`·`ranking_month`·`ranking_category`·`ranking_entry`·`cover`)가 받기·예약·저장·`GET /api/v1/popular-books`를 맡는다
- `allowedDependencies = {"catalog", "library"}`. 새 이벤트는 없다
- 예약은 자기 스케줄링으로 매일 05:00(KST)과 서버가 켜질 때 받을지 따진다

## 이유 (사용자 발언)
- [이유 미확인] — 설계 제안(새 모듈) → 승인 (2026-10-11)
- "인기 도서도 우리 쪽 db에 저장하는 걸로 해야 해 테이블 구조 고민 필요" (2026-10-11)

## 검토한 대안
### A안: 새 모듈 popular (채택)
- 장점: 바깥 사이트 받기 코드가 책 검색·가져오기와 섞이지 않음, 의존 고리 없음
- 단점: 검색 계획 파라미터를 읽는 코드가 하나 더 생김
### B안: collection 안
- 단점: 운영 예약 작업·화면 API와 따로 도는 가져오기 프로필 조건이 섞임
- 채택하지 않은 이유: [이유 미확인]
### C안: catalog 안
- 단점: ADR-0060 방향과 거꾸로, `catalog`가 바깥 사이트 받기까지 맡음
- 채택하지 않은 이유: [이유 미확인]

## 결과
- 좋아지는 점: 책임이 한 모듈에 모임, 떼어 내기 쉬움
- 감수하는 점: 모듈 하나·스키마 하나가 늘어남
- 나중에 서비스로 분리할 때: ISBN 찾기와 계획 만들기가 HTTP 호출로 바뀜
