# 사이클 17(첫 배포)에 전달: 사이클 15가 배포에 기대는 것

- 작성: 2026-10-13, 사이클 15 세션(chaekcheck-plan-cycle-15). 근거 `docs/cycles/15-usage-log/spec.md`, `architect-proposal.md`, ADR-0096·0097(제안됨)
- 15는 아직 개발 전(설계 확정은 12·13·14 회고 뒤). 아래는 15가 들어올 때 배포 설정이 맞춰 줘야 하는 것
- 4차 (2026-10-14): 문서 검증 뒤 정정과 질문 — 맨 아래

## 최종 정리 (2026-10-14 기준)

> 1~3차는 당시 보낸 글 그대로입니다. 그 뒤 바뀐 것은 이 표가 기준입니다. 근거 [spec.md](spec.md), [design-delta.md](design-delta.md)

| 항목 | 지금 기준 | 상태 |
|---|---|---|
| 사용자 IP | 서비스는 `X-Real-IP`(= nginx `$remote_addr`)를 읽음. nginx `real_ip_header CF-Connecting-IP`, `set_real_ip_from` = compose 네트워크 범위(예 `172.30.0.0/24`) | 17 답 반영됨 |
| 사용 알림 주소 | `POST /api/v1/usage-events` 하나 (1차의 `library-clicks`를 바꿈), IP당 1분 60번, 넘치면 204 | 15 인계서 |
| 로봇 거절 | 직접 찾기·대출 조회 location에서 UA에 bot·crawler·spider → 403, `robots.txt`로 `/api/` 금지 | 15 인계서 |
| 로그인 쿠키 경로 | `access_token` 경로 `/api/v1/me` → `/api/v1` (ADR-0102). nginx가 쿠키를 그대로 넘기면 됨 | 4차 |
| 기록 켜기 | `chaekcheck.usagelog.enabled`, 첫 배포 꺼짐, 공개일에 켬 | 확정 |
| 메모리·디스크 | 버퍼 최대 1만 줄(약 5MB), 디스크 1년 많아야 몇 GB(운영 뒤 측정) | 2차 |
| 새벽 작업 | 04:30 기록 정리, 03:00 백업과 겹치지 않음 | 17 답 반영됨 |
| 백업·서버 로그 보관 기간 | 백업 7일(서버 2일치), 서비스 로그 14일 | 17 답 반영됨 (2026-10-14) |

---

사이클 17 세션에 전달합니다. 사이클 15(사용자 행동 기록)가 배포 설정에 기대는 것입니다.

