# 사이클 07 조사

- 작성 2026-10-05. 원본 응답 파일은 plan 세션 임시 폴더에만 있음(git 밖).

## 1. 북큐브·알라딘 대출 현황 읽기


- 확인일: 2026-10-05. 모든 [확정]은 아래 표본 주소에 이날 직접 GET 한 결과입니다. 로그인·폼 제출·대출·예약은 하지 않았습니다.
- 호출 규칙: 같은 호스트 동시 1건, 요청 사이 1.6초, 총 25건(한도 40), User-Agent `Mozilla/5.0 (Windows NT 10.0; Win64; x64) chaekcheck-crawler/0.1 (catalog survey)`, Python urllib.
- 표본은 읽기 전용 스냅샷 `ebook-catalog-2026-10-05-0745.sqlite`의 `library`·`holding`에서 골랐습니다.
- 원본 응답은 같은 폴더 `bodies/`에 있습니다(이 세션 임시 폴더).

### 결론 (한 줄씩)

- **북큐브: 로그인 없이 됩니다.** 책 한 권 XML `…/xml/productView/?num=`과 제목 검색 XML `…/xml/productSearch/?keyword=&keyoption2=1`에 `volume`(보유)·`nowLendCount`(대출)·`nowReserveCount`(예약)가 있음. HTML 상세 화면 숫자와 일치 [확정].
- **알라딘: 로그인 없이 됩니다.** 상세 HTML "보유현황 보유 N, 대출 N, 예약 N", 검색 HTML 줄마다 `span.volumecnt`·`uselendingcnt`·`usereservecnt` [확정].
- 두 플랫폼 모두 지금 교보 일반·YES24와 같은 "숫자 화면"(`ParsedItem.counted`, `ParsedDetail.counted`)으로 맞출 수 있음. 단 북큐브 **구독(대여)형**은 보유가 0이고 "동시이용제한 없음"이라 교보 구독형처럼 따로 다뤄야 함.

### 지금 adapter가 하는 일 (dev 코드, 읽기만 함)

- `PlatformAdapter`: `searchUri`(제목·저자·출판사 검색 주소) → `parse`(목록 줄) → 필요하면 `parseDetail`(책 상세). 사이트가 쓴 것만 읽고 대출 가능 여부는 resolver가 정함(ADR-0019).
- `ParsedItem(title, author, publisher, supplier, holdings, loaned, reservations, detailPath, siteVerdict)`. 숫자 화면은 `counted(...)`.
- `ParsedDetail(holdings, loaned, reservations, siteVerdict)`. 교보 일반 `span.use` "[ 대출 : X/Y 예약 : Z ]", YES24 `div.stat` "보유 N 대출 N 예약 N"을 읽음. 구독형 상세는 읽지 않음.
- `detailUri`는 검색 주소 기준 상대 경로를 풂.
- fetch-service에는 호스트 허용 목록이 없음. `UrlGuard`가 http/https만, 사설·루프백 주소 거부(SSRF)만 함. 시간 제한 connect 5s, read 5s (`fetch-service/src/main/resources/application.yml`).

### 1. 북큐브 `BOOKCUBE_FX`

### 표본

| 도서관 (id) | 주소 | 호스팅 | 책 1 (상세) | 책 2 (검색) |
|---|---|---|---|---|
| 울산동부도서관 (100089) | `https://ebook.usdl.or.kr/FxLibrary` | 자체 서버 | `F0002910` 힘 있는 말하기 | 휘게스타일 |
| 부산광역시 전자도서관(구독) (100062) | `https://busanlib.bookcube.biz/FxLibrary` | `*.bookcube.biz` 공용, 구독(대여)형 | `A07010442` 영웅 계백 2부 1 | 영웅 계백 1부 3 |
| 현대엔지니어링 (100131) | `https://hec.dasangng.co.kr/FxLibrary` | `*.dasangng.co.kr`(다산) | `A99027749` 탈무드 이야기 | 떨메와 달궁이 |
| 서울대학교 eBook (100276) | `https://snu.bookcube.biz/FxLibrary` | `*.bookcube.biz` 공용, 소장형 | 목록 20줄만 | — |

### 1-1. 상세에서 숫자가 보이는가 — 예 [확정]

**XML (권장)** `{base}/xml/productView/?num={num}` — `application/xml;charset=UTF-8`, 4~10KB, 0.16~1.2초. 상세 HTML 머리의 스크립트에 `var productViewXmlURL = "…/FxLibrary/xml/productView/";`로 적혀 있는 주소입니다.

```xml
<volume><![CDATA[5]]></volume>
<nowLendCount><![CDATA[2]]></nowLendCount>
<nowReserveCount><![CDATA[0]]></nowReserveCount>
<isReservable><![CDATA[true]]></isReservable>
<isMaxLendLimit><![CDATA[true]]></isMaxLendLimit>
```
(울산동부 `num=110900699` 거짓말 학교. HTML 목록 "대출 2/5"와 같음)

- 대출 중 확인: 울산동부 `F0000631` 늑대와 일곱 마리 아기염소 → XML `volume 1, nowLendCount 1`, HTML 목록 "대출 1/1" [확정].
- `isReservable`은 본 모든 책에서 `true`, `isMaxLendLimit`도 모든 책 `true`(구독 목록 100줄 포함) → 책의 상태가 아니라 비로그인 사용자 쪽 값으로 보임. 뜻은 확인 못 함. 쓰지 않는 것을 권함 [안].
- 주의: `<Programs>`·`<Terminals>` 아래에도 `<name>`이 여러 번 나옴(아이폰, 안드로이드 …). `<Product>` 바로 아래 요소만 읽어야 함 [확정].

