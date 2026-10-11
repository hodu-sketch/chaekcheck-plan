# dev에 전할 메시지: 사이클 09 수집 쪽 결과 (2026-10-12)

- 보내는 곳: chaekcheck-plan (사이클 09 회고)
- 근거: `cycle09-collection-result.md` (수집 세션 기록, 2026-10-12), `docs/cycles/09-library-naming/retro.md` "수집 세션 결과"
- 지금 dev 인계서는 사이클 10이라, 아래 1번(작은 스크립트 일)은 사이클 10과 섞지 말고 따로 할 때 쓰도록 backlog에 둠. 사용자가 dev에 붙여 넣어 전달

## 붙여 넣을 메시지

```
dev 요청서 docs/cycle09-for-collection.md에 대한 수집 세션 답이 왔어(2026-10-12). plan 기록: chaekcheck-plan/docs/research/maintenance/cycle09-collection-result.md

- 수집 DB 이름 바꾸기: 끝. 289곳 중 바꿈 64, 이미 같음 223, 못 바꿈 2(59·131은 수집 DB에 없는 번호). 이미 같았던 223곳은 수집 DB 이름에 처음부터 괄호가 없었고, 괄호 라벨은 서비스 넣기 스크립트가 붙였던 것. 목록 밖 괄호 10곳(서비스에 넣지 않는 줄)도 뗌
- 업체 칸: 수집 DB library.vendor (TEXT NULL, CHECK KYOBO·YES24·BOOKCUBE·ALADIN·PORTAL·IN_HOUSE). 화면 종류 대응표와 다를 때만 채우고 지금 0줄
- 할 일(지금 말고, 사이클 10과 섞지 말고 따로): build_candidate_seed.py의 COLLECTION_VENDORS = {} 자리를 수집 DB에서 읽게 바꾸기
  SELECT id, vendor FROM library WHERE vendor IS NOT NULL
  2026-10-05 사본에는 이 칸이 없으니, 칸이 없으면 빈 값으로 두기. 다음 사본부터 칸이 있음
- 같은 사이트 8곳(SAME_SITE)도 수집 DB에 "같은 사이트"로 표시됨(이제 107곳)
```
