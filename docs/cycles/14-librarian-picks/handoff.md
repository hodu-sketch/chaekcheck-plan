# 개발 인계서: 사이클 14 인기 도서 → 사서추천도서 (출처 바꾸기)

- 승인: [확정] (사용자 "승인", 2026-10-12, 인계서 검토 — ADR-0092와 함께)
- **시작 조건** [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-worktree-decisions.html` #1~#4 — 처음 정한 "12·13 뒤에, worktree 따로 안 만듦"을 바꿈)
  - **지금 바로, 따로 만든 git worktree·브랜치와 따로 켠 DB에서** 개발합니다. 사이클 11 측정, 사이클 12·13 작업 폴더의 파일·브랜치·커밋 안 한 변경은 건드리지 않습니다.
  - worktree 폴더 `../chaekcheck-dev-c14`, 브랜치 `cycle-14-librarian-picks`, 시작 커밋은 dev 기본 브랜치의 지금 최신 커밋 [확정]
  - **docker는 프로젝트 이름을 따로**: worktree에서 docker 명령은 늘 `docker compose -p chaekcheck-c14 …`(프로젝트 이름 순서는 `-p` → `COMPOSE_PROJECT_NAME` → 파일의 `name:`, https://docs.docker.com/compose/how-tos/project-name/ 2026-10-12 확인). 켜기·끄기 전에 `docker compose ls`로 프로젝트를 확인. **원래 프로젝트 `chaekcheck`은 켜고 끄지 않습니다** [확정]
  - worktree `.env`(git 밖, 새로 만듦): `DB_PORT=5452`, `TEST_DB_PORT=5453`, 그 밖의 DB 이름·계정은 원래 `.env`와 같게, `CHAEKCHECK_PICKS_FETCH_ENABLED=false`, 인증키 `CHAEKCHECK_PICKS_NLK_API_KEY`는 **사용자가 직접**. 서버 8082(실행할 때 `--server.port=8082` 등, 방법은 dev가 정함 [안]), 웹 5176 + `API_PROXY_TARGET=http://localhost:8082` [확정 번호] (번호는 사이클 13 `chaekcheck-13` 5442~5444와 겹치지 않게 바꿈, 사용자 승인 2026-10-12, `easy/2026-10-12-worktree-ports-decisions.html`). **원래 폴더 `.env`는 건드리지 않음**(특히 `CHAEKCHECK_POPULAR_FETCH_ENABLED=false` 줄)
  - 새 `db`(5452)에는 원래 서비스 DB를 **한 번 복사**합니다(약 8.5~10GB). 사이클 11의 `pg_dump -Fc` 방법을 쓰고, 원래 DB는 읽기만. **사이클 11 측정 라운드가 쉬는 때에 사용자에게 알리고** 합니다 [확정]. 처음 켤 때 `docker volume ls`로 저장 공간이 `chaekcheck-c14` 쪽에 따로 생겼는지 확인 [확인 필요: 프로토타입 — 공식 문서에서 확인 못 함]
  - 시험 DB(5453)는 tmpfs라 메모리를 씀 → 다 쓰면 `-p chaekcheck-c14`로 끔
  - 아래 단계에서 "로컬 `db`·`db-test`"는 모두 **이 worktree의 5452·5453**을 뜻합니다(0단계 정리, 1단계 측정, 7단계 받기 시험 포함)
  - **합치기** [확정]: 12·13이 먼저 기본 브랜치에 들어가면 이 브랜치를 그 위로 rebase하고 작은 충돌(master 끝줄, `AboutPage.tsx` 문단, `ModularityTests`·`AuthEnabledSecurityTests`, `docs/plan-feedback.md` 끝)을 풉니다. 13이 새로 만든 `application-library-insert.yml`의 `chaekcheck.popular.*` 줄도 이때 지웁니다. 14가 먼저 끝나면 반대로 13이 rebase합니다. 합친 뒤 원래 `db`·`db-test`(5432·5433)에서 0단계 DB 정리를 한 번 더 합니다(원래 DB에는 아직 `popular` 표가 있음)
  - 이 인계서는 plan `docs/cycles/14-librarian-picks/handoff.md`에만 있습니다. `docs/current/handoff.md`에는 알림 한 줄과 링크만 둡니다
  - 시작할 때 master 맨 끝 include와 `catalog` 코드(`BookLookup`, `JdbcBookLookup`, `catalog/normalize/*`)를 봅니다. plan 읽기(2026-10-12): master 맨 끝 `collection/005-import-export.yaml`(85-88행), `popular/001-popular-schema.yaml`은 81-84행
## 요약

국립중앙도서관 사서추천도서를 새 모듈 `picks`가 받습니다.
- 받는 때: 매주 월요일 05:00. 실패하면 성공할 때까지 매일, 서버가 꺼져 놓친 주는 따라잡음(ADR-0092)
- 받는 방법: Open API `saseoApi.do`에 요청 1건(등록일 2년 범위)으로 최근 추천 6번(지금 52권)
- 저장: `picks` 스키마 표 셋(`fetch_run`, `pick`, `cover`). 표지는 폭 200px JPEG
- 맞추기: 공용 캐시를 만들 때 ISBN → 본제목 + 첫 저자
- API: `GET /api/v1/picks`, `GET /api/v1/picks/covers/{coverId}`

사이클 10의 `popular` 모듈은 모두 지웁니다(출판유통통합전산망 코드·시험 자료·changeset·로컬 DB 표·환경 변수). `catalog`에는 공개 조회 `BookLookup.byTitleAndAuthor` 하나만 더합니다. 웹은 `/popular` → `/picks`, 머리 링크·이름 "사서추천도서", 순위 칩 없앰, 문구 바꿈. 격자·세모·S14·S15 구조는 그대로입니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다.
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) **조용히 바꾸지 말고** 먼저 사용자에게 알리고, 내용과 이유를 dev `docs/plan-feedback.md`의 **새 `# 사이클 14` 절**에 적습니다. 사용자 발언이면 그대로 옮깁니다.
- `[안]`·`[안 이름]`·`[안 경로]`는 dev가 코드에 맞춰 바꿀 수 있습니다. 바꾸면 `# 사이클 14` 절에 알리기만 합니다.
  - 해당 예: `picks` 안쪽 패키지·클래스 이름(`NlkClient`, `SaseoXmlParser`, `FetchDecision`, `FetchScheduler`, `FetchJob`, `PicksStore`, `PicksCache`, `PicksController`, `PicksErrors`, `PicksProperties`, `PicksChanged`), 제목 키 함수 이름(예 `CatalogText.pickTitleKey`), changeset id, 제약 이름, 픽스처 파일 이름, 웹 컴포넌트·폴더 이름, 시험 클래스 이름, 운영 메모 문서 경로
  - **바꾸지 않는 것** [확정] (사용자 승인 "이름·값: … 승인", 2026-10-12, design-delta)
    - 모듈 `picks`, 스키마 `picks`
    - 표 `fetch_run`·`pick`·`cover`와 칸 이름·제약(design-delta "데이터" 표)
    - changelog 경로 `db/changelog/picks/001-picks-schema.yaml`
    - `fetch_run.status` `SUCCEEDED`·`FAILED`, `trigger` `STARTUP`·`SCHEDULED`·`RETRY`·`CATCH_UP`, `failure_reason` `key_missing`·`network_error`·`request_rejected`·`format_changed`·`incomplete`·`no_books`
    - 공개 API `BookLookup.byTitleAndAuthor(Collection<TitleAuthor>) → List<TitleAuthorBook>`, 레코드 `TitleAuthor(String title, String author)`·`TitleAuthorBook(TitleAuthor query, long bookId, long[] libraryIds)`
    - 분류 `PickCategory` 코드·이름·순서(`ALL` 전체, `11` 문학, `6` 인문, `5` 사회, `4` 자연, `425` 테마)
    - 설정 키 `chaekcheck.picks.fetch.enabled`·`chaekcheck.picks.fetch.api-key`, 환경 변수 `CHAEKCHECK_PICKS_FETCH_ENABLED`·`CHAEKCHECK_PICKS_NLK_API_KEY`
    - 경로 `/api/v1/picks`·`/api/v1/picks/covers/{coverId}`, 오류 코드 `cover_not_found`
    - 응답 칸 `fetchedAt`, `categories[].code·name·books[]`, `recomNo`, `category`, `recommendedMonth`, `title`, `coverUrl`, `bookId`, `available`
    - 화면 경로 `/picks`
    - 일정: cron `0 0 5 * * *`, Asia/Seoul, 판단 규칙(ADR-0092, 아래 3단계 5)
    - 제한 값(아래 C4)
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 확정된 것처럼 코드에 넣지 말고 `TODO(확인 필요)`로 둔 뒤 확인하고 보고합니다.
- **새 의존성 없음**: HTTP는 `java.net.http.HttpClient`, XML은 JDK 내장 파서(StAX 또는 DOM), 그림은 `javax.imageio`와 지금 `CoverResizer`, 가짜 서버는 JDK `com.sun.net.httpserver.HttpServer`나 가짜 구현(사이클 10과 같음)
- 단계마다 통과해야 다음 단계: 백엔드 `backend/`에서 `./gradlew build`(`ModularityTests`·`DocumentationTests` 포함), 웹 `web/`에서 `npm test`, `npm run build`, `npm run lint`
- **구현 기준은 `design-delta.md`**. `architect-proposal.md`는 결정 기록일 뿐
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), 사이클 05~13 인계서의 제약을 그대로 따릅니다. 아래에는 더하거나 바뀌는 것만 적습니다.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/14-librarian-picks/design-delta.md`: **기준 문서**. "먼저 알릴 것", 구조 그림(모듈, 받기 흐름, 화면·캐시 흐름, 받기 판단 상태, 도메인, 표), 모듈 표, 데이터 표, API·응답 예시, 웹, 설정·인증키, 외부 연동, 확인 필요
- `.../14-librarian-picks/spec.md`: R1~R7, 상태별 동작, AC, 비목표
- `.../14-librarian-picks/flow.md`: 머리, S13·S13c·S13i·S14·S15·S12에서 바뀌는 것
- `.../14-librarian-picks/scope.md`
- `.../10-popular-books/handoff.md`·`spec.md`·`flow.md`·`retro.md`: 여기 적지 않은 규칙은 사이클 10 그대로(C10). retro "새로 알게 된 제약"(db-test 연결 한도, 한글 헤더 값 거절)도 그대로
- `../chaekcheck-plan/docs/research/popular-books/alternatives.md` 3-0절(API 호출 모양, 실제 응답 항목 이름 `recomtitle` 등, 표지 http→https), 3-1절(맞추기 방법·측정값)
- ADR (`../chaekcheck-plan/docs/adr/`): 0089, 0090, 0091, 0092

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0089 | 국립중앙도서관 Open API, 새 모듈·스키마 `picks`(`fetch_run`, `pick`, `cover`). `popular` 모듈·표·`popular/001`·출판유통통합전산망 코드·시험 자료를 지우고 `picks/001`을 새로(배포 전 규칙), 로컬 DB는 손으로 정리. 분류 고정 6개 + 모르는 분야 코드는 "전체"와 맨 뒤 새 분류. `bnk.kpipa.or.kr` 요청 0. 0072·0073·0080 대체 |
| 0090 | 짝은 저장하지 않고 공용 캐시를 만들 때 ① `byIsbn13` ② `byTitleAndAuthor`. 후보 여럿이면 가진 도서관 가장 많은 책, 같으면 책 번호 작은 책. 이용자별 계산은 캐시하지 않음. 0074 대체 |
| 0091 | 표지는 국립중앙도서관 표지 → 제목 글자. 새 표지만 1초 간격, 200px JPEG, 원본 5MB·1,600만 화소, https·`www.nl.go.kr`·`/afile/`만, redirect 안 따름, 안 쓰는 표지 지움, CSP 그대로. 0081 대체 |
| 0092 | 받기 판단: 목록 없음 / 월요일 / 마지막 받기 실패 뒤 성공 없음(매일 다시) / 마지막 성공 7일 초과(따라잡기). ADR-0089의 "다음 날 한 번 더"를 바꿈 |

## 지켜야 할 제약

- **C1. 모듈 경계** [확정] (design-delta "모듈")
  - 새 모듈은 `picks` 하나: `@ApplicationModule(allowedDependencies = {"catalog", "catalog :: normalize", "library"})`. `catalog :: normalize`는 `Isbn.toIsbn13`에 씀(`collection` 선례)
  - `picks`에는 Java 공개 API가 없음(REST만). 다른 모듈은 `picks`에 기대지 않음. 새 이벤트 없음. 캐시 새로 고침 알림은 모듈 안 인터페이스(지금 `RankingChanged`처럼)
  - JPA 엔티티 없이 `JdbcClient`. 다른 스키마와 FK·조인 없음, `catalog`와는 값으로만 맞춤
  - `catalog`는 공개 인터페이스 `BookLookup`에 메서드 하나와 레코드 둘만 더함. 표·색인 변경 없음
- **C2. Liquibase: 배포 전 규칙으로 옛 changeset을 지움** [확정] (ADR-0089)
  - `popular/001-popular-schema.yaml`과 master include(지금 81-84행)를 지우고 `picks/001-picks-schema.yaml`을 새로 둠
  - 다른 적용된 changeset은 고치지 않음. `catalog` 등 다른 스키마는 그대로, 다시 가져오지 않음
  - `updated_at` 칸이 없으므로 트리거 없음. 세미콜론이 들어갈 수 있는 `sql` change는 `splitStatements: false`
- **C3. 테스트는 진짜 API·표지를 부르지 않음** [확정]: 픽스처 XML과 가짜 전송만. `chaekcheck.picks.fetch.enabled`는 `application-test.yml`·`application-collection-import.yml`·로컬 `.env`에서 false(기본값 true). 받기를 켠 채 시험하는 클래스는 그 클래스 안에서만 켜고 가짜 전송을 넣음
- **C4. 예의 바른 받기와 제한 값** [확정] (design-delta "설정·인증키", ADR-0091)
  - 목록 요청은 받기 한 번에 **1건**: `GET https://nl.go.kr/NL/search/openApi/saseoApi.do?key=…&startRowNumApi=1&endRowNumApi=1000&start_date=<오늘-2년 YYYYMMDD>&end_date=<오늘 YYYYMMDD>`
  - 연결 5초, 읽기 10초, 목록 본문 10MB
  - 표지: 저장 안 된 것만, 요청 사이 **1초 이상**, 단일 스레드. 원본 5MB, 1,600만 화소, 폭 200px JPEG(품질 0.8)
  - 표지 주소 검사: http → https로 바꾼 뒤 호스트가 정확히 `www.nl.go.kr`이고 경로가 `/afile/`로 시작하는 것만(`..`·다른 스킴·포트·사용자 정보가 있으면 거절 [안]). redirect 안 따름(`followRedirects(NEVER)`). 검사에 안 맞으면 `pick.cover_source` NULL
  - 목록 요청도 redirect를 따르지 않고 3xx는 `request_rejected` [안]
  - User-Agent는 지금 값 `book search service`(서비스 주소는 배포 때, `TODO(확인 필요)`)
  - 캐시 10분마다 새로 고침
