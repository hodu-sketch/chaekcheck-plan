# dev 작업 요청: 책 표지 받기 `fetch-covers` (2026-10-23)

- 보낸 곳: plan (사이클 밖 작은 작업, 사용자 승인 2026-10-23 "dev에 작은 작업 요청서로 넘겨요", `easy/2026-10-23-cover-collection-decisions.html` #6)
- 결정 근거: `crawl-method.md` 1절 "표지", 결정 페이지 `easy/2026-10-23-cover-collection-decisions.html`(#1~#6), `easy/2026-10-23-cover-source-decisions.html`(#1)
- 사용자 말: "이번에는 책 이미지도 같이 수집해줬으면 해. 대신 우리가 사용하는 크기로 압축해서", "국가 사이트에서 책 표지 따로 받는거 생각했는데"

## 할 일
- `scripts/crawl/`에 새 명령 `fetch-covers` [안 이름]. 목록 수집(`full`)과 따로 돌고, 목록 수집이 끝난 수집 DB를 읽음
- **책 하나에 표지 한 장** [확정]: 서비스 책 번호(가져오기 결과) 기준으로 그 책을 가진 소장 줄의 `cover_url` 중 하나를 고름. 책 번호를 어디서 읽을지(내 PC 서비스 DB `catalog.book`·`holding` SELECT만 / 가져오기가 남기는 파일)는 dev가 정하고 보고 [안]
- **받는 차례** [확정]: ① 도서관 표지 YES24(`image.yes24.com`) → 북큐브(`bookimg.bookcube.com`) → 그 밖 서버 ② 없거나 실패하면 국립중앙도서관 ISBN 서지 API `TITLE_URL`(ISBN이 있는 책) → 소장자료 검색 `imageUrl`(`cover.nl.go.kr`, 제목). 사이클 21 `recommended_lists.py`의 표지 코드와 `cover_sources.tsv` 차례를 같이 씀
- **교보 구독형 서버 `*.dkyobobook.co.kr`(표지 서버 `dcontent.dkyobobook.co.kr` 포함)에는 보내지 않음** [확정] (사이클 13 R1-6). 교보 구독형에만 있는 책은 ② 국가 사이트로
- **크기** [확정]: 폭 200px JPEG 품질 0.8(ADR-0091, `recommended_lists.py` `COVER_WIDTH`), 원본 5MB 넘으면 안 읽음, 빈 그림은 해시로 건너뜀(사이클 21과 같게)
- **예절** [확정]: 서버(IP)마다 한 번에 1건, 1초 간격, 서버가 다르면 동시에(목록 수집과 같은 IP 줄). 국립중앙도서관은 한 줄
- **저장** [확정]: 데이터 폴더 `covers\`(git 밖). 파일 이름·책 번호와의 짝 표(TSV나 SQLite)는 dev가 정함 [안]. 이어 받기(이미 받은 책은 건너뜀)
- **서비스에는 아직 넣지 않음** [확정]: 표 칸·가져오기·반영 파일·화면은 바꾸지 않음. 서비스에 보이기는 따로 사이클(backlog "우리 전자책 표지를 서비스 DB로", 출판사 권리 확인)

## 알고 있는 숫자 (plan이 2026-10-23 수집 DB에서 셈)
- 빠지지 않은 소장 줄 중 표지 주소가 있는 줄 2,614만, 서로 다른 주소 920만, 서버 783곳
- 주소가 많은 서버: `bookimg.bookcube.com` 54.8만, `dcontent.dkyobobook.co.kr` 43.3만(안 감), `image.yes24.com` 24.2만, `contents.dasangng.co.kr` 19.1만
- 지금 있는 200px 표지 3,000장 평균 12KB → 책 160만 권이면 약 20GB [추정]
- 국립중앙도서관 ISBN 서지 `TITLE_URL`은 이동진 43권 중 40권이 비었음(사이클 21 dev 0단계), 하루 한도 안내 없음. 1초 1건이면 160만 번에 약 19일 → 도서관 표지로 못 채운 책만 물음

## 보고
- dev `docs/plan-feedback.md`에 `# 표지 받기 (2026-10-23 요청)` 절: 명령·저장 꼴, 받은 장 수(출처별), 못 받은 책 수, 걸린 시간, 디스크 크기
