# 회고: 사이클 26 책 설명 한 곳에 모으기

- 쓴 날: 2026-10-29 (사용자 "26완료되었는데 회고만 해줘")
- 근거: dev `docs/plan-feedback.md` "# 사이클 26 질의 속도"(7040행)·"# 사이클 26"(7065~7358행)·"# 사이클 26 (dev 24 몫)"·"# 사이클 26 배포 1 전후 AI 검색 시간"·"# AI 검색 대화를 가리키는 말", dev `docs/cycle26-book-descriptions/`(README, `2-dev-record.md`, `3-postgres-generic-plan.md`, `4-keyword-query-speed.md`), dev `CHANGELOG.md` v1.20.0~v1.20.6, dev 코드(읽기만)
- 상태: 인계서 0~13단계 모두 끝, 운영 반영 (2026-10-29)
  - 배포 1 = v1.20.0 `7ae1aa83` (08:29). 사용자 폰 확인 "잘된다"
  - 11단계 표지: S3 `covers/` 1,130,143개, `catalog.book_cover` 1,145,754줄(서로 다른 그림 1,128,687장)
  - 12단계 프로필: 09:26 `catalog.book_profile` 77,551줄. 첫 시도는 6분 동안 AI 검색이 멈춰 되돌림(아래 "운영에서 생긴 일")
  - 배포 2 = v1.20.6 `48ede47a` (12:00). 옛 표 여섯과 옛 표지 경로를 지움. 운영 `/srv/chaekcheck/covers` 1.1GB도 지움(디스크 남은 공간 9.1 → 11GB)
  - 사이클 중 함께 나간 판: v1.20.1(아래 고침 둘), v1.20.3·v1.20.4(낱말 찾기 빠르게), 그 사이 v1.20.2(사이클 23 문턱 3)·v1.20.5(dev 24 대화를 가리키는 말)

## 수용 기준 결과

| AC | 결과 | 근거 |
|---|---|---|
| AC-1 같은 책 네 곳 같은 요약 | 통과 | 「달러구트 꿈 백화점」(1172): 추천목록 진열·책첵 추천·AI 검색 카드·책 상세 글자까지 같음. 진열 6권, AI 카드 5권도 같음 (운영) |
| AC-2·3 책 상세 표지·요약, 없는 책 | 통과 | `BookSearchTests`, vitest 책 상세 네 상태, 운영 「불편한 편의점」 |
| AC-4 옮긴 뒤 수 | 통과 | 운영: 요약 69,188 = 69,188(글자까지), 표지 80,091 = 80,091, 꼬리표 0 = 0, 사전 0 = 0, 찾기 76,759 = 76,759 |
| AC-5 다른 가져오기 번호 파일 거절 | 통과 | `BookTextsImportTests` (다른 `export_id` 거절 → `force`로 넣음) |
| AC-6 합쳐진 책 설명 정리 | 통과 (시험) | `CatalogSwapDescriptionsTests`. 복사본 다시 가져오기는 같은 사본이라 지운 줄 0, swap 1.06초. 번호가 실제로 바뀌는 가져오기의 지운 수는 다음 가져오기 때 운영에서 처음 보임 |
| AC-7 AI 검색 첫 글 시간 | 통과 (v1.20.1 뒤) | v1.20.0 직후는 같았으나 15~25분 뒤 느린 10%가 5.2~5.8초로 늘었음. 원인은 배포 1이 아니라 v1.19.0에도 있던 JDBC 일반 계획(아래). v1.20.1 뒤 첫 글 중간 2.10~2.30초, 느린 10% 2.76~3.05초 |
| AC-8 옛 표·API를 읽지 않음 | 통과 | 배포 2에서 표·코드 모두 지움, `ModularityTests`, `BookDescriptionSchemaTests.theOldTablesAreDropped` |
| AC-9 추천목록 줄 표지 차례 | 통과 | `BookTextsTests`·`PicksCacheTests`. 운영 KAIST 표지 4,548개 모두 CloudFront |
| AC-10 CloudFront 표지가 CSP 아래 보임 | 통과 | 운영 CSP `img-src … https://d1bdzw8sfjph5d.cloudfront.net`, 그림 오류 없음 |
| AC-11 S3 그림 수 | 통과 | S3 1,130,143 ≥ 서로 다른 그림 1,128,687, 빠진 것 0 |
| AC-12 사본 표 없앤 뒤 AI 후보 같음 | 통과, 제목 87권 다름 | 낱말·벡터 후보는 같음. 카드 제목 출처가 `catalog.book.title`로 바뀌어 76,759권 중 87권(0.11%)에 판 표시가 붙음(「토지」 → 「토지. 1(1부 1권)」). 사용자 "그대로 두자" (2026-10-29) [확정] |

