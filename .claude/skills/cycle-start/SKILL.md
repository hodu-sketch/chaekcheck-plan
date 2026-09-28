---
name: cycle-start
description: Start a new chaekcheck planning cycle for one small feature slice. Reviews the previous cycle against the dev code, then fixes this cycle's scope in docs/cycles/NN-<slug>/scope.md.
argument-hint: "[slice, e.g. 도서 검색]"
disable-model-invocation: true
---

Start a cycle for the slice: $ARGUMENTS

## 1. Close the loop on the previous cycle (skip for the first cycle)

- Find the latest folder in `docs/cycles/`. If it has a `handoff.md` but no `retro.md`:
  - Read the dev code under `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev\backend` and `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev\web` and compare it with that cycle's `design-delta.md` and `docs/current/`.
  - If the dev project generated Spring Modulith `Documenter` output (PlantUML component diagrams and module canvases, by default under the build folder's `spring-modulith-docs`), compare it with the diagrams in `docs/current/` (`module-map.md`, `flows.md`) and list the differences.
  - Ask the user what changed during development and why.
  - Write `retro.md` (Korean): 계획대로 된 것 / 달라진 것과 이유 (the user's words, else [이유 미확인]) / 새로 알게 된 제약 / 다음 사이클 후보.
  - Update `docs/current/` so it matches the real code. Record structural differences as ADRs with `/adr`.
- If a previous cycle has no `handoff.md`, it is still open: ask whether to continue it instead.

## 2. Pick the slice

- If `$ARGUMENTS` is empty, pick up to 5 candidates from `docs/backlog.md` and the last `retro.md`, then ask the user to score each 1-5 on three questions. Do not score them yourself.
  - 영향 (Impact): 이 기능이 생기면 서비스가 얼마나 달라지나
  - 확신 (Confidence): 필요하다는 것과 만들 방법을 얼마나 확신하나
  - 노력 (Effort): 한 사이클에 얼마나 큰 일인가 (5 = 가장 큼)
- Show the table with ICE = 영향 × 확신 ÷ 노력, sorted by ICE, as a reference only. The user chooses; the highest score is not chosen automatically.

  | 후보 | 영향 | 확신 | 노력 | ICE (참고) |
  |---|---|---|---|---|
- A slice is one user-visible capability that can be built, tested and shown in one development pass. If it is larger, propose how to split it and let the user choose.

## 3. Write the scope

Create `docs/cycles/NN-<slug>/scope.md` (NN = next two-digit number, slug = short English kebab-case). Ask the user with AskUserQuestion for anything you would otherwise assume.

```markdown
# 사이클 NN: <slice>

## 목표 (한 문장)
## 포함
## 제외 (backlog.md로 보낸 항목)
## 완료 기준 (사용자가 화면에서 확인할 수 있는 것)
## 먼저 조사할 것 [확인 필요]
| 항목 | 확인 방법 |
|---|---|
| 예: 데이터 출처(공공 API 여부, 이용 조건, 호출 제한) | 공식 문서 확인, API 호출 시험 |

## 슬라이스 선택 기록
- ICE 표 (점수를 매긴 경우) / 고른 이유 (사용자 발언, 없으면 [이유 미확인])
## 영향 받을 모듈 [안]
```

## 4. Update pointers

- In `CLAUDE.md`, set the line `Current cycle: ...` to `Current cycle: docs/cycles/NN-<slug>`.
- Move the chosen items out of `docs/backlog.md` (keep a line "→ 사이클 NN").

Next step: `/feature-spec`.
