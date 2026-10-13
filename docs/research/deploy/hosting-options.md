# 서버 업체·화면 무료 호스팅·수집 프록시 비교 (사이클 밖 조사)

- 작성: 2026-10-12. 사용자: "aws말고도 여러 업체에 대해서 알려줘", "수집에는 프록시를 쓸까 하는데(속도 등)", "국내 저렴한 걸로 무료 있으면 무료 알려주고", "front는 github랑 연결된거로 무료로 되는데 있다던데 이거 의미 있을가?", "여기서 cycle을 할 건 아니고 좀 조사만 하라는 거지"
- 사용자 계획: "한 2주간 클라우드 체험삼아서 해보다가 노트북 본가에서 굴러다니느거 가져와서 서버 세팅할 예정" (2026-10-12)
- 조사와 방법만 적습니다. 모듈·표·API 설계는 없습니다. 쉬운 설명 페이지: `easy/2026-10-12-hosting-options.html`
- 모든 금액·한도는 각 업체 공식 페이지(또는 공식 가격 API)에서 2026-10-12에 확인. 금액은 페이지에 적힌 통화 그대로, 원화 환산은 하지 않음(환율 미확인)
- 이어지는 문서: `aws-layout.md`(EC2 크기 t4g.medium·gp3 40GiB [확정]), `aws-crawl.md`(수집 서버·국내 1GB 프록시 서버 요금), `db-memory.md`, `docs/research/ebook-catalog/crawl-method.md` 1절(나가는 IP 원칙)

## 1. 필요한 서버 (전제)

- Linux VM 한 대 + Docker: nginx, Spring 서비스(Java 25), 조회 서버, PostgreSQL 18 + `pg_bigm`(직접 운영) — `aws-layout.md` 3절 모양 A [확정]
- 2 vCPU, 메모리 4GiB(8GiB면 여유), 디스크 약 40GB, 고정 공인 IPv4 — `aws-layout.md` 6절 [확정]
- **한국 리전**: 서비스가 검색 때 도서관 사이트에 실시간으로 묻고, 미국 데이터센터 IP로는 6곳 중 4곳이 응답하지 않았음(`aws-layout.md` 끝 절). 한국 데이터센터 IP를 받아 주는지는 아직 시험 안 함 [확인 필요: CloudShell 서울 시험, `aws-crawl.md` 1절]
- 2주 쓰고 노트북으로 옮김 → 시간 단위로 내는 곳이 유리. 2주 = 336시간으로 계산

## 2. 서버 업체 (4GiB급)

2주 금액 = 서버 + 고정 IPv4 + 디스크 40GB 대략값(나가는 데이터 제외).

### 2-1. 해외 업체

| 업체 | 한국 리전 | 4GiB급 (사양) | 월 | 2주 대략 | 고정 IPv4 | 무료·체험 | 나가는 데이터 |
|---|---|---|---|---|---|---|---|
| AWS EC2 | 서울 | t4g.medium 2 vCPU·4GiB $0.0416/h (t3.medium $0.052/h) | 약 $30 | **약 $17.3** (gp3 40GB·IPv4 포함) | 별도 $0.005/h | 신규 계정 크레딧 $100 + 활동 시 최대 $100. 6개월 지나거나 다 쓰면 Free plan 계정 닫힘. Free plan 대상 중 4GiB 이상은 c7i-flex.large(4GiB)·m7i-flex.large(8GiB). Free plan에서 t4g.medium·서울을 쓸 수 있는지 확인 못 함 | 서울 $0.126/GB(계정 전체 무료 한도 뒤) |
| AWS Lightsail | 서울 | 2 vCPU·4GB·SSD 80GB | $24 | 시간 비례면 약 $11 (비례 과금 확인 못 함) | 붙어 있으면 무료 | AWS 크레딧 사용 가능 | 월 4TB 포함, 서울 초과 $0.13/GB(FAQ) |
| Oracle Cloud | 서울·춘천 | **Always Free** Ampere A1(Arm) 합계 2 OCPU·12GB, 디스크 합계 200GB | 무료 | 무료 | 붙일 수 있음 | A1은 춘천 제외 → 서울 가능, 홈 리전에서만, "out of host capacity" 오류 가능, 7일간 CPU·네트워크·메모리 모두 20% 미만이면 회수될 수 있음, 가입 때 카드. 별도 $300 30일 | 월 10TB 무료 |
| Google Cloud | 서울 | e2-medium 2 vCPU·4GiB $0.04298/h | 약 $31 | 약 $16.1 + 디스크(서울 단가 확인 못 함) | 별도 $0.005/h | $300 90일(카드). Always Free e2-micro는 미국 세 리전만 | 서울→한국 $0.19/GiB |
| Azure | Korea Central | B2als v2 2 vCPU·4GiB $0.0468/h | 약 $34 | 약 $17.4 + 디스크 | 별도 $0.005/h | $200 30일(카드). 12개월 무료 VM은 1GiB급 | 월 100GB 무료, 뒤 $0.11~0.12/GB |
| Vultr | 서울 | 2 vCPU·4GB·80GB·3TB | $20 | 약 $9.1 | 포함 여부 확인 못 함 | 확인 못 함 | 초과 $0.01/GB |
| Linode(Akamai) | **없음**(도쿄·오사카) | 2 vCPU·4GB | $24 | 약 $12.1 | 확인 못 함 | $100 크레딧 | 초과 $0.005/GB |
| DigitalOcean | **없음**(싱가포르) | 2 vCPU·4GiB | $24 | 약 $12.0 | 확인 못 함 | 확인 못 함 | 초과 $0.01/GiB |
| Hetzner | **없음**(싱가포르) | CPX22 2 vCPU·4GB | 확인 못 함 | 확인 못 함 | "incl. IPv4" | 확인 못 함 | 확인 못 함 |