**HTML 상세** `{base}/product/view/?num={num}` — 30~45KB, 0.9~1.7초. 화면(스킨)이 두 가지:

- 옛 스킨(울산동부, 현대엔지니어링):
  ```html
  <li class="txt02">
    <span class="red">대출 <em>0/2</em></span>
    <span>예약 <em>0</em></span>
  ```
  "대출 X/Y" = 대출 X, 보유 Y (교보와 같은 꼴).
- 새 스킨(부산 구독, `v3_logo.png`): `<ul class="state col3"><li><p>대출</p>1</li>…<li><p>누적대출</p>1</li>` — 보유·예약이 없음.
- 스킨마다 HTML이 달라서 XML이 더 안정적임 [안].

### 1-2. 제목 검색 — 이것도 됨 [확정]

`{base}/xml/productSearch/?keyword={UTF-8 퍼센트 인코딩}&keyoption2=1` (1 = 서명). 응답 머리 `<totalItem>`, `<totalVolume>`, 그 아래 `<Product>`마다 상세 XML과 같은 `volume`·`nowLendCount`·`nowReserveCount`.

- 세 곳 모두 정확히 1건(`totalItem 1`). 0.6초(울산동부), 3.5초(부산), 3.2초(현대엔지니어링).
- 검색 한 번으로 목록 + 숫자를 함께 받으므로 지금 adapter 흐름(`searchUri` → `parse`)과 맞음. 상세 XML은 `parseDetail`(보유 화면 스트림)에 맞음.
- 쪽 크기·쪽 번호 인자는 이번에 시험하지 않음 → 확인 못 함 (목록 XML은 `itemCount`·`page`가 동작함, `platforms.md` 7절).
- EUC-KR 검색어는 시험하지 않음. UTF-8로 맞게 나옴.

### 1-3. 사이트 차이

| 항목 | 자체 서버(울산동부) | `*.bookcube.biz` 소장형(서울대) | `*.bookcube.biz` 구독형(부산) | 다산 `*.dasangng.co.kr` |
|---|---|---|---|---|
| XML 주소·모양 | 같음 | 같음 | 같음 + `<nowRentalCount>` 더 있음 | 같음 |
| `volume` | 실제 보유(2, 5 …) | 5 (20줄 모두) | **0** (100줄 모두) | 5 |
| 대출 수 | `nowLendCount` | `nowLendCount` | `nowLendCount`는 0, **`nowRentalCount`**가 현재 이용 수(100줄 중 4줄이 1) | `nowLendCount` |
| HTML 스킨 | 옛 스킨 | 확인 못 함 | 새 스킨 | 옛 스킨 |

모두 2026-10-05 [확정].

### 1-4. TLS·인코딩·응답 시간

- 세 호스트(+서울대) 모두 HTTPS 인증서 검증 통과. 느슨한 TLS 다시 시도 필요 없었음 [확정]. 스냅샷에는 `http://`나 포트가 붙은 북큐브 사이트도 많음(예 `http://elib.gyeongnam.go.kr:8000/FxLibrary`) — 이번엔 시험 안 함.
- 모두 UTF-8(`Content-Type`에 표시). CDATA로 감싼 값.
- 응답 시간: 상세 XML 0.16~1.2초, 검색 XML 0.6~3.5초, 목록 XML 100줄 2.3초(울산동부)·8.0초(부산 구독, 15만 종).

### 1-5. 구독(대여)형 [확정]

- 부산 구독 상세 HTML: `<span class="state_rental">대여<em class="layer-tooltip">동시이용제한 없이 이용 가능합니다. </em></span>`
- 메뉴: "대여형 콘텐츠는 동시이용제한이 없습니다. 사전 공지 없이 컨텐츠가 추가/제외 될 수 있습니다."
- XML: `volume 0`, `nowLendCount 0`, `nowReserveCount 0`, `nowRentalCount` = 지금 이용 중인 사람 수.
- 따라서 "보유 0"을 그대로 읽으면 "대출 불가"로 잘못 보임. 교보 구독형처럼 "구독 = 늘 이용 가능" 쪽으로 처리해야 함 [안]. 구독형인지 알아보는 방법 후보: `volume=0`이면서 `nowRentalCount` 요소가 있음, 또는 HTML `state_rental` [안]. 한 사이트 안에 소장·대여가 섞이는지는 확인 못 함 (부산 100줄은 모두 대여, 울산동부·서울대 목록에는 `nowRentalCount`가 없었음).

### 2. 알라딘 `ALADIN_V1`

### 표본

| 도서관 (id) | 주소 | 호스팅 | 책 1 (상세) | 책 2 (검색) |
|---|---|---|---|---|
| 울산과학대학교 (102492) | `https://uc.aladinebook.co.kr` | `*.aladinebook.co.kr` 공용 | `353793225` 인류가 인류로 남기까지 | 집게 발가락 |
| 부산과학기술대학교 (102490) | `http://ebook.bist.ac.kr` | 자체 서버, http | `WOORIx0014324` 다섯번째 여자 (개정판) | 화폐로 읽는 세계 인물여행 |
| 광주보건대학교 (102487) | `https://lib.ghu.ac.kr:444` | 자체 서버, https 포트 444 | `999627` 눈 깜짝할 사이 서른셋 | 사람의 아이들 |

### 2-1. 상세에서 숫자가 보이는가 — 예 [확정]

`{root}/sub/sub.htm?mode=view&nav_code={전자책 메뉴}&goods_id={goods_id}` (긴 `mv_data` 없이 열림). 28~38KB, 0.25~0.94초.

