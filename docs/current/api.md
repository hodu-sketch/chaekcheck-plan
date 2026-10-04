# API 목록 (현재)

현재 설계 전체를 적은 문서입니다. 요청·응답 예시는 사이클 01 `docs/cycles/01-ebook-availability-search/design-delta.md`와 사이클 02 `docs/cycles/02-library-expansion/design-delta.md`에 있습니다.

사이클 05 cycle-close (2026-10-04): 로그인·계정 API를 더함 — 구현됨(사이클 05, 2026-10-04 retro 반영). 근거 `docs/cycles/05-login-account/design-delta.md`.

마지막 반영: 사이클 04 회고 (2026-10-01). 모두 dev 컨트롤러 코드(커밋 `c6028c9`)와 대조했습니다(구현됨). 책 검색·소장 스트림의 요청·응답 예시는 `docs/cycles/04-and-search/design-delta.md`, 개발 중 바뀐 것은 같은 폴더 `retro.md`. 사이클 03 예시는 `docs/cycles/03-search-conditions/design-delta.md`.

## 공통 규칙 (ADR-0008)

- 성공 응답은 감싸지 않고 결과를 그대로 돌려줍니다. 필드 이름은 camelCase.
- 오류는 RFC 9457 Problem Details (`application/problem+json`) + 확장 멤버 `code`(snake_case), 필요하면 `errors`.
- `type`이 `about:blank`이면 응답에서 생략됩니다(Spring Framework 7 동작, RFC 9457상 같은 뜻). 422의 `title`은 "Unprocessable Content"입니다.
- 검색·조회 API(아래 첫 표)는 모두 인증 없는 GET입니다. 로그인·계정 API(`/api/v1/auth/**`, `/api/v1/me`)는 따로 표에 있습니다(구현됨(사이클 05, 2026-10-04 retro 반영)). 스트림은 `fetch`로 읽고, 검증 오류는 스트림을 열기 전에 ProblemDetail로 돌려줍니다. 스트림 컨트롤러에는 `produces`를 걸지 않습니다.
- 응답 압축 설정은 없습니다.