- **C5. 인증키는 비밀값** [확정] (spec R1-7)
  - 키 값은 `.env`(git 밖)에 **사용자가 직접** 넣음. dev는 키 값을 코드·설정 파일·`.env.example`·문서·커밋·`plan-feedback.md`·대화 어디에도 적지 않음. `.env.example`에는 이름과 빈 값만
  - 키가 비면 요청을 보내지 않고 `fetch_run` `FAILED`/`key_missing` 한 줄 + WARN 한 줄
  - 키가 쿼리(`key=`)에 들어가므로: 로그에는 키를 뺀 경로(또는 `key=***`)만, 예외 메시지·`failure_detail`에 요청 URI·응답 본문을 넣지 않음(HTTP 상태와 API 오류 코드만), 설정 클래스 `toString`에서 키 가림, `HttpClient`·Spring 요청 로그(DEBUG 포함)가 URI를 찍지 않는지 봄
  - 로그를 붙잡아 키 문자열이 없는지 보는 시험 하나
- **C6. 바깥 XML은 믿지 않는 입력** [확정]: DTD·외부 엔티티 끔(StAX `SUPPORT_DTD=false`, `IS_SUPPORTING_EXTERNAL_ENTITIES=false`). 글자 값만 꺼냄. 목차(`recommokcha`)·추천 글(`recomcontens`) HTML은 저장·게시하지 않음. 웹에서 `dangerouslySetInnerHTML` 쓰지 않음
- **C7. 출판유통통합전산망 요청 0건** [확정] (spec R1-6, AC-12): `bnk.kpipa.or.kr` 주소, `Kpipa*` 코드, 픽스처가 저장소에 남지 않음(`docs/plan-feedback.md` 지난 기록만 예외)
- **C8. 예약 스레드** [확정] (사이클 10 C9 그대로): `picks` 자기 단일 스레드 실행기, 겹침은 `AtomicBoolean`
- **C9. 캐시 새로 고침 실패**: 앞 캐시 그대로, 경고 로그만(사이클 10과 같음) [안]
- **C10. 바꿔 끼우기와 부딪힘**: 사이클 08 바꿔 끼우기 중에는 `byIsbn13`·`byTitleAndAuthor`가 `lock_timeout` 2초까지 기다릴 수 있음 → C9로 처리

