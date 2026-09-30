# 개발 인계서: 사이클 04 AND 검색 (제목·저자·출판사 여러 조건)

## 요약

도서관 사이트에서 미리 모은 전자책 목록을 서비스 DB에 한 번 가져옵니다. 제목·저자·출판사를 AND로 찾고, 찾은 책을 가진 서비스 도서관의 **상세 페이지만** 읽어 대출·예약 상황을 보여 줍니다.
- 새 모듈 `catalog`가 생깁니다. `availability`, `library`, 웹이 바뀝니다.
- 개발·테스트 DB 이미지에 pg_bigm을 넣습니다.
- 사이클 01~03의 도서관 사이트 검색은 "도서관에서 직접 찾기"로 그대로 남습니다.

**포함**
- 사이클 03 후속: 방문 가입 조회 순서 (ADR-0027). 먼저 합니다.
- pg_bigm이 든 개발·테스트 PostgreSQL 이미지
- `library.planSearch(PlanOptions)`와 가져오기 대조용 도서관 목록
- `catalog` 모듈
  - 스키마 5개 표
  - 정리 규칙 (가져오기와 검색어가 같은 코드를 씀)
  - Java 가져오기 도구 (프로필 `catalog-import`)
  - `GET /api/v1/books`, `GET /api/v1/books/{bookId}`
- `availability`
  - 화면 종류별 `parseDetail`
  - `BatchRunner`를 넓히기 (`LookupTask`)
  - 소장 단위 SSE 두 개
- 웹
  - 조건 드롭다운 제거, 여러 조건·완전 일치·역할·정렬
  - 설정 창 (보기 방식, 직접 찾기)
  - 바로 보기 결과, 책 먼저 고르기, S3 책 화면, 직접 찾기 모드

**제외**: 주기 갱신, ISBN 서지정보 API, 서비스에 없는 기관, 그 밖의 정렬 등. "이번에 하지 않는 것"을 보세요.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.**
- 구현이 이 인계서와 달라져야 하면(값, 이름, 구조, 순서) 먼저 사용자에게 알리세요.
  - 내용과 이유는 dev `docs/plan-feedback.md`의 **새 `# 사이클 04` 절**에 쌓습니다. 사용자 발언이면 그대로 옮깁니다.
  - 이 절이 다음 `/cycle-start` 회고의 입력이 됩니다.
- 태그 뜻
  - `[확정]`: 사용자가 정했거나, 호출 시험·공식 문서로 확인한 값입니다.
  - `[안]`: 제안입니다. dev가 바꿔도 되지만, 바꾸면 알려야 합니다.
  - `[확인 필요]`: 모르는 값입니다. 확정된 것처럼 코드에 넣지 마세요. 측정하거나 사용자에게 물은 뒤 결과를 보고합니다.
- 단계마다 적힌 확인이 통과해야 다음 단계로 넘어갑니다.
  - 백엔드: `backend/`에서 `./gradlew build` (`ModularityTests`, `DocumentationTests` 포함)
  - 웹: `web/`에서 `npm test`(Vitest), `npm run build`, `npm run lint`
  - `fetch-service/`: 바뀌지 않으므로 빌드 대상이 아닙니다.
- JSON·이벤트 예시와 표 정의는 이 인계서에 옮기지 않았습니다. 구현 기준은 `design-delta.md`입니다.
- 새 의존성, 이미지 안 패키지 설치, 외부 파일 내려받기는 **사용자에게 먼저 알리고 승인받은 뒤** 합니다.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/reference-index.md`: 도서관 수집·분류, 책 수집·정리·묶기를 다시 할 때 볼 문서 색인과 재작업 체크리스트 (2026-10-01 추가). 개발 중 바뀐 묶기 ④·번호 체계는 ADR-0035와 `docs/research/ebook-catalog/same-book-isbn.md` 5절
- `../chaekcheck-plan/docs/cycles/04-and-search/design-delta.md`: **기준 문서**
  - 모듈 표, 데이터 표·인덱스, API 표·이벤트 예시
  - 외부 연동 표(화면 종류별 상세 페이지), 웹 변경 표, 테스트 목록, 확인 필요
- `../chaekcheck-plan/docs/cycles/04-and-search/spec.md`
  - 2장 입력, 3장 동작 규칙 (3.2 AND, 3.3 완전 일치, 3.4 역할, 3.5 순서, 3.6 실시간 조회, 3.7 직접 찾기, 3.8 책 먼저 고르기)
  - 4장 상태, 5장 AC-1~AC-14, 8장 확인 필요
- `../chaekcheck-plan/docs/cycles/04-and-search/flow.md`: S1 변경, S3 book, S4 settings, 상태 표, 배치 메모
- `../chaekcheck-plan/docs/cycles/04-and-search/architect-proposal.md`: 배경만
- ADR (`../chaekcheck-plan/docs/adr/`)
  - 0027: 방문 가입 조회 순서. 사이클 03 후속
  - 0028: `catalog` 모듈
  - 0029: 상세 페이지 읽기, `parseDetail`, `LookupTask`
  - 0030: `/books`와 소장 스트림을 나눔
  - 0031: 백엔드 Java 가져오기, 정리 코드 한 벌
  - 0032: pg_bigm, 사람별 표
  - 0033: 웹 주소에 여러 조건
  - 0034: 목록 사실 정보만 저장
  - 0025: 사이트 검색 API의 조건 하나 규칙. 직접 찾기에 그대로 적용
  - 함께 볼 기존 ADR: 0014(서버 상태 없는 묶음), 0016(화면 종류), 0019(판정 방식), 0022(TLS), 0010·0015(조회 서버)
- 사전 조사 (`../chaekcheck-plan/docs/research/ebook-catalog/`)
  - `search-and-normalization.md`
    - 4절: 정리 규칙. 4.1 저자·역할, 4.2 제목·본제목, 4.3 출판사, 4.4 출판일
    - 3.2.1절: pg_bigm 측정과 조건
  - `same-book-isbn.md`
    - 3절: 교보식 코드 → 종이책 ISBN 규칙
    - 4.2절: 국가서지 일반도서 전체 대조
    - 5절: 묶기 절차
  - `catalog-refresh.md`: 이번에는 하지 않는 주기 갱신. 가져오기 코드를 재사용할 수 있게 참고만 합니다.
- 수집 DB 구조: `../chaekcheck-data/README.md` "DB 구조" (`library`, `crawl_run`, `holding` 칸 뜻)
- `../chaekcheck-plan/docs/current/api.md`, `data-model.md`, `module-map.md`: 사이클 04 부분은 "설계됨(미구현)"

## 지켜야 할 제약

- dev `CLAUDE.md`와 스킬 규칙을 따릅니다.
  - `.claude/skills/spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`
- Spring Modulith 경계
  - `catalog`는 `library`의 공개 API(`LibraryCatalog`)만 씁니다.
  - `availability`는 `catalog`의 공개 API(`CatalogHoldings`)와 `LibraryCatalog`만 씁니다.
  - 다른 모듈의 `internal` 패키지, 엔티티, 리포지토리를 쓰지 않습니다.
  - 모듈 사이 SQL JOIN은 없습니다. 소장은 `library_id = ANY(:planIds)` 매개변수로만 거릅니다.
  - `holding.library_id`에 `library`로 가는 FK를 두지 않습니다.
  - 의존 방향은 `catalog → library → region`, `availability → catalog, library`이고, 순환이 없어야 합니다 (ADR-0001, 0028).
- Kafka, Kubernetes, 서비스 분리, 새 검색 서버(OpenSearch 등)는 넣지 않습니다.
- Liquibase
  - `catalog`는 **새 파일** `db/changelog/catalog/001-catalog-schema.yaml`로 만들고 master에 include합니다.
  - `PRE_DEPLOYMENT` 표시가 있는 동안에는 같은 사이클 안에서 이 파일을 고쳐도 됩니다. 고치면 로컬 `db`·`db-test`를 초기화합니다.
  - **데이터는 Liquibase로 넣지 않습니다.** 가져오기 도구가 넣습니다 (ADR-0031).
  - Hibernate는 스키마를 만들지 않습니다(`ddl-auto: validate`).
- 호출 예의와 묶음 규칙은 그대로입니다 [확정].
  - 캐시 3분, 같은 호스트 동시 1건·1초 간격, User-Agent
  - 연결 5초·읽기 5초, 묶음 8초, 20줄, 병렬 5, 다음 묶음 후보 K=50, 바쁜 호스트 건너뛰기
  - TLS 설정과 조회 서버 경유도 그대로입니다 (ADR-0010, 0015, 0022).
- **교보 구독형(`KYOBO_SUBSCRIPTION_V1`) 상세 페이지는 요청하지 않습니다.** 구독형(`SUBSCRIPTION`)으로 판정합니다 [확정] (사용자: "열지 않고 구독형으로 표시").
- 상세 페이지 요청 전에 `detail_url`이 http(s)인지, 호스트가 그 도서관 `base_url` 호스트와 같은지 봅니다 [안]. 다르면 요청하지 않고 그 줄만 실패로 둡니다.
- 대출·예약 수는 저장하지 않습니다. 책 소개·저자 소개·목차·서평은 가져오지 않고, 표지는 주소만 둡니다 [확정] (ADR-0034).
- 기존 `ebook-searches/stream`, `…/batches/stream`, `availability/libraries/{id}/ebooks` API는 바꾸지 않습니다. "조건 하나" 규칙(ADR-0025)도 그대로입니다.
- 웹
  - 검색 조건은 브라우저에 저장하지 않습니다 [확정].
  - 브라우저에 저장하는 것은 설정 두 개(`view`, `direct`)뿐입니다 [확정].
- 데이터 파일은 **저장소에 커밋하지 않습니다.** 수집 SQLite, 국가서지 zip·TTL, 가져오기 결과 dump가 모두 해당합니다.
  - 테스트용 고정 파일은 몇 줄짜리 합성본만 둡니다.
- 수집 SQLite는 **읽기 전용**으로 엽니다. 다른 프로세스(수집 세션)가 쓰고 있습니다.
- 상세 페이지 조사로 알게 된 사이트별 특이점은 dev `CLAUDE.md` "Library Research Record" 규칙대로 `docs/library-maintenance.md`에 적습니다. 강남구 본 책 블록 읽는 법 등이 해당합니다.

## 개발 시작 전 확인

### 사이클 03 후속 (가장 먼저)

- [ ] **방문 가입 조회 순서 (ADR-0027)가 아직 구현되지 않았습니다.**
  - 2026-09-30 코드 확인: `library/internal/LibraryService`의 `IN_GROUP`은 무리 **안에서만** 방문 가입을 뒤로 둡니다.
  - dev `docs/plan-feedback.md` `# 사이클 03` C3-U-1도 "무리마다 그 안에서 방문 가입을 맨 뒤로"로 적혀 있습니다.
  - 이 인계서의 0단계로 먼저 합니다. 이미 고쳐져 있으면 테스트만 확인하고 보고합니다.

