# 개발 인계서: 사이클 12 책 묶기 기준 다시 보기 (grouping-rules)

> **먼저 읽을 것 (미리 쓴 인계서)**
> - 이 인계서는 **사이클 11 dev(11단계: `current`·`compact`·`sql` 실데이터 측정)가 아직 dev 기본 작업 폴더에서 돌고 있을 때 미리 썼습니다.**
> - 사이클 12 dev는 **따로 만든 git worktree와 브랜치에서만** 작업합니다 (사용자: "지금 dev 11 작업중인데 따로 워크트리따서하라고 지시"). 사이클 11 작업 폴더(`chaekcheck-dev`)의 파일, 브랜치, 커밋하지 않은 변경은 건드리지 않습니다.
> - 측정이 도는 동안에는 같은 PC나 같은 DB에서 실데이터 dry run, 가져오기, 내보내기 같은 무거운 일을 하지 않습니다. `docker compose up/down/build/restart`도 하지 않습니다. worktree에서도 compose 프로젝트 이름이 `chaekcheck`로 같아서, 측정 중인 컨테이너를 그대로 건드리게 됩니다.
> - **`current`(`BookGrouping`)는 사이클 11 측정 결과와 기본 묶는 방식이 정해지기 전에는 지우지 않습니다.** ADR-0079 덧붙임의 조건 때문입니다. `compact`와 `sql`이 둘 다 결과 비교를 통과하지 못하면 `current`를 남기고 새 규칙을 `current`에도 넣습니다.
> - 이 인계서는 plan의 사이클 폴더에만 있습니다: `chaekcheck-plan/docs/cycles/12-grouping-rules/handoff.md` [확정] (사용자: "Handoff 사이클에 속하도록 해주고", 2026-10-12). dev `CLAUDE.md`가 불러오는 plan `docs/current/handoff.md`는 당분간 **사이클 11 그대로**입니다. 사이클 12 dev 세션은 이 파일을 직접 열어서 따릅니다.
> - dev가 plan에 남기는 글은 dev `docs/plan-feedback.md`의 **새 `# 사이클 12` 절**에 씁니다. `# 사이클 11` 절과 섞지 않고, `# 사이클 11` 뒤에 둡니다. rebase할 때 파일 끝에서 충돌이 나면 두 절을 다 남깁니다.
> - 표, Liquibase, REST, 웹, 이벤트, 모듈 관계는 바뀌지 않습니다. 아래 클래스, 메서드, 설정, 카운터 이름은 모두 [안]입니다. dev는 코드에 맞게 바꿔도 되고, 바꾸면 `# 사이클 12`에 적습니다.

## 요약
가져오기의 네 번째 묶기 단계(같은 글자)를 바꿉니다. 비교 기준은 "비교 제목(본제목에서 목록에 든 이용 안내 꼬리를 뗀 것) + 권 표시 + 첫 저자 + 출판사"입니다. 같은 키 안에서 서로 다른 ISBN이 둘 이상이면 판마다 나누고, "기타" 같은 자리 채움 값은 값이 없는 것으로 봅니다(ADR-0082). 새 규칙은 `collection` 안의 `SameTextKey` 하나에 두고 `compact`와 `sql`이 같은 함수를 부릅니다. 비교 도구(`compare_grouping.py regroup`, dry run 전용 "사이클 07 도서관 빼기")로 합쳐진 책과 나뉜 책, 번호 잇기를 확인합니다. Phase A(지금, worktree)는 코드, 테스트, 도구만 만듭니다. Phase B(사이클 11 측정과 병합 뒤)에서 실데이터 확인, 가져오기, `current` 정리를 합니다.

## 참고 문서
- plan: `docs/cycles/12-grouping-rules/scope.md`, `spec.md`(R1~R8, AC-1~AC-8), `flow.md`(화면 변경 없음), `design-delta.md`(세부 결정 표, 꼬리 목록 절차, 테스트 목록), `architect-proposal.md`(배경)
- ADR-0082(네 번째 단계 새 규칙), ADR-0079와 그 덧붙임(묶는 방식 셋, `current` 지우기 조건), ADR-0062(번호 잇기, 바꾸지 않음), ADR-0069(묶기 규칙만 바꾸면 가져오기 → 바꿔 끼우기, 서비스는 다시 켜지 않음)
- 근거 조사: `docs/research/ebook-catalog/same-book-isbn.md` 5.4~5.6절
- dev: `CLAUDE.md`, `docs/maintenance/3-import.md`(3·12·13절), `docs/plan-feedback.md` `# 사이클 11`(B: `BookGrouper` 모양, 측정 상태)

