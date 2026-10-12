# 수집 ② 도서관의 책 수집: 도서관마다 어떤 책이 있나

- 작성 2026-10-05. 수집 두 갈래 중 둘째입니다. 첫째(도서관 수집)는 [`1-libraries.md`](1-libraries.md)
- 목적: ①이 수집 DB에 넣은 도서관(등록 도서관·후보 도서관)마다 전자책 목록을 받아 **도서관-책 매핑**을 만듭니다. 전체 수집·신간 수집, 이어 받기, 호출 예의(줄 세우기·병렬 정도)가 이 갈래입니다. 이 문서는 **받는 것 / 내놓는 것 / 원칙 / 결정**을 한 장에 모으고, 자세한 내용은 원래 문서의 절을 가리킵니다.
- 결정 출처 [확정] (사용자, 2026-10-05): "도서관 수집하는거랑(수집하면서 구독형은 마감 여부 확인하는 거랑) 도서관의 책 수집하는 거 그 두가지야". 사이클 07 `docs/cycles/07-candidate-libraries/spec.md` R8, 문서 이름·폴더 [확정] (사용자 승인, 2026-10-05)
- **절차 원본은 dev입니다** (ADR-0047): dev `docs/maintenance/2-crawl.md`(이어 받기, 명령, 병렬 정도·IP 줄, 받지 않는 도서관, 문제별 대처, 새 사이트 붙이기, 상세 URL, 오디오북 표시), 플랫폼별 목록 주소·쪽 크기·읽는 위치는 dev `docs/maintenance/platforms.md`, 순서는 dev `docs/maintenance/README.md` (`C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev\docs\maintenance\`). 이 문서에는 원칙·결정만 둡니다. 둘이 어긋나면 dev 절차가 맞습니다.
- 다음 단계: 가져오기(수집 DB → 서비스 DB). 새 백엔드 모듈 `collection`이 맡습니다 [확정] (ADR-0060). 절차는 dev `docs/maintenance/3-import.md`

## 1. 받는 것 (입력)

| 입력 | 어디 | 근거 |
|---|---|---|
| 받을 도서관 목록 | 수집 DB `library`: 등록 도서관(dev seed를 `crawl_catalog.py init`으로 다시 읽음), 후보 도서관(①의 `import-probe`·`import-bookcube`로 넣음, 번호 100001~). `platform_type`, `base_url`, `crawl_skip`(받지 않는 곳) | dev `1-libraries.md` "등록 도서관 확인" 끝, dev `2-crawl.md` 5-1절 |
| 실행 설정 | 데이터 폴더의 `queue-by-ip.txt`(있으면 IP 기준 줄), `host-slots.txt`(정한 줄만 동시 N건, 지금 `103.182.126.192=4`) | dev `2-crawl.md` 2-1절 |
| 실행 인자 | `--workers N`, `--per-host N`, `--gap S`, `--host-slots KEY=N,…`, `resume.cmd [WORKERS] [PER_HOST] [GAP]` | dev `2-crawl.md` 2-1·5절 |
| 데이터 폴더 위치 | `--data-dir` 인자 > 환경 변수 `CHAEKCHECK_DATA` > 저장소 옆 `chaekcheck-data`(기본값) | dev `2-crawl.md` 0절 |
| 도서관 사이트의 목록 화면 | 빈 검색 전체 목록(제목순 고정), 플랫폼별 주소·쪽 크기 | `crawl-method.md` 3절, dev `platforms.md` |

## 2. 내놓는 것 (결과물)

| 결과물 | 경로 | 근거 |
|---|---|---|
| 수집 DB (SQLite, WAL) | `chaekcheck-data\ebook-catalog.sqlite`. 표 `library`(도서관, 마지막 성공 전체 수집 시각 등), `crawl_run`(실행 기록: 시작·끝·상태, 이어 받기용 `cur_section`·`last_page`·`done_total`, `error`), `holding`(도서관 × 책 코드 `item_key` 줄, 처음 본·마지막으로 본 시각, 빠진 날짜) | 표 이름은 dev `scripts/crawl/crawl_catalog.py` 스키마(2026-10-05 읽음), 칸 설명은 dev `scripts/crawl/README.md` "DB 구조", 날짜 세 층은 `crawl-method.md` 4절 [안] |
| 줄마다 모으는 항목 | 플랫폼, 책 코드, 제목·저자·출판사·출간일 원문, 공급사, 자료 종류(`content_kind`, `kind_source`), 분야, 표지 주소, 상세 URL(`detail_url`, `detail_path`) | `crawl-method.md` 5절 |
| 실행 로그 | `chaekcheck-data\logs\crawl-*.log` (`parallelism: …`, `timing <IP> …`, `SPLIT OFF`, `SLOTS OFF`) | dev `2-crawl.md` 2-1·6절 |
| 배포용 사본 | `chaekcheck-data\snapshots\ebook-catalog-2026-10-05-0745.sqlite`. 가져오기의 원본으로 씀 [확정] | `docs/research/ebook-catalog/snapshot-2026-10-05.md`, 사이클 07 `design-delta.md` "가져오기 변경" |
| 상세 URL 확인 결과 | `scripts/crawl/verify_detail_urls.py` 실행 결과 | dev `2-crawl.md` 9절 |

## 3. 원칙

| 원칙 | 내용 | 태그와 출처 |
|---|---|---|
| 수집 범위·순서 | 등록 도서관(켜진 곳) 먼저, 이어서 웹러브 북스에 있는 책은 거의 다. 순위 1 → 2 → 3 → 4는 같은 호스트 안에서만 지키고 호스트가 다르면 동시에 | [확정] (사용자, 2026-09-30, `crawl-method.md` 1절, `crawl-runbook.md` 2절) |
| 무엇이 중요한가 | 책 목록 자체보다 도서관-책 매핑. 목록이 서로 거의 같은 대여형 도서관도 모두 받음 | [확정] (사용자, 2026-10-04, `crawl-method.md` 1절) |
| 출처 | 도서관 전자도서관 사이트에서 직접. 제3자 사이트 DB는 가져오지 않음 | [안] (`crawl-method.md` 1절) |
| 같은 호스트 | 한 번에 1건, 요청 사이 1초 이상 | [확정] (사이클 01 spec 5.6) |
| 같은 호스트를 무엇으로 보나 | IP 하나 = 한 줄(요청 주소는 도메인 그대로). 공용 호스팅 7개(`*.dkyobobook.co.kr`, `*.bookcube.biz`, `*.dasangng.co.kr`, `*.aladinebook.co.kr`, `*.yes24library.com`, `*.libworks.co.kr`, `*.hongjicns.co.kr`), 포트만 다른 사이트도 같은 호스트 | IP 기준 [확정] (사용자, 2026-10-04), 공용 호스팅 [확정] (사용자, 2026-10-03) (`crawl-method.md` 1절, `crawl-runbook.md` 2·3절) |
| IP 줄 되돌림 | 공용 서버의 IP 줄 하나라도 평균 응답 12초 초과(요청 30건 이상 뒤)나 5번 연달아 실패면 그 업체 IP 전부를 한 줄로 (`SPLIT OFF`) | [안] (`crawl-runbook.md` 3절) |
| 서버가 다르면 병렬 | 교보·북큐브·YES24·도서관 자체 서버 작업은 동시에. 같은 서버를 쓰는 두 작업은 동시에 띄우지 않음 | [확정] (사용자, 2026-10-03, `crawl-runbook.md` 2절) |
| 병렬 정도는 실행할 때 고름 | `--workers`, `--per-host`(기본 1), `--gap`(기본 1초). 기본값 바꾸기는 사용자 결정 | [확정] 고를 수 있게 (사용자, 2026-10-03, `crawl-method.md` 1절) |
| 정한 줄만 동시 N건 | `--host-slots`: 교보 대여·혼합형 IP 103.182.126.192만 동시 4건, 요청 시작 사이 1초 이상 | [확정] (사용자, 2026-10-04, `crawl-runbook.md` 8-2절). 자동 1건 되돌림(평균 14초 초과·5번 연속 실패, `SLOTS OFF`) [안] |
| User-Agent | 서비스를 알 수 있는 이름, 개인 연락처 넣지 않음 | 식별 원칙 [확정] (사이클 01), 문자열 [안], 연락처 [확인 필요] (`crawl-method.md` 1절) |
| 막힌 사이트 | 우회하지 않고 `crawl_skip`으로 표시 | 국회·김천 자동 접근 차단은 우회하지 않음 (`catalog-refresh.md` 변경 기록 2026-10-01, `periodic-tasks.md` 2절). 태그 없음 [안] |
| 수집 종류 | 전체 수집(FULL) 주 1회, 신간 수집(NEW) 매일. 신간 명령은 아직 없음 → 지금은 전체만 | 주기 [확정] (사용자, 2026-09-30, `crawl-method.md` 2절), 신간 방법 [확인 필요] (`periodic-tasks.md` 0절) |
| 빠진 책 표시 | 성공한 전체 수집에서만, 이번에 보지 못한 줄에 빠진 날짜(지우지 않음). 성공 판정은 사이트 총 건수와 차이 1% 이하 | 절차 `crawl-method.md` 3절, 1% [안] |
| 저장 범위 | 사실 정보만. 소개·저자 소개·목차·서평 문장은 저장하지 않음. 표지는 주소만 | [확정] (사용자, 2026-09-30, `crawl-method.md` 1절) |
| 보유·대출·예약 수 | 저장하지 않고 사용자가 볼 때 실시간 조회 | [확정] (사용자, 2026-09-30, `crawl-method.md` 2절) |
| 상세 URL | 모든 줄에 반드시 있어야 함. 없으면 다시 받아 채움 | [확정] (사용자, 2026-09-30, `crawl-method.md` 5절) |
| 수집 시간대 | 새벽(예: 02:00~07:00) 전체 수집 | [안] (`crawl-method.md` 1절) |
| robots.txt | 기록은 하되 막아도 호출할지는 사용자 결정 | [확인 필요] (`crawl-method.md` 1절) |
| 돌고 있는 수집기 | 멈추지 않고 계속 돌림. 옮긴 수집기로 갈아타기·코드 구조 정리는 수집이 한 바퀴 끝난 뒤 | [확정] (사용자, 2026-10-04, `dev-move-request.md` 머리말; 사용자 승인 2026-10-05, spec R8) |

## 4. 결정 기록

| 날짜 | 결정 | 사용자 말 | 태그 |
|---|---|---|---|
| 2026-09-30 | 주기 수집, 날짜 기록, 항목 구조화 | "서비스할꺼니까 주기적으로 크롤링이 필요한데 크롤링 방법에 대해서 따로 문서로 작성해줘", "수집된 날짜(실시간성)을 기록해줘", "대부분의 항목들을 일정하게 구조화해서 수집하면 좋겠는데" | [확정] (`crawl-method.md` 머리말) |
| 2026-09-30 | 받는 순서와 범위 | "278곳 먼저가 우선인데 웹러브 북스에 있는 책은 거의 다 수집" | [확정] (`crawl-runbook.md` 2절) |
| 2026-09-30 | 오디오북 표시, 상세 URL 필수 | "db에 오디오북 표시좀 해줘라", "각 도서관 도서의 상세페이지 url도 꼭 있어야 해" | [확정] (`crawl-runbook.md` 머리말, `crawl-method.md` 5절) |
| 2026-10-03 | 서버가 다르면 병렬 | "병렬적으로 수집하면 안 돼?", "교보 따로 다른 사이트들 따로" | [확정] (`crawl-runbook.md` 2절) |
| 2026-10-03 | 병렬 정도를 고를 수 있게 | "나중에 병렬도 얼마만큼 병렬로 할 것인지 선택했으면 해" | [확정] (`crawl-runbook.md` 3절) |
| 2026-10-04 | YES24 공용 서버는 지금처럼 1건 | 이유 [이유 미확인] | [확정] (`crawl-runbook.md` 3절) |
| 2026-10-04 | YES24 IP 나눠 받기: 몇 IP 시험 → 11개 전부 | "서버 규모에 맞게 요청을 보내고 싶어서", "몇 IP만 먼저 시험", "지금 11개 전부" | [확정] (`crawl-runbook.md` 3절) |
| 2026-10-04 | IP 기준 줄 세우기 | 사용자 선택 "합치기 + 북큐브·알라딘 나누기" (계기 질문 "다른 것들도 각 아이피 따로따로 보내는 건?") | [확정] (`crawl-runbook.md` 3절) |
| 2026-10-03 → 10-04 | 교보 대여·혼합형: 일단 빼고 → 받기, 그 IP만 동시 4건 | "대여·혼합형은 일단 빼고 나머지 먼저 받아줘" → "적합하게 대여/혼합형도 해줘", "도서관마다 거의 책이 같다 하더라도 중요한 건 바로 도서관-책 매핑이야", "4건으로 해줘" | [확정] (`crawl-runbook.md` 8-2절) |
| 2026-10-04 | 수집기를 멈추지 않고 배포 먼저 | "수집기를 멈추는게 아니라 계속 돌고 숫집된 부분까지만이라도 배포먼저할건뎅" | [확정] (`dev-move-request.md` 머리말) |
| 2026-10-05 | 수집을 두 갈래로, 이 문서와 `1-libraries.md`로 정리. 갈아타기·코드 정리는 한 바퀴 끝난 뒤 | "도서관 수집하는거랑(수집하면서 구독형은 마감 여부 확인하는 거랑) 도서관의 책 수집하는 거 그 두가지야" | [확정] (spec R8) |

## 5. 진행 상태 (숫자는 아래 문서에서 봄)

| 무엇 | 어디 |
|---|---|
| 지금 값 (어디까지 받았나) | dev `2-crawl.md` 3절의 `status` 명령 |
| 순위별 진행과 시점 값 | `docs/research/ebook-catalog/crawl-runbook.md` 1절(순위 1~3), 8-2절(순위 4) |
| 배포용 사본 시점의 도서관별 상태 | `docs/research/ebook-catalog/snapshot-2026-10-05.md` 2절 |
| 운영 중 알게 된 문제와 규모 | `docs/research/ebook-catalog/catalog-refresh.md` 4절, "변경 기록" |
| 다음에 할 일 | `crawl-runbook.md` 8-3절 |

## 6. dev 절차·코드 위치

| 일 | dev 절차 (`docs/maintenance/`) | dev 코드 |
|---|---|---|
| 받는 순서, 호출 예의 | `2-crawl.md` 2절 | `scripts/crawl/crawl_catalog.py` (`host_key`) |
| 병렬 정도, IP 줄, 서버별 동시 요청 수 | `2-crawl.md` 2-1절 | `crawl_catalog.py`, `scripts/crawl/resume.cmd` |
| 이어 받기와 상태 보기 | `2-crawl.md` 3절 | `resume.cmd`, `crawl_catalog.py status` |
| 수집기 규칙 요약 (목록 여럿인 사이트, 다른 정렬로 채우기, 알려진 빈틈) | `2-crawl.md` 4절 | `crawl_catalog.py` |
| 명령 모음, 받지 않는 도서관 | `2-crawl.md` 5·5-1절 | `crawl_catalog.py` |
| 문제별 대처 | `2-crawl.md` 6절 | — |
| 새 사이트·새 플랫폼 붙이기 | `2-crawl.md` 7절, `platforms.md` | `crawl_catalog.py` |
| 상세 URL, 오디오북 표시 | `2-crawl.md` 9·10절, `platforms.md` 9절 | `scripts/crawl/verify_detail_urls.py` |
| 플랫폼별 목록 주소·쪽 크기·읽는 위치 | `platforms.md` 2~8절 | — |
| 수집 DB 표·칸, 실행 환경 | `scripts/crawl/README.md`, `scripts/crawl/requirements.txt` | — |

- dev 코드는 2026-10-05 복사됨(ADR-0047 B). 지금 돌고 있는 것은 옛 복사본 `chaekcheck-data\scripts\crawl_catalog.py`(`chaekcheck-data\resume.cmd`)이고, 옮긴 수집기로 갈아타는 때는 사용자가 정함 [확인 필요: 사용자가 정함] (dev `2-crawl.md` 0절)

## 7. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| ~~`--per-host`와 `--host-slots`를 함께 줄 때 어느 쪽이 이기는지~~ | 해결: 줄마다 `--host-slots` 값이 먼저, 적히지 않은 줄은 `--per-host`, "SLOTS OFF"가 된 줄은 1건. 줄 열쇠는 `--queue-by-ip`면 IP, 아니면 호스트 이름 (dev `crawl_catalog.py` `slots_for`, dev `docs/maintenance/2-crawl.md` 2-1절, 2026-10-05) |
| 신간 수집(NEW): 수집기에 명령 없음. 최신순 정렬 후보 교보 구독형 `orderByKey=publDate`, 북큐브 `sort=3`, 포털 NEW 목록. 교보 일반·YES24(`sort=pubdt`)는 미확인 | 프로토타입, API 호출 시험 (`crawl-method.md` 9절, `periodic-tasks.md` 6절) |
| 다시 켜기 전에 건너뛴 쪽을 기억하지 못해 그 쪽 책이 빠짐(알려진 빈틈). 고칠 방법 [안]: 건너뛴 쪽 목록을 `crawl_run`에 저장 | dev 코드 확인 (`crawl-runbook.md` 4절, dev `2-crawl.md` 4절) |
| 교보 구독형 여러 도서관이 같은 목록이면 한 번만 모을지 | API 호출 시험 (`crawl-method.md` 2절) |
| 전체 수집 한 바퀴 실제 시간, 기관이 늘어난 뒤에도 주 1회 전체가 가능한지 | 프로토타입 (`crawl-method.md` 9절, `catalog-refresh.md` 5절) |
| 수집을 어디서 돌리나(지금 Python 도구 / 서비스 안 예약 작업) | 주기 갱신 사이클에서 결정 (`catalog-refresh.md` 5절) |
| YES24 IP 11개 앞에 차단 장치가 하나 있는지 | 바깥에서 알 수 없음, 응답 시간으로 간접 확인 (`crawl-runbook.md` 3절) |
| User-Agent에 넣을 서비스 공개 연락처 | 사용자에게 질문 |
| robots.txt가 막을 때 호출할지 | 사용자에게 질문 |
| 저자 원문 나누기, 부제 떼기 규칙 | 표본 조사 (`crawl-method.md` 9절) |
| 오디오북만 있는 사이트 표시 (도서관 단위 표시 칸) | 사이클에서 결정 (원문 `crawl-runbook.md` 8-3절에 방법 없음) |
| 전체 수집의 법적 위험 | 출시 전 전문가 확인 (`crawl-method.md` 9절) |