### 사이클 04

- [ ] base package는 `com.chaekcheck`로 이미 정해졌습니다. 새 모듈 패키지는 `com.chaekcheck.catalog`입니다.
- [ ] 사용자에게 승인받을 것 (1·5단계 전)
  - pg_bigm 이미지 빌드: 이미지 안 `apt` 설치(`libicu-dev`, 빌드 도구, PostgreSQL 18 서버 헤더)와 pg_bigm 소스 내려받기
  - 새 의존성 `sqlite-jdbc`: 버전과 라이선스를 공식 출처(Maven Central, 프로젝트 저장소)에서 확인해 함께 보여 줍니다 [확인 필요].
    - **가져오기 도구 전용 설정에만** 넣고, 서비스 운영 실행(bootJar 런타임)에는 들어가지 않게 합니다 [확정] (사용자: "일단 sqlite를 직접 읽도록 하고 나중에 postgresql 원문 표를 거치는 것을 고려해야겠다", 2026-09-30). Gradle 설정 이름과 방법은 dev가 정하고 보고합니다.
  - PostgreSQL JDBC `CopyManager`를 쓰려면 `org.postgresql:postgresql`을 `runtimeOnly`에서 `implementation`으로 바꿔야 합니다 [안].
  - TTL 읽기에 새 라이브러리(예: RDF 파서)가 필요하면 따로 묻습니다. 기본은 새 의존성 없이 줄 단위로 읽는 것입니다 [안].
- [ ] 국가서지 일반도서 파일 내려받기 (5단계 전, **사용자 승인 후**)
  - 지금은 plan 쪽 scratchpad에만 있습니다. dev가 새로 받습니다.
  - 주소: https://lod.nl.go.kr/home/dataset/datadownload.do
  - 파일 `book_ttl_20260807.zip`: 1.10GB, 풀면 7.7GB, TTL 20개. 2026-08-07 갱신 [확정] (same-book-isbn 4.2, 2026-09-30 확인)
  - 이용 조건: 공공누리 제1유형, CC0 1.0 [확정]
  - 사이트에 이용 설문이 나옵니다(선택). 지난번에는 사용자가 정한 내용(기관명 "개인 개발자 (비영리 도서 검색 웹 서비스 개발)", 목적 "웹 개발")으로 냈습니다. 이번에 무엇을 낼지는 사용자에게 묻습니다.
  - 저장 위치는 저장소 밖으로 합니다. 예: `../chaekcheck-data/` 아래 [안]. 위치는 사용자에게 확인합니다.
- [ ] 수집 SQLite: `../chaekcheck-data/ebook-catalog.sqlite` (WAL)
  - 가져오기 전에 사용자에게 수집 세션이 쉬는 때인지 묻습니다. YES24 재수집이 끝났는지도 확인합니다 [확인 필요].
- [ ] `docker/` 같은 새 폴더를 만들면, dev `CLAUDE.md` Directory Layout에 한 줄 더할지 사용자에게 묻습니다. 사이클 02에서 `fetch-service/` 때 한 방식과 같습니다.
- [ ] 가져오기에 넣을 자료 종류 [확인 필요: 사용자에게 질문]
  - 수집 `holding.content_type`의 `AUDIOBOOK`, `VIDEO_BOOK`은 뺍니다 [확정].
  - `KIDS_BOOK`, `PAPER`, `UNKNOWN`을 넣을지는 정해지지 않았습니다. 건수를 세어 보여 주고 묻습니다.

## 구현 단계

### 0단계: 사이클 03 후속, 방문 가입 조회 순서 (의존: 없음)

1. **계획 순서** (파일: `backend/src/main/java/com/chaekcheck/library/internal/LibraryService.java`)
   - 할 일: 가입 가능한 무리에서는 방문 가입이 아닌 도서관을 무리 순서대로 모두 먼저 놓고, 그다음 방문 가입 도서관을 같은 무리 순서대로 놓습니다. 가입 가능한 무리는 `Eligibility`가 `OPEN`·`ELIGIBLE`인 무리입니다.
     - 지역 있음 [확정]: 내 시군구(방문 없음) → 내 시도(방문 없음) → 누구나(방문 없음) → 내 시군구(방문) → 내 시도(방문) → 누구나(방문) → 확인 필요
     - 확인 필요 무리 안에서는 지금처럼 방문 가입이 뒤입니다.
     - 지역 없음: 결과가 지금과 같습니다. 누구나(방문 없음) → 누구나(방문) → 자격 필요 → 확인 필요. 자격 필요 무리 안에서만 방문 가입이 뒤입니다 [안].
   - `priorityGroup` 값은 바꾸지 않습니다. 무리 안 나머지 기준(후순위 → 주의 → 보유 수 → id)도 그대로입니다. 웹은 바뀌지 않습니다.
   - 이유: ADR-0027. 6단계의 책 순서 `joinTier`도 이 기준과 같아야 합니다.
   - 테스트 (`backend/src/test/java/com/chaekcheck/library/LibraryCatalogTests.java`)
     - `visitOnlyLibrariesComeAfterTheRestOfTheirGroup`을 새 순서로 바꿉니다.
     - 지역이 있을 때 "내 시군구(방문)가 누구나(방문 없음) 뒤"임을 확인하는 테스트를 더합니다.
   - 확인: `./gradlew build`. `bootRun` 뒤 지역을 넣은 `ebook-searches/stream`의 `targets` 순서를 보고, 결과를 `# 사이클 04` 절 첫 항목에 적습니다.
   - 위험: 낮음

### 1단계: pg_bigm이 든 개발·테스트 DB 이미지 (의존: 없음)

