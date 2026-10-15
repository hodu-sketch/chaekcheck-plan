# 인계서에 넣을 것 (모아 두기)

- 인계서(`handoff.md`)를 쓸 때 이 파일 내용을 옮기고 지움

## dev 사이클 18에서 온 것 (2026-10-14, dev 18 세션 → plan 19, dev 커밋 5f8403c)

- 사이클 18 A1·A2가 dev 로컬 main에 들어감. Liquibase master 끝에 `# cycle 18` `library/016` include가 있음 → 19가 changelog를 더하면 그 뒤에 둠 [확정] (dev 18 알림)
- `collection` 모듈(`CollectedCatalog`·`CatalogImporter`)은 18이 아직 건드리지 않음. 18 B(`SiteHosts`·`HoldingRowFilter` 꺼내기, 밑줄 호스트 가져오기, `exclude-candidate-libraries` 이름 바꾸기, 넣기 `no_ebooks`)는 19가 main에 들어간 뒤 새 브랜치에서 함 [확정] (dev 18 알림)
  - → 19 인계서: `exclude-candidate-libraries` 이름 바꾸기는 19에서 하지 않음(18 B가 함)
  - ~~19가 dev main에 들어가면 dev 18에 알림~~ → 아래 순서 바뀜으로 필요 없음

## 순서 바뀜 (2026-10-14, dev 18 세션 → plan 19)

- 사용자 결정: 사이클 18 B를 19보다 **먼저** 지금 개발해 main에 합침 (사용자: "근데 19는 너 다음인데 너가 알아서 마무리하고 이어서 19가 하도록 해야 하는 거 아니야?" → "18 B 지금") [확정]
- → 19 인계서: 19는 18 B가 들어간 main 위에서 시작. `collection` 가져오기 코드가 바뀜 — `CollectedCatalog.skipReason`이 `HoldingRowFilter`(`collection/internal/importer`)로, 호스트 읽기가 `SiteHosts`(`collection/internal`)로 빠짐(이름은 확정되면 dev 18이 다시 알림). 설정 `chaekcheck.collection.import.exclude-candidate-libraries` 이름도 18 B에서 바뀜
- 18 B 끝에 내 PC 가져오기를 한 번 함(2026-10-12 사본). 19의 다시 가져오기는 그 뒤 따로 → 19 비교 기준값은 사이클 12 숫자가 아니라 **18 B 가져오기 결과**로 잡는 안 [안]
- 18 B가 main에 들어가면 dev 18이 plan 19에 알림

## 18 B가 dev main에 들어감 (2026-10-14, dev 커밋 a0e438a, dev 18 세션 → plan 19)

