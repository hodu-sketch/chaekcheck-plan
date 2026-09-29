# 사이클 03 회고: 검색 조건 강화 (제목 / 저자 / 출판사 중 하나)

- 작성일: 2026-09-30 (다음 사이클 시작 전, 사용자 요청으로 회고만 먼저)
- 근거: dev 코드(`chaekcheck-dev/backend`, `web`), dev 빌드 결과(`backend/build/test-results`, 2026-09-29 15:00Z 실행), Spring Modulith `Documenter` 출력(`backend/build/spring-modulith-docs/components.puml`), dev `docs/plan-feedback.md`(사이클 03 절)를 이 사이클의 `design-delta.md`·`handoff.md`, `docs/current/`와 비교함
- plan-feedback이 개발 중 변경을 사용자 발언과 함께 모두 담고 있음 [확정] (사용자, 2026-09-30: "그대로 사용")

## 계획대로 된 것

- 인계서 1~5단계가 모두 구현됨
  - 조건 파라미터 도우미 `SearchConditionParam`(`availability/internal/web`)과 컨트롤러 3개. `q`는 받지 않음
  - 포털 adapter 저자·출판사: 1쪽부터 `table.do` + `author_name`/`book_pubname`, `search_type`은 빈 값 (ADR-0026)
  - 나머지 6종은 URL 테스트만 더함(코드 변경 없음)
  - 조건별 캐시 테스트 (`LibraryPageFetcherTests.sameTextInAnotherFieldIsNotSharedInTheCache`)
  - 웹: 입력창 안 드롭다운(네이티브 `<select>`, `aria-label="검색 조건"`), 주소 `?author=김달`, 조건 바꾸면 첫 묶음부터
  - 사이클 02 테스트·문서의 `q=`를 모두 고침
- `targets`는 요청과 같은 이름의 조건 칸 하나만 보냄(`@JsonInclude(NON_NULL)`), `query` 칸은 없어짐 (ADR-0025)
- 모듈 의존 방향 그대로 `availability → library → region`. `Documenter`의 `components.puml`이 `module-map.md` 그림과 같음 (Library → Region, Availability → Library만 있음). 이벤트 없음. 새 테이블·Liquibase 스키마 변경 없음
- 수용 기준 AC-1~AC-8 모두 통과 (dev plan-feedback "수용 기준 확인")
- 빌드와 테스트
  - backend: 테스트 254개 통과, 실패 0 (결과 파일 29개 합계, 2026-09-29 15:00Z 실행. `ModularityTests`, `DocumentationTests`, `SearchConditionParamTests` 16개 포함)
  - web: `npm test` 67개 통과, `npm run build`·`npm run lint` 통과 (dev 기록)
  - 화면 폭 1280·768·375 모두 옆 스크롤 없음 (dev 기록)
- 사이클 02에서 남은 확인(Vitest 기록, 다시 빌드, AC-1~24 확인표)을 처리함. AC-12는 금정 대신 서산시립(77)으로 확인

## 달라진 것과 이유

| # | 달라진 것 | 설계 | 구현 | 이유 |
|---|---|---|---|---|
| — | 포털 "도서관에서 보기" | 저자·출판사일 때만 `index.do?search_text=`로 대신 열기 [안] | 가져온 주소가 `index.do`가 아니면 모두 `index.do?menu_idx=M&search_text=…`로 엶. 제목 2쪽 이후도 포함. `PlatformAdapter.librarySearchUri(baseUrl, query, fetchedUri)` 추가(기본은 받은 주소 그대로) | 제목 2쪽 이후도 `table.do`(CSS 없는 조각)라 깨짐 (dev 확인, 부산) |
| — | 전북 포털 파싱 | 변경 예정 없음 | 전북 `table.do`는 전체 건수를 `div.search-info` 스크립트에만 둠 → `ElibPortalV1Adapter`가 이 형식도 읽게 고침 | 사이트 동작. 사이클 02의 전북 제목 2쪽도 같은 이유로 실패하고 있었음 |
| — | `validation_error` 본문 | `detail` "Only one search condition can be used." (design-delta 예시) | 다른 `validation_error`와 같은 "Request validation failed". 빈 값은 없는 것으로 셈(`?title=&author=김달` = 저자 검색) | [이유 미확인] (dev 결정) |
| C3-U-1 | 방문 가입 표시 기준 | `visit_required` = "전자책에 방문이 꼭 필요하다고 원문이 말할 때만" (C2-U-9) | 방문 단계만 있고 원문이 전자책을 말하지 않는 곳도 방문 가입(18곳 true, 68 → 86곳). 전자책은 방문 없이 되는 곳(목포·익산 소장형·경산)은 가입 방법 글을 전자책 기준으로 고침. seed `003`~`006` csv 수정(배포 전 규칙) | "방문 가입인데 방문 가입 태그가 안 붙여진 부분이라던가 있거든", "혹시 너 설명이 이상한 거면(방문 가입이 아닌데 방문 가입 설명) 알려주고". 목포는 사용자 결정 "방문 없이 됨" |
| C3-U-1 | "방문 없이 가입" 필터 | 없음 | 첫 묶음 API `visit=any\|none`(없으면 any, 그 밖은 400 `validation_error` field `visit`). `none`이면 방문 가입 도서관을 계획에서 빼서 요청하지 않음. `targets`에 `visit` 칸. 웹 토글 "방문 없이 가입", 주소 `visit=none` | "방문 가입도 태그로서 검색 조건에 활용하거나 필요한 것 같아" |
| C3-U-1 | 조회 순서 | `PriorityGroup` 순서 + 무리 안 후순위 포털·주의·보유 수·id | `PriorityGroup` 값은 그대로, 무리 안 첫 기준을 "방문 가입이면 뒤"로. 지역 없음: 누구나(방문 없음) → 누구나(방문) → 자격 필요 → 확인 필요. 지역 있음: 무리마다 그 안에서 방문 가입이 뒤 | "방문 가입 조건이 붙은 도서관은 누구나 도서관보다 좀 후순위에 해줘" |
| C3-U-1 후속 | 지역 있을 때 조회 순서 (회고 때 다시 정함) | 위 구현: 내 시군구(방문)가 누구나(방문 없음)보다 앞 | **다음 개발에서 바꿈**: 내 시군구(방문 없음) → 내 시도(방문 없음) → 누구나(방문 없음) → 내 시군구(방문) → 내 시도(방문) → 누구나(방문) → 확인 필요. 무리 값은 그대로 (ADR-0027, 인계서 "사이클 03 후속") | 사용자가 순서 설명을 보고 "이거 좀 이상한데" → 위 순서를 직접 지정 (2026-09-30) |
| C3-U-1 | 결과 정렬 | 같은 책 안: 가입 가능(주의 없음) → 가입 가능(주의) → 확인 필요 | 가입 가능(주의 없음) → 가입 가능(주의) → **가입 가능(방문)** → 확인 필요 (`sortBatch.ts`) | dev가 조회 순서와 맞춤 → [확정] (사용자, 2026-09-30) |
| C3-U-2 | 책이음 문구와 가입 판정 | 사이클 02 구현: 추가 문구가 있으면 지역이 맞아도 "가입 자격 확인 필요" 배지, "가입 가능한 곳"에서 뺌 (spec 5.1·AC-12와 다름) | 배지는 가입 판정(`UNKNOWN`·`UNVERIFIED`)만 봄. 추가 문구는 글로만 보임. `SearchTarget.joinable()`도 추가 문구를 보지 않음(`OPEN`·`ELIGIBLE`이면 가입 가능) | "누구나 가입 아니고 지역이 맞으면 가입가능인 거고... 참고로 책이음문구정도면 돼" |
| — | 다음 묶음 테스트 파일 | 새 파일 필요할 수 있음 | `EbookSearchStreamControllerTests` 안에 있던 것을 `EbookBatchStreamControllerTests`로 옮김 | 정리 (dev) |
| — | 웹 상태 | 변경 파일 목록 | `SearchState`에 `field`, `start` 액션이 `field`를 받음 | 구현 방식 (dev) |

