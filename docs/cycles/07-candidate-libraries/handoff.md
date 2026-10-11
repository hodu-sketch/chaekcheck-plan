# 개발 인계서: 사이클 07 후보 도서관 넣기 (+ 수집 방법 재구성, DB·검색 최적화)

## 요약

수집 DB 배포용 사본에서 전체 수집이 끝난 후보 도서관(사본 기준 2,412곳에서 제외분을 뺀 수)을 서비스 도서관 표에 새 번호로 넣습니다. 수집 번호와 서비스 번호를 잇는 짝 표는 새 모듈 `collection`이 가집니다. 모든 서비스 도서관의 책을 가져옵니다(소장 약 495만 → 약 2,100만 줄). 그래서 가져오기는 나눠 읽게 바꾸고, `catalog`에서 `collection`으로 옮깁니다. 책 검색은 책마다 미리 계산한 도서관 번호 배열(`book.library_ids`)로 거릅니다.
- `library`: 가입 조사 상태 `join_survey`를 더합니다. `MEMBERS_ONLY`·`NOT_SURVEYED` 도서관은 직접 추가했을 때만 검색 계획에 들어갑니다(API 등급 `UNSURVEYED`).
- `availability`: 북큐브(`BOOKCUBE_FX`)·알라딘(`ALADIN_V1`) adapter를 새로 만들고, 북큐브 대여형과 교보 구독형 화면의 소장형(`lending_model = OWNED`)을 따로 판정합니다.
- `mylibrary`: 브라우저의 직접 추가를 한 번에 옮기는 `POST /api/v1/me/library-imports`를 더합니다.
- 웹
  - S10: 로그인 전에도 열리고, 직접 추가는 브라우저에 저장합니다.
  - S11: 지역과 직접 추가를 함께 옮깁니다.
  - 결과 카드: 새 플랫폼 표시와 `join_survey`별 안내를 넣습니다.
  - 로고(자체 로고 199곳, 없으면 빈 상자), S12 `/about`, 바닥글 링크
  - nginx: gzip, 로고 캐시
- dev 쪽 수집 절차 문서와 스크립트를 두 갈래(① 도서관 수집 ② 책 수집)로 정리합니다.

## 목표

후보 도서관과 그 책을 서비스 DB에 넣어 후보 도서관도 이름으로 찾고 그 책도 검색되게 하되, 늘어난 양에 맞게 DB 형식과 검색 방법을 최적화하고, 도서관 수집과 책 수집을 두 갈래로 깔끔하게 다시 정리한다(`scope.md` 목표 [확정]).

**포함**
- seed 생성 스크립트(① 도서관 수집 갈래의 "넣기" 단계)와 Liquibase 새 파일 7개
- 새 모듈 `collection`: 짝 표와 가져오기 전부(옮기기, 나눠 읽기, 새 제외 규칙, 날짜 규칙, `library_ids`, 기록)
- `catalog`
  - `CatalogLoad.replaceAll` [안 이름] 공개
  - 제목 다듬기 규칙 공개
  - `/books` 거르기를 `library_ids &&`로 바꿈
- `library`: `join_survey`, `lending_model`, 로고 칸, 화면 종류 2개, 계획 규칙, `UNSURVEYED`
- `availability`: `BookcubeFxAdapter`, `AladinV1Adapter`, 상세 요청 주소 훅, 북큐브 대여형, 교보 소장형 숫자, 북큐브·알라딘 직접 찾기(첫 쪽만)
- `mylibrary`: `POST /api/v1/me/library-imports`
- 웹: S1(로그인 전 버튼), S10, S11, 결과 카드(S1·S3), 로고, S12, 바닥글
- nginx: gzip, `/library-logos/` 캐시, 화면 경로
- 실행과 측정: dry run(힙·시간·DB 크기), 사본으로 실제 가져오기, `/books` 측정(첫 쪽 1초)
- dev `docs/maintenance/` 두 갈래 정리, 같은 사이트 거르기 규칙, `--per-host`/`--host-slots` 우선순위 문서화
- 배포 전 Liquibase 합치기(대조 규칙대로)

**제외**: 학교·대학·회사·기관 자격 조사, 같은 기관 여러 사이트 묶기, 책 번호 유지, 책 묶기 기준 변경, 구독형 한도 표시, 수집기 갈아타기·코드 구조 정리, 갱신 기능, 매일 신간 수집, 배포. 자세한 내용은 "이번에 하지 않는 것"에 있습니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다.
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) **조용히 바꾸지 말고** 먼저 사용자에게 알리세요.
  - 내용과 이유는 dev `docs/plan-feedback.md`의 **새 `# 사이클 07` 절**에 쌓습니다. 사용자 발언이면 그대로 옮깁니다.
- 세부 이름은 `design-delta.md`대로 씁니다. `[안]`·`[안 이름]`·`[안 경로]`로 표시한 이름은 dev가 코드에 맞춰 바꿀 수 있습니다. 바꾸면 `# 사이클 07` 절에 알리기만 합니다 [확정] (사용자 승인, 2026-10-05, 설계 검토).
  - 해당 이름 예: `collection`, `collection_link`, `collection.catalog_import`, `CatalogLoad.replaceAll`, `join_survey` 값 이름, `logo_file`, `logo_visible`, `logoUrl`, `homepageUrl`, `library_import_not_empty`, `/api/v1/me/library-imports`, `chaekcheck.chosenLibraries.v1`, `detailFetchUri`, `SiteVerdict.SUBSCRIPTION`, changelog 파일 이름, 실행 프로필·설정 이름.
  - 규칙과 뜻은 바꾸지 않습니다.
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서·호출 시험으로 확인한 값입니다.
  - `[안]`: 제안입니다.
  - `[확인 필요]`: 모르는 값입니다. 확정된 것처럼 코드에 넣지 말고(필요하면 `TODO(확인 필요)` 주석), 확인한 뒤 결과를 보고합니다.
- **새 의존성은 원칙적으로 없습니다.**
  - XML 읽기는 JDK 기본 파서를 씁니다.
  - 로고 줄이기는 JDK `ImageIO` 등 이미 있는 도구로 합니다.
  - 의존성이 필요해지면(Python 패키지·테스트용 포함) 사용자에게 먼저 알리고 승인받습니다.
- 단계마다 적힌 확인이 통과해야 다음 단계로 넘어갑니다.
  - 백엔드: `backend/`에서 `./gradlew build` (`ModularityTests`, `DocumentationTests` 포함)
  - 웹: `web/`에서 `npm test`, `npm run build`, `npm run lint`
  - `fetch-service/`는 바뀌지 않습니다(호스트 허용 목록 없음, `UrlGuard`만).
- **구현 기준은 `design-delta.md`입니다.** 그림, 표 정의 전체, JSON 예시는 여기 다 옮기지 않았습니다. `architect-proposal.md`는 기록일 뿐 구현 기준이 아닙니다.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/07-candidate-libraries/design-delta.md`: **기준 문서**
  - 구조 그림(모듈 구성도, 흐름 A~D, 도메인 모델), 모듈 표
  - 데이터(칼럼 표, seed 규칙, Liquibase 순서와 합치기 규칙)
  - 가져오기 변경, 검색 변경(측정 검색어 묶음), API, 외부 연동, 로고, 수집 두 갈래, 확인 필요
- `../chaekcheck-plan/docs/cycles/07-candidate-libraries/spec.md`: R1~R9, 상태별 동작, AC-1~AC-24, 비목표
- `../chaekcheck-plan/docs/cycles/07-candidate-libraries/flow.md`: S1·S3(결과 카드), S10, S11, 로고, S12, AC 대응
- `../chaekcheck-plan/docs/cycles/07-candidate-libraries/research.md`
  - 1절: 북큐브 XML·알라딘 상세·검색 주소, 호출 기록 25건, 사이트 차이, 대여형
  - 2절: 사본 칸별 값 모양, 이름 중복, `base_url`·`detail_url` 모양, `content_kind`, 날짜
- `../chaekcheck-plan/docs/cycles/07-candidate-libraries/scope.md`: 범위, 수집 상태 표
- 데이터 원본 (git 밖, dev 기준 `../chaekcheck-data/`. 절대 경로 `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\`)
  - 배포용 사본: `snapshots/ebook-catalog-2026-10-05-0745.sqlite` (07:42 시점, 약 14GB, 읽기만). 설명 `../chaekcheck-plan/docs/research/ebook-catalog/snapshot-2026-10-05.md`
  - 후보 공공도서관 가입 조사: `library-join/public-join-2026-10-05.tsv`. dev join-classification과 같은 칸이고, **`decision` 칸이 사용자 결정**입니다. 근거 `../chaekcheck-plan/docs/research/library-join/candidates.md` 3절
  - 후보 도서관 종류: `library-join/candidate-kinds-2026-10-05.tsv`
  - 교보 기관 화면 조사(`lending_model` 값 출처): `other-platforms/kyobo-institutions-probe-2026-10-03.tsv`의 `library_model` 칸
  - 로고: `logos/registered-logos-2026-10-05.tsv`(`status=OWN` 199곳), 원본 파일 `logos/<library_id>.<확장자>`
  - 같은 사이트 짝 표(기록용): `../chaekcheck-plan/docs/research/ebook-catalog/data/same-site-candidates-2026-10-05.tsv`, 대조 근거 `../chaekcheck-plan/docs/research/maintenance/collection-areas.md` 2-2절
- 수집 두 갈래(plan 쪽 정리): `../chaekcheck-plan/docs/research/collection/1-libraries.md`, `2-books.md`
- ADR (`../chaekcheck-plan/docs/adr/`)
  - 0052: 후보 도서관은 새 번호, 짝 표는 새 모듈 `collection`(seed로 넣음)
  - 0053: `join_survey` 값 넷. 미조사는 직접 추가일 때만 계획에, 등급 `UNSURVEYED`
  - 0054: 모든 서비스 도서관의 책을 나눠 읽어 가져옴. 새 제외 규칙, 날짜 규칙, `VACUUM (ANALYZE)`
  - 0055: `book.library_ids` 미리 계산, 검색은 `holding`을 읽지 않음
  - 0056: 북큐브·알라딘은 상세로 읽음. 북큐브 대여형·교보 소장형 판정, 직접 찾기는 첫 쪽만
  - 0057: 로그인 전 직접 추가(브라우저) + 한 번에 옮기는 새 요청
  - 0058: 도서관 목록은 통째로 + gzip
  - 0059: 로고(자체 로고만, 미리 줄인 파일, 누르면 메인 페이지, 없으면 빈 상자, DB 값으로 바로 내림, `/about`)
  - 0060: 가져오기는 `collection`, 제목 다듬기 규칙은 `catalog`에 한 벌만 두고 빌려 씀
  - 그대로 따르는 것: 0013, 0016, 0019, 0022, 0027, 0031(정리 코드 한 벌 원칙), 0032, 0037, 0047, 0049, 0050, 0051
- 사이클 06: `../chaekcheck-plan/docs/cycles/06-my-libraries/handoff.md`(C1~C23), `retro.md`

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0052 | `collection.collection_link(collection_library_id PK, library_id UNIQUE)`. 후보 도서관 줄과 짝 줄은 seed CSV(번호 명시)로 넣음. 등록 도서관은 같은 번호끼리 짝 |
| 0053 | `library.join_survey` 기본 `SURVEYED`. `MEMBERS_ONLY`·`NOT_SURVEYED`이면서 `!chosen`이면 계획에서 뺌(요청도 없음). API 등급 `UNSURVEYED`, 안내 문구는 조사 상태로 가름. `NOT_FOUND`는 등록 도서관의 "자격 미확인"과 같음(ADR-0013) |
| 0054 | 짝 표의 모든 서비스 도서관 책. 나눠 읽기(방법·크기 dev). 북큐브 `book/wma`·`book/vod`·`book/wmv`, 교보 `동영상` 제외. 8자리 날짜. 명지대(수집 번호 100555)의 1950년 이전 날짜는 NULL. 쓴 뒤 `VACUUM (ANALYZE)`. 사이클 04 범위 결정을 바꿈 |
| 0055 | `catalog.book.library_ids bigint[] NOT NULL` + GIN. `/books`는 `b.library_ids && :planned` |
| 0056 | `BOOKCUBE_FX`, `ALADIN_V1`. 북큐브 `{base}/xml/productView/?num=`, 알라딘 상세 "보유현황". 대여형(`volume=0` + `nowRentalCount` 있음)은 "구독형 · 바로 대출". 교보 `lending_model = OWNED`는 숫자(읽는 위치 [확인 필요]) |
| 0057 | 로그인 전 브라우저 키 `chaekcheck.chosenLibraries.v1` [안 이름], 최대 20. 로그인 때 `POST /api/v1/me/library-imports` |
| 0058 | `GET /api/v1/libraries`는 통째로, nginx `gzip on; gzip_types application/json;`. 화면은 앞 글자가 맞는 것 먼저 → 가나다순, 두 글자 이상, 20곳씩 + "더 보기" |
| 0059 | `logo_file`·`logo_visible`, `web/public/library-logos/{서비스 번호}.{확장자}` [안 경로], 긴 캐시, 누르면 `homepageUrl` 새 창, 없거나 못 불러오면 빈 상자, `/about` |
| 0060 | 의존 `collection → catalog, library`, `catalog → library`. 고리 없음, 새 이벤트 없음. 가져오기 코드는 `collection`으로 옮기고, 표 쓰기는 `catalog`의 `CatalogLoad.replaceAll` |

ADR 없이 `design-delta.md` "데이터" 절에만 기록된 결정
- Liquibase는 **새 파일로 넣고, 비교·대조한 뒤 기존 파일에 합칠지 정합니다** [확정] (사용자 제안). 합치는 때는 배포 전(`PRE_DEPLOYMENT`가 있는 동안)입니다 [확정] (사용자 승인, 2026-10-05). 대조 규칙은 C8에 있습니다.

## 지켜야 할 제약

dev `CLAUDE.md`, 스킬 규칙(`.claude/skills/spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), 사이클 05·06 인계서의 제약(C1~C34, C1~C23)을 그대로 따릅니다. 여기에는 이 사이클에서 더하거나 바뀌는 것만 적습니다.

