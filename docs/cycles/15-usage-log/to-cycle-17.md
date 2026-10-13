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
| 백업·서버 로그 보관 기간 | 질문 중 | 4차 |

---

사이클 17 세션에 전달합니다. 사이클 15(사용자 행동 기록)가 배포 설정에 기대는 것입니다.

1. 사용자 IP (가장 중요)
   - 15 서비스는 IP를 nginx가 넘기는 `X-Real-IP` 머리글에서 읽음 (dev `deploy/nginx/chaekcheck-locations.conf:17`, 값은 nginx의 `$remote_addr`). 서비스 쪽 forwarded 설정은 쓰지 않음
   - 그래서 17의 nginx가 `CF-Connecting-IP`를 사용자 주소로 읽게 하는 설정(`real_ip_header CF-Connecting-IP`, `set_real_ip_from` = cloudflared가 nginx에 붙는 주소)이 들어가야 `$remote_addr`·`X-Real-IP`가 실제 사용자 IP가 됨. `ngx_http_realip_module`은 기본 빌드에 없을 수 있음(https://nginx.org/en/docs/http/ngx_http_realip_module.html) → 쓰는 nginx 이미지에 있는지 확인 부탁
   - 이 설정이 없으면: 15 기록의 IP가 모두 cloudflared 주소 하나가 되고, 지금 있는 "도서관에서 직접 찾기" IP당 1분 30번 제한과 15의 클릭 알림 IP당 1분 60번 제한이 모든 사용자를 한 사람으로 세어 함께 막음
   - 터널을 거쳐도 `CF-Connecting-IP`가 붙는지 배포 때 시험 결과를 15에 알려 주세요

2. 15가 dev에 더할 nginx 설정 (15 인계서로 들어감, 17 설정과 겹치지 않게)
   - `location = /api/v1/library-clicks` (POST, 클릭 알림): IP당 1분 60번, 넘치면 기록하지 않고 204
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
