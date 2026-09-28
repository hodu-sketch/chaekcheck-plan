---
name: screen-flow
description: Draw the screen flow and per-screen states for the current chaekcheck cycle slice as Mermaid, desktop first. Use after /feature-spec, or when the user asks how the slice's screens connect.
---

Write `flow.md` in the current cycle folder. Cover only the screens this slice needs. This is structure and states, not visual design.

## Steps

1. Read `scope.md` and `spec.md`.
2. Draft the flow and show it to the user before saving. Ask about entry points and navigation you would otherwise assume.
3. Check that every AC in `spec.md` appears on some screen and every state in 상태별 동작 has a screen state.

## Template (Korean, screen IDs in English)

````markdown
# 화면 흐름: <slice>

```mermaid
flowchart LR
  S1[search: 검색] -->|검색어 입력| S2[search-results: 결과 목록]
  S2 -->|결과 없음| S2e[빈 상태]
```

## 화면별 내용
### S1 search
- 목적 / 보이는 요소 / 사용자 동작 / 호출하는 API(이름만, 상세는 design-delta)
- 상태: 기본 / 로딩 / 빈 결과 / 오류
- 데스크톱 기준 배치 메모, 태블릿·모바일에서 달라지는 점 [안]

## 수용 기준 대응
| AC | 화면 |
````

Next step: `/design-delta`.
