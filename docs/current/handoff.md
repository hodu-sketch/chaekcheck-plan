# 개발 인계서: 사이클 09 도서관 이름은 기관 이름만, 업체·대출 방식은 분류로

- 승인: 2026-10-11 (사용자, `docs/cycles/09-library-naming/easy/2026-10-11-handoff-decisions.html`)

## 요약

모든 도서관 이름 끝에 붙은 업체·대출 방식 괄호(277곳)를 떼고, 사이클 09에서 정한 이름 고침(434·456 "(북큐브)", 76·64·93·943·1575·1149·386, 977, 학교 6곳)을 함께 적용합니다. 이름 고침은 번호로 고치는 새 changeset 하나(`library/014`)로 하고, 같은 changeset에서 `vendor`·`order_no` 칸, 대출 방식 채우기, CHECK, (이름, 업체, 대출 방식, 순번) UNIQUE를 넣습니다. 목록 API와 검색 스트림에 `vendor`·`lendingModel`·`orderNo`를 보내고, 웹이 "교보 · 소장" 글자를 만들어 결과 카드(이름 다음 줄)와 S10 세 목록(이름 옆, 폰은 아래 줄)에 보입니다. S10 직접 추가 이름 찾기는 분류 글자로도 찾게 바꿉니다. 검색·소장 판정 동작은 바뀌지 않습니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다.
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) **조용히 바꾸지 말고** 먼저 사용자에게 알립니다. 내용과 이유는 dev `docs/plan-feedback.md`의 **새 `# 사이클 09` 절**에 적습니다. 사용자 발언이면 그대로 옮깁니다.
- 이름 중 `[안]`·`[안 이름]`·`[안 경로]`로 표시한 것은 dev가 코드에 맞춰 바꿀 수 있습니다. 바꾸면 `# 사이클 09` 절에 알리기만 합니다.
  - 해당 예: changelog 파일 번호·이름, `web/src/lib/libraryClassification.ts`, 새 테스트 클래스 이름, 스크립트 옵션·입력 파일 경로, 측정 저장 위치 `data/cycle09/`
  - **바꾸지 않는 이름** [확정] (사용자 승인, 2026-10-11): 칸 `vendor`·`order_no`, 업체 값 `KYOBO`·`YES24`·`BOOKCUBE`·`ALADIN`·`PORTAL`·`IN_HOUSE`, 제약 `library_vendor_check`·`library_vendor_required_check`·`library_lending_model_required_check`·`library_order_no_check`·`library_classification_key`, API 칸 `vendor`·`lendingModel`·`orderNo`, `name_overrides.tsv`의 `changed_on` 값 `label-removed`
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 확정된 것처럼 코드에 넣지 말고 `TODO(확인 필요)`로 둔 뒤, 확인하고 보고합니다.
- 새 의존성은 없습니다(Python 패키지 포함). 필요해지면 먼저 사용자 승인을 받습니다.
- 단계마다 아래 확인을 통과해야 다음 단계로 넘어갑니다.
  - 백엔드: `backend/`에서 `./gradlew build` (`ModularityTests`의 `ApplicationModules.of(ChaekcheckApplication.class).verify()`, `DocumentationTests` 포함)
  - 웹: `web/`에서 `npm test`, `npm run build`, `npm run lint`
  - 스크립트: 저장소 뿌리에서 `python -m unittest scripts/library/test_build_candidate_seed.py`
