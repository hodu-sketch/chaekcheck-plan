# 전자책 목록 수집 안내 (입구 문서)

- 작성: 2026-09-30, 크게 고침 2026-10-01
- 목적: 다른 세션(사람이나 AI)이 전자도서관 책 목록 수집을 **이어 받거나, 다시 돌리거나, 새 사이트를 붙일 때** 가장 먼저 읽는 문서입니다. 자세한 내용은 아래 문서로 나눠 두었습니다.
- 사용자 요청 (2026-09-30~10-01): "큰 교보 구독형 16곳을 받아줬으면 해 예의를 지켜서", "이 컴을 끌 수도 있고 그래서 다음에 이어서 잘 받도록 문서 작성해 줘", "북큐브 134곳 목록 … 받아줘", "278곳 먼저가 우선인데 웹러브 북스에 있는 책은 거의 다 수집", "db에 오디오북 표시좀 해줘라", "각 도서관 도서의 상세페이지 url도 꼭 있어야 해", "실패한 11곳도 방법 찾아서 수집해줘", "크롤링하는 방법들 다른 세션이 잘 참고하게 문서화"

## 0. 읽는 순서

| 순서 | 문서 | 무엇을 알 수 있나 |
|---|---|---|
| 1 | 이 문서 `crawl-runbook.md` | 지금 상태, 이어 받기, 명령, 문제별 대처, 새 사이트 붙이는 순서 |
| 2 | `platforms.md` | **플랫폼별 크롤링 방법**: 검색 주소, 전체 목록 주소, 한 쪽 크기, 줄 선택자, 상세 URL, 오디오북 구분, 사이트별 예외 |
| 3 | `crawl-method.md` | 원칙(호출 예의, 저장 범위, 날짜 3층, 수집 항목)과 그 근거가 된 사용자 결정 |
| 4 | `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\README.md` | 수집 DB(`ebook-catalog.sqlite`) 표·칸 설명, 파일 목록 |
| 참고 | `research.md` | 왜 모으는지, 법적 쟁점, 첫 조사 |
| 참고 | `catalog-refresh.md` | 주기 갱신(별도 사이클) 참고. **운영에서 새로 알게 된 것은 그 문서 "변경 기록"에 더함** |
| 참고 | `search-and-normalization.md`, `same-book-isbn.md` | 모은 값을 검색용으로 정리하고 같은 책을 묶는 규칙(다른 세션 작성). 수집 DB는 원문만 두고 정리는 거기서 |
| 색인 | `docs/reference-index.md` 3절 | plan 전체에서 이 문서들이 어디에 있는지 |

