# 회고: 사이클 17 첫 배포

- 쓴 날: 2026-11-05 (사용자 "다 완료처리해줘", dev 24 세션 전달)
- 근거: dev `docs/cycles/plan-feedback.md` "# 사이클 17"(5467행), plan `scope.md`·`design-delta.md`, plan `research.md`, CLAUDE.md
- 상태: **운영 중**. AWS EC2(ap-southeast-2, 시드니) t4g.medium(4GB Arm)에서 돌고 있음. 블루·그린 배포(사이클 27)로 v1.23.1까지 반영 (2026-10-31)

> 원래 계획은 "AWS Lightsail 서울"이었으나, 크레딧·성능·IAM 역할 이유로 EC2로 바뀌었고(ADR-0104), 리전은 시드니(ap-southeast-2)임

## 범위 결과

| 포함 항목 | 결과 | 근거 |
|---|---|---|
| 1. EC2 t4g.medium Docker 배포 | 완료 | 운영 중, nginx·서비스·조회 서버·PostgreSQL+pg_bigm |
| 2. 도메인 chaekcheck.com + Cloudflare Tunnel | 완료 | 공개 접속 가능 |
| 3. nginx CF-Connecting-IP, API IP별 한도 | 완료 | nginx 설정, rate limit 동작 확인 |
| 4. 운영 DB 채우기 | 완료 | PC pg_dump → EC2 복원 9분(book 133만·holding 1,802만·library 2,669) |
| 5. 비밀 값 Parameter Store | 완료 | `up.sh`가 EC2 역할로 읽어 `secrets.env`에 씀 |
| 6. 운영 메모리 재기 | 완료 | `server-measure.md` 측정 여러 차례 |
| 7. Prometheus·Grafana·node_exporter | 완료 | 서버에 직접 설치 |
| 8. 하루 한 번 DB 백업 | 완료 | 서버 03:00 덤프, PC 내려받기 |
| 9. User-Agent·서비스 주소, nginx 기록 14일 | 완료 | 쿼리 문자열 빼고 경로만 |
| 10. 대출 조회 나가는 길 | 완료 | Webshare 20개 프록시, `proxy-only` 모드, IP별 간격·막힌 IP 쉬기 |

## 계획대로 된 것

- Docker compose 한 대 배포 (nginx + backend + db + cloudflared + grafana + prometheus + node_exporter)
- `bin/up.sh`: Parameter Store에서 비밀 값 읽기, 필수값 누락 시 멈춤, 따옴표·줄바꿈 거절
- 프록시 나가는 길: `CHAEKCHECK_AVAILABILITY_EGRESS_MODE=proxy-only`, Webshare IP 인증 20개
- sitecontent seed: 약관·처리방침·서비스 안내·수집 동의문 교체 (시행일 2026-10-18)
- 카카오 로그인 운영 등록

## 달라진 것과 이유

| 바뀐 것 | 계획 | 이유 |
|---|---|---|
| EC2 시드니(ap-southeast-2) | EC2 서울 또는 Lightsail 서울 | 크레딧 확인 과정에서 시드니 계정에 $100 무료 크레딧이 있어 그대로 진행. 부산 `go.kr` 차단은 프록시 경유로 해결 |
| JRE 25 | JRE 21 | Gradle toolchain이 Java 25. 운영에서 문제 없음 |
| 외부 공개 시점 | 인계서에 없음 | 시험 배포 뒤 cloudflared를 열었다 "외부 배포하라고 한 적 없다"로 바로 내림 (2026-10-18 18:47). 이후 사용자가 정한 시점에 공개 |

## 운영에서 생긴 일

- 시험 배포(2026-10-18): 나가는 길 설정 누락으로 서버 자기 IP로 조회 → 사용자 발견 → 프록시 설정 추가
- 처리방침 문구 두 곳 고침 (사용자 요청, 같은 날 저녁): "로그인한 뒤 설정의 「탈퇴」로 바로 지울 수 있습니다", 이전 방침 문장 뺌
- 외부 공개를 내림 (같은 날 18:47): 이후 SSH 터널로만 확인

## 남은 것 → 백로그

계획에 있었으나 다른 곳에서 해결되었거나 백로그로 갔습니다:

| 항목 | 상태 |
|---|---|
| 업체 데이터 세기 (80%·90%) | 백로그 |
| 업체 오류 때 Webshare 길 전체 멈춤 | 백로그 |
| CloudWatch → SNS 경보 | 백로그 |
| 노트북 이전 | 백로그 (크레딧 소진·6개월 무렵 재검토) |
