# 개발 인계서: 사이클 23 추천 도서 탭 「나에게 맞는 책」

- 기준 문서: plan `docs/cycles/23-for-you-picks/design-delta.md`(사용자 검토 승인 2026-10-24)를 따라 구현합니다. `architect-proposal.md`는 결정 기록입니다. 그 안의 `bigint[]` 이웃 배열과 "사전은 빌드 리소스" 안은 **무효**입니다. 이웃은 4바이트 `integer[]`(결정 #3), 사전은 DB 표(결정 #9)입니다
- ADR: 0147(출판유통 판매 순위를 위험을 감수하고 씀), 0148(인기 목록은 운영 서버가 새벽에 받음, 표지는 PC 표지를 옮김), 0149(모듈 `foryou`, 이웃 표와 넣는 길, 개인 추천 나누기, 판 모으기, 한 번 호출 배치, 꼬리표 사전 표). 모두 Accepted, 2026-10-24
- 이 인계서의 자리: plan `docs/cycles/23-for-you-picks/handoff.md`. dev에서는 `../chaekcheck-plan/docs/cycles/23-for-you-picks/handoff.md`로 읽습니다
- 따로 보내는 문서 둘(이 인계서와 함께 따름)
  - `to-dev-popular-list-check.md`: 책을 수집할 때마다 인기 목록 받기를 검증합니다
  - `to-dev-intro-test-2026-10-24.md`: 소개 원문 채우기와 이웃 다시 재기. 수집 세션에 2026-10-24에 이미 보냈고, 표지 범위 고르기도 같은 날 함께 부탁했습니다

## 일정과 다른 사이클과의 순서

- **한 번에 개발합니다** [확정] (사용자 "한 번에", 2026-10-23, scope "슬라이스 선택 기록"). 단계로 나눠 따로 반영하지 않고 운영 반영은 한 번입니다. 다만 dev 안에서는 아래 "구현 단계" 차례로 만들고, 체크포인트마다 멈춰 확인합니다
- **체크포인트** [안]
  - A (0단계 끝): 계획을 바꿀 수 있는 확인 결과를 plan에 보고합니다. 멈춤 조건에 걸리면 거기서 멈춥니다
  - B (3단계 끝): dev 환경에서 인기 사이트 여섯 곳을 실제로 받고, 사이트마다 줄 수를 적습니다
  - C (5단계 끝): dev DB에서 만들기를 한 번 돌려 상위 40권을 표로 만들고, plan을 거쳐 사용자에게 보입니다(R2-3a)
  - D (9단계 끝): 화면 확인과 사용자 실제 폰 확인
  - E (11단계): 운영 반영 한 번
- **사이클 24와 같이 쓰는 부분** [확정] (design-delta 머리말, ADR-0149 결과)
  - 같이 쓰는 것: `picks.ListedBooks.current()`·`loadFromDb()`, 그리고 `collection`의 `book-texts` 넣기 모드
  - 24의 설계: plan 저장소 `hodu-sketch/chaekcheck-plan` 브랜치 `claude/compassionate-lovelace-mzvp4f`의 `docs/cycles/24-ai-book-search/design-delta.md`, ADR-0151
  - **23과 24 가운데 dev가 먼저 만드는 쪽이 24 설계대로 이 둘을 만듭니다.** 다른 쪽은 kind와 칸만 더합니다. 23이 먼저면 `ListedBook`·`book-texts`를 24 문서 그대로 만들고, 23의 `tags` 칸과 kind 셋(`for_you_blurb`·`tags`·`cover_file`)을 더합니다. kind `search_line`은 24 `aisearch`가 생길 때까지 "모르는 kind"로 건너뜁니다
  - 24가 먼저 main에 들어갔으면 그 위에서 시작하고, 23은 `tags` 칸과 kind 셋만 더합니다
- **사이클 24 plan 세션에 알릴 것** (dev가 전함): 설계 결정 #7(사용자 승인 2026-10-24, ADR-0149 결정 3)
  - PC Haiku 배치는 **책 한 권당 한 번 호출**로 탭 추천 글(23)·꼬리표(23)·찾기용 한 줄(24)을 함께 만듭니다
  - 입력은 **대상 책 목록**이고, 새 책만 더 돌립니다
  - 결과는 `book-texts.tsv` 한 파일에 kind별로 담깁니다
  - 24 세션이 배치를 따로 설계했다면 이 결정에 맞춰야 하므로, 알린 날과 받은 답을 `# 사이클 23` 절에 적습니다
- **Liquibase 번호** [확정] (design-delta "데이터", scope "사이클 24와 나눈 번호")
  - 새 changelog 파일로만 추가합니다. 기존 changeset은 고치지 않습니다(운영 배포가 끝났으므로 `PRE_DEPLOYMENT` 예외는 쓰지 않습니다)
  - 파일 번호는 **23과 24를 합칠 때** 다음 번호로 정합니다
  - `usagelog` 파일은 24의 changeSet id `usagelog-ai-search-event` **다음**입니다. 나중에 main에 들어가는 쪽이 rebase해서 자기 include를 master 끝으로 옮깁니다
- 버전: 새 화면과 새 API가 생기는 호환 기능이라 MINOR 후보입니다 [안: 배포 때 dev가 정함]

## 요약

추천도서 탭 줄 맨 앞에 「나에게 맞는 책」(`/picks/for-you`)을 둡니다. 새 모듈 `foryou`가 매일 새벽 기본 목록 40권을 만듭니다. 재료는 교보 일반 전자도서관 4곳과 YES24 V1 전자도서관 2곳의 인기순 앞 100권(`availability`의 새 `RankedListings`로 받음), 출판유통 판매 순위·「화제의 책 200선」, KLWAVE, 추천목록입니다. 점수를 내고, 같은 책의 판을 모으고, 섞어서 만듭니다. 브라우저가 최근 본 책 상위 3권을 보내면, PC에서 KURE-v1로 미리 계산해 넣은 이웃 표로 비슷한 책을 위에 더합니다. 카드의 추천 글·꼬리표·표지 연결은 PC Haiku 배치와 표지 옮기기 결과를 `book-texts` 모드로 넣고, 꼬리표와 꼬리표 사전은 `picks`가 갖습니다.

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요.**
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 구조, 순서) 조용히 바꾸지 않습니다
  - 먼저 사용자에게 알립니다
  - dev `docs/plan-feedback.md`의 새 **`# 사이클 23`** 절에 무엇을 왜 바꿨는지 적습니다. 사용자 발언은 그대로 옮깁니다
- `[안]`·`[안: 이름]`은 dev가 코드에 맞춰 바꿀 수 있고, 바꾸면 `# 사이클 23` 절에 알리기만 합니다
  - 예: `ForYouTransfer`·`BookTagTransfer`·`RankedListings`·`workKeys`의 이름, 경로 `/api/v1/for-you/*`, 설정 키 `chaekcheck.foryou.*`, CHECK·changeset 이름, `book-texts` kind 이름, 브라우저 저장소 키, 컴포넌트 이름