## 개발 시작 전 확인
- [x] Gradle group ID와 base package: `com.chaekcheck` [확정] (dev `CLAUDE.md`, `backend/build.gradle`)
- [ ] worktree의 시작 커밋: 사이클 11 중간 전달 커밋(`e3cfea4` 등, dev `plan-feedback.md` "지금 상태")에서 시작할지, 사이클 11 브랜치의 최신 커밋에서 시작할지 [확인 필요: 사용자에게 질문]
- [ ] worktree 폴더와 브랜치 이름. 예: `../chaekcheck-dev-c12`, 브랜치 `cycle-12-grouping-rules` [안]
- [ ] worktree에는 git이 무시하는 `.env`와 `data/`가 없습니다. 테스트(`db-test`)에 필요한 설정을 어떻게 줄지 정해야 합니다 [확인 필요: 사용자에게 질문]. 비밀 값은 인계서나 커밋에 적지 않습니다
- [ ] 측정 중에 돌려도 되는 테스트의 범위와 때 [확인 필요: 사용자에게 질문]. 제안 [안]:
  - DB를 쓰지 않는 단위 테스트(`--tests` 로 클래스 지정)는 측정 라운드 사이에만 돌립니다
  - `./gradlew build` 전체와 `SqlGroupingTests`(`@SpringBootTest`, `db-test`)는 측정 라운드가 돌지 않을 때만, 사용자에게 알린 뒤 돌립니다
- [ ] (Phase B 시작 전) 사이클 11 측정 결과, 사용자가 고른 기본 묶는 방식(R-B7), 사이클 11 병합 커밋
- [ ] (Phase B) 실데이터 사본: 기준 숫자를 만든 사본 `ebook-catalog-2026-10-12-0135.sqlite`를 그대로 쓸지 [안]. 같은 사본이어야 규칙 변경의 효과만 보입니다 [확인 필요: 사용자에게 질문]

## 구현 단계

### Phase A: 지금, 별도 worktree (실데이터 실행 없음)

#### 1단계: worktree 준비
1. **worktree와 브랜치 만들기** (dev 저장소)
   - 할 일: 위에서 정한 시작 커밋으로 `git worktree add`. 사이클 11 작업 폴더의 브랜치를 checkout하거나 바꾸지 않습니다. `docs/plan-feedback.md` 끝에 `# 사이클 12` 절을 만들고, 시작 시각, 시작 커밋, "미리 쓴 인계서" 조건을 적습니다
   - 이유: 측정 중인 코드와 파일을 건드리지 않기 위해서입니다 (spec R8-3)
   - 의존: 없음
   - 위험: 중간. 같은 compose 프로젝트, 같은 Gradle 데몬, 같은 디스크를 씁니다. compose 명령 금지와 테스트 시점 규칙을 지킵니다

#### 2단계: `SameTextKey` (새 규칙 함수, 묶는 방식과 무관)
1. **`SameTextKey` 새 클래스** (파일: `backend/src/main/java/com/chaekcheck/collection/internal/importer/SameTextKey.java`, 패키지 내부)
   - 할 일: `BookGrouper`에 `static String sameTextKey(String title, String authorRaw, String publisherRaw)`를 더하고(결정 1), 이 함수가 `SameTextKey`를 부릅니다. `BookGrouper.key`와 `firstAuthor`는 ③(`NationalBibliography.keyOf` 188~191행)이 같이 쓰므로 **그대로** 둡니다
     - 키 = 비교 제목 + 권 표시 + 첫 저자 + 출판사, 구분자는 `BookGrouper.SEP`. 하나라도 없으면 `null`(합치지 않음)
     - 비교 제목: `CatalogText.mainTitleNorm(title)`에서 끝에 붙은 꼬리 목록(R3-3) 항목을 뗀 것. 목록은 정리한 글자로 비교합니다(`CatalogText.norm`). 다 떼어 비면 떼기 전 값을 씁니다
     - 권 표시(`VolumeMarks`): 전체 제목을 NFKC로 바꾸고, 앞 시리즈 표시(`[…]`·`〈…〉`·`<…>`)와 꼬리 목록 항목을 뗀 뒤 뽑습니다
       - 숫자 목록: 순서대로, 정수로 비교("01" = "1"). 긴 숫자도 앞의 0만 떼어 문자열로 둡니다
       - 상·중·하·上·中·下: 괄호 안, 공백·`-`·`.` 뒤, 끝이나 "권" 앞에 있을 때만 셉니다. "하늘"처럼 낱말 안의 글자는 아닙니다
       - 판 표시 낱말 집합: 개정, 증보, 전면개정, 특별판, 기념판, 리커버, 완결, 외전, 합본, 세트, 시즌. **긴 낱말부터** 찾고 찾은 자리는 다시 쓰지 않습니다("전면개정"이 "개정"으로 한 번 더 잡히지 않게)
       - 정규화 예: `n=1,2018|s=상|e=개정,기념판`
     - 첫 저자: `Contributors.parse(authorRaw)`에서 AUTHOR·UNKNOWN 역할 가운데 `nameExact`가 비어 있지 않고 자리 채움("기타", "unknown")이 아닌 첫 사람입니다(세부 8, R2-4). EDITOR("편", "엮음", "편저", "엮은이")는 쓰지 않습니다(R4-2)
     - 출판사: `CatalogText.publisherNorm` 결과가 "기타"·"미상"·"unknown"이면 `null`입니다. "."는 지금도 `null`입니다
     - 그대로 글자로 보는 값: 저자 "작자미상"·"작자 미상"·"작가미상"·"미상", 저자·출판사 "편집부", 출판사 "북큐브" (R2-2)
     - 목록(자리 채움 값, 판 표시 낱말, 꼬리)은 코드 상수로 둡니다. **꼬리 목록은 Phase A에서 빈 목록**으로 두고 `TODO [확인 필요: Phase B 데이터 절차 → 사용자 확정]`를 답니다. 시험은 꼬리 목록을 받는 패키지 내부 생성자로 합니다
     - R2 카운터용으로 "자리 채움 값 때문에 키가 없어졌는지"를 알 수 있게 합니다. 예: 결과 record `(key, placeholderOnly)` 같은 모양 [안]
     - NFKC는 `java.text.Normalizer`를 직접 씁니다. `CatalogText.nfkc`는 패키지 내부라서 쓰지 않고, `catalog` 공개 API도 늘리지 않습니다(ADR-0082)
     - 참고: NFKC는 로마 숫자 `Ⅱ`(U+2161)를 `II`로 바꿉니다. 로마 숫자를 권 표시에 넣을지는 Phase B 질문입니다(세부 9). Phase A에서는 넣지 않습니다
   - 이유: spec R1~R4, ADR-0082 결정 1·3
   - 의존: 1단계
   - 위험: 중간. 정규식 경계(상·중·하, 숫자)를 틀리면 다른 책이 합쳐집니다

