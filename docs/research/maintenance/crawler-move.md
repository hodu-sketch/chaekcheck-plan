# 수집기를 dev로 갈아타기와 도서관 넣기 담당 (2026-10-12 정리)

- 사용자 요청 (2026-10-12):
  - "수집기를 서비스 쪽(dev)으로 옮길지 … 이거 지금 하려고 하는데 파악 좀 해줘"
  - "지금 스크립트 구조에 대해서 좀 설명하고 … 필요한 정보들도 알려주고 결정할 거 결정하게 canvas로 알려줘"
- backlog 216행: "수집기를 서비스 쪽으로 옮길지"
- 근거 결정:
  - ADR-0047: 절차는 dev `docs/maintenance/`, 수집기는 dev `scripts/crawl/`, 진행 중인 수집이 끝난 뒤 옮김
  - ADR-0052: 번호 짝 표는 `collection` 모듈
  - ADR-0060: 가져오기는 `collection` 모듈
  - ADR-0067: 교보 대여·혼합 제외
- 결정 페이지: `easy/2026-10-12-crawler-move-decisions.html`

## 1. 지금 스크립트 구조 (2026-10-12)

| 갈래 | dev `scripts/` (git) | 데이터 폴더 `chaekcheck-data` (git 밖) |
|---|---|---|
| ① 도서관 찾기 | `library/candidates/probe_*.py` 4개 (10-05 복사) | `scripts/probe_*.py` (원본) |
| ① 사이트 확인 | `library/CheckKyoboSites.java`, `CheckYes24Sites.java`, `CheckFinalOrigins.java`, `find_front_pages.py`, `check_front_page_names.py` | – |
| ① 가입 조건 | `library/collect_join_evidence.py`, `kyobo_login_notice.py`, `eligibility_rules.py`, `apply_join_classification.py` | `library-join/fetch.py` (10-05 후보 공공도서관 조사 때 만든 도우미, dev에 없음) |
| ① 구독 마감 | `library/probe_kyobo_limits.py`, `limits-daily.cmd` (10-05 복사) | 원본 |
| ① 로고 | `library/BuildLogos.java` (받은 로고에서 웹용 파일 만들기) | `scripts/probe_logos.py`, `probe_home_logos.py` (로고 받기, dev에 없음) |
| ① 넣기 | `library/build_seed.py`(처음 278곳, 끝남), `build_candidate_seed.py`(281번부터, 새 사본·규칙 바뀔 때) | – |
| ② 책 수집 | `crawl/crawl_catalog.py`, `resume.cmd`, `verify_detail_urls.py` (10-05 복사, 데이터 폴더를 인자·환경 변수로) | `scripts/crawl_catalog.py`, `resume.cmd` (원본, 지금까지 실제로 돈 것) |
| ② 빈 곳 채우기 | – | `scripts/refill_pubdt.py` (10-07 경운·여주 때 만듦, dev에 없음) |
| 한 번 쓰고 끝 | – | `library-naming/apply_rename.py` (10-12 이름 바꾸기) |

- 수집기 본체는 복사 뒤 바뀌지 않음: 원본 마지막 수정 10-04 19:52, dev 복사 10-05 02:36 (dev 커밋 `b737773`)
- 복사 뒤 바뀐 것:
  - 수집 DB에 `library.vendor` 칸 (10-12, `cycle09-collection-result.md` 2절). 수집기의 표 만들기 코드(`SCHEMA`·`migrate`)에는 없음
  - 위 표의 "dev에 없음" 4개 도구
- 수집기 안에 ① 넣기(`import-probe`, `import-bookcube`)가 섞여 있음 (`collection-areas.md` 1절)

## 2. 수집 상태: "전체 수집이 끝난 뒤" 조건

- 받을 곳은 다 받음
  - 등록 도서관 274
  - 그 밖 2,438
  - 교보 대여·혼합 230은 받지 않음 (ADR-0067)
  - 실패 2 (무주초 404, 창원문성대 500)
- 수집기는 2026-10-06 23:32 뒤로 멈춰 있음. 갈아타도 돌고 있는 수집과 부딪히지 않음
- → ADR-0047의 "진행 중인 수집이 끝난 뒤"는 채워졌다고 볼 수 있음 [안]

## 3. 도서관 넣기(세팅)의 지금 흐름

```
수집 DB (Python 수집기)
  └ dev build_candidate_seed.py (Python) — 사본을 읽기 전용으로 읽음
      → seed CSV: library/008-library-candidates.csv, 008-eligibility-rule-candidates.csv,
                  collection/002-collection-link.csv
          → Liquibase가 서비스 DB에 넣음 (앱 시작 때)
              └ 책 가져오기는 backend collection 모듈 (ADR-0060), 짝 표도 collection (ADR-0052)
```

- `build_candidate_seed.py`가 정하는 것:
  - 넣을 도서관 고르기
  - 새 번호
  - 이름
  - 업체·대출 방식
  - 가입 조사 상태
  - 같은 사이트 거르기
  - 짝 표
- 테스트: `test_build_candidate_seed.py`

## 4. 이름에 남은 "후보"

- "후보 도서관"을 쓰지 않는다는 결정 기록은 없음
  - 사용자: "후보 도서관이라는 표현이 싫은데 흠", "이거 왜 후보야?" (2026-10-11~12)
- "후보"가 남은 곳:
  - plan·dev 문서
  - `build_candidate_seed.py`, `name_candidates()`
  - `scripts/library/candidates/`
  - seed 파일 `008-library-candidates.csv`, `008-library-seed-candidates.yaml`
