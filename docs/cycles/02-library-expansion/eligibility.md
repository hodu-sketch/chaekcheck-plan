# 도서관별 가입 자격 조사 (진행 중)

- 조사일: 2026-09-28
- 방법: `collection-method.md` 4절. 운영 기관으로 묶고, 기관·도서관 이름으로 회원가입 안내를 찾음
- **2026-10-01 안내**: 최신 판정은 dev `docs/library-research/join-classification-2026-09-29.tsv`(+`-notes.md`), `-new42-` 파일, `scripts/library/join_overrides.tsv`(사람이 정한 값이 마지막에 이김), seed csv입니다. 이 문서는 검색 요약 단계의 기록입니다. notes가 이 문서 값 4곳(연천·정읍·하남·광진·의왕)을 원문으로 정정했습니다. 판정 규칙은 ADR-0013·ADR-0027, 문서 색인은 `docs/reference-index.md` 2절.
- **태그:** 아래 값은 모두 [확인 필요]입니다. 대부분 검색 결과 요약으로 확인했고 원문 페이지를 직접 읽지 않았습니다. seed에 넣기 전에 출처 페이지를 열어 한 번 더 확인합니다.
- 전자도서관 자격이 대출회원(정회원) 자격과 같은 곳이 대부분입니다. 다른 경우는 비고에 적었습니다.
- 진행: 전자도서관 338곳 중 334곳 조사 (공공도서관이 아닌 4곳 제외). 전자도서관별 결과는 `eligibility-by-library.md`. 아래 표는 첫 조사 때의 요약이고, 최신 값은 `eligibility-by-library.md`가 기준입니다

## 운영 기관 묶음

| 운영 기관 | 해당 도서관 (교보 목록) | 자격 | 범위 | 출처 |
|---|---|---|---|---|
| 경기도교육청 (`elib.goe.go.kr` 9곳) | 경기도교육청전자도서관, 경기중앙·과천·성남·의정부·화성교육도서관, 경기평생학습관, 평택·포천분관 | 거주 (경기도민) | 경기도 | https://lib.goe.go.kr/elib/intro/join/index.do?menu_idx=70 |
| 경상남도교육청 (`ebook.gne.go.kr`) | 경상남도교육청 통합전자도서관, 고성·김해·마산·양산·부산남지·창원도서관 등 | 거주 (경남도민, 비대면 가입은 거주지 확인). 교육청 소속 도서관 대출회원 | 경상남도 | https://gnelib.gne.go.kr/menu.es?mid=a10607040000 |
| 인천광역시교육청 (`e-lib.ice.go.kr` 7곳) | 계양·연수·부평·화도진·서구도서관 등 | 거주 (주민등록상 인천) 또는 소속 도서관 방문 가입. 전자도서관만 쓰면 홈페이지 가입으로 가능하다는 안내도 있음 | 인천 | https://lib.ice.go.kr/elib/html.do?menu_idx=61 |
| 서울특별시교육청 | 서울시교육청 전자도서관 | 거주·재직·재학 (서울), 재외동포·외국인 등록자 | 서울 | https://e-lib.sen.go.kr/contents/guide |
| 전라남도교육청 (`ebook.jne.go.kr`) | 곡성·광양·나주·목포 등 교육청 소속 도서관 | 거주 (전남 도민 비대면 인증) 또는 소속 도서관 대출회원 | 전라남도 | https://jnelib-ebook.jne.go.kr/ |
| 전북특별자치도교육청 (`ebook.jbe.go.kr` 17곳) | 고창·군산·김제·남원·마한·부안·순창·무주 등 교육문화회관·공공도서관 | 전북교육청 소속 도서관 통합 회원 (세부 거주 조건 미확인) | 전북 [확인 필요] | https://lib.jbe.go.kr/gecc/html.do?menu_idx=242 |

## 개별 도서관

