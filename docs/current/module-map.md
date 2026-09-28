# 모듈 맵 (현재)

현재 설계 전체를 적은 문서입니다. 변경 기록이 아닙니다.

마지막 반영: 사이클 02 cycle-close (2026-09-28). 사이클 01 부분은 dev 코드와 대조했고(2026-09-27), 사이클 02 부분은 **설계됨(미구현)** 입니다. 다음 `/cycle-start`에서 코드와 대조합니다.

| 모듈 | 책임 | 공개 API | 발행/구독 이벤트 | 소유 테이블 | 상태 |
|---|---|---|---|---|---|
| `region` | 시도·시군구 목록, 법정동 코드 속성, 폐지·대체 연결, 옛 지역 ID 해석 | Java `RegionDirectory` (`expandForMatching`, `resolve`), 예외 `RegionNotUsableException`(ID별 이유 `ABOLISHED`/`NOT_FOUND`/`NOT_SIGUNGU`) / REST `GET /api/v1/regions`, `GET /api/v1/regions/resolutions` | 없음 | `region.region`, `region.region_replacement` | 구현됨 (사이클 02 변경 없음) |
| `library` | 도서관 목록(전자도서관 사이트 하나 = 한 줄, `library_type`으로 전자·실물 구분, ADR-0017), 가입 방법, 자격 문구, 자격 규칙(규칙 없음 = 자격 미확인, 누구나 = 전국 규칙, ADR-0013), 사용 여부, 순위 값, **우선순위 조회 계획** | Java `LibraryCatalog` (`planSearch(residenceIds, workIds)` → 정렬된 `SearchTarget` 목록, `findEnabledTarget(libraryId)`), 공개 타입 `SearchTarget`, `PriorityGroup`, `LibraryType`, `PlatformType`(6개), `Eligibility`(`UNVERIFIED` 포함), 예외 `InvalidRegionException` | 없음 | `library.library`, `library.eligibility_rule` | 설계됨(미구현). 사이클 01의 `findTargets`·`findEnabledSearchTarget`·`Platform`을 대체 |
| `availability` | 묶음 단위 검색(ADR-0014), adapter 6종(ADR-0016), 판정 방식 `AvailabilityResolver`·SSE 전달 `SiteResultDelivery`(ADR-0019), 도서관 호출 `SiteFetcher`(직접 / 조회 서버 경유, ADR-0015), 제목 비교 키(ADR-0018), 캐시(ADR-0006), 호스트 이름 단위 호출 간격(ADR-0010), 검색 필드(ADR-0009) | REST `GET /api/v1/ebook-searches/stream`, `GET /api/v1/ebook-searches/batches/stream`, `GET /api/v1/availability/libraries/{libraryId}/ebooks` | 없음 | 없음 (메모리 캐시) | 사이클 01 부분 구현됨, 사이클 02 변경은 설계됨(미구현) |
| 조회 서비스 (Modulith 모듈 아님, 별도 배포 단위) | 받은 URL을 GET으로 가져와 상태 코드와 원본을 돌려줌. 여러 대, 고정 IP (ADR-0011, 0015) | 내부 REST `POST /v1/fetches` | 없음 | 없음 | 설계됨(미구현). dev 저장소 새 폴더 [안] `fetch-service/` |

base package `com.chaekcheck` [확정]. Spring 기본 예외를 ProblemDetail로 바꾸는 `ApiExceptionHandler`는 base package 루트에 있고, 모듈 예외는 `availability/internal/web/AvailabilityErrors`가 처리합니다.

## 모듈 구성도

```mermaid
flowchart TB
  web["web (React)<br/>조회 계획·묶음 목록·칸 안 정렬"] -->|"REST / SSE"| availability
  subgraph main["본 서비스 (Spring Modulith, 1대)"]
    availability["availability<br/>묶음 실행기 · 상세 판정<br/>캐시(ADR-0006) · 호스트 throttle(ADR-0010)<br/>adapter 6종(ADR-0016)<br/>SiteFetcher 인터페이스(ADR-0015)"]
    library["library<br/>도서관(전자도서관 한 곳 = 한 줄) · 자격 규칙<br/>planSearch (우선순위 계획)"]
    region["region<br/>expandForMatching"]
    availability -->|"LibraryCatalog"| library
    library -->|"RegionDirectory"| region
  end
  availability -->|"직접 호출 (설정)"| sites[("도서관 사이트들")]
  availability -->|"조회 서버 경유 (설정)<br/>POST /v1/fetches, 우선순위 순"| fetch1["조회 서버 1 (고정 IP)"]
  availability -.->|"연결 실패·503일 때만"| fetch2["조회 서버 2 (고정 IP)"]
  fetch1 --> sites
  fetch2 --> sites
```

- 모듈끼리는 루트 패키지의 공개 API로만 호출합니다. 거꾸로 부르지 않습니다 (ADR-0001). `availability`는 `region`에 직접 의존하지 않습니다.
- 이벤트는 쓰지 않습니다.
- 칸 안의 정렬(제목끼리 모은 뒤 기존 순서)과 "지금 빌릴 수 있는 책만" 필터는 프론트가 합니다. `availability`는 줄마다 판정(`availability`), 정렬에 쓰는 값, 제목 비교 키(`titleKey`)를 계산해 보냅니다.
- 조회 계획과 묶음 진행 상태는 브라우저가 가지고, 서버는 저장하지 않습니다 (ADR-0014).

## 도메인 모델

```mermaid
classDiagram
  class Library {
    id
    libraryType
    name
    enabled
    joinMethod
    eligibilitySummary
    extraConditionText
    visitRequired
    platformType
    baseUrl
    holdingsCount
    holdingsCountedOn
    deferred
  }
  class EligibilityRule {
    basis
    scopeType
    scopeRegionId
    scopeInstitutionId
  }
  class SearchPlan {
    query
    filter
    regionFilterApplied
  }
  class PlanEntry {
    libraryId
    priorityGroup
    nextPage
    state
  }
  class Batch {
    batchNo
  }
  class ResultRow {
    title
    titleKey
    holdings
    loaned
    reservations
    availability
  }
  Library "1" -- "0..*" EligibilityRule
  EligibilityRule "0..*" ..> "0..1" Region : ID로만 참조
  SearchPlan "1" -- "1..*" PlanEntry
  PlanEntry "0..*" ..> "1" Library : libraryId
  SearchPlan "1" -- "1..*" Batch
  Batch "1" -- "0..*" ResultRow
```

- `Library`, `EligibilityRule`은 `library` 모듈이 DB에 저장합니다. `SearchPlan`, `PlanEntry`, `Batch`, `ResultRow`는 브라우저 상태입니다.
- 주요 흐름(시퀀스·상태 그림)은 `flows.md`에 있습니다.

## 관련 ADR

ADR-0001 모듈 경계, ADR-0006 캐시, ADR-0009 검색 필드, ADR-0010 호출 간격, ADR-0011 조회 서비스, ADR-0013 자격 모델, ADR-0014 묶음 검색 API, ADR-0015 조회 계약, ADR-0016 adapter, ADR-0017 도서관 한 줄 = 이용 단위, ADR-0018 제목 비교 키, ADR-0019 판정·전달 인터페이스
