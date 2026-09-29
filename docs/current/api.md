# API 목록 (현재)

현재 설계 전체를 적은 문서입니다. 요청·응답 예시는 사이클 01 `docs/cycles/01-ebook-availability-search/design-delta.md`와 사이클 02 `docs/cycles/02-library-expansion/design-delta.md`에 있습니다.

마지막 반영: 사이클 03 cycle-close (2026-09-29). 사이클 02까지는 dev 컨트롤러 코드와 대조했습니다(구현됨). **사이클 03 변경(검색어 `q` → `title`/`author`/`publisher` 중 하나, `targets`의 조건 칸, 포털 저자·출판사 검색)은 설계됨(미구현)** 입니다 (ADR-0025, ADR-0026). 요청·응답 예시는 `docs/cycles/03-search-conditions/design-delta.md`.

## 공통 규칙 (ADR-0008)

- 성공 응답은 감싸지 않고 결과를 그대로 돌려줍니다. 필드 이름은 camelCase.
- 오류는 RFC 9457 Problem Details (`application/problem+json`) + 확장 멤버 `code`(snake_case), 필요하면 `errors`.
- `type`이 `about:blank`이면 응답에서 생략됩니다(Spring Framework 7 동작, RFC 9457상 같은 뜻). 422의 `title`은 "Unprocessable Content"입니다.
- 공개 API는 모두 인증 없는 GET입니다. 스트림은 `fetch`로 읽고, 검증 오류는 스트림을 열기 전에 ProblemDetail로 돌려줍니다. 스트림 컨트롤러에는 `produces`를 걸지 않습니다.
- 응답 압축 설정은 없습니다.

| 메서드 | 경로 | 모듈 | 설명 |
|---|---|---|---|
| GET | `/api/v1/regions` | `region` | 사용 중인 시도·시군구 트리 |
| GET | `/api/v1/regions/resolutions?ids=` | `region` | 저장된 지역 ID를 `ACTIVE / REPLACED / SPLIT / UNKNOWN`으로 해석 (최대 20개) |
| GET | `/api/v1/ebook-searches/stream?{title\|author\|publisher}=&residenceRegionIds=&workRegionIds=&filter=&scope=` | `availability` | 조회 계획 + 첫 묶음 (SSE, ADR-0014). 이벤트: `targets`(전체 계획, 순서대로) → `library-requested` / `library-result` / `library-failed` … → `batch-done` → `row-verdict` … → `done`. `filter=all\|available`(없으면 all). `scope=all\|joinable`(없으면 all): `joinable`이면 가입이 확정된 도서관(`OPEN`/`ELIGIBLE`이고 `extraConditionText` 없음)만 계획에 남김 (C2-U-10). 지역 ID는 쉼표 구분, 필드당 최대 20개 |
| GET | `/api/v1/ebook-searches/batches/stream?{title\|author\|publisher}=&filter=&batchNo=&candidates=libraryId:page,…` | `availability` | 다음 묶음 (SSE). 브라우저가 계획에서 고른 후보(최대 K=50 [안])만 조회. 이벤트는 위에서 `targets`를 뺀 것. `batchNo`는 2 이상, 쪽 번호 최대 5자리. `scope`는 받지 않음(후보가 이미 계획에서 나옴) |
| GET | `/api/v1/availability/libraries/{libraryId}/ebooks?{title\|author\|publisher}=&page=` | `availability` | 도서관 하나의 한 페이지 (도서관별 더 보기). 판정이 나중에 정해지는 줄은 판정을 읽은 뒤(최대 30초) 응답. `page`가 없으면 1 |
| POST | 조회 서비스 `/v1/fetches` (내부) | 조회 서비스 | URL 한 개를 GET으로 가져와 `{outcome, status, contentType, location, body(base64), startedAt, endedAt}`. `outcome`: `RESPONDED \| TIMEOUT \| CONNECT_FAILED \| ERROR`. 조회 서버 자신이 정상이면 항상 200. 401 토큰 없음·틀림(헤더 `X-Fetch-Token` [안, 임시]), 400 잘못된 URL·사설 주소, 503 과부하·종료 중 (ADR-0015) |

## 검색 조건 파라미터 (ADR-0025) — 설계됨(미구현)

