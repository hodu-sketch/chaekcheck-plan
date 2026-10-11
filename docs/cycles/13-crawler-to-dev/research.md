# 사이클 13 사전 조사 (2026-10-12)

- 사용자: "내가 이 사이클에 해야 할 것들 있자나 미리 더 조사해야 할 거 있으면 조사해주고 물어볼 거 있으면 물어봐줘" (2026-10-12)
- 조사 방법: dev 코드를 읽기만 함
  - `scripts/library/build_candidate_seed.py`와 테스트
  - backend `collection`·`library` 모듈
  - Liquibase changelog
  - 사이클 11 spec·ADR-0078
- 질문은 결정 페이지 `easy/2026-10-12-research-questions.html`로

## 1. 지금 도서관 넣기 스크립트가 하는 일 (`build_candidate_seed.py`)

### 1-1. 읽는 것

| 입력 | 누가 만드나 | 쓰는 칸 |
|---|---|---|
| 수집 DB 사본 | 수집기 | `library`: id, name, platform_type, base_url, last_full_success_at, crawl_skip, vendor(있으면)<br>`holding`: library_id, item_key, removed_at (같은 호스트 겹침만) |
| `public-join.tsv` (공공도서관 가입 조사) | 사람 조사 | eligibility, basis, scope, visit_required, join_method, extra_condition, join_caution, source_url |
| `candidate-kinds.tsv` (종류) | 사람·이름 분류 | id, kind |
| 교보 기관 probe TSV | probe 스크립트 | platform, base_url, model(소장·혼합·대여) |
| 북큐브 권수 TSV | 수집 세션 | id, totalItem, totalVolume |
| `final-origins.tsv` (248줄) | `CheckFinalOrigins.java` | 최종 주소 |
| `name_overrides.tsv` (295줄) | **사람** | 이름 바꾸기(사이클 09) |
| 지역 seed CSV | Liquibase seed | 요약 문구용 지역 이름 |
| **이전 seed 파일** | 앞선 실행 결과 | 등록 도서관 번호·이름(003~006 CSV, 002 YAML의 SQL을 정규식으로), 대출 방식(008 YAML), 지난 실행의 008 CSV·짝 표(번호·이름 유지) |

### 1-2. 코드 안에 박힌 사람 결정

| 상수 | 크기 | 내용 |
|---|---|---|
| `DEMO_OR_CLOSED` | 4 | 체험용·운영 중단 (2026-10-05) |
| `SAME_SITE` | 8 | 포트만 다른 같은 사이트 (2026-10-05) |
| `SAME_HOST_KEPT` | 22 | 같은 호스트지만 다른 도서관으로 보고 남김 |
| `SCOPE_OVERRIDES` | 8 | 가입 범위를 사람이 정함 |
| 소속 전용 → `MEMBERS_ONLY` | – | 2026-10-05 결정 |

- 교보 대여·혼합 제외(ADR-0067)는 probe의 model 값으로 거름

### 1-3. 순서

1. 고르기
   - 첫째로 걸리는 것으로 빠짐: 교보 대여·혼합 → `crawl_skip` → 전체 수집 성공 없음 → 체험용 → 같은 사이트 → 종류 TEST
   - 나머지를 넣음. 종류가 없으면 멈춤
2. 같은 호스트 겹침 검사: 호스트가 같고 책 코드가 겹치면 보고
3. 번호
   - 이미 짝이 있는 곳은 번호·이름 유지
   - 새 곳은 "가장 큰 번호 + 1"부터 수집 번호 순
   - 빠진 번호(대여·혼합)는 다시 쓰지 않음
4. 이름: 수집 DB 이름 그대로. 다음에 `name_overrides` 적용
5. 가입 조사 상태와 규칙
   - 공공도서관 조사 결과로 `SURVEYED`·`NOT_FOUND`·`MEMBERS_ONLY`
   - 조사 안 한 종류는 `MEMBERS_ONLY`·`NOT_SURVEYED`
   - 지역 규칙 줄과 요약 문구
6. 대출 방식
   - 교보 구독형: probe 값
   - 북큐브: 권수 0이면 구독
   - 통합 포털: 비움
   - 나머지: 소장
