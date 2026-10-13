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
