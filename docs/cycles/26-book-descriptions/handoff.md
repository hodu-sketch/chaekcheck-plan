# 개발 인계서: 사이클 26 책 설명 한 곳에 모으기

- 기준 문서: plan `docs/cycles/26-book-descriptions/design-delta.md`(설계 결정 2026-10-28)를 따라 구현합니다. 코드 사실(함정 0-1~0-3, F1~F6)은 `architect-proposal.md`. 기준 코드는 dev main `905eab7`과 v1.19.0 브랜치 `claude/aisearch-faster-first`
- ADR: 0160(AI 찾기 표의 `library_ids`는 예외), 0161(책 설명은 `catalog`), 0162(설명 정리와 가져오기 번호 검사), 0163(표지는 S3 + CloudFront, PC만 올림), 0164(데이터 주인 원칙과 추천목록 줄 표지 차례), 0165(AI 검색 사본 표 없앰, 프로필 DB), 0166(한 번 복사, 옛 표는 다음 배포에서 지움). 모두 Accepted, 2026-10-28
- 이 인계서의 자리: plan `docs/cycles/26-book-descriptions/handoff.md`(dev에서는 `../chaekcheck-plan/docs/cycles/26-book-descriptions/handoff.md`). `docs/current/handoff.md`에는 한 줄 안내만
- dev 23·24 세션용: `to-dev23-24.md`(이 인계서 "dev 23·24가 맞출 것"과 같은 내용)

## 요약

책 요약·판 표지·꼬리표와 사전·책 프로필·AI 찾기용 한 줄과 찾기 색인을 `catalog` 스키마의 새 표 여섯(`book_summary`, `book_cover`, `book_profile`, `book_search`, `tag_dictionary`, `book_tag`)에 모읍니다. 다른 모듈은 `catalog` 공개 API(`BookTexts`, `CoverUrls`, `BookProfiles`, `AiSearchIndex`)로만 읽고, 쓰기는 `collection`이 `BookTextsTransfer`로 합니다. 추천목록 요약 파일은 없앱니다. 모든 표지 그림은 S3(시드니) + CloudFront 기본 주소로 옮기고, 책 상세 화면에 표지와 「AI 요약 ⓘ」을 붙입니다. 옮기기는 배포 두 번: 배포 1에서 새 표를 만들고 한 번 복사한 뒤 읽는 곳을 바꾸고, 배포 2에서 옛 표를 지웁니다.

## 일정과 다른 사이클과의 순서

- **사이클 26이 먼저** [확정] (사용자 "지금 이거 먼저 하고 DEV23,24에게 알려줘서 알아서 고치라고 해", 2026-10-27). dev 23(`foryou`)·dev 24(`aisearch`)가 바뀐 표·API에 맞춰 고침(아래 "dev 23·24가 맞출 것")
- **배포 순서** [안: 표지가 깨지지 않게 정한 차례] (design-delta "배포 순서"). 차례를 바꾸지 않습니다
  1. S3·CloudFront(OAC)·PC IAM 키를 만들고, 지금 운영 표지 약 8만 장과 `picks.cover` 그림을 S3에 올림
  2. 배포 1
  3. 확인(AC-1·2·4·9·10), AI 검색 전후 비교(AC-7·12)
  4. 나머지 표지 약 134만 장을 올리고 `book-texts` `cover_file`로 연결
  5. `book-profiles`로 프로필을 처음 넣고 서버를 다시 켬
  6. 배포 2(옛 표 지움)
- **배포 1에서 `foryou`·`aisearch`의 읽는 곳도 dev 26이 바꿈** [확정] (사용자 "26 dev가 같이하고 dev/plan 23/24에게 알려줘", 2026-10-28): main에 이미 있는 `foryou`·`aisearch` 코드의 요약·표지·찾기·프로필 읽기를 배포 1에서 `catalog` API로 바꿉니다(아래 "dev 23·24가 맞출 것"의 항목을 dev 26이 main에서 함). 진행 중인 23·24 브랜치는 그 뒤 rebase로 맞춥니다. 그래서 배포 1 뒤에도 새로 넣은 설명이 모든 화면에 보입니다
- **Liquibase 번호** [안: 23·24 브랜치와 겹치면 그쪽이 올림]
  - 배포 1: `catalog/002-book-descriptions.yaml`, `collection/007-description-deleted-count.yaml`
  - 배포 2: `foryou/002-drop-book-blurb-cover.yaml`, `picks/007-drop-moved-tables.yaml`, `aisearch/005-drop-search-book.yaml`
  - 새 changelog 파일로만 더함. 기존 changeset은 고치지 않음
- 버전: 배포 1은 API 칸이 늘고 화면이 바뀌는 호환 변경이라 MINOR 후보 [안: 배포 때 dev가 정함]

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.**
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) 조용히 바꾸지 않고, 먼저 사용자에게 알린 뒤 dev `docs/plan-feedback.md`의 새 **`# 사이클 26`** 절에 무엇을 왜 바꿨는지 적습니다(사용자 발언은 그대로)
- `[안]`·`[안: 이름]`은 dev가 코드에 맞춰 바꿀 수 있고, 바꾸면 `# 사이클 26` 절에 알리기만 합니다. 예: `BookTexts`·`CoverUrls`·`BookProfiles`·`AiSearchIndex`·`BookTextsTransfer`와 메서드 이름, `listCoverUrls` 모양, 설정 키 `chaekcheck.covers.base-url`, 칸 `description_deleted_count`, 버킷·IAM 사용자 이름, changeset id
  - 이름이 겹치는 곳: `picks/internal/fetch/CoverUrls.java`, `aisearch/internal/firstcall/BookProfiles.java`가 새 `catalog` 공개 타입과 이름이 같음. 헷갈리면 바꾸고 보고
