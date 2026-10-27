# 설계 제안: 사이클 23 「나에게 맞는 책」 (`/picks/for-you`)

- 쓴 날: 2026-10-24, `architect` 하위 에이전트 제안을 옮김. 사용자 결정은 [easy/2026-10-24-design-decisions.html](easy/2026-10-24-design-decisions.html)에서 받음
- 기준으로 읽은 것: 이 폴더 `scope.md`·`spec.md`·`flow.md`·`pretest-review.md`, `docs/current/` 네 문서의 "사이클 22 이후 dev 변경" 절, ADR-0142·0143·0144·0147, `settings-index.md` 3·7절, `reference-index.md` 3·4·4-1절, `research/ai-recommend/infra-cost.md`, `research/popular-books/kpipa.md`·`alternatives.md`. dev는 GitHub에서 읽은 사본(`CLAUDE.md`, skill 넷, `picks/package-info.java`·`PicksCache.java`·`PicksController.java`, main `adba2d3`)

## 현재 상태

| 항목 | 지금 | 근거 |
|---|---|---|
| 모듈 | `picks`(allowedDependencies = `catalog`, `catalog :: normalize`, `library`, 이벤트 없음, 공개 타입 `CuratedListTransfer`), 목록 키 다섯(`librarian`·`leedongjin`·`snu100`·`kaist`·`nobel`), `PicksCache`가 10분마다 목록별 사본을 통째로 바꿔 끼움, `MainShelf`. `collection → picks`(가져오기 `lists` 모드, ADR-0143). 「나에게 맞는 책」 모듈·표·API 없음 | [확정] (dev 사본) |
| `catalog` 공개 API | `BookLookup.byIds → IdBook(bookId, title, libraryIds …)`, `byIsbn13`, `byTitleAndAuthor`. 서비스 `catalog`에 표지 칸 없음 | [확정]. IdBook의 저자·출판사·출판 연도 [확인 필요] |
| 표 | `picks.list_field`·`list_book`·`cover`(사서 표지만)·`fetch_run`. `usagelog.screen_event.picks_list` CHECK에 목록 키 다섯(`usagelog-006`·`007`) | [확정] |
| 표지 | 사서 밖 목록 표지는 nginx `/covers/<sha1>.jpg`(한 폴더, `public, max-age=604800`). PC `fetch-covers` 결과(`covers/<앞 2자리>/<sha1>.jpg`, `covers.sqlite`)는 서비스가 쓰지 않음 | [확정] (ADR-0144) |
| API | `GET /api/v1/picks/{listKey}`, `/api/v1/picks/shelf`, `/api/v1/picks/covers/{id}`, `POST /api/v1/usage-events`(`picks_list_view`·`picks_book_view`, `list` 필수) | [확정] |
| 운영 서버 요청 | 사서추천 받기 `picks.fetch`(간격 1초, 매일 05:00 판단). 도서관 사이트 조회는 `availability`, 운영 나가는 길 `프록시만`(사용자 2026-10-18) | 값 [확정] / 프록시 구현이 dev main에 있는지 [확인 필요] |
| 운영 호스트 | ADR-0104 EC2 t4g.medium 4GB, gp3 40GiB 안. 사이클 17 기록에는 Lightsail 4GB(SSD 80GB) | 실제 디스크 [확인 필요] |
| 사이클 24(합치기 전) | `picks.ListedBooks.current()` + `loadFromDb()`, `collection` `book-texts` 모드(`kind\tbook_id\tsource\tmade_on\ttext`, 모르는 kind 건너뜀) | [확정: 24 세션 결정], 코드 미병합 |

## 결정 1: 기본 목록 인기 수집을 어디서 돌리나

하루 요청은 교보 일반 4곳·YES24 V1 2곳 각 100권(교보 한 쪽 20줄이면 약 30쪽 [확인 필요]) + 출판유통 POST 44건 안팎(kpipa.md 2절) [추론].

