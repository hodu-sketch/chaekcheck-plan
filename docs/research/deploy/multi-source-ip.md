# 서버 한 대에서 여러 공인 IP로 나가기 — 업체 프록시와 비교 (사이클 밖 조사)

- 작성: 2026-10-16. 사용자: "현재 이것만 간단하게 조사해봐", "조회 서버에서 여러 출처 아이피를 설정으로 하는 것도 고려 중이야 (조회 서버 따로 두지 않고 자체 서버에서 할 때도)"
- 출발점: 사용자가 붙여 넣은 조사 메모(Webshare 정적 ISP 월 $6·20개, 데이터센터 프록시, Alibaba Cloud 서울 ECS+EIP, VPS 추가 IPv4)
- 이어지는 결정: ADR-0095(나가는 길 세 가지 ① 직접 ② 직접+업체 고정 IP 프록시 ③ 조회 서버, 나가는 IP마다 따로 셈, 막힌 IP만 멈춤), `hosting-options.md` 4절(프록시 종류), `aws-crawl.md` 5절(국내 저가 서버)
- 범위: 서비스 대출 조회의 나가는 IP만. 수집(수집기)은 ADR-0094·`crawl-method.md` 1절 그대로. 메모의 "로그인·전자책 대출 기능 접근"은 이 조사에서 다루지 않음(서비스에 없는 기능, backlog에도 넣지 않음)

## 1. 새로 생기는 길: "서버 자기 IP 여러 개"

ADR-0095의 세 길은 "서버 자기 IP 1개" 또는 "업체 프록시"였다. 사용자가 고려하는 것은 **서버(본 서비스 서버든 조회 서버든) 한 대에 공인 IP를 여러 개 붙이고, 요청마다 어느 IP로 나갈지 설정으로 고르는 것**이다.

- 앱 쪽 방법 [안: 일반 지식, 미시험]: Java HTTP 클라이언트에서 나가는 주소(local address)를 지정해 연결. 예: Apache HttpClient 5 `RequestConfig`/라우트의 local address, Reactor Netty `bindAddress`. JDK 기본 `java.net.http.HttpClient`는 1.x에서 local address 지정 기능이 있는지 [확인 필요: 공식 문서 확인]. 우리 dev가 어떤 HTTP 클라이언트를 쓰는지 [확인 필요: dev 코드 확인]
- 다른 방법 [안]: 서버 안에 IP마다 작은 전달 프록시(tinyproxy 등)를 띄워 각자 다른 주소로 나가게 하면, 앱은 지금 계획(ADR-0095 ② 업체 프록시 목록)과 같은 "프록시 목록"으로 다룰 수 있음 → 앱 코드가 덜 바뀜. 메모리 약 2MB/개(tinyproxy, `hosting-options.md` 4-3절)
- ADR-0095의 "나가는 IP마다 따로 셈, 막힌 IP만 멈춤"은 그대로 적용됨. 사이트 입장에서는 같은 업체(AWS 등) 대역의 IP 여러 개로 보임

## 2. 비교표 (2026-10-16 확인)