## 개발 시작 전 확인

### dev가 확인할 것
- [ ] worktree를 만든 시작 커밋을 `# 사이클 14` 절에 적음. 원래 폴더의 `git status`·브랜치는 건드리지 않음
- [ ] base package `com.chaekcheck`, 새 모듈 패키지 `com.chaekcheck.picks` [확정]
- [ ] master 맨 끝 include(plan 읽기: `collection/005-import-export.yaml`). 12·13이 더한 것이 있으면 그 뒤에 `# cycle 14` 주석과 `picks/001` [안 위치]
- [ ] `catalog` 공개 API·`normalize`가 12·13 뒤 어떤 모양인지: `BookLookup`, `IsbnBook`, `JdbcBookLookup`, `CatalogText`(`titleNorm`, `mainTitleNorm`, `nameExact`), `Contributors.parse`, `Isbn.toIsbn13`. 사이클 12가 `title_norm`·`book_contributor.name_exact`의 뜻을 바꿨으면 1단계 전에 보고
- [ ] 로컬 `db`·`db-test`의 `databasechangelog`에서 `id LIKE 'popular-001-%'` 줄(plan 읽기: `popular-001-schema`, `popular-001-fetch-run`, `popular-001-ranking`, `popular-001-cover`)

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| `.env`에 `CHAEKCHECK_PICKS_NLK_API_KEY=<키>`를 직접 넣기(dev는 값을 보지도 적지도 않음) | 0단계 | 넣었다는 알림만 |
| 진짜 API 받기 시험 승인(하루 최대 1번, 요청 1건 + 새 표지 52장 안팎, 1초 간격) | 3단계 픽스처 받기, 7단계 | 승인 |
| 화면 확인: 표지 화질, 흐림, 문구, 폰 머리 겹침(Samsung Internet, `web-lan-5174`) | 7단계 | 바꿀 점 |
| 국립중앙도서관 표지·API 데이터 이용 조건 확인(공식 문서 / 문의 정보기술기반과 02-590-0727) | 배포 전(이 사이클을 막지 않음) | plan에 알림 |

## 구현 단계

### 0단계: 로컬 DB 정리와 환경 변수 (코드 변경 없음)

1. **로컬 DB 정리** [확정] (ADR-0089): `db`(5432)와 `db-test`(5433) 각각에서
   - `DROP SCHEMA popular CASCADE;`
   - `DELETE FROM databasechangelog WHERE id LIKE 'popular-001-%';`
   - 다른 스키마는 건드리지 않음. 지운 줄 수를 `# 사이클 14` 절에
   - **주의**: 1단계의 `./gradlew build`는 아직 master에 남은 `popular/001`을 `db-test`에 다시 적용함 → **2단계 끝에 `db-test`에서 같은 SQL을 한 번 더**(tmpfs로 새로 만들어지면 그것으로 됨). `db`에 붙는 `bootRun`은 2단계가 끝날 때까지 하지 않음
2. **환경 변수** (로컬 `.env`, `.env.example`)
   - `.env`에서 `CHAEKCHECK_POPULAR_FETCH_ENABLED`를 지움. **이때부터 2단계 전까지 `bootRun` 금지**(`popular` 코드 기본값이 true라 켜지면 `bnk.kpipa.or.kr`를 부름, C7. 시험은 `application-test.yml`이 false라 괜찮음)
   - `.env`에 `CHAEKCHECK_PICKS_FETCH_ENABLED=false`. 키 `CHAEKCHECK_PICKS_NLK_API_KEY`는 **사용자가 직접**(C5)
   - `.env.example`: 53행 `CHAEKCHECK_POPULAR_FETCH_ENABLED=false` → `CHAEKCHECK_PICKS_FETCH_ENABLED=false`("로컬은 꺼 둠, 받기 시험 때만 true"), `CHAEKCHECK_PICKS_NLK_API_KEY=` 빈 값("국립중앙도서관 Open API 인증키, 값은 커밋하지 않음")
- 위험: 낮음 (키 유출 → C5)

### 1단계: `catalog` 공개 API `BookLookup.byTitleAndAuthor` (의존: 0단계)

1. **제목 키 함수** (`catalog/normalize/CatalogText.java`, 이름 예 `pickTitleKey` [안 이름]): 앞 괄호 관제(`〈…〉`·`<…>`·`[…]`·`(…)`)를 떼고, 그 뒤 처음 나오는 `:`·`(`·`[`·`=` 앞까지, NFKC, 공백·기호 빼고 소문자. `mainTitleNorm`과 규칙이 다르므로 고치지 않고 새로 둠. 정확한 괄호 종류·기호 범위는 plan 측정 규칙(`research/popular-books/kpipa.md` 4절)에 맞추고 차이는 보고 [안]
2. **첫 저자**: `catalog` 안에서 `Contributors.parse(author)`의 첫 이름, 역할어는 지금 `ROLE_WORDS`로 뗌. `CatalogText.nameExact`와 같은 정규화로 `book_contributor.name_exact`와 맞댐 [안]
3. **인터페이스** (`catalog/BookLookup.java`, 레코드 `TitleAuthor.java`·`TitleAuthorBook.java` 같은 패키지 [안 위치])
   - `List<TitleAuthorBook> byTitleAndAuthor(Collection<TitleAuthor> queries)` [확정]. 질의는 원문 그대로
   - 결과: 키가 같고 첫 저자가 그 책 저자에 있는 책 전부. 맞는 책 없는 질의는 결과에서 빠짐, 빈 입력이면 빈 목록, 제목 키가 비거나 첫 저자가 없으면 찾지 않음 [안]. 하나 고르기(R3-2)는 `picks`
   - Javadoc: "for the popular books (ADR-0074)" → 사서추천(ADR-0090), "Titles are not matched" 지움. `catalog/package-info.java`의 popular 언급도 picks로
