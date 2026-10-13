# 설계 제안: 17-first-deploy (배포 부분, scope 포함 1~9)

- architect 서브에이전트 제안 (2026-10-13). 이미 정한 것(spec R1~R12, flow F1~F5)은 다시 제안하지 않음. ADR-0095(포함 10)는 다루지 않고 조회는 `FETCH_MODE=direct`
- 결정 페이지: `easy/2026-10-13-design-decisions.html`
- 사용자 결정 (2026-10-13, 페이지 칩 번호): #1 네트워크 edge·app 둘, 10.x 범위 승인 / #4 지표 별도 포트(결정 3 A) 승인 / #5 429는 접속 기록 exporter(결정 4 A) 승인 / #7 백업은 수집 책 목록 빼고(결정 6 범위 B) 승인 / #9 조회 서버 넣어 두되 꺼 둠(결정 7 A) 승인 / #10 이미지는 PC에서 만들어 SSH로(결정 8 A) 승인. #6 cAdvisor(결정 5 A) 승인. #8 백업 가져오기: Cloudflare Tunnel로 SSH(서버 22번 닫음, PC에서 cloudflared 거쳐 받음) [확정] (사용자: "이거로", 2026-10-13, 제안 "작업 스케줄러 + 집 IP만 허용 SSH" 미승인. 이유: 사용자 "집 아이피 바뀔 수 있는데? 이거 고정 아니야"). 방법·무료 범위 [확인 필요: 공식 문서]. #2 비밀 값: 띄우기 스크립트(결정 1 A) 승인. #3 포기 횟수(결정 2)는 남음

## 현재 상태 (dev 확인, 2026-10-13)

- `deploy/nginx/`: `chaekcheck.conf`(443 인증서 예시), `tunnel-test.conf`(사설 주소 전체를 믿음), `rate-limits.conf`(도서관 호출 zone 30r/m만), `chaekcheck-locations.conf`. 운영 compose·모니터링 compose·백업 스크립트 없음
- `compose.yaml`: 로컬 개발용 `db`·`db-ops`·`db-test`만, backend·nginx 컨테이너 없음
- backend에 Actuator·Micrometer 의존성 없음 (`build.gradle`)
- `application.yml`: `spring.datasource.url`이 `localhost` 고정, `liquibase.contexts: test-data`(운영 프로필에서 빼야 한다는 TODO), `availability.user-agent` TODO
- `SecurityConfiguration.java:74`: `PROTECTED`만 인증, 나머지 `permitAll` → `/actuator/*`를 8080에 열면 backend에 닿는 누구나 봄
- `InMemoryHostThrottle` 포기 경로 둘: (1) 빈 자리를 못 받음(`acquire`, `log.info("throttle timeout ...")` 있음), (2) 자리는 받았지만 간격 뒤가 마감을 넘음(49행, 로그 없음) → 로그만 세면 (2)가 빠짐
- 모듈·표·REST: 바뀌는 것 없음. `availability` 안쪽(`internal/fetch`, `internal/config`)만

## 결정 1: 비밀 값이 컨테이너에 닿는 방법

비밀 값은 backend만 쓰지 않음(`DB_PASSWORD`는 db, 터널 토큰은 cloudflared, Grafana 관리자 비밀번호는 grafana).

