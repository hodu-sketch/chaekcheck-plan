# 설계 제안: 무중단 배포 (사이클 27)

architect 서브에이전트 제안 (2026-10-29, dev 파일 읽기만). 결정은 `easy/2026-10-29-design-decisions.html`에서 사용자가 함. 모두 [안].

## 지금 상태에서 새로 확인한 것 (dev main 2026-10-29)

- web 이미지(`deploy/prod/web.Dockerfile`)에 nginx 설정 4개(`ec2-tunnel.conf`, `chaekcheck-locations.conf`, `rate-limits.conf`, `security-headers.conf`)와 `web/dist`가 같이 들어 있음 → web 판을 바꾸면 nginx 컨테이너가 다시 만들어짐 [확정]
- nginx가 백엔드로 넘기는 곳은 `/api/…`뿐. `/actuator/…`는 `location /`의 `try_files $uri =404`로 바깥에서 404 [확정]
- 백엔드 이미지 `eclipse-temurin:25-jre`에 curl 없음 (https://github.com/adoptium/containers/blob/main/25/jre/ubuntu/noble/Dockerfile , 2026-10-29) [확정]. ENTRYPOINT exec 형식이라 SIGTERM이 java에 바로 감 [확정]
- `SecurityConfiguration` 74행 `anyRequest().permitAll()` → 서버 안에서 `/actuator/health` 부를 수 있음 [확정]
- 서버의 `127.0.0.1:8080`을 쓰는 운영 스크립트·문서 없음 (`scripts/catalog/*.py`는 PC 로컬, `deploy/nginx/chaekcheck.conf`는 예시) [확정]
- `AccountDeleted`를 두 번 받아도 됨: `AccountDeletedCleanup`(주석 "Running it twice … leaves the same result"), `UsageLogAccountDeletedCleanup`(UPDATE … SET NULL), `AccountDeletedLog`(로그 한 줄) [확정] (dev 코드 읽기)

## 결정 1: 두 자리를 compose에 두는 방법

- **A (추천)**: 서비스 둘 `backend-blue`·`backend-green` (공통은 YAML 앵커 `x-backend`), 별칭 자리별, `image: chaekcheck/backend:${BACKEND_BLUE_VERSION:?}`. `backend-host` 별칭과 `127.0.0.1:8080` 포트 없앰. 늘 `up -d --no-deps <자리>`. `web`의 `depends_on: backend` 지움. 자원 지금과 같음, 이름으로 가리켜 nginx 이름 풀이 문제를 피함
- B: `--scale backend=2` — 같은 별칭이라 reload 때 둘에 나눠 보냄, 판 번호 다른 둘을 compose가 다루기 어려움
- C: 자리마다 compose 프로젝트 — 네트워크·비밀값 처리가 둘로, 복잡

## 결정 2: 일하는 자리 기록

- **A (추천)**: `/srv/chaekcheck/slots.env` (`ACTIVE_SLOT`, `BACKEND_BLUE_VERSION`, `BACKEND_GREEN_VERSION`, `WEB_VERSION`), compose `--env-file`로도 씀. `release.sh`가 compose를 `sed`로 고치는 일이 사라짐. 쓰는 순서: 새 자리 VERSION → 띄우고 준비 확인 → upstream 파일 쓰기·`nginx -t` → reload → `ACTIVE_SLOT` 변경. 중간에 끊기면 `up.sh`가 `slots.env` 기준으로 upstream 파일을 다시 만듦
- B: upstream 파일을 기록으로, 판 번호는 `docker inspect` — compose 이미지 변수 때문에 결국 env 파일이 생김

## 결정 3: nginx를 다시 만들지 않고 web 파일·설정 바꾸기

- **A (추천)**: `web` 서비스 이미지를 고정 판 `nginx:<태그>`로. 서버 폴더를 통째로 읽기 전용 mount: `/srv/chaekcheck/nginx/`(설정, upstream 파일 `active-backend.conf`), `/srv/chaekcheck/web/`(화면). 화면 파일은 `chaekcheck/web:X` 이미지에서 꺼내 `/srv/chaekcheck/web/releases/X`에 두고 `current` 링크를 바꾼 뒤 reload. 되돌리기 = 링크를 앞 판으로. 파일 하나만 mount하면 바꿔도 옛 파일을 계속 보므로 폴더째. nginx 기본 이미지 판 올리기는 점검 배포
- 앞 판 화면 조각(assets)을 새 판 폴더에 함께 두기: 옛 화면을 연 브라우저가 옛 조각을 찾다 404가 나지 않게 (지금도 있는 위험)
- B: web 이미지 없이 dist를 tar로 — 판 관리·되돌리기 규칙을 새로 써야 함
- C: 떠 있는 nginx에 `docker cp` — 컨테이너가 다시 만들어지면 옛 파일로 돌아감. 버림

## 결정 4: 준비 확인 주소와 부르는 방법

- 포트 **A (추천)**: 같은 8080, Actuator는 `health`만 엶. nginx가 넘기지 않아 바깥에서 404. 안전 장치로 `location ^~ /actuator/ { return 404; }` 한 줄 더
- 포트 B: `management.server.port` 따로 — 연결·스레드가 더 생기고 설정이 늘어남
- 부르기 **(i) 추천**: `docker compose exec -T web wget -qO- http://backend-green:8080/actuator/health/readiness` — 새 포트 없음, nginx가 쓸 바로 그 길을 확인, `/api/v1/version`으로 판 번호도 확인. 1초 간격 최대 180초. 컨테이너가 끝났거나 다시 시작한 적 있으면 바로 실패
- (ii) 자리별 서버 포트 + curl — 포트 둘 관리
- (iii) compose `healthcheck` — 백엔드 이미지에 curl 없음, 10초마다 프로세스 하나 더

## 결정 5: 배포 로직 둘 곳

- **B (추천)**: 서버에 `bin/switch.sh backend X.Y.Z | web X.Y.Z` 새로: 새벽 검사 → `slots.env` → `up.sh`로 자리 띄움 → 준비 확인 → upstream 쓰기·`nginx -t`·reload → 2초 기다림 → 옛 자리 `stop`(컨테이너는 남겨 로그 확인) → 결과 한 줄·종료 코드. `up.sh`는 비밀값 + compose 포장 그대로. `release.sh`는 4단계에서 `switch.sh`를 부르고, 되돌리기는 `release.sh --switch-only X.Y.Z`(이미지가 서버에 있는지 확인 뒤 전환만). 새벽 검사는 PC에서도 시작할 때 한 번(`TZ=Asia/Seoul`)
- A: `up.sh`에 덧붙이기 — 비밀값 읽기와 전환이 한 파일에 섞임

## dev 파일마다 바꿀 것 (추천안 기준)

| 파일 | 바꿀 것 |
|---|---|
| `backend/build.gradle` | `spring-boot-starter-actuator` |
| `application.yml` | `server.shutdown: graceful`, `spring.lifecycle.timeout-per-shutdown-phase: 40s`, `management.endpoint.health.probes.enabled: true`, `management.endpoints.web.exposure.include: health` |
| `deploy/prod/compose.yaml` | `backend-blue`/`backend-green`(앵커, 이미지 변수, 별칭), `stop_grace_period: 60s`, 8080·`backend-host` 없앰, `web` = `nginx:<고정>` + 폴더 mount, `depends_on` 지움 (별칭 `nginx`, `8088` 그대로) |
| `deploy/nginx/ec2-tunnel.conf` | upstream 블록 → `include /etc/nginx/chaekcheck/active-backend.conf;`, `root` = `current` 링크, `/actuator/` 404 |
| `deploy/prod/web.Dockerfile` | 화면 파일 운반용 (dist만) |
| `bin/switch.sh` | 새로 |
| `bin/up.sh` | `slots.env`를 `--env-file`로, 이름 없이 부르면 db + 일하는 자리 + web + cloudflared, `active-backend.conf` 없으면 만듦 |
| `bin/release.sh` | 새벽 검사, compose `sed` 지움, `deploy/nginx/*.conf`·`switch.sh` 전송, 4단계 `switch.sh`, `--switch-only`, `web/releases` 두 판만 남김 |
| `deploy/prod/README.md` | 배포·되돌리기·점검 배포·처음 한 번 옮기기 (이때 짧은 중단 한 번) |

## 위험

- 메모리: 겹치는 동안 JVM 둘(약 648MB×2) + PostgreSQL + nginx. 측정 전. 메모리가 바닥나면 리눅스가 db를 끌 수도 있음 → 스왑(명세 결정 #5)
- 새 자리가 실패해도 Liquibase 변경은 남음 → 명세 규칙 6으로 받아들임
- 재부팅 때 nginx가 일하는 자리 이름을 못 찾으면 시작 실패 → `restart`로 다시 시도 (지금과 같은 성질)
- reload 직후 옛 자리에 바로 종료 신호를 보내면 keepalive 연결의 새 요청이 거절되는 짧은 틈 가능 → reload 뒤 2초 기다림 [확인 필요: AC-1 감시로 프로토타입]
- nginx `worker_shutdown_timeout` 없음 → 옛 일꾼이 스트림을 끝까지 기다림. 스트림은 백엔드에서 35초로 끝나므로 따로 두지 않음

## 확인 필요

1. 서버 메모리·스왑·시작 시간 (설계 확정 전)
2. Boot 4.1.1에서 `probes.enabled`가 쿠버네티스 밖에서 켜지는지, 정상 종료 때 `REFUSING_TRAFFIC` (dev 프로토타입)
3. reload 뒤 2초가 충분한지 (AC-1 감시)
4. ~~화면이 나중에 불러오는 조각(lazy chunk)을 쓰는지~~ → 안 씀: dev `web/src`의 `lazy(`·`import(`는 테스트 파일 7곳뿐 (2026-10-29 확인) [확정]. 앞 판 assets 함께 두기는 index.html을 막 받은 브라우저가 조각을 받기 전에 바뀌는 드문 경우만 막음
