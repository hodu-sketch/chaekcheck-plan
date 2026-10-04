# 설계 그림 모음: 사이클 06 내 도서관

- 작성: 2026-10-04. 사용자 요청: "클래스다이어그램, 시퀀스 다이어그램, 흐름도, erd 뭐든 다 자세히 알려줘. 예상되는 디자인 패턴도 따로 보여주면 좋아"
- 근거: `design-delta.md`(설계 기준), `spec.md`, `flow.md`, ADR-0048~0051. 이 문서는 그 내용을 그림으로 펼친 것이고 새 결정은 없습니다.
- **클래스·메서드 이름은 설계 수준의 예시 [안]입니다.** 실제 이름은 dev가 코드에 맞춰 정하고 plan에 알려 줍니다(`design-delta.md` 머리말, 사용자 승인). 공개 API·표·주소·결과 코드처럼 `design-delta.md`에서 [확정]인 것은 그대로 씁니다.
- 실제 클래스 그림은 구현 뒤 dev의 Spring Modulith `Documenter` 출력으로 다시 확인합니다.

## 1. 모듈 구성도 (누가 누구를 부르나)

```mermaid
flowchart TB
  web["web (React)<br/>S1 · S2 · S10 · S11"]
  subgraph main["본 서비스 (Spring Modulith)"]
    mylibrary["mylibrary (새)"]
    auth["auth"]
    library["library"]
    region["region"]
    catalog["catalog"]
    availability["availability"]
    registry[("modulith.event_publication")]
  end
  web -->|"/api/v1/me/regions<br/>/api/v1/me/libraries/**"| mylibrary
  web -->|"GET /api/v1/libraries"| library
  web -->|"GET /api/v1/books …&libraryIds"| catalog
  web -->|"SSE …stream …&libraryIds"| availability
  web -->|"GET /api/v1/regions/resolutions"| region
  web -->|"로그인·가입·로그아웃·탈퇴<br/>/api/v1/auth/** · /api/v1/me<br/>(사이클 05 그대로)"| auth
  mylibrary -->|"AccountId · AccountPresence"| auth
  mylibrary -->|"LibraryCatalog.findEnabledTarget"| library
  mylibrary -->|"RegionDirectory (저장 검증)"| region
  auth -->|"AccountDeleted 기록"| registry
  registry -.->|"AccountDeleted (커밋 뒤)"| mylibrary
  catalog --> library
  availability --> catalog
  availability --> library
  library --> region
```

- 화살표 방향 = 의존 방향. `mylibrary → auth, library, region`만 새로 생기고 순환은 없습니다. `catalog`·`availability`는 회원을 모릅니다(ADR-0037).
- 로그인·가입·로그아웃·탈퇴는 사이클 05 그대로 화면이 `auth`와 직접 주고받습니다. `mylibrary`는 로그인을 하지 않고, 로그인된 뒤 "지금 누구인지"(`AccountId`)를 `auth`에게서 받아 그 사람의 지역·도서관만 저장합니다.

## 2. 클래스 그림 (설계 수준, 이름은 예시)

### 2.1 `mylibrary` 모듈 안

```mermaid
classDiagram
  direction TB
  class MyLibraryController {
    +getRegions(AccountId) RegionsResponse
    +putRegions(AccountId, RegionsRequest) RegionsResponse
    +getLibraries(AccountId) LibrariesResponse
    +putLibrary(AccountId, libraryId) void
    +deleteLibrary(AccountId, libraryId) void
  }
  class MyLibraryService {
    +regions(AccountId) SavedRegions
    +replaceRegions(AccountId, SavedRegions) SavedRegions
    +libraryIds(AccountId) List~Long~
    +add(AccountId, libraryId) AddResult
    +remove(AccountId, libraryId) void
  }
  class AccountRegionStore {
    +find(accountId) List~AccountRegion~
    +replace(accountId, List~AccountRegion~) void
    +deleteAll(accountId) void
  }
  class AccountLibraryStore {
    +find(accountId) List~Long~
    +exists(accountId, libraryId) boolean
    +count(accountId) int
    +insertIfAbsent(accountId, libraryId) void
    +delete(accountId, libraryId) void
    +deleteAll(accountId) void
  }
  class AccountDeletedListener {
    +on(AccountDeleted) void
  }
  class MyLibraryErrors {
    +libraryNotFound() ProblemDetail
    +limitReached() ProblemDetail
  }
  class AccountRegion {
    accountId
    kind
    regionId
    position
  }
  class RegionKind {
    <<enumeration>>
    RESIDENCE
    WORK
  }
  MyLibraryController --> MyLibraryService
  MyLibraryService --> AccountRegionStore
  MyLibraryService --> AccountLibraryStore
  AccountDeletedListener --> AccountRegionStore
  AccountDeletedListener --> AccountLibraryStore
  AccountRegionStore ..> AccountRegion
  AccountRegion --> RegionKind
  MyLibraryController ..> MyLibraryErrors
```

