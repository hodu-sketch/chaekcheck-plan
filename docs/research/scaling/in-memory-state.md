# 서버를 여러 대로 늘릴 때(Redis 등) 고칠 곳 모음

- 작성: 2026-10-13, 사이클 15 세션. 사용자: "이거 나중에 redis로 갈 때 고려해야 할 것으로 어딘가에 기록해둔다던가 해줘.. 다른 것들도 redis로 갈것이라고 있어야 할 것 같은데 그것도좀 잘 되어있나 스캔해서 같은 문서에 쓰고 링크 걸어두면 좋겠어"
- 조사와 목록만 적습니다. 바꿀 방향은 모두 [안]이고, 실제로 여러 대로 늘리는 사이클에서 정합니다. 지금 운영은 본 서비스 1대 [확정] (ADR-0021)
- 코드 위치는 dev `backend/src/main/java/com/chaekcheck/` 기준, 2026-10-13 읽음. 계획(미구현) 항목은 사이클 문서 기준
- 상위 원칙: ADR-0021 "운영은 1대, 설계는 여러 대 대비" (`docs/adr/0021-single-instance-ready-for-many.md`)

## 1. 한눈에

| 등급 | 뜻 | 항목 |
|---|---|---|
| **반드시 공유** | 여러 대면 도서관 호출 예절이나 로그인이 깨짐 | 호출 간격 제어(2.1), 나가는 IP별 셈(2.2), 로그인 도중 값(2.5) |
| **공유하면 좋음** | 깨지지는 않지만 효율·정확도가 떨어짐 | 검색 페이지·상세 판정 캐시(2.3), 사서 추천 캐시 알림(2.7) |
| **잠금 필요** | 정해진 시각 작업이 서버마다 겹침 | 04:00 계정 정리, 05:00 사서 추천 받기, 04:30 사용 기록 정리(2.6) |
| **그대로 둬도 됨** | 서버마다 따로여도 맞거나 해가 작음 | 동시 검색 상한, 조회 서버 쉼 표시, SSE 상태, 사용 기록 버퍼·하루 요약, nginx 한도(nginx 1대일 때) (2.4, 2.8) |

## 2. 항목별

### 2.1 도서관 호출 간격 제어 — 반드시 공유
- 위치: `availability/internal/fetch/InMemoryHostThrottle.java:21,31,42` (인터페이스 `HostThrottle.java:14-15`) [확정: dev 확인]
- 메모리: 호스트마다 동시 건수(`Semaphore`)와 마지막 호출 시각
- 여러 대면: 서버마다 따로 세어 도서관 한 곳이 받는 양이 "동시 1건·1초"의 대수 배가 됨 — 가장 큰 문제
- 방향 [안]: Redis 분산 세마포어 + 시각. 교체 자리는 인터페이스로 이미 있음
- 이미 적힌 곳: ADR-0007:28, ADR-0010:34, ADR-0021, `docs/backlog.md` "서버를 여러 대로 늘릴 때 캐시와 호출 간격 제어를 Redis로 공유", `docs/current/module-map.md:39`, `code-overview.md:999`
- 같은 묶음 안의 "바쁜 호스트"(`BatchRunner.java:326-341`)는 요청 하나 안에서만 쓰여 그대로 둬도 됨 (ADR-0020)

### 2.2 나가는 IP마다 세는 동시 건수 (ADR-0094·0095, 제안됨) — 반드시 공유
- 교보 구독형은 나가는 IP마다 동시 3건, 그 밖은 IP마다 1건·1초
- 여러 대면: 본 서비스 N대가 같은 IP 몫을 각자 세어 N배
- 방향 [안]: Redis 키 = 나가는 IP + 호스트. 조회 서버 안에서만 세면 그대로
- 이미 적힌 곳: ADR-0095:46 (여러 대 언급 없음) — **이 문서가 처음**

