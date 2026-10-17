# 회고: 사이클 19 같은 책을 갈라 놓는 저자·제목 표기 정리

- 작성: 2026-10-18 (`/cycle-start` 1단계 "지난 사이클 닫기")
- 입력: dev `docs/plan-feedback.md` `# 사이클 19`(4404~4536행), dev main 코드(읽기만; 19는 `1c129e8`로 main에 들어감, 그 위에 21이 `836bd7b`까지 들어감), Spring Modulith `Documenter` 출력 `backend/build/spring-modulith-docs/components.puml`(21 회고 때 다시 만든 것, 2026-10-17)
- 비교 대상: [design-delta.md](design-delta.md), [spec.md](spec.md), [handoff.md](handoff.md), ADR-0113~0117, `docs/current/`

## 반영 상태

- 운영 역할 DB(db-ops, 5434) 반영 **끝남**: 2026-10-16 11:25~11:29, 기록 **12번 SUCCEEDED**(apply 4분 40초). 내 PC 원래 DB(5432)도 `finish`로 기록 12번 SUCCEEDED [확정] (dev 보고, `plan-feedback.md` 4519·4521행)
- 21은 그 뒤 따로 반영(기록 13번, 2026-10-17). 21도 19 규칙이 든 코드로 가져왔으므로 19 결과가 그대로 이어짐
- CLAUDE.md의 "19 반영 뒤 공개 배포" 조건은 채워짐. dev: "19 반영 끝난 날: 2026-10-16 → 공개일(2026-10-18)은 그대로 둘 수 있음" (`plan-feedback.md` 4535행)
- db-ops 볼륨이 없어 원래 `db`(기록 11번 상태)를 복사해 다시 만든 뒤 반영함(사이클 11 13-4 절차)

## 계획대로 된 것

| 항목 | 실제 (dev main) | 근거 |
|---|---|---|
| 저자 기호 떼기 (R1-1·R1-2, ADR-0113) | `Contributors.stripMarks`: `< > ＜ ＞ ﹤ ﹥`와 `〈〉「」《》`(`〈〉`·`｢｣` 포함) 표시를 떼고 `[ ]`는 그대로. 기호를 뗀 자리 공백은 하나로 | dev `catalog/normalize/Contributors.java` 84·125행 |
| 붙은 역할 낱말 (R1-3) | 좁은 규칙 `ATTACHED_ROLES`(첫 낱말 저자·저·지은이·지음·글, 둘째 옮긴이·옮김·번역·역자·역·그림, 셋째까지) + 보호 장치 `SEPARATE_ROLE` | 같은 파일 94·102행 |
| 저자 검색어 (R1-4) | `BookQuery`의 저자 단어·정확 일치 값에 `stripMarks` | dev `catalog/internal/search/BookQuery.java` 30~37행 |
| 책 저자 칸 (R1-5) | `CatalogImporter`가 `Contributors.displayText(대표 원문)`을 `NewBook`에 씀(dry run 덤프도 같음) | dev `CatalogImporter.java` 199행 |
| 제목 앞 괄호 (R2-2) | `SameTextKey.comparisonTitle` + `LEADING_NOTE_KEEP_WORDS` | dev `rules-index.md` 3절 |
| 뒤바뀐 두 칸 (R2-4, ADR-0115) | `CollectedCatalog.scan`이 `Library.authorPublisherSwapped`이면 두 번 읽기 모두에서 저자↔출판사 | dev `CollectedCatalog.java` 278~279행 |
| 규칙 파일 | `scripts/library/rules/author_publisher_swapped.tsv`(11·12·15, `swap_before` 2026-10-16), `supplier_families.tsv`(46줄, 묶음 16가지) | dev 파일 |
| 가져오기 설정 | `chaekcheck.collection.import.rules-dir`, 기본 `../scripts/library/rules` | dev `application-collection-import.yml` 25행 |
| 수집기 (R3-1) | `crawl_catalog.py` `PUBLISHER_FIRST_PORTAL_HOSTS`(`lib.goe.go.kr`, `library.daegu.go.kr`, `lib.jbe.go.kr`), 저장 HTML 시험 `test_parse_portal.py` | dev `rules-index.md` 1절 |
| 캐시 답 셈 (R5, ADR-0116) | `ResponseResult.CACHED`, `BatchRunner`·`LibraryEbookController`가 `recordLibraryResponse(…, CACHED, 0)`, `UsageBuffer`가 `cached`를 셈. changeset `usagelog/002-library-response-cached-count.yaml`(id `usagelog-002-cached-count`), master에 `# cycle 19: usage log cached answers (ADR-0116)` 주석 | dev 파일 |
| 규칙 관리 (R7, ADR-0117) | dev `docs/maintenance/rules-index.md`(1 수집기, 2 규칙 파일, 3 가져오기 상수), 상수마다 `Rule: docs/maintenance/rules-index.md "…"` 주석, `2-crawl.md`·`3-import.md` 시작 점검, 검증 스크립트 `scripts/library/check_author_publisher_swap.py` | dev 파일 |
| dev 문서 R6 (AC-16) | `3-import.md` 36행 `compact`는 `-PbootRunXmx=2g`, 6GB는 `objects`만; 43행 "약 2,370곳" | dev 파일 |
| 모듈 관계 | 바뀌지 않음. `components.puml`: Collection → Catalog·Library(·Picks는 21), Availability → Usagelog. 새 모듈·이벤트·REST 없음 | Documenter 출력 |
| 이름 | 인계서 [안] 이름이 모두 그대로 쓰임(`stripMarks`, `displayText`, `ImportRules`, `rules-dir`, `Library.authorPublisherSwapped`, `Row.supplierCodeKey`, `LEADING_NOTE_KEEP_WORDS`, `ImportReport` 셈 넷, changeset id, `rules-index.md`, 검증 스크립트) | `plan-feedback.md` 4447행 |

