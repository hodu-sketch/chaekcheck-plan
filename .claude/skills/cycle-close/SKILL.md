---
name: cycle-close
description: Close the current chaekcheck cycle - review the documents, merge the design delta into docs/current, and write the dev handoff that the dev project imports.
disable-model-invocation: true
---

Close the current cycle (see `Current cycle:` in `CLAUDE.md`).

## 1. Check completeness

`scope.md`, `spec.md`, `flow.md`, `design-delta.md` must exist and every ADR it lists must be Accepted. Otherwise say what is missing and stop.

## 2. Review

Delegate to the `design-reviewer` subagent with the cycle folder. Show the findings to the user, fix the 반드시 고칠 것 items with the user, and ask whether to fix the rest.

## 3. Merge into docs/current

Apply `design-delta.md` to `docs/current/module-map.md`, `data-model.md` and `api.md`. Merge its `구조 그림` too: the module diagram and domain model into `module-map.md`, the sequence diagrams into `docs/current/flows.md` (create it if missing), so `docs/current/` always shows the whole current structure. These files describe the whole current design; keep them as current-state descriptions, not change logs. Mark items as "설계됨(미구현)" until the next `/cycle-start` confirms them against the code.

If this cycle added, moved or replaced a reference document (research, procedure, rule source), update `docs/reference-index.md` in the same step so the index stays the entry point.

## 4. Handoff

Delegate to the `planner` subagent with the cycle folder. Save its output as `docs/cycles/NN-<slug>/handoff.md` and review it with the user: with the `plan-canvas` skill in proposal review mode when `ecc-plan-canvas` is installed (every `[안]` decided, or an Approve verdict, confirms it; then continue without asking), otherwise in the conversation. After approval:
- replace `docs/current/handoff.md` with the same content (the dev project's CLAUDE.md imports this file)

## 5. Finish

- In `CLAUDE.md`, set `Current cycle: none (last: docs/cycles/NN-<slug>, handed off)`.
- Show `git status` and propose a commit message such as `cycle NN: <slug> handed off`. Commit only if the user agrees.
- Tell the user: start the dev session in chaekcheck-dev (the handoff loads automatically), then run `/cycle-start` here for the next slice; it will write the retro first.
