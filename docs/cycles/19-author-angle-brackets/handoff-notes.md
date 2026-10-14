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
- 가져오기 코드: 줄 거르기 `HoldingRowFilter.skipReason(removedAt, contentType, contentKind, detailUrl, title, libraryHost)` (`collection/internal/importer`), 호스트 읽기 `SiteHosts.host`/`httpHost` (`collection/internal`). 판정 순서·결과는 그대로이고 밑줄 호스트만 이제 읽음
- 설정 이름 바뀜(끝남): `exclude-candidate-libraries` → `exclude-added-later-libraries`, 건너뜀 이유 `library_excluded_added_later` → 19 인계서의 할 일 아님
- 넣기 명령에 새 빠진 이유 `no_ebooks`("전자책 0권", 맨 끝)
- Liquibase: 18 B는 changeset을 더하지 않음. master 끝은 18 `library/016` → 16 → 15 `usagelog/001` → **19 changeset은 그 뒤**
- 18 가져오기는 **복사본 DB에서만** 함(2026-10-12 사본, `detail_url_not_http` 283→42, 2624 도서관 241권). 원래 DB(5432)에는 아직 안 들어감 → 19가 원래 DB에 다시 가져오면 2624 책도 함께 들어감. 19 결과를 견줄 때 18 B 복사본 결과를 기준으로 하면 19 규칙 영향만 볼 수 있음(결정 페이지 #8)
- 도서관 22곳 꺼짐(목록 2,642곳)
- "19가 main에 들어가면 dev 18에 알림"은 필요 없음

- 도서관 22곳이 꺼져 서비스 도서관 목록이 2,642곳 → 19 다시 가져오기의 책·소장 수가 사이클 12 기준값과 달라질 수 있음. 비교할 때 22곳 끈 영향과 19 규칙 영향을 나눠 봄(같은 사본·같은 도서관 목록으로 전후 dry run) [안]
