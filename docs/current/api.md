# API 목록 (현재)

현재 설계 전체를 적은 문서입니다. 요청·응답 예시는 사이클 01 `docs/cycles/01-ebook-availability-search/design-delta.md`와 사이클 02 `docs/cycles/02-library-expansion/design-delta.md`에 있습니다.

마지막 반영: 사이클 02 cycle-close (2026-09-28). 사이클 01 부분은 dev 코드와 대조했고(2026-09-27), 사이클 02 변경은 **설계됨(미구현)** 입니다.

## 공통 규칙 (ADR-0008)

- 성공 응답은 감싸지 않고 결과를 그대로 돌려줍니다. 필드 이름은 camelCase.
- 오류는 RFC 9457 Problem Details (`application/problem+json`) + 확장 멤버 `code`(snake_case), 필요하면 `errors`.
- `type`이 `about:blank`이면 응답에서 생략됩니다(Spring Framework 7 동작, RFC 9457상 같은 뜻). 422의 `title`은 "Unprocessable Content"입니다.
- 공개 API는 모두 인증 없는 GET입니다. 스트림은 `fetch`로 읽고, 검증 오류는 스트림을 열기 전에 ProblemDetail로 돌려줍니다.

| 메서드 | 경로 | 모듈 | 설명 | 상태 |
|---|---|---|---|---|
| GET | `/api/v1/regions` | `region` | 사용 중인 시도·시군구 트리 | 구현됨 |
| GET | `/api/v1/regions/resolutions?ids=` | `region` | 저장된 지역 ID를 `ACTIVE / REPLACED / SPLIT / UNKNOWN`으로 해석 (최대 20개) | 구현됨 |
| GET | `/api/v1/ebook-searches/stream?q=&residenceRegionIds=&workRegionIds=&filter=` | `availability` | 조회 계획 + 첫 묶음 (SSE, ADR-0014): `targets`(전체 계획, 순서대로) → `library-requested` / `library-result` / `library-failed` … → `batch-done` → `row-verdict` … → `done`. `filter=all\|available`. 도서관마다 10줄, 셈한 줄이 20을 넘으면 새 조회 중단, 묶음 8초, 상세 판정 30초. 지역 ID는 쉼표 구분, 필드당 최대 20개 | 사이클 01 구현됨(`targets` → `library-result`/`library-failed` → `done`, 전체 8초) → 사이클 02 변경 설계됨(미구현) |
| GET | `/api/v1/ebook-searches/batches/stream?q=&filter=&batchNo=&candidates=libraryId:page,…` | `availability` | 다음 묶음 (SSE). 브라우저가 계획에서 고른 후보(최대 K개 [안] 50)만 조회. 이벤트는 위에서 `targets`를 뺀 것 | 설계됨(미구현) |
| GET | `/api/v1/availability/libraries/{libraryId}/ebooks?q=&page=` | `availability` | 도서관 하나의 한 페이지 (도서관별 더 보기). 판정이 나중에 정해지는 줄은 판정을 읽은 뒤(최대 30초) 응답 [안] | 구현됨 (응답 필드 추가는 설계됨) |
| POST | 조회 서비스 `/v1/fetches` (내부) | 조회 서비스 | URL 한 개를 GET으로 가져와 `{outcome, status, contentType, location, body(base64), startedAt, endedAt}`. 조회 서버 자신이 정상이면 항상 200 (ADR-0015) | 설계됨(미구현) |

- 경로·이벤트·필드의 새 이름은 [안]입니다.

## 검색 방식 (ADR-0009)

- 모든 사이트를 **제목 필드**로 검색합니다(교보 `schClst=ctts`, YES24 `srch_order=title`, 사이클 02 화면 종류는 각 adapter). 부분 일치입니다.
- YES24는 `sort=title`로 부릅니다. `sort=now`는 "지금 빌릴 수 있는 책만" 거르는 필터라서 쓰지 않습니다.
- EUC-KR 사이트(YES24 한 세대 전, 강남구)는 검색어를 EUC-KR로 보냅니다 (설계됨).
- 저자·출판사 검색용 `field` 파라미터는 아직 없습니다.

## 페이지 객체 (`library-result`와 도서관별 더 보기 응답)

사이클 01 필드(`libraryId`, `query`, `page`, `totalCount`, `hasMore`, `fetchedAt`, `cached`, `cacheAgeSeconds`, `loanRate`, `librarySearchUrl`, `items[]`의 `rank`·`title`·`author`·`publisher`·`supplier`·`holdings`·`loaned`·`reservations`·`available`·`detailUrl`)에 사이클 02에서 더하는 것 (설계됨):

| 필드 | 뜻 |
|---|---|
| `pageSize` | 10 |
| `items[].availability` | `AVAILABLE \| RESERVABLE \| PENDING \| UNKNOWN`. 서버가 판정 (ADR-0019) |
| `items[].availabilityBasis` | `COUNT \| SITE_LIST \| SITE_DETAIL \| LOANED_ZERO \| SUBSCRIPTION` [안] |
| `items[].titleKey` | 제목 비교 키. 프론트는 같은지만 비교 (ADR-0018) |

- 수량이 없는 화면(통합 포털, 교보 구독형)은 `holdings`, `available`, `loanRate`가 null입니다.
- 프론트는 `detailUrl`이 없으면 `librarySearchUrl`을 엽니다.

## 오류 코드

| code | HTTP | 어디서 |
|---|---|---|
| `validation_error` | 400 | 지역 해석 API, 스트림의 지역 파라미터(숫자 아님, 20개 초과), 다음 묶음의 `candidates`(설계됨). `errors[].code`: `required`, `invalid_format`, `too_many`, `duplicate`(설계됨) |
| `invalid_query` | 400 | 스트림(시작 전), 더 보기 — 정규화 후 2글자 미만 또는 50자 초과 |
| `invalid_page` | 400 | 더 보기 |
| `invalid_region` | 422 | 스트림(시작 전) — `errors[].code`: `abolished`, `not_found`, `not_sigungu` |
| `library_not_found` | 404 | 더 보기 — 없거나 꺼진 도서관. 다음 묶음에서는 그 도서관만 `library-failed` (설계됨) |
| `upstream_error` | 502 | 더 보기, 스트림의 `library-failed` — 도서관 오류 응답, 3xx, 파싱 실패 |
| `upstream_timeout` | 504 | 더 보기, 스트림의 `library-failed` — 8초 초과 |
| `not_found` | 404 | 없는 경로 (Spring 기본 예외) |
| `bad_request` | 400 | 형식이 틀린 요청 (Spring 기본 예외) |
| `method_not_allowed` | 405 | 지원하지 않는 메서드 |
| `not_acceptable` | 406 | 줄 수 없는 `Accept` |
| `unsupported_media_type` | 415 | 지원하지 않는 요청 본문 형식 |
| `request_error` | 그 밖의 4xx | 위에 없는 Spring 기본 예외 |
| `internal_error` | 5xx | 예상하지 못한 서버 오류(500)와 모듈이 `code`를 붙이지 않은 5xx |

`not_found`부터 7개는 dev `ApiExceptionHandler`가 붙입니다. 모듈이 `code`를 붙이지 않은 오류에만 HTTP 상태로 골라 붙입니다(2026-09-27 코드 확인).
