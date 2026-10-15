# 쉬운 설명 페이지 (사이클 21)

| 파일 | 설명하는 것 | 원문 | 남은 결정 |
|---|---|---|---|
| [2026-10-15-scope-decisions.html](2026-10-15-scope-decisions.html) | 범위 결정 8개: 구독형 세는 법, 목록 넣는 방법, 서울대 100선 같은 책 범위·화면, 표지, 책 창 한 줄, 여러 권짜리, dev 순서. 머리말 「추천도서」 메뉴 그림 | `../scope.md` | 없음. 8개 결정(2026-10-15): 7개 승인(메모 3개 반영), #8 미승인 → 이 사이클을 먼저 개발 |
| [2026-10-15-menu-decisions.html](2026-10-15-menu-decisions.html) | 머리말 메뉴를 정보나루처럼: 큰 메뉴 네 개(책 검색·추천도서·내 도서관·알림·안내), 폰은 ☰ 버튼 | `../scope.md` 결정 #9·#10 | 없음. 「머리말 메뉴 2」로 옮겨 닫음 (2026-10-15) |
| [2026-10-15-menu-decisions-2.html](2026-10-15-menu-decisions-2.html) | 큰 메뉴 둘(추천도서·내 도서관)로 줄임, 폰 메뉴 네 안(☰·탭 줄·아래 탭바·글자 하나)과 유명 사이트 여섯 곳 비교 | `../scope.md` 결정 #9·#10 | 없음. #1 승인(PC 그림자만, 폰 ☰만 어둡게, 「내 도서관」→「마이페이지」), #2 승인(A ☰) (2026-10-15) |
| [2026-10-15-collector-decisions.html](2026-10-15-collector-decisions.html) | 수집기가 이동진 추천도서 새 책 찾기: 유튜브 공식 API, 국립중앙도서관 ISBN API로 책 정보, 분야는 사람이, 유튜브 30일 규칙 | `../scope.md` 결정 #11~#14 | 없음. #1·#2·#4 승인, #3은 사용자 제안(수집기가 분야까지 자동 확정, 분야도 수집기 쪽에서 고침) (2026-10-15) |
| [2026-10-15-spec-decisions.html](2026-10-15-spec-decisions.html) | 명세 결정 13개: 메뉴 여닫기, 못 찾은 책, 주소·이용 기록, 애매한 판 고정, 이동진 범위, KDC 분야, 수집기 때, 기준 보기·출처 줄, 책 창, 상태 문구 | `../spec.md` | 없음. 13개 모두 정함 (2026-10-15): #4 "/picks 아래", #6 겹치면 최신만, #10 가져오기에 실어 보내기, #5 수집기가 판 고름 |
| [2026-10-15-flow-decisions.html](2026-10-15-flow-decisions.html) | 화면 흐름 결정 5개: 메뉴 누르면 닫힘, 지금 목록 표시, 키보드, 목록 이름 보이기, [영상 보기] 자리. 흐름 그림 | `../flow.md` | 없음. 5개 모두 정함 (2026-10-15): #2 PC 칸 정렬은 개발 때 실제 사이트 보고, #4 PC는 맨 위 제목·폰은 버튼에 함께, 네 안은 dev에 넘김 |
| [flow-original.html](flow-original.html) | flow.md 원문(그림 그려 넣음) | `../flow.md` | — |
| [2026-10-16-design-decisions.html](2026-10-16-design-decisions.html) | 설계 결정 12개: picks 한 모듈, 분야 파일, 가져오기 목차에 싣기(판 3), 10분마다 맞추기, 수집기가 DB 읽어 판 고르기, 서버가 표지, 사람 고정 판 보존, 올해의 책 영상 찾기, /api/v1/picks/{목록}, 기록 list 칸, 책 이름, 태블릿 | `../architect-proposal.md` | 12개 모두 |
| [architect-proposal-original.html](architect-proposal-original.html) | architect-proposal.md 원문(그림 7개 그려 넣음) | `../architect-proposal.md` | — |
| [2026-10-16-design-decisions-2.html](2026-10-16-design-decisions-2.html) | 사서추천도서도 수집기 → 가져오기 길로 옮길지(사용자 제안), 받는 때, 서버 받기 장치 지우기 | 사용자 제안 2026-10-16, `../architect-proposal.md` | 없음. 사용자가 거둠: "아니다 사서 추천은 따로 가자" (2026-10-16) → 사서추천도서는 지금처럼 서버가 받음 |
| [2026-10-16-design-decisions-3.html](2026-10-16-design-decisions-3.html) | 사서추천도서는 서버가 받되 PICK 표를 없애고 책 줄 표 하나로 합칠지 (사용자 질문) | 사용자 질문 2026-10-16, `../architect-proposal.md` | 1개 |