### 2-2. 국내 업체 (원화)

| 업체 | 4GiB급 (사양) | 월 | 2주 대략 | 고정 IPv4 | 무료·체험 | 나가는 데이터 | VAT |
|---|---|---|---|---|---|---|---|
| KT Cloud | 2 vCore·4GB | 77,300원 | 약 36,000원 (107원/h) | 기본 포함 여부 확인 못 함, 추가 5,000원/월 | **신규 가입 1개월 안 회원에게 50만원 쿠폰, 3개월 유효, Server는 2vCore 4GB까지 사용 가능**(휴대폰·사업자번호당 1개) | VM당 512GB 무료, 뒤 90원/GB | 확인 못 함 |
| 네이버 클라우드 | High CPU-g3 2 vCPU·4GB, 디스크 별도 | 66,240원 | 약 34,900원 | 별도 5.6원/h | 신규 할인 크레딧 10만원·3개월(결제수단 등록 뒤). Micro(1GB) 1년 무료 | 월 20GB 무료, 뒤 100원/GB | 별도 |
| NHN Cloud | m2.c2m4 2 vCPU·4GB, 디스크 별도 | 약 67,900원 | 약 35,300원 | 별도 5.6원/h | 확인 못 함 | 1GB 무료, 뒤 100원/GB. 국제 전송이 많으면 제한할 수 있다는 문구 | 별도 |
| 가비아 클라우드 Gen2 | High CPU 2 vCore·4GB, 루트 최소 50GB | 55,000원 | 약 30,400원 | 4,000원/월(이전 조사 값, 다시 확인 못 함) | 확인 못 함 | 국내 1TB, 해외 50GB 무료 뒤 500원/GB | 별도 |
| iwinv | vgna_4_n 4 vCPU·4GB·NVMe 50GB | 24,000원 | **약 12,460원**(일 890원 × 14) | 1개 포함(이전 조사), 추가 3,300원/월 | 확인 못 함 | 하루 20GB 무료, 뒤 70원/GB~, 해외도 같은 값 | 별도 |
| 카페24 가상서버 | 자이언트 4GB·SSD 100GB(vCPU 확인 못 함) | 33,000원 + 설치비 22,000원 | 월 단위 | 1개 제공 | 없음(확인 못 함) | 월 1.2TB, 뒤 165원/GB | 포함 |
| 카카오클라우드 | t1i.medium 2 vCPU·4GiB 44.2원/h(2023-09 공지 값, 지금 값 확인 못 함) | 약 31,800원 | 약 14,900원 | 확인 못 함 | 신규 30만원 크레딧(유효기간 확인 못 함) | 확인 못 함 | 확인 못 함 |

### 2-3. 무료로 2주를 버틸 수 있는 곳

| 방법 | 되는 것 | 걸리는 점 |
|---|---|---|
| KT Cloud 신규 쿠폰 50만원 | 2vCore·4GB까지 3개월 | 신규 가입 1개월 안에 받아야 함, 기본 IP·VAT 확인 못 함 |
| Oracle Always Free A1 서울 | 2 OCPU·12GB·200GB를 기간 제한 없이 | Arm(arm64) 이미지 필요(t4g와 같은 시험), 자리 없으면 못 만듦, 쓰임이 적으면 회수 가능, 가입 때 홈 리전을 서울로 |
| 네이버 클라우드 10만원(3개월) | 2주 약 34,900원을 덮음 | 결제수단 등록 |
| 카카오클라우드 30만원 | 2주를 덮을 것으로 봄 | 지금 요금·유효기간 확인 못 함 |
| Google $300(90일)·Azure $200(30일) | 2주를 덮음 | 카드 |
| AWS 신규 크레딧 $100~200 | 2주 약 $17을 덮음 | 신규 계정만, Free plan에서 t4g.medium·서울 사용 가능 여부 확인 못 함. 사용자는 기존 계정을 되찾는 중(`aws-crawl.md` 1절) |

