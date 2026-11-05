# 인계 현황 (2026-11-05 갱신)

> 이 파일은 열린 사이클 목록과 교차 규칙만 둡니다. 사이클별 인계서는 각 사이클 폴더 `handoff.md`에 있습니다. 전체 사이클 상태는 `docs/cycles/README.md`를 봅니다.

## 열린 사이클

| 사이클 | 상태 | 인계서 |
|---|---|---|
| 28 자리가 다 차도 책 목록은 보이기 | 계획 중 (번외·아주 작게, 화면만 고침) | `docs/cycles/28-busy-keeps-book-list/` |
| 24 AI 책 찾기 | 인계 끝, dev 진행 중 | `docs/cycles/24-ai-book-search/handoff.md` |
| 20 조회 상태 신호 + 확장 | 인계 끝, 1단계 dev main. 2·3단계는 백로그 | `docs/cycles/20-lookup-status-and-extension/handoff.md` |

## 교차 규칙

### ADR-0170 DB 변경 규칙 (사이클 27에서, **이후 모든 사이클 적용**)

무중단 배포(블루·그린)에서 옛 판과 새 판이 같이 도는 동안 DB가 둘 다 맞아야 합니다.

- **허용**: 칸 더하기(NULL 또는 기본값), 표 더하기, 색인 더하기, 읽기만 하는 뷰 더하기
- **금지(한 번에)**: 칸 지우기, 칸 이름 바꾸기, 칸 타입 바꾸기, NOT NULL 더하기(기본값 없이), CHECK 바꾸기
- **금지된 것을 해야 하면**: 두 번 나누거나(1차: 새 칸 더하기+쓰기, 2차: 옛 칸 지우기), 점검 배포(짧은 중단, 지금 방식)
- 체크리스트: `docs/cycles/27-zero-downtime-deploy/handoff.md` "ADR-0170 DB 변경 체크리스트" 절

### plan-feedback 기록 규칙 (2026-11-05)

- 기존 `docs/cycles/plan-feedback.md`(dev 경로, 옛 `docs/plan-feedback.md`)는 동결합니다. 새 글을 더하지 않습니다
- 새 사이클의 dev 피드백은 **`docs/cycles/NN/plan-feedback.md`**(dev 쪽 사이클 폴더)에 씁니다
