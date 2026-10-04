# ADR-0051: 저장과 탈퇴가 겹쳐도 지워진 계정의 자료가 남지 않게

Status: Accepted
Date: 2026-10-04
Cycle: 06-my-libraries
Supersedes: 없음

## 배경

사이클 06 명세 AC-12는 "지워진 계정의 줄이 생기지 않는다"입니다(사용자 승인). `/api/v1/me/**` 요청은 이미 요청마다 계정이 있는지 확인합니다(dev `AccountJwtAuthenticationConverter`, 2026-10-04 확인). 남는 틈은 "계정 확인 → 다른 탭에서 탈퇴 완료와 삭제 처리 → 우리 저장이 들어감"입니다. 또 탈퇴 이벤트 처리가 실패하면 발행 저장소에 기록이 남는데(ADR-0041), 지금은 다시 처리하는 설정이 없습니다.

## 결정

1. `auth`가 공개 기능 하나(`AccountPresence.lockIfExists(AccountId)` [이름은 dev가 정함])를 두고, 호출한 트랜잭션 안에서 `auth.account` 줄을 잠급니다(`SELECT … FOR NO KEY UPDATE`). `mylibrary`는 모든 저장의 처음에 이것을 부르고, 계정이 없으면 401입니다. 같은 계정의 저장이 한 줄로 서므로 20곳 상한도 동시 요청에서 정확합니다.
2. `spring.modulith.events.republish-outstanding-events-on-restart: true`로 서버를 다시 켤 때 남은 이벤트를 다시 처리합니다. 삭제 처리는 두 번 해도 결과가 같습니다.

## 이유 (사용자 발언)

- [이유 미확인] (제안 → 승인, 2026-10-04). 지켜야 할 조건은 spec AC-12

## 근거

- PostgreSQL 문서 13.3 Row-Level Locks: DELETE는 FOR UPDATE 잠금을 잡고, FOR NO KEY UPDATE는 FOR UPDATE·FOR NO KEY UPDATE와 충돌함 (https://www.postgresql.org/docs/current/explicit-locking.html, 2026-10-04 확인 — architect 서브에이전트)
- Spring Modulith Events: `republish-outstanding-events-on-restart`, 2.0부터 `IncompleteEventPublications`·`FailedEventPublications` (https://docs.spring.io/spring-modulith/reference/events.html, 2026-10-04 확인 — architect 서브에이전트). 2.1.1에서 실패 상태 기록까지 다시 처리하는지는 [확인 필요: dev 시험]

## 검토한 대안

### A안: 계정 줄 잠금 + 재시작 때 다시 처리 (채택)
- 장점: 틈이 없어지고 20곳 상한의 동시 요청도 함께 해결. 설정 한 줄
- 단점: `auth` 공개 기능 하나, 두 모듈이 한 트랜잭션을 함께 씀. 실패 기록은 다음 재시작까지 남음

### B안: 지금 확인만 씀
- 장점: 바꿀 것 없음
- 단점: 같은 사람이 거의 동시에 저장·탈퇴하면 줄이 영영 남음
- 채택하지 않은 이유: [이유 미확인]

### C안: 하루 한 번 대조해 지움
- 장점: 모듈을 서비스로 나눠도 그대로 씀
- 단점: 최대 하루 동안 줄이 남아 AC-12에 엄밀히 맞지 않음
- 채택하지 않은 이유: [이유 미확인]

### D안: 주기 작업으로 이벤트 다시 처리
- 장점: 다시 켜지 않아도 회복
- 단점: 작업을 둘 모듈과 주기를 정해야 함
- 채택하지 않은 이유: [이유 미확인]

## 결과

- 좋아지는 점: 탈퇴한 계정의 지역·도서관이 남지 않음. 20곳 상한이 정확함
- 감수하는 점: `auth`의 `last_login_at` 갱신과 잠깐 기다릴 수 있음(밀리초 단위 추정). 서버가 여러 대일 때 재시작 다시 처리의 동작은 문서에 없음 [확인 불가]
- 나중에 분리할 때: 트랜잭션을 나눠 쓸 수 없으므로 잠금 대신 C안(하루 한 번 대조)으로 바꿈. 서버를 여러 대로 늘리면 D안을 다시 봄
- 관련: ADR-0041(탈퇴 이벤트와 발행 저장소), ADR-0048