- **A안 운영 서버 예약 작업** [안: 추천]: 새 모듈(결정 2)의 단일 스레드 작업. 교보·YES24는 `availability`의 새 공개 API `RankedListings.fetch(libraryId, sort, page)` [안: 이름]로 받아 기존 어댑터 파싱·`HostQueueBoard` 호스트당 1건·1초·나가는 길 설정을 그대로 씀. 출판유통·KLWAVE는 작은 HTTP 클라이언트, 간격 1초. 책 맞추기는 운영 `catalog`
  - 장점: "새벽 자동, 실패하면 전날 것"을 PC 없이 지킴. 책 번호가 늘 운영 기준. 조회와 같은 호스트 줄이라 같은 도서관에 겹쳐 가지 않음. `*.dkyobobook.co.kr`은 사이트 목록에서 빼고 어댑터 앞에서도 막음
  - 단점: `availability` 공개 API 하나 늘어남. 프록시 길이 dev에 없으면 그것이 먼저 [확인 필요]. 인기순 화면 파싱을 Java로 다시 짬(사전 시험은 Python), 지금 어댑터와 같은 화면 모양인지 [확인 필요]
  - 되돌리는 비용 중간. 나중에 분리할 때: 수집 작업은 for-you 서비스 안, `availability` 호출은 내부 HTTP 하나로
- **B안 내 PC 수집기 + 가져오기 명령**: `scripts/crawl/`에 정식으로 넣고 PC 작업 스케줄러, `collection` 새 모드 `popular`
  - 장점: 파서가 이미 있음. 운영 나가는 길을 건드리지 않음. 수집 원칙(PC 고정 IP)과 같음
  - 단점: 매일 PC가 켜져 있어야 함. PC → 운영 반영이 매일 사람 손을 탈 수 있음 [확인 필요]. PC와 운영 책 번호가 가져오기 사이에 어긋날 수 있음
- **C안 섞기** (출판유통·KLWAVE·계산은 서버, 교보·YES24만 PC 파일): 운영이 도서관 사이트를 부르지 않지만 매일 PC에 기대고 길이 둘
- 추천 이유: spec "새벽, 실패하면 전날 목록"[확정]을 사람 손 없이 지키는 길은 A뿐. 하루 수십 건은 1초 간격 안에서 작음 [추론]. 프록시 길이 없거나 파서가 크게 늘면 B로. 출처마다 켜고 끄기 `chaekcheck.foryou.sources.<source>.enabled` [안: 이름] (ADR-0147)

## 결정 2: 어느 모듈이 맡나 (꼬리표 자리 포함)

- **A안 새 모듈 `foryou`** [안: 이름, 추천]: allowedDependencies = `catalog`, `library`, `picks`, `availability`(결정 1 A일 때). 기본 목록·점수·이웃·탭 글·표지 연결·API. 추천목록 소속과 꼬리표는 `picks`의 `ListedBooks.current()`(24와 같은 API)로 읽음. 꼬리표 표 `picks.book_tag`는 `picks` 소유, `ListedBook`의 nullable 칸(24가 정한 자리)으로 내보냄
  - 장점: 꼬리표는 추천목록 책에만(R9-1)이라 `picks` 소유가 뜻에 맞음. 24 `aisearch`도 같은 꼬리표를 받음. `foryou → picks` 한 방향. `picks`가 더 커지지 않음
  - 단점: 모듈 하나 늘어남. `ListedBook`에 `bookId`·목록 키·꼬리표가 필요(24 모양 [확인 필요])
  - 나중에 분리할 때: 추천 서비스 하나(`foryou` 스키마)로 떼기 쉬움
- **B안 모두 `picks` 안**: 안의 코드를 바로 쓰지만 `picks` 책임(목록 + 인기 수집 + 이웃 134만 줄 + 글)이 너무 커지고 `availability`에도 의존. 나중에 떼기 어려움
- **C안 꼬리표까지 `foryou`**: 24가 받아들인 "ListedBook의 nullable 칸"과 어긋남

## 결정 3: PC 계산 결과를 운영 DB에 넣는 길

### 3-a 이웃 표 모양

