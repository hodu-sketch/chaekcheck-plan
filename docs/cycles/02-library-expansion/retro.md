# 사이클 02 회고: 도서관 확장 (교보·YES24 전국 + 많은 도서관을 위한 검색 구조)

- 작성일: 2026-09-29 (사이클 03 시작 때)
- 근거: dev 코드(`chaekcheck-dev/backend`, `web`, `fetch-service`), dev 빌드 결과(`backend/build/test-results`, `fetch-service/build/test-results`), Spring Modulith `Documenter` 출력(`backend/build/spring-modulith-docs/`), dev `docs/plan-feedback.md`(사이클 02 절)를 이 사이클의 `design-delta.md`·`handoff.md`, `docs/current/`와 비교함
- plan-feedback이 개발 중 변경을 사용자 발언과 함께 모두 담고 있음 [확정] (사용자, 2026-09-29: "없음, 그대로 사용")

## 계획대로 된 것

- 인계서 1~12단계가 모두 구현됨. `library`(모델 확장, `planSearch`, `PriorityGroup`, `UNVERIFIED`), `availability`(호스트 이름 throttle, `SiteFetcher` 직접/조회 서버, adapter, `AvailabilityResolver`·`SiteResultDelivery`, `titleKey`, 묶음 SSE API), `fetch-service/`, 웹(계획·묶음 상태, 줄 갱신, 묶음 안 정렬), `Documenter` 테스트
- 모듈 의존 방향 `availability → library → region`. `Documenter`의 `components.puml`이 `module-map.md` 그림과 같음(Library → Region, Availability → Library만 있음). `availability`에는 `region` import가 없음(코드 확인)
- 이벤트를 쓰지 않음. 서버는 검색 상태를 저장하지 않음 (ADR-0014)
- 지켜야 할 제약을 코드에서 확인함 (2026-09-29)
  - 조회 서버가 모두 "쉼"이면 실패하고, 직접 호출로 자동 전환하지 않음 (`FetchServiceSiteFetcher`, ADR-0015)
  - 넘기기는 연결 실패·연결 시간 초과·503일 때만. 읽기 시간 초과, 200 + 도서관 쪽 실패는 넘기지 않음
  - 조회 서버에는 캐시·간격 제어가 없음. 사설·루프백·링크 로컬 주소 거부, 루프백 허용은 테스트 설정에서만 (ADR-0011)
  - 인증서 검증을 끄지 않음 (ADR-0022)
  - 묶음 실행기에 화면 종류 분기나 30초 값이 없음. 30초는 설정으로 주입 (ADR-0019)
  - 웹은 `platformType`·`availabilityBasis`를 표시에만 씀
  - 서지 설명문과 표지를 읽지 않음
- 빌드와 테스트
  - backend `./gradlew build`: 테스트 196개 통과, 실패 0 (결과 파일, 2026-09-29 11:24Z 실행)
  - fetch-service `./gradlew build`: 테스트 11개 통과 (결과 파일, 2026-09-28 22:15Z 실행, 이후 소스 변경 없음)
  - web `npm run build` 통과 (dev 기록, JS 414 kB·gzip 132 kB)
- 실제 사이트 확인(dev 기록): 호스트 간격 1.01초(AC-18), 첫 묶음 `사랑` 계획 15곳 중 7곳만 요청하고 `ROW_LIMIT`(AC-1, AC-2), 경북·전북 상세 판정 30초 안에 완료(AC-15), 교보 `recordCount=10` 표본 5곳(AC-3), 조회 서버 두 대 넘기기(한 대 끔 → 실패 0, 둘 다 끔 → 직접 호출 0건)
- 포털 상세 주소는 검색 화면의 `menu_idx`를 그대로 쓰면 열림 → `library` 칸 추가 필요 없음

## 달라진 것과 이유

