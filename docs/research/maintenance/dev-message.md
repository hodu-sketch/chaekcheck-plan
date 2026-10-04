# dev 세션에 붙여 넣을 메시지 (ADR-0047 옮기기)

- 작성 2026-10-04, 고침 2026-10-04 밤. 사용자가 dev 세션에 직접 붙여 넣습니다 [확정] (사용자 선택 "ADR 추가 + 요청서를 내가 dev에 전달", 2026-10-04)
- 사용자가 직접 넣는 이유: 다른 세션이 보낸 메시지를 dev 세션은 참고 정보로만 받습니다. 사용자가 넣어야 dev가 사용자 요청으로 받습니다
- 단계: 1단계(문서 옮기기)는 끝남(2026-10-04). **2단계는 지금 보냄.** 3단계(코드 복사)도 수집기를 멈추지 않고 할 수 있음 [확정] (사용자: "수집기를 멈추는게 아니라 계속 돌고 숫집된 부분까지만이라도 배포먼저할건뎅", 2026-10-04). 지금 돌고 있는 수집기를 dev 쪽으로 갈아타는 것은 나중에 사용자가 정할 때
- 아래 회색 상자 안을 그대로 복사해 붙여 넣습니다
- 책 번호 유지 정책은 따로: `docs/research/ebook-catalog/book-id-policy-message.md` dev용 상자

## 1단계: 문서 옮기기 — 끝남 (2026-10-04)

dev가 `docs/maintenance/`를 만들고 `plan-feedback.md` "# 사이클 밖: ADR-0047 옮기기"에 적음.

## 2단계: 옮긴 뒤 바뀐 것 문서에 더하기 (지금 가능)

```
plan ADR-0047 요청서의 "D. 문서에 더할 것"을 해 줘. 1단계 뒤에 plan 수집 세션에서 수집기를 고치고 새로 알게 된 것들이야.

- 요청서: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\research\maintenance\dev-move-request.md (D절)
- 더할 내용 원문: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\research\ebook-catalog\crawl-runbook.md 4절 "dev에 반영할 것" 표
- 수집 일 나눔과 도서관 목록 이름: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\research\maintenance\collection-areas.md

요약:
- 도서관 목록 이름을 정했어: "등록 도서관"(서비스 DB, 278곳, 검색에 나옴) / "후보 도서관"(수집 DB 번호 100001~, 2,738곳, 아직 검색에 안 나옴). docs/maintenance 문서들에서 이 이름을 써 줘
- 1-libraries.md에 "후보 도서관 찾기", "구독 규칙·마감 확인" 절을 더해 줘(도구는 아직 chaekcheck-data에 있음, 3단계에서 옮김)
- 2-crawl.md·platforms.md에 수집기 변경(서버별 동시 요청 수 --host-slots, YES24 오디오북 목록 이어 받기, 북큐브·알라딘 다른 정렬로 채우기, 알라딘 startPage·goods_id, 오디오북 목록 못 읽으면 건너뜀 등)을 더해 줘

지킬 것:
- plan 문서는 읽기만 하고 고치지 마
- 문서만 고쳐. chaekcheck-data의 코드와 수집 DB는 건드리지 마(수집이 돌고 있어)
- 사이클 05 작업과 섞이지 않게 커밋은 따로
- 끝나면 docs/plan-feedback.md "# 사이클 밖: ADR-0047 옮기기" 절에 반영한 줄을 적어 줘
```

## 3단계: 수집기와 도서관 정보 도구 옮기기 (수집기가 돌아도 됨, 복사만)

```
plan ADR-0047 요청서의 "B. 책 수집기 코드"와 "C. 도서관 정보 도구"를 해 줘. 수집기는 chaekcheck-data에서 계속 돌고 있어. 코드는 복사만 하고, 옮긴 수집기로 갈아타는 건 나중에 내가 정할게.

- 요청서: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-plan\docs\research\maintenance\dev-move-request.md (B·C절)
- 지금 위치: C:\Users\yujun\Documents\Claude\Projects\chaekcheck-data\ (git 밖)

지킬 것:
- 돌고 있는 수집기(python 프로세스 "crawl_catalog.py full")와 chaekcheck-data 안의 파일은 멈추거나 고치지 마. 복사만 해
- 책 수집기는 scripts/crawl/, 후보 도서관 찾기와 구독 규칙·마감 확인 도구는 scripts/library/로 복사해. chaekcheck-data 안의 원본·수집 DB·logs·secrets는 지우거나 옮기지 마
- secrets/(국립중앙도서관 인증키), ebook-catalog.sqlite, logs/, queue-by-ip.txt, host-slots.txt는 git에 넣지 마. 인증키 내용은 열거나 출력하지 마. other-platforms/*.tsv는 내용을 보고 넣을지 정해 줘
- 수집 DB 위치는 환경 변수나 인자로 받게 하고, 기본값은 chaekcheck-data 폴더로 해 줘
- 옮긴 수집기로 "status" 명령 하나만 돌려 수집 DB를 읽는지 확인해 줘(수집기가 도는 중에도 읽기는 됨). 사이트에 요청하는 명령(full, probe 등)은 돌리지 마. 두 수집기가 같은 사이트에 동시에 요청하면 안 돼
- queue-by-ip.txt와 host-slots.txt(103.182.126.192=4) 설정이 옮긴 뒤에도 같은 뜻으로 쓰이게 해 줘. 이어 받기(full) 실행은 내가 하라고 할 때만
- 끝나면 docs/plan-feedback.md "# 사이클 밖: ADR-0047 옮기기" 절에 결과를 더해 줘
```

## dev가 끝낸 뒤

plan 세션에 "dev가 ADR-0047 2단계(또는 3단계) 끝냈어"라고 알려 주세요. plan 세션이 dev `docs/plan-feedback.md`를 읽고 요청서 F(runbook 4절 정리, 도구 위치 고치기)를 합니다.
