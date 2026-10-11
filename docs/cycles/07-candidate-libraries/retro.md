# 사이클 07 회고: 후보 도서관 넣기 (+ 수집 방법 재구성, DB·검색 최적화)

- 작성: 2026-10-05. 근거: dev `docs/plan-feedback.md` "# 사이클 07"(1605행~, 요약 1852행~), dev 코드(`backend/src/main/java/com/chaekcheck/{collection,catalog,library,availability,mylibrary}`, `web/src/features/search/searchSettings.ts`), Modulith 문서 출력(`backend/build/spring-modulith-docs/components.puml`), 이 사이클 `design-delta.md`·`spec.md`·`flow.md`·`handoff.md`
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`으로 표시합니다. 사용자 말은 dev가 `plan-feedback.md`에 옮긴 것과 회고 질문 페이지(`easy/2026-10-05-retro-questions.html`)의 답입니다.
- dev가 구현을 마친 범위: 인계서 0~18단계 전부. 빌드·테스트 통과(backend `./gradlew build`, fetch-service, web 243 테스트·build·lint 경고만). 실제 가져오기와 Liquibase 합치기까지 끝냄. `PRE_DEPLOYMENT` 남김

## 계획대로 된 것

- 후보 도서관 2,394곳(서비스 번호 281~2674)을 seed로 넣음. 짝 2,674줄(등록 280 + 후보). `join_survey`: `MEMBERS_ONLY` 2,252, `SURVEYED` 90, `NOT_SURVEYED` 35, `NOT_FOUND` 17 (dev 1단계 셈)
- 새 모듈 `collection`(`allowedDependencies = {"catalog", "catalog :: normalize", "library"}`), 가져오기 코드 전부 `collection.internal.importer`로 옮김. 제목 다듬기 규칙은 `com.chaekcheck.catalog.normalize`(`@NamedInterface("normalize")`)에 한 벌 (ADR-0060)
- `CatalogLoad.replaceAll(source, loader)`: 콜백 세션, 한 트랜잭션, 커밋 뒤 `VACUUM (ANALYZE)`
- 나눠 읽기(사본 두 번 읽기), 새 제외 규칙 `kind_sound_video`, 명지대(100555) 1950년 이전 날짜 NULL (ADR-0054)
- `book.library_ids` + GIN, `/books`는 `holding`을 읽지 않음 (ADR-0055)
- 계획 규칙: `MEMBERS_ONLY`·`NOT_SURVEYED`는 직접 추가일 때만, 등급 `UNSURVEYED` (ADR-0053)
- `BookcubeFxAdapter`·`AladinV1Adapter`, `detailFetchUri`, `SiteVerdict.SUBSCRIPTION`, 교보 구독형 화면의 소장형 숫자 (ADR-0056)
- `POST /api/v1/me/library-imports`, 로그인 전 직접 추가(`chaekcheck.chosenLibraries.v1`), S11에서 지역과 함께 옮김 (ADR-0057)
- `GET /api/v1/libraries` 통째로 + nginx gzip (ADR-0058). 2,672곳에 압축 전 671,376바이트, gzip 61,152바이트
- 로고 198곳(199곳 중 1곳은 원본이 그림이 아님), `/about`, 바닥글 링크 (ADR-0059)
- 수집 두 갈래 문서 정리(dev `docs/maintenance/`)
- [안 이름]으로 둔 이름은 대부분 그대로(`collection`, `collection_link`, `CatalogLoad.replaceAll`, `chaekcheck.chosenLibraries.v1`, `detailFetchUri`, `SiteVerdict.SUBSCRIPTION`, `library_import_not_empty`, `logo_file`, `logo_visible`, `logoUrl`). 실행 프로필 `collection-import`, 설정 `chaekcheck.collection.import.*`
- Modulith `components.puml`(2026-10-05)의 관계가 `docs/current/module-map.md` 사이클 07 구성도와 같음: Collection→Catalog, Collection→Library, Catalog→Library, Library→Region, Availability→Library·Catalog, Mylibrary→Auth(uses, listens to)·Library·Region
- AC-13 첫 쪽 1초 안: 가장 느린 첫 쪽 393ms (아래 "달라진 것"의 50곳 조정 뒤)

## 달라진 것과 이유

| 계획 | 실제 | 이유 |
|---|---|---|
| 검색 범위 기본값 "전체 도서관" | 가입할 수 있는 쪽이 기본, 그 버튼이 왼쪽(로그인 전 지역 없음 "누구나 가입", 지역 있음 "가입 가능한 곳", 로그인 후 "내 도서관", 비어 있어도). 로그인 전 첫 요청에 `scope=joinable`이 붙어 사이클 06 AC-14("로그인 전 요청이 사이클 05와 같음")가 맞지 않게 됨. API 기본값(`scope` 없으면 all)은 그대로 | 사용자: "이 프로젝트의 편의성을 생각했을 때 가입할 수 있는 곳으로 가는 것이 사용자 측면에서 좋다고 봐서" (2026-10-05, 회고 질문 #1 승인) |
| 로고: 이름 앞, 없으면 빈 상자 (AC-20, ADR-0059) | 로고는 이름 위 줄, 없으면 아무것도 그리지 않음. 로고 없는 도서관은 로고로 홈페이지를 열 수 없음(카드의 "홈페이지 (새 창)" 링크는 있음) | 사용자: "실제로 확인해보고 디자인 측면의 안정감때문에" (2026-10-05, 회고 질문 #3 승인) |
| 검색 조건: 완전 일치·역할은 저장 안 함 | 범위(로그인 전 `guestScope`, 로그인 후 `myScope`), 방문 없이 가입, 지금 빌릴 수 있는 책만, 정렬, 완전 일치, 옮긴이·그림·엮은이를 브라우저 `chaekcheck.searchSettings.v1`에 저장(보기 방식·직접 찾기는 사이클 04부터 같은 키). 주소 값이 이김. 검색어는 저장 안 함 | 사용자 요청 (2026-10-05, dev 기록), 이유 `[이유 미확인]`. **회고에서 일부 되돌림**: 사용자 "정렬, 상세검색의 완전 일치·옮긴이·그림·엮은이 … 이건 기억하지 마" (2026-10-05, 회고 질문 #2 미승인) → 기억하는 것은 범위, 방문 없이 가입, 지금 빌릴 수 있는 책만, 보기 방식, 직접 찾기만 [확정]. 정렬·완전 일치·역할 저장을 없애는 일은 다음 dev 인계서로 |
| 알라딘 출판사 검색은 그 도서관 실패 (C18, ADR-0056) | 씀 | 사용자: "출판사 검색도 씀" (2026-10-05, dev 7단계) |
| 북큐브 직접 찾기 첫 쪽만 (ADR-0056) | 다른 사이트처럼 "더 보기"(쪽 크기 10). 쪽 넘기기 `itemCount`·`page` 확인됨 | 사용자 결정 (2026-10-05, dev 7단계). 원문 없음 |
| `library-imports` 오류 422 `invalid_request` (C16) | 400 `validation_error`(`invalid_format`/`too_many`/`required`), 지역 저장과 같은 모양 | 사용자 선택 "400 validation_error로 맞춤" (2026-10-05) |
| 같은 사이트 거르기: `crawl_skip` 99곳 | 더해서 등록 도서관과 책 번호 목록이 같고 상세 주소가 포트만 다른 8곳을 뺌. 같은 기관의 다른 북큐브 사이트 6곳은 넣음 | 사용자: "책 목록이 겹치는 거지 가입 방법이라던가 도서관 링크가 다른 거 아니야?" → 결정 "① 8곳만 빼기" (2026-10-05) |
| 소속 전용 후보 공공도서관 2곳 규칙으로 | 대구학생전자도서관(100049)은 `MEMBERS_ONLY`(가입 방법·주의·가입 주소는 넣음). 세종시교육청(100722)은 같은 사이트 8곳에 들어 빠짐 | 사용자 결정 "구성원용으로" (2026-10-05). 기관 소속 규칙은 기관 표가 없어 쓸 수 없음 |
| 지역 표 그대로 | 증평군(4311) 추가, 전남광주통합특별시 줄임말 "전남광주". 증평군립도서관(383)이 규칙을 받음, 가입 규칙 250 → 253줄 | 사용자 결정 (2026-10-05). 증평군은 지역 seed를 만든 법정동 파일에서 빠져 있었음 |
| 후보 seed 주소 = 수집 DB 주소 | 리다이렉트를 따라간 https 최종 주소 248곳(`scripts/library/CheckFinalOrigins.java`). 가져오기의 주소 확인은 호스트·경로·쿼리로만 비교(http/https·포트 차이 허용, C10 변경), 상세 주소는 서비스 주소의 scheme·포트로 옮겨 씀 | 사용자 요청(강동대학교 북큐브가 검색되지 않음, "검색해도 안나오고"). dev `library-maintenance.md` 4-7 1번을 후보에 하지 않은 dev 실수 |
| 도서관 TLS: JDK 최상위 기관만 믿음 (ADR-0022) | OISTE WISeKey Global Root GB CA를 도서관 사이트 연결에만 믿음(3곳), 중간 인증서 3개 추가. `tls/library-roots/` | 사용자: "이거 신뢰해줘" (2026-10-05). ADR 갱신 필요 |
| (인계서에 없음) 책 번호 잇기 | `CatalogLoad.replaceAll` 안에서 SQL로(임시 표 → 옛 `holding`과 `(library_id, item_key)`로 맞대기). 규칙은 plan `catalog-refresh.md` 5.2절 그대로. 기록 `kept/new/dropped_book_id_count`. 실데이터 2회차: kept 1,617,445, new 0, dropped 0 | 사용자: "이것도 같이 구현해 줘", 모듈 "catalog 해줘" (2026-10-05) |
| (인계서에 없음) 요청 수·응답 크기 제한 | nginx IP별 `limit_req` 30r/m·burst 20·`limit_conn` 6 → 429 `too_many_requests`, 동시 검색 20 → 503 `server_busy`, 도서관 응답 본문 4MB·전체 15초. 숫자 모두 [안]. 화면은 일반 문구 | 사용자가 문제를 줌(요청 수 제한 없음, 응답을 통째로 읽음) (2026-10-05). 원문 없음 |
| (인계서에 없음) 알라딘 수가 없는 사이트 | 3곳(서정대·대구공업대·김해대)은 그 줄을 `UNKNOWN`("확인 필요")으로, 도서관 전체 실패 대신 | [이유 미확인: dev가 AC-24 확인 중 고침] |
| 꺼진 도서관 없음 | 135 전라북도교육청통합도서관, 2198 성균관대학교 (YES24), 2194 장안대학교 (YES24) 끔 (`library/010-library-disabled.yaml`) | 사용자 승인 (2026-10-05, 17단계) |
| Liquibase 새 파일 7개 뒤 대조 | 스키마 changeset을 `library/001`·`catalog/001`·`collection/001`로 접음. seed 파일은 그대로 | 인계서 C8 대로(합치기 [확정]). 접는 방식은 [이유 미확인: dev가 정함] |
| `/books`는 늘 `library_ids &&` + GIN | 계획 도서관이 50곳 [안]을 넘으면 GIN 없이 거름(제목·출판사·사람 인덱스가 찾은 줄만). 385곳에서 GIN이 1.4초 → 바꾼 뒤 393ms, 결과 57개 같음 | [이유 미확인: dev가 정함] (15단계 측정 뒤 조정). 회고에서 그대로 둠 [확정] (사용자 승인, 2026-10-05, 회고 질문 #6). 50은 [안] 값 |
| `catalog_library_snapshot.import_id` 지울지 dev가 정함 (C4) | 칸과 FK를 지움. 옛 `catalog.catalog_import` 줄은 옮기지 않음 | [이유 미확인: dev가 정함] (검색이 읽지 않고, 기록은 `collection`이 가짐). 회고에서 그대로 둠 [확정] (사용자 승인, 2026-10-05). 사용자가 물은 것: "몇 번째 수집에서 얻은 정보인지는 알아야 하지 않나" → 책 목록은 매번 통째로 바뀌어 가져오기 기록 한 줄이 출처. 대신 가져오기 기록에 사본의 수집 기간을 더함 [확정] (사용자: "이거 넣어주는 것으로 해", 2026-10-05) → 다음 인계서 |
| S11 답한 기록 키 | `chaekcheck.regionImport.v1` 하나를 지역·도서관이 함께 씀 | [이유 미확인: dev가 정함] (한 질문으로 둘을 묻기 때문). 회고에서 그대로 둠 [확정] (사용자 승인, 2026-10-05). 결과: 한 번 답한 계정은 그 브라우저에서 다시 묻지 않음(나중에 브라우저에 추가한 도서관은 계정으로 옮겨지지 않음). "답했음" 기록은 그 브라우저에만 있음 |
| `lendingModel`을 `LibraryRef`에 (design-delta) | `SearchTarget`에만, 웹에 보내지 않음. `joinSurvey`는 스트림 `targets.libraries[]`와 `GET /api/v1/libraries`에 둘 다 | 인계서 C14·C15가 dev에 맡김 |
| 교보 소장형: `lending_model = OWNED`면 숫자 | 목록은 `lending_model`과 상관없이 줄마다 숫자가 있으면 숫자, 없으면 구독. 책 화면(소장 스트림)은 `OWNED`만 상세 쪽을 읽음. `KYOBO_SUBSCRIPTION_V1`·`BOOKCUBE_FX`는 같은 판정기 | 사이트 시험 결과(dev 7단계): 혼합형은 줄마다 다름 |

## 완료 기준 결과

- 통과: AC-1~5, 7, 9~14, 16~18, 21~24 (dev 16단계 표)
- 사용자 확인 남음: AC-8(알라딘 수를 사이트와 비교, 22곳은 수가 나옴), AC-19(실제 소셜 로그인)
- 문장이 바뀜: AC-20(위 표)
- AC-15 문장을 바꿈 [확정] (사용자 제안, 2026-10-05, 회고 질문 #4: "이렇게 해줘"): "로그인하지 않고 직접 추가한 도서관도 없는 사람의 검색은 가입 조사를 한 공공도서관(지금 385곳)만 찾는다. 학교·대학·회사·기관처럼 구성원만 쓰는 도서관과 종류를 모르는 도서관은 찾지 않고, 그 사이트에 요청도 보내지 않는다." 처음 문장("이 사이클 전과 같다")은 ADR-0053(조사된 후보 공공도서관 약 107곳은 누구의 계획에나 들어감)과 함께 지킬 수 없었음. 사용자: "결과적으로 로그인 전 검색 결과가 "공공도서관"인 거 아니야 그게 중요한 거 아니야?" dev 확인값: 직접 추가 없이 385곳(278 + 107), 구성원용·종류 모름 0곳, 그 사이트 요청 0건(AC-4). 3곳을 끈 뒤의 수는 다시 세지 않음
- 이름: 후보 도서관도 서비스에 들어왔으므로 "등록 도서관"은 "사이클 07 전부터 있던 도서관(278곳)"으로 부름(AC-6 설명용). 사용자: "이거 이제 후보 도서관들도 이제 등록 도서관이 되었자나..." (2026-10-05)
- AC-6 닫음 [확정] (사용자 승인, 2026-10-05, 회고 질문 #5): 사이클 07 전부터 있던 도서관만 쓰는 이용자의 검색 대상(278·114·31곳, 순서 같음)과 가진 책 (도서관, 책 코드)는 같음(새로 뺀 교보 "동영상" 391줄만 차이). 책 목록 응답 57개 중 38개가 다른 것은 사이클 07에 넣은 도서관의 책이 같은 책 묶기에 함께 들어가 묶음이 합쳐졌기 때문(권수 0~2.5% 감소, 대표 제목·순서 바뀜)이고, 이 차이는 받아들임

## 새로 알게 된 제약

- 가져오기는 JVM 기본 최대 힙 8,096MB(PC 32GB의 1/4)에서 끝남. 더 작은 힙은 재지 않음 → 운영 서버에서 가져오기를 돌리면 8GB급 힙을 전제로 서버 크기를 정함. 로그의 "heap used up to …MB"는 풀별 최고치 합이라 실제보다 큼
- 가져오기 시간: 35분 45초(첫 회) → 책 번호 잇기를 넣은 뒤 쓰기가 늘어 36분 43초~40분 36초. 그동안 검색이 기다림(배포 전이라 받아들임, `catalog-refresh.md` 5.1절과 함께 볼 일)
- DB 크기(VACUUM ANALYZE 뒤): 전체 9,812MB, `holding` 8,353MB(표 6,035MB). `book_library_ids_gin` 48MB
- `holding`은 수집 DB를 읽은 순서(대개 도서관별)로 들어가 한 책의 줄이 표 전체에 흩어짐. 정렬·`CLUSTER` 없음, PostgreSQL 메모리 설정도 없음(`compose.yaml`, `docker/postgres-bigm/Dockerfile`) → `docs/research/deploy/db-memory.md`
- 후보 도서관 책이 같은 책 묶기에 함께 들어가 등록 도서관 책 묶음끼리 이어져 합쳐짐(권수 0~2.5% 감소, 대표 제목 바뀜)
- 리다이렉트로 호스트까지 바뀐 도서관(411 `ebook2.ezville.net` → `gsenc.bookcube.biz`)은 가져오기의 같은 사이트 확인에 걸려 소장 64,461줄이 빠짐
- YES24 모바일판 13곳: 폰에서 첫 화면·검색 결과가 `/m/`으로 넘어가며 다른 학교·"페이지 없음"·빈 화면. 책 상세 링크는 맞음
- 사이트 제목이 다른 기관인 곳 약 10곳(예: 대전신흥고등학교 → 대전신흥초등학교), 이름이 바뀐 기관(서라벌대 → 신경주대 등) (dev `library-site-issues.md` 10절)
- 이 JDK 25에는 Sectigo R46 루트가 없음. 사이클 02 기록 "R36 ← R46(JDK에 있음)"은 틀림
- `catalog-import`(지금 `collection-import`) 프로필은 로그인 기능이 켜진 `.env`에서 시작하지 못함 → 프로필 파일에 `chaekcheck.auth.enabled: false`
- `/my-libraries`가 nginx 화면 경로에 없어 직접 열면 404였음 → 고침
- `db-test`는 메모리 디스크라 10GB DB를 담지 못함

## 확인하지 못한 것(남은 일)

- AC-8 알라딘 수 사용자 비교, AC-19 실제 소셜 로그인
- 로고 내림 연락 이메일(S12 자리 글, `TODO(확인 필요)`)
- 알라딘 "대출하기" 단추를 대출 가능 판정에 쓸지(대출 중인 책 화면을 못 봄)
- 합치기·나뉨이 있는 책 번호 잇기는 실데이터로 못 봄(같은 사본이라). 다음 사본 가져오기 로그의 kept/new/dropped로 확인
- 북큐브 한 사이트에 소장형·대여형이 섞이는지 못 봄(줄마다 판정하므로 섞여도 맞게 나옴)
- `limit_conn`은 오래 열린 스트림으로 재 보지 않음

## dev 남은 질문에 대한 답 (2026-10-05)

dev `plan-feedback.md` "plan에 넘길 요약" 5절 중 위에서 다루지 않은 것. 결정 페이지 `easy/2026-10-05-dev-questions.html`.

| 질문 | 답 | 태그 |
|---|---|---|
| 429 `too_many_requests`·503 `server_busy` 화면 문구 | 따로 둠(예: 429 "검색을 너무 자주 했어요. 1분쯤 뒤에 다시 해 주세요.", 503 "지금 찾는 사람이 많아요. 잠시 뒤에 다시 해 주세요."), API 오류표에 두 코드를 더함. 문구는 [안] | [확정] (사용자 승인, 2026-10-05) → 다음 인계서 |
| 제한 숫자, 실제 사용자 IP(`real_ip`) | 배포할 때 정함. 그때까지 숫자는 [안] | [확정] (사용자 승인, 2026-10-05) |
| 도서관 411(호스트가 바뀐 리다이렉트) | 수집 DB 주소를 넘어가는 곳(`https://gsenc.bookcube.biz/FxLibrary`)으로 고치고 다시 수집. 도서관 수집 갈래 "확인" 단계에서 최종 주소도 확인 | [확정] (사용자 승인, 2026-10-05) |
| YES24 모바일판 13곳 | 링크 옆에 "폰에서는 사이트가 다른 화면을 보여요. PC에서 열어 주세요" 안내(도서관 표에 표시 칸 필요). 문구 [안] | [확정] (사용자: "(나) 링크 옆에 … 안내 … 이걸로 해줘", 2026-10-05) → 다음 인계서 |
| 사이트 제목이 다른 기관 약 10곳 | plan이 한 곳씩 확인(같은 사이트 1건·1초)해 표로 만든 뒤 곳마다 다시 물음 | [확정] (사용자 승인, 2026-10-05) |
| 기관 이름이 바뀐 곳 | "처음 정한 이름은 바꾸지 않음"에 예외: 기관 이름이 공식적으로 바뀌었거나 틀렸으면 고칠 수 있음, 번호는 유지. 고칠 목록은 다시 물음 | [확정] (사용자 승인, 2026-10-05) |
| 알라딘 "대출하기" 단추 | 대출 중인 책 화면을 볼 때까지 "확인 필요"(`UNKNOWN`) 그대로 | [확정] (사용자 승인, 2026-10-05) |
| ADR-0022 갱신(인증 기관 추가) | 지금 이것만 먼저 기록 | [확정] (사용자: "지금 이것만 먼저 기록.", 2026-10-05) |
| 회원 데이터의 책 번호 고쳐 쓰기 | 회원이 책을 저장하는 기능을 만드는 사이클의 할 일 | [확정] (사용자 승인, 2026-10-05) |
| 가져오기 시간·검색이 기다림 | 간단한 설계를 미리 해 둠: 기존 표를 두고 새 표(임시 표)에 쓴 뒤 다 되면 바꿔 끼움 (`catalog-refresh.md` 5.1 "표 통째로 바꾸기"와 같은 방향) | [확정] 방향 (사용자: "간단한 설계를 미리 해두는 건 어때? … 기존 테이블을 냅두고 TEMP 테이블 두었다가 다 되면 TEMP랑 기존이랑 바꿔치기 하는 식으로", 2026-10-05). 설계는 사이클에서 |

## Modulith 문서와 `docs/current/` 비교

- `backend/build/spring-modulith-docs/components.puml`(2026-10-05): Catalog→Library, Library→Region, Mylibrary→Auth(listens to, uses), Mylibrary→Library, Mylibrary→Region, Availability→Library·Catalog, Collection→Catalog·Library(depends on). `module-map.md` 사이클 07 구성도와 같음
- 다른 점: `collection`의 허용 의존에 named interface `catalog :: normalize`가 더해짐. 공개 API 칸에 새 공개 타입 `JoinSurvey`, `LendingModel`(`library`), `CatalogLoad`(`catalog`)
- `docs/current/`는 이 회고와 함께 "설계됨(미구현, 사이클 07)" 표시를 구현됨으로, 위 차이를 반영해 고침

## 다음 사이클 후보

(회고 질문을 정한 뒤 사이클 08 후보 페이지에서 고름)