2. **`SameTextKeyTests`** (파일: `backend/src/test/java/com/chaekcheck/collection/internal/importer/SameTextKeyTests.java`)
   - 할 일: design-delta 테스트 목록 그대로
     - R3-4 예 여섯
     - 「[100분 고전 013] 논어」 = 「논어」
     - "전면개정"과 "개정" 구별, "01" = "1"
     - R2 목록(대소문자·공백 무시). "작자미상", "편집부", 출판사 "북큐브"는 글자 그대로
     - 첫 저자 "기타" → 다음 저자
     - 시험용 꼬리 목록(예 "(PC만 열람 가능)")으로 비교 제목과 권 표시에서 뗌
     - "편"만 있으면 키 없음, "."만 있으면 키 없음
   - 의존: 2-1
   - 위험: 낮음

#### 3단계: `compact`에 버킷 나누기
1. **`CompactGrouping.mergeSameText`·`textKey` 바꾸기** (파일: `.../importer/CompactGrouping.java`)
   - 할 일(결정 2, 세부 7)
     - `textKey`가 `BookGrouper.sameTextKey(...)`를 부릅니다(묶음의 대표 원문 제목, 저자, 출판사)
     - **두 번 훑습니다.** 1회차: 묶음마다 키 번호(`KeyTable`), 키마다 **④ 시작 때의** ISBN(`isbnOf[root]`)의 첫 값과 "서로 다른 ISBN 둘 이상" 표시
     - 2회차: 키의 ISBN이 0~1개면 키의 첫 묶음과 합칩니다. 2개 이상이면 ISBN 있는 묶음은 그대로 두고, ISBN 없는 묶음끼리 키마다 첫 "ISBN 없는 묶음"에 합칩니다
     - ②·③ 뒤에는 같은 ISBN을 가진 묶음이 하나뿐이어서 "key + ISBN" 합치기가 이렇게 줄어듭니다. 이 불변식을 `assert`나 검사로 확인합니다
     - 합치기는 지금처럼 작은 유닛 번호가 뿌리가 됩니다
   - "출판일 2년 넘게 차이" 세기와 표본(결정 5)
     - 합친 책(mergeKey) 단위로 셉니다
     - 표본 순서는 "합친 책의 첫 묶음(뿌리 유닛 번호) 오름차순", 최대 40개
     - `MapShape`, `wideDateSampleOrder`의 `HashMap` 다시 계산, 생성자 인자 `replaySampleOrder`를 지웁니다
   - 이유: spec R1·R1-3, ADR-0082
   - 의존: 2단계
   - 위험: 중간. 메모리 증가는 계산상 묶음당 약 4바이트, 키당 약 9바이트입니다 [확인 필요: dev 측정, Phase B]

