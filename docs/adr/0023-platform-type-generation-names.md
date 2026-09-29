# ADR-0023: 화면 종류 이름에 세대 번호

Status: Accepted
Date: 2026-09-28
Cycle: 02-library-expansion
Supersedes: 없음

## 배경
사이클 02 개발 중 dev에서 사용자가 정한 결정을 사이클 03 시작 때(2026-09-29) 기록한다. ADR-0016(화면 종류마다 adapter)을 보완한다.
ADR-0016의 `[안]` 이름은 `KYOBO`, `KYOBO_SUBSCRIPTION`, `YES24`, `YES24_LEGACY`, `ELIB_PORTAL`, `GANGNAM`이었다. 사이트 화면은 계속 바뀌므로 "LEGACY" 같은 이름은 다음 변경 때 뜻이 흐려진다.

## 결정
- `platform_type` 값에 세대 번호를 붙인다: `KYOBO_V1`, `KYOBO_SUBSCRIPTION_V1`, `YES24_V1`(EUC-KR 옛 화면), `YES24_V2`(UTF-8 화면), `YES24_V3`(EUC-KR로 응답하는 지금 화면, C2-U-15에서 추가), `ELIB_PORTAL_V1`, `GANGNAM_V1` — 7종.
- 새 화면이 나오면 다음 번호를 더하고 기존 이름은 바꾸지 않는다. adapter 클래스(`Yes24V1Adapter` 등)와 fixture 폴더(`yes24-v1/` 등)도 같은 이름을 쓴다.

## 이유 (사용자 발언)
- "legacy yes24 … 네이밍이 실제로 이래? 나중에 수정이 계속 되면 분간이 안 될 것 같아. 기존 것들도 언제든지 legacy가 될 수 있는데 … 순서라도 붙여주던가" → 선택 "모두 세대 번호" (2026-09-28, dev plan-feedback C2-U-2)

## 검토한 대안
### A안: 모든 화면 종류에 세대 번호 (채택)
- 장점: 화면이 바뀌어도 이름 규칙이 같음
- 단점: 이름이 길어짐
### B안: `LEGACY` 등 상대적인 이름 (ADR-0016 `[안]`)
- 장점: 짧음
- 단점: 지금 화면도 언젠가 옛 화면이 됨
- 채택하지 않은 이유: "기존 것들도 언제든지 legacy가 될 수 있는데" (사용자)

## 결과
- 좋아지는 점: 새 화면 종류를 추가할 때 기존 값과 코드를 바꾸지 않음
- 감수하는 점: 같은 플랫폼의 세대가 여러 개 공존할 수 있음(지금 YES24 3세대)
