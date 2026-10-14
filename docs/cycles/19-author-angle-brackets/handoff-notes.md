# 인계서에 넣을 것 (모아 두기)

- 인계서(`handoff.md`)를 쓸 때 이 파일 내용을 옮기고 지움

## dev 사이클 18에서 온 것 (2026-10-14, dev 18 세션 → plan 19, dev 커밋 5f8403c)

- 사이클 18 A1·A2가 dev 로컬 main에 들어감. Liquibase master 끝에 `# cycle 18` `library/016` include가 있음 → 19가 changelog를 더하면 그 뒤에 둠 [확정] (dev 18 알림)
- `collection` 모듈(`CollectedCatalog`·`CatalogImporter`)은 18이 아직 건드리지 않음. 18 B(`SiteHosts`·`HoldingRowFilter` 꺼내기, 밑줄 호스트 가져오기, `exclude-candidate-libraries` 이름 바꾸기, 넣기 `no_ebooks`)는 19가 main에 들어간 뒤 새 브랜치에서 함 [확정] (dev 18 알림)
  - → 19 인계서: `exclude-candidate-libraries` 이름 바꾸기는 19에서 하지 않음(18 B가 함)
  - → 19 인계서 마지막 단계: 19가 dev main에 들어가면 dev 18 세션(chaekcheck-dev-cycle-18)에 알림
- 도서관 22곳이 꺼져 서비스 도서관 목록이 2,642곳 → 19 다시 가져오기의 책·소장 수가 사이클 12 기준값과 달라질 수 있음. 비교할 때 22곳 끈 영향과 19 규칙 영향을 나눠 봄(같은 사본·같은 도서관 목록으로 전후 dry run) [안]
