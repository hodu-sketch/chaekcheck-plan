# 사이클 20 조사: 도서관 조회 부담을 사용자 쪽으로 옮기는 방법

- 조사일: 2026-10-15. 사용자 요청: "목표는 조회 서버의 부담을 사용자로 옮기는 거야 크롬 확장 말고도 다른 방식이 있으면 좋아"
- 쉬운 설명·결정 페이지: [`easy/2026-10-15-offload-options.html`](easy/2026-10-15-offload-options.html)
- 출발점(dev 코드, 2026-10-15 확인, `scope.md` "지금 상태"): 도서관 조회는 모두 GET·쿠키 없음, 해석(adapter 9종)은 본 서비스, 조회 서버(fetch-service)는 URL을 받아 상태 코드와 원본 바이트만 돌려줌(ADR-0015). 일부 도서관은 `http://`(예 `ebook.jeonju.go.kr:8095`), EUC-KR, 중간 인증서 빠짐

## 1. 왜 웹 페이지만으로는 안 되는가

사용자의 브라우저에서 우리 웹 페이지의 스크립트가 도서관 사이트를 직접 부르려면 두 벽이 있다.

| 벽 | 내용 | 근거 |
|---|---|---|
| CORS | 다른 origin의 응답은 그 서버가 `Access-Control-Allow-Origin`을 줄 때만 스크립트가 읽을 수 있음. `mode: "no-cors"`는 응답 머리와 본문을 스크립트에서 못 봄(opaque) | MDN CORS https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS, MDN Request.mode https://developer.mozilla.org/en-US/docs/Web/API/Request/mode (확인 2026-10-15) |
| 혼합 콘텐츠 | https 페이지에서 `http://` 자원을 `fetch()`하면 차단(blockable). 예외는 `http://localhost/`·`http://127.0.0.1/` 같은 loopback(안전한 origin으로 봄) | MDN Mixed content https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content (확인 2026-10-15) |

### 1.1 도서관 사이트가 CORS를 열어 두었는지 (호출 시험, 2026-10-15)

dev seed의 도서관 주소 12곳 루트에 `Origin` 머리를 붙여 GET(curl, 일반 브라우저 User-Agent). **응답한 8곳 모두 `Access-Control-Allow-Origin` 없음.** 4곳(`ebook.busan.go.kr`, `sejonglib.dkyobobook.co.kr`, `gdlib.dkyobobook.co.kr`, `www.gbelib.kr`)은 curl에서 응답이 오지 않음(인증서 또는 차단으로 추정, 원인 확인 못 함).

| 응답한 곳 | 상태 | CORS 머리 |
|---|---|---|
| e-lib.sen.go.kr | 302 | 없음 |
| ebook.gangnam.go.kr | 200 | 없음 |
| ebook.jeonju.go.kr:8095 (http) | 200 (IIS 8.5) | 없음 |
| ebook.kyobobook.co.kr | 302 → http:// 주소 | 없음 |
| elib.goe.go.kr, ebook.gblib.or.kr, library.daegu.go.kr, lib.ice.go.kr | 200 | 없음 |

결론: 표본으로는 **웹 페이지 스크립트가 도서관 응답을 읽을 길이 없다.** 도서관 수백 곳 전부를 확인한 것은 아님 [확인 필요: 전체 호스트 일괄 시험은 dev에서 가능].

## 2. 방법 후보