- **A안 (추천) [안]**: 새 `deploy/prod/bin/up.sh`가 `aws ssm get-parameters-by-path --path /chaekcheck/prod/ --with-decryption --recursive` → 이름 끝을 환경 변수 이름으로 바꿔 `chmod 600` env 파일 → `docker compose --env-file … up -d`. 비밀이 아닌 설정은 git의 `prod.env`. 코드 변경 없음. 모든 컨테이너에 같은 방식, 재부팅 뒤 Docker가 스스로 다시 띄움. 단점: 값이 `docker inspect`에 남음(root만, 같은 서버에 접근 키가 이미 있어 늘어나는 위험 작음), 값을 바꾸면 스크립트를 다시 돌림
- B안: 스크립트가 tmpfs에 값마다 파일, compose `secrets:`(postgres `POSTGRES_PASSWORD_FILE`, Grafana `GF_…__FILE`, Spring `configtree`). `inspect`에 안 보임. 단점: 재부팅 때 Docker보다 먼저 스크립트를 돌리는 systemd 단위 필요, cloudflared가 토큰 파일을 받는지 확인 못 함, 고칠 곳이 많음
- C안: Spring Cloud AWS `spring.config.import=aws-parameterstore:`. backend만 해결되어 방식이 둘이 됨, 호환표에 Boot 4.0.x까지만(https://github.com/awspring/spring-cloud-aws, 확인 2026-10-13), 접근 키가 컨테이너 안으로

## 결정 2: 도서관 호출 포기 횟수를 지표로

- **A안 (추천) [안]**: `InMemoryHostThrottle`에 포기를 알리는 콜백을 넣어 (1)·(2) 두 곳에서 Micrometer 카운터를 올림. 이름 `chaekcheck.availability.throttle.timeouts`(Prometheus `chaekcheck_availability_throttle_timeouts_total`), 태그 `wait=slot|interval`, 호스트 태그 없음. 경로 (2)에도 `log.info`. `HostThrottleTests`에 검사 더함. Modulith 경계 그대로
- B안: 로그에서 세기(Loki·mtail 등). 코드 변경은 없지만 (2)는 로그가 없어 어차피 고쳐야 하고 컨테이너가 늘어남

## 결정 3: `/actuator/prometheus`를 바깥에 열지 않는 방법

- **A안 (추천) [안]**: 관리 포트 분리 `management.server.port: 8081`, `management.endpoints.web.exposure.include: health,prometheus`, backend `ports:` 없음, Prometheus만 `backend:8081`을 읽음. nginx 규칙을 실수로 넓혀도 지표가 안 나감 (https://docs.spring.io/spring-boot/reference/actuator/monitoring.html, 확인 2026-10-13). 별도 포트에 Spring Security가 어떻게 걸리는지 확인 필요
- B안: 같은 8080, nginx에 `location ^~ /actuator/ { return 404; }`. 보호가 nginx 규칙 하나에 달림, 같은 compose 네트워크에서는 누구나 봄

## 결정 4: Grafana "오류 수(429·5xx)"를 어디서 셀지

한도로 나는 429는 nginx가 직접 돌려주어 Spring에 닿지 않음 → Actuator `http.server.requests`에는 0.

- **A안 (추천) [안]**: nginx 접속 기록을 읽는 exporter 컨테이너(예: `prometheus-nginxlog-exporter`). 상태 코드별 횟수와 nginx 기준 응답 시간. 관리 상태·라이선스·최신 판 확인 못 함
- B안: 429는 Grafana 밖, Cloudflare 무료 분석에서. flow F5 "429 포함"과 어긋남, 무료 분석 수준 확인 못 함
- C안: `stub_status` + `nginx-prometheus-exporter`. 연결 수만 있고 상태 코드별 횟수가 없어 맞지 않음

## 결정 5: 컨테이너 메모리 모으기

- **A안 (추천) [안]**: cAdvisor(`--docker_only`, `--enable_metrics=cpu,memory`, housekeeping 늘림, `mem_limit`). 모든 컨테이너 메모리 → spec R8 재기에 그대로. cAdvisor 자신의 사용량 확인 못 함, 높은 권한 마운트 (https://github.com/google/cadvisor/blob/master/docs/runtime_options.md, 확인 2026-10-13)
- B안: node_exporter textfile collector + 1분 타이머 스크립트(`docker stats`/cgroup). 가볍지만 직접 짜는 스크립트

## 결정 6: 백업 범위와 내 PC가 가져오는 방법

- 범위 **B안 (추천) [안]**: `pg_dump -Fc -N catalog -N catalog_next`. 수집 목록은 PC의 반영 파일이 원본(ADR-0078)이므로 PC에 마지막 반영 파일을 남겨 두는 운영 규칙. 덤프에 `auth`·`mylibrary`·`library`·`region`·`collection`·`picks`·`modulith`·`databasechangelog`·15 `usagelog`·16 `sitecontent`. 복원은 두 단계(덤프 → 반영 `apply`). A안: DB 전체(약 8.5GiB, GB 단위 덤프, 복원 때 pg_bigm 색인 다시 만듦)
- 가져오기 **A안 (추천) [안]**: Windows 작업 스케줄러 + OpenSSH `scp`(또는 WSL `rsync`), 백업 전용 리눅스 사용자·키(백업 폴더 읽기만), "놓친 예약은 빨리 실행", 7개 넘는 것 지우는 PowerShell을 dev `deploy/backup/`에. 집 IP가 바뀌면 방화벽을 고칠 때까지 실패, PC가 이틀 넘게 꺼지면 그날 백업이 빠짐. B안: Cloudflare Access로 SSH(22번 닫음, 설정 많음). C안: Lightsail 버킷(요금 확인 못 함)
- 실행: 호스트 systemd 타이머 03:00 Asia/Seoul → `docker exec db pg_dump …` → `.part` 뒤 이름 바꿈 → 2개 넘는 것 지움. 사이클 11 운영 `apply` 중에는 건너뜀 [안]

## 결정 7: 조회 서버(`fetch-service`)를 띄울지

- **A안 (추천) [안]**: compose에 넣되 `profiles: [fetch]`로 꺼 둠(direct 모드라 쓰이지 않음). scope 포함 1의 글과 다르므로 확인 필요
- B안: 늘 띄움(쓰이지 않는 JVM이 메모리를 씀)

## 결정 8: 이미지를 서버로 옮기는 방법

- **A안 (추천) [안]**: PC에서 `docker build` → `docker save | ssh … docker load`. 레지스트리 없음, web 빌드는 nginx 이미지에. 서버 CPU가 x86이어야 함(`lscpu` 확인 필요)
- B안: GHCR 비공개 저장소(토큰 하나 늘어남). C안: 서버에서 빌드(4GB에서 Gradle·npm이 운영과 메모리를 다툼)

## 네트워크와 접속 기록 (spec 값 보정)

- 네트워크 둘 [안]: `edge`(cloudflared·nginx·grafana, 고정 subnet), `app`(backend·db·prometheus·node_exporter·cadvisor·nginxlog-exporter, internal). nginx는 둘 다에. `set_real_ip_from`은 `edge` subnet 하나. 어떤 컨테이너에도 `ports:` 없음
- subnet은 `10.x`에서 [안] (예 `10.250.0.0/24`): spec 예시 `172.30.0.0/24`는 Docker 기본 주소 풀(172.17~31) 안이라 다른 compose 네트워크와 겹칠 수 있음. Lightsail 사설망 대역(172.26.0.0/16으로 알려짐)은 확인 필요
- 접속 기록 경로: spec R11 "`$uri`"는 `try_files /index.html`을 거친 화면 주소(`/search` 등)가 `/index.html`로 바뀌어 남을 것으로 봄 → `map $request_uri $path_only { ~^(?<p>[^?]*) $p; }`로 `?` 앞만 남기는 안 [안], 프로토타입으로 확인
- `log_format`: `$remote_addr`, 시각, 메서드, 경로, `$status`, `$body_bytes_sent`, `$request_time`. 호스트 볼륨 + 호스트 `logrotate` `daily`, `rotate 14`, `maxage 14`, 끝나면 `nginx -s reopen`
- 일반 `/api/` 한도: `limit_req_zone $binary_remote_addr zone=chaekcheck_api:10m rate=5r/s;`, `location /api/`에 `limit_req zone=chaekcheck_api burst=30 nodelay; limit_req_status 429;`, 429 본문은 지금과 같은 Problem Details, `Retry-After: 1` [안]. 15의 `location = /api/v1/library-clicks`는 정확 일치라 `/api/`보다 먼저 이겨 겹치지 않음

## 바뀌는 파일 (추천안 기준)

- `availability` 안쪽: `InMemoryHostThrottle.java`(콜백, 경로 (2) 로그), 새 안쪽 타입 하나, `AvailabilityConfiguration.java`(`MeterRegistry`), `HostThrottleTests`, `availability.user-agent` 값(`chaekcheck/<version> (+https://chaekcheck.com; <contact>)`, 연락처 확인 필요)
- `backend/build.gradle`: `spring-boot-starter-actuator`, `micrometer-registry-prometheus` (Boot 4 좌표 확인 필요)
- 운영 프로필 `application-prod.yml` [안 이름]: `spring.datasource.url: jdbc:postgresql://db:5432/${DB_NAME}`, contexts에서 test-data 뺌, `management.*`, 15 기록 스위치 꺼짐
- 배포 파일(새 파일, 이름 [안]): `deploy/prod/compose.yaml`, `deploy/prod/prod.env`, `deploy/prod/bin/up.sh`, `deploy/prod/nginx/prod.conf`, `deploy/monitoring/`(prometheus.yml, Grafana 프로비저닝, `GF_AUTH_ANONYMOUS_ENABLED=false`, `GF_SERVER_ROOT_URL=https://grafana.chaekcheck.com`), `deploy/backup/`, logrotate, backend·nginx `Dockerfile`
- 표·schema·Liquibase·제품 REST 변경 없음 [안]. 운영 전용 관리 포트 `GET :8081/actuator/prometheus`, `:8081/actuator/health`(바깥 없음)

## 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 접속 기록 경로 `$uri` vs `$request_uri` 자르기 | 프로토타입(nginx 컨테이너에서 `/search?q=x` 요청 뒤 기록 확인) |
| Spring Boot 4.1 Actuator·Prometheus 의존성 좌표 | 공식 문서 확인 |
| 별도 관리 포트에 Spring Security 필터가 걸리는지 | 프로토타입(dev에서 8081 요청) |
| `prometheus-nginxlog-exporter` 관리 상태·판·라이선스·라벨 | 공식 GitHub 확인 |
| cAdvisor 메모리·CPU 사용량 | 서버에서 측정 |
| 덤프 크기·시간(전체 vs 수집 목록 뺌) | 프로토타입(`pg_dump -Fc` 두 방식) |
| systemd `OnCalendar`에 `Asia/Seoul` | 서버에서 `systemd-analyze calendar` |
| Lightsail 사설망 대역과 compose subnet | 서버에서 `ip addr`, `docker network inspect` |
| 터널 토큰·Grafana 비밀번호·`AUTH_JWT_SECRET`·`KAKAO_ADMIN_KEY`도 SSM에 넣는지, SSM 이름 → 환경 변수 이름 규칙 | 사용자에게 질문 |
| User-Agent 연락처(`chaekcheck9104@gmail.com`) | 사용자에게 질문 |
| 사이클 11 운영 `apply` 때 db에 닿는 방법(SSH 터널) | dev `docs/maintenance/3-import.md` |
| 집 IP가 바뀌는지 | 사용자에게 질문 |
| 컨테이너별 `mem_limit` 합이 4GB 안인지 | 서버에서 측정 |

## backlog 후보

- Lightsail 자동 스냅샷을 백업과 함께 쓰기, 백업 실패·디스크 부족 알림, Prometheus 보관 기간 조정, 비밀 값 교체 순서 문서
