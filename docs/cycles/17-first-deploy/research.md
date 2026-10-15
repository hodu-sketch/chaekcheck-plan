# 사이클 17 조사 (2026-10-13)

`scope.md` "먼저 조사할 것" 가운데 문서로 확인할 수 있는 것. 서버·터널 시험이 필요한 것은 `spec.md` 확인 필요에 남김. 앞선 조사는 `docs/research/deploy/hosting-options.md`(업체 요금, Cloudflare, 모니터링, 프록시 종류)를 링크로 씀.

## 1. Lightsail에서 비밀 값 읽기 (Parameter Store·Secrets Manager)

| 사실 | 출처 (확인 2026-10-13) |
|---|---|
| Lightsail 문서는 "Lightsail does not support service roles". 사용자가 만든 IAM 역할을 인스턴스에 붙이는 방법은 공식 문서에서 찾지 못함 | https://docs.aws.amazon.com/lightsail/latest/userguide/security_iam_service-with-iam.html |
| Lightsail 문서가 안내하는 방법: IAM 사용자 접근 키를 만들어 인스턴스에서 `aws configure` (사용자당 키 최대 2개) | https://docs.aws.amazon.com/lightsail/latest/userguide/lightsail-how-to-set-up-access-keys-to-use-sdk-api-cli.html |
| AWS는 장기 키 대신 임시 자격 증명을 권하고, 키를 쓰면 주기적으로 교체하라고 함. IAM Roles Anywhere(X.509 인증서)는 자체 CA가 필요 | https://docs.aws.amazon.com/lightsail/latest/userguide/security_iam.html , https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html |
| Parameter Store Standard: 저장 무료, 기본 처리량 API 호출 무료, 값 4KB, 리전당 1만 개, 조회 API 합쳐 40 TPS, 서울 엔드포인트 있음 | https://aws.amazon.com/systems-manager/pricing/ , https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-advanced-parameters.html , https://docs.aws.amazon.com/general/latest/gr/ssm.html |
| SecureString은 기본 AWS 관리형 키 `aws/ssm`. 관리형 키는 보관 무료, 복호화 요청은 과금되나 월 2만 건 무료 | https://docs.aws.amazon.com/systems-manager/latest/userguide/secure-string-parameter-kms-encryption.html , https://aws.amazon.com/kms/pricing/ |
| Secrets Manager: 비밀 값 하나 월 $0.40, API 1만 건 $0.05 (가격 페이지 예시 문장으로 확인) | https://aws.amazon.com/secrets-manager/pricing/ |
| 필요한 권한: `ssm:GetParametersByPath`(경로를 리소스로), `ssm:GetParameter(s)`, `kms:Decrypt` / Secrets Manager는 `secretsmanager:GetSecretValue` | https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-restrict-decryption.html |
| Spring Cloud AWS: `spring.config.import=aws-parameterstore:/경로/`, 의존성 `spring-cloud-aws-starter-parameter-store`, 기본 자격 증명 체인 사용. 4.x ↔ Spring Boot 4.0.x까지 호환표에 있음. dev는 Spring Boot 4.1.1 → 호환 확인 못 함 | https://docs.awspring.io/spring-cloud-aws/docs/4.0.0/reference/html/index.html , https://github.com/awspring/spring-cloud-aws |
| Lightsail 방화벽: 기본 OS는 SSH 22·HTTP 80이 모든 IP에 열림, 443 닫힘. 허용 규칙만 있고 가장 넓은 규칙이 이김. SSH는 "Restrict to IP address"로 내 IP만 + 브라우저 SSH 허용 | https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-firewall-and-port-mappings-in-amazon-lightsail.html , https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-editing-firewall-rules.html |
| Lightsail 자동 스냅샷: 하루 1번, 최근 7개, $0.05/GB-월, 인스턴스를 지우면 자동 스냅샷도 지워짐 | https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-configuring-automatic-snapshots.html , https://aws.amazon.com/lightsail/pricing/ |

확인 못 함: Lightsail 인스턴스에 IAM 역할이 있는지(시험: `aws sts get-caller-identity`), `aws/ssm`에서 `kms:Decrypt`를 정책에 꼭 적어야 하는지, Spring Cloud AWS 4.2와 Boot 4.1 호환.

## 2. 카카오 로그인 운영 전환

| 할 일 | 콘솔 위치 (문서 기준 이름) | 규칙 | 출처 |
|---|---|---|---|
| 카카오 로그인 ON | 카카오 로그인 > 사용 설정 | OFF면 `KOE004` | https://developers.kakao.com/docs/ko/kakaologin/prerequisite |
| 운영 Redirect URI 등록 | 앱 > 플랫폼 키 > REST API 키 > 리다이렉트 URI | 키 하나에 최대 10개, 프로토콜·도메인·경로·끝 `/`까지 완전히 같아야 함(다르면 `KOE006`), HTTP·HTTPS 따로 | https://developers.kakao.com/docs/ko/app-setting/app , https://developers.kakao.com/docs/ko/kakaologin/faq |
| 웹 도메인 | 앱 > 제품 링크 관리 > 웹 도메인 | 최대 10개 | https://developers.kakao.com/docs/ko/app-setting/app |
| 클라이언트 시크릿 | 앱 > 플랫폼 키 > REST API 키 > 클라이언트 시크릿 | 활성화면 토큰 요청에 꼭 필요. 재발급 순서: OFF → 재발급 → 서비스 반영 → ON | 같은 곳 |
| 동의항목 | 카카오 로그인 > 동의항목 | 닉네임·프로필 사진은 기본 제공. 이메일은 비즈 앱 필요. 이름·성별 등은 심사 | https://developers.kakao.com/docs/ko/kakaologin/utilize |
| 누가 로그인할 수 있나 | — | FAQ "카카오로그인은 누구나 사용할 수 있지만"(심사는 개인정보 동의항목 권한에만). 일반 앱 사용자 수 제한 문서에 없음 | https://developers.kakao.com/docs/ko/kakaologin/faq |
| 연결 해제 웹훅 | 앱 > 웹훅 > 연결 해제 웹훅 | HTTPS, 443만. 오래 응답이 없거나 오류가 잦으면 일시 중지 | https://developers.kakao.com/docs/ko/app-setting/app |
| 탈퇴 때 연결 끊기 | API | "서비스는 반드시 탈퇴 과정에 연결 해제 요청을 포함해" | https://developers.kakao.com/docs/ko/kakaologin/common |
| 토큰 한도 | — | 사용자 1명당 액세스 토큰 10분 20개 | https://developers.kakao.com/docs/ko/getting-started/quota |
| 장기 미이용 | — | 설정 변경·API 호출 180일 없으면 장기 미이용 앱 | https://developers.kakao.com/docs/ko/app-setting/app |

dev 확인 (2026-10-13): Redirect URI는 `AUTH_PUBLIC_BASE_URL` + `/api/v1/auth/login/oauth2/code/kakao`로 만들어짐(`LoginConfiguration.java:130`) → `https://chaekcheck.com`으로 두면 Cloudflare 뒤에서도 https. 연결 해제 웹훅 컨트롤러가 있음(`auth/internal/webhook/UnlinkWebhookController.java`, 앱 번호 `KAKAO_APP_ID` 확인).

## 3. 업체 고정 IP 프록시 (한국)

9개 업체를 공식 페이지로 조사함(2026-10-14, 서브에이전트 4건). 우리 조건은 **한국 고정 IP 1~3개, 적은 전송량, 아이디·비밀번호 또는 IP 허용, 월 결제**. 값·조항은 모두 업체 공식 페이지 표기이고, 끝내 확인하지 못한 항목은 "확인 못 함".

