# ADR-0097: 기록 전용 모듈 `usagelog`, 공개 창구 직접 호출, 5초 묶음·비동기 커밋, 클릭 알림은 fetch keepalive + CSRF

Status: Proposed
Date: 2026-10-13
Cycle: 15-usage-log
Supersedes: 없음

## 배경
ADR-0096의 기록을 남길 때 검색 응답과 DB에 부담을 주지 않아야 한다(사용자: "db가 가장 걱정되는게 db에 부담이 될까 트랜잭션 걱정이야 실제 서비스 되는거에 램에 많이 영향을 줄까?"). 결과 수는 검색을 처리하는 `catalog`·`availability`만 안다. 도서관 링크는 새 탭으로 바로 열려 서버가 클릭을 모르고, 로그인 기능이 켜지면 모든 보내기 요청에 CSRF 표시가 필요하다. 설계는 12·13·14 회고 뒤 코드에 맞춰 확정한다.

## 결정
새 모듈 `usagelog`(schema 같은 이름)를 두고, `catalog`·`availability`가 그 공개 창구를 직접 불러 기록을 넘긴다(Spring Modulith 이벤트 안 씀). `usagelog`는 메모리에 모았다가 5초마다 `JdbcTemplate.batchUpdate`로 한 트랜잭션에 넣고, 그 트랜잭션만 비동기 커밋한다(상한 1만 줄, 실패 묶음은 버리고 버린 사실을 기록). 표는 기록 종류마다 나눈다: `search_event`, `library_click`, `book_view`, `rejected_event`(2026-10-14 `rejected_click`에서 바꿈, 모든 사용 알림의 이상한 값), `dropped_batch`, (2026-10-13 덧붙임) `search_more`, `screen_event`, `library_response_daily`(도서관마다 하루 한 줄 요약, 사용자: "보통은 요청마다 DB에 남기기보다 집계 숫자(횟수·실패·평균 시간)로 모아요 … 이렇게 해줘") (표 여덟). 도서관 클릭은 화면이 `fetch` keepalive로 보내며 (2026-10-13 덧붙임: 클릭·사서 추천 보기·지역/내 도서관 바꾸기를 한 주소 `POST /api/v1/usage-events`로, JSON, 늘 204) CSRF 검사는 그대로 받는다. IP는 nginx가 넘기는 `X-Real-IP`에서 읽는다. (2026-10-14 덧붙임) 로그인 상태는 `auth`의 판별 부품으로 정하므로 `usagelog`의 허용 의존은 `library`·`auth`다([ADR-0102](0102-access-cookie-api-v1-and-login-status-reader.md)). 로그인 기능이 꺼져 있으면(`/api/v1/me` 404) 화면은 CSRF 표시 없이 보낸다.

(2026-10-14 덧붙임, 설계 검토: 운영 장치도 이 결정에 함께 둔다) 기록은 설정 `chaekcheck.usagelog.enabled`로 켜고 끄며 첫 배포 때 꺼 두고 처리방침 공개일에 켠다. 꺼져 있으면 `usagelog`의 기록 창구가 곧바로 돌아가 아무것도 남기지 않는다. 매일 04:30(서울)에 IP 비우기·지우기를 한다. 이름을 밝힌 검색 로봇(User-Agent에 bot·crawler·spider)은 nginx가 직접 찾기·대출 조회에서 거절하고 `robots.txt`로 `/api/`를 막는다.

## 이유 (사용자 발언)
- 새 모듈: 범위 단계 승인(2026-10-12), 질문 "따로 모듈로 둬야 하나? 모듈로 두면 왔다갔다 더 부하가 심해지지 않아?"에 같은 프로그램 안 함수 호출이라 늘지 않는다고 답한 뒤 승인. 이유 자체는 [이유 미확인]
- 5초 묶음·비동기 커밋·이벤트 안 씀: DB·RAM 걱정(위 배경 인용)에 대한 제안 → 승인. 실패 묶음 기록: "실패 묶음 버리는거 이것도 기록도 해줘"
- 기록 켜기 시점: "공개일에 켬" 제안 → 승인(2026-10-13). 04:30·로봇 거절·robots.txt: 제안 → 승인 [이유 미확인]
- fetch keepalive: "fetch(keepalive)로 하자" (CSRF 예외를 두는 sendBeacon 안 대신)
- 나머지(표 나누기, batchUpdate, 주소, `X-Real-IP`, 표 이름): 제안 → 승인, [이유 미확인]

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
- 감수하는 점: 서버가 갑자기 꺼지면 최대 5초 치가 빠짐, 처음 클릭 때 CSRF 표시를 받아 오는 요청이 하나 더, Firefox 133 미만은 keepalive 없이 보통 요청 [확인 필요: MDN 호환 표로 버전 재확인]
- 나중에 분리할 때: `usagelog` 구현만 메시지 발행이나 다른 저장소로 바꾸면 부르는 쪽은 그대로

## 결정 페이지
- [설계 대안](../cycles/15-usage-log/easy/2026-10-13-design-decisions.html), [늘린 기록 설계](../cycles/15-usage-log/easy/2026-10-13-more-actions-design.html), [요약 방법](../cycles/15-usage-log/easy/2026-10-13-summary-method.html), [남은 제안](../cycles/15-usage-log/easy/2026-10-14-remaining-proposals.html), [ADR 초안](../cycles/15-usage-log/easy/2026-10-13-adr-drafts.html), [검증](../cycles/15-usage-log/easy/2026-10-14-verify-decisions.html)
