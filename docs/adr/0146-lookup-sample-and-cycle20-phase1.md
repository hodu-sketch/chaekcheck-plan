# ADR-0146: 조회 운영 표본 `availability.lookup_sample` (10초, 달 파티션, 90일)

Status: Accepted (사후 기록)
Date: 2026-10-23
Cycle: 22-first-screen-usability 회고 (dev가 계획 밖에서 만든 것을 기록만 함)
Supersedes: 없음 (ADR-0132 1분 운영 요약에 더함)

## 배경

사이클 22는 "웹만"(AC-18)이었지만, 사용자가 운영 화면을 보며 dev에서 직접 고치는 동안(v1.2.0~v1.9.10, 2026-10-19~24) 아래 변경이 들어갔다. plan을 거치지 않았으므로 사이클 22 회고(`docs/cycles/22-first-screen-usability/retro.md`)에서 dev main `d3c2696`을 읽고 사실대로 적는다(사용자 2026-10-23 "전부 지금 맞춤"). 값은 모두 [확정] (dev 구현 확인, 2026-10-23).

## 결정 (구현된 것)

1. `availability/001-lookup-sample-schema.yaml`: `availability.lookup_sample`(`sampled_at timestamptz` PK, `window_ms`, `slots_max`, `slots_in_use`, `slots_max_in_use`, `refused`, `library_requests`, `body_too_large`, `db_errors`, `parse_max`, `parse_in_use`, `parse_max_in_use`, `queued_libraries`, `paused_lanes`, `heap_used_mb`, `heap_max_mb`(NULL 허용), `egress_mode text`, `lane_requests`, `lane_pauses`, `lane_retests`, `lane_resumes`), `PARTITION BY RANGE (sampled_at)` + 기본 파티션
2. `002-lookup-sample-partitions.sql`(runOnChange): `lookup_sample_ensure_partitions(months_ahead)`(서울 시간 달 경계), `lookup_sample_drop_before(cutoff)`. `003`이 처음 두 달
3. `availability.internal.ops.OpsSampler`(데몬 스레드, Spring 스케줄 아님): 10초마다 넣기(`ON CONFLICT DO NOTHING`), 켤 때와 하루 한 번 파티션 만들기 + 90일 지난 것 지우기. 설정 `chaekcheck.availability.ops-sample.enabled=true`, `interval=10s`, `retention=90d`
4. 같은 판(v1.4.0)에 사이클 20 1단계 일부: `GET /api/v1/lookup-status`(`{slots,inUse,level,reason,queuedLibraryIds,serverTime}`, no-cache), `HostQueueBoard`·`ParseSlots`·`BodyLimit`. **웹의 머리말 상태 불·10초 묻기·「밀려요」는 `8223880`(v1.4.0)에서 지움**. `extension/` 폴더는 main에 없음

## 이유

- [이유 미확인] (커밋 `e9d662b`, v1.4.0)

## 남은 것 [확인 필요]

- 보관 90일과 파티션 지우기 주기(dev 질문 #4), 상태 불을 웹에서 뺀 것이 사이클 20 설계와 어떻게 맞는지 — 사이클 20 회고 때