| # | 달라진 것 | 설계 | 구현 | 이유 |
|---|---|---|---|---|
| C2-U-1 | 본 서비스 여러 대 대비 | scope 제외 "서버 여러 대" | 운영 1대, `HostThrottle`·`SearchPageCache`·`DetailVerdictCache`를 인터페이스 뒤에 (ADR-0021) | "근데 MSA 고려니까 나중에 본 서버도 여러 대 댈 수 있어. 이거 고려해야 해." |
| C2-U-2 | 화면 종류 이름 | `KYOBO`, `YES24_LEGACY` 등 6개 [안] | 세대 번호 `KYOBO_V1` … `YES24_V3`, 7개 (ADR-0023) | "기존 것들도 언제든지 legacy가 될 수 있는데 … 순서라도 붙여주던가" → "모두 세대 번호" |
| C2-U-3 | Liquibase 파일 | 적용된 changeset은 고치지 않음, 새 파일 `003`/`004` | 배포 전(`PRE_DEPLOYMENT` 파일이 있는 동안)에는 기존 changeset을 고침. 스키마는 `library/001`에 합침, seed는 `003`~`006` | "changeset은 기존 것을 수정하더라도 깔끔한 구성으로 갔으면 해. 아직 배포 안 됐어" |
| C2-U-4 | 가입 안내 링크 | 없음 | `library.join_url`, `targets`의 `joinUrl` | "해당 텍스트 누르면 링크도 제공해주면 좋을 것 같아" |
| C2-U-5 | 대구 암호화, 연결 제한 | 연결 3초 | RSA 키 교환 허용(JVM 전체), 연결 5초 (ADR-0022) | "허용", "5초로 늘림" |
| C2-U-6 | 한 묶음의 줄 수 | 20줄 넘으면 새 요청 중단 | 그대로. 이미 시작한 요청을 받아 첫 묶음이 70줄까지 나옴 | "지금처럼 받은 만큼 다 보여줌" (설계 유지) |
| C2-U-7 | 도서관 관리 안내서 | plan `collection-method.md` | dev `docs/library-maintenance.md` + `scripts/library/` 도구 | "도서관 삭제/추가/수정 … 나중에 batch성 작업으로 ai시켜서 할건데 이거 다 기록해 놔야해" |
| C2-U-10 | 조회할 도서관 고르기 | 없음 | `scope=all\|joinable`, 토글 "전체 도서관 / 가입 가능한 곳"(지역 없으면 "누구나 가입") | "필터 기능도 추가하는게 어떨까 해 … 이름은 똑같게 하지 말고" |
| C2-U-11 | 가입 "주의" 표시, 정렬 | 없음 | `library.join_caution`, 같은 그룹 안에서 주의 없는 도서관 먼저(서버 계획·웹 정렬 모두) | "일단 되게 하고 혹시 모르니 주의표시라도 해줘", "정렬할 때 주의가 없는 것 먼저 나오도록" |
| C2-U-12 | 같은 호스트 후보 | 차례로 기다림 [안] | 바쁜 호스트는 건너뛰고 다음 후보 먼저 (ADR-0020) | "이거 승인" |
| C2-U-13 | 도서관 이름 링크 | 없음 | `library.homepage_url`, 요약 줄 이름이 링크 | "각 도서관 … 누르면 도서관 공식홈페이지에 들어가도록" |
| C2-U-14 | 인증서 불완전 사이트 | 연결 시험 후 사용자와 정함 [확인 필요] | 중간 인증서 6개를 체인 재료로 더해 24곳 넣음 (ADR-0022) | "넣되 내가 확인할 수 있게 나중에 문서로 좀" |
| C2-U-15 | YES24 추가, 새 화면, "안내" | YES24 2종 | `YES24_V3` 추가, `library.join_notice`, 66곳 | "YES24_V3로 만들기", "주의보다는 '안내'로 해줘" |
| C2-U-16 | 옛 주소 없어진 도서관 | 약 20곳 제외 | 9곳 새 주소로 추가, 강원교육청 포털은 `base_url`에 `?menu_idx=2`, `PlatformAdapter.detailUri` 추가 | "검색 메뉴 번호가 url이야 그러면 바꾸고 넣기" |
| — | 3단계 `joinPolicy` | 임시 유지 또는 같은 단계에서 교체 | 같은 단계에서 서버·웹 모두 `priorityGroup`으로 교체 | [이유 미확인] (dev 선택, 인계서가 허용) |
| — | 강남구 페이지 크기 | 10줄 | 20줄 (사이트가 `list_num=10`을 무시) | 사이트 동작 |
| — | 포털 2쪽 이후 | `index.do?viewPage=N` | `table.do`. 판정 칸이 비어 빈칸 규칙 적용 | 사이트 동작 |
| — | `row-verdict` 순서 | `batch-done` 뒤 | `batch-done` 전에 정해진 판정은 모아 두었다가 직후에 보냄 | [이유 미확인] (dev 구현) |

정한 값 (사용자 또는 dev 보고, 2026-09-28~29)
- 조회 서버: 폴더 `fetch-service/`, group ID `com.chaekcheck`, base package `com.chaekcheck.fetch`, 독립 Gradle 빌드 [확정] (사용자)
- dev `CLAUDE.md` Directory Layout 변경 승인 [확정] (사용자)
- `[안]` 그대로 구현: P=5, K=50, 시작 마감 3초, 상세 30초 기준 = 묶음 시작, `availabilityBasis`·`SiteVerdict`·`stopReason` 값, 이벤트 이름, `candidates=libraryId:page`, 클래스 이름(`BatchRunner` 등)
- 임시값 (운영 전 사용자 확인 [확인 필요]): 조회 서버 동시 처리 32, 인증 헤더 `X-Fetch-Token`, "쉼" 30초, 본 서버 → 조회 서버 연결 1초·읽기 7초
- 제목 키: NFC → 공백 모두 제거 → 소문자 → 문장부호·기호 제거. 괄호 부제·"큰글자책"·권차는 그대로 둠(권차가 다른 책을 합치지 않기 위해)
- seed: 켜진 도서관 278곳 (중단 2곳은 끔)

