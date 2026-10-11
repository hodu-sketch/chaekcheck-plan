# 사이클 08 쉬운 설명 페이지

| 파일 | 설명 | 원본 | 남은 [안] |
|---|---|---|---|
| [2026-10-06-memory-explained.html](2026-10-06-memory-explained.html) | 메모리를 쓰는 곳 셋(DB, 캐시, Java), 공식 문서 안내, 최적점 찾는 순서, 모르는 것 | `../research.md` | 없음 (설명) |
| [2026-10-06-memory-structure-options.html](2026-10-06-memory-structure-options.html) | 메모리 구조 바꾸는 안: 도서관 목록 읽기, 책 화면 소장 읽기, 캐시, 응답 복사, 재는 도구·설정, 작은 항목, 소장 번호 빈틈 | `../architect-proposal.md` | 설명 (결정은 나중에 canvas) |
| [2026-10-06-import-time-options.html](2026-10-06-import-time-options.html) | 가져오기·교체 시간 줄이는 여덟 방향(A 바꿔 끼우기 ~ H 다른 DB)의 장단점, 비교표, 묶음 안 셋(추천 2번: A+D+E) | `../research.md` 10절 | 설명 (결정은 나중에 canvas) |
| [2026-10-06-cycle08-decisions.html](2026-10-06-cycle08-decisions.html) | 사이클 08에서 정할 것 21개: 가져오기 묶음·번호·옛 표, 메모리 구조·재는 법·기준, 다듬기·화면 질문 | `../spec.md`, `../flow.md`, `../research.md`, `../architect-proposal.md` | 보류: 단계를 합친 페이지라 닫음. 스펙·화면은 단계별 페이지로, 1~10·21번은 설계 단계에서 다시 (2026-10-06) |
| [2026-10-06-spec-decisions.html](2026-10-06-spec-decisions.html) | 사이클 08 스펙 검토: 검색 조건 기억, 429·503, YES24 안내, 이름·고친 시각·수집 기간, 가져오기 기준, 메모리 기준, 상태·비목표 | `../spec.md` | 없음. 12개 승인(4번 "이름 자체 검증도"), 질문 둘 답(GIN과 붙여 저장, 다른 서비스의 요청 제한·IP), 2026-10-06 |
| [2026-10-06-flow-decisions.html](2026-10-06-flow-decisions.html) | 사이클 08 화면 흐름: S1 안내 줄·YES24 폰 안내·상태 칸 색, 폰 정렬 자리, 폰 설정 창, S8·S9 돌아가기, 이름, 글꼴. PC·태블릿·폰 그림 | `../flow.md` | 없음. 10개 결정(승인 7, 6번 써 본 뒤 되돌릴 수 있게, 7번 사용자 제안 돌아가기·바로 저장 안내, 2번 원래대로), 2026-10-06 |
| [2026-10-06-why-cluster-and-rate-limit.html](2026-10-06-why-cluster-and-rate-limit.html) | 질문 둘 그림 풀이: 제목 색인과 같은 책 줄 붙여 저장의 차이(쪽 단위 읽기, 측정·계산 막대), 요청 제한(새는 양동이, 429·Retry-After, GitHub 비교, 실제 IP) | `db-memory.md`, `../research.md`, 공식 문서 | 설명 |
| [2026-10-06-design-decisions.html](2026-10-06-design-decisions.html) | 사이클 08 설계 결정 15개: 가져오기 방식·측정·소장 번호·옛 표, 메모리 구조(계획 읽기, 소장 읽기, 캐시, 재는 도구, 설정 자리, 본문 복사), 작은 구조 항목 | `../architect-proposal.md`, `../research.md` | 없음. 15개 결정(승인 14, 10번 미승인 "비효율적이고 고칠 수 있으면 지금 고치는게 나아", 13번 "나" 방법), 2026-10-11 |
| [2026-10-06-design-decisions-remote.html](2026-10-06-design-decisions-remote.html) | 위 설계 결정 페이지의 원격용 사본: 맨 위에 대화로 답하는 법(`전부 승인` / `#N 미승인: 이유` / `#N 기타: 내용`) | `2026-10-06-design-decisions.html` | 원본과 같음 (15개 열림) |
| [2026-10-10-kyobo-rental-exclude.html](2026-10-10-kyobo-rental-exclude.html) | 교보 대여·혼합 빼기: 범위(230곳만), 서비스에 들어간 11곳 끄기, 수집 중단·받지 않음 표시, seed 규칙 | `docs/research/ebook-catalog/collection-by-vendor-2026-10-09.md` | 없음. 4개 승인(2번 "그냥 DB에서 삭제"), 2026-10-10 |
| [2026-10-11-adr-drafts.html](2026-10-11-adr-drafts.html) | 결정 기록 초안 넷: ADR-0065(가져오기 새 표·바꿔 끼우기), 0066(메모리 줄이는 구조), 0067(교보 대여·혼합 제외), 0068(고친 시각은 DB 트리거) | 설계 결정 페이지 | 없음. 4개 승인 → `docs/adr/0065`~`0068` (2026-10-11) |
| [2026-10-11-design-delta.html](2026-10-11-design-delta.html) | 사이클 08 설계 그림(모듈, 가져오기 흐름, 계획·소장 읽기, 막혔을 때, 표 칸) + 남은 제안 넷과 다음 단계로 | `../design-delta.md` | 없음. 5개 승인, 질문 다섯 답(DB 상세, isbn13, 판 표시, 정리 규칙 → 후속 페이지), 2026-10-11 |
| [design-delta-original.html](design-delta-original.html) | design-delta.md 원본 (그림 6개 렌더링) | `../design-delta.md` | — |
| [2026-10-11-normalize-rule-change.html](2026-10-11-normalize-rule-change.html) | 정리 규칙을 바꿀 때 순서(판 번호 올리고 같은 사본으로 다시 가져옴) | ADR-0031·0062·0065 | 없음. 사용자 제안 "이렇게 해줘"(상황별 할 일 표)로 정함, 판 번호 없이 국가서지는 원문으로, 2026-10-11 |
| [2026-10-11-adr-0069.html](2026-10-11-adr-0069.html) | ADR-0069 초안: 국가서지는 원문을 남기고, 정리 규칙을 바꿀 때 상황별로 다시 가져옴 (ADR-0065 일부를 바꿈) | `2026-10-11-normalize-rule-change.html` | 없음. 승인 → `docs/adr/0069` (2026-10-11) |
| [2026-10-11-design-review-decisions.html](2026-10-11-design-review-decisions.html) | 사이클 마무리: 설계 검토(design-reviewer)에서 찾은 문제와 고칠 방법 10가지 | scope·spec·flow·design-delta, ADR-0065~0069 | 1~6·8~10 승인, 7번은 이어서 holding-id-followup |
| [2026-10-11-holding-id-followup.html](2026-10-11-holding-id-followup.html) | 설계 검토 7번 이어서: 옛 소장 번호 요청을 살리는 방법(번호 맞춤 표 vs 소장 번호 이어 쓰기) | 설계 검토 7번, ADR-0065 | 나안 승인 (조건: 사라진 책에 맞는 메시지), 2026-10-11 |
| [2026-10-11-holding-gone-message.html](2026-10-11-holding-gone-message.html) | 소장 번호 이어 쓰기 뒤: 책·소장이 사라졌을 때 보일 말 2가지 + ADR-0070 초안 | holding-id-followup (승인) | 3개 모두 승인 → ADR-0070 (2026-10-11) |
| [2026-10-11-handoff-decisions.html](2026-10-11-handoff-decisions.html) | 인계서: 만드는 순서 13단계, 도중에 여쭐 것, 정할 것 3가지 | `../handoff.md` | 3개 모두 승인 (2026-10-11) |
| [2026-10-11-commit.html](2026-10-11-commit.html) | 사이클 08 넘김 뒤 커밋할 목록과 메시지 | `git status` | 승인 (push도), 2026-10-11 |
| [2026-10-11-midpoint-decisions.html](2026-10-11-midpoint-decisions.html) | dev 중간 요약으로 미리 정할 것: 결과 같은 변경 받아들임, 실패 기록 칸, 가운뎃점 무시, 배포 뒤 seed 고치는 방식, 977 이름, 운영 메모리 다시 재기 | `../dev-midpoint-2026-10-11.md` | 없음. 6개 모두 승인 (2026-10-11) |
| [2026-10-11-final-decisions.html](2026-10-11-final-decisions.html) | dev 최종 요약의 "plan이 정할 것": 바텀 시트, 이름 바뀐 학교 6곳을 사이클 09에, 힙 여유·사이트 이름 재확인·가져오기 힙은 나중에 | dev `docs/plan-feedback.md` 사이클 08 요약 5절 | 없음. 바텀 시트 유지, 6곳 사이클 09에, 셋은 backlog (2026-10-11) |
| [2026-10-11-last-measure-decisions.html](2026-10-11-last-measure-decisions.html) | 마지막 측정 결과, 빈 catalog_next가 남는 경우 받아들일지, 가져오기 메모리와 DB 상한 제약을 사이클 11·배포로 | dev `plan-feedback.md` #3·#3c 덧붙임 | 없음. 1번은 다른 선택(지우는 명령 따로), 2번 승인 (2026-10-11) |
