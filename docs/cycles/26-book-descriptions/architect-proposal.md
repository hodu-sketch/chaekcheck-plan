# 설계 제안 (architect, 2026-10-28): 사이클 26 책 설명 한 곳에 모으기

- 기준 코드: main = `chaekcheck-dev-rel` (`905eab7`), v1.19.0 = `chaekcheck-dev-db` (`claude/aisearch-faster-first`). 경로는 `backend/src/main/java/com/chaekcheck/` 아래
- 결정 페이지: [easy/2026-10-28-design-decisions.html](easy/2026-10-28-design-decisions.html)

## 0. 코드에서 찾은 함정 [확정: 코드]

1. 새 표를 `catalog` 스키마에 두면 다시 가져오기 바꿔 끼우기가 깨짐: `JdbcCatalogLoad.createIndexesAndConstraints`(rel `catalog/internal/JdbcCatalogLoad.java:549-591`)가 `catalog` 스키마의 모든 제약·색인을 표 이름 거르기 없이 `catalog_next.<표>`에 다시 만듦 → `t.relname = ANY(TABLES)` 거르기 한 줄 필요. 기준값 해시(`Manifests.java:88-91`)는 이미 표 4개로 거름
2. 운영은 사서추천을 받지 않음: `deploy/prod/compose.yaml:67` `CHAEKCHECK_PICKS_FETCH_ENABLED: "false"`
3. AI 검색 사본의 제목은 목록에 보이는 이름(`aisearch/AiSearchBookTexts.java:41-46`, `BookTextsImport.java:147`), `search_text`도 그 제목으로 만듦(`JdbcAiSearchBookTexts.java:88`). 사본을 없애면 `catalog.book.title`로 바뀜 → AC-7 때 같이 봄 [확인 필요]

## F1~F6 사실 [확정: 코드]

| # | 사실 | 근거 |
|---|---|---|
| F1 | 후보의 `lines`는 동기로 먼저 읽음(2차 프롬프트). 표지·요약은 `beside(...)` = `CompletableFuture.supplyAsync`(가상 스레드)로 겹쳐 읽고 첫 카드 때 `join()`, 실패는 빈 Map. 차례: 목록 표지 → 탭 표지, 목록 `aiSummary` → 탭 요약 | dev-db `aisearch/internal/flow/AiSearchFlow.java:520, 526-528, 195, 629-631, 928-956` |
| F2-a | foryou 요약·표지는 요청마다 DB에서 읽음(메모리 사본 없음) → 넣으면 바로 보임. `refresh-interval 10m`은 매일 결과 사본에만. 꼬리표는 picks 캐시를 거쳐 10분 안. dev `7-foryou.md:41` 문구는 요약·표지에 맞지 않음 | `ForYouController.java:143-144`, `BookTexts.java:44-52`, `application.yml:306,380` |
| F2-b | `SearchBooks`는 `(book_id, title, author)` 메모리 사본, 1분마다 `count(*)`+`max(imported_at)` 보고 다시 읽음. `CandidateQuery`는 요청마다 DB | `aisearch/internal/match/SearchBooks.java:29, 74-111` |
| F2-c | `MlFirstCall` 생성자에서 시작 때 한 번 `BookProfiles.read`, 책 벡터도 시작 때 한 번 | `MlFirstCall.java:84-110`, `BookProfiles.java:34-56` |
| F3 | 사서추천 새 책 요약은 사람이 만듦(운영 DB에서 목록 책 → 소개 → Haiku → 사람이 고침 → `ai-summaries.tsv` 커밋·배포) → 앞으로 "목록 책 중 `catalog` 요약 없는 책 → PC 배치(`for_you_blurb` 방식) → `book-texts`"로 바뀜 | rel `docs/maintenance/4-picks.md:210-220`, `PicksCache.java:255` |
| F4 | `Ids.decide`는 버려진 번호 목록을 남기지 않음. 운영 `apply`, PC `finishPrepared`, `replaceAll` 모두 `swap(connection, steps, first)`를 지나고 `first`는 DROP 앞 같은 트랜잭션 → 여기서 `catalog_next.book`에 없는 `book_id`의 설명을 지우면 됨. `catalog.book.library_ids` = `bigint[] NOT NULL` + GIN, AI 사본은 `integer[]` | rel `JdbcCatalogLoad.java:858-890, 168-220, 484-489, 598-618`, `catalog/001:43,124`, `aisearch/004:15-20` |
| F5 | 사서추천 `picks.cover`(bytea) → `/api/v1/picks/covers/{id}`. 다른 목록은 `CoverFiles.path(url)` = `/covers/<sha1(url)>.jpg`, 판 표지도 같은 폴더, nginx 7일 캐시. 웹 `safeCoverUrl`은 상대 경로 두 모양만 받음. CSP `img-src 'self' data:`. 사이트 앞은 Cloudflare Tunnel | `CoverFiles.java:12-25`, `deploy/nginx/chaekcheck-locations.conf:16-21`, `web/src/features/picks/picksText.ts:72-75`, `deploy/nginx/security-headers.conf:13`, `deploy/nginx/ec2-tunnel.conf:1-5` |
| F6 | 찾기: 낱말마다 `search_text LIKE`(pg_bigm GIN) OR, `library_ids && :plan`, 제외 id, `ORDER BY core_score, score, plan_count, book_id LIMIT`. 대상: `ListedBooks.loadFromDb()` 전부 + `MostHeldBooks.top(N)`(운영 100000) − `search_exclude`, 끝나면 `VACUUM FULL`. 지금 약 7.7만 줄 | `CandidateQuery.java:35-36, 90-144`, `BookTextsImport.java:100-161` |

