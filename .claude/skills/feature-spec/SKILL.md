---
name: feature-spec
description: Write the feature spec (user stories, rules, states, acceptance criteria, non-goals, data sources, open items with how to verify them) for the current chaekcheck cycle slice only, ending with a ready-for-design verdict. Use after /cycle-start, or when the user describes how the current slice should behave.
---

Write `spec.md` in the current cycle folder (see `Current cycle:` in `CLAUDE.md`). If there is no current cycle, tell the user to run `/cycle-start` first.

## Steps

1. Read `scope.md`. Only include behavior that is inside its 포함 section.
2. Research the "먼저 조사할 것" items first. Use official sources; record URL and check date. Check `docs/reference-index.md` first: if a listed document already records the answer (with its source and check date), link it instead of researching again.
3. Ask the user (AskUserQuestion, up to 4 questions at a time) about rules you would otherwise guess: input rules, sorting, what to show when data is missing.
4. Write the spec. Put newly discovered out-of-scope ideas into `docs/backlog.md`, one line each.
5. Finish with the verdict section and tell the user the verdict.
6. Review `spec.md` with the `plan-canvas` skill in proposal review mode (when `ecc-plan-canvas` is installed). Once every `[안]` is decided, go straight on to `/screen-flow` without asking.

## Rules

- Never invent a plausible requirement. Anything not confirmed or verified goes to 확인 필요 with **how it will be verified**: 공식 문서 확인, API 호출 시험, 사용자에게 질문, 프로토타입.
- 비목표 lists what this slice deliberately does not do, even if it seems natural (for example: 로그인, 즐겨찾기, 정렬 옵션). This is narrower than scope.md's 제외: it covers behavior inside the slice's own screens.
- Every AC must be checkable on screen or by an API call.

## Template (Korean)

```markdown
# 기능 명세: <slice>

## 사용자 이야기
- <누가> <무엇을> 하고 싶다, <왜>

## 입력과 출력
| 항목 | 내용 | 규칙 | 상태 태그 |

## 동작 규칙
## 상태별 동작
- 로딩 / 결과 없음 / 외부 API 오류·지연 / 입력 오류

## 수용 기준
- AC-1: 주어진 상황 … 할 때 … 그러면 …

## 비목표
- <이번 슬라이스 화면 안에서도 하지 않는 것> — 이유 또는 [이유 미확인]

## 데이터 출처
| 데이터 | 출처 | 이용 조건·제한 | 확인일 | 상태 태그 |

## 확인 필요
| 항목 | 왜 필요한가 | 확인 방법 | 막는 단계 |
|---|---|---|---|
| 예: 전자도서관 대출 가능 여부 API 존재 | AC-2 | 공식 문서 확인 + API 호출 시험 | 설계 |

## 판정
- **설계 진행 가능** — 설계를 막는 확인 필요 항목이 없음
- 또는 **확인 필요** — 설계 전에 풀어야 할 항목: <목록>
```

Next step: `/screen-flow` (it can run while 확인 필요 items are being checked; `/design-delta` waits for a 설계 진행 가능 verdict).
