# 설계 제안: 사이클 16 공지사항과 안내·약관 페이지를 DB로

작성: architect 서브에이전트 (2026-10-13). 결정 페이지: `easy/2026-10-13-design-decisions.html`. 사용자가 정한 뒤 `design-delta.md`로 옮김.

읽은 것: plan `scope.md`·`spec.md`·`flow.md`·`research.md`, `docs/current/` module-map·data-model(auth)·api / dev `CLAUDE.md`, 스킬 spring-modulith·postgres-patterns·jpa-patterns·api-design / dev 코드 `auth/package-info.java`, `SignupService.java`, `SignupController.java`, `AuthProperties.java`, `SecurityConfiguration.java`, `ConditionalOnAuthEnabled.java`, `application.yml`, `auth/001-auth-schema.yaml`, `web/src/main.tsx`, `LegalPage.tsx`, `legalText.ts`, `documentVersions.json`, `LoginOnly.tsx`, `Footer.tsx`, `AboutPage.tsx`. 새로 확인할 외부 사실 없음.

## 결정 결과 (2026-10-13, `easy/2026-10-13-design-decisions.html`)

| 페이지 # | 내용 | 결과 |
|---|---|---|
| 1 | 모듈 이름 `sitecontent` | [확정] (사용자 승인, 2026-10-13) |
| 2 | 표 구조(공지 표 둘 + 문서 버전 표 하나) | [확정] (사용자 승인, 2026-10-13, 예시·ERD·읽는 방법 답 뒤). 공지 `hidden` 칸은 빼기로 승인(2026-10-13, "어짜피 리퀴베이스에 기록되니 그렇게 하자") — 운영 SQL은 Liquibase에 기록되지 않음을 바로잡고 다시 확인 중 |
| 3 | 동의 기록 = 버전 순번 | [확정] (사용자 승인, 2026-10-13) |
| 4 | 4항목 = `consent_items jsonb` 4개 | [확정] (사용자 승인, 2026-10-13). 덧붙임: "지금은 일단 카카오만 로그인해서 카카오 로그인만 표시좀.." → 첫 버전 동의문·처리방침 문구의 로그인 수단은 카카오만 적음 [확정] (사이클 17도 첫 배포는 카카오 로그인만 켬 [확정]) |
| 5 | 로그인 꺼짐 때 약관 창구는 열고 화면만 숨김 | [확정] (사용자 승인, 2026-10-13) |
| 6 | 운영 DB는 검토한 글부터 | [확정] (사용자 승인, 2026-10-13). 시행일은 7번 결정을 따름 |
| 7 | 처리방침 v1 시행일 2026-10-04 | 미승인 → 사용자 제안 [확정]: "이거 아직 외부인에게 공개 안 되어서(지인들하고만 공개) 그냥 내가 외부 내가 모르는 사람들에게도 공개할 때 그 날짜로 다 맞춰줘 이것말고도 전부". 공지·서비스 안내·이용약관·처리방침·동의문의 운영 첫 버전 시행일 = **모르는 사람에게도 공개하는 날**(첫 배포일이 아님). 개발 DB의 자리 글 날짜(2026-10-04)는 개발용 |
| 8 | 오늘 = 한국 시간, 지금 버전 = 시행된 것 중 순번 최대, 역순 금지는 예시 SQL | [확정] (사용자 승인, 2026-10-13) |
| 9 | 고정 공지는 1쪽 위에만, 셈에서 뺌 | [확정] (사용자 승인, 2026-10-13). 조사 뒤 낸 "고정 빼기"는 미승인 — "음..  보기 어려워" (`easy/2026-10-13-drop-decisions.html`) |
| 10 | 적용 기간 문구 | [확정] (사용자 승인, 2026-10-13) |
| 11 | `reconsent_required` | 칸을 지금은 만들지 않음 [확정] (사용자 승인, 2026-10-13, `easy/2026-10-13-drop-decisions.html`; 질문 "아직 기능이 다시 동의 필요가 없지 않나?"). 다시 동의 화면을 만들 때 함께 더함 |
| 12 | 주소·오류 이름 | [확정] (사용자 승인, 2026-10-13) |

## 지금 상태 (dev 코드, 2026-10-13)

