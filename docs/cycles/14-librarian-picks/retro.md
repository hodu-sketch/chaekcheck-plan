# 사이클 14 회고: 인기 도서 → 사서추천도서 (새 모듈 `picks`, `popular` 지움)

## 근거

- 작성 2026-10-14 (plan 쪽 회고 초안, 사용자 확인 전)
- dev `docs/plan-feedback.md` "# 사이클 14"(3715행~): 시작 상태 3719~3726행, 진행·측정 3733~3796행, 진짜 받기 시험 3805~3826행, 12·13 위로 rebase 3798~3838행, [확인 필요] 표 결과 3840~3857행, 정한 이름 3859~3869행, AC 확인표 3871~3902행, 합치기와 원래 쪽 정리 3904~3916행, "plan에 넘길 것 요약" 3918~3955행
- dev 코드(기본 브랜치 `main` = `2c1290d`, 사이클 14를 앞으로 감기로 합친 커밋 `2a7faae`, 그 전에 사이클 12 `3182918`·13 `5482978` 위로 rebase — 커밋 번호는 dev `plan-feedback.md` 3800·3830·3906행과 dev `.git/refs/heads/main`에서 읽음)
  - 백엔드 `backend/src/main/java/com/chaekcheck/picks/**`(30개 파일), `catalog/BookLookup.java`·`TitleAuthor.java`·`TitleAuthorBook.java`·`internal/JdbcBookLookup.java`, `db/changelog/picks/001-picks-schema.yaml`, `db.changelog-master.yaml` 92~94행, `application.yml` 186~224행, `application-library-insert.yml` 15~16행
  - 웹 `web/src/main.tsx` 20·41~42행, `features/picks/*`, `features/about/AboutPage.tsx` 40~47행
