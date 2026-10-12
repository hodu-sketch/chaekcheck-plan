# ADR-0083: `library`에 "도서관 더하기" 공개 기능을 두고, 번호는 부르는 쪽이 정한다

Status: Accepted
Date: 2026-10-12
Cycle: 13-crawler-to-dev
Supersedes: 없음 (dev 코드의 "Java never saves a library" 원칙을 바꿈)

> **미리 정함**: 사이클 13은 사이클 12(책 묶기 기준)가 끝나기 전에 나란히 진행해 정한 결정이다. dev에는 사이클 12 handoff 뒤에 넘긴다.

## 배경
지금 `library` 모듈의 공개 API `LibraryCatalog`는 읽기만 있고, 도서관은 Liquibase seed로만 들어간다(dev `Library.java` "Java never saves a library"). 사이클 13은 새로 찾은 도서관을 앱을 다시 켜지 않고 `collection` 모듈의 명령으로 넣기로 했다(scope 사전 결정 1·5). 그러려면 `library`가 쓰기 기능을 내놓아야 하고, 미리 보기·넣기·운영 반영에서 같은 도서관이 같은 번호를 가져야 사이클 11의 도서관 해시 비교가 맞는다.

## 결정
- `library`에 공개 API `LibraryRegistry`를 더한다 [안: 이름은 dev가 바꿀 수 있음]
  - `add(List<NewLibrary>)`: 번호까지 정해진 도서관·가입 규칙 줄을 묶음으로 넣고, 넣은 뒤 IDENTITY를 가장 큰 번호 뒤로 올린다
  - `nextId()`: `GREATEST(max(id), 시퀀스) + 1`. 번호 규칙은 이 한 곳에만 둔다
- `add`는 부르는 쪽 트랜잭션 안에서만 돈다(`Propagation.MANDATORY`). 같은 번호가 있으면 실패한다
- 넣기는 `library.internal`의 JDBC INSERT, 값 검사는 지금 DB CHECK·UNIQUE에 맡긴다
- 모듈 방향은 그대로: `collection → library`

## 이유 (사용자 발언)
- "나는 재시작 없이 하고 싶어 나. collection 모듈이 넣음으로 해줘" (2026-10-12)
- 번호를 부르는 쪽이 정하는 A안: 추천안을 고름 (2026-10-12, 설계 결정 1). 고른 이유는 [이유 미확인]

## 검토한 대안
### A안: 부르는 쪽이 번호까지 정해 묶음으로 넘김 (채택)
- 장점: 미리 보기에 실제 번호가 나오고 보고서 해시가 늘 같음. 운영 반영도 같은 번호로 넣어 도서관 해시가 맞음
- 단점: 부르는 쪽이 번호 규칙을 알아야 함(`nextId()` 한 곳으로 줄임)
### B안: 하나씩 넣고 IDENTITY가 번호를 줌
- 장점: 부르는 쪽이 번호를 몰라도 됨
- 단점: 미리 보기 번호가 예상에 그침, 운영 반영에 번호를 넘기는 길을 또 만들어야 함
- 채택하지 않은 이유: [이유 미확인] (추천하지 않은 안, 사용자는 A를 고름)

## 결과
- 좋아지는 점: 도서관을 넣을 때 앱을 다시 켜지 않아도 됨. 번호가 내 PC·운영에서 같음
- 감수하는 점: `library`가 처음으로 쓰기 API를 가짐. 이름 바꾸기·끄기는 여전히 SQL·changeset(이번에는 더하기만)
- 나중에 되돌리거나 서비스로 분리할 때의 비용: 낮음. 나중에 분리할 때 `add`는 `library` 서비스의 쓰기 API 하나로 옮기면 됨
