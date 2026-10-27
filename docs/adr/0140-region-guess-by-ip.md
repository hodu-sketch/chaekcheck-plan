# ADR-0140: 첫 화면 예시용 IP 시·도 추정 `GET /api/v1/regions/guess` (지금은 웹이 부르지 않음)

Status: Accepted (사후 기록)
Date: 2026-10-23
Cycle: 22-first-screen-usability 회고 (dev가 계획 밖에서 만든 것을 기록만 함)
Supersedes: 없음 (ADR-0139의 "서버 변경 없음"과 어긋남)

## 배경

사이클 22는 "웹만"(AC-18)이었지만, 사용자가 운영 화면을 보며 dev에서 직접 고치는 동안(v1.2.0~v1.9.10, 2026-10-19~24) 아래 변경이 들어갔다. plan을 거치지 않았으므로 사이클 22 회고(`docs/cycles/22-first-screen-usability/retro.md`)에서 dev main `d3c2696`을 읽고 사실대로 적는다(사용자 2026-10-23 "전부 지금 맞춤"). 값은 모두 [확정] (dev 구현 확인, 2026-10-23).

## 결정 (구현된 것)

1. `region` 모듈 `RegionController.guess()` → `{"sido": "부산"}` 또는 `{"sido": null}`, `Cache-Control: no-store`. IP는 nginx가 넣는 `X-Real-IP` 하나만 읽음(`X-Forwarded-For`·`CF-Connecting-IP`는 안 읽음). IP는 저장·기록·캐시하지 않음(코드 주석 "The address is not kept or logged, and the answer is not cached.")
2. `SidoByIp`가 classpath `geo/kr-sido.csv.gz`(DB-IP 무료 city 목록에서 한국만, CC BY 4.0, 만드는 스크립트 dev `scripts/geo/build_kr_sido.py`)를 처음 물을 때 읽어 이진 탐색. 소개 화면에 DB-IP 출처 표기
3. 처리방침 2판: `sitecontent/003-privacy-policy-v2.yaml`(changeset `sitecontent-003-privacy-policy-v2`), 시행 2026-10-20, 목적에 「첫 화면 지역 예시(IP 주소로 시·도만 확인하고 따로 저장하지 않음)」. 파일에 "시행일을 배포일로 맞추고 공지를 넣을 것" TODO. 공지는 운영 SQL로 넣음(저장소에 없음)
4. **v1.9.8(`e509551`)부터 웹이 이 주소를 부르지 않음**: 첫 화면 예시 카드가 KAIST 책장(`GET /api/v1/picks/shelf`)으로 바뀜. `fetchSidoGuess()`·`startExamples.ts`는 남아 있으나 그려지지 않음

## 이유

- 첫 화면 예시 카드를 방문자의 시·도로 보이려고(v1.9.0, 커밋 `8547303`). 사용자 말은 기록에 없음 [이유 미확인]
- 웹에서 뺀 이유도 [이유 미확인]

## 남은 것 [확인 필요]

- 쓰지 않는 서버 길과 처리방침 2판의 IP 목적 줄을 남길지 지울지 — 사용자에게 질문 (지우면 처리방침 3판)
- 처리방침 2판 시행일·공지 기록(dev 질문 #15)