세 API는 검색어를 `q` 대신 `title` / `author` / `publisher` 중 **정확히 하나**로 받습니다. `q`는 없고, 웹도 옛 `?q=` 주소를 처리하지 않습니다(배포 전).

| 경우 | 응답 |
|---|---|
| 하나, 값 2~50자(정규화 후) | 정상. 그 필드로 검색 |
| 하나도 없음, 값이 비어 있음, `q`만 옴 | 400 `validation_error`, `errors[].code: required` [안] |
| 둘 이상 | 400 `validation_error`, `errors[].code: too_many` [안] |
| 같은 이름 두 번 | 400 `validation_error`, `errors[].code: duplicate` [안] |
| 값 1자, 51자 이상 | 400 `invalid_query` |

- 검증 순서 [안]: 조건 → `filter` → `scope` → 지역. 첫 오류 하나만 돌려줍니다.
- 웹 주소도 같은 이름을 씁니다: `/search?author=김달`. 조건이 둘 이상인 주소는 title → author → publisher 순서로 하나만 씁니다 [확정].

## 묶음 실행 규칙 (요약, 자세한 것은 사이클 02 design-delta)

- 계획 순서대로 시작, 동시 P=5 [안], 셈한 줄이 20을 넘으면 새 요청 중단 [확정], 검색 페이지는 묶음 시작부터 8초 [확정], 남은 시간 3초 미만이면 새 요청 안 함 [안]
- 같은 호스트가 바쁘면 그 후보를 건너뛰고 다음 후보 먼저 (ADR-0020)
- 셈하는 줄: `filter=all`은 판정이 정해진 모든 줄, `available`은 `AVAILABLE` 줄. `PENDING`은 세지 않음
- `batch-done`: `batchNo`, `requested`, `succeeded`, `failed`, `countedRows`, `pendingRows`, `stopReason`(`ROW_LIMIT \| CANDIDATES_EXHAUSTED \| LAUNCH_CUTOFF`)
- `row-verdict`: `batchNo`, `libraryId`, `page`, `rank`, `availability`, `availabilityBasis`. `batch-done` 뒤에 보냄

## `targets` 이벤트

`title` / `author` / `publisher` 중 요청과 같은 칸 하나(값은 검색어), `filter`, `scope`, `regionFilterApplied`, `libraries[]`. 사이클 02의 `query` 칸은 없어집니다 (ADR-0025, 설계됨(미구현)). 도서관 항목: `id`, `name`, `libraryType`, `platformType`, `priorityGroup`, `deferred`, `eligibility`, `eligibilitySummary`, `extraConditionText`, `visitRequired`, `joinMethod`, `joinUrl`, `joinCaution`, `joinNotice`, `homepageUrl`.

- 크기: 278곳 156,368바이트(gzip 했다면 16,271) (dev 측정, 2026-09-29)

## 검색 방식 (ADR-0009, ADR-0025, ADR-0026)

고른 조건을 사이트의 해당 칸으로 검색합니다. 제목은 구현됨, 저자·출판사는 설계됨(미구현, 사이클 03).

| 화면 종류 | 제목 | 저자 | 출판사 |
|---|---|---|---|
| `KYOBO_V1`, `KYOBO_SUBSCRIPTION_V1` | `schClst=ctts` | `schClst=autr` | `schClst=pbcm` |
| `YES24_V1`~`V3` | `srch_order=title` | `author` | `publisher` |
| `GANGNAM_V1` | `search=title` | `search=author` | `search=publisher` |
| `ELIB_PORTAL_V1` | 기본 검색(제목 전용 칸 없음) | `table.do?search_text={q}&author_name={q}` | `table.do?search_text={q}&book_pubname={q}` |

- 부분 일치입니다("김달" → "김달우"도). 포털 저자·출판사만 정확히 일치입니다 (ADR-0026).
- 포털 `search_type`의 AUTHOR/TITLE/PUBLER는 자료 종류라서 필드 검색에 쓰지 않습니다.
- YES24는 `sort=title`로 부릅니다. `sort=now`는 "지금 빌릴 수 있는 책만" 거르는 필터라서 쓰지 않습니다.
- EUC-KR 사이트(`YES24_V1`, `YES24_V3`, 강남구)는 검색어를 EUC-KR로 보냅니다.
- 캐시 키에 조건(필드)이 들어 있어 제목 "김달"과 저자 "김달"은 따로 캐시됩니다.
- 전주(`YES24_V1`)는 화면에 저자 이름을 표시하지 않아 결과 줄의 저자 칸이 비어 있습니다.

