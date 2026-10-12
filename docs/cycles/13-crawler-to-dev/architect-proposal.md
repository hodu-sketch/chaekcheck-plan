# 설계 제안: 사이클 13 수집기 (architect, 2026-10-12)

- `architect` 서브에이전트가 dev 코드(2026-10-12)를 읽고 낸 제안
- 사용자 결정은 이 대화의 묻기 창으로 받음(폰에서 진행, 캔버스 안 씀)
- 결과는 `design-delta.md`에 씀

## 현재 상태 (dev 코드 확인, 2026-10-12)

- `library`
  - 공개 API `LibraryCatalog`는 읽기만 있음. `Library.java` "Java never saves a library"
  - 표는 `library.library`, `eligibility_rule`. seed로 IDENTITY `RESTART WITH 2675`
- `collection`
  - 공개 API 없음. `allowedDependencies` = `catalog`, `catalog :: normalize`, `library`
  - `collection-import` 프로필의 `CatalogImportRunner`
  - `JdbcCollectionLinks`는 짝 표를 읽기만 함
  - `ImportTransfer`·`DatabaseFingerprint`는 도서관·짝 해시를 manifest `notes`에 실음
- `catalog`
  - `Manifests.create`가 `load_manifest` 줄을 `row_to_json`으로 **표 COMMENT**에 넣음, `parse`는 목차만 읽음
  - `FORMAT_VERSION = 1`, 판이 다르면 거절
- Liquibase 마지막: `library/014`, `collection/005`. `PRE_DEPLOYMENT` 표시 있음
- 웹 `AboutPage.tsx`: 고정 글

## 결정 1: 도서관 번호를 누가 정하나 (공개 API 모양)

- **A안**: `collection`이 번호까지 정해 묶음으로 넘김
  - API: `LibraryRegistry.add(List<NewLibrary>)`(번호 포함, 넣은 뒤 IDENTITY를 올림), `nextId()` = `GREATEST(max(id), 시퀀스) + 1`
  - 장점: 미리 보기에 실제 번호가 나오고, 보고서 해시가 늘 같고, 운영 반영도 같은 번호로 넣어 도서관 해시가 맞음
  - 단점: 호출자가 번호 규칙을 알아야 함(`nextId()` 한 곳에만 둠)
  - 되돌리는 비용 낮음
- **B안**: 하나씩 넣고 IDENTITY가 번호를 줌
  - 미리 보기 번호가 예상에 그침
  - 운영 반영에 번호를 넘기는 길이 또 필요
- 추천 A [안]
- 공통
  - `add`는 호출자 트랜잭션 안에서만 돎(`Propagation.MANDATORY`)
  - 같은 번호가 있으면 실패
  - `library.internal`에서 JDBC INSERT
  - 제약은 지금 DB CHECK·UNIQUE에 맡김

## 결정 2: 규칙 파일 위치와 꼴

- **A안**: `scripts/library/rules/`에 TSV를 하나씩 둠, 지역은 번호로 미리 풀어 둠
  - 파일: `name_overrides`, `same_site`, `demo_or_closed`, `same_host_kept`, `scope_overrides`, `public_join`(지역 번호·요약 칸 더함), `library_kinds`, `kyobo_probe`, `bookcube_volume`, `final_origins`, `join_surveyed_on.txt`
  - 장점: 옛 스크립트와 새 명령이 같은 파일을 읽어 결과 비교(AC-6)가 정확, `collection`이 `region`에 의존하지 않음
  - 단점: 새 가입 조사 줄의 지역 번호는 Python 도우미로 채움
- **B안**: `backend/src/main/resources`에 YAML 하나
  - Python 비교 도구가 읽기 어렵고, 고칠 때마다 다시 빌드
- **C안**: A처럼 두되 지역 이름 그대로, Java가 이름을 품
  - 이름이 겹치는 지역(중구 등) 푸는 규칙을 옮겨야 해 결과가 달라질 위험
- 추천 A [안]. 명령은 `rules-dir` 설정으로 폴더를 받음