| 메서드 | 경로 | 모듈 | 설명 |
|---|---|---|---|
| GET | `/api/v1/regions` | `region` | 사용 중인 시도·시군구 트리 |
| GET | `/api/v1/regions/resolutions?ids=` | `region` | 저장된 지역 ID를 `ACTIVE / REPLACED / SPLIT / UNKNOWN`으로 해석 (최대 20개) |
| GET | `/api/v1/ebook-searches/stream?{title\|author\|publisher}=&residenceRegionIds=&workRegionIds=&filter=&scope=&visit=` | `availability` | 조회 계획 + 첫 묶음 (SSE, ADR-0014). 이벤트: `targets`(전체 계획, 순서대로) → `library-requested` / `library-result` / `library-failed` … → `batch-done` → `row-verdict` … → `done`. `filter=all\|available`(없으면 all). `scope=all\|joinable`(없으면 all): `joinable`이면 가입이 확정된 도서관(`OPEN`/`ELIGIBLE`)만 계획에 남김 (C2-U-10). 추가 문구(`extraConditionText`, 예: 책이음)는 참고 글일 뿐 판정·범위에 영향 없음 (C3-U-2). `visit=any\|none`(없으면 any): `none`이면 방문 가입 도서관(`visitRequired`)을 계획에서 빼서 요청하지 않음 (C3-U-1, ADR-0027). `any`일 때 계획 순서는 ADR-0027(가입 가능한 방문 가입 도서관은 방문 없는 가입 가능 도서관 모두 뒤). 지역 ID는 쉼표 구분, 필드당 최대 20개 |
| GET | `/api/v1/ebook-searches/batches/stream?{title\|author\|publisher}=&filter=&batchNo=&candidates=libraryId:page,…` | `availability` | 다음 묶음 (SSE). 브라우저가 계획에서 고른 후보(최대 K=50 [안])만 조회. 이벤트는 위에서 `targets`를 뺀 것. `batchNo`는 2 이상, 쪽 번호 최대 5자리. `scope`·`visit`는 받지 않음(후보가 이미 계획에서 나옴) |
| GET | `/api/v1/availability/libraries/{libraryId}/ebooks?{title\|author\|publisher}=&page=` | `availability` | 도서관 하나의 한 페이지 (도서관별 더 보기). 판정이 나중에 정해지는 줄은 판정을 읽은 뒤(최대 30초) 응답. `page`가 없으면 1 |
| GET | `/api/v1/books?title=&author=&publisher=&exact=&roles=&sort=&residenceRegionIds=&workRegionIds=&scope=&visit=&page=&pageSize=` | `catalog` | 수집 목록 책 검색 (도서관 요청 없음). 채운 칸끼리 AND, 칸 안은 띄어쓰기로 나눈 단어 AND(정리값 비교), `exact`(title,author,publisher), `roles`(translator,illustrator,editor), `sort`(default\|newest\|oldest). `pageSize` 1~20(기본 20), `page` 1 이상. 검증 순서 조건 칸 → `exact`·`roles`·`sort` → `scope`·`visit` → `page`·`pageSize` → 지역. `errors[].code`: `required`, `duplicate`, `invalid_format`, 지역 `too_many`, 칸 길이는 `invalid_query`. 채우지 않은 칸의 `exact`와 저자 칸 없는 `roles`는 무시(오류 아님, dev 결정). 응답: 페이지 객체 + `collectedFrom`·`collectedTo`(결과 전체의 책을 가진 계획 도서관 기준, 한국 날짜). 계획 도서관이 없는 책은 뺌. 검색어의 `%`·`_`는 이스케이프. 구현됨 |
| GET | `/api/v1/books/{bookId}` | `catalog` | 책 하나(S3): 대표 서지, `holdingLibraryCount`(범위·방문 반영), `libraries[]{libraryId, collectedAt(+09:00)}`. 없는 책·숫자가 아닌 id 404 `book_not_found`. 구현됨 |
| GET | `/api/v1/book-availabilities/stream?bookIds=&residenceRegionIds=&workRegionIds=&filter=&scope=&visit=` | `availability` | 책을 가진 계획 도서관의 상세 페이지를 읽는 소장 단위 스트림. `bookIds` 최대 20 [안]. 검증 순서 `bookIds` → `filter` → `scope` → `visit` → 지역, id 목록 오류 `required`/`invalid_format`/`duplicate`/`too_many`. 이벤트 `targets`(`libraries[]`는 계획 전체가 아니라 **소장이 있는 계획 도서관만**(dev 결정), `holdings[]{holdingId, bookId, libraryId}`는 `bookIds` 순서·한 책 안은 계획 순서) → `holding-requested` / `holding-result`(`item`은 페이지 줄과 같은 모양, `rank` 0, `titleKey` `book:<bookId>`, `cached`는 3분 캐시) / `holding-failed` → `batch-done` → `done`. `row-verdict` 없음. 교보 구독형은 요청 없이 `SUBSCRIPTION`. 호스트가 다른 `detail_url`은 요청 없이 `holding-failed` `upstream_error`. 없는 소장·꺼진 도서관은 `library_not_found`. 캐시 키 `(libraryId, detailUrl)`. 구현됨 |
| GET | `/api/v1/book-availabilities/batches/stream?filter=&batchNo=&candidates=holdingId,…` | `availability` | 다음 묶음 (K=50 [안]). 구현됨 |
| POST | 조회 서비스 `/v1/fetches` (내부) | 조회 서비스 | URL 한 개를 GET으로 가져와 `{outcome, status, contentType, location, body(base64), startedAt, endedAt}`. `outcome`: `RESPONDED \| TIMEOUT \| CONNECT_FAILED \| ERROR`. 조회 서버 자신이 정상이면 항상 200. 401 토큰 없음·틀림(헤더 `X-Fetch-Token` [안, 임시]), 400 잘못된 URL·사설 주소, 503 과부하·종료 중 (ADR-0015) |

## 검색 조건 파라미터 (ADR-0025, 도서관에서 직접 찾기)

사이클 04부터 이 세 API는 "도서관에서 직접 찾기"(사이트 검색)에 씁니다. 웹 주소는 여러 조건을 담고, 직접 찾기일 때만 첫 칸 하나를 이 API로 보냅니다 (ADR-0033, 설계됨).

세 API는 검색어를 `q` 대신 `title` / `author` / `publisher` 중 **정확히 하나**로 받습니다. `q`는 없고, 웹도 옛 `?q=` 주소를 처리하지 않습니다(배포 전).