4. **구현** (`catalog/internal/JdbcBookLookup.java`): `title_norm`(pg_bigm)으로 후보를 좁히고 Java에서 제목 키·`book_contributor.name_exact` 비교. 좁히는 방법은 dev가 정하고 `EXPLAIN ANALYZE` 보고 [안]. 한두 글자 제목 시험. 읽기 전용, 표·색인 추가 없음 [확정]
- 테스트
  - `CatalogTextTests`(키): 앞 괄호 관제, `:`·`(`·`[`·`=`, 공백·기호, 대소문자
  - `BookLookupTests`(`db-test`): 같은 키 + 저자 있음 → 나옴 / 저자 다름 → 안 나옴 / 부제 다른 같은 본제목 → 나옴 / "홍길동 지음" → 나옴 / 후보 둘 → 둘 다 / 빈 입력 → 빈 목록 / 같은 질의 두 번 → 같음 / 기존 `byIsbn13` 시험 전부 통과
- **측정** (결과는 `# 사이클 14` 절에)
  - 테스트 쪽 일회용 러너 `LocalPicksMatchRunner` [안 이름]: 환경 변수가 있을 때만, 빌드에서는 안 돎, 로컬 `db`에 붙음(`bootRun` 안 씀)
  - 입력: plan이 받아 둔 `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\librarian-picks\saseo-all-2026-10-12.csv`의 추천 연월 2025.12~2026.10 52권. 진짜 API 안 부름
  - 잴 것: `byIsbn13` 한 번과 `byTitleAndAuthor` 52건(①로 못 맞은 것만, 그리고 전부)의 시간, 맞은 권수(① / ①이나 ②, plan 수집 DB 측정 **29 / 32 (61.5%)**), 후보 여럿인 책 수, plan과 다른 책 목록과 이유 추정. 느리면 보고(대안은 캐시 간격만 늘림)
- 위험: 중간 (규칙·속도)

### 2단계: `picks` 뼈대, `picks/001`, `popular` 지우기 (의존: 1단계)

1. **`popular` 지우기**
   - 지울 것: `backend/src/main/java/com/chaekcheck/popular/` 전부, `backend/src/test/java/com/chaekcheck/popular/` 전부(`FakeKpipaSite`, `KpipaFixtures`, `KpipaClientTests`, `PopularParserTests`, `LocalCoverResizeRunner` 포함), `backend/src/test/resources/fixtures/kpipa/`, `db/changelog/popular/001-popular-schema.yaml`과 master include(81-84행), `application.yml`의 `chaekcheck.popular.*`(186-218행), `application-collection-import.yml` 14-15행, `application-test.yml`의 popular 설정
   - **먼저 옮겨 다시 쓰는 것**(`picks` 안으로, 이름 [안]): `CoverResizer`와 그 시험, `BodyLimit`, `RequestPacer`(간격 1초), 예약·실행 중 표시, 캐시 틀(`PopularCache` → `PicksCache`), `PopularPlanParams`·`PopularErrors`·`CoverNotFoundException`·`InvalidPopularParamException`, `FetchTrigger`
2. **모듈 선언** (`picks/package-info.java`): `@ApplicationModule(allowedDependencies = { "catalog", "catalog :: normalize", "library" })` [확정]. Javadoc: 책임, ADR-0089~0092, 키는 비밀값. 안쪽 패키지 [안]: `internal/fetch`, `schedule`, `store`, `cover`, `cache`, `web`
3. **Liquibase** (`db/changelog/picks/001-picks-schema.yaml` [확정 경로], master 맨 끝에 `# cycle 14: librarian picks (ADR-0089)` + include [안 위치])
   - `CREATE SCHEMA picks`
   - 표·칸·제약은 design-delta "데이터" 표 그대로
     - `fetch_run`: identity PK, `trigger` CHECK 넷, `status` CHECK 둘, `failure_reason` CHECK 여섯 + "`FAILED`일 때만 NOT NULL", `(status = 'SUCCEEDED') = (changed IS NOT NULL)`, `failure_detail`·`new_category_codes` NULL, 개수 칸 여섯(`request_count`·`received_count`·`kept_count`·`missing_isbn_count`·`cover_fetched_count`·`cover_failed_count`) NOT NULL DEFAULT 0 `>= 0`, `started_at`·`finished_at` NOT NULL, 색인 `(status, started_at)`
     - `pick`: `recom_no text` PK CHECK `^[0-9]{1,20}$`, `dr_code` NOT NULL `length` 1..20, `dr_code_name` NULL, `recom_month date` NOT NULL 1일 CHECK, `registered_on date` NULL, `title` NOT NULL, `author`·`publisher` NULL, `isbn13` NULL CHECK `^97[89][0-9]{10}$`, `cover_source` NULL CHECK `LIKE 'https://www.nl.go.kr/afile/%'`
     - `cover`: identity PK, `source_url` NOT NULL UNIQUE, `content_type` NOT NULL, `image bytea` NOT NULL, `byte_size >= 0`, `fetched_at` NOT NULL
   - `pick`–`cover`는 FK 없이 `cover_source = source_url` [확정]. changeset id `picks-001-*`, 제약 이름은 `postgres-patterns` 관례 [안 이름]
   - 파일 머리 주석: 사이클 14, ADR-0089·0091, "`popular/001`을 대체(배포 전 규칙)"
4. **분류 상수** (`picks/internal/PickCategory.java` [안 위치]) [확정 값]: `ALL` 0 "전체", `11` 1 "문학", `6` 2 "인문", `5` 3 "사회", `4` 4 "자연", `425` 5 "테마". 모르는 코드는 enum 밖에서(3·5단계)
5. **설정** (`application.yml`, `application-collection-import.yml`, `application-test.yml`, `picks/internal/PicksProperties.java` [안 이름])
   - 키 이름 [확정]: `chaekcheck.picks.fetch.enabled: ${CHAEKCHECK_PICKS_FETCH_ENABLED:true}`, `chaekcheck.picks.fetch.api-key: ${CHAEKCHECK_PICKS_NLK_API_KEY:}`
   - 값 [확정] (키 위치 `chaekcheck.picks.fetch.*` [안]): `cron "0 0 5 * * *"`, `zone Asia/Seoul`, `base-url https://nl.go.kr`, `window 2y`, `end-row 1000`, `connect-timeout 5s`, `read-timeout 10s`, `max-body-size 10MB`, `cover-max-body-size 5MB`, `cover.width 200`, `cover.jpeg-quality 0.8`, `cover.max-pixels 16000000`, `cover.request-interval 1s`, `user-agent "book search service"`(`TODO(확인 필요)` 배포 때 주소), `chaekcheck.picks.cache.refresh-interval 10m`
   - `collection-import`·`test`는 `enabled: false`. `PicksProperties.toString()`에서 `apiKey` 가림
6. **기존 시험 고침**: `ModularityTests`(33-40행) `popular` → `picks`(의존 `catalog`·`catalog :: normalize`·`library`, 다른 모듈은 `picks`를 모름), `DocumentationTests` 32행 `module-popular.puml` → `module-picks.puml`, `AuthEnabledSecurityTests` 29-30·68·76-88행 → `/api/v1/picks`·`/api/v1/picks/covers/{id}`(5단계에서 채움)
7. **`db-test` 다시 정리**(0단계 주의)
- 테스트: `PicksSchemaTests` [안 이름] — `failure_reason`·`changed` 조건, 틀린 `trigger`, `recom_no` 21자리·글자, `dr_code` 빈 값·21자, `recom_month` 1일 아님, 틀린 `isbn13`, `cover_source` `http://`·다른 호스트, 같은 `source_url` → 모두 위반. `./gradlew build` 뒤 `db-test`에 `popular` 스키마 없음(AC-22 일부)
- 위험: 중간 (옮길 파일을 먼저 옮기고 지움)