코드는 모두 `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\scripts\`에 있습니다. 두 저장소(plan, dev) 밖이고 git이 아닙니다.

| 파일 | 역할 |
|---|---|
| `crawl_catalog.py` | 수집기. 도서관 목록 불러오기, 전체 수집, 이어 받기, 상태, 다시 받기 표시, 받지 않기 표시 |
| `verify_detail_urls.py` | 도서관·종류마다 상세 URL 한 건을 열어 그 책 제목이 나오는지 확인 |
| `probe_other_platforms.py` | 북큐브·알라딘 후보 사이트를 한 번씩 호출해 열리는지·권수 확인 |
| `..\resume.cmd` | 이어 받기 한 번 실행(두 개 동시 실행을 막음) |

## 1. 지금 상태 (2026-10-01 07:07)

| 순위 | 대상 | 도서관 | 끝남 | 받지 않음 | 남음 |
|---|---|---|---|---|---|
| 1 | dev seed의 켜진 도서관 (교보·YES24·포털·강남구·작은 구독형) | 262 | 253 | 4 (5-1절) | 5 (강서·경산·영천·칠곡·경기교육청 포털, 다시 받는 중) |
| 2 | 큰 교보 구독형 | 16 | 6 | 0 | 10 (제주한라 받는 중, 9곳 대기. 한 곳 3~4시간) |
| 3 | 북큐브 (웹러브 북스 목록에서 공공으로 보이고 열린 곳) | 134 | 134 | 0 | 0 |
| 4 | 웹러브 북스 나머지 기관 (교보 전 기관, YES24·알라딘 전 기관) | 아직 목록에 안 넣음 | — | — | 5절 |

- DB: 4,286,358줄 (빠짐 표시 제외 4,286,239줄). 종류: 전자책 4,232,793 / 오디오북 48,293 / 동영상북 2,522 / 키즈북 3,003 / 학술논문 74 / 모름 601
- 이 표는 시점 값입니다. 지금 값은 3절 `status`로 봅니다.

## 2. 받는 순서 [확정] (사용자, 2026-09-30: "278곳 먼저가 우선인데 웹러브 북스에 있는 책은 거의 다 수집")

- 순위 1 → 2 → 3 → 4. 순서는 **같은 호스트 안에서** 지키고, 호스트가 다르면 동시에 받습니다.
- 호출 예의: 같은 호스트 한 번에 1건, 1초 이상 간격 [확정] (사이클 01 spec 5.6). `*.dkyobobook.co.kr`, `*.bookcube.biz`, `*.dasangng.co.kr`, `*.aladinebook.co.kr`은 각각 한 서버로 봅니다. 포트만 다른 사이트(`ebook.jbe.go.kr:10031`, `:10111` …)도 같은 호스트입니다.
- 큰 교보 구독형 16곳은 모두 한 서버라 한 곳씩 차례로 받습니다(한 쪽 80권 약 4초, 한 곳 3~4시간).

## 3. 이어 받기와 상태 보기

PC를 켠 뒤 한 번 실행합니다. 몇 번을 실행해도 안전합니다.

```
C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\resume.cmd
```

- 끝난 도서관은 건너뛰고, 받다 멈춘 도서관은 저장된 마지막 쪽 다음부터 이어 받습니다.
- 이미 수집이 돌고 있으면 두 번째는 시작하지 않습니다. 로그는 `chaekcheck-data\logs\crawl-{날짜_시각}.log`.
- Bash에서 부를 때는 `cmd //c resume.cmd`가 파일을 못 찾으므로 PowerShell에서 `& "…\resume.cmd"`로 부릅니다.
- **Windows 절전**이 켜져 있으면 멈춥니다. 오래 받을 때는 절전을 끄거나 다시 실행합니다.

상태 보기:

```
python -X utf8 scripts\crawl_catalog.py status
```

```sql
-- 도서관별 마지막 실행
SELECT l.id, l.name, l.platform_type, r.status, r.last_page, r.site_total, r.rows_seen, r.started_at, r.error, l.crawl_skip
FROM library l LEFT JOIN crawl_run r ON r.id = (SELECT max(id) FROM crawl_run WHERE library_id = l.id)
ORDER BY r.status, l.id;

-- 전체 목록을 한 번도 끝까지 받지 못한 도서관
SELECT id, name, platform_type, crawl_skip FROM library WHERE last_full_success_at IS NULL;
```

## 4. 수집기가 하는 일 (규칙 요약)

| 상황 | 동작 |
|---|---|
| 목록이 하나인 사이트(교보, 교보 구독형, 강남구, 북큐브, 오디오북 메뉴 없는 YES24) | `crawl_run.last_page`까지 저장. 다음 실행 때 그 다음 쪽부터 |
| 목록이 여럿인 사이트(포털 EBK·ADO, 오디오북 메뉴 있는 YES24) | 처음부터 다시(작아서 괜찮음) |
| 이어 받을 실행 고르기 | 그 도서관의 **마지막** 실행이 "받는 중"일 때만 이어 받음. 더 오래된 "받는 중"은 버림 |
| 다시 받을 도서관 고르기 (`--retry-failed`) | 마지막 실행이 실패·불일치·받는 중이거나, **전체 목록을 한 번도 끝까지 받지 못한** 곳 (오디오북 목록만 성공한 경우 포함) |
| 성공 판정 | 서로 다른 책 수가 사이트 총 건수와 1% 안, 또는 **읽은 줄 수**가 총 건수와 1% 안(목록 안에 같은 책이 겹치는 교보 구독형). 포털은 총 건수가 없어 빈 쪽까지 읽으면 성공 |
| 빠진 책 | 성공한 전체 수집에서만, 이번에 못 본 줄에 `removed_at`을 찍음(지우지 않음). 받은 구역(`section`) 안에서만 |
| 요청 실패 | 30초 간격 3번 다시. 첫 쪽이면 그 도서관 실패 |
| 목록 대신 오류 화면 | 같은 쪽을 30초 간격 3번 다시 읽음(영천·영주에서 봄) |
| 한 쪽만 늘 깨짐(HTTP 5xx) | 그 쪽만 건너뛰고 계속. YES24면 끝난 뒤 **출판일순으로 한 번 더** 읽어 빠진 책을 채움(아산 131쪽, 금산 20쪽). 건너뛴 쪽은 `crawl_run.error`에 적음 |
| 책 코드 없는 줄 | 그 줄만 건너뛰고 개수를 `crawl_run.error`에 적음. 총 건수 비교에서 뺌 |
| 받지 않는 도서관 | `library.crawl_skip`에 이유가 있으면 건너뜀(5-1절) |
| 오디오북·상세 URL | `content_type`·`is_audiobook`·`kind_check`·`detail_url`은 SQLite 트리거가 채움(6·7절) |

