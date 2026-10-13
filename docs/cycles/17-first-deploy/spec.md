# 기능 명세: 첫 배포

- 범위: [`scope.md`](scope.md) 포함 1~10. 포함 10(대출 조회 나가는 길)은 아래 "R13" 절, 기준은 [ADR-0095](../../adr/0095-lookup-egress-proxies-per-ip-browser-ua.md) (사용자 작성, 2026-10-14)
- 세부 사실과 출처는 옮기지 않고 링크함: [`research.md`](research.md), [`hosting-options.md`](../../research/deploy/hosting-options.md) 결정 줄, [`aws-layout.md`](../../research/deploy/aws-layout.md), [`db-memory.md`](../../research/deploy/db-memory.md)

## 사용자 이야기

- 검색하는 사람은 `https://chaekcheck.com`에서 지금처럼 책과 대출 현황을 보고 싶다, 집 PC가 꺼져 있어도
- 검색하는 사람은 카카오로 로그인해 내 도서관을 저장하고 싶다
- 운영자는 2주 동안 서버 상태를 숫자로 보고 싶다 (사용자: "프로메테우스나 그라파나 node_exporter같은거", 2026-10-12)
- 운영자는 비밀 값을 AWS 서비스에 두고 써 보고 싶다 (사용자: "해보자 그냥 써보고 싶어", 2026-10-13)

## 동작 규칙 (정해진 값은 링크한 곳이 기준)