#### 4단계: `sql`에 같은 규칙
1. **`SqlGrouping.mergeSameText` 바꾸기** (파일: `.../importer/SqlGrouping.java`)
   - 할 일
     - Java가 `BookGrouper.sameTextKey`로 키를 만들어 `grp_text(label, key, h, d)`에 COPY합니다(지금처럼)
     - SQL에서 `grp_gisbn`을 label로 붙여(④ 시작 때 ISBN) `count(DISTINCT isbn) GROUP BY key`를 구합니다
     - `mergeKey` = (ISBN 수 ≤ 1) ? key : key ‖ SEP ‖ coalesce(isbn, '')
     - `min(label) GROUP BY mergeKey`로 간선을 만들고 지금의 `join(...)`(반복 상한 그대로)을 씁니다
     - `sameTextMerged` = `count(*) - count(DISTINCT mergeKey)`
     - 출판일 2년 차이는 mergeKey 단위로 셉니다. 표본은 `first` 오름차순 최대 40개입니다. `hashMapOrder`, `WideKey`의 해시 순서, `h` 칸, `lastIsNew` 계산을 지웁니다(결정 5)
   - 이유: 두 방식이 같은 결과를 내야 합니다 (R8-2, ADR-0079)
   - 의존: 2단계(3단계와 나란히 해도 됨)
   - 위험: 중간. `COLLATE "C"`와 구분자 `\u0001`이 COPY와 GROUP BY에서 그대로인지 시험으로 확인합니다

#### 5단계: 보고 카운터 (로그 전용)
1. **`ImportReport`에 카운터 둘** (파일: `.../importer/ImportReport.java`, 결정 6)
   - 할 일
     - `sameTextIsbnSplit` [안]: ISBN으로 나눠 늘어난 책 수 = mergeKey 수 − key 수
     - `sameTextPlaceholderNoKey` [안]: 자리 채움 값 때문에 키가 없어진 묶음 수
     - `toString`의 (4)줄에 더합니다. `ImportRecords`, `ImportTransfer`, `catalog_import` 칸에는 **넣지 않습니다**
     - 두 방식이 같은 정의로 셉니다. 정의는 `# 사이클 12`에 적습니다
   - 의존: 3·4단계
   - 위험: 낮음

#### 6단계: dry run 전용 "사이클 07 도서관 빼기" 설정
1. **설정과 거르기** (파일: `.../importer/CatalogImportRunner.java`, `CollectedCatalog.java`, `CatalogImporter.java`, 결정 4-1)
   - 할 일
     - `Settings`에 boolean을 더합니다. 이름은 `chaekcheck.collection.import.*` 아래에서 dev가 정합니다. 예 `exclude-candidate-libraries` [안]
     - `check()`: 켜져 있는데 `dry-run`이 아니면 **시작하지 않습니다**(예외, 종료 코드 1). `dry-run`은 이미 `in-place`에서만 됩니다
     - `CollectedCatalog.libraries(...)`에서 `Library.candidate()`(수집 번호 ≥ `FIRST_CANDIDATE_ID` 100001)를 건너뜁니다. 건너뛴 이유 낱말은 소문자 영어 하나로 합니다. 예 `library_excluded_candidate` [안]
     - 로그에 "사이클 07 도서관 뺌, N곳"을 남깁니다
   - 이유: spec R5
   - 의존: 없음(2~5단계와 나란히)
   - 위험: 낮음. 진짜 가져오기에서 켜지면 2,394곳이 서비스에서 빠지므로 시작 거부를 반드시 시험합니다

#### 7단계: `compare_grouping.py regroup`
1. **하위 명령 `regroup <A> <B> [N]`** (파일: `scripts/catalog/compare_grouping.py`, 결정 4-2)
   - 할 일
     - A와 B는 dry run 폴더(`books.tsv.gz`·`rows.tsv.gz`)이거나 `ids` 폴더(`book-ids.tsv.gz`·`holding-ids.tsv.gz`)입니다. 파일 이름으로 알아봅니다
     - 두 쪽에 다 있는 (도서관, 책 코드)로 맞댑니다
     - 출력
       - 합쳐짐: B의 한 책 ← A의 여러 책
       - 나뉨: A의 한 책 → B의 여러 책
       - 각각의 수와 앞 N개 목록. 목록 칸은 제목·저자·출판사·ISBN·A쪽 책 번호이고, B가 `ids` 폴더면 B쪽 책 번호도 넣습니다
       - 나뉨 목록에는 "A 번호를 이어 받은 B 책이 겹치는 소장이 가장 많은 책인지"(ADR-0062)도 표시합니다 [안]. B가 ids일 때만입니다
     - 한쪽에만 있는 줄 수도 출력합니다(R5에서는 뺀 도서관 줄이 여기에 들어갑니다)
     - 표준 라이브러리만 씁니다. 메모리는 rows 1,700만 줄 기준으로 dev가 확인합니다
     - 모듈 docstring의 Usage에 더합니다
   - 의존: 없음
   - 위험: 중간. 실데이터 크기의 메모리와 시간은 Phase B에서 처음 봅니다
