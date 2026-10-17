# 사이클 18 회고: 소장이 비었거나 덜 모인 도서관 (22곳 끄기, 밑줄 호스트, 넣기 "전자책 0권")

## 근거

- 작성 2026-10-15 (plan 쪽 회고 초안, 사용자 확인 전. 사이클 19 세션이 사용자 요청 "사이클 15,16,18이 끝난 거 같은데 회고 먼저 해줄래?"로 씀). C 단계(운영 반영)는 사이클 17 첫 배포 뒤라 아직 하지 않음. 이 회고는 A1·A2·B까지만 다룸
- dev `docs/plan-feedback.md` "# 사이클 18"(3958행~): 시작 상태·기준 수치 3962~3976행, A1 3978~4010행, A2 4013~4048행, main 합침 4050~4054행, B 4057~4078행
- dev 코드 (기본 브랜치 `main` = `a0e438a`)
  - A1 `d8513f7`~`d3e8413`, A2 `fc4eb5d`·`5f8403c` (4052행)
  - `collection/internal/SiteHosts.java`, `collection/internal/importer/HoldingRowFilter.java`·`CollectedCatalog.java`·`CatalogImportRunner.java`·`CatalogImporter.java`, `collection/internal/libraryinsert/LibraryInsertPlanner.java`·`CollectedLibraries.java`
  - `availability/internal/fetch/SiteHostNames.java`·`HostRoutingSiteFetcher.java`·`UnderscoreHostSiteFetcher.java`·`DirectSiteFetcher.java`, `availability/internal/config/AvailabilityConfiguration.java`
  - `fetch-service/.../UrlGuard.java`·`UnderscoreHosts.java`·`LibraryClient.java`
  - `db/changelog/library/016-library-disabled-cycle18.yaml`, `db.changelog-master.yaml` 96~98행, `backend/build.gradle` 52행, `fetch-service/build.gradle` 27행
  - `scripts/library/list_left_out.py` 57행, `docs/library-left-out.md`, `docs/maintenance/1-libraries.md` 111·113행, `docs/maintenance/3-import.md` 41행
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`. 사용자 말은 dev가 `plan-feedback.md`에 옮긴 것
- 덧붙임 2026-10-17 (cycle-start "close the loop" 다시 확인): dev `plan-feedback.md` "# 사이클 18" "마무리 (2026-10-15)"(4081~4085행)를 더 읽고, dev main 코드에서 위 클래스·변경 파일·설정 이름이 그대로 있는지 다시 봄(그대로). Spring Modulith Documenter 출력(`backend/build/spring-modulith-docs/components.puml`)의 모듈 의존에도 사이클 18이 더한 것 없음(설계대로 "모듈 사이 의존 없음"). 아래 "마무리" 절과 "남은 것"·"사용자에게 확인할 것"을 이 확인으로 고침

## dev가 마친 범위

- A1(22곳 끄기)·A2(밑줄 호스트 요청 길, 본 서비스와 조회 서버 앱)·B(가져오기 고침과 넣기 "전자책 0권")가 모두 main에 들어감
  - A1·A2는 2026-10-14 앞으로 감기로 합침. 사용자: "니가 다른 세션들에게 알려줄거 알려주고 main에 합쳐도 되면 합쳐" (4052행)
  - B는 `a0e438a`로 합침
- 시험: A1 `./gradlew build` 796개 (4004행), A2 backend·`fetch-service` 통과 (4039행), B `cleanTest build` 937개·건너뜀 3·실패 0 (4070행). 셋 다 `ModularityTests`·`DocumentationTests` 포함
- 원래 DB(5432)에는 `library-016`이 사이클 16 bootRun 때 적용됨. 켜진 도서관 2,664 → 2,642 (4054행)
- 2026-10-15 dev 마무리: 원래 DB(5432)에도 같은 사본으로 가져옴(기록 11번 `SUCCEEDED`, 복사본 B7과 숫자 같음, 2624 241권, AC-1 SQL 0줄), AC-4 검색 실제 확인 통과 (4083~4084행)
- C 단계(운영 반영)는 `docs/backlog.md` "사이클 18 C"로 옮김. 사용자: "운영 반영은 백로그랑 CYCLE19 PLAN에게 알려주고 이거 마무리하자" (4085행). dev 쪽 사이클 18은 끝남

## 계획대로 된 것

- 22곳 끄기: `library/016-library-disabled-cycle18.yaml`, changeset `library-016-disabled-cycle18`, author `chaekcheck`. SQL·22곳 번호는 인계서 그대로 (3980행). master 끝에 `# cycle 18` + include (96~98행). 기존 changeset은 고치지 않음
- 기록 파일: `disabled_reasons.tsv` 22줄, `gone_known.tsv`에서 44·261·269를 지움, `library-site-issues.md` 11절, `library-maintenance.md` 6-2·13절, `3-import.md` 13절 머리 줄 (3983~3987행). `library-left-out.md` B절 8 → 27곳 (3996행)
- 요청 라이브러리: Apache HttpClient 5 `httpclient5` 5.6.4(Spring Boot 4.1.1 의존성 관리가 정함), 앱마다 하나씩 (4016행)
- 밑줄 길 (인계서 [안] 이름 그대로): `SiteHostNames`, `HostRoutingSiteFetcher`(`DirectSiteFetcher` 앞, 조건 "`getHost()` null + `_`"), `UnderscoreHostSiteFetcher` (4025~4026행). SNI 없음, 인증서 이름 검사 켬, 지금 길과 같은 시간·크기 제한·`LibrarySiteTls`, redirect를 따르지 않음 (4019~4021·4027행). `HostThrottle.key`·`Candidate.hostKey`의 NPE를 없앰
- 조회 서버 앱 (ADR-0112): `UrlGuard`는 연결할 이름으로 DNS를 풀어 내부망이면 거부, 사용자 정보 거부 유지. `LibraryClient`는 같은 HttpClient 설정 (4031~4035행). 시험 `UrlGuardTests` 5개, `LibraryClientUnderscoreHostTests` 5개 (4038행)
- collection 쪽: `SiteHosts`(`host`·`httpHost`), `HoldingRowFilter.skipReason(removedAt, contentType, contentKind, detailUrl, title, libraryHost)` 판정 순서 그대로 (`HoldingRowFilter.java` 27~58행), `CollectedLibraries.importableRows(collectionId, libraryHost)`, 빠진 이유 `no_ebooks`(이유 목록 맨 끝, 묻지 않음, 종료 코드 그대로, `LibraryInsertPlanner.java` 60·118~131행)
- 옛 설정 이름 바꿈: `exclude-candidate-libraries` → `exclude-added-later-libraries` (`CatalogImportRunner.java` 67~101행, `3-import.md` 41행, 4066행)
- 넣기 절차 문서 한 줄 (`1-libraries.md` 113행), `list_left_out.py`에 `no_ebooks` 줄 (57행), 넣기 미리 보기 시험 ①②③ (`LibraryInsertCommandTests`, 4069행)