| # | 방법 | 사용자가 할 일 | 도서관을 부르는 주체(IP) | 되는 브라우저 | 우리가 만들 것 | 걸림돌 |
|---|---|---|---|---|---|---|
| A | **브라우저 확장** (Manifest V3) | 스토어에서 설치 1회 | 사용자 브라우저(확장) | 크롬·엣지(같은 패키지)·파이어폭스(PC·안드로이드, 같은 WebExtension 규격)·사파리(별도 포장) | 확장 1개 + 웹 연결 + 서버 입구 | 스토어 심사·등록비, 넓은 사이트 권한 경고, `http://`·인증서 사이트는 프로토타입 확인 필요 |
| B | **사용자 스크립트** (Tampermonkey 등 관리자 확장 + 우리 스크립트) | 관리자 확장 설치 + 스크립트 설치(2단계) | 사용자 브라우저 | 관리자 확장이 있는 브라우저 | 스크립트 1개(확장 A와 같은 메시지 약속 가능) | 설치가 2단계, 도메인마다 확인 창(`@connect`로 줄임), 관리자 확장이 남의 제품 |
| C | **로컬 도우미 프로그램** (PC에 설치, `http://127.0.0.1:포트`로 우리 페이지와 통신) | 설치 프로그램 내려받아 실행 | 사용자 PC(프로그램) | 모든 PC 브라우저, 폰 불가 | Windows·macOS 프로그램 + 서명 + 갱신 | loopback은 혼합 콘텐츠 예외지만 크롬 Private Network Access(사설망 접근 제한)가 preflight를 요구할 수 있음(배포 보류 중) [확인 필요], 운영체제 경고·서명 비용, 폰 사용자 제외 |
| D | **웹 페이지에서 직접 fetch** | 없음 | 사용자 브라우저 | 전부 | 없음 | **1.1 시험으로 불가** (CORS 머리 없음, http 사이트는 혼합 콘텐츠) |
| E | **설치 없이: 도서관 사이트로 직접 보내기** (결과 줄의 "도서관에서 보기" 링크, 혼잡일 때 안내) | 링크 클릭 | 사용자가 직접 도서관 사이트를 봄 | 전부 | 안내 문구·링크 자리 | 판정(대출 가능 여부)은 우리가 못 보여 줌. 지금도 `detailUrl` 링크가 있음 |
| F | 조회 서버(fetch-service)·업체 프록시 늘리기 | 없음 | 우리 | 전부 | 사이클 17 ADR-0095에 이미 있음 | 부담이 사용자로 가지 않음(비용이 우리에게) — 이 사이클 목표 밖 |
| G | 캐시 길게·인기 책 미리 조회 | 없음 | 우리 | 전부 | 설정·배치 | 부담을 줄이지만 옮기지는 않음. 보조 수단 |

제외한 생각: iframe으로 도서관 페이지 띄우기(다른 origin 내용은 스크립트가 못 읽음), 북마클릿(페이지 스크립트와 같은 CORS 제한), 공개 CORS 프록시(남의 서버, 신뢰·약관 문제), 데스크톱 앱(Electron 등)으로 서비스 통째 포장(규모 과함).

## 3. 각 방법의 근거

### A. 브라우저 확장
- 확장 안(service worker·확장 페이지)에서는 `host_permissions`가 있으면 다른 origin에 요청 가능. content script는 host_permissions가 있어도 CORS 적용 — https://developer.chrome.com/docs/extensions/develop/concepts/network-requests (확인 2026-10-15)
- 웹 페이지 → 확장 메시지: `externally_connectable`에 사이트를 적고 페이지가 `runtime.sendMessage(확장 ID, …)`. 확장 → 페이지 방향은 불가(페이지가 먼저 말을 걸어야 함) — https://developer.chrome.com/docs/extensions/develop/concepts/messaging (확인 2026-10-15)
- `host_permissions` 패턴을 더하거나 바꾸면 설치·갱신 경고 — https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions (확인 2026-10-15)
- Chrome Web Store: 심사 "대부분 며칠, 길면 몇 주", 넓은 host 권한은 심사가 길어질 수 있음 — https://developer.chrome.com/docs/webstore/review-process; 등록은 1회 등록비(금액은 페이지에 없음) — https://developer.chrome.com/docs/webstore/register (확인 2026-10-15)
- Microsoft Edge Add-ons: 기존 크롬 확장을 그대로 올릴 수 있음("Port a Chrome extension" 안내), Partner Center 개발자 계정, 인증(심사) 최대 7영업일, 단일 목적·권한 사유·개인정보 처리방침 URL 요구 — https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension (확인 2026-10-15)
- Firefox for Android: AMO(addons.mozilla.org)에 올린 확장을 쓸 수 있으나 PC와 기능 차이 있음, Manifest V2 권장, background service worker 미지원(event page 사용) — https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/ (확인 2026-10-15). 즉 안드로이드 폰에서 확장을 쓰려면 파이어폭스만 가능 [확인 필요: 실제 설치 시험]
- Safari: 확장을 macOS/iOS 앱 안에 담아 App Store로 배포, Apple Developer Program 연 99 USD — https://developer.apple.com/programs/whats-included/ (확인 2026-10-15). 배포 절차 페이지(developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension)는 본문을 받아오지 못해 확인 못 함
- 크롬(안드로이드)·사파리(iOS) 폰 브라우저: 크롬 안드로이드는 확장 미지원(공식 문서 미확인, 일반 지식) [확인 필요]

