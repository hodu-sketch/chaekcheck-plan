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

Current cycle: none (last: docs/cycles/04-and-search, handed off)

## Documents

- `docs/backlog.md` — ideas not in any cycle yet
- `docs/reference-index.md` — index of the documents to consult when redoing or maintaining library collection, library classification, book collection and book normalization/grouping; read it before a cycle that touches those, and update it when a source document moves
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
- Whenever a document gains or changes Mermaid diagrams, show them to the user rendered (canvas, or a rendered HTML page sent with `SendUserFile`), not only as text.
- Use AskUserQuestion for decisions during a cycle; subagents cannot ask the user, so collect answers in the main conversation.
- Verify external facts (APIs, libraries, versions, data sources) against official sources and cite the URL and check date. If it cannot be verified, say so.
- Commits: the author is the git config user (`yujeong <yujeong9104@gmail.com>`). Keep the `Co-Authored-By: Claude` line in commit messages.
