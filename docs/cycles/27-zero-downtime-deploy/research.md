# 사이클 27 조사

## 1. 공식 문서로 확인한 것 (확인 2026-10-29)

| 무엇 | 확인한 내용 | 출처 |
|---|---|---|
| Spring Boot 정상 종료 | Tomcat·Jetty·Reactor Netty에서 **기본으로 켜져 있음**. 정상 종료가 시작되면 새 요청은 네트워크 단계에서 받지 않고, 처리 중인 요청은 끝까지 처리함. 끄려면 `server.shutdown=immediate`. 기다리는 최대 시간은 `spring.lifecycle.timeout-per-shutdown-phase`(문서 예시 `20s`). **기본값은 문서에서 확인 못 함** [확인 필요] | https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html (문서 판 4.1.2, dev는 4.1.1) |
| Spring Boot 준비 확인 | `/actuator/health/liveness`·`/readiness` 묶음과 끄는 설정 `management.endpoint.health.probes.enabled`. 쿠버네티스 밖에서 기본으로 열리는지, 정상 종료 때 준비 상태가 `REFUSING_TRAFFIC`로 바뀌는지는 원문을 끝까지 읽지 못해 **확인 못 함** [확인 필요: 프로토타입] | https://docs.spring.io/spring-boot/reference/actuator/endpoints.html |
| nginx 설정 다시 읽기(reload) | 새 일꾼 프로세스를 띄우고, 옛 일꾼은 받던 연결을 끝까지 처리한 뒤 끝남 ("Old worker processes close listen sockets and continue to service old clients") | https://nginx.org/en/docs/control.html |
| nginx `worker_shutdown_timeout` | 옛 일꾼이 기다리는 최대 시간. **기본값 없음**(무한정 기다림). 1.11.11부터 | https://nginx.org/en/docs/ngx_core_module.html#worker_shutdown_timeout |

## 2. 못 한 것

- 운영 서버 메모리·스왑·백엔드 시작 시간: 이 작업 공간의 보호 규칙(`.claude/hooks/guard.mjs`)이 dev 폴더의 SSH 키 경로가 들어간 셸 명령을 막음 (2026-10-29). 우회하지 않음 → 사용자 또는 dev 세션이 서버에서 `free -m`, `swapon --show`, `docker stats --no-stream`, `docker logs chaekcheck-backend-1 2>&1 | grep "Started"` [확인 필요]

## 3. 공식 문서로 더 확인한 것 (확인 2026-10-29)

| 무엇 | 확인한 내용 | 출처 | 태그 |
|---|---|---|---|
| 정상 종료 최대 대기 기본값 | `spring.lifecycle.timeout-per-shutdown-phase` 기본 30초. 속성 표 원문 줄을 직접 읽지 못하고 요약으로만 확인 | https://docs.spring.io/spring-boot/appendix/application-properties/index.html | [확인 필요: 공식 문서 원문 다시 확인] |
| 준비 상태 바뀌는 때 | 시작 때 runner들이 끝나면 `ACCEPTING_TRAFFIC`, 정상 종료가 시작되면 `REFUSING_TRAFFIC` (요약으로 확인) | https://docs.spring.io/spring-boot/reference/actuator/endpoints.html , https://docs.spring.io/spring-boot/reference/features/spring-application.html | [확인 필요: 프로토타입] |
| 준비 확인 주소가 쿠버네티스 밖에서 기본으로 열리나 | 문서에 직접 답 없음. 끄는 설정(`management.endpoint.health.probes.enabled`)만 나옴 → 켜는 설정을 명시하면 됨 | 위 같은 주소 | [확인 필요: 프로토타입] |
| Docker가 컨테이너를 기다리는 시간 | `stop_grace_period` 기본 10초, 지나면 SIGKILL (요약으로 확인) | https://docs.docker.com/reference/compose-file/services/ | [확인 필요: 공식 문서 원문 다시 확인] |
| compose `healthcheck` | Dockerfile `HEALTHCHECK`와 같은 방식·기본값. `depends_on`의 `condition: service_healthy`로 건강해질 때까지 기다릴 수 있음 | https://docs.docker.com/reference/compose-file/services/ | [확정] |
| cloudflared → nginx 연결 | 쉬는 연결 최대 100개(`keepAliveConnections`), 쉬는 연결은 1분 30초 뒤 버림(`keepAliveTimeout`), 새 연결 30초(`connectTimeout`). nginx 컨테이너를 다시 만들지 않으면 같은 주소로 이어짐 | https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/cloudflared-parameters/origin-parameters/ (2026-04-17 갱신) | [확정] |
| nginx upstream 이름 풀이 | `resolve` 매개변수 없이 쓰면 이름의 IP를 설정 읽을 때만 찾는다고 문서가 직접 말하지는 않음. `resolve`가 "다시 시작 없이 IP 바뀜을 따라간다"는 설명에서 미루어 앎 | https://nginx.org/en/docs/http/ngx_http_upstream_module.html | [확인 필요: 프로토타입] |

