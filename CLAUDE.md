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

Current cycle: docs/cycles/27-zero-downtime-deploy (무중단 배포, started 2026-10-29 by the session chaekcheck-plan-cycle-27; changes the cycle 17 deploy files only, no new module/table/API). Before that: none (last: docs/cycles/26-book-descriptions, 책 설명 한 곳에 모으기, handed off 2026-10-28; handoff in its cycle folder only, one-line section in docs/current/handoff.md; ADR-0160~0166; dev 26 goes before 23 and 24 and also switches the foryou/aisearch readers in deploy 1, 23/24 branches rebase (user 2026-10-28); session chaekcheck-plan-cycle-26). Also docs/cycles/24-ai-book-search (AI 책 찾기: first-screen tabs "AI"/"직접", chat screen /ai-search, Claude Haiku 5.5 real time, new module aisearch; ADR-0150~0153; flows 61~63, screen S30) handed off 2026-10-24 on branch claude/compassionate-lovelace-mzvp4f and merged into plan main 2026-10-28 (user "합치고"); handoff in its cycle folder only, one-line section in docs/current/handoff.md; cycle 26 replaces its aisearch.search_book with catalog.book_search (ADR-0165, dropped in 26 deploy 2); cloud dev start message docs/cycles/24-ai-book-search/to-dev-start.md. Before that: none (last: docs/cycles/23-for-you-picks, 추천도서 「나에게 맞는 책」 tab, handed off 2026-10-24 by the cloud session chaekcheck-plan-b0; handoff in its cycle folder only, one-line note in docs/current/handoff.md which stays cycle 20; ADR-0147~0149; shares ListedBooks and the book-texts import mode with cycle 24 (other branch), whichever dev builds first makes them; collect-session tests (intro text, covers) pending in dev docs/reports/). Before that: none (last: docs/cycles/22-first-screen-usability, handed off 2026-10-18; 5-A단계 첫 사용자 안내 덧붙임 2026-10-20 (ADR-0139, 친구 피드백 2차, docs/research/screen-feedback/first-user-retention.md; 문구 확정 (나) 2026-10-20) — handoff in its cycle folder, one-line note in docs/current/handoff.md which stays cycle 20; web-only, ADR-0135~0138; dev builds 22 before cycle 20 phase 2, user 2026-10-18) and docs/cycles/21-recommended-books (추천도서 menu: 이동진 추천도서 + 사서 추천도서 + 서울대 100선) handed off 2026-10-16 (handoff in its cycle folder only, one-line section in docs/current/handoff.md; dev builds 21 first, user 2026-10-15; ADR-0122~0129); dev merged to main 836bd7b and applied to the ops-role DB 2026-10-17 (record 13 SUCCEEDED); many screen changes made by the user in dev; retro written 2026-10-17 (retro.md, decisions in easy/2026-10-17-retro-decisions.html; small dev fixes in to-dev-retro-fixes.md, linked from the end of docs/current/handoff.md) and docs/cycles/20-lookup-status-and-extension (lookup status light + Chrome extension lookups from the user's browser, one cycle; owned by the chaekcheck-plan-cycle-20 session from 2026-10-15; closed and handed off 2026-10-17 (docs/current/handoff.md = cycle 20; ADR-0118~0121, 0131~0133; dev builds phase 1 first, then the cycle 17 deploy, then phase 2; phase 3 only on its condition, user 2026-10-16/17) and docs/cycles/17-first-deploy in its own session; cycle 16 (notices and policies) handed off 2026-10-14 (handoff in its cycle folder only, one-line note in docs/current/handoff.md; dev runs in parallel with 15 in a separate worktree); cycle 15 (usage log) handed off 2026-10-14 (docs/current/handoff.md = cycle 15; dev 12, 13, 14 retros written the same day by the cycle 15 session); 19 = docs/cycles/19-author-angle-brackets (angle-bracket author notation and other notations splitting the same book) handed off 2026-10-16 (docs/current/handoff.md was cycle 19 until cycle 20 replaced it 2026-10-17; 19 is on dev main and applied to the ops-role DB 2026-10-16 (record 12); retro written 2026-10-18 (retro.md, decisions easy/2026-10-18-retro-decisions.html; [ ] author fix passed to the cycle 20 dev session); dev ran in parallel with 21 in its own worktree; if 21 is not on main by 2026-10-17, re-import and apply 19 alone; public deploy after 19 is applied) (17 = first deploy to AWS Lightsail Seoul for two weeks, planned ahead the same way, started 2026-10-13). Before that: none (last: docs/cycles/13-crawler-to-dev, handed off ahead in the cycle folder only, one-line note in docs/current/handoff.md; dev steps 1-8 run now in a separate worktree with its own DB compose project, alongside 12; real-data step and merge after 11 and 12); also docs/cycles/12-grouping-rules and docs/cycles/14-librarian-picks handed off ahead (cycle folders only; dev order 11 → 12 → 13; 14 now runs in parallel in its own worktree ../chaekcheck-dev-c14, docker project chaekcheck-c14, ports 5452/5453/8082/5176). Also 18 = docs/cycles/18-empty-library-holdings (empty or under-collected library holdings) handed off 2026-10-14; dev A1, A2 and B done and merged to dev main (a0e438a, not pushed; B moved before 19 by the user); C (operating reflection after 17 first deploy) moved to docs/backlog.md and told to the cycle 19 plan (user, 2026-10-15), so cycle 18 is closed on the dev side; retro written 2026-10-15 and brought up to date 2026-10-17 (original-DB import and AC-4 check done, nothing left to ask).

## Documents

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
