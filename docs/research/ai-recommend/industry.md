# 추천 시스템: 실제 서비스는 어떻게 하나

- 조사 2026-10-17. 사이클 밖 조사입니다. 모듈·표·API 설계는 하지 않습니다. 종합과 우리 서비스 안은 [overview.md](overview.md).
- 계기: 사용자 "실제 업체들에서는 어떻게 맞춤 알고리즘을 내주는지도 조사해서" (2026-10-17)
- 태그: [확정] = 회사 공식 블로그·논문·공식 문서·도움말에서 직접 읽음, [확인 못 함] = 2차 보도·검색 요약만, [추론] = 이 조사에서 추정. URL은 모두 2026-10-17 확인 (조사 에이전트가 원문을 연 보고를 옮김).

## 1. 큰 서비스가 실제로 하는 것

| 서비스 | 후보 뽑기 | 순위 | 처음 온 사람·비로그인 | LLM | 근거 |
|---|---|---|---|---|---|
| Netflix | 줄(row) 단위 후보: 장르 줄, Top-N, 인기·급상승, "Because You Watched" = **비개인화 "sims"(영상-영상 유사 목록)를 카탈로그의 모든 영상에 대해 미리 계산** [확정] | 어느 줄을 올릴지·줄 안의 부분집합은 개인화, 페이지는 줄별 점수 + 다양성 [확정] | 가입 때 "좋아하는 작품 고르기" 설문, 건너뛰면 "다양하고 인기 있는" 작품. 나이·성별은 쓰지 않음 [확정] | 2025 행동 시퀀스 파운데이션 모델, 2026 GenRec = LLM 순위 모델(설명문 생성은 논문 범위 아님) [확정] | Gomez-Uribe & Hunt, ACM TMIS 2015 https://gwern.net/doc/reinforcement-learning/exploration/2015-gomezuribe.pdf ; Alvino & Basilico 2015 https://gwern.net/doc/www/netflixtechblog.com/2f5717e8bbdc98d2caf5c7a972359fbb7e7c0b28.html ; 도움말 https://help.netflix.com/en/node/100639 ; GenRec https://arxiv.org/abs/2608.10257 |
| Spotify | Discover Weekly: 협업 필터링 + NLP + 오디오 모델 [확인 못 함: 2차 자료] | 2025 발표: 사용자 벡터 + 카탈로그 임베딩을 "semantic ID" 토큰으로 압축해 오픈웨이트 LLM이 다음 항목을 생성 [확인 못 함: 발표 요약] | — | AI DJ: 곡 선택은 기존 추천, **해설 문구는 음악 에디터가 생성형 AI 도구로 작성·확장** (OpenAI 기반). AI 생성 표시 여부는 공식 글에 없음 [확정] | https://newsroom.spotify.com/2023-02-22/spotify-debuts-a-new-ai-dj-right-in-your-pocket/ ; https://ai.engineer/talks/personalization-in-the-era-of-llms |
| YouTube | 수백만 영상 중 후보 수백 개: 시청 ID·검색어·인구통계 임베딩 → DNN → 근사 최근접 검색 [확정] | 별도 순위 DNN [확정] | 지역·기기·성별·**로그인 여부**·나이를 입력, 신규 사용자용 사전 분포. 신작 편향 보정 [확정] | 없음(2016) | Covington et al. 2016 https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/ |
| Amazon | item-to-item 협업 필터링: **"함께 산 상품" 표를 오프라인으로 전 상품에 대해 계산**, 온라인은 사용자의 구매·평가 항목마다 유사 항목을 꺼내 합침 [확정] | 유사도 = "A를 산 사람이 B를 살 확률이 평균 고객보다 얼마나 높은가"(베스트셀러 편향 회피) [확정] | "아는 게 없으면 가장 인기 있는 것을 추천" [확정] | Rufus(2026-05 "Alexa for Shopping"): Bedrock 위 Claude Sonnet·Nova·자체 LLM, 열람·장바구니 이력, RAG. AI 생성 표시 언급 없음 [확정] | 2003 논문 https://www.cs.umd.edu/~samir/498/Amazon-Recommendations.pdf ; https://www.amazon.science/the-history-of-amazons-recommendation-algorithm ; https://www.aboutamazon.com/news/retail/amazon-rufus-ai-assistant-personalized-shopping-features |
| Goodreads | "같은 책장에 함께 꽂히는 빈도 + 같은 사람이 즐겼는가"로 책-책 관계, 200억 데이터 포인트 [확정] | 비공개 | 신규 사용자에게 "최소 20권 평가" 요구 [확정] | 공개 정보 없음 | https://www.goodreads.com/blog/show/303-announcing-goodreads-personalized-recommendations |