- 19 dev는 a0e438a 위에서 시작 [확정] (dev 18 알림)
- 가져오기 코드: 줄 거르기 `HoldingRowFilter.skipReason(removedAt, contentType, contentKind, detailUrl, title, libraryHost)` (`collection/internal/importer`), 호스트 읽기 `SiteHosts.host`/`httpHost` (`collection/internal`). 판정 순서·결과는 그대로이고 밑줄 호스트만 이제 읽음. 가져올 줄 고르기는 `CollectedLibraries.importableRows`, 설정의 Java 이름 `excludeAddedLaterLibraries` (plan 18 알림)
- 설정 이름 바뀜(끝남): `exclude-candidate-libraries` → `exclude-added-later-libraries`, 건너뜀 이유 `library_excluded_added_later` → 19 인계서의 할 일 아님
- 넣기 명령에 새 빠진 이유 `no_ebooks`("전자책 0권", 맨 끝)
- Liquibase: 18 B는 changeset을 더하지 않음. master 끝은 18 `library/016` → 16 → 15 `usagelog/001` → **19 changeset은 그 뒤**
- 18 가져오기는 **복사본 DB에서만** 함(2026-10-12 사본, `detail_url_not_http` 283→42, 2624 도서관 241권). 원래 DB(5432)에는 아직 안 들어감 → 19가 원래 DB에 다시 가져오면 2624 책도 함께 들어감. 19 결과를 견줄 때 18 B 복사본 결과를 기준으로 하면 19 규칙 영향만 볼 수 있음(결정 페이지 #8)
- 도서관 22곳 꺼짐(목록 2,642곳)
- "19가 main에 들어가면 dev 18에 알림"은 필요 없음

- 도서관 22곳이 꺼져 서비스 도서관 목록이 2,642곳 → 19 다시 가져오기의 책·소장 수가 사이클 12 기준값과 달라질 수 있음. 비교할 때 22곳 끈 영향과 19 규칙 영향을 나눠 봄(같은 사본·같은 도서관 목록으로 전후 dry run) [안]

## 회고에서 온 것 (2026-10-15, 사이클 15·16·18 회고 결정, 사용자 승인)

- 완료 기준에 더함: 다시 가져온 뒤 현대제철(2624) 소장 241권이 원래 DB에 있는지 확인 (18 회고 결정 #13)
- 공통 제약에 더함: 실제 사이트 확인은 도서관 하나만 부르는 주소(`/availability/libraries/{id}/ebooks`)로. 지역 없는 검색 스트림은 다른 도서관(교보 구독형 포함)에도 요청을 보냄 (18 회고 결정 #11)
- dev에 알릴 것:
  - main에서 `./gradlew build` 뒤 Spring Modulith `Documenter` 출력(`build/spring-modulith-docs/`)을 새로 만들어 `usagelog`·`sitecontent`·`picks` 그림 확인 (15 회고 결정 #6)
  - dev `library-maintenance.md` 6-2 "꺼 둔 도서관" 표에 사이클 07에서 끈 135 전라북도교육청통합도서관·2194 장안대학교 (YES24)·2198 성균관대학교 (YES24) 세 줄 더하기 (18 회고 결정 #14)
- 따로 하는 작은 일 (사이클 15 쪽): `usagelog.library_response_daily`에 칸 `cached_count integer NOT NULL DEFAULT 0 CHECK (cached_count >= 0)`를 더하고, 3분 캐시에서 답을 꺼낼 때마다 1(응답 시간·성공/실패 수에는 넣지 않음). 지금은 `BatchRunner.answered`가 캐시 답이면 바로 빠짐(dev `BatchRunner.java` 334~338행), 도서관별 더 보기(`LibraryEbookController.java` 96행)도 같음. 사용 기록 쪽 새 변경 파일(지금 master 마지막 `usagelog/001` 뒤) [확정] (사용자 제안 2026-10-15, 모양·때 사용자 승인 2026-10-15 회고 이어서 #2). 칸 이름은 [안]
- dev 문서 고칠 것 [확정] (사용자 승인, 2026-10-15, 확인 결과 결정 #9): dev `docs/maintenance/3-import.md` 32·34·177행과 `backend/build.gradle` 74행의 가져오기 메모리 안내 `-PbootRunXmx=6g` → 기본 `compact`는 2GB로 충분(6GB는 `objects` 방식만, ADR-0105). `3-import.md` 41행과 `CatalogImportRunner` 오류 문구의 "약 2,394곳" → 2,370 (가져오기 기록 11번, dev `plan-feedback.md` 4073행)

## dev 18 마무리 알림 (2026-10-15)

- dev가 원래 DB(5432)에 같은 사본(2026-10-12)으로 가져오기를 돌리는 중 → 현대제철 241권이 원래 DB에도 들어감. 19 다시 가져오기는 그 위에서. 끝나면 dev 18이 결과를 다시 알림
- → 19 비교 기준: 이 원래 DB 가져오기 결과(같은 사본·같은 도서관 목록·18 B 코드)를 그대로 기준으로 씀 (확인 결과 결정 #8 "18 B 가져오기 결과"와 같은 뜻, 복사본 대신 원래 DB)
- 사이클 18 C 운영 반영은 backlog로 (사용자 지시). 19의 운영 반영(첫 배포 전)과 함께 끝날 수 있음
- **끝남 (2026-10-15, dev 18 알림)**: 원래 DB(5432) 가져오기 기록 11번 SUCCEEDED(2026-10-12 사본, main `a0e438a` 판). 2624 241권 들어감, 켜진 0권 도서관 0곳, `detail_url_not_http` 42. **19 dev는 이 DB와 dev main `0a75f7a`(GitHub에도 올림) 위에서 시작**. 19 비교 기준 = 이 기록 11번 결과. 사이클 18 C(운영 반영)는 backlog에 있음

## 설계 결정에서 온 것 (2026-10-15)

- dev 문서에 더할 것 (설계 결정 #10, 사용자 요청): `docs/maintenance/2-crawl.md`·`docs/maintenance/platforms.md` 통합 포털 절에 "목록 `div.info` 칸 순서가 사이트마다 다름, 출판사가 먼저인 포털 = 경기도교육청·대구·전북교육청(`PUBLISHER_FIRST_PORTAL_HOSTS`)"과, **수집 전 점검 목록에 "포털 새 책 목록 한 쪽을 열어 칸 순서가 상수와 맞는지 확인"** 한 줄
- 규칙 줄 지우기 전 검증 (설계 결정 #5, 사용자 요청): `swap_before` 뒤 사본에서 가져오기가 멈추면, 그 사본으로 세 도서관의 저자·출판사 비율 검사(plan `research.md` 실험 (d))를 다시 돌려 바르게 들어왔을 때만 `author_publisher_swapped.tsv` 줄을 지움. 아직 뒤바뀌었으면 수집기·사이트를 다시 봄. 이 절차를 dev `docs/maintenance/3-import.md`에 적음

## 사이클 21에서 온 것 (2026-10-15, `from-cycle-21-matching.md`)

- dev 순서: 사이클 21을 먼저 개발, 19는 그 뒤 [확정] (사용자: "순서는 안 중요해 이거 먼저 할거야", 2026-10-15, 21 범위 결정 #8) → 19 dev는 21이 들어간 main 위에서 시작. 19 명세 "일정"(공개일 2026-10-18 전 반영, 늦으면 공개일 미룸)과 맞물림 → 사용자에게 확인 [확인 필요: 사용자]
- 21의 세 추천 목록(이동진 추천도서, 사서 추천도서, 서울대 100선)이 사서추천과 같은 맞추기(ISBN → 본제목 + 첫 저자 `name_exact`)를 씀 → 19가 `Contributors`·`name_exact`를 바꾸면 맞춘 수가 바뀜. `BookChoice`가 보유량 기준으로 바뀜(AC-14를 잴 때 그 규칙 기준)
- 내 PC `export` 파일에 추천 목록 표가 더해짐 → 19가 가져오기 코드를 고칠 때 같은 길
- AC-14에 더하자는 제안 [안]: 반영 뒤 이동진 추천도서(지금 44권 중 36권)·서울대 100선(100권 중 87권)도 다시 잼 → 사용자에게 물음

## 설계 이어서에서 온 것 (2026-10-15)

- **19를 21과 나란히 개발** [확정] (사용자: "나란히 개발할래", 설계 이어서 #3). 작업 폴더·docker 묶음·포트는 사이클 14 방식(dev 옆 작업 폴더 `c19`, docker 묶음 `chaekcheck-c19`, 겹치지 않는 포트) [안: 값은 dev가 정해 보고]. 겹치는 곳: `collection` 가져오기(21의 추천 목록 표·`BookChoice`, 19의 규칙 파일·묶기), `catalog` 맞추기(`name_exact`). 나중에 main에 들어가는 쪽이 rebase로 풂. 다시 가져오기·운영 역할 반영은 둘 다 들어간 main으로 한 번 [안]
- AC-14: 반영 뒤 사서추천·이동진 추천도서·서울대 100선 맞춘 수 다시 잼 [확정] (설계 이어서 #2)
- ADR-0117: dev `docs/maintenance/rules-index.md` 만들기, 상수 주석, 수집·가져오기 시작 점검 [확정] (설계 이어서 #1)