## 완료 기준 결과

| AC | 확인 방법 | 결과 |
|---|---|---|
| AC-1 켜진 0권 0곳 | AC-1 SQL, 복사본 `db`(5482) → 원래 DB(5432) | 통과: A1 뒤 2624 한 줄 → B7 뒤 0줄 (3999·4075행). 2026-10-15 원래 DB에서도 가져와 0줄 (4083행) |
| AC-2 목록 API에 22곳 없음 | `LibraryDisabledCycle18Tests` + 복사본 8086 | 통과: 2,664 → 2,642곳 (4000행) |
| AC-3 쓸 수 없는 도서관 | `MyLibraryApiTests` + 데스크톱 1280 화면 | 통과 (4001행) |
| AC-4 2624 검색·조회 | 조회: A2 실제 확인. 검색: B7 뒤 소장이 들어옴 | 조회 통과: direct·조회 서버 모드 둘 다 「1984」 보유 1·대출 0 (4041~4042행). 검색 통과 (2026-10-15, 원래 서버 8080): `GET /api/v1/books?title=1984&libraryIds=2624` 113권 중 첫 줄 책 37977 「1984 (한글판)」 `joinTier` `CHOSEN`. 화면은 같은 API라 따로 보지 않음 (4084행) |
| AC-5 `detail_url_not_http` 283 → 42 | B7 기록 11번 | 통과: −241, 2624에 241권 (4074~4075행) |
| AC-6 전자책 0권 빠짐 | `LibraryInsertCommandTests` ①②③ | 통과 (4069행) |
| AC-7 `library-site-issues.md` 22곳 | 문서 11절 | 통과. 북큐브 8곳은 권수 원문 없이 메뉴 이름만, 교보 112·168은 수집 DB 근거 (3992~3993행) |
| AC-8 운영 DB 0곳 | — | 하지 않음: C 단계와 함께 `docs/backlog.md` "사이클 18 C"로 옮김 (사용자, 2026-10-15) |

