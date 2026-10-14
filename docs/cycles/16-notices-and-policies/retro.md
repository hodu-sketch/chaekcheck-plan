# 사이클 16 회고: 공지사항과 안내·약관 페이지를 DB로 (새 모듈 `sitecontent`)

## 근거

- 작성 2026-10-15 (plan 쪽 회고 초안, 사용자 확인 전. 사이클 19 세션이 사용자 요청 "사이클 15,16,18이 끝난 거 같은데 회고 먼저 해줄래?"로 씀)
- dev `docs/plan-feedback.md` "# 사이클 16"(4080~4212행): 시작 상태 4084~4092행, 사용자 결정 4094~4098행, 정한 이름 4100~4110행, 달라진 점 4112~4138행, 운영 SQL 4140~4153행, nginx 4155~4157행, 화면 확인 4159~4165행, 사용자 폰 4167~4175행, main 합침 4177~4183행, AC 확인표 4185~4201행, [확인 필요] 결과 4203~4212행
- dev 코드: 합친 커밋 `7ca62d3`(사이클 18 A1·A2 `5f8403c` 위로 rebase, fast-forward), 정리 커밋 `5b9c69b`(c16 launch 설정·작업 폴더·docker 묶음 지움). 지금 main = `a0e438a`(15·18 B까지). 커밋 번호는 dev `.git/logs/HEAD` 221·229행
  - 백엔드: `backend/src/main/java/com/chaekcheck/sitecontent/**`(13개 파일), `auth/package-info.java` 9~10행, `auth/internal/signup/SignupService.java` 21·57~59행, `db/changelog/sitecontent/001-sitecontent-schema.yaml`, `002-sitecontent-seed.yaml`, `auth/002-consent-version-number.yaml`, `db.changelog-master.yaml` 100~108행
  - 시험: `ModularityTests.java` 23·28·45~52행, `DocumentationTests.java` 33행
  - 웹: `web/src/main.tsx` 55~59행, `components/Footer.tsx` 15행, `features/notices/*`, `package.json` 19행(`react-markdown` ^10.1.0)
  - 배포: `deploy/nginx/chaekcheck-locations.conf` 115~117행, `deploy/nginx/README.md` 30행
- Spring Modulith `Documenter` 출력: dev `backend/build/spring-modulith-docs/`는 옛 빌드 결과(`module-popular.*`만 있고 `picks`·`sitecontent`·`usagelog` 없음). `DocumentationTests.java:33`이 `module-sitecontent.puml`을 검사하므로 main에서 새로 빌드하면 생김. 그림 대조는 `package-info.java`와 `ModularityTests`로 대신함
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`. 사용자 말은 dev가 `plan-feedback.md`에 옮긴 것

## dev가 마친 범위

- 인계서 단계 전부와 AC-1~13 통과 (4185~4201행)
- 시험 (rebase 뒤): `./gradlew build` 865개 실패 0, 웹 `npm test` 410개, `build`·`lint` 통과 (4179행)
- 운영 SQL 초안 1~6절을 c16 개발 DB에서 실행. 고친 문장 없음, "줄 수를 보고 확정하기"를 더함 (4142~4151행)
- 사용자 실제 폰 확인 (Samsung Internet, c16 웹 5179, 2026-10-14) 뒤 합침 (4167~4179행)
- 원래 `db`(5432)에 main으로 `bootRun`: `sitecontent-001-*` 넷, `sitecontent-002-*` 넷, `auth-002-consent-version-number` 적용, 테스트 계정 동의 값 2줄 `'2026-10-04'` → `'1'`. 이때 사이클 18 `library-016`도 처음 적용(켜진 도서관 2,664 → 2,642) (4180~4181행)
- 남은 것: 가입·로그인을 실제 카카오로는 확인하지 않음(사용자 결정, 4097·4182행). 서비스 안내 기준일 줄은 실제 화면에서 보지 못함(c16 DB에 조사 값이 없음, 4165·4198행)

## 계획대로 된 것

- **새 모듈 `sitecontent`**: `@ApplicationModule(allowedDependencies = {})` (dev `sitecontent/package-info.java` 15행). 공개 타입 `SiteDocuments.currentVersion(ConsentDocument) → int`, `ConsentDocument { TERMS_OF_SERVICE, PRIVACY_COLLECTION }` — 인계서 이름 그대로 (4102행). 이벤트 없음
- **의존**: `auth → sitecontent` 하나 (`ModularityTests.java:28`). `sitecontent`는 의존 없음, 다른 모듈은 `sitecontent`를 쓰지 않음 (같은 파일 45~52행)
- **스키마** `sitecontent`: 표 셋과 칸·PK·FK·CHECK 이름이 design-delta "데이터"와 같음 (dev `001-sitecontent-schema.yaml` 9~77행). 둘째 동의문 CHECK 이름만 dev가 정함(아래 #2)
- **Liquibase**: 새 파일만 더함. master 순서 `# cycle 18` 다음에 16의 세 줄, 그 뒤 15 `usagelog/001` (master 96~112행)
- **auth**: 서버 설정 `chaekcheck.auth.documents`, `DocumentVersionsMatchWebTests`, 웹 `legalText.ts`·`documentVersions.json`·`NOT_REVIEWED`를 지움. 409 `document_version_mismatch` 동작은 그대로
- **REST**: `GET /api/v1/notices`, `/api/v1/notices/{noticeId}`, `/api/v1/documents/{documentKey}`. 응답 칸·404 코드 셋·400 `validation_error`가 design-delta와 같음 (4116~4123행)
- **웹**: S16 `/notices`, S17 `/notices/:noticeId` (dev `main.tsx` 58~59행). `/privacy`의 `LoginOnly`를 지움(ADR-0100). `/terms`는 로그인 기능이 켜져 있을 때만. 바닥글 링크 넷, "문의: 준비 중" 없음
- **nginx**: 화면 주소 정규식에 `notices|notices/[0-9]+` (dev `chaekcheck-locations.conf` 117행), 로컬 nginx로 200 확인 (4157행)
- **AC-6**: `<script>`·`<img onerror>`는 글자로만, `javascript:` 링크는 `href`가 빈 값 (4162·4171행)

