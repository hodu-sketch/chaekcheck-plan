# 사이클 27: 무중단 배포

- 시작 2026-10-29, 세션 `chaekcheck-plan-cycle-27` (사용자: "이거 나 무중단 배포로 바꾸고 싶은데 어떻게 하면 좋지?" → 안 셋을 본 뒤 "27로 시작")
- 직전 사이클 회고: 26·24·23은 인계만 끝났고 dev가 아직 만들지 않았거나 만드는 중이라 회고는 각자 dev 뒤 (사이클 26 시작 때와 같은 방식). 이 사이클 시작 조건에서 생략
- 이 사이클은 화면 기능이 아니라 배포 방법을 바꾸는 일. 사이클 17(첫 배포)의 배포 파일을 고침

## 지금 상태 (dev main 2026-10-29, 파일에서 직접 확인) [확정]

| 무엇 | 지금 | 근거 |
|---|---|---|
| 배포 명령 | PC에서 `deploy/prod/bin/release.sh X.Y.Z [service …]` → 이미지 빌드(arm64) → 서버로 전송·`docker load` → 서버 `bin/up.sh` → `docker compose up -d` | dev `deploy/prod/bin/release.sh`, `deploy/prod/README.md` |
| 바꿔 끼우는 방식 | compose가 `backend`·`web` 컨테이너를 **멈추고 새로 만듦**. 새 백엔드가 다 뜰 때까지 nginx가 보낼 곳이 없어 Cloudflare 502 | dev `deploy/prod/compose.yaml` (서비스 하나씩, 이미지 태그만 바뀜) |
| 바깥 → 서버 | Cloudflare Tunnel(`cloudflared` 컨테이너) → `http://nginx:80`(`web` 컨테이너 별칭) → `backend-host:8080` | dev `deploy/nginx/ec2-tunnel.conf`, compose 별칭 |
| 정상 종료·준비 확인 | 백엔드 설정 파일에 `server.shutdown`·`spring.lifecycle.timeout-per-shutdown-phase`·준비 확인(readiness) 설정 없음. Spring Boot 4.1.1이라 정상 종료는 기본으로 켜져 있음(research.md 1절). 기다리는 최대 시간은 기본값을 공식 문서에서 확인 못 함 | dev `backend/build.gradle` 3행, `backend/src/main/resources` 검색 결과 없음 |
| 오래 열린 요청 | 대출 조회 스트림(SSE) 넷, AI 책 찾기 스트림(SSE) | dev `availability/internal/web/*StreamController.java`, `aisearch/internal/web/AiSearchController.java` |
| 백엔드 메모리 | 힙 `-Xmx640m`. AI 질문 벡터는 **임베딩 서버(원격)** 를 씀(`CHAEKCHECK_AISEARCH_VECTOR_ENCODER=remote`) → 모델 450MB는 백엔드 밖 | dev `deploy/prod/compose.yaml`, `deploy/prod/prod.env` |
| 되돌리기 | `compose.yaml` 이미지 줄을 앞 판으로 바꿔 `bin/up.sh backend web` (이때도 끊김) | dev `deploy/prod/README.md` "되돌리기" |
| 서버 | EC2 한 대(arm64, 시드니 `<서버 IP>`), compose 주석 기준 2GB | dev `deploy/prod/compose.yaml` 61행 주석 |

## 목표 (한 문장)

새 판을 배포하거나 앞 판으로 되돌리는 동안에도 사용자가 502 화면이나 끊긴 검색을 보지 않게 한다 [확정] (사용자 승인, 범위 결정 페이지 2026-10-29).

## 포함 [확정] (사용자 승인, 범위 결정 페이지 #1~#4, 2026-10-29)

1. 같은 서버에서 백엔드 두 자리(블루·그린)를 번갈아 쓰기: 새 판을 옆자리에 띄우고, 준비 확인이 통과하면 nginx가 바라보는 곳을 바꾸고(`nginx -s reload`), 옛 판은 정상 종료로 내림
2. 백엔드 정상 종료(기본으로 켜져 있음, 기다리는 최대 시간을 정함)와 준비 확인(`/actuator/health/readiness`)
3. 화면(web) 판 바꾸기도 nginx 컨테이너를 다시 만들지 않고 끊김 없이
4. 새 판이 준비 확인을 통과하지 못하면 전환하지 않고 옛 판을 그대로 둠
5. 되돌리기도 같은 전환으로
6. DB 변경(Liquibase) 규칙: 옛 판과 새 판이 잠깐 같이 돌아도 되는 변경만 무중단 배포로 (칸 지우기·이름 바꾸기는 두 번에 나눔). 지킬 수 없는 변경은 짧은 중단을 알리고 하는 길을 따로 둠
7. `release.sh`·`up.sh`·`deploy/prod/README.md` 절차를 새 방식으로 (지금 구조에서 새 구조로 처음 한 번 옮기는 점검 배포 절차 포함, 설계 결정 페이지 2026-10-29)

