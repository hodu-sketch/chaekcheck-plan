# 회고: 사이클 21 추천도서 (이동진 추천도서 · 사서 추천도서 · 서울대 100선)

- 쓴 날: 2026-10-17 (`/cycle-start` 1단계 "고리 닫기")
- 근거: dev `docs/plan-feedback.md` "# 사이클 21"(4538~4957행), dev main `836bd7b`(c21 브랜치 fast-forward) 뒤 문서 커밋 `cf7976d`·`52768b7`, dev 코드(읽기만), Modulith 문서 `backend/build/spring-modulith-docs/components.puml`(2026-10-17 11:49), 사용자 결정 페이지 [dev 결과 검토](easy/2026-10-17-dev-result-review.html)(#1~#9, 사이클 20 세션이 묻고 사용자가 정함)
- 상태: 운영 역할 DB(db-ops) 반영 기록 13번 SUCCEEDED, 내 PC finish 13번 SUCCEEDED (2026-10-17). 반영 중 검색 410건 모두 200(5xx 0). 맞춘 수 이동진 36/43 · 서울대 87/100 · 사서 72/108. 표지 이동진 43/43 · 서울대 97/100 · 사서 108/108. 사용자 실기기 확인 "폰 확인했어 괜찮아" (2026-10-17)

## 계획대로 된 것

- 모듈·의존: `picks` 하나에 세 목록, 새 의존은 `collection → picks` 하나, 고리 없음 (ADR-0122·0123). Modulith `components.puml`이 Collection → Catalog·Library·Picks("depends on"), Picks → Catalog·Library로 설계 그림과 같음
- 표: `picks/002-curated-lists.yaml`(changeset `picks-002-list-field`·`picks-002-list-book`·`picks-002-move-librarian`)이 `list_field`·`list_book`을 만들고 사서 줄을 옮긴 뒤 `pick`을 지움 — 칸·목록별 CHECK·부분 UNIQUE가 design-delta "데이터" 표와 같음. `usagelog/003-screen-event-picks-list.yaml`(changeset `usagelog-003-screen-event-picks-list`)도 설계대로. master 끝 `# cycle 19` `usagelog/002` → `# cycle 21` `picks/002`, `usagelog/003` (dev master 114~122행)
- 공개 API: `CuratedListTransfer`(`picks`), `BookLookup.byIds` → `IdBook(bookId, title, publisherNorm, libraryIds)`, `IsbnBook`·`TitleAuthorBook`에 `title`·`publisherNorm`, `CatalogLoad.preparedLookup()`, `FORMAT_VERSION` 3(dev `JdbcCatalogLoad.java` 79행), `LibraryCatalog.lendingKinds()` → `Map<Long, Boolean>`(dev `LibraryCatalog.java` 49행)
- REST: `GET /api/v1/picks/{listKey}`(dev `PicksController.java` 57행), 응답 `{list, fetchedAt, categories[{code, name, books[{id, category, title, listTitle, coverUrl, bookId, available, recommendedMonth, yearBook, videoId, tocNo}]}]}`(138~158행)이 설계 칸 이름 그대로, 모르는 목록 404 `list_not_found`, `GET /api/v1/picks`는 지움
- 반영 차례: 바꿔 끼운 **뒤** 작은 트랜잭션 하나로 `replace` (설계 검토 3 #3). 리허설·운영 반영 모두 목록 넣기 5~6초, 바꿔 끼우기 0.07~0.19초. 확인 필요 #6(`catalog_next` 맞추기 시간): export 목록 단계 3.6초
- 판 고르기 (나) 세트 규칙(「토지」 1권 1780), 구독형 1로 세기, Java `BookChoice`와 수집기 `choose()`가 공용 시험 자료 `scripts/crawl/testdata/book_choice_cases.json`을 함께 읽음 (ADR-0125)
- 수집기 `scripts/crawl/recommended_lists.py`: YouTube `www.googleapis.com`만(`www.youtube.com` 0건, 28단위), 영상 제목·설명 저장 안 함, 30일 확인(`checked_on`), 새 책은 `leedongjin_pending.tsv`에 분야 제안과 함께 (ADR-0128 "바뀜" 그대로)
- 화면 이름 덜어 내기(`ShownTitle`), `/picks` → `/picks/librarian`, 목록마다 자리 기억, 사용 알림 `list`

## 달라진 것과 이유

### 머리말·화면 (사용자가 dev 화면을 보며 직접 정함)

| 바뀐 것 | 원래 설계 | 이유 (사용자 말) |
|---|---|---|
| 큰 메뉴 셋: 「도서검색 › 전자책 검색(`/search`)」을 더함 (dev `web/src/components/headerMenus.ts`) | 큰 메뉴 둘, 책 검색은 로고 (R1-1, ADR-0127) | "폰이랑 pc랑 둘 다 탭에 도서검색 넣어줘" (2026-10-16, dev `headerMenus.ts` 주석) |
| PC: 큰 메뉴를 누르면 이동 없이 세 칸이 모두 열림, 같은 탭을 다시 누르면 닫힘 | 누르면 첫 항목으로 감 (R1-3) | "pc 탭 말이야 누르면 아래 항목 보이도록", "나는 다 보였으면" |
| 폰: ☰ 없음, 머리말 줄 빈 곳을 누르면 메뉴, 「로그인」 왼쪽에 작은 ▾(`ChevronDown`) | 640px 이하 ☰ (R1-5, AC-2) | "상단 탭 자체를 누르면 메뉴 보이는 걸로"; ▾는 결과 검토 #7 승인, 그림에서 안 B(로그인 왼쪽) 고름 |
| 로고는 메인(`/`)으로만, 메뉴를 열고 닫지 않음 | 같음 | "실사용 해보니 좌상단 로고는 아래 탭 늘려서 보이는 거랑 관계 없이 그냥 메인으로 옮겨주는 걸로만 해" |
| 머리말 간격: 로고 → 첫 탭 92px, 탭 글자 사이 64px (1280px) | 값 없음 | "책첵이랑 (도서검색, 추천도서, 마이페이지) 이것 사이의 간격은 더 띄워주고 … 요 세 요소들 사이의 간격은 좀 더 줄여줘" |
| 표지 아래 "26.06"·목차 번호 없앰 | R5-1·R5-2, AC-4·AC-5 | "추천도서 각각에 날짜나 숫자 붙이지 마" |
| 목록 이름을 머리말 아래 왼쪽 위 붙박이(PC·폰), 폰 떠 있는 버튼은 분야만 [한국문학 ▾] | flow #4 (PC 안 A, 폰 안 C) | "추천도서 서울대 100선 같은거 이거 폰 현재 위치 별로아 그냥 좌상단에 고정으로 넣어놔 이건 pc도 마찬가지야" |
| 책 창·희망도서 안내의 "목록 이름 「…」" 줄 뺌 (응답 `listTitle`·덜어 내기는 그대로) | R6-3, AC-16 | "여기에 목록 이르은 또 뭐야?", "목록 이름 아예 다 빼줘 무의미한것 같아" (ADR-0129 "결과"에 이미 바뀜 줄 있음) |
| 화면 아래 출처 줄을 세 목록 모두 뺌, 출처·YouTube 약관 링크는 [분류 ▾]의 "기준 보기"에만 (dev `CategoryPicker.tsx` 90행) | R5-5 (출처 줄) | "어짜피 여기 기준 보기에 정보 있는데 화면 아래에 정보 두는 거 별로야 그냥 빼줘" |
| 이동진 책 창 추천 줄 "2026년 6월 추천"(올해의 책 꼬리는 남김) | "이동진 평론가가 「파이아키아」 영상에서 추천 (2026년 6월)" (R6-1·R6-2) | "이동진 평론가가 파이아키아에서 추천이라고 계속 공통 중복 메세지 뜨는데 그냥 2026년 6월 추천 이런것만 해줘 어짜피 영상보기 있으니까". 꼬리 유지는 [이유 미확인] (dev가 적은 이유: 책마다 다른 정보) |
| 폰 [영상 보기]를 「책 검색」과 같은 줄 오른쪽 끝, 추천 줄 글자 끝에 맞춤 | 폰은 아래 줄 (R6-2) | "영상보기 개행 다음에 있어서 좀 그래 책 검색과 같은 행의 우측끝에 두던가", "위의 또다른 보라 글자랑 이거 정렬 맞추게 해줘" |
| 책 창 대출 조회: 앞 3곳에 지금 빌릴 수 있는 곳이 없으면 `holdingLimit` 6 → 10 → 20으로 넓혀 다시 (보이는 줄 3줄) (dev `pickLibraryRows.ts` `PICKS_HOLDING_STEPS`) | 사이클 10 S14 "앞의 3곳만", R6-1 | "도서관 3곳만 검색하면 그 도서관에는 없고 사용자가 가입 가능한 다른 도서관에는 있을 수 있는데" → "빌릴 수 있는 곳이 나올 때까지 더 조회 … 해줘" |
| 못 맞춘 책도 찾은 표지 그림을 흐리게 | 흐린 제목 글자 (R2-4, AC-15) | 결과 검토 #2 승인 (2026-10-17) |
| 범위 밖 화면: `/search` 검색 전 「전자책 검색」 제목·안내 글(안 A), 폰 첫 화면 문구·검색창을 조금 내림, 책 화면 "… 기준 수집 목록 · 보유 도서관 N곳" → "보유 도서관 N곳"(결과 없음 뒤 "(… 기준)"도 뺌) | 사이클 21 범위 밖 | 안 A 고름; "너무 위에 있어 좀 더 아래로 해줘 적합한 위치는 다른 유명 사이트들 참고해"; "굳이 언제부터 언제까지 수집한거다 알려줄 필요 없다고 생각해" |

### 수집기·표지·맞추기

| 바뀐 것 | 원래 설계 | 이유 |
|---|---|---|
| 표지 차례 다섯(`scripts/crawl/lists/cover_sources.tsv`): ① ISBN 서지 `TITLE_URL` ② 수집 사본 YES24·교보 ③ 수집 사본 그 밖 ④ **국립중앙도서관 소장자료 검색 `imageUrl`(`cover.nl.go.kr`)** ⑤ ISBN 서지 제목 검색. 「가족이라는 사치」만 김영사 공식 페이지 표지(사람이 넣음, `OUTSIDE_COVER_HOSTS`). 카카오 책 검색은 넣었다가 뺌(0장) | ①~③, 다 안 되면 제목 글자 (표지 순서 #1, R5-4) | "추천도서에서 책 표지 무조건 다 보였으면 해 인터넷 수집해서(어디서 수집해야 하는지는 기록 다 해)채워", 카카오를 뺄 때 "도서관정보나루라던가 아니면 공공도서관 api라던가 출처 많자나... 그걸로 다시 조사하고 반영해봐", "다른 건전한 출처 더 찾아봐", "「가족이라는 사치」만 김영사 공식 페이지" |
| 표지 출처 표시("표지: 국립중앙도서관") 넣지 않음 | 결과 검토 #1 "정함"에 출처 표시 | "굳이 해야 하나..?" (dev 21이 그림 두 안으로 물음) |
| 표지 이용 조건 확인을 따로 하지 않음(인계서 #17 공개 배포 전 확인은 남음) | 인계서 #17 | "5는 따로 하지 마" |
| 거르기 낱말에 원서·초등·청소년·그림책 더함 (`collector_words.tsv`) | R3-3·R3-4 | 결과 검토 #8 승인 — R3-3·R3-4에 합쳐 [확정] |
| 같은 책 판정: Python 제목 정규화 대신 시작 판의 DB 값(`main_title_norm`, 권 번호를 덜어 낸 본제목, AUTHOR·UNKNOWN `name_exact`)으로 묶음, 같은 출판사·같은 본제목 세트 권은 저자 표기가 달라도 넣음 | 수집기가 R3-3 규칙으로 제목을 다듬어 같은 책을 찾음 | 묶는 방식: [이유 미확인] (dev 기록 "설계와 다른 점"). 세트 권: 결과 검토 #4 "카라마조프가의 형제들. 1이라고 있어. 도서 검색 방법을 좀 더 보충해봐" |
| 거르고 남은 판이 없으면 같은 본제목 판 전체(저자 무관)에서 다시 고름 → **없앰**: 그런 줄은 고정 판을 비워 못 맞춤, 바른 판이 있으면 사람이 `manual` | 없음 | dev가 더한 이유는 [이유 미확인]. 없앰은 [확정] (사용자 승인, 2026-10-17, 회고 결정 #2) — dev 할 일 [to-dev-retro-fixes.md](to-dev-retro-fixes.md) |
| 권 표기 읽기 보충: 끝 대괄호 `[한글판]`·`[1]`, " - " 뒤 부제, 끝 「N부 N권」, 한글 바로 뒤 1~2자리 숫자, 끝 낱말 "세트" (Java `ShownTitle`·수집기 `read_title()` 같이). 2권부터는 「토지 2」처럼 숫자를 남김 | ADR-0129 덜어 내기 목록 (`1`·`(상)`·괄호·"오리지널판"·앞 `[…]`) | 결과 검토 #4 (위 말). "세트"·숫자 남김은 dev 9단계 화면 확인 중 정한 것(이유 기록 없음) → 그대로 [확정] (사용자 승인, 2026-10-17, 회고 결정 #4) |
| 서울대 48 「체호프 희곡선」 → 을유문화사 9788932403854(책 78100) `manual` | 수집기 판 | 결과 검토 #5 승인 "다른 ai가 잘 하도록 지침 문서 잘 하고" |
| 서울대 저자 빈 12권: dev가 일반 지식으로 채웠다가 모두 비움 | 목록 그대로 | 결과 검토 #6 승인 (해제집 원문에 저자 없음) |
| 올해의 책 영상 찾기: 12월 업로드 제목 「올해의」·「베스트북」, 목록 첫 달(2023-12)보다 오래된 영상은 보지 않음 | 12월 · "올해의 책" | 낱말은 올해의 책 찾기 #1 승인. 2023-12 이전 제외는 dev가 정한 것(dev가 적은 이유: 2021년 옛 영상이 걸림) → 그대로 [확정] (사용자 승인, 2026-10-17, 회고 결정 #4) |

### 서버 안쪽 (dev가 정함, 설계에 이름·세부 [안]이던 것)

- `CuratedListTransfer`에 `check(Path)`가 더해져 셋: `check`(prepare 전 파일만) / `read(Path, BookLookup)` → `ListPart(json, counts, warnings)` / `replace(String)` → `Replaced(fields, books, coversAdded, coversDeleted)`, 오류 `ListFileException(file, line)`. 안쪽 `picks/internal/lists/ListFiles`·`CuratedLists`, `picks/internal/cache/ShownTitle`
- 목록 넣기가 실패해도 가져오기 기록은 SUCCEEDED, `step_seconds`에 `lists failed` 키 + ERROR 로그 (dev `ImportTransfer.java` 264~274행). dry run은 목록을 검사하지 않음. in-place는 읽기 전에 `check`
- 잠금 열쇠 `pg_advisory_xact_lock(hashtext('picks.list_book'), hashtext(list_key))`. 사서 받기의 "같은 목록인가"에서 분야 이름을 뺌 — [이유 미확인] (dev가 적은 이유: 아는 분야는 우리 짧은 이름으로 저장돼 API 이름과 달라 매주 "바뀜"이 됨)
- 표지 파일이 없거나 JPEG가 아닌 줄은 멈추지 않고 `cover_source`를 비움 + 경고 [안]
- `list_book`에 `book_id >= 1` CHECK, `list_field.name` 길이 1 이상 CHECK, 색인 `list_book_cover_source_idx` 더함 (표지 정리용)
- 웹: 모르는 목록 이름 주소는 아무것도 보이지 않음 (앱의 없는 주소와 같음 [안]), h1 「사서 추천도서」·상태 문구 「사서추천도서」 그대로 (AC-10)
- `leedongjin.tsv` 43줄(「마음 깊은 숨」 넣지 않음 — R3-5대로), `snu100.tsv`에 칸 `cover_title`(표지 찾기용 제목, 예 「근현대사 4부작」 → 「혁명의 시대」), `leedongjin_pending.tsv` 칸 `video_id, month, reason, title, author, isbn13, field_suggestion`

## 새로 알게 된 제약

- 국립중앙도서관 ISBN 서지 API: 2023년 뒤 책은 KDC가 비고(이동진 43/43), `TITLE_URL`도 대부분 빔(이동진 40/43) → 분야는 사람이, 표지는 수집 사본·소장자료 검색이 주된 출처 (dev 0단계, 2026-10-16)
- `TITLE_URL` 호스트가 셋(`http://www.nl.go.kr`, `https://nl.go.kr`, `https://www.nl.go.kr`), 경로 `/seoji/fu/ecip/`, 키 없음
- YouTube 영상 ID 꼴은 공식 문서에 없음 → CHECK `^[A-Za-z0-9_-]{1,64}$`는 관찰 근거(603개 모두 11자). 업로드 재생목록 ID = 채널 ID 앞 `UC`를 `UU`로 (`channels.list` `contentDetails.relatedPlaylists.uploads`)
- 카카오 책 검색 썸네일은 오래 두는 저장이 안 됨(plan `docs/research/popular-books/cover-copyright.md` 5절) → 줄여 두는 우리 설계와 맞지 않음. 정보나루 표지도 저장 금지(ADR-0072). 네이버 책 검색 키는 401
- 카탈로그 권 표기는 꼴이 많음(` N` 132,486, `. N` 40,816, `1 [한글판]` 22,379 등, 책 1,331,194권 중) — 지침 `docs/research/recommended-lists/matching-guide.md` 2-1절
- 카탈로그 묶기의 권 함수(`collection.internal.importer.SameTextKey.volumeMarks`)는 `collection` 안쪽이라 `picks`가 쓸 수 없음 → `ShownTitle`(Java)과 `read_title()`(Python)을 공용 시험 자료로 묶어 같게 둠
- 가져오기 명령도 켜질 때 Liquibase를 먼저 돌림 → 운영 반영은 "21 코드로 apply 한 번"이면 스키마 → 반영 → 목록 순서 (인계서 확인 필요 #15)
- 반영 파일: `listPart` 약 2.2MB(표지 140장), 전체 약 591MB. 내보내기 27분 43초, apply 4분 21초, finish 2분 4초
- main 전체 빌드에서 `CaffeineSearchPageCacheTests.loadsAgainAfterThreeMinutes` 1건이 한 번 실패(사이클 08 시험, 같은 PC에 다른 서비스가 돌 때 시간 의존) [확인 필요: 다시 나오면 따로 고침]

## 다음 사이클 후보

- 표지 이용 조건(국립중앙도서관 `cover.nl.go.kr`·ISBN 서지 표지, 김영사 공식 페이지 표지, 사서 출처 "공공누리 제1유형"이 기준 보기 안에만 있어도 되는지): 공개 배포 전 인계서 #17과 함께 — backlog 302행에 있음
- 「제자백가 선독」·「변신인형」·「보조법어」 제목 글자 표지 3권 (서울대 97/100)
- 반영 중 R4-7(켠 서비스에서 10분 안에 바뀐 목록) 실서비스 확인 — 다음 목록 갱신 때
- `ShownTitle`·`read_title()`·`SameTextKey`의 권 읽기를 공용으로 옮길지 (지금은 공용 시험 자료로만 묶음)
- backlog 그대로: 도서관 클릭 기록에 목록 이름, 목록 반영 기록 표, 머리말 「알림·안내」

## 사용자에게 확인할 것 — 끝남 (2026-10-17)

결정 페이지 [회고 확인](easy/2026-10-17-retro-decisions.html)에서 네 [안] 모두 승인 (사용자, 2026-10-17, 캔버스). 아래는 물은 내용 원문과 반영한 곳.

- **결정 #1** [확정] (사용자 승인, 2026-10-17, 회고 결정 #1): ADR-0127 "결과"에 "바뀜 (2026-10-16~17)" 줄(큰 메뉴 셋, PC 누르면 세 칸, 폰 ☰ 없음 + 줄 누르기 + ▾, 로고는 메인으로만, 간격)을 더하고 제목의 "폰은 ☰"를 "폰은 머리말 줄을 누르면 펼침"으로 고침(파일 이름 그대로), `docs/adr/README.md` 제목도 같이. 명세 R1-5·R1-6 문구 고침
- **결정 #2** [확정] (사용자 승인, 2026-10-17, 회고 결정 #2): 수집기 "저자 무관 다시 고르기"를 없앰. 그런 줄은 못 맞춤(흐린 표지), dev가 두 목록을 다시 돌려 바뀐 줄을 plan-feedback "# 사이클 21"에 보고, 바른 판이 있으면 사람이 `manual`(지침 4절). 반영: ADR-0124 "결과" 바뀜 줄, `docs/research/recommended-lists/matching-guide.md` 2-2절, `docs/current/module-map.md` 수집기 줄·`flows.md` 흐름 46, `docs/reference-index.md` 판이 정해지지 않은 목록 줄. dev 할 일 [to-dev-retro-fixes.md](to-dev-retro-fixes.md), `docs/current/handoff.md` 끝 "함께 할 작은 일: 사이클 21 회고"
- **결정 #3** [확정] (사용자 승인, 2026-10-17, 회고 결정 #3): ADR-0123 "결과"에 바뀜 줄로 표지 차례 다섯(`cover_sources.tsv`) + 김영사 공식 페이지 한 장, 카카오를 뺀 까닭(장기 저장 불가, `docs/research/popular-books/cover-copyright.md` 5절)을 적음
- **결정 #4** [확정] (사용자 승인, 2026-10-17, 회고 결정 #4): 화면 이름 끝 "세트" 덜어 냄, 2권부터 숫자 남김(「토지 2」), 2023-12보다 오래된 이동진 영상은 보지 않음 — 셋 다 그대로. 반영: ADR-0129 "결과", 위 "수집기·표지·맞추기" 표, `matching-guide.md` 2-1절, `module-map.md`

<details><summary>물은 내용 (원문)</summary>


1. **ADR-0127 머리말 결정이 바뀜 (ADR-0127)**: 큰 메뉴 셋(「도서검색」 더함), PC 누르면 세 칸 펼침, 폰 ☰ 없음 + 줄 누르기 + 「로그인」 왼쪽 ▾, 로고는 메인으로만. 사용자가 이미 정한 것이고 ADR 본문만 옛 내용. [안] ADR-0127 "결과"에 ADR-0128·0129처럼 "바뀜 (2026-10-16~17)" 줄을 더하고 제목의 "폰은 ☰"를 고침 (새 ADR로 대체하지 않음). 사이클 20 결정 #9가 정한 명세 R1-5·R1-6 문구 고침도 함께
2. **수집기 판 고르기의 대체 고르기 (ADR-0124)**: 거르기 뒤 남은 판이 없으면 같은 본제목 판 전체에서 **저자를 보지 않고** 다시 고름 — 설계·결정에 없던 규칙이라 다른 사람의 같은 제목 책에 맞출 수 있음(「체호프 희곡선」 같은 오매칭 길). [안] 대체 고르기를 없애고 그런 줄은 고정 판을 비워 "못 맞춤"(흐린 표지·희망도서 안내)으로 둠. 다른 안: 그대로 두되 수집 기록에 대체로 고른 줄을 따로 남겨 사람이 봄
3. **표지 출처를 넓힌 것 (ADR-0123)**: ADR-0123 본문은 "수집기가 ISBN 서지 API 표지를 받아"인데, 실제는 다섯 출처 + 출판사 공식 페이지 한 장. 사용자가 정한 것이라 질문은 기록 방식뿐. [안] ADR-0123 "결과"에 "바뀜 (2026-10-16~17)" 줄로 표지 차례(`cover_sources.tsv`)와 카카오 뺀 까닭을 적음
4. **이유가 없는 dev 세부 셋 (ADR-0129, 0124)**: 화면 이름에서 끝 낱말 "세트"를 덜어 냄, 2권부터 「토지 2」처럼 숫자를 남김, 올해의 책 영상 찾기에서 2023-12보다 오래된 영상은 보지 않음. [안] 셋 다 그대로 [확정] (화면 확인 "폰 확인했어 괜찮아"에서 문제 없음)

</details>

## 회고 고침 결과 (dev, 2026-10-17)

- dev 사이클 20 세션이 저자 무관 다시 고르기를 지우고 두 목록을 다시 돌림: 바뀐 줄 0줄, 이동진 35/43·서울대 87/100 그대로, 연암집·실천이성비판은 R3-3대로 맞음 (dev `data/c20/retro21/report.md`, plan-feedback "# 사이클 21"에 붙일 예정)
- 서울대 4 「춘향전」: 저자 칸 「작자 미상」으로 고치고 작가문화 214341을 `manual` 고정 [확정] (사용자 승인, 2026-10-17, `easy/2026-10-17-chunhyang-edition.html`)
- 가져오기의 마지막 맞추기(목록 줄 ISBN → 제목 + 저자)에는 거르기 낱말이 없음 → 백로그