| 경우 | 응답 |
|---|---|
| 하나, 값 2~50자(정규화 후) | 정상. 그 필드로 검색 |
| 하나도 없음, 값이 비어 있음, `q`만 옴 | 400 `validation_error`, `errors: [{"field":"title","code":"required"}]` |
| 둘 이상 | 400 `validation_error`, 들어온 조건마다 한 줄 `code: too_many` (순서 title, author, publisher) |
| 같은 이름 두 번 | 400 `validation_error`, `code: duplicate` |

- 빈 값은 없는 것으로 셉니다: `?title=&author=김달`은 저자 검색입니다 (dev 결정). `detail`은 다른 `validation_error`와 같은 "Request validation failed"입니다.
| 값 1자, 51자 이상 | 400 `invalid_query` |

- 검증 순서: 첫 묶음은 조건 → `filter` → `scope` → `visit` → 지역, 다음 묶음은 조건 → `filter` → `batchNo` → `candidates`, 도서관별 더 보기는 조건 → `page` → 도서관. 첫 오류 하나만 돌려줍니다.
- 웹 주소도 같은 이름을 씁니다: `/search?author=김달`. 조건이 둘 이상인 주소는 title → author → publisher 순서로 하나만 씁니다 [확정].

## 묶음 실행 규칙 (요약, 자세한 것은 사이클 02 design-delta)

- 계획 순서대로 시작, 동시 P=5 [안], 셈한 줄이 20을 넘으면 새 요청 중단 [확정], 검색 페이지는 묶음 시작부터 8초 [확정], 남은 시간 3초 미만이면 새 요청 안 함 [안]
- 같은 호스트가 바쁘면 그 후보를 건너뛰고 다음 후보 먼저 (ADR-0020)
- 셈하는 줄: `filter=all`은 판정이 정해진 모든 줄, `available`은 `AVAILABLE` 줄. `PENDING`은 세지 않음
- `batch-done`: `batchNo`, `requested`, `succeeded`, `failed`, `countedRows`, `pendingRows`, `stopReason`(`ROW_LIMIT \| CANDIDATES_EXHAUSTED \| LAUNCH_CUTOFF`)
- `row-verdict`: `batchNo`, `libraryId`, `page`, `rank`, `availability`, `availabilityBasis`. `batch-done` 뒤에 보냄

## `targets` 이벤트

`title` / `author` / `publisher` 중 요청과 같은 칸 하나(값은 검색어, 나머지 둘은 JSON에서 빠짐), `filter`, `scope`, `visit`, `regionFilterApplied`, `libraries[]`. 사이클 02의 `query` 칸은 없습니다 (ADR-0025). 도서관 항목: `id`, `name`, `libraryType`, `platformType`, `priorityGroup`, `deferred`, `eligibility`, `eligibilitySummary`, `extraConditionText`, `visitRequired`, `joinMethod`, `joinUrl`, `joinCaution`, `joinNotice`, `homepageUrl`.

- 크기: 278곳 156,368바이트(gzip 했다면 16,271) (dev 측정, 2026-09-29)

## 검색 방식 (ADR-0009, ADR-0025, ADR-0026)

고른 조건을 사이트의 해당 칸으로 검색합니다.

| 화면 종류 | 제목 | 저자 | 출판사 |
|---|---|---|---|
| `KYOBO_V1`, `KYOBO_SUBSCRIPTION_V1` | `schClst=ctts` | `schClst=autr` | `schClst=pbcm` |
| `YES24_V1`~`V3` | `srch_order=title` | `author` | `publisher` |
| `GANGNAM_V1` | `search=title` | `search=author` | `search=publisher` |
| `ELIB_PORTAL_V1` | 기본 검색(제목 전용 칸 없음) | `table.do?search_text={q}&author_name={q}` | `table.do?search_text={q}&book_pubname={q}` |

- 부분 일치입니다("김달" → "김달우"도). 포털 저자·출판사만 정확히 일치입니다 (ADR-0026). 그래서 포털에서는 "김달 저", "김달 지음"처럼 적힌 줄이 빠집니다 (dev 실측 2026-09-29, 부산 11줄 중 3줄).
- 포털 기본(제목) 검색은 제목뿐 아니라 저자·출판사도 찾습니다.
- 포털 "도서관에서 보기"(`librarySearchUrl`)는 가져온 주소가 `index.do`가 아니면(저자·출판사, 제목 2쪽 이후) `index.do?menu_idx=M&search_text=…`로 만듭니다. `table.do`는 화면 조각이라 새 창에서 깨집니다.
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