| 측정 | plan 값 | dev 값 |
|---|---|---|
| 목록 API 도서관 수 (기준) | 2,658 | 2,664 (사이클 13 넣기 6곳 차이, 3975행) |
| 켜진 0권 (기준) | 22곳 | 22줄 = 21곳 + 2624. 261은 옛 수집분 80권이 있어 SQL에 안 나옴 (3974행) |
| B7 가져오기 | — | 기록 11번, 31분. 책 +1, 소장 +161. `kind_audiobook` −4,972 → `library_not_in_service` +5,052. 2624 말고는 판정이 바뀐 줄 없음 (4073~4074행) |
| 넣기 미리 보기 `no_ebooks` | — | 0. 새 곳이 0이라 줄 세기 시간은 재지 못함 (4076행) |
| 현대제철 시제품 | — | 2건: `/` 200 1,396ms, 검색 200 821ms (4018행) |

## 달라진 것과 이유

| # | 달라진 것 | 이유 (사용자 말, 없으면 [이유 미확인]) | 처리 |
|---|---|---|---|
| 1 | B를 사이클 19보다 먼저 함 (계획: 19 뒤) | 사용자: "근데 19는 너 다음인데 너가 알아서 마무리하고 이어서 19가 하도록 해야 하는 거 아니야?" → "18 B 지금", "결과만 19에게 잘 알려줘", "너는 마무리 할 수 있으면 빨리 마무리하고" (4059행) | `docs/current` 반영, 사이클 19 `handoff-notes.md` |
| 2 | B7: dry run 전·후 비교 대신 진짜 가져오기 기록 11번을 같은 사본의 10번 기록과 비교 | 사용자 "빨리 마무리"를 dev가 이유로 듦 (4072행). 비교를 뺀 것은 dev 판단 [이유 미확인] | 2624 말고는 바뀐 판정이 없음을 확인 (4074행). 회고 결정 |
| 3 | B7은 복사본 `db`(5482)에서만 함. 원래 DB(5432)에는 2624 241권이 없었음 | [이유 미확인] — 인계서가 쓴 "내 PC"를 dev가 복사본으로 함 | 회고 결정 #13(19 다시 가져오기에 맡김)은 그 뒤 앞당겨 풀림: 2026-10-15 dev가 원래 DB에서 가져옴. 사용자: "이거 하자" (4083행) |
| 16 | C 단계(운영 반영, AC-8)를 하지 않고 backlog로 옮김 (계획: 사이클 17 첫 배포 뒤 이 사이클에서) | 사용자: "운영 반영은 백로그랑 CYCLE19 PLAN에게 알려주고 이거 마무리하자" (4085행) | `docs/backlog.md` "사이클 18 C", 사이클 19 `handoff-notes.md` 46~47행, `docs/current` 표시 고침 (2026-10-17) |
| 4 | 새 설정 이름 `exclude-added-later-libraries` / Java `excludeAddedLaterLibraries`, 건너뜀 이유 `library_excluded_added_later`, 로그 `added-later libraries excluded: N`, 상수 `EXCLUDED_ADDED_LATER` | 이름은 dev가 정함 (사이클 13 회고 결정 #14). "added later"는 코드에 이미 있던 `Library.addedLater()`와 같은 말 (4066행) | `docs/current` 반영 |
| 5 | 인계서 B5가 적은 `FIRST_CANDIDATE_ID`는 코드에 없었음(사이클 13에서 이미 `FIRST_COLLECTED_ONLY_ID`). 주석만 고침 | plan 인계서가 옛 이름을 적은 실수 | 새로 알게 된 제약 |
| 6 | `no_ebooks` 검사를 규칙 파일 오류 검사(`library_kinds`·`final_origins`) 앞에 둠 | 인계서가 dev에게 맡김 [안] (handoff 256행). dev 까닭: 0권 곳 때문에 규칙 파일 오류로 멈추지 않게 (4067행) | `docs/current`, ADR-0110 결과 메모 |
| 7 | 인증서 이름 검사를 JDK 기본이 아니라 HttpClient `DefaultHostnameVerifier`(`HostnameVerificationPolicy.CLIENT`)로 | [이유 미확인] — dev 판단. JDK `HostnameChecker`가 밑줄 이름을 거절하므로 검사를 끄지 않는 유일한 길 (4020행). C3 4번 "검사를 끄지 않음"은 지킴 | ADR-0111 결과 메모, `docs/current` |
| 8 | 밑줄 길에서 자동 재시도·쿠키·압축(`Accept-Encoding`)을 끔. `via=direct-underscore`. 지금 길은 `unsupported URI`를 ERROR로, 로그 status `bad-uri` (4027~4029행, `DirectSiteFetcher.java` 81행) | `via` 값은 인계서 [안] 중 dev가 고름. 나머지는 [이유 미확인] | `docs/current` |
| 9 | 어댑터는 `AladinV1Adapter.detailUri` 한 줄만 고침(`fromUri` → `fromUriString`). 나머지 8개는 고칠 것 없음 (4022·4030행) | 시제품 결과 | 반영 없음 |
| 10 | A1 사이트 확인 때 교보 112·168에 곳마다 2건을 보냄 (지시는 1건) | [이유 미확인] (3993행) | 기록만 |
| 11 | A2 실제 확인에서 지역 없이 검색 스트림을 불러 다른 도서관 21곳에 1건씩 요청이 나감. 그중 교보 구독형 서버 2건(`hallalib`·`libgen.dkyobobook.co.kr`)은 C6 "요청하지 않음"을 어김 | [이유 미확인] — dev 실수 (4043행) | 회고 결정 |
| 12 | 인계서에 없던 문서 고침: `1-libraries.md`·`2-crawl.md`·`rules/README.md`의 `gone_known` 글, `list_left_out.py`가 보고서 값과 지금 파일이 다르면 알림, `--report`는 사이클 13 뒤 최근 보고서 `b2174dfd426d` (3988·3997~3998행) | [이유 미확인] — dev 판단. 옛 보고서는 "새로 넣는 곳 6곳"이 나와 지금 서비스와 맞지 않음 | reference-index |
| 13 | `library-maintenance.md` 6-2 표에 사이클 07에서 끈 135·2194·2198 줄이 원래 없고 이번에도 더하지 않음 (4009행) | [이유 미확인] | 회고 결정 |
| 14 | 261(군포)은 서비스에 80권이 있어 AC-1 SQL로는 0권이 아니지만 목록대로 끔 (4010행) | 인계서 22곳 [확정] | 새로 알게 된 제약 |
| 15 | 개발 환경: worktree `../chaekcheck-dev-c18`·`-c18-a2`, docker `chaekcheck-c18`(5482~5484)·`-c18b`(5493), 서버 8086·8088, 조회 서버 8087, 웹 5180 (3964~3965·4015행) | 사용자: "실제 확인은 dev가 시험 계정으로(본 서비스 + 조회 서버 앱)" (3968행) | 반영 없음 |

## 새로 알게 된 제약

- 밑줄 호스트와 JDK (4019~4023행) [확정] (dev 시제품, 2026-10-14): `URI.getHost()`가 null, JDK `HttpRequest.newBuilder`는 `unsupported URI`, JDK HTTPS 이름 검사(`HostnameChecker`)는 `SNIHostName`으로 바꾸다 실패, JDK는 밑줄 이름에 SNI를 빼고 보냄 → 이름 검사는 HttpClient 쪽 검사로만 켤 수 있음. 처음 터지는 자리는 `Candidate.hostKey` → `HostThrottle.key`의 NPE
- Spring `UriComponentsBuilder`: `fromUriString`·`.host(String)`은 밑줄을 받지만 `fromUri(URI)`는 `getHost()`를 써서 호스트를 잃음 (4030행)
- registry-based authority: `getRawUserInfo()`가 null이라 `user@` 검사가 그냥 지나감 → 조회 서버 `UrlGuard`는 authority의 `@`를 따로 봄 (4033행)
- AC-1 SQL의 빈틈: 사이트를 옮겼는데 옛 수집분 소장이 남은 곳(261)은 0권으로 안 잡힘 (3974행)
- 사이트 원문: 북큐브 첫 화면 HTML에는 권수가 없음, 교보 112·168 첫 화면은 스크립트로 넘기고 그다음 302 (3992~3993행)
- 실제 확인은 도서관 하나만 부르는 API로: 지역 없는 `ebook-searches/stream`은 계획에 전체 도서관이 들어가 다른 사이트(교보 구독형 포함)에도 요청이 나감 (4043행)
- 가져오기를 복사본에서 하면 원래 DB는 그대로: 첫 배포 데이터에 2624 책을 넣으려면 원래 DB에서 다시 가져와야 함 → 2026-10-15 원래 DB에서 다시 가져와 풀림 (4083행). 같은 사본·같은 판이면 복사본과 원래 DB 결과 숫자가 모두 같았음(약 27분)
- 인계서가 옛 코드 이름을 적음(`FIRST_CANDIDATE_ID`, 4066행): 사이클 13 회고 뒤 이름을 다시 읽지 않았음
- "나중에 더한 도서관" 수는 2,370 (기록 11번, 4073행). 회고 때 `3-import.md`·`CatalogImportRunner.java`는 "약 2,394"였으나 2026-10-17 dev main에서는 둘 다 2,370으로 고쳐져 있음(`3-import.md` 43행, `CatalogImportRunner.java` 71·121행)
- 사이클 17 나가는 길(ADR-0095)은 아직 밑줄 길 두 곳(`UnderscoreHostSiteFetcher`, `LibraryClient` 밑줄 갈래)에 없음. 17이 합칠 때 적용해야 함. 프록시는 `HttpClients.custom().setProxy`/`setRoutePlanner`로 [확인 필요: 17 합칠 때] (4045행)

## 남은 것 (이 사이클 밖으로 옮김)

- C 단계는 이 사이클에서 하지 않음. `docs/backlog.md` "사이클 18 C: 운영 서버 반영"으로 옮김 (사용자: "운영 반영은 백로그랑 CYCLE19 PLAN에게 알려주고 이거 마무리하자", 2026-10-15). 할 일은 그 줄과 `handoff.md` C절 그대로: 운영 판에 `016`이 들어갔는지 → 보통 반영(ADR-0078) → 운영 DB에서 AC-1 SQL (AC-8), 운영 목록 API에 22곳이 없는지. 원래 DB에 2624 241권이 이미 있으므로 첫 배포 데이터에 함께 들어가면 AC-8 확인만 남음
- 사이클 17이 밑줄 길 두 곳에 ADR-0095 나가는 길·IP별 셈·User-Agent를 적용 (17 몫, 4045·4053행). 2026-10-17 dev main에는 아직 없음(`setProxy`·`setRoutePlanner` 없음)
- 운영 반영을 하면 그 사이클(17 또는 19의 운영 반영)이 dev `plan-feedback.md`에 결과를 적고, 그 회고가 AC-8을 적음

## 다음 사이클 후보

- 사이클 17: 밑줄 길 두 곳에 나가는 길 적용(이미 알림 받음). 2624 책은 원래 DB에 있으므로 첫 배포 데이터에 함께 들어감
- 사이클 19: 18 B가 꺼낸 `SiteHosts`·`HoldingRowFilter`·새 설정 이름 위에서 시작, 비교 기준 = 원래 DB 기록 11번 (사이클 19 `handoff-notes.md` 47행)
- backlog "사이클 18 C": 운영 반영과 AC-8 (사용자, 2026-10-15)
- 다음 새 도서관 넣기 때: `no_ebooks` 줄 세기 시간 재기 (이번 사본은 새 곳 0), 그 미리 보기 보고서로 `library-left-out.md` 다시 만들기 (지금 파일은 2026-10-14 A1 때 사이클 13 보고서로 만든 것)
- dev 문서 작은 일: "약 2,394" → 2,370과 6-2 표의 135·2194·2198 줄은 2026-10-17 dev main에서 이미 고쳐져 있음(`library-maintenance.md` 561~563행). 남은 것 없음
- backlog: 나머지 `detail_url_not_http` 42줄 원인, 교보 구독형 서버를 다른 IP에서 다시 받기

## 회고 결정 (2026-10-15, 결정 페이지 `docs/cycles/19-author-angle-brackets/easy/2026-10-15-retro-15-16-18-decisions.html` #11~#15, 모두 사용자 승인)

| # | 결정 | 반영 |
|---|---|---|
| 11 | 실제 확인 때 다른 도서관 요청이 나간 것은 기록하고, 다음 인계서 공통 제약에 "도서관 하나만 부르는 주소로" [확정] | 사이클 19 `handoff-notes.md` |
| 12 | 가져오기 기록 비교로 충분, 미리 돌려 보기 다시 안 함 [확정] | — |
| 13 | 현대제철 241권은 사이클 19 다시 가져오기에 맡김, 19 완료 기준에 확인 한 줄 [확정] | 사이클 19 `handoff-notes.md`·`to-cycle-17.md`. 그 뒤 2026-10-15 dev 18이 원래 DB에서 먼저 가져와 끝남(사용자 "이거 하자", 4083행). 19 완료 기준의 확인 한 줄은 그대로 둬도 됨(다시 가져온 뒤에도 241권이 남는지 보는 것) |
| 14 | dev 6-2 표에 135·2194·2198 줄을 다음 인계서 "dev에 알릴 것"에 [확정] | 사이클 19 `handoff-notes.md` |
| 15 | ADR 0110~0112 "결과"에 실제 이름·방법 덧붙임 [확정] | ADR-0110·0111·0112 |

## 사용자에게 확인할 것 (2026-10-17 다시 확인)

- 없음. 위 `[이유 미확인]` 줄(#2·#3·#7·#8·#10~#13)은 2026-10-15 회고 결정 #11~#15에서 모두 처리됨. 그 뒤 생긴 변화(원래 DB 가져오기, C를 backlog로)는 사용자 말이 dev `plan-feedback.md` 4083·4085행에 있어 따로 물을 것이 없음
- 구조 차이도 없음: 새 표·칸·API·모듈 의존 없음(Documenter 출력 확인), 이름은 ADR-0110~0112 "결과" 메모(회고 결정 #15)와 같음. ADR을 바꿀 일 없음