## 계획대로 된 것

- 모듈: 책 설명(요약·판 표지·프로필·AI 찾기·꼬리표와 사전)을 `catalog`가 맡음. 다른 모듈은 공개 API로만 읽음 (ADR-0161)
  - 읽기 API: `BookTexts`, `CoverUrls`, `BookProfiles`, `AiSearchIndex`
  - 쓰기 API: `BookTextsTransfer`
  - 구현 위치: `catalog/internal/texts/`
- 표: `catalog/002-book-descriptions.yaml`이 새 표 여섯을 만들고 한 번 복사함. `collection/007`이 `description_deleted_count`를 더함. 배포 2에서 `foryou/002`·`picks/007`·`aisearch/005`로 옛 표를 지움 (ADR-0166)
- 다시 가져오기 정리 (ADR-0162)
  - `JdbcCatalogLoad.swap` 같은 트랜잭션에서 다섯 표의 버려진 번호를 DELETE. 시험 DB 134만 줄 기준 0.6초
  - 인계서 함정 0-1도 고침: `createIndexesAndConstraints`에 `t.relname = ANY(TABLES)`
- 가져오기 번호 검사: `book-texts`·새 `book-profiles` 모드가 첫 줄 `# export_id=`를 확인함 (ADR-0162)
- 표지: S3(시드니, 비공개) + CloudFront(기본 도메인, OAC). PC는 PutObject·ListBucket만 가진 IAM 사용자로 올림. 관리 작업은 사용자 콘솔 로그인(`aws login`)의 단기 자격으로 했고, 오래 가는 관리자 키는 만들지 않음 (ADR-0163)
- 추천목록 줄 표지 차례: 그 판 → 같은 작품 다른 판(최신 → 소장 많은 판) → 목록 그림 (ADR-0164)
- AI 검색 사본 표 `aisearch.search_book`을 없애고 프로필을 DB로 옮김. `library_ids`만 예외로 `catalog.book_search`에 둠 (ADR-0165, 예외 ADR-0160)
- 화면: 책 상세에 표지와 「AI 요약 ⓘ」 + 요약 전체(flow S2). 검색 결과 줄은 그대로
- 배포 1 전에 추천목록 책 783권 요약을 채움: 774권 만듦, 9권 못 만듦. 요약이 보이는 줄은 2,793줄 중 1,946줄이고, 빠진 847줄은 책 번호 없는 838줄과 9권의 줄

## 달라진 것과 이유

### 인계서와 다르게 dev가 정한 것

