# 사이클 04 회고: AND 검색 (제목·저자·출판사 여러 조건)

- 작성: 2026-10-01 (`/cycle-start 회원` 1단계). 대조한 것: dev 커밋 `c6028c9`(2026-09-30 19:01)의 `backend/`·`web/`, Spring Modulith `Documenter` 출력(`backend/build/spring-modulith-docs/`, 2026-09-30 17:53), dev `docs/plan-feedback.md` `# 사이클 04` 절(702~801행), 이 사이클의 `design-delta.md`·`handoff.md`, `docs/current/`.
- **상태: 코드 완료, 검증 미완.** 실제 데이터 가져오기(5단계 마지막 실행), 검색 응답 시간 측정(6단계), AC-1~AC-14 확인표(14단계)는 사용자 결정으로 미룸 (사용자: "다 수집할 거는 며칠 걸릴 거라고 하니까 이건 좀 미뤄둬", 2026-10-01). 그때까지 이 회고의 "측정" 항목은 비어 있음. 다시 시작할 때 볼 것은 `docs/backlog.md` "미뤄 둔 사이클 04 마무리 작업".
- 사이클 04 변경 4가지의 문서 반영과 ADR-0035는 회고 전 2026-10-01에 미리 함(`docs/reference-index.md`, `same-book-isbn.md` 5절).

## 계획대로 된 것

- 0단계 사이클 03 후속(ADR-0027 방문 가입 조회 순서): `LibraryService.planSearch` 수정, 테스트 추가, 실제 `targets` 순서 확인(마포구 114곳: 내 시도(방문 없음) 16 → 누구나(방문 없음) 15 → 내 시도(방문) 7 → 누구나(방문) 16 → 확인 필요(방문 없음) 47 → 확인 필요(방문) 13).
- 모듈: 새 모듈 `catalog`, 의존 `catalog → library`, `availability → catalog, library`, `library → region`, 순환 없음. `Documenter` `components.puml`이 `module-map.md`와 같음. `ModularityTests`·`DocumentationTests` 통과(dev 보고).
- `library` 공개 API: `planSearch(residenceIds, workIds, PlanOptions(scope, visit))`, `enabledLibraryRefs()`. 옛 두 인자 `planSearch`는 `PlanOptions.DEFAULT`로 위임하는 default 메서드로 남김.
- `catalog`: Liquibase `catalog/001-catalog-schema.yaml`(표 5개, 인덱스는 design-delta 그대로, `CREATE EXTENSION IF NOT EXISTS pg_bigm WITH SCHEMA public`), 정리 규칙 `internal/normalize`, 가져오기 도구 `internal/importer`(프로필 `catalog-import`), `GET /api/v1/books`, `GET /api/v1/books/{bookId}`. JPA 엔티티 없음(`JdbcClient` + JDBC COPY).
- `availability`: 화면 종류별 `parseDetail` + fixture(`fixtures/<화면 종류>/detail-1.html`), `LookupTask`로 `BatchRunner` 일반화, `GET /api/v1/book-availabilities/stream`, `…/batches/stream`.
- 웹: 조건 드롭다운 제거·여러 조건·완전 일치·역할·정렬, 설정 창(`SettingsPanel`, 보기 방식·직접 찾기), 바로 보기(`InstantResults`), 책 먼저 고르기(`BookList`), S3 책 화면(`features/book/BookPage`), 직접 찾기(`DirectResults`, 사이클 03 흐름 그대로). 주소 `view=books`, `direct=on`, 저장 키 `chaekcheck.searchSettings.v1`.
- 개발·테스트 DB 이미지 `docker/postgres-bigm/`(`chaekcheck/postgres-bigm:18`, pg_bigm v1.2-20250903 정식 빌드), `compose.yaml`, dev `CLAUDE.md` Directory Layout 한 줄. 기존 `db-data` 볼륨 그대로 뜸.
- 의존성 `sqlite-jdbc` 3.53.4.0(Apache 2.0)은 Gradle 설정 `catalogImport`로 `bootRun`·테스트에만, `bootJar` 제외. `org.postgresql:postgresql`은 `implementation`(CopyManager).
- [안] 값 목록의 이름(패키지, 클래스, 프로필, 설정 키, 표 이름, fixture, 웹 파일, 이미지 경로)은 모두 그대로.
- 상세 페이지 호출 시험(2026-09-30 17:23, 4권·소장 14줄): 요청 12건 모두 성공, 첫 묶음 약 4.5초, 요청은 상세 페이지뿐, UA `chaekcheck/0.0.1`, 같은 호스트 두 번째 요청은 1.0초 뒤.

