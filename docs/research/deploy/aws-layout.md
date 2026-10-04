# AWS에 올리는 모양 조사 (사이클 밖 조사)

- 작성: 2026-10-04. 사용자 질문: "실제 배포하는데 AWS로 하려고해 그런데 S3과 뭐 이런 것들...? 나눠서 하는게 나을라나"
- 조사와 방법만 적습니다. 모듈·표·API 설계는 없습니다. 쉬운 설명과 결정 페이지: `easy/2026-10-04-aws-layout.html`
- AWS를 쓴다는 것 [확정] (사용자, 2026-10-04). 이유 [이유 미확인]. 올리는 모양은 2026-10-04에 정함(3절)

## 1. 올려야 하는 것 (dev 확인, 2026-10-04)

| 무엇 | 지금 모습 | 근거 |
|---|---|---|
| 화면 | React + Vite로 만든 정적 파일(`dist`) | dev `web/` |
| 서버 | Spring Boot, Java 25 | dev `backend/build.gradle` |
| 조회 서버 | 도서관 사이트를 GET만 하는 작은 Spring Boot 앱. 따로 배포하는 단위, 고정 IP | dev `fetch-service/`, ADR-0011, ADR-0015 |
| DB | PostgreSQL 18 + `pg_bigm`(소스 태그 v1.2-20250903). 시작 옵션 `shared_preload_libraries=pg_bigm` | dev `docker/postgres-bigm/Dockerfile`, `compose.yaml` |
| 데이터 | 책 680,689권, 소장 4,954,360줄 (2026-10-03 가져오기) | dev `docs/plan-feedback.md` "실제 가져오기 결과" |
| 웹 서버 설정 예시 | nginx: 화면 파일을 주고 `/api/`를 Spring으로 넘김, 보안 헤더, CSP | dev `deploy/nginx/`, `docs/plan-feedback.md` "16단계 결과" |

지켜야 하는 결정: 화면과 API가 같은 주소(같은 출처)여야 함(ADR-0042). 로그인 쿠키가 `SameSite=Lax`이고 경로가 `/api/v1/...`이기 때문.

## 2. 공식 문서에서 확인한 것

| 항목 | 확인한 사실 | 출처 (확인일 2026-10-04) | 태그 |
|---|---|---|---|
| RDS for PostgreSQL이 `pg_bigm`을 지원하는지 | 지원함. PostgreSQL 16·17·18 표에 모두 있음. 18.1~18.6은 `1.2_20250903`(18.0 Preview·RC1은 `1.2_20240606`) | https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-extensions.html | [확정] |
| RDS에서 `shared_preload_libraries`에 `pg_bigm`을 넣을 수 있는지 | 확인 못 함. 확장 문서에는 이 설정에 대한 문장이 없음 | https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.FeatureSupport.Extensions.html | [확인 필요] |
| CloudFront가 원본(서버) 응답을 기다리는 시간 | "Response timeout" 기본 30초. 요청을 넘긴 뒤 첫 응답까지, 그리고 응답 조각 하나를 받은 뒤 다음 조각까지 각각 적용됨. 넘기면 연결을 끊음 | https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesOrigin.html | [확정] |
| CloudFront "Response completion timeout" | 응답 전체에 대한 최대 시간. 정하지 않으면 최대 시간을 강제하지 않음 | 위와 같음 | [확정] |
| CloudFront 한 배포에 원본 여럿(S3 + 서버)과 경로별 규칙 | 원본을 여럿 두고, 경로 규칙(cache behavior)마다 보낼 원본을 고름 | 위와 같음 ("Name" 절) | [확정] |

## 3. 세 가지 모양

**결정 [확정] (사용자, 2026-10-04, 캔버스 승인)**: 10월 6일에는 A(EC2 한 대에 nginx·Spring·조회 서버·PostgreSQL)로 올리고 S3·CloudFront는 쓰지 않음. 사용자: "승인하고 나중에 s3 cloudfront가자". 그 밖의 이유 [이유 미확인]. 나중에 S3 + CloudFront로 가는 것 [확정: 방향만], 시기는 정하지 않음. DB를 RDS로 옮기는 것과 하루 한 번 백업을 S3에 두는 것은 제안에 들어 있던 것으로 함께 승인됨(제안 → 승인).