공통점 [추론]
1. **두 단계**(후보 뽑기 → 순위)는 YouTube·Netflix·Google 교재 모두 명시 [확정].
2. **항목-항목 유사도**(Netflix sims, Amazon similar-items, Goodreads 책장 공출현)는 **비개인화로, 오프라인에서 전 항목에 대해 미리 계산**. 개인화는 "어느 항목을 앵커로 쓰고 어느 줄을 보여줄지"에서 생김.
3. 데이터가 없을 때는 인기 + 처음 설문.
4. LLM은 **곡·책 선택이 아니라 설명문**(Spotify DJ, 에디터 감수)이나 대화형 질의(Rufus)에 먼저 쓰였고, 순위 자체에 쓰는 것은 2025~26년 Netflix·Spotify 수준의 투자에서만.

## 2. 국내 도서 서비스

| 서비스 | 확인된 추천 기능 | 쓰는 신호 | 비로그인 노출 | AI 문구 표시 | 태그·근거 |
|---|---|---|---|---|---|
| 알라딘 | 상품 페이지 3개를 비로그인으로 열었으나 "함께 구매한"·"맞춤추천" 칸이 정적 HTML에 없음(동적 로딩 추정). 보이는 것: "이 책을 읽고 싶은 사람", "이 분야 N위" | 확인 불가 | 확인 불가 | 없음 | [확인 못 함] https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=331614797 |
| 교보문고 | 큐봇(2024-01, "행동 패턴을 학습해 실시간 추천", PICKS 개인화 모델의 대화형 고도화), 트렌드 플러스(2026-03), AI 책봇 시범. 전자책 상품 페이지 비로그인: "이 상품의 총서", 인기검색어만 | 행동 패턴(세부 비공개) | 추천 칸 미확인 | 미확인 | [확인 못 함: fnnews 2024-01-29 https://www.fnnews.com/news/202401291023370308 ; 중앙일보 2026-04-16 https://v.daum.net/v/20260416000336879] |
| YES24 | 크레마 AI(대화형: 상황 입력 → "축적된 도서 데이터와 구매 데이터" 기반 제안). 상품 페이지 비로그인: "이 분야 베스트셀러", "이 분야 신상품", "최근 본 상품", 팝업 "AI와 대화하며 도서를 추천받아 보시겠어요?" | 구매 데이터 + 대화 | 분야 베스트·신상품 + AI 대화 진입 버튼 [확정: 페이지 직접 확인] | 진입점 이름("AI와 대화")으로만 | https://www.yes24.com/Product/Goods/146296001 |
| 밀리의서재 | 앱 설명: "데이터를 기반으로 나에게 딱 맞는 책을 추천", "완독할 확률 분석"(완독지수), "완독률 및 시간을 바탕으로 취향 파악", "검색하면 AI가 키워드를 정리해 어울리는 책을 추천". AI 독파밍(책 내용 Q&A, 약 2,700권) | 완독률·독서 시간 | 구독 앱이라 해당 없음 | 미확인 | [확정: App Store 공식 설명] https://apps.apple.com/kr/app/id1213788923 |
| 리디 | 기술 블로그: 2022 딥러닝 전환, 2023 Feature Store(웹툰·웹소설 중심) | 열람·구매 이력(추정) | 미확인 | 미확인 | [확인 못 함: 본문 403] https://ridicorp.com/?p=9271 |
| 왓챠피디아 | "취향분석"은 로그인 페이지로 연결 | 별점 | 비로그인에는 평균 별점만 | 없음 | [확정: 홈 직접 확인] https://pedia.watcha.com/ko/ |
| 국립중앙도서관 | 사서추천도서 = 사서가 격월·분야별 선정, Open API `saseoApi.do`. AI 추천 없음 | 사서 큐레이션 | 공개 API | 해당 없음 | [확정] https://www.nl.go.kr/NL/contents/N31101030900.do |
| 도서관 정보나루 | `recommandList`(`isbn13`, `type=mania`/`reader`, 최대 200건, "대출정보를 기반으로 분석"), `usageAnalysisList`(서지·대출·키워드·**함께 대출된 도서**), `loanItemSrch`(인기대출, 성별·연령·지역·KDC), `hotTrend`, `keywordList`. 알고리즘 설명 없음 | 공공도서관 대출 이력 | 공개 API(키 필요) | 해당 없음 | [확정] https://www.data4library.kr/apiUtilization |
| 독서로(교육부·KERIS) | 2024-04 개통, "빅데이터 기반 맞춤형 도서 추천" 목표, 2026-07 "AI 기반 도서 검색" 계획 | 학생 독서활동 기록 | 학생 로그인 전제 | — | [확인 못 함: 보도] https://dhnews.co.kr/news/view/1065590991790530 |

요약 [추론]: 국내 서점은 알고리즘을 공개하지 않음. 2025~26년 흐름은 "추천 모델 교체"가 아니라 **"대화형 AI 진입점 추가"**(교보 큐봇·책봇, YES24 크레마 AI, 밀리 AI 독파밍). AI가 쓴 문구에 따로 표시를 붙인 사례는 확인되지 않았고, 진입점 이름("AI와 대화")으로만 드러냄. 비로그인에 보이는 것은 분야 베스트·신간·인기검색어 수준.

정보나루는 사이클 10에서 인기 도서 출처로는 쓰지 않기로 함 [확정] (사용자, 2026-10-12: 아동 도서가 너무 많음, `docs/research/popular-books/alternatives.md`). "함께 대출된 도서"(`usageAnalysisList`)를 유사 책 출처로 쓰는 것은 다른 용도라 따로 판단 [확인 필요: 사용자에게 질문].

## 3. 작은 서버에서 쓸 수 있는 방식

| 방식 | 내용 | 책첵 적합성 [추론] | 근거 |
|---|---|---|---|
| 항목-항목 공출현 | 세션·사용자 단위로 함께 본·함께 대출된 쌍을 세고 인기 보정(Amazon식), 전 항목 유사 목록을 배치로 생성 | 가장 단순, SQL만으로 가능. 정보나루 "함께 대출된 도서"로 자체 기록이 없어도 시작 가능 | Linden 2003 [확정] |
| implicit (Python) | ALS·BPR·항목 최근접, 입력은 사용자×항목 희소 행렬, `similar_items()` | 배치 전용 Python 잡으로 Spring 밖에서 돌리고 결과 표만 적재 | [확정] https://github.com/benfred/implicit |
| LightFM | 메타데이터 피처를 섞는 하이브리드 MF, 콜드스타트에 좋음. 문서 저작권 2016, 유지보수 상태 미기재 | 유지보수 불명 | [확정] https://making.lyst.com/lightfm/docs/home.html |
| Gorse (Go) | master/worker/server 데몬 3종 + Redis/PG 캐시, 메모리 수치 미공개 | 4GB 서버에 부담 | [확정] https://github.com/gorse-io/gorse |
| pgvector + 임베딩 | HNSW: "그래프가 `maintenance_work_mem`에 들어가야 빌드가 빠름", 크기를 줄이려면 `halfvec`·이진 양자화 | 68만 × 1024차원 = 약 2.79GB(원본), 인덱스는 보통 그만큼 더 → 4GB 서버에서 온라인 벡터 검색은 무리. 유사도는 오프라인에서 계산해 "책당 상위 N" 표만 저장 (자세히 [infra-cost.md](infra-cost.md) 4절) | [확정] https://github.com/pgvector/pgvector |
| LLM을 추천기로 쓰는 연구 | P5, TALLRec, LLMRec, 서베이 | 소규모 운영에는 "후보는 전통 방식, LLM은 재정렬·설명·대화 해석" 조합이 현실적 | [확정] https://arxiv.org/abs/2203.13366 , https://arxiv.org/abs/2305.00447 , https://arxiv.org/abs/2311.00423 , https://arxiv.org/abs/2305.19860 |
| LLM 한계 | **존재하지 않는 항목 환각**(대부분 5% 미만이나 일부 모델 23%), 후보 순서 편향, 인기 편향, 긴 이력 처리 약함. 제로샷 LLM 순위기는 "다른 후보 생성기에서 받은 후보"를 조건부로 순위 매길 때 유망 | LLM에 "카탈로그에 있는 책만 고르게" 하려면 반드시 후보 목록을 넣고 ID로 답하게 해야 함 | [확정] https://arxiv.org/abs/2411.00331 , https://arxiv.org/abs/2305.08845 |

## 4. 평가와 콜드스타트 기본

- 단계 정의 [확정]: Google 추천 시스템 교재 — 후보 생성(수십억 → 수백·수천) → 점수(정밀 모델) → 재정렬(싫어한 항목 제거, 신선도·다양성). https://developers.google.com/machine-learning/recommendation/overview/types
- 콜드스타트 [확정]: 학습에 없던 항목은 임베딩이 없음 → 같은 범주 항목 임베딩 평균, 또는 사용자·항목 피처를 행렬에 붙이기. https://developers.google.com/machine-learning/recommendation/collaborative/summary
- 콘텐츠 기반 vs 협업 [확정]: 콘텐츠 기반은 "다른 사용자 데이터 불필요, 틈새 취향 가능"이지만 "관심을 넓히기 어려움". https://developers.google.com/machine-learning/recommendation/content-based/summary
- 정확도 외 지표 [확정]: Kaminskas & Bridge 2016 (DOI 10.1145/2926720) — 다양성·세렌디피티·신규성·커버리지. Netflix 2015는 Recall@m-by-n, NDCG, MRR [확정].
- 데이터 적을 때 시작 순서 [확정 근거 조합]: "아무것도 모르면 가장 인기 있는 것"(Amazon), 신규 회원 = 다양한 인기작 + 설문(Netflix), 20권 평가(Goodreads), 인구통계 사전 분포(YouTube). 즉 **인기 → 콘텐츠(메타데이터) → 기록이 쌓이면 협업**.

## 5. 비로그인 개인화

- 세션 기반 추천 [확정]: GRU4Rec(Hidasi 2015) — "긴 이력이 없는 사이트는 실무가 item-to-item으로 회귀"하므로 세션을 RNN으로 모델링. SR-GNN(AAAI-19) — 익명 세션을 그래프로. https://arxiv.org/abs/1511.06939 , https://arxiv.org/abs/1811.00855
- 실무 함의 [추론]: 작은 서비스는 "세션 안 마지막 1~3권의 item-to-item 유사 목록 합치기"로 근사해도 GRU4Rec 논문이 비교 기준으로 쓴 수준은 됨.
- 익명 식별자 [확정]: Google Analytics 4는 `_ga` 쿠키로 사용자를 구분, 기본 만료 2년(Chrome 최대 400일, Safari 7일). https://support.google.com/analytics/answer/11397207 . YouTube 논문은 "로그인 여부"를 피처로 넣어 비로그인도 같은 모델로 처리 [확정].

## 확인 못 한 것

알라딘·교보·네이버 상품 페이지의 실제 추천 칸(동적 로딩·접근 차단), Spotify·리디 블로그 본문(403), Amazon 쿠키 고지(503), 독서로 공식 페이지(접속 실패).
