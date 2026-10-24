# 개발 인계서: 사이클 20 조회 상태 신호와 브라우저 확장 조회

- 기준 문서: plan `docs/cycles/20-lookup-status-and-extension/design-delta.md`입니다. 그중 **"개발 단계" 표가 뼈대**입니다. 숫자는 모두 plan `docs/settings-index.md`가 색인합니다(3·6·6-1·8절)
- 이 인계서의 자리: plan `docs/cycles/20-lookup-status-and-extension/handoff.md`, 같은 내용이 `docs/current/handoff.md`(dev `CLAUDE.md`가 읽음)에 들어갑니다. 사이클 19·21은 이미 dev main에 들어갔습니다(dev `docs/plan-feedback.md` `# 사이클 21`: 19가 main에 들어간 뒤 시작)
- ADR(모두 Accepted, 2026-10-17)
  - 0118: 상태 신호 10초 묻기 · `HostQueueBoard` · `/api/v1/lookup-status`
  - 0119: 확장은 사용자 쪽 조회 서버, 서버는 `accept`로 해석·검사
  - 0120: `extension/` 폴더, 빌드 없음, 크롬만, 개발자 모드
  - 0121: 모든 화면 같은 머리말
  - 0131: 화면을 떠나면 새 도서관을 띄우지 않음
  - 0132: 조회 부하 줄이기
  - 0133: 메모리 상태는 저장소 인터페이스 뒤 · 장부는 LRU 표
- 1-15(나가는 길)가 따르는 ADR: 0130(Accepted, 0095를 대신함), 0094(교보 구독형 서버). 사이클 17에서 옮겨 온 몫입니다(사용자 결정 2026-10-17)

## 목표 한 줄

서버 모드 검색에 상태 불·「확인하지 못한 도서관」·부하 줄이기를 먼저 넣습니다(1단계). 그다음 크롬 확장이 사용자 IP로 도서관 페이지를 받아 오고 서버는 해석만 하는 확장 모드를 넣습니다(2단계). 사람(브라우저)마다 세는 장치는 조건이 맞을 때 넣습니다(3단계).

## 일정과 다른 사이클과의 순서

