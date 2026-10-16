# 문서 점검 → 사이클 17: 실제 배포와 어긋난 문서 (17 세션이 고칠 것)

- 쓴 날: 2026-10-17, 문서 구조 점검(사이클 20 세션에서 돌린 점검). 이 파일은 **목록만** 두고, 고치기는 사이클 17 세션이 함(다른 세션이 17 문서를 고치지 않음)
- 기준: 실제 배포 기록 [`research.md`](research.md) 17절 "실제 배포 (2026-10-15)"와 그 아래 "CloudWatch 모니터링 설정 완료 (2026-10-16)", "배포 때 비밀값·알림 구독" (332~368행)
- 행 번호는 2026-10-17에 파일을 읽고 맞춤

## 1. 서버 크기·디스크: 설계(Lightsail 서울 4GB, SSD 80GB) ↔ 실제(시드니 EC2 t4g.small 2GB, 디스크 30GB)

| 곳 | 지금 글 | 실제 (research.md) |
|---|---|---|
| `spec.md` 17행 R1 | "Lightsail 서울 4GB 한 대에 Docker로 띄움" [확정] | 시드니 ap-southeast-2, EC2 t4g.small 2GB (334·335행, 무료 플랜 제약) |
| `spec.md` 27행 R8 | "Lightsail 4GB 묶음 SSD 80GB에 DB 평소 약 8.5GiB + 반영 때 두 벌(약 16GB) + 백업 2개 + 이미지·로그 …", "디스크 사용량을 Grafana에서 지켜봄" | 디스크 30GB gp3 (339·349행), `df`로 29G 중 18% 사용 (358행). EBS가 40GiB일 수 있음 [확인 필요] (359행, `lsblk`·`growpart`) |
| `spec.md` 88행 확인 필요 | "Lightsail CPU 종류, 한국 데이터센터 IP를 도서관이 받는지" | EC2 arm64(Graviton), Ubuntu 26.04 (350·358행). 시드니 IP는 go.kr 대부분 접속, 부산만 막힘 (341행) |

- **디스크 몫이 빠듯할 수 있음**: R8의 셈(DB 약 8.5GiB + 반영 때 두 벌 약 16GB + 백업 2개 + 이미지·로그 + 이용 기록)이 30GB(또는 40GiB)에 들어가는지 다시 셈 [확인 필요: 배포 때 측정]

## 2. 모니터링: Prometheus·Grafana ↔ 결정은 CloudWatch

`research.md` 336행이 최종을 **AWS CloudWatch**로 정함(사용자 안 B, 2026-10-16). 아래 글은 아직 Prometheus·Grafana를 말함.

| 곳 | 지금 글 |
|---|---|
| `scope.md` 21행 | 포함 7 "모니터링: Prometheus·Grafana·node_exporter를 서버에 직접 [확정]" |
| `scope.md` 39행 | 완료 기준 "Grafana에서 서버 CPU·메모리·응답 시간·`throttle timeout` 횟수를 볼 수 있다" |
| `scope.md` 51행 | "4GB에 서비스·DB·조회 서버·Prometheus·Grafana가 함께 들어가는지" |
| `spec.md` 10행 | 사용자 이야기(사용자 원문 "프로메테우스나 그라파나 node_exporter같은거") — 원문 인용은 두되, 지금 결정이 CloudWatch임을 덧붙일지 정함 |
| `spec.md` 28행 R9 | "Prometheus·Grafana·node_exporter 직접 … `grafana.chaekcheck.com`" [확정] |
| `spec.md` 72행 AC-4 | "Grafana에서 → CPU·메모리·응답 시간·도서관 호출 포기 횟수가 보인다" |
| `flow.md` 15~52행 | F5 Grafana 흐름(`grafana.chaekcheck.com` 로그인, 대시보드). 52행에만 "실제 배포는 Grafana 서버 대신 CloudWatch"가 덧붙어 있음 |
| `from-cycle-20-blocked-ip-resume.md` 11행 | "Actuator 지표 … Grafana에서 봄" |
| `research.md` 324행 | 16절 "Actuator 지표 … → Grafana" |

