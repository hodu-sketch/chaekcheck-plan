# 오프라인 AI 작업: GPU 임대(vast.ai)·API·모델·비용

- 조사 2026-10-17. 사이클 밖 조사입니다. 종합과 우리 서비스 안은 [overview.md](overview.md).
- 계기: 사용자 "vast.ai같은걸 써서 rest api로 연결할까해" (2026-10-17)
- 태그: [확정] = 2026-10-17에 공식 페이지를 열어 읽은 값, [확인 못 함] = 페이지가 없거나 값이 안 나옴, [추론] = 확정값으로 계산(가정 명시). 조사 에이전트가 원문을 연 보고를 옮김.
- Claude 모델 이름·가격은 번들 `claude-api` 스킬(캐시 2026-10-06)의 값을 platform.claude.com 가격 페이지로 재확인해 일치함.

## 1. GPU 임대: vast.ai, RunPod, Lambda

| 항목 | 내용 | 출처 |
|---|---|---|
| 임대 방식 | **On-demand**: "Cannot be interrupted", 고정가. **Interruptible**: 입찰, 더 높은 입찰에 밀리면 "Your instance is stopped (killing running processes)", "Saves 50-80%" [확정] | https://docs.vast.ai/guides/reference/faq/rental-types , https://vast.ai/pricing |
| 가격 결정 | "Prices are set by the market, not by Vast" → 동적 시세 [확정] | 같음 |
| 호스트(장비 주인) | 외부 제공자가 가격을 정함. 보안 FAQ: "Provider security varies significantly", "Individual hosts may have less formal security measures". 격리는 "unprivileged Docker containers". 권고: "Encrypt data before uploading", "Use Secure Cloud certified providers only". **호스트가 데이터를 볼 수 없다는 명시 문장은 없음** [확정] | https://docs.vast.ai/guides/reference/faq/security |
| 신뢰도 점수 | 검색 API에 `reliability2` 필드(예 0.95~0.999), "Higher reliability scores typically correlate with higher prices" [확정]. 산식 [확인 못 함] | https://docs.vast.ai/api-reference/search/search-offers |
| 저장소 과금 | "$/GB/month", 인스턴스가 있는 동안 초 단위, "Stopping an instance does not avoid storage costs", 대역폭 "$/TB" [확정] | https://docs.vast.ai/billing |
| 삭제 때 데이터 | 컨테이너 디스크: "All data is permanently lost when instance is destroyed". 볼륨은 같은 호스트에서만 재부착 [확정] | https://docs.vast.ai/instances/storage |
| CLI/API | `pip install vastai` → `vastai search offers`, `vastai create instance OFFER_ID --image … --disk 20`, `vastai destroy instance ID`. REST `https://console.vast.ai` `PUT /api/v0/asks/{id}`, `DELETE /api/v0/instances/{id}` [확정] | https://docs.vast.ai/cli |
| Serverless | 있음. "pay-per-second pricing", 일반 인스턴스 가격과 같음. Ready/Loading 워커만 GPU 과금. 새 엔드포인트마다 벤치마크 평가 기간 필요 [확정] | https://docs.vast.ai/serverless , https://docs.vast.ai/serverless/pricing |
| 약관 | vast.ai/legal/terms, /legal/tos 404 [확인 못 함] | |

현재 시세 (검색 API 실측, 1 GPU, verified, on-demand, 저가순 — 시시각각 변함) [확정, 2026-10-17 조회값]

| GPU | 최저 $/h | 상위 10건 범위 | 전체 범위(건수) | 입찰 최저 예 |
|---|---|---|---|---|
| RTX 3090 | 0.162 | 0.16–0.18 | 0.16–0.55 (33건) | 0.11–0.16 |
| RTX 4090 | 0.402 | 0.40–0.47 | 0.40–3.16 | 0.27–0.44 |
| A100 40GB | 0.456 | 0.46–0.60 | 0.46–1.40 (30건) | 0.45–0.60 |

storage_cost는 오퍼별 $0.13–0.87/GB/월, 다운로드 $0.001–0.04/GB.

