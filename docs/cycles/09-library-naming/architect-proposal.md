# 설계 제안: 사이클 09 library-naming

- architect 서브에이전트 제안 (2026-10-11, 사이클 08 dev 진행 중 작업 폴더 기준). 결정은 `easy/2026-10-11-design-decisions.html`에서 받고 `design-delta.md`는 사이클 08 회고 뒤에 씀
- 이름·값에 태그가 없으면 [안]

## 현재 상태 (dev 2026-10-11)

- `library.library` (`backend/src/main/resources/db/changelog/library/001-library-schema.yaml`): `name text NOT NULL CONSTRAINT library_name_key UNIQUE`(:28), `platform_type` CHECK 9개(:31-34), `lending_model` NULL 허용 + CHECK `OWNED/SUBSCRIPTION/MIXED/RENTAL`(:51-53). raw `sql`로 `UNIQUE NULLS NOT DISTINCT`를 만든 예가 이미 있음(:84-85)
- `PRE_DEPLOYMENT` 표시 파일 있음. master 마지막은 `library/013-library-name-overrides.yaml`(`db.changelog-master.yaml:75-77`)
- 사이클 08 이름 고침: 적용된 seed는 고치지 않고 `(id, old_name, new_name)` VALUES로 `WHERE l.id = v.id AND l.name = v.old_name` UPDATE(`013…yaml:4,13-24`). 434 "경상국립대학교 (북큐브)", 456 "국립경국대학교 (북큐브)"(:15-16, `name_overrides.tsv:2-3`), 테스트 `LibrarySchemaCycle08Tests.java:50`. 상대 745 "경상국립대학교"(`KYOBO_V1`), 2239 "국립경국대학교"(`YES24_V2`)는 업체가 달라 새 UNIQUE에서는 괄호 없이 함께 있을 수 있음
- 대출 방식으로 동작이 갈리는 곳은 `HoldingTask.java:25-26` 하나. 등록 도서관 값은 `library/008…yaml:53-67` UPDATE
- Java에서 `Library`를 저장하는 곳 없음. `LendingModel` Javadoc "KYOBO subscription only"(`LendingModel.java:3-6`, `SearchTarget.java:14`). `CandidateSeedTests.java:55`가 280 이하 `OWNED` 수를 셈
- API: `LibraryEligibility`(:18-20)에 화면 종류·대출 방식 없음. `StreamEvents.Library`(:77-89)에 `platformType`만, 웹은 "Display only"(`types.ts:61-62`, ADR-0019)
- 웹 S10: `findByName`이 이름만 봄(`libraryNames.ts:5-7,18-26`), 호출 `MyLibrariesPage.tsx:281-282`, 대상은 `GET /api/v1/libraries` 전체(ADR-0058)
- `build_candidate_seed.py`: `LABELS`(:76-77), `name_candidates()`(:200-230), 이미 있는 이름 008 CSV(:329-330), 등록 이름 002~006(:133-147), `apply_name_overrides()`(:240-254)는 후보만 받음(:246-247), `lending_model`은 교보 probe만(:355), 테스트 `test_build_candidate_seed.py:159-166`

## 결정 1: 업체(vendor)를 어디에 둘지

- **A안 (추천)**: STORED 생성 칸 `vendor`. raw `sql` `ADD COLUMN vendor text GENERATED ALWAYS AS (CASE platform_type … END) STORED`. 값 `KYOBO/YES24/BOOKCUBE/ALADIN/PORTAL/IN_HOUSE` [안]. Java `enum Vendor`는 모듈 루트, 엔티티는 읽기만
  - 장점: 대응표 원본이 DB 한 곳, 어긋날 수 없음, UNIQUE 제약 이름으로 위반, SQL 점검이 쉬움, 화면 종류 추가 때 `SET EXPRESSION`(PG17+)
  - 단점: raw `sql`(이 표는 이미 그렇게 만듦), Python 사본 하나(어느 안이든 같음)
  - 되돌리기: `DROP EXPRESSION`(STORED만). VIRTUAL(PG18 기본)은 UNIQUE를 걸 수 있는지 공식 문서에 없음 → STORED [확인 필요: dev `db-test` 시험]
  - 주의: 실물 도서관(`platform_type` NULL)이 생기면 `vendor` NULL끼리 부딪침 → backlog
- B안: 칸 없이 식 UNIQUE 인덱스 + Java `PlatformType.vendor()` — 대응표가 SQL·Java·Python 세 곳, 위반이 인덱스 이름, 화면 종류 추가 때 인덱스 다시 만듦
- C안: 일반 칸 + CHECK, seed·UPDATE로 채움 — R2 "화면 종류에서 정한다"와 같은 사실을 두 번 적음, CHECK를 걸면 A안과 같아짐
- (웹 계산 안은 추천 안 함: DB에 값이 필요, ADR-0019와 맞지 않음)

## 결정 2: 순번 칸

