# 사이클 28 (번외, 아주 작게): 자리가 다 차도 책 목록은 보여 주기

- 시작 2026-11-01, 세션 `chaekcheck-plan-cycle-28` (다른 plan 세션이 시작시킴). 사용자: "넘으면 바로 503이 아니라 그냥 대출 결과만 제외하고 알려주려고 … 그냥 목록만… 대출 정보는 알 수 없다고만 하고. 이걸로 번외로 cycle 아주 간단하게 시작하자." (2026-11-01)
- 직전 사이클 회고: 27(무중단 배포)은 운영 반영이 끝났고 회고는 아직. 이 번외 사이클은 27을 건드리지 않으므로 27 회고는 다음 보통 사이클 시작 때 쓴다 [확정] (사용자 승인, 결정 페이지 2026-11-07). 23은 회고까지 끝, 24는 dev 진행 중 (`docs/cycles/README.md`)
- 번호 25는 ADR-0154~0159와 함께 비워 둔 자리라 쓰지 않고 28을 쓴다 (ADR-0160 색인 메모)

## 지금 동작 (dev 코드에서 직접 확인, 2026-11-01) [확정]

| 무엇 | 지금 | 근거 (dev 파일) |
|---|---|---|
| 동시 검색 자리 | 서버 전체 **60**. 넘으면 줄 세우지 않고 바로 거절 | `backend/src/main/resources/application.yml` 232행 `max-concurrent-searches: 60`, `availability/internal/search/SearchSlots.java` 51~59행 `acquire()`: `tryAcquire()` 실패 → `RefusalRecord.mark`(상태 신호 빨강 10초) + `LookupOpsCounters.refused()`(1분 요약 로그) + `SearchBusyException` |
| 거절 응답 | 503 `server_busy`, `Retry-After: 5`, 스트림을 열기 전 | `availability/internal/web/AvailabilityErrors.java` 86~93행 |
| 자리를 쓰는 요청 | ① 직접 찾기 스트림 `/api/v1/ebook-searches/stream`과 그 다음 묶음 ② **대출 조회 스트림 `/api/v1/book-availabilities/stream`과 그 다음 묶음 `…/batches/stream`** ③ 도서관별 더 보기(`LibraryEbookController`) | `BatchRunner.java` 165~175행 `start()`, 229~239행 `startHoldings()` — 둘 다 `slots.acquire()`를 첫 이벤트 전에 부름 |
| 자리와 무관한 요청 | 책 목록 `GET /api/v1/books`, 책 하나 `GET /api/v1/books/{bookId}` (DB 조회) | `BookAvailabilityStreamController.java` 29~33행 주석(ADR-0030: 책 찾기와 대출 조회를 두 요청으로 나눔), `/books`는 `catalog` 모듈 |
| 한 묶음이 묻는 소장 수 | 최대 10 (`holdingBatchSize`), 나머지는 「결과 더 보기」 | `BatchRunner.java` 243~247행 |
| 화면 「바로 보기」 결과 | 책 목록(`/books`)은 이미 받았는데, 첫 대출 조회 스트림이 503이면 **결과 자리 전체가 안내문 한 줄로 바뀜**: "지금 찾는 사람이 많아요. 잠시 뒤에 다시 해 주세요." 다시 시도 단추 없음 (사이클 08 R2 [확정]) | `web/src/features/search/InstantResults.tsx` 131~141행, `blocked.ts` 11~14행 |
| 화면 「바로 보기」 다음 책 페이지 | 「다음 책 N권 보기」로 받은 책들의 조회 스트림이 503이면 받은 결과는 남고 위에 같은 안내 줄, 새 책들은 보이지 않음 | `InstantResults.tsx` 81~96·132·165행, `ResultList.tsx` 184~188행 |
| 책 화면 | 책 머리(제목·표지·요약·보유 도서관 N곳)는 보이고(`/books/{id}`), 도서관 줄은 없이 안내 줄만 | `web/src/features/book/BookPage.tsx` 184~232행 |
| 추천도서 책 창 | 같은 스트림을 `holdingLimit=3`으로 부름 | `web/src/features/picks/PicksBookDialog.tsx` 127행 |
| 조회 상태 신호 | 거절 1건이면 10초 동안 빨강 (`/api/v1/lookup-status`) | `SearchSlots.java` 16~17행 주석, ADR-0118 |

## 목표 (한 문장)

동시 검색 자리 60개가 다 찼을 때 「바로 보기」 결과에서 **책 목록은 그대로 보이고**, 도서관별 대출 가능 여부(상세 판정·소장 조회)만 빼고 "대출 정보는 지금 알 수 없다"고 알려 준다 [확정] (사용자 승인, 결정 페이지 2026-11-07) (사용자 말 2026-11-01을 그대로 옮긴 것, 결정 페이지 1번 승인).

## 포함 [확정] (사용자 승인, 결정 페이지 2026-11-07)

1. 대출 조회 스트림(`/api/v1/book-availabilities/stream` 첫 묶음과 `…/batches/stream` 다음 묶음)이 자리를 못 얻었을 때의 서버 응답과 화면 동작 변경. 방법(서버가 보내는 것, 화면이 그리는 것)은 `design-delta.md`에서 고름
2. 「바로 보기」 결과 화면: 책 목록이 보이고 대출 칸은 "지금 알 수 없음" 문구, 자리가 생겼을 때 다시 확인하는 길(단추 또는 기존 「결과 더 보기」)
3. 같은 스트림을 쓰는 책 화면·추천도서 책 창도 같은 서버 동작을 받으므로, 거기서 보이는 문구를 정함
4. 거절을 어떻게 셀지(지금: 요약 로그 거절 수 + 상태 신호 빨강)와 `docs/settings-index.md` 3절 "(넘으면 바로 503)" 설명 갱신