1. **이미지** (새 파일: `docker/postgres-bigm/Dockerfile` [안 경로])
   - 할 일
     - `FROM postgres:18`
     - 빌드용 패키지를 설치합니다: 빌드 도구, PostgreSQL 18 서버 헤더, **`libicu-dev`**. PG18 헤더가 ICU 헤더를 요구합니다 (research 3.2.1).
     - pg_bigm **v1.2-20250903** [확정: PG18 지원 버전, https://github.com/pgbigm/pg_bigm/releases, 2026-09-30 확인]을 태그로 고정해 빌드·설치합니다.
     - 필요하면 빌드용 패키지를 지웁니다.
     - 스텁 헤더 같은 우회는 쓰지 않습니다.
     - 설치 명령과 `shared_preload_libraries` 필요 여부는 pg_bigm 공식 README로 확인합니다 [확인 필요: 공식 문서 확인].
   - 이유: ADR-0032. 지금 `compose.yaml`의 `postgres:18`에는 pg_bigm이 없습니다.
   - 위험: 중간 (패키지 이름, 빌드 옵션)
2. **compose** (파일: `compose.yaml`)
   - 할 일: `db`와 `db-test`를 모두 위 이미지로 바꿉니다(`build:` + `image:` 이름 [안]).
     - 포트, 볼륨, tmpfs, healthcheck, `.env` 값은 그대로입니다.
     - 머리 주석에 빌드 명령을 더합니다: `wsl -d Ubuntu -- docker compose build`
   - 기존 `db-data` 볼륨은 같은 PG 18이라 그대로 뜰 것으로 봅니다 [확인 필요: 시작 로그 확인]. 안 되면 사용자에게 알리고 로컬 DB를 초기화합니다. 지금 데이터는 Liquibase seed뿐입니다.
   - 확인
     - `docker compose up -d` 뒤 두 DB에서 `CREATE EXTENSION pg_bigm;`이 되는지 봅니다.
     - `SELECT show_bigm('행동');`처럼 확장 함수가 도는지 봅니다.
     - 확인 뒤 `DROP EXTENSION`으로 되돌립니다. Liquibase가 다시 만듭니다.
     - `./gradlew build`가 통과해야 합니다.
   - 운영 호스팅의 pg_bigm 지원은 호스팅이 정해질 때 확인합니다 [확인 필요]. 이번 단계를 막지 않습니다.
   - 위험: 중간

### 2단계: `library` 공개 API 넓히기 (의존: 0단계)

1. **`PlanOptions`** (새 파일: `backend/src/main/java/com/chaekcheck/library/PlanOptions.java` [안])
   - 할 일: 조회 범위와 방문 필터의 뜻을 `library`로 옮깁니다. 지금은 `availability/internal/search/LibraryScope`, `VisitFilter`에 있습니다.
     - 모양: `PlanOptions(scope, visit)` [안]. 값은 `ALL`/`JOINABLE`, `ANY`/`NONE`입니다.
     - `LibraryCatalog.planSearch(residenceIds, workIds, PlanOptions)` [안]을 더합니다. `joinable()`·`visitRequired()`로 거른 계획을 돌려줍니다.
     - 기존 두 인자 `planSearch`는 `PlanOptions` 기본값(ALL, ANY)으로 위임하거나 없앱니다. 호출하는 곳을 모두 바꾸면 없앱니다.
   - `availability`의 `LibraryScope`·`VisitFilter`는 HTTP 값 읽기(`parse`, `value`)만 남기고, 거르기는 `PlanOptions`로 넘깁니다. `EbookSearchStreamController`도 새 메서드를 부릅니다.
   - 이유: `catalog`(`/books`)와 `availability`(소장 스트림)가 같은 계획을 써야 합니다 (design-delta "모듈").
2. **가져오기 대조용 목록** (파일: `LibraryCatalog.java`, `library/internal/LibraryService.java`, 새 `library/LibraryRef.java` [안])
   - 할 일: `enabledLibraryRefs()` → `LibraryRef(id, baseUrl, platformType)` [안]. 켜진 도서관만 돌려줍니다.
   - 테스트 (`LibraryCatalogTests`)
     - `planSearch(PlanOptions)`가 지금의 `scope`·`visit` 결과와 같습니다(지역 있음·없음).
     - `enabledLibraryRefs()`에 꺼진 도서관이 없습니다.
   - 확인
     - `./gradlew build`. 사이클 02·03 컨트롤러 테스트가 그대로 통과해야 합니다.
     - `ModularityTests` 통과
   - 위험: 낮음

### 3단계: `catalog` 모듈 뼈대 + 스키마 (의존: 1단계)

1. **모듈 패키지** (새 폴더: `backend/src/main/java/com/chaekcheck/catalog/`)
   - 공개: `CatalogHoldings`(인터페이스), `HoldingRef(holdingId, bookId, libraryId, platformType, detailUrl)` [안 이름은 design-delta 그대로]
     - `holdingsOf(bookIds)`: 책들의 소장
     - `holdings(holdingIds)`: 소장 id로 찾기
     - 구현은 9단계에서 채웁니다. 여기서는 빈 구현이나 테스트용 구현으로 컴파일만 되게 해도 됩니다.
   - 내부: `catalog/internal/{normalize, search, importer, web}` [안]
2. **Liquibase** (새 파일: `backend/src/main/resources/db/changelog/catalog/001-catalog-schema.yaml`, `db.changelog-master.yaml`에 include 추가)
   - `sql` changeset: `CREATE SCHEMA catalog`, `CREATE EXTENSION IF NOT EXISTS pg_bigm`
   - 표 5개: `book`, `book_contributor`, `holding`, `catalog_library_snapshot` [안 이름], `catalog_import`
     - 칼럼, 제약, CHECK 값은 design-delta "데이터" 표 그대로입니다.
     - CHECK·IDENTITY는 `library/001`처럼 `sql` 안의 `CREATE TABLE`로 씁니다. Liquibase OSS YAML은 CHECK를 지원하지 않습니다 (사이클 01 확인).
   - 같은 모듈 안 FK는 `ON DELETE CASCADE`로 둡니다 [안]. `holding.library_id → catalog_library_snapshot` FK는 두지 않습니다 [안].
   - 인덱스 (design-delta 그대로 [안])
     - `book`
       - GIN `gin_bigm_ops`: `title_norm`, `publisher_norm`
       - B-tree `COLLATE "C"`: `main_title_norm`, `title_norm`, `publisher_norm`
       - `(published_on DESC NULLS LAST, id)`, `(published_on ASC NULLS LAST, id)`
       - UNIQUE `isbn13`
     - `book_contributor`
       - GIN `gin_bigm_ops` `name_norm`
       - B-tree `name_exact COLLATE "C"`
       - `(book_id)`
     - `holding`: UNIQUE `(library_id, item_key)`, `(book_id, library_id)`
   - 적재 전에 인덱스를 둘지, 적재 뒤에 만들지 [확인 필요: 5단계 적재 시간 측정]
     - design-delta 흐름 3은 "COPY 뒤 인덱스"입니다.
     - 우선 Liquibase가 모두 만들고 적재 시간을 잽니다.
     - 너무 느리면, 가져오기 도구가 GIN을 지웠다가 같은 정의로 다시 만드는 안을 사용자에게 제안합니다.
   - JPA 엔티티를 둘지는 dev가 정합니다. 검색은 네이티브 SQL(JdbcClient 등)이 자연스럽습니다 [안]. 엔티티를 두면 `validate`를 통과해야 합니다.
   - 오류 처리: `catalog/internal/web/CatalogErrors` [안]. `@RestControllerAdvice(basePackageClasses=…)`로 둡니다.
     - `AvailabilityErrors`는 `availability` 패키지에만 걸립니다.
     - `InvalidRegionException`(422), `validation_error`, `invalid_query`, `book_not_found`를 같은 ProblemDetail 모양으로 냅니다.
   - 테스트: 스키마가 `db-test`에 적용되는지(`ChaekcheckApplicationTests`), `ModularityTests`(`catalog → library` 허용, 순환 없음), `DocumentationTests`(모듈 문서에 `catalog`)
   - 확인: `./gradlew build`. `psql`로 `\d catalog.*`와 `\dx pg_bigm`을 봅니다.
   - 위험: 중간 (확장·정렬 규칙·CHECK를 SQL로 씀)

### 4단계: 정리 규칙 한 벌 (의존: 3단계의 패키지만. 1·2단계와 병행 가능)

1. **정리 코드** (새 폴더: `backend/src/main/java/com/chaekcheck/catalog/internal/normalize/`, 클래스 이름 [안])
   - 가져오기와 검색어 정리가 **같은 클래스**를 씁니다 (ADR-0031). `availability`의 `BookKeyNormalizer`(NFC, 결과 묶기용)는 건드리지 않습니다.
   - 규칙: research `search-and-normalization.md` 4절 [안]
     - 공통: NFKC → 영문 소문자 → 공백 제거
       - 검색어도 같은 규칙으로 정리합니다.
       - 칸 안에서는 띄어쓰기로 단어를 나눈 뒤 단어마다 정리합니다.
     - 제목 (4.2)
       - `title_norm` = 전체 제목 정리값
       - `main_title_norm` = 첫 ` : ` 또는 ` - ` 앞. 맨 앞 `〈…〉`·`[…]` 시리즈는 뗍니다.
       - 권 번호와 뒤쪽 괄호는 자르지 않습니다.
     - 저자 (4.1)
       - `/`로 나눕니다. 한글이 있는 부분은 쉼표로도 나눕니다.
       - 괄호 속 별명은 `alias`로 둡니다.
       - `외`는 사람이 아닙니다.
       - 역할 사전: 저·글·지음·공저·저자·등저·(지은이) → `AUTHOR` / 역·옮김·공역 → `TRANSLATOR` / 그림 → `ILLUSTRATOR` / 글그림 → `AUTHOR`와 `ILLUSTRATOR` 두 줄 / 편·엮음·편저·편역 → `EDITOR` / 감수·기획·사진·원작·해설·낭독 → `OTHER` / 표시 없음 → `UNKNOWN`
       - `name_norm`: 이름(+별명) 정리값
       - `name_exact`: 공백·마침표를 뺀 값 ("로버트 M. 새폴스키" = "로버트M새폴스키") [확정 방향, 무시 규칙은 안]
     - 출판사 (4.3): NFKC → `(주)`·`주식회사`·`도서출판`·Inc/Ltd/Co 제거 → 공백·마침표·쉼표 제거 → 소문자. 사람이 만드는 별칭 목록은 두는 자리만 만듭니다 [안].
     - 출판일 (4.4)
       - `YYYY-MM-DD`, `YYYYMMDD`만 읽고, 없는 날짜(`2045-07-00`)는 비웁니다.
       - **미래 날짜는 오류로 봅니다** [확정].
       - 대표값: 같은 책 소장들의 날짜 중 가장 많이 나온 것. 같으면 이른 것 [안]. 미래 날짜를 빼고 셉니다 [확정].
   - 테스트 벡터 (`backend/src/test/java/com/chaekcheck/catalog/internal/normalize/…Tests.java` [안])
     - research 4절의 예
       - `(주) 도서출판 푸른숲` = `(주)도서출판푸른숲` = `푸른숲(주)` = `푸른숲`
       - `김도형(별별역사)`
       - `A 저/B 역`
       - 글그림
       - `[100분 고전 013] …`
       - `이기적 유전자(40주년 기념판)`
       - `2045-12-08`
       - `YYYYMMDD`
     - 검색어 "행동 경제학" → 단어 `행동`, `경제학`
   - 표본 조사 [확인 필요: 사이트별 100건]
     - 영문 "성, 이름" 쉼표(`Richardson, James D.`), 단체 이름, ` - ` 뒤가 제목 일부인 책
     - 결과와 고른 규칙을 보고합니다.
   - 확인: `./gradlew test`
   - 위험: 중간 (규칙이 곧 검색 품질)

### 5단계: 한 번 가져오기 도구 (의존: 2, 3, 4단계)

1. **실행 틀** (새 폴더: `backend/src/main/java/com/chaekcheck/catalog/internal/importer/`, 새 파일 `backend/src/main/resources/application-catalog-import.yml` [안])
   - 프로필 `catalog-import` [안]일 때만 빈이 생깁니다. 실행 뒤 종료하고 웹 서버는 띄우지 않습니다(`web-application-type: none` 등).
   - 다른 프로필과 테스트 컨텍스트에서는 절대 돌지 않아야 합니다.
   - 입력 경로는 실행 인자나 환경 변수로 받습니다. 설정 키는 [안]입니다(예: `chaekcheck.catalog.import.sqlite-path`, `…ttl-path`). 사용자 PC 경로를 기본값으로 커밋하지 않습니다.
   - 실행 예 [안]: `./gradlew bootRun --args='--spring.profiles.active=catalog-import --chaekcheck.catalog.import.sqlite-path=../chaekcheck-data/ebook-catalog.sqlite --chaekcheck.catalog.import.ttl-path=<풀어 둔 TTL 폴더>'`
2. **읽기** (SQLite, 읽기 전용, 한 트랜잭션 안에서 한 시점의 데이터를 읽음 [안])
   - 도서관 대조: 수집 `library`와 `LibraryCatalog.enabledLibraryRefs()`를 비교해 **id와 `base_url`이 같은 곳만** 씁니다 [확정].
     - 2026-09-30 대조: 276곳이 같았고, 꺼진 59·131번은 빠졌습니다.
     - 북큐브(id 100001부터)는 서비스 도서관이 아니라 빠집니다.
   - 소장
     - `removed_at IS NULL` [확정]
     - `content_type`이 오디오북·동영상북이 아닌 것 [확정]. 나머지 종류는 "개발 시작 전 확인"대로 합니다.
     - `detail_url`이 있는 것
     - `detail_url` 호스트가 그 도서관 `base_url` 호스트와 같은 것만 [안]. 다르면 건너뛰고 셉니다. 도서관별로 몇 건인지 [확인 필요: 데이터 대조].
   - 원문 칸 `title_raw`, `author_raw`, `publisher_raw`, `published_raw`, `supplier`, `alt_code`, `first_seen_at`을 옮깁니다.
   - 도서관별 기준일 `catalog_library_snapshot.collected_at`의 원천은 수집 `library.last_full_success_at`입니다 [안]. README "그 도서관 목록의 기준 시각"을 따릅니다.
3. **묶기** [확정 범위: ①~③] (same-book-isbn 3·4.2·5절)
   - ① 같은 플랫폼 코드
     - 여러 도서관의 같은 교보 코드, 같은 YES24 번호는 같은 책입니다.
     - 어떤 화면 종류끼리 코드 공간이 같은지 [확인 필요: 데이터 대조, 보고]. 교보와 교보 구독형의 `brcd`, 포털의 사이트별 `book_idx` 등입니다. 확실하지 않으면 묶지 않습니다.
   - ② 교보식 코드 → 종이책 ISBN
     - `480` + 9자리(t) + 확인 숫자에서, t가 `89`로 시작하면 `978`+t, `11`로 시작하면 `979`+t입니다.
     - ISBN-13 확인 숫자는 **다시 계산**합니다.
     - 규칙은 979-11까지 맞습니다 [확정] (국가서지 대조 2026-09-30).
     - `480D…`처럼 영문이 섞인 코드는 대상이 아닙니다.
     - `48090…`, 교보 확인 숫자가 안 맞는 코드는 계산하지 않고 셉니다 [확인 필요].
     - 같은 ISBN이면 화면 종류가 달라도 묶습니다.
   - ③ 국가서지 ISBN
     - TTL에서 ISBN이 있는 레코드만 사전으로 만듭니다.
       - 쓰는 필드: `bibo:isbn`, `dcterms:title`, `nlon:remainderOfTitle`, `dc:creator`, `dc:publisher`, `nlon:datePublished`
       - ISBN-10과 부가기호가 붙은 글자는 ISBN-13으로 정리합니다.
       - 7.7GB라 한 번에 메모리에 올리지 않고 스트리밍으로 읽습니다 [확인 필요: 프로토타입].
     - ①②에서 ISBN이 없는 책에 대해 (정리한 본제목, 대표 저자, 정리한 출판사)가 사전의 **레코드 하나와만** 맞을 때 ISBN을 붙입니다. 그 ISBN을 가진 책이 이미 있으면 합칩니다.
     - 국가서지 표기 잡음은 비교 전에 뗍니다 [안]: 앞 괄호 관제 `(…)`, `(The)`, 출판사 끝 `#`.
   - 정리한 글자만으로 묶는 4단계는 이번에 하지 않습니다 [안].
   - ② 계산 ISBN 중 국가서지와 제목이 다른 약 5%를 그대로 묶을지 [확인 필요: 표본 조사]
     - 기본은 코드 계산값을 믿습니다.
     - 표본 몇십 건을 보고 다른 책이 섞였는지 보고합니다.
   - 대표값
     - `book.title`: 묶인 소장 원문 중 가장 많이 나온 것 [안]
     - `author_display`, `publisher`: 같은 방식 [안]
     - `published_on`: 4단계 규칙
     - `content_type`은 `EBOOK`입니다.
4. **쓰기**
   - PostgreSQL `COPY`로 넣습니다: `book`, `book_contributor`, `holding`, `catalog_library_snapshot`
   - 끝나면 `catalog_import`에 건수를 기록합니다: `book_count`, `holding_count`, `skipped_count`
   - 다시 실행하면 기존 catalog 데이터를 지우고 새로 넣습니다 [안]. 이때 `holdingId`가 바뀝니다. 이번에는 문제가 없습니다(서버에 저장된 상태가 없음).
   - 끝에 건수 요약을 로그로 냅니다.
     - 읽은 줄
     - 건너뛴 줄: 이유별(도서관 불일치, 종류, 호스트 불일치, 날짜 오류 등)
     - 묶기 단계별 책 수
     - 국가서지로 ISBN이 붙은 수, 걸린 시간
   - 테스트 (`backend/src/test/java/com/chaekcheck/catalog/internal/importer/…Tests.java` [안])
     - 테스트 안에서 작은 SQLite를 만들고(바이너리를 커밋하지 않음), 합성 TTL 몇 줄을 둡니다.
     - 확인할 것
       - 묶기 ①②③
       - ③은 하나만 맞을 때만 붙음(둘 맞으면 안 붙음)
       - `removed_at`·오디오북·동영상북 제외 (AC-10)
       - 꺼진 도서관·`base_url` 불일치·호스트 불일치 제외
       - 미래 날짜 대체
       - `db-test`에 `COPY` 결과
   - 확인
     - `./gradlew build`
     - 실제 데이터로 한 번 실행합니다. 수집 세션이 쉬는 때, 사용자 승인 후에 합니다.
     - 건수와 시간을 `# 사이클 04` 절에 적습니다. YES24 재수집 뒤 수치도 다시 잽니다(`removed_at IS NULL`) [확인 필요].
   - 위험: 높음 (데이터 규모 약 280만 줄, 7.7GB TTL, 묶기 정확도)

### 6단계: 책 검색 API (의존: 2, 3, 4단계. 측정은 5단계 뒤)

1. **검색** (새 폴더: `backend/src/main/java/com/chaekcheck/catalog/internal/search/`)
   - 검색 부분은 인터페이스 뒤에 둡니다 [안]. 느려지면 PGroonga 같은 다른 방식으로 바꿀 수 있게 합니다 (ADR-0032 "느려지면").
   - 조건 (spec 3.2~3.4)
     - 채운 칸끼리 AND
     - 칸 안에서는 띄어쓰기로 나눈 단어가 **모두** 들어 있으면 일치 (정리값 `LIKE`, pg_bigm)
       - 제목: `title_norm`
       - 출판사: `publisher_norm`
       - 저자: **한 사람의** `name_norm`에 모든 단어가 들어 있어야 합니다(ADR-0032). 역할은 기본 `AUTHOR`+`UNKNOWN`이고, `roles`로 `TRANSLATOR`/`ILLUSTRATOR`/`EDITOR`를 더합니다 [확정]. `OTHER`는 찾지 않습니다 [안].
       - 검색어 속 `%`·`_`는 이스케이프합니다(pg_bigm `likequery` 등).
     - `exact`
       - 제목: `main_title_norm` 또는 `title_norm`이 검색어 정리값과 같음 [확정]
       - 저자: 사람 하나의 `name_exact`가 같음
       - 출판사: `publisher_norm`이 같음 [확정]
   - 계획 도서관만 봅니다
     - `LibraryCatalog.planSearch(지역, PlanOptions(scope, visit))`의 id로 `holding.library_id = ANY(:planIds)`를 겁니다.
     - 계획 도서관이 0곳인 책은 뺍니다 [확정].
     - `holdingLibraryCount`는 계획 도서관만 셉니다.
   - 순서 (spec 3.5)
     - `sort=default` [확정]
       1. `joinTier`: 그 책을 가진 계획 도서관 중 가장 앞 단계
          - 지역 있음: `MY_SIGUNGU` → `MY_SIDO` → `OPEN` (모두 방문 없음) → `VISIT_ONLY` → `NEEDS_CHECK`
          - 지역 없음: `OPEN` → `VISIT_ONLY` → `NEEDS_CHECK`
          - 값 이름은 [안]입니다. 단계는 `SearchTarget`의 `priorityGroup`, `eligibility`, `visitRequired`로 계산합니다(0단계와 같은 기준).
       2. 본제목 완전 일치(`exactTitle`)
       3. `holdingLibraryCount` 많은 순
       4. `published_on` 최신
       5. id
     - `newest` / `oldest`: `published_on`만으로 정렬하고, 같으면 기본 순서입니다 [안]. 날짜 없는 책은 모두 맨 뒤입니다 [안].
2. **API** (새 파일: `catalog/internal/web/BookSearchController.java` [안])
   - `GET /api/v1/books`: 파라미터와 응답은 design-delta API 표 그대로입니다.
     - `pageSize` 기본·최대 20 [안]
     - `collectedFrom`·`collectedTo` [안]: 결과 책을 가진 계획 도서관들의 `collected_at` 범위. 결과 전체로 셀지 그 쪽만으로 셀지는 dev가 정하고 보고합니다.
   - `GET /api/v1/books/{bookId}`: 대표 서지, `holdingLibraryCount`, `libraries[]{libraryId, collectedAt}`. 없는 책은 404 `book_not_found`
   - 검증 순서 [안]: 조건 칸 → `exact`·`roles`·`sort` → `scope`·`visit` → `page`·`pageSize` → 지역
     - 칸마다 사이클 03 규칙(정규화 후 2~50자, 벗어나면 400 `invalid_query`)
     - 셋 다 없음 → `required`
     - 같은 이름 두 번 → `duplicate`
     - 모르는 값 → `invalid_format`
     - 지역 → 422 `invalid_region`
     - 지역 파라미터 규칙(쉼표, 필드당 최대 20)은 `availability`의 `RegionIdsParam`과 같게 `catalog` 안에 둡니다. 다른 모듈 `internal`은 쓰지 않습니다.
     - 채우지 않은 칸의 `exact`, 저자 칸 없는 `roles`를 무시할지 오류로 할지는 dev가 정하고 보고합니다.
   - 테스트
     - 컨트롤러: 검증과 오류 모양
     - 검색 (`db-test`, 작은 합성 데이터)
       - AC-3: "행동경제학" 결과 ⊂ "행동 경제학" 결과, 순서가 다른 제목도 찾음
       - AC-4: 완전 일치
       - AC-5: 역할
       - AC-6: `joinTier`(지역 있음·없음) → 완전 일치 → 보유 수 → 출판일, `newest`·`oldest`에서 날짜 없음이 맨 뒤
       - AC-12: `scope`·`visit`로 도서관 0곳인 책 제외
       - `pageSize` 최대, `hasMore`, `totalCount`
   - 측정 (5단계 뒤, 실제 가져온 데이터) [확인 필요: 프로토타입]
     - `EXPLAIN (ANALYZE, BUFFERS)`와 시간을 잽니다.
       - "행동", "사랑"
       - "행동"+저자 "새폴스키"
       - "사랑"+출판사 "문학동네"
       - "사랑"+`newest`
       - `totalCount` 비용
       - 기본 순서 집계(가입 단계·보유 수)
       - 1글자 단어가 섞인 "행동 의"
     - research 3.2.1(2x 최악 약 184ms)과 비교해 보고합니다. 2배 규모 측정은 가능하면 합니다.
   - 확인
     - `./gradlew build`
     - `curl "http://localhost:8080/api/v1/books?title=%ED%96%89%EB%8F%99&author=%EC%83%88%ED%8F%B4%EC%8A%A4%ED%82%A4"` (AC-2 책 부분)
   - 위험: 중간 (SQL 성능, 집계 순서)

### 7단계: adapter `parseDetail` (의존: 없음. 1~6단계와 병행 가능)

1. **상세 읽기** (파일: `backend/src/main/java/com/chaekcheck/availability/internal/adapter/PlatformAdapter.java`와 7종 adapter, 새 결과 타입 예: `ParsedDetail(holdings, loaned, reservations, siteVerdict, …)` [안])
   - 할 일: `PlatformAdapter`에 `parseDetail(body, declaredCharset)`를 더합니다 (ADR-0029). 지금의 `parseDetailVerdict`(포털)는 여기로 흡수하고, 포털 목록 판정(`SiteListResolver`→`DetailLookupResolver`)이 그대로 동작하게 합니다.
   - 화면 종류별 (design-delta 외부 연동 표, 2026-09-30 호출 시험)
     - `KYOBO_V1`: "대출 : a/b 예약 : c" → 보유 b, 대출 a, 예약 c [확정]
     - `YES24_V1`: "보유 n , 대출 n , 예약 n , 누적대출 …" [확정]. EUC-KR 사이트는 그대로 읽습니다.
     - `YES24_V2`·`V3`: "보유 n 대출 n 예약 n 누적대출 n" [확정]
     - `GANGNAM_V1`: 본 책의 "보유 n 대출 n 예약 n"만 읽고 연관 도서 수량은 읽지 않습니다. 본 책 블록을 못 찾으면 실패입니다. 가려 읽는 방법은 [확인 필요: 호출 시험].
     - `ELIB_PORTAL_V1`: 사이클 02 상세 판정 그대로. "대출 가능"/"예약 가능", 수량 없음 [확정]
     - `KYOBO_SUBSCRIPTION_V1`: 요청하지 않으므로 읽기가 없습니다(지원 안 함) [확정].
     - 수량 칸이 있는 화면인데 안내문만 있는 경우(강남구 "예약정원이 마감되었습니다.")는 사이클 02처럼 `UNKNOWN`입니다.
   - fixture
     - 종류마다 실제 상세 페이지 1건 이상을 받아, 기존 방식처럼 설명문·표지·스크립트를 지우고 저장합니다.
     - 위치: `backend/src/test/resources/fixtures/<화면 종류>/detail-*.html` [안 이름]
     - 강남구는 연관 도서가 섞인 화면을 꼭 넣습니다.
     - 받을 때는 우리 User-Agent를 쓰고, 같은 호스트는 1초 넘게 간격을 둡니다.
   - 테스트: 각 `…AdapterTests`에 `parseDetail` 테스트. 포털 기존 상세 판정 테스트도 그대로 통과해야 합니다.
   - 확인: `./gradlew test`
   - 위험: 중간 (공식 API가 아님)

### 8단계: 묶음 실행기 넓히기 (`LookupTask`) (의존: 7단계)

1. **가져오기 대상 일반화** (파일: `availability/internal/search/BatchRunner.java`, `Candidate.java`, `BatchSession.java`, `StreamEvents.java`, 새 `LookupTask` [안])
   - 할 일: 한 묶음이 "검색 페이지(도서관, 쪽)"와 "상세 페이지(소장)"를 모두 처리하게 합니다.
     - 예: sealed `LookupTask` = 검색 페이지 / 소장 [안]
     - 병렬 수, 바쁜 호스트 건너뛰기, 20줄(필터별 셈), 8초 마감, 시작 마감은 **같은 코드**가 지킵니다.
     - 소장 한 건 = 결과 한 줄입니다. 상세 페이지라 `PENDING`과 `row-verdict`가 없습니다.
   - 상세 가져오기 (새 `availability/internal/fetch/DetailPageFetcher.java` [안])
     - 같은 `HostThrottle`, `SiteFetcher`(직접 / 조회 서버), 3분 캐시를 씁니다.
     - `DetailVerdictCache`를 수량까지 담게 넓힙니다. 키는 지금처럼 `(libraryId, detailUrl)` [안].
     - 요청 전 `detail_url` 검사(http(s), 호스트 = `base_url` 호스트)를 합니다 [안].
     - 404·시간 초과·읽기 실패는 그 소장만 실패(`upstream_error` / `upstream_timeout`)로 둡니다.
   - 판정: 기존 `AvailabilityResolvers` 규칙(ADR-0019)을 씁니다.
     - 수량 화면: `COUNT`
     - 포털: `SITE_DETAIL`
     - 교보 구독형: **요청 없이** `SUBSCRIPTION`
     - `AvailabilityResolver.resolve`가 페이지 단위라, 한 줄 판정용 메서드를 더할지 한 줄짜리 페이지로 감쌀지는 dev가 정하고 보고합니다.
   - 이벤트 (`StreamEvents`): `holding-requested` / `holding-result` / `holding-failed`
     - 키는 `holdingId`, `bookId`, `libraryId`입니다.
     - `item`은 기존 `LibraryPage.Item` 모양입니다. `rank`·`titleKey`를 어떻게 채울지는 dev가 정하고 보고합니다.
     - 교보 구독형처럼 페이지를 읽지 않은 줄의 `item.title` 등을 비울지, `HoldingRef`에 원문을 더할지는 [안]입니다. 보고합니다.
   - 기존 사이트 검색 흐름(`ebook-searches`)은 동작이 바뀌지 않아야 합니다.
   - 테스트 (`BatchRunnerTests`에 더함 + 새 `DetailPageFetcherTests` [안])
     - 소장 묶음의 20줄·8초·바쁜 호스트 건너뛰기
     - 교보 구독형은 요청이 0건
     - 호스트가 다른 `detail_url`은 요청 없이 실패
     - 캐시(`cached: true`)
     - 기존 검색 페이지 테스트가 모두 통과
   - 확인: `./gradlew build`
   - 위험: 높음 (핵심 실행기 변경)

### 9단계: 소장 스트림 API + `CatalogHoldings` 구현 (의존: 2, 3, 8단계)

1. **`CatalogHoldings` 구현** (`catalog/internal/…`): `holdingsOf(bookIds)`, `holdings(holdingIds)`
2. **컨트롤러** (새 파일: `availability/internal/web/BookAvailabilityStreamController.java`, `BookAvailabilityBatchStreamController.java` [안 이름])
   - `GET /api/v1/book-availabilities/stream`
     - 파라미터: `bookIds`(쉼표, 최대 20 [안]), 지역, `filter`, `scope`, `visit`
     - 모든 검증은 스트림을 열기 전에 끝냅니다: 400 `validation_error`(`required`, `too_many`, `invalid_format`), 422 `invalid_region`
     - 검증 순서 [안]: `bookIds` → `filter` → `scope` → `visit` → 지역
   - 첫 `targets`: `filter`, `scope`, `visit`, `regionFilterApplied`, `libraries[]`(사이클 02 항목), `holdings[]{holdingId, bookId, libraryId}`
     - 계획에 없는 도서관의 소장은 넣지 않습니다.
     - 순서 [안]: `bookIds` 순서, 한 책 안에서는 계획 순서(0단계). design-delta는 "계획 순서"라고만 적었으므로 고른 방식을 보고합니다.
   - `bookIds`가 모두 없는 책이면 소장 0개인 `targets` 뒤 곧바로 `done`입니다.
   - `GET /api/v1/book-availabilities/batches/stream`
     - 파라미터: `filter`, `batchNo`(2 이상), `candidates`(`holdingId` 쉼표, 최대 K=50 [안])
     - `targets`를 뺀 같은 이벤트를 보냅니다.
     - 없는 소장·꺼진 도서관은 그 줄만 `holding-failed`(`library_not_found`)입니다.
   - 테스트: 새 컨트롤러 테스트 두 개
     - 스트림 열기 전 400·422 (`Accept: text/event-stream, application/problem+json`에서도)
     - 이벤트 순서, 소장 0개 → `done`, 구독형 요청 없음
   - 확인
     - `./gradlew build` (`ModularityTests`: `availability → catalog` 허용, 순환 없음)
     - 실제 서버로 `bookIds` 하나를 열고 서버 로그를 봅니다. 그 책을 가진 도서관의 상세 페이지 요청만 있어야 하고, 같은 호스트 간격 1초 이상, User-Agent를 확인합니다 (AC-7, AC-13).
   - 위험: 중간

### 10단계: 웹 API 층, 주소, 설정 저장 (의존: 6단계. 스트림 타입은 9단계)

1. **API** (파일: `web/src/api/types.ts`, `client.ts`, `searchStream.ts`)
   - 책 타입과 페이지 타입, `holding-*` 이벤트 타입을 더합니다.
   - `fetchBooks`, `fetchBook`, 소장 첫 묶음·다음 묶음 스트림 함수를 더합니다 [안 이름].
   - 기존 사이트 검색 함수(`searchStream`, `batchStream`, `fetchLibraryPage`)는 직접 찾기용으로 그대로 둡니다.
2. **주소** (파일: `web/src/features/search/searchCondition.ts` + 테스트)
   - `/search?title=…&author=…&publisher=…&exact=…&roles=…&sort=…&view=…&direct=…`와 기존 `filter`·`scope`·`visit`을 씁니다.
   - **여러 조건을 그대로 읽습니다** (ADR-0033). 직접 찾기일 때만 첫 칸(title → author → publisher) 하나를 씁니다.
   - `q`는 계속 읽지 않습니다.
   - 값 이름 [안]: `view=books`(없으면 바로 보기), `direct=on`(없으면 끔)
3. **설정 저장** (새 `web/src/features/search/searchSettings.ts` [안] + 테스트)
   - `view`, `direct`를 브라우저(localStorage)에 저장하고 주소에도 남깁니다 [확정].
   - 주소 값과 저장 값이 다를 때는 주소를 우선합니다 [안]. 보고합니다.
   - 저장소를 쓸 수 없으면 기본값으로 동작합니다 [안]. 기본값은 바로 보기 [확정], 직접 찾기 끔 [안]입니다.
   - 테스트: 주소 읽기·쓰기(여러 조건, `q`만 있으면 첫 화면), 설정 저장·우선순위
   - 확인: `npm test`, `npm run build`
   - 위험: 낮음

### 11단계: 웹 검색 영역 + 설정 창 + 직접 찾기 모드 (의존: 10단계)

1. **검색 영역** (파일: `web/src/features/search/SearchForm.tsx` + CSS 모듈, `SearchPage.tsx`)
   - 사이클 03 조건 드롭다운을 **없앱니다** [확정]. 관련 테스트(`SearchForm.test.tsx`, `useSearchCondition.test.ts`)도 새 모양으로 바꿉니다.
   - 첫 화면은 제목 한 칸 + [검색] + "여러 조건" + ⚙입니다 [확정 기능, 버튼 이름·위치 안]. 안내 문구는 "책 제목을 입력하세요" [확정]입니다.
   - "여러 조건"을 펼치면
     - 저자·출판사 칸, 칸마다 "완전 일치" 체크(기본 꺼짐 [안])
     - 저자 칸 아래 옮긴이 / 그림 / 엮은이 체크(기본 꺼짐) [확정]
     - 검색 전에는 펼쳐도 검색하지 않습니다 [안].
     - 빈 칸은 조건에서 뺍니다.
   - 입력 오류 (검색하지 않음)
     - 채운 칸이 없음: "검색어를 입력하세요" [안 문구]
     - 칸이 2자 미만·50자 초과: 그 칸 아래 사이클 01 문구
   - 정렬: 결과 위 오른쪽에 기본 순서 / 출판일 최신순 / 출판일 오래된순 [확정 항목, 위치 안]
   - 완전 일치·역할·정렬을 바꾸면 첫 묶음부터 다시 검색합니다 [안].
2. **S4 설정 창** (새 파일 [안]: `web/src/features/search/SettingsPanel.tsx`, Radix Popover)
   - 보기 방식(바로 보기 / 책 먼저 고르기), 도서관에서 직접 찾기(끔 / 켬)
   - 바꾸면 곧바로 적용하고, 결과가 있으면 다시 검색합니다 [안].
3. **직접 찾기 모드**
   - 여러 조건 칸, 완전 일치, 역할, 출판일 정렬, 책 먼저 고르기를 **흐리게** 하고 짧은 이유를 붙입니다. 이유 예: "도서관 사이트 검색에서는 쓸 수 없어요" [안 문구].
   - 결과 위 안내 줄은 두지 않습니다 [확정] (사용자: "흐리게 이것만").
   - 검색은 사이클 03 흐름(`useSearch`, `ebook-searches`) 그대로이고, 첫 칸 하나만 씁니다.
   - 배치 [안]
     - 데스크톱: 한 줄 + 오른쪽 "여러 조건"·⚙, 펼친 칸은 아래 줄
     - 1024px·640px 이하: 아이콘만, 칸은 한 줄에 하나
   - 테스트: 여러 조건 펼치기, 빈 칸 제외, 입력 오류, 설정 변경 시 다시 검색, 직접 찾기 모드에서 흐림과 첫 칸 사용
   - 확인
     - `npm test`, `npm run build`
     - Playwright로 1280 → 768 → 375를 봅니다. 가로 넘침이 없어야 합니다.
   - 위험: 중간

### 12단계: 웹 바로 보기 결과 (의존: 10, 11단계)

1. **검색 상태** (파일: `web/src/features/search/useSearch.ts` 또는 새 훅 [안], `searchPlan.ts`, `rowVerdict.ts`, `sortBatch.ts`, `BatchSection.tsx`, `ResultRow.tsx`, `LibrarySummaryBar.tsx`)
   - `GET /books` → 결과 책의 `bookIds`로 소장 스트림을 엽니다.
   - 계획 상태 `PlanState`의 키를 `libraryId`에서 **`holdingId`** 로 바꿉니다 (ADR-0030). 소장에는 쪽이 없습니다.
   - 목록 맨 아래 "더 보기"
     - 남은 소장으로 다음 묶음을 부릅니다.
     - 이 책 쪽의 소장이 끝나면 `/books?page=n+1`을 부르고 스트림을 다시 엽니다 [안].
   - 줄 하나 = 도서관 × 책(소장)이고, 묶음 안 정렬은 사이클 02·03 규칙 그대로입니다 [확정].
   - 사이클 03 흐름은 직접 찾기용으로 남깁니다. 두 흐름이 상태를 섞지 않게 합니다.
   - 기준일 [안]: 결과 위에 범위("9월 28일~30일 기준"), 줄마다 그 도서관의 `collectedAt`
   - 수집 목록 0건 [안 문구]: "조건에 맞는 책이 수집 목록에 없어요 (9월 30일 기준)" + [도서관에서 직접 찾기]
     - 누르면 첫 칸 조건으로 사이클 03 검색을 합니다.
     - 주소에 `direct=on`을 붙일지, 설정 저장을 바꿀지는 [안]입니다. 기본 제안은 주소만 바꾸고 저장은 바꾸지 않는 것입니다. 보고합니다.
   - 도서관 줄 실패는 그 줄만 "확인 실패"입니다. 상세 페이지가 없어진 책도 같습니다.
   - 테스트
     - 소장 단위 계획(다음 후보, 끝난 뒤 다음 책 쪽)
     - `holding-*` 이벤트 반영
     - 0건 → 버튼
     - 조건 변경 시 초기화
   - 확인: `npm test`, `npm run build`, Playwright 데스크톱 먼저
   - 위험: 높음 (상태 구조 변경)

### 13단계: 책 먼저 고르기 + S3 책 화면 (의존: 10, 12단계)

1. **책 목록** (`SearchPage.tsx` 안 새 부품 [안])
   - `view=books`면 `GET /books`만 부르고 **도서관 요청이 없습니다** [확정].
   - 줄: 제목·저자·출판사·출판일·보유 도서관 수 [안] + 쪽 "더 보기"
   - 순서는 `/books` 순서 그대로입니다.
2. **S3** (파일: `web/src/main.tsx`에 `/books/:bookId` 라우트, 새 `web/src/features/book/BookPage.tsx` [안])
   - 주소: `/books/{bookId}` + 지금 `filter`·`scope`·`visit` [안]. 지역은 브라우저 저장값을 씁니다.
   - 내용: `GET /api/v1/books/{bookId}` → 대표 서지와 기준일, 같은 소장 스트림(`bookIds` 하나), 도서관별 줄(계획 순서)
   - 상태 [안 문구]
     - 도서관 0곳: "조건에 맞는 도서관이 없어요"
     - 404: "책을 찾을 수 없어요" + 목록으로
     - 뒤로 가기
   - 직접 찾기가 켜져 있으면 책 먼저 고르기는 쓸 수 없습니다 [안].
   - 테스트: 책 목록에서 스트림을 부르지 않음, S3 이벤트 반영, 404
   - 확인: `npm test`, `npm run build`, Playwright (1280/768/375)
   - 위험: 중간

### 14단계: 실제 데이터로 전체 확인 (의존: 0~13단계)

- 5단계에서 가져온 실제 데이터로 AC-1~AC-14를 "테스트" 표의 방법으로 확인합니다.
- 실제 사이트 요청은 수동으로 적게 보냅니다. 1초 간격을 지킵니다.
- 결과를 `# 사이클 04` 절의 AC 확인표에 적습니다.
- 위험: 중간

## 테스트

- 단위
  - 백엔드
    - 정리 규칙 테스트 벡터
    - 교보식 코드 → ISBN
    - 국가서지 사전·유일 일치
    - 7종 `parseDetail` fixture
    - `PlanOptions`
    - 파라미터 도우미(`bookIds`, `exact`, `roles`, `sort`, `page`)
  - 웹: 주소·설정 저장, 소장 단위 계획, 검색 영역, 직접 찾기 모드
- 통합(모듈)
  - `ModularityTests` (`ApplicationModules.of(ChaekcheckApplication.class).verify()`: `catalog` 새 모듈, `catalog → library`, `availability → catalog`, 순환 없음)
  - `DocumentationTests`
  - `db-test`에서 검색 SQL·가져오기 `COPY`
  - 컨트롤러 4개(`/books`, `/books/{id}`, 소장 스트림 두 개)
  - `BatchRunnerTests`(섞인 묶음·회귀)
- 실제 사이트와 서버 로그: 상세 페이지 요청만, 같은 호스트 1초 이상, User-Agent
- 화면: Playwright, 데스크톱 1280 → 태블릿 768 → 모바일 375

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 제목 한 칸, "여러 조건", 드롭다운 없음 | `SearchForm` 테스트 + Playwright | 11 |
| AC-2 "행동"+"새폴스키" → 「행동」만, 도서관별 대출·예약 | `/books` 실데이터 호출 + 화면 | 6, 9, 12, 14 |
| AC-3 붙여 쓴 결과 ⊂ 띄어 쓴 결과, 순서 다른 제목 | 검색 테스트(합성) + 실데이터 API 대조 | 4, 6, 14 |
| AC-4 제목 완전 일치 "행동" | 검색 테스트 + 화면 | 6, 11 |
| AC-5 옮긴이 "양병찬" 기본 없음 → 켜면 나옴, 그림·엮은이도 | 검색 테스트 + 화면 | 4, 6, 11 |
| AC-6 가입 단계 → 완전 일치 → 보유 수 → 출판일, 최신·오래된순, 날짜 모름 맨 뒤, 미래 날짜 안 보임 | 검색 테스트 + 가져오기 테스트(미래 날짜) + 화면 | 0, 4, 5, 6, 11 |
| AC-7 결과 책을 가진 도서관 상세 페이지로만 요청 | `detail_url` 검사 테스트 + 서버 로그 | 8, 9, 14 |
| AC-8 화면 종류 7개 상세 읽기 = 사이트 화면 | `parseDetail` fixture + 종류마다 1건 이상 화면 대조 | 7, 14 |
| AC-9 0건 버튼 → 사이클 03 검색, 설정으로도, 흐림 | 웹 테스트 + Playwright | 11, 12 |
| AC-10 빠진 책·오디오북·동영상북 없음 | 가져오기 테스트 + 실데이터 SQL 확인 | 5 |
| AC-11 조건·설정이 주소에 남아 새로고침 유지 | 주소·설정 테스트 + Playwright | 10 |
| AC-12 결과 필터·범위·방문·지역 반영 | `PlanOptions`·검색 테스트 + 화면 | 2, 6, 12 |
| AC-13 호출 예의 | `BatchRunnerTests` + 로그(간격, User-Agent, `cached`) | 8, 14 |
| AC-14 책 먼저 고르기: 도서관 요청 없음 → S3 도서관별 → 바로 보기 복귀 | 웹 테스트 + 서버 로그 + Playwright | 13 |

## 완료 기준

- [ ] 0단계(ADR-0027 순서)를 구현했거나 이미 된 것을 확인하고, 결과를 보고함
- [ ] 개발·테스트 DB가 pg_bigm 이미지로 돌고, `CREATE EXTENSION pg_bigm`이 Liquibase로 적용됨
- [ ] 실제 데이터 가져오기 완료. 건수·건너뛴 이유·묶기 단계별 수·시간을 기록함
- [ ] spec 5장 AC-1~AC-14를 위 표의 방법으로 모두 확인함
- [ ] `backend/`에서 `./gradlew build` 통과 (`ModularityTests` verify, `DocumentationTests` 포함)
- [ ] `web/`에서 `npm test`, `npm run build`, `npm run lint` 통과, Playwright로 1280/768/375 확인
- [ ] 데이터 파일(SQLite, TTL, zip, dump)이 저장소에 없음
- [ ] 측정, "[안] 값 목록"에서 바꾼 것, "[확인 필요]" 결과를 dev `docs/plan-feedback.md` `# 사이클 04` 절에 정리하고 사용자에게 전달함

## [안] 값 목록 (dev가 바꿀 수 있음. 바꾸면 알릴 것)

- 이름
  - `catalog/internal/{normalize, search, importer, web}` 패키지
  - `PlanOptions`, `LibraryRef`, `enabledLibraryRefs()`
  - `LookupTask`, `DetailPageFetcher`, `ParsedDetail`
  - 컨트롤러 이름, `CatalogErrors`
  - 프로필 `catalog-import`, 가져오기 설정 키
  - 이미지 경로 `docker/postgres-bigm/`와 이미지 이름
  - fixture 이름
  - 웹 `searchSettings.ts`, `SettingsPanel.tsx`, `features/book/BookPage.tsx`
- 데이터
  - 표 이름 `catalog_library_snapshot`
  - 역할 값 `AUTHOR`/`TRANSLATOR`/`ILLUSTRATOR`/`EDITOR`/`OTHER`/`UNKNOWN`
  - `content_type` CHECK `EBOOK`
  - 같은 모듈 FK `ON DELETE CASCADE`, `holding → snapshot` FK 없음
  - 인덱스 구성
  - 대표 제목·저자·출판사 = 가장 많이 나온 원문, 대표 출판일 = 최빈·같으면 이른 것
  - `detail_url` 호스트 검사(가져올 때와 요청 전)
  - `collected_at` 원천 = 수집 `library.last_full_success_at`
  - 다시 가져오기 = 지우고 새로
  - 정리한 글자만으로 묶는 단계 없음
- 검색
  - 저자 `OTHER` 역할 제외
  - `joinTier` 값 이름
  - 출판일 정렬이 같으면 기본 순서
  - 날짜 없는 책 맨 뒤
  - `holdingLibraryCount`에 범위·방문 반영
- API
  - `pageSize` 기본·최대 20, `bookIds` 최대 20, 다음 묶음 K=50
  - 검증 순서와 `errors[].code`
  - `collectedFrom`·`collectedTo` 계산 범위
  - 상세 캐시 키 `(libraryId, detailUrl)`
  - `targets.holdings[]` 순서
- 웹
  - 주소 값 `view=books`, `direct=on`, 주소 우선
  - 완전 일치 기본 꺼짐, 직접 찾기 기본 꺼짐
  - 펼쳐도 검색 전에는 요청 없음, 설정·완전 일치·역할·정렬 변경 시 다시 검색
  - 책 쪽이 끝나면 `/books?page=n+1`
  - 0건 버튼의 주소 처리, S3 주소 모양
  - 직접 찾기일 때 책 먼저 고르기 사용 불가
- 문구
  - "여러 조건", "검색어를 입력하세요"
  - "조건에 맞는 책이 수집 목록에 없어요 (…기준)"
  - "도서관 사이트 검색에서는 쓸 수 없어요"
  - "○월 ○일 기준 수집 목록", 기준일 범위 표기
  - "조건에 맞는 도서관이 없어요", "책을 찾을 수 없어요"

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 막는 단계 |
|---|---|---|
| pg_bigm 설치 절차(`shared_preload_libraries` 필요 여부), PG18 서버 헤더 패키지 이름 | 공식 문서 확인 (pg_bigm README, PostgreSQL 이미지 문서) | 1 |
| 기존 `db-data` 볼륨을 새 이미지로 그대로 쓸 수 있는지 | 시작 로그 확인 | 1 |
| 운영 호스팅이 pg_bigm을 지원하는지 (호스팅 미정) | 호스팅 결정 때 공식 문서 확인 | 배포 |
| `sqlite-jdbc` 버전·라이선스 | 공식 문서 확인 (Maven Central, 프로젝트 저장소), 사용자 승인 | 5 |
| 가져올 자료 종류: `KIDS_BOOK`·`PAPER`·`UNKNOWN` | 건수 세어 사용자에게 질문 | 5 |
| 저장된 `detail_url` 호스트 = `base_url` 호스트인지 (도서관별 표본) | 데이터 대조 | 5 |
| 같은 플랫폼 코드로 묶을 수 있는 화면 종류 범위 (교보·교보 구독형 `brcd`, 포털 `book_idx`) | 데이터 대조 | 5 |
| `48090…`, 확인 숫자가 안 맞는 `480` 코드 | 표본 조사 | 5 (계산 제외로 진행) |
| 국가서지 대조에서 제목이 다른 약 5%, 국가서지에 없는 약 23% | 표본 조사 | 5 |
| TTL 읽기 방식(스트리밍, 줄 단위로 충분한지) | 프로토타입 | 5 |
| 적재 전 인덱스 vs 적재 뒤 인덱스 (적재 시간) | 프로토타입 (실제 적재) | 5 |
| YES24 재수집 뒤 수치 (`removed_at IS NULL`) | 데이터 대조 | 5 |
| 저자 이름·역할 나누기(영문 "성, 이름" 쉼표, 단체 이름), ` - ` 부제 규칙 | 표본 조사 (사이트별 100건) | 4 |
| 사람별 표 구조와 기본 순서 집계의 응답 시간(1x, 가능하면 2x), `totalCount` 비용 | 프로토타입 (`EXPLAIN ANALYZE`) | 6 |
| 여러 단어 중 1글자 단어("행동 의")의 pg_bigm 동작 | 공식 문서, 프로토타입 | 6 |
| 강남구 상세 페이지에서 본 책 블록만 읽는 방법 | 호출 시험 | 7 |
| 상세 페이지로 "서비스하지 않는 책"을 알아보는 방법 | 호출 시험 | 없음 (빠진 날짜로 먼저 처리) |
| 운영 DB로 옮기는 방법 (운영에서 가져오기 실행 또는 `catalog` 스키마 dump/restore) | 사용자에게 질문 | 배포 |
| 저작권법 제93조·부정경쟁방지법 위험 | 출시 전 전문가 확인 | 출시 |

## 이번에 하지 않는 것

- 주기 갱신
  - 소장 목록 수집을 서비스로 옮기기
  - ISBN·서지 주기 갱신
  - 정리·묶기 다시 계산
  - 이상 알림, 목록이 오래됐다는 경고 기준
- ISBN 서지정보 API 연동 (인증키 대기), 정리한 글자만으로 묶기(묶기 4단계), 출판사 별칭 목록 채우기
- 수집 목록에만 있고 서비스 `library`에 없는 기관(대학·기업·학교, 북큐브 등)
- 오타 보정, 형태소 검색("행동하는"으로 "행동")
- 감수·기획·사진·원작·해설·낭독 역할 검색
- 기본 순서·출판일 외의 정렬(가나다순, 보유 도서관 많은 순, 대출 가능 많은 순 등)
- 표지·소개 표시
- 회원, 읽는 코드가 없는 화면 7종, 느리거나 실패하는 도서관 기억하기
- 여러 대 서버용 공유 캐시·간격 제어(Redis 등)
- 사이트 검색 API(`ebook-searches`)의 여러 조건 지원
- `region`, `fetch-service/` 변경
- 가져오기 결과를 운영 DB로 옮기는 작업 (방법은 사용자 결정 대기)

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 `# 사이클 04` 절에 **무엇이 달라졌는지와 이유**를 적습니다. 사용자 발언이면 그대로 옮깁니다.

- 사이클 03 후속: ADR-0027 순서 구현 결과(바꾼 코드, 테스트, 실제 `targets` 순서)
- 측정
  - 가져오기
    - 읽은 줄, 이유별 건너뛴 줄(도서관 불일치·종류·호스트 불일치·날짜)
    - 묶기 ①②③ 단계별 책 수, 국가서지로 ISBN이 붙은 수
    - 최종 `book`·`holding`·`book_contributor` 수, 걸린 시간, 인덱스 크기
  - 검색 응답 시간: 6단계 쿼리 목록, `EXPLAIN` 요약, research 3.2.1과 비교
  - 상세 페이지: 화면 종류별 AC-8 대조 결과, 강남구 본 책 블록 읽는 법, 404·시간 초과 빈도
  - 바로 보기 한 묶음의 요청 수와 시간(20줄, 8초 안에 끝났는지)
- 정한 값: 가져올 자료 종류, 묶을 수 있는 코드 공간, 5% 제목 불일치 처리, 저자 쉼표·단체 이름 규칙, 인덱스 생성 시점, 검증 순서·오류 값, `collectedFrom/To` 계산 범위, `holdings[]` 순서, 문구 최종안
- `[안]`으로 구현했거나 바꾼 것 ("[안] 값 목록" 기준)
- 설계와 달라진 점
  - `AvailabilityResolver`를 넓힌 방식
  - `LookupTask` 구조
  - `DetailVerdictCache` 확장
  - `HoldingRef`에 더한 칸
  - 웹 상태 구조(`PlanState` 키 변경, 두 흐름 분리)
  - 이미지·compose 변경, `CLAUDE.md` Directory Layout 변경 여부
- 새로 알게 된 제약
  - pg_bigm 빌드·운영 조건
  - 사이트별 상세 페이지 이상 동작
  - 수집 데이터 품질 문제(호스트 불일치, 날짜, 코드)
- 운영 이관 방법에 대한 사용자 답(받았다면)
