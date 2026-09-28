# ADR-0008: API 응답·오류 형식: 감싸지 않은 성공 응답 + ProblemDetail

Status: Accepted
Date: 2026-09-27
Cycle: 01-ebook-availability-search
Supersedes: 없음

## 배경
dev의 api-design 스킬은 성공 `{data, meta}`, 오류 `{error: {code, message, details}}` 형식을 정해 두었다. Spring은 RFC 9457 ProblemDetail을 기본 지원한다.

## 결정
- 성공 응답은 감싸지 않고 결과 객체나 배열을 그대로 돌려준다. 필드 이름은 camelCase.
- 오류는 RFC 9457 Problem Details(`application/problem+json`)로 돌려주고, 확장 멤버 `code`(snake_case 오류 코드)와 필요하면 `errors`(필드 오류)를 둔다.
- dev의 api-design 스킬을 이 형식에 맞게 고친다 (변경안: `docs/cycles/01-ebook-availability-search/skill-change-api-design.md`). 고치기 전까지는 이 ADR이 스킬보다 우선한다.
- 근거: RFC 9457 (https://www.rfc-editor.org/rfc/rfc9457.html, 2026-09-27 확인)

## 이유 (사용자 발언)
- 오류 형식: [이유 미확인] (사용자가 "Spring ProblemDetail (RFC 9457)" 선택)
- 스킬 수정: "스킬을 ProblemDetail에 맞춰서 고쳐줘"
- 성공 응답을 감싸지 않음: [이유 미확인] (추천안 채택)

## 검토한 대안
### A안: 감싸지 않은 성공 + ProblemDetail (채택)
- 장점: 표준 형식이고 Spring 기본 지원과 맞음
- 단점: dev 스킬을 고쳐야 함
### B안: dev 스킬 형식 그대로 ({data, meta} / {error})
- 장점: 스킬을 고치지 않아도 됨
- 채택하지 않은 이유: [이유 미확인]
### C안: ProblemDetail + 성공은 {data, meta}로 감쌈
- 채택하지 않은 이유: [이유 미확인]

## 결과
- 좋아지는 점: 표준 오류 형식으로 클라이언트가 `code`로 분기
- 감수하는 점: Spring Boot 4.1에서 ProblemDetail을 켜는 설정 이름은 [확인 필요]. SSE 스트림 안의 실패 이벤트도 같은 모양을 씀 (design-delta 참고)
- 나중에 서비스로 분리할 때: 모든 서비스가 같은 오류 형식을 쓰면 됨