- 글은 모두 웹 코드(`legalText.ts`, `AboutPage.tsx`). 바닥글 "문의: 준비 중"
- 문서 버전 원본은 서버 설정 `chaekcheck.auth.documents.*` = `"2026-10-04"`(`YYYY-MM-DD` 검사). 웹 `documentVersions.json`과 같은지 테스트(C27)
- 가입: `SignupService.documents()`/`check()`가 버전 문자열 비교, 다르면 409 `document_version_mismatch`
- `auth.account_consent.document_version`: `text NULL`, CHECK, UNIQUE NULLS NOT DISTINCT `(account_id, consent_type, document_version)`
- `auth`는 다른 모듈에 의존하지 않음(`package-info.java` AC-18). 로그인을 켜도 `/api/v1/me/**`만 막고 나머지 `permitAll`
- 웹 `/terms`, `/privacy`, `/signup`은 `LoginOnly`로 감쌈. `features/auth/NoticeContext`·`NoticeBar`가 이미 "notice" 이름을 씀
- Liquibase `PRE_DEPLOYMENT` 파일 있음

## 결정 1: 새 모듈 이름
- A `sitecontent` (스키마 같은 이름): 공지·안내·약관을 다 담는 뜻, 사이클 15 `usagelog`·웹 `NoticeContext`와 안 겹침 / 조금 김
- B `notice`: 짧음 / 약관까지 담기엔 좁고 `NoticeContext`와 헷갈림
- C `content`: 짧음 / 책 내용(catalog)과 헷갈림
- 추천 A [안]

## 결정 2: 표 구조
- A 공지 표 둘(`notice`, `notice_version`) + 문서 버전 표 하나(`document_version`, key = ABOUT·TERMS_OF_SERVICE·PRIVACY_POLICY·PRIVACY_COLLECTION): 공지 번호가 1부터, 종류별 칸 규칙을 CHECK로, 문서 넣기 SQL 한 줄 / 읽기 SQL 두 벌
- B 일반화 `document` + `document_version`: 읽기 코드 하나 / 공지 번호가 5부터, 종류별 칸 규칙을 CHECK로 못 검, 넣을 때 부모 id 찾기
- 추천 A [안]

## 결정 3: 동의 기록(`auth.account_consent.document_version`)에 남길 값
- A 버전 순번 글자(`'1'`): 새 changeset `auth/002-consent-version-number.yaml`로 테스트 사용자 `'2026-10-04'` → `'1'`, 형식 CHECK 추가. 가입 API `version`은 계속 문자열 / 기록만 보고는 날짜 모름
- B 시행일 그대로: 변경 없음 / 같은 날 두 버전이면 어느 글인지 모름(R2-2와 어긋남)
- C 버전 표의 내부 id: 유일 / 주소·화면과 다른 값, 환경마다 다를 수 있음
- 추천 A [안]

## 결정 4: 동의문 4항목(S6 표) 저장
- A `document_version.consent_items jsonb`(동의문만 필수, 정확히 4개): 화면 그대로, 칸 하나
- B 칸 4개: 동의문만 쓰는 칸 4개
- C 본문 마크다운 표: `remark-gfm` 필요, S6 배치 바뀜
- 추천 A [안]

## 결정 5: 로그인 기능이 꺼졌을 때 이용약관 API
- A API는 늘 열고 웹 경로 `/terms`만 숨김: `sitecontent`가 `auth`를 몰라도 됨, 순환 의존 없음 / 주소를 직접 부르면 약관 글이 보임(공개 글)
- B 설정 이름 문자열로 컨트롤러를 끔(404): 다른 모듈 설정 이름에 묶임
- 추천 A [안]

## 결정 6: 첫 버전 넣기와 실제 배포
- 공통: 첫 버전은 Liquibase seed(`sitecontent/002-sitecontent-seed.yaml`, `sql` + `$$` + `splitStatements: false`). 그 뒤는 SQL
- A 첫 배포 직전에 seed의 v1을 "검토한 글 + 시행일 = 배포일"로 바꿈(`PRE_DEPLOYMENT` 동안 허용), 로컬 DB 초기화·테스트 사용자 재가입. 운영에 자리 글이 이전 버전으로 남지 않음
- B 자리 글 v1(2026-10-04)을 운영에도 두고 검토한 글을 v2로: 운영 이전 버전 칸에 자리 글이 영구히 남음
- 추천 A [안]. spec R2-3("검토 문구는 그 뒤 새 버전")을 dev 기간에 한정하는 해석이라 사용자 확인 필요