## 로그인·계정 (`auth`) — 구현됨(사이클 05, dev 기록 2026-10-04)

- 설정 `chaekcheck.auth.enabled`가 꺼져 있으면 이 절의 주소는 없습니다(404, ADR-0046).
- 제공자 설정(`chaekcheck.auth.providers`, 기본 `naver,kakao`)에서 뺀 제공자의 로그인 시작·돌아올 주소·연결 끊김 웹훅도 없습니다(404, ADR-0046 덧붙임). 서블릿 필터가 보안 필터 체인 앞에서 답합니다(dev 구현).
- 쿠키: 액세스 토큰 `access_token`(`Path=/api/v1/me`), 리프레시 토큰 `refresh_token`(`Path=/api/v1/auth`), 둘 다 `Secure`·`HttpOnly`·`SameSite=Lax`. 로그인 도중의 세션 쿠키는 `Path=/api/v1`, 10분. CSRF는 `XSRF-TOKEN` 쿠키 → `X-XSRF-TOKEN` 헤더.


| 메서드 | 경로 | 인증 | CSRF | 성공 | 오류 |
|---|---|---|---|---|---|
| GET | `/api/v1/auth/oauth2/authorization/{naver\|kakao\|naver-reauth\|kakao-reauth}` | 없음 | 해당 없음 (GET, 상태 변경 없음) | 302 제공자 | — |
| GET | `/api/v1/auth/login/oauth2/code/{registrationId}` | 없음(`state`로 확인) | 해당 없음 | 302 `/auth/complete?result=…` 또는 `/signup` | 아래 "결과 코드" |
| GET | `/api/v1/auth/providers` | 없음 | — | 200 켜진 제공자 `["NAVER","KAKAO"]` 또는 `["KAKAO"]`. 웹이 로그인 창을 열 때 한 번 부름 [확정] (사용자, 2026-10-04: 안 셋 중 "공개 API 하나") | 404 (로그인이 꺼짐) |
| GET | `/api/v1/auth/csrf-token` | 없음 | — | 204 + `XSRF-TOKEN` 쿠키 | — |
| GET | `/api/v1/auth/signup` | 가입 대기(임시 세션) | — | 200 | 404 `signup_not_found` |
| POST | `/api/v1/auth/signup` | 가입 대기 | 필요 | 201 + 쿠키 둘 | 400 `validation_error`(`errors[].code: required`), 404 `signup_not_found`, 409 `document_version_mismatch` |
| DELETE | `/api/v1/auth/signup` | 가입 대기 | 필요 | 204 | 404 `signup_not_found` |
| POST | `/api/v1/auth/refresh` | refresh 쿠키 | 필요 | 204 + 쿠키 둘 | 401 `unauthorized` |
| POST | `/api/v1/auth/logout` | refresh 쿠키(없어도 됨) | 필요 | 204. 그 브라우저의 `refresh_token` 줄을 DB에서 삭제하고 쿠키 둘을 만료시킴 | — (멱등) |
| GET | `/api/v1/me` | access 쿠키 + 계정 존재 | — | 200 | 401 `unauthorized`, 500 `internal_error` (토큰 확인 중 DB 오류. 401이면 웹이 로그인을 버리므로 일부러 500 [확정] (사용자 승인, 2026-10-04)) |
| DELETE | `/api/v1/me` | access 쿠키 + 재인증 증명 | 필요 | 204 + 쿠키 만료 | 401 `unauthorized`, 403 `reauthentication_required` / `reauthentication_expired`, 500 `internal_error` |
| POST | `/api/v1/auth/webhooks/kakao-unlink` | `KakaoAK` 헤더 | **제외** | 200 | 401 `unauthorized` |
| POST | `/api/v1/auth/webhooks/naver-unlink` | 서명 | **제외** | 204 | 401 `unauthorized` |

