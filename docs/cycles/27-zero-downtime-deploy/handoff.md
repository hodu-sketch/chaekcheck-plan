# 개발 인계서: 사이클 27 무중단 배포

- 기준 문서: plan `docs/cycles/27-zero-downtime-deploy/design-delta.md`(설계 결정 6개 승인 2026-10-29). 범위·명세·흐름은 `scope.md`, `spec.md`(AC-1~AC-9), `flow.md`. 근거와 측정값은 `research.md`, `server-measure.md`, `architect-proposal.md`
- ADR: 0167(같은 서버 블루·그린, `slots.env`, `switch.sh`), 0168(nginx는 판을 고정하고 화면 파일·설정은 서버 폴더에서), 0169(준비 확인은 Actuator readiness, 같은 포트, nginx 컨테이너 안에서 부름), 0170(DB 변경은 옛 판·새 판이 같이 돌아도 되는 것만), 0171(서버마다 갖는 상태는 받아들이고 새벽 03:25~05:10에는 배포 안 함). 모두 Accepted, 2026-10-29
- 이 인계서의 자리: plan `docs/cycles/27-zero-downtime-deploy/handoff.md`(dev에서는 `../chaekcheck-plan/docs/cycles/27-zero-downtime-deploy/handoff.md`). `docs/current/handoff.md`에는 한 줄 안내만
- 만들 dev 세션: `chaekcheck-dev-cycle-27`

## 요약

백엔드를 compose 서비스 두 자리(`backend-blue`·`backend-green`)로 나눕니다. 서버의 새 스크립트 `bin/switch.sh`가 쉬는 자리에 새 판을 띄우고, 준비 확인(`/actuator/health/readiness`)과 판 번호 확인이 통과하면 nginx가 보는 곳을 `nginx -s reload`로 바꿉니다. 옛 자리는 정상 종료(Spring 40초, Docker 60초)로 내립니다. 화면(web)은 nginx 컨테이너를 다시 만들지 않습니다. 화면 이미지에서 꺼낸 파일을 서버 폴더 `releases/X`에 두고 `current` 링크를 바꾼 뒤 reload합니다. 되돌리기도 같은 전환(`release.sh --switch-only`)을 씁니다. 도메인 모듈·표·공개 API는 바뀌지 않습니다. 지금 구조에서 새 구조로 처음 옮길 때 한 번만 짧게 끊깁니다.

## 일정과 다른 사이클과의 순서

- 사이클 26은 운영에 올라가 있음(운영 v1.21.3, `server-measure.md`). 23·24는 dev에서 아직 main에 합쳐지지 않았고 `deploy/prod/compose.yaml`(백엔드 환경 변수)·`release.sh`·`README.md`를 건드릴 수 있음 [확정] (plan 확인 2026-10-29)
- 그래서 **이 사이클은 따로 worktree·브랜치에서** 만들고, main에 합칠 때 충돌을 풉니다. 23·24가 compose 백엔드 `environment`에 넣은 줄은 합칠 때 `x-backend` 앵커 안으로 옮깁니다
- 이 사이클에는 Liquibase changelog가 없습니다(ADR-0170 체크리스트에서 "해당 없음"을 확인)
- 버전: 배포 방법과 Actuator만 바뀌는 변경이라 MINOR 또는 PATCH 후보 [안: 배포 때 dev가 정함]

## 이 인계서를 쓰는 규칙

- 이 파일은 chaekcheck-plan이 관리합니다. **dev에서 고치지 마세요**
- 구현이 이 인계서나 `design-delta.md`와 달라져야 하면(값, 이름, 순서, 파일 배치) 조용히 바꾸지 않습니다. 먼저 사용자에게 알리고, dev `docs/plan-feedback.md`의 새 **`# 사이클 27`** 절에 무엇을 왜 바꿨는지 적습니다(사용자 발언은 그대로)
- `[안]`은 dev가 코드에 맞춰 바꿀 수 있고, 바꾸면 `# 사이클 27` 절에 알리기만 합니다. 예: 결과 줄 모양, 로그 줄 수, 서버 하위 폴더 이름, 시험용 시계 변수 이름, 테스트 클래스 이름
- **바꾸지 않는 것** [확정]
  - 두 자리 서비스 `backend-blue`·`backend-green`, 일하는 자리 기록 `/srv/chaekcheck/slots.env`(`ACTIVE_SLOT`, `BACKEND_BLUE_VERSION`, `BACKEND_GREEN_VERSION`, `WEB_VERSION`)
  - 준비 확인은 `/actuator/health/readiness`, 같은 포트 8080, Actuator는 `health`만 엶. 바깥 `/actuator/`는 404
  - 준비 기다림은 1초 간격 최대 60초. 새 자리가 꺼지거나(exited) 다시 시작한 적이 있으면(RestartCount > 0) 바로 실패
  - `spring.lifecycle.timeout-per-shutdown-phase: 40s`, `stop_grace_period: 60s`
  - reload 뒤 2초 기다리고 나서 옛 자리를 `stop`(지우지 않음)
  - 새벽 03:25~05:10(서울 시각)에는 `release.sh` 시작 때와 `switch.sh` 시작 때 거절
  - 결과는 마지막 한 줄과 종료 코드(성공 0, 실패 1)
  - nginx는 판을 고정한 기본 이미지. 설정·화면은 서버 폴더를 **폴더째** 읽기 전용으로 붙임(파일 하나만 붙이지 않음). 화면 폴더는 두 판만 남김
  - db·cloudflared·nginx 기본 이미지 판 올리기와 ADR-0170을 지킬 수 없는 DB 변경은 점검 배포(지금 방식, 짧은 중단)
- 태그: `[확정]` 사용자가 정했거나 공식 문서·실측으로 확인 / `[안]` 제안 / `[확인 필요]` 모르는 값(코드에 확정값처럼 넣지 말고 `TODO(확인 필요)`, 확인 뒤 보고)
- 단계마다 `backend/`에서 `./gradlew build`(`ModularityTests`·`DocumentationTests` 포함)가 통과해야 다음 단계로 갑니다. 셸 스크립트는 `bash -n`과 `shellcheck`(있으면)를 거칩니다
- dev `CLAUDE.md`와 스킬을 그대로 따릅니다. Spring Boot 4.1 Actuator 설정은 Context7로 지금 문서를 확인합니다

## 참고 문서 (chaekcheck-plan, 읽기 전용)

- `design-delta.md`: **기준 문서**(구성도, 백엔드·web 배포 순서도, 자리 상태, dev 파일마다 바꿀 것, 서버에 새로 생기는 것)
- `spec.md`(입력과 출력 값, 동작 규칙 1~8, 상태별 동작, AC-1~AC-9), `flow.md`(D0~D7, X1·X2), `scope.md`
- `architect-proposal.md`(결정 1~5의 대안, 위험), `research.md` 4절(겹칠 때 달라지는 것, 코드 위치), `server-measure.md`(메모리 1,834MB·사용 가능 467MB·스왑 2GB·시작 19.4초)
- plan `docs/settings-index.md` "사이클 27 무중단 배포" 표

## 공통 제약

