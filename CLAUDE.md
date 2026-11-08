# chaekcheck-plan

Planning and design workspace for chaekcheck. No application code is written here.

- Dev project (read-only from here): `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev`
- Stack and architecture rules (Spring Modulith modular monolith, module boundaries, no Kafka/Kubernetes until asked, Liquibase, React + Vite) are defined in the dev project's `CLAUDE.md`. Read that file when designing. Do not restate or change those rules here.
- Design conventions come from the dev project's skills. Read them from the dev folder instead of copying them:
  - modules: `.claude/skills/spring-modulith/SKILL.md`
  - tables: `.claude/skills/postgres-patterns/SKILL.md`, `.claude/skills/jpa-patterns/SKILL.md`
  - REST APIs: `.claude/skills/api-design/SKILL.md`

## How we work: small slices, repeated cycles

Do not plan or design the whole product up front. One cycle takes one small feature slice through planning and design, hands it off to the dev project, and the next cycle starts after reviewing what was actually built.

1. `/cycle-start <slice>` — review the previous cycle against the dev code, then fix this cycle's scope
2. `/feature-spec` — requirements and acceptance criteria for this slice only
3. `/screen-flow` — screens and states for this slice only
4. `/design-delta` — only the module, table and API changes this slice needs (uses the `architect` subagent)
5. `/adr <title>` — record each decision as it is made
6. `/cycle-close` — review (`design-reviewer`), update `docs/current/`, write the handoff (`planner`)

Current cycle: docs/cycles/29-ai-first-text-latency (운영 AI 책 찾기 「첫 글」 지연 원인 규명과 기록, 측정·기록 사이클, started 2026-11-08). Previous: (docs/cycles/28-busy-keeps-book-list, 번외·아주 작게: 동시 검색 자리 60개가 다 찼을 때 「바로 보기」 첫 대출 조회 503이면 책 목록은 보이고 「대출 정보 다시 확인」; handed off 2026-11-07 by the session chaekcheck-plan-cycle-28; all 10 decisions approved 2026-11-07 on easy/2026-11-01-decisions.html; ADR-0173; web-only, no module/table/API change; handoff in its cycle folder, one line in docs/current/handoff.md). Open cycles besides 28: cycle 24 (AI 책 찾기, dev in progress) and cycle 20 (phases 2·3 in backlog). All other cycles (01~19, 21~23, 26~27) are closed with retros — see docs/cycles/README.md for the full status table. Cycles 17, 23, 27 retros written 2026-11-05. ADR-0170 DB change rule (from cycle 27) applies to all later cycles. docs/current/handoff.md was shrunk 2026-11-05 to an open-cycle list + cross-cycle rules; per-cycle handoffs are in their cycle folders. New plan-feedback rule: existing dev docs/cycles/plan-feedback.md is frozen; new cycles use docs/cycles/NN/plan-feedback.md.

## Documents

- `docs/README.md` — map of the plan docs by purpose (start here)
- This repo is public. Commit only what may be public: no server IPs, account names, keys or tokens, no personal information.
- `docs/cycles/README.md` — read first: cycle order and status; cycle numbers are planning order, not dev order (20 before 17, the egress "webshare" work (once called "cycle 22", no folder) was merged into 20; the number 22 is free for something else, user 2026-10-18); update it whenever a cycle starts, hands off, closes or changes order
- `docs/backlog.md` — ideas not in any cycle yet
- `docs/reference-index.md` — index of the documents to consult when redoing or maintaining library collection, library classification, book collection and book normalization/grouping; read it before a cycle that touches those, and update it when a source document moves
- `docs/settings-index.md` — every server time limit, size cap and concurrency value (where it lives in dev, which doc decided it, why); when a cycle adds or changes such a value, update this file in the same change
- `docs/current/` — the design as it stands now: `module-map.md`, `data-model.md`, `api.md`, `flows.md`, `handoff.md`
- `docs/adr/README.md` — ADR index; `docs/adr/NNNN-<slug>.md` — decision records
- `docs/cycles/NN-<slug>/` — `scope.md`, `spec.md`, `flow.md`, `design-delta.md`, `handoff.md`, `retro.md`
- `docs/research/<topic>/` — research done outside any cycle to prepare later work (data sources, collection methods). Research and methods only: no module, table or API design here; a cycle that uses it links to it from its `scope.md` or `spec.md`

The dev project imports `docs/current/handoff.md` from its `CLAUDE.md`, so keep that file limited to the current handoff.

## Language

- Write everything under `docs/` in Korean.
- Keep identifiers in English: module, package, table, column, endpoint and event names.
- Config files (`CLAUDE.md`, `.claude/`) stay in English.

## Working rules

- Ask the user before deciding. Present choices as proposals (안) with trade-offs; the user decides.
- Review documents in the browser with the `plan-canvas` skill when `ecc-plan-canvas` is installed; otherwise review in the conversation and tell the user the canvas is unavailable.
- Review documents with the plan-canvas skill in proposal review mode (each [안] decided 승인/미승인/기타 in the canvas, 기타 = question or suggestion; once all are decided, move to the next step without asking).
- Whenever a document gains or changes Mermaid diagrams, show them to the user rendered (canvas, or a rendered HTML page sent with `SendUserFile`), not only as text.
- Decisions, follow-up questions and ADR drafts go to the user through the canvas as a plain-language decision page (see the `plan-canvas` and `plain-page` skills: evidence from official sources, diagrams, PC/tablet/phone mock-ups for screens). Use AskUserQuestion or a list in the conversation only when the user asks for it, is on another device, or the canvas is unavailable. Subagents cannot ask the user, so collect answers in the main conversation.
- Verify external facts (APIs, libraries, versions, data sources) against official sources and cite the URL and check date. If it cannot be verified, say so.
- Commits: the author is the git config user (`yujeong <yujeong9104@gmail.com>`). Keep the `Co-Authored-By: Claude` line in commit messages.
