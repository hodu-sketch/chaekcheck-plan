# 설계 변경: 사이클 20 조회 상태 신호와 브라우저 확장 조회

- 바탕: [`scope.md`](scope.md)(범위 8개 확정), [`spec.md`](spec.md)(R1~R15·R15-1, AC-1~31·AC-10a), [`flow.md`](flow.md), [`architect-proposal.md`](architect-proposal.md)(설계 결정 13개 확정, 2026-10-16), ADR-0118~0121(Proposed)
- 전제: **사이클 17**(나가는 길·막힌 길 기록·운영 nginx·Actuator)과 **사이클 21**(머리말 메뉴)이 먼저 dev에 들어감. 20은 그 위에 얹음. 사이클 19·21과 겹치는 usagelog changeset은 번호로 나눔(19 = `002`, 21 = `003`, 20 = `004`, 사이클 21 설계 검토 #4 [확정] 2026-10-16), 나중에 합치는 쪽이 include를 master 맨 끝으로
- 상태: **초안** — `docs/current/` 반영과 인계는 사이클 17 회고 뒤(`CLAUDE.md`). `[안]`은 결정 페이지 [`easy/2026-10-16-design-delta-decisions.html`](easy/2026-10-16-design-delta-decisions.html)·[`easy/2026-10-16-review-decisions.html`](easy/2026-10-16-review-decisions.html)에서 정함
- **세 관점 검토 반영 (2026-10-16)**: 사용자 요청("사용자적 관점과 서버 리소스 적인 관점 그리고 전체적인 보안과 안정성적인 관점에서 검토를 한 번 구체적이고 꼼꼼하게 하고 수정할 거 있으면 수정하고")으로 세 관점 검토를 돌려 고칠 것은 이 문서에 바로 고쳤고(아래 "검토로 고친 것" 표시 ◆), 사용자가 고를 것만 [`easy/2026-10-16-review-decisions.html`](easy/2026-10-16-review-decisions.html)에 [안]으로 남김. #1~#33 모두 2026-10-16 승인(#27·#31·#32·#33 = 서버가 주는 브라우저 번호·장부·HttpOnly 쿠키·공인 IP 울타리, 2026-10-16 함께 반영)
- ◆는 태그가 아니라 "검토로 고친 곳" 표시다. ◆만 있고 다른 태그가 없는 값·구조는 [안](검토가 고쳤고 사용자가 따로 고르지 않음)으로 읽는다
- 그림 원본: [`easy/design-delta-original.html`](easy/design-delta-original.html)
- **임계값은 모두 [`../../settings-index.md`](../../settings-index.md)가 색인**(사이클 밖 설정값 목록): 시간·용량·동시 수·한도·잠금·울타리 숫자마다 지금 값, 근거(계산 포함), 정한 결정 번호(결정 원문은 결정 페이지 #NN), 날짜, 태그, 환경 변수(8절)를 적음. 이 문서의 숫자를 바꾸면 그 표도 함께 고침 (사용자: "전반적으로 이런 임계값 숫자 이런 것은 계획대로 관리하도록 하고 다른 ai가 맥락을 잘 파악하도록 링크 문서화 해야 해", 2026-10-16)
- **실제 운영 서버는 2GB** (사이클 17이 무료 플랜 제약으로 시드니 t4g.small 2GB에 만듦, 앱 전 이미 약 0.97GiB 사용 — `../17-first-deploy/research.md` 17절, 2026-10-15~16). 이번 사이클이 힙에 더하는 메모리 상한(페이지 상한·동시 해석·계획 보관함·확장 캐시·카운터)은 2GB 기준으로 [확정] (세 관점 검토 #7·#8·#9 승인 2026-10-16)

## 구조 그림

### 모듈 구성도 (이 사이클이 더하거나 바꾸는 것만)

```mermaid
flowchart TB
  subgraph browser["사용자 브라우저"]
    web["web (React) — 변경<br/>HeaderSignal · useLookupStatus (10초)<br/>ExtensionBridge (인사 · port · 다시 인사)<br/>sortBatch: 「확인하지 못한 도서관」 묶음<br/>AppLayout: legal 분기 제거 (ADR-0121)"]
    ext["extension/ — 새 폴더 (ADR-0120)<br/>MV3 service worker<br/>보낸 쪽 확인 · 주소 거르기 · 전역 호스트 큐<br/>호스트 1건·1초 · 동시 5 · 스트림으로 읽어 상한"]
  end
  nginx["nginx — 변경 (템플릿)<br/>/api/v1/lookup-status: 일반 구역<br/>…/plans: 계획 구역 ${LOOKUP_PLAN_PER_MIN}r/m<br/>/api/v1/lookup-plans/: 본문 ${LOOKUP_MAX_BODY_MB}m · ${LOOKUP_UPLOAD_RATE}r/s · 동시 연결 제한"]
  subgraph main["본 서비스 (Spring Modulith, 1대)"]
    av["availability — 변경<br/>+ LookupStatusController · LookupStatusService (1초 메모, 한 번만 계산)<br/>+ SearchSlots.lastRefusedAt<br/>+ HostQueueBoard (길마다 대기·시간 초과, try/finally 짝)<br/>+ LookupPlanController · SearchPlanStore (10분, 무게 상한, 브라우저 번호당 열린 계획 20)<br/>+ LookupClientLedger (브라우저 번호 장부: 번호 → 받은 IP·시각·계획·무게·실패, 5만 줄 · 1일)<br/>+ UploadGate (검사 순서 · 장부 + 같은 IP · 동시 해석 상한 · 번호·IP 잠금 · IP 울타리)<br/>+ 서버 대행 목록(server-fetched-libraries) 도서관만 서버가 불러 줌<br/>+ LibraryPageFetcher.accept · DetailPageFetcher.accept (서버 호출 없음)<br/>+ detailUrl 같은 호스트 검사 (서버 모드에도)<br/>+ 떠난 묶음 멈추기 (CLIENT_GONE)<br/>(있던 것: SearchSlots · BatchRunner · HostThrottle · adapter 9종 · 캐시 3분)"]
    ul["usagelog — 변경(작음)<br/>library_response_daily.source + 'extension' · 'server_for_extension'<br/>rejected_event.reason + 'invalid_plan' · 'invalid_client_key'<br/>+ 공개 recordRejected (IP·이유마다 1분 1줄)"]
    lib["library — 변경 없음<br/>LibraryCatalog 읽기만"]
    cat["catalog — 변경(작음)<br/>GET /books pageSize 기본값 10을 설정 속성으로 분리, 최대 20<br/>CatalogHoldings 읽기만"]
    av -->|"UsageLog.recordLibraryResponse(EXTENSION) · recordRejected · capture().clientIp()"| ul
    av -->|"LibraryCatalog"| lib
    av -->|"CatalogHoldings"| cat
  end
  web -->|"GET lookup-status · POST plans · items · close (CSRF 머리 · 브라우저 번호 쿠키 HttpOnly)"| nginx --> av
  web <-->|"port: items ↔ 받은 바이트"| ext
  ext -->|"GET (사용자 IP, 공개 호스트만)"| sites[("도서관 사이트들")]
  av -->|"서버 모드 그대로 (직접 / 조회 서버) · 확장 모드의 서버 대행 목록 도서관"| sites
  bl["사이클 17: 길마다 throttle · 막힌 길 기록"] -.->|"읽기"| av
```

### 주요 흐름 1: 상태 묻기 (spec R1~R5)

```mermaid
sequenceDiagram
  participant W as web (AppLayout Provider)
  participant N as nginx /api/
  participant C as LookupStatusController
  participant S as LookupStatusService
  participant B as HostQueueBoard · SearchSlots
  loop 탭이 보이는 동안 10초마다 (TanStack Query refetchInterval)
    W->>N: GET /api/v1/lookup-status
    N->>C: (일반 구역 5r/s, 도서관 호출 구역 아님)
    C->>S: snapshot()
    alt 1초 안에 계산한 값 있음
      S-->>C: 메모 값 (동시에 여럿 와도 계산은 한 번)
    else
      S->>B: inUse, lastRefusedAt, 길마다 대기·시간 초과 (막힌 길 제외)
      B-->>S: 숫자들
      S->>S: level·reason 판정 (R1, 업체 길 멈춤·나가는 길 설정은 읽기 전용 포트로) · queuedLibraryIds 최대 200 (R4)
    end
    C-->>W: 200 {slots, inUse, level, reason, queuedLibraryIds, serverTime}
  end
  W->>W: 검색 중 503 server_busy → 즉시 RED (R2)
  W->>W: 마지막 성공에서 30초 지남 → GRAY 「상태 모름」 (R5, 탭 복귀 때도 바로 판정)
```

### 주요 흐름 2: 확장 모드 검색 (spec R6~R11, ADR-0119)

```mermaid
sequenceDiagram
  participant W as web
  participant X as extension
  participant N as nginx
  participant P as LookupPlanController · UploadGate
  participant F as LibraryPageFetcher / DetailPageFetcher (accept)
  participant L as 도서관
  W->>X: 인사 runtime.sendMessage(VITE_EXTENSION_ID) (첫 검색은 답까지 최대 500ms 기다림)
  X-->>W: {version} → 파란 불, 상태 묻기 없음
  W->>N: POST /api/v1/ebook-searches/plans (검색 조건, replaces?, X-XSRF-TOKEN; 브라우저가 번호 쿠키를 알아서 붙임)
  N->>P: (계획 구역 r/m)
  P->>P: Origin → IP 잠금·IP 울타리(무게 20%·새 번호 1분 30·잠긴 번호 5) → 번호 쿠키가 장부에 있고 받은 IP = 지금 IP인가 (아니면·없으면 새 번호를 장부에 적음) → 번호 잠금 → 계획 저장 (planId · 브라우저 번호 · 10분) · SearchSlots 안 잡음(서버 대행 목록 도서관이 있을 때만 자리 1개)
  alt IP 울타리에 걸림 (검토 #31)
    P-->>W: 429 → 화면 「잠시 후 다시」(서버 모드로 넘기지 않음, 다음 검색은 다시 확장 모드)
  else 보관함 전체가 참 (검토 #8)
    P-->>W: 503 → 그 검색 한 번만 서버 모드
  end
  P-->>W: 201 {planId, items[서버 대행 목록 밖 모든 주소]} + (새 번호면) Set-Cookie 브라우저 번호 (HttpOnly · Secure · SameSite=Strict · 계획·올리기 경로만 · 1일) (캐시 안 봄, 설계 #9; 서버 대행 도서관 결과는 같은 응답의 events로)
  W->>X: port: items (최대 100, URL 2KB)
  loop 전역 호스트 큐: 호스트 1건 · 1초, 동시 5
    X->>X: sender.origin · 주소 거르기 (http(s)·공개 호스트·기본 포트)
    X->>L: GET (머리 10초, 본문 마감까지, 스트림으로 읽다 상한 넘으면 중단)
    L-->>X: status · bytes
    X-->>W: {itemId, status, contentType, base64, ms} → 화면은 바로 Uint8Array로
    W->>N: POST /api/v1/lookup-plans/{planId}/items/{itemId} (octet-stream, CSRF, 번호 쿠키)
    N->>P: (본문 ≤ ${LOOKUP_MAX_BODY_MB}m · ${LOOKUP_UPLOAD_RATE}r/s · 동시 연결 제한)
    P->>P: 검사 순서: Origin → 번호가 장부에 있나 → 받은 IP = 지금 IP → 번호·IP 잠금 → 계획·쪽 번호·처음·계획을 만든 번호와 같음 → Content-Length·Content-Encoding 없음 → 동시 해석 자리
    P->>F: accept(target, SiteResponse via=extension) (throttle·SiteFetcher·서버 상세 호출 없음)
    F->>F: adapter 해석 → detailUrl 같은 호스트 검사 → 캐시 넣기(규칙)
    alt 해석됨
      F-->>P: page · verdict · detailItems(같은 호스트만)
      P-->>W: 200 {events[library-result | row-verdict], detailItems[], stop}
    else 해석 실패 · status≠200 · outcome TIMEOUT/ERROR
      P-->>W: 200 {events[library-failed]} (캐시 안 넣음, usagelog FAILURE)
    end
  end
  W->>X: detailItems (포털 빈 판정 줄)
  X-->>W: 상세 바이트 → 같은 업로드 → row-verdict
  W->>N: POST /api/v1/lookup-plans/{planId}/close {notSent} (번호 쿠키, 화면 떠날 때는 keepalive)
  P-->>W: 200 {batch-done} · usagelog source=EXTENSION
  alt 계획 문제 (없음·만료·지워짐·중복·번호 다름·Origin)
    P-->>W: 400 invalid_plan → 남은 줄은 「확인하지 못한 도서관」, 오류 화면 없음
  else 번호 쿠키 없음·장부에 없음 (서버 재시작 포함)
    P-->>W: 400 invalid_client_key → 화면이 남은 도서관만 다시 계획(새 번호 받음, 사용자 조작 없음, 1번)
  else 받은 IP와 지금 IP가 다름 (폰 와이파이↔LTE)
    P-->>W: 400 client_ip_changed → 화면이 남은 도서관만 다시 계획(새 번호 받음, 사용자 조작 없음, 잠금에 안 셈)
  else port 끊김
    W->>X: 인사 최대 3번(바로·1초·2초) → 답 있으면 확장이 남은 items를 다시 요청, 셋 다 없으면 남은 것 notSent → 「확인하지 못한 도서관」, 다음 검색부터 서버 모드 (검토 #4 확정)
  end
```

### 주요 흐름 3: 떠난 묶음 멈추기 (서버 모드, 검토 결정 #14 [확정] 승인 2026-10-16, ADR-0131)

```mermaid
sequenceDiagram
  participant W as web
  participant E as SseEmitter / SseEventSink
  participant R as BatchRunner · BatchSession
  participant T as HostThrottle · fetcher
  W->>E: 스트림 열림 (자리 1개)
  W--xE: 화면 떠남 (abort)
  E->>R: send 실패 또는 onError/onTimeout → clientGone
  R->>R: 새 도서관 띄우지 않음 (StopReason CLIENT_GONE) · 남은 후보 notSent → SKIPPED · 포털 상세 새로 시작 안 함
  T-->>R: 이미 넘긴 요청(줄 대기 포함)은 끝까지 → 캐시에 넣음 (다른 사용자와 공유될 수 있어 취소 안 함)
  R->>R: 넘긴 요청이 모두 끝나면 자리 반납 (최대 묶음 마감 8초 · 상세 30초)
```

### 도메인 모델 (새 개념만)

```mermaid
classDiagram
  class LookupStatus {
    slots
    inUse
    level GREEN|YELLOW|RED
    reason NONE|VENDOR_PAUSED|NO_LANE
    queuedLibraryIds 최대 200
    serverTime
  }
  class HostQueueEntry {
    laneId
    hostKey
    waitingByLibrary
    lastTimeoutAt
  }
  class SearchPlan {
    planId SecureRandom 16바이트
    kind SEARCH|HOLDING|MORE
    batchNo
    clientId 브라우저 번호
    deadlineAt
    rowLimit
    countedRows
    expiresAt
  }
  class PlanItem {
    itemId
    libraryId
    page
    url
    kind LIST|DETAIL
    state PENDING|RECEIVED|SKIPPED
  }
  class UploadResult {
    itemId
    outcome RESPONDED|TIMEOUT|ERROR|PARSE_FAILED
    ms
  }
  class LookupClient {
    clientId SecureRandom 16바이트
    issuedIp /64
    issuedAt
    openPlans
    planWeight
    recentFailures
    lockedUntil
  }
  LookupStatus "1" --> "0..*" HostQueueEntry : 길마다
  LookupClient "1" --> "0..20" SearchPlan : 브라우저 번호마다
  SearchPlan "1" --> "1..*" PlanItem
  PlanItem "1" --> "0..1" UploadResult : 본문은 요청 중에만
```

## 모듈

| 모듈 | 신규/변경 | 책임 | 공개 API | 발행/구독 이벤트 | 소유 테이블 |
|---|---|---|---|---|---|
| `availability` | 변경 | 상태 신호(`LookupStatusService`, 1초 메모, `AtomicReference` + 한 번만 계산); 줄 선 호스트(`HostQueueBoard`: throttle의 acquire를 감싼 try/finally에서 대기 시작·끝을 짝으로, 시간 초과, `(laneId, hostKey, libraryId)`별 대기 수, 0이면 지움, 줄 자체는 호스트 수로 상한이라 지우지 않음); 확장 모드 계획(`SearchPlanStore`: 무게(주소 수) 25,000(약 10MB), 브라우저 번호당 열린 계획 20(넘으면 그 번호의 가장 오래된 것만 지움) [확정] (검토 #22), 보관함 전체가 차면 다른 사람 계획을 밀어내지 않고 새 계획 요청 503 → 화면은 그 한 번의 검색을 서버 모드로, 닫힌 계획(close·replaces)은 바로 지움 [확정] (검토 #8 승인 2026-10-16))과 올리기 입구(`LookupPlanController` + `UploadGate`: 검사 순서·동시 해석 상한 4·기다림 2초 [확정] (검토 #7 승인 2026-10-16)·브라우저 번호 장부 대조 + 같은 IP·번호·IP 잠금 [확정] (검토 #22·#32)); 브라우저 번호 장부(`LookupClientLedger`, 이름 [안]: 번호 → 받은 IP(/64)·받은 시각·열린 계획 수·계획 무게 합·최근 실패, 5만 줄·1일, 번호는 HttpOnly 쿠키로 줌, 공인 IP 울타리 셋을 이 장부로 셈) [확정] (검토 #27·#31·#32·#33, 아래 "사람(브라우저)마다 세기"); 받은 응답 입구 `LibraryPageFetcher.accept`·`DetailPageFetcher.accept`(`via=extension`, throttle·SiteFetcher·`detailPages.fetch`를 부르지 않음, 이를 지키는 단위 시험) ◆; 포털 상세 조회 2단계 분리(`SiteListResolver`: 상세 주소 뽑기 / 받은 상세로 판정); 해석 결과의 `detailUrl`·`detailItems`는 `DetailPageFetcher.checkedUri`(http(s)·도서관과 같은 호스트) 통과한 것만, 아니면 null — **서버 모드 `DetailLookupResolver.lookup`에도 같은 검사**(지금 구멍) ◆; 캐시 값에 `via`·`storedAt`, 진행 중인 서버 로드는 덮지 않음 ◆; 떠난 묶음 멈추기(새 도서관·포털 상세를 띄우지 않음, 넘긴 요청은 끝까지 받아 캐시, 책 화면도 같음) [확정] (검토 #14 승인 2026-10-16, ADR-0131); 상태 응답의 `reason`(아래 "상태 불이 읽는 나가는 길 값") [확정] 검토 #28 승인 2026-10-16; 확장 모드 계획에서 서버 대행 목록(`server-fetched-libraries`) 도서관만 서버가 불러 줌(목록이 비어 있지 않을 때만 서버 자리 1개, 출처 `server_for_extension`) [확정] (검토 #16) | REST만. 다른 모듈에 새 공개 타입 없음 | 없음 | 없음(메모리) |
| `usagelog` | 변경(작음) | `library_response_daily.source`에 `extension`·`server_for_extension` 허용, 공개 enum `UsageLog.ResponseSource.EXTENSION`·`SERVER_FOR_EXTENSION`(값 이름 [안] 검토 #16); `rejected_event.reason`에 `invalid_plan`·`invalid_client_key`(이름 [안]) 허용(`client_ip_changed`는 폰 회선이 바뀌는 정상 경우라 거절 기록에 남기지 않음 [안]); **새 공개 메서드 `UsageLog.recordRejected(UsageRequest, String reason)`**(지금 없음, dev 2026-10-16 확인) — 원본 값 없이 이유만, availability가 IP·이유마다 1분 1줄 [안]로 모아 부름 ◆ | `UsageLog` + enum 값 + `recordRejected` | 없음 | `usagelog.library_response_daily`·`usagelog.rejected_event`(CHECK 변경) |
| `library` | 변경 없음 | `LibraryCatalog` 읽기만 | — | — | — |
| `catalog` | 변경(작음) | `GET /api/v1/books` `pageSize` 기본값 10을 설정 속성으로 분리, 최대 20(지금 dev `BookParams.MAX_PAGE_SIZE = 20` 하나가 기본값·최대를 함께 맡음, 2026-10-16 읽음) [확정] (검토 #23); 값은 서버 설정 속성 하나에서 정함 [확정] (검토 #30 승인 2026-10-16: 서버 설정 속성 하나, 웹은 `pageSize`를 보내지 않음). `CatalogHoldings` 읽기만 | — | — | — |
| web | 변경 | 아래 "웹 (화면)" | — | — | — |
| `extension/` | 신규(본 서비스 밖, dev 저장소 맨 위) | 아래 "확장 꾸러미" | 웹 ↔ 확장 메시지 | — | — |
| nginx (deploy) | 변경 | 아래 "외부 연동 · nginx" | — | — | — |

- 모듈 의존 방향은 그대로(`availability → catalog, library, usagelog`), 새 모듈·새 이벤트 없음. 상태 불이 읽는 나가는 길 값은 사이클 17/22의 나가는 길 코드가 주는 읽기 전용 포트(같은 `availability` 안, 아래)라 의존 방향을 바꾸지 않음. `ModularityTests`·`DocumentationTests` 변경 없음
- 사이클 17 의존: `HostQueueBoard`는 17의 길(lane) 개념과 막힌 길 기록을 읽음. 17이 먼저 들어가지 않으면 길은 하나(직접)로 두고 막힌 길은 빈 목록 [확정] (전제)
- **사람(브라우저)마다 세기** [확정] (세 관점 검토 #22 승인 2026-10-16; 사용자: "아이피로만 하면 같은 공인아이피의 다른 상대가 피해가 갈 것 같은데 각각 클라이언트를 보호할 방법은?"): 계획·잠금을 사람(브라우저)마다 세고, 공인 IP는 울타리로만 씀. 그 "사람"을 가리키는 것이 **브라우저 번호**다.
  - **번호는 서버가 줌** [확정] (검토 #27, 사용자: "이걸로 해줘", 2026-10-16): 웹이 번호를 만들지 않음. 서버가 `SecureRandom` 16바이트(base64url [안])를 만들어 장부에 적고 쿠키로 줌. 처음 안의 "웹이 탭마다 만드는 열쇠"(#22)와 "서명(HMAC)"(#27 처음 안)은 쓰지 않음
  - **브라우저 번호 장부** [확정] (검토 #32, 사용자: "브라우저 번호랑 아이피랑 합쳐서 서버에서 관리하면 되겠다", 2026-10-16): 서버 메모리(Caffeine, 이름 `LookupClientLedger` [안])에 번호 → 받은 공인 IP(/64)·받은 시각·열린 계획 수·계획 무게 합·최근 실패 수(+ 잠긴 때까지). **서명 없음**: 장부에 없는 번호는 서버가 준 적 없는 번호라 거절. **요청마다 "장부에 있나 + 받은 IP = 지금 IP"**를 봄. 상한 5만 줄(약 5MB [안: 어림, 줄 하나 약 100B]), 받은 지 1일 지나면 지움 — 값은 설정 [확정] (#32). 계획 요청인데 번호가 없거나 장부에 없거나 IP가 다르면 새 번호를 장부에 적고 쿠키로 줌(그 IP의 "새 번호 1분 30개" 울타리에 셈). 올리기·닫기에서 번호가 없거나 장부에 없으면 400 `invalid_client_key`, IP가 다르면 400 `client_ip_changed`(코드 이름 [안]) → 웹이 남은 도서관만 조용히 다시 계획(새 번호를 받음), 잠금에 세지 않음 [확정] (#32). 서버를 다시 켜면 장부가 비고 → 다음 계획 요청에서 새 번호가 자동으로 나감 [확정] (#32). 장부가 5만 줄로 찼을 때 새 번호를 어떻게 할지 [안]: 보관함 전체가 찬 경우(#8)와 같이 새 계획 503 → 그 검색만 서버 모드 (한 곳 탓이 아니라 사람이 많은 경우) — 사용자에게 아직 묻지 않음
  - **쿠키로 줌, 자바스크립트는 못 봄** [확정] (검토 #33, 사용자: "브라우저 번호 이거 xss로 뭐 오염되지 않도록 조심해야 해", 2026-10-16): `Set-Cookie`에 `HttpOnly`·`Secure`·`SameSite=Strict`, `Path`는 계획·올리기 경로만(`/api/v1/lookup-plans`와 세 `…/plans` 경로), 수명 1일(`Max-Age` 86400, 설정). 근거: MDN Set-Cookie — `HttpOnly`는 자바스크립트가 쿠키에 접근하지 못하게 해 XSS 피해를 줄이고, `SameSite=Strict`는 같은 사이트에서 시작한 요청에만 쿠키를 보냄 (https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie , 2026-10-16 확인) [확정]. 쿠키 이름 [안] (예: `lookup_client`). 쿠키 하나에는 `Path`가 하나라 같은 이름·값을 경로 앞부분마다 따로 줌(`/api/v1/lookup-plans`, `/api/v1/ebook-searches/plans`, `/api/v1/book-availabilities/plans`, `/api/v1/availability/libraries` — 마지막은 가운데에 `{libraryId}`가 있어 앞부분까지만) [안]. 머리글 `X-Lookup-Client`는 **없앰**(쿠키로 바뀜). CORS는 열지 않음(기본 거절) [확정] (#33). POST의 CSRF 머리(`X-XSRF-TOKEN`, 더블 서브밋 쿠키)는 그대로 — CSRF는 그것이, 번호 훔치기는 HttpOnly가 막음
  - **번호마다 셈** [확정] (검토 #22·#11): ① 계획에 만든 번호(`clientId`)를 함께 저장, 올리기·닫기·`replaces`는 같은 번호일 때만 ② 열린 계획 20(넘으면 그 번호의 가장 오래된 것만 지움) ③ ⑨ 잠금: 1분에 실패 30번(검토 #11의 세 가지) → 그 번호 10분 잠금
  - **공인 IP 울타리 셋** [확정] (검토 #31, 2026-10-16; 장부에서 그 IP에 준 번호들을 모아 셈): (1) 그 IP에 준 번호들의 계획 무게 합이 보관함의 20%(주소 25,000 중 5,000)를 넘음 (2) 한 IP에 새 번호가 1분에 30개를 넘음 (3) 그 IP의 잠긴 번호가 5개 이상 → 그 IP 10분 거절. **셋 다 그 IP의 새 계획 요청만 거절하고 화면은 「잠시 후 다시」, 서버 모드로 넘기지 않음**(넘기면 확장으로 덜어 낸 부담을 그 IP가 서버에 다시 지움). 다음 검색은 다시 확장 모드로 시도. 응답 429, 코드 이름 [안] (예: `lookup_ip_limited`, `detail`에 셋 중 어느 것인지). (3)에 걸린 동안은 그 IP의 올리기도 429. #22의 "공인 IP당 열린 계획 200"은 (1)로 바뀜. **보관함 전체가 찬 경우(#8)만 그대로 그 검색 한 번 서버 모드(503)** — 한 곳 탓이 아니라 여러 곳의 사람이 많은 경우. 숫자의 근거(계산)는 [`../../settings-index.md`](../../settings-index.md) 6절. 메모리: 장부 줄에 함께 둠 + IP별 합계 줄(무게 합·1분 새 번호 수·잠긴 번호 수·IP 잠금, 장부와 같은 상한 안 [안])
  - nginx는 번호를 모르고 IP 한도만(검토 #15)
- IP: 모든 IP 판정(장부의 받은 IP·같은 IP 검사(#32)·⑦ 계획 한도·IP 울타리 셋(#31)·IP 잠금)은 `UsageLog.capture(request).clientIp()`(= nginx `X-Real-IP` = Cloudflare `CF-Connecting-IP`, 사이클 17 R3-1)로 읽음. `getRemoteAddr()`는 nginx 컨테이너 주소라 쓰지 않음. IPv6는 앞 /64로 비교·셈 ◆

- **검색 결과 수 10** [확정] (세 관점 검토 #23 승인 2026-10-16, 명세 R15): `availability` 설정 `batch.row-limit` 20 → 10(서버·확장 모드), `catalog` `GET /api/v1/books` `pageSize` 기본 20 → 10(최대 20 그대로; 지금 한 상수 `MAX_PAGE_SIZE`가 기본값·최대를 함께 맡아 기본값을 설정 속성으로 분리하는 작은 변경). 값을 정하는 곳 [확정] 검토 #30 승인 2026-10-16 (제안: 서버 설정 속성 하나, 웹은 `pageSize`를 보내지 않음). `batch.row-limit`이 책 화면 대출 상태 조회에도 걸리는 것은 [확정] 검토 #26 (책 화면은 줄 상한 없이 보이는 10권 모두)

- **운영 숫자는 변수로 한 곳에서** [확정] (세 관점 검토 #25 승인 2026-10-16; 사용자: "이런 개수 말이야 변수로 통합적으로 관리 가능하도록"): 이 사이클이 더하거나 바꾸는 숫자(동시 해석·계획 보관함·확장 캐시·잠금·결과 10 등)는 모두 설정 속성으로 두고 운영은 `prod.env`의 "대출 조회 숫자" 묶음에서 Spring 환경 변수로 덮어씀(이름 규칙·목록 `../../settings-index.md` 8절). nginx와 함께 쓰는 값만 `LOOKUP_*`, 화면 `VITE_*`, 확장 `extension/config.js`. dev 설정값 목록(#17)에 환경 변수 칸. 사이클 17 `prod.env` 견본은 `../17-first-deploy/from-cycle-20-prod-env-numbers.md`

- **상태 불이 읽는 나가는 길 값** [확정] 검토 #28 승인 2026-10-16: R1 덧붙임(#21)·덧붙임 2(#24)를 판정하려면 `LookupStatusService`가 사이클 22의 "업체(Webshare) 길 멈춤" 여부와 사이클 17/22의 나가는 길 설정(`모두`/`프록시만`/`직접만`, ADR-0130)을 읽어야 한다. 이 값은 사이클 17/22의 나가는 길 코드가 주는 **읽기 전용 포트(인터페이스)** 하나로 읽음(예: `vendorLanesPaused()`·`egressMode()`, 이름 [안]). 상태 응답에 `reason`(`NONE` \| `VENDOR_PAUSED` \| `NO_LANE`)을 더해 화면이 둘째 줄을 고름: 업체 길이 멈췄으면 단계 최소 `YELLOW` + `VENDOR_PAUSED`, `프록시만`이고 업체 길이 모두 멈췄으면 `RED` + `NO_LANE`(빨강 우선). 포트가 없으면(17/22 코드가 아직 없음) `reason`은 늘 `NONE`이고 R1 기본 규칙만 씀

- **책 화면 대출 상태 조회는 줄 상한 없이 보이는 10권 모두** [확정] (사용자: "책 기준 검색 말이야 이거 5개 고대로 안 가져가고 그냥 한 번에 보여지는 10개대로 하는 게 맞지 않아?", 세 관점 검토 #26 승인 2026-10-16): `BatchRunner.startHoldings`(dev 201~223행)의 `HoldingSession`에 `row-limit`을 넘기지 않음(또는 "제한 없음") — 바로 검색(`start`)만 `row-limit` 10. 동시 5곳·8초 마감·마감 3초 전 새 출발 멈춤은 그대로. 마감 때 남은 holding은 지금처럼 `notSent`로 돌려주고, 웹은 남은 것이 있으면 `…/book-availabilities/batches/stream`을 바로 다시 부름(사용자 조작 없이, 10권 범위 안에서만). 확장 모드 계획(`/api/v1/book-availabilities/plans`)도 같은 규칙

## 데이터

- 스키마: `usagelog` (새 표 없음, `availability`는 메모리만)

```mermaid
erDiagram
  LIBRARY_RESPONSE_DAILY {
    date day PK
    bigint library_id PK
    text source PK "direct_search | holding_fill | extension | server_for_extension (CHECK 다시 걺)"
    integer ok_count
    integer failed_count
    integer timeout_count
    integer skipped_count
    integer cached_count "사이클 19가 더함, 확장 모드는 0"
    bigint ok_ms_total
    integer ok_ms_max
  }
```

| 테이블.컬럼 | 타입 | 제약 | 설명 | 상태 태그 |
|---|---|---|---|---|
| `usagelog.library_response_daily.source` | `text` (기존) | CHECK `library_response_daily_source_check`(dev `usagelog/001-usagelog-schema.yaml` 215~216행, 2026-10-16 읽음)를 지우고 `IN ('direct_search','holding_fill','extension','server_for_extension')`로 같은 이름으로 다시 검 | 확장 모드의 도서관 응답(검색·소장·더 보기 모두)은 `extension`, 확장 모드 중 서버 대행 목록 도서관을 서버가 부른 것은 `server_for_extension` | `extension` [확정] (설계 #9) / `server_for_extension` 기록 [확정] (검토 #16), 값 이름 [안] |
| `usagelog.rejected_event.reason` (기존 표·컬럼) | `text` (기존) | CHECK `rejected_event_reason_check`(dev 같은 파일 247~248행: `unknown_library`, `invalid_place`, `invalid_screen`, `invalid_book_id`, `malformed`, `unknown_type`, `invalid_value`, 2026-10-16 읽음)를 지우고 같은 이름으로 그 7개 + `invalid_plan`·`invalid_client_key`로 다시 검 | `invalid_plan`·`invalid_client_key` 줄은 IP·이유마다 1분 1줄 [안], `raw_values`에 본문 없음(planId·itemId·이유만) ◆ | 구조 [안] (검토 반영 ◆) / `invalid_plan` 이름 [확정] (설계 결정 #6 이름 표) / `invalid_client_key` 이름 [안] |
| (메모리) `SearchPlan`·`PlanItem` | Caffeine | `SearchPlan`에 `planId`·`clientId`(서버가 준 브라우저 번호, 검토 #27·#32 [확정]) 함께 저장(만든 IP는 장부에 있어 계획에 따로 두지 않음), 쓴 뒤 10분 만료, 무게(주소 수) 25,000(약 10MB), 브라우저 번호당 열린 계획 20(넘으면 그 번호의 가장 오래된 것만 지움) [확정] (검토 #22), 공인 IP 울타리 셋(무게 20% = 5,000 등, 걸리면 429 「잠시 후 다시」) [확정] (검토 #31), 보관함 전체가 차면 다른 사람 계획을 밀어내지 않고 새 계획 요청 503 → 화면은 그 한 번의 검색을 서버 모드로, 닫힌 계획(close·replaces)은 바로 지움 [확정] (검토 #8 승인 2026-10-16), 받은 본문은 보관 안 함 ◆ | 계획 번호 `SecureRandom` 16바이트 base64url [안] ◆. 계획 하나 = item당 약 400B(도서관 200곳이면 약 80KB) | [확정] (명세 #11) / 상한 [확정] (검토 #8) |
| (메모리) 캐시 값 `FetchedPage` | 기존 | + `via` (`server`\|`extension`), `storedAt`. 해석 값만(원본 바이트 없음) ◆ | 확장 출처 칸을 비우는 방법은 서비스 재시작 | [확정] (설계 결정 #4) / 확장 칸 분리(따로 둔 캐시 500칸, 서버 모드는 서버 칸 → 확장 칸 차례로 봄)·만료(처음 넣은 시각 + 3분 고정, 값마다 만료 시각) [확정] (검토 #9·#10 승인 2026-10-16) |
| (메모리) 브라우저 번호 장부 `LookupClientLedger` (이름 [안]) | Caffeine | 번호(`SecureRandom` 16바이트) → 받은 공인 IP(/64)·받은 시각·열린 계획 수·계획 무게 합·최근 실패 수(1분)·잠긴 때까지(10분). 상한 5만 줄, 받은 지 1일 지나면 지움, 값은 설정. 서명 없음 — 장부에 없는 번호는 거절 | 번호는 HttpOnly 쿠키로만 오감(#33). 서버 재시작 = 장부 비움 → 새 번호 자동. 줄 하나 약 100B → 5만 줄 약 5MB | 장부·같은 IP·재시작 [확정] (검토 #32) / 5만 줄·1일 [확정] (#32) / 약 5MB [안: 어림] / 번호마다 세기 [확정] (검토 #22) / 1분 30번·10분 [확정] (검토 #11) |
| (메모리) 공인 IP별 합계 | Caffeine | IP(/64) → 그 IP 번호들의 계획 무게 합·1분 새 번호 수·잠긴 번호 수·IP 거절 때까지(10분). 장부와 같은 상한 안 [안] | 울타리 셋(#31) | 울타리 값 [확정] (검토 #31) / 구조 [안] |

- Liquibase: `usagelog/004-library-response-source-extension.yaml` 새 changeset(기존 changeset 수정 없음). 이 changeset 하나에서 CHECK 두 개를 같은 이름으로 다시 검: ① `library_response_daily_source_check`에 `extension`·`server_for_extension` ② `rejected_event_reason_check`에 `invalid_plan`·`invalid_client_key`(지금 7개 값은 그대로). 번호: 19 = `002`, 21 = `003`, 20 = `004` [확정] (사이클 21 설계 검토 #4, 사용자 승인 2026-10-16; 이름 [확정] 설계 결정 #6). 나중에 main에 합치는 쪽이 include를 master 맨 끝으로
- 확장 모드의 사용 기록 [확정] (설계 결정 #5·#9, 2026-10-16): 확장 모드는 서버 캐시를 보지 않으므로 캐시 답(`CACHED`) 없음. 해석됨 `SUCCESS`, 해석 실패·status≠200·TIMEOUT·ERROR `FAILURE`, 보내지 못한 것 `SKIPPED`(close의 `notSent`), 출처는 `extension`(서버 대행 목록 도서관만 `server_for_extension`, 검토 #16)
- **확장이 못 여는 도서관은 그 도서관만 서버가 대신** [확정] (세 관점 검토 #16 승인 2026-10-16, 조건부): 인계 전 프로토타입(아래 확인 필요 표)에서 확장이 `http://` 도서관(전주 등)·중간 인증서 빠진 도서관·리다이렉트하는 도서관을 열지 못하면, 그 도서관들을 설정 목록(`chaekcheck.availability.extension.server-fetched-libraries`, 이름 [안])에 넣는다. 계획을 만들 때 목록에 있는 도서관은 확장 주소에서 빼고 서버가 직접 불러(그때만 서버 자리 1개) 같은 응답에 함께 돌려준다. 그 도서관들에 쓸 서버 자리가 모두 찼을 때 [확정] (검토 #29 승인 2026-10-16: 그 도서관만 「확인하지 못한 도서관」, 나머지는 확장으로 계속). 모두 열리면 목록은 비우고 이 규칙은 쓰지 않는다. 명세 "서버가 대신 다시 불러 주기(실패한 도서관 되살리기) 하지 않음"(명세 결정 #10)과는 다름 — 이것은 처음부터 정해 둔 도서관만
- **서버가 대신한 것은 모두 기록** [확정] (사용자: "근데 이것들도 다 기록해야해", 검토 #16, 2026-10-16): ① 사용 기록(usagelog)의 출처를 `extension`이 아니라 `server_for_extension`으로 남김 → 확장 모드 검색 중 서버가 대신 부른 횟수·결과를 도서관별로 셈(`usagelog/004` changeset에서 출처 CHECK 값에 더함, 값 이름 [안]) ② 켤 때 서버 로그 한 줄에 목록 전체(도서관 번호·이름·이유: http/인증서/리다이렉트) ③ 목록과 넣은 이유·날짜는 dev `docs/maintenance/settings-index.md`와 plan [`docs/settings-index.md`](../../settings-index.md)에 한 줄씩. 목록을 바꿀 때 세 곳을 함께 고침

## API

| 메서드 | 경로 | 설명 | 요청 | 응답 | 에러 |
|---|---|---|---|---|---|
| GET | `/api/v1/lookup-status` | 상태 신호 값. 도서관을 부르지 않음. nginx 일반 구역. 서버 1초 메모 | 없음 | 200 `{slots, inUse, level, reason, queuedLibraryIds[≤200], serverTime}` (`reason` = `NONE`\|`VENDOR_PAUSED`\|`NO_LANE` [확정] 검토 #28 승인 2026-10-16), `Cache-Control: no-cache` | — |
| POST | `/api/v1/ebook-searches/plans` | 확장 모드 검색 묶음 계획(자리 안 잡음 — 예외: 서버 대행 목록이 비어 있지 않고 이 묶음에 그 도서관이 있을 때만 서버 자리 1개, 검토 #16). 첫 묶음은 지금 `ebook-searches/stream`과 같은 조건, 다음 묶음은 `batchNo`·`candidates` 추가. **캐시를 보지 않고 모든 도서관 주소를 줌** [확정] (설계 결정 #9) | 브라우저 번호 쿠키(있으면 브라우저가 붙임, 없거나 장부에 없거나 IP가 다르면 서버가 새 번호를 줌, 검토 #32·#33) + JSON `{title\|author\|publisher, residenceRegionIds, workRegionIds, filter, scope, visit, libraryIds, batchNo?, candidates?, replaces?[planId]}` (replaces: 새 검색 첫 묶음이 앞 계획 번호를 보내면 같은 사람이 만든 것만 지움, 같은 검색의 다음 묶음은 안 지움, 화면을 떠날 때 마지막 계획도 닫음, 지워진 계획으로 늦게 온 응답은 화면이 버리고 잠금에 안 셈 [확정] 검토 #18 승인 2026-10-16; "같은 사람" = 같은 브라우저 번호 [확정] 검토 #22·#32) | 201 `{planId, batchNo, deadlineMs:8000, rowLimit:10, targets?(첫 묶음), items[{itemId, libraryId, page, url}], events?[서버 대행 도서관 결과]}` + 새 번호를 줄 때만 `Set-Cookie`(HttpOnly·Secure·SameSite=Strict·계획·올리기 경로·`Max-Age` 1일, 이름 [안]). 응답 본문에는 번호를 싣지 않음 | 400 검증(지금과 같음), 403 `csrf_invalid` ◆, 429(nginx 계획 구역, 또는 공인 IP 울타리 셋 — 코드 이름 [안] 예: `lookup_ip_limited` → 화면 「잠시 후 다시」, 서버 모드 안 함, 검토 #31), 503(계획 보관함 전체 가득 → 화면은 그 검색을 서버 모드로, 검토 #8) |
| POST | `/api/v1/book-availabilities/plans` | 책 화면(소장) 계획. items는 상세 주소. S14 사서추천 창은 `holdingLimit=3`(이름 [안], 3 = 지금 S14의 3곳)을 함께 보냄 ◆ | 번호 쿠키(같은 규칙) + `{bookIds, …, holdingLimit?, batchNo?, candidates?(holdingId), replaces?}` | 같은 모양(이벤트는 `holding-*`) | 같음 |
| POST | `/api/v1/availability/libraries/{libraryId}/ebooks/plans` [확정] (이름, 설계 결정 #6) | 「더 보기」 계획(설계 #7). nginx 자리 [확정] 검토 #13 | 번호 쿠키(같은 규칙) + `{title\|…, page}` | `{planId, items[1]}` | 같음 |
| POST | `/api/v1/lookup-plans/{planId}/items/{itemId}` | 받아온 원본 올리기 | 번호 쿠키(장부에 있고 받은 IP = 지금 IP, 계획을 만든 번호와 같아야 함); 본문 `application/octet-stream`(원본 그대로, `Content-Encoding` 있으면 거절); 쿼리 `status`, `ms`, `outcome=RESPONDED\|TIMEOUT\|ERROR`, `contentType`. URL은 받지 않음 | 200 `{events[library-result\|library-failed\|row-verdict\|holding-*], detailItems[{itemId, libraryId, url, kind:DETAIL}], stop}` — **해석 실패·status≠200·outcome TIMEOUT/ERROR도 200 `library-failed`**(캐시 안 넣음) ◆ | 400 `invalid_plan`(계획 없음·만료·지워짐·쪽 번호 없음·이미 받음·계획을 만든 번호와 다름·Origin 다름만) ◆, 400 `invalid_client_key`(번호 쿠키 없음·장부에 없음, 이름 [안]), 400 `client_ip_changed`(받은 IP와 지금 IP 다름, 이름 [안], 잠금에 안 셈 → 화면이 남은 도서관만 다시 계획, 검토 #32), 403 `csrf_invalid`, 413 `payload_too_large`, 415(Content-Encoding), 429, 503 `server_busy`(동시 해석 자리 없음, 2초 기다린 뒤 → 그 도서관만 「확인하지 못한 도서관」 [확정] 검토 #7) |
| POST | `/api/v1/lookup-plans/{planId}/close` | 묶음 끝·화면 떠남 | 번호 쿠키(같은 번호·같은 IP) + `{notSent:[itemId]}` | 200 `{events:[batch-done]}` (usagelog SKIPPED·recordSearch는 여기서) | 400 `invalid_plan`, 400 `invalid_client_key`, 400 `client_ip_changed`, 403 `csrf_invalid` |

- **확장 모드는 서버 캐시를 읽지 않고 넣기만 함** [확정] (설계 결정 #9): 넣는 규칙 = 빈 칸이면 넣음, 서버 출처 값·진행 중인 서버 로드는 덮지 않음 ◆, 확장 값은 따로 둔 캐시(500칸)에 넣고, 다시 넣으면 값만 바꾸고 만료는 처음 넣은 시각 + 3분 그대로 [확정] (검토 #9·#10 승인 2026-10-16; 이유: 서버 칸 밀림 방지보다 "믿을 수 없는 값을 서버가 받은 값과 섞지 않기" — 근거 PortSwigger web cache poisoning, Chrome HTTP cache partitioning, 2026-10-16 확인)
- **CSRF** ◆: 세 POST는 로그인 기능이 켜지면 `csrf.spa()`가 `X-XSRF-TOKEN`을 요구함(dev `SecurityConfiguration.java:75`, Spring 문서 https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html 확인 2026-10-16). 웹은 `usageEvents.ts`와 같은 방식(쿠키 없으면 `/api/v1/auth/csrf-token`, `csrf_invalid`면 한 번 다시)
- **올리기 검사 순서** ◆ (본문을 읽기 전에 거절): ⑥ `Origin`(없으면 `Referer`)을 설정의 허용 origin과 대조(요청 Host가 아니라; 둘 다 없으면 거절) → 브라우저 번호 쿠키가 장부에 있음(없음·모름 → 400 `invalid_client_key`) → 장부의 받은 IP(/64) = 지금 IP(다름 → 400 `client_ip_changed`, 잠금에 안 셈) [확정] (검토 #32; #27의 "계획을 만든 IP와 같음" 검사는 이것으로 바뀜) → ⑨ 번호 잠금·IP 잠금(→ 429) → ①⑤ 계획 있음·쪽 번호·처음 받음·계획을 만든 번호와 같음 → ② `Content-Length` ≤ 상한·`Content-Encoding` 없음 → 동시 해석 자리(4, 최대 2초 기다림 → 503) [확정] (검토 #7) → 여기서 본문을 상한까지만 읽는 스트림으로 읽음(`@RequestBody byte[]` 아님; dev에서 nginx 없이 돌 때도 지킴) → ② `status` 200 → ③ adapter 해석(⑩ adapter는 계획 URL 호스트로만) → ⑪ `detailUrl`·`detailItems` 같은 호스트 검사 → ④ 캐시 넣기 규칙
- ⑦ 계획 만들기 한도는 nginx 계획 구역 공인 IP당 1분 300·몰아서 100 [확정] (검토 #15), ⑨ 잠금에 세는 것 = 모르는 계획 번호·같은 쪽 두 번·Origin 다름만(계획 만료·지워짐·번호 다름·IP 바뀜은 400만, 세지 않음) [확정] (검토 #11 승인 2026-10-16; 세는 단위 = 브라우저 번호, 검토 #22·#32). 서버 안의 공인 IP 울타리 셋(무게 20%·새 번호 1분 30·잠긴 번호 5 → 10분)은 계획 요청에서 장부로 셈 [확정] (검토 #31)
- 이벤트 이름·데이터는 지금 SSE(`docs/current/api.md` 스트림 절)와 같음. `done`은 상세 단계가 끝나거나 30초가 지나면 화면이 만듦 [확정] (architect 2-3)
- 요청/응답 예시

```json
// GET /api/v1/lookup-status → 200
{"slots":20,"inUse":12,"level":"YELLOW","reason":"NONE","queuedLibraryIds":[1215,3301],"serverTime":"2026-10-20T03:00:00Z"}

// POST /api/v1/ebook-searches/plans → 201
{"planId":"Qm9v…","batchNo":1,"deadlineMs":8000,"rowLimit":10,
 "targets":{"libraries":[…]},
 "items":[{"itemId":1,"libraryId":1215,"page":1,"url":"https://…/searchList.ink?schTxt=…"}]}

// POST /api/v1/lookup-plans/Qm9v…/items/1?status=200&ms=812&outcome=RESPONDED&contentType=text%2Fhtml%3Bcharset%3DEUC-KR → 200
{"events":[{"event":"library-result","data":{…}},{"event":"row-verdict","data":{…}}],
 "detailItems":[{"itemId":7,"libraryId":1215,"url":"https://…/detail?…","kind":"DETAIL"}],"stop":false}

// 도서관이 바뀐 화면을 줘서 해석 실패 → 200
{"events":[{"event":"library-failed","data":{"libraryId":1215,"page":1,"problem":{"code":"parse_failed"}}}],"detailItems":[],"stop":false}

// 400 (계획 문제만)
{"type":"about:blank","title":"Bad Request","status":400,"code":"invalid_plan","detail":"plan expired or item already received"}

// 400 (브라우저 번호 쿠키 없음·장부에 없음, 코드 이름 [안])
{"type":"about:blank","title":"Bad Request","status":400,"code":"invalid_client_key","detail":"lookup client cookie missing or unknown"}

// 400 (받은 IP와 지금 IP가 다름 → 화면이 남은 도서관만 다시 계획, 코드 이름 [안])
{"type":"about:blank","title":"Bad Request","status":400,"code":"client_ip_changed","detail":"client IP differs from the IP the lookup client was issued to"}

// 429 (공인 IP 울타리 셋 중 하나 → 화면 「잠시 후 다시」, 코드 이름 [안])
{"type":"about:blank","title":"Too Many Requests","status":429,"code":"lookup_ip_limited","detail":"plan weight share exceeded"}

// 201 계획 응답에서 새 번호를 줄 때 (경로마다 한 줄, 쿠키 이름 [안])
Set-Cookie: lookup_client=…; Path=/api/v1/lookup-plans; Max-Age=86400; HttpOnly; Secure; SameSite=Strict
```

## 외부 연동

| 대상 | 방식 | 제한·키 관리 | 실패 시 동작 | 상태 태그 |
|---|---|---|---|---|
| 도서관 사이트 (확장 모드) | 확장 service worker `fetch()` GET, `host_permissions` http·https 전체, `credentials:'omit'`, `redirect:'manual'`(돌아오는 `opaqueredirect`·status 0은 `ERROR`) ◆, User-Agent는 브라우저 것 | 전역 호스트 큐(모든 탭·port 공유) 호스트마다 동시 1건·앞 요청 끝 +1초 [확정] (범위 #7) ◆, 동시 5, 응답 머리 10초, 본문은 `body.getReader()`로 세며 읽다가 상한 넘으면 abort(gzip 폭탄 방지) ◆, 묶음 마감에 맞춰 abort | `outcome=TIMEOUT\|ERROR`로 올림 → 그 줄 "확인하지 못한 도서관", 서버가 다시 부르지 않음 | [확정] (명세 #7·#10, 설계 #8) / 검토 반영 ◆ |
| 웹 ↔ 확장 | `externally_connectable.matches`: **운영 manifest는 `https://chaekcheck.com/*`만**, `http://localhost:5173/*`는 개발 manifest에만 ◆; 인사 `sendMessage(VITE_EXTENSION_ID, {type:'hello'})` → `{version}`; 조회 `connect(id)` port `{type:'fetch', items}` ↔ `{type:'page', itemId, status, contentType, base64, ms}`; 확장은 `sender.origin`을 허용 목록과 다시 대조 ◆ | 확장 ID는 manifest `key`로 고정. 메시지 64MiB 한도. items 한 메시지 100개·URL 2KB 상한 [안] ◆. 주소 거르기 ◆: http(s)·GET만, IP 리터럴·`localhost`·`.local`·사설·루프백·링크 로컬 거절, 기본 포트만(예외 목록: 전주 `:8095` 등) | 첫 검색은 인사 답을 최대 500ms [안] 기다림, 인사 결과는 앱 전체에 보관 ◆. port 끊김 → 인사 한 번 다시(MV3 service worker는 30초 쉬면 멈춤, https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle 확인 2026-10-16) ◆ → 인사 최대 3번(바로·1초·2초 뒤), 답이 오면 확장이 남은 items를 같은 계획으로 다시 요청(호스트 1건·1초, 묶음 마감 안), 셋 다 답 없으면 남은 것을 `notSent`로 닫아 「확인하지 못한 도서관」, 파란 불 지우고 다음 검색부터 서버 모드(상태 묻기 바로 1회). 서버는 대신 부르지 않음 [확정] (사용자: "한 번만 인사하고 포기하지 말고 몇 번 더 인사해서 살아나면 확장이 남은 도서관을 다시 요청하게 … 이렇게 해", 2026-10-16, 세 관점 검토 #4) | [확정] (이름, 설계 결정 #6) / 검토 반영 ◆ / 서명 호스트 목록 [안] 검토 #12 |
| nginx | 템플릿 `lookup-plans.conf.template`: `location /api/v1/lookup-plans/`에 `client_max_body_size ${LOOKUP_MAX_BODY_MB}m`, `limit_req zone=chaekcheck_lookup_uploads` `${LOOKUP_UPLOAD_RATE}`=20 r/s burst `${LOOKUP_UPLOAD_BURST}`=60 [확정] (설계 #12, 사용자: "이걸로 해줘", 2026-10-16), `limit_conn` IP당 `${LOOKUP_UPLOAD_CONN}`=4 [확정] (검토 #7), `${LOOKUP_MAX_BODY_MB}`=1 [확정] (검토 #7, 서버 모드도 같은 값), `proxy_request_buffering on`(느린 올리기가 Tomcat 스레드를 잡지 않음), `client_body_buffer_size 512k` [안], `client_body_timeout 10s` [안] ◆ (검토가 고친 값, 사용자가 따로 고르지 않음); 세 `…/plans` 경로는 정규식 location으로 계획 구역 `chaekcheck_lookup_plans`, 도서관 호출 구역보다 앞 [확정] (검토 #13 승인 2026-10-16), 값 = 공인 IP당 1분 300·몰아서 100(LOOKUP_PLAN_PER_MIN=300·LOOKUP_PLAN_BURST=100, 한 곳 대량만 막는 울타리, 사람별은 서버) [확정] (검토 #15 승인 2026-10-16). 413·429는 Problem Details JSON. 값은 `prod.env` → compose → Spring(`CHAEKCHECK_AVAILABILITY_MAXBODYSIZE=${LOOKUP_MAX_BODY_MB}MB` — 속성 `chaekcheck.availability.max-body-size`를 Spring 환경 변수 규칙(점 → `_`, `-` 뺌, 대문자)으로, https://docs.spring.io/spring-boot/reference/features/external-config.html 확인 2026-10-16 [확정])과 nginx 양쪽 | 공식 nginx 이미지 envsubst(`/etc/nginx/templates` → `conf.d`, https://hub.docker.com/_/nginx 확인 2026-10-16), 켤 때 한 번 채워 요청마다 비용 없음 | 413·429 JSON | [확정] (설계 #12, 결정 #2 "같은 변수 방식으로하고") / 검토 반영 ◆ |
| 사이클 17 막힌 길 기록·길마다 throttle | `HostQueueBoard`가 읽음 | 17 인계(`from-cycle-20-blocked-ip-resume.md`) | 17 없으면 길 하나·막힌 길 없음 | 전제 [확정] |

## 웹 (화면)

- 머리말: 사이클 21 메뉴 위에 점+글(`HeaderSignal`), 「로그인」 왼쪽, 폰은 점만·☰ 왼쪽·팝오버 설명. 상태: 빈 자리(첫 응답 전) / GREEN·YELLOW·RED / GRAY(마지막 성공에서 30초) / BLUE(확장 모드, 묻지 않음). 움직임 없음 (flow #1·#2·#4, ADR-0121). 폰 팝오버 둘째 줄은 색마다: 초록 「지금 바로 찾을 수 있어요」, 노랑 「찾는 사람이 늘고 있어요. 조금 느릴 수 있어요」, 빨강 「지금 찾는 사람이 많아 검색이 거절될 수 있어요」, 회색 「조회 상태를 받아오지 못했어요」, 파랑 「확장 프로그램이 도서관을 직접 조회해요」 [확정] (사용자 승인, 2026-10-16, 세 관점 검토 #6). 상태 응답의 `reason`이 `NONE`이 아니면 색 × 이유로 둘째 줄을 바꿈: 노랑 + `VENDOR_PAUSED` 「지금은 조회가 평소보다 느려요」 [확정] (검토 #21), 빨강 + `NO_LANE` 「지금은 도서관 조회를 할 수 없어요」 [확정] (검토 #24) (`reason` 필드 자체는 [확정] 검토 #28 승인 2026-10-16). **PC도 점·글을 누르면 같은 팝오버**(마우스 올림·title 툴팁 없음, 말풍선 부품 하나) [확정] (사용자: "PC도 누르면 말풍선", 세 관점 검토 #20, 2026-10-16)
- 접근성 ◆: 점 버튼 `aria-label="조회 상태: 원활"`(색마다), 글을 담은 `role="status"`(polite)는 단계가 **바뀔 때만** 글을 바꿈(같은 값이면 다시 읽지 않음), 점·글 색 대비 4.5:1 이상
- 결과 카드: 줄이 선 도서관 글(PC 이름 옆, 폰 이름 아래). **아직 조회 중인 줄과 「확인하지 못한 도서관」 줄에만** 붙이고 정상으로 받은 줄에는 붙이지 않음, 실패로 끝난 순간 붙어 있었으면 그 줄에서는 새 검색 전까지 유지, 확장 모드에서는 쓰지 않음, 직접 찾기는 도서관 줄에 [확정] (사용자 승인, 2026-10-16, 세 관점 검토 #5; 서버 쪽 60초 목록 규칙은 그대로). 빨강에도 카드 변화 없음. 네 번째 묶음 「확인하지 못한 도서관」: `failed` + `UNKNOWN`(설계 결정 #10), 계획 순서, 두 거름 모두; **묶음은 "지금 빌릴 수 있는 책만" 거름 대상에서 빼고, 빈 결과 문구는 묶음을 뺀 수로 세되 "N곳은 확인하지 못했어요"를 덧붙임** ◆; 묶음은 **모든 묶음의 확인 못 한 줄을 모아 목록 맨 아래, 「더 보기」 바로 위에 하나로** [확정] (사용자 승인, 2026-10-16, 세 관점 검토 #2). `gone` 줄(목록에서 빠짐)은 이 묶음에 넣지 않고 지금처럼 예약 묶음 맨 아래 「이 도서관 목록에서 빠졌어요」, 묶음 안 실패·모름 줄은 같은 글 [확정] (사용자 승인, 2026-10-16, 세 관점 검토 #3). **직접 찾기**에서 실패한 도서관은 도서관 하나를 한 줄(책 제목 없이 「○○도서관 · 대출 정보를 확인하지 못했어요」, 누르면 그 도서관 검색 페이지)로 이 묶음에 넣고, "없습니다" 문구는 실패를 뺀 곳만 센 뒤 "N곳은 확인하지 못했어요" [확정] (사용자 승인, 2026-10-16, 세 관점 검토 #1). 줄 글 「대출 정보를 확인하지 못했어요」(지금 「확인 실패」를 바꿈)
- S14 사서추천 창 ◆: 줄 글만 바뀜(묶음 제목 없음, 배지 없음, 지금처럼 실패 줄은 3줄 안에서 맨 뒤), 확장 모드에서는 `holdingLimit=3`을 계획 요청에 넘김
- 확장 모드: `features/extension/` — 감지(첫 검색은 인사 답까지 최대 500ms [안]) ◆, **브라우저 번호는 웹이 만들지도 읽지도 않음**: 서버가 HttpOnly 쿠키로 주고 브라우저가 계획·올리기·닫기에 알아서 붙임(같은 출처 `fetch`의 기본 `credentials: 'same-origin'`; 웹 코드에 번호 머리글 없음) [확정] (검토 #27·#32·#33). 올리기·닫기가 400 `client_ip_changed`(폰 회선이 바뀜) 또는 400 `invalid_client_key`(서버 재시작 등)면 오류 없이 **남은 도서관만 새 계획으로 다시 요청**(새 번호는 그 계획 응답 쿠키로 옴, 사용자 조작 없음) [확정] (#32); 다시 한 번 400이면 남은 줄은 「확인하지 못한 도서관」 [안]. port, 업로드(받은 base64는 바로 `Uint8Array`로 바꿔 올리고 reducer 상태에 두지 않음) ◆, 이벤트를 기존 reducer(`useSearch`·`useHoldings`)에 넣음. 「더 보기」도 계획 입구. **지금 계획 번호가 아닌 응답은 버림**(앞 검색의 늦은 응답) ◆. 묶음 도중 400 `invalid_plan`이면 남은 줄은 「확인하지 못한 도서관」으로 두고 close, 오류 화면 없음 ◆. 업로드 429면 남은 도서관을 `notSent`로 닫고 지금 429 안내 줄 ◆. 화면을 떠나면(`pagehide`) 마지막 계획을 `fetch(…, {keepalive:true})`로 close(번호 쿠키는 브라우저가 붙임) ◆. 계획 요청이 503이면(보관함 전체 가득) 그 한 번의 검색을 서버 모드로 [확정] (검토 #8). 계획 요청이 429면(공인 IP 울타리 셋 또는 nginx 계획 구역) 서버 모드로 넘기지 않고 지금 거절 안내 자리(호박색 줄, dev `features/search/blocked.ts`)에 「잠시 후 다시」 안내 — 문구 [안] (예: 「지금은 확장 조회가 많아요. 잠시 후 다시 해 주세요」), 다음 검색은 다시 확장 모드로 시도 [확정] (검토 #31). 같은 검색어 엔터를 1초 안에 다시 받으면 무시 [확정] (검토 #15 승인 2026-10-16)
- 설정: `VITE_EXTENSION_ID` [확정] (설계 결정 #6)

## 확장 꾸러미 (`extension/`)

- `manifest.json`: `manifest_version: 3`, `key`(ID 고정), `host_permissions: ["http://*/*","https://*/*"]`, `externally_connectable: {matches: ["https://chaekcheck.com/*"]}`(개발 manifest는 `http://localhost:5173/*` 더함) ◆, `background: {service_worker: "background.js", type: "module"}`, `version`
- `background.js`: `onMessageExternal` 인사 → `{version}`(`sender.origin` 대조) ◆; `onConnectExternal` port → items 검증(개수·길이·주소 거르기) ◆ → **service worker 전역 호스트 큐**(동시 1·+1초, 모든 port 공유) ◆와 전체 동시 5로 `fetch` → 스트림으로 읽어 상한에서 abort ◆ → base64 → `{itemId,status,contentType,base64,ms}`; status 0 = `ERROR` ◆
- `config.js`: 확장 상수 한 파일(동시 5, 1초, 머리 10초, 본문 상한, items 상한, 포트 예외 목록) — dev 설정값 목록 `docs/maintenance/settings-index.md`에 한 줄씩 [확정] (검토 #17 승인 2026-10-16)
- `throttle.js`·`url-filter.js` + `node --test` 시험. README: 개발자 모드 설치 방법, `key` 얻는 방법(https://developer.chrome.com/docs/extensions/reference/manifest/key)
- dev `CLAUDE.md` 한 줄 추가(인계서): "`extension/` — 크롬 확장(MV3), Spring 앱 아님, Gradle 없음, 압축 해제 확장으로 로드"

## 결정 기록

- [ADR-0118](../../adr/0118-lookup-status-polling-and-host-queue-board.md) 상태 신호 10초 묻기·`HostQueueBoard`·`/api/v1/lookup-status`
- [ADR-0119](../../adr/0119-extension-as-user-side-fetcher-server-parses-and-checks.md) 확장은 사용자 쪽 조회 서버, 화면이 올림, 서버 `accept` 해석·검사·보안, 상한 설정 하나, 확장 모드는 캐시를 읽지 않음
- [ADR-0120](../../adr/0120-extension-folder-no-build-chrome-first-dev-mode.md) `extension/` 빌드 없음·크롬만·개발자 모드
- [ADR-0121](../../adr/0121-same-header-on-every-screen.md) 머리말 모든 화면 같게
- [ADR-0131](../../adr/0131-stop-launching-when-user-leaves.md) 화면을 떠나면 서버 모드 묶음은 새 도서관을 띄우지 않음(검토 #14)
- 막힌 IP 풀림 규칙은 사이클 17 인계([`../17-first-deploy/from-cycle-20-blocked-ip-resume.md`](../17-first-deploy/from-cycle-20-blocked-ip-resume.md), 상한 1주일)

## 확인 필요

| 항목 | 왜 필요한가 | 확인 방법 | 막는 단계 |
|---|---|---|---|
| 확장 service worker에서 `http://` 도서관(전주)·중간 인증서 빠진 도서관·리다이렉트하는 도서관이 열리는지, 받은 바이트(EUC-KR)가 adapter로 해석되는지 | AC-9·AC-10 | dev 프로토타입(사이트 3곳+, 1초 간격) | 인계 |
| 전체 도서관 호스트 CORS 일괄 확인 | 설치 없는 직접 조회 불가 확정 | dev 호출 시험 1초 간격 | 없음(참고) |
| nginx를 거친 SSE에서 클라이언트가 끊겼을 때 Spring이 send 실패·onError로 알아채는 시점 | 떠난 묶음 멈추기 | dev 시험 | 인계 |
| 운영 2GB에서 JVM 전체 메모리 (배포 뒤) | 동시 해석·계획 보관함·확장 캐시 상한의 여유 확인. 해석 하나는 2026-10-16 실측(1MB 쪽 7.4MB·6ms, [`../../settings-index.md`](../../settings-index.md) 6절) | 사이클 17 배포 뒤 측정 | 없음(배포 뒤) |
| dev 시험: 환경 변수로 값이 실제로 바뀌는지 (`CHAEKCHECK_AVAILABILITY_MAXBODYSIZE` 등) | #25 변수 관리 | dev에서 환경 변수를 주고 켜서 값 확인 | 인계 |
| 확장 service worker 요청에 크롬 Private Network Access가 적용되는지 | 주소 거르기의 보조 | 공식 문서(확인 못 함, 2026-10-16) — 거르기는 확장 코드로 하므로 막지 않음 | 없음(참고) |
| Tomcat이 요청 `Content-Encoding`을 푸는지 | 압축 본문 거절 | 공식 문서·시험(확인 못 함) — 헤더가 있으면 415로 거절하므로 막지 않음 | 없음(참고) |
| `HostQueueBoard`가 호스트→도서관을 배우는 한계(재시작 뒤 포털 소속 도서관) | R4 | dev 확인 | 없음(참고) |
| 사이클 17 `prod.conf`에 템플릿 조각을 넣는 방법(17이 템플릿을 쓰는지) | nginx | 17 인계서 확인 | 인계 |
| 처리방침에 "확장 모드에서 도서관 페이지 원본을 받아 해석, 올린 IP를 거절 기록에 30일"을 더할지 | 개인정보 | 사이클 16 처리방침과 대조 — backlog 후보 | 없음(공개 전 확인) |
| 처리방침의 쿠키 설명에 브라우저 번호 쿠키 한 줄(무작위 번호, 받은 공인 IP와 함께 서버 메모리에 1일, 확장 모드 계획·올리기에만) | 개인정보 (검토 #33) | 사이클 16 처리방침 문구와 맞춤 — 사용자에게 문구 확인 | 없음(공개 전 확인) |
| 쿠키 하나에 `Path`가 하나라 같은 이름 쿠키를 경로 앞부분 4개로 나눠 줄 때 크롬이 네 경로 모두에 붙이고 서로 덮지 않는지 | 번호 쿠키 경로 제한 (검토 #33) | dev 프로토타입(크롬 개발자 도구 Application·Network 탭) | 인계 |
| 장부 5만 줄이 찼을 때 새 번호 처리(안: 보관함 전체가 찬 것과 같이 503 → 그 검색만 서버 모드) | 장부 상한 (검토 #32) | 사용자에게 질문 | 인계 |

## 사이클 22 나가는 길·알림과 맞춤 (2026-10-16)

공유 파일 [`../../research/deploy/multi-source-ip.md`](../../research/deploy/multi-source-ip.md) 6~9절(사이클 22 결정과 시드니 실측)과 겹치는 곳을 확인했다. 운영 = 시드니 EC2 + 나가는 길 21개(EC2 자기 IP 1 + Webshare 한국 정적 주거용 20, IP마다 동시 1건·1초) [확정] (사이클 22, 사용자 승인 2026-10-16).

| 사이클 22 결정·실측 | 이 사이클에 미치는 것 | 처리 |
|---|---|---|
| 시드니 → 한국 IP → 강동 전자도서관 약 1.7초, 교보 구독형 2.7초, 큰 홈페이지 3.5~5.0초 (9-4절 실측) | 묶음 마감 8초·호스트 대기 8초 안에 들어감. 검색 자리를 잡는 시간이 조금 길어져 노랑이 조금 더 자주 보일 수 있음 | 값 그대로, 배포 뒤 기록으로 조정 [안] |
| 집(한국) → 도서관 쪽 약 0.7초 | 확장 모드 = 0.7초 + 시드니로 올리기(어림 0.2~0.4초) → 도서관 한 곳마다 약 0.6~1초 빠름 | 올리기 시간 [확인 필요: 배포 뒤 `ms`·서버 기록으로 측정] |
| 길 21개 | `HostQueueBoard`는 이미 `(laneId, hostKey, libraryId)`별이라 그대로. 같은 도서관도 21건까지 함께 가 줄이 거의 안 섬 | 바꿀 것 없음 |
| 길 쉼 10분부터 두 배·7일 상한, 모든 길이 막힌 호스트 "확인 불가"(ADR-0094) | 이 사이클이 17에 넘긴 규칙(`../17-first-deploy/from-cycle-20-blocked-ip-resume.md`)과 같음. 막힌 길은 줄 선 도서관 계산에서 뺌(R4) | 바꿀 것 없음 |
| 업체 데이터 세기(우리가 센 양 vs Webshare 사용량 API) | 확장 모드 응답은 사용자 브라우저가 받아 와 프록시를 거치지 않음 → `accept` 경로는 길 데이터 세기에 넣지 않음 | 규칙 [안] (사이클 22 세기 구현과 맞춤, 인계 때 확인) |
| Webshare 업체 오류·데이터 90% → Webshare 길 20개 한꺼번에 멈춤 | 길이 1개로 줄어도 상태 불은 검색 자리만 봐서 초록일 수 있음 | [확정] 세 관점 검토 #21 승인 (2026-10-16): 멈춘 동안 최소 노랑, 둘째 줄 "지금은 조회가 평소보다 느려요"(상태 응답 `reason=VENDOR_PAUSED`, 필드·읽는 포트 [확정] 검토 #28 승인 2026-10-16) |
| 메일 알림 5가지(CloudWatch → SNS) | 이 사이클은 메일 보낼 일을 더하지 않음(올리기 거절·IP 잠금은 `rejected_event` 집계만) | 바꿀 것 없음 [안] |
| 나가는 길 설정 `모두`/`프록시만`/`직접만` (사이클 20 검토 #24에서 사용자 요청, 17·22에 넘김) | `프록시만`이고 Webshare 길이 모두 멈추면 서버 모드 길 0개 → 상태 불 빨강 "지금은 도서관 조회를 할 수 없어요"(`reason=NO_LANE`, [확정] 검토 #28 승인 2026-10-16), 확장 모드는 그대로 | [확정] (사용자 승인, 2026-10-16, 세 관점 검토 #24; 인계 `../17-first-deploy/from-cycle-20-proxy-only.md`) |
