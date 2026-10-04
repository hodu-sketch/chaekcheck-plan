# dev에 보낼 요청: 정기 유지보수 절차와 수집기를 dev로 옮기기

- 작성 2026-10-04. 근거: `docs/adr/0047-maintenance-procedures-in-dev.md` [확정] (사용자 승인 "그렇게 해줘", 2026-10-04)
- 붙여 넣을 메시지: `dev-message.md` (1단계 문서, 2단계 수집기)
- 전달: 사용자가 dev 세션에 전달합니다 [확정] (사용자 선택 "ADR 추가 + 요청서를 내가 dev에 전달"). 사이클 05 개발과 겹치지 않을 때 합니다. 이 요청은 사이클 05 인계서(`docs/current/handoff.md`)에 넣지 않습니다
- 순서 조건: 수집기 코드(B)는 진행 중인 전체 수집이 끝난 뒤 옮깁니다(2026-10-06 0시 무렵 예상, `docs/research/ebook-catalog/crawl-runbook.md` 8절). 문서(A)는 먼저 해도 됩니다
- 아래 파일 이름과 구성은 [안]입니다. dev가 저장소 관례에 맞춰 바꿔도 되고, 바꾸면 `docs/plan-feedback.md`에 적어 주세요

---

## 요청 본문 (dev 세션에 전달)

plan ADR-0047에 따라, 주기적으로 하는 유지보수 세 작업의 절차를 dev `docs/maintenance/` 한 곳에 모으고, 수집기 코드를 dev로 옮겨 주세요. 원칙은 "절차의 원본은 dev, 조사 기록·근거·결정은 plan"(2026-10-01)입니다.

### A. 문서 (먼저 해도 됨)

| 새 파일 [안] | 내용 | 가져올 원문 |
|---|---|---|
| `docs/maintenance/README.md` | ① 도서관 목록 확인 → ② 책 목록 수집 → ③ 서비스 DB로 가져오기 → ④ (자동) 검색·대출 조회. 단계별 주기 [안], 실행 도구, 체크리스트 | plan `docs/research/maintenance/periodic-tasks.md` 0~4절 |
| `docs/maintenance/1-libraries.md` | 도서관 목록 확인 절차 | dev `docs/library-maintenance.md`를 옮기거나, 그 파일을 두고 이 파일에서 링크 (dev가 고름) |
| `docs/maintenance/2-crawl.md` | 책 목록 수집: 실행(`resume.cmd`), 이어 받기, 상태 보기, 명령 모음, 병렬 정도와 IP 기준 줄 세우기(`queue-by-ip.txt`), 받지 않는 도서관 표시(`--skip`), 문제별 대처, 새 사이트·플랫폼 붙이는 순서, 상세 URL·오디오북 표시 | plan `docs/research/ebook-catalog/crawl-runbook.md` 0·2-1·3·4·5·5-1·6·7·9·10절 |
| `docs/maintenance/platforms.md` | 플랫폼 타입별 검색·전체 목록 주소, 한 쪽 크기, 읽는 위치, 상세 URL, 오디오북 구분, 사이트별 예외 | plan `docs/research/ebook-catalog/platforms.md` 전체 |
| `docs/maintenance/3-import.md` | 서비스 DB로 가져오기: 준비 파일, dry run, 실행 명령, 확인할 숫자(지난번 값과 비교), 빠지는 줄의 기준, 다시 가져올 때 책 번호가 바뀌는 문제 | dev `docs/plan-feedback.md` `# 사이클 04` "가져오기 실행 방법"·"실제 가져오기 결과", plan `periodic-tasks.md` 3절 |

함께 확인해 주세요:
- `3-import.md`에 적을 실행 조건: 지금 안내는 "수집 세션이 쉴 때"인데, 가져오기는 SQLite를 읽기 전용으로 한 시점만 읽어 2026-10-03에는 수집 중에 실행했습니다. 수집 중 실행이 괜찮은지 정해 적어 주세요
- dev `docs/library-maintenance.md`의 알려진 문제(plan `docs/reference-index.md` 7절): 41~42행 표가 깨져 `CheckYes24Sites.java` 행 유실, 4-10 표에 `YES24_V3` 누락, 절 번호 순서(4-9/4-11, 13/14절)
- plan 문서에 남는 것(원칙 `crawl-method.md`, 조사 `research.md`, 규칙 근거 `same-book-isbn.md`·`search-and-normalization.md`·`catalog-refresh.md`)은 링크만 걸어 주세요. 경로: `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\research\ebook-catalog\`

### B. 수집기 코드 (전체 수집이 끝난 뒤)

| 옮길 것 | 지금 위치 (git 밖) | 새 위치 [안] |
|---|---|---|
| `crawl_catalog.py` (수집기), `verify_detail_urls.py`, `probe_aladin.py`, `probe_kyobo_institutions.py`, `probe_other_platforms.py`, `probe_yes24.py` | `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\scripts\` | `scripts/crawl/` |
| `resume.cmd` (이어 받기 실행) | `chaekcheck-data\` | `scripts/crawl/` |
| `README.md` (수집 DB 구조, 규칙) | `chaekcheck-data\` | `docs/maintenance/2-crawl.md`에 합치거나 `scripts/crawl/README.md` |

옮길 때 고칠 곳:
- 경로: `crawl_catalog.py`의 `ROOT = Path(__file__).resolve().parent.parent`(수집 DB·로그 위치)는 코드가 옮겨지면 달라집니다. 수집 DB 위치를 환경 변수나 인자로 받게 하고 기본값은 `chaekcheck-data` 폴더로 해 주세요. `DEV_SEED`(dev의 도서관 seed CSV 경로)는 저장소 안 상대 경로로 바꿀 수 있습니다
- `resume.cmd`는 `scripts\crawl_catalog.py`·`logs\`를 자기 폴더 기준으로 부릅니다. 새 위치에 맞춰 고쳐 주세요. 두 개가 동시에 돌지 않게 막는 검사(`crawl_catalog.py full` 프로세스 찾기)는 유지
- 실행 환경: Python 3, `beautifulsoup4`, `lxml` (표준 라이브러리 외). `requirements.txt` 또는 문서에 적어 주세요
- git에 넣지 않는 것: `ebook-catalog.sqlite`(수집 DB), `logs/`, `secrets/`(국립중앙도서관 인증키), `other-platforms/`(후보 조사 결과 TSV), `queue-by-ip.txt`(실행 설정), `__pycache__/`, `*.bak-*`
- 개인 정보: 요청 머리글(User-Agent)에 개인 연락처를 넣지 않는 규칙은 유지(`crawl-method.md`)

### C. 끝나면

- dev `docs/plan-feedback.md`에 옮긴 결과(파일 위치, 바꾼 이름, 수집 중 가져오기 판단)를 적어 주세요. plan은 그것을 보고 아래 D를 합니다

### D. plan이 할 일 (dev가 옮긴 뒤, plan 세션)

- `crawl-runbook.md`, `platforms.md`, `periodic-tasks.md` 머리말에 "절차 원본은 dev `docs/maintenance/…`"를 적고 실행 절차는 지움. 진행 상태와 결정 기록은 남김
- `docs/reference-index.md` 원칙 줄과 3·3-1절: 절차는 dev `docs/maintenance/`로 안내
