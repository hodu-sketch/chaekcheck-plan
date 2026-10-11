# 사이클 13 plan 세션에 보낼 글: 사이클 11 반영 파일에 도서관 부분을 실을 때 지킬 것

- 작성: 2026-10-12 (chaekcheck-plan, 사이클 12가 될 세션)
- 근거: dev `docs/plan-feedback.md` "# 사이클 11" → "사이클 13과 맞물리는 것 (plan 알림, 2026-10-12)"(2959~2968행, 커밋 `ac26ee2`). 사용자 승인 (2026-10-12, `docs/cycles/11-separate-import/easy/2026-10-12-interim-decisions.html` #1)
- 사용자가 아래 "보낼 글"을 사이클 13 plan 세션에 붙여 넣습니다. 이 세션은 `docs/cycles/13-crawler-to-dev/`를 고치지 않았습니다.

## 보낼 글

> 사이클 13 "사전 결정 6"(도서관 넣기는 내 PC에서, 운영에는 사이클 11 반영 파일에 새 도서관·가입 규칙·짝 표를 함께 실어 "도서관 → 짝 표 → 책" 순서로)에 대해, 사이클 11 dev가 구현하면서 본 것을 넘겨요 (2026-10-12).
>
> **이미 자리가 있는 것**
> - 반영 파일의 작은 표 `load_manifest`에 `format_version`(지금 1)이 있음. 도서관 부분을 실으면 2로 올리고, 옛 앱은 다른 판 파일을 반영하지 않음(지금 코드가 이미 거절)
> - 파일은 `catalog_next` 스키마를 통째로 담는 `pg_dump -Fc`라 작은 표(도서관·가입 규칙·짝 표)를 더 실을 수 있음. `catalog`는 `load_manifest.notes`를 해석하지 않으니 도서관 부분은 `collection`·`library`가 읽는 짐으로 둘 수 있음
> - 사이클 11 인계서에도 "나중을 위해 열어 둘 것 (사이클 13)"을 넣어 둠(plan `docs/current/handoff.md`)
>
> **설계 때 지킬 것 (dev가 본 것)**
> 1. 바꿔 끼우기의 `DROP SCHEMA catalog_next`는 CASCADE 없이 돎. 더한 표는 `load_manifest`처럼 바꿔 끼우기 **전에** 지워야 함(아니면 바꿔 끼우기가 실패)
> 2. "도서관 먼저 넣고 비교"하려면 비교 전에 그 부분을 읽어야 함. 파이프로 만든 `-Fc`는 데이터 위치가 없고 표 데이터가 이름 순이라, 표 하나만 읽어도 파일을 훑음(600MB 파일이면 수 초~수십 초). 작으면 `load_manifest`처럼 표 설명(COMMENT, 목차)에 싣는 방법이 있음 — 사이클 11은 `load_manifest`를 COMMENT에도 넣어 목차만 읽음(1초 안)
> 3. 지금 두 DB 비교의 도서관 해시는 `enabledLibraryRefs()`(켜진 도서관의 id·주소·화면 종류)뿐. **가입 규칙은 비교에 없음.** 가입 규칙도 파일로 옮기면 비교에 넣을지 정해야 함
>
> **참고 숫자 (사이클 11 실데이터)**: 반영 파일 606MB, 반영 비교 3.2초, 복원 65초, 운영 역할 DB(상한 1GB) 색인 2분 30초. 근거 dev `plan-feedback.md` "# 사이클 11" 7단계, plan `docs/cycles/11-separate-import/retro.md`(중간 회고)
