# 수집 세션에 넘길 메모: 수집 DB 도서관 이름 289곳 바꾸기 (2026-10-12)

- 보내는 곳: chaekcheck-plan (사이클 09 회고)
- 결정: 수집 DB 이름도 서비스와 같게 바꿈 [확정] (사용자: "이렇게 가자", 2026-10-11, 사이클 09 spec R1-7). 방법과 때는 "수집 세션이 지금 한 번에" [확정] (사용자 승인, 2026-10-12, `docs/cycles/09-library-naming/easy/2026-10-12-retro-decisions.html` #2)
- 근거: `docs/cycles/09-library-naming/retro.md` "plan이 정할 것" 2, dev `docs/plan-feedback.md` "# 사이클 09" 2424행

## 해 줄 일

1. 목록 파일: dev `data/cycle09/collection-rename-list.tsv` (git 밖). 칸: 서비스 번호, 수집 번호, 최종 이름. 289줄, 그중 237줄은 수집 번호가 서비스 번호와 다름 → 반드시 **수집 번호**로 고침(짝 `collection_link` 기준)
2. 때: 수집기(`crawl_catalog.py` 등)가 돌지 않을 때 한 번에
3. 방법: 수집 DB `library` 표에서 **수집 번호와 옛 이름이 둘 다 맞을 때만** 이름을 바꿈(서비스 changeset 013·014와 같은 꼴). 맞지 않는 줄은 바꾸지 말고 목록으로 남김
4. 건드리지 않는 것: 이미 만든 사본(`chaekcheck-data/snapshots/…`), 서비스 DB
5. 기록: 바꾼 줄 수, 맞지 않아 건너뛴 줄과 까닭을 수집 세션 문서(dev `docs/maintenance/` 쪽 수집 기록)에 남기고 plan에 알림

## 같은 자리에서 정할 것 [확인 필요: 수집 세션]

- 수집이 업체를 따로 적는 자리: 지금 seed 스크립트에는 빈 자리 `COLLECTION_VENDORS = {}`와 `TODO(확인 필요)`만 있음 (dev `scripts/library/build_candidate_seed.py:96-98`)
- 제안 [안]: 수집 DB `library`에 업체 칸 하나를 두고, 화면 종류 대응표와 다른 사이트가 나왔을 때만 적음. 수집 세션 의견을 받아 plan에서 정함

## 왜 필요한가

바꾸지 않으면 다음에 후보 도서관 seed를 만들 때 수집 DB의 옛 이름(괄호 포함)이 다시 들어올 수 있음. 지금은 seed 스크립트가 `name_overrides.tsv`(295줄)로 고쳐 읽어 막고 있음.