### 2.3 검색 페이지 캐시·상세 판정 캐시 — 공유하면 좋음
- 위치: `availability/internal/fetch/CaffeineSearchPageCache.java:21,29` (`SearchPageCache.java:7`), `availability/internal/resolve/CaffeineDetailVerdictCache.java:16,21`, 만드는 곳 `config/AvailabilityConfiguration.java:82,96` [확정]
- 메모리: 3분짜리 페이지 결과·판정
- 여러 대면: 적중률이 떨어져 같은 페이지를 서버 수만큼 다시 받음 → 도서관 호출 증가
- 방향 [안]: Redis (키에 검색 필드 포함, ADR-0009:33)
- 이미 적힌 곳: ADR-0006, ADR-0066:44, backlog "메모리/Redis를 설정으로 고르기", module-map:39, code-overview:998

### 2.4 그 밖의 availability 상태 — 그대로 둬도 됨
| 항목 | 위치 | 여러 대일 때 | 방향 [안] |
|---|---|---|---|
| 동시 검색 상한 20 | `availability/internal/search/SearchSlots.java:15,22` | 전체로는 대수×20. 서버 자원 보호 목적이라 괜찮음 | 값만 다시 정함 — **이 문서가 처음** |
| 조회 서버 "쉼" 표시 | `availability/internal/fetch/FetchServiceSiteFetcher.java:58,87,98` | 서버마다 따로 알아내 쉬는 게 조금 늦어짐 | 그대로 (원하면 Redis) |
| 검색·소장 SSE 스트림 상태 | `BatchSession.java:36-40`, `HoldingSession.java:31` | 연결 하나가 서버 하나에 붙고 다음 후보는 브라우저가 들고 다님 | 그대로 (프록시 버퍼링만 확인) |

### 2.5 로그인 도중 값 (HttpSession, 톰캣 메모리) — 반드시 공유
- 위치: `auth/internal/login/LoginAuthorizationRequestRepository.java:12,50,66` (OAuth `state`), `LoginSuccessHandler.java:73,83,101-102`, `PendingSignup.java`, `ReauthenticationProof.java`, `web/SignupController.java:89,99,110`, `web/MeController.java:67`; 세션 10분 `application.yml:40-47`; Spring Session 없음 [확정]
- 여러 대면: 콜백·동의·탈퇴 요청이 다른 서버로 가면 `login_expired` 등으로 실패
- 방향 [안]: Spring Session Redis(값 직렬화, 네이버 토큰은 AES-GCM 암호화 유지) 또는 sticky session. 버려진 가입 정리(`AbandonedSignupListener.java:20,29`)는 Redis 세션 만료 알림 설정 필요
- 이미 적힌 곳: ADR-0040:12,22-31, backlog "메모리/Redis … 암호화", 사이클 05 `design-delta.md:16,466,470,533`, `handoff.md:138,689,699`
- 로그인 유지 자체(JWT + DB 리프레시 토큰)는 여러 대에서도 그대로 (ADR-0038:38)

### 2.6 정해진 시각 작업 — 잠금 필요
| 작업 | 위치 | 여러 대일 때 | 방향 [안] | 이미 적힌 곳 |
|---|---|---|---|---|
| 04:00 계정 정리 | `auth/internal/cleanup/DailyAccountCleanup.java:65` | 카카오 연결 목록 읽기·unlink·삭제가 겹침 | ShedLock 또는 `pg_try_advisory_lock` | 사이클 05 `handoff.md:732` 한 줄 |
| 04:00 리프레시 토큰 정리 | `auth/internal/token/RefreshTokenCleanup.java:28` | DELETE 두 번, 해 거의 없음 | 그대로 또는 ShedLock | 같음 |
| 05:00 사서 추천 받기 (14, `popular` 대체) | 지금 `popular/internal/schedule/FetchScheduler.java:37`, `FetchJob.java:53,73` (`AtomicBoolean`은 JVM 안에서만); 14 `design-delta.md:25,40-44` | 외부 API 두 번, 받기 기록·표지 중복 | advisory lock 또는 ShedLock | backlog "서버가 여러 대가 되면 매달 받기가 겹치지 않게", 사이클 10 `architect-proposal.md:64,174` |
| 04:30 사용 기록 정리 (15) | `docs/cycles/15-usage-log/design-delta.md` (IP 30일 비우기, 지난 줄 지우기) | 멱등이라 해는 적지만 일이 두 번 | ShedLock 또는 그대로 | **이 문서가 처음** |
| 운영 반영 (13) | 13 `design-delta.md:54` `pg_advisory_xact_lock` | 이미 DB 잠금 | 그대로 | backlog, `current/handoff.md:104,559` |

