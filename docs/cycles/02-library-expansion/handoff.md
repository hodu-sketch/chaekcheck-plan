# 개발 인계서: 사이클 02 도서관 확장 (교보·YES24 전국 + 많은 도서관을 위한 검색 구조)

## 요약

교보·YES24 플랫폼과 통합 전자도서관 포털, 강남구 자체 시스템을 쓰는 전국 전자도서관을 검색 대상에 넣습니다. 도서관이 수백 곳이어도 모든 곳에 한꺼번에 요청하지 않습니다. 우선순위 그룹 순서대로 몇 곳씩 조회하다가 결과가 20줄을 넘으면 멈추고, 목록 맨 아래 "더 보기"로 다음 도서관의 결과를 이어 붙입니다. 백엔드에서 바뀌는 것은 다음과 같습니다.
- `library`: 모델 확장, 우선순위 계획 `planSearch`
- `availability`: 호스트 이름 단위 간격 제어, `SiteFetcher`(직접 호출 / 조회 서버 경유), adapter 6종, 판정 방식(`AvailabilityResolver`)과 SSE 전달(`SiteResultDelivery`) 분리, `titleKey`, 묶음 SSE API
- 새 배포 단위 `fetch-service/`(조회 서버)

웹은 조회 계획과 묶음 상태를 브라우저가 가지고, 묶음마다 제목끼리 모아 정렬합니다. 사이클 01 코드(`com.chaekcheck`)를 고치고 늘리는 작업이며, 새로 만들지 않습니다.

**포함**
- 교보 일반·교보 구독형·YES24(UTF-8)·YES24 한 세대 전(EUC-KR)·통합 포털·강남구의 6가지 화면 종류
- 수백 곳 seed
- 자격 미확인(`UNVERIFIED`)
- 우선순위 그룹, 묶음 검색, 라운드 로빈 "더 보기"
- 경북·전북 포털 상세 판정(최대 30초)
- 조회 서버와 서버 넘기기 규칙
- Spring Modulith `Documenter` 테스트

**제외**: "이번에 하지 않는 것" 절을 보세요. 북큐브·알라딘·다산 adapter, 저자·출판사 검색, 같은 책 묶기, 운영자 화면, Redis, 본 서비스 여러 대 등이 여기에 들어갑니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 이 파일을 고치지 마세요.**
- 구현이 이 인계서와 달라져야 하면(값, 이름, 구조, 순서) 먼저 사용자에게 알리세요. 그 내용과 이유는 dev `docs/plan-feedback.md`에 쌓아 두세요(사이클 01과 같은 방식). 다음 `/cycle-start` 회고의 입력이 됩니다.
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 확인한 값
  - `[안]`: 제안입니다. dev가 바꿔도 되지만, 바꾸면 알려야 합니다
  - `[확인 필요]`: 모르는 값입니다. 확정된 것처럼 코드에 넣지 말고 설정값으로 빼고 TODO를 남기세요.
- 단계마다 적힌 확인이 통과해야 다음 단계로 넘어갑니다.
  - 백엔드: `backend/`에서 `./gradlew build`(`ModularityTests` 포함)
  - 웹: `web/`에서 `npm run build`와 단위 테스트
  - 조회 서버: `fetch-service/`에서 `./gradlew build`
- 컬럼, 제약, JSON 예시, 이벤트 모양은 이 인계서에 옮기지 않았습니다. 구현할 때는 `design-delta.md`를 기준으로 삼으세요.

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `../chaekcheck-plan/docs/cycles/02-library-expansion/spec.md`: 규칙 5장, 상태 6장, 수용 기준 AC-1~AC-24(7장), 확인 필요 9장, 데이터 출처 10장
- `../chaekcheck-plan/docs/cycles/02-library-expansion/flow.md`: S1 화면 요소, 상태, 문구
- `../chaekcheck-plan/docs/cycles/02-library-expansion/design-delta.md`: **기준 문서**
  - 우선순위 그룹 표, 묶음 실행 규칙, 판정 표
  - 인터페이스, 테이블 변경, API·이벤트·페이지 객체 예시
  - 조회 서비스 계약, 확인 필요 표
- `../chaekcheck-plan/docs/cycles/02-library-expansion/research.md`: 8절 교보 216곳, 10절 YES24·구독형·EUC-KR, 12절 통합 포털과 새 주소, "플랫폼 유형 정리"
- `../chaekcheck-plan/docs/cycles/02-library-expansion/collection-method.md`: 2절 도서관마다 확인할 것, 4-4 화면 세대, 5절 운영 중 신호
- `../chaekcheck-plan/docs/cycles/02-library-expansion/eligibility-by-library.md`, `eligibility.md`: 자격 원문과 확인 상태
- `../chaekcheck-plan/docs/cycles/02-library-expansion/data/kyobo-institutions.tsv`: 교보 공식 구축 기관 목록
- ADR (`../chaekcheck-plan/docs/adr/`)
  - 0010 호스트 이름 단위 간격 제어
  - 0011 조회 서비스 분리
  - 0013 자격 미확인 (0004 대체)
  - 0014 묶음 검색 API (0005 대체)
  - 0015 조회 인터페이스·계약
  - 0016 화면 종류마다 adapter
  - 0017 도서관 한 줄 = 이용 단위 하나 (0012 대체)
  - 0018 서버의 제목 비교 키
  - 0019 판정·전달 인터페이스
  - **ADR-0014·0015 본문의 `siteId`는 `libraryId`로 읽습니다** (ADR-0019). `library_site` 테이블은 없습니다.
- `../chaekcheck-plan/docs/current/`: `module-map.md`, `data-model.md`, `api.md`(오류 코드 표), `flows.md`

## 지켜야 할 제약

- dev `CLAUDE.md`와 스킬 규칙을 따릅니다.
  - 모듈끼리는 루트 패키지의 공개 API로만 부릅니다. 방향은 `availability → library → region`이고, `availability`는 `region`에 직접 의존하지 않습니다.
  - 이벤트는 쓰지 않습니다.
- Kafka, Kubernetes, API 게이트웨이, 서비스 디스커버리를 넣지 않습니다. 조회 서버 목록은 본 서비스 설정의 **고정 목록**입니다 (ADR-0015).
- 캐시(3분)와 호스트 간격 제어는 **본 서비스 한곳**에서만 합니다. 조회 서버에는 두지 않습니다 (ADR-0011).
- Liquibase: 이미 적용된 changeset과 파일(CSV 포함)은 고치지 않습니다. guard 훅이 막습니다. 새 파일을 추가하고 master에 include합니다. **파일은 한 번에 완성해서 쓰세요.**
- `ddl-auto: validate`입니다. 엔티티 변경과 changelog는 같은 단계에 들어가야 앱이 뜹니다.
- 도서관 호출 예절 [확정]
  - 우리를 밝히는 User-Agent를 씁니다(본 서버와 조회 서버가 같은 값).
  - 같은 호스트 이름에는 동시 1건, 1초 간격입니다. 캐시는 3분입니다.
  - 사용자가 검색할 때만 조회합니다.
- **하지 않는 것**
  - IP를 바꿔 가며 차단을 피하는 방식(프록시 풀), 다른 봇(구글봇 등)으로 위장하는 방식
  - 도서관 쪽 실패(403, 시간 초과)를 다른 조회 서버로 다시 보내는 것
  - 인증서 검증을 끄는 것
- robots.txt가 막은 도서관도 조회 대상에 넣습니다 [확정]. 실제로 차단되면(계속 403·시간 초과 등, `collection-method.md` 5절 신호) 그 도서관만 `enabled=false`로 끕니다. 사이클 01과 같이 SQL로 바꿉니다.
  - "도서관에서 검색하기" 링크로 대신 보여 주는 화면은 design-delta에 설계가 없습니다. 이번에는 만들지 말고 필요하면 알려 주세요 [확인 필요].
- 조회 서버가 모두 죽어도 **직접 호출로 자동 전환하지 않습니다** [확정]. 바꾸려면 설정을 고칩니다.
- 서지 설명문과 표지는 읽지도 저장하지도 않습니다 (사이클 01 규칙 유지).

## 개발 시작 전 확인

괄호 안에 확인 방법과 막히는 단계를 적었습니다.

- [ ] **dev `CLAUDE.md` 수정 승인** (1단계를 막음, 사용자에게 질문)
  - 조회 서비스 폴더를 두는 것 자체는 사용자가 승인했습니다(ADR-0015).
  - 그래도 dev 세션은 `CLAUDE.md`를 고치기 **전에** 바꿀 문구를 사용자에게 보여 주고 허락을 받아야 합니다.