- **A안 (추천)**: `order_no integer NOT NULL DEFAULT 1`, CHECK `library_order_no_check (order_no >= 1)`. 스크립트는 상태 없이 같은 (이름, 업체, 대출 방식) 묶음 안에서 서비스 번호가 작은 순서로 1, 2, 3(꺼진 도서관 포함). 2 이상이 생기면 스크립트가 (id, n) 목록을 출력하고 dev가 UPDATE changeset을 씀. 008 `loadData`는 그대로
  - 단점: 묶음 가운데 줄의 이름을 고쳐 묶음에서 빠지면 뒤 줄 순번이 당겨짐(3 → 2) [확인 필요: 사용자]
- B안: 이미 붙은 순번 고정, 새 곳만 가장 큰 순번 + 1 — 008 CSV에 칸을 더하거나(이미 적용된 changeset 수정, DB 다시 만듦) 순번 TSV를 따로 둬야 함
- 이름 후보: `order_no`(추천) / `site_order` / `duplicate_no`, 형 `integer`

## 결정 3: 이미 있는 줄의 이름을 바꾸는 방법

- A안: 이미 적용된 seed(002 SQL, 003~006·008 CSV)를 직접 고침 — `db`·`db-test`를 지우고 다시 적용, `catalog`·`collection` 다시 가져오기 필요, 사이클 08 방식과 갈림
- **B안 (추천)**: 새 UPDATE changeset을 번호로(013과 같은 꼴). 목록은 `name_overrides.tsv`에 더함
  - 대상: 괄호 뗄 277줄, 76·64, 93·943, 1575, 1149. 434·456은 `old_name`을 "… (북큐브)"로, `new_name`을 괄호 없이(013은 고치지 않음)
  - `name_overrides.tsv`: 434·456 `new_name`에서 괄호를 뗌, 이번 줄도 같은 파일에(`changed_on` 표시 `label-removed` [안], `source_url` ADR-0071, 사이트 제목으로 고친 곳은 그 출처). 다른 안: 파일을 따로(`name_label_removal.tsv`)
  - 스크립트: `name_candidates()`·`LABELS` 지우고 `VENDORS`·`assign_order_no()`, `apply_name_overrides()`가 등록 도서관도 받게(메모리 속 이름에만 적용), 겹침 열쇠를 (이름, 업체, 대출 방식, 순번)으로, 테스트 고침. 다음 실행 때 008 CSV에 고친 이름이 들어가고 이번 UPDATE는 `WHERE old_name` 때문에 아무 일도 안 함
  - 단점: VALUES 약 285줄(TSV에서 만듦), 002~006 파일에는 옛 이름이 남음
- changeset 순서(한 파일 `library/014-library-classification.yaml` [안 번호]): `library_name_key` 지움 → 이름 UPDATE → `lending_model` 채움 → `vendor` → `order_no` → 대출 방식 CHECK → `UNIQUE NULLS NOT DISTINCT (name, vendor, lending_model, order_no)` `library_classification_key` [안]. UNIQUE를 마지막에 두어 도중 상태에서 위반이 나지 않게

## 결정 4: `lending_model` 채우기와 필수 여부

- 채우기(공통): 교보 일반·YES24·알라딘·강남 NULL → `OWNED`. 북큐브: 구독 번호 339 부산, 380 제주꿈바당어린이, 386 진천군립도서관 대여형, 705 한양대학교 에리카(서비스 번호는 이름으로 찾음, `008-library-candidates.csv:60,101,107,426`) [확인 필요: dev가 `bookcube-volume-2026-10-11.tsv` + `collection_link`로 대조], 나머지 `OWNED`. 교보 구독형 NULL 59, 131, 140, 275~278 → `SUBSCRIPTION`. 통합 포털 NULL. Javadoc·`CandidateSeedTests.java:55` 고침, 스크립트에 북큐브 결과 입력
- **A안 (추천)**: CHECK `library_lending_model_required_check ((platform_type = 'ELIB_PORTAL_V1') = (lending_model IS NULL))` — 빠뜨리면 DB가 거절, 포털에 값이 들어가는 것도 막음
- B안: CHECK 없이 테스트·스크립트로만
- C안: 포털에도 값 + NOT NULL — 포털 NULL 결정과 맞지 않음

## 결정 5: API

- **A안 (추천)**: `LibraryEligibility`, `SearchTarget`(→ `StreamEvents.Library.from`)에 `vendor`, `lendingModel`(포털 `null`), `orderNo`. 웹이 우리말 글자로 바꿈, `orderNo >= 2`면 "· N번째 사이트", 값이 없으면 이름만. 예 `{"id":230,"name":"동대문구립도서관", …, "vendor":"YES24","lendingModel":"OWNED","orderNo":1}`
  - 단점: 목록 응답 약 130KB 늘어남(압축 전 추정, 지금 671,376바이트·gzip 61,152바이트, `api.md:32`) [확인 필요: dev 측정], `lendingModel`을 웹에 보내지 않는다는 기록(`api.md:87`)이 바뀜
- B안: 서버가 "교보 · 소장" 글자를 보냄 — 화면 문구가 백엔드에, 정렬에 업체 값이 따로 필요
- C안: `platformType`만 보내고 웹이 업체 계산 — 대응표가 웹에도, ADR-0019와 맞지 않음
- `Vendor` enum은 `com.chaekcheck.library` 루트. 새 모듈·이벤트 없음

