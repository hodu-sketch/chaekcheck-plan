# 설계 대안: 자리가 다 차도 책 목록은 보여 주기 (사이클 28, 아키텍트 서브에이전트 2026-11-01)

dev 코드만 읽고 쓴 제안입니다(읽기 전용). 이름·값은 모두 [안]. 사용자 결정은 `easy/2026-11-01-decisions.html`에서.

## 코드에서 확인한 것 [확정] (2026-11-01)

- 자리 확인은 `BatchRunner.startHoldings()`가 `slots.acquire()`를 부를 때(`BatchRunner.java:231`). 자리가 없으면 `SearchSlots.acquire()`가 `refusals.mark`(상태 신호 빨강 10초)와 `counters.refused()`(1분 요약 로그)를 남기고 `SearchBusyException`(`SearchSlots.java:52-55`) → 503 `server_busy`, `Retry-After: 5`(`AvailabilityErrors.java:87-91`)
- 첫 스트림은 거절 전에 계획(DB)과 소장 목록을 읽어 `targets`를 다 만들어 둠(`BookAvailabilityStreamController.java:70-92`). 지금은 거절될 때 버려짐
- 한 묶음은 앞에서부터 최대 `holdingBatchSize`(10)개(`BatchRunner.java:247`). `StopReason`은 ROW_LIMIT·CANDIDATES_EXHAUSTED·LAUNCH_CUTOFF·CLIENT_GONE 넷(`StreamEvents.java:115-127`)
- 웹: 503이면 `useHoldings`가 `batch-failed`·`blocked:'busy'`(`useHoldings.ts:72-74, 87-89`), 소장별 상태는 건드리지 않음(`holdingPlan.ts:62-68`)
  - **첫 스트림 거절**: `targets`가 안 와서 `order`가 비어 있고 `InstantResults.tsx:134-141`이 결과 자리를 안내 한 줄로 통째로 바꿈 (문구 `blocked.ts:13`)
  - **다음 묶음 거절**: 받은 결과는 남고 위에 안내 한 줄(`ResultList.tsx:184-188`). 후보는 `holding-requested`를 못 받아 NotRequested로 남으므로 「결과 더 보기」가 같은 후보를 다시 물음 → **지금도 원하는 대로 동작**
- 책 화면 첫 스트림 거절(지금 있는 잘못): `remaining`이 0이라 안내 줄 아래 "이 책을 가진 도서관을 모두 조회했습니다"가 함께 보임(`BookPage.tsx:223-230`, `ResultList.tsx:297-300`). 사실과 다름
- 추천도서 책 창 거절: "대출 정보를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요."(`PicksBookDialog.tsx:222-226`), 책 머리는 보임
- 옛 웹은 모르는 이벤트 이름을 버림(`searchStream.ts:104, 117`); `stopReason`은 타입에만 있고 읽지 않음(`types.ts:188`)
- `holding-failed` 줄은 「확인하지 못한 도서관」 묶음, 문구 "대출 정보를 확인하지 못했어요"(`ResultRow.tsx:23, 136`, `sortBatch.ts:94`)
- `BookItem.holdingLibraryCount`는 계획 기준 개수만, 도서관 번호 없음(`types.ts:240-241`)

## 가안: 스트림을 열고 이번 묶음 소장마다 `holding-failed`(code `server_busy`)

- 서버: 200 SSE. `targets`(첫 스트림만) → 소장마다 `holding-failed {problem:{status:503, code:"server_busy"}, detailUrl}` → `batch-done {requested:0, failed:n, stopReason:"SERVER_BUSY"}` [안] → `done`. `BatchRunner.startHoldings` catch에서 자리 없이 보내고 닫음. 도서관 사이트 요청 없음. 바꿀 파일: `HoldingSession`(묶음을 바쁨으로 끝내는 메서드), `StreamEvents`(enum 값), `BatchRunner`
- 웹: `holdingPlan.ts`에서 `server_busy`면 Failed가 아닌 NotRequested로 되돌림(「결과 더 보기」가 다시 묻게). 줄에 busy 표시, `ResultRow` 문구 "대출 정보는 지금 알 수 없어요" [안]. 다시 물어 결과가 오면 같은 `holdingId`의 busy 줄을 지우는 중복 제거 로직이 새로 필요
- 화면: 첫 스트림·다음 묶음 같게. 책 화면은 같은 reducer라 함께 고쳐짐. 추천도서 책 창은 `latestRowPerLibrary`·단계 넓히기 규칙 확인 필요
- 호환: 옛 웹 + 새 서버 → 10줄이 "확인하지 못했어요"로 보이고 Failed라 다시 못 물음(지금보다는 나음). 새 웹 + 옛 서버 → 503 처리 남아 지금과 같음
- 비용: 서버 4~5 + 웹 4~5 파일. 서버 통합 테스트(사이클 08 AC-18: 소장 스트림도 503) 기대값 바뀜. `server_busy`가 HTTP 오류 코드와 스트림 안 실패 코드 두 뜻을 가짐

## 나안: 스트림을 열고 새 이벤트를 한 번

- 서버: 200 SSE. `targets`(첫 스트림만) → `lookups-unavailable {batchNo, reason:"server_busy", retryAfterSeconds:5}` [안] → `done`. `holding-requested`·`holding-failed` 없음. 바꿀 파일: `BatchRunner`, `StreamEvents`
- 웹: 이벤트 이름 목록에 추가(`searchStream.ts:117`), reducer에 `unavailable` 플래그 [안]. 소장은 NotRequested 그대로라 「결과 더 보기」가 다시 물음. 책 목록을 보이려면 웹이 소장마다 자리표 줄을 직접 만들어야 하고, `targets`에 `detailUrl`이 없어 도서관 책 페이지 링크는 못 달음 → 결국 다안 화면과 같아짐
- 호환: 옛 웹은 새 이벤트를 버려 `targets`·`done`만 받음 → 줄 없이 「결과 더 보기」만, 안내 없음(깨지지는 않음)
- 비용: 서버 3~4 + 웹 5~6 파일, SSE 계약 하나 늘어남. 웹이 다안과 같은 화면을 그리므로 서버를 바꾸는 이득이 작음

