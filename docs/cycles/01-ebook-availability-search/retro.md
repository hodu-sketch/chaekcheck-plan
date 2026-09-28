# 사이클 01 회고: 도서 제목 검색 → 전자도서관 대출 가능 여부

- 작성일: 2026-09-27 (사이클 02 시작 때)
- 근거: dev 코드(`chaekcheck-dev/backend`, `web`)와 dev `docs/plan-feedback.md`를 이 사이클의 `design-delta.md`, `docs/current/`와 비교함
- 구현 상태: 완료 [확정] (사용자, 2026-09-27). 남은 것은 연락처 값뿐 (아래 "남은 TODO")
- plan-feedback.md가 개발 중 변경을 빠짐없이 담고 있음 [확정] (사용자, 2026-09-27)

## 계획대로 된 것

- 모듈 3개(`region`, `library`, `availability`)와 의존 방향 `availability → library → region`. `ModularityTests` 통과 (ADR-0001)
- 모듈별 스키마 `region`, `library`와 테이블 4개. 컬럼, CHECK, 부분 유니크 인덱스, `UNIQUE NULLS NOT DISTINCT`가 design-delta와 같음 (ADR-0002~0004)
- SSE 검색 스트림(`targets` → `library-result`/`library-failed` → `done`)과 도서관별 더 보기 API (ADR-0005)
- Caffeine 캐시 3분·1,000건, 같은 키 동시 요청 1회, 실패는 캐시하지 않음 (ADR-0006)
- 호스트별 동시 1건·1초 간격. 실제 사이트에서 간격 1.013초, 1.015초 확인 (ADR-0007)
- 감싸지 않은 성공 응답 + ProblemDetail + `code` (ADR-0008). dev `api-design` 스킬과 java 규칙 예시도 이에 맞게 고침
- 실제 사이트로 AC-13, AC-16, AC-17, AC-18, AC-19 확인. 그 밖의 AC는 dev에서 완료로 보고함
- 웹 S1(검색+결과), S2(지역 모달), 프론트 정렬(spec 5.4), `fetch` 기반 SSE 읽기, 지역 해석(REPLACED/SPLIT/UNKNOWN)

## 달라진 것과 이유

| # | 달라진 것 | 설계 | 구현 | 이유 |
|---|---|---|---|---|
| U-1 | YES24 정렬 값 | `sort=now` ("대출 가능한 책 먼저") | `sort=title`, 설정 `chaekcheck.availability.yes24.sort` | `sort=now`는 정렬이 아니라 "지금 빌릴 수 있는 책만" 거르는 필터였음(`사랑` 221건 vs 233건). 그대로 두면 강서구 책이 "예약하고 기다려요" 그룹에 나오지 않음. 사용자 결정 |
| U-2 | 검색 필드 | 통합검색(교보 `schClst=all`, YES24 기본) | 제목 필드(교보 `schClst=ctts`, YES24 `srch_order=title`) + 내부 `SearchField`, 캐시 키에 field 추가 (ADR-0009) | [이유 미확인] |
| U-3 | 결과 필터 | 없음 | "전체 / 지금 빌릴 수 있는 책만" 토글, 프론트에서 거름, URL `?filter=available` | 사용자 요청. 이유는 [이유 미확인]. 사이트 쪽 필터는 요청과 캐시가 두 배가 되고 교보에는 같은 기능이 없어서 프론트 필터로 함(dev 제안). dev feedback은 "설계만"이라고 적었지만 코드에는 구현돼 있음 |
| U-4 | 스트림 지역 파라미터 | 쉼표 구분 [안], 최대 개수 미정 | 쉼표 구분, 필드당 최대 20개. 형식 오류나 초과는 400 `validation_error` | 사용자 결정. 이유 [이유 미확인] |
| U-6 | 웹 기술 | 미정 | React Router 8.4(Declarative), TanStack Query 5(지역 목록), 검색 스트림은 `useReducer`, CSS Modules, breakpoint 1024/640px, Radix UI, Vitest 5 | 사용자 결정. 이유 [이유 미확인] |
| U-7 | 도서관 링크 | 페이지 단위 `librarySearchUrl` | 줄마다 `detailUrl`(그 책의 상세 페이지), 없으면 `librarySearchUrl` | 링크를 누르면 그 책이 아니라 검색 목록이 열렸음(dev가 적은 배경). 사용자 발언 [이유 미확인] |
| U-8 | 도서관 요약 줄 | 도서관 전부 | 5곳까지 보이고 나머지는 "… 외 N곳" 팝오버 | 도서관이 늘면 요약 줄이 길어짐(dev가 적은 배경). 사용자 발언 [이유 미확인] |
| U-9 | 화면 테마 | 없음 | 흰 배경 + 보라, 단색과 테두리만, 나눔스퀘어 400/700/800, 내용 폭 90rem | 그라데이션과 그림자를 쓰지 않는 것은 사용자 요청. 나머지 [이유 미확인] |
| U-10 | 교보 한 번에 가져오는 건수 | 50 [확정] | 10, 설정 `chaekcheck.availability.kyobo.record-count` | "한 번에 50은 너무 많다" (사용자) |
| U-12 | 모바일 가입 정보 | 항상 표시 | 640px 이하에서는 "ⓘ 가입 정보" 버튼으로 팝오버 | 폰에서 결과 카드마다 두 줄이 반복돼 불필요하게 느껴짐 (사용자) |
| — | 테스트 DB | Testcontainers PostgreSQL 18 [확인 필요] | `compose.yaml`의 `db-test`(postgres:18, 5433, tmpfs), WSL Docker | 사용자 결정. 이유 [이유 미확인] |
| — | 추가 오류 코드 | api.md 표 7개 | Spring 기본 예외용 `not_found`, `bad_request`, `method_not_allowed`, `not_acceptable`, `unsupported_media_type`, `internal_error`, `request_error` 추가 | 없는 경로 등도 같은 ProblemDetail 모양으로 돌려주기 위함(dev 구현) |
| — | 422 `title` | "Unprocessable Entity" | "Unprocessable Content" | Spring 7이 RFC 9110 이름을 씀 |
| — | ProblemDetail `type` | 예시에 `"about:blank"` | `about:blank`이면 응답에서 생략 | Spring Framework 7 동작. RFC 9457상 의미는 같음 |