## 제외 (backlog.md로 보내지 않고 지금대로 둠) [확정] (사용자 승인, 결정 페이지 2026-11-07)

- 직접 찾기 스트림(`/api/v1/ebook-searches/stream`, 다음 묶음), 도서관별 더 보기: 목록 자체가 도서관 사이트에서 오므로 자리가 없으면 보여 줄 것이 없음 → 503 그대로
- AI 책 찾기 자리(`AiSearchSlots`, 503 `server_busy`): 다른 자리, 다른 화면
- 자리 수 60 자체, 줄 세우기(대기열), 자리 늘리기: 바꾸지 않음
- 새 모듈·새 표·새 Liquibase 변경: 없음

## 완료 기준 (사용자가 화면에서 확인할 수 있는 것) [확정] (사용자 승인, 결정 페이지 2026-11-07)

- 자리 60개를 모두 채운 상태(시험용으로 `max-concurrent-searches`를 1로 낮추고 다른 창에서 조회 하나를 열어 두는 방법)에서 「바로 보기」로 검색하면, 책마다 한 줄(제목·저자·출판사·연도·보유 도서관 N곳)이 검색 결과 순서대로 보이고, 목록 위에 안내 줄 "지금 찾는 사람이 많아 대출 정보는 알 수 없어요. 책 목록만 먼저 보여 드려요."와 「대출 정보 다시 확인」 단추가 보인다 (spec AC-1)
- 자리가 비면 다시 확인하는 길(단추 또는 「결과 더 보기」)로 대출 정보가 채워진다
- 같은 상태에서 책 화면·추천도서 책 창도 정한 문구를 보인다
- 직접 찾기는 지금처럼 503 안내 줄 그대로다
- 1분 요약 로그의 거절 수와 조회 상태 신호 빨강이 지금처럼 남는다 (정한 대로)

## 먼저 조사할 것 [확인 필요]

| 항목 | 확인 방법 | 결과 |
|---|---|---|
| 자리 거절이 스트림을 열기 전에 나는지, 열고 난 뒤에도 날 수 있는지 | dev `BatchRunner.java` 읽기 | 열기 전에만. 자리를 얻은 뒤에는 스트림이 끝날 때(늦어도 스트림 시간 + 10초) 돌려줌 (165~175, 229~239, 266~269행) [확정] |
| 책 목록 응답에 도서관 번호가 있는지 (화면만 고쳐 도서관 줄을 그릴 수 있는지) | dev `web/src/api/types.ts` `BookItem` | `holdingLibraryCount`(수)만 있고 도서관 번호는 없음 (233~244행). 도서관 줄은 스트림의 `targets.holdings[]`로만 알 수 있음 [확정] |
| 화면이 실패한 소장 줄을 어떻게 그리는지 (재사용 가능?) | dev `holdingPlan.ts` `failedRow`, `ResultRow.tsx` | 실패 줄은 「확인하지 못한 도서관」 묶음에 "대출 정보를 확인하지 못했어요"로, 실패한 소장은 「결과 더 보기」가 다시 묻지 않음 (`nextHoldingCandidates`는 NotRequested만) [확정] |
| 옛 화면 판·새 서버 판이 블루·그린 전환 중 잠깐 섞여도 되는지 (ADR-0170 정신) | 설계 대안마다 검토 (`design-delta.md`) | 다안(화면만)이라 서버·API가 안 바뀌어 섞일 것이 없음 (ADR-0173) [확정] |

## 슬라이스 선택 기록

- ICE 점수 없음. 사용자가 직접 고름: "이걸로 번외로 cycle 아주 간단하게 시작하자" (2026-11-01). 이유: "넘으면 바로 503이 아니라 그냥 대출 결과만 제외하고 알려주려고"
- 범위·명세·화면·설계 결정은 작은 사이클이라 **결정 페이지 한 장**에 모아 묻는다 (`easy/2026-11-01-decisions.html`) [확정] (사용자 승인, 결정 페이지 2026-11-07)

## 영향 받을 곳 [확정] (사용자 승인, 결정 페이지 2026-11-07)

- 모듈: `availability`(스트림 응답, 자리 거절 처리)만. `usagelog`는 새 기록 없음(정한 대로). `catalog`·`library`는 그대로
- 표·API: 변경 없음 (다안, ADR-0173)
- 화면: `web/src/features/search/InstantResults.tsx`, `BookList.tsx`에서 뺀 책 줄 조각, `web/src/features/book/BookPage.tsx`, 안내 줄·단추 스타일(`ResultList.module.css`), 테스트(`blocked.test.tsx`, 책 화면). `holdingPlan.ts`·`useHoldings.ts`·`blocked.ts`·`ResultRow.tsx`·추천도서 책 창은 그대로 (`design-delta.md` 웹 표)
- 문서: `docs/current/api.md`(오류 코드·스트림 행), `flows.md` 흐름 22, `docs/settings-index.md` 3절 설명