```html
<li><span class="tt">보유현황</span><span>보유 <em>1</em>, 대출 <em>1</em>, 예약 <em>0</em>, 누적대출 <em>32</em></span></li>
```
(광주보건대 `goods_id=276357662` 달러구트 꿈 백화점 2)

- 대출 중이면 버튼이 "대출하기" → "예약하기"로 바뀜(같은 책) [확정]. 숫자로 충분하므로 버튼은 읽지 않아도 됨 [안].
- "누적대출"은 광주보건대·부산과기대에는 있고 울산과학대에는 없음(`보유 <em>2</em>, 대출 <em>0</em>, 예약 <em>0</em>`) → "보유/대출/예약" 라벨로 읽어야 함 [확정].
- 상세 HTML 주석에 `ebook_view_2.php` 스킨 이름이 보임(세 곳 같음).

### 2-2. 제목 검색 — 이것도 됨 [확정]

`{root}/sub/sub.htm?nav_code={전자책 메뉴}&code=search&search_item=title&search_order={UTF-8 퍼센트 인코딩}&view_level=1`. 1.1~2.6초, 28~32KB.

```html
<div>총 <em class="total-list-cnt">1</em> 건의 도서가 있습니다.</div>
…
<h3 class="rentinfo">
  <span class="volumecnt">보유 <em>2</em></span>
  <span class="uselendingcnt">, 대출 <em>0</em></span>
  <span class="usereservecnt">, 예약 <em>0</em></span>
```
- 줄: `ul.list > li.line`, 제목 `h2.book_tit a`(링크 끝 `&goods_id=`), `span.writer`, `span.pub`, 공급사 `div.com div.company…`.
- **함정**: 같은 쪽 위 `<b id="searchResultCnt">0</b>`는 세 곳 모두 결과가 있어도 0. 전체 건수는 `em.total-list-cnt`를 읽어야 함 [확정].
- 쪽 크기 `list_scale`, 시작 `startPage`(0부터 책 순번)는 목록에서 확인된 값(`platforms.md` 8절). 검색 쪽에도 같은지는 이번에 시험 안 함 → 확인 못 함.
- 출판사 검색 값은 여전히 확인 못 함.

### 2-3. 사이트 차이

- `*.aladinebook.co.kr`(울산과학대)와 자체 서버(부산과기대 http, 광주보건대 https:444)의 상세·검색 HTML 모양이 같음. 다른 점은 "누적대출" 유무, 로그인 메뉴 `nav_code` 값(`ala…`/`ebo…`)뿐 [확정].
- 전자책 메뉴 `nav_code=ebo1655356114`는 스냅샷의 25곳 모두 같은 값(`library.base_url`) [확정, 스냅샷 기준].
- `libasp.aladin.co.kr`: 스냅샷의 서비스 도서관 중 이 주소를 쓰는 곳은 0곳. 첫 화면 `https://libasp.aladin.co.kr/`은 "알라딘 서비스 점검 안내" 쪽(3.5KB)이 옴 — "각 기관 별 작업으로 통합 일정 안내 불가" [확정, 2026-10-05]. 후보 조사(2026-09-30·10-03)에서도 하버드옌칭도서관·장위중학교가 `NO_LIST_LINK`. adapter 대상에서 빼도 됨 [안].

### 2-4. TLS·인코딩·응답 시간

- https 두 곳(울산과학대, 광주보건대 :444) 인증서 검증 통과 [확정]. 부산과기대는 http.
- 세 곳 모두 `Content-Type: text/html; charset=UTF-8`, `<meta … charset=utf-8>`. 검색어 UTF-8로 맞게 나옴 [확정]. (`platforms.md`의 "선언은 EUC-KR인데 본문은 UTF-8" 사이트는 이번 표본에 없었음.)
- 응답 시간: 상세 0.25~0.94초, 검색 1.1~2.6초, 대출 베스트 목록 0.93초.

### 2-5. 구독형

- 알라딘에서는 구독(대여)형 표시를 보지 못함 → 확인 못 함. 오디오북 전용 사이트(경북도서관 오디오북)는 이번 표본에 없음.

### 3. adapter 판단에 쓸 정리 [안]

| | 북큐브 | 알라딘 |
|---|---|---|
| 로그인 없이 보유·대출·예약 | 됨 (XML) | 됨 (HTML) |
| 검색 adapter 소스 | `xml/productSearch` (제목 1·저자 2·출판사 3) | `sub.htm?code=search&search_item=title\|author` |
| 상세(`parseDetail`) 소스 | `xml/productView/?num=` | `sub.htm?mode=view&nav_code=&goods_id=` |
| 숫자 화면으로 맞추기 | 소장형은 그대로. 구독형은 따로 | 그대로 |
| 사이트 간 차이 | 구독형 여부, HTML 스킨(XML은 같음) | "누적대출" 유무 정도 |
| 인코딩 | UTF-8 | UTF-8 |

### 확인 못 함 (다음에 확인할 방법)

| 항목 | 방법 |
|---|---|
| 북큐브 `isReservable`·`isMaxLendLimit` 뜻 | 로그인 상태와 비교해야 해서 비로그인으로는 확인 불가. 쓰지 않는 쪽 권함 |
| 북큐브 한 사이트에 소장·대여가 섞이는지 | API 호출 시험 (대여형·혼합형 `*.bookcube.biz` 몇 곳 목록 XML) |
| 북큐브 검색 XML 쪽 크기·쪽 번호 인자 | API 호출 시험 |
| 북큐브 http·포트 사이트(경남, 교육청 등)의 TLS·응답 | API 호출 시험 |
| 북큐브 없는 `num`일 때 응답 | API 호출 시험 |
| 알라딘 검색 쪽의 `list_scale`·`startPage` | API 호출 시험 |
| 알라딘 출판사 검색, 구독형 화면 | API 호출 시험 |

