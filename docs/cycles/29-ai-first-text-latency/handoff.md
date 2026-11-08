# 개발 인계서: 사이클 29 AI 책 찾기 첫 글 지연 고치기

- 기준 문서: plan `docs/cycles/29-ai-first-text-latency/measurements.md`(측정과 결정 기록), 결정 페이지 `easy/2026-11-09-decisions.html`(6개 모두 결정 2026-11-08)
- ADR: 0174 (Accepted, 2026-11-09)
- 이 인계서의 자리: plan `docs/cycles/29-ai-first-text-latency/handoff.md`. `docs/current/handoff.md`에는 한 줄 안내만 있음
- dev 세션: `chaekcheck-dev-cycle-29`

## 목표 한 줄

AI 책 찾기에서 손님 질문 안의 1분 `count(*)`(1.3초)와 `book-texts` 넣기 뒤 `VACUUM FULL` 기다림(약 10초)을 없애고, 그 뒤 DB 미리 데우기를 시험한다 [확정].

## 이 인계서를 쓰는 규칙

- plan이 관리합니다. dev에서 고치지 마세요. 달라져야 하면 사용자에게 알리고 dev `docs/cycles/29/plan-feedback.md`에 적습니다
- `[안]`은 dev가 코드에 맞춰 바꿀 수 있고, 바꾸면 plan-feedback에 알립니다

## 할 일

### 1. 책 목록: 켜질 때 읽기 + 다시 읽기 요청 [확정]

- `aisearch` `SearchBooks`: `CHECK_EVERY`(1분)와 요청 길의 `fresh()` 확인을 없앱니다. 켜질 때 한 번 읽고, 그다음은 다시 읽기 요청이 올 때만 읽습니다
- 다시 읽기는 뒤에서 하고, 다 읽은 뒤 한 번에 바꿔 끼웁니다. 그동안 질문은 옛 목록을 씁니다. 다시 읽기가 실패하면 옛 목록을 두고 경고 로그 [확정]
- `catalog.AiSearchIndex.version()`(`count(*)`)은 요청 길에서 더는 부르지 않습니다. 남길지 지울지는 dev [안]
- 다시 읽기 REST 요청 [확정]: 바깥(nginx·Cloudflare 터널)에서 닿지 않아야 합니다
  - 경로·메서드 [안]: `POST /internal/aisearch/books/reload`, 응답 `202`(뒤에서 읽기 시작) 또는 `200`(다 읽음) 중 dev가 고름
  - 막는 방법 [안]: nginx가 `/internal`을 넘기지 않음을 확인 + 서버 안에서만 부름(컨테이너 포트로 직접). nginx 설정이 `/api`만 넘기는지 [확인 필요: dev가 `active-backend.conf` 확인]
  - 블루·그린: 떠 있는 backend 자리 모두에 보냅니다 [안]
- 로그: 다시 읽을 때 `ai search books read: N` (지금 줄 그대로) + 걸린 ms [안]

### 2. `book-texts` 넣기를 새 표 바꿔 끼우기로 [확정]

- `JdbcBookTextsTransfer`: `DELETE FROM catalog.book_search` + 다시 넣기 → 새 표에 넣고(색인 포함, BM25 `book_search_bm25` 포함) 한 트랜잭션에서 이름을 바꿔 끼웁니다. 카탈로그 가져오기(ADR-0065, `JdbcCatalogLoad`)와 같은 방식
- `AiSearchIndex.compact()`(`VACUUM (FULL, ANALYZE)`)를 넣기 끝에서 부르지 않습니다. 새 표는 `ANALYZE`만 [안]
- 넣기가 성공하면 끝에 1번의 다시 읽기 요청을 보냅니다(카탈로그 가져오기 끝도 같음) [확정]
- **ADR-0170**: 표 이름 바꿔 끼우기는 블루·그린 동안 옛 판·새 판이 같은 표 이름을 읽으므로 허용 범위 [안: dev가 체크리스트로 확인]. 칸이 바뀌지 않으면 Liquibase 변경 없음
- 운영 문서 `docs/maintenance/6-aisearch.md`의 넣기 절차·238·242·244행을 새 방식으로 고칩니다

### 3. 배포 뒤 다시 재기 [확정]

- plan이 같은 스크립트로 같은 질문·쉬는 시간(10초·60초·5분, 새 질문 3쌍)을 보내고, 사용자가 서버 `steps` 로그를 뽑아 `measurements.md`에 「고친 뒤」 표를 붙입니다
- 목표: 1분 넘긴 요청의 `nearest`→`neighbours` 틈 0, `book-texts` 넣기 중·뒤 AI 검색 기다림 0

### 4. DB 미리 데우기 시험 [확정] (사용자 제안 2026-11-08)

- 1~3을 배포하고 다시 잰 뒤에, `pg_prewarm`으로 AI 검색이 읽는 것(벡터 후보·`book_search_bm25`·`catalog.book_search`)을 올려 보고 오래 쉰 뒤 첫 질문·새 질문의 `nearest`와 서버 메모리(`free -m`, 스왑)를 비교합니다
- 효과가 있고 다른 것(대출 조회, 자바)이 밀리지 않으면 적용, 아니면 기록만. 어디서 언제 부를지(켜질 때, 다시 읽기 뒤)는 시험 결과로 plan과 정함 [안]
- 지금 서버: 남은 메모리 87MB, 스왑 633MB, `shared_buffers` 64MB (2026-11-08) [확정]

## 하지 않는 것 [확정]

- Haiku·임베딩 서버 연결 유지 설정 (측정상 효과 없음)
- 「찾는 중」 이른 이벤트 (백로그)
- 새 모듈·새 공개 API

## 완료 기준

- 1분 넘겨 온 질문도 첫 글이 빠른 경우와 같음(바깥 측정 1.6~2.1초대)
- `book-texts` 넣는 동안과 직후에 AI 검색이 멈추지 않음
- 미리 데우기 시험 결과가 plan-feedback에 숫자로 남음