## 작은 결정
- 7 "오늘" = `Asia/Seoul`(앱이 날짜를 넘김, DB `current_date` 안 씀). 지금 버전 = 시행일 ≤ 오늘 중 순번 최대. 시행일을 거꾸로 넣지 않는 규칙은 예시 SQL 조건으로(트리거 없음) [안]
- 8 고정 공지는 1쪽 맨 위에만, 10개 셈·총 개수에서 뺌 [안]
- 9 적용 기간 문구: API는 `effectiveOn`·`supersededOn`만. 웹은 "A ~ (B-1일) 적용", 같은 날 바뀌면 "A 적용(같은 날 바뀜)", 지금 버전은 "A ~ 지금" [안]
- 10 `reconsent_required`는 저장만, API에 내보내지 않음 [안]
- 11 공지 주소 번호 = `notice.id`, 문서 경로 `/api/v1/documents/{key}`(key `about`, `terms-of-service`, `privacy-policy`, `privacy-collection`), 오류 코드 `notice_not_found`·`document_not_found`·`version_not_found` [안]
- 12 처리방침 v1 시행일 2026-10-04 [안] (확인 필요 2)
- 시행일이 앞날인 공지(v1이 미래)는 그날 전까지 목록·주소 모두 404

## 모듈

| 모듈 | 변경 | 공개 API | 이벤트 | 소유 표 |
|---|---|---|---|---|
| `sitecontent` (새) | 공지·문서 읽기 API(로그인 없음), 가입용 지금 버전 | Java `SiteDocuments.currentVersion(ConsentDocument) → int`, 공개 enum `ConsentDocument { TERMS_OF_SERVICE, PRIVACY_COLLECTION }`. REST 아래 | 없음 | `notice`, `notice_version`, `document_version` |
| `auth` | `SignupService.documents()`가 `SiteDocuments`를 부르고 문자열로. `AuthProperties.Documents`·`documents` 설정·`documentVersions.json` 테스트 지움(C27 폐기). 409 그대로 | 그대로 | 그대로 | `account_consent` 데이터·CHECK만 |
| 웹 | S16·S17 새로, LegalPage·AboutPage·SignupPage가 API를 읽고 `react-markdown`으로. `/privacy`의 `LoginOnly`, 바닥글 "문의: 준비 중", `legalText.ts`·`documentVersions.json`·`NOT_REVIEWED` 지움 | — | — | — |

- 새 의존 `auth → sitecontent` 하나. `sitecontent`는 아무 모듈에도 의존하지 않음. `auth/package-info.java` AC-18을 바꾸므로 ADR. 가입은 동기 읽기가 필요해 이벤트를 쓰지 않음

## 데이터 (스키마 `sitecontent`)

`notice`: `id bigint` PK IDENTITY(주소 번호) / `pinned boolean NOT NULL DEFAULT false` / `hidden boolean NOT NULL DEFAULT false` / `created_at timestamptz NOT NULL DEFAULT now()`

`notice_version`: `notice_id bigint NOT NULL` FK → `notice(id)` / `version_no integer NOT NULL CHECK (>= 1)` / `effective_on date NOT NULL`(v1 = 게시일, 뒤 = 고친 날) / `title text NOT NULL CHECK (btrim(title) <> '')` / `body text NOT NULL CHECK (btrim(body) <> '')` / `created_at` / PK `(notice_id, version_no)`

`document_version`: `document_key text NOT NULL CHECK IN (4개)` / `version_no integer NOT NULL CHECK (>= 1)` / `effective_on date NOT NULL` / `body text NOT NULL` / `change_summary text NULL`(ABOUT은 NULL만) / `reconsent_required boolean NOT NULL DEFAULT false`(약관·동의문만 true 가능) / `consent_items jsonb NULL`(동의문이면 필수, 배열 4개) / `created_at` / PK `(document_key, version_no)`

- `updated_at` 없음(버전은 고치지 않고 새로 넣음). 다른 모듈과 FK·JOIN 없음
- Liquibase 새 파일: `sitecontent/001-sitecontent-schema.yaml`, `sitecontent/002-sitecontent-seed.yaml`, `auth/002-consent-version-number.yaml`. master 끝에 추가 — 사이클 13·14·15도 끝줄을 고치므로 병합 때 순서 확인