2. **스크립트 시험** (파일: `scripts/catalog/test_compare_grouping.py`, `scripts/library/test_build_candidate_seed.py`와 같은 방식)
   - 할 일: 작은 gzip 샘플 두 쌍(dry run 대 dry run, ids 대 ids)으로 합쳐짐 1·나뉨 1·같음을 확인합니다
   - 의존: 7-1
   - 위험: 낮음

#### 8단계: 테스트 바꾸기 (`current`는 아직 그대로)
1. **계약 테스트** (파일: `backend/src/test/java/com/chaekcheck/collection/internal/importer/BookGrouperContractTests.java`)
   - 할 일
     - 지금 기대값(옛 규칙)은 `current` 전용으로 남깁니다(예 `assertCurrentContract`). `groupings()`의 `current` 실행이 그것을 씁니다
     - 새 규칙 기대값 `assertContract`를 `compact`(`CompactGroupingTests`)와 `sql`(`SqlGroupingTests`)이 부릅니다
     - 새 줄에 넣을 경우
       - R1 → 2권
       - R1-3 A(ISBN1)·B(없음)·C(ISBN2) → 3권
       - A·B1·B2·C → 3권(B1·B2 한 권)
       - ISBN 하나 + 없음 → 1권
       - ③ 국가서지에서 붙인 ISBN(A는 교보식 ISBN1, B는 `attachBibliography`로 ISBN2)도 R1로 나뉨
       - 저자·출판사 "기타" → 따로. 그 책의 `authorDisplay`·`contributors`·`publisher`에는 "기타"가 그대로 남음(R2-3)
       - 첫 저자 "기타" + 실명 → 실명으로 합침
       - 부제만 다름 → 1권, 권 다름 → 따로
       - 단계별 책 수, `sameTextMerged`, 새 카운터 둘
       - 2년 차이 표본 순서(첫 묶음 순)
   - 의존: 2~5단계
   - 위험: 낮음
2. **무작위 대조 기준을 `current` → 두 방식 서로로** (파일: `CompactGroupingTests.java`, `SqlGroupingTests.java`)
   - 할 일
     - `givesWhatTheCurrentGroupingGives*`와 `givesWhatCurrentGives`를 `compact` 대 `sql` 대조로 바꿉니다. 같은 무작위 줄에서 책, 줄별 책, 카운트, 표본까지 같아야 합니다
     - 무작위 제목에 권 표시, 자리 채움 값, 부제, 교보식 ISBN이 다른 같은 글자를 더해 새 규칙의 모든 갈래가 나오게 합니다
     - `followsALongChain`, `breaksTiesInJavaOrder`의 기준도 `compact`로 바꿉니다
     - `mapShapeGivesTheOrderOfComputeIfAbsent`, `ordersLikeAHashMap`(흉내 코드 시험)을 지웁니다
     - `SqlGroupingTests`에 "같은 키 안 ISBN 0·1·2개에서 `mergeKey`가 Java 규칙과 같음"을 더합니다
   - 의존: 3·4단계
   - 위험: 중간. `current`를 기준으로 삼지 못하므로 두 방식이 같은 실수를 하면 놓칩니다. 그래서 8-1의 손으로 쓴 기대값이 기준입니다
3. **설정 시험** (파일: `.../importer/CatalogImportModesTests.java`)
   - 할 일: 빼기 설정 + `dry-run=false`면 시작하지 않음. 빼기 설정 + dry run이면 사이클 07 도서관 줄이 빠짐
   - 의존: 6단계
   - 위험: 낮음

#### 9단계: 문서
1. **dev 문서** (파일: `docs/maintenance/3-import.md`, `docs/plan-feedback.md`)
   - 할 일
     - `3-import.md` 3절(dry run)에 빼기 설정과 `regroup` 쓰는 법을 더합니다
     - 12절에 "④ 규칙 바꿈 = 가져오기 → 바꿔 끼우기, 재시작 없음(ADR-0069)"과 사이클 12 예를 더합니다
     - `# 사이클 12`에 정한 이름, 카운터 정의, Phase A 커밋과 테스트 결과를 적습니다
   - 의존: 2~8단계
   - 위험: 낮음

**Phase A 완료 조건**: 단위 테스트(`SameTextKeyTests`·`CompactGroupingTests`·`BookGrouperContractTests`)와 스크립트 시험이 통과합니다. `./gradlew build`(`SqlGroupingTests`·`ModularityTests`·`DocumentationTests` 포함)는 "개발 시작 전 확인"에서 허락된 때에 통과합니다. 실데이터 실행은 0번입니다.

### Phase B: 사이클 11 측정과 병합이 끝난 뒤