- **dev 순서** [확정] (사용자, 2026-10-16: "사이클 20을 먼저 개발하고, 그다음 17 배포로 해"): 사이클 20 **1단계** → 사이클 17 배포 → 20 **2단계** → 20 **3단계**(조건부)
- **3단계를 만드는 조건** [확정] (사용자 승인, 2026-10-17, 전반 점검 #1·마무리 확인 #9): 크롬 웹스토어에 올릴 때, 또는 거절 기록(`usagelog.rejected_event`)에 남용이 보일 때. 조건이 오기 전에는 만들지 않습니다
- **나가는 길(길 목록 EC2 1 + Webshare 20 · 길 설정 · 길마다 간격 · 막힌 길 처리 · 나간 길 기록)은 이 사이클 1단계 1-15에서 만듭니다** [확정] (사용자, 2026-10-17: "Webshare 20개 길, 막힌 길 처리, 이건 20dev에서 할 수 있자나"). 처음 인계서(2026-10-17)는 이것이 사이클 17·webshare 작업 몫이라 dev에 없다고 보고 "길 하나 · 막힌 길 빈 목록 · 포트 없으면 `reason=NONE`"으로 1단계를 만들게 했고, dev는 그대로 1-7(`HostQueueBoard.DEFAULT_LANE = "direct"`)·1-8(`EgressLaneStatus.NONE`)을 만들었습니다(dev `plan-feedback.md` `# 사이클 20`). 1-15가 그 자리에 진짜 길을 넣습니다
  - 사이클 17에 남는 것: 업체 데이터 세기(80% · 90%, Webshare 사용량 API 키), 업체 오류(407 · 429 · 계정)면 Webshare 길 전체 멈춤, CloudWatch → SNS 메일. 그래서 1단계에서 `vendorLanesPaused()`는 늘 `false`입니다
- 사이클 21은 main에 들어가 있습니다(836bd7b). 머리말 점 자리 `data-lookup-status-slot`은 이미 `web/src/components/AppLayout.tsx`에 있습니다(2026-10-17 읽음)
- Liquibase 번호 [확정] (사이클 21 설계 검토 #4): 19 = `usagelog/002`, 21 = `usagelog/003`, 20 = `usagelog/004`. 둘 다 이미 main에 있으므로 004 include는 master **맨 끝**(지금 `usagelog/003` 다음)에 둡니다

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. dev에서 고치지 않습니다
- 구현이 이 인계서나 design-delta와 달라져야 하면(값·이름·구조·순서) 조용히 바꾸지 않습니다. 먼저 사용자에게 알리고 dev `docs/plan-feedback.md`의 새 **`# 사이클 20`** 절에 적습니다. 사용자 발언은 그대로 옮깁니다
- `[안]`·`[안: 이름]`(클래스·속성·코드 이름, 안쪽 구조)은 dev가 코드에 맞춰 바꿀 수 있습니다. 바꾸면 `# 사이클 20` 절에 알리기만 합니다
- **바꾸지 않는 것** [확정]
  - 단계 나눔과 3단계 조건
  - 숫자: 자리 40, 노랑 20 · 빨강 40(절반·전부), 503 뒤 10초 빨강, 상태 메모 1초, 묻기 10초, 회색 30초, DB 오류 30초 회색, 회색이 모든 단계보다 앞섬, 기다림 10초 창, 시간 초과 60초, 해석 자리 8 · 2초, 1MB, 결과 10, 이어 부르기 3묶음, 확장 캐시 500 · 처음 넣은 시각 + 3분 고정, 계획 보관함 25,000 · 10분 · 가득이면 503, nginx 한도 값
  - 주소: `/api/v1/lookup-status`, `/api/v1/lookup-plans` 밑
  - 화면 문구 전부(design-delta "웹 (화면)")
  - `usagelog/004`의 세 변경
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인함
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 코드에는 `TODO(확인 필요)`로 두고 확인한 뒤 보고합니다
- 단계 안에서도 번호마다 통과해야 다음으로 갑니다
  - `backend/`에서 `./gradlew build`(`ModularityTests`·`DocumentationTests` 포함)
  - `fetch-service/`를 고친 번호는 `fetch-service/`에서 `./gradlew build`
  - 웹은 `web/`에서 `npm run build`와 vitest
  - 확장은 `extension/`에서 `node --test`
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`)을 따릅니다. Spring Boot 4 / Jackson 3 / TanStack Query v5 / Chrome MV3 코드는 Context7로 지금 문서를 보고 씁니다

## 읽을 문서 (chaekcheck-plan, 읽기 전용)

- `docs/cycles/20-lookup-status-and-extension/design-delta.md`
  - "개발 단계", "전반 점검으로 바뀐 것" #1~#13
  - 구조 그림(흐름 1·2·3, 도메인 모델)
  - "모듈" 표와 그 아래 bullet(사람마다 세기, 메모리 상태 저장소, 결과 10, 상태 불이 읽는 나가는 길 값, 책 화면 10권)
  - "데이터", "API"(올리기 검사 순서 포함), "외부 연동", "웹 (화면)", "확장 꾸러미", "확인 필요"
- `.../spec.md`: R1~R16 · R15-1, 상태별 동작, AC-1~AC-45 · AC-10a
- `.../flow.md`: H(머리말) · S1 · S3 · F1~F3. AC 대응표의 "단계" 칸이 이 인계서의 단계와 같습니다
- `.../scope.md`: 범위 결정, 제외 목록
- ADR: `docs/adr/0118`, `0119`, `0120`, `0121`, `0131`, `0132`, `0133`
- `docs/settings-index.md`
  - 2·3절(시간·동시 수), 5절(캐시), 6절(상태 불·확장), 6-1절(해석 자리·gzip·1MB 넘음 기록·요약 로그)
  - **8절(환경 변수 이름 규칙과 목록)**
- `docs/research/maintenance/memory-state-and-redis.md`: 메모리 상태 목록, 여러 대일 때 공유 여부, 설정 `state-store`
- 사이클 17로 넘긴 것: `docs/cycles/17-first-deploy/`의 아래 파일(17이 만들고, 20은 앱 쪽만 만듦)
  - `from-cycle-20-observability.md`: CloudWatch 경보 · `-XX:+ExitOnOutOfMemoryError` · graceful 종료
  - `from-cycle-20-prod-env-numbers.md`: `prod.env` "대출 조회 숫자" 묶음
  - `from-cycle-20-blocked-ip-resume.md`, `from-cycle-20-proxy-only.md`, `from-research-lookup-egress.md` — 이 셋의 길 목록 · 길 설정 · 막힌 길 처리 부분은 2026-10-17에 1-15로 옮겨 왔습니다(업체 데이터 세기 · 업체 오류 멈춤 · 경보는 17에 남음)
- 1-15 기준: ADR-0130, ADR-0094, `docs/cycles/17-first-deploy/spec.md` R13 · AC-8 · AC-9, `docs/research/deploy/multi-source-ip.md` 7 · 8 · 9 · 11절
- dev `docs/plan-feedback.md` `# 사이클 21` #9(폰 `.end`가 점 자리 탭을 받음, 2026-10-17)

## 개발 시작 전 확인

- [x] Gradle group ID / base package: `com.chaekcheck` [확정] (dev `CLAUDE.md`)
- [ ] 이 사이클 작업 폴더·DB compose 프로젝트를 main과 나눌지 [안: dev가 정함]
- [ ] 1단계 시작 전: nginx를 거친 SSE에서 클라이언트가 끊겼을 때 Spring이 send 실패·`onError`로 알아채는 시점 [확인 필요: dev 시험, design-delta 확인 필요 표 "인계"] — 1-10번이 여기에 기댑니다
- [ ] 2단계 시작 전: 2-0번 프로토타입 [확인 필요]
- [ ] 2단계 시작 전: 사이클 17 `prod.conf`가 nginx 템플릿(envsubst)을 쓰는지 [확인 필요: 17 인계서·dev 17 결과 확인]

---

## 1단계 (사이클 17 배포 앞)

만드는 것은 design-delta "개발 단계" 1단계 칸 그대로입니다. 메모리 상태 인터페이스는 이 단계에서 만드는 것만 둡니다(상태 불 메모, 마지막 DB 오류 시각, `HostQueueBoard`, `SearchSlots.lastRefusedAt`). 이미 있는 캐시·`HostThrottle`은 지금 인터페이스 그대로입니다 [확정] (설계 검토 #1).

### 1-0. 준비와 설정 색인 문서

1. **dev 설정값 목록 새로 만들기** (파일: `docs/maintenance/settings-index.md`, 새 파일. `docs/maintenance/README.md`에 링크)
   - 할 일
     - 값마다 한 줄: 값 / 어디(파일·속성) / 환경 변수 / 함께 바꿀 곳 / 왜 / 정한 plan 문서·ADR / 바꾸면 다시 켤 것
     - 이 사이클이 건드리는 값부터 채우고, 코드의 값 옆 주석은 이 문서를 가리킵니다
   - 이유: [확정] (세 관점 검토 #17, plan `docs/settings-index.md` 머리말)
   - 의존: 없음 / 위험: 낮음

### 1-1. 설정값: 자리 40 · 결과 10 · 1MB · 책 10권 · 상태 저장소

1. **`application.yml` 값 바꾸기** (파일: `backend/src/main/resources/application.yml` 113~152행 `chaekcheck.availability`)
   - `max-concurrent-searches: 20 → 40` [확정] (전반 점검 #13), `CHAEKCHECK_AVAILABILITY_MAXCONCURRENTSEARCHES`. 주석의 "20 x 5 = 100"도 고칩니다
   - `batch.row-limit: 20 → 10` [확정] (ADR-0132), `CHAEKCHECK_AVAILABILITY_BATCH_ROWLIMIT`
   - `max-body-size: 4MB → 1MB` [확정] (세 관점 검토 #7), `CHAEKCHECK_AVAILABILITY_MAXBODYSIZE`. 운영 compose에서는 `${LOOKUP_MAX_BODY_MB}MB`로 넘김(사이클 17 몫)
   - 새 속성 `chaekcheck.lookup.state-store: memory` (이름 [안], `CHAEKCHECK_LOOKUP_STATESTORE`)
     - 값은 `memory`만 받습니다. 다른 값이면 켤 때 멈춤 [안]
     - Redis 의존성·연결 설정은 넣지 않습니다 [확정] (ADR-0133)
     - 구현 고르기 방식(`@ConditionalOnProperty` 등)은 dev가 정합니다 [안]
   - 위험: 중간. 자리 40은 해석 자리(1-4번)와 함께 들어가야 힙 어림(약 340MB)이 맞습니다(plan `settings-index.md` 6-1절). **1-4번 전에 운영에 내보내지 않습니다**
2. **조회 서버 본문 상한** (파일: `fetch-service/src/main/resources/application.yml` 33행 `max-body-size: 4MB → 1MB`, `FETCH_MAXBODYSIZE`)
   - 위험: 낮음. 사이클 17은 조회 서버를 꺼 두고 배포합니다(scope 제외 목록)
3. **책 기준 검색 기본 쪽 크기를 설정 속성으로** (파일: `backend/src/main/java/com/chaekcheck/catalog/internal/web/BookParams.java` 30·75행)
   - 할 일
     - 지금 `MAX_PAGE_SIZE = 20` 하나가 기본값과 최대를 함께 맡습니다. 기본값을 새 설정 속성으로 나눕니다(값 10, 이름 [안: dev], 예 `chaekcheck.catalog.books.default-page-size` → `CHAEKCHECK_CATALOG_BOOKS_DEFAULTPAGESIZE`)
     - 최대 20은 그대로 둡니다
     - 웹은 `pageSize`를 보내지 않습니다 [확정] (검토 #30. dev `web/src`에 보내는 곳 없음, 2026-10-17 확인)
   - 시험: `pageSize` 없이 부르면 10권, `pageSize=20`이면 20권, `21`이면 지금처럼 400 (AC-21)
   - 위험: 낮음. 웹 시험 자료의 `pageSize: 20`(`BookList.test.tsx` 등)이 기대값이면 맞춥니다

### 1-2. 사용 기록: `usagelog/004`와 1MB 넘음 칸

1. **Liquibase changeset** — 아래 "Liquibase" 절
2. **`ResponseResult`에 값 하나** (파일: `backend/src/main/java/com/chaekcheck/usagelog/UsageLog.java` 59~67행, `internal/write/UsageLogWriter.java` 61~71행, `internal/buffer/UsageRow.java`)
   - 할 일
     - `BODY_TOO_LARGE`(이름 [안])를 더합니다
     - 집계할 때 `failed_count`와 `body_too_large_count`에 모두 1을 더합니다 [확정] (마무리 확인 #6)
     - upsert SQL에 `body_too_large_count = d.body_too_large_count + EXCLUDED.body_too_large_count`를 더합니다
   - **1단계에서는 `ResponseSource.EXTENSION`·`SERVER_FOR_EXTENSION`과 거절 이유 `invalid_plan`·`invalid_client_key`를 코드에 넣지 않습니다.** 004 CHECK가 그 값을 미리 허용하는 것을 오류로 보지 않습니다 [확정] (마무리 확인 #10). 그 값을 쓰는 코드가 없어도 스키마 시험·모듈 시험이 실패하지 않게 둡니다
   - 시험(`db-test` 통합): `BODY_TOO_LARGE` 하나 → 그날 그 도서관 줄의 `failed_count` +1, `body_too_large_count` +1 (AC-34). 004를 적용한 뒤 `source='extension'`·`reason='invalid_plan'` 줄을 넣을 수 있는지 SQL로 한 번 확인합니다(미리 허용 확인)
   - dev 문서: `docs/maintenance/5-usage-log.md`에 새 칸 설명
   - 의존: 없음 / 위험: 낮음

### 1-3. 도서관 요청 gzip + 풀었을 때 1MB + 1MB 넘음 기록 (ADR-0132, AC-34)

1. **직접 부르기** (파일: `backend/src/main/java/com/chaekcheck/availability/internal/fetch/DirectSiteFetcher.java`, `UnderscoreHostSiteFetcher.java`, `BodyLimit.java`)
   - 할 일
     - 요청에 `Accept-Encoding: gzip`을 붙입니다(지금 dev 0건, 2026-10-17 확인)
     - 응답이 `Content-Encoding: gzip`이면 받은 바이트(압축본)도 1MB에서 끊고, 풀면서 센 크기도 1MB를 넘으면 그 자리에서 끊습니다(압축 폭탄 막기) [확정]
     - JDK `HttpClient`는 압축을 알아서 풀지 않으므로 푸는 쪽을 직접 둡니다. `gzip`이 아닌 `Content-Encoding`이면 그 도서관만 실패합니다 [안]
   - 이유: 전반 점검 #6
   - 위험: 중간(EUC-KR 사이트의 바이트를 그대로 adapter에 넘겨야 함, 글자 변환 금지)
2. **조회 서버 경유** (파일: `fetch-service/src/main/java/com/chaekcheck/fetch/LibraryClient.java` 140~170·245~258행, `BodyLimit.java`, `FetchResult.java`; 본 서비스 `FetchServiceSiteFetcher.java` 147~154행)
   - 할 일
     - 조회 서버도 `Accept-Encoding: gzip`을 보내고, 풀린 바이트를 같은 1MB 상한으로 셉니다
     - 지금은 크기 넘음이 `outcome=ERROR`라 본 서비스가 구별하지 못합니다. 그래서 `Outcome`에 `BODY_TOO_LARGE`(이름 [안])를 더하고 본 서비스가 알아보게 합니다
     - 본 서비스는 모르는 outcome을 지금처럼 오류로 보므로 **조회 서버를 먼저 배포**해도 깨지지 않습니다 [안]
   - 이유: design-delta 외부 연동 "직접·조회 서버 경유 모두"
   - 위험: 중간. **이 설계 세부(새 outcome)는 design-delta에 없으므로 `# 사이클 20`에 알립니다**
3. **넘음 표시와 기록** (파일: `availability/internal/UpstreamException.java`, `search/BatchRunner.java` 337~370행 `answered`, `web/LibraryEbookController.java` 100~116행)
   - 할 일
     - `UpstreamException`에 "본문 상한 넘음" 표시를 둡니다(Kind 하나 또는 플래그, [안])
     - 넘어서 실패하면 다음 셋을 남깁니다
       - ① INFO 한 줄 `body_too_large library=… url=… receivedBytes=… at=…` (모양 [안])
       - ② `usageLog.recordLibraryResponse(…, BODY_TOO_LARGE, …)`
       - ③ 요약 로그 카운터 +1(1-11번)
     - 화면에는 그 도서관만 `library-failed`(지금 실패와 같음)
   - 시험
     - 시험용 HTTP 서버(JDK `HttpServer` 등)로 다음을 봅니다
       - 요청 머리에 `Accept-Encoding: gzip`이 있음
       - 평문 1MB+1 → 실패
       - gzip 압축본 10KB가 풀면 2MB(폭탄) → 실패, 메모리를 1MB 넘게 잡지 않음
       - 보통 gzip 페이지는 평문과 같은 해석 결과
       - 실패 때 로그 한 줄과 사용 기록 +1
     - fetch-service에도 같은 시험을 둡니다
   - 측정 [확인 필요: dev 측정]: 도서관 몇 곳(1초 간격)의 압축 전·후 크기 → `# 사이클 20`에 기록
   - 의존: 1-2 / 위험: 중간

### 1-4. 해석 자리 `ParseSlots` 8 · 기다림 2초 (전반 점검 #4, AC-33)

1. **해석 자리** (새 파일 [안]: `availability/internal/fetch/ParseSlots.java`. 쓰는 곳: `fetch/LibraryPageFetcher.java` 101~110행 `load`의 `adapter.parse`, `resolve/DetailPageFetcher.java` 91행 근처 `load`의 상세 해석)
   - 할 일
     - `Semaphore(8)`로 둡니다. 본문이 다 온 뒤 자리를 기다리며, 최대 2초 [확정]
     - 그래도 없으면 그 도서관만 실패합니다(`UpstreamException` ERROR, 문제 코드 예 `parse_busy` [안]). 결과는 `library-failed`, 사용 기록 `FAILED`, 캐시에 넣지 않음 [안] (실패한 future는 Caffeine이 지움 — dev 확인)
     - 상세 해석까지 같은 자리를 쓸지는 [안: 권장 같은 자리]
     - 2단계 확장 올리기도 **이 같은 자리**를 씁니다
     - 서버마다 따로인 장치라 저장소 인터페이스로 빼지 않습니다 [안] (design-delta 메모리 상태 bullet)
   - 설정: `chaekcheck.availability.parse-slots.max: 8`, `…parse-slots.wait: 2s` (이름 [안: dev], 환경 변수는 8절 규칙: `CHAEKCHECK_AVAILABILITY_PARSESLOTS_MAX`·`_WAIT`)
   - 시험
     - 해석을 막아 둔 가짜 adapter로 9번째가 2초 기다린 뒤 실패하고, 동시에 해석 중인 수의 최댓값이 8을 넘지 않음(AC-33 서버 모드 부분)
     - 자리를 못 얻은 도서관만 실패하고 나머지는 결과
   - 의존: 1-1 / 위험: 중간

### 1-5. `detailUrl` 같은 호스트 검사를 서버 모드에도 (AC-18 서버 모드)

1. **검사 넣기** (파일: `fetch/LibraryPageFetcher.java` 126행 `toPage`의 `detailUrl`, `resolve/DetailLookupResolver.java` 51~54행 `lookup`)
   - 할 일
     - `DetailPageFetcher.checkedUri(detailUrl, baseUrl)`(http(s)·도서관과 같은 호스트)를 통과한 것만 씁니다. 아니면 `null` → 표시도 호출도 안 합니다
     - `toPage`에서 거르면 캐시 경로도 같이 막힙니다
   - 시험: 다른 호스트 `detailPath`가 든 시험 페이지 → 결과 줄의 `detailUrl`이 null이고, `DetailPageFetcher.fetch`가 불리지 않음(캐시 적중 경로 포함)
   - 의존: 없음 / 위험: 낮음

### 1-6. 503 시각과 마지막 DB 오류 시각 (저장소 인터페이스)

1. **`SearchSlots`에 거절 기록** (파일: `availability/internal/search/SearchSlots.java`)
   - 할 일
     - `acquire()`가 거절할 때 시각을 적습니다. 상태 계산용 `inUse()`(= max − available)와 요약 로그용 "503 수"를 둡니다
     - 시각은 작은 인터페이스 뒤에 둡니다(예: `RefusalRecord`·`InMemoryRefusalRecord`, 이름 [안]). 저장소 고르기는 `state-store=memory`
   - 시험: 거절 → `lastRefusedAt`이 그 시각
   - 위험: 낮음
2. **공개 메서드 `LookupHealth.recordDbError()`** (새 파일: `backend/src/main/java/com/chaekcheck/availability/LookupHealth.java`, 모듈 맨 위 공개 패키지. 지금 이 패키지에 타입 없음)
   - 할 일
     - 메서드 하나만 공개합니다(이름 [안]) [확정] (설계 검토 #3)
     - 구현은 `internal`에 둡니다. "마지막 DB 오류 시각" 값 하나 + 요약 로그용 수를 인터페이스 뒤에 둡니다
   - 위험: 낮음
3. **루트 예외 처리기에서 부르기** (파일: `backend/src/main/java/com/chaekcheck/ApiExceptionHandler.java`)
   - 할 일
     - `DataAccessException`(연결 얻기 실패 `CannotGetJdbcConnectionException` 포함)과 `CannotCreateTransactionException`을 처리하는 `@ExceptionHandler`를 더하고 `recordDbError()`를 부릅니다
       - `CannotCreateTransactionException`은 `DataAccessException`이 아니지만, DB가 꺼지면 `@Transactional` 시작에서 이것이 남 — dev가 Spring 문서로 확인 [확인 필요]
     - 응답은 지금 `unexpected`와 **같은** 500 `internal_error`로 둡니다
     - 생성자 주입. 모듈 예외 처리기 중 이 예외를 먼저 잡는 곳이 없는지 확인합니다(design-delta: 없음, 2026-10-17 읽음)
     - 감수 [안]: SSE 스트림 안·예약 작업의 DB 오류는 이 처리기를 거치지 않아 세지 않습니다
   - 시험: 저장소가 `DataAccessException`을 던지게 한 MVC 시험 → `recordDbError` 호출, 응답 본문·상태가 바뀌기 전과 같음. `ModularityTests` 통과(루트 패키지는 모듈이 아님)
   - 의존: 1-6-2 / 위험: 낮음

### 1-7. 줄 선 호스트 `HostQueueBoard` (전반 점검 #3, R4, AC-5·AC-32)

1. **보드** (새 파일 [안]: `availability/internal/fetch/HostQueueBoard.java`(인터페이스), `InMemoryHostQueueBoard.java`)
   - 할 일
     - 열쇠 `(laneId, hostKey, libraryId)` → 기다림마다 **시작 시각**, 그 호스트의 최근 시간 초과 시각
     - 0이 되면 그 줄을 지웁니다
     - 상태를 계산할 때 시작한 지 **10초** 지난 기다림은 세지 않습니다(스스로 낫기) [확정]
     - 시간 초과는 **60초** 동안 줄 섬으로 봅니다 [확정] (R4)
     - 같은 호스트에 도서관이 여럿(통합 포털)이면 그 호스트에서 본 도서관 모두를 줄 섬으로 봅니다
     - `laneId`는 길이 들어오기 전까지 상수 하나 [안] (dev: `HostQueueBoard.DEFAULT_LANE = "direct"`). 길 목록 · 막힌 길은 1-15에서 넣고, 기다리는 동안 길이 정해지지 않는 문제는 1-15 할 일 3에서 다룹니다
     - 자료 구조 `ConcurrentHashMap` [안]
   - 설정: 기다림 창 10초, 시간 초과 창 60초 (이름 [안: dev], 예 `chaekcheck.availability.lookup-status.queue-wait-window: 10s`·`queue-timeout-window: 60s` → 8절 규칙으로 환경 변수)
   - 함께 바꿀 곳: 10초 = 묶음 마감 8초 + 2초(마감을 바꾸면 함께)
2. **기다림 짝 맞추기** (파일: `fetch/LibraryPageFetcher.java` `load`, `resolve/DetailPageFetcher.java` `load`)
   - 할 일
     - `HostThrottle.run`에는 도서관 번호가 없으므로 부르는 두 곳에서 감쌉니다 [안]
       - `throttle.run` 전에 `begin(lane, hostKey, libraryId)`
       - 넘긴 `Callable`의 첫 줄(호출 시작)에서 `end()`
       - `finally`에서 한 번 더 `end()`(두 번 불러도 한 번만 빠짐)
     - `end()` 전에 throttle이 TIMEOUT을 던지면 그것을 "자리 대기 시간 초과"로 기록합니다
     - 감수 [안]: 상세 페이지(마감 30초) 기다림도 10초 뒤에는 세지 않습니다
   - 시험(dev 단위 시험 둘, AC-32) [확정]
     - ① 기다리는 중 오류를 던져도 그 도서관의 기다림 수가 0으로 돌아옴
     - ② 시작한 지 10초 지난 기다림이 줄 선 목록에서 빠짐(가짜 시계)
     - 더해서: 시간 초과 뒤 60초 동안 목록에 있고, 61초에 빠짐
   - 의존: 없음 / 위험: 중간

### 1-8. 상태 API `GET /api/v1/lookup-status` (R1~R4, ADR-0118)

1. **`LookupStatusService`** (새 파일 [안]: `availability/internal/status/LookupStatusService.java`, 나가는 길 읽기 포트 `EgressLaneStatus.java` [안])
   - 할 일
     - 1초 메모(`AtomicReference` + 동시에 여럿 와도 계산은 한 번) [확정]
     - 판정 순서 [확정] (R1, 설계 검토 #4)
       - ① 최근 30초 DB 오류 → `GRAY` + `DB_ERROR`
       - ② `inUse >= slots`, 또는 최근 10초 503, 또는 (`프록시만` + 업체 길 모두 멈춤) → `RED`(이유 `NO_LANE`은 마지막 경우만)
       - ③ `inUse >= slots/2` 또는 업체 길 멈춤 → `YELLOW`(업체면 `VENDOR_PAUSED`)
       - ④ 그 밖 `GREEN`, `reason=NONE`
     - `queuedLibraryIds`는 1-7 보드에서 최대 200개 [안]
     - 나가는 길 포트는 나가는 길 코드가 주는 읽기 전용 인터페이스입니다(예: `vendorLanesPaused()`·`egressMode()`, 이름 [안])
       - 20이 인터페이스와 "멈춘 길 없음 · 모두" 기본 구현을 먼저 둡니다 → `reason=NONE` [안] (dev 1-8: `EgressLaneStatus` + `NONE`, `# 사이클 20`에 알림 완료)
       - 1-15에서 진짜 구현으로 바꿉니다: `egressMode()`는 길 설정에서 읽은 실제 값, `pausedLaneCount()`는 막힌 길 수. **`vendorLanesPaused()`는 사이클 17이 업체 멈춤을 넣을 때까지 기본 `false`** [확정] (사용자 결정 2026-10-17의 나눔)
   - 설정(이름 [안: dev], 8절 규칙): 메모 1초, 503 뒤 빨강 10초, DB 오류 회색 30초, 목록 최대 200
2. **`LookupStatusController`** (새 파일 [안]: `availability/internal/web/LookupStatusController.java`)
   - 할 일
     - 응답: `200 {slots, inUse, level, reason, queuedLibraryIds, serverTime}`, `Cache-Control: no-cache`
     - 도서관을 부르지 않습니다
     - 로그인과 무관(`SecurityConfiguration`의 `permitAll` 쪽)
     - nginx는 dev `deploy/nginx/chaekcheck-locations.conf`의 일반 `location /api/`로 갑니다(도서관 호출 구역 아님). 바꿀 것 없음. 일반 구역 5r/s는 사이클 17 `prod.conf` 몫
   - 시험
     - 판정 표 단위 시험: 회색이 빨강·`NO_LANE`보다 앞섬, 자리 40에서 19 초록 · 20 노랑 · 40 빨강, 503 뒤 10초 빨강 · 11초 원래대로, 가짜 포트로 `VENDOR_PAUSED`·`NO_LANE`(AC-2·AC-27 서버 부분)
     - 메모: 1초 안 두 번 → 계산 한 번
     - 컨트롤러: 60번 불러도 `SiteFetcher`·`HostThrottle`이 불리지 않음(AC-7)
   - 의존: 1-6, 1-7 / 위험: 낮음

### 1-9. (번호 비움 — 1-6에 합침)

### 1-10. 떠나면 멈춤 · 책 화면 줄 상한 없음 (ADR-0131, R15-1)

1. **떠난 묶음 멈추기** (파일: `search/BatchRunner.java` 295행~ `runTasks`, `search/BatchSession.java` 59·207행, `search/HoldingSession.java` 45·148행, `search/StreamEvents.java` 112행 `StopReason`, `web/EbookSearchStreamController.java`·`EbookBatchStreamController.java`·`BookAvailabilityStreamController.java`·`BookAvailabilityBatchStreamController.java`, `resolve/DetailLookupResolver.java`)
   - 할 일
     - `clientGone`이면 새 도서관을 띄우지 않습니다. `StopReason.CLIENT_GONE`을 더하고, 남은 후보는 `notSent` → 사용 기록 `SKIPPED`. 포털 상세도 새로 시작하지 않습니다
     - 이미 넘긴 요청(줄 대기 포함)은 끝까지 받아 캐시에 넣습니다(취소 안 함)
     - 넘긴 요청이 다 끝나면 자리를 반납합니다
     - `send` 실패뿐 아니라 `SseEmitter.onError`·`onTimeout`에서도 `clientGone`을 켭니다
     - 책 화면 스트림도 같게 합니다 [확정] (검토 #14)
   - 시험: 가짜 sink가 둘째 이벤트부터 실패 → 그 뒤 새 fetch 0건, 남은 후보 SKIPPED, 진행 중 요청은 캐시에 들어감(AC-24)
   - 확인 필요: nginx를 거친 SSE 끊김을 언제 알아채는지(dev `deploy/nginx/local-test.conf`로 시험)
   - 위험: 중간
2. **책 화면 대출 상태에 줄 상한 없음** (파일: `search/BatchRunner.java` 221~223행 `startHoldingBatch`의 `new HoldingSession(…, settings.rowLimit(), …)`)
   - 할 일
     - holding 묶음에는 `row-limit`을 넘기지 않습니다(제한 없음) [확정] (검토 #26)
     - 동시 5 · 8초 마감 · 마감 3초 전 새 출발 멈춤은 그대로, 마감 때 남은 것은 지금처럼 `notSent`
   - 시험: holding 30개 묶음이 10줄에서 멈추지 않음(AC-28 서버 부분), 바로 검색은 10줄 뒤 새 요청 없음(AC-21)
   - 의존: 1-1 / 위험: 낮음

### 1-11. 1분 운영 요약 로그 (ADR-0132, AC-40)

1. **요약 로그** (새 파일 [안]: `availability/internal/config/LookupOpsSummaryLog.java`. 지금 `CacheStatsLog.java`와 같은 방식, `AvailabilityConfiguration.java`에 bean)
   - 할 일
     - 1분마다 INFO 한 줄 `key=value` [안: 필드 이름 dev]
     - 넣을 것: 검색 자리 사용(1분 최대·지금), 503 수, 힙 사용·최대, 멈춘 길 수(1-15 전 0), 1MB 넘음 수, DB 오류 수, 서버 도서관 요청 수
     - 2단계에서 확장 도서관 요청 수·계획 무게 합, 3단계에서 장부 크기를 더합니다
     - CloudWatch 지표 필터로 읽기 쉽게 한 줄로 씁니다
   - 설정: 간격 1분 (이름 [안: dev], 8절 규칙)
   - 503 급증 경보 기준값은 dev가 정해 `# 사이클 20`에 적습니다 [안]. 경보 자체는 사이클 17
   - 시험: 가짜 시계로 한 번 돌리면 필드가 모두 있는 한 줄, 카운터는 찍은 뒤 0
   - 의존: 1-3, 1-6, 1-7 / 위험: 낮음

### 1-12. 웹: 머리말 상태 불 (R1~R5, R14, ADR-0118·0121)

1. **API·훅** (새 파일 [안]: `web/src/api/lookupStatus.ts`, `web/src/features/lookupstatus/useLookupStatus.ts`, `LookupStatusProvider.tsx`)
   - 할 일
     - TanStack Query로 10초마다 묻습니다(`VITE_LOOKUP_STATUS_POLL_SECONDS`=10, 이름 [안])
     - 탭이 숨으면 멈추고, 다시 보이면 바로 한 번 묻습니다(TanStack Query v5 `refetchInterval`·`refetchIntervalInBackground`·포커스 동작은 Context7로 확인)
     - 마지막 **성공** 시각부터 30초가 지나면 회색 「상태 모름」입니다. 탭 복귀 때도 바로 판정합니다 [확정] (R5)
     - 검색·책 화면이 503 `server_busy`를 받으면 그 즉시 빨강, 다음 응답이 오면 그 값으로 돌아갑니다 [확정] (R2). 고칠 곳: `features/search/blocked.ts`·`useSearch.ts`·`useHoldings.ts`에서 provider에 알림
     - Provider는 `AppLayout` 안에 둡니다
2. **`HeaderSignal`** (새 파일 [안]: `web/src/features/lookupstatus/HeaderSignal.tsx` + css. 고칠 곳: `web/src/components/AppLayout.tsx` 36행 `statusSlot` 자리, `components/HeaderMenu.tsx`)
   - 할 일
     - 점 + 짧은 글: 초록 「조회 원활」 · 노랑 「조회 붐빔」 · 빨강 「조회 혼잡」 · 회색 「상태 모름」 [확정]
     - 첫 응답 전에는 그리지 않고 자리만 둡니다 [확정]
     - 폰(640px 이하)은 점만 둡니다. 「로그인」 바로 왼쪽, 누르는 영역 44px
     - 점·글을 누르면 PC도 폰도 같은 말풍선이 열립니다(마우스 올림·title 툴팁 없음) [확정] (검토 #20)
     - 말풍선 둘째 줄 [확정]
       - 초록 「지금 바로 찾을 수 있어요」
       - 노랑 「찾는 사람이 늘고 있어요. 조금 느릴 수 있어요」
       - 빨강 「지금 찾는 사람이 많아 검색이 거절될 수 있어요」
       - 회색(응답 없음) 「조회 상태를 받아오지 못했어요」
       - 회색(`DB_ERROR`) 「상태를 확인할 수 없어요」
       - 노랑 + `VENDOR_PAUSED` 「지금은 조회가 평소보다 느려요」
       - 빨강 + `NO_LANE` 「지금은 도서관 조회를 할 수 없어요」
     - 메뉴와 말풍선은 동시에 열리지 않습니다. 점을 눌러도 메뉴가 열리지 않습니다. Esc는 열린 것 하나만 닫고 포커스를 연 자리로 돌립니다 [확정] (사이클 21 dev 결과 검토 #9)
     - 320px에서 「책첵」·▾·점·「로그인」이 한 줄에 들어가고 메뉴를 열 빈 곳이 남는지 확인합니다. 점과 ▾의 순서는 dev가 화면에 맞춥니다 [안]
     - 움직임 없음
     - 접근성 ◆
       - 점 버튼 `aria-label="조회 상태: 원활"`(색마다)
       - `role="status"`(polite)는 단계가 **바뀔 때만** 글을 바꿈
       - 대비 4.5:1 이상
   - ADR-0121 `AppLayout` `legal` 분기 제거: **이미 됨, 확인만** (사이클 21 dev. 2026-10-17 `AppLayout.tsx`에 분기 없음 확인). `AppLayout.test.tsx`에 `/terms`·`/privacy`에서도 점 자리·메뉴·「로그인」이 보이는 시험만 더합니다(AC-1 둘째 문장)
   - 시험(vitest)
     - 색·이유 → 글·둘째 줄 표(AC-1·AC-2·AC-27·AC-37)
     - 503 받으면 즉시 빨강(AC-3)
     - 숨김 → 묻기 멈춤 · 보임 → 즉시 1회(AC-6)
     - 실패 30초 유지 → 회색, 30초 넘게 숨긴 뒤 첫 실패면 바로 회색(AC-42)
     - `aria-label`, 바뀔 때만 알림(AC-20)
     - 점을 누르면 말풍선 · 메뉴 닫힘, 메뉴를 열면 말풍선 닫힘, Esc
   - 의존: 1-8 / 위험: 중간(폰 머리말 폭)

### 1-13. 웹: 「확인하지 못한 도서관」 묶음 · 줄 글 · 「밀려요」 (R4·R12, AC-4·AC-5·AC-16)

1. **묶음과 줄 글** (파일: `web/src/features/search/sortBatch.ts`, `holdingPlan.ts`, `BatchSection.tsx`, `ResultList.tsx`, `ResultRow.tsx`, `resultFilter.ts`, `DirectResults.tsx`, `InstantResults.tsx`, `features/picks/` 사서추천 창 줄)
   - 할 일
     - `failed` + `UNKNOWN` 줄을 모든 묶음에서 모아, 결과 맨 아래 「더 보기」 바로 위에 묶음 하나 「확인하지 못한 도서관」으로 둡니다. 순서는 계획 순서, 거름 둘 모두에서 보입니다 [확정] (검토 #2)
     - "지금 빌릴 수 있는 책만" 거름 대상에서 그 묶음을 뺍니다. 빈 결과 문구는 묶음을 뺀 수로 세고 "N곳은 확인하지 못했어요"를 붙입니다 ◆
     - 줄 글은 「확인 실패」 → 「대출 정보를 확인하지 못했어요」 [확정]
     - `gone` 줄은 지금처럼 예약 묶음 맨 아래 「이 도서관 목록에서 빠졌어요」 [확정] (검토 #3)
     - 직접 찾기(`DirectResults.tsx`)에서 실패한 도서관은 도서관 하나를 한 줄로 둡니다 [확정] (검토 #1)
       - 「○○도서관 · 대출 정보를 확인하지 못했어요」, 누르면 그 도서관 검색 페이지
       - "없습니다" 문구는 실패를 뺀 곳만 센 뒤 "N곳은 확인하지 못했어요"
     - S14 사서추천 창은 줄 글만 바뀝니다(묶음 제목·배지 없음, 실패 줄은 3줄 안에서 맨 뒤)
     - 빨강이어도 카드 변화 없음
2. **「지금 이 도서관 조회가 밀려요」** (파일: `ResultRow.tsx`, provider의 `queuedLibraryIds`)
   - 할 일
     - **아직 조회 중인 줄과 「확인하지 못한 도서관」 줄에만** 붙입니다. 정상으로 받은 줄에는 붙이지 않습니다
     - 실패로 끝난 순간 붙어 있었으면 새 검색 전까지 남깁니다
     - 자리: PC는 이름 옆, 폰은 이름 아래. 직접 찾기는 도서관 줄 [확정] (검토 #5)
   - 시험(vitest): `sortBatch.test.ts`·`holdingPlan.test.ts`·`ResultRow.test.tsx`·`resultFilter.test.ts`에 AC-4·AC-5·AC-16 사례
   - 의존: 1-12 / 위험: 중간

### 1-14. 웹: 책 화면 이어 부르기 최대 3묶음 → 「더 보기」 (R15-1, AC-28·AC-36)

1. **자동 이어 부르기** (파일: `web/src/features/search/useHoldings.ts` 76~93행 `loadNext`, `holdingPlan.ts`, `BookList.tsx`)
   - 할 일
     - 첫 묶음이 끝났는데 보이는 10권 안에 남은 holding이 있으면 화면이 바로 다음 묶음(`…/book-availabilities/batches/stream`)을 부릅니다
     - 첫 묶음 포함 **최대 3묶음**까지 [확정]. 그 뒤 남은 줄은 「대출 정보 조회 중」 대신 「더 보기」를 보입니다. 버튼 자리는 그 책 줄 아래 끝, 지금 「더 보기」와 같은 모양 [확정] (마무리 확인 #8)
     - 누르면 다음 묶음부터 다시 최대 3묶음을 부릅니다
     - S14·추천도서 책 창의 넓히기(`holdingLimit` 3 → 6 → 10 → 20)는 이 상한과 따로 셉니다 [확정]. 한 단계 안의 이어 부르기도 같은 3묶음 [안]
   - 설정: `VITE_*` 하나 (이름 [안: dev], 예 `VITE_HOLDING_AUTO_BATCHES`=3)
   - 시험: 가짜 스트림으로 남은 것이 계속 있으면 3번 부른 뒤 멈추고 「더 보기」, 누르면 이어서(AC-36). 남은 것이 없으면 이어 부르지 않음(AC-28)
   - 의존: 1-10-2 / 위험: 낮음

### 1-15. 나가는 길: 길 목록과 막힌 길 (webshare 작업 범위 일부, 사용자 결정 2026-10-17)

- **운영 길 설정 = `proxy-only`(프록시만)** [확정] (사용자: "나는 ec2 주소에서 직접 도서관 조회하는 건 설정으로 분리하자고 했는데;; 프록시만 사용하도록 하고", 2026-10-18). 코드 기본값은 `all` 그대로 두고 운영 `prod.env`에서 `CHAEKCHECK_AVAILABILITY_EGRESS_MODE=proxy-only`(fetch-service도 같게)로 덮음(사이클 17 `from-cycle-20-prod-env-numbers.md`). `proxy-only`에서 EC2 자기 IP로는 도서관 요청·막힌 길 다시 시험 모두 하지 않음


- **대출 조회 요청 User-Agent** = 일반 브라우저와 같은 값, 우리 이름을 넣지 않음 [확정] (사이클 17 spec R13-5, 사용자 2026-10-14; ADR-0095 → ADR-0130이 이어받음). 수집기는 대상 아님. 17 design-delta의 "연락처를 넣은 값"은 이것과 어긋난 것이라 17이 맞춤


- 왜 여기: 사용자 "Webshare 20개 길, 막힌 길 처리, 이건 20dev에서 할 수 있자나" (2026-10-17, webshare 세션 전달) [확정]. 사이클 17 인계 파일 `from-research-lookup-egress.md`의 #1~#4·#9를 이 번호로 옮깁니다. 같은 결정이 plan `docs/research/deploy/multi-source-ip.md` 11절, `docs/cycles/17-first-deploy/design-delta.md` 머리에 있습니다
- 기준 문서(plan, 읽기 전용): ADR-0130(Accepted, ADR-0095를 대신함), ADR-0094(교보 구독형 서버), `docs/cycles/17-first-deploy/spec.md` R13 · AC-8 · AC-9, `docs/cycles/17-first-deploy/from-research-lookup-egress.md` #1~#4 · #9, `from-cycle-20-proxy-only.md`, `from-cycle-20-blocked-ip-resume.md`, `docs/research/deploy/multi-source-ip.md` 7 · 8 · 9 · 11절, `docs/settings-index.md` 3 · 4 · 8절
- 이 번호에서 만들지 않는 것(사이클 17에 남음): 아래 "사이클 17에 남는 것"
- 기록: 이 번호의 기록은 dev `docs/plan-feedback.md`의 **`# 사이클 webshare (사이클 20 안에서, 2026-10-17)`** 절에 적습니다(dev 세션이 정한 절 이름). 나머지 1단계 기록은 `# 사이클 20` 그대로

#### 정해진 값 (바꾸지 않음)

| 값 | 내용 | 태그 |
|---|---|---|
| 길 목록 | EC2 자기 IP 1(시드니 <서버 IP>, 프록시 없이 직접) + Webshare 한국 정적 주거용(공유) 20(주소:포트 목록, IP Authorization = EC2 IP라 인증 값 없음). 바뀌는 주거용은 넣지 않음(나중, plan `docs/backlog.md`) | [확정] (사용자 승인 2026-10-16, ADR-0130, `from-research-lookup-egress.md` #2) |
| 두 경로 모두 | 본 서비스가 직접 부르는 길(`fetch.mode=direct`)과 조회 서버를 거치는 길(`fetch-service`) **둘 다** 같은 길 설정을 씀 | [확정] (사용자: "이거 자체 서버에서 조회하는거랑 따로 조회서버 두는거랑 둘 다 개발되어야 해", 2026-10-16) |
| 서버 자기 공인 IP 여러 개 | 길 종류로 지원. 구현 방법은 dev: IP마다 tinyproxy `Bind`로 "우리 프록시 목록"을 만들면 업체 프록시와 같은 코드 | 지원 [확정] (ADR-0130) / 방법 [안] |
| 길 설정 | `모두`(기본, 21개) / `프록시만`(Webshare 20만) / `직접만`(EC2 1). 대출 조회 길에만(책 목록 수집기는 따로). 바꾸면 서비스 다시 켜기만. 설정 이름 · 값 철자는 dev | 값 셋 [확정] (사용자 승인 2026-10-16, 사이클 20 세 관점 검토 #24) / 철자 [안] |
| `프록시만` | EC2 IP로는 도서관에 요청을 보내지 않음(**막힌 길 다시 시험 요청 포함**). Webshare 길이 모두 멈춰도 EC2로 자동으로 넘어가지 않음 | [확정] (`from-cycle-20-proxy-only.md` 결정 2·3) |
| 길마다 호출 간격 | (길, 도서관 사이트 호스트)마다 동시 1건 · 앞 요청 끝 + 1초 | [확정] (사용자 승인 2026-10-16, ADR-0094 · ADR-0130, `settings-index.md` 3절) |
| 교보 구독형 서버 | `*.dkyobobook.co.kr`은 길마다 묶어 세고 동시 3건, 1초 간격 없음. 3은 설정. 느려지거나 연달아 실패하면 동시 1건으로 내림, 막힘 신호면 그 길을 그 사이트에서 멈춤(아래 막힌 길) | 3 · 길마다 · 설정 [확정] (ADR-0094, 사용자 "추가로 동시 건수는 설정으로 조절 가능하게 해줘" 2026-10-13) / 내리고 멈추는 기준 숫자 [안: dev, ADR-0094: 수집기 값(평균 응답 12초, 5번 연달아 실패) 참고] |
| 고르는 순서 | 그 사이트에 지금 보낼 수 있는 고정 IP 길을 먼저(지금 길 21개는 모두 고정 IP). 막힌 길은 고르지 않음 | [확정] (ADR-0130) |
| 막힌 길 | 그 길만 그 사이트에서 멈추고 다른 길로는 계속. 다른 사이트는 영향 없음 | [확정] (spec R13-4, ADR-0130) |
| 다시 시험 | 멈추고 **10분 뒤** 그 길에서 그 사이트에 시험 요청 1건(검색 첫 페이지 GET 하나, 그 길의 호스트 1건 · 1초 규칙 안에서). 정상(2xx, adapter가 해석하는 HTML)이면 바로 풂. 또 막혔으면 쉼을 **두 배**(10 → 20 → 40 → 80분 …), **상한 7일**. 사용자의 실제 검색은 시험에 쓰지 않음(막힌 길로는 사용자 요청을 보내지 않음) | [확정] (사용자 승인 2026-10-15, 상한 "상한은 일주일로 가자") |
| 막힘으로 보는 기준 | ADR-0094대로 dev가 정함 | [안: dev] |
| 모든 길이 막힌 사이트 | 그 도서관은 실패 → 화면 「확인하지 못한 도서관」(ADR-0094 "확인 불가") | [확정] (ADR-0094, `from-cycle-20-blocked-ip-resume.md` #3) |
| 남길 것 | 조회 기록(요청마다 쓰는 서버 로그 줄)에 나간 길 · 업체. 멈춤 시작 · 시험 · 풀림은 로그 한 줄씩(사이트, 길, 다음 시험 시각) + 지표(길 · 사이트별 막힘 0/1, 시험 횟수). 수동 "풀기" 버튼 · 관리 화면 없음(급하면 설정에서 그 길을 빼고 다시 켬) | [확정] (ADR-0095 · 0130, `from-cycle-20-blocked-ip-resume.md` #2) |
| 확장 모드 | `accept` 경로(2단계)는 길을 쓰지 않음 | [확정] (ADR-0119) |

#### 할 일

1. **길 목록과 길 설정** (새 파일 [안]: `availability/internal/egress/EgressLane.java`(길 하나: `id`, 종류 `DIRECT`|`PROXY`, 프록시 `host:port`, 업체 이름), `EgressLanes.java`(설정에서 목록을 만들고 길 설정으로 거름). 고칠 곳: `availability/internal/config/AvailabilityProperties.java`, `application.yml` `chaekcheck.availability`)
   - 할 일
     - 새 속성(이름 [안: dev], 환경 변수는 plan `docs/settings-index.md` 8절 규칙)
       - `chaekcheck.availability.egress.mode`: `all`(기본) | `proxy-only` | `direct-only` → `CHAEKCHECK_AVAILABILITY_EGRESS_MODE`
       - `chaekcheck.availability.egress.proxies`: 쉼표로 이은 `주소:포트` 목록(기본 빈 값) → `CHAEKCHECK_AVAILABILITY_EGRESS_PROXIES`. 운영 값은 서버 비밀 값(spec R13-2, Parameter Store `/chaekcheck/prod/*`)이고 `prod.env`에 넣는 것은 사이클 17 몫
       - `chaekcheck.availability.egress.proxy-vendor`: 기록에 쓸 업체 이름(기본 `webshare`) → `CHAEKCHECK_AVAILABILITY_EGRESS_PROXYVENDOR`
     - 길 번호: 직접 길 `direct`, 프록시 길은 목록 순서대로 `proxy-01` … `proxy-20` [안: dev]. 길 번호에 프록시 주소를 넣지 않습니다(로그에 비밀 값이 남지 않게) [안]
     - `proxy-only`인데 프록시 목록이 비었으면 켤 때 멈춥니다 [안]. `all`에 목록이 비면 지금처럼 직접 길 하나(로컬 개발 기본)
     - 켤 때 로그 한 줄: 길 설정 · 길 수 · 업체 이름(주소는 쓰지 않음) [안]
   - 위험: 낮음
2. **길마다 HTTP 클라이언트** (고칠 곳: `fetch/SiteFetcher.java`, `DirectSiteFetcher.java`, `UnderscoreHostSiteFetcher.java`, `HostRoutingSiteFetcher.java`, `config/AvailabilityConfiguration.java` `siteFetcher`)
   - 할 일
     - `SiteFetcher.fetch(URI, Instant deadline)`에 길을 넘깁니다(예: `fetch(URI, Instant, EgressLane)`, 모양 [안: dev])
     - JDK `HttpClient`: 길마다 클라이언트 하나. 프록시 길은 `HttpClient.Builder.proxy(ProxySelector.of(new InetSocketAddress(host, port)))`, 직접 길은 `ProxySelector` 없이(기본 선택기를 끄려면 `HttpClient.Builder.NO_PROXY`). https 도서관은 프록시에 CONNECT 터널로 갑니다. 인증 값이 없으므로 `jdk.http.auth.tunneling.disabledSchemes`는 건드리지 않습니다 (https://docs.oracle.com/en/java/javase/25/docs/api/java.net.http/java/net/http/HttpClient.Builder.html , 2026-10-17 확인 [확정]). 서버 자기 IP 여러 개를 직접 붙일 때는 같은 문서의 `localAddress(InetAddress)`(Java 19+)도 쓸 수 있음 [안: 위 tinyproxy 방법과 dev가 고름]
     - 밑줄 호스트 길(Apache HttpClient 5, `UnderscoreHostSiteFetcher`)도 길마다 프록시를 둡니다(`HttpClients.custom().setProxy(...)` 또는 `setRoutePlanner(...)`, dev `plan-feedback.md` 사이클 18 A2-6 기록 그대로 [확인 필요: dev가 Context7로 HttpClient 5 문서 확인])
     - TLS(`LibrarySiteTls`) · 시간 제한 · 1MB · gzip(1-3) · User-Agent는 길과 상관없이 같게
   - 위험: 중간
3. **길 고르기 + 길마다 간격** (고칠 곳: `fetch/HostThrottle.java`, `fetch/InMemoryHostThrottle.java`, `fetch/LibraryPageFetcher.java` `throttled`, `resolve/DetailPageFetcher.java`)
   - 할 일
     - throttle 열쇠를 호스트에서 **(길, 호스트)**로 바꿉니다. `host-max-concurrency` 1 · `host-min-interval` 1s는 이제 "한 길 · 한 사이트" 값입니다(속성 이름은 그대로, 뜻만 바뀜 → dev 설정 색인에 적음)
     - `HostThrottle.run`이 길을 골라 넘깁니다(예: `run(uri, deadline, lane -> siteFetcher.fetch(uri, deadline, lane))`, 모양 [안: dev])
       - 고르기: 길 설정으로 걸러진 길 중 그 사이트에서 막히지 않은 길 → 지금 자리가 비고 간격이 지난 길을 먼저. 여럿이면 돌아가며 [안: dev] (17 AC-8 "번갈아")
       - 모두 바쁘면 가장 먼저 비는 길을 마감까지 기다립니다(마감 규칙은 지금과 같음: 묶음 8초 · 「더 보기」 8초 · 상세 30초, `settings-index.md` 3절)
       - 그 사이트에서 모든 길이 막혔으면 기다리지 않고 바로 ERROR(문제 코드 예 `no_lane_for_host` [안]) → 그 도서관만 `library-failed` · 사용 기록 `FAILED` · 캐시 안 넣음
     - 교보 구독형: `*.dkyobobook.co.kr` 호스트는 길마다 하나로 묶어 세고 동시 `kyobo-subscription` 값(3), 1초 간격 없음. 느려지거나 연달아 실패하면 그 길에서 동시 1건으로 내림 [기준 숫자 안: dev]
       - 새 속성(이름 [안: dev]) `chaekcheck.availability.kyobo.subscription-max-concurrency: 3` → `CHAEKCHECK_AVAILABILITY_KYOBO_SUBSCRIPTIONMAXCONCURRENCY`
     - `HostQueueBoard`(1-7): 기다리는 동안은 아직 길이 정해지지 않으므로 `begin`은 지금 `HostQueueBoard.DEFAULT_LANE`을 "아무 길이나 기다림" 뜻으로 그대로 씁니다 [안: dev]. 막힌 길은 고르지 않으므로 줄 선 계산에 들어가지 않습니다(spec R4)
     - 상태 저장소: (길, 호스트) 자리 · 막힌 길 표는 `HostThrottle`과 같은 인터페이스 뒤 메모리 구현(`state-store=memory`) [확정] (ADR-0133)
   - 위험: 높음(모든 서버 모드 조회가 지나는 곳)
4. **막힌 길과 다시 시험** (새 파일 [안]: `availability/internal/egress/BlockedLanes.java`(인터페이스) + `InMemoryBlockedLanes.java`, `BlockedLaneRetest.java`(예약 작업))
   - 할 일
     - (길, 호스트) → 멈춘 시각 · 다음 시험 시각 · 지금 쉼 길이 · 시험 횟수 · 시험에 쓸 주소(그 사이트에서 마지막으로 실패한 검색 첫 페이지 주소 [안])
     - 막힘 판정: 그 길 · 그 사이트 응답을 보고 dev가 정한 기준으로(ADR-0094) [안: dev]. 1MB 넘음 · 해석 실패(`parse_busy` 포함) · 시간 초과 한 번은 막힘으로 보지 않는 안 [안: dev]
     - 다시 시험: 다음 시험 시각이 지난 줄마다 그 길로 시험 요청 1건. 그 길 · 호스트의 1건 · 1초 자리를 함께 씀. 정상이면 줄을 지우고, 아니면 쉼 × 2(상한 7일)
     - `프록시만`이면 `direct` 길은 목록에 없으므로 시험도 하지 않습니다
     - 로그: `lane_paused host=… lane=… vendor=… nextRetestAt=…`, `lane_retest host=… lane=… result=… nextRetestAt=…`, `lane_resumed host=… lane=…`, 7일 상한에 닿을 때 `lane_retest_capped …` (모양 [안: dev]. 사이클 17 CloudWatch 경보 · 메일이 이 줄을 읽음 → 이름을 `# 사이클 webshare (사이클 20 안에서, 2026-10-17)`에 적음)
     - 지표: 길 · 사이트별 막힘 0/1, 시험 횟수(Actuator 또는 1-11 요약 로그. 방식 [안: dev])
     - 메모리라 다시 켜면 막힌 길 표가 비고, 막힌 길은 다음 실제 요청에서 다시 막힘으로 판정됩니다 [안: 감수]
   - 위험: 중간
5. **조회 서버 경유** (고칠 곳: `fetch-service/src/main/java/com/chaekcheck/fetch/LibraryClient.java`, `FetchProperties.java`, `FetchController.java`, `fetch-service/src/main/resources/application.yml`; 본 서비스 `fetch/FetchServiceSiteFetcher.java` `FetchRequest`)
   - 할 일
     - 길 고르기 · 간격 · 막힌 길은 **본 서비스 한 곳**에서 합니다(조회 서버에는 throttle이 없음, ADR-0011). 본 서비스가 고른 길 번호를 요청에 실어 보냅니다: `FetchRequest(url, requestId, lane)`(칸 이름 [안])
     - 조회 서버는 같은 길 설정을 읽어 길 번호 → 프록시를 찾고 그 길의 클라이언트로 부릅니다(JDK 길 · 밑줄 호스트 길 둘 다)
       - 새 속성(이름 [안: dev]) `fetch.egress.mode` → `FETCH_EGRESS_MODE`, `fetch.egress.proxies` → `FETCH_EGRESS_PROXIES`, `fetch.egress.proxy-vendor` → `FETCH_EGRESS_PROXYVENDOR`. 운영 compose는 두 서비스에 같은 값을 넘깁니다(짧은 공통 이름 예 `LOOKUP_EGRESS_MODE` · `LOOKUP_EGRESS_PROXIES`, plan `settings-index.md` 8절 `LOOKUP_*` 방식 [안]; compose · `prod.env`는 사이클 17)
     - `lane`이 없으면 직접 길(옛 본 서비스와 맞음), 모르는 길 번호거나 길 설정에서 빠진 길(`프록시만`에서 `direct` 등)이면 `outcome=ERROR`로 거절 [안]. 조회 서버를 먼저 배포해도 깨지지 않게 합니다
     - 응답의 길 번호를 본 서비스 `SiteResponse.via`와 함께 남깁니다
   - 시험: fetch-service에 아래 "시험" ①~③ 같은 것, 본 서비스 `FetchServiceSiteFetcher` 시험에 요청 본문의 `lane`
   - 위험: 중간
6. **조회 기록에 길** (고칠 곳: `DirectSiteFetcher` 126행 · `UnderscoreHostSiteFetcher` 167행 `upstream via=…` 줄, `FetchServiceSiteFetcher` 96행 `fetch-service via=…` 줄, fetch-service `LibraryClient` 194 · 252행 `library host=…` 줄, `resolve/DetailPageFetcher.java` 99행)
   - 할 일
     - 요청마다 쓰는 줄에 `lane=<길 번호> vendor=<업체 이름 | direct>`를 더합니다(모양 [안: dev]). 프록시 주소는 쓰지 않습니다 [안]
     - 사용 기록(`usagelog`) 표에는 길 칸을 더하지 않습니다(Liquibase 변경 없음) [안]. "조회 기록"은 위 서버 로그 줄입니다
   - 위험: 낮음
7. **상태 불 · 요약 로그가 읽는 값** (고칠 곳: `status/EgressLaneStatus.java`, `config/AvailabilityConfiguration.java` `egressLaneStatus`, `ops/LookupOpsSummaryLog.java`)
   - 할 일
     - `EgressLaneStatus.NONE` bean을 진짜 구현으로 바꿉니다(이름 [안]): `egressMode()`는 길 설정에서 읽은 값, `pausedLaneCount()`는 막힌 (길, 사이트) 줄 수 [안: "길 수"로 셀지 dev]
     - `vendorLanesPaused()`는 **사이클 17이 업체 멈춤을 넣을 때까지 늘 `false`** [확정] (이번 결정의 나눔: 업체 오류 · 데이터 90% 멈춤은 17). 그래서 `VENDOR_PAUSED` · `NO_LANE`은 1단계에서도 단위 시험(가짜 포트)까지만 봅니다
     - 사이트 하나에서 모든 길이 막힌 것은 `NO_LANE`이 아닙니다(그 도서관만 「확인하지 못한 도서관」)
     - 요약 로그 `pausedLanes`(지금 0)가 실제 값을 찍습니다
   - 위험: 낮음

#### 시험 (17 spec · ADR 기준과 대응)

| 기준 | 시험 |
|---|---|
| 17 AC-8 / R13-1 · #9 (나간 길 · 업체 기록, 번갈아) | 시험용 HTTP 서버 둘을 프록시 길로 두고(`http://` 도서관 주소는 프록시에 절대 주소 요청으로 옴) 같은 사이트를 여러 번 부름 → 두 프록시가 번갈아 받고, `upstream … lane=` 줄이 두 길로 번갈아 남음. 조회 서버 경유도 같음 |
| R13-3 (길마다 따로 셈, 동시 1건 · 1초) | 가짜 시계 단위 시험: 길 3개 · 같은 사이트 요청 3건 → 셋이 동시에 나감, 같은 길 둘째 요청은 앞 요청 끝 + 1초 뒤. 다른 사이트는 서로 막지 않음 |
| ADR-0094 교보 3건 | `x.dkyobobook.co.kr`·`y.dkyobobook.co.kr`이 한 길에서 합쳐 동시 3건까지, 넷째는 기다림, 1초 간격 없음. 길이 둘이면 합쳐 6건 |
| 17 AC-9 / R13-4 (막힌 길만 멈춤) | 한 프록시 길만 막힘을 돌려주는 시험 서버 → 그 사이트는 다른 길로 계속 결과, 다른 사이트는 막힌 길도 계속 씀 |
| 막힌 길 다시 시험 (10분 · 두 배 · 7일) | 가짜 시계: 10분에 시험 1건 → 또 막힘 → 20분 → 40분 … 7일에서 멈춤. 정상 응답이면 바로 풂. 시험 요청도 그 길의 1건 · 1초 자리를 씀. 사용자 요청은 막힌 길로 0건 |
| 모든 길이 막힌 사이트 | 길 둘이 모두 막힘 → 기다리지 않고 그 도서관만 `library-failed`, 사용 기록 `FAILED` |
| `프록시만` · `직접만` (`from-cycle-20-proxy-only.md`) | `proxy-only`: 직접 길로 요청 0건(다시 시험 포함), 프록시가 모두 막혀도 직접으로 넘어가지 않음. `direct-only`: 프록시로 요청 0건. `proxy-only` + 빈 목록 → 켤 때 멈춤 |
| 상태 포트 (AC-27 서버 부분) | `egressMode()`가 설정 값, `vendorLanesPaused()`는 false, `pausedLaneCount()`가 막힌 줄 수. 가짜 포트 판정 표(1-8)는 그대로 통과 |
| 로그 · 지표 | 멈춤 · 시험 · 풀림 줄이 한 줄씩, 프록시 주소가 로그에 없음 |
| 밑줄 호스트 | 밑줄 호스트 주소도 고른 길의 프록시로 감(본 서비스 · 조회 서버) |

- 실제 Webshare 길: Webshare IP Authorization이 EC2 IP 하나뿐이라 **로컬 PC에서는 Webshare에 붙지 않습니다**(plan `multi-source-ip.md` 9-4절 · ADR-0130 감수). 로컬은 위 시험용 프록시로만 봅니다. 실제 21길 확인은 사이클 17 배포 때 EC2에서: 같은 도서관을 여러 번 불러 `lane=` 줄에 여러 길이 남는지, 부산 전자도서관(`ebook.busan.go.kr:8081/FxLibrary`)이 Webshare 길로 열리는지 [확인 필요: 17 배포 때 dev]

#### 1-15 완료 기준

- [ ] 위 "시험" 표 모두 통과, `backend/` · `fetch-service/` `./gradlew build`(모듈 검증 포함. 새 모듈 · 이벤트 없음, 모든 새 코드는 `availability/internal` 안)
- [ ] `fetch.mode=direct`와 `fetch-service` 두 경로 모두 길을 씀
- [ ] 로컬에서 시험용 프록시 둘을 `CHAEKCHECK_AVAILABILITY_EGRESS_PROXIES`로 넣고 `bootRun` → 실제 검색에서 `lane=` 줄이 길마다 남고, `CHAEKCHECK_AVAILABILITY_EGRESS_MODE=proxy-only`로 켜면 `lane=direct` 줄 0
- [ ] dev `docs/maintenance/settings-index.md`에 새 속성 · 환경 변수 · 뜻이 바뀐 `host-max-concurrency`/`host-min-interval`, `# 사이클 webshare (사이클 20 안에서, 2026-10-17)`에 정한 이름 · 막힘 기준 숫자 · 교보 내리기 기준 · 로그 줄 모양

#### 사이클 17에 남는 것 (이 번호에서 만들지 않음)

- 업체 데이터 세기: 우리 서버가 Webshare 프록시로 받은 데이터(확장 모드 응답은 빼기)와 1시간마다 Webshare 사용량 API `GET https://proxy.webshare.io/api/v2/stats/aggregate/`(`bandwidth_total`) 중 큰 값, 플랜 250GB의 80% 경고 · 90% Webshare 길 멈춤 · 다음 달 다시 켬, Webshare API 키(서버 비밀 값) (`from-research-lookup-egress.md` #5)
- 업체 쪽 오류(407 · 429 `client_connect_high_concurrency` · 계정 확인 · 정지)면 Webshare 길 전체 즉시 멈춤, EC2 IP로 계속(#6). 이때 `EgressLaneStatus.vendorLanesPaused()`를 17이 채웁니다
- CloudWatch 경보 → SNS 메일(같은 일 1시간에 한 번, 보낼 일 다섯 가지)(#7)
- 운영 `prod.env` · compose의 길 설정 값과 Webshare 주소 비밀 값 넣기
- 1-15는 17이 위 셋을 붙일 자리만 남깁니다: 길마다 받은 바이트를 셀 수 있는 곳(`SiteResponse` · 로그), 업체 길을 한꺼번에 멈출 수 있는 길 목록 [안: dev가 자리 모양을 `# 사이클 webshare (사이클 20 안에서, 2026-10-17)`에 적음]

### 1단계 완료 기준

- [ ] AC-1~8, 16, 18(서버 모드), 20, 21(서버 모드), 24, 27(길 설정은 1-15 뒤 실제 값, `VENDOR_PAUSED`·`NO_LANE`은 업체 멈춤이 오는 사이클 17 뒤 실제 확인 — 그전에는 단위 시험까지), 28, 32, 33(서버 모드), 34, 36, 37, 40, 42
- [ ] 1-15 완료 기준(사이클 17 spec AC-8 · AC-9, R13-1 · 3 · 4, 막힌 길 다시 시험, 길 설정 셋), 두 경로(직접 · 조회 서버) 모두
- [ ] `backend/` `./gradlew build` 통과(`ModularityTests.verifiesModularStructure`와 의존 방향 시험 그대로 통과. 새 모듈·이벤트 없음), `fetch-service/` `./gradlew build`, `web/` `npm run build` + vitest
- [ ] Playwright로 데스크톱(1280) → 태블릿(768) → 폰(375 · 320) 머리말 · 말풍선 · 결과 묶음 확인
- [ ] **사용자가 자기 폰(Samsung Internet)에서 dev 웹 서버 `web-lan-5174`(`.claude/launch.json`, 같은 Wi-Fi)로 확인한 뒤 1단계를 닫습니다**
  - 머리말 점이 「로그인」 바로 왼쪽, 점을 누르면 말풍선이 열리고 메뉴는 닫힌 채
  - 320 · 375에서 가로 스크롤 없음
  - 「확인하지 못한 도서관」 묶음 · 「밀려요」 글이 이름 아래
  - 책 화면 「더 보기」
  - Chrome 폰 흉내만으로는 부족합니다 (사용자 결정, 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-design-addendum-decisions.html` #3)
- [ ] dev `docs/maintenance/settings-index.md`에 1단계 값 모두 + `docs/plan-feedback.md` `# 사이클 20` 1단계 기록 + 1-15는 `# 사이클 webshare (사이클 20 안에서, 2026-10-17)` 기록

---

## 2단계 (사이클 17 배포 뒤, 확장 최소판)

장부·쿠키는 없습니다. 사람을 가리키는 것은 **계획 번호 + 만든 IP(/64)**입니다 [확정] (전반 점검 #1). 확장이 못 여는 도서관은 그 도서관만 「확인하지 못한 도서관」입니다(서버 대행 목록은 3단계).

### 2-0. 프로토타입 [확인 필요] (design-delta 확인 필요 표, 막는 단계 "인계")

1. **확장 service worker로 받아 보기** (임시. 결과만 기록)
   - 할 일
     - 사이트 3곳 이상, 1초 간격으로 받아 봅니다: `http://` 도서관(전주 `:8095`), 중간 인증서가 빠진 도서관, 리다이렉트하는 도서관
     - 받은 바이트(EUC-KR)가 지금 adapter로 같은 결과로 해석되는지 봅니다
     - 결과(열림/못 열림, 이유)를 dev `docs/plan-feedback.md` `# 사이클 20`과 `docs/maintenance/settings-index.md`에 적습니다
     - 못 여는 도서관이 있으면 2단계에서는 「확인하지 못한 도서관」으로 남고, 3단계 서버 대행 목록 후보가 됩니다
   - 참고(막지 않음): 전체 호스트 CORS 일괄 확인, 크롬 Private Network Access 적용 여부

### 2-1. 사용 기록: 확장 출처 · 거절 기록 공개 메서드

1. **`usagelog` 공개 API** (파일: `usagelog/UsageLog.java`, `internal/DefaultUsageLog.java`, `internal/write/UsageLogWriter.java`)
   - 할 일
     - `ResponseSource.EXTENSION` → `'extension'`
     - 새 공개 메서드 `recordRejected(UsageRequest request, String reason)`(지금 없음)
       - 원본 값 없이 이유만 받습니다. `raw_values`에는 planId · itemId · 이유만 넣고 본문은 넣지 않습니다 ◆
       - IP · 이유마다 1분 1줄로 모으는 것은 `availability` 쪽에서 합니다 [안]
     - `client_ip_changed`는 거절 기록에 남기지 않습니다 [안]
   - 시험: `source=extension` 줄 쌓임(AC-15), `invalid_plan` 1분에 여러 번 → 1줄
   - 위험: 낮음

### 2-2. 캐시: 출처 표시와 확장 결과 캐시 500칸

1. **캐시 값** (파일: `fetch/FetchedPage.java`, `fetch/CaffeineSearchPageCache.java`, `resolve/CaffeineDetailVerdictCache.java`)
   - 할 일
     - 값에 `via`(`server`|`extension`)와 `storedAt`을 더합니다. 해석 값만 두고 원본 바이트는 두지 않습니다
2. **확장 결과 캐시** (새 파일 [안]: `fetch/ExtensionPageCache.java` 인터페이스 + Caffeine 구현)
   - 할 일
     - 따로 500칸 [확정]
     - 만료는 **처음 넣은 시각 + 3분 고정**입니다. 다시 넣으면 값만 바꾸고 만료는 늘리지 않습니다 [확정] (검토 #10). Caffeine `Expiry`에서 `expireAfterUpdate`가 남은 시간을 그대로 돌려주는 방식 [안]
     - 넣는 규칙: 서버 출처 값·진행 중인 서버 로드는 덮지 않습니다 ◆
     - 서버 모드는 서버 칸 → 확장 칸 차례로 봅니다 [확정] (검토 #9, 전반 점검 #2)
     - 확장 모드는 캐시를 **읽지 않습니다** [확정] (설계 결정 #9)
   - 설정: 칸 수 500 (이름 [안: dev], 예 `caches.extension-page-max-size` → `CHAEKCHECK_AVAILABILITY_CACHES_EXTENSIONPAGEMAXSIZE`)
   - 시험
     - 501곳째를 넣어도 500을 넘지 않음
     - 2분 뒤 다시 넣어도 3분에 만료
     - 서버 값이 있으면 확장 값이 덮지 않음
     - (AC-10a · AC-45 dev 단위 시험)
   - 위험: 중간

### 2-3. 받은 응답 입구 `accept` · 포털 상세 2단계

1. **`accept`** (파일: `fetch/LibraryPageFetcher.java`, `resolve/DetailPageFetcher.java`, `resolve/SiteListResolver.java`)
   - 할 일
     - `LibraryPageFetcher.accept(target, query, page, SiteResponse via=extension)`, `DetailPageFetcher.accept(…)`
     - throttle · `SiteFetcher` · `detailPages.fetch`를 **부르지 않습니다**
     - 해석은 1-4 해석 자리, `detailUrl`·`detailItems`는 1-5 검사를 통과한 것만, 캐시는 2-2 규칙
     - `SiteListResolver`를 "상세 주소 뽑기 / 받은 상세로 판정" 둘로 나눕니다
     - 확장 응답은 업체 데이터 세기(사이클 17)에 넣지 않습니다 [안]
   - 시험: `accept` 경로에서 throttle · SiteFetcher · `detailPages.fetch` 호출 0건(목 검증) ◆
   - 위험: 중간

### 2-4. 계획 보관함 `SearchPlanStore`

1. **보관함** (새 파일 [안]: `availability/internal/plan/SearchPlanStore.java` 인터페이스 + `InMemorySearchPlanStore.java`)
   - 할 일
     - `planId`: `SecureRandom` 16바이트, base64url [안]
     - 계획에는 `kind`(SEARCH|HOLDING|MORE), `batchNo`, **`creatorIp`(/64)**, `deadlineAt`, `rowLimit`, 항목들(`itemId`, `libraryId`, `page`, `url`, `kind`, `state`)을 둡니다. 받은 본문은 보관하지 않습니다
     - 무게(주소 수) 합 25,000, 쓴 뒤 10분 만료 [확정]
     - 가득이면 다른 사람 계획을 밀어내지 않고 새 계획 요청을 503 [확정] (검토 #8)
     - 닫힌 계획(close · `replaces`)은 바로 지웁니다
     - 2단계는 IP마다 임시 상한을 두지 않습니다 [확정] (마무리 확인 #9)
   - 설정: 무게 25,000 · 유지 10분 (이름 [안: dev], 8절 규칙)
   - 시험: 가득 → 503, 다른 계획은 그대로(AC-23 서버 부분). 만료. `replaces`는 같은 IP의 것만 지움
   - 위험: 중간

### 2-5. 계획 · 올리기 · 닫기 API와 `UploadGate`

1. **`LookupPlanController`** (새 파일 [안]: `availability/internal/web/LookupPlanController.java`)
   - 주소 [확정] (전반 점검 #11). 끝 이름(`searches`·`holdings`·`more`)은 [안: dev가 맞춤]
     - `POST /api/v1/lookup-plans/searches`
     - `POST /api/v1/lookup-plans/holdings`
     - `POST /api/v1/lookup-plans/more`
     - `POST /api/v1/lookup-plans/{planId}/items/{itemId}`
     - `POST /api/v1/lookup-plans/{planId}/close`
   - 요청 · 응답 · 에러 모양은 design-delta API 표 그대로입니다
     - 201 `{planId, batchNo, deadlineMs:8000, rowLimit:10, targets?, items[]}`
     - 올리기 200 `{events[], detailItems[], stop}`
     - 해석 실패 · status≠200 · `outcome` TIMEOUT/ERROR도 200 `library-failed`(캐시 안 넣음)
     - 이벤트 이름 · 데이터는 지금 SSE와 같습니다
   - 계획은 서버 자리를 잡지 않습니다(AC-12). 캐시는 보지 않고 모든 도서관 주소를 줍니다
   - IP는 `UsageLog.capture(request).clientIp()`로 읽고 IPv6는 앞 /64로 비교합니다. `getRemoteAddr()`는 쓰지 않습니다 ◆
2. **`UploadGate`** (새 파일 [안]: `availability/internal/plan/UploadGate.java`)
   - 검사 순서(2단계판, 본문을 읽기 전에 거절) ◆
     - ① `Origin`(없으면 `Referer`)을 설정의 허용 origin과 대조합니다. 둘 다 없으면 거절
       - 허용 origin: 운영 `https://chaekcheck.com`(도메인 [확정] 사이클 17 R2), 개발 `http://localhost:5173`
       - 속성 이름 [안]
     - ② 계획을 만든 IP(/64) = 지금 IP. 다르면 400 `client_ip_changed`(이름 [안])
     - ③ 계획 있음 · 쪽 번호 · 처음 받음. 아니면 400 `invalid_plan`
     - ④ `Content-Length` ≤ 1MB, `Content-Encoding` 없음. 넘으면 413 `payload_too_large`, 인코딩이 있으면 415
     - ⑤ 해석 자리(1-4, 서버 모드와 함께) 최대 2초. 못 얻으면 503 `server_busy`
     - ⑥ 상한까지만 읽는 스트림으로 본문을 읽습니다(`@RequestBody byte[]` 아님, nginx 없이도 지킴)
     - ⑦ `status` 200
     - ⑧ adapter 해석(계획 URL 호스트로만)
     - ⑨ `detailUrl` 같은 호스트
     - ⑩ 캐시 넣기 규칙
   - 닫기: `{notSent}` → 사용 기록 `SKIPPED`, `recordSearch`도 여기서 합니다. 화면을 떠날 때의 `keepalive` 요청도 받습니다
   - 거절 기록: `invalid_plan`만, IP · 이유마다 1분 1줄 [안]. 2단계에 잠금 없음
   - CSRF: 로그인 기능이 켜지면 세 POST에 `X-XSRF-TOKEN`이 필요합니다(dev `SecurityConfiguration.java` 75행 `csrf.spa()`). 서버 쪽은 바꿀 것 없음
   - 시험(MockMvc · 통합)
     - 계획 번호 없음 · 틀림 → 400 `invalid_plan`, 캐시 그대로(AC-13 2단계)
     - 해석 안 되는 페이지 → 200 `library-failed`(AC-17)
     - 다른 호스트 `detailUrl` 업로드(AC-18)
     - 로그인 켠 설정에서 CSRF 머리가 있으면 403 없음(AC-19)
     - 해석 자리 8을 채운 상태 → 2초 뒤 503(AC-22 · AC-33 확장 부분)
     - 보관함 가득 → 503(AC-23)
     - 다른 IP → 400 `client_ip_changed`(AC-30 2단계)
     - `outcome=TIMEOUT`이나 4xx · 5xx → 그 도서관만 실패, 서버 요청 0건, `source=extension` 실패(AC-43 서버 부분)
     - Origin 다름 · 없음 → 400
   - 의존: 2-1~2-4 / 위험: 높음(보안 입구)

### 2-6. nginx

1. **`/api/v1/lookup-plans/` 블록 하나** (파일: dev `deploy/nginx/` 새 템플릿 `lookup-plans.conf.template`(이름 [안]), `rate-limits.conf`에 구역 둘, `chaekcheck-locations.conf`·`local-test.conf` include. 운영 쪽은 사이클 17 `deploy/prod/nginx/prod.conf`에 맞춤 [확인 필요: 17이 템플릿을 쓰는지])
   - 할 일
     - `location ^~ /api/v1/lookup-plans/` 하나 [확정]
     - 그 안에서 계획 만들기 세 주소는 계획 구역 `chaekcheck_lookup_plans`: `${LOOKUP_PLAN_PER_MIN}`=300 r/m, burst `${LOOKUP_PLAN_BURST}`=100 [확정]
     - 올리기 · 닫기
       - `client_max_body_size ${LOOKUP_MAX_BODY_MB}m`(=1)
       - `limit_req zone=chaekcheck_lookup_uploads` `${LOOKUP_UPLOAD_RATE}`=20 r/s, burst `${LOOKUP_UPLOAD_BURST}`=60 [확정]
       - `limit_conn` IP당 `${LOOKUP_UPLOAD_CONN}`=4 [확정]
       - `limit_req_status 429`·`limit_conn_status 429`(기본값 503, https://nginx.org/en/docs/http/ngx_http_limit_conn_module.html 2026-10-17 확인 [확정])
     - `proxy_request_buffering on`, `client_body_buffer_size 512k` [안], `client_body_timeout 10s` [안]
     - 413 · 429는 Problem Details JSON(지금 `@library_calls_limited` 방식)
     - 안쪽 location을 나누는 모양은 dev가 정합니다 [안]
   - 시험: 확장 모드 「더 보기」를 1분에 31번 넘게 눌러도 429가 나지 않음(AC-38). 올리기 5개를 동시에 열면 다섯째가 429 JSON(AC-44)
   - 의존: 2-5 / 위험: 중간

### 2-7. 확장 꾸러미 `extension/` (ADR-0120)

1. **새 폴더** (dev 저장소 맨 위 `extension/`: `manifest.json`, 개발용 manifest(만드는 방식 [안]), `background.js`, `config.js`, `throttle.js`, `url-filter.js`, 시험 `*.test.js`, `README.md`)
   - 할 일
     - manifest
       - MV3, `key`로 ID 고정
       - `host_permissions: ["http://*/*","https://*/*"]`
       - `externally_connectable.matches`: 운영은 `https://chaekcheck.com/*`만, 개발 manifest만 `http://localhost:5173/*`를 더함 ◆
       - `background.service_worker` module
     - `background.js`
       - `onMessageExternal` 인사 → `{version, protocol}`(`protocol` 정수, 이름 [안], 처음 1 [안]). `sender.origin`을 다시 대조합니다 ◆
       - `onConnectExternal` port: items 검증(한 메시지 100개 · URL 2KB [안], 주소 거르기)
       - **service worker 전역 호스트 큐**(모든 탭 · port가 공유): 호스트마다 동시 1건 · 앞 요청 끝 + 1초 [확정], 전체 동시 5 [확정]
       - `fetch`는 `credentials:'omit'`, `redirect:'manual'`(`opaqueredirect` · status 0 = `ERROR`)
       - 응답 머리 10초 [확정] (묶음 안에서는 마감 8초가 먼저 끝내므로 실제로 10초가 쓰이는 것은 포털 상세 단계)
       - 본문은 `body.getReader()`로 세며 읽다가 1MB를 넘으면 abort ◆. 묶음 마감에도 abort
       - 보내는 모양: base64 → `{itemId,status,contentType,base64,ms}`
     - 주소 거르기 ◆
       - http(s) · GET만
       - IP 리터럴 · `localhost` · `.local` · 사설 · 루프백 · 링크 로컬은 거절
       - 기본 포트만. 예외 목록은 `config.js`(예: 전주 `:8095`) [안]
     - `config.js`: 확장 상수 한 파일. 값마다 dev 설정값 목록에 한 줄 [확정] (검토 #17)
     - `README.md`: 개발자 모드 설치, `key` 얻는 방법(https://developer.chrome.com/docs/extensions/reference/manifest/key)
     - dev `CLAUDE.md` Directory Layout에 한 줄을 더합니다: "`extension/` — Chrome extension (MV3), not a Spring app, no Gradle; load it unpacked in developer mode"
   - 시험(`node --test`): 호스트 큐(같은 호스트 둘째 요청이 첫 요청 끝 + 1초 뒤, 동시 2개 없음, 두 port가 같은 큐), 주소 거르기 표, 상한 abort
   - 의존: 2-0 / 위험: 중간

### 2-8. 웹: 확장 모드 `features/extension/`

1. **`ExtensionBridge`** (새 폴더 [안]: `web/src/features/extension/`. 고칠 곳: `useSearch.ts`·`useHoldings.ts` reducer 입구, `HeaderSignal.tsx`, `DirectResults.tsx`의 「더 보기」, `features/picks/` S14 `holdingLimit`, `api/` 계획 호출)
   - 할 일
     - 인사: `sendMessage(VITE_EXTENSION_ID, {type:'hello'})`
       - 첫 검색은 답을 최대 500ms [안] 기다리고, 결과는 앱 전체에 보관합니다
       - 답이 없으면 지금 흐름 그대로, 오류 표시 없음(AC-14)
     - 판 번호 확인: `protocol < VITE_EXTENSION_MIN_PROTOCOL`(이름 [안], 처음 1 [안])이면 확장 모드로 가지 않습니다 [확정] (전반 점검 #8, 마무리 확인 #8)
       - 서버 모드 상태 묻기를 시작하고, 점은 서버 모드 색입니다
       - 「확장을 새로 깔아 주세요」는 머리말 점 말풍선 둘째 줄에 보입니다
     - 확장 모드: 파란 점 + 「내 브라우저에서 조회 중」, 말풍선 「확장 프로그램이 도서관을 직접 조회해요」. 상태 묻기 없음 [확정]
     - 계획 → port로 items → 받은 base64를 바로 `Uint8Array`로 바꿔 올립니다(reducer 상태에 두지 않음) → 이벤트를 기존 reducer에 넣습니다 → `detailItems` → close
     - 지금 계획 번호가 아닌 응답은 버립니다
     - 400 처리
       - `invalid_plan` → 남은 줄을 「확인하지 못한 도서관」으로 두고 close
       - `client_ip_changed` → 남은 도서관만 새 계획으로 다시 1번 [안]. 또 400이면 「확인하지 못한 도서관」
     - 계획 요청 503 → 그 검색 한 번만 서버 모드(SSE)
     - 업로드 429 → 남은 것 `notSent`로 닫고 지금 429 안내 줄
     - 같은 검색어 엔터를 1초 안에 다시 받으면 무시 [확정]
     - `pagehide` → 마지막 계획을 `fetch(…, {keepalive:true})`로 close
     - port 끊김 → 인사 최대 3번(바로 · 1초 · 2초)
       - 답이 오면 확장이 남은 items를 같은 계획으로 다시 요청합니다
       - 셋 다 없으면 남은 것을 `notSent`로 닫아 「확인하지 못한 도서관」, 파란 불을 지우고 다음 검색부터 서버 모드(상태 묻기 바로 1회) [확정] (검토 #4)
     - S14 사서추천 창은 `holdingLimit=3`(이름 [안])을 계획 요청에 넘기고, 넓히기 6 · 10 · 20도 같은 단계로 다시 계획 [안]
     - CSRF: `usageEvents.ts`와 같은 방식(쿠키가 없으면 `/api/v1/auth/csrf-token`, `csrf_invalid`면 한 번 다시)
     - 확장 모드에서는 「밀려요」를 쓰지 않습니다
   - 설정: `VITE_EXTENSION_ID` [확정] (설계 결정 #6), `VITE_EXTENSION_MIN_PROTOCOL` [안]
   - 시험(vitest, 가짜 `chrome.runtime`)
     - 답 없음 → 서버 모드(AC-14)
     - 판 번호 낮음(AC-35)
     - 늦은 응답 버림
     - 400 · 429 · 503 처리(AC-23 · AC-30 · AC-44 화면 부분)
     - 인사 3번(AC-41)
   - 의존: 2-5, 2-7 / 위험: 높음

### 2-9. 요약 로그 더하기

- 1-11 로그에 확장 도서관 요청 수와 계획 무게 합을 더합니다

### 2단계 완료 기준

- [ ] AC-9~15, 10a, 17, 18(올리기), 19, 21(확장 모드), 22, 23, 30(만든 IP 기준), 33(확장 부분), 35, 38, 41, 43, 44, 45
- [ ] 빌드 · 시험: `backend/` `./gradlew build`(모듈 검증 포함), `web/` `npm run build` + vitest, `extension/` `node --test`
- [ ] 개발자 모드로 설치한 크롬에서 직접 확인(아래 "시험 방법")
- [ ] 폰 화면은 바뀌지 않습니다. 그래도 사용자가 자기 폰(Samsung Internet)에서 `web-lan-5174`로 확장 없는 흐름이 1단계와 같은지 확인합니다(AC-14)
- [ ] 설정 색인 · `CLAUDE.md` 한 줄 · `# 사이클 20` 2단계 기록(프로토타입 결과 포함)

---

## 3단계 (조건: 웹스토어에 올릴 때, 또는 `rejected_event`에 남용이 보일 때)

조건이 오면 사용자에게 알리고 시작합니다. 2단계의 "만든 IP" 검사를 "장부의 받은 IP = 지금 IP"로 바꿉니다.

### 3-1. 브라우저 번호 장부 `LookupClientLedger` (ADR-0133, 설계 검토 #1)

1. **장부** (새 파일 [안]: `availability/internal/plan/LookupClientLedger.java` 인터페이스 + `InMemoryLookupClientLedger.java`)
   - 할 일
     - 번호(`SecureRandom` 16바이트) → 받은 IP(/64) · 받은 시각 · 마지막 쓴 시각 · 열린 계획 수 · 계획 무게 합 · 최근 실패 수(1분) · 잠긴 때까지
     - 5만 줄 · 받은 지 1일 [확정]
     - **차면 가장 오래 안 쓴 줄(LRU)을 밀어냅니다(503 아님)** [확정]
     - 구현은 `LinkedHashMap(…, accessOrder=true)` + `removeEldestEntry` + 잠금 하나 [확정]
       - Caffeine 크기 상한은 쓰지 않습니다
       - 접근 순서에서는 `get`도 구조 변경이라 모든 접근을 잠금 안에서 합니다
     - **방금 받은 번호는 밀려나지 않습니다** [확정]
     - 서명 없음. 장부에 없는 번호는 거절합니다
   - 설정: 상한 50,000 · 유지 1일 (이름 [안: dev])
   - 시험(단위)
     - 상한 2에서 번호 셋 → 가장 오래 안 쓴 것이 빠지고 방금 받은 것은 남음
     - `get`이 순서를 갱신함
     - 1일 만료
     - 동시 접근
   - 위험: 중간

### 3-2. 번호 쿠키 · 번호마다 세기 · 잠금

1. **쿠키와 검사 바꾸기** (파일: 2-5의 `LookupPlanController`·`UploadGate`, 2-4 `SearchPlan`)
   - 할 일
     - 계획 요청에서 번호 쿠키가 없거나 · 장부에 없거나 · IP가 다르면 새 번호를 적고 `Set-Cookie`를 줍니다 [확정] (검토 #33)
       - 이름 `lookup_client` [안]
       - `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/lookup-plans; Max-Age=86400`
       - 응답 본문에는 번호를 싣지 않습니다
     - 계획에는 `clientId`를 적고 `creatorIp`는 뺍니다
     - 올리기 · 닫기 검사
       - 번호가 없거나 장부에 없으면 400 `invalid_client_key`(이름 [안])
       - 받은 IP ≠ 지금 IP이면 400 `client_ip_changed`
       - 그다음 번호 잠금 → 계획을 만든 번호와 같은지
     - 번호마다 열린 계획 20입니다. 넘으면 그 번호의 가장 오래된 것만 지웁니다 [확정]
     - 잠금: 1분에 실패 30번(모르는 계획 번호 · 같은 쪽 두 번 · Origin 다름만) → 그 번호 10분 잠금 [확정]
     - 머리글 `X-Lookup-Client`는 없습니다. CORS는 열지 않습니다
   - 시험
     - 쿠키 속성 · 경로, 서버 모드 「더 보기」 GET에는 쿠키가 붙지 않음(AC-31)
     - 다른 번호로 올리면 `invalid_plan`, 번호 없음 · 모르는 번호면 `invalid_client_key`(AC-13 3단계)
     - 같은 IP의 두 번호가 각자 계획 20 · 잠금(AC-26)
     - 장부 상한 2에서 브라우저 셋(AC-39)
     - 서버 재시작 뒤 새 번호(AC-30 3단계)
     - 해석 실패 · 받아오기 실패는 잠금에 안 셈(AC-17 · AC-43 3단계 부분)
   - 위험: 높음

### 3-3. 공인 IP 울타리 둘

1. **울타리** (새 파일 [안]: IP별 합계 저장소, 인터페이스 뒤)
   - 할 일
     - (1) 그 IP 번호들의 열린 계획 무게 합 > 보관함의 20%(= 5,000)
     - (2) 한 IP에 새 번호가 1분 30개를 넘음 [확정]
     - 둘 다 그 IP의 새 계획 요청만 429 `lookup_ip_limited`(이름 [안])로 거절합니다. 서버 모드로 넘기지 않습니다
     - (3) "잠긴 번호 5개 → IP 10분"은 **넣지 않습니다** [확정] (전반 점검 #12)
     - 비율로 둘지 주소 수로 둘지는 dev가 정합니다(비율 권장 [안])
   - 시험: AC-29

### 3-4. 서버 대행 목록과 기록

1. **`server-fetched-libraries`** (설정 `chaekcheck.availability.extension.server-fetched-libraries`, 이름 [안], 처음은 빈 목록)
   - 할 일
     - 목록의 도서관은 확장 주소에서 빼고 서버가 부릅니다. 목록이 비어 있지 않고 이 묶음에 있을 때만 서버 자리 1개를 잡습니다
     - 자리가 없으면 그 도서관만 「확인하지 못한 도서관」입니다 [확정] (검토 #29)
     - 사용 기록 출처는 `ResponseSource.SERVER_FOR_EXTENSION` → `'server_for_extension'`
     - 켤 때 목록 전체(번호 · 이름 · 이유)를 로그 한 줄로 남깁니다
     - 목록을 바꾸면 dev 설정 색인과 plan `docs/settings-index.md`에 한 줄씩 적습니다(plan 쪽은 `# 사이클 20`으로 요청)
   - 시험: AC-25

### 3-5. 나머지

- `usagelog`: 거절 이유 `invalid_client_key`를 씁니다(CHECK는 004에 이미 있음)
- 웹: `invalid_client_key` → 조용히 남은 도서관만 다시 계획 1번 [안]. 계획 요청 429 → 호박색 줄(`features/search/blocked.ts` 자리)에 「잠시 후 다시」(문구 [안], 예 「지금은 확장 조회가 많아요. 잠시 후 다시 해 주세요」), 다음 검색은 다시 확장 모드로 시도
- 요약 로그에 장부 크기를 더합니다
- 처리방침의 쿠키 한 줄 · 확장 모드 기록 한 줄 [확인 필요: 사용자에게 문구 확인, 공개 전] — dev가 문구를 정하지 않습니다

### 3단계 완료 기준

- [ ] AC-13(3단계), 17 · 43(잠금 부분), 25, 26, 29, 30(3단계), 31, 39
- [ ] 빌드 · 모듈 검증 통과, 설정 색인 · `# 사이클 20` 3단계 기록. 폰 화면 변경 없음

---

## Liquibase (1단계에서 한 번에)

- 새 파일: `backend/src/main/resources/db/changelog/usagelog/004-library-response-source-extension.yaml` (파일 이름 [확정] 설계 결정 #6)
- master `db.changelog-master.yaml` 맨 끝(지금 `usagelog/003-screen-event-picks-list.yaml` 다음)에 include와 주석 `# cycle 20: lookup status and extension (ADR-0119, ADR-0132)`
- 기존 changeset은 고치지 않습니다(`PRE_DEPLOYMENT` 표지가 있어도 001 · 002 · 003은 운영 역할 DB에 이미 적용됨)
- changeset(id [안], 예 `usagelog-004-…`, author `chaekcheck`, `002`처럼 `sql` 변경)
  1. `library_response_daily_source_check`를 지우고 같은 이름으로 다시 겁니다: `source IN ('direct_search','holding_fill','extension','server_for_extension')`
  2. `rejected_event_reason_check`를 지우고 같은 이름으로 다시 겁니다: 지금 7개(`unknown_library`, `invalid_place`, `invalid_screen`, `invalid_book_id`, `malformed`, `unknown_type`, `invalid_value`, dev `001` 247~248행 2026-10-17 읽음) + `invalid_plan`, `invalid_client_key`
  3. `ALTER TABLE usagelog.library_response_daily ADD COLUMN body_too_large_count integer NOT NULL DEFAULT 0 CONSTRAINT library_response_daily_body_too_large_count_check CHECK (body_too_large_count >= 0)` [확정] (마무리 확인 #6)
- 2 · 3단계 값을 미리 허용합니다 [확정] (마무리 확인 #10). 1단계 코드가 그 값을 쓰지 않아도 오류로 보지 않습니다
- 확인: `db-test`에서 `./gradlew test`로 적용, 로컬 `db`에서 `bootRun`으로 적용. 운영 역할 DB에는 사이클 17 배포 때 적용됩니다(기존 줄은 새 CHECK를 모두 만족)

## 설정값 한눈에 (환경 변수 이름은 plan `docs/settings-index.md` 8절 규칙: 속성 이름의 점 → `_`, `-` 뺌, 대문자)

| 단계 | 값 | 속성 / 변수 | 값 | 태그 |
|---|---|---|---|---|
| 1 | 동시 검색 자리 | `max-concurrent-searches` / `CHAEKCHECK_AVAILABILITY_MAXCONCURRENTSEARCHES` | 40 | [확정] |
| 1 | 바로 검색 줄 상한 | `batch.row-limit` / `CHAEKCHECK_AVAILABILITY_BATCH_ROWLIMIT` | 10 | [확정] |
| 1 | 본문 상한 (서비스 · 조회 서버 · nginx · 확장) | `LOOKUP_MAX_BODY_MB` → `CHAEKCHECK_AVAILABILITY_MAXBODYSIZE`, `FETCH_MAXBODYSIZE` | 1 | [확정] |
| 1 | 책 기준 검색 기본 쪽 | 새 속성 (이름 [안]) | 10 (최대 20) | 10 [확정] |
| 1 | 상태 저장소 | `chaekcheck.lookup.state-store` / `CHAEKCHECK_LOOKUP_STATESTORE` | `memory` | 방식 [확정] / 이름 [안] |
| 1 | 해석 자리 / 기다림 | 새 속성 (이름 [안]) | 8 / 2초 | [확정] |
| 1 | 상태 메모 · 503 뒤 빨강 · DB 오류 회색 | 새 속성 (이름 [안]) | 1초 · 10초 · 30초 | [확정] |
| 1 | 기다림 창 / 시간 초과 창 | 새 속성 (이름 [안]) | 10초 / 60초 | 값 [확정] / 설정으로 둠 [안] |
| 1 | 줄 선 목록 최대 | 새 속성 (이름 [안]) | 200 | [안] |
| 1 | 요약 로그 간격 | 새 속성 (이름 [안]) | 1분 | [확정] |
| 1 | 상태 묻는 간격 | `VITE_LOOKUP_STATUS_POLL_SECONDS` [안] | 10 | 값 [확정] |
| 1 | 책 화면 자동 이어 부르기 | `VITE_*` (이름 [안]) | 3 | [확정] |
| 1 (1-15) | 길 설정 | `chaekcheck.availability.egress.mode` / `CHAEKCHECK_AVAILABILITY_EGRESS_MODE`, 조회 서버 `FETCH_EGRESS_MODE` (이름 [안]) | `all`(모두) · `proxy-only`(프록시만) · `direct-only`(직접만), 기본 `all` | 값 셋 [확정] / 철자 [안] |
| 1 (1-15) | 프록시 길 목록 | `chaekcheck.availability.egress.proxies` / `CHAEKCHECK_AVAILABILITY_EGRESS_PROXIES`, 조회 서버 `FETCH_EGRESS_PROXIES` (이름 [안], 운영 값은 비밀 값 · 사이클 17) | 운영 Webshare 한국 정적 20(+ 직접 길 EC2 1 = 21), 로컬 빈 값 | 21 [확정] / 이름 [안] |
| 1 (1-15) | 업체 이름(기록용) | `…egress.proxy-vendor` (이름 [안]) | `webshare` | [안] |
| 1 (1-15) | 한 길 · 한 사이트 동시 / 간격 | `host-max-concurrency` / `host-min-interval` (그대로, 뜻이 "길마다"로 바뀜) | 1 / 1초 | [확정] |
| 1 (1-15) | 교보 구독형 길마다 동시 | `chaekcheck.availability.kyobo.subscription-max-concurrency` / `CHAEKCHECK_AVAILABILITY_KYOBO_SUBSCRIPTIONMAXCONCURRENCY` (이름 [안]) | 3, 1초 간격 없음 | [확정] |
| 1 (1-15) | 막힌 길 다시 시험 | 새 속성 (이름 [안: dev], 예 `…egress.blocked.first-retest` · `max-retest`) | 10분부터 두 배, 상한 7일 | [확정] |
| 1 (1-15) | 막힘으로 보는 기준 · 교보 동시 1건으로 내리는 기준 | 새 속성 (이름 [안: dev]) | dev가 정함(ADR-0094: 수집기 값 평균 응답 12초 · 5번 연달아 실패 참고) | [안] |
| 2 | 확장 캐시 칸 / 만료 | 새 속성 (이름 [안]) | 500 / 처음 넣은 시각 + 3분 | [확정] |
| 2 | 계획 보관함 무게 / 유지 | 새 속성 (이름 [안]) | 25,000 / 10분 | [확정] |
| 2 | 허용 origin | 새 속성 (이름 [안]) | `https://chaekcheck.com`, 개발 `http://localhost:5173` | 도메인 [확정] |
| 2 | nginx 계획 · 올리기 | `LOOKUP_PLAN_PER_MIN`·`LOOKUP_PLAN_BURST`, `LOOKUP_UPLOAD_RATE`·`LOOKUP_UPLOAD_BURST`, `LOOKUP_UPLOAD_CONN` | 300 · 100, 20 · 60, 4 | [확정] |
| 2 | 확장 ID / 최소 판 | `VITE_EXTENSION_ID` / `VITE_EXTENSION_MIN_PROTOCOL` | — / 1 | ID [확정] / 최소 판 이름 · 값 [안] |
| 2 | 확장 상수 | `extension/config.js` | 동시 5, 호스트 1건 · 1초, 머리 10초, 1MB, items 100 · URL 2KB, 포트 예외 | 앞 넷 [확정] / 뒤 둘 [안] |
| 3 | 장부 상한 / 유지 / 쿠키 수명 | 새 속성 (이름 [안]) | 50,000 / 1일 / 1일 | [확정] |
| 3 | 번호당 열린 계획 / 잠금 | 새 속성 (이름 [안]) | 20 / 30번 · 1분 → 10분 | [확정] |
| 3 | IP 울타리 | 새 속성 (이름 [안]) | 20%(5,000) / 1분 30 | [확정] |
| 3 | 서버 대행 목록 | `…extension.server-fetched-libraries` [안] | 빈 목록 | [확정] |

- 새 속성은 모두 dev `docs/maintenance/settings-index.md`에 한 줄씩 적습니다. 운영 `prod.env` 견본은 사이클 17 몫(`from-cycle-20-prod-env-numbers.md`)
- 확인 필요: 환경 변수로 값이 실제로 바뀌는지 dev가 켜서 확인합니다(예: `CHAEKCHECK_AVAILABILITY_MAXCONCURRENTSEARCHES=2`로 켜고 상태 응답 `slots`=2)

## 시험 방법

- **노랑 · 빨강 빨리 보기 (AC-2 · AC-3 · AC-12)**: `CHAEKCHECK_AVAILABILITY_MAXCONCURRENTSEARCHES=2`로 `bootRun`
  - 검색 탭 1개 → 노랑(절반), 2개 → 빨강
  - 셋째 검색은 503 안내 + 즉시 빨강
  - 모두 끝나면 11초 안에 초록
  - 숫자 40 그대로의 판정은 단위 시험(1-8)으로 봅니다
- **DB를 멈춰 회색 보기 (AC-37)**
  1. `wsl -d Ubuntu -- docker compose stop db`
  2. 검색 또는 책 찾기 → 500
  3. 다음 상태 응답에서 회색 · 「상태 모름」 · 말풍선 「상태를 확인할 수 없어요」
  4. `wsl -d Ubuntu -- docker compose start db` 뒤 DB 오류 없이 30초가 지나면 원래 단계
  - 상태 API는 DB를 보지 않으므로 DB가 꺼져도 200을 줘야 합니다
  - 30초 경계는 가짜 시계 단위 시험으로 함께 봅니다
- **상태 요청 실패 (AC-42)**: 개발자 도구 네트워크 차단(`/api/v1/lookup-status` 막기) 또는 백엔드 정지 → 30초까지 마지막 값, 그 뒤 회색 「조회 상태를 받아오지 못했어요」
- **「밀려요」 (AC-5 · AC-32)**: 같은 호스트 도서관 여럿으로 바로 검색(통합 포털). 실제 사이트에 무리를 주지 않게 시험용 느린 HTTP 서버를 도서관 주소로 둔 시험 프로필 [안]
- **gzip · 1MB (AC-34)**: 1-3의 시험용 서버(평문 1MB+1, gzip 폭탄, 보통 gzip). 끝나면 서버 로그 한 줄, `library_response_daily` 두 칸 +1, 요약 로그 "1MB 넘음" +1
- **떠나면 멈춤 (AC-24)**: `deploy/nginx/local-test.conf`로 nginx를 앞에 두고, 도서관이 많은 검색 도중 탭을 닫습니다 → 서버 로그 `stopReason=CLIENT_GONE`, 그 뒤 새 `library=` 줄 없음. 이 시험으로 확인 필요 "SSE 끊김을 알아채는 시점"을 기록합니다
- **확장 개발자 모드로 넣기 (2단계)**
  1. 크롬 `chrome://extensions` → 개발자 모드 켜기
  2. "압축해제된 확장 프로그램을 로드합니다" → dev `extension/`(개발용 manifest: `http://localhost:5173/*` 포함)
  3. 확장 ID는 manifest `key`로 고정되므로 `web/.env.local`에 `VITE_EXTENSION_ID`를 넣고 `web`(5173)을 다시 켭니다
  4. 도서관 요청은 확장 카드의 "서비스 워커" 검사 창 네트워크 탭에서, 서버 쪽은 `bootRun` 로그에서 봅니다(AC-9: 그 검색의 `library=` 줄 없음)
  5. 판 번호 시험(AC-35): `config.js`의 `protocol`을 0으로 바꿔 다시 로드합니다
  6. 확장 끄기(AC-41): 검색 도중 확장 관리에서 끄기. 둘째 인사 전에 다시 켜는 경우도 봅니다
  7. 호스트 간격(AC-11): 탭 둘에서 같은 도서관 동시 검색 → 서비스 워커 네트워크 탭 시각 간격 ≥ 1초, 동시 2개 없음
- **IP 바뀜 (AC-30)**: 검색 도중 VPN을 켭니다 → 400 `client_ip_changed` 뒤 화면이 오류 없이 남은 도서관을 채움. 로컬에서는 nginx `X-Real-IP`를 바꾸는 시험 프로필로 대신할 수 있음 [안]
- **올리기 동시 연결 (AC-44)**: `local-test.conf` nginx 뒤에서 올리기 5개를 동시에(스크립트) → 다섯째 429 JSON. 화면 시험은 vitest
- **확장 캐시 공유 (AC-10 · AC-45)**: 확장 모드로 검색한 직후 확장 없는 브라우저(다른 프로필)에서 같은 검색 → `cached_count` 증가. 3분 고정은 단위 시험
- **화면 확인**: Playwright로 데스크톱 먼저, 그다음 태블릿 · 폰(375 · 320). 폰 화면이 바뀐 1단계는 사용자가 실제 폰(Samsung Internet, `web-lan-5174`)으로 확인합니다

## 수용 기준과 시험 대응표

| AC | 단계 | 시험 |
|---|---|---|
| 1 · 8 · 20 | 1 | vitest `HeaderSignal`, `AppLayout.test.tsx`(약관 · 처리방침), Playwright 375, 실제 폰 |
| 2 · 3 · 27 | 1 | 단위(판정 표) + vitest(문구 · 503 즉시 빨강) + 자리 2 수동 |
| 4 · 16 | 1 | vitest `sortBatch` · `holdingPlan` · `resultFilter` |
| 5 · 32 | 1 | 단위 둘(`HostQueueBoard`) + vitest `ResultRow` |
| 6 · 42 | 1 | vitest(가짜 visibility · 시계) |
| 7 | 1 | MockMvc 60번 + SiteFetcher 목 0건 |
| 18 | 1 / 2 | 단위(`toPage` · `DetailLookupResolver`) / 올리기 MockMvc |
| 21 | 1 / 2 | 통합(줄 10 뒤 새 fetch 0건) · `BookParams` / 확장 네트워크 탭 |
| 24 | 1 | 단위(sink 실패) + nginx 수동 |
| 28 · 36 | 1 | 단위(holding 줄 상한 없음) + vitest(3묶음 · 「더 보기」) |
| 33 | 1 / 2 | 단위 `ParseSlots` / 올리기 503 |
| 34 | 1 | 시험용 HTTP 서버 + `db-test` 통합(두 칸) |
| 37 | 1 | MVC(`recordDbError`) + 단위(30초) + DB 멈춤 수동 |
| 40 | 1 | 단위(로그 한 줄 필드) + `bootRun` 로그 |
| 사이클 17 AC-8 · AC-9 (R13) | 1 (1-15) | 시험용 프록시 둘 + 단위(가짜 시계) — 1-15 "시험" 표, 실제 21길은 17 배포 때 EC2 |
| 9 · 11 · 41 | 2 | `node --test` + 개발자 모드 수동 |
| 10 · 10a · 45 | 2 | 단위(확장 캐시) + 두 브라우저 수동 |
| 12 · 22 · 23 | 2 | MockMvc + 자리 2 수동 |
| 13 | 2 / 3 | MockMvc `invalid_plan` / `invalid_client_key` |
| 14 · 35 | 2 | vitest(가짜 `chrome.runtime`) + 확장 없는 브라우저 · 실제 폰 |
| 15 · 43 | 2 | `db-test` 통합 + MockMvc |
| 17 | 2 / 3 | MockMvc / 잠금 단위 |
| 19 | 2 | 로그인 켠 설정 MockMvc + 수동 |
| 30 | 2 / 3 | MockMvc + VPN 수동 |
| 38 · 44 | 2 | nginx `local-test.conf` 수동 |
| 25 · 26 · 29 · 31 · 39 | 3 | 단위 · MockMvc · 개발자 도구 수동 |

## 완료 기준 (사이클 전체)

- [ ] spec.md의 AC-1~45 · AC-10a를 각 단계 완료 기준대로 모두 통과합니다(3단계 AC는 조건이 올 때)
- [ ] 단계마다 `./gradlew build` 통과, 모듈 검증 시험(`ApplicationModules.of(ChaekcheckApplication.class).verify()`, `ModularityTests`) 통과. 새 모듈 · 이벤트 없음, 의존 방향 `availability → catalog, library, usagelog` 그대로
- [ ] 1단계: 사용자가 자기 폰(Samsung Internet)에서 `web-lan-5174`(`.claude/launch.json`, 같은 Wi-Fi)로 머리말 점 · 말풍선 · 결과 묶음 · 「밀려요」 · 책 화면 「더 보기」를 확인한 뒤 닫습니다
- [ ] dev `docs/maintenance/settings-index.md`가 이 사이클 값을 모두 가리킵니다

## 이번에 하지 않는 것

- Redis 구현 · Redis 컨테이너(`state-store=redis`) — 나중에 분리할 때 (ADR-0133)
- CloudWatch 경보 · 스왑 · `-XX:+ExitOnOutOfMemoryError` · `restart: unless-stopped` · graceful 종료 · `prod.env` 견본 · 일반 `/api/` nginx 구역 — 사이클 17
- 업체 데이터 세기(80% 경고 · 90% Webshare 길 멈춤, Webshare 사용량 API 키) · 업체 오류(407 · 429 · 계정)면 Webshare 길 전체 멈춤 · CloudWatch → SNS 메일 알림 · 운영 `prod.env`의 길 설정 값과 Webshare 주소 비밀 값 — 사이클 17 (길 목록 · 길 설정 · 길마다 간격 · 막힌 길 처리 · 나간 길 기록은 1-15로 옮김, 사용자 결정 2026-10-17)
- 바뀌는 주거용 프록시 길 — 나중 (plan `docs/backlog.md`)
- 엣지 · 파이어폭스 · 사파리 확장, 폰 브라우저 확장, 웹 설치 안내 페이지, 웹스토어 올리기
- 조회 대기열(줄 세우기), 조회 서버 쉼 상태를 신호에 합치기
- 실패한 도서관을 서버가 대신 다시 부르기(서버 대행 목록에 처음부터 넣은 도서관만 3단계에서)
- 처리방침 문구 변경(공개 전 사용자 확인)

## dev `docs/plan-feedback.md`에 기록해 주세요 (`# 사이클 20` 새 절, 1-15는 `# 사이클 webshare (사이클 20 안에서, 2026-10-17)`)

단계마다 끝날 때 다음을 적습니다. 다음 plan 회고(retro) 입력입니다. 사이클 18 · 21 회고도 아직이므로 겹치는 것은 이 절에 적습니다. 1-15(나가는 길)의 기록은 dev 세션이 정한 절 **`# 사이클 webshare (사이클 20 안에서, 2026-10-17)`**에 따로 적습니다: 정한 이름(속성 · 환경 변수 · 길 번호 · 클래스), 막힘 기준 숫자, 교보 동시 1건으로 내리는 기준, 멈춤 · 시험 · 풀림 로그 줄 모양(사이클 17 경보가 읽음), 사이클 17이 업체 데이터 세기 · 업체 길 멈춤을 붙일 자리, 사이클 17 배포 때 EC2에서 본 실제 21길 결과.

- 설계와 달라진 점과 이유(사용자 발언은 그대로)
- 정한 이름: 클래스 · 속성 · 환경 변수 · 코드(`DB_ERROR`, `BODY_TOO_LARGE`, `parse_busy`, `client_ip_changed`, `invalid_client_key`, `lookup_ip_limited`, 쿠키 이름, 계획 주소 끝 이름, `protocol`, `VITE_*`)
- 이 인계서가 설계 위에 더한 세부
  - fetch-service 새 outcome
  - 20이 먼저 정의한 나가는 길 포트
  - `HostQueueBoard`를 부르는 곳에서 감싼 방식
  - `CannotCreateTransactionException`도 셈
- 확인 필요 결과
  - SSE 끊김을 알아채는 시점
  - gzip 압축률(도서관 몇 곳)
  - 환경 변수로 값이 바뀌는지
  - 2-0 프로토타입(열리지 않는 도서관 목록과 이유)
  - `HostQueueBoard`가 재시작 뒤 포털 소속 도서관을 배우는 한계
  - 503 급증 경보 기준값 · 요약 로그 필드 모양(사이클 17과 맞춤)
- 사이클 17과 맞춘 것: `prod.conf` 템플릿 방식, `prod.env` 값
- 화면 세부: 320px 머리말, 점과 ▾ 순서
- 실제 폰에서 사용자가 지적한 것

## 남은 [안] · 확인 필요 (dev가 정하거나 확인)

- [안] 이름 전부: `LookupHealth.recordDbError()`, `ParseSlots`, `HostQueueBoard`, `LookupStatusService`, `EgressLaneStatus`, `LookupOpsSummaryLog`, `SearchPlanStore`, `UploadGate`, `ExtensionPageCache`, `LookupClientLedger`, `chaekcheck.lookup.state-store`, 새 설정 속성들, `reason=DB_ERROR`, `ResponseResult.BODY_TOO_LARGE`, `ResponseSource.EXTENSION`·`SERVER_FOR_EXTENSION`, `invalid_client_key`, `client_ip_changed`, `lookup_ip_limited`, 쿠키 `lookup_client`, 계획 주소 끝 이름 `searches`·`holdings`·`more`, `holdingLimit`, `protocol`, `VITE_LOOKUP_STATUS_POLL_SECONDS`, `VITE_EXTENSION_MIN_PROTOCOL`, 이어 부르기 `VITE_*`, `server-fetched-libraries`
- [안] 값 · 구조
  - `queuedLibraryIds` 최대 200
  - 확장 인사 첫 기다림 500ms
  - items 100개 · URL 2KB
  - 포트 예외 목록
  - 최소 판 처음 값 1
  - nginx `client_body_buffer_size 512k` · `client_body_timeout 10s`, 안쪽 location 나누는 모양
  - 거절 기록 IP · 이유마다 1분 1줄
  - `client_ip_changed`를 거절 기록에 안 남김
  - 400 뒤 다시 계획 1번
  - 상세 해석도 같은 해석 자리
  - 해석 자리 실패 시 서버 모드 `library-failed` · 캐시 안 넣음
  - 상세 기다림 10초 뒤 안 셈 감수
  - SSE · 예약 작업 DB 오류 안 셈 감수
  - 계획 번호 base64url
  - IP 울타리 비율로 둠
  - IP별 합계 구조
  - 한 넓히기 단계 안의 이어 부르기 3묶음
  - 확장 모드 넓히기도 같은 단계
  - 점과 ▾ 순서
  - 「잠시 후 다시」 문구
  - `HostQueueBoard` 자료 구조
  - `state-store`가 `memory` 밖이면 켤 때 멈춤
  - 확장 응답은 길 데이터 세기에 넣지 않음
  - 503 급증 경보 기준값 · 요약 로그 필드 모양
  - IPv6 nginx 한도(주소 전체) vs 서버 /64 차이 감수
  - 1-15: 길 번호 `direct`·`proxy-01`…, 속성 `egress.mode`·`egress.proxies`·`egress.proxy-vendor`·`kyobo.subscription-max-concurrency`·다시 시험 속성, 조회 서버 `FETCH_EGRESS_*`·공통 `LOOKUP_EGRESS_*`, `FetchRequest.lane`, 문제 코드 `no_lane_for_host`, 길 돌아가며 고르기, 막힘 기준 숫자, 교보 내리기 기준, 기다리는 동안 `DEFAULT_LANE`, 시험 주소(마지막 실패 주소), 막힌 길 표 재시작 때 비움 감수, 로그 줄 모양, 사용 기록에 길 칸 없음
  - DNS 리바인딩 감수
  - 로그인을 끈 2단계의 CSRF 방어가 `Origin` 한 겹 + 만든 IP
- [확인 필요]
  - nginx를 거친 SSE 끊김 감지 시점(1단계 전, dev 시험)
  - `CannotCreateTransactionException` 등 DB 꺼짐 때 실제로 나는 예외(Spring 문서 · 시험)
  - gzip 압축률(dev 측정)
  - 환경 변수로 값이 바뀌는지(dev 시험)
  - 2-0 프로토타입: http · 인증서 · 리다이렉트 도서관, EUC-KR 해석(2단계 전)
  - 사이클 17 `prod.conf` 템플릿 방식(2단계 전)
  - Tomcat이 요청 `Content-Encoding`을 푸는지(참고, 415로 막으므로 막지 않음)
  - 1-15: Apache HttpClient 5 프록시 설정(밑줄 호스트 길, dev Context7), 실제 Webshare 21길과 부산 전자도서관(사이클 17 배포 때 EC2에서)
  - 크롬 Private Network Access 적용 여부(참고)
  - 전체 호스트 CORS(참고)
  - 운영 2GB에서 JVM 전체 메모리 · 자리 60으로 올릴지(17 배포 뒤 요약 로그로)
  - 올리기 시간(배포 뒤 `ms`)
  - 처리방침 쿠키 · 확장 모드 문구(사용자 확인, 공개 전)

## 함께 할 작은 일: 사이클 21 회고 (2026-10-17)

- 수집기 판 고르기의 "저자를 보지 않고 다시 고르기"(dev `scripts/crawl/recommended_lists.py` `choose_editions`)를 없애고, 이동진·서울대 목록을 다시 돌려 바뀐 줄을 dev `docs/plan-feedback.md` "# 사이클 21"에 보고 [확정] (사용자 승인, 2026-10-17, 회고 결정 #2)
- 할 일·시험·보고 칸·다 됐다고 보는 기준: plan `docs/cycles/21-recommended-books/to-dev-retro-fixes.md`

## 함께 할 작은 일: AI 추천용 기록 변경 — 회원 번호·방문 번호 칸 (2026-10-18, ADR-0134)

사용자(2026-10-18): "배포 전이니까 20 dev에게 ai활용을 위한 로깅 정책을 바뀐다고 전해줬으면 해 저장하는 것이랑 다 바꾸고 수정하자고". 결정은 plan `docs/research/ai-recommend/easy/2026-10-18-logging-change-decisions.html` #1~#7 [확정] (사용자 승인, 2026-10-18), 근거 [ADR-0134](../adr/0134-usage-log-member-id-and-visit-key.md)(ADR-0096의 "회원 번호 안 남김·기록끼리 잇는 칸 없음"을 바꿈). 추천 기능 자체는 이번에 만들지 않습니다 — 기록만 바꿉니다. 파일 이름은 2026-10-18에 dev를 읽은 것이고 새 이름은 dev가 정합니다.

**언제**: 1단계(사이클 17 배포 앞)에 같이 [확정] (#7). 공개 첫날부터 두 칸이 쌓이게.

**무엇** [확정] (#1): `usagelog.book_view`·`library_click`·`screen_event` 세 표에
- `visit_key text NULL`, CHECK 길이 16~64·영숫자(`[A-Za-z0-9]`) — 브라우저 탭이 만든 난수
- `account_id bigint NULL`, CHECK `> 0`, FK 없음 — 로그인한 회원의 번호
- `search_event`·`search_more`에는 넣지 않음. 색인 없음. 1년 보관·IP 30일·04:30 정리는 그대로

**방문 번호 흐름** [확정] (#2): 웹이 탭을 열 때 `crypto.randomUUID()`에서 하이픈을 뺀 32자를 만들어 `sessionStorage`에 둠(탭 닫으면 사라짐, 쿠키 아님, 탭마다 다름). 책 상세 GET `/api/v1/books/{id}`에는 헤더 `X-Visit-Key`, 사용 알림 `POST /api/v1/usage-events`에는 본문 칸 `visitKey`. 서버는 형식이 틀리면 NULL로 저장하고 거절하지 않음(`rejected_event` 아님).

**회원 번호 흐름** [확정] (#3): `auth`의 공개 `LoginStatusReader`가 로그인함일 때 회원 번호도 돌려줌(결과 `LoginStatus`에 `accountId` 또는 새 record, 이름 [안: dev]). 지금처럼 쿠키 서명만 확인하고 만료돼도 로그인함으로 봄(ADR-0102 그대로). 브라우저가 회원 번호를 보내지 않음. `usagelog`의 `UsageRequest`에 `accountId`·`visitKey`가 들어감.

**탈퇴·끄기** [확정] (#4): `usagelog`가 `AccountDeleted`를 받아 세 표의 그 회원 `account_id`를 NULL로(줄은 남김; `mylibrary`의 `AccountDeletedCleanup` 방식, 멱등). "맞춤 추천 끄기" 설정은 AI 추천 3단계 사이클에서 — 그 전엔 로그인 회원 모두 저장. 운영 통계 SQL은 `account_id`를 읽지 않음.

**처리방침** [확정] (#5, 사용자 "짧은 판"): 1절 자동 수집 줄을 "IP 주소, 브라우저 종류, 접속 기록, 서비스 이용 기록(로그인한 경우 회원 번호 포함), 부정 이용 기록", 목적 "이용 통계, 운영과 보안, 책 추천", 보유 기간 줄 끝에 "회원 번호는 탈퇴하면 바로 지움". plan `docs/cycles/16-notices-and-policies/drafts/privacy-policy.md` 7차에 반영했음 → dev의 처리방침 데이터(`sitecontent`)를 같은 문구로. 공개일(2026-10-18) 전이면 첫 판에, 지났으면 새 판 + 공지.

**어디를 고치나** [확정] (#6)

| 어디 | 무엇 |
|---|---|
| Liquibase `db/changelog/usagelog/005-visit-key-account-id.yaml` (새 파일, master 맨 끝 `usagelog/004` 다음, 주석 `# ADR-0134: visit key and account id`) | 세 표에 두 칸과 CHECK(`<표>_visit_key_check`, `<표>_account_id_check`). 기존 changeset은 안 고침 |
| `auth/LoginStatusReader.java`, `auth/LoginStatus`, `auth/internal/security/SignatureLoginStatusReader.java`, `auth/internal/LoginOffStatusReader.java` | 로그인함일 때 회원 번호도 |
| `usagelog/UsageRequest.java`, `usagelog/internal/DefaultUsageLog.java`(`capture`) | `accountId`·`visitKey`, 헤더 `X-Visit-Key` 읽기·형식 검사 |
| `usagelog/internal/web/UsageEventReader.java`, `UsageEventController.java` | 본문 `visitKey`(틀리면 NULL) |
| `usagelog/internal/buffer/UsageRow.java`, `internal/write/UsageLogWriter.java` | 세 표 INSERT에 두 칸 |
| `usagelog/internal/` 새 listener(예 `AccountDeletedCleanup`) | `AccountDeleted` → 세 표 `account_id` NULL |
| web `src/api/usageEvents.ts`, 책 상세를 부르는 api 파일, 새 `src/api/visitKey.ts` | 난수 만들기·보관, 헤더·본문에 넣기 |
| 처리방침 데이터 | 위 문구 |
| 시험 | `UsageEventApiTests`·`UsageLogBufferTests`에 두 칸(있음·없음·형식 틀림), `LoginStatusReaderTests`에 회원 번호(정상·만료·꺼짐), 탈퇴 비우기 테스트 하나 |

**다 됐다고 보는 기준**: 로그인한 채 책 창을 열면 `book_view`에 `account_id`와 `visit_key`가 차고, 비로그인이면 `account_id`만 NULL; 같은 탭의 책 창·도서관 클릭이 같은 `visit_key`; 탈퇴 뒤 그 회원 줄의 `account_id`가 NULL이고 줄 수는 그대로; 검색 기록 표에는 두 칸이 없음.

**보고**: dev `docs/plan-feedback.md`에 `# 기록 변경 (ADR-0134, 사이클 20 1단계와 함께)` 절 — 바꾼 파일, `LoginStatus` 새 모양, changeset id, 시험 결과, 처리방침 판 번호.

---

## 사이클 22 인계 알림 (2026-10-18)

사이클 22 첫 화면 사용성(지역 먼저 묻기 · 결과는 내 도서관부터 · 방문 가입 표시 · 범위 스위치 삭제)의 인계서는 `docs/cycles/22-first-screen-usability/handoff.md`에 있습니다(웹만 바뀜, 서버 변경 없음). **dev 순서: 사이클 22를 먼저, 사이클 20 2단계는 그 뒤** [확정] (사용자, 2026-10-18). ADR-0135~0138.

---

## 사이클 24 인계 알림 (2026-10-24)

사이클 24 AI 책 찾기(첫 화면 탭 "AI"/"직접", 대화 화면 `/ai-search`, Claude Haiku 5.5 실시간, 새 모듈 `aisearch`)의 인계서는 plan `docs/cycles/24-ai-book-search/handoff.md`에 있습니다(plan 브랜치 `claude/compassionate-lovelace-mzvp4f`, 아직 main에 없음). 사이클 23과 나란히 만들고, 이 파일의 사이클 20 내용은 그대로입니다. dev 클라우드 세션 시작 글: plan `docs/cycles/24-ai-book-search/to-dev-start.md`. ADR-0150~0153.

## 표지 받기 작업 요청 (2026-10-23, 사이클 밖)

책 표지를 책마다 한 장 받아 200px JPEG로 줄여 데이터 폴더에 모으는 수집기 명령 요청: plan `docs/research/ebook-catalog/to-dev-fetch-covers-2026-10-23.md` (`../chaekcheck-plan/docs/research/ebook-catalog/to-dev-fetch-covers-2026-10-23.md`). 서비스 화면은 바꾸지 않습니다. 이 세션(plan)이 2026-10-23 08:10에 전체 목록 수집을 시작했으니, 그 수집이 끝난 뒤 돌립니다.
