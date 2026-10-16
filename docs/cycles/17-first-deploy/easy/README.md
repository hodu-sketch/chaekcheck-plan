# 쉬운 설명 페이지 (사이클 17 첫 배포)

| 파일 | 설명하는 것 | 원문 | 남은 결정 |
|---|---|---|---|
| [2026-10-13-scope-decisions.html](2026-10-13-scope-decisions.html) | 사이클 17 범위: 목표, 포함 9가지, 제외, 완료 기준, 도메인 | `../scope.md` | 결정됨: 6개 (승인 4, 미승인 2 → 대출 조회 프록시 포함, 비밀 값은 Parameter Store·Secrets Manager), 2026-10-13 |
| [2026-10-13-spec-decisions.html](2026-10-13-spec-decisions.html) | 명세 남은 값: 나머지 API 요청 한도, 비밀 값 서비스, Grafana 보는 곳, 백업 보관 개수 | `../spec.md` R3·R5·R9·R10 | 결정됨: 4개 승인 (2026-10-13) |
| [2026-10-13-flow-decisions.html](2026-10-13-flow-decisions.html) | 화면 흐름: 공개 주소·로그인·429·서버 멈춤·Grafana, 나머지 화면 429 표시, 멈춤 화면, Grafana 대시보드 | `../flow.md` | 결정됨: 3개 승인 (2026-10-13) |
| [2026-10-13-design-decisions.html](2026-10-13-design-decisions.html) | 설계: 네트워크 둘, 비밀 값 스크립트, 포기 횟수 카운터, 지표 포트, 429 exporter, cAdvisor, 백업 범위·가져오기, 조회 서버 꺼 둠, 이미지 옮기기 | `../architect-proposal.md` | 10개 |
| [2026-10-14-design-delta-review.html](2026-10-14-design-delta-review.html) | 설계 정리(구성도·흐름·바뀌는 것), 비밀 값 범위·이름, User-Agent 연락처, 운영 DB SQL 길, design-delta 확정 + ADR-0103 | `../design-delta.md`, ADR-0103 초안 | 4개 |
| [2026-10-14-design-easy.html](2026-10-14-design-easy.html) | 설계 전체를 쉽게: 들어오는 길, 서버 안 구성, 비밀 값, 모니터링, 백업, 요청 한도, 프록시(뒤에) | 사이클 17 전체 | 설명 (결정 없음) |
| [2026-10-14-proxy-vendor.html](2026-10-14-proxy-vendor.html) | 프록시 업체 고르기: 업체에 먼저 물을 것(go.kr), 업체 비교, 공공기관 접속 공개 자료, 고르는 순서 | `../research.md` 3·4·10절 | 2개 |
| [2026-10-14-deploy-decisions-remote.html](2026-10-14-deploy-decisions-remote.html) | 첫 배포 결정 3가지(호스트 EC2·기간 6개월·비밀값 IAM) 승인/미승인/기타 버튼 — claude.ai 비공개 Artifact로 밖에서 선택·저장. URL: https://claude.ai/artifact/GCMZe8BbAPeCBKSKxwuWtC | `../research.md` 12절, ADR-0103, scope.md | 3개 |
| [2026-10-14-your-todo.html](2026-10-14-your-todo.html) | 지금 사용자가 직접 할 일 5가지(예산·EC2·IAM 역할·도메인·카카오) 쉬운 단계 안내 | scope.md, `../research.md` 12절, ADR-0103·0104 | 0개 |
| [2026-10-14-cloudflare-tunnel-decision.html](2026-10-14-cloudflare-tunnel-decision.html) | AWS에서 계속 쓸 때 Cloudflare Tunnel 유지 여부(①유지/②CF프록시/③DNS만/④AWS Route53+CloudFront/⑤ALB) | ADR-0103, research 3·12절 | 1개 |
| [2026-10-15-remote-deploy-status.html](2026-10-15-remote-deploy-status.html) | 원격(노트북)용 배포 현황+결정 페이지: 터널 선택 버튼 저장(db), 할 일·확인 항목 보기. claude.ai 비공개 Artifact FeYpG6XqGhgQbabEgwWYB8 | scope.md, research 12~15절, ADR-0103·0104 | 1개(터널) |
| [2026-10-16-aws-credits-and-monitoring.html](2026-10-16-aws-credits-and-monitoring.html) | 오늘 AWS 작업 요약: 무료 크레딧 $200 전부 적립(활동 5개), 만든 자원 전부 삭제, 누르면 안 되는 버튼 3개, CloudWatch 모니터링 | `../research.md` 17절, AWS 무료티어 공식 문서 | 1개(확인) |
| [2026-10-15-aws-console-steps.html](2026-10-15-aws-console-steps.html) | 노트북에서 AWS 콘솔을 따라 하는 안내: 1 예산 → 2 EC2(리전·Ubuntu Arm·키 페어·고정 IP) → 3 IAM 역할(정책 JSON) | scope.md, `../research.md` 12절, ADR-0104 | 0개 |