- [ ] `fetch-service/`의 폴더 이름 [안], Gradle group ID, base package (사용자에게 질문, 5단계를 막음)
  - 본 서비스의 `com.chaekcheck`를 그대로 쓸지, 하위 패키지(예: `com.chaekcheck.fetch`)로 할지 지어내지 말고 물어봅니다.
  - 독립 Gradle 빌드(자체 wrapper)로 할지, 루트 멀티 프로젝트로 할지도 함께 정합니다. 독립 빌드를 제안합니다 [안].
- [ ] 조회 서버 관련 값 (사용자에게 질문. 배포를 막지만, 개발은 설정값과 TODO로 진행)
  - 대수, 배치 위치, 고정 IP
  - 공유 토큰의 보관 방법과 인증 헤더 이름
  - "쉼" 표시 시간
  - 본 서버 → 조회 서버의 연결·읽기 제한 시간
- [ ] scope 제외 항목 "서버 여러 대"를 "본 서비스는 1대"로 읽는 것이 맞는지 (사용자에게 확인. 조회 서버 여러 대는 ADR-0011로 포함)
- [ ] 새 이름 전부 (사용자에게 질문 또는 dev가 정하고 보고)
  - 테이블·컬럼·enum·경로·이벤트·설정 키·클래스 이름은 모두 [안]입니다. 아래 "[안] 값 목록"을 보세요.