## 완료 기준 결과

dev AC 확인표(`plan-feedback.md` 4187~4201행) 그대로.

| AC | 확인 방법 | 결과 |
|---|---|---|
| AC-1 새 공지 → 목록 맨 위(고정 다음) | `NoticeApiTests`, `NoticesPage.test`, 운영 SQL 1절 + Playwright | 통과 |
| AC-2 서비스 안내 새 판, 옛 판 적용 기간·"이전 버전" | `DocumentApiTests`, `VersionPicker.test`·`AboutPage.test`, Playwright | 통과 |
| AC-3 오늘 시행 약관 판 2로 가입 → 동의 기록 2 | `SignupTests.newTermsVersionInEffectTodayIsRecorded` | 통과(서버 시험만, 실제 카카오 가입은 안 함) |
| AC-4 앞날 판은 그날 전까지 안 나옴 | `SiteDocumentsTests`, `DocumentApiTests`, `NoticeApiTests`, `SignupTests`, 운영 SQL 4절 | 통과 |
| AC-5 숨긴 공지 | `NoticeApiTests`, `NoticePage.test`, 운영 SQL 3절 | 통과 |
| AC-6 스크립트·`javascript:` 실행 안 됨 | `Markdown.test`, Playwright + 사용자 폰 | 통과 |
| AC-7 바닥글 넷, 로그인 꺼짐이면 이용약관만 빠짐 | `Footer.test`, `LegalPage.test`, Playwright 켬·끔 | 통과 |
| AC-8 "검토 전 문구" 없음 | `LegalPage.test`, `SignupPage.test`, `web/src` 검색 0건 | 통과 |
| AC-9 없는 판 → "찾을 수 없어요" | API 시험 + Vitest + Playwright `/privacy?version=99` | 통과 |
| AC-10 서비스 안내 기준일 줄 | `AboutPage.test` | 통과(화면에서는 줄이 빠진 상태만 봄) |
| AC-11 "바뀐 점 보기" | `DocumentApiTests`, `ChangeSummary.test`, Playwright | 통과 |
| AC-12 이메일 → 메일 쓰기 | seed 시험, `Markdown.test`, Playwright | 통과 |
| AC-13 목록에 고친 날 없음, 글에서 보임 | `NoticeApiTests`, Vitest, Playwright | 통과 |

[확인 필요] 결과 (4205~4212행): `react-markdown` 10.1.0은 React 19.3과 경고 없이 설치, JS gzip 170.28 → 208.23 kB(+38) / seed의 `$$`·세미콜론은 `$$` + `splitStatements: false`로 그대로 들어감 / 폰 날짜 고르기 칸은 Samsung Internet에서 아래 라디오 목록 + "완료" / 15와 병합은 16이 먼저

## 달라진 것과 이유