| 바뀐 것 | 인계서·설계 | 이유 |
|---|---|---|
| `book_summary.summary`를 `COLLATE "C"`로, `book_search`의 bigm 색인은 복사 뒤에 만듦 | 칸 정렬 규칙 없음, 색인을 먼저 만듦 | 연습에서 `ANALYZE catalog.book_summary`가 388초 걸려 서버가 뜨지 않음(한글 요약을 DB 기본 정렬 규칙으로 통계). 고친 뒤 복사 4.2초, 운영 7.7초. 사람에게 정렬해 보이지 않는 칸이라 영향 없음 (dev 기록) |
| 여섯 표 모두 `book_id >= 1` CHECK, `book_profile.genres`·`forms`는 `NOT NULL DEFAULT '{}'` | 값 없음 | 옛 `search_book`과 같게, 파일의 빈 칸 = 빈 목록 [이유 미확인: dev가 적은 이유] |
| `listCoverUrls(Collection<Long> bookIds) → Map<bookId, 주소>` | `Map<listRowKey, bookId>`를 받음 | 줄마다 다른 것은 책 번호뿐이라 picks가 줄 → 책 번호로 찾음 (dev 기록) |
| `SearchText`를 `catalog` 공개 클래스로 옮기고, aisearch에는 넘겨주기만 하는 얇은 이름을 남김 | aisearch 안쪽 | `search_text`를 이제 `catalog`가 만들어서 낱말 규칙을 한 곳에 둠 (dev 기록) |
| `AiSearchIndex.find`는 정리된 낱말을 받음. 낱말 고르기(`usableKeywords`, 8개)는 aisearch에 남음 | 질의만 옮김 | 같음 |
| 사서추천 줄 표지도 같은 규칙(CloudFront `sha1(source_url)`)으로 보이고, `/api/v1/picks/covers/{id}`는 배포 2에서 지움 | 같음 | `picks.cover.source_url` = `cover_source`라 1단계에서 올린 그림과 이름이 같음 |
| `description_deleted_count`는 성공한 가져오기에만 적고, 실패한 가져오기와 내보내기는 NULL | 값 없음 | [이유 미확인] |
| `MlFirstCall`은 `catalog.book_profile`이 비면 모델 폴더의 `book-profiles.tsv`를 읽음 | 표에서만 | 배포 1~12단계 사이에 ML 1차 호출이 꺼지면 AC-7 비교가 흐려져서 (dev 기록). **배포 2 뒤에도 코드가 남아 있음**(`MlFirstCall.java` 121행), 아래 "사용자에게 확인할 것" #1 |
| `aisearch → foryou` 의존이 남음 | 인계서 "foryou 의존 없앰" | `BookNeighbours`(이어 묻는 질문의 이웃 후보)를 아직 씀. 표지·요약 의존만 없어짐 |
| 웹 빌드 설정 `VITE_COVERS_BASE_URL`. 값이 없으면 `https://d1bdzw8sfjph5d.cloudfront.net` | 이름 없음 | [안] dev가 정함 |
| 「AI 요약 ⓘ」 조각을 책 창과 책 상세가 함께 씀 (`features/picks/AiSummary.tsx`) | 같은 문구 | [안] dev가 정함 |
| 책 상세 출판일을 통째로 다음 줄로 넘김 | — | 실제 폰에서 표지 옆이 좁아져 "2021-" / "05-06"으로 끊긴 것을 고침 (배포 1 전) |
| 남긴 칸: `picks.fetch_run.cover_fetched_count`·`cover_failed_count` (기본 0) | 배포 2에서 그림 받기를 지움 | 지우려면 새 changeset이 필요해서 남김 |

### 사이클 중 생겨 운영에 넣은 것 (설계에 없음)

| 무엇 | 판 | 왜 |
|---|---|---|
| 낱말 찾기 질의를 `SET LOCAL plan_cache_mode = force_custom_plan` 안에서 돌림(`JdbcAiSearchIndex.find`) | v1.20.1 | 같은 SQL이 한 연결에서 5번을 넘으면 pgjdbc가 서버 준비문을 쓰고, PostgreSQL이 일반 계획으로 바꿔 여러 낱말 질문이 3~5초가 됨. 옛 표에도 있던 문제(0.44 / 11.1초). 배포 1 회귀가 아님 |
| 프로필 빈 칸 NULL → `""` (`aisearch BookProfiles.of`) | v1.20.1 | 12단계 사고(아래) |
| `catalog/003-intarray`(intarray 확장, 따로 된 스키마), `catalog/004-plan-library-count`(PL/pgSQL 함수, COST 1000), 점수는 strpos | v1.20.3 | 사용자 "여러 경우의 수에서 테스트 … 최적의 결과물을 운영에 반영해줘". 질의 9판 × 낱말 6 × 계획 도서관 3~4가지로 재고, 답이 같은지 md5로 확인 |
| 한 낱말이거나 계획 도서관 500곳 이하면 함수, 아니면 SubPlan | v1.20.4 | v1.20.3이 1,000곳 이상 여러 낱말 6경우에서 11~42ms 느려짐. 운영 24경우 합 V0 2,773 → V8 2,006ms, 느려진 경우 0. 500은 200과 1,000 사이 [안] |

### 운영에서 생긴 일