| 도서관 | 자격 | 범위 | 비고 | 출처 |
|---|---|---|---|---|
| 고흥군립도서관 (사이클 01) | 누구나 | — | 사이클 01 [확정] | 사이클 01 spec |
| 강남구청 | 거주·재직·재학 | 강남구 | 구 도서관과 별도 가입 | https://ebook.gangnam.go.kr/elibmreg/mem_policy.asp |
| 강북문화정보도서관 | 웹회원 가입만으로 전자책 이용 가능하다는 안내 | 누구나? | 자격 제한 여부 원문 확인 필요 | https://www.gblib.or.kr/gangbuk/board/faq.do |
| 고양시 도서관센터 | 거주 | 경기도 (비대면 온라인 정회원) | | https://www.goyanglib.or.kr/center/menu/130071/contents/40009/contents.do |
| 경북도서관 | 거주 (경북도민 인증) | 경상북도 | | https://www.gb.go.kr/lib/ |
| 경상남도대표도서관 | 거주 (경남도민) | 경상남도 | | https://lib.gyeongnam.go.kr/index.lib?menuCd=DOM_000000202005000000 |
| 국회도서관 | 18세 이상·대학생 등, 장기열람증(방문 발급) 필요 | 전국 | 거주 제한 없음, 방문 필요 | https://www.nanet.go.kr/libaryuseinfo/libUseUserStepView.do |
| 강진군립도서관 | 거주 (강진군 정회원) | 강진군 | | https://www.gjlib.go.kr/ |
| 계룡도서관 | 거주·재직, 체류지 등록 외국인 | 계룡시 | | https://lib.gyeryong.go.kr/ |
| 과천시정보과학도서관 | 거주 (경기도, 비대면) · 재직·재학 (과천시, 방문) | 경기도 / 과천시 | | https://www.gclib.go.kr/lib/menu/10077/contents/40020/contents.do |
| 광산구통합도서관 | 거주 (광주시민 인증) | 광주 | 준회원도 구독형 이용 | https://lib.gwangsan.go.kr/main/memberJoin |
| 광진구립도서관 | 대출회원(정회원)만 | 미확인 | 서울시민카드 간편가입 | https://www.gwangjinlib.seoul.kr/gjinfo/menu/10079/contents/40019/contents.do |
| 군포시중앙도서관 | 거주 (경기도) · 재직·재학 (지역 소재) · 국내 거주 외국인 | 경기도 | | https://www.gunpolib.go.kr/ |
| 김제시립도서관 | 전북교육청 통합 회원 시스템 (조례 13조 자격) | 미확인 | | https://gjl.gimje.go.kr/index.gimje?menuCd=DOM_000000103002001000 |
| 남양주도서관 | 정회원만 | 미확인 | | https://lib.nyj.go.kr/jyy/menu/11525/contents/40070/contents.do |
| 부천시립도서관 | 경기도 소재 직장·학교 재직·재학자도 회원증 발급 | 경기도? | 원문 확인 필요 | http://www.bcl.go.kr/ |
| 마포구청 (마포구립도서관) | 거주·재직·재학 | 서울 | 서울온 앱 모바일 회원증 | https://mplib.mapo.go.kr/intro/contents/service/elibrary.do |
| 서초구립반포도서관 | 거주·재직·재학(대학) | 서울 | 방문 발급 | https://public.seocholib.or.kr/MemberJoin |
| 노원구 구립도서관 | 거주·재직·재학 (서류에 서울 주소) | 서울 | | https://www.nowonlib.kr/ |
| 도봉문화정보도서관 | 도봉구통합도서관 회원증 소지자 | 미확인 | | https://www.unilib.dobong.kr/contents.do?idx=301 |
| 동대문구립도서관 | 홈페이지 회원 | 미확인 | | https://www.l4d.or.kr/intro/40015/contents.do |
| 동작구통합도서관 | 정회원 | 미확인 | | https://lib.dongjak.go.kr/ |
| 성동구립도서관 | 성동구 도서관 회원카드 + 웹아이디 | 미확인 | | https://www.sdlib.or.kr/ |
| 성북도서관 | 성북구립도서관 회원 | 미확인 | | https://www.sblib.seoul.kr/library/40008/contents.do |
| 부산광역시립시민도서관, 부산대표도서관 | 거주·재직·재학 | 부산 | 부산광역시 전자도서관 통합 회원 | https://library.busan.go.kr/portal/html.do?menu_idx=65 |
| 선경도서관 (수원시) | 거주 (경기도) · 재직·재학 (수원시) | 경기도 / 수원시 | 정회원만 | https://www.suwonlib.go.kr/sk/html/01_guide/guide0805.asp |
| 용인시립도서관 | 거주 (경기도) · 재직·재학 (용인시, 방문) | 경기도 / 용인시 | 온라인 정회원은 경기도민만 | https://lib.yongin.go.kr/intro/memberJoinIntro.do |
| 순천시립도서관 | 대출증 발급 회원 | 미확인 | 구독형 월 최대 20종 | https://library.suncheon.go.kr/ |
| 여수시립도서관 | 도서대출회원 (방문 발급) | 미확인 | | https://yslib.yeosu.go.kr/front/index.php?g_page=member&m_page=member02 |
| 연천군도서관 | 연천군립도서관 정회원 | 미확인 | | https://library.yeoncheon.go.kr/menu/10032/contents/40015/contents.do |
| 울산도서관 | 거주·재직·재학, 재외동포·외국인 등록자 | 울산 | 울산시민인증 | https://library.ulsan.go.kr/unit/gpki/authStep01.do |
| 전주시립도서관 | 거주 (전주시 거주 확인) | 전주시 | | https://lib.jeonju.go.kr/ |
| 인천광역시 통합전자도서관 (미추홀 등 인천 공공도서관) | 책이음 회원증 소지자, 비대면은 거주 (인천) | 인천 | | https://ebookcontents.incheon.go.kr/ebookPlatform/m/login.do |
| 파주시중앙도서관 | 거주 (경기도, 비대면) · 경기도 소재 재직·재학 (방문) | 경기도 | | https://lib.paju.go.kr/jalib/memberUntactRegularApplyGuide.do |
| 익산시립도서관 | 거주·재직·재학 | 익산시 | | https://lib.iksan.go.kr/main/contents.do?idx=4420 |
| 제주 우당도서관 (제주도 공공도서관) | 거주·재직·재학 (방문 가입) | 제주 | | https://www.jeju.go.kr/lib/intro/member.htm |
| 천안시중앙도서관 | 천안시 도서관 정회원 (방문 발급) | 미확인 | | https://www.cheonan.go.kr/lib.do |
| 하남시립도서관 | 도서대출 정회원 | 미확인 | | https://www.hanamlib.go.kr/nalib/contents.do?key=370 |
| 의정부지식정보센터 | 회원증 발급자 (방문) | 미확인 | | https://www.uilib.go.kr/main/html/ebook.do?menu_idx=50 |
| 청주시립도서관 | 정회원 | 미확인 | | https://library.cheongju.go.kr/lib/front/index.php?g_page=guide&m_page=guide01 |
| 용산구립도서관 | 거주·재직·재학 | 서울 | 앱에서 서울 거주 확인 | https://www.yslibrary.or.kr/dream/menu/10284/contents/40048/contents.do |
| 중랑구립정보도서관 | 거주 (서울) · 재직 (중랑구) | 서울 / 중랑구 | | http://ebookjungnanglib.seoul.kr/Information/lending.html |
| 울주도서관 (울주통합도서관) | 거주 | 울산 | | https://uljulib.ulju.ulsan.kr/pageCont.do?menuNo=3080000 |
| 충남도서관 | 거주 (충남도민 비대면 인증) | 충청남도 | | https://library.chungnam.go.kr/html/1412/K/detail.do |
| 한밭도서관 (대전 공공도서관 통합) | 거주 (대전시민, 통합회원증) | 대전 | 재직·재학 여부 원문 확인 필요 | https://www.u-library.kr/webcontent/info/7 |
| 포항시립도서관 | 거주·재직·재학 | 포항시 | 방문 발급 | https://www.phlib.or.kr/ |
| 전남광주통합특별시 북구 통합도서관 | 거주 (광주시민 인증) | 광주 | | https://lib.bukgu.gwangju.kr/main/contents.do?PID=010502 |
| 정읍시립도서관 | 정회원 | 미확인 | | https://lib.jeongeup.go.kr/main/contents.do?PID=0810 |
| 이진아기념도서관 (서대문구) | 홈페이지 회원 | 미확인 | | https://lib.sdm.or.kr/sdmebook/index.do |
| 울진군통합전자도서관 | 도서관 회원 | 미확인 | | https://lib.uljin.go.kr/ |
| 예산군립도서관 | 거주·재직·재학·체류지 등록 외국인 (예산군). 전자책은 충남도민 비대면 인증으로도 가능 | 예산군 / 충청남도 | | https://www.ysplib.go.kr/home/board/brdDetail.do?menu_cd=000038&num=1753 |
| 세종시교육청 (평생교육학습관) | 거주 (세종시민 온라인 인증) 또는 재직·재학 (방문) | 세종 | | https://lib.sje.go.kr/prog/user/sjelib/sitemap_02/userType.do |
| 광주광역시립도서관 (광주 시립) | 거주 (광주시민 인증) 또는 방문 정회원 | 광주 | | https://citylib.gwangju.kr/main/contents/elibrary |
| 창녕도서관 (경남교육청) | 거주 (창녕군) | 창녕군 | 경남교육청 소속인데 창녕군민 기준이라는 안내. 원문 확인 필요 | http://cnlib.gne.go.kr/menu.es?mid=c30606000000 |
| 옥천군공공도서관 | 신청서 + 본인확인 | 미확인 | | https://oc.go.kr/lib/front/index.php?g_page=guide&m_page=guide02 |
| 음성군립도서관 | 군립도서관 회원 | 미확인 | | lib.eumseong.go.kr |
| 목포시통합도서관 | 정회원 (방문 발급) | 미확인 | | https://www.mokpolib.or.kr/ |
| 영광군립도서관 | 거주·재직·재학 | 영광군 | 공식 회원가입 페이지 직접 확인 (2026-09-28) | https://www.yggunlib.go.kr/Join |
| 춘천시립도서관 (YES24) | 거주 (춘천시, 앱) · 재직·재학 (춘천시, 증빙). 타지역 거주자는 준회원 회원증으로 이용 가능하다는 안내 | 춘천시 (타지역 준회원 범위 확인 필요) | 전자책까지 준회원이 되는지 원문 확인 필요 | https://library.chuncheon.go.kr/library-useinfo/card-issuance/ |
| 원주시립도서관 (교보·YES24) | 거주·재직·재학 (방문 승인) | 원주시 | | https://lib.wonju.go.kr/portal/menu/569/content |
| 강원특별자치도교육청 전자도서관 | 교육청 통합도서관 정회원, 강원 거주 재외동포·외국인 포함 | 강원 | | https://ebook.gwe.go.kr/ |
| 횡성군립도서관 (YES24) | 회원 (대출카드 발급) | 미확인 (열람실은 횡성군민 한정) | | https://lib.hsg.go.kr/library/index.php?g_page=intro&m_page=intro02 |
| 경산시립도서관 (교보·YES24·북큐브) | 거주 (경산시, **대구 동구·수성구**) · 재직 (경산시) | 경산시 + 대구 동구·수성구 | 다른 시·도 지역이 자격에 들어가는 예. 지금 모델(근거 × 지역 여러 줄)로 표현 가능 | https://lib.gbgs.go.kr/ |
| 김천시립도서관 (YES24·북큐브) | 거주 · 재직 · 재학(대학 이상) · 외국인 | 김천시 | | https://www.gcl.go.kr/ |
| 구미시립도서관 (YES24·북큐브) | 거주 (구미시민 인증) | 구미시 | | https://lib.gumi.go.kr/page.do?mid=148 |
| 경주시립도서관 (YES24) | 정회원 | 미확인 | | http://library.gyeongju.go.kr/?page_id=digital_03 |
| 속초시립도서관 (YES24) | 회원증 발급 회원 | 미확인 | | https://library.sokcho.go.kr/page/2sub11.jsp |
| 강릉시립도서관 (YES24) | 검색으로 자격을 찾지 못함 | — | | https://www.gnslib.or.kr/ |
| 고창군 도서관, 제천기적의도서관 | 검색으로 자격을 찾지 못함 | — | 홈페이지 직접 확인 필요 | https://www.yggunlib.go.kr/Join |
| 평택시립도서관, 충북중앙도서관 | 검색으로 자격을 찾지 못함 | — | 홈페이지 직접 확인 필요 | https://www.ptlib.go.kr/intro/memberJoinIntro.do |
| 안산시도서관, 아산시립도서관, 서산시립도서관 | 검색으로 자격을 찾지 못함 | — | 홈페이지 직접 확인 필요 | https://lib.ansan.go.kr/MemberJoinInfo |
| 광양시립도서관, 군산시립도서관 | 검색으로 찾지 못함 | — | 홈페이지 직접 확인 필요 | https://lib.gunsan.go.kr/ |

