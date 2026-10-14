# 사이클 15 회고: 사용자 행동 기록 (새 모듈 `usagelog`)

## 근거

- 작성 2026-10-15 (plan 쪽 회고 초안, 사용자 확인 전. 사이클 19 세션이 사용자 요청 "사이클 15,16,18이 끝난 거 같은데 회고 먼저 해줄래?"로 씀)
- dev `docs/plan-feedback.md` "# 사이클 15"(4214~4395행): 시작 상태 4218~4225행, 15 밖 두 일 4227~4240행, 단계별 진행 4242~4305행, 설계와 달라진 점 4307~4311행, nginx·Playwright·측정 4313~4321행, AC 확인표 4323~4352행, [확인 필요] 결과 4354~4361행, main 합치기 4364~4368행, 폰 확인과 사용자 요청 둘 4370~4381행, 정리 4383~4395행
- dev 코드: 기본 브랜치 `main` = `a0e438a`. 15를 합친 커밋 `a34c6ed`(4395행), 합친 순서 18 A1·A2 → 16 → 15
  - 백엔드 `backend/src/main/java/com/chaekcheck/usagelog/**`(15개 파일), `auth/LoginStatusReader`·`LoginStatus`, `catalog/internal/web/BookSearchController.java` 53~76행, `availability/internal/web/EbookSearchStreamController.java`·`EbookBatchStreamController.java`·`LibraryEbookController.java`·`UsageConditions.java`
  - `db/changelog/usagelog/001-usagelog-schema.yaml`(1~271행), master 110~112행(`# cycle 15`가 맨 끝), `application.yml` 219~236행, `.env.example` 59행
  - nginx `deploy/nginx/rate-limits.conf` 24~31행, `chaekcheck-locations.conf` 27~31·49~52·75~91행, `README.md` 27~29행, `web/public/robots.txt`
  - 웹 `web/src/api/usageEvents.ts`, `lib/libraryClick.ts`, `features/auth/AuthContext.tsx`, `features/picks/PicksPage.tsx`, `features/region/RegionContext.tsx`, `features/mylibrary/MyLibraryContext.tsx`, `features/mylibrary/MyLibrariesPage.tsx` 35행(`PAGE = 10`), `features/search/SearchPage.tsx` 196행(`key={formKey}`)
