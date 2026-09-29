# 전자책 목록 검색 저장소와 항목 정리 규칙 — 조사

- 작성: 2026-09-30 (chaekcheck-plan 세션, 사이클 03 회고 뒤)
- 성격: 사이클 밖 사전 준비 자료입니다. 모듈·테이블·API는 이 기능을 다루는 사이클의 `design-delta.md`와 ADR에서 정합니다 (`.claude/rules/scope-guard.md`).
- 같은 폴더: 수집 조사 `research.md`, 수집 방법 `crawl-method.md` (수집 세션이 관리)
- 측정 자료: `chaekcheck-data/ebook-catalog.sqlite` 읽기 전용 조회 (2026-09-30, 수집 진행 중. 1차 00:30경 27.4만 줄·36곳, 2차 131.5만 줄·250곳)

## 1. 사용자 요구와 결정

| 항목 | 값 | 태그 |
|---|---|---|
| 검색 방식 | 제목·저자·출판사 필드 검색, 여러 필드 AND | [확정] (사용자: "우리 서비스는 책이름, 저자, 출판사 이런걸로 검색하는것이고", 2026-09-30) |
| 정렬 | 나중에 출판일 정렬 | [확정] (사용자: "차후에 출판일 정렬 이런것도 고려중이야") |
| 수집 범위 | 웹러브 북스 수준(교보·YES24 전 기관 + 북큐브·알라딘), 도서관 사이트에서 직접 수집 | [확정] (사용자: "웰러브북스에 있는 책들은 어지간하면 다 수집할 예정이고", "직접 모으는 거 맞아"). `docs/backlog.md` |
| 역할이 안 적힌 이름 | 저자 검색에 넣음 | [확정] (사용자 선택, 2026-09-30). 이유 [이유 미확인] |
| 옮긴이 | 저자 검색 기본에서는 빼고, "옮긴이 포함" 선택지를 둠 | [확정] (사용자 선택, 2026-09-30). 이유 [이유 미확인] |
| 출간 예정 책 | 최신순 맨 위에 "출간 예정" 표시와 함께 보임 | [확정] (사용자 선택, 2026-09-30). 이유 [이유 미확인] |

## 2. 규모