- **구현 기준은 `design-delta.md`입니다.** `architect-proposal.md`는 기록일 뿐입니다. 특히 changeset 안 순서는 design-delta 순서를 따릅니다(architect 제안 순서와 다름).
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), 사이클 05~08 인계서의 제약을 그대로 따릅니다. 아래에는 이번에 더하거나 바뀌는 것만 적습니다.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/09-library-naming/design-delta.md`: **기준 문서**. 데이터 표, changeset 순서 1~7, 이름 UPDATE 대상 표, 대출 방식 UPDATE 표, API, 웹, dev 스크립트와 문서, 확인 필요
- `.../09-library-naming/spec.md`: R1~R6, 상태별 동작, AC-1~AC-9, 비목표
- `.../09-library-naming/flow.md`: 분류를 붙이는 자리 표, S10 이름 찾기, 상태
- `.../09-library-naming/scope.md`, `research.md`(1절 이름을 쓰는 곳, 2절 `lending_model`을 쓰는 곳, 3절 괄호 이름 셈, 4절 겹침, 6절 북큐브 전체 권수, 8절 부여대왕초)
- `.../09-library-naming/architect-proposal.md` "사용자 결정" 절
- `.../09-library-naming/bookcube-volume-2026-10-11.tsv`: 북큐브 451곳의 `totalItem`·`totalVolume`(수집 DB 번호, 2026-10-11)
- ADR (`../chaekcheck-plan/docs/adr/`)
  - 0071: 이름은 기관 이름만, 업체·대출 방식·순번은 분류, (이름, 업체, 대출 방식, 순번) UNIQUE
  - 0076: 분류 값을 API로 보내고 웹이 글자를 만듦, 이름은 번호로 고치는 changeset, 이름 찾기는 웹에서
  - 그대로 따르는 것: 0017(사이트 하나 = 한 줄, 이름 구분 문장만 0071이 바꿈), 0019, 0056, 0058, 0067
- `../chaekcheck-plan/docs/cycles/08-polish-swap-memory/retro.md`: 이름 고침 방식(013), seed 방식 결정, 교보 구독형 서버 막힘
- dev `docs/library-maintenance.md` 4-12(사이클 08 이름 고침·흡수된 학교 조사, 출처 URL)

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0071 | 이름 끝 업체·대출 방식 괄호를 뗌, 기관 이름 속 괄호는 남김. 모든 도서관에 업체·대출 방식(포털만 대출 방식 NULL). `UNIQUE NULLS NOT DISTINCT (name, vendor, lending_model, order_no)`, 꺼진 도서관도 셈. 순번은 seed 생성 스크립트가 붙임. 업체는 도서관 수집이 정하고 스크립트가 씀. DB는 허용 값만 확인 |
| 0076 | `GET /api/v1/libraries`와 스트림 `targets.libraries[]`에 `vendor`·`lendingModel`·`orderNo`. 웹이 글자를 만듦, 값이 없으면 이름만. 이름은 `library/014`에서 번호 + 옛 이름 조건 UPDATE. 이름 찾기는 웹에서만 |

## 지켜야 할 제약

- C1. 모듈 의존 방향과 이벤트는 바뀌지 않습니다 [확정]: 새 모듈·새 표·새 이벤트 없음. `availability → library`는 이미 있고, `availability`는 `SearchTarget`의 값을 `StreamEvents.Library`에 옮겨 싣기만 합니다. `Vendor` enum은 `com.chaekcheck.library` 루트(`LendingModel`·`PlatformType` 옆)에 둡니다 [확정]. Kafka·Kubernetes·서비스 나누기는 하지 않습니다.
- C2. **Liquibase는 새 changeset만** [확정]
  - 이미 적용된 changeset과 seed 파일(002 YAML, 003~006·008 CSV, 008·013 YAML)은 고치지 않습니다. `PRE_DEPLOYMENT`가 있어도 이번 사이클은 고치지 않습니다: "첫 배포 전까지 번호로 고치는 changeset, 첫 배포 직전 한 번 seed 정리, 배포 뒤 seed 고정" [확정] (사용자 승인, 2026-10-11, 사이클 08 중간 결정 페이지; plan `docs/backlog.md`).
  - 그래서 **이번에 seed 생성 스크립트를 돌려도 `library/008-*.csv`·`collection/002-collection-link.csv`를 다시 쓴 결과는 커밋하지 않습니다**(`loadData` checksum이 바뀜). 아래 2단계의 "seed를 쓰지 않는 실행"을 씁니다.
  - 로컬 `db`·`db-test`는 초기화하지 않습니다. 014는 앱 시작·테스트 때 그대로 적용됩니다. `catalog`를 다시 가져올 필요도 없습니다.
  - 칸·제약은 raw `sql` change로 씁니다(`UNIQUE NULLS NOT DISTINCT`는 YAML이 지원하지 않음, `001-library-schema.yaml` 11행 주석과 같은 방식).
- C3. 외부 사이트 확인은 같은 사이트에 1건씩, 요청 사이 1초 이상입니다(사이클 08 C6) [확정]. 도서관 조사(공식 이름 다시 확인)는 dev `CLAUDE.md` "Library Research Record" 규칙대로 `docs/library-maintenance.md`를 먼저 읽고, 이미 적힌 출처는 다시 찾지 않으며, 새로 본 것은 원문과 URL을 같은 작업에서 적습니다.
- C4. **교보 구독형 서버(103.182.126.192, `*.dkyobobook.co.kr` 대부분)에는 요청하지 않습니다** [확정] (2026-10-07부터 이 집 IP에서 막힘, 사이클 08 회고). 977·1575·1149 등 이 서버의 사이트는 공식 출처와 이미 기록된 값(사용자 확인 포함)으로만 봅니다.
- C5. 검색·소장 판정은 바뀌지 않아야 합니다 [확정]. 대출 방식으로 동작이 갈리는 곳은 `availability/internal/search/HoldingTask.java:25-26`(교보 구독형 && `lendingModel != OWNED`) 하나입니다. 교보 구독형에 `OWNED`를 새로 넣는 줄이 있으면 멈추고 보고합니다.
- C6. React에서 `dangerouslySetInnerHTML`을 쓰지 않습니다. 분류 글자는 글자 노드로만 넣습니다.

## 개발 시작 전 확인

### dev가 확인할 것
- [ ] base package는 `com.chaekcheck`입니다(dev `CLAUDE.md`). 새 모듈은 없습니다.
- [ ] master의 마지막 library changeset이 `library/013-library-name-overrides.yaml`인지 봅니다(plan 2026-10-11 읽기: `db.changelog-master.yaml:76`). 그 뒤에 다른 것이 있으면 번호를 맞춥니다 [확인 필요].
- [ ] 사이클 08 dev 변경이 커밋되었는지 봅니다(회고 시점 2026-10-11에는 커밋 전). 사이클 09는 그 위에서 시작합니다.
- [ ] `scripts/library/name_overrides.tsv`가 8줄(434, 456, 2264, 2563, 2611, 2161, 1079, 1016)인지 봅니다.
- [ ] 북큐브 구독 번호: plan이 2026-10-11 `collection/002-collection-link.csv`에서 읽은 짝은 100062→339, 100108→380, 100114→386, 100442→705, 그리고 100747→943입니다. 2단계 스크립트 출력으로 다시 맞춥니다 [확인 필요].
- [ ] **0단계(기준 재기와 내 도서관 준비)를 014 적용 전에** 합니다. 적용한 뒤에는 다시 할 수 없습니다.

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 공식 이름이 spec과 다른 곳이 있으면 고를 이름 답하기 | 1단계 중 (014 VALUES를 쓰기 전) | 곳마다 최종 이름 |
| 북큐브 구독 번호가 339·380·386·705와 다르면 확인 | 2단계 스크립트 출력 뒤 | 구독으로 둘 번호 |
| 순번 2 이상이 나오면 사이트 이름 확인 | 2단계 스크립트 출력 뒤 (지금 데이터에는 없을 것으로 봄) | 이름 고침 또는 순번 유지 |
| 이름 바꿀 실제 줄 수와 목록 확인 | 3단계 014를 커밋하기 전 | 승인 |
| 목록 응답 크기 증가 확인 | 7단계 측정 뒤 | 받아들임 / 다른 방법 |
| 화면 확인: 결과 카드 둘째 줄, S10 이름 옆·폰 아래 줄 | 7단계 화면 | 바꿀 점 |

## 구현 단계

### 0단계: 기준 재기와 내 도서관 준비 (코드 변경 없음) (의존: 없음)

1. **목록 응답 크기** (AC-8 비교, design-delta 응답 크기 [확인 필요])
   - 할 일: 지역 없음으로 `GET /api/v1/libraries`를 받아 압축 전 바이트와 gzip 바이트를 적습니다(plan 기록 671,376 / 61,152바이트). 같은 방법으로 검색 스트림 첫 `targets` 이벤트 크기도 적습니다(지역 서울 하나 [안]).
   - 이유: 칸 셋을 더한 뒤의 증가를 재기 위함입니다.
2. **판정 동작 기준** (AC-8)
   - 할 일: `SELECT id FROM library.library WHERE platform_type = 'KYOBO_SUBSCRIPTION_V1' AND lending_model IS DISTINCT FROM 'OWNED' ORDER BY id`의 결과 목록을 저장합니다. `HoldingTask.subscription()`과 같은 조건입니다(NULL도 구독으로 동작).
   - 이유: 014 뒤에 이 목록이 **정확히 같아야** 판정이 바뀌지 않았다고 말할 수 있습니다. 사이트 응답에 기대지 않는 비교입니다.
3. **검색 결과 기준** (AC-8)
   - 할 일: `scripts/catalog/measure_books.py`의 질의로 `/api/v1/books` 첫 쪽 책 번호 목록을 저장합니다. 고정한 지역·직접 추가 묶음 둘 [안: 서울 거주 / 부산 거주 + 직접 추가 339·943·1575] 으로 검색 스트림과 책 화면 대출 현황 스트림을 받아, 도서관별 상태(대출 가능·대출 중·구독형·확인 실패 등)와 권수를 저장합니다.
   - 이유: 바꾼 뒤 같은 날 같은 질의로 비교합니다. 사이트 쪽 변화로 달라질 수 있으므로, 다른 곳은 다시 받아 확인합니다. 교보 구독형 서버 사이트는 두 번 모두 "확인 실패"일 수 있습니다.
4. **이름 기준** (AC-1·AC-2)
   - 할 일: 괄호가 있는 이름 전부(plan 셈 324줄)의 `id, name`을 저장합니다.
5. **내 도서관 준비** (AC-5)
   - 할 일: 이름이 바뀔 도서관을 미리 넣어 둡니다. 로그인 전 브라우저 하나와 로그인 계정 하나에 각각 [안: 434, 943, 1575, 339, 769, 76]을 직접 추가합니다.
   - 이유: 014 적용 뒤에 번호로 그대로 남는지 봅니다.
- 저장 위치: git 밖 `data/cycle09/` [안 경로]
- 위험: 낮음

### 1단계: 공식 이름 다시 확인과 `name_overrides.tsv` (의존: 0단계. 2단계와 나란히 할 수 있음)

1. **공식 이름 다시 확인** (파일: `docs/library-maintenance.md` 4-12 아래 새 절 [안: 4-13])
   - 할 일: 아래 곳의 새 이름을 공식 출처로 다시 확인합니다. 4-12-2에 이미 적힌 출처(대학알리미 통합 정보, 한국공학대 연혁 등)는 다시 찾지 않고, 비어 있는 것만 확인합니다(C3). 교보 구독형 서버에는 요청하지 않습니다(C4).
     - 977 "국립경국대학교" (spec R1-9; 456과 같은 대학알리미 출처)
     - 895 "한경국립대학교", 1002 "한국공학대학교", 769·2257 "강원대학교 강릉캠퍼스", 428 "국립창원대학교 거창캠퍼스", 429 "국립창원대학교 남해캠퍼스" (spec R1-10. 607 원광보건대학은 보류라 바꾸지 않음)
     - 943(수집 100747) "경상남도교육청 양산도서관": 교육청 쪽 정식 이름은 아직 확인 못 함(scope 6)
     - 64 "경상남도교육청 마산도서관"
     - 93 "양산시립도서관"은 [확정] (https://lib.yangsan.go.kr/ 머리 로고·저작권 줄, 2026-10-11 확인). 다시 볼 필요 없음
   - 이유: spec R1-9·R1-10이 "dev가 공식 출처로 다시 확인"을 조건으로 둠
   - **다르면 멈추고 사용자에게 물음**(무엇이, 출처 원문, 제안). 답을 기록에 옮깁니다.
   - 위험: 중간 (사용자 답을 기다릴 수 있음)
2. **괄호 뗄 줄 목록 만들기**
   - 할 일: 서비스 seed(002 YAML, 003~006 CSV, 008 CSV)의 이름 중 **끝**에 붙은 업체·대출 방식 괄호를 고릅니다: `(YES24)`, `(교보)`, `(북큐브)`, `(알라딘)`, `(구독)`, `(구독형)`, `(소장)`, `(소장형)`, `(대여)`, `(교보, 호스트)` 꼴. 괄호 앞 공백이 없는 꼴(예: "…도서관(YES24)")도 포함합니다. 기관 이름 속 괄호((주), (부산), (임직원), (서울), 캠퍼스·지역·부서 이름 등)는 남깁니다(spec R1-2).
   - 셈이 plan 셈과 같은지 봅니다: 뗄 줄 277(YES24 95, 교보 81, 북큐브 72, 구독 15, 알라딘 8, (교보, 호스트) 2, 구독형 1, 소장 1, 소장형 1, 대여 1), 남길 줄 45, 애매 2(76, 64)(`research.md` 3절, 2026-10-11 dev seed 셈). **다르면 멈추고 보고합니다.**
   - 고르는 정규식은 이 목록을 만들 때 한 번만 씁니다. seed 생성 스크립트에는 넣지 않습니다(이름 유지 규칙, spec R1-5). 만든 방법은 `library-maintenance.md`에 적습니다.
   - 위험: 중간 (기관 이름 속 괄호를 잘못 뗄 수 있음 → 남길 45줄을 눈으로 확인)
3. **`scripts/library/name_overrides.tsv`에 줄 더하기** (칸은 그대로: `library_id`, `old_name`, `new_name`, `changed_on`, `source_url`, `checked_on`)
   - 번호당 한 줄이고 `new_name`은 최종 이름 하나입니다. 괄호 떼기와 따로 정한 이름이 겹치는 번호(예: 1575 "(교보, 호스트)" → "완주동상초등학교", 769·2257 "(교보)/(YES24)" → "강원대학교 강릉캠퍼스", 943 "양산도서관 (교보)" → "경상남도교육청 양산도서관")는 최종 이름만 씁니다.
   - `old_name`은 지금처럼 **seed 파일의 이름**입니다(스크립트가 seed 이름과 대조하므로). 434·456은 `old_name` "경상대학교"·"국립안동대학교" 그대로 두고 `new_name`에서 " (북큐브)"만 뗍니다.
   - `changed_on`: 괄호 떼기 `label-removed` [확정]. 76 "(sam)"과 386 "대여형"도 `label-removed` [확정] (사용자 승인, 2026-10-11, `easy/2026-10-11-handoff-decisions.html`). 1149 HTML 이스케이프 고침은 `typo` [확정] (사용자 승인, 2026-10-11, `easy/2026-10-11-handoff-decisions.html`) (사이클 08 1016과 같은 값). 공식 개명은 바뀐 날, 사이트 제목으로 고친 곳(1575)은 확인한 날
   - `source_url`: 괄호 떼기는 `ADR-0071` [확정] (사용자 승인, 2026-10-11, `easy/2026-10-11-handoff-decisions.html`), 공식 개명은 1번에서 확인한 URL, 1575는 사이트 주소(사용자가 폰으로 확인, 2026-10-11), 93은 https://lib.yangsan.go.kr/
   - 대상(design-delta "이름 UPDATE 대상" 표): 괄호 277, 434·456, 76·64·93·943·1575·1149·386, 977, 895·1002·769·2257·428·429. 합 293은 겹침을 빼지 않은 수입니다. 실제 줄 수를 셉니다 [확인 필요].
   - 위험: 낮음

### 2단계: seed 생성 스크립트 (의존: 1단계 3번의 TSV. 테스트는 TSV 없이 먼저 써도 됨)

(파일: `scripts/library/build_candidate_seed.py`, `scripts/library/test_build_candidate_seed.py`)

1. **이름 규칙 지우기**: `LABELS`(76-77행)와 `name_candidates()`(200-230행)를 지웁니다. 새 후보는 수집 DB 이름 그대로 받습니다. docstring 31-32행 "Name clash" 규칙을 새 규칙으로 고칩니다. 이유: ADR-0071. 위험: 중간
2. **`VENDORS` 대응표 하나**: `KYOBO_V1`·`KYOBO_SUBSCRIPTION_V1` → `KYOBO`, `YES24_V1`·`V2`·`V3` → `YES24`, `BOOKCUBE_FX` → `BOOKCUBE`, `ALADIN_V1` → `ALADIN`, `ELIB_PORTAL_V1` → `PORTAL`, `GANGNAM_V1` → `IN_HOUSE` [확정]. 업체는 "수집이 따로 적은 값이 있으면 그 값, 없으면 대응표" [확정]. 수집이 따로 적는 자리는 아직 없습니다 [확인 필요: 수집 세션과 정함]. 지금은 비어 있는 자리(예: 빈 dict) [안]만 두고 `TODO(확인 필요)`를 답니다.
3. **대출 방식 규칙** (spec R3, design-delta 대출 방식 표)
   - `KYOBO_SUBSCRIPTION_V1`: 교보 probe 값 그대로(지금 코드 355행). 등록 도서관 중 값이 없는 7곳(59, 131, 140, 275, 276, 277, 278)은 `SUBSCRIPTION`
   - `BOOKCUBE_FX`: 북큐브 결과 파일에서 `totalVolume = 0`이고 `totalItem > 0`이면 `SUBSCRIPTION`, 아니면 `OWNED`(책 0종·응답 없음 포함)
   - `ELIB_PORTAL_V1`: 없음(NULL)
   - 나머지(`KYOBO_V1`, `YES24_V1~V3`, `ALADIN_V1`, `GANGNAM_V1`): `OWNED`
   - 북큐브 결과 파일: plan `docs/cycles/09-library-naming/bookcube-volume-2026-10-11.tsv`를 dev로 복사해 입력으로 씁니다 [안 경로: `scripts/library/bookcube-volume-2026-10-11.tsv`]. 칸은 `id`(수집 번호), `name`, `base_url`, `totalItem`, `totalVolume`, `error`입니다. 사용법(Usage) 줄과 인자 수를 고칩니다.
   - 출력에서 구독이 된 북큐브 서비스 번호를 보여 줍니다. 339·380·386·705가 아니면 **멈추고 사용자에게 물음**.
   - 위험: 중간
4. **`apply_name_overrides()`가 등록 도서관도 받게** (240-254행): 지금은 후보가 아니면 멈춥니다(246-247행). 등록 도서관(번호 280 이하)도 받아 **메모리 속 이름에만** 적용합니다. 등록 도서관 seed 파일(002~006)은 쓰지 않습니다. 겹침 확인(251-254행)은 아래 5번의 네 값으로 바꿉니다. 옛 이름 대조(248행)는 그대로 둡니다.
5. **`assign_order_no()`와 겹침 열쇠**
   - 이름 고침을 적용한 뒤, 등록 + 후보 전체(꺼진 도서관 포함, 지운 2664~2674 제외)를 (이름, 업체, 대출 방식)으로 묶고, 묶음 안에서 서비스 번호가 작은 순서로 1, 2, 3을 붙입니다. 상태 없이 매번 셉니다(묶음 가운데 줄의 이름이 바뀌면 뒤 순번이 당겨짐 [확정] 허용). 대출 방식 NULL끼리도 같은 값으로 봅니다.
   - 순번 2 이상은 `(id, order_no)` 목록으로 출력합니다. 지금 데이터에서는 0건이어야 합니다(부산 339, 양산 943, 제주한라 140, 부여대왕 1575가 풀림, spec R4-3). **나오면 멈추고 사용자에게 사이트 이름 확인을 요청합니다.**
   - 등록 도서관의 화면 종류와 대출 방식을 스크립트가 읽어야 합니다. 화면 종류는 seed CSV·002 YAML에 있고, 등록 도서관의 대출 방식은 `library/008-library-seed-candidates.yaml` UPDATE에 있습니다. 읽는 방법은 dev가 정해 보고합니다 [안: 아래 6번의 "지금 DB 상태" 파일에서 읽음].
6. **changeset용 목록 출력, seed는 쓰지 않는 실행**
   - seed CSV를 쓰지 않고 목록만 내는 실행 방법을 둡니다 [안 이름: `--changes-only`]. C2 때문에 이번 사이클에는 이 방법만 씁니다.
   - 출력 [안 모양]: 이름 UPDATE VALUES `(id, 지금 DB 이름, 최종 이름)`(이름이 다른 줄만), 대출 방식 UPDATE 대상(지금 NULL인 줄만), 순번 2 이상 목록, 대응표와 다른 업체 목록(지금은 0건), 수집 세션용 `(서비스 번호, 수집 번호, 최종 이름)` 목록
   - **"지금 DB 이름"은 seed 이름이 아닙니다.** 434·456은 013이 이미 "… (북큐브)"로 바꿨습니다. 014의 `old_name`은 013까지 적용된 DB 이름이어야 `WHERE l.name = v.old_name`이 맞습니다. 그래서 로컬 `db`(013까지 적용)에서 `id, name, platform_type, lending_model, enabled`를 내보낸 파일을 입력으로 받는 방법을 권합니다 [안]. dev가 다른 방법을 쓰면 보고합니다.
   - 첫 배포 직전 seed 정리 때(이번 아님)는 이 스크립트로 seed를 다시 쓰고 `vendor`·`order_no`도 seed 칸으로 넣습니다. 이번에는 CSV 칸을 더하지 않습니다.
7. **출력 요약 고치기**: 388-391행 "names with a label"을 지우고 업체별·대출 방식별 셈, 순번 2 이상 수로 바꿉니다.
- 테스트 (`test_build_candidate_seed.py`)
  - `test_names_get_a_label_then_a_host`(159-167행)를 바꿈: 이름이 같고 업체가 다르면 괄호 없이 둘 다 들어가고 순번 1(강동대학교 북큐브 / 교보). 이름·업체·대출 방식이 같으면 괄호 없이 순번 1, 2이고 목록에 나옴
  - 대출 방식: 교보 일반·YES24·알라딘·강남 `OWNED`, 포털 NULL, 북큐브 전체 권수 0 + 책 있음 `SUBSCRIPTION`, 책 0종 `OWNED`, 오류 `OWNED`, 등록 교보 구독형 NULL → `SUBSCRIPTION`
  - 업체: 모두 대응표 값. "대응표와 다른 업체는 수집이 따로 적은 곳뿐"
  - 등록 도서관(번호 ≤ 280)의 이름 고침이 메모리에서 적용되고 seed 파일은 그대로임
  - `test_stale_or_clashing_override_stops`(245-253행): 옛 이름이 틀리면 멈춤은 그대로. 등록 도서관과 같은 이름으로 고쳐도 업체가 다르면 멈추지 않고 들어감, 업체·대출 방식까지 같으면 순번 2로 나옴
  - `--changes-only`는 seed CSV 세 개를 바꾸지 않음
  - 지금 DB 이름을 입력으로 줄 때 VALUES의 `old_name`이 그 이름임(434 꼴)
  - 기존 테스트(같은 입력 같은 출력, 번호 유지, 빠지는 후보, 가입 규칙, 교보 대여·혼합) 통과
- 위험: 중간 (등록 도서관 값을 읽는 곳이 새로 생김)

### 3단계: Liquibase `library/014` (의존: 1·2단계의 목록, 사용자 확인)

(파일: `backend/src/main/resources/db/changelog/library/014-library-classification.yaml` [안 번호·이름], `db.changelog-master.yaml`에 013 다음으로 include)

1. **changeset 안 순서** [확정] (design-delta "changeset 안 순서", 사용자 승인 2026-10-11). 모두 raw `sql`입니다.
   1. `ALTER TABLE library.library DROP CONSTRAINT library_name_key`
   2. 이름 UPDATE: `UPDATE library.library AS l SET name = v.new_name FROM (VALUES (id, old_name, new_name), …) AS v(id, old_name, new_name) WHERE l.id = v.id AND l.name = v.old_name` (013과 같은 꼴). VALUES는 2단계 출력에서 만듭니다. 작은따옴표는 SQL 규칙대로 두 번 씁니다. 1149 새 이름은 "메리츠(증권&캐피탈)"입니다.
   3. `ALTER TABLE library.library ADD COLUMN vendor text`, 그다음 화면 종류 대응표로 UPDATE(2단계 2번과 같은 표)
   4. `lending_model` UPDATE (`WHERE lending_model IS NULL`인 줄만): `KYOBO_V1`, `YES24_V1~V3`, `ALADIN_V1`, `GANGNAM_V1` → `OWNED` / `BOOKCUBE_FX` 339·380·386·705 → `SUBSCRIPTION` (번호는 2단계에서 다시 맞춘 값) [확인 필요] / 나머지 `BOOKCUBE_FX` → `OWNED` / `KYOBO_SUBSCRIPTION_V1` 59, 131, 140, 275, 276, 277, 278 → `SUBSCRIPTION` / `ELIB_PORTAL_V1` → NULL 그대로
   5. `ALTER TABLE library.library ADD COLUMN order_no integer NOT NULL DEFAULT 1`
   6. CHECK 추가: `library_vendor_check CHECK (vendor IN ('KYOBO','YES24','BOOKCUBE','ALADIN','PORTAL','IN_HOUSE'))`, `library_vendor_required_check CHECK (library_type <> 'EBOOK' OR vendor IS NOT NULL)`, `library_lending_model_required_check CHECK ((vendor = 'PORTAL') = (lending_model IS NULL))`, `library_order_no_check CHECK (order_no >= 1)`. 허용 값 CHECK를 3번 칸 추가와 함께 걸어도 됩니다. 어느 쪽이든 UNIQUE보다 앞입니다.
   7. `ALTER TABLE library.library ADD CONSTRAINT library_classification_key UNIQUE NULLS NOT DISTINCT (name, vendor, lending_model, order_no)` (맨 마지막)
   - 한 changeSet에 모두 넣습니다 [확정] (사용자 승인, 2026-10-11, `easy/2026-10-11-handoff-decisions.html`): PostgreSQL은 DDL도 트랜잭션 안에서 되돌리므로, UNIQUE가 걸리면 전체가 되돌려지고 배포가 멈춥니다(design-delta 흐름 그림). 나누면 이유를 보고합니다.
2. **파일 머리 주석**: 사이클 09, ADR-0071·0076, 목록 출처(`name_overrides.tsv` + 2단계 출력), `old_name`은 013까지 적용된 이름이라는 점, 첫 배포 직전 seed 정리 때 합친다는 점. `001` 주석의 "`lending_model`: KYOBO subscription-screen institutions only" 설명은 001을 고치지 않고 014 주석에서 바뀐 뜻을 적습니다.
3. `updated_at` 트리거(`library/011`)가 UPDATE된 줄의 시각을 적습니다. 따로 할 일 없음.
- 적용 뒤 확인 (SQL, 그리고 4단계 테스트로 고정): 겹침 0(UNIQUE가 걸림), `order_no`가 모두 1, `vendor` NULL 0, 포털 7곳 말고 `lending_model` NULL 0 / 0단계 2번 목록과 같음(C5) / 이름 끝 괄호 0줄, 0단계 4번의 남길 줄은 그대로
- **커밋 전에 사용자에게 실제 바꿀 줄 수와 목록을 보입니다.**
- 위험: **높음** (이름 277+줄을 한 번에 바꿈, UNIQUE 실패 시 배포 멈춤)

### 4단계: 백엔드 `library`·`availability` (의존: 3단계)

1. **`Vendor` enum** (`backend/src/main/java/com/chaekcheck/library/Vendor.java`): `KYOBO`, `YES24`, `BOOKCUBE`, `ALADIN`, `PORTAL`, `IN_HOUSE`. Javadoc: "도서관 수집이 정하고 seed 생성 스크립트가 씀, DB는 허용 값만 확인(ADR-0071)". 위험: 낮음
2. **엔티티** (`library/internal/Library.java`): `vendor`(`@Enumerated(EnumType.STRING)`, `columnDefinition = "text"`), `orderNo`(`order_no`)를 읽기 전용으로 매핑(`insertable = false, updatable = false`). Java에서 `Library`를 저장하는 곳은 없습니다. 95행 `lendingModel` 주석을 "통합 포털 말고 모두, 포털만 NULL"로. 위험: 낮음
3. **공개 값** (`library/LibraryEligibility.java`, `library/SearchTarget.java`, `library/internal/LibraryService.java` 183행·261-267행 `toTarget`): `LibraryEligibility`에 `vendor`, `lendingModel`, `orderNo`. `SearchTarget`에 `vendor`, `orderNo`(`lendingModel`은 이미 있음). Javadoc: `SearchTarget.java:14`, `LendingModel.java:3-6`을 "통합 포털 말고 모두, 포털만 null"로. 위험: 낮음
4. **스트림** (`availability/internal/search/StreamEvents.java` 77-89행 `Library`, `from()`): `vendor`, `lendingModel`, `orderNo`를 `targets.libraries[]`에. 판정 코드는 고치지 않습니다(C5). 위험: 낮음
5. **목록 API** (`library/internal/web/LibraryListController.java`): 코드는 그대로, 응답 항목에 세 칸. 클래스 Javadoc에 칸 설명.
- 테스트
  - 새 통합 테스트 `backend/src/test/java/com/chaekcheck/library/LibrarySchemaCycle09Tests.java` [안 이름] (`@SpringBootTest @Transactional`, 위반마다 테스트 하나)
    - AC-7: 같은 (이름, 업체, 대출 방식, 순번) INSERT → 위반, 포털 두 줄(대출 방식 NULL) 같은 이름 → 위반, 순번만 2로 다르면 들어감
    - `vendor` 허용 값 밖 → 위반, EBOOK인데 `vendor` NULL → 위반, 포털에 대출 방식 값 → 위반, 포털 아닌데 대출 방식 NULL → 위반, `order_no = 0` → 위반
    - 꺼진 도서관도 겹침에 들어감
    - 적용 결과: `vendor` NULL 0, 포털 말고 `lending_model` NULL 0, `order_no` 모두 1, 이름 끝 괄호 0줄, "(주)" 등 남길 괄호는 그대로
    - 이름: 434 "경상국립대학교", 456·977 "국립경국대학교", 93 "양산시립도서관", 943 "경상남도교육청 양산도서관", 1575 "완주동상초등학교", 1576 "부여대왕초등학교", 1149 "메리츠(증권&캐피탈)", 386 "진천군립도서관", 그리고 1단계에서 확정한 학교 6곳·64·76
    - 북큐브 339·380·386·705 `SUBSCRIPTION`, 교보 구독형 59·131·140·275~278 `SUBSCRIPTION`
    - C5: 교보 구독형 && `lending_model IS DISTINCT FROM 'OWNED'` 번호 목록이 0단계 2번과 같음
  - 고칠 기존 테스트
    - `LibrarySchemaCycle08Tests.java:50`: 434·456 이름을 괄호 없이
    - `CandidateSeedTests.java:55`: 280 이하 `OWNED` 수(지금 5). 014 뒤 값은 SQL로 세고 주석에 근거를 적음. 값을 미리 정하지 않음
    - 도서관을 INSERT하는 테스트 데이터에 `vendor`·`lending_model`: `CandidateSeedTests.java:64`, `LibraryCatalogTests.java:377,386,395,622`, `BookSearchTests.java:307`, `LibraryListTests.java:138`, `MyLibraryApiTests.java:246,411`
    - JSON을 적어 둔 테스트에 세 칸: `LibraryListTests.java:58-76`, `EbookSearchStreamControllerTests.java:149-150`, `BookAvailabilityStreamControllerTests.java:189`. 생성자를 부르는 곳: `EbookSearchStreamControllerTests.java:183-242`, `HoldingTaskTests.java:36`
  - AC-9(API 쪽): 테스트 안에서 한 줄의 `order_no`를 2로 UPDATE하고 목록 API와 스트림 `targets`에 `"orderNo":2`. 포털은 `"lendingModel":null`
  - `HoldingTaskTests`: 판정 결과 그대로. `ModularityTests`, `DocumentationTests`
- 위험: 중간 (생성자를 부르는 곳과 테스트 데이터가 많음)

### 5단계: 웹 (의존: 4단계. 화면 조각과 테스트는 4단계와 나란히 시작할 수 있음)

1. **타입** (`web/src/api/types.ts` 57행 `TargetLibrary`, 327행 `LibraryEligibilityRow`): `vendor?: Vendor | null`, `lendingModel?: LendingModel | null`, `orderNo?: number`. 없을 수 있게 둠(배포 순서가 어긋남). `platformType`의 "Display only" 주석은 그대로(ADR-0019).
2. **분류 글자** (새 파일 `web/src/lib/libraryClassification.ts` [안 경로]): 업체 `KYOBO` 교보, `YES24` YES24, `BOOKCUBE` 북큐브, `ALADIN` 알라딘, `PORTAL` 통합 포털, `IN_HOUSE` 자체 / 대출 방식 `OWNED` 소장, `SUBSCRIPTION` 구독, `MIXED` 혼합, `RENTAL` 대여 [확정]. 함수 하나가 "교보 · 소장", "통합 포털", 순번 2 이상이면 뒤에 "· N번째 사이트"를 만듦. 업체 값이 없으면 `null`(이름만). 포털이 아닌데 대출 방식이 없으면 업체만 [안] (DB CHECK 때문에 생기지 않음). 위험: 낮음
3. **결과 카드** (`web/src/features/search/ResultRow.tsx` 129-151행, CSS 모듈): 이름 줄 **다음 줄**에 분류. 모든 폭, 작은 회색 글씨, 이름 버튼(Popover.Trigger) **밖**. 순서는 이름 → 분류 → 폰 안내(`mobileNote`) [확정] (사용자 승인, 2026-10-11, `easy/2026-10-11-handoff-decisions.html`). 분류 값이 없으면 줄을 만들지 않음. 가입 정보 창, 요약 줄(`LibrarySummaryBar.tsx`), `DirectResults.tsx`, `RegionImportDialog.tsx`는 이름만 [확정]. 위험: 낮음
4. **S10 세 목록** (`web/src/features/mylibrary/MyLibrariesPage.tsx` `NameList` 247-258행, `LibraryName` 261-268행): 지역 도서관 이름 목록, 직접 추가 찾기 결과, 직접 추가한 도서관에 "이름 · 업체 · 대출 방식". PC·태블릿은 이름 옆, 폰은 이름 아래 줄 [확정]. 폰 기준 폭은 기존 `(width <= 640px)`과 같게 [안]. 꺼진 도서관("쓸 수 없는 도서관")은 분류 없이. [추가]·[빼기] 버튼의 `aria-label`에 분류를 넣어 같은 이름 줄을 구분 [확정] (사용자 승인, 2026-10-11, `easy/2026-10-11-handoff-decisions.html`) (예: "동대문구립도서관 YES24 소장 추가"). 위험: 낮음
5. **이름 찾기** (`web/src/features/mylibrary/libraryNames.ts` `findByName`, 호출 `MyLibrariesPage.tsx:282`) [확정 규칙]
   - 검색어를 공백으로 나눈 낱말마다 이름 열쇠 또는 분류 열쇠(업체·대출 방식 우리말 글자)에 들어 있으면 맞음. 모든 낱말이 맞아야 함
   - 열쇠는 지금 `nameKey`(NFC, 공백·가운뎃점 `·`/`・` 지움, 소문자)로. "교보 · 소장"은 "교보소장"
   - 정렬: 이름 앞부분 일치 → 이름 가나다순 → 같은 이름은 업체 글자순
   - 지금 동작을 지키려고, 검색어 전체(공백 지움)가 이름에 들어 있으면 그대로 맞게 둠 [확정] (사용자 승인, 2026-10-11, `easy/2026-10-11-handoff-decisions.html`). 예: "창원대학교거창"
   - `MIN_NAME_QUERY = 2`는 그대로, 검색어 전체 열쇠 기준. 서버 찾기 API는 만들지 않음(ADR-0058, 0076)
   - 위험: 중간 (기존 찾기 결과가 바뀌지 않아야 함)
- 테스트 (Vitest)
  - `libraryNames.test.ts`: AC-6 "동대문 yes24" → YES24 줄만. "군산시립"은 교보·YES24·북큐브 세 줄이 업체 글자순(AC-4). "형사법무"로 "한국형사·법무정책연구원"(사이클 08 회귀). 낱말 하나라도 안 맞으면 빠짐. 분류 값이 없는 줄은 이름으로만
  - `libraryClassification` 단위: 6×4 글자, 포털, 순번 2 "· 2번째 사이트", 값 없음 → `null`
  - `ResultRow.test.tsx`: 202행 데이터 "강동대학교 (북큐브)" → "강동대학교"와 `vendor: 'BOOKCUBE'`. 분류 줄이 이름 버튼 밖 다음 줄, 포털 "통합 포털", 값이 없으면 줄 없음, `orderNo: 2`면 "· 2번째 사이트"(AC-9)
  - `MyLibrariesPage.test.tsx`: 세 목록에 분류, 꺼진 도서관은 분류 없음, `orderNo: 2`(AC-9), 같은 이름 두 줄의 `aria-label`이 다름
  - `regionSource.test.tsx:75,253`: 데이터 이름을 괄호 없이. 가져오기 창 글자는 이름만
- 위험: 중간

### 6단계: dev 도구·문서·설정 (의존: 2단계. 아무 때나)

1. **`scripts/library/check_front_page_names.py`**: 28행 `LABEL` 정규식과 `keys()`의 `LABEL.sub`(33행)를 지웁니다 [확정].
2. **`docs/library-maintenance.md`**: 1-1절 표의 `name` 줄("기관 정식 이름만, 업체·대출 방식 괄호를 붙이지 않음, UNIQUE 아님"), `lending_model`(포털만 NULL)·`vendor`·`order_no` 줄 더하기, 49행 제약 목록에서 `library_name_key` 빼고 새 제약 다섯 더하기 / 4-5절 204행 "이름은 '(구독)' 등으로 구분합니다(`name` UNIQUE)" → "이름은 기관 이름만, 업체·대출 방식·순번으로 구분(ADR-0071)" / 4-12 407행 "이름 짓는 규칙"과 이름 고침 절: 이번 규칙(괄호 없음, 순번이 붙으면 사이트 이름을 확인해 고치고 순번을 1로, 이름 유지 규칙과 예외), `label-removed`, 014 방식, 1단계 확인 기록 / 13절 작업 기록에 한 줄
3. **`docs/maintenance/1-libraries.md` 85행**: "이름이 겹치면 `이름 (북큐브|교보|YES24|알라딘)`…" 규칙을 새 규칙으로
4. **`backend/build.gradle` 71행 주석**: `-PbootRunXmx=4g` → `6g`. `docs/maintenance/3-import.md` 32·34행이 6g이고, 4GB는 첫 읽기에서 멈췄습니다(사이클 08 회고). 값(72행)은 바꾸지 않음
5. `scripts/library/eligibility_rules.py`(이름 열쇠, 예: `'국립세종도서관(구독형)'`)와 `build_seed.py`: 다시 돌리지 않으면 그대로. 다시 돌릴 계획이 있으면 보고 [확인 필요]
- 테스트: `check_front_page_names.py`는 손으로 한 줄 입력을 줘서 `keys()` 결과만 봄(사이트 요청 없이) [안]
- 위험: 낮음

### 7단계: 전체 확인 (의존: 1~6단계)

1. **AC-8 비교**: 0단계 2·3번과 같은 질의·묶음으로 다시 받음. 2번 목록이 같아야 함. 3번 상태·권수가 다르면 그 도서관만 다시 받아 사이트 쪽 변화인지 봄. 결과를 `# 사이클 09` 절에
2. **응답 크기**: 목록 API(압축 전·gzip)와 첫 `targets` 이벤트 크기를 0단계와 비교. plan 추정은 압축 전 약 130KB 증가 [확인 필요]. 결과를 사용자에게 알림
3. **AC-5**: 0단계 5번의 브라우저·계정에서 넣어 둔 도서관이 모두 남아 있고 새 이름·분류로 보이는지
4. **Playwright** 1280 → 768 → 375 → 320: S1·S3 결과 카드(이름 다음 줄 "교보 · 소장", 포털 "통합 포털", 폰 안내와 겹치지 않음) / S10(세 목록에 분류, 375·320에서는 이름 아래 줄, "동대문 yes24"·"군산시립" 찾기) / 이름 어디에도 업체·대출 방식 괄호가 없음, "(주)…" 등은 그대로
5. 사용자 화면 확인, 아래 AC 표 결과를 `# 사이클 09` 절에
- 위험: 낮음

