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

## 최종 회고 (2026-10-14)

- 근거: dev `docs/plan-feedback.md` "# 사이클 11" "11단계 중간 전달 2"(2970~3016행), "11단계 최종"(3018~3111행), "사용자 결정: 기본 방식과 옛 방식 이름"(3113~3148행). 커밋 `15fbe80`(중간 전달 2), `4a8d242`(11단계 결과), `11ed991`(기본 `compact`, 이름 `objects`), `a647e0d`·`40766aa`(옵션 측정), `df2750b`·`affe8dd`(측정 보고 HTML). 사이클 12 병합 `3182918`과 함께 main에 있음
- 위 "남은 것" 세 항목을 닫음. 이유는 사용자의 말만, 없으면 `[이유 미확인]`

### 11단계 측정 결과 (같은 새 사본, 같은 PC, 하나씩, 2026-10-12 18:21 끝, 실행 23번) [확정] (dev 측정)

| 방식 | 끝까지 된 가장 작은 힙 | 그때 전체 시간 | 6GB 힙 최고 MB | 살아 있는 데이터 MB | Java CPU s | DB CPU s | temp GB | DB 최대 GB | 검색 p95 ms |
|---|---|---|---|---|---|---|---|---|---|
| `current`(지금 이름 `objects`) | 6GB (4GB는 첫 읽기 중 OOM) | 26:25~27:49 | 8,432~8,460 | 5,013~5,016 | 3,072~3,154 | 892~951 | 21.4 | 19.4~20.8 | 460~490 |
| `current` + `UseCompactObjectHeaders`·`UseStringDeduplication` | 4GB (3GB OOM) | 30:58 | 8,612~8,630 | 3,666~3,671 | 1,745~1,851 | 808~847 | 21.2 | 18.9~19.6 | 453~459 |
| `compact` | 2GB (1GB OOM) | 21:17 | 2,907~2,925 | 1,357~1,358 (Remark 뒤) | 1,001~1,014 | 690~715 | 21.0 | 19.0~20.9 | 399~420 |
| `sql` | 1GB (인계서의 가장 작은 단계, 더 아래 안 잼) | 33:49 | 666~742 | 297~302 (Remark 뒤) | 1,244~1,286 | 1,638~1,820 | 61.0~61.2 | 25.2~27.5 | 389~449 |

- 6GB는 두 번씩(위 범위), 힙 줄이기는 6 → 4 → 3 → 2 → 1GB에서 처음 실패한 값에서 멈춤. 모든 실행에서 검색 5xx 0, 내보내기 파일 약 606MB (dev 3022~3054행)
- `sql`은 힙 대신 DB에 짐을 옮김: 실행마다 임시 쓰기 약 61GB(그중 묶기 약 40GB), DB 최대 약 27GB(시작 약 9GB). 실데이터 사슬 반복 수는 로그에 남기지 않음 [확인 필요: 다음에 `sql`로 가져올 때 로그에 남길지 — 기본이 아니라 급하지 않음] (dev 3105행)
- 추가 측정 `compact` + 두 Java 옵션(사용자 요청 "응 재봐줘"): 1GB는 여전히 OOM, 2GB는 메모리 약 2% 감소·Java CPU 979 → 1,731초. 결론 `compact`에는 옵션을 붙이지 않음. 2GB 실행이 36분 42초로 길었던 것은 같은 PC의 테스트·빌드가 겹친 탓으로 봄(dev 판단, 3125~3148행)

### 결과 비교 (AC-8, AC-9) — 통과 [확정]

- dry run 셋 끝까지(18:16 / 26:31 / 29:24). `compare_grouping.py dryrun`: `current` 대 `compact`, `current` 대 `sql` 모두 책 1,619,668줄·소장 17,778,801줄 차이 0
- 내보내기 번호: `current` 두 번끼리, `current` 대 `current`+옵션·`compact`·`sql` 모두 책·소장 번호와 내용 차이 0. 힙 줄이기에서 끝까지 된 실행(`sql` 1GB, `compact` 2GB, `current`+옵션 4GB)도 차이 0 (dev 2976~2979·3031행)
- 사이클 12 새 규칙에서도 세 방식이 같음(사이클 12 AC-6, `../12-grouping-rules/retro.md`)

### 기본 방식 고르기 (R-B7)

- dev가 R-B7 기준(결과 비교 통과 + 43분 안 + 힙이 가장 작은 것)을 그대로 적용한 추천은 `sql`(1GB, 약 34분). 함께 보인 맞바꿈: `sql`은 DB 임시 쓰기 약 61GB·DB CPU 약 2배, `compact`는 2GB로 가장 빠름(약 21분), 사이클 12 규칙 변경은 `sql`이 고칠 곳이 가장 많음 (dev 3072~3081행)
- **사용자 결정: 기본 = `compact`, 세 방식 모두 남김** [확정] (사용자: "기본 방식은 compact로 해줘 그리고 sql이나 다른 방법들도 구현에 남겨둬 선택해서 할 수 있게 해줘", 2026-10-12 19:20, dev 3115행). R-B7 기준 그대로의 결과(`sql`)와 다름 — 기준과 다르게 고른 까닭은 [이유 미확인] (결정 전에 위 맞바꿈과 결과 페이지를 보았음)
- **옛 방식 이름 `current` → `objects`** [확정] (사용자: "옛 방식 이름을 current가 아니라 다른 걸로 해야 할 것 같은데 normal이라던가 아니면 날짜를 붙이던가" → 선택지 objects / normal / v2026-10 / classic 중 `objects`, dev 3119행). 설정 값 `current`는 이제 시작 전에 거절, 클래스 이름 `BookGrouping`은 그대로
- 인계서와 다름: 인계서는 "기본 방식 바꾸기는 사용자 결정 뒤 다음 사이클"이었으나 사용자가 지금 바꾸라고 해 사이클 11에서 바꿈 (dev 3117행)
- ADR-0079 덧붙임("사이클 12에서 `current` 지움")과 다름 → 사이클 12 회고의 새 ADR 초안에 함께 적음 → ADR-0105 (Accepted, 2026-10-14)