- Spring Modulith `Documenter` 출력: dev `backend/build/spring-modulith-docs/`에 `picks` 파일이 없음(빌드 폴더를 지금 읽을 수 없거나 아직 만들지 않음) → 그림 대조는 `package-info.java`로 대신함
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`. 사용자 말은 dev가 `plan-feedback.md`에 옮긴 것

## dev가 마친 범위

- 인계서 0~7단계 전부 [확정] (dev `plan-feedback.md` 3871~3902행). 사이클 12·13 위로 rebase한 뒤 기본 브랜치에 앞으로 감기로 합치고 push (사용자 "합쳐줘", "지금 올리기", 3906행)
- 시험: 백엔드 `./gradlew build` 793개, 웹 `npm test` 372개, `npm run build`, `npm run lint` 통과 (3835행)
- 진짜 API 받기 시험 1번(2026-10-14 01:39, 사용자 승인 "진짜 받기 시험 오늘 해", 3805행) + 그 전에 시험 픽스처용 요청 1건(2026-10-12, 사용자 승인 "오늘 1건으로 시험 픽스처 받아", 3738행)
- 사용자 폰 확인(Samsung Internet, 웹 5177): "지금 맘에 들어" (2026-10-12, 3796·3901행)
- 원래 쪽 정리(사용자 승인 뒤): 원래 `db`(5432)·`db-test`(5433)에서 `DROP SCHEMA popular CASCADE` + `databasechangelog` `popular-001-*` 4줄씩 지움, 원래 `.env`의 `CHAEKCHECK_POPULAR_FETCH_ENABLED` 줄을 지우고 `CHAEKCHECK_PICKS_FETCH_ENABLED=false`를 넣음 (3907~3908행)
- 남은 것: 원래 서버(8080)는 2026-10-12부터 옛 코드로 떠 있어 다시 켜야 `picks-001-*`이 적용되고 `/picks`가 동작함 (3909행)

## 계획대로 된 것

- 새 모듈 `picks` — `@ApplicationModule(allowedDependencies = { "catalog", "catalog :: normalize", "library" })` (dev `picks/package-info.java` 20행). Java 공개 타입 없음, 이벤트 없음, 다른 모듈은 `picks`를 모름. 안쪽 패키지 `internal/fetch`·`schedule`·`store`·`cover`·`cache`·`web`(인계서 예시와 같음)
- 스키마 `picks` 표 셋 `fetch_run`·`pick`·`cover`, 칸·제약·색인이 design-delta "데이터"와 같음 (dev `db/changelog/picks/001-picks-schema.yaml` 9~98행: changeset `picks-001-schema`·`-fetch-run`·`-pick`·`-cover`, 색인 `fetch_run_status_started_at_idx`)
- `popular` 지움: dev `backend/src/main`에 `popular` 패키지·changelog 없음(남은 글자는 주석 4곳), 웹 `src`에 `popular` 글자 0곳, master는 `# cycle 14: librarian picks (ADR-0089)` + `picks/001-picks-schema.yaml` (master 92~94행)
- `catalog`: `BookLookup.byTitleAndAuthor(Collection<TitleAuthor>) → List<TitleAuthorBook>`, 레코드 `TitleAuthor(String title, String author)`·`TitleAuthorBook(TitleAuthor query, long bookId, long[] libraryIds)` 이름·모양 그대로 (dev `BookLookup.java` 27행, `TitleAuthor.java` 7행, `TitleAuthorBook.java` 9행). 제목 키 `CatalogText.pickTitleKey`, 첫 저자 `Contributors.firstNameExact`
- REST `GET /api/v1/picks`, `GET /api/v1/picks/covers/{coverId}`, 응답 칸 `fetchedAt`·`categories[].code·name·books[]`·`recomNo`·`category`·`recommendedMonth`·`title`·`coverUrl`·`bookId`·`available` (dev `PicksController.java` 130~143행)
- 받기 판단 cron `0 0 5 * * *`, `Asia/Seoul`, 월요일·실패 뒤 매일·7일 따라잡기 (dev `application.yml` 196~199행, `FetchDecision.java`), 표지 200px JPEG·품질 0.8·원본 5MB·1,600만 화소·1초 간격 (`application.yml` 209~221행)
- 같은 달 정렬 = 등록일 늦은 순 → `recomNo` 글자 큰 순, `registered_on` NULL은 맨 뒤 (dev `PicksCache.java` 52~55행)
- 웹: 경로 `/picks` (dev `main.tsx` 41~42행), 머리 "사서추천도서", 순위 칩 없음, "? 추천 기준 보기", S14 추천 줄 "2026년 10월 사서추천 · 문학", 출처 줄 "출처: 국립중앙도서관 사서추천도서 (공공누리 제1유형) · 10월 12일 받음" (dev `picksText.ts` 5·36·53행), S12 `/about` 사서추천도서 문단(13이 남긴 자리, 3832행)
- 키 지키기: 로그 전체에서 키 0건, `bnk.kpipa.or.kr` 요청 0건 (3821~3822행)

## 완료 기준 결과

dev AC 확인표(`plan-feedback.md` 3871~3899행) 그대로.

