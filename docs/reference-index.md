# 참고 문서 색인 — 다음에 개발·설계·관리할 때 볼 문서

작성 2026-10-01. 사이클과 상관없이 계속 쓰는 문서들을 주제별로 모았습니다. 사이클 문서(`docs/cycles/NN-*/`)는 그 사이클의 기록이고, 여기 적힌 것은 "지금 어떻게 하는가"를 아는 데 필요한 문서입니다. 문서를 새로 만들거나 원본이 바뀌면 이 색인을 고칩니다.

원칙 [확정] (사용자, 2026-10-01, dev C2-U-7 답): **절차의 원본은 dev `docs/library-maintenance.md`**, **조사 기록과 근거 수치는 plan**. 둘이 어긋나면 dev 절차가 최신입니다.

## 0. 늘 먼저 보는 것

| 문서 | 무엇 |
|---|---|
| `CLAUDE.md` (plan) | 사이클 진행 방식, 현재 사이클 |
| `docs/backlog.md` | 아직 사이클에 안 들어간 것, 다음 순서(맨 위 "2026-10-01 정리"), 미룬 것 |
| `docs/current/` (`module-map.md`, `data-model.md`, `api.md`, `flows.md`, `handoff.md`) | 지금 설계 전체. `handoff.md`는 현재 인계서(사이클 04) |
| `docs/adr/README.md` | 결정 목록 (ADR-0001~0034) |
| dev `docs/plan-feedback.md` | dev가 개발 중 바꾼 것·측정·질문. 사이클별 절(`# 사이클 04`는 702행~). **다음 회고의 입력** |
| dev `CLAUDE.md` | 스택·모듈 규칙 (plan에서 다시 적지 않음) |

## 1. 도서관 목록 수집 (어디서 목록을 얻고, 살아 있는지 확인하고, 넣고 끄는가)

| 문서 | 무엇 | 상태 |
|---|---|---|
| dev `docs/library-maintenance.md` 4-0~4-7, 11절, 3절(도구) | **절차 원본**. 교보 공식 목록 216곳(HTML 선택자), 공공데이터포털 전국도서관표준데이터, 통합 포털 목록, 웹러브 북스, 주소 모양으로 화면 종류 나누기, `CheckKyoboSites.java`/`CheckYes24Sites.java`로 최종 주소 확정 | 최신 (2026-09-30) |
| dev `docs/library-maintenance.md` 4-9, 6-2 | 운영 로그 신호(3xx·파싱 실패·timeout)별 할 일, 꺼 둔 도서관(id 59, 131 → 2027-01 재개 확인) | 재조사 주기 미정 [확인 필요] |
| dev `docs/library-site-issues.md` | 빠진 사이트 이유별 표(1·2절), 중간 인증서 만료(3절: 2027-05-21, 2027-11-02), 판단 못 한 곳(4절), 다시 볼 때 순서(7절) | 최신 |
| plan `docs/cycles/02-library-expansion/collection-method.md` | 2026-09-28 조사 방법 기록. 머리말에 "절차 원본은 dev" 안내(2026-10-01) | 기록용 |
| plan `docs/cycles/02-library-expansion/research.md` | 조사 결과·근거(1·8·10절), 새 주소 못 찾은 약 20곳(12절), robots.txt 방침(9절) | 기록용 |
| plan `docs/cycles/02-library-expansion/data/kyobo-institutions.tsv` | 교보 기관 목록 원자료 | 재조사 때 비교 |

## 2. 도서관 분류 (화면 종류, 가입 자격, 지역, 조회 순서)