### 호출 기록 (25건, 2026-10-05)

| # | 주소 | 결과 |
|---|---|---|
| 1 | `https://ebook.usdl.or.kr/FxLibrary/product/view/?num=F0002910` | 200, 0.89s, 34,889B |
| 2 | `https://busanlib.bookcube.biz/FxLibrary/product/view/?num=A07010442` | 200, 0.88s, 39,311B |
| 3 | `https://hec.dasangng.co.kr/FxLibrary/product/view/?num=A99027749` | 200, 1.67s, 30,942B |
| 4 | `https://ebook.usdl.or.kr/FxLibrary/xml/productView/?num=F0002910` | 200, 0.20s, 8,065B |
| 5 | `https://busanlib.bookcube.biz/FxLibrary/xml/productView/?num=A07010442` | 200, 0.31s, 5,473B |
| 6 | `https://hec.dasangng.co.kr/FxLibrary/xml/productView/?num=A99027749` | 200, 1.19s, 4,955B |
| 7 | `https://ebook.usdl.or.kr/FxLibrary/xml/productSearch/?keyword=휘게스타일&keyoption2=1` | 200, 0.59s, 1건 |
| 8 | `https://busanlib.bookcube.biz/FxLibrary/xml/productSearch/?keyword=영웅 계백 1부 3&keyoption2=1` | 200, 3.50s, 1건 |
| 9 | `https://hec.dasangng.co.kr/FxLibrary/xml/productSearch/?keyword=떨메와 달궁이&keyoption2=1` | 200, 3.21s, 1건 |
| 10 | `https://ebook.usdl.or.kr/FxLibrary/xml/productList/?itemCount=100&page=1&sort=3` | 200, 2.26s, 551,828B |
| 11 | `https://busanlib.bookcube.biz/FxLibrary/xml/productList/?itemCount=100&page=1&sort=3` | 200, 7.97s, 568,271B |
| 12 | `https://ebook.usdl.or.kr/FxLibrary/product/list/?category_type=book&cateopt=best` | 200, 0.72s |
| 13 | `https://ebook.usdl.or.kr/FxLibrary/xml/productView/?num=110900699` | 200, 0.21s |
| 14 | `https://ebook.usdl.or.kr/FxLibrary/xml/productView/?num=F0000631` | 200, 0.16s |
| 15 | `https://busanlib.bookcube.biz/FxLibrary/product/view/?num=261000725` | 200, 0.84s |
| 16 | `https://snu.bookcube.biz/FxLibrary/xml/productList/?itemCount=20&page=1&sort=3` | 200, 2.91s |
| 17 | `https://uc.aladinebook.co.kr/sub/sub.htm?mode=view&nav_code=ebo1655356114&goods_id=353793225` | 200, 0.94s |
| 18 | `http://ebook.bist.ac.kr/sub/sub.htm?mode=view&nav_code=ebo1655356114&goods_id=WOORIx0014324` | 200, 0.25s |
| 19 | `https://lib.ghu.ac.kr:444/sub/sub.htm?mode=view&nav_code=ebo1655356114&goods_id=999627` | 200, 0.55s |
| 20 | `https://uc.aladinebook.co.kr/sub/sub.htm?nav_code=ebo1655356114&code=search&search_item=title&search_order=집게 발가락&view_level=1` | 200, 1.07s |
| 21 | `http://ebook.bist.ac.kr/sub/sub.htm?…search_order=화폐로 읽는 세계 인물여행…` | 200, 1.76s |
| 22 | `https://lib.ghu.ac.kr:444/sub/sub.htm?…search_order=사람의 아이들…` | 200, 2.64s |
| 23 | `https://lib.ghu.ac.kr:444/sub/sub.htm?nav_code=ebo1655356114&code=best&view_level=1&scroll=0` | 200, 0.93s |
| 24 | `https://lib.ghu.ac.kr:444/sub/sub.htm?mode=view&nav_code=ebo1655356114&goods_id=276357662` | 200, 0.31s |
| 25 | `https://libasp.aladin.co.kr/` | 200, 0.06s, 점검 안내 쪽 |

(검색어는 실제로 UTF-8 퍼센트 인코딩해 보냄. 표에는 읽기 쉽게 한글로 적음.)

## 2. 수집 데이터 모양 (배포용 사본, 읽기 전용)


- 조사일: 2026-10-05, 읽기 전용(`mode=ro&immutable=1`)으로만 열었음
- 기준: `crawl_skip`이 있는 도서관 98곳(행 537,978)은 제외(1번 일부 제외). 등록 = id < 100000, 후보 = id ≥ 100001
- 전수 집계(GROUP BY 1회)와 표본(무작위 rowid 150,000건 → 제외 후 146,400건)을 섞어 씀. 표본 값은 "표본"이라고 적음
- 이 문서의 숫자는 모두 이 스냅샷에서 측정한 값 [확정: 스냅샷 측정]. 설계 판단은 [안]

### 1. 도서관 수

| platform_type | 등록 | 후보 | crawl_skip(제외) | 행 0인 후보 |
|---|---|---|---|---|
| KYOBO_SUBSCRIPTION_V1 | 21 | 1,412 | 2 | 219 |
| KYOBO_V1 | 177 | 267 | 92 | 1 |
| BOOKCUBE_FX | 0 | 451 | 7 | 3 |
| YES24_V2 | 56 | 377 | 1 | 0 |
| YES24_V1 | 9 | 82 | 0 | 1 |
| YES24_V3 | 3 | 25 | 1 | 0 |
| ALADIN_V1 | 0 | 25 | 0 | 0 |
| ELIB_PORTAL_V1 | 7 | 0 | 0 | 0 |
| GANGNAM_V1 | 1 | 0 | 0 | 0 |
| 합계(활성) | 274 | 2,639 | 98 | 224 |