### 수용 기준 결과 (반영 뒤, 2026-10-16)

| AC | 결과 |
|---|---|
| 1 | 통과: 「채널 전쟁」 1줄, 「다재다능 코틀린 프로그래밍」 1줄 |
| 2 | 통과: 「백만장자 마인드」(율리시즈) 6권 → 2권(38755 소장 60 → 74, 꺾쇠·김근아·앞 괄호·대구·경기 줄 모임 + 410727 괄호 없는 수식어, 설계대로 따로) |
| 3 | 통과: "김정은"·"<김정은>" 단어 60·정확 59로 같음. `<김정은>` 이름 9 → 0 |
| 4 | 통과: `author_display`에 꺾쇠·다른 괄호 104,853 → 0, `name_exact`에 꺾쇠 138,148 → 0 |
| 5 | **부분 통과**: 「〈슈퍼차이나〉」 줄은 모였으나 「KBS [슈퍼차이나] 제작팀 저」 줄이 따로 남음(`[ ]`는 그대로 두기로 한 범위 밖 기호) |
| 6 | 통과(시험). 실제 데이터에 「(만화) 삼국지」 꼴 제목 0 |
| 7 | 통과: "루이스 캐럴" 209, 옮긴이 "이소연" 정확 46 |
| 8 | 통과(시험) |
| 9 | 통과: "율리시즈" 저자 검색 0 |
| 10 | 통과(수집기 시험) |
| 11 | 통과: 2624 소장 241 |
| 12 | 네 번째 dry run에서 통과(원인별 표본 120권 중 잘못 합친 책 0). 아래 "달라진 것" 1 |
| 13 | 통과: 반영 중 호출 362건 모두 200, 5xx 0, 검색 p50 395ms·p95 1.6초 |
| 14 | 통과: 사서추천 72/108, 이동진 36/44, 서울대 100선 87/100 — 기준과 같음(못 찾은 책도 같음) |
| 15 | **일부만**: 칸은 db·db-ops에 기본 0으로 있음. "같은 도서관 검색 두 번" 실제 확인은 아직(시험 `UsageRecordingTests`·`LibraryEbookControllerTests`는 있음) |
| 16·18 | 통과(파일 확인) |
| 17 | 통과: 「진짜 노동」 「데니스 뇌르마르크 저 손화수 역」 |
| 19 | 통과: 2026-10-12 사본으로 11·12·15 뒤바뀜(99.88~99.96%), 10·13·14·280 바름(0~0.33%) |

- 책 수 1,568,453 → **1,331,194**(−237,259, −15.1%). 사람 1,475,913, 소장 18,024,652. 책 번호 유지 1,329,177 / 새 2,017 / 사라짐 239,276 [확정] (dev 측정)
- 시간: dry run 약 24분(2GB 안), 내 PC export 46분 47초, 운영 역할 apply 4분 40초, finish 1분 43초 [확정] (dev 측정)

## 달라진 것과 이유