- **C1. 모듈 경계**: 도메인 모듈 변경 없음. Actuator는 공통 설정뿐이고 모듈 패키지에 새 클래스를 만들지 않음 [확정]
- **C2. 비밀 값**: `secrets.env`·SSH 키·Parameter Store 값을 스크립트 출력, 로그, `plan-feedback.md`에 남기지 않음. `switch.sh`가 실패 때 보여 주는 백엔드 로그에도 비밀 값이 없는지 0단계에서 한 번 봄
- **C3. 겹치는 파일**: 23·24와 `deploy/prod/compose.yaml`, `deploy/prod/bin/release.sh`, `deploy/prod/README.md`, `deploy/prod/prod.env`. 나중에 main에 들어가는 쪽이 rebase로 풂
- **C4. 운영 서버 버릇** [확정] (dev 파일에서 확인): `restart: unless-stopped`(손으로 `stop`한 자리는 재부팅 뒤에도 꺼져 있음), 서버 Ubuntu arm64, 백엔드 이미지 `eclipse-temurin:25-jre`에는 curl이 없음, nginx 이미지는 alpine 계열(busybox `wget`)
- **C5. 한 번에 하나**: 맨몸 `docker compose up -d`(서비스 이름 없이)를 서버에서 직접 돌리지 않음. 두 자리가 다 뜸. 늘 `bin/up.sh`나 `bin/switch.sh`를 거침(README에 적음)

## 개발 시작 전 확인

- [ ] base package `com.chaekcheck` [확정]
- [ ] 시작 커밋: 지금 dev main 끝(운영 v1.21.3 태그 뒤). plan이 읽은 dev 폴더의 `backend/build.gradle` 10행과 `deploy/prod/compose.yaml` 50·127행은 `1.20.6`이어서 읽은 사본이 오래됐을 수 있음. 시작 커밋과 그때의 판 번호를 `# 사이클 27`에 적음
- [ ] worktree·브랜치·docker 프로젝트 이름·포트 [안: dev가 정해 보고]. 다른 사이클의 docker 프로젝트는 켜고 끄지 않음
- [ ] 23·24 브랜치가 `deploy/prod/*`를 얼마나 바꿨는지 한 번 보고 적음(합칠 때 준비)

### 사용자가 할 것

| 할 일 | 언제 | 결과 |
|---|---|---|
| 운영에서 처음 한 번 옮기기(짧은 끊김 한 번) 시각 승인. 이용자에게 알릴지도 정함 | 8단계 전 | 승인 |
| 운영 AC 확인용 작은 릴리스 V+1(CHANGELOG만 바뀌어도 됨) 허락 | 9단계 | 승인 |

## 구현 단계

경로 약어: `P` = `deploy/prod/`, `N` = `deploy/nginx/`, `S` = 서버 `/srv/chaekcheck/`

### 0단계: 계획을 바꿀 수 있는 확인 (코드 변경 없음, 프로토타입)

결과는 나오는 대로 `# 사이클 27`에 적습니다. 막는 결과(아래 1·2·4가 기대와 다름)가 나오면 plan에 보고하고 기다립니다. 시험 장소는 WSL Ubuntu docker(amd64)로 충분합니다.

1. **Boot 4.1.1에서 쿠버네티스 밖 probes**: `spring-boot-starter-actuator`와 `management.endpoint.health.probes.enabled: true`, `management.endpoints.web.exposure.include: health`로 백엔드를 띄움. 확인할 것
   - `GET /actuator/health/readiness`와 `/actuator/health/liveness`가 200 `{"status":"UP"}`
   - 시작 중(runner들이 끝나기 전)에는 readiness가 UP이 아님
   - `/actuator/env`, `/actuator/beans`, `/actuator/info`는 404
   - 로그인 켜짐(`CHAEKCHECK_AUTH_ENABLED=true`, 가짜 키)과 꺼짐 둘 다. 켜짐이면 `SecurityConfiguration` 74행 `anyRequest().permitAll()`로 열리는지 봄
   - 설정 없이도 열리는지 적음(참고용). 설정은 넣음
2. **정상 종료 때 `REFUSING_TRAFFIC`와 스트림**: 이미지로 띄우고(`docker run`, `--stop-timeout 60`), 대출 조회 스트림(`/api/v1/ebook-searches/stream` 등)을 연 채로 `docker stop` 함. 확인할 것
   - (a) 열린 스트림이 마지막 이벤트까지 오는지(Tomcat 정상 종료가 async SSE 요청을 기다리는지)
   - (b) 종료 중 다른 컨테이너에서 부른 readiness가 503 `OUT_OF_SERVICE`인지, 연결 거절인지(무엇이든 적음)
   - (c) 로그 문구. 기대는 "Commencing graceful shutdown…"과 "Graceful shutdown complete"로, 정확한 글은 여기서 확인해 AC-6에 씀
   - (d) 종료 코드가 143(SIGTERM)이고 137(SIGKILL)이 아님
   - (e) `UsageLogFlusher`가 마지막 저장을 하는지(이용 기록 켜짐)
   - (f) [확인 필요] 가입 중 HTTP 세션이 "끝남" 처리되어 `AbandonedSignupListener`가 카카오 연결 끊기를 부르는지(관찰만, 막지 않음)
3. **nginx alpine의 busybox wget**: 고정할 판 후보에서 `docker run --rm nginx:<판>-alpine wget --help`와 `-q -T 2 -O-` 동작을 봄. HTTP 503에서 종료 코드가 0이 아닌지도 봄. 운영의 지금 판은 서버에서 `docker exec chaekcheck-web-1 nginx -v`로 봄(README 시험 기록은 1.30.5, 2026-10-04). **고정할 태그 = 지금 운영 판의 `-alpine`** [안]
4. **nginx reload가 새 upstream 이름을 잡는지**: 같은 네트워크에 작은 HTTP 컨테이너 둘(`backend-blue`, `backend-green`, 응답 글이 다름)과 nginx를 둠. upstream은 `include`한 파일로. 확인할 것
   - (a) 파일을 green으로 바꾸고 `nginx -t && nginx -s reload` → 새 요청이 green으로 감
   - (b) green 컨테이너를 다시 만들어 IP가 바뀐 뒤 reload → 새 IP로 감
   - (c) 이름이 없는(멈춘) 자리를 가리키면 `nginx -t`가 실패함("host not found in upstream") → `switch.sh`가 이것을 안전장치로 씀
   - (d) reload 중 1초 간격 요청 실패 수
   - (e) 파일 하나만 bind mount하고 `mv`로 바꾸면 컨테이너가 옛 내용을 보고, 폴더째 mount하면 새 내용을 보는지(ADR-0168 근거 확인)
5. **Git Bash 시각**: PC Git Bash에서 `TZ=Asia/Seoul date +%H%M`이 서울 시각을 주는지 봄. 안 되면 같은 뜻의 POSIX 표기 `TZ=KST-9`(한국은 서머타임 없음)를 쓰고 보고
6. **compose 버릇**
   - (a) `up -d --no-deps web`이 `cloudflared`를 다시 만들지 않는지
   - (b) `up -d --no-deps --force-recreate backend-green`이 다른 서비스를 건드리지 않는지
   - (c) `--env-file` 셋(secrets, prod, slots)에서 뒤 파일이 이기는지
   - (d) 서버 docker compose 판(`docker compose version`)