| AC | 확인 방법 | 결과 |
|---|---|---|
| AC-1 "전체" 첫 9권 3×3(숫자 없음), 출처 줄·받은 날 | Vitest `PicksPage` + 폭 4개 화면 | 통과 |
| AC-2 ◀ ▶ | Vitest | 통과 |
| AC-3 내리면 다음 분류 | Vitest | 통과(실제 밀기는 사용자 폰) |
| AC-4 분류 순서, 빈 분류 없음 | `PicksApiTests`·`PicksCacheTests` + Vitest | 통과 |
| AC-4b 모르는 분야 코드 → "전체" + 맨 뒤 새 분류, 기록 | `PicksFetchTests`·`PicksApiTests` + Vitest | 통과(진짜 응답에는 새 코드 없음) |
| AC-5 분류 목록 | Vitest + 화면 | 통과 |
| AC-6 ISBN 또는 본제목+첫 저자, 흐림 | `BookLookupTests`·`PicksCacheTests`·`PicksApiTests` + Vitest | 통과 |
| AC-7 검색 기준 바꾸면 바뀜 | `PicksApiTests`(scope) + Vitest | 통과 |
| AC-8 S14 앞 3곳 | Vitest + 화면 | 통과 |
| AC-9 [책 검색 >>]·도서관 줄 | Vitest | 통과 |
| AC-10 흐린 책 → 신청 안내 | Vitest + 화면 | 통과 |
| AC-11 오류·0권 → 그대로, 실패 기록, 오류 로그 | `PicksFetchTests` | 통과 |
| AC-12 목록 1건 + 새 표지(1초), kpipa 0 | `PicksFetchTests` + 진짜 시험 로그 | 통과(109요청, 최소 간격 1,000ms, kpipa 0) |
| AC-13 목록 없이 켜면 받고 기록 | `PicksStartupFetchTests` + 진짜 시험 | 통과(`STARTUP`) |
| AC-13b 7일 초과면 받음 | `FetchDecisionTests` | 통과 |
| AC-14 표지 안 열림 → 제목 글자 | Vitest | 통과 |
| AC-14b 저장 표지는 우리 주소, 없으면 제목 | `PicksApiTests` + Vitest + 화면 | 통과 |
| AC-15 "사서추천도서", "인기 도서" 없음 | Vitest `AppLayout`·`PicksPage` + 화면 | 통과 |
| AC-16 로그인 없이 보임 | `AuthEnabledSecurityTests` | 통과 |
| AC-17 범위 | `SaseoXmlParserTests`·`PicksFetchTests` + 진짜 시험 | 통과 — **기준이 바뀜**: 인계서 "최근 6번" → 최근 12번(2년), 108권 (사용자 결정, 아래 표 1) |
| AC-18 폰 아래 창 닫기·뒤로 | Vitest | 통과 |
| AC-19 폰·태블릿 밀기 | Vitest | 통과 |
| AC-20 S3 갔다 뒤로 → 보던 자리 | Vitest | 통과(실제 왕복은 사용자 폰) |
| AC-21 S14 404 아닌 오류 → S3 문구 | Vitest `PicksBookDialog` | 통과 |
| AC-22 개발 DB에 출판유통 자료 없음 | `PicksSchemaTests` + SQL | 통과(14의 5452·5453, 합친 뒤 원래 5432·5433도 사용자 승인 뒤 정리, 3907행) |

측정 (dev, `plan-feedback.md`)

| 항목 | plan 값 | dev 값 |
|---|---|---|
| ① ISBN으로 맞음 (52권) | 29 (수집 DB) | 30 (서비스 DB 복사본, 3758행) |
| ①이나 ② (52권) | 32 | 33 / 52 = 63.5% (3759행). ②로만 맞은 3권은 「코다」「내 생의 가장 아름다운 완성」「젊음의 나라」 |
| 12번(108권) 중 우리 책 | — | 72 / 108 (3820·3838행) |
| `byTitleAndAuthor` 시간 | — | 52건 73~87ms (3756~3757행) |
| `GET /api/v1/picks` (강서구) | p95 1초 안 | p50 27.4ms, p95 35.9ms, 51,207바이트, `available` 68 / 108 (3838행) |
| 목록 요청 1건 | 2년 1.56MB | 3년 2,511,752바이트, 771ms, 받은 163 / 남긴 108 (3813~3814행) |
| 표지 | — | 요청 108, 받음 108, 실패 0, 최소 간격 1,000ms, 1분 56초, 저장 1,285,929바이트 (3817~3818행) |
| 캐시 새로 고침 | — | 53~114ms (3820·3838행) |

재지 못한 것: 공용 캐시 메모리(추정만 "수백 KB 안쪽" [안: 추정, 측정 아님], 3946행), plan 책 목록과 하나씩 비교(3947행), Open API 하루 한도 문서(3948행)

## 달라진 것과 이유