7. 업체·순번: (이름, 업체, 대출 방식)이 같으면 순번 2부터
8. 결과·멈춤
   - seed CSV 3개를 씀: 도서관, 가입 규칙, 짝 표
   - **파일을 쓴 뒤에** 멈춤 신호를 줌: 같은 호스트 의심이면 종료 코드 2, 순번 2 이상이면 3

### 1-4. 옮길 때 조심할 것 (dev 코드에서 찾음)

- seed CSV의 `'NULL'`·`'true'` 같은 글자 값은 Liquibase용. DB에 바로 넣을 때는 진짜 NULL·참거짓으로
- 이름의 HTML 글자(`&amp;`)가 남은 곳이 있음
  - 서비스 1215 `한화S&amp;C`, dev `008-library-candidates.csv` 936행, 이름 바꾸기 목록에 없음
  - 메리츠는 사이클 09에서 고침
  - 수집 DB 이름에도 더 있을 수 있음 [확인 필요]
- 주소 비교 방식이 세 가지로 다름
  - probe: 끝 `/` 뗌
  - 최종 주소: 글자 그대로
  - 같은 호스트: 호스트 이름만
- Java로 옮기면 `_`가 든 호스트 등에서 결과가 달라질 수 있음
- "이미 짝이 있는 곳이 이제 후보가 아니면 전체를 멈춤" 규칙은 한 번씩 더하는 명령에는 맞지 않음
- 테스트가 안 다루는 곳: 같은 사이트·같은 호스트 남김, 소속 전용, 누구나, 범위 덮어쓰기, 최종 주소, 빠진 번호 멈춤

## 2. backend 모듈 (재시작 없이 넣으려면)

- 도서관 표의 주인은 `library` 모듈
  - 지금 Java 코드는 도서관 줄을 **넣지도 고치지도 않음**. Liquibase만 넣음. 엔티티는 읽기 전용, `Library.java` "Java never saves a library"
  - 공개 API `LibraryCatalog`도 읽기만 있음
- 서비스는 도서관 표를 요청마다 읽고 캐시가 없음 → DB에 들어가면 재시작 없이 바로 보임 [확정: 코드 확인]
- `collection` 모듈
  - "공개 API 없음, 가져오기는 따로 프로필로 돎"
  - 가져오기 명령은 `collection-import` 프로필의 `ApplicationRunner`. 따로 JVM으로 돌고 끝나면 꺼지고, 서비스는 계속 돎
  - SQLite 사본은 읽기 전용 JDBC로 읽음
  - 쓰는 표: `collection_link`, `catalog_import`, 국가서지 표
- 모듈 규칙(dev `CLAUDE.md`, spring-modulith 스킬): 다른 모듈은 공개 API나 이벤트로만. 다른 모듈의 표·저장소를 직접 쓰면 안 됨
  - `collection`이 `library` 표에 SQL로 쓰는 것은 규칙 위반
  - 이벤트는 새 번호를 돌려받기 어려워 이 일에는 맞지 않음
  - → `library`에 "도서관 더하기" 공개 기능을 새로 만들고 `collection` 명령이 부르는 방식이 맞음. `collection`은 이미 `library`에 의존해도 됨
- 새 명령은 가져오기 명령과 같은 꼴(새 프로필 + `ApplicationRunner`)로 만들 수 있음

## 3. Liquibase seed와 섞일 때 생기는 일

- 지금 도서관은 seed가 번호를 직접 적어 넣음. 끝에 IDENTITY를 다시 맞춤(`RESTART WITH 2675`)
- 명령으로 넣은 줄이 생긴 뒤 이런 일이 생기면 부딪힘:
  - 다시 seed로 번호를 넣음
  - 스크립트를 다시 돌림
  - IDENTITY를 더 낮게 다시 맞춤
  - 부딪히는 제약: 번호, 주소 UNIQUE, 짝 표, (이름, 업체, 대출 방식, 순번)
- 배포 전 정리(`PRE_DEPLOYMENT`, seed 접기) 때 명령으로 넣은 줄은 changelog에 없음
  - 로컬 DB 초기화나 새 환경에서는 사라짐 → 명령을 다시 돌려야 함
