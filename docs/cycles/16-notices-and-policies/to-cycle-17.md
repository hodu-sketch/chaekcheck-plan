# 사이클 17(첫 배포)에 전달: 사이클 16에서 배포 전에 챙길 것

- 작성: 사이클 16 세션, 2026-10-14 (16 인계 끝). 근거: [handoff.md](handoff.md) "공개 전에 할 것"

1. **seed 바꾸기는 `PRE_DEPLOYMENT` 표시를 지우기 전에**: `sitecontent/002`의 네 문서를 승인된 글([drafts/](drafts/))과 공개일로 바꾸고 개발 DB를 초기화, 테스트 계정은 다시 가입. 공개일은 아직 사용자에게 물어야 함 [확인 필요]
2. **운영 DB 계정 권한**: 17이 정한 "`sitecontent` schema 쓰기만 있는 DB 계정"에는 `sitecontent` 표 셋의 SELECT·INSERT·UPDATE와 `notice.id` identity 시퀀스 USAGE가 필요함 (시퀀스 이름은 16 dev 5단계 결과)
3. **nginx `/notices`**: 16이 `deploy/nginx/chaekcheck-locations.conf`의 화면 주소 정규식에 `notices|notices/[0-9]+`를 더함 [확정] (사용자 승인, 2026-10-14). 17이 같은 파일을 고치면 합칠 때 겹칠 수 있음
4. **처리방침 공개 전 값**: AWS 계약 법인, Cloudflare 연락처·보유 기간·쿠키 여부 — 배포 때 계정·계약서로 채워 16 [drafts/privacy-policy.md](drafts/privacy-policy.md)에 반영
5. **첫 공지**: 공개일에 [drafts/notice-first.md](drafts/notice-first.md)를 운영 SQL로 올림