| | A. 서버 한 대에 모두 | B. DB만 따로 (RDS) | C. 화면도 따로 (S3 + CloudFront) |
|---|---|---|---|
| 구성 | EC2 한 대: nginx + Spring + 조회 서버 + PostgreSQL(지금 Docker 이미지) | EC2: nginx + Spring + 조회 서버. DB는 RDS for PostgreSQL 18 | 화면 파일은 S3, 앞에 CloudFront. `/api/*`만 EC2의 Spring으로. DB는 RDS |
| 같은 출처 | nginx가 지킴(dev 예시 그대로) | nginx가 지킴 | CloudFront가 경로로 나눠 지킴. nginx 예시의 화면·헤더 부분을 CloudFront 설정으로 다시 만들어야 함 |
| 새로 확인할 것 | 없음에 가까움(개발 환경과 같은 모양) | RDS에서 `pg_bigm` preload 설정 | B의 것 + 대출 현황 스트림(SSE)이 30초 넘게 조용하면 끊기는지, 화면 주소(`/books/1` 등)를 `index.html`로 돌리는 설정, CSP·보안 헤더 |
| 좋은 점 | 가장 빨리 올림. 값이 가장 쌈(서버 한 대) | DB 백업·복구를 AWS가 해 줌. 서버를 갈아도 데이터가 남음 | 화면이 서버와 무관하게 뜸. 서버 부담이 줄어듦 |
| 나쁜 점 | 서버가 죽으면 전부 멈춤. DB 백업을 직접 해야 함 | 값이 더 듦. 설정 하나 확인 필요 | 설정이 가장 많음. dev가 시험한 nginx 구성을 버리고 새로 시험해야 함 |

- 처음 제안: 10월 6일 목표에는 A로 올리고, 회원 데이터가 쌓이기 전에 B로 옮김. C는 사용자가 늘어 서버가 버거울 때.
- A → B: DB를 덤프해서 RDS에 넣고 접속 주소만 바꿈. A → C: 화면 파일을 S3로 옮기고 CloudFront를 앞에 둠. 앱 코드는 바뀌지 않음(같은 출처가 유지되므로).
- C는 ADR-0042의 "앞단 웹 서버가 화면 파일을 주고 `/api`를 넘긴다"에서 웹 서버 자리를 CloudFront로 바꾸는 것. 고르면 ADR에 덧붙여야 함.

## 4. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| RDS에서 `shared_preload_libraries`에 `pg_bigm`을 넣을 수 있는지 | RDS 파라미터 그룹 화면에서 허용 값 보기(B를 고를 때) |
| 값(EC2·RDS·CloudFront 요금) | AWS 요금 계산기에서 고른 구성으로 확인. 이 문서에는 금액을 적지 않음(확인 못 함) |
| 도서관 사이트가 AWS의 IP에서 오는 요청을 받는지 | 배포 뒤 실제 조회 시험. 막히는 곳이 있으면 조회 서버를 다른 곳에 두는 것을 검토 |
| 대출 현황 스트림(SSE)이 조용한 구간에 신호를 보내는지와 그 간격 | dev 코드 확인(C를 고를 때. CloudFront 30초) |
| 책 68만 권을 운영 DB로 옮기는 방법 | backlog "운영에 올리기"에 사용자 결정 대기로 있음. 후보: 개발 DB 덤프를 복원 / 운영에서 가져오기 도구를 다시 실행 |
| 서버 크기(메모리) | Spring + PostgreSQL + 인덱스 크기를 dev에서 재서 정함 |
| 리전 | 서울(ap-northeast-2)로 가정 [안]. 해외 리전이면 개인정보 국외이전 고지가 필요해질 수 있음(네이버 콘솔 안내, `docs/cycles/05-login-account/research.md`) |

## 5. A에서 옮기는 순서 (사용자 질문 "a에서 b또는 c로 가는 건 안 어려워?", 2026-10-04)

| | A → B (DB를 RDS로) | → C (화면을 S3 + CloudFront로) |
|---|---|---|
| 하는 일 | RDS에 빈 DB 만들기 → 서버의 DB를 덤프해 RDS에 복원 → 서버의 DB 접속 주소를 RDS로 바꿔 다시 켬 → 서버 안의 DB를 끔 | 화면 파일을 S3에 올림 → CloudFront에 원본 둘(S3, 서버)과 경로 규칙 → 도메인을 CloudFront로 돌림 |
| 앱 코드 | 바뀌지 않음 | 바뀌지 않음(같은 출처 유지) |
| 멈추는 때 | 덤프·복원하는 동안(그 사이 가입·탈퇴를 막아야 함) | 없게 할 수 있음(도메인을 돌리기 전에 CloudFront 주소로 시험) |
| 어려운 곳 | RDS의 `pg_bigm` preload 설정 [확인 필요]. 일찍 확인 | 보안 헤더·CSP, 화면 주소를 `index.html`로 돌리기, SSE와 30초 Response timeout을 다시 시험. ADR-0042에 덧붙임 필요 |
| 되돌리기 | 서버 안의 DB를 지우지 않고 꺼 두면 주소를 되돌림 | 도메인을 서버로 되돌림 |