## 5. 명령 모음 (`chaekcheck-data` 폴더에서)

| 명령 | 하는 일 |
|---|---|
| `python -X utf8 scripts\crawl_catalog.py init` | dev seed CSV에서 도서관 목록을 다시 읽음(dev 파일은 읽기만). 이미 있는 줄은 갱신 |
| `… import-bookcube [--probe 파일]` | `probe_other_platforms.py` 결과에서 열린 북큐브 사이트를 도서관으로 넣음(id 100001부터, `source=okbari-2026-09-30`) |
| `… full --retry-failed --include-big-subscription --audio-pass --workers 40` | 이어 받기(`resume.cmd`가 부르는 것) |
| `… full --only 12,13` | 도서관 몇 곳만 |
| `… full --platforms YES24_V1,YES24_V2` | 화면 종류 몇 개만 |
| `… full --sections AUDIO` | YES24 오디오북 목록만(그 구역 안에서만 빠짐 표시) |
| `… full --limit-pages 2` | 시험 삼아 앞 두 쪽만(결과는 불일치로 남음) |
| `… invalidate --platforms X,Y --reason "이유"` | 그 화면 종류 도서관을 모두 처음부터 다시 받게 표시(파서를 고친 뒤) |
| `… status --skip {id} "{이유}"` | 그 도서관을 받지 않게 표시. 이유를 `""`로 주면 다시 받음 |
| `… backfill-types` | 오디오북 표시·상세 URL을 모든 줄에 다시 계산(수집이 돌 때는 오래 막히므로 멈춘 뒤에) |
| `… status` | 상태 요약 |
| `python -X utf8 scripts\verify_detail_urls.py [결과.tsv] [화면종류,…]` | 상세 URL 확인. **수집과 같은 서버를 동시에 치지 않게** 화면 종류를 골라서 |
| `python -X utf8 scripts\probe_other_platforms.py 입력.tsv 결과.tsv` | 후보 사이트 한 번씩 확인(입력: platform, name, url) |

## 5-1. 받지 않는 도서관 (`library.crawl_skip`)

주기 갱신 때 다시 확인할 대상입니다. 차단된 곳을 받으려면 도서관에 자동 수집 허용이나 자료 제공을 문의하는 것이 방법입니다 [안]. **브라우저 흉내나 차단 우회는 하지 않습니다.**

| id | 도서관 | 이유 (2026-10-01) |
|---|---|---|
| 44 | 국회도서관 | 브라우저가 아닌 요청에는 머리글과 관계없이 빈 쪽(19바이트). 자동 접근 차단으로 보고 우회하지 않음 (브라우저 기준 17,162권) |
| 135 | 전라북도교육청통합도서관 (교보 `:10111`) | 브라우저에도 "L7 Secure connect fail". 같은 교육청 책은 통합 포털(15)에 교보 47,868줄로 있음 |
| 261 | 군포시도서관(YES24) | 주소가 교보 군포(46, 수집 끝남)로 넘어감 |
| 269 | 김천시립도서관 (YES24) | 2026-09-30부터 스크립트 연결을 끊음(브라우저는 열림). 우회하지 않음. 같은 서버 북큐브(100035)는 막히기 전 3,481종 받음 |

## 6. 문제별 대처