### 2.7 사서 추천 공용 캐시 알림 — 공유하면 좋음
- 위치: 지금 `popular/internal/cache/PopularCache.java:44,61,73` (`AtomicReference`, 10분 새로 고침); 14의 `PicksCache` 10분
- 여러 대면: 받은 직후 알림이 받은 서버에만 가 다른 서버는 최대 10분 늦게 보임
- 방향 [안]: 그대로(10분 새로 고침) 또는 Redis pub/sub·PostgreSQL `NOTIFY` — **이 문서가 처음**

### 2.8 사이클 15 사용 기록 (설계 초안) — 대부분 그대로
| 항목 | 15 설계 | 여러 대일 때 | 방향 |
|---|---|---|---|
| 5초 기록 버퍼 (최대 1만 줄) | 서비스 메모리 | 서버마다 따로 모아 각자 넣음 → 맞음. 재시작 때 잃는 양은 한 대와 같음 | 그대로 |
| 도서관 응답 하루 요약 | 메모리에서 세어 5초마다 `ON CONFLICT … count + EXCLUDED`, `GREATEST`로 더함 | 서버마다 더해도 합이 맞음 | 그대로 [확정: 방법은 사용자 승인 2026-10-13] |
| 04:30 정리 | 2.6 | 2.6 | 2.6 |
| nginx 사용 알림 한도 (IP당 1분 60번) | nginx zone | nginx가 1대면 그대로, 여러 대면 대수 배 | 그대로 (nginx 1대 전제) |
| 버린 묶음 흔적 (`dropped_batch`) | 실패 사실을 메모리에 들고 있다가 다음 묶음에 씀 | 서버마다 자기 것만 씀 → 맞음 | 그대로 |
| 기록 켜기 설정 `chaekcheck.usagelog.enabled` | 서버 설정 값 | 서버마다 같은 값으로 배포해야 함 | 배포 설정 하나로 |

### 2.9 nginx IP별 한도 — nginx가 1대면 그대로
- 위치: dev `deploy/nginx/rate-limits.conf:15,20`, `chaekcheck-locations.conf:28-31,46-49`; 17 설계 일반 `/api/` 5r/s(17 `architect-proposal.md:69`)
- 본 서비스만 여러 대이고 nginx가 하나면 괜찮음. nginx도 여러 대면 대수 배 → Cloudflare 요청 한도 규칙(17 검토 중) 등으로 앞단에서 셈 [안]

## 3. 이 주제를 다룬 문서 (흩어진 곳)

- ADR: 0006, 0007, 0009, 0010, 0020, 0021(원칙), 0038, 0040, 0051:50-51, 0066, 0011, 0094, 0095
- `docs/backlog.md`: "서버를 여러 대로 늘릴 때 캐시와 호출 간격 제어를 Redis로 공유", "느리거나 실패하는 도서관 기억하기 … 여러 대면 공유 저장소", "서버 여러 대 대비: 메모리에 두는 것들 … Redis", "인기 도서: 서버가 여러 대가 되면 …" — 각 줄에서 이 문서로 링크함
- `docs/current/module-map.md:39`, `code-overview.md:998-1003`, `handoff.md:104,559` — 사이클 15 cycle-close 때 이 문서 링크를 더함 (그 전에는 `docs/current/`를 고치지 않음)
- 사이클 01 `architect-proposal.md:134,320,345`, 02 `handoff.md:99,543,559`·`retro.md:31`, 04 `handoff.md:728`, 05 (2.5), 06 `design-delta.md:301`, 10 `architect-proposal.md:64,174`
- `docs/research/member-and-alerts/integration-plan.md:107,151`, `docs/research/deploy/db-memory.md:43`
- `(개인 메모):53,82,95`

## 4. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 여러 대로 늘리는 시점과 조건 | 사용자에게 질문 (그 사이클에서) |
| ADR-0051 Modulith 재시작 다시 처리가 여러 대에서 겹치는지 | 공식 문서 확인 (Spring Modulith event publication) |
| Spring Session Redis에서 세션 만료 이벤트 설정 | 공식 문서 확인 |
| 12·13·14 개발 뒤 새로 생긴 메모리 상태 | 12·13·14 회고 때 이 표를 다시 훑음 |
