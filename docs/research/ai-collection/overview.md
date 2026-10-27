# AI 에이전트로 수집 자동화 (조사, 2026-10-27 시작)

- 사용자 (2026-10-27): "랭그래프 같은 걸 활용해서 ai agent로 수집하는 것(도서관, 도서관-책 정보, 도서관 가입정보)을 자동화하는 것에 대해서 고민 중이야". 사이클 23·24 dev가 끝나지 않아 사이클 밖에서 먼저 조사함
- 이 문서는 조사와 방향 [안]만 둡니다. 모듈·표·API 설계는 사이클에서 합니다
- 결정 페이지: [`easy/2026-10-27-ai-collection-decisions.html`](easy/2026-10-27-ai-collection-decisions.html)

## 1. 지금 수집은 어떻게 하나 (2026-10-27 plan·dev 문서 기준)

| 갈래 | 지금 방법 | 사람이 판단하는 곳 | 근거 |
|---|---|---|---|
| ① 도서관 찾기 | 기관 목록(교보·웹러브 북스) → 확인 스크립트 → 수집 DB → 같은 사이트 거르기 → `library-insert` 넣기 | 종류 나누기(이름으로 1차 + 추정 250곳), 같은 사이트 쌍 읽기(`same_site.tsv` 등), 막힌 사이트 | `docs/research/collection/1-libraries.md` 3절, `library-join/candidates.md` 2절 |
| ② 도서관-책 | 플랫폼별 수집기 `crawl_catalog.py` (정해진 목록 주소·쪽 크기, 같은 호스트 1건·1초) | 수집기가 깨질 때 원인 찾기, 새 플랫폼 붙이기 | `docs/research/collection/2-books.md`, dev `docs/maintenance/2-crawl.md` |
| 가입 정보 | Claude 세션이 가입 안내 원문을 열어 읽고 표에 적음. 사람이 정한 값은 `scripts/library/join_overrides.tsv`가 마지막에 이김 | 원문 해석 전부 ("원문 우선, 추정 금지") | `library-join/candidates.md` 1절, dev `docs/library-maintenance.md` 4-8절 |

- 백로그 (사용자, 2026-09-28): "도서관 정보 주기적 재조사 … 주기와 자동화 범위는 미정" (`docs/backlog.md` 159행)
- dev는 이미 Python 스크립트에서 Claude Haiku 5.5를 부름: `scripts/aisearch/prototype_haiku.py` (`MODEL = "claude-haiku-5-5"`, 키 환경 변수 `CHAEKCHECK_AISEARCH_ANTHROPIC_API_KEY`) [확정] (dev 코드 확인, 2026-10-27)

## 2. LangGraph (공식 자료)

| 항목 | 내용 | 출처 (확인 2026-10-27) |
|---|---|---|
| 무엇 | "a low-level orchestration framework and runtime for building, managing, and deploying long-running, stateful agents" [확정] | https://docs.langchain.com/oss/python/langgraph/overview |
| 버전·라이선스 | `langgraph` 1.2.18 (2026-10-26), MIT [확정] | https://pypi.org/project/langgraph/ |
| 언어 | Python (공식 개요는 Python만 보임). Java는 공식이 아닌 LangGraph4j(MIT, Java 17 이상) | 개요 페이지, https://github.com/langgraph4j/langgraph4j (Maven Central `org.bsc.langgraph4j`) |
| 멈췄다 이어 가기 | `interrupt()`로 멈추고 `Command(resume=...)`로 이어 감. 체크포인터가 필요하고, 같은 `thread_id`로 불러야 이어짐. 이어 갈 때 그 단계는 처음부터 다시 돎 [확정] | https://docs.langchain.com/oss/python/langgraph/interrupts |
| 운영 주의 (제3자 글) | 체크포인트 표가 정리 규칙 없이 커짐, 스키마 바뀌면 옮기기 필요 | towardsai.net "LangGraph Checkpointing Is Not Free" (제3자, 공식 아님) |