| 문서 | 무엇 | 상태 |
|---|---|---|
| dev `docs/library-maintenance.md` 1-3, 4-6 | 화면 종류(`platform_type`) 7종 값·경로 모양·문자셋 판별. 인코딩 먼저 보기. adapter 없는 화면은 넣지 않음 | 최신 |
| plan `docs/adr/0016-adapter-per-platform-type.md`, `0023-platform-type-generation-names.md` | 화면 종류마다 adapter 하나, 세대 번호 규칙 | 확정 |
| dev `docs/library-maintenance.md` 1-1, 1-2, 4-8, 4-10, 14절 | 가입 자격 판정(원문 우선·추정 금지), 방문 가입 `visit_required` 판단 순서, 사용자 확인 대기 13건 | 최신 |
| dev `docs/library-research/join-classification-2026-09-29.tsv`(+`-notes.md`), `-new42-*`, `scripts/library/join_overrides.tsv`, `apply_join_classification.py`, `eligibility_rules.py` | 자격 판정 결과와 도구. `join_overrides.tsv`(사람이 정한 값)가 마지막에 이김 | 최신 |
| plan `docs/adr/0013-eligibility-unverified.md`, `0027-visit-join-filter-and-order.md` | 규칙 없음 = 자격 미확인, 방문 가입 필터와 조회 순서 | 확정 |
| plan `docs/current/data-model.md` `library` 절, seed 절 | 칼럼 뜻, 지역 ID 규칙(시도 2자리·시군구 4자리), 통합 시·도 12 | 최신 |
| plan `docs/cycles/04-and-search/design-delta.md` 282행 부근 | 책 검색 기본 순서 `joinTier`(내 시군구 → 내 시도 → 누구나 → 방문 가입만 → 확인 필요) | 확정 |
| plan `docs/cycles/02-library-expansion/eligibility.md`, `eligibility-by-library.md` | 2026-09-28 검색 요약 단계 기록. 머리말에 "최신은 dev tsv" 안내(2026-10-01) | 기록용 |

## 3. 책 수집 (전자책 목록을 도서관 사이트에서 모으기)

| 문서 | 무엇 | 상태 |
|---|---|---|
| plan `docs/research/ebook-catalog/crawl-method.md` | 원칙(호스트 1건·1초, UA), 종류(전체/신간), 절차, 날짜 3층, 저장 항목 [확정], 실행 도구(8절) | 수집 세션이 관리 |
| plan `docs/research/ebook-catalog/crawl-runbook.md` | **입구 문서 (먼저 읽음)**: 읽는 순서(0절), 지금 상태(1절), 이어 받기·상태 보기(3절), 수집기 규칙 요약(4절), 명령 모음(5절), 받지 않는 도서관(5-1절 `crawl_skip`), 문제별 대처(6절), 새 사이트·플랫폼 붙이는 순서(7절), 상세 URL·오디오북 표시(9·10절) | 수집 세션이 관리, 2026-10-01 |
| plan `docs/research/ebook-catalog/platforms.md` | **플랫폼별 크롤링 방법**: 검색·전체 목록 URL, 한 쪽 크기, 줄 선택자, 상세 URL, 오디오북 구분, 사이트별 예외(교보·교보 구독형·YES24·통합 포털·강남구·북큐브·알라딘) | 수집 세션이 관리, 2026-10-01 |
| plan `docs/research/ebook-catalog/research.md` | 수집 조사(범위, 법적 검토 3절, 항목 4·5절) | 기록 |
| `chaekcheck-data/README.md`, `scripts/crawl_catalog.py`, `ebook-catalog.sqlite` | 수집기 코드와 수집 DB(두 저장소 밖) | [확인 필요: 이 색인에서 내용 확인 안 함] |
| dev `catalog/internal/importer/CollectedCatalog.java` | 가져올 때 제외 규칙(오디오북·동영상북, 서비스에 없는 도서관, 빠진 책, http 아닌 주소, 호스트 불일치, 제목 없음) | 구현 |

## 4. 책 분류·정리·묶기 (정리 규칙, ISBN, 같은 책, 저자, 자료 종류)

