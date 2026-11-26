# 사이클 30 조사 기록

## 1. LangGraph (확인 2026-11-26)

| 항목 | 내용 | 출처 |
|---|---|---|
| 최신 버전 | `langgraph` 1.2.24, 2026-11-20 배포 [확정] | https://pypi.org/project/langgraph/ |
| 라이선스·파이썬 | MIT, Python 3.10 이상 [확정] | 같은 곳 |
| 노드 | "Nodes and edges are ordinary functions. They can call an LLM or run other code." — 노드는 보통 Python 함수라 Anthropic SDK를 그대로 부를 수 있음 (LangChain 모델 묶음이 꼭 필요하지 않음, 문서에 "다른 SDK"라고 적혀 있지는 않아 추론) | https://docs.langchain.com/oss/python/langgraph/graph-api |
| 상태 저장 | 메모리(`InMemorySaver`, 꺼지면 사라짐)와 파일(`SqliteSaver`, 따로 설치하는 `langgraph-checkpoint-sqlite`) [확정] | https://docs.langchain.com/oss/python/langgraph/persistence , https://docs.langchain.com/oss/python/langgraph/checkpointers |
| 주의 | 멈췄다 이어 가거나 다시 시도하면 그 노드는 함수 처음부터 다시 돎. 그 전에 한 일(페이지 받기, AI 호출)이 다시 일어나므로 같은 결과가 되게 짜야 함 [확정] | graph-api 페이지 |

2026-10-27 조사(`docs/research/ai-collection/overview.md` 2절)는 1.2.18이었고, 그 뒤 판이 올랐습니다.

## 2. Anthropic 쪽 방법 (확인 2026-11-26)

| 항목 | 내용 | 출처 |
|---|---|---|
| Managed Agents | "Claude Managed Agents provides the harness and infrastructure for running Claude as an autonomous agent." beta, 헤더 `managed-agents-2026-04-01` [확정] | https://platform.claude.com/docs/en/managed-agents/overview |
| 내 PC에서 도구 실행 | 자체 샌드박스: 도구 실행을 내 설비로 옮기고 Anthropic은 반복을 계속 돌림. 내 PC 워커가 줄을 읽어 도구를 실행하고 결과를 돌려줌 [확정] | https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes |
| Managed Agents 요금 | 토큰 + "Session runtime $0.08 USD per session-hour", `running` 상태일 때만 [확정] | https://platform.claude.com/docs/en/about-claude/pricing |
| Claude Agent SDK | Claude Code를 움직이는 도구·반복·맥락 관리를 Python·TypeScript로 씀. 파일 읽기·쓰기·고치기, 명령 실행, 웹 검색 [확정] | https://code.claude.com/docs/en/agent-sdk/overview |
| 도구 실행기(tool runner) | "the SDK runs your tools and sends the results back automatically." Anthropic SDK의 beta 기능(`client.beta.messages.tool_runner`) — beta 여부는 Anthropic SDK 안내 기준, 해당 공식 페이지는 직접 못 봄 | https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview |
