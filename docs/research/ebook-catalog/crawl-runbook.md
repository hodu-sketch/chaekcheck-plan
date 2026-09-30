# 전자책 목록 수집 이어 받기 안내

- 작성: 2026-09-30
- 목적: 수집이 며칠 걸리고 PC를 끌 수 있으므로, 다음에 사람이나 다른 AI가 **어디까지 받았는지 확인하고 이어 받는 법**을 적습니다.
- 사용자 요청 (2026-09-30): "큰 교보 구독형 16곳을 받아줬으면 해 예의를 지켜서", "이 컴을 끌 수도 있고 그래서 다음에 이어서 잘 받도록 문서 작성해 줘", "북큐브 134곳 목록 … 받아줘", "278곳 먼저가 우선인데 웹러브 북스에 있는 책은 거의 다 수집", "db에 오디오북 표시좀 해줘라"
- 함께 볼 문서: `crawl-method.md`(원칙), `platforms.md`(플랫폼별 방법), `search-and-normalization.md`(모은 값을 검색용으로 정리하는 규칙, 다른 세션 작성), `same-book-isbn.md`(같은 책 묶기, 다른 세션 작성), `catalog-refresh.md`(주기 갱신 참고, 별도 사이클용, 운영에서 알게 된 것은 그 문서 "변경 기록"에 더함), `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\README.md`(DB 구조)

## 1. 한 줄 요약

PC를 켠 뒤 아래 파일을 한 번 실행하면 됩니다. 몇 번을 실행해도 안전합니다. 끝난 도서관은 건너뛰고, 끝나지 않은 도서관은 저장된 마지막 쪽 다음부터 이어 받습니다.

```
C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\resume.cmd
```

- 이미 수집이 돌고 있으면 두 번째는 시작하지 않습니다(같은 도서관 사이트에 요청이 겹치지 않게).
- 로그: `chaekcheck-data\logs\crawl-{날짜_시각}.log`. 끝나면 맨 아래에 상태 요약이 붙습니다.
- 명령만 따로 쓰면: `python -X utf8 scripts\crawl_catalog.py full --retry-failed --include-big-subscription --audio-pass --workers 40` (`chaekcheck-data` 폴더에서)

## 2. 받는 순서 [확정] (사용자, 2026-09-30: "278곳 먼저가 우선")

| 순위 | 대상 | 규모 (2026-09-30) | 비고 |
|---|---|---|---|
| 1 | dev seed의 켜진 도서관 278곳 (교보·YES24·포털·강남구·작은 구독형) | 약 140만 줄 | 대부분 첫날 끝남 |
| 1 | 위 YES24 사이트의 오디오북 목록 (`/audiobook/`) | 사이트마다 0~1천 | `--audio-pass` |
| 2 | 큰 교보 구독형 16곳 | 각 18만~24만 권, 합계 약 327만 줄 | 모두 `*.dkyobobook.co.kr` 한 서버 → 한 곳씩 차례로. 한 곳 4시간 안팎, 모두 약 3일 [안] |
| 3 | 북큐브 134곳 (웹러브 북스 목록에서 공공도서관으로 보이고 열린 곳) | 합계 1,187,834종 | `*.bookcube.biz`·`*.dasangng.co.kr`는 각각 한 서버로 봄 |
| 4 | 웹러브 북스의 나머지 기관 (교보 전 기관, YES24 전 기관, 알라딘) | 목표 약 172만 권(웹러브 북스 화면 기준) | 아직 도서관 목록에 넣지 않음. 5절 |

- 순서는 **같은 호스트 안에서** 지킵니다. 호스트가 다르면 동시에 받습니다. 예를 들어 북큐브 사이트 중 `ebook.jne.go.kr`에 있는 곳은 같은 호스트의 278곳 도서관이 끝난 뒤에 받습니다.
- 호출 예의는 그대로입니다: 같은 호스트 한 번에 1건, 1초 이상 간격 [확정] (사이클 01 spec 5.6).

## 3. 어디까지 받았는지 보기

```
python -X utf8 scripts\crawl_catalog.py status
```

- `SUCCEEDED`: 끝남. `RUNNING`: 받다가 멈춤(다음 실행 때 이어 받음). `FAILED`/`MISMATCH`: 다음 실행 때 처음부터 다시 시도
- 자세히 보기 (SQLite):

```sql
-- 도서관별 마지막 실행
SELECT l.id, l.name, l.platform_type, r.status, r.last_page, r.site_total, r.rows_seen, r.started_at, r.error
FROM library l JOIN crawl_run r ON r.id = (SELECT max(id) FROM crawl_run WHERE library_id = l.id)
ORDER BY r.status, l.id;

-- 아직 한 번도 끝나지 않은 도서관
SELECT id, name, platform_type, seed_holdings_count FROM library WHERE last_full_success_at IS NULL;
```

## 4. 이어 받기가 어떻게 되는지

| 경우 | 동작 |
|---|---|
| 목록이 하나인 사이트 (교보, 교보 구독형, 강남구, 북큐브, 오디오북 메뉴가 없는 YES24) | `crawl_run.last_page`까지 저장돼 있으므로 다음 쪽부터 이어 받음 |
| 목록이 여럿인 사이트 (통합 포털 EBK·ADO, 오디오북 메뉴가 있는 YES24) | 처음부터 다시 받음(작아서 괜찮음) |
| 받는 중에 사이트에 책이 들고 남 | 제목순이라 쪽이 밀릴 수 있음. 끝에 사이트 총 건수와 비교해 1% 넘게 다르면 `MISMATCH` → 다음 실행 때 다시 |
| PC가 꺼지거나 절전 | 그 시점까지 받은 쪽은 저장됨. 다시 `resume.cmd` |
| 사이트가 오류 | 30초 간격 3번 재시도 뒤 그 도서관만 `FAILED`. 다른 도서관은 계속 |

주의:
- **Windows 절전**이 켜져 있으면 몇 시간 뒤 멈춥니다. 오래 받을 때는 절전을 끄거나 다시 `resume.cmd`를 실행합니다.
- `resume.cmd`를 두 번 띄우지 않습니다(자동으로 막음). 다른 명령(`--shard`)과도 같이 돌리지 않습니다.

## 5. 다음에 할 일 (순위 4 이후)

| 할 일 | 방법 | 태그 |
|---|---|---|
| 교보 전 기관 넣기 | 기관 목록 `docs/cycles/02-library-expansion/data/kyobo-institutions.tsv`(2,000곳). 주소가 `*.dkyobobook.co.kr`이면 구독형(`/content/contentList.ink`)인지 일반(`/elibrary-front`)인지 첫 화면으로 가려야 함. 넣는 명령은 아직 없음(`import_bookcube`를 본떠 만들 것) | [안] |
| YES24·알라딘 전 기관 넣기 | 웹러브 북스 https://ebook.okbari.net/library 의 탭별 기관 링크(브라우저로 모음, `platforms.md` 출처). 알라딘은 화면이 여러 가지라 사이트마다 확인 | [안] |
| 북큐브 나머지 (학교·대학·기업 등 약 470곳) | `probe_other_platforms.py`로 확인 후 `import-bookcube` | [안] |
| 오디오북만 있는 사이트 표시 | 예: "경북도서관 오디오북"(알라딘). 도서관 단위 표시 칸 필요 | [확인 필요] |
| 정기 재수집 (주 1회 전체 + 매일 신간) | `crawl-method.md` 2절. 신간용 최신순 정렬은 `platforms.md` | [확정] 주기 / 자동 실행 방법 [안] |

## 5-1. 받지 않는 도서관 (`library.crawl_skip`)

이유를 `crawl_skip` 칸에 적은 도서관은 수집에서 뺍니다. 넣기·빼기: `python -X utf8 scripts\crawl_catalog.py status --skip {id} "{이유}"` (이유를 `""`로 주면 다시 받음). 주기 갱신 때 다시 확인할 대상입니다.

| id | 도서관 | 이유 (2026-10-01) |
|---|---|---|
| 44 | 국회도서관 | 브라우저가 아닌 요청에 빈 쪽. 자동 접근 차단으로 보고 우회하지 않음 (브라우저 기준 17,162권) |
| 135 | 전라북도교육청통합도서관 (교보) | 브라우저에도 "Secure connect fail". 같은 책은 통합 포털(15)에 있음 |
| 261 | 군포시도서관(YES24) | 주소가 교보 군포(46)로 넘어감 |
| 269 | 김천시립도서관 (YES24) | 2026-09-30부터 스크립트 연결을 끊음(브라우저는 열림). 우회하지 않음 |

차단된 곳을 받으려면 도서관에 자동 수집 허용이나 자료 제공을 문의하는 것이 방법입니다 [안].

## 6. 상세페이지 URL 확인

사용자 요청 "각 도서관 도서의 상세페이지 url도 꼭 있어야 해 만약 없다면 다시 크롤링해서 채워" (2026-09-30).

- `holding.detail_url`: 상세페이지 전체 URL. 트리거가 `library.base_url` + `detail_path`로 채움. 2026-09-30 01:17 기준 1,535,211줄 모두 있음
- 확인 도구: `python -X utf8 scriptserify_detail_urls.py` — 도서관마다 종류마다 한 건을 열어 그 책 제목이 나오는지 봄. 결과 `logserify-detail-urls.tsv`. **수집과 동시에 돌리지 않음**(같은 사이트에 요청이 겹침)
- 첫 확인(2026-09-30 01:24, 363건): 359건 맞음, 시간 초과 2건(연천·강서, 사이트 느림), 틀림 2건 → 고침
  - YES24: 목록에 동영상북(`/booklearning/`)·오디오북이 섞였는데 모두 `/ebook/detail/`로 저장했음. 교보 공급 책 번호(`480D…`)를 숫자만 읽어 여러 책이 한 줄로 합쳐졌음
  - 강원 포털: 상세 URL에 `menu_idx`가 필요
  - 그래서 YES24·포털 77곳을 모두 다시 받도록 표시함(`crawl_catalog.py invalidate`). 예전 잘못된 줄은 다시 받은 뒤 `removed_at`이 찍힘
- 다시 받기가 끝나면 `verify_detail_urls.py`를 한 번 더 돌려 확인할 것

## 7. 오디오북 표시 (DB)

사용자 요청 "db에 오디오북 표시좀 해줘라" (2026-09-30)에 따라 `holding` 표에 칸을 더했습니다. 새로 들어오는 줄도 SQLite 트리거가 자동으로 채웁니다.

| 칸 | 값 |
|---|---|
| `content_type` | EBOOK, AUDIOBOOK, VIDEO_BOOK, KIDS_BOOK, PAPER, UNKNOWN |
| `is_audiobook` | 1 오디오북, 0 오디오북 아님, NULL 모름 |
| `kind_check` | `TITLE_SAYS_AUDIO` = 제목에 "오디오북"이 있는데 사이트는 오디오북으로 표시하지 않음 (사람 확인용) |
| `content_kind` | 사이트가 적은 종류 원문 (예: 오디오북, 오디오, 전자책, `book/epub`) |
| `kind_source` | SITE_LABEL(줄에 적혀 있음) / SITE_SECTION(오디오북 목록에서 왔음) |

- 교보의 "오디오"와 "오디오북"은 둘 다 AUDIOBOOK으로 봄 [안]
- 2026-09-30 01:02 기준: 오디오북 14,475줄, 확인 필요 476줄

```sql
SELECT l.name, h.title, h.author_raw, h.content_kind FROM holding h JOIN library l ON l.id = h.library_id
WHERE h.is_audiobook = 1 AND h.removed_at IS NULL;
```