| 항목 | 값 | 태그 |
|---|---|---|
| 웹러브 북스 플랫폼별 권수 | 교보 733,296 / 북큐브 638,583 / 예스24 251,613 / 알라딘 98,823 (합 약 172만) | [확정] (화면 값, https://ebook.okbari.net/ebook, 2026-09-30). 한 줄 = 플랫폼별 책 한 권 + 소장 기관 수로 보임 |
| 웹러브 북스 책 옆 날짜 | 출간일 | [확정] (같은 책의 수집 `published_on`과 같음: 「넘어지고 나서야 일어서는 법을 알게 된다」 2026-12-31, 「마이 가디언 5」 2026-11-27) |
| 우리 목표 규모 | 책 약 172만(플랫폼별 합), 소장 줄 1,000만 안팎 | [추정] |
| 설계 여유 (2배) | 책 약 350만, 소장 줄 약 2,000만 | [추정] |
| 교보 기관 목록 | 약 2,000곳 (초중고 943, 대학 317, 기업 273, 공공도서관 216, 공공기관 152, 공기업/공단 46, 연구소 45, 아파트 8) | [확정] (`docs/cycles/02-library-expansion/data/kyobo-institutions.tsv`) |

## 3. 검색 저장소 후보

### 3.1 비교

| 후보 | 한국어 부분 일치 | 확인한 특징 | 판단 |
|---|---|---|---|
| PostgreSQL + `pg_trgm` | 3글자 조각 | 조각을 뽑을 수 없는 패턴은 인덱스 전체 훑기 (공식 문서) → 2글자 검색어에 약함 | 안 맞음 [안] |
| PostgreSQL + `pg_bigm` | 2글자 조각 | PG18 지원(v1.2-20250903), AWS RDS/Aurora 지원. 결과가 많으면 다시 확인(Recheck)이 느리다는 지적(PGroonga 문서) | **1순위** [안] |
| PostgreSQL + `PGroonga` | 모든 언어 | Recheck 없이 결과가 많을 때 빠르다고 문서가 말함. "충돌 시 인덱스가 깨질 수 있어 REINDEX" | pg_bigm이 느리면 비교 [안] |
| PostgreSQL + ParadeDB `pg_search` | Lindera + KoDic 형태소 | BM25 순위, `CREATE INDEX … USING bm25 (…) WITH (key_field='id')` | 순위가 필요하면 다음 후보 [안] |
| OpenSearch / Elasticsearch + nori | mecab-ko-dic 형태소 | 순위·오타·집계. JVM 힙 RAM 절반 권장, `vm.max_map_count` 262144 (OpenSearch 1.2 문서) | 마지막 후보 [안] |
| Meilisearch | Lindera 한국어 | 검색어 10단어까지, 결과 기본 1,000건(`maxTotalHits`), 동시 1,000건 초과 시 503 | 조건부 [안] |
| Typesense | `locale: ko` | 데이터 크기의 2~3배 RAM, 최소 2 vCPU. 예: 4 vCPU·220만 건에서 초당 104건 | 조건부 [안] |
| Manticore | 글자 n-gram만 (형태소는 중국어만) | — | 안 맞음 [안] |
| NoSQL (MongoDB 등) | — | 책·도서관·소장 관계 구조라 이점 없음 (Claude 판단) | 안 맞음 [안] |

- 처리량·CPU를 제품끼리 공정하게 비교한 공식 수치는 찾지 못함 (Typesense 예시만 있음) → 우리 데이터로 측정 [확인 필요]

### 3.2 제안: PostgreSQL + pg_bigm으로 시작 [안]

- 이유: 이미 쓰는 PostgreSQL 18 안에서 됨(서버 추가 없음), 수집 결과가 곧 검색 데이터(옮겨 담기 없음), 필드 AND와 날짜 정렬이 SQL 기본 기능, 2글자 한국어 검색어에 맞음
- 걱정: "사랑"처럼 흔한 짧은 검색어 + 출판일 정렬. 2배 규모로 측정해 확인 [확인 필요: 프로토타입]
- 느리면: PGroonga 비교 → ParadeDB pg_search → OpenSearch. 검색 부분을 서버 코드 안의 인터페이스 뒤에 두어 바꿀 수 있게 함 (ADR-0021과 같은 방식)

### 3.3 설계 스케치 [안] (이름·모듈은 사이클에서 정함)

| 테이블 | 한 줄 = | 규모(2배 추정) | 역할 |
|---|---|---|---|
| `book` | 같은 책 한 권 | 약 350만 | 검색 대상. 정리한 제목·저자·출판사, 대표 출간일, 자료 종류 |
| `book_contributor` | 책 × 사람 × 역할 | 수백만 | 지은이·옮긴이·그림 등 구분 |
| `holding` | 도서관 × 책 | 약 2,000만 | 원문, 처음 본 때, 빠진 날짜 |
| `crawl_run` | 도서관 × 수집 한 번 | — | 수집 기록, "○월 ○일 기준" |

- 인덱스: `book`의 정리한 제목·저자·출판사에 각각 `gin_bigm_ops`(AND 때 두 인덱스 결과를 겹침), `(published_on DESC, id)` B-tree(정렬 + 커서 방식 쪽 넘김), 정리한 제목 B-tree(정확히 일치 먼저), `holding (book_id) WHERE removed_at IS NULL`, `holding (library_id, platform_item_key)` PK
- 파티션: 처음엔 없음. `book`은 나누면 파티션마다 GIN을 모두 뒤져야 해 불리. `holding`은 도서관 단위 교체가 잦아지거나 VACUUM이 밀리면 플랫폼별 LIST 또는 도서관 HASH 검토
- 수집 반영: 도서관 한 곳 결과를 임시 테이블에 넣고 `holding`과 비교해 새 책·바뀐 항목·빠진 책만 반영. 줄마다 "마지막으로 본 시각"을 매주 고치지 않고 도서관의 "마지막 성공 전체 수집 시각"으로 대신함 (매주 2,000만 줄 갱신과 그에 따른 VACUUM 부담을 피함)
- 설정: 확장 설치 가능 여부(호스팅 결정 시 [확인 필요]), 처음 적재는 데이터 먼저·GIN 나중, 인덱스 생성 때만 `maintenance_work_mem` 크게, 검색 역할에 짧은 `statement_timeout`, `book`·`holding` autovacuum 더 자주, `pg_stat_statements`, 메모리 값은 서버 RAM 확정 후
- 나중에: 수집(쓰기)과 검색(읽기) DB 분리 (ecrick이 로컬 수집 DB + 조회용 RDS로 나눔)

## 4. 항목 정리 규칙 [안]

공통: 사이트 원문은 보관하고 옆에 "정리한 값"을 둡니다. 정리한 값은 찾기·정렬·같은 책 묶기에만 쓰고, 화면에는 원문을 보입니다. **사용자 검색어에도 같은 규칙을 적용**합니다. 원문이 있으므로 규칙을 바꾸면 다시 수집하지 않고 다시 계산합니다. 문자 통일은 유니코드 NFKC (㈜ → (주), 전각 → 반각, Ⅱ → II, 이 PC 파이썬 `unicodedata`로 확인).

### 4.1 저자: 이름과 역할 나누기

측정 (131.5만 줄): 역할 표시 없는 한 사람 이름 117.9만(약 90%), `<이름> 저/<이름> 역` 5.3만, `A 저/B 역` 4.9만, 쉼표 여러 사람 3.3만.

| 정리한 역할 | 사이트 표시 (건수, 부분 단위) |
|---|---|
| 지은이 | 저 187,526 / 글 11,535 / 공저 8,456 / 지음 3,285 / 저자 1,331 / 등저 1,171 / (지은이) 975 |
| 옮긴이 | 역 51,632 / 옮김 2,119 / 공역 921 |
| 그림 | 그림 15,121. 글그림 2,254는 지은이 + 그림 |
| 엮은이 | 편 2,010 / 엮음·(엮음) 2,213 / 편저 542 / 편역 386 |
| 그 밖 | 감수 3,949 / 기획 500 / 사진 302 / 원작·(원작) 1,603 / 해설 134 / 낭독 56 |
| 역할 모름 | 표시 없음. **저자 검색에 포함** [확정] |

- 여러 사람: `/`로 나누고, 한글이 있는 부분은 쉼표로도 나눔. 영문 `Richardson, James D.`처럼 성·이름 쉼표는 나누지 않음 → 규칙은 표본으로 확인 [확인 필요: 표본 조사]
- 괄호 속 별명(`김도형(별별역사)`)은 이름과 별명으로 나눠 둘 다 검색되게
- `외`(8,048)는 사람이 아니라 "공동 작업자 더 있음" 표시
- 단체 이름(`편집부` 9,159, `제작팀` 2,734, `위원회`)은 저자로 둠. 사람과 구분할지는 나중에
- 저자 검색 기본: 지은이 + 그림 + 엮은이 + 역할 모름 [안]. "옮긴이 포함" 선택 시 옮긴이 추가 [확정]. 그림·엮은이를 기본에 넣을지는 [확인 필요: 사용자에게 질문]
- 근거: MARC 21은 사람 이름에 역할 이름($e)과 역할 코드($4, 예 `aut`)를 붙임 (OCLC BFAS 100 필드)

### 4.2 제목: 원문 전체로 찾고 본제목은 순서·묶기에

측정: 책 코드 48.6만 중 도서관마다 제목이 다른 코드 3.3만 (한쪽만 부제 7,971 / 앞에 시리즈명 등 24,816 / 공백만 다름 163). 구분자 포함 줄: `(` 7.8만, `:` 7.7만(` : ` 4.3만), ` - ` 5.0만, `[` 1.9만.

- 부분 일치 검색은 정리한 전체 제목으로 함 (부제가 있어도 찾힘)
- 본제목 = 첫 ` : ` 또는 ` - ` 앞. "제목이 똑같은 책 먼저" 순서와 같은 책 묶기에 씀. 근거: MARC 21 245 필드는 본제목($a)과 나머지 제목 정보($b)를 나누고 ISBD에서는 ` : `로 구분 (OCLC BFAS 245)
- 맨 앞 `〈…〉`·`[…]`는 시리즈명으로 떼어 보관 (YES24 `[100분 고전 013] …`처럼 분야가 아님)
- 권 번호와 뒤쪽 괄호(`이기적 유전자(40주년 기념판)`)는 자르지 않음
- ` - ` 뒤가 제목 일부인 책이 있을 수 있음 [확인 필요: 표본 조사]

### 4.3 출판사: 규칙 + 별칭 목록

측정: 출판사 이름 43,252가지. `(주)`·`㈜` 6,023줄, `도서출판` 5,990, `주식회사` 829, Inc·Ltd·Co 570.

- 규칙: NFKC → `(주)`·`주식회사`·`도서출판`·Inc/Ltd/Co 제거 → 공백·마침표·쉼표 제거 → 영문 소문자. 이 규칙으로 743개 묶음이 합쳐짐 (예: `(주) 도서출판 푸른숲`, `(주)도서출판푸른숲`, `푸른숲(주)`, `푸른숲`)
- 별칭 목록: 글자가 다른 같은 출판사(`Project Gutenberg` = `구텐베르크 프로젝트`)는 사람이 만든 목록으로 합침. 발견할 때마다 더함
- 출판사 안의 다른 이름(`교문사(청문각)`)은 자동으로 합치지 않음

### 4.4 출판일: 못 믿을 값은 비우고 대표값을 고름

측정: 날짜 없음 11,449, `YYYYMMDD` 형식 1,335, 미래 67(그중 `2045-12-08`이 여러 권에 같은 값), 1950년 이전 5. 같은 책 코드인데 도서관마다 날짜가 다른 것 61,777 / 480,169 (약 13%, 예 2010-11-15 대 2012-01-13).

- 읽기: `YYYY-MM-DD`, `YYYYMMDD`. 그 밖은 비우고 원문만 (수집 세션이 `0000`·2100 이후를 NULL로 바꿈, 2026-09-30)
- 수집일로부터 1년보다 먼 미래는 비움. 오래된 날짜는 자르지 않음(「무정」 1917 같은 옛 작품). 1950년 이전은 확인 목록 [안]
- 도서관마다 다르면 가장 많이 나온 날짜, 같은 수면 이른 날짜 [안]. 날짜가 다른 이유(전자책 등록일인지 등)는 [확인 필요]
- 1년 안의 미래는 "출간 예정"으로 표시하고 최신순 맨 위에 보임 [확정]. 근거: 국립중앙도서관 ISBN 서지정보가 "발행 예정일"을 따로 제공 (공공데이터포털)
- 정렬에서 날짜 없는 책은 최신순·오래된순 모두 맨 뒤 [안]

### 4.5 다른 곳의 방식 (확인한 것만)

- MARC 21 (OCLC BFAS 245·100): 본제목·나머지 제목·책임 표시를 나눠 적고, 사람에 역할 이름·코드를 붙임
- 국립중앙도서관 ISBN 서지정보: 서명·저자·출판사·발행 예정일 등 제공
- ecrick: 제목·저자·출판사를 합친 키로 중복 제거, 약 120만 줄 → 약 30만 권 (README)
- 알라딘·YES24·웹러브 북스의 내부 정리 방식은 공개 자료를 찾지 못함

## 5. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| pg_bigm 2배 규모 응답 시간 (2글자, AND, 출판일 정렬, "사랑") | 프로토타입 (로컬 PostgreSQL, 데이터 불려 넣기) |
| pg_bigm 한 글자 검색 동작, PGroonga 복제·관리형 DB 지원, ParadeDB 관리형 DB 지원·라이선스·`shared_preload_libraries` | 공식 문서 확인 |
| 운영 호스팅이 pg_bigm을 지원하는지 | 호스팅 결정 때 공식 문서 확인 |
| 영문 저자 쉼표 규칙, ` - ` 부제 규칙 | 표본 조사 (사이트별 100건) |
| 저자 검색 기본에 그림·엮은이를 넣을지 | 사용자에게 질문 |
| 도서관마다 출간일이 다른 이유 | 표본 조사 (같은 책 상세 화면 비교) |

## 출처 (모두 확인 2026-09-30)

- PostgreSQL 18 pg_trgm https://www.postgresql.org/docs/current/pgtrgm.html
- pg_bigm releases https://github.com/pgbigm/pg_bigm/releases, AWS 블로그 https://aws.amazon.com/blogs/database/index-types-supported-in-amazon-aurora-postgresql-and-amazon-rds-for-postgresql-using-extensions-bloom-pg_trgm-and-pg_bigm/
- PGroonga 개요 https://pgroonga.github.io/overview/
- ParadeDB Lindera https://www.paradedb.com/docs/documentation/tokenizers/available-tokenizers/lindera
- OpenSearch analysis-nori https://github.com/opensearch-project/OpenSearch/tree/main/plugins/analysis-nori, 설정 https://docs.opensearch.org/docs/1.2/opensearch/install/important-settings/ (1.2 문서, 최신과 같은지 [확인 필요])
- Elasticsearch nori https://www.elastic.co/docs/reference/elasticsearch/plugins/analysis-nori
- Meilisearch https://www.meilisearch.com/docs/learn/resources/language, https://www.meilisearch.com/docs/learn/resources/known_limitations
- Typesense https://typesense.org/docs/guide/system-requirements.html, https://typesense.org/docs/latest/api/collections.html
- Manticore https://manual.manticoresearch.com/Creating_a_table/NLP_and_tokenization/Languages_with_continuous_scripts
- OCLC BFAS 245 https://www.oclc.org/bibformats/en/2xx/245.html, 100 https://www.oclc.org/bibformats/en/1xx/100.html (미국 의회도서관 MARC 문서는 봇 확인 화면 때문에 열지 못함)
- 공공데이터포털 국립중앙도서관 ISBN 서지정보 https://www.data.go.kr/data/3078982/openapi.do
- ecrick https://github.com/sandropark/ecrick
- 웹러브 북스 https://ebook.okbari.net/ebook