- **바꾸지 않는 것** [확정]
  - 책 설명은 `catalog`가 맡고 다른 모듈은 공개 API로만 읽음(ADR-0161), 종류마다 표 하나(설계 #1)
  - 설명은 `book_id`로 저장, `catalog.book`으로의 FK 없음, 바꿔 끼우기 트랜잭션 안 DROP 앞에서 버려진 번호의 설명을 지움(ADR-0162)
  - `book-texts`·`book-profiles` 첫 줄 `# export_id=<uuid>`, 마지막 SUCCEEDED 가져오기와 다르면 파일 전체 거절(`neighbours`와 같은 강제 넣기 설정)
  - 요약은 한 종류(책첵 요약, 해요체, 1~300자), 어디서도 자르지 않음. 추천목록 요약 파일은 복사하지 않고 지움
  - 추천목록 줄 표지 차례는 ADR-0164
  - 표지는 S3 비공개 버킷 + CloudFront 기본 도메인 + OAC, S3에는 PC만 올림, 운영 서버에는 S3 권한 없음, 그림 먼저 연결 나중(ADR-0163)
  - `book_search.library_ids integer[]`는 예외(ADR-0160)
  - AI 검색 카드의 표지·요약은 AI 호출과 겹쳐 읽음, 프로필은 서버 시작 때 한 번(R6)
  - 배포 1에서 한 번 복사, 옛 표는 배포 2에서 지움(ADR-0166)
- 태그: `[확정]` 사용자가 정했거나 공식 문서로 확인 / `[안]` 제안 / `[확인 필요]` 모르는 값(코드에 확정값처럼 넣지 말고 `TODO(확인 필요)`, 확인 뒤 보고) / `[추론]` 계산한 어림값
- 단계마다 `backend/` `./gradlew build`(`ModularityTests`·`DocumentationTests` 포함), 웹 단계는 `web/` `npm run build`와 vitest가 통과해야 다음 단계로
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), `docs/maintenance/3-import.md`, 사이클 23·24 인계서의 제약을 그대로 따릅니다

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `design-delta.md`: **기준 문서**(모듈, 데이터, API, 외부 연동, 서버 자원, 공개 API 보충, 배포 순서, settings-index 값, 확인 필요)
- `spec.md`(R1~R9, AC-1~AC-12), `flow.md`(S2 책 상세, S3 추천목록 표지 차례), `scope.md`, `architect-proposal.md`(함정·F1~F6), `research.md`(S3·CloudFront·무료 플랜 근거), `to-dev23-24.md`
- dev `docs/plan-feedback.md` "# 사이클 26 질의 속도"(2026-10-28, ADR-0160 측정)

## 공통 제약

- **C1. 모듈 경계** [확정]: `catalog`에 새 의존 없음, 새 공개 타입은 `catalog` 패키지 바로 아래, 구현은 `catalog/internal/…`. `collection` 쓰기는 `catalog.BookTextsTransfer`로(`aisearch`·`picks.BookTagTransfer`로 쓰던 길 없어짐). 배포 2 뒤 `collection` `allowedDependencies`에서 쓰지 않는 `"aisearch"`를 빼고 Javadoc 고침 [안]. `aisearch`의 `"foryou"` 의존은 dev 24가 뺌. 새 이벤트·공용 모듈 없음
- **C2. 비밀 값**: PC의 AWS CLI 프로필 키(IAM 사용자, 그 버킷 `s3:PutObject`·`s3:ListBucket`만) [확정: 방식]는 PC에만. 운영 서버·저장소·로그·`plan-feedback.md`에 남기지 않음
- **C3. 겹치는 파일**: 23과 `foryou`, `collection/internal/booktexts/`, `web/src/features/picks/forYouBook.ts` / 24와 `aisearch`, `BookTextsImport.java`, `db.changelog-master.yaml`. 나중에 main에 들어가는 쪽이 rebase로 풂

## 개발 시작 전 확인

- [ ] base package `com.chaekcheck` [확정]
- [ ] 시작 커밋은 지금 dev main 끝(plan이 읽은 기준 `905eab7`). v1.19.0이 main에 들어갔는지 적음
- [ ] 작업 폴더·브랜치·docker 프로젝트·포트 [안: dev가 정해 보고]. 다른 사이클의 docker 프로젝트는 켜고 끄지 않음

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| AWS 콘솔에서 S3 버킷(시드니), CloudFront 배포(OAC), PC용 IAM 사용자 키. dev가 사용자 자격으로 CLI로 할 수 있으면 dev가 하고 사용자는 키 발급만 [안] | 1단계 | 버킷 이름, CloudFront 도메인, PC 프로필 |
| 무료 플랜 끝·크레딧 만료 날짜를 콘솔 Billing Settings에서 확인 | 운영 일 | 날짜를 plan에 |
| 화면 확인, 실제 폰(Samsung Internet) 확인 | 8단계 끝 | 진행 / 고침 |
| 배포 1·배포 2 승인 | 10·13단계 | 승인 |

