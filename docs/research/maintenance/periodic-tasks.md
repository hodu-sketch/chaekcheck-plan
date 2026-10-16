# 정기 유지보수 작업: 도서관 목록 → 책 목록 → 서비스 반영 (초안, 원본은 dev)

> **원본이 dev `docs/maintenance/`로 옮겨 감 (2026-10-17 확인).** 이 문서는 이제 dev 문서를 가리키는 안내만 둡니다. 절차·명령·확인할 숫자는 아래 dev 문서를 봅니다. 둘이 어긋나면 dev가 맞습니다 (원칙 [확정] (사용자, 2026-10-01), ADR-0047).

- 작성 2026-10-04 (사용자 요청: "실제적으로 내가 이 프로젝트를 유지보수하는데 주기적으로 필요한 작업이 1. 서비스하는 전자도서관 목록 찾기 2. 전자도서관 목록으로 도서 찾기", "그리고 3.찾은 도서 목록으로 도서 찾기가 있다"). 2026-10-17에 옛 절차 글(옛 수집 입구 plan `crawl-runbook.md`, 데이터 폴더 `resume.cmd`, 옛 프로필 `catalog-import`, dev `plan-feedback.md`의 가져오기 방법)을 지우고 안내 문서로 바꿈. 옛 글은 git 기록에 있음
- dev 저장소 위치: `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev\` (아래 "dev `…`"은 이 폴더 기준)
- 문서 색인: `docs/reference-index.md` 0절·8절

## 정기 작업 → dev 문서

| 정기 작업 | 주기 (dev 문서에 적힌 값) | 절차 원본 (dev) | 실행 도구 (dev) |
|---|---|---|---|
| 한눈에 보기·체크리스트(한 바퀴) | 갈래마다 아래 | `docs/maintenance/README.md` 0절(주기 표)·"체크리스트" | — |
| ① 도서관 수집: 등록 도서관 확인, 수집 목록에서 새 도서관 찾기, 서비스 DB에 넣기 | [안] 월 1회 + 운영 로그 신호가 있을 때 | `docs/maintenance/1-libraries.md` (→ `docs/library-maintenance.md`), 사람이 정한 값 목록 `docs/maintenance/rules-index.md` | 넣기: `backend/`에서 `./gradlew bootRun` 프로필 `library-insert` (규칙 `scripts/library/rules/`) |
| ② 책 수집: 도서관마다 전자책 목록 받기 | 주 1회 전체 + 매일 신간 [확정] (plan `crawl-method.md` 2절). 신간 수집 명령은 아직 없음(dev README 0절) | `docs/maintenance/2-crawl.md`, 플랫폼별 `docs/maintenance/platforms.md` | `scripts\crawl\resume.cmd` (`scripts/crawl/crawl_catalog.py`) |
| 가져오기: 받은 목록을 서비스 DB로 (내 PC 가져오기 → 운영 반영) | [안] ② 전체 수집이 끝날 때마다 | `docs/maintenance/3-import.md` (13절 따로 하기: `export`·`apply`) | `backend/`에서 `./gradlew bootRun` 프로필 `collection-import` |
| (자동) 사서추천도서 받기 | 서버가 매일 05:00에 받을지 따짐(매주 월요일 새 추천) | `docs/maintenance/4-picks.md` | 서버 안 정해진 작업 |
| (자동) 사용 기록 정리 | 매일 04:30 (Asia/Seoul) | `docs/maintenance/5-usage-log.md` 3절 | 서버 안 정해진 작업 |
| (필요할 때) 공지·서비스 안내·약관 글 | 필요할 때 | `docs/maintenance/5-sitecontent.md` | 운영 SQL |
| 날짜가 정해진 다시 확인: 꺼 둔 도서관 id 59·131(2027-01), 중간 인증서 만료(2027-05-21, 2027-11-02) | 그 날짜 | `docs/maintenance/README.md` 1절 5번, `docs/library-site-issues.md` 3절 | — |

운영 서버에서 도는 다른 정기 작업(04:00 회원 정리, 03:00 백업 등)은 아직 dev 절차 문서가 없음 → plan `docs/reference-index.md` 8절 "절차 문서가 아직 없는 정기 작업".

## 옛 5·6절은 어떻게 됐나

- 옛 5절(웹러브 북스 기관을 서비스 도서관으로 옮기기): 사이클 07에서 2,394곳을 넣었고, 사이클 13부터 새 도서관은 `collection` 넣기 명령으로 넣음(ADR-0084). 지금 절차는 dev `docs/maintenance/1-libraries.md` "새 도서관 넣기"
- 옛 6절(확인 필요): "수집 중에 가져오기를 돌려도 되는지"는 dev `docs/maintenance/README.md` 3절이 답함(돌려도 됨, 근거 `3-import.md` 1절). 남은 두 가지는 아래

## 확인 필요

| 항목 | 확인 방법 |
|---|---|
| ① 도서관 수집 주기 (월 1회 [안]), 가져오기 주기 [안] | 사용자에게 질문 (주기 갱신 사이클, plan `docs/research/ebook-catalog/catalog-refresh.md`) |
| ② 매일 신간 수집 명령이 없음 | 프로토타입 (후보 정렬 값은 dev `docs/maintenance/platforms.md`) |
