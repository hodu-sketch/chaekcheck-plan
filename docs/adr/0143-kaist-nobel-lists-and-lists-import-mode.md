# ADR-0143: 추천목록 KAIST·노벨연구소와 가져오기 `lists` 모드, 기본 탭 KAIST

Status: Accepted (사후 기록)
Date: 2026-10-23
Cycle: 22-first-screen-usability 회고 (dev가 계획 밖에서 만든 것을 기록만 함)
Supersedes: 부분 대체: ADR-0123의 "추천목록은 export/apply 반영 파일에 실어 바꿔 끼운 뒤 넣음"(이동진·서울대·KAIST·노벨에 한해 `lists` 모드가 따로 있음), 사이클 21 탭 차례

## 배경

사이클 22는 "웹만"(AC-18)이었지만, 사용자가 운영 화면을 보며 dev에서 직접 고치는 동안(v1.2.0~v1.9.10, 2026-10-19~24) 아래 변경이 들어갔다. plan을 거치지 않았으므로 사이클 22 회고(`docs/cycles/22-first-screen-usability/retro.md`)에서 dev main `d3c2696`을 읽고 사실대로 적는다(사용자 2026-10-23 "전부 지금 맞춤"). 값은 모두 [확정] (dev 구현 확인, 2026-10-23).

## 결정 (구현된 것)

1. 목록 키: `librarian`, `leedongjin`, `snu100`, `kaist`, `nobel` (`PicksCache.LISTS`, 그 밖은 404 `list_not_found`)
2. `picks-003`(kaist CHECK·행), `picks-004`(kaist는 `year_book` 필수, 색인 `(year_book, position) WHERE list_key='kaist'`), `picks-005`(nobel). `year_book`(원래 이동진용)을 KAIST 추천 해로도 씀. `usagelog-006/007`이 `screen_event.picks_list` CHECK에 kaist·nobel
3. 가져오기 `lists` 모드(v1.6.0, `576f6d8`): `--spring.profiles.active=collection-import --chaekcheck.collection.import.mode=lists`, 입력 `chaekcheck.collection.import.lists-dir`(기본 `../scripts/crawl/lists`)의 `fields.tsv`·`leedongjin.tsv`·`snu100.tsv`·`kaist.tsv`·`nobel.tsv`·`covers/`. **지금 DB 목록에 바로 맞춰** 이동진·서울대·KAIST·노벨 줄만 지우고 다시 넣음. 사서 줄과 목록 표·`catalog_import`는 건드리지 않음. 사이클 21의 export/apply 길(manifest `listPart`, 바꿔 끼운 뒤 넣기)도 남아 있음
4. 웹 탭 `PICKS_TABS = [KAIST, 국립중앙도서관, 서울대, 노벨연구소]`, 이동진은 주소로만. `/picks` → `/picks/kaist`
5. 한 목록 안 같은 책은 한 번만(`sameBookKey`, `ac72dd9`). 메인 책장 `GET /api/v1/picks/shelf`(`{list:"kaist", books}`, no-store): 분야마다 1권, 누구나 가입 도서관이 가진 책·표지 있는 책 중 보유 도서관 수 상위 10권에서 무작위, 최신 해부터

## 이유 (사용자 발언, dev 기록)

- "Picks: KAIST tab first and the default list (user)" (커밋 `2b00128`, 2026-10-19), 노벨 목록·KAIST 해별 목록도 사용자 요청(커밋 제목 "(user)"). 인용 원문은 [이유 미확인]

## 남은 것 [확인 필요]

- 두 반영 길(`lists` 모드와 export/apply)을 함께 둘지 (dev 질문 #5)