- **바꾸지 않는 것** [확정]
  - 모듈 나누기: `foryou` 새 모듈, 꼬리표·사전은 `picks`(결정 #2). 의존 방향은 `foryou → catalog, library, picks, availability`, `collection → foryou`
  - 이웃 표: 책마다 한 줄, `integer[]`, 최대 20(결정 #3, R6-1)
  - 인기 목록은 운영 서버가 새벽에 받음(결정 #1). `*.dkyobobook.co.kr`에는 보내지 않음(사이클 13 R1-6)
  - 출처마다 따로 끌 수 있음(ADR-0147)
  - 개인 추천 나누기: 서버가 이웃 모으기·보유 거르기·정렬, 브라우저가 본 책 빼기·같은 저자·쪽 나누기·다시 섞기. 보내는 번호는 기준 책 ≤3과 다시 보여 줄 후보 ≤6뿐(결정 #4)
  - 본 책 기록은 브라우저에만 둡니다. 서버는 회원 번호로 계산하지 않습니다(R5-1)
  - 판 모으기 규칙: 본제목 정리값이 같고 저자를 공유하면 같은 책. 점수를 더하고 소장 많은 판 하나만 남깁니다(결정 #6)
  - 점수 재료와 [확정] 가중치: 예약 2배, 연도 구간 3·6·10년과 가산 1.5·1.0·0.6·0.3, 출판유통 1.5(R2-3)
  - 차례 R2-4와 40권
  - 카드 꼬리말은 추천목록에 있는 책에만(R3-2)
  - spec·flow의 문구 전부(아래 "문구표")
  - `popular_row` 보관: 30일, 마지막 succeeded 실행은 지우지 않음
  - 서버를 켤 때 오래된 `running`은 `failed`로(사용자 승인 2026-10-24, 마무리 검토 #2)
- 태그 뜻
  - `[확정]`: 사용자가 정했거나 공식 문서로 확인한 값
  - `[안]`: 제안
  - `[확인 필요]`: 모르는 값. 코드에 확정값처럼 넣지 말고 `TODO(확인 필요)`로 둔 뒤 확인하고 보고합니다
- 단계마다 통과해야 다음 단계로 갑니다
  - `backend/`에서 `./gradlew build`(`ModularityTests`·`DocumentationTests` 포함)
  - 웹 단계는 `web/`에서 `npm run build`와 vitest
  - 수집기 단계는 `python -m unittest …`
- dev `CLAUDE.md`, 스킬(`spring-modulith`, `postgres-patterns`, `jpa-patterns`, `api-design`), `docs/maintenance/3-import.md`, 사이클 11·13·14·21·22 인계서의 제약을 그대로 따릅니다. 아래에는 더하거나 바뀌는 것만 적습니다

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `docs/cycles/23-for-you-picks/design-delta.md`: **기준 문서**
  - 설계 결정 표 #1~#10, 구조 그림(모듈, 흐름 A·B·C, 도메인, 만들기 실행 상태, ER)
  - "모듈", "데이터"(칸 표, 크기 어림, Liquibase), "API"(요청·응답 예시, 정렬), "넣는 명령", "외부 연동", "설정", "확인 필요"
- `.../spec.md`: R1~R11, 상태별 동작, AC-1~AC-17, 데이터 출처
- `.../flow.md`: S13(바뀌는 곳), S18, S19, S14(이 탭에서 열 때), 책 화면
- `.../scope.md`: [확정] 표, 사이클 24와 나눈 번호
- `.../pretest-review.md`: 사전 시험 사실 1~8, 상위 40권 계산 2-3절(지금 가중치의 기대 모양)
- `.../to-dev-popular-list-check.md`, `.../to-dev-intro-test-2026-10-24.md`
- dev `docs/reports/cycle23-pretest-2026-10-24.md`, `docs/reports/cycle23-pretest/`(커밋 `d7a61b7`): 사전 시험 원본, 인기순 화면 저장본, `popular-top100.tsv`, `neighbours.tsv`
- 사이클 24: 위 브랜치의 `docs/cycles/24-ai-book-search/design-delta.md`, ADR-0151(`ListedBooks`, `book-texts`)
- 조사: `docs/research/ai-recommend/`(overview 6-1·7절, tag-vocabulary.md, law.md 3절), `docs/research/popular-books/kpipa.md`·`alternatives.md` 5·6절
- 화면 그림: `docs/research/ai-recommend/easy/2026-10-23-for-you-tab-screens.html`, `easy/2026-10-24-screen-flow-decisions.html`

## 결정 기록

| ADR | 이번 구현에 주는 것 |
|---|---|
| 0147 | 출판유통 판매 순위와 「화제의 책 200선」을 점수 재료로 씁니다. 표지는 쓰지 않습니다. 카드에 출처를 적지 않습니다. 이 출처만 끄는 설정을 둡니다 |
| 0148 | `foryou`가 매일 새벽 직접 받습니다. 도서관 사이트는 `availability.RankedListings`로, 조회와 같은 호스트 줄(호스트당 1건·1초)과 나가는 길 설정을 씁니다. 책을 수집할 때마다 검증합니다. 표지는 PC `fetch-covers` 결과 가운데 범위만 `/covers/`로 옮기고, 연결은 `cover_file` kind로 넣습니다 |
| 0149 | `foryou` 모듈, `book_neighbour`(`integer[]` ≤20)와 `neighbours` 모드(full은 바꿔 끼우기, add는 upsert, `export_id`가 다르면 멈춤), `book-texts` kind 셋, 개인 추천 서버·브라우저 나누기, 판 모으기, 한 번 호출 배치, 사전 표 `picks.tag_dictionary` |

## 공통 제약

- **C1. 모듈 경계** [확정] (design-delta "모듈")
  - 새 `backend/src/main/java/com/chaekcheck/foryou/package-info.java`: `allowedDependencies = {"catalog", "library", "picks", "availability"}` [안: 목록은 design-delta 그대로]. 고리는 없습니다(`picks`·`availability`·`catalog`는 `foryou`를 모름)
  - `collection/package-info.java`: `allowedDependencies`에 `"foryou"`를 더하고 Javadoc을 고칩니다
  - `picks` 의존은 그대로입니다. 새 공개 타입은 `ListedBooks`(24와 같음)와 `BookTagTransfer`입니다
  - 새 이벤트도 공용 모듈도 만들지 않습니다
  - 다른 모듈과는 `bookId`·`libraryId` 값으로만 잇습니다(FK·조인 없음)
- **C2. 요청 예절** [확정] (design-delta "외부 연동", ADR-0148, 사이클 13 R1-6)
  - 도서관 사이트: 호스트당 한 번에 1건, 1초 간격. 지금 `HostQueueBoard`와 나가는 길 설정(운영 `proxy-only`, 사용자 2026-10-18)을 그대로 씁니다
  - **`*.dkyobobook.co.kr`에는 어떤 요청도 보내지 않습니다**: 사이트 목록에 넣지 않고, 어댑터 앞에서도 호스트 검사로 막습니다(시험으로 확인)
  - 재시도는 하지 않습니다 [안: 사전 시험과 같음]. 실패한 사이트는 그날 빠집니다
  - 출판유통·KLWAVE: 간격 1초, 연결 5초, 읽기 10초 [안]
  - 수집 PC 작업도 같습니다: 한 번에 한 요청, 요청 사이 1초 이상(소개 원문 시험은 2초), `*.dkyobobook.co.kr` 금지, 돌고 있는 수집이 쓰는 서버에는 보내지 않음
- **C3. 새벽 인기 받기를 조회 통계와 섞지 않음** [확인 필요: dev 코드·시험] (design-delta "확인 필요" 끝 줄)
  - `RankedListings` 요청은 사이클 20의 조회 상태 불(`GET /api/v1/lookup-status`)과 도서관 응답 일별 집계(`library_response_daily`)에 들어가지 않게 합니다
  - 섞일 수밖에 없는 구조면 멈추고 보고합니다
- **C4. 본 책은 브라우저에만** [확정] (R5-1, R5-7)
  - 서버에 새 사용 알림을 보내지 않습니다(`book_dwell` 없음)
  - 개인 추천 요청에는 기준 책 ≤3과 다시 보여 줄 후보 ≤6 번호만 실립니다
  - 그 요청 주소가 nginx 접속 기록에 회원 번호와 함께 남는지 확인합니다 [확인 필요: dev 운영 설정]
- **C5. 비밀 값**: Anthropic API 키는 수집 PC에만 둡니다. 서비스는 Haiku를 부르지 않습니다. 로그·파일·커밋에 남기지 않습니다
- **C6. 겹치는 파일**
  - 24와 겹침: `picks`(`ListedBooks`), `collection` 가져오기, `usagelog` CHECK, `db.changelog-master.yaml`
  - 사이클 20 2단계와 겹침: `availability`
  - 나중에 main에 들어가는 쪽이 rebase로 충돌을 풉니다

## 개발 시작 전 확인

### dev가 확인할 것 (0단계에서 함)

- [ ] base package `com.chaekcheck` [확정] (dev `CLAUDE.md`). 모듈 패키지는 `com.chaekcheck.foryou` [확정: 모듈 이름, 결정 #2]
- [ ] 시작 커밋은 지금 dev main 끝입니다(plan이 읽은 기준은 `adba2d3`). 24가 이미 main에 있는지 보고, `# 사이클 23` 절에 적습니다
- [ ] 작업 폴더·브랜치·docker 프로젝트·포트 [안: dev가 정해 보고]. 다른 사이클의 docker 프로젝트는 켜고 끄지 않습니다
- [ ] 0단계의 확인 여덟 가지(아래)

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 출판유통 받을 범위(일·주·월 Top100인지 Thema 월간 Top50인지), 「화제의 책 200선」 받는 법·형식, KLWAVE 형식(파일인지 API인지)을 PC에서 원문으로 확인 | 5단계 전 | 출처 어댑터 모양. KLWAVE가 파일이면 PC 파일 모드가 하나 더 필요(plan에 물음) |
| 교보문고 약관 제11조⑨가 교보 전자도서관 목록 받기에 걸리는지 판단 | 공개 반영 전 | 진행 / 교보 출처 끄기 |
| 상위 40권 보고 가중치 조정(R2-3a) | 체크포인트 C | 가중치 값 |
| 추천 글 표본 수와 읽는 사람 정하기(R8-6) | 10단계 Haiku 배치 뒤 | 검토 |
| 꼬리표 사전 확정(사람이 확정, R9-2) | 10단계 사전 TSV 뒤 | `tag-dictionary` 넣기 |
| 화면 확인, 실제 폰(Samsung Internet) 확인 | 체크포인트 D | 진행 / 고침 |
| 운영 반영 승인 | 11단계 | 승인 |

## 구현 단계

경로 약어
- `F` = `backend/src/main/java/com/chaekcheck/foryou/`
- `P` = `backend/src/main/java/com/chaekcheck/picks/`
- `C` = `backend/src/main/java/com/chaekcheck/catalog/`
- `A` = `backend/src/main/java/com/chaekcheck/availability/`
- `I` = `backend/src/main/java/com/chaekcheck/collection/internal/importer/`
- `L` = `backend/src/main/resources/db/changelog/`
- `W` = `web/src/features/picks/`

### 0단계: 계획을 바꿀 수 있는 확인 (코드 변경 없음, 체크포인트 A)

결과를 `# 사이클 23` 절에 적고, 멈춤 조건에 걸리면 plan에 보고한 뒤 기다립니다.

1. **프록시 나가는 길(사이클 20 1단계 1-15)이 dev main에 있는지**
   - 설정 키 `chaekcheck.availability.egress.mode`·`egress.proxies` [안: 이름, settings-index]가 실제로 무엇인지, 그 길로 나가는지 봅니다
   - 이유: 결정 #1의 조건입니다(ADR-0148 A안 단점)
   - **멈춤**: 없으면 plan에 보고합니다(그 구현을 먼저 할지 사용자가 정함)
   - 위험: 높음
2. **교보 일반·YES24 V1 인기순 화면을 지금 어댑터 파서로 읽는지**
   - 대상: 교보 일반 `contentList.ink?…orderByKey=loanNmvl`, YES24 V1 `/search/?…&sort=lending`. 저장본(`docs/reports/cycle23-pretest/`)과, 필요하면 사이트마다 한 번 요청(C2)
   - 볼 것: 제목·저자·출판사·ISBN·대출 중 수·예약 수, 소장 키(사이트 쪽 책 번호)를 읽는지, 쪽 크기(사전 시험은 쪽당 80) [확인 필요]
   - **멈춤**: 지금 어댑터로 읽을 수 없고 파서를 크게 새로 짜야 하면 멈추고 plan에 보고합니다. 대안은 PC 수집기가 받고 파일로 넣는 길(ADR-0148 B안, "되돌리는 비용")이고, plan이 사용자에게 다시 묻습니다
   - 위험: 높음
3. **사전 시험이 목록 줄을 책 번호에 어떻게 맞췄는지**
   - 사전 시험은 "그 도서관 소장 줄"로 맞춰 2,590/2,600을 얻었습니다(pretest-review 1절 #4)
   - 운영 `catalog`에서 (도서관 번호, 사이트 소장 키)로 책 번호를 찾는 공개 API나 색인이 있는지 봅니다. 없으면 ISBN13 → 제목+저자 차례로 할지 정합니다 [확인 필요]
   - 이유: `catalog` 공개 API 범위가 이것으로 정해집니다(2단계)
4. **`BookLookup`(`C/BookLookup.java`, `IdBook`)에 저자·출판사·출판 연도가 있는지**
   - "출판 연도 = 전자책이 나온 해"가 대표 출판일인지 가장 이른 소장 날짜인지 코드로 보고, 어느 칸이 있는지 보고합니다 [확인 필요: dev 코드 + 사용자]
   - 이유: 카드 칸과 연도 가산 값이 이것으로 정해집니다
5. **운영 디스크·DB 여유**
   - 이웃 약 0.2GB, `full` 바꿔 끼울 때는 잠깐 두 배, 표지 약 0.3GB [추론]
   - 사이클 17 운영 기록으로 봅니다(EC2 gp3 40GiB인지 Lightsail 80GB인지)
6. **사용 알림 `category` 값**
   - `picks_list_view`·`picks_book_view`에서 `category`가 필수인지(`backend/src/main/java/com/chaekcheck/usagelog/internal/web/UsageEventReader.java` 등)를 봅니다
   - `list=for_you`일 때 넣을 값을 [안]으로 내고 보고합니다. 예: 생략 또는 `null`
7. **출판유통·KLWAVE가 프록시 나가는 길을 따르는지**
   - `foryou`의 HTTP 클라이언트가 운영 나가는 길 설정(`proxy-only`)을 따르게 할 수 있는지 봅니다
   - [안]: 따를 수 없으면 그 출처는 `enabled=false`로 두고 plan에 보고합니다. EC2 자기 IP로 바로 보내지 않습니다(사용자 "프록시만 사용하도록 하고", 2026-10-18)
   - 접근 시험(사이트마다 1건)과 응답 모양도 함께 봅니다
8. **24 상태**
   - 24 설계(위 브랜치)를 읽고 `ListedBook` 칸과 `book-texts` kind별 동작을 적습니다
   - dev에서 24가 시작됐는지, 누가 먼저 만드는지 적습니다
9. **기준 빌드**: 시작 커밋에서 `./gradlew build`, `npm run build`가 통과하는지 봅니다

### 1단계: Liquibase 세 파일

1. **`L/foryou/001-for-you.yaml`** [확정: 표·칸 / 안: 파일·changeset 이름]
   - 스키마 `foryou`와 표 일곱: `build_run`, `popular_row`, `book_score`, `base_entry`, `book_neighbour`, `book_blurb`, `book_cover`. 칸·제약은 design-delta "데이터" 표 그대로입니다
     - `build_run.status` CHECK IN (`running`,`succeeded`,`failed`), 색인 `(status, built_on DESC)`
     - `popular_row.source` CHECK IN (`kyobo_elib`,`yes24_elib`,`kpipa_rank`,`kpipa_200`,`klwave`), `period` CHECK, `rank ≥ 1`, 수 ≥ 0, 색인 `(run_id)`, FK `build_run` ON DELETE CASCADE
     - `book_score` PK (`run_id`,`book_id`), `score ≥ 0`
     - `base_entry` PK (`run_id`,`position`), `position` 1~40, UNIQUE (`run_id`,`book_id`)
     - `book_neighbour.neighbour_ids integer[]` NOT NULL, CHECK `cardinality BETWEEN 1 AND 20`, `array_ndims = 1`
     - `book_blurb` `char_length` 1~300
     - `book_cover.file_key ~ '^[0-9a-f]{40}$'`
   - CHECK는 changeset 안 `sql`로 씁니다
   - `book_neighbour_next`는 넣을 때 만들고 지우므로 changelog에는 두지 않습니다 [안]
2. **`L/picks/006-tag-dictionary-and-book-tag.yaml`** [안: 번호. 24가 picks 파일을 먼저 더하면 그다음]
   - `picks.tag_dictionary`: `code` PK, `axis`, `name`, `thema_code`, `active` DEFAULT true. CHECK `code ~ '^[A-Za-z0-9_]{1,20}$'`, `axis IN ('mood','subject','audience')`
   - `picks.book_tag`: PK (`book_id`,`tag_code`), `made_on`, FK `tag_code → tag_dictionary(code)`. 사전 쪽 색인은 두지 않습니다(design-delta 이유 그대로)
3. **`L/usagelog/00N-picks-list-for-you.yaml`** (24 `usagelog-ai-search-event` 다음)
   - `screen_event.picks_list` CHECK를 지우고, `for_you`를 더해 다시 만듭니다. 서버 검사 상수도 같이 고칩니다(8단계)
   - `picks.list_field`·`list_book`의 목록 키 CHECK는 **그대로**입니다(`for_you`는 목록이 아님)
4. **master** `L/db.changelog-master.yaml` 끝: `# cycle 23: for-you tab (ADR-0148, ADR-0149)` + include 셋 [안 문구]
- 시험(`db-test`): CHECK마다 맞는 줄과 틀린 줄. 특히 이웃 0개·21개·2차원 배열은 거절, `file_key` 꼴, `axis` 값, `position` 41은 거절
- 의존: 0단계
- 위험: 낮음

### 2단계: `catalog` 공개 API

1. **카드 칸** (`C/BookLookup.java`, 구현 `C/internal/JdbcBookLookup.java`) [안: 모양]
   - `byIds` 결과(또는 카드용 새 레코드)에 첫 저자 표시, 출판사, 출판 연도(0단계 4의 뜻), 첫 저자 `name_exact`(`authorKey`)를 더합니다
   - 쿼리 하나로 읽고, 없는 번호는 뺍니다(가져오기로 사라진 책은 읽을 때 빠짐)
2. **`workKeys(bookIds)`** [안: 이름] (결정 #6)
   - 책 번호마다 "같은 책" 묶음 열쇠를 돌려줍니다. 묶음 규칙: 본제목 정리값 `main_title_norm`이 같고, AUTHOR·UNKNOWN 역할 `name_exact`를 하나 이상 공유(사이클 21 승인 규칙, matching-guide 2-2절)
   - 공유 저자가 이어지는 판들을 한 묶음으로 보는 방법(합집합)은 dev가 정하고 보고합니다 [안]
   - 대표 판 = 소장 도서관이 가장 많은 판, 같으면 번호가 작은 것 [안: 같을 때 차례]
3. **(0단계 3 결과에 따라) 소장 키 역조회**: (도서관 번호, 사이트 소장 키) → 책 번호 [안: 이름·모양]. 없으면 ISBN13 → 제목+저자(`byIsbn13`, `byTitleAndAuthor`)를 씁니다
- 이유: 카드(R3-1), 연도 가산(R2-3), 판 모으기(R2-3, AC-4), 목록 줄 맞추기
- 의존: 0단계 3·4
- 위험: 중간
- 시험: `BookLookupTests`(새 칸, 없는 번호), `WorkKeysTests` [안]
  - 「돈의 속성」 일반판·100쇄 기념 에디션 → 한 묶음
  - 「고래」 2004·2014 → 한 묶음
  - 다른 저자의 같은 제목 → 다른 묶음

### 3단계: `availability.RankedListings` (체크포인트 B)

1. **`A/RankedListings.java`** (공개 타입, 구현은 `A/internal/…`) [안: 이름]
   - `fetch(libraryId, sort, page)` → 줄 목록(차례, 제목, 저자, 출판사, ISBN13, 소장 키, 대출 중 수, 예약 수) 또는 실패
   - 교보 일반: `orderByKey=loanNmvl`. YES24 V1: `sort=lending`
   - 지금 어댑터의 파싱, `HostQueueBoard`, 나가는 길 설정을 그대로 씁니다(C2)
   - 교보 구독형·YES24 V2·V3 화면 종류이면 거절합니다(V2는 `sort=lending`을 무시하고, V3는 시험하지 않았음, pretest-review 1절 #3)
2. **호스트 막기**: 요청 직전 호스트가 `*.dkyobobook.co.kr`이면 보내지 않고 실패를 돌려줍니다 [확정]
3. **C3 분리**: 이 요청이 조회 상태 불과 일별 응답 집계에 들어가지 않게 합니다
4. `A/package-info.java` Javadoc에 새 공개 타입을 적습니다
- 시험
  - 저장본 HTML(사전 시험 `docs/reports/cycle23-pretest/`)로 파서 시험: 교보 일반·YES24 V1 각 한 쪽, 줄 수, 대출 중·예약 수, 소장 키
  - `dkyobobook` 호스트 → 요청 0건(가짜 HTTP 클라이언트로 셈)
  - 호스트 간격 1초, 조회 통계에 안 들어감
  - `ModularityTests`
- 체크포인트 B: dev 환경에서 사이트 여섯 곳을 앞 100권씩 받습니다(C2)
  - 사이트 여섯: 서초 반포·연천·도봉·부천(교보 일반), 국립세종·성남(YES24 V1) [확정] (시험 결과 결정 #2)
  - 사이트마다 줄 수, 걸린 시간, 요청 수를 적습니다
  - 이 사이트들의 `library_id`를 찾아 설정 값으로 보고합니다
- 의존: 0단계 1·2
- 위험: 높음(0단계 2 결과에 달림)

### 4단계: `picks` — `ListedBooks`, 꼬리표, 사전

1. **`P/ListedBooks.java`·`ListedBook`**
   - 23이 먼저면 24 design-delta대로 만듭니다(`current()`, `loadFromDb()`)
   - 23의 칸: `bookId`, 목록 키(`lists`), `tags`(nullable, `active` 코드만, `{code, axis, name}`)
   - `PicksCache` 사본과 같은 주기로 바꿔 끼웁니다 [안: 24 설계와 같게]
2. **`P/BookTagTransfer.java`** [안: 이름] (`collection`만 부름)
   - `upsertDictionary(rows)`: 파일에 없는 코드는 지우지 않고 `active=false`로 둡니다
   - `replaceTags(bookId, codes)`: 그 책의 꼬리표를 통째로 바꿉니다. 사전에 없는 코드는 건너뛰고 수를 돌려줍니다
3. **카드 꼬리표 고르기** [확정] (R9-5): `active` 코드 가운데 느낌 1개 + 주제 1~2개(2~3개). `audience` 축을 카드에 보일지 [안: 보이지 않음]
- 시험
  - 사전 upsert와 `active=false`
  - 사전에 없는 코드 → 건너뜀과 수
  - 통째로 바꾸기
  - 카드 고르기(느낌 0개면 주제만, 3개 넘으면 자름)
  - `ListedBooks`가 목록 키와 `tags`를 싣는지
  - `ModularityTests`
- 의존: 1단계
- 위험: 중간(24와 같은 파일, C6)

### 5단계: `foryou` 새벽 만들기와 보관 (체크포인트 C)

1. **보관** (`F/internal/store/…`): 표 일곱 읽기·쓰기
   - 보관 정리: 30일 지난 실행 기록과 줄을 지우되 **마지막 succeeded 실행 하나는 남깁니다** [확정]
   - 서버를 켤 때 오래된 `running` → `failed` [확정]
2. **출처** (`F/internal/source/…`, 출처마다 하나)
   - 교보·YES24: `RankedListings`로 사이트마다 앞 100권
   - 출판유통 판매 순위·「화제의 책 200선」·KLWAVE: 작은 HTTP 클라이언트. 0단계 7과 사용자 PC 확인 결과로 모양을 정합니다 [확인 필요]. 정해질 때까지 그 출처는 `enabled=false`로 둡니다
   - 출처마다 `chaekcheck.foryou.sources.<source>.enabled` [안: 이름]
3. **맞추기**: 줄 → 책 번호(0단계 3, 2단계 3) → `workKeys`로 판 모으기 → 출판 연도
4. **출처 빼기** [확정] (to-dev-popular-list-check.md 2절, design-delta 흐름 A): 한 출처가 0줄이거나 맞춤 비율이 90% 아래면 그날 그 출처만 뺍니다. 출처별 받은 줄 수·맞춘 수·뺐는지를 `build_run.note`에 남깁니다
5. **점수** (R2-3)
   - 재료마다 0~100으로 맞춥니다 [확정: 방식]. 가장 큰 값을 100으로 하고, 순위 재료는 `101 − 순위` [안]
   - 교보·YES24 최근 수요 = 사이트마다 (대출 중 + 2 × 예약)을 묶음(같은 책)별로 더한 값 [확정: 식]. 0~100으로 맞춘 뒤 × 연도 가산 [확정: 값]
   - 연도 가산: 만든 해 − 출판 연도 ≤ 3이면 ×1.5, 4~6 ×1.0, 7~10 ×0.6, 그보다 크면 ×0.3 [안: 경계 계산]
   - 누적 순위는 점수에 넣지 않고 후보를 찾는 그물로만 씁니다 [확정]
   - 출판유통 판매 순위 × 1.5 [확정]. 「화제의 책 200선」은 판매 순위에 없는 책만 보충 [안: 방식·값]
   - KLWAVE × 0.3 [안]
   - 값은 모두 설정 `chaekcheck.foryou.score.*` [안: 이름]으로 둡니다(R2-3a 조정)
   - 묶음 점수는 대표 판(소장 많은 판) 하나에만 `book_score`로 저장합니다
6. **차례** (R2-4) [확정]
   - ① 인기 점수가 있고 추천목록(`ListedBooks.current()`)에도 있는 책(점수 높은 순)
   - ② 인기 점수만 있는 책(점수 순)과 추천목록 책(보유 도서관 수 많은 순 [안: 서비스 전체 보유 수])을 한 권씩 번갈아
   - ③ 40권까지
   - `base_entry.from_popular`를 채웁니다
   - 추천목록 책도 같은 묶음끼리 모읍니다
7. **결과**
   - 성공: `popular_row`·`book_score`·`base_entry`를 쓰고 `succeeded`로 바꾼 뒤 메모리 사본을 바꿔 끼웁니다
   - 인기 출처가 모두 실패해도 추천목록만으로 성공시킵니다 [안] (R2-5)
   - 예외나 저장 실패: `failed`로 두고 사본은 마지막 succeeded 그대로(전날 목록) [확정]
8. **일정**: `chaekcheck.foryou.build.cron`
   - 새벽, 사서 받기(05:00 판단)와 겹치지 않게, 예 04:00 [안]
   - 켤 때 오늘(Asia/Seoul) succeeded가 없으면 만듭니다
   - 단일 스레드로 돌립니다
9. **메모리 사본**: 만든 뒤와 10분마다 마지막 succeeded를 다시 읽습니다(PicksCache와 같게) [안]
- 시험(`db-test`, 가짜 출처)
  - 점수 식(대출 중·예약·연도 구간 경계, 출판유통 1.5, 출처 끄기)
  - 판 모으기(두 판 → 한 판, 점수 합)
  - R2-4 차례(①이 먼저, 번갈아, 40권)
  - 출처 0줄·맞춤 89% → 그 출처만 빠지고 note에 남음
  - 모든 인기 출처 실패 → 추천목록만으로 succeeded
  - 예외 → failed, 사본은 전날
  - 켤 때 `running` → `failed`
  - 30일 정리에서 마지막 succeeded가 남음
- 체크포인트 C
  - dev DB(운영 꼴 복사본)에서 한 번 만들고 상위 40권 표를 만듭니다(책, 출판 연도, 점수, 재료별 점수, ①인지)
  - plan에 보내고 사용자 조정을 받습니다(R2-3a). 기대 모양은 pretest-review 2-3절(가운데값 2020.5, 2015년 이전 0권)
  - 출판유통이 꺼져 있으면 새 책이 적을 수 있습니다(design-delta 확인 필요 표)
- 의존: 2·3·4단계
- 위험: 높음

### 6단계: `foryou` API 둘

1. **`GET /api/v1/for-you/books`** [안: 경로] (`F/internal/web/ForYouController.java` [안])
   - 계획 파라미터 `residenceRegionIds`·`workRegionIds`·`scope`·`visit`·`libraryIds`는 `/api/v1/picks/{listKey}`와 같은 이름·검증입니다. `library.planSearch`로 계획 도서관을 얻습니다
   - 오늘 사본의 40권 가운데 `planLibraryCount ≥ 1`인 책만, 차례 그대로 돌려줍니다
   - 응답 `{builtOn, books[]}`. 한 번도 못 만들었으면 `builtOn: null` + 추천목록 책만 [안: 차례 = 보유 수 순]
   - `planLibraryCount`는 지금 picks의 "내 도서관 N곳"과 같은 셈법입니다 [확인 필요: dev 지금 계산]
2. **`GET /api/v1/for-you/similar-books`** [안: 경로]
   - `baseBookIds` 1~3(쉼표, 필수), `reshowBookIds` 0~6, 계획 파라미터
   - 정렬(design-delta "API"):
     1. 기준 책들의 이웃을 합칩니다(≤60, 중복 없음)
     2. 기준 책 빼기
     3. 계획 도서관 0곳 빼기
     4. 마지막 succeeded 실행의 `book_score`가 있는 책은 점수 높은 순
     5. 나머지는 `planLibraryCount` 많은 순
     6. 같으면 `bookId` [안]
   - 응답 `{baseBooks[{bookId,title}], books[] ≤60, reshowBooks[]}`. 모르는 번호는 조용히 뺍니다
3. **카드 칸** (두 API 공통, design-delta 그대로)
   - 칸: `bookId`, `title`, `author`, `publisher`, `coverUrl`, `blurb`, `tags`, `planLibraryCount`, `lists`, similar에는 `authorKey`
   - `coverUrl` = `/covers/<file_key>.jpg`, 없으면 null
   - 인기 점수·출처 이름은 내보내지 않습니다 [확정] (R3-2)
4. **오류** (ProblemDetail, 지금 꼴)
   - 400 `validation_error`: `errors[].field` `baseBookIds`·`reshowBookIds`, `code` `required`·`invalid_format`·`too_many`·`duplicate`
   - 422 `invalid_region`, 500 `internal_error`
5. 인증 없음, GET이라 CSRF 없음. nginx 일반 `/api/` 구역(5r/s) [확정]. `Cache-Control`은 정하지 않습니다 [안]
- 시험(`ForYouControllerTests` [안])
  - 계획 도서관으로 거르기(지역을 바꾸면 N과 책이 바뀜, AC-5)
  - `builtOn: null`
  - 검증 코드 넷과 경계(0·4·중복·숫자 아님)
  - 정렬(점수 책 먼저 → 계획 수 → 번호)
  - 기준 책이 결과에 없음
  - `reshowBooks`
  - 응답에 점수·출처 칸 없음
- 의존: 5단계(이웃 표는 1단계)
- 위험: 중간

### 7단계: `collection` 넣기 모드 (`collection-import` 프로필)

1. **`neighbours`** (새) (`I/…`, `foryou.ForYouTransfer` [안: 이름] 부름)
   - 입력: TSV `book_id\tneighbour_ids`(쉼표), 머리말 `export_id`, `full`·`add`
   - 검사
     - 운영 `catalog_import.export_id`와 다르면 표를 그대로 두고 멈춥니다(`--force`로만 넘어감)
     - 자기 자신·중복 이웃 거절, 1~20개
     - 책 번호가 2,147,483,647을 넘으면 거절합니다
   - `full`: `foryou.book_neighbour_next`에 COPY한 뒤 한 트랜잭션에서 이름을 바꿔 끼웁니다
   - `add`: `ON CONFLICT (book_id) DO UPDATE`
2. **`tag-dictionary`** (새): TSV `code\taxis\tname\tthema_code` → `BookTagTransfer.upsertDictionary`
3. **`book-texts`** (24가 정한 모드, 23이 먼저면 여기서 만듦)
   - 줄 모양: `kind\tbook_id\tsource\tmade_on\ttext`
   - `for_you_blurb` → `foryou.book_blurb` upsert
   - `tags` → `picks.book_tag`(`text` = 코드 쉼표 목록, 통째로 바꿈)
   - `cover_file` → `foryou.book_cover`(`text` = sha1 40자)
   - `search_line` → 24 `aisearch`(없으면 모르는 kind)
   - 모르는 kind는 건너뛰고 kind별 넣은 수·건너뛴 수를 보고합니다
4. `collection/package-info.java`에 `foryou`를 더합니다(C1)
- 시험(`db-test`)
  - `export_id` 다름 → 멈춤, 표 그대로
  - `full` 바꿔 끼우기(도중 실패 → 옛 표 그대로)
  - `add` upsert
  - 자기 자신·21개·큰 번호 → 거절
  - kind 셋과 모르는 kind 수
  - 사전에 없는 꼬리표 코드 수
  - `ModularityTests`(`collection → foryou`), `DocumentationTests`
- 측정: dev에서 134만 줄 `full` COPY와 바꿔 끼우기 시간, 표 크기
- 의존: 1·4·5단계
- 위험: 중간

### 8단계: `usagelog` `list=for_you`

1. `UsageEventReader`의 `list` 허용 값에 `for_you`를 더합니다. `category` 처리는 0단계 6 결과대로입니다
2. 쓰기는 지금 그대로(`screen_event.picks_list`)
- 시험: `for_you` 받음, 모르는 값은 여전히 `rejected_event`, `UsageLogSchemaTests`(CHECK)
- 의존: 1단계 3
- 위험: 낮음

### 9단계: 웹 (체크포인트 D)

1. **탭과 경로** (`W/picksLists.ts`, `web/src/main.tsx`, 머리말 메뉴 `web/src/components/headerMenus.ts`)
   - `PICKS_TABS` 맨 앞에 for-you(「나에게 맞는 책」, `/picks/for-you`)를 둡니다 [확정] (R1-1)
   - `/picks` → `/picks/for-you` [확정] (R1-2). 머리 메뉴 "추천도서"도 `/picks/for-you`로 [확정] (AC-16)
2. **본 책 저장소** (새 `W/viewedBooks.ts` [안: 이름])
   - `localStorage`, 키 예 `chaekcheck.viewedBooks.v1` [안]
   - 책마다 번호, 제목, 점수 비트(연 적 있음 1점, 10초 2점, 도서관 누름 3점), 마지막 시각, 빼기 기한을 둡니다
   - 같은 일을 여러 번 해도 한 번으로 셉니다. 30일 지난 기록은 지우고, 200권이 넘으면 오래된 것부터 지웁니다 [확정] (R5-2·R5-5)
   - 기준 책 = 빼기 기한 안이 아닌 책 가운데 점수 상위 3권, 같으면 최근 [확정]
   - 다시 보여 줄 후보 ≤6: 본 지 3일 넘음, 도서관 안 누름, 기준 책 아님, S19에서 빼지 않음 [확정] (R6-1b)
   - 깨진 값은 빈 기록으로 읽습니다
3. **점수 세기** (`web/src/features/book/BookPage.tsx`, `W/PicksBookDialog.tsx`)
   - 열기 → 1점
   - 화면에 보이는 동안 10초 → 2점. `visibilitychange`로 멈춥니다 [확정] (R5-4)
   - 그 두 곳의 도서관 줄 누름 → 3점
   - 검색 결과 목록에서 바로 누른 것은 세지 않습니다 [확정] (R5-3)
   - 서버로 새 알림을 보내지 않습니다(C4)
4. **API·타입** (`web/src/api/client.ts`, `api/types.ts`, `api/usageEvents.ts`)
   - 두 GET을 더하고, 사용 알림에 `list: 'for_you'`를 넣습니다
5. **차례 규칙** (새 `W/forYouOrder.ts` [안], 결정 #4)
   - 서버 `books`에서 본 책(≤200)을 뺍니다
   - 같은 저자(`authorKey`)는 연속 2권까지
   - 20권씩 나누고, 각 20권의 8·16번째쯤에 `reshowBooks`를 2권까지 섞습니다
   - 기본 목록과 겹치면 개인 추천 쪽에 둡니다
   - 맨 위 한 권 = 개인 추천 1순위, 없으면 기본 목록 1순위. 그 아래는 개인 추천(20권) 다음 기본 목록 [확정] (R6-2)
   - "비슷한 책 더 보기"는 다음 20권(60권 안) [확정] (R6-3)
6. **S18** (새 `W/ForYouPage.tsx` [안], 지금 `usePicksPlan` 그대로)
   - 위에서 아래로: AI 줄 → 기준 책 줄(있을 때) → 맨 위 한 권 → 두 권씩 → 더 보기 → "추천 기준과 출처 보기"(S13i 꼴)
   - 배치(flow 배치 메모)
     - PC 본문 폭은 지금 추천도서와 같음
     - 맨 위 한 권: PC는 표지 왼쪽·글 오른쪽, 태블릿·폰은 표지 위·글 아래
     - 두 칸은 모든 폭에서 그대로
     - 폰 기준 책 줄은 두 줄로 접힘
   - 카드: 표지(없으면 지금 `CoverImage` 제목 글자 표지), 제목, 저자·출판사, 추천 글(자르지 않음), 꼬리표(누를 수 없음), "내 도서관 N곳", 추천목록이면 꼬리말
   - 카드를 누르면 지금 S14 책 창이 열립니다
   - 상태: 계획 읽는 중(기다림), 로딩 뼈대(맨 위 한 장 + 두 장씩), 기준 책 없음, 개인 추천 0권, 개인 추천 실패, 기본 목록 실패, 모두 빠짐, 글·꼬리표 없는 카드(flow 상태 표 그대로)
   - 기준 책이 없으면 개인 추천 요청을 보내지 않습니다
7. **S19** (새 `W/BaseBooksDialog.tsx` [안])
   - PC는 작은 창, 폰은 아래 시트
   - 최근 본 책을 점수 차례로 10권까지, 지금 기준 3권에 표시
   - [빼기]를 누르면 30일 빼기 기한을 둡니다
   - 맨 아래 "최근 본 책 기록 모두 지우기"
   - 서버 호출은 없습니다. 닫으면 개인 추천을 다시 받습니다 [확정] (R6-4)
8. **S14 이 탭에서 열 때**: 연도 줄·AI 요약은 지금 규칙 그대로입니다(추천목록 책에만) [확정]
- 시험(vitest)
  - `viewedBooks`: 점수 비트 중복 없음, 30일·200권, 기준 책 차례·같을 때 최근, 빼기 30일, 후보 조건 넷, 깨진 값
  - 10초: `visibilitychange`로 멈춤(가짜 시계)
  - `forYouOrder`: 본 책 빼기, 같은 저자 3연속 없음(AC-8), 20권마다 다시 섞기 ≤2(AC-17), 겹침 정리
  - `ForYouPage`
    - 기록 없음 → 기준 책 줄 없음·요청 하나(AC-2)
    - 꼬리말은 추천목록 책에만, 두 개 넘으면 "외 N"(AC-3)
    - AI 줄 한 번(AC-9)
    - 꼬리표 2~3개·없으면 줄 없음·누름 무반응(AC-10)
    - 개인 추천 실패 줄(AC-14)
    - 모두 빠짐 줄과 S10 링크
    - 기본 목록 실패와 다시 시도
  - S19: 빼기 → 다음 책, 모두 지우기 → 기준 책 줄 없음, 서버 요청은 개인 추천뿐(AC-15)
  - 경로: `/picks` → `/picks/for-you`(AC-1·16)
  - 사용 알림 `list=for_you`(AC-12)
  - `PicksPage`·`PicksLists` 기존 시험 통과
- 화면 확인
  - Playwright 데스크톱 1440을 먼저, 그다음 태블릿 768과 폰 375
  - 모든 상태와 S19를 봅니다. "「기준 책」과 비슷" 줄이 없는지 봅니다(AC-13)
  - 그다음 사용자 화면 확인과 실제 폰 확인(완료 기준)
- 의존: 6·8단계
- 위험: 중간

### 10단계: 수집 PC 작업 (dev 수집 세션, `scripts/crawl/`)

1. **이웃 계산** (예 `scripts/crawl/neighbours.py` [안: 이름])
   - 모델 `nlpai-lab/KURE-v1`(1024차원, MIT) [확정]
   - 입력: `제목 · 저자 · 출판사 · 연도` + 소개 앞부분 300자 [확정: 방향, R7-4]. 어느 소개 출처(①~④)까지 쓸지는 소개 시험 결과를 보고 plan이 정합니다
   - 범위·주기 [확정] (결정 #8, R7-3)
     - **서비스 책 전체 1,340,875권을 처음 한 번** 계산합니다. CPU로 약 38시간이므로 여러 밤에 나눠 돌리고, 이어서 돌릴 수 있게 합니다
     - 그 뒤는 새로 들어온 책만 `add`
     - **반년에 한 번쯤 전체를 다시** `full`
   - 결과: `neighbours.tsv`(머리말 `export_id` = 계산에 쓴 서비스 내보내기). 이웃 20권, 자기 자신·중복 없음
2. **Haiku 배치** (예 `scripts/crawl/book_texts_batch.py` [안]) [확정] (결정 #7, ADR-0149)
   - 모델 Claude Haiku 5.5, Message Batches. 키는 PC에만(C5)
   - **책 한 권당 한 번 호출**로 탭 추천 글·꼬리표·찾기용 한 줄(24)을 만듭니다
   - 입력은 **대상 책 목록 파일**: 기본 목록 책 + 추천목록 책(약 2,800권) + 보유 도서관이 많은 책 3만 권 [확정] (R8-5). 다음부터는 새 책만
   - 탭 글 규칙(R8-4): 해요체 한두 문장, 80~150자, 칭찬·결말 누설·AI 언급 없음. 원문과 8자 이상 연달아 같으면 버리고 다시 씁니다
   - 꼬리표(R9-3): 사전 코드만 고르고, 정해진 JSON 모양, 축마다 개수 상한. 추천목록 책에만 붙입니다(R9-1). 표본 500권을 먼저 돌리고, 사전에 없는 말은 따로 모아 사람이 더합니다
   - 입력 원문은 `intro_raw`(없으면 소개 시험의 채우기 차례). 원문은 PC에만 두고, 서비스로는 글만 나갑니다 [확정]
   - 결과: `book-texts.tsv`(kind `for_you_blurb`·`tags`·`search_line`)
   - 1,000권 토큰 수(`count_tokens`)와 실제 비용을 적습니다. 배치 할인을 공식 가격에 더 적용하는지 [확인 필요: 공식 문서]
3. **꼬리표 사전 TSV**: Thema 1.6 한국어판 뼈대로 분야·주제·독자 100~150개 + 느낌 15~20개. 사람이 확정합니다 [확정] (R9-2)
4. **표지 옮기기** [확정] (결정 #5)
   - 수집 세션에 이미 부탁했습니다(2026-10-24, 소개 시험과 함께). 결과는 dev `docs/reports/`에 둡니다
   - 범위: `fetch-covers` 결과 가운데 추천목록 책 + 보유 많은 3만 권 + 기본 목록 후보
   - `covers/<앞 2자리>/<sha1>.jpg`를 평평하게 운영 `/srv/chaekcheck/covers/<sha1>.jpg`로 옮깁니다
   - 연결은 `book-texts.tsv` kind `cover_file`(`text` = sha1)
   - 장 수·총 크기·출처별 이용 조건을 보고합니다 [확인 필요]
5. **새 책 찾기** [확인 필요: dev 절차]: 오늘 기본 목록의 새 책 가운데 글·표지가 없는 것을 PC가 아는 방법(R8-7). [안]: 운영 DB 질의 파일 하나(`base_entry`에서 `book_blurb`·`book_cover`가 없는 책 번호) → 다음 배치의 대상 책 목록
6. **인기 목록 검증** [확정: 따로 적기]: 책 수집(전체·부분)을 돌릴 때마다 `to-dev-popular-list-check.md` 1절 다섯 가지를 보고 수집 보고서에 한 절로 적습니다. 절차 문서(`docs/maintenance/2-crawl.md` 등)에 한 줄 더합니다
- 시험(`python -m unittest`, 네트워크 없음)
  - TSV 꼴(머리말, 자기 자신 없음, 20개)
  - 8자 겹침 검사
  - 꼬리표 JSON 검사(사전 밖 코드 → 따로 모음)
  - 대상 목록 → 새 책만
  - 표지 평평하게 옮기기 이름
- 다른 Claude 세션이 문서만 읽고 돌릴 수 있게, 실행·입력·출력을 `docs/maintenance/`에 적습니다(사이클 21 사용자 당부와 같은 꼴)
- 의존: 7단계(넣기 모양), 소개 시험 결과
- 위험: 중간(시간이 오래 걸림)

### 11단계: 실데이터 확인과 운영 반영 (체크포인트 E, 한 번)

1. **연습**: 운영 꼴 복사본 DB에서 차례대로 돌리고 시간과 크기를 잽니다
   - 코드 반영(Liquibase)
   - `tag-dictionary`
   - `neighbours full`
   - `book-texts`
   - 표지 복사
   - 만들기 한 번
2. **진짜 반영** (사용자 승인 뒤)
   - 운영 반영은 한 번입니다 [확정]
   - PC 결과(이웃 전체, 글·꼬리표, 표지)가 준비된 뒤 함께 넣습니다 [안]
   - 이웃 전체 계산이 반영 날짜를 크게 늦추면 사용자에게 묻습니다(이웃 없이도 탭은 기본 목록만으로 보임)
3. **반영 뒤 확인**
   - `build_run.note`의 출처별 줄 수
   - 상위 40권(조정한 가중치)
   - AC-4·5·6·12
   - 디스크 사용량
- 위험: 중간

## 문구표 (화면에 보이는 글, 모두 [확정])

| 자리 | 문구 | 근거 |
|---|---|---|
| 탭 이름 | 나에게 맞는 책 | R1-1 |
| AI 줄 | 책 소개 글과 꼬리표는 AI가 골랐어요 | R10-1 |
| 기준 책 줄 | 최근 본 책 ○○·○○·○○과 비슷한 책 · 기준 책 바꾸기 | R3, flow S18 |
| 꼬리말 | ○○ 추천목록에 있어요 (탭 이름 그대로, 여럿이면 앞의 둘 + "외 N") | R3-2 |
| 보유 | 내 도서관 N곳 | R4-1 |
| 더 보기 | 비슷한 책 더 보기 | R6-3 |
| 개인 추천 실패 | 비슷한 책을 불러오지 못했어요 [다시 시도] | 상태 표 |
| 기본 목록 실패 | 추천 책을 불러오지 못했어요 [다시 시도] | 상태 표 |
| 모두 빠짐 | 내 도서관에 있는 추천 책이 없어요 + 마이페이지로 가는 줄(지금 추천도서의 지역 없을 때 줄과 같은 꼴) | 상태 표 |
| S19 | [빼기], 최근 본 책 기록 모두 지우기 | R6-4 |
| 추천 기준과 출처 보기 | 요즘 전자도서관에서 많이 빌리는 책과 판매 순위, 추천목록을 섞었어요 · 최근 본 책은 이 브라우저에만 저장돼요 · 주제 분류: Thema (EDItEUR) | flow S18 6, R9-2 |

카드마다 붙이는 AI 표시, 인기 출처 꼬리말, "「기준 책」과 비슷" 줄은 어디에도 두지 않습니다.

## 테스트

- **단위**: 점수·판 모으기·차례, 파서(저장본), 호스트 막기, 꼬리표 고르기, 웹 `viewedBooks`·`forYouOrder`, 수집기 시험
- **통합(`db-test`, 모듈 시험)**
  - Liquibase 스키마
  - `BookLookupTests`·`WorkKeysTests`
  - 만들기 시험(가짜 출처)
  - `ForYouControllerTests`
  - 넣기 모드 시험
  - `UsageLogSchemaTests`
  - `ModularityTests`(`ApplicationModules.of(ChaekcheckApplication.class).verify()`: 새 모듈 `foryou`, `collection → foryou`, `picks`·`availability`·`catalog`의 새 공개 타입), `DocumentationTests`, 기존 시험 전부
- **화면**: vitest, Playwright 데스크톱 1440 → 태블릿 768 → 폰 375, 사용자 화면 확인, 사용자 실제 폰 확인
- **데이터**: 체크포인트 B·C·E 측정

| AC | 확인 방법 | 단계 |
|---|---|---|
| AC-1 탭 맨 앞, `/picks/for-you` | vitest(탭 차례·주소) + Playwright | 9 |
| AC-2 기록 없는 브라우저(사생활 보호 창) → 안내 문구 없음, 맨 위 한 권 + 두 권씩, 기준 책 줄 없음 | vitest + 사생활 보호 창으로 화면 확인. 개발자 도구 네트워크에서 `similar-books` 요청 0건 | 9 |
| AC-3 꼬리말은 추천목록 책에만 | vitest(카드) + 컨트롤러 시험(`lists`) + 화면 | 6, 9 |
| AC-4 40권 이하, 인기·추천목록 둘 다인 책이 앞 | 만들기 시험 + SQL: `SELECT count(*) FROM foryou.base_entry WHERE run_id = <마지막 succeeded>` ≤ 40, ①에 든 책의 `position`이 나머지보다 작은지 | 5, 11 |
| AC-5 모든 카드 N ≥ 1, 지역을 바꾸면 N과 책이 바뀜 | 컨트롤러 시험 + 화면(마이페이지에서 지역 바꾼 뒤) | 6, 9 |
| AC-6 A 15초 + 도서관 누름, B 열고 닫음 → 기준 책 줄 맨 앞 A, 비슷한 책만, 점수 책 먼저, A·B 없음 | vitest(점수·차례) + 컨트롤러 시험(정렬) + 화면(개발자 도구 Application → localStorage에서 점수, 네트워크에서 `baseBookIds` 차례) | 6, 9, 11 |
| AC-7 브라우저를 닫았다 열어도 같음, 다른 브라우저에는 없음 | 화면(브라우저 둘) | 9 |
| AC-8 같은 저자 3연속 없음 | vitest(`forYouOrder`) | 9 |
| AC-9 AI 줄 한 번, 카드 표시 없음 | vitest + 화면 | 9 |
| AC-10 추천목록 책 꼬리표 2~3개, 없으면 줄 없음, 눌러도 무반응 | `BookTagTransfer`·카드 고르기 시험 + vitest | 4, 9 |
| AC-11 글 안 잘림, 책 창 「AI 요약」과 다름 | vitest(잘림 스타일 없음) + 화면 + SQL: `foryou.book_blurb.blurb`와 지금 `aiSummary` 칸이 같은 책에서 다른지 | 9, 11 |
| AC-12 `screen_event`에 `for_you`로 남음, 새 종류 알림 없음 | 개발자 도구 네트워크(`POST /api/v1/usage-events` 몸체의 `type`이 둘뿐) + SQL: `SELECT type, picks_list FROM usagelog.screen_event WHERE picks_list = 'for_you' ORDER BY id DESC LIMIT 5` | 8, 9, 11 |
| AC-13 1440·태블릿·375 같은 짜임, "「기준 책」과 비슷" 없음 | Playwright 세 폭 + 실제 폰 | 9 |
| AC-14 개인 추천 요청을 막으면 기본 목록 그대로 + 실패 줄 | 개발자 도구 네트워크 "요청 차단"으로 `similar-books` 막기 + vitest | 9 |
| AC-15 S19 빼기 → 다음 책, 모두 지우기 → 기본 목록만, 서버 요청은 개인 추천뿐 | vitest + 개발자 도구 네트워크 | 9 |
| AC-16 머리 메뉴 "추천도서" → `/picks/for-you` | vitest(머리말) + 화면 | 9 |
| AC-17 3일 뒤 D가 나올 수 있음, 20권마다 본 책 ≤2, 도서관 누른 책은 안 나옴 | vitest(가짜 시계로 3일 옮김) + 화면(개발자 도구로 localStorage의 마지막 시각을 3일 앞으로 고치거나 시스템 시계 옮김) | 9 |

## 완료 기준

- [ ] spec AC-1~AC-17을 위 표의 단계에서 확인하고, AC 확인표를 `# 사이클 23` 절에 적었습니다
- [ ] 단계마다 `backend/` `./gradlew build` 통과(`ModularityTests`의 `ApplicationModules.verify()`와 `DocumentationTests` 포함), `web/` `npm run build`·vitest 통과, 수집기 시험 통과
- [ ] 기존 changeset을 고치지 않았고, master 끝 순서가 24와 합친 뒤에도 맞습니다(`usagelog`는 `usagelog-ai-search-event` 다음)
- [ ] `*.dkyobobook.co.kr` 요청이 0건입니다(시험 + 체크포인트 B 실행 기록)
- [ ] 새벽 인기 받기가 조회 상태 불·일별 응답 집계에 섞이지 않습니다(C3)
- [ ] 0단계 결과를 plan에 보냈고, 멈춤 조건에 걸리지 않았습니다(걸렸으면 plan의 새 결정대로 했습니다)
- [ ] 체크포인트 C의 상위 40권을 사용자가 보고 가중치를 정했습니다(R2-3a)
- [ ] 사이클 24 plan 세션에 배치 합치기 결정을 알렸습니다
- [ ] 이 사이클은 폰 화면(S18 탭, S19 아래 시트, 추천도서 탭 줄)을 더하고 바꿉니다. 사이클을 닫기 전에 사용자가 **자기 폰(Samsung Internet)**으로 dev 웹 서버 `web-lan-5174`(`.claude/launch.json`, 같은 Wi-Fi)에 붙어 확인합니다. Chrome 폰 흉내만으로는 안 됩니다(사용자 결정, 2026-10-12, `docs/cycles/10-popular-books/easy/2026-10-12-design-addendum-decisions.html` #3)
- [ ] 운영 반영에 성공했고, `build_run`이 succeeded이며, 탭이 보입니다
- [ ] [확인 필요] 결과, 설계와 달라진 점, 새로 알게 된 제약을 `# 사이클 23` 절에 적었습니다

## [확인 필요] 항목과 개발 중 확인 방법

| # | 항목 | 누가·어떻게 | 결과에 따라 | 막는 단계 |
|---|---|---|---|---|
| 1 | 프록시 길이 dev main에 있는지 | dev 코드 | 없으면 멈춤 → plan | 3 |
| 2 | 교보 일반·YES24 V1 인기순을 지금 어댑터로 읽는지, 쪽 크기 | dev 코드 + 저장본 + 요청 시험 | 못 읽으면 멈춤 → PC 파일 넣기(ADR-0148 B안)를 plan이 다시 물음 | 3 |
| 3 | 목록 줄 → 책 번호 맞추기, 소장 키 역조회 | dev 보고서·코드 | `catalog` API 범위 | 2, 5 |
| 4 | `BookLookup` 저자·출판사·출판 연도("전자책이 나온 해") | dev 코드 + 사용자 | 카드 칸, 연도 가산 | 2, 5 |
| 5 | 운영 디스크·DB 여유 | 사이클 17 운영 기록 | 부족하면 plan에 보고 | 11 |
| 6 | for-you 사용 알림 `category` | dev `UsageEventReader` | 웹이 보낼 값 | 8, 9 |
| 7 | 출판유통·KLWAVE가 프록시 나가는 길을 따르는지, 받을 범위·형식, KLWAVE가 파일인지 | dev 시험 + 사용자 PC 원문 | 못 따르면 그 출처는 꺼 둔 채 보고. 파일이면 PC 파일 모드를 plan에 물음 | 5 |
| 8 | 24 `ListedBook` 칸, `book-texts` kind 동작, 누가 먼저 만드는지 | 24 브랜치 문서, dev 상태 | 만드는 쪽 | 4, 7 |
| 9 | 교보문고 약관 제11조⑨ | 사용자(공식 문서) | 교보 출처 끄기 | 11 |
| 10 | 표지 범위의 장 수·크기·출처별 이용 조건 | 수집 세션 보고(부탁 2026-10-24) | 공개 반영 전 | 10, 11 |
| 11 | 소개 원문 채우기·이웃 다시 재기 결과 | 수집 세션 보고(`to-dev-intro-test-2026-10-24.md`) | 이웃 입력에 쓸 소개 출처(plan이 정함) | 10 |
| 12 | 새 책 가운데 글·표지 없는 것을 PC가 아는 방법 | dev 절차 | 질의 파일 [안] | 10 |
| 13 | 개인 추천 대부분이 "계획 도서관 수 순"이 되는 결과(사전 시험 인기 이웃 1.8%) | 소개 넣은 이웃 다시 재기 뒤 사용자 | 정렬 다시 볼지 | 11 뒤 |
| 14 | 출판유통이 정해질 때까지 2025년 이후 새 책이 적을 수 있음 | 체크포인트 C 상위 40권 | 사용자 조정 | 5 |
| 15 | 개인 추천 요청 주소가 nginx 기록에 회원 번호와 함께 남는지 | dev 운영 설정 | 남으면 plan에 보고 | 11 |
| 16 | `planLibraryCount` 셈법이 지금 picks "내 도서관 N곳"과 같은지(구독형 셈 포함) | dev 코드 | 같게 | 6 |
| 17 | Haiku 배치 할인 적용 여부, 1,000권 토큰 수 | 공식 문서, `count_tokens` | 비용 보고 | 10 |
| 18 | 추천 글 표본 수와 읽는 사람(R8-6) | 사용자 | 검토 | 10 |

## 이번에 하지 않는 것

- 북튜버 출처, 알라딘·북큐브 인기 신호 (spec 비목표)
- 회원 번호로 서버에서 개인 추천 계산, 기기 사이 기록 잇기, 약관·처리방침·"맞춤 추천 끄기"
- 꼬리표 누르기·거르기, 꼬리표로 비슷한 책 고르기, 추천목록 밖 책에 꼬리표
- 탭 목록에서 대출 가능 여부 보이기
- 책 화면(`/books/{번호}`)의 "비슷한 책" 칸, 분야 칩
- 지금 추천목록 AI 요약(`aiSummary`) 바꾸기
- 임베딩 벡터를 운영에 두고 그때그때 찾기 (backlog, 결정 #3 덧붙임)
- 서버가 새 인기 책 표지를 서점에서 받기, `catalog` 표지 칸 (backlog)
- 사이클 24 `aisearch` 기능 자체 (공통 부분만 만듦)
- plan `docs/current/`·`docs/settings-index.md` 고치기 (plan이 함. 새 설정 값은 보고만)

## 개발 후 plan 쪽에 알려줄 것

다음 `/cycle-start`의 회고 입력입니다. dev `docs/plan-feedback.md`의 새 **`# 사이클 23`** 절에 **설계와 달라진 점과 그 이유**를 적습니다(사용자 발언은 그대로).

- **시작 상태**: 작업 폴더·브랜치·docker 프로젝트·포트, 시작 커밋, 24가 main에 있었는지, 기준 빌드
- **0단계 결과** (나오는 대로 바로): 확인 여덟 가지 각각. 멈춤 조건에 걸렸으면 그 즉시
- **24와의 일**: 누가 `ListedBooks`·`book-texts`를 만들었는지, 24 plan 세션에 배치 합치기 결정을 알린 날과 받은 답, 합칠 때 정한 Liquibase 번호
- **측정값**
  - 체크포인트 B: 사이트마다 줄 수·요청 수·시간
  - 출처별 맞춤 비율
  - 체크포인트 C: 상위 40권과 사용자가 정한 가중치
  - `neighbours full` COPY·바꿔 끼우기 시간과 표 크기
  - PC 이웃 계산 총시간
  - Haiku 토큰·비용
  - 표지 장 수·크기
  - 운영 디스크 사용량
- **설정 값**: 실제로 쓴 `chaekcheck.foryou.*` 키와 값(만들기 시각, 사이트 `library_id` 여섯, 간격, 점수 값). plan이 `settings-index.md`에 옮깁니다
- **바꾼 이름과 모양**: `ForYouTransfer`, `BookTagTransfer`, `RankedListings`, `workKeys`, 카드 레코드, 경로, kind 이름, 저장소 키, 컴포넌트 이름, changeset id
- **설계와 달라진 점**
  - 맞추기 방법(소장 키 / ISBN / 제목+저자)
  - 출판 연도의 뜻
  - `category` 값
  - 출판유통·KLWAVE 모양과 나가는 길
  - 「화제의 책 200선」 보충 방식
  - 판 모으기의 묶음 방법
  - 추천목록 책 "보유 수" 기준
  - 화면 확인과 실제 폰 확인에서 사용자가 고친 것
- **새로 알게 된 제약**: 인기순 화면 바뀜, 쪽 크기, 운영 자원, 수집 검증(`to-dev-popular-list-check.md`) 첫 결과
- [확인 필요] 표 각 행의 결과, AC 확인표
