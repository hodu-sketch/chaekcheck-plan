# 사이클 26 조사

## 1. 모든 책 표지를 둘 곳 (2026-10-28, 명세 결정 #12 기타 → #13)

- 사용자: "디스크는 뭐 따로 S3이라던가 프리티어에서 할 수 있는 거 생각해보자 아니면 라이트세일로옮긴다던가" (2026-10-28)
- 크기: 200px JPEG 장당 약 9~11KB (dev `plan-feedback.md`: 5만 장 약 450MB, 29,586장 331MB) × 책 1,340,875권 → 약 12~15GB [추론]
- 운영: 시드니 EC2 t4g.small, EBS gp3 30GB, 여유 약 11GB (dev 기록 2026-10-27), 책 표 다시 반영할 때 최저 여유 약 3.4~3.9GB
- 확인일은 모두 2026-10-28

### 1-1. AWS Free plan [확정]

| 항목 | 내용 | 출처 |
|---|---|---|
| 크레딧 | 가입 $100 + 활동 최대 $100 | https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html |
| 기간 | 6개월 또는 크레딧 소진 중 먼저. 끝나면 계정 정지, 90일 안에 Paid plan으로 올리지 않으면 계정·데이터 삭제. 올리면 남은 크레딧은 이후 청구에 적용 | 같은 문서, https://aws.amazon.com/free/free-tier-faqs/ |
| Free plan 중 과금 | 사용료는 크레딧에서 빠짐 | 같은 문서 |
| 크레딧 만료 | FAQ 안에서 6개월·12개월 표현이 섞임 → 콘솔 Settings에서 확인 [확인 필요] | free-tier-faqs |
| S3 | 크레딧 적용. 예전 "5GB 12개월 무료"는 지금 가격 페이지에 없음 | https://aws.amazon.com/s3/pricing/ |
| CloudFront | Always free: 매달 전송 1TB, 요청 1,000만 건 | https://aws.amazon.com/free/networking/ |
| 인터넷 전송 | 매달 처음 100GB 무료(서비스 합산) | https://aws.amazon.com/s3/pricing/ |
| Lightsail | Free plan에서도 크레딧으로 사용 | https://aws.amazon.com/free/compute/lightsail/ |

### 1-2. 시드니(ap-southeast-2) 가격 [확정]

| 항목 | 가격 | 출처 |
|---|---|---|
| EBS gp3 | $0.096/GB-월 | AWS 가격 데이터 https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/ec2/USD/current/ebs.json |
| S3 Standard | $0.025/GB-월, PUT $0.0055/1,000건, GET $0.00044/1,000건 | https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/ap-southeast-2/index.json |
| 인터넷 전송 | 100GB 무료 뒤 $0.114/GB | https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSDataTransfer/current/ap-southeast-2/index.json |
| Lightsail 2GB 번들 | 2 vCPU, SSD 60GB, $12/월(IPv4). 시드니는 번들 전송량 절반 | https://aws.amazon.com/lightsail/pricing/ |
| Lightsail 블록 스토리지 | $0.10/GB-월 | 같은 페이지 |
| Lightsail 버킷 | $1/월 5GB, $3/월 100GB, $5/월 250GB | 같은 페이지 |

### 1-3. EBS 늘리기 [확정]
- Elastic Volumes로 인스턴스를 멈추지 않고 크기를 늘림. 줄이기는 안 됨. 24시간에 4번까지. 바꾸는 작업은 무료 — https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html
- 그 뒤 `growpart` + `resize2fs`(ext4) 또는 `xfs_growfs`로 파일시스템을 늘림, 먼저 스냅샷 권장 — https://docs.aws.amazon.com/ebs/latest/userguide/recognize-expanded-volume-linux.html

### 1-4. Cloudflare R2 [확정]
- 매달 무료: 저장 10GB-월, 쓰기 100만 건, 읽기 1,000만 건, 내보내는 전송 무료. 넘으면 저장 $0.015/GB-월 — https://developers.cloudflare.com/r2/pricing/
- 운영용 공개 주소는 Cloudflare에 올린 커스텀 도메인 필요(r2.dev는 개발용) — https://developers.cloudflare.com/r2/buckets/public-buckets/

### 1-5. 그림 줄이기
- WebP 손실 압축은 같은 품질에서 JPEG보다 25~34% 작음 — https://developers.google.com/speed/webp [확정]
- 브라우저 지원 97.18% — https://caniuse.com/webp [확정]

### 1-6. 비교 (전송은 월 1GB 미만으로 보아 무료 한도 안 [추론])

| 방법 | Free plan 동안 | 끝난 뒤 | 서비스에서 바뀌는 것 |
|---|---|---|---|
| (a) EBS 30 → 50GB | 크레딧에서 월 약 $1.92 | 월 약 $1.92 | 거의 없음. nginx `/covers/`, CSP 그대로. 다시 줄일 수 없음 |
| (b) S3 (+CloudFront) | 저장 월 약 $0.38 + 첫 업로드 PUT 134만 건 약 $7.4(한 번) | 월 약 $0.4 | 버킷·업로드 단계·IAM 역할. 다른 도메인이면 CSP `img-src` 바뀜 |
| (c) Lightsail로 이사 ($12, 60GB) | 크레딧에서 월 $12 (서버 포함) | 월 $12 | 서버 전체 이사(DB, DNS). 지금 EC2 비용과의 비교는 확인 못 함 |
| (d) Cloudflare R2 | 월 약 $0.08 (10GB 넘는 5GB) | 같음 | 새 계정·키·도메인 설정, CSP 바뀜, 업로드 단계 |
| (e) WebP로 줄여 지금 디스크에 | $0 | $0 | 약 8~11GB [추론]로 여유 11GB와 거의 같아 곧 모자람. 134만 장 다시 만들기, 경로·형식 바뀜 |

- 방법과 상관없이: Free plan은 2027-04 무렵 Paid plan으로 올려야 계정이 정지·삭제되지 않음