## 새로 알게 된 제약

- 사이트 동작은 호출해 봐야 안다(사이클 01과 같음): 강남구는 페이지 크기 파라미터를 무시, 포털 2쪽부터는 다른 경로(`table.do`), **대구 포털 `table.do`는 검색어와 상관없는 책을 돌려줌** [확인 필요], 인천 포털 상세는 로그인 필요, 교보 구독형은 월 예산 소진을 검색 화면에서 알 수 없음
- 통합 포털에는 제목만 검색하는 항목이 없음(`search_type` 뜻이 포털마다 다름) → 기본 검색
- 같은 서버를 쓰는 도서관이 많음(경남교육청 `ebook.gne.go.kr`, 전남교육청 등). 1초 간격 규칙 아래에서 묶음 시간의 병목이 됨 → ADR-0020
- 실측 (dev, 2026-09-29, 실제 검색 10번): 도서관 한 번 응답 중앙값 0.33초, 95% 1.58초. 첫 묶음 `batch-done`까지 중앙값 2.97초·최대 6.94초, 둘째 묶음에서 후보 K=50 중 41개까지 씀 → K의 여유가 작음
- 첫 이벤트 `targets` 크기: 278곳 156,368바이트(gzip 16,271), 서버 응답 압축 설정 없음
- 보유 수(순위 값)는 사실상 전자책 수. 교보 6곳 중 5곳은 전체 = 전자책, 1곳 0.2% 차이. 구독형은 빈 검색 0건이라 NULL
- **조회 서버가 모두 멈추면 첫 묶음이 1~2초 안에 약 240곳을 실패로 표시**하고, 그 검색에서는 다시 묻지 않음 → 서버가 곧 살아나도 그 검색은 결과 없음
- JDK 25는 `TLS_RSA_*`를 막고, 중간 인증서를 보내지 않는 사이트가 많음. 중간 인증서 만료일을 관리해야 함 (2027-05-21, 2027-11-02)
- 가입 자격 원문은 "회원"과 "정회원·대출회원"을 구분해야 함. 교보 로그인 화면 안내문은 도서관마다 다르고, 11곳이 "전자책은 정회원만"이라고 적음
- 테스트 `CaffeineSearchPageCacheTests.loadsAgainAfterThreeMinutes`가 가끔 실패함(시간 관련)

## 남은 확인 (사이클 02 완료 기준 중 기록이 없는 것)

- 웹 단위 테스트(Vitest) 통과 기록 [확인 필요: dev에서 `npm test` 실행]
- 가로 스크롤 CSS 수정(2026-09-29 11:31Z)이 마지막 웹 빌드(11:25Z)보다 나중임 → 다시 빌드 [확인 필요]
- spec 7장 AC-1~AC-24 전체 확인표. 특히 AC-11(세종 거주 → 천안), AC-12(금정 책이음 문구)를 실제 seed로 확인한 기록 [확인 필요]

## dev에 전달할 것 (plan에서는 dev를 고치지 않음)

사용자 요청(2026-09-29): ADR-0022 내용이 dev `docs/library-maintenance.md`에 없으면 적어 달라. 확인 결과 대부분 있음(471·473행 대구·경기, 458·480행 PKIX·중간 인증서, 112·227·432행 검증 끄기 금지). dev 세션에서 다음을 고쳐 주세요.
1. 432행 "인증서 체인이 불완전한 사이트(PKIX 오류)를 넣을지 …"는 이미 정해짐 → "중간 인증서를 체인 재료로 더해 넣음(2026-09-29, 사용자 결정, plan ADR-0022). 검증 끄기는 금지"로 고침
2. 433행 뒤에 "`TlsCompatibility`는 JVM 전체에 적용됨. 운영에서 DB 등을 TLS로 붙이면 거기에도 RSA 키 교환이 허용됨 — 처리 방법은 사용자 결정 대기"를 더함
3. 3절 또는 TLS 관련 줄에 plan `docs/adr/0022-library-site-tls-compatibility.md` 링크를 더함

## 다음 사이클 후보

- **검색 조건 강화: 저자·출판사(·옮긴이) 검색** — "행동"처럼 짧은 제목은 원하는 책까지 "더 보기" 약 40번(dev 실측). 사용자: "나중에 검색 조건을 넣던가 해야지". 내부 `SearchField`는 이미 있음 (ADR-0009) → 사이클 03으로 선택
- 읽는 코드가 없는 화면 7종(경남교육청 자체 포털, 경남통합, 전남·충남 자체 화면, 울산 포털, 대구 동구 옛 YES24, 서울도서관, 북큐브)
- 느리거나 실패하는 도서관 기억하기, 조회 서버가 모두 멈췄을 때 묶음 중단
- `targets` 크기 줄이기
- 회원(자격 정보 저장), 재학·소속 자격
- 도서관 데이터 과제(가입 방법·자격 확인 필요 45곳, 정기 재확인 주기) — dev plan-feedback "추후 과제 전체 목록" C
