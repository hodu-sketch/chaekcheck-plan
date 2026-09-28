# ADR-0002: 모듈별 PostgreSQL 스키마

Status: Accepted
Date: 2026-09-27
Cycle: 01-ebook-availability-search
Supersedes: 없음

## 배경
모듈 간 FK·JOIN을 두지 않는 것이 규칙이다. 소유 경계를 DB에서도 드러낼지 정해야 했다.

## 결정
모듈마다 PostgreSQL 스키마를 둔다: `region`, `library`. `availability`는 소유 테이블이 없다 (캐시는 메모리, ADR-0006).

## 이유 (사용자 발언)
- [이유 미확인] (추천안 채택)

## 검토한 대안
### A안: 모듈별 스키마 (채택)
- 장점: 소유 경계가 DB에서 보이고 나중에 DB를 나누기 쉬움
- 단점: Liquibase·JPA에 스키마 이름을 적어야 함
### B안: public 스키마 하나 + 테이블 이름 접두어
- 장점: 설정이 단순함
- 단점: 경계가 이름 규칙에만 기대고 실수로 JOIN하기 쉬움
- 채택하지 않은 이유: [이유 미확인]

## 결과
- 좋아지는 점: 다른 모듈 테이블을 실수로 JOIN하기 어려워짐
- 감수하는 점: 엔티티와 changelog마다 스키마 지정
- 나중에 서비스로 분리할 때: 스키마 단위로 DB를 옮기면 됨