7. 기준 빌드: `./gradlew build`, `npm run build`

### 1단계: 백엔드 설정 (Actuator, 정상 종료)

1. **Actuator 의존성** (파일: `backend/build.gradle`)
   - 할 일: 46행 `spring-modulith-starter-core` 근처에 `implementation 'org.springframework.boot:spring-boot-starter-actuator'`와 주석(사이클 27, ADR-0169, health만)
   - 의존: 0단계 1
   - 위험: 낮음
2. **설정** (파일: `backend/src/main/resources/application.yml`)
   - 할 일: 38행 `server:` 아래에 `shutdown: graceful`(Boot 4.1 기본값과 같아도 명시)
   - `spring:` 아래에 `lifecycle.timeout-per-shutdown-phase: 40s`
   - 맨 위 단계에 `management.endpoints.web.exposure.include: health`, `management.endpoint.health.probes.enabled: true`
   - 각 값 옆 주석은 dev `docs/maintenance/settings-index.md`를 가리킴
   - readiness 그룹에는 아무것도 더하지 않음(기본 readinessState만). DB가 잠깐 느릴 때 일하는 자리가 DOWN으로 보이지 않게 [안]
   - 의존: 1
   - 위험: 낮음
3. **시험**
   - 할 일: `backend/src/test/java/com/chaekcheck/ActuatorExposureTests.java` [안: 이름]. `VersionControllerTests`와 같은 자리이고 웹 환경 Spring Boot 시험(test 프로필, `db-test`)
     - `/actuator/health/readiness` 200·`UP`
     - `/actuator/health/liveness` 200
     - `/actuator/env`·`/actuator/beans`·`/actuator/info`·`/actuator/metrics` 404
     - 바인딩된 값 `server.shutdown=graceful`, `spring.lifecycle.timeout-per-shutdown-phase=40s`
   - `ModularityTests`(`ApplicationModules.of(...).verify()`)와 `DocumentationTests`가 그대로 통과(모듈 변경 없음을 확인)
   - 위험: 낮음
- 이 단계는 혼자 지금 방식(`release.sh` 옛 판)으로도 배포할 수 있음. 먼저 내보낼지는 dev가 정함 [안]
- AC-9(백엔드 쪽) 준비

### 2단계: nginx 설정

1. **upstream을 include로** (파일: `N/ec2-tunnel.conf`)
   - 할 일: 10~14행 `upstream chaekcheck_backend { … }` 블록을 지우고 같은 자리(http 단계, `rate-limits.conf` include 뒤)에 `include /etc/nginx/chaekcheck/active-backend.conf;`
   - 31행 `root /usr/share/nginx/html;`을 `root /srv/chaekcheck/web/current;`로 바꿈. 컨테이너 안 경로를 서버와 같게 붙임(3단계) [안]
   - 머리 주석에 사이클 27·ADR-0167/0168
   - 위험: 중간(운영 진입 경로)
2. **바깥 `/actuator/` 404** (파일: `N/chaekcheck-locations.conf`)
   - 할 일: `location /api/` 앞에 `location ^~ /actuator/ { return 404; }`와 주석(ADR-0169). `local-test.conf`·`chaekcheck.conf`·`tunnel-test.conf`도 이 파일을 쓰므로 그쪽에도 같은 404가 생김(괜찮음)
   - 위험: 낮음
3. **`active-backend.conf` 모양** (서버에서 `switch.sh`·`up.sh`가 만듦, git에는 예시 주석만)
   ```nginx
   upstream chaekcheck_backend {
       server backend-green:8080;
       keepalive 16;
   }
   ```
   `keepalive 16`은 지금 값 그대로 [확정] (dev `ec2-tunnel.conf` 13행)
4. `N/README.md`: `ec2-tunnel.conf`가 서버 폴더의 `active-backend.conf`를 include한다는 것, `root`, `/actuator/` 404를 적음
- 시험: 0단계 4의 시험 환경에서 이 파일들로 `nginx -t`. `/actuator/health` 404, `/api/v1/version` 통과, 화면 경로 200

### 3단계: compose 두 자리, 고정 nginx, web 이미지 바꾸기

1. **두 자리** (파일: `P/compose.yaml`)
   - 할 일: 49~124행 `backend:`를 맨 위 단계 `x-backend: &backend`로 옮김(image·networks·ports·서비스 이름 빼고 전부: `restart`, `depends_on`, `environment`, `volumes`)
   - 앵커에 `stop_grace_period: 60s` [확정]
   - 서비스 둘:
     ```yaml
     backend-blue:
       <<: *backend
       image: chaekcheck/backend:${BACKEND_BLUE_VERSION:?BACKEND_BLUE_VERSION missing (slots.env through up.sh)}
       networks: { default: { aliases: [backend-blue] } }
     ```
     `backend-green`도 같은 모양
   - 같이 쓰는 별칭을 앵커에 두지 않음
   - `backend-host` 별칭(118~122행)과 `127.0.0.1:8080` 포트(123~124행)는 지움 [확정]
   - 머리 주석(1~7행)을 새 방식으로: `bin/up.sh`, `bin/switch.sh`, `slots.env`
   - 위험: 높음(운영 구성)
2. **web = 고정 nginx + 폴더 mount** (같은 파일 126~142행)
   - `image: nginx:<0단계 3에서 정한 판>-alpine`. 판 번호를 박음 [안: 판은 dev가 정함]
   - `depends_on: - backend` 지움 [확정]
   - 별칭 `nginx`, `127.0.0.1:8088:80`, `TZ`, `/etc/localtime` 그대로
   - volumes에 폴더 셋(모두 `:ro`):
     - `/srv/chaekcheck/nginx/conf.d:/etc/nginx/conf.d:ro`. 안에는 `default.conf` 하나(= `ec2-tunnel.conf` 사본)
     - `/srv/chaekcheck/nginx/chaekcheck:/etc/nginx/chaekcheck:ro`. 안에는 `rate-limits.conf`, `security-headers.conf`, `chaekcheck-locations.conf`, `active-backend.conf`
     - `/srv/chaekcheck/web:/srv/chaekcheck/web:ro`
   - 이유: design-delta는 "`/srv/chaekcheck/nginx/` 폴더째"라고 함. 기본 이미지의 `conf.d/default.conf`를 바꾸면서 locations 파일이 http 단계에 읽히지 않게, 하위 폴더 둘로 나눔 [안: 배치. 바꾸면 보고]. 화면 폴더는 서버와 같은 경로로 붙여 `current` 링크가 컨테이너 안에서도 그대로 풀리게 함
   - 위험: 높음
3. **화면 운반 이미지** (파일: `P/web.Dockerfile`)
   - 할 일: 6~7행(nginx 설정 COPY)을 지움. `FROM`은 web 서비스와 같은 고정 판 `nginx:<판>-alpine`으로 바꿈(기본 층을 같이 써서 디스크가 늘지 않고, 로컬에서 띄워 볼 수도 있음) [안]. `COPY web/dist /usr/share/nginx/html`은 그대로. 머리 주석은 "화면 파일 운반용, 설정은 서버 폴더(ADR-0168)"
   - 위험: 낮음
