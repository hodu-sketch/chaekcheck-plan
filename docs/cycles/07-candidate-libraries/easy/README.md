# 사이클 07 쉬운 설명 페이지

| 파일 | 설명 | 원본 | 남은 [안] |
|---|---|---|---|
| [2026-10-05-cycle-start-decisions.html](2026-10-05-cycle-start-decisions.html) | 사이클 07 시작: 사이클 06 회고 요약, 범위(A 후보 도서관 넣기, D DB·검색 다듬기, B 수집 두 갈래, C 작은 수정), 뺄 것, 일정 | `../scope.md`, `../../06-my-libraries/retro.md` | 없음. 승인 9, 미승인 3(4·6·13), 기타 2(11·12), 2026-10-05 |
| [2026-10-05-spec-decisions.html](2026-10-05-spec-decisions.html) | 명세: 도서관 번호·이름, 로그인 전, 데이터 고치기, 북큐브·알라딘 결과 줄, 응답 목표, DB·검색, 수집 두 갈래 문서, 실패 표시 | `../spec.md` | 15개 정해짐(승인 14, 12번 미승인 → 통째로 둠). 4번 미승인 → 후속 페이지, 13번 질문 → 후속 페이지에 답 |
| [2026-10-05-spec-decisions-2.html](2026-10-05-spec-decisions-2.html) | 명세 후속: 로그인 없이 직접 넣기(다시 제안), 가져오는 동안 기다림(답) | `../spec.md` R3-6, R7-5 | 없음. 2개 승인(2026-10-05) |
| [2026-10-05-flow-decisions.html](2026-10-05-flow-decisions.html) | 화면 흐름: 로그인 전 [관리]와 내 도서관 화면, 도서관 찾기 순서·개수, 옮기기 창, 로고·후보 공공도서관 가입 조건을 이번에 넣을지. PC·태블릿·폰 그림 | `../flow.md` | 고른 것 없음. dev 화면 변경 알림(2026-10-05)으로 v2로 바꿈 |
| [flow-original.html](flow-original.html) | flow.md 원본 (그림 렌더링) | `../flow.md` | — |
| [2026-10-05-flow-decisions-v2.html](2026-10-05-flow-decisions-v2.html) | 화면 흐름 다시: dev 새 화면 기준 로그인 전 [내 도서관 관리 ▾]·폰 설정 창, 내 도서관 화면, 옮기기 창, 로고·가입 조건, dev 화면 질문 여섯 | `../flow.md` | 없음. 승인 13, 미승인 1(3번 안내 줄 없앰), 2026-10-05 |
| [2026-10-05-design-decisions.html](2026-10-05-design-decisions.html) | 설계: 짝 표·seed, 미조사 칸, 가져오기, 검색 1초, 도서관 찾기, 북큐브·알라딘 읽기, 옮기기, 새 질문 넷(AC-6 기준, 소리·영상, 교보 소장형, dev 규칙 예외) | `../architect-proposal.md` | 없음. 20개 정해짐(2026-10-05): 승인 13, 사용자 선택·제안 7(1 새 모듈, 8 나눠 읽기, 10 미리 계산, 14 한 번에 옮기는 새 요청, 15 등급에 미조사, 16 새 파일 뒤 대조, 20 기다림) |
| [2026-10-05-logo-decisions.html](2026-10-05-logo-decisions.html) | 도서관 로고(결정 번복으로 이번 사이클에 넣음): 자리, 크기, 누를 때, 못 불러올 때, 서비스 안내 화면, 연락처, 내리는 방법. PC·태블릿·폰 그림 | `../spec.md` R9, `../flow.md` | 없음. 승인 5(2번은 질문 답 뒤 "미리 줄인 파일"), 미승인 2(3 어디서든 메인 페이지, 4 빈 상자), 2026-10-05 |
| [2026-10-05-adr-drafts.html](2026-10-05-adr-drafts.html) | 결정 기록 초안 7건: ADR-0052(새 번호·짝 표·collection 모듈) ~ 0058(도서관 목록 통째로 + 압축) | `../architect-proposal.md` | 없음. 7개 승인(0053은 질문 답 뒤 조사 상태 넷으로 고쳐 승인), 2026-10-05 |
| [2026-10-05-design-delta.html](2026-10-05-design-delta.html) | 설계 한눈에(그림 5) + 세부 규칙·이름, 로고 ADR-0059 초안, dev 규칙 예외, 다음 단계로 | `../design-delta.md` | 10개 승인(2026-10-05), 1번(설계 전체)은 고르지 않았으나 11번 "이 문서대로 다음 단계" 승인으로 봄 |
| [design-delta-original.html](design-delta-original.html) | design-delta.md 원본 (그림 7 렌더링) | `../design-delta.md` | — |
| [2026-10-05-collection-module.html](2026-10-05-collection-module.html) | collection 모듈이 가져오기도 맡기(사용자 질문 "왜 카탈로그가 나와?" 뒤 다시 제안) | `../design-delta.md`, ADR-0052 | 고른 것 없음. 사용자 의견 "가져오기 … 컬렉션이 하는게 맞다" → 후속 페이지 |
| [2026-10-05-collection-module-2.html](2026-10-05-collection-module-2.html) | collection이 가져오기 전부(읽기→정리→묶기→표 채우기), catalog는 표 바꾸기 공개 기능·글자 정리 규칙·검색 | `../design-delta.md`, ADR-0031·0052 | 사용자 질문 셋 → 답(제자리). 가져오기 일은 collection [확정], 규칙 자리는 후속 페이지 3 |
| [2026-10-05-collection-module-3.html](2026-10-05-collection-module-3.html) | 제목 다듬기 규칙 자리: (가) catalog / (나) collection / (다) 공용 모듈 | 앞 페이지 | 없음. 1번 사용자 선택 (가) catalog에 두고 빌려 씀, 2번 승인(ADR-0060), 2026-10-05 |
| [2026-10-05-handoff.html](2026-10-05-handoff.html) | 인계서: dev 순서 18단계, dev가 정하고 알려 줄 것 다섯, 사용자가 할 것 일곱 | `../handoff.md` | 없음. 3개 승인(2026-10-05) |
| [2026-10-05-retro-questions.html](2026-10-05-retro-questions.html) | 사이클 07 회고 질문: 이유가 남지 않은 화면 변경 셋, AC-15·AC-6 문장, dev가 정한 셋 | dev `docs/plan-feedback.md` "# 사이클 07", `../spec.md` | 없음. 승인 4(1·3·5·6), 미승인 1(2: 정렬·완전 일치·역할은 기억 안 함), 기타 1(4: AC-15 새 문장, 사용자 제안), 2026-10-05 |
| [2026-10-05-collection-to-import.html](2026-10-05-collection-to-import.html) | 수집에서 가져오기까지: 도서관 정보와 도서관–책 정보가 어디서 모이고 어떻게 다듬어져 어디에 남는지, 시각이 남는 곳 | `docs/research/collection/1-libraries.md`, `2-books.md`, dev `docs/maintenance/3-import.md` | 없음 (설명) |
| [2026-10-05-retro-adr-drafts.html](2026-10-05-retro-adr-drafts.html) | 회고 결정 기록 초안 4건: ADR-0061(도서관 연결에 인증 기관 추가), 0062(책 번호 잇기), 0063(후보 최종 주소·같은 사이트 확인), 0064(알라딘 출판사·북큐브 더 보기·로고 자리) | `../retro.md`, dev `plan-feedback.md` | 보류 (사용자: "다음 순서는 ADR은 아니지 않나?", 사이클 08 범위를 먼저 정함, 2026-10-05) |
| [2026-10-05-dev-questions.html](2026-10-05-dev-questions.html) | dev가 정해 달라고 한 남은 것: 429·503 안내와 숫자, 도서관 411 주소, YES24 폰 13곳, 다른 이름 10곳·바뀐 이름, 알라딘 대출하기 단추, 결정 기록 시기, 책 번호 고쳐 쓰기, 가져오기 시간·메모리 | dev `plan-feedback.md` "plan에 넘길 요약", `library-site-issues.md` 9·10절 | 없음. 승인 7, 미승인 3(4 → 링크 옆 안내, 8 → 지금 기록, 10 → 바꿔 끼우기 간단 설계), 2026-10-05 |
| [2026-10-05-next-cycle-options.html](2026-10-05-next-cycle-options.html) | 사이클 08 후보 다섯: A 배포 준비, B 배포 전 다듬기, C 주기 갱신·DB 메모리, D 구독형 한도, E 알림 | `docs/backlog.md`, 06·07 retro, `docs/research/` | 없음. B·C 승인(C는 지금 가능한 것만 + 캐시·DB 메모리), A·D·E 미승인 "나중", 2026-10-05 |
| [2026-10-05-adr-0061.html](2026-10-05-adr-0061.html) | ADR-0061 초안: 도서관 사이트 연결에만 최상위 인증 기관 하나를 더 믿음 (ADR-0022 보완) | dev `plan-feedback.md` "handoff 밖 추가 작업 A" | 없음. 승인 → `docs/adr/0061-library-extra-trusted-root.md` (2026-10-05) |
| [2026-10-06-adr-drafts-0062-0064.html](2026-10-06-adr-drafts-0062-0064.html) | 결정 기록 초안 셋: ADR-0062(책 번호 잇기는 catalog 표 바꾸기 안에서), 0063(후보 최종 주소·같은 사이트 확인), 0064(알라딘 출판사·북큐브 더 보기·로고 자리) | `../retro.md`, dev `plan-feedback.md` | 없음. 3개 승인 (2026-10-05) → `docs/adr/0062`~`0064` |
