# ADR-0126: 추천 목록 API는 `GET /api/v1/picks/{listKey}`(옛 `GET /api/v1/picks`는 지움), 이용 기록에 목록 이름 `list`

Status: Proposed
Date: 2026-10-16
Cycle: 21-recommended-books
Supersedes: 없음

## 배경
목록이 셋이 되고 웹 주소를 `/picks/leedongjin`·`/picks/librarian`·`/picks/snu100`으로 정했다(명세 결정 #4 "/picks 아래"). 이용 기록(사이클 15)도 어느 목록인지 남기기로 했다(명세 R2-6).

## 결정
- `GET /api/v1/picks/{listKey}` (`librarian`·`leedongjin`·`snu100`, 모르면 404 `list_not_found`). 계획 파라미터·검증은 지금과 같음. 응답에 `list`, 책마다 `id`·`recommendedMonth`·`yearBook`·`videoId`·`tocNo`. `GET /api/v1/picks`는 지움(배포 전). 표지 `GET /api/v1/picks/covers/{coverId}` 그대로
- 사용 알림 `picks_list_view`·`picks_book_view`에 `list` 필수, 표 `usagelog.screen_event`에 칸 `picks_list`(있던 줄은 `librarian`)

## 이유 (사용자 발언)
- "이렇게 하시려면 4번에 승인하시며 메모로 "/picks 아래"라고 적어 주세요. 이걸로해줘" (2026-10-15, 명세 결정 #4)
- 설계 결정 #9·#10 제안 → 승인 (2026-10-16)

## 검토한 대안
### A안: 목록마다 경로 (채택)
- 장점: 웹 주소와 같은 모양, 모르는 이름은 404. 단점: 옛 경로를 지움
### B안: `GET /api/v1/picks?list=`
- 채택하지 않은 이유: [이유 미확인] (추천하지 않은 안)
### C안: 기록의 분야 칸에 "leedongjin:essay"처럼 이어 쓰기
- 채택하지 않은 이유: [이유 미확인] (추천하지 않은 안)

## 결과
- 웹 예전 주소 `/picks`는 `/picks/librarian`으로 넘겨 줌
- 근거 문서: `docs/cycles/21-recommended-books/architect-proposal.md`, `design-delta.md`
