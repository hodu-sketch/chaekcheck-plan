# 개발 인계서: 사이클 18 소장이 비었거나 덜 모인 도서관

- 기준 문서: plan `docs/cycles/18-empty-library-holdings/design-delta.md`. 구현은 이 문서를 기준으로 합니다. `architect-proposal.md`는 결정 기록일 뿐입니다
- ADR: 0109, 0110, 0111, 0112 (모두 Accepted, 2026-10-14)
- 승인: 이 인계서대로 dev에 넘김 [확정] (사용자 승인, 2026-10-14, `easy/2026-10-14-handoff-review.html` #6). 같은 페이지 결정: 조회 서버 앱도 같은 밑줄 길(#1 미승인 → "같이 해"), "전자책 0권" 검사 자리는 dev가 정하고 보고(#2), 확인 SQL(#3), 22곳 밖 0권은 dev가 알아서 끄고 메모만(#4 사용자 제안), A1·A2 따로 합치고 B는 19 뒤 새 브랜치(#5)
- **dev 순서** [확정] (scope.md "진행 순서", 사용자 "19뒤에 하자", "순서는 상관없어 어짜피 내가 외부에 주소 공개 안 하면 되니까", 2026-10-14)
- **바뀜 (2026-10-14)**: B를 사이클 19보다 먼저 지금 함 [확정] (사용자: "근데 19는 너 다음인데 너가 알아서 마무리하고 이어서 19가 하도록 해야 하는 거 아니야?" → "18 B 지금" (2026-10-14, dev 18 세션에서, `plan-feedback.md` "# 사이클 18")). 처음 결정 "19뒤에 하자"를 바꿈. 19는 18 B가 main에 들어간 뒤 그 위에서 시작(꺼낸 `SiteHosts`·`HoldingRowFilter`, 새 설정 이름). B7 가져오기와 AC-5 비교는 2026-10-12 사본 기준. 아래 B의 "19 뒤", B0의 19 코드 읽기, B7의 "19가 마지막에 쓴 사본"은 이 바뀜을 따름

| 묶음 | 언제 | 내용 |
|---|---|---|
| A | 언제든 (사이클 17과 순서 상관없음) | A1 22곳 끄기(Liquibase, 이유 파일·문서, `gone_known.tsv` 정리). A2 `availability`에 밑줄 호스트 요청 길 |
| B | 사이클 19가 main에 들어간 뒤 | `SiteHosts`·`HoldingRowFilter` 꺼내기, 가져오기가 밑줄 호스트를 읽게, 옛 설정 이름 바꾸기, 시험, 내 PC 가져오기, 넣기 명령 빠진 이유 `no_ebooks`(맨 마지막, 묻지 않음) |
| C | 사이클 17 첫 배포 뒤 | 운영 반영. 끄기 변경 파일이 든 판으로 내보내기 |

- 이 사이클은 화면을 바꾸지 않습니다 [확정] (flow.md). 새 표·칸·API·이벤트·모듈도 없습니다 [확정] (design-delta)

## 요약

서비스에 켜져 있는데 책이 0권인 22곳을 Liquibase 변경 파일 하나로 끄고, 끈 이유를 dev 규칙·기록 파일에 적습니다. 현대제철(2624)은 호스트에 밑줄(`hs_partners.yes24library.com`)이 있습니다. 그래서 두 곳을 고칩니다.
- 가져오기: 밑줄 호스트를 읽게 고쳐 전자책 241권을 넣습니다
- 대출 조회·직접 찾기: 밑줄 호스트에는 새 요청 라이브러리 하나로 따로 만든 길을 씁니다(SNI 없이, 인증서 이름 검사는 켬)

새 도서관 넣기 명령은 가져오기와 같은 거르기 규칙으로 줄 수를 세어, 0줄인 곳을 빠진 이유 "전자책 0권"으로 뺍니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.**
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) 조용히 바꾸지 마세요. 먼저 사용자에게 알리고, 무엇을 왜 바꿨는지 dev `docs/plan-feedback.md`의 새 **`# 사이클 18`** 절에 적습니다. 사용자 발언이면 그대로 옮깁니다.
- `[안]`·`[안 이름]`·`[안 경로]`는 dev가 코드에 맞춰 바꿀 수 있습니다 [확정] (design-delta, 설계 결정 #7). 바꾸면 `# 사이클 18` 절에 알리기만 합니다.
  - 해당 예: `SiteHosts`, `HoldingRowFilter`, `importableRows`, 빠진 이유 키 `no_ebooks`, availability 쪽 호스트 읽기·요청 클래스 이름, changeset id, Liquibase 파일 번호, 시험 클래스 이름, `library-site-issues.md` 새 절 번호
  - **바꾸지 않는 것** [확정]
    - 끌 22곳 번호
    - 보고서 문구 "전자책 0권"과 빠진 이유 순서(기존 6개 다음 맨 마지막)
    - 넣기 명령이 "전자책 0권"을 사용자에게 묻지 않고 종료 코드도 그대로인 것
    - 밑줄 길의 네 조건(아래 C3)
    - 모듈 사이 의존 방향
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 확정된 것처럼 코드에 넣지 말고 `TODO(확인 필요)`로 둔 뒤 확인하고 보고합니다
- 단계마다 통과해야 다음 단계로 갑니다: `backend/`에서 `./gradlew build`(`ModularityTests`·`DocumentationTests` 포함). 웹은 바꾸지 않으므로 `web/` 명령은 회귀 확인용으로만 돌립니다 조회 서버 앱을 고친 단계(A2-7)는 `fetch-service/`에서도 `./gradlew build`를 돌립니다
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`), `docs/library-maintenance.md` 기록 규칙, 사이클 05~15 인계서의 제약을 그대로 따릅니다. 아래에는 더하거나 바뀌는 것만 적습니다

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/18-empty-library-holdings/design-delta.md`: **기준 문서** (모듈 표, 데이터, 외부 연동, 시험 표, 확인 필요)
- `.../18-empty-library-holdings/spec.md`: R1~R5, 상태별 동작, AC-1~AC-8
- `.../18-empty-library-holdings/research.md`: 22곳 원인과 사이트 원문(2절), 밑줄 호스트 조사(5절)
- `.../18-empty-library-holdings/scope.md`, `flow.md`, `architect-proposal.md`(결정 2 근거: JDK `checkURI`)
- `.../15-usage-log/to-cycle-18.md` 3·4번: 옛 설정 이름, 19와 가져오기 따로
- ADR (`../chaekcheck-plan/docs/adr/`): 0109, 0110, 0111. 관련: 0078(운영 반영), 0095(사이클 17 나가는 길·User-Agent), 0107(넣기 명령)
- dev 쪽 출발점: `docs/plan-feedback.md` 절 "# 다음 사이클 후보: 소장이 비었거나 덜 모인 도서관"(3491행 부근, 22곳 표)
- dev 조회 서버 앱: `fetch-service/src/main/java/com/chaekcheck/fetch/UrlGuard.java`(42·47행 부근 `getHost()`와 DNS 조회), `LibraryClient.java`(55행 부근 `HttpRequest.newBuilder`, 98행 부근 로그)

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0109 | 이미 켜진 도서관은 `library`의 새 Liquibase 변경 파일로 끕니다. 내 PC와 운영에 같은 판으로 들어갑니다. 이유는 `disabled_reasons.tsv`·`library-site-issues.md`에 적습니다. 반영할 때는 끄기 파일이 든 판으로 내 PC를 띄운 뒤 내보냅니다 |
| 0110 | 넣기 명령은 새 곳마다 가져오기와 같은 거르기 규칙(한 벌)으로 줄 수를 세고, 0이면 "전자책 0권"으로 뺍니다. 기존 6개 다음 맨 마지막에 보고, 묻지 않으며, 이미 서비스에 있는 곳에는 적용하지 않습니다 |
| 0111 | 밑줄 호스트는 두 갈래로 다룹니다. `collection`은 밑줄을 받는 호스트 읽기를 씁니다. `availability`는 따로 만든 요청 길(새 라이브러리 하나, 시제품으로 고름)을 씁니다. SNI 없이, 인증서 이름 검사는 켜고, 실패하면 그 도서관 줄만 실패합니다 |
| 0112 | 조회 서버 앱(`fetch-service`)에도 같은 밑줄 길. `UrlGuard`는 `LibraryClient`가 연결할 이름으로 DNS를 풀어 내부망이면 거부, 사용자 정보 든 주소 거부 유지. 같은 라이브러리·같은 조건, 의존성은 앱마다 하나 |

## 지켜야 할 제약

- **C1. 모듈 경계** [확정] (design-delta "모듈")
  - 바뀌는 곳은 `library`(Liquibase만), `collection`(내부만), `availability`(내부만), 그리고 따로 도는 앱 `fetch-service`(`UrlGuard`·`LibraryClient`, 별도 Gradle 빌드)입니다 [확정] (사용자: "같이 해 굳이 왜 나눠서 해 조회 서버도 같이 해", 2026-10-14)
  - 공개 API·이벤트·모듈 의존은 바뀌지 않습니다. 공용(shared/common) 모듈은 만들지 않습니다
  - 호스트 읽기는 `collection`과 `availability`가 각자 안에 둡니다(서로 부르지 않음, 설계 결정 #4)
- **C2. Liquibase** [확정] (ADR-0109, dev `CLAUDE.md`)
  - 새 파일 하나만 더하고, 기존 changeset(`010` 포함)은 고치지 않습니다
  - dev에 `PRE_DEPLOYMENT` 표시 파일이 있어도(plan 읽기 2026-10-14: 있음) 이 사이클은 기존 changeset을 고치지 않습니다(사이클 15 인계서와 같은 규칙)
  - master에는 합치는 순서대로 끝에 붙입니다. 나중에 합치는 쪽이 rebase해서 자기 include를 맨 끝으로 옮깁니다(사이클 15·16·17·19도 master 끝에 더할 수 있음)
- **C3. 밑줄 요청 길의 네 조건** [확정] (설계 후속 #2)
  1. 밑줄 호스트로 실제 요청이 됩니다
  2. 지금 길과 같은 연결 시간·읽기 시간·전체 시간 제한, 응답 크기 제한, `LibrarySiteTls.sslContext()`를 씁니다
  3. 새 라이브러리는 하나만 들입니다(본 서비스와 조회 서버 앱이 같은 라이브러리를 씀)
  4. 인증서 이름 검사를 끄지 않습니다

  더해서 SNI는 보내지 않습니다 [확정] (설계 후속 #3). 지금 길처럼 redirect를 따르지 않고, 같은 User-Agent를 쓰고, 같은 로그 한 줄을 남깁니다 [안]. 첫 후보는 Apache HttpClient 5입니다(밑줄 호스트를 받는지는 확인 못 함 [확인 필요: 시제품])
- **C4. 실패는 그 줄만** [확정] (설계 후속 #4)
  - 밑줄 길이 실패하면(인증서 검사 실패, 시간 초과 등) 그 도서관 줄만 "대출 가능 여부 확인 필요"가 됩니다
  - 다른 도서관 줄·묶음·직접 찾기에는 영향이 없습니다
  - `HostThrottle.key`·`Candidate.hostKey`의 NPE를 없앱니다
- **C5. 사이클 17 규칙을 따름** [확정] (design-delta 검토 #1). 사이클 17이 사이트 요청 부품에 넣는 것(ADR-0095: 나가는 길 고르기, IP별 셈, User-Agent, 멈춤 규칙)을 밑줄 길도 똑같이 따릅니다. 순서는 상관없고, 나중에 main에 합치는 쪽이 맞춥니다
- **C6. 도서관 사이트 호출 예절** (dev `library-maintenance.md` 2절)
  - 시제품·실제 확인 요청은 사람 손 속도로 몇 건만 보냅니다. 같은 호스트 간격(지금 `host-min-interval`)을 지킵니다
  - 교보 구독형 서버(`*.dkyobobook.co.kr`, 1045·1131·1620·2023)에는 요청하지 않습니다 [확정] (research.md 1절, 사이클 13)
- **C7. 기록 규칙** (dev `CLAUDE.md` "Library Research Record"): 끈 곳마다 원문과 확인일을 `library-site-issues.md`에, 끈 날·이유를 `library-maintenance.md` 6-2와 `disabled_reasons.tsv`에 같은 작업 안에서 적습니다

## 개발 시작 전 확인

### dev가 확인할 것
- [ ] base package `com.chaekcheck` [확정] (dev `CLAUDE.md`)
- [ ] 사이클 13이 main에 들어갔는지 [확정: 들어감, 2026-10-14 dev 13 세션 알림]. 시작 커밋을 `# 사이클 18` 절에 적습니다
- [ ] `library/` 마지막 파일 번호. plan 읽기(2026-10-14)로는 `015-library-name-1215.yaml`이 마지막이라 새 파일은 `016` [안]. 다른 사이클이 먼저 더했으면 그다음 번호
- [ ] master 맨 끝 include. plan 읽기(2026-10-14)로는 `# cycle 14` + `picks/001-picks-schema.yaml`(93-94행 부근). 15·16이 먼저 들어갔으면 그 뒤
- [ ] 사이클 15·17이 `availability` 사이트 요청 쪽(`DirectSiteFetcher`, `LibraryPageFetcher`, `AvailabilityConfiguration`)을 이미 바꿨는지. 바뀌었으면 A2를 그 위에 얹습니다(C5)
- [ ] (B 시작 때) 사이클 19가 main에 들어갔는지, 19가 `CollectedCatalog`·`CatalogImporter`를 어떻게 바꿨는지 [확인 필요: 19 합친 뒤 코드 읽기]

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 현대제철 시제품 요청 승인(몇 건, 사람 손 속도) | A2-1 | 승인 |
| 22곳 중 하나를 "내 도서관"에 넣어 둔 계정으로 "쓸 수 없는 도서관" 확인(또는 dev가 시험 계정으로) | A1 확인 | 보이는지 |
| 2624를 "내 도서관"에 직접 추가한 계정으로 직접 찾기·검색 확인(2624는 `MEMBERS_ONLY`라 직접 추가했을 때만 조회 계획에 들어감) | A2 끝, B 끝 | 보유·대출 수가 보이는지 |
| 운영 반영 승인 | C | 승인 |

## 구현 단계

### 0단계: 시작 점검 (코드 변경 없음)

1. **작업 폴더와 브랜치** (dev의 평소 방식, 사이클 13·14와 같음)
   - 다른 사이클(15·16·17·19)이 같은 작업 폴더에서 돌고 있으면 따로 git worktree를 만듭니다. 예: `../chaekcheck-dev-c18` [안 경로], 브랜치 `cycle-18-empty-library-holdings` [안 이름]
   - docker는 프로젝트 이름을 따로 씁니다(`docker compose -p chaekcheck-c18 …` [안]). 포트는 13(5442~5444)·14(5452/5453/8082/5176)와 겹치지 않게 dev가 정합니다 [안]
   - 원래 프로젝트 `chaekcheck`과 다른 사이클의 docker 프로젝트는 켜고 끄지 않습니다
   - 따로 만든 DB에는 원래 서비스 DB를 한 번 복사합니다(사이클 14 방법, 원래 DB는 읽기만). 복사하지 않고 원래 `db`를 쓰려면 사용자에게 먼저 묻습니다
   - A·B·C는 때가 달라 따로 합쳐도 됩니다. A1·A2를 각각 main에 합치고, B는 19 뒤 새 브랜치에서 하는 방식을 권합니다 [안]
2. **기준 빌드**: 시작 커밋에서 `./gradlew build`(backend)를 돌려 통과를 확인합니다. 실패하면 이 사이클 작업 전에 기록하고 사용자에게 알립니다 `fetch-service/`의 `./gradlew build`도 같이 돌려 둡니다
3. **기준 수치 기록** (`# 사이클 18` 절에): 내 PC 서비스 DB에서 다음을 셉니다(아래 AC-1 SQL)
   - 켜진 0권 도서관 수
   - `GET /api/v1/libraries`의 도서관 수(plan 읽기: 2,658곳, 2026-10-14)
   - 마지막 `collection.catalog_import` 기록의 `detail_url_not_http` 수(plan 읽기: 기록 9번 283)
- 위험: 낮음

### A1: 22곳 끄기 (언제든, 의존: 0단계)

1. **Liquibase 변경 파일** (`backend/src/main/resources/db/changelog/library/016-library-disabled-cycle18.yaml` [안 번호·이름])
   - changeset id `library-016-disabled-cycle18` [안], author `chaekcheck`(010과 같음)
   - SQL [확정] (spec R1, design-delta "데이터"): `UPDATE library.library SET enabled = false, updated_at = now() WHERE id IN (44, 112, 168, 261, 269, 305, 318, 323, 378, 425, 455, 514, 537, 622, 623, 625, 626, 721, 1045, 1131, 1620, 2023)`
   - 머리 주석(010처럼) [안]: 사이클 18, ADR-0109, 사용자 결정 2026-10-14. 아래 원인 묶음과 `library-site-issues.md` 새 절 번호도 적습니다
     - 오디오북만 있음 14
     - 사이트에 책이 없음 1(323)
     - 교보 구독형, 2026-10-04 수집 때 0권 4
     - 수집 안 함으로 알려짐 2(44, 269)
     - 다른 사이트로 옮김 1(261 = 46번)
   - master 맨 끝에 `# cycle 18: libraries with no e-books turned off (ADR-0109)` 주석 + include [안 문구·위치] (C2)
2. **`scripts/library/disabled_reasons.tsv`**: 22줄을 더합니다 [확정] (spec R1-3)
   - 열 `library_id, name, disabled_on, reason, source`
   - `disabled_on`은 작업한 날, 이름은 서비스 DB `library.library` 값
   - `reason`은 원인과 원문 요약입니다. 교보 구독형 4곳에는 "다른 IP에서 다시 받을 때 책이 있으면 다시 켬"(spec R1-4)을 붙입니다
   - `source`는 `library/016…`, `library-site-issues.md` 새 절, "사용자 결정 2026-10-14"
3. **`scripts/library/rules/gone_known.tsv`**: 44·261·269 줄을 지웁니다(머리 줄은 남김) [확정] (설계 결정 #2)
4. **`docs/library-site-issues.md`**: 새 절을 하나 둡니다(예 "11. 전자책이 0권이라 끈 곳 (2026-10-14, 사이클 18)" [안 번호])
   - 22곳마다 번호·이름·주소·원인·사이트 원문·확인일을 적습니다 [확정] (범위 결정 #4, AC-7)
   - 원문은 plan `research.md` 2절에서 옮깁니다. 원문 예는 다음과 같습니다
     - 정관도서관 "전체 (2,982종) / 오디오북 (2,982종)", 상관중 "전체 (463종) / 오디오북 (463종)"
     - 455·721 BookLive "10월의 오디오북"
     - 323 "전체 (0종)"
     - 교보 구독형 4곳 "2026-10-04 수집 사이트 권수 0"
     - 44·269·261은 수집 DB `crawl_skip` 문구
   - research.md에 원문이 따로 없는 오디오북 곳(112·168·305·318·425·514·622·623·625·626)은 dev가 사이트 첫 화면을 한 번씩 열어 분류 메뉴 글을 옮깁니다(C6, 사람 손 속도). 교보 구독형 4곳은 열지 않습니다 [안]
   - 열리지 않으면 수집 DB 근거(모은 줄이 모두 `AUDIOBOOK`)를 적고 보고합니다
   - 305와 168은 같은 기관(군산교육문화회관 대야분관)이라고 적습니다. 261은 46번 군포시중앙도서관과 같은 사이트라고 적습니다
5. **`docs/library-maintenance.md`**
   - 6-2 "꺼 둔 도서관" 표에 22줄을 더합니다 [확정] (design-delta 검토 #2)
   - 13절 작업 기록에 한 줄 [안]
6. **`docs/maintenance/3-import.md`** 반영 절차에 한 줄을 넣습니다 [확정] (design-delta 검토 #2): "끄기 변경 파일이 든 판으로 내 PC를 띄운 뒤 내보내기. 끄기 전 판으로 내보내면 반영 비교가 mismatch로 멈춤"
7. **적용과 목록 다시 만들기**
   - 새 판으로 앱을 한 번 띄워 내 PC `db`에 변경 파일을 적용합니다. `db-test`는 빌드 때 적용됩니다
   - 서비스 표를 내보내고 `scripts/library/list_left_out.py`로 `docs/library-left-out.md`를 다시 만듭니다. B절은 8곳에서 27곳(끈 27)이 되고 B-2(`gone_known`)는 0곳이 됩니다 [확정] (spec R1-3)
   - `--report`·`--snapshot`은 마지막에 쓴 넣기 보고서·사본을 씁니다 [안]
   - `disabled_reasons.tsv`만으로 22곳이 나오는지 봅니다 [확인 필요: 실행]
- 테스트
  - `LibraryDisabledCycle18Tests` [안 이름] (`db-test`, MockMvc)
    - Liquibase 적용 뒤 22곳이 모두 `enabled=false`이고 다른 도서관 수는 바뀌지 않습니다
    - `GET /api/v1/libraries` 응답에 22곳이 없습니다(AC-2)
  - "쓸 수 없는 도서관" 회귀(AC-3): 지금 꺼진 도서관 시험이 있으면 22곳 중 하나(예 323)로 한 경우를 더합니다. 없으면 my-libraries API 시험에 한 경우를 더합니다 [안]
  - 화면은 바뀌지 않습니다. Playwright 데스크톱 1280에서 "내 도서관 관리"의 쓸 수 없는 도서관 표시와 도서관 고르기 목록에 22곳이 없는지 한 번 봅니다 [안]
- 확인: AC-2, AC-3, AC-7. AC-1은 아직 아닙니다(2624는 B 뒤에 0권이 아니게 됨)
- 위험: 낮음

### A2: 밑줄 호스트 요청 길 (`availability`, 언제든, 의존: 0단계. A1과 따로)

1. **시제품** (먼저 하고 결과를 `# 사이클 18` 절에 적은 뒤 2~6으로 갑니다)
   - 시험 쪽 일회용 실행기를 만듭니다. 이름 예 `UnderscoreHostProbe` [안]. 환경 변수가 있을 때만 돌고 빌드에서는 돌지 않습니다
   - 사용자 승인 뒤 2624 사이트(`https://hs_partners.yes24library.com`)에 몇 건 요청합니다(C6)
   - 확인할 것 [확인 필요: 시제품]
     - 고른 라이브러리(첫 후보 Apache HttpClient 5)로 요청이 실제로 나가고 응답을 받는지
     - SNI가 나가지 않는지
     - 인증서 이름 검사가 `*.yes24library.com`에 대해 켜진 채 통과하는지
     - C3의 시간 제한·응답 크기 제한·`LibrarySiteTls.sslContext()`를 그대로 걸 수 있는지
     - `Yes24V2Adapter.searchUri`의 `UriComponentsBuilder…toUri()`가 밑줄 호스트에서 예외를 내는지(네트워크 없이 단위 시험으로)
     - 지금 코드가 밑줄 호스트에서 어디서 어떻게 실패하는지(spec R3-2): `Candidate.hostKey` NPE, `checkedUri` null, `HttpRequest.newBuilder`의 IAE 등
   - 네 조건 중 하나라도 못 맞추면 다른 라이브러리를 시험합니다. 끝내 못 맞추면 멈추고 보고합니다. **인증서 이름 검사를 끄는 쪽으로 가지 않습니다** [확정]
   - 의존성은 `backend/build.gradle`에 하나만 더합니다. 버전을 Spring Boot 의존성 관리가 정해 주는지 [확인 필요: 공식 문서·Context7]
2. **`availability` 안 호스트 읽기** (`availability/internal/fetch/` 안 새 클래스, 예 `SiteHostNames` [안 이름])
   - `getHost()`가 있으면 그 값을 소문자로 씁니다(지금과 같음). 없으면 raw authority에서 사용자 정보·포트를 떼고 밑줄을 받아 읽습니다
   - 그래도 없으면 NPE 대신 `UpstreamException.error`를 냅니다(그 줄만 실패, C4)
   - 쓰는 곳
     - `HostThrottle.key`·`hostPort` (`HostThrottle.java`): 밑줄 호스트도 호스트별 간격을 그대로 받습니다
     - `Candidate.hostKey` (`availability/internal/search/Candidate.java`)
     - `DetailPageFetcher.checkedUri` (`availability/internal/resolve/DetailPageFetcher.java`): 밑줄 호스트끼리 같으면 통과합니다
     - `DirectSiteFetcher` 로그·예외 문구의 `uri.getHost()`
   - `collection`의 `SiteHosts`와 코드를 나누지 않습니다(C1)
3. **밑줄 길** (`availability/internal/fetch/`)
   - 새 `SiteFetcher` 구현을 둡니다. 예 `UnderscoreHostSiteFetcher` [안 이름], 1에서 고른 라이브러리를 씁니다
   - 갈래는 `DirectSiteFetcher` 앞에서 고릅니다. 예 `HostRoutingSiteFetcher` [안], 또는 `DirectSiteFetcher` 안에서 [안]
   - 조건은 "`getHost()`가 null이고 읽은 호스트에 `_`가 있음"입니다 [안]. 나머지는 지금 길 그대로입니다
   - 설정은 지금 길과 같은 값(`AvailabilityProperties`의 `connectTimeout`·`readTimeout`·`totalTimeout`·`maxBodySize`·`userAgent`)을 씁니다. redirect는 따르지 않습니다. 그 밖에 C3을 지킵니다
   - 오류 구분은 `DirectSiteFetcher`와 같게 합니다: 시간 초과는 TIMEOUT, 크기 초과·입출력 오류·인증서 실패는 ERROR
   - 로그는 같은 모양 한 줄(`upstream via=… host=… path=… status=… userAgent=…`)입니다. `via` 값은 [안]: 지금 `direct` 그대로, 또는 구분 값. 사이클 15의 도서관 응답 하루 요약이 `via`를 쓰면 그쪽과 맞춥니다
   - 구성은 `AvailabilityConfiguration.siteFetcher`의 direct 갈래에 둡니다. 조회 서버(`fetch-service`) 모드는 아래 7에서 같은 길을 조회 서버 앱에 넣습니다 [확정] (사용자: "같이 해 굳이 왜 나눠서 해 조회 서버도 같이 해", 2026-10-14)
4. **주소 만들기**: 1에서 `toUri()`가 밑줄 호스트에서 예외를 내면, 2624가 쓰는 `Yes24V2Adapter.searchUri`·`detailUri`가 한 인자 `URI` 생성(registry-based authority 허용)으로 주소를 만들게 고칩니다 [안]. 같은 모양의 다른 어댑터(`Yes24V1`·`V3`, `Kyobo*`, `Bookcube*`, `ElibPortalV1`, `GangnamV1`, `AladinV1`(`base.getHost()`))는 한 줄로 같이 고칠 수 있으면 같이 고칩니다. 아니면 목록만 보고합니다 [안] (spec R3-3)
5. **지금 길 방어**: `DirectSiteFetcher.fetch`에서 `HttpRequest.newBuilder(uri)`의 `IllegalArgumentException`을 잡아 `UpstreamException.error`로 바꿉니다. 갈래에 안 걸린 다른 못 읽는 주소도 그 줄만 실패하게 합니다 [안] (architect 결정 2 근거)
6. **사이클 15·17과 합치기** (C5)
   - 17의 나가는 길 고르기·IP별 셈·User-Agent(ADR-0095)가 main에 있으면 밑줄 길도 같은 길·셈·User-Agent·멈춤 규칙을 씁니다
   - 17이 나중에 들어오면 17 쪽이 밑줄 길에도 적용합니다
   - 사이클 15의 도서관 응답 하루 요약 기록도 밑줄 길에서 같은 방식으로 남는지 봅니다
   - 프록시를 거치는 경우 새 라이브러리 설정 방법 [확인 필요: 합칠 때]
7. **조회 서버 앱(`fetch-service/`)에도 같은 길** [확정] (사용자: "같이 해 굳이 왜 나눠서 해 조회 서버도 같이 해", 2026-10-14)
   - 조회 서버는 본 서비스와 따로 도는 앱이고, 지금 첫 배포에서는 꺼 둡니다(사이클 17). 그래도 이번에 같은 밑줄 길을 넣습니다
   - `UrlGuard`(`fetch-service/.../UrlGuard.java`): 지금은 `getHost()`가 null이면 거절합니다. 밑줄 호스트도 읽게 하되, 그 이름을 DNS로 풀어 사설·내부 주소를 막는 검사는 그대로 둡니다 [안] (지금 있는 보호를 그대로 둠)
   - `UrlGuard` 보안 규칙 [확정: 지금 보호 유지] (설계 검토 2차): 밑줄 호스트를 읽는 방법은 `LibraryClient`가 실제로 연결할 이름과 같은 값이어야 하고, 그 이름으로 DNS 조회해 사설·내부 주소면 거부합니다. 사용자 정보(`getRawUserInfo()`)가 든 주소 거부도 그대로입니다. 시험에 "밑줄 이름이 사설 주소로 풀리면 거부"를 넣습니다
   - `LibraryClient` 로그 한 줄(98행 부근 `uri.getHost()`)도 밑줄 호스트에서 null이 찍히지 않게 읽은 호스트를 씁니다
   - `LibraryClient`(`HttpRequest.newBuilder`): 밑줄 호스트는 본 서비스와 같은 라이브러리·같은 네 조건(C3)으로 보냅니다. 조회 서버의 `LibrarySiteTls`·`TlsCompatibility`·`BodyLimit`·로그 한 줄 모양을 그대로 씁니다 [안]
   - 조회 서버는 별도 앱이라 의존성도 그 앱의 `build.gradle`에 하나 더합니다. 본 서비스와 같은 라이브러리를 쓰는 것은 [확정](C3), 어느 라이브러리인지는 A2-1 시제품 뒤 정함
   - 본 서비스가 조회 서버로 보낼 때(`FetchServiceSiteFetcher`) 밑줄 주소가 그대로 넘어가는지 봅니다
   - 시험: `UrlGuard` 밑줄 호스트 통과·사설 주소 막기 유지, `LibraryClient` 밑줄 갈래(가짜 서버), 본 서비스 → 조회 서버 → 가짜 사이트 한 번(가능하면)
   - 실제 확인: 조회 서버를 내 PC에서 켜고(사용자 승인) 2624 직접 찾기 한 번 [안]
- 테스트 (진짜 사이트 없음)
  - `SiteHostNamesTests` [안]: 보통 호스트는 `getHost()`와 같고, `hs_partners.yes24library.com`도 읽습니다. 포트·사용자 정보 떼기, 대문자, 호스트 없음은 예외입니다
  - `HostThrottleTests`에 더함: 밑줄 주소 키가 NPE 없이 나오고, 같은 밑줄 호스트의 다른 포트는 한 칸을 나눕니다
  - `DetailPageFetcher.checkedUri` 시험: 밑줄 기준 주소 + 같은 밑줄 상세 주소는 URI, 다른 호스트는 null
  - `UnderscoreHostSiteFetcherTests` [안]
    - 로컬 시험 서버를 둡니다. 라이브러리의 DNS 바꾸기로 밑줄 이름을 127.0.0.1로 돌리는 등 방법은 dev가 정합니다 [안]
    - 확인: User-Agent 헤더, 3xx를 따르지 않음, 읽기 시간 초과는 TIMEOUT, 크기 초과는 ERROR
    - 가능하면 로컬 HTTPS(시험용 자체 서명, 시험 안에서만 신뢰)로 이름이 맞는 인증서는 통과, 다른 이름은 ERROR인지와 SNI가 나가지 않는지 봅니다. 어려우면 1의 시제품 기록으로 대신하고 보고합니다 [안]
  - 갈래 시험: 밑줄 주소는 새 길, 보통 주소는 지금 길(가짜 fetcher)
  - 실패 가두기: `BatchRunner` 시험에서 밑줄 도서관 하나가 실패해도 다른 도서관 줄·묶음은 그대로입니다(C4)
  - 4를 고쳤으면 `Yes24V2AdapterTests`에 밑줄 기준 주소 경우를 더합니다
  - `ModularityTests` 그대로 통과
- 실제 확인 (사용자 승인 뒤, 내 PC `bootRun`, direct 모드): 2624를 "내 도서관"에 직접 추가한 계정으로 "도서관에서 직접 찾기"에서 현대제철 책 제목(예 「1984」)을 찾으면 보유·대출 수가 나옵니다. 로그에 밑줄 길 요청 한 줄, NPE 없음, 간격을 지켰는지 봅니다
- 확인: AC-4의 조회 부분(검색 결과에 나오는 부분은 B 뒤)
- 위험: 높음 (새 라이브러리, TLS 설정 두 벌, 실제 통과는 시제품에 달림)

### B: 가져오기 고침과 넣기 "전자책 0권" (사이클 19가 main에 들어간 뒤, 의존: A1·A2가 main에 있으면 좋음, 둘 다 없어도 B는 빌드·시험 가능)

0. 19가 합쳐진 main에서 새 브랜치를 만들고 기준 빌드를 돌립니다. 19가 바꾼 `CollectedCatalog`(`skipReason`, 줄 읽기 SQL 열 순서)를 읽고 아래 이름·자리를 맞춥니다 [확인 필요: 19 코드]
1. **`SiteHosts`** (`backend/src/main/java/com/chaekcheck/collection/internal/SiteHosts.java` [안 이름·위치], `importer`·`libraryinsert` 둘 다 쓰므로 public)
   - `LibraryInsertPlanner.host`(365행 부근, 이미 밑줄을 받음)를 옮깁니다
   - `CollectedCatalog.httpHostOf`(http(s) 검사는 그대로), `hostOf`, `sameSite`가 씁니다
   - 보통 호스트에서는 결과가 지금과 같아야 합니다
2. **`HoldingRowFilter`** (`backend/src/main/java/com/chaekcheck/collection/internal/importer/HoldingRowFilter.java` [안], 모듈 안 public)
   - `CollectedCatalog.skipReason`(214행 부근)을 값으로 받는 함수로 꺼냅니다. 예 `skipReason(removedAt, contentType, contentKind, detailUrl, title, libraryHost)` [안]
   - 판정 순서는 그대로입니다: `removed` → `kind_*` → `kind_sound_video` → `no_detail_url` → `detail_url_not_http` → `detail_host_mismatch` → `no_title`
   - `EXCLUDED_KINDS`·`SOUND_VIDEO_KINDS`도 함께 옮깁니다. `CollectedCatalog`는 이 함수를 부릅니다
3. **넣기 명령이 줄을 셈** (`collection/internal/libraryinsert/CollectedLibraries.java`)
   - 예 `importableRows(collectionId, libraryHost)` [안]: 그 도서관의 `holding` 줄(지운 표시·종류·소리영상 종류·상세 주소·제목)을 읽고 `HoldingRowFilter`를 통과한 수를 셉니다
   - 기존 6개 이유를 통과한 새 곳만 셉니다
4. **빠진 이유 `no_ebooks`** (`LibraryInsertPlanner.java` 102·172행 부근) [확정: 순서·문구·묻지 않음 / 안: 키 이름]
   - 이유 목록 맨 뒤에 `no_ebooks`를 둡니다
   - `leftOutReason`이 null(1~6 통과)인 새 곳만 셉니다. 셀 때 쓰는 도서관 호스트는 넣을 때 쓸 주소(`final_origins.tsv` 값, 없으면 수집 주소)의 호스트(`SiteHosts`)입니다
   - 0줄이면 `leftOut[no_ebooks]`에 넣고 넣을 곳에서 뺍니다
   - 이 검사를 `library_kinds`·`final_origins` 없음 오류 검사보다 앞에 둘지 뒤에 둘지는 dev가 정하고 보고합니다 [안]. 앞에 두면 0권 곳 때문에 규칙 파일 오류로 멈추지 않습니다
   - 보고서·종료 코드는 그대로이고 묻지 않습니다(ADR-0110). 교보 대여·혼합 판정이 먼저입니다(바뀌지 않음)
   - `scripts/library/list_left_out.py` 이유 표(48-56행 부근)에 `('no_ebooks', '전자책 0권', …)` 한 줄을 더합니다 [안 설명 문구]
5. **옛 설정 이름 바꾸기** [확정: 바꿈 / 새 이름은 dev가 정함] (12·13·14 회고 결정 #14)
   - 바꿀 곳
     - 설정 `chaekcheck.collection.import.exclude-candidate-libraries`
     - Java `Settings.excludeCandidateLibraries`, `CatalogImporter.excludeCandidateLibraries(boolean)`, `CatalogImportRunner`(67·73·99-100·120행 부근)
     - `CollectedCatalog.EXCLUDED_CANDIDATE`·`FIRST_CANDIDATE_ID`와 주석
     - `CatalogImportSettingsTests`
     - `docs/maintenance/3-import.md` 41행
   - 건너뜀 이유 문자열 `library_excluded_candidate`와 로그 `candidate libraries excluded: N`도 같이 바꾸기를 권합니다 [안]. 지난 `catalog_import` 기록의 문자열은 그대로 둡니다
   - 새 이름 예 `exclude-cycle07-libraries` [안 예시]. 지금 문서에서 쓰지 않는 "후보" 말이 들어가지 않게 합니다
6. **넣기 절차 문서** (`docs/maintenance/1-libraries.md`) 한 줄 [확정] (설계 결정 #6): "보고서의 전자책 0권 목록에서 넣을 주소가 바뀐 곳은 사이트를 열어 확인"
7. **내 PC 가져오기** (`docs/maintenance/3-import.md` 절차, A1이 적용된 판)
   - 사본은 사이클 19가 마지막에 쓴 사본을 씁니다 [안]. 그래야 AC-5 비교가 맞습니다
   - 먼저 같은 사본으로 바꾸기 전 판 dry run과 바꾼 뒤 판 dry run을 비교합니다. 건너뜀 이유 수는 2624 줄을 빼면 같아야 합니다(`HoldingRowFilter` 같음 확인)
   - 그다음 진짜 가져오기를 하고 기록 줄을 봅니다
- 테스트
  - `SiteHostsTests` [안]: 밑줄, 포트, 사용자 정보, 대문자, `LibraryInsertPlanner.host` 기존 시험을 옮깁니다
  - `HoldingRowFilterTests` [안]: 각 이유와 순서. 밑줄 상세 주소 + 같은 밑줄 도서관 호스트는 통과합니다
  - 가져오기 시험(기존 `CollectedCatalog`·`CatalogImporter` 시험 사본에 밑줄 호스트 도서관을 더함): 전자책 줄이 들어오고 `detail_url_not_http`로 빠지지 않습니다(AC-5)
  - 넣기 미리 보기 시험(`LibraryInsertPlanner`/명령 시험, 시험 수집 사본) [확정] (design-delta 시험 표, 설계 결정 #6)
    - ① 오디오북만 있는 새 곳 → 보고서 "전자책 0권"
    - ② 넣을 주소와 책 주소 호스트가 다른 새 곳 → "전자책 0권"
    - ③ 밑줄 주소인데 전자책이 있는 새 곳 → 넣음
    - insert 뒤 ①②는 서비스 `library.library`에 없고 ③은 있습니다(AC-6)
    - 기존 1~6 이유 시험이 그대로 통과하고, 교보 대여·혼합은 `no_ebooks`가 아닙니다
  - `CatalogImportSettingsTests`: 새 이름으로 같은 동작, dry run 전용 검사 그대로
  - `ModularityTests`·`DocumentationTests` 그대로 통과
- 측정: 2026-10-12 사본으로 미리 보기를 돌려 줄 세기에 걸린 시간을 잽니다(새 곳이 많을 때) [확인 필요: 시제품]. 느리면 보고만 합니다
- 확인: AC-1(A1과 B7 둘 다 끝난 뒤), AC-4(검색 결과 + 조회, A2가 main에 있을 때), AC-5, AC-6
- 위험: 중간 (19와 같은 파일, 가져오기 판정이 바뀌면 안 됨)

### C: 운영 반영 (사이클 17 첫 배포 뒤, 의존: A1·B, 17)

1. 운영 서버가 `016` 변경 파일(A1)이 든 판인지 봅니다
   - A1이 17 첫 배포 전에 main에 들어갔으면, 첫 배포 때 운영 DB에 이미 들어갑니다
   - 17이 운영 DB를 처음 채우는 방법(seed·책 목록 복사)에 따라 끄기가 어떻게 들어가는지 봅니다 [확인 필요: 17 인계서·개발 결과]
2. 보통 반영(ADR-0078, `3-import.md` 13절)을 합니다
   - 내 PC를 그 판으로 띄움 → B의 가져오기 결과로 내보내기(`export`) → 운영 `apply` → 성공하면 내 PC `finish`
   - 끄기 전 판으로 내보내면 반영 비교가 `mismatch`로 멈춥니다(A1-6 문서 줄)
3. 운영 DB에서 AC-1 SQL을 돌립니다(AC-8). 운영 `GET /api/v1/libraries`에 22곳이 없는지도 봅니다
- 위험: 중간 (판이 다르면 mismatch로 멈춤. 멈추면 `failure_detail`을 보고 판을 맞춤)

## 테스트

- 단위: `SiteHostNames`(availability), `SiteHosts`·`HoldingRowFilter`(collection), `HostThrottle` 키, `checkedUri`, 갈래, 어댑터 주소 만들기
- 통합(`db-test`): `LibraryDisabledCycle18Tests`, my-libraries 회귀, 넣기 미리 보기 ①②③, 가져오기 밑줄 도서관, `CatalogImportSettingsTests`, `BatchRunner` 실패 가두기, `ModularityTests`(모듈 의존 바뀌지 않음), `DocumentationTests`, 기존 시험 전부 / 조회 서버 앱(`fetch-service/` 빌드): `UrlGuard` 밑줄 통과·사설 주소 거부·사용자 정보 거부, `LibraryClient` 밑줄 갈래, 본 서비스 → 조회 서버 → 가짜 사이트(가능하면)
- 시제품·실제: A2-1 현대제철 요청(몇 건), A2 끝 직접 찾기, B 끝 검색·조회, B7 dry run 비교
- 화면: 바뀌지 않음. Playwright 데스크톱 1280에서 회귀만 봅니다

**AC-1 SQL** [확정] (사용자 승인, 2026-10-14, 인계서 검토 #3) (spec: "사이클 12 분포 검사와 같은 SQL". 그 SQL이 dev `data/cycle12/dist/`(git 밖)에 남아 있으면 그것을 씁니다):
```sql
SELECT l.id FROM library.library l
WHERE l.enabled AND NOT EXISTS (SELECT 1 FROM catalog.holding h WHERE h.library_id = l.id);
```
22곳 밖의 다른 번호가 나오면(예: 사이클 13 넣기로 들어온 곳) dev가 같은 규칙으로 원인을 보고 스스로 처리합니다. 사용자를 부르지 않고 `# 사이클 18` 절에 메모로만 남깁니다 [확정] (사용자 제안, 2026-10-14: "니가 알아서 제외하면 안 돼? 메모로만 알려주고 나 소환하지 말고")
- 오디오북만 있음·책 0종·사이트 닫힘·자동 접근 막힘처럼 우리가 모을 수 없는 원인이면 끕니다. 같은 Liquibase 변경 파일(A1)에 번호를 더하고(이미 main에 들어갔으면 새 변경 파일), `disabled_reasons.tsv`·`library-site-issues.md`(원문·확인일)·`library-maintenance.md` 6-2에 22곳과 같은 방식으로 적습니다
- 현대제철처럼 우리 코드 때문에 빠진 것이면 끄지 않고 원인을 메모로 남깁니다(고칠 일은 plan이 다음 사이클에서 정함)
- 교보 구독형 서버(`*.dkyobobook.co.kr`) 도서관은 사이트를 열지 않고 수집 기록으로만 판단합니다(C6)

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 22곳 끄기와 현대제철 가져오기 뒤 내 PC 켜진 0권 0곳 | 위 SQL, 내 PC `db` | A1 + B7 (둘 다 끝난 뒤) |
| AC-2 `GET /api/v1/libraries`에 22곳 없음 | `LibraryDisabledCycle18Tests` + 내 PC 응답 | A1 |
| AC-3 직접 추가해 둔 끈 도서관은 "쓸 수 없는 도서관" | my-libraries 회귀 시험 + 데스크톱 화면 한 번 | A1 |
| AC-4 2624만 범위로 「1984」 검색 → 결과에 나오고 조회가 보유·대출 수 | A2 시험(갈래, 실패 가두기) + A2 끝 직접 찾기 실제 + B7 뒤 검색 실제(2624 직접 추가 계정) | A2, B |
| AC-5 `detail_url_not_http` 241줄 줄어듦(283 → 42) | B 가져오기 시험 + B7 기록 비교(같은 사본 기준, 다른 사본이면 줄어든 수 = 그 사본의 2624 전자책 줄 수) | B |
| AC-6 오디오북만 있는 곳 → 보고서 "전자책 0권", 넣기 뒤 서비스에 없음 | 넣기 미리 보기 시험 ①②③ | B |
| AC-7 `library-site-issues.md`에 22곳 원인·원문·확인일 | 문서 확인 | A1 |
| AC-8 운영 DB에서도 켜진 0권 0곳 | 위 SQL, 운영 DB | C |

## 완료 기준

- [ ] AC-1~AC-8을 위 표의 단계에서 확인하고, AC 확인표를 `# 사이클 18` 절에 적습니다(C는 17 첫 배포 뒤 따로 덧붙임)
- [ ] 각 묶음(A1, A2, B)이 끝날 때 `backend/`의 `./gradlew build` 통과(`ModularityTests`·`DocumentationTests` 포함), A2는 `fetch-service/`의 `./gradlew build`도 통과
- [ ] 새 의존성은 앱마다 하나(`backend` 하나, `fetch-service` 하나, 같은 라이브러리)이고, 밑줄 길에서 인증서 이름 검사가 켜져 있습니다(C3). 조회 서버 앱의 내부망 막기·사용자 정보 거부가 그대로입니다
- [ ] `library/` 기존 changeset을 고치지 않았습니다(C2)
- [ ] `disabled_reasons.tsv` 22줄, `gone_known.tsv`에 44·261·269 없음, `library-maintenance.md` 6-2 표, `library-left-out.md` B절 27곳, `1-libraries.md`·`3-import.md` 한 줄씩
- [ ] 옛 설정 이름 `exclude-candidate-libraries`·`excludeCandidateLibraries`가 코드·설정·`3-import.md`에 남지 않습니다(`docs/plan-feedback.md` 지난 기록은 예외)
- [ ] 이 사이클은 폰 화면을 바꾸지 않으므로 사용자 실제 폰(Samsung Internet, `web-lan-5174`) 확인 대상이 아닙니다 [확정] (flow.md "새 화면도, 바뀌는 화면도 없음")
- [ ] [확인 필요] 결과와 설계와 달라진 점을 `# 사이클 18` 절에 적습니다

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 결과에 따라 | 막는 단계 |
|---|---|---|---|
| 요청 라이브러리가 밑줄 호스트로 요청하는지, SNI 없이 인증서 이름 검사(`*.yes24library.com`)가 통과하는지, C3 제한을 걸 수 있는지 | 시제품 (A2-1) | 못 맞추면 다른 라이브러리. 끝내 못 맞추면 멈추고 보고 | A2 |
| 새 라이브러리 버전을 Spring Boot가 관리하는지 | 공식 문서·Context7 | 버전 적는 법 | A2 |
| 어댑터 `UriComponentsBuilder…toUri()`가 밑줄 호스트에서 예외를 내는지 | 단위 시험 (A2-1) | A2-4 범위 | A2 |
| 지금 코드가 밑줄 호스트에서 실제로 어떻게 실패하는지 (spec R3-2) | 시제품 | 보고만 | 없음 |
| Liquibase `library/` 마지막 번호 | dev 작업 때 확인 | 파일 번호 | A1 |
| `list_left_out.py`가 `disabled_reasons.tsv`만으로 22곳을 보이는지, 새 이유 `no_ebooks`를 보이는지 | 실행 (A1-7, B4) | 스크립트 한 줄 고침 | A1, B |
| 사이클 19가 `CollectedCatalog`를 어떻게 바꿨는지 | 19 합친 뒤 코드 읽기 | B 이름·자리 | B |
| 새 곳이 많을 때 줄 세기 시간 | 2026-10-12 사본으로 미리 보기 | 보고만 | 없음 |
| 사이클 17이 운영 DB를 처음 채울 때 끄기가 어떻게 들어가는지, 프록시 길에서 새 라이브러리 설정 | 17 인계서·개발 결과 | C 순서, A2-6 | C |

## 이번에 하지 않는 것

- 화면 바꾸기: "책 정보 없음" 표시, 목록에서만 숨기기, 도서관을 끈다는 공지 [확정] (범위 결정 #5)
- 끈 도서관을 자동으로 다시 켜는 장치(R1-4). 교보 구독형 서버를 다른 IP에서 다시 받기(backlog, 17 뒤 따로 사이클)
- 사이트 표시 소장 수가 없는 약 2,400곳, 사이트 권수(`holdings_count`)를 전자책만 센 값으로 고치기, 비율 0.7 이상 6곳 처리(research.md 3절 기록으로 끝남)
- 가져오기 때마다 켜진 0권 도서관을 자동으로 알리기, 넣기 보고서의 "전자책 0권"과 "주소 호스트 다름" 나누기
- 나머지 `detail_url_not_http` 42줄 원인 찾기, 「묘왕동주」 원인 확인

- 다시 수집(`scripts/crawl/`), 묶기 규칙 변경(사이클 12·19 몫), 새 표·칸·API

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 18`** 절에 **무엇이 달라졌는지와 이유**를 적습니다(사용자 발언은 그대로). A·B·C를 따로 하면 묶음마다 덧붙입니다.

- 시작 상태: 작업 폴더·브랜치·docker 프로젝트·포트, 시작 커밋, 기준 빌드 결과, 0단계 기준 수치(켜진 0권 수, 목록 API 도서관 수, `detail_url_not_http`)
- **Liquibase 파일 번호와 changeset id**, master에서 붙인 자리, 다른 사이클과 rebase한 점
- **고른 HTTP 라이브러리와 버전**, 고른 이유, 떨어진 후보가 있으면 무엇이 안 됐는지
- **시제품 결과**
  - 현대제철 요청 수·응답 코드·시간, SNI가 나가지 않음을 확인한 방법, 인증서 이름 검사 통과 여부
  - `toUri()` 예외 여부, 지금 코드가 실패한 자리(spec R3-2)
- 밑줄 길 구현
  - 갈래를 고른 자리, `via` 값, 로그 모양
  - 고친 어댑터 목록과 고치지 않은 어댑터 목록
  - 사이클 15·17과 합친 방법(User-Agent, IP별 셈, 프록시)
- **바꾼 이름**
  - `SiteHosts`·`HoldingRowFilter`·`importableRows`·`no_ebooks`·availability 호스트 읽기·밑줄 길 클래스의 실제 이름
  - 옛 설정 `exclude-candidate-libraries`의 새 이름(Java 이름, 건너뜀 이유 문자열·로그를 바꿨는지 포함)
- `no_ebooks` 검사를 규칙 파일 오류 검사 앞에 뒀는지 뒤에 뒀는지
- 2026-10-12 사본 미리 보기에서 "전자책 0권"으로 빠진 곳 수와 줄 세기 시간
- B7 가져오기: 쓴 사본, dry run 비교 결과(2624 말고 달라진 이유 수), 진짜 가져오기 기록 번호, `detail_url_not_http` 전·후 수, 2624에 들어간 권수
- `library-site-issues.md` 새 절 번호, 사이트를 다시 연 곳과 원문을 못 얻은 곳, `library-left-out.md` B절 수
- AC-1 SQL로 22곳 밖에서 나온 곳이 있었는지
- C: 운영 반영 날짜, 판, `apply` 결과, AC-8
- [확인 필요] 표 각 행의 결과, 설계와 달라진 점, 새로 알게 된 제약, AC 확인표