| # | 규칙 | 기준 문서 | 상태 |
|---|---|---|---|
| R1 | Lightsail 서울 4GB 한 대에 Docker로 띄움 | [hosting-options 결정 줄](../../research/deploy/hosting-options.md), [scope 포함 1](scope.md) | [확정] |
| R2 | `chaekcheck.com`(Cloudflare 구매) + Cloudflare Tunnel, http → https | [scope 포함 2](scope.md), dev `deploy/nginx/tunnel-test.conf` | [확정] |
| R3 | nginx가 `CF-Connecting-IP`를 사용자 주소로 읽음. 나머지 `/api/`에도 IP별 한도 | [research 7절](research.md), dev `deploy/nginx/rate-limits.conf` | [확정] 나머지 `/api/`(클릭 알림 제외)는 IP마다 1초에 5번, 몰아서 30번(`limit_req` `burst=30 nodelay`), 넘으면 429 (사용자 승인, 2026-10-13, `easy/2026-10-13-spec-decisions.html` #1) |
| R3-1 | 믿는 주소: Docker에서는 `cloudflared`가 compose 네트워크를 거쳐 nginx에 붙으므로 `127.0.0.1`이 아니라 그 네트워크 주소를 믿음. compose에서 nginx·`cloudflared` 네트워크의 주소 범위를 직접 정하고(예: `172.30.0.0/24`) `real_ip_header CF-Connecting-IP; set_real_ip_from <그 범위>;` 하나만 둠. dev `tunnel-test.conf`의 사설 주소 전체(`10/8`·`172.16/12`·`192.168/16`)는 쓰지 않음 | 사용자 제시 설정(2026-10-13), dev `deploy/nginx/tunnel-test.conf` | [확정: 네트워크 주소를 믿음] (사용자: "그 내용 spec에 반영해줘", 2026-10-13) / 범위 값 [안] |
| R3-3 | 클릭·행동 알림 주소(`/api/v1/usage-events`, 2026-10-14 15가 `/api/v1/library-clicks`에서 바꿈)의 IP당 1분 60번 한도는 15가 둠. 15의 화면 행동 알림(사서 추천 보기, 지역·내 도서관 바꾸기)도 이 주소로 와서 같은 한도를 받음 → 17의 "나머지 `/api/`" 한도(R3)는 이 주소에 걸지 않음 | 사이클 15 (2026-10-13) | [확정] |
| R3-2 | nginx 포트는 서버 바깥으로 열지 않음. 사용자는 터널로만 들어옴 → 누가 `CF-Connecting-IP`를 가짜로 붙여 직접 보내는 것을 막음 | R3-1과 같음, [scope 포함 1](scope.md)(80 닫기) | [확정] (같음) |
| R4 | 첫 배포 직전 seed 다시 만들기·`PRE_DEPLOYMENT` 지우기, 책 목록은 PC에서 가져와 반영 | `docs/backlog.md` "첫 배포 직전" 줄, ADR-0078, 사이클 11 | [확정] |
| R5 | 비밀 값은 Parameter Store 또는 Secrets Manager, 서버에는 읽기용 접근 키 한 쌍 | [research 1절](research.md) | [확정] Parameter Store Standard, 암호화 문자열, 경로 하나 아래(예: `/chaekcheck/prod/…`) (사용자 승인, 2026-10-13, `easy/2026-10-13-spec-decisions.html` #2) |
| R6 | 카카오 운영 등록(Redirect URI, 웹 도메인, 동의항목), 카카오만 켬 | [research 2절](research.md) | [확정] |
| R7 | 시행일 = 공개일, 공개일에 16 개발이 끝났는지 확인 | [research 6절](research.md) | [확정] |
| R8 | 운영 메모리 값 다시 재기 (15 몫 포함). 디스크: Lightsail 4GB 묶음 SSD 80GB에 DB 평소 약 8.5GiB + 반영 때 두 벌(약 16GB) + 백업 2개 + 이미지·로그를 넣고, 15 이용 기록이 1년 몇 GB까지 늘 수 있음(15, 2026-10-13, 운영 뒤 측정) → 디스크 사용량을 Grafana에서 지켜봄 | backlog "배포 사이클" 줄, [research 7절](research.md) | [확정: 잼] |
| R9 | Prometheus·Grafana·node_exporter 직접, Spring Actuator 지표 | [hosting-options 결정 줄](../../research/deploy/hosting-options.md), [research 5절](research.md) | [확정] / 바깥에서 보기: 터널에 `grafana.chaekcheck.com`을 더하고 Grafana 로그인(익명 끔)으로 막음, Prometheus·`/actuator/prometheus`는 바깥에 열지 않음 [확정] (사용자 승인, 2026-10-13, #3) |
| R10 | DB 백업 매일 03:00, 내 PC가 내려받음 | [research 7절](research.md), [scope 포함 8](scope.md) | [확정] / 보관: 서버 최근 2개, 내 PC 최근 7개, 더 오래된 것은 지움 [확정] (사용자 승인, 2026-10-13, #4) |
| R11 | nginx 접속 기록 14일, 쿼리 문자열 빼고 경로만 | [research 7절](research.md) | [확정] |
| R11-1 | 서비스(앱) 로그는 14일 보관(접속 기록과 같음). 도서관 요청 응답을 서버 로그로만 남김(IP 없음) | 사이클 15 질문 (2026-10-14) | [확정] (사용자 승인, 2026-10-14) |
| R10-1 | DB 백업 보관: 서버 2일치, 내 PC 7일치(매일 1개씩). 처리방침에는 "백업 7일" | 사이클 15 질문 (2026-10-14) | [확정] (사용자 승인, 2026-10-14) |
| R12 | 15 기록은 첫 배포 때 꺼짐, 지인 기간 실서버 시험 뒤 지움, 공개일에 켬 | [research 7절](research.md) | [확정] |
| R12-1 | 로그인 쿠키(`access_token`) 경로가 `/api/v1`로 넓어짐(ADR-0102). nginx는 `/api/`를 그대로 넘기므로 쿠키를 건드리는 설정 없음 | 사이클 15 (2026-10-14) | [확정] |

## R13. 대출 조회 나가는 길 (포함 10, 사용자 작성)

- 사용자 이야기: 운영자는 여러 사람의 대출 조회를 서비스가 대신 하므로, 막혀도 끊기지 않게 여러 나가는 길로 보내고 싶다 (사용자: "다른 사람들 대신하는거라서 똑같은거라고", 2026-10-14)

| # | 규칙 | 상태 |
|---|---|---|
| R13-1 | 나가는 길 세 가지를 설정으로 고름: ① 본 서비스 직접(서버 자기 IP) ② 본 서비스 직접 + 업체 프록시 여러 곳 ③ 조회 서버(조회 서버마다 업체 프록시 여러 곳). 나간 길·업체를 조회 기록에 남김 | [확정] (사용자, 2026-10-14) |
| R13-2 | 업체 프록시는 IP가 바뀌지 않는 고정 IP 상품만, 주소·인증은 비밀 값(Parameter Store) | [확정] (사용자, 2026-10-14) |
| R13-3 | 도서관 한 곳에 보내는 양은 나가는 IP마다 따로 셈. 교보 구독형 서버는 IP마다 동시 3건, 그 밖은 IP마다 동시 1건·1초 | [확정] (사용자, 2026-10-14) |
| R13-4 | 한 IP가 어느 사이트에서 막히면 그 IP만 그 사이트에서 멈추고, 다른 IP로는 계속 | [확정] (사용자, 2026-10-14) |
| R13-5 | User-Agent는 일반 브라우저와 같은 값, 우리 서비스 이름을 넣지 않음 | [확정] (사용자, 2026-10-14) |
| R13-6 | 수집기는 이 규칙 대상 아님(ADR-0094 그대로) | [확정] |

### 수용 기준 (R13)
- AC-8: 설정에서 나가는 길을 "직접 + 업체 프록시 두 곳"으로 두고 여러 번 조회하면 → 조회 기록에 나간 IP가 두 곳으로 번갈아 남는다
- AC-9: 한 프록시 IP가 어느 도서관에서 막히면 → 그 도서관은 다른 IP로 계속 조회되고, 다른 도서관은 영향이 없다

### 확인 필요 (R13)
| 항목 | 확인 방법 | 막는 단계 |
|---|---|---|
| 업체 고르기 (한국 고정 IP 상품, 최소 수량, 월 비용) | 공식 페이지 + 사용자 결정 ([research 3절](research.md)) | 설계 |
| 업체의 "정부 사이트" 제한에 `go.kr` 등 공공 전자도서관이 들어가는지 | 업체 지원팀에 질문 ([research 3절](research.md)) | 설계 |
| 업체 약관(자동 요청·속도 제한 관련 조항)과 R13-3·R13-4가 맞는지 | 업체 약관 확인 ([research 3절](research.md)) | 설계 |
| Java에서 인증 프록시 쓰기 (`jdk.http.auth.tunneling.disabledSchemes`) | 프로토타입 ([research 4절](research.md)) | 개발 |

## 상태별 동작

- 로딩·결과 없음·입력 오류: 지금 화면 그대로 (바뀌는 화면 없음)
- 서버·터널이 멈춤: Cloudflare 오류 화면이 보임 [확인 필요: 배포 시험]
- 도서관 사이트 오류·지연: 지금 코드 그대로 ("확인 못 함")

## 수용 기준 ([scope 완료 기준](scope.md)과 같음)

- AC-1: 휴대폰 데이터망에서 `https://chaekcheck.com`을 열면 → 검색 결과와 대출 현황이 나온다
- AC-2: 카카오로 로그인하면 → 내 도서관을 저장할 수 있다
- AC-3: 같은 IP에서 한도보다 많이 요청하면 → 429가 오고, 다른 IP의 요청은 영향받지 않는다
- AC-4: Grafana에서 → CPU·메모리·응답 시간·도서관 호출 포기 횟수가 보인다
- AC-5: 서버 밖(내 PC)에 → 전날 03:00 DB 백업 파일이 있다
- AC-6: nginx 접속 기록에 → 쿼리 문자열이 없고, 15일 지난 파일이 없다
- AC-7: 휴대폰 데이터망으로 검색한 뒤 → nginx 접속 기록에 그 휴대폰의 IP가 찍힌다(compose 네트워크 주소나 `cloudflared` 주소가 아님)

## 비목표

- 화면 바꾸기 (서비스 주소 표시 외) — 범위 밖
- 대출 조회 나가는 길 — 이 명세 밖, ADR-0095 다시 정함
- 노트북 이전, AWS WAF, DB 크기 줄이기 — [scope 제외](scope.md)

## 확인 필요

| 항목 | 확인 방법 | 막는 단계 |
|---|---|---|
| `chaekcheck.com` 구매 가능 여부 | 사용자가 Cloudflare에서 확인 | 배포 |
| Lightsail CPU 종류, 한국 데이터센터 IP를 도서관이 받는지 | 서버에서 시험 ([scope 먼저 조사할 것](scope.md)) | 배포 |
| 정식 터널에서 `CF-Connecting-IP`, 운영 nginx 이미지 realip | 배포 시험 ([research 7절](research.md)) | 배포 |
| 배포 때 계정에서 옮길 값(AWS 계약 법인, Cloudflare 연락처·쿠키) | 계정 확인 ([research 6절](research.md)) | 공개일 |

## 판정

- **설계 진행 가능** (배포 부분, R1~R12) — 남은 [안]은 R3-1 네트워크 범위 값 하나이며 설계 단계에서 정함
- **R13(대출 조회 나가는 길)도 이 사이클에 포함** [확정] (사용자: "이거 이번 첫 배포에서 할거야", 2026-10-14). 기준은 ADR-0095. 다만 켜기 전에 아래 네 항목을 먼저 풀어야 함(업체 고르기, 정부 사이트 제한, 약관, Java 프록시) → 이 넷이 R13 설계·개발의 선행 조건. 배포 부분(R1~R12)과 R13은 한 사이클 안에서 함께 가되, R13은 네 항목 확인 뒤 설계·개발을 이어 감
