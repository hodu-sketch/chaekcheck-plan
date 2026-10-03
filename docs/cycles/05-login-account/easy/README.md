# 쉬운 설명 모음

사용자가 `/anthropic-skills:easy`로 만들게 한 설명 페이지(HTML)를 모은 폴더입니다. 정리 2026-10-03.

- **쉬운 설명은 사이클별로 둡니다** (사용자, 2026-10-03: "docs도 cycle별로 나눠났으면 해 지금은 cycle05 디렉터리에좀"). 이 폴더는 사이클 05(`docs/cycles/05-login-account/easy/`)이고, 사이클 04 뒤 정리와 사이클 05 준비·진행 중에 만든 페이지가 들어 있습니다. 다음 사이클부터는 그 사이클 폴더의 `easy/`에 넣습니다.

- 이 페이지들은 **요약**입니다. 근거와 최신 값은 각 페이지 맨 아래에 적힌 원본 문서에 있습니다.
- 만든 뒤에 결정이 바뀐 곳은 아래 "지금과 다른 점"에 적었습니다. 페이지 자체는 만든 때 그대로입니다.
- 파일 이름 앞의 날짜는 만든 날입니다. 브라우저로 열어 봅니다.

## 지금 상황과 문서

| 파일 | 무엇 | 원본 | 지금과 다른 점 |
|---|---|---|---|
| [2026-09-30-next-steps.html](2026-09-30-next-steps.html) | 다음에 뭐 하지: 사이클 04 마무리 → 회고 → 05 고르기 → 나중. 가까운 것일수록 자세히 | dev `docs/plan-feedback.md`, `docs/current/handoff.md`, `docs/backlog.md` | 순서가 바뀜. 사이클 04 마무리(전체 수집·측정)는 미루고 회원(사이클 05)을 먼저 시작함. 회고는 2026-10-01에 끝남(`docs/cycles/04-and-search/retro.md`) |
| [2026-10-01-01-status.html](2026-10-01-01-status.html) | 지금 상황과 다음 순서, 사이클 04에서 된 것·미룬 것, 그날 한 일 | `docs/backlog.md`, `docs/reference-index.md` | 그 뒤 사이클 05가 시작됨. "아직 정하지 않은 것" 중 만 14세 정책은 확인란으로 정함 |
| [2026-10-01-02-doc-map.html](2026-10-01-02-doc-map.html) | 문서 지도: 다섯 묶음과 서로 가리키는 화살표 A~F, "어디에 적혀 있나" 표, 문서 고칠 때 규칙 | `docs/reference-index.md`, `CLAUDE.md` | 그 뒤 ADR-0036·0037, `docs/cycles/05-login-account/`(이 `easy/` 폴더 포함)가 생김. 책 수집 문서의 입구는 `crawl-runbook.md` |

## 도서관과 책

| 파일 | 무엇 | 원본 | 지금과 다른 점 |
|---|---|---|---|
| [2026-10-01-03-library-docs.html](2026-10-01-03-library-docs.html) | 도서관 목록을 어디서 모으나, 화면 종류 7가지, 가입 자격 판정, 검색 순서, 재조사 때 확인할 것 | dev `docs/library-maintenance.md`, `docs/library-site-issues.md`, `docs/reference-index.md` 1·2·6절 | 없음 |
| [2026-10-01-04-book-docs.html](2026-10-01-04-book-docs.html) | 책 수집 → 정리 → 같은 책 묶기 ①~④, 책 번호 체계, ADR-0035 풀이, 다시 가져올 때 확인할 것 | `docs/research/ebook-catalog/same-book-isbn.md` 5절, `search-and-normalization.md` 4절, `docs/adr/0035-*.md` | 수집 쪽 수치(오디오북 줄 수 등)는 다른 세션이 `crawl-runbook.md`에서 갱신함. 2026-10-03에 카드 6에 "전체 제목에는 부제도 들어간다"와 예시 표를 더함 |

## 회원과 로그인

| 파일 | 무엇 | 원본 | 지금과 다른 점 |
|---|---|---|---|
| [2026-10-01-05-member-alerts.html](2026-10-01-05-member-alerts.html) | 왜 회원인가, 저장하는 것, "내 도서관" 정의, 필터 스위치 하나 추천, 알림 세 조각 | `docs/research/member-and-alerts/outline.md` | 2026-10-03에 카카오 이메일 설명을 고침. 모듈이 `member` 하나가 아니라 `auth` + `member` 둘로 정해짐(ADR-0036). 사이클은 로그인·계정(05) → 내 도서관(06) → 알림(07) |
| [2026-10-01-06-signup-security.html](2026-10-01-06-signup-security.html) | 회원가입 보안·개인정보: 로그인 연결, 세션 쿠키, 동의·처리방침, 탈퇴, 검수, 서버 관리 | `docs/research/member-and-alerts/signup-security.md` | 탈퇴는 "한 번 더 본인 확인" 뒤 진행으로 정함. 네이버 쪽 연결끊기 알림도 받기로 함. 세션은 DB, 로그인 유지 30일 (`docs/cycles/05-login-account/spec.md`). 2026-10-03에 카카오 이메일 설명을 고침(개인도 "개인 개발자 비즈 앱" 전환 가능) |
| [2026-10-01-07-member-integration-plan.html](2026-10-01-07-member-integration-plan.html) | 회원을 넣는 구조: `auth` + `member` 구성도, 결정 세 가지, 사이클마다 들어가는 것 | `docs/research/member-and-alerts/integration-plan.md`, ADR-0036, ADR-0037 | 페이지의 "05a / 05b / 06"은 사이클 05 / 06 / 07 |
| [2026-10-01-08-cycle05-research-and-flow.html](2026-10-01-08-cycle05-research-and-flow.html) | 사이클 05 조사 다섯 가지 결과와 화면 흐름 그림(S1·S4·S5~S9) | `docs/cycles/05-login-account/research.md`, `spec.md`, `flow.md` | 카드 3의 "이 PC 브라우저에서 안을 골라 주세요"는 원격이라 대화에서 받는 것으로 바뀜. [안] 결정은 아직 대기 중 |

## 읽는 순서 제안

1. 전체를 처음 볼 때: `01-status` → `02-doc-map`
2. 수집·분류를 다시 할 때: `03-library-docs` → `04-book-docs`
3. 회원 사이클을 볼 때: `05-member-alerts` → `07-member-integration-plan` → `06-signup-security` → `08-cycle05-research-and-flow`

## 새 페이지를 더할 때

- 그때의 사이클 폴더 `docs/cycles/NN-<slug>/easy/`에 `YYYY-MM-DD-<주제>.html`로 넣고 그 폴더 `README.md` 표에 한 줄을 더합니다.
- 나중에 결정이 바뀌면 페이지는 그대로 두고 "지금과 다른 점" 칸만 고칩니다.
