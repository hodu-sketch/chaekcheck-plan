# chaekcheck-plan 문서 지도 (먼저 읽을 것)

책첵의 기획·설계 문서 저장소입니다. 코드는 없고(코드는 `chaekcheck-dev`), 사이클마다 명세 → 화면 흐름 → 설계 → 결정 기록(ADR) → 인계서를 씁니다. 처음 보는 사람이나 다른 AI 세션은 아래 표에서 목적에 맞는 곳부터 엽니다.

## 목적별 입구

| 하려는 것 | 먼저 열 곳 | 그다음 |
|---|---|---|
| 지금 설계 전체(모듈·표·API·흐름) | [current/](current/) — `module-map.md`, `data-model.md`, `api.md`, `flows.md` | "설계됨(미구현)" 표시는 아직 dev에 없는 것 |
| 지금 dev가 만드는 것 | [cycles/README.md](cycles/README.md) (사이클 순서와 상태) | 각 사이클 폴더 `handoff.md` |
| 왜 이렇게 정했나 | [adr/README.md](adr/README.md) (ADR 165건 목록) | ADR 본문의 "이유(사용자 발언)"와 "검토한 대안" |
| 숫자(시간·크기·동시 수)의 근거 | [settings-index.md](settings-index.md) | dev `docs/maintenance/settings-index.md` |
| 수집·도서관 분류·책 묶기 다시 하기 | [reference-index.md](reference-index.md) | `research/` 해당 폴더 |
| 아직 사이클에 안 들어간 생각 | [backlog.md](backlog.md) | |

## 폴더

| 폴더 | 무엇 | 크기 감 |
|---|---|---|
| `cycles/NN-slug/` | 사이클 하나의 `scope`·`spec`·`flow`·`design-delta`·`handoff`·`retro`, `easy/`(결정 페이지) | 27개 |
| `current/` | 지금 설계의 합본(사이클이 끝날 때 합침). `handoff.md`는 dev `CLAUDE.md`가 불러오는 인계서 자리 | |
| `adr/` | 결정 기록 `NNNN-slug.md` + `README.md` 목록 | 0001~0171 |
| `research/<주제>/` | 사이클 밖에서 한 조사(데이터 출처, 수집 방법, 배포, AI 추천 등). 설계는 넣지 않음 | 17주제 |
| `easy/` | 사이클 밖 결정 페이지 몇 개(2026-10-12, 10-17) | |

## 규칙 (요약, 원문은 저장소 맨 위 `CLAUDE.md`·`.claude/rules/`)

- 문서는 한국어, 식별자(모듈·표·칸·API 이름)만 영어
- 모든 값에 태그: `[확정]`(사용자 확인 또는 공식 출처) / `[안]`(제안) / `[확인 필요]`(모름, 확인 방법 함께)
- 이유는 사용자 말 그대로만, 없으면 `[이유 미확인]`
- plan은 dev 저장소에 쓰지 않음 — dev에 바꿀 일은 인계서나 `to-dev-*.md`로