- crawl_skip 98곳 중 대부분은 "same site as registered library N" (등록 도서관과 같은 사이트), 나머지 4곳은 접속 차단/이전.
- 활성 도서관끼리 base_url 완전 중복은 0건.

### 이름 중복 (활성 후보 기준)

| 비교 방식 | 후보끼리 중복 그룹 / 행 | 등록 이름과 같은 후보 |
|---|---|---|
| 완전 일치 | 98 그룹 / 211곳 | 27곳 |
| 공백·괄호 문자 제거 | 100 / 215 | 31 |
| 괄호 안 내용까지 제거 | 112 / 246 | 33 |

예시 10개:
1. 서울시교육청: 100069 BOOKCUBE_FX `https://e-lib.sen.go.kr:444/FxLibrary` / 100714 KYOBO_V1 `http://e-lib.sen.go.kr:8090`
2. 강동대학교: BOOKCUBE_FX, KYOBO_V1(`:9090`), YES24_V2(`:8082`) 3곳 — 같은 기관, 플랫폼별 사이트
3. 감리교신학대학교: BOOKCUBE_FX `mtu.bookcube.biz` / ALADIN_V1 `mtu.aladinebook.co.kr?nav_code=…`
4. LG 디스플레이(BOOKCUBE_FX) / LG디스플레이(KYOBO_SUBSCRIPTION_V1) — 공백 제거 시 일치
5. 부산광역시 전자도서관 / 부산광역시 전자도서관(구독) — 괄호 제거 시 일치 (서로 다른 사이트)
6. 경기과천교육도서관: 후보 100008 BOOKCUBE_FX `elib.goe.go.kr:8242/FxLibrary` ↔ 등록 20 `elib.goe.go.kr:8204`
7. 군산시립도서관: 후보 100028 BOOKCUBE_FX ↔ 등록 45(:446), 262(YES24, :83)
8. 곡성교육문화회관: 후보 BOOKCUBE_FX `ebook.jne.go.kr:8084/FxLibrary_gse` ↔ 등록 182 `ebook.jne.go.kr:8401`
9. 국립세종 도서관(BOOKCUBE_FX) ↔ 등록 43 국립세종도서관(구독형), 263 국립세종도서관(YES24)
10. 고려대학교: BOOKCUBE_FX / KYOBO_V1(`:8082`)

→ 이름 중복은 대부분 **같은 기관이 플랫폼별로 다른 전자도서관을 운영**하는 경우. 같은 사이트 중복은 이미 crawl_skip으로 걸러져 있음. 서비스에서 "도서관" 하나에 여러 사이트(플랫폼)가 달릴 수 있음 [안: 기관 ↔ 사이트 1:N 고려].

### base_url 모양

| platform | http/https | 포트 있음 | 경로·쿼리 | 예 |
|---|---|---|---|---|
| KYOBO_SUBSCRIPTION_V1 | https 1,433 | 0 | 없음, 전부 `*.dkyobobook.co.kr` | `https://gdlib.dkyobobook.co.kr` |
| KYOBO_V1 | http 279 / https 165 | 257 | 없음 | `https://www.ghlib.go.kr:446`, `http://cankyobo.dkyobobook.co.kr` |
| BOOKCUBE_FX | http 276 / https 175 | 147 | `/FxLibrary`(409), `/BookLive`(6), `/FxLibrary_nh` 등 지점 접미사 | `http://ebook.jne.go.kr:8084/FxLibrary_gse` |
| YES24_V1/V2/V3 | 대부분 http | 11/74/4 | 거의 없음(`/YES24NEW` 1곳) | `http://hsg.yes24library.com`, `http://210.97.59.252:8091` |
| ALADIN_V1 | http 19 / https 6 | 4 | 전부 `?nav_code=ebo1655356114` | `http://lib.seojeong.ac.kr:8888?nav_code=ebo1655356114` |
| ELIB_PORTAL_V1 | https 7 | 0 | `/elib`, 1곳 `?menu_idx=2` | `https://ebook.gwe.go.kr/elib?menu_idx=2` |

- IP 주소 + 포트 사이트, 비표준 https 포트(444, 446, 8243 등) 다수. 서비스의 URL 컬럼은 포트·쿼리 포함 문자열로 다뤄야 함.
- `host` 컬럼은 등록 도메인 단위(예: `bookcube.biz` 214곳, `dkyobobook.co.kr` 1,478곳, `yes24library.com` 399곳)라 도서관 식별에 쓸 수 없음.

### 2. 소장 행 수

| 구분 | 행 있는 도서관 | 행 | removed_at IS NULL | 도서관당 평균 | 중앙값 | 최대 |
|---|---|---|---|---|---|---|
| 전체 | 2,689 | 21,513,260 | 21,513,141 | 8,000 | 886 | 248,602 |
| 등록 | 274 | 4,989,341 | 4,989,222 | 18,209 | 4,122 | 239,656 |
| 후보 | 2,415 | 16,523,919 | 16,523,919 | 6,842 | 792 | 248,602 |
| KYOBO_SUBSCRIPTION_V1 | 1,214 | 7,919,608 | 동일 | 6,524 (등록 154,003 / 후보 3,928) | 693 | 248,602 |
| BOOKCUBE_FX | 448 | 6,129,851 | 동일 | 13,683 | 2,189 | 228,241 |
| KYOBO_V1 | 443 | 4,808,932 | 동일 | 10,855 | 6,089 | 155,415 |
| YES24_V2 | 433 | 1,661,256 | 1,661,142 | 3,836 | 742 | 61,861 |
| YES24_V3 | 28 | 400,906 | 400,905 | 14,318 | 9,403 | 64,840 |
| YES24_V1 | 90 | 275,420 | 275,416 | 3,060 | 708 | 60,822 |
| ELIB_PORTAL_V1 | 7 | 199,784 | 동일 | 28,541 | 21,326 | 82,559 |
| ALADIN_V1 | 25 | 111,263 | 동일 | 4,451 | 2,048 | 31,259 |
| GANGNAM_V1 | 1 | 6,240 | 동일 | — | — | — |