- **같은 일을 하는 확장의 선례**: 「Library Extension」(Quotidian LLC) — 아마존·Goodreads 등에서 사용자가 고른 공공도서관 온라인 목록을 확인해 소장·대출 가능을 같은 페이지에 표시. Chrome Web Store 사용자 10만 명, 평점 4.9(3.8천), "5,000곳 넘는 도서관", 크롬·파이어폭스·엣지 — https://chromewebstore.google.com/detail/library-extension/chkgcmmjoejpekoegkedcpifgfhpjmec, https://www.libraryextension.com/ (확인 2026-10-15). 변경 기록 2026.810.1: 일부 도서관 시스템(SirsiDynix)이 확장 검색을 자동 트래픽으로 의심해 막음 → 사용자가 그 사이트를 직접 방문하면 다시 됨(부분 해결) — https://www.libraryextension.com/release-notes/2026.810.1/ (확인 2026-10-15). 국내 서점·전자도서관용 같은 종류의 확장은 검색에서 찾지 못함
- Chrome Web Store 정책·심사: "기능에 필요한 가장 좁은 권한을 요청"(https://developer.chrome.com/docs/webstore/program-policies/permissions), 넓은 host 권한은 "심사가 더 오래 걸릴 수 있음", 거절은 정책 위반이 발견될 때(https://developer.chrome.com/docs/webstore/review-process), 심사 창에 권한마다 사유 칸·단일 목적 설명 칸(https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) (확인 2026-10-15). dev seed의 서로 다른 도서관 호스트 2,794개(`*.dkyobobook.co.kr` 491개 포함, 2026-10-15 셈). `optional_host_permissions`는 "설치 때가 아니라 쓸 때 사용자가 허용"(declare-permissions 문서)

### B. 사용자 스크립트
- Tampermonkey `GM_xmlhttpRequest`: "userscript가 HTTP 요청을 보내고 응답을 다룰 수 있게 함", `@connect`에 적은 도메인(하위 도메인 포함)만 허용, `@connect *`를 더하면 "항상 모든 도메인 허용" 버튼 제공, 적지 않은 도메인은 확인 창(문서는 "대부분 사용자의 확인 창을 피하려면 알려진 도메인을 적으라"고 함) — https://www.tampermonkey.net/documentation.php?q=GM_xmlhttpRequest, https://www.tampermonkey.net/documentation.php?q=connect (확인 2026-10-15)
- 사용자 입장: 관리자 확장(남의 제품) 설치 → 우리 스크립트 설치 → 도메인 허용. 확장 A보다 단계가 많음. 장점: 스토어 심사 없음, 수정이 바로 반영(스크립트 자동 갱신)

### C. 로컬 도우미 프로그램
- loopback(`http://127.0.0.1/`, `http://localhost/`)은 안전한 origin으로 보아 https 페이지에서 혼합 콘텐츠로 막히지 않음 — MDN Mixed content (위); W3C Secure Contexts 3.1절 "127.0.0.0/8 또는 ::1/128에 맞으면 potentially trustworthy", localhost 이름은 "MAY" — https://w3c.github.io/webappsec-secure-contexts/ (확인 2026-10-15)
- 크롬 Private Network Access: 공개 사이트가 사설망·loopback 서버에 요청할 때 preflight로 서버 허락을 확인하는 제한. 배포(enforcement)는 보류 중("rollout is on hold"), 경고 단계. 우리 도우미가 preflight에 답하면 통과 가능하나 실제 동작은 확인 못 함 — https://developer.chrome.com/blog/private-network-access-update-2024-03 (확인 2026-10-15) [확인 필요: 프로토타입]
- 운영체제 쪽: Windows SmartScreen·macOS Gatekeeper 경고를 피하려면 코드 서명(비용)·공증 필요 [확인 필요: 공식 문서]
- 폰 사용자는 쓸 수 없음

### E. 도서관 사이트로 직접 보내기
- 지금도 결과 줄에 `detailUrl`(도서관 상세 페이지)이 있음(`docs/current/api.md` items[] 설명). 혼잡(빨강)일 때 "지금은 도서관 사이트에서 직접 확인해 주세요" 안내와 링크를 앞에 두는 것은 설치 없이 바로 됨. 판정은 못 보여 줌

## 4. 공통 설계 (A·B·C 어느 쪽이든 같음)

- 서버 쪽 입구는 하나: 우리 서버가 "볼 주소 목록"을 주고, 사용자 쪽이 받아온 **원본 바이트(상태 코드 포함)**를 올리면 서버가 지금 adapter로 해석 → 캐시 → 화면. 이는 ADR-0015의 조회 서버 약속과 같은 모양이라 해석 코드가 한 곳에 남음. 확장·스크립트·도우미는 "사용자 쪽 조회 서버"가 됨
- 사용자 쪽도 도서관 한 곳에 동시 1건·1초를 지킴(사용자 IP 보호) [안]
- 사용자 쪽 조회는 서버 동시 검색 자리(20)를 쓰지 않음 [안]
- 폰(크롬·사파리)은 어느 방법으로도 안 되므로 폰은 서버 조회 + 신호(사이클 20 A부) + E로 감

## 4.1 결정 (2026-10-15, 방법 비교 결정 페이지)

- #1 **크롬만 먼저** [확정] (사용자: "크롬만 먼저 하자." — 제안 "크롬·엣지 함께" 미승인). 엣지·파이어폭스는 뒤로
- #2 사용자 스크립트(B): 만들지 않음. **backlog에도 적지 않고 이 사이클에서 조사했다는 기록만** [확정] (사용자: "사용자 스크립트 이건 백로그에도 쓰지 마 이 사이클에 조사했다고만 기록해")
- #5 사이클 21 전 dev 시험 둘 승인, 단 **요청 사이 1초 간격** [확정] (사용자: "근데 요청 시간 1초 간격 지켜")
- #3 로컬 도우미(C): 만들지 않음, backlog에도 적지 않고 조사 기록만 [확정] (사용자, 2026-10-15, #2와 같은 말)
- #4 설치 없는 길(E)을 사이클 20에 포함 [확정] (사용자 승인, 2026-10-15) → `scope.md` 포함 3-1

## 5. 확인 필요 (남은 것)

| 항목 | 확인 방법 |
|---|---|
| 확장 안에서 `http://` 도서관 사이트·중간 인증서 빠진 사이트가 열리는지 | 프로토타입 (확장 하나, 사이트 3곳) |
| 전체 도서관 호스트의 CORS 머리(1.1은 12곳 표본) | dev에서 일괄 호출 시험 (결과가 "전부 없음"이면 D는 완전히 제외) |
| 로컬 도우미: 크롬 PNA preflight 통과, Windows/macOS 서명 비용 | 프로토타입 + 공식 문서 |
| Firefox for Android에서 우리 확장 설치·동작 | 시험 |
| 크롬 웹스토어 등록비 금액 | 등록 페이지(로그인 뒤) 확인 |
| 사용자 중 설치할 사람 비율 | 알 수 없음. 배포 뒤 usagelog로 셈 |

## 6. 질문에 답 (2026-10-15): iframe은 왜 제외했나

- 다른 출처 iframe 안의 문서는 우리 스크립트가 읽을 수 없음(같은 출처 정책: `iframe.contentWindow` 등은 Window·Location에 "매우 제한된 접근"만, DOM 읽기 없음; 소통은 양쪽이 `postMessage`를 써야 함) — https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy (확인 2026-10-15). 읽지 못하면 판정·캐시·공유가 불가 → 부담을 옮기는 길이 아니라 E(사용자가 눈으로 보기)와 같음
- 띄우기 자체를 막는 도서관 있음: 응답 머리 확인 7곳 중 `lib.ice.go.kr`이 `X-Frame-Options: SAMEORIGIN` — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options (확인 2026-10-15). `e-lib.sen.go.kr`은 CSP가 있으나 `frame-ancestors`는 없음. 나머지 5곳은 머리 없음
- `http://` 도서관은 https 화면 안 iframe이 혼합 콘텐츠로 막힘
- 결론: 읽기 불가 + 일부 막힘 + http 불가 → E보다 못해 제외. 쉬운 설명은 `easy/2026-10-15-offload-options.html` "질문에 답" 카드

## 7. 질문에 답 (2026-10-15): 상태 신호를 10초마다 묻기 vs SSE

- 10초마다 묻기: 보는 사람 1명당 1분에 요청 6번, 한 번 1KB 안쪽(숫자 셋), 서버에 남는 상태 없음, 재연결 문제 없음, 지연 최대 10초(503이면 즉시 빨강). 만들 것: 주소 하나 + 화면 타이머
- SSE: 보는 사람마다 연결 1개를 계속 유지, 바뀔 때만 보내 바이트는 적음. nginx `proxy_read_timeout 120s`(dev `deploy/nginx/chaekcheck-locations.conf`) 안에 살아 있음 신호 필요, 폰 네트워크 변화·탭 잠듦에 재연결 필요, 열린 연결 목록·바뀜 알림 코드 필요. HTTP/1.1이면 도메인당 6연결 한도(MDN EventSource, https://developer.mozilla.org/en-US/docs/Web/API/EventSource, 확인 2026-10-15); 운영 nginx는 `http2 on`(dev `deploy/nginx/chaekcheck.conf`)이라 해당 없음
- 결론: 10초 늦어도 되는 작은 값이라 묻기가 더 싸고 단순. 수치는 추정(실측 없음). 쉬운 설명은 `easy/2026-10-15-scope-decisions.html` 3번 "질문에 답"
- (이어서, 사용자 "순수하게 비용") 돈: 둘 다 0원에 가까움. EC2는 인스턴스 고정 요금, Cloudflare 무료 요금제·터널에 요청 과금 항목 없음(과금 없음은 추정), 나가는 데이터는 AWS "매달 100GB 무료"(https://aws.amazon.com/ko/ec2/pricing/on-demand/, 확인 2026-10-15) 안. 묻기: 1명 3KB/분(추정) → 하루 1,000명×30분 ≈ 90MB/일 ≈ 2.7GB/월. SSE: 그 1/10 안쪽(추정). 100GB 초과 시 서울 GB당 단가는 확인 못 함. Cloudflare 뒤 SSE는 기본 125초 안에 응답이 흘러야 함(Error 524, https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524/, 확인 2026-10-15)