- 모든 CSRF 403: `code: csrf_invalid`. 재인증 403과 구분해 웹이 "새 토큰 → 한 번 다시"를 할 수 있게 함
- CSRF가 아닌 403은 `forbidden`(지금은 권한 구분이 없어 나오지 않음) [확정] (사용자 승인, 2026-10-04)
- 네이버·카카오 로그인이 성공한 뒤 우리 쪽 오류(DB 등)가 나면 돌아오는 주소(`/api/v1/auth/login/oauth2/code/{registrationId}`)에서 500입니다. 전용 결과 코드는 만들지 않습니다 [확정] (사용자 승인, 2026-10-04: 새 코드를 만드는 다른 선택은 고르지 않음)
- 응답의 쿠키 `XSRF-TOKEN`은 인증이 성공한 콜백 응답에서 Spring이 새 값으로 바꿉니다(웹은 쿠키를 매번 읽으므로 영향 없음, dev 확인)
- 예시:
  - `GET /api/v1/auth/signup` → `{"provider":"KAKAO","documents":[{"type":"TERMS_OF_SERVICE","version":"<v>"},{"type":"PRIVACY_COLLECTION","version":"<v>"}]}`
  - `POST /api/v1/auth/signup` 요청 → `{"consents":[{"type":"TERMS_OF_SERVICE","version":"<v>"},{"type":"PRIVACY_COLLECTION","version":"<v>"},{"type":"AGE_OVER_14"}]}`
  - `GET /api/v1/me` → `{"id":123,"loginMethods":["KAKAO"],"consents":[{"type":"TERMS_OF_SERVICE","version":"<v>","agreedAt":"2026-10-04T10:00:00Z"}]}`. `loginMethods`는 재인증 시작 주소를 고르는 데만 쓰고 화면에 보이지 않음
  - 401 → `{"title":"Unauthorized","status":401,"detail":"Login required","code":"unauthorized"}`


### 결과 코드 (`/auth/complete?result=`와 API 오류의 `code`)

| 코드 | 어디서 | 화면 문구 |
|---|---|---|
| `login_success` | 콜백 | 없음(보던 주소로) |
| `login_cancelled` | 콜백 `error=access_denied` | 로그인을 취소했어요 |
| `login_provider_error` | 콜백: 제공자 `error`(취소 말고), 토큰 교환·프로필 실패. 제공자 이름을 `&provider=naver` 또는 `kakao`로 함께 줌(경로의 registrationId에서 정함) | 네이버(카카오) 쪽 문제로 로그인하지 못했어요. 잠시 뒤 다시 해 주세요 |
| `login_expired` | 저장된 인가 요청이 없음 | 로그인 시간이 지났어요. 다시 해 주세요 |
| `login_state_mismatch` | 저장된 요청은 있는데 `state`가 다름 | 안전하지 않은 로그인 요청이라 멈췄어요. 로그인 버튼을 눌러 다시 해 주세요 |
| `withdraw_reauthenticated` | 재인증 콜백 성공 → 웹이 DELETE 호출 | 탈퇴 처리 중 |
| `withdraw_account_mismatch` | 재인증 콜백 | 가입한 계정으로 확인해 주세요 |
| `withdraw_cancelled` | 재인증 콜백 `access_denied` | 탈퇴를 취소했어요 |
| `withdraw_provider_error` | 재인증 콜백. `&provider=`를 함께 줌 | 네이버(카카오) 쪽 문제로 본인 확인을 하지 못했어요. 잠시 뒤 다시 해 주세요 |
| `withdraw_login_expired` | 재인증 콜백: 리프레시 줄 없음 / DELETE 401 뒤 갱신 실패 | 로그인이 풀렸어요. 다시 로그인한 뒤 탈퇴해 주세요 |
| `withdraw_request_expired` | 재인증 콜백: 저장된 인가 요청이 없음. **사이클 06 보완으로 추가 예정(dev는 아직 `login_expired`를 씀)** [확정] (사용자 승인, 2026-10-04) | 본인 확인 시간이 지났어요. 탈퇴를 다시 눌러 주세요 |
| `withdraw_state_mismatch` | 재인증 콜백: 저장된 요청은 있는데 `state`가 다름. 위와 같이 추가 예정 [확정] (사용자 승인, 2026-10-04) | 안전하지 않은 요청이라 멈췄어요. 탈퇴를 다시 눌러 주세요 |
| (API) `reauthentication_expired` 403 | `DELETE /api/v1/me` | 본인 확인 시간이 지났어요. 탈퇴를 다시 눌러 주세요 |
| (API) `internal_error` 500 | `DELETE /api/v1/me` | chaekcheck 서버 문제로 탈퇴하지 못했어요. 잠시 뒤 다시 해 주세요 |
| (웹) 네트워크 | `fetch` 예외 | 인터넷 연결을 확인하고 다시 해 주세요 |