- PK가 (library_id, item_key)라 도서관 안에서 item_key는 항상 고유 → "도서관별 distinct item_key" = 행 수.
- removed_at이 채워진 행은 전체 119건뿐 (스냅샷 시점에 삭제 표시는 사실상 없음).
- 후보가 전체 행의 77%. 후보를 넣으면 등록만일 때보다 행이 약 4.3배.

### 3. 컬럼별 빈 값 비율과 길이 (전수, 길이는 글자 수, p99는 표본)

전체 기준 빈 값(NULL 또는 '') 비율 / 평균 길이(비어있지 않은 값):

| 컬럼 | 빈 값 | 평균 길이 | p99 (표본, 플랫폼별 최대) | 최대(표본) |
|---|---|---|---|---|
| title | 0.0% | 17.8 | 67~120 | 255 (KYOBO_V1) |
| author_raw | 0.2% | 7.2 | 28~55 | 132 |
| publisher | 0.3% | 6.0 | 16~25 | 48 |
| published_on | 2.1% | 10 | 10 | 10 |
| published_raw | 0.8% | 10 | 10 | — |
| supplier | 2.0% | 5.6 | 4~10 | 11 |
| content_kind | 0.0% | 4.6 | 3~10 | 13 |
| category_code | 40.8% (KYOBO 계열만 채움) | 5.0 | 6 | 6 |
| category_name | 60.8% (BOOKCUBE·YES24만) | 9.4 | 8~22 | 36 |
| cover_url | 0.0% (GANGNAM 100% 없음) | 81.2 | 88~113 | 142 |
| detail_path | 0.0% | 69.0 | 28~115 | 133 |
| detail_url | 0.0% | 100.7 | 64~148 | 159 |
| alt_code | 71.5% (BOOKCUBE_FX만 100% 채움) | 9.3 | 13 | 36 |
| branch_name | 99.1% (ELIB_PORTAL_V1만 채움) | 14.2 | 24 | 24 |
| section | 0.0% | 4.0 | — | — |

플랫폼별 특이점:
- ALADIN_V1: published_on/published_raw **100% 없음**, supplier 28.8% 없음, 카테고리 없음.
- BOOKCUBE_FX: published_on 4.4% 없음(대부분 raw가 `YYYYMMDD` 형식이라 파싱 안 된 것: raw는 있는데 on이 NULL인 행 255,783건). category_name은 `문학/한국소설` 같은 경로형 393종(표본).
- KYOBO_V1: author 1.0%, publisher 1.4% 없음 (가장 높음). title 최대 255자.
- GANGNAM_V1: cover_url 없음.
- 등록 vs 후보: 후보 쪽 published_on 결측 2.6% vs 등록 0.4%, 나머지는 비슷.

### 4. item_key 모양과 alt_code

| platform | 숫자만 | 영숫자 | 기타 | 길이 | 예 |
|---|---|---|---|---|---|
| KYOBO_SUBSCRIPTION_V1 | 43.5% | 56.5% | 극소(`NURI_N1604004`) | 7~13 (등록은 13 고정) | `4801173558918`, `480N250965010`, `480D260519590` |
| KYOBO_V1 | 77% | 22% | 0.9% (GUID, `NURI_…`) | 2~40 | `4801190382671`, `M0068128`, `F8791C3E-751A-4627-…` |
| BOOKCUBE_FX | 77% | 23% | 0 | 8~10 | `160202793`, `F0000804`, `A02030113`, `G0001455` |
| YES24_V1/V2/V3 | 94~98% | 소수 | V2에 `AUDIO:114279942` | 1~20 | `117828006`, `9791188285822`, `480D240533170`, `X0058724` |
| ALADIN_V1 | 73% | 25% | 1.9% (`WOORI`+GUID) | 3~41 | `340100276`, `YES2416906458`, `BOOKCUBE160105087` |
| ELIB_PORTAL_V1 | 0 | 0 | 100% `유형:번호` | 5~10 | `EBK:17995`, `ADO:20118` |
| GANGNAM_V1 | 1.5% | 98.5% | 0 | 8~14 | `B5550204033100`, `KB002781` |

- 교보 계열 키는 `480` + ISBN 일부 / `480D…` 형식이 많고, YES24 키는 goods_id 또는 ISBN-13(`979…`)이 섞임. **플랫폼마다 키 체계가 달라 item_key만으로 다른 플랫폼과 같은 책을 맞출 수 없음.**
- 같은 플랫폼 안에서는 키가 도서관 간에 공유됨 (아래 "놀라운 점" 참고).

alt_code (BOOKCUBE_FX만 사용):
- 숫자 키(북큐브 자체 상품, 표본 77%): alt_code = item_key 그대로.
- 접두 영문자 키는 **원 공급사 코드**를 담음 (표본, 접두자 → 공급사):
  - `F…` → 교보(`F0000804` → `4808952205513`, `F0027040` → `480D151001360`) = 교보 brcd 형식
  - `Y…` → YES24(`Y150560842` → `150560842`) = YES24 goods_id
  - `U…` → 알라딘(`al-54808-E992435492`, `68747`)
  - `A`/`T`/`L` → 북토피아(`02030113`), `G` → OPMS(`5550311001200`), `H`/`D` → 우리전자책(GUID, `M0069265`), `I` → 누리미디어(`N1004013`), `N` → 영풍/Y2Books, `X`/`R` → 아이파프리카/리브로피아(ISBN-13 `979…`)
  - → alt_code는 다른 플랫폼 키와 같은 책을 잇는 단서가 될 수 있음 [안: 그룹핑 단서로 보관].

