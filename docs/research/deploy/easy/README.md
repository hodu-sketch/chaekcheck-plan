# 쉬운 설명 페이지 (배포 조사)

| 파일 | 설명하는 것 | 원문 | 남은 결정 |
|---|---|---|---|
| [2026-10-04-aws-layout.html](2026-10-04-aws-layout.html) | AWS에 올릴 때 S3·CloudFront·RDS로 나눌지: 세 가지 모양과 공식 문서 확인 결과 | `../aws-layout.md` | 결정됨: EC2 한 대로 올림, 나중에 S3 + CloudFront (2026-10-04) |
| [2026-10-12-ec2-size.html](2026-10-12-ec2-size.html) | 가져오기를 내 PC에서 할 때 EC2 크기: t4g.medium 4GiB, gp3 40GiB, ARM 이미지 시험 | `../aws-layout.md` 6절 | 없음 (3개 승인, 2026-10-12) |
| [2026-10-12-memory-kinds.html](2026-10-12-memory-kinds.html) | 서버 메모리 종류별 역할: Java 힙·힙 밖, PostgreSQL 공유 버퍼·work_mem·maintenance_work_mem·자동 청소·temp_buffers·effective_cache_size, Linux 파일 캐시, 반영 때만 늘어나는 것 | `../aws-layout.md` 6절, 사이클 11 설계 #12 | 설명 (결정 없음) |