## 수집 세션 할 일 (dev 작업과 따로, plan은 하지 않음)

- 무엇: 수집 DB `chaekcheck-data\ebook-catalog.sqlite`의 도서관 이름을 서비스와 같은 최종 이름으로 바꿉니다 [확정] (spec R1-7, 사용자: "이렇게 가자", 2026-10-11).
- 짝: 서비스 번호 ↔ 수집 번호는 `collection/002-collection-link.csv`(`collection_link`). 등록 도서관은 두 번호가 같음. 2단계 6번 출력의 `(서비스 번호, 수집 번호, 최종 이름)` 목록을 넘깁니다 [안].
- 방법과 때: 수집 세션과 정함 [확인 필요]. 수집기가 도는 동안 쓰기 충돌이 없게 하고, 사본(`snapshots/…`)은 건드리지 않음(사이클 08과 같은 원칙).
- 왜: 새 후보는 수집 DB 이름을 그대로 받으므로(2단계 1번), 수집 DB에 괄호가 남으면 다음 후보에 다시 붙음(예: 수집 100062 "부산광역시 전자도서관(구독)").
- 함께 정할 것: 수집이 업체를 따로 적는 자리 [확인 필요] (지금은 그런 곳 없음)
- 기록: dev `docs/maintenance/2-crawl.md` 또는 수집 세션 문서에 [안]

