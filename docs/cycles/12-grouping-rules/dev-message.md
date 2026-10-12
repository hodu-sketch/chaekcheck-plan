# dev에 보낼 글: 사이클 12 시작 (미리 쓴 인계서, 별도 worktree)

- 작성: 2026-10-12. 사용자가 아래 "보낼 글"을 **새 dev 세션**(사이클 11 세션이 아닌)에 붙여 넣습니다.

## 보낼 글

> 사이클 12(책 묶기 기준 다시 보기)를 시작해 주세요. 인계서는 plan의 `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\cycles\12-grouping-rules\handoff.md`입니다. **dev `CLAUDE.md`가 불러오는 `docs/current/handoff.md`는 사이클 11 인계서이니 그건 따르지 말고, 이 파일을 직접 열어 따라 주세요.**
>
> **꼭 지킬 것**
> - 지금 다른 dev 세션이 기본 작업 폴더(`chaekcheck-dev`)에서 사이클 11 측정(11단계)을 하고 있어요. 사이클 12는 **따로 git worktree와 브랜치를 만들어서** 하고, 기본 작업 폴더의 파일·브랜치·커밋 안 된 변경은 건드리지 마세요.
> - 측정이 도는 동안 실데이터 dry run·가져오기·내보내기, `docker compose up/down/build/restart`는 하지 마세요(compose 프로젝트 이름이 같아 측정 중인 컨테이너를 건드려요).
> - 지금은 인계서의 **Phase A**(코드·단위/계약 테스트·비교 도구)만 해요. `current`(`BookGrouping`)는 사이클 11 측정 결과와 기본 묶는 방식이 정해지기 전에는 지우지 마세요. Phase B(실데이터, `current` 정리, 가져오기)는 사이클 11이 끝난 뒤예요.
> - plan에 남길 글은 dev `docs/plan-feedback.md`의 **새 `# 사이클 12` 절**(사이클 11 절 뒤)에 써 주세요.
>
> **시작할 때 사용자에게 물어볼 것** (인계서 "개발 시작 전 확인")
> - worktree를 어느 커밋에서 시작할지(사이클 11 중간 전달 커밋 / 사이클 11 브랜치 최신)
> - worktree에 없는 `.env`를 어떻게 줄지(값은 커밋하지 않음)
> - 측정 중에 돌려도 되는 테스트 범위와 때(인계서 제안: DB 없는 단위 테스트만 측정 라운드 사이에, `./gradlew build`·`SqlGroupingTests`는 측정이 쉴 때 알리고)