| 문서 | 무엇 | 상태 |
|---|---|---|
| plan `docs/research/ebook-catalog/search-and-normalization.md` 4절 | 정리 규칙: 저자 나누기·역할(4.1, 사이클 04 규칙 반영), 제목·본제목(4.2), 출판사(4.3), 출판일·대표값(4.4), **자료 종류(4.6, 2026-10-01 추가)** | 2026-10-01 갱신 |
| plan `docs/research/ebook-catalog/search-and-normalization.md` 3절 | 검색 저장소 비교, pg_bigm 측정, `shared_preload_libraries` 필요 [확정] | 갱신 |
| plan `docs/research/ebook-catalog/same-book-isbn.md` 5절 | **묶기 ①②③④ 구현 기준**(번호 체계, 국가서지 모호 규칙, ④ 정리한 전체 제목+저자+출판사), 5.1 dry run 수치, 5.2 대표값, 5.3 재작업 시 확인할 것 | 2026-10-01 갱신 |
| plan `docs/research/ebook-catalog/same-book-isbn.md` 3·4절 | 교보식 코드 → 종이책 ISBN 규칙, 국가서지 파일·ISBN 서지정보 API | 확정/확인 필요 혼재 |
| dev `docs/library-maintenance.md` 4-11, `scripts/library/check_code_spaces.py` | **책 번호 체계 점검** 절차와 기준값 표. 도서관 목록 확인 때마다 [확정] | 최신 |
| dev `catalog/internal/normalize/{CatalogText,Contributors,Isbn,PublishedDates}.java`, `importer/{BookGrouping,NationalBibliography,CatalogImporter}.java` | 규칙의 실제 코드. 문서와 코드가 다르면 코드가 실제 동작 | 구현 |
| plan `docs/adr/0031-catalog-importer-in-backend.md`, `0032-postgres-pg-bigm-contributors.md`, `0034-store-ebook-catalog.md`, `0035-grouping-step4-and-code-spaces.md` | 정리 코드 한 벌, pg_bigm·사람별 표, 목록 저장, 묶기 ④·번호 체계 결정 | 확정 |
| plan `docs/research/ebook-catalog/catalog-refresh.md` | 주기 갱신(별도 사이클) 참고: 순서(2절), 알려진 문제(4절), 표 swap 방향(5.1) | 계속 갱신 |

## 5. 회원·알림 (다음 사이클)

| 문서 | 무엇 |
|---|---|
| plan `docs/research/member-and-alerts/outline.md` | 회원 → 알림 밑그림 [안], 내 도서관 정의, 필터 제안, 사이클에서 정할 것 |
| plan `docs/research/member-and-alerts/signup-security.md` | 소셜 로그인·세션·개인정보법 공식 문서 확인 결과(2026-10-01), 지켜야 할 것 15개 |
| plan `docs/research/member-and-alerts/integration-plan.md` | 회원·알림을 프로젝트에 넣는 구조: 모듈(`auth`+`member`), 검색 연결(웹이 `libraryIds`), 세션, 표, API, 사이클 자르기 05·06·07 (사용자 결정 2026-10-01) |
| plan `docs/cycles/05-login-account/scope.md` | 현재 사이클(로그인·계정) 범위·완료 기준·먼저 조사할 것 |

## 6. 재작업 시 확인할 것 (한 곳에 모음)

세부 수치와 출처는 각 문서에 있습니다. 여기서는 "무엇을, 어디를 보고" 만 적습니다.

### 도서관 목록·분류 (도서관 재조사 때)

