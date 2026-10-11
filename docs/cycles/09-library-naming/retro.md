# 사이클 09 회고: 도서관 이름은 기관 이름만, 업체·대출 방식은 분류로

- 작성: 2026-10-12. 근거: dev `docs/plan-feedback.md` "# 사이클 09"(2341행~, AC 확인표 2426~2438행, "plan에 넘길 요약 (사이클 09)" 2440~2450행), dev 코드(`backend/src/main/resources/db/changelog/library/014-library-classification.yaml`, `library` 모듈 공개 타입, `availability/internal/search/StreamEvents.java`, `web/src/lib/libraryClassification.ts`, `web/src/features/mylibrary/libraryNames.ts`·`MyLibrariesPage.tsx`, `web/src/features/search/ResultRow.tsx`, `scripts/library/build_candidate_seed.py`, `backend/build/spring-modulith-docs/components.puml`), 사용자 보고(2026-10-12)
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`. 사용자 말은 dev가 `plan-feedback.md`에 옮긴 것. dev가 적은 사정은 "dev가 적은 사정" 칸에 사실로만 둠
- dev가 마친 범위: 인계서 0~7단계 전부. 백엔드 `./gradlew build`(`ModularityTests`, `DocumentationTests` 포함), 웹 `npm test` 40파일 304개, `npm run build`, `npm run lint` 통과 (dev `plan-feedback.md` 2391행). `cycle09` 브랜치를 main에 합치고 운영 `db`에 014를 적용함(2409행). 사이클을 마친 dev 커밋은 871fbd4 (사용자 전달, 2026-10-12) [확인 필요: plan에서 dev git 기록을 직접 보지 않음]
- 사이클 마무리: 사용자 "화면 괜찮아, 사이클 09 마무리해" (2026-10-12, dev 2450행)

## 계획대로 된 것

- 이름: 이름 끝 업체·대출 방식 괄호를 289줄에서 떼고, 정한 이름 고침을 같은 changeset에서 적용함. 대상은 괄호 277, 434·456 "(북큐브)", 76·64·93·943·1575·1149·386, 977, 학교 6곳. 괄호 셈은 plan과 같음(뗄 277, 남길 45, 애매 2). `name_overrides.tsv`는 최종 295줄(이번에 287줄 더함) (dev 2360~2361·2444행). 014의 이름 VALUES는 289줄 (`014-library-classification.yaml:26-314`) [확정] (사용자: 이름 바꿀 289줄 목록을 보고 "승인, 커밋", 2026-10-11, dev 2379행)
- 공식 이름: 10곳 모두 spec 이름과 같음(dev `library-maintenance.md` 4-13-2). 943 "경상남도교육청 양산도서관"은 경남교육청 기관 안내로 새로 확인 (dev 2359행)
- 기관 이름 속 괄호: 014 적용 뒤 남은 45줄이 0단계의 "남길 줄"과 같은 번호·이름. 1149만 이스케이프를 고침 (dev 2378·2409행, AC-2)
- 분류 칸: `vendor`, `order_no`, CHECK 넷(`library_vendor_check`, `library_vendor_required_check`, `library_lending_model_required_check`, `library_order_no_check`), `UNIQUE NULLS NOT DISTINCT library_classification_key (name, vendor, lending_model, order_no)`. 이름·값 모두 인계서대로이고 순서도 design-delta 1~7과 같음 (`014-library-classification.yaml:18-361`)
- 014 적용 결과: 2,663줄, `vendor` NULL 0, 포털 말고 `lending_model` NULL 0, `order_no` 모두 1 (dev 2409행)
  - 업체별: KYOBO 1,642, YES24 547, BOOKCUBE 441, ALADIN 25, PORTAL 7, IN_HOUSE 1
  - 대출 방식별: OWNED 2,634, SUBSCRIPTION 11, RENTAL 9, MIXED 2, NULL 7(포털)
  - 출처: dev 2370·2444행
- 북큐브 구독 339·380·386·705가 plan과 같음 (dev 2369행). 순번 2 이상 0곳, 대응표와 다른 업체 0곳
- 검색·소장 판정 그대로 (AC-8): C5 목록 18곳 같음, `/api/v1/books` 54쪽의 책 번호·전체 수 같음, 대출 현황 스트림 2묶음의 상태·권수 같음, 검색 스트림 4개 중 3개 같고 나머지 1개는 "새로 알게 된 제약"에 적음 (dev 2413~2417행)
- 내 도서관 (AC-5): 014 전에 로그인 전 브라우저에 넣은 434·943·1575·339·769·76이 모두 남아 새 이름과 분류로 보임. 계정 쪽은 `MyLibraryApiTests`로 대신함 (dev 2418행)
- API: `GET /api/v1/libraries`와 스트림 `targets.libraries[]`에 `vendor`·`lendingModel`·`orderNo`가 레코드 끝 칸으로 붙음 (`LibraryEligibility.java:21-24`, `SearchTarget.java:22-26`, `StreamEvents.java:84-92`). 공개 enum `Vendor`는 모듈 루트 (`library/Vendor.java:8-21`). Javadoc은 "통합 포털 말고 모두, 포털만 null"로 고침 (`LendingModel.java:3-7`, `SearchTarget.java:14-15`)
- 웹
  - 분류 글자 6×4와 "· N번째 사이트": `libraryClassification.ts:4-44`
  - 결과 카드는 이름 버튼 밖 다음 줄에 분류, 폰 안내보다 앞: `ResultRow.tsx:154-155`
  - S10 세 목록은 PC 이름 옆, `width <= 640px`에서 이름 아래 줄: `MyLibrariesPage.tsx:278-291`, `MyLibrariesPage.module.css:345-364`
  - [추가]·[빼기] `aria-label`에 분류가 들어감: `MyLibrariesPage.tsx:293-296`
  - "동대문 yes24" → YES24 한 줄 (AC-6)
- 화면 확인: Playwright 1280/768/375/320에서 가로 넘침 없음, 괄호 없음 (dev 2419~2423행). 사용자 "화면 괜찮아" (2026-10-12)
- dev 도구·문서: `check_front_page_names.py`의 괄호 떼기를 지움, `library-maintenance.md` 1-1·4-5·4-12·13절과 `1-libraries.md`를 고침, `build.gradle` 주석을 `-PbootRunXmx=6g`으로 (dev 2403~2404행)
- Modulith `components.puml`(2026-10-12 빌드)의 관계가 `docs/current/module-map.md`와 같음: Collection→Catalog·Library, Catalog→Library, Library→Region, Availability→Library·Catalog, Mylibrary→Auth·Library·Region (`components.puml:31-40`). 새 모듈·새 이벤트·관계 변화 없음. 바꿔야 할 Mermaid 그림 없음

## 완료 기준 결과 (dev AC 확인표, 2026-10-12)

- 통과: AC-1~9 (dev 2428~2438행)
- AC-4는 "순서 주의"로 통과: "군산시립" 세 줄이 교보 → 북큐브 → YES24 순 (아래 "plan이 정할 것" 1)
- AC-5 계정 쪽은 실제 로그인 대신 테스트로 확인 (사용자 결정, 아래 표)
- AC-9는 지금 데이터에 순번 2 이상이 없어 Vitest와 API 테스트(`LibraryListTests.classificationIsListed`, 스트림 `orderNo:2`)로 확인
- 통합 포털 "통합 포털" 글자는 Vitest로만 확인 (dev 2423행)

## 달라진 것과 이유

| 달라진 것 | 이유 | dev가 적은 사정 | 처리 |
|---|---|---|---|
| "군산시립" 세 줄의 순서가 교보 → 북큐브 → YES24. 인계서 테스트 예시는 "교보·YES24·북큐브" (dev 2388행, `libraryNames.ts:20,40-41`) | [이유 미확인] | 규칙 "같은 이름은 업체 글자순"을 `Intl.Collator('ko')`로 정렬하면 한글이 라틴 글자보다 앞. 규칙을 따랐고 plan 확인을 요청함 | plan이 정할 것 1 |
| 이름 UPDATE 문장만 `splitStatements: false` (`014-library-classification.yaml:20-22`) | [이유 미확인] | 1149 옛 이름 "메리츠(증권&amp;amp;캐피탈)"에 세미콜론이 있어 Liquibase가 문장을 나눔 | 받아들임 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #3) |
| 대출 방식 UPDATE를 번호 VALUES 1,458줄 대신 화면 종류 규칙으로. 번호는 북큐브 339·380·386·705와 교보 구독형 59·131·140·275~278만 (`014-library-classification.yaml:329-348`) | [이유 미확인] | 2단계 스크립트 출력(1,458줄)과 결과가 같은지 따로 띄운 DB에서 확인함 (dev 2377행) | 받아들임 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #3) |
| 허용 값 CHECK(`library_vendor_check`)를 칸 추가와 함께 걸고, 나머지 CHECK 셋은 `order_no` 다음 한 문장으로 (`014-library-classification.yaml:319-320,352-356`) | [이유 미확인] | 인계서가 허용한 방식 | 받아들임 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #3) |
| S10 이름 찾기의 "이름 앞부분 일치"를 낱말이 아니라 검색어 전체 열쇠로 판단. 같은 이름·같은 업체는 마지막에 순번 순 (dev 2389행, `libraryNames.ts:37-42`) | [이유 미확인] | 지금 결과 순서를 지키려고 | 받아들임 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #3) → `docs/current/module-map.md`에 적음 |
| 0단계·7단계 비교 지역을 시·도 대신 구로: 종로구 1101 거주, 동래구 2606 거주 + 직접 추가 339·943·1575 (dev 2398·2446행) | [이유 미확인] | 인계서 [안]의 "서울·부산"은 시·도라 422 `not_sigungu` | 받아들임 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #3) |
| AC-5 계정 쪽을 실제 로그인 대신 `MyLibraryApiTests`로 확인 (dev 2399행) | 사용자: "브라우저만 + 테스트로 대신" | 014는 번호를 바꾸지 않음. 네이버·카카오 로그인이 필요 | [확정] (사용자, dev 세션 2026-10-11) |
| worktree `../chaekcheck-dev-cycle09`와 따로 띄운 DB(5434·5435)에서 개발, 마친 뒤 정리 (dev 2345·2449행) | 사용자: "db따로 띄워서 하면 안 되나?", "정리도 해줘" | 사이클 08 측정과 겹치지 않게 | 끝남 [확정] |
| `CandidateSeedTests`의 280 이하 `OWNED` 수 5 → 255 (dev 2385행) | [이유 미확인] | 014 뒤 DB에서 셈: 교보 구독형 probe 5 + 나머지 화면 250 | 받아들임. 값이 채워진 결과 |
| `eligibility_rules.py`·`build_seed.py`의 이름 열쇠(예: `'국립세종도서관(구독형)'`)를 고치지 않음 (dev 2405행) | [이유 미확인] | 다시 돌리지 않으므로 그대로 | plan이 정할 것 3 |
| seed CSV 셋은 그대로 두고 스크립트를 `--changes-only`로만 돌림. `vendor`·`order_no`는 아직 seed 칸이 아님 (dev 2371행) | [이유 미확인] | 인계서대로. 첫 배포 직전 seed 정리 때 | 인계서와 같음 [확정] (seed 고치는 방식, 사이클 08) |

## [확인 필요] 결과 (인계서 표)

| 항목 | 결과 |
|---|---|
| changeset 번호 014 | `library/014-library-classification.yaml`, changeSet 하나 `library-014-classification-2026-10-11` [확정] (dev 구현 확인, 2026-10-12, `014-library-classification.yaml:15`) |
| 북큐브 구독 번호 | 339·380·386·705로 plan과 같음 [확정] (dev 2369행) |
| 공식 이름(학교 6곳, 977, 943, 64) | 모두 spec과 같음 [확정] (dev 2359행) |
| 이름 UPDATE 실제 줄 수 | 289줄 [확정] (사용자 "승인, 커밋", 2026-10-11) |
| 괄호 셈 277 / 45 / 2 | 같음 [확정] (dev 2360행) |
| 014 `old_name`을 만드는 방법 | 013까지 적용한 로컬 `db`를 내보내 `--changes-only <db-state.tsv>`에 넣음 [확정] (dev 2366행) |
| 등록 도서관의 화면 종류·대출 방식을 읽는 곳 | 화면 종류는 seed CSV와 002 YAML, 대출 방식은 `library/008` UPDATE 쌍. DB 상태 파일은 옛 이름 비교에만. 어긋나면 멈춤 [확정] (dev 2367행) |
| 목록 응답 크기 | 압축 전 737,300 → 874,306바이트(+18.6%), gzip 52,686 → 53,049바이트(+0.7%) [확정] (dev 측정 2026-10-12, 사용자 "응답 크기 그대로 괜찮아") |
| 첫 `targets` 크기 | +7.5~8.2% [확정] (같은 측정) |
| 순번 2 이상 | 0곳 [확정] (dev 2369행) |
| 수집 DB 이름을 바꾸는 방법·때 | 남음 → plan이 정할 것 2 |
| 수집이 업체를 따로 적는 자리 | 남음. 스크립트에 빈 자리 `COLLECTION_VENDORS = {}`와 `TODO(확인 필요)`만 (`build_candidate_seed.py:96-98`) → plan이 정할 것 2 |
| `eligibility_rules.py`·`build_seed.py`를 다시 돌리는지 | 돌리지 않음, 이름 열쇠는 옛 이름 그대로 (dev 2405행) → plan이 정할 것 3 |

## 새로 알게 된 제약

- Liquibase `sql` 변경은 기본으로 세미콜론에서 문장을 나눔. 문자열 안에 세미콜론이 있으면 `splitStatements: false`가 필요함 (`014-library-classification.yaml:20-22`). 다음 이름 고침 changeset에도 해당함
- `Intl.Collator('ko')`는 한글 업체 글자를 라틴 글자(YES24)보다 앞에 둠. "업체 글자순"이면 교보 → 북큐브 → 알라딘 → 자체 → 통합 포털 → YES24 (dev 2388행, `libraryNames.ts:14,41`)
- 응답 크기: 목록 API는 압축 전 18.6% 늘지만 gzip으로는 0.7%. gzip은 서버가 아니라 nginx가 함 (dev 2396·2411행)
- 사이클 08 기록(671,376 / 61,152바이트)과 0단계 기준(737,300 / 52,686바이트)이 다름. dev 해석: 사이클 08에서 칸이 늘었고 잰 방법이 다름 (dev 2396행). 앞으로 비교 기준은 0단계 값 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #6)
- 검색 스트림 비교 1건이 다름("동래구 + 직접 추가, 저자 김영하"): 첫 묶음이 행 한도에 먼저 닿아 340·80을 요청하지 않음. 다시 받아 보니 340은 0건으로 같았고, 80은 대출 중 2 → 1로 사이트 쪽 변화. 판정이 바뀐 곳은 없음 (dev 2416행). 같은 질의 비교는 행 한도에 따라 요청 범위가 흔들릴 수 있음
- 339(`upstream_error`)와 1575(`upstream_timeout`, 교보 구독형 서버)는 014 전후 모두 실패 (dev 2417행). 교보 구독형 서버가 이 PC에서 막힌 일과 같은 계열(사이클 08 retro)
- 검색 스트림의 지역 ID는 시군구만 받음. 시·도를 보내면 422 `not_sigungu` (dev 2398행)
- dev 환경: WSL은 붙어 있는 프로세스가 없으면 몇 초 뒤 꺼지고 Docker 컨테이너도 멈춤. 측정·테스트 중에는 `wsl -d Ubuntu -- sleep infinity`로 붙잡아 둠 (dev 2392·2447행)
- 수집 DB 이름 바꾸기 목록 `data/cycle09/collection-rename-list.tsv`(dev, git 밖)는 289줄, 그중 237줄은 수집 번호가 서비스 번호와 다름. 짝 `collection_link`가 반드시 필요함 (dev 2424행)

## plan이 정할 것

결정 페이지: `easy/2026-10-12-retro-decisions.html` (6개 모두 승인, 2026-10-12)

### 1. "군산시립"처럼 같은 이름 여러 줄의 순서

- 지금 코드: 이름 앞부분 일치 → 이름 가나다순 → 업체 글자(`Intl.Collator('ko')`) → 순번. 결과는 교보 → 북큐브 → YES24 (`libraryNames.ts:37-42`)
- 인계서: 규칙 "같은 이름은 업체 글자순" [확정]과 테스트 예시 "교보·YES24·북큐브"가 서로 맞지 않았음
- 안: 가. 지금 코드 그대로(교보 → 북큐브 → 알라딘 → 자체 → 통합 포털 → YES24) / 나. 업체 순서를 따로 정함(예: 서비스 도서관 수 순 교보 → YES24 → 북큐브 → 알라딘 → 통합 포털 → 자체) / 다. 서비스 번호 순. → **가(지금 코드 그대로, 한글 가나다순)** [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #1)

### 2. 수집 DB 이름을 바꾸는 방법과 때 (수집 세션과 맞출 일)

- 정해진 것: 수집 DB 이름도 서비스와 같게 바꿈 [확정] (사용자: "이렇게 가자", 2026-10-11, spec R1-7)
- 넘길 목록: dev `data/cycle09/collection-rename-list.tsv` (서비스 번호, 수집 번호, 최종 이름, 289줄)
- 안: 가. 지금 한 번에(수집기가 쉬는 때, 수집 번호와 옛 이름이 맞을 때만 UPDATE, 사본은 그대로) / 나. 다음 새 사본 가져오기 사이클 시작 때 / 다. 수집 DB는 그대로, 스크립트가 `name_overrides.tsv`로 고쳐 읽음(사용자 결정을 바꾸는 일). → **가(지금 한 번에, 수집 세션)** [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #2). 수집 세션에 넘길 메모: `../../research/maintenance/collection-rename-message-2026-10-12.md`
- 같은 자리에서: 수집이 업체를 따로 적는 자리 [확인 필요: 수집 세션]. 안: 수집 DB에 업체 칸 하나, 대응표와 다른 사이트만 적음 [안]

### 3. `eligibility_rules.py`·`build_seed.py`의 옛 이름 열쇠

- → **가(첫 배포 직전 seed 정리 때 함께 고침)** [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #4)

### 4. backlog에 더할 것

- 607 원광보건대학 이름 (보류, spec R1-10) → backlog에 더함 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #5)
- 북큐브 책 0종·응답 없음 5곳의 대출 방식(지금 `OWNED`)을 다음 수집 때 다시 봄 (spec R3) → backlog에 더함 [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-retro-decisions.html` #5)