### 5. content_type / content_kind / is_audiobook / kind_check

content_type (전체): EBOOK 21,401,192 (99.48%) · AUDIOBOOK 97,800 · UNKNOWN 5,738 · VIDEO_BOOK 5,400 · KIDS_BOOK 3,056 · PAPER 74

| platform | content_kind 값 (행 수) |
|---|---|
| KYOBO_SUBSCRIPTION_V1 | 전자책만 7,919,608 (오디오북 없음) |
| KYOBO_V1 | 전자책 4,785,520 · 오디오북 16,631 · 키즈북 3,056 · 동영상북 2,227 · 오디오 1,029 · 동영상 391 · 학술논문 74 · 이러닝 4 |
| BOOKCUBE_FX | 파일형식: book/epub 4,330,142 · book/pdf 1,386,885 · book/xml 242,885 · book/aud 54,409 · book/pdf/epub 50,228 · book/flash 32,206 · book/image 14,855 · book/xdf 8,324 · `?/…` 접두 5,300여 · 기타(kml, wma, vod, zip, wmv, html, kpdf, kpub) |
| YES24_V2 | 전자책 1,652,496 · 오디오북 6,378 · 동영상북 2,382 |
| YES24_V3 | 전자책 399,629 · 동영상북 791 · 오디오북 486 |
| YES24_V1 | 전자책 274,156 · 오디오북 1,264 |
| ELIB_PORTAL_V1 | 전자책 182,182 · 오디오북 17,602 |
| ALADIN_V1, GANGNAM_V1 | 전자책만 |

- UNKNOWN 5,738건: BOOKCUBE_FX 5,343 (`book/wma`, `book/vod`, `book/wmv`, `?/flash` 등이 규칙에 안 걸림), KYOBO_V1 395 (`동영상` 391, `이러닝` 4). `동영상`은 VIDEO_BOOK 규칙에 안 들어가 있음.
- is_audiobook: 1 = 97,800 / 0 = 21,409,722 / NULL(UNKNOWN) = 5,738.
- kind_check `TITLE_SAYS_AUDIO` 7,242건 (제목에 "오디오북"이 있는데 오디오북이 아님): KYOBO_V1 2,894, BOOKCUBE_FX 2,816, YES24_V2 672, KYOBO_SUBSCRIPTION_V1 481, ALADIN_V1 256, YES24_V3 104.
- kind_source: KYOBO_V1·BOOKCUBE_FX·GANGNAM_V1은 SITE_LABEL(항목별 표시), 나머지는 SITE_SECTION(메뉴 단위로 추정).

### 6. detail_url 패턴 (전 플랫폼 100% 채워짐)

detail_url = base_url(쿼리 제거, 끝 `/` 제거) + detail_path (DB 트리거가 생성).

| platform | 템플릿 (표본 비율) |
|---|---|
| KYOBO_SUBSCRIPTION_V1 | `{base}/content/contentView.ink?cttsDvsnCode=001&brcd={item_key}&ctgrId={category_code}&sntnAuthCode={…}` (100%) |
| KYOBO_V1 | `{base}/elibrary-front/content/contentView.ink?cttsDvsnCode=001&brcd={item_key}&ctgrId=…&sntnAuthCode=…` (100%) |
| BOOKCUBE_FX | `{base}/product/view/?num={item_key}` — base에 `/FxLibrary`, `/FxLibrary_gj`, `/BookLive` 등 포함. 예 `http://elib.gyeongnam.go.kr:8000/FxLibrary_gj/product/view/?num=140902142` (100%) |
| YES24_V1/V2/V3 | `{base}/ebook/detail/?goods_id={key}` 대부분, `/audiobook/detail/`(오디오북), `/booklearning/detail/`(동영상북) 소수 |
| ALADIN_V1 | `{base}/sub/sub.htm?mode=view&nav_code=ebo1655356114&goods_id={item_key}` — **base_url의 `?nav_code`는 잘려나가고 detail_path에 다시 들어 있음** (100%) |
| ELIB_PORTAL_V1 | `{base}/module/elib/book/view.do?menu_idx={n}&book_idx={번호}&type=EBK|ADO` |
| GANGNAM_V1 | `{base}/elibbook/book_detail.asp?book_num={item_key}` |

- 모든 플랫폼에서 detail_url은 base_url + 플랫폼 템플릿 + item_key(+교보는 ctgrId/sntnAuthCode)로 다시 만들 수 있음. 교보 계열은 sntnAuthCode가 행마다 다를 수 있어 detail_path를 그대로 보관하는 편이 안전 [안].

### 7. published_on

| 구분 | 형식 유효(YYYY-MM-DD) | 범위 | 2026-10-05 이후 | 1950 이전 |
|---|---|---|---|---|
| 전체 | 97.9% | 1212-01-09 ~ 2093-10-15 | 207 | 17,748 |
| 등록 | 99.6% | 1900-03-30 ~ 2045-12-08 | 83 | 10 |
| 후보 | 97.4% | 1212-01-09 ~ 2093-10-15 | 124 | 17,738 |

