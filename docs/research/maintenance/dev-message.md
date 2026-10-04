# dev 세션에 붙여 넣을 메시지 (ADR-0047 옮기기)

- 작성 2026-10-04. 사용자가 dev 세션에 직접 붙여 넣습니다 [확정] (사용자 선택 "ADR 추가 + 요청서를 내가 dev에 전달", 2026-10-04)
- 사용자가 직접 넣는 이유: 다른 세션이 보낸 메시지를 dev 세션은 참고 정보로만 받고, 그것만으로는 작업하지 않습니다. 사용자가 넣어야 dev가 사용자의 요청으로 받습니다. 2026-10-04 확인 때 dev 세션 `chaekcheck-dev-cycle-05`는 사이클 05를 개발 중(busy)이었습니다
- 보낼 때:
  - 1단계(문서)는 사이클 05 개발이 한숨 돌렸을 때, 또는 새 dev 세션에서 보냅니다
  - 2단계(수집기 코드)는 전체 수집이 끝난 뒤 보냅니다. 끝났는지는 plan 세션에 "수집 끝났어?"라고 물으면 확인해 드립니다(예상 2026-10-06 0시 무렵)
- 아래 회색 상자 안을 그대로 복사해 붙여 넣습니다

## 1단계: 문서 옮기기 (지금 가능)

```
plan의 ADR-0047에 따라 정기 유지보수 절차를 dev docs/maintenance/ 한 곳에 모으려고 해.
요청서를 읽고 "A. 문서"만 해 줘. "B. 수집기 코드"는 수집이 끝난 뒤 따로 말할게.

- 요청서: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\research\maintenance\dev-move-request.md (요청 본문 A~C)
- 결정 기록: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\adr\0047-maintenance-procedures-in-dev.md

지킬 것:
- plan 문서는 읽기만 하고 고치지 마. plan 쪽 정리는 plan 세션이 할 거야
- 파일 이름·구성은 요청서에 [안]으로 적혀 있어. 바꾸면 이유를 docs/plan-feedback.md에 적어 줘
- "3-import.md"에 적을 실행 조건(수집 중에 가져오기를 돌려도 되는지)은 코드 보고 판단해서 적어 줘
- 사이클 05 작업과 섞이지 않게 커밋은 따로 해 줘
- 끝나면 옮긴 파일 목록과 바꾼 점을 docs/plan-feedback.md 맨 아래 "# 사이클 밖: ADR-0047 옮기기" 절에 적어 줘
```

## 2단계: 수집기 코드 옮기기 (전체 수집이 끝난 뒤)

```
plan ADR-0047 요청서의 "B. 수집기 코드"를 해 줘. 전체 수집은 끝났어.

- 요청서: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\research\maintenance\dev-move-request.md (B절)
- 수집기 지금 위치: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\ (git 밖)

지킬 것:
- 시작 전에 수집기가 돌고 있지 않은지 확인해 줘 (python 프로세스 중 "crawl_catalog.py full"이 없어야 함). 돌고 있으면 멈추지 말고 나한테 알려 줘
- 코드만 dev scripts/crawl/로 복사하고, chaekcheck-data 안의 원본·수집 DB·logs·secrets는 지우거나 옮기지 마
- secrets/(국립중앙도서관 인증키), ebook-catalog.sqlite, logs/, other-platforms/, queue-by-ip.txt는 git에 넣지 마. 인증키 내용은 열거나 출력하지 마
- 수집 DB 위치는 환경 변수나 인자로 받게 하고, 기본값은 chaekcheck-data 폴더로 해 줘
- 옮긴 수집기로 "status" 명령 하나만 돌려 수집 DB를 읽는지 확인해 줘. 사이트에 요청하는 명령(full 등)은 돌리지 마
- 끝나면 docs/plan-feedback.md "# 사이클 밖: ADR-0047 옮기기" 절에 결과를 더해 줘
```

## dev가 끝낸 뒤

plan 세션에 "dev가 ADR-0047 옮기기 끝냈어"라고 알려 주세요. plan 세션이 dev `docs/plan-feedback.md`를 읽고 요청서 D(plan 문서 머리말 정리, 색인 고치기)를 합니다.