## 4. dev 코드에서 확인한 것 (dev main, 2026-10-29 읽기만)

백엔드 둘이 잠깐 같이 돌거나 옛 판을 내릴 때 문제 되는 곳. 경로는 dev `backend/src/main/java/.../` 아래.

### 4-1. 지금 그대로면 무중단을 막는 것

| 무엇 | 지금 | 근거 |
|---|---|---|
| 포트·이름 | 백엔드가 서버 포트 `127.0.0.1:8080`을 직접 잡고, 별칭 `backend-host` 하나. 두 번째 백엔드는 같은 포트를 못 잡고, 둘 다 같은 별칭이면 nginx가 reload 때 둘에 나눠 보냄 | dev `deploy/prod/compose.yaml` 118-124행, `deploy/nginx/ec2-tunnel.conf` 10-14행(`upstream { server backend-host:8080; keepalive 16; }`, `resolver` 없음) |
| 기다리는 시간 | Docker 기본 10초가 Spring 기본 30초보다 짧아, 10초 뒤 강제 종료. 대출 조회 스트림은 최대 35초, AI 스트림은 최대 30초라 잘림. 이용 기록 마지막 저장(`UsageLogFlusher`)과 AI 거절 수 저장(`DailyBudget` `@PreDestroy`)도 빠질 수 있음 | compose에 `stop_grace_period` 없음, `application.yml`에 `server.shutdown`·`spring.lifecycle` 없음, `EbookSearchStreamController.java:43,107-108`(`streamDuration`+5초), `AiSearchController.java:72,177-178` |
| 준비 확인 주소 | Actuator가 의존성에 없음, `management.*` 설정 없음. 백엔드에 compose `healthcheck` 없음. `release.sh`는 건강 확인 없이 끝내고 "curl …/api/v1/version" 안내만 출력 | dev `backend/build.gradle` 41-72행, `deploy/prod/compose.yaml` 43-47행(db만), `release.sh` 84-98행 |
| 메모리 | 백엔드마다 `-Xmx640m`, `mem_limit` 없음. 백엔드 하나 실측 약 648MB. 2GB 서버에 둘 + PostgreSQL + nginx | dev `compose.yaml` 61-62행, dev `docs/aisearch/2-versions.md` 265행 |

### 4-2. 둘이 겹치는 동안 달라지는 것 (서버마다 메모리에 따로 있음)