## 관찰

- 교육청과 광역 단위 도서관은 **시·도 거주**가 대부분입니다. 시·군·구 도서관은 **그 시·군·구 또는 그 시·도 거주 + 그 지역 재직·재학**이 많습니다.
- 경기도 시·군 도서관은 "경기도 거주자면 비대면 가입"이 흔합니다(고양, 과천, 군포). 경기도 전체가 범위인 도서관이 많을 수 있습니다.
- 자격 모델에 담아야 하는 유형 (2026-09-28 조사에서 실제로 본 것, 모두 [확인 필요]):
  - **다른 시·도 지역을 함께 받는 곳**: 금천구립(서울 + 광명시), 광명시(경기도 + 서울 금천구), 송파구(서울 + 경기도), 경산시립(경산 + 대구 동구·수성구), 장성군립(전남 + 광주)
  - **책이음 회원을 받는 곳**: 금정도서관(다른 지역 책이음 회원), 장성군립(전국 책이음 회원), 동해시립(책이음 참여도서관 회원). 사용자의 "거주 지역"만으로는 판정할 수 없고 "책이음 회원인지"가 따로 필요함
  - **특정 대상만 받는 곳**: 대구학생전자도서관(학생), 해밀도서관(시각장애인), 국회도서관·국립세종(대출증 방문 발급)
  - **원문상 누구나 가입할 수 있는 곳** (2026-09-28 원문 확인): 김해시 통합도서관("회원가입 자격 : 전 국민"), 양산시립도서관("주민등록상 타지역 주민" 포함), 의왕시중앙도서관(방문 정회원 "누구나"). 고흥(사이클 01)에 더해 확인된 누구나 가입 도서관
  - **인접 지역을 받는 곳** (원문 확인): 천안시중앙도서관(세종·아산·공주·평택·안성·청주·진천 시민), 안성시립도서관(경기도민 + 천안·진천·음성 주민), 남동구립도서관(인천 + 시흥시)
  - **누구나일 수 있으나 원문 확인 못 한 곳**: 영천시립, 서울문화재단 예술교육정보자료관. 강북문화정보도서관은 원문 확인 결과 서울 시민·학생·직장인이었음 (검색 요약이 틀림)
- 국회도서관처럼 **거주 제한은 없지만 방문이 필요한** 곳이 있습니다. 지금 자격 모델(근거 × 지역)로는 "누구나 가입"과 구분되지 않습니다 [확인 필요].

## 자격을 찾지 못한 도서관 처리 [확정]

- 자격을 찾지 못한 도서관은 **"못 찾음"으로 둡니다.** 같은 지역의 다른 도서관 규칙으로 추정해서 채우지 않습니다 (사용자, 2026-09-28).
- 위 표에서 범위가 "미확인"인 곳(정회원이라는 것만 알고 거주 범위를 모름)도 범위는 못 찾음입니다.
- 화면에서는 사이클 02 scope대로 "가입 자격 확인 필요"로 표시합니다.

## 전자도서관별 정리

전자도서관 이름마다 자격을 어떻게 알아냈는지는 `eligibility-by-library.md`에 따로 정리했습니다.