- 이름 바꾸기 changeset(013·014)은 (번호, 옛 이름)으로 고침. 명령으로 넣는 곳은 명령이 같은 이름 규칙을 적용해야 함
- 순번은 DB 전체를 보고 매겨야 함 (지금 스크립트는 CSV만 봄)
- 영향을 받는 테스트
  - `CandidateSeedTests`: 등록 280, 그 밖 2,383, 짝 2,663, 규칙 253 같은 고정 수
  - `LibrarySchemaCycle09Tests`: 순번·포털 7·괄호 이름 45
  - `CatalogImporterTests`, `ModularityTests`
- 문서: `JdbcCollectionLinks` 주석과 dev `docs/maintenance/3-import.md` 26행 "seed와 짝 표가 최신이어야 함"

## 4. 사이클 11(가져오기 따로 하기)과 만나는 곳

- 사이클 11에서는 내 PC에서 가져오기를 하고 파일로 운영에 반영함. 반영 명령은 시작할 때 **두 DB의 도서관(켜진 곳의 id·base_url·platform_type)과 `collection_link`가 같은지 해시로 봄.** 다르면 반영하지 않고 `mismatch` (spec R-A3, ADR-0078)
- 지금은 도서관이 seed라 두 DB가 저절로 같음
- 사이클 13에서 명령으로 넣으면 둘 중 하나가 필요함:
  - 두 DB에 같은 명령을 돌림
  - 내보내는 파일에 도서관·짝 표 바뀐 것을 실어 반영 때 함께 넣음

### 4-1. 사이클 11 중간 전달에서 dev가 본 것 (dev `docs/plan-feedback.md` "# 사이클 11" 끝 "사이클 13과 맞물리는 것", 커밋 `ac26ee2`, 2026-10-12)

- 지금 반영 파일 형식은 사이클 13을 막지 않음
  - `load_manifest.format_version`이 지금 1. 도서관 부분을 실으면 2로 올리고, 옛 앱은 다른 판 파일을 반영하지 않음(이미 거절함)
  - 파일은 `catalog_next` 스키마를 통째로 담으므로 작은 표(도서관·가입 규칙·짝 표)를 더 실을 수 있음
  - `catalog`는 `notes`를 해석하지 않아, 도서관 부분은 `collection`·`library`가 읽는 짐으로 둘 수 있음
- 지킬 것
  - 바꿔 끼우기의 `DROP SCHEMA catalog_next`가 CASCADE 없이 돎 → 더한 표는 `load_manifest`처럼 바꿔 끼우기 전에 지워야 함
  - "도서관 먼저 넣고 비교"하려면 비교 전에 도서관 부분을 읽어야 함. 파이프로 만든 `-Fc` 파일은 표 하나만 읽어도 파일 전체를 훑음(600MB면 수 초~수십 초)
  - 도서관 부분이 작으면 manifest처럼 표 COMMENT(목차)에 싣는 방법이 있음. manifest는 이렇게 1초 안에 읽음
- 함께 나온 숫자 (7단계 실데이터, 2026-10-12): 반영 파일 606MB, 운영 반영 4분 35초(바꿔 끼우기 0.08초), 켜진 도서관 2,658곳, 연결표 비교 포함 `compare` 3.2초. 도서관·연결표 해시는 `id	baseUrl	platformType`, `a	b` 줄의 SHA-256
- 사이클 11 남은 일: 11단계(세 묶기 방식 실데이터 비교·측정, 10~12시간)
- 새 사본 `snapshots\ebook-catalog-2026-10-12-0135.sqlite`(17.3GB)
  - 수집 세션의 이름 바꾸기(2026-10-12 01:34~01:35) 바로 뒤라 새 이름·`vendor` 칸·같은 사이트 107곳 표시가 다 들어 있음(수집 세션이 읽기 전용으로 확인, 2026-10-12)
- → 사이클 13 설계에서 정할 것 [안]: 도서관 부분을 반영 파일의 작은 표로 실을지, COMMENT에 실을지. 두 경우 모두 바꿔 끼우기 전에 지우는 순서를 넣음

## 5. 갈아타기 쪽 (설계 없음)