| 업체 | 한국 고정 IP 상품 | 최소·값 (업체 표기) | 정부 사이트 조항 | 출처 |
|---|---|---|---|---|
| Proxy-Cheap | Static Residential·Datacenter, KR 있음 | 최소 수량 확인 못 함. Static Res $2.44/월, DC IPv4 $1.49/월, 무제한 전송 | **정부 사이트 전용 조항 없음** (AUP는 일반 "Provider가 특정 사이트 차단 가능" 18항만) | https://proxy-cheap.com/locations/asia/south-korea , https://proxy-cheap.com/appropriate-use-policy |
| Rayobyte | Static **Datacenter만** KR (ISP는 KR 미제공) | 최소 5 IP, $2.50/IP/월, 무제한(fair use) | **정부 사이트 전용 조항 없음** (일반 준법 조항만) | https://rayobyte.com/products/datacenter-ips/ , https://rayobyte.com/tos-and-aup/ |
| Mango Proxy | Static Datacenter, 체크아웃에서 KR 선택 | 최소 수량 확인 못 함, $1.43/IP/월, 무제한. 인증·엔드포인트·환불·KYC 확인 못 함, 구매는 Telegram 봇 | **정부 사이트 전용 조항 없음** | https://mangoproxy.com/prod-dc-static/ , https://mangoproxy.com/terms-of-service/ |
| IPRoyal | Datacenter, KR 22,863 IP | 30일 $1.57/proxy, 월 100GB 상한 | AUP 4.4 `.gov`·은행 차단, **4.4.1 신분증 인증 시 `.gov` 접근 허용(유일하게 명문화)**, 3.2 robots.txt·속도 제한 우회 금지 | https://iproyal.com/datacenter-proxies/ , https://iproyal.com/acceptable-use-policy/ |
| Decodo | Dedicated ISP, KR 있음 | 최소 3 IP $9.99/월, 무제한, 14일 환불 | 정부 사이트 차단. 신분증 인증 예외는 Mailing·Streaming·Business·회전형에만, **정부에는 적용 안 됨** | https://decodo.com/proxies/isp-proxies/pricing , https://decodo.com/questions/do-you-have-any-blocked-sites |
| Oxylabs | Dedicated Datacenter·ISP, KR 확정 | DC IP당 $2(최대 2개), ISP 5.5k IP. 최소 수량 명시 없음 | **DC·ISP 제한 대상 모두 "Government websites" (usa.gov, canada.ca 예시, 비열거적)**, 모든 고객 KYC 질문지 | https://oxylabs.io/locations/south-korea , https://developers.oxylabs.io/products/proxies/datacenter-proxies/restricted-targets.md , https://oxylabs.io/kyc-and-safety |
| Webshare | KR 위치 있음 | **DC 최소 100개 / Static Res 최소 20개 → 1~3개 불가** | "government infrastructure" 금지, "Government Websites"는 사용량 임계 카테고리 | https://www.webshare.io/proxy-locations/kr , https://help.webshare.io/en/articles/9987853-restricted-activities-with-webshare-proxies |
| Bright Data | ISP·Datacenter, KR 네트워크 | **최소 10 IP**, ISP $1.8/IP, DC Shared $1.4/IP | **정부 사이트 기본 차단(policy_20051, 403), `.gov` 접미사에 한정 안 함 → `go.kr`도 차단 대상 가능**, KYC+컴플라이언스 승인 경로 | https://www.brightdata.com/locations/kr , https://docs.brightdata.com/general/policy/acceptable-use-policy , https://docs.brightdata.com/scraping-automation/web-unlocker/kyc-and-access |
| ~~NetNut~~ | **제외** | — | **2026-07-02 FBI 도메인 압수(Popa 봇넷 연루 혐의), 2026-10-14 사이트에 압수 배너. 후보 제외** | https://krebsonsecurity.com/2026/07/fbi-seizes-netnut-proxy-platform-popa-botnet/ |

