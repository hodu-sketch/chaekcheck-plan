# 사이클 순서와 상태 (먼저 읽을 것)

사이클 번호는 **plan을 시작한 차례**이고, dev가 만드는 차례와 다릅니다. 여러 사이클을 미리 계획해 두고 dev가 병렬이나 다른 순서로 만들었기 때문입니다. 다른 AI 세션은 사이클 문서를 읽기 전에 이 표로 지금 무엇이 어디까지 왔는지 먼저 확인합니다. 사이클을 시작·인계·회고하거나 순서를 바꾸면 이 파일을 같이 고칩니다 (사용자: "문서에 이렇게 순서 뒤틀린 것도 좀 다른 ai라 파악하기 좋게 넣어주라", 2026-10-17).

- 지금 dev가 읽는 인계서: `docs/current/handoff.md` = **사이클 20** (+ 끝에 사이클 21 회고 작은 일)
- 지금 dev 세션: `chaekcheck-dev-cycle-20` (dev 워크트리 `../chaekcheck-dev-c20`, 브랜치 `cycle-20-lookup-status`)

## 1. 지금 열려 있는 사이클 (2026-10-17, 19 줄 2026-10-18)

| 사이클 | plan | dev | 다음 |
|---|---|---|---|
| 20 조회 상태 신호 + 확장 (+ 나가는 길 = webshare 작업) | 인계 끝 (2026-10-17) | 1단계 dev main `262bb03`, 나가는 길(1-15) `d5341a6` (2026-10-18). **사용자 폰 확인 남음** | 1단계 → 17 배포 → 2단계 → 3단계(조건부). 백로그 "사이클 20 남은 단계" |
| 17 첫 배포 (AWS Lightsail 서울) | 계획 중 (자기 세션 `chaekcheck-plan-cycle-17`), 인계서 아직 없음. 사전 준비 끝(2026-10-18): 도메인 chaekcheck.com, SNS 경보 2개, Webshare 20개·API 키, EC2 시드니 기본 세팅 (17 `research.md` §17) | 아직 | 사이클 20 **1단계 뒤**에 배포 |
| 19 저자 꺾쇠 표기 | 인계·회고 끝 (회고 2026-10-18, `retro.md`) | dev main `1c129e8`, 운영 역할 DB 반영 기록 12번 (2026-10-16) | 회고 "사용자에게 확인할 것" 4개(ADR-0114 고침, 공급사 묶음 승인, 국가서지 TTL, 남은 잘못 합침 약 0.2%) |
| 24 AI 책 찾기 (`24-ai-book-search`) | **범위 정함, 결정 6개 끝** (2026-10-24, 클라우드 세션 `chaekcheck-plan-22`, 브랜치 `claude/compassionate-lovelace-mzvp4f`). 첫 화면 "AI 책 찾기" 탭(처음 열림) + 따로 된 결과 화면, Haiku 5.5 실시간, 로컬 LLM은 별개. ADR 0150부터. 사이클 23(다른 세션, 다른 브랜치)과 나란히 계획 | 아직 | `/feature-spec`. dev는 **23과 나란히** (사용자 2026-10-24, 범위 결정 #4) |
| 22 첫 화면 사용성 (`22-first-screen-usability`) | 인계 끝 (2026-10-18, 세션 `chaekcheck-plan-cycle-22`; 인계서는 사이클 폴더, `docs/current/handoff.md`는 20 그대로 + 한 줄). 웹만, ADR-0135~0138 | 아직 | **22 먼저, 사이클 20 2단계는 그 뒤** (사용자 2026-10-18). 회고는 dev 뒤 |
| 21 추천도서 | 인계·회고 끝 (2026-10-17) | dev main `836bd7b`, 운영 역할 DB 반영 | 회고 작은 일(수집기)은 20 dev 세션이 끝냄, 「춘향전」 `manual` 고정 진행 |

## 2. 순서가 뒤틀린 곳

번호 차례대로 읽으면 헷갈리는 곳만 적습니다.

1. **20이 17보다 먼저 만들어집니다.** 17(첫 배포)은 2026-10-13에 계획을 시작했지만, 사용자가 "사이클 20을 먼저 개발하고, 그다음 17 배포로 해"(2026-10-16)라고 정했습니다. 그래서 20 1단계 → 17 배포 → 20 2단계 순서입니다.
2. **나가는 길(webshare 작업)은 사이클 번호가 없습니다.** 나가는 길(Webshare 한국 IP 20개 길, 막힌 길 처리)은 처음에 "사이클 22"로 불렸지만, 사용자가 "나중에 사이클 22는 다른 게 될 거야"(2026-10-18)라고 해 이제 **"webshare 작업"**으로 부릅니다. 옛 문서(조사 `multi-source-ip.md`, 17 폴더, ADR-0118·0130)에 남은 "사이클 22"·"17/22"는 이 일을 가리킵니다. 하지만 사이클 폴더로 만들어진 적이 없고, 조사 `docs/research/deploy/multi-source-ip.md`, 17 폴더의 `from-research-lookup-egress.md`·`from-cycle-20-proxy-only.md`·`from-cycle-20-blocked-ip-resume.md`, ADR-0130에 나뉘어 있습니다.
   - 2026-10-17 사용자 결정("Webshare 20개 길, 막힌 길 처리, 이건 20dev에서 할 수 있자나"): **길 목록과 막힌 길 처리는 사이클 20 dev로 옮김** (20 인계서 1-15). dev 기록은 `plan-feedback.md` "# 사이클 webshare (사이클 20 안에서, 2026-10-17)".
   - 17에 남는 것: 업체 데이터 세기(80%·90%), 업체 오류 때 Webshare 길 전체 멈춤, CloudWatch→SNS 경보.
   - 세션 `chaekcheck-plan-cycle-22`는 2026-10-18부터 **진짜 사이클 22 = 첫 화면 사용성**(`22-first-screen-usability`)을 맡음. webshare 작업과 무관. 폴더 이름은 `20-lookup-status-and-extension` 그대로 [확정: 사용자가 새 이름을 주지 않는 한].
3. **19와 21은 dev에서 병렬로 만들었습니다.** 21은 19가 dev main에 들어간 뒤 그 위에서 시작했습니다. plan 인계서(`docs/current/handoff.md`)는 19 → 20으로 바로 바뀌었고, 21은 사이클 폴더에만 인계서가 있었습니다.
4. **12·13·14와 15·16도 미리 인계했습니다.** dev 순서는 11 → 12 → 13이었고, 14는 자기 워크트리(`../chaekcheck-dev-c14`)에서, 16은 15와 병렬로 만들었습니다. 이 시기의 인계서는 사이클 폴더에만 있고 `docs/current/handoff.md`에는 한 줄만 있었습니다.
5. **18은 일부만 했습니다.** A1·A2·B는 dev main(`a0e438a`)에 들어갔고, B는 사용자가 19보다 앞으로 옮겼습니다. C(첫 배포 뒤 운영 반영)는 백로그로 갔습니다.
6. **세션 이름의 번호 = 사이클 번호**이지만, 23처럼 plan 폴더가 없는 세션(`chaekcheck-plan-cycle-23`, `chaekcheck-dev-cycle-23`)도 있습니다. 폴더가 없으면 그 일은 조사(`docs/research/`)나 다른 사이클 안에 있습니다. 찾을 때는 `docs/reference-index.md`와 백로그를 봅니다.

## 3. 끝난 사이클

| 사이클 | 이름 | 상태 |
|---|---|---|
| 01~16 | `01-ebook-availability-search` ~ `16-notices-and-policies` | 인계·회고 끝 |
| 18 | `18-empty-library-holdings` | 인계·회고 끝 (C는 백로그) |
| 19 | `19-author-angle-brackets` | 인계·회고 끝 (회고 2026-10-18, 사용자 확인 4개 남음) |
| 21 | `21-recommended-books` | 인계·회고 끝 |

## 4. 어디를 보면 되나

- 지금 결정된 전체 설계: `docs/current/` (`module-map.md`, `data-model.md`, `api.md`, `flows.md`). "설계됨(미구현)"은 아직 dev에 없는 것
- 숫자(시간·크기·동시 수): `docs/settings-index.md`
- 수집·분류·묶기·추천 목록 맞추기 절차: `docs/reference-index.md`
- 사이클 밖에서 미룬 일: `docs/backlog.md`
- 결정 기록: `docs/adr/README.md`