## 페이지 객체 (`library-result`와 도서관별 더 보기 응답)

`libraryId`, `query`, `page`, `pageSize`, `totalCount`, `hasMore`, `fetchedAt`, `cached`, `cacheAgeSeconds`, `loanRate`, `librarySearchUrl`, `items[]`.

`items[]`: `rank`, `title`, `author`, `publisher`, `supplier`, `holdings`, `loaned`, `reservations`, `available`, `titleKey`, `availability`, `availabilityBasis`, `detailUrl`.

| 필드 | 뜻 |
|---|---|
| `pageSize` | 10. 강남구는 20(사이트가 페이지 크기 파라미터를 무시) |
| `items[].availability` | `AVAILABLE \| RESERVABLE \| PENDING \| UNKNOWN`. 서버가 판정 (ADR-0019). `PENDING`은 스트림에만 |
| `items[].availabilityBasis` | `COUNT \| SITE_LIST \| SITE_DETAIL \| LOANED_ZERO \| SUBSCRIPTION` |
| `items[].titleKey` | 제목 비교 키: NFC → 공백 제거 → 소문자 → 문장부호·기호 제거. 괄호 부제·권차는 그대로 (ADR-0018) |

- 수량이 없는 화면(통합 포털, 교보 구독형)은 `holdings`, `available`, `loanRate`가 null입니다.
- 수량 칸이 있는 화면인데 사이트가 수량 대신 안내문을 보인 줄(강남구 "예약정원이 마감되었습니다.")은 `UNKNOWN`입니다.
- 프론트는 `detailUrl`이 없으면 `librarySearchUrl`을 엽니다. 링크는 http(s)만 씁니다.

## 오류 코드

| code | HTTP | 어디서 |
|---|---|---|
| `validation_error` | 400 | 지역 해석 API, 스트림의 지역 파라미터(숫자 아님, 20개 초과), `filter`·`scope` 값 오류, 다음 묶음의 `candidates`·`batchNo`, 세 API의 검색 조건 파라미터(없음·둘 이상, 사이클 03 설계됨). `errors[].code`: `required`, `invalid_format`, `too_many`, `duplicate` |
| `invalid_query` | 400 | 스트림(시작 전), 더 보기 — 정규화 후 2글자 미만 또는 50자 초과 |
| `invalid_page` | 400 | 더 보기 |
| `invalid_region` | 422 | 스트림(시작 전) — `errors[].code`: `abolished`, `not_found`, `not_sigungu` |
| `library_not_found` | 404 | 더 보기 — 없거나 꺼진 도서관. 다음 묶음에서는 그 도서관만 `library-failed` |
| `upstream_error` | 502 | 더 보기, 스트림의 `library-failed` — 도서관 오류 응답, 3xx, 파싱 실패, 모든 조회 서버가 쉼 |
| `upstream_timeout` | 504 | 더 보기, 스트림의 `library-failed` — 8초 초과, 조회 서버 읽기 시간 초과 |
| `not_found` | 404 | 없는 경로 (Spring 기본 예외) |
| `bad_request` | 400 | 형식이 틀린 요청 (Spring 기본 예외) |
| `method_not_allowed` | 405 | 지원하지 않는 메서드 |
| `not_acceptable` | 406 | 줄 수 없는 `Accept` |
| `unsupported_media_type` | 415 | 지원하지 않는 요청 본문 형식 |
| `request_error` | 그 밖의 4xx | 위에 없는 Spring 기본 예외 |
| `internal_error` | 5xx | 예상하지 못한 서버 오류(500)와 모듈이 `code`를 붙이지 않은 5xx |

`not_found`부터 7개는 dev `ApiExceptionHandler`가 붙입니다. 모듈이 `code`를 붙이지 않은 오류에만 HTTP 상태로 골라 붙입니다(2026-09-27 코드 확인).
