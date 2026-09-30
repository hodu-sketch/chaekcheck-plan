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
| [ADR-0036](0036-auth-and-member-modules.md) | 계정(`auth`)과 회원 자료(`member`)를 다른 모듈로 둠 | Accepted | 2026-10-01 | 05 |
| [ADR-0037](0037-search-unaware-of-member-library-ids.md) | 검색 모듈은 회원을 모르고, 웹이 "내 도서관"을 파라미터로 넘김 | Accepted | 2026-10-01 | 05 (구현은 06) |
