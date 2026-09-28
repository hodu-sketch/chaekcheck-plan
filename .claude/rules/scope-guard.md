# Scope guard

- Work on the current cycle's slice only (`Current cycle:` in `CLAUDE.md`, its `scope.md`).
- When an idea falls outside the slice, add one line to `docs/backlog.md` (idea, source, date) and continue. Do not design it.
- Do not create modules, tables, endpoints or screens the slice does not need.
- Do not propose Kafka, Kubernetes, service discovery, an API gateway or splitting into services unless the user asks. Note the future split only as "나중에 분리할 때" in ADRs.
- Never write to the dev project (`chaekcheck-dev`). Changes for it go into the handoff.