- `P/prod.env` 1~2행 주석 "run bin/up.sh backend again" → "`bin/switch.sh backend <지금 판>`(무중단)" [안. 아래 7단계 "설정만 바꿀 때"]
- 시험: WSL에서 `docker compose config`(가짜 env 파일 셋)이 오류 없이 풀리고 서비스가 `db`, `backend-blue`, `backend-green`, `web`, `cloudflared`인지 봄

### 4단계: `bin/switch.sh` (새로)

파일: `P/bin/switch.sh`. 서버 `S/bin/switch.sh`에서 돌아갑니다. `set -euo pipefail`. 머리 주석에 사용법과 ADR-0167~0171.

```
switch.sh backend X.Y.Z
switch.sh web X.Y.Z
```

**공통**
1. 한 번에 하나: `flock -n S/.switch.lock`. 이미 돌고 있으면 실패 줄 [안]
2. **새벽 검사** [확정: 시간] 다른 어떤 일보다 먼저
   - `hhmm=$(TZ=Asia/Seoul date +%H%M)`. `0325 ≤ hhmm ≤ 0510`이면 거절 [안: 끝 경계는 05:10:59까지]
   - 시험용으로 `CHAEKCHECK_CLOCK_HHMM`이 있으면 그 값을 씀 [안: 이름. 시험용으로만 쓴다고 주석]
   - 거절 줄: `switch: REFUSED <kind> X.Y.Z reason=dawn (03:25-05:10 Asia/Seoul, scheduled jobs); nothing changed`, exit 1
3. `slots.env`가 없으면 아무것도 하지 않고 `reason=no-slots-env (README 처음 한 번 옮기기)`로 실패
4. compose 부르기: `dc() { docker compose --env-file secrets.env [--env-file prod.env] --env-file slots.env "$@"; }`. 순서가 `up.sh`와 같고 `slots.env`가 마지막. 비밀 값이 필요한 `exec`·`ps`·`logs`·`stop`도 이것으로 부름
5. `slots.env` 쓰기는 늘 임시 파일 → `mv`(한 줄만 바꿈)
6. 새 nginx 설정 받기 [안]: `S/nginx/incoming/`에 `release.sh`가 보낸 파일이 있으면 nginx 단계에서 그것을 자리(`ec2-tunnel.conf` → `conf.d/default.conf`, 나머지 셋 → `chaekcheck/`)로 복사함. 바꾸기 전 사본을 두고, `nginx -t`가 실패하면 사본으로 되돌림. 끝나면 `incoming/`을 비움

**`switch.sh backend X.Y.Z`** (순서 바꾸지 않음 [확정], design-delta 순서도)
1. `docker image inspect chaekcheck/backend:X.Y.Z`. 없으면 `reason=no-image`
2. `ACTIVE_SLOT` 읽음. 새 자리 = 다른 쪽(`blue`↔`green`)
3. `slots.env`의 `BACKEND_<새 자리>_VERSION=X.Y.Z` (전 값은 기억)
4. `bin/up.sh --no-deps --force-recreate backend-<새 자리>`. `up.sh`가 비밀 값을 새로 읽고 compose를 부름. `--force-recreate`로 늘 새 컨테이너(재시작 수 0, 깨끗한 로그) [안]. 시작할 때 Liquibase가 돎
5. **준비 확인**: 1초 간격, 최대 60초 [확정]. 매번
   - (a) `docker inspect -f '{{.State.Status}} {{.RestartCount}}' $(dc ps -aq backend-<새 자리>)`. `exited`·`dead`이면 바로 `reason=exited`, 재시작 수 > 0이면 바로 `reason=restarted`
   - (b) `dc exec -T web wget -q -T 2 -O- http://backend-<새 자리>:8080/actuator/health/readiness`가 성공하고 본문에 `"status":"UP"`이면 통과
   - 60초가 지나면 `reason=timeout`
   - 걸린 초를 기억함(결과 줄과 `# 사이클 27` 기록용)
6. **판 번호 확인**: `dc exec -T web wget -q -T 2 -O- http://backend-<새 자리>:8080/api/v1/version`의 `"version"`이 `X.Y.Z`인지. 다르면 `reason=version-mismatch`
7. **nginx**: (공통 6의 받은 설정을 놓고) `S/nginx/chaekcheck/active-backend.conf`를 임시 파일 → `mv`로 새 자리로 씀 → `dc exec -T web nginx -t`. 실패하면 `active-backend.conf`와 설정 사본을 되돌리고 `reason=nginx-test` → `dc exec -T web nginx -s reload`
8. `sleep 2` [확정: 값. 충분한지는 AC-1 감시로 확인]
9. `slots.env`의 `ACTIVE_SLOT=<새 자리>`
10. 옛 자리 `dc stop backend-<옛 자리>`. compose가 `stop_grace_period` 60초를 씀. **지우지 않음** [확정]. 다 내려간 뒤 `docker inspect -f '{{.State.ExitCode}}'`를 읽고 137이면(강제 종료) 결과 줄에 `old-exit=137 (killed)`을 붙임
11. 성공 줄(마지막 줄) [안: 모양]: `switch: OK backend X.Y.Z slot=green ready=23s (was 1.21.3 on blue, old-exit=143)`, exit 0

**실패했을 때 (5·6·7단계)** [확정: 동작]
- 새 자리 로그 마지막 줄을 먼저 출력: `dc logs --no-log-prefix --tail 40 backend-<새 자리>` [안: 줄 수]
- `dc stop backend-<새 자리>`(지우지 않음, 로그 확인용)
- `BACKEND_<새 자리>_VERSION`은 기억한 전 값으로 되돌림 [안]
- nginx와 `ACTIVE_SLOT`은 건드리지 않은 상태(7단계 실패면 되돌린 상태)
- 마지막 줄 `switch: FAIL backend X.Y.Z slot=green reason=<timeout|exited|restarted|version-mismatch|nginx-test|no-image> ; site still 1.21.3 on blue`, exit 1
- 이미 돈 Liquibase 변경은 남음 [확정] (ADR-0170). 결과 줄에 따로 쓰지 않고 README에 적음

**`switch.sh web X.Y.Z`** [확정: 순서] (design-delta 화면 배포 순서도)
1. 공통 1~5
2. 지금 판 `P=WEB_VERSION`
3. `S/web/releases/X.Y.Z/`가 없으면
   - `docker image inspect chaekcheck/web:X.Y.Z`(없으면 `reason=no-image`)
   - `cid=$(docker create chaekcheck/web:X.Y.Z)` → `docker cp "$cid":/usr/share/nginx/html/. S/web/releases/X.Y.Z.tmp/` → `docker rm "$cid"`
   - 앞 판 조각을 덮어쓰지 않고 복사: `cp -an S/web/releases/$P/assets/. S/web/releases/X.Y.Z.tmp/assets/` (P 폴더가 있을 때만)
   - `index.html`이 있는지 봄
   - `mv X.Y.Z.tmp X.Y.Z`
   - 있으면(되돌리기) 그대로 씀
