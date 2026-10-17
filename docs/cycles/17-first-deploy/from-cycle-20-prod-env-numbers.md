# 사이클 20 → 사이클 17: 운영 숫자를 prod.env 한 곳에 (인계에 넣을 것)

- 쓴 날: 2026-10-16, 사이클 20 세션. 사용자: "이런 개수 말이야 변수로 통합적으로 관리 가능하도록 했으면 해 설정이라던가. 그리고 이런 것들 문서 링크 잘 해서 AI가 잘 보도록 정리하고"
- 결정 페이지: `docs/cycles/20-lookup-status-and-extension/easy/2026-10-16-review-decisions.html` #25 [확정] (사용자 승인, 2026-10-16)

## 할 것

1. `deploy/prod/prod.env` 견본(사이클 17)에 **"대출 조회 숫자" 묶음**을 둔다. 각 줄 위에 한 줄 설명과 `docs/settings-index.md`(plan)·`docs/maintenance/settings-index.md`(dev) 해당 줄을 가리키는 주석
2. 서비스(Spring) 값은 `application.yml`을 고치지 않고 Spring 환경 변수 규칙(점→`_`, `-` 빼기, 대문자)으로 덮어쓴다 — 이름 목록은 plan `docs/settings-index.md` 8절 [확정] (Spring Boot 공식 문서 "Binding From Environment Variables", https://docs.spring.io/spring-boot/reference/features/external-config.html , 2026-10-16 확인)
3. nginx와 서비스가 함께 쓰는 값만 짧은 `LOOKUP_*` (사이클 20 설계 #12), 화면은 `VITE_*`, 확장은 `extension/config.js`
4. 기본값은 `application.yml`에 그대로 두고, `prod.env`에는 운영에서 바꾼 값만 실제로 적고 나머지는 주석으로 기본값을 보인다 [안: 쓰는 방식은 dev가 맞춤]

## 나가는 길 설정 운영 값 (2026-10-18)

- `CHAEKCHECK_AVAILABILITY_EGRESS_MODE=proxy-only` (fetch-service도 같은 값, 이름은 dev 1-15) — 운영은 **프록시만**: 시드니 EC2 자기 IP로는 도서관에 요청하지 않음 [확정] (사용자: "나는 ec2 주소에서 직접 도서관 조회하는 건 설정으로 분리하자고 했는데;; 프록시만 사용하도록 하고", 2026-10-18)
- 코드 기본값은 `all` 그대로(로컬 개발 PC는 프록시 자격이 없을 수 있음). 운영 `prod.env`에서만 `proxy-only`
- 결과: Webshare 길이 모두 멈추면 EC2로 넘어가지 않고 모든 도서관이 「확인하지 못한 도서관」(`from-cycle-20-proxy-only.md` 3), 비표준 포트 사이트(`:442`·`:8088`, Webshare로 연결 안 됨)는 늘 「확인하지 못한 도서관」
- 비표준 포트 사이트를 EC2로 예외 처리하지 않음 [확정] (사용자: "포트 붙은 도서관은 EC2로 예외 처리 안 할 거야 그냥 못하는 걸로 할거야", 2026-10-18)
