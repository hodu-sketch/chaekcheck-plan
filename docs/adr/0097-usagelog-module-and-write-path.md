# ADR-0097: 기록 전용 모듈 `usagelog`, 공개 창구 직접 호출, 5초 묶음·비동기 커밋, 클릭 알림은 fetch keepalive + CSRF

Status: Proposed
Date: 2026-10-13
Cycle: 15-usage-log
Supersedes: 없음

## 배경
ADR-0096의 기록을 남길 때 검색 응답과 DB에 부담을 주지 않아야 한다(사용자: "db가 가장 걱정되는게 db에 부담이 될까 트랜잭션 걱정이야 실제 서비스 되는거에 램에 많이 영향을 줄까?"). 결과 수는 검색을 처리하는 `catalog`·`availability`만 안다. 도서관 링크는 새 탭으로 바로 열려 서버가 클릭을 모르고, 로그인 기능이 켜지면 모든 보내기 요청에 CSRF 표시가 필요하다. 설계는 12·13·14 회고 뒤 코드에 맞춰 확정한다.

## 결정
새 모듈 `usagelog`(schema 같은 이름)를 두고, `catalog`·`availability`가 그 공개 창구를 직접 불러 기록을 넘긴다(Spring Modulith 이벤트 안 씀). `usagelog`는 메모리에 모았다가 5초마다 `JdbcTemplate.batchUpdate`로 한 트랜잭션에 넣고, 그 트랜잭션만 비동기 커밋한다(상한 1만 줄, 실패 묶음은 버리고 버린 사실을 기록). 표는 기록 종류마다 나눈다: `search_event`, `library_click`, `book_view`, `rejected_click`, `dropped_batch`, (2026-10-13 덧붙임) `search_more`, `screen_event`, `library_response` [안: 이름]. 도서관 클릭은 화면이 `fetch` keepalive로 `POST /api/v1/library-clicks`(JSON, 늘 204)에 보내며 CSRF 검사는 그대로 받는다. IP는 nginx가 넘기는 `X-Real-IP`에서 읽는다.

## 이유 (사용자 발언)
- 새 모듈: 범위 단계 승인(2026-10-12), 질문 "따로 모듈로 둬야 하나? 모듈로 두면 왔다갔다 더 부하가 심해지지 않아?"에 같은 프로그램 안 함수 호출이라 늘지 않는다고 답한 뒤 승인. 이유 자체는 [이유 미확인]
- 5초 묶음·비동기 커밋·이벤트 안 씀: DB·RAM 걱정(위 배경 인용)에 대한 제안 → 승인. 실패 묶음 기록: "실패 묶음 버리는거 이것도 기록도 해줘"
- fetch keepalive: "fetch(keepalive)로 하자" (CSRF 예외를 두는 sendBeacon 안 대신)
- 나머지(표 다섯, batchUpdate, 주소, `X-Real-IP`): 제안 → 승인, [이유 미확인]

## 검토한 대안
### A안: 공개 창구 직접 호출 (채택)
- 장점: 결과 수를 아는 곳이 넘김, 의존이 Modulith 검사에 보임, DB 쓰기 늘지 않음
- 단점: 검색 모듈 둘이 `usagelog`를 앎
### B안: `usagelog`의 HTTP 필터
- 단점: 직접 찾기 결과 수를 볼 수 없음
- 채택하지 않은 이유: [이유 미확인]
### C안: `catalog`·`availability`가 각자 표
- 단점: 모으기·지우기 세 벌, `catalog` 표는 책 목록 바꿔 끼우기 대상
- 채택하지 않은 이유: [이유 미확인]
### D안: Spring Modulith 이벤트
- 단점: 기록 한 줄에 이벤트 표 쓰기 두 번이 더해짐
- 채택하지 않은 이유: [이유 미확인] (DB 부담 걱정에 대한 제안)
### E안: sendBeacon + 클릭 알림 주소만 CSRF 예외
- 장점: 화면 코드가 짧음
- 채택하지 않은 이유: "fetch(keepalive)로 하자"
### F안: 표 하나 + JSON
- 채택하지 않은 이유: [이유 미확인]

## 결과
- 좋아지는 점: 검색은 기록을 기다리지 않음, DB에는 5초에 한 번, 보안 검사 예외 없음, 기록 규칙이 한 모듈에
- 감수하는 점: 서버가 갑자기 꺼지면 최대 5초 치가 빠짐, 처음 클릭 때 CSRF 표시를 받아 오는 요청이 하나 더, Firefox 133 미만은 keepalive 없이 보통 요청
- 나중에 분리할 때: `usagelog` 구현만 메시지 발행이나 다른 저장소로 바꾸면 부르는 쪽은 그대로