- Spring Modulith `Documenter` 출력: dev `backend/build/spring-modulith-docs/`는 옛 빌드 그대로(`module-popular.*`은 있고 `module-usagelog`·`picks`·`sitecontent`는 없음) → 대조에 못 씀. `package-info.java`로 대신함: `usagelog` `allowedDependencies = { "library", "auth" }` (`usagelog/package-info.java` 15행)
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`. 사용자 말은 dev가 `plan-feedback.md`에 옮긴 것

## dev가 마친 범위

- 인계서 1~10단계 모두. AC-1~AC-21, AC-6b, AC-23~AC-26 통과(4323~4352행). AC-7·AC-23은 데스크톱 통과 뒤 폰 확인으로 닫힘
- 사용자 실제 폰 확인(Samsung Internet, c15 웹 5178): "화면 다 통과야" (4372행)
- 시험: 백엔드 전체 빌드 통과(rebase 뒤), 웹 `npm test` 431개, 빌드, 린트 통과(경고 12개는 main과 같음) (4315·4381행)
- 원래 DB 5432에 `usagelog-001-*` changeset 아홉 개 적용, 표 여덟 확인. 기록 설정은 꺼짐 그대로 (4367행)
- 15 밖 일: 사이클 11 측정 데이터 약 16.8GB 지움(`data/cycle13/`은 남김, 4229~4236행), nginx `/picks`는 main `b4cd153`에 이미 있었음 (4240행)
- c15 작업 폴더, 브랜치, docker 묶음, `launch.json` 항목 정리 (4383~4387행)

## 계획대로 된 것

- 모듈 `usagelog`, schema `usagelog`, `allowedDependencies = { "library", "auth" }`. `catalog → usagelog`, `availability → usagelog` 의존을 `ModularityTests`에 더함 (4280행). 이벤트 없음
- 표 여덟의 이름, CHECK 값 목록, BRIN, 파티션 없음, 다른 schema로 FK 없음 (dev `001-usagelog-schema.yaml` 9~271행). changeset id `usagelog-001-*`, 제약 이름 `<표>_<칸>_check`
- 쓰기 경로 (4257~4261행): 큐 상한 1만 줄, 5초 `fixedDelay`, 한 트랜잭션, `SET LOCAL synchronous_commit TO OFF`, 표마다 `batchUpdate`, `library_response_daily` upsert, 실패 묶음은 버리고 `dropped_batch`에 남김, 정상 종료 때 남은 기록을 씀(`SmartLifecycle` phase `DEFAULT_PHASE - 4096`, `UsageLogFlusher.java` 39행)
- 설정 (`application.yml` 219~236행): `chaekcheck.usagelog.enabled`(`CHAEKCHECK_USAGELOG_ENABLED`, 기본 false), `buffer-capacity` 10000, `flush-interval` 5s, `cleanup.cron` `0 30 4 * * *`, `cleanup.zone` Asia/Seoul, `cleanup.batch-size` 10000
- `auth` (4246~4248행): 쿠키 경로 `/api/v1`(만드는 곳·지우는 곳 같은 상수), 공개 `LoginStatusReader`·`LoginStatus`, 로그인 켬 `SignatureLoginStatusReader` / 끔 `LoginOffStatusReader`, 옛 경로 쿠키를 지우는 코드는 넣지 않음
- CSRF: 지금 설정이 이미 모든 POST를 검사, 시험으로 확인 (4289행)
- `POST /api/v1/usage-events`: 늘 204, JSON 칸 이름 design-delta와 같음, 이유 값 일곱 가지, 2KB 자르기, 도서관 번호는 켜진 도서관만 정상 (4284~4287행)
- 셈 규칙 C5 (4276·4278행): `LAUNCH_CUTOFF` 건너뜀 = 후보 하나마다 1, 조회 서버를 바꿔 다시 보내도 한 번, 구독형과 도서관 주소 밖 상세 주소는 세지 않음
- 04:30 정리 (4294행): IP 비우기 → `rejected_event` 30일 → 1년 지난 줄, 1만 줄씩, 기록 설정이 꺼져 있어도 돎
- nginx: zone `chaekcheck_usage_events` 60r/m, `burst=20 nodelay`, 넘치면 `@usage_events_limited` → 204. map `$chaekcheck_named_bot` → 직접 찾기·대출 조회 스트림과 `/api/v1/availability/`에서 403. `robots.txt` `Disallow: /api/`
- 웹 (4299~4303행): `sendUsageEvent` keepalive·실패해도 조용함, 클릭 자리 여섯 곳에 `screen` 값과 책 번호, 화면 행동 다섯 종류. `mylibrary` 서버 코드는 고치지 않음

## 완료 기준 결과

dev AC 확인표(`plan-feedback.md` 4323~4352행) 그대로, 모두 통과.

| 항목 | 기준 | dev 값 |
|---|---|---|
| AC-16 응답 시간 중앙값 | 차이 10% 안 | 꺼짐 55.3·56.0ms / 켬 55.8·55.9ms (1% 안) |
| AC-16 서비스 메모리 | 50MB 안 | 295~298MB → 325MB (약 27~30MB) |
| AC-16 DB 컨테이너 | 50MB 안 | 62MB → 71MB |
| AC-11 같은 IP 80번/약 10초 | 60+burst 이하 | 80번 모두 204, 기록 31줄 |
| 넣기 비용 1만 줄 | — | `id` PK·부분 색인 있음 27.6ms / 둘 다 없음 13.1ms |
| pgjdbc | [확인 필요] | 42.7.13 |

재지 못한 것: 모니터링 도구를 켠 상태의 메모리(dev에 도구 없음, 4319행), nginx realip·광고 차단 비율·로봇의 API 호출(배포 뒤, 4362행)

## 달라진 것과 이유

| # | 달라진 것 | 이유 (사용자 말, 없으면 [이유 미확인]) | 처리 |
|---|---|---|---|
| 1 | `exact` 칸 `boolean` → `text[]`(정확히 찾을 칸 목록, 없으면 빈 배열) (스키마 33·106행) | [이유 미확인] — dev 판단. dev가 적은 까닭: `exact`는 `title`·`author`·`publisher` 중 여럿이라 참·거짓 하나로는 spec 32행 "받은 값"을 못 남김 (4309행) | `data-model.md`. 회고 결정 |
| 2 | `search_more.scope`·`visit` NULL 허용. 다음 묶음·도서관별 더 보기가 기록용 쿼리 값 `scope`·`visit`·`residenceRegionIds`·`workRegionIds`·`libraryIds`(도서관별 더 보기는 `filter`도)를 더 받음. 틀린 값이어도 검색을 막지 않고 그 칸만 비움 (`EbookBatchStreamController.java` 40~44행, `LibraryEbookController.java` 69~73행) | 사용자: "그래 이대로 해" (4274·4310행) | `api.md`, `data-model.md` |
| 3 | CHECK를 더 둠: `scope IN ('all','joinable')`, `visit IN ('any','none')`, `filter IN ('all','available')`, `result_count >= 0`, `seq >= 1`, `book_id >= 1`, 수 칸 `>= 0`, kind에 따른 칸 CHECK, `search_more_library_id_check` (스키마 36~50·101·120~124행) | [이유 미확인] — dev 판단 (4311행) | `data-model.md`. 회고 결정 |
| 4 | 3분 캐시에서 나온 답은 도서관 응답으로 세지 않음. 같은 페이지를 다른 검색과 함께 기다리면 두 번 셀 수 있음 (4277행, `BatchRunner.java` 181행) | [이유 미확인] — dev가 적은 까닭: 도서관에 요청을 보내지 않았기 때문 | 흐름 35 셈 규칙. 회고 결정 |
| 5 | 묶음 마감 뒤에 온 성공한 답은 TIMEOUT. `ROW_LIMIT`으로 멈춘 것은 건너뜀이 아님 (4276행) | [이유 미확인] — dev 판단(설계 "묶음 마감 → 시간 초과"를 풀어 씀) | 흐름 35 |
| 6 | 직접 찾기 "한 번만" 기록: `SseEmitter` 콜백 대신 `BatchRunner.start`에 `Consumer<Integer> searched`, `BatchSession`이 `synchronized` 필드 하나로 한 번만 부름 (4273행) | [이유 미확인] — [안] 범위의 dev 판단 | 흐름 35 메모 |
| 7 | 요청마다 남기는 로그 줄 `library=… source=… result=… ms=…`, 실패면 ` error=…`. 기존 실패 줄은 그대로라 실패한 요청은 로그가 두 줄 (4279행) | [이유 미확인] — dev 판단 | `module-map.md`. 회고 결정 |
| 8 | 비우기 스레드는 자기 단일 스레드 `usagelog-flush`. 버린 묶음 기록은 메모리에 100개까지(`max-dropped-notes`, 새 설정 키) (4258~4259행, `application.yml` 229행) | [이유 미확인] — [안] 범위, dev가 정해 보고 | `module-map.md`. 회고 결정 |
| 9 | 사용 알림 본문 상한 8KB(넘으면 `malformed`), 지역 배열 각 20개, 분야 20자, `bookId` 글자 "7"은 `invalid_book_id` (4284·4286행) | [이유 미확인] — [안] 범위 | `api.md`. 회고 결정 |
| 10 | 웹: 로그인 기능 상태를 아직 모를 때는 쿠키가 있으면 붙이고 403 `csrf_invalid`면 한 번 더 보냄. 가운데 버튼 클릭은 셈, 길게 누르기·오른쪽 버튼은 세지 않음. 사서추천 목록은 가운데 분야가 바뀔 때마다 한 번. 책 창은 전자책이 있는 책만 (4300~4303행) | [이유 미확인] — [안] 범위의 dev 판단 | `module-map.md`. 회고 결정 |
| 11 | 책 페이지에서 거르기(전체/지금 빌릴 수 있는)를 바꾸면 책 정보를 다시 받아 `book_view`가 한 줄 더 생김. 개발 모드는 첫 열기도 두 줄, 운영 빌드는 한 줄 (4318·4377행) | [이유 미확인] — dev가 "[plan 판단]"으로 넘김 | 회고 결정 |
| 12 | 검색창이 지워지던 버그를 고침(15 밖): 주소 값이 바뀌면 검색창을 새로 그리던 것을 검색어가 바뀔 때만 (`SearchPage.tsx` 196행) | 사용자: "현재 검색창에 책이름을 넣고 방문필요없는도서관 이거 체크하면 사라지거든? 이런 이벤트가 잘못된거 없다 싹 다 점검해줘" (4373~4376행) | `module-map.md` 웹 줄. backlog 91행 해결 |
| 13 | S10 내 도서관의 긴 목록 세 곳을 10개씩 + "더 보기"(15 밖). 사이클 07 flow S10·ADR-0058의 "20곳씩"을 10으로. "직접 추가한 도서관"(최대 20)은 그대로 (`MyLibrariesPage.tsx` 35행) | 사용자: "지금 내 도서관에서 도서관 목록 많이 뜨는데 최대 10개까지 뜨고 그 이후에 더보기같은걸로 되게 해요 지금 너무 많이 떠서 불편해" (4378~4380행) | `module-map.md`, `flows.md`, ADR-0058 덧붙임. 회고 결정 |
| 14 | 작업 폴더·포트: `../chaekcheck-dev-c15`, `-p chaekcheck-c15`, DB 5462·5463, 서버 8084, 웹 5178. 폰 확인도 c15 웹 5178에서 | 사용자: "이대로 (추천)" (4221행). 폰은 15가 아직 main에 없어서 (4321행) | 반영 없음 |
| 15 | Liquibase 순서: master 끝이 18 → 16 → 15. 나중에 합친 15가 맨 끝 (master 96~112행, 4315행) | 인계서 규칙대로 | `data-model.md` |

## 새로 알게 된 제약

- PostgreSQL `text`·`jsonb`는 NUL 문자(`\u0000`)를 받지 않음. 값 하나에 NUL이 있으면 묶음 전체가 실패 → 쓰기 전에 NUL을 빼고, NUL이 든 `raw_values`는 글자로 바꿔 넣음 (4288행, `UsageLogWriter.java` 25·194행, `UsageEventReader.java` 198~217행) [확정] (dev 시험)
- 공용 `@Scheduled` 실행기는 Spring Boot 기본 스레드 1개(`spring.task` 설정 없음). 5초 쓰기는 자기 스레드지만, 04:30 정리는 회원 정리·사서추천 받기와 같은 스레드를 씀 (4258·4361행)
- 종료 순서: 웹 서버 정상 종료 → 남은 기록 씀 → Hikari 닫힘 (4261행) [확정] (시험 로그)
- WSL은 마지막 프로세스가 끝나고 몇 초 뒤 꺼지고 컨테이너도 멈춤 → `wsl -d Ubuntu -- sleep infinity`를 띄워 두고 시험 (4225행)
- worktree 시험에는 `TEST_PG_COMMAND`가 필요 (4224행, 사이클 14와 같음)
- Documenter 출력이 옛 빌드 그대로라 모듈 그림 대조에 쓸 수 없음
- 책 페이지 거르기를 바꾸면 화면 전체를 다시 받음(이전 사이클 설계) → 기록에서 책 열기 수가 부풀려짐 (4377행)

## 다음 사이클 후보

- 기록 보기, 통계 (spec 비목표)
- 책 페이지 거르기를 바꿀 때 책 정보를 다시 받지 않기 (회고 결정에 따라)
- Documenter 출력 다시 만들기 (다음 인계서 "dev에 알릴 것")
- 배포 뒤 확인: nginx realip와 실제 IP, 광고 차단 비율, 로봇의 API 호출 (사이클 17·운영)
- ADR-0097 [확인 필요] Firefox 133 미만 keepalive (ADR에 이미 있음)