- 공공 전자도서관 주소 다수가 `go.kr`·지자체·교육청 도메인임(예: `ebook.gangnam.go.kr`, `library.busan.go.kr`, 수집 목록). **어느 업체도 한국 `go.kr`을 콕 집어 적지 않음** → 결제 전 업체 지원팀에 "한국 공공도서관(`*.go.kr`) 접속이 되는지" 물어야 함 [확인 필요]
- 조사한 9곳은 모두 해외 업체임(국내 업체 아님). 정부 사이트 제한은 업체마다 다름: **Proxy-Cheap·Rayobyte·Mango는 정부 사이트 전용 조항이 아예 없음**, Bright Data는 기본 차단(가장 셈), IPRoyal은 차단하되 신분증 인증으로 해제, Oxylabs·Decodo·Webshare는 제한·문의 대상
- 1~3개 소량 조건에 맞는 곳: Proxy-Cheap·Mango(최소 수량 미확인이나 소량 가능해 보임), Decodo(최소 3). Rayobyte는 최소 5, Bright Data 최소 10, Webshare는 20~100으로 소량에 안 맞음
- IPRoyal AUP 3.2(속도 제한 우회 금지)와 ADR-0095의 "막힌 IP만 멈추고 다른 IP로 계속"이 맞는지 [확인 필요: 업체 약관 해석, 전문가 확인 항목과 함께]
- 여러 업체에서 "HTTP CONNECT" 용어 자체는 공식 문서에 없으나 HTTP(S) 프록시 지원이 명시돼 HTTPS 터널링은 가능으로 보임(§4 Java 프록시와 함께 시험 확인). 업체별 상세(인증방식·엔드포인트 형식·환불일·KYC)의 확인 못 함 항목은 서브에이전트 보고 원문 참조
- **이번 첫 배포 방향** [확정] (사용자, 2026-10-14, 캔버스 채팅): "프록시 안 쓰고 기존처럼 조회 서버 하는 걸로 해둬" → **프록시 업체(②안)를 쓰지 않고, 본 서비스 서버가 직접 조회(ADR-0095 ①안)**. 아래 두 업체 선택 방향은 나중에 프록시를 붙일 때만 적용(지금은 보류)
- 업체 선택 방향 [확정] (사용자 승인, 2026-10-14, `easy/2026-10-14-proxy-vendor.html` #1·#2, 프록시를 붙일 경우 적용): ① 결제 전 두세 업체에 "한국 `go.kr` 공공도서관 접속 가능 여부"를 먼저 묻고, 된다는 곳 중에서 고름. ② 업체 종류는 데이터센터 IP부터 시험하고 막히면 ISP·주거용으로 옮김. 둘 다 고정 IP라 "IP를 바꿔 가지 않음" 원칙에 맞음
- VPN 검토 (사용자 질문 2026-10-14): 상용 VPN은 기기 전체 트래픽을 한 출구로 보내 "도서관 호출만·나가는 IP마다 따로"가 안 되고 고정 KR IP도 드물어 부적합. 직접 세운 VPN(한국 VPS + WireGuard)은 가능하나 ADR-0095 ③안(한국에 조회 서버 두기)과 사실상 같음 → 프록시 업체(②안) vs 한국 VPS 직접(③안)의 선택으로 정리. 셋 중 무엇을 먼저 할지는 설계에서 ADR-0095 세 길을 정할 때 함께 [확인 필요: 사용자 결정]

## 4. Java HttpClient로 인증 프록시 쓰기

| 사실 | 출처 |
|---|---|
| `java.net.http`는 HTTP 프록시(HTTPS는 CONNECT)만 씀. ProxySelector가 SOCKS를 주면 무시하고 **직접 연결**(서버 IP가 나감) | OpenJDK `HttpRequestImpl.java` (https://github.com/openjdk/jdk/tree/master/src/java.net.http/share/classes/jdk/internal/net/http) |
| HTTPS를 Basic 인증 프록시로 보내려면 `-Djdk.http.auth.tunneling.disabledSchemes=`(빈 값) 필요. JDK 21·25 기본값 `Basic`(막힘), 이때 직접 넣은 `Proxy-Authorization`도 빠짐 | https://raw.githubusercontent.com/openjdk/jdk25u/master/src/java.base/share/conf/net.properties , https://docs.oracle.com/en/java/javase/25/docs/api/java.net.http/module-summary.html |
| 내장 Authenticator는 Basic만 지원 | https://docs.oracle.com/en/java/javase/25/docs/api/java.net.http/java/net/http/HttpClient.Builder.html |
| 요청마다 `ProxySelector.select(uri)` 호출, 결과의 첫 항목만 씀 | OpenJDK `HttpClientImpl.java`, `HttpRequestImpl.java` |
| 프록시마다 HttpClient를 따로 두면 인증 분리가 단순 | 같은 Builder 문서 (설계 판단) |

확인 못 함: 빈 값 설정으로 실제 Basic CONNECT가 통과하는지(시험), 프록시가 다른 요청끼리 연결 풀이 섞이지 않는지.

## 5. 그 밖

- Prometheus 기본 보관: "the retention time defaults to `15d`" (https://prometheus.io/docs/prometheus/latest/storage/, 확인 2026-10-13)
- dev 비밀 값 목록 (`.env.example`, 2026-10-13): `DB_PASSWORD`, `AUTH_JWT_SECRET`, `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`, `KAKAO_ADMIN_KEY`, `NAVER_CLIENT_ID`·`SECRET`(카카오만 쓰면 불필요), `FETCH_SERVICE_TOKEN`. 사이클 12~14 병합 뒤 늘어날 수 있음(예: 사서추천 국립중앙도서관 API 키) [확인 필요: 병합 뒤]
- 빠른 터널 시험용 nginx 설정에 진짜 IP 읽기가 이미 있음: dev `deploy/nginx/tunnel-test.conf`(`real_ip_header CF-Connecting-IP`, 사설 주소만 신뢰, http → https 이동)
- `PRE_DEPLOYMENT` 파일이 아직 있음(dev `backend/src/main/resources/db/changelog/PRE_DEPLOYMENT`)

## 6. 사이클 16에서 받은 것 (2026-10-13, 16 세션 글. 근거: 사이클 16 `research.md` 6절)

### 16이 17에게 받아야 하는 것

- nginx 접속 기록 보관 기간: 처리방침의 "처리하는 개인정보 항목·보유 기간"에 들어감. 이 값이 없으면 16이 처리방침을 확정할 수 없음 → scope 포함 9에서 정하고 16에 알림

### 바깥 업체를 처리방침에 적는 방향 (16에서 정함, 아래 "첫 배포 순서" 마지막 줄)

- 출처(16 확인): 개인정보 보호법 제26조·제28조의8, 시행령 제31조①2호, 개인정보위 처리방침 작성지침(2026.4.) PDF 44~50쪽, 개인정보 처리 통합 안내서(2025.7.) PDF 13·167·182쪽, Cloudflare Customer DPA v6.4, AWS Data Privacy FAQ (확인 2026-10-13)
- AWS Lightsail·Parameter Store/Secrets Manager(서울): "처리 위탁", 국외 이전 아님
- Cloudflare Tunnel: "처리 위탁" + "국외 이전(미국, Cloudflare, Inc.)". Cloudflare DPA가 스스로 Processor라고 쓰고 IP가 든 로그를 만듦. 동의 대신 처리방침 공개(법 제28조의8①3호)
- 프록시 업체(검색어만 받음)·자체 Prometheus/Grafana: 적지 않음. 프록시 업체를 정하면 나라·계약 조건을 다시 확인

### 배포 때 계정에서 확인해 처리방침에 옮겨 적을 값 (16 요청, 2026-10-13 고침: 비회원 국외 이전 근거·Cloudflare 데이터센터 나라·AWS 접근권한 세 줄은 뺌, 사용자 "개인 서버 규모에 과함")

| 항목 | 확인 방법 |
|---|---|
| AWS 계약 법인 이름 | 배포 때 AWS 계정·약관에서 옮겨 옴 |
| Cloudflare, Inc. 연락처와 요청 정보 보유 기간 | 배포 때 Cloudflare 계정·DPA에서 옮겨 옴 |
| Cloudflare가 방문자 브라우저에 쿠키를 심는지(심으면 처리방침 "자동 수집 장치" 항목) | 배포 뒤 브라우저에서 확인 |

### 첫 배포 순서에 닿는 것

- 처리방침은 로그인 기능과 상관없이 늘 공개 [확정] (16 spec R6-2, 사용자 승인 2026-10-12. 근거: 작성지침 17쪽, 법 제30조②). 지금 dev는 로그인이 꺼지면 `/privacy`가 숨겨지고 글도 "검토 전 자리 글". 16 개발(12·13·14 회고 뒤)에서 바뀜 → 첫 배포가 16 개발보다 먼저면, 검토된 처리방침이 로그인과 상관없이 보이는지 순서 확인 [확인 필요: 17·16 개발 순서]. 17은 로그인을 켜고 배포하므로 지금 코드로도 `/privacy`는 보이지만 글은 검토 전 자리 글임
- 이용 기록(15)과 nginx 접속 기록은 로그인이 꺼져 있어도 IP를 남김
- ~~배포 체크리스트에 넣을 것 (16 요청, 1차): 첫 배포 직전에 첫 버전을 "검토한 글 + 시행일 = 배포일"로~~ → **고침 (16 2차, 2026-10-13)**: 시행일은 첫 배포일이 아니라 **"모르는 사람에게도 공개하는 날"(공개일)**. 공지·서비스 안내·이용약관·처리방침·동의문 모두 [확정] (사용자: "이거 아직 외부인에게 공개 안 되어서(지인들하고만 공개) 그냥 내가 외부 내가 모르는 사람들에게도 공개할 때 그 날짜로 다 맞춰줘 이것말고도 전부", 2026-10-13). 운영 DB는 검토한 글부터 시작 [확정]
- 첫 배포 뒤 지인에게만 여는 동안은 검토 전 자리 글이 보여도 공개일 전으로 봄. 16 개발(검토한 처리방침, 로그인과 상관없이 늘 보이는 `/privacy`)은 공개일 전까지 들어가면 됨 [안: 16 판단, 사용자 확인 전]
- **배포 체크리스트에 넣을 것 (16 요청)**: 공개일을 정할 때 16 개발이 끝났는지(검토한 글이 운영 DB에 있고 `/privacy`가 늘 보이는지) 확인하는 줄
- 첫 동의문·처리방침 문구의 로그인 수단은 카카오만 [확정] (사용자, 2026-10-13). 네이버를 켜는 날에는 동의문·처리방침 새 버전 필요
- 도메인을 Cloudflare에서 사는 것은 처리방침에 새로 더할 것 없음(16 판단). 바깥 업체 기재는 16에서 모두 정함 [확정] (사용자, 2026-10-13): AWS는 처리 위탁(노트북으로 옮기면 뺌), Cloudflare는 처리 위탁 + 국외 이전("웹 요청 전달·보안", Cloudflare, Inc., "미국 및 Cloudflare 네트워크가 있는 나라", 법 제28조의8①3호 + 처리방침 공개), 프록시 업체·자체 모니터링은 적지 않음
- 연락처 `chaekcheck9104@gmail.com` [확정]은 서비스 안내 글 안에만 둠. 바닥글의 "문의: 준비 중"은 없앰 [확정] (16 flow, 2026-10-13)

### 이름·병합

- 16 새 모듈·schema `sitecontent` [안], 15 `usagelog` [안]. 15·16·17이 Liquibase master changelog 끝줄을 고치면 병합 순서 확인. 17은 표 변경이 없을 것으로 봄 [안] (scope 영향 받을 모듈)

## 7. 사이클 15에서 받은 것 (2026-10-13, 15 세션 글)

| 15가 기대는 것 | 17에서 할 일 | 상태 |
|---|---|---|
| 15 서비스는 IP를 nginx가 넘기는 `X-Real-IP`(= nginx `$remote_addr`, dev `deploy/nginx/chaekcheck-locations.conf:17`)에서 읽음. 서비스 쪽 forwarded 설정은 쓰지 않음 | 운영 nginx에 `real_ip_header CF-Connecting-IP` + `set_real_ip_from`(cloudflared가 nginx에 붙는 주소)을 넣음 → `$remote_addr`·`X-Real-IP`가 실제 사용자 IP가 됨 | [확정: 넣음] (scope 포함 3) / 믿는 주소 범위 [안] |
| `ngx_http_realip_module`이 기본 빌드에 없을 수 있음 (https://nginx.org/en/docs/http/ngx_http_realip_module.html) | dev 공개 시험(2026-10-05, Docker `nginx:stable-alpine`, `tunnel-test.conf`)에서 `real_ip_header CF-Connecting-IP`가 동작해 "nginx 로그에 실제 접속 IP가 찍힘" (dev `plan-feedback.md` 1808~1810행) → 같은 이미지면 모듈 있음. nginx.org 패키지는 "built with all modules that do not require additional libraries" (https://nginx.org/en/linux_packages.html, 확인 2026-10-13). 운영 이미지에서 `nginx -V`로 한 번 더 확인 | [확인 필요: 운영 이미지 `nginx -V`] |
| 터널을 거쳐도 `CF-Connecting-IP`가 붙는지 | 빠른 터널에서는 붙었음(위 dev 시험). 정식 터널에서 배포 때 시험하고 15에 알림 | [확인 필요: 배포 시험] |
| 15가 dev에 더할 nginx 설정: `location = /api/v1/usage-events` IP당 1분 60번(넘치면 기록 안 하고 204), 직접 찾기·대출 조회에서 UA에 bot·crawler·spider면 403, `public/robots.txt`로 `/api/` 금지 | 17의 "나머지 `/api/` IP별 한도"(scope 포함 3)와 같은 파일을 고침 → location 겹침과 순서를 17 설계에서 맞춤. Cloudflare 무료 규칙을 쓰면 nginx 한도와 나누는 방법을 15에 알림 | [안: 17 설계에서] |
| nginx 접속 기록 보관 기간, 검색어가 든 쿼리 문자열을 접속 기록에서 뺄지 (15의 제안) | **보관 14일**, 지난 것은 매일 지움. 접속 기록에는 쿼리 문자열을 빼고 경로만 남김(`$uri`, `$request_uri`·`$request`는 쓰지 않음) | [확정] (사용자: "응 추천대로 해줘", 2026-10-13) |
| 15 기록 켜기는 설정 값 하나. 첫 배포 때 꺼 둠(운영 환경 변수에 "꺼짐"), 처리방침 공개일에 켬. 지인 기간에 잠깐 켜서 실서버 시험(터널 거친 IP가 실제 사용자 IP인지, 켜기 전후 속도·메모리) 뒤 그 기간 기록을 지우고 다시 끔 | 배포 체크리스트: 첫 배포 때 15 기록 "꺼짐", 실서버 시험 때 17의 `CF-Connecting-IP` 확인을 같은 날 함께, 공개일에 켬 | [확정] (사용자 승인, 2026-10-13) |
| 15가 더하는 몫: 서비스 메모리 기록 버퍼 최대 1만 줄(약 5MB), DB 연결 추가 없음, 디스크 1년 1~2GB(어림). AC-16을 모니터링을 켠 상태로 잼 | 운영 메모리 값 다시 재기(scope 포함 6)에 함께 넣음 | [안] |
| 15 기록 지우기 매일 04:30(서울). 지금 04:00 회원 정리, 05:00 사서 추천 받기 | 17의 밤 DB 백업은 **매일 03:00(서울)** | [확정] (사용자: "응 추천대로 해줘", 2026-10-13) |

## 8. 사이클 16 최종 전달 (2026-10-14, 6절을 이것으로 정리)

### 공개일 전 체크리스트 (16 요청) [확정: 넣음]

- [ ] 16 개발(`sitecontent` 모듈, 로그인과 상관없이 늘 보이는 `/privacy`)이 들어갔는지
- [ ] 운영 seed를 승인된 초안(사이클 16 `drafts/`, 사용자 승인 2026-10-13) + 시행일 = 공개일로 넣었는지. 개발 DB는 초기화, 테스트 계정은 다시 가입
- [ ] 첫 공지 "책첵을 시작했어요"를 공개일 게시일로 넣기 (사이클 16 `drafts/ops-sql.md` 1번)
- [ ] 15 이용 기록 켜기 (공개일)

### 배포 때 계정·계약서에서 확인해 16에 알릴 값 [확인 필요]

- AWS 계약 법인 이름 (Lightsail 서울 계정)
- Cloudflare, Inc. 연락처, 요청 정보 보유 기간 (Cloudflare 계약서·DPA)
- Cloudflare가 방문자 브라우저에 쿠키를 심는지

### 처리방침 바깥 업체 (16 확정, 17은 참고)

- AWS 처리 위탁(서버·데이터 보관, 한국). 노트북으로 옮기는 날 16에 알림(처리방침 새 판에서 AWS 줄을 빼고 안전 조치 문구를 노트북에 맞춤) → 노트북 이전 체크리스트에 넣음
- Cloudflare 처리 위탁 + 국외 이전("웹 요청 전달·보안", "미국 및 Cloudflare 네트워크가 있는 나라")
- 프록시 업체·자체 모니터링 적지 않음. 프록시 업체를 정하면 나라·계약 조건만 16에 알림
- 개인정보 보호 담당 표기 "책첵 운영자, chaekcheck9104@gmail.com"

### 운영 DB에 Claude가 SQL을 넣을 길 (16 요청) [안: 17 설계에서]

- 16은 운영자 화면 없이 공지·약관을 Claude가 SQL로 넣음(사이클 16 `drafts/ops-sql.md`)
- 제안: 운영자 PC에서 Cloudflare Tunnel로 SSH(설계 결정 #8과 같은 길) → 서버에서 `docker exec db psql`로 실행. DB 계정은 `sitecontent` schema 쓰기만 있는 계정을 따로 둠. 실행은 사용자가 승인한 SQL만, 사용자가 연 세션에서 [안]

### 그대로인 것

- nginx 접속 기록 14일·쿼리 문자열 제외 → 처리방침에 그대로
- 16 Liquibase: `sitecontent/001·002`, `auth/002`를 master 끝에 더함. 17은 DB 변경 없음 [안] (생기면 병합 순서 알림)

## 9. 사이클 15 질문 답·16에 전할 값 (2026-10-14)

- DB 백업 보관: 서버 2일치, 내 PC 7일치(매일 1개) [확정] (사용자 승인). **16에 전함**: 처리방침 "지운 정보는 백업에 7일 동안 남았다가 지워집니다" (16 요청, 2026-10-14)
- 서비스(앱) 로그 보관: 14일(접속 기록과 같음), 도서관 요청 응답을 서버 로그로만 남김(IP 없음) [확정] (사용자 승인)
- 클릭·행동 알림 주소: `/api/v1/library-clicks` → `/api/v1/usage-events` (15, 2026-10-14). 한도 1분 60번 그대로. spec R3-3 반영
- 로그인 쿠키 경로 `/api/v1`(ADR-0102): nginx 할 일 없음. spec R12-1

## 10. 공공기관 접속 공개 자료 (2026-10-14, 사용자 질문)

### 한국 공개 자료

| 자료 | 내용 | 출처 (확인 2026-10-14) |
|---|---|---|
| 도서관 정보나루 Open API | 공식 API로 도서관별 장서·대출·소장 여부(ISBN)를 받을 수 있음. 회원가입 + 인증키 필요, "데이터 공개에 참여하는 도서관"만. 호출 제한은 페이지에 없음(매뉴얼·약관 확인) | https://www.data4library.kr/apiUtilization |
| 전자정부 웹사이트 품질관리 지침 (행안부 고시) | 2025-06-25 개정(제2025-46호)으로 크롤링 "완전 허용" → "일부 차단 가능"으로 바뀜. 공공기관 사이트를 전면 개방으로 가정하면 안 됨. 적용 대상: 행정·공공기관. 조문 원문·robots.txt 구체 문구는 확인 못 함(law.go.kr 본문 미표시) | https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000016&nttId=118636 |
| 공공데이터포털(data.go.kr) 약관 | "제공시스템의 성능 저하 등의 문제가 발생할 경우 서비스 이용을 제한할 수 있습니다"(오픈 API 이용 제한). 크롤링을 콕 집어 금지하는 문구는 없음. ※ "사전협의 없는 자동화된 접근 제한"은 특정 기관(공단) 처리방침 문구라 일반 규정 아님 | https://www.data.go.kr/ugs/selectPortalPolicyView.do |

- 뜻: 공공 도서관의 **장서·대출·소장 여부**는 정보나루 공식 API라는 합법적인 길이 있음. 다만 우리 서비스가 묻는 것은 전자책 **대출 가능 여부**(각 전자도서관 사이트의 실시간 상태)라 정보나루로 대체되지 않음 [안: 확인]. 전자정부 지침 개정으로 공공기관 사이트가 크롤러를 일부 막을 수 있게 됨 → `go.kr` 전자도서관이 데이터센터 IP를 막을 수 있다는 또 하나의 근거
- 확인 못 함: 전자정부 지침의 개방성 조문 원문과 robots.txt 구체 문구, 정보나루 API 호출 제한 수치, 개별 `go.kr` 전자도서관이 실제로 데이터센터 IP를 막는지(배포 뒤 시험)

### 업체 약관의 정부 사이트 조항 (research 3절과 같음, 2026-10-14 9곳 조사)

| 업체 | 정부 사이트 조항 | 우리에게 |
|---|---|---|
| Proxy-Cheap | **전용 조항 없음** (일반 "Provider가 차단 가능"만) | 조항상 가장 자유로움 |
| Rayobyte | **전용 조항 없음** (일반 준법 조항만) | 단 KR은 Datacenter만, 최소 5 IP |
| Mango Proxy | **전용 조항 없음** | 인증·환불·KYC 미확인, 구매 Telegram 봇 |
| IPRoyal | AUP 4.4 `.gov` 차단, **4.4.1 신분증 인증 시 허용(유일 명문화)**, 3.2 우회 금지 | 신분증 인증·약관 해석 필요 |
| Decodo | 정부 사이트 차단, 신분증 예외는 정부에 적용 안 됨 | 공공도서관이 걸리면 불리 |
| Oxylabs | DC·ISP 제한 대상 모두 "Government websites", 모든 고객 KYC | `go.kr` 포함 여부는 업체에 질문 |
| Webshare | "government infrastructure" 금지, 정부 웹사이트는 사용량 임계 카테고리 | 최소 20~100개로 소량 불가 |
| Bright Data | **정부 사이트 기본 차단(403), `.gov` 한정 안 함 → `go.kr`도 가능**, KYC+승인 경로 | 가장 셈. 최소 10 IP |
| NetNut | — | **FBI 압수(2026-07), 제외** |

- 어느 업체도 "한국 `go.kr`"를 콕 집어 적지 않음. 업체 지원팀에 "한국 공공도서관(`go.kr`) 접속이 되는지" 물어야 함 [확인 필요]
- 조사한 9곳 모두 해외 업체(국내 업체 아님). 정부 사이트 제한은 업체마다 다르며, 세 곳(Proxy-Cheap·Rayobyte·Mango)은 전용 조항이 아예 없음

### AWS 조회 서버 IP가 막힐 가능성 (2026-10-14, 사용자 질문·붙여넣기 자료 검증)

이번 배포는 프록시 없이 본 서버가 직접 조회(①안). 그 서버가 2주간 AWS Lightsail/EC2 서울 리전에 있으므로, 공공도서관이 AWS IP를 막을 가능성을 확인함.

| 사실 | 검증 | 출처 (확인 2026-10-14) |
|---|---|---|
| AWS는 모든 공인 IP 대역을 **리전별로** `ip-ranges.json`에 공개하고, 문서가 "이 정보로 AWS에서 오는 트래픽을 식별할 수 있다"고 명시 → 어떤 방화벽이든 AWS 서울(ap-northeast-2) IP를 가려내 막을 수 있음 | [확정] | https://docs.aws.amazon.com/vpc/latest/userguide/aws-ip-ranges.html , https://ip-ranges.amazonaws.com/ip-ranges.json |
| 서울 리전을 써도 AWS 공인 IP 대역 자체가 "클라우드 IP"로 분류돼 정부 사이트 방화벽에 막힐 수 있음 | 가능성 있음(위 사실로 뒷받침). 특정 `go.kr`이 실제로 막는지는 [확인 못 함: 배포 뒤 시험] | 붙여넣기 자료(사용자), §10 전자정부 지침 |
| Elastic IP를 다른 IP로 교체 | AWS가 새 EIP를 줘 바꿀 수는 있으나, **새 IP도 같은 AWS 공개 대역 안**이라 대역 단위 차단이면 효과 없음. IP 하나만 겨냥된 차단일 때만 도움 | 붙여넣기 자료 + 위 ip-ranges 사실 |
| 가정용 회선(KT·SKT·LGU+) 등 일반 ISP로 접속 | 가정용 IP는 "클라우드 IP"로 분류되지 않아 대역 차단을 피하기 가장 유리. **우리 계획(2주 뒤 집 노트북으로 이전)이 바로 가정용 회선 IP가 됨** → 차단 측면에서 더 나은 위치 | 붙여넣기 자료 + 계획 |

- 뜻: AWS 2주 구간에서는 일부 `go.kr`이 막을 수 있고, EIP 교체는 같은 AWS 대역이라 대역 차단엔 안 통할 수 있음. 집 노트북(가정용 회선)으로 옮기면 그 위험이 줄어듦 → 2주-뒤-집 계획이 차단 대응도 겸함. 실제 차단 여부는 배포 뒤 대상별로 시험 [확인 필요]
- 참고: 붙여넣기 자료 뒷부분(사내망/가정용 회선 경유, 그 밖 우회)은 위 "가정용 ISP" 항목과 같은 취지. ADR-0095 ①직접(가정용 회선이면 유리)·②프록시(ISP·주거용 IP도 같은 목적)와 연결됨
- **AWS 접속 실측** (2026-10-14, 사용자가 AWS CloudShell에서 실행, 나가는 IP `3.24.169.54` = AWS 호주 ap-southeast-2 대역. 서울 아님 → 서울에서 재시험 권장이나 "AWS IP에서 열리나" 답으로는 유의미): 홈페이지 GET 결과 — ebook.gangnam·e-lib.sen·ebook.cne·lib.jangseong·ebook.ansan.go.kr 모두 **200(열림)**, 교보 `aml.dkyobobook.co.kr`도 **200**(홈페이지는 이 AWS IP를 안 막음 → dev 13의 "우리 IP 막힘"은 크롤러 IP·조회 엔드포인트 한정일 수 있음, 홈 수준에선 재현 안 됨). **ebook.busan.go.kr만 000(15초 타임아웃, :443·:8081 모두)** — 방화벽 조용한 드롭(차단) 신호이나, 8081 포트/scheme 불일치 가능성도 있어 scheme·포트별 curl 종료코드로 재확인 중
- 뜻: AWS IP가 go.kr에 전면 차단되는 상황은 아님(표본 대부분 열림). 부산 한 곳이 예외라 원인 확인 필요. 2주 AWS 구간은 대체로 가능해 보이고, 집 노트북 이전은 여전히 차단·비용 양면에서 유효 [확인 필요: 서울 리전 재시험, 부산 원인, 실제 조회 엔드포인트(홈페이지 아님) 응답]

### 프론트(브라우저) 직접 조회가 안 되는 이유 + CORS 실측 (2026-10-14, 사용자 질문)

질문: "그냥 프론트가 검색하면 안 되나" → 되면 나가는 IP가 사용자 집 IP라 서버 IP 차단 문제가 사라짐. 그러나 브라우저가 두 가지로 막음.

| 막는 것 | 내용 | 출처 (확인 2026-10-14) |
|---|---|---|
| CORS(동일 출처 정책) | `chaekcheck.com`의 JS가 도서관 사이트에 요청은 보내도, 그 사이트가 `Access-Control-Allow-Origin`으로 우리를 허용하지 않으면 **응답을 못 읽음**. "승인"은 중앙 창구가 아니라 각 도서관 서버가 직접 켜 줘야 함 → 2천여 곳에 부탁은 비현실적. 사용자가 브라우저 확장을 깔면 우회되나 설치 장벽 큼 | https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS |
| 혼합 콘텐츠 | 우리 사이트는 https인데 도서관 주소 상당수가 `http://` → https 페이지가 http를 부르면 브라우저가 차단 | MDN Mixed content |

- 서버 조회는 이 둘에 안 걸림(브라우저가 아님). 그래서 서버 중계가 CORS 문제의 표준 우회책이고, 우리가 이미 그걸 함. 공유 캐시·책 묶기·대출상태 모델도 서버 전제
- **CORS 실측** (내가 직접, 응답 헤더만 보므로 나가는 IP 무관): go.kr 25곳 표본 중 `Access-Control-Allow-Origin: *`를 이미 연 곳은 3곳 — `ebook.cne.go.kr`(https), `lib.jangseong.go.kr`(https), `gjebook.jeonnam-gwangju.go.kr`(http, 우리 https에선 혼합콘텐츠로 막힘). 나머지 대다수는 CORS 헤더 없음. 교보(dkyobobook) 5곳은 연결 자체 실패(000, 제 네트워크 영향 가능 → 로그인 환경 재확인 필요)
- 단서: ① 홈페이지가 `*`라도 실제 대출여부 조회 엔드포인트도 `*`인지는 엔드포인트별로 재확인해야 확정 ② 조회에 로그인 쿠키가 필요하면 `*`로는 쿠키 실린 응답을 못 읽음 ③ 표본 25/318곳이라 열린 비율 대략 10%
- 뜻: 프론트 직접은 전체 방식으로는 불가, 열린 소수에서만 덤으로 가능할 수 있음 → 서버 조회가 기본(이번 ①안 유지). [확인 필요: 열린 사이트의 실제 조회 엔드포인트 CORS·쿠키 요구]

## 11. dev 사이클 12·13·14 전달 중 배포에 닿는 것 (2026-10-14)

dev 12·13·14가 끝나 main에 합쳐짐. 요약 왕복 없이, 첫 배포(17)에 실제로 닿는 값만 아래에 모음. 설계는 하지 않음.

| 항목 | 배포에서 할 일 | 상태 |
|---|---|---|
| 교보 구독형(`*.dkyobobook.co.kr`)이 우리 IP를 막음 (dev 13, R1-6). 수집기는 그래서 요청을 아예 안 보냄 | §3·§10 CORS 확인에서 교보 5곳 연결 실패(000)와 같은 신호. **AWS 접속 테스트 대상에 교보 host 1~2곳을 꼭 넣어**, 운영 서버 IP에서도 막히는지 확인. 서비스 실시간 조회가 교보 서버를 부르는지도 확인 | [확인 필요: 배포 시험] |
| 국립중앙도서관 Open API 키(사서추천, dev 14). 지금 키는 대화로 받아 dev `.env`에만 있음(값은 문서에 없음) | **Parameter Store 비밀값 목록에 이 키를 추가**(아래 외부연동). 새 키 안 받고 지금 키를 비밀값으로 뺌 | [확정: §13, 사용자 #23 2026-10-14] |
| 표지 이용 조건·권리자 연락처(dev 14), User-Agent 서비스 주소(dev 13·14) | 공개일 전 체크리스트: 표지 이용 조건·권리자 연락처 확인. 서비스 주소 확정 시 수집기 `scripts/crawl/crawl_catalog.py` `USER_AGENT`와 `availability.user-agent` 둘 다에 서비스 주소·연락처 넣기 | [확인 필요: 배포 때] |
| 반영 파일 판 2(dev 13): 판이 다르면 못 읽음. 운영 흉내 실측 apply 4분 35초, export 38분, 파일 608MB(1GB DB 기준) | 배포 전 내 PC에 기다리는 판 1 내보내기 있으면 finish·discard 먼저(2026-10-14 기준 없음). **큰 파일(수백 MB)이 터널 SSH로 오가므로** 되살리기·반영 운영 문서에 시간·용량 적기 | [안: 운영 문서] |
| 첫 배포 때 표지를 지우면 이후 `collection/001` 이름 맞추기(candidate→other) SQL을 못 고침 (dev 13) | 배포 순서 주의: 표지 지우기 전 처리. 원래 db·db-ops는 처리됨 | [확인 필요: 배포 순서] |
| 새 공개 REST `GET /api/v1/join-surveys/latest`(로그인 없음, dev 13) | 운영 nginx의 일반 `/api/` 규칙으로 함께 처리됨(별도 설정 불필요) | [확정] |
| 도서관 수: 사이클 07 2,394 → 지금 2,381곳(12), dev 13에서 새 6곳(2675~2680) | 참고값. 배포 설계에 영향 없음 | 참고 |
| 사이클 18(소장 빈/덜 모인 도서관): 18의 운영 반영은 17 첫 배포 뒤 보통 반영(ADR-0078)으로 [안], 교보 다른 IP 수집은 18에 안 넣음 [안] (plan 18 알림) | 17 문서는 안 고침. 배포 뒤 보통 반영 흐름만 공유 | 참고 |

- 12의 "후보 도서관" 용어 바꾸기·`exclude-candidate-libraries` 이름·교보 목록 갱신 방법은 배포(17)와 무관 → 해당 사이클에서 처리

## 12. AWS 신규 무료 플랜(2025)으로 배포 가능 범위 + 부산 차단 (2026-10-14, 사용자 질문)

### 무료 플랜·크레딧
- 신규 계정(2025-07-15 이후): 가입 시 $100 크레딧, 활동으로 최대 $200, 무료 플랜 6개월(183일) 또는 크레딧 소진 시 계정 자동 종료(유료 전환 안 하면). [확정] (출처: https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/ , https://aws.amazon.com/free/ , 확인 2026-10-14)
- 크레딧은 "항상 무료" 한도와 달리 서비스 요금에 쓸 수 있음. 단 무료 플랜은 "선택된 일부 서비스"로 제한(비싼 서비스는 막힘), 전체는 유료 전환 필요. **막히는 서비스 공식 목록은 공개 안 됨** [확인 못 함: 콘솔 청구/프리티어 화면]
- **추가 $100 적립 방법**: "주요 서비스 살펴보기" 활동으로 가입 $100 + 최대 $100. 제3자 정리로는 5개 활동 × $20: ① EC2 인스턴스 실행(우리 배포로 어차피 함) ② RDS DB 구성 ③ Lambda 함수 만들기(+Function URL) ④ Bedrock 사용(플레이그라운드 프롬프트) ⑤ AWS Budgets에서 예산 설정. AWS 공식은 EC2·Bedrock만 예시로 명시 → **정확한 목록·금액은 콘솔 "Explore AWS" 위젯이 기준** [확인 못 함: 5×$20은 제3자 출처] (출처: https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/ , https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html , 확인 2026-10-14)
- EC2는 무료 플랜에서 사용 가능(공식: EC2 사용으로 보너스 크레딧 적립). Lightsail 포함 여부는 출처 엇갈림 [확인 못 함: 콘솔 Lightsail 생성 화면]
- **Lightsail 무료 = "유료 플랜 90일 무료 평가판"**, 대상 번들 정해짐 [확정] (사용자가 콘솔 프리티어 화면 캡처, 2026-10-14. 근거: https://aws.amazon.com/lightsail/pricing/ 스펙): IPv4 Linux **$5(0.5GB)·$7(1GB)·$12(2GB)까지만 무료**, $24(4GB)는 평가판 아님. IPv6 전용은 $3.50(0.5GB)·$5(1GB)·$10(2GB). 둘 다 **무료 최대 2GB RAM / 2 vCPU / 60GB SSD / 3TB 전송**. 그 밖 평가판: 마이크로 컨테이너 $10, 관리형 DB $15
- **문제: 무료 Lightsail 최대 2GB < 설계 4GB(ADR-0103)**. 2GB엔 전체 스택(PG+pg_bigm+앱+nginx+cloudflared+모니터링 묶음) 다 올리기 빠듯, 구독형 캐시 메모리가 관건 [확인 필요: 2GB에 캐시 들어가는지]
  - (A) $100 크레딧으로 4GB(Lightsail $24/월[크레딧 대상 콘솔 확인] 또는 EC2 t4g.medium[크레딧 확실]) → 설계 그대로, 2주 체험 공짜. 추천
  - (B) 90일 무료 2GB → 크레딧 안 씀, 대신 2주간 모니터링 묶음 빼고 앱+DB+nginx+터널만
- 뜻(배포): $100 크레딧이면 4GB 서버(Lightsail $24/월 또는 EC2 t4g.medium ~$24-30/월) 3~4개월 치를 덮음 → 2주 체험 사실상 무료. **배포 설계는 호스트 무관(둘 다 리눅스 VM)이라 Lightsail이 막히면 EC2로 바꿔도 설계 그대로.** 덤: EC2는 IAM 역할 지원 → Parameter Store 읽기에 접근 키 불필요(Lightsail은 접근 키 필요, §1·design-delta 외부연동) [안: 설계에서 검토]
- "못 하는 것": ① 무료 플랜은 선택 서비스만(비싼 것 유료 전환 전 불가, 목록 비공개) ② 6개월/크레딧 소진 시 계정 자동 종료 ③ Lightsail 가용 여부 미확정(콘솔 확인)

### 부산 전자도서관 AWS 차단 (실측)
- `ebook.busan.go.kr`을 http·https·:443·:8081 네 경우로 AWS CloudShell(시드니 IP)에서 호출 → **모두 HTTP 000, exit=28(12초 타임아웃)**. 포트·scheme 다 똑같이 조용히 죽음 = TLS/포트 문제 아니라 **방화벽이 패킷을 말없이 버림 = 이 AWS IP를 네트워크 단에서 차단** [확정: 실측 2026-10-14]
- 같은 테스트에서 gangnam·sen·cne·jangseong·ansan.go.kr + 교보 홈은 200(열림). **부산만 외국/데이터센터 IP 차단의 전형** → 한국 IP(서울 AWS·집 회선)에서 부산이 열리는지 재확인 필요. 집 노트북(가정용 IP) 이전 근거 하나 추가 [확인 필요: 한국 IP에서 부산]

### 배포 기간 방향 변경: 2주 → 크레딧 소진/6개월까지 (2026-10-14, 사용자)
- 사용자: "무료로 200달러 크레딧 최대로 뽑아먹고 노트북 이전은 나중에 생각." → 첫 배포를 2주가 아니라 **무료 플랜 한도(6개월 또는 크레딧 소진 중 먼저)까지 AWS로** 돌림, 집 노트북 이전은 뒤로 미룸(취소 아님)
- 사이즈: 6개월을 꽉 채우려면 **4GB가 스윗스팟**(4GB Lightsail $24/월×6=$144 < $200). 8GB($44/월×6=$264)는 크레딧이 ~4.5개월에 바닥 → 기간 단축 교환. EC2 4GB도 비슷
- 영향(문서 반영 보류, 방향만): scope.md·ADR-0103·research의 "2주" 전제, 16에 넘긴 "노트북 이전 시 처리방침 AWS 줄 빼기"가 모두 6개월 쪽으로 밀림. **부산 등 AWS IP를 막는 go.kr은 그 기간 내내 막힌 채**(집 이전해야 풀림) → 배포 후 전체 go.kr 접속 훑어 막히는 곳 수 파악 [확인 필요]
- **[확정]** (사용자 승인, 2026-10-14, 캔버스 `easy/2026-10-14-deploy-host-decisions.html` #1·#2·#3, ADR-0104): 호스트 = **EC2 t4g.medium 4GB 서울**, 무료 크레딧으로 최대 6개월, 노트북 이전은 나중에. 비밀 값은 **EC2 IAM 역할**로 접근 키 없이(ADR-0103 보완). scope.md·design-delta 외부연동 반영함

## 13. 사이클 15 회고 전달(5차) 중 배포에 닿는 것 (2026-10-14)

plan 15가 `docs/cycles/15-usage-log/to-cycle-17.md` "5차"에 올린 실제 값·결정. 요약 왕복 없이 17에 반영.

| 항목 | 값 | 17이 할 일 |
|---|---|---|
| 기록 켜기 설정 | `chaekcheck.usagelog.enabled` 기본 `false`, 환경 변수 `CHAEKCHECK_USAGELOG_ENABLED` [안: 이름 dev가 바꿀 수 있음] | 운영 프로필에 `false`. 공개일에 `true`. design-delta 앱 설정에 반영 |
| 정리 시각 | 매일 04:30 Asia/Seoul (설정 꺼져도 돎) | 03:00 백업과 안 겹침 — 할 일 없음 |
| 메모리·디스크 | 버퍼 최대 1만 줄 약 5MB, 디스크 1년 많아야 몇 GB | 4GB·40GB 계산에 여유 |
| nginx 사용 알림 한도·로봇·robots.txt | `location = /api/v1/usage-events` IP당 60r/m burst 20 nodelay 넘치면 204; 로봇 UA(`~*(bot\|crawler\|spider)`) → stream·`/api/v1/availability/`에서 403; `web/public/robots.txt` `Disallow: /api/` | **dev가 15 9단계에서 `deploy/nginx/`에 이미 넣음**. 17 배포가 같은 파일을 쓰면 그대로. 17의 일반 `/api/` 한도는 이 파일에 겹치지 않게 추가. `/robots.txt`가 index.html이 아니라 그 파일로 나가는지 배포 때 확인 |
| realip | `real_ip_header CF-Connecting-IP` + `set_real_ip_from`=compose nginx·cloudflared 범위 | 17이 넣음(15는 안 함). 배포 때 `nginx -V`에 realip 모듈, Cloudflare "Remove visitor IP headers" 꺼짐, nginx 포트 바깥 비공개 확인 |
| 로그인 쿠키 | `access_token` 경로 `/api/v1` | nginx는 그대로 넘김 (R12-1) |

### 회고 결정 중 17 배포 순서·범위에 닿는 것 (사용자 승인 2026-10-14)
- **사이클 19(꺾쇠 저자 표기 정리)가 첫 배포 전에 들어감**: 저자 규칙 고침 → 내 PC에서 책 목록 다시 가져오기 → 운영 DB 반영(사이클 11 방식) → 17 첫 배포. dev 순서 15 → 19 → 배포. 17의 "운영 DB 채우기"(scope 포함 4)는 19 반영 뒤의 목록을 씀 [확정: 사용자 승인]
- `/picks` nginx 화면 주소: dev `deploy/nginx/chaekcheck-locations.conf:91`에 이미 있음(main 커밋됐는지 배포 전 확인)
- **사서추천(국립중앙도서관) 인증키: 새로 받지 않고 지금 키를 설정(운영 비밀값)으로 뺌. 표지 이용 조건·권리자 연락처는 따로 확인 안 함** (사용자, #23) → §11·design-delta 비밀값의 "새 키 교체·표지 조건" 항목 해소
- 배포 전 작은 일(backlog, dev): 제목 완전 일치 검색 500 오류, 없는 주소(`*`) 화면
- 교보 구독형 수집: **첫 배포 뒤** 같은 AWS 계정에 수집용 서버를 잠깐 따로 띄워 그 서버만 다시 받음(ADR-0094 동시 1건·1초). 서비스 4GB 서버는 안 씀. 17 뒤 별도 사이클 (scope 제외 그대로)
- 15 인계 끝: `docs/current/handoff.md` = 15 인계서(ADR-0096·0097·0102 Accepted)

## 14. 사이클 18 A1·A2 전달 (2026-10-14, dev 18 로컬 main 5f8403c)

- **밑줄(`_`) 호스트 전용 조회 길이 새로 생김**: 밑줄 든 호스트(예 2624 `hs_partners.yes24library.com`)는 `java.net.http` 대신 **Apache HttpClient 5.6.4**로 보냄. 갈래: 본 서비스 `availability/internal/fetch/UnderscoreHostSiteFetcher`(`HostRoutingSiteFetcher`가 갈래 나눔), 조회 서버 앱 `fetch-service` `LibraryClient.getUnderscoreHost`.
- ADR-0095 나가는 길(일반 브라우저 User-Agent, 나가는 IP마다 동시 건수·간격 따로 셈, 한 IP가 막히면 그 IP만 그 사이트에서 멈춤)을 **이 두 밑줄 길에도 같이 적용해야 함**. 프록시를 쓰면 HttpClient 5는 `setProxy`/`setRoutePlanner`로 설정. 17이 나중에 합치면 **17 쪽 설정이 맞춤**. 근거 ADR-0111·0112, 사이클 18 인계서 C5 → **17 인계서에 한 줄 넣음** [확인 필요: 인계서 작성 시]
- **`library/016` changeset으로 도서관 22곳 꺼짐**: 첫 배포 판에 `016`이 들어가면 운영 DB에도 22곳이 꺼진 채로 들어감(18 C 단계). 17 "운영 DB 채우기"가 어느 판까지 포함하는지에 달림 — **첫 배포에 016을 넣을지/뺄지 확인** [확인 필요: 배포 판 범위, scope 포함 4]. 참고: CLAUDE.md·plan 18은 "18 운영 반영은 17 첫 배포 뒤"라 기본은 016 제외로 보이나, main에서 빌드하면 섞일 수 있어 배포 전 판 확인 필요
- **dev 18 B 보강 (2026-10-14, dev main a0e438a)**: 원래 DB(5432)에는 **016(22곳 끄기)은 이미 들어갔지만, 현대제철 2624 전자책 241권은 아직 없음**(18 가져오기는 복사본에서만 함). 첫 배포 데이터에 2624 책이 들어가려면 **배포 전에 원래 DB에서 가져오기를 다시 돌리거나(사이클 19의 가져오기가 될 수 있음), 18 C 단계 내보내기 때** 들어감 → 17은 19 반영 뒤 목록을 쓰므로(scope 포함 4) 그때 함께 들어올지 배포 전 확인 [확인 필요]
- 가져오기 설정 이름 바뀜: `exclude-candidate-libraries` → `exclude-added-later-libraries`(dry run 전용, 배포 설정에는 보통 없음). 17 배포 설정엔 영향 없음(참고)

### dev 15 최종 확인 (2026-10-14, dev main a34c6ed) — 정확한 이름
- nginx 파일·이름(17이 일반 `/api/` 한도·realip을 여기에 겹치지 않게 넣음): `deploy/nginx/rate-limits.conf`에 한도 영역 `chaekcheck_usage_events`(분당 60, burst 20)·로봇 이름 map `$chaekcheck_named_bot`; `deploy/nginx/chaekcheck-locations.conf`에 `location = /api/v1/usage-events`(넘치면 204)·직접 찾기/대출 조회/도서관별 더 보기의 로봇 403; `/robots.txt`는 `web/public`에서 나감
- 환경 변수 `CHAEKCHECK_USAGELOG_ENABLED` 기본 false(`.env.example`에 있음), 공개일에 켬 — §13과 같음
- realip(`real_ip_header CF-Connecting-IP`·`set_real_ip_from`)은 15가 안 함. **배포에서 안 넣으면 기록 IP가 전부 cloudflared 주소가 됨** → 17이 꼭 넣음(design-delta nginx 줄)
- **요청마다 서비스 로그에 INFO 한 줄**: `library=… source=… result=… ms=…`. 서비스 로그 14일 보관(R11-1)과 양 맞춤 — 로그 디스크 계산에 반영
- 운영 메모: dev `docs/maintenance/5-usage-log.md`

## 15. 사이클 16 dev 전달 (2026-10-14, dev main) — 공개일·sitecontent

- **공개일 = 2026-10-18** [확정] (사용자 결정 2026-10-14). 첫 배포일이 아니라 "모르는 사람에게 여는 날". 사용 기록 켜기·첫 공지·seed 시행일이 모두 이 날 기준
- **sitecontent/002 seed를 검토한 글(plan drafts)·공개일(2026-10-18)로 바꾸는 일**은 17이 db·changelog·`PRE_DEPLOYMENT`를 지우기 **전에** 해야 함(이미 돈 changeset을 고치는 일). 아직 안 함 — 사용자가 시킬 때 dev가 함. 처리방침 표는 목록으로 넣기로 사용자 결정 → scope "운영 DB 채우기"(포함 4) 순서에 끼움 [확인 필요: 배포 전 단계]
- sitecontent 쓰기 DB 계정 권한(dev 16): `sitecontent.notice`·`notice_version`·`document_version` `SELECT·INSERT·UPDATE` + 시퀀스 `sitecontent.notice_id_seq` `USAGE` → design-delta 데이터 절에 반영
- nginx: `deploy/nginx/chaekcheck-locations.conf` 화면 주소 정규식에 `notices|notices/[0-9]+` 더함(16 9단계) → 17이 nginx 합칠 때 이 파일 그대로 씀(research 13절)
- 첫 공지(dev `drafts/notice-first.md`)는 공개일(2026-10-18)에 운영 SQL 1절로(dev `docs/maintenance/5-sitecontent.md`) → 공개일 체크리스트

### Cloudflare Tunnel 유지 확정 (2026-10-15)
- 사용자 선택 ① "터널 유지"(원격 노트북 claude.ai 페이지 `FeYpG6XqGhgQbabEgwWYB8`, 메모 없음). EC2에서도 cloudflared 터널로 들어오게 함 → ADR-0103(열린 포트 없음·Tunnel) 그대로 유지, 설계 변경 없음. 검토한 대안 ②CF프록시·③DNS만·④AWS CloudFront·⑤ALB는 안 고름(궁금증 답은 `easy/2026-10-14-cloudflare-tunnel-decision.html`). 집 이전 때도 같은 설정 그대로 씀

## 16. 사이클 20 → 17: 막힌 조회 IP 재개 규칙 (2026-10-15)

사이클 20이 공유 파일 [`from-cycle-20-blocked-ip-resume.md`](from-cycle-20-blocked-ip-resume.md)로 넘김. ADR-0094/0095는 "막힌 IP만 그 사이트에서 멈춤"만 있고 **다시 시도해 풀렸는지 보는 규칙이 없었음** → 17이 그 나가는 길을 dev에 넘기는 사이클이라 17 인계에 넣음 [확정: 사용자 승인 2026-10-15].

- 규칙: 어떤 나가는 길이 어떤 사이트에서 막혀 멈추면 **10분 뒤 그 길에서 시험 요청 1건**(검색 첫 페이지 GET, 그 길의 호스트 1건·1초 규칙 안). 정상이면 바로 풂, 또 막혀 있으면 쉼 **2배**(10→20→40→80분…**상한 1주일(7일)**). 사용자 실제 검색은 시험에 안 씀
- 멈춤·시험·풀림을 서버 로그 한 줄 + Actuator 지표(길·사이트별 막힘 0/1, 시험 횟수) → Grafana. 수동 풀기 버튼·관리 화면은 **backlog**(급하면 설정으로 그 길 빼고 다시 켬)
- 모든 길이 막힌 호스트는 "확인 불가"(ADR-0094). AWS IP를 막는 `go.kr`(부산 등)은 계속 실패해 쉼이 1주일 상한에 머무름 → 사이클 20 "줄 선 도서관"(spec R4)이 이 멈춤을 읽어 막힌 길을 뺌
- 참고(6차, cycle 15 공유): 17이 먼저 가고 실제 운영 공개는 19 반영 뒤. 19는 chaekcheck-plan-cycle-19가 맡음(저자·출판사 뒤바뀐 세 도서관 바로잡기 포함)

## 17. 실제 배포 (2026-10-15) — 무료 플랜 제약으로 설계와 달라진 점

브라우저로 AWS 콘솔을 직접 조작해 서버를 만듦(사용자 크롬 연결). **신규 무료 플랜이 리전·인스턴스 크기를 제한**해, 설계(서울 4GB 자체 모니터링)와 아래가 달라짐.

| 항목 | 설계(ADR-0104) | 실제 | 이유 |
|---|---|---|---|
| 리전 | 서울 ap-northeast-2 | **시드니 ap-southeast-2** | 무료 플랜은 시드니 한 곳만 할당, 다른 리전은 유료 전환 필요(콘솔 "서울 리전 사용 불가") |
| 인스턴스 | t4g.medium 4GB | **t4g.small 2GB** | t4g.medium은 "무료 요금제에서 사용 불가"(유료 전환 필요). 무료 최대 t4g.small |
| 모니터링 | Prometheus·Grafana·cAdvisor 서버에 직접 | **Grafana Cloud 무료 등급 + 가벼운 에이전트**(서버엔 node_exporter·push만) | 2GB에 자체 모니터링까지 올리기 빠듯 → 저장·대시보드는 Grafana Cloud(무료: 1만 시계열·로그 50GB·14일, 확인 2026-10-15)로 뺌. 사용자 승인(2026-10-15) |
| 비밀값 IAM 역할 | EC2 IAM 역할 | 동일(아직 안 붙임, 사용자가 함) | 보안 설정이라 사용자가 직접 |

- 만든 것: 예산 My Zero-Spend Budget(지출 $0.01 초과 시 `<알림 메일>` 알림), EC2 `chaekcheck`(`i-0de8222bab1c8c073`, running), 고정 IP **<서버 IP>**(연결됨), 키 `chaekcheck-key.pem`(사용자 PC), 보안그룹 launch-wizard-1(SSH=사용자 IP만, 80/443 안 엶), 디스크 30GB gp3
- 계정: Moonshot Mode(계정 ID 135274608857), 무료 플랜 크레딧 $100·남은 182일(2027-04-14)
- 시사점: **시드니라 한국 사용자 지연 ~150ms**(체험엔 허용). go.kr은 시드니 AWS IP로 대부분 접속(research 12절 테스트, 부산만 차단). **집 노트북(가정용 한국 IP) 이전 시 지연·부산 둘 다 해소** → 집 이전 동기가 더 분명해짐
- 2GB 적합성: 모니터링을 Grafana Cloud로 뺐으므로 2GB에 앱+PG+nginx+cloudflared+가벼운 에이전트. **구독형 캐시가 2GB에 들어가는지는 배포 뒤 측정** [확인 필요]
- 남은 콘솔·배포: IAM 역할(사용자), 서버 접속(SSH + .pem) → Docker·cloudflared 설치 → 비밀값 → 서비스 띄우기. 도메인·카카오·cycle 19 책목록 반영은 별개로 진행

### 서버 기본 세팅 완료 (2026-10-15, SSH로 직접)
- 접속: `ssh -i chaekcheck-key.pem ubuntu@<서버 IP>` (SSH 보안그룹=사용자 IP만). 키는 `C:\Users\yujun\Downloads\chaekcheck-key.pem`
- 설치: Docker 29.9.1, Docker Compose v5.6.0, cloudflared 2026.10.0. Docker 부팅 자동 시작(enabled). hello-world arm64 동작 확인
- 폴더: `/srv/chaekcheck`, `/srv/backup` (ubuntu 소유)
- 메모리 2GB(여유 ~1.3Gi), 디스크 30GB(여유 26G)
- **[중요] 이 서버는 arm64(Graviton)** → 앱 이미지도 **arm64로 빌드**해야 함. PC(x86)에서 그냥 빌드한 이미지는 안 뜸. 인계서에 반영: `docker buildx`로 arm64(멀티아치) 빌드하거나 서버에서 직접 빌드 [확인 필요: dev 빌드 방식]
- 아직 못 하는 것(선행 조건): Cloudflare Tunnel 설정(도메인 chaekcheck.com 필요), 앱 배포(dev 인계서·arm64 이미지·compose·비밀값 필요), 비밀값(IAM 역할은 사용자), cycle 19 책목록 반영
