# ADR-0141: 「지역 외는 방문 가입」 — `library.visit_outside_region` 칸과 실효 방문 계산

Status: Accepted (사후 기록)
Date: 2026-10-23
Cycle: 22-first-screen-usability 회고 (dev가 계획 밖에서 만든 것을 기록만 함)
Supersedes: 없음 (ADR-0013 자격 모델·ADR-0027 방문 가입 정렬에 더함)

## 배경

사이클 22는 "웹만"(AC-18)이었지만, 사용자가 운영 화면을 보며 dev에서 직접 고치는 동안(v1.2.0~v1.9.10, 2026-10-19~24) 아래 변경이 들어갔다. plan을 거치지 않았으므로 사이클 22 회고(`docs/cycles/22-first-screen-usability/retro.md`)에서 dev main `d3c2696`을 읽고 사실대로 적는다(사용자 2026-10-23 "전부 지금 맞춤"). 값은 모두 [확정] (dev 구현 확인, 2026-10-23).

## 결정 (구현된 것)

1. `library-017-visit-outside-region`: `library.library.visit_outside_region boolean NOT NULL DEFAULT false`
2. 실효 방문 여부는 서버 `library.internal.LibraryService`가 계산: `visitRequired || (visitOutsideRegion && eligibility != ELIGIBLE)`. 결과가 계획 정렬(ADR-0027)과 `visit=none` 거르기에 쓰임
3. API에 두 칸: `visitRequired`(계산값), `visitOutsideRegion`(저장값) — `targets.libraries[]`(`SearchTarget`)와 `GET /api/v1/libraries`(`LibraryEligibility`). 웹은 둘 다 true면 「지역 외는 방문 가입」
4. 데이터: `library-018`(서울 60·61·223·230, 광주 133·277), `library-019`(울산동부 361, 양주 94, 창원 의창 148·387, 제주 1109·2267 등), `library-021`(김천 269·313, 광산 40·264, 금산 267, 강북 17, 목포 65, 광주 남구 233)

## 이유

- 사용자: "지역 외는 방문 가입: residents of a library's region join online, others visit" (커밋 `721987b` 제목, v1.7.0, 2026-10-19). 그 밖 [이유 미확인]

## 남은 것 [확인 필요]

- 원문이 애매한 6곳(dev 질문 #6), 「전남광주」 같은 데이터 글(#11) — `docs/backlog.md` "사이클 22 회고에서"