4. 링크 바꾸기(원자적): `cd S/web && ln -sfn releases/X.Y.Z current.tmp && mv -T current.tmp current`. 링크 대상은 **상대 경로** [안]
5. 공통 6의 받은 설정을 놓고 `nginx -t`. 실패하면 링크를 `releases/$P`로 되돌리고 `reason=nginx-test` → `nginx -s reload`
6. `slots.env`의 `WEB_VERSION=X.Y.Z`
7. `S/web/releases/`에서 `X.Y.Z`와 `$P` 말고 모두 지움(두 판만) [확정]
8. 성공 줄 `switch: OK web X.Y.Z (was $P)`, exit 0

- 시험: 6단계 리허설에서 모든 길(성공, 다섯 실패 이유, 새벽 거절, web 되돌리기)을 한 번씩 지나게 함
- 위험: 높음(운영 전환의 핵심)

### 5단계: `bin/up.sh`, `bin/release.sh`

1. **`up.sh`** (파일: `P/bin/up.sh`)
   - 할 일: 78~80행에서 `env_files`에 `--env-file "$DIR/slots.env"`를 마지막으로 더함. 없으면 실패 메시지 "slots.env 없음: README 처음 한 번 옮기기"
   - 인자 없이 부르면
     - (a) `slots.env`의 `ACTIVE_SLOT`으로 `active-backend.conf`가 없거나 다른 자리를 가리키면 다시 씀
     - (b) `docker compose … up -d db backend-$ACTIVE_SLOT web cloudflared`(맨몸 `up -d`로 두 자리가 다 뜨지 않게) [확정]
     - (c) (a)에서 바꿨고 web이 이미 떠 있었으면 `nginx -t && nginx -s reload`
   - 인자가 있으면 지금처럼 그대로 넘김(`switch.sh`가 `--no-deps --force-recreate backend-green`으로 부름). (a)는 하지 않음 [안]
   - 머리 주석 4행 사용법을 고침. 비밀 값 처리(38~76행)는 그대로
   - 위험: 중간
2. **`release.sh`** (파일: `P/bin/release.sh`)
   - **사용법**: `release.sh X.Y.Z [backend] [web]`, `release.sh --switch-only X.Y.Z [backend] [web]`
     - 서비스를 안 고르면 backend 다음 web [안: 순서. 새 API를 새 화면보다 먼저]
     - `db`·`cloudflared`를 고르면 "점검 배포: deploy/prod/README.md"로 멈춤 [안]
     - 18~20행 인자 처리와 5행 주석을 고침
   - **새벽 검사를 맨 처음에**(브랜치 검사 50행보다 앞) [확정]: 4단계와 같은 규칙과 같은 `CHAEKCHECK_CLOCK_HHMM`. 거절하면 아무것도 바꾸지 않고 exit 1
   - **compose 이미지 `sed` 지움**: 59행을 지우고 60행 `git add`에서 `deploy/prod/compose.yaml`을 뺌. 57·58행(build.gradle, package.json 판)은 그대로 [확정]. 8~9행 주석도
   - **4/5 전송**: 81~83행 뒤에 `deploy/prod/bin/switch.sh` → `S/bin/switch.sh`, `N/{ec2-tunnel,chaekcheck-locations,rate-limits,security-headers}.conf` → `S/nginx/incoming/` [안: 받는 폴더]를 더함. 84~85행 ssh 명령의 `bin/up.sh $*`를 고른 서비스마다 `bin/switch.sh backend $VERSION`, `bin/switch.sh web $VERSION`(차례대로, 앞이 실패하면 멈춤)으로 바꿈. `chmod +x bin/up.sh bin/switch.sh`
   - **실패**: `switch.sh`가 1로 끝나면 `release.sh`도 1로 끝나고, 마지막 줄은 `switch.sh`의 결과 줄. 5/5(push, GitHub 릴리스)는 하지 않음. 태그·「Release」 커밋은 PC에만 남음(README "실패하면")
   - **정리**: 87~90행 이미지 정리는 그대로. 남길 판에 `slots.env`의 판도 넣음 [안] (컨테이너가 쓰는 이미지는 이미 남음). `web/releases` 두 판 정리는 `switch.sh web`이 함
   - **`--switch-only X.Y.Z`**: 새벽 검사 → 판 꼴 검사 → SSH 키 검사 → 서버에서 고른 서비스마다 `docker image inspect chaekcheck/<서비스>:X.Y.Z`(web은 `S/web/releases/X.Y.Z`가 있어도 됨). 없으면 "서버에 없음: release.sh로 만들어 보내기"로 멈춤 → `switch.sh` 호출. git 검사·판 쓰기·빌드·전송·정리·push는 하지 않음. 서버의 `switch.sh`와 nginx 설정을 그대로 씀
   - 마지막 줄(성공): `done: vX.Y.Z (commit). backend X.Y.Z on <slot>, web X.Y.Z` [안]
   - 위험: 높음

### 6단계: 리허설 (WSL, 운영과 같은 구성)

운영에 가기 전에 WSL Ubuntu docker에 `S`와 같은 배치(`/srv/chaekcheck/…`)를 만들어 전 과정을 돌립니다. 손으로 둔 `secrets.env`(가짜 값, `up.sh` 1번 길), `cloudflared`는 띄우지 않음, 바깥 주소 대신 `http://127.0.0.1:8088`, 이미지는 amd64 빌드, DB는 빈 DB 또는 작은 복사본.

1. 지금 구조(v1.21.x 모양의 compose, `backend` 하나)를 먼저 띄우고 → 8단계 "처음 한 번 옮기기"를 그대로 해 봄 → 끊긴 시간을 잼
2. 새 구조에서 AC-1~AC-9(아래 "테스트")를 `127.0.0.1:8088`로 모두 돌림
3. 서버 재부팅 흉내: `docker compose … restart`나 Docker 다시 켜기 뒤 일하는 자리·web이 저절로 돌아오는지. nginx가 먼저 떠 이름을 못 찾으면 `restart`로 다시 뜨는지(위험 항목, `architect-proposal.md`)
4. 결과(끊긴 시간, 준비까지 걸린 초, 겹칠 때 메모리)를 `# 사이클 27`에

### 7단계: 문서

1. **`P/README.md`**
   - 표: `switch.sh`, `slots.env`, 서버 폴더(`nginx/conf.d`, `nginx/chaekcheck`, `nginx/incoming`, `web/releases`, `web/current`)
   - **배포하기**: `release.sh X.Y.Z [backend] [web]`, 결과 줄 읽는 법, 새벽 03:25~05:10 거절
   - **되돌리기**: `release.sh --switch-only <앞 판> [backend] [web]`(서버에는 앞 판 이미지와 화면 폴더까지만 있음). 39행 옛 절차를 바꿈
     - DB 변경이 든 판에서 되돌릴 때는 ADR-0170 규칙상 앞 판이 새 DB에서 돌 수 있음
     - nginx 설정은 되돌리지 않음(바뀐 설정이 있으면 따로)
   - **설정만 바꿀 때**(`prod.env`): 파일을 서버에 두고 `bin/switch.sh backend <지금 판>`(같은 판을 다른 자리로, 무중단) [안]
   - **점검 배포**(짧은 중단, 미리 알림)
     - 대상: db 이미지 판 올리기, cloudflared 판 올리기, nginx 기본 이미지 판 바꾸기, compose의 `web`·`db`·`cloudflared` 정의 바꾸기, ADR-0170을 지킬 수 없는 DB 변경
     - 순서: `bin/up.sh --no-deps <서비스>`, DB 변경이면 옛 자리를 먼저 `stop` 뒤 새 판
   - **처음 한 번 옮기기**(8단계 순서 그대로)
   - **실패하면**: `switch.sh` 실패 뒤 남는 것(멈춘 새 자리 컨테이너, 그 로그는 `docker logs chaekcheck-backend-<자리>-1`, 이미 돈 Liquibase 변경), 태그·커밋 정리(44행)
   - **주의**: 맨몸 `docker compose up -d` 금지(C5). 49행 "서비스 이름 없이 `up.sh` → 공개"는 그대로 맞음
   - 25행 "compose는 X.Y.Z를 씀" → "`slots.env`의 판"
