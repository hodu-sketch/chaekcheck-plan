# 사이클 17(첫 배포)에 전달: 사이클 16에서 배포 전에 챙길 것

- 작성: 사이클 16 세션, 2026-10-14 (16 인계 끝). 근거: [handoff.md](handoff.md) "공개 전에 할 것"

1. **seed 바꾸기는 `PRE_DEPLOYMENT` 표시를 지우기 전에**: `sitecontent/002`의 네 문서를 승인된 글([drafts/](drafts/))과 공개일로 바꾸고 개발 DB를 초기화, 테스트 계정은 다시 가입. 공개일 **2026-10-18** [확정] (사용자: "공개일 10월 18일", 2026-10-14). dev 사이클 16은 main에 합침(2026-10-14, `5b9c69b`, push 전)
2. **운영 DB 계정 권한**: 17이 정한 "`sitecontent` schema 쓰기만 있는 DB 계정"에는 `sitecontent` 표 셋의 SELECT·INSERT·UPDATE와 `notice.id` identity 시퀀스 USAGE가 필요함 (시퀀스 이름은 16 dev 5단계 결과)
3. **nginx `/notices`**: 16이 `deploy/nginx/chaekcheck-locations.conf`의 화면 주소 정규식에 `notices|notices/[0-9]+`를 더함 [확정] (사용자 승인, 2026-10-14). 17이 같은 파일을 고치면 합칠 때 겹칠 수 있음
4. **처리방침 공개 전 값**: AWS 계약 법인, Cloudflare 연락처·보유 기간·쿠키 여부 — 배포 때 계정·계약서로 채워 16 [drafts/privacy-policy.md](drafts/privacy-policy.md)에 반영
5. **첫 공지**: 공개일에 [drafts/notice-first.md](drafts/notice-first.md)를 운영 SQL로 올림
6. **첫 배포 뒤 확인 두 줄** [확정] (사용자 승인, 2026-10-15, 사이클 16 회고 결정 #10 — 회고는 사이클 19 세션이 씀): ① 실제 카카오 가입 1번으로 동의 기록 판 번호가 `1`로 남는지(개발 때는 가짜 응답·서버 시험만, 사용자: "지금은 일단 가짜응답으로만확인") ② 운영 `/about`에 가입 조사 기준일 줄이 보이는지(개발 DB에 값이 없어 화면으로 못 봄). 근거 [retro.md](retro.md)
7. **합친 커밋 번호 바로잡기**: 1항 등에서 "main에 합침 `5b9c69b`"로 적은 것은 정리 커밋이고, 합친 커밋은 `7ca62d3` (dev `.git/logs/HEAD`, 회고 2026-10-15)
