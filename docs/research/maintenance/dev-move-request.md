# dev에 보낼 요청: 정기 유지보수 절차와 수집 도구를 dev로 옮기기

- 작성 2026-10-04, 고침 2026-10-04 밤(A 끝남 반영, C·D 추가). 근거: `docs/adr/0047-maintenance-procedures-in-dev.md` [확정] (사용자 승인 "그렇게 해줘", 2026-10-04), 수집 일 나눔 `collection-areas.md` [확정] (2026-10-04)
- 붙여 넣을 메시지: `dev-message.md` (2단계 문서 반영: 지금 가능 / 3단계 코드 옮기기: 전체 수집이 끝난 뒤)
- 전달: 사용자가 dev 세션에 전달합니다 [확정] (사용자 선택 "ADR 추가 + 요청서를 내가 dev에 전달"). 사이클 05 인계서(`docs/current/handoff.md`)에는 넣지 않습니다
- 순서 조건: 코드(B·C)는 **전체 수집이 끝나기를 기다리지 않고, 사용자가 정한 때 수집기를 멈춘 뒤** 옮깁니다 [확정] (사용자: "전체 수집이 끝난 다음은 안할꺼고 적당히 자른 다음에 dev에도 반영할거야", 2026-10-04). 남은 도서관(교보 대여·혼합형 등)은 dev로 옮긴 수집기로 이어 받습니다. 수집 DB(`chaekcheck-data\ebook-catalog.sqlite`)는 옮기지 않고, 받던 쪽 기록(`crawl_run`)이 그 안에 있어 이어 받기가 됩니다. 문서(D)는 지금 해도 됩니다
- 아래 파일 이름과 구성은 [안]입니다. dev가 저장소 관례에 맞춰 바꿔도 되고, 바꾸면 `docs/plan-feedback.md`에 적어 주세요

---

## 요청 본문 (dev 세션에 전달)

plan ADR-0047과 "수집 일 나눔"(① 도서관 정보 ② 도서관-책 ③ 가져오기, 2026-10-04)에 따라, 유지보수 절차와 수집 도구를 dev에 모아 주세요. 원칙은 "절차의 원본은 dev, 조사 기록·근거·결정은 plan"(2026-10-01)입니다.

도서관 목록은 둘이고 이름은 이렇게 부릅니다 [확정] (사용자, 2026-10-04): **등록 도서관**(서비스 DB `library`, dev seed, 278곳, 검색에 나옴) / **후보 도서관**(수집 DB `library` 번호 100001~, 웹러브 북스에서 찾음, 2,738곳, 책은 모으지만 검색에 안 나옴).

### A. 문서 옮기기 — 끝남 (2026-10-04, dev `plan-feedback.md` "# 사이클 밖: ADR-0047 옮기기")

`docs/maintenance/README.md`, `1-libraries.md`, `2-crawl.md`, `platforms.md`, `3-import.md`. 고마워요.

### D. 문서에 더할 것 (지금 가능)

옮긴 뒤 plan 수집 세션에서 알게 된 것들입니다. 목록과 문구는 plan `docs/research/ebook-catalog/crawl-runbook.md` **4절 "dev에 반영할 것"** 표에 있습니다(경로: `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\research\ebook-catalog\crawl-runbook.md`). 요약:

| dev 문서 | 더할 것 |
|---|---|
| `2-crawl.md` 2-1절 | 서버(줄)별 동시 요청 수 `--host-slots`, 설정 파일 `host-slots.txt`, 자동으로 1건으로 돌아가는 조건(`SLOTS OFF`). 첫 사용: 교보 대여·혼합형 103.182.126.192 = 4 |
| `2-crawl.md` 4절 | 오디오북 목록 있는 YES24도 이어 받음(`cur_section`, `done_total`). 끝까지 깨지는 쪽을 출판일순으로 다시 읽어 채우기를 북큐브·알라딘에도. 알려진 빈틈: 다시 켜기 전에 건너뛴 쪽은 다시 읽지 않음 |
| `2-crawl.md` 6절 | 알라딘 `startPage`는 0부터 세는 책 순번, 알라딘 `goods_id` 영문 섞임, YES24 오디오북 목록을 못 읽으면 그 목록만 건너뜀, 성공인데 0권(국립군산대) |
| `platforms.md` 8절 | 알라딘 `goods_id` 영문+숫자 |
| `1-libraries.md` 새 절 | 등록 도서관 / 후보 도서관 이름, "후보 도서관 찾기", "구독 규칙·마감 확인" (아래 C의 도구) |

반영한 줄은 plan에 알려 주면(`plan-feedback.md`) plan이 4절 표에서 지웁니다.

