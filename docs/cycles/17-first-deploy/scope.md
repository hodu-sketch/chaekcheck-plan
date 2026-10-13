# 사이클 17: 첫 배포 (Lightsail 2주 공개 운영)

- 시작: 2026-10-13. 사용자: "지금 이거 사이클 17으로 바꾸자", 이름 `17-first-deploy`
- 출발점: 사이클 밖 배포 조사 `docs/research/deploy/hosting-options.md`(결정 줄 2026-10-12~13), `aws-layout.md`, `aws-crawl.md`, `db-memory.md`, ADR-0094·ADR-0095(제안됨). 내용은 여기 옮기지 않고 링크함
- 앞 사이클 회고: 사이클 12·13·14는 미리 인계했고 dev 진행 중, 15·16은 각자 세션에서 미리 계획 중(`CLAUDE.md` Current cycle). 이 사이클도 같은 방식으로 이 세션에서 미리 계획하고, 설계 확정·인계서는 앞 사이클 회고 뒤 [안]

## 목표 (한 문장)

사용자가 내 도메인 주소로 들어와 검색·대출 현황·카카오 로그인을 쓸 수 있게, 서비스를 AWS Lightsail 서울 서버 한 대에 올려 2주 동안 공개 운영한다 [확정] (사용자 승인, 2026-10-13, `easy/2026-10-13-scope-decisions.html` #1)

## 포함 [확정] (사용자 승인, 2026-10-13, `easy/2026-10-13-scope-decisions.html` #1)

1. 운영 서버: Lightsail 서울 4GB 묶음 한 대(고정 IP)에 nginx·서비스·조회 서버·PostgreSQL + pg_bigm을 Docker로 [확정: 서버] (`hosting-options.md` 결정 줄 2026-10-13)
2. 연결: 도메인 `chaekcheck.com`을 Cloudflare에서 삼 [확정] (사용자 승인, 2026-10-13, `easy/2026-10-13-scope-decisions.html` #4) (쓸 수 있는 이름인지는 [확인 필요]) + Cloudflare Tunnel, 인증서는 Cloudflare [확정: Tunnel]
3. nginx가 `CF-Connecting-IP`를 사용자 주소로 읽게 [확정], 책 검색 목록 등 나머지 `/api/`의 IP별 한도 [안]
4. 운영 DB 채우기: 첫 배포 직전 seed 다시 만들기·`PRE_DEPLOYMENT` 지우기(backlog "첫 배포 직전"), 책 목록은 내 PC에서 가져와 운영에 반영(ADR-0078, 사이클 11 반영 방법)
5. 비밀 값(카카오 키, DB 비밀번호, 조회 서버 토큰)은 **AWS Parameter Store 또는 Secrets Manager**에 둠 [확정] (사용자: "해보자 그냥 써보고 싶어", 2026-10-13, #5 제안 `.env` 미승인. 둘 중 어느 것인지는 [안: 설계에서]), 카카오 콘솔 운영 주소, 약관·처리방침 시행일(사이클 16과 맞춤)
6. 운영 메모리 값 다시 재기(서비스 힙, DB `shared_buffers` 등, backlog "배포 사이클" 줄들)
7. 모니터링: Prometheus·Grafana·node_exporter를 서버에 직접 [확정], Spring Actuator·Micrometer 붙이기, 그래프를 바깥에서 보는 방법
8. 하루 한 번 DB 백업을 서버 밖에 두기: 서버가 밤에 덤프를 만들고 내 PC가 내려받음 [확정] (사용자 승인, 2026-10-13, `easy/2026-10-13-scope-decisions.html` #6)
9. User-Agent·서비스 주소 채우기(backlog 사이클 10 dev TODO), nginx 접속 기록 보관 기간(사이클 15 조사, 16 처리방침)

10. **대출 조회 나가는 길 (ADR-0095)**: 본 서비스 직접 / 직접 + 업체 고정 IP 프록시 여러 곳 / 조회 서버(조회 서버마다 업체 프록시)를 설정으로 고름, 나가는 IP마다 따로 세기, 막힌 IP만 그 사이트에서 멈춤, 일반 브라우저 User-Agent, 나간 길·업체 기록. 교보 구독형 서버 서비스 조회는 나가는 IP마다 동시 3건·느려지면 1건·막힘 신호면 멈추고 "확인 불가"(ADR-0094 서비스 부분) [확정] (사용자: "이거 지금 해", 2026-10-13, #2 제안 "사이클 18로 미룸" 미승인)

## 제외 (backlog로) [확정] (사용자 승인, 2026-10-13, `easy/2026-10-13-scope-decisions.html` #2) (단, 대출 조회 프록시는 포함으로 옮김)

- 교보 구독형 서버를 다른 IP에서 **수집**으로 다시 받기(ADR-0094 수집 부분, 수집기 거름 바꾸기) → 다음 사이클 [안: #2 말씀이 대출 조회 줄을 가리켜 수집은 남김, 확인 필요]
- 노트북으로 옮기기 → 2주 뒤 따로
- 봇 막기 강화(AWS WAF) → Lightsail에서는 해당 없음, Cloudflare 규칙으로 대신할지 사이클 15와 함께 다시 봄
- DB 크기 줄이기(`db-memory.md`), S3·CloudFront·RDS

## 완료 기준 [확정] (사용자 승인, 2026-10-13, `easy/2026-10-13-scope-decisions.html` #3)

- 휴대폰 데이터망에서 `https://<내 도메인>`을 열면 검색 결과와 대출 현황이 나온다
- 카카오로 로그인하고 내 도서관을 저장할 수 있다
- 같은 IP에서 검색 요청을 한도보다 많이 보내면 429가 오고, 다른 사람의 검색은 영향받지 않는다
- Grafana에서 서버 CPU·메모리·응답 시간·`throttle timeout` 횟수를 볼 수 있다
- 서버 밖에 전날 DB 백업 파일이 있다

## 먼저 조사할 것 [확인 필요]

| 항목 | 확인 방법 |
|---|---|
| Lightsail 4GB 묶음의 CPU 종류(Intel·AMD·Arm) | 서버 만든 뒤 `lscpu` |
| 한국 데이터센터 IP를 도서관 사이트가 받는지 | Lightsail(또는 CloudShell 서울)에서 6곳 1번씩 (`aws-crawl.md` 1절) |
| 터널을 거칠 때 `CF-Connecting-IP`가 붙는지, 스트림이 버퍼링되는지, 125초 제한 | 시험 |
| 도메인 이름과 구매 (Cloudflare Registrar) | 사용자에게 질문 |
| 카카오 운영 등록(사이트 도메인, Redirect URI, 동의 항목) | 공식 문서 확인 + 사용자 콘솔 작업 |
| 4GB에 서비스·DB·조회 서버·Prometheus·Grafana가 함께 들어가는지 | 서버에서 측정 |
| Lightsail 서버가 Parameter Store·Secrets Manager를 읽는 방법(Lightsail에는 EC2처럼 서버에 붙이는 권한(IAM 역할)이 있는지, 없으면 접근 키를 어디에 둘지)과 요금 | 공식 문서 확인 |
| 사이클 16 요청: 국외 이전 근거(로그인 안 한 방문자), Cloudflare 데이터센터 나라, AWS 접근권한, 계약 법인·연락처, Cloudflare 쿠키, 첫 배포 직전 약관 글 바꿔 넣기 | `research.md` 6절 |
| 업체 프록시 고르기(한국 고정 IP 상품, 최소 수량, 자동 요청 허용 약관, 월 비용) | 공식 페이지 확인 + 사용자에게 질문 |

## 슬라이스 선택 기록

- 사용자가 슬라이스를 정함: "지금 이거 사이클 17으로 바꾸자" (2026-10-13), 이름 `17-first-deploy`. ICE 점수는 매기지 않음
- 2주 Lightsail → 노트북 계획: 사용자 "한 2주간 클라우드 체험삼아서 해보다가 노트북 본가에서 굴러다니느거 가져와서 서버 세팅할 예정이야" (2026-10-12)

## 영향 받을 모듈 [안]

- 코드: `availability`(Actuator 지표, 서비스 주소, 업체 프록시 거쳐 보내기·나가는 IP마다 세기·막힌 IP 멈추기·User-Agent), `fetch-service`(업체 프록시 거쳐 보내기), 앱 설정(운영 프로필, 메모리 값), 화면 바닥글(서비스 주소)
- 배포 파일: dev `deploy/nginx/`(real_ip, 한도, 접속 기록), compose(운영용), 모니터링 compose, 백업 스크립트
- 표·API 변경: 없을 것으로 봄 [안]
