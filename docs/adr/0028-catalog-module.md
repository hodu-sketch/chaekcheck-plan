# ADR-0028: 수집한 책 목록은 새 모듈 catalog가 가짐

Status: Accepted
Date: 2026-09-30
Cycle: 04-and-search
Supersedes: 없음

## 배경
사이클 04는 도서관 사이트에서 미리 모은 전자책 목록(책 약 106만, 소장 약 280만 줄, 2026-09-30)으로 여러 조건 AND 검색을 한다. 지금 모듈(`region`, `library`, `availability`)에는 책·소장 테이블이 없다. 목록은 나중에 주기 갱신 사이클에서 다시 채워진다.

## 결정
새 모듈 `catalog`를 만든다. 스키마 `catalog`에 책·사람·소장·도서관별 기준일·가져오기 기록을 두고, 책 검색 REST와 `CatalogHoldings` 공개 Java API를 제공한다. 의존은 `catalog → library`, `availability → catalog, library` (순환 없음).

## 이유 (사용자 발언)
- [이유 미확인] (Claude 추천안을 선택, 2026-09-30)

## 검토한 대안
### 새 모듈 catalog (채택)
- 장점: 저장 목록과 실시간 조회의 책임이 나뉨. 주기 갱신이 이 모듈 안에서 끝남
- 단점: 모듈·공개 API가 하나 늘어남
### availability 안
- 장점: 모듈 경계를 새로 만들지 않음
- 단점: 조회 모듈이 350만 행 스키마와 갱신 배치까지 떠안음
- 채택하지 않은 이유: [이유 미확인]
### library 안 (소장 = 도서관 × 책)
- 장점: 도서관과 가까움
- 단점: 기관 정보 모듈이 책 검색·정리 규칙까지 맡음
- 채택하지 않은 이유: [이유 미확인]

## 결과
- 좋아지는 점: 책 목록과 정리 규칙이 한곳에 있음. 감수하는 점: `library` 공개 API를 `catalog`와 `availability`가 함께 씀. 나중에 분리할 때: `catalog`는 자기 DB와 함께 떼어 내고 호출은 REST로 바꿈.