- 저장소(`…Store`)는 사이클 05 `auth`처럼 `JdbcClient`로 SQL을 씁니다. JPA 엔티티는 없습니다.
- `MyLibraryService`의 모든 쓰기는 `@Transactional`이고, 처음에 `AccountPresence.lockIfExists`를 부릅니다(2.2).

### 2.2 다른 모듈과 맞닿는 공개 타입

```mermaid
classDiagram
  direction LR
  class AccountId {
    <<record, auth 공개>>
    value : long
  }
  class AccountDeleted {
    <<record, auth 공개 이벤트>>
    accountId : AccountId
  }
  class AccountPresence {
    <<interface, auth 공개 (새)>>
    +lockIfExists(AccountId) boolean
  }
  class AccountIdArgumentResolver {
    <<auth 내부 (새)>>
    +resolveArgument() AccountId
  }
  class LibraryCatalog {
    <<interface, library 공개>>
    +planSearch(residenceIds, workIds, PlanOptions) List~SearchTarget~
    +findEnabledTarget(id) Optional~SearchTarget~
    +eligibilityFor(residenceIds, workIds) List~LibraryEligibility~
  }
  class PlanOptions {
    <<record, library 공개 (변경)>>
    scope : Scope
    visit : Visit
    libraryIds : Set~Long~
  }
  class SearchTarget {
    <<record, library 공개 (변경)>>
    id
    priorityGroup
    eligibility
    visitRequired
    chosen : boolean
  }
  class LibraryEligibility {
    <<record, library 공개 (새)>>
    id
    name
    eligibility
    matchedBy : Set~RegionKind~
    visitRequired
    cautioned
    eligibilitySummary
  }
  class MyLibraryService
  MyLibraryService ..> AccountPresence : 쓰기 처음에 잠금
  MyLibraryService ..> LibraryCatalog : findEnabledTarget
  AccountIdArgumentResolver ..> AccountId : 만들어 줌
  AccountDeleted --> AccountId
  LibraryCatalog ..> PlanOptions
  LibraryCatalog ..> SearchTarget
  LibraryCatalog ..> LibraryEligibility
```

- `AccountIdArgumentResolver`는 `auth` 안에 있고 앱 전체에 등록됩니다. 그래서 `mylibrary` 컨트롤러는 JWT를 몰라도 `AccountId`를 인자로 받습니다.
- `catalog`의 `JoinTier`에 첫 값 `CHOSEN`이 더해지고, `availability`의 스트림 두 곳이 `libraryIds`를 받아 `PlanOptions`에 넣습니다.

## 3. 표 관계 (ERD)

```mermaid
erDiagram
  AUTH_ACCOUNT {
    bigint id PK
    timestamptz created_at
    timestamptz last_login_at
  }
  MYLIBRARY_ACCOUNT_REGION {
    bigint account_id PK "auth.account.id, FK 없음"
    text kind PK "RESIDENCE | WORK"
    bigint region_id PK "region ID, FK 없음"
    smallint position "0~19 고른 순서"
    timestamptz created_at
  }
  MYLIBRARY_ACCOUNT_LIBRARY {
    bigint account_id PK "auth.account.id, FK 없음"
    bigint library_id PK "library.library.id, FK 없음"
    timestamptz added_at "목록 순서"
  }
  REGION_REGION {
    bigint id PK
  }
  LIBRARY_LIBRARY {
    bigint id PK
    boolean enabled
  }
  AUTH_ACCOUNT ||..o{ MYLIBRARY_ACCOUNT_REGION : "번호만 (탈퇴 이벤트로 지움)"
  AUTH_ACCOUNT ||..o{ MYLIBRARY_ACCOUNT_LIBRARY : "번호만 (탈퇴 이벤트로 지움)"
  REGION_REGION ||..o{ MYLIBRARY_ACCOUNT_REGION : "번호만 (폐지돼도 남음)"
  LIBRARY_LIBRARY ||..o{ MYLIBRARY_ACCOUNT_LIBRARY : "번호만 (꺼져도 남음)"
```