## 다안: 웹만 고침 (서버는 503 그대로) — 추천 [안]

- 서버: 바뀌는 것 없음. API·이벤트·오류 코드 그대로
- 웹 `InstantResults.tsx:134-141`: 첫 소장 스트림이 거절되면(`noHoldings && blocked`) 안내로 결과를 바꾸지 않고 ① 이미 받은 `books.items` 목록(줄 모양은 `BookList.tsx`와 같게 제목·저자·출판사·"보유 도서관 N곳") ② 안내 한 줄 "대출 정보는 지금 알 수 없어요. 잠시 뒤 다시 확인해 주세요." [안] ③ 단추 「대출 정보 다시 확인」 [안] — 누르면 `open(books.items, planOptions())`를 다시 부름, 자동 재시도 없음(실행은 단추로 한다는 기존 원칙). `BookList`는 `/books`를 스스로 다시 부르는 구조(`BookList.tsx:12-25`)라 줄 그리는 부분만 작은 컴포넌트로 빼서 함께 씀 [안]
- 다음 묶음(`batches/stream`): 바꾸지 않음(지금도 결과가 남고 「결과 더 보기」로 다시 물음). 문구만 대출 정보 말투로 바꿀지는 선택 [안]
- 책 화면(`BookPage.tsx`): 첫 스트림 거절이면 "모두 조회했습니다" 대신 같은 안내 + 「대출 정보 다시 확인」 → 위 잘못도 함께 고쳐짐
- 추천도서 책 창: 지금 문구가 이미 뜻이 맞음. 문구 통일할 때만 고침 [안]
- 호환·운영: API 변경 없어 옛/새 서버·웹 섞여도 그대로. 블루·그린(ADR-0170) 고려할 것 없음. 거절 기록·빨강 10초·1분 요약 수 그대로
- 비용: 웹 3~4 파일(`InstantResults.tsx`, 책 줄 공용 컴포넌트, `BookPage.tsx`, 문구). 테스트는 `blocked.test.tsx` 첫 스트림 거절 기대값과 책 화면 테스트 하나 정도. 서버 테스트 안 바뀜

## 비교표

| | 가안 (`holding-failed` + `SERVER_BUSY`) | 나안 (새 이벤트) | 다안 (웹만) |
|---|---|---|---|
| HTTP | 200 SSE | 200 SSE | 503 그대로 |
| 새 이름 | `stopReason` 값, 실패 코드 `server_busy` | 이벤트 `lookups-unavailable` | 없음 |
| 바로 보기 첫 스트림 | 10줄 "지금 알 수 없음" + 도서관 링크 | 자리표 줄 또는 책 목록 | 책 목록 + 안내 + 다시 확인 단추 |
| 다음 묶음 | 줄 추가 + 중복 제거 필요 | 안내 한 줄 | 지금 그대로(이미 동작) |
| 책 화면 / 추천도서 책 창 | 함께 고쳐짐 / 규칙 확인 필요 | 화면마다 손봄 | 단추 추가 / 그대로 |
| 다시 묻기 | 「결과 더 보기」(상태 되돌려야 함) | 「결과 더 보기」 | 첫 스트림만 새 단추, 나머지 「결과 더 보기」 |
| 거절 기록·빨강 | 같음 | 같음 | 같음 |
| 옛 웹 + 새 서버 | "확인 못함" 줄, 다시 못 물음 | 안내 없이 단추만 | 문제없음 |
| 손댈 파일(대략) | 서버 4~5 + 웹 4~5 | 서버 3~4 + 웹 5~6 | 웹 3~4 |
| 문서 갱신 | api.md, ADR | api.md, ADR | flows·화면 문서만 |

## 추천 이유 (다안)

- 문제가 첫 스트림에만 있음. 다음 묶음 거절은 지금도 원하는 대로 동작하고, 화면을 통째로 지우는 곳은 `InstantResults.tsx:134-141` 한 곳뿐. 책 목록은 이미 받아 두어 서버가 더 보낼 것이 없음
- 개인 서비스, 서버 한 대, 자리 60개. 거절은 드물고 짧으며 `Retry-After` 5초라 단추 하나로 다시 여는 것으로 충분
- "아주 작은 사이클" 요청에 맞음: 웹 몇 파일, 서버 재배포 불필요, 모듈·표·API 변경 없음
- 잃는 것: 첫 스트림 거절 때 도서관별 줄·도서관 책 페이지 링크는 안 보이고 책 줄만 보임. 꼭 필요하면 가안

## 사용자 결정 필요 (결정 페이지로)

1. 안내 문구·단추 이름 2. 책 줄 모양(책 화면 링크 둘지) 3. 429도 같은 처리를 할지 4. 다음 묶음 거절 문구를 바꿀지 5. 추천도서 책 창 문구 6. 책 화면 "모두 조회했습니다" 오표시 함께 고치기(권함)

## backlog 후보

- 첫 스트림 거절 때도 도서관별 책 페이지 링크 보여 주기(가안 방식)
- 직접 찾기·「더 보기」·AI 검색의 503 안내 정리(이번 범위 밖)
