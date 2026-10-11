# ADR-0068: 고친 시각은 DB가 적는다

Status: Accepted
Date: 2026-10-11
Cycle: 08-polish-swap-memory
Supersedes: 없음

## 배경
`library.library`, `region.region`에는 `updated_at` 칸이 있지만 기본값(`now()`)은 넣을 때만 적용되고, 고칠 때 시각을 바꾸는 장치가 없다. 도서관을 고친 DB 변경 명령 4번 중 1번만 직접 적어, 지금 값은 믿을 수 없다(dev changelog, 2026-10-05). dev 규칙 문서에도 지침이 없다.

## 결정
- `updated_at` 칸을 두는 표는 `BEFORE UPDATE FOR EACH ROW` 트리거로 고칠 때마다 DB가 시각을 적는다. 값을 그대로 두고 고쳐도 바뀐다
- 트리거 함수는 모듈마다 자기 스키마에 둔다(공용 함수 없음)
- 지금 대상: `library.library`, `region.region`
- dev `postgres-patterns` 스킬에 "고친 시각 칸을 두는 표는 트리거를 함께 둔다"를 더한다

## 이유 (사용자 발언)
- "왜 updated_at이 지금 정상적으로 안 되는 거야? 이거 좀 dev가 잘 넣도록 지침이라던가 해줘 이거 기본 아니야?" (2026-10-05)
- 모듈마다 두기: 제안 → 승인 (2026-10-10, 설계 결정 #11)

## 검토한 대안
### A안: DB 트리거, 모듈마다 (채택)
- 장점: 앱·Liquibase·직접 SQL 어느 길로 고쳐도 적힘, 모듈끼리 DB 객체를 나눠 쓰지 않음
- 단점: 함수가 모듈마다 하나씩 생김
### B안: 서버 코드(JPA)에서만 적기
- 단점: DB 변경 파일·직접 명령으로 고칠 때를 놓침
- 채택하지 않은 이유: [이유 미확인]
### C안: "고칠 때 직접 적는다" 규칙만
- 단점: 지금 빠뜨린 방식 그대로
- 채택하지 않은 이유: [이유 미확인]

## 근거
- PostgreSQL 18 PL/pgSQL Trigger Functions, 예 41.3 (줄을 넣거나 고칠 때 시각을 찍는 트리거), https://www.postgresql.org/docs/current/plpgsql-trigger.html (확인 2026-10-05)
