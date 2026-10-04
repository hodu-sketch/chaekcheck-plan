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
| [2026-10-03-login-state-methods.html](2026-10-03-login-state-methods.html) | 로그인 상태를 유지하는 방법: 세션과 JWT의 원리, 방식 넷, 장단점, chaekcheck에 적용하면 | `docs/cycles/05-login-account/research.md` 8절 | 2026-10-03에 JWT(짧은 액세스 토큰 + DB 리프레시 토큰)로 결정. 페이지의 추천(세션으로 시작)과 다르게 정해짐. 명세 R4 참고 |
| [2026-10-03-security-who-does-what.html](2026-10-03-security-who-does-what.html) | OAuth와 Spring Security가 각각 맡는 일, CSRF·XSS의 원리와 누가 막는지, chaekcheck에서 직접 해야 하는 것 | `docs/cycles/05-login-account/research.md` 9절 | 없음 |
| [2026-10-03-four-attacks.html](2026-10-03-four-attacks.html) | 공격 네 가지(로그인 가로채기, 세션 고정·탈취, 클릭재킹, 남의 자료 접근)가 어떻게 일어나고 누가 어떤 원리로 막는지 | `docs/cycles/05-login-account/research.md` 9·11절 | 없음 |
| [2026-10-03-cookie-or-header.html](2026-10-03-cookie-or-header.html) | 로그인 정보를 쿠키에 둘 때와 헤더로 보낼 때: CSRF와 XSS가 어떻게 달라지나, chaekcheck의 선택 | `docs/cycles/05-login-account/research.md` 11절 | 없음 |
| [2026-10-03-spec-decisions.html](2026-10-03-spec-decisions.html) | 명세에서 사용자가 정할 제안 18가지를 쉬운 말과 그림으로 (승인/미승인/기타를 고르는 용도). 캔버스용 사본은 `.review/spec-decisions.review.html` | `docs/cycles/05-login-account/spec.md` | 없음 (18가지 모두 정해짐, 2026-10-04) |
| [2026-10-04-spec-questions.html](2026-10-04-spec-questions.html) | 명세 제안 18가지 중 질문을 받은 6가지(실패 문구, 로그인 기간, SameSite=Lax, 토큰 끊는 방법, 로그아웃 범위, 탈퇴 본인 확인)의 조사 결과와 다시 낸 제안 | `docs/cycles/05-login-account/research.md` 12절 | 없음 |
| [2026-10-04-spec-questions-2.html](2026-10-04-spec-questions-2.html) | 두 번째 질문의 답: 리프레시 토큰을 DB에 두는 것과 세션의 차이, 네이버·카카오 자체 로그인은 별개, 탈퇴를 제공자별로 다르게 할 때 | `docs/cycles/05-login-account/research.md` 12절 | 없음 (11번은 대화에서 "나"로 확정) |
| [2026-10-04-flow-decisions.html](2026-10-04-flow-decisions.html) | 화면 흐름에서 사용자가 정할 제안 14가지를 밑그림과 함께 (로그인 버튼 자리, 로그인 선택 창, 가입 동의, 설정·탈퇴, 약관) | `docs/cycles/05-login-account/flow.md` | 없음 |
| [2026-10-04-flow-questions.html](2026-10-04-flow-questions.html) | 화면 흐름에서 질문·의견을 받은 5가지(안내 문구, /signup, 설정 창 계정 절, 탈퇴 실패 문구 일곱, 약관 주소)의 답과 다시 낸 제안 | `docs/cycles/05-login-account/flow.md` | 없음 |
| [2026-10-04-flow-questions-2.html](2026-10-04-flow-questions-2.html) | 설정 창에는 탈퇴만(사용자 제안으로 확정), 약관 주소가 둘인 이유 | `docs/cycles/05-login-account/flow.md` | 없음 (화면 흐름 모두 정해짐) |
| [2026-10-04-design-decisions.html](2026-10-04-design-decisions.html) | 설계에서 사용자가 정할 12가지를 그림(모듈, 표, 순서도 셋)과 함께 | `docs/cycles/05-login-account/architect-proposal.md` | 없음 (후속 페이지 셋에서 모두 정해짐) |
| [2026-10-04-design-questions.html](2026-10-04-design-questions.html) | 설계 1(서명 방식 장단점)·2(여러 기기)·3(여러 서버와 Redis 안전)·6(주소의 결과 코드 안전)의 답 | `docs/cycles/05-login-account/architect-proposal.md` | 없음 (1 확정, 2는 다음 줄) |
| [2026-10-04-design-questions-2.html](2026-10-04-design-questions-2.html) | 설계 7(탈퇴 본인 확인 두 방법)·8(계정 삭제 알림과 기록 표의 흐름)·10(리프레시 토큰 저장 보안)·12(화면 쪽 보안 구성을 지금 정하기)의 답 | `docs/cycles/05-login-account/architect-proposal.md` | 없음 (모두 정해짐) |
| [2026-10-04-design-questions-3.html](2026-10-04-design-questions-3.html) | 한 탭이 토큰을 갱신하는 동안 다른 탭의 요청이 어떻게 되는지 (시간 순서 그림) | `docs/cycles/05-login-account/architect-proposal.md` 결정 2 | 없음 (승인) |
| [2026-10-04-adr-drafts.html](2026-10-04-adr-drafts.html) | 결정 기록 초안 여섯(ADR-0038~0043): 결정, 사용자가 한 말, 고르지 않은 안, 결과 | 초안 (승인 뒤 `docs/adr/`) | 없음 (여섯 모두 승인, `docs/adr/`에 저장) |
| [2026-10-04-profile-display.html](2026-10-04-profile-display.html) | 네이버·카카오의 별명과 프로필 사진을 받아 화면에 보일지: 바뀌는 결정, PC·태블릿·폰 밑그림, 정할 것 셋 | `docs/cycles/05-login-account/spec.md`, `flow.md` | 없음 (셋 다 미승인: backlog에 두고 염두에만 둠) |
| [2026-10-04-design-delta.html](2026-10-04-design-delta.html) | 설계 문서를 풀어 쓴 것: 만드는 것, 저장하는 표, 순서 넷, 새 주소, 문구와 결과 코드, 운영 모양, 받아들인 한계, 하실 일 | `docs/cycles/05-login-account/design-delta.md` | 없음 (승인) |
| [design-delta-original.html](design-delta-original.html) | 설계 문서 원문 그대로 + Mermaid 그림 일곱을 미리 그려 넣은 것 (스크립트 없이 열림) | `docs/cycles/05-login-account/design-delta.md` | 없음 (원문이 바뀌면 다시 만듦) |
| [2026-10-04-review-decisions.html](2026-10-04-review-decisions.html) | 사이클을 닫기 전 검토 결과: 고친 것 16가지와 정할 것 8가지(화면 동작 둘, 서버 값 넷, 기록 둘) | `docs/cycles/05-login-account/design-delta.md` | 없음 (9가지 모두 정해짐) |
| [2026-10-04-auth-repo.html](2026-10-04-auth-repo.html) | 로그인·인증 코드를 다른 GitHub 저장소에 두고 설정으로 켜고 끄는 것: 이해한 모양, 정할 것 셋, dev에게 넘길 내용 | 사용자 요청 (2026-10-04), `design-delta.md` | 없음 (저장소 분리는 취소, 켜고 끄는 설정만 ADR-0046으로) |
| [2026-10-04-screen-mockups.html](2026-10-04-screen-mockups.html) | 새로 생기거나 바뀌는 화면 11장의 밑그림을 PC·태블릿·폰으로 나눠 그림 (자리와 순서만, 실제 디자인 아님) | `docs/cycles/05-login-account/flow.md` | 밑그림 전체가 [안] |

## 읽는 순서 제안

1. 전체를 처음 볼 때: `01-status` → `02-doc-map`
2. 수집·분류를 다시 할 때: `03-library-docs` → `04-book-docs`
3. 회원 사이클을 볼 때: `05-member-alerts` → `07-member-integration-plan` → `06-signup-security` → `08-cycle05-research-and-flow`

## 새 페이지를 더할 때

- 그때의 사이클 폴더 `docs/cycles/NN-<slug>/easy/`에 `YYYY-MM-DD-<주제>.html`로 넣고 그 폴더 `README.md` 표에 한 줄을 더합니다.
- 나중에 결정이 바뀌면 페이지는 그대로 두고 "지금과 다른 점" 칸만 고칩니다.
