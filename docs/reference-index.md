# 참고 문서 색인 — 다음에 개발·설계·관리할 때 볼 문서

작성 2026-10-01, 고침 2026-10-04(정기 작업 문서, 3-1절 가져오기·검색), 2026-10-05(사이클 07 회고: 가져오기는 `collection` 모듈·dev `3-import.md`, 코드 위치, 꺼진 도서관), 2026-10-11(사이클 08 cycle-close: 도서관 이름 고침, 교보 대여·혼합 제외, 가져오기 바꿔 끼우기·시간 줄이기 방향, 정리 규칙을 바꿀 때, ADR-0065~0070), 2026-10-11(사이클 09 cycle-close: 도서관 이름은 기관 이름만, 업체·대출 방식·순번 분류, ADR-0071·0076), 2026-10-12(사이클 10 회고: 인기 도서 분류 14개·표지 200px JPEG, ADR-0080·0081; 사이클 11 cycle-close: 가져오기 따로 하기(내 PC 내보내기 → 운영 반영)·묶는 방식 셋, ADR-0078·0079, EC2 크기·서버 메모리 설명), 2026-10-12(사이클 13 cycle-close: 새 도서관은 seed 대신 `collection` 넣기 명령, 사람이 정한 도서관 규칙은 dev `scripts/library/rules/` TSV, 수집기 원본은 dev `scripts/crawl/`, AWS 서울 수집 조사, ADR-0083~0088·0093), 2026-10-14(사이클 11 최종·12 회고: 묶는 방식 기본 `compact`·옛 이름 `objects`, ④ 새 규칙 구현과 보완(작가 이름 제목, 부제는 같은 도서관 기준, 권 숫자), `same-book-isbn.md` 5.7, ADR-0105·0106), 2026-10-14(사이클 13 회고: 넣기 명령·수집기 갈아타기 구현됨, 규칙 파일 `final_origins.tsv`·`gone_known.tsv`, dev `docs/library-left-out.md`, `crawl-runbook.md` 1·8절은 dev `2-crawl.md`로), 2026-10-14(사이클 14 회고: 사서추천 맞추기 규칙 `pickTitleKey`·`firstNameExact`, 4절·6절). 사이클과 상관없이 계속 쓰는 문서들을 주제별로 모았습니다. 사이클 문서(`docs/cycles/NN-*/`)는 그 사이클의 기록이고, 여기 적힌 것은 "지금 어떻게 하는가"를 아는 데 필요한 문서입니다. 문서를 새로 만들거나 원본이 바뀌면 이 색인을 고칩니다.

원칙 [확정] (사용자, 2026-10-01, dev C2-U-7 답): **절차의 원본은 dev `docs/library-maintenance.md`**, **조사 기록과 근거 수치는 plan**. 둘이 어긋나면 dev 절차가 최신입니다. 정기 유지보수 절차(도서관 목록 확인, 책 목록 수집, 가져오기)와 수집기 코드는 dev `docs/maintenance/`·`scripts/crawl/`로 모읍니다 (ADR-0047, 2026-10-04). **문서(A)는 2026-10-04 dev가 옮김**: 절차는 dev `docs/maintenance/` (`README.md` 순서, `1-libraries.md`, `2-crawl.md`, `platforms.md`, `3-import.md`). 수집기 코드(B)와 도서관 정보 도구(C)는 전체 수집이 끝난 뒤. 요청서 `docs/research/maintenance/dev-move-request.md`

## 0. 늘 먼저 보는 것

| 문서 | 무엇 |
|---|---|
| `CLAUDE.md` (plan) | 사이클 진행 방식, 현재 사이클 |
| `docs/backlog.md` | 아직 사이클에 안 들어간 것, 다음 순서(맨 위 "2026-10-01 정리"), 미룬 것 |
| `docs/research/scaling/in-memory-state.md` | 서버를 여러 대로 늘릴 때(Redis·DB 잠금) 고칠 곳 모음: 호출 간격, 캐시, 로그인 도중 값, 새벽 작업, 사용 기록 (2026-10-13) |
| `docs/current/` (`module-map.md`, `data-model.md`, `api.md`, `flows.md`, `handoff.md`) | 지금 설계 전체. `handoff.md`는 현재 인계서(2026-10-14 기준 사이클 15) |
| `docs/adr/README.md` | 결정 목록 (2026-10-14 기준 ADR-0112까지) |
| dev `docs/plan-feedback.md` | dev가 개발 중 바꾼 것·측정·질문. 사이클별 절(`# 사이클 04`는 702행~). **다음 회고의 입력** |
| dev `CLAUDE.md` | 스택·모듈 규칙 (plan에서 다시 적지 않음) |
| `docs/research/maintenance/collection-areas.md` | 수집 일 나눔(① 도서관 정보 ② 도서관-책 ③ 가져오기)과 섞인 도구 옮기기 [확정] (2026-10-04) |
| `docs/research/collection/1-libraries.md` | **수집 두 갈래 정리 (2026-10-05)** ① 도서관 수집: 수집 목록에서 새 도서관 찾기·확인·같은 사이트 거르기·넣기(seed — 사이클 13부터는 `collection` 넣기 명령, ADR-0084), 가입 조건, 구독형 규칙·마감 확인, 로고. 받는 것/내놓는 것/원칙/결정, 절차 원본은 dev `docs/maintenance/1-libraries.md` |
| `docs/research/collection/2-books.md` | **수집 두 갈래 정리 (2026-10-05)** ② 도서관의 책 수집: 전체·신간 수집, 이어 받기, 호출 예의(IP 줄, 병렬 정도, `--host-slots`). 받는 것/내놓는 것/원칙/결정, 절차 원본은 dev `docs/maintenance/2-crawl.md`·`platforms.md`. 다음 단계 가져오기는 `collection` 모듈(ADR-0060) |
| `docs/research/maintenance/periodic-tasks.md` | **정기 유지보수 작업 초안 (원본은 dev `docs/maintenance/README.md`)** (2026-10-04): ① 서비스 도서관 목록 확인 → ② 책 목록 수집 → ③ 서비스 DB로 가져오기 → ④ (자동) 검색·대출 조회. 단계마다 주기 [안], 절차 원본 위치, 실행 명령, 확인할 숫자. 웹러브 북스 기관을 서비스로 옮기는 순서(5절) |
| `docs/cycles/NN-<slug>/easy/README.md` (지금은 `docs/cycles/05-login-account/easy/`) | 쉬운 설명 페이지(HTML) 모음과 목록. 사이클별로 둠. 사용자가 상황을 빠르게 파악할 때 봄. 요약이므로 값의 원본은 각 문서 |