### 3단계: 받기 — 클라이언트, XML, 판단, 실행, 기록 (의존: 2단계)

1. **픽스처 받기** (사용자 승인 뒤 **진짜 API 1건**, 그날의 받기 시험 1번으로 셈)
   - `backend/src/test/resources/fixtures/nlk/saseo-2y.xml` [안 경로]. 저장 전에 응답에 키가 없는지 봄(있으면 지우고 보고)
   - 손으로 줄인 시험 파일: 6개 달 52권 정상 / 8개 달 / 0권 / `totalCount` > 받은 수 / `<channel>`·`<item>` 없음 / 모르는 `drCode` 999(이름 "새분야" / 빈 이름) / 같은 달·같은 등록일 둘 / ISBN 하이픈·10자리·빈 값 / `recomfilepath` http·다른 호스트·`/afile/` 밖 / DTD·외부 엔티티(XXE)
   - API 오류 응답(키 거절 등) 모양은 모름 [확인 필요: API 호출 시험]. 지금은 "200 아님" 또는 "`<channel>`/`<totalCount>` 없음 + 오류 코드 요소"를 `request_rejected`로 [안]. 틀린 키로 일부러 부르지 않음
2. **전송** (`picks/internal/fetch/NlkClient.java` [안]): `HttpClient` 연결 5초, 읽기 10초, `followRedirects(NEVER)`, 본문 10MB(`BodyLimit`). 요청마다 INFO 로그(방법, **키를 뺀 경로**, 응답 코드, 걸린 시간, 앞 요청과 간격). 오류 구분 [확정]: 키 없음 → `key_missing`(요청 안 보냄), `IOException`·시간 초과 → `network_error`, 200 아님·3xx·API 오류 코드 → `request_rejected`
3. **해석** (`picks/internal/fetch/SaseoXmlParser.java` [안]): XXE 끔(C6). `item`마다 `recomNo` → `recom_no`, `drCode`, `drCodeName`(빈 값 → NULL), `recomtitle`, `recomauthor`, `recompublisher`, `recomisbn` → `Isbn.toIsbn13`(안 되면 NULL, `missing_isbn_count`), `recomYear`·`recomMonth` → `recom_month`, `regdate`(`YYYY.MM.DD`) → `registered_on`(못 읽으면 NULL [안]), `recomfilepath` → https + C4 검사 → `cover_source`. 목차·추천 글은 읽지 않음. `totalCount` > 받은 수 → `incomplete`. `<channel>`·`<totalCount>` 없음, `recomNo`가 숫자 1~20자리가 아님, 제목 빈 값, 추천 연월 못 읽음 → `format_changed`(한 권이라도) [안]
4. **남기기 규칙** [확정] (spec R1-1, R2-5): 서로 다른 추천 연월 가운데 최근 6개 달의 책만(6개 미만이면 전부). 0권이면 `no_books`. `PickCategory`에 없는 `drCode`는 남기고 `new_category_codes`(쉼표, 코드 순)에 적음. `received_count` 받은 수, `kept_count` 남긴 수, `request_count` 목록 1 + 표지 요청 수
5. **판단** (`picks/internal/schedule/FetchDecision.java`, `Clock` 주입) [확정] (spec R1-2·R1-3·R1-5, ADR-0092): 05:00과 서버 시작 때 판단, 하나라도 맞으면 받음
   1. 저장된 목록 없음 → 시작 때 `STARTUP`, 05:00이면 `CATCH_UP` [안: trigger 값, 보고]
   2. 05:00이고 월요일 → `SCHEDULED`
   3. 05:00이고 마지막 받기가 `FAILED`이고 그 뒤 `SUCCEEDED` 없음 → `RETRY` (성공할 때까지 매일)
   4. 마지막 `SUCCEEDED`가 7일보다 오래됨 → `CATCH_UP`(시작 또는 05:00)
   - 같은 날 이미 성공했으면 받지 않음 [안]. 시작 때는 1·4만 봄(실패 뒤 다시는 05:00에만) [안]
6. **저장** (`picks/internal/store/PicksStore.java` [안], `JdbcClient`)
   - 실패: `pick` 그대로, `FAILED` 한 줄(`failure_detail`은 상태·코드만), `log.error`(R1-3, AC-11)
   - 성공: 남긴 목록이 지금 `pick`과 같으면(모든 칸이 같은 집합 [안]) `SUCCEEDED` + `changed=false`, 표지·캐시 그대로. 다르면 **한 트랜잭션**에서 `pick` 지우고 넣기 + `SUCCEEDED` + `changed=true`, 그다음 캐시 새로 고침
7. **실행과 예약** (`FetchScheduler`, `FetchJob`, `PicksConfiguration` [안]): `ApplicationReadyEvent`에서 판단 → 단일 스레드 실행기(앱 시작은 막지 않음). `@Scheduled(cron, zone)` 05:00 같은 판단. `enabled=false`면 시작 받기·예약 모두 안 함(캐시 새로 고침은 그대로). 겹침 `AtomicBoolean`(C8)
- 테스트 (진짜 API 없음)
  - `SaseoXmlParserTests` [안]: 픽스처 각각, XXE에서 외부 엔티티가 풀리지 않음
  - `FetchDecisionTests` [안] (날짜 고정): 빈 목록 + 시작 → `STARTUP` / 빈 목록 + 수요일 05:00 → 받음 / 월요일 05:00 → `SCHEDULED` / 월요일 실패 → 화요일 `RETRY` / 월·화 실패 → 수요일 `RETRY` / 월요일 성공 → 화요일 안 받음 / 마지막 성공 8일 전 + 시작 → `CATCH_UP`(AC-13b) / 6일 전 + 시작 → 안 받음 / 정확히 7일 경계
  - `NlkClientTests` [안] (JDK `HttpServer`): 쿼리(`startRowNumApi=1`, `endRowNumApi=1000`, `start_date`·`end_date` = 오늘-2년·오늘), 302 → `request_rejected`, 시간 초과 → `network_error`, 10MB 넘음 → 실패, 키 없으면 요청 0건 + `key_missing`
  - **키 가림 시험** [확정] (C5): 로그를 붙잡고(Logback `ListAppender` 등) 키 `test-secret-key-123` 같은 값으로 성공·`request_rejected`·`network_error`를 한 번씩. 로그 전체·예외 메시지·`failure_detail`·`PicksProperties.toString()`에 키 문자열 없음
  - `PicksFetchTests` [안] (`@SpringBootTest`, `db-test`, 가짜 전송, 이 클래스에서만 `enabled=true`): 성공 52권 `changed=true`·개수 칸 / 같은 응답 두 번 → `changed=false` / 0권 → `FAILED`/`no_books`, 앞 목록 그대로, 오류 로그(AC-11) / 오류 코드 → `request_rejected`(AC-11) / 999 → `new_category_codes`(AC-4b) / 8개 달 → 6개 달만(AC-17) / 가짜 전송에 기록된 호스트에 `bnk.kpipa.or.kr` 없음(AC-12)
  - `PicksStartupFetchTests` [안]: 빈 상태로 띄우면 `STARTUP` 받기·기록(AC-13), `enabled=false`면 요청 0건
  - db-test 연결 한도: 새 `@SpringBootTest` 클래스는 기존 문맥을 함께 쓰거나 `@DirtiesContext`(사이클 10 회고)
- 위험: 중간

### 4단계: 표지 (의존: 3단계)

