# dev 클라우드 세션 시작 글 (사이클 24, 사용자가 직접 붙여 넣음)

- 사용자 "dev도 클라우드로 할 예정이라서 내가 직접 전달할수 있게 해줘" (2026-10-24, 인계서 확인 #3)
- 아래 구분선 아래 글을 dev 저장소 클라우드 세션의 첫 메시지로 붙여 넣습니다.

---

chaekcheck 사이클 24 "AI 책 찾기"를 개발합니다. 이 세션은 클라우드에서 돌아서, dev `CLAUDE.md`가 불러오는 plan `docs/current/handoff.md`(Windows 경로)는 여기서 읽히지 않습니다. 그래서 아래 순서대로 plan 문서를 직접 읽어 주세요.

1. **plan 저장소를 붙입니다.**
   - 이 세션에 `hodu-sketch/chaekcheck-plan`이 없으면 `add_repo`로 읽기 권한을 붙입니다.
   - 브랜치 **`claude/compassionate-lovelace-mzvp4f`**를 받습니다. 사이클 24는 2026-10-28 plan main에 합쳤습니다(이 브랜치도 그대로 있음).
2. **이 순서로 읽습니다.**
   1. `docs/cycles/24-ai-book-search/handoff.md`: 인계서입니다. 이대로 진행합니다.
   2. 같은 폴더의 `design-delta.md`: 설계의 기준입니다. "검토 뒤 덧붙임"과 "확인 필요" 절까지 읽습니다.
   3. 같은 폴더의 `spec.md`(R1~R13, AC-1~19)와 `flow.md`(S1 탭 "AI"/"직접", S30 `/ai-search`)
   4. `docs/adr/0150`~`0153`: 모두 Accepted입니다.
   5. `docs/settings-index.md` 10절
   6. `docs/research/ai-recommend/llm-test-set.md`
3. **인계서 0단계부터 시작합니다.**
   - 먼저 dev의 `CLAUDE.md`와 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), 지금 코드를 읽습니다.
   - 15개 항목 대조표를 dev `docs/plan-feedback.md`의 새 `# 사이클 24` 절에 적습니다.
   - 설계와 다른 점이 있으면 코드를 쓰기 전에 저에게 먼저 알려 주세요.
4. **클라우드에서 못 하는 일은 하지 말고 알려 주세요.** 다른 세션에 대신 맡기지 않습니다.
   - 내 PC 수집 DB가 필요한 일입니다: 0단계 #13·#15, 2단계 찾기용 한 줄 PC 배치(소개 원문은 PC 밖으로 나가지 않음).
   - 이 일들은 제가 노트북에서 따로 돌립니다. 그 전까지는 3단계 이후를 제목·저자만으로 시험해도 됩니다.
5. **사이클 23과 나란히 만듭니다.**
   - 23은 plan 브랜치 `claude/server-status-library-crawl-test-uv7s8b`에 있습니다(「나에게 맞는 책」).
   - `picks`에는 새 파일만 더하고 기존 파일은 고치지 않습니다.
   - `usagelog` changelog 번호는 두 브랜치를 합칠 때 정합니다. changeSet id는 `usagelog-ai-search-event`입니다.
   - 첫 화면은 24만, 추천도서 화면은 23만 고칩니다.
6. **비밀 값을 지킵니다.**
   - Anthropic API 키는 코드·로그·커밋·plan 문서 어디에도 남기지 않습니다.
   - 1단계 프로토타입용 키를 어디에 둘지는 먼저 저에게 물어 주세요.