- 값이 있으면 형식은 항상 YYYY-MM-DD (형식 오류 0건). 비어 있는 이유는 raw를 못 읽은 경우: raw는 있는데 on이 NULL인 행 279,221건(대부분 BOOKCUBE_FX `YYYYMMDD` 255,783, YES24 `0000-00-00`, `--`, `2121-05-10` 같은 값).
- 1950 이전 17,748건 중 **17,311건이 한 도서관(100555 명지대학교, KYOBO_V1)**. 1900, 1905 같은 연도가 몰려 있어 자리채움 값으로 보임. 나머지는 대부분 1900-xx, 1905-xx.
- 미래 날짜는 2026-12-31(연말 자리채움 추정), 2042-12-04 같은 오입력.
- ALADIN_V1은 발행일 자체가 없음.

### 8. 서비스 저장 컬럼 크기 추정 (표본, UTF-8 바이트)

컬럼: title, author_raw, publisher, published_on, detail_url, cover_url, content_type

| platform | 행당 평균 바이트 | title | author | publisher | detail_url | cover_url |
|---|---|---|---|---|---|---|
| KYOBO_SUBSCRIPTION_V1 | 306 | 37 | 14 | 14 | 123 | 104 |
| KYOBO_V1 | 293 | 34 | 15 | 14 | 131 | 84 |
| ALADIN_V1 | 252 | 53 | 24 | 14 | 93 | 63 |
| ELIB_PORTAL_V1 | 245 | 34 | 15 | 15 | 89 | 78 |
| YES24_V1/V2/V3 | 200~208 | 36 | 21 | 15 | 60 | 55~60 |
| BOOKCUBE_FX | 205 | 36 | 15 | 14 | 65 | 60 |
| 전체 가중 평균 | **약 262** | | | | | |

- 그대로 넣으면 21.5M × 262B ≈ **5.6GB(데이터만)**. PostgreSQL 행 헤더(약 24B)·정렬·인덱스를 더하면 테이블+인덱스 대략 8~10GB 수준 [안: 추정치, 실제 적재로 확인 필요].
- 바이트의 약 70%가 detail_url + cover_url. URL을 템플릿으로 만들거나(base_url + 키) 책 정보(제목·저자·출판사)를 도서관 간 공유 테이블로 빼면 크게 줄어듦 (아래).

### 놀라운 점 / 스키마·검색 설계에 영향

1. **같은 item_key가 많은 도서관에 반복됨.** (platform, item_key) 고유값 3,460,964개에 행 21,513,141개 → 키당 평균 6.2개 도서관.
   - 1곳에만 있는 키 1,564,453개(키의 45%, 행의 7%)
   - 10곳 이상 키 655,509개가 행의 71%, 30곳 이상 151,051개가 행의 29%, 최대 420곳
   - → [안] 책(플랫폼+키) 테이블과 소장(도서관×책) 테이블을 나누면 소장 행은 (library_id, book_id, detail_path/sntnAuthCode 정도)로 작아짐.
2. **제목·저자 중복이 매우 큼.** 전수 기준(removed 제외):
   - (title, author_raw, publisher) 정확히 같은 조합: 2,250,136 (행의 10.5%)
   - 소문자·공백·기호 제거 후: 2,012,348 / (제목, 저자)만: 1,740,542 / 제목만: 1,059,181
   - 플랫폼별 정규화 조합 합계 3.67M vs 전체 2.01M → 약 45%가 플랫폼을 넘어 겹침. 같은 책이 교보/YES24/북큐브 키로 따로 존재 → 검색 결과에서 묶기(그룹핑) 필요.
   - 검색 대상 고유 텍스트는 약 200만 건 수준이라 전문 검색 인덱스는 소장 행(2,150만)이 아니라 책 단위에 거는 편이 작음 [안].
3. **후보 도서관이 데이터의 77%**, KYOBO_SUBSCRIPTION_V1 후보 1,412곳 중 219곳은 행이 0.
4. **KYOBO_SUBSCRIPTION_V1 cover_url은 공용 CDN**(`dcontent.dkyobobook.co.kr/…/{item_key}/L{item_key}.jpg`)이라 도서관마다 같음 → 책 단위로 한 번만 저장 가능. 다른 플랫폼 cover_url은 도서관 호스트별(`{base}/images/bookimg/…`)이라 소장 단위.
5. **content_kind 체계가 플랫폼마다 다름**: BOOKCUBE_FX는 파일 형식(`book/epub`), 나머지는 한국어 라벨. 현재 분류 규칙으로 UNKNOWN 5,738건(`book/wma`, `book/vod`, `동영상`, `이러닝` 등) — 규칙 보완 여지.
6. **발행일**: ALADIN_V1은 전부 없음, BOOKCUBE_FX `YYYYMMDD` 255,783건은 파싱만 고치면 살릴 수 있음. 명지대(100555)의 1900~1905년 자리채움 값 17,311건. → published_on은 NULL 허용 + 정렬·필터 시 이상값 처리 필요.
7. **title 최대 255자, author_raw 최대 100~132자**(표본) — 길이 제한을 둔다면 넉넉히(예: text 또는 varchar(500)) [안].
8. removed_at은 사실상 비어 있어(119건) 삭제 이력 데이터로는 아직 쓸모가 없음.
9. ELIB_PORTAL_V1은 지역 통합 포털로 branch_name(분관) 32종(표본)을 가짐 — 한 사이트 안의 여러 도서관.

### 확인 필요
- 크기 추정(8~10GB)은 계산값 — 실제 PostgreSQL 적재 시험으로 확인 (프로토타입)
- alt_code 접두자 → 공급사 대응은 표본 관찰 — 전수 집계로 확인 (데이터 집계)
- `2026-12-31`, 1900~1905년 값이 자리채움인지 — 해당 사이트 상세 페이지 확인 (사이트 확인)