## 테스트

- 단위: Python(대출 방식 규칙, 업체 대응표, 순번, 등록 도서관 이름 고침, seed를 쓰지 않는 실행, 지금 DB 이름 입력), Vitest(분류 글자, `findByName`)
- 통합(`db-test`): `LibrarySchemaCycle09Tests`(제약·적용 결과·C5 목록), 고친 `LibrarySchemaCycle08Tests`·`CandidateSeedTests`, API·스트림 JSON에 세 칸, `ModularityTests`, `DocumentationTests`, 사이클 05~08 기존 테스트 전부
- 화면: Playwright 1280/768/375/320 (데스크톱 먼저)
- 실데이터: 0·7단계 비교

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 업체·대출 방식 괄호가 어디에도 없음 | SQL 테스트(이름 끝 괄호 0) + Vitest 데이터 + Playwright 세 화면 | 3, 4, 5, 7 |
| AC-2 기관 이름 속 괄호는 그대로 | SQL 테스트(0단계 4번 남길 줄과 비교) + Playwright | 0, 4, 7 |
| AC-3 모든 도서관에 업체, 포털 말고 모두 대출 방식 (PC·태블릿·폰) | SQL(NULL 0, CHECK) + Vitest + Playwright 4폭 | 4, 5, 7 |
| AC-4 같은 이름 두 사이트가 분류로 구분됨 | Vitest(군산시립 세 줄) + Playwright S10 | 5, 7 |
| AC-5 이름이 바뀐 뒤에도 내 도서관이 그대로(브라우저·계정) | 0단계 준비 → 7단계 확인 + 기존 `MyLibraryApiTests` | 0, 7 |
| AC-6 "동대문 yes24" → YES24 사이트 | Vitest + Playwright | 5, 7 |
| AC-7 네 값이 같으면 DB가 거절(포털끼리 포함), 순번만 다르면 들어감 | 통합 테스트 | 4 |
| AC-8 소장·대출 표시가 바뀌기 전과 같음 | C5 목록 SQL 비교 + 같은 질의 결과 비교 + `HoldingTaskTests` | 0, 4, 7 |
| AC-9 순번 2 이상은 "· N번째 사이트" | Vitest(ResultRow, S10) + 통합(API `orderNo`) | 4, 5 |