| # | 달라진 것 | 이유 (사용자 말, 없으면 [이유 미확인]) | 처리 |
|---|---|---|---|
| 1 | 빈 제목·본문 CHECK `btrim(x) <> ''` → `btrim(x, E' \t\r\n') <> ''` (셋 다, dev `001-sitecontent-schema.yaml` 45·46·65행) | [이유 미확인] — dev 판단([안] 범위). dev가 적은 까닭: 줄바꿈만 있는 본문이 통과함 (4114행) | `data-model.md` 고침 |
| 2 | 동의문 4항목 CHECK 이름 `document_version_consent_items_shape_check` (74~76행) | [이유 미확인] — 이름 없던 CHECK여서 dev가 정함 (4106행) | `data-model.md` 고침 |
| 3 | 처리방침 1·2절의 표 → 같은 내용의 목록 | 사용자: 질문 "처리방침 표"에서 "표를 목록으로 바꿈"을 고름 (2026-10-14, 4098행). `react-markdown`만으로는 표를 그리지 못함 | `drafts/privacy-policy.md` 고침(plan `7fecd9f`). spec R3-3 "바뀌기 전·후 표"와 맞지 않음 → 회고 결정 |
| 4 | 가입 화면은 가짜 응답으로만 확인, 실제 카카오 로그인 없음 | 사용자: "지금은 일단 가짜응답으로만확인" (4097행) | AC-3은 서버 시험이 근거 → 회고 결정 |
| 5 | 공지 판: 코드는 그대로, 운영으로 "공지는 보통 고치지 않음. 꼭 고칠 때만 새 판, 아니면 숨기고 새 공지" (dev `docs/maintenance/5-sitecontent.md` 2절) | 사용자: "근데 어짜피 기능 공유해서 이런거니까 공지 판 있는 설정으로 안 쓰면 되는거아닌가?" (4174행) | `flows.md` 흐름 41 메모. 기능을 줄일지는 회고 결정 |
| 6 | 마크다운 그리는 요소를 `allowedElements` h1~h6·p·ul·ol·li·strong·a로 제한, 나머지는 글자만 (4127행) | [이유 미확인] — dev 판단. spec R1-2 "제목, 문단, 목록, 굵게, 링크"와 같은 범위 | `module-map.md` 웹 줄 |
| 7 | API 세부 (dev [안], 4117~4123행): 정수 아님 → 400 `validation_error` `code` `typeMismatch`, 1 미만 `Min`, int 범위 초과 `Max`(`noticeId`도) / 공지 0개 → `page` 1, `items` [] / 고정 공지 순서 = 일반과 같음 / 옛 판의 `title`은 그 판 제목, `editedOn`은 지금 판 기준 / 오류 응답에 `type` 없음(Spring 기본) | [이유 미확인] — dev 판단 | `api.md` |
| 8 | 웹 세부 (dev [안], 4128~4136행): "목록으로"는 보던 쪽으로 / 404 링크 글 "지금 버전 보기"·"공지 목록 보기" / 5xx·끊김은 1초 뒤 한 번 더 읽고 "글을 불러오지 못했어요" / 틀린 `?page=`는 1쪽 / 쪽 번호 PC 10개·폰 5개 묶음 / 가입은 두 글을 읽는 동안 잠금 + 회색 줄 | [이유 미확인] — dev(웹 에이전트) 판단 | `flows.md` 흐름 38·40 메모 |
| 9 | `auth/package-info.java`에 `allowedDependencies`를 적지 않고 Javadoc만 고침 (4124행) | [이유 미확인] — dev가 적은 까닭: `SignupService`가 로그인 켬에서만 생김 | `module-map.md` auth 줄 메모 |
| 10 | `Today` 부품이 `Clock` 빈을 대신함 (4105행) | [이유 미확인] — dev가 적은 까닭: 이름이 다른 `Clock` 빈이 여럿이라 형으로 주입하면 겹침 | 새로 알게 된 제약 |
| 11 | 운영 SQL에 "줄 수를 보고 확정하기"(`\gset` + `\if :ok COMMIT \else ROLLBACK`)를 더함 (4151행) | [이유 미확인] — dev가 적은 까닭: psql에 파일을 한 번에 넣으면 `COMMIT;`까지 멈추지 않음 | `drafts/ops-sql.md`·`flows.md` 흐름 41 |
| 12 | seed 처리방침 첫 줄 "이 문서는 검토 전 자리 글입니다…", 동의문 라벨은 지금 웹 그대로 (4115행) | 인계서대로(개발 seed는 지금 웹 글). 공개 전 seed 바꾸기는 사이클 17 | 반영 없음 |
| 13 | 작업 환경: 작업 폴더 `../chaekcheck-dev-c16`, DB 5472·5473, 서버 8085, 웹 5179. 합친 뒤 지움(`5b9c69b`) | 사용자: 폰 확인을 "c16에서 먼저 폰 확인"으로 고름 (4169행) | 반영 없음 |

