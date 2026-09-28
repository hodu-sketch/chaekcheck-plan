# 주요 흐름 (현재)

현재 설계의 주요 흐름을 그림으로 모은 문서입니다. 변경 기록이 아닙니다.

마지막 반영: 사이클 02 cycle-close (2026-09-28). 아래 흐름은 모두 **설계됨(미구현)** 입니다. 다음 `/cycle-start`에서 dev 코드와 대조한 뒤 "구현됨"으로 바꿉니다.

- 근거: `docs/cycles/02-library-expansion/design-delta.md` "구조 그림", ADR-0011, ADR-0014, ADR-0015, ADR-0019
- 모듈 구성도와 도메인 모델은 `module-map.md`에 있습니다.

## 도서관 하나의 조회 상태 (브라우저)

```mermaid
stateDiagram-v2
  [*] --> NotRequested
  NotRequested --> Requested: 묶음 후보로 요청됨 (1쪽)
  NotRequested --> NotRequested: 후보였지만 20줄 초과로 요청 안 됨
  Requested --> HasMore: 결과 받음, 더 있음
  Requested --> Exhausted: 결과 받음, 더 없음 또는 0건
  Requested --> Failed: 오류 또는 8초 초과
  HasMore --> Requested: 다음 바퀴 후보 (다음 쪽) 또는 도서관별 더 보기
  Exhausted --> [*]
  Failed --> [*]
```

- 1바퀴: `NotRequested`가 남아 있으면 계획 순서대로 후보로 보냅니다.
- 다음 바퀴: `HasMore`인 사이트를 계획 순서대로 다음 쪽으로 보냅니다.
- 모두 `Exhausted`나 `Failed`이면 목록 맨 아래 "더 보기"를 없앱니다.
- `Failed`는 같은 검색에서 다시 조회하지 않습니다 [확정] (ADR-0014).
- 필터나 지역이 바뀌면 상태를 버리고 첫 묶음부터 다시 검색합니다 [확정].

## 흐름 1: 첫 묶음 검색

```mermaid
sequenceDiagram
  participant W as web
  participant A as availability
  participant L as library
  participant C as 캐시·throttle
  participant S as SiteFetcher (직접 또는 조회 서버)
  W->>A: GET /api/v1/ebook-searches/stream?q&residenceRegionIds&workRegionIds&filter
  A->>L: planSearch(residence, work)
  alt 지역 ID 오류
    L-->>A: InvalidRegionException
    A-->>W: 422 invalid_region (스트림을 열지 않음)
  end
  L-->>A: 정렬된 SearchTarget 목록
  A-->>W: event targets (전체 계획)
  loop 계획 순서, 동시 P개, 셈한 줄이 20을 넘거나 시작 마감 전까지
    A-->>W: event library-requested (libraryId, page 1)
    A->>C: get(libraryId, q, 1)
    alt 캐시 있음
      C-->>A: 해석된 페이지
    else 캐시 없음
      C->>S: fetch(URL) — 호스트 이름 단위 동시 1건·1초
      S-->>C: 상태 코드 + 원본 바이트
      C-->>A: adapter.parse 결과
    end
    A-->>W: event library-result 또는 library-failed
  end
  Note over A: 8초가 되면 끝나지 않은 사이트는 upstream_timeout
  A-->>W: event batch-done (묶음 요약)
  Note over A,W: 상세 판정이 남아 있으면 흐름 3의 row-verdict를 보낸 뒤 done
  A-->>W: event done
```

## 흐름 2: 목록 맨 아래 "더 보기"