| # | 달라진 것 | 이유 (사용자 말, 없으면 [이유 미확인]) | 처리 |
|---|---|---|---|
| 1 | 남기는 범위 최근 6번 → **12번(2년)**. 분야당 약 10권 → 18권, 테마 36권, 전체 52 → 108권 (`KeptPicks.MONTHS` 12, dev `KeptPicks.java` 24행) | "지금 10권까지만 있는데 그 이상도 안되나? 사서추천도서 분야별로 10권까지야?" → 선택지 중 "12번(2년)으로 늘리기" (3781행) | spec·design-delta·flow 고침(이번 회고), `docs/current` 고침(아래), 새 ADR(ADR-0089 범위 부분) |
| 2 | 요청 기간 `window` 2년 → **3년** (dev `application.yml` 201~204행). 응답 1.56MB → 2.51MB(163건) | [이유 미확인] — 사용자 발언 없음, dev 판단. dev가 적은 이유: 12번 = 약 24개월이라 2년이면 받는 날에 따라 12번째 추천이 범위 밖으로 빠질 수 있음 (3783행) | spec·design-delta에 dev 변경 [안]으로 적음. 사용자 확인 질문 1 |
| 3 | S13i 도움말: "…최근 12번(2년) 추천분이에요" + 새 줄 "보통 2달에 한 번, 한 번에 8권(문학·인문·사회·자연 각 2권)을 추천해요. 테마 추천 때는 12권이에요" (dev `picksText.ts` 22~28행) | "설명에서 6번이라고 하니까 못알아 듣겠거든 이거 좀 더 구체적으로 12번(2년)이라고 알려주고, 국립중앙도서관은 보통 2달에 한 번, 한 번에 약 8권(문학·인문·사회·자연 각 2권)을 추천해요. 이 정보도 알려줘" (3785행). 테마 문장은 dev가 받은 자료로 확인해 덧붙임 [이유 미확인] | spec R7-2·flow S13i 고침 |
| 4 | 서버·웹 포트 8082·5176 → **8083·5177** (worktree `.claude/launch.json` `c14-backend-8083`, `c14-web-lan-5177`) | 사이클 13이 8082·5176을 쓰고 있어 사용자 결정 (3771행). 사용자: "지금 사이클 13작업 중이니까 안 겹치게 뭐 따로 워크트리랑 뭐 따로 빼서 하든 뭐든 해, db도 포트를 다르게 한다던가" (3807행) | 개발 환경 값이라 `docs/current` 반영 없음. 새로 알게 된 제약에 적음 |
| 5 | 제목 글자 카드: 본제목만(" : "·" = " 앞), 5줄(폰 4줄)까지, 폰 글자 0.62rem (dev `picksText.ts` 67행 `cardTitle`). 화면 읽기용 이름은 원래 제목 | [이유 미확인] — dev가 화면 확인 중 고침(긴 부제로 잘리고 320px에서 세로로 쌓임, 3776행). 인계서에 없던 화면 수정 | `docs/current/module-map.md` 웹 줄에 적음 |
| 6 | 폰 표지 크게: 폰 그리드 폭 계산에서 출처 줄 자리를 빼고, 판 좌우 안쪽 여백 0.9rem → 0.55rem. 카드 폭 375×812 86 → 99px. 3×3 그대로 | "폰에서 이미지가 너무 작은 느낌인데 조금 못 키우나?" → 확인 뒤 "지금 맘에 들어" (3791·3796행). 2열 안은 쓰지 않음 | `docs/current/module-map.md` 웹 줄에 적음 |
| 7 | 제목+저자 후보 좁히기: `title_norm` pg_bigm이 아니라 첫 저자 `book_contributor.name_exact` 색인으로 좁히고 Java에서 제목 키 비교 (dev `JdbcBookLookup.java` 57~100행) | [이유 미확인] — dev 판단([안] 범위). dev가 적은 이유: 제목 키는 기호를 빼는데 `title_norm`은 기호를 남겨 pg_bigm LIKE로 좁히면 놓칠 수 있음. `EXPLAIN ANALYZE` 28ms (3763행) | `docs/current/module-map.md` `catalog` 줄 고침 |
| 8 | 첫 저자 뽑기 `Contributors.firstNameExact`: `;` 뒤 버림, 앞 "지은이:"·"공저:" 꼬리표 뗌, 뒤 "소설·장편소설·소설집·시집·산문(집)·에세이" 뗌. `ROLE_WORDS`는 그대로 | [이유 미확인] — dev 판단. dev가 적은 이유: 사서추천 저자 칸에서 "애너 퀸들런 소설" 같은 값을 봄, `ROLE_WORDS`를 바꾸면 가져오기 결과가 바뀜 (3765행) | `docs/current/module-map.md` `catalog` 줄, `reference-index.md` 4절 |
| 9 | 제목 키 `CatalogText.pickTitleKey`: plan 측정 규칙(kpipa.md 4절)에 `=` 앞 자르기·여러 앞 괄호 떼기를 더함 | [이유 미확인] — dev 판단 (3764행) | `reference-index.md` 4절 |
| 10 | `application-library-insert.yml`: 인계서 "`chaekcheck.popular.*` 줄을 지운다" → `chaekcheck.picks.fetch.enabled: false`로 바꿈 (dev 15~16행) | [이유 미확인] — dev 판단. dev가 적은 이유: 지우기만 하면 도서관 넣기 명령에서 picks 받기 기본값(true)이 켜져 진짜 API를 부를 수 있음 (3833행) | `docs/current/module-map.md` `picks` 설정 줄 |
| 11 | 인증키: 인계서 C5 "dev는 키를 보지도 적지도 않음" → 사용자가 대화로 주어 dev가 worktree `.env`(git 밖)에 넣음. 값은 대화 기록에 한 번 남음 | 사용자: "이거 인증키야 니가 써" (3737행) | 배포 전 새 키를 받을지: 사용자 질문 3 |
| 12 | 표지만 먼저 받음(2026-10-12, 키 없이 108장, 로컬 러너 `LocalCoverFetchRunner`) — 화면 확인용, 진짜 받기 시험 전에 지움 | 사용자: "지금 표지만 받기" (3786행) | 반영 없음(시험 데이터) |
| 13 | 받기 판단 세부(dev [안]): ① 오늘 이미 성공했으면 안 받음 ② 05:00에 목록이 없으면 trigger `CATCH_UP` ③ 서버 시작 때는 "목록 없음"·"7일 초과"만 봄(실패 뒤 다시는 05:00에만) (dev `FetchDecision.java` 13~24행) | [이유 미확인] — dev 판단. dev 주석: 실패는 켤 때마다가 아니라 05:00에 다시 받음 | `docs/current/module-map.md` 도메인 모델·`flows.md` 흐름 24 |
| 14 | 비교 규칙 세부(dev [안]): "같은 목록" = 모든 칸이 같은 줄의 집합, 새 분야 코드는 숫자면 수 순서·아니면 글자 순서 뒤, `format_changed`는 한 권이라도 `recomNo`·제목·분야 코드·추천 연월이 틀리거나 본문 10MB 초과, `missing_isbn_count`는 남긴 책 기준 (3867행, `KeptPicks.java` 26~30행) | [이유 미확인] — dev 판단 | `docs/current/flows.md` 흐름 24 메모 |
| 15 | S12 `/about` 문구 끝: "표지 게시를 원하지 않는 권리자는 [연락처]로" → "표지 게시를 원하지 않는 권리자를 위한 연락처는 정해지면 이곳에 안내할게요." (dev `AboutPage.tsx` 45~46행) | [이유 미확인] — 연락처가 아직 없어 dev가 로고 내림 문단(같은 파일 50행)과 같은 말투로 둠 | 연락처는 질문 3 |
| 16 | 운영 메모 `docs/maintenance/4-picks.md`(옛 `4-popular.md`를 바꿈) (3868행) | 인계서대로 [확정] | `reference-index.md` 확인 |