dev 코드 대조에서 plan이 찾은 것

- plan `to-cycle-17.md` 1항은 "main에 합침 `5b9c69b`"라고 적었으나 합친 커밋은 `7ca62d3`, `5b9c69b`는 정리 커밋 (dev `.git/logs/HEAD` 221·229행)
- `plan-feedback.md` 4183행 "c16 작업 폴더·docker 묶음은 아직 지우지 않음"은 그 뒤 `5b9c69b`에서 지워짐
- `npm audit` high 1건(`source-map-js`)은 react-markdown 전부터 있던 것 (4138행) → 회고 결정

## 새로 알게 된 제약

- `react-markdown`만으로는 표를 그리지 않음(`remark-gfm` 필요). 지금 그리는 요소: 제목·문단·목록·굵게·링크. 기울임·코드·인용·표·그림은 글자로만 (4098·4127행) [확정] (dev 구현 시험, 2026-10-14). 운영 글(처리방침, "바뀐 점")에 표를 쓰면 `|`가 그대로 보임
- PostgreSQL `btrim(x)`는 공백만 지움. 줄바꿈·탭까지 지우려면 `btrim(x, E' \t\r\n')` (4114행)
- 앱에 이름이 다른 `Clock` 빈이 여럿(`picksClock` 등) → 새 모듈은 형으로 `Clock`을 주입하지 못함 (4105행)
- 트랜잭션 관리자가 JPA라 nested 트랜잭션을 못 씀 → 제약 위반을 이어서 시험할 때는 SQL `SAVEPOINT` (4124행)
- psql 파일 실행은 `COMMIT;`까지 멈추지 않음 → `\gset` + `\if`로 줄 수를 보고 확정 (4151행)
- 이 PC의 WSL psql은 한국어 오류가 깨짐 → `SET lc_messages = 'C'` (4153행)
- 카카오 콘솔에 작업 폴더 웹 포트의 돌아올 주소가 없음 → 작업 폴더에서는 실제 카카오 로그인을 못 함 (4097행)
- Samsung Internet의 `<select>`는 아래에서 올라오는 라디오 목록으로 열림 (4170행) [확정] (사용자 폰, 2026-10-14)
- 한 사이클의 `bootRun`이 먼저 합친 다른 사이클의 changeset도 원래 DB에 적용함(16 실행 때 18 `library/016`) (4180행)
- main의 Documenter 출력은 main에서 빌드를 새로 해야 바뀜: 작업 폴더에서 빌드한 결과는 main `build/`에 남지 않음

## 다음 사이클 후보

- 공개 전 seed 바꾸기(검토한 글, 처리방침은 목록 모양, 시행일 2026-10-18), 운영 DB 계정 권한(`sitecontent.notice_id_seq` USAGE), 첫 공지 — 이미 사이클 17(`to-cycle-17.md`)
- 다시 동의 화면 — 이미 backlog
- 글 화면만 늦게 불러와 묶음 크기 줄이기(+38 kB gzip) — 회고 결정
- 공지 판 기능 줄이기 — 회고 결정
- 표가 필요해지면 `remark-gfm` — 회고 결정

## 회고 결정 (2026-10-15, 결정 페이지 `docs/cycles/19-author-angle-brackets/easy/2026-10-15-retro-15-16-18-decisions.html` #7~#10)

| # | 결정 | 반영 |
|---|---|---|
| 7 | "바뀐 점"도 목록으로(표 안 됨), 코드 그대로 [확정] (사용자 승인) | spec R3-3, `drafts/ops-sql.md`, ADR-0098 덧붙임, `docs/current` |
| 8 | 공지 판 기능은 줄이지 않고 운영 규칙만 [확정] (사용자 승인) | `docs/current` |
| 9 | 화면 파일 +38kB·`npm audit` 경고 — 사용자 질문 "보통 이정도 크기야?" (답: HTTP Archive 2024 중앙값 폰 558KB보다 작음). 결정 기다림 | 결정 페이지에 답 |
| 10 | 실제 카카오 가입·안내 기준일 줄은 첫 배포 뒤 확인 [확정] (사용자 승인) | `to-cycle-17.md` 6항 |

- 달라진 것 #1·#2·#7·#8·#11(btrim, CHECK 이름, API·웹 세부, 운영 SQL 방식)은 회고 페이지에서 묻지 않아 [안]으로 남음 → 이어서 묻기