수집 일은 셋으로 나눕니다 [확정] (사용자, 2026-10-04, `docs/research/maintenance/collection-areas.md`): **① 도서관 정보**(아래 1·2절, 구독 규칙·마감 포함) / **② 도서관-책**(3절) / **③ 가져오기**(3-1절, 정리·묶기 4절). 도서관 목록은 처음에 둘로 나눴음 [확정] (사용자, 2026-10-04): 사이클 06까지 있던 도서관(서비스 DB, 278곳, 검색에 나옴)과 수집 목록에서 찾았지만 서비스에 아직 없던 도서관(수집 DB 번호 100001~, 2,738곳). 그때 붙인 두 이름은 쓰지 않고 어떤 도서관인지 구체적으로 씀 [확정] (사용자 제안, 2026-10-14, 회고 결정 #13). 지금은 둘 다 서비스 DB에 있음: 사이클 06까지 있던 도서관(번호 1~280)과 사이클 07에서 넣은 2,394곳(서비스 번호 281~2674). 그 뒤 새로 찾은 곳은 사이클 13부터 `collection` 넣기 명령으로 넣음 — 구현됨 (사이클 13, 회고 2026-10-14) (ADR-0084).

## 1. ① 도서관 정보: 목록 수집 (어디서 목록을 얻고, 살아 있는지 확인하고, 넣고 끄는가)

| 문서 | 무엇 | 상태 |
|---|---|---|
| dev `docs/library-maintenance.md` 4-0~4-7, 11절, 3절(도구) | **절차 원본**. 교보 공식 목록 216곳(HTML 선택자), 공공데이터포털 전국도서관표준데이터, 통합 포털 목록, 웹러브 북스, 주소 모양으로 화면 종류 나누기, `CheckKyoboSites.java`/`CheckYes24Sites.java`로 최종 주소 확정 | 최신 (2026-09-30) |
| dev `docs/library-maintenance.md` 4-9, 6-2 | 운영 로그 신호(3xx·파싱 실패·timeout)별 할 일, 꺼 둔 도서관(id 59, 131 → 2027-01 재개 확인) | 재조사 주기 미정 [확인 필요] |
| dev `docs/library-site-issues.md` | 빠진 사이트 이유별 표(1·2절), 중간 인증서 만료(3절: 2027-05-21, 2027-11-02), 판단 못 한 곳(4절), 다시 볼 때 순서(7절) | 최신 |
| plan `docs/cycles/02-library-expansion/collection-method.md` | 2026-09-28 조사 방법 기록. 머리말에 "절차 원본은 dev" 안내(2026-10-01) | 기록용 |
| plan `docs/cycles/02-library-expansion/research.md` | 조사 결과·근거(1·8·10절), 새 주소 못 찾은 약 20곳(12절), robots.txt 방침(9절) | 기록용 |
| plan `docs/cycles/02-library-expansion/data/kyobo-institutions.tsv` | 교보 기관 목록 원자료 | 재조사 때 비교 |
| plan `docs/research/library-join/name-changes-2026-10-10.md` | 도서관·기관 이름이 바뀌는 경우(대학 통합·교명 변경, 정부·공공기관 개편, 회사 사명, 학교, 공공도서관)와 실제 예(1절), 서비스 도서관 중 개명 기관과 흡수된 학교 사이트(2절), 이름 이력을 남기는 방법(4절). 사이클 08 이름 고침 목록(dev `scripts/library/name_overrides.tsv` [안 경로])의 첫 근거 | 2026-10-10 |
| plan `docs/current/data-model.md` `library` 절 "이름 고침", seed 절 | 이름 고침 규칙: "처음 정한 이름은 바꾸지 않음"의 예외(공식 개명·틀린 이름, 목록에 있을 때만, 번호 유지), 이미 적용된 seed는 고치지 않고 새 changeset에서 UPDATE | 구현됨 (사이클 08) |
| plan `docs/current/data-model.md` `library` 절 "도서관 이름과 분류", `docs/adr/0071-library-name-and-classification.md`, `docs/adr/0076-library-classification-api-and-rename.md` | **도서관 이름 규칙 (사이클 09)**: 이름에는 기관 정식 이름만(끝의 업체·대출 방식 괄호 없음), 모든 도서관에 업체(`vendor`, 도서관 수집이 정함)·대출 방식(`lending_model`, 통합 포털만 비움), 겹침은 (이름, 업체, 대출 방식, 순번) UNIQUE, 겹치면 seed 생성 스크립트가 순번을 붙이고 목록으로 보임. 대출 방식 채우는 규칙, 이름은 번호로 고치는 changeset | 구현됨 (사이클 09, dev `library/014-library-classification.yaml`) |
| plan `docs/adr/0067-exclude-kyobo-rental-mixed.md` | 교보 대여·혼합 도서관은 받지도 넣지도 않음(230곳, 이미 넣은 11곳 2664~2674는 seed에서 빼 지움), seed 규칙 "교보 대여·혼합은 넣지 않음" | 확정 (2026-10-11) |
| plan `docs/adr/0068-updated-at-by-db-trigger.md` | 도서관·지역 표를 고칠 때 `updated_at`은 DB 트리거가 적음(모듈마다 함수). 직접 SQL로 고쳐도 적힘 | 확정 (2026-10-11), 구현됨 (사이클 08, dev `library/011-updated-at-trigger.sql`) |
| plan `docs/cycles/13-crawler-to-dev/` (`design-delta.md`, `spec.md`, `flow.md`), `docs/current/module-map.md` `collection` 줄·"도서관 넣기 명령과 수집기", `flows.md` 흐름 32·33, `docs/adr/0083`~`0086`, `0087`, `0093` | **새 도서관 넣기 (사이클 13)**: seed 대신 `collection` 명령(프로필 `library-insert`, 미리 보기 → 보고서 파일 → 넣기, 종료 코드, 넣기 실행 기록 `library_insert_run`), `library`의 `LibraryRegistry`(`add`·`nextId`·`listAll`), 운영 반영 판 2(`notes.libraryPart`, 도서관 → 비교 → 책), 가입 조건 조사 기준일 하나 + `/about` 공지(`GET /api/v1/join-surveys/latest`). 앞으로 도서관 seed changeset을 만들지 않음(ADR-0084) | 구현됨 (사이클 13, 회고 2026-10-14). 절차 원본 dev `docs/maintenance/1-libraries.md`(종료 코드 0~5) |
| plan `docs/cycles/13-crawler-to-dev/research.md` | **도서관 넣기 명령 사전 조사 (2026-10-12)**: 지금 넣기 스크립트(`build_candidate_seed.py`)가 읽는 것·코드에 박힌 사람 결정·순서·옮길 때 조심할 것(1절), 재시작 없이 넣으려면 backend 모듈(2절), Liquibase seed와 섞일 때(3절), 사이클 11과 만나는 곳(4절), 수집 세션이 미리 한 것(6절) | 2026-10-12 (조사 기록) |
| dev `scripts/library/rules/` (TSV 규칙 + `join_surveyed_on.txt` + 순번 2 허용 목록, 꼴은 `README.md`), `docs/adr/0085-library-rules-tsv-in-dev.md` | **사람이 정한 도서관 규칙의 원본 (사이클 13부터)**: 이름 고침(`name_overrides.tsv`), 최종 주소(`final_origins.tsv`, 새 곳 필수), 같은 사이트, 체험용·운영 중단, 같은 호스트지만 남김, 가입 범위 덮어쓰기, 확인한 사라진 곳(`gone_known.tsv`, 2026-10-14 기준 비어 있음: 44·261·269는 사이클 18 `library/016`으로 꺼짐). 지역은 번호로 미리 풀어 둠(도우미 스크립트). 넣기 명령이 읽음 | 구현됨 (사이클 13, 회고 2026-10-14) |
| plan `docs/cycles/18-empty-library-holdings/` (`research.md`, `design-delta.md`, `handoff.md`), `docs/adr/0109`·`0110`·`0111` | **켜졌는데 책이 0권인 도서관 (사이클 18)**: 원인(오디오북만 있는 사이트 14곳, 빈 사이트, 교보 구독형 수집 때 0권, 밑줄 호스트), 이미 켜진 도서관은 Liquibase 변경 파일로 끄고 다시 켬(ADR-0109), 새 도서관 넣기에서 전자책 0권은 뺌(ADR-0110), 밑줄 호스트는 따로 읽고 따로 요청(ADR-0111, 조회 서버 앱도 ADR-0112), 0권 도서관 세는 SQL은 인계서 | 인계됨 2026-10-14. A1(22곳 끄기, dev `library/016-library-disabled-cycle18.yaml`)·A2는 dev main에 들어감(dev 커밋 5f8403c), B·C는 아직 |
| dev `docs/library-left-out.md` (만드는 스크립트 `scripts/library/list_left_out.py`) | **서비스에 넣지 않은 도서관과 문제 있는 도서관 목록**: A 수집 DB에 있지만 넣지 않은 349곳(이유별: 교보 대여·혼합 232, 받지 않음 105, 전체 수집 안 끝남 2, 체험용·운영 중단 4, 시험용 6), B 서비스에 있지만 문제 있는 곳(2026-10-14 기준 27곳, 모두 꺼 둔 곳: 서비스 2,669곳 중 켜진 곳 2,642, dev `library-left-out.md` 417~421행). 손으로 고치지 않고 스크립트로 다시 만듦. 서비스에 이미 있는 곳은 기본으로 그대로 둠(사용자 결정 2026-10-12) | 2026-10-12 (보고서 `1af0721e4a3e`) |

## 2. ① 도서관 정보: 분류·한도 (화면 종류, 가입 자격, 지역, 조회 순서, 구독 규칙·마감)

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
| plan `docs/research/library-limits/research.md` (+ `easy/`) | 구독형 도서관의 한도(월 예산·연 예산·1인 월 권수), 도서관별 현황(2026-10-04: 강동구립·서구 통합 마감), 알리는 방법 결정, YES24 크레마클럽·북큐브·부커스 구독형 | 2026-10-04 |
| plan `docs/research/maintenance/library-logos.md`, `chaekcheck-data/logos/` (`logos.tsv`) | 도서관 로고 수집: 위치(교보 `headerLogo.json`, 그 밖 머리말 그림), 도서관 번호 매핑, 업체 기본 로고, 이용 조건 조사와 결정(공공도서관만, 안내는 서비스 안내 페이지) | 2026-10-05 |
| plan `docs/research/library-join/candidates.md`, `chaekcheck-data/library-join/` | 수집 목록에서 찾았지만 서비스에 아직 없던 도서관 2,639곳 종류 나누기(이름 기준)와 공공도서관 120곳 가입 조건 조사·결정(사이클 밖). 결과 `public-join-2026-10-05.tsv` | 2026-10-05 |
| plan `docs/research/maintenance/library-naming.md`, `library-naming-handoff.md` | 도서관 이름 규칙: 괄호 대신 업체·대출 방식 분류 칸, (이름, 업체, 대출 방식) UNIQUE, 겹침 시험 결과, 다음 사이클 인계·ADR 초안. 사이클 09에서 순번을 더해 확정한 규칙은 `docs/current/data-model.md` "도서관 이름과 분류"·ADR-0071 | 2026-10-11 (조사 기록) |
| dev `scripts/library/probe_kyobo_limits.py`, 결과 `chaekcheck-data/other-platforms/kyobo-limits-2026-10-04.tsv` | 교보 구독형 사이트 팝업·공지 제목 확인(로그인 없이). 살피는 곳이 모두 `*.dkyobobook.co.kr`이라 사이클 13부터 시작하자마자 이유를 보이고 끝남(spec R1-6). 다시 쓰려면 사용자 결정 필요(backlog "교보 구독형 서버를 다른 우리 IP에서 다시 받기", ADR-0094) | 사이클 13 (2026-10-12) |

## 3. ② 도서관-책 수집 (전자책 목록을 도서관 사이트에서 모으기)

| 문서 | 무엇 | 상태 |
|---|---|---|
| plan `docs/research/ebook-catalog/crawl-method.md` | 원칙(호스트 1건·1초, 2026-10-04부터 호스트 = IP, UA), 종류(전체/신간), 절차, 날짜 3층, 저장 항목 [확정], 실행 도구(8절) | 수집 세션이 관리 |
| dev `docs/maintenance/2-crawl.md`, `platforms.md` | **절차 원본 (2026-10-04 dev로 옮김)**: 실행, 이어 받기, 명령, 병렬·IP 줄, 받지 않는 도서관, 문제별 대처, 새 사이트 붙이기, 플랫폼별 방법 | 최신 |
| plan `docs/research/ebook-catalog/crawl-runbook.md` | **진행 상태와 결정 기록**(1·2·3·8절), dev에 반영할 것(4절). 예전 내용: 읽는 순서(0절), 지금 상태(1절), 이어 받기·상태 보기(3절), 수집기 규칙 요약(4절), 명령 모음(5절), 받지 않는 도서관(5-1절 `crawl_skip`), 문제별 대처(6절), 새 사이트·플랫폼 붙이는 순서(7절), 상세 URL·오디오북 표시(9·10절) | 수집 세션이 관리, 2026-10-04 (IP 기준 줄 세우기, 북큐브 제목 없는 줄 처리). 사이클 13에서 1·8절(진행 상태·진행 표)은 dev `docs/maintenance/2-crawl.md`로 옮김(2·3절은 이미 dev 2·2-1절), 여기에는 결정 기록만 |
| plan `docs/research/ebook-catalog/collection-by-vendor-2026-10-09.md` | 업체별 수집 현황 한 장: 대출 방식(소장·구독·대여), 대상 도서관 종류(공공·학교·대학·회사 등), 목록 주소, 서버 IP·포트, 받기 완료·미완료. **4절 결정(2026-10-10): 교보 구독형 플랫폼 대여·혼합 230곳은 수집도 서비스도 하지 않음** → ADR-0067 | 2026-10-09, 4절 2026-10-10 |
| plan `docs/research/ebook-catalog/easy/` | 쉬운 설명: `2026-10-04-platform-servers.html`(플랫폼 타입별 서버 구조), `2026-10-04-crawl-method-now.html`(지금 수집 방법: 사이트 분류, 도메인과 IP) | 2026-10-04 |
| plan `docs/research/ebook-catalog/platforms.md` | **플랫폼별 크롤링 방법**: 검색·전체 목록 URL, 한 쪽 크기, 줄 선택자, 상세 URL, 오디오북 구분, 사이트별 예외(교보·교보 구독형·YES24·통합 포털·강남구·북큐브·알라딘) | 수집 세션이 관리, 2026-10-01 |
| plan `docs/research/ebook-catalog/research.md` | 수집 조사(범위, 법적 검토 3절, 항목 4·5절) | 기록 |
| `chaekcheck-data/README.md`, `scripts/crawl_catalog.py`, `ebook-catalog.sqlite` | 수집기 코드와 수집 DB(두 저장소 밖). 사이클 13부터 수집기 원본은 dev `scripts/crawl/`이고, 데이터 폴더의 옛 `scripts\`·`resume.cmd`는 `_old-scripts-2026-10-12`로 옮겨 보관(지우지 않음) (ADR-0088). 수집 DB는 그대로 데이터 폴더 | [확인 필요: 이 색인에서 내용 확인 안 함] |
| dev `scripts/crawl/` (`crawl_catalog.py`), plan `docs/research/maintenance/crawler-move.md`, `docs/adr/0088-crawler-switch-to-dev.md` | **수집기 원본 (사이클 13부터)**: 데이터 폴더 수집기를 dev로 갈아타기(옮기기 결정 1~7 [확정], `vendor` 칸·`migrate`, 빈 곳 채우기 명령 `refill-pubdt --only ID[,ID]`, 첫 시험 여주대 102084는 뺌(AC-1, 사용자: "여주대는 빼자"), `*.dkyobobook.co.kr` 요청 전 막음, 막히면 그 도서관만 `crawl_skip`), 옛 코드 보관(`_old-scripts-2026-10-12`, 16개 + `resume.cmd`), 도서관 넣기 담당. ADR-0047을 이어서 옮기기를 끝냄 | 구현됨 (사이클 13, 회고 2026-10-14) |
| plan `docs/research/deploy/aws-crawl.md` (+ `easy/2026-10-12-aws-crawl.html`) | **AWS 서울에서 책 수집 (사이클 13 조사)**: CloudShell 서울 시험(1절), AWS 서울 수집 서버 두 안·사본을 내 PC로·Windows → Linux(2절), C안 Claude 클라우드 + AWS 서울 프록시와 시험할 것(4절, 클라우드 세션 오래 돌기 50분 시험 포함), 플랜 B 국내 저가 서버에 우리 프록시(5절). 원칙: 나가는 IP는 우리 국내 서버 고정 IP만(`crawl-method.md` 1절). 프록시 수집·대출 조회와 클라우드에서 오래 돌리기는 다음 사이클로 미룸(backlog "국내 IP 프록시로 수집·대출 조회"), 지금은 PC에서 수집 | 2026-10-12 (조사, 다음 사이클 후보) |
| dev `collection/internal/importer/CollectedCatalog.java` (사이클 07에 `catalog/internal/importer/`에서 옮김) | 가져올 때 제외 규칙(오디오북·동영상북, 소리·영상 파일 `kind_sound_video`, 서비스에 없는 도서관, 빠진 책, http 아닌 주소, 사이트 불일치(호스트·경로·쿼리 비교, `sameSite`), 제목 없음)과 상세 주소를 서비스 주소의 scheme·포트로 옮겨 쓰기(`onOrigin`) | 구현 (사이클 07) |

## 3-1. ③ 가져오기와 서비스 검색 (받은 책 목록을 서비스 DB로, 서비스 검색·대출 조회)

| 문서 | 무엇 | 상태 |
|---|---|---|
| dev `docs/maintenance/3-import.md` | **가져오기 절차 원본 (사이클 07부터)**: 프로필 `collection-import`, 설정 `chaekcheck.collection.import.*`, 사본을 원본으로, 두 번 읽기, 건너뜀 이유, 결과 표(14·15단계 값) | 최신 (2026-10-05) |
| dev `docs/plan-feedback.md` `# 사이클 07` 14~17단계, "handoff 밖 추가 작업 B" | 사이클 07 실제 가져오기(책 1,617,445, 소장 20,383,882, 36분 43초), 책 번호 잇기 결과(kept/new/dropped), 힙·DB 크기 | 2026-10-05 |
| dev `docs/plan-feedback.md` `# 사이클 04` "가져오기 실행 방법"(806행 부근), "실제 가져오기 결과"(789행 부근) | 사이클 04 가져오기(프로필 `catalog-import`, 지금 코드에는 없음). 첫 실제 적재 2026-10-03 18:05 (책 680,689, 소장 4,954,360) | 기록용 |
| plan `docs/current/flows.md` 흐름 16 (흐름 8은 사이클 04 모양) | 가져오기 흐름 그림 (짝 표, 두 번 읽기, 묶기 ①~④, `CatalogLoad.replaceAll`, 책 번호 잇기) | 구현됨 (사이클 07) |
| plan `docs/cycles/07-candidate-libraries/easy/2026-10-05-collection-to-import.html` | 쉬운 설명: 도서관 수집부터 가져오기까지 | 2026-10-05 |
| plan `docs/current/flows.md` 흐름 6·7 | 서비스에서 책 검색(`GET /books`)과 도서관 상세 페이지 실시간 대출 조회(`/book-availabilities/stream`) | 구현됨 (dev 사이클 04) |
| plan `docs/cycles/04-and-search/` `spec.md`, `design-delta.md` | 검색 순서, API 세부 | 기록 |
| plan `docs/research/maintenance/periodic-tasks.md` 3·4절 | 가져오기 순서 [안]과 확인할 숫자, 다시 가져올 때 책 번호가 바뀌는 문제 | [안] 2026-10-04 |
| plan `docs/cycles/08-polish-swap-memory/research.md` 10절 | 가져오기·교체 시간을 줄이는 방향 조사: 지금 걸리는 시간(10-1), 코드에서 본 순서(10-2), 잠금에 대한 공식 사실(10-3), 방향별 장단점·비교(10-4~10-6), 확인 필요(10-7). 메모리 줄이기 조사는 같은 문서 1~9절 | 2026-10-06 |
| plan `docs/adr/0065-import-write-new-tables-then-swap.md`, `0070-holding-id-carry-over-and-gone-notice.md` | 가져오기는 새 표(`catalog_next`)에 쓰고 바꿔 끼움(색인 나중에, 짧은 잠금), 같은 소장은 옛 소장 번호를 잇고 빠진 책·소장은 따로 알림(`book_not_found` 문구, `holding_not_found`) | 확정 (2026-10-11), 구현됨 (사이클 08, dev `JdbcCatalogLoad` `catalog_next`, `docs/current/data-model.md` 20행) |
| plan `docs/current/data-model.md` `catalog` 절 "가져오기: 새 표에 쓰고 바꿔 끼우기", `flows.md` 흐름 20 | 바꿔 끼우기 순서, `lock_timeout`·다시 시도, 실패 때 처리, 단계별 시간 `step_seconds`, 바꿔 끼우는 표 목록 | 구현됨 (사이클 08) |
| plan `docs/adr/0066-memory-reduction-structure.md`, `flows.md` 흐름 21 | 메모리 줄이기: 계획에 들어갈 도서관만·그 도서관 소장만 읽기, 캐시 통계·상한, DB 메모리 값은 `compose.yaml`, 재는 도구(`jcmd`, PostgreSQL 통계) | 확정 (2026-10-11), 구현됨 (사이클 08, `docs/current/data-model.md` 20행) |
| plan `docs/cycles/11-separate-import/` (`design-delta.md`, `spec.md`, `research.md`) | **가져오기 따로 하기 (사이클 11)**: 내 PC에서 가져와 `catalog_next`를 `pg_dump -Fc` 파일 하나로 내보내고(`export`), 운영 DB에서 두 DB 비교 뒤 복원·색인·바꿔 끼우기(`apply`), 내 PC 마저 바꿔 끼우기·지우기(`finish`·`discard`), 묶는 방식 `compact`(기본)·`objects`(옛 이름 `current`)·`sql`과 결과 비교·측정. 측정 결과와 기본값 결정은 `retro.md` "최종 회고". `research.md`: `pg_dump`·`pg_restore`(9·11절)와 메모리·Java 옵션(10절) 공식 문서 사실 | 구현됨 (사이클 11, 회고 2026-10-14) |
| plan `docs/adr/0078-separate-import-export-apply.md`, `0079-grouping-modes-same-result.md` | 가져오기는 내 PC에서 하고 운영 DB에는 파일 하나로 옮겨 바꿔 끼움(모드 다섯, 기다리는 새 표 보호, `mismatch`), 책 묶기 세 방식을 설정으로 고르고 결과가 번호까지 같아야 씀. 셋 모두 남김·기본 `compact`·이름 `objects`는 ADR-0105 | 확정 (2026-10-12), 구현됨 (사이클 11, 회고 2026-10-14) |
| plan `docs/current/data-model.md` `catalog` 절 "따로 하기", `flows.md` 흐름 27~29·"내 PC의 `catalog_next` 상태" | 모드별 할 일 표, 비교 항목, `load_manifest` 칸, `catalog_import.export_id`·`exported_at`, 색인 메모리(운영 반영 256MB, 내 PC 1GB), 운영 역할 DB `db-ops`(포트 5434, `mem_limit` 1GB) | 구현됨 (사이클 11, 회고 2026-10-14) |
| plan `docs/research/deploy/easy/2026-10-12-memory-kinds.html`, `docs/research/deploy/aws-layout.md` 6절 | 서버 메모리 종류 쉬운 설명(힙, `shared_buffers`, `maintenance_work_mem`, 컨테이너 상한), 가져오기를 따로 할 때 EC2 크기 | 2026-10-12 |
| dev `docs/maintenance/3-import.md` 13절(따로 하기), 3절 38~41행(묶는 방식·`regroup`·빼기 설정), 5절 표, 154행(묶기 규칙을 바꿀 때) | 가져오기 절차 원본: 내보내기·반영·마저·지우기 절차, `step_seconds` 새 키, 묶는 방식별 힙(`objects`는 8GB 권장), `compare_grouping.py regroup` | 구현됨 (사이클 11·12, 회고 2026-10-14) |

## 4. 책 분류·정리·묶기 (정리 규칙, ISBN, 같은 책, 저자, 자료 종류)

| 문서 | 무엇 | 상태 |
|---|---|---|
| plan `docs/research/ebook-catalog/search-and-normalization.md` 4절 | 정리 규칙: 저자 나누기·역할(4.1, 사이클 04 규칙 반영), 제목·본제목(4.2), 출판사(4.3), 출판일·대표값(4.4), **자료 종류(4.6, 2026-10-01 추가)** | 2026-10-01 갱신 |
| plan `docs/research/ebook-catalog/search-and-normalization.md` 3절 | 검색 저장소 비교, pg_bigm 측정, `shared_preload_libraries` 필요 [확정] | 갱신 |
| plan `docs/research/ebook-catalog/same-book-isbn.md` 5절 | **묶기 ①②③④ 구현 기준**(번호 체계, 국가서지 모호 규칙, ④ 정리한 전체 제목+저자+출판사), 5.1 dry run 수치, 5.2 대표값, 5.3 재작업 시 확인할 것 | 2026-10-01 갱신 |
| plan `docs/research/ebook-catalog/same-book-isbn.md` 5.4~5.7절, `docs/cycles/12-grouping-rules/`(spec R1~R8, design-delta, **retro.md**), ADR-0082, ADR-0106 | **사이클 12 묶기 규칙 변경**: 표본 조사(판이 다른 책 3,079권, 부제 차이 44,461묶음, 자리 채움 값), 방향 결정, ④ 새 키(본제목 + 권 표시, ISBN으로 나누기, 자리 채움 값 없음), 회고에서 더한 것(작가 이름 제목, 같은 도서관 기준 부제 나누기, 권·판처럼 보이는 숫자·로마·한자 숫자, 꼬리 넷). 지금 규칙은 5.7절 | 2026-10-14, 구현됨 (사이클 12, 회고 2026-10-14) |
| plan `docs/research/ebook-catalog/same-book-isbn.md` 3·4절 | 교보식 코드 → 종이책 ISBN 규칙, 국가서지 파일, ISBN 서지정보 API 시험·사용법·국립중앙도서관 API 종류(4.4~4.6). API는 지금 쓰지 않기로 함(1절, 2026-10-03) | 확정/확인 필요 혼재 |
| dev `docs/library-maintenance.md` 4-11, `scripts/library/check_code_spaces.py` | **책 번호 체계 점검** 절차와 기준값 표. 도서관 목록 확인 때마다 [확정] | 최신 |
| dev `catalog/normalize/{CatalogText,Contributors,Isbn,PublishedDates}.java`(named interface `normalize`), `collection/internal/importer/{BookGrouping,NationalBibliography,CatalogImporter}.java` (사이클 07에 옮김) | 규칙의 실제 코드. 문서와 코드가 다르면 코드가 실제 동작 | 구현 (사이클 07 위치) |
| dev `catalog/normalize/CatalogText.java` `pickTitleKey`, `Contributors.java` `firstNameExact`, `catalog/internal/JdbcBookLookup.java` `byTitleAndAuthor`; plan `docs/research/popular-books/alternatives.md` 3-1절, `kpipa.md` 4절, ADR-0090, `docs/cycles/14-librarian-picks/retro.md` | **사서추천 책 ↔ 우리 책 맞추기**(① ISBN ② 본제목 키 + 첫 저자): 제목 키(앞 괄호 여러 개 뗌, 처음 `:`·`(`·`[`·`=` 앞, 기호 뺌), 첫 저자(`;` 뒤·앞 "지은이:"·뒤 "소설" 등 뗌, `ROLE_WORDS`는 그대로), 후보는 첫 저자 `name_exact`로 좁힘 | 구현 (사이클 14, 2026-10-14) |
| plan `docs/adr/0031-catalog-importer-in-backend.md`, `0032-postgres-pg-bigm-contributors.md`, `0034-store-ebook-catalog.md`, `0035-grouping-step4-and-code-spaces.md` | 정리 코드 한 벌, pg_bigm·사람별 표, 목록 저장, 묶기 ④·번호 체계 결정 | 확정 |
| plan `docs/research/ebook-catalog/catalog-refresh.md` | 주기 갱신(별도 사이클) 참고: 순서(2절), 알려진 문제(4절), 표 swap 방향(5.1, 사이클 08에 설계 → ADR-0065), 책 번호 잇기 규칙(5.2, 사이클 07에 dev `CatalogLoad.replaceAll` 안에서 구현) | 계속 갱신 |
| plan `docs/current/data-model.md` `catalog` 절 "정리 규칙을 바꿀 때" (원본 `docs/cycles/08-polish-swap-memory/design-delta.md` 같은 이름 절), `docs/adr/0069-national-bibliography-raw-and-rule-change.md` | **정리 규칙을 바꿀 때 할 일**: 새 사본·묶기·대표값·날짜 규칙 → 가져오기 → 바꿔 끼우기(서비스 그대로), 검색어 다듬기 규칙 → 옛 서비스 켜 둔 채 새 코드로 가져오기 → 바꿔 끼우자마자 서비스 다시 켬. 국가서지는 TTL 원문을 `collection`에 남겨 매번 지금 규칙으로 다듬음(판 번호 없음). dev `docs/maintenance/3-import.md`에도 적음 | 확정 (2026-10-11), 구현됨 (사이클 08, `docs/current/data-model.md` 20행) |

## 5. 회원·알림 (다음 사이클)

| 문서 | 무엇 |
|---|---|
| plan `docs/research/member-and-alerts/outline.md` | 회원 → 알림 밑그림 [안], 내 도서관 정의, 필터 제안, 사이클에서 정할 것 |
| plan `docs/research/member-and-alerts/signup-security.md` | 소셜 로그인·세션·개인정보법 공식 문서 확인 결과(2026-10-01), 지켜야 할 것 15개 |
| plan `docs/research/member-and-alerts/integration-plan.md` | 회원·알림을 프로젝트에 넣는 구조: 모듈(`auth`+`member`), 검색 연결(웹이 `libraryIds`), 세션, 표, API, 사이클 자르기 05·06·07 (사용자 결정 2026-10-01) |
| plan `docs/cycles/05-login-account/scope.md`, `spec.md` | 현재 사이클(로그인·계정) 범위·완료 기준, 동작 규칙·수용 기준. `spec.md` "데이터 출처"에 카카오 연결 끊기·웹훅, 네이버 재인증·검수, Spring Session·Modulith 확인 결과 |
| plan `docs/cycles/05-login-account/research.md` | 사이클 05 조사(2026-10-01): PKCE, 네이버 제공 항목, 네이버 연결끊기 Callback 원문(암호·서명), 로그인 버튼 지침, 처리방침 작성지침·보호책임자 |
- 사이클 05 로그인·계정 설계와 근거(2026-10-04): `docs/cycles/05-login-account/design-delta.md`, `research.md`(공식 문서 확인 1~13절), ADR-0038~0046. 쉬운 설명 모음 `docs/cycles/05-login-account/easy/README.md`
- 사이클 06 내 도서관 설계와 근거(2026-10-04): `docs/cycles/06-my-libraries/scope.md`, `spec.md`, `flow.md`, `design-delta.md`, ADR-0048~0051(0048이 0036 대체: `member` → `mylibrary`). 쉬운 설명 모음 `docs/cycles/06-my-libraries/easy/README.md`
- 성별·연령대를 선택 항목으로 받을 때의 법적 근거(2026-10-04): `docs/research/member-and-alerts/optional-profile-data-law.md`. backlog "추천·통계"에서 가리킴

## 6. 재작업 시 확인할 것 (한 곳에 모음)

세부 수치와 출처는 각 문서에 있습니다. 여기서는 "무엇을, 어디를 보고" 만 적습니다.

### 도서관 목록·분류 (도서관 재조사 때)

- 새 주소 못 찾은 약 20곳: plan `research.md` 12절, dev `library-site-issues.md` 1·2·7절
- 로그인해야 전자책 주소가 보이는 8곳(포항·고령·레인보우영동·광주동구·서귀포·정읍·함평·창원): dev `library-site-issues.md` 7절 — 사람이 로그인
- 판단 못 한 2곳(김해시청, 충북도청): dev `library-site-issues.md` 4절
- 꺼 둔 2곳(id 59, 131) 2027-01 재개 확인: dev `library-maintenance.md` 6-2. 사이클 07에 더 끈 3곳(135 전라북도교육청통합도서관, 2194 장안대학교 (YES24), 2198 성균관대학교 (YES24)): dev `library/010-library-disabled.yaml`, `library-site-issues.md` 9절. 사이클 18에 22곳을 더 끔(ADR-0109, dev `library/016-library-disabled-cycle18.yaml`, 2026-10-14) — 꺼 둔 곳은 모두 27곳(dev `library-left-out.md` B-1)
- 기관 이름이 바뀐 곳(대학 통합·교명 변경 등)과 흡수된 학교 사이트 6~7곳(428, 429, 769, 2257, 607, 895, 1002): `docs/research/library-join/name-changes-2026-10-10.md` 2절, 이름 고침 목록 dev `scripts/library/name_overrides.tsv` [안 경로]. 사이클 09에서 607 말고 6곳을 고침(설계됨(미구현, 사이클 09), `docs/cycles/09-library-naming/spec.md` R1-10)
- 도서관 업체·대출 방식·순번(사이클 09): 새 도서관을 넣을 때 seed 생성 스크립트가 화면 종류 대응표·교보 probe·북큐브 전체 권수로 채우고 순번 2 이상 목록을 보임. 사이클 13부터는 seed를 만들지 않고 `collection` 넣기 명령이 같은 규칙으로 채움(구현됨 (사이클 13, 회고 2026-10-14), ADR-0084). 규칙은 `docs/current/data-model.md` "도서관 이름과 분류"·seed 절, 절차 원본은 dev `library-maintenance.md`(1-1절 `name`, 4-5절, 이름 고침 절을 사이클 09에서 고침)
- 리다이렉트로 호스트까지 바뀐 도서관(411)과 사이트 제목이 다른 기관인 곳 약 10곳, YES24 모바일판 13곳: dev `library-site-issues.md` 10절, plan `docs/cycles/07-candidate-libraries/retro.md` "새로 알게 된 제약"
- 도서관 사이트 연결에만 믿는 최상위 기관(OISTE WISeKey Global Root GB CA)과 중간 인증서: dev `tls/library-roots/` (ADR-0061, ADR-0022 보완)
- 중간 인증서 만료 2027-05-21(GlobalSign AlphaSSL), 2027-11-02(Thawte): dev `library-site-issues.md` 3절
- 교보 공식 목록 재확인(요청 약 400건·20분)과 `kyobo-institutions.tsv` 비교: dev 4-1, 4-9
- 사용자 확인 대기 13건(경산·김천·대구·음성·경북·성동·고창·책이음 4곳·진천·양천·전남 12곳·세종북자람 등): dev `library-maintenance.md` 14절
- 자격 확인 필요 45곳, `join_method` 기본 문구 44곳, `join_url` 없음 39곳: dev `plan-feedback.md` 추후 과제 C
- 방문 가입 규칙 4번으로 true가 된 18곳 원문 다시 보기: dev 13절
- 인천교육청 포털 `deferred` 여부(사용자 결정 대기): `backlog.md`
- **책 번호 체계 점검**(`check_code_spaces.py` → 4-11 기준값과 비교. 크게 바뀌거나 새 화면 종류면 사용자에게): dev 4-11
- 읽는 코드 없는 화면 7종: dev `library-site-issues.md`, `backlog.md`
- 정기 재조사 주기 미정: dev 4-9, `backlog.md` "운영·인프라"
- **새 도서관 넣기 (사이클 13부터, 구현됨)**: 절차 원본 dev `docs/maintenance/1-libraries.md`. 수집 사본을 만든 뒤 `library-insert` 미리 보기 → 보고서(새 곳·바뀐 곳·사라진 곳·같은 호스트 의심·순번 2 이상) 확인, 의심·바뀐 곳·사라진 곳이 있으면 사용자에게 물음 → 보고서 번호로 넣기(종료 코드 0~5. 새 곳은 `final_origins.tsv` 줄이 꼭 있어야 함, 확인한 사라진 곳은 `gone_known.tsv`) → 다음 가져오기 `export` → 운영 `apply`(판 2, 도서관 → 비교 → 책). 규칙은 dev `scripts/library/rules/` TSV를 고침(seed changeset을 만들지 않음). 가입 조건을 새로 조사하면 `join_surveyed_on.txt` 날짜를 바꿈(`/about` 공지 한 줄에 보임): `flows.md` 흐름 32·33, ADR-0084·0085·0087

### 책 수집 (수집 다시 돌릴 때)

- 수집기는 dev `scripts/crawl/`을 씀(사이클 13부터, 데이터 폴더 옛 코드는 `_old-scripts-2026-10-12` 보관): ADR-0088, `docs/research/maintenance/crawler-move.md`. 클라우드·AWS 서울·국내 프록시로 돌리는 방법은 `docs/research/deploy/aws-crawl.md`(다음 사이클 후보)
- 받지 않는 도서관 4곳(국회 44, 전북교육청 135, 군포 261, 김천 269)과 문제별 대처: `crawl-runbook.md` 5-1·6절, `catalog-refresh.md` 변경 기록. 사이클 13: 44·261·269는 2026-10-12에 다시 열어 같음을 확인하고 dev 규칙 파일 `gone_known.tsv`에 적었다가, 사이클 18에서 `library/016`으로 꺼짐(2026-10-14, `gone_known.tsv`는 비어 있음). 135는 꺼 둠. 모두 dev `docs/library-left-out.md` B절. 소장이 비었거나 덜 모인 곳의 원인·끄기는 사이클 18(`docs/cycles/18-empty-library-holdings/`)
- 전체 성공 기록 없는 도서관 12곳(어느 곳인지 목록 없음): `catalog-refresh.md` 4절
- 수집 순위 ①~④ 진행 상태(④ 웹러브 북스 기관은 2026-10-03 시작, 교보 대여·혼합형 243곳 제외): `crawl-runbook.md` 1·2·8절. 교보 대여·혼합은 수집도 서비스도 하지 않음(230곳, 받지 않음 표시만): `collection-by-vendor-2026-10-09.md` 4절, ADR-0067
- YES24·포털 77곳 재수집 완료 여부와 `verify_detail_urls.py` 재실행: `crawl-runbook.md`
- 제목에 "오디오북"인데 전자책 표시 452~476줄(`kind_check_needed`): `platforms.md`, `crawl-runbook.md`
- robots.txt 정책·UA 연락처 [확인 필요], 법적 위험 전문가 확인: `crawl-method.md`, `research.md` 3절
- 수집 원천 `content_type`에 새 값이 생기면 가져오기 CHECK에 걸림: `catalog-refresh.md` 4절

### 책 정리·묶기 (규칙 바꾸거나 다시 가져올 때)

- `same-book-isbn.md` 5.3절 표 그대로: 번호 체계 비율, ④ 출판일 2년 차이 11,019권, `48090…`·확인 숫자 불일치 코드, 국가서지 제목 다른 5%·없는 23%, 모호 키 5,303, ② 실효, YES24 재수집 뒤 수치, 국가서지 파일 갱신, ISBN 서지정보 API는 쓰지 않음(2026-10-03 결정, 묶기 문제가 많아지면 다시 검토)
- 저자: 단체 이름 79,649줄, 영문 "성, 이름" 1,607줄, 저자 빈 줄 746, ` - ` 제목 91,693줄: `search-and-normalization.md` 4.1·4.2
- 정리 규칙을 바꾼 뒤 다시 가져오는 순서와 서비스를 다시 켤지: `data-model.md` "정리 규칙을 바꿀 때", ADR-0069
- `Contributors`(`parse`·`ROLE_WORDS`)·`CatalogText`·`book_contributor.name_exact`를 바꾸면 사서추천 맞추기(`BookLookup.byTitleAndAuthor`)도 바뀜: 바꾼 뒤 사서추천 108권 중 우리 책 수를 다시 잼(2026-10-14 기준 72 / 108; 52권 기준 ① 30, ①이나 ② 33) — `docs/cycles/14-librarian-picks/retro.md`
- 출판사 별칭 목록 비어 있음, 1950년 이전 날짜, 도서관마다 출간일 다른 13%: `search-and-normalization.md` 4.3·4.4·5절
- 첫 실제 가져오기는 2026-10-03에 함(dev `plan-feedback.md`). 응답 시간 `EXPLAIN` 미측정, AC-1~14 미확인: `backlog.md` "미뤄 둔 사이클 04 마무리 작업", dev `plan-feedback.md` "측정 (아직)"
- pg_bigm `shared_preload_libraries` 운영 허용 여부: `search-and-normalization.md` 3.2.1
- 사이클 12 ④ 규칙(2026-10-14, `same-book-isbn.md` 5.7): 다시 가져올 때 기록 9번 기준값과 비교 — 책 1,563,167, ISBN으로 나뉨 약 7,529, 자리 채움으로 키 없음 60,672, 부제로 나뉨 12,389(dev `plan-feedback.md` 3352·3474·3479행). 많이 달라지면 `compare_grouping.py ids db <before> catalog` → `regroup`(dev `3-import.md` 154행)
- 부제 나누기(`SubtitleParts`)는 "같은 도서관이 따로 가지는지"를 보므로 **도서관을 더하거나 빼면 같은 사본이라도 나뉨이 바뀜** — 도서관 넣기(사이클 13 명령) 뒤 가져올 때 나뉨 수를 같이 봄
- 목록 상수(꼬리 넷, 자리 채움, 판 낱말 11개, 짧은 부제 8자)는 `SameTextKey.java` 36~69행. 바꾸면 dry run → `regroup`으로 합쳐짐·나뉨 표본을 봄(dry run 2~4의 교훈: 끝 숫자·앞의 0 규칙은 같은 책을 수천 권 갈랐음)
- 받아들인 위험: 판 표시·ISBN 없는 다른 판(「이상한 나라의 앨리스」 펭귄클래식 2010/2020)은 합쳐짐, 꺾쇠 저자 표기(「<김정은>,<김지혜> 저」)는 안 합쳐짐(사이클 17 첫 배포 전 사이클 19에서 저자 정리를 고쳐 다시 가져옴 [확정] (사용자 결정, 2026-10-14)), 저자 이름이 상표와 같으면(「사이다경제」) 두 줄

## 7. dev 문서에 알릴 것 (plan에서 못 고침 → 다음 인계서·회고에 넣음)

- **ADR-0047 옮기기 요청**: `docs/research/maintenance/dev-move-request.md` 전체. 사용자가 dev 세션에 직접 전달(인계서에 넣지 않음). 아래 두 항목(가져오기 실행 방법, `library-maintenance.md` 표 깨짐)도 이 요청서에 들어 있음

- 가져오기 실행 방법이 dev `plan-feedback.md`(회고용 문서)에만 있음. 절차 원본 원칙에 따라 dev `library-maintenance.md`에 "수집 목록 가져오기" 절로 옮기기를 요청. 함께 확인: 안내 "수집 세션이 쉴 때"와 실제(읽기 전용이라 2026-10-03에 수집 중 실행)가 다름 (2026-10-04, `docs/research/maintenance/periodic-tasks.md` 6절)

- dev `docs/library-maintenance.md` 41~42행 표가 깨져 3절 도구 표의 `CheckYes24Sites.java` 행이 유실됨. 4-10 표(275행)에 `YES24_V3` 누락. 절 번호 순서(4-9/4-11, 13/14절) 정리 필요. (2026-10-01 문서 점검에서 발견)
- C2-U-7(절차 원본을 어느 쪽으로 할지)에 대한 답 [확정] (사용자, 2026-10-01): "절차 원본 = dev `library-maintenance.md`, 조사 기록 = plan". 다음 인계서의 "개발 시작 전 확인"에 넣어 dev에 전달
- dev `docs/maintenance/3-import.md` 41행 "진짜 가져오기에서 켜면 약 2,394곳이 서비스에서 빠지기 때문"의 수는 지금 2,381(11곳은 사이클 08 ADR-0067로 뺌, 2곳 `library/010`으로 꺼짐, dev `plan-feedback.md` 3408~3412행). 다음 인계서에 넣음 (2026-10-14, 사이클 12 회고) — 사이클 18 `library/016`(22곳 끔) 뒤로 이 수는 또 바뀜: 다음 인계서 때 dev가 다시 셈 [확인 필요]