- 점선 = 다른 모듈의 표를 번호로만 가리킴(외래 키 없음, ADR-0001). 모듈끼리 JOIN하지 않습니다.
- 한 계정: 거주 0~20줄, 직장 0~20줄, 직접 추가 0~20줄.

## 4. 시퀀스 그림

### 4.1 로그인 직후 읽기와 검색

```mermaid
sequenceDiagram
  autonumber
  participant W as web
  participant M as mylibrary
  participant R as region
  participant L as library
  participant S as 검색 API (catalog/availability)
  W->>M: GET /api/v1/me/regions
  W->>M: GET /api/v1/me/libraries
  M-->>W: 저장된 지역 ID, libraryIds
  W->>R: GET /api/v1/regions/resolutions?ids=…
  R-->>W: ACTIVE / REPLACED / SPLIT / UNKNOWN
  W->>W: 대체·제외 안내, 스위치 기본값 "내 도서관"
  alt 이미 검색이 돌고 있었음
    W->>S: 같은 검색을 내 도서관 기준으로 다시 (scope=joinable&libraryIds=…)
  else 아직 검색 전
    W->>W: 다음 검색부터 libraryIds를 붙임
  end
  S->>L: planSearch(residence, work, PlanOptions(scope, visit, libraryIds))
  L-->>S: 계획 (chosen 묶음이 맨 앞)
  S-->>W: 결과 (직접 추가 줄은 배지 대신 "직접 추가")
```

### 4.2 처음 로그인했을 때 지역 옮기기 (S11)

```mermaid
sequenceDiagram
  autonumber
  participant W as web
  participant B as 브라우저 저장소
  participant R as region
  participant M as mylibrary
  W->>M: GET /api/v1/me/regions
  M-->>W: 비어 있음
  W->>B: chaekcheck.regions.v1 읽기, regionImport.v1에 이 계정 있나
  alt 브라우저 지역 있음 + 이 계정 답한 적 없음
    W->>R: resolutions (브라우저 지역)
    R-->>W: 바뀐 지역·못 쓰는 지역
    W->>W: S11 창 (바뀐 지역은 새 이름으로 안내)
    alt 계정에 저장
      W->>M: PUT /api/v1/me/regions (해석한 지역)
      M-->>W: 200
      W->>B: regionImport.v1에 계정 번호 적음
    else 저장하지 않기
      W->>B: regionImport.v1에 계정 번호 적음
    else 답 없이 닫음·새로고침
      W->>W: 아무것도 적지 않음 (다음 로그인 때 다시)
    end
  else
    W->>W: 창 없음
  end
```

### 4.3 도서관 하나 추가 (S10, 누르면 바로 저장)

```mermaid
sequenceDiagram
  autonumber
  participant W as web (S10)
  participant C as MyLibraryController
  participant SV as MyLibraryService
  participant A as AccountPresence (auth)
  participant L as LibraryCatalog (library)
  participant DB as mylibrary 표
  W->>W: 화면에 먼저 추가해 보임
  W->>C: PUT /api/v1/me/libraries/{id} + X-XSRF-TOKEN
  C->>SV: add(accountId, id) [트랜잭션 시작]
  SV->>A: lockIfExists(accountId)
  alt 계정 없음
    SV-->>C: 거절
    C-->>W: 401 unauthorized → 로그인 전 상태
  else
    SV->>L: findEnabledTarget(id)
    alt 없음·꺼짐
      C-->>W: 404 library_not_found → 되돌림
    else
      SV->>DB: exists(account, id)?
      alt 이미 있음
        C-->>W: 204 (그대로)
      else
        SV->>DB: count(account)
        alt 20곳
          C-->>W: 409 library_limit_reached → 되돌림 "20곳까지예요"
        else
          SV->>DB: INSERT … ON CONFLICT DO NOTHING
          C-->>W: 204 [커밋]
        end
      end
    end
  end
```

