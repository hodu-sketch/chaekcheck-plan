# 말로 책 찾기 (실시간 LLM): 제안과 결정 기록

- 작성 2026-10-23. 사이클 밖 제안. 모듈·표·API·화면은 사이클에서 정함.
- 계기: 사용자 "내가 모은 수집 데이터베이스로(도서,상세설명,태그) 사용자가 어떤어떤 책을 찾고 싶어 이러면 책 표지랑 같이 그의 요구에 맞는 여러 책을 찾아주고 싶은데 지금 서비스에 vast.ai(내가 llm)랑 소통하도록 해서 도서 알려주고 싶은데 … 책에 대한 간단한 설명과 찾은이유도 이어야 해" (2026-10-23)
- 결정 페이지: [easy/2026-10-23-natural-search-proposal.html](easy/2026-10-23-natural-search-proposal.html) (1차, https://claude.ai/artifact/GTS6MLsWodDCeKLmP5dFhu), [easy/2026-10-23-natural-search-proposal-2.html](easy/2026-10-23-natural-search-proposal-2.html) (2차, https://claude.ai/artifact/CjbVj9WsZojzMaHkYNxwb4)

## 1. 원칙 [안]

- 후보는 우리 DB에서 뽑고(꼬리표 + 임베딩 KURE-v1, 내 계획 도서관에 있는 책), LLM은 후보 번호 중에서 고르고 찾은 이유를 씀. 표지·제목·저자·소개는 DB에서 붙임. 후보 밖 번호는 버림. LLM이 응답하지 않으면 후보를 이유 없이 보여 줌 (`overview.md` 1절 "LLM이 하지 말아야 할 것"과 같음)

## 2. 1차 응답 (2026-10-23, 네 개 모두 기타)

| # | 1차 [안] | 사용자 (기타) |
|---|---|---|
| 1 | 두 번 호출 + 소개는 미리, 실시간은 이유만 | "책 소개를 실시간으로 해야 해당 질문글에 맞는 답을 할 수 있는거 아니야?" |
| 2 | Haiku API로 시작, 나중에 vast.ai | "직접 llm도 다뤄보고 싶어 / api랑 하이쿠랑 뭐가 그렇게 달라? / 튜닝 같은거 해야 하는 거 아니야?" |
| 3 | 원문 대신 미리 만든 소개 + 꼬리표 | "소개 원문 보내도 될 것 같은데 어짜피 llm이 가공해주자나" |
| 4 | "나에게 맞는 책" 탭 맨 위 입력칸 | "첫화면 검색 할 때 구글 검색처럼 아래에 ai 책 찾기가 나오도록 한다던가..." |

## 3. 2차 [안] (2차 페이지)

1. 소개는 미리, 질문에 맞추는 일은 찾은 이유가 맡음 (대안: 질문에 맞춘 글 한 덩어리를 실시간)
2. 내 LLM(vast.ai + vLLM), 켜는 시간은 사용자가 정함, 꺼져 있으면 이유 없이 후보만 — 2026-10-17 결정 3번("vast.ai는 일괄로만, 서버가 실시간으로 부르지 않음")을 바꿈 → 사이클에서 ADR. 튜닝은 처음엔 안 함(지시문 + JSON 형식 → 예시 쌓기 → 필요하면 LoRA)
3. 원문은 PC에 두고, PC에서 원문으로 만든 "내용 메모"(낱말·짧은 사실 문장, 화면에 안 보임)만 운영 DB에 — 2026-10-23 결정 1번 유지. 메모가 2차적 저작물에 해당하는지 [확인 필요: 법률 검토]
4. 첫 화면 검색창 아래 AI 책 찾기 칸 자동, LLM이 꺼져 있으면 숨김. 도서관 조회와 따로 돌림

## 4. 확인한 외부 사실 (2026-10-23)

- vLLM OpenAI 호환 서버, `--api-key`는 `/v1`·`/v2`·`/inference`만 인증하고 다른 주소(`/invocations` 등)는 인증하지 않는다는 경고 [확정] https://github.com/vllm-project/vllm/blob/main/docs/serving/online_serving/openai_compatible_server.md
- vLLM 구조화 출력 `response_format` `json_schema` [확정] https://github.com/vllm-project/vllm/blob/main/docs/features/structured_outputs.md
- vLLM LoRA 어댑터 서빙 [확정] https://github.com/vllm-project/vllm/blob/main/docs/features/lora.md
- (docs.vllm.ai는 이 환경에서 이름 풀이가 안 되어 GitHub 원문으로 확인)

## 5. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 두 번 호출 응답 시간 | 프로토타입 |
| 지금 vast.ai 시세 (2026-10-17 값: 3090 $0.16/시간) | 공식 문서 확인 |
| 한 번에 드는 토큰 (가정: 입력 5천·출력 400) | 프로토타입 |
| 8B 모델과 Haiku의 한국어 이유 품질 | 프로토타입 (같은 질문 표본 비교) |
| Haiku를 우리가 직접 튜닝할 수 있는지 | 공식 문서 확인 |
| 내용 메모의 저작권 판단 | 사용자에게 질문 (법률 검토 여부) |

## 6. 2차 응답 (2026-10-23)

| # | 사용자 | 상태 |
|---|---|---|
| 1 | "(나) 질문에 맞춘 글 한 덩어리를 실시간" 선택 | [확정] 카드 글은 질문에 맞춘 2~3문장을 실시간으로 씀(소개·이유를 나누지 않음). "나에게 맞는 책" 탭의 미리 만든 소개는 그대로 |
| 2 | 기타: "일단 둘 다 되도록 해주고, haiku로 먼저 하고 병렬적으로 llm 다루는 것 좀 알려줘 vast.ai이전에 먼저 내 로컬 컴퓨터에 간단한 모델 돌려보고 싶어" | [확정] 서버는 Haiku(Anthropic Messages API)와 내 LLM(OpenAI 호환: Ollama → vast.ai vLLM)을 둘 다 부를 수 있게, Haiku로 먼저. 로컬 시작 순서는 3차 [안] #2 |
| 3 | 기타: "퀄리티 측면에서 어떤 게 나아? 소개글을 메모로 만들어서 올린다 vs llm이 다 한다" | 3차 [안] #3: PC에서 같은 질문 20개로 원문·메모 비교 뒤 결정 |
| 4 | 기타: "나는 llm검색을 메인 창에 두고 싶었는데... 그리고 llm검색은 별도의 창으로 두고.." | 3차 [안] #4: 첫 화면 검색창 탭 두 개(처음은 도서관), AI 결과는 따로 된 화면 |

- 3차 결정 페이지: [easy/2026-10-23-natural-search-proposal-3.html](easy/2026-10-23-natural-search-proposal-3.html) (https://claude.ai/artifact/4YXxsqH5d923JveU3hRiAL)
- 내 LLM(vast.ai)을 실시간으로 부르게 되는 때 2026-10-17 결정 3번이 바뀜 → 그 사이클에서 ADR. Haiku 실시간 호출은 `overview.md` 1절 "자연어 요청 해석(나중) Claude Haiku 온라인 호출"과 같은 방향

## 7. 3차에서 확인한 외부 사실 (2026-10-23, GitHub 원문)

- Ollama: Windows 기본 프로그램, NVIDIA·AMD 지원, Windows 10 22H2 이상, NVIDIA 드라이버 551.61 이상, 설치 4GB 이상 [확정] https://github.com/ollama/ollama/blob/main/docs/windows.mdx
- Ollama OpenAI 호환 `http://localhost:11434/v1/chat/completions`, `response_format` 지원 표시 [확정] https://github.com/ollama/ollama/blob/main/docs/api/openai-compatibility.mdx ; 기본 바인드 127.0.0.1:11434 [확정] https://github.com/ollama/ollama/blob/main/docs/faq.mdx
- vLLM "does not support Windows natively" (WSL 필요) [확정] https://github.com/vllm-project/vllm/blob/main/docs/getting_started/installation/README.md
- Anthropic OpenAI SDK 호환: "primarily intended to test and compare model capabilities, and is not considered a long-term or production-ready solution" [확정] https://platform.claude.com/docs/en/api/openai-sdk
- Ollama 모델 이름(크기 표기): ollama.com이 이 환경에서 막혀 [확인 필요: 공식 문서 확인]
- 사용자 PC 사양(그래픽카드·메모리) [확인 필요: 사용자에게 질문]