1. **공급사 코드 잇기에 제목·출판사 조건이 붙음 (R2-3, ADR-0114와 다름)**
   - 설계: (공급사 묶음, 코드)가 같으면 저자를 보지 않고 잇고 "제목 조건은 두지 않음"
   - 실제: 키 = (공급사 묶음, 코드, **그 줄의 ④ 비교 제목** `SameTextKey.comparisonTitle`, **다듬은 출판사** `CatalogText.publisherNorm`). 출판사가 비거나 자리 채움(`SameTextKey.PLACEHOLDER_PUBLISHERS`: 기타·미상·unknown)이면 코드로 잇지 않음 (dev `CollectedCatalog.java` 116~140행)
   - 경위: 첫 dry run에서 멈출 조건 1번에 걸림(제목이 다른 합쳐짐 12,293건, 표본 40건 중 다른 책 약 13건; 원인은 703번 도서관 「우리전자책 전자책」 줄이 같은 `alt_code`를 다른 책에 붙인 것). 두 번째(제목 조건)도 같은 제목·다른 저자·다른 출판사 책이 이어져 걸림. 세 번째(+ 출판사) 표본의 「귀가」(출판사 둘 다 「기타」) 때문에 자리 채움 출판사를 뺌. 네 번째에서 원인별 표본 0
   - 이유 (사용자 발언, dev 세션 2026-10-16): 질문 "코드 잇기"에 "제목도 같아야 잇기 (추천)", 질문 "코드 잇기 2"에 "출판사도 같아야 잇기 (추천)". 자리 채움 출판사 빼기는 dev가 "사용자 결정 '출판사도 같아야 잇기'의 뜻 안"으로 보고 알림 — 승인 [확정] (사용자 승인, 2026-10-18, 회고 결정 #1)
   - plan ADR-0114에 "결정 고침 (2026-10-16)" 절을 덧붙임 → 사용자에게 확인할 것 #1
2. **공급사 「기타」·「기타 전자책」도 코드로 잇지 않음**: `ImportRules.PLACEHOLDER_SUPPLIERS`. 설계는 "공급사가 빈 줄은 잇지 않음"만. 승인 [확정] (사용자 승인, 2026-10-18, 회고 결정 #1) (dev 설명: 「기타」는 여러 회사를 한 이름으로 적은 것이라 같은 번호가 다른 책일 수 있음, "확실하지 않으면 잇지 않음" 방향) → 사용자에게 확인할 것 #1에 함께
3. **국가서지를 저장된 표에서 읽는 설정 `stored-bibliography`를 더함**: 내 PC `data/nlk/ttl`이 비어 있었음(사이클 18 정리 무렵 지워진 것으로 보임, 다시 못 찾음). `chaekcheck.collection.import.stored-bibliography=true`면 2026-10-11에 풀어 둔 원문 표 `collection.national_bibliography_record`(`book_ttl_20260807`)를 읽음. `ttl-path`와 함께 주면 멈춤. 같은 원문이라 ③ 결과는 TTL과 같음(`CatalogImporterTests`). 이유 (사용자 발언, 2026-10-16, 질문 "국가서지 TTL"): "저장된 표로 읽기 (추천)". 커밋 `f4db60b`(인계서 밖) → 사용자에게 확인할 것 #3
4. **`rules-dir`는 `in-place`(dry run 포함)·`export`에서만 읽음**: 설계(흐름 20)는 "모든 모드". `apply`·`finish`·`discard`는 수집 사본을 읽지 않으므로 `Settings.readsCollection()`이 거짓이면 `ImportRules.NONE`. [이유 미확인] (dev 설명: 사본을 읽지 않는 모드). 설계 뜻(사본을 읽기 전에 규칙 확인)과 어긋나지 않아 ADR 고침은 필요 없음
5. 작은 것
   - 코드 다듬기는 앞뒤 공백만, 앞의 0은 그대로(교보 `480KB…`·`480…`처럼 모양이 여럿) — 설계 확인 필요 항목의 답
   - `KYOBO_SUBSCRIPTION_V1`의 `item_key`(`480D…`·`480N…`)는 교보 소장형과 번호 모양이 달라 섞여 이어지지 않음 → 설계대로 키에 넣음
   - `swap_before` = 2026-10-16(고친 수집기를 main에 합친 날, 설계 정의대로). 판정은 `last_full_success_at`이 그날 0시(한국 시각) 이후면 멈춤
   - 기호뿐인 저자 검색어(「<>」) 단어 검색은 결과 없음(전에는 SQL이 깨질 수 있었음)
   - 기존 시험 기대값 하나를 바꿈: 「tvN STORY 〈벌거벗은 한국사〉 제작팀」 → 이름 「tvN STORY 벌거벗은 한국사 제작팀」(R1-2 그대로)
   - 더한 이름: `CollectedCatalog.SUPPLIER_CODE_COLUMN`, `ImportRules.PLACEHOLDER_SUPPLIERS`, `CatalogImportRunner.Settings.readsCollection()`, 설정 `stored-bibliography`
   - `supplier_families.tsv`는 dev가 2026-10-12 사본의 공급사 이름 133가지로 만듦(설계대로, dev 보고는 45줄이나 파일은 46줄). 넣지 않은 것: 웅진·웅진북센, 한국학술정보·(주)학술정보, 북큐브D, 누리미디어 이러닝, 컨텐츠포탈(오디오락)·오디오락 → 사용자에게 확인할 것 #2

## 새로 알게 된 제약

- **상품 코드만으로는 같은 책이라 할 수 없음**: 703번 도서관(북큐브)의 「우리전자책 전자책」 줄은 북토피아 꼴 번호(`01100765` 등)를 다른 도서관과 다른 책에 붙임. 교보 화면(`KYOBO_V1`, 890·921번 등)의 공급사 「북큐브」 줄은 `item_key`와 책 정보가 어긋나기도 함(921번 `180512509`). → 코드 잇기는 제목·출판사가 같을 때만
- **남은 잘못 합침 약 0.2%**: 네 번째 dry run 원인별 표본은 0이었지만, 원인별 표본 밖 "제목이 다른 합쳐짐" 2,667건 중 표본 40건에 다른 책 약 6건(「연단가 8」 + 「영문법에센스」 등, 줄 1~2개인 쪽이 끼어든 꼴). 원인: 교보 화면 도서관(921·890·740·818 등)의 공급사 「북큐브」 줄이 ① 단계 같은 번호 묶음(`SHARED`)에 들어가 그 묶음이 다른 제목의 코드 키를 갖고, 그 키가 다른 책을 이어 줌 [확정] (dev 원문 줄 확인) → 사용자에게 확인할 것 #4
- **ISBN 둘 이상 셈(`codeJoinedIsbnConflicts`)으로는 잘못 이음을 못 잡음**: 잘못 이어진 줄에 ISBN이 없어 네 번 모두 0. 표본 판단(멈출 조건 1번)이 실제로 막은 장치
- 국가서지 TTL 파일은 내 PC에서 지워질 수 있음. 저장된 원문 표로 같은 결과를 냄
- 붙은 역할을 띄운 글(`displayText`)을 다시 `parse`하면 한 사람으로 읽힘(쉼표·`/`가 없어서). 사람 줄은 늘 원문에서 만들므로 문제없음
- db-ops 볼륨이 사라져 있었음(전에 지운 것으로 보임). 반영 전에 볼륨이 있는지 먼저 확인해야 함
- 반영 전 dry run을 규칙마다 다시 돌리는 데 한 번에 약 24분(2GB). 네 번 돌려 반나절에 끝남

## 다음 사이클 후보

- 교보·YES24 화면에서 공급사가 그 회사가 아닌 줄(「북큐브」 등)의 `item_key`를 코드 키에서 빼거나, 번호와 정보가 어긋난 도서관을 규칙 파일로 빼기(단 AC-2의 와이투북스 `1210492004114`도 교보 화면 다른 공급사 줄이라 같이 빠짐 → 다른 방법 필요) — `docs/backlog.md`에 더함
- 저자 칸 `[ ]` 표기(「KBS [슈퍼차이나] 제작팀 저」, AC-5 남은 줄) — `docs/backlog.md`에 더함
- 괄호 없이 수식어를 붙인 제목(「부를 끌어 당기는 백만장자 마인드」) — 이미 backlog
- 다음 수집 뒤 가져오기: 고친 수집기로 받은 사본이면 `swap_before`로 멈춤 → 검증 스크립트 → "바름"이면 `author_publisher_swapped.tsv` 세 줄을 지움(dev `3-import.md` 절차). 정기 작업이라 사이클이 아님
- AC-15 실제 확인(같은 도서관 검색 두 번 → `cached_count` 1): 사이클 17 배포 뒤 운영에서 확인

## 사용자에게 확인할 것

결정 페이지 `easy/2026-10-18-retro-decisions.html` (2026-10-18)에서 #1~#3은 정해지고 #4는 열려 있음.

1. **ADR-0114를 실제 규칙으로 고치기** — 승인 [확정] (사용자 승인, 2026-10-18, 회고 결정 #1)
   - ADR-0114에 "결정 고침 (2026-10-16)" 절을 덧붙임(Accepted 그대로, 새 ADR 없음): 키 = (공급사 묶음, 코드, 비교 제목, 출판사), 사용자 발언 "제목도 같아야 잇기 (추천)"·"출판사도 같아야 잇기 (추천)", 경위(첫 dry run 703번 「우리전자책」 줄, 네 번째 표본 120권 중 0)
   - 자리 채움 출판사(기타·미상·unknown)와 공급사 「기타」·「기타 전자책」을 코드로 잇지 않는 것도 같은 절에 승인으로 적음 → 위 "달라진 것" 1·2의 [이유 미확인]은 이 승인으로 정해짐
2. **`supplier_families.tsv` 묶음 승인** — 지금 46줄·묶음 16가지 그대로 승인 [확정] (사용자 승인, 2026-10-18, 회고 결정 #2)
   - 넣지 않은 것(웅진·웅진북센, 한국학술정보·(주)학술정보, 북큐브D, 누리미디어 이러닝, 컨텐츠포탈(오디오락)·오디오락 등)은 같은 회사로 확인될 때까지 따로 둠
3. **국가서지 TTL 파일을 다시 받을지** — "지금 다시 받아 둠" [확정] (사용자 선택, 2026-10-18, 회고 결정 #3; [안] "지금은 받지 않음"은 고르지 않음)
   - **남은 일 (아직 안 함)**: 국립중앙도서관 국가서지 LOD 일반도서 전체 파일(약 1.1GB 압축, 지난번 `book_ttl_20260807.zip`)은 이용 설문을 내야 받을 수 있음. 설문 제출과 내려받기는 사용자가 대화에서 "받아"라고 할 때 진행(지난번 설문 내용 `docs/research/ebook-catalog/same-book-isbn.md` 62행). 받으면 dev `data/nlk/ttl`에 두고 다음 가져오기부터 `ttl-path`로 읽으며, 받은 날짜·파일 이름을 이 회고에 적음
   - 그때까지 가져오기는 저장된 원문 표(`stored-bibliography=true`)로 읽음(결과 같음)
4. **남은 잘못 합침 약 0.2%(교보 화면 「북큐브」 공급사 줄)를 언제 고칠지** — 아직 열림 [확인 필요: 사용자에게 질문, 회고 결정 #4]
   - 사용자 질문 "이미 개발된 것 아닌가"에 대한 확인 결과(2026-10-18): **고쳐지지 않음**. dev `plan-feedback.md` "# 사이클 19" 4515행에 "남은 알려진 문제 … plan backlog 후보"로만 있고 그 뒤(사이클 20·21 기록 포함) 고친 기록이 없음. 묶기 코드(`BookGrouping.java`, `CollectedCatalog.java`)에도 교보 화면 「북큐브」 줄을 빼는 규칙이 없음. 저자 칸 `[ ]`(AC-5)도 4527행 "부분 통과, plan 판단(backlog 후보)" 그대로이고, 사이클 21의 대괄호 읽기(4924행)는 추천도서 제목의 권 표기라 다른 일
   - [안] 그대로: 공개 배포는 그대로 하고 backlog(이미 적음)에서 다음 묶기 규칙 사이클 때 다룸(AC-2의 와이투북스 줄이 빠지지 않는 방법과 함께)

## 회고 결정 #3·#4·#5 (2026-10-18)

- #3 국가서지 TTL 다시 받기: 받음 [확정] (사용자: "국가서지는 받아", 2026-10-18). 국립중앙도서관 LOD 「일반도서 데이터셋」 `book_ttl_20260807.zip`(1,102,432,587 바이트, TTL 20개, 풀면 7.7GB, 갱신일 2026-08-07 = 저장된 원문 표와 같은 판), https://lod.nl.go.kr/home/dataset/datadownload.do (2026-10-18 확인), 이용 설문은 지난번과 같은 내용. 사용자 PC `Downloads/nlk-ttl-20260807/`에 받고, dev `data/nlk/ttl`에 푸는 일은 dev 사이클 20 세션에 넘김. 가져오기 설정(`stored-bibliography`)은 그대로
- #5 저자 칸 `[ ]`: 사이클 20 dev 세션의 작은 일로 고침 [확정] (사용자 승인, 2026-10-18, 회고 결정 #5): ① 저자 칸 `[ ]` 꼴을 세어 역할 낱말/이름으로 나눔 ② `Contributors.stripMarks`에 `[ ]`를 더함(역할 낱말이면 역할로 떼고 이름이면 괄호만 뗌) + 시험 ③ 시험 가져오기 표본 확인. 운영 반영은 따로 하지 않고 사이클 17 배포 때 가져오기에 함께. 사이클 19 명세 R1-2("`[ ]`는 그대로")를 이 결정으로 바꿈
- #4 교보 화면 「북큐브」 줄 잘못 합침 약 0.2%: 원인이 달라 백로그에 둠(#5 승인 문구에 포함, 공개 배포는 그대로)