### 옛 사본 한 번 (사이클 08 #3c와 비교) [확정] (dev 3056~3070행)

- 같은 사본 `ebook-catalog-2026-10-05-0745.sqlite`, `current` 6GB 내보내기: 단계별 책 수 7,601,958 → 7,281,398 → 6,613,296 → 1,615,125, #3c와 같음. 묶기 결과 같음
- 시간 24분 51초(#3c 약 33분) — 내보내기는 색인·통계·바꿔 끼우기를 하지 않고(내 PC `finish`에서 따로 약 1분 30초), 같은 날 PC 부하 차이도 있음. 같은 방식 비교는 새 사본 표로 봄. 살아 있는 데이터 4,978MB(#3c 최대 약 4.8GB)
- 책 번호 kept 1,615,124 / new 1 / dropped 4,544 — 내 PC `catalog`가 이미 새 사본이라 거꾸로 맞대진 것

### 완료 기준 (최종) [확정] (dev 3083~3101행)

- AC-1~AC-7, AC-11~AC-15 통과(위 중간 회고 표), AC-8·AC-9 통과(위), AC-10 측정 표(위)
- `./gradlew build` 통과(`ModularityTests`·`DocumentationTests` 포함), 이미 적용된 changeset은 바뀌지 않음(예외: 0단계 `popular/001` CHECK — 인계서 C2의 예외 그대로)

### dev 코드 대조 (2026-10-14, main = 사이클 11·12·13·14 병합 뒤)

- `catalog.internal.PgTools`: 복원 세션 이름 `RESTORE_APPLICATION = "chaekcheck-restore"`(23행), 덤프 연결 이름 `chaekcheck-dump`(50행) — 설계·중간 회고와 같음
- `catalog.internal.JdbcCatalogLoad`: 시작 때 남은 복원 세션 `pg_terminate_backend`(257행), `hasWaitingExport()`(242행), 설정이 없으면 "Set chaekcheck.catalog.load.pg-command"(277행). **`FORMAT_VERSION = 2`**(76행) — 사이클 13 ADR-0086(반영 파일 판 2)으로 올라간 값이라 사이클 11 기준(1)과 다름. 판이 다른 파일은 거절(`Manifests` 207~210행)
- `catalog.internal.Manifests`: `load_manifest` 칸 목록(36행, `format_version`…), 같은 줄을 `COMMENT ON TABLE catalog_next.load_manifest`로도 넣고 목차에서 읽음(154·181~184행) — 중간 회고와 같음
- `catalog.CatalogLoad`: `hasWaitingExport()`(88행), `enum Discarded`(94행) — 중간 회고와 같음
- `collection…importer.ImportTransfer`: 모드 `export`(126행)·`apply`(154행)·`finish`(213행, 실패하면 기록 줄 없음)·기다리는 새 표 확인(234행). `apply`에 사이클 13의 도서관 부분(`LibraryPart`, 134·162행)이 더해짐 — 사이클 11 설계 위에 사이클 13이 얹은 것
- `CatalogImportRunner`: `GROUPINGS = objects, compact, sql`(51행), 기본 `compact`(78행), 방식 고르기 `objects → BookGrouping`, `compact → CompactGrouping`, `sql → SqlGrouping`(146~151행)
- `CompactGrouping`·`SqlGrouping`·`BookGrouping`: 셋 다 사이클 12 규칙(`SameTextKey`·`SubtitleParts`)을 부름. `SqlGrouping` 임시 표 `grp_*`(127~552행)
- Spring Modulith `module-collection.puml`: `Collection → Catalog`, `Collection → Library` — 모듈 관계 변화 없음
- 설계와 다른 점은 중간 회고 표 그대로, 더할 것은 위 `format_version` 2(사이클 13)와 기본·이름(위)뿐

### 남은 정리 (사이클 밖, 사용자 PC)

- dev `.claude/worktrees/`의 9·10단계 작업 폴더 둘, compose `db-ops` 볼륨 `db-ops-data` 약 9GB, 결과 파일 `data/cycle11/m` 약 4GB와 덤프 둘 1.2GB — git 밖이라 지워도 된다고 dev가 적음 (dev 3106~3111행). 지울지는 사용자가 정함
- → 결정 (2026-10-14, 회고 결정 #25): 이 약 14GB(작업 폴더 둘, `db-ops-data` 볼륨 약 9GB, 결과 파일 약 4GB, 덤프 둘 1.2GB)는 다음 dev 세션에서 dev가 지움. 사이클 13 백업 dev `data/cycle13/`은 지우지 않음(회고 결정 #20). plan은 dev 파일을 지울 수 없어 다음 인계서로 전함 [확정] (사용자 승인, 2026-10-14)

### docs/current 반영 (최종)

- 사이클 12 회고와 함께 적용: `retro/current-delta-12.md`(scratchpad). 사이클 11 부분은 "중간 회고 2026-10-12" 표시를 "회고 2026-10-14"로, `grouping` 값과 이름(`compact` 기본·`objects`·`sql`), 남아 있던 "설계됨(미구현, 사이클 11)" 줄(`module-map.md`·`data-model.md`·`flows.md` 머리 줄, `module-map.md` `collection` 줄 일부, `data-model.md` `export_id`·`exported_at` 칸), 힙 값, "확인 필요 (사이클 11)"의 `sql` 줄
