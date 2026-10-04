# 정기 유지보수 작업: 도서관 목록 → 책 목록 → 서비스 반영 (초안, 원본은 dev)

- 작성 2026-10-04. 사용자 요청: "실제적으로 내가 이 프로젝트를 유지보수하는데 주기적으로 필요한 작업이 1. 서비스하는 전자도서관 목록 찾기 2. 전자도서관 목록으로 도서 찾기", "그리고 3.찾은 도서 목록으로 도서 찾기가 있다", "이거 다 해줘"
- 성격: 세 작업을 잇는 순서와 "어느 문서의 몇 절을 보는지"를 한 장에 모은 **안**입니다. 각 작업의 절차 원본은 따로 있고, 이 문서는 그 원본을 가리키기만 합니다. 원칙: 절차 원본은 dev `docs/library-maintenance.md`, 조사 기록과 근거 수치는 plan [확정] (사용자, 2026-10-01). 둘이 어긋나면 원본이 맞습니다.
- 주기와 순서는 모두 [안]입니다. 정하는 곳은 주기 갱신 사이클입니다(별도 사이클 [확정], `docs/research/ebook-catalog/catalog-refresh.md` 머리말).
- 문서 색인: `docs/reference-index.md` 0절

> **절차 원본은 dev입니다** (ADR-0047, 2026-10-04 dev가 옮김): 0~4절 내용 → dev `docs/maintenance/README.md` (`C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev\docs\maintenance\`). 이 문서는 옮기기 전 초안과 5절(후보 도서관을 등록 도서관으로 옮기는 순서)·6절(확인 필요)을 남깁니다. 옮긴 뒤 plan에서 새로 알게 된 것은 `docs/research/ebook-catalog/crawl-runbook.md` 4절 "dev에 반영할 것"에 모아 사용자가 dev에 전달합니다.

## 0. 한눈에

| 단계 | 하는 일 | 주기 | 절차 원본 | 실행 도구 |
|---|---|---|---|---|
| 1 | 서비스 전자도서관 목록 확인 (새 곳, 바뀐 주소, 꺼진 곳, 가입 자격, 책 번호 체계) | [안] 월 1회 + 운영 로그 신호가 있을 때 | dev `docs/library-maintenance.md` 4-0~4-11, 6-2, 14절 | dev `CheckKyoboSites.java`, `CheckYes24Sites.java`, `scripts/library/check_code_spaces.py` |
| 2 | 도서관마다 전자책 목록 받기 | 주 1회 전체 + 매일 신간 [확정] (`crawl-method.md` 2절). **신간 수집 명령은 아직 없음** → 지금은 전체만 | plan `docs/research/ebook-catalog/crawl-runbook.md` | `chaekcheck-data\resume.cmd` (`scripts/crawl_catalog.py`) |
| 3 | 받은 목록을 서비스 DB로 가져오기 (정리·같은 책 묶기) | [안] 2단계 전체 수집이 끝날 때마다 | dev `docs/plan-feedback.md` `# 사이클 04` "가져오기 실행 방법"(806행 부근), plan `docs/current/flows.md` 흐름 8 | dev `./gradlew bootRun` 프로필 `catalog-import` |
| 4 | (자동) 사용자가 책을 찾으면 서비스 DB에서 찾고, 도서관 상세 페이지로 대출 상태를 실시간 조회 | 늘 | plan `docs/current/flows.md` 흐름 6·7 | 서비스(`catalog`, `availability` 모듈) |

1 → 2 → 3 순서로 이어집니다. 1에서 서비스 도서관이 바뀌면 2에서 그 도서관을 받고, 3에서 다시 가져와야 서비스 검색에 반영됩니다. 4는 사람이 돌리지 않지만, 4에서 나는 오류(상세 페이지를 못 읽음)가 1을 할 신호가 됩니다.

## 1. 서비스 전자도서관 목록 확인

절차 원본: dev `docs/library-maintenance.md`. 아래는 볼 곳과 순서 [안]입니다.

1. 목록 출처 다시 보기: 교보 공식 목록, 공공데이터포털 전국도서관표준데이터, 통합 포털 목록, 웹러브 북스 (dev 4-0~4-5). 교보 공식 목록 재확인은 요청 약 400건·20분, plan `docs/cycles/02-library-expansion/data/kyobo-institutions.tsv`와 비교 (dev 4-1, 4-9)
2. 주소 모양으로 화면 종류 나누기, 최종 주소 확정 (dev 4-6, 4-7, 3절 도구)
3. 가입 자격·방문 가입 판정 (dev 1-1, 1-2, 4-8, 4-10). 사람이 정한 값은 dev `scripts/library/join_overrides.tsv`가 마지막에 이김
4. 책 번호 체계 점검: `check_code_spaces.py` → 기준값과 비교. 크게 바뀌거나 새 화면 종류가 생기면 사용자에게 알림 [확정] (사용자, 2026-09-30) (dev 4-11)
5. 날짜가 정해진 것 확인: 꺼 둔 도서관 id 59·131 재개 확인 2027-01 (dev 6-2), 중간 인증서 만료 2027-05-21·2027-11-02 (dev `docs/library-site-issues.md` 3절)
6. 남은 확인 목록: `docs/reference-index.md` 6절 "도서관 목록·분류"

운영 중 신호(3xx, 읽기 실패, 시간 초과)별로 할 일은 dev 4-9에 있습니다.

## 2. 도서관마다 전자책 목록 받기

절차 원본: plan `docs/research/ebook-catalog/crawl-runbook.md` (입구 문서).

1. `chaekcheck-data\resume.cmd` 실행. 끝난 도서관은 넘어가고, 받던 도서관은 마지막으로 저장한 쪽 다음부터 받음 (runbook 3절)
2. 줄 세우기: IP 하나에 한 줄, 한 줄에 동시 1건·1초 간격. `chaekcheck-data\queue-by-ip.txt`가 있으면 IP 기준, 없으면 도메인 이름 기준 [확정] (사용자, 2026-10-04) (runbook 2-1절)
3. 상태 보기: `python -X utf8 scripts\crawl_catalog.py status`, 로그 `chaekcheck-data\logs\crawl-*.log` (runbook 3·5절)
4. 실패한 도서관: runbook 6절 "문제별 대처". 막힌 사이트는 우회하지 않고 `crawl_skip`으로 표시 (runbook 5-1절)
5. 끝난 뒤: 상세 주소 확인 `scripts\verify_detail_urls.py` (runbook 9절)

화면 종류별 목록 주소와 예외는 `platforms.md`, 원칙은 `crawl-method.md`에 있습니다. 웹러브 북스 기관까지 넣은 전체 수집은 며칠 걸립니다(2026-10-03 시작, 진행은 runbook 8절).

## 3. 받은 목록을 서비스 DB로 가져오기

절차 원본: dev `docs/plan-feedback.md` `# 사이클 04` "가져오기 실행 방법". 아래는 그 내용과 확인할 숫자 [안]입니다.

1. 준비: 수집 SQLite(`chaekcheck-data\ebook-catalog.sqlite`), 국가서지 TTL 폴더(dev `data/nlk/ttl`, git에 넣지 않음). dev 안내는 "수집 세션이 쉴 때" 실행. 가져오기는 SQLite를 읽기 전용으로 한 시점만 읽음(dev `CollectedCatalog.java`). 2026-10-03에는 수집 중에 실행함
2. 먼저 세기만: dev `backend/`에서 아래 명령 끝에 `--chaekcheck.catalog.import.dry-run=true`를 더해 실행 (DB에 쓰지 않음)

       ./gradlew bootRun --args='--spring.profiles.active=catalog-import --chaekcheck.catalog.import.sqlite-path=../../chaekcheck-data/ebook-catalog.sqlite --chaekcheck.catalog.import.ttl-path=../data/nlk/ttl'

3. 요약 숫자를 지난번과 비교 (아래 표). 크게 다르면 사용자에게 알리고 멈춤 [안]
4. 실제 가져오기: 같은 명령을 dry run 없이. 지우고 새로 넣음(`TRUNCATE` 뒤 COPY, 한 트랜잭션)
5. 확인: `/api/v1/books` 몇 가지 검색 ("행동"+"새폴스키", "작별하지 않는다", "사랑")

지난 실제 가져오기 (2026-10-03 18:05, dev `plan-feedback.md` 789행):

| 항목 | 값 |
|---|---|
| 읽은 줄 / 건너뜀 | 9,077,458 / 4,123,098 (서비스 도서관 아님 4,088,037, 오디오북 32,412, 동영상북 2,522, 빠진 책 119, http 아닌 주소 8) |
| 도서관 | 275곳 (전체 성공 기록 없는 곳 1) |
| 책 수 (묶기 단계별) | ① 887,439 → ② 887,439 → ③ 840,605 → ④ 680,689 |
| 쓴 것 | 책 680,689, 사람 746,721, 소장 4,954,360 |
| 시간 | 읽기 1분 39초, 묶기 8초, 국가서지 3분 17초, 쓰기 2분 27초 |

가져오기에서 빠지는 것: 오디오북·동영상북 [확정], 서비스 도서관이 아닌 곳(도서관 번호와 주소가 서비스 `library`와 둘 다 같아야 함), 빠진 책, 상세 주소가 없거나 호스트가 다른 줄 (dev `CollectedCatalog.java`).

다시 가져오면 책 번호가 1부터 새로 매겨집니다. 사용자가 공유한 `/books/{bookId}` 주소가 다른 책을 가리킬 수 있습니다. 번호를 이어 쓰는 방법은 주기 갱신 사이클에서 정합니다 (`catalog-refresh.md` 5.1절) [확인 필요: 주기 갱신 사이클].

정리·묶기 규칙: `search-and-normalization.md` 4절, `same-book-isbn.md` 5절. 주기 갱신의 순서 6단계: `catalog-refresh.md` 2절.

## 4. (자동) 서비스에서 책 찾기와 대출 조회

- 흐름: `docs/current/flows.md` 흐름 6(책 목록 검색과 바로 보기), 흐름 7(책 먼저 고르기 → 책 화면). 구현: dev `BookSearchController`, `BookAvailabilityStreamController`, `BookAvailabilityBatchStreamController` (사이클 04)
- 대출 상태는 저장하지 않고 사용자가 볼 때 도서관 상세 페이지를 읽음 [확정] (`crawl-method.md` 2절). 같은 호스트 1건·1초, 캐시 3분
- 유지보수에서 볼 것: 상세 페이지를 못 읽는 도서관이 늘면 화면이 바뀐 것 → 1단계(dev 4-9, 12절 화면 종류별 상세 형식)

## 5. 후보 도서관(웹러브 북스 기관)을 등록 도서관으로 옮기기 [안]

지금 수집 DB에는 서비스 도서관 278곳(번호 1~280) 말고도 웹러브 북스에서 찾은 기관 2,506곳(번호 100001~102506: 2026-09-30 북큐브 134곳, 2026-10-03 나머지 2,372곳)이 있습니다(`crawl-runbook.md` 8절). 이 기관들은 서비스 `library`에 없어서, 다 받아도 3단계 가져오기에서 "서비스 도서관 아님"으로 빠집니다(2026-10-03에 4,088,037줄). 서비스 검색에 나오게 하려면 아래가 필요합니다.

| 필요한 것 | 지금 | 태그 |
|---|---|---|
| 대출 상태를 읽는 코드(adapter) | dev에 있는 화면 종류: `KYOBO_V1`, `KYOBO_SUBSCRIPTION_V1`, `YES24_V1`, `YES24_V2`, `YES24_V3`, `ELIB_PORTAL_V1`, `GANGNAM_V1` (dev `availability/internal/adapter`, 2026-10-04). **북큐브 `BOOKCUBE_FX`, 알라딘 `ALADIN_V1`은 없음** → 이 기관(북큐브 458곳, 알라딘 25곳, 모두 서비스 밖)은 adapter를 만드는 사이클이 먼저 | [확정] (dev 코드 확인) |
| 서비스 `library` 값: 지역, 가입 자격, 가입 방법·링크, 방문 가입 | 수집 DB에는 이름·주소·화면 종류만 있음. 대학·기업·학교가 많아 소속 회원만 쓰는 곳이 많아 보임 | [확인 필요: 가입 자격 조사] |
| 도서관 번호 맞추기 | 가져오기는 서비스 `library`의 번호·주소가 수집 DB와 같아야 함. 수집 DB 번호 100000~을 서비스 번호로 그대로 쓸지 정해야 함 | [확인 필요: 사이클에서 결정] |
| 교보 대여·혼합형 243곳 | 수집에서 뺀 상태 [확정] (사용자, 2026-10-03) | — |

순서 [안]:
1. 사용자가 넣을 범위를 고름 (예: 교보·YES24 기관 중 누구나 가입 가능한 곳 먼저)
2. 사이클로 진행 (`/cycle-start`): 가입 자격 조사(1단계 절차) → dev `library` seed 추가 → (북큐브·알라딘이면) adapter
3. 그 기관들의 2단계 수집이 끝났는지 확인 → 3단계 가져오기

`docs/backlog.md` "다음 사이클 후보"에 한 줄로 올려 둠 (2026-10-04).

## 6. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 1단계 도서관 목록 확인 주기 (월 1회 [안]) | 사용자에게 질문 |
| 3단계 가져오기 주기, 다시 가져올 때 책 번호가 바뀌는 문제 | 주기 갱신 사이클 (`catalog-refresh.md` 5·5.1절) |
| 2단계 매일 신간 수집: 수집기에 명령 없음 | 프로토타입 (YES24 `sort=pubdt`, 북큐브 `sort=3`, 교보 구독형 `publDate` 후보: `platforms.md`) |
| 수집 중에 가져오기를 돌려도 되는지 (dev 안내 "수집 세션이 쉴 때", 실제로는 읽기 전용이라 2026-10-03에 수집 중 실행) | dev에 확인 (다음 인계서) |
| 웹러브 북스 기관의 가입 자격 | 1단계 절차로 조사 |