| 방식 | IP 5개 월 대략 | IP 20개 | 한국 IP | 고정 | 트래픽 | 설정 난이도 | 근거 |
|---|---|---|---|---|---|---|---|
| **AWS EC2 서울 + 공인 IPv4 추가** (서비스 서버 t4g.medium에 붙임) | 추가 4개 × $3.65 = **약 $14.6** (기존 1개 제외) | t4g.medium은 최대 18개(아래) → 17개 추가 약 $62 | 예(서울) | 예(Elastic IP) | 나가는 데이터 서울 $0.126/GB(무료 한도 뒤) | 중: ENI·보조 사설 IP·EIP 연결 + OS 라우팅 | [확정] 공인 IPv4 $0.005/h (https://aws.amazon.com/vpc/pricing/ , `aws-crawl.md`), t4g.medium 네트워크 인터페이스 3개 × 인터페이스당 IPv4 6개 [확정] (https://docs.aws.amazon.com/ec2/latest/instancetypes/gp.html , 2026-10-16). 리전당 Elastic IP 기본 한도 5개 [확인 필요: Service Quotas 화면] |
| **AWS Lightsail** | 서버 한 대에 고정 IP **1개만** | 불가(서버를 여러 대 띄워야 함, 최소 $5/대) | 예 | 예 | 1TB 포함(소형) | — | [확정] "인스턴스에 고정 IP는 한 번에 하나" (https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-faq-networking.html , 2026-10-16). 사이클 17 운영 서버는 EC2라 해당 없음(Lightsail로 바꾸면 안 됨) |
| **iwinv(국내) 추가 IP** | 추가 IP 월 3,300원 × 3 = 9,900원 + 기존 1개 = 4개가 상한 | 불가(서버당 최대 3개 추가, 넘으면 기술지원 문의) | 예 | 예 | `aws-crawl.md` 5절 | 중: rp_filter 등 OS 설정 직접 | [확정] "일 130원/월 3,300원", "최대 3개까지 추가" (https://docs.iwinv.kr/service/network/add-ip/add-ip-overview , 2026-10-16). IP는 무작위 배정 |
| **Vultr 서울 추가 IPv4** | $3/개 [확인 필요] × 4 ≈ $12 + 서버 | 상한 [확인 필요] | 서울 리전 있음 [확인 필요: 주문 화면] | 예 | [확인 필요] | 중: 추가 시 서버 재시작 + OS 설정 | 예약 IP $0.004/h·$3/월 (https://docs.vultr.com/support/products/network/are-reserved-ips-free , 2026-10-16). 추가 IPv4가 같은 값인지·서울 값인지 [확인 필요] |
| **Alibaba Cloud 서울 ECS + EIP** | [확인 필요] | 보조 ENI의 보조 사설 IP마다 EIP 1개 → 인스턴스 유형 한도 [확인 필요] | 예(서울 리전) | 예 | EIP 대역폭·트래픽 과금 [확인 필요] | 상: ENI·NAT 모드, 일부 이미지는 라우트 직접 | 방식 [확정] (https://www.alibabacloud.com/help/ja/eip/associate-an-eip-with-a-secondary-eni-1 , 2026-10-16). 서울 EIP 단가는 공식 페이지에서 못 찾음. 새 클라우드 계정·청구가 하나 더 생김 |
| **Webshare 데이터센터(공유)** | 100개 $2.99 (최소 100개, 무료 10개) | 같음 | **확인 못 함** (50+개국이라고만) | [확인 필요] | 250GB 기본 | 하: 프록시 주소만 넣음 | https://www.webshare.io/pricing (2026-10-16). 공유 = 남도 같은 IP를 씀 → 남 때문에 막힐 수 있음 |
| **Webshare 정적 주거용(ISP)** | 한국 20개 $6 (공유형) | 같음 | **예**: 공유형 한국 759개, Private 253개, Dedicated 없음 (5절 끝, Webshare API 2026-10-16) | 예(정적) | [확인 필요] | 하 | 도움말 https://help.webshare.io/en/articles/8596715-filtering-proxies-by-country (2026-10-16). 요금표 페이지에 정적 주거용 값이 안 보임. 제3자 글: 공유형 20개 $6, 전용 20개 $42 (https://proxidize.com/blog/webshare-pricing/ , 2차 출처) |
| Oxylabs 한국 전용 데이터센터 | 월 $8.25부터 | [확인 필요] | 예 | 예 | [확인 필요] | 하 | 2026-10-12 업체 표기 (`hosting-options.md` 4-2절, ADR-0095) |

메모의 "Webshare 월 8,400원에 한국 IP 20개"는 **광고 최저가일 뿐, 한국 IP가 그 값에 나오는지는 확인 못 함**. 가입 뒤 플랜 화면의 국가 목록을 봐야 알 수 있음 [확인 필요: 공식 화면 확인].

## 3. 짚을 점

- **이미 정해진 원칙과 맞는지**: ADR-0095는 업체 프록시를 "고정 IP 상품만"으로 했고(G안 기각: 주거용·바뀌는 IP). Webshare "정적 주거용"은 IP는 고정이지만 통신사 가정 대역이라 G안 쪽에 가까움 → 쓰려면 사용자가 다시 정해야 함 [확인 필요: 사용자에게 질문]. 서버 자기 IP 여러 개는 "우리 고정 IP"라 원칙 안
- **효과의 한계**: 같은 클라우드 대역 IP 여러 개는 사이트가 대역째 막으면 함께 막힘. 반대로 지금까지 막힌 사례는 교보 구독형 서버 1곳(집 IP, 동시 4건·이틀 8만 건)뿐 (ADR-0094)
- **법적 부담은 그대로**: 막힌 뒤 다른 IP로 계속 가는 모양은 ADR-0094·0095 "감수하는 점" 그대로(대법원 2021도1533, 한국 직접 판례 못 찾음)
- **사이클 17 배포 서버와의 관계**: 첫 배포 운영 서버는 AWS EC2 t4g.medium 서울 한 대 [확정] (ADR-0104, 사이클 17 `scope.md`) → 이 서버에 공인 IPv4를 더 붙일 수 있음(최대 18개, 2절). 2주 뒤 집 노트북으로 옮기면(사이클 17 `scope.md`, 사용자 2026-10-12) 집 회선은 보통 공인 IP 1개라 이 방식이 안 되고 업체 프록시나 바깥 서버 프록시가 필요함 [안: 추론]

## 4. 제안 [안]

1. **먼저 프록시 없이** (ADR-0095 ①): 첫 배포 서버 IP 하나로 2주 운영하며 사이트별 막힘을 조회 기록·상태등(사이클 20)으로 봄. 비용 0
2. 막힘이 실제로 생기면, **지금 EC2 서버에 공인 IPv4를 2~4개 더 붙임**(개당 월 약 $3.65, 4개면 약 $14.6). 우리 고정 IP라 원칙 안이고, 앱은 "IP마다 작은 전달 프록시" 방식이면 ADR-0095 ② 프록시 목록 그대로 씀. 별도 조회 서버를 둘 때도 같은 방식
3. 업체 프록시는 위 둘로 안 될 때만. 그때도 Webshare는 가입 화면에서 한국 IP를 먼저 확인

- 설정 모양(제안): 나가는 길 목록에 "서버 자기 IP(주소 지정)"를 한 종류로 더함 → 본 서비스 서버와 조회 서버 모두 같은 설정으로. 설계는 해당 사이클에서 정함(이 문서는 조사만)

## 5. Webshare 정적 주거용 더 찾아봄 (2026-10-16, 사용자: "Webshare 정적 주거용 이거 검색해봐")

- 사용자: "정적 주거용도 괜찮은 것 같아" (2026-10-16) → ADR-0095 G안(주거용 제외)을 "정적 주거용은 허용"으로 바꾸는 제안 [안] (결정 페이지 `easy/2026-10-16-multi-source-ip.html` #1)
- 값: 20개부터 IP당 $0.30(월 $6), 많이 사면 $0.225 [확정] (https://www.webshare.io/static-residential-proxy , 2026-10-16)
- IP 출처: 페이지에 적힌 통신사는 AT&T, Sprint, Cox, Comcast, RCN, Lumen 등 미국 회사뿐 [확정] (같은 페이지). 한국 정적 주거용이 있다는 공식 문구는 못 찾음 [확인 필요: 가입 화면]
- 한국 페이지: "Rotating Residential, Datacenter or ISP" 중 고르라는 일반 문구, 한국 값은 IP당 $0.029부터(데이터센터 표와 같음)·주거용 1GB 월 $7부터, 한국 IP 230,263개 표시 [확정] (https://www.webshare.io/proxy-locations/kr , 2026-10-16). 한국 정적 주거용 값은 없음
- 종류: 공유(Premium, 다른 사용자와 같이), Private(다른 고객 0~2명), Dedicated(혼자) [확정] (https://help.webshare.io/en/articles/8625115-what-types-of-static-residential-proxies-do-you-have , 2026-10-16). $6 구매 주소에 `shared` → 공유로 보임 [확인 필요]. Private·Dedicated 값은 공식 페이지에서 못 찾음(2차 출처: Private 25개 $23.16, Dedicated 20개 $42)
- 고정: "IP는 계속 고정", Auto-Refresh·직접 교체 가능. 트래픽 "Up to Unlimited"(공정 사용 정책) [확정] (정적 주거용 페이지)
- 환불: 결제 48시간 안, 쓴 양 1GB 미만(정적 주거용), 프록시 1,000개 미만 [확정] (https://help.webshare.io/en/articles/8370527-requesting-a-refund , 2026-10-16)
- 한국 정적 주거용(ISP) 대안: Oxylabs 한국 포함, IP당 $1.10~1.50 (2026-10-12 업체 표기, `hosting-options.md` 4-2절) → 20개 월 약 $22~30 [안: 계산]

- (2026-10-16, 사용자: "한국도 되는지 안 되는지 그리고 너가 직접 연결해서 테스트도 할 수 있으면 해봐") 공개 페이지(`/features/proxy-locations`)는 "50+ Countries"와 인기 나라 10곳만 보여 주고 상품별 나라 목록은 없음 [확정] (https://www.webshare.io/features/proxy-locations , 2026-10-16). 나라 목록은 가입 뒤 Plans & Pricing 화면 (https://help.webshare.io/en/articles/8596715-filtering-proxies-by-country). 계정 만들기·인증 값 입력은 Claude가 하지 않음 → 사용자가 무료 플랜(10개, 카드 없음)으로 가입해 확인 [확인 필요: 사용자 확인]. 산 뒤 시험: `curl -x http://아이디:비밀번호@주소:포트 https://ipinfo.io/country`(KR), 같은 프록시로 `https://www.gdlibrary.or.kr/` 상태 코드
- 프록시 없이(집 IP) 한 번씩 요청 (2026-10-16): `https://www.gdlibrary.or.kr/` 302 0.1초, `https://ebook.gdlibrary.or.kr/` 200 0.8초 [확정] (직접 시험)

- (2026-10-16, 사용자: "아니 가격이 webshare가 훨씬 매력적이라서이러는거자나") 2차 출처 AIMultiple(2026-10-02 갱신): Webshare ISP 나라 = 미국(약 3만), 이탈리아, 프랑스, 영국, 독일, 벨기에, 캐나다, 일본, 호주, 폴란드, 스웨덴, 루마니아 — 한국 없음 [확인 필요: 공식 화면] (https://aimultiple.com/isp-proxies). 같은 글에서 한국 ISP를 적은 곳은 Decodo(전용 ISP 3개 $9.99부터, 한국 값 없음). 한국 ISP 5개면 Oxylabs IP당 $1.10~1.50 → 약 $5.5~7.5 [안: 계산, 최소 수량 확인 필요]

- **(2026-10-16, 사용자: "너가 보라고") Webshare 공개 API로 직접 확인 — 위 2차 출처의 "한국 없음"은 틀림** [확정]
  - `GET https://proxy.webshare.io/api/v2/subscription/customize/?query=…` 인증 없이 200. proxy_subtype `isp`의 `available_countries`: 공유(shared) KR 759, Private(semidedicated) KR 253, Dedicated KR 없음
  - `GET …/subscription/pricing/?query=…`(proxy_countries {"KR":20}, term monthly, 트래픽 250GB, 교체 10회, 하위 사용자 3명): 공유 $6.00(IP당 $0.30, US와 같음), Private $18.52, Dedicated $42.00(단 KR 재고 없음)
  - 공유형 ISP 나라 전체: US 27586, DE 8602, IT 8593, FR 6078, GB 4048, SG 1518, HK 1265, JP·CA·AT 1012, BE 1009, KR·AU·CO·CZ·RO 759, BR·PL·SE 506
  - 남은 확인: 실제 한국 통신사 IP인지, 강동구립도서관이 받아 주는지 [확인 필요: 사용자가 사서 `ipinfo.io/country`·도서관 상태 코드 시험]

## 확인 필요

| 항목 | 확인 방법 |
|---|---|
| Webshare 정적 주거용·데이터센터에 한국 IP가 있는지, 값 | 공식 화면 확인(가입 후 플랜 국가 목록) |
| 정적 주거용(가정 대역 고정 IP)을 ADR-0095 "고정 IP 상품"에 넣을지 | 사용자에게 질문 |
| AWS 서울 Elastic IP 리전 한도(기본 5개로 알려짐) | 공식 문서 확인(Service Quotas 화면) |
| Vultr 서울 추가 IPv4 값·상한 | 공식 문서 확인(주문 화면) |
| Alibaba Cloud 서울 EIP 단가·트래픽 과금 | 공식 문서 확인(가격 계산기) |
| dev HTTP 클라이언트에서 나가는 주소 지정 가능 여부 | dev 코드 확인, 프로토타입 |
