# ADR-0103: 첫 운영 서버는 compose 한 벌(edge·app 네트워크), 비밀 값은 띄우기 스크립트가 Parameter Store에서, 지표는 별도 포트, 백업은 수집 목록을 빼고 Tunnel SSH로 받음

Status: Proposed
Date: 2026-10-14
Cycle: 17-first-deploy
Supersedes: 없음

## 배경
사이클 17은 서비스를 AWS Lightsail 서울 4GB 한 대에 처음 공개 운영한다(2주 뒤 노트북으로 옮김). 서비스 모듈·표·API는 바꾸지 않고, 서버 안의 구성(네트워크, 비밀 값, 지표, 백업, 이미지 옮기기)을 정해야 했다. Lightsail은 EC2처럼 서버에 IAM 역할을 붙이는 방법이 공식 문서에 없고, 운영자 집 IP는 고정이 아니며, 서비스 8080은 로그인이 필요한 곳 말고 모두 `permitAll`이다.

## 결정
- compose 한 벌, 네트워크 둘: `edge`(cloudflared·nginx·grafana, 10.x 고정 subnet, nginx가 믿는 `CF-Connecting-IP` 범위)와 `app`(backend·db·prometheus·node_exporter·cAdvisor·접속 기록 exporter, internal). 어떤 컨테이너도 `ports:`로 바깥에 열지 않음. 조회 서버는 넣어 두되 꺼 둠
- 비밀 값: `up.sh`가 Parameter Store `/chaekcheck/prod/`를 읽어 `chmod 600` env 파일로 쓰고 compose가 읽음. env 파일이 이미 있으면 그것을 씀(노트북 대비)
- 지표: backend는 `management.server.port` 8081에만 `health,prometheus`를 노출. 도서관 호출 포기 횟수는 `InMemoryHostThrottle` 두 경로에서 Micrometer 카운터. 429·상태 코드는 nginx 접속 기록 exporter, 컨테이너 메모리는 cAdvisor
- 백업: 매일 03:00 `pg_dump -Fc -N catalog -N catalog_next`, 서버 2개. 내 PC가 Cloudflare Tunnel SSH로 받아 7개. 수집 목록은 PC의 마지막 반영 파일이 백업
- 이미지: PC에서 빌드해 `docker save`로 묶어 Tunnel SSH로 옮김(레지스트리 없음)

## 이유 (사용자 발언)
- 비밀 값을 AWS에: "해보자 그냥 써보고 싶어" (2026-10-13)
- 백업을 Tunnel SSH로: "어 이거 집 아이피 바뀔 수 있는데? 이거 고정 아니야" (2026-10-13), "이거로"
- 네트워크 둘·지표 별도 포트·429 exporter·cAdvisor·백업 범위·조회 서버 꺼 둠·이미지 옮기기·띄우기 스크립트·포기 횟수 카운터: 제안 → 승인 (2026-10-13~14, `easy/2026-10-13-design-decisions.html` #1~#10)

## 검토한 대안
### A안: 위 결정 (채택)
- 장점: 컨테이너 모두 같은 방식으로 비밀 값을 받음, 바깥에 열린 문이 없음, 노트북으로 같은 파일로 옮김, 매일 백업이 작음
- 단점: 비밀 값이 `docker inspect`에 남음(root), 컨테이너가 늘어 4GB를 나눠 씀, 복원이 두 단계
### B안: compose secrets로 값마다 파일
- 채택하지 않은 이유: [이유 미확인] (A안을 승인)
### C안: Spring Cloud AWS로 backend가 직접 읽음
- 채택하지 않은 이유: [이유 미확인] (A안을 승인. 제안 때 근거: backend만 해결, Boot 4.1 호환 미확인)
### D안: 같은 8080, nginx에서만 `/actuator` 막음
- 채택하지 않은 이유: [이유 미확인] (별도 포트를 승인)
### E안: 집 IP만 허용한 SSH로 백업 받기
- 채택하지 않은 이유: "어 이거 집 아이피 바뀔 수 있는데? 이거 고정 아니야" (2026-10-13)
### F안: DB 전체 백업
- 채택하지 않은 이유: [이유 미확인] (수집 목록 뺀 범위를 승인)

## 결과
- 좋아지는 점: 서버에 열린 포트가 없음(SSH도 터널), 노트북 이전이 터널 replica와 같은 파일로 끝남, Grafana에서 포기 횟수·429·컨테이너 메모리를 봄
- 감수하는 점: 4GB 안에서 모니터링 컨테이너가 메모리를 씀(측정 필요), 접속 기록 exporter 관리 상태 미확인, Tunnel SSH 설정과 무료 범위 확인 필요
- 나중에 서비스로 분리할 때: 서비스마다 Parameter Store 경로와 관리 포트를 나누면 그대로 씀