### B. 책 수집기 코드 (사용자가 수집기를 멈춘 뒤)

| 옮길 것 | 지금 위치 (git 밖) | 새 위치 [안] |
|---|---|---|
| `crawl_catalog.py` (수집기), `verify_detail_urls.py` | `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\scripts\` | `scripts/crawl/` |
| `resume.cmd` (이어 받기 실행) | `chaekcheck-data\` | `scripts/crawl/` |
| `README.md` (수집 DB 구조, 규칙) | `chaekcheck-data\` | `docs/maintenance/2-crawl.md`에 합치거나 `scripts/crawl/README.md` |

옮길 때 고칠 곳:
- 경로: `crawl_catalog.py`의 `ROOT = Path(__file__).resolve().parent.parent`(수집 DB·로그 위치)는 코드가 옮겨지면 달라집니다. 수집 DB 위치를 환경 변수나 인자로 받게 하고 기본값은 `chaekcheck-data` 폴더로 해 주세요. `DEV_SEED`(dev의 도서관 seed CSV 경로)는 저장소 안 상대 경로로 바꿀 수 있습니다
- `resume.cmd`는 `scripts\crawl_catalog.py`·`logs\`·`queue-by-ip.txt`·`host-slots.txt`를 자기 폴더 기준으로 부릅니다. 새 위치에 맞춰 고쳐 주세요. 두 개가 동시에 돌지 않게 막는 검사(`crawl_catalog.py full` 프로세스 찾기)는 유지
- 실행 환경: Python 3, `beautifulsoup4`, `lxml` (표준 라이브러리 외). `requirements.txt` 또는 문서에 적어 주세요
- git에 넣지 않는 것: `ebook-catalog.sqlite`(수집 DB), `logs/`, `secrets/`(국립중앙도서관 인증키), `queue-by-ip.txt`·`host-slots.txt`(실행 설정), `__pycache__/`, `*.bak-*`
- 개인 정보: 요청 머리글(User-Agent)에 개인 연락처를 넣지 않는 규칙은 유지(plan `crawl-method.md`)
- 이어 받기: 옮긴 뒤 처음 실행할 때 `chaekcheck-data`의 `queue-by-ip.txt`(IP 기준 줄)와 `host-slots.txt`(`103.182.126.192=4`) 설정을 같은 뜻으로 넘겨 주세요. 이 둘이 없으면 도메인 기준 줄, 모든 서버 1건으로 돌아갑니다(예의 규칙은 지켜지지만 느려짐). 처음 실행은 사용자 확인 뒤에

### C. 도서관 정보 도구 (B와 같은 때)

수집 일 나눔에 따라 ① 도서관 정보 도구는 `scripts/library/`로 갑니다 [확정] (사용자, 2026-10-04).

| 옮길 것 | 하는 일 | 새 위치 [안] |
|---|---|---|
| `probe_kyobo_institutions.py`, `probe_yes24.py`, `probe_aladin.py`, `probe_other_platforms.py` | 후보 도서관 찾기: 웹러브 북스 기관 목록의 사이트를 한 번씩 열어 화면 종류·권수 확인 | `scripts/library/` (예: `scripts/library/candidates/`) |
| `probe_kyobo_limits.py` | 구독 규칙·마감 확인: 교보 구독형 사이트의 팝업·공지 제목과 날짜(로그인 없이, 3초 간격) | `scripts/library/` |
| 결과 TSV `chaekcheck-data\other-platforms\*.tsv` | 후보 도서관 찾기·마감 확인 결과(기관 이름·주소·권수·공지 제목) | git에 넣을지 dev가 판단 [확인 필요: 크기와 내용 확인] |

`crawl_catalog.py`의 `import-probe`·`import-bookcube`(후보 도서관을 수집 DB에 넣는 명령)는 수집기 안에 있으니 B와 함께 갑니다. 절차는 `1-libraries.md`에 적어 주세요.

### E. 끝나면

- dev `docs/plan-feedback.md` "# 사이클 밖: ADR-0047 옮기기" 절에 옮긴 결과(파일 위치, 바꾼 이름)를 더해 주세요. plan은 그것을 보고 아래 F를 합니다

### F. plan이 할 일 (dev가 옮긴 뒤, plan 세션)

- `crawl-runbook.md` 4절에서 반영된 줄을 지움
- `docs/reference-index.md`, `collection-areas.md`, `library-limits/research.md`의 도구 위치를 dev `scripts/crawl/`·`scripts/library/`로 고침
- 이미 한 것 (2026-10-04): `crawl-runbook.md`·`platforms.md`·`periodic-tasks.md` 머리말을 "절차 원본은 dev"로, 색인 절을 ①②③으로
