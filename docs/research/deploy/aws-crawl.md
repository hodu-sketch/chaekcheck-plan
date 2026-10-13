# AWS 서울에서 책 수집 돌리기 (사이클 13 조사)

- 작성: 2026-10-12. 사용자: "클라우드도 먼저 시도하고 안되면 집 pc", "나는 집 pc너무 부담주기 싫어", "Aws에서 하고 싶은데", "1번 2번 먼저해줘"
- 조사와 방법만 적습니다. 정하는 것은 사이클 13(`docs/cycles/13-crawler-to-dev/scope.md` 포함 4)에서 합니다. dev 코드는 여기서 고치지 않고 인계서로 넘깁니다
- 배경: Claude Code 클라우드(미국 IP)에서는 6곳 중 4곳이 응답하지 않았습니다(`aws-layout.md` 끝 절). 나가는 IP는 우리 국내 서버의 고정 IP만 씁니다 [확정] (`docs/research/ebook-catalog/crawl-method.md` 1절)

## 1. CloudShell 서울 시험 (계정을 되찾은 뒤 10분)

목적: AWS 서울 IP(데이터센터 IP)를 도서관 사이트가 받아 주는지 봅니다. CloudShell은 서울(ap-northeast-2)에서 제공됩니다 [확정] (https://docs.aws.amazon.com/general/latest/gr/cloudshell.html, 확인 2026-10-12).

1. AWS 콘솔에 로그인, 오른쪽 위 리전을 **아시아 태평양(서울)**으로
2. 위쪽 막대의 CloudShell 아이콘(`>_`)을 누름
3. 아래 한 줄을 붙여 넣음 (사이트마다 GET 1번, 2초 간격, 다시 시도 안 함, 교보 구독형 서버 `dkyobobook.co.kr`에는 보내지 않음)

```bash
curl -s https://ipinfo.io/json; echo; for u in https://ebook.gangseo.seoul.kr https://www.ghlib.go.kr:446 https://ebook.gangnam.go.kr https://library.busan.go.kr/elib https://kbsmalllibrary.bookcube.biz/FxLibrary http://lib.seojeong.ac.kr:8888; do curl -s -o /dev/null -m 30 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) chaekcheck-crawler/0.1 (catalog survey)" -w "$u  상태 %{http_code}  %{time_total}초" "$u"; echo "  (종료 코드 $?)"; sleep 2; done
```

결과 읽는 법:

| 보이는 것 | 뜻 |
|---|---|
| 상태 200·301·302 | 받아 줌 |
| 상태 000, 종료 코드 7·35·56 | 연결 거절·리셋 → 데이터센터 IP를 막는 것으로 봄 |
| 상태 000, 종료 코드 28 | 30초 안에 응답 없음 → 막음 또는 포트 닫힘 |
| 상태 403 | 사이트가 거절 |

- 미국 Google IP 결과(2026-10-12): 강남 200, 부산 302, 나머지 4곳 응답 없음
- 4곳이 서울에서 받아 주면: 해외 IP 차단이었고 AWS 서울 수집 가능
- 서울에서도 안 되면: 그 사이트는 데이터센터 IP를 막는 것. 그 곳만 집 PC로 받을지 사용자에게 질문

## 2. AWS 서울 수집 서버

### 2-1. 지금 수집기가 쓰는 것 (2026-10-12, 데이터 폴더)

| 항목 | 값 | 근거 |
|---|---|---|
| 수집 DB | `ebook-catalog.sqlite` 16.5GB(약 16,525MB) | 파일 크기 확인 2026-10-12 |
| 사본 | 가져오기 때 한 벌 더(`snapshots/`) | 사이클 08·11 |
| 코드 | Python 표준 라이브러리 + `beautifulsoup4` 하나 | `crawl_catalog.py` import 줄 |
| 실행 | `resume.cmd`(Windows): 이미 돌면 시작 안 함, 동시 서버 40·서버당 1건·1초, 끝나면 `status` | `resume.cmd` |
| CPU·메모리 | 재지 않음 (HTML 읽기에 CPU가 많이 들어 예전에 `--shard`로 나눔) | `crawl-method.md` 8절 [확인 필요] |

### 2-2. 두 가지 안

| | A안: 수집 전용 작은 서버 (추천) | B안: 서비스 서버에 같이 |
|---|---|---|
| 모양 | t4g.small(2 vCPU, 2GiB) 한 대 + gp3 60GiB | 서비스용으로 정한 t4g.medium(4GiB)에 수집기도 둠, 디스크 40 → 100GiB |
| 좋은 점 | 수집이 서비스를 느리게 하지 않음. 서비스 배포 전(지금 보류)에도 바로 시작 | 서버가 하나 |
| 나쁜 점 | 서버가 둘 | 수집의 HTML 읽기가 CPU 크레딧을 써서 검색이 느려질 수 있음. 서비스 배포 뒤에야 가능 |
| 한 달 대략(24시간 켬, 미국 달러) | 서버 $15.2 + 디스크 $5.5 + 공인 IPv4 $3.7 = **약 $24** | 디스크 늘린 몫 $5.5 + CPU 크레딧 넘친 몫(수집량에 따라) |

- 2GiB가 모자라면 t4g.medium($0.0416/시간, 한 달 약 $30.4)으로 올림. 실제 메모리는 집 PC에서 한 번 재고 정함 [확인 필요]
- 수집이 없는 날 서버를 멈추면 서버 요금은 안 나가고 디스크 요금만 나감(공인 IP는 멈추면 풀림, 고정 IP(Elastic IP)를 쓰면 쉬는 동안에도 같은 요금)
- 계산 근거(서울, 확인 2026-10-12, AWS 공식 요금 데이터 `b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/…`, 게시 2026-10-09):
  - EC2 Linux 온디맨드: t4g.small $0.0208/시간, t4g.medium $0.0416, t4g.large $0.0832, t3.medium $0.052. 한 달 = 730시간
  - EBS gp3: $0.0912/GB-월
  - 공인 IPv4: $0.005/시간 (https://aws.amazon.com/vpc/pricing/)
  - T4g Unlimited 크레딧 넘친 몫: $0.04/vCPU-시간 (https://aws.amazon.com/ec2/pricing/on-demand/)
  - 인터넷으로 나가는 데이터: 계정 전체 매달 100GB 무료, 그다음 서울 $0.126/GB (같은 출처)
- 원화 금액은 적지 않음(환율 미확인)

### 2-3. 사이클 11과 만나는 곳: 사본을 내 PC로

- 가져오기는 내 PC에서 함 [확정] (ADR-0078, 힙 6GB). 그래서 AWS에서 수집하면 **사본을 내 PC로 내려받아야** 함
- 16.5GB를 그대로 받으면 주 1회 약 66GB/월 → 무료 100GB 안. 압축하면 줄어듦(얼마나 줄지 [확인 필요: 한 번 압축해 봄])
- 받는 방법 [안]: 서버에서 `sqlite3 .backup`으로 사본 → 압축 → 내 PC에서 `scp`로 받음

### 2-4. Windows → Linux로 바꿀 것 (dev 인계 거리)

| 지금 | Linux에서 |
|---|---|
| `resume.cmd` | `resume.sh`: 같은 인자(동시 서버·서버당·간격), 같은 설정 파일(`queue-by-ip.txt`), 이미 돌면 시작 안 함(`pgrep -f "crawl_catalog.py full"`), 로그 이름 `crawl-YYYY-MM-DD_HHmm.log` |
| `python -X utf8` | `python3 -X utf8` (Ubuntu 기본 Python 3) + `pip install beautifulsoup4` |
| 손으로 시작 | systemd 타이머(주 1회 전체 수집) [안]. 정기 실행은 사용자 승인 뒤에만 켬 |
| `limits-daily.cmd`(교보 구독형 공지 확인) | **AWS에서는 돌리지 않음**: 교보 구독형 서버(`*.dkyobobook.co.kr`)가 우리 IP를 막았으므로 새 IP로 다시 가지 않음 [확정] (프록시 원칙) → (2026-10-13 바뀜) 다른 우리 고정 IP에서는 동시 1건·1초로 소장형·공공도서관 구독을 받음 [확정] (사용자 승인, `crawl-method.md` 1절). 공지 확인 스크립트를 AWS에서 돌릴지는 [확인 필요] |
| 경로 `\` | `/` (코드는 `pathlib`이라 대부분 그대로일 것 [확인 필요: dev]) |

- 수집기 설정에 "이 서버에서 보내지 않을 호스트" 목록을 두고 `*.dkyobobook.co.kr`를 넣음 [안]

### 2-5. 사람 없이 돌고, Claude는 요약으로 판단

- 수집기는 끝나면 **요약 파일** 하나를 남김 [안]: 시작·끝 시각, 도서관별 성공·실패·건너뜀 수, 막힌 곳(403·시간 초과가 이어진 곳), 책 줄 수 변화(늘어남·빠짐), 전체 성공 기록이 없는 곳
- Claude가 요약을 보는 길 [안]: 그 서버에 Claude Code를 깔고 **Remote Control**로 폰에서 붙음. Remote Control은 Claude Code를 내 하드웨어에서 돌리고 폰·브라우저에서 이어 보는 기능 (https://code.claude.com/docs/en/remote-control, 확인 2026-10-12). Linux 서버에서 로그인하고 켜 두는 방법은 [확인 필요: 공식 문서 확인 + 시험]
- Claude가 볼 것과 사용자에게 물을 때는 dev `docs/maintenance/2-crawl.md`에 더함 (사이클 13 인계)

## 4. C안: Claude 클라우드에서 돌리고, 나가는 길만 AWS 서울 프록시로 (사용자 방향, 2026-10-12)

- 사용자: "만약에 받아주면 지금 단계에서는 수집 서버를 따로 안 둘꺼야", "나는 프록시도 고려해야한다고 생각해", "프록시 한 번 써보고 싶기도 했고"
- 그래서 2-2절 A·B안 대신 C안을 먼저 시험 [안]: 수집기는 Claude Code 클라우드 세션에서 돌고, 도서관 사이트로 가는 요청만 **우리 AWS 서울 EC2 한 대(고정 IP)의 프록시**를 거침. 프록시 원칙 "우리 국내 서버 고정 IP만"에 맞음 [확정] (`crawl-method.md` 1절)
- 프록시 서버 [안]: 가장 작은 EC2(t4g.nano·micro) + Squid 같은 전달 프록시. 나중에 서비스 EC2를 올리면 그 서버가 프록시를 겸할 수 있음
  - 열린 프록시가 되면 남이 씀 → **아이디·비밀번호 + 도서관 주소만 허용 + 교보 구독형 서버 거부**를 프록시에서 막음 [안]
  - 비밀번호는 클라우드 환경의 network secret로 둠(Pro·Max 요금제, 세션 안에서는 값이 안 보임) (https://code.claude.com/docs/en/cloud-environments, 확인 2026-10-12)

### 4-1. 시험해야 할 것 (C안이 되는지)

| 항목 | 왜 | 확인 방법 |
|---|---|---|
| 클라우드 세션에서 우리 프록시로 나갈 수 있는지 | 클라우드의 모든 바깥 요청은 이미 Anthropic 프록시를 거침. 그 위에 우리 프록시를 한 번 더 거치는 것(프록시 겹침)이 되는지 문서에 없음 [확인 필요] | 프로토타입: 환경 네트워크 Custom에 EC2 주소 허용 → 세션에서 `curl -x http://아이디:비번@EC2:포트 https://ipinfo.io/json` → 서울 IP가 나오면 됨 |
| 수집기가 프록시를 쓰는지 | 지금 수집기는 `urllib`로 바로 접속 | dev: `HTTPS_PROXY`를 읽거나 프록시 설정 인자 하나 [안] |
| 수집 DB 16.5GB를 둘 곳 | 클라우드 VM은 세션마다 새로, 회수되면 파일이 사라짐 | 사용자에게 질문 (S3에 두고 세션마다 받기 / 프록시 EC2 디스크에 두기 등) |
| 데이터 요금 | 사이트 → 프록시 → 클라우드로 오는 HTML이 모두 EC2에서 **나가는 데이터**(매달 100GB 무료, 그다음 서울 $0.126/GB). 전체 수집 한 바퀴에 HTML이 몇 GB인지 모름 [확인 필요] | 집 PC 다음 수집 때 받은 바이트 수 기록 |
| 오래 돌기 | 백그라운드 명령 기본 2시간 상한(`BASH_MAX_TIMEOUT_MS`로 올림), 쉬는 세션의 VM 멈춤 | **50분 시험 결과 (2026-10-12)**: 1분마다 `date -u` 기록, 50줄, 03:52:42~04:41:42 UTC, 90초 넘게 빈 곳 없음 → 대화 없이 백그라운드 명령이 도는 50분 동안 VM이 멈추지 않음. 2시간 넘는 실행(`BASH_MAX_TIMEOUT_MS` 올림)은 아직 시험 안 함 [확인 필요] |

- 시험 순서 [안]: ① CloudShell 서울(1절)로 사이트가 받아 주는지 → ② 프록시 EC2를 띄우고 클라우드 세션에서 프록시 겹침 시험 → ③ 되면 DB 둘 곳·데이터 요금을 정함 → 안 되면 집 PC

## 5. 플랜 B: 국내 저가 서버에 우리 프록시 (조사, 2026-10-12)

- 사용자: "일단aws해보고 안되면 국내프록시할거야 플랜b이긴 하지만 조사해줘". 프록시 종류는 "국내 저가 서버에 직접" [확정] (사용자 선택, 2026-10-12). IP를 파는 프록시 서비스는 쓰지 않음(원칙)
- 순서 [확정]: AWS 서울(4절) 먼저 → 안 되면 국내 저가 서버
- 조사: 공식 요금·약관 페이지(가입·로그인 안 함), 확인 2026-10-12. 금액은 따로 적지 않으면 VAT 별도

| 업체·요금제 | 사양 | 월 요금 | 고정 IPv4 | 나가는 데이터 무료 / 초과 | 기타 | 월 100GB 보낼 때 |
|---|---|---|---|---|---|---|
| iwinv vgna_1_n (공유형) | 1 vCPU / 1GB / NVMe 25GB | 5,600원 (일 210원) | 1개 포함 | 하루 20GB(월 약 600GB), 초과 70원/GB부터, **해외로 보내도 같은 값** | 일 단위 후불 | 약 5,600원 |
| 카페24 가상서버 일반형 | 1GB / SSD 30GB (vCPU 확인 못 함) | 9,000원 (VAT 포함) | 1개 제공 | 월 300GB, 초과 165원/GB | 설치비 22,000원. 유의사항 "해외 VPN 서비스로는 사용할 수 없으며" | 9,000원 + 첫 달 설치비 |
| 가비아 클라우드 Gen2 Micro | 1 vCPU / 1GB, 디스크 별도(최소 50GB) | 10,000원 | 4,000원/월 별도 | 국내 1TB, **해외 50GB만 무료, 초과 500원/GB** | 시간 과금 | 약 19,750원 |
| 네이버 클라우드 Micro-g3 | 1 vCPU / 1GB / 10GB | 10,850원 (결제 등록 뒤 1년 서버비 무료) | 약 4,032원/월 별도 | 20GB, 초과 100원/GB | 성능 보장 없음 | 1년간 약 12,000원, 뒤 약 22,900원 |
| NHN Cloud t2.c1m1 | 1 vCPU / 1GB, 디스크 별도 | 약 17,520원 (시간 24원 × 730) | 약 4,088원/월 별도 | 1GB, 초과 100원/GB. "국제 네트워크 전송량"이 많으면 제한할 수 있음 | | 약 33,800원 |
| KT Cloud D1 1vCore·1GB | 1 / 1GB / 50GB | 22,500원 | 기본 포함 여부 확인 못 함, 추가 5,000원/월 | 512GB(페이지 안에서 1TB라고도 적힘), 초과 90원/GB | 약정 할인·위약금 | 약 22,500원~ |
| (AWS) Lightsail 서울 IPv4 묶음 | 2 vCPU / 0.5GB / SSD 20GB | $5 | 붙어 있으면 무료 | 1TB 포함, 초과 $0.13/GB (Lightsail FAQ, 2026-10-12 다시 확인. 처음 적은 $0.126은 EC2 값) | | $5 |

- **해외로 나가는 데이터에 주의**: 수집기가 Claude 클라우드(미국 IP)에 있으면 프록시가 받은 HTML을 미국으로 보냄 → 해외 송출. 가비아(해외 50GB 무료 뒤 500원/GB)·NHN(국제 전송 제한 문구)은 맞지 않음. iwinv는 국내·해외 같은 값
- 약관: 국내 업체 약관에서 프록시·크롤링을 콕 집어 금지한 문구는 찾지 못함. 카페24는 "해외 VPN 서비스" 금지 문구가 있음. 모든 곳에 "과다 트래픽·다른 시스템 방해 시 이용 정지" 일반 조항이 있음 → 예절(IP당 1건·1초)을 지키면 수집 쪽 트래픽은 작을 것으로 봄 [안]
- 플랜 B 후보 [안]: **iwinv vgna_1_n** (가장 싸고, IP 포함, 해외 송출 같은 값). 다음 카페24
- AWS 쪽도 EC2 대신 **Lightsail 서울 $5**(고정 IP 무료, 1TB 포함)로 프록시를 두면 2-2절 EC2 계산보다 쌈 [안]. 메모리 0.5GB로 Squid가 충분한지 [확인 필요: 시험]
- 확인 못 함: iwinv 정지·재시작 뒤 IP 유지·설치비, 카페24 vCPU·최소 기간·IP 고정 여부, KT 기본 IP 포함, NHN·가비아 약관 본문, Lightsail 세금·인바운드 계산
- 출처:
  - iwinv https://www.iwinv.kr/server/server , https://docs.iwinv.kr/docs/billing/iwinv_price_policy , 약관 https://www.iwinv.kr/treaty/treaty/all
  - 카페24 https://hosting.cafe24.com/?controller=new_product_page&page=virtual
  - 가비아 https://www.gabiacloud.com/virtual_service/ , https://www.gabiacloud.com/storage/cloudstorage/
  - 네이버 클라우드 https://www.ncloud.com/product/compute/ssdServer?region=KR#pricing , https://www.ncloud.com/product/compute/server?region=KR#pricing , 약관 https://www.ncloud.com/policy/terms/svc
  - NHN https://www.nhncloud.com/kr/pricing?c=compute&s=instance&r=KR1 , https://www.nhncloud.com/kr/pricing?c=network&s=floating-ip&r=KR1
  - KT https://cloud.kt.com/product/productDetail?prodId=P000000005 , https://cloud.kt.com/terms/service-term
  - Lightsail https://aws.amazon.com/lightsail/pricing/ , https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-static-ip-addresses-in-amazon-lightsail.html

## 3. 확인 필요

| 항목 | 확인 방법 |
|---|---|
| AWS 서울 IP를 4곳이 받아 주는지 | 1절 CloudShell 시험 |
| 수집기 메모리·CPU (2GiB로 되는지) | 집 PC에서 다음 수집 때 측정 |
| 사본 압축 크기 | 집 PC에서 한 번 압축 |
| Remote Control을 Linux 서버에서 켜 두는 방법 | 공식 문서 확인 + 시험 |
| 전체 수집 한 바퀴 시간 (서버를 늘 켤지, 수집 때만 켤지) | 다음 전체 수집 기록 |
