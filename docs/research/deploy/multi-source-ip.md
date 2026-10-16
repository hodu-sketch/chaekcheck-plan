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
| **AWS EC2 + 공인 IPv4 추가** (서비스 서버 t4g.medium에 붙임. 실제 서버는 시드니라 붙이는 IP도 호주 IP, 36행) | 추가 4개 × $3.65 = **약 $14.6** (기존 1개 제외) | t4g.medium은 최대 18개(아래) → 17개 추가 약 $62 | 예(서울) | 예(Elastic IP) | 나가는 데이터 서울 $0.126/GB(무료 한도 뒤) | 중: ENI·보조 사설 IP·EIP 연결 + OS 라우팅 | [확정] 공인 IPv4 $0.005/h (https://aws.amazon.com/vpc/pricing/ , `aws-crawl.md`), t4g.medium 네트워크 인터페이스 3개 × 인터페이스당 IPv4 6개 [확정] (https://docs.aws.amazon.com/ec2/latest/instancetypes/gp.html , 2026-10-16). 리전당 Elastic IP 기본 한도 5개 [확인 필요: Service Quotas 화면] |
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
- **바로잡음 (2026-10-16)**: 실제 운영 EC2는 무료 플랜 제약으로 **시드니(ap-southeast-2)**, 고정 IP <서버 IP> (사이클 17 `research.md` 330·334·339행). 위의 "서울"은 설계(ADR-0104) 기준이었음. → EC2 자기 IP와 거기에 더 붙이는 IP는 모두 **호주 IP**. 한국 IP는 Webshare 정적 주거용 20개뿐. 부산 전자도서관처럼 외국 IP를 막는 곳은 Webshare로만 열릴 것으로 봄 [안: 추론, 접속 시험으로 확인]

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

## 6. 결정 (2026-10-16, 결정 페이지 `easy/2026-10-16-multi-source-ip.html`)

- #1 "업체 프록시에 정적 주거용만 더하고 바뀌는 주거용은 계속 뺌" → **미승인**. 사용자: "요청마다 ip가 바귀는 주거용도 같이 했으면 해 정적 주거용이랑 같이". → ADR-0095 G안(주거용·바뀌는 IP 제외)을 뒤집음. 세는 방법·막힘 처리·비용은 이어지는 페이지 `easy/2026-10-16-multi-source-ip-followup.html`에서 [안]
- #2 "서버에 붙인 IP 여러 개를 나가는 길 한 종류로" → 사용자 질문 "근데 프록시랑 공인 아이피 여러개랑 구현이 달라?" → 같은 페이지에 답: 서버 안 IP마다 tinyproxy(`Bind`로 나가는 주소 지정, https://tinyproxy.github.io/ , 2026-10-16)를 두면 앱 코드는 업체 프록시와 같음, 다른 것은 서버 준비뿐. **승인** [확정] (사용자 승인, 2026-10-16). 덧붙임: "프록시랑 공인 아이피 여러개 다 되도록 구현 했으면 해 분리가 필요해서 각각 설정 따로 해야 하면 따로 하고" → 업체 프록시와 서버 자기 IP 여러 개를 둘 다 지원. 설정을 하나로 합칠지 따로 둘지는 설계(dev 구현) 때 필요에 따라 정함
- #3 "첫 배포는 프록시 없이, 막히면 EC2 IP 추가, 그다음 업체" → **미승인**. 사용자: "지금 프록시가 없으면 1초 제한에 걸려서 사용자가 거의의미가없어; 실제로 지인 몇 명에게 부탁했는데 로딩 이야기가 있어서 그래서 프록시를 같이 가야해". → 첫 배포부터 프록시. 무엇을 얼마나는 이어지는 페이지에서 [안]
- Webshare 바뀌는 주거용 한국 (공개 API, 2026-10-16) [확정]: 한국 IP 풀 230,263, 한 달 1GB $3.50, 3GB $9.00, 10GB $27.50 (`/subscription/pricing/`, proxy_subtype `residential`, proxy_countries KR)
- 조회 한 번 크기 참고: 강동구립 전자도서관 첫 화면 60,329바이트(2026-10-16 한 번) → 1GB ≈ 조회 약 16,000번 [안: 추정, 검색 결과 화면 크기는 다를 수 있음]

## 7. 첫 배포 프록시 결정 (2026-10-16, 결정 페이지 `easy/2026-10-16-multi-source-ip-followup.html`)

- #1 첫 배포부터 나가는 길 세 가지: EC2 자기 IP 1개, Webshare 한국 정적 주거용 공유 20개(한 달 $6), Webshare 한국 바뀌는 주거용 1GB(한 달 $3.50). 모두 설정 목록, 업체 주소·비밀번호는 서버 비밀 값 [확정] (사용자 승인, 2026-10-16)
- #2 도서관 사이트마다 고정 IP 21개(EC2 1 + 정적 20) 중 보낼 수 있는 IP 먼저(IP마다 동시 1건·1초, 교보 구독형 서버는 IP마다 동시 3건), 21개가 모두 그 사이트에서 바쁘거나 막혔을 때만 바뀌는 주거용 [확정] (사용자 승인, 2026-10-16)
- #3 바뀌는 주거용 접속 주소 하나 = 나가는 길 하나, 도서관 사이트마다 동시 5건(설정), 1초 간격 없음 [확정] (사용자 승인, 2026-10-16). 5는 Claude가 고른 시작 숫자 [이유 미확인]
- #4 바뀌는 주거용: 같은 사이트에서 연달아 5번 막히면 그 사이트로만 쉼, 10분부터 두 배·최대 7일로 다시 시험 [확정] (사용자 승인, 2026-10-16). 조건: "이런데 나한테 알려주기가 잘 되어야 해"
- #5 바뀌는 주거용: 그 달 산 양의 90%를 넘으면 이 길만 멈춤, 기록에 남김 [확정] (사용자 승인, 2026-10-16). 조건: 같음

## 8. 한도와 알림 (2026-10-16, 사용자: "고정 IP 21개도 용량 제한이 있지 않아? 이것도 막히기 전에 그만 하고 나한테 잘 알려줘야 해 … 너가 꼼꼼히 지금 설계/개발 안에서 고려해봐")

- EC2 자기 IP: 데이터 한도 없음. 인터넷으로 나가는 데이터 AWS 전체 매달 100GB 무료 [확정] (https://aws.amazon.com/ec2/pricing/on-demand/ , 2026-10-16). 이미 AWS 예산 메일(지출 $0.01 초과 → <알림 메일>, 사이클 17 research 339행)
- Webshare 데이터: "bandwidth limit covers your entire plan", 넘으면 "will stop your proxies from functioning", 다음 달로 안 넘어감 [확정] (https://help.webshare.io/en/articles/8370524-how-does-the-bandwidth-limit-work , 2026-10-16). 정적 20개 플랜 기본 250GB(구매 API 기본값). 한도 메일 여부 확인 못 함
- Webshare 동시 연결: 너무 많으면 429 `client_connect_high_concurrency`, High Concurrency 기능을 더 살 수 있음 (https://help.webshare.io/en/articles/8570214-what-are-the-configuration-errors). 기본 숫자 확인 못 함 [확인 필요]
- Webshare 정부 사이트: "Government Websites"는 사용량 기준 분야, 넘으면 KYC 포함 확인 절차·계정 제한·정지 가능 (https://help.webshare.io/en/articles/9987853-restricted-activities-with-webshare-proxies). 바뀌는 주거용에서는 제한 분야, KYC 뒤 풀 수 있음 (https://help.webshare.io/en/articles/10068143-restricted-websites-on-our-rotating-residential-proxy-network) (2026-10-16)
- Webshare 사용량 API: `GET https://proxy.webshare.io/api/v2/stats/aggregate/` → `bandwidth_total`, 성공·실패 요청 수, `error_reasons` 등, API 키 필요 (https://apidocs.webshare.io/proxystats/aggregate , 2026-10-16)
- CloudWatch 경보 무료 10개/달, 그 뒤 $0.10/경보 지표 [확정] (https://aws.amazon.com/cloudwatch/pricing/ , 2026-10-16). SNS 메일 값 확인 못 함
- 지금 설계: 사이클 17 모니터링 "알림은 두지 않음"(flow.md 52행), CloudWatch는 메모리·디스크만, 막힌 길은 로그·지표만 → 메일 없음
- 결정 (2026-10-16, 원격 Artifact https://claude.ai/artifact/2D8Py6Sxj2i22LgsS4aiZR, 페이지 `easy/2026-10-16-proxy-limits-alerts.html`):
  - #1 CloudWatch 경보 → AWS SNS 메일(`<알림 메일>`), 같은 일은 1시간에 한 번 [확정] (사용자 승인). 사이클 17 "알림은 두지 않음"을 바꿈
  - #2 메일 보낼 일: 길 쉼 시작·7일 상한·풀림, 모든 길 막혀 "확인 불가", 업체 데이터 80% 경고·90% 멈춤, 업체 계정 문제로 업체 길 전체 멈춤, 매일 아침 요약 [확정] (사용자 승인)
  - #3 정적 20개도 250GB의 90%에서 정적 길만 멈춤, 80% 경고, 우리가 센 양과 Webshare 사용량 API(`/api/v2/stats/aggregate/`, 1시간마다)를 비교해 큰 값 [확정] (사용자 승인)
  - #4 Webshare 업체 쪽 오류(407 인증 실패, 429 `client_connect_high_concurrency`, 계정 확인·정지)면 Webshare 길 전체를 바로 멈추고 메일, EC2 IP로 계속, 다시 켜기는 설정 [확정] (사용자 승인)
  - #5 `.go.kr`은 바뀌는 주거용으로 보내지 않음 → 미룸. 사용자: "이건 잘 모르겠어. 근데 이건 나중으로 미뤄도 될 것 같아 일단 고정ip먼저 할거거든....."
- **범위 바뀜 (2026-10-16)**: 사용자 "Webshare 정적 20개 이거먼저 할거고 동적은 좀 더 나중에 고민해도 될 것 같아". → 첫 배포 길은 EC2 자기 IP 1개 + Webshare 한국 정적 주거용 공유 20개($6). 7절 #1의 "바뀌는 주거용 1GB"와 #3·#4·#5(바뀌는 주거용 세기·막힘·GB 멈춤), 8절 #5는 나중에 다시 봄 (`docs/backlog.md`)

## 확인 필요

| 항목 | 확인 방법 |
|---|---|
| Webshare 정적 주거용·데이터센터에 한국 IP가 있는지, 값 | 공식 화면 확인(가입 후 플랜 국가 목록) |
| 정적 주거용(가정 대역 고정 IP)을 ADR-0095 "고정 IP 상품"에 넣을지 | 사용자에게 질문 |
| AWS 시드니 Elastic IP 리전 한도(기본 5개로 알려짐) | 공식 문서 확인(Service Quotas 화면) |
| Vultr 서울 추가 IPv4 값·상한 | 공식 문서 확인(주문 화면) |
| Alibaba Cloud 서울 EIP 단가·트래픽 과금 | 공식 문서 확인(가격 계산기) |
| dev HTTP 클라이언트에서 나가는 주소 지정 가능 여부 | dev 코드 확인, 프로토타입 |

## 9. Webshare 정적 20개 먼저: 가입·구매·접속 시험 (2026-10-16, 사용자: "정적인 거 하려고 하는데 계정 생성이나 뭐 이런거 그리고 간단한 접속 테스트나 이런거 도와줄래")

- 계정 만들기·결제·비밀번호 입력은 사용자가 함. Claude는 절차 안내·구매 링크·시험 스크립트·결과 정리
- 구매 화면 링크(한국 20개 미리 채움): `https://www.webshare.io/express-checkout?proxyType=%22shared%22&proxySubtype=%22isp%22&proxyCount=20&countries=%7B%22KR%22%3A20%7D&bandwidth=250&isYearly=false` [안: 링크 매개변수는 Webshare 페이지의 구매 링크를 본뜸, 화면에서 South Korea 20·$6 확인 필요]
- 인증: IP Authorization(아이디·비밀번호 없이 IP로 허용), 계정마다 기본 1개 IP [확정] (https://intercom.help/webshare/en/articles/8375312-ip-authorization , 2026-10-16). 시험 때는 집 PC 공인 IP(SK브로드밴드), 운영 때는 EC2 IP <서버 IP>로 바꿈 [안]
- 목록 파일: 대시보드 Proxy List → Download, `.txt`, 한 줄에 `ip:port:username:password` [확정] (https://help.webshare.io/en/articles/8596696-how-can-i-download-my-proxy-list , 2026-10-16). 저장소 밖(예: 내려받기 폴더)에 둠
- 시험 스크립트: `docs/research/deploy/tools/proxy_check.py` (파이썬 표준 라이브러리만). 프록시마다 ipinfo.io로 나라·통신사, 그다음 강동구립 홈페이지, 강동 전자도서관, 부산 전자도서관(외국 IP 막음), 교보 구독형 강동 `gdlib.dkyobobook.co.kr`(집 IP 막음)에 GET 1번씩, 요청 사이 1초. 기본 앞 3개, `--all`이면 20개. 비밀번호는 출력 안 함
- 판정: 나라 KR, 통신사가 한국 통신사, 네 곳이 열림. 아니면 결제 뒤 48시간 안·1GB 미만일 때 환불(시험 20개 × 5요청은 수 MB) [안]

### 9-1. 무료 10개로 먼저 시험 (2026-10-16 저녁, 사용자: "미국 무료걸로 먼저 시도해볼래?", "집 IP 211.178.70.242를 Webshare IP Authorization에 등록하고 무료 10개로 시험 돌려줘")

- Claude가 사용자 Chrome(로그인된 Webshare)에서 IP Authorization에 집 IP 등록(무료 플랜은 1개까지), 목록은 IP Authentication 보기로 주소·포트만 가져옴(비밀번호 안 씀)
- 무료 10개 = 데이터센터 IP(영국·스페인·미국·폴란드/포르투갈·독일, 통신사는 HostPapa·Leaseweb 등 호스팅 회사), 한국 없음
- 결과 (`tools/proxy_check.py --all`, 프록시마다 사이트별 GET 1번, 요청 사이 1초) [확정] (직접 시험):

| | 열림 | 걸린 시간 |
|---|---|---|
| 강동구립 홈페이지 `www.gdlibrary.or.kr` | 9/9 (200, 586KB) | 4.6~22.9초 |
| 강동 전자도서관 `ebook.gdlibrary.or.kr` | 9/9 (200, 약 60KB) | 2.3~5.7초 |
| 부산 전자도서관 `ebook.busan.go.kr` | **0/9** (15초 시간 초과) | — |
| 교보 구독형 강동 `gdlib.dkyobobook.co.kr` | **9/9** (200, 70KB) | 3.6~6.9초 |

- 1개(64.137.96.74, 스페인)는 ipinfo.io가 403 → 그 프록시는 시험 건너뜀(원인 확인 못 함)
- 뜻 [안: 해석]: (1) 집 IP를 막은 교보 구독형 서버도 다른 IP로는 열림. (2) 부산은 외국 IP를 모두 막음(시드니 AWS 때와 같음) → 한국 IP(정적 주거용)가 있어야 열릴 것. (3) 외국 프록시를 거치면 느림(홈페이지 최대 23초) → 한국 IP는 더 빠를 것으로 기대, 정적 20개 사서 같은 시험으로 비교
- 쓴 데이터: 약 6.5MB(무료 1GB 중)
