# ADR-0109: 이미 켜진 도서관은 Liquibase 변경 파일로 끈다

Status: Accepted
Date: 2026-10-14
Cycle: 18-empty-library-holdings
Supersedes: 없음

## 배경
사이클 18에서 책이 0권인 22곳을 끄기로 했다. 운영 반영(ADR-0078)은 반영 전에 내 PC와 운영 DB의 "켜진 도서관(id·주소·화면 종류)" 해시를 비교해 다르면 멈춘다. 그래서 끄는 일이 두 DB에 같게 들어가야 한다. 사이클 07은 3곳을 Liquibase `library/010-library-disabled.yaml`로 껐고, dev `library-maintenance.md` 6-2는 "오래 꺼 둘 곳은 새 changeset"이다.

## 결정
이미 서비스에 있는 도서관을 끌 때(그리고 다시 켤 때)는 `library` 모듈의 새 Liquibase 변경 파일로 한다. 앱 판과 함께 가므로 내 PC와 운영 서버(같은 판으로 반영)에 같이 들어간다.

## 이유 (사용자 발언)
- [이유 미확인] (설계 결정 #1 승인, 2026-10-14; ADR 초안 승인 2026-10-14)

## 검토한 대안
### A안: Liquibase 변경 파일 (채택)
- 장점: 코드 변경 0, 양쪽에 빠짐없이 들어감, git 이력
- 단점: 끄기만 하려 해도 앱 판을 올림, 다시 켤 때도 파일 하나
### B안: 규칙 파일을 넣기 명령이 읽고 반영 파일로 운영에 옮김
- 장점: 앱 판 없이 데이터 반영만으로
- 단점: 공개 API·반영 파일 모양 변경, 넣기 명령의 "새 곳만" 성격과 어긋남
- 채택하지 않은 이유: [이유 미확인]
### C안: SQL을 손으로 두 번
- 장점: 가장 빠름
- 단점: 빠뜨리면 반영이 멈춤, 새로 만드는 DB엔 안 들어감, 이력 없음
- 채택하지 않은 이유: [이유 미확인]

## 결과
- 사이클 18: `library/0NN-library-disabled-cycle18.yaml` (22곳). 이유는 dev `scripts/library/disabled_reasons.tsv`·`library-site-issues.md`
- 반영 절차: 끄기 파일이 든 판으로 내 PC를 띄운 뒤 내보내기

## 나중에 분리할 때
- `library` 서비스의 마이그레이션으로 그대로 따라감