## 완료 기준

- [ ] spec AC-1~AC-9를 위 표의 방법으로 모두 확인함
- [ ] `backend/`에서 `./gradlew build` 통과(`ModularityTests`, `DocumentationTests` 포함)
- [ ] `web/`에서 `npm test`, `npm run build`, `npm run lint` 통과, Playwright 1280/768/375/320 확인
- [ ] `python -m unittest scripts/library/test_build_candidate_seed.py` 통과
- [ ] `library/014` 적용 뒤: 겹침 0, `order_no` 모두 1, `vendor` NULL 0, 포털 말고 `lending_model` NULL 0, C5 목록 같음
- [ ] 이미 적용된 changeset과 seed CSV는 바뀌지 않음(`git diff`에 008 CSV·`collection/002` CSV·013 이하가 없음)
- [ ] `name_overrides.tsv` 줄 수, 014 VALUES 줄 수, 사용자 확인
- [ ] 공식 이름 확인 기록, `library-maintenance.md` 1-1·4-5·4-12, `1-libraries.md`, `check_front_page_names.py`, `build.gradle` 주석
- [ ] 수집 세션에 넘길 이름 목록을 만들어 사용자에게 전달함
- [ ] [확인 필요] 결과와 설계와 달라진 점을 `# 사이클 09` 절에 적음

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 결과에 따라 | 막는 단계 |
|---|---|---|---|
| changeset 번호 014 | 개발 시작 때 master 마지막 번호 확인 | 번호만 맞춤, 보고 | 없음 |
| 북큐브 구독 서비스 번호 339·380·386·705 | 북큐브 결과 파일 + `collection_link` 대조(스크립트 출력) | 다르면 사용자에게 | 2, 3 |
| 공식 이름: 학교 6곳(R1-10), 977, 943(100747), 64 | 공식 출처 다시 확인(C3·C4) | 다르면 사용자에게 | 1, 3 |
| 이름 UPDATE 실제 줄 수(293은 겹침 빼기 전) | `name_overrides.tsv`·2단계 출력으로 셈 | 사용자 확인 | 3 |
| 괄호 셈 277 / 남길 45 / 애매 2 | 1단계 2번 셈 | 다르면 멈추고 보고 | 1 |
| 014 `old_name`을 만드는 방법(013 뒤 DB 이름) | dev가 정함 [안: 로컬 DB 내보내기 입력] | 보고 | 2, 3 |
| 등록 도서관의 화면 종류·대출 방식을 스크립트가 읽는 방법 | dev가 정함 | 보고 | 2 |
| 목록 응답 크기 증가(압축 전·gzip), 첫 `targets` 크기 | 0·7단계 측정 | 사용자에게 알림 | 없음 |
| 순번 2 이상이 생기는지(지금은 0 예상) | 2단계 출력 | 생기면 사용자에게 | 2 |
| 수집 DB 이름을 바꾸는 방법·때 | 수집 세션 | — | 없음 |
| 수집이 업체를 따로 적는 자리 | 수집 세션 (지금은 없음) | 스크립트 자리만 둠 | 없음 |
| `eligibility_rules.py`·`build_seed.py`를 다시 돌리는지 | dev | 돌리면 이름 열쇠 고침, 보고 | 없음 |
| design-delta API 예시의 부산 통합 포털 번호(예시 6) | 필요 없음(예시). 테스트에는 실제 번호를 SQL로 찾아 씀 | — | 없음 |