1. **표지 받기** (`picks/internal/cover/CoverFetcher.java` [안], 옮긴 `CoverResizer`): `changed=true` 저장 뒤에만. 지금 `pick.cover_source` 중 `cover.source_url`에 없는 것만, 요청 사이 1초 이상(C4). 검사 [확정]: https, `www.nl.go.kr`, `/afile/`, redirect 안 따름(3xx 실패), 본문 5MB 이하, 200이고 `Content-Type`이 `image/`. `javax.imageio`로 읽음(최근 52권은 JPEG 41·PNG 9·BMP 2). 1,600만 화소 넘거나 못 읽으면 실패로 셈. 폭 200px JPEG 0.8로 저장(더 좁으면 폭 그대로). 실패해도 받기는 성공, 그 책은 제목 글자
2. **정리**: 표지가 끝나면 지금 `pick`이 쓰지 않는 `cover` 줄을 지움 [확정] (ADR-0091). 그 `fetch_run`의 `cover_fetched_count`·`cover_failed_count`·`request_count` UPDATE, 캐시 새로 고침. 표지 받는 중 서버가 꺼지면 다음 `changed=true` 때 없는 것만 받음. `changed=false`인 주에는 실패 표지를 다시 받지 않음(바꾸려면 보고)
- 테스트 (`PicksFetchTests`에 더함, 가짜 표지 서버): 새 표지만 요청 / 간격 1초 이상 / BMP·PNG → JPEG 폭 200 / 5MB 넘음·302·`text/html`·화소 상한 → 실패 수, 목록은 성공 / 목록이 바뀐 뒤 안 쓰는 표지 지워짐 / 검사에 안 맞는 주소는 요청 0
- 위험: 중간

### 5단계: 공용 캐시, 맞추기, REST API (의존: 1·3·4단계)

1. **공용 캐시** (`picks/internal/cache/PicksCache.java` [안]): `fetchedAt` = 마지막 `SUCCEEDED`의 `finished_at`(`changed`와 무관) [확정], 분류 목록, 책마다 `recomNo`·`category`·`recommendedMonth`·`title`·`coverId`·맞춘 `(bookId, libraryIds)`. `AtomicReference`로 통째로. 새로 고침: 앱 시작, 10분마다, 목록이 바뀐 직후, 표지가 끝난 뒤. 실패하면 앞 값(C9)
2. **맞추기** [확정] (spec R3, ADR-0090): ① `byIsbn13`(한 번) ② ①로 못 맞은 책만 `byTitleAndAuthor`(한 번, 원문). 후보 여럿이면 `libraryIds` 길이 가장 긴 책, 같으면 `bookId` 작은 책(①에서 같은 ISBN 책이 여럿인 경우도 같은 규칙 [안]). 순수 함수 단위 시험. 새로 고침 한 번 시간을 INFO로
3. **정렬과 분류** [확정] (spec R2·R4-2): 책은 `recom_month` 최근 → `registered_on` 늦은 순(NULL은 뒤 [안]) → `recom_no` 글자 큰 순. 분류는 `ALL`(모든 책) → 11 → 6 → 5 → 4 → 425 → 새 코드(코드 순, 모두 숫자면 수로 [안]). 새 분류 이름은 그 코드 책의 `dr_code_name`, 비면 "기타". 0권 분류는 뺌
4. **컨트롤러** (`PicksController`, `PicksPlanParams`, `PicksErrors` [안], `Popular*`를 옮겨 이름만 바꿈)
   - `GET /api/v1/picks` [확정]: 계획 파라미터 검사(`/api/v1/books`와 같음, 400 `validation_error`), `LibraryCatalog.planSearch`(422 `invalid_region`), `available`은 요청마다(`bookId`가 있고 `libraryIds` ∩ 계획 ≠ ∅). 응답은 design-delta 예시 그대로, `fetchedAt` +09:00 ISO, `recommendedMonth` `YYYY-MM`, 목록 없으면 `{"fetchedAt": null, "categories": []}` [확정]. `month`·`rank` 없음
   - `GET /api/v1/picks/covers/{coverId}` [확정]: `image/jpeg`, `Cache-Control: public, max-age=2592000, immutable`, 없거나 숫자가 아니면 404 `cover_not_found`
   - 인증 없음(R7-3). `SecurityConfiguration`은 고칠 것이 없는지만 봄
- 테스트
  - `PicksCacheTests` [안]: ISBN 맞음 / ISBN 없음 + 제목·저자 맞음 / 후보 둘 → 도서관 많은 책, 같으면 번호 작은 책 / 실패 흉내 → 앞 값
  - `PicksApiTests` [안] (MockMvc, `db-test`): 빈 상태 200 빈 꼴 / 분류 순서·빈 분류 없음(AC-4) / 999 → 전체 + 맨 뒤 "새분야"·"기타"(AC-4b) / 같은 달 정렬 / `available` 네 경우(AC-6), 계획 바꾸면 바뀜(AC-7) / 400·422 / `coverUrl` 있음·null(AC-14b), 표지 200 + 헤더, 지운 표지 404
  - `AuthEnabledSecurityTests`: 로그인 켠 설정에서 쿠키 없이 두 경로 200, `Cache-Control` 그대로(AC-16)
- 위험: 중간

### 6단계: 웹 (의존: 5단계, 화면 조각은 가짜 응답으로 먼저 가능)

1. **API·타입** (`web/src/api/client.ts` 157-164행, `types.ts` 372행~, `popularRequests.test.ts`): `fetchPicks(plan, signal)` → `/api/v1/picks`. 타입 `Picks`·`PickCategory`·`PickBook` [안]: `month`·`rank` 빼고 `recomNo`·`category`·`recommendedMonth` 더함. 시험 파일 `picksRequests.test.ts` [안]
2. **경로·폴더** (`web/src/main.tsx` 20·42행): `<Route path="/picks" …>` [확정], `/popular`는 남기지 않음 [확정]. 폴더 `features/popular` → `features/picks` [안], 파일 옮기고 이름 바꿈(`PopularPage`, `CategorySection`, `CoverCard`, `CoverImage`, `CategoryPicker`, `PopularWindow`, `PopularBookDialog`, `RequestNotice`, `pickLibraryRows`, `popularPosition`, `popularText`, `usePopularPlan`, `testPopular`, CSS)
3. **머리** (`AppLayout.tsx` 12·25-27행, `AppLayout.module.css` 51행, `AppLayout.test.tsx`): 링크 "사서추천도서", `to="/picks"`, `aria-current` 맞춤, 숨기는 화면 그대로 [확정]. **320px에서 로그인 버튼과 겹치지 않는지** 확인 [확정], 겹치면 글자 크기·간격만 손보고 보고
4. **S13**
   - 숨긴 h1 "사서추천도서"(월·"판매 순위" 없음), 로딩 문구 "사서추천도서를 불러오는 중"
   - 상태 문구 [확정]: "아직 사서추천도서를 준비하고 있어요", "사서추천도서를 불러오지 못했어요. 잠시 뒤에 다시 해 주세요."
   - 카드 머리 [확정]: 분류 이름 + "1 - 9 / 10"(`CategorySection.tsx` 44·66행). 화면 읽기용 이름 [안] "문학 1~9번째 / 10권"
   - **순위 칩 없앰** [확정] (`CoverCard.tsx` 28-29행과 CSS). 있음/없음은 흐림 하나로만. 화면 읽기용 이름 [안] "제목, 전자책 있음/없음"
   - 표지는 `coverUrl`, null이거나 안 열리면 제목 글자 카드(AC-14·14b)
   - 출처 줄 [확정] (`popularText.ts` 5행): "출처: 국립중앙도서관 사서추천도서 (공공누리 제1유형) · 10월 12일 받음"(`fetchedAt`)
   - 새 분류도 같은 카드, 이름은 응답의 `name`. 마지막 쪽도 3×3 크기. 쪽·밀기·보던 자리는 그대로