## 결정 3: 반영 파일에서 도서관 부분을 실을 자리

- **A안**: `load_manifest.notes` JSON에 `libraryPart`를 더함
  - 이미 표 COMMENT에 들어가므로 [확정] "표 COMMENT"를 따름
  - 새 표가 없어 "바꿔 끼우기 전에 지움"이 `load_manifest` 지우기로 끝남
  - `catalog`는 `FORMAT_VERSION` 2만 바꿈
- **B안**: `catalog_next.library_part` 표 + COMMENT
  - `collection`이 `catalog` 스키마에 표를 만들어 모듈 경계를 어김
- 추천 A [안]

## 결정 4: `collection.catalog_import.candidate_library_count` 칸 (AC-11)

- **A안**: 새 changeset에서 `RENAME COLUMN` → `other_library_count`, Java 이름도 바꿈
- **B안**: 그대로 두고 AC-11 예외에 적음
- 추천 A [안]

## 넣기 명령·보고서·API·반영 파일·스크립트 초안

- 넣기 명령
  - 프로필 `library-insert`
  - 설정 `chaekcheck.collection.library-insert.*`: `mode` preview|insert, `sqlite-path`, `rules-dir`, `report-dir`, `report-id`
- 보고서
  - 정규화 JSON(만든 시각 제외), 번호 = SHA-256 앞 12자리
  - 파일 `library-insert-<id>.json`
- 종료 코드: 0 정상, 1 규칙 오류(보고서 없음), 2 같은 호스트 의심, 3 순번 2 이상, 4 보고서와 다름
- 넣기: 한 트랜잭션에서 `pg_advisory_xact_lock` → `add` → `collection_link` → `library_insert_run` 성공 줄. 제약 위반이면 되돌리고 FAILED 줄
- 표 `collection.library_insert_run`
  - 칸: `id`, `report_id`, `ran_at`, `snapshot`, `inserted_count`, `join_surveyed_on`, `status`, `failure_detail`, `payload jsonb`
  - CHECK와 부분 UNIQUE(성공한 `report_id`)
- API `GET /api/v1/join-survey` → `{"surveyedOn":"2026-10-05"|null}`
  - `/libraries`에 싣지 않음: 의존 고리, 874KB 목록
- 반영 판 2
  - export는 성공한 넣기 기록을 모두 `notes.libraryPart`에 실음
  - apply는 한 트랜잭션에서 도서관 부분 넣기(같은 줄은 건너뜀) → 지문 비교 → 다르면 되돌림, 같으면 커밋 → 복원·바꿔 끼우기
- Liquibase
  - `collection/006-library-insert-run.yaml`(+ 결정 4 RENAME)
  - `library/015-library-name-1215.yaml`
- 스크립트
  - `crawl_catalog.py`: `vendor` 칸 + `migrate`, 새 명령 `refill-pubdt`
  - 도구 옮기기
  - 이름 바꾸기: `build_library_seed.py`, `name_libraries()`, `scripts/library/discover/`, `LibrarySeedTests`

(Mermaid 그림 초안은 `design-delta.md` "구조 그림"에 옮김)

## 확인 필요 (architect)

- 순번 2 이상을 그대로 넣고 싶을 때 푸는 방법 (지금은 이름 바꾸기 파일로만)
- 새 곳의 최종 주소가 `final_origins`에 없을 때
- "바뀐 곳" 비교에서 최종 주소·이름 바꾸기를 먼저 적용해야 소음이 없음
- COMMENT 한 줄이 길어져도 `Manifests.parse`가 맞게 읽는지
- 판 2 배포 때 내 PC에 판 1 내보내기가 기다리면 `finish` 거절
- 사이클 12와 겹치는 곳: `CatalogImportRunner.GROUPINGS`, `ImportReport`
- 기준일 파일 대신 조사 파일 날짜 칸에서 뽑을지
- 이름 [안]: 프로필, 설정, 표, 칸, 경로, 명령
