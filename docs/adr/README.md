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
| [ADR-0035](0035-grouping-step4-and-code-spaces.md) | 같은 책 묶기 ④(정리한 전체 제목·저자·출판사)와 책 번호 체계 공유 범위 | Accepted (④ 부분은 ADR-0082로 바뀜) | 2026-09-30 | 04 (2026-10-01 늦게 기록) |
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
| [ADR-0072](0072-popular-books-source-kpipa.md) | 인기 도서 출처는 출판유통통합전산망 공개 통계 화면(알라딘·정보나루 안 씀) | Superseded by 0089 | 2026-10-11 | 10 |
| [ADR-0073](0073-popular-module.md) | 인기 도서는 새 모듈 `popular`가 받기·저장·API를 맡음 | Superseded by 0089 | 2026-10-11 | 10 |
| [ADR-0074](0074-popular-isbn-lookup-shared-cache.md) | 순위 책과 우리 책은 볼 때 ISBN으로 맞추고 책 정보는 공용 캐시(10분) | Superseded by 0090 | 2026-10-11 | 10 |
| [ADR-0075](0075-popular-cover-prefetch-proxy.md) | 표지는 매달 미리 받아 우리 서버가 넘겨줌, 최근 두 달 보관 | Superseded by 0081 | 2026-10-11 | 10 |
| [ADR-0076](0076-library-classification-api-and-rename.md) | 도서관 분류 값(vendor·lendingModel·orderNo)은 API로 보내고 화면이 글자를 만듦, 이름은 번호로 고치는 changeset(014), 이름 찾기는 화면에서 (ADR-0071을 이어서) | Accepted | 2026-10-11 | 09 |
| [ADR-0077](0077-popular-drop-sparse-categories.md) | 인기 도서는 전자책이 거의 없는 다섯 분류(만화·어린이·청소년·기타·의학·스포츠)를 받지 않음, ADR-0072 범위·0074·0075 숫자 바로잡음 | Superseded by 0080 | 2026-10-11 | 10 |
| [ADR-0078](0078-separate-import-export-apply.md) | 가져오기는 내 PC에서 하고 운영 DB에는 파일 하나(pg_dump -Fc, load_manifest)로 옮겨 비교 뒤 바꿔 끼움, 모드 in-place·export·apply·finish·discard (ADR-0065를 이어서) | Accepted | 2026-10-12 | 11 |
| [ADR-0079](0079-grouping-modes-same-result.md) | 책 묶기는 세 방식(current·compact·sql)을 설정으로 고르고 결과가 번호까지 같아야 씀, 묶기 규칙은 그대로. 덧붙임: 사이클 12에서 compact·sql 둘 다 남기고 current는 지움 | Accepted (덧붙임의 "current 지움"은 ADR-0105가 바꿈: 셋 모두 남김·기본 compact·이름 objects) | 2026-10-12 | 11 |
| [ADR-0081](0081-popular-cover-resize-200px-jpeg.md) | 표지는 미리 받아 폭 200px JPEG로 줄여 저장하고 우리 서버가 넘겨줌, 표지 본문 상한 50MB, 경로 폴더 여럿, 1,600만 화소 상한 (ADR-0075를 대체) | Superseded by 0091 | 2026-10-12 | 10 |
| [ADR-0080](0080-popular-fourteen-categories.md) | 인기 도서는 일곱 분류(만화·어린이·청소년·기타·의학·스포츠·언어·기술·공학)를 받지 않고 "전체" + 14분류, 요청 30건·750권, display_order CHECK 0..14 (ADR-0077을 대체) | Superseded by 0089 | 2026-10-12 | 10 |
| [ADR-0083](0083-library-registry-add.md) | `library`에 공개 기능 "도서관 더하기"(`LibraryRegistry`), 번호는 부르는 쪽이 정하고 부르는 쪽 트랜잭션 안에서만 ("Java never saves a library"를 바꿈) | Accepted | 2026-10-12 | 13 (12보다 미리) |
| [ADR-0084](0084-library-insert-command.md) | 새 도서관은 `collection` 명령으로 미리 보기 → 보고서 → 넣기, 서비스 DB 전체와 비교, seed로 번호를 넣지 않음 (ADR-0052 seed 부분을 바꿈) | Accepted | 2026-10-12 | 13 (12보다 미리) |
| [ADR-0085](0085-library-rules-tsv-in-dev.md) | 사람이 정한 도서관 규칙은 dev git `scripts/library/rules/` TSV, 지역은 번호로 미리 풂 | Accepted | 2026-10-12 | 13 (12보다 미리) |
| [ADR-0086](0086-apply-file-v2-library-part.md) | 반영 파일 판 2: 새 도서관을 `load_manifest.notes`에 싣고 운영은 도서관 → 비교 → 책 (ADR-0078을 이어서) | Accepted | 2026-10-12 | 13 (12보다 미리) |
| [ADR-0087](0087-join-survey-date-notice.md) | 가입 조건 조사 기준일은 하나만(날짜 파일 → 넣기 실행 기록), `/about` 공지 한 줄, 도서관마다 날짜 칸 없음 | Accepted | 2026-10-12 | 13 (12보다 미리) |
| [ADR-0088](0088-crawler-switch-to-dev.md) | 수집은 dev `scripts/crawl/`로 갈아타고 옛 코드는 보관 폴더에 백업, 지우지 않음 (ADR-0047을 이어서) | Accepted | 2026-10-12 | 13 (12보다 미리) |
| [ADR-0082](0082-grouping-step4-main-title-volume-isbn-split.md) | 네 번째 묶기 단계: 본제목 + 권 표시로 비교, ISBN 다르면 나눔, 자리 채움 값은 없음, `collection` 안 (ADR-0035 ④ 부분을 바꿈) | Accepted (ADR-0106이 보완) | 2026-10-12 | 12 |
| [ADR-0089](0089-librarian-picks-source-and-module.md) | 인기 도서를 사서추천도서로: 국립중앙도서관 Open API(주 1회 1건, 최근 추천 6번), 새 모듈 `picks`, `popular`·출판유통통합전산망 코드·changeset 지움 (ADR-0072·0073·0080을 대체) | Accepted (범위·요청 기간은 ADR-0108이 바꿈: 최근 12번·요청 3년) | 2026-10-12 | 14 |
| [ADR-0090](0090-picks-match-isbn-then-title-author-in-cache.md) | 사서추천 책은 공용 캐시를 만들 때 ISBN, 안 되면 본제목 + 첫 저자로 맞춤(`catalog` 새 조회), 여럿이면 가진 도서관 많은 책 (ADR-0074를 대체) | Accepted | 2026-10-12 | 14 |
| [ADR-0091](0091-picks-cover-nlk-resize-200px.md) | 사서추천 표지는 국립중앙도서관 표지를 받아 200px JPEG로 줄여 우리 서버가 넘겨줌, 우리 전자책 표지는 이번에 안 씀 (ADR-0081을 대체) | Accepted | 2026-10-12 | 14 |
| [ADR-0092](0092-picks-fetch-retry-daily-and-catch-up.md) | 사서추천 받기는 실패하면 성공할 때까지 매일 다시, 마지막 성공이 7일보다 오래되면 따라잡음 (ADR-0089의 "다음 날 한 번 더"를 바꿈) | Accepted | 2026-10-12 | 14 |
| [ADR-0093](0093-library-insert-read-and-apply-run-record.md) | 넣기 명령은 `LibraryRegistry.listAll()`로 서비스 도서관 전체를 보고, 운영 반영은 넣기 실행 기록 줄도 옮김, 기준일 경로 `/api/v1/join-surveys/latest` (ADR-0083·0084·0086·0087 보완) | Accepted | 2026-10-12 | 13 (12보다 미리) |
| [ADR-0094](0094-blocked-server-other-ip-kyobo-3-per-fetch-server.md) | 우리를 막은 서버에는 막힌 IP에서만 보내지 않고 다른 우리 IP에서 수집 동시 1건·1초, 교보 구독형 서버 서비스 조회는 나가는 IP마다 동시 3건(설정으로 조절)·느려지면 1건·막힘 신호면 멈춤 (ADR-0011 교보 서버 한정 보완, 서비스 조회는 ADR-0095와 함께) | Proposed | 2026-10-13 | 사이클 밖 (배포 조사) |
| [ADR-0095](0095-lookup-egress-proxies-per-ip-browser-ua.md) | 서비스 대출 조회는 세 나가는 길(직접·업체 고정 IP 프록시·조회 서버)을 설정으로 고르고, 나가는 IP마다 따로 세며, 막힌 IP만 그 사이트에서 멈추고, 일반 브라우저 User-Agent로 보냄 (ADR-0011 일부·사이클 01 UA 식별을 서비스 조회에 한해 바꿈) | Proposed | 2026-10-13 | 사이클 밖 (배포 조사) |
| [ADR-0096](0096-usage-log-storage-and-fields.md) | 사용자 행동 기록(검색·도서관 클릭·책 상세·더 보기·사서 추천 보기·지역/내 도서관 바꾸기·도서관 응답 하루 요약)은 같은 PostgreSQL 새 schema에, 지역·도서관·로그인 여부·IP 포함, IP는 30일·나머지 1년, 회원 번호·쿠키·User-Agent는 안 남김 (2026-10-12 조사의 "IP 안 남김"을 바꿈) | Accepted (2026-10-14) | 2026-10-13 | 15 |
| [ADR-0097](0097-usagelog-module-and-write-path.md) | 기록 전용 모듈 `usagelog`, `catalog`·`availability`가 공개 창구 직접 호출(이벤트 안 씀), 5초 묶음 `batchUpdate`·비동기 커밋, 표 여덟, 사용 알림은 fetch keepalive + CSRF, IP는 `X-Real-IP` | Accepted (2026-10-14) | 2026-10-13 | 15 |
| [ADR-0098](0098-sitecontent-module-versioned-documents.md) | 공지·서비스 안내·약관 글을 새 모듈 `sitecontent`가 DB에 판으로(판 순번, 지금 판 = 시행된 것 중 최대), 쓰기는 SQL, 고정 1쪽 위, 숨김은 남김 | Accepted | 2026-10-13 | 16 |
| [ADR-0099](0099-signup-document-version-from-sitecontent.md) | 가입 문서 버전 원본을 서버 설정에서 `sitecontent`로, 동의 기록 = 판 순번, `auth → sitecontent` (사이클 05 제약 27 폐기, AC-18 변경) | Accepted | 2026-10-13 | 16 |
| [ADR-0100](0100-privacy-policy-public-regardless-of-login.md) | 처리방침은 로그인 기능과 상관없이 공개 (사이클 05 제약 35 일부 변경) | Accepted | 2026-10-13 | 16 |
| [ADR-0101](0101-terms-change-notice-or-reconsent.md) | 약관이 바뀔 때: 가벼우면 공지 + 시행일, 중요하면 다음 로그인 때 다시 동의(화면은 나중) | Accepted | 2026-10-13 | 16 |
| [ADR-0102](0102-access-cookie-api-v1-and-login-status-reader.md) | 액세스 토큰 쿠키 경로를 `/api/v1`로 넓히고, 로그인 상태 판별은 `auth`의 부품 하나에 모음 (만료돼도 서명 맞으면 로그인함, 로그인 꺼짐이면 쿠키를 보지 않음; ADR-0042의 액세스 쿠키 경로 부분을 바꿈) | Accepted (2026-10-14) | 2026-10-14 | 15 |
| [ADR-0103](0103-production-server-layout.md) | 첫 운영 서버는 compose 한 벌(edge·app 네트워크), 비밀 값은 띄우기 스크립트가 Parameter Store에서, 지표는 별도 포트·Micrometer 카운터·접속 기록 exporter·cAdvisor, 백업은 수집 목록 빼고 Tunnel SSH로 받음 | Proposed | 2026-10-14 | 17 |
| [ADR-0104](0104-first-deploy-host-ec2-credit-iam-role.md) | 첫 배포 호스트는 AWS EC2 t4g.medium(4GB·서울), 무료 크레딧으로 최대 6개월 운영, 비밀 값은 IAM 역할로 접근 키 없이(ADR-0103의 접근 키 전제를 이 호스트에서 대체) | Proposed | 2026-10-14 | 17 |
| [ADR-0105](0105-grouping-three-modes-default-compact.md) | 책 묶는 방식 셋(compact·objects·sql)을 모두 남기고 기본은 compact, 옛 이름 current → objects (ADR-0079 덧붙임의 "current 지움"을 바꿈) | Accepted | 2026-10-14 | 11·12 (회고) |
| [ADR-0106](0106-grouping-step4-author-title-subtitle-split-volume-numbers.md) | 네 번째 묶기 단계 보완: 본제목이 저자 이름이면 전체 제목, 부제는 같은 도서관이 따로 가질 때만 나눔, 권 숫자는 권·판처럼 보이는 것만, 로마·한자 숫자, 꼬리 넷 (ADR-0082 보완) | Accepted | 2026-10-14 | 12 (회고) |
| [ADR-0107](0107-library-insert-additions.md) | 넣기 명령 보탬: 새 곳 최종 주소 줄 필수, 확인한 사라진 곳 gone_known.tsv, 번호는 nextId()부터, 종료 5, 운영 반영은 같은 번호가 다른 도서관이면 멈춤 (ADR-0084·0085·0086 보완) | Accepted | 2026-10-14 | 13 (회고) |
| [ADR-0108](0108-picks-twelve-recommendations-three-year-window.md) | 사서추천도서는 최근 12번(2년)을 보여 주고 요청 기간은 3년, 도움말에 12번(2년)과 추천 주기 (ADR-0089의 범위·기간 부분을 바꿈) | Accepted | 2026-10-14 | 14 (회고) |
| [ADR-0109](0109-disable-libraries-by-liquibase.md) | 이미 켜진 도서관을 끄거나 다시 켤 때는 library 모듈의 새 Liquibase 변경 파일로 (내 PC·운영 같은 판, 반영 비교가 맞게) | Accepted | 2026-10-14 | 18 |
| [ADR-0110](0110-library-insert-skips-zero-ebook-sites.md) | 새 도서관 넣기에서 가져오기와 같은 거르기 규칙으로 센 줄이 0이면 "전자책 0권"으로 뺌, 기존 이유 6개 다음, 묻지 않음 (ADR-0107 보완) | Accepted | 2026-10-14 | 18 |
| [ADR-0111](0111-underscore-host-separate-request-path.md) | 호스트에 밑줄이 있는 도서관 주소: 가져오기는 collection 안의 밑줄 받는 읽기, 대출 조회·직접 찾기는 따로 만든 요청 길(SNI 없이, 인증서 검사 켬) | Accepted | 2026-10-14 | 18 |
| [ADR-0112](0112-underscore-host-path-in-fetch-service.md) | 밑줄 호스트 요청 길을 조회 서버 앱(fetch-service)에도 넣음: UrlGuard는 연결할 이름으로 DNS 풀어 내부망 거부 유지, 같은 라이브러리·같은 조건 (ADR-0111 보완) | Accepted | 2026-10-14 | 18 |
| [ADR-0116](0116-usagelog-cached-answer-count.md) | 사용 기록에 도서관별 "캐시 답" 수(`cached_count`, 결과 값 `CACHED`)를 남김, 사이클 19에 끼움 | Accepted | 2026-10-15 | 19 |
| [ADR-0113](0113-author-marks-and-glued-roles-in-normalize.md) | 저자 정리에서 꺾쇠·괄호 표시를 떼고 붙은 역할 낱말을 나누며, 책 저자 칸도 같은 규칙으로 정리(`catalog.normalize`) | Accepted | 2026-10-15 | 19 |
| [ADR-0114](0114-grouping-supplier-codes-and-leading-notes.md) | 같은 책 묶기에서 같은 공급사의 상품 코드로 잇고, 제목 앞 괄호(관제)를 떼고 견줌 (ADR-0106에 덧붙임) | Accepted | 2026-10-15 | 19 |
| [ADR-0115](0115-swapped-author-publisher-portals.md) | 저자·출판사가 뒤바뀐 세 포털은 가져올 때 규칙 파일로 바꿔 읽고, 수집기도 고치며, 검증 스크립트로 다시 확인하고 지움 | Accepted | 2026-10-15 | 19 |
| [ADR-0117](0117-human-rules-index-for-ai.md) | 사람이 정한 수집·가져오기·도서관 규칙은 코드·표 파일에 두고 dev 규칙 목록 문서로 찾고 검증 (ADR-0085를 넓힘) | Accepted | 2026-10-15 | 19 |
| [ADR-0118](0118-lookup-status-polling-and-host-queue-board.md) | 조회 상태 신호는 화면이 10초마다 묻고(SSE 아님), 서버는 자리·최근 503·길마다 줄 선 호스트를 메모리 `HostQueueBoard`에서 세어 1초 캐시로, 주소는 도서관 호출 구역 밖 | Proposed | 2026-10-16 | 20 |
| [ADR-0119](0119-extension-as-user-side-fetcher-server-parses-and-checks.md) | 크롬 확장은 사용자 쪽 조회 서버: GET만 하고 화면이 계획 입구 셋으로 원본을 올리며, 서버가 `accept` 입구로 같은 코드로 해석·캐시·판정하고 검사 ①~⑩으로 가짜를 거름, 상한은 설정 하나 | Proposed | 2026-10-16 | 20 |
| [ADR-0120](0120-extension-folder-no-build-chrome-first-dev-mode.md) | 확장은 dev `extension/` 폴더에 빌드 없이, 모든 사이트 권한, 호스트 1건·1초, 크롬만 먼저, 이번엔 개발자 모드까지 | Proposed | 2026-10-16 | 20 |
| [ADR-0121](0121-same-header-on-every-screen.md) | 공통 머리말은 약관·처리방침 포함 모든 화면에서 같음(사이클 05·10·14 예외 폐지, `legal` 분기 제거) | Proposed | 2026-10-16 | 20 |
| [ADR-0122](0122-recommended-lists-one-module-one-table.md) | 추천 목록 셋(이동진·사서·서울대)은 `picks` 모듈 하나가 맡고, 책 줄은 표 `list_book` 하나에 담음 (`pick` 표 없앰) | Accepted | 2026-10-16 | 21 |
| [ADR-0123](0123-curated-lists-ride-export-manifest.md) | 이동진·서울대 목록은 수집기가 만든 목록 파일을 가져오기 파일 목차(`notes.listPart`, 판 3)에 실어 운영 반영 때 넣고, 표지도 수집기가 줄여 함께 실음 | Accepted | 2026-10-16 | 21 |
| [ADR-0124](0124-pinned-edition-matched-at-export.md) | 이동진·서울대의 판은 수집기가 내 PC DB를 읽어 고르고(고정 판), 가져오기 파일을 만들 때 같은 파일의 책 표에 대고 맞춰 책 번호를 저장함. 서버는 읽기만 | Accepted | 2026-10-16 | 21 |
| [ADR-0125](0125-book-choice-subscription-counts-once.md) | 같은 책 여러 판 가운데 고를 때 보유량은 구독형이 아닌 도서관 수 + 구독형 도서관에 하나라도 있으면 1 | Accepted | 2026-10-16 | 21 |
| [ADR-0126](0126-picks-api-per-list-and-usage-list.md) | 추천 목록 API는 `GET /api/v1/picks/{listKey}`(옛 `GET /api/v1/picks`는 지움), 이용 기록에 목록 이름 `list` | Accepted | 2026-10-16 | 21 |
| [ADR-0127](0127-header-mega-menu.md) | 머리말은 도서관 정보나루식 큰 메뉴: 「추천도서」(이동진 추천도서·사서 추천도서·서울대 100선)·「마이페이지」(내 도서관 관리), PC는 올림 0.5초로 펼침(덮지 않음), 폰은 ☰ | Accepted | 2026-10-16 | 21 |
| [ADR-0128](0128-leedongjin-list-by-collector-youtube-api.md) | 이동진 추천도서는 수집기가 YouTube Data API(공식)와 국립중앙도서관 ISBN 서지 API로 모아 목록 파일(dev `scripts/crawl/lists/` TSV)에 적음 | Accepted | 2026-10-16 | 21 |
| [ADR-0129](0129-picks-shown-title-from-matched-book.md) | 추천 목록 화면의 책 이름은 맞춘 우리 책 제목에서 판 표시를 덜어 낸 이름 (못 맞추면 목록 이름) | Proposed | 2026-10-16 | 21 |
