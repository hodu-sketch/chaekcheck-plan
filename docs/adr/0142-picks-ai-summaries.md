# ADR-0142: 추천목록 책 창의 AI 요약 — 빌드에 싣는 `ai-summaries.tsv`, 카카오 소개 입력

Status: Accepted (사후 기록)
Date: 2026-10-23
Cycle: 22-first-screen-usability 회고 (dev가 계획 밖에서 만든 것을 기록만 함)
Supersedes: 없음

## 배경

사이클 22는 "웹만"(AC-18)이었지만, 사용자가 운영 화면을 보며 dev에서 직접 고치는 동안(v1.2.0~v1.9.10, 2026-10-19~24) 아래 변경이 들어갔다. plan을 거치지 않았으므로 사이클 22 회고(`docs/cycles/22-first-screen-usability/retro.md`)에서 dev main `d3c2696`을 읽고 사실대로 적는다(사용자 2026-10-23 "전부 지금 맞춤"). 값은 모두 [확정] (dev 구현 확인, 2026-10-23).

## 결정 (구현된 것)

1. 리소스 `backend/src/main/resources/picks/ai-summaries.tsv`(칸 `list, isbn13, title, summary`, 약 2,804줄: KAIST 2,453, 노벨 100, 나머지 사서·이동진·서울대). 빌드에 실림 → 새 책은 다시 쓰고 배포해야 나옴
2. `picks.internal.cache.AiSummaries`가 ① ISBN ② `list + 제목` 순서로 찾음. `GET /api/v1/picks/{listKey}`와 `GET /api/v1/picks/shelf`의 책마다 `aiSummary`(없으면 null)
3. 화면: 추천도서 책 창(`PicksBookDialog.tsx`)에 「AI 요약 ⓘ」와 한두 문장. ⓘ: "AI가 책 정보를 바탕으로 쓴 짧은 요약이에요. 실제 내용과 다를 수 있어요." 모델 이름은 표시하지 않음
4. 만든 방법(dev `docs/maintenance/4-picks.md` 8절): dev 세션의 Haiku 하위 에이전트. 1차(10-19) 입력은 서지만, 2차(10-20) 카카오 책 검색 API `contents`(출판사 소개 앞부분, KAIST는 160자로 자름)를 더함. 소개 글은 PC 임시 폴더에만. 해요체 한두 문장 40~80자, 칭찬·결말·AI 언급 없음, 모르면 쓰지 않음. 검토는 dev 세션 Claude가 함(사서·이동진·서울대·노벨은 모든 줄, KAIST 2,453권은 자동 검사만). 사용자 본인 검토 기록 없음

## 이유 (사용자 발언, dev 기록)

- "너 하이쿠 모델 써서 추천도서의 모든 책들 ai 추천 요약글 한두줄만 다 써줄래? 물론 짧게 ai가 요약한거라고 어디에 누르면 알려주게 하고", "B안으로 하고 하이쿠라고 알려주지는 마" (2026-10-19)
- "다 나오도록 해 하이쿠로 쓰고", "내용 이상하지 않나 다 검증하고" (2026-10-20)

## 결과

- KAIST 탭 응답이 약 1.1MB(gzip 전)
- 사이클 23 「나에게 맞는 책」 탭의 추천 글은 이 요약과 **별개** (사용자 2026-10-23 "지금 이미 있는 소개글과는 별개야")
- 카카오 썸네일은 저장 제약으로 표지에서 뺐는데(`docs/reference-index.md` 4-1절 표지), 요약 입력에는 카카오 `contents`를 씀 [확인 필요: 카카오 약관]
- 응답 크기, 매달 새 사서추천 책 갱신 절차(dev 질문 #7·#8) — `docs/backlog.md`