### 4.4 지역 통째로 저장 (S2)

```mermaid
sequenceDiagram
  autonumber
  participant W as web (S2)
  participant C as MyLibraryController
  participant SV as MyLibraryService
  participant A as AccountPresence (auth)
  participant RG as RegionDirectory (region)
  participant DB as account_region
  W->>C: PUT /api/v1/me/regions {residenceRegionIds, workRegionIds}
  C->>C: 형식 검사 (두 칸 필수, 칸마다 20, 중복 합침)
  alt 형식 오류
    C-->>W: 400 validation_error (field별)
  else
    C->>SV: replaceRegions [트랜잭션]
    SV->>A: lockIfExists
    SV->>RG: 사용 중인 시군구인지
    alt 폐지·없음·시도 ID
      C-->>W: 422 invalid_region (칸·번호·이유)
    else
      SV->>DB: DELETE WHERE account_id
      SV->>DB: INSERT (kind, region_id, position)…
      C-->>W: 200 저장한 값 [커밋]
    end
  end
```

### 4.5 저장과 탈퇴가 겹칠 때 (ADR-0051)

```mermaid
sequenceDiagram
  autonumber
  participant T1 as 저장 요청 (탭 A)
  participant DB as PostgreSQL
  participant T2 as 탈퇴 (탭 B)
  participant REG as 발행 저장소
  participant ML as AccountDeletedListener
  T1->>DB: SELECT … auth.account FOR NO KEY UPDATE
  T2->>DB: DELETE auth.account (잠금 때문에 기다림)
  T1->>DB: INSERT account_library, COMMIT
  DB-->>T2: DELETE 진행
  T2->>REG: AccountDeleted 기록 (같은 트랜잭션)
  T2->>DB: COMMIT
  REG-->>ML: AccountDeleted (커밋 뒤, 별도 스레드)
  ML->>DB: DELETE account_region, account_library WHERE account_id
  ML->>REG: 완료 → 기록 삭제
  Note over ML,REG: 실패하면 기록이 남고, 서버를 다시 켤 때 다시 보냄(republish-outstanding-events-on-restart)
```

## 5. 흐름도 (규칙이 갈리는 곳)

### 5.1 검색 계획에 도서관을 넣을지 (library, ADR-0050)

```mermaid
flowchart TB
  A["도서관 하나"] --> B{"꺼져 있나?"}
  B -->|예| X["계획에서 뺌"]
  B -->|아니오| C{"libraryIds에 있나?<br/>(직접 추가)"}
  C -->|예| D["chosen=true<br/>자격·scope·visit 상관없이 넣음<br/>맨 앞 묶음"]
  C -->|아니오| E{"지역 규칙이 맞나?<br/>(place)"}
  E -->|"지역이 있는데 안 맞음"| X
  E -->|맞음 또는 지역 없음| F{"scope=joinable인데<br/>joinable() 아님?"}
  F -->|예| X
  F -->|아니오| G{"visit=none인데<br/>방문 가입?"}
  G -->|예| X
  G -->|아니오| H["넣음 (ADR-0027 순서)"]
```

### 5.2 S11 창을 띄울지

```mermaid
flowchart TB
  A["로그인 직후"] --> B{"서버 지역이 비었나?"}
  B -->|아니오| N["창 없음, 서버 값 씀"]
  B -->|예| C{"브라우저에 지역이 있나?"}
  C -->|아니오| N2["창 없음, 빈 채로 시작"]
  C -->|예| D{"이 브라우저에서 이 계정이<br/>답한 적 있나?"}
  D -->|예| N2
  D -->|아니오| E["지역 해석 후 S11 창"]
  E -->|계정에 저장| F["PUT 후 답함 기록"]
  E -->|저장하지 않기| G["답함 기록만"]
  E -->|닫음·새로고침| H["기록 없음 → 다음 로그인 때 다시"]
```

### 5.3 S10 이름 검색 줄의 버튼

