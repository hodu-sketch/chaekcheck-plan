# ADR-0047: 정기 유지보수 절차는 dev `docs/maintenance/` 한 곳에, 수집기도 dev로

Status: Accepted
Date: 2026-10-04
Cycle: 사이클 밖 (2026-10-04, 사이클 05 개발 중)
Supersedes: 없음

## 배경
주기적으로 하는 작업은 ① 서비스 전자도서관 목록 확인, ② 도서관마다 책 목록 수집, ③ 수집 목록을 서비스 DB로 가져오기, 세 가지다. 세 작업 모두 dev 코드를 실행하지만 절차는 세 곳에 흩어져 있었다. ①은 dev `docs/library-maintenance.md`, ②는 plan `docs/research/ebook-catalog/crawl-runbook.md`, ③은 dev의 회고용 문서 `docs/plan-feedback.md`에만 있었다. ②의 수집기 코드는 어느 저장소에도 없는 `chaekcheck-data/scripts`에 있었다. 2026-10-01에 "절차의 원본은 dev, 조사 기록은 plan"으로 정했으나 ②·③이 벗어나 있었고, 그래서 plan 문서의 상태가 dev 코드와 어긋났다(`flows.md` 흐름 6·7이 구현 뒤에도 "미구현", 첫 실제 가져오기 뒤에도 "미실행").

## 결정
정기 유지보수 절차는 dev `docs/maintenance/` 한 곳에 둔다: `README.md`(순서·주기·체크리스트), `1-libraries.md`(도서관 목록 확인), `2-crawl.md`(책 목록 수집), `3-import.md`(서비스 DB로 가져오기). 수집기 코드는 dev `scripts/crawl/`로 옮긴다. 수집 DB, 로그, 인증키는 git 밖 `chaekcheck-data`에 둔다.

plan 문서는 이렇게 나눈다:
- dev로 옮김: `crawl-runbook.md`의 실행 부분(이어 받기, 명령, 병렬 정도·IP 줄 설정법, 받지 않는 도서관 표시법, 문제별 대처, 새 사이트 붙이는 순서), `platforms.md`(플랫폼 타입별 목록 주소·쪽 크기·읽는 위치), `docs/research/maintenance/periodic-tasks.md`의 내용
- plan에 남김: `crawl-runbook.md`의 진행 상태와 결정 기록, `crawl-method.md`(원칙), `research.md`(조사·법적 검토), `catalog-refresh.md`·`same-book-isbn.md`·`search-and-normalization.md`(정할 것과 규칙의 근거), 쉬운 설명 페이지. 옮긴 문서 자리에는 dev 위치 안내만 남기고 두 쪽이 서로 링크한다

옮기는 일은 plan이 dev에 쓸 수 없으므로 요청서(`docs/research/maintenance/dev-move-request.md`)를 사용자가 dev 세션에 전달한다. 수집기는 진행 중인 수집이 끝난 뒤 옮긴다.

## 이유 (사용자 발언)
- "근데 지금 주기적으로 필요한 작업들이 dev랑 plan에 흩어진 게 좀 그런데..."
- 형태와 문서 나누기는 Claude 제안 → 승인: "이렇게 하도록 해줘", "그렇게 해줘"
- 요청 전달 방법: "ADR 추가 + 요청서를 내가 dev에 전달" (사용자 선택)

## 검토한 대안
### A안: dev에 운영 안내서 + 수집기도 dev로 (채택)
- 장점: 절차와 실행 코드가 한곳에 있어 코드가 바뀔 때 절차도 같이 고쳐짐. 2026-10-01 원칙과 맞음. 수집기 수정이 커밋으로 남음
- 단점: 한 번 옮기는 작업이 필요함. plan은 dev에 쓸 수 없어 요청서로 넘김
### B안: plan에 운영 안내서
- 장점: plan 세션에서 바로 고칠 수 있음
- 단점: plan은 dev 코드 변화를 바로 알지 못함. 2026-10-01 원칙을 뒤집어야 함
- 채택하지 않은 이유: [이유 미확인]
### C안: 지금처럼 흩어 두고 색인(`docs/reference-index.md`)으로 연결
- 장점: 할 일 없음
- 단점: 상태 표시가 계속 어긋남. 매번 색인부터 찾아야 함
- 채택하지 않은 이유: [이유 미확인]

## 결과
- 좋아지는 점: 운영할 때 dev `docs/maintenance/README.md` 한 장에서 시작함. 수집기 수정이 커밋으로 남음
- 감수하는 점: Python 수집기가 Java 저장소에 들어가 실행 환경(`bs4`, `lxml`)을 따로 적어야 함. 옮기는 동안 절차가 잠시 두 벌 있음
- 나중에 수집을 서비스 안 예약 작업으로 옮기면(`docs/research/ebook-catalog/catalog-refresh.md` 5절) `2-crawl.md`와 `scripts/crawl/`만 바뀜