#### 10단계: 사이클 11 결과 위로 옮기기
1. **rebase** (worktree 브랜치)
   - 할 일
     - 사이클 11 병합 커밋 위로 rebase합니다
     - 사이클 11이 측정 중에 `CompactGrouping`·`SqlGrouping`·테스트를 고쳤으면 충돌을 풀고, 그 고침이 새 규칙에서도 유지되는지 확인합니다
     - `plan-feedback.md`는 두 절을 다 남깁니다
     - 단위 테스트와 `./gradlew build`를 다시 통과시킵니다
   - 의존: 사이클 11 끝
   - 위험: 높음. 측정 중의 수정과 겹칠 수 있습니다

#### 11단계: `current` 정리 (ADR-0079 덧붙임 조건)
1. **경우 1: `compact`나 `sql`이 하나라도 사이클 11 결과 비교를 통과함** → `current`를 지웁니다
   - 지울 것: `.../importer/BookGrouping.java`
   - `CatalogImportRunner.GROUPINGS`에서 `current`를 빼고, `Settings` 기본값을 **사용자가 고른 방식**으로 바꿉니다
   - `CatalogImporter`의 기본 `groupers`도 바꿉니다
   - `BookGrouperContractTests`에서 `current` 실행과 `assertCurrentContract`를 지웁니다
   - `BookGrouping`을 참조하는 javadoc을 고칩니다
   - `CatalogImporterTests`의 `booksAfterSameText` 기대값(183행, 지금은 `current` 기준 8)은 새 규칙에 맞춰 다시 셉니다
   - `3-import.md`의 `current` 언급을 고칩니다
2. **경우 2: 둘 다 통과하지 못함** → `current`를 남깁니다
   - `BookGrouping.mergeSameText`에 같은 `SameTextKey`와 버킷 나누기, 표본 순서(첫 묶음 순)를 넣습니다
   - `current`도 `assertContract`(새 규칙)를 통과하게 합니다
   - 기본값은 사용자가 정합니다
   - `# 사이클 12`에 어느 경우였는지와 근거(사이클 11 결과)를 적습니다
   - 의존: 10단계
   - 위험: 중간

#### 12단계: 꼬리 목록(R3-3) 정하기
1. **design-delta "꼬리 목록을 정하는 절차" 1~5**
   - 할 일
     1. 꼬리 목록이 빈 채로 새 규칙 dry run을 합니다(기본 방식, `dry-run-output`)
     2. 본제목·첫 저자·출판사가 같은데 권 표시나 본제목 끝 괄호만 달라 따로 남은 쌍을 뽑습니다. `books.tsv.gz`를 읽는 일회용 Python으로 정리를 흉내 내도 되고, dev가 방법을 정합니다. 쌍을 찾는 데만 쓰고, 맞는지는 5)의 다시 돌린 dry run으로 봅니다
     3. 차이를 만든 괄호·대괄호 조각을 빈도순으로 셉니다. 숫자, 상중하, 판 낱말이 든 조각은 따로 표시합니다
     4. 상위 50개 정도를 예시 제목과 함께 `# 사이클 12`에 올리고, 이용 안내나 형식 표시로 보이는 것에 dev 초안 표시를 합니다. **값은 사용자가 확정합니다.** 확정 전에는 코드에 넣지 않습니다
     5. 확정된 목록을 상수로 넣고 `SameTextKeyTests`에 더한 뒤 다시 dry run합니다. `regroup`(빈 목록 결과 대 넣은 결과)으로 합쳐짐 표본 20권을 사이트에서 확인합니다
   - 같은 dry run에서 함께 낼 것
     - 로마 숫자(NFKC 뒤 `I`·`II`…)와 한자·한글 수("제일권" 등)로만 다른 쌍의 수와 예 → 사용자 질문으로 올립니다(세부 9)
     - 부제 안 숫자("7가지 법칙")로 갈린 수(design-delta 확인 필요)
   - 의존: 11단계
   - 위험: 중간. 사용자 답을 기다립니다

#### 13단계: 실데이터 비교 (AC-6, AC-7)
1. **확인용 측정**
   - 사이클 07 도서관 수가 2,394곳과 같은지 봅니다(가져오기 로그의 `candidates`). 다르면 `# 사이클 12`에 적고 사용자에게 묻습니다
   - `compact`의 힙 최대치를 사이클 11 값과 비교합니다(메모리 증가 확인)
2. **AC-6**
   - 같은 사본으로 `compact`와 `sql` 새 규칙 dry run(`dry-run-output` 둘)을 돌립니다 → `compare_grouping.py dryrun` 다른 줄 0
   - 두 방식으로 `export` → `ids db <폴더>` → `discard` → `ids-compare` 다른 줄 0 (ADR-0079와 같은 방식)
