# 기능 명세: 사용자 행동 기록 (검색·책 상세·더 보기·도서관 클릭·화면 행동·도서관 응답)

- 범위: [scope.md](scope.md) 포함 1~9. 저장 장소 조사 [storage.md](../../research/usage-log/storage.md)
- dev 코드 확인 2026-10-12~14 (아래 코드 경로는 dev `backend/src/main/java/com/chaekcheck/` 또는 `web/src/` 기준)
- 이 문서는 **최종 규칙**만 본문에 적고, 결정이 바뀐 흐름은 맨 끝 "바뀐 이력"에 둡니다
- 결정 페이지 줄임: [명세](easy/2026-10-12-spec-decisions.html), [이어서1](easy/2026-10-13-spec-followup-decisions.html), [이어서2](easy/2026-10-13-spec-followup2-decisions.html), [기록 시작](easy/2026-10-13-logging-start.html), [늘린 기록](easy/2026-10-13-more-actions.html), [늘린 기록 설계](easy/2026-10-13-more-actions-design.html), [응답 요약](easy/2026-10-13-library-response-summary.html), [요약 방법](easy/2026-10-13-summary-method.html), [남은 제안](easy/2026-10-14-remaining-proposals.html), [로그인 쿠키](easy/2026-10-14-login-cookie.html), [로그인 판별](easy/2026-10-14-login-status.html), [검증](easy/2026-10-14-verify-decisions.html)
- 관련 ADR: [ADR-0096](../../adr/0096-usage-log-storage-and-fields.md), [ADR-0097](../../adr/0097-usagelog-module-and-write-path.md), [ADR-0102](../../adr/0102-access-cookie-api-v1-and-login-status-reader.md)

## 사용자 이야기

- 운영자(사용자 본인)는 사람들이 어떤 책을 어떤 조건으로 찾는지 기록으로 남기고 싶다, 다음 사이클에서 통계를 내기 위해 (사용자: "나중에 통계에 쓸까 해", 2026-10-12)
- 운영자는 검색 결과에서 사람들이 어느 도서관으로 넘어가는지 남기고 싶다 [이유 미확인: "도서관 페이지를 클릭할 때 정보를 기록"까지만 말함]
- 운영자는 그 밖의 행동도 웬만하면 남기고 싶다 (사용자: "이거 했으면 좋겠어 어지간한면 기록하고 싶어", 2026-10-13)
- 검색하는 사람은 기록 때문에 검색이 느려지거나 링크가 늦게 열리지 않기를 바란다 (사용자의 4GB 메모리·DB 부담 걱정, 2026-10-12)

## 입력과 출력

모든 사용 기록(도서관 응답 요약 제외)에 공통으로 붙는 칸:

