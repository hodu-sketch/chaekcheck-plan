# plan 세션에 붙여 넣을 메시지: 도서관 로고 수집 (2026-10-05)

- 사용자가 다음 사이클을 진행하는 plan 세션에 붙여 넣습니다. 아래 회색 상자 안을 그대로 복사합니다
- 기록 원본: `docs/research/maintenance/library-logos.md`

```
수집 세션에서 도서관 로고를 모으기 시작했어(2026-10-05). 내 도서관·검색 화면을 설계할 때 참고해 줘.

- 무엇: 모든 도서관 사이트(등록 도서관 + 후보 도서관, "같은 사이트" 99곳 등 받지 않는 곳 빼고)의 로고 그림을 도서관 번호와 짝지어 저장
- 위치(git 밖): C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\logos\<library_id>.png 등, 매핑 표 logos\logos.tsv (library_id, name, platform_type, base_url, logo_url, file, sha256, note …)
  - library_id는 수집 DB 번호: 등록 도서관 1~280은 서비스 도서관 번호와 같고, 후보 도서관은 100001~
- 방법과 결과: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\research\maintenance\library-logos.md
  - 교보는 사이트가 주는 headerLogo.json에서, 나머지는 첫 화면 머리말 그림에서 받음. 예의는 수집기와 같음(IP당 1건, 2초 간격)
  - 교보 일반 화면 일부는 도서관 로고 대신 "교보문고" 기본 로고를 걸어 둠 → 여러 도서관이 같은 그림이면 "업체 기본 로고"로 표시해 도서관 로고로 쓰지 않기로 할 예정 [안]
  - 로고가 없는 사이트도 있음(교보 headerLogo.json이 비어 있음 등)
- 확인 필요: 기관 로고를 서비스 화면에 써도 되는지(지자체 상징 이용 조건 등). 확인 전에는 서비스에 쓰지 않는 것으로 [안]
- 사이클에서 정할 것: 로고를 어디에 보여 줄지(내 도서관 목록, 도서관 고르기, 검색 결과 줄 등), 서비스 DB에 어떻게 둘지(도서관 표에 칸 / 파일 저장 위치), 업체 기본 로고 판별 기준

수집은 지금 돌고 있고, 끝나면 몇 곳을 받았는지 이 문서에 적어 둘게. 쓰기로 하면 로고 이용 조건부터 나한테 물어봐 줘.
```
