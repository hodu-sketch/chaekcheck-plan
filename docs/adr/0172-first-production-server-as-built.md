# ADR-0172: 첫 운영 서버는 실제로 EC2 t4g.small(2GB·시드니)에 compose 한 네트워크, 감시는 CloudWatch, 관리 주소는 같은 포트에서 nginx로 막음

Status: Accepted
Date: 2026-10-31
Cycle: 17-first-deploy (실제 구성 기록, 사이클 27 대화에서 정리)
Supersedes: 0103, 0104

## 배경
ADR-0103(서버 구성)과 0104(호스트)는 2026-10-14에 서울 4GB 서버를 전제로 제안된 채 Proposed로 남았다. 2026-10-15 실제로 만들 때 AWS 무료 플랜 제약으로 리전과 크기가 바뀌었고, 감시·관리 주소·서버 접속·컨테이너 구성도 그 뒤 결정들(CloudWatch 2026-10-16, ADR-0130, ADR-0167~0171)로 바뀌었다. 바뀐 사실이 사이클 17 `research.md` 17절과 dev 배포 파일에만 있어, 운영 v1.22.4(dev main `6675611`) 기준으로 실제 구성을 한 곳에 적는다. 이 ADR은 새 결정이 아니라 이미 내린 결정과 제약을 모은 기록이다.

## 결정 (지금 실제 구성)
- **호스트:** AWS EC2 **t4g.small(arm64, 2코어, 2GB)·시드니 ap-southeast-2**, 디스크 30GB gp3, 고정 IP, 스왑 2GB. 무료 크레딧으로 운영. 서울·t4g.medium은 무료 플랜에서 쓸 수 없어 바뀜(콘솔 "서울 리전 사용 불가", "t4g.medium은 무료 요금제에서 사용 불가", `research.md` 17절).
- **비밀 값:** EC2 IAM 역할 `chaekcheck-ec2-role`로 Parameter Store `/chaekcheck/prod/`를 읽어 `up.sh`가 `chmod 600` 파일로 씀(ADR-0104 그대로). 접근 키 없음.
- **컨테이너:** compose 한 벌, 네트워크 하나(`default`, 별칭으로 이름 지정). `db`(postgres-bigm 18), `backend-blue`·`backend-green`(ADR-0167), `web`(nginx 1.30.5-alpine 고정, ADR-0168), `cloudflared`. 바깥에 연 포트 없음(`127.0.0.1:5432`, `127.0.0.1:8088`만). ADR-0103의 edge·app 두 네트워크, Prometheus·Grafana·cAdvisor·접속 기록 exporter, 조회 서버 컨테이너는 없음.
- **감시:** 서버 안 감시 컨테이너 대신 **CloudWatch**(에이전트로 메모리·디스크 60초, 경보 3개 → SNS 메일). 앱 쪽은 1분 요약 로그 줄과 `availability.lookup_sample`(10초, 월 파티션).
- **관리 주소:** Actuator는 별도 포트(8081)가 아니라 **같은 8080에서 `health`만** 열고 nginx가 바깥 `/actuator/`를 404로 막음(ADR-0169). Prometheus 노출은 없음.
- **서버 접속·이미지 옮기기:** PC에서 이미지를 빌드해 `docker save`로 묶고(사용자 "A", 2026-10-15), **고정 IP로 SSH(보안그룹은 사용자 IP만 허용)** 해서 `scp` → `docker load`. ADR-0103의 Cloudflare Tunnel SSH는 쓰지 않음.
- **나가는 길:** 도서관 조회는 Webshare 한국 고정 프록시로만(ADR-0130).

## 이유 (사용자 발언)
- 크레딧으로 운영: "무료로 200달러 크레딧 최대로 뽑아먹고 노트북 이전은 나중에 생각해볼래" (2026-10-14, ADR-0104)
- 시드니·t4g.small: 사용자 선택이 아니라 무료 플랜 제약 (`research.md` 17절, 2026-10-15)
- CloudWatch: 사용자 안 B — "AWS 안에서 끝나 설정 단순, 추가 서버 자원 거의 없음" (2026-10-16, `research.md` 17절)
- 비밀 값을 AWS에: "해보자 그냥 써보고 싶어" (2026-10-13, ADR-0103)
- 밖에서 빌드: 사용자 "A" (2026-10-15). 2GB 서버라 서버에서 빌드하지 않음
- 같은 포트 Actuator: "60초로 줄이고 4번 승인" (2026-10-29, ADR-0169)
- 네트워크 하나로 둔 것, Tunnel SSH 대신 고정 IP SSH로 바뀐 것: [이유 미확인]

## 검토한 대안
### A안: 지금 구성 (기록)
- 장점: 무료 범위, 서버 안 컨테이너가 적어 2GB에 들어감, 열린 포트 없음(SSH 제외)
- 단점: 한국 사용자 지연 약 150ms, 부산처럼 AWS IP를 막는 `go.kr`, SSH 22번이 사용자 IP에 열려 있음(IP가 바뀌면 보안그룹을 고쳐야 함)
### B안: ADR-0103·0104 원안 (서울 4GB, 두 네트워크, 서버 안 Grafana, 8081 지표, Tunnel SSH)
- 채택하지 않은 이유: 서울·4GB는 무료 플랜 제약. 서버 안 감시는 "2GB에 자체 모니터링까지 올리기 빠듯"(`research.md` 17절). 8081은 ADR-0169로 바뀜. 나머지 [이유 미확인]

## 결과
- 좋아지는 점: 문서와 실제가 맞음. 운영에서 이 ADR 하나로 지금 서버를 설명할 수 있음
- 감수하는 점: ADR-0103의 **매일 03:00 DB 백업**(`pg_dump -Fc -N catalog -N catalog_next`, 서버 2개·PC 7개)은 dev 배포 파일에서 스크립트를 찾지 못함(2026-10-31). 서버 cron에 있는지 [확인 필요: dev 세션이 서버에서 `crontab -l`·백업 폴더 확인]. 개인정보 처리방침의 "백업 7일 보관" 문구와 맞아야 함
- 나중에 노트북·여러 대로 옮길 때: 같은 compose를 쓰되 IAM 역할 대신 손으로 둔 `secrets.env`(up.sh가 지원), 여러 대면 서버별 메모리 상태 공유가 필요(ADR-0171)