| 항목 | 내용 | 규칙 | 상태 태그 |
|---|---|---|---|
| 시각 | 서버가 요청·알림을 받은 때 | `timestamptz`, 서울 시각으로 읽음 | [확정] ([명세](easy/2026-10-12-spec-decisions.html) #1) |
| 로그인 여부 | 로그인함 / 안 함 / 로그인 기능 꺼짐 | 서버가 판별(R1-6) | [확정] ([로그인 판별](easy/2026-10-14-login-status.html) #2) |
| IP | `X-Real-IP` | 30일 뒤 칸을 비움 (R5-2) | [확정] ([이어서2](easy/2026-10-13-spec-followup2-decisions.html) #1·#2) |

### 검색 기록 (`search_event`)

| 항목 | 내용 | 규칙 | 상태 태그 |
|---|---|---|---|
| 검색 종류 | 수집 목록 검색 / 도서관에서 직접 찾기 | 두 값 | [확정] (scope 포함 2) |
| 검색어 | `title`·`author`·`publisher` 중 보낸 것 | 서버가 다듬은 뒤 값(앞뒤 공백 제거, 공백 하나로), 2~50자 (`catalog/internal/web/BookParams.java:26-28,131`, `availability/internal/SearchQuery.java:11-13`) | [확정] ([명세](easy/2026-10-12-spec-decisions.html) #1) |
| 검색 방식 | 수집 목록: `exact`, `roles`, `sort` / 직접 찾기: `filter` | 받은 값, 보내지 않았으면 기본값 | [확정] ([명세](easy/2026-10-12-spec-decisions.html) #1) |
| 범위 | `scope`, `visit` | 받은 값 | [확정] (scope 포함 2) |
| 거주·직장 지역 | `residenceRegionIds`, `workRegionIds` | 번호 목록, 각 최대 20 (`BookParams.java:32`) | [확정] (scope 포함 2) |
| 고른 도서관 | `libraryIds` | 번호 목록, 최대 20, 받은 그대로 | [확정] ([명세](easy/2026-10-12-spec-decisions.html) #1) |
| 결과 수 | 수집 목록: `totalCount` / 직접 찾기: R1-4 | 정수, 없으면 빈 값 | [확정] ([명세](easy/2026-10-12-spec-decisions.html) #1) |

### 책 상세 기록 (`book_view`) — R5-1
책 번호, 거주·직장 지역, 고른 도서관 (+ 공통 칸) [확정] ([이어서2](easy/2026-10-13-spec-followup2-decisions.html) #3)

### 더 보기 기록 (`search_more`) — R6-1
종류(직접 찾기 다음 묶음 / 도서관별 더 보기 / 수집 목록 다음 쪽), 몇 번째, 도서관(도서관별 더 보기만), 검색 기록과 같은 조건 칸 전부 (+ 공통 칸) [확정] ([늘린 기록](easy/2026-10-13-more-actions.html) #1, [늘린 기록 설계](easy/2026-10-13-more-actions-design.html) #4)

### 도서관 클릭 기록 (`library_click`) — R2

| 항목 | 내용 | 규칙 | 상태 태그 |
|---|---|---|---|
| 도서관 | 누른 도서관 번호 | 서비스 `library`에 있는 번호만 (R2-3) | [확정] (scope 포함 3) |
| 누른 곳 | 결과 카드 / 가입 링크 / 가입 안내 보기 / 도서관 첫 화면 / 로고 / 요약 막대 이름 | 여섯 값 ([storage.md](../../research/usage-log/storage.md) 1.2절) | [확정] (scope 포함 3) |
| 화면 | 직접 찾기 결과 / 수집 목록 검색 결과 / 책 페이지 / 사서 추천 창 / 내 도서관 | 다섯 값 | [확정] ([명세](easy/2026-10-12-spec-decisions.html) #6) |
| 책 | 그 줄의 책 번호 | 화면이 아는 줄에서만 (수집 목록·책 페이지·사서 추천), 나머지는 빈 값 | [확정] ([명세](easy/2026-10-12-spec-decisions.html) #6) |

### 화면 행동 기록 (`screen_event`) — R6-2·R6-3
사서 추천 목록 보기(분야), 추천 책 창 열기(분야·책), 지역 바꾸기(거주·직장 지역), 내 도서관 넣기·빼기(도서관) (+ 공통 칸, 회원 번호 없음) [확정] ([늘린 기록](easy/2026-10-13-more-actions.html) #2·#3, [늘린 기록 설계](easy/2026-10-13-more-actions-design.html) #3)

### 도서관 응답 하루 요약 (`library_response_daily`) — R6-4
날짜, 도서관, 출처(직접 찾기/대출 수 채우기), 성공·실패·시간 초과·건너뜀 수, 성공 시간 합·가장 긴 성공 시간. IP·로그인 여부 없음 [확정]. "건너뜀"이 무엇인지와 다시 보내기 셈법은 [확인 필요: 사용자에게 질문 — 건너뜀의 뜻, 조회 서버 바꿔 보내기 셈법 (design-delta 확인 필요)] ([요약 방법](easy/2026-10-13-summary-method.html) #1~#3)

### 이상한 알림 기록 (`rejected_event`) — R2-3, 버린 묶음 기록 (`dropped_batch`) — R3-3
R2-3, R3-3 참고

## 동작 규칙

### R1. 검색 기록

- R1-1 남기는 때: 수집 목록 검색(`GET /api/v1/books`)은 `page`가 1이거나 없을 때, 직접 찾기는 첫 묶음 주소(`GET /api/v1/ebook-searches/stream`)일 때 검색 기록에 한 줄 [확정] (scope 포함 2). 다음 쪽·다음 묶음·도서관별 더 보기는 검색 기록이 아니라 더 보기 기록(R6-1)에 남김
- R1-2 잘못된 요청(400·422)과 요청 수 제한(429)은 남기지 않음, 사람이 결과를 받은 검색만 셈 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #2)
- R1-3 같은 검색을 다시 하면(새로고침, 다시 누르기) 다시 한 줄. 겹침을 거르지 않음 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #2)
- R1-4 직접 찾기의 결과 수: 첫 묶음이 끝날 때 서버가 센 "찾은 책 줄 수"(`BatchDone.countedRows`, `availability/internal/web/StreamEvents.java:30-42,97-127`), 그 전에 떠나면 빈 값. 기록은 첫 묶음이 끝나거나 끊긴 때 한 번(시각은 요청을 받은 때) [확정] ([명세](easy/2026-10-12-spec-decisions.html) #3)
- R1-5 검색 로봇: User-Agent에 `bot`·`crawler`·`spider`가 든 요청은 기록하지 않음. User-Agent 자체는 남기지 않음 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #4). Google 검색 로봇은 화면의 JavaScript를 실행함 [확정] (https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics , 확인 2026-10-12), 실행 중 검색 API까지 부르는지는 [확인 필요: 운영 뒤 서버 로그]
- R1-6 로그인 여부: 서버가 로그인 쿠키(`access_token`)로 직접 확인 [확정] ([남은 제안](easy/2026-10-14-remaining-proposals.html) #5 미승인 → "서버가 로그인 쿠키로 직접 확인", [ADR-0102](../../adr/0102-access-cookie-api-v1-and-login-status-reader.md))
  - 쿠키 경로를 `/api/v1`로 넓힘 [확정] ([로그인 쿠키](easy/2026-10-14-login-cookie.html) #1)
  - 우리 서명이 맞으면 만료됐어도 "로그인함", 없거나 틀리면 "안 함". 기록에만 쓰고 권한과 무관 [확정] ([로그인 쿠키](easy/2026-10-14-login-cookie.html) #2)
  - 검색·책 상세·사용 알림은 계속 로그인 없이 되고, 쿠키 확인 실패는 오류가 아님 [확정] ([로그인 쿠키](easy/2026-10-14-login-cookie.html) #3)
  - 판별은 로그인 모듈(`auth`)이 공개한 "로그인 상태 판별" 부품 한곳에서만 함. 쿠키·서명 확인 코드는 `auth` 안에만, 기록 모듈만 이 부품을 부르고 검색 모듈은 로그인을 모름. 로그인 기능이 꺼지면 쿠키를 보지 않는 부품으로 바꿔 끼워 늘 "로그인 기능 꺼짐" [확정] ([로그인 판별](easy/2026-10-14-login-status.html) #1, 사용자: "로그인 안 쓰기 설정이 되어 있으면 체크 안 하게", "한 데 모아서 관리하거나 관리하는 부분을 정해서 했으면 해")
  - 로그인 기능 켬·끔 두 경우 모두 모든 기록이 동작해야 함 [확정] (사용자: "로그인 기능 on/off인 경우 모두 되게 개발해야 해", 2026-10-13)
  - 이미 로그인한 사람의 옛 경로(`/api/v1/me`) 쿠키는 따로 지우지 않음 [확정] (사용자: "아직 서비스 테스트라서 굳이 옛 경로 지우는 코드 안 넣어도 될 것 같아", [검증](easy/2026-10-14-verify-decisions.html) #4). 액세스 쿠키는 15분이라 곧 쓸모없어짐 (dev `application.yml:104` `access-token-ttl: 15m`, 2026-10-14 확인)
- R1-7 robots.txt: `/api/`를 크롤러에 금지 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #4, 사용자: "이번 사이클에 robots.txt와 \"이름 밝힌 로봇은 직접 찾기에서 거절\"만 더하자"). 강제력 없음, 규칙을 지키는 크롤러만 따름 (https://developers.google.com/search/docs/crawling-indexing/robots/intro , https://www.rfc-editor.org/rfc/rfc9309.html , 확인 2026-10-13). 파일 [안: 웹 `public/robots.txt`에 `User-agent: *` / `Disallow: /api/`]
- R1-8 nginx가 User-Agent에 `bot`·`crawler`·`spider`가 든 요청을 직접 찾기·대출 조회 location에서 서버에 넘기기 전에 거절 [확정] (같은 결정). 응답 코드 [안: 403] (https://nginx.org/en/docs/http/ngx_http_map_module.html , 확인 2026-10-13). 이름을 속이는 로봇까지 막는 장치(WAF, Cloudflare 요청 한도 규칙)는 사이클 17이 정함 (운영 서버는 AWS Lightsail + Cloudflare Tunnel, 17은 AWS WAF를 범위에서 뺌, [to-cycle15-2026-10-13.md](../../research/deploy/to-cycle15-2026-10-13.md))
  - 참고: 도서관 사이트마다 동시 1건·1초 간격(`host-max-concurrency: 1`, `host-min-interval: 1s`)은 나가는 IP가 하나일 때 기준. 대출 조회가 업체 프록시 여러 곳을 거치면 "나가는 IP 수만큼"(ADR-0095, 제안됨), 교보 구독형은 IP마다 동시 3건(ADR-0094, 제안됨)

### R2. 도서관 클릭 기록

- R2-1 링크는 지금처럼 새 탭으로 바로 열리고, 같은 클릭에서 화면이 `fetch(…, {keepalive: true})`로 `POST /api/v1/usage-events`에 알림을 보냄 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #8 "fetch(keepalive)로 하자", [늘린 기록 설계](easy/2026-10-13-more-actions-design.html) #1). keepalive는 화면이 닫혀도 끝까지 보내고 본문 64KiB까지, 헤더를 붙일 수 있음 (https://developer.mozilla.org/en-US/docs/Web/API/RequestInit , 확인 2026-10-13). 지원 Chrome 66, Edge 15, Safari 13, Firefox 133 [확정] (https://github.com/mdn/browser-compat-data/blob/main/api/Request.json , 확인 2026-10-13)
- R2-2 알림에 담는 것: 종류, 도서관 번호, 누른 곳, 화면, 책 번호(있을 때) [확정] ([명세](easy/2026-10-12-spec-decisions.html) #6). 화면이 지금 아는 값 (dev 2026-10-12): 결과 줄은 `row.libraryId`, 책 줄은 책 번호를 `page` 칸에 씀(`holdingPlan.ts:128-142`), 직접 찾기 줄은 우리 책 번호 없음. 로고(`components/LibraryLogo.tsx:5-13`)와 결과 줄은 도서관 번호·화면을 넘겨받아야 함
- R2-3 서버는 값이 정한 범위인지(있는 도서관, 정한 누른 곳·화면) 확인하고, 아니면 클릭 기록에 넣지 않고 **이상한 알림 기록**에 시각·IP·이유·받은 값(2KB 넘으면 잘라 냄)을 남김. 어느 경우든 204 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #7 미승인 → 사용자: "ip도 남기는 거로 바꿨으면 해"; [남은 제안](easy/2026-10-14-remaining-proposals.html) #4). 보관 30일 [확정] (사용자 제안 "30일 보관", [이어서1](easy/2026-10-13-spec-followup-decisions.html) #1). 이상한 값 기록은 모든 사용 알림(화면 행동 포함)으로 넓히고 이유에 `unknown_type`(알 수 없는 종류), `invalid_value`(정하지 않은 값)를 더함, 표 이름은 `rejected_event` [확정] (사용자 승인, 2026-10-14, [검증](easy/2026-10-14-verify-decisions.html) #2)
- R2-4 보안 검사(CSRF): 사용 알림도 다른 보내기 요청처럼 CSRF 검사를 받음, 예외 주소 없음 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #8). 화면은 이미 있는 CSRF 코드(`XSRF-TOKEN` → `X-XSRF-TOKEN`, 없으면 `/api/v1/auth/csrf-token`, `csrf_invalid` 403이면 한 번 더; dev `web/src/api/auth.ts`)를 씀. 로그인 기능이 꺼지면 서버에 검사가 없고 표시 받아 오는 주소도 없으므로(404, `CsrfTokenController.java:17-19`), 화면은 로그인 기능 상태(`/api/v1/me` 404 = 꺼짐)를 보고 켜졌을 때만 표시를 붙임 [안: 방법]
- R2-5 nginx에서 사용 알림 주소에 IP당 1분 60번, 넘치면 기록하지 않고 204 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #9). 지금 일반 `/api/`에는 제한 없음 (`deploy/nginx/chaekcheck-locations.conf:13-21`)
- R2-6 검색과 클릭을 잇는 칸(검색 번호 등)은 두지 않음 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #10). 통계에서 같은 IP의 검색 → 책 상세 → 도서관 클릭을 30일 안에서 이어 보는 것은 허용(회원·쿠키로 잇지는 않음, 30일 뒤 IP가 비면 이을 수 없음) [확정] (사용자 승인, 2026-10-14, [검증](easy/2026-10-14-verify-decisions.html) #1)
- R2-7 알림을 못 보내도(광고 차단 등) 링크는 열림, 다시 보내지 않음 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #10)

### R3. 쓰기와 보관

- R3-1 검색 응답과 떨어져서 쓰기, 서비스 메모리에 모았다가 5초마다 한 트랜잭션으로, 기록 트랜잭션만 비동기 커밋, Spring Modulith 이벤트는 쓰지 않음 [확정] (scope 포함 6, [ADR-0097](../../adr/0097-usagelog-module-and-write-path.md))
- R3-2 모아 둘 수 있는 최대 1만 줄, 넘치면 새 기록을 버림 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #11). 1만 줄 × 약 0.5KB ≈ 5MB [안]
- R3-3 DB에 넣다 실패하면 그 묶음을 버림, 검색·링크에는 영향 없음 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #11). 버린 묶음(시각·줄 수·이유: 넘침/DB 실패)은 메모리에 들고 있다가 다음 넣기가 성공할 때 함께 넣고 서버 로그에도 남김 [확정] (사용자: "실패 묶음 버리는거 이것도 기록도 해줘", [이어서2](easy/2026-10-13-spec-followup2-decisions.html) #4)
- R3-4 정상 종료 때 모아 둔 기록을 넣고 끝냄. 갑자기 꺼지면 최대 5초 치와 비동기 커밋 구간이 빠짐 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #11, [storage.md](../../research/usage-log/storage.md) 2.7)
- R3-5 매일 04:30(서울)에 서버가 자동으로: 30일 지난 IP 칸 비우기, 30일 지난 이상한 알림 지우기, 1년 지난 줄 지우기 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #12, [이어서2](easy/2026-10-13-spec-followup2-decisions.html) #2, [남은 제안](easy/2026-10-14-remaining-proposals.html) #1). "1년" = 받은 시각부터. 지금 04:00 회원 정리, 05:00 사서 추천 받기, 03:00 DB 백업(사이클 17)과 겹치지 않음
- R3-6 기록 켜기: 서버 설정 값 하나로 켜고 끔, 첫 배포 때 꺼 두고 처리방침 공개일에 켬. 시험 순서 ① dev 자동 시험(로그인 켬·끔) ② 첫 배포 뒤 지인 기간에 잠깐 켜서 실서버 확인(지인에게 미리 알림, 끝나면 그 기간 기록 지우고 끔) ③ 공개일부터 정식 [확정] ([기록 시작](easy/2026-10-13-logging-start.html) #1)
- R3-7 밤 DB 백업(매일 03:00, 사이클 17)에도 기록이 들어가 지운 IP가 백업 보관 기간만큼 더 남음 → 사이클 17에 백업 보관 기간을 묻고, 처리방침에 "백업에는 보관 기간만큼 더 남았다가 지워짐"을 적도록 16에 전함 [확정] (사용자 승인, 2026-10-14, [검증](easy/2026-10-14-verify-decisions.html) #3). 백업 보관 7일(내 PC 기준, 서버에는 2일치) [확정: 17, 2026-10-14] → 지운 정보는 백업에 7일 동안 더 남았다가 지워짐 (IP는 최대 30+7일)

### R4. 기록 보기

- R4-1 SQL 또는 Claude 명령으로 봄, 화면 없음 [확정] (scope 완료 기준)

### R5. 책 상세 열기, IP (사용자: "책 상세 열기도 기록하려고 하는데 그리고 ip도 기록하려고해", 2026-10-13)

- R5-1 책 페이지가 서버에 책 정보를 처음 요청할 때(`GET /api/v1/books/{bookId}`) 한 줄. 대출 수 채우기 요청은 책 상세 기록으로 세지 않음(도서관 응답 요약 R6-4에만 들어감), 새로고침하면 다시 한 줄 [확정] ([이어서2](easy/2026-10-13-spec-followup2-decisions.html) #3)
- R5-2 IP: 검색·책 상세·더 보기·도서관 클릭·화면 행동 기록과 이상한 알림에 남김(도서관 응답 요약에는 없음). 사용 기록의 IP 칸은 30일 뒤 비우고 나머지는 1년 [확정] ([이어서2](easy/2026-10-13-spec-followup2-decisions.html) #1·#2, [남은 제안](easy/2026-10-14-remaining-proposals.html) #1, [ADR-0096](../../adr/0096-usage-log-storage-and-fields.md))
  - 읽는 곳: nginx가 붙이는 `X-Real-IP`(`chaekcheck-locations.conf:17`, 값은 `$remote_addr`) [확정: 방향] ([설계 대안](easy/2026-10-13-design-decisions.html) #7)
  - 터널 뒤 사용자 IP: Cloudflare Tunnel에서는 원 서버가 cloudflared 주소를 보고, HTTP는 `CF-Connecting-IP`로 방문자 IP를 받음 [확정] (https://developers.cloudflare.com/cloudflare-one/networks/connectivity-options/ , https://developers.cloudflare.com/fundamentals/reference/http-headers/ , 확인 2026-10-13). nginx는 `real_ip_header CF-Connecting-IP`, `set_real_ip_from` = compose에서 정한 nginx·cloudflared 네트워크 범위(예 `172.30.0.0/24`, `127.0.0.1` 아님), nginx 포트는 바깥에 열지 않음 [안: 사이클 17 명세 R3에서 정함] ([사이클 17 scope](../17-first-deploy/scope.md), https://developers.cloudflare.com/support/troubleshooting/restoring-visitor-ips/restoring-original-visitor-ips/)
  - IP가 들어가므로 처리방침(사이클 16)에 항목·목적·보관 기간을 적음 (개인정보 보호법 제2조 제1호·제30조, [storage.md](../../research/usage-log/storage.md) 4절)

### R6. 더 남기는 행동 (사용자: "이거 했으면 좋겠어 어지간한면 기록하고 싶어", 2026-10-13)

- R6-1 더 보기 세 종류를 서버가 받는 요청에서 한 줄씩 `search_more`에 남김: 직접 찾기 다음 묶음(`…/batches/stream`, 사람이 "더 보기"를 눌러야 부름 — `DirectResults.tsx:165` → `loadNextBatch`), 도서관별 더 보기(`/api/v1/availability/libraries/{id}/ebooks`), 수집 목록 다음 쪽(`page` ≥ 2) [확정] ([늘린 기록](easy/2026-10-13-more-actions.html) #1). 대출 수 채우기는 사람이 누르지 않아 더 보기가 아님. 검색 수(R1)는 그대로 "처음 요청 한 줄"
- R6-2 사서 추천 목록 보기·추천 책 창 열기를 화면 알림으로 기록 [확정] ([늘린 기록](easy/2026-10-13-more-actions.html) #2)
- R6-3 지역 바꾸기, 내 도서관 넣기·빼기를 화면 알림으로 기록(무엇을 바꿨는지만, 회원 번호 없음). 로그인 전후 모두 같은 화면 알림, 서버 저장 코드(`mylibrary`)는 고치지 않음 [확정] ([늘린 기록](easy/2026-10-13-more-actions.html) #3, [늘린 기록 설계](easy/2026-10-13-more-actions-design.html) #2)
- R6-4 도서관 응답: 서비스가 도서관 사이트에 실제로 보낸 요청 한 번(다시 시도도 한 번씩 — 셈법 [확인 필요: 사용자에게 질문 — 건너뜀의 뜻, 조회 서버 바꿔 보내기 셈법 (design-delta 확인 필요)])마다 결과를 서비스 메모리에서 (날짜·도서관·출처)별로 세다가 5초 묶음 때 DB의 도서관마다 하루 한 줄에 더함. 출처는 직접 찾기(첫·다음 묶음·도서관별 더 보기)와 대출 수 채우기(책 페이지·수집 목록 결과·사서 추천 창). 남기는 숫자: 성공·실패·시간 초과·건너뜀 수, 성공 시간 합(ms)·가장 긴 성공 시간(ms), 평균은 볼 때 계산. 보관 1년. 요청 하나하나는 DB에 남기지 않고 서버 로그로만 봄. 수집기(책 목록 수집)는 넣지 않음 [확정] ([늘린 기록 설계](easy/2026-10-13-more-actions-design.html) #5·#6, [응답 요약](easy/2026-10-13-library-response-summary.html) #1·#2, [요약 방법](easy/2026-10-13-summary-method.html) #1~#3; 사용자: "보통은 요청마다 DB에 남기기보다 집계 숫자(횟수·실패·평균 시간)로 모아요 … 이렇게 해줘"). 서버 로그 보관 14일 [확정: 17, 2026-10-14]. 여러 대로 늘릴 때: [in-memory-state.md](../../research/scaling/in-memory-state.md)
- R6-5 사용 기록 보관은 모두 같은 규칙(IP 30일, 나머지 1년) [확정] ([남은 제안](easy/2026-10-14-remaining-proposals.html) #1)

## 상태별 동작

- 로딩: 기록은 화면에 아무것도 보이지 않음. 검색 로딩·링크 열림은 지금과 같음
- 결과 없음: 결과가 0권이어도 기록함(결과 수 0) [확정] ([명세](easy/2026-10-12-spec-decisions.html) #2). 무엇을 찾다 못 찾았는지가 통계에 쓸모 있음 [이유 미확인: 제안]
- 외부 오류·지연: 직접 찾기에서 도서관이 응답하지 않아도 첫 묶음이 끝나면 검색 기록(R1-4), 그 도서관은 응답 요약에 실패·시간 초과로 셈(R6-4). 기록 DB 쓰기 실패는 R3-3
- 입력 오류: 검색 400·422는 기록하지 않음(R1-2). 사용 알림의 잘못된 값은 이상한 알림 기록, 응답은 204(R2-3)

## 수용 기준

검색·책 상세·더 보기
- AC-1: 수집 목록에서 "채식주의자"를 검색하면 → 검색 기록이 한 줄 생기고 검색어·결과 수(`totalCount`)·지역·고른 도서관이 들어 있다 (SQL로 확인)
- AC-2: 같은 검색에서 다음 쪽(`page=2`)을 보면 → 검색 기록은 늘지 않고 더 보기 기록이 한 줄 생긴다
- AC-3: 직접 찾기로 검색하고 첫 묶음이 끝나면 → 검색 기록이 한 줄 생기고 결과 수가 들어 있다. "더 보기"(다음 묶음)·도서관별 더 보기를 누르면 검색 기록은 늘지 않고 더 보기 기록이 한 줄씩 생긴다
- AC-4: 직접 찾기 첫 묶음이 끝나기 전에 창을 닫으면 → 결과 수가 빈 검색 기록 한 줄이 생긴다. 보낼 것이 없어 보내기 실패 없이 닫힌 경우도 묶음 마감 뒤 한 줄 (테스트)
- AC-5: 검색어가 1자(400)이거나 없는 지역 번호(422)면 → 기록이 생기지 않는다
- AC-6: User-Agent에 `Googlebot`이 든 검색 요청을 보내면 → 기록이 생기지 않는다 (API 호출)
- AC-6b: User-Agent에 `bot`이 든 요청으로 직접 찾기를 부르면 → nginx가 거절하고 서버 검색 칸을 쓰지 않는다. `/robots.txt`에 `/api/` 금지가 보인다 (API 호출)
- AC-17: 책 페이지를 열면 책 상세 기록이 한 줄 생기고, 대출 수 채우기로 줄이 늘지 않는다

도서관 클릭·화면 행동
- AC-7: 결과 카드를 누르면 → 전자도서관 새 탭이 지금처럼 바로 열리고, 클릭 기록에 도서관 번호·"결과 카드"·화면이 한 줄 생긴다. 여섯 누른 곳 모두 각각 확인
- AC-8: 책 페이지의 결과 카드를 누르면 → 클릭 기록에 그 책 번호가 들어 있다. 직접 찾기 결과에서는 비어 있다
- AC-9: 로그인 기능을 켠 상태에서 사용 알림이 CSRF 표시를 붙여 기록된다(표시 없는 알림은 403: `auth`의 CSRF 보호 주소에 `/api/v1/usage-events`가 들어감). 로그인 기능을 끈 상태에서는 CSRF 검사 자체가 없어 표시 없이 기록된다 (테스트)
- AC-10: 없는 도서관 번호나 정하지 않은 "누른 곳" 값으로 알림을 보내면 → 204가 오고 클릭 기록은 생기지 않으며, 이상한 알림 기록에 IP·이유가 한 줄 생긴다 (API 호출)
- AC-11: 같은 IP에서 사용 알림을 1분에 60번보다 많이 보내면 → 넘친 것은 기록되지 않는다
- AC-23: 사서 추천 목록·추천 책 창을 열면, 지역을 바꾸거나 내 도서관에 넣고 빼면 → 화면 행동 기록이 각각 한 줄 생긴다 (회원 번호 없음, 로그인 전후 모두)

로그인 여부
- AC-20: 로그인 기능 켬·끔 두 설정 각각에서 위 기준이 통과한다. 꺼짐에서는 로그인 여부가 "로그인 기능 꺼짐"으로 남고 쿠키를 읽지 않는다 (테스트)
- AC-25: 로그인 기능 켬에서, 로그인한 사람의 검색은 "로그인함", 쿠키 없는 검색은 "안 함", 서명이 틀린 쿠키는 "안 함", 만료됐지만 서명이 맞는 쿠키는 "로그인함"으로 남는다. 어느 경우든 검색 결과는 같다 (테스트)
- AC-26: 로그인 뒤 받은 `access_token` 쿠키의 경로가 `/api/v1`이다 (응답 머리글 확인)

쓰기·보관·운영
- AC-12: 기록 칸에 회원 번호·User-Agent·쿠키 값 칸이 없다 (표 정의로 확인)
- AC-13: 받은 시각이 1년 1일 전인 기록과 364일 전인 기록을 넣고 지우기 작업을 돌리면 → 앞의 것만 지워진다 (테스트)
- AC-14: 기록 DB 쓰기를 일부러 실패시켜도 → 검색 결과와 링크는 정상이다 (테스트)
- AC-15: 서버를 정상 종료하면 → 종료 직전 검색까지 기록에 남아 있다 (테스트)
- AC-16: 같은 검색 묶음을 기록 끔·켬으로 돌려 → 검색 응답 시간 중앙값 차이 10% 안, 서비스·DB 컨테이너 메모리 차이 각각 50MB 안 [확정] ([명세](easy/2026-10-12-spec-decisions.html) #13). Prometheus·Grafana·node_exporter(사이클 17)를 켠 상태로 재고 그 메모리도 적음 [안]
- AC-18: 받은 지 31일 된 기록은 IP 칸이 비어 있고 나머지는 남아 있다. 29일 된 기록은 IP가 있다 (테스트)
- AC-19: 기록 DB 쓰기를 일부러 실패시킨 뒤 다시 성공하면 → 버린 묶음 기록(시각·줄 수·이유)이 한 줄 생기고 서버 로그에도 있다 (테스트)
- AC-21: 기록 설정 값이 꺼져 있으면 어떤 기록도 생기지 않고, 켜면 생긴다 (테스트)
- AC-24: 직접 찾기·대출 수 채우기를 한 뒤 → 도서관마다 그날 출처별 한 줄에 성공·실패·시간 초과 수와 시간 합·가장 긴 시간이 더해져 있다. 요청 하나하나는 서버 로그에 있다 (테스트)

## 비목표

- 기록을 보는 화면, 통계·그래프 — 다음 사이클 (scope 제외)
- 회원 번호·쿠키로 같은 사람을 잇기, 검색과 클릭을 잇는 칸 — R2-6 (IP로 30일 안 이어 보기는 허용)
- 화면 머문 시간, 스크롤, 그 밖의 버튼 — 이번에 남기지 않음 (scope 제외)
- 사용자가 기록을 끄는 설정 — 두지 않음 [확정] ([이어서2](easy/2026-10-13-spec-followup2-decisions.html) #5). 사이클 16 확인: 끄는 설정을 법으로 두어야 한다는 근거를 찾지 못함, 서버가 남기는 IP·이용 기록은 처리방침 작성지침(2026.4.) 항목 3 "처리하는 개인정보 항목"에 적는 대상이고 항목 14 "자동 수집 장치"는 쿠키 등, 개인정보위의 명시 해석례는 확인 못 함(추론) ([사이클 16 research.md](../16-notices-and-policies/research.md) 5절, 사용자가 전달 2026-10-13)
- 빠진 클릭 다시 보내기 — R2-7
- 사람이 누르지 않는 요청(대출 수 채우기)을 사용 기록으로 세기 — R6-1 (도서관 응답 요약에는 들어감, R6-4)

## 데이터 출처

| 데이터 | 출처 | 이용 조건·제한 | 확인일 | 상태 태그 |
|---|---|---|---|---|
| 검색 조건·결과 수 | 우리 서버가 받는 검색 요청과 응답 (dev `BookParams.java`, `SearchConditionParam.java`, `BookSearch.java:23`, `StreamEvents.java`) | 외부 없음 | 2026-10-12 | [확정] |
| 사용 알림 | 화면의 `fetch` keepalive (https://developer.mozilla.org/en-US/docs/Web/API/RequestInit) | 본문 64KiB, 헤더 가능 | 2026-10-13 | [확정] |
| 로그인 여부 | `access_token` 쿠키, `auth`의 판별 부품 ([ADR-0102](../../adr/0102-access-cookie-api-v1-and-login-status-reader.md)) | 외부 없음 | 2026-10-14 | [확정] |
| 사용자 IP | nginx `X-Real-IP` ← Cloudflare `CF-Connecting-IP` | R5-2 | 2026-10-13 | [확정] |
| 도서관 번호 확인 | 서비스 `library` 모듈 공개 API | — | 2026-10-12 | [확정] |

## 다른 사이클과 주고받은 것

- 사이클 16(처리방침)에 넘긴 수집 항목: [to-cycle-16.md](to-cycle-16.md) (맨 위 "최종 정리"가 지금 기준)
- 사이클 17(첫 배포)에 넘긴 것과 받은 답: [to-cycle-17.md](to-cycle-17.md)
- 받은 정리본: [to-cycle15-2026-10-13.md](../../research/deploy/to-cycle15-2026-10-13.md)
  - 처리방침 시행일 = 공개일(첫 배포일 아님) [확정: 16] → R3-6
  - 바깥 업체: AWS 처리 위탁(노트북으로 옮기면 뺌), Cloudflare 처리 위탁 + 국외 이전 [확정: 16]. 15의 IP도 Cloudflare를 지남
  - 처리방침은 로그인 기능과 상관없이 늘 공개 [확정: 16]
  - nginx 접속 기록은 14일, 쿼리 문자열(검색어) 빼고 경로만 [확정: 17] → 검색어는 15 검색 기록에만 남음. DB 백업 매일 03:00 [확정: 17]. 백업 보관 7일, 서비스 로그 14일, nginx는 쿠키를 건드리지 않음, 사용 알림 주소·쿠키 경로 정정은 17 spec에 반영 [확정: 17, 2026-10-14]

## 확인 필요

| 항목 | 왜 필요한가 | 확인 방법 | 막는 단계 |
|---|---|---|---|
| 거주·직장 지역 + 고른 도서관 + 검색어 조합이 특정인을 알아볼 수 있게 하는지 | 처리방침 (16) | 공식 문서 확인(개인정보위 처리방침 작성지침, 가명정보 처리 가이드라인 2024.2), 전문가 질의 | 운영 전 |
| Google 등 검색 로봇이 화면 실행 중 검색 API를 부르는지 | R1-5 | 운영 뒤 서버 로그 | 없음 |
| 광고 차단 프로그램이 사용 알림을 막는 비율 | R2-7 | 지인 기간 실서버 시험 | 없음 |
| 넣기가 정렬용 메모리를 쓰지 않는지, 색인·`id`가 넣기 비용에 주는 영향 | AC-16 | 프로토타입 (`docker stats`, `EXPLAIN ANALYZE`) | 없음 (개발 때) |
| nginx 이미지의 realip 모듈 | R5-2 | 배포 때 `nginx -V` (`--with-http_realip_module`) | 없음 (배포 때) |
| Cloudflare·프록시 업체를 지나는 IP·검색어의 처리 위탁·국외 이전 | 처리방침 | 사이클 16·17이 다룸 | 운영 전 |
| 도서관 응답 "건너뜀"의 뜻(dev에는 건너뜀 결과가 없음, 시작 마감까지 못 보낸 도서관은 요청 자체가 없음), 조회 서버 바꿔 보내기를 몇 번으로 셀지 | R6-4 | 사용자에게 질문 | 설계 확정 |
| 클릭 알림 도서관 번호 확인에 켜진 도서관만 쓸지 | R2-5 | 사용자에게 질문 | 설계 확정 |
| (해결) 사이클 12·13·14 뒤 기록을 끼울 자리 | — | dev 코드 확인 2026-10-14 → [design-delta.md](design-delta.md) "부를 자리" | — |

## 판정

- **설계 진행 가능**. 설계 확정 전에 사용자에게 물을 것 둘(위 표: 건너뜀·셈법, 켜진 도서관만). 12·13·14 코드 확인은 끝남(2026-10-14). 나머지 확인 필요는 배포 때 확인, 운영 뒤 측정

## 바뀐 이력

| 날짜 | 무엇이 | 처음 → 지금 | 근거 |
|---|---|---|---|
| 2026-10-13 | 클릭 알림 보내는 법 | `sendBeacon` + 클릭 알림 주소만 CSRF 예외 → `fetch` keepalive + CSRF 그대로 | [명세](easy/2026-10-12-spec-decisions.html) #8 |
| 2026-10-13 | 알림 주소 | `POST /api/v1/library-clicks` → `POST /api/v1/usage-events` (종류 칸) | [늘린 기록 설계](easy/2026-10-13-more-actions-design.html) #1 |
| 2026-10-13 | IP | 남기지 않음(조사 결정 #4) → 이상한 알림만 → 모든 사용 기록에 30일 | [명세](easy/2026-10-12-spec-decisions.html) #7·#14, [이어서2](easy/2026-10-13-spec-followup2-decisions.html) |
| 2026-10-13 | 이상한 클릭 알림 | 조용히 버림 → IP와 함께 30일 기록 (7일 제안은 미승인) | [명세](easy/2026-10-12-spec-decisions.html) #7, [이어서1](easy/2026-10-13-spec-followup-decisions.html) #1 |
| 2026-10-13 | 남기는 행동 | 검색·클릭 → + 책 상세 → + 더 보기·사서 추천 보기·지역/내 도서관 바꾸기·도서관 응답 | [명세](easy/2026-10-12-spec-decisions.html) #14, [늘린 기록](easy/2026-10-13-more-actions.html) |
| 2026-10-13 | 도서관 응답 | 직접 찾기 요청마다 한 줄 90일 → 도서관마다 하루 요약 1년, 대출 수 채우기 포함 | [늘린 기록 설계](easy/2026-10-13-more-actions-design.html) #5·#6, [응답 요약](easy/2026-10-13-library-response-summary.html) |
| 2026-10-13~14 | 로그인 여부 | 화면이 값 보냄(확인 중이면 "모름") → 서버가 쿠키로 확인, 함/안 함/꺼짐 | [이어서1](easy/2026-10-13-spec-followup-decisions.html) #2, [확인 결과](easy/2026-10-13-check-results.html) #1, [남은 제안](easy/2026-10-14-remaining-proposals.html) #5, [로그인 쿠키](easy/2026-10-14-login-cookie.html), [로그인 판별](easy/2026-10-14-login-status.html) |
| 2026-10-13 | 로봇 막기 | 기록만 거름 → + robots.txt, nginx 거절. WAF는 배포로 → 17이 WAF 뺌 | [명세](easy/2026-10-12-spec-decisions.html) #4, [to-cycle15](../../research/deploy/to-cycle15-2026-10-13.md) |
| 2026-10-13 | nginx 접속 기록 | 기본값(IP·검색어 든 주소), 기간 미정 → 17: 14일, 쿼리 문자열 뺌 | [이어서1](easy/2026-10-13-spec-followup-decisions.html) #2, [to-cycle-17](to-cycle-17.md) |
| 2026-10-14 | 이상한 알림 | 도서관 클릭만(`rejected_click`) → 모든 사용 알림(`rejected_event`, 이유 둘 추가) | [검증](easy/2026-10-14-verify-decisions.html) #2 |
| 2026-10-13 | `set_real_ip_from` | `127.0.0.1`(추론) → compose 네트워크 범위(17 답) | [to-cycle-17](to-cycle-17.md) |