5. **S13c·S13i** (`CategoryPicker.tsx` 15·24·42·76행): "? 순위 기준 보기" → "? 추천 기준 보기" [확정]. 도움말 [확정]: "국립중앙도서관 사서가 고른 신간 추천 도서 중 최근 6번 추천분이에요", "신간이라 아직 전자책이 없는 책도 있어요", "흐린 책은 검색하는 도서관에 전자책이 없어요", "있음/없음은 검색 화면에서 고른 지역·범위 기준이에요", 출처·받은 날. "종이책 순위라서 …"와 "2026년 9월 판매 순위"는 지움
6. **S14** (`PopularBookDialog.tsx` 97행): `book.rank`위 표시 지움. 제목 바로 아래, 지은이·출판사 위에 "2026년 10월 사서추천 · 문학" 한 줄(`recommendedMonth` + 분류 이름, 새 코드는 응답 분류 `name`) [확정]. 나머지 그대로
7. **S15**: 그대로(이름만 옮김)
8. **S12 `/about`** (`web/src/features/about/AboutPage.tsx`): 문단 하나 더함 [확정] "사서추천도서 목록과 일부 표지는 국립중앙도서관 자료(공공누리 제1유형)예요. 표지 게시를 원하지 않는 권리자는 [연락처]로" — 연락처는 `TODO(확인 필요)`. plan 읽기(2026-10-12)로는 사이클 10 출판유통통합전산망 문구가 없었음 → 있으면 바꾸고 없으면 더함
- 테스트 (Vitest, 가짜 응답)
  - `PicksPage.test.tsx`: 첫 9권·칩 없음·출처 줄(AC-1) / ◀ ▶·마지막 쪽(AC-2) / 분류 순서·새 분류 맨 뒤(AC-4·4b) / 흐림(AC-6) / 요청 주소 계획(AC-7) / 제목 글자 카드(AC-14·14b) / 빈 상태·오류 / "1 - 9 / 10" / "인기 도서"·"순위"·"출판유통" 글자 없음(AC-15)
  - `CategoryPicker.test.tsx`(AC-5), `PicksBookDialog.test.tsx`(추천 줄, AC-8·9·21), `RequestNotice.test.tsx`(AC-10), 폰 폭 흉내(AC-18), `AppLayout.test.tsx`(AC-15), `AboutPage.test.tsx`
- 위험: 중간 (옮기면서 회귀)

### 7단계: 확인 — 받기 시험, 측정, 화면 (의존: 1~6단계)

1. **로컬 DB 확인**(AC-22): `db`·`db-test`에 `popular` 스키마 없음, `popular-001-*` 적용 기록 없음, `picks-001-*` 있음
2. **진짜 받기 시험** (사용자 승인 뒤, **하루 최대 1번**, 키는 `.env`에서만): `picks` 표가 빈 상태에서 `CHAEKCHECK_PICKS_FETCH_ENABLED=true`로 `bootRun` → `STARTUP` 받기
   - 로그: 목록 요청 1건·응답 시간·크기, 표지 요청 수·간격(모두 1초 이상)·실패 수, **`bnk.kpipa.or.kr` 0건**(AC-12), **로그 전체에서 키 문자열 0건**(사용자가 로그에서 키를 찾아 보거나, dev가 키를 직접 보지 않고 `.env` 값을 읽어 세는 스크립트 [안])
   - `fetch_run` 줄, `pick` 권수·분류별 권수·추천 달(2026-10-12 기준 52권, 2025.12~2026.10, AC-17 — 새 추천이 올라왔으면 실제 값), `new_category_codes`, `cover` 장수·전체 크기
   - 끝나면 끄고, 다시 켜도 판단 조건이 아니면 요청 0건인지 봄
3. **측정** (`# 사이클 14` 절에, 재서 보고만): 캐시 새로 고침 시간(① + ②)·메모리, `GET /api/v1/picks` p50·p95·응답 크기, 서비스 DB 맞은 권수(① / ①이나 ②) vs plan 32/52, 계획 하나(서울 거주 [안])의 `available` 권수
4. **Playwright** 1280 → 768 → 375 → 320(데스크톱 먼저): 머리 "사서추천도서"와 320px 겹침, S13 3×3·칩 없음·카드 머리·세모·다음 분류(AC-3), S13c·"? 추천 기준 보기"·S13i, S14 추천 줄·3줄·[책 검색 >>] → S3 → 뒤로(AC-20), S15, 폰 밀기(AC-19)·뒤로 가기(AC-18), 표지 실패 칸, 로그아웃(AC-16), `/about`, `/popular`가 없는 경로로 처리됨
5. **사용자 실제 폰 확인**: 아래 완료 기준의 폰 줄
6. **dev 문서**: `docs/maintenance/4-popular.md` → 사서추천 운영 메모 [안 이름 `4-picks.md`, `README.md` 목차] (받기 켜고 끄기, 키를 넣는 곳(값은 적지 않음), `picks.fetch_run` 읽는 법과 `failure_reason`·`trigger` 뜻, 판단 규칙). `docs/maintenance/3-import.md` 205행 `CHAEKCHECK_POPULAR_FETCH_ENABLED` → `CHAEKCHECK_PICKS_FETCH_ENABLED`
- 위험: 중간 (응답이 조사 때와 다르면 멈추고 보고)

## 테스트

- 단위: 제목 키, XML 해석(XXE), 남기기 규칙(6개 달·새 코드), `FetchDecision` 요일·실패 뒤 매일·7일 경계, 키 가림, 표지 주소 검사·줄이기, 맞추기 고르기, 정렬·분류 순서, 웹 격자·카드 머리·도서관 줄
- 통합(`db-test`): `BookLookupTests`(+ `byTitleAndAuthor`), `PicksSchemaTests`, `PicksFetchTests`, `PicksStartupFetchTests`, `PicksCacheTests`, `PicksApiTests`, `AuthEnabledSecurityTests`, `ModularityTests`, `DocumentationTests`, 기존 테스트 전부
- 화면: Vitest, Playwright 4폭(데스크톱 먼저), 사용자 실제 폰
- 실데이터: 1단계 맞추기 측정(CSV, API 안 부름), 7단계 진짜 받기 시험(하루 최대 1번). **빌드 테스트는 진짜 API·표지를 부르지 않음**(C3)

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 "전체" 첫 9권 3×3(숫자 없음), 출처 줄·받은 날 | Vitest `PicksPage` + Playwright 4폭 | 6, 7 |
| AC-2 ◀ ▶ (C10) | Vitest + Playwright | 6, 7 |
| AC-3 내리면 다음 분류 (C10) | Playwright | 7 |
| AC-4 분류 순서, 빈 분류 없음 | `PicksApiTests` + Vitest | 5, 6 |
| AC-4b 모르는 코드 999 → 전체 + 맨 뒤 "새분야"(빈 이름 "기타"), 기록에 999 | `PicksFetchTests` + `PicksApiTests` + Vitest | 3, 5, 6 |
| AC-5 분류 목록 (C10) | Vitest + Playwright | 6, 7 |
| AC-6 ISBN 또는 본제목+첫 저자로 맞고 계획 도서관이 가지면 또렷, 아니면 흐림 | `BookLookupTests` + `PicksCacheTests` + `PicksApiTests` + Vitest | 1, 5, 6 |
| AC-7 검색 기준 바꾸면 있음/없음 바뀜 (C10) | `PicksApiTests` + Vitest + Playwright | 5, 6, 7 |
| AC-8 S14 앞 3곳 (C10) | Vitest + Playwright | 6, 7 |
| AC-9 [책 검색 >>]·도서관 줄 (C10) | Vitest + Playwright | 6, 7 |
| AC-10 흐린 책 → 신청 안내 (C10) | Vitest + Playwright | 6, 7 |
| AC-11 오류 코드·0권 → 목록 그대로, 실패 기록, 오류 로그 | `PicksFetchTests` | 3 |
| AC-12 목록 1건 + 바뀌었을 때만 새 표지(1초), `bnk.kpipa.or.kr` 0건 | `PicksFetchTests` + 7단계 로그 | 3, 4, 7 |
| AC-13 목록 없이 켜면 곧바로 받고 기록 | `PicksStartupFetchTests` + 7단계 | 3, 7 |
| AC-13b 마지막 성공 7일 초과로 켜면 곧바로 받음 | `FetchDecisionTests` + `PicksStartupFetchTests` | 3 |
| AC-14 표지 안 열림 → 제목 글자 (C10) | Vitest + Playwright | 6, 7 |
| AC-14b 저장된 표지는 우리 주소, 없거나 안 열리면 제목 글자 | `PicksApiTests` + Vitest + Playwright | 4, 5, 6, 7 |
| AC-15 "사서추천도서", "인기 도서" 글자 없음 | Vitest + Playwright 4폭 | 6, 7 |
| AC-16 로그인 없이 보임 (C10) | `AuthEnabledSecurityTests` + Playwright | 5, 7 |
| AC-17 범위 = 최근 6개 달 | `PicksFetchTests`(8개 달) + 7단계 | 3, 7 |
| AC-18 폰 아래 창 닫기·뒤로 (C10) | Vitest + Playwright 375/320 | 6, 7 |
| AC-19 폰·태블릿 밀기 (C10) | Vitest + Playwright 768/375 | 6, 7 |
| AC-20 S3 갔다 뒤로 → 보던 자리 (C10) | Playwright | 7 |
| AC-21 S14 404 아닌 오류 → S3 문구 (C10) | Vitest | 6 |
| AC-22 개발 DB에 출판유통통합전산망 자료 없음 | SQL(`db`·`db-test`) | 0, 2, 7 |