| 증상 (로그·상태) | 먼저 볼 것 | 대처 |
|---|---|---|
| `FAILED … fetch failed … Timeout` | 사이트가 느린지 브라우저로 열어 봄 | 교보·포털이면 그 호스트를 `PAGE_SIZE_BY_HOST`에 넣어 한 쪽을 줄임(칠곡 100, 경기교육청 포털 50, 전북 교육문화회관 100) |
| `IncompleteRead` | 큰 쪽에서 응답이 끊김 | 위와 같이 한 쪽을 줄임 |
| `div.total em missing`, `book_resultTxt missing`이 첫 쪽에서 | 브라우저로 첫 화면을 봄 | 주소가 옮겼는지(군포), 화면 종류가 바뀌었는지 확인. 옮겼으면 새 주소가 이미 목록에 있는지 보고 없으면 넣고, 있으면 `--skip` |
| 빈 쪽·연결 끊김인데 브라우저는 열림 | 머리글을 바꿔도 같은지 한두 번만 시험 | 자동 접근 차단 → `--skip`에 이유 적고 사용자에게 알림(국회·김천) |
| 브라우저도 안 열림 | 같은 기관의 다른 주소(통합 포털 등)에 같은 책이 있는지 | 있으면 `--skip`, 없으면 다음 갱신 때 다시 |
| 포털 목록에 "로그인 후 이용" | — | 수집기가 자동으로 **공백 한 글자 검색**(`search/table.do … search_text=%20`)으로 바꿔 받음(인천) |
| `MISMATCH`인데 `rows_seen`이 총 건수와 같음 | 목록 안 중복 | 지금 규칙으로는 성공. 예전 실행이면 `crawl_run` 상태를 SUCCEEDED로 바꾸고 이유를 `error`에 적음 |
| `MISMATCH`이고 받은 수가 크게 적음 | 책 번호를 잘못 읽는지(예: 숫자만 읽음) | 파서를 고치고 `invalidate`로 그 화면 종류를 다시 받음 |
| 상세 URL이 다른 책·빈 화면 | `verify_detail_urls.py` 결과 | 목록 링크를 그대로 쓰는지, 필요한 값(`menu_idx` 등)이 빠졌는지 확인하고 고친 뒤 `invalidate` |
| 새 종류 표시 값(`content_kind`)이 생김 | `SELECT content_kind, count(*) … GROUP BY 1` | `crawl_catalog.py`의 `TYPE_CASE`에 더하고 해당 줄만 `UPDATE`(북큐브 `book/aud` = 오디오북이 이렇게 발견됨) |

## 7. 새 사이트·새 플랫폼 붙이는 순서

1. **표본 한 곳을 브라우저와 스크립트로 모두 열어 봄.** 스크립트 요청이 막히면 여기서 멈추고 사용자에게 알림.
2. `platforms.md`의 같은 플랫폼 절을 봄. 없으면 새 절을 만들고 다음을 채움: 알아보는 법(주소 모양), 검색 주소(제목·저자·출판사), **전체 목록 주소**(빈 검색, 공백 검색, 전체 목록 메뉴, XML 등), 한 쪽 최대 줄 수, 전체 건수 위치, 줄 선택자, 책 코드, 상세 URL, 오디오북 등 종류 구분, 문자 인코딩, 확인 날짜.
3. `crawl_catalog.py`에 더함: `PLATFORMS`, `PAGE_SIZE`, `page_url`, `parse`(와 `parse_…` 함수), 필요하면 `segments`(목록이 여럿일 때). 상세 경로는 **목록의 링크를 그대로** 저장.
4. 도서관 줄 넣기: dev seed에 있으면 `init`, 제3자 목록이면 `probe_other_platforms.py` → `import-bookcube`처럼 불러오는 함수를 만들어 `source`를 적음.
5. `full --only {한 곳} --limit-pages 2`로 시험 → 몇 줄을 DB에서 눈으로 확인 → `full --only {한 곳}` 끝까지 → 사이트 총 건수와 비교.
6. `verify_detail_urls.py … {화면종류}`로 상세 URL 확인.
7. `platforms.md`와 이 문서 1절 표, `catalog-refresh.md` 변경 기록을 고침.

## 8. 다음에 할 일 (순위 4 이후)