- dev `scripts/crawl/` 복사본은 10-05 것이고, 원본은 그 뒤 바뀌지 않음
- 할 것:
  - `vendor` 칸 반영
  - 데이터 폴더 도구 4개 옮기기
  - 옛 코드 보관
  - `status`로 첫 확인
  - 첫 실제 실행(예: 북큐브 5곳 권수 다시 받기)
- 지금 쓰는 `resume.cmd` 실행 경로와 설정 파일 위치는 dev 기록대로 데이터 폴더로 옮겨 가서 실행 (dev `plan-feedback.md` 1149행)

## 6. 수집 세션이 미리 한 것 (2026-10-12, 사용자: "지금 할 수 있는거 있으면 좀 먼저 해")

| 일 | 결과 | 근거 결정 |
|---|---|---|
| 수집 DB 이름의 HTML 글자 찾기·고치기 | 1곳뿐: 수집 101051 `한화S&amp;C` → `한화S&C` (서비스 1215). 바꾸기 전 이름은 `chaekcheck-data\library-naming
ames-before-2026-10-12.tsv`에 덧붙임. 서비스 쪽 1215는 사이클 13에서 dev가 고침 | 사전 결정 8 |
| 북큐브 권수 다시 받기 (사이클 09 요청서 4절) | 요청 1건씩, 2초 간격. 결과 `chaekcheck-data\library-namingookcube-volume-recheck-2026-10-12.tsv`. 100045 느티나무 0권·0, 100048 대구동구안심 0권·0(체험용으로 이미 제외), 100256 배재대 83,942종·134,188권, 100391 중원대 47,065종·137,582권, 100440 한세대 시간 초과(또 응답 없음). → 구독으로 바뀌는 곳 없음(모두 소장 그대로) | dev `docs/cycle09-for-collection.md` 4절 |
| 가입 조건 조사의 최신 날짜 | **2026-10-05** (공공도서관 120곳 원문 조사, `docs/research/library-join/candidates.md`). 그 전은 처음 278곳 2026-09-28~29 (dev `library-maintenance.md` 4-8). 공지 문구용 "최신 조사 날짜"의 첫 값 | 도서관 날짜 1번 |

- 아직 하지 않은 것 (dev 작업이 먼저 필요)
  - 옛 코드를 보관 폴더로 옮기기: dev 복사본에 `vendor` 칸·빈 곳 채우기 명령이 들어간 뒤 갈아탈 때 함께
  - 데이터 폴더 도구를 dev로 옮기기: plan·수집 세션은 dev에 쓸 수 없음
- 여주대 빠진 책 채우기
  - 결정: 사이클 13에서 갈아탄 뒤 dev 수집기의 "빈 곳 채우기" 명령으로 함. 갈아탄 수집기의 첫 시험으로 씀 [확정] (사용자: "가 (추천) … 이렇게해줘", 2026-10-12)
  - 대상: 수집 102084, YES24, 대학, 아직 서비스에 없음
  - 10-08에 약 5,600/8,378쪽에서 멈췄고, 그 사이 21권 채워짐(83,735 → 83,756줄), 남은 빈 책 약 20권 [추정]
  - 여주대 두 사이트(102084 YES24 소장, 100584 교보 일반 소장)는 ADR-0067(교보 구독형 대여·혼합 제외)에 해당하지 않음
  - 10-05 사본 뒤에 다 받아 서비스 seed에 없음 → 사이클 13 첫 도서관 넣기 때 "새로 생긴 도서관"으로 들어감

## 7. "먼저 조사할 것" 결과 (2026-10-12, 사용자: "먼저 조사할 거 먼저 조사하고 알려줘")