### dev 규칙의 예외 (이 범위만)
- C1. dev `CLAUDE.md` "Library Research Record (required)"에는 "Do not add a library now and leave its eligibility for later"가 있습니다. 이번 사이클에는 이 규칙의 **예외가 하나 있습니다** [확정] (사용자 승인, 2026-10-05, 설계 검토, ADR-0053).
  - `join_survey`가 `MEMBERS_ONLY`·`NOT_SURVEYED`인 후보 도서관(약 2,500곳)은 가입 조사 없이 넣습니다. 이 도서관들은 조사 상태 표시로 구분되고, 직접 추가했을 때만 검색에 나옵니다.
  - `SURVEYED`·`NOT_FOUND` 후보 공공도서관은 다시 조사하지 않습니다. 제공된 조사 표(`public-join-2026-10-05.tsv`, `decision` 칸 우선)를 그대로 씁니다.
  - 이 예외 밖의 도서관 조사 작업은 지금 규칙대로 합니다.
  - 그래도 기록 규칙은 지킵니다. `docs/library-maintenance.md` 작업 기록에 다음을 남깁니다.
    - 이번 넣기의 출처(사본·두 TSV)
    - 이 예외와 그 근거(ADR-0053)
    - seed 스크립트 사용법
    - 뺀 곳과 이유: 같은 사이트 99곳, 체험용·운영 중단 4곳, 시험용 6곳

### 모듈 경계
- C2. 새 모듈은 `com.chaekcheck.collection`입니다(`@ApplicationModule(allowedDependencies = {"catalog", "library"})` [안]). 의존 방향은 `collection → catalog → library → region`, `collection → library`, `availability → catalog, library`, `mylibrary → auth, library, region`뿐입니다. `ModularityTests`에서 순환이 없어야 합니다.
  - `collection`이 `library`에서 쓰는 것은 `LibraryCatalog.enabledLibraryRefs()`뿐입니다. 이것으로 짝 맞춘 서비스 도서관이 켜졌는지, `base_url`이 같은지 확인합니다. `library` 표는 읽지 않습니다.
  - `collection`이 `catalog`에서 쓰는 것
    - `CatalogLoad.replaceAll(...)` [안 이름]
    - 제목 다듬기 규칙(`CatalogText`, `Contributors`, `Isbn`, `PublishedDates` 등)
  - **제목 다듬기 규칙은 지금 `catalog.internal.normalize`에 있습니다**(dev 코드, 2026-10-05 읽음). 공개 방법은 dev가 정하고 보고합니다.
    - 예 1: 패키지를 `com.chaekcheck.catalog.normalize`로 옮기고 `@NamedInterface`를 붙입니다.
    - 예 2: 자리에 두고 named interface로 공개합니다.
    - 어느 쪽이든 **규칙 코드는 한 벌**입니다(ADR-0031·0060). 복사하지 않습니다.
- C3. `collection` 표는 다른 모듈 표에 FK를 두지 않고, 다른 스키마와 JOIN하지 않습니다.
  - 등록 도서관 짝(같은 번호끼리)도 `library.library`를 읽어 만들지 않습니다. seed CSV에 줄로 적습니다.
- C4. `catalog.catalog_import`를 `collection.catalog_import`로 옮길 때, 지금 `catalog.catalog_library_snapshot.import_id`가 `catalog.catalog_import(id)`를 FK로 가리킵니다(dev `catalog/001-catalog-schema.yaml`). 이 점은 `design-delta.md`에 없습니다.
  - `catalog_library_snapshot`(도서관별 수집 기준일)은 검색이 쓰므로 `catalog`에 남깁니다. `replaceAll`이 채웁니다 [안].
  - `import_id` FK는 모듈을 넘으므로 없앱니다. 칸을 지울지, FK 없이 번호만 둘지는 dev가 정하고 보고합니다 [안].

### 데이터와 seed
- C5. seed 규칙 [확정] (`design-delta.md` "데이터")
  - 넣을 후보: 수집 번호 ≥ 100001, `crawl_skip` 없음(같은 사이트 99곳이 여기서 빠짐), `last_full_success_at` 있음
  - 뺄 곳: 체험용·운영 중단 4곳(삼각산 북라이브, 대구동구안심 북큐브, 순창 북라이브, 양평 북큐브), 종류 표의 시험용 6곳
  - 번호: 새 번호는 지금 최대(280) 다음부터 씁니다. 등록 도서관 짝은 같은 번호입니다(59·131 포함).
  - 이름
    - 겹치면 `이름 (북큐브|교보|YES24|알라딘)`을 붙입니다.
    - 그래도 겹치면 `이름 (라벨, 호스트)`를 붙입니다.
    - **처음 정한 이름과 번호는 다음 seed에서 바꾸지 않습니다.**
  - 기본값: `homepage_url = base_url`, `holdings_count = NULL`, `enabled = true`
  - 가입
    - 조사된 후보 공공도서관(`decision` 칸 우선): `SURVEYED`. 가입 규칙 줄과 `join_method`·`visit_required`·`join_caution`·`extra_condition_text`(책이음 9곳)를 넣습니다.
    - 원문을 못 찾은 곳: `NOT_FOUND`, 규칙 없음
    - 초·중·고, 대학, 회사, 정부·공공기관, 단체·아파트: `MEMBERS_ONLY`
    - 종류 모름: `NOT_SURVEYED`, `join_method = NULL`
- C6. `lending_model`(`OWNED`·`SUBSCRIPTION`·`MIXED`·`RENTAL`, NULL이면 지금 규칙)은 `kyobo-institutions-probe-2026-10-03.tsv`의 `library_model`에서 채웁니다. 대상은 교보 구독형 화면(`KYOBO_SUBSCRIPTION_V1`) 기관입니다.
  - 등록 도서관 중 이 화면을 쓰는 소장형 5곳(ADR-0056 배경)도 값을 받아야 합니다. 등록 도서관 줄을 어느 changeset에서 고칠지(`library/007`의 UPDATE 등)는 dev가 정하고 보고합니다 [안].
- C7. 같은 이름 확인: 후보끼리 98묶음 211곳, 등록 도서관과 같은 이름 27곳이 있습니다(`research.md` 2절). seed 생성 결과에 `library.name` UNIQUE 위반이 없어야 합니다.
- C8. Liquibase 합치기 대조 규칙 [확정] (사용자 제안: "만약에 기존 것에 있고 새거에는 없다면 기존 것이 정말로 활성화된 사이트인가 검사하고 해야 할 거 같은데", 2026-10-05)
  - 합치는 때는 실제 가져오기와 AC 확인이 끝난 뒤, 배포 전입니다(`PRE_DEPLOYMENT`가 있는 동안).
  - 둘 다 있으면 합치고, 다른 점은 목록으로 보고합니다.
  - 새 파일에만 있으면 넣습니다.
  - **옛 파일에만 있으면 지우지 않습니다.** dev가 그 사이트 첫 화면을 한 번 엽니다(같은 호스트 1건·1초).
    - 열리지 않거나 바뀌었으면 `enabled = false` **제안 목록**을 사용자에게 보입니다. 사용자가 정합니다.
  - 기존 changeset을 고쳤으면 로컬 `db`·`db-test`를 초기화해 다시 적용합니다(dev `CLAUDE.md`).