## 결정 6: S10 이름 찾기

- 웹에서만 바꿈. `findByName`이 이름 키와 분류 키(업체·대출 방식 우리말 글자)를 받고, 낱말마다 둘 중 한 곳에 있으면 맞음. 정렬은 `flow.md`대로. 서버 찾기 API는 필요 없음

## 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 칸·값·제약 이름(`vendor`, `order_no`, 업체 값 6개, `library_classification_key`, `library_lending_model_required_check`, `orderNo`, changeset 014, `label-removed`) | 사용자 / 사이클 08 회고(번호) |
| VIRTUAL 생성 칸 UNIQUE 가능 여부(STORED면 상관없음) | dev `db-test` 시험 |
| Liquibase OSS YAML `addColumn`의 생성 칸 지원(raw `sql`이면 상관없음) | 확인 못 함 |
| 순번 당겨짐 허용 | 사용자 |
| 북큐브 구독 서비스 번호 339·380·386·705 | dev 대조 |
| "진천군립도서관 대여형"(386): 괄호가 아닌 "대여형"이 이름에 있음 | 사용자 |
| 응답 크기 증가(gzip) | dev 측정 |
| `eligibility_rules.py` 이름 열쇠 다시 돌리는지 | dev |
| 사이클 08 결과(013 뒤 changeset, `name_overrides.tsv` 마지막 상태) | 사이클 08 회고 |

## 출처 (확인 2026-10-11)

- https://www.postgresql.org/docs/18/ddl-generated-columns.html (기본 VIRTUAL, 생성 칸에 직접 쓸 수 없음)
- https://www.postgresql.org/docs/18/sql-createtable.html (`UNIQUE NULLS NOT DISTINCT`, VIRTUAL 인덱스 가능 여부는 적혀 있지 않음)
- https://www.postgresql.org/docs/18/sql-altertable.html (`SET EXPRESSION AS`, `DROP EXPRESSION`)
- https://www.postgresql.org/docs/18/release-18.html
- 공식 아님: https://www.depesz.com/?p=4342 (VIRTUAL 칸 인덱스·UNIQUE 미지원, 개발 중 시점), https://forum.liquibase.org/t/how-can-i-create-an-oracle-virtual-column/10160

## backlog 후보

- 실물 도서관이 생기면 `vendor` NULL끼리 UNIQUE에서 부딪침 → 실물 도서관 사이클
- 002~006 seed 파일의 옛 이름 정리(첫 배포 전 seed를 다시 만들 때)
- `check_front_page_names.py` 라벨 정규식 정리

## 사용자 결정 (2026-10-11, `easy/2026-10-11-design-decisions.html`)

- 결정 2 A안 (순번 `order_no`, 상태 없이 셈) [확정] (사용자 승인)
- 순번 당겨짐(묶음 가운데 이름을 고치면 뒤 순번이 당겨짐) 허용 [확정] (사용자 승인)
- 결정 3 B안 (번호로 UPDATE하는 changeset 추가, 목록은 `name_overrides.tsv`에 이어 적음, 434·456 괄호도 뗌) [확정] (사용자 승인)
- 결정 4 채우기 규칙 + A안 (포털만 대출 방식을 비울 수 있게 DB가 확인) [확정] (사용자 승인). 사용자 메모: "걱정되는게 좀 나중에 새로운 도서관 유형이나 도서관 대출 방법이 생겨도 유동적이어야 해" → 바뀔 때 드는 일을 페이지에 적음(새 대출 방법 = 허용 값 한 줄, 새 비움 유형 = 조건 한 줄)
- "진천군립도서관 대여형" → "진천군립도서관" [확정] (사용자 승인)
- 결정 5 A안 (값 `vendor`·`lendingModel`·`orderNo`를 보내고 웹이 글자를 만듦) [확정] (사용자 승인)
- 이름 목록(`vendor`, `order_no`, 업체 값 6개, 제약 이름, `orderNo`, `label-removed`) [확정] (사용자 승인)
- 결정 1: **업체는 도서관 수집이 정하고 seed 생성 스크립트가 보통 칸 `vendor`에 씀. DB는 허용 값 6개만 CHECK. 대응표는 seed 생성 스크립트 한 곳. 지금 있는 줄은 이번 changeset이 화면 종류 대응표로 한 번 채움. 스크립트 테스트로 "대응표와 다른 업체는 수집이 따로 적은 곳뿐"을 확인** [확정] (사용자 승인, 2026-10-11, `easy/2026-10-11-vendor-followup.html`; (나) DB 계산 안은 미승인: "역할 분리"). 사용자 질문: "이게 나은 것 같으데 수집 스크립트가 하는게... 역할 분리를 잘 따져봐야 할 것 같아". 이에 따라 결정 4의 CHECK는 `(vendor = 'PORTAL') = (lending_model IS NULL)`로 맞춤 [안]
- 결정 6: 이름 찾기는 웹에서만 바꿈(서버 찾기 API 없음, ADR-0058 그대로) [확정] (사용자 승인, 2026-10-11, 맥락 설명을 읽은 뒤)