| # | 항목 (`scope.md`) | 결과 |
|---|---|---|
| 1 | 넣기 명령이 수집 DB를 직접 읽나, 사본을 읽나 | **사본** [안]. 가져오기 명령과 같은 방식(`CatalogImportRunner`가 `sqlite-path`의 사본을 읽기 전용 `open_mode=1`로 엶, 2절). 수집기가 원본에 쓰는 동안에도 부딪히지 않음. 사이클 11도 사본(`2026-10-12-0135`)으로 가져옴 |
| 2 | 반영 파일에 도서관 부분을 작은 표로, 또는 표 COMMENT로 | 양이 작음: 지금 첫 넣기에서 새로 생길 곳 **6곳**(아래 3). 줄마다 수백 바이트라 수십 곳이어도 수십 KB. PostgreSQL COMMENT는 `pg_description.description`(text)에 저장되고 text는 약 1GB까지 저장됨 [확정] (https://www.postgresql.org/docs/current/catalog-pg-description.html , https://www.postgresql.org/docs/current/datatype-character.html , 2026-10-12 확인). dev 프로토타입에서 manifest COMMENT는 목차만 읽어 1초 안(4-1) → **COMMENT에 실으면 비교 전에 빨리 읽을 수 있음** [안]. 크기 제한은 사실상 없음. 표로 실으면 파일을 훑어야 함(수 초~수십 초) |
| 3 | 첫 넣기에서 무엇이 나올지 (2026-10-12 사본 + dev 짝 표 2,663줄로 미리 셈) | **새로 생길 곳 6곳**: 여주대학교 100584(교보 일반)·102084(YES24), 한국선원복지고용센터 102029(YES24, 정부·공공기관), 김천대학교 102092(YES24), 경운대학교 102101(YES24), 천상중학교 102171(YES24). 모두 10-05 사본 뒤에 다 받은 곳. **사라질 곳 0**(짝이 있는데 이제 받지 않음 표시인 곳 없음). 등록 도서관과 같은 호스트 0 |
| 3-1 | 순번 2 이상 | 없음. 이름이 같은 서비스 도서관: 김천대학교(서비스 467, 북큐브) — 새 것은 YES24라 업체가 달라 순번 1. 여주대 둘은 교보·YES24로 업체가 달라 둘 다 순번 1 |
| 3-2 | 새로 안 것: 새 도서관끼리 같은 호스트 | 여주대 두 곳이 같은 호스트 `ebook.yit.ac.kr`(포트 8091 교보 / 80 YES24). 지금 스크립트는 **등록 도서관과만** 같은 호스트를 봄 → 새 명령은 새 도서관끼리, 그리고 서비스 전체와 보게 하는 것이 맞음 [안]. 여주대 둘은 화면 종류·책 수(2,199 / 83,756)가 달라 다른 서비스로 보임 |
| 4 | 지금 스크립트와 결과가 같은지 | dev 시험으로 남김: 같은 사본으로 옛 스크립트(`--changes-only`)와 새 명령의 미리 보기를 돌려 도서관·규칙·짝 표·순번을 비교. 위 3의 6곳이 기대값 |
| 5 | 업체·대출 방식·순번 규칙 | `research.md` 1-3 그대로: 업체 = 수집 `vendor` 칸이 있으면 그 값, 없으면 화면 종류 대응표. 대출 방식 = 교보 구독형 probe 값 / 북큐브 권수 0이면 구독 / 통합 포털 비움 / 나머지 소장. 순번 = (이름, 업체, 대출 방식)별로 번호 순. 서비스 DB 제약 `UNIQUE NULLS NOT DISTINCT (name, vendor, lending_model, order_no)`(dev `library/014`). 새 6곳은 모두 소장 |
| 6 | 받지 않는 도서관·문제별 대처가 갈아탄 수집기에서도 같은지 | 같음: dev 복사본은 원본의 마지막 수정(10-04 19:52) 뒤인 10-05 02:36에 떴고, dev가 바꾼 것은 데이터 폴더 위치·`DEV_SEED` 경로·`status` 읽기 전용·`sys.path`뿐(dev `plan-feedback.md` 1144~1150행). `crawl_skip` 처리는 그대로 |
| 7 | 전체 성공 기록 없는 도서관 | 받지 않음 표시가 없는 것 중 **2곳**: 무주초등학교 100252(북큐브, 사이트 404), 창원문성대학교 102020(YES24, 첫 화면 500). 둘 다 그대로 실패 |
| 8 | robots.txt·User-Agent 연락처 | 아직 정하지 않음: `crawl-method.md` "robots.txt: 기록은 하되 막아도 호출할지는 사용자 결정 [확인 필요]", "User-Agent 연락처 [확인 필요]". 지금 값 `Mozilla/5.0 (Windows NT 10.0; Win64; x64) chaekcheck-crawler/0.1 (catalog survey)`, 개인 연락처는 넣지 않음 [확정] → 사용자에게 질문 |

