# 쉬운 설명 페이지 (사이클 15)

| 파일 | 설명하는 것 | 원문 | 남은 결정 |
|---|---|---|---|
| [2026-10-12-scope-decisions.html](2026-10-12-scope-decisions.html) | 사이클 15 범위: 이미 정한 것, 지우는 방법, 쓰는 방식, 확인 방법, 순서, 모듈 | `../scope.md` | 결정됨: 6개 모두 승인 (2026-10-12) |
| [2026-10-12-spec-decisions.html](2026-10-12-spec-decisions.html) | 명세: 검색 기록 칸, 결과 수, 로봇·로그인, 클릭 칸·검사·제한, 모으기·지우기 숫자, 성능 기준, 하지 않는 것 | `../spec.md` | 결정됨 (2026-10-13): 승인 11, 미승인 #7(→IP와 함께 기록)·#14(→책 상세·IP 기록), #8 기타→fetch keepalive |
| [2026-10-13-spec-followup-decisions.html](2026-10-13-spec-followup-decisions.html) | 명세 이어서: 봇 제한(지금 있는 장치, 막는 방법), 로그인 여부 보내는 법, 이상한 값 기록, nginx 접속 기록 | `../spec.md` | 결정됨: #1 미승인→30일, #2 승인 (2026-10-13) |
| [2026-10-13-spec-followup2-decisions.html](2026-10-13-spec-followup2-decisions.html) | 명세 이어서 2: IP 범위·보관, 책 상세 열기 기록, 버린 묶음 기록, 기록 끄기 설정 | `../spec.md` R3-3, R5 | 결정됨: 5개 모두 승인 (2026-10-13), 16 전달 글 2차 |
| [2026-10-13-flow-decisions.html](2026-10-13-flow-decisions.html) | 화면 흐름: 화면별로 기록되는 것, 결과 카드의 알림 위치, 보이지 않는 상태 | `../flow.md` | 결정됨: 승인 (2026-10-13) |
| [2026-10-13-design-decisions.html](2026-10-13-design-decisions.html) | 설계 대안: 전체 모양, 기록 넘기기, 표 다섯, IP 칸 비우기, 넣는 방법, 클릭 주소, 이름, IP 읽는 곳 | `../architect-proposal.md` | 결정됨: 7개 모두 승인 (2026-10-13), 확정은 12·13·14 회고 뒤 |
| [2026-10-13-adr-drafts.html](2026-10-13-adr-drafts.html) | ADR-0096(무엇을·어디에·얼마나), ADR-0097(서버 안 기록 방식) 초안 | `docs/adr/0096`, `0097` | 결정됨: 둘 다 승인, Proposed로 씀 (2026-10-13) |
| [2026-10-13-check-results.html](2026-10-13-check-results.html) | 설계 전 확인 다섯 가지 결과, 로그인 상태 확인 중일 때 | `../architect-proposal.md` 확인 결과 | 결정됨: 승인 + 로그인 켬/끔 모두 동작 (2026-10-13) |
| [2026-10-13-logging-start.html](2026-10-13-logging-start.html) | 사이클 17 전달 글, 16·17 정리본 반영, 기록 시작 시점 | `../spec.md`, `../to-cycle-17.md` | 결정됨: 승인 (2026-10-13) |
| [design-delta-original.html](design-delta-original.html) | design-delta.md 초안 원문 + 그림 7개(모듈 구성도, 흐름 4개, 도메인 모델, 표 관계) | `../design-delta.md` | 초안, 회고 뒤 확정 |
| [2026-10-13-more-actions.html](2026-10-13-more-actions.html) | 더 보기 기록, 더 남길 행동 후보(사서 추천, 지역·내 도서관, 도서관 응답) | `../spec.md` | 결정됨: 4개 모두 승인 (2026-10-13) |
| [2026-10-13-more-actions-design.html](2026-10-13-more-actions-design.html) | 늘린 기록 설계: 알림 주소 하나, 로그인 뒤 저장 기록 경로, screen_event 칸, search_more 칸, 도서관 응답 범위·보관 | `../design-delta.md` | 결정됨 (2026-10-13): #1~#5 승인(#5에 대출 수 채우기 더함), #6 → 도서관마다 하루 요약 1년 |
| [2026-10-13-library-response-summary.html](2026-10-13-library-response-summary.html) | 도서관 응답 하루 요약으로 바꾼 뒤: 요청 하나하나 기록, 요약 보관 기간 | `../spec.md` R6-4 | 결정됨: 둘 다 승인 (2026-10-13) |
| [2026-10-13-summary-method.html](2026-10-13-summary-method.html) | 도서관 응답 하루 요약 만드는 법: 메모리에서 세어 더하기, 남길 숫자, 요청 세는 단위 | `../design-delta.md` | 결정됨: 셋 다 승인 (2026-10-13) |
| [2026-10-14-remaining-proposals.html](2026-10-14-remaining-proposals.html) | 남은 제안: 새 기록 보관, 값 이름, 칸 종류·색인, 받은 값 상한, loggedIn 보내는 법, 모듈 의존 제한 | `../spec.md`, `../design-delta.md` | 결정됨 (2026-10-14): 5개 승인, #5 미승인 → 서버가 쿠키로 확인 |
| [2026-10-14-login-cookie.html](2026-10-14-login-cookie.html) | 서버가 로그인 쿠키로 확인: 쿠키 경로, 만료 때, 검색 영향 | `../spec.md` R1-6 | [안] 3개 |