dev 코드 대조에서 plan이 찾은 것

- dev `picks/001-picks-schema.yaml` 1~2행 머리 주석이 아직 "the latest six recommendation months"임(코드는 12). 동작에는 영향 없음. 주석을 고칠 때 Liquibase 체크섬에 영향이 있는지 dev가 확인 [확인 필요: dev 확인] → 다음 인계서 "dev에 알릴 것" 한 줄
- 웹에 `*` 경로가 없음 (dev `main.tsx`, 3777·3942행) → 질문 4

## 새로 알게 된 제약

- **국립중앙도서관 응답 모양**: 항목마다 `<list>` 하나가 `<item>`을 감쌈(`<channel><totalCount/><list><item/></list>…`). 요소 이름으로 찾으므로 해석은 그대로 됨 (3740행) [확정] (2026-10-12 API 호출 시험)
- **응답 순서 = 국립중앙도서관 웹 목록 순서**: 추천 달 최신순이고, 같은 달 안은 등록일순도 `recomNo`순도 아닌 사서의 배치(2026.10: 문학·인문·사회·자연·자연·사회·인문·문학). 우리 "나중 등록 먼저" 순서는 웹과 거의 거꾸로 (3911~3915행, 웹 https://www.nl.go.kr/NL/contents/N20500000000.do 2026-10-14 dev 확인) → 질문 2
- **추천 주기**: 2달에 한 번 문학·인문·사회·자연 각 2권(8권), 2024.12·2025.06·2025.12는 테마만 12권 (3784·3936행) [확정] (2024.12~2026.10 응답 기준)
- **API 오류 응답 모양 모름**: 진짜 오류를 만나지 않음. 지금 규칙(200 아님 → `request_rejected` "HTTP <상태>", 오류 요소 이름 `*error*`·`err_code`·`result_code`는 짐작) (3848행) [확인 필요: 운영에서 오류를 만나면 기록]
- **목록이 같은 주에는 실패한 표지를 다시 받지 않음**(`changed=false`면 표지 단계 없음). 이번 시험은 실패 0 (3869행)
- **worktree에서 시험**: 사이클 11 시험(`CatalogTransferTests`·`CatalogImportModesTests`)의 pg_dump 기본값이 원래 묶음 `chaekcheck`의 `db-test`를 부름 → worktree에서는 `TEST_PG_COMMAND`로 자기 묶음을 가리켜야 함 (3731·3938행)
- **worktree 사이 포트**: 여러 worktree를 쓰면 서버·웹 번호도 미리 나눠야 함(13과 14가 8082·5176을 함께 적어 둠) (3730·3939행)
- **다른 사이클이 이미 적용된 changeset을 고치면** rebase 뒤 각 worktree DB 체크섬이 틀려 앱이 안 켜짐 → 13의 절차(dev `3-import.md` 13-5)로 맞춤 (3834·3940행)
- **Playwright MCP 브라우저는 한 세션만** 씀 → 라이브러리 + Edge 헤드리스로 대신 (3941행)
- **원래 서버는 다시 켜야** 새 changeset이 적용됨(8080은 옛 코드로 떠 있음) (3909행)

## 다음 사이클 후보

- 같은 달 순서를 국립중앙도서관 웹(응답) 순서로 — 질문 2에서 고르면 작은 일(칸 하나 + 정렬). 고르지 않으면 없음
- 없는 주소 화면(`*` 경로) — 질문 4
- 배포 전 사서추천 할 일(사이클 17 첫 배포에 넣을지): 표지 이용 조건, 권리자 연락처, User-Agent 서비스 주소(dev `application.yml` 214행 `TODO(확인 필요)`), 인증키 새로 받기와 운영 비밀값 — 질문 3
- 목록이 같은 주에도 실패한 표지를 다시 받기 — backlog
- Open API 하루 한도 문서 확인, 공용 캐시 메모리 운영 측정 — backlog(운영 지켜보기)
- 우리 전자책 표지 쓰기 — 이미 backlog (spec R4-4)

## docs/current 반영

아직 고치지 않음(다른 사이클 회고가 같은 파일을 고치는 중이라 나중에 한 번에). 고칠 목록은 세션 작업 폴더 `retro/current-delta-14.md`에 줄 단위로 둠. 요약:

- `module-map.md`: `picks` 줄·의존·그림·웹·도메인 모델의 "설계됨(미구현, 사이클 14)" → "구현됨 (사이클 14, 회고 2026-10-14)", 6번 → 12번(2년), `window` 2년 → 3년, 실제 패키지·후보 좁히기·첫 저자 규칙·판단 세부, 폰 표지·제목 카드, 도움말 문구. 사이클 10 `popular` 줄은 "지움 (사이클 14)"으로
- `data-model.md`: 스키마 `picks` 구현됨, 범위 12번, 크기 실측 108줄·표지 108장 1.29MB, 스키마 `popular` 지움(원래 DB까지 정리됨), "확인 필요 (사이클 14)" 결과
- `api.md`: `picks` 두 경로 구현됨, 12번, `popular-books` 지움
- `flows.md`: 흐름 24~26과 "화면 공통" 구현됨, 3년·12개 달, 판단 세부, 측정값
- `code-overview.md`: 고치지 않음(2026-10-04 기준 문서이고 `popular`·`picks` 모두 없음)
- `reference-index.md` 4절·6절: 사서추천 맞추기 규칙(`pickTitleKey`·`firstNameExact`) 한 줄
- ADR: 새 ADR 하나(범위 12번·요청 3년, ADR-0089의 범위 부분을 바꿈) — 사용자 승인 뒤 → ADR-0108 (Accepted, 2026-10-14)

## 사용자에게 물을 것

1. **범위 12번과 요청 기간 3년 맞추기**
   - [안] spec·design-delta·flow·`docs/current`를 "최근 12번(2년), 요청 3년, 새 도움말"로 맞추고, dev가 바꾼 요청 기간 3년도 그대로 승인 + 새 ADR(ADR-0089의 범위 부분을 바꿈) 작성
   - 트레이드오프: 3년이면 응답이 1.56MB → 2.51MB(상한 10MB 안, 주 1건)로 커지지만 12번이 늘 다 들어옴. 2년으로 되돌리면 받는 날에 따라 11번만 보일 수 있음
   - → 결정 (2026-10-14, 회고 결정 #21): "최근 12번(2년), 요청 기간 3년, 새 도움말 문구"로 확정, 새 ADR-0108(Accepted, ADR-0089의 범위·기간 부분을 바꿈) [확정] (사용자 승인, 2026-10-14). 3년의 이유: 제안 → 승인 (2026-10-14). spec·design-delta·`docs/current`의 3년 [안]을 [확정]으로 바꿈
2. **같은 달 안 책 순서**
   - [안] 지금처럼 "나중 등록 먼저"(등록일 늦은 순) 유지
   - 트레이드오프: 바꿀 일 없음, 분야도 이미 섞여 보임. 다만 국립중앙도서관 웹 목록과 거의 거꾸로임. 웹과 같게 하려면 `pick`에 응답 순서 칸 하나(예 `answer_order`)와 정렬 변경이 필요(배포 전이라 `picks/001` 고치기 가능)
   - → 결정 (2026-10-14, 회고 결정 #22): 지금처럼 "나중 등록 먼저" 유지 [확정] (사용자 승인, 2026-10-14). backlog 줄은 넣지 않음
3. **배포 전 사서추천 할 일 (사이클 17 첫 배포에 넣을지)**
   - [안] 사이클 17 체크리스트에 넷을 넣음: ① 표지 이용 조건은 국립중앙도서관 Open API 이용안내·공공누리 표기를 한 번 확인하고(문의는 하지 않음), 내림 요청이 오면 그 표지를 지움 ② 권리자 연락처는 로고 내림 요청과 같은 서비스 연락처 하나 ③ User-Agent에 서비스 주소 붙이기 ④ 인증키는 새로 받아 운영 비밀값에만 둠(지금 키는 개발용으로만)
   - 트레이드오프: ①은 문의를 안 해 빠르지만 표지 그림에 공공누리가 해당하는지 확실하지 않을 수 있음(안 되면 표지를 끄고 제목 글자로). ④는 몇 분 일이지만 대화 기록에 남은 키를 운영에 쓰지 않게 됨
   - → 결정 (2026-10-14, 회고 결정 #23): [안]은 미승인, 사용자 "어짜피 api받았으니까 괜찮아.... 키 같은 것은 따로 설정으로 빼던가". 표지 이용 조건·권리자 연락처 확인은 따로 하지 않음. 인증키는 지금 키를 쓰되 코드에 넣지 않고 설정(운영 비밀값)으로 뺌 [확정] (사용자 제안, 2026-10-14). User-Agent에 서비스 주소는 따로 말씀 없음 — backlog 줄에 [안]으로 남김
4. **없는 주소 화면(`*` 경로)**
   - [안] backlog에 넣고 첫 배포 전 작은 일로(간단한 "없는 주소예요 + 처음으로" 한 화면)
   - 트레이드오프: 지금은 없는 주소가 빈 화면이지만 배포 전이라 밖에 옛 링크(`/popular`)가 없음. 배포 뒤에는 잘못 친 주소가 빈 화면이 됨
   - → 결정 (2026-10-14, 회고 결정 #24): backlog에 "첫 배포 전 작은 일"로 넣음 [확정] (사용자 승인, 2026-10-14)
