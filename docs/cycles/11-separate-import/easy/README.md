# 사이클 11 쉬운 설명 페이지

| 파일 | 설명 | 원본 | 남은 [안] |
|---|---|---|---|
| [2026-10-11-scope-decisions.html](2026-10-11-scope-decisions.html) | 지금 가져오기 구조와 41분·DB 크기, 힙 6GB와 묶음(실제 코드 `BookGrouping`), 줄이는 안 셋과 DB에서 묶기 장단점, 내 PC → 운영 반영 순서·조건·서버 크기, 정할 것 4가지 | `../scope.md`, dev `docs/plan-feedback.md` 사이클 08 | 없음 (#3·#4 승인, #2 미승인 → 힙 줄이기를 넣기로, #1은 뜻을 다시 물음) |
| [2026-10-11-heap-followup-decisions.html](2026-10-11-heap-followup-decisions.html) | 사이클 08 최종 숫자, 운영 쪽 시험 다시 묻기(같은 PC/진짜 서버), 묶는 방식 설정 current·compact·sql, 책마다 결과 비교, 측정 여섯 관점, 기본값 고르는 기준, A→B 순서 | `../scope.md` | 없음 (1-가·2·3·4·5·6 승인, 1-나 미승인) |
| [2026-10-12-spec-decisions.html](2026-10-12-spec-decisions.html) | 스펙 12가지: 번호 잇기 위치, 내 PC 바꿔 끼우기 시점, 두 DB 비교 값, 파일 형식, 반영 순서, 기록, 운영 역할 DB, sql 방식 범위, 동점 처리, 새 책 번호 순서, Java 옵션 측정, 검색 기준 | `../spec.md`, `../research.md` | 없음 (11개 승인, #10은 미승인 뒤 바꾼 제안 "순서도 같게, 번호까지 비교"로) |
| [2026-10-12-design-decisions.html](2026-10-12-design-decisions.html) | 설계 12가지: 원래 목적(가져오기 최적화) 답, 파일 안 작은 표, 표 구조 비교, 모드 설정, pg 도구 부르기, CatalogLoad, 기다리는 새 표 막기, 기록 줄, 설정 자리, compact 열쇠, sql 임시 표, 비교 도구, 반영 메모리 | `../architect-proposal.md` | 없음 (12개 승인, #1·#3·#5·#12는 질문에 답한 뒤) |
| [2026-10-12-grouping-rules-timing.html](2026-10-12-grouping-rules-timing.html) | 책 묶기 기준 다시 보기를 사이클 11에 넣을지: 부딪히는 곳, 알려진 문제 다섯, 사이클 12 + 미리 표본 조사 | `../../../research/ebook-catalog/same-book-isbn.md` 5절 | 없음 (2개 승인, 2026-10-12) |
| [2026-10-12-gap-check.html](2026-10-12-gap-check.html) | 놓친 작업 점검: 단계별 상태, 09·10과 부딪힘 없음, 지우기 명령(08 회고), 새 사본 시험, 현재 사이클 표시, 범위·스펙 정리 | `../scope.md`, `../spec.md`, 08·09 회고 | 없음 (5개 승인, #2는 질문에 답한 뒤) |
| [2026-10-12-adr-drafts.html](2026-10-12-adr-drafts.html) | ADR 초안 2개: 0078 가져오기는 내 PC·운영엔 파일 하나로, 0079 묶는 방식 셋·결과 번호까지 같음 | `../adr-draft-0078.md`, `../adr-draft-0079.md` | 없음 (2개 승인, Accepted로 씀) |
| [design-delta-original.html](design-delta-original.html) | design-delta.md 원문, 그림 7개(모듈 구성도, 내보내기·반영·마저 흐름, 상태, 도메인 모델, 표) | `../design-delta.md` | 설명 |
| [2026-10-12-design-delta.html](2026-10-12-design-delta.html) | 설계 문서 한 장 요약: 만드는 것, 운영자 순서, 먼저 시험할 것, 다음 단계(인계서는 사이클 10 뒤) | `../design-delta.md` | 없음 (2개 승인) |
| [2026-10-12-review-decisions.html](2026-10-12-review-decisions.html) | 설계 검토 결과: finish 실패 처리, 번호 비교는 바깥 스크립트, 바로 고친 것 8 | `../design-delta.md` | 없음 (2개 승인, #1은 질문에 답한 뒤) |
| [2026-10-12-handoff-review.html](2026-10-12-handoff-review.html) | 인계서 초안 검토: 12단계 순서, finish 색인 메모리, 옛 사본 범위, 넘기기(바꿔 넣기는 사이클 10 뒤) | `../handoff.md` | 없음 (3개 승인) |
| [2026-10-12-close-check.html](2026-10-12-close-check.html) | 마무리 점검: 스킬 여덟 개 단계 대조(사이클 10 회고·사이클 11), 고친 것 넷, flow.md 확정, 커밋·푸시 | 스킬 `.claude/skills/*` | 없음 (2개 승인) |