## API (로그인 없음, 캐시 없음, 쓰기 없음)

| 메서드 | 경로 | 응답 | 오류 |
|---|---|---|---|
| GET | `/api/v1/notices?page={n}` | 200 목록(`pinned`, `items`, `page`, `pageSize`, `totalCount`, `hasMore`), 없는 쪽은 마지막 쪽으로 맞춤 | 400 `validation_error` |
| GET | `/api/v1/notices/{noticeId}?version={n}` | 200 글(`postedOn`, `editedOn`, `version`, `versions[]` with `effectiveOn`·`supersededOn`) | 404 `notice_not_found`, 404 `version_not_found`, 400 |
| GET | `/api/v1/documents/{documentKey}?version={n}` | 200 문서(`version`: `body`, `changeSummary`, `consentItems`; `versions[]`) | 404 `document_not_found`, 404 `version_not_found`, 400 |
| GET/POST | `/api/v1/auth/signup` | 그대로, `version`이 `"1"` 같은 순번 문자열 | 409 그대로 |

예시 JSON은 결정 페이지와 `design-delta.md`에 옮김.

## 주요 흐름
1. 공지 목록: 오늘(Asia/Seoul) → 숨김 아니고 v1 시행일 ≤ 오늘인 고정 아닌 공지 수 → 쪽 맞춤 → 공지마다 시행 중인 최신 버전 제목·v1 시행일 → 1쪽이면 고정 공지도
2. 공지 글: 숨김·없음·v1 미래 → 404 `notice_not_found` / 버전 없음·시행 전 → 404 `version_not_found` / 아니면 200
3. 약관·처리방침·안내: 2와 같음. S12는 이어서 `GET /join-surveys/latest`(그대로)
4. 가입 화면: `GET /auth/signup` → auth → `SiteDocuments.currentVersion` → 이어서 웹이 `GET /documents/privacy-collection?version=N`(보인 글과 동의 버전이 같게)
5. 가입 제출: 지금 버전 다시 비교, 다르면 409 → 웹이 4를 다시. 같으면 한 트랜잭션. 비교와 저장 사이 자정은 무시할 만함
6. 운영자 SQL: 앞날 시행일로 넣으면 그날부터 보임

## 인계서 예시 SQL 계획
- 새 공지: `notice` INSERT RETURNING id → `notice_version` v1 INSERT, 한 트랜잭션
- 공지 고치기: `version_no = max+1`, 조건 `:date >= max(effective_on)`(0줄이면 확인)
- 숨기기·고정: `UPDATE notice SET hidden/pinned`
- 문서 새 버전: `INSERT … SELECT :key, max+1, :date, $$본문$$, $$바뀐 점$$ … WHERE :date >= max(effective_on)`. 동의문은 `consent_items` 4개. 약관·동의문을 바꿀 때 공지도 함께(R7-1)
- 경고(R7-3): 다시 동의 화면 전에는 `reconsent_required = true` 금지

## 확인 필요
| # | 항목 | 방법 | 막는 단계 |
|---|---|---|---|
| 1 | 서비스 안내 v1 본문·시행일(13·14 문장 포함) | 13·14 회고 때 dev 확인 | 설계 확정 |
| 2 | 처리방침 v1 시행일 2026-10-04 | 사용자에게 질문 | seed |
| 3 | 사이클 15 모듈 이름과 안 겹침, master 끝줄 | 사이클 15 design-delta | 설계 확정 |
| 4 | `react-markdown@10`과 React 19.3, 묶음 크기 | dev 설치 시험 | 개발 |
| 5 | ADR 번호 | README 마지막 번호 다시 확인 | ADR |
| 6 | 정수 아닌 `?version`·`?page` 400이 `ApiExceptionHandler`에 있는지 | dev 코드 | 개발 |
| 7 | seed 본문의 세미콜론·`$$` | dev 적용 시험 | 개발 |
| 8 | 결정 6 A가 spec R2-3 뜻과 맞는지 | 사용자에게 질문 | 배포 체크리스트 |

## backlog 후보
- 다시 동의 화면 전까지 `reconsent_required = true`를 DB CHECK로 막기
- 공지 숨김·고정 바꾼 때 기록
- 방문자가 많아지면 응답 캐시·ETag
