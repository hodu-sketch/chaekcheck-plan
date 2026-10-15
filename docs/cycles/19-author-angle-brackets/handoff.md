# 개발 인계서: 사이클 19 같은 책을 갈라 놓는 저자·제목 표기 정리

- 기준 문서: plan `docs/cycles/19-author-angle-brackets/design-delta.md`. 구현은 이 문서를 따릅니다. `architect-proposal.md`는 결정 기록(결정 결과 표 11개)입니다
- ADR: 0113, 0114, 0115, 0116, 0117 (모두 Accepted, 2026-10-15). 그대로 따르는 ADR: 0069, 0078, 0079·0105, 0085
- 승인: 사용자 승인 (2026-10-16, [인계서 검토](easy/2026-10-16-handoff-decisions.html) #1~#3)
- 사용자 당부 (인계서 검토, 2026-10-16): "이거 다른 ai가 수집이거 잘 하도록 문서 구조화 스크립트 잘 파악할 수 있는거에 주의하고 가능하면 실제 서비스되는 서버의 부담은 줄이고 가져오기할 때 잘하고 그랬으면 해". 그래서 11단계 규칙 목록 문서·상수 주석·시작 점검과 9단계 검증 스크립트는 다른 Claude 세션이 문서만 읽고 찾아 돌릴 수 있게 씁니다(문서에서 스크립트 경로·입력·판정 뜻을 바로 찾게). 묶기·정리는 모두 내 PC 가져오기(`export`)에서 하고, 운영 쪽에는 `apply`(복원·색인·바꿔 끼우기)와 사용 기록 칸 하나만 더합니다(ADR-0078)
- 이 사이클은 화면 구성을 바꾸지 않습니다. 저자 칸 글과 모이는 줄 수만 바뀝니다 [확정] (flow.md). API 모양도 그대로입니다. 표 변경은 `usagelog.library_response_daily.cached_count` 칸 하나뿐입니다 [확정] (design-delta)

## 일정

- **공개일은 2026-10-18입니다.** 그 전에 19 반영을 끝내도록 서두릅니다. dev가 늦어지면 공개일을 19 반영 다음 날로 미룹니다 [확정] (사용자 승인, 2026-10-15, 명세 결정 #1, spec "일정")
  - 계획: plan 쪽 화면·설계·인계서는 10-15, dev 개발은 10-16~17, 다시 가져오기와 운영 역할 반영은 10-17 (`to-cycle-17.md` 4)
  - 공개일이 미뤄지면 사이클 17이 맞춰 둔 날짜(공지, 약관 시행일, 사용 기록 켜는 날)도 함께 옮겨야 합니다 → 아래 "plan 쪽에 알려줄 것"
- **사이클 21과 나란히 개발합니다** [확정] (사용자: "나란히 개발할래", 2026-10-15, 설계 이어서 #3)
  - 다시 가져오기와 운영 역할 반영은 19와 21이 모두 들어간 main으로 한 번에 합니다 [안] (spec "일정")
- **21이 10-17까지 main에 들어오지 않으면 기다리지 않습니다.** 19만 들어간 main으로 먼저 다시 가져오기와 운영 역할 반영을 합니다. 21은 그 뒤 따로 반영합니다 [확정] (사용자 승인, 2026-10-16, 인계서 검토 #2)

## 요약

저자 정리(`catalog.normalize`의 `Contributors`)를 다음처럼 고칩니다. 같은 규칙을 저자 검색어와 책 표 저자 칸(`book.author_display`)에도 씁니다.
- 꺾쇠 `< >`·`＜ ＞`는 뗍니다
- `〈 〉`·`「 」`·`《 》`는 표시만 떼고 안의 글자는 남깁니다
- 「루이스 캐럴 저이소연 역」처럼 붙은 역할 낱말은 좁은 규칙과 보호 장치로 나눕니다

같은 책 묶기(`collection` 가져오기)도 고칩니다.
- ② 단계에서 같은 공급사의 상품 코드로 잇습니다
- ④ 비교 제목에서만 앞 괄호(관제)를 뗍니다
- 저자·출판사가 뒤바뀐 통합 포털 세 곳은 규칙 파일로 두 칸을 바꿔 읽습니다

수집기에는 "출판사가 먼저 나오는 포털" 상수를 둡니다. 이번에 다시 수집하지는 않습니다. 사용 기록에는 캐시 답 수 칸을 더합니다. 규칙 목록 문서와 검증 스크립트를 만들고 dev 문서를 고칩니다. 마지막으로 내 PC 원래 DB(5432)에서 다시 가져와 기록 11번과 견줍니다. 멈출 조건에 걸리지 않으면 운영 역할 DB에 반영하고 서비스를 새 코드로 다시 켭니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.** plan 저장소의 어떤 파일도 고치지 않습니다
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) 조용히 바꾸지 마세요
  - 먼저 사용자에게 알립니다
  - 무엇을 왜 바꿨는지 dev `docs/plan-feedback.md`의 새 **`# 사이클 19`** 절에 적습니다. 사용자 발언이면 그대로 옮깁니다
- `[안]`·`[안: 이름]`은 dev가 코드에 맞춰 바꿀 수 있습니다 [확정] (design-delta "클래스·설정·파일 이름은 dev가 바꿔도 됨"). 바꾸면 `# 사이클 19` 절에 알리기만 합니다
  - 해당 예: `Contributors.stripMarks`·`displayText`, `ImportRules`, `rulesDir` 설정 키, `Library.authorPublisherSwapped`, `Row.supplierCodeKey`, `SameTextKey.LEADING_NOTE_KEEP_WORDS`, `ImportReport`의 새 셈 이름(`supplierCodeJoins`·`codeJoinedIsbnConflicts`·`authorPublisherSwappedRows`·`leadingNoteCut`), 규칙 파일의 칸 이름, changeset id, `docs/maintenance/rules-index.md`, `scripts/library/check_author_publisher_swap.py`, 시험 클래스 이름, 작업 폴더·docker 프로젝트 이름·포트
  - **바꾸지 않는 것** [확정]
    - spec R1~R5 규칙 내용: 뗄 기호와 남길 기호, 좁은 규칙의 낱말과 글자 수, 보호 장치, 남길 괄호 낱말, "…판"·EDITION 규칙, 같은 공급사끼리만 견주고 제목 조건은 두지 않음, 공급사가 빈 줄은 코드로 잇지 않음
    - 세 도서관(수집 번호 11·12·15)과 세 호스트(`lib.goe.go.kr`, `library.daegu.go.kr`, `lib.jbe.go.kr`)
    - 칸 이름 `cached_count`와 그 제약(NOT NULL DEFAULT 0, 0 이상)
    - 결과 값 `UsageLog.ResponseResult.CACHED`
    - 모듈 의존 방향
    - 멈출 조건(아래 C4)
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 확정된 것처럼 코드에 넣지 말고 `TODO(확인 필요)`로 둔 뒤 확인하고 보고합니다
- 단계마다 통과해야 다음 단계로 갑니다
  - `backend/`에서 `./gradlew build`(`ModularityTests`·`DocumentationTests` 포함)
  - 수집기·스크립트를 고친 단계는 해당 `python -m unittest …`도 돌립니다
  - 웹은 바꾸지 않으므로 `web/` 명령은 회귀 확인용으로만 돌립니다
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`), `docs/maintenance/3-import.md`, 사이클 05~18 인계서의 제약을 그대로 따릅니다. 아래에는 더하거나 바뀌는 것만 적습니다

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/19-author-angle-brackets/design-delta.md`: **기준 문서**. 구조 그림, 모듈 표, 데이터, 규칙 파일, 규칙 세부 표(구현 위치), 시험 표, 확인 필요
- `.../19-author-angle-brackets/spec.md`: R1~R7, 상태별 동작, AC-1~AC-19, 비목표, 일정
- `.../19-author-angle-brackets/flow.md`: S1·S3에서 바뀌는 글
- `.../19-author-angle-brackets/research.md`: 원인 조사, SQL 1~6, 실험 (c)(d)(실험 (d)는 검증 스크립트의 방법), 공급사 코드 모양, 앞 괄호 낱말 분포, 「김근아」 확인
- `.../19-author-angle-brackets/scope.md`: "먼저 조사할 것" 표 1~9
- `.../19-author-angle-brackets/architect-proposal.md`: 결정 결과 표
- `.../19-author-angle-brackets/from-cycle-21-matching.md`: 21과 겹치는 곳, AC-14 기준값
- ADR (`../chaekcheck-plan/docs/adr/`): 0113, 0114, 0115, 0116, 0117. 관련: 0069, 0078, 0079, 0082, 0085, 0105, 0106
- AC-14 측정 방법
  - 이동진 추천도서: `../chaekcheck-plan/docs/research/leedongjin-picks/picks.md` 8절
  - 서울대 100선: `../chaekcheck-plan/docs/research/snu-100/picks.md` 3절
  - 사서추천: `docs/cycles/14-librarian-picks/retro.md`

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0113 | `Contributors`에서 기호를 떼고 붙은 역할을 나눕니다(셋째 역할까지, 보호 장치 포함). 공개 함수 `stripMarks`·`displayText`를 둡니다. 저자 검색어와 `book.author_display`에도 같은 규칙을 씁니다. 검색어 정리가 바뀌므로 ADR-0069 "검색어 다듬기 규칙" 순서를 따릅니다 |
| 0114 | ② 단계에서 (공급사 묶음, 코드)로도 잇습니다. 다른 이름이지만 같은 공급사인 것은 `supplier_families.tsv`에 적습니다. ④ 비교 제목에서만 앞 `( … )`를 뗍니다. 남길 낱말은 코드 상수입니다. ISBN이 둘 이상인 코드 묶음이 생기면 plan에 묻습니다 |
| 0115 | 수집 번호 11·12·15는 `CollectedCatalog.scan`에서 두 칸을 바꿔 읽습니다(`author_publisher_swapped.tsv`, `rules-dir`, 파일이 없으면 멈춤). `swap_before` 뒤 사본이면 멈춥니다. 수집기 상수 `PUBLISHER_FIRST_PORTAL_HOSTS`를 둡니다. 규칙 줄은 검증 스크립트로 "바름"이 나와야 지웁니다 |
| 0116 | `cached_count` 칸(새 변경 파일 `usagelog/002`)을 더합니다. `ResponseResult.CACHED`로 알립니다. 응답 시간·성공/실패 수·로그 줄에는 넣지 않습니다 |
| 0117 | 규칙 목록 문서 `docs/maintenance/rules-index.md` [안: 이름]를 만듭니다. 상수마다 그 줄을 가리키는 주석을 답니다. 수집기의 사람이 정한 값은 파일 맨 위 "규칙" 묶음에 모읍니다. 수집·가져오기 문서의 시작 점검이 규칙 목록 확인을 돌립니다 |

## 공통 제약

- **C1. 모듈 경계** [확정] (design-delta "모듈")
  - 바뀌는 곳은 `catalog`(`normalize`, `internal/search`), `collection`(안쪽만), `availability`(안쪽만), `usagelog`(공개 enum 값 하나 + 표 칸 하나)입니다. 그 밖에 `scripts/crawl/`, `scripts/library/`, `docs/`를 고칩니다
  - 모듈 의존은 바뀌지 않습니다: `collection → catalog, catalog :: normalize, library`, `availability → usagelog`. 공용(shared/common) 모듈은 만들지 않습니다. 새 이벤트도 없습니다
  - `catalog :: normalize`에 공개 함수 둘(`stripMarks`, `displayText`)만 더합니다. `CatalogText.norm`·`mainTitleNorm`은 그대로입니다 [확정] (설계 결정 #6, research (b)-2 안 채택 안 함)
- **C2. 세 묶는 방식은 같은 결과** [확정] (ADR-0079·0105, 설계 결정 #1)
  - `compact`·`objects`·`sql`이 같은 책, 같은 순서, 같은 책·소장 번호를 내야 합니다
  - 공급사 코드 키는 `CollectedCatalog`에서 한 번만 계산합니다. 세 방식은 그 키를 ISBN과 같은 "값마다 잇기"로 셉니다
  - 코드 키는 잇기에만 씁니다. **묶음의 ISBN 고르기(가장 많은 ISBN)에는 넣지 않습니다**. ISBN 값과 섞여 같은 값으로 셈해지지 않게 다른 공간(접두어 또는 별도 집합)에 둡니다 [안]
  - 대표 저자 고르기(`BookGrouping` 351·385행, `CompactGrouping` 577·619행, `SqlGrouping` 256·440행 부근)는 그대로입니다
- **C3. Liquibase** [확정] (design-delta "데이터", 설계 결정 #9)
  - 새 파일 `backend/src/main/resources/db/changelog/usagelog/002-library-response-cached-count.yaml`을 하나만 더합니다
  - master(`db.changelog-master.yaml`) 맨 끝에 붙입니다. plan 읽기(2026-10-16) 기준으로 맨 끝은 `# cycle 15` + `usagelog/001-usagelog-schema.yaml`(110~113행)이고, 그 뒤에 `# cycle 19` 주석과 include를 둡니다
  - 기존 changeset(`usagelog/001` 포함)은 고치지 않습니다. `PRE_DEPLOYMENT` 표시 파일이 있어도(plan 읽기 2026-10-16: 있음) 마찬가지입니다. `001`에 접어 넣으면 이미 적용된 내 PC DB의 checksum이 깨집니다(architect 결정 5-2)
  - 21이 먼저 main에 changeset을 더하면, 나중에 합치는 쪽이 rebase해서 자기 include를 맨 끝으로 옮깁니다
- **C4. 멈출 조건** [확정] (AC-12, 명세 결정 #8, ADR-0114). 아래 중 하나라도 걸리면 진짜 반영(13단계)을 하지 않고 멈춥니다. `# 사이클 19` 절에 적고 사용자에게 알려 plan이 규칙을 고칩니다
  1. 원인별 합쳐짐 표본 20권 가운데 **잘못 합쳐진 책이 1권 이상**
  2. **공급사 코드로 이었는데 ISBN이 둘 이상인 묶음이 1개 이상** (`codeJoinedIsbnConflicts` > 0)
  3. 가져오기가 규칙 파일 때문에 멈춤(파일 없음, `swap_before` 뒤 사본). 이 경우 아래 C9 절차를 따릅니다
- **C5. 도서관 사이트 확인** [확정] (사이클 18 회고 결정 #11)
  - 실제 사이트로 확인할 일이 생기면 도서관 하나만 부르는 주소 `/availability/libraries/{id}/ebooks`를 씁니다
  - 지역 없는 검색 스트림은 쓰지 않습니다. 다른 도서관(교보 구독형 포함)에도 요청이 가기 때문입니다
  - 교보 구독형 서버(`*.dkyobobook.co.kr`)에는 요청하지 않습니다
  - 사람 손 속도로 몇 건만 보냅니다(dev `library-maintenance.md` 2절)
- **C6. 다시 수집하지 않음** [확정] (spec R3-2)
  - 수집기는 고치기만 하고, 저장해 둔 HTML로 시험합니다
  - 세 포털의 칸 순서 확인이 더 필요하면 목록 한 쪽을 한 번씩만 엽니다(C5와 같은 예절)
- **C7. 가져오기 메모리**
  - 다시 가져오기는 기본 `compact`로 `-PbootRunXmx=2g` 안에서 끝나야 합니다 [확정: 2GB 기준] (확인 결과 결정 #9, ADR-0105)
  - 키 칸이 늘어 넘치면 멈추고, 늘린 값과 이유를 보고합니다 [안]
- **C8. 규칙 파일 꼴** [확정] (dev `scripts/library/rules/README.md`, ADR-0085): UTF-8, 탭 구분, 첫 줄 머리, 따옴표 처리 없음, 빈 칸은 값 없음
- **C9. 뒤바뀜 규칙 줄 지우기** [확정] (설계 결정 #5, ADR-0115)
  - 가져오기가 `swap_before` 뒤 사본에서 멈추면 줄을 그냥 지우지 않습니다
  - 그 사본으로 검증 스크립트를 돌립니다. 세 도서관이 "바름"일 때만 그 줄을 지우고 다시 가져옵니다
  - "바름"이 아니면 사용자에게 묻습니다
  - 이 절차를 `3-import.md`에 적습니다(11단계)
- **C10. 21과 겹치는 파일** [확정] (`to-cycle-21.md` 2)
  - `collection` 가져오기: 19는 `rules-dir`·`ImportRules`·② 공급사 코드·앞 괄호를 고치고, 21은 추천 목록 표·`BookChoice`를 고칩니다
  - `catalog.normalize`: 19에서 `parse`가 바뀌면 `name_exact` 맞추기 결과가 바뀝니다
  - 내 PC `export` 파일(21이 추천 목록 표를 더함)
  - 나중에 main에 들어가는 쪽이 rebase로 충돌을 풉니다

## 개발 시작 전 확인

### dev가 확인할 것

- [ ] base package `com.chaekcheck` [확정] (dev `CLAUDE.md`)
- [ ] 시작 커밋은 dev main `0a75f7a`(사이클 18 B `a0e438a` 위, GitHub에도 올림)입니다 [확정] (dev 18 알림, 2026-10-15). 그 뒤 main에 들어온 커밋(16 등)이 있으면 지금 main 끝에서 시작하고 시작 커밋을 `# 사이클 19` 절에 적습니다
- [ ] 원래 DB(5432)의 마지막 `collection.catalog_import` 기록이 **11번 SUCCEEDED**(2026-10-12 사본, 2624 소장 241권, 켜진 0권 도서관 0곳, `detail_url_not_http` 42)인지 확인합니다 [확정] (dev 18 알림)
  - 21이 이미 원래 DB에 가져오기를 했으면 기준이 바뀌므로 멈추고 알립니다
- [ ] 사이클 21이 main에 들어갔는지 확인합니다. 들어갔으면 `BookChoice`, export 파일, master 끝줄을 읽고 시작합니다
- [ ] 이미 끝난 일이라 하지 않을 것 [확정] (dev 18 알림): 설정 이름 바꾸기 `exclude-candidate-libraries` → `exclude-added-later-libraries`(18 B가 함). 19는 바뀐 이름(`Settings.excludeAddedLaterLibraries`, `HoldingRowFilter`, `SiteHosts`) 위에서 작업합니다
- [ ] 수집 번호 11·12·15에 짝지어진 서비스 도서관 번호를 `collection.collection_link`에서 찾아 `# 사이클 19` 절에 적습니다 [확인 필요: dev DB]
- [ ] master 맨 끝 include(plan 읽기: 110~113행 `usagelog/001`)

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 공급사 묶음 목록(`supplier_families.tsv`) 내용 확인 | 12단계 보고 뒤 | plan이 받아 확인 |
| 12단계 비교 보고 확인(멈출 조건에 걸렸으면 plan이 규칙 고침) | 12단계 끝 | 진행 / 멈춤 |
| 운영 역할 DB 반영 승인 | 13단계 | 승인 |

## 구현 단계

경로 약어: `C` = `backend/src/main/java/com/chaekcheck/catalog/normalize/`, `I` = `backend/src/main/java/com/chaekcheck/collection/internal/importer/`. 줄 번호는 plan이 2026-10-16에 dev main 작업 트리를 읽고 적은 것입니다. 21이 먼저 들어오면 다시 확인합니다.

### 0단계: 시작 점검과 기준값 (코드 변경 없음)

1. **작업 폴더와 브랜치** (사이클 14 방식) [안: 값은 dev가 정해 보고] (설계 이어서 #3)
   - worktree `../chaekcheck-dev-c19`, 브랜치 `cycle-19-author-angle-brackets`, docker는 늘 `docker compose -p chaekcheck-c19 …`
   - 포트는 13(5442~5444)·14(5452/5453/8082/5176)·18·21이 쓰는 번호와 겹치지 않게 정합니다. 켜기 전에 `docker compose ls`로 확인합니다
   - 원래 프로젝트 `chaekcheck`과 다른 사이클의 docker 프로젝트는 켜고 끄지 않습니다
   - 따로 만든 DB에는 원래 서비스 DB(기록 11번 상태)를 한 번 복사합니다(사이클 14 방법, 원래 DB는 읽기만). 복사하지 않고 원래 `db`를 쓰려면 먼저 사용자에게 묻습니다
2. **기준 빌드**: 시작 커밋에서 `./gradlew build`를 돌려 통과를 확인합니다. 실패하면 이 사이클 작업 전에 기록하고 사용자에게 알립니다
3. **기준 번호 파일**: `python scripts/catalog/compare_grouping.py ids db <before> catalog`로 기록 11번의 책 번호를 지금 받아 둡니다(`3-import.md` 12절 154행). **바꿔 끼운 뒤에는 다시 만들 수 없습니다**
4. **기준값 측정** (`# 사이클 19` 절에 적음; research.md·scope.md "먼저 조사할 것"의 SQL, 원래 DB 또는 복사본, 읽기만)
   - scope 조사 1·5: 수집 사본 저자 칸의 `<`·`>`·다른 괄호 줄 수와 모양별 표본
   - scope 조사 2: `catalog.book_contributor`에서 `name_exact`에 꺾쇠가 든 사람 수, 꺾쇠를 뗀 이름이 이미 있는 수
   - scope 조사 3: 내 PC 서비스에서 `GET /api/v1/books?author=김정은` 단어 검색과 정확히 일치 검색의 결과 수
   - research SQL 2: 공급사 코드가 여러 도서관에 걸친 수, 그중 제목이 다른 비율
   - research SQL 3: 앞 괄호 낱말 분포
   - research SQL 5·6: 붙은 역할 표기 줄 수, 역할 글자로 시작하는 이름
   - research (a) 확인 SQL: 「백만장자 마인드」(율리시즈) 줄
   - AC-14 기준: 기록 11번 DB에서 사서추천·이동진 추천도서·서울대 100선 맞춘 수
     - plan 기준값은 72/108, 36/44, 87/100 [확정: 2026-10-14·15 측정값]
     - 18 가져오기 뒤 값이 다를 수 있어 다시 잽니다
     - 사서추천은 `LocalPicksMatchRunner`(backend 시험 쪽, 환경 변수가 있을 때만 돎)
     - 나머지 둘은 참고 문서의 방법을 씁니다. 21이 main에 있으면 21 코드로 잽니다
5. **Documenter 다시 만들기** [확정] (15 회고 결정 #6): main에서 `./gradlew build` 뒤 `build/spring-modulith-docs/` 출력을 새로 만들고, `usagelog`·`sitecontent`·`picks` 그림이 있는지 확인해 보고합니다
- 위험: 낮음

### 1단계: 저자 기호 떼기 `stripMarks` (R1-1, R1-2)

1. **`Contributors.stripMarks(String)`** (파일 `C/Contributors.java`) [확정: 자리 / 안: 이름] (설계 결정 #6)
   - 할 일
     - NFKC 뒤 `<`·`>`를 모두 뺍니다(`＜＞`도 NFKC로 같은 글자가 됨, 짝이 안 맞아도 하나씩)
     - `〈 〉`·`「 」`·`《 》`는 표시 글자만 빼고 안의 글자는 남깁니다
     - `[ ]`는 그대로 둡니다
     - 표시를 뺀 자리의 공백은 하나로 줄입니다 [안] (예: 「KBS 〈슈퍼차이나〉 제작팀」 → 「KBS 슈퍼차이나 제작팀」, 「《아사히 신문》경제부」 → 공백 처리 방법은 dev가 정하고, 견줄 때는 `name_exact`가 공백을 무시함)
   - `parse`가 맨 처음 `stripMarks`를 부릅니다. 결과가 비면(「<>」) 사람 없음으로 둡니다 [확정] (명세 결정 #7)
   - 이 변화는 `firstNameExact`(사서추천 맞추기)와 국가서지 키에도 그대로 미칩니다(같은 `parse`)
   - 상수 옆에 규칙 목록 문서 줄을 가리키는 주석을 답니다(ADR-0117)
   - 이유: 꺾쇠 표기 2,944권이 합쳐지지 않음(사이클 12 R5), 다른 괄호 36쌍(research.md "다른 괄호를 떼면")
   - 의존: 0단계
   - 위험: 낮음
- 시험 `ContributorsTests` [안 이름] (새 파일 `backend/src/test/java/com/chaekcheck/catalog/normalize/ContributorsTests.java`. 지금 `parse` 시험이 있는 `CatalogTextTests`에 더해도 됨)
  - 「<김정은>,<김지혜> 저」 → 김정은(AUTHOR), 김지혜(AUTHOR)
  - 「<모리세 시게토모> 저/<이민연> 역」 → 모리세 시게토모(AUTHOR), 이민연(TRANSLATOR)
  - 짝 없는 꺾쇠 「＜율곡 이이,신사임당 저/이근오 편」, 전각 「＜이현욱＞역」
  - 「KBS 〈슈퍼차이나〉 제작팀」과 「KBS 슈퍼차이나 제작팀」의 `name_exact`가 같음
  - 「존 버거 [지음]」은 `[ ]`를 그대로 둠
  - 「<>」 → 빈 목록
  - 기존 `parse`·`firstNameExact` 시험이 그대로 통과(단체 이름, 영문 "성, 이름", 빈 저자는 바뀌지 않음, scope "먼저 조사할 것")
- 확인: AC-4·AC-5의 단위 부분

### 2단계: 붙은 역할 나누기와 `displayText` (R1-3, R1-5의 글 만들기)

1. **`Contributors.parse` 좁은 규칙** (파일 `C/Contributors.java`, `TRAILING_ROLE` 66~67행 앞에서) [확정] (세 원인 #3, 확인 결과 결정 #5)
   - 할 일
     - 한 덩이가 `앞 이름 + (저|저자|지음|지은이|글) + 한글 2~4자 + (역|옮김|옮긴이|번역|역자|그림)`이면 두 사람으로 나눕니다
     - 그 뒤에 `한글 2~4자 + (감수|편집|엮음|편|기획|해설|그림|사진|역|옮김)`이 또 붙으면 셋째 사람까지 나눕니다
     - 역할은 지금 `ROLE_WORDS`(39~56행) 그대로입니다. 감수는 OTHER(54행)
   - **보호 장치**: 붙은 낱말 앞에 역할 낱말이 이미 따로 적혀 있으면 자르지 않습니다(「발터 글라소프 글/…」, 「… 지음, …」)
   - 첫 낱말에 「편」·「그림」·「역」은 넣지 않습니다(research (c)-1). 넓은 규칙(모든 역할 낱말)은 쓰지 않습니다
   - 이유: 실험에서 557가지·1,264줄이 바르게 잘리고, 외국 이름 10가지·39줄은 보호 장치로 빠짐(research.md 실험 (c))
   - 의존: 1
   - 위험: 중간 (이름을 잘못 자르면 첫 저자 키가 바뀜)
2. **`Contributors.displayText(String)`** (같은 파일) [확정: 동작 / 안: 이름] (명세 결정 #4, 화면 흐름 #1)
   - `stripMarks`를 한 뒤, 1의 규칙에 걸린 표기만 역할 낱말 뒤를 띄웁니다. 보호 장치에 걸린 표기와 걸리지 않은 표기는 그대로입니다
   - 판정은 `parse`와 같은 코드를 써서 어긋나지 않게 합니다
   - 예: 「밥 프록터 저이재경 역조성희 감수」 → 「밥 프록터 저 이재경 역 조성희 감수」, 「<김정은>,<김지혜> 저」 → 「김정은,김지혜 저」
   - 의존: 1
   - 위험: 낮음
- 시험 (`ContributorsTests`)
  - 「루이스 캐럴 저이소연 역」 → 루이스 캐럴(AUTHOR), 이소연(TRANSLATOR)
  - 「마키타 겐지 저전선영 역강재헌 감수」 → AUTHOR·TRANSLATOR·OTHER 세 줄(AC-7)
  - 「안네마리 노르덴 저원유미 그림배정희 역」 → 세 줄
  - 「발터 글라소프 글/…」, 「다니엘라 저메인 …」, 「일리야 글라주노프 …」, 「패트릭 글리슨 …」처럼 앞에 역할 낱말이 따로 있는 표기는 잘리지 않음(AC-8)
  - 「정이현 편혜영 저」는 잘리지 않음
  - `displayText` 예 셋(위 2)과 보호 장치 표기 그대로(AC-17)
- 확인: AC-7·AC-8·AC-17의 단위 부분

### 3단계: 저자 검색어 정리 (R1-4)

1. **검색어에 `stripMarks`** (파일 `backend/src/main/java/com/chaekcheck/catalog/internal/search/BookQuery.java` 29~31행 `authorWords`, `PgBigmBookSearch.java` 199행 `CatalogText.nameExact(query.author())`) [확정] (명세 결정 #3)
   - 단어 검색과 정확히 일치 검색 모두 `stripMarks(author)`를 거친 값으로 다듬습니다. 제목·출판사 검색은 그대로입니다
   - 이유: 사용자가 "<김정은>"이나 "KBS 〈슈퍼차이나〉"로 찾아도 정리된 이름과 맞게 하려는 것
   - 의존: 1
   - 위험: 낮음
- 시험: `BookSearchTests`(`backend/src/test/java/com/chaekcheck/catalog/BookSearchTests.java`)에 경우를 더합니다
  - 정리된 이름 「김정은」이 저장된 책을 "김정은"·"<김정은>"으로 단어·정확히 일치 검색하면 모두 찾음(AC-3)
  - 옮긴이 역할로 "이소연"을 찾으면 나옴(AC-7)
- 확인: AC-3·AC-7의 검색 부분

### 4단계: ④ 비교 제목의 앞 괄호 (R2-2)

1. **`SameTextKey.comparisonTitle`과 `LEADING_NOTE_KEEP_WORDS`** (파일 `I/SameTextKey.java`, `comparisonTitle` 191행, 상수는 `EDITION_WORDS` 42행·`TAILS` 50행 옆) [확정] (세 원인 #2, 확인 결과 결정 #3, 명세 결정 #5, 설계 결정 #7)
   - 할 일
     - 앞 시리즈 표시(`LEADING_SERIES` 54행)를 뗀 뒤 맨 앞 `( … )` 하나를 뗍니다
     - 괄호 안 글자를 공백 무시하고 남길 낱말과 견줍니다. 같으면 남깁니다
     - 남길 낱말 목록 밖이라도 "…판"으로 끝나거나 "EDITION"이 들어 있으면 남깁니다(대소문자는 NFKC 뒤 견줌 [안])
     - 떼고 남은 제목이 비면 떼지 않습니다
     - 권 표시·부제는 지금처럼 전체 제목에서 읽습니다(174·216행)
     - 화면 제목, `CatalogText.mainTitleNorm`, 제목 검색은 그대로입니다
   - 남길 낱말 [확정] (확인 결과 결정 #3)
     - 판: 개정판, 개정2판, 증보, 증보판, 4판, 리커버, 2nd EDITION, 4th EDITION
     - 원서·번역: 영어원서, 영어 원서, 영문 번역판, 한영대역, 원문, 완역, 고본완역
     - 형태: 오디오북, 전자책, 체험판, 무료체험판, 만화, 큰글자책
     - 뒷권: 속
   - dev가 합쳐진 책 표본에서 빠진 낱말을 찾으면 더하고 보고합니다 [확정] (scope 포함 6)
   - 근거: KORMARC 245 "표제 배열" [확정] (https://librarian.nl.go.kr/kormarc/KSX6006-0/sub/20X_24X_245.html, 확인 2026-10-15)
   - 의존: 0단계(1~3과 따로 가능)
   - 위험: 중간 (책 종류 괄호가 빠지면 다른 책이 합쳐짐)
- 시험: `SameTextKeyTests`(`backend/src/test/java/com/chaekcheck/collection/internal/importer/SameTextKeyTests.java`)
  - (만화)·(개정판)·(속)·(3판)·(제2판)·(2nd EDITION)·(큰글자책)은 남김
  - 「(부를 끌어 당기는) 백만장자 마인드」와 「백만장자 마인드」는 같은 비교 제목
  - 「(만화) 삼국지」와 「삼국지」는 다름
  - 괄호만 있는 제목은 그대로
  - 기존 시험(`EDITION_WORDS`, 권 표시, 부제)은 그대로 통과
- 확인: AC-6의 단위 부분

### 5단계: 규칙 폴더 읽기와 저자·출판사 바꿔 읽기 (R2-4)

1. **규칙 파일 둘** (새 파일 `scripts/library/rules/author_publisher_swapped.tsv`, `scripts/library/rules/supplier_families.tsv`) [확정: 파일 둘 / 안: 이름·칸] (설계 결정 #4)
   - `author_publisher_swapped.tsv`
     - 칸: `collection_id, name, decided_on, swap_before, note`
     - 줄: 11 대구전자도서관, 12 경기도교육청 전자도서관, 15 전북특별자치도교육청 전자도서관 [확정]
     - `swap_before` = 고친 수집기(8단계)를 main에 합친 날 [확인 필요: dev]
     - `note`에 원인(목록 칸 순서 출판사 → 저자 → 날짜, 사이트 확인 2026-10-14)과 ADR-0115를 적습니다
   - `supplier_families.tsv`
     - 칸: `supplier, family, decided_on, note`
     - 내용은 dev가 수집 DB(2026-10-12 사본)의 `holding.supplier` 이름 전체를 보고 만듭니다 [확인 필요: dev, plan에 보고]
     - 적어도 다음 묶음을 넣습니다 [확정: 이 묶음] (design-delta, architect 결정 1)
       - 「Y2Books 전자책」 = 「와이투북스」: **이 줄이 없으면 AC-2가 통과하지 않습니다**
       - 「YES24」·「예스이십사」·「예스24」·「YES24 전자책」
       - 「교보문고」·「교보 전자책」·「교보문고 전자책」·「(주)교보문고」
   - `scripts/library/rules/README.md` 표에 두 줄을 더합니다. 가져오기(`collection-import`, 설정 `rules-dir`)도 이 폴더를 읽는다고 적습니다
   - 의존: 0단계
   - 위험: 낮음
2. **`ImportRules`** (새 파일 `I/ImportRules.java` [안 이름]) [확정: 동작] (설계 결정 #4·#5)
   - 두 파일을 읽습니다. 파일이나 칸이 없거나 값이 틀리면 **수집 사본을 읽기 전에** 멈춥니다(오류 문구에 파일 이름)
   - 공급사 이름 다듬기(NFKC, 소문자, `(주)` 같은 법인 표시, 공백 제거)는 한 함수에 둡니다 [안 세부]. 목록에 없는 이름은 다듬은 이름 그대로 한 묶음입니다 [확정] (설계 결정 #2)
   - `swap_before` 검사: 세 도서관의 수집 시각(`Library.collectedAt`)이 `swap_before` 이후면 "규칙 줄을 지우기 전에 `scripts/library/check_author_publisher_swap.py`로 검증하세요"라는 문구로 멈춥니다 [안: 판정 기준은 dev가 정해 보고]
   - 지금 넣기 명령의 `RuleSet`(`collection/internal/libraryinsert/RuleSet.java`) 읽기 방식과 같은 꼴로 씁니다. 코드를 나눌지는 dev가 정합니다 [안]
3. **설정 `rules-dir`** (파일 `I/CatalogImportRunner.java` `Settings` 73~74행, `backend/src/main/resources/application-collection-import.yml`) [확정: 동작 / 안: 이름]
   - `chaekcheck.collection.import.rules-dir`를 더합니다. 기본값은 `../scripts/library/rules`입니다
   - 모든 mode에 필요한지는 dev가 정합니다(`export`·`in-place`·dry run은 필요, `apply`·`finish`·`discard`는 사본을 읽지 않음) [안]
4. **줄을 읽을 때 두 칸 바꾸기** (파일 `I/CollectedCatalog.java`) [확정] (설계 결정 #3)
   - `Library` 레코드(51~52행)에 `authorPublisherSwapped`를 더합니다. `libraries(…)`(107행)에서 규칙 파일의 수집 번호로 채웁니다
   - `scan`(164~205행)에서 `Row`를 만들 때(198~201행) 바뀐 도서관이면 `authorRaw`와 `publisher`를 바꿉니다. 두 번 읽기(ADR-0054) 모두 같은 값이어야 합니다
   - 첫 번째 읽기에서 바꾼 줄 수를 `ImportReport`(`authorPublisherSwappedRows` [안])에 셉니다
   - Javadoc에 "세 도서관의 `holding.author_raw`·`publisher_raw`는 바꾼 값(수집 원문 그대로의 예외)"을 적습니다 [확정] (design-delta "데이터")
   - 의존: 2·3
   - 위험: 낮음
- 시험
  - `ImportRulesTests` [안]: 두 파일 정상, 파일 없음 → 멈춤, 칸 없음 → 멈춤, `swap_before` 뒤 수집 시각 → 멈춤, 공급사 이름 다듬기
  - `CatalogImportSettingsTests`: `rules-dir` 기본값과 지정값
  - 가져오기 시험(지금 `CatalogImporterTests`의 작은 수집 사본에 수집 번호 11 꼴 도서관을 더함): 그 도서관 줄의 저자·출판사가 바뀌어 들어가고, 다른 도서관은 그대로(AC-9)
- 확인: AC-9의 시험 부분

### 6단계: ② 공급사 코드로 잇기 (R2-3)

1. **`Row.supplierCodeKey`** (파일 `I/CollectedCatalog.java` `Row` 72~75행, `scan`) [확정] (명세 결정 #6, 설계 결정 #1)
   - 서비스 화면 종류(`Library.platformType`)에 따라 코드를 고릅니다
     - `BOOKCUBE_FX` → `alt_code`
     - `KYOBO_V1`·`KYOBO_SUBSCRIPTION_V1`·`YES24_V1`·`YES24_V2`·`YES24_V3` → `item_key`
     - 그 밖 → 없음
   - 키 = (공급사 묶음, 다듬은 코드)입니다. 공급사 묶음은 `ImportRules`로 바꾼 값이고, 공급사가 비면 키도 없습니다
   - 코드 다듬기(공백, 앞의 0)와 `KYOBO_SUBSCRIPTION_V1` `item_key`의 번호 공간은 [확인 필요: dev 수집 DB] (design-delta 확인 필요)
2. **세 묶는 방식의 ②** (파일 `I/BookGrouping.java` 141행 부근 `unit.isbns.add(…)`, `I/CompactGrouping.java` 170행 부근, `I/SqlGrouping.java` 151행 부근과 `grp_vote` 새 kind) [확정: 같은 단계·같은 결과] (설계 결정 #1)
   - 코드 키를 ISBN처럼 "값마다 잇기"에 넣습니다. ISBN 고르기 표에는 넣지 않습니다(C2)
   - `objects`는 `Unit.codes`, `compact`는 새 필드, `sql`은 `grp_vote` 새 kind입니다 [안]
   - `BookGrouper` 인터페이스 Javadoc(25~37행 규칙 목록)의 ② 설명을 고칩니다
3. **셈** (파일 `I/ImportReport.java`)
   - `supplierCodeJoins` [안]: 코드 키 때문에 이어진 횟수
   - `codeJoinedIsbnConflicts` [안]: 코드로 이었는데 묶음 안 ISBN이 둘 이상인 묶음 수. C4의 2번 멈출 조건입니다
   - 세 방식이 같은 값을 내야 합니다
   - 의존: 5
   - 위험: **높음** (세 방식이 어긋나거나 9자리 번호에서 다른 책이 이어질 수 있음)
- 시험
  - `BookGrouperContractTests`(세 방식 같은 결과)에 경우를 더합니다
    - 북큐브 `alt_code` 1210492004114(공급사 「Y2Books 전자책」) = 교보 `item_key` 1210492004114(「와이투북스」) → 같은 책(AC-2)
    - 같은 9자리 번호라도 공급사 묶음이 다르면(북큐브 자체 코드 / YES24) 따로
    - 공급사가 빈 줄은 따로
    - 코드로 이은 묶음의 ISBN은 코드가 아니라 가장 많은 ISBN
    - `codeJoinedIsbnConflicts` 셈
  - `CompactGroupingTests`·`SqlGroupingTests` 기존 시험이 그대로 통과
- 확인: AC-2의 시험 부분

### 7단계: 책 표 저자 칸 `displayText`와 가져오기 통합 시험 (R1-5, R2-1)

1. **`NewBook`의 저자 칸** (파일 `I/CatalogImporter.java` 173~174행) [확정] (명세 결정 #4, 설계 결정 #6)
   - `book.authorDisplay()` 대신 `Contributors.displayText(book.authorDisplay())`를 넣습니다. 세 방식의 대표 고르기는 고치지 않습니다
   - 첫 저자(③·④ 키)는 1~2단계로 이미 정리된 이름을 씁니다(`SameTextKey.firstAuthor` 338행, `BookGrouper.firstAuthor` 113행은 고치지 않음)
   - dry run 덤프(`DryRunDump.java` 48행)의 저자 칸도 같은 글이 되는지 봅니다 [안]
   - 의존: 2·4·5·6
   - 위험: 낮음
- 가져오기 통합 시험 (`CatalogImporterTests`에 작은 수집 사본 픽스처, `CatalogImporter` 끝까지, 기본 `compact`. 가능하면 세 방식 모두)
  - 꺾쇠 줄과 보통 줄 → 한 책(AC-1)
  - 「백만장자 마인드」 꼴: 보통 / 꺾쇠 / 「김근아 저자」(코드 같음) / 「(부를 끌어 당기는) …」 / 뒤바뀐 도서관 줄 → 한 책, 「부를 끌어 당기는 백만장자 마인드」 → 따로(AC-2)
  - `book.author_display`에 `<`·`>`·`〈`·`〉`·`「`·`」`·`《`·`》`가 없음, `[ ]`는 그대로(AC-4)
  - 「KBS 〈슈퍼차이나〉 제작팀」과 「KBS 슈퍼차이나 제작팀」 → 한 책(AC-5)
  - 「(만화) 삼국지」와 「삼국지」 → 따로(AC-6)
  - 뒤바뀐 도서관 줄 → 저자·출판사 바름(AC-9)
  - 붙은 역할만 있는 책 → 저자 칸이 띄어져 있음(AC-17)
- 확인: AC-1·2·4·5·6·9·17의 시험 부분

### 8단계: 수집기 `PUBLISHER_FIRST_PORTAL_HOSTS` (R3-1)

1. **상수와 `parse_portal`** (파일 `scripts/crawl/crawl_catalog.py`, `parse_portal` 692~720행, 713~714행에서 `info[0]` 저자·`info[1]` 출판사) [확정] (확인 결과 결정 #7, 설계 결정 #10)
   - 맨 위 "규칙" 묶음에 `PUBLISHER_FIRST_PORTAL_HOSTS = {"lib.goe.go.kr", "library.daegu.go.kr", "lib.jbe.go.kr"}`를 둡니다
   - `base` 호스트가 이 안에 있으면 `info[1]`을 저자, `info[0]`을 출판사로 읽습니다. 나머지 포털은 그대로입니다
   - 사람이 정한 값(`PAGE_SIZE_BY_HOST` 63행, `SHARED_HOSTS` 331행, `BLOCKED_HOST_SUFFIX` 60행, `DISABLED_IDS` 50행 등)을 파일 맨 위 "규칙" 묶음으로 모으고, 각 값에 규칙 목록 문서 줄을 가리키는 주석을 답니다 [확정: 방향 / 안: 범위] (ADR-0117). 값과 동작은 바꾸지 않습니다
   - **다시 수집하지 않습니다** (C6). 이 변경은 다음 수집부터 효과가 납니다
   - 의존: 0단계(다른 단계와 따로)
   - 위험: 낮음
- 시험: 새 `scripts/crawl/test_parse_portal.py` [안 이름] (`python -m unittest scripts/crawl/test_parse_portal.py`, 네트워크 없음)
  - 경기도교육청·대구·전북교육청 목록 쪽 저장 HTML 한 쪽씩 → 저자·출판사가 바름
  - 부산 저장 HTML → 지금과 같음(AC-10)
  - 저장 HTML이 없으면 C5·C6 예절로 한 쪽씩만 받아 `scripts/crawl/` 아래 시험 자료로 둡니다 [안]
  - `test_crawl_migrate.py`도 그대로 통과
- 확인: AC-10

### 9단계: 검증 스크립트 (R7, ADR-0115)

1. **`scripts/library/check_author_publisher_swap.py`** [확정: 스크립트 하나 / 안: 이름] (ADR-0115)
   - 입력: 수집 사본 경로
   - 출력: 전자도서관 포털 도서관마다 "바름 / 뒤바뀜 / 판단 못 함"과 줄 수
   - 방법은 research.md 실험 (d)입니다: 줄마다 저자 칸 이름이 다른 도서관에서 저자로 쓰이는 비율과 출판사로 쓰이는 비율을 견줍니다. 비율을 셀 때 전자도서관 포털 사이트는 뺍니다
   - 판정 문턱값은 dev가 정해 보고합니다 [안]
   - 수집 사본은 읽기 전용으로 엽니다
   - 의존: 0단계
   - 위험: 낮음
- 시험: 작은 SQLite로 단위 시험(`scripts/library/test_check_author_publisher_swap.py` [안]). 실제로 2026-10-12 사본에 돌려 수집 11·12·15는 "뒤바뀜", 부산(10) 등은 "바름"인지 봅니다(AC-19)
  - 실험 값 [확정: 2026-10-14 실험]
    - 전북교육청: 뒤바뀜 63,660 / 바름 1 / 판단 못 함 18,898
    - 경기도교육청: 27,251 / 5 / 11,397
    - 대구: 12,768 / 0 / 15,782
    - 부산: 바름 17,500 / 판단 못 함 3,826
  - 같은 값이 아니어도 판정이 같으면 됩니다
- 확인: AC-19

### 10단계: 사용 기록 캐시 답 수 (R5, 다른 단계와 따로)

1. **Liquibase** (새 파일 `backend/src/main/resources/db/changelog/usagelog/002-library-response-cached-count.yaml`, changeset id `usagelog-002-cached-count` [안], master 끝에 `# cycle 19: usage log cached answers (ADR-0116)` + include [안 문구]) [확정: 칸·제약] (C3)
   ```sql
   ALTER TABLE usagelog.library_response_daily
     ADD COLUMN cached_count integer NOT NULL DEFAULT 0
     CONSTRAINT library_response_daily_cached_count_check CHECK (cached_count >= 0);
   ```
   상수 기본값이라 표를 다시 쓰지 않습니다 [확정] (PostgreSQL 18 ALTER TABLE Notes, https://www.postgresql.org/docs/current/sql-altertable.html, 확인 2026-10-15)
2. **`ResponseResult.CACHED`** (파일 `backend/src/main/java/com/chaekcheck/usagelog/UsageLog.java` 58~62행) [확정] (설계 결정 #8). Javadoc 36행(`elapsedMs`는 OK에서만 씀)에 CACHED는 무시된다고 적습니다
3. **셈과 쓰기**
   - 셈: `usagelog/internal/buffer/UsageBuffer.java` 47·114행 `add(ResponseResult, long)`에서 `CACHED`면 캐시 답 수만 1 올립니다. 응답 시간·성공/실패 수는 그대로입니다
   - 쓰기: `usagelog/internal/write/UsageLogWriter.java` 61~68행 upsert에 `cached_count`(`d.cached_count + EXCLUDED.cached_count`)를 더합니다
4. **알리는 두 곳**
   - `availability/internal/search/BatchRunner.java` `answered` 334~338행: 지금은 `fromCache`면 바로 빠집니다. 앞으로는 `recordLibraryResponse(libraryId, source, CACHED, 0)`을 부르고, 로그 줄은 쓰지 않습니다. 330~333행 주석과 71행 클래스 주석도 고칩니다
   - `availability/internal/web/LibraryEbookController.java` 91~110행(`fetched.cached()` 96행): 같은 방식으로 `DIRECT_SEARCH` 줄에 `CACHED`를 알립니다
   - 꺼진 도서관 번호 처리는 다른 결과와 같습니다(design-delta 규칙 세부 R5)
   - 의존: 0단계
   - 위험: 낮음
- 시험
  - `UsageLogSchemaTests`: 칸·기본값·CHECK
  - `UsageLogBufferTests`·`UsageLogWriteTests`: CACHED는 `cached_count`만 늘고 `ok_count`·`ok_ms_total`·`ok_ms_max`는 그대로
  - `BatchRunnerTests`·`LibraryEbookControllerTests`: 캐시 경로에서 `CACHED` 한 번, 로그 줄 없음
  - `ModularityTests`: 의존 그대로(AC-15)
- 확인: AC-15 (내 PC에서 같은 도서관 검색을 3분 안에 두 번 한 뒤 DB 조회도 함)

### 11단계: 문서 (R6, R7)

1. **가져오기 메모리 안내와 도서관 수** [확정] (확인 결과 결정 #9)
   - `docs/maintenance/3-import.md` 32·34·177행과 `backend/build.gradle` 74행: `-PbootRunXmx=6g` → 기본 `compact`는 2GB(`-PbootRunXmx=2g`). 6GB는 `objects` 방식만 필요하다고 적습니다
   - `3-import.md` 41행과 `I/CatalogImportRunner.java` 69행(Javadoc)·101~102행(오류 문구): "약 2,394곳" → 2,370 (가져오기 기록 11번, dev `plan-feedback.md` 4073행)
   - 58행 같은 지난 측정 표의 숫자는 기록이므로 고치지 않습니다
2. **`docs/library-maintenance.md` 6-2 "꺼 둔 도서관" 표** (554행 아래): 사이클 07에서 끈 135 전라북도교육청통합도서관, 2194 장안대학교 (YES24), 2198 성균관대학교 (YES24) 세 줄을 더합니다 [확정] (18 회고 결정 #14)
   - 끈 날·이유 원문은 사이클 07 기록(`library-site-issues.md`, 끄기 changeset 주석)에서 옮깁니다. 못 찾으면 "확인 필요"로 두고 보고합니다
3. **규칙 목록 문서** (새 파일 `docs/maintenance/rules-index.md` [안: 이름]) [확정: 문서 하나와 칸] (ADR-0117)
   - 규칙마다 한 줄씩, 칸은 "어디에(파일·상수) / 뜻 / 데이터로 확인하는 법(가능하면 스크립트) / 바꾸는 법과 그 뒤 할 일(다시 수집 또는 다시 가져오기)"입니다
   - 이번 사이클 규칙
     - `Contributors`의 기호 떼기, 좁은 규칙의 역할 낱말, 보호 장치
     - `SameTextKey.LEADING_NOTE_KEEP_WORDS`와 "…판"·EDITION 규칙, `EDITION_WORDS`
     - `supplier_families.tsv`, `author_publisher_swapped.tsv`(확인하는 법: `check_author_publisher_swap.py`)
     - `PUBLISHER_FIRST_PORTAL_HOSTS`(확인하는 법: 포털 새 책 목록 한 쪽을 열어 칸 순서 확인)
   - 이미 있는 규칙도 옮겨 적습니다
     - `scripts/library/rules/` README 표의 파일들
     - 수집기 맨 위 상수들
     - 가져오기 상수(`SameTextKey` `PLACEHOLDER_AUTHORS`·`PLACEHOLDER_PUBLISHERS`·`TAILS`, `BookGrouper.SHARED_CODE_KINDS`, `HoldingRowFilter`의 종류 목록)
     - `placeholder-date-libraries`
   - 코드 상수마다 이 문서의 줄을 가리키는 주석을 답니다
4. **시작 점검 한 줄씩** [확정] (설계 결정 #10, ADR-0117)
   - `docs/maintenance/2-crawl.md`(0절 읽는 순서 아래 또는 수집 전 점검 목록): "수집 전 `rules-index.md` 확인. 통합 포털 새 책 목록 한 쪽을 열어 `div.info` 칸 순서가 `PUBLISHER_FIRST_PORTAL_HOSTS`와 맞는지 확인"
   - `docs/maintenance/platforms.md` 5절 101행: "`div.info span`(저자, 출판사, 출간일)"을 "칸 순서가 사이트마다 다름. 출판사가 먼저인 포털 = 경기도교육청·대구·전북교육청(`PUBLISHER_FIRST_PORTAL_HOSTS`)"으로 고칩니다
   - `docs/maintenance/3-import.md`
     - 준비(2절)에 "`rules-index.md` 확인, `rules-dir` 두 파일"
     - 12절 표 아래에 "저자 정리(`Contributors`)를 고치면 세 번째 줄(검색어 다듬기 규칙)"
     - C9 절차: `swap_before` 뒤 사본에서 멈추면 → 검증 스크립트 → "바름"이면 줄 지우고 다시 가져오기, 아니면 사용자에게 물음
5. 의존: 4~9 (규칙 이름이 정해진 뒤)
- 위험: 낮음
- 확인: AC-16, AC-18

### 12단계: 미리 돌려 보기와 비교 (R4-2, AC-12)

1. **dry run** (2026-10-12 사본, 기록 11번과 같은 도서관 목록, 기본 `compact`, `-PbootRunXmx=2g`, `dry-run-output` 폴더 지정)
   - 멈춤 없이 끝나는지 봅니다(`rules-dir` 읽음, `swap_before` 앞 사본이라 멈추지 않아야 함)
   - 로그·셈을 적습니다: `supplierCodeJoins`, `codeJoinedIsbnConflicts`, `authorPublisherSwappedRows`, `leadingNoteCut`, 국가서지 ISBN 붙음 수(전후)
   - [안] 같은 사본으로 시작 커밋 코드의 dry run도 한 번 돌려 기록 11번과 같은지 봅니다(규칙 영향만 떼어 보려는 것)
2. **`compare_grouping.py regroup`** (`3-import.md` 39~40행): A = 0단계 3의 기록 11번 `ids`, B = 1의 dry run 폴더
   - 책 수, 합쳐짐·나뉨 수를 적습니다
   - **원인별 합쳐짐 무작위 표본 각 20권**을 뽑습니다: 꺾쇠 / 다른 괄호 / 붙은 역할 / 제목 앞 괄호 / 상품 코드 / 뒤바뀐 칸 [확정] (확인 결과 결정 #8)
     - 원인은 합쳐진 줄들의 원문 차이로 가릅니다
     - 나눌 방법(스크립트에 선택지를 더하거나 일회용 스크립트)은 dev가 정합니다 [안]
   - 나뉨 표본도 20권 봅니다
   - 표본마다 같은 책인지 사람이 판단합니다. 애매하면 C5 방식으로 사이트 한 건을 엽니다
   - 「백만장자 마인드」(율리시즈) 줄 수 전후를 적습니다
   - 남길 낱말 목록에 빠진 낱말이 보이면 4단계로 돌아가 더하고 다시 돌립니다
3. **공급사 묶음 목록 보고**: `supplier_families.tsv` 최종 내용과 만든 방법을 `# 사이클 19` 절에 적습니다
4. **멈출 조건 판정** (C4): 걸리면 여기서 멈추고 보고합니다. 걸리지 않으면 13단계로 갑니다
- 확인: AC-12. 숫자는 AC-1·2·5·6의 실제 데이터 근거가 됩니다
- 위험: 중간 (판단에 시간이 듦)

### 13단계: main에 합치기, 다시 가져오기, 운영 역할 반영, 다시 켜기 (R4-1, R4-3, R4-4)

0. **합치기**: 19 브랜치를 main에 합칩니다. 21이 먼저 들어갔으면 rebase해서 충돌을 풉니다(C10, master 끝줄 C3)
   - 합친 직후 `# 사이클 19` 절에 적고 사용자에게 알립니다. plan 21·dev 21이 알아야 합니다(아래 "plan 쪽에 알려줄 것")
   - 10-17까지 21이 main에 있으면 둘 다 든 main으로, 없으면 19만 든 main으로 합니다 [확정] (맨 위 일정)
1. **내 PC 내보내기** (`export`, `3-import.md` 13-2절 1)
   - 합친 main 판, 원래 DB(5432), 2026-10-12 사본, `-PbootRunXmx=2g`로 돌립니다
   - ADR-0069 "검색어 다듬기 규칙" 줄이므로 **옛 서비스를 켜 둔 채** 돌립니다(내보내기 안에서 `prepare`가 `catalog_next`를 채움)
   - 사이클 18의 `library/016` 끄기 파일이 든 판인지 봅니다(13절 162행)
2. **운영 역할 반영** (`apply`, 13-2절 3)
   - 운영 역할 DB(`db-ops` 5434, 또는 그때의 운영 역할 DB)에 같은 판으로 돌립니다
   - `mismatch`면 아무것도 바뀌지 않습니다. `failure_detail`을 보고 맞춥니다(13-3절)
   - 반영 중에는 운영 역할 서비스에 `probe_during_import.py`를 돌립니다(`CHAEKCHECK_BASE=http://localhost:8081 CHAEKCHECK_DB_SERVICE=db-ops`, 사이클 11 방법) [확정] (사용자 승인, 2026-10-16, 인계서 검토 #3). 반영 중 5xx 0을 확인합니다(AC-13)
3. **운영 역할 서비스를 바로 새 코드로 다시 켭니다** [확정] (ADR-0069, 설계 결정 #11)
   - 바꿔 끼운 뒤 다시 켜기 전의 짧은 틈에는 기호를 넣은 저자 검색어만 잠깐 못 찾습니다. 이 틈은 받아들입니다
   - 다시 켜는 동안의 연결 오류는 AC-13의 5xx와 따로 적습니다 [안]
4. **내 PC 마저 바꿔 끼우기** (`finish`, 13-2절 4). 그다음 내 PC 서비스도 새 코드로 다시 켭니다
5. **반영 뒤 확인** (운영 역할 서비스와 내 PC, 아래 AC 표)
   - AC-1·2·5·6: 검색 결과 한 줄 여부
   - AC-3·7·9: 저자 검색
   - AC-4·17: 책 상세 저자 칸
   - AC-11: `SELECT count(*) FROM catalog.holding WHERE library_id = 2624` = 241
   - AC-14: 사서추천·이동진 추천도서·서울대 100선 맞춘 수. 줄었으면 원인을 적습니다(21의 `BookChoice` 보유량 규칙이 들어갔으면 그 규칙 기준)
   - scope 조사 2·3의 전후 값
   - 측정 시간(내보내기, 반영)
- 위험: 중간 (판이 다르면 `mismatch`로 멈춤. 다시 켜기 전 짧은 틈)

## 테스트

- **단위**
  - `ContributorsTests`(`stripMarks`, `parse` 좁은 규칙·보호 장치·셋째 역할, `displayText`)
  - `SameTextKeyTests`(앞 괄호, 남길 낱말, "…판"·EDITION)
  - `ImportRulesTests`(파일, `swap_before`, 공급사 이름 다듬기)
  - `CatalogImportSettingsTests`(`rules-dir`)
  - `UsageLogBufferTests`
  - 수집기 `test_parse_portal.py`, 검증 스크립트 단위 시험
- **통합(`db-test`, 모듈 시험)**
  - `BookGrouperContractTests`: 세 방식 같은 결과 + 공급사 코드 경우
  - `CompactGroupingTests`·`SqlGroupingTests` 회귀
  - `CatalogImporterTests`: 작은 수집 사본 끝까지
  - `BookSearchTests`: 검색어 정리, 옮긴이
  - `UsageLogSchemaTests`·`UsageLogWriteTests`
  - `BatchRunnerTests`·`LibraryEbookControllerTests`: 캐시 경로
  - `ModularityTests`(`ApplicationModules.of(ChaekcheckApplication.class).verify()`, 모듈 의존 그대로)
  - `DocumentationTests`(Documenter 출력)
  - 기존 시험 전부
- **데이터**: 12단계 dry run과 `regroup` 원인별 표본, 13단계 반영 뒤 검색·SQL, AC-14 측정, 검증 스크립트 실행
- **화면**: 구성은 바뀌지 않습니다
  - Playwright 데스크톱 1280에서 S1 결과 카드와 S3 책 페이지 저자 칸(꺾쇠 표기였던 책, 붙은 역할 책)을 한 번 봅니다 [안]
  - 폰 화면 구성도 바뀌지 않아 사용자 실제 폰 확인 대상이 아닙니다(아래 완료 기준)

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 꺾쇠·보통 표기 책 한 줄(「채널 전쟁」·「다재다능 코틀린 프로그래밍」) | 가져오기 통합 시험 + 반영 뒤 제목 검색 | 7, 13 |
| AC-2 「백만장자 마인드」 모임(꺾쇠·김근아·앞 괄호·대구·경기 줄), 괄호 없는 수식어 줄은 따로 | 계약 시험(공급사 코드) + 통합 시험 + 12단계 줄 수 전후 + 반영 뒤 검색 | 6, 7, 12, 13 |
| AC-3 "김정은" 단어·정확히 일치 검색 | `ContributorsTests` + `BookSearchTests` + 반영 뒤 검색 | 1, 3, 13 |
| AC-4 상세 저자 칸에 꺾쇠·다른 괄호 없음, `[ ]` 그대로 | `ContributorsTests` + 통합 시험 + 반영 뒤 상세 | 1, 7, 13 |
| AC-5 「슈퍼차이나」 한 줄 | `ContributorsTests` + 통합 시험 + 반영 뒤 검색 | 1, 7, 13 |
| AC-6 (만화)·(개정판)·(속)은 따로 | `SameTextKeyTests` + 통합 시험 + 12단계 표본 | 4, 7, 12 |
| AC-7 "루이스 캐럴", 옮긴이 "이소연", 「마키타 겐지 …」 세 줄 | `ContributorsTests` + `BookSearchTests` + 반영 뒤 검색 | 2, 3, 13 |
| AC-8 보호 장치 외국 이름 | `ContributorsTests` + 12단계 붙은 역할 표본 | 2, 12 |
| AC-9 세 도서관 저자·출판사 바름, "율리시즈" 저자 검색에 안 나옴 | 가져오기 시험 + 통합 시험 + 반영 뒤 검색 | 5, 7, 13 |
| AC-10 수집기 세 포털 바름, 부산 그대로 | `test_parse_portal.py` | 8 |
| AC-11 2624 소장 241권 | 반영 뒤 SQL(원래 DB) | 13 |
| AC-12 원인별 표본 20권, 잘못 합침 수 | 12단계 비교 보고 | 12 |
| AC-13 반영 중 5xx 0 | `probe_during_import.py` | 13 |
| AC-14 사서추천·이동진·서울대 100선 맞춘 수 | 0단계 기준 + 반영 뒤 측정 | 0, 13 |
| AC-15 캐시 답 수 | usagelog·availability 시험 + 내 PC DB 조회 | 10 |
| AC-16 dev 문서 R6 | 파일 확인 | 11 |
| AC-17 붙은 역할 책 저자 칸 띄움, 보호 장치 표기 그대로 | `ContributorsTests` + 통합 시험 + 반영 뒤 상세 | 2, 7, 13 |
| AC-18 규칙 목록 문서·상수 주석·시작 점검 | 파일 확인 | 8, 11 |
| AC-19 검증 스크립트 판정 | 2026-10-12 사본으로 실행 | 9 |

## 완료 기준

- [ ] AC-1~AC-19를 위 표의 단계에서 확인하고 AC 확인표를 `# 사이클 19` 절에 적습니다
- [ ] 단계마다 `backend/`의 `./gradlew build` 통과(`ModularityTests`·`DocumentationTests` 포함). 수집기·스크립트 시험 통과
- [ ] 세 묶는 방식이 같은 결과(계약 시험 통과)
- [ ] 12단계 멈출 조건(C4)에 걸리지 않았거나, 걸렸으면 plan에 보고하고 진짜 반영을 하지 않았습니다
- [ ] 다시 가져오기가 `compact` 2GB 안에서 끝났습니다(넘쳤으면 보고)
- [ ] 운영 역할 DB 반영 성공, 운영 역할 서비스와 내 PC 서비스를 새 코드로 다시 켰습니다(ADR-0069)
- [ ] 현대제철(2624) 소장 241권이 다시 가져온 원래 DB에 있습니다 [확정] (18 회고 결정 #13)
- [ ] `usagelog/001`을 포함해 기존 changeset을 고치지 않았습니다(C3)
- [ ] 규칙 파일 두 개, README 두 줄, `rules-index.md`, 상수 주석, 시작 점검 줄, 검증 스크립트가 있습니다
- [ ] `library-maintenance.md` 6-2 세 줄, `3-import.md`·`build.gradle`·`CatalogImportRunner` 문구, Documenter 출력 확인
- [ ] 이 사이클은 폰 화면을 더하거나 바꾸지 않으므로 사용자 실제 폰(Samsung Internet, `web-lan-5174`) 확인 대상이 아닙니다 [확정] (flow.md "데스크톱·태블릿·폰 배치: 지금 그대로")
- [ ] [확인 필요] 결과, 설계와 달라진 점, 새로 알게 된 제약을 `# 사이클 19` 절에 적습니다

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 결과에 따라 | 막는 단계 |
|---|---|---|---|
| 공급사 묶음 목록 내용 | 수집 DB의 `holding.supplier` 이름 전체를 보고 만들어 보고 | 파일 내용. 「Y2Books 전자책」 = 「와이투북스」는 반드시 | 12 (반영 전) |
| `KYOBO_SUBSCRIPTION_V1`의 `item_key`가 교보 상품 번호와 같은 번호 공간인지, 코드 다듬기(공백·앞의 0) | 수집 DB 조회, research SQL 2 | 코드 키에 넣을지, 다듬기 방법 | 6 |
| 같은 공급사 안에서 코드가 다른 책을 가리키는 경우 | 12단계 상품 코드 표본, `codeJoinedIsbnConflicts` | 0이 아니면 멈추고 plan에 물음 | 13 |
| 세 도서관(수집 11·12·15)의 서비스 도서관 번호 | `collection.collection_link` | 보고, 시험·검색 확인에 씀 | 없음 |
| `swap_before` 날짜, 판정 기준(도서관 수집 시각) | 8단계 수집기를 main에 합친 날 | 파일 값 | 13 |
| 검증 스크립트 판정 문턱값 | 2026-10-12 사본 실행, 실험 (d) 값과 견줌 | 문턱값 | 9 |
| 서비스 `book_contributor`의 꺾쇠 든 이름 수, 검색 탐침 전후 | 0단계·13단계 SQL과 검색 | 보고만 | 없음 |
| 남길 괄호 낱말 목록에 빠진 낱말 | 12단계 앞 괄호 표본 | 상수에 더하고 다시 dry run | 12 |
| 다시 가져오기·반영 시간 (참고: 사이클 11 `compact` 내보내기 약 21~22분, 반영 4분 35초) | 13단계에서 잼 | 공개일 일정(늦으면 공개일을 19 반영 다음 날로) | 일정 |
| 21이 10-17까지 main에 들어오는지 | 13단계 직전 main 확인 | 들어왔으면 둘 다, 아니면 19만 반영 [확정] | 13 |
| 135·2194·2198의 끈 날·이유 원문 | 사이클 07 기록 | 6-2 표 줄 | 11 |
| 수집기 시험용 저장 HTML이 있는지 | `scripts/crawl/`·데이터 폴더 확인, 없으면 한 쪽씩 받음(C5·C6) | 시험 자료 | 8 |

## 이번에 하지 않는 것

- 다시 수집(`scripts/crawl/` 실행). 다음 수집부터 고친 수집기로 받습니다 [확정] (R3-2)
- `author_publisher_swapped.tsv` 줄 지우기. 고친 수집기로 새로 받은 사본을 가져올 때 C9 절차로 합니다
- 화면 모양·API 모양 바꾸기 [확정] (scope 제외)
- 저자 칸의 `[ ]` 처리 [확정] (확인 결과 결정 #2)
- 괄호 없이 수식어를 본제목 앞에 붙인 제목(「부를 끌어 당기는 백만장자 마인드」) 모으기 (backlog)
- 판 표시·ISBN 없는 다른 판 나누기 (backlog)
- 도서관 사이트 직접 찾기의 「김달 저」 문제 (`availability`, 확인 결과 결정 #6)
- 저자 칸 오류를 사람이 하나씩 고치는 바로잡기 목록 (상품 코드 규칙으로 대신, research (a))
- `CatalogText.mainTitleNorm`·`norm` 바꾸기, 제목 앞 `<…>` 시리즈 처리(`CatalogText` 20행 `LEADING_SERIES`) [안]
- 「묘왕동주」 (설계대로, ADR-0053)
- 설정 이름 `exclude-candidate-libraries` 바꾸기 (사이클 18 B에서 끝남)
- 사이클 18 C 운영 반영 (backlog. 19 운영 반영과 함께 끝날 수 있음)
- plan `docs/current/` 고치기 (plan이 `/cycle-close`에서 함)

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 19`** 절에 **무엇이 달라졌는지와 이유**를 적습니다(사용자 발언은 그대로).

- **시작 상태**: 작업 폴더·브랜치·docker 프로젝트·포트, 시작 커밋, 기준 빌드 결과, 기록 11번 확인, 0단계 기준값(scope 조사 1·2·3, research SQL 2·3·5·6, AC-14 기준 세 목록), Documenter 출력 확인 결과
- **바꾼 이름**: `stripMarks`·`displayText`·`ImportRules`·`rules-dir`·`supplierCodeKey`·`LEADING_NOTE_KEEP_WORDS`·`ImportReport` 셈·changeset id·규칙 파일 칸·`rules-index.md`·검증 스크립트의 실제 이름
- **규칙 내용**
  - `supplier_families.tsv` 최종 내용과 만든 방법
  - 남길 괄호 낱말에 더한 낱말
  - 코드 다듬기 방법, `KYOBO_SUBSCRIPTION_V1` 결론
  - `swap_before` 날짜와 판정 기준, 검증 스크립트 문턱값
- **세 묶는 방식**: 코드 키를 넣은 방법, 계약 시험 결과
- **12단계 비교 보고**
  - 책 수 전후, 합쳐짐·나뉨 수
  - 원인별 표본 20권과 잘못 합침 수·예
  - `supplierCodeJoins`·`codeJoinedIsbnConflicts`·`authorPublisherSwappedRows`·`leadingNoteCut`, 국가서지 ISBN 붙음 전후
  - 「백만장자 마인드」 줄 수 전후, 2GB 안에서 끝났는지
- **13단계**: 합친 날·판(21 포함 여부), 내보내기·반영 시간, `apply` 결과, 반영 중 5xx 수, 다시 켠 시각, AC-11 수, **AC-14 세 목록 맞춘 수(줄었으면 원인)**
- **세 도서관의 서비스 도서관 번호**, 수집기 시험 자료를 어떻게 얻었는지
- **6-2 세 줄**의 원문 출처, R6 문서 고친 곳
- **알림**
  - **19가 main에 들어가면 바로**: `# 사이클 19` 절에 적고 사용자에게 알립니다. plan 21·dev 21 세션에 전달합니다(가져오기·`catalog.normalize`·export 파일이 겹치고, 나중에 들어가는 쪽이 rebase함. 다시 가져오기·반영을 한 번에 할지)
  - **plan 17 일정**: 19 반영이 끝난 날짜를 알립니다. 10-17 안에 끝나지 않을 것 같으면 그 즉시 알립니다. 공개일(2026-10-18)이 19 반영 다음 날로 밀리면 17이 맞춘 날짜(공지, 약관 시행일, 사용 기록 켜는 날)도 옮겨야 합니다
- [확인 필요] 표 각 행의 결과, 설계와 달라진 점, 새로 알게 된 제약, AC 확인표