## 달라진 것과 이유

| 달라진 것 | 이유 | 기록 |
|---|---|---|
| `book.content_type` CHECK를 `EBOOK`만에서 `EBOOK`/`KIDS_BOOK`/`PAPER`/`UNKNOWN`으로 넓힘. `holding.content_type` 칸 추가. 책의 종류 = 소장 최빈 | 사용자 결정 "셋 다 넣기" (2026-09-30). 건수 KIDS_BOOK 3,003줄·UNKNOWN 391줄·PAPER 74줄 | `data-model.md`, `search-and-normalization.md` 4.6 |
| 같은 책 묶기 ④(정리한 전체 제목 + 대표 저자 + 정리한 출판사) 추가. 인계서는 "이번에 하지 않음"[안] | 사용자: "전체 제목+저자+출판사까지 같으면 합침 (추천) 이걸로 해줘". 먼저 물은 것: "판마다 전자책 내용이 달라질 수 있지 않아?" (2026-09-30) | ADR-0035, `same-book-isbn.md` 5절 |
| 묶기 ①의 번호 체계: 교보·교보 구독형·YES24 V1/V2/V3 공유, 포털 `book_idx`·강남구 `book_num`은 도서관 안. 점검 절차 dev `library-maintenance.md` 4-11, `scripts/library/check_code_spaces.py` | dev 데이터 대조(2026-09-30). 사용자: "코드 규칙은 언제든지 달라질 수 있으니 도서관 목록 확인할 때 같이 점검하는 걸로 하면 좋을거 같아 그리고 나중에 반영하고" | ADR-0035, `same-book-isbn.md` 5절 |
| 저자 나누기: 쉼표 항목마다 역할, 역할 없으면 뒤 항목 역할. 역자·번역 → TRANSLATOR, 공편·편자·편집 → EDITOR | 표본 조사 결과(사전에 없던 역할 말, 쉼표마다 역할). dev 결정 | `search-and-normalization.md` 4.1 |
| 국가서지 파일 위치 dev 저장소 안 `data/nlk/`(git 제외). 인계서 [안]은 저장소 밖 | 사용자: "이 디렉터리 내부" (2026-09-30) | `data-model.md` |
| `collected_at`이 없는 도서관(dry run 12곳)은 소장의 가장 늦은 `last_seen_at`으로 대신 | dev 결정 [이유 미확인] | `data-model.md`, `catalog-refresh.md` 4절 |
| 대표값 동수면 문자열이 작은 것 | dev 결정: 줄 순서와 상관없게 | `same-book-isbn.md` 5.2 |
| 채우지 않은 칸의 `exact`, 저자 칸 없는 `roles`는 오류 없이 무시 | dev 결정 [이유 미확인] | `api.md` |
| 소장 스트림 `targets.libraries[]`는 계획 전체가 아니라 소장이 있는 계획 도서관만 | dev 결정 [이유 미확인] | `api.md` |
| `parseDetailVerdict`(포털)를 `parseDetail`로 합침. `DetailPageFetcher`가 상세 페이지를 읽는 유일한 길. `DetailVerdictCache`는 판정 대신 `ParsedDetail`과 읽은 시각을 담음 | dev 구조 결정 [이유 미확인] | `module-map.md` |
| `AvailabilityResolver`를 한 줄짜리 페이지로 감싸지 않고 `AvailabilityResolvers.decideDetail(platformType, ParsedDetail)`·`subscription()` 추가 | dev 구조 결정 [이유 미확인] | `module-map.md` |
| `LookupTask`는 `sealed interface permits Candidate, HoldingTask`. `hostKey()` null이면 요청 없는 작업. `BatchRunner` 반복부를 제네릭 `runTasks`로, 세션은 `LaunchSession`(`BatchSession`, `HoldingSession`) | dev 구조 결정: 검색 페이지와 소장이 같은 코드를 쓰게 | `module-map.md` |
| `HoldingRef`에 원문 제목·저자·출판사 추가. `holding-result.item`의 `rank`=0, `titleKey`=`book:<bookId>` | 교보 구독형처럼 페이지를 읽지 않는 줄도 제목이 보이게 (dev) | `module-map.md`, `api.md` |
| 호스트가 다른 `detail_url`은 요청 없이 `holding-failed` `upstream_error`(502). 없는 소장·꺼진 도서관은 `library_not_found` | dev 결정 | `api.md` |
| 웹: 수집 목록 흐름은 `holdingPlan.ts`(키 `holdingId`)·`useHoldings`로 사이클 03 `useSearch`와 분리. 줄 = 도서관 × 책(`page`=bookId, `rank`=holdingId). 실패한 소장은 그 줄만 "확인 실패" | dev 구조 결정: 두 흐름이 상태를 섞지 않게 | `flows.md` |
| 웹: 바로 보기·S3에 도서관 요약 줄(`LibrarySummaryBar`) 없음(직접 찾기에만). "자격 확인된 도서관 없음" 안내도 직접 찾기에만 | 요약 줄의 기준(대출률, 도서관별 더 보기)이 상세 페이지에 없음 (dev) | `flows.md` |
| 웹: 직접 찾기 모드에서 출판일 정렬은 흐린 정렬 상자 + 이유 글(안내 줄 없음) | [확정] (사용자, 2026-09-30) | — |
| 브라우저 확인은 Playwright MCP 대신 앱 안 브라우저로 1280→768→375 | dev 사정 | — |