### 가져오기
- C9. 가져오기 원본은 배포용 사본 `ebook-catalog-2026-10-05-0745.sqlite`입니다 [확정]. 지금처럼 읽기 전용으로 엽니다.
  - 돌고 있는 수집기의 원본 DB(`chaekcheck-data\ebook-catalog.sqlite`)와 옛 복사본 스크립트(`chaekcheck-data\scripts\`)는 건드리지 않습니다 [확정].
- C10. 도서관 찾기는 짝 표로 수집 번호를 서비스 번호로 바꿉니다.
  - 짝이 없거나 꺼졌으면 `library_not_in_service`로 셉니다. 같은 사이트 99곳도 여기에 듭니다.
  - `base_url`이 다르면 `library_base_url_mismatch`로 셉니다. 이 검사는 안전장치입니다.
  - 지금 제외 규칙(오디오북·동영상북, 빠진 책, http 아닌 주소, 호스트 불일치, 제목 없음)은 그대로 둡니다. 국가서지 TTL 단계도 그대로입니다.
- C11. 가져오는 동안 책 검색이 기다리는 것은 배포 전이라 받아들입니다 [확정] (spec R7-5). 운영 중 다시 가져오기는 이번 범위가 아닙니다.

### 검색 계획과 API
- C12. 계획 규칙 [확정] (ADR-0053)
  - `join_survey ∈ {MEMBERS_ONLY, NOT_SURVEYED}`이고 `!chosen`이면 계획에서 뺍니다. "전체 도서관"이어도 같습니다.
  - 직접 추가된 미조사 도서관은 지금 `chosen` 규칙을 따릅니다(맨 앞, ADR-0050).
  - 등록 도서관의 계획, 순서, 결과는 바뀌지 않습니다(AC-6, AC-15).
- C13. `findEnabledTarget`(다음 묶음 API와 `PUT /me/libraries`가 씀)은 미조사 도서관도 돌려줍니다. 웹은 사이클 06처럼 첫 스트림의 `targets`에서 `chosen`을 읽습니다.
- C14. R6 안내 문구는 `join_survey` 값 넷으로 가릅니다. 그런데 API 등급은 `UNSURVEYED` 하나이고, `NOT_FOUND`는 등록 도서관의 `UNVERIFIED`와 같은 등급입니다. 그래서 **웹이 `join_survey`를 알 칸이 필요합니다.** `design-delta.md` API 표에는 이 칸이 없습니다.
  - 제안: `targets.libraries[]`에 `joinSurvey` [안 이름]를 더합니다. 필요하면 `GET /api/v1/libraries` 항목에도 더합니다. 등록 도서관은 `SURVEYED`입니다.
  - dev가 정하고 `# 사이클 07` 절에 보고합니다.
- C15. 교보 소장형 판정에 `lending_model`이 필요합니다. `design-delta.md`는 `LibraryRef`에 더한다고 적었지만 `availability`는 `SearchTarget`을 씁니다. 그래서 `SearchTarget`에도 `lendingModel` [안]을 더합니다. 어느 쪽에 둘지는 dev가 정하고 보고합니다.
- C16. 오류는 RFC 9457 + `code`입니다(ADR-0008). 새 `POST /api/v1/me/library-imports`의 400·409·422는 `MyLibraryErrors`로 씁니다.
  - `design-delta.md`는 0개·21개 이상·숫자 아님을 **422 `invalid_request`**로 적었습니다. 지금 `PUT /me/regions`는 같은 종류의 오류를 **400 `validation_error`**(`invalid_format`/`too_many`)로 줍니다.
  - 설계대로 하되, 맞추는 편이 낫다고 보면 사용자에게 먼저 묻습니다([확인 필요] 표).

### 외부 사이트
- C17. 호출 예의는 지금과 같습니다(같은 호스트 1건·1초, 캐시 3분, 시간 초과 5초) [확정]. 북큐브 XML 파서는 DTD와 외부 엔티티를 끕니다 [확정] (`design-delta.md` 외부 연동).
- C18. 북큐브·알라딘 "도서관에서 직접 찾기"는 쪽 넘기기를 시험하기 전까지 첫 쪽만 읽습니다. 알라딘 출판사 검색은 그 도서관을 실패로 보입니다 [확정] (ADR-0056).

### 웹
- C19. 로그인 전 직접 추가는 브라우저에만 저장하고 서버에는 보내지 않습니다(AC-18). 로그인한 동안은 서버 값만 씁니다(사이클 06 C18과 같은 방식). 로그아웃하면 브라우저 값을 다시 씁니다.
- C20. React에서 `dangerouslySetInnerHTML`을 쓰지 않습니다. 도서관 이름, 안내 문구, 로고 `alt`도 마찬가지입니다.
  - 외부 링크(`homepageUrl`)는 기존 `web/src/lib/safeUrl.ts` 규칙을 거쳐 새 창(`rel="noopener noreferrer"`)으로 엽니다.

### 알고 받아들인 한계 (버그로 고치지 않음)
- 직접 추가하지 않은 이용자에게는 소속 구성원용·종류 모름 도서관이 보이지 않습니다. 종류는 이름으로 본 것이라 틀릴 수 있습니다(ADR-0053).
- `book.library_ids`는 가져올 때만 맞습니다(ADR-0055).
- 브라우저 직접 추가는 그 기기에만 있습니다(ADR-0057).
- 북큐브·알라딘 직접 찾기는 첫 쪽만 읽습니다(ADR-0056).
- 등록 도서관 책의 대표 제목·묶음이 조금 바뀔 수 있습니다. AC-6 기준은 "가진 (도서관, 책 코드) 집합과 책 순서가 같음"입니다 [확정].

## 개발 시작 전 확인

### dev가 확인하거나 할 것

- [ ] base package는 `com.chaekcheck`입니다(dev `CLAUDE.md`). 새 모듈 패키지는 `com.chaekcheck.collection`입니다.
- [ ] 사본 파일이 있고 읽히는지 확인합니다: `quick_check`, `library` 표 줄 수 3,016(278 + 2,738).
- [ ] 두 TSV의 칸 이름을 확인합니다. 특히 `public-join-2026-10-05.tsv`의 `decision` 칸과 지역 칸이 지금 `scripts/library/eligibility_rules.py`·`apply_join_classification.py` 입력과 맞는지 봅니다. 안 맞으면 변환 방법을 보고합니다.
- [ ] 소속 전용으로 조사된 후보 공공도서관 2곳(대구학생전자도서관, 세종북자람)을 지금 규칙 칸(`basis`·`scope_type`)으로 나타낼 수 있는지 확인합니다. 못 나타내면 멈추고 사용자에게 묻습니다([확인 필요] 표).
- [ ] `registered-logos-2026-10-05.tsv`의 `library_id`가 서비스 번호와 같은지 확인합니다(등록 도서관은 수집 번호 = 서비스 번호).
- [ ] 0단계(기준 응답)를 **코드를 바꾸기 전에** 만듭니다. 바꾼 뒤에는 다시 만들 수 없습니다.

### 사용자가 할 것

| 할 일 | 언제 | 결과를 dev에 알려 줄 것 |
|---|---|---|
| 로고 내림 요청용 서비스 전용 이메일 주소를 만들어 알려 주기. 그 전에는 S12에 자리 글을 둠 | 배포 전 | 이메일 주소 |
| 소속 전용 후보 공공도서관 2곳의 처리(규칙으로 못 나타낼 때만) | 1단계 중 | 처리 방법 |
| 교보 소장형 숫자를 읽을 방법이 없을 때 어떻게 할지(dev 시험 결과를 보고) | 7단계 중 | 처리 방법 |
| `library-imports` 오류 코드(422 `invalid_request` 그대로 / 400 `validation_error`로 맞춤) | 8단계 전(dev가 물을 때만) | 고른 쪽 |
| 화면 확인: S10 로그인 전, 이름 찾기 결과 순서, S11 문구, 결과 카드의 북큐브·알라딘 칸, `join_survey` 안내 창, 로고와 빈 상자, S12 | 16단계 화면을 본 뒤 | 바꿀 점 |
| 북큐브·알라딘 숫자를 사이트 화면과 비교(AC-7, AC-8). 몇 권 골라 직접 봄 | 16단계 | 맞는지 |
| 운영자 로고 끄기 시험(AC-22). dev가 SQL 한 줄을 알려 줌 | 16단계 | 결과 |
| 배포 전 Liquibase 합치기에서 `enabled = false` 제안 목록 승인 | 17단계 | 끌 도서관 |
| 사이클 06 뒤 dev에서 따로 한 작업(S8·S9 돌아가는 길, 탭 제목, 글꼴 서브셋) 알려 주기 | 언제든 | plan 회고 입력 |

### 무엇이 어느 단계를 막는가

| 막는 것 | 막히는 단계 | 막히지 않는 것 |
|---|---|---|
| 0단계 기준 응답 | 2단계 이후 코드 변경 | 1단계(스크립트), 18단계(문서) |
| 소속 전용 2곳 처리 | 1단계의 그 2줄 | 나머지 seed |
| 교보 소장형 숫자 위치 | 7단계의 그 부분, AC-23 | 북큐브·알라딘 adapter |
| 로고 이메일 | 배포 | 모든 단계(자리 글로 진행) |
| `enabled = false` 목록 승인 | 17단계 마무리 | 1~16단계 |

## 구현 단계

### 0단계: 기준 응답 만들기 (AC-6, AC-15 비교용) (의존: 없음)

1. **지금 코드로 같은 사본을 가져오기** (코드 변경 없음, 실행만)
   - 할 일: 지금 `catalog-import` 프로필로 `sqlite-path`를 배포용 사본으로 줘서 등록 도서관만 가져옵니다(dev `docs/maintenance/3-import.md`).
   - 이유: AC-6은 "이 사이클 전과 같은 사본"을 기준으로 비교해야 합니다. 지금 DB가 옛 사본이면 소장이 달라 비교가 안 됩니다.
2. **응답 저장** (git 밖 `data/` 아래 [안 경로])
   - 할 일: 아래 응답을 JSON으로 저장합니다. 저장한 위치와 방법을 보고합니다.
     - 측정 검색어 묶음의 `GET /api/v1/books` 첫 쪽과 2쪽(로그인 전, 지역 없음 / 지역 1개 / `scope=joinable`)
     - 같은 조건의 스트림 `targets`
   - 측정 검색어 묶음 [확정] (`design-delta.md` "검색 변경"): "사랑", "소년", "해리", "역사", "김영하", "민음사", 제목+저자 AND 2개, 출판일순 1개. 구체적인 AND·출판일순 검색어는 dev가 정하고 적습니다.
   - 같은 묶음으로 응답 시간과 `EXPLAIN (ANALYZE, BUFFERS)`도 남깁니다(전후 비교).
- 확인 방법: 저장 파일 목록, 응답 시간 표
- 위험: 낮음

### 1단계: seed 생성 스크립트 — ① 도서관 수집의 "넣기" (의존: 없음)

1. **스크립트** (새 파일 예: `scripts/library/build_candidate_seed.py` [안 이름]. 기존 `build_seed.py`·`eligibility_rules.py`·`apply_join_classification.py`를 다시 씀)
   - 입력: 사본(읽기 전용), `public-join-2026-10-05.tsv`, `candidate-kinds-2026-10-05.tsv`, `kyobo-institutions-probe-2026-10-03.tsv`, 지금 seed CSV·YAML(이름과 최대 번호)
   - 출력 (모두 `backend/src/main/resources/db/changelog/` 아래)
     - `library/008-library-candidates.csv`, `library/008-eligibility-rule-candidates.csv` [안 이름]
     - `collection/002-collection-link.csv` [안 이름]: 등록 도서관 같은 번호 짝 + 후보 짝
     - 등록 도서관 `lending_model` 값(C6)
   - 규칙: C5, C7
   - 같은 사이트 거르기 [확정] (spec R8): `crawl_skip`이 있는 곳은 뺍니다. 더해서 **http/https와 포트를 무시한 호스트**가 등록 도서관과 같은 후보는 **`item_key` 겹침**을 계산해 목록으로 출력합니다.
     - 겹친다고 볼 기준 값은 정해져 있지 않습니다(2026-10-05 대조에서는 "100% 같음"과 "모두 겹침"). 그래서 자동으로 빼지 말고 사본 기준 결과를 보고합니다 [확인 필요].
     - 이미 표시된 99곳 밖에서 걸리는 곳이 있으면 멈추고 사용자에게 알립니다.
   - 번호 규칙: 다음에 다시 돌려도 이미 있는 짝(수집 번호)은 같은 번호·이름을 유지하고, 새 후보만 "마지막 번호 다음"부터 받습니다. 지금 seed에서 이름이 바뀌지 않는지 비교합니다 [확인 필요: dev 확인].
   - 끝에 셈을 출력합니다: 넣은 후보 수(R1-6 최종 수), 뺀 곳별 수와 이유, `join_survey` 값별 수, 이름에 라벨·호스트가 붙은 수, `lending_model` 값별 수.
   - 이유: ADR-0052. seed 만들기가 ① 갈래의 "넣기" 단계가 됩니다(18단계 문서).
   - 의존: 없음
   - 위험: 중간. 번호와 이름은 한 번 정하면 브라우저와 계정에 저장됩니다.
- 테스트: 같은 입력으로 두 번 돌리면 출력이 같습니다. 가짜 새 후보 1곳을 더하면 그 곳만 다음 번호를 받습니다. 이름 겹침 세 경우(라벨, 라벨+호스트, 등록 도서관과 겹침)를 확인합니다. 체험용 4곳·시험용 6곳·`crawl_skip`이 빠집니다. 테스트 방식(작은 SQLite 표본 등)은 dev가 정합니다.
- 확인 방법: 스크립트 출력의 셈을 `# 사이클 07` 절에 적습니다. `docs/library-maintenance.md` 작업 기록에도 남깁니다(C1).
- 위험: 중간

### 2단계: Liquibase 새 파일과 Java enum (의존: 0·1단계)

1. **master 순서** (파일: `backend/src/main/resources/db/changelog/db.changelog-master.yaml`)
   - `library/007` → `library/008` → `collection/001` → `collection/002` → `catalog/002` 순서입니다 [확정]. `catalog/003`과 `library/009`는 그 뒤에 둡니다 [안].
   - 지금 `mylibrary/001` 뒤에 붙이고, 순서가 맞는지 확인합니다.
2. **`library/007-library-candidates-schema.yaml`** [안 파일 이름]
   - `join_survey text NOT NULL DEFAULT 'SURVEYED'` + CHECK(값 넷)
   - `join_method`를 NULL 허용으로 바꾸고 CHECK `library_join_method_check`(`join_survey <> 'SURVEYED' OR join_method IS NOT NULL`)를 겁니다.
   - `library_platform_type_check`를 다시 만들어 `BOOKCUBE_FX`, `ALADIN_V1`을 더합니다(9개).
   - `lending_model text NULL` + CHECK(`OWNED`,`SUBSCRIPTION`,`MIXED`,`RENTAL`)
   - CHECK는 `sql` changeset으로 씁니다(Liquibase OSS YAML에는 없음).
3. **`library/008-library-seed-candidates.yaml`** + 1단계 CSV
   - `loadData` 두 개(도서관, 가입 규칙)를 둡니다. 칼럼에 `join_survey`, `lending_model`을 더합니다.
   - 끝에 `ALTER TABLE library.library ALTER COLUMN id RESTART WITH <마지막+1>`을 둡니다(`006`과 같은 방식).
   - 등록 도서관 `lending_model` 갱신(C6)은 여기나 `007`에 둡니다.
4. **`collection/001-collection-schema.yaml`**
   - `CREATE SCHEMA collection`
   - `collection.collection_link(collection_library_id bigint PK CHECK > 0, library_id bigint NOT NULL UNIQUE CHECK > 0, created_at timestamptz NOT NULL DEFAULT now())`. FK는 없습니다.
   - `collection.catalog_import`: 지금 `catalog.catalog_import`와 같은 칸으로 시작합니다. 칸을 더할지는 dev가 정합니다. 예: 건너뛴 이유별 수, 사본 이름.
5. **`collection/002-collection-seed-candidates.yaml`** + CSV(짝)
6. **`catalog/002-book-library-ids.yaml`**: `catalog.book.library_ids bigint[] NOT NULL`(빈 표이므로 기본값 없이 가능한지 확인. 안 되면 `DEFAULT '{}'`) + GIN 인덱스 `book_library_ids_gin`
7. **`catalog/003-drop-catalog-import.yaml`** [안 이름]
   - `catalog.catalog_import`를 지웁니다. 옛 줄을 옮길지, 배포 전이라 그냥 지울지는 dev가 정합니다 [안].
   - C4: `catalog_library_snapshot.import_id`의 FK를 먼저 없앱니다.
8. **`library/009-library-logos.yaml`** [안 파일 이름]: `logo_file text NULL`, `logo_visible boolean NOT NULL DEFAULT true`, 199곳 `logo_file` 값(CSV). 파일 이름 규칙은 12단계 로고 파일과 같습니다(`{서비스 번호}.{확장자}`).
9. **Java** (파일: `backend/src/main/java/com/chaekcheck/library/PlatformType.java`, `library/internal/Library.java`)
   - `PlatformType`에 `BOOKCUBE_FX`, `ALADIN_V1`을 더하고 Javadoc을 씁니다.
   - `Library` 엔티티에 새 칸을 매핑합니다. `join_method`는 null 허용입니다.
   - `availability/internal/resolve/AvailabilityResolvers.java`의 `switch`가 컴파일되도록 두 값을 임시로 처리합니다. 7단계 전까지 이 화면 종류는 "확인 실패"로 보입니다. 방법은 dev가 정합니다.
- 테스트
  - 스키마 적용 후 CHECK 위반 INSERT가 실패합니다: `join_survey` 값, `SURVEYED` + `join_method NULL`, `platform_type`, `lending_model`, `collection_link` 0 이하·중복 `library_id`.
  - seed 줄 수가 1단계 셈과 같습니다. IDENTITY 다음 값을 확인합니다.
  - 등록 도서관 278줄은 `join_survey = SURVEYED`이고 다른 칸이 바뀌지 않습니다.
  - 기존 테스트에서 `catalog.catalog_import`를 쓰는 곳(`CatalogImporterTests`, `BookSearchTests`)을 고칩니다.
- 확인 방법: 로컬 `db`·`db-test` 초기화 → `./gradlew build` → `psql`로 `\d library.library`, `\d collection.*`, `\d catalog.book`
- 위험: 중간(IDENTITY, CHECK 다시 만들기, 표 이동)

### 3단계: `collection` 모듈과 가져오기 코드 옮기기 (ADR-0060) (의존: 2단계)

1. **모듈 선언** (새 파일: `backend/src/main/java/com/chaekcheck/collection/package-info.java`): `@ApplicationModule(allowedDependencies = {"catalog", "library"})` [안]. named interface를 쓰면 그 이름까지 적습니다(C2).
2. **`catalog` 공개 기능** (새 파일 예: `backend/src/main/java/com/chaekcheck/catalog/CatalogLoad.java` [안 이름], 구현은 `catalog/internal/`)
   - 할 일: `replaceAll(...)`: 받은 책·사람·소장(+ 도서관별 수집 기준일)으로 다음을 합니다.
     - `TRUNCATE`(`book_contributor`, `holding`, `book`, `catalog_library_snapshot`) → COPY
     - 끝나면 `VACUUM (ANALYZE)`. VACUUM은 트랜잭션 밖에서만 됩니다.
   - 넘기는 모양은 dev가 정합니다 [안]. 한 번에 메모리로 넘기지 않고 묶음으로 흘려 넘기는 모양(스트림·콜백·쓰기 세션)이어야 합니다.
   - 지금 `catalog/internal/importer/CatalogWriter.java`의 COPY 코드를 이 구현으로 옮깁니다.
   - 제목 다듬기 규칙 공개(C2)
3. **가져오기 코드 옮기기** (`catalog/internal/importer/` → `collection/internal/` 아래, 패키지 이름은 dev)
   - 옮길 것: `CatalogImporter`, `CatalogImportRunner`, `CollectedCatalog`, `CollectedRow`, `BookGrouping`, `NationalBibliography`, `ImportReport`
   - 실행 프로필은 `catalog-import` → `collection-import` [안 이름]으로 바꿉니다.
   - 설정 `chaekcheck.catalog.import.*` → `chaekcheck.collection.import.*` [안 이름]. `sqlite-path`, `ttl-path`, `dry-run`은 그대로입니다.
   - `backend/build.gradle`의 `catalogImport` 설정(sqlite-jdbc를 importer에만 두는 것)도 맞춰 고칩니다.
4. **짝 표로 도서관 찾기** (`collection/internal/` 짝 저장소, `JdbcClient`)
   - `CollectedCatalog.libraries`의 "같은 번호 + 같은 `base_url`" 비교를 바꿉니다: 짝 표 → `enabledLibraryRefs()`로 켜짐 확인 → `base_url` 같음 확인(C10).
   - 행의 `library_id`는 서비스 번호로 바꿔 씁니다.
5. **가져오기 기록**: `collection.catalog_import`에 씁니다. 등록 수, 후보 수, 건너뛴 이유별 수를 로그와 기록으로 남깁니다(AC-11).
- 이 단계에서는 **동작이 지금과 같아야 합니다**(나눠 읽기, 새 제외 규칙, `library_ids`는 4·5단계). 다만 짝 표 덕분에 후보 도서관 책도 들어옵니다.
- 테스트
  - `CatalogImporterTests`를 `collection` 쪽으로 옮깁니다.
  - 작은 SQLite 표본(등록 2곳 + 후보 2곳 + 같은 사이트 1곳 + 짝 없음 1곳 + 주소 다른 1곳)으로 확인합니다.
    - 후보 책이 서비스 번호로 들어옵니다.
    - `library_not_in_service`와 `library_base_url_mismatch`가 셈에 잡힙니다.
    - 기록이 `collection.catalog_import`에 남습니다.
  - `ModularityTests`(`collection` 허용 의존, `catalog`가 `collection`을 모름), `DocumentationTests`(모듈 문서에 `collection`)
- 확인 방법: `./gradlew build`
- 위험: 높음(코드 이동, 모듈 경계, 공개 API 모양)

### 4단계: 나눠 읽기와 새 정리 규칙 (ADR-0054) (의존: 3단계)

1. **나눠 읽기** (`collection/internal/` 가져오기 코드)
   - 할 일: 모든 소장 줄을 메모리에 올리지 않게 바꿉니다. 예: 첫 읽기에서 묶기 키만 메모리에 두고, 두 번째 읽기에서 소장을 바로 `replaceAll`로 흘립니다. 방법과 크기는 dev가 정합니다 [확정 방향].
   - 지금 힙 추정은 약 11~15GB입니다. 목표 힙은 정해져 있지 않으므로 dry run에서 재서 보고합니다 [확인 필요].
2. **새 제외 규칙** [확정] (Q2): 북큐브 `content_kind`의 `book/wma`·`book/vod`·`book/wmv`, 교보 `동영상`. 이유별로 셈에 잡히게 합니다(예: `kind_sound_video` [안]).
3. **날짜 규칙** [확정]
   - 8자리 `YYYYMMDD`(실제 날짜만)를 날짜로 읽습니다. 북큐브 255,783줄입니다. 규칙은 `PublishedDates`(한 벌)에 더하는 것을 권합니다 [안].
   - 설정 `chaekcheck.collection.import.placeholder-date-libraries` [안 이름]에 적힌 도서관의 1950년 이전 날짜는 NULL로 둡니다. 값은 `100555`(명지대, **수집 번호**)입니다.
4. **쓴 뒤**: `VACUUM (ANALYZE)`(3단계 `replaceAll` 안)
- 테스트
  - 표본에 `book/wma`·`book/vod`·`book/wmv`·`동영상` 줄이 있으면 빠지고 이유별로 셉니다.
  - `20240315`는 날짜가 되고, `20241399`는 NULL이 됩니다.
  - 100555의 `1900-01-01`은 NULL이고, 다른 도서관의 같은 날짜는 그대로입니다.
  - 나눠 읽은 결과와 한 번에 읽은 결과(작은 표본)가 같습니다: 책 수, 소장 집합, 대표값.
- 확인 방법: `./gradlew build`
- 위험: 높음(메모리, 두 번 읽기의 일관성)

### 5단계: `book.library_ids`와 `/books` 거르기 (ADR-0055) (의존: 4단계)

1. **채우기** (`collection` 묶기 뒤): 책마다 소장 도서관 서비스 번호의 정렬 배열을 만들어 `replaceAll`의 책 줄로 넘깁니다.
2. **검색** (파일: `backend/src/main/java/com/chaekcheck/catalog/internal/search/PgBigmBookSearch.java`)
   - `search`: `matched`에 `b.library_ids && CAST(:libraryIds AS bigint[])`를 더합니다. 등급·도서관 수는 `unnest(b.library_ids)`를 계획(`plan` CTE)과 맞춰 구합니다. 기준일은 `catalog_library_snapshot`과 맞춰 구합니다. **`holding`은 읽지 않습니다.**
   - `count`(지난 쪽)도 같은 방식으로 바꿉니다.
   - `find`(책 한 권)는 지금처럼 `holding`을 써도 됩니다(한 권).
   - `JoinTier` 정렬(`ordinal`)은 그대로입니다.
- 테스트
  - `BookSearchTests`: 계획에 없는 도서관만 가진 책이 결과에 없습니다(AC-5 서버 쪽).
  - 등급, 도서관 수, 기준일, 정렬이 바꾸기 전과 같습니다(기존 테스트 회귀).
  - `library_ids`가 비어 있는 책은 나오지 않습니다.
  - 작은 데이터로 `EXPLAIN`에서 GIN·bigm 인덱스가 쓰이는지 기록합니다. 실제 측정은 15단계에서 합니다.
- 확인 방법: `./gradlew build`
- 위험: 중간(쿼리 계획이 데이터 양에 따라 달라짐)

### 6단계: `library` 계획 규칙과 공개 값 (ADR-0053, 0059) (의존: 2단계. 3~5단계와 나란히 해도 됨)

1. **`Eligibility.UNSURVEYED`** (파일: `backend/src/main/java/com/chaekcheck/library/Eligibility.java`): Javadoc을 씁니다. `joinable()`은 false입니다.
2. **계획** (파일: `backend/src/main/java/com/chaekcheck/library/internal/LibraryService.java`)
   - `planSearch`: `join_survey ∈ {MEMBERS_ONLY, NOT_SURVEYED}`이고 `libraryIds`에 없으면 뺍니다(C12).
   - 있으면 `chosen` 규칙대로 넣고, `eligibility = UNSURVEYED`로 둡니다. `chosen`이면 `JoinTier.CHOSEN`이라 정렬은 지금과 같습니다.
   - `NOT_FOUND`는 규칙이 없으므로 지금처럼 `UNVERIFIED`입니다.
   - `eligibilityFor`(`GET /api/v1/libraries`): 미조사 도서관을 **빼지 않고** `UNSURVEYED`로 넣습니다(S10 이름 찾기가 씀).
   - `findEnabledTarget`: 미조사 도서관도 돌려줍니다(C13).
3. **공개 값** (`SearchTarget.java`, `LibraryEligibility.java`, `availability/internal/search/StreamEvents.java`, `library/internal/web/LibraryListController.java`)
   - 스트림 `targets.libraries[]`와 `GET /api/v1/libraries` 항목에 더할 것
     - `logoUrl` [안 이름]: `logo_file`이 있고 `logo_visible`일 때만 `/library-logos/{logo_file}`, 아니면 null
     - `homepageUrl`: 이미 있으면 그대로
     - `joinSurvey` [안 이름]: C14
   - `availability`용 `lendingModel`(C15)
   - `platformType`에 새 두 값이 나옵니다.
- 테스트 (`LibraryCatalogTests` 등)
  - `libraryIds` 없이 계획하면 미조사 도서관이 없습니다(`scope=all`, `scope=joinable` 둘 다, AC-4 서버 쪽).
  - `libraryIds`에 넣으면 맨 앞, `chosen=true`, `UNSURVEYED`입니다(AC-3 서버 쪽).
  - `NOT_FOUND` 후보는 `libraryIds` 없이도 계획에 `UNVERIFIED`로 있습니다.
  - `SURVEYED` 후보 공공도서관은 지역 규칙대로 판정됩니다.
  - 등록 도서관만 있는 경우 계획이 0단계와 같습니다(AC-6·AC-15 회귀).
  - `GET /api/v1/libraries`에 미조사 도서관이 `UNSURVEYED`로 있습니다.
  - `logo_visible=false`면 `logoUrl`이 null입니다(AC-22 서버 쪽).
- 확인 방법: `./gradlew build`
- 위험: 중간(계획은 세 검색이 함께 씀)

### 7단계: 북큐브·알라딘 adapter, 교보 소장형 (ADR-0056) (의존: 2·6단계)

1. **상세 요청 주소 훅** (파일: `backend/src/main/java/com/chaekcheck/availability/internal/adapter/PlatformAdapter.java`): 기본 메서드 `detailFetchUri(URI detailUri)`를 더합니다(기본은 그대로) [안 이름]. 같은 호스트라 throttle·캐시 키는 그대로입니다. 이 훅을 부르는 곳(`DetailPageFetcher` 등)도 고칩니다.
2. **`BookcubeFxAdapter`** (새 파일: `availability/internal/adapter/BookcubeFxAdapter.java`)
   - 상세: `/product/view/?num=` → `/xml/productView/?num=`로 바꾼 주소를 씁니다. `<Product>` 바로 아래 `volume`·`nowLendCount`·`nowReserveCount`를 읽습니다. XML 파서는 DTD와 외부 엔티티를 끕니다.
   - 대여형: `volume=0`이고 `nowRentalCount` 요소가 있으면 `SiteVerdict.SUBSCRIPTION` [안 이름]으로 둡니다. 판정은 "구독형 · 바로 대출"입니다(`AvailabilityResolvers.subscription()`과 같은 결과).
   - 직접 찾기: `{base}/xml/productSearch/?keyword=&keyoption2=` 첫 쪽만 씁니다. 필드별 `keyoption2` 값은 서명=1만 확인됐습니다. 저자·출판사 값은 [확인 필요]입니다.
   - 모양이 다르거나 책이 없거나 시간이 초과되면 확인 실패입니다. 카드 링크는 남깁니다.
3. **`AladinV1Adapter`** (새 파일: `availability/internal/adapter/AladinV1Adapter.java`)
   - 상세 HTML "보유현황"의 보유·대출·예약을 읽습니다.
   - 직접 찾기: `sub.htm?code=search&search_item=` 첫 쪽만 씁니다. `base_url`의 `?nav_code`를 떼어 씁니다. 출판사 검색은 그 도서관 실패입니다(C18).
4. **판정 연결** (파일: `availability/internal/resolve/AvailabilityResolvers.java`): 두 화면 종류는 숫자 판정(ADR-0019)입니다. 단, 북큐브 대여형은 구독 판정입니다. 2단계의 임시 처리를 없앱니다.
5. **교보 소장형** (`KyoboSubscriptionV1Adapter`, `SubscriptionResolver` 등)
   - `lendingModel = OWNED`면 요청 없는 "바로 대출" 대신 보유·대출·예약 숫자를 읽습니다.
   - **읽는 위치는 dev 사이트 시험으로 정합니다** [확인 필요]. 위치를 못 찾으면 멈추고 사용자에게 알립니다.
6. **API 호출 시험**(아래 [확인 필요] 표의 사이트 항목)을 먼저 하고, 결과를 테스트 고정 파일(fixture)로 남깁니다. 같은 호스트 1건·1초를 지킵니다.
- 테스트
  - 북큐브 XML fixture: 소장형 숫자(AC-7), 대여형 → 구독(AC-9), `<Product>` 없음 → 실패, 외부 엔티티가 든 XML → 실패하고 읽지 않음
  - 알라딘 상세 fixture 숫자(AC-8)
  - 직접 찾기 첫 쪽 결과(AC-24), 알라딘 출판사 → 실패
  - 교보 소장형 → 숫자(AC-23)
  - 기존 adapter 테스트 회귀
- 확인 방법: `./gradlew build`
- 위험: 높음(외부 사이트 모양, 시험 결과에 따라 바뀜)

### 8단계: `mylibrary` 묶음 옮기기 (ADR-0057) (의존: 2단계)

1. **`POST /api/v1/me/library-imports`** [안 경로] (파일: `mylibrary/internal/web/MyLibraryController.java`, `MyLibraryService.java`, `MyLibraryStore.java`)
   - 요청 `{"libraryIds":[…]}`는 1~20개이고 중복은 합칩니다.
   - 처리 순서 [확정] (사용자 승인, 2026-10-05, 설계 검토)
     1. 계정 줄을 잠급니다(`AccountPresence.lockIfExists`). 계정이 없으면 401입니다.
     2. 계정의 직접 추가가 비었는지 확인합니다. 아니면 409 `library_import_not_empty` [안 이름]입니다.
     3. 켜진 도서관만 요청 순서대로 넣습니다. 없는·꺼진 번호는 오류 없이 건너뜁니다.
     4. 200 `{"libraryIds":[…],"max":20}`(옮긴 뒤 전체)을 줍니다.
   - `added_at`은 요청 순서대로 1ms씩 차이를 둡니다 [안].
   - 오류: 400 `bad_request`(JSON 아님), 422 `invalid_request`(0개·21개 이상·숫자 아님, C16)
   - `@ConditionalOnAuthEnabled`, CSRF는 지금 규칙을 그대로 씁니다.
- 테스트
  - 빈 계정 → 200, 순서 유지
  - 이미 1곳 있음 → 409이고 줄이 그대로임
  - 없는·꺼진 번호는 건너뜀
  - 0개·21개·문자 → 422(또는 C16 결정대로)
  - CSRF 없음 → 403, 토큰 없음 → 401, 지운 계정 → 401이고 줄 0
  - 꺼짐 컨텍스트 → 404
  - 같은 계정에 동시에 두 번 → 하나만 200, 하나는 409
- 확인 방법: `./gradlew build`
- 위험: 중간(잠금, 동시성)

### 9단계: 웹 API 층과 타입 (의존: 6·7·8단계)

1. **타입** (파일: `web/src/api/types.ts`)
   - `PlatformType`에 두 값
   - `Eligibility`에 `'UNSURVEYED'`
   - `joinSurvey`, `logoUrl`, `homepageUrl`, `lendingModel`(필요하면)
2. **요청** (파일: `web/src/api/client.ts`, `web/src/api/myLibraries.ts`)
   - `importMyLibraries(ids)` → `POST /api/v1/me/library-imports`(`meRequest`, CSRF)
   - 공개 목록 `fetchLibraries`는 로그인 전에도 씁니다.
- 테스트(Vitest): 새 요청이 `meRequest`·CSRF를 거침, 409·422 처리, 새 등급이 와도 깨지지 않음(`sortBatch`, `holdingPlan`, `ResultRow`)
- 확인 방법: `npm test`, `npm run build`, `npm run lint`
- 위험: 낮음

### 10단계: S10 로그인 전 열기, 브라우저 직접 추가, S1 버튼 (의존: 9단계)

1. **라우트** (파일: `web/src/main.tsx`): `/my-libraries`를 `LoginOnly` 밖으로 뺍니다(로그인 전에도 열림). 로그인 기능이 꺼져 있어도 열리는지는 C19 기준으로 dev가 정하고 보고합니다.
2. **브라우저 저장** (새 파일 예: `web/src/features/mylibrary/chosenLibraryStorage.ts`): 키 `chaekcheck.chosenLibraries.v1` [안 이름], 최대 20, 저장이 막히면 "이 브라우저에 저장하지 못했어요" [확정]
3. **S10** (파일: `web/src/features/mylibrary/MyLibrariesPage.tsx`, `MyLibraryContext.tsx`)
   - 로그인 전: 맨 위 안내 줄은 없습니다 [확정].
   - ① 지역 선택은 브라우저 지역을 씁니다. "지역으로 자동"은 로그인 전 S1 "가입 가능한 곳"과 같은 판정입니다.
   - ②·③은 로그인 후와 같은 모양이고, 저장만 브라우저에 합니다.
   - ② 이름 찾기 [확정]
     - 등록·후보 모두에서 찾습니다.
     - 두 글자 이상 쳐야 찾기 시작합니다.
     - 순서: 친 글자로 시작하는 곳 먼저, 그다음 가나다순
     - 20곳씩 보이고, 더 있으면 "더 보기"
     - 결과가 없으면 "찾는 도서관이 없어요"
     - 이미 직접 추가한 곳은 "직접 추가함"으로 흐리게
     - 공백 무시 부분 일치는 지금 규칙을 씁니다.
   - 21번째는 막습니다(AC-18). 20곳 문구는 지금 것을 씁니다.
4. **검색에 넘기기** (`SearchPage.tsx`, `useSearch.ts`, `useHoldings.ts`, `BookPage.tsx` 등): 로그인 전에도 브라우저 직접 추가를 `libraryIds`로 보냅니다. 두 스위치 값 모두에서 보냅니다 [확정] (flow S1).
5. **S1 로그인 전 버튼** (`LibrarySummaryBar.tsx`, `SettingsPanel.tsx` 등)
   - PC·태블릿: [내 지역 ▾]/[내 지역 설정]을 **[내 도서관 관리 ▾]**로 바꿉니다. 작은 창에는 거주·직장·직접 추가 N곳 줄과 [관리] → S10이 있습니다.
   - 지역도 직접 추가도 없으면 버튼 이름은 "내 도서관 설정"이고, 누르면 S10이 바로 열립니다 [확정].
   - 폰: 설정 창 "찾을 도서관"의 버튼을 [내 도서관 관리]로 바꿉니다 [확정].
- 테스트(Vitest)
  - 로그인 전 추가·빼기가 브라우저에만 저장되고 서버 요청이 없음(AC-18)
  - 21번째 막힘, 저장 막힘 문구
  - 요청에 `libraryIds`가 들어감
  - 이름 찾기: 두 글자, 순서, 20곳 + 더 보기, 없음 문구, 같은 이름 구분(AC-2)
  - 로그인하면 브라우저 값을 쓰지 않고, 로그아웃하면 다시 씀
  - 버튼 이름 두 경우
- 확인 방법: `npm test`, `npm run build`, `npm run lint`
- 위험: 중간(로그인 상태와 저장 위치 전환)

### 11단계: S11 지역 + 직접 추가 함께 옮기기 (의존: 8·10단계)

1. **열리는 조건** (파일: `web/src/features/mylibrary/RegionImportDialog.tsx`, `regionImport.ts`)
   - 로그인 직후 한 번 엽니다. 조건은 둘 중 하나입니다.
     - (계정 지역이 비었고 브라우저 지역이 있음)
     - (계정 직접 추가가 비었고 브라우저 직접 추가가 있음)
   - 이미 있는 쪽은 옮기지 않고 창에도 보이지 않습니다 [확정].
2. **문구** [확정]
   - 제목: "이 브라우저에 저장된 것을 계정에 저장할까요?"
   - 지역 줄(있을 때), "직접 넣은 도서관 N곳: 이름, 이름, …"(있을 때)
   - 버튼: [계정에 저장] [저장하지 않기]
3. **동작**
   - 한 번 누르면 둘 다 옮깁니다: `PUT /me/regions`(지역이 비었을 때만) + `POST /me/library-imports`(도서관이 비었을 때만).
   - 브라우저 값은 지우지 않습니다.
   - 20곳을 넘는 것은 옮기지 않고 "20곳까지만 저장했어요"를 보입니다 [확정]. 브라우저 상한이 20이라 보통 일어나지 않지만, 응답의 `libraryIds` 수가 보낸 수보다 적을 때의 안내 규칙은 dev가 정하고 보고합니다.
   - 409(그 사이에 계정에 생김)는 다시 불러와 계정 값을 씁니다 [안].
   - 답한 기록 키(지금 `chaekcheck.regionImport.v1`)를 두 묶음에 함께 쓸지는 dev가 정하고 보고합니다.
- 테스트(Vitest): 조건 네 조합, 한쪽만 있을 때 창 내용, 두 요청 본문, 실패 상태, 닫기는 미기록(AC-19)
- 확인 방법: `npm test`, `npm run build`, `npm run lint`
- 위험: 중간

### 12단계: 결과 카드, 가입 정보 창, 로고 (의존: 9단계)

1. **결과 카드** (파일: `web/src/features/search/ResultRow.tsx`, `rowVerdict.ts`, `holdingView.ts`)
   - 북큐브·알라딘: 보유·대출 중·예약 칸입니다(교보 일반·YES24와 같음).
   - 북큐브 대여형: "구독형 · 바로 대출 ⓘ"
   - 교보 `OWNED`: 숫자 칸
   - 읽기 실패: "확인 실패" 칸, 카드 링크는 그대로
2. **가입 정보 창**: 후보 도서관이면 맨 위에 `joinSurvey`별 안내를 두고, 그 아래 [도서관 첫 화면] 링크를 둡니다 [확정] (R6)
   - `SURVEYED`: 등록 도서관과 같은 가입 정보
   - `NOT_FOUND`: "가입 조건을 찾지 못했어요. 도서관 사이트에서 확인해 주세요"
   - `MEMBERS_ONLY`: "학교·회사 같은 기관의 구성원용으로 보여요. 이용할 수 있는지는 그 기관에 확인해 주세요"
   - `NOT_SURVEYED`: "가입 정보를 아직 조사하지 않았어요"
   - 이름 옆 표시는 지금처럼 "직접 추가"입니다.
3. **로고 컴포넌트** (새 파일 예: `web/src/components/LibraryLogo.tsx`)
   - 크기: 결과 카드 약 20px, S10 약 24px
   - `logoUrl`이 없거나 못 불러오면(`onError`) 빈 상자를 보입니다 [확정].
   - 누르면 `homepageUrl`을 새 창으로 엽니다. 결과 카드에서는 카드 링크로 가지 않게 이름처럼 카드 위에 띄웁니다 [확정].
   - `alt`는 도서관 이름입니다.
   - 자리: S1·S3 결과 카드 이름 앞, S10 자동 목록·찾기 결과·직접 추가 줄 이름 앞
4. **로고 파일 만들기** (새 스크립트 예: `scripts/library/build_logos.*` [안 이름])
   - `registered-logos-2026-10-05.tsv`의 `OWN` 199곳 원본을 높이 약 48px로 줄여 `web/public/library-logos/{서비스 번호}.{확장자}` [안 경로]에 둡니다.
   - 형식은 그대로입니다(png·jpg·gif). svg는 그대로 복사합니다. 자르기·색·모양 바꾸기는 하지 않습니다 [확정].
   - 새 의존성 규칙: JDK `ImageIO` 등 기존 도구로 합니다. 안 되면 사용자에게 묻습니다.
   - 만든 파일 합계 크기를 보고합니다. 원본은 git 밖에 그대로 둡니다.
- 테스트(Vitest): 등급·종류별 칸(AC-7·8·9·23 화면 쪽), 안내 넷(AC-14), 로고 있음 / 없음 / 불러오기 실패 → 빈 상자(AC-20), 로고 누름이 카드 링크를 타지 않음, 이름을 글자로만 그림
- 확인 방법: `npm test`, `npm run build`, `npm run lint`
- 위험: 중간

### 13단계: S12 `/about`, 바닥글, nginx (의존: 12단계)

1. **S12** (새 화면 예: `web/src/features/about/AboutPage.tsx`, 라우트 `/about`)
   - S8·S9와 같은 흰 카드(폭 44rem)입니다.
   - 내용
     - 책첵 소개 한두 줄
     - "각 도서관의 로고와 이름은 그 기관의 것이며 책첵은 제휴·후원 관계가 없습니다" [확정]
     - 로고 내림 요청 이메일: 사용자가 알려 줄 때까지 **자리 글**과 `TODO(확인 필요)`
2. **바닥글** (파일: `web/src/components/Footer.tsx`): 모든 화면에 "서비스 안내" 링크를 둡니다(AC-21).
3. **nginx** (파일: `deploy/nginx/chaekcheck.conf`, `deploy/nginx/chaekcheck-locations.conf`, `deploy/nginx/README.md`)
   - `gzip on; gzip_types application/json;` [확정] (ADR-0058). 스트림(`text/event-stream`)은 압축하지 않습니다.
   - `location /library-logos/`: 긴 캐시(`public, max-age=…`). 값은 dev가 정하고 보고합니다. 파일 이름에 해시가 없으므로 `immutable`을 쓸지도 함께 적습니다. 보안 헤더 include는 지금 방식을 따릅니다.
   - 화면 경로 정규식에 `about`을 더합니다. **지금 정규식(`search|signup|terms|privacy|auth/complete|books/…`)에는 `my-libraries`도 없습니다**(dev 코드, 2026-10-05 읽음). 그래서 `/my-libraries`를 직접 열면 404가 될 것으로 보입니다. 확인하고 함께 고칩니다.
- 테스트: 바닥글 링크(Vitest), nginx는 `local-test.conf`로 다음을 확인합니다.
  - `/about`·`/my-libraries` 직접 열기
  - `/api/v1/libraries` 응답의 `Content-Encoding: gzip`과 크기
  - 로고 응답의 캐시 헤더
- 확인 방법: `npm test`, `npm run build`, `npm run lint`, `deploy/nginx/README.md`의 로컬 확인 절차
- 위험: 낮음

### 14단계: dry run (의존: 4·5단계. 웹 단계와 나란히 해도 됨)

- 할 일: 사본으로 `dry-run=true`를 실행합니다. 아래 값을 재서 `# 사이클 07` 절과 dev `docs/maintenance/3-import.md` 결과 표에 적습니다.
  - 읽은 줄, 남은 줄, 건너뛴 이유별 수. `library_not_in_service`에 같은 사이트 99곳이 들어가는지 봅니다.
  - 도서관 수: 등록 274 + 후보 1단계 셈. 받지 않은 등록 4곳은 소장이 없습니다.
  - 책 수, 묶음 단계별 수
  - **최대 힙**(JVM 옵션과 실제 사용), **단계별 시간**
- DB 크기는 dry run으로 알 수 없습니다. 15단계에서 표·인덱스 크기를 잽니다.
- 결과가 추정(DB 약 9~10GB, 가져오기 10분 이상)과 크게 다르거나, 힙이 개발 PC나 운영 서버 계획을 넘으면 멈추고 사용자에게 알립니다. 서버 크기 기준은 `../chaekcheck-plan/docs/research/deploy/aws-layout.md` "서버 크기"입니다.
- 위험: 중간

### 15단계: 사본으로 실제 가져오기와 측정 (의존: 2~7·14단계)

1. **가져오기**: 로컬 `db`에 실제로 가져옵니다.
   - 쓰기 시간과 검색이 기다린 시간을 잽니다.
   - `pg_total_relation_size`로 `catalog.book`·`book_contributor`·`holding`과 각 인덱스, `book_library_ids_gin` 크기를 잽니다.
2. **AC-11**: `collection.catalog_import`의 도서관 수가 등록 274 + 후보 셈과 같은지 봅니다. 짝 표의 수집 번호 ↔ 서비스 번호가 하나씩 이어지는지(`collection_link`와 소장 `library_id` 집합) 봅니다.
3. **AC-12**: 같은 사본으로 한 번 더 가져온 뒤 다음을 비교합니다.
   - 후보 도서관 서비스 번호와 이름
   - 짝 표
   - 도서관별 소장 수
4. **AC-13**: 측정 검색어 묶음의 첫 쪽 응답 시간(서버 측정)과 `EXPLAIN (ANALYZE, BUFFERS)`를 남깁니다. 목표는 **1초 안**입니다 [확정].
   - 조건: 로그인 전·지역 없음, 지역 1개, `scope=joinable`, 후보 도서관 몇 곳을 `libraryIds`로 넣은 경우
   - 넘으면 인덱스·쿼리 조정안을 만들어 사용자에게 알립니다.
5. **AC-6, AC-15**: 0단계 기준 응답과 비교합니다. 등록 도서관만 쓰는 이용자의 같은 검색어에서 등록 도서관 소장 (도서관, 책 코드) 집합과 책 순서가 같아야 합니다. 대표 제목·묶음 차이는 목록으로 보고합니다.
6. **`GET /api/v1/libraries` 크기**: 압축 전과 gzip 뒤를 잽니다(추정 약 460KB / 약 40KB).
- 위험: 중간

### 16단계: 전체 확인 (의존: 1~15단계)

- Playwright로 데스크톱 1280 → 태블릿 768 → 모바일 375를 봅니다.
  - S1: 로그인 전 버튼, 작은 창, 폰 설정 창
  - S10: 로그인 전·후, 이름 찾기, 더 보기, 20곳, 로고·빈 상자
  - S11: 두 묶음
  - 결과 카드: 북큐브·알라딘·대여형·교보 소장형, 가입 정보 창 넷, 로고
  - S12와 바닥글
- 수동 확인
  - AC-4: 직접 추가하지 않은 상태에서 스트림 `targets`에 미조사 도서관이 없는지 봅니다. 서버 로그나 fetch 기록에서 그 호스트로 요청이 없는지도 봅니다.
  - AC-7·8: 사용자와 함께 사이트 화면 숫자를 비교합니다.
  - AC-22: SQL `UPDATE library.library SET logo_visible = false WHERE id = …` 뒤 새로고침합니다. 확인이 끝나면 되돌립니다.
  - AC-18·19: 일반 창과 시크릿 창에서 확인합니다.
- 켜짐과 꺼짐(로그인 기능)을 모두 봅니다.
- 아래 AC 표의 결과를 `# 사이클 07` 절에 적습니다.

### 17단계: 배포 전 Liquibase 합치기 (의존: 16단계)

- 할 일: C8 규칙대로 새 파일(`library/007`·`008`·`009`, `collection/001`·`002`, `catalog/002`·`003`)과 기존 파일(`library/001`~`006`, `catalog/001`)을 비교·대조합니다. 합칠지, 어떻게 합칠지 정합니다.
  - 둘 다 있는 도서관: 다른 점 목록
  - 옛 파일에만 있는 도서관: 첫 화면을 한 번 연 결과(열림 / 안 열림 / 바뀜)
  - `enabled = false` **제안 목록** → 사용자 승인. 승인 전에는 끄지 않습니다.
- 합친 뒤 로컬 `db`·`db-test`를 초기화하고 다시 적용합니다. 15단계 가져오기도 다시 합니다(짝·번호가 같은지 AC-12와 같은 방법으로 봅니다).
- `PRE_DEPLOYMENT` 표시는 지우지 않습니다. 지우는 것은 첫 배포 때입니다.
- 위험: 중간(번호·이름이 바뀌면 안 됨)

### 18단계: 수집 두 갈래 정리 (dev 문서·스크립트) (의존: 1단계. 다른 단계와 나란히 해도 됨)

1. **`docs/maintenance/` 재구성**: plan `../chaekcheck-plan/docs/research/collection/1-libraries.md`(① 도서관 수집), `2-books.md`(② 책 수집)와 같은 경계로 나눕니다.
   - `1-libraries.md`
     - 순서: 후보 찾기 → 확인 → 같은 사이트 거르기 → **넣기(1단계 seed 스크립트, 서비스 DB)** → 구독 규칙·마감 확인
     - 등록 도서관 확인 자리표(`library-maintenance.md`로)
     - 로고 받기 자리: 지금 스크립트는 git 밖이므로 위치만 적습니다.
   - `2-crawl.md`: ② 책 수집. 파일 이름은 그대로 두거나 `2-books.md`로 바꿀 수 있습니다 [안].
   - `3-import.md`: 새 실행 명령(`collection-import` [안]), 설정 이름, 사본을 원본으로 쓰는 법, 결과 표(14·15단계 값)
   - `README.md`: "한눈에" 표를 ① / ② / 가져오기로 다시 씁니다. 각 문서 머리에 plan 짝 문서 링크를 둡니다.
   - 원칙과 결정 문장은 plan 문서에 있으므로 dev 문서에는 절차만 둡니다(ADR-0047).
2. **같은 사이트 거르기 규칙** [확정] (사용자, 2026-10-05): 호스트 비교는 http/https와 포트를 무시하고, 같은 호스트면 `item_key` 겹침을 봅니다.
   - seed 스크립트(1단계)에는 반드시 넣습니다.
   - dev 복사본 `scripts/crawl/crawl_catalog.py import-probe`에도 넣을지는 dev가 정합니다 [안]. **돌고 있는 옛 복사본(`chaekcheck-data\scripts\`)은 건드리지 않습니다.**
   - 겹침 기준 값은 1단계 [확인 필요]를 따릅니다.
3. **`--per-host`와 `--host-slots`를 함께 줄 때 우선순위**: `scripts/crawl/crawl_catalog.py`를 읽어 실제 동작을 `2-crawl.md` 2-1절에 적습니다. 코드는 바꾸지 않습니다. 결과는 `# 사이클 07` 절에도 적습니다(plan `2-books.md` 확인 필요 항목).
4. 마감 확인이 읽는 주소는 셋입니다(`firstBoardBlbrSrmb.json`으로 게시판 번호를 얻는 단계 포함). `1-libraries.md`가 이미 셋이면 그대로 둡니다.
- 확인 방법: 문서 링크가 깨지지 않았는지 봅니다(plan 쪽 경로는 `../chaekcheck-plan/...`).
- 위험: 낮음

## 테스트

- 단위
  - seed 스크립트(이름 겹침, 번호 유지, 제외)
  - 날짜 규칙
  - 새 제외 규칙
  - 북큐브 XML·알라딘 HTML 파서(fixture, 외부 엔티티 거부)
  - `JoinTier.of`(`UNSURVEYED`)
  - S10 이름 찾기 순서
  - 로고 빈 상자
  - S11 조건
- 통합(모듈, `db-test`)
  - `ModularityTests`: `ApplicationModules.of(ChaekcheckApplication.class).verify()`. 새 모듈 `collection`(`allowedDependencies = catalog, library` [+ named interface]), 순환 없음, `catalog`가 `collection`을 모름
  - `DocumentationTests`(모듈 문서에 `collection`)
  - Liquibase 적용과 CHECK 위반
  - 가져오기(표본 SQLite: 짝, 건너뛰기 이유, 나눠 읽기 = 한 번에 읽기, `library_ids`, 기록 표)
  - `BookSearchTests`(`library_ids &&`, 회귀)
  - `LibraryCatalogTests`(미조사 규칙, `UNSURVEYED`, 로고 값)
  - adapter 테스트, `library-imports` API(켜짐·꺼짐, 동시성)
  - 사이클 05·06 기존 테스트 전부(회귀)
- 웹(Vitest): 9~13단계 테스트
- 실데이터: 0·14·15단계(기준 응답, dry run, 실제 가져오기, 측정)
- 화면: Playwright 1280 → 768 → 375. 앱 안 브라우저로 했으면 보고합니다.

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 후보 도서관 이름으로 찾아 추가 | 웹 테스트 + Playwright | 10, 16 |
| AC-2 같은 이름은 화면 종류로 구분 | seed 테스트(이름 규칙) + 웹 테스트 | 1, 10 |
| AC-3 직접 추가한 후보 도서관 줄이 결과 맨 앞, "직접 추가" | 통합(계획) + 수동 | 6, 16 |
| AC-4 넣지 않은 후보 도서관은 계획·결과·요청에 없음 | 통합(계획, `scope=all`) + 수동(`targets`, 요청 기록) | 6, 16 |
| AC-5 후보 도서관에만 있는 책은 안 나옴 | 통합(`BookSearchTests`) + 15단계 비교 | 5, 15 |
| AC-6 등록 도서관만 쓰는 이용자 결과가 같음 | 0단계 기준 응답과 비교(소장 집합·책 순서) | 0, 15 |
| AC-7 북큐브 숫자 = 사이트 | adapter fixture + 수동(사용자와 비교) | 7, 16 |
| AC-8 알라딘 숫자 = 사이트 | adapter fixture + 수동 | 7, 16 |
| AC-9 북큐브 대여형 "구독형 · 바로 대출" | adapter fixture + 웹 테스트 | 7, 12 |
| AC-10 같은 사이트는 표에 없고 두 번 안 나옴 | seed 셈 + DB 조회 + 수동 | 1, 15, 16 |
| AC-11 가져오기 도서관 수, 짝 하나씩 | 통합(표본) + 15단계 DB 조회 | 3, 15 |
| AC-12 다시 가져와도 번호 그대로 | 같은 사본 두 번 가져와 비교(17단계 뒤 한 번 더) | 15, 17 |
| AC-13 첫 쪽 1초 안 | 15단계 측정 + `EXPLAIN (ANALYZE, BUFFERS)` | 15 |
| AC-14 가입 정보 창의 `join_survey` 안내와 첫 화면 링크 | 웹 테스트 + Playwright | 12, 16 |
| AC-15 로그인 전·직접 추가 없음이면 그대로 | 0단계 기준 응답 비교 + 기존 테스트 | 0, 15 |
| AC-16 수집 두 갈래 문서 | plan 문서(이미 있음) + dev 18단계 링크 확인 | 18 |
| AC-17 빌드·테스트 | `./gradlew build`, `npm test`·`build`·`lint` | 모든 단계 |
| AC-18 로그인 전 직접 추가, 서버 저장 없음, 21번째 막힘 | 웹 테스트 + 수동(네트워크) | 10, 16 |
| AC-19 로그인 때 한 번 묻고 계정에 저장 | 통합(`library-imports`) + 웹 테스트 + 수동 | 8, 11, 16 |
| AC-20 로고와 빈 상자 | 웹 테스트 + Playwright | 12, 16 |
| AC-21 바닥글 → 서비스 안내 | 웹 테스트 + Playwright | 13, 16 |
| AC-22 로고 끄면 새로고침 뒤 사라짐 | 통합(`logoUrl` null) + 수동(SQL) | 6, 16 |
| AC-23 교보 `OWNED`는 숫자 | adapter 테스트 + 수동 | 7, 16 |
| AC-24 북큐브·알라딘 직접 찾기 첫 쪽, 알라딘 출판사 실패 | adapter fixture + 수동 | 7, 16 |

## 완료 기준

- [ ] spec AC-1~AC-24를 위 표의 방법으로 모두 확인함(수동 항목 포함)
- [ ] `backend/`에서 `./gradlew build` 통과. 포함 항목: `ModularityTests`(`collection` 허용 의존, 순환 없음), `DocumentationTests`, 켜짐·꺼짐 테스트, 동시성 테스트
- [ ] `web/`에서 `npm test`, `npm run build`, `npm run lint` 통과, 1280/768/375 확인
- [ ] 사본으로 실제 가져오기 완료. dry run·실제 가져오기의 힙·시간·DB 크기, `/books` 측정, `GET /libraries` 크기를 `# 사이클 07` 절과 `3-import.md`에 적음
- [ ] seed 셈(최종 후보 수, 뺀 곳, `join_survey` 값별 수)과 C1 기록을 `docs/library-maintenance.md`에 남김
- [ ] dev `docs/maintenance/` 두 갈래 정리, 같은 사이트 거르기 규칙, `--per-host`/`--host-slots` 우선순위 문서화
- [ ] 17단계 대조 결과와 `enabled = false` 제안 목록을 사용자에게 보이고 답을 반영함
- [ ] 기존 changeset을 고쳤다면 로컬 `db`·`db-test`를 초기화해 다시 적용함
- [ ] "[확인 필요]" 결과, 사용자 답, 설계와 달라진 점을 dev `docs/plan-feedback.md` `# 사이클 07` 절에 정리하고 사용자에게 전달함

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 결과에 따라 할 일 | 막는 단계 |
|---|---|---|---|
| 로고 내림 요청 이메일 주소 | 사용자가 만들어 알려 줌 | 그 전에는 자리 글 | 배포 |
| 체험용·운영 중단 4곳, 시험용 6곳을 뺀 최종 후보 수 | seed 생성 때 셈 | 보고 | 1 |
| 같은 사이트 겹침 기준 값(`item_key` 몇 % 이상을 같다고 볼지), 99곳 밖에서 걸리는 곳 | 1단계 계산 결과를 보고 사용자에게 질문 | 99곳 밖에서 걸리면 멈추고 알림 | 1 |
| 새 도서관을 넣을 때 seed 번호가 겹치지 않는 규칙("마지막 번호 다음"), 이름 유지 | dev 확인(스크립트 두 번 실행) | 보고 | 1 |
| 소속 전용 후보 공공도서관 2곳을 규칙 칸으로 나타낼 수 있는지 | dev 확인 → 안 되면 사용자에게 질문 | 사용자 답대로 | 1 |
| `public-join` TSV 칸이 기존 스크립트 입력과 맞는지 | dev 확인 | 변환 방법 보고 | 1 |
| 등록 도서관 `lending_model`(교보 구독형 화면 소장형 5곳) 값과 넣는 자리 | probe TSV 대조 | 보고 | 2 |
| `catalog_library_snapshot.import_id` FK 처리(C4) | 설계에 없음. dev가 정함 | 보고 | 2 |
| 제목 다듬기 규칙 공개 방법(C2)과 `ModularityTests` 통과 | dev 프로토타입 | 안 되면 멈추고 알림 | 3 |
| 나눠 읽기 방법·크기, 최대 힙, 가져오기 시간, DB 크기(약 9~10GB 추정) | 14·15단계 측정 | 추정과 크게 다르면 사용자에게 알림 | 14, 15 |
| `/books` 묶음 응답 시간(1초 목표) | `EXPLAIN (ANALYZE, BUFFERS)` | 넘으면 조정안을 사용자에게 | 15 |
| `GET /libraries` 크기(약 460KB, gzip 약 40KB 추정) | dev 측정 | 보고(ADR-0058 확인용) | 15 |
| R6 문구에 쓸 `joinSurvey` API 칸(C14), `lendingModel` 자리(C15) | 설계에 없음. dev가 정함 | 보고 | 6 |
| 교보 구독형 화면 소장형의 숫자를 읽는 위치 | API 호출 시험(dev 사이트 시험) | 못 찾으면 멈추고 사용자에게 | 7 |
| 북큐브 한 사이트 안에 소장형·대여형이 섞이는지, 검색 쪽 나누기, `keyoption2`의 저자·출판사 값, 없는 `num`일 때 응답 | API 호출 시험 | fixture로 남기고 보고 | 7 |
| http·포트 번호 북큐브 사이트(예: `http://elib.gyeongnam.go.kr:8000/FxLibrary`)의 응답 | API 호출 시험 | 보고 | 7 |
| 알라딘 검색 쪽 나누기(`list_scale`·`startPage`), 출판사 검색 | API 호출 시험 | 지금은 첫 쪽만, 출판사는 실패 | 7 |
| `library-imports` 오류 코드: 설계 422 `invalid_request` vs 지금 관례 400 `validation_error`(C16) | dev가 맞추고 싶으면 사용자에게 질문 | 사용자 답대로 | 8 |
| S11 응답 수가 보낸 수보다 적을 때의 안내, 답한 기록 키 | dev가 정함 | 보고 | 11 |
| 로고 줄이기를 기존 도구로 할 수 있는지(svg 그대로) | dev 프로토타입 | 새 의존성이 필요하면 사용자에게 | 12 |
| `/library-logos/` 캐시 값, `/my-libraries`가 nginx 화면 경로에 없는 문제 | dev 확인(로컬 nginx) | 고치고 보고 | 13 |
| 같은 서버 북큐브 주소(`/FxLibrary`) 7곳이 교보 목록을 그대로 보여 주는지 | 사이트 확인(`collection-areas.md` 2-2절) | 보고만(이미 `crawl_skip`) | 없음 |
| `--per-host`와 `--host-slots`를 함께 줄 때 우선순위 | dev 코드 확인 | `2-crawl.md`에 적음 | 18 |
| robots.txt·이용 조건 | `crawl-method.md` 1절과 같음 | 이번에는 없음 | 나중 |
| 화면 문구 세부, 로고 빈 상자 모양 | 화면을 사용자에게 보임 | 사용자 답대로("실제 화면 보고 나서 언제든 수정 가능") | 16 |

## 이번에 하지 않는 것

- 학교·대학·회사·기관(`MEMBERS_ONLY`·`NOT_SURVEYED`)의 가입 자격 조사·판정·필터, 지역·직장으로 자동 넣기, 소속 기관 자격
- 같은 기관의 여러 사이트를 한 줄로 묶어 보이기
- 북큐브 `isReservable`·`isMaxLendLimit` 쓰기, `alt_code`로 다른 플랫폼과 책 묶기, 책 묶기 기준 변경(다음 수집 때)
- 책 번호 유지, 갱신 기능, 운영 중 다시 가져오기(검색 잠김 줄이기)
- 서버 `collection` 모듈이 실행 중에 도서관을 등록하는 것: 이번에는 수집 쪽 seed 스크립트가 만든 파일로 넣음. `collection`이 할지 별개 모듈이 할지는 다음에 정함(backlog)
- 수집기 갈아타기(옛 복사본 → dev 복사본)와 수집기 코드 구조 정리. 돌고 있는 수집기를 멈추지 않습니다.
- 매일 신간 수집 명령
- 구독형 한도·마감 표시(이번에는 마감 확인을 ① 갈래 문서에 두는 정리까지만)
- 후보 도서관 로고, 업체 기본 로고, 로고 파일의 S3·CloudFront 이동
- 북큐브·알라딘 직접 찾기의 쪽 넘기기(시험 전), 알라딘 출판사 검색
- 사이클 06에서 넘어온 화면 다듬기(S8·S9 돌아가는 길, 탭 제목, 글꼴 서브셋): dev에서 따로 함(사용자가 알려 줌), 검색 화면 다듬기(폰 설정 창 모양 등)
- `PRE_DEPLOYMENT` 표시 지우기, 배포

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 `# 사이클 07` 절에 **무엇이 달라졌는지와 이유**를 적습니다. 사용자 발언이면 그대로 옮깁니다.

- 사용자 답: 소속 전용 2곳, 교보 소장형(못 읽을 때), `library-imports` 오류 코드, 화면 문구·로고 모양, `enabled = false` 목록, 로고 이메일
- [확인 필요] 표 각 행의 결과. 특히 다음은 꼭 적습니다.
  - seed 셈(최종 후보 수, 뺀 곳별 수, `join_survey` 값별 수, 이름에 라벨·호스트가 붙은 수), 같은 사이트 겹침 계산 결과
  - dry run과 실제 가져오기의 힙·시간·건너뛴 이유별 수, 표·인덱스 크기
  - `/books` 측정표(검색어별 첫 쪽 ms, 0단계 대비, `EXPLAIN` 요약), `GET /libraries` 크기
  - AC-6 비교 결과(대표 제목·묶음 차이 목록)
  - 북큐브·알라딘·교보 소장형 사이트 시험 결과
  - `--per-host`/`--host-slots` 우선순위
- 정한 이름과 방법
  - `collection` 패키지 배치, 실행 프로필·설정 이름, 제목 다듬기 규칙 공개 방법
  - `CatalogLoad.replaceAll`의 넘기는 모양, 나눠 읽기 방법과 묶음 크기
  - `catalog_library_snapshot` FK 처리, `catalog.catalog_import` 옛 줄 처리
  - `joinSurvey`·`lendingModel`·`logoUrl` API 칸 이름과 위치
  - `SiteVerdict.SUBSCRIPTION`, `detailFetchUri` 이름
  - changelog·CSV·스크립트·웹 파일 이름, 브라우저 키 이름, 로고 캐시 값
- 설계와 달라진 점, 새로 알게 된 제약. 예:
  - 나눠 읽기에서 대표값·묶음이 한 번에 읽기와 달라진 곳
  - `library_ids`로 바꾼 뒤의 쿼리 계획 변화, GIN 크기
  - 북큐브·알라딘 사이트 모양 차이와 실패율
  - nginx `/my-libraries` 경로 문제 확인 결과
  - 17단계 대조에서 나온 다른 점
- AC 확인표(16단계)