```mermaid
sequenceDiagram
  participant W as web
  participant A as availability
  participant L as library
  W->>W: 계획에서 다음 후보 계산 (1바퀴: 미요청 1쪽 / 다음 바퀴: HasMore 다음 쪽), 최대 K개
  W->>A: GET /api/v1/ebook-searches/batches/stream?q&filter&batchNo&candidates=31:1,32:1,1:2
  alt 형식 오류, K 초과, 중복
    A-->>W: 400 validation_error
  end
  A->>L: findEnabledTarget(각 libraryId)
  loop 후보 순서, 흐름 1과 같은 규칙
    alt 꺼졌거나 없는 사이트
      A-->>W: event library-failed (library_not_found)
    else
      A-->>W: event library-requested → library-result / library-failed
    end
  end
  A-->>W: event batch-done → (row-verdict …) → done
  W->>W: 새 묶음을 구분선 아래에 붙이고 그 안에서만 정렬. 요청 안 된 후보는 NotRequested로 남김
```

- 도서관별 "더 보기"는 `GET /api/v1/availability/libraries/{libraryId}/ebooks?q&page`(사이클 01 경로 그대로)를 부르고, 결과를 목록 맨 아래 새 묶음으로 붙입니다. 이 API는 JSON 한 번에 응답하므로, 상세 판정이 필요한 줄은 판정을 읽은 뒤(최대 30초) 함께 돌려줍니다 [안].

## 흐름 3: 경북·전북 포털 상세 판정

```mermaid
sequenceDiagram
  participant W as web
  participant A as availability
  participant C as 캐시·throttle
  participant P as 포털 (gbelib.kr 등)
  A->>C: 검색 페이지 (libraryId, q, page)
  C->>P: GET /module/elib/search/index.do (SiteFetcher 경유)
  P-->>A: 10줄, 판정 빈칸
  Note over A: 대출 0 → AVAILABLE (상세 요청 없음)<br/>대출 1 이상 → PENDING
  A-->>W: event library-result (PENDING 줄 포함)
  W->>W: PENDING 줄은 묶음 아래쪽 "대출 정보 조회 중" 자리에 표시
  loop PENDING 줄 (같은 호스트라 1초 간격으로 차례로)
    A->>C: 상세 (libraryId, book_idx), 캐시 3분
    C->>P: GET /module/elib/book/view.do?book_idx
    alt 30초 안에 "대출 가능" / "예약 가능"
      P-->>A: 판정
      A-->>W: event row-verdict (AVAILABLE / RESERVABLE)
      W->>W: 같은 묶음 안의 알맞은 칸으로 옮김
    else 30초 초과, 오류, 모르는 값
      A-->>W: event row-verdict (UNKNOWN)
      W->>W: "대출 가능 여부 확인 필요", 예약 칸 맨 아래
    end
  end
```

- 30초는 **묶음을 시작한 시각부터**입니다 [안]. 묶음의 8초 마감은 검색 페이지 요청에만 적용합니다.
- 30초 동안 한 호스트에서 읽을 수 있는 상세는 대략 25건입니다 (1초 간격). 첫 요청이 10줄이라 대부분 끝날 것으로 봅니다 [확인 필요: 프로토타입].

## 흐름 4: 조회 서버 경유 모드에서 서버 넘기기

```mermaid
sequenceDiagram
  participant A as availability (throttle 허가를 받은 상태)
  participant F1 as 조회 서버 1
  participant F2 as 조회 서버 2
  A->>F1: POST /v1/fetches
  alt 연결 거부 / 연결 시간 초과 / 503
    A->>A: F1을 일정 시간 "쉼"으로 표시
    A->>F2: 같은 요청 (남은 시간 안에서)
    F2-->>A: 200 {outcome, status, body}
  else 200 + 도서관 쪽 실패 (TIMEOUT, 403 등)
    F1-->>A: outcome
    A->>A: 넘기지 않고 library-failed (ADR-0011)
  else 조회 서버 읽기 시간 초과
    A->>A: 넘기지 않고 upstream_timeout (도서관 중복 요청 방지)
  end
  Note over A: 모든 조회 서버가 "쉼"이면 조회 실패. 직접 호출로 자동 전환하지 않음 (ADR-0015)
```