3. **R5 / AC-7**
   - 기본 방식으로 빼기 설정 dry run(A)과 전체 dry run(B)을 돌립니다 → `regroup A B`
   - "새 도서관 때문에 합쳐진 기존 책" 수와 목록, 표본 20권 사이트 확인 결과를 `# 사이클 12`에 적습니다
   - 잘못 합친 것에 공통점이 보이면 **여기서 멈추고** 사용자 질문으로 올립니다(R5-2). 규칙은 사용자 답 뒤에만 더합니다
   - 의존: 12단계
   - 위험: 중간. 디스크와 시간이 듭니다. 측정이 끝난 뒤라 이 PC에서 하나씩 돌립니다

#### 14단계: 가져오기와 화면 확인 (AC-1~AC-5, AC-8)
1. **가져오기 전**
   - `compare_grouping.py ids db <before> catalog`로 지금 서비스 번호를 받아 둡니다. 바꿔 끼운 뒤에는 다시 만들 수 없습니다
   - 직전 `catalog_import` 성공 줄의 `book_count`를 적습니다(기준 1,619,668. 사이클 11에서 다시 가져왔으면 그 값)
2. **가져오기**: `3-import.md` 절차대로(`in-place` 또는 `export`/`apply`, 사용자가 고름) 새 규칙으로 가져와 바꿔 끼웁니다. 서비스는 다시 켜지 않습니다(ADR-0069)
3. **가져온 뒤**
   - `ids db <after> catalog`를 받고 `regroup <before> <after>`를 돌립니다
   - R1(ISBN·자리 채움)로 나뉜 책 5권과 R3(부제)로 합쳐진 책 5권을 고릅니다. 옛 `/books/{bookId}`를 열어 ADR-0062대로인지 봅니다: 나뉘면 소장이 더 많이 겹치는 판, 합쳐지면 가장 작은 번호, 사라진 번호는 "책을 찾을 수 없어요"
   - 새 `catalog_import` 줄의 `book_count`·`kept_book_id_count`·`new_book_id_count`·`dropped_book_id_count`와 새 카운터 둘(로그)을 `# 사이클 12`에 적습니다
4. **화면 (데스크톱, Playwright)**: AC-1~AC-4 검색 결과를 캡처합니다. 폰 화면은 바뀌지 않아 실제 폰 확인은 대상이 아닙니다(flow.md). 인기 도서(S13·S14)는 `BookLookup.byIsbn13`가 `catalog.book.isbn13`으로 찾습니다(dev `JdbcBookLookup` 40행). 판이 나뉜 순위 책 하나를 눌러 그 ISBN의 판이 열리는지만 봅니다
   - 의존: 13단계
   - 위험: 중간. 서비스 DB를 바꿔 끼웁니다. 실패하면 사이클 08·11과 같이 옛 catalog가 그대로 남습니다

## 테스트
- 단위
  - `SameTextKeyTests`(2단계)
  - `CatalogImportModesTests`: 빼기 설정 거부와 적용(8-3)
  - `scripts/catalog/test_compare_grouping.py`(7-2)
- 계약과 모듈 테스트
  - `BookGrouperContractTests` 새 규칙을 `CompactGroupingTests`·`SqlGroupingTests`가 부릅니다(8-1)
  - `compact` 대 `sql` 무작위 대조(8-2)
  - `SqlGroupingTests` mergeKey 시험
  - `NationalBibliographyTests`는 고치지 않고 통과해야 합니다(③ 키를 건드리지 않았다는 확인)
  - 모듈 검증: 모듈과 공개 API는 바뀌지 않지만 `ModularityTests`(`ApplicationModules.of(...).verify()`)와 `DocumentationTests`가 `./gradlew build`에서 통과해야 합니다
- 실데이터(Phase B): 13·14단계
- 화면 확인: Playwright 데스크톱. 폰 화면 변경이 없어 실제 폰 확인은 없습니다

### 수용 기준과 테스트 대응표
| AC | 자동 시험 | 실데이터·화면 확인 |
|---|---|---|
| AC-1 「상법총칙 상행위」 판마다 한 줄, 그 판의 도서관만 | 계약: R1 2권, R1-3 3권, ③ ISBN 나눔 | 14-4 검색 화면 |
| AC-2 「햄릿」(저자·출판사 "기타") 두 줄 | `SameTextKeyTests` R2, 계약 "기타" 따로 | 14-4 |
| AC-3 「백만장자 마인드」 부제만 다르면 한 줄 | `SameTextKeyTests` R3-4, 계약 부제 1권 | 14-4 (저자 있는 줄로) |
| AC-4 「수학 1·2」, 「묘왕동주 1 - 상·중·하」 따로 | `SameTextKeyTests` R3-4, 계약 권 다름 | 14-4 |
| AC-5 기록의 이어 씀·새·사라짐 수, 표본 10권 옛 주소 | (기존 `CatalogImportRecordTests`) | 14-3 `regroup` + 옛 주소 열기 |
| AC-6 `compact`·`sql` 책마다 같음(번호까지) | 무작위 대조 `compact` 대 `sql`, 계약 공통 | 13-2 `dryrun` 0, `ids-compare` 0 |
| AC-7 R5 목록과 표본이 `plan-feedback` | `test_compare_grouping.py`, 빼기 설정 시험 | 13-3 |
| AC-8 바꾸기 전후 책 수 | — | 14-1·14-3 `book_count` 두 줄 |

