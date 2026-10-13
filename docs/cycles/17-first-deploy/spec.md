# 기능 명세: 첫 배포 (배포 부분)

- 범위: [`scope.md`](scope.md) 포함 1~9. 포함 10은 이 명세에서 다루지 않음 → [ADR-0095](../../adr/0095-lookup-egress-proxies-per-ip-browser-ua.md)(제안됨)를 따로 다시 정함 (사용자: "응 배포 부분만 먼저 써줘", 2026-10-13)
- 세부 사실과 출처는 옮기지 않고 링크함: [`research.md`](research.md), [`hosting-options.md`](../../research/deploy/hosting-options.md) 결정 줄, [`aws-layout.md`](../../research/deploy/aws-layout.md), [`db-memory.md`](../../research/deploy/db-memory.md)

## 사용자 이야기

- 검색하는 사람은 `https://chaekcheck.com`에서 지금처럼 책과 대출 현황을 보고 싶다, 집 PC가 꺼져 있어도
- 검색하는 사람은 카카오로 로그인해 내 도서관을 저장하고 싶다
- 운영자는 2주 동안 서버 상태를 숫자로 보고 싶다 (사용자: "프로메테우스나 그라파나 node_exporter같은거", 2026-10-12)
- 운영자는 비밀 값을 AWS 서비스에 두고 써 보고 싶다 (사용자: "해보자 그냥 써보고 싶어", 2026-10-13)

## 동작 규칙 (정해진 값은 링크한 곳이 기준)

| # | 규칙 | 기준 문서 | 상태 |
|---|---|---|---|
| R1 | Lightsail 서울 4GB 한 대에 Docker로 띄움 | [hosting-options 결정 줄](../../research/deploy/hosting-options.md), [scope 포함 1](scope.md) | [확정] |
| R2 | `chaekcheck.com`(Cloudflare 구매) + Cloudflare Tunnel, http → https | [scope 포함 2](scope.md), dev `deploy/nginx/tunnel-test.conf` | [확정] |
| R3 | nginx가 `CF-Connecting-IP`를 사용자 주소로 읽음. 나머지 `/api/`에도 IP별 한도 | [research 7절](research.md), dev `deploy/nginx/rate-limits.conf` | [확정: 읽음] / 한도 값 [안] |
| R4 | 첫 배포 직전 seed 다시 만들기·`PRE_DEPLOYMENT` 지우기, 책 목록은 PC에서 가져와 반영 | `docs/backlog.md` "첫 배포 직전" 줄, ADR-0078, 사이클 11 | [확정] |
| R5 | 비밀 값은 Parameter Store 또는 Secrets Manager, 서버에는 읽기용 접근 키 한 쌍 | [research 1절](research.md) | [확정: AWS] / 서비스 선택 [안] |
| R6 | 카카오 운영 등록(Redirect URI, 웹 도메인, 동의항목), 카카오만 켬 | [research 2절](research.md) | [확정] |
| R7 | 시행일 = 공개일, 공개일에 16 개발이 끝났는지 확인 | [research 6절](research.md) | [확정] |
| R8 | 운영 메모리 값 다시 재기 (15 몫 포함) | backlog "배포 사이클" 줄, [research 7절](research.md) | [확정: 잼] |
| R9 | Prometheus·Grafana·node_exporter 직접, Spring Actuator 지표 | [hosting-options 결정 줄](../../research/deploy/hosting-options.md), [research 5절](research.md) | [확정] / 바깥에서 보는 방법 [안] |
| R10 | DB 백업 매일 03:00, 내 PC가 내려받음 | [research 7절](research.md), [scope 포함 8](scope.md) | [확정] / 보관 개수 [안] |
| R11 | nginx 접속 기록 14일, 쿼리 문자열 빼고 경로만 | [research 7절](research.md) | [확정] |
| R12 | 15 기록은 첫 배포 때 꺼짐, 지인 기간 실서버 시험 뒤 지움, 공개일에 켬 | [research 7절](research.md) | [확정] |

## 상태별 동작

- 로딩·결과 없음·입력 오류: 지금 화면 그대로 (바뀌는 화면 없음)
- 서버·터널이 멈춤: Cloudflare 오류 화면이 보임 [확인 필요: 배포 시험]
- 도서관 사이트 오류·지연: 지금 코드 그대로 ("확인 못 함")

## 수용 기준 ([scope 완료 기준](scope.md)과 같음)

- AC-1: 휴대폰 데이터망에서 `https://chaekcheck.com`을 열면 → 검색 결과와 대출 현황이 나온다
- AC-2: 카카오로 로그인하면 → 내 도서관을 저장할 수 있다
- AC-3: 같은 IP에서 한도보다 많이 요청하면 → 429가 오고, 다른 IP의 요청은 영향받지 않는다
- AC-4: Grafana에서 → CPU·메모리·응답 시간·도서관 호출 포기 횟수가 보인다
- AC-5: 서버 밖(내 PC)에 → 전날 03:00 DB 백업 파일이 있다
- AC-6: nginx 접속 기록에 → 쿼리 문자열이 없고, 15일 지난 파일이 없다

## 비목표

- 화면 바꾸기 (서비스 주소 표시 외) — 범위 밖
- 대출 조회 나가는 길 — 이 명세 밖, ADR-0095 다시 정함
- 노트북 이전, AWS WAF, DB 크기 줄이기 — [scope 제외](scope.md)

## 확인 필요

| 항목 | 확인 방법 | 막는 단계 |
|---|---|---|
| `chaekcheck.com` 구매 가능 여부 | 사용자가 Cloudflare에서 확인 | 배포 |
| Lightsail CPU 종류, 한국 데이터센터 IP를 도서관이 받는지 | 서버에서 시험 ([scope 먼저 조사할 것](scope.md)) | 배포 |
| 정식 터널에서 `CF-Connecting-IP`, 운영 nginx 이미지 realip | 배포 시험 ([research 7절](research.md)) | 배포 |
| R3 한도 값, R5 서비스 선택, R9 Grafana 보는 방법, R10 백업 보관 개수 | 사용자에게 질문 (설계 때) | 설계 |
| 배포 때 계정에서 옮길 값(AWS 계약 법인, Cloudflare 연락처·쿠키) | 계정 확인 ([research 6절](research.md)) | 공개일 |

## 판정

- **설계 진행 가능** — 설계를 막는 항목은 R3·R5·R9·R10의 [안] 값뿐이고, 설계 단계에서 함께 정함