## 제외 (backlog.md로) [확정] (사용자 승인, 범위 결정 페이지 #5, 2026-10-29)

- 서버 두 대 + 로드밸런서, 쿠버네티스 (개인 서버 규모에 과함, 사용자가 묻기 전까지 안 함)
- GitHub Actions 같은 자동 배포 (지금처럼 PC에서 `release.sh`)
- `db`(PostgreSQL)·`cloudflared` 판 올리기의 무중단 (드물고, 짧은 중단 허용)

## 완료 기준 (사용자가 확인할 수 있는 것) [확정] (사용자 승인, 범위 결정 페이지 #6, 2026-10-29)

- 배포하는 동안 다른 창에서 1초마다 `https://chaekcheck.com/api/v1/version`과 첫 화면을 불러도 실패 0건, 버전 숫자가 옛 판 → 새 판으로 한 번 바뀜
- 배포 시작 전에 연 대출 조회 스트림과 AI 책 찾기 답이 배포 중에 끊기지 않고 끝까지 옴
- 일부러 뜨지 않는 판을 배포하면 사이트는 옛 판 그대로이고 `release.sh`가 실패를 알림
- 앞 판으로 되돌리기도 위 첫 줄과 같은 결과

## 먼저 조사할 것 [확인 필요]

| 항목 | 확인 방법 |
|---|---|
| 서버 실제 메모리·스왑, 지금 컨테이너별 메모리 | 서버에서 `free -m`, `docker stats --no-stream` (이 작업 공간 보호 규칙이 dev 폴더 키를 쓰는 셸 명령을 막아 2026-10-29 못 함 → 사용자에게 실행 부탁하거나 dev 세션) |
| 백엔드가 뜨는 데 걸리는 시간 | 서버 `docker logs`의 "Started … in N seconds" |
| 백엔드 둘이 잠깐 같이 돌 때 생기는 일: 메모리 안 상태(AI 검색 하루 예산 `DailyBudget`, 이용 기록 정리 `@Scheduled`, 시작 때 도는 일 `ApplicationReadyEvent`, 도서관·프록시 요청 간격 세기) | dev 코드 읽기 (`@Scheduled`, `ApplicationReadyEvent`, 메모리 맵) |
| AI 책 찾기 이어 묻기 대화가 서버 메모리에 있는지 (있으면 전환 때 이어 묻기가 끊김) | dev `aisearch` 코드 읽기 |
| 오래 열린 SSE를 nginx reload·정상 종료가 기다리는지, 기다리는 최대 시간 | nginx 공식 문서(`worker_shutdown_timeout`), Spring Boot 공식 문서(`spring.lifecycle.timeout-per-shutdown-phase`), 프로토타입 |
| Cloudflare Tunnel이 nginx reload 동안 연결을 유지하는지 | 공식 문서 + 프로토타입 |

## 슬라이스 선택 기록

- ICE 점수 없음. 사용자가 직접 고름: "이거 나 무중단 배포로 바꾸고 싶은데 어떻게 하면 좋지?" (2026-10-29). 이유 [이유 미확인]
- 대화에서 낸 안: A 같은 서버 블루·그린(추천) / B 서버 두 대 + 로드밸런서 / C 끊김은 두고 "업데이트 중" 화면·다시 시도만. 사용자가 "27로 시작"을 고름 → A안 기준으로 범위를 씀. 범위 결정 페이지(`easy/2026-10-29-scope-decisions.html`) 6개 모두 승인 (사용자, 2026-10-29) [확정]

## 영향 받을 곳 [안]

- 모듈: 없음 (도메인 모듈은 그대로). 백엔드 설정(정상 종료·준비 확인)과 메모리 안 상태를 쓰는 모듈(`aisearch`, `usagelog`, `availability`, `picks`)은 "둘이 잠깐 같이 돌아도 되는지" 확인만
- 표·API: 새 표·새 API 없음 [안]. Actuator 준비 확인 주소는 서버 안에서만
- 배포 파일: dev `deploy/prod/compose.yaml`, `bin/up.sh`, `bin/release.sh`, `README.md`, `deploy/nginx/ec2-tunnel.conf`, `web.Dockerfile`
- 문서: `docs/settings-index.md` (정상 종료 대기 시간 등 새 값), 사이클 17 문서는 고치지 않고 이 사이클에서 링크