- 함께 볼 것: Actuator·앱 지표를 CloudWatch로 어떻게 보낼지(에이전트는 지금 메모리·디스크만, 356행), AC-4를 CloudWatch 말로 다시 쓸지

## 3. 알림 메일: "인계 예정"만 있음 ↔ SNS 주제·경보 2개는 이미 있음

- `docs/settings-index.md` 4절 "알림 메일" 줄(57행)은 "인계 예정 (CloudWatch → SNS)"만 적음
- 실제(research.md 366~368행): SNS 주제 `chaekcheck-alerts`, 메일 구독 확인됨, 기본 경보 2개 `chaekcheck-server-down`·`chaekcheck-disk-high`가 이미 있음. 앱 지표 경보(ADR-0130 #7)만 배포 때 더함
- settings-index는 다른 세션이 고치는 중이므로 17 세션은 17 문서 쪽(spec·design-delta에 경보 2개 반영)을 보고, settings-index 줄은 그 세션과 맞춤

## 4. 빠진 문서

- **되돌리기 절차**: 17 문서 어디에도 없음(2026-10-17 `scope`·`spec`·`flow`·`design-delta`·`research`에서 "되돌리"·"롤백"·"rollback"을 찾아 없음). 새 이미지가 안 뜰 때 앞 이미지로 돌아가는 순서, DB 변경(Liquibase)이 있었을 때의 처리
- **운영 문서(백업·되살리기 포함)**: `design-delta.md` 146행이 "운영 문서 | 띄우기·백업 되살리기·노트북으로 옮기기(flow F4-1) 순서, 공개일 체크리스트(research 8절)"를 계획했지만 아직 없음. 정기 작업으로는 `docs/reference-index.md` 8절 "절차 문서가 아직 없는 정기 작업"에 모아 둠(03:00 백업, 04:00 회원 정리, 로그 14일 지우기, CloudWatch 경보 운영 등)

## 5. dev 문서 (인계로 고칠 것)

plan에서 dev를 고치지 않으므로 17(또는 다음) 인계서 "dev에 알릴 것"에 넣음. 2026-10-17에 dev 파일을 읽어 확인함.

| dev 곳 | 어긋남 | 맞는 값 |
|---|---|---|
| `docs/maintenance/README.md` 65행 | 사서추천도서를 "최근 6번 추천"으로 받는다고 적음 | `docs/maintenance/4-picks.md` 4행 "최근 12개 달(12번 추천)", `backend/src/main/resources/application.yml` 195~196행 주석 "latest 12 recommendations (user decision 2026-10-12: 12 recommendations instead of 6)" |
| `docs/maintenance/1-libraries.md` 169~172행, `docs/maintenance/README.md` 14행(그리고 33행 9번, `2-crawl.md` 43행) | `probe_kyobo_limits.py`를 "한 번 조사"·"매일 확인(`limits-daily.cmd`)" 도구로 적음. 169행은 "이 도구에는 그 거르기가 없으므로 돌리기 전에 사용자에게 묻습니다"라고 적음 | 스크립트는 2026-10-12부터 시작하자마자 끝남: `scripts/library/probe_kyobo_limits.py` 115행 `sys.exit("probe_kyobo_limits.py does not run since 2026-10-12: …")`. 문서를 "지금은 돌지 않음(사이클 13 R1-6), 다시 쓰려면 사용자 결정"으로 고침 |
| `docs/maintenance/README.md` 전체 | 운영 서버에서 도는 정기 작업이 없음: 04:00 회원 정리, 03:00 DB 백업, 04:30 사용 기록 정리(`5-usage-log.md` 3절이 있으나 README에서 가리키지 않음), CloudWatch 경보 | `5-usage-log.md` 127행 "04:00 회원 정리, 05:00 사서 추천 받기, 03:00 DB 백업(사이클 17)". README 0절 표와 체크리스트에 운영 서버 줄을 더함 |
