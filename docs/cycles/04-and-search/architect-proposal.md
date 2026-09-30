# architect 제안: 사이클 04 AND 검색

- 작성: 2026-09-30, `architect` 서브에이전트 (읽기 전용). 사용자 선택 전 제안이며, 선택 결과는 `design-delta.md`와 ADR에 기록합니다.
- 읽은 것: 이 폴더 `scope.md`·`spec.md`·`flow.md`, `docs/current/*`, ADR-0014·0016·0019·0021, research `search-and-normalization.md`·`same-book-isbn.md`·`catalog-refresh.md`, dev `CLAUDE.md`·스킬 4개, dev 코드(`PlatformAdapter`, `BatchRunner`, `LibraryPageFetcher`, `DetailLookupResolver`, `AvailabilityResolver`, `LibraryPage`, `EbookSearchStreamController`, `LibraryCatalog`, `SearchTarget`, web `searchPlan.ts`)

## 코드에서 확인한 제약

- `BatchRunner`의 후보는 `(SearchTarget, page)`이고 가져오는 것은 검색 페이지뿐입니다.
- 웹 `PlanState`는 `libraryId`를 키로 씁니다. "같은 도서관 × 여러 책" 줄을 담을 수 없습니다.
- 책·소장 테이블과 pg_bigm 확장은 아직 없습니다.

## 결정 1: 수집 목록을 어느 모듈이 가지나

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| **A 새 모듈 `catalog`** (추천) | 스키마 `catalog`, 책 검색 API. 의존 `catalog → library`, `availability → catalog, library` (순환 없음) | 저장 목록과 실시간 조회의 책임이 나뉨. 주기 갱신 사이클이 이 모듈 안에서 끝남. 나중에 분리할 때 그대로 떼어 냄 | 모듈 하나·공개 API가 늘어남 |
| B `availability` 안 | | 경계를 새로 만들지 않음 | 테이블 없던 모듈이 350만 행과 갱신 배치까지 떠안음 |
| C `library` 안 | 소장 = 도서관 × 책 | | 기관 정보 모듈이 책 검색·정리 규칙까지 맡음 |

## 결정 2: 책마다 실시간 상태를 만드는 방식

- 2-1 상세 페이지 읽기 위치
  - **A `PlatformAdapter`에 `parseDetail`** (추천): 지금의 포털 상세 판정도 흡수. 화면 종류 지식이 한 클래스에 (ADR-0016)
  - B 화면 종류마다 별도 `DetailPageReader` 7개: 검색 adapter를 안 건드리지만 클래스가 두 배
- 2-2 묶음 실행과 스트림
  - **A `BatchRunner`의 가져오기 대상을 일반화(`LookupTask`: 검색 페이지 / 상세 페이지)** (추천): 병렬 수, 바쁜 호스트 건너뛰기, 20줄, 8초, 캐시·throttle을 한곳에서 지킴. 상세 조회라 PENDING 없음. `DetailVerdictCache`를 수량까지 담게 넓힘
  - B 상세 조회 전용 실행기 새로: 호출 예의 코드가 두 벌

## 결정 3: API 모양

- **A 책 검색 JSON + 소장 단위 스트림** (추천): `GET /api/v1/books`로 책 목록 → 바로 보기는 `GET /api/v1/book-availabilities/stream?bookIds=`. S3·책 먼저 고르기도 같은 두 API. 서버 상태 없음(ADR-0014). 단점: 바로 보기는 요청 둘, 책 쪽을 넘길 때 스트림을 다시 엶
- B 기존 `ebook-searches/stream?…&source=catalog` 하나로: 첫 화면 왕복 하나 줄지만 책 먼저 고르기엔 JSON API가 따로 필요하고 스트림 계약이 두 뜻을 가짐

## 결정 4: 한 번 가져오기 도구 위치

- **A dev backend `catalog` 모듈 안 Java importer** (추천): 프로필 `catalog-import`로 실행 후 종료, SQLite는 JDBC, PostgreSQL은 `COPY`. **검색어 정리와 저장값 정리가 같은 코드**. 갱신 사이클이 재사용. 단점: `sqlite-jdbc` 의존성, 국가서지 TTL(7.7GB) 읽기를 Java로
- B `chaekcheck-data` Python이 정리한 CSV → `COPY`: 빨리 만들지만 정리 규칙이 Python·Java 두 벌
- C Liquibase `loadData`: 280만 행을 changelog에 넣음. 채택하지 않기를 권함

## 결정 5: 저자 검색 구조

- **A `book_contributor` 테이블 (책 × 사람 × 역할)** (추천): 단어 AND를 한 사람 이름 안에서 판단, "사람 이름 하나와 같음" 완전 일치를 그대로 표현. 이 구조의 속도는 [확인 필요]
- B `book`에 역할 무리별 칸 + 칸마다 GIN: 측정한 구조와 같고 빠르지만, 다른 사람 이름에 걸친 단어도 맞고 완전 일치에 칸이 더 필요

## 선택지가 사실상 없는 것 [안]

