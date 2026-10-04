---
name: design-delta
description: Design only the module, table and REST API changes the current chaekcheck cycle slice needs, using the architect subagent for alternatives. Writes design-delta.md in the cycle folder. Use after /screen-flow.
---

Write `design-delta.md` in the current cycle folder: the change from `docs/current/` that this slice needs, nothing more.

## Steps

1. Read `scope.md`, `spec.md`, `flow.md` and `docs/current/`. If the slice touches library collection or classification, book collection, or book normalization or grouping, also read the documents `docs/reference-index.md` lists for that topic, and pass their paths to the `architect` subagent.
2. Delegate to the `architect` subagent. In the task, name the cycle folder and ask for alternatives only where there is a real choice.
3. Show the user the alternatives and the recommendation (안), and let the user choose. Do not choose for them.
   - If `ecc-plan-canvas` is installed (`ecc-plan-canvas --help` succeeds), save the proposal as `architect-proposal.md` in the cycle folder and review it with the `plan-canvas` skill in proposal review mode, so the user decides each `[안]` (승인/미승인/기타) in the browser.
   - Otherwise ask with AskUserQuestion.
4. For each choice the user makes, run `/adr` so the decision and the user's stated reason are recorded.
5. Write `design-delta.md` from the chosen alternatives. Check it against the dev skills:
   - `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev\.claude\skills\spring-modulith\SKILL.md`
   - `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev\.claude\skills\postgres-patterns\SKILL.md`
   - `C:\Users\yujun\Documents\Claude\Projects\chaekcheck-dev\.claude\skills\api-design\SKILL.md`
6. Draw the design diagrams in Mermaid (section `구조 그림` in the template). Draw only what this slice adds or changes, at design level, not code level:
   - Module diagram (`flowchart`): modules and services this slice touches, and which calls which (public API, events, external sites).
   - Sequence diagrams (`sequenceDiagram`): one per main flow in `spec.md`/`flow.md`, including failure paths that change behavior (timeouts, fallbacks).
   - Domain model (`classDiagram`): core concepts, key attributes and relationships with multiplicity. No methods, no framework classes, no package names beyond the module.
   - State diagram (`stateDiagram-v2`): only when the slice has state that changes by rules.
   Detailed class diagrams of real classes are not drawn here; they come from the dev code (Spring Modulith `Documenter`).
   **Always show the diagrams to the user as rendered pictures, not only as Mermaid text in the file.** Do this every time the diagrams are written or changed:
   - If `ecc-plan-canvas` is installed, open `design-delta.md` with the `plan-canvas` skill (it renders Mermaid).
   - Otherwise build one HTML page in the scratchpad with every Mermaid block of `구조 그림` and the `erDiagram` **pre-rendered as inline SVG**. The file viewer on the user's phone does not run scripts, so a page that loads Mermaid at view time shows raw code. Render the SVGs first in the built-in browser: serve a small local page from the scratchpad that imports Mermaid (`https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs`) with `htmlLabels:false` (no `foreignObject`), renders each diagram in the light theme (the user does not use dark mode), and POSTs the SVG strings back to the local server. Then write the page: one card per diagram with a one-line caption, SVG at about 75% of natural width inside a horizontal-scroll box, light theme only, no scripts. Check it at mobile width, then send it with `SendUserFile` (`display: render`).
   - Prefer top-to-bottom (`flowchart TB`) for module diagrams so they fit a phone.
   - If the canvas is unavailable, say so in one line so the user knows why a page was sent instead.
7. Do not edit `docs/current/` yet; `/cycle-close` merges the delta after review.
8. Review `design-delta.md` with the `plan-canvas` skill in proposal review mode. Once every `[안]` is decided, go straight on to `/cycle-close` without asking.

Precondition: `spec.md` ends with the verdict **설계 진행 가능**. If it says **확인 필요**, list the blocking items and stop.

## Template (Korean, identifiers in English)

````markdown
# 설계 변경: 사이클 NN <slice>

## 구조 그림
### 모듈 구성도
```mermaid
flowchart LR
```
### 주요 흐름
```mermaid
sequenceDiagram
```
### 도메인 모델
```mermaid
classDiagram
```

## 모듈
| 모듈 | 신규/변경 | 책임 | 공개 API | 발행/구독 이벤트 | 소유 테이블 |

## 데이터
- 스키마: <module schema>
```mermaid
erDiagram
```
| 테이블.컬럼 | 타입 | 제약 | 설명 | 상태 태그 |
- Liquibase: 새 changelog 파일로 추가 (기존 changeset 수정 없음)

## API
| 메서드 | 경로 | 설명 | 요청 | 응답 | 에러 |
- 요청/응답 예시 JSON

## 외부 연동
| 대상 | 방식 | 제한·키 관리 | 실패 시 동작 | 상태 태그 |

## 결정 기록
- ADR-NNNN <제목>

## 확인 필요
````

Next step: `/cycle-close`.
