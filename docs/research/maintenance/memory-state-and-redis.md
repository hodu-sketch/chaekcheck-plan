# 대출 조회의 메모리 상태와 나중에 Redis로 옮길 때

- 작성: 2026-10-17, 사이클 20 설계 검토 #1 반영. 사용자: "이렇게 하고 나중에 redis전환이 쉽도록 다 구조랑 문서화 해둬 메모리로 관리하는 건 (옵션 등으로 redis전환/내부메모리 사용관리하는 것도 방법인 것 같아)" (2026-10-17)
- 정한 것 [확정] (사용자 승인, 2026-10-17, 설계 검토 #1, [ADR-0133](../../adr/0133-lookup-memory-state-behind-store-interfaces.md)): 대출 조회(`availability`)가 메모리에 두는 공유 상태는 모두 작은 저장소 인터페이스 뒤에 두고, 설정 하나 `chaekcheck.lookup.state-store`(이름 [안])로 구현을 고른다. 사이클 20에서는 `memory`만 만든다. Redis 구현과 Redis 컨테이너는 사이클 20·17에 없다
- 이 문서는 목록과 옮기는 방법만 적는다. Redis 쪽 방식은 모두 [안]이고, 실제로 옮기는 사이클에서 정한다 (나중에 분리할 때)
- 서비스 전체(로그인 도중 값, 새벽 작업, 사용 기록 등)의 "여러 대로 늘릴 때 고칠 곳"은 [`../scaling/in-memory-state.md`](../scaling/in-memory-state.md)(2026-10-13)에 있다. 이 문서는 그중 **대출 조회 길**만, 사이클 20이 새로 만드는 것까지 넣어 다시 정리한다
- dev 코드 위치는 `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev\backend\src\main\java\com\chaekcheck\` 기준, 2026-10-17 읽음. 사이클 20 항목은 [`../../cycles/20-lookup-status-and-extension/design-delta.md`](../../cycles/20-lookup-status-and-extension/design-delta.md) 기준(아직 코드 없음)

## 1. 왜 지금 인터페이스부터 두는가

- 지금 운영은 본 서비스 1대 [확정] (ADR-0021 "운영은 1대, 설계는 여러 대 대비"). 메모리면 충분하고, Redis를 두면 컨테이너 하나와 메모리를 더 씀(2GB 서버, `../../settings-index.md` 1절)
- 그래도 부르는 쪽이 저장소 구현(Caffeine·`ConcurrentHashMap`·`LinkedHashMap`)을 직접 알면, 나중에 옮길 때 부르는 곳을 모두 고쳐야 한다. 인터페이스 뒤에 두면 "Redis 구현 하나 더 + 설정 값 하나 바꾸기"로 끝난다
- 이미 dev에 같은 방식이 있다: `SearchPageCache`(구현 `CaffeineSearchPageCache`), `DetailVerdictCache`(구현 `CaffeineDetailVerdictCache`), `HostThrottle`(구현 `InMemoryHostThrottle`, 주석 "Correct only while the main service runs as one instance"). 사이클 20의 새 상태도 이렇게 만든다

## 2. 한눈에: 대출 조회 길의 메모리 상태

"여러 대면 공유" = 본 서비스를 두 대 이상 띄울 때 서버끼리 같은 값을 봐야 맞는가.

| 상태 | 무엇을 들고 있나 | 크기·만료 | 있는 곳 | 여러 대면 공유 | Redis로 옮기면 [안] |
|---|---|---|---|---|---|
| 검색 쪽 캐시 | (도서관, 검색어, 필드, 쪽) → 해석한 검색 결과 쪽 `FetchedPage` | 최대 1,000개, 쓴 뒤 3분 | dev `availability/internal/fetch/CaffeineSearchPageCache.java`(인터페이스 `SearchPageCache`), 값 `application.yml` 114~118행 `cache-ttl: 3m`·`search-page-max-size: 1000` | 공유 (아니면 서버 수만큼 같은 도서관을 다시 부름) | 키 + 값, `SET … PX 180000`(3분 만료). 진행 중인 요청 함께 쓰기(같은 키를 기다리는 사람끼리 한 번만 부르기)는 서버 안에서만 되므로 따로 설계 필요 |
| 상세 판정 캐시 | 포털 상세 페이지 → 판정 `DetailPage` | 최대 1,000개, 쓴 뒤 3분 | dev `availability/internal/resolve/CaffeineDetailVerdictCache.java`(인터페이스 `DetailVerdictCache`), `detail-verdict-max-size: 1000` | 공유 | 위와 같음 |
| 확장 결과 캐시 (사이클 20, 2단계) | 확장이 올려 서버가 해석한 쪽, `via=extension`·`storedAt` | 따로 둔 500칸, 처음 넣은 시각 + 3분 고정 | 설계 (design-delta "데이터" 캐시 값 줄) | 공유 | 위와 같음, 만료는 `SET … PX` 한 번(덮어써도 만료를 늘리지 않으려면 `KEEPTTL` 또는 `NX`) |
| 계획 보관함 `SearchPlanStore` (사이클 20, 2단계) | `planId` → 계획(만든 IP 또는 브라우저 번호, 주소 목록, 받은 쪽 표시) | 무게(주소 수) 25,000(약 10MB), 쓴 뒤 10분, 가득이면 새 계획 503(밀어내지 않음) | 설계 | 공유 (계획을 만든 서버와 올리기를 받는 서버가 다를 수 있음) | 계획 하나 = 해시 하나 + `EXPIRE 600`. 전체 무게는 카운터 하나(`INCRBY`/`DECRBY`)로 세고, 넘으면 거절 — 무게 셈과 넣기를 한 번에 하려면 Lua 스크립트 |
| 브라우저 번호 장부 `LookupClientLedger` (사이클 20, 3단계) | 번호 → 받은 IP(/64)·받은 시각·마지막 쓴 시각·열린 계획 수·계획 무게 합·최근 실패·잠긴 때까지 | 5만 줄(약 5MB 어림), 받은 지 1일, **차면 가장 오래 안 쓴 줄을 밀어냄(LRU), 방금 받은 번호는 밀려나지 않음** [확정] (설계 검토 #1) | 설계: 접근 순서 `LinkedHashMap` + 잠금 하나 | 공유 (아니면 다른 서버에서 받은 번호를 "장부에 없음"으로 거절) | 번호마다 해시 + `EXPIRE 86400`, 마지막 쓴 시각은 정렬 집합(`ZADD` 점수 = 마지막 쓴 시각) 하나에 두고, 5만을 넘으면 점수가 가장 작은 것부터 지움(정확한 LRU). `maxmemory-policy allkeys-lru`는 **장부만 쓰는 따로 둔 Redis**일 때만 후보(한 인스턴스의 모든 키에 걸리고, 근사 LRU라 "방금 받은 번호" 보장을 정확히 주지 않음) — 아래 4절 |
| 번호 잠금 (사이클 20, 3단계) | 번호마다 1분 실패 수, 잠긴 때까지 | 1분 30번 → 10분 잠금 | 설계 (장부 줄 안) | 공유 | 실패 수 = `INCR` + `EXPIRE 60`(redis.io INCR "rate limiter" 형태), 잠금 = `SET lock:{번호} 1 NX EX 600` |
| 공인 IP 울타리 셈 (사이클 20, 3단계) | IP(/64) → 그 IP 번호들의 계획 무게 합, 1분 새 번호 수 | 무게 20%(= 5,000), 새 번호 1분 30 | 설계 ("공인 IP별 합계", 구조 [안]) | 공유 (아니면 서버 수만큼 울타리가 넓어짐) | 무게 합 = `INCRBY`/`DECRBY`(계획이 닫히거나 만료될 때 빼야 함 — 만료로 사라지는 계획은 빼기를 놓치므로 계획 쪽에 무게를 적어 두고 주기적으로 다시 셈 [안]), 새 번호 수 = `INCR` + `EXPIRE 60` |
| 동시 검색 자리 `SearchSlots` | 쓰는 중인 자리 수 | 지금 20, 사이클 20에서 40 | dev `availability/internal/search/SearchSlots.java`(`Semaphore`) | 공유 (전체 상한으로 쓸 때) — 서버마다 따로면 전체가 대수 × 40 | 카운터 하나를 `INCR`로 잡고 넘으면 되돌림, 반납은 `DECR`. 서버가 죽으면 반납을 놓치므로 자리마다 만료를 둔 키(예: 정렬 집합 점수 = 잡은 시각, 오래된 것은 셈에서 뺌) [안] |
| 마지막 503 시각 `SearchSlots.lastRefusedAt` (사이클 20, 1단계) | 마지막으로 503 `server_busy`를 낸 시각 | 값 하나, 상태 불이 10초 안인지 봄 | 설계 | 공유 (다른 서버가 낸 503도 빨강이어야 맞음) | `SET … PX 10000` 키 하나(있으면 빨강) |
| 상태 불 메모 `LookupStatusService` (사이클 20, 1단계) | 계산해 둔 상태 응답 | 1초 | 설계 (`AtomicReference` + 한 번만 계산) | 따로 둬도 됨 — 서버마다 1초씩 계산해도 해가 없음. 다만 계산에 쓰는 숫자(자리·503 시각·줄 선 호스트)는 공유 저장소에서 읽음 | 옮기지 않음 [안] |
| 마지막 DB 오류 시각 (사이클 20, 1단계) | `ApiExceptionHandler`가 `recordDbError()`로 남긴 시각 | 값 하나, 30초 | 설계 (설계 검토 #3) | 공유하면 좋음 — DB는 하나라 한 서버가 본 오류는 모두의 문제. 따로 둬도 "그 서버를 통한 검색이 실패"는 맞음 | `SET … PX 30000` 키 하나 |
| 줄 선 호스트 `HostQueueBoard` (사이클 20, 1단계) | (길, 호스트, 도서관) → 기다림마다 시작 시각, 최근 시간 초과 시각 | 10초 지난 기다림은 안 셈, 시간 초과 60초 | 설계 (`ConcurrentHashMap` [안]) | 호스트 간격(`HostThrottle`)을 따라감 — 간격을 공유하면 기다림도 공유해야 「밀려요」가 맞음 | 정렬 집합(점수 = 시작 시각, `ZREMRANGEBYSCORE`로 10초 지난 것 지움) [안] |
| 호스트 간격 `HostThrottle` | 호스트마다 동시 1건·마지막 호출 시각 | 동시 1, 간격 1초 | dev `availability/internal/fetch/InMemoryHostThrottle.java`(`ConcurrentHashMap` + `Semaphore`), `host-max-concurrency: 1`·`host-min-interval: 1s` | **나가는 길(IP)마다** 공유. 같은 나가는 IP를 여러 서버가 쓰면 공유해야 하고(도서관이 받는 양이 대수 배가 됨 — `../scaling/in-memory-state.md` 2.1), 서버마다 나가는 IP가 따로면 서버마다 따로가 맞음 | 키 = 나가는 IP + 호스트, 잠금 `SET … NX PX`(호출 시간 상한) + 마지막 끝 시각. 공정한 차례(지금 `Semaphore(…, true)`)는 Redis로 그대로 안 됨 [안] |
| 조회 서버 쉼 표시 | 조회 서버 id → 쉬는 끝 시각 | 30초 | dev `availability/internal/fetch/FetchServiceSiteFetcher.java` 58행 `restingUntil`(`ConcurrentHashMap`), `rest-duration: 30s` | 따로 둬도 됨 (서버마다 스스로 알아내는 데 한 번 더 실패할 뿐) | 옮기지 않음 [안] |
| 해석 자리 `ParseSlots` (사이클 20, 1단계) | 동시에 해석 중인 수 | 8, 기다림 2초 | 설계 | **서버마다 따로** — 그 서버의 힙(512MB)을 지키는 장치라 다른 서버 몫과 합치면 안 됨 | 옮기지 않음 |
| 묶음·SSE 상태 | 한 검색 묶음의 진행 | 요청 하나 동안 | dev `BatchSession`·`HoldingSession` (`../scaling/in-memory-state.md` 2.4) | 따로 둬도 됨 — 연결 하나가 서버 하나에 붙음 | 옮기지 않음 |

### 공유 여부를 가른 기준

- **공유해야 맞는 것**: 서버 하나가 "준 것"을 다른 서버가 "확인"하는 것(계획 번호, 브라우저 번호, 잠금), 여러 서버를 합쳐 하나의 상한을 지키는 것(IP 울타리, 전체 검색 자리, 계획 보관함 무게), 다시 부르기를 줄이는 캐시
- **서버마다 따로가 맞는 것**: 그 프로세스의 메모리를 지키는 것(해석 자리, 묶음 상태), 그 서버가 쓰는 나가는 길에 묶인 것(나가는 IP가 서버마다 다를 때의 호스트 간격)
- **어느 쪽이든 되는 것**: 1초 메모, 조회 서버 쉼 표시

## 3. 설정 하나로 고르기

- 속성 `chaekcheck.lookup.state-store` = `memory` (사이클 20) \| `redis` (나중) — 이름 [안], 환경 변수 `CHAEKCHECK_LOOKUP_STATESTORE`(`../../settings-index.md` 8절 규칙)
- `memory`일 때: 위 표의 "있는 곳" 그대로. Redis 의존성·연결 설정이 없어도 켜져야 함
- `redis`일 때(나중): 공유 칸이 "공유"인 상태만 Redis 구현으로 바꾸고, "서버마다 따로"는 `memory` 그대로 [안]. 한 번에 다 바꿀지 상태마다 고를지(예: `state-store.ledger=redis`)는 그때 정함 [안]
- Spring에서 설정 값으로 구현을 고르는 방식(예: `@ConditionalOnProperty`)은 dev가 정함 [안]

## 4. Redis 쪽 사실 (공식 문서)

- 키 만료: `SET`의 `EX`(초)·`PX`(밀리초) 옵션으로 값과 만료를 한 번에 줌, `NX`는 "Only set the key if it does not already exist", `KEEPTTL`은 만료를 그대로 둠. `SET resource-name anystring NX EX max-lock-time`이 간단한 잠금 형태로 소개되어 있고, 공식 문서는 이 형태보다 Redlock을 권함 — https://redis.io/docs/latest/commands/set/ (2026-10-17 확인) [확정]
- 카운터·속도 제한: `INCR`과 `EXPIRE`를 함께 써서 최근 N초만 세는 카운터, `MULTI`/`EXEC`로 둘을 함께 실행하는 "rate limiter" 형태, `INCR` 뒤 `EXPIRE`를 빠뜨리는 경쟁 조건은 Lua 스크립트로 막는다고 적혀 있음 — https://redis.io/docs/latest/commands/incr/ (2026-10-17 확인) [확정]
- 정렬 집합: `ZADD`는 점수로 정렬된 집합에 넣거나 점수를 바꾸며, 넣을 때마다 O(log(N)) — https://redis.io/docs/latest/commands/zadd/ (2026-10-17 확인) [확정]. 장부의 "가장 오래 안 쓴 것 지우기"를 정확히 하려면 이것을 씀 [안]
- 메모리가 찰 때 지우기: `maxmemory-policy`의 `allkeys-lru`는 가장 오래 안 쓴 키를 지우고, `noeviction`은 지우지 않고 새로 쓰는 명령에 오류를 냄. Redis의 LRU는 정확한 LRU가 아니라 키 몇 개를 무작위로 골라 보는 근사이고(`maxmemory-samples`), 정책은 그 인스턴스의 모든 키에 걸림. 캐시와 지우면 안 되는 키를 한 인스턴스에 섞으면 인스턴스를 둘로 나누는 것을 권함 — https://redis.io/docs/latest/develop/reference/eviction/ (2026-10-17 확인) [확정]
  - 그래서 계획 보관함(가득이면 503, 밀어내지 않음)과 장부(정확한 LRU 요구)를 캐시와 같은 `allkeys-lru` 인스턴스에 두면 결정과 어긋남 → 캐시용과 상태용을 나누거나, 상태용은 `noeviction` + 앱이 상한을 직접 셈 [안]
- 확인하지 못한 것: Redis가 서버 재시작 뒤 장부·계획을 남길지(영속 설정 RDB·AOF), Spring Data Redis 연결 설정 — 옮기는 사이클에서 공식 문서 확인 [확인 필요]

## 5. 옮기는 순서 (나중에 분리할 때) [안]

1. **인터페이스는 이미 있음** (사이클 20에서 만듦) — 부르는 곳을 고치지 않음
2. **Redis 구현을 하나씩 더함** — 공유 칸이 "공유"인 것부터: 계획 보관함·장부·잠금·IP 울타리(여러 대면 바로 틀리는 것) → 캐시(틀리진 않고 효율만 떨어짐) → 호스트 간격(나가는 IP를 서버끼리 나눌 때만)
3. **설정 값만 바꿈** (`state-store=redis`) — 같은 시험(dev 단위·통합 시험)을 두 구현에 모두 돌림
4. **잼** — 1분 운영 요약 로그(`../../settings-index.md` 6-1절)의 힙·503·장부 크기, Redis 쪽 메모리·지운 키 수(`INFO`의 `evicted_keys`), 검색 응답 시간. Redis 한 번 왕복이 늘어나는 만큼 올리기·계획 요청 시간이 늘어남
5. **사이클 17 배포에 Redis 컨테이너를 더함** — 2GB 서버 메모리 표(`../../settings-index.md` 1절)를 다시 셈, `prod.env`에 연결 값

## 6. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 언제 옮길지(서버 여러 대, 또는 재시작에도 장부·계획을 잃지 않아야 할 때) | 사용자에게 질문 (그 사이클에서) |
| Redis 영속 설정(RDB·AOF)과 재시작 뒤 장부를 남길지 | 공식 문서 확인 (redis.io persistence) |
| 진행 중인 요청 함께 쓰기(같은 캐시 키를 기다리는 사람끼리 한 번만 부르기)를 여러 대에서 어떻게 할지 | 프로토타입 |
| 2GB 서버에서 Redis 컨테이너 메모리 | 사이클 17 배포 뒤 측정 |