## docs/current에 반영할 차이

다른 세션의 커밋 안 된 `docs/current/data-model.md` 변경이 커밋된 뒤, 그리고 plan이 정할 것 1이 정해진 뒤 반영함. 모두 "설계됨(미구현, 사이클 09)"을 "구현됨 (사이클 09)"으로 바꾸고 아래 값을 코드에 맞춤. Mermaid 흐름 모양은 그대로(라벨의 "미구현"만 지움).

- `module-map.md`: 머리글에 "사이클 09 회고 (2026-10-12)" 한 줄. 사이클 09 줄 구현됨으로. `components.puml`(2026-10-12) 대조 결과(관계 그대로). 사이클 09 웹: `libraryClassification.ts`, `width <= 640px`, `aria-label` 분류, S10 이름 찾기 정렬(검색어 전체 열쇠 앞부분 일치, 업체 순은 결정 1대로, 그다음 순번)
- `data-model.md`: 머리글 한 줄. `lending_model` 설명을 "포털 말고 모두"로, 014 뒤 셈(OWNED 2,634 / SUBSCRIPTION 11 / RENTAL 9 / MIXED 2 / NULL 7). `vendor` 업체별 셈. 제약 목록에서 `library_name_key` 지움. 014 파일 이름·changeSet id [확정]. 이름 UPDATE 289줄·`splitStatements: false`. 대출 방식 "규칙 + 번호". 293 [확인 필요] → 289 [확정], `name_overrides.tsv` 295줄. 북큐브 번호 [확정]. 수집 이름 목록 파일(289줄, 수집 번호가 다른 줄 237). seed 규칙에 `--changes-only`, 다섯째 인자, 종료 코드 3, `COLLECTION_VENDORS` 빈 자리. 확인 필요 표는 수집 세션 줄만 남김
- `api.md`: 머리글 한 줄. `GET /api/v1/libraries` 새 칸 위치(`mobileSiteDiffers` 뒤 `vendor`, `lendingModel`, `orderNo`)와 응답 크기(874,306 / gzip 53,049, 사용자 "응답 크기 그대로 괜찮아"). 사이클 08 예시 이름에 "(사이클 08까지의 이름)". 스트림 칸 순서와 첫 `targets` 크기 +7.5~8.2%
- `flows.md`: 머리글 한 줄. 흐름 23 구현됨, `library/014-library-classification.yaml` [확정] + changeSet 하나 + `splitStatements: false`. 화면 공통의 같은 이름 업체 순서는 결정 1대로
- `handoff.md`: 사이클 10 인계서로 바꿀 때 교체

## 다음 사이클 후보

- 사이클 10 인기 도서 (설계 끝, 인계서 작성 중, `../10-popular-books/`). 09 dev가 끝나 순서대로 인계
- 사이클 11 가져오기 따로 하기 (초안, `../11-separate-import/`)
- 수집 세션 일(사이클 아님): 수집 DB 이름 289줄 바꾸기, 수집 업체 자리 정하기
- 첫 배포 직전 seed 정리: 013·014를 seed에 합치기, `vendor`·`order_no` seed 칸, `eligibility_rules.py`·`build_seed.py` 이름 열쇠 (backlog)
- 새 사본으로 가져오기(411 책 포함), 정해진 때마다 자동 갱신, 수집기 옮기기, 책 묶기 기준 다시 보기 (backlog)
- 607 원광보건대학 이름, 북큐브 5곳 대출 방식 다시 보기, 교보 구독형 서버가 풀리면 사이트 다시 확인 (backlog)