```mermaid
flowchart LR
  A["이름이 맞는 서비스 도서관"] --> B{"이미 직접 추가했나?"}
  B -->|예| C["'이미 있음' (흐림)"]
  B -->|아니오| D{"직접 추가가 20곳?"}
  D -->|예| E["[추가] 흐림 + '20곳까지예요'"]
  D -->|아니오| F["[추가] 누를 수 있음<br/>(자동·누구나 가입 도서관도)"]
```

## 6. 화면 상태 (S1 내 도서관 줄)

```mermaid
stateDiagram-v2
  [*] --> 로그인전 : 로그인 안 함
  로그인전 --> 불러오는중 : 로그인 확인 200
  불러오는중 --> 내도서관있음 : 지역 또는 직접 추가 있음
  불러오는중 --> 비어있음 : 둘 다 없음
  불러오는중 --> 불러오기실패 : 500·연결 끊김
  불러오기실패 --> 불러오는중 : 다시 시도
  비어있음 --> 내도서관있음 : 지역 저장·도서관 추가
  내도서관있음 --> 비어있음 : 모두 비움
  내도서관있음 --> 로그인전 : 로그아웃·로그인 풀림
  비어있음 --> 로그인전 : 로그아웃·로그인 풀림
```

## 7. 예상되는 설계 패턴

| 패턴 | 어디에 | 왜 | 근거 |
|---|---|---|---|
| 모듈러 모놀리스 + 공개 API (Published Interface) | `LibraryCatalog`, `AccountPresence`, `AccountId` | 다른 모듈은 공개 타입만 부르고 `internal` 패키지는 못 봄 | ADR-0001, dev `spring-modulith` 스킬 |
| 도메인 이벤트 + 트랜잭셔널 아웃박스 | `AccountDeleted` → 발행 저장소 → `mylibrary` listener | 탈퇴와 "지워라" 기록을 같은 트랜잭션에 묶고, 커밋 뒤 따로 처리. 실패해도 기록이 남아 다시 처리 | ADR-0041, ADR-0051 |
| 멱등 수신자 (Idempotent Receiver) | listener의 DELETE, `PUT …/libraries/{id}`, `DELETE …/libraries/{id}` | 같은 이벤트·요청이 두 번 와도 결과가 같아 다시 보내기가 안전 | design-delta API 표 |
| 비관적 잠금 (Pessimistic Lock) | `lockIfExists`의 `FOR NO KEY UPDATE` | 저장·탈퇴 겹침과 20곳 동시 추가를 한 줄로 세움 | ADR-0051, PostgreSQL 13.3 |
| 저장소 (Repository) | `AccountRegionStore`, `AccountLibraryStore` (JdbcClient) | SQL을 한곳에 모음 | 사이클 05 `auth`와 같은 방식 |
| 번호로만 참조 (ID reference, 집합 경계) | `account_id`, `region_id`, `library_id`에 FK 없음 | 모듈 표끼리 엮지 않아 나중에 서비스로 나눌 수 있음 | ADR-0001, ADR-0048 |
| 인자 해석기 (Spring `HandlerMethodArgumentResolver`) | `AccountIdArgumentResolver` | 다른 모듈 컨트롤러가 JWT를 몰라도 현재 계정을 받음 | design-delta 모듈 표 |
| 기능 토글 (Feature Toggle) | `chaekcheck.auth.enabled`, `ConditionalOnAuthEnabled` | 로그인을 끄면 `mylibrary` 빈과 API도 없음(404) | ADR-0046 |
| 매개변수 객체 + 필터 규칙 | `PlanOptions(scope, visit, libraryIds)` | 계획 규칙(5.1)을 한 객체가 들고 다님 | design-delta 검색 계획 규칙 |
| 낙관적 화면 갱신 + 되돌리기 (Optimistic UI) | S10 [추가]·[빼기] | 누르면 먼저 바뀌고, 실패하면 되돌리고 안내 | flow S10 |
| BFF 없이 화면이 조합 (Client-side composition) | S10이 `GET /api/v1/libraries` + 저장 값으로 여섯 구역을 만듦 | 서버는 회원을 모르는 목록만, 조합은 화면이 | ADR-0049 |

- 이 표의 패턴 이름은 설명을 위한 분류입니다. dev가 이 이름의 클래스를 만들어야 한다는 뜻은 아닙니다.