- 새 주소 못 찾은 약 20곳: plan `research.md` 12절, dev `library-site-issues.md` 1·2·7절
- 로그인해야 전자책 주소가 보이는 8곳(포항·고령·레인보우영동·광주동구·서귀포·정읍·함평·창원): dev `library-site-issues.md` 7절 — 사람이 로그인
- 판단 못 한 2곳(김해시청, 충북도청): dev `library-site-issues.md` 4절
- 꺼 둔 2곳(id 59, 131) 2027-01 재개 확인: dev `library-maintenance.md` 6-2
- 중간 인증서 만료 2027-05-21(GlobalSign AlphaSSL), 2027-11-02(Thawte): dev `library-site-issues.md` 3절
- 교보 공식 목록 재확인(요청 약 400건·20분)과 `kyobo-institutions.tsv` 비교: dev 4-1, 4-9
- 사용자 확인 대기 13건(경산·김천·대구·음성·경북·성동·고창·책이음 4곳·진천·양천·전남 12곳·세종북자람 등): dev `library-maintenance.md` 14절
- 자격 확인 필요 45곳, `join_method` 기본 문구 44곳, `join_url` 없음 39곳: dev `plan-feedback.md` 추후 과제 C
- 방문 가입 규칙 4번으로 true가 된 18곳 원문 다시 보기: dev 13절
- 인천교육청 포털 `deferred` 여부(사용자 결정 대기): `backlog.md`
- **책 번호 체계 점검**(`check_code_spaces.py` → 4-11 기준값과 비교. 크게 바뀌거나 새 화면 종류면 사용자에게): dev 4-11
- 읽는 코드 없는 화면 7종: dev `library-site-issues.md`, `backlog.md`
- 정기 재조사 주기 미정: dev 4-9, `backlog.md` "운영·인프라"

### 책 수집 (수집 다시 돌릴 때)

- 받지 않는 도서관 4곳(국회 44, 전북교육청 135, 군포 261, 김천 269)과 문제별 대처: `crawl-runbook.md` 5-1·6절, `catalog-refresh.md` 변경 기록
- 전체 성공 기록 없는 도서관 12곳(어느 곳인지 목록 없음): `catalog-refresh.md` 4절
- 큰 교보 구독형 16곳(2~3일)·북큐브 134곳 수집 상태, 순위 4 명령 없음: `crawl-runbook.md` 2절
- YES24·포털 77곳 재수집 완료 여부와 `verify_detail_urls.py` 재실행: `crawl-runbook.md`
- 제목에 "오디오북"인데 전자책 표시 452~476줄(`kind_check_needed`): `platforms.md`, `crawl-runbook.md`
- robots.txt 정책·UA 연락처 [확인 필요], 법적 위험 전문가 확인: `crawl-method.md`, `research.md` 3절
- 수집 원천 `content_type`에 새 값이 생기면 가져오기 CHECK에 걸림: `catalog-refresh.md` 4절

### 책 정리·묶기 (규칙 바꾸거나 다시 가져올 때)

- `same-book-isbn.md` 5.3절 표 그대로: 번호 체계 비율, ④ 출판일 2년 차이 11,019권, `48090…`·확인 숫자 불일치 코드, 국가서지 제목 다른 5%·없는 23%, 모호 키 5,303, ② 실효, YES24 재수집 뒤 수치, 국가서지 파일 갱신·API 인증키
- 저자: 단체 이름 79,649줄, 영문 "성, 이름" 1,607줄, 저자 빈 줄 746, ` - ` 제목 91,693줄: `search-and-normalization.md` 4.1·4.2
- 출판사 별칭 목록 비어 있음, 1950년 이전 날짜, 도서관마다 출간일 다른 13%: `search-and-normalization.md` 4.3·4.4·5절
- 실제 가져오기 미실행, 응답 시간 미측정, AC-1~14 미확인: `backlog.md` "미뤄 둔 사이클 04 마무리 작업", dev `plan-feedback.md` "측정 (아직)"
- pg_bigm `shared_preload_libraries` 운영 허용 여부: `search-and-normalization.md` 3.2.1

## 7. dev 문서에 알릴 것 (plan에서 못 고침 → 다음 인계서·회고에 넣음)

- dev `docs/library-maintenance.md` 41~42행 표가 깨져 3절 도구 표의 `CheckYes24Sites.java` 행이 유실됨. 4-10 표(275행)에 `YES24_V3` 누락. 절 번호 순서(4-9/4-11, 13/14절) 정리 필요. (2026-10-01 문서 점검에서 발견)
- C2-U-7(절차 원본을 어느 쪽으로 할지)에 대한 답 [확정] (사용자, 2026-10-01): "절차 원본 = dev `library-maintenance.md`, 조사 기록 = plan". 다음 인계서의 "개발 시작 전 확인"에 넣어 dev에 전달
