# 서버 설정값 목록 — 시간·용량·동시 수

대출 조회와 운영 서버의 **시간 제한, 용량 상한, 동시 수**를 한곳에 모은 목록이다. 값마다 지금 값, 실제로 들어 있는 곳(dev 파일·환경 변수), 정한 문서, 근거, 함께 바꿀 곳을 적는다. 사람과 AI가 값을 바꾸거나 이유를 찾을 때 이 문서부터 본다.

- 만든 날: 2026-10-16 (사이클 20 세 관점 검토 #7, 사용자: "다른 ai가 이런 시간이랑 용량 제한 서버 설정 값들 통합적으로 관리할 수 있도록 사이클 이외의 문서 링크 잘 걸어나서 관리하도록 해줘 그리고 지금 값들의 근거도 잘 써놓고")
- **고치는 규칙**: 사이클이 이 표의 값을 새로 정하거나 바꾸면 그 사이클 문서와 함께 이 표의 줄을 고친다(값·태그·정한 문서·근거). 값을 정한 원문은 사이클 문서·ADR이고, 이 표는 그것을 가리키는 색인이다. 원문과 이 표가 다르면 원문(가장 최근 사이클)을 따르고 이 표를 고친다
- 태그는 `.claude/rules/doc-tags.md` 그대로. 근거는 사용자 말 또는 실측·공식 문서만 적고, 없으면 `[이유 미확인]`
- dev 쪽: dev `docs/maintenance/settings-index.md`에 값마다 한 줄(값 / 어디 / 함께 바꿀 곳 / 왜 / 정한 plan 문서·ADR / 바꾸면 다시 켤 것), 값 옆 주석은 그 문서를 가리킴 [확정] (사이클 20 세 관점 검토 #17 승인 2026-10-16, 사이클 20 인계로 만듦). 이 문서는 plan 쪽 색인(정한 근거), dev 문서는 코드 위치 색인. 값이 바뀌면 둘 다 고친다
- dev 경로 줄임: `be.yml` = `chaekcheck-dev/backend/src/main/resources/application.yml`, `fs.yml` = `chaekcheck-dev/fetch-service/src/main/resources/application.yml` (2026-10-16 읽음)
- 상태 표시: **구현됨** = dev 설정 파일에 있음(2026-10-16 확인), **인계 예정** = plan에서 정했고 아직 dev에 없음

### 값을 바꿀 때 순서

1. 사이클 문서나 결정 페이지에서 정한다(사용자 결정, 근거)
2. 이 문서의 그 줄을 고친다: 지금 값·근거·정한 문서(결정 번호)·날짜·태그
3. 사이클 문서(spec·design-delta)와 ADR의 같은 값을 고친다
4. dev 쪽(인계로): `application.yml` 기본값 / `deploy/prod/prod.env` / nginx 템플릿 / 확장 `extension/config.js` 중 해당하는 곳, dev `docs/maintenance/settings-index.md` 줄
5. 그 사이클 인계서(handoff)에 바뀐 값과 다시 켤 것을 적는다

## 1. 운영 서버 크기와 메모리

| 값 | 지금 값 | 들어 있는 곳 | 상태 | 정한 문서 | 근거 | 태그 | 함께 바꿀 곳 |
|---|---|---|---|---|---|---|---|
| 운영 서버 | 시드니 EC2 t4g.small, 메모리 2GB(1.8GiB), 앱 전에 약 0.97GiB 사용 | AWS | 구현됨 (2026-10-15 생성) | [사이클 17 research](cycles/17-first-deploy/research.md) 17절 | 설계는 서울 4GB였으나 무료 플랜 제약으로 2GB (사이클 17 실측, 2026-10-16) | [확정] | 아래 메모리 값 전부 |
| 서비스 힙 | 512MB | dev `backend/build.gradle` `bootRun` `-Xmx512m` (`-PbootRunXmx`로 바꿈) | 구현됨 (사이클 08) | [data-model](current/data-model.md) 309행 | 사용자: 서비스 힙 "512MB (권장)" (2026-10-11). 로컬 PC 기준이라 운영에서 다시 잼 → [backlog](backlog.md) 257·259행 | [확정] | 페이지 상한·해석 자리(6-1절)·캐시 크기 |
| DB 메모리 | `shared_buffers` 64MB, `effective_cache_size` 768MB, `work_mem` 4MB, 컨테이너 권장 1GB | dev compose·`.env.example` | 구현됨 (사이클 08) | [data-model](current/data-model.md) 309행 | 사용자: "한 단계 여유롭게 하고 운영 서버에서는 다시 재도록" (2026-10-11) | [확정] | 운영 2GB에서 다시 잼 |

## 2. 대출 조회: 도서관에 가는 시간

| 값 | 지금 값 | 들어 있는 곳 | 상태 | 정한 문서 | 근거 | 태그 | 함께 바꿀 곳 |
|---|---|---|---|---|---|---|---|
| 연결 시간 제한 | 5초 | `be.yml` `chaekcheck.availability.connect-timeout`, `fs.yml` `fetch.connect-timeout` | 구현됨 | 사이클 01·dev | 경기교육청 등 연결에 1~3초 걸리는 곳(2026-09-29), 사이클 01 값 3초에서 사용자 결정 (2026-09-29) | [확정] | 두 파일 같이 |
| 응답 머리까지 제한 | 5초 | `be.yml` `read-timeout`, `fs.yml` `fetch.read-timeout` | 구현됨 | [사이클 01 spec](cycles/01-ebook-availability-search/spec.md) 5.2 ("응답 5초", 절 [확정] 2026-09-27) | 이유 [이유 미확인]. 시드니 → 한국 IP → 강동구립 홈페이지(586KB)는 3.5~5.0초로 닿을 수 있음 ([multi-source-ip](research/deploy/multi-source-ip.md) 9-4절) — 운영 서버에서 이 값이 맞는지 아직 모름 | 5초 [확정] (사이클 01 spec 5.2 "타임아웃은 연결 3초, 응답 5초, 검색 전체 8초", 절 [확정] 2026-09-27) / 운영 적합성 [확인 필요: 운영 기록 확인] | 두 파일 같이 |
| 한 요청 전체 제한 | 15초 | `be.yml` `total-timeout`, `fs.yml` `fetch.total-timeout` | 구현됨 | dev | 연결 5 + 머리 5 + 본문 5, 지금 되는 응답을 자르지 않음 (dev 주석) | [안] | 두 파일 같이 |
| 묶음 마감 (적용: 바로 검색, 책 기준 검색 뒤 대출 상태 조회) | 8초 (묶음 시작부터) | `be.yml` `batch.deadline` | 구현됨 | [사이클 02 spec](cycles/02-library-expansion/spec.md) 88행 (사용자 결정 2026-09-28, "사이클 01과 같은 값"), ADR-0014, [api](current/api.md) | 사용자 결정 (2026-09-28), 이유 [이유 미확인]. 시드니 + 한국 IP에서 한 곳 1.7~3.7초라 안에 들어옴 (사이클 20 검토, 2026-10-16) | [확정] | 확장 모드도 같음 (사이클 20 R8) |
| 새 요청 멈춤 | 마감 3초 전부터 | `be.yml` `batch.launch-cutoff` | 구현됨 | dev | [이유 미확인] | [안] | — |
| 「더 보기」 한 쪽 제한 | 8초 (대기 포함) | `be.yml` `request-deadline` | 구현됨 | [사이클 01 spec](cycles/01-ebook-availability-search/spec.md) 5.2 ("검색 전체 8초", 절 [확정] 2026-09-27), [사이클 01 design-delta](cycles/01-ebook-availability-search/design-delta.md) 255행 설정 키 `request-deadline=8s` ("값은 [확정]") | 사용자 확인 (2026-09-27), 이유 [이유 미확인] | [확정] | — |
| 상세 페이지 마감 | 묶음 시작부터 30초 | `be.yml` `detail.deadline` | 구현됨 | [사이클 02 spec](cycles/02-library-expansion/spec.md) 110행 ("최대 30초 기다림" [확정] 사용자 2026-09-28), ADR-0014 | 사용자 결정 (2026-09-28), 이유 [이유 미확인] | [확정] | — |
| 도서관 응답 본문 상한 | 지금 4MB → **1MB로 바꿈** (서버 모드·확장 모드 같은 값) | `be.yml` `max-body-size`, `fs.yml` `fetch.max-body-size` → 인계 뒤 `LOOKUP_MAX_BODY_MB` 하나 (Spring + nginx) | 4MB 구현됨, 1MB 인계 예정 | [사이클 20 design-delta](cycles/20-lookup-status-and-extension/design-delta.md), 세 관점 검토 #7 | 실측 도서관 응답 최대 약 322KB(BOOKCUBE XML, 2026-10-05), 오늘 잰 검색 화면 42~220KB → 1MB면 약 3배 여유. 2GB 서버라 1MB 쪽 하나 해석 최악 약 12MB × 4 ≈ 50MB로 묶음(그 뒤 해석 자리가 서버·확장 함께 8로 바뀜 → 6-1절, 전반 점검 #4). 사용자 승인 #7 (2026-10-16) | [확정] | nginx `client_max_body_size`, 조회 서버 `fs.yml` `fetch.max-body-size`(33행, 환경 변수 `FETCH_MAXBODYSIZE`) — compose가 `${LOOKUP_MAX_BODY_MB}MB`를 서비스·조회 서버 둘 다에 넘김(인계 예정), 확장 `extension/config.js` 본문 상한은 고정 상수라 **손으로 맞추고 확장을 다시 깔아야 함** [안: 또는 계획 응답에 `maxBodyBytes`를 실어 보내 확장이 그 값을 쓰게 하는 방법 — 선택지로만 적음, 정하지 않음], 6-1절 해석 자리 8, 6-1절 gzip·1MB 넘음 기록 |

## 3. 대출 조회: 동시 수와 간격

| 값 | 지금 값 | 들어 있는 곳 | 상태 | 정한 문서 | 근거 | 태그 | 함께 바꿀 곳 |
|---|---|---|---|---|---|---|---|
| 동시 검색 자리 (바로 검색 묶음 1개·대출 상태 조회 묶음 1개·「더 보기」 1번이 각각 1자리) | 지금 20 → 40 → **60** (v1.2.0, dev `application.yml` `chaekcheck.availability.max-concurrent-searches: 60`, 커밋 `21dd568`, 이유 [이유 미확인] — 사이클 22 회고 2026-10-23) (넘으면 바로 503 `server_busy`) | `be.yml` `max-concurrent-searches` (환경 변수 `CHAEKCHECK_AVAILABILITY_MAXCONCURRENTSEARCHES`) | 20 구현됨, 40 인계 예정 (사이클 20 1단계) | [전반 점검 #13](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 사용자: "이걸 올리는 게 나을 것 같은데 사이클 20에게 알려줘" (2026-10-17), 40은 제안 → 승인. 어림(측정 아님): 20이면 초당 약 3~4검색에서 503, 40이면 약 6~8, 보통 응답(약 0.2MB) 기준 힙 어림 약 150MB ([multi-source-ip](research/deploy/multi-source-ip.md) 10절, [부하·메모리 어림](research/deploy/easy/2026-10-17-load-memory-sim.html) 6번 카드). 해석 메모리는 6-1절 해석 자리 8이 맡음. 1MB 쪽만 오는 최악 = 진행 중 요청 200건(검색 자리 40 × 묶음 5) × 1MB + 해석 자리 8 × 약 8MB(1MB 쪽 해석 실측 7.4MB) ≈ 200 + 64 = 약 264MB(바탕 힙 약 77MB를 더하면 약 340MB, 힙 512MB 안) [안: 어림, 배포 뒤 측정] (6-1절과 같은 값, design-delta 전반 점검 #4). 배포 뒤 1분 요약 로그(힙·503)로 60을 볼지 정함. 처음 20: "개인 서비스에 몇 초 안 20검색은 드묾" (dev 주석) | [확정] | 상태 불 단계(20 노랑·40 빨강, 사이클 20 R1), 6-1절 해석 자리 |
| 묶음당 동시 도서관 (적용: 바로 검색, 책 기준 검색 뒤 대출 상태 조회 / 적용 안 됨: 책 찾기 `/books`, 도서관 한 곳 「더 보기」) | 5 | `be.yml` `batch.parallelism` | 구현됨 | 사이클 02 [design-delta](cycles/02-library-expansion/design-delta.md) 261행 (제안값, "프로토타입으로 확인"), 쉬운 설명: [결정 페이지](cycles/20-lookup-status-and-extension/easy/2026-10-16-review-decisions.html) 카드 「질문에 답: 묶음을 왜 5곳으로 했나」 | [이유 미확인] — 사용자 결정·측정 기록 없음. 배포 뒤 "검색 한 번이 묶음을 몇 번 도는지"로 맞춤 | [안] | 확장 전체 동시 5 |
| 묶음 줄 상한 (**2026-10-18 바뀜: '도서관에서 직접 찾기'에만 적용** / 적용 안 됨: 바로 보기 = 위 「바로 보기 묶음 크기」 10을 씀, 책 찾기 `/books`, 「더 보기」) | **10줄** | `be.yml` `batch.row-limit` | 구현·배포됨 | 사이클 20 명세 R15, 검토 #23; 적용 범위 좁힘 dev `bb26e0d` (2026-10-18) | 사용자: "검색 결과 수를 줄여야겠다 10개로" (2026-10-16). 바로 보기는 R15-1 대체로 `holding-batch-size` 10을 쓰게 되어, row-limit 10은 도서관 직접 찾기에만 남음 | [확정] | 확장 모드 같은 값 |
| 책 기준 검색 한 쪽 책 수 | 지금 기본 20 → **기본 10** (최대 20) | 지금 dev `catalog/internal/web/BookParams.java` 상수 `MAX_PAGE_SIZE = 20` 하나가 기본값·최대를 함께 맡음(2026-10-16 읽음) → 기본값을 설정 속성으로 분리. 값은 서버 설정 속성 하나에서 정함 [확정] (검토 #30 승인 2026-10-16: 서버 설정 속성 하나, 웹은 `pageSize`를 보내지 않음) | 인계 예정 | 사이클 20 명세 R15, 검토 #23 | 같음. 이어지는 대출 조회(`book-availabilities/stream`)도 대략 반 | 10 [확정] / 정하는 곳 [안] | — |
| ~~책 화면 대출 상태 자동 이어 부르기~~ **없앰** (바로 보기) | ~~최대 3묶음~~ → **자동 이어 부르기 삭제**. 검색 한 번에 **1묶음(다음 10개)**, 「더 보기」마다 다음 10개 | `VITE_HOLDING_AUTO_BATCHES` 삭제 (dev `bb26e0d`, 이미지 2026-10-18c) | 구현·배포됨 (2026-10-18) | **사이클 20 R15-1 대체** (아래 「바로 보기 묶음」 참고) | 사용자: "결과를 10개 정도 타겟", "100개 이상은 용납이 안 돼", "db결과대로 이어서 검색", "정렬은 똑같아야 해" (2026-10-18). 왜: '경험의 멸종'(소장 105곳)처럼 소장 많은 책 하나가 자동 이어로 40곳 넘게 열리던 것을 1묶음 10곳으로 막음 | [확정] (사용자 결정) | 아래 「바로 보기 묶음」 새 설정 |
| **바로 보기 묶음 크기** (적용: 책 기준 검색 뒤 대출 상태 조회 = 바로 보기 / 적용 안 됨: 도서관 직접 찾기, 「더 보기」) | **10** — 우리 DB 순서(책 순서 → 그 책의 도서관 순서)로 다음 10개, **필터와 상관없이 10개로 셈**. 「더 보기」마다 다음 10개 | `be.yml` `chaekcheck.availability.batch.holding-batch-size` (환경 변수 `CHAEKCHECK_AVAILABILITY_BATCH_HOLDINGBATCHSIZE` [안]) | 구현·배포됨 (dev `bb26e0d`, 2026-10-18) | **사이클 20 R15-1 대체** (사용자 결정 2026-10-18) | 사용자 승인. EC2 확인: '경험의 멸종'·'전체 도서관'·'누구나 가입' 모두 한 묶음 10개만 열림(requested 10, stopReason `CANDIDATES_EXHAUSTED`) | [확정] | 정렬·화면 모양 그대로 |
| 다음 묶음 후보 | 50 | `be.yml` `batch.max-candidates` | 구현됨 | dev | [이유 미확인] | [안] | — |
| 한 길·한 사이트 동시 / 간격 | 동시 1건, 1초 | `be.yml` `host-max-concurrency`, `host-min-interval` | 구현됨 (길 하나), 길마다는 인계 예정 (사이클 20 1단계 1-15, 사용자 결정 2026-10-17로 17에서 옮김) | ADR-0094·ADR-0130(0095를 대체), [multi-source-ip](research/deploy/multi-source-ip.md) 7절 #2 | 사용자 승인: 고정 IP마다 동시 1건·1초 (2026-10-16) | [확정] | 길이 늘면 길마다 |
| 교보 구독형 서버 | 길마다 동시 3건, 느려지면 1건, 막힘 신호면 멈춤 | 인계 예정 (사이클 20 1단계 1-15, 속성 `chaekcheck.availability.kyobo.subscription-max-concurrency` 이름 [안]) | 인계 예정 (사이클 20 1단계 1-15, 사용자 결정 2026-10-17로 17에서 옮김) | ADR-0094, [사이클 17 scope](cycles/17-first-deploy/scope.md) 10번 | 사용자: "이거 지금 해" (2026-10-13) | [확정] | — |
| 차례 기다림 → 시간 초과 | **따로 정한 값 없음** — 부른 쪽의 마감까지 기다림: 묶음은 `batch.deadline` 8초, 「더 보기」는 `request-deadline` 8초, 상세는 `detail.deadline` 30초 (마감까지 자리를 못 받으면 시간 초과) | dev `backend/.../availability/internal/fetch/InMemoryHostThrottle.java` 70~77행 `acquire(host, uri, deadline)`: 남은 시간 = 마감 − 지금, 그 안에 `tryAcquire` 못 하면 `UpstreamException.timeout` (2026-10-17 읽음) | 구현됨 | 마감 값은 2절 각 줄, 사이클 20 [spec](cycles/20-lookup-status-and-extension/spec.md) R4 (시간 초과를 "줄이 섬"으로 셈) | 세 마감의 근거는 2절 각 줄 | 구조 [확정] (dev 코드 확인) / 값은 2절 태그 | 2절 세 마감, 줄 선 도서관 60초 |

## 4. 나가는 길 (첫 배포)

| 값 | 지금 값 | 들어 있는 곳 | 상태 | 정한 문서 | 근거 | 태그 | 함께 바꿀 곳 |
|---|---|---|---|---|---|---|---|
| 나가는 길 | 21개 = EC2 자기 IP 1 + Webshare 한국 정적 주거용(공유) 20 | 인계 예정 (사이클 20 1단계 1-15: 설정 목록 `chaekcheck.availability.egress.proxies` 이름 [안], 업체 주소는 서버 비밀 값 — 운영 값 넣기는 사이클 17) | 인계 예정 (사이클 20 1단계 1-15, 사용자 결정 2026-10-17로 17에서 옮김) | [multi-source-ip](research/deploy/multi-source-ip.md) 7·8절 | 사용자: 프록시 없으면 "1초 제한에 걸려서 사용자가 거의 의미가 없어", 정적 20개 먼저 (2026-10-16) | [확정] | — |
| 나가는 길 설정 | `모두`(기본, 21개) / `프록시만`(한국 20) / `직접만`(EC2 1). `프록시만`이면 Webshare가 모두 멈춰도 EC2로 넘어가지 않음. **운영 값 `프록시만`** (사용자, 2026-10-18) | 인계 예정 (사이클 20 1단계 1-15: `chaekcheck.availability.egress.mode` 이름 [안], ADR-0130 설정 자리) | 인계 예정 (사이클 20 1단계 1-15, 사용자 결정 2026-10-17로 17에서 옮김) | 사이클 20 검토 #24, `cycles/17-first-deploy/from-cycle-20-proxy-only.md` | 사용자: "프록시만 하면 프록시만 하고 자체 서버 IP에서 … 안 하도록" (2026-10-16), 승인 | [확정] | 상태 불(사이클 20 R1) |
| 시간 (실측) | 시드니 → 한국 IP → 강동 전자도서관 1.7초, 교보 구독형 2.7초, 큰 홈페이지 3.5~5.0초 | — | 실측 | 같은 문서 9-4절 | 1회 측정 (2026-10-16) | [확정] | 2절 시간 제한 |
| 막힌 길 다시 시험 | 10분 뒤 1건, 막혀 있으면 두 배, 최대 7일 | 인계 예정 (사이클 20 1단계 1-15, 속성 이름 [안: dev]) | 인계 예정 (사이클 20 1단계 1-15, 사용자 결정 2026-10-17로 17에서 옮김) | [from-cycle-20-blocked-ip-resume](cycles/17-first-deploy/from-cycle-20-blocked-ip-resume.md) | 사용자 승인 (2026-10-15), 상한 "일주일로 가자" | [확정] | — |
| Webshare 데이터 | 정적 20개 250GB/달, 80% 경고, 90%에서 정적 길만 멈춤 | 인계 예정 | 인계 예정 | [multi-source-ip](research/deploy/multi-source-ip.md) 8절 #3 (97행) | 사용자 승인 (2026-10-16). 확장 모드로 올라온 페이지는 세지 않음 (9-5절) | [확정] | — |
| Webshare 업체 오류 | 407·429·계정 확인이면 Webshare 길 전체 즉시 멈춤 | 인계 예정 | 인계 예정 | 같은 문서 8절 #4 | 사용자 승인 (2026-10-16) | [확정] | 상태 불: 멈춘 동안 최소 노랑 (사이클 20 검토 #21 승인 2026-10-16) |
| Webshare 동시 연결 | 기본 500 (High Concurrency $2.25/월이면 3,000+) | Webshare 계정 | — | [multi-source-ip](research/deploy/multi-source-ip.md) 9-2절 (142행) | 업체 기본값. Webshare 구매 화면 "Concurrency is limited to 500 by default" (2026-10-16 확인) | [확정] | — |
| 알림 메일 | 같은 일 1시간에 한 번 | 인계 예정 (CloudWatch → SNS) | 인계 예정 | 같은 문서 8절 #1 | 사용자 승인 (2026-10-16) | [확정] | — |

## 5. 캐시

| 값 | 지금 값 | 들어 있는 곳 | 상태 | 정한 문서 | 근거 | 태그 | 함께 바꿀 곳 |
|---|---|---|---|---|---|---|---|
| 조회 캐시 유지 | 3분 | `be.yml` `cache-ttl` | 구현됨 | [사이클 01 spec](cycles/01-ebook-availability-search/spec.md) 5.6 ([확정] 사용자 2026-09-27), ADR-0006, [api](current/api.md) | 사용자 결정 (2026-09-27), 이유 [이유 미확인] | [확정] | 확장 캐시 유지(첫 저장부터 고정, 사이클 20 #10) |
| 검색 쪽·상세 판정 캐시 칸 | 각 1,000 | `be.yml` `caches.*-max-size` | 구현됨 | ADR-0066 (사이클 08) | 측정 전까지 이전 값 (dev 주석) | [안] | — |
| 확장이 채우는 캐시 | 500칸 | 인계 예정 | 인계 예정 (사이클 20 2단계) | 사이클 20 세 관점 검토 #9, 2단계부터 나눔 [전반 점검 #2](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17: "나눔 (#9·#10 그대로) 이걸로 해") | 2GB 기준, 칸당 수 KB → 2~3MB. 믿을 수 없는 값을 서버 값과 섞지 않기(검토 #9 근거). 만료는 처음 넣은 시각 + 3분 고정(#10). 사용자 승인 (2026-10-16) | [확정] | — |

## 6. 상태 불과 확장 모드 (사이클 20)

임계값은 이 표가 색인이고, 근거(계산 포함)는 각 줄에, 결정 원문은 결정 페이지 [`cycles/20-lookup-status-and-extension/easy/2026-10-16-review-decisions.html`](cycles/20-lookup-status-and-extension/easy/2026-10-16-review-decisions.html)의 #NN(세 관점 검토 번호)과, 2026-10-17 전반 점검은 [`cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html`](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html)의 #N("전반 점검 #N")에 있다. 사이클 20 값마다 만드는 단계(1·2·3단계)는 상태 칸에 적음(단계 표: design-delta "개발 단계"). 설계 본문은 [사이클 20 design-delta](cycles/20-lookup-status-and-extension/design-delta.md) "사람(브라우저)마다 세기", 결정 기록은 [ADR-0119](adr/0119-extension-as-user-side-fetcher-server-parses-and-checks.md). 값을 바꾸면 이 표·design-delta·dev `docs/maintenance/settings-index.md`를 함께 고친다 (사용자: "전반적으로 이런 임계값 숫자 이런 것은 계획대로 관리하도록 하고 다른 ai가 맥락을 잘 파악하도록 링크 문서화 해야 해", 2026-10-16).

- 한도·울타리 숫자의 공통 근거: 바깥 표준 숫자는 없다. OWASP API Security Top 10 2023 API4는 "Rate limiting should be fine tuned based on the business needs"라고만 함 (https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption , 2026-10-16 확인) [확정]. 그래서 우리 설계 숫자에서 거꾸로 계산한 값이고, 배포 뒤 거절 기록(`rejected_event`)과 IP별 계획 무게를 보고 맞춘다
- 계산의 바탕: 계획 하나의 무게(주소 수)는 한 묶음 후보 최대 50곳(`batch.max-candidates` 50) + 상세 몇 장 → 최대 약 50~60 [안: 어림]. 한 사람이 번호당 열린 계획 20 × 약 50 = 약 1,000 (탭을 많이 연 아주 바쁜 사람 한 명)

| 값 | 지금 값 | 들어 있는 곳 | 상태 | 정한 문서 | 근거 | 태그 | 함께 바꿀 곳 |
|---|---|---|---|---|---|---|---|
| 상태 묻는 간격 | 10초 | 인계 예정 (웹) | 인계 예정 | [spec](cycles/20-lookup-status-and-extension/spec.md), [research](cycles/20-lookup-status-and-extension/research.md) | 사용자: "메모리 점유가 더 문제" → SSE 대신 묻기 (2026-10-15) | [확정] | — |
| 단계 | 자리 절반(20개) 이상 노랑, 전부(40개) 또는 10초 안 503 빨강, 마지막 성공 30초 지나면 회색 | 인계 예정 | 인계 예정 | spec R1·R5, [전반 점검 #13](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) | 사용자 승인 (범위 #2). 절반·전부 규칙은 그대로라 자리 40에서 20·40 (2026-10-17) | [확정] | 동시 검색 자리 40 (3절) |
| DB 오류면 회색 | 최근 **30초** 안에 DB 오류 → 상태 응답 `level=GRAY`·`reason=DB_ERROR`(값 이름 [안]), 짧은 글 「상태 모름」, 말풍선 둘째 줄 「상태를 확인할 수 없어요」(마무리 확인 #7) | 서비스 설정 속성 (이름 [안: dev], 인계 예정) | 인계 예정 (사이클 20 1단계) | [전반 점검 #9](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 사용자 승인 (2026-10-17). 결정 페이지 #9 설명: 상태 응답이 DB를 보지 않아 DB 장애에도 초록이었음. 30초라는 수 [이유 미확인] (제안 → 승인; R5 회색 30초와 같은 값)  회색이 빨강을 포함한 다른 모든 단계보다 앞섬 [확정] (사용자 승인, 2026-10-17, 설계 검토 #4). DB 오류는 루트 패키지 `ApiExceptionHandler`가 `availability` 공개 메서드 하나(`LookupHealth.recordDbError()`, 이름 [안])로 알림 [확정] (사용자 승인, 2026-10-17, 설계 검토 #3) | [확정] | — |
| 줄 선 도서관 남기기 | 시간 초과 뒤 60초 | 인계 예정 | 인계 예정 | spec R4 | 사용자 승인 (명세 결정 #5) | [확정] | 차례 기다림(3절, 부른 쪽 마감까지) |
| 줄 선 도서관: 기다림을 세는 시간 | 기다리기 시작한 지 **10초**(묶음 마감 8초 + 여유 2초) 안의 기다림만 셈 → 짝(+1·−1)이 어긋나도 10초 뒤 「밀려요」가 사라짐 | 서버 `HostQueueBoard` (설정 이름 [안: dev], 인계 예정) | 인계 예정 (사이클 20 1단계) | [전반 점검 #3](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 사용자: "지금 가자" (2026-10-17). 10초 = 묶음 마감 8초(2절) + 2초. 상세(30초) 기다림은 10초 뒤 안 셈 — 감수 [안] | 10초 [확정] / 설정으로 둠 [안] | 2절 묶음 마감 8초 (마감을 바꾸면 함께) |
| 확장 인사 기다림 | 첫 검색 최대 500ms, 끊기면 3번(바로·1초·2초) | 인계 예정 | 인계 예정 | spec R6, 검토 #4 | 3번: 사용자 "이렇게 해" (2026-10-16, 검토 #4). 500ms: 세 관점 검토가 고친 값(◆), 사용자가 따로 고르지 않음 [이유 미확인] | 3번 [확정] / 500ms [안] | — |
| 확장 약속 판 번호 최소 판 | 인사 답의 약속 판 번호(`protocol`, 이름 [안])가 웹의 최소 판보다 낮으면 서버 모드 + 「확장을 새로 깔아 주세요」(머리말 상태 점 말풍선 둘째 줄, 점은 서버 모드 색 — 마무리 확인 #8). 처음 값 1 [안] | 웹 `VITE_EXTENSION_MIN_PROTOCOL` [안] · 확장 `extension/config.js` (인계 예정) | 인계 예정 (사이클 20 2단계) | [전반 점검 #8](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 사용자 승인 (2026-10-17). 결정 페이지 #8 설명: 개발자 모드 확장은 자동 갱신이 없어 웹만 새로 배포되면 메시지 모양이 어긋남 | 규칙 [확정] / 이름·처음 값 [안] | 웹과 확장의 메시지 모양을 바꿀 때 둘 다 올림 |
| ~~서버 전체 동시 해석 4~~ → **6-1절 해석 자리 8(서버·확장 함께)로 바뀜** ([전반 점검 #4](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html), 2026-10-17). 기다림 최대 2초(페이지가 서버에 다 도착한 뒤부터) → 그 도서관만 실패는 그대로 | (처음 값 4) | ~~`max-concurrent-uploads`~~ | 바뀜 | 검토 #7 → 전반 점검 #4 | 실측(2026-10-16, jsoup 1.23.2): 1MB 쪽 해석 중 7.4MB·6ms, 보통 쪽 0.6~0.9MB·1~4ms → 4자리면 최악 약 30MB, 2초에 수백 장 처리. 사용자 승인 (2026-10-16) | [확정] | 페이지 상한 |
| 올리기 IP당 동시 연결 | 4 | nginx `LOOKUP_UPLOAD_CONN` (인계 예정) | 인계 예정 | 검토 #7 | 한 사람이 해석 자리를 혼자 차지하지 않게. 사용자 승인 (2026-10-16) | [확정] | — |
| 올리기 속도 | IP당 초당 20, 몰림 60 | nginx `LOOKUP_UPLOAD_RATE`·`LOOKUP_UPLOAD_BURST` (인계 예정) | 인계 예정 | design-delta nginx 줄, [architect-proposal](cycles/20-lookup-status-and-extension/architect-proposal.md) 결정 절 설계 #12 | 사용자: "이걸로 해줘" (2026-10-16, 설계 #12), 이유 [이유 미확인] | [확정] | — |
| nginx 본문 받기 | `proxy_request_buffering on`, `client_body_buffer_size 512k`, `client_body_timeout 10s` | nginx 템플릿 (인계 예정) | 인계 예정 | design-delta nginx 줄 (세 관점 검토가 고친 값 ◆, 사용자가 따로 고르지 않음) | 느린 회선이 서버 일꾼·해석 자리를 잡지 않게 (https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_request_buffering , 2026-10-16) | [안] | — |
| 계획 보관 | 무게(주소 수) 25,000(약 10MB, 주소 하나 약 400B), 쓴 뒤 10분, 꽉 차면 다른 사람 것을 밀지 않고 새 계획 503 → 그 검색만 서버 모드 | 인계 예정 | 인계 예정 | 검토 #8 (2026-10-16) | 2GB 기준. 사용자: "오래된 계획이 밀려나는 게 서비스적으로 맞나?" → 밀어내지 않기로, 승인 (2026-10-16) | [확정] | 아래 IP 울타리 무게 20% |
| 브라우저 번호당 열린 계획 | 20 (넘으면 그 번호의 가장 오래된 계획만 지움) | 인계 예정 (서버) | 인계 예정 | 검토 #8·#22 (2026-10-16) | 같은 공인 IP 뒤의 옆 사람과 묶이지 않게 사람(브라우저)마다 셈 — 사용자: "아이피로만 하면 같은 공인아이피의 다른 상대가 피해가 갈 것 같은데 각각 클라이언트를 보호할 방법은?" (2026-10-16), 승인. 20이라는 수 자체는 [이유 미확인] (처음 #8 "IP당 20"에서 단위만 바뀜) | [확정] | IP 울타리 계산(20 × 50 = 1,000) |
| 번호 잠금 | 1분 실패 30번(모르는 계획 번호·같은 쪽 두 번·Origin 다름만; IP 바뀜·번호 다름·만료는 세지 않음) → 그 번호 10분 잠금 | 인계 예정 (서버) | 인계 예정 (사이클 20 3단계) | 검토 #11·#22·#32 (2026-10-16) | 잠금은 공격에서만 나는 실패로만 셈(#11) → 정상 사용자 번호가 잠길 일은 거의 없음. 사용자 승인 (2026-10-16). 30·10분이라는 수 자체는 [이유 미확인] | [확정] | — (IP 울타리 (3)은 전반 점검 #12로 뺌) |
| 브라우저 번호 장부 | 최대 5만 줄(약 5MB [안: 어림, 줄 하나 약 100B]), 받은 지 1일 지나면 지움. 서명 없음, 장부에 없는 번호는 거절, 받은 IP와 지금 IP가 다르면 400 → 새 번호. 서버 재시작 = 장부 비움. **차면 가장 오래 안 쓴 줄을 밀어냄**(LRU, 접근 순서 `LinkedHashMap` + 잠금; 방금 받은 번호는 밀려나지 않음; 503 아님) → 밀려난 사람은 400 `invalid_client_key` 뒤 조용히 새 번호로 다시 계획 | 인계 예정 (서버 설정 속성) | 인계 예정 (사이클 20 3단계) | 검토 #32 (2026-10-16), [전반 점검 #10](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 사용자: "브라우저 번호랑 아이피랑 합쳐서 서버에서 관리하면 되겠다" (2026-10-16), 승인. 5만·1일은 제안값 → 승인, 수 자체의 계산 근거 [이유 미확인]. 찼을 때: 사용자 "가. 오래된 줄 밀어내기 … 이걸로 가자" (2026-10-17; 거절하면 IPv6 /64 묶음으로 장부를 채우는 공격 한 번에 모두의 확장 모드가 꺼짐 — 결정 페이지 #10 설명). 밀어내는 방식: Caffeine 크기 상한(Window TinyLFU)은 쓴 횟수가 많았던 줄을 남기고 빈도 공격이면 새 줄이 모두 거절될 수 있어(https://github.com/ben-manes/caffeine/wiki/Design , 2026-10-17 확인) 공격 중 정상 사용자의 새 번호가 곧바로 밀려남 → LRU 표로 [확정] (사용자 승인, 2026-10-17, 설계 검토 #1, ADR-0133) | [확정] / 약 5MB [안] | 번호 쿠키 수명 |
| 브라우저 번호 쿠키 수명 | 1일 (`Max-Age` 86400), `HttpOnly`·`Secure`·`SameSite=Strict`, 경로 `Path=/api/v1/lookup-plans` **하나** | 인계 예정 (서버 설정 속성) | 인계 예정 (사이클 20 3단계) | 검토 #33 (2026-10-16), 경로 [전반 점검 #11](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 사용자: "브라우저 번호 이거 xss로 뭐 오염되지 않도록 조심해야 해" (2026-10-16), 승인. HttpOnly·SameSite 뜻: MDN Set-Cookie (https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie , 2026-10-16 확인). 1일 = 장부 1일과 맞춤. 경로: 계획 만들기·올리기·닫기 주소를 모두 `/api/v1/lookup-plans` 밑으로 옮겨(전반 점검 #11, 사용자 승인 2026-10-17) 쿠키 경로 하나 — 처음 안의 경로 넷 중 `/api/v1/availability/libraries`가 서버 모드 「더 보기」 GET에도 쿠키를 붙이던 문제(MDN Set-Cookie `Path` 규칙, https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie , 2026-10-17 확인)가 없어짐 | 쿠키 속성·수명·경로 [확정] | 장부 1일 (함께 바꿈), 계획 주소(design-delta API 표) |
| 메모리 상태 저장소 고르기 | `memory` 하나 (사이클 20은 이것만 만듦; 나중 `redis`) — `availability`의 메모리 공유 상태(캐시·계획 보관함·장부·잠금·울타리 셈·상태 불 메모·DB 오류 시각 등)를 모두 작은 저장소 인터페이스 뒤에 두고 이 값 하나로 구현을 고름 | 서비스 설정 속성 `chaekcheck.lookup.state-store` (이름 [안], 인계 예정) | 인계 예정 (사이클 20 1단계에 설정을 만들고, 인터페이스는 그 상태를 만드는 단계마다) | 설계 검토 #1 ([결정 페이지](cycles/20-lookup-status-and-extension/easy/2026-10-17-design-review-decisions.html), 2026-10-17), ADR-0133, 목록 [research/maintenance/memory-state-and-redis.md](research/maintenance/memory-state-and-redis.md) | 사용자: "이렇게 하고 나중에 redis전환이 쉽도록 다 구조랑 문서화 해둬 메모리로 관리하는 건 (옵션 등으로 redis전환/내부메모리 사용관리하는 것도 방법인 것 같아)" (2026-10-17) | 방식 [확정] / 이름 [안] / `redis` 구현 없음(나중) | Redis를 붙일 때 사이클 17 compose·`prod.env`·메모리 표(1절) |
| IP 울타리 (1) 계획 무게 몫 | 한 공인 IP(/64)에 준 번호들의 열린 계획 무게 합이 보관함의 20% = 주소 5,000(25,000 중)을 넘으면 그 IP의 새 계획 429 → 「잠시 후 다시」(서버 모드 안 함) | 인계 예정 (서버) | 인계 예정 (사이클 20 3단계) | 검토 #31 (2026-10-16), #22의 "공인 IP당 열린 계획 200"을 바꿈 | 계산: 바쁜 사람 한 명 최대 약 1,000 → 5,000 = 바쁜 사람 5명이 동시에 최대로 써도 들어감, 보통 사람(계획 1~3개, 무게 수십~150)이면 30명 이상. 20%라 대량으로 보내는 곳이 최소 5곳은 되어야 보관함이 참. 바깥 표준 없음(위 OWASP) | [확정] | 계획 보관 25,000 (비율이라 함께 움직임) |
| IP 울타리 (2) 새 번호 | 한 공인 IP에 새 번호 1분 30개 초과 → 그 IP의 새 계획 429 → 「잠시 후 다시」 | 인계 예정 (서버) | 인계 예정 (사이클 20 3단계) | 검토 #31 (2026-10-16) | 계산: 번호는 새 브라우저(탭)를 열거나 IP가 바뀔 때만 받음 → 한 사람 1분에 1~2개. 30개 = 같은 IP 뒤에서 1분에 15~30명이 새로 들어와도 됨. 번호를 계속 바꿔 한도를 피하려면 1분에 30개를 넘게 받아야 해 막힘 | [확정] | — |
| ~~IP 울타리 (3) 잠긴 번호~~ | **뺌** — 처음 값: 한 공인 IP의 잠긴 번호 5개 이상 → 그 IP 10분 거절 | — | 뺌 | 검토 #22·#31 (2026-10-16) → [전반 점검 #12](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 사용자 승인 (2026-10-17). 결정 페이지 #12 설명: (1) 무게 20%·(2) 새 번호 1분 30개·번호 잠금과 겹치고 같은 IP의 정상 사용자까지 10분 막을 수 있음. 남용은 (1)·(2)·번호 잠금과 거절 기록으로 봄 | [확정] (뺌) | — |
| 계획 요청 (계획 만들기) | 공인 IP당 분당 300, 몰림 100 + 화면 1초 묶기. 계획·올리기·닫기 주소는 모두 `/api/v1/lookup-plans` 밑, nginx는 `location ^~ /api/v1/lookup-plans/` 블록 하나 안에서 계획 만들기 세 주소에만 이 한도 | nginx `LOOKUP_PLAN_PER_MIN`·`LOOKUP_PLAN_BURST` (인계 예정) | 인계 예정 (사이클 20 2단계) | 사이클 20 검토 #15, 주소·블록 [전반 점검 #11](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 공인 IP는 여럿이 함께 씀(사용자 질문 "이 아이피가 공공아이피야?") → nginx는 한 곳 대량만 막는 울타리, 사람별은 서버. 승인 (2026-10-16). 처음 안 60·30 | [확정] | 계획 보관함(#8), 서버의 IP 울타리 둘(#31, (3)은 전반 점검 #12로 뺌) |
| 서버가 대신 부르는 도서관 목록 | 비어 있음 (프로토타입에서 확장이 못 여는 도서관이 나오면 넣음: http·인증서·리다이렉트) | `be.yml` `extension.server-fetched-libraries` (이름 [안], 인계 예정) | 인계 예정 (사이클 20 3단계, 전반 점검 #1) | 사이클 20 검토 #16 | 사용자 승인, "이것들도 다 기록해야해" (2026-10-16) → 사용 기록 출처 `server_for_extension`·켤 때 로그 | [확정] | dev 설정값 목록, 이 줄 |
| 확장 한 번에 받는 주소 | 최대 100개, 주소 2KB | 확장 `config.js` (인계 예정) | 인계 예정 | design-delta | [이유 미확인] | [안] | — |
| 상태 응답 메모 | 1초 (그 안에 온 요청은 계산한 값을 그대로 받음, 계산은 한 번) | 서버 `LookupStatusService` (인계 예정) | 인계 예정 | [spec](cycles/20-lookup-status-and-extension/spec.md) 입력·출력 표 ("캐시 1초"), design-delta 흐름 1 | 사용자 승인 (2026-10-15, 명세 결정 #6), 이유 [이유 미확인] | [확정] | 상태 묻는 간격 10초 (화면이 바뀌기까지 최대 11초, AC-1·AC-2) |
| 줄 선 도서관 목록 길이 | `queuedLibraryIds` 최대 200 | 상태 응답 (인계 예정) | 인계 예정 | [design-delta](cycles/20-lookup-status-and-extension/design-delta.md) 흐름 1·API 표 | [이유 미확인] | [안] | — |
| 확장 상수 (`config.js`) | 전체 동시 5, 호스트마다 동시 1건·앞 요청 끝 +1초, 응답 머리까지 10초, 본문 상한(서버와 같은 값, 1MB), 포트 예외 목록(기본 포트 밖 도서관, 예: 전주 `:8095`) | 확장 `extension/config.js` (인계 예정, 고정 상수 → 바꾸면 다시 깔아야 함) | 인계 예정 | design-delta 외부 연동 표·"확장 꾸러미", [architect-proposal](cycles/20-lookup-status-and-extension/architect-proposal.md) 결정 #8 | 호스트 1건·1초: 범위 #7 사용자 승인. 동시 5·머리 10초: 설계 결정 #8 사용자 승인. 본문 1MB: 위 2절 검토 #7. 포트 예외 목록: 검토가 넣은 것(◆), 목록 내용은 프로토타입에서 | 동시 5·호스트 1건/1초·머리 10초·본문 1MB [확정] / 포트 예외 목록 [안] | 2절 본문 상한(손으로 맞춤) |
| 웹 ↔ 확장 메시지 한도 | 메시지 하나 64MiB (Chrome이 정한 값, 우리가 바꾸지 않음) | Chrome | — | [architect-proposal](cycles/20-lookup-status-and-extension/architect-proposal.md) 14행, design-delta 311행 | Chrome 문서 https://developer.chrome.com/docs/extensions/develop/concepts/messaging (2026-10-15 확인) | [확정] | 본문 상한 × 1.33(base64)이 이 안이어야 함 |
| S14 사서추천 창 소장 줄 수 | `holdingLimit=3` (3 = 지금 S14의 3곳) | 웹 → 계획 요청 (인계 예정) | 인계 예정 | design-delta API 표·웹 절 | design-delta: "3 = 지금 S14의 3곳", 이유 [이유 미확인] | 3 [안] (이름도 [안]) | — |
| 추천도서·사서추천 책 창 조회 넓히기 | 앞 3곳에 지금 빌릴 수 있는 곳이 없으면 `holdingLimit` 6 → 10 → 20(서버 최대)으로 넓혀 다시 조회, 보이는 줄은 3줄 그대로(빌릴 수 있는 곳 먼저), 앞서 본 도서관은 서버 캐시 3분에서 | 웹 `features/picks/pickLibraryRows.ts` `PICKS_HOLDING_STEPS = [3, 6, 10, 20]` | 구현됨 (사이클 21, dev main `836bd7b`, 회고 2026-10-17) | (사이클 21 dev, 사용자 결정 2026-10-17: "도서관 3곳만 검색하면 그 도서관에는 없고 사용자가 가입 가능한 다른 도서관에는 있을 수 있는데" → "빌릴 수 있는 곳이 나올 때까지 더 조회") | 같음. 부하: 넓힐 때마다 대출 상태 요청 한 번(검색 자리 1개)이 더 감, 최대 넷(3·6·10·20) | [확정] | 확장 모드 계획 `holdingLimit`(사이클 20)도 같은 단계로. 사이클 21 화면에 적용되는 규칙 중 "넓히기 단계 수는 이어 부르기 3묶음 상한과 따로 셈"은 사이클 20에서 정함(사용자 승인 전반 점검 #7, 2026-10-17, 3절 이어 부르기 줄), "한 단계 안의 이어 부르기도 같은 3묶음"은 [안] |
| 400 뒤 다시 계획 | `invalid_client_key`·`client_ip_changed`면 남은 도서관만 새 계획으로 다시 요청 **1번**, 또 400이면 남은 줄 「확인하지 못한 도서관」 | 웹 (인계 예정) | 인계 예정 | design-delta 흐름 2·웹 절 | 다시 계획 자체는 검토 #32 승인, 횟수 1번은 [이유 미확인] | 다시 계획 [확정] / 1번 [안] | — |
| 거절 기록 묶기 | `invalid_plan`·`invalid_client_key`는 IP·이유마다 1분에 1줄 | 서버 → `usagelog.rejected_event` (인계 예정) | 인계 예정 | design-delta 모듈 표·데이터 표 | 세 관점 검토가 넣은 것(◆), 사용자가 따로 고르지 않음, [이유 미확인] | [안] | — |
| 화면이 만드는 `done` | 상세 단계가 끝나거나 30초가 지나면 | 웹 (인계 예정) | 인계 예정 | design-delta API 절 (architect 2-3) | [이유 미확인] (값은 2절 상세 마감 30초와 같음) | [확정] (design-delta 표기 그대로; architect-proposal 2-3 원문은 [안]) | 2절 상세 페이지 마감 |

### 6-1. 해석 자리와 메모리 보호 (사이클 20 전반 점검 #4, 2026-10-17)

| 값 | 지금 값 | 들어 있는 곳 | 상태 | 정한 문서 | 근거 | 태그 | 함께 바꿀 곳 |
|---|---|---|---|---|---|---|---|
| 도서관 페이지 해석 자리 (서버 모드·확장 모드 함께) | **8**, 자리가 없으면 최대 2초 기다림 → 그 도서관만 실패(서버 모드 `library-failed`, 확장 모드 올리기 503 `server_busy` → 「확인하지 못한 도서관」) | 서비스 설정 속성 `ParseSlots` (이름은 dev가 정함 → 8절 규칙대로 환경 변수) | 인계 예정 (사이클 20 1단계; 확장 모드는 2단계부터 함께 씀) | [전반 점검 #4](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 서버 모드는 지금 상한 없이 최대 100건(검색 자리 20 × 묶음 5, 자리 40이면 200건)을 동시에 담고 해석함(dev `FetchServiceSiteFetcher`) → 1MB 쪽 해석 실측 7.4MB(2026-10-16)면 자리 20일 때 100 × (1MB + 7.4MB) ≈ 840MB, 자리 40이면 200 × 약 8.4MB ≈ 1,680MB로 힙 512MB를 넘음 [안: 어림]. 해석 자리 8로 묶으면 최악 = 진행 중 요청 200건(검색 자리 40 × 묶음 5) × 1MB + 해석 자리 8 × 약 8MB(1MB 쪽 해석 실측 7.4MB) ≈ 200 + 64 = 약 264MB(바탕 힙 약 77MB를 더하면 약 340MB, 힙 512MB 안) [안: 어림, 배포 뒤 측정] (3절 동시 검색 자리와 같은 값). 사용자 승인, "이 변수 통합적으로 관리하도록 하고 AI가 읽기 쉽도록 잘 문서화" (2026-10-17). 2초는 세 관점 검토 #7 값 그대로 | 8·하나로 [확정] / 2초 [확정] (검토 #7) — 배포 뒤 힙 기록으로 조정 | 확장 올리기 동시 해석 4(검토 #7, 6절)를 이것으로 바꿈, 3절 동시 검색 자리 40 |
| 메모리 바닥나면 앱 끝내고 다시 켜기 | JVM `-XX:+ExitOnOutOfMemoryError` + 서비스 컨테이너 `restart: unless-stopped` | 운영 compose·JVM 옵션 | 인계 예정 (사이클 17 배포 파일, [from-cycle-20-observability](cycles/17-first-deploy/from-cycle-20-observability.md) 4번) | [전반 점검 #4](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 사용자 승인 (2026-10-17). 위 해석 자리로도 못 막는 경우 앱이 멈춘 채 남지 않게 | [확정] | — |
| 도서관 응답 압축(gzip)과 풀었을 때 상한 | 서버 모드 요청(직접·조회 서버 경유)에 `Accept-Encoding: gzip`, 풀면서 세어 풀었을 때도 1MB(`LOOKUP_MAX_BODY_MB`)에서 끊음 | 인계 예정 (서비스) | 인계 예정 (사이클 20 1단계) | [전반 점검 #6](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 지금은 압축을 안 받음(dev 코드 0건, 결정 페이지 #6). 압축률은 dev가 도서관 몇 곳에서 재서 기록 [확인 필요: dev 측정]. 사용자 승인 + "1MB 넘는 거 잘 기록하고" (2026-10-17) | [확정] | 2절 본문 상한, 아래 "1MB 넘음 기록" |
| 1MB 넘음 기록 | 1MB를 넘어 실패한 도서관마다 ① 서버 로그 한 줄(도서관 번호·주소·받은 크기·시각) ② 사용 기록: `library_response_daily.failed_count`에 더하고 새 칸 `body_too_large_count`에도 셈 ③ 1분 요약 로그 "1MB 넘음 n건" | 서비스 로그·`usagelog/004` changeset (인계 예정) | 인계 예정 (사이클 20 1단계) | [전반 점검 #6](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 사용자: "1MB 넘는 거 잘 기록하고" (2026-10-17) — 2절 본문 상한을 올릴지 판단할 근거. 지금 `library_response_daily`에는 실패 이유 칸이 없음(dev `usagelog/001`·`002`, 2026-10-17 읽음) | ①③ [확정] / ② 새 칸 [확정] (사용자 승인, 2026-10-17, 마무리 확인 #6) | 2절 본문 상한 |
| 운영 요약 로그 간격 | **1분**마다 한 줄: 검색 자리 사용, 503 수, 힙, 멈춘 길, 1MB 넘음 수, DB 오류 수, 확장/서버 도서관 요청 수, 계획 무게 합(2단계부터), 장부 크기(3단계부터) | 서비스 (인계 예정; 필드 모양 [안: dev]) | 인계 예정 (사이클 20 1단계) | [전반 점검 #5](cycles/20-lookup-status-and-extension/easy/2026-10-17-overall-review.html) (2026-10-17) | 사용자 승인 (2026-10-17). CloudWatch 경보 3개(요약 줄 5분 없음·힙 85%·503 급증)는 사이클 17 몫: [from-cycle-20-observability](cycles/17-first-deploy/from-cycle-20-observability.md) 1번. 1분이라는 수 [이유 미확인] (제안 → 승인) | [확정] | 9절 CloudWatch 경보(사이클 17이 더함) |

## 7. 그 밖의 운영 값

| 값 | 지금 값 | 들어 있는 곳 | 상태 | 정한 문서 | 근거 | 태그 |
|---|---|---|---|---|---|---|
| 사용 기록 버퍼 | 10,000줄, 5초마다 쓰기 | `be.yml` `usagelog.*` | 구현됨 | 사이클 15, ADR-0096·0097 | 사용자 승인 | [확정] |
| 조회 서버(fetch-service) 동시 처리 | 32 | `fs.yml` `fetch.max-concurrent` | 구현됨 | ADR-0015 | 지금 4MB: 32 × 4MB × 1.33(base64) ≈ 170MB 최악 (dev `fs.yml` 31~32행 주석). 본문 1MB(사이클 20 인계 뒤): 32 × 1MB × 1.33 ≈ 43MB 최악 [안: 어림] | [안] |
| 조회 서버 쪽 시간 | 연결 1초, 읽기 7초, 쉼 30초 | `be.yml` `fetch.*` | 구현됨 | ADR-0015 | [이유 미확인] | [확인 필요: 사이클 17 배포 뒤 기록으로] |
| nginx 기존 한도 (IP마다) | 도서관 부르는 API(검색·대출 상태 스트림, `/api/v1/availability/`) 30r/m·몰림 20, 동시 연결 6 / 사용 알림 `/api/v1/usage-events` 60r/m·몰림 20(넘치면 204) / 나머지 일반 `/api/` 5r/s·몰림 30(`Retry-After: 1`) | dev `deploy/nginx/rate-limits.conf` 15·20·24행, `chaekcheck-locations.conf` 32~33·53~54·78행 (2026-10-17 읽음). 일반 `/api/`는 아직 dev에 없음 → 사이클 17 `deploy/prod/nginx/prod.conf` | 도서관·사용 알림 구현됨 / 일반 `/api/` 인계 예정 (사이클 17) | [사이클 17 spec](cycles/17-first-deploy/spec.md) R3, [design-delta](cycles/17-first-deploy/design-delta.md) 131·141행, ADR-0097 | 도서관 30r/m·6: 사용자 요청(2026-10-05)으로 넣은 한도, 값은 dev 주석에 [안]. 사용 알림 60r/m: ADR-0097, 몰림 20은 "도서관과 같음" [안]. 일반 `/api/` 5r/s·30: 사용자 승인 (2026-10-13, 사이클 17 결정 #1) | 도서관 30r/m·20·6 [안] / 사용 알림 60r/m [확정]·몰림 20 [안] / 일반 5r/s·30 [확정]·`Retry-After: 1` [안] |
| 사서 추천 받기 | 연결 5초, 읽기 10초, 본문 10MB, 표지 5MB, 간격 1초 | `be.yml` `picks.fetch.*` | 구현됨 | 사이클 14, ADR-0089·0092 | 표지 5MB 사용자 결정 (2026-10-12) | [확정] |
| 로그인 토큰 | 접근 15분, 로그인 30일, 재인증 5분, 가입 대기 10분 | `be.yml` `auth.tokens.*` | 구현됨 | ADR-0038·0040·0043 | ADR | [확정] |

## 8. 값을 바꾸는 곳: 환경 변수 이름 (2026-10-16)

사용자: "이런 개수 말이야 변수로 통합적으로 관리 가능하도록 했으면 해 설정이라던가 그리고 이런 것들 문서 링크 잘 해서 ai가 잘 보도록 정리하고" (2026-10-16, 사이클 20 세 관점 검토). 방식은 사이클 20 검토 #25 [확정] (사용자 승인 2026-10-16).

- 서비스(Spring) 값은 `application.yml`을 고치지 않고 **환경 변수로 덮어쓸 수 있음**: 이름은 속성 이름에서 점을 `_`로, `-`를 빼고, 대문자로 [확정] (Spring Boot 공식 문서 "Binding From Environment Variables", https://docs.spring.io/spring-boot/reference/features/external-config.html , 2026-10-16 확인). 운영에서는 `deploy/prod/prod.env`(사이클 17)에 적고 서비스를 다시 켬
- nginx와 서비스가 함께 쓰는 값은 짧은 `LOOKUP_*` 이름 하나로(사이클 20 설계 #12)
- 웹(화면) 값은 빌드 때 `VITE_*`, 확장 값은 `extension/config.js` 한 파일 — 이 둘은 다시 빌드·다시 깔아야 바뀜

| 값 | 환경 변수 | 지금 기본값 |
|---|---|---|
| 동시 검색 자리 | `CHAEKCHECK_AVAILABILITY_MAXCONCURRENTSEARCHES` | 20 → 40 (사이클 20, 전반 점검 #13) → 60 (v1.2.0, 사이클 22 회고) |
| 묶음당 동시 도서관 | `CHAEKCHECK_AVAILABILITY_BATCH_PARALLELISM` | 5 |
| 도서관 직접 찾기 줄 상한 (2026-10-18부터 바로 보기엔 미적용) | `CHAEKCHECK_AVAILABILITY_BATCH_ROWLIMIT` | 10 |
| 바로 보기 묶음 크기 (R15-1 대체) | `CHAEKCHECK_AVAILABILITY_BATCH_HOLDINGBATCHSIZE` [안] | 10 (dev `bb26e0d`, 2026-10-18) |
| 묶음 마감 | `CHAEKCHECK_AVAILABILITY_BATCH_DEADLINE` | 8s |
| 새 요청 멈춤 | `CHAEKCHECK_AVAILABILITY_BATCH_LAUNCHCUTOFF` | 3s |
| 다음 묶음 후보 | `CHAEKCHECK_AVAILABILITY_BATCH_MAXCANDIDATES` | 50 |
| 상세 마감 | `CHAEKCHECK_AVAILABILITY_DETAIL_DEADLINE` | 30s |
| 한 길·한 사이트 동시 / 간격 | `CHAEKCHECK_AVAILABILITY_HOSTMAXCONCURRENCY` / `CHAEKCHECK_AVAILABILITY_HOSTMININTERVAL` | 1 / 1s |
| 연결 / 머리 / 전체 시간 제한 | `CHAEKCHECK_AVAILABILITY_CONNECTTIMEOUT` / `CHAEKCHECK_AVAILABILITY_READTIMEOUT` / `CHAEKCHECK_AVAILABILITY_TOTALTIMEOUT` | 5s / 5s / 15s |
| 「더 보기」 한 쪽 제한 | `CHAEKCHECK_AVAILABILITY_REQUESTDEADLINE` | 8s |
| 조회 캐시 유지 | `CHAEKCHECK_AVAILABILITY_CACHETTL` | 3m |
| 캐시 칸 | `CHAEKCHECK_AVAILABILITY_CACHES_SEARCHPAGEMAXSIZE` / `CHAEKCHECK_AVAILABILITY_CACHES_DETAILVERDICTMAXSIZE` | 1000 / 1000 |
| 도서관 응답 본문 상한 (서버·확장·nginx 함께) | `LOOKUP_MAX_BODY_MB` (compose가 서비스 `CHAEKCHECK_AVAILABILITY_MAXBODYSIZE=${LOOKUP_MAX_BODY_MB}MB`, 조회 서버 `FETCH_MAXBODYSIZE=${LOOKUP_MAX_BODY_MB}MB`(`fs.yml` `fetch.max-body-size`), nginx 템플릿에 넘김 — 인계 예정). 확장 `extension/config.js`는 고정 상수라 손으로 맞추고 다시 깔아야 함 [안: 또는 계획 응답에 `maxBodyBytes`를 실어 보내는 방법 — 선택지로만] | 4MB → 1 (사이클 20) |
| 차례 기다림 | 따로 없음 — 위 `CHAEKCHECK_AVAILABILITY_BATCH_DEADLINE`(묶음 8s)·`CHAEKCHECK_AVAILABILITY_REQUESTDEADLINE`(「더 보기」 8s)·`CHAEKCHECK_AVAILABILITY_DETAIL_DEADLINE`(상세 30s)를 따름 (3절) | — |
| 해석 자리 (서버·확장 함께) / 자리 기다림 | (사이클 20 새 속성, 이름은 dev가 정함 → 위 규칙대로 환경 변수; 처음 안의 "확장 올리기 동시 해석 4"를 바꿈, 전반 점검 #4) | 8 / 2초 |
| 줄 선 도서관: 기다림을 세는 시간 | (사이클 20 새 속성, 이름은 dev가 속성 이름에서 규칙대로, 전반 점검 #3) | 10초 |
| DB 오류면 회색: 보는 시간 | (사이클 20 새 속성, 이름은 dev가 속성 이름에서 규칙대로, 전반 점검 #9) | 30초 |
| 운영 요약 로그 간격 | (사이클 20 새 속성, 이름은 dev가 속성 이름에서 규칙대로, 전반 점검 #5) | 1분 |
| 계획 보관함 무게 / 계획 유지 | (사이클 20 새 속성, 이름은 dev가 속성 이름에서 규칙대로) | 25,000 / 10분 |
| 브라우저 번호당 열린 계획 | (사이클 20 새 속성, 이름은 dev가 속성 이름에서 규칙대로) | 20 |
| 번호 잠금: 실패 수 / 세는 시간 / 잠금 시간 | (사이클 20 새 속성, 이름은 dev가 속성 이름에서 규칙대로) | 30 / 1분 / 10분 |
| 브라우저 번호 장부 상한 / 유지 | (사이클 20 새 속성, 이름은 dev가 속성 이름에서 규칙대로; 차면 가장 오래 안 쓴 줄(LRU)을 밀어냄, 전반 점검 #10·설계 검토 #1) | 50,000 / 1일 |
| 브라우저 번호 쿠키 수명 | (사이클 20 새 속성, 이름은 dev가 속성 이름에서 규칙대로; 장부 유지와 같은 값으로 둠) | 1일 |
| 메모리 상태 저장소 고르기 | `CHAEKCHECK_LOOKUP_STATESTORE` (속성 `chaekcheck.lookup.state-store`, 이름 [안], 위 규칙대로; 설계 검토 #1) | `memory` |
| IP 울타리 (1) 계획 무게 몫 | (사이클 20 새 속성, 이름은 dev가 속성 이름에서 규칙대로; 비율로 둘지 주소 수로 둘지도 dev — 보관함 무게를 바꾸면 함께 움직이게 비율 권장 [안]) | 20% (= 5,000) |
| IP 울타리 (2) 한 IP 새 번호 1분 상한 | (사이클 20 새 속성, 이름은 dev가 속성 이름에서 규칙대로) | 30 |
| ~~IP 울타리 (3) 잠긴 번호 수 / IP 거절 시간~~ | 뺌 (전반 점검 #12, 2026-10-17) — 속성을 만들지 않음 | — |
| nginx 올리기 / 계획 한도 | `LOOKUP_UPLOAD_CONN`, `LOOKUP_UPLOAD_RATE`·`LOOKUP_UPLOAD_BURST`, `LOOKUP_PLAN_PER_MIN`·`LOOKUP_PLAN_BURST` | 4, 20·60, 300·100 |
| 책 기준 검색 한 쪽 책 수 | 서비스 설정 속성(새로 분리, 이름은 dev가 정함 → 위 규칙대로 환경 변수) [확정] (검토 #30 승인 2026-10-16: 서비스 설정 속성 하나, 웹은 `pageSize`를 보내지 않음). 최대 20은 그대로 | 20 → 10 (사이클 20) |
| 상태 묻는 간격 | 웹 `VITE_LOOKUP_STATUS_POLL_SECONDS` [안] | 10 |
| ~~책 화면 자동 이어 부르기 묶음 수~~ **없앰** | ~~`VITE_HOLDING_AUTO_BATCHES`~~ 삭제 (dev `bb26e0d`, 2026-10-18; R15-1 대체) | — |
| 확장 약속 판 번호 최소 판 | 웹 `VITE_EXTENSION_MIN_PROTOCOL` [안] + 확장 `extension/config.js`의 `protocol` (전반 점검 #8) | 1 [안] |
| 나가는 길 설정 / 프록시 길 목록 | `CHAEKCHECK_AVAILABILITY_EGRESS_MODE` / `CHAEKCHECK_AVAILABILITY_EGRESS_PROXIES`, 조회 서버 `FETCH_EGRESS_MODE` / `FETCH_EGRESS_PROXIES` (이름 [안], 사이클 20 1단계 1-15; 두 서비스에 같은 값 — 공통 `LOOKUP_EGRESS_*` [안], compose·`prod.env`는 사이클 17) | 코드 기본 `all`(모두) / 빈 목록. **운영 `proxy-only`** [확정] (사용자: "프록시만 사용하도록 하고", 2026-10-18) |
| 교보 구독형 길마다 동시 | `CHAEKCHECK_AVAILABILITY_KYOBO_SUBSCRIPTIONMAXCONCURRENCY` (이름 [안], 사이클 20 1단계 1-15) | 3 |

- 위 표의 속성 이름은 dev `backend/src/main/resources/application.yml`(2026-10-16 읽음) 기준. 속성 이름이 바뀌면 환경 변수 이름도 바뀌므로 이 표를 함께 고침

## 9. 정해진 시각·보관 기간·감시

시각은 모두 Asia/Seoul. 서로 겹치지 않게 03:00 → 04:00 → 04:30 → 05:00 순서로 둠 ([사이클 17 research](cycles/17-first-deploy/research.md) 7절 130행, [scope](cycles/17-first-deploy/scope.md) 53행).

| 값 | 지금 값 | 들어 있는 곳 | 근거 | 태그 |
|---|---|---|---|---|
| DB 백업 | 매일 03:00, 내 PC가 내려받음 | 사이클 17 백업 스크립트 (인계 예정) | [사이클 17 spec](cycles/17-first-deploy/spec.md) R10, research 130행 (사용자: "응 추천대로 해줘", 2026-10-13) | [확정] |
| 로그인 정리(만료 토큰·오래된 계정) | 매일 04:00 | `be.yml` `chaekcheck.auth.cleanup.cron` `"0 0 4 * * *"`, `zone: Asia/Seoul` (107~108행) | 사용자 승인 2026-10-04 (dev 주석, 사이클 05) | [확정] |
| 사용 기록 정리 | 매일 04:30 (기록을 꺼도 돎) | `be.yml` `chaekcheck.usagelog.cleanup.cron` `"0 30 4 * * *"` (233~234행) | [사이클 15 spec](cycles/15-usage-log/spec.md) R3-5 | [확정] |
| 사서 추천 받기 판단 | 매일 05:00 (월요일·실패 뒤·놓친 주) | `be.yml` `chaekcheck.picks.fetch.cron` `"0 0 5 * * *"` (192~193행) | ADR-0092 (사이클 14) | [확정] |
| 사용 기록 IP 칸 | 30일 뒤 비움 | 위 04:30 정리 | 사이클 15 spec R3-5·R5-2 | [확정] |
| 이상한 알림 기록 `rejected_event` | 30일 뒤 지움 | 위 04:30 정리 | 사이클 15 spec R3-5 | [확정] |
| 그 밖의 사용 기록 | 1년 뒤 지움 | 위 04:30 정리 | 사이클 15 spec R3-5 | [확정] |
| 오래 안 쓴 계정 | 마지막 로그인 1년 뒤 지움 | `be.yml` `chaekcheck.auth.cleanup.inactive-after: 1y` (110행) | 사이클 05 AC-20 (사용자 승인 2026-10-04) | [확정] |
| nginx 접속 기록 | 14일, 쿼리 문자열 빼고 경로만 | 사이클 17 운영 nginx (인계 예정) | 사이클 17 spec R11 (사용자: "응 추천대로 해줘", 2026-10-13) | [확정] |
| 서비스(앱) 로그 | 14일 | 사이클 17 운영 compose (인계 예정) | 사이클 17 spec R11-1 (사용자 승인 2026-10-14) | [확정] |
| DB 백업 보관 | 서버 최근 2개, 내 PC 최근 7개 (처리방침 "백업 7일") | 사이클 17 백업 스크립트 (인계 예정) | 사이클 17 spec R10·R10-1 (사용자 승인 2026-10-13·14) | [확정] |
| CloudWatch 지표 | 60초마다 `mem_used_percent`·`disk_used_percent`(루트 `/`만), 네임스페이스 CWAgent | 운영 서버 `/opt/aws/amazon-cloudwatch-agent/etc/custom-config.json` (설정됨 2026-10-16) | [사이클 17 research](cycles/17-first-deploy/research.md) 17절 356행. 60초라는 값 [이유 미확인] | [확정] (실제 설정) |
| CloudWatch 경보 | `chaekcheck-disk-high`: `disk_used_percent` > 90, 평균, 5분 / `chaekcheck-server-down`: `StatusCheckFailed_Instance` ≥ 1, 최대, 5분 → SNS `chaekcheck-alerts` 메일. 무료 10개 중 2개 사용 | AWS 콘솔 (설정됨 2026-10-16) | 사이클 17 research 17절 368행. 90%·5분이라는 값 [이유 미확인]. 무료 10개: https://aws.amazon.com/cloudwatch/pricing/ (2026-10-16 확인, multi-source-ip 8절) | [확정] (실제 설정) |
| Webshare 사용량 확인 | 사용량 API `/api/v2/stats/aggregate/`를 1시간마다, 우리가 센 양과 비교해 큰 값, 80% 경고·90% 정적 길 멈춤 | 인계 예정 (사이클 17, ADR-0130) | [multi-source-ip](research/deploy/multi-source-ip.md) 8절 #3 (97행), 사용자 승인 (2026-10-16) | [확정] |
| 알림 메일 반복 | 같은 일 1시간에 한 번 | 4절 "알림 메일" 줄 | 같은 문서 8절 #1 | [확정] |

## 확인 필요

| 항목 | 확인 방법 |
|---|---|
| 응답 머리까지 5초가 시드니 + 한국 IP에서 큰 홈페이지(3.5~5.0초)를 자르는지 | 운영 기록 확인 (첫 배포 뒤) |
| 확장 모드 올리기 시간(어림 0.2~0.4초) | 배포 뒤 올리기 `ms`·서버 기록 |
| 서버 JVM 전체 메모리(앱을 띄운 상태) | 사이클 17 배포 뒤 측정 (해석 하나는 2026-10-16 실측: 1MB 쪽 7.4MB·6ms) |
| 조회 서버 쪽 시간(연결 1초·읽기 7초·쉼 30초, 7절)이 맞는지, 근거 | 사이클 17 배포 뒤 기록으로 |
| 도서관 응답 gzip 압축률 (6-1절) | dev가 도서관 몇 곳에서 측정 |
| 브라우저 번호 장부 줄 하나 크기(어림 약 100B → 5만 줄 약 5MB) | 배포 뒤 측정 |

## 사이클 22 이후 dev가 더한 값 (사후 정리, 2026-10-23)

| 값 | 지금 | 어디 | 근거 |
|---|---|---|---|
| 운영 서비스 힙 | `-Xmx640m -XX:+ExitOnOutOfMemoryError` | dev `deploy/prod/compose.yaml` `JAVA_TOOL_OPTIONS` | dev main `d3c2696` 확인. plan-feedback에는 "반영 때 512MB OOM → 1GB" 기록이 있어 어긋남 [확인 필요] |
| 조회 운영 표본 간격·보관 | 10초 · 90일 | `chaekcheck.availability.ops-sample.interval=10s`, `retention=90d`, `enabled=true` | ADR-0146 |
| 추천목록 표지 파일 캐시 | 7일 | nginx `/covers/` `Cache-Control "public, max-age=604800"` | ADR-0144 |
| 사서추천 표지 캐시 | 30일, immutable | `/api/v1/picks/covers/{id}` | ADR-0144 |


## 사이클 23 「나에게 맞는 책」 — 설계됨(미구현, 사이클 23)

근거: `docs/cycles/23-for-you-picks/design-delta.md` "설정" 절, ADR-0148·0149. 이름은 모두 [안], dev가 정함

| 값 | 설계 값 | 어디 (예정) | 상태 태그 |
|---|---|---|---|
| 새벽 기본 목록 만들기 시각 | 05:00 사서 받기와 겹치지 않는 새벽(예 04:00), 켤 때 오늘 것 없으면 만듦 | `chaekcheck.foryou.build.cron` | 새벽 [확정] (spec R2-5) / 시각 [안] |
| 인기 사이트·쪽 | 교보 일반 4곳 + YES24 V1 2곳, 사이트마다 앞 100권, 호스트당 1건·1초(`availability` 조회 줄) | `chaekcheck.foryou.sources.*` | [확정] (spec R2-2) |
| 출판유통·KLWAVE 요청 | 연결 5초·읽기 10초·간격 1초, 출처마다 `enabled` | `chaekcheck.foryou.sources.<source>.*` | [안] |
| 출처 빼기 기준 | 0줄 또는 책 맞춤 90% 미만 | 같음 | [안] |
| 점수 | 예약 2배, 연도 구간 3·6·10년 가산 1.5·1.0·0.6·0.3, 출판유통 × 1.5, KLWAVE × 0.3 | `chaekcheck.foryou.score.*` | 예약·연도·출판유통 [확정] (spec R2-3, 조정 가능 R2-3a) / KLWAVE [안] |
| 기본 목록 권수 | 40 | | [확정] (spec R2-4) |
| 기록 보관 | 30일, 마지막 succeeded 하나는 남김 | | 30일 [안] / 남김 [확정] |
| 이웃·개인 추천 | 이웃 20, 개인 추천 최대 60, 한 쪽 20, 다시 보여 주기 20권마다 2·후보 6 | | [확정] (spec R6) |
| 브라우저 본 책 | 200권·30일·10초(보일 때만)·다시 보여 주기 3일·S19 빼기 30일 | 웹 상수 | [확정] (spec R5·R6-1b·R6-4) |
| 메모리 사본 다시 읽기 | 만든 뒤 + 10분 | | [안] (PicksCache와 같게) |
| 이웃 전체 다시 계산 | 반년에 한 번쯤 (PC) | dev 수집 절차 | [확정] (설계 결정 #8) |