1. 사용자 IP (가장 중요)
   - 15 서비스는 IP를 nginx가 넘기는 `X-Real-IP` 머리글에서 읽음 (dev `deploy/nginx/chaekcheck-locations.conf:17`, 값은 nginx의 `$remote_addr`). 서비스 쪽 forwarded 설정은 쓰지 않음
   - 그래서 17의 nginx가 `CF-Connecting-IP`를 사용자 주소로 읽게 하는 설정(`real_ip_header CF-Connecting-IP`, `set_real_ip_from` = cloudflared가 nginx에 붙는 주소)이 들어가야 `$remote_addr`·`X-Real-IP`가 실제 사용자 IP가 됨. `ngx_http_realip_module`은 기본 빌드에 없을 수 있음(https://nginx.org/en/docs/http/ngx_http_realip_module.html) → 쓰는 nginx 이미지에 있는지 확인 부탁
   - 이 설정이 없으면: 15 기록의 IP가 모두 cloudflared 주소 하나가 되고, 지금 있는 "도서관에서 직접 찾기" IP당 1분 30번 제한과 15의 클릭 알림 IP당 1분 60번 제한이 모든 사용자를 한 사람으로 세어 함께 막음
   - 터널을 거쳐도 `CF-Connecting-IP`가 붙는지 배포 때 시험 결과를 15에 알려 주세요

2. 15가 dev에 더할 nginx 설정 (15 인계서로 들어감, 17 설정과 겹치지 않게)
   - (4차에서 `usage-events`로 바뀜) `location = /api/v1/library-clicks` (POST, 클릭 알림): IP당 1분 60번, 넘치면 기록하지 않고 204
   - 직접 찾기·대출 조회 location에서 User-Agent에 bot·crawler·spider가 든 요청은 403
   - 웹 `public/robots.txt`: `/api/` 크롤러 금지
   - 17이 Cloudflare 무료 요청 한도 규칙을 쓰기로 하면 이 nginx 한도들과 어떻게 나눌지 알려 주세요 (Cloudflare 규칙도 IP 기준)

3. nginx 접속 기록 보관 기간 (17 범위)
   - nginx 기본 접속 기록에는 IP와 검색어가 든 요청 주소가 함께 남음. 15의 검색 기록(IP 30일)과 따로 노는 기록이라, 기간이 정해지면 15·16에 알려 주세요. 검색어가 든 쿼리 문자열을 접속 기록에서 뺄지도 같이 봐 주시면 좋음 (15의 제안, 결정 아님)

4. 기록 켜기 시점 [확정] (사용자 승인, 2026-10-13)
   - 15 기록은 서버 설정 값 하나로 켜고 끔. 첫 배포 때는 꺼 둠(배포 설정 환경 변수에 "꺼짐"), 처리방침 공개일에 켬
   - 첫 배포 뒤 지인 기간에 잠깐 켜서 실서버 시험(터널 거친 IP가 실제 사용자 IP인지, 기록 켜기 전후 속도·메모리) → 끝나면 그 기간 기록을 지우고 다시 끔. 이 시험 때 17의 CF-Connecting-IP 설정을 함께 확인하면 좋음

5. 4GB 서버 몫
   - 15가 더하는 것: 서비스 메모리에 기록 버퍼 최대 1만 줄(약 5MB), DB 연결 추가 없음, 디스크 1년 1~2GB(어림)
   - 15의 AC-16(기록 켜기 전후 검색 응답 시간 10% 안, 메모리 50MB 안)은 Prometheus·Grafana·node_exporter를 켠 상태로 재고 그 메모리도 함께 적을 예정

6. 매일 새벽 작업 시각
   - 15는 매일 04:30(서울)에 기록 지우기(IP 30일 비우기, 1년 지난 줄 지우기)를 돌림. 지금 04:00 회원 정리, 05:00 사서 추천 받기 사이. 17의 백업·점검 작업 시각과 겹치면 알려 주세요

- 2026-10-13 17 답: 접속 기록 14일·쿼리 문자열 뺌, DB 백업 03:00 (겹침 없음) — 15 spec에 반영

---

## 2차 (2026-10-13) — 1차에 덧붙임

사이클 17 세션에 전달합니다 (2차). 사이클 15가 남기는 행동이 늘었습니다(더 보기, 사서 추천 보기, 지역·내 도서관 바꾸기, 직접 찾기 도서관별 응답).
- 디스크: 1년 어림이 1~2GB에서 늘어남(많아야 몇 GB, 운영 뒤 측정). 40GB 디스크 계산에 반영 부탁
- 메모리: 버퍼 상한 1만 줄(약 5MB)은 그대로
- nginx: 화면 행동 알림도 클릭 알림 주소(또는 넓힌 주소)로 오므로 IP당 1분 60번 한도를 같이 받음. 한도를 넉넉히 할지는 지인 기간 시험에서 봄
- 17 답(접속 기록 14일·쿼리 문자열 뺌, 백업 03:00)은 15에 반영함

## 3차 (2026-10-13) — 터널 IP는 15가 조사함

사이클 17 세션에 전달합니다 (3차). 터널을 거친 사용자 IP는 시험을 기다리지 않고 15가 공식 문서로 조사했습니다.
- Cloudflare 공식: Tunnel에서 원 서버는 cloudflared 주소를 보고, HTTP는 `CF-Connecting-IP` 머리글로 방문자 IP를 받음 (https://developers.cloudflare.com/cloudflare-one/networks/connectivity-options/ , 확인 2026-10-13). 이 머리글은 Cloudflare에서 원 서버로 가는 요청에만 붙음 (https://developers.cloudflare.com/fundamentals/reference/http-headers/)
- nginx 설정 (Cloudflare 안내 https://developers.cloudflare.com/support/troubleshooting/restoring-visitor-ips/restoring-original-visitor-ips/ 를 터널에 맞춤):
  ```
  real_ip_header CF-Connecting-IP;
  set_real_ip_from 127.0.0.1;   # cloudflared가 nginx에 붙는 주소. Docker면 그 네트워크 주소 (Cloudflare 주소 목록 아님)
  ```
  그러면 `$remote_addr`(= 15가 읽는 `X-Real-IP`, IP별 요청 한도의 기준)가 사용자 IP가 됨
- 배포 때 확인 한 줄: `nginx -V`에 `--with-http_realip_module`이 있는지 (nginx.org 패키지는 들어 있을 것으로 보임, 추론)
- 지킬 것: Cloudflare의 "Remove visitor IP headers" 설정은 끈 채로, nginx 포트는 바깥에 직접 열지 않음 (열려 있으면 누구나 `CF-Connecting-IP`를 꾸며 보낼 수 있음)

- 위 `127.0.0.1`은 Docker 밖에서 돌릴 때 기준. Docker에서는 아래 17 답대로 compose 네트워크 범위
- 2026-10-13 17 답: Docker에서는 `set_real_ip_from 127.0.0.1`로는 안 되고, compose에서 nginx·cloudflared 네트워크 범위를 직접 정해(예 `172.30.0.0/24`) 그 범위만 믿음. 17 명세 R3 "믿는 주소 범위"에서 정함 — 15 spec R5-2에 반영

---

## 4차 (2026-10-14) — 정정과 질문

사이클 17 세션에 전달합니다 (4차). 사이클 15 문서를 검증하다 정정할 것과 여쭐 것이 생겼습니다.

[정정]
- 1차의 클릭 알림 주소 `/api/v1/library-clicks`는 `/api/v1/usage-events` 하나로 바뀌었습니다 (도서관 클릭과 화면 행동을 함께 받음). 한도는 같음: IP당 1분 60번, 넘치면 204
- 로그인 쿠키(`access_token`) 경로가 `/api/v1/me`에서 `/api/v1`로 넓어집니다 (ADR-0102, 15 인계서로 dev에 들어감). nginx는 쿠키를 그대로 넘기기만 하면 되고, 17 설정에서 할 일은 없을 것으로 봅니다. 쿠키를 건드리는 설정이 있다면 알려 주세요

[질문]
1. DB 백업 보관 기간: 매일 03:00 백업을 며칠 두나요? 15는 IP를 30일 뒤 비우고 기록을 1년 뒤 지우는데, 백업에는 그 기간만큼 더 남습니다. 처리방침(16)에 그 기간을 적어야 합니다
2. 서비스(애플리케이션) 로그 보관 기간: 15는 도서관 요청 하나하나의 응답(도서관·결과·걸린 시간)을 서버 로그로만 남깁니다(IP 없음). 서비스 로그를 며칠 두는지 알려 주세요
- 2026-10-14 4차를 사용자가 전달함 (사용자: "전달했어")
- 2026-10-14 17 답: 백업 보관 7일(내 PC 기준, 서버 2일치), 처리방침 문구 "지운 정보는 백업에 7일 동안 남았다가 지워집니다" 가능, 서비스 로그 14일, 두 정정은 17 spec에 반영, nginx는 쿠키 건드리는 설정 없음 — 15 spec R3-7·R6-4에 반영, 16에 7차로 전달

---

## 5차 (2026-10-14) — 15 인계 끝, 배포에 넣을 실제 값과 결정

사이클 17 세션에 전달합니다 (5차, 17 요청 "요약 말고 실제 값·결정"에 답함). 사이클 15는 2026-10-14 dev에 인계했습니다(`docs/current/handoff.md` = 15 인계서, ADR-0096·0097·0102 Accepted).

| 항목 | 값·결정 | 17이 할 일 | 근거 |
|---|---|---|---|
| 기록 켜기 설정 | `chaekcheck.usagelog.enabled`, 기본 `false`. 환경 변수 `CHAEKCHECK_USAGELOG_ENABLED` [안: 이름, dev가 바꿀 수 있음] | 첫 배포 환경 설정에 `false`. 처리방침 공개일에 `true`로 바꿔 다시 켬. 지인 기간 실서버 시험 때만 잠깐 켜고 그 기록을 지움 | spec R3-6, ADR-0097 |
| 기록 정리 시각 | 매일 04:30 Asia/Seoul (IP 30일 뒤 비움, 이상한 알림 30일, 나머지 1년). 설정이 꺼져 있어도 정리는 돎 [안] | 03:00 백업과 겹치지 않음 — 할 일 없음 | spec R3-5 |
| 보관 (17 답 반영) | DB 백업 7일, 서비스 로그 14일, nginx 접속 기록 14일·경로만 | 이미 17 결정 | 4차 답 |
| 메모리 | 기록 버퍼 최대 1만 줄(약 5MB), DB 연결 추가 없음 | 4GB 계산에 5MB | spec R3-2 |
| 디스크 | 1년 많아야 몇 GB(어림, 운영 뒤 측정) | 40GB 계산에 여유 | 2차 |
| nginx 사용 알림 한도 | `location = /api/v1/usage-events`, IP(`$binary_remote_addr`)당 60r/m, burst [안: 20 nodelay], 넘치면 기록 안 하고 204 | **dev가 15 9단계에서 `deploy/nginx/`에 넣음**. 17 배포 설정이 이 파일을 쓰면 그대로 들어감. 17이 conf를 따로 만들면 같은 줄을 넣음 | handoff 9단계 |
| 로봇 거절 | `map $http_user_agent` `~*(bot|crawler|spider)` → 직접 찾기(`^/api/v1/(ebook-searches|book-availabilities)(/batches)?/stream$`)·대출 조회(`^~ /api/v1/availability/`) location에서 403 [안: 코드] | 위와 같음 (dev가 넣음) | handoff 9단계 |
| robots.txt | `web/public/robots.txt`: `User-agent: *` / `Disallow: /api/` | 위와 같음. nginx에서 `/robots.txt`가 `index.html`이 아니라 이 파일로 나가는지 배포 때 한 번 확인 | handoff 9단계 |
| 사용자 IP | 서비스는 `X-Real-IP`(= nginx `$remote_addr`)를 읽음. nginx `real_ip_header CF-Connecting-IP;` + `set_real_ip_from` = compose에서 정한 nginx·cloudflared 네트워크 범위(17 R3) | **17 배포 설정에서 넣음 (15는 안 함)**. 배포 때 `nginx -V`에 `--with-http_realip_module`, Cloudflare "Remove visitor IP headers" 꺼짐, nginx 포트를 바깥에 열지 않음. 지인 기간 시험에서 기록된 IP가 실제 사용자 IP인지 확인 | Cloudflare 문서(3차), spec R5-2 |
| 로그인 쿠키 | `access_token` 경로 `/api/v1` (옛 `/api/v1/me` 쿠키를 지우는 코드는 넣지 않음, 15분 뒤 만료) | nginx는 쿠키를 그대로 넘기면 됨 | ADR-0102 |

[12·13·14 회고 결정 중 17에 닿는 것] (사용자 승인, 2026-10-14, `easy/2026-10-14-retro-decisions.html`)
- **사이클 19(꺾쇠 저자 표기 정리)는 첫 배포 전에 들어갑니다**: 저자 정리 규칙 고침 → 내 PC에서 책 목록 다시 가져오기 → 운영 역할 DB 반영(사이클 11 방식) → 서비스 다시 켬 → 17 첫 배포. dev 순서는 15 지금, 19 이어서. 둘 다 배포 전 (`docs/cycles/19-author-angle-brackets/scope.md`)
- `/picks` nginx 화면 주소: dev 작업 폴더 `deploy/nginx/chaekcheck-locations.conf:91`에 이미 `picks`가 들어 있고 "2026-10-14 터널로 열다 발견" 주석이 있음. main에 커밋됐는지 배포 전에 확인 (회고 결정 #5)
- 사서추천 인증키: 새로 받지 않고 지금 키를 쓰되, 코드가 아니라 설정(운영 비밀값)으로 뺌. 표지 이용 조건·권리자 연락처는 따로 확인하지 않음 (사용자: "어짜피 api받았으니까 괜찮아.... 키 같은 것은 따로 설정으로 빼던가", #23). User-Agent에 서비스 주소 넣기는 [안]으로 backlog에 남음
- 배포 전 작은 일 둘 (backlog): 제목 완전 일치 검색 500 오류(「묘왕동주 1」, #12), 없는 주소 화면(`*` 경로, #24)
- 교보 구독형 서버 책 목록: **첫 배포 뒤** 같은 AWS 계정에 수집용 서버를 잠깐 따로 띄워 그 서버만 다시 받고(ADR-0094: 동시 1건·1초), 결과는 집 PC 가져오기로 넣음. 서비스 서버(4GB)는 쓰지 않음. 사이클 17 뒤 따로 사이클 (사용자: "aws에서 배포하게 될 건데 aws에서 수집을 돌릴 수도 있어", 회고 결정 #17 → 이어서 #2 승인)
- 응답 약 5.2초인 2677 여주대(YES24)·2679 경운대: 읽기 제한 5초 그대로, 운영 뒤 15의 도서관 응답 요약으로 판단 (#18)

## 6차 (2026-10-14, 한 줄) — 19와 배포 순서

사이클 17 세션에 전달합니다 (6차). 사용자: "사이클 17이 먼저지만 실제 배포는 나중에 해도 되니까" → 사이클 17(첫 배포 준비)이 먼저 가고, 사이클 19(꺾쇠 저자 표기 등, 책 목록 다시 가져오기)는 그 뒤에 해도 됩니다. 실제 운영 공개는 19 반영 뒤입니다. 사이클 19는 이제 chaekcheck-plan-cycle-19 세션이 맡습니다(`docs/cycles/19-author-angle-brackets/handover-from-15.md`). 19에는 저자·출판사가 통째로 뒤바뀐 세 도서관(전북특별자치도교육청·경기도교육청·대구 전자도서관)을 바로잡는 일도 들어갔습니다.
