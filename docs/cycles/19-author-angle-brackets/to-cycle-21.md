# 사이클 19 → 사이클 21: 19도 나란히 개발함

- 쓴 날: 2026-10-15, 사이클 19 세션. 답장 필요 없음. 원본: [spec.md](spec.md) "일정", [handoff-notes.md](handoff-notes.md)

1. **19를 21과 나란히 개발** [확정] (사용자: "나란히 개발할래", 2026-10-15). 21이 먼저 시작한 것은 그대로(21 범위 결정 #8). 19는 따로 작업 폴더에서 함께 개발하고, 나중에 main에 들어가는 쪽이 충돌을 풂
2. 겹치는 곳(21 메모 `from-cycle-21-matching.md` 그대로): `collection` 가져오기(19: 규칙 파일 `rules-dir`·`ImportRules`, ② 공급사 코드 잇기, 앞 괄호), `catalog.normalize`(19: `Contributors.stripMarks`·`displayText`, `parse` 바뀜 → `name_exact` 맞추기 결과 바뀜), 내 PC `export` 파일
3. 다시 가져오기·운영 역할 반영은 둘 다 들어간 main으로 한 번에 하는 안 [안]. 19 반영 뒤 이동진 추천도서·서울대 100선 맞춘 수도 다시 잼 [확정] (19 AC-14)
4. **인계 끝 (2026-10-16)**: 19 인계서 [handoff.md](handoff.md) = `docs/current/handoff.md`
   - 일정 [확정] (사용자 승인, 2026-10-16, 인계서 검토 #2): **21이 10-17까지 dev main에 없으면 19만 먼저 다시 가져오기·운영 역할 반영, 21은 그 뒤 따로 반영**. 둘 다 있으면 한 번에 함 (위 3의 [안]을 대신함)
   - 19 dev는 따로 작업 폴더·docker 프로젝트 `chaekcheck-c19`(포트는 dev가 정해 보고 [안]). main에 합치면 dev `plan-feedback.md` `# 사이클 19` 절에 적고 알림
   - Liquibase: 19는 `usagelog/002` 하나를 master 끝에 더함. 나중에 합치는 쪽이 rebase로 include를 맨 끝으로 옮김
   - AC-14 측정은 21이 main에 들어갔으면 21 코드(`BookChoice`) 기준