2. **dev `docs/maintenance/`에서 서비스 이름 `backend`나 compose 이미지 줄을 기대하는 곳**
   - `3-import.md` 289행("`<판>` = `compose.yaml`의 `backend` `image:` 판" → `slots.env`의 일하는 자리 판)
   - 306행(`backend-host` 별칭 위험 → 자리 이름 `backend-blue`/`backend-green`. 일회성 실행은 지금처럼 `docker run --network chaekcheck_default`만)
   - `6-aisearch.md` 54행: `docker compose … run … backend`는 자리 서비스를 쓰면 그 자리의 별칭이 붙어 nginx 요청이 갈 수 있으므로 `3-import.md`의 `docker run` 방식으로 바꿈 [안]
   - `6-aisearch.md` 205행과 17행의 `bin/up.sh`(설정 바꾼 뒤 다시 켜기) → `bin/switch.sh backend <지금 판>`
   - 그 밖에 `grep -rn "up.sh\|backend-host\|chaekcheck-backend-1\|image: chaekcheck" docs deploy`로 나온 곳
3. **dev `docs/maintenance/settings-index.md`**: 1절 표에 두 줄, 새 절 "## 5. 배포 (`deploy/prod/`)"에 아래 "settings-index 줄"

### 8단계: 운영에서 처음 한 번 옮기기 (점검 배포, 짧은 끊김 한 번)

조건: 6단계 리허설 통과, 사용자 승인, 새벽 시간 밖. 판 V = 이 사이클 코드가 든 첫 판.

1. PC: `release.sh V`. `switch.sh`가 `reason=no-slots-env`로 멈추게 둠(이미지 적재와 파일 전송은 끝난 상태, 태그는 PC에만) [안: 더 간단한 길을 고르면 보고]
2. 서버: `docker exec chaekcheck-web-1 nginx -v`가 compose에 박은 판과 같은지 봄
3. 폴더: `S/nginx/{conf.d,chaekcheck,incoming}`, `S/web/releases`
4. `S/slots.env`: `ACTIVE_SLOT=blue`, `BACKEND_BLUE_VERSION=V`, `BACKEND_GREEN_VERSION=V`, `WEB_VERSION=V`
5. 받은 nginx 설정을 자리에 놓고 `active-backend.conf` → `backend-blue`
6. `switch.sh web`의 3·4번과 같은 방법으로 `releases/V`와 `current`
7. **옛 백엔드 옆에 blue 띄우기**(아직 끊김 없음): `bin/up.sh --no-deps backend-blue`. 옛 `backend` 서비스는 고아 컨테이너로 계속 손님을 받음
   - 준비 확인은 옛 web 컨테이너에서: `docker exec chaekcheck-web-1 wget -qO- http://backend-blue:8080/actuator/health/readiness`
   - V는 옛 판과 같이 돌 수 있어야 함(ADR-0170, 이 사이클은 DB 변경 없음)
8. **끊김 시작**: `bin/up.sh --no-deps web`. web이 고정 nginx와 폴더 mount로 다시 만들어짐. 끊김 시간을 잼
9. 서버 `curl -s 127.0.0.1:8088/api/v1/version`이 V. 바깥 `https://chaekcheck.com/`과 `/api/v1/version` 확인(cloudflared가 새 nginx에 다시 붙었는지)
10. 옛 백엔드: `docker stop -t 60 chaekcheck-backend-1 && docker rm chaekcheck-backend-1`
11. `docker ps`: `db`, `backend-blue`, `web`, `cloudflared`
12. PC: 1번에서 멈춘 5/5(push, GitHub 릴리스)를 손으로 함. 무엇을 했는지 `# 사이클 27`에

### 9단계: 운영 AC 확인

옮긴 뒤 작은 릴리스 V+1(CHANGELOG만 바뀌어도 됨)로 AC-1·2·6·7. `--switch-only V`로 AC-4(되돌리기), 다시 `--switch-only V+1`. web만으로 AC-5. 일부러 망가뜨린 태그로 AC-3. 그리고 AC-8·9. 방법은 아래 "테스트".

## ADR-0170 DB 변경 체크리스트 (이 사이클과 앞으로의 모든 사이클)

인계서마다 Liquibase 변경이 있으면 이 표를 채워 `# 사이클 NN` 절에 남깁니다. plan design-delta도 변경마다 어느 쪽인지 적습니다 [확정] (ADR-0170).

- [ ] **배경을 기억함**: 새 판은 시작할 때 Liquibase를 돌리고, 옛 판은 바뀐 DB에서 최대 약 1분 더 돎. `ddl-auto: validate`는 시작 때만 검사함
- [ ] **무중단으로 되는 것만 실었는가**
  - 표·칸·인덱스 추가. 새 칸은 NULL 허용이거나 DEFAULT가 있어 옛 판의 INSERT가 깨지지 않음
  - 옛 판이 읽지도 쓰지도 않는 칸·표 지우기. 옛 판 JPA 엔티티에 매핑된 칸은 "안 쓰는 칸"이 아님
- [ ] **새 CHECK·NOT NULL·FK·UNIQUE**: 옛 판이 쓰는 값이 새 제약을 늘 지키는가
- [ ] **칸 이름 바꾸기·지우기·타입 바꾸기**는 배포 두 번으로 나눔. 1차는 새 칸을 추가하고 둘 다 씀(복사 포함), 2차는 옛 칸을 지움(사이클 26 ADR-0166과 같은 방식). 2차는 1차가 운영에 들어간 **다음** 배포
- [ ] **`runOnChange:true` 함수·트리거 본문**: 바꾼 본문이 **옛 판이 부르는 방식으로도 옛 판과 같은 결과**를 내는가(서명·인자·반환 모양 유지). 옛 판도 바로 새 본문을 씀
- [ ] **데이터 바꾸기(UPDATE·seed)**: 옛 판이 바뀐 데이터를 읽어도 맞게 도는가
- [ ] **오래 잠그는 변경**(큰 표 인덱스, 큰 표 고쳐 쓰기): 리허설 DB에서 잠그는 시간을 잼. 그동안 옛 판 요청이 멈추므로 길면 점검 배포 [안: 확인 항목]
- [ ] **새 판이 준비 확인에 실패해도 이미 돈 변경은 남음**: 위를 지켰으면 옛 판이 그대로 돎. 다시 내보낼 판도 같은 changeset을 다시 돌리지 않음(Liquibase 기록)
- [ ] **되돌리기 대상**(`--switch-only` 앞 판)이 새 DB에서 도는가. 위 규칙이면 바로 앞 판은 돎. 두 판 이상 앞으로는 보장하지 않음
- [ ] **지킬 수 없으면** 인계서에 "점검 배포"라고 적고 README 점검 배포 순서로(옛 자리를 먼저 내리고 새 판)
- [ ] **이 사이클 27**: Liquibase 변경 없음 → 해당 없음을 확인하고 적음