정한 값 (사용자, 2026-09-27) [확정]
- group ID와 base package `com.chaekcheck`, 설정 접두어 `chaekcheck`
- 지역 ID 규칙: 시도 2자리(법정동 코드 앞 두 자리), 시군구 4자리(시도 ID + 법정동 코드 순서 01, 02, …), 번호는 다시 쓰지 않음, 소속은 `parent_id`로만 판단. 시험용 폐지 데이터는 시도 `90`, 시군구 `9001`~`9099`
- 버전: Spring Boot 4.1.1, Spring Modulith 2.1.1, Caffeine 3.2.4, jsoup 1.23.2, React 19.3.0, Vite 8.3.1, TypeScript 6.0, JDK 25, Node 24 (dev에서 확인)

## 새로 알게 된 제약

- **도서관 사이트 URL 값의 의미는 실제로 호출해 봐야 안다.** `sort=now`처럼 이름과 동작이 다른 값이 있었음. 도서관·플랫폼을 늘릴 때도 전체 건수를 비교해서 확인해야 함
- 두 사이트 모두 제목 검색은 부분 일치. 교보는 저자 칸에 주 저자만 있어 옮긴이로 찾을 수 없음(YES24는 가능)
- 교보(고흥)는 화면에 없는 `recordCount=10`도 받아 줌. 두 사이트 모두 페이지 겹침 0건
- 교보 책 상세 주소는 `contentView.ink?cttsDvsnCode=&brcd=&ctgrId=&sntnAuthCode=`로 바로 열림. YES24 상세는 끝에 `/`가 붙은 주소로 301 리다이렉트됨
- Liquibase OSS YAML은 CHECK(`addCheckConstraint`는 Pro 전용)와 부분 인덱스를 지원하지 않아 `sql` 변경을 씀
- Liquibase는 context를 지정하지 않으면 context가 붙은 changeset도 모두 실행함. 운영 프로필에서 `test-data`를 빼야 함
- `SseEmitter` 컨트롤러에 `produces`를 걸지 않아야 검증 실패가 `application/problem+json`으로 나감
- 지역 seed: `jscode20260701`의 시군구 234개 중 도 출장소 2개를 빼서 232개. 세종특별자치시는 시군구 행 하나(`3601`)를 둠
- 전남광주통합특별시의 약칭(`short_name`)은 확인하지 못해 NULL [확인 필요]
- Git for Windows의 curl은 강서구 인증서(Sectigo R46)로 실패하지만 JDK와 Windows 내장 curl은 성공함

## 남은 TODO

- 페이지 바닥 연락처(AC-12), User-Agent의 서비스 URL과 연락처(AC-18 형식) [확인 필요]
- 백엔드 포트 (지금은 Spring Boot 기본 8080, Vite proxy는 `API_PROXY_TARGET`으로 바꿀 수 있음) [확인 필요]
- 운영 프로필의 Liquibase contexts에서 `test-data` 빼기
- plan 문서 불일치: dev 루트 `skill-change-api-design.md` 사본이 근거를 ADR-0010으로 적음(원본은 ADR-0008). dev에서 사본을 지울지 사용자에게 물어야 함

## 다음 사이클 후보

- **도서관이 많아질 때의 검색 구조 (dev feedback U-11).** 사용자가 정한 방향 [확정]:
  1. 지역 입력은 강제하지 않음
  2. 도서관을 우선순위대로 나눠서 찾음. 지역이 없으면 누구나 가입 → 자격 필요(전국 지역별)
  3. 같은 그룹 안에서는 보유 전자책이 많은 도서관부터
  4. 한 번에 약 20권, 목록 맨 아래 "더 보기"
  5. 아래 "더 보기"는 다음 순위 도서관으로 넓히고, 한 바퀴 돌면 첫 도서관의 다음 페이지(라운드 로빈)
  6. 도서관별 "더 보기"도 유지
  7. 새 결과는 기존 목록 아래에 붙이고 이미 본 결과의 위치는 바꾸지 않음
  - 제안 [안]: 지역을 고른 경우 내 시군구 → 내 시도 → 누구나 가입 순서. 묶음 안에서만 spec 5.4 순서로 정렬
  - 정할 것 [확인 필요]: 도서관별 보유 전자책 수의 출처와 갱신 주기, "20권"의 단위와 병렬 조회 수, 묶음 제한 시간, 라운드 로빈 상태를 둘 곳(ADR-0005 변경), 수백 곳일 때의 요약 줄
- 시범 외 전자도서관·플랫폼 확대 (backlog)
- 저자·출판사 검색 API 열기(`field` 파라미터, ADR-0009)
- 같은 책 묶기, 인기 도서 사전 수집(2사이클 합의), 학교·소속 기관 자격 (backlog)
