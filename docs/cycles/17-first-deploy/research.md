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

| 업체 | 한국 고정 IP 상품 | 값 (업체 표기) | 정부 사이트·약관 | 출처 |
|---|---|---|---|---|
| Oxylabs | Dedicated Datacenter (한국 위치 페이지) | 월 $8.25부터, IP당 $2~1.2 | ISP 상품 제한 대상에 "Government websites", 모든 고객 KYC 질문지 | https://oxylabs.io/locations/south-korea , https://oxylabs.io/pricing/dedicated-datacenter-proxies , https://developers.oxylabs.io/products/proxies/isp-proxies/restricted-targets , https://oxylabs.io/kyc-and-safety |
| Bright Data | ISP·Datacenter (한국 네트워크 포함, 구매 화면 KR 선택은 확인 못 함) | IP당 약 $1.4~0.9 (표 라벨 없음) | **"government websites are blocked across all networks"** | https://brightdata.com/locations/kr , https://docs.brightdata.com/products/residential/network-access |
| Decodo | Dedicated ISP, KR 있음 | 3 IP 월 $9.99부터 | 정부 사이트 조항 확인 못 함 | https://decodo.com/proxies/isp-proxies/pricing , https://decodo.com/legal/master-service-agreement |
| IPRoyal | Datacenter, KR 있음 | 30일 $1.57/proxy, 월 100GB | AUP 4.4: .gov 차단(신분증 인증 시 허용), **3.2: robots.txt·속도 제한 우회 금지** | https://iproyal.com/datacenter-proxies/ , https://iproyal.com/acceptable-use-policy/ |
| Webshare | KR IP 있음(상품별 확인 못 함) | static residential 20개 $6/월 | "government infrastructure" 금지, KYC 가능 | https://www.webshare.io/features/proxy-locations , https://help.webshare.io/en/articles/9987853-restricted-activities-with-webshare-proxies |

- 공공 전자도서관 주소 다수가 `go.kr`·지자체·교육청 도메인임(예: `ebook.gangnam.go.kr`, `library.busan.go.kr`, 수집 목록). 업체의 "정부 사이트"에 이것이 들어가는지 공개 문서에 없음 → 업체에 질문 [확인 필요]
- IPRoyal AUP 3.2(속도 제한 우회 금지)와 ADR-0095의 "막힌 IP만 멈추고 다른 IP로 계속"이 맞는지 [확인 필요: 업체 약관 해석, 전문가 확인 항목과 함께]

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
