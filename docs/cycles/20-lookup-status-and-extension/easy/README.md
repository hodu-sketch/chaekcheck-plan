# 쉬운 설명 페이지 (사이클 20)

| 파일 | 설명하는 것 | 원문 | 남은 결정 |
|---|---|---|---|
| [2026-10-15-scope-decisions.html](2026-10-15-scope-decisions.html) | 범위 결정 7개: 사이클 나누기(20 신호 / 21 확장), 신호 기준 두 단계, 10초마다 상태 묻기, 머리말 점+글 자리, 확장은 받아오기만, 모든 사이트 권한, 확장도 1건·1초 | `../scope.md` | 모두 정함 (2026-10-15; #3·#6 질문 답 포함, #8 도서관별 몰림 추가) |
| [2026-10-15-scope-decisions-artifact.html](2026-10-15-scope-decisions-artifact.html) | 위 페이지의 원격용 사본 (claude.ai Artifact https://claude.ai/artifact/EHAwjsJpERieZvtP9z4rAw, 저장 → db `choices`) | 위와 같음 | #1·2는 원격에서, 나머지는 캔버스에서 정함 (2026-10-15) |
| [2026-10-15-offload-options.html](2026-10-15-offload-options.html) | 조회 부담을 사용자 쪽으로 옮기는 방법 7가지 비교(확장·사용자 스크립트·로컬 도우미·직접 fetch 불가·도서관으로 바로 보내기·조회 서버 늘리기·캐시)와 정할 것 5개: 확장 먼저(크롬·엣지), 스크립트 backlog, 도우미 backlog, 빨강일 때 도서관 링크 앞세우기, 시험 둘 | `../research.md` | 모두 정함 (2026-10-15) |
| [2026-10-15-offload-options-artifact.html](2026-10-15-offload-options-artifact.html) | 위 페이지의 원격용 사본 (claude.ai Artifact https://claude.ai/artifact/8ZTCT3Xefgccw6vkLfMgas, 저장 → db `choices`) | 위와 같음 | 모두 정함 (2026-10-15) |
| [2026-10-15-spec-decisions.html](2026-10-15-spec-decisions.html) | 명세 결정 14개: 화면 글 4(신호 글, 도서관 줄 글, 빨강 안내 줄, 확장 모드 글), 신호 규칙 4(줄이 선 기준, 캐시 1초, 못 받을 때, 첫 응답 전), 확장 규칙 6(꺼질 때, 시간 제한·실패, 계획 번호, 빨강 안내 숨김, 사용 기록, 오류 코드) | `../spec.md` | 모두 정함 (2026-10-15; #12 사용자 제안 파란 불, #4·#5 질문 답 포함) |
| [2026-10-15-blocked-ip-resume-decisions.html](2026-10-15-blocked-ip-resume-decisions.html) | 질문 "막힌 조회 IP는 언제 풀리나"에 답: 지금 규칙 없음. 정할 것 3개: 10분 뒤 시험·두 배·상한 24시간, 로그+Grafana, 사이클 17 인계에 넣기 | `../research.md` 9절, ADR-0094·0095 | 모두 정함 (2026-10-15; 관리 화면은 backlog) → 17 공유 파일 |
| [2026-10-15-flow-decisions.html](2026-10-15-flow-decisions.html) | 화면 흐름 결정 8개: 폰 말풍선, 움직임 없음, 폰 배지 자리, 검색 밖 화면은 신호만, S3 같은 규칙, 400 일반 오류, (다시 제안) 빨강일 때 카드 「도서관에서 보기 →」 글, 이 흐름대로 설계로 | `../flow.md`, `../spec.md` R12·R14 | 모두 정함 (2026-10-15; 안내 줄 삭제, 머리말 모든 화면 같게, #7 확인 못 한 줄 묶음으로 다시 제안 → 승인) |
| [flow-original.html](flow-original.html) | flow.md 원문 + Mermaid 그림 2장(신호 흐름, 확장 모드 순서도) 렌더링 | `../flow.md` | — |
| [2026-10-15-design-decisions.html](2026-10-15-design-decisions.html) | 설계 결정 12개: 상태 주소, HostQueueBoard, 화면이 올림, JSON 계획 입구 셋, accept 입구, 캐시 빈 칸만, 더 보기도 확장, 동시 5·머리 10초, usagelog 제약, UNKNOWN 줄 포함, extension/ 빌드 없음, nginx 4m·20r/s | `../architect-proposal.md` | 모두 정함 (2026-10-16; 질문 답 6개·보안 장치·#13 확장 해석 비교 추가) |
| [architect-proposal-original.html](architect-proposal-original.html) | architect 제안 원문 + Mermaid 그림 4장 렌더링 | `../architect-proposal.md` | — |
| [2026-10-16-adr-drafts.html](2026-10-16-adr-drafts.html) | ADR 초안 4개: 0118 상태 신호 10초 묻기·메모리 셈, 0119 확장은 사용자 쪽 조회 서버(화면이 올림·서버 해석·검사·보안), 0120 extension/ 빌드 없음·크롬만·개발자 모드, 0121 머리말 모든 화면 같게 | `../architect-proposal.md`, `../spec.md` | 모두 승인 (2026-10-16) → `docs/adr/0118~0121` Proposed |
| [2026-10-16-design-delta-decisions.html](2026-10-16-design-delta-decisions.html) | design-delta 초안의 남은 값 7개(계획 저장 상한, 올리기 구역 20r/s, IP별 한도·검사 실패 거절, 캐시 비우기는 재시작, 캐시 답 셈, 메시지·설정 이름, 못 여는 도서관은 서버 모드) + 이 문서대로 마무리 | `../design-delta.md` | 8개 기다림 |
| [design-delta-original.html](design-delta-original.html) | design-delta.md 원문 + 그림 5장(모듈 구성, 상태 묻기, 확장 모드 검색, 개념 모델, 표) 렌더링 | `../design-delta.md` | — |
