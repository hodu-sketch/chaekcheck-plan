# ADR-0111: 호스트에 밑줄이 있는 도서관 주소는 따로 읽고 따로 요청한다

Status: Accepted
Date: 2026-10-14
Cycle: 18-empty-library-holdings
Supersedes: 없음

## 배경
현대제철(2624) 주소 `https://hs_partners.yes24library.com`은 호스트에 밑줄이 있다. Java `java.net.URI`는 이런 호스트를 읽지 않아(`getHost()` null) 가져오기가 전자책 241권을 모두 건너뛰었고, 대출 조회의 Java 기본 요청 기능(`java.net.http`)은 이 주소로 요청을 만들지 않는다(JDK 21 `checkURI` "unsupported URI"). OpenJDK는 이 동작을 고칠 문제로 보지 않았다(JDK-8180809 "Not an Issue"). 2026-10-14 기준 수집 DB·서비스 DB 전체에서 밑줄 호스트는 이 한 곳이다.

## 결정
가져오기와 새 도서관 넣기는 `collection` 안의 밑줄을 받는 호스트 읽기를 쓴다. 대출 조회와 직접 찾기(`availability`)는 호스트에 밑줄이 있으면 따로 만든 요청 길(새 요청 라이브러리 하나, dev가 시제품으로 고름)로 보낸다. 보안 연결은 SNI 없이, 인증서 이름 검사는 켠다. 실패하면 그 도서관 줄만 실패로 보인다. 지금 한 곳뿐이어도 미리 만든다.

## 이유 (사용자 발언)
- "java개발 따로 해 _ 은 다르게 처리하도록 그냥 미리 개발해두는거야" (2026-10-14, "그 줄만 실패" 안 미승인)
- "이것 말고도 _ 인 것이 있을 수 있는데 이거 java에서 고쳐야 하는 거 아니야?" (2026-10-14)
- 개발 순서: "순서는 상관없어 어짜피 내가 외부에 주소 공개 안 하면 되니까" (사이클 17과)

## 검토한 대안
### A안: 대출 조회는 그 줄만 실패로 가둠 (요청 안 함)
- 장점: 작은 수정, 새 의존성 없음
- 단점: 현대제철 대출 수를 못 보여 줌, 수용 기준을 고쳐야 함
- 채택하지 않은 이유: 위 사용자 발언
### B안: 밑줄 호스트만 따로 만든 요청 길 (채택)
- 장점: 대출 수까지 보임, 앞으로 생길 밑줄 주소에도 적용
- 단점: 요청 라이브러리 하나 더, 보안 연결 설정 두 벌, 실제 통과는 시제품으로 확인
### C안: 현대제철을 끔
- 채택하지 않은 이유: 조사 결정 #3(241권을 넣음)과 어긋남 [이유 미확인]

## 결과
- `collection`: `SiteHosts`(이름 [안]), `availability`: 사이트 요청 부품의 갈래 + 새 라이브러리
- 근거: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URI.html, https://docs.oracle.com/en/java/javase/21/docs/api/java.base/javax/net/ssl/SNIHostName.html, https://github.com/openjdk/jdk21u/blob/master/src/java.net.http/share/classes/jdk/internal/net/http/HttpRequestBuilderImpl.java, https://bugs.openjdk.org/browse/JDK-8180809 (확인 2026-10-14)

- 구현 (2026-10-15, 사이클 18 회고 결정 #15): availability `SiteHostNames`·`HostRoutingSiteFetcher`(`DirectSiteFetcher` 앞, 조건 "`getHost()` null + `_`")·`UnderscoreHostSiteFetcher`, collection `SiteHosts`(`host`·`httpHost`)·`HoldingRowFilter`. 라이브러리 Apache HttpClient 5 `httpclient5` 5.6.4. SNI 없음. **인증서 이름 검사는 JDK 기본이 아니라 HttpClient `DefaultHostnameVerifier`(`HostnameVerificationPolicy.CLIENT`)로 켬** — JDK `HostnameChecker`는 밑줄 이름을 거절하므로 검사를 끄지 않는 유일한 길(dev 시제품). redirect·자동 재시도·쿠키·압축 없음, 로그 `via=direct-underscore`. ADR-0095 나가는 길은 아직 이 길에 없음(사이클 17 몫)

## 나중에 분리할 때
- 조회 서비스 안에서 끝남