| 무엇 | 겹칠 때 / 새 판이 뜰 때 | 지금(재시작 배포)과 비교 | 근거 |
|---|---|---|---|
| Webshare 길·도서관마다 "한 번에 1개, 1초 간격" | 옛 판이 아직 처리하는 요청이 있으면 잠깐 2개까지 | 지금은 없음 (하나만 돎). 겹침은 옛 판이 받던 요청이 끝날 때까지(최대 약 35초) | `InMemoryLaneThrottle.java:30,120`, `application.yml` 137-138행 |
| 막힌 길 쉬게 하기 | 새 판은 모름 → 길마다 다시 5번 실패해야 쉼 | 지금 재시작과 같음 | `InMemoryBlockedLanes.java:11-24`, `application.yml` 158-174행 |
| AI 검색 IP별 한도(분 10·하루 100) | 새 판은 0부터 셈 | 지금 재시작과 같음 | `InMemoryAiSearchQuota.java:18-30` |
| AI 하루 예산 | DB에 있어 문제 없음 | 같음 | `DailyBudget.java:74-81,125-156` |
| 검색·상세 결과 캐시 | 새 판은 빈 캐시 → 전환 직후 도서관 요청이 조금 늘어남 | 지금 재시작과 같음 | `CaffeineSearchPageCache.java:29`, `CaffeineDetailVerdictCache.java:21` |
| 카카오 로그인·가입 진행 중 상태(HTTP 세션, 10분) | 전환 순간 로그인 중이던 사람은 실패 화면 → 다시 로그인 | 지금 재시작과 같음 | `application.yml` 38-48행, `LoginAuthorizationRequestRepository.java:44-71`, `LoginFailureHandler.java:47-52` |
| 가입 중 포기한 사람 카카오 연결 끊기 | 정상 종료 때 세션이 "끝남" 처리되어 끊기는지 모름 | — | `AbandonedSignupListener.java:12-33` [확인 필요: 프로토타입] |
| AI 이어 묻기 | 브라우저가 앞 대화를 매번 보냄 → 새 판에서도 이어짐 | 문제 없음 | `AiSearchRequest.java:9-17`, `AiSearchController.java:153-176` |
| 운영 표본(`lookup_sample`) | 10초마다 둘이 각각 한 줄씩(통계가 잠깐 반씩 나뉨) | 지금은 없음 | `OpsSampler.java:116-129`, `JdbcOpsSampleStore.java:22-34` |
| 새벽 정해진 일 | 03:30 추천 만들기(운영에선 꺼짐), 04:00 토큰·계정 정리, 04:30 이용 기록 정리, 05:00 추천 가져오기(꺼짐). 그 시각에 둘이 돌면 같은 일을 두 번 (계정 정리는 카카오 호출이 두 배). 잠금(ShedLock 등) 없음 | 지금은 없음 | `DailyAccountCleanup.java:65`, `UsageLogCleanup.java:60`, `RefreshTokenCleanup.java:28`, `BuildScheduler.java:36` |
| 시작 때 하는 일 | 추천 만들기(운영에선 꺼짐)를 켜면 새 판이 옛 판의 "만드는 중"을 실패로 바꿈 | 지금은 없음 | `BuildScheduler.java:30-34`, `ForYouStore.java:33-40` |
| 못 끝낸 이벤트 다시 보내기 | 새 판이 시작 때 옛 판이 처리 중인 `AccountDeleted`를 다시 보낼 수 있음. 받는 쪽이 두 번 받아도 되는지 확인 필요 | — | `application.yml` 28-31행(`republish-outstanding-events-on-restart: true`) [확인 필요: dev 코드 읽기] |

### 4-3. DB 변경(Liquibase)

- 새 판이 **시작할 때** Liquibase를 돌림. 옛 판은 이미 떠 있어 바뀐 표 구조를 다시 검사하지 않음(`ddl-auto: validate`는 시작 때만) → 옛 판이 새 구조에서 계속 돌아야 함 (범위 4번 규칙과 같음)
- `runOnChange:true`로 함수·트리거 본문을 바꾸는 변경이 있음 → 옛 판도 즉시 새 함수를 씀. 이것도 "둘 다 돌아도 되는 변경"이어야 함
- (범위 밖) 운영에서도 `contexts: test-data`가 돌고 있음 → backlog

### 4-4. 시작이 무거운 곳

- 생성자에서 `book-vectors.bin`(80MB) 전체, `first-call-model.bin`(25MB), `follow-up-model.bin`(8MB), `catalog.book_profile` 약 7만 7천 줄을 읽음 → 웹 서버가 뜨기 전. 실패해도 경고만 하고 뜸
- 실제 시작 시간 기록은 문서에 없음 → 5절에서 실측

## 5. 운영 서버 측정 (2026-10-29, dev 27 세션, 원본 `server-measure.md`)

- 2절의 "못 한 것"은 이것으로 풀림 [확정] (실측, v1.21.3 운영 중)
- 전체 메모리 1,834MB, 사용 가능 467MB. 스왑 **이미 2GB 있음**(`/swapfile`, 250MB 사용 중, swappiness 10). CPU 2코어. 디스크 여유 11GB
- 컨테이너 메모리: backend 712.8MB, db 279.8MB, cloudflared 23MB, web 5MB (합 약 1,021MB)
- 백엔드가 둘 겹치면 약 713MB가 더 필요 → 사용 가능 467MB보다 약 250MB 모자람 → 그만큼 스왑(남은 약 1.8GB)으로 감. 명세 규칙 8의 "스왑 파일을 둠"은 이미 되어 있어 새로 할 일 없음
- 백엔드 시작 19.4초(프로세스 20.6초, 벡터 적재 0.4초). 겹칠 때는 CPU 2코어를 나눠 써서 더 걸릴 수 있음 [확인 필요: AC-1 감시 때 기록]
