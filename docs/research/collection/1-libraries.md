# 수집 ① 도서관 수집: 어느 전자도서관이 있나

- 작성 2026-10-05. 수집 두 갈래 중 첫째입니다. 둘째(도서관의 책 수집)는 [`2-books.md`](2-books.md)
- 목적: 서비스할 전자도서관 사이트를 찾고(후보 찾기), 한 번씩 열어 확인하고(확인), 이미 있는 사이트를 거르고(같은 사이트 거르기), 수집 DB와 서비스 DB에 넣고(넣기), 도서관 정보(가입 조건, 구독형 규칙·마감, 로고)를 모읍니다. 이 문서는 그 일의 **받는 것 / 내놓는 것 / 원칙 / 결정**을 한 장에 모으고, 자세한 내용은 원래 문서의 절을 가리킵니다.
- 결정 출처 [확정] (사용자, 2026-10-05): "도서관 수집하는거랑(수집하면서 구독형은 마감 여부 확인하는 거랑) 도서관의 책 수집하는 거 그 두가지야". 사이클 07 `docs/cycles/07-candidate-libraries/spec.md` R8, 문서 이름·폴더 [확정] (사용자 승인, 2026-10-05)
- **절차 원본은 dev입니다** (ADR-0047): dev `docs/maintenance/1-libraries.md`(후보 도서관 찾기, 구독 규칙·마감 확인), 등록 도서관 확인은 그 파일이 가리키는 dev `docs/library-maintenance.md`, 플랫폼별 화면은 dev `docs/maintenance/platforms.md`, 세 작업의 순서는 dev `docs/maintenance/README.md` (`C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev\docs\maintenance\`). 이 문서에는 원칙·조사·결정만 둡니다. 둘이 어긋나면 dev 절차가 맞습니다.
- 다음 단계: ② 책 수집([`2-books.md`](2-books.md)) → 가져오기(수집 DB → 서비스 DB). 가져오기는 새 백엔드 모듈 `collection`이 맡습니다 [확정] (ADR-0060). 절차는 dev `docs/maintenance/3-import.md`

## 1. 받는 것 (입력)

| 입력 | 어디 | 근거 |
|---|---|---|
| 교보 공식 기관 목록 | plan `docs/cycles/02-library-expansion/data/kyobo-institutions.tsv` (2,000줄 → 사이트 1,937곳) | `crawl-runbook.md` 8-1절 |
| 웹러브 북스 기관 목록 (YES24·북큐브·알라딘) | https://ebook.okbari.net/library 를 브라우저로 모은 `chaekcheck-data/other-platforms/okbari-2026-10-03/*.tsv`. 제3자 자료, 수집 기준일 2026-02-06으로 보임 | `crawl-runbook.md` 8-1절, dev `1-libraries.md` "후보 도서관 찾기" |
| 그 밖의 목록 출처 (등록 도서관 확인용) | 공공데이터포털 전국도서관표준데이터, 통합 포털 목록 (dev `library-maintenance.md` 4-0~4-5) | `periodic-tasks.md` 1절 |
| 등록 도서관 목록 | dev seed (서비스 DB `library`, 278곳) | `collection-areas.md` 2절 3번 |
| 수집 DB의 도서관·책 목록 | `chaekcheck-data\ebook-catalog.sqlite`의 `library`(번호·주소), `holding`(책 코드 `item_key`). 같은 사이트 거르기와 넣기(seed)에 씀 | `collection-areas.md` 2-2절, 사이클 07 `design-delta.md` "데이터" |
| 도서관 사이트 | 첫 화면(열리는지·화면 종류·권수, 교보는 `library_model`), 교보 구독형 팝업·공지, 가입 안내 원문, 머리말 로고 | dev `1-libraries.md`, `library-limits/research.md` 3-1절, `library-join/candidates.md` 1절, `maintenance/library-logos.md` 2절 |
| 본 홈페이지 주소 (로고용) | dev 도서관 seed의 `join_url` | `library-logos.md` 3-1절 |

## 2. 내놓는 것 (결과물)

단계마다 나오는 것입니다. 경로의 `chaekcheck-data`는 git 밖 데이터 폴더입니다.

> (2026-10-14) 아래 "넣기 (서비스 DB seed)"·"넣기 = seed 만들기"·"같은 사이트 거르기"의 seed 스크립트(`build_candidate_seed.py`, `SAME_SITE`)는 **사이클 07 때 방법의 기록**입니다. 사이클 13부터는 `collection` 넣기 명령(미리 보기 → 보고서 → 넣기, ADR-0084·0093·0107·0110)과 dev 규칙 TSV `scripts/library/rules/`(`same_site.tsv`·`same_host_kept.tsv`·`final_origins.tsv` 등, ADR-0085)를 씁니다.

| 단계 | 결과물 | 경로 | 근거 |
|---|---|---|---|
| 확인 (probe) | 사이트마다 열림·화면 종류·권수 | `other-platforms/kyobo-institutions-probe-2026-10-03.tsv`(교보, `library_model` 칸), `other-platforms/okbari-2026-10-03/yes24-probe.tsv`, `bookcube-probe.tsv`, 알라딘 결과 | `crawl-runbook.md` 8-1절 |
| 넣기 (수집 DB) | 수집 DB `library` 줄: 번호 100001~, `source = okbari-2026-09-30`·`okbari-2026-10-03`·`okbari-2026-10-03-rental`. 알라딘은 `base_url` 뒤 `?nav_code=…` | `chaekcheck-data\ebook-catalog.sqlite` | dev `1-libraries.md` "후보 도서관 찾기" |
| 같은 사이트 거르기 | 대조 결과, 짝 맞추는 표(후보 번호 → 등록 번호, 같다고 본 이유), 수집 DB `library.crawl_skip` 표시 | `other-platforms/overlap-registered-candidates-2026-10-05.tsv`, plan `docs/research/ebook-catalog/data/same-site-candidates-2026-10-05.tsv` | `collection-areas.md` 2-2절 |
| 넣기 (서비스 DB seed) | Liquibase seed CSV: `library.library` 후보 도서관 줄(`join_survey`, `lending_model` 등), `library.eligibility_rule` 가입 규칙 줄, `collection.collection_link` 짝 줄. 파일 이름 `library/008-library-seed-candidates.yaml`(+ `008-library-candidates.csv`, `008-eligibility-rule-candidates.csv`), `collection/002-collection-seed-candidates.yaml`(+ `002-collection-link.csv`) [확정] (dev 구현 확인, 2026-10-05). 만드는 스크립트 dev `scripts/library/build_candidate_seed.py` | dev `backend/src/main/resources/db/changelog/` | 사이클 07 `design-delta.md` "데이터", ADR-0052, 사이클 07 `retro.md` |
| 가입 조건 | 후보 도서관 종류 표, 공공도서관 가입 조건 표(`eligibility`, `quote`, `source_url`, `decision` 칸) | `chaekcheck-data/library-join/candidate-kinds-2026-10-05.tsv`, `public-join-2026-10-05.tsv` | `library-join/candidates.md` 3절 |
| 구독 규칙·마감 | 마감 확인 결과, 처음 본 팝업·공지 기록, 팝업 그림 | `other-platforms/kyobo-limits-2026-10-04.tsv`, `other-platforms/kyobo-limits-log.tsv`, `other-platforms/kyobo-limits-images/` | `library-limits/research.md` 3-1절 |
| 로고 | 로고 파일과 매핑 표, 등록 도서관 결과 표(`status` = `OWN`/`VENDOR_DEFAULT`/`NONE`) | `chaekcheck-data/logos/<library_id>.<확장자>`, `logos/logos.tsv`, `logos/registered-logos-2026-10-05.tsv` | `library-logos.md` 1·3-1절 |

- 결과 TSV(`other-platforms\*.tsv`)는 git에 넣지 않음 (dev 판단, 2026-10-05, dev `1-libraries.md` "후보 도서관 찾기")

## 3. 원칙

| 원칙 | 내용 | 태그와 출처 |
|---|---|---|
| 수집은 두 갈래 | ① 도서관 수집(후보 찾기·확인·같은 사이트 거르기·넣기, 구독형 마감 여부 확인) / ② 도서관의 책 수집. 가져오기는 그 뒤 단계 | [확정] (사용자 승인, 2026-10-05, spec R8). 이전 나눔(① 도서관 정보 ② 도서관-책 ③ 가져오기, `collection-areas.md` 2절 1번)과 같은 경계 |
| 도서관 정보는 ① | 웹러브 북스 기관 찾기와 마감 확인은 ①. 도구는 dev `scripts/library/` | [확정] (사용자 승인, 2026-10-04, `collection-areas.md` 2절 2번) |
| 목록 이름 | **등록 도서관**(서비스 DB, dev seed, 278곳) / **후보 도서관**(수집 DB 번호 100001~, 웹러브 북스에서 찾음, 2,738곳) | [확정] (사용자 승인, 2026-10-04, `collection-areas.md` 2절 3번) |
| 도서관 목록 원본 | 서비스 도서관 표 하나. ①이 찾은 도서관은 수집 DB에 먼저 들어가고, 가져올 때 짝 표(`collection.collection_link`)로 서비스에 이어짐 | [확정] (사용자 승인, 2026-10-05, spec R8, ADR-0052) |
| 제3자 목록은 그대로 믿지 않음 | 웹러브 북스 목록은 2단계(확인)에서 한 번씩 열어 봄. 이미 있는 주소는 넣기에서 건너뜀 | [안] 절차로 쓰는 중, 사용자 확인 기록 없음 (`crawl-runbook.md` 8-1절, dev `1-libraries.md`) |
| 호출 예의 | 같은 호스트 한 번에 1건, 1초 이상 간격. 확인 스크립트는 서버마다 1건·1초 고정(`--workers`·`--host-slots` 받지 않음). 수집과 같은 서버를 동시에 치지 않게 띄우기 전에 확인 | [확정] (사이클 01 spec 5.6), 고정 동작은 dev `1-libraries.md` |
| 같은 사이트 거르기 | 후보를 넣을 때 주소 문자열만 보지 않고 **http/https·포트를 무시한 호스트**로 비교하고, 같은 호스트면 **책 목록(`item_key`)이 겹치는지**까지 봄 | [확정] (사용자, 2026-10-05, spec R8, `crawl-runbook.md` 4절 2026-10-05 줄) |
| 같은 사이트 처리 | 지우지 않고 `crawl_skip`에 "same site as registered library N …" 표시(되돌릴 수 있음). 서비스에 넣을 때 뺌. 짝 맞추는 표는 남김(책은 등록 번호로 받음) | [확정] (사용자, 2026-10-05, `collection-areas.md` 2-2절) |
| 넣기 = seed 만들기 | 후보: 수집 번호 ≥ 100001, `crawl_skip` 없음, `last_full_success_at` 있음, 체험용·운영 중단 4곳 제외. 새 번호는 지금 최대(280) 다음부터, 등록 도서관 짝은 같은 번호. 이름 겹침 규칙, `homepage_url = base_url`. 시험용 6곳은 넣지 않음. 사이클 07 결과: 2,394곳(서비스 번호 281~2674) | [확정] (사이클 07 `design-delta.md` "데이터" seed 규칙, ADR-0052; 결과 dev `plan-feedback.md` "# 사이클 07" 1단계, 2026-10-05) |
| 넣기 전 같은 사이트 거르기 (사이클 07) | seed 스크립트(`build_candidate_seed.py`)가 호스트(http/https·포트 무시)가 등록 도서관과 같은 후보의 `item_key` 겹침을 셈. 읽어 본 쌍은 스크립트에 적어 둠(뺄 곳 `SAME_SITE`, 넣을 곳 `SAME_HOST_KEPT`), 새로 걸리는 쌍이 있으면 종료 코드 2로 멈춤. 2026-10-05: 양쪽 책 번호 목록이 같고 상세 주소가 포트만 다른 8곳 뺌, 같은 기관의 다른 북큐브 사이트 6곳은 넣음. 수집기 `import-probe`에는 넣지 않음(넣기에서 반드시 거름, dev 판단) | [확정] (사용자 결정 "① 8곳만 빼기", 2026-10-05; 방법 dev `docs/maintenance/1-libraries.md` "같은 사이트 거르기", 2026-10-05) |
| 넣기 주소 = 최종 주소 | 후보 `base_url`은 리다이렉트를 따라간 https 최종 주소(dev `scripts/library/CheckFinalOrigins.java`, 2026-10-05에 248곳 바꿈). dev `library-maintenance.md` 4-7 1번을 후보에도 적용 | [확정] (사용자 요청: 강동대학교 북큐브 "검색해도 안나오고", 2026-10-05, 사이클 07 `retro.md`) |
| 가입 조사 상태 | 조사된 후보 공공도서관은 `SURVEYED` + 가입 규칙, 원문 못 찾은 곳 `NOT_FOUND`, 초·중·고·대학·회사·기관 등 `MEMBERS_ONLY`, 모름 `NOT_SURVEYED`. 값 이름 [확정] (dev 구현 확인, 2026-10-05). 기관 소속 규칙은 기관 표가 없어 쓰지 않음 → 소속 전용 공공도서관(대구학생전자도서관 100049)은 `MEMBERS_ONLY` | [확정] (ADR-0053, `design-delta.md` "데이터"; 소속 전용은 사용자 결정 "구성원용으로", 2026-10-05) |
| 가입 조건 없는 도서관 | 그 사용자가 내 도서관에 넣지 않았으면 검색에 나오지 않고 요청도 보내지 않음 | [확정] (사용자, 2026-10-04, `collection-areas.md` 2-1절) |
| 가입 조건 조사 방법 | 원문 우선, 추정 금지. 정회원·회원증 발급 대상이 자격 | [확정] dev `library-maintenance.md` 4-8절 (`library-join/candidates.md` 1절) |
| 구독형 마감: 무엇을 보나 | 교보 구독형 사이트의 팝업·공지 제목과 날짜를 **로그인 없이, 3초 간격**으로 읽음. 본문이 그림이면 내려받아 사람이 읽음 | 방법 dev `1-libraries.md` "구독 규칙·마감 확인", 근거 `library-limits/research.md` 3-1절 |
| 구독형 마감: 한계 | **"공지 없음"은 "이용 가능"이 아님.** 월 예산 소진은 로그인하고 대출을 눌러야 보임 | [확정] (`library-limits/research.md` 1·2절, 용인 공지 https://lib.yongin.go.kr/mobile/bbs/20005/bbsPostDetail.do?postIdx=274665 , 확인 2026-10-04) |
| 구독형 알리기 | 도서관별 고정 규칙(1인 월 권수, 매달 1일, 운영 기간)을 보여 줌. 마감 공지가 있으면 마감 표시를 켜고 다시 열리는 날이 지나면 끔. 실시간 아님 | [확정] (사용자 승인, 2026-10-04, `library-limits/research.md` 4절) |
| 로고 범위 | 받는 것은 등록 도서관만(후보 도서관 로고는 받지 않음). 보여 주는 것은 공공도서관만, 회사 로고·업체 기본 로고 제외 | [확정] (사용자, 2026-10-05, `library-logos.md` 3-1·4절) |
| 로고 호출 예의 | IP 하나에 한 줄, 한 번에 1건, 요청 사이 2초, 도서관마다 1~2건 | 값은 `library-logos.md` 2절에 태그 없음 [안] |
| 업체 기본 로고 판별 | 같은 그림이 3곳 이상이면 업체 기본 로고 | [안] (`library-logos.md` 3-1절) |

### 마감 확인이 읽는 주소: 3개가 지금 것

- plan 문서끼리 달랐음 (dev `docs/plan-feedback.md` 1128행이 알림): `crawl-runbook.md` 4절은 3개(`/popup/popupMain.json`, `/main/firstBoardBlbrSrmb.json`, `/board/listBoard.json`), `library-limits/research.md` 3-1절은 팝업과 `listBoard.json` 2개
- dev `1-libraries.md` "구독 규칙·마감 확인"은 3개를 따름
- dev 코드 `scripts/library/probe_kyobo_limits.py`(2026-10-05 읽음)도 3개를 부름: `firstBoardBlbrSrmb.json`으로 첫 공지 게시판 번호(`blbrSrmb`)를 얻어 `listBoard.json`에 넘김. 그래서 **3개가 지금 것** [확정] (dev 코드 확인, 2026-10-05). `research.md` 3-1절은 게시판 번호를 얻는 중간 단계를 빼고 적은 것

## 4. 결정 기록

| 날짜 | 결정 | 사용자 말 | 태그 |
|---|---|---|---|
| 2026-10-03 | 웹러브 북스 나머지 기관을 플랫폼마다 찾기 → 확인 → 넣기 → 받기, 서버가 다르면 병렬 | "시작해줘", "병렬적으로 수집하면 안 돼?", "교보 따로 다른 사이트들 따로" | [확정] (`crawl-runbook.md` 8절) |
| 2026-10-04 | 수집 일을 나누고 기관 찾기·마감 확인을 도서관 정보 쪽으로 | "이런것들 먼저 정리하고 plan dev랑 각 문서들 읽는거랑 링크처리 다 하고 다른 plan이랑 dev에게 알려줄 작업들 해야 할 것 같은데" | [확정] (`collection-areas.md` 2절) |
| 2026-10-04 | 등록 도서관 / 후보 도서관 이름 (첫 제안 "서비스 도서관"/"수집 전용 기관"은 미승인) | "무슨 뜻인지 이름이 직관적이지 않아 뭘 말하고 싶은 거야? 적합한 여러 이름 후보좀" → 후보 4개 중 1번 | [확정] (`collection-areas.md` 2절 3번) |
| 2026-10-04 | 도서관은 한 표, 가입 조건은 따로. 가입 조건 없는 도서관은 내 도서관에 넣어야 보이고 요청도 안 보냄 | "'나'로 하도록 하고 직장/거주 없는 도서관들은 따로 '내 도서관'에서 등록하지 않은 한 기본적으로 안 보였으면 해 요청도 보내지 말고" | [확정] (`collection-areas.md` 2-1절) |
| 2026-10-04 | 구독형 한도 알리기(고정 규칙, 마감 표시) | "일단 이렇게 하되 나중에 클릭하면 정보가 보인다거나 이런 식으로 바꿀 수 있음" | [확정] (`library-limits/research.md` 4절) |
| 2026-10-04 | 구독 규칙을 어디에 둘지는 미룸 | "따로 구독 규칙을 두는게 나을 것 같은데.... 이건 일단 지금 정하지 말고 나중 사이클에 정하도록 하자" | [확인 필요: 사이클에서 결정] |
| 2026-10-04 | 마감 공지를 사이클 전까지 쌓아 두기 (`limits-daily.cmd`) | "그렇게 해줘 나중에 반영할 수 있게" | [확정] (`library-limits/research.md` 3-1절) |
| 2026-10-05 | 등록 도서관과 같은 사이트인 후보 99곳은 `crawl_skip`, 서비스에 넣을 때 뺌, 짝 표 남김. 앞으로 호스트(http/https·포트 무시) + 책 목록 겹침으로 거름 | "이렇게 하고 다른 plan세션에게 알려주게 텍스트좀", "만약 포함된다면 매핑 정보는 줘야 할 것 같은데" | [확정] (`collection-areas.md` 2-2절) |
| 2026-10-05 | 후보 도서관 가입 조건 조사, 7개 결정(전주·고창·전남교육청·제천·익산, 체험용 4곳 제외, 원문 못 찾으면 자격 미확인) | "후보 도서관들 가입 조건도 같이 조사해줘" | [확정] (`library-join/candidates.md` 3절) |
| 2026-10-05 | 로고 수집, 후보 도서관 로고는 받지 않음, 공공도서관만 보여 줌 | "도서관 로고도 같이 수집했으면 해...", "후보 도서관은 하지 말라는 뜻", "그냥 공공도서관? 공개된 도서관만 로고 해주고" | [확정] (`library-logos.md` 3-1·4절) |
| 2026-10-05 | 후보 도서관은 서비스 새 번호, 짝 표는 새 모듈 `collection`, seed로 넣음 | "서비스에서 새 번호를 주고 짝 맞추는 표를 둠", "따로 모듈로 가고 나중에 수집 연결 모듈이 고치라고 해". seed로 넣는 이유 [이유 미확인] | [확정] (ADR-0052) |
| 2026-10-05 | 수집을 두 갈래로, 이 문서와 `2-books.md`로 정리. dev 절차·코드 정리는 인계서로, 돌고 있는 수집기는 멈추지 않고 갈아타기는 한 바퀴 끝난 뒤 | "도서관 수집하는거랑(수집하면서 구독형은 마감 여부 확인하는 거랑) 도서관의 책 수집하는 거 그 두가지야" | [확정] (spec R8) |

## 5. 진행 상태 (숫자는 아래 문서에서 봄)

| 무엇 | 어디 |
|---|---|
| 후보 도서관 찾기 진행(플랫폼별 열림·오류·넣은 곳) | `docs/research/ebook-catalog/crawl-runbook.md` 8-2절 |
| 같은 사이트 대조 결과 | `docs/research/maintenance/collection-areas.md` 2-2절 |
| 구독형 도서관별 마감 현황 | `docs/research/library-limits/research.md` 3-1절 |
| 후보 도서관 가입 조건 조사 진행·결과 | `docs/research/library-join/candidates.md` 2·3절 |
| 로고 수집 결과 | `docs/research/maintenance/library-logos.md` 3-1절 |
| 넣기(seed)·`collection` 모듈 구현 | 구현됨 (사이클 07): `docs/cycles/07-candidate-libraries/retro.md`, 쉬운 설명 `docs/cycles/07-candidate-libraries/easy/2026-10-05-collection-to-import.html`, dev `docs/plan-feedback.md` `# 사이클 07` |

## 6. dev 절차·코드 위치

| 일 | dev 절차 | dev 코드 (또는 지금 위치) |
|---|---|---|
| 등록 도서관 확인 (목록 출처, 화면 종류, 주소 확정, 운영 신호, 책 번호 점검) | `docs/library-maintenance.md` (자리표는 `docs/maintenance/1-libraries.md` "등록 도서관 확인: 어디를 보나") | `scripts/library/CheckKyoboSites.java`, `CheckYes24Sites.java`, `check_code_spaces.py` |
| 가입 자격·가입 방법 | `docs/library-maintenance.md` 1-1, 1-2, 4-8, 4-10, 14절 | `scripts/library/join_overrides.tsv`(사람이 정한 값이 마지막에 이김, `periodic-tasks.md` 1절) |
| 후보 도서관 찾기 (확인 → 수집 DB에 넣기) | `docs/maintenance/1-libraries.md` "후보 도서관 찾기" | `scripts/library/discover/probe_kyobo_institutions.py`, `probe_yes24.py`, `probe_aladin.py`, `probe_other_platforms.py`. 넣기 `scripts/crawl/crawl_catalog.py import-probe`·`import-bookcube` |
| 구독 규칙·마감 확인 | `docs/maintenance/1-libraries.md` "구독 규칙·마감 확인" | `scripts/library/probe_kyobo_limits.py`, `limits-daily.cmd` |
| 같은 사이트 거르기, 넣기(seed 생성), 최종 주소 확인 | `docs/maintenance/1-libraries.md` "같은 사이트 거르기", "넣기(서비스 DB)" (사이클 07에 더함, 2026-10-05) | `scripts/library/build_candidate_seed.py`(테스트 `test_build_candidate_seed.py`), `scripts/library/CheckFinalOrigins.java` |
| 가져오기 (수집 DB 사본 → 서비스 DB) | `docs/maintenance/3-import.md` | 백엔드 `collection` 모듈, 프로필 `collection-import` |
| 로고 받기 | 아직 없음 | dev `scripts/library/probe_logos.py`, `probe_home_logos.py` (옮김 확인 2026-10-14, `library-logos.md` 머리말) |
| 화면 종류별 첫 화면·목록 | `docs/maintenance/platforms.md`, `docs/library-maintenance.md` 1-3, 4-6 | — |

- dev 코드는 2026-10-05 복사됨(ADR-0047 B·C, dev `plan-feedback.md` "B·C"). 지금 돌고 있는 것은 옛 복사본 `chaekcheck-data\scripts\`이고, 갈아타는 때는 사용자가 정함 (dev `2-crawl.md` 0절)

## 7. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| ~~같은 사이트 거르기 규칙(http/https·포트 무시 + `item_key` 겹침)이 dev `import-probe`·seed 생성에 들어갔는지~~ | 해결: seed 스크립트 dev `scripts/library/build_candidate_seed.py`에 들어감(`SAME_HOST_KEPT`, 새 쌍이면 종료 코드 2). `import-probe`에는 넣지 않음(dev 판단) (dev `docs/maintenance/1-libraries.md`, `plan-feedback.md` "# 사이클 07" 1·18단계, 2026-10-05) |
| ~~새 도서관을 넣을 때 seed 번호가 겹치지 않는 규칙("마지막 번호 다음")~~ | 해결: 구현·테스트됨("새 후보 1곳만 다음 번호", 두 번 돌려도 같음) (dev `scripts/library/test_build_candidate_seed.py`, 2026-10-05) |
| 리다이렉트로 호스트까지 바뀐 도서관(411 `ebook2.ezville.net` → `gsenc.bookcube.biz`)을 수집 쪽과 어떻게 이을지 | 사용자에게 질문 (사이클 07 `retro.md` "새로 알게 된 제약") |
| 같은 서버 북큐브 주소(`/FxLibrary`) 7곳이 같은 교보 목록을 보여 주는지 | API 호출 시험 (`collection-areas.md` 2-2절) |
| 알라딘 후보 나머지 69곳(`aladin-later.tsv`) | 확인 스크립트로 확인 (`crawl-runbook.md` 8-2절) |
| 웹러브 북스 목록 기준일(2026-02-06으로 보임) | 공식 문서 확인 (사이트 표시) |
| ① 도서관 목록 확인 주기 (월 1회 [안]) | 사용자에게 질문 (`periodic-tasks.md` 6절) |
| 교보 구독형에서 마감 때 나오는 문구와 위치 | 월말에 로그인한 이용자(사용자)가 대출을 눌러 봄 (`library-limits/research.md` 5절) |
| 마감 공지가 얼마나 자주, 어떤 말로 올라오는지 / 뉴스레터가 끊긴 것(제주한라)이 마감 신호인지 | 16곳 공지 게시판 한 번씩 확인 |
| 구독 규칙 값을 도서관 정보와 따로 둘지 | 사이클에서 결정 (사용자가 "따로" 쪽) |
| 마감 확인 매일 자동 실행(작업 스케줄러) 등록 | 사용자에게 질문 |
| 이름으로 나눈 후보 도서관 종류가 맞는지, 소속 전용 표본 확인(미착수) | 원문 확인, 애매한 곳은 사용자에게 질문 (`library-join/candidates.md` 4절) |
| 가입 조건이 확인된 후보 공공도서관을 등록 도서관처럼 지역에 맞춰 보이게 할지 | 사용자에게 질문 (사이클에서) |
| 공공도서관인지 아닌지(로고를 보여 줄 범위) | 도서관 종류 분류 (사이클에서 확정) |
| 교육청 통합 홈페이지·`join_url` 없는 18곳의 로고 받는 방법 | 프로토타입 (`library-logos.md` 3-1절) |
| 업체 기본 로고 판별 기준(3곳 이상 [안]) | 사용자에게 질문 |
| 로고의 조례상 승인 대상 여부, 상표 등록 여부 | 공식 문서 확인, KIPRIS 조회 (`library-logos.md` 5절) |
