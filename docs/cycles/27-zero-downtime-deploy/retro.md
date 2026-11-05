# 회고: 사이클 27 무중단 배포

- 쓴 날: 2026-11-05 (사용자 "다 완료처리해줘", dev 24 세션 전달)
- 근거: dev `docs/cycles/plan-feedback.md` "# 사이클 27" 9단계(dev 세션 `chaekcheck-dev-cycle-27`), plan `server-measure.md`(2026-10-29 측정·2026-11-01 재측정), CLAUDE.md 열린 사이클 표
- 상태: 인계서 0~8단계 모두 끝, **운영 반영** v1.22.0 (2026-10-29, 처음 옮기기 8단계 끝)
  - 이후 v1.23.0·v1.23.1 (2026-10-31, 블루·그린 전환으로 반영)

## 수용 기준 결과

| AC | 결과 | 근거 |
|---|---|---|
| AC-1 전환 성공 | 통과 | 쉬는 자리에 새 판 띄우고 nginx reload, 실패 0건 (dev plan-feedback 9단계) |
| AC-2 되돌리기 성공 | 통과 | `release.sh --switch-only`로 되돌리기, 실패 0건 |
| AC-3 옛 자리 정상 종료 | 통과 | Exited(143) — SIGTERM 정상 종료 |
| AC-4 망가진 판 → 옛 판 유지 | 통과 | 세 경우 모두 옛 판 유지 |
| AC-5 준비 확인 시간 | 통과 | 29~39초 (한도 60초) |
| AC-6 화면 판 교체 | 통과 | `releases/X` 폴더 + `current` 링크 + reload |
| AC-7 새벽 시간 거절 | 통과 (버그 고침 뒤) | `release.sh` 새벽 검사에서 8진수 버그 발견·고침 |
| AC-8 남는 메모리 | 통과 | 전환 뒤 579MB (2026-10-29), 재측정 557MB (2026-11-01 v1.23.1) |
| AC-9 처음 옮기기 짧은 끊김 한 번 | 통과 | 8단계에서 한 번 끊김, 이후 전환은 무중단 |

## 계획대로 된 것

- 두 자리 `backend-blue`·`backend-green`, `slots.env`(`ACTIVE_SLOT`·버전 기록)
- `bin/switch.sh`: 쉬는 자리에 띄우기 → readiness 확인(1초 간격 최대 60초) → nginx reload → 2초 대기 → 옛 자리 stop
- Actuator `health/readiness`만 열림, 다른 엔드포인트 404
- `spring.lifecycle.timeout-per-shutdown-phase: 40s`, `stop_grace_period: 60s`
- 새벽 03:25~05:10 배포 거절
- nginx는 판 고정 기본 이미지, 설정·화면 폴더째 읽기 전용 붙임
- 화면 두 판만 남기기
- 도메인 모듈·표·API 변경 없음

## 달라진 것과 이유

| 바뀐 것 | 인계서 | 이유 |
|---|---|---|
| `up.sh`에서 nginx가 백엔드보다 먼저 뜨면 죽던 문제 고침 | 시작 순서 명시 없음 | dev 발견: nginx가 먼저 뜨면 backend upstream이 없어 컨테이너가 종료됨. `up.sh` 순서를 backend → nginx로 고침 |
| `release.sh` 새벽 검사 8진수 버그 | 시간 비교 코드 | 08, 09 시가 bash에서 8진수로 읽혀 오류. 고침 |

## 운영에서 생긴 일

- 처음 옮기기(8단계)에서 짧은 끊김 한 번: 계획대로
- v1.23.0·v1.23.1 전환(2026-10-31)은 무중단으로 성공
- 재측정(2026-11-01): backend 661MiB(anon 609 + file cache), file_mapped 79MiB(벡터 파일 235.5MB 중), db 89MiB, 남는 메모리 557MB, 스왑 390MB

## 남은 것

- 없음. CI·README 정리는 다음 사이클 시작 때 (dev `plan-feedback.md` 기록)
