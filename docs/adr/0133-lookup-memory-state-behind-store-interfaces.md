# ADR-0133: 브라우저 번호 장부는 가장 오래 안 쓴 줄을 밀어내는 LRU 표로 두고, 대출 조회의 메모리 상태는 모두 저장소 인터페이스 뒤에 두어 설정 하나로 고른다 (지금은 메모리만, Redis는 나중)

Status: Accepted (2026-10-17, 사용자 승인 — 사이클 20 설계 검토 #1)
Date: 2026-10-17
Cycle: 20-lookup-status-and-extension
Supersedes: 없음

## 배경
사이클 20 3단계의 브라우저 번호 장부(`LookupClientLedger`, 이름 [안])는 5만 줄·1일이고, 차면 503으로 거절하지 않고 오래된 줄을 밀어내기로 정했다(전반 점검 #10, 사용자: "가. 오래된 줄 밀어내기 … 이걸로 가자", 2026-10-17). 설계는 이것을 Caffeine 크기 상한으로 만들려 했다. 그런데 Caffeine 공식 설계 문서는 크기 상한(Window TinyLFU)이 "retain the entry with the highest historic usage"이고, 빈도를 부풀리는 공격이면 "all new arrivals being rejected"가 될 수 있다고 적는다(https://github.com/ben-manes/caffeine/wiki/Design , 2026-10-17 확인) [확정]. 장부를 채우는 공격 중이면 정상 사용자가 방금 받은 번호가 곧바로 밀려나, 다음 올리기가 400 `invalid_client_key` → 새 번호 → 다시 밀림이 될 수 있다.

또 대출 조회는 캐시·계획 보관함·장부·잠금·IP 울타리 셈 등 메모리 상태가 많아, 나중에 서버를 여러 대로 늘리거나 Redis로 옮길 때 고칠 곳이 흩어질 수 있다.

## 결정
- **장부는 LRU 표** [확정] (사용자 승인, 2026-10-17, 설계 검토 #1): 차면 마지막 쓴 시각이 가장 이른 줄을 밀어낸다. 구현은 Java `LinkedHashMap`(접근 순서, `accessOrder=true`) + `removeEldestEntry` + 잠금 하나. 요구: **방금 받은 번호는 밀려나지 않는다**(dev 단위 시험으로 지킴 [안]). Caffeine 크기 상한은 장부에 쓰지 않는다. `LinkedHashMap`은 동기화되지 않고 접근 순서에서는 `get`도 구조 변경이라 바깥 잠금이 필요함(https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html , 2026-10-17 확인) [확정]. 상한 5만 줄·1일·밀려난 사람의 화면 처리(400 → 조용히 새 번호)는 그대로(ADR-0119).
- **메모리 상태는 저장소 인터페이스 뒤** [확정] (사용자 승인, 2026-10-17, 설계 검토 #1): `availability`가 메모리에 두는 공유 상태(검색 쪽·상세 판정·확장 결과 캐시, `SearchPlanStore`, `LookupClientLedger`, 번호 잠금, IP 울타리 셈, 상태 불 메모, 마지막 DB 오류 시각, `SearchSlots.lastRefusedAt`, `HostQueueBoard`)는 저마다 작은 인터페이스 뒤에 두고, 부르는 쪽은 인터페이스만 안다. 이미 있는 `SearchPageCache`·`DetailVerdictCache`·`HostThrottle`과 같은 방식. 인터페이스는 그 상태를 만드는 개발 단계(1·2·3단계)에서 함께 만든다.
- **설정 하나로 구현을 고름** [확정] (사용자 승인, 2026-10-17, 설계 검토 #1): `chaekcheck.lookup.state-store`(이름 [안]) = `memory`. 사이클 20에서는 `memory`만 만든다. Redis 구현·Redis 컨테이너는 사이클 20·17에 없다(나중).
- 서버마다 따로 두는 것이 맞는 상태(해석 자리 `ParseSlots`처럼 그 서버의 힙을 지키는 것, 나가는 IP가 서버마다 다를 때의 호스트 간격)는 인터페이스로 빼지 않아도 된다 [안].

## 이유 (사용자 발언)
- "이렇게 하고 나중에 redis전환이 쉽도록 다 구조랑 문서화 해둬 메모리로 관리하는 건 (옵션 등으로 redis전환/내부메모리 사용관리하는 것도 방법인 것 같아)" (2026-10-17, 설계 검토 #1 승인과 함께)
- LRU 표로 바꾸는 것: 제안 → 승인 (2026-10-17, 설계 검토 #1). 제안의 근거는 위 Caffeine 공식 문서(배경)

## 검토한 대안
### A안: LRU 표 + 저장소 인터페이스 + 설정 하나, 지금은 메모리만 (채택)
- 장점: 공격 중에도 방금 받은 번호는 남음. 나중에 Redis로 옮길 때 부르는 곳을 고치지 않고 구현 하나와 설정 값만 바꿈. 지금은 컨테이너·메모리를 더 쓰지 않음
- 단점: 장부에 잠금 하나가 생겨 동시에 많은 요청이 오면 그 잠금에서 줄을 섬(요청마다 짧은 표 작업 하나라 개인 서버 규모에서는 작음 [안: 어림]). 인터페이스 수가 늘어남
### B안: Caffeine 크기 상한 그대로
- 장점: 이미 쓰는 라이브러리, 잠금 없이 빠름
- 단점: 빈도 공격 중 새 번호가 곧바로 밀려날 수 있음(공식 문서)
- 채택하지 않은 이유: [이유 미확인] (제안 → 승인)
### C안: 지금 Redis를 들임
- 장점: 처음부터 여러 대에 맞음, 재시작에도 남길 수 있음
- 단점: 2GB 서버에 컨테이너·메모리가 늘고, 서버가 1대인 지금은 얻는 것이 적음
- 채택하지 않은 이유: 사용자 "나중에 redis전환이 쉽도록" (2026-10-17) — 지금이 아니라 나중에 옮기기 쉽게

## 결과
- 좋아지는 점: 장부 밀어내기가 결정(오래 안 쓴 것부터)과 정확히 같음. Redis로 옮길 곳·방법이 한 문서에 모임
- 감수하는 점: 장부 잠금 하나. 서버 재시작 = 장부·계획 비움(지금과 같음)
- 나중에 서비스로 분리하거나 Redis로 옮길 때: 상태마다 공유 여부·Redis 대응·옮기는 순서는 [`docs/research/maintenance/memory-state-and-redis.md`](../research/maintenance/memory-state-and-redis.md). 인터페이스 → Redis 구현 더하기 → `state-store=redis` → 1분 운영 요약 로그·Redis `INFO`로 잼. 서비스 전체(로그인 도중 값·새벽 작업 등)는 `docs/research/scaling/in-memory-state.md`, 원칙은 ADR-0021
- 근거: `docs/cycles/20-lookup-status-and-extension/design-delta.md` "전반 점검으로 바뀐 것" #10·"메모리 상태 저장소"·"데이터" 장부 줄·"개발 단계", `spec.md` R9·AC-39, `easy/2026-10-17-design-review-decisions.html` #1, `docs/settings-index.md` 6절·8절(`state-store`)