### 2-4. 노트북으로 옮길 때 이어지는 것

- 도메인(Cloudflare에서 `.com` [확정], `docs/backlog.md`)·Cloudflare Tunnel·카카오 설정은 그대로, 터널을 켜는 기계만 바꿈. 클라우드 서버도 터널로 붙이면 옮길 때 DNS를 바꿀 필요가 없음 [안]
- DB는 `pg_dump` → 노트북에 복원(`aws-layout.md` 5절과 같은 순서)
- 노트북의 CPU 종류(Intel/AMD면 지금 이미지 그대로, Arm이면 arm64)·메모리·디스크 [확인 필요: 사용자가 본가에서 확인 (사용자: "본가에서 가져올 노트북 스펙은 기억 안 나 가서 확인할게", 2026-10-13)]
- 노트북 운영에서 신경 쓸 것(이 조사 밖, 집 PC 운영 때 나온 것 재사용): 절전·덮개 닫힘, 재부팅 뒤 자동 시작, 하루 한 번 DB 백업을 다른 곳에, 개발 DB와 분리

## 3. 화면 무료 호스팅 (GitHub 연동)

전제: 화면과 API는 같은 주소여야 함 [확정] (ADR-0042: 로그인 쿠키 `SameSite=Lax`·경로 `/api/v1/...`, 카카오 콜백 `/api/v1/auth/login/oauth2/code/kakao`). 대출 현황 스트림(SSE)이 있음.

| 서비스 | 무료 한도 | 상업적 사용 | GitHub 연동 | `/api`를 같은 주소로 서버에 넘기기 | 헤더·화면 주소 |
|---|---|---|---|---|---|
| Cloudflare Pages | 빌드 월 500회, 정적 파일 요청 무제한 | 약관에서 제한 문구 못 찾음(제한 없음으로 확정한 것 아님) | push 자동 배포, 브랜치·PR 미리보기 | `_redirects`로는 바깥 서버로 못 넘김. Pages Functions가 받아 서버로 fetch하면 됨(하루 10만 건 무료 한도에서 차감) | `_headers`(Functions 응답에는 안 붙음). 404.html 없으면 SPA로 봄 |
| Cloudflare Workers 정적 파일 | 정적 파일 요청 무제한, Worker 요청 하루 10만 건 | Pages와 같음 | Workers Builds: push 자동, 브랜치 미리보기 | `run_worker_first: ["/api/*"]` 또는 `/api/*`를 Worker 경로에서 빼기. **SPA 모드 기본값이면 브라우저 이동 요청(카카오 콜백)이 서버까지 안 가고 index.html을 받음** → 경로를 명시해야 함 | `_headers`, SPA 설정 있음 |
| Vercel Hobby | 월 100GB 전송, 요청 100만 건 | **비상업 개인용만**(광고·결제·판매 포함 시 위반) | PR 미리보기 | rewrites로 바깥 서버로 넘김. 120초 동안 데이터 없으면 끊김 | 헤더·rewrite 설정 |
| Netlify Free | 월 300 credits, 다 쓰면 **모든 사이트가 멈춤** | 약관 일부 확인 못 함 | PR 미리보기 | `/api/* … 200` 프록시, **26초 뒤 끊김** → SSE와 안 맞을 가능성 큼 | 프록시 응답에는 헤더 안 붙음 |
| GitHub Pages | 1GB, 월 100GB | **온라인 사업용 무료 호스팅으로 쓰지 말라는 정책** | push 배포, PR 미리보기 없음 | 기능 없음 | 응답 헤더 설정 방법·SPA 라우팅 문서 없음 |

### 3-1. Cloudflare를 앞에 두기만 해도 캐시됨

- Cloudflare는 확장자로 캐시 여부를 정하고 기본 목록에 JS·CSS·WOFF2·SVG·PNG 등이 들어 있음. HTML·JSON은 기본으로 캐시하지 않음 (https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)
- 무료 요금제는 원 서버의 `Cache-Control`을 따름. 지금 nginx는 `/assets/`에 `public, max-age=31536000, immutable`, `/library-logos/`에 7일을 줌(dev `deploy/nginx/chaekcheck-locations.conf`) → 그대로 Cloudflare 캐시에 남음
- 그래서 화면 파일을 따로 무료 호스팅에 올려서 얻는 속도 이득은 거의 없음 [안: 추론]. 얻는 것은 PR 미리보기 주소, 서버가 꺼져도 화면 파일은 뜸(API가 없으니 검색은 안 됨) 정도

