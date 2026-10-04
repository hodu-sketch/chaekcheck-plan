---
name: adr
description: Record a chaekcheck planning or design decision as an ADR in docs/adr/NNNN-<slug>.md and keep the docs/adr/README.md index current. Use whenever the user makes a choice between alternatives, asks why something was chosen, or when an accepted decision must be replaced or retired.
argument-hint: "[decision title]"
---

Record the decision: $ARGUMENTS

## Writing a new ADR

1. Number: next four-digit number in `docs/adr/`. File: `docs/adr/NNNN-<english-kebab-slug>.md`.
2. Draft the ADR from the template below and **show the draft to the user first**. Write the file only after the user approves the draft. If the user declines, discard it.
   - Show the draft in the canvas (user, 2026-10-04): when `ecc-plan-canvas` is installed, write a plain-language decision page for the draft as the `plan-canvas` skill describes ("Plain-language decision page": what was decided, the alternatives with their costs, the evidence with sources, and a diagram of what the decision changes), with the decision itself as one `[안]` chip, and review it there. 승인 = the draft is approved and may be written. If the canvas is unavailable or the user is on another device, show the draft in the conversation instead.
3. New ADRs start as `Status: Proposed`. Change to `Status: Accepted` only after the user confirms the decision itself.
4. Add a row to the index `docs/adr/README.md`, and update the row whenever the status changes.
5. Link the ADR from the current cycle's `design-delta.md` 결정 기록 section.

## Content rules

- 이유: quote only what the user said in this conversation. If the user gave no reason, write `[이유 미확인]`. Never write a reason the user did not give.
- Every rejected alternative gets its own 채택하지 않은 이유. Use the user's words; if they only chose without saying why, write `[이유 미확인]`.
- Record significant choices only (module boundaries, data ownership, external data sources, API style, events vs calls). Naming and formatting choices do not need an ADR.
- A past decision recorded late keeps its original date and says so in 배경.

## Status lifecycle

`Proposed → Accepted → Superseded by NNNN | Deprecated`

- **Superseded**: a new ADR replaces it. Write the new ADR with `Supersedes: NNNN`, then change only the old file's status line to `Status: Superseded by NNNN`.
- **Deprecated**: the decision no longer applies and nothing replaces it (for example, the feature was removed). Change only the status line to `Status: Deprecated`.
- An Accepted ADR is otherwise never edited. A hook blocks any other change.

## Answering "why did we choose X?"

Read `docs/adr/README.md`, open the matching ADRs, and answer from their 배경, 결정 and 이유. If none matches, say so and offer to record one.

## Template (Korean; keep the `Status:` line in English at line start)

```markdown
# ADR-NNNN: <결정 제목>

Status: Proposed
Date: YYYY-MM-DD
Cycle: NN-<slug>
Supersedes: 없음

## 배경
(2-5문장: 무엇 때문에 결정이 필요했는가, 제약)

## 결정
(1-3문장)

## 이유 (사용자 발언)
- "<사용자가 한 말>" 또는 [이유 미확인]

## 검토한 대안
### A안: <이름> (채택)
- 장점 / 단점
### B안: <이름>
- 장점 / 단점
- 채택하지 않은 이유: "<사용자가 한 말>" 또는 [이유 미확인]

## 결과
- 좋아지는 점
- 감수하는 점
- 나중에 되돌리거나 서비스로 분리할 때의 비용
```
