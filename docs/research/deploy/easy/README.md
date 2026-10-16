# 쉬운 설명 페이지 (배포 조사)

| 파일 | 설명하는 것 | 원문 | 남은 결정 |
|---|---|---|---|
| [2026-10-04-aws-layout.html](2026-10-04-aws-layout.html) | AWS에 올릴 때 S3·CloudFront·RDS로 나눌지: 세 가지 모양과 공식 문서 확인 결과 | `../aws-layout.md` | 결정됨: EC2 한 대로 올림, 나중에 S3 + CloudFront (2026-10-04) |
| [2026-10-12-ec2-size.html](2026-10-12-ec2-size.html) | 가져오기를 내 PC에서 할 때 EC2 크기: t4g.medium 4GiB, gp3 40GiB, ARM 이미지 시험 | `../aws-layout.md` 6절 | 없음 (3개 승인, 2026-10-12) |
| [2026-10-12-memory-kinds.html](2026-10-12-memory-kinds.html) | 서버 메모리 종류별 역할: Java 힙·힙 밖, PostgreSQL 공유 버퍼·work_mem·maintenance_work_mem·자동 청소·temp_buffers·effective_cache_size, Linux 파일 캐시, 반영 때만 늘어나는 것 | `../aws-layout.md` 6절, 사이클 11 설계 #12 | 설명 (결정 없음) |
| [2026-10-12-hosting-options.html](2026-10-12-hosting-options.html) | 2주 클라우드 체험 업체(국내외 4GiB급 요금·무료 혜택), 노트북으로 옮기기, GitHub 연동 화면 무료 호스팅, 수집 프록시(속도·종류·원칙), 과한 요청 막기·모니터링, 대출 현황 조회 1초 간격 | `../hosting-options.md` | 7개 |
| [2026-10-12-ip-principle-decisions.html](2026-10-12-ip-principle-decisions.html) | 나가는 IP 원칙 바꾸기: 우리를 막은 교보 구독형 서버에 다른 우리 IP로 대출 조회·다시 받기를 보낼지, 새 원칙 문장 | `../../ebook-catalog/crawl-method.md` 1절, `../hosting-options.md` 6절 | 3개 |
| [2026-10-13-deploy-choices-mobile.html](2026-10-13-deploy-choices-mobile.html) | 폰용 정리: 배포 전에 고를 것 10가지(2주 서버 업체, 노트북으로 옮기기, 화면 호스팅, 진짜 사용자 IP, 모니터링, 1초 간격, 교보 서버 서비스 조회·수집, 원칙 문장, 수집 속도), 그림 포함 | `../hosting-options.md`, `../../ebook-catalog/crawl-method.md` 1절 | 대화창에서 질문 1~10 |
| [2026-10-13-fetch-count-decisions.html](2026-10-13-fetch-count-decisions.html) | 교보 서버 서비스 조회 동시 3건을 본 서비스에서 셀지 조회 서버(fetch-service)마다 셀지, 느려질 때 스스로 줄이기 | `../../ebook-catalog/crawl-method.md` 1절, ADR-0011 | 2개 |
| [2026-10-13-adr-0094-draft.html](2026-10-13-adr-0094-draft.html) | ADR-0094 초안: 우리를 막은 서버에는 막힌 IP에서만 보내지 않음, 교보 구독형 서버 서비스 조회 조회 서버마다 동시 3건 | 초안(scratchpad), `../../ebook-catalog/crawl-method.md` 1절 | 1개 |
| [2026-10-13-lookup-proxy-decisions.html](2026-10-13-lookup-proxy-decisions.html) | 대출 조회에 프록시 쓰기: 쓰는 방법(조회 서버 여러 대·업체 프록시), 프록시 종류, 여러 IP로 나눌 때 도서관이 받는 양, 한 IP가 막혔을 때, User-Agent | `../../ebook-catalog/crawl-method.md` 1절, ADR-0011, ADR-0094 | 4개 |
| [2026-10-13-lookup-ua-decisions.html](2026-10-13-lookup-ua-decisions.html) | 대출 조회 요청의 User-Agent: 우리 이름을 둘지 일반 브라우저처럼 보낼지, 앞 결정(IP마다 따로 세기, 막힌 IP만 멈추기)과 합쳤을 때 사이트가 보는 모습, 배경 자료 | `../hosting-options.md` 결정 줄, `../../ebook-catalog/crawl-method.md` 1절 | 1개 |
| [2026-10-13-adr-0095-draft.html](2026-10-13-adr-0095-draft.html) | ADR-0095 초안: 서비스 대출 조회의 세 나가는 길, IP마다 따로 세기, 막힌 IP만 멈춤, 일반 브라우저 User-Agent, ADR-0094 서비스 조회 부분 고침 | 초안(scratchpad), `../hosting-options.md` 결정 줄 | 1개 |
| [2026-10-16-multi-source-ip.html](2026-10-16-multi-source-ip.html) | 서버 한 대에 IP를 여러 개 붙여 대출 조회를 나눠 보내기: EC2·Lightsail·iwinv·Vultr·Alibaba·Webshare 값과 상한, 정적 주거용 허용 | `../multi-source-ip.md`, ADR-0095 | 3개 |
| [2026-10-16-multi-source-ip-followup.html](2026-10-16-multi-source-ip-followup.html) | 첫 배포부터 프록시: EC2 1 + Webshare 한국 정적 주거용 20개 + 바뀌는 주거용 1GB, 고정 IP 먼저, 바뀌는 주거용 동시 5건·연달아 5번 막히면 쉼·GB 90%에서 멈춤 | `../multi-source-ip.md` 6절, ADR-0095 | 5개 |
| [2026-10-16-proxy-limits-alerts.html](2026-10-16-proxy-limits-alerts.html) | 프록시 한도와 알림: 길마다 한도(EC2·Webshare 데이터·동시 연결·정부 사이트), CloudWatch 경보 → 메일, 알릴 일 다섯 가지, 정적 20개 90% 멈춤, 업체 오류면 업체 길 전체 멈춤, `.go.kr`은 고정 IP로만 | `../multi-source-ip.md` 8절 | 5개 |
| [2026-10-16-proxy-limits-alerts-artifact.html](2026-10-16-proxy-limits-alerts-artifact.html) | 위 페이지의 원격용 Artifact 사본(승인·미승인·기타 저장). https://claude.ai/artifact/2D8Py6Sxj2i22LgsS4aiZR | 같음 | 같음 |
| [2026-10-16-webshare-setup.html](2026-10-16-webshare-setup.html) | Webshare 한국 정적 주거용 20개: 가입·구매(미리 채운 링크)·IP Authorization·목록 받기·접속 시험(`../tools/proxy_check.py`)·결과 판정. Artifact https://claude.ai/artifact/CMoP6FXwVv6ecdoeirJrqB | `../multi-source-ip.md` 9절 | 없음(절차) |
| [2026-10-16-adr-0130-draft.html](2026-10-16-adr-0130-draft.html) | ADR-0130 초안 → 승인됨(ADR-0095 대신: 서버 IP + Webshare 한국 정적 20개, 두 방식 지원, 바뀌는 주거용 나중, 한도 전 멈춤·메일)과 사이클 17 인계 파일 | `../../../adr/0130-lookup-egress-webshare-kr-static-and-alerts.md`, `../../../cycles/17-first-deploy/from-research-lookup-egress.md` | 2개 |