### 3-2. 앞에 Cloudflare를 둘 때 시간 제한 (스트림)

- Proxy Read Timeout 125초(넘으면 524, Enterprise만 변경), Proxy Write Timeout 30초, Idle 900초 (https://developers.cloudflare.com/fundamentals/reference/connection-limits/)
- 스트림이 125초 넘게 조용하면 끊길 수 있음. 데이터가 올 때마다 시간이 다시 시작되는지는 문서에 없음 [확인 필요: 시험]. 지금 스트림 마감은 30초(dev `application.yml`)라 넘지 않을 것으로 봄 [안]
- 대출 현황 스트림이 Cloudflare를 지날 때 버퍼링되는지 [확인 필요: 시험]

## 4. 수집 프록시

나가는 IP 원칙 [확정] (`crawl-method.md` 1절): 우리가 운영하는 국내 서버의 고정 IP로만 나감. 해외 IP를 받지 않는 사이트가 있어 국내 서버를 프록시로 두는 것은 허용. IP를 바꿔 가며 쓰는 프록시·주거용 프록시·우리를 막은 곳에 새 IP로 다시 가는 것은 하지 않음. (2026-10-13 바뀜: 막힌 그 IP에서만 보내지 않고, 다른 우리 고정 IP에서는 수집 동시 1건·1초, 서비스 조회는 서버 전체 동시 상한 안에서 [확정] (사용자 승인). 교보 서비스 조회 상한은 [안], `easy/2026-10-12-ip-principle-decisions.html` #1)

### 4-1. 프록시로 수집이 빨라지지 않음

- 지금 속도 상한은 "서버(IP)마다 동시 1건, 앞 응답이 끝난 뒤 1초 이상" 규칙에서 정해짐(dev `scripts/crawl/crawl_catalog.py` 61~64·409~419행). 서버마다 따로 세고, 다른 서버끼리는 동시에 받음(지금 40곳)
- 서버 한 곳에서 받는 양 ≈ 1 ÷ (응답 시간 + 1초). 프록시는 이 식을 바꾸지 못하고 중간 단계가 하나 늘어 응답 시간이 조금 늘어남 [안: 추론]
- 프록시가 하는 일은 **나가는 IP를 바꾸는 것**뿐. 우리에게 쓸모 있는 경우: 수집기를 해외(Claude 클라우드 등)에서 돌리면서 나가는 IP를 국내 고정 IP로 맞출 때(`aws-crawl.md` 4절 C안)

### 4-2. 프록시 종류

| 종류 | 하는 일 | 한국 IP | 요금 예시 (업체 표기) | 원칙 |
|---|---|---|---|---|
| 우리 국내 서버의 전달 프록시(Squid, tinyproxy) | 우리 서버 한 대의 고정 IP로 내보냄 | 국내 서버면 한국 | 국내 1GB 서버 월 5,600원~(iwinv, `aws-crawl.md` 5절), Lightsail $5 | **맞음** |
| 상용 데이터센터 프록시 | 업체 IP를 빌림 | Oxylabs 한국 전용 있음 | Oxylabs 한국 전용 월 $8.25부터 | 원칙 밖(우리 서버 IP 아님) |
| ISP 프록시(고정 주거용) | 통신사 대역 IP를 고정으로 빌림 | Oxylabs 한국 포함 | Oxylabs IP당 $1.10~1.50 | 원칙 밖 |
| 주거용·IP 바꿔 가는 프록시 | 요청마다 남의 가정 IP로 바꿈 | Oxylabs 한국 지정 가능 | Oxylabs 한국 $8/GB부터, Decodo $2~4/GB, IPRoyal $1.84~7.35/GB | **금지** [확정] |

출처: https://oxylabs.io/location-proxy/south-korea , https://oxylabs.io/pricing , https://oxylabs.io/products/isp-proxies , https://developers.oxylabs.io/proxies/residential-proxies/location-settings/select-country , https://brightdata.com/pricing/proxy-network , https://decodo.com/pricing , https://iproyal.com/pricing/residential-proxies/

### 4-3. 우리 프록시를 둘 때 설정 요점

- Squid: `basic_ncsa_auth`로 아이디·비밀번호, `acl … dstdomain`으로 도서관 주소만 허용, `http_access deny CONNECT !SSL_ports`, 마지막 `http_access deny all` (https://wiki.squid-cache.org/ConfigExamples/Authenticate/Ncsa , https://www.squid-cache.org/Doc/config/acl/ , https://www.squid-cache.org/Doc/config/http_access/)
- tinyproxy(더 가벼움, 메모리 약 2MB): `BasicAuth`, `Filter` + `FilterDefaultDeny Yes`로 허용 목록, `ConnectPort 443`, `Allow` (https://tinyproxy.github.io/)
- 교보 구독형 서버(`*.dkyobobook.co.kr`)는 프록시에서도 거부 [확정] (`aws-crawl.md` 2-4절)

### 4-4. 법 관련 사실 (원칙의 배경 자료)

- 대법원 2022. 5. 12. 선고 2021도1533(숙박 앱 크롤링): 무죄 확정. 접근 제한 여부는 "보호조치나 이용약관 등 객관적으로 드러난 여러 사정"으로 판단, 이 사건은 별도 보호조치가 없었다는 점이 무죄 이유 중 하나 (판결문 https://www.scourt.go.kr/sjudge/1652779958317_183238.pdf)
- 정보통신망법 제48조 제1항 "정당한 접근권한 없이 또는 허용된 접근권한을 넘어" 침입 금지. 조문은 2차 출처(https://korea.legal/)로만 봄, law.go.kr 원문 대조 못 함 [확인 필요]
- IP 차단을 새 IP로 피하는 것을 직접 다룬 한국 판례는 찾지 못함 [확인 필요]. 미국 Craigslist v. 3Taps(2013)는 IP 차단 뒤 프록시 우회를 권한 없는 접근으로 볼 수 있다고 판단(2차 출처)
- 법적 판단이 아니라 원칙을 정한 배경 자료. 전문가 확인은 backlog "운영에 올리기"에 이미 있음

### 4-5. 수집을 실제로 빠르게 하는 방법 [안]

| 방법 | 효과 | 근거 |
|---|---|---|
| 바뀐 것만 다시 받기(증분 수집) | 받는 페이지 수 자체가 줄어 가장 큼 | 추론. 갱신 기능 backlog와 같은 주제 |
| 동시에 받는 서버 수 늘리기(`--workers`) | 서버마다 규칙은 그대로, 줄 수만 늘림 | RFC 9112 9.4절(서버당 연결은 보수적으로) https://www.rfc-editor.org/rfc/rfc9112.html#section-9.4 |
| 연결 재사용(keep-alive) | 요청마다 TCP·TLS 연결을 새로 맺는 시간을 없앰. 지금 `urllib.request.urlopen`은 요청마다 새 연결 [확인 필요: dev] | RFC 9112 9.3절 |
| 압축 받기(`Accept-Encoding: gzip`) | 전송량 줄임. 사이트가 주는지 확인 필요 | RFC 9110 12.5.3절 https://www.rfc-editor.org/rfc/rfc9110.html |
| 조건부 요청(ETag·Last-Modified → 304) | 안 바뀐 페이지는 본문 없이. 검색 결과 페이지가 이 헤더를 주는지 확인 필요 | RFC 9110 13.1절, RFC 9111 4.3절 |

## 5. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 한국 데이터센터 IP를 도서관 사이트가 받는지 | CloudShell 서울 시험(`aws-crawl.md` 1절) 또는 고른 업체 서버에서 같은 6곳 시험 |
| AWS Free plan에서 t4g.medium·서울 사용 가능 여부, Lightsail 시간 비례 과금 | 공식 문서·콘솔 |
| KT 기본 공인 IP·VAT, 카카오 지금 요금·크레딧 기간, iwinv 기본 IP, Vultr IPv4, NHN·가비아 신규 혜택 | 공식 페이지(가입 화면) |
| Oracle A1 서울 자리가 있는지 | 가입 뒤 만들기 시도 |
| 노트북 사양(CPU 종류·메모리·디스크) | 사용자에게 질문 |
| Cloudflare를 지날 때 스트림 버퍼링·125초 제한이 데이터마다 다시 시작되는지 | 시험 |
| 수집기가 연결을 재사용하는지, 사이트가 gzip·ETag를 주는지 | dev 코드 확인 + 사이트별 시험 |
| 정보통신망법 조문 원문 | law.go.kr |

## 6. 대출 현황 조회의 1초 간격이 실사용에 주는 영향 (사용자 질문, 2026-10-12)

- 사용자: "수집기는 몰라도 대출권수 파악에는 말이야 실사용에 지장이가는 뭐 그런거아니니"
- 지금 규칙(dev `InMemoryHostThrottle`, `application.yml` availability): 도서관 사이트 **호스트 이름**마다 동시 1건(`host-max-concurrency: 1`), 앞 요청이 끝난 뒤 1초(`host-min-interval: 1s`). **모든 사용자 합쳐서** 셈. 기다림도 마감에 포함: 검색 페이지 묶음 8초(`batch.deadline`), 상세 페이지 30초(`detail.deadline`). 차례가 못 오면 그 도서관은 확인 못 함, 로그 `throttle timeout`. 같은 검색은 3분 캐시(`cache-ttl: 3m`). 한 묶음에서 도서관 5곳씩 동시(`batch.parallelism: 5`), 서버 전체 동시 검색 20(`max-concurrent-searches`)
- 혼자 쓸 때: 검색 한 번에 도서관마다 1번, 도서관 주소가 서로 달라 기다림 거의 없음
- 영향이 생기는 경우 [안: 계산값]: ① 몇 초 안에 여러 사람이 같은 도서관을 서로 다른 검색어로 찾으면 줄을 섬. 응답 1초 사이트면 한 사람당 약 2초, 8초 마감 안에 3~4명 ② 포털 상세 페이지를 같은 도서관에서 여러 장 읽으면 차례로 읽어 30초 마감에 걸릴 수 있음 ③ 수집기와 서비스는 간격을 나누지 않음
- 수집기(IP로 묶음)와 서비스(호스트 이름으로 묶음)의 기준이 다름: 교보 구독형(`*.dkyobobook.co.kr`, 한 서버에 하위 주소 수백 개)에 서비스는 동시에 최대 5건을 보낼 수 있음. 이 서버는 예전에 우리 IP를 막았음(`aws-crawl.md` 2-4절)
- 제안 [안]: 처음에는 그대로, `throttle timeout` 횟수를 모니터링에 넣어 봄. 늘면 캐시 시간·도서관별 간격·교보 구독형 IP 묶기를 검토
- (질문 답, 2026-10-12, 사용자: "지금 교복 구독 대여 소장형 막힌 거 아니야?") 맞음. 교보 구독형 서버(103.182.126.192, `*.dkyobobook.co.kr`)는 2026-10-07부터 집 IP를 막음(`crawl-runbook.md` 8-2-1절). 그 뒤 다시 확인하지 않음 [확인 필요]. 대여·혼합 230곳은 뺌(ADR-0067), 소장형 1,182곳·공공도서관 구독 21곳은 서비스에 있음 → 집 PC에서 서비스를 돌리면 이 곳들의 대출 조회가 안 됨. 클라우드·노트북은 IP가 달라 될 수 있으나 "우리를 막은 곳에 새 IP로 다시 가지 않음"(수집 원칙, `crawl-method.md` 1절)이 서비스 실시간 조회에도 적용되는지 정하지 않음 [확인 필요: 사용자에게 질문]
- (2026-10-12, 사용자: "수집은 1초간격 가능한데 서비스 실시간 조회 1초는 서비스가 불가능해") 교보 구독형 서버는 평소 응답 4~6초(`crawl-runbook.md` 8-2-1절), 검색 페이지 마감 8초 → 동시 1건이면 8초에 1곳 정도. 이 서버를 쓰고 가입 조건을 조사한 도서관(`join_survey = SURVEYED`, 켜짐) 22곳(로컬 DB, 2026-10-12: RENTAL 9·OWNED 6·SUBSCRIPTION 5·MIXED 2; `MEMBERS_ONLY` 1,206·`NOT_SURVEYED` 20은 직접 추가가 아니면 계획에서 빠짐, ADR-0053). 새 제안 [안]: 서비스 조회는 간격 없이, 모든 사용자 합쳐 이 서버 전체 동시 5건 상한. 지금 코드는 주소별로 세서 상한 없음(최대 5 × 동시 검색 20 = 100). 결정 페이지 `easy/2026-10-12-ip-principle-decisions.html`
- 로컬 DB에 교보 서버 RENTAL·MIXED 11곳이 아직 켜져 있음(SURVEYED). ADR-0067은 대여·혼합을 seed에서 빼기로 함 → 로컬 DB가 옛 상태인지 [확인 필요: dev]
- (질문 답, 2026-10-13) Lightsail vs EC2: Lightsail은 서버·디스크·고정 IP·전송량을 묶음 값으로 팜(4GB $24: 2 vCPU, SSD 80GB, 전송 4TB, IP 포함), 시간 단위로 내고 꺼 둔 동안에도 요금이 나감, EC2로 옮기는 기능 있음 (https://aws.amazon.com/lightsail/faq/). CPU: 4GB 묶음 vCPU 2개, 기준 성능 vCPU당 20%, 여유분 1시간 4.17%씩 (https://docs.aws.amazon.com/lightsail/latest/userguide/baseline-cpu-performance.html , …/cpu-burst-capacity-accrual.html, 확인 2026-10-13). CPU 제조사·여유분을 다 썼을 때 동작은 확인 못 함 [확인 필요: 서버에서 `lscpu`]
- (질문 답, 2026-10-13, 사용자: "ec2는 아이피 그때그때 바꿀 수 있지 않나") 기본 공인 IP는 멈췄다 켜면 바뀜, Elastic IP는 고정, 둘 다 $0.005/h (https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html). 나가는 IP 원칙(고정 IP만)·ADR-0094(세 번째 IP를 찾지 않음)에 따라 Elastic IP를 붙임 [안]
- (질문 답, 2026-10-13, "라이트세일은 아이피 못 바꿔?") Lightsail도 고정 IP가 없으면 멈추거나 다시 시작할 때 새 IP, Static IP는 붙어 있으면 무료·떼어 두면 요금 (https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-static-ip-addresses-in-amazon-lightsail.html)
- (2026-10-13, 사용자: "지금 단계에서는 lightsail이 이득 아니야?") 2주 체험 추천을 Lightsail 서울 4GB($24/월, 2주 약 $11)로 바꿈 [안]. 이유: 2주 뒤 노트북으로 옮기므로 EC2 크기 결정을 오래 쓸 일 없음, 묶음에 디스크·전송·고정 IP 포함. 2026-10-12 EC2 t4g.medium·gp3 40GiB [확정]은 운영을 EC2에 둘 때의 크기로 남음
- (질문 답, 2026-10-13, "사용량이 적으면 ec2가 이득일까?") 둘 다 켜 둔 시간으로 요금. 2주 기준 EC2(서버 $0.0416/h + 디스크 약 $1.7 + 고정 IP $1.7)가 Lightsail(약 $11)보다 싸지는 것은 켜 둔 시간이 약 185시간보다 적을 때(계산값). 사용량은 나가는 데이터·CPU 초과분에만 영향. 4GiB는 DB 크기 때문이라 사용자가 적어도 줄이기 어려움
- **결정 (2026-10-13)**: 2주 체험 서버는 AWS Lightsail 서울 4GB 묶음(월 $24) [확정] (사용자 승인, 2026-10-13, 결정 페이지 `easy/2026-10-12-hosting-options.html` #1. 사용자: "지금 단계에서는 lightsail이 이득 아니야?")
- (질문 답, 2026-10-13, "클라우드플레어는 어떻게 무료로 이게 가능해?") Cloudflare가 밝힌 이유: 통신사 직접 연결로 비용이 줄어듦, 공격을 더 많이 봄, 새 기능 시험, 회사 목표 (https://blog.cloudflare.com/cloudflares-commitment-to-free/ , 2024-09-27). Tunnel 연결 기능은 2021-04-15부터 무료, Argo Smart Routing만 유료 (https://blog.cloudflare.com/tunnel-for-everyone/). 무료 요금제는 동영상·큰 파일 위주 용도 제한
- (질문 답, 2026-10-13, "클라우드플레어 대신에 할 수 있는 서비스들은 뭐 없어?") ngrok 무료: 처음 $5어치·전송 1GB·요청 2만·지정 주소만·경고 안내 화면, Hobbyist $10/월 전송 5GB (https://ngrok.com/pricing). Tailscale Funnel: 무료, `*.ts.net`만, 대역폭 한도 비공개, 베타 (https://tailscale.com/kb/1223/funnel). 직접 연결: 포트 열기 + Let's Encrypt 무료 인증서 (https://letsencrypt.org/about/). 카카오 돌아올 주소 고정 때문에 내 도메인을 쓸 수 있는 Cloudflare Tunnel 또는 직접 연결
- (질문 답, 2026-10-13, "aws에서는 claudeflare가 의미가 있나?") AWS는 고정 IP라 꼭 필요하지 않음. 이번 계획(2주 AWS → 노트북)에서는 옮길 때 설정을 안 바꾸는 점, 포트 안 엶, 인증서·캐시·IP 숨김 때문에 Tunnel 유지 [안]. 오래 AWS에 두면 직접 연결도 맞음
- **결정 (2026-10-13)**: 클라우드 서버(Lightsail)도 Cloudflare Tunnel로 연결, 노트북으로 옮길 때 터널을 켜는 기계만 바꿈 [확정] (사용자 승인, 결정 페이지 #2)
- **결정 (2026-10-13)**: 화면은 지금처럼 서버의 nginx가 내려 주고 앞의 Cloudflare 캐시만 씀, GitHub 연동 무료 호스팅으로 옮기지 않음 [확정] (사용자 승인, 결정 페이지 #3)
- **결정 (2026-10-13)**: 배포 때 nginx가 `CF-Connecting-IP`를 사용자 주소로 읽게 설정 [확정] (사용자 승인, 결정 페이지 #5). 터널에서도 이 헤더가 붙는지는 배포 때 시험 [확인 필요]
- **결정 (2026-10-13)**: 모니터링은 2주 Lightsail에서도 노트북에서도 Prometheus·Grafana(+node_exporter)를 직접 띄움 [확정] (사용자: "Prometheus·Grafana를 직접할래 계속", 결정 페이지 #6 미승인 → 대안 선택). 4GB 서버에서 메모리 사용을 지켜봐야 함, 바깥에서 그래프를 보려면 터널 주소와 로그인 필요 [확인 필요: 배포 사이클]
- (2026-10-13, 사용자 "15번사이클확인해봐") 사이클 15 `spec-followup-decisions.html` #1은 도서관 사이트마다 동시 1건·1초를 "봇이 몰려도 도서관은 1초에 한 번"의 근거로 씀 → 7번 제안(1초 간격 그대로)과 같은 방향. 사이클 15의 AWS WAF 전제는 2주 Lightsail 결정으로 다시 볼 거리
- (2026-10-13, 사용자: "기존에 따로 조회 서버 두지 않고 그냥 하나의 서버에서 하되 여러 업체 프록시를 쓰도록 했으면 하는데") 대출 조회 프록시 제안을 "서비스 서버 하나 + 업체 고정 IP 프록시 여러 곳"으로 바꿈 [안]. ADR-0011(조회 서버 분리)·나가는 IP 원칙·ADR-0094(조회 서버마다 3건)가 바뀜. 결정 페이지 `easy/2026-10-13-lookup-proxy-decisions.html` #1
- (2026-10-13, 사용자: "아니 다 가능하도록 개발했으면 해 조회 서버를 두는 것도 방법이고 각각의 조회 서버 내에서 업체 프록시 여러개 쓸 수 있고 우리 본 서버에서 조회기능도 있되 업체 프록시 여러개 쓸 수 있는 걸로다가") 제안을 "세 길 모두 + 설정으로 고름(직접 / 직접+업체 프록시 / 조회 서버, 조회 서버마다 업체 프록시)"으로 넓힘 [안]. 몇 건 보낼지는 언제나 본 서비스에서, 업체 프록시는 고정 IP 상품만 [안]
- **결정 (2026-10-13, 대출 조회 프록시, 결정 페이지 `easy/2026-10-13-lookup-proxy-decisions.html`)**
  - #1 세 길 모두 만들어 두고 설정으로 고름: 본 서비스 직접(프록시 없이 / 업체 프록시 여러 곳), 조회 서버(조회 서버마다 업체 프록시 여러 곳), 업체 프록시는 고정 IP 상품, 나간 길·업체를 조회 기록에 남김 [확정] (사용자 승인; 사용자: "아니 다 가능하도록 개발했으면 해 …")
  - #2 도서관 한 곳에 보내는 양은 **나가는 IP(프록시·조회 서버)마다 따로 셈** [확정] (사용자: "각 프록시 ip마다 따로 세는 걸로 해줘", 제안 "합계 유지" 미승인). 도서관 한 곳이 받는 양은 IP 수만큼 늘어남. ADR-0011의 "호출 간격 제어는 본 서비스 한곳"(B안 기각)을 바꿈
  - #3 한 IP가 어느 사이트에서 막히면 **그 IP만 그 사이트에서 멈추고 다른 IP로는 계속** [확정] (사용자: "ㄴㄴ 특정 프록시/조회서버ip만 하지 말아", 제안 "모든 IP에서 멈추고 물음" 미승인). ADR-0011 "도서관이 거부하면 다른 서버로 넘기지 않음"과 ADR-0094(제안됨) "그 IP도 막히면 멈추고 묻고 세 번째 IP를 찾지 않음"을 바꿈
  - #4 User-Agent: 서비스 대출 조회 요청은 **일반 브라우저와 같은 User-Agent**로 보냄, 우리 서비스 이름을 넣지 않음 [확정] (사용자: "그냥 사용자로 하면 안 될가? 그냥 사용자를 대신할 뿐이잖아", 후속 페이지 `easy/2026-10-13-lookup-ua-decisions.html`에서 "ㄴㄴㄴㄴ 그냥 일반 사용자들 대신하는거니 일반 사용자들처럼", 2026-10-13). 사이클 01 "서비스를 알 수 있는 User-Agent" [확정]을 서비스 대출 조회에 한해 바꿈. 수집기 User-Agent는 그대로(`crawl-method.md` 1절). 배경 자료(2021도1533, 정보통신망법 제48조)는 후속 페이지 카드 3에 적었고, 이 조합은 전문가 확인 항목에 함께 넣음 [안]
- (2026-10-13, 사용자: "이거 이대로 완료해도 되지 않아? 꼭 답변해야 하는 거 있어?") 비교 페이지를 닫음. 남은 두 안은 정하지 않은 채 둠: #4 수집 속도용 프록시를 쓰지 않고 빠르게 하는 방법(바뀐 것만 받기·연결 재사용·압축)을 수집 개선 후보로 [안] — 서비스 대출 조회 프록시는 별도 페이지에서 정함. #7 일반 도서관 1초 간격 그대로·포기 횟수 지켜보기 [안] — 지금 코드가 이미 그대로이므로 막는 것 없음