비교 [확정]
- RunPod (https://www.runpod.io/pricing): Pod 시간당 RTX 3090 $0.22(Community)/$0.50(Secure), RTX 4090 $0.34/$0.89, A100 PCIe $1.19/$1.79, H100 SXM $2.69/$3.99. Serverless 3090급 $0.69/h, 4090 $1.10/h, A100 $2.72/h. 저장소 $0.10/GB/월.
- Lambda (https://lambda.ai/service/gpu-cloud): A100 40GB $1.99/h, H100 PCIe $3.29/h, A6000 $1.09/h. 3090/4090 없음.

→ 가격만 보면 vast.ai 시장가(3090 $0.16, 4090 $0.40)가 가장 싸고 RunPod Secure·Lambda는 2~5배. 책 제목·저자·출판사는 공개 정보라 호스트 노출 위험은 낮지만, **API 키·DB 덤프·이용 기록은 올리지 말 것** (보안 FAQ 권고) [추론].

## 2. 임베딩 모델 (문장을 숫자 벡터로 바꾸는 모델)

| 모델 | 차원 | 최대 길이 | 언어 | 라이선스 | 비고 | 출처 |
|---|---|---|---|---|---|---|
| BAAI/bge-m3 | 1024 | 8192 tok | "more than 100 working languages"(한국어 명시 없음) | MIT | 약 5.7억 파라미터 [추론] | https://huggingface.co/BAAI/bge-m3 |
| Qwen/Qwen3-Embedding-0.6B | 32–1024 (지정 가능) | 32k | 100+ | Apache-2.0 | | https://huggingface.co/Qwen/Qwen3-Embedding-0.6B |
| Qwen/Qwen3-Embedding-8B | 32–4096 | 32k | 100+ | Apache-2.0 | | https://huggingface.co/Qwen/Qwen3-Embedding-8B |
| intfloat/multilingual-e5-large | 1024 | 512 tok | 100 (벤치표에 ko 열) | MIT | | https://huggingface.co/intfloat/multilingual-e5-large |
| nlpai-lab/KURE-v1 | 1024 | 8192 | **한국어 특화**(bge-m3를 한국어로 파인튜닝, 고려대 NLP&AI Lab) | MIT | 한국어 검색 top-1 recall 평균 0.5264 (dragonkue/BGE-m3-ko 0.5236) | https://huggingface.co/nlpai-lab/KURE-v1 |

모두 [확정]. 한국어 책 제목·저자·소개 임베딩이면 KURE-v1(bge-m3 기반, 1024차원, MIT)이 가장 직접적인 후보 [추론].

API 가격($/1M tokens) [확정]
- Voyage (https://docs.voyageai.com/docs/pricing): voyage-4-large $0.12, voyage-4 $0.06, voyage-4-lite $0.02 — 셋 다 **계정당 무료 2억 토큰**; voyage-3.5 $0.06; voyage-multilingual-2 $0.12.
- OpenAI (https://developers.openai.com/api/docs/pricing): text-embedding-3-small $0.02, 3-large $0.13.
- Google (https://ai.google.dev/gemini-api/docs/pricing): gemini-embedding-2 $0.20(배치 $0.10), 무료 등급 있음.

토큰·비용 추정 [추론] — 가정: 68만 권 × 100 토큰 = 6,800만 토큰. 한국어는 토크나이저에 따라 1.5~2배가 될 수 있어 **6,800만~1억 3,600만** 범위.

| API | 6,800만 tok | 1억 3,600만 tok |
|---|---|---|
| voyage-4 / voyage-4-lite | $0 (무료 2억 토큰 안) | $0 |
| OpenAI 3-small | $1.36 | $2.72 |
| voyage-3.5 | $4.08 | $8.16 |
| gemini-embedding-2 (배치) | $6.80 | $13.60 |

GPU 처리량: bge-m3 공식 카드·sbert 문서 모두 문장/초 수치를 주지 않음 [확인 못 함]. sbert 효율 문서는 RTX 3090에서 FP16이 FP32 대비 2.92배라는 상대값만 [확정] (https://sbert.net/docs/sentence_transformer/usage/efficiency.html). 참고 가정: 4090에서 100~500문장/초로 잡으면 68만 건 = 23분~1.9시간 → $0.2~1 [추론].

## 3. 소개 문장 생성 LLM (10만 권 기준)

Claude Haiku 5.5 (https://platform.claude.com/docs/en/about-claude/pricing) [확정]
- 입력 $0.10/MTok, 출력 $0.50/MTok. 배치(Message Batches): "50% discount on both input and output tokens" → $0.05 / $0.25. 배치 문서: "most batches finishing in less than 1 hour" (https://platform.claude.com/docs/en/build-with-claude/batch-processing).
- 비용 [추론]: 10만 요청 × (300 in + 80 out) = 3,000만 in + 800만 out → 표준 **$7.00**, 배치 **$3.50**. 한국어 토큰 2배 가정 시 $14 / $7.

자체 호스팅 후보 [확정]

| 모델 | 크기 | 라이선스 | 상업 이용 | 출처 |
|---|---|---|---|---|
| LG EXAONE 4.0 | 32B, 1.2B | EXAONE AI Model License 1.2 - NC | **금지**: "expressly prohibited from using the Model… for any commercial purposes" | https://huggingface.co/LGAI-EXAONE/EXAONE-4.0-32B |
| Naver HyperCLOVA X SEED Think 14B | 14.74B | HyperCLOVA X SEED Model License | 허용(royalty-free), MAU 1천만 초과 시 별도, "Powered by HyperCLOVA X" 표시 의무 | https://huggingface.co/naver-hyperclovax/HyperCLOVAX-SEED-Think-14B |
| Qwen3 (0.6B~32B) | — | Apache-2.0 | 허용. 119개 언어, 한국어 명시 | https://qwenlm.github.io/blog/qwen3 |
| Kakao Kanana-1.5-8B-instruct | 8B | Apache-2.0 | 허용. 한·영 | https://huggingface.co/kakaocorp/kanana-1.5-8b-instruct-2505 |

vLLM: `vllm serve <model>`로 OpenAI 호환 서버(`/v1/chat/completions`, `/v1/embeddings` 등) [확정] (https://docs.vllm.ai/en/latest/serving/online_serving/). 공식 처리량 수치 없음 [확인 못 함]. 참고 가정: 4090에서 8B 모델로 10만 건(출력 800만 토큰) 2~10시간 → $1~5 [추론].

## 4. pgvector (PostgreSQL 18)

pgvector README (https://github.com/pgvector/pgvector) [확정]
- HNSW: "Indexes build significantly faster when the graph fits into `maintenance_work_mem`". 크기: `vector` = 4×dim+8 B, `halfvec` = 2×dim+8 B, `bit` = dim/8+8 B. "Use the `halfvec` type … for a smaller working set", 이진 양자화 가능. 인덱스 크기 산식은 README에 없음 [확인 못 함].

68만 × 1024차원 크기 [추론] (행 헤더 제외, 인덱스는 데이터의 1~1.5배로 가정)

| 저장 방식 | 표 | HNSW 인덱스 |
|---|---|---|
| vector(1024) | 2.79 GB | 2.8~4.2 GB |
| halfvec(1024) | 1.40 GB | 1.4~2.1 GB |
| halfvec(256) (차원 축소) | 0.35 GB | 0.35~0.5 GB |
| bit(1024) 이진 양자화 | 0.09 GB | ~0.1 GB |

4GB 서버(Spring Boot + PostgreSQL 동거)에서 vector(1024) HNSW는 메모리에 안 들어가 빌드·질의 모두 느림. **운영 서버에는 벡터 인덱스를 두지 않는 쪽이 맞음** [추론].

대안: 오프라인에서 이웃 20개 미리 계산 [추론]
- 책당 1행 (`book_id`, 이웃 `int4[20]`, 점수 `real[20]`): 68만 × ~200 B ≈ **0.13 GB**, PK만 → 운영 서버에 부담 없음.
- 행 단위 (book_id, neighbour_id, score): 1,360만 행 ≈ 0.6 GB + 색인 0.3 GB.

## 5. 비용 요약 (원화)

환율 1 USD = 1,334.89 KRW (https://open.er-api.com/v6/latest/USD, 2026-10-17 00:02 UTC). 한국은행 페이지는 열리지 않아 공식 환율 [확인 못 함].

| 안 | 입력 가정 | USD | KRW |
|---|---|---|---|
| (A) vast.ai 임대 (임베딩 68만 + 소개문 10만) | RTX 4090 $0.40–0.47/h 또는 3090 $0.16–0.18/h; 총 3~15시간(설치·모델 내려받기 포함); 디스크 50GB × 1일 $0.3~1.5 | 4090 $2~8 / 3090 $1~4 | **1,300~11,000원** |
| (B) API 임베딩 + Haiku 5.5 배치 | 임베딩 $0(voyage-4 무료)~$14; 소개문 배치 $3.5~7 | $3.5~21 | **4,700~28,000원** |
| (C) 본인 PC CPU | bge-m3 CPU 처리량 공식 수치 없음 [확인 못 함]. 가정 20~100문장/초 → 68만 건 1.9~9.4시간 | $0 | **0원** (전기료 제외) |

보이지 않는 비용: (A)는 환경 구축·실패 재시도와 입찰형 중단 위험(체크포인트 필수), (B)는 한국어 토큰 수 불확실, (C)는 PC 점유 시간, 소개문 10만 건을 CPU로 만드는 것은 비현실적 [확인 못 함].

## 추천 [추론]

1. 임베딩은 **본인 PC**에서 KURE-v1(또는 bge-m3)로 먼저 시도 — 비용 0, 한 번만. 너무 느리면 vast.ai RTX 3090($0.16/h).
2. 소개문 10만 건은 **Claude Haiku 5.5 배치($3.5~7)** 가 임대 GPU 설치·라이선스 검토보다 싸고 빠름. 자체 호스팅이 꼭 필요하면 Qwen3 8B/14B 또는 Kanana(Apache-2.0); EXAONE은 상업 금지.
3. 운영 서버(4GB)에는 벡터 인덱스를 두지 말고 **책당 이웃 20개 표(~130MB)** 만 파일로 적재.
4. 임베딩 원본은 PC에 보관(재계산 비용 절감).
5. vast.ai는 on-demand로, 끝나면 바로 destroy, 키·DB 덤프·이용 기록 업로드 금지.
6. 남은 확인: 한국어 실제 토큰 수(표본 1,000권), CPU 임베딩 처리량(PC에서 1,000권 시범), 공식 환율.
