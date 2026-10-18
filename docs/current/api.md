# API 목록 (현재)

현재 설계 전체를 적은 문서입니다. 요청·응답 예시는 사이클 01 `docs/cycles/01-ebook-availability-search/design-delta.md`와 사이클 02 `docs/cycles/02-library-expansion/design-delta.md`에 있습니다.

사이클 09 cycle-close (2026-10-11): `GET /api/v1/libraries` 항목과 검색·대출 현황 스트림 `targets.libraries[]`에 `vendor`, `lendingModel`(통합 포털은 null), `orderNo`를 더함. "`lendingModel`은 웹에 보내지 않음" 기록을 바꿈(ADR-0076). 도서관 `name`은 기관 이름만(괄호 라벨 없음, ADR-0071). 요청 모양은 그대로 — 구현됨 (사이클 09). 근거 `docs/cycles/09-library-naming/design-delta.md` "API"·"웹".
사이클 09 회고 (2026-10-12): dev 보고(`plan-feedback.md` "# 사이클 09", AC-1~9 통과)와 dev 코드(`LibraryEligibility.java`, `SearchTarget.java`, `StreamEvents.java`)로 대조해 위 변경을 구현됨으로 바꿈. Modulith `components.puml`(2026-10-12) 대조 결과 모듈 관계 그대로. 세 칸은 레코드 끝 칸(`/libraries`는 `mobileSiteDiffers` 뒤), 목록 응답 크기 874,306바이트(gzip 53,049, 비교 기준은 0단계 값 737,300 / 52,686), 첫 `targets` +7.5~8.2%. 근거 `docs/cycles/09-library-naming/retro.md`.
사이클 10 cycle-close (2026-10-12): 인기 도서 — 새 요청 `GET /api/v1/popular-books`, `GET /api/v1/popular-books/covers/{coverId}`(모듈 `popular`, 인증 없음), 대출 현황 스트림 `GET /api/v1/book-availabilities/stream`에 선택 파라미터 `holdingLimit`, 새 오류 코드 `cover_not_found` — 구현됨 (사이클 10). 근거 `docs/cycles/10-popular-books/design-delta.md` "API", ADR-0073~0075, ADR-0080·ADR-0081.
사이클 10 회고 (2026-10-12): 구현 대조, 분류 14개·표지 200px JPEG·User-Agent·문구 반영 (`docs/cycles/10-popular-books/retro.md`). dev `PopularBooksController.java`, `BookAvailabilityStreamController.java`로 대조함.
사이클 11 cycle-close (2026-10-12): 가져오기 따로 하기(export·apply·finish·discard, load_manifest, db-ops) + 묶는 방식 compact(기본)·objects(옛 이름 current)·sql — 구현됨 (사이클 11, 회고 2026-10-14). REST 변경 없음(새 요청·새 칸·새 오류 코드 없음, 가져오기는 실행 명령·설정만). 근거 `docs/cycles/11-separate-import/design-delta.md` "API", ADR-0078·0079.
사이클 12 (2026-10-12, 미리 한 plan): 책 묶기 네 번째 단계 — 구현됨 (사이클 12, 회고 2026-10-14). REST 변경 없음(요청·응답 형식 그대로, 한 줄로 묶이는 책만 달라짐, 사라진 번호는 지금처럼 404 `book_not_found`). 근거 ADR-0082, ADR-0106. 회고(2026-10-14): REST 변경 없음 확인. 따로 찾은 오류 `GET /api/v1/books?title=묘왕동주 1&exact=title` → 500 `internal_error`(사이클 12와 무관, backlog — 사이클 17 첫 배포 전 고칠 것 [확정] (사용자 승인, 2026-10-14, 회고 결정 #12)) [확인 필요: 원인]
사이클 14 cycle-close (2026-10-12): 인기 도서 → 사서추천도서 — `GET /api/v1/popular-books`·`GET /api/v1/popular-books/covers/{coverId}`(모듈 `popular`, 사이클 10 구현됨·배포 전)를 `GET /api/v1/picks`·`GET /api/v1/picks/covers/{coverId}`(모듈 `picks`, 인증 없음)로 바꿈, 옛 경로는 남기지 않음. 응답에서 `month`·`rank`가 빠지고 책에 `recomNo`·`category`·`recommendedMonth`가 더해짐. `holdingLimit`·`cover_not_found`는 그대로 — 설계됨(미구현, 사이클 14). 근거 `docs/cycles/14-librarian-picks/design-delta.md` "API", ADR-0089·0090·0091.
사이클 14 회고 (2026-10-14): `GET /api/v1/picks`·`…/covers/{coverId}` 구현됨, `popular-books` 두 경로 지움, 범위 최근 12번(2년), 응답 칸 이름 설계 그대로(dev `PicksController.java` 130~143행) (`docs/cycles/14-librarian-picks/retro.md`).
사이클 13 회고 반영 (2026-10-14): `GET /api/v1/join-surveys/latest`와 S12 `/about` 한 줄 — 구현됨 (사이클 13, 회고 2026-10-14). 경로·응답·인증 없음이 설계와 같음(`JoinSurveyController.java:25-37`, 시험 `joinSurveyDateNeedsNoLogin`). 근거 `docs/cycles/13-crawler-to-dev/retro.md`.
사이클 15 cycle-close (2026-10-14, 12·13·14 회고 뒤): 새 요청 `POST /api/v1/usage-events`(모듈 `usagelog`, 로그인 요구 없음, 로그인 기능 켜짐이면 CSRF), 액세스 쿠키 `access_token` 경로 `/api/v1/me` → `/api/v1`(ADR-0102). 검색·책 상세·직접 찾기 요청 형식은 그대로(로그인 여부는 쿠키로 서버가 판별) — 구현됨 (사이클 15, 회고 2026-10-15). 근거 `docs/cycles/15-usage-log/design-delta.md` "API", ADR-0096·0097·0102.
사이클 16 cycle-close (2026-10-14, 12·13·14·15 회고·인계 뒤): 공지사항과 안내·약관 페이지를 DB로 — 새 요청 `GET /api/v1/notices`, `GET /api/v1/notices/{noticeId}`, `GET /api/v1/documents/{documentKey}`(모듈 `sitecontent`, 로그인 없음), 새 오류 코드 `notice_not_found`·`document_not_found`·`version_not_found`, 가입(`GET`/`POST /api/v1/auth/signup`)의 문서 `version` 값이 판 순번 글자(`"1"`)로 바뀜(요청·응답 모양 그대로) — 구현됨 (사이클 16, 회고 2026-10-15). 근거 `docs/cycles/16-notices-and-policies/design-delta.md` "API", ADR-0098~0101.
사이클 15·16·18 회고 (2026-10-15): 구현됨으로 바꾸고 실제 이름·값을 맞춤. 15 `usagelog`·16 `sitecontent` 구현됨, 18은 A1·A2·B 구현됨(dev main `a0e438a`), C(운영 반영)는 `docs/backlog.md` "사이클 18 C"로 옮김 (사용자: "운영 반영은 백로그랑 CYCLE19 PLAN에게 알려주고 이거 마무리하자", 2026-10-15). 근거 `docs/cycles/15-usage-log/retro.md`, `docs/cycles/16-notices-and-policies/retro.md`, `docs/cycles/18-empty-library-holdings/retro.md`, dev `plan-feedback.md` "# 사이클 15"·"# 사이클 16"·"# 사이클 18".
사이클 19 cycle-close (2026-10-15): 저자·제목 표기 정리 — 설계됨(미구현, 사이클 19). ADR-0113~0117. REST 모양 변경 없음, `GET /api/v1/books` 저자 검색어에 기호 떼기, 책 묶음·`author_display` 값만 바뀜. 근거 `docs/cycles/19-author-angle-brackets/design-delta.md` "API".
사이클 21 cycle-close (2026-10-16): 추천도서 세 목록 — 설계됨(미구현, 사이클 21). ADR-0126. `GET /api/v1/picks/{listKey}`(`librarian`·`leedongjin`·`snu100`)가 `GET /api/v1/picks`를 대신하고 그 주소는 지움, 새 오류 코드 `list_not_found`, 책 칸 `recomNo` → `id` 등, 표지 주소 그대로, 사용 알림 `picks_*`에 `list` 필수. 근거 `docs/cycles/21-recommended-books/design-delta.md` "API".
사이클 22 cycle-close (2026-10-18): 첫 화면 사용성 — 설계됨(미구현, 사이클 22), **웹만 바뀜·API 변경 없음**. 웹이 보내는 `scope`는 늘 `joinable`이고 결과 안 [전국에서 찾기]·[전국에서 더 찾기]·상세검색 "☐ 전국에서 찾기"일 때만 `all`(그 검색만). `GET /api/v1/libraries`(지역 없이)는 직접 추가 이름·이름 찾기에 필요할 때만 한 번. 이용 기록 새 이벤트 없음. ADR-0135~0137. 근거 `docs/cycles/22-first-screen-usability/design-delta.md`.

사이클 20 cycle-close (2026-10-17): 조회 상태 신호와 브라우저 확장 조회 — 설계됨(미구현, 사이클 20). ADR-0118·0119·0131·0132. 새 요청 `GET /api/v1/lookup-status`(1단계), 확장 모드 계획·올리기·닫기 `POST /api/v1/lookup-plans/*`(2단계), 새 오류 코드 `invalid_plan`·`client_ip_changed`(2단계)·`invalid_client_key`·`lookup_ip_limited`(3단계)·`payload_too_large`, 결과 10(`/books` `pageSize` 기본 10, 묶음 `rowLimit` 10), 동시 검색 상한 40, 도서관 응답 본문 1MB·gzip, `stopReason` `CLIENT_GONE`. 기존 요청 모양은 그대로. 근거 `docs/cycles/20-lookup-status-and-extension/design-delta.md` "API"·"외부 연동". 이름은 따로 적지 않으면 [안].
사이클 21 회고 (2026-10-17): `GET /api/v1/picks/{listKey}`·`list_not_found`·응답 칸(`list`, `id`, `listTitle`, `yearBook`, `videoId`, `tocNo`)·사용 알림 `list` 구현됨, 이름·칸이 설계 그대로 (dev `PicksController.java` 57·138~158행, main `836bd7b`). 웹은 `listTitle`을 받지만 화면에 쓰지 않음(사용자, 2026-10-17). 추천도서 책 창은 같은 대출 현황 스트림을 `holdingLimit` 3 → 6 → 10 → 20으로 넓혀 다시 부름(새 API 없음). 근거 `docs/cycles/21-recommended-books/retro.md`.
사이클 19 회고 (2026-10-18): 책 검색 저자 칸 기호 떼기 구현됨 (dev main `1c129e8`, 운영 역할 DB 반영 기록 12번). REST 모양 변경 없음 그대로. 근거 `docs/cycles/19-author-angle-brackets/retro.md`, dev `plan-feedback.md` "# 사이클 19".

사이클 13 cycle-close (2026-10-12, 사이클 12와 나란히 미리 한 plan, 사이클 12 뒤에 개발): 새 요청 `GET /api/v1/join-surveys/latest`(모듈 `collection`, 인증 없음, 가입 조건 조사 기준일)와 S12 `/about` 공지 한 줄 — 구현됨 (사이클 13, 회고 2026-10-14). 다른 요청·응답·오류 코드는 그대로(새로 넣은 도서관은 `/libraries`·스트림에 지금 모양으로 나옴, 1215 이름은 "한화S&C"). 근거 `docs/cycles/13-crawler-to-dev/design-delta.md` "API", flow.md S12, ADR-0087·0093.
사이클 08 cycle-close (2026-10-11): `GET /api/v1/libraries` 항목과 스트림 `targets.libraries[]`에 `mobileSiteDiffers`, 503 `server_busy`에 `Retry-After: 5`, 대출 현황 스트림의 도서관별 실패 코드 `holding_not_found`, 429·503 화면 안내 문구를 따로 둠 — 구현됨 (사이클 08). 요청 모양은 그대로. 근거 `docs/cycles/08-polish-swap-memory/design-delta.md` "API"·"웹", ADR-0070.
사이클 08 회고 (2026-10-11): dev 보고(`plan-feedback.md` "# 사이클 08" 5·7·8·12단계, AC-3·4·8c·18·20 통과)와 대조해 위 변경을 구현됨으로 바꿈. 칸 이름 `mobileSiteDiffers`, 코드 `holding_not_found`는 [확정] (dev 구현 확인, 2026-10-11). 옛 `holdingsOf(bookIds)`는 쓰는 곳이 없어 지움. 근거 `docs/cycles/08-polish-swap-memory/retro.md`.

사이클 07 회고 반영 (2026-10-05): 수집 목록에서 찾은 도서관 2,394곳 넣기 — 새 요청 `POST /api/v1/me/library-imports`, 등급 `UNSURVEYED`, 새 칸 `joinSurvey`·`logoUrl`(+ `/libraries`의 `homepageUrl`), `platformType` 두 값(`BOOKCUBE_FX`, `ALADIN_V1`), `/books` 계획 거르기 방식, nginx gzip·요청 수 제한(429 `too_many_requests`), 동시 검색 제한(503 `server_busy`) — 구현됨 (사이클 07). dev 컨트롤러·nginx 설정과 대조함. 근거 docs/cycles/07-candidate-libraries/retro.md, dev plan-feedback.md '# 사이클 07'. 설계 근거 `docs/cycles/07-candidate-libraries/design-delta.md` "API"·"외부 연동"·"로고", ADR-0053, 0055~0059.

사이클 06 회고 반영 (2026-10-05): 내 도서관(`mylibrary`)을 더함 — 구현됨 (사이클 06). dev 컨트롤러 코드와 `chaekcheck-dev/docs/plan-feedback.md` "# 사이클 06"으로 대조함. 근거 `docs/cycles/06-my-libraries/design-delta.md`. 내 도서관 API, `GET /api/v1/libraries`, 검색 API 네 곳의 `libraryIds`, `chosen`·`CHOSEN`, 오류 코드 `library_limit_reached`, 결과 코드 `signup_success`·`withdraw_request_expired`·`withdraw_state_mismatch`.

사이클 05 cycle-close (2026-10-04): 로그인·계정 API를 더함 — 구현됨(사이클 05, 2026-10-04 retro 반영). 근거 `docs/cycles/05-login-account/design-delta.md`.

마지막 반영: 사이클 04 회고 (2026-10-01). 모두 dev 컨트롤러 코드(커밋 `c6028c9`)와 대조했습니다(구현됨). 책 검색·소장 스트림의 요청·응답 예시는 `docs/cycles/04-and-search/design-delta.md`, 개발 중 바뀐 것은 같은 폴더 `retro.md`. 사이클 03 예시는 `docs/cycles/03-search-conditions/design-delta.md`.

## 공통 규칙 (ADR-0008)

- 성공 응답은 감싸지 않고 결과를 그대로 돌려줍니다. 필드 이름은 camelCase.
- 오류는 RFC 9457 Problem Details (`application/problem+json`) + 확장 멤버 `code`(snake_case), 필요하면 `errors`.
- `type`이 `about:blank`이면 응답에서 생략됩니다(Spring Framework 7 동작, RFC 9457상 같은 뜻). 422의 `title`은 "Unprocessable Content"입니다.
- 검색·조회 API(아래 첫 표)는 모두 인증 없는 GET입니다. 로그인·계정 API(`/api/v1/auth/**`, `/api/v1/me`)는 따로 표에 있습니다(구현됨(사이클 05, 2026-10-04 retro 반영)). 내 도서관 API(`/api/v1/me/regions`, `/api/v1/me/libraries/**`)도 따로 표에 있습니다(구현됨 (사이클 06)). 스트림은 `fetch`로 읽고, 검증 오류는 스트림을 열기 전에 ProblemDetail로 돌려줍니다. 스트림 컨트롤러에는 `produces`를 걸지 않습니다.
- 응답 압축: 사이클 07부터 웹 서버 nginx 예시에 `gzip on; gzip_proxied any; gzip_vary on; gzip_min_length 1024; gzip_types application/json application/problem+json;`(스트림은 압축 안 함) [확정] (ADR-0058, 설정 값 dev 구현 확인, 2026-10-05), 로고 파일 `location /library-logos/`에 `Cache-Control: public, max-age=604800`(7일, 파일 이름에 해시가 없어 `immutable` 안 씀) [확정] (사용자 승인, 2026-10-05, 설계 검토; 값 dev 구현 확인, 2026-10-05) — 구현됨 (사이클 07)
- 요청 수·응답 크기 제한 (사이클 07, handoff 밖, 사용자가 문제를 줌 2026-10-05, 원문 없음) — 구현됨 (사이클 07), 숫자는 모두 [안]:
  - nginx 예시(`deploy/nginx/rate-limits.conf`): 도서관을 부르는 API(검색·소장 스트림 4개, `/api/v1/availability/`)에 IP별 `limit_req` 30r/m [안], burst 20 [안], `limit_conn` 6 [안]. 넘으면 429 `too_many_requests`(Problem Details, `Retry-After: 2`). 배포 때 실제 사용자 IP 받는 법(`real_ip`)은 [확인 필요] (배포 때 정함)
  - 백엔드: 동시에 도는 검색(묶음 스트림 + 도서관별 "더 보기") `chaekcheck.availability.max-concurrent-searches=20` [안], 넘으면 줄 세우지 않고 503 `server_busy`. 사이클 08: 응답 머리에 `Retry-After: 5` [확정] (사용자 승인, 2026-10-11) — 구현됨 (사이클 08) (묶음 스트림·더 보기·소장 스트림이 같은 처리기, AC-18 통합 테스트)
  - 도서관 응답: 본문 최대 4MB [안] (넘으면 `upstream_error`), 본문 포함 요청 전체 15초 [안] (넘으면 `upstream_timeout`). 직접 호출과 조회 서버 둘 다
  - 사이클 20 — 설계됨(미구현, 사이클 20, 1단계) (ADR-0132): 동시 검색 상한 20 → 40(`CHAEKCHECK_AVAILABILITY_MAXCONCURRENTSEARCHES`) [확정] (전반 점검 #13). 도서관 요청에 `Accept-Encoding: gzip`, 본문 상한 4MB → 1MB(`LOOKUP_MAX_BODY_MB`, 풀었을 때도 1MB, 넘으면 그 도서관만 실패·`body_too_large_count`) [확정] (세 관점 검토 #7, 전반 점검 #6). 해석 자리 8(`ParseSlots`)을 2초 못 얻으면 그 도서관만 실패 [확정] (전반 점검 #4). 새 `GET /api/v1/lookup-status`는 nginx 일반 구역(도서관 호출 구역 아님), `/api/v1/lookup-plans/`는 따로 블록(아래 "조회 상태와 확장 모드 계획"). 숫자 색인 [`../settings-index.md`](../settings-index.md)
  - 화면 문구는 두 코드를 따로 둠 [확정] (사이클 08 spec R2): 429 "검색을 너무 자주 했어요. 1분쯤 뒤에 다시 해 주세요.", 503 "지금 찾는 사람이 많아요. 잠시 뒤에 다시 해 주세요." 안내 줄로 보이고 받은 결과는 남김 — 구현됨 (사이클 08). 웹은 상태 코드만 보고(429 → 자주, 503 → 바쁨) 결과 목록 위에 안내 줄 하나, 다시 버튼은 없음, 첫 요청이 막히면 결과 자리에 같은 문구 (dev 7단계). 실제 429·503 화면은 띄워 보지 않고 Vitest로 확인 (AC-3). (사이클 07까지: 두 코드 모두 일반 문구 "검색하지 못했어요. 잠시 뒤 다시 시도해 주세요.")

| 메서드 | 경로 | 모듈 | 설명 |
|---|---|---|---|
| GET | `/api/v1/regions` | `region` | 사용 중인 시도·시군구 트리 |
| GET | `/api/v1/regions/resolutions?ids=` | `region` | 저장된 지역 ID를 `ACTIVE / REPLACED / SPLIT / UNKNOWN`으로 해석 (최대 20개) |
| GET | `/api/v1/libraries?residenceRegionIds=&workRegionIds=` | `library` | 켜진 서비스 도서관 전체 + 지역별 가입 표시. 로그인 없음, 회원을 모름(ADR-0049). 화면은 해석한 지역 ID만 보냄. 지역 ID 쉼표 구분, 칸마다 최대 20. 200 `{"libraries":[{id, name, eligibility, matchedBy, visitRequired, cautioned, eligibilitySummary}]}`, id 순서, 페이지 없음. 오류 400 `validation_error`, 422 `invalid_region`. `matchedBy`는 `ELIGIBLE`일 때만 `RESIDENCE`/`WORK`로 채움. 지역 규칙이 안 맞는 줄의 `eligibility`는 `UNKNOWN`이지만 뜻이 기존("지역을 보내지 않음")과 달라짐 — dev가 응답 설명(컨트롤러·`LibraryEligibility` Javadoc)에 적음 [확정] (dev 구현 확인, 2026-10-05). 칸 이름 `matchedBy`·`cautioned` [확정] (dev 구현 확인, 2026-10-05). 422 모양은 스트림과 같은 `errors[].value`. 응답 크기: 켜진 도서관 278곳, 지역 없음 48,123바이트(gzip 4,208), 거주 마포구 + 직장 중구 48,591바이트(gzip 4,292) — 약 48KB, gzip 약 4.2KB (dev 측정, 2026-10-04, db-test 시드). 지금 `deploy/nginx` 예시에는 gzip 설정 없음. 예시는 `docs/cycles/06-my-libraries/design-delta.md` "API". 구현됨 (사이클 06). 사이클 07 (구현됨 (사이클 07)): 사이클 07에서 넣은 2,394곳(가입 조건 미조사 포함)도 목록에 들어가고 `eligibility`에 `UNSURVEYED`(가입 조사 상태 `MEMBERS_ONLY`·`NOT_SURVEYED`) [확정] (ADR-0053), 항목에 `joinSurvey`, `homepageUrl`, `logoUrl`(`/library-logos/{logo_file}`, `logo_file`이 있고 `logo_visible`일 때만, 아니면 null) 추가 [확정] (사용자 승인, 2026-10-05, 설계 검토; 이름 dev 구현 확인, 2026-10-05) (ADR-0059). 목록을 통째로 받는 방식 유지 + gzip (ADR-0058). 사이클 08 (구현됨 (사이클 08)): 항목에 `mobileSiteDiffers`(boolean, 폰에서 사이트가 다르게 보임, `library.library.mobile_site_differs`) [확정] 칸 (사용자 승인, 2026-10-10), 이름 [확정] (dev 구현 확인, 2026-10-11). 13곳만 true (AC-20). 예: `{"id": 230, "name": "동대문구립도서관(YES24)", ..., "mobileSiteDiffers": true}` (사이클 08까지의 이름). 교보 대여·혼합 11곳(2664~2674)은 목록에서 빠짐(seed에서 지움, ADR-0067). 도서관 이름은 고친 이름(이름 고침 8곳, changeset `library/013`). 크기: 2,672곳에 압축 전 671,376바이트, gzip 61,152바이트 [확정] (dev 측정, 2026-10-05, 로컬 nginx; 추정 약 460KB / 40KB보다 큼 — 항목에 `joinSurvey`·`homepageUrl`·`logoUrl`이 더해짐). 예(사이클 08까지의 이름): `{"id":412,"name":"강동대학교 (북큐브)","eligibility":"UNSURVEYED","matchedBy":[],"visitRequired":false,"cautioned":false,"eligibilitySummary":null,"joinSurvey":"MEMBERS_ONLY","homepageUrl":"https://…","logoUrl":null}` (예시 값, 실제 dev 응답이 아님. 칸 순서도 dev 응답 기준이 아님). 사이클 09 — 구현됨 (사이클 09) (ADR-0071·0076): `name`은 기관 이름만(끝의 업체·대출 방식 괄호 없음), 항목에 `vendor`(string, `KYOBO`/`YES24`/`BOOKCUBE`/`ALADIN`/`PORTAL`/`IN_HOUSE`), `lendingModel`(string `OWNED`/`SUBSCRIPTION`/`MIXED`/`RENTAL`, 통합 포털은 `null`), `orderNo`(number, 1 이상) [확정] 칸 이름 (사용자 승인, 2026-10-11). 세 칸은 레코드 끝, `mobileSiteDiffers` 뒤에 `vendor`, `lendingModel`, `orderNo` 순서 [확정] (dev 구현 확인, 2026-10-12, `LibraryEligibility.java:21-24`). 다른 칸·요청 그대로. 우리말 글자("교보 · 소장", "· 2번째 사이트")는 웹이 만듦: `KYOBO` 교보, `YES24` YES24, `BOOKCUBE` 북큐브, `ALADIN` 알라딘, `PORTAL` 통합 포털, `IN_HOUSE` 자체 / `OWNED` 소장, `SUBSCRIPTION` 구독, `MIXED` 혼합, `RENTAL` 대여 [확정]. 응답 크기: 압축 전 737,300 → 874,306바이트(+18.6%), gzip 52,686 → 53,049바이트(+0.7%) [확정] (dev 측정 2026-10-12, 사용자: "응답 크기 그대로 괜찮아"). 앞으로 비교 기준은 0단계 값(737,300 / gzip 52,686) [확정] (사용자 승인, 2026-10-12, `docs/cycles/09-library-naming/easy/2026-10-12-retro-decisions.html` #6) — 위 사이클 08 기록(671,376 / 61,152)과는 칸 수·잰 방법이 달라 비교하지 않음. gzip은 서버가 아니라 nginx가 함. 예: `{"id":230,"name":"동대문구립도서관","eligibility":"…","vendor":"YES24","lendingModel":"OWNED","orderNo":1}`, `{"id":339,"name":"부산광역시 전자도서관","vendor":"BOOKCUBE","lendingModel":"SUBSCRIPTION","orderNo":1}`, `{"id":6,"name":"부산광역시 전자도서관","vendor":"PORTAL","lendingModel":null,"orderNo":1}` (예시 값, 번호 6은 예시용 [확인 필요: 실제 부산 통합 포털 번호]) |
| GET | `/api/v1/ebook-searches/stream?{title\|author\|publisher}=&residenceRegionIds=&workRegionIds=&filter=&scope=&visit=&libraryIds=` | `availability` | 조회 계획 + 첫 묶음 (SSE, ADR-0014). 이벤트: `targets`(전체 계획, 순서대로) → `library-requested` / `library-result` / `library-failed` … → `batch-done` → `row-verdict` … → `done`. `filter=all\|available`(서버는 없으면 all). 웹의 결과 거르기 기본값은 "지금 빌릴 수 있는 책만"이라 첫 요청부터 `filter=available`을 보냄. 웹 주소는 기본값이면 매개변수 없음, "전체"일 때만 `filter=all`(예전 `filter=available` 주소도 "지금 빌릴 수 있는 책만") [확정] (사용자, 2026-10-05: "정렬이 지금 빌릴 수 있는 책만이 기본으로 하고 / 왼쪽에 나오도록 해줘", 해석 확인 "응"). 사이클 04의 "기본 전체" [안]을 바꿈. `scope=all\|joinable`(없으면 all): `joinable`이면 가입이 확정된 도서관(`OPEN`/`ELIGIBLE`)만 계획에 남김 (C2-U-10). 추가 문구(`extraConditionText`, 예: 책이음)는 참고 글일 뿐 판정·범위에 영향 없음 (C3-U-2). `visit=any\|none`(없으면 any): `none`이면 방문 가입 도서관(`visitRequired`)을 계획에서 빼서 요청하지 않음 (C3-U-1, ADR-0027). `any`일 때 계획 순서는 ADR-0027(가입 가능한 방문 가입 도서관은 방문 없는 가입 가능 도서관 모두 뒤). 지역 ID는 쉼표 구분, 필드당 최대 20개. `libraryIds`(직접 추가 도서관, 아래 "직접 추가 도서관 `libraryIds`") — 구현됨 (사이클 06). 사이클 07 (구현됨 (사이클 07)): 요청 모양 그대로, `targets.libraries[]`의 `eligibility`에 `UNSURVEYED`, `platformType`에 `BOOKCUBE_FX`·`ALADIN_V1`, 새 칸 `joinSurvey`·`logoUrl`. 미조사 도서관은 `libraryIds`에 있을 때만 계획에 들어감 [확정] (ADR-0053). 웹은 검색 범위 기본값이 가입할 수 있는 쪽이라 로그인 전 첫 요청에도 `scope=joinable`을 붙임(API 기본값 all은 그대로, 사이클 06 AC-14와 달라짐) [확정] (사용자: "이 프로젝트의 편의성을 생각했을 때 가입할 수 있는 곳으로 가는 것이 사용자 측면에서 좋다고 봐서", 2026-10-05). 동시 검색이 다 차면 503 `server_busy`, nginx IP별 한도를 넘으면 429 `too_many_requests`(위 "요청 수·응답 크기 제한") |
| GET | `/api/v1/ebook-searches/batches/stream?{title\|author\|publisher}=&filter=&batchNo=&candidates=libraryId:page,…` | `availability` | 다음 묶음 (SSE). 브라우저가 계획에서 고른 후보(최대 K=50 [안])만 조회. 이벤트는 위에서 `targets`를 뺀 것. `batchNo`는 2 이상, 쪽 번호 최대 5자리. 조회 후보는 `candidates`로만 정함(후보가 이미 계획에서 나옴). 사이클 15부터 기록용 쿼리 값 `scope`·`visit`·`residenceRegionIds`·`workRegionIds`·`libraryIds`도 받음 — `search_more`에 남기기만 하고 조회 범위에는 쓰지 않음, 틀린 값이어도 400 없이 그 칸만 비움 [확정] (사용자: "그래 이대로 해", 2026-10-14; dev `EbookBatchStreamController.java` 40~44행) |
| GET | `/api/v1/availability/libraries/{libraryId}/ebooks?{title\|author\|publisher}=&page=` | `availability` | 도서관 하나의 한 페이지 (도서관별 더 보기). 판정이 나중에 정해지는 줄은 판정을 읽은 뒤(최대 30초) 응답. `page`가 없으면 1. 사이클 15부터 기록용 쿼리 값 `filter`·`scope`·`visit`·`residenceRegionIds`·`workRegionIds`·`libraryIds`도 받음 — `search_more`에 남기기만 하고 응답에는 쓰지 않음, 틀린 값이어도 400 없이 그 칸만 비움 [확정] (사용자: "그래 이대로 해", 2026-10-14; dev `LibraryEbookController.java` 69~73행) |
| GET | `/api/v1/books?title=&author=&publisher=&exact=&roles=&sort=&residenceRegionIds=&workRegionIds=&scope=&visit=&libraryIds=&page=&pageSize=` | `catalog` | 수집 목록 책 검색 (도서관 요청 없음). 채운 칸끼리 AND, 칸 안은 띄어쓰기로 나눈 단어 AND(정리값 비교), `exact`(title,author,publisher), `roles`(translator,illustrator,editor), `sort`(default\|newest\|oldest). `pageSize` 1~20(기본 20; 사이클 20에서 기본 10을 설정 속성 하나로, 최대 20 그대로, 웹은 `pageSize`를 보내지 않음 — 설계됨(미구현, 사이클 20, 1단계) [확정] (세 관점 검토 #23·#30)), `page` 1 이상. 검증 순서 조건 칸 → `exact`·`roles`·`sort` → `scope`·`visit` → `page`·`pageSize` → 지역. `errors[].code`: `required`, `duplicate`, `invalid_format`, 지역 `too_many`, 칸 길이는 `invalid_query`. 채우지 않은 칸의 `exact`와 저자 칸 없는 `roles`는 무시(오류 아님, dev 결정). 응답: 페이지 객체 + `collectedFrom`·`collectedTo`(결과 전체의 책을 가진 계획 도서관 기준, 한국 날짜). 계획 도서관이 없는 책은 뺌. 검색어의 `%`·`_`는 이스케이프. 구현됨. 사이클 06: `libraryIds`를 받고, 정렬 첫 키가 `joinTier` `CHOSEN`(항목 `joinTier: "CHOSEN"`) — 구현됨 (사이클 06). 검증 순서(사이클 06 기준): 조건 칸 → `exact`·`roles`·`sort` → `scope` → `visit` → `libraryIds` → `page`·`pageSize` → 지역 [확정] (dev 구현 확인, 2026-10-05). `/books`에는 `filter`가 없음. 사이클 07 (구현됨 (사이클 07)): 응답 모양 그대로, 계획 도서관 번호 배열 `:planned`로 `b.library_ids && :planned` 거르기, 등급·도서관 수·기준일은 `unnest(b.library_ids)`와 계획을 맞춰 구하고 `holding`은 읽지 않음 [확정] (ADR-0055). 계획 도서관이 50곳 [안] 이하면 GIN `book_library_ids_gin`으로 거르고, 넘으면 GIN 없이 거름(제목·출판사·사람 인덱스가 찾은 줄만) — [이유 미확인: dev가 정함] (385곳에서 GIN 1.4초 → 바꾼 뒤 393ms, 결과 57개 같음), 회고에서 그대로 둠 [확정] (사용자 승인, 2026-10-05). 책 한 권(`/books/{bookId}`)은 그대로 `holding`을 읽음. 목표: 정해 둔 검색어 묶음("사랑", "소년", "해리", "역사", "김영하", "민음사", 제목+저자 AND 2개, 출판일순 1개)에서 첫 쪽 1초 안 [확정] (spec R7-1, 사용자 승인 2026-10-05) — 결과 가장 느린 첫 쪽 393ms, 통과 (dev 측정, 2026-10-05) |
| GET | `/api/v1/books/{bookId}?…&libraryIds=` | `catalog` | 책 하나(S3): 대표 서지, `holdingLibraryCount`(범위·방문 반영), `libraries[]{libraryId, collectedAt(+09:00)}`. 없는 책·숫자가 아닌 id 404 `book_not_found`. 구현됨. `libraryIds`도 구현됨 (사이클 06) |
| GET | `/api/v1/book-availabilities/stream?bookIds=&residenceRegionIds=&workRegionIds=&filter=&scope=&visit=&libraryIds=` | `availability` | 책을 가진 계획 도서관의 상세 페이지를 읽는 소장 단위 스트림. `bookIds` 최대 20 [안]. 검증 순서 `bookIds` → `filter` → `scope` → `visit` → 지역, id 목록 오류 `required`/`invalid_format`/`duplicate`/`too_many`. 이벤트 `targets`(`libraries[]`는 계획 전체가 아니라 **소장이 있는 계획 도서관만**(dev 결정), `holdings[]{holdingId, bookId, libraryId}`는 `bookIds` 순서·한 책 안은 계획 순서) → `holding-requested` / `holding-result`(`item`은 페이지 줄과 같은 모양, `rank` 0, `titleKey` `book:<bookId>`, `cached`는 3분 캐시) / `holding-failed` → `batch-done` → `done`. `row-verdict` 없음. 교보 구독형은 요청 없이 `SUBSCRIPTION`. 호스트가 다른 `detail_url`은 요청 없이 `holding-failed` `upstream_error`. 꺼진·없는 도서관은 `library_not_found`. 소장 번호가 지금 목록에 없으면(가져오기로 빠진 소장) `holding-failed` `holding_not_found`로 나눔 [확정] (사용자 승인, 2026-10-11, ADR-0070) — 구현됨 (사이클 08) (사이클 07까지는 둘 다 `library_not_found`). 소장 번호는 가져오기 뒤에도 같은 소장이면 그대로라 바꿔 끼우기 전에 연 화면의 남은 소장은 정상으로 답함(ADR-0070). 캐시 키 `(libraryId, detailUrl)`. 구현됨. `libraryIds`(검증은 `visit` 다음, 지역 앞)와 `targets.libraries[].chosen`도 구현됨 (사이클 06). 사이클 07 (구현됨 (사이클 07), ADR-0056): 북큐브(`BOOKCUBE_FX`)는 상세 주소 `/product/view/?num=`을 같은 호스트의 XML `/xml/productView/?num=`로 바꿔 읽음(`detailFetchUri`), 북큐브 대여형은 `SUBSCRIPTION`, 교보 구독형 화면이어도 `lending_model = OWNED`인 도서관만 요청해서 상세 쪽의 숫자를 읽음(그 밖은 요청 없이 `SUBSCRIPTION`), 알라딘(`ALADIN_V1`)은 상세 HTML "보유현황". `targets.libraries[]`에 `joinSurvey`·`logoUrl`. 사이클 08 (구현됨 (사이클 08), ADR-0066): 소장은 계획에 든 도서관 줄만 DB에서 읽음(`CatalogHoldings.holdingsOf(bookIds, libraryIds)`, 옛 `holdingsOf(bookIds)`는 지움), 응답 모양 그대로. 바꿔 끼우기 전에 받은 소장 번호로 바꿔 끼운 뒤 다음 묶음을 불러도 정상 (AC-8c). **사이클 10 — 구현됨 (사이클 10)**: 선택 파라미터 `holdingLimit` [확정] (dev 구현 확인, 2026-10-12) — 1~20 정수. 있으면 그 책을 가진 계획 도서관 소장 가운데 **앞의 N개만** `targets.holdings[]`에 넣고 그것만 요청함. 책이 여럿이면 계획 순서 → 책 순서 → 원래 자리로 앞의 N개를 고르고, 보내는 순서는 원래 순서 그대로. 없으면 지금과 같음(기존 화면 영향 없음) [확정 동작] (사용자: "가. 앞의 3곳만 확인 이걸로 해줘 api좀 손봐줘", 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-handoff-review.html` #1). 검증 [확정] (dev 구현 확인, 2026-10-12): 1~20 정수만(`007`, `3.0`, `0`, `21`은 400 `validation_error`, `field: holdingLimit`, `invalid_format`), 두 번 → `duplicate`, 빈 값은 없는 것과 같음. 지역 형식 검사 뒤, 계획 만들기(422 `invalid_region`) 앞에서 검사. 다음 묶음(`…/batches/stream`)은 이 옵션의 영향을 받지 않음, 웹은 첫 묶음만 씀. 사서추천도서(사이클 10 인기 도서) S14가 `holdingLimit=3`으로 부름. 사이클 21 — 구현됨 (사이클 21, 회고 2026-10-17): 추천도서 세 목록 S14는 첫 3곳에 지금 빌릴 수 있는 곳(`AVAILABLE`)이 없고 더 볼 도서관이 있으면 같은 요청을 `holdingLimit` 6 → 10 → 20으로 다시 부름(앞서 본 도서관은 서버 캐시 3분에서) [확정] (사용자, 2026-10-17) |
| GET | `/api/v1/book-availabilities/batches/stream?filter=&batchNo=&candidates=holdingId,…` | `availability` | 다음 묶음 (K=50 [안]). 구현됨. 사이클 20 — 설계됨(미구현, 사이클 20, 1단계): 웹이 자동으로 이어 부르는 것은 첫 묶음 포함 최대 3묶음, 그 뒤는 「더 보기」를 누를 때 [확정] (전반 점검 #7, ADR-0132) |
| GET | `/api/v1/lookup-status` | `availability` | **사이클 20 — 설계됨(미구현, 사이클 20, 1단계)** (ADR-0118). 조회 상태 신호 값, 도서관을 부르지 않음, 인증 없음. 아래 "조회 상태와 확장 모드 계획" |
| POST | `/api/v1/lookup-plans/searches`·`/holdings`·`/more`, `/{planId}/items/{itemId}`, `/{planId}/close` | `availability` | **사이클 20 — 설계됨(미구현, 사이클 20, 2단계)** (ADR-0119). 확장 모드 계획·받은 원본 올리기·닫기. 아래 "조회 상태와 확장 모드 계획" |
| GET | `/api/v1/picks/{listKey}?residenceRegionIds=&workRegionIds=&scope=&visit=&libraryIds=` | `picks` | **사이클 21 — 구현됨 (사이클 21, 회고 2026-10-17)** (ADR-0126). 추천 목록 하나: `listKey` = `librarian`(사서 추천도서)·`leedongjin`(이동진 추천도서)·`snu100`(서울대 100선). 인증 없음. 계획 파라미터는 아래 사이클 14 `GET /api/v1/picks`와 같음. 200 `{list, fetchedAt, categories[]}`, 목록이 없으면 빈 `categories`. 오류 404 `list_not_found`, 400 `validation_error`, 422 `invalid_region`, 500 `internal_error` (ProblemDetail) [확정] (ADR-0126). 모양·칸 뜻은 아래 "추천도서 세 목록" |
| ~~GET~~ | ~~`/api/v1/picks?residenceRegionIds=&workRegionIds=&scope=&visit=&libraryIds=`~~ | `picks` | 사이클 21에서 지움 — 구현됨 (사이클 21, 회고 2026-10-17) (배포 전, 웹만 부름, ADR-0089 선례; 웹 `/picks`는 `/picks/librarian`으로 넘김). 아래는 사이클 14 구현 기록. **사이클 14 — 구현됨 (사이클 14, 회고 2026-10-14)** (ADR-0089·0090). `/api/v1/popular-books`(사이클 10)를 대체했고 옛 경로는 지움. 최근 12번 사서추천(추천 연월이 다른 최근 12개 달, 약 2년, 분류별) + 전자책 있음/없음 [확정] (사용자 결정, dev 2026-10-14; 처음 6번). 측정: 강서구 계획 p50 27.4ms·p95 35.9ms, 응답 51,207바이트(108권, 분류 6개) (dev, 2026-10-14). 인증 없음 [확정] (spec R7-3). 계획 파라미터는 `/api/v1/books`와 같은 이름·검증 규칙, 페이지 없음. 서버가 `LibraryCatalog.planSearch`로 계획 도서관을 만들고(실패 422 `invalid_region`) 공용 캐시의 목록과 책별 `(bookId, libraryIds)`로 `available`을 요청마다 계산. 200 `{fetchedAt, categories[{code, name, books[{recomNo, category, recommendedMonth, title, coverUrl, bookId, available}]}]}` — 모양·칸 뜻은 아래 "사서추천도서". 목록이 없으면 200 `{"fetchedAt": null, "categories": []}` [확정]. 오류 400 `validation_error`, 422 `invalid_region`, 500 `internal_error` (ProblemDetail). 도서관 사이트를 부르지 않으므로 nginx `limit_req` 대상 아님 |
| GET | `/api/v1/picks/covers/{coverId}` | `picks` | 사이클 21: 그대로, 세 목록 표지를 함께 줌(이동진·서울대 표지는 수집기가 줄여 가져오기로 넣음, ADR-0123) — 구현됨 (사이클 21, 회고 2026-10-17). **사이클 14 — 구현됨 (사이클 14)** (ADR-0091). `/api/v1/popular-books/covers/{coverId}`를 대체(옛 경로 지움). 저장한 국립중앙도서관 표지(폭 200px JPEG로 줄인 것). 인증 없음. 200 그림(`Content-Type: image/jpeg`), `Cache-Control: public, max-age=2592000, immutable`(30일) [확정]. 없으면 404 `cover_not_found` [확정] → 웹은 제목 글자. 도서관 사이트를 부르지 않으므로 nginx `limit_req` 대상 아님. CSP는 바꾸지 않음(우리 주소) |
| GET | `/api/v1/join-surveys/latest` | `collection` | **사이클 13 — 구현됨 (사이클 13, 회고 2026-10-14)** (ADR-0087·0093). 가입 조건 조사 기준일: 성공한 넣기 실행 기록(`collection.library_insert_run`, `status = 'SUCCEEDED'`) 중 `join_surveyed_on` 최댓값 [확정] (dev 구현 확인, 2026-10-14). 내 PC·운영 흉내 DB 모두 `2026-10-05` (AC-4·AC-7). 경로 [확정] (ADR-0093). 요청 파라미터 없음, 인증 없음(`SecurityConfiguration`은 `/api/v1/me/**`만 보호). 200 `{"surveyedOn": "2026-10-05"}`(`YYYY-MM-DD`), 기록이 없으면 200 `{"surveyedOn": null}`. 오류는 일반 500 `internal_error`(ProblemDetail). `collection` 컨트롤러(Java 공개 API는 없음). `/libraries`에 싣지 않음(큰 목록 약 874KB [안: architect 추정, 재지 않음], `library → collection` 의존 고리) (ADR-0087). 운영 DB에서도 값이 나오도록 운영 반영이 실행 기록 줄을 옮김 (ADR-0093, AC-7). 웹 S12 `/about`이 "가입 조건은 {YYYY}년 {M}월에 조사한 내용입니다."로 보임, 로딩 중 비움, `null`·오류면 줄 없음 [확정] (flow S12). 도서관 사이트를 부르지 않으므로 nginx `limit_req` 대상 아님 |
| POST | `/api/v1/usage-events` | `usagelog` | **사이클 15 — 구현됨 (사이클 15, 회고 2026-10-15)** (ADR-0097). 사용 알림(도서관 클릭·화면 행동)을 한 주소로 받음, 늘 204. 아래 "사용 알림" 절 |
| GET | `/api/v1/notices?page=` | `sitecontent` | **사이클 16 — 구현됨 (사이클 16, 회고 2026-10-15)** (ADR-0098). 공지 목록 10개씩, 1쪽이면 고정 공지를 `pinned`에. 아래 "공지·안내·약관 글" 절 |
| GET | `/api/v1/notices/{noticeId}?version=` | `sitecontent` | **사이클 16 — 구현됨 (사이클 16, 회고 2026-10-15)** (ADR-0098). 공지 글 한 판 + 판 목록. 아래 "공지·안내·약관 글" 절 |
| GET | `/api/v1/documents/{documentKey}?version=` | `sitecontent` | **사이클 16 — 구현됨 (사이클 16, 회고 2026-10-15)** (ADR-0098·0100). 서비스 안내·이용약관·처리방침·동의문 한 판 + 판 목록. 아래 "공지·안내·약관 글" 절 |
| POST | 조회 서비스 `/v1/fetches` (내부) | 조회 서비스 | URL 한 개를 GET으로 가져와 `{outcome, status, contentType, location, body(base64), startedAt, endedAt}`. `outcome`: `RESPONDED \| TIMEOUT \| CONNECT_FAILED \| ERROR`. 조회 서버 자신이 정상이면 항상 200. 401 토큰 없음·틀림(헤더 `X-Fetch-Token` [안, 임시]), 400 잘못된 URL·사설 주소, 503 과부하·종료 중 (ADR-0015) |

- 책 검색 저자 칸 — 구현됨 (사이클 19, 회고 2026-10-18) (ADR-0113, spec R1-4): `GET /api/v1/books`의 `author` 검색어에도 가져오기와 같은 기호 떼기(`Contributors.stripMarks`: `<`·`>`·`＜＞` 모두, `〈〉「」《》` 표시만)를 함 → "<김정은>"과 "김정은"이 같은 결과(정확 일치·단어 모두; 반영 뒤 단어 60·정확 59로 같음, dev 확인 2026-10-16). 기호뿐인 저자 검색어(「<>」)의 단어 검색은 결과 없음(dev `BookQuery`). 요청·응답 모양·오류 코드 그대로, 값만 바뀜(`author_display`에 기호 없음·붙은 역할 띄움). 합쳐져 사라진 책 번호는 지금처럼 404 `book_not_found`(ADR-0062). `POST /api/v1/usage-events`와 도서관 직접 찾기·더 보기(`/api/v1/ebook-searches/…`, `/api/v1/availability/libraries/{id}/ebooks`)도 바깥 모양 그대로(캐시 답 셈은 서버 안쪽만, ADR-0116)

## 추천도서 세 목록 (`picks`) — 구현됨 (사이클 21, 회고 2026-10-17)

근거 `docs/cycles/21-recommended-books/design-delta.md` "API", ADR-0126·0129. 아래 사이클 14 `GET /api/v1/picks`를 목록별 주소로 바꿉니다. 적지 않은 규칙(계획 파라미터·`available`·`coverUrl`·분류 0권은 뺌)은 사이클 14 그대로입니다 [확정] (ADR-0126).

| 메서드 | 경로 | 설명 | 요청 | 응답 | 오류 |
|---|---|---|---|---|---|
| GET | `/api/v1/picks/{listKey}` | 목록 하나 (인증 없음) | `listKey` = `librarian`·`leedongjin`·`snu100`, 계획 파라미터 `residenceRegionIds`·`workRegionIds`·`scope`·`visit`·`libraryIds` (사이클 14와 같음) | 200 `{list, fetchedAt, categories[]}`. 목록이 없으면 빈 `categories` | 404 `list_not_found`, 400 `validation_error`, 422 `invalid_region`, 500 `internal_error` (ProblemDetail) |
| GET | `/api/v1/picks/covers/{coverId}` | 표지 (그대로, 세 목록 함께) | | `image/jpeg` | 404 `cover_not_found` |
| ~~GET~~ | ~~`/api/v1/picks`~~ | 지움 (배포 전, 웹만 부름, ADR-0089 선례) | | | |
| POST | `/api/v1/usage-events` | 사용 알림에 `list` 필수 (`picks_list_view`·`picks_book_view`) | | 그대로 | 틀리면 `rejected_event` (그대로) |

`GET /api/v1/picks/leedongjin` 200 (예):

```json
{
  "list": "leedongjin",
  "fetchedAt": null,
  "categories": [
    {
      "code": "ALL",
      "name": "전체",
      "books": [
        { "id": "57", "category": "science", "title": "히스토리아 비테이", "listTitle": null,
          "coverUrl": "/api/v1/picks/covers/140", "bookId": 1203344, "available": true,
          "recommendedMonth": "2026-06", "yearBook": null, "videoId": "<video-id>", "tocNo": null }
      ]
    }
  ]
}
```

- `list`: 요청한 목록 이름 [확정] (ADR-0126)
- 책 칸: 사서 `id` = `source_no`(사이클 14 `recomNo`), `recommendedMonth`만 값. 이동진 `id` = `list_book.id`(목록을 바꿀 때마다 새로 매김), `recommendedMonth`·`yearBook`·`videoId`. 서울대 `tocNo`. `fetchedAt`은 사서만(마지막 성공 받기, Asia/Seoul 오프셋 ISO 8601, 초 단위), 이동진·서울대는 null [안: 칸 이름] — 칸 이름·뜻이 dev `PicksController.java` 138~158행과 같음 (회고 2026-10-17)
- `title` = 화면 이름(맞춘 우리 책 제목에서 판 표시를 덜어 낸 이름, 못 맞추면 목록 이름), `listTitle` = 목록 이름이 `title`과 다를 때만 값 [안: 칸 이름] (ADR-0129). 웹은 `listTitle`을 화면에 쓰지 않음(책 창 "목록 이름" 줄을 뺌) [확정] (사용자, 2026-10-17: "목록 이름 아예 다 빼줘 무의미한것 같아"); 칸은 응답에 남음
- 웹은 아는 목록 이름(`librarian`·`leedongjin`·`snu100`)일 때만 이 API를 부르고, 모르는 이름의 주소는 아무것도 보이지 않음 [안] (dev `picksLists.ts` `picksList`)
- 칸 바뀜: `recomNo` → `id`(글자). 배포 전·웹만 부름 [안]
- `bookId`: 이동진·서울대는 export 때 맞춰 저장한 책 번호(못 맞추면 null), 사서는 사이클 14처럼 캐시 때 ISBN → 본제목+첫 저자로 맞춤. 후보가 여럿이면 `BookChoice`(켜진 도서관만, 구독형 아닌 수 + 켜진 구독형이 하나라도 있으면 1, 같은 세트는 한 판으로 보고 고른 세트의 1권, 같으면 책 번호 작은 것) [확정] (ADR-0124·0125)
- 분야 순서: 목록별 `list_field.position`(이동진 「전체」 + 9분야, 서울대 「전체」 + 5분야, 사서 사이클 14 그대로), 책 0권인 분야는 뺌 [확정] (spec R5)
- 사용 알림 예: `{"type":"picks_list_view","list":"snu100","category":"korean_lit"}`
- 위 값(번호·영상 ID)은 예시 값

## 조회 상태와 확장 모드 계획 (`availability`) — 설계됨(미구현, 사이클 20)

근거 `docs/cycles/20-lookup-status-and-extension/design-delta.md` "API"·"외부 연동"·"개발 단계", ADR-0118·0119·0131·0132. 괄호 = dev 단계. 흐름은 `flows.md` 흐름 49~51.

| 메서드 | 경로 | 설명 | 요청 | 응답 | 오류 |
|---|---|---|---|---|---|
| GET | `/api/v1/lookup-status` (1) | 상태 신호 값. 도서관을 부르지 않음. nginx 일반 구역. 서버 1초 메모. 웹은 탭이 보이는 동안 10초마다(확장 모드에서는 묻지 않음) | 없음 | 200 `{slots, inUse, level, reason, queuedLibraryIds[≤200], serverTime}`, `Cache-Control: no-cache`. `slots` = 40 [확정] (전반 점검 #13). `level` = `GREEN`\|`YELLOW`\|`RED`\|`GRAY`(R1: 20 노랑·40 빨강; `GRAY`는 최근 30초 DB 오류 [확정] 전반 점검 #9, 빨강·노랑보다 앞섬 [확정] (사용자 승인, 2026-10-17, 설계 검토 #4)). `reason` = `NONE`\|`VENDOR_PAUSED`\|`NO_LANE` [확정] (검토 #28) \| `DB_ERROR` [안: 값 이름] | — |
| POST | `/api/v1/lookup-plans/searches` (2, 끝 이름 [안]) | 확장 모드 검색 묶음 계획. 검색 자리를 잡지 않음(3단계 서버 대행 목록 도서관이 있을 때만 1개). 캐시를 보지 않고 모든 도서관 주소를 줌 [확정] (설계 결정 #9) | JSON `{title\|author\|publisher, residenceRegionIds, workRegionIds, filter, scope, visit, libraryIds, batchNo?, candidates?, replaces?[planId]}`. `replaces`는 같은 사람(2단계 같은 IP /64, 3단계 같은 브라우저 번호)이 만든 계획만 지움 [확정] (검토 #18·#22·#32, 전반 점검 #1). CSRF 머리 `X-XSRF-TOKEN`(로그인 기능 켜짐일 때). (3단계) 브라우저 번호 쿠키를 브라우저가 붙임 | 201 `{planId, batchNo, deadlineMs:8000, rowLimit:10, targets?(첫 묶음), items[{itemId, libraryId, page, url}], events?[서버 대행 도서관 결과]}` + (3단계, 새 번호일 때만) `Set-Cookie`(HttpOnly·Secure·SameSite=Strict·`Path=/api/v1/lookup-plans`·`Max-Age` 86400, 이름 [안]). 본문에 번호 없음 | 400 검증(지금과 같음), 403 `csrf_invalid`, 429 nginx 계획 구역 또는 (3단계) 공인 IP 울타리 `lookup_ip_limited` → 화면 「잠시 후 다시」, 서버 모드로 넘기지 않음 [확정] (검토 #31), 503 계획 보관함 가득 → 그 검색만 서버 모드 [확정] (검토 #8) |
| POST | `/api/v1/lookup-plans/holdings` (2, 끝 이름 [안]) | 책 화면(소장) 계획, items는 상세 주소. S14는 `holdingLimit`을 함께 보냄. 이어 부르기는 첫 묶음 포함 최대 3묶음 [확정] (전반 점검 #7) | `{bookIds, …, holdingLimit?, batchNo?, candidates?(holdingId), replaces?}` | 같은 모양(이벤트는 `holding-*`) | 같음 |
| POST | `/api/v1/lookup-plans/more` (2, 끝 이름 [안: dev가 맞춤]) | 「더 보기」 계획. 도서관 번호는 본문으로 | `{libraryId, title\|…, page}` | `{planId, items[1]}` | 같음 |
| POST | `/api/v1/lookup-plans/{planId}/items/{itemId}` (2) | 확장이 받아온 원본 올리기 | 본문 `application/octet-stream`(원본 그대로, `Content-Encoding` 있으면 거절), 쿼리 `status`·`ms`·`outcome=RESPONDED\|TIMEOUT\|ERROR`·`contentType`. URL은 받지 않음. 2단계: 지금 IP(/64) = 계획을 만든 IP, 3단계: 번호 쿠키가 장부에 있고 받은 IP = 지금 IP, 계획을 만든 번호와 같음 | 200 `{events[library-result\|library-failed\|row-verdict\|holding-*], detailItems[{itemId, libraryId, url, kind:DETAIL}], stop}`. 해석 실패·status≠200·`outcome` TIMEOUT/ERROR도 200 `library-failed`(캐시 안 넣음) | 400 `invalid_plan`, 400 `client_ip_changed`, 400 `invalid_client_key`(3단계), 403 `csrf_invalid`, 413 `payload_too_large`, 415 `unsupported_media_type`(Content-Encoding), 429(nginx 올리기 한도, 3단계 번호 잠금), 503 `server_busy`(해석 자리 8을 2초 못 얻음 → 그 도서관만 「확인하지 못한 도서관」) [확정] (검토 #7, 전반 점검 #4) |
| POST | `/api/v1/lookup-plans/{planId}/close` (2) | 묶음 끝·화면 떠남(떠날 때는 `keepalive`) | `{notSent:[itemId]}` + 같은 IP(2단계) / 번호 쿠키(3단계) | 200 `{events:[batch-done]}`(사용 기록 `SKIPPED`·`recordSearch`는 여기서) | 400 `invalid_plan`, 400 `client_ip_changed`, 400 `invalid_client_key`, 403 `csrf_invalid` |

- 주소는 모두 `/api/v1/lookup-plans` 밑 [확정] (전반 점검 #11; 설계 결정 #6의 `…/ebook-searches/plans`·`…/book-availabilities/plans`·`…/availability/libraries/{libraryId}/ebooks/plans`를 바꿈)
- 올리기 검사 순서(본문을 읽기 전에 거절): `Origin`(없으면 `Referer`)을 설정의 허용 origin과 대조 → (3단계) 번호가 장부에 있음 → 받은 IP = 지금 IP / (2단계) 계획을 만든 IP = 지금 IP → (3단계) 번호 잠금 → 계획·쪽 번호·처음 받음·(3단계) 같은 번호 → `Content-Length` ≤ 상한·`Content-Encoding` 없음 → 해석 자리 → 상한까지만 스트림으로 읽음 → status 200 → adapter 해석(계획 URL 호스트로) → `detailUrl`·`detailItems` 같은 호스트 검사 → 캐시 넣기 규칙 [안] (검토가 고침; 단계 나눔 [확정] 전반 점검 #1)
- 잠금(3단계)에 세는 것 = 모르는 계획 번호·같은 쪽 두 번·Origin 다름만, 1분 30번 → 그 번호 10분 [확정] (검토 #11). 계획 만료·지워짐·IP 바뀜은 400만 줌. 2단계는 잠금 없이 `invalid_plan` 거절 기록만
- 확장 모드는 서버 캐시를 읽지 않고 넣기만 함, 확장 값은 따로 둔 500칸·처음 넣은 시각 + 3분 [확정] (검토 #9·#10, 전반 점검 #2)
- CSRF: 세 POST는 로그인 기능이 켜지면 `X-XSRF-TOKEN`을 요구(웹은 `usageEvents.ts`와 같은 방식). 로그인을 끈 운영에서는 `Origin` 대조 + (3단계) `SameSite=Strict` 번호 쿠키 [안]. CORS는 열지 않음 [확정] (검토 #33)
- nginx: `location ^~ /api/v1/lookup-plans/` 블록 하나, 계획 만들기 세 주소는 계획 구역(공인 IP당 1분 300·몰아서 100), 올리기·닫기는 `client_max_body_size` 1MB·20 r/s(몰아서 60)·IP당 동시 4, `limit_conn_status 429`·`limit_req_status 429`, 413·429는 Problem Details JSON [확정] (설계 #12, 검토 #7·#13·#15, 전반 점검 #11)
- IP는 `UsageLog.capture(request).clientIp()`(nginx `X-Real-IP`)로 읽고 IPv6는 앞 /64로 셈. nginx 한도는 주소 전체로 셈 — 감수 [안]
- 이벤트 이름·데이터는 지금 SSE와 같음. `done`은 상세 단계가 끝나거나 30초가 지나면 화면이 만듦 [확정] (architect 2-3)
- 예시 (값은 예시):

```json
// GET /api/v1/lookup-status → 200
{"slots":40,"inUse":24,"level":"YELLOW","reason":"NONE","queuedLibraryIds":[1215,3301],"serverTime":"2026-10-20T03:00:00Z"}

// GET /api/v1/lookup-status → 200 (최근 30초 DB 오류, 값 이름 [안])
{"slots":40,"inUse":3,"level":"GRAY","reason":"DB_ERROR","queuedLibraryIds":[],"serverTime":"2026-10-20T03:00:00Z"}

// POST /api/v1/lookup-plans/searches → 201 (끝 이름 [안])
{"planId":"Qm9v…","batchNo":1,"deadlineMs":8000,"rowLimit":10,
 "targets":{"libraries":[…]},
 "items":[{"itemId":1,"libraryId":1215,"page":1,"url":"https://…/searchList.ink?schTxt=…"}]}

// 400 (계획 문제만)
{"title":"Bad Request","status":400,"code":"invalid_plan","detail":"plan expired or item already received"}
```

## 사서추천도서 (`picks`, 사이클 14 `GET /api/v1/picks`) — 구현됨 (사이클 14, 회고 2026-10-14). 사이클 21에서 위 `GET /api/v1/picks/{listKey}`로 바뀜 — 구현됨 (사이클 21, 회고 2026-10-17)

근거 `docs/cycles/14-librarian-picks/design-delta.md` "API", ADR-0089·0090·0091. 사이클 10 인기 도서(`popular`, `GET /api/v1/popular-books`)를 대체했습니다(옛 경로·모듈 지움). 응답 칸은 dev `PicksController.java` 130~143행과 같음.

`GET /api/v1/picks` 200 (값이 있을 때):

```json
{
  "fetchedAt": "2026-10-12T05:00:41+09:00",
  "categories": [
    {
      "code": "ALL",
      "name": "전체",
      "books": [
        { "recomNo": "20260922163135829100", "category": "11", "recommendedMonth": "2026-10",
          "title": "…", "coverUrl": "/api/v1/picks/covers/31", "bookId": 1203344, "available": true },
        { "recomNo": "20260928084907621100", "category": "6", "recommendedMonth": "2026-10",
          "title": "…", "coverUrl": null, "bookId": null, "available": false }
      ]
    },
    { "code": "11", "name": "문학", "books": ["…"] }
  ]
}
```

- `categories`: `ALL` → 11 → 6 → 5 → 4 → 425 → (새 코드, 코드 순). 책 0권인 분류는 서버가 뺌 [확정] (R2-3). `name`은 줄인 이름(전체·문학·인문·사회·자연·테마), 새 코드는 API의 `drCodeName`(비면 "기타") [확정] (ADR-0089)
- `books`: 추천 연월 최근 → 등록일 늦은 순(없으면 그 달 맨 뒤) → `recomNo` 글자 큰 순 [확정] (dev `PicksCache.java` 52~55행). 국립중앙도서관 웹 목록과는 같은 달 안 순서가 거의 거꾸로임 — 지금 순서 유지 [확정] (사용자 승인, 2026-10-14, 회고 결정 #22). `category`는 그 책의 분야 코드(S14 "· 문학"), `recommendedMonth` `YYYY-MM`(S14 "2026년 10월 사서추천")
- `fetchedAt`: 마지막으로 성공한 받기(`changed`와 상관없음) [확정] (사용자: "마지막으로 받기 성공한 날 (추천)", 2026-10-12)
- `coverUrl`: 저장된 표지가 있으면 우리 주소, 없으면 null(웹은 제목 글자)
- `bookId`: ISBN, 못 맞으면 본제목+첫 저자로 맞은 우리 책(계획 밖이어도), 없으면 null. 후보가 여럿이면 `libraryIds` 가장 긴 책 → 책 번호 작은 책 [확정] (ADR-0090)
- `available`: `bookId`가 있고 그 책의 `libraryIds`가 계획 도서관과 겹치면 true. 이용자별 계산이라 캐시하지 않음 [확정] (사이클 10과 같은 뜻)
- 사이클 10에서 없어지는 칸: `month`, `rank`. 위 시각·책·표지 번호는 예시 값
- S14·S15용 새 API 없음. S14는 `GET /api/v1/books/{bookId}` + `GET /api/v1/book-availabilities/stream?…&holdingLimit=3`(같은 계획 파라미터). 사이클 21부터 빌릴 수 있는 곳이 없으면 `holdingLimit` 6 → 10 → 20으로 다시 부름 — 구현됨 (사이클 21, 회고 2026-10-17)

## 사용 알림 (`usagelog`) — 구현됨 (사이클 15, 회고 2026-10-15)

근거 `docs/cycles/15-usage-log/design-delta.md` "API", ADR-0096·0097·0102. 처음 설계의 `/api/v1/library-clicks`를 이 주소 하나로 바꿈 [확정] ([늘린 기록 설계](../cycles/15-usage-log/easy/2026-10-13-more-actions-design.html) #1).

| 메서드 | 경로 | 인증 | CSRF | 요청 | 응답 | 오류 |
|---|---|---|---|---|---|---|
| POST | `/api/v1/usage-events` | 없음 (로그인 요구 안 함) | 로그인 기능 켜짐이면 필요(`X-XSRF-TOKEN`), 꺼짐이면 검사 없음 | JSON (아래) | `204`, 본문 없음 | 로그인 기능 켜짐에서 CSRF 표시 없음·틀림 → 403 `csrf_invalid`. 값이 틀려도 `204`(`rejected_event`에 남김). nginx 한도(IP당 60r/m) 초과도 `204` |

`type` 값과 칸 [확정] (dev 구현 확인, design-delta 이름 그대로, 2026-10-15):

| `type` | 칸 | 기록 표 |
|---|---|---|
| `library_click` | `libraryId`, `place`, `screen`, `bookId`? | `library_click` |
| `picks_list_view` | `category`, `list`(사이클 21) | `screen_event` |
| `picks_book_view` | `category`, `bookId`, `list`(사이클 21) | `screen_event` |
| `region_change` | `residenceRegionIds`, `workRegionIds` | `screen_event` |
| `my_library_add`, `my_library_remove` | `libraryId` | `screen_event` |

```json
{ "type": "library_click", "libraryId": 12, "place": "result_card", "screen": "picks", "bookId": 345 }
{ "type": "region_change", "residenceRegionIds": [1114], "workRegionIds": [1102] }
```

- 사이클 21 — 구현됨 (사이클 21, 회고 2026-10-17) (ADR-0126): `picks_list_view`·`picks_book_view`의 `list`(`librarian`·`leedongjin`·`snu100`)는 필수, 없거나 틀리면 `rejected_event`(그대로 204). `screen_event.picks_list`에 남김. 예: `{"type":"picks_list_view","list":"snu100","category":"korean_lit"}` [확정] (ADR-0126)
- `place` 값 `result_card`·`join_link`·`join_guide`·`home_page`·`logo`·`summary_bar`, `screen` 값 `direct_results`·`catalog_results`·`book_page`·`picks`·`my_libraries` [확정]
- 검사: `libraryId`는 켜진 서비스 도서관만, `type`·`place`·`screen`은 정해진 값만. 아니면 `rejected_event`에 이유(`unknown_library`, `invalid_place`, `invalid_screen`, `invalid_book_id`, `malformed`, `unknown_type`, `invalid_value`)와 받은 값(2KB까지)을 30일 남기고 그래도 204 [확정]
- 상한 [확정] (사용자 승인, 2026-10-15, 회고 결정 #4; dev `UsageEventController.java` `MAX_BODY_BYTES = 8 * 1024`): 본문 8KB를 넘으면 `malformed`, 지역 배열 각 20개, 분야 20자, `bookId`가 글자(`"7"`)면 `invalid_book_id`. 받은 값에 NUL 문자가 있으면 글자로 바꿔 넣음 [확정] (dev 시험, 2026-10-14)
- 웹: 공용 함수 `web/src/api/usageEvents.ts` `sendUsageEvent`에서 `fetch` keepalive로 보내고 기다리지 않음, 실패해도 조용함 [확정] (dev 구현 확인, 2026-10-15). 도서관 클릭은 `web/src/lib/libraryClick.ts`. 링크는 새 탭으로 바로 열림. 로그인 기능 켜짐이면 `XSRF-TOKEN`이 없을 때 `GET /api/v1/auth/csrf-token`으로 받아 오고 403 `csrf_invalid`면 한 번 다시(지금 `api/auth.ts` `send` 방식) [확정] (dev 구현 확인, 2026-10-15). 로그인 기능 상태를 아직 모를 때는 쿠키가 있으면 표시를 붙이고 403이면 한 번 더 보냄 [확정] (사용자 승인, 2026-10-15, 회고 결정 #4). 로그인 여부는 보내지 않음(서버가 쿠키로 판별, ADR-0102)
- CSRF: `auth`의 보호 경로(`/api/v1/me/**`, 로그인 요구)에 넣지 않고 CSRF 검사만 받게 함 [확정] (ADR-0102). 지금 `csrf.spa()` 설정이 웹훅 말고 모든 POST를 검사하는 모양이라 고칠 것이 없을 수 있음 → 시험으로 증명함, 고친 것 없음 [확정] (dev 시험, 2026-10-14). 로그인 기능이 꺼져 있으면 Spring Security가 빠져 검사 없음
- 기록 설정 `chaekcheck.usagelog.enabled`(기본 꺼짐) [확정]이 꺼져 있어도 이 주소는 204, 아무것도 남기지 않음 [확정] (dev 구현 확인, 2026-10-15)
- 로봇: nginx가 직접 찾기·대출 조회 스트림과 `/api/v1/availability/` location에서 User-Agent에 `bot`·`crawler`·`spider`가 있으면(map `$chaekcheck_named_bot`) 403 [확정], `robots.txt`(`web/public/robots.txt`)가 `/api/`를 막음 [확정]. nginx 한도는 zone `chaekcheck_usage_events` 60r/m, `burst=20 nodelay`, 넘치면 `@usage_events_limited` → 204 (dev `deploy/nginx/rate-limits.conf` 24~31행). 검색 기록에서도 로봇 이름은 `usagelog`가 버림
- 검색·책 상세·직접 찾기·도서관별 더 보기 요청(`/api/v1/books`, `/api/v1/books/{bookId}`, `/api/v1/ebook-searches/stream`, `…/batches/stream`, `/api/v1/availability/libraries/{id}/ebooks`)은 응답 형식이 바뀌지 않음. 성공하면 서버가 기록을 남김(흐름 34·35). 다음 묶음·도서관별 더 보기는 기록용 쿼리 값을 더 받음(위 표)

## 공지·안내·약관 글 (`sitecontent`) — 구현됨 (사이클 16, 회고 2026-10-15)

근거 `docs/cycles/16-notices-and-policies/design-delta.md` "API", ADR-0098~0101. 흐름은 `flows.md` 흐름 38~40.

로그인 없음, 캐시 없음, 쓰기 API 없음 [확정]. 오늘 = `Asia/Seoul` 날짜, 지금 판 = 시행일 ≤ 오늘인 판 중 순번 최대 [확정].

| 메서드 | 경로 | 설명 | 요청 | 응답 | 에러 |
|---|---|---|---|---|---|
| GET | `/api/v1/notices` | 공지 목록 10개씩, 최신 게시일순(같으면 번호 큰 순). 1쪽이면 고정 공지를 `pinned`에. 없는 쪽은 마지막 쪽으로 맞춤 | `page` (정수 ≥ 1, 기본 1) | 200 | 400 `validation_error` |
| GET | `/api/v1/notices/{noticeId}` | 공지 글. 고친 공지면 `editedOn` | `version` (정수 ≥ 1, 없으면 지금 판) | 200 | 404 `notice_not_found`, 404 `version_not_found`, 400 `validation_error` |
| GET | `/api/v1/documents/{documentKey}` | 문서 글. key = `about`, `terms-of-service`, `privacy-policy`, `privacy-collection` | `version` | 200 | 404 `document_not_found`, 404 `version_not_found`, 400 `validation_error` |

목록 (`?page=99`, 일반 공지 23개 → 3쪽으로)

```json
{ "pinned": [],
  "items": [ { "id": 3, "title": "도서관 12곳을 더했어요", "postedOn": "2026-10-20" } ],
  "page": 3, "pageSize": 10, "totalCount": 23, "hasMore": false }
```

공지 글

```json
{ "id": 7, "title": "점검 안내(시간 바뀜)", "postedOn": "2026-11-03", "editedOn": "2026-11-04",
  "version": { "number": 2, "effectiveOn": "2026-11-04", "current": true, "body": "…" },
  "versions": [ { "number": 2, "effectiveOn": "2026-11-04", "supersededOn": null },
                { "number": 1, "effectiveOn": "2026-11-03", "supersededOn": "2026-11-04" } ] }
```

문서 (`/api/v1/documents/privacy-collection?version=1`)

```json
{ "key": "privacy-collection",
  "version": { "number": 1, "effectiveOn": "2026-10-04", "current": true, "body": "…", "changeSummary": null,
               "consentItems": [ { "label": "목적", "text": "…" }, { "label": "항목", "text": "카카오 회원 식별 번호, …" },
                                 { "label": "보유 기간", "text": "탈퇴 또는 마지막 로그인 뒤 1년" },
                                 { "label": "거부할 권리", "text": "…" } ] },
  "versions": [ { "number": 1, "effectiveOn": "2026-10-04", "supersededOn": null } ] }
```

오류

```json
{ "title": "Not Found", "status": 404, "detail": "No such version",
  "instance": "/api/v1/documents/terms-of-service", "code": "version_not_found" }
```

```json
{ "title": "Bad Request", "status": 400, "detail": "Invalid request",
  "instance": "/api/v1/notices", "code": "validation_error",
  "errors": [ { "field": "page", "message": "must be greater than or equal to 1", "code": "Min" } ] }
```

- `versions`에는 시행 중이거나 지난 판만(앞날 판 빠짐). 웹의 날짜 고르기 칸 문구: 지난 판 "A ~ (B-1일) 적용", 같은 날 바뀐 판 "A 적용 (같은 날 바뀜)", 지금 판 "A ~ 지금" [확정] (사용자 승인, 2026-10-13)
- 숨긴 공지·첫 판이 앞날인 공지는 목록과 주소 모두 404 `notice_not_found`. 판 없음·시행 전 판은 404 `version_not_found`
- 오류 응답에 `type`은 없음(`about:blank`라 생략, 위 "오류 응답" 규칙과 같음) [확정] (dev 구현 확인, 2026-10-15)
- `page`·`version`·`noticeId`가 정수가 아니면 400 `validation_error` `code` `typeMismatch`, 1 미만이면 `Min`, int 범위를 넘으면 `Max` [확정] (dev 구현 `SitecontentParams.java`, 사용자 승인 2026-10-15, 회고 이어서 #1)
- dev가 정한 응답 세부 [확정] (사용자 승인, 2026-10-15, 회고 이어서 #1): 공지가 0개면 `page` 1, `items` [] / 고정 공지(`pinned`) 순서는 일반 공지와 같음(최신 게시일순, 같으면 번호 큰 순) / 옛 판을 볼 때 `title`은 그 판의 제목, `editedOn`은 지금 판 기준
- 오류 처리: 루트 `ApiExceptionHandler`는 그대로, 모듈 오류는 `sitecontent/internal/web`의 `@RestControllerAdvice(basePackageClasses=…)` + `@Order(HIGHEST_PRECEDENCE)`(dev `sitecontent/internal/web/SitecontentErrors.java`)로 400 `validation_error`(`errors[]`: `field`·`message`·`code`), 404 셋 [확정] (dev 방식 따름, 2026-10-14 dev main 확인)
- 이용약관 REST는 로그인 기능이 꺼져도 열어 두고, 웹 경로 `/terms`만 숨김 [확정] (사용자 승인, 2026-10-13). 처리방침은 로그인 기능과 상관없이 공개 [확정] (ADR-0100)
- 웹은 본문(제한된 마크다운)을 `react-markdown` 10.1.0으로 그림 [확정] (dev 설치 시험, 2026-10-14: React 19.3과 경고 없음, JS gzip +38 kB). 그리는 요소는 `allowedElements` h1~h6·p·ul·ol·li·strong·a만, 나머지는 글자로만, 표는 그리지 않음 [확정] (사용자 승인, 2026-10-15, 회고 결정 #7) — 코드 그대로, 바뀐 점·처리방침은 목록으로. `<script>`·`<img onerror>`는 글자로, `javascript:` 링크는 `href`가 빈 값(AC-6). 서비스 안내(S12)는 그 아래에 가입 조사 기준일 한 줄(`GET /api/v1/join-surveys/latest`, 그대로)

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

- 검증 순서: 첫 묶음은 조건 → `filter` → `scope` → `visit` → `libraryIds`(구현됨 (사이클 06)) → 지역, 다음 묶음은 조건 → `filter` → `batchNo` → `candidates`, 도서관별 더 보기는 조건 → `page` → 도서관. 첫 오류 하나만 돌려줍니다.
- 웹 주소도 같은 이름을 씁니다: `/search?author=김달`. 조건이 둘 이상인 주소는 title → author → publisher 순서로 하나만 씁니다 [확정].

## 직접 추가 도서관 `libraryIds` (ADR-0037, ADR-0050) — 구현됨 (사이클 06)

웹이 로그인 뒤 `GET /api/v1/me/libraries`로 받은 직접 추가 도서관 번호를 검색 API에 넘깁니다. 검색 모듈은 회원을 모릅니다(ADR-0037. 그 ADR의 `member`는 `mylibrary`로 읽음).

| 규칙 | 내용 | 상태 태그 |
|---|---|---|
| 받는 API | `GET /api/v1/books`, `GET /api/v1/books/{bookId}`, `GET /api/v1/ebook-searches/stream`, `GET /api/v1/book-availabilities/stream`. 다음 묶음 두 API와 도서관별 더 보기는 그대로(계획에서 나온 후보만 받음). 이 API들은 `findEnabledTarget`으로 대상을 다시 만들어 `chosen=false`이므로, 웹은 첫 `targets`의 값을 유지함 | [확정] (dev 구현 확인, 2026-10-05) |
| 형식 | 쉼표 구분 양의 정수, 최대 20 [확정] (사용자, 2026-10-04). 중복은 합친 뒤 20개를 셈(21개를 보냈는데 하나가 중복이면 통과). 오류는 400 `validation_error`, `errors[].field: libraryIds`, `code` `invalid_format`/`too_many` (지역 ID 규칙과 같게) | [확정] 상한 (사용자) / [확정] 나머지 (dev 구현 확인, 2026-10-05) |
| 검증 순서 | 스트림 두 곳: 조건 → `filter` → `scope` → `visit` → `libraryIds` → 지역. `/books`·`/books/{bookId}`: 조건 칸 → `exact`·`roles`·`sort` → `scope` → `visit` → `libraryIds` → `page`·`pageSize` → 지역(`filter` 없음). 첫 오류 하나만 | [확정] (dev 구현 확인, 2026-10-05) |
| 넣기 | 켜진 도서관은 자격과 상관없이 계획에 넣음(지역 규칙이 안 맞아 빠지던 도서관도). 꺼졌거나 없는 번호는 오류 없이 무시 | [확정] (spec R3, AC-10) |
| 예외 | `chosen`인 도서관은 `scope=joinable`(`joinable() \|\| chosen`)과 `visit=none`(방문 가입이어도 남김)에서 빠지지 않음 | [확정] (spec R5, 사용자 제안 2026-10-04) |
| 순서 | `chosen` 묶음이 맨 앞(묶음 안은 기존 `IN_GROUP` 규칙), 그 뒤는 ADR-0027 순서. `scope=all`(스위치 "전체")이어도 맨 앞. `priorityGroup`은 원래 값 유지 | [확정] (사용자 승인, 2026-10-04) |
| `/api/v1/books` | `joinTier`에 값 `CHOSEN`이 첫 정렬 키 | [확정] 규칙, [확정] 이름 (dev 구현 확인, 2026-10-05) |
| 내부 값 | `chosen`인데 지역 규칙이 안 맞는 도서관은 `eligibility=UNKNOWN`, `priorityGroup=QUALIFIED`(dev가 정한 값. 지역을 보낸 계획에 `QUALIFIED`가 나오는 건 이 경우뿐) | [확정] (dev 구현 확인, 2026-10-05) [이유 미확인] |
| 표시 | 2026-10-05 바뀜: 모든 폭에서 도서관 이름을 누르면 열리는 팝오버에 자격 요약·자격 조건·안내·주의·방문 가입·가입 방법을 보이고, "가입 자격 확인 필요"도 그 안 맨 위로 옮김. `chosen` 도서관도 같은 정보를 보이며, 차이는 이름 옆 "직접 추가" 표시와 정렬(같은 책 안 맨 앞)뿐. (2026-10-04의 "`chosen`이면 자격 배지·주의 대신 '직접 추가' 하나"를 바꿈) | [확정] (사용자 요청, 2026-10-05: "'직접 추가'도서관도 그 방법에 맞게 보이도록 해줘(자격 조건도 누르면 보이도록)") |

## 묶음 실행 규칙 (요약, 자세한 것은 사이클 02 design-delta)

- 계획 순서대로 시작, 동시 P=5 [안], 셈한 줄이 20을 넘으면 새 요청 중단 [확정](사이클 20에서 10, `batch.row-limit` — 설계됨(미구현, 사이클 20, 1단계) [확정] (검토 #23); 책 화면 소장 조회는 줄 상한 없이 보이는 10권 모두 [확정] (검토 #26)), 검색 페이지는 묶음 시작부터 8초 [확정], 남은 시간 3초 미만이면 새 요청 안 함 [안]
- 같은 호스트가 바쁘면 그 후보를 건너뛰고 다음 후보 먼저 (ADR-0020)
- 셈하는 줄: `filter=all`은 판정이 정해진 모든 줄, `available`은 `AVAILABLE` 줄. `PENDING`은 세지 않음
- `batch-done`: `batchNo`, `requested`, `succeeded`, `failed`, `countedRows`, `pendingRows`, `stopReason`(`ROW_LIMIT \| CANDIDATES_EXHAUSTED \| LAUNCH_CUTOFF`; 사이클 20에서 화면이 떠나면 `CLIENT_GONE` — 새 도서관을 띄우지 않고 넘긴 요청은 끝까지 받아 캐시, 설계됨(미구현, 사이클 20, 1단계), ADR-0131)
- `row-verdict`: `batchNo`, `libraryId`, `page`, `rank`, `availability`, `availabilityBasis`. `batch-done` 뒤에 보냄

## `targets` 이벤트

`title` / `author` / `publisher` 중 요청과 같은 칸 하나(값은 검색어, 나머지 둘은 JSON에서 빠짐), `filter`, `scope`, `visit`, `regionFilterApplied`, `libraries[]`. 사이클 02의 `query` 칸은 없습니다 (ADR-0025). 도서관 항목: `id`, `name`, `libraryType`, `platformType`, `priorityGroup`, `deferred`, `eligibility`, `eligibilitySummary`, `extraConditionText`, `visitRequired`, `joinMethod`, `joinUrl`, `joinCaution`, `joinNotice`, `homepageUrl`. 사이클 06: `chosen`(boolean, 직접 추가 도서관이면 true, 마지막 칸) [확정] (dev 구현 확인, 2026-10-05) — 구현됨 (사이클 06). 사이클 07 (구현됨 (사이클 07)): `eligibility`에 값 `UNSURVEYED` [확정] (ADR-0053, 값 이름 dev 구현 확인, 2026-10-05); `platformType`에 `BOOKCUBE_FX`, `ALADIN_V1` [확정] (ADR-0056); 새 칸 `joinSurvey`(`SURVEYED`/`NOT_FOUND`/`MEMBERS_ONLY`/`NOT_SURVEYED`), `logoUrl`(`/library-logos/{logo_file}`, 보일 때만, 아니면 null) [확정] (ADR-0059, dev 구현 확인, 2026-10-05). 사이클 07에는 `lendingModel`을 서버 안 `SearchTarget`에만 두고 웹에 보내지 않았음(`LibraryRef`에도 없음) [확정] (dev 구현 확인, 2026-10-05) — 사이클 09에서 바뀜(아래). 사이클 08 (구현됨 (사이클 08)): 새 칸 `mobileSiteDiffers`(boolean) [확정] (dev 구현 확인, 2026-10-11) — 웹은 이 값이 true이고 폭 640px 이하일 때 YES24 폰 안내를 보임. 사이클 09 — 구현됨 (사이클 09) (ADR-0076): 새 칸 `vendor`, `lendingModel`(통합 포털은 null), `orderNo`(`StreamEvents.Library`, `SearchTarget`에서 옮겨 실음), 값은 `GET /api/v1/libraries`와 같음. 칸 순서는 도서관 항목 끝(`SearchTarget.java:22-26`, `StreamEvents.java:84-92`) [확정] (dev 구현 확인, 2026-10-12). 첫 `targets` 크기 +7.5~8.2% [확정] (dev 측정, 2026-10-12). 웹은 결과 카드 이름 다음 줄에 "교보 · 소장"(순번 2 이상이면 "· N번째 사이트"), 값이 없으면 이름만 [확정] (사용자 승인, 2026-10-11).

- 크기: 278곳 156,368바이트(gzip 했다면 16,271) (dev 측정, 2026-09-29)

## 검색 방식 (ADR-0009, ADR-0025, ADR-0026)

고른 조건을 사이트의 해당 칸으로 검색합니다.

| 화면 종류 | 제목 | 저자 | 출판사 |
|---|---|---|---|
| `KYOBO_V1`, `KYOBO_SUBSCRIPTION_V1` | `schClst=ctts` | `schClst=autr` | `schClst=pbcm` |
| `YES24_V1`~`V3` | `srch_order=title` | `author` | `publisher` |
| `GANGNAM_V1` | `search=title` | `search=author` | `search=publisher` |
| `ELIB_PORTAL_V1` | 기본 검색(제목 전용 칸 없음) | `table.do?search_text={q}&author_name={q}` | `table.do?search_text={q}&book_pubname={q}` |
| `BOOKCUBE_FX` (사이클 07, 구현됨 (사이클 07)) | `xml/productSearch?keyword=&keyoption2=1`, 다른 사이트처럼 "더 보기"(쪽 크기 10, `itemCount`·`page`) [확정] (사용자 결정, 2026-10-05, 원문 없음) | `keyoption2=2` [확정] (dev 사이트 시험, 2026-10-05) | `keyoption2=3` [확정] (dev 사이트 시험, 2026-10-05) |
| `ALADIN_V1` (사이클 07, 구현됨 (사이클 07)) | `sub.htm?code=search&search_item=` 첫 쪽만(`base_url`의 `?nav_code` 떼어 씀. `list_scale`은 무시되는 듯 20줄 고정) | `search_item=author` | `search_item=publisher` — 씀 [확정] (사용자: "출판사 검색도 씀", 2026-10-05, 인계서 C18 "그 도서관 실패"를 바꿈) |

- 부분 일치입니다("김달" → "김달우"도). 포털 저자·출판사만 정확히 일치입니다 (ADR-0026). 그래서 포털에서는 "김달 저", "김달 지음"처럼 적힌 줄이 빠집니다 (dev 실측 2026-09-29, 부산 11줄 중 3줄).
- 포털 기본(제목) 검색은 제목뿐 아니라 저자·출판사도 찾습니다.
- 포털 "도서관에서 보기"(`librarySearchUrl`)는 가져온 주소가 `index.do`가 아니면(저자·출판사, 제목 2쪽 이후) `index.do?menu_idx=M&search_text=…`로 만듭니다. `table.do`는 화면 조각이라 새 창에서 깨집니다.
- 포털 `search_type`의 AUTHOR/TITLE/PUBLER는 자료 종류라서 필드 검색에 쓰지 않습니다.
- YES24는 `sort=title`로 부릅니다. `sort=now`는 "지금 빌릴 수 있는 책만" 거르는 필터라서 쓰지 않습니다.
- EUC-KR 사이트(`YES24_V1`, `YES24_V3`, 강남구)는 검색어를 EUC-KR로 보냅니다.
- 캐시 키에 조건(필드)이 들어 있어 제목 "김달"과 저자 "김달"은 따로 캐시됩니다.
- 전주(`YES24_V1`)는 화면에 저자 이름을 표시하지 않아 결과 줄의 저자 칸이 비어 있습니다.

## 북큐브·알라딘·교보 소장형 상세 읽기 (ADR-0056) — 구현됨 (사이클 07)

| 대상 | 방식 | 제한 | 실패 시 | 상태 태그 |
|---|---|---|---|---|
| 북큐브 (`BOOKCUBE_FX`) | 상세 XML `{base}/xml/productView/?num={item_key}`(상세 주소 `/product/view/?num=`에서 바꿈), `<Product>` 바로 아래 `volume`·`nowLendCount`·`nowReserveCount`. XML 파서 DTD·외부 엔티티 끔 | 로그인 없음, 같은 호스트 1건·1초, 캐시 3분, 시간 초과 5초 | 모양 다름·없는 책·시간 초과 → 확인 실패, 카드 링크 남음 | [확정] (research 1절, ADR-0056) |
| 북큐브 대여형 | 같은 XML에서 `volume=0`이고 `nowRentalCount` 있음 → `SiteVerdict.SUBSCRIPTION` → "구독형 · 바로 대출" | 같음 | 같음 | [확정] |
| 알라딘 (`ALADIN_V1`) | 상세 HTML "보유현황"의 보유/대출/예약 라벨. 목록에 수가 없는 사이트(서정대·대구공업대, 김해대는 대출·예약 수가 빔)는 없는 수를 비우고 그 줄을 `UNKNOWN`("확인 필요")으로(도서관 전체 실패 대신) | 같음 | 같음 | [확정] 상세 / `UNKNOWN` [이유 미확인: dev가 AC-24 확인 중 고침]. "대출하기" 단추를 대출 가능 판정에 쓸지 [확인 필요] (대출 중인 책 화면을 아직 못 봄) |
| 교보 구독형 화면 (`KYOBO_SUBSCRIPTION_V1`) | 목록: `lending_model`과 상관없이 줄마다 숫자(`p.use` "[ 대출 : 0/1 예약 : 0 ]")가 있고 구독 표시가 없으면 숫자, 없으면 "구독형 · 바로 대출". 책 화면(소장 스트림): `lending_model = OWNED`인 도서관만 상세 쪽(`span.use`)을 읽고, 그 밖은 요청 없이 `SUBSCRIPTION`. `KYOBO_SUBSCRIPTION_V1`·`BOOKCUBE_FX`는 같은 판정기 | 같음 | 같음 | [확정] 고치기 (Q3), 읽는 위치·줄마다 판정 [확정] (dev 사이트 시험, 2026-10-05: 거제시청(19)·대구광역시교육청(58)은 숫자, 혼합형 함양(158)·동해(63)는 줄마다 다름) |
| robots.txt·이용 조건 | — | — | — | [확인 필요] (`crawl-method.md` 1절과 같음) |

- `PlatformAdapter`에 기본 메서드 `detailFetchUri(URI detailUri)`(기본 = 그대로). 같은 호스트라 throttle·캐시 키 그대로 [확정] (dev 구현 확인, 2026-10-05)
- 조회 서비스(fetch-service)는 호스트 허용 목록 없이 `UrlGuard`만 있어 바뀌지 않습니다 (사이클 18 구현됨 (dev main `a0e438a`, 회고 2026-10-15): `UnderscoreHosts`·`UrlGuard`·`LibraryClient`가 호스트에 밑줄이 있는 주소를 받게 함, `UrlGuard`는 연결할 이름으로 DNS를 풀어 내부망이면 거부하고 authority에 `@`가 있으면 거부, ADR-0112)
- 사이트 시험 결과 (dev, 2026-10-05): 북큐브 `keyoption2` 1 서명·2 저자·3 출판사, 쪽 넘기기 `itemCount`·`page` 됨, 없는 `num` → XML 머리만 있는 빈 응답 → 확인 실패, http·포트 사이트 정상. 알라딘 `search_item=author`·`publisher` 됨, 쪽 크기 20줄 고정이라 첫 쪽만 [확정] (dev 사이트 시험, 2026-10-05). 북큐브 한 사이트에 소장형·대여형이 섞이는지는 못 봄(줄마다 판정하므로 섞여도 맞게 나옴)
- XML은 JDK 파서, DTD·외부 엔티티·XInclude 끔
- 도서관 TLS (사이클 07): JDK 최상위 기관에 더해 OISTE WISeKey Global Root GB CA를 도서관 사이트 연결에만 믿고(3곳), 중간 인증서 3개를 더함. 폴더 `tls/library-roots/`(본 서비스·조회 서비스 둘 다) [확정] (사용자: "이거 신뢰해줘", 2026-10-05). ADR-0022("JDK 최상위 기관만 믿음")를 바꿈 — ADR-0061, ADR-0022 보완

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
- 쿠키: 액세스 토큰 `access_token`(`Path=/api/v1/me`. 사이클 15에서 `Path=/api/v1`로 넓힘 [확정] (ADR-0102) — 구현됨 (사이클 15, 회고 2026-10-15), 옛 경로 쿠키는 따로 지우지 않음), 리프레시 토큰 `refresh_token`(`Path=/api/v1/auth`), 둘 다 `Secure`·`HttpOnly`·`SameSite=Lax`. 로그인 도중의 세션 쿠키는 `Path=/api/v1`, 10분. CSRF는 `XSRF-TOKEN` 쿠키 → `X-XSRF-TOKEN` 헤더.
- 사이클 15 — 구현됨 (사이클 15, 회고 2026-10-15) (ADR-0102): 쿠키 경로가 넓어져 검색·책 상세·직접 찾기 요청에도 `access_token`이 함께 가고, `usagelog`가 `auth`의 공개 `LoginStatusReader`(결과 `LoginStatus`) [확정] (dev 구현 확인, 2026-10-15)로 로그인 상태를 판별함(서명 확인, 만료돼도 서명이 맞으면 로그인함, 로그인 기능이 꺼져 있으면 쿠키를 보지 않고 `login_off`). 보호 경로는 그대로 `/api/v1/me/**`만. `POST /api/v1/usage-events`는 로그인 없이 CSRF 검사만(위 "사용 알림")
- 사이클 16 — 구현됨 (사이클 16, 회고 2026-10-15) (ADR-0099): `GET /api/v1/auth/signup`의 `documents[].version`과 `POST`의 `consents[].version`은 `sitecontent`의 지금 판 순번 글자(`"1"` 같은 값, 지금까지의 `YYYY-MM-DD`를 바꿈) [확정] (사용자 승인, 2026-10-13). 서버는 `SiteDocuments.currentVersion`으로 받고 서버 설정 `chaekcheck.auth.documents`는 지움. 요청·응답 모양, 409 `document_version_mismatch` 동작은 그대로. S6은 받은 판 번호로 `GET /api/v1/documents/terms-of-service?version=`·`privacy-collection?version=`을 읽음(흐름 40)


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
  - `<v>`는 사이클 16부터 판 순번 글자 — 구현됨 (사이클 16, 회고 2026-10-15): `{"provider":"KAKAO","documents":[{"type":"TERMS_OF_SERVICE","version":"1"},{"type":"PRIVACY_COLLECTION","version":"1"}]}`
  - `GET /api/v1/me` → `{"id":123,"loginMethods":["KAKAO"],"consents":[{"type":"TERMS_OF_SERVICE","version":"<v>","agreedAt":"2026-10-04T10:00:00Z"}]}`. `loginMethods`는 재인증 시작 주소를 고르는 데만 쓰고 화면에 보이지 않음
  - 401 → `{"title":"Unauthorized","status":401,"detail":"Login required","code":"unauthorized"}`


### 결과 코드 (`/auth/complete?result=`와 API 오류의 `code`)

| 코드 | 어디서 | 화면 문구 |
|---|---|---|
| `login_success` | 콜백 | 없음(보던 주소로) |
| `signup_success` | 첫 가입을 마친 직후에만(다시 로그인할 때는 아님). **서버 결과 코드가 아니라 웹 상태**: `SignupPage`가 201 뒤에 안내 줄을 한 번 띄움(문구 `authResult.ts`의 `SIGNUP_SUCCESS_MESSAGE`). 서버 코드는 만들지 않음 [확정] (사용자 선택, 2026-10-04: dev 안 "웹 상태 (추천)"). 구현됨 (사이클 06) | 가입했어요 (화면 위 안내 줄 한 줄, 다른 페이지로 가면 사라짐) |
| `login_cancelled` | 콜백 `error=access_denied` | 로그인을 취소했어요 |
| `login_provider_error` | 콜백: 제공자 `error`(취소 말고), 토큰 교환·프로필 실패. 제공자 이름을 `&provider=naver` 또는 `kakao`로 함께 줌(경로의 registrationId에서 정함) | 네이버(카카오) 쪽 문제로 로그인하지 못했어요. 잠시 뒤 다시 해 주세요 |
| `login_expired` | 저장된 인가 요청이 없음 | 로그인 시간이 지났어요. 다시 해 주세요 |
| `login_state_mismatch` | 저장된 요청은 있는데 `state`가 다름 | 안전하지 않은 로그인 요청이라 멈췄어요. 로그인 버튼을 눌러 다시 해 주세요 |
| `withdraw_reauthenticated` | 재인증 콜백 성공 → 웹이 DELETE 호출 | 탈퇴 처리 중 |
| `withdraw_account_mismatch` | 재인증 콜백 | 가입한 계정으로 확인해 주세요 |
| `withdraw_cancelled` | 재인증 콜백 `access_denied` | 탈퇴를 취소했어요 |
| `withdraw_provider_error` | 재인증 콜백. `&provider=`를 함께 줌 | 네이버(카카오) 쪽 문제로 본인 확인을 하지 못했어요. 잠시 뒤 다시 해 주세요 |
| `withdraw_login_expired` | 재인증 콜백: 리프레시 줄 없음 / DELETE 401 뒤 갱신 실패 | 로그인이 풀렸어요. 다시 로그인한 뒤 탈퇴해 주세요 |
| `withdraw_request_expired` | 재인증 콜백: 저장된 인가 요청이 없음. 사이클 06 보완으로 추가: 구현됨 (사이클 06, `LoginFailureHandler`) [확정] (사용자 승인, 2026-10-04) | 본인 확인 시간이 지났어요. 탈퇴를 다시 눌러 주세요 |
| `withdraw_state_mismatch` | 재인증 콜백: 저장된 요청은 있는데 `state`가 다름. 위와 같이 사이클 06 보완: 구현됨 (사이클 06) [확정] (사용자 승인, 2026-10-04) | 안전하지 않은 요청이라 멈췄어요. 탈퇴를 다시 눌러 주세요 |
| (API) `reauthentication_expired` 403 | `DELETE /api/v1/me` | 본인 확인 시간이 지났어요. 탈퇴를 다시 눌러 주세요 |
| (API) `internal_error` 500 | `DELETE /api/v1/me` | chaekcheck 서버 문제로 탈퇴하지 못했어요. 잠시 뒤 다시 해 주세요 |
| (웹) 네트워크 | `fetch` 예외 | 인터넷 연결을 확인하고 다시 해 주세요 |

- 문구의 원본은 `spec.md` "상태별 동작"과 `flow.md` S1·S7입니다. `provider` 값은 `naver`, `kakao` 둘만 받고 그 밖의 값은 웹이 무시합니다.
- `login_expired`와 `login_state_mismatch`는 인가 요청 저장소를 감싸서 구분합니다: 세션에 저장된 요청이 없으면 expired, 있는데 `state`가 다르면 mismatch [확인 필요: Spring Security 소스에서 기본 동작 확인].
- `withdraw_request_expired`·`withdraw_state_mismatch`·`signup_success`의 문구 원본은 `docs/cycles/06-my-libraries/spec.md`(AC-18)와 `scope.md`입니다.
- 탈퇴가 멈춘 문구 일곱(`flow.md` S7)과의 대응: 다른 계정 `withdraw_account_mismatch`, 5분 초과 `reauthentication_expired`(403), 취소 `withdraw_cancelled`, 제공자 오류 `withdraw_provider_error`, 우리 서버 오류 `internal_error`(500), 로그인이 풀림 `withdraw_login_expired`, 인터넷 끊김은 웹이 `fetch` 예외로 판단.

## 내 도서관 (`mylibrary`) — 구현됨 (사이클 06)

- 근거: ADR-0048, ADR-0049, ADR-0051. 요청·응답 예시는 `docs/cycles/06-my-libraries/design-delta.md` "API".
- `/api/v1/me/**`라서 액세스 쿠키(`Path=/api/v1/me`, 사이클 15부터 `Path=/api/v1` — 구현됨 (사이클 15, 회고 2026-10-15), ADR-0102)와 요청마다의 계정 확인이 이미 적용되고, 변경 메서드는 `X-XSRF-TOKEN`이 필요합니다(ADR-0044). 로그인이 꺼져 있으면 404(ADR-0046). 로그인 정보 `GET /api/v1/me`와 따로입니다 [확정] (사이클 06 spec R8-1).
- 웹은 로그인 직후 `GET /api/v1/me/regions`와 `GET /api/v1/me/libraries`를 동시에 부릅니다(흐름 13). 사이클 07: 계정이 비었고 브라우저에 지역이나 직접 추가가 있으면 S11에서 `PUT /api/v1/me/regions`(지역이 비었을 때만)와 `POST /api/v1/me/library-imports`(도서관이 비었을 때만)를 부릅니다(흐름 19) — 구현됨 (사이클 07)
- 로그인 전 직접 추가 (사이클 07, ADR-0057, 구현됨 (사이클 07)): 웹이 브라우저 키 `chaekcheck.chosenLibraries.v1` [확정] (dev 구현 확인, 2026-10-05)에 최대 20곳 저장하고(로그인 기능이 꺼져 있어도 같음) 검색 요청에 `libraryIds`로 넘깁니다. 서버 API는 바뀌지 않습니다(검색 모듈은 회원을 모름, ADR-0037)

| 메서드 | 경로 | 설명 | 요청 | 응답 | 오류 |
|---|---|---|---|---|---|
| GET | `/api/v1/me/regions` | 저장된 지역(폐지된 ID도 그대로) | — | 200 `{"residenceRegionIds":[1114],"workRegionIds":[1101]}` | 401 `unauthorized`, 500 `internal_error` |
| PUT | `/api/v1/me/regions` | 거주·직장 지역을 통째로 바꿈. 화면은 `/regions/resolutions`로 해석한 값만 보냄 | `{"residenceRegionIds":[1114],"workRegionIds":[]}` 두 칸 필수(빈 배열 가능) [확정], 칸마다 최대 20 [확정], 순서 유지 [확정], 중복은 처음 위치를 남기고 합친 뒤 20개를 셈 [확정] (dev 구현 확인, 2026-10-05). 본문은 JSON으로 읽어 직접 검사하므로 `"a"`·`1.5`·`0`·배열이 아닌 값도 `errors[].field`가 있는 400 `invalid_format`, 두 칸의 오류를 함께 돌려줌 | 200 저장한 값 | 검사 순서 400 → 401(계정 줄 잠금) → 422. 400 `validation_error`(`required`/`invalid_format`/`too_many`), 본문이 JSON이 아니면 400 `bad_request`(루트 핸들러), 422 `invalid_region`(`detail` "Some regions cannot be used", `errors[]` 항목 `{field, message, code, value}`, `code` `abolished`/`not_found`/`not_sigungu`, 사용 중인 시군구만 받음) [확정] (dev 구현 확인, 2026-10-05), 401, 403 `csrf_invalid`, 500 |
| GET | `/api/v1/me/libraries` | 직접 추가 도서관 번호(꺼진 것 포함), 순서 `added_at, library_id` | — | 200 `{"libraryIds":[12,207],"max":20}` | 401, 500 |
| PUT | `/api/v1/me/libraries/{libraryId}` | 하나 추가. 순서: 계정 줄 잠금(없으면 401) → 켜진 도서관인지(아니면 404) → **이미 있으면 204** → 없고 20곳이면 409 → `INSERT … ON CONFLICT DO NOTHING` [확정] (사용자 승인, 2026-10-04, 마무리 검토). 자동 목록에 있는 도서관도 받음 | — | 204 | 404 `library_not_found`(없음·꺼짐·숫자 아님: `abc`, `0`, `-1`), 409 `library_limit_reached` [확정] (dev 구현 확인, 2026-10-05), 401, 403, 500 |
| POST | `/api/v1/me/library-imports` [확정] (dev 구현 확인, 2026-10-05) (동작을 명사 자원으로: dev api-design 스킬 "verbs sparingly") — 구현됨 (사이클 07) | 브라우저의 직접 추가를 한 번에 옮김 (ADR-0057). 순서 [확정] (사용자 승인, 2026-10-05, 설계 검토): 계정 줄 잠금(ADR-0051) → 계정의 직접 추가가 비었는지 확인(아니면 409) → 켜진 도서관만 요청 순서대로 넣음(없는·꺼진 번호는 건너뜀, 오류 아님). `added_at`은 요청 순서대로 `now() + n ms` [확정] (dev 구현 확인, 2026-10-05). 동시 두 요청은 계정 줄 잠금으로 하나만 성공, 다른 하나는 409 | `{"libraryIds":[281,45]}` (1~20개, 중복 합침) | 200 `{"libraryIds":[…],"max":20}` (옮긴 뒤 전체) | 400 `validation_error`(`errors[]`에 `field: libraryIds`, `code` `invalid_format`/`too_many`/`required`, 지역 저장과 같은 모양) [확정] (사용자 선택 "400 validation_error로 맞춤", 2026-10-05, 설계의 422 `invalid_request`를 바꿈), 400 `bad_request`(JSON 아님), 401(로그인·계정 없음, 계정 줄 잠금 뒤), 409 `library_import_not_empty`(계정에 이미 직접 추가가 있음) [확정] (dev 구현 확인, 2026-10-05), 403 `csrf_invalid`, 로그인 꺼짐 404 |
| DELETE | `/api/v1/me/libraries/{libraryId}` | 하나 빼기(없어도 204). PUT과 같이 처음에 계정 줄을 잠금(계정이 없으면 401) — dev가 ADR-0051 "모든 저장의 처음"을 그대로 따름 [확정] (dev 구현 확인, 2026-10-05) | — | 204 | 404 `library_not_found`(숫자 아님: `abc`, `0`, `-1`. PUT과 같은 규칙, dev가 정함) [확정] (dev 구현 확인, 2026-10-05), 401, 403, 500 |

- 직접 추가 상한 20곳, 꺼진 도서관도 지울 때까지 20곳에 셈 [확정] (사용자, 2026-10-04).
- 계정 줄 잠금은 `auth`의 `AccountPresence.lockIfExists`(같은 트랜잭션)로 합니다. 탈퇴가 먼저 커밋했으면 401이고 줄을 만들지 않습니다(ADR-0051, 흐름 15).
- 409 예: `{"title":"Conflict","status":409,"detail":"At most 20 libraries can be added","code":"library_limit_reached"}`
- 웹: 403 `csrf_invalid`면 새 토큰을 받아 한 번 다시(사이클 05). 409·404·500·연결 끊김이면 화면에 먼저 보인 추가를 되돌리고 안내(흐름 14).

## 오류 코드

| code | HTTP | 어디서 |
|---|---|---|
| `validation_error` | 400 | 지역 해석 API, 스트림의 지역 파라미터(숫자 아님, 20개 초과), `filter`·`scope` 값 오류, 다음 묶음의 `candidates`·`batchNo`, 세 API의 검색 조건 파라미터(없음·둘 이상·중복), 스트림의 `visit` 값 오류. 사이클 06(구현됨 (사이클 06)): 검색 API 네 곳의 `libraryIds`(`field: libraryIds`, `invalid_format`/`too_many`), `GET /api/v1/libraries`의 지역, `PUT /api/v1/me/regions` 본문. 사이클 07(구현됨 (사이클 07)): `POST /api/v1/me/library-imports` 본문(`field: libraryIds`, `invalid_format`/`too_many`/`required`). 사이클 10: `GET /api/v1/popular-books`의 계획 파라미터(`/books`와 같은 규칙) → 사이클 14부터 `GET /api/v1/picks` — 구현됨 (사이클 14), `popular-books`는 지움 → 사이클 21부터 `GET /api/v1/picks/{listKey}` — 구현됨 (사이클 21, 회고 2026-10-17), 대출 현황 스트림의 `holdingLimit`(`invalid_format`/`duplicate`, 지역 형식 검사 뒤·계획 422 앞). 사이클 16 — 구현됨 (사이클 16, 회고 2026-10-15): `GET /api/v1/notices`의 `page`, 공지 글의 `noticeId`, 공지·문서 글의 `version`(`errors[].code`: 정수가 아니면 `typeMismatch`, 1 미만 `Min`, int 범위 초과 `Max` [확정] (사용자 승인, 2026-10-15, 회고 이어서 #1); 루트의 400 `bad_request`로 가지 않음). `errors[].code`: `required`, `invalid_format`, `too_many`, `duplicate` |
| `invalid_query` | 400 | 스트림(시작 전), 더 보기 — 정규화 후 2글자 미만 또는 50자 초과 |
| `invalid_page` | 400 | 더 보기 |
| `invalid_region` | 422 | 스트림(시작 전) — `errors[].code`: `abolished`, `not_found`, `not_sigungu`. 사이클 06(구현됨 (사이클 06)): `GET /api/v1/libraries`, `PUT /api/v1/me/regions`도 같은 모양(`errors[].value`). 사이클 10: `GET /api/v1/popular-books`(사이클 14에서 지움) → 사이클 14(구현됨 (사이클 14)): `GET /api/v1/picks` → 사이클 21(구현됨 (사이클 21, 회고 2026-10-17)): `GET /api/v1/picks/{listKey}` |
| `list_not_found` | 404 | 사이클 21 — 구현됨 (사이클 21, 회고 2026-10-17) (ADR-0126): `GET /api/v1/picks/{listKey}` — 모르는 목록 이름(`librarian`·`leedongjin`·`snu100`가 아님) |
| `book_not_found` | 404 | 책 하나 조회 — 없는 책, 숫자가 아닌 id. 사이클 08 (구현됨 (사이클 08)): 화면은 "책을 찾을 수 없어요" 아래 "도서관 목록을 새로 받으면서 빠진 책일 수 있어요. 다시 검색해 주세요." [확정] (ADR-0070) |
| `library_not_found` | 404 | 더 보기 — 없거나 꺼진 도서관. 다음 묶음에서는 그 도서관만 `library-failed`. 사이클 06(구현됨 (사이클 06)): `PUT /api/v1/me/libraries/{libraryId}` — 없음·꺼짐·숫자가 아닌 id, `DELETE /api/v1/me/libraries/{libraryId}` — 숫자가 아닌 id |
| `library_import_not_empty` | 409 | 사이클 07 (구현됨 (사이클 07)): `POST /api/v1/me/library-imports` — 계정에 이미 직접 추가한 도서관이 있음 [확정] (dev 구현 확인, 2026-10-05) |
| `too_many_requests` | 429 | 사이클 07 (구현됨 (사이클 07)): nginx가 붙임(앱이 아님). 도서관을 부르는 API(검색·소장 스트림 4개, `/api/v1/availability/`)에서 IP별 `limit_req`·`limit_conn` 한도를 넘음. `Retry-After: 2` |
| `server_busy` | 503 | 사이클 07 (구현됨 (사이클 07)): 묶음 스트림(묶음 실행기 `BatchRunner`를 쓰는 스트림)과 도서관별 더 보기 — 동시 검색 `max-concurrent-searches`(20 [안])이 다 참, 줄 세우지 않음. 사이클 08: `Retry-After: 5` [확정] (사용자 승인, 2026-10-11) — 구현됨 (사이클 08). 사이클 20 — 설계됨(미구현, 사이클 20): 상한 40 [확정] (전반 점검 #13), 화면은 받자마자 상태 점 빨강; 확장 모드 올리기(`/api/v1/lookup-plans/{planId}/items/{itemId}`)에서 해석 자리 8을 2초 못 얻음(2단계), 계획 보관함 가득이면 계획 요청 503(2단계) |
| `invalid_plan` | 400 | 사이클 20 — 설계됨(미구현, 사이클 20, 2단계): `/api/v1/lookup-plans/{planId}/items/{itemId}`·`/close` — 계획 없음·만료·지워짐·쪽 번호 없음·이미 받음·계획을 만든 번호와 다름·Origin 다름. 화면은 남은 줄을 「확인하지 못한 도서관」으로, 오류 화면 없음. 거절 기록 `invalid_plan` [확정] (설계 결정 #6) |
| `client_ip_changed` | 400 | 사이클 20 — 설계됨(미구현, 사이클 20, 2단계): 올리기·닫기·`replaces` — 2단계는 계획을 만든 IP와, 3단계는 번호를 받은 IP와 지금 IP(/64)가 다름(폰 회선 바뀜). 화면이 남은 도서관만 조용히 다시 계획, 잠금에 안 셈 [확정] (검토 #32, 전반 점검 #1), 이름 [안] |
| `invalid_client_key` | 400 | 사이클 20 — 설계됨(미구현, 사이클 20, 3단계): 올리기·닫기 — 번호 쿠키 없음·장부에 없음(서버 재시작·장부에서 밀려남 포함). 화면이 새 번호를 받고 남은 도서관만 다시 계획 [확정] (검토 #32, 전반 점검 #10), 이름 [안] |
| `lookup_ip_limited` | 429 | 사이클 20 — 설계됨(미구현, 사이클 20, 3단계): 계획 만들기 — 공인 IP 울타리 둘(그 IP의 계획 무게 20% 넘음 / 새 번호 1분 30개 넘음) 중 하나, `detail`에 어느 것인지. 화면 「잠시 후 다시」, 서버 모드로 넘기지 않음 [확정] (검토 #31, 전반 점검 #12), 이름 [안] |
| `payload_too_large` | 413 | 사이클 20 — 설계됨(미구현, 사이클 20, 2단계): 확장 모드 올리기 본문이 1MB를 넘음(nginx `client_max_body_size`, 앱도 상한까지만 읽음), 이름 [안] |
| `cover_not_found` | 404 | 사이클 10: `GET /api/v1/popular-books/covers/{coverId}`(사이클 14에서 지움) → 사이클 14 — 구현됨 (사이클 14): `GET /api/v1/picks/covers/{coverId}` — 저장된 표지가 없음(지웠거나 없는 번호). 웹은 제목 글자 [확정] (사용자 승인, 2026-10-11, design-delta 확인) |
| `holding_not_found` | (스트림 안 실패 코드) | 사이클 08 (구현됨 (사이클 08), 서버 `MissingHolding`): 대출 현황 스트림(`/book-availabilities/stream`, `…/batches/stream`)의 `holding-failed` — 소장 번호가 지금 목록에 없음(가져오기로 빠진 소장). 도서관이 없거나 꺼진 `library_not_found`와 나눔. 화면은 책 화면 그 도서관 줄에 "이 도서관 목록에서 빠졌어요" [확정] (사용자 승인, 2026-10-11, ADR-0070) |
| `library_limit_reached` | 409 | 내 도서관 직접 추가 — 이미 20곳인데 새 도서관을 더함 [확정] (dev 구현 확인, 2026-10-05). 구현됨 (사이클 06) |
| `upstream_error` | 502 | 더 보기, 스트림의 `library-failed` — 도서관 오류 응답, 3xx, 파싱 실패, 모든 조회 서버가 쉼. 사이클 07: 도서관 응답 본문이 4MB [안]을 넘음. 사이클 20 — 설계됨(미구현, 사이클 20, 1단계): 상한 1MB(풀었을 때 포함) [확정] (검토 #7, 전반 점검 #6) |
| `upstream_timeout` | 504 | 더 보기, 스트림의 `library-failed` — 8초 초과, 조회 서버 읽기 시간 초과. 사이클 07: 본문 포함 요청 전체 15초 [안] 초과 |
| `unauthorized` | 401 | 로그인·계정·내 도서관 — 로그인이 필요함, 토큰 만료·무효, 계정 없음(지워짐), 웹훅·콜백 검증 실패 |
| `csrf_invalid` | 403 | 로그인·계정·내 도서관 — CSRF 토큰 없음·틀림. 사이클 15 — 구현됨 (사이클 15, 회고 2026-10-15): `POST /api/v1/usage-events`(로그인 기능 켜짐일 때). 사이클 20 — 설계됨(미구현, 사이클 20, 2단계): `POST /api/v1/lookup-plans/*` 셋(로그인 기능 켜짐일 때) |
| `forbidden` | 403 | 로그인·계정 — CSRF가 아닌 403(지금은 나오지 않음) |
| `reauthentication_required`, `reauthentication_expired` | 403 | 탈퇴 — 본인 확인 기록 없음 / 5분 초과 |
| `signup_not_found` | 404 | 가입 대기 없음·만료 |
| `document_version_mismatch` | 409 | 가입 — 동의한 문서 버전이 현재와 다름. 사이클 16 — 구현됨 (사이클 16, 회고 2026-10-15): 버전 = `sitecontent`의 지금 판 순번(ADR-0099), 가입 화면을 연 뒤 새 판이 시행되면 |
| `notice_not_found` | 404 | 사이클 16 — 구현됨 (사이클 16, 회고 2026-10-15): `GET /api/v1/notices/{noticeId}` — 없음·숨김·첫 판이 앞날인 공지. 화면 "찾을 수 없어요" + 공지 목록 링크 |
| `document_not_found` | 404 | 사이클 16 — 구현됨 (사이클 16, 회고 2026-10-15): `GET /api/v1/documents/{documentKey}` — 모르는 key |
| `version_not_found` | 404 | 사이클 16 — 구현됨 (사이클 16, 회고 2026-10-15): 공지·문서 글의 `?version=` — 없는 판·시행 전 판. 화면 "찾을 수 없어요" + 지금 판 링크 |
| `not_found` | 404 | 없는 경로 (Spring 기본 예외) |
| `bad_request` | 400 | 형식이 틀린 요청 (Spring 기본 예외) |
| `method_not_allowed` | 405 | 지원하지 않는 메서드 |
| `not_acceptable` | 406 | 줄 수 없는 `Accept` |
| `unsupported_media_type` | 415 | 지원하지 않는 요청 본문 형식. 사이클 20 — 설계됨(미구현, 사이클 20, 2단계): 확장 모드 올리기에 `Content-Encoding`이 있음 |
| `request_error` | 그 밖의 4xx | 위에 없는 Spring 기본 예외 |
| `internal_error` | 5xx | 예상하지 못한 서버 오류(500)와 모듈이 `code`를 붙이지 않은 5xx. 사이클 13(구현됨 (사이클 13, 회고 2026-10-14)): `GET /api/v1/join-surveys/latest`의 유일한 오류 |

`not_found`부터 7개는 dev `ApiExceptionHandler`가 붙입니다. 모듈이 `code`를 붙이지 않은 오류에만 HTTP 상태로 골라 붙입니다(2026-09-27 코드 확인).
