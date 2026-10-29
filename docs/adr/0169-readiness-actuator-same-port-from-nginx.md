# ADR-0169: 준비 확인은 Actuator readiness, 같은 포트, nginx 컨테이너 안에서 부름

Status: Accepted
Date: 2026-10-29
Cycle: 27-zero-downtime-deploy
Supersedes: 없음

## 배경
새 자리를 언제 손님 요청에 넣을지 알려면 "다 떴다"를 알려 주는 주소가 필요한데, 백엔드에 Actuator가 없고 compose `healthcheck`도 없으며 `release.sh`는 확인 없이 끝난다. 백엔드 이미지(`eclipse-temurin:25-jre`)에는 curl이 없다(github.com/adoptium/containers 확인 2026-10-29). nginx는 `/api/`만 백엔드로 넘겨 `/actuator/`는 지금도 바깥에서 404다.

## 결정
백엔드에 `spring-boot-starter-actuator`를 넣고 `health`만 열어(`probes.enabled: true`) `/actuator/health/readiness`를 원래 포트 8080에서 쓴다. `switch.sh`가 nginx 컨테이너 안에서 `wget`으로 새 자리를 1초마다 최대 60초 부르고, UP이면 `/api/v1/version`으로 판 번호도 확인한다. 새 자리가 꺼지거나 다시 시작한 적이 있으면 바로 실패로 본다. nginx에 `location ^~ /actuator/ { return 404; }`를 한 줄 더 둔다.

## 이유 (사용자 발언)
- "60초로 줄이고 4번 승인" (2026-10-29, 같은 포트·nginx 안에서 부르기·막는 줄 설명을 들은 뒤)

## 검토한 대안
### A안: 같은 포트 + nginx 컨테이너 안에서 wget (채택)
- 장점: 새 포트 없음, nginx가 실제로 쓸 이름·길을 그대로 확인
- 단점: 확인이 nginx 컨테이너에 기대므로 nginx가 떠 있어야 함
### B안: 준비 확인만 다른 포트(`management.server.port`)
- 단점: 연결·스레드가 하나 더, 설정이 늘어남
- 채택하지 않은 이유: [이유 미확인]
### C안: 자리별 서버 포트 + 서버에서 curl
- 단점: 포트 둘을 관리
- 채택하지 않은 이유: [이유 미확인]
### D안: compose `healthcheck`
- 단점: 백엔드 이미지에 curl 없음, 10초마다 프로세스 하나 더
- 채택하지 않은 이유: [이유 미확인]

## 결과
- 좋아지는 점: 새 판이 다 뜬 뒤에만 손님 요청이 감, 실패하면 옛 판 그대로
- 감수하는 점: 쿠버네티스 밖에서 probes가 열리는지·정상 종료 때 `REFUSING_TRAFFIC`는 dev 프로토타입으로 확인 필요
- 나중에 되돌리거나 서비스로 분리할 때의 비용: 낮음. 로드밸런서·쿠버네티스로 가도 같은 readiness 주소를 그대로 씀