- Liquibase는 변경 묶음(changeset)을 id·author·**파일 경로**로 알아봄. 이미 적용된 changelog 파일의 이름이나 경로를 바꾸면 새 changeset으로 보고 다시 돌리려 함. 막으려면 `logicalFilePath`로 원래 경로를 적어야 함 [확정]
  - 출처 (2026-10-12 확인):
    - https://docs.liquibase.com/concepts/changelogs/changeset.html
    - https://docs.liquibase.com/secure/reference-guide-5-1-1/changelog-attributes/logicalfilepath
    - https://support.liquibase.com/hc/en-us/articles/42999734689947-Using-logicalFilePath-to-Restructure-Changelogs
  - `loadData`가 읽는 CSV 파일 경로를 바꾸면 changeset 내용이 바뀌어 체크섬이 달라질 수 있음 [확인 필요: dev, 이 프로젝트의 Liquibase 버전]

## 5. 결정 (결정 페이지, 2026-10-12)

| # | 결정 | 태그 |
|---|---|---|
| 1 | 지금 갈아탐(전체 수집이 끝난 것으로 봄) | [확정] (사용자 승인, 2026-10-12) |
| 2 | 옛 코드는 보관 폴더로 옮겨 **백업으로 두고 지우지 않음** | [확정] (사용자 제안: "옛 코드는 보관 폴더로 옮기고 백업 용으로 하고 지우지는 마", 2026-10-12. 추천안 "한 번 잘 돈 뒤 지움"은 미승인) |
| 3 | 데이터 폴더에만 있는 도구: `refill_pubdt.py` → 수집기 명령, `fetch.py`·`probe_logos.py`·`probe_home_logos.py` → dev `scripts/library/`, `apply_rename.py`는 옮기지 않음, `vendor` 칸 → 수집기 표 만들기 코드 | [확정] (사용자 승인, 2026-10-12) |
| 4 | 이번에는 옮기기·갈아타기만, 코드 구조 정리는 backlog | [확정] (사용자 승인: "응 백로그에 기록해줘", 2026-10-12) |
| 5 | 도서관 넣기 담당: **나. `collection` 모듈이 넣음** (재시작 없이) | [확정] (사용자: "나는 재시작 없이 하고 싶어 나. collection 모듈이 넣음으로 해줘", 2026-10-12). 앞선 질문 두 개(책 정보는 어떻게 되나, '가'면 재시작이 필요한가)에 대한 답은 아래 5-1·5-2. 설계(표·명령·모듈 경계·ADR)는 사이클에서 |
| 6 | "후보 도서관" 말 없애고 스크립트·폴더 이름 바꿈(`build_library_seed.py`, `build_seed_first278.py`, `scripts/library/discover/`), 적용된 seed 파일 이름은 그대로 | [확정] (사용자 승인, 2026-10-12). 새 이름은 [안] |
| 7 | 진행 방식: 1~6을 **한 사이클(사이클 13)**에서 함께 함. 따로 dev 요청서로 먼저 넘기지 않음 | [확정] (사용자: "새 사이클 말고 지금 사이클에서 같이 해", "이 작업 cycle 13인 걸로 하자", 2026-10-12). 사이클 12는 이미 "책 묶기 기준 다시 보기"로 잡혀 있음(`docs/cycles/11-separate-import/scope.md` 45행) |

### 5-1. 질문에 대한 답: 도서관 넣는 방법을 바꾸면 책 정보는?

- 서비스 DB에서 도서관(`library.library`)과 책(`catalog.book`·`holding`)은 따로 있고 **서비스 도서관 번호로만** 이어짐(`holding.library_id`, `book.library_ids`, FK 없음)
- 책 정보는 가져오기 때마다 사본에서 통째로 새로 만들어 바꿔 끼움(사이클 08). 수집 번호 → 서비스 번호는 `collection_link`
- 그래서 가·나·다 어느 것이든 번호가 그대로면 기존 책 정보는 바뀌지 않음
- 다른 점은 새 도서관이 들어올 때의 순서:
  - 가·다: 도서관 줄과 책이 따로 들어와, 다음 가져오기 전까지 그 도서관은 책 0권
  - 나: 한 명령으로 함께 들어옴

### 5-2. 질문에 대한 답: "가"면 재시작이 필요한가

- 가에서는 앱이 시작할 때 Liquibase가 seed를 넣으므로, 보통 새 버전을 올리며 다시 시작할 때 들어감
  - 근거: Spring Boot 문서 https://docs.spring.io/spring-boot/how-to/data-initialization.html (2026-10-12 확인), dev `application.yml` `spring.liquibase`
- 들어간 뒤에는 서비스가 도서관 표를 요청마다 읽어 바로 보임. 도서관 표 캐시는 dev 코드에서 찾지 못함(2026-10-12)
- 나는 명령으로 넣어 재시작이 필요 없음

## 6. 처음 정리한 결정할 것

1. 갈아타기를 지금 함 [안]
2. 옛 코드 처리 [안]
3. 데이터 폴더에만 있는 도구 정리 [안]
4. 이번에는 옮기기만, 코드 구조 정리는 따로 [안]
5. 도서관 넣기 담당: 가. 스크립트 + seed 그대로 / 나. `collection` 모듈 / 다. `library` 모듈 [안]
6. "후보"라는 말 없애기와 이름 바꾸기 [안]
7. 진행 방식: 사이클 없이 dev 요청서 / 새 사이클 [안]