## 구현 단계

경로 약어: `C` = `backend/src/main/java/com/chaekcheck/catalog/`, `P` = `.../picks/`, `B` = `.../collection/internal/booktexts/`, `L` = `backend/src/main/resources/db/changelog/`, `W` = `web/src/`

### 0단계: 계획을 바꿀 수 있는 확인 (코드 변경 없음)

결과를 `# 사이클 26` 절에. 막는 결과면 plan에 보고하고 기다림.
1. 23·24 진행 상태와 Liquibase 번호(`catalog/002`, `collection/007`, `foryou/002`, `picks/007`, `aisearch/005` 겹침)
2. 운영 사서추천 목록이 첫 배포 뒤 그대로인지: 운영 역할 DB `picks.fetch_run`(운영은 받기 꺼짐, `deploy/prod/compose.yaml:67`)
3. 옮기기 전 고아 id 수: `foryou.book_blurb`·`foryou.book_cover`·`picks.book_tag`·`aisearch.search_book`의 `book_id` 중 `catalog.book`에 없는 수. 복사는 다 함(AC-4). 0이 아니면 보고, 처리는 plan이 사용자에게 물음
4. 요약이 사라지는 추천목록 책 수: 지금 `ai-summaries.tsv`로 요약이 보이지만 책첵 요약이 없는 줄(책 번호 없는 줄 포함). 배포 1 전 plan에
5. AI 검색 전후 비교(AC-7·12): dev 24가 `scripts/aisearch/eval/prod_timing.py`(같은 첫 질문 24개를 운영에 보내 첫 글 시간·서버 단계를 잼, v1.19.0 값이 기준)로 함. 후보(카드 bookId·제목)도 남기게 고침. **배포 1 직전과 직후에 dev 24에 알림**("전"은 v1.19.0 값이 있어 생략 가능) [확정: dev 24 답 2026-10-28]
6. 기준 빌드: `./gradlew build`, `npm run build`

### 1단계: S3·CloudFront·IAM 준비와 지금 표지 올리기 (코드 변경 없음)