- `library` 공개 API: `planSearch`가 `PlanOptions(scope, visit)`를 받게 넓힘(지금 `availability` 안의 `LibraryScope`·`VisitFilter`를 옮김). 가져오기 대조용 목록 조회 추가
- 가입 무리 순위는 `catalog`가 `SearchTarget`에서 계산. 소장은 `library_id IN (:ids)`로만 거름 (모듈 간 JOIN 없음)
- 가져오기 범위: `removed_at IS NULL`, 전자책, 서비스 `library`와 id·`base_url`이 같은 도서관
- 스트림 이벤트: `holding-requested` / `holding-result` / `holding-failed` (키 `holdingId`, `bookId`, `libraryId`, 기존 `Item` 모양). `targets`에 `libraries[]`와 `holdings[]`. `row-verdict`는 쓰지 않음
- 계획 순서: 책은 결과 순서, 한 책 안에서는 `planSearch` 순서(ADR-0027)
- 상세 페이지 주소 안전장치: http(s)이고 호스트가 그 도서관 `base_url` 호스트와 같을 때만 요청
- `BookKeyNormalizer`(ADR-0018, NFC)는 그대로. `catalog` 정리(NFKC)와 합치기는 backlog
- 직접 찾기 API 그대로. 웹 주소는 여러 조건을 허용하고 직접 찾기일 때만 첫 칸 → ADR-0025 웹 주소 규칙을 바꾸는 새 ADR 필요

## 모듈·데이터·API 초안 (추천안 기준, 이름 모두 [안])

- `catalog` 공개 Java API `CatalogHoldings.holdingsOf(bookIds)`, `holding(holdingId)` → `HoldingRef(holdingId, bookId, libraryId, detailUrl)`. REST `/books`, `/books/{id}`
- 테이블
  - `book`: `id`, 표시용 `title`·`author_display`·`publisher`, 정리값 `title_norm`·`main_title_norm`·`publisher_norm`, `published_on`(대표), `isbn13` UNIQUE NULL, `created_at`. GIN bigm `title_norm`·`publisher_norm`, B-tree `COLLATE "C"` 완전 일치용, `(published_on DESC NULLS LAST, id)`와 `(published_on ASC NULLS LAST, id)`
  - `book_contributor`: `book_id` FK, `name`, `name_norm`, `name_exact`, `role` CHECK IN (`AUTHOR`,`TRANSLATOR`,`ILLUSTRATOR`,`EDITOR`,`OTHER`,`UNKNOWN`), `position`. GIN bigm `name_norm`, B-tree `name_exact COLLATE "C"`
  - `holding`: `book_id` FK, `library_id`(ID만), `platform`, `item_key`, 원문들, `detail_url` NOT NULL, `first_seen_at`. UNIQUE `(library_id, item_key)`
  - `catalog_import`: `source`, `source_as_of`, `imported_at`, 건수
  - Liquibase `catalog/001-catalog-schema.yaml`, `CREATE EXTENSION IF NOT EXISTS pg_bigm`
- API
  - `GET /api/v1/books?title=&author=&publisher=&exact=title,author&roles=translator,illustrator,editor&sort=default|newest|oldest&residenceRegionIds=&workRegionIds=&scope=&visit=&page=&pageSize=` → `items[]{id,title,authorDisplay,publisher,publishedOn,holdingLibraryCount,joinTier}`, `page`, `pageSize`, `totalCount`, `hasMore`, `catalogAsOf`
  - `GET /api/v1/books/{bookId}` (없으면 404 `book_not_found`)
  - `GET /api/v1/book-availabilities/stream?bookIds=&…` (최대 개수 [안], 넘으면 `too_many`), `…/batches/stream?candidates=holdingId,…` (K=50)
- 웹: 주소 `view=list|books`, `direct=on`은 웹에만. `PlanState` 키를 `holdingId`로. S3 경로 `/books/{id}`

## 확인 필요 (architect가 찾은 것)

| 항목 | 방법 |
|---|---|
| AC-3 모순: 단어 AND에서 "행동 경제학"은 「경제학으로 본 행동」도 찾지만 "행동경제학"은 찾지 않음 → AC를 "'행동경제학' 결과 ⊂ '행동 경제학' 결과"로 고칠지 | 사용자에게 질문 |
| 여러 단어 중 1글자 단어("행동 의")의 pg_bigm 동작 | 공식 문서, 프로토타입 |
| 가입 무리 순위의 정확한 단계(방문 여부, 자격 미확인 위치) | 사용자에게 질문 |
| `scope=joinable`·`visit=none`일 때 맞는 도서관이 없는 책을 목록에서 뺄지 | 사용자에게 질문 |
| `book_contributor`와 기본 순서 집계의 2배 규모 속도, `totalCount` 비용 | 프로토타입 |
| 역할·파라미터·모듈·테이블 이름 | 사용자 승인 |
| dev·테스트 DB 이미지의 pg_bigm 설치, 운영 호스팅 지원 | 공식 문서, dev 확인 |
| 교보 구독형은 상세 요청 없이 `SUBSCRIPTION`으로 판정할지 | 사용자에게 질문 |
| 강남구 상세에서 본 책 블록만 읽기 | 호출 시험 |
| 저장된 `detail_url` 호스트가 서비스 `base_url` 호스트와 같은지 | 데이터 대조 |
| 국가서지 TTL 읽기 방식, 제목 다름 약 5% | 프로토타입, 표본 |
| 운영 DB로 옮기는 방법 | 사용자 결정 (배포 시) |
| `sqlite-jdbc` 버전·라이선스 | 공식 문서 (이번에 조회 안 함) |
| `catalogAsOf`를 가져오기 기준으로 할지, 도서관별 수집일로 할지 | 사용자에게 질문 |

## backlog 후보

- 가져오기에 `removed_at`·`crawl_run` 이력 보존 (주기 갱신), 도서관별 목록 기준일, `BookKeyNormalizer`와 `catalog` 정리 코드 합치기, `book_isbn`(책 하나에 ISBN 여러 개), 소장 도서관 id 배열 미리 계산, 쓰기·읽기 DB 분리