- 문구의 원본은 `spec.md` "상태별 동작"과 `flow.md` S1·S7입니다. `provider` 값은 `naver`, `kakao` 둘만 받고 그 밖의 값은 웹이 무시합니다.
- `login_expired`와 `login_state_mismatch`는 인가 요청 저장소를 감싸서 구분합니다: 세션에 저장된 요청이 없으면 expired, 있는데 `state`가 다르면 mismatch [확인 필요: Spring Security 소스에서 기본 동작 확인].
- 탈퇴가 멈춘 문구 일곱(`flow.md` S7)과의 대응: 다른 계정 `withdraw_account_mismatch`, 5분 초과 `reauthentication_expired`(403), 취소 `withdraw_cancelled`, 제공자 오류 `withdraw_provider_error`, 우리 서버 오류 `internal_error`(500), 로그인이 풀림 `withdraw_login_expired`, 인터넷 끊김은 웹이 `fetch` 예외로 판단.

## 오류 코드

| code | HTTP | 어디서 |
|---|---|---|
| `validation_error` | 400 | 지역 해석 API, 스트림의 지역 파라미터(숫자 아님, 20개 초과), `filter`·`scope` 값 오류, 다음 묶음의 `candidates`·`batchNo`, 세 API의 검색 조건 파라미터(없음·둘 이상·중복), 스트림의 `visit` 값 오류. `errors[].code`: `required`, `invalid_format`, `too_many`, `duplicate` |
| `invalid_query` | 400 | 스트림(시작 전), 더 보기 — 정규화 후 2글자 미만 또는 50자 초과 |
| `invalid_page` | 400 | 더 보기 |
| `invalid_region` | 422 | 스트림(시작 전) — `errors[].code`: `abolished`, `not_found`, `not_sigungu` |
| `book_not_found` | 404 | 책 하나 조회 — 없는 책, 숫자가 아닌 id |
| `library_not_found` | 404 | 더 보기 — 없거나 꺼진 도서관. 다음 묶음에서는 그 도서관만 `library-failed` |
| `upstream_error` | 502 | 더 보기, 스트림의 `library-failed` — 도서관 오류 응답, 3xx, 파싱 실패, 모든 조회 서버가 쉼 |
| `upstream_timeout` | 504 | 더 보기, 스트림의 `library-failed` — 8초 초과, 조회 서버 읽기 시간 초과 |
| `unauthorized` | 401 | 로그인·계정 — 로그인이 필요함, 토큰 만료·무효, 웹훅·콜백 검증 실패 |
| `csrf_invalid` | 403 | 로그인·계정 — CSRF 토큰 없음·틀림 |
| `forbidden` | 403 | 로그인·계정 — CSRF가 아닌 403(지금은 나오지 않음) |
| `reauthentication_required`, `reauthentication_expired` | 403 | 탈퇴 — 본인 확인 기록 없음 / 5분 초과 |
| `signup_not_found` | 404 | 가입 대기 없음·만료 |
| `document_version_mismatch` | 409 | 가입 — 동의한 문서 버전이 현재와 다름 |
| `not_found` | 404 | 없는 경로 (Spring 기본 예외) |
| `bad_request` | 400 | 형식이 틀린 요청 (Spring 기본 예외) |
| `method_not_allowed` | 405 | 지원하지 않는 메서드 |
| `not_acceptable` | 406 | 줄 수 없는 `Accept` |
| `unsupported_media_type` | 415 | 지원하지 않는 요청 본문 형식 |
| `request_error` | 그 밖의 4xx | 위에 없는 Spring 기본 예외 |
| `internal_error` | 5xx | 예상하지 못한 서버 오류(500)와 모듈이 `code`를 붙이지 않은 5xx |

`not_found`부터 7개는 dev `ApiExceptionHandler`가 붙입니다. 모듈이 `code`를 붙이지 않은 오류에만 HTTP 상태로 골라 붙입니다(2026-09-27 코드 확인).