## 완료 기준
- [ ] AC-1: 새 규칙으로 가져온 뒤 「상법총칙 상행위」(박영사)의 2014·2015·2020년 판이 서로 다른 줄로 나오고, 각 줄의 도서관이 그 판을 가진 곳뿐이다
- [ ] AC-2: 「햄릿」(저자·출판사 "기타", 북큐브)이 두 줄로 나온다
- [ ] AC-3: 「백만장자 마인드」(율리시즈)와 「백만장자 마인드 - 부를 끌어 당기는」이 저자가 같으면 한 줄로 나온다
- [ ] AC-4: 「오개념 탈출 프로젝트 - 수학 1」·「- 수학 2」, 「묘왕동주 1 - 상·중·하」가 따로 나온다
- [ ] AC-5: 가져오기 기록에 이어 쓴 번호·새 번호·사라진 번호 수가 있고, R1로 나뉜 책 5권·R3로 합쳐진 책 5권의 옛 주소가 ADR-0062대로 열린다
- [ ] AC-6: `compact`와 `sql`로 같은 사본을 가져온 결과가 책마다 같다(다른 책 0권, 번호까지)
- [ ] AC-7: R5 비교 결과(목록과 표본 20권 확인)가 dev `plan-feedback.md` `# 사이클 12`에 있다
- [ ] AC-8: 바꾸기 전후 책 수가 기록에 있다(기준 1,619,668)
- [ ] 꼬리 목록이 사용자 확정값으로 들어가 있다(12단계)
- [ ] `current`가 ADR-0079 덧붙임 조건대로 정리되어 있다(11단계)
- [ ] `./gradlew build` 통과(`ModularityTests`·`DocumentationTests` 포함), 스크립트 시험 통과
- [ ] 사이클 11 작업 폴더를 건드리지 않았고, 측정 중에 실데이터 실행을 하지 않았다
- 폰 화면이 바뀌지 않으므로 "사용자 실제 폰 확인" 줄은 넣지 않습니다(flow.md, planner 규칙)

## 이번에 하지 않는 것
- ISBN API(국립중앙도서관 ISBN 서지정보)를 국가서지 다음 단계로 넣기 (spec R6-1)
- 검색 화면이나 책 화면 모양 바꾸기(판 묶어 보이기), 규칙이 바뀌었다는 안내 문구
- 대표 제목·대표 출판일 규칙, `48090…` 번호, 번호 잇기 규칙(ADR-0062) 바꾸기
- 자리 채움 값을 화면에서 다른 글자로 보이기, 회원 저장 책 번호 고쳐 쓰기
- `catalog.normalize`(검색 정리 규칙) 바꾸기, 검색 완전 일치에 꼬리 떼기 (backlog 후보)
- 단계별 책 수와 새 카운터를 `catalog_import` 칸으로 (backlog 후보)
- 출판사 "북큐브" 처리 바꾸기(그대로 [확정])
- 로마·한자 숫자 권 표시: 사용자 답이 "넣음"일 때만 이번에 더하고, 아니면 backlog로
- 정해진 때마다 자동 갱신, 수집기 dev로 옮기기(사이클 13)

## 개발 후 plan 쪽에 알려줄 것 (`# 사이클 12`)
- worktree 시작 커밋, rebase한 사이클 11 커밋, 충돌과 푼 방법
- 실제로 정한 이름(클래스, 메서드, 설정, 건너뛴 이유 낱말, 카운터)과 카운터 정의. [안]과 다르면 다르다고 적습니다
- 11단계: 경우 1 또는 2, 그 근거(사이클 11 결과), 바꾼 기본값
- 꼬리 목록 후보 50개와 사용자 확정값, 로마·한자 숫자 표본과 사용자 답, 부제 안 숫자로 갈린 수
- 사이클 07 도서관 수가 2,394곳과 같은지, `compact` 힙 증가 실측
- AC-6 비교 결과(dryrun·ids-compare 다른 줄 수), R5 목록 수와 표본 20권 결과, R7-3 표본 10권 결과, 바꾸기 전후 `book_count`·kept·new·dropped, 새 카운터 값
- 설계와 달라진 점, 새로 알게 된 제약. 특히 ②·③ 뒤 "같은 ISBN 묶음은 하나뿐" 불변식이 실데이터에서 깨진 적이 있는지