- scope.md "영향 받을 모듈"에서 `library`는 바뀌지 않을 것으로 봤으나, C3-U-1로 `LibraryService` 무리 안 순서와 seed가 바뀜

## 새로 알게 된 제약

- **포털 기본(제목) 검색은 제목만이 아니라 저자·출판사도 찾음** (`김달` 제목 검색에 저자 김달의 책이 나옴). 사이클 02의 "1쪽 결과는 모두 제목에 검색어가 있었다"는 `사랑`에서만 맞았음
- **포털 저자 정확히 일치로 빠지는 줄**: "김달 저", "김달 지음"으로 적힌 줄이 빠짐 (부산 11 중 3줄, 대구 2줄, 경기교육청 1줄). 같은 책이 공급 업체별로 두 줄 있고 표기가 달라, 책 자체보다 공급 업체 줄이 빠지는 경우가 많음. 공저("A, B")는 표본에 없음
- 교보·YES24 저자 검색은 부분 일치라 "김달영" 같은 다른 저자도 나옴. 도서관마다 결과 범위가 다름 (ADR-0026에서 알고 정한 것)
- **포털 저자·출판사 검색의 상세 판정 부담**: 부산·대구·경기교육청은 상세 요청 0~1건. 수량 칸이 없는 전북은 쪽마다 상세 10건 × 1초 → 약 20초(30초 안). 경북은 재지 않음
- 경기교육청 포털은 처음 몇 번 5초 읽기 제한을 넘겨 504였다가 몇 분 뒤 정상 (제목 검색도 같음)
- 대구 포털 `table.do`: 제목(거르기 없음) 2쪽은 여전히 검색어와 상관없는 책(전체 28,550건). **저자 거르기 `table.do`는 맞게 나옴**
- 가입 방법 글(`join_method`)이 종이책 회원증 절차까지 적고 있어 `visit_required`와 어긋날 수 있음. 가입 방법에 "방문"이 있는데 false인 곳이 127곳이었음(방문 없는 길이 있음 약 100곳, 방문 단계만 18곳, 전자책은 방문 없음 3곳)

## 다음 사이클 후보

- **여러 조건 AND 검색 / 미리 수집한 전자책 목록으로 검색 보강** — 사이클 03에서 제외한 AND 검색의 대안. 사이클 밖 조사가 진행 중 (`docs/research/ebook-catalog/`, 2026-09-30)
- 포털 저자 표기 차이("김달 저", "김달 지음")로 빠지는 줄 처리: 거르기 전 표기 정리 또는 부분 일치 방식 검토 — 이번 실측에서 나옴
- 같은 책 묶기(ISBN), `titleKey`에 저자·출판사 더하기 — backlog 그대로. 공급 업체별 중복 줄 문제와 연결됨
- 읽는 코드가 없는 화면 7종, 느리거나 실패하는 도서관 기억하기, 조회 서버가 모두 멈췄을 때 묶음 중단, `targets` 크기 줄이기 — 사이클 02 retro 그대로
- 회원(자격 정보 저장), 재학·소속 자격
- 도서관 데이터: 방문 가입 판단 규칙(dev `library-maintenance.md` 4-10 5번)을 정기 재확인 절차에 넣기