## 테스트

### 단위·통합

- `ActuatorExposureTests` [안](1단계), `VersionControllerTests` 그대로, `ModularityTests`(`ApplicationModules.of(ChaekcheckApplication.class).verify()`), `DocumentationTests`
- 셸: `bash -n`, `shellcheck`(있으면), 리허설에서 모든 길

### 감시 도구 (AC-1·3·4·5에 공통) [안: 모양]

PC Git Bash 다른 창에서 배포 전에 켜고 끝난 뒤 10초 더 둡니다.

```bash
URL=${URL:-https://chaekcheck.com}
while true; do
  t=$(date +%T)
  v=$(curl -s --max-time 10 -w ' %{http_code}' "$URL/api/v1/version?t=$(date +%s%N)")
  h=$(curl -s --max-time 10 -o /tmp/home -w '%{http_code}' "$URL/?t=$(date +%s%N)")
  a=$(grep -o 'assets/index-[^"]*\.js' /tmp/home | head -1)
  echo "$t version=$v home=$h $a"
  sleep 1
done | tee watch-$(date +%H%M).log
```

판정:
- 200이 아닌 줄 0건: `grep -vc 'version=.* 200 home=200' watch-*.log`가 0
- 판 번호 차례: `grep -o '"version":"[^"]*"' watch-*.log | uniq`가 두 줄(옛 판 → 새 판). 세 줄 이상이면 섞여 오간 것
- web: 조각 이름 차례가 같은 식으로 한 번 바뀜

### 수용 기준과 테스트 대응표

| AC | 어떻게 확인 | 단계 |
|---|---|---|
| AC-1 1초마다 실패 0건, 판 번호 한 번만 바뀜 | 감시 도구를 켜고 `release.sh V+1`. 위 판정. `switch.sh` 결과 줄의 `ready=`초와 겹칠 때 `free -m`·`docker stats --no-stream`을 함께 적음. 실패가 있으면 시각을 결과 줄과 맞춰 2초 기다림이 모자란지 봄 | 6, 9 |
| AC-2 열린 스트림이 끝까지 | 배포 내내 3초마다 대출 조회 스트림을 새로 엶(`curl -sN` 스트림 URL, 끝 이벤트가 오면 OK, 중간에 끊기면 FAIL, 열고 닫은 시각을 적음). 전환 순간(결과 줄 시각)을 걸친 스트림이 적어도 하나 OK여야 함. AI 책 찾기 스트림(`POST /api/v1/ai-searches/stream`)은 IP 한도(1분 10번, 하루 100번)와 비용 때문에 10초마다 [안], 전환을 걸친 것 하나 이상이 마지막 이벤트까지. 끝 이벤트 이름은 dev 코드 기준으로 적음 | 6, 9 |
| AC-3 망가진 판이면 옛 판 그대로, 0이 아닌 종료 | 서버에서 지금 이미지로 망가진 태그 셋을 만듦(밖에서 받는 것 없음) ① 바로 꺼짐: `printf 'FROM chaekcheck/backend:V+1\nENTRYPOINT ["java","-jar","/app/missing.jar"]\n' \| docker build -t chaekcheck/backend:0.0.901 -` ② 안 뜸: `ENTRYPOINT ["sleep","600"]` → `0.0.902` ③ 판 번호 다름: `docker tag chaekcheck/backend:V+1 chaekcheck/backend:0.0.903`. 감시 도구를 켜고 `release.sh --switch-only 0.0.90N backend` 셋 → 각각 exit 1(`echo $?`), 이유 `exited`(또는 `restarted`)·`timeout`(60초쯤)·`version-mismatch`, 로그 마지막 줄 출력, 감시 실패 0건·판 번호 그대로, `ACTIVE_SLOT` 그대로. 끝나면 세 태그를 `docker rmi` | 6, 9 |
| AC-4 되돌리기도 AC-1과 같음 | 감시 도구를 켜고 `release.sh --switch-only V`(backend web) → 판 번호 V+1 → V 한 번, 실패 0건, 화면 조각도 앞 판으로. 다시 `--switch-only V+1` | 6, 9 |
| AC-5 web만 배포 | 감시 도구를 켜고 `release.sh <판> web`(리허설은 실제 빌드, 운영은 `--switch-only V web` ↔ `V+1 web`) → 실패 0건, 조각 이름이 한 번 바뀜, `/api/v1/version`은 그대로. 전후 `docker inspect -f '{{.State.StartedAt}}' chaekcheck-web-1`이 같음(nginx 컨테이너를 다시 만들지 않음). 바뀌기 전 판의 조각 하나를 바뀐 뒤 불러도 200(앞 판 조각을 함께 둠) | 6, 9 |
| AC-6 백엔드 하나, 옛 판 정상 종료 | 배포 뒤 `docker ps --filter name=chaekcheck-backend --format '{{.Names}} {{.Status}}'`에 한 줄. `docker ps -a`의 옛 자리는 `Exited (143)`(137이 아님). `docker logs --tail 30 chaekcheck-backend-<옛 자리>-1`에 0단계 2(c)에서 확인한 정상 종료 문구 | 6, 9 |
| AC-7 이용 기록 안 빠짐 | 배포 중 1초마다 표지 검색어(`zdd27-<번호>`)로 검색 요청 하나(웹 검색 화면이 보내는 것과 같은 요청, `usagelog.search_event` 한 줄이 되는 것. dev가 골라 적음)를 보내고 200 받은 수를 셈. 배포 뒤 `SELECT count(*) FROM usagelog.search_event WHERE title LIKE 'zdd27-%' AND received_at > <시작 시각>` = 200 받은 수. 특히 전환 직전 5초의 번호가 다 있는지 봄. 끝나면 그 줄을 지울지 사용자에게 물음 | 6, 9 |
| AC-8 새벽 거절 | PC: `CHAEKCHECK_CLOCK_HHMM=0400 deploy/prod/bin/release.sh 9.9.9` → 아무것도 바뀌지 않고(git 상태·태그 그대로) 이유 한 줄, exit 1. 경계 `0324`(통과해 다음 검사로), `0325`, `0510`(거절), `0511`(통과). 서버: `CHAEKCHECK_CLOCK_HHMM=0400 bin/switch.sh backend <지금 판>` → 거절, `slots.env`·컨테이너 그대로 | 5, 9 |
| AC-9 준비 확인 주소가 바깥에서 안 열림 | `curl -s -o /dev/null -w '%{http_code}' https://chaekcheck.com/actuator/health/readiness`, `/actuator/health`, `/actuator`, `/actuator/env`가 모두 404(nginx 응답, 본문에 Spring JSON 없음). 서버 안 `docker compose … exec -T web wget -qO- http://backend-<자리>:8080/actuator/health/readiness`는 UP | 2, 9 |

