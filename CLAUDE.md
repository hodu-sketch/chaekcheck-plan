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

Current cycle: docs/cycles/21-recommended-books (추천도서 menu: 이동진 추천도서 + 사서 추천도서 + 서울대 100선) handed off 2026-10-16 (handoff in its cycle folder only, one-line section in docs/current/handoff.md; dev builds 21 first, user 2026-10-15; ADR-0122~0129) and docs/cycles/20-lookup-status-and-extension (lookup status light + Chrome extension lookups from the user's browser, one cycle; owned by the chaekcheck-plan-cycle-20 session from 2026-10-15; scope/research now, design and handoff after 17 and 19) and docs/cycles/17-first-deploy in its own session; cycle 16 (notices and policies) handed off 2026-10-14 (handoff in its cycle folder only, one-line note in docs/current/handoff.md; dev runs in parallel with 15 in a separate worktree); cycle 15 (usage log) handed off 2026-10-14 (docs/current/handoff.md = cycle 15; dev 12, 13, 14 retros written the same day by the cycle 15 session); 19 = docs/cycles/19-author-angle-brackets (angle-bracket author notation and other notations splitting the same book) handed off 2026-10-16 (docs/current/handoff.md = cycle 19; dev runs in parallel with 21 in its own worktree; if 21 is not on main by 2026-10-17, re-import and apply 19 alone; public deploy after 19 is applied) (17 = first deploy to AWS Lightsail Seoul for two weeks, planned ahead the same way, started 2026-10-13). Before that: none (last: docs/cycles/13-crawler-to-dev, handed off ahead in the cycle folder only, one-line note in docs/current/handoff.md; dev steps 1-8 run now in a separate worktree with its own DB compose project, alongside 12; real-data step and merge after 11 and 12); also docs/cycles/12-grouping-rules and docs/cycles/14-librarian-picks handed off ahead (cycle folders only; dev order 11 → 12 → 13; 14 now runs in parallel in its own worktree ../chaekcheck-dev-c14, docker project chaekcheck-c14, ports 5452/5453/8082/5176). Also 18 = docs/cycles/18-empty-library-holdings (empty or under-collected library holdings) handed off 2026-10-14; dev A1, A2 and B done and merged to dev main (a0e438a, not pushed; B moved before 19 by the user); C (operating reflection after 17 first deploy) moved to docs/backlog.md and told to the cycle 19 plan (user, 2026-10-15), so cycle 18 is closed on the dev side; retro not written yet (input: dev plan-feedback "# 사이클 18").

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
- Review documents with the plan-canvas skill in proposal review mode (each [안] decided 승인/미승인/기타 in the canvas, 기타 = question or suggestion; once all are decided, move to the next step without asking).
- Whenever a document gains or changes Mermaid diagrams, show them to the user rendered (canvas, or a rendered HTML page sent with `SendUserFile`), not only as text.
- Decisions, follow-up questions and ADR drafts go to the user through the canvas as a plain-language decision page (see the `plan-canvas` and `plain-page` skills: evidence from official sources, diagrams, PC/tablet/phone mock-ups for screens). Use AskUserQuestion or a list in the conversation only when the user asks for it, is on another device, or the canvas is unavailable. Subagents cannot ask the user, so collect answers in the main conversation.
- Verify external facts (APIs, libraries, versions, data sources) against official sources and cite the URL and check date. If it cannot be verified, say so.
- Commits: the author is the git config user (`yujeong <yujeong9104@gmail.com>`). Keep the `Co-Authored-By: Claude` line in commit messages.