1. S3 비공개 버킷(시드니, 이름 [안]), CloudFront 기본 도메인 `<id>.cloudfront.net`, OAC로만 읽음 [확정: 방식] (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html, 2026-10-28 확인). 버킷 정책은 그 배포만 읽게
2. PC IAM 키: 그 버킷 `s3:PutObject`·`s3:ListBucket`만 [확정]. 단기 자격 증명이 되면 그쪽(확인 필요 #9)
3. 운영 `/srv/chaekcheck/covers/<sha1>.jpg` 약 8만 장 → `s3://<버킷>/covers/<sha1>.jpg`, `Cache-Control: public, max-age=604800` [확정: 방식]. 운영 서버엔 권한이 없으니 PC를 거침
4. `picks.cover` 그림을 줄마다 `sha1(cover_source).jpg`로 꺼내 같은 `covers/`에 [확정: 방식]. 꺼내는 방법은 dev가 정해 `docs/maintenance/`에 [안]
5. 확인: CloudFront 주소로 열리고 S3 주소로는 안 열림, `Cache-Control` 있음, 객체 수 ≥ `foryou.book_cover`의 서로 다른 `file_key` 수 + 추천목록 그림 수(AC-11 첫 확인)

### 2단계: Liquibase 배포 1 파일 둘

1. `L/catalog/002-book-descriptions.yaml` [확정: 표·칸 / 안: changeset 이름]
   - `book_summary`: `book_id bigint` PK CHECK `>= 1`, `summary text` CHECK `char_length` 1~300, `made_on date NOT NULL`
   - `book_cover`: `book_id` PK, `file_key text` CHECK `~ '^[0-9a-f]{40}$'`
   - `book_profile`: `book_id` PK, `field`, `subfield`, `fiction boolean`, `genres text[]`, `country`, `audience`, `level`, `forms text[]`, 어휘 CHECK 없음 [확정]
   - `book_search`: `book_id` PK, `line text COLLATE "C"`(NULL 또는 1~300), `line_source`, `line_made_on`, `search_text text COLLATE "C" NOT NULL`, `library_ids integer[] NOT NULL`, `imported_at timestamptz`. `line` 셋은 함께 있거나 함께 없음. 색인은 지금 `aisearch.search_book`과 같게(`gin_bigm_ops` 포함) — 질의가 표 이름만 바뀌고 실행 계획이 같아야 함 [확정]
   - `tag_dictionary`, `book_tag`: 지금 `picks/006` 규칙 그대로, `book_tag.tag_code → tag_dictionary.code` FK
   - 설명 표 → `catalog.book` FK 없음 [확정]
   - 한 번 복사 [확정] (ADR-0166): `foryou.book_blurb.blurb` → `book_summary.summary`, `foryou.book_cover` → `book_cover`, `picks.tag_dictionary` → `tag_dictionary` 다음 `picks.book_tag` → `book_tag`, `aisearch.search_book` → `book_search`(제목·저자 빼고, `search_text`는 그대로 [안], 다음 `book-texts` 때 `catalog.book.title`로 다시 만들어짐). 추천목록 요약 파일은 복사 안 함
   - CHECK는 changeset 안 `sql`로
2. `L/collection/007-description-deleted-count.yaml` [안]: `collection.catalog_import.description_deleted_count integer` CHECK `>= 0`, 옛 줄 NULL 허용
3. master 끝에 include 둘
- 시험(`db-test`): CHECK마다 맞는·틀린 줄(요약 0·301자, `file_key` 꼴, `line` 셋 중 하나만, 사전에 없는 `tag_code`), 복사 SQL이 같은 수를 만드는지(빈 DB는 0줄)
- AC-4 준비. 위험 중간(`gin_bigm_ops`는 `db-test` 이미지의 pg_bigm 필요)

### 3단계: `catalog` 공개 API와 구현

1. `C/BookTexts.java` [안]: `summaries(ids)`, `coverUrls(ids)`, `tags(ids)`(`active` 코드만), `listCoverUrls(Map<listRowKey, bookId>)` — ADR-0164 ①·② 차례, "같은 책 다른 판"은 `BookCards.workKeys` 규칙(본제목 정리값 + 저자 `name_exact` 공유), 최신 = `published_on` 큰 판, 같으면 `cardinality(library_ids)` 큰 판. 요청마다 DB에서 읽음(메모리 사본 없음)
2. `C/CoverUrls.java` [안]: `of(fileKey)` → `<base-url>/covers/<key>.jpg`, 설정 `chaekcheck.covers.base-url` [안], 값은 1단계 CloudFront 주소 [확인 필요: 1단계 뒤]. 비었거나 키가 sha1 꼴이 아니면 null [안]
3. `C/BookProfiles.java` [안]: `all()`(같은 값 문자열은 나눠 씀, 약 12~16MB [추론]), `version()`. 부르는 쪽이 시작 때 한 번
4. `C/AiSearchIndex.java` [안]: `find`, `planCounts`, `lines`, `books`, `version`, `compact` — 지금 `CandidateQuery`·`SearchBooks` SQL을 표 이름만 바꿔 옮김(F6). 제목·저자는 `catalog.book`에서. `version()`은 `count(*)` + `max(imported_at)`. `compact()`는 `VACUUM FULL`. 이 단계에서 `aisearch` 코드는 안 바꿈
5. 쓰기 `C/BookTextsTransfer.java` [안]: `upsertSummaries`, `upsertCovers`, `replaceTags`(모르는 코드 건너뛰고 수), `replaceTagDictionary`(없는 코드는 `active=false`), `replaceProfiles`(전체), `replaceSearchBooks`(`search_text`는 `catalog.book.title`로, `library_ids`는 `catalog.book.library_ids`에서, ADR-0160)
6. `C/package-info.java` Javadoc
- 시험: `BookTexts`(없는 번호·`active=false` 빠짐), `listCoverUrls` AC-9 세 경우, `CoverUrls`, `AiSearchIndex`(지금 `CandidateQuery` 시험을 새 표로), `BookTextsTransfer`, `ModularityTests`
- AC-9(로직), AC-1 준비. 위험 중간

### 4단계: 다시 가져오기 함정 고침 (`C/internal/JdbcCatalogLoad.java`)

1. `createIndexesAndConstraints`의 질의에 `t.relname = ANY(TABLES)`(책 목록 표 넷만) [확정: 코드] — 안 하면 새 표 때문에 깨짐
2. `swap`의 `first`에 DELETE 다섯 줄 [확정] (ADR-0162): `book_summary`, `book_cover`, `book_profile`, `book_search`, `book_tag`(`tag_dictionary`는 `book_id`가 없어 제외). `WHERE NOT EXISTS (SELECT 1 FROM catalog_next.book b WHERE b.id = <표>.book_id)`, 실행 계획을 `# 사이클 26`에. DROP 앞 같은 트랜잭션, 지금 `SET LOCAL lock_timeout` 그대로(넘기면 ROLLBACK, 지운 것도 되돌아감). 운영 `apply`, PC `finishPrepared`, `replaceAll` 모두 `swap`을 지나므로 한 곳만(F4)
3. 지운 수 합을 `catalog_import.description_deleted_count`에, 표별 수는 로그 [안]
4. 기준값 해시(`Manifests`)는 이미 표 넷으로 거름 — 시험으로 확인만
- 시험(`db-test`): **AC-6** 두 책 합침(5와 9 → 5) 뒤 9의 설명 없음·5 그대로·지운 수 맞음, 사라진 책, 새 표가 있어도 다시 가져오기가 깨지지 않음, `lock_timeout` 넘김 시 되돌림, 기준값 해시 영향 없음
- 측정: 운영 꼴 크기(`book_cover` 134만 줄 가정)에서 DELETE 시간 [확인 필요], 검색 멈춤(DROP 단계)이 지금과 같은지
- 위험 높음(가져오기 핵심 경로)

### 5단계: `collection` 넣기 모드

1. `book-texts`(`B/BookTextsImport.java`): kind별 `BookTextsTransfer` — `for_you_blurb` → `upsertSummaries`, `cover_file` → `upsertCovers`, `tags` → `replaceTags`, `search_line` → `replaceSearchBooks`. 찾기 대상은 그대로(`ListedBooks.loadFromDb()` 전부 + `MostHeldBooks.top(N)`(운영 100000) − `search_exclude` 줄), 끝나면 `compact()`. **`export_id` 검사** [확정]. 파일 전체 먼저 검사하는 지금 규칙 그대로
2. `tag-dictionary` → `BookTextsTransfer.replaceTagDictionary`
3. 새 모드 `book-profiles` [확정]: 지금 9칸 파일 + 첫 줄 `# export_id=`, 통과하면 `replaceProfiles`, 끝날 때 "서버를 다시 켜야 AI 검색에 반영" 출력 [안]
4. `collection/package-info.java` Javadoc
- 시험: **AC-5**(다른 `export_id`의 `book-texts`·`book-profiles` 거절·수 그대로, 첫 줄 없음 거절, 강제 설정은 넣음), kind 넷, 모르는 kind 수, 찾기 대상 책 수 같음, `book-profiles` 형식 오류 전체 거절, `ModularityTests`·`DocumentationTests`
- 위험 중간(24와 같은 파일)

### 6단계: `picks` 읽는 곳 바꾸기

1. 요약: `ListedBook.aiSummary`와 `GET /api/v1/picks/{listKey}`의 `aiSummary` 값을 `catalog.BookTexts.summaries`로(칸 이름 그대로 [안]). 책 번호 없는 줄은 요약 없음 [확정]. `P/internal/cache/AiSummaries.java`와 `picks/ai-summaries.tsv` 지움 [확정]
2. 꼬리표: `ListedBook.tags`를 `BookTexts.tags`로, `PicksCache` 주기 그대로, `P/BookTagTransfer.java` 지움
3. 줄 표지(ADR-0164): `listCoverUrls`에 값이 있으면 그것, 없거나 책 번호 없는 줄이면 `CoverUrls.of(sha1(cover_source))`. 사서추천 줄도 같은 규칙, `/api/v1/picks/covers/{id}` 주소는 더 만들지 않음. `CoverFiles`의 상대 경로 만들기 → `CoverUrls`. 엔드포인트와 `picks.cover` 표는 배포 2까지 남김
- 시험: `aiSummary` = `catalog` 요약(글자까지), 없는 책 null, 줄 표지 세 경우(AC-9), 책 번호 없는 줄은 목록 그림, 꼬리표 `catalog`에서, `ai-summaries.tsv` 읽는 코드 없음, `ModularityTests`
- AC-1(추천목록 책 창), AC-9, AC-10(추천목록)

### 7단계: 책 상세 API (`C/internal/web/BookSearchController.java`)

- `GET /api/v1/books/{bookId}`의 `BookDetail`에 `coverUrl`(완성 주소 또는 null), `summary`(또는 null) [확정: 칸]. 경로·버전·404 그대로. 일반 검색 결과 응답에는 넣지 않음 [확정]
- 시험: 요약·표지 있는 책 / 둘 다 없는 책(null) / 검색 결과에 두 칸 없음
- AC-2, AC-3(서버)

### 8단계: 웹과 배포 설정

1. `W/api/types.ts` `BookDetail`에 `coverUrl: string | null`, `summary: string | null`
2. `W/features/book/BookPage.tsx` [확정] (flow S2): 머리 왼쪽 표지, 오른쪽 제목·저자·출판사·출판일·보유 도서관 수(지금 글 그대로), 그 아래 「AI 요약 ⓘ」 + 요약 전체(자르지 않음, ⓘ 안내 글은 `PicksBookDialog`와 같음). 요약 없으면 칸 없음, 표지 없으면 글을 왼쪽에, 그림 오류면 `CoverImage`처럼 제목 글자 표지 [안]. 폰은 표지 폭만 작게. 「AI 요약 ⓘ」 조각을 책 창과 함께 쓸지는 dev가 정함 [안]
3. `W/features/picks/picksText.ts` `safeCoverUrl`: `^https://<CloudFront 주소>/covers/[0-9a-f]{40}\.jpg$`도 받음(주소는 빌드 설정, 이름 [안]). 옛 상대 경로 두 모양은 배포 2까지
4. CSP `deploy/nginx/security-headers.conf`: `img-src 'self' data: https://<id>.cloudfront.net` [확정: 방식]. nginx `/covers/`는 배포 2까지
5. 운영 `chaekcheck.covers.base-url`을 배포 설정에 [안: 자리]
- 시험(vitest): `BookPage` 네 상태, `safeCoverUrl`(CloudFront 받음, 다른 호스트·http·확장자·키 꼴 거절, 옛 경로 받음), 기존 `PicksBookDialog`·`SearchPage` 시험
- 화면: Playwright 1440 → 768 → 375, S2 네 상태, 검색 결과 줄에 요약·표지 없음, 콘솔에 CSP 오류 없음(nginx를 거치는 환경). 그다음 사용자 화면 확인과 실제 폰 확인
- AC-2, AC-3, AC-10

### 9단계: 연습 (운영 꼴 복사본 DB)

1. 배포 1 코드로 Liquibase, 시간 잼
2. AC-4 SQL: `foryou.book_blurb` ↔ `book_summary`, `foryou.book_cover` ↔ `book_cover`, `picks.book_tag` ↔ `book_tag`, `picks.tag_dictionary` ↔ `tag_dictionary`, `aisearch.search_book` ↔ `book_search` (참고 dev 기록 2026-10-27: 68,414 / 80,091 / 0 / — / 76,759)
3. 다시 가져오기 한 번: 깨지지 않음, `description_deleted_count`, DELETE 시간
4. 옛 표·새 표가 함께 있을 때 디스크 증가(약 +110~150MB [추론])

### 10단계: 배포 1과 확인

1. 사용자 승인 뒤 배포(`foryou`·`aisearch` 읽는 곳 바꿈 포함)
2. 배포 직후 AC-4 SQL을 운영에서
3. 화면: AC-1(같은 책을 추천목록 책 창·책첵 추천 카드·AI 검색 카드·책 상세에서), AC-2·3, AC-9(줄 세 권), AC-10(네 화면 CSP 오류 없음)
4. AI 검색 전후 비교(AC-7·12, dev 24). 첫 글 시간이 늘면 배포 2 전에 plan에 [확정] (R8)

### 11단계: 나머지 표지 올리기와 연결

1. PC가 남은 약 134만 장(약 12~15GB [추론])을 `aws s3 sync`, `Cache-Control`은 1단계와 같게
2. 다 올린 뒤 `book-texts` `cover_file` 파일(첫 줄 `# export_id=`)로 연결. 올리기 실패한 그림은 줄을 넣지 않음 [확정]
3. AC-11: S3 `covers/` 객체 수 ≥ `SELECT count(DISTINCT file_key) FROM catalog.book_cover`
4. PUT 수와 저장 크기 기록(어림 PUT 약 $7.4 한 번, 저장 월 약 $0.38 [추론])

### 12단계: 프로필 처음 넣기

1. 운영 모델 폴더 `book-profiles.tsv` 첫 줄에 그 파일을 만든 내보내기의 `export_id`를 적고 `book-profiles`로 넣음(기준이 다르면 거절 → PC에서 다시 만듦, dev 24)
2. 서버 다시 켬(`MlFirstCall`이 `BookProfiles.all()`을 읽는 것은 dev 24 맞춤 뒤)
3. AC-4(프로필): `catalog.book_profile` 줄 수 = 파일 줄 수 = 77,551 [확정] (dev 24 확인 2026-10-28: 운영 파일 md5가 PC `chaekcheck-data/ml/aisearch-model-100k`와 같음). `aisearch/internal/firstcall/BookProfiles.java:14`의 "27,227" javadoc은 옛 판 설명이라 `BookProfiles.all()`로 바꿀 때 같이 지움

### 13단계: 배포 2 (옛 표 지우기)

조건: 10단계 확인 끝, 23·24 코드가 옛 표·옛 API를 쓰지 않음.
1. Liquibase: `L/foryou/002-drop-book-blurb-cover.yaml`(`book_blurb`, `book_cover`), `L/picks/007-drop-moved-tables.yaml`(`book_tag`, `tag_dictionary`, `cover`), `L/aisearch/005-drop-search-book.yaml`(`search_book`), master 끝에 include 셋
2. 코드: `/api/v1/picks/covers/{coverId}`와 관련 클래스, `picks.cover` 읽기·쓰기 지움. 사서추천 받기 코드의 그림 저장(`CoverResizer` 쓰는 곳)을 빼고, 새 사서추천 그림은 PC가 `sha1(cover_source).jpg`로 올림 [확정: 방식] (ADR-0163 "PC만 올림", 운영 받기는 지금 꺼져 있음). `safeCoverUrl`의 옛 상대 경로 지움. `collection` `allowedDependencies` 정리(C1)
3. 배포 설정·운영: nginx `/covers/` 위치 지움, 운영 `/srv/chaekcheck/covers/` 치움
4. AC-8: `ModularityTests` 통과, 코드 검색으로 옛 표 이름·`foryou.BookBlurbs`·`BookCovers`·`ai-summaries.tsv`가 없음
- 위험 중간(되돌릴 옛 표가 없어짐)

### 14단계: dev 문서 고치기 (각 단계와 같은 변경으로)

1. `docs/maintenance/4-picks.md` 8절 다시 쓰기 [확정: 방향] (architect F3): 운영 DB에서 추천목록 책 중 `catalog.book_summary`가 없는 책 번호 뽑기(질의를 문서에) → PC 배치(`for_you_blurb` 방식, `build_100k.py` 흐름) → `book-texts`(첫 줄 `# export_id=`) → 새 사서추천 줄 목록 그림은 PC가 S3에. 빌드·배포 필요 없어짐. 234행 "AI 요약은 8절대로 넣음"도 맞춤
2. `docs/maintenance/7-foryou.md:41` [확정: 코드] (F2-a): 요약·표지는 넣으면 바로, 꼬리표는 `picks` 캐시로 10분 안, 프로필은 서버 다시 켬. 모드 목록(`catalog`로 씀)과 `book-profiles` 더함
3. `docs/maintenance/3-import.md`: 바꿔 끼우기 안 DELETE, `description_deleted_count`, `book-texts`·`book-profiles` `export_id` 검사
4. 표지 올리기 절차(1·11단계, 새 책 표지, `picks.cover` 꺼내기)를 `docs/maintenance/`에 [안: 자리], 다른 Claude 세션이 문서만 읽고 돌릴 수 있게

## `foryou`·`aisearch`에서 바꿀 것 (dev 26이 배포 1에서 main에, 23·24는 rebase로 맞춤 — `to-dev23-24.md` 3절과 같음)

dev 26이 main의 지금 코드에서 아래를 바꿉니다. 23·24 브랜치가 같은 곳을 새로 고쳤으면 rebase 때 `catalog` API 쪽으로 맞춥니다. dev 24의 전후 비교(AC-7·12)는 dev 24가 합니다.

### dev 23 몫 (`foryou`)
- `foryou/internal/store/BookTexts.java`의 요약·표지 질의 → `catalog.BookTexts.summaries`/`coverUrls`
- `foryou.BookBlurbs`·`BookCovers` 지움, `ForYouTransfer`의 요약·표지 쓰기 없앰(이웃만 남음)
- 카드 응답의 `aiSummary` 칸 없애고 `blurb` 하나 [안, dev 23], 웹 `forYouBook.ts`의 `aiSummary ?? blurb`도
- 카드 `coverUrl`은 CloudFront 완성 주소
- 꼬리표는 `ListedBook.tags` 그대로
- AC-1(책첵 추천 카드), AC-10(책첵 추천 표지)

### dev 24 몫 (`aisearch`)
- `CandidateQuery`(`find`·`planCounts`·`lines`) → `catalog.AiSearchIndex`(표 이름만 바뀜, `library_ids` 남음)
- `SearchBooks` → `AiSearchIndex.books()/version()`(1분 확인 그대로)
- 카드 표지·요약 → `catalog.BookTexts`, **겹쳐 읽기(`beside`, 가상 스레드, 첫 카드 때 `join`, 실패면 빈 Map) 그대로** [확정] (R6, F1). 목록 `aiSummary` → 탭 요약 차례는 없어짐
- `MlFirstCall`: 파일 대신 `catalog.BookProfiles.all()`을 시작 때 한 번, 책 벡터와 같은 때 [확정]
- `AiSearchBookTexts`·`JdbcAiSearchBookTexts` 지움, `aisearch/package-info.java`에서 `"foryou"` 뺌
- 제목 바뀜 주의: 찾기 글과 카드 제목이 추천목록에 보이는 이름 → `catalog.book.title`. 복사 직후 `search_text`는 옛 제목 기준 [안], 다음 `book-texts`에서 다시 만들어지므로 비교는 그 뒤에도 한 번
- 전후 비교(AC-7·12): 배포 1 전(0단계 5)과 뒤의 후보와 첫 글 시간, 후보 차이는 제목 기준 표로 `# 사이클 26`에, 늘면 배포 2 전에 알림
- `build_100k.py` 결과를 `book-texts`(요약·찾기용 한 줄) + `book-profiles`로, 둘 다 첫 줄 `# export_id=` [확정]. 대상 범위(보유 많은 10만 권 중 소개 50자 이상 76,974권) 그대로
- 운영 `book-profiles.tsv` 줄 수 확인

### 둘 다
- Liquibase 번호가 26과 겹치면 그쪽이 올림
- 맞춘 결과와 날짜를 각자의 `plan-feedback.md` 절과 `# 사이클 26` 절에 한 줄씩

## settings-index.md에 올릴 값

plan이 같은 변경으로 `docs/settings-index.md`에 올리고, dev는 실제 키·값·자리를 `# 사이클 26`에 보고합니다.

| 값 | 자리(dev) | 상태 |
|---|---|---|
| `chaekcheck.covers.base-url` = CloudFront 기본 주소 | `application.yml` + 운영 배포 설정 | 키 [안], 값 [확인 필요: 1단계 뒤] |
| S3 객체 `Cache-Control: public, max-age=604800` | PC 올리기 명령 | [확정: 방식] |
| CSP `img-src`에 `https://<id>.cloudfront.net` | `deploy/nginx/security-headers.conf` | [확정: 방식] |
| PC IAM `s3:PutObject`·`s3:ListBucket`(그 버킷만) | AWS IAM | [확정] |
| 바꿔 끼우기 `lock_timeout`(DELETE가 같은 트랜잭션에) | `JdbcCatalogLoad`(지금 값 그대로) | DELETE 시간 [확인 필요] |
| 프로필 메모리 약 12~16MB(힙 `-Xmx640m`) | `aisearch` 시작 때 | [추론] |

## 테스트와 AC

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 네 곳 요약 글자까지 같음 | `PicksCache` 시험 + 화면 | 6, 10 |
| AC-2 책 상세에 표지·요약, 검색 결과 줄에는 없음 | 컨트롤러 시험 + vitest + 화면 | 7, 8, 10 |
| AC-3 요약 없음 → 칸 없음, 표지 없음 → 글 왼쪽 | vitest + 화면 | 8, 10 |
| AC-4 옛 표·새 표 줄 수 같음, 프로필 = 파일 줄 수 | SQL 다섯 쌍, `book_profile` ↔ 파일 | 9, 10, 12 |
| AC-5 다른 `export_id` → 거절 | 넣기 시험 + 명령 결과 + SQL | 5 |
| AC-6 합쳐진 책의 버려진 번호 설명 없음 | `db-test` + 연습 DB | 4, 9 |
| AC-7 AI 검색 첫 글 시간이 늘지 않음 | dev 24 전후 측정 [안: 방법] | 0, 10 |
| AC-8 옛 표·API·요약 파일을 읽지 않음 | `ModularityTests` + 코드 검색 | 13 |
| AC-9 줄 표지 ADR-0164 차례(세 권) | `listCoverUrls` 시험 + 화면 | 3, 6, 10 |
| AC-10 CloudFront 표지가 CSP 오류 없이 보임 | 화면 4곳 + 콘솔 | 8, 10 |
| AC-11 S3 객체 수 ≥ 서로 다른 `file_key` 수 | `aws s3 ls --recursive` + SQL | 1, 11 |
| AC-12 사본을 없앤 뒤 같은 질문의 후보가 같음 | dev 24 전후 후보 표 | 10 |

## 완료 기준

- [ ] AC-1~AC-12를 위 단계에서 확인하고 AC 확인표를 `# 사이클 26` 절에
- [ ] 단계마다 `./gradlew build`(`ApplicationModules.verify()`, `DocumentationTests`), `npm run build`·vitest 통과
- [ ] 기존 changeset을 고치지 않았고, master 끝 순서가 23·24와 합친 뒤에도 맞음
- [ ] 배포 순서 1~6을 차례대로 했고 그 사이 표지가 깨진 화면이 없었음
- [ ] 다시 가져오기 DELETE의 실행 계획과 시간을 보고함
- [ ] 책 상세 S2를 사용자가 **자기 폰(Samsung Internet)**으로 dev 웹 서버 `web-lan-5174`(같은 Wi-Fi)에서 확인함 — Chrome 폰 흉내만으로는 안 됨(사용자 결정, 2026-10-12)
- [ ] dev 23·24 맞춤이 들어갔고, 배포 2에서 옛 표·`/api/v1/picks/covers/{id}`·nginx `/covers/`·운영 옛 표지 폴더를 치움
- [ ] dev 문서(`4-picks.md` 8절, `7-foryou.md:41`, `3-import.md`, 표지 올리기 절차)를 고침
- [ ] [확인 필요] 결과, 설계와 달라진 점, 새로 알게 된 제약을 `# 사이클 26` 절에

## [확인 필요] 항목

| # | 항목 | 누가·어떻게 | 막는 단계 |
|---|---|---|---|
| 2 | 운영 사서추천 목록이 첫 배포 뒤 그대로인지 | dev 26, `picks.fetch_run` | 0, 1 |
| 3 | AI 카드 제목·`search_text`가 `catalog.book.title`로 바뀌는 영향 | dev 24, AC-7·12 전후 비교 | 10, 13 |
| 5 | 옮기기 전 고아 id 수 | dev 26 | 배포 1 |
| 6 | 23·24 Liquibase 번호 겹침 | dev 23·24·26 | 2, 13 |
| 7 | 매달 새 사서추천 책 요약 절차 | dev 26, 14단계 1 | 14 |
| 8 | 무료 플랜 끝·크레딧 만료 날짜 | 사용자, 콘솔 Billing Settings | 운영 일 |
| 9 | PC 단기 자격 증명 가능 여부 | dev 26, AWS 공식 문서 | 1 |
| spec 1 | 요약이 사라지는 추천목록 책 수 | dev 26 | 배포 1 |
| spec 5 | 사이클 25가 같은 표를 건드리는지 | plan | 배포 1 |
| — | 바꿔 끼우기 DELETE 시간 | dev 26, 시험 DB | 4, 9 |
| — | CloudFront 도메인 값 | 1단계 결과 | 8 |

## 이번에 하지 않는 것

- 요약 없는 책 12,666권의 요약 만들기(backlog), 일반 검색 결과 줄의 요약·표지, 책 프로필·꼬리표 화면 표시, 요약 출처 여러 개
- 다시 가져오기 직후 `book_search.library_ids` 새로 고치기, 서버 사서추천 받기 때 EC2 역할로 S3, 표지 하위 도메인·WebP (backlog)
- plan `docs/current/` 고치기(plan이 함)

## 개발 후 plan 쪽에 알려줄 것

dev `docs/plan-feedback.md`의 새 **`# 사이클 26`** 절에 설계와 달라진 점과 그 이유(사용자 발언 그대로)를 적습니다.
- 시작 상태(작업 폴더·브랜치·docker·포트·시작 커밋·v1.19.0 반영 여부·기준 빌드)
- 0단계 결과(나오는 대로 바로)
- AWS: 버킷 이름, CloudFront 도메인, IAM 방식(키 값은 적지 않음)
- 측정값: 올린 장 수, 134만 장 시간·PUT 수·저장 크기, AC-4 줄 수, 프로필 줄 수, DELETE 실행 계획·시간, `description_deleted_count`, 배포 1~2 디스크 증가와 배포 2 뒤 감소, AI 검색 전후(dev 24)
- 실제 설정 값(`chaekcheck.covers.base-url`과 자리, 웹 빌드 설정 이름, CSP 줄)
- 바꾼 이름과 모양(공개 API, `listCoverUrls`, 칸, changeset id, 합친 Liquibase 번호)
- 설계와 달라진 점(고아 id 처리, `search_text` 복사, 지운 수 기록, 배포 1 시점, 화면 확인에서 사용자가 고친 것)
- 새로 알게 된 제약(AWS 설정·비용, 무료 플랜 날짜, 23·24 맞춤 문제), [확인 필요] 각 행의 결과, AC 확인표
