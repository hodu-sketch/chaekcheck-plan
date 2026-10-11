# ADR 목록

`/adr` 스킬이 ADR을 만들거나 상태를 바꿀 때 이 표를 함께 갱신합니다.

| ADR | 제목 | 상태 | 날짜 | 사이클 |
|---|---|---|---|---|
| [ADR-0001](0001-module-boundaries.md) | 모듈 경계: region, library, availability | Accepted | 2026-09-27 | 01 |
| [ADR-0002](0002-schema-per-module.md) | 모듈별 PostgreSQL 스키마 | Accepted | 2026-09-27 | 01 |
| [ADR-0003](0003-region-identity-and-changes.md) | 지역 식별과 행정구역 변경 처리 | Accepted | 2026-09-27 | 01 |
| [ADR-0004](0004-eligibility-rule-model.md) | 자격 규칙 모델과 도서관 사용 여부 | Superseded by 0013 | 2026-09-27 | 01 |
| [ADR-0005](0005-search-streaming-api.md) | 검색 조회 API: SSE 스트림 + 더 보기 API | Superseded by 0014 | 2026-09-27 | 01 |
| [ADR-0006](0006-search-cache.md) | 검색 캐시: Caffeine 메모리 캐시, 나중에 Redis | Accepted | 2026-09-27 | 01 |
| [ADR-0007](0007-host-throttle.md) | 도서관 호출 간격 제어: 직접 구현 | Superseded by 0010 | 2026-09-27 | 01 |
| [ADR-0008](0008-response-and-error-format.md) | API 응답·오류 형식: 감싸지 않은 성공 응답 + ProblemDetail | Accepted | 2026-09-27 | 01 |
| [ADR-0009](0009-search-field.md) | 검색 필드: 제목 필드로 검색하고 캐시 키에 검색 필드를 넣음 | Accepted | 2026-09-27 | 01 (02 시작 때 기록) |
| [ADR-0010](0010-hostname-throttle.md) | 도서관 호출 간격 제어 단위를 호스트 이름으로 | Accepted | 2026-09-28 | 02 |
| [ADR-0011](0011-fetch-service.md) | 도서관 조회 전용 서비스를 분리하고 여러 대로 운영 | Accepted | 2026-09-28 | 02 |
| [ADR-0012](0012-library-site-split.md) | 도서관과 전자도서관 사이트를 나눔 | Superseded by 0017 | 2026-09-28 | 02 |
| [ADR-0013](0013-eligibility-unverified.md) | 자격 모델 확장: 규칙이 없으면 자격 미확인 | Accepted | 2026-09-28 | 02 |
| [ADR-0014](0014-batched-search-api.md) | 묶음 단위 검색 API, 도서관 순서 목록은 브라우저가 가짐 | Accepted | 2026-09-28 | 02 |
| [ADR-0015](0015-fetch-client-contract.md) | 도서관 호출 인터페이스와 조회 서비스 계약 | Accepted | 2026-09-28 | 02 |
| [ADR-0016](0016-adapter-per-platform-type.md) | 화면 종류마다 adapter 하나 | Accepted | 2026-09-28 | 02 |
| [ADR-0017](0017-library-row-per-unit.md) | 도서관 한 줄 = 이용 단위 하나, 종류 칸으로 전자·실물 구분 | Accepted | 2026-09-28 | 02 |
| [ADR-0018](0018-server-title-key.md) | 같은 제목 판단 키를 서버가 만들어 응답에 넣음 | Accepted | 2026-09-28 | 02 |
| [ADR-0019](0019-resolver-delivery-interfaces.md) | 판정 방식과 SSE 전달을 인터페이스로 분리 | Accepted | 2026-09-28 | 02 |
| [ADR-0020](0020-skip-busy-host-in-batch.md) | 묶음 안에서 바쁜 호스트의 후보는 뒤로 미룸 | Accepted | 2026-09-29 | 02 (03 시작 때 기록) |
| [ADR-0021](0021-single-instance-ready-for-many.md) | 운영은 본 서비스 1대, 설계는 여러 대 대비 | Accepted | 2026-09-28 | 02 (03 시작 때 기록) |
| [ADR-0022](0022-library-site-tls-compatibility.md) | 도서관 사이트 TLS 호환: 중간 인증서 보충, RSA 키 교환 허용, 연결 5초 | Accepted | 2026-09-29 | 02 (03 시작 때 기록) |
| [ADR-0023](0023-platform-type-generation-names.md) | 화면 종류 이름에 세대 번호 | Accepted | 2026-09-28 | 02 (03 시작 때 기록) |
| [ADR-0024](0024-named-search-condition-params.md) | 검색 조건은 이름 있는 파라미터 하나로 받음 | Superseded by 0025 | 2026-09-29 | 03 |
| [ADR-0025](0025-named-search-condition-params-no-legacy-url.md) | 검색 조건은 이름 있는 파라미터 하나로 받음 (옛 주소 변환 없음) | Accepted | 2026-09-29 | 03 |
| [ADR-0026](0026-portal-author-publisher-facet.md) | 포털 저자·출판사 검색은 검색어 + 정확히 일치하는 거르기 | Accepted | 2026-09-29 | 03 |
| [ADR-0027](0027-visit-join-filter-and-order.md) | 방문 가입 도서관은 필터로 뺄 수 있고, 가입 가능한 도서관 중 맨 뒤에 조회 | Accepted | 2026-09-30 | 03 (회고 때 기록) |
| [ADR-0028](0028-catalog-module.md) | 수집한 책 목록은 새 모듈 catalog가 가짐 | Accepted | 2026-09-30 | 04 |
| [ADR-0029](0029-detail-page-lookup.md) | 책별 대출 상황은 상세 페이지로 읽고, adapter와 묶음 실행기를 넓혀 처리 | Accepted | 2026-09-30 | 04 |
| [ADR-0030](0030-books-api-and-holding-stream.md) | 책 검색 API와 소장 단위 스트림을 나눔 | Accepted | 2026-09-30 | 04 |
| [ADR-0031](0031-catalog-importer-in-backend.md) | 한 번 가져오기는 서비스 백엔드 Java, 정리 규칙 코드 한 벌 | Accepted | 2026-09-30 | 04 |
| [ADR-0032](0032-postgres-pg-bigm-contributors.md) | 책 목록 검색은 PostgreSQL + pg_bigm, 저자는 사람별 표 | Accepted | 2026-09-30 | 04 |
| [ADR-0033](0033-web-url-multiple-conditions.md) | 웹 주소에 여러 검색 조건을 담음 (ADR-0025의 웹 주소 규칙 변경) | Accepted | 2026-09-30 | 04 |
| [ADR-0034](0034-store-ebook-catalog.md) | 전자책 목록(사실 정보)을 서비스 DB에 저장함 | Accepted | 2026-09-30 | 04 |
| [ADR-0035](0035-grouping-step4-and-code-spaces.md) | 같은 책 묶기 ④(정리한 전체 제목·저자·출판사)와 책 번호 체계 공유 범위 | Accepted | 2026-09-30 | 04 (2026-10-01 늦게 기록) |
| [ADR-0036](0036-auth-and-member-modules.md) | 계정(`auth`)과 회원 자료(`member`)를 다른 모듈로 둠 | Superseded by 0048 | 2026-10-01 | 05 |
| [ADR-0037](0037-search-unaware-of-member-library-ids.md) | 검색 모듈은 회원을 모르고, 웹이 "내 도서관"을 파라미터로 넘김 | Accepted | 2026-10-01 | 05 (구현은 06) |
| [ADR-0038](0038-jwt-login-state.md) | 로그인 유지는 JWT (짧은 액세스 토큰 + DB의 리프레시 토큰) | Accepted | 2026-10-04 | 05 |
| [ADR-0039](0039-login-method-not-social-only.md) | 로그인 수단 표를 소셜 전용으로 만들지 않고, 제공자 번호는 프로필 API로 받음 | Accepted | 2026-10-04 | 05 |
| [ADR-0040](0040-login-temp-state-in-http-session.md) | 로그인 도중의 임시 값은 `HttpSession`에 두고, 서버 수에 따라 저장소를 설정으로 고름 | Accepted | 2026-10-04 | 05 |
| [ADR-0041](0041-account-deleted-event-registry.md) | 계정 삭제는 `AccountDeleted` 이벤트로 알리고, 발행 저장소의 완료 기록은 지움 | Accepted | 2026-10-04 | 05 |
| [ADR-0042](0042-same-origin-web-server-and-auth-paths.md) | 화면 파일은 앞단 웹 서버가 내려 주고 API와 같은 주소, 인증 주소는 `/api/v1/auth` 아래 | Accepted | 2026-10-04 | 05 |
| [ADR-0043](0043-reauthentication-for-sensitive-actions.md) | 중요한 기능에만 다시 본인 확인, 탈퇴는 제공자 재인증 전용 등록 | Accepted | 2026-10-04 | 05 |
| [ADR-0044](0044-auth-owns-security-filter-chain.md) | 앱 전체의 보안 설정은 `auth` 모듈이 가지고, 보호하는 주소는 `/api/v1/me` 아래뿐 | Accepted | 2026-10-04 | 05 |
| [ADR-0045](0045-result-code-in-url.md) | 로그인·탈퇴 결과는 주소 뒤의 코드로 화면에 알리고, 돌아갈 주소는 화면이 기억함 | Accepted | 2026-10-04 | 05 |
| [ADR-0046](0046-auth-feature-toggle.md) | 로그인 기능은 서버 설정으로 켜고 끔 (저장소는 나누지 않음) | Accepted | 2026-10-04 | 05 |
| [ADR-0047](0047-maintenance-procedures-in-dev.md) | 정기 유지보수 절차는 dev `docs/maintenance/` 한 곳에, 수집기도 dev `scripts/crawl/`로 (plan은 원칙·조사·결정) | Accepted | 2026-10-04 | 사이클 밖 |
| [ADR-0048](0048-mylibrary-mapping-module.md) | 둘째 회원 모듈은 "내 도서관" 전용 `mylibrary` (0036 대체) | Accepted | 2026-10-04 | 06 |
| [ADR-0049](0049-my-library-list-and-save-api.md) | 내 도서관 화면은 도서관 공개 목록 하나로, 저장은 지역 통째로·도서관 하나씩 (`/api/v1/me/` 아래) | Accepted | 2026-10-04 | 06 |
| [ADR-0050](0050-chosen-libraries-first-and-exempt.md) | 직접 추가한 도서관은 검색에서 맨 앞, 자격 규칙의 예외 | Accepted | 2026-10-04 | 06 |
| [ADR-0051](0051-account-lock-and-republish.md) | 저장과 탈퇴가 겹쳐도 지워진 계정의 자료가 남지 않게 (계정 줄 잠금, 재시작 때 다시 처리) | Accepted | 2026-10-04 | 06 |
| [ADR-0052](0052-candidate-libraries-collection-link.md) | 후보 도서관은 서비스 새 번호로, 수집 DB 번호와의 짝은 새 모듈 `collection` (seed로 넣음) (ADR-0060으로 넓힘: 가져오기·짝 조회 모두 collection 안) | Accepted | 2026-10-05 | 07 |
| [ADR-0053](0053-unsurveyed-libraries-only-when-chosen.md) | 가입 조사 상태 넷(조사함/원문 없음/소속 구성원용/종류 모름), 조사하지 않은 도서관은 직접 추가했을 때만 검색에 (ADR-0013·0050 보완) | Accepted | 2026-10-05 | 07 |
| [ADR-0054](0054-import-all-service-libraries.md) | 가져오기는 모든 서비스 도서관의 책을, 나눠 읽어서 (사이클 04 범위 변경) | Accepted | 2026-10-05 | 07 |
| [ADR-0055](0055-book-library-ids-precomputed.md) | 책마다 가진 도서관 번호 목록을 가져올 때 미리 계산 | Accepted | 2026-10-05 | 07 |
| [ADR-0056](0056-bookcube-aladin-adapters.md) | 북큐브·알라딘은 책 상세로 읽고, 북큐브 대여형·교보 소장형은 따로 판정 | Accepted | 2026-10-05 | 07 |
| [ADR-0057](0057-direct-add-before-login.md) | 로그인하지 않아도 직접 추가(브라우저 저장), 로그인 때 한 번에 옮기는 새 요청 (ADR-0049 보완) | Accepted | 2026-10-05 | 07 |
| [ADR-0058](0058-library-list-whole-with-compression.md) | 내 도서관 화면의 도서관 찾기는 목록 통째로 + 응답 압축 (ADR-0049 전환 조건 정리) | Accepted | 2026-10-05 | 07 |
| [ADR-0059](0059-library-logos.md) | 도서관 로고는 자체 로고가 있는 공공도서관만, 미리 줄인 파일, 누르면 메인 페이지, 없으면 빈 상자, DB 값으로 바로 내림, 서비스 안내 화면에 고지 | Accepted | 2026-10-05 | 07 |
| [ADR-0060](0060-collection-owns-catalog-import.md) | 가져오기는 `collection`이 맡고(ADR-0052 넓힘, ADR-0031 위치 바꿈), 제목 다듬기 규칙은 `catalog`에 한 벌만 두고 빌려 씀 | Accepted | 2026-10-05 | 07 |
| [ADR-0061](0061-library-extra-trusted-root.md) | 도서관 사이트 연결에만 최상위 인증 기관 하나(OISTE WISeKey Global Root GB CA)를 더 믿음 (ADR-0022 보완) | Accepted | 2026-10-05 | 07 |
| [ADR-0062](0062-book-id-carry-over-in-catalog-load.md) | 책 번호 잇기는 `catalog`의 표 바꾸기(`CatalogLoad.replaceAll`) 안에서 SQL로 함 | Accepted | 2026-10-05 | 07 |
| [ADR-0063](0063-candidate-final-origin-and-site-match.md) | 후보 도서관은 리다이렉트 최종 주소를 쓰고, 가져오기는 호스트·경로·쿼리로 같은 사이트를 확인 (ADR-0052 보완) | Accepted | 2026-10-05 | 07 |
| [ADR-0064](0064-aladin-publisher-bookcube-more-logo-line.md) | 알라딘 출판사 검색 씀, 북큐브 직접 찾기 "더 보기", 로고는 이름 위 줄·없으면 안 그림 (ADR-0056·0059 일부를 바꿈) | Accepted | 2026-10-05 | 07 |
| [ADR-0065](0065-import-write-new-tables-then-swap.md) | 가져오기는 새 표에 색인 없이 쓰고 이름 바꿔 끼움, 국가서지 결과 남기기, 소장 번호 이어 매김, 옛 표 바로 지움 (ADR-0062 보완) | Accepted (국가서지 부분은 ADR-0069, 소장 번호 부분은 ADR-0070이 바꿈) | 2026-10-11 | 08 |
| [ADR-0066](0066-memory-reduction-structure.md) | 메모리 줄이기: 계획·소장은 필요한 줄만 읽음, 캐시 통계로 재고 상한, jcmd로 잼, 설정 자리, 응답 복사 줄임 | Accepted | 2026-10-11 | 08 |
| [ADR-0067](0067-exclude-kyobo-rental-mixed.md) | 교보 대여·혼합 도서관 230곳은 받지도 넣지도 않음, 넣은 11곳 seed에서 지움 (ADR-0052·0054 보완) | Accepted | 2026-10-11 | 08 |
| [ADR-0068](0068-updated-at-by-db-trigger.md) | 고친 시각(updated_at)은 모듈마다 DB 트리거가 적음 | Accepted | 2026-10-11 | 08 |
| [ADR-0069](0069-national-bibliography-raw-and-rule-change.md) | 국가서지는 원문을 남기고 매번 다듬음(판 번호 없음), 정리 규칙을 바꿀 때 상황별로 다시 가져옴 (ADR-0065 일부를 바꿈) | Accepted | 2026-10-11 | 08 |
| [ADR-0070](0070-holding-id-carry-over-and-gone-notice.md) | 같은 소장은 옛 소장 번호를 잇고, 빠진 책·소장은 따로 알림(`holding_not_found`) (ADR-0065 일부를 바꿈) | Accepted | 2026-10-11 | 08 |
| [ADR-0071](0071-library-name-and-classification.md) | 도서관 이름에는 기관 이름만, 업체·대출 방식은 분류로, (이름, 업체, 대출 방식, 순번) UNIQUE (ADR-0017 일부·사이클 07 seed 이름 규칙을 바꿈) | Accepted | 2026-10-11 | 09 |
| [ADR-0072](0072-popular-books-source-kpipa.md) | 인기 도서 출처는 출판유통통합전산망 공개 통계 화면(알라딘·정보나루 안 씀) | Accepted | 2026-10-11 | 10 |
| [ADR-0073](0073-popular-module.md) | 인기 도서는 새 모듈 `popular`가 받기·저장·API를 맡음 | Accepted | 2026-10-11 | 10 |
| [ADR-0074](0074-popular-isbn-lookup-shared-cache.md) | 순위 책과 우리 책은 볼 때 ISBN으로 맞추고 책 정보는 공용 캐시(10분) | Accepted | 2026-10-11 | 10 |
| [ADR-0075](0075-popular-cover-prefetch-proxy.md) | 표지는 매달 미리 받아 우리 서버가 넘겨줌, 최근 두 달 보관 | Superseded by 0081 | 2026-10-11 | 10 |
| [ADR-0076](0076-library-classification-api-and-rename.md) | 도서관 분류 값(vendor·lendingModel·orderNo)은 API로 보내고 화면이 글자를 만듦, 이름은 번호로 고치는 changeset(014), 이름 찾기는 화면에서 (ADR-0071을 이어서) | Accepted | 2026-10-11 | 09 |
| [ADR-0077](0077-popular-drop-sparse-categories.md) | 인기 도서는 전자책이 거의 없는 다섯 분류(만화·어린이·청소년·기타·의학·스포츠)를 받지 않음, ADR-0072 범위·0074·0075 숫자 바로잡음 | Superseded by 0080 | 2026-10-11 | 10 |
| [ADR-0078](0078-separate-import-export-apply.md) | 가져오기는 내 PC에서 하고 운영 DB에는 파일 하나(pg_dump -Fc, load_manifest)로 옮겨 비교 뒤 바꿔 끼움, 모드 in-place·export·apply·finish·discard (ADR-0065를 이어서) | Accepted | 2026-10-12 | 11 |
| [ADR-0079](0079-grouping-modes-same-result.md) | 책 묶기는 세 방식(current·compact·sql)을 설정으로 고르고 결과가 번호까지 같아야 씀, 묶기 규칙은 그대로. 덧붙임: 사이클 12에서 compact·sql 둘 다 남김 | Accepted | 2026-10-12 | 11 |
| [ADR-0081](0081-popular-cover-resize-200px-jpeg.md) | 표지는 미리 받아 폭 200px JPEG로 줄여 저장하고 우리 서버가 넘겨줌, 표지 본문 상한 50MB, 경로 폴더 여럿, 1,600만 화소 상한 (ADR-0075를 대체) | Accepted | 2026-10-12 | 10 |
| [ADR-0080](0080-popular-fourteen-categories.md) | 인기 도서는 일곱 분류(만화·어린이·청소년·기타·의학·스포츠·언어·기술·공학)를 받지 않고 "전체" + 14분류, 요청 30건·750권, display_order CHECK 0..14 (ADR-0077을 대체) | Accepted | 2026-10-12 | 10 |