## 완료 기준

- [ ] spec의 수용 기준(AC-1~AC-22, AC-4b, AC-13b, AC-14b)을 위 표의 방법으로 모두 확인하고 AC 확인표를 `# 사이클 14` 절에
- [ ] `./gradlew build` 통과(`ModularityTests`·`picks` 의존 방향·`DocumentationTests` 포함)
- [ ] `npm test`, `npm run build`, `npm run lint` 통과, Playwright 1280/768/375/320
- [ ] 사용자가 자기 폰(Samsung Internet)에서 `web-lan-5174`(같은 Wi-Fi)로 S13·S13c·S13i·S14·S15와 머리(320px급 폭에서 "사서추천도서"와 로그인 버튼 겹침 없음)를 직접 확인. Chrome 폰 흉내로 갈음하지 않음(사용자 결정, 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-design-addendum-decisions.html` #3)
- [ ] 저장소에 `popular` 모듈·`popular/001`·`Kpipa*`·`fixtures/kpipa/`·`bnk.kpipa.or.kr`·`chaekcheck.popular.*`·`CHAEKCHECK_POPULAR_FETCH_ENABLED`가 없음(`docs/plan-feedback.md` 지난 기록은 예외)
- [ ] 로컬 `db`·`db-test`에 `popular` 스키마와 `popular-001-*` 적용 기록 없음(AC-22)
- [ ] 인증키 값이 코드·설정·`.env.example`·문서·커밋·로그 어디에도 없음, 키 가림 시험 통과
- [ ] 빌드 테스트가 진짜 API·표지를 부르지 않음
- [ ] 7단계 진짜 받기 시험 한 번 기록(요청 수·간격·`fetch_run`·표지 수·`bnk.kpipa.or.kr` 0건·키 0건)
- [ ] 1단계·7단계 측정 기록
- [ ] [확인 필요] 결과와 설계와 달라진 점을 `# 사이클 14` 절에

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 결과에 따라 | 막는 단계 |
|---|---|---|---|
| Open API 하루 호출 한도 | 공식 문서 확인. dev는 하루 최대 1번만 부름 | 보고만 | 없음 |
| 국립중앙도서관 표지를 저장해 보여 줘도 되는지 | 공식 문서 확인 / 문의(정보기술기반과 02-590-0727), 사용자·plan이 함 | 안 되면 표지 끄기(제목 글자만). dev는 구현만 하고 `CoverFetcher`·`/about` 문구 근처에 `TODO(확인 필요): 배포 전 국립중앙도서관 표지 이용 조건 확인` | **배포** |
| 같은 달·같은 등록일에서 `recomNo` 글자 순이 국립중앙도서관 웹 목록 순서와 맞는지 | 7단계 받은 목록과 웹 목록(https://www.nl.go.kr/NL/contents/N20500000000.do) 비교, API 추가 호출 없음 | 다르면 보고 | 없음 |
| 제목+저자 52건 시간, 서비스 DB 맞는 비율(plan 32/52) | 1단계 측정 | 무거우면 캐시 간격만 늘리는 안 보고 | 없음 |
| API 오류 응답 모양 | 진짜 오류를 만났을 때만 기록 | 해석 규칙 보고 | 없음 |
| 첫 저자 역할어 범위(`Contributors.ROLE_WORDS`로 충분한지) | 1단계 측정에서 못 맞은 책 보기 | 보고 | 없음 |

## 이번에 하지 않는 것

- 운영 배포, 인증키 운영 비밀값 등록, User-Agent에 서비스 주소 붙이기
- 국립중앙도서관 표지 이용 조건 문의(사용자 일)
- 우리 전자책 표지를 서비스 DB로 가져오기(backlog, ADR-0091)
- 인기 도서(판매·대출 순위) 다시 만들기(backlog "추천·통계")
- 국립어린이청소년도서관 사서추천, 도서관 정보나루
- 사서 추천 글·목차 보여 주기, 6번보다 앞의 추천·달 고르기
- "있는 책만 보기", "외 N곳", 희망도서 사이트 링크, 정렬 바꾸기·검색·공유·즐겨찾기
- 관리자 다시 받기 명령, 받기 실패 알림, 서버 여러 대용 받기 잠금
- `catalog` 표·색인 변경, 다시 가져오기, 다른 스키마 손대기

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 14`** 절에 **무엇이 달라졌는지와 이유**를 적습니다(사용자 발언은 그대로). **인증키 값은 적지 않습니다.**

- 시작 상태: 사이클 12·13 커밋, master 맨 끝 include, 0단계에서 지운 줄 수(`db`·`db-test`), 2단계 뒤 `db-test` 다시 정리했는지
- 1단계: 제목 키 규칙(plan 측정 규칙과 다른 점), 후보 좁히기 방법과 `EXPLAIN ANALYZE`, 52건 시간, 맞은 수(① / ①이나 ②)와 plan 29·32 비교, 후보 여럿인 책, 차이 난 책 목록
- 받기 시험: 날짜, trigger, 응답 시간·크기, `received_count`·`kept_count`·`missing_isbn_count`·`new_category_codes`, 분류별 권수, 추천 달 범위, 표지 받은 수·실패 수·가장 짧은 간격·`picks.cover` 전체 크기, `bnk.kpipa.or.kr` 0건·키 0건 확인 방법, 응답이 조사 문서(alternatives.md 3-0절)와 달랐던 점
- 측정: 캐시 새로 고침 시간·메모리, `GET /api/v1/picks` p50·p95·응답 크기, 계획 하나의 `available` 권수
- 정한 이름과 방법: 안쪽 패키지·클래스, 제목 키 함수, changeset id·제약 이름, 픽스처 파일, 웹 폴더·컴포넌트, 화면 읽기용 이름, 05:00에 목록이 없을 때의 trigger, "같은 목록" 비교 방법, `registered_on` NULL 정렬, 새 코드 정렬, `format_changed` 범위, 운영 메모 경로
- 같은 달 순서가 국립중앙도서관 웹 목록과 맞았는지
- 320px 머리 겹침 결과와 손본 점, 사용자 실제 폰 확인 결과
- `changed=false`인 주에 실패 표지가 다시 안 받아지는 일이 문제였는지
- [확인 필요] 표 각 행의 결과, 설계와 달라진 점, 새로 알게 된 제약, AC 확인표
