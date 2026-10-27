# ADR-0144: 추천목록 표지는 웹 서버가 파일로 줌 (`/covers/<sha1>.jpg`), DB에는 사서 표지만

Status: Accepted (사후 기록)
Date: 2026-10-23
Cycle: 22-first-screen-usability 회고 (dev가 계획 밖에서 만든 것을 기록만 함)
Supersedes: 부분 대체: ADR-0091 중 "이동진·서울대 표지도 가져오기에 실어 DB에" 부분

## 배경

사이클 22는 "웹만"(AC-18)이었지만, 사용자가 운영 화면을 보며 dev에서 직접 고치는 동안(v1.2.0~v1.9.10, 2026-10-19~24) 아래 변경이 들어갔다. plan을 거치지 않았으므로 사이클 22 회고(`docs/cycles/22-first-screen-usability/retro.md`)에서 dev main `d3c2696`을 읽고 사실대로 적는다(사용자 2026-10-23 "전부 지금 맞춤"). 값은 모두 [확정] (dev 구현 확인, 2026-10-23).

## 결정 (구현된 것)

1. nginx `location ~ "^/covers/[0-9a-f]{40}\.jpg$"`, `root /srv`, `Cache-Control "public, max-age=604800"`. 운영 볼륨 `/srv/chaekcheck/covers:/srv/covers:ro`. 파일 이름 = sha1(표지 원래 주소) (`CoverFiles.path`), 한 폴더
2. 개발: vite `covers()` 플러그인이 `COVERS_DIR`(기본 `../scripts/crawl/lists/covers`)에서 줌
3. `picks.cover`에는 사서추천 표지만(`/api/v1/picks/covers/{id}`, `public, max-age=2592000, immutable`). 반영 파일과 `lists` 모드는 그림을 싣지 않음, `deleteUnusedCovers`가 남은 것 정리
4. 수집 쪽 `fetch-covers`(`covers/covers.sqlite`, `covers/<앞 2자리>/<sha1>.jpg`, 2026-10-23)는 **서비스가 쓰지 않음** — 폴더 짜임도 nginx `/covers/`(한 폴더)와 다름

## 이유

- 커밋 `9eb17dd` 제목 "(user)" (v1.8.1, 2026-10-20). 사용자 원문 [이유 미확인]

## 남은 것 [확인 필요]

- `fetch-covers` 결과를 서비스 표지로 잇는 방법과 폴더 짜임(dev 질문 #13)
