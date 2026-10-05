# plan 세션에 붙여 넣을 메시지: 로고·가입 조건 진행 (2026-10-05 10시 무렵)

- 앞 메시지(`library-logos-message.md`) 다음에 보내는 갱신입니다. 아래 회색 상자 안을 그대로 복사합니다
- 기록 원본:
  - `docs/research/maintenance/library-logos.md` 3-1절
  - `docs/research/library-join/candidates.md` 3절

```
수집 세션 갱신(2026-10-05 10시 무렵). 끝난 것과 진행 중인 것이야.

1) 등록 도서관 로고: 끝 (후보 도서관 로고는 받지 않기로 함, 사용자 "후보 도서관은 하지 말라는 뜻")
- 결과 표: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\logos\registered-logos-2026-10-05.tsv
  - 칸: library_id, name, status, file, source, logo_url, note
  - library_id = 서비스 도서관 번호. 59·131은 수집 DB에 없음
  - file은 chaekcheck-data 아래 상대 경로
- status별 수:
  - OWN 199: 그 도서관 로고. 전자도서관에서 187, 본 홈페이지에서 12. 본 홈페이지 것은 눈으로 확인함
  - VENDOR_DEFAULT 43: 업체 기본 로고만 있음(교보 "KYOBO 교보문고" 등) → 쓰지 않음
  - NONE 36: 로고 없음, 파일 깨짐, 수집 제외, 구·군 상징만 있음(영도·창녕·연제) 등
- 이미 정한 것 [확정]: 공공도서관만 로고, 원본 그대로 축소, 로고를 누르면 원 전자도서관으로, "제휴·후원 관계 없음" 안내와 로고 내림 요청 연락처는 "서비스 안내" 페이지에 두고 모든 화면 맨 아래에 링크. 근거는 library-logos.md 4절
- 사이클에서 정할 것: 로고를 화면 어디에 보여 줄지, 서비스 DB·파일을 어떻게 둘지, 이번 사이클에 넣을지

2) 후보 도서관 공공도서관 120곳 가입 조건: 끝
- 종류(이름 기준): C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\library-join\candidate-kinds-2026-10-05.tsv
  - 2,639곳: 초·중·고 1,254 / 대학 566 / 회사 332 / 정부·공공기관 231 / 공공도서관 120 / 단체·아파트 93 / 모름 37 / 시험용 6
- 공공도서관 120곳 가입 조건(원문 인용·출처 포함): C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\library-join\public-join-2026-10-05.tsv
  - 칸 모양은 dev join-classification과 같음 (eligibility, basis, scope, visit_required, join_method, join_caution, quote, source_url, checked, memo)
  - 지역 제한 88, 누구나 11, 누구나+주의 1, 소속 전용 2(대구학생전자도서관, 세종북자람), 원문 못 찾음 18
  - 원문 확인 103곳. 방문 가입 필요 50, 불필요 52, 모름 18
- 애매한 원문은 사용자가 정함 [확정] (2026-10-05). 표의 decision 칸과 docs/research/library-join/candidates.md 3절에 있음
  - 전주는 전주·완주 + 책이음, 고창(교육청)은 고창군만, 전남교육청 12곳은 통합 시·도·방문 없이, 제천은 거주자만, 익산은 지역 제한
  - 체험용·운영 중단으로 보이는 4곳(삼각산 북라이브, 대구동구안심 북큐브, 순창 북라이브, 양평 북큐브)은 서비스에 넣지 않음
  - 원문 못 찾은 곳은 자격 미확인
  - "책이음 회원도 가입 가능"은 2026-09-29 결정대로 지역 규칙 + extra_condition(9곳). 표에 extra_condition 칸이 있음
- 학교·대학·회사·기관은 아직 손대지 않음(소속 구성원 전용으로 보임)
- 사이클 07 scope.md는 후보 도서관 가입 자격을 "제외"로 뒀어. 이 결과를 이번 사이클에 쓸지(확인된 후보 공공도서관을 등록 도서관처럼 지역에 맞춰 보이게 할지)는 사용자에게 물어봐 줘

3) 등록 도서관과 같은 사이트인 후보 99곳 짝 맞추는 표: 앞 메시지 3번 그대로
- docs/research/ebook-catalog/data/same-site-candidates-2026-10-05.tsv
```