- [ ] Spring Modulith 2.1.1의 `Documenter` API 이름과 기본 출력 위치 (Context7 + 공식 문서 https://docs.spring.io/spring-modulith/reference/documentation.html, 12단계)
- [ ] EUC-KR 검색어를 URL에 넣는 방법 (Context7, 6단계)
  - `UriComponentsBuilder.encode()`는 UTF-8입니다.
  - 미리 인코딩한 값을 `build(true)`로 넣는 방식 등을 확인합니다.
- [ ] 화면 종류별 선택자와 URL 동작 (실제 호출, 1초 간격, 우리 User-Agent로, 6단계. design-delta·spec 9장 확인 필요)
  - 교보 구독형: 결과 줄 선택자, 공급 업체 표시, 상세 주소, 월 예산 소진을 알 수 있는지
  - YES24 한 세대 전·강남구: 10줄로 맞출 페이지 크기 파라미터가 있는지
  - 통합 포털: 페이지 파라미터 이름, 상세 URL의 `menu_idx`(포털마다 10/13/15)를 결과 줄 링크에서 바로 얻을 수 있는지
    - 얻을 수 없으면 `library` 칸 하나가 더 필요합니다. 그때는 멈추고 알려 주세요.
  - 교보 `recordCount=10`이 교보 사이트 표본 전부에서 동작하는지
- [ ] 인증서 오류 도서관(교보 24곳 등)이 본 서버·조회 서버 JDK 25에서 연결되는지 (개발 때 연결 시험, 6·11단계)
  - 안 되면 서비스 전용 신뢰 저장소에 중간 인증서를 넣는 방법을 사용자와 정합니다. 검증 끄기는 금지입니다.

## 구현 단계

단계 순서는 의존 순서입니다. 각 단계가 끝나면 앱이 뜨고 사이클 01 검색이 계속 동작해야 합니다. 기존 테스트는 바뀐 동작에 맞게 고칩니다: `LibraryCatalogTests`, `SearchStreamServiceTests`, `EbookSearchStreamControllerTests`, `HostThrottleTests`, `LibraryPageFetcherTests`, adapter 테스트, 웹 `sortResults.test.ts`, `LibrarySummaryBar.test.tsx`.

### 1단계: dev `CLAUDE.md`에 조회 서비스 폴더 규칙 추가 (의존: 사용자 승인)

1. **Directory Layout 변경** (파일: `CLAUDE.md`)
   - 할 일: "`backend/` — single Spring Boot application"을 "본 서비스(Spring Modulith) 하나"라는 뜻으로 고칩니다.
   - 할 일: `fetch-service/` [안] 줄을 더합니다. 내용은 "도서관 페이지를 GET으로 가져오기만 하는 작은 Spring Boot 앱, 별도 배포 단위, Modulith 모듈 아님, 캐시·간격 제어 없음 (ADR-0011, ADR-0015)"입니다.
   - 할 일: 명령(`fetch-service/`에서 `./gradlew build` 등)을 적습니다. Kafka/K8s/게이트웨이/디스커버리 금지 문구는 그대로 둡니다.
   - 이유: ADR-0015 "결과"
   - 확인: **고치기 전에 바꿀 문구를 사용자에게 보여 주고 승인을 받습니다.** `@../chaekcheck-plan/docs/current/handoff.md` import 줄은 건드리지 않습니다.
   - 위험: 낮음

### 2단계: library 스키마·모델 변경 + 자격 미확인 (의존: 1단계와 무관, 바로 가능)

**이 단계 전체가 한 배포입니다.** "규칙 없음 = 자격 미확인" 코드와 고흥의 `RESIDENCE × NATIONWIDE` 규칙이 따로 나가면 고흥이 "확인 필요"로 바뀝니다 (ADR-0013).

1. **스키마 changelog** (파일: `backend/src/main/resources/db/changelog/library/003-library-cycle02-schema.yaml` [안], master에 include)
   - 할 일(`sql` 변경. Liquibase OSS YAML이 CHECK를 지원하지 않으므로 사이클 01과 같은 방식):
     - `library_type text NOT NULL DEFAULT 'EBOOK'` + CHECK IN ('EBOOK')
     - `platform` → `platform_type`: 이름 바꾸기, 기존 `library_platform_check`를 지우고 6개 값으로 다시 만들기, NULL 허용
     - `base_url`: NULL 허용 + UNIQUE
     - 종류별 CHECK: `library_type <> 'EBOOK' OR (platform_type IS NOT NULL AND base_url IS NOT NULL)`
     - `extra_condition_text`, `visit_required`, `holdings_count`(+CHECK ≥ 0), `holdings_counted_on`(+둘 다 있거나 둘 다 없음 CHECK), `deferred`
     - `eligibility_rule_scope_type_check`에 `NATIONWIDE` 추가. `eligibility_rule_scope_check`에 "NATIONWIDE이면 `scope_region_id`, `scope_institution_id` 모두 NULL"을 추가
   - 값과 제약은 design-delta "데이터" 표 그대로입니다.
   - `base_url`의 뜻 [안]: "adapter가 뒤에 붙이는 경로 앞까지"로 통일합니다.
     - 기존 행(강서 origin, 고흥 origin)과 교보·YES24 adapter의 경로 붙이기는 그대로 둡니다.
     - 포털은 `…/elib`까지, 구독형은 origin입니다.
     - 다르게 정하면 알려 주세요.
2. **고흥 규칙 changelog** (파일: `.../library/004-library-goheung-nationwide.yaml` [안])
   - 할 일: `eligibility_rule`에 `(2, 'RESIDENCE', 'NATIONWIDE', NULL, NULL)`을 넣습니다.
3. **엔티티와 공개 타입** (파일: `backend/src/main/java/com/chaekcheck/library/internal/Library.java`, `EligibilityRule.java`, `library/Platform.java` → `library/PlatformType.java`, `library/LibraryType.java`, `library/Eligibility.java`)
   - 할 일
     - `Library`에 새 칸을 매핑합니다.
     - `EligibilityRule.ScopeType`에 `NATIONWIDE`를 더합니다.
     - `Platform`을 `PlatformType`(`KYOBO`, `KYOBO_SUBSCRIPTION`, `YES24`, `YES24_LEGACY`, `ELIB_PORTAL`, `GANGNAM`)으로 바꿉니다. `availability`의 `PlatformAdapter.platform()`, `KyoboAdapter`, `Yes24Adapter`, `LibraryPageFetcher`의 `EnumMap`도 따라 바꿉니다.
     - `Eligibility`에 `UNVERIFIED`를 더합니다.
     - adapter가 없는 화면 종류의 도서관이 오면 `upstream_error`로 실패하게 합니다. 이때는 아직 seed가 없습니다.
4. **판정 뜻 변경** (파일: `library/internal/LibraryService.java`)
   - 할 일: `eligibility()`의 "규칙 없음 → OPEN"을 바꿉니다.
     - NATIONWIDE 규칙이 있으면 `OPEN`
     - 규칙이 없으면 `UNVERIFIED`
     - 지역을 골랐을 때도 `UNVERIFIED` 도서관은 대상에 남깁니다(spec 5.1).
     - `JoinPolicy`도 규칙 유무가 아니라 NATIONWIDE 여부로 계산합니다(3단계에서 `PriorityGroup`으로 대체).
5. **웹 최소 대응** (파일: `web/src/api/types.ts`, `web/src/features/search/sortResults.ts`, `ResultRow.tsx`)
   - 할 일: `Eligibility`에 `'UNVERIFIED'`를 더합니다. 가입 구분은 `UNKNOWN`과 같은 뒤쪽 칸(joinTier 1)으로 두고 "가입 자격 확인 필요" 배지를 보여 줍니다 [안].
   - 테스트
     - `LibraryCatalogTests`: 고흥이 여전히 `OPEN`
     - 테스트 트랜잭션 안에서 JdbcClient로 규칙 없는 도서관을 넣어 `UNVERIFIED`인지 확인 (지역 있음·없음 둘 다)
     - 제약 테스트: NATIONWIDE에 region id를 넣으면 거부, EBOOK인데 `platform_type` NULL이면 거부
   - 수용 기준: AC-10(자격 미확인 표시의 서버 쪽), AC-12의 데이터 모양
   - 확인: `./gradlew build`, `bootRun` 뒤 `\d library.library`, 사이클 01 검색이 화면에서 그대로 동작
   - 위험: 중간 (한 배포 묶음, 이미 적용된 파일을 고칠 수 없음)

### 3단계: `planSearch` 우선순위 그룹 (의존: 2단계)

1. **공개 API 교체** (파일: `library/LibraryCatalog.java`, `library/SearchTarget.java`, 새 `library/PriorityGroup.java`, `library/internal/LibraryService.java`, 삭제 `library/LibraryTarget.java`·`JoinPolicy.java` [안])
   - `planSearch(residenceIds, workIds) → List<SearchTarget>`(정렬됨)와 `findEnabledTarget(libraryId) → Optional<SearchTarget>`를 둡니다. 사이클 01의 `findTargets`, `findEnabledSearchTarget`을 바꾸는 것입니다.
   - `SearchTarget`에 담을 것 [안]: id, name, libraryType, platformType, baseUrl, priorityGroup, deferred, eligibility, eligibilitySummary, extraConditionText, visitRequired, joinMethod
   - 그룹 판정: design-delta "`library`: 우선순위 그룹 계산" 표를 그대로 따릅니다.
     - 거주·직장을 따로 계산합니다. 거주는 RESIDENCE 규칙, 직장은 WORK 규칙과 비교합니다.
     - `S` = 고른 시군구 ID입니다.
     - `D` = `expandForMatching` 결과에서 `S`를 뺀 시도 ID입니다. `region` 공개 API는 바꾸지 않습니다.
     - 여러 규칙이 맞으면 앞선 그룹을 씁니다(시군구 > 시도 > 누구나) [안].
     - 판정 불가 문구(`extra_condition_text`)가 있고 지역 규칙이 안 맞으면 `NEEDS_CHECK`/`UNVERIFIED`입니다.
     - 지역 규칙만 있고 안 맞으면 계획에서 뺍니다.
   - 그룹 순서 [확정]
     - 지역 있음: `MY_SIGUNGU → MY_SIDO → OPEN → NEEDS_CHECK`
     - 지역 없음: `OPEN → QUALIFIED → NEEDS_CHECK`
   - 그룹 안 순서
     - `deferred=false`가 먼저입니다 [확정].
     - 그다음 `holdings_count` 내림차순(NULL은 뒤), 그다음 `id`입니다 [안].
     - 켜진 도서관 수백 행을 메모리에서 정렬합니다. `enabled`는 요청마다 읽습니다.
   - 지역 오류는 사이클 01처럼 `InvalidRegionException`(422 `invalid_region`)을 냅니다.
2. **사이클 01 스트림 연결 유지** (파일: `availability/internal/search/SearchStreamService.java`, `StreamEvents.java`, `web/LibraryEbookController.java`)
   - 할 일: `targets` 이벤트를 `SearchTarget`에서 만들고 design-delta 예시의 필드(`libraryType`, `platformType`, `priorityGroup`, `deferred`, `extraConditionText`, `visitRequired`)를 더합니다. 이 단계에서는 아직 모든 대상을 조회합니다.
   - 웹 알림 "자격 필요 도서관 없음"은 `joinPolicy` 대신 `priorityGroup`으로 계산합니다(`regionFilterApplied`이고 `MY_SIGUNGU`/`MY_SIDO`가 0곳). 웹을 같은 단계에 고치거나, 10단계까지 `joinPolicy`를 임시로 유지합니다. 어느 쪽인지 알려 주세요.
   - 테스트 (`LibraryCatalogTests`, 트랜잭션 안에서 도서관·규칙을 넣음. 지역 ID는 `region/002-region-seed.csv`에서 찾아 씀)
     - 지역 없음: OPEN → QUALIFIED → NEEDS_CHECK 순서 (AC-1)
     - 같은 그룹 안: `deferred`는 뒤, 보유 수 내림차순, NULL은 뒤 (AC-8)
     - 시군구 규칙 도서관·시도 규칙 도서관·누구나·미확인이 섞여 있을 때 순서 (AC-9)
     - 맞지 않는 지역 규칙 도서관은 제외, 미확인은 `UNVERIFIED`로 남음 (AC-10)
     - 세종 거주 → 천안처럼 인접 지역 규칙이 여러 줄인 도서관이 가입 가능 (AC-11)
     - 금정처럼 지역 규칙 + 판정 불가 문구: 맞으면 `ELIGIBLE`, 안 맞으면 `NEEDS_CHECK`+문구, 지역 없음이면 `QUALIFIED`/`UNKNOWN`+문구 (AC-12)
     - 여러 규칙이 맞으면 앞선 그룹, 꺼진 도서관 제외
   - 확인: `./gradlew build`(모듈 검증 포함)
   - 위험: 중간

### 4단계: 호스트 이름 단위 간격 제어 (의존: 없음. 2·3단계와 병행 가능)

1. **키 변경** (파일: `availability/internal/fetch/HostThrottle.java`, `UpstreamClient.java`의 `hostPort`, `LibraryPageFetcher.load`)
   - 할 일: 간격 제어 키를 `host:port`에서 **호스트 이름**(소문자, 포트 무시)으로 바꿉니다 (ADR-0010). 동시 1건, "이전 종료 + 1초", 대기도 8초에 포함되고 넘으면 504인 규칙은 그대로입니다. 로그에는 host와 포트를 모두 남깁니다.
   - 테스트 (`HostThrottleTests`)
     - `ebook.jbe.go.kr:10112`와 `:10124` 동시 요청이 겹치지 않고 두 번째 시작이 첫 번째 종료 + 1초 이후 (AC-18)
     - 다른 호스트 이름끼리는 병렬
   - 확인: `./gradlew test`
   - 위험: 낮음

### 5단계: `SiteFetcher` 인터페이스 + 직접 호출, 조회 서버 앱 + 경유 구현 (의존: 1·4단계, 조회 서버 패키지 결정)

1. **인터페이스와 직접 호출** (파일: 새 `availability/internal/fetch/SiteFetcher.java`, `SiteResponse.java` [안], `UpstreamClient.java` → `DirectSiteFetcher.java` [안], `config/AvailabilityConfiguration.java`, `LibraryPageFetcher.java`)
   - 할 일
     - `SiteFetcher.fetch(URI, deadline)`가 상태 코드·Content-Type·Location·**원본 바이트**를 돌려주게 합니다.
     - 직접 호출 구현은 사이클 01 `UpstreamClient`의 동작을 그대로 옮깁니다: 연결 3초·읽기 5초, User-Agent, 리다이렉트 안 따라감, 요청 로그, non-2xx와 3xx는 `upstream_error`, 시간 초과는 `upstream_timeout`.
     - 캐시와 throttle은 인터페이스 **앞**(`LibraryPageFetcher`)에 둡니다.
     - 이 단계에서는 바이트를 Content-Type charset으로 풀어 기존 adapter에 넘깁니다. 6단계에서 adapter로 옮깁니다.
   - 설정 [안]: `chaekcheck.availability.fetch.mode = direct | fetch-service`. 기본은 `direct`입니다. 자동 전환은 없습니다 [확정].
2. **조회 서버 앱** (폴더: `fetch-service/` [안], 패키지는 "개발 시작 전 확인" 결과)
   - 할 일: 작은 Spring Boot 앱(Groovy DSL, Gradle Wrapper, Java 25, Boot 4.1.1)으로 만들고 `POST /v1/fetches`를 둡니다. 계약은 design-delta "API"·"외부 연동" 표와 ADR-0015를 따릅니다.
     - 요청 `{url, requestId}`, 응답 `{outcome, status, contentType, location, body(base64), startedAt, endedAt}`
     - 조회 서버 자신이 정상이면 **항상 200**입니다. 도서관 쪽 실패는 `outcome`으로 표시합니다.
     - 401: 공유 토큰 헤더가 없거나 틀림. 헤더 이름과 토큰 보관은 [확인 필요]이고, 환경 변수로 받습니다.
     - 400: 잘못된 URL. **사설·루프백·링크 로컬 주소**(DNS 해석 뒤 주소 기준)와 http/https 외 scheme을 거부합니다.
     - 503: 과부하나 종료 중. 동시 처리 상한 값은 [안]입니다.
     - 도서관 호출: GET만, 리다이렉트 안 따라감, 연결 3초·읽기 5초, User-Agent는 설정에 고정(본 서버와 같은 값), 캐시 없음, 간격 제어 없음
     - 로그: host, path, 시작·끝, status, User-Agent
     - `.env`는 사용자가 고칩니다. 새 변수는 `.env.example`에만 적습니다.
   - 테스트
     - 사설·루프백 주소 거부
     - 토큰 없으면 401
     - 리다이렉트를 따라가지 않고 `location`을 돌려줌
     - 바이트가 그대로 base64로 옴(EUC-KR 본문)
     - 도서관 시간 초과가 `outcome`으로 표시됨
     - 로컬 가짜 서버로 시험하려면 루프백 허용을 **테스트 설정에서만** 켭니다 [안]. 기본값은 거부입니다.
3. **조회 서버 경유 구현** (파일: `availability/internal/fetch/FetchServiceSiteFetcher.java` [안], 설정 `chaekcheck.availability.fetch.servers`(우선순위 순 목록) 등 [안])
   - 넘기기 규칙 [확정] (ADR-0015, design-delta 흐름 4)
     - 평소에는 목록에서 첫 번째 "쉼"이 아닌 서버에 보냅니다.
     - **연결 거부, 연결 시간 초과, 503일 때만** 그 서버를 일정 시간 "쉼"으로 표시하고, 남은 시간 안에서 다음 서버로 보냅니다. "쉼" 시간은 [확인 필요]이며 설정값으로 둡니다.
     - 조회 서버 읽기 시간 초과는 넘기지 않고 `upstream_timeout`입니다(도서관 중복 요청 방지).
     - 200 + 도서관 쪽 실패(403, TIMEOUT 등)는 넘기지 않고 `library-failed`입니다.
     - 모든 서버가 "쉼"이면 조회 실패(`upstream_error` [안])이고, 직접 호출로 바꾸지 않습니다.
     - throttle 허가를 받은 상태에서 부르므로, 넘기는 시간도 요청 8초 안에 들어갑니다.
   - 로그 [안]: 조회 방식(직접/서버 ID), 넘김 여부
   - 테스트: 첫 서버 연결 거부 → 두 번째 서버로 감 / 503 → 넘기고 쉼 표시 / 읽기 시간 초과 → 넘기지 않음 / 200+403 outcome → 넘기지 않음 / 모두 쉼 → 실패, 직접 호출 없음 / 두 모드가 같은 캐시·throttle을 지남
   - 수용 기준: AC-20(두 방식 모두 User-Agent, 캐시 규칙 그대로)
   - 확인: `backend/`와 `fetch-service/` 각각 `./gradlew build`. `mode=fetch-service`로 로컬 조회 서버 두 대를 띄우고 한 대를 끈 뒤 검색해 봅니다.
   - 위험: 높음 (새 배포 단위, SSRF 방어, 시간 예산)

### 6단계: 화면 종류 6개 adapter (의존: 2·5단계, 선택자 확인)

1. **adapter 인터페이스 확장** (파일: `availability/internal/adapter/PlatformAdapter.java`, `ParsedItem.java`, `ParsedPage.java`, 새 `SiteVerdict.java` [안])
   - 할 일
     - adapter가 검색어 문자셋을 정하고 `searchUri`를 만듭니다. EUC-KR 사이트는 검색어를 EUC-KR로 인코딩합니다.
     - `parse(byte[] body, 응답 charset)`로 바이트를 스스로 해석합니다.
     - `ParsedItem`의 수량(`holdings`, `loaned`, `reservations`)은 nullable로 바꿉니다.
     - 줄마다 사이트 판정 `AVAILABLE | RESERVABLE | BLANK | OTHER`(수량 화면은 없음)를 담습니다.
     - 포털은 상세 페이지 주소를 만드는 방법과 `parseDetailVerdict`를 가집니다.
     - `LibraryPageFetcher.toPage`의 `available`·`loanRate` 계산은 null에 안전하게 고칩니다. 수량 없는 화면은 `holdings`, `available`, `loanRate`가 null입니다.
2. **adapter 6개** (파일: `KyoboAdapter`, `Yes24Adapter`(기존), 새 `KyoboSubscriptionAdapter`, `Yes24LegacyAdapter`, `ElibPortalAdapter`, `GangnamAdapter` [안]. 교보 둘, YES24 둘의 공통 부분은 함께 씀)
   - 모든 사이트는 제목 필드로 검색합니다(ADR-0009). YES24는 `sort=title`입니다.
   - 첫 요청은 10줄입니다 [확정]. 교보·구독형은 `recordCount=10`입니다. YES24 한 세대 전(기본 5줄)과 강남구는 10줄로 맞출 파라미터를 찾습니다. 못 찾으면 `pageSize`를 사이트 값으로 두고 알려 주세요.
   - URL과 화면 구조는 research.md 10절(구독형, EUC-KR), 12절(포털, 강남구), spec 10장을 보세요. 포털은 목록 판정 칸과 `data-book_idx`로 상세 주소를 만듭니다.
   - 테스트: 실제 HTML을 한 번씩 받아 fixture로 둡니다(`backend/src/test/resources/fixtures/{kyobo-subscription,yes24-legacy,elib-portal,gangnam}/` [안]). 설명문과 표지는 지우고, EUC-KR은 **원본 바이트 그대로** 저장합니다.
     - 결과 있음 / 결과 없음 / 2쪽
     - 포털: 판정 있음(부산·대구·경기교육청) / 모두 빈칸(경북·전북) / 일부 빈칸(인천)
     - 포털 상세: "대출 가능" / "예약 가능" / 모르는 값
     - 한 교보 화면에 여러 공급 업체가 섞인 경우(공급 업체를 줄마다 읽음)
   - 수용 기준
     - AC-3: 요청 URL의 `recordCount=10`, 페이지 크기
     - AC-13: 수량 파싱
     - AC-14, AC-15: 목록·상세 판정 파싱
     - AC-16: 구독형은 수량 없음
     - AC-19: EUC-KR 인코딩 URL과 해석
   - 확인: `./gradlew test`, 그리고 화면 종류마다 1곳씩 `bootRun`으로 실제 조회합니다(1초 간격).
   - 위험: 높음 (공식 API 아님, 선택자 미확인)

### 7단계: `AvailabilityResolver` + `SiteResultDelivery` (의존: 6단계)

1. **판정 방식** (파일: 새 `availability/internal/resolve/AvailabilityResolver.java`, `CountResolver`, `SiteListResolver`, `DetailLookupResolver`, `SubscriptionResolver` [안]. design-delta "판정 방식 인터페이스" 표)
   - 줄마다 `availability`(`AVAILABLE | RESERVABLE | PENDING | UNKNOWN`)와 `availabilityBasis`(`COUNT | SITE_LIST | LOANED_ZERO | SITE_DETAIL | SUBSCRIPTION` [안])를 정합니다.
   - 플랫폼 유형 → 판정 방식을 고르는 규칙은 한곳에 둡니다.
   - 포털 빈칸 줄
     - 대출 0 → `AVAILABLE`
     - 대출 1 이상 → `PENDING`
     - `DetailLookupResolver`가 상세 페이지를 **캐시(3분)·throttle·`SiteFetcher`**를 거쳐 조회합니다. 상세 캐시 키는 (libraryId, book_idx) [안]입니다.
   - 30초 마감 [확정]과 기준 시각(묶음 시작) [안], 넘거나 오류·모르는 값이면 `UNKNOWN`으로 두는 처리는 **이 구현 안에만** 둡니다. 설정 키는 [안]입니다.
   - 빈칸 처리는 `deferred`와 상관없이 줄 단위로 합니다 [안].
2. **SSE 전달** (파일: 새 `availability/internal/search/SiteResultDelivery.java`, `OneShotDelivery`, `ProgressiveDelivery` [안], `SearchSession.java`, `StreamEvents.java`)
   - `PENDING` 줄이 없으면 `library-result` 한 번을 보냅니다.
   - `PENDING` 줄이 있으면 `library-result`(PENDING 포함) → 판정마다 `row-verdict` → 끝입니다.
   - 묶음 실행기(지금은 `SearchSession`)는 "이 도서관의 전달이 끝났는가"만 기다립니다. **특정 도서관 종류의 분기나 30초 값을 묶음 실행기에 넣지 마세요** [확정] (ADR-0019).
   - `done`은 모든 전달이 끝난 뒤에 보냅니다. `SseEmitter` 제한 시간은 상세 마감(30초) + 여유로 늘립니다. 지금은 `searchDeadline`(8초) + 5초입니다.
3. **도서관별 더 보기 API** (파일: `web/LibraryEbookController.java`)
   - `PENDING` 줄은 판정을 읽은 뒤(최대 30초) 함께 JSON으로 돌려줍니다 [안].
   - 테스트
     - 구현 선택 규칙: 유형별 resolver 선택, PENDING 유무에 따른 전달 선택
     - 대출 0은 상세 요청 없음 (AC-15)
     - 상세 판정 "예약 가능" → `RESERVABLE` (AC-15)
     - 30초 초과 → `UNKNOWN` (테스트에서는 짧게 설정)
     - 구독형은 항상 `AVAILABLE`/`SUBSCRIPTION` (AC-16)
     - 포털 목록 판정 (AC-14)
     - 스트림에서 `row-verdict`가 `done`보다 먼저 옴
   - 확인: `./gradlew test`
   - 위험: 높음 (비동기, 스트림 수명)

### 8단계: 제목 비교 키 `titleKey` (의존: 6단계. 7단계와 병행 가능)

1. **정규화 컴포넌트** (파일: 새 `availability/internal/title/BookKeyNormalizer.java` [안], `fetch/LibraryPage.java`의 `Item`에 `titleKey` 추가)
   - 할 일: 정리 규칙 [안]은 NFC → 공백 모두 제거(앞뒤·연속·띄어쓰기 차이) → 영문 소문자 → 문장부호 제거입니다. 이번에는 **제목만** 씁니다 [확정].
   - 괄호 부제·"큰글자책"·권차는 [확인 필요]입니다. 6단계 fixture에서 화면 종류별 실제 표기를 모아 비교한 뒤 정하고, 정한 규칙과 예를 알려 주세요.
   - 줄은 합치지 않습니다.
   - 테스트: "채식주의자"와 "채식 주의자"가 같은 키 (AC-23), 문장부호·대소문자·NFD 입력, 화면 종류별 fixture 제목
   - 확인: `./gradlew test`, API 응답에 `titleKey`가 있음
   - 위험: 낮음

### 9단계: 묶음 SSE API (의존: 3·7·8단계)

1. **묶음 실행기** (파일: `availability/internal/search/SearchStreamService.java` → 묶음 실행기로 바꿈(이름 [안] `BatchRunner`), `SearchSession.java`, `StreamEvents.java`, `config/AvailabilityProperties.java`, `application.yml`)
   - 규칙: design-delta "`availability`: 묶음 실행 규칙" 표
     - 후보 순서대로 시작합니다. 동시 요청은 최대 P=5 [안]입니다.
     - 셈한 줄이 **20개를 넘으면** 새 요청을 시작하지 않고, 이미 시작한 요청은 받습니다 [확정].
     - 셈하는 줄: 필터 `all`은 모든 줄, `available`은 `AVAILABLE` 줄만 [확정]. `PENDING`은 세지 않습니다 [안].
     - 검색 페이지 요청은 **묶음 시작부터 8초**이고, 넘으면 `upstream_timeout` [확정]입니다.
     - 남은 시간이 3초보다 적으면 새 요청을 시작하지 않습니다 [안].
     - 후보 상한은 K=50 [안]입니다.
     - 같은 호스트는 throttle이 차례로 보내며, 순서를 바꿔 피하지 않습니다 [안].
     - 결과 없는 도서관은 줄을 만들지 않습니다 [안].
   - 이벤트 순서: `targets`(첫 스트림만) → `library-requested` / `library-result` / `library-failed` … → `batch-done` → `row-verdict` … → `done`
   - `batch-done`에는 `requested`, `succeeded`, `failed`, `countedRows`, `pendingRows`, `stopReason`(`ROW_LIMIT | CANDIDATES_EXHAUSTED | LAUNCH_CUTOFF` [안])을 담습니다.
   - 설정 키(행 수 상한, P, 묶음 마감, 시작 마감, K, 상세 마감) 이름은 [안]입니다. 기존 `search-deadline`은 묶음 마감의 뜻으로 바뀝니다.
   - 로그 [안]: 묶음마다 계획 크기·후보 수·요청 수, 요청마다 libraryId, batchNo, host, page, 조회 방식(직접/서버 ID), 시작·끝, outcome. AC-2, AC-5, AC-8, AC-9, AC-18을 이 로그로 확인합니다.
2. **첫 묶음 스트림 변경** (파일: `web/EbookSearchStreamController.java`)
   - `GET /api/v1/ebook-searches/stream`에 `filter=all|available`(없으면 all)을 더합니다.
   - `planSearch` 결과 전체를 `targets`로 보내고, 계획 순서대로 첫 묶음을 실행합니다.
   - 검증은 스트림을 열기 전에 합니다(400 `invalid_query`/`validation_error`, 422 `invalid_region`). `produces`는 걸지 않습니다(사이클 01 제약).
3. **다음 묶음 스트림** (파일: 새 `web/EbookBatchStreamController.java`, `CandidatesParam.java` [안])
   - `GET /api/v1/ebook-searches/batches/stream?q&filter&batchNo&candidates=libraryId:page,…` [안]
   - 형식 오류, K 초과, 중복은 스트림을 열기 전에 400 `validation_error`(`errors[].code`: `required`/`invalid_format`/`too_many`/`duplicate`)입니다.
   - 후보마다 `findEnabledTarget`을 부릅니다. 꺼졌거나 없는 도서관은 그 도서관만 `library-failed`(`library_not_found`)입니다.
   - 서버는 검색 상태를 저장하지 않습니다 (ADR-0014).
   - 테스트 (가짜 `SiteFetcher`·adapter)
     - 20줄을 넘으면 새 요청이 없음 (AC-1, AC-2)
     - 필터 `available`의 셈
     - 첫 요청이 page 1·10줄 (AC-3)
     - 후보 `1:2` → 2쪽 요청 (AC-5)
     - 8초 초과 도서관만 `library-failed` (AC-7)
     - 후보 순서가 곧 요청 시작 순서 (AC-8, AC-9는 계획 순서를 그대로 씀)
     - 시작 마감
     - 이벤트 순서와 `row-verdict` 뒤 `done`
     - 후보 검증 400 4종, `library_not_found` 개별 실패
     - 요청 헤더 `Accept: text/event-stream, application/problem+json`에서 ProblemDetail이 나옴
   - 확인: `./gradlew build`. `bootRun` 뒤 `curl -N "http://localhost:8080/api/v1/ebook-searches/stream?q=사랑"`로 이벤트 순서를 보고, `batches/stream`을 후보와 함께 불러 봅니다.
   - 위험: 높음

### 10단계: 웹 (의존: 9단계)

1. **API 타입과 스트림** (파일: `web/src/api/types.ts`, `web/src/api/searchStream.ts`, `web/src/api/client.ts`)
   - 새 필드와 이벤트(`library-requested`, `batch-done`, `row-verdict`)를 더하고 `EVENT_NAMES`를 넓힙니다. 첫 스트림과 다음 묶음 스트림은 같은 읽기 코드를 씁니다(`fetch` + `SseParser`).
2. **계획·묶음 상태** (파일: `web/src/features/search/useSearch.ts`, 새 `searchPlan.ts` [안] + 테스트)
   - 계획 항목마다 상태를 둡니다: `NotRequested / Requested / HasMore / Exhausted / Failed`, 다음 쪽 (design-delta "도서관 하나의 조회 상태").
   - 다음 후보 계산
     - 1바퀴: `NotRequested`를 계획 순서대로, 1쪽
     - 다음 바퀴: `HasMore`를 계획 순서대로, 다음 쪽
     - 최대 K개
     - `Failed`는 다시 넣지 않습니다 [확정].
     - 서버가 `library-requested`를 보내지 않은 후보는 `NotRequested`로 남깁니다.
   - 도서관별 "더 보기"(`libraries/{id}/ebooks`)로 받은 쪽도 그 도서관의 다음 쪽 상태에 반영해, 라운드 로빈이 같은 쪽을 다시 부르지 않게 합니다.
   - 필터나 지역이 바뀌면 상태를 버리고 첫 묶음부터 다시 검색합니다 [확정]. 필터는 이제 서버에 `filter`로 보냅니다. URL `?filter=available`은 유지합니다.
3. **줄 갱신 처리를 한곳에** (파일: 새 `web/src/features/search/rowVerdict.ts`(reducer의 줄 갱신 함수), `PendingRows.tsx` [안])
   - `PENDING` 줄은 묶음 아래쪽 "대출 정보 조회 중" 자리에 둡니다.
   - `row-verdict`가 오면 **같은 묶음 안에서만** 칸을 옮깁니다(`libraryId`+`page`+`rank`로 찾음).
   - `UNKNOWN`은 "대출 가능 여부 확인 필요"로 예약 칸 맨 아래에 둡니다.
   - 화면은 도서관 종류나 `platformType`을 보지 않고 줄 상태와 이벤트 종류만 봅니다 [확정] (ADR-0019).
4. **묶음 안 정렬** (파일: `sortResults.ts` → 묶음 단위 정렬로 바꿈 + 테스트, spec 5.6)
   - 칸 나누기: `AVAILABLE` → 지금 빌릴 수 있어요 / `RESERVABLE`·`UNKNOWN` → 예약하고 기다려요(`UNKNOWN`은 맨 아래) / `PENDING` → 조회 중 자리
   - 칸 안에서 `titleKey`로 제목끼리 모읍니다.
     - 제목 묶음 순서
       - 빌림 칸: 재고 합계 많은 순. 수량 없는 줄만 있는 제목은 뒤 [안]
       - 예약 칸: 예약 합계 적은 순
       - 합계가 같으면 그 묶음에서 먼저 나온 도서관(계획 순서)의 제목이 먼저 [안]
     - 제목 안: 가입 가능(`OPEN`/`ELIGIBLE`) → 확인 필요(`UNKNOWN`/`UNVERIFIED`)
     - 그 안
       - 빌림 칸: 재고 줄(재고 많은 순 → 대출률 낮은 순 → `rank`), 그다음 수량 없는 줄(계획 순서 → `rank`) [안]
       - 예약 칸: 예약 적은 순 → 보유 많은 순(보유 null은 뒤) → `rank`
   - 대출률은 그 도서관 1쪽 `loanRate`로 고정합니다.
   - 첫 묶음은 결과가 올 때마다 다시 정렬합니다. 붙은 묶음은 **그 묶음 안에서만** 정렬하고 이전 묶음은 움직이지 않습니다.
5. **화면** (파일: `SearchPage.tsx`, `ResultList.tsx`(묶음 목록), 새 `BatchSection.tsx` [안], `ResultRow.tsx`, `LibrarySummaryBar.tsx`)
   - 두 번째 묶음부터 구분선 "더 찾은 결과 · 도서관 N곳"을 둡니다.
   - 목록 맨 아래 "더 보기 (남은 도서관 N곳)" [안 문구]를 두고, 더 조회할 것이 없으면 없앱니다. 도서관별 더 보기 결과는 맨 아래 새 묶음으로 붙입니다 [안].
   - 요약 줄은 U-8 그대로(5곳 + "… 외 N곳")이고, 결과가 있는 도서관을 앞에 둡니다 [확정]. 요청한 도서관만 싣습니다 [안 해석].
   - 결과 한 줄
     - 수량 없는 줄은 "대출 중 · 예약"
     - 구독형은 "구독형 · 바로 대출"이고 도서관명 옆에 "구독형"을 붙입니다 [안 문구]. `availabilityBasis`와 `targets`의 `platformType`을 표시에만 씁니다.
     - 월 예산 소진을 사이트에서 알 수 없으면 "월 예산 소진 시 이용 불가" 안내 [안]
     - "가입 자격 확인 필요" 배지 + `extraConditionText`, "방문 가입"
     - 모바일은 U-12 팝오버 안에 넣습니다.
   - 상태 문구: flow.md S1 상태 표 (묶음 0줄, 끝까지 조회함, 맞는 도서관 없음, 다음 묶음 로딩 등)
   - 테스트 (Vitest)
     - 후보 계산: 1바퀴·다음 바퀴·실패 제외·요청 안 된 후보 유지 (AC-4, AC-5)
     - 줄 갱신: 같은 묶음 안 이동, 다른 묶음 불변 (AC-15, AC-24)
     - 정렬: 제목 묶음 순서, 제목 안 순서, 수량 없는 줄 자리 (AC-16, AC-17, AC-21, AC-22)
     - 필터 변경 시 초기화
     - 이벤트 읽기(줄이 잘려 도착하는 경우 포함)
   - 확인: `npm run build`, 단위 테스트. Playwright MCP로 데스크톱 1280 → 태블릿 → 모바일(breakpoint 1024/640) 순서로 봅니다.
   - 위험: 높음 (상태가 많음)

### 11단계: 수백 곳 seed (의존: 2·6단계. 조사는 앞 단계와 병행 가능)

1. **목록 확정** (조사. 결과 파일은 저장소에 넣지 않고, 요약만 보고)
   - 출처
     - research.md 8절(교보 216곳), 10절(YES24·구독형·EUC-KR 12곳), 12절(포털 6곳, 강남구, 새 주소)
     - `data/kyobo-institutions.tsv`
     - `eligibility-by-library.md`
   - 도서관마다 **서비스 JDK로** 검색 1건을 보내 동작 여부와 리다이렉트 뒤 최종 주소를 확인합니다. 우리 User-Agent, 호스트당 1초 간격입니다. robots.txt가 막아도 조회 대상입니다 [확정].
   - 뺄 것: 새 주소를 못 찾은 약 20곳(research.md 12절), 로그인 필요한 울산, 북큐브·알라딘·다산·기타 자체 시스템
   - 순위 값: 빈 검색 전체 건수(교보 `schTxt=%20&schClst=all`, YES24 `src_key=`)와 조사일을 넣습니다. 포털·구독형·EUC-KR·강남구에서 얻을 수 있는지, 오디오북이 들어가는지는 [확인 필요]이고, 못 얻으면 NULL입니다.
   - `deferred=true`: 경북·전북 포털 [확정]. 인천처럼 일부만 빈 포털은 빈 줄 비율을 호출로 본 뒤 **사용자에게 묻습니다**.
   - 자격 규칙: **원문 확인된 값만** 규칙으로 넣습니다.
     - 누구나 → `RESIDENCE × NATIONWIDE`
     - 못 찾음 → 규칙 0줄(자격 미확인)
     - 판정 불가 자격(책이음 등) → `extra_condition_text`
     - 방문 가입 → `visit_required`
     - 인접 지역(천안 등) → 지역 규칙 여러 줄
     - 같은 기관의 일반·구독형 → 두 줄, 이름은 "(구독)" 등으로 구분, 규칙도 두 번 [확정]
   - 교보 목록의 도서관이 아닌 이름 33곳은 공공 이용 가능 여부를 확인한 뒤 넣습니다 [확인 필요].
   - `name` UNIQUE와 `base_url` UNIQUE가 지켜지는지 확인합니다. 안 되면 멈추고 알려 주세요 [확인 필요].
2. **seed changelog** (파일: `.../library/005-library-seed-cycle02.yaml` + `005-library-cycle02.csv`, `005-eligibility-rule-cycle02.csv` [안])
   - CSV `loadData` 2개를 씁니다. ID를 직접 넣습니다(3부터). 마지막에 IDENTITY를 seed 최댓값 + 1로 재시작합니다.
   - 한 번에 다 넣지 못하면 확보한 만큼 넣고 나머지는 다음 changeset으로 넣습니다 [확정: 검색 구조를 먼저 완성]. 순위 값 재조사도 새 changeset(`loadUpdateData` 등)으로 갱신합니다 [안].
   - 테스트
     - seed 뒤 `LibraryCatalogTests`가 id 1·2만 가정하지 않게 고칩니다. 트랜잭션 안에서 필요한 행만 켜거나, 결과를 id로 거릅니다.
     - 실제 seed로 세종 거주 → 천안 가입 가능 (AC-11)
     - 금정 문구 (AC-12)
   - 실제 사이트 확인(서버 로그)
     - 지역 없이 `사랑` → 요청이 수백 곳에 가지 않음 (AC-1, AC-2)
     - 경북·전북이 같은 그룹 뒤쪽에 조회됨 (AC-8)
     - `ebook.jbe.go.kr` 요청 간격 ≥ 1초, 동시 1건 (AC-18)
     - 같은 시점 사이트 화면과 수량 비교 (AC-13)
     - 경북 「신 퇴마록 신세편 1」이 예약 칸 (AC-15)
   - 확인: `./gradlew build`, `bootRun`
   - 위험: 높음 (파일을 고칠 수 없음, 네트워크 조사 양)

### 12단계: Spring Modulith `Documenter` 테스트 (의존: 3단계 이후 아무 때나)

1. **문서 생성 테스트** (파일: `backend/src/test/java/com/chaekcheck/ModularityTests.java`에 추가 또는 새 `DocumentationTests.java` [안])
   - 할 일: `ApplicationModules.of(ChaekcheckApplication.class)`로 모듈 구성도(PlantUML, 전체와 모듈별)와 모듈 캔버스를 만듭니다. API 이름은 Modulith 2.1.1 기준으로 Context7에서 확인합니다. 기본 출력은 빌드 폴더의 `spring-modulith-docs`입니다.
   - 이유: 다음 `/cycle-start`에서 plan의 설계 그림과 비교합니다 [확정] (scope).
   - 확인: `./gradlew test` 뒤 출력 파일이 생김. 출력 경로를 알려 주세요.
   - 위험: 낮음

## 테스트

- 단위
  - 백엔드: 그룹 판정과 정렬, 호스트 이름 throttle, adapter 6종(fixture, EUC-KR), 판정 방식 4종, 전달 방식 2종, `BookKeyNormalizer`, 후보 파라미터 검증, 조회 서버 넘기기 규칙
  - 웹: 후보 계산, 줄 갱신(row-verdict), 묶음 안 정렬, 이벤트 읽기
- 통합(모듈): `ModularityTests`(verify), `LibraryCatalogTests`(`@ApplicationModuleTest`, db-test), Liquibase 적용(새 CHECK·UNIQUE), 스트림 컨트롤러 테스트(가짜 `SiteFetcher`), `fetch-service` 컨트롤러 테스트
- 실제 사이트와 서버 로그: AC-1, AC-2, AC-5, AC-8, AC-9, AC-13, AC-15, AC-18, AC-19, AC-20. 요청은 수동으로 적게 보내고 1초 간격을 지킵니다.
- 화면(Playwright MCP, 데스크톱 먼저): 아래 표의 화면 항목

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 첫 화면 약 20줄, 누구나 먼저 | 계획 테스트 + 묶음 실행 테스트 + Playwright + 로그 | 3, 9, 10, 11 |
| AC-2 모든 도서관에 요청하지 않음 | 묶음 실행 테스트 + 로그(계획 크기 vs 요청 수) | 9, 11 |
| AC-3 첫 요청 10줄 | adapter URL 테스트 + 로그 | 6, 9 |
| AC-4 더 보기 뒤 위치 유지 | 웹 후보·정렬 테스트 + Playwright | 10 |
| AC-5 한 바퀴 뒤 2쪽 | 웹 후보 계산 테스트 + 로그(page=2) | 9, 10 |
| AC-6 도서관별 더 보기 | Playwright (맨 아래 새 묶음) | 7, 10 |
| AC-7 8초 조회 실패 | 묶음 실행 테스트(짧은 마감) + 화면 | 9, 10 |
| AC-8 경북·전북 후순위 | 계획 테스트(`deferred`) + 로그 | 3, 11 |
| AC-9 지역 고른 순서 | 계획 테스트 + 로그 | 3, 11 |
| AC-10 맞지 않는 도서관 제외, 미확인 배지 | 계획 테스트 + Playwright | 2, 3, 10 |
| AC-11 세종 거주 → 천안 | 계획 테스트 + 실제 seed + Playwright | 3, 11 |
| AC-12 책이음 문구 | 계획 테스트 + Playwright (모바일 팝오버 포함) | 3, 10, 11 |
| AC-13 수량 일치 | adapter fixture + 같은 시점 사이트 화면 비교 | 6, 11 |
| AC-14 포털 사이트 판정 | adapter·resolver 테스트 + 화면 | 6, 7, 10 |
| AC-15 경북·전북 상세 판정 | resolver·전달 테스트 + 웹 줄 갱신 테스트 + 로그(대출 0은 상세 요청 없음) + 화면 | 6, 7, 10, 11 |
| AC-16 구독형 표시와 자리 | resolver 테스트 + 웹 정렬 테스트 + 화면 | 7, 10 |
| AC-17 포털 줄 자리 | 웹 정렬 테스트 + 화면 | 10 |
| AC-18 호스트 이름 간격 | throttle 테스트 + 로그(`ebook.jbe.go.kr` 여러 포트) | 4, 11 |
| AC-19 EUC-KR | adapter 테스트 + 실제 조회 + 로그 | 6 |
| AC-20 캐시 3분·User-Agent | 기존 캐시 테스트 + 두 조회 방식 로그 | 5, 9 |
| AC-21 칸 안 제목 묶음 | 웹 정렬 테스트 + 화면 | 8, 10 |
| AC-22 같은 제목 안 순서 | 웹 정렬 테스트 | 10 |
| AC-23 표기만 다른 제목 같은 키 | `BookKeyNormalizer` 테스트 + API 응답 | 8 |
| AC-24 이전 묶음 순서 유지 | 웹 줄 갱신·정렬 테스트 + Playwright | 10 |

## 완료 기준

- [ ] spec.md 7장 AC-1~AC-24를 위 표의 방법으로 모두 확인함
- [ ] `backend/`에서 `./gradlew build` 통과 (`ModularityTests` verify 포함, `availability → library → region` 외 의존 없음)
- [ ] `fetch-service/`에서 `./gradlew build` 통과, `mode=fetch-service`로 검색 동작과 서버 넘기기를 확인함
- [ ] `web/`에서 `npm run build`와 단위 테스트 통과, Playwright로 데스크톱·태블릿·모바일 확인
- [ ] `Documenter` 출력(PlantUML, 모듈 캔버스)이 생성되고 경로를 알림
- [ ] dev `CLAUDE.md` 변경이 사용자 승인 뒤 반영됨
- [ ] "[안] 값 목록"에서 바꾼 것과 "[확인 필요]"의 확인 결과를 `docs/plan-feedback.md`에 정리해 사용자에게 전달함

## [안] 값 목록 (dev가 바꿀 수 있음. 바꾸면 알릴 것)

- 테이블·컬럼 이름: `library_type`, `platform_type`, `extra_condition_text`, `visit_required`, `holdings_count`, `holdings_counted_on`, `deferred`. `base_url`의 뜻("adapter가 붙이는 경로 앞까지")
- enum: `LibraryType.EBOOK`, `PlatformType` 6개 이름, `PriorityGroup`(`MY_SIGUNGU`, `MY_SIDO`, `OPEN`, `QUALIFIED`, `NEEDS_CHECK`), `Eligibility.UNVERIFIED`, `availabilityBasis` 값, `SiteVerdict` 값, `stopReason` 값
- 경로·이벤트: `/api/v1/ebook-searches/batches/stream`, `candidates=libraryId:page` 형식, 이벤트 이름(`library-requested`, `batch-done`, `row-verdict`), 조회 서비스 `/v1/fetches`와 응답 필드, `outcome` 값
- 클래스: `SiteFetcher`, `DirectSiteFetcher`, `FetchServiceSiteFetcher`, `AvailabilityResolver`와 구현 4개, `SiteResultDelivery`, `OneShotDelivery`, `ProgressiveDelivery`, `BookKeyNormalizer`, 묶음 실행기 이름, 웹 파일·함수 이름
- 설정 키: `chaekcheck.availability.fetch.mode`, `fetch.servers`, 묶음·상세 관련 키, 폴더 `fetch-service/`, changelog·CSV·fixture 파일 이름
- 값: P=5, 새 요청 시작 마감 3초, K=50, 상세 30초의 기준 시각(묶음 시작), 조회 서버 동시 처리 상한, 모두 쉼일 때의 오류 코드(`upstream_error`)
- 규칙
  - 여러 규칙이 맞을 때 앞선 그룹
  - 그룹 안 `holdings_count` 내림차순 → `id`
  - `PENDING`은 행 수에 세지 않음
  - 결과 없는 도서관은 줄 없음
  - 포털 빈칸 줄은 `deferred`와 상관없이 처리
  - 도서관별 더 보기 결과는 맨 아래 새 묶음
  - `libraries/{id}/ebooks`는 판정 뒤 응답
  - 상세 캐시 키
  - 수량 없는 줄의 제목·줄 자리, 동점 규칙
  - 제목 키 정리 규칙
  - 요약 줄은 요청한 도서관만
  - `UNKNOWN`/`UNVERIFIED` 가입 구분
- 문구: "구독형 · 바로 대출", "대출 가능 여부 확인 필요", "월 예산 소진 시 이용 불가", "더 보기 (남은 도서관 N곳)", "도서관 N곳 조회 중", "지금까지 N곳에서 찾지 못했습니다", "모든 도서관을 조회했습니다", "선택한 지역에서 자격이 확인된 도서관이 없습니다"

## [확인 필요] 항목과 개발 중 확인 방법

| 항목 | 확인 방법 | 막는 단계 |
|---|---|---|
| 새 이름 전부 | 사용자에게 질문, 또는 dev가 정하고 보고 | 인계 |
| P=5, 시작 마감 3초, K=50 | 프로토타입: 실제 사이트 여러 곳으로 묶음 시간 측정 | 9 |
| 상세 판정 30초의 기준 시각, 30초에 읽는 건수(1초 간격이면 호스트당 약 25건) | 프로토타입 | 7, 9 |
| 첫 응답 `targets` 크기(수백 개) | 프로토타입: 응답 바이트와 첫 결과까지 시간 측정 | 9 |
| 포털 상세 URL `menu_idx`(10/13/15)를 결과 줄 링크에서 얻을 수 있는지 | API 호출 시험. 안 되면 `library` 칸 추가를 사용자에게 알림 | 6 |
| 순위 값을 포털·구독형·EUC-KR·강남구에서 얻을 수 있는지, 오디오북 포함 여부(경북 "43,666 종" 후보) | API 호출 시험 + 사이트 화면 비교 | 11 |
| 한 사이트 주소를 여러 줄이 함께 쓰는 경우(`base_url` UNIQUE 유지) | seed 작성 때 목록 확인 | 11 |
| `library.name` UNIQUE가 수백 곳에서 지켜지는지 | seed 작성 때 확인 | 11 |
| 조회 서버 대수, 배치 위치, 고정 IP, 토큰 보관, "쉼" 시간, 인증 헤더 이름 | 사용자에게 질문 | 배포 (개발은 설정값 + TODO) |
| 인증서 오류 도서관이 본 서버·조회 서버 JDK에서 연결되는지 | 개발 때 연결 시험 | 6, 11 |
| 제목 비교 키: 괄호 부제·"큰글자책"·권차를 같게 볼지 | 화면 종류별 실제 제목 표기를 모아 비교 | 8 |
| 화면 종류마다 저자·출판사가 있는지와 표기 | API 호출 시험 (다음에 키를 넓힐 때를 위해 기록만) | 없음 |
| 인천처럼 판정이 일부만 빈 포털을 `deferred`로 둘지 | 빈 줄 비율을 호출로 확인한 뒤 사용자에게 질문 | 11 |
| "서버 여러 대" 제외 = 본 서비스 1대 | 사용자에게 확인 | 인계 |
| 교보 구독형 선택자, 공급 업체, 상세 주소, 월 예산 소진 표시 | API 호출 시험 | 6 |
| YES24 한 세대 전·강남구 페이지 크기(10줄 가능 여부) | API 호출 시험 | 6 |
| 교보 `recordCount=10`이 모든 교보 사이트에서 동작하는지 | API 호출 시험(표본) | 6 |
| 가입 자격 원문을 못 읽은 95곳 | 회원가입 안내 페이지 재확인. 못 찾으면 규칙 0줄 | 11 |
| 교보 목록의 도서관이 아닌 이름 33곳의 공공 이용 가능 여부 | 사이트 확인 | 11 |
| 차단된 도서관을 "도서관에서 검색하기" 링크로 대신 보여 주는 화면 | 설계 없음. 필요해지면 사용자에게 알림 | 없음 |

## 이번에 하지 않는 것

- 북큐브·알라딘·다산·서울도서관·충남도서관 등 새 화면 종류 adapter. 울산처럼 로그인이 필요한 사이트 조회(링크 표시도 이번에는 하지 않음)
- 새 주소를 못 찾은 약 20곳 재조사 (backlog "도서관 정보 주기적 재조사")
- 저자·출판사 검색 API(`field` 파라미터), `titleKey`에 저자·출판사 넣기, 같은 책 묶기(ISBN), 인기 도서 사전 수집
- 학교·소속 기관 자격, 판정 불가 자격(책이음 등)의 구조화와 사용자 입력, 회원가입·로그인
- 도서관 사용 여부·목록 관리 운영자 화면, 사용자별 도서관 추가·선택, 도서관 순위·정렬 옵션
- 구독형 월 예산 잔액 표시, 통합 포털 보유 수 추정
- Redis, IP별 rate limit, 본 서비스 여러 대, Kafka·K8s·게이트웨이·디스커버리, 조회 서버 능동 상태 확인
- 같은 호스트 사이트가 한 묶음에 몰리지 않게 순서 바꾸기, 같은 호스트 안 리다이렉트 따라가기, 순위 값 자동 재측정 (backlog 후보)
- 운영 기관 테이블, 실물 도서관(`PHYSICAL`)

## 사이클 01에서 이어지는 일 (이번 슬라이스 작업 아님, 잊지 않도록)

- 페이지 바닥 연락처, User-Agent의 서비스 URL과 연락처: 값을 사용자에게 받은 뒤 채웁니다. 조회 서버 User-Agent도 같은 값을 씁니다.
- 백엔드 포트(지금 8080), 운영 프로필의 Liquibase contexts에서 `test-data` 빼기
- dev 루트 `skill-change-api-design.md` 사본을 지울지 사용자에게 묻기

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. 개발 중에 사용자에게 알리고 dev `docs/plan-feedback.md`에 모아 두세요. 항목마다 **무엇이 달라졌는지와 이유**(사용자 발언이면 그대로)를 적습니다.

- 정한 값: 조회 서버 폴더·패키지·빌드 방식, 인증 헤더와 토큰 보관, "쉼" 시간, 조회 서버 제한 시간과 동시 처리 상한, P·K·시작 마감의 측정 결과와 최종값, `base_url`의 뜻
- 확인 결과
  - 화면 종류별 선택자·페이지 크기·페이지 파라미터
  - 교보 `recordCount=10` 표본
  - 포털 `menu_idx`
  - 구독형 월 예산 표시 여부
  - 순위 값 출처와 오디오북 포함 여부
  - 인증서 오류 도서관 연결 결과
  - `targets` 응답 크기
  - 30초 안에 읽은 상세 건수
  - `Documenter` API와 출력 경로
- 넣은 도서관 수(화면 종류별), 뺀 곳과 이유, 인천 `deferred` 결정, `name`·`base_url` UNIQUE 충돌 여부
- `[안]`으로 구현했거나 바꾼 것 ("[안] 값 목록" 기준), 제목 비교 키 정리 규칙의 최종안과 예
- 설계와 달라진 점: `library` 칸 추가 필요 여부, 3단계에서 `joinPolicy`를 임시로 유지했는지, 도서관별 더 보기 응답 방식 등
- 새로 알게 된 제약: 사이트 구조 변경, 응답 시간, 차단 징후(403·시간 초과가 계속되는 도서관과 끈 도서관), 같은 호스트 병목(교육청 서버)이 묶음 시간에 준 영향