정리 [추론]: LangGraph가 주는 것은 "여러 단계 + 되돌이 + 사람 승인에서 멈췄다 이어 가기 + 실패 뒤 이어 가기"입니다. 한 페이지를 읽고 값을 뽑는 한 단계 일에는 이 틀이 필요 없습니다.

## 3. 모델 가격 (공식)

https://platform.claude.com/docs/en/about-claude/pricing (확인 2026-10-27) [확정]

| 모델 | 입력 / 1M 토큰 | 출력 / 1M 토큰 | 배치 (50% 할인) |
|---|---|---|---|
| Claude Haiku 5.5 (프롬프트 10만 토큰 이하) | $0.10 | $0.50 | $0.05 / $0.25 |
| Claude Sonnet 5.5 | $2 | $10 | $1 / $5 |

비용 어림 [추론]: 가입 정보를 공공도서관 약 400곳(등록 도서관 278 + 가입 조건 조사한 후보 공공도서관 120, 대부분 공공도서관이라고 가정)에서 도서관마다 페이지 3장 × 약 4,000토큰 = 12,000토큰 입력, 600토큰 출력으로 보면 입력 480만·출력 24만 토큰 → Haiku 5.5 약 $0.6, Sonnet 5.5 약 $12. 한국어 토큰이 더 많이 나오면 1.5~2배.

## 4. 방향 [안] (결정 페이지에서 묻는 것)

1. 갈래별로 쓰는 곳을 나눔 [안]: 가입 정보 = AI가 원문을 읽고 값과 인용을 냄(가장 먼저). ① 도서관 찾기 = 종류 나누기·같은 사이트 판단의 초안만. ② 책 수집 = 지금 수집기 그대로, AI는 수집기가 깨졌을 때 원인 보고만
2. 도구 [안]: 처음엔 LangGraph 없이 Python 스크립트 + Claude API(Haiku 5.5, 정해진 칸으로 답) 한 단계. 여러 단계 되돌이·승인 대기가 실제로 필요해지면 LangGraph(Python)로 옮김
3. 사람 승인 [안]: AI 값은 바로 서비스에 들어가지 않음. 인용문이 받아 온 원문에 그대로 있는지 스크립트가 확인 → 지금 값과 다른 곳만 목록 → 사용자 승인 → `join_overrides.tsv`나 넣기 명령
4. 돌리는 곳 [안]: 내 PC (수집기·가져오기와 같은 곳). 운영 서버에는 올리지 않음
5. 순서 [안]: 23·24 dev 뒤 사이클로. 그 전에 가입 정보 20곳 시험(기존 사람 조사값과 비교)만 먼저

## 5. 세 관점 자체 검토 (2026-10-27)

| 관점 | 찾은 것 | 반영 |
|---|---|---|
| 이용자 | AI가 가입 조건을 틀리게 읽으면 "가입 가능"이 잘못 보임 | 3번: 승인 전에는 서비스 값 안 바뀜, 인용문 자동 대조 |
| 서버 자원 | LangGraph 체크포인트 표·Python 프로세스를 운영 서버에 두면 메모리·DB가 늚 | 4번: PC에서만, 운영 서버 0 |
| 보안·안정성 | 도서관 페이지 글 안의 지시문이 AI를 움직일 수 있음(프롬프트 인젝션) | AI에게 쓰기·탐색 도구를 주지 않고 정해진 칸만 답하게 함. 페이지는 지금 `fetch.py`처럼 같은 호스트 1초 이상 간격으로 스크립트가 받음, 도서관마다 최대 페이지 수 [안] 5장 |
| 보안 | API 키 | dev와 같은 방식(환경 변수, 출력·저장 안 함) |

## 6. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| Haiku 5.5가 가입 조건 원문을 사람 조사만큼 읽는지 | 프로토타입 (공공도서관 20곳, 기존 `public-join-2026-10-05.tsv`와 비교) |
| 자바스크립트로만 그리는 가입 페이지(2026-10-05 조사에서 몇 곳)를 스크립트가 받을 수 있는지 | 프로토타입 |
| 등록·후보 공공도서관 실제 수 | dev seed·수집 DB 세기 |