- **12단계 사고 (09:06~09:12, 약 6분 동안 AI 검색이 모두 `internal_error`)**
  - 원인: 표는 빈 칸을 NULL로 두고 파일은 `""`로 읽는데, 서가 맞추기(`Shelves`)가 그 글을 그대로 비교해 NullPointerException이 남
  - 왜 시험이 못 잡았나: 표 읽기와 서가 맞추기를 따로만 시험함
  - 되돌림: 사용자 "표 비우기 먼저" → 표를 비우고 재시작하니 파일로 읽음
  - 고침: v1.20.1 + 시험 `FirstCallTests.profilesFromTheTableMatchShelvesLikeTheFile`. 09:26 다시 넣음
- 첫 `aws s3 sync`를 Git Bash에서 돌리니 13분 넘게 0장이었음. PowerShell에서 다시 돌림(원인은 못 봄). 표지 올리기 절차 dev `docs/maintenance/8-covers.md`

## 새로 알게 된 제약

- `catalog.book` 868MB(인덱스 포함)는 운영 메모리(2GB, 백엔드 약 650MB)에 다 남기 어려움. 그래서 캐시가 빈 상태 기준으로 비교함: 이어 읽기 230ms ↔ 사본 106ms → ADR-0160 예외의 근거
- 한글 `text` 칸을 기본 정렬 규칙으로 ANALYZE하면 아주 느림(68,414줄 388초). 사람에게 정렬해 보이지 않는 긴 글 칸은 `COLLATE "C"`로 둠 (aisearch-004와 같은 이유)
- pgjdbc `prepareThreshold`(5) + `plan_cache_mode=auto`: 낱말 수마다 같은 SQL 글이 쌓이면 일반 계획으로 바뀌고, LIKE·`&&` 기본 선택도(0.005·0.01) 때문에 줄 수를 8줄로 잘못 셈(실제 16,418줄). 다른 동적 검색 질의에도 같은 위험이 있음 — 해설 dev `docs/cycle26-book-descriptions/3-postgres-generic-plan.md`
- 운영에 넣는 데이터가 읽는 길을 바꾸면(파일 → 표), 넣고 재시작한 뒤 그 기능을 한 번 실제로 불러야 끝으로 봄 (dev 기록 5절)
- 비용
  - 표지 PUT 약 113만 건 + 8만 건: 시드니 $0.0055/1,000건 → 약 $6.7 [추론]
  - 저장 약 13GB → 월 약 $0.3 [추론]
  - CloudFront는 월 1TB까지 무료 (research.md §1)
- 새 표 여섯 136MB(복사본) ↔ 옛 표 154MB. 표지 줄이 113만 줄로 늘어 `book_cover`만 136MB

## 다른 사이클·백로그에 넘긴 것

- 사이클 23 AC-5: dev가 "문턱 3"(계획 도서관 3곳 이상이거나, 계획 도서관 중 구독형·대여형이 가진 책을 앞에)을 v1.20.2로 넣음 (사용자 "문턱 3으로", 2026-10-29). 1~2곳 책은 빠지지 않고 뒤로 감 → 사이클 23 회고에서 AC-5를 고칠 것
- 같은 작품 판정이 세 곳에 따로 있음: PC `foryou_neighbours.py` `same_work`, 서버 `JdbcBookCards.workKeys`(= `listCoverUrls`), AI 검색 `NamedBook`. dev 제안은 `catalog` 가져오기 때 작품 번호 칸을 두는 것 → 백로그 (plan이 정할 것: 칸 위치, 기준 규칙, 다시 가져오기 때 계산 차례)
- AI 검색 대화 점검의 남은 결정 4개(세션당 질문 수 N, 마지막 정리, 책 밖 말 첫 글 시간, 1차 「대화」 갈래) → 백로그 (사이클 24 쪽)

## 사용자에게 확인할 것

1. **프로필 파일 대체 읽기 남은 것** (ADR-0165): 표가 비면 `book-profiles.tsv`를 읽는 코드(`MlFirstCall`)가 배포 2 뒤에도 남아 있음. 지금 운영 표는 77,551줄이라 쓰이지 않음. [안] dev 다음 작은 고침에서 지움 — 표가 비면 ML 1차 호출이 꺼지고 Haiku로 감(로그 경고). 다른 안: 비상용으로 그대로 둠(파일과 표, 두 곳을 맞춰 둬야 함)