| 할 일 | 방법 | 태그 |
|---|---|---|
| 교보 전 기관 넣기 | 기관 목록 `docs/cycles/02-library-expansion/data/kyobo-institutions.tsv`(2,000곳). `*.dkyobobook.co.kr`이면 구독형(`/content/contentList.ink`)인지 일반(`/elibrary-front`)인지 첫 화면으로 가려야 함. 불러오는 명령은 아직 없음(`import_bookcube`를 본떠 만들 것). 대부분 같은 교보 서버라 오래 걸림 | [안] |
| YES24·알라딘 전 기관 넣기 | 웹러브 북스 https://ebook.okbari.net/library 탭별 기관 링크(브라우저로 모음, `platforms.md` 출처). 알라딘은 화면이 여러 가지라 사이트마다 확인 | [안] |
| 북큐브 나머지 (학교·대학·기업 등 약 470곳) | `probe_other_platforms.py` → `import-bookcube` | [안] |
| 알라딘 수집기 | `platforms.md` 8절 방법으로 `parse`·`page_url` 추가. 화면이 다른 15곳은 따로 조사 | [안] |
| 오디오북만 있는 사이트 표시 | 예: "경북도서관 오디오북"(알라딘). 도서관 단위 표시 칸 필요 | [확인 필요] |
| 정기 재수집 (주 1회 전체 + 매일 신간) | `crawl-method.md` 2절, 최신순 정렬 값은 `platforms.md`, 규모 문제는 `catalog-refresh.md` 변경 기록 | [확정] 주기 / 방법 [안] |
| 상세 URL 전체 다시 확인 | 수집이 모두 끝난 뒤 `verify_detail_urls.py`(화면 종류 제한 없이) | [안] |

## 9. 상세페이지 URL

사용자 요청 "각 도서관 도서의 상세페이지 url도 꼭 있어야 해 만약 없다면 다시 크롤링해서 채워" (2026-09-30).

- `holding.detail_url`: 상세페이지 전체 URL. 트리거가 `library.base_url`(포털은 `?` 앞까지) + `detail_path`로 채움. 모든 줄에 있어야 함 [확정]
- 확인: `python -X utf8 scripts\verify_detail_urls.py` → `logs\verify-detail-urls*.tsv`
- 확인 기록:
  - 2026-09-30 01:24 전체 363건: 359건 맞음. 틀린 2건으로 YES24 종류 섞임·영문 책 번호, 강원 포털 `menu_idx` 문제를 찾아 고치고 YES24·포털 77곳을 다시 받음
  - 2026-09-30 09:5x YES24·포털: 모두 맞음(사이트 응답 없음 2건 제외)
- 다시 받기에 실패한 곳에 남은 옛 방식 줄 12줄(강서 10, 영주 1, 경산 1)은 그 도서관을 다시 받으면 `removed_at`이 찍힘

## 10. 오디오북 표시 (DB)

사용자 요청 "db에 오디오북 표시좀 해줘라" (2026-09-30).

| 칸 | 값 |
|---|---|
| `content_type` | EBOOK, AUDIOBOOK, VIDEO_BOOK, KIDS_BOOK, PAPER, UNKNOWN |
| `is_audiobook` | 1 오디오북, 0 오디오북 아님, NULL 모름 |
| `kind_check` | `TITLE_SAYS_AUDIO` = 제목에 "오디오북"이 있는데 사이트는 오디오북으로 표시하지 않음 (사람 확인용). 2026-10-01 1,373줄 |
| `content_kind` | 사이트가 적은 종류 원문 (예: 오디오북, 오디오, 전자책, 동영상북, `book/epub`, `book/aud`) |
| `kind_source` | SITE_LABEL(줄에 적혀 있음) / SITE_SECTION(어느 목록에서 왔는지로 정함) |

- 오디오북으로 보는 값: 교보 "오디오"·"오디오북", YES24 `/audiobook/` 목록, 포털 `type=ADO`, 북큐브 형식 `aud`(2026-10-01 발견, 19,417줄) [안]

```sql
SELECT l.name, h.title, h.author_raw, h.detail_url FROM holding h JOIN library l ON l.id = h.library_id
WHERE h.is_audiobook = 1 AND h.removed_at IS NULL;
```
