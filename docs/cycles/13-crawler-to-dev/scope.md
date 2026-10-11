# 사이클 13: 수집기를 dev로 갈아타기 + 도서관 넣기를 collection 모듈로 (초안)

- 상태: **초안** (2026-10-12)
  - 사이클 11이 진행 중이고, 12는 "책 묶기 기준 다시 보기"로 잡혀 있어 미리 범위만 잡아 둠
  - 사용자: "이 작업 cycle 13인 걸로 하자", "새 사이클 말고 지금 사이클에서 같이 해" (2026-10-12)
- 아직 안 한 것: `/cycle-start` 1단계(앞 사이클 retro, `docs/current/` 맞추기)
- 폴더 이름 `13-crawler-to-dev` [안]
- 근거
  - 결정 기록: `docs/research/maintenance/crawler-move.md` 5절
  - 결정 페이지: `docs/research/maintenance/easy/2026-10-12-crawler-move-decisions.html`
  - backlog: "수집기를 서비스 쪽으로 옮길지", "수집기 코드 구조 정리"
  - 앞선 결정
    - ADR-0047: 절차·수집기는 dev, 수집이 끝난 뒤 옮김
    - ADR-0052: 번호 짝 표는 `collection`
    - ADR-0060: 가져오기는 `collection`
    - ADR-0067: 교보 대여·혼합 제외
  - 이름 규칙: ADR-0071, ADR-0076 (사이클 09)
  - dev 기록: `docs/plan-feedback.md` "# 사이클 밖: ADR-0047 옮기기" B·C (10-05 복사)

## 목표 (한 문장) [안]

수집을 dev 코드로 갈아타고, 새 도서관을 서비스에 넣는 일을 앱 재시작 없이 `collection` 모듈의 명령으로 하며, "후보"라는 말을 이름에서 없앤다.

## 이미 정한 것 [확정] (사용자, 2026-10-12)

| # | 항목 | 값 |
|---|---|---|
| 1 | 갈아타기 | 지금 갈아탐. 전체 수집이 끝난 것으로 봄(받을 곳은 다 받음, 교보 대여·혼합 제외, 수집기는 10-06 밤부터 멈춤) |
| 2 | 옛 코드 | 데이터 폴더의 `scripts\`, `resume.cmd`를 보관 폴더로 옮겨 **백업으로 두고 지우지 않음** (사용자: "옛 코드는 보관 폴더로 옮기고 백업 용으로 하고 지우지는 마") |
| 3 | 데이터 폴더에만 있는 도구 | `refill_pubdt.py` → 수집기 명령으로. `fetch.py`, `probe_logos.py`, `probe_home_logos.py` → dev `scripts/library/`. `apply_rename.py`는 옮기지 않음. 수집 DB `library.vendor` 칸 → 수집기 표 만들기 코드에 |
| 4 | 코드 구조 정리 | 이번에는 하지 않음. 옮기기·갈아타기만. 구조 정리는 backlog |
| 5 | 도서관 넣기 담당 | **`collection` 모듈이 명령으로 넣음, 앱 재시작 없이** (사용자: "나는 재시작 없이 하고 싶어 나. collection 모듈이 넣음으로 해줘") |
| 6 | "후보" 없애기 | 문서의 "후보 도서관"을 없앰 |
| 6 | 이름 바꾸기 | 스크립트·폴더 이름을 바꿈. 새 이름 예 [안]: `build_library_seed.py`, `build_seed_first278.py`, `scripts/library/discover/` |
| 6 | 그대로 두는 것 | 이미 적용된 Liquibase seed 파일 이름(Liquibase는 파일 경로로 변경을 알아봄) |
| 7 | 진행 | 1~6을 이 사이클에서 함께 함 |

## 포함 [안]

1. 갈아타기 (dev 작업, 설계 없음)
   - dev `scripts/crawl/`로 첫 실행
   - 옛 코드 보관
   - 데이터 폴더 도구 옮기기
   - `vendor` 칸 반영
   - plan 쪽 도구 위치 정리(ADR-0047 요청서 F)
2. 도서관 넣기를 `collection` 모듈로 (설계 필요)
   - 지금 `build_candidate_seed.py`(Python)가 하는 규칙을 명령으로 옮김:
     - 넣을 도서관 고르기
     - 새 번호
     - 이름
     - 업체·대출 방식
     - 가입 조사 상태
     - 같은 사이트 거르기
     - 번호 짝 표
   - `collection`이 `library` 표에 쓰게 되는 모듈 경계 (Spring Modulith: `library` 공개 API로 넣을지 등)
   - 가입 규칙(`eligibility_rule`) 줄도 같이 넣을지, 사람이 정한 값(`join_overrides.tsv`, `name_overrides.tsv`)을 어디에 둘지
   - 지금 seed로 들어간 도서관과 앞으로 명령으로 들어갈 도서관의 관계(이미 있는 seed는 그대로 두는지)
   - 새 도서관과 그 책을 한 명령으로 함께 넣을지(가져오기와 묶기)
3. "후보" 이름 정리 (dev 코드·문서, plan 문서)

## 제외 [안]

- 수집기 코드 구조 정리(갈래별·화면별 나누기): backlog
- 자동 갱신: 사이클 11에서 제외한 것과 같음
- 수집기를 Java(backend)로 다시 쓰기: 이번에는 Python 수집기를 그대로 옮김 [확인 필요: 사용자]

## 확인 필요

| 항목 | 방법 |
|---|---|
| 도서관 넣기 명령이 수집 DB를 직접 읽는지, 사본을 읽는지 | 설계 (가져오기와 같은 방식 [안]) |
| 이미 seed로 들어간 2,600여 곳과 명령으로 넣는 곳을 어떻게 함께 관리할지 | 설계 |
| 사이클 11(가져오기 따로 하기)과 겹치는 곳: 가져오기 서버에서 도서관도 넣는지 | 사이클 11 결과를 보고 `/cycle-start`에서 |