## 결정 (사용자 결정 대기, 결정 페이지 번호와 같음)

1. `catalog` 표 모양 — A 종류마다 표(`book_summary`, `book_cover`, `book_profile`, `book_search`, `tag_dictionary`, `book_tag`) [안 추천] / B 표 하나 `book_text(book_id, kind, text)`
2. 읽는 모듈에 줄 API — A 목적별 작은 인터페이스(`BookTexts`, `CoverUrls`, `BookProfiles`, `AiSearchIndex`, 쓰기 `BookTextsTransfer`) [안 추천] / B `BookCards.BookCard`에 칸 붙이기
3. 표지 주소 도메인 — A 그림 전용 하위 도메인 → CloudFront(ACM 인증서 us-east-1, https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html 2026-10-28) / B CloudFront 기본 도메인 `<id>.cloudfront.net` [안 추천] / C nginx가 S3로 넘김. S3 비공개 + OAC, `Cache-Control` 7일
4. S3에 누가 올리나 — A PC만(IAM 사용자 키, 그 버킷 `PutObject`·`ListBucket`만, `aws s3 sync` 뒤 `cover_file` 넣기) [안 추천] / B PC + 서버(EC2 역할). `picks.cover` 그림은 한 번 `sha1(cover_source).jpg`로 꺼내 올림
5. AI 찾기 대상 — A `catalog.book_search` 행이 대상, `collection`이 고름 [안 추천] / B `aisearch`가 id 목록(경계·순서 문제)
6. `book_search.library_ids` — A 찾기 표에 `integer[]`로 둠(같은 질의, 빠르기 그대로, 같은 모듈 안 두 번) [안 추천] / B 질의 때 `catalog.book`과 조인(사본 없음, 빠르기 다시 재야 함)
7. 프로필 — A 형식 있는 칸 [안 추천] / B `jsonb`. 넣기는 새 모드 `book-profiles`(9칸 파일 + `# export_id=`), 메모리는 시작 때 한 번(벡터와 같은 시점)

## 모듈·데이터·API 초안 (추천 기준)

- `catalog`: 표 6개 추가, 공개 API 2-A, `createIndexesAndConstraints` 거르기, `swap` `first`에 DELETE
- `picks`: `aiSummary` 값 = `catalog` 요약, `coverPath` = `listCoverUrls` 있으면 그것, 없으면 `CoverUrls.of(sha1(cover_source))`. `AiSummaries`, `BookTagTransfer`, `picks.cover` 없앰, `/api/v1/picks/covers/{id}`는 배포 2에서 없앰
- `foryou`: `BookBlurbs`, `BookCovers`, 요약·표지 쓰기 없앰 (dev 23)
- `aisearch`: `AiSearchBookTexts` 없앰, `CandidateQuery` → `catalog.AiSearchIndex`, `SearchBooks` → `books()/version()`, `MlFirstCall` → `BookProfiles.all()` (dev 24)
- `collection`: `BookTextsImport`가 `catalog` 쓰기 API, `export_id` 검사, 새 모드 `book-profiles`
- Liquibase: 배포 1 `catalog/002-book-descriptions.yaml`(표 + 색인 + 복사), 배포 2 `foryou/002-drop-book-blurb-cover.yaml`, `picks/007-drop-moved-tables.yaml`, `aisearch/005-drop-search-book.yaml`. 지운 수 칸 `collection/007-...` [안]
- 설명 표 → `catalog.book` FK 없음(가져오기 때 `book`을 DROP하므로), `book_tag → tag_dictionary` FK는 둠
- `GET /api/v1/books/{bookId}` `BookDetail`에 `coverUrl`, `summary`(없으면 null) 추가 (rel `catalog/internal/web/BookSearchController.java:72`)

## 서버 자원 [추론]

| 항목 | 값 |
|---|---|
| 프로필 메모리 77,551권 | 같은 값 문자열을 나눠 쓰면 약 12~16MB (힙 `-Xmx640m`) |
| `book_cover` 134만 줄 | 약 110MB + PK 약 30MB |
| `book_summary` | 약 25MB |
| `book_search` | 약 70MB + bigm 색인 (옮기는 것) |
| 배포 1~2 사이 | 옛 표와 새 표가 함께 약 +110~150MB |
| 바꿔 끼우기 DELETE | 트랜잭션 안 약 1~3초, 검색이 멈추는 시간은 지금과 같음 |

## 확인 필요

1. 운영 사서추천 받기가 꺼져 있음 → 운영 목록이 첫 배포 뒤 그대로인지 (dev 운영 DB `picks.fetch_run`)
2. 목록 책 AI 카드 제목·`search_text`가 `catalog.book.title`로 바뀌는 영향 (dev 24)
3. 운영 `book-profiles.tsv` 줄 수 (코드 주석 27,227 ↔ 문서 77,551)
4. 복사 전 고아 id 수 (dev, 운영 역할 DB)
5. 23·24 브랜치 Liquibase 번호 겹침 → `to-dev23-24.md` 3절
6. 지운 수를 `catalog_import` 칸으로 남길지 로그만으로 둘지
7. AWS CLI 단기 자격 증명 방식 확인 못 함

## backlog 후보

- 다시 가져오기 직후 `book_search.library_ids` 새로 고치기
- 서버 사서추천 받기를 켜면 EC2 역할로 S3 올리기(결정 4 B)
- 표지 하위 도메인(결정 3 A), WebP
- dev 문서 `7-foryou.md:41`, `4-picks.md` 8절 고치기