- 화면 확인: 화면 변경이 없으므로 Playwright는 가볍게만 봄. web 전환 뒤 `https://chaekcheck.com/` 데스크톱 폭에서 첫 화면이 뜨고 콘솔에 CSP·404 오류가 없음(`root` 경로가 바뀌었으므로)
- 실제 폰 확인: 폰 화면 변경 없음 → 해당 없음

## settings-index 줄 (dev `docs/maintenance/settings-index.md`)

plan 쪽 표(plan `docs/settings-index.md` "사이클 27")는 이미 있습니다. dev는 실제 키·자리를 `# 사이클 27`에 보고합니다.

| 값 | 지금 값 | 어디 | 환경 변수 | 함께 바꿀 곳 | 정한 문서 |
|---|---|---|---|---|---|
| 정상 종료 | `graceful` | `server.shutdown` | `SERVER_SHUTDOWN` | — | 설계 결정, ADR-0167 |
| 정상 종료 최대 대기 | 40s | `spring.lifecycle.timeout-per-shutdown-phase` | `SPRING_LIFECYCLE_TIMEOUTPERSHUTDOWNPHASE` | 가장 긴 스트림 35초, compose `stop_grace_period` 60s보다 짧게 | 명세 결정 #2 |
| Actuator 노출 | `health`만, probes 켬 | `management.endpoints.web.exposure.include`, `management.endpoint.health.probes.enabled` | — | nginx `/actuator/` 404 | ADR-0169 |
| (5절) Docker 기다림 | 60s | `P/compose.yaml` `x-backend.stop_grace_period` | — | 위 40s | 명세 결정 #2 |
| (5절) 준비 기다림·간격 | 60s / 1s | `P/bin/switch.sh` | — | 실측 시작 19.4초 | 명세 결정 #3 |
| (5절) reload 뒤 기다림 | 2s | `P/bin/switch.sh` | — | AC-1 결과 | 설계 결정 #5 |
| (5절) 새벽 거절 | 03:25~05:10 Asia/Seoul | `P/bin/release.sh`, `P/bin/switch.sh` | `CHAEKCHECK_CLOCK_HHMM`(시험용) | `auth.cleanup` 04:00, `usagelog.cleanup` 04:30, `foryou.build` 03:30, `picks.fetch` 05:00 시각을 바꾸면 함께 | ADR-0171 |
| (5절) 화면 판 폴더 | 두 판 | `S/web/releases`, `switch.sh web` | — | 이미지 정리(이번 판·앞 판) | ADR-0168 |
| (5절) nginx 기본 이미지 | `nginx:<판>-alpine` 고정 | `P/compose.yaml` `web`, `P/web.Dockerfile` | — | 판 올리기는 점검 배포 | ADR-0168 |
| (5절) upstream keepalive | 16 | 서버 `active-backend.conf`(스크립트가 씀) | — | 옛 `ec2-tunnel.conf` 값 그대로 | — |

## 완료 기준

- [ ] AC-1~AC-9를 리허설(6단계)과 운영(9단계)에서 확인하고 AC 확인표를 `# 사이클 27` 절에 적음
- [ ] `./gradlew build` 통과, `ModularityTests`(`ApplicationModules.verify()`)·`DocumentationTests` 통과
- [ ] 0단계 확인 1~6의 결과를 적었고, 기대와 다른 것은 plan에 알렸음
- [ ] 처음 한 번 옮기기를 운영에서 했고 끊긴 시간을 적었음
- [ ] ADR-0170 체크리스트를 이 사이클에 채웠음(해당 없음)
- [ ] `P/README.md`, `N/README.md`, `docs/maintenance/3-import.md`·`6-aisearch.md`, dev `settings-index.md`를 고쳤음
- [ ] 화면 변경 없음(실제 폰 확인 항목 없음)
- [ ] [확인 필요] 각 항목의 결과, 설계와 달라진 점, 새로 알게 된 제약을 `# 사이클 27` 절에 적음

## [확인 필요] 항목

| # | 항목 | 누가·어떻게 | 막는 단계 |
|---|---|---|---|
| 1 | Boot 4.1.1에서 쿠버네티스 밖 probes가 열리는지 | dev 0단계 1 | 1 |
| 2 | 정상 종료 때 `REFUSING_TRAFFIC`, 열린 SSE를 기다리는지, 로그 문구 | dev 0단계 2 | 1, AC-2·6 |
| 3 | nginx reload가 새 이름·새 IP를 잡는지, 폴더 mount | dev 0단계 4 | 2, 3 |
| 4 | reload 뒤 2초로 AC-1 실패 0건인지 | AC-1 감시 | 9 |
| 5 | 겹칠 때 새 판 시작 시간(2코어 나눔)과 메모리 | `switch.sh` `ready=`, `free -m` | 없음(60초 안이면 됨) |
| 6 | 가입 중 세션이 정상 종료 때 끝남 처리되는지 | dev 0단계 2(f) | 없음(지금 재시작과 같은 성질) |
| 7 | Spring 정상 종료 기본 30초·Docker 기본 10초 원문 | 명시 값으로 덮어써 막지 않음 | 없음 |
| 8 | Git Bash `TZ=Asia/Seoul` | dev 0단계 5 | 5 |
| 9 | 서버의 지금 nginx 판(고정할 태그) | dev 0단계 3 | 3 |

## 이번에 하지 않는 것

- 서버 두 대와 로드밸런서, 쿠버네티스, GitHub Actions 자동 배포 (scope 제외)
- db·cloudflared·nginx 기본 이미지 판 올리기의 무중단(점검 배포로 둠)
- 서버마다 갖는 상태를 같이 쓰기(Redis 등), 정해진 일 잠금(ShedLock 등) (ADR-0171)
- "업데이트 중" 안내, 자동 다시 시도, 카나리아, 배포 결과 메일·메신저 알림 (spec 비목표)
- 운영에서도 `contexts: test-data`가 도는 문제(`application.yml` 14행, backlog)
- plan `docs/current/` 고치기(plan이 함)

## 개발 후 plan 쪽에 알려줄 것

dev `docs/plan-feedback.md`의 새 **`# 사이클 27`** 절에 적습니다.

- 시작 상태: worktree, 브랜치, docker 프로젝트, 시작 커밋과 판, 23·24 브랜치의 `deploy/prod` 변경
- 0단계 결과 1~6(나오는 대로)
- 정한 값: nginx 고정 태그, 결과 줄 모양, 로그 줄 수, 서버 하위 폴더 배치(`nginx/conf.d`·`nginx/chaekcheck`·`incoming`), 시험용 시계 변수 이름, 테스트 클래스 이름, 새벽 끝 경계
- 리허설과 운영 측정값: 처음 옮기기 끊긴 시간, 전환마다 `ready=`초, 겹칠 때 `free -m`·스왑, 옛 자리 정상 종료에 걸린 시간, AC-1 감시 실패 수(2초 기다림이 충분했는지)
- 설계와 달라진 점(예: 처음 옮기기를 스크립트로 했는지 손으로 했는지, `--force-recreate`, 실패 때 `slots.env` 되돌리기, nginx 설정 받는 방식, 서비스 순서)과 그 이유(사용자 발언 그대로)
- 새로 알게 된 제약(재부팅 때 nginx 이름 풀이, compose 판 버릇, 23·24와 합칠 때 생긴 일), AC 확인표
