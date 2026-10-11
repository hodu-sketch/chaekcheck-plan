# 사이클 11 회고: 가져오기 따로 하기 + 가져오기 힙 줄이기 (중간 회고)

- 작성: 2026-10-12. **중간 회고**: dev가 측정(11단계: 세 묶는 방식의 실데이터 결과 비교·측정, 10~12시간)을 하는 동안, 끝난 부분(A 전부, B 구현)을 먼저 회고함 [확정] (사용자: "근데 지금 하는 건 비교라서 회고할 수 있는 건 먼저 회고해", 2026-10-12. 같은 때 `easy/2026-10-12-interim-decisions.html` #2 "측정 뒤 한 번에"를 승인했으나 이 말로 바뀜)
- 근거: dev `docs/plan-feedback.md` "# 사이클 11"(2828~2968행, 커밋 `ac26ee2`), 사용자 보고(2026-10-12). dev 코드는 대조하지 않음 [확인 필요: 최종 회고 때 `PgTools`·`ImportTransfer`·`CompactGrouping`·`SqlGrouping` 대조]
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`
- 측정 결과와 기본 방식 고르기(R-B7)는 최종 회고에서 덧붙임

## dev가 마친 범위 (중간 전달 시점, 2026-10-12 07:50)

- 0~6단계, 8단계, 9단계(`compact`), 10단계(`sql`) 구현과 테스트, 7단계 실데이터 AC 모두. 커밋 `596c40b`·`3e1baf7`·`5c85056`·`a67e107`·`af73d53`·`e3cfea4`, 모두 `./gradlew build` 통과(ModularityTests·DocumentationTests 포함, 모듈 의존 변화 없음)
- 기존 테스트(`CatalogLoadSwapTests`, `CatalogLoadBookIdTests`, `CatalogImporterTests`, `NationalBibliographyTests`)는 고치지 않고 통과. 새 테스트는 진짜 pg 도구를 씀(`db-test` 컨테이너)
- 남음: 11단계 측정, 기본값 추천

## 계획대로 된 것

- 0단계: 인기 도서 `display_order` CHECK 0..14 (ADR-0080). 로컬 `db`는 2026-09의 178·1991 분류를 지우고 다시 매김. 이 명령은 자동 권한 판단에 막혀 사용자에게 물음, 사용자: "실행해줘"
- 1단계 프로토타입 다섯 개 모두 성공(시퀀스 값, 파이프 바이너리, 암호 없이 로컬 소켓, Java가 죽었을 때 복원, manifest만 읽기)
- 7단계 A 실데이터: 내 PC 내보내기 약 26분 43초(파일 606MB) → `db-ops` 반영 4분 35초(바꿔 끼우기 0.08초, 상한 1GB에서 `OOMKilled` 없음) → 내 PC 마저 1분 28초. 반영 중 검색 실패 0
- 새 사본 `ebook-catalog-2026-10-12-0135.sqlite`(사용자: "쉬고 있음, 복사해줘"): 도서관 411(새 주소) 빠지지 않음

## 완료 기준 결과 (A)

| AC | 결과 |
|---|---|
| AC-1 | 통과. 내보내기 전후 내 PC 검색 응답 57개 같음 |
| AC-2 | 통과. 반영 뒤 운영 역할 DB의 책 1,619,668·소장 17,778,801 번호와 내용이 내 PC `catalog_next`와 모두 같음, 검색 응답 57개 같음 |
| AC-3 | 통과 (위 숫자) |
| AC-4 | 통과. 도서관 주소·연결표 한 줄·옛 파일을 하나씩 바꿔 반영 → 매번 `mismatch`, 아무것도 안 바뀜, 종료 코드 1 |
| AC-5 | 통과. 복원 도중 강제 종료 → 다음 반영이 끝까지 |
| AC-6 | 통과. 마저 뒤 두 DB 비교 값 모두 같음 |
| AC-7 | 통과. 운영 기록 한 줄에 내 PC 단계 + 반영 단계와 `export_id` |
| AC-11 | 통과. 표 칸 하나 더하면 "표 구조" `mismatch` |
| AC-12 | 통과. 기다림 상태에서 내보내기 다시 → 읽기 전에 멈춤 |
| AC-13 | 통과(1회). 복원 도중 강제 종료 → 1초 안 복원 세션 없음, 롤백, 검색 그대로 |
| AC-14 | 통과. 상한 1GB, 256MB로 색인 2분 30초 |
| AC-15 | 통과. 마저 도중 강제 종료 → 다시 돌리면 만들다 만 것부터 지우고 끝까지 |
| B 쪽 AC | 측정 뒤 (최종 회고) |

## 달라진 것과 이유

| 달라진 것 | 이유 | 처리 |
|---|---|---|
| 설정 `pg-dump-command`·`pg-restore-command` → `pg-command` 하나 | dev: 도구 이름을 앱이 붙여 둘이 늘 같음 [이유 미확인: 사용자 말 없음, 인계서상 dev가 바꿀 수 있는 [안]] | `docs/current/data-model.md` 반영 |
| `load_manifest`를 표 COMMENT에도 넣어 목차만 읽음 | 프로토타입 5: 파이프 `-Fc`는 표 데이터가 이름 순이라 manifest가 맨 뒤 → 파일 전체를 훑음. 목차만은 0.7초 | 반영 |
| `CatalogLoad.hasWaitingExport()` 추가, `discardPrepared()`는 enum | dev: 가져오기가 10분 넘게 읽은 뒤에야 멈추지 않게 | 반영 |
| `columnsHash`를 `notes`가 아닌 칸으로 | dev: `catalog`가 `notes`를 해석하지 않게 | 반영 |
| 반영·지우기 시작 때 남은 복원 세션을 끝냄 | 프로토타입 4: 입력을 파일로 넘기면 Java가 죽어도 커밋될 수 있었음 | 반영 |
| 사이클 10 웹 작업이 끝나기 전에 시작 | 사용자: "web은 건드리지 않고하다가 나중에 사이클10 디자인이 완료되면 그 때 해" | 백엔드·문서만 고치고 사이클 11 파일만 골라 커밋 |

## 새로 알게 된 것

- 책 번호 잇기(사이클 07, ADR-0062)가 다른 사본에서 처음 돎: 이어 씀 1,615,124 / 새 4,544 / 사라짐 1. 단계별 책 수 7,666,094 → 7,345,534 → 6,665,999 → 1,619,668 (사이클 12 비교 기준, `docs/research/ebook-catalog/same-book-isbn.md` 5.4절)
- 내보내기 힙 최고(풀 최고 합) 8,428MB(-Xmx 6,144MB, 상한 근사치)
- WSL 셸이 `$POSTGRES_PASSWORD`를 먼저 펼쳐 실패 → `--exec`와 로컬 소켓으로. Git Bash에서는 `/mnt/c` 인자가 바뀌어 `MSYS_NO_PATHCONV=1`
- `sql` 방식 대표값 동점은 Java `String.compareTo`로 고름(C 정렬과 UTF-16 차이 없앰). "출판일 2년 넘게 차이" 표본 순서는 `sql`에서 `current`와 다를 수 있음(개수·책에는 영향 없음)
- 디스크: 시작 78GB 여유 → 사본 뒤 62GB → `db-ops` 복사 뒤 54GB

## 사이클 13과 맞물리는 것 (dev 답, 2026-10-12)

- `load_manifest.format_version`(지금 1). 도서관 부분을 실으면 2로 올리고 옛 앱은 거절(이미 그렇게 됨)
- 지킬 것 셋: 바꿔 끼우기의 `DROP SCHEMA catalog_next`가 CASCADE 없이 돌아 더한 표는 그 전에 지워야 함 / 표 하나만 읽어도 파일 전체를 훑으므로 작은 부분은 목차(COMMENT)에 / 지금 도서관 해시는 켜진 도서관의 id·주소·화면 종류뿐, 가입 규칙은 비교에 없음
- 사이클 13 plan 세션에 보낼 글: `docs/research/maintenance/cycle13-import-file-notes-message.md` [확정] (사용자 승인, 2026-10-12, `easy/2026-10-12-interim-decisions.html` #1)

## 중간 결정 (2026-10-12, `easy/2026-10-12-interim-decisions.html`)

- #1 사이클 13 전달 글 만들기 — 승인
- #2 회고 시점 — 승인했으나 사용자 말로 바뀌어 지금 중간 회고(위 머리말)
- #3 측정에서 `compact`·`sql`이 둘 다 결과 비교를 통과하지 못하면 사이클 12에서도 `current`를 지우지 않음 — 승인 (ADR-0079 덧붙임에 반영)

## docs/current 반영 (2026-10-12)

- `data-model.md`: "따로 하기"·`load_manifest`·`collection.catalog_import` 칸·`popular` `display_order`를 구현됨으로, `load_manifest` COMMENT·`columns_hash` 칸·`pg-command`·구현에서 정한 것, "확인 필요 (사이클 11)" 결과
- `flows.md`: 흐름 27~29와 `catalog_next` 상태를 구현됨으로, 실측 숫자
- `module-map.md`: 사이클 11 구현됨, 실제 클래스 이름
- `api.md`: 머리말 상태
- 묶는 방식 기본값과 B 측정 결과는 최종 회고에서

## 남은 것 (최종 회고 때)

- 11단계 측정 결과(방식 × 여섯 관점 × 두 번, 힙 줄이기 표), 결과 비교(다른 책 0권인지), 기본값 추천과 사용자 결정(R-B7)
- 옛 사본 한 번 비교
- dev 코드 대조
