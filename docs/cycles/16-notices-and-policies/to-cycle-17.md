# 사이클 17(첫 배포)에 전달: 사이클 16에서 배포 전에 챙길 것

- 작성: 사이클 16 세션, 2026-10-14 (16 인계 끝). 근거: [handoff.md](handoff.md) "공개 전에 할 것"

1. **seed 바꾸기는 `PRE_DEPLOYMENT` 표시를 지우기 전에**: `sitecontent/002-sitecontent-seed.yaml`의 네 문서를 승인된 글([drafts/](drafts/))과 공개일로 바꾸고 개발 DB를 초기화, 테스트 계정은 다시 가입. 공개일 **2026-10-18** [확정] (사용자: "공개일 10월 18일", 2026-10-14). dev 사이클 16은 main에 합침(2026-10-14, `5b9c69b`, push 전)
   - **누가·언제** [확정] (사용자 결정 2026-10-18, dev-cycle-20 세션 전달): 이 seed 교체는 **17 dev가 배포 직전 점검**으로 함(`PRE_DEPLOYMENT` 표지 제거 전). 할 일·출처·고칠 시험·주의점은 dev `docs/plan-feedback.md` 맨 끝 절 `# 17 dev에게: 배포 직전 sitecontent seed 교체 메모`
   - **넣을 내용** [확정]: plan drafts의 **최소판**(처리방침 §2 업체 이름·나라만, §4 안전 조치 — 2026-10-18 승인, `easy/2026-10-18-deploy-content-decisions.html` 안#1·#2; 서비스 안내 연락처는 "문의:"로 줄임). 시행일 모두 2026-10-18
2. **운영 DB 계정 권한**: 17이 정한 "`sitecontent` schema 쓰기만 있는 DB 계정"에는 `sitecontent` 표 셋의 SELECT·INSERT·UPDATE와 `notice.id` identity 시퀀스 USAGE가 필요함 (시퀀스 이름은 16 dev 5단계 결과)
3. **nginx `/notices`**: 16이 `deploy/nginx/chaekcheck-locations.conf`의 화면 주소 정규식에 `notices|notices/[0-9]+`를 더함 [확정] (사용자 승인, 2026-10-14). 17이 같은 파일을 고치면 합칠 때 겹칠 수 있음
4. **처리방침 공개 전 값**: ~~AWS 계약 법인, Cloudflare 연락처·보유 기간·쿠키 여부~~ → **해결 완료** [확정] (2026-10-18): 공식 출처 확인 후 최소판으로 정함 — §2는 업체 이름(Amazon Web Services / Cloudflare, Inc.)·나라(호주 / 미국 및 네트워크 나라)·맡긴 일만, 주소·이메일은 빼고 문의는 §4 담당자로 모음. 나라는 운영 지역이 시드니(ap-southeast-2)라 **호주**(국외 이전). 쿠키는 §3에 반영 완료. 근거 [research.md](research.md) §6.6, 승인 `easy/2026-10-18-deploy-content-decisions.html` 안#1
5. **첫 공지**: 공개일에 [drafts/notice-first.md](drafts/notice-first.md)를 **운영 SQL**로 올림(seed 아님, dev `5-sitecontent.md` 1절). 판 1, 게시일 2026-10-18
6. **첫 배포 뒤 확인 두 줄** [확정] (사용자 승인, 2026-10-15, 사이클 16 회고 결정 #10 — 회고는 사이클 19 세션이 씀): ① 실제 카카오 가입 1번으로 동의 기록 판 번호가 `1`로 남는지(개발 때는 가짜 응답·서버 시험만, 사용자: "지금은 일단 가짜응답으로만확인") ② 운영 `/about`에 가입 조사 기준일 줄이 보이는지(개발 DB에 값이 없어 화면으로 못 봄). 근거 [retro.md](retro.md)
7. **합친 커밋 번호 바로잡기**: 1항 등에서 "main에 합침 `5b9c69b`"로 적은 것은 정리 커밋이고, 합친 커밋은 `7ca62d3` (dev `.git/logs/HEAD`, 회고 2026-10-15)
8. **배포 점검표에 `npm audit` 한 번** [확정] (사용자 승인, 2026-10-15, 사이클 16 회고 결정 #9): 웹 의존성 점검에 높음 1건(`source-map-js`)이 있음(`react-markdown` 전부터). 배포 전에 한 번 보고 결과를 남김