## 새로 알게 된 제약

- pg_bigm 1.2는 `shared_preload_libraries`(또는 `session_preload_libraries`)에 `pg_bigm`이 **필요** [확정] (공식 문서 `docs/pg_bigm_en.md`). 운영 호스팅이 허용하는지 [확인 필요: 배포].
- 국가서지 TTL 20개 7.2GB를 줄 단위로 94초, 힙 71MB. ISBN 있는 레코드 3,156,241건(research 4.2는 3,165,282: 정리 방식 차이). 인기 책은 판마다 ISBN이 달라 ③이 안 붙음 → ②로만.
- 수집 목록의 `detail_url` 호스트는 2,523,114줄 모두 `base_url` 호스트와 같았음(불일치 0).
- 강남구 상세 페이지의 본 책 블록 읽는 법, 화면 종류별 상세 형식: dev `library-maintenance.md` 12절.
- WSL은 마지막 프로세스가 끝나면 몇 초 뒤 꺼져 테스트 DB가 내려감. 테스트 전에 WSL을 켜 둘 것.
- dry run(2026-09-30 17:58): 읽은 줄 3,773,137, 건너뜀 1,217,651, 책 ① 827,614 → ② 827,614 → ③ 784,994 → ④ 648,267. ②는 새로 합친 것 없음(교보식 코드와 계산 ISBN이 1:1). ④ 합친 책 중 출판일 2년 넘게 차이 11,019권 [확인 필요: 표본].
- dev 문서 상태: `library-maintenance.md` 41~42행 표 깨짐(`CheckYes24Sites.java` 행 유실), 4-10 표에 `YES24_V3` 누락, 절 번호 순서 — 다음 인계서에서 수정 요청 (`docs/reference-index.md` 7절).

## 측정 (아직)

가져오기 요약(읽은 줄·건너뜀·묶기 단계·최종 수·시간·인덱스 크기), 6단계 응답 시간(`EXPLAIN (ANALYZE, BUFFERS)` 7개), `48090…` 코드·제목 불일치 5%·YES24 재수집 뒤 수치, AC-1~AC-14 확인표. 실행 방법은 dev `plan-feedback.md` "가져오기 실행 방법".

## 다음 사이클 후보

`docs/backlog.md` "2026-10-01 정리"에 있음. 사용자 결정(2026-10-01): 다음은 **로그인·계정(`auth`) → 내 도서관·검색 연결(`member`) → 알림**. 사이클 05 이후로 미룬 것: 주기 갱신, 정렬 옵션, 서비스에 없는 기관, 운영, 검색 품질.