| | 책당 한 줄 `book_id` + `neighbour_ids bigint[]`(≤20) | 짝마다 한 줄 `(book_id, rank, neighbour_id)` |
|---|---|---|
| 줄 수 | 1,340,875 | 약 2,680만 |
| 크기 어림 [추론] | 약 0.3GB + PK 약 35MB (`int[]`면 약 0.2GB) | 약 2GB |
| 읽기 | PK 3번 | PK 범위 3번 |
| 넣기 | COPY 134만 줄 | COPY 2,680만 줄, 색인 오래 걸림 |

추천: 책당 한 줄 [안]. 4GB 서버·40GiB 디스크([확인 필요])에 2GB 표는 부담. 유사도 점수는 정렬에 안 쓰므로 저장하지 않고 배열 차례가 가까운 차례 [안]. 원소 `bigint[]`(`catalog.book.id`에 맞춤) [안]

### 3-b 넣는 명령

- **A안** [추천]: 이웃은 새 모드 `neighbours`(TSV `book_id\tneighbour_ids`, 머리말 `export_id`). `full`은 `foryou.book_neighbour_next`에 COPY 뒤 한 트랜잭션에서 이름 바꿔 끼움, `add`는 `ON CONFLICT (book_id) DO UPDATE`. 운영 `catalog_import.export_id`와 다르면 멈춤(`--force`로만) [안]. 글·꼬리표·표지 연결은 24의 `book-texts`에 kind `for_you_blurb`→`foryou.book_blurb`, `tags`→`picks.book_tag`(`text` = 사전 코드 쉼표 목록), `cover_file`→`foryou.book_cover`(`text` = sha1 40자). `collection`은 kind마다 `foryou.ForYouTransfer`·`picks.BookTagTransfer` [안: 이름]를 부름
  - 장점: 사람이 쓰는 글은 24와 같은 파일·명령 하나(24의 배치 합치기 제안과도 맞음). 큰 숫자 표는 전용 모드로 빠르게
  - 단점: 23·24 중 먼저 합쳐지는 쪽이 `book-texts`를 만들어야 함. `cover_file`이 "text" kind로는 조금 억지
- **B안 이웃까지 `book-texts` kind**: 134만 줄이 텍스트 칸으로 지나가고 바꿔 끼우기·번호 검사를 넣기 어려움
- **C안 이웃을 catalog export/apply 반영 파일에**: 번호가 catalog와 같이 바뀌지만 처음 38시간 계산이 가져오기 주기를 막음
- 결과: 가져오기 사이 새 책은 다음 `add`까지 이웃 없음(기본 목록만). 옛 책의 이웃에는 새 책이 안 들어감(R7-3 결과) — 받아들일지 [확인 필요]

## 결정 4: 개인 추천에서 서버와 브라우저가 하는 일

전제: scope [확정] "상위 3권 번호만 보냄", spec 입력 표 "본 책을 서버로 보낼지 브라우저가 거를지는 설계에서", R6-1b(다시 보여 줄 본 책의 카드 정보가 필요)

- **A안** [추천]: 서버(GET)는 기준 책 ≤3의 이웃 합치기(≤60), 기준 책 빼기, 계획 도서관 거르기, 정렬(인기 점수 있는 책 점수 순 → 소장 도서관 수 순), `authorKey`. 다시 보여 줄 후보 `reshowBookIds`(≤6, 브라우저가 R6-1b 조건으로 고름)의 카드도 `reshowBooks`로. 브라우저는 본 책(≤200) 빼기, 기본 목록과 겹침 정리, 같은 저자 연속 2권, 20권씩, 8·16번째에 다시 섞기
  - 장점: 본 책 목록이 서버·nginx 로그에 남지 않음. 보내는 것은 기준 3 + ≤6. GET이라 CSRF 없음. S19 뒤 같은 요청
  - 단점: 순서 규칙 일부가 TypeScript(Vitest). "3권만"을 넘어 ≤6 번호를 더 보냄 → 사용자 확인
- **B안**: 브라우저가 본 책 ≤200을 POST, 서버가 모두 처리. 규칙이 Java 한 곳이지만 scope "3권만"을 바꾸고 행태 정보가 서버로 감, CSRF·캐시 문제
- "소장 도서관 수"는 서비스 전체 수(`libraryIds` 길이) [안], 계획 도서관 수로 할지 [확인 필요]

## 결정 5: 기본 목록·이웃 책의 표지

- **A안** [추천]: PC `fetch-covers` 결과 가운데 탭 글과 같은 범위(기본 목록 후보 + 추천목록 약 2,800 + 소장 많은 3만 권)만 운영 `/srv/chaekcheck/covers/`(sha1 이름)에 옮기고, 연결은 `book-texts` kind `cover_file`. 그 밖은 제목 글자 표지(R3-4). `coverUrl` = `/covers/<sha1>.jpg`, nginx 규칙(ADR-0144) 그대로
  - 장점: 서버가 책 사이트에 요청하지 않음. nginx·CSP 그대로. 약 3.3만 장 × 약 10KB ≈ 0.3GB [추론]
  - 단점: 오늘 새로 든 인기 책은 다음 PC 반영까지 글자 표지. 파일 옮기기는 사람이. `fetch-covers` 원본 출처의 이용 조건은 공개 배포 전 확인 [확인 필요]
- **B안**: A + 서버가 기본 목록 40권 중 표지 없는 책만 YES24 표지 주소에서 받음. 오늘 책에도 표지가 생기지만 서점 이미지 서버 요청(이용 조건 [확인 필요]), 쓰기 볼륨, 교보 표지 호스트가 `dkyobobook`이면 못 받음
- **C안**: 서비스 `catalog`에 표지 칸 — 변경이 큼, 범위 밖(backlog 132줄)

## 결정 6: 같은 책의 다른 판 합치기 (「돈의 속성」 두 판)

- **A안 책 번호만**: 단순하지만 두 판이 따로 나오고 점수를 나눠 가짐
- **B안** [추천]: 점수 계산 때 "같은 책" 규칙(본제목 정리값 `main_title_norm` 같고 AUTHOR·UNKNOWN 역할 `name_exact`를 하나 이상 공유, matching-guide 2-2절, 사이클 21 승인 규칙)으로 판을 모아 점수를 더하고 소장 도서관이 가장 많은 판 하나만 남김. `catalog` 공개 API `BookLookup.workKeys(bookIds)` [안]
  - 단점: catalog 공개 API 하나 늘고 규칙이 수집기(Python)와 두 벌
- 추천 이유: AC-4 상위 40권 품질에 바로 걸림, 같은 규칙이 이미 사용자 승인을 받음

## 모듈·데이터·API 초안 (추천안 기준)

### 모듈

| 모듈 | 공개 API (새/바뀜) | 이벤트 | 소유 표 |
|---|---|---|---|
| `foryou` (새) [안: 이름] | `ForYouTransfer`(이웃 full/add, 탭 글·표지 연결 upsert, `collection`만 부름), 컨트롤러 둘 | 없음 | `foryou.build_run`, `popular_row`, `book_score`, `base_entry`, `book_neighbour`, `book_blurb`, `book_cover` |
| `picks` | 24의 `ListedBooks.current()`, `ListedBook`에 `bookId`·목록 키·`tags`(nullable). `BookTagTransfer`(새) | 없음 | `picks.book_tag`(새). 사전은 빌드 리소스 `picks/tag-dictionary.tsv`(`code, axis, name, thema_code`) [안] |
| `catalog` | `IdBook`에 `authorDisplay`·`publisher`·`publishedYear` 또는 카드용 새 레코드 [안], `workKeys(bookIds)` [안]. 목록 줄 → 책 번호 맞추기에 소장 키 역조회가 필요한지 [확인 필요] | 없음 | 그대로 |
| `availability` | `RankedListings.fetch(libraryId, sort, page)` [안: 이름] | 없음 | 그대로 |
| `collection` | 모드 `neighbours`(새), `book-texts` kind `for_you_blurb`·`tags`·`cover_file`(새), `collection → foryou` | 없음 | 그대로 |
| `usagelog` | `list` 허용 값에 `for_you` | 없음 | CHECK만 |
| `library` | 그대로(`planSearch`) | | |

웹(`web/src/features/picks/`): `PICKS_TABS` 맨 앞 for-you, `/picks` 넘김, 본 책 저장소(번호·제목·점수 비트 셋·마지막 시각·빼기 기한, 200권, 30일), 10초는 `visibilitychange`로 멈춤, S18·S19, 결정 4 A의 순서 규칙과 Vitest

### 데이터 (스키마 `foryou` + `picks.book_tag`)

| 표.칸 | 타입 | 제약 | 설명 | 태그 |
|---|---|---|---|---|
| `foryou.build_run` | `id` identity, `built_on date`(Asia/Seoul), `started_at`, `finished_at`, `status text`, `note text` | `status` IN (`running`,`succeeded`,`failed`), 색인 `(status, built_on DESC)` | 마지막 성공 목록 찾기 | [안] |
| `foryou.popular_row` | `run_id` FK CASCADE, `source text`, `site_library_id bigint`(FK 없음), `period text`, `rank smallint`, `loans_now int`, `reservations int`, `title`, `author`, `publisher`, `isbn13`, `book_id` | `source` IN (`kyobo_elib`,`yes24_elib`,`kpipa_rank`,`kpipa_200`,`klwave`), `rank ≥ 1`, 수 ≥ 0 | 가중치 조정(R2-3a)용 원재료, 30일 보관 | [안] |
| `foryou.book_score` | PK (`run_id`, `book_id`), `score real ≥ 0` | | 개인 추천 "인기 먼저" 정렬, 하루 약 1,000줄 이하 [추론] | [안] |
| `foryou.base_entry` | PK (`run_id`, `position`), `book_id`, `from_popular boolean` | `position` 1~40, UNIQUE (`run_id`, `book_id`) | 기본 목록 40권 | 40은 R2-4 따라 |
| `foryou.book_neighbour` | `book_id` PK, `neighbour_ids bigint[]`, `computed_on date` | `cardinality` 1~20, `array_ndims = 1`, 자기 자신 없음(넣을 때 검사) | 가까운 차례 | 20 [확정] (R6-1), 모양 [안] |
| `foryou.book_blurb` | `book_id` PK, `blurb text`, `made_on date` | `char_length` 1~300 | 80~150자 규칙은 PC가 지킴 | 300 [안] |
| `foryou.book_cover` | `book_id` PK, `file_key text` | `~ '^[0-9a-f]{40}$'` | `/covers/<file_key>.jpg` | [안] |
| `picks.book_tag` | PK (`book_id`, `tag_code`), `made_on date` | `tag_code ~ '^[A-Za-z0-9_]{1,20}$'` | 사전 코드 | [안] |

- 다른 모듈과 FK·조인 없이 `book_id`·`library_id` 값만. 가져오기로 빠진 책은 `BookLookup.byIds`가 돌려주지 않아 빠짐
- 크기 어림 [추론]: 이웃 약 0.3GB + PK 약 35MB, 글 약 15MB, 나머지 작음
- Liquibase(새 파일만, 번호는 합칠 때): `foryou/001-for-you.yaml`, `picks/006-book-tag.yaml`(24가 picks에 더하면 그다음), `usagelog/00N-picks-list-for-you.yaml`(`screen_event.picks_list` CHECK 다시 만들며 `for_you` 더함, 24 `usagelog-ai-search-event` 다음). 서버 검사 상수도 함께

### API (인증 없음, nginx 일반 `/api/` 구역 5r/s, 계획 파라미터는 `/api/v1/picks/{listKey}`와 같음)

| 메서드 | 경로 | 요청 | 응답 | 오류 |
|---|---|---|---|---|
| GET | `/api/v1/for-you/books` [안] | 계획 파라미터 | 200 `{builtOn, books[]}`, 계획 도서관 0곳 책은 뺌, 한 번도 못 만들면 `builtOn: null` + 추천목록만 | 400 `validation_error`, 422 `invalid_region`, 500 |
| GET | `/api/v1/for-you/similar-books` [안] | `baseBookIds`(1~3, 필수), `reshowBookIds`(0~6), 계획 파라미터 | 200 `{baseBooks[], books[] ≤60 정렬됨, reshowBooks[]}`, 모르는 번호는 조용히 뺌 | 400 `validation_error`(`required`·`invalid_format`·`too_many`·`duplicate`), 422, 500 |

카드 칸: `bookId`, `title`, `author`, `publisher`, `coverUrl`(없으면 null), `blurb`(없으면 null), `tags[{code,axis,name}]`(추천목록 책만), `planLibraryCount`(≥1), `lists`(목록 키만, 문구는 웹이), similar에는 `authorKey`(첫 저자 `name_exact`). 인기 점수·출처 이름은 내보내지 않음(R3-2). 사용 알림 `list=for_you`, `category` 값 [확인 필요]

### 설정 (settings-index에 더할 것, 모두 [안])

만들기 시각 `chaekcheck.foryou.build.cron`(05:00과 겹치지 않는 새벽, 예 04:00), 켤 때 오늘 것 없으면 만듦, 출처마다 `enabled`, 사이트 목록, 사이트마다 100권, 출판유통·KLWAVE 연결 5초·읽기 10초·간격 1초, 기록 30일, 기본 목록 40, 이웃 20, 개인 추천 60·한 쪽 20·다시 보여 주기 20권마다 2·후보 6, 브라우저 본 책 200·30일·10초·3일, 메모리 사본 10분

## 확인 필요 (제안 기준)

| # | 무엇 | 방법 |
|---|---|---|
| 1 | 결정 4 A의 다시 보여 줄 후보 ≤6 번호를 보내도 되는지(scope "3권만") | 사용자 |
| 3 | 사이클 24 Haiku 배치 합치기 제안 | 사용자 |
| 4 | "소장 도서관 수 많은 순"이 전체인지 계획 도서관인지 | 사용자 |
| 5 | ADR 번호가 0148·0149 둘만 남음 | 사용자·24 세션 |
| 6 | for-you 사용 알림 `category` 값 | dev `UsageEventController` + 사용자 |
| 7 | 프록시 길이 dev main에 있는지, 인기순 화면을 지금 어댑터로 읽는지 | dev 코드 |
| 8 | 목록 줄 → 책 번호 맞추기 방법, 운영 `catalog` 소장 키 역조회 색인 | dev 보고서·코드 |
| 9 | `IdBook`의 저자·출판사·출판 연도("전자책이 나온 해"의 뜻) | dev 코드 + 사용자 |
| 10 | 24 `ListedBook` 실제 칸, `book-texts` kind별 동작 | 24 브랜치 |
| 11 | 출판유통 범위(spec 일·주·월 Top100 vs kpipa.md Thema 월간 Top50), 「화제의 책 200선」 보충 방식, KLWAVE 형식. 파일이면 PC 파일 모드 필요 | 사용자 PC 원문 |
| 12 | 운영 디스크·DB 여유 | 사이클 17 운영 기록 |
| 13 | `fetch-covers` 표지 평균 크기·출처별 이용 조건 | `covers.sqlite`, 공식 문서 |
| 14 | 가져오기 사이 새 책 이웃, 옛 책 이웃에 새 책이 안 들어가는 것 | 사용자 |
| 15 | 오늘 기본 목록 새 책 중 글 없는 것을 PC가 아는 방법 | 사용자·dev 절차 |
| 16 | 꼬리표 사전: 빌드 리소스 vs 표 | 사용자 |
| 17 | 교보문고 약관 제11조⑨가 교보 일반 전자도서관 목록 받기에 걸리는지 | 공식 문서, 사용자 |

## backlog 후보

- 서버가 오늘 새로 든 인기 책 표지만 YES24에서 받기(결정 5 B)
- 서비스 `catalog` 표지 칸(결정 5 C, backlog 132줄)
- 이웃을 GPU 임대로 다시 계산해 옛 책 이웃에 새 책 넣기
- 책 화면의 "비슷한 책" 칸(scope 제외)
- 인기 점수 가중치를 운영 설정으로 바꾸기(R2-3a 조정이 잦아지면)

구조 그림(모듈 구성도, 흐름 셋, 도메인 모델, 상태, ER)은 결정 뒤 `design-delta.md`에 옮김.
