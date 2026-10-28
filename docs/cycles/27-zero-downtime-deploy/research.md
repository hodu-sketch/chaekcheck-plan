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
