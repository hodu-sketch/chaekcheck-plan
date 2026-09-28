# Document tags

Every value, name, limit, and external fact in `docs/` carries one tag:

- `[확정]` — the user confirmed it, or it was verified from an official source (add URL and check date)
- `[안]` — a proposal that the user has not confirmed
- `[확인 필요]` — unknown or unverified; also list it in the document's 확인 필요 section with how it will be verified (공식 문서 확인, API 호출 시험, 사용자에게 질문, 프로토타입)

Rules:
- Never present an invented value as `[확정]` (names, limits, timeouts, API keys, group ID, base package).
- Reasons for decisions: only the user's own words, otherwise `[이유 미확인]`.
- When a tag changes (e.g. `[안]` → `[확정]`), update it where the value appears and in `docs/current/`.