## 이번에 하지 않는 것

- 첫 배포 직전 seed 정리(013·014를 seed에 합치고 `vendor`·`order_no`를 seed 칸으로), `PRE_DEPLOYMENT` 지우기, 배포
- 이미 적용된 seed·changeset 고치기, 로컬 DB 초기화, `catalog` 다시 가져오기
- 업체·대출 방식으로 거르기("교보만 보기"), 업체 로고·색 표시
- 607 원광보건대학 이름, 흡수된 학교 7곳의 주소 바꿈·끄기, 이름 고침 목록 밖의 개명 전수 확인
- 옛 이름으로도 찾기, 서버 도서관 찾기 API
- 대출 방식으로 검색·소장 판정을 바꾸는 일, 교보 구독형 대출 방식 값 변경
- 북큐브 책 0종·응답 없음 5곳의 대출 방식 다시 보기(다음 수집 때)
- 교보 구독형 서버 사이트 다시 확인(1016·1079·2161 등, 서버가 풀린 뒤, backlog)
- 실물 도서관과 `vendor` NULL 겹침 규칙(backlog)
- 새 사본 가져오기, 자동 갱신, 수집기 옮기기, 책 묶기 기준 다시 보기
- 수집 DB 이름 바꾸기 실행(수집 세션 일)

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 09`** 절에 **무엇이 달라졌는지와 이유**를 적습니다. 사용자 발언이면 그대로 옮깁니다.

- 사용자 답: 공식 이름이 달랐던 곳과 고른 이름, 북큐브 구독 번호, 순번 2 이상 처리, 이름 고침 줄 수 승인, 응답 크기, 화면 확인
- 측정: 목록 응답·첫 `targets` 크기(전·후, 압축 전·gzip), AC-8 비교 결과(다른 곳과 이유)
- 셈: 괄호 뗀 줄·남긴 줄·애매 줄, `name_overrides.tsv` 최종 줄 수, 014 VALUES 줄 수, 업체별·대출 방식별 수, 280 이하 `OWNED` 새 수
- 정한 이름과 방법: changelog 파일 번호·이름, changeSet을 하나로 했는지, 014 `old_name`을 만든 방법, 스크립트 새 인자·옵션 이름, 북큐브 결과 파일 dev 경로, `libraryClassification.ts` 경로, 새 테스트 클래스 이름, 폰 기준 폭
- [확인 필요] 표 각 행의 결과
- 설계와 달라진 점, 새로 알게 된 제약(등록 도서관 값을 스크립트가 읽으며 생긴 일, 이름 찾기 결과가 바뀐 예, 수집 세션과 정한 이름 바꾸기 방법·때)
- AC 확인표(7단계)
