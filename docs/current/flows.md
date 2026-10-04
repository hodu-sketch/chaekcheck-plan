# 주요 흐름 (현재)

현재 설계의 주요 흐름을 그림으로 모은 문서입니다. 변경 기록이 아닙니다.

사이클 05 cycle-close (2026-10-04): 흐름 9~12(로그인·계정)를 더함 — 구현됨(사이클 05, 2026-10-04 retro 반영). 근거 `docs/cycles/05-login-account/design-delta.md`.

마지막 반영: 사이클 04 cycle-close (2026-09-30). 흐름 1~5는 **구현됨**, 흐름 6~8은 **설계됨(미구현, 사이클 04)** 입니다. 사이클 04부터 흐름 1~2는 "도서관에서 직접 찾기"의 흐름입니다.

- 근거: `docs/cycles/02-library-expansion/design-delta.md` "구조 그림", `retro.md`, ADR-0011, ADR-0014, ADR-0015, ADR-0019, ADR-0020
- 모듈 구성도와 도메인 모델은 `module-map.md`에 있습니다.

## 도서관 하나의 조회 상태 (브라우저)

```mermaid
stateDiagram-v2
  [*] --> NotRequested
  NotRequested --> Requested: 묶음 후보로 요청됨 (1쪽)
  NotRequested --> NotRequested: 후보였지만 20줄 초과로 요청 안 됨
  Requested --> HasMore: 결과 받음, 더 있음
  Requested --> Exhausted: 결과 받음, 더 없음 또는 0건
  Requested --> Failed: 오류 또는 8초 초과
  HasMore --> Requested: 다음 바퀴 후보 (다음 쪽) 또는 도서관별 더 보기
  Exhausted --> [*]
  Failed --> [*]
```

- 1바퀴: `NotRequested`가 남아 있으면 계획 순서대로 후보로 보냅니다.
- 다음 바퀴: `HasMore`인 사이트를 계획 순서대로 다음 쪽으로 보냅니다.
- 모두 `Exhausted`나 `Failed`이면 목록 맨 아래 "더 보기"를 없앱니다.
- `Failed`는 같은 검색에서 다시 조회하지 않습니다 [확정] (ADR-0014).
- 필터, 조회 범위(`scope`), "방문 없이 가입"(`visit`), 지역, 검색 조건(제목/저자/출판사)이 바뀌면 상태를 버리고 첫 묶음부터 다시 검색합니다 [확정].
- 조회 서버가 모두 멈춘 동안에는 후보가 곧바로 실패해 한 묶음이 계획 대부분을 `Failed`로 만듭니다. 그 검색에서는 다시 묻지 않습니다(알려진 한계, 다음 사이클 후보).

## 흐름 1: 첫 묶음 검색

```mermaid
sequenceDiagram
  participant W as web
  participant A as availability
  participant L as library
  participant C as 캐시·throttle
  participant S as SiteFetcher (직접 또는 조회 서버)
  W->>A: GET /api/v1/ebook-searches/stream?{title|author|publisher}&residenceRegionIds&workRegionIds&filter&scope&visit
  alt 조건 파라미터 없음·둘 이상, 검색어 글자 수, filter·scope·visit 값 오류
    A-->>W: 400 validation_error / invalid_query (스트림을 열지 않음)
  end
  A->>L: planSearch(residence, work)
  alt 지역 ID 오류
    L-->>A: InvalidRegionException
    A-->>W: 422 invalid_region (스트림을 열지 않음)
  end
  L-->>A: 정렬된 SearchTarget 목록
  Note over A: scope=joinable이면 가입 확정 도서관만,<br/>visit=none이면 방문 가입이 아닌 도서관만 남김
  A-->>W: event targets (전체 계획)
  loop 계획 순서, 동시 P개, 셈한 줄이 20을 넘거나 시작 마감 전까지 (같은 호스트가 바쁘면 다음 후보 먼저, ADR-0020)
    A-->>W: event library-requested (libraryId, page 1)
    A->>C: get(libraryId, field, 검색어, 1)
    alt 캐시 있음
      C-->>A: 해석된 페이지
    else 캐시 없음
      C->>S: fetch(URL) — 호스트 이름 단위 동시 1건·1초
      S-->>C: 상태 코드 + 원본 바이트
      C-->>A: adapter.parse 결과
    end
    A-->>W: event library-result 또는 library-failed
  end
  Note over A: 8초가 되면 끝나지 않은 사이트는 upstream_timeout
  A-->>W: event batch-done (묶음 요약)
  Note over A,W: 상세 판정이 남아 있으면 흐름 3의 row-verdict를 보낸 뒤 done
  A-->>W: event done
```

## 흐름 2: 목록 맨 아래 "더 보기"

```mermaid
sequenceDiagram
  participant W as web
  participant A as availability
  participant L as library
  W->>W: 계획에서 다음 후보 계산 (1바퀴: 미요청 1쪽 / 다음 바퀴: HasMore 다음 쪽), 최대 K개
  W->>A: GET /api/v1/ebook-searches/batches/stream?{title|author|publisher}&filter&batchNo&candidates=31:1,32:1,1:2
  alt 형식 오류, K 초과, 중복
    A-->>W: 400 validation_error
  end
  A->>L: findEnabledTarget(각 libraryId)
  loop 후보 순서, 흐름 1과 같은 규칙
    alt 꺼졌거나 없는 사이트
      A-->>W: event library-failed (library_not_found)
    else
      A-->>W: event library-requested → library-result / library-failed
    end
  end
  A-->>W: event batch-done → (row-verdict …) → done
  W->>W: 새 묶음을 구분선 아래에 붙이고 그 안에서만 정렬. 요청 안 된 후보는 NotRequested로 남김
```

- 도서관별 "더 보기"는 `GET /api/v1/availability/libraries/{libraryId}/ebooks?{title|author|publisher}&page`(사이클 01 경로, 사이클 03에서 조건 파라미터로 바뀜)를 부르고, 결과를 목록 맨 아래 새 묶음으로 붙입니다. 이 API는 JSON 한 번에 응답하므로, 상세 판정이 필요한 줄은 판정을 읽은 뒤(최대 30초) 함께 돌려줍니다 [안].

## 흐름 3: 경북·전북 포털 상세 판정

```mermaid
sequenceDiagram
  participant W as web
  participant A as availability
  participant C as 캐시·throttle
  participant P as 포털 (gbelib.kr 등)
  A->>C: 검색 페이지 (libraryId, q, page)
  C->>P: GET /module/elib/search/index.do (SiteFetcher 경유)
  P-->>A: 10줄, 판정 빈칸
  Note over A: 대출 0 → AVAILABLE (상세 요청 없음)<br/>대출 1 이상 → PENDING
  A-->>W: event library-result (PENDING 줄 포함)
  W->>W: PENDING 줄은 묶음 아래쪽 "대출 정보 조회 중" 자리에 표시
  loop PENDING 줄 (같은 호스트라 1초 간격으로 차례로)
    A->>C: 상세 (libraryId, book_idx), 캐시 3분
    C->>P: GET /module/elib/book/view.do?book_idx
    alt 30초 안에 "대출 가능" / "예약 가능"
      P-->>A: 판정
      A-->>W: event row-verdict (AVAILABLE / RESERVABLE)
      W->>W: 같은 묶음 안의 알맞은 칸으로 옮김
    else 30초 초과, 오류, 모르는 값
      A-->>W: event row-verdict (UNKNOWN)
      W->>W: "대출 가능 여부 확인 필요", 예약 칸 맨 아래
    end
  end
```

- 30초는 **묶음을 시작한 시각부터**입니다 [안]. 묶음의 8초 마감은 검색 페이지 요청에만 적용합니다.
- 30초 동안 한 호스트에서 읽을 수 있는 상세는 대략 25건입니다 (1초 간격). 실측(dev, 2026-09-29, `사랑` 첫·둘째 묶음): 경북·전북 대출 중 줄은 각 1~2건이었고 모두 30초 안에 끝났습니다.
- 인천 포털은 상세 페이지가 로그인을 요구해, 대출 1 이상 줄은 모두 `UNKNOWN`("대출 가능 여부 확인 필요")입니다.

## 흐름 4: 조회 서버 경유 모드에서 서버 넘기기

```mermaid
sequenceDiagram
  participant A as availability (throttle 허가를 받은 상태)
  participant F1 as 조회 서버 1
  participant F2 as 조회 서버 2
  A->>F1: POST /v1/fetches
  alt 연결 거부 / 연결 시간 초과 / 503
    A->>A: F1을 일정 시간 "쉼"으로 표시
    A->>F2: 같은 요청 (남은 시간 안에서)
    F2-->>A: 200 {outcome, status, body}
  else 200 + 도서관 쪽 실패 (TIMEOUT, 403 등)
    F1-->>A: outcome
    A->>A: 넘기지 않고 library-failed (ADR-0011)
  else 조회 서버 읽기 시간 초과
    A->>A: 넘기지 않고 upstream_timeout (도서관 중복 요청 방지)
  end
  Note over A: 모든 조회 서버가 "쉼"이면 조회 실패. 직접 호출로 자동 전환하지 않음 (ADR-0015)
```

## 흐름 5: 검색 조건 바꾸기

```mermaid
sequenceDiagram
  participant U as 사용자
  participant W as web
  participant A as availability
  U->>W: 결과가 보이는 상태에서 드롭다운 "출판사"
  alt 입력창 검색어 2자 미만
    W-->>U: 입력 오류 문구, 이전 결과 그대로 (요청 없음)
  else 2~50자
    W->>W: 진행 중 스트림 끊고 묶음 상태 버림
    W->>W: 주소 /search?publisher=…
    W->>A: GET /api/v1/ebook-searches/stream?publisher=…
    A-->>W: targets {publisher, …} → … → done (첫 묶음부터)
  end
```

- 검색 전(첫 화면)에서 드롭다운을 바꾸면 안내 문구만 바뀌고 검색하지 않습니다. 드롭다운 기본값은 항상 제목입니다.
- 포털의 저자·출판사 검색은 1쪽부터 `table.do` + 거르기로 부릅니다(ADR-0026). `table.do`에서 목록 판정 칸이 비는 포털은 흐름 3(상세 판정)으로 이어집니다. 실측(dev, 2026-09-29): 부산·대구·경기교육청은 상세 0~1건, 수량 칸이 없는 전북은 쪽마다 10건(약 20초, 30초 안).

## 흐름 6: 책 목록 검색과 바로 보기 — 구현됨(dev `BookSearchController`·`BookAvailabilityStreamController`, 사이클 04)

```mermaid
sequenceDiagram
  participant W as web
  participant C as catalog
  participant L as library
  participant A as availability
  participant S as 도서관 사이트
  W->>C: GET /books?title=행동&author=새폴스키&sort=default&지역·scope·visit
  alt 칸 없음·형식 오류
    C-->>W: 400 validation_error / invalid_query
  end
  C->>L: planSearch(지역, PlanOptions(scope, visit))
  L-->>C: SearchTarget 목록 (가입 판정·방문 여부)
  C->>C: pg_bigm 칸별 단어 AND, 계획 도서관 소장만, 가입 단계 → 완전 일치 → 보유 수 → 출판일
  alt 0건
    C-->>W: items=[] → "도서관에서 직접 찾기" 버튼
  else 있음
    C-->>W: items(책, 보유 도서관 수, 가입 단계), hasMore
    W->>A: SSE /book-availabilities/stream?bookIds=…&지역·filter·scope·visit
    A->>C: holdingsOf(bookIds)
    A->>L: planSearch(…)
    A-->>W: event targets (libraries[], holdings[] 계획 순서)
    loop 묶음 (20줄, 8초, 같은 호스트 1건·1초, 바쁜 호스트 건너뛰기)
      alt 교보 구독형
        A-->>W: holding-result (SUBSCRIPTION, 요청 없음)
      else 그 밖
        A->>S: GET 상세 페이지 (캐시 3분)
        alt 성공
          A-->>W: holding-result (보유·대출·예약·availability)
        else 404·시간 초과·읽기 실패
          A-->>W: holding-failed (upstream_error / upstream_timeout)
        end
      end
    end
    A-->>W: batch-done → done
    W->>A: 목록 맨 아래 "더 보기": /book-availabilities/batches/stream?candidates=holdingId,…
  end
```

- 도서관 하나의 조회 상태 그림(맨 위)은 사이클 04에서 도서관 대신 소장(`holdingId`) 단위로 같게 적용합니다. 상세 페이지 조회라 "다음 쪽" 상태는 없습니다.

## 흐름 7: 책 먼저 고르기 → 책 화면 — 구현됨(dev, 사이클 04)

```mermaid
sequenceDiagram
  participant W as web
  participant C as catalog
  participant A as availability
  participant S as 도서관 사이트
  W->>C: GET /books?…(view는 웹 주소에만)
  C-->>W: 책 목록 (도서관 요청 없음)
  W->>W: 책 고름 → /books/{bookId}
  W->>C: GET /api/v1/books/{bookId}
  alt 없는 책
    C-->>W: 404 book_not_found → "책을 찾을 수 없어요"
  else 있음
    C-->>W: 대표 서지, 보유 도서관 수, 도서관별 기준일
    W->>A: SSE /book-availabilities/stream?bookIds={bookId}&…
    A->>S: 가진 도서관 상세 페이지 (흐름 1과 같은 규칙)
    A-->>W: targets → holding-result / holding-failed … → done
  end
```

## 흐름 8: 수집 목록 한 번 가져오기 — 구현됨(dev `c6028c9`), 첫 실제 적재 2026-10-03 18:05 (책 680,689권, 소장 4,954,360줄. dev `plan-feedback.md` "실제 가져오기 결과")

개발 중 더한 것: 묶기 4(정리한 전체 제목 + 대표 저자 + 정리한 출판사, 사용자 결정 2026-09-30)와 dry run 옵션(`--chaekcheck.catalog.import.dry-run=true`: 읽고 묶기만, DB에 쓰지 않음). 규칙은 `docs/research/ebook-catalog/same-book-isbn.md` 5절.

```mermaid
sequenceDiagram
  participant O as 운영자
  participant I as catalog importer (프로필 catalog-import)
  participant Q as 수집 SQLite (읽기 전용)
  participant T as 국가서지 일반도서 TTL
  participant P as PostgreSQL catalog 스키마
  O->>I: 실행 (SQLite 경로, TTL 경로)
  I->>Q: 도서관 목록 대조 (서비스 library와 id·base_url 같은 곳만)
  I->>Q: 소장 읽기 (removed_at IS NULL, 전자책만, detail_url 있음)
  I->>I: 정리 규칙 (본제목, 저자 이름·역할, 출판사, 출판일)
  I->>I: 묶기 1·2: 같은 플랫폼 코드, 교보식 코드 → 종이책 ISBN
  I->>T: 줄 단위로 읽어 ISBN 사전 (필요한 ISBN만)
  I->>I: 묶기 3: 국가서지 ISBN (제목·저자·출판사 정리값이 하나로 맞을 때만)
  I->>I: 묶기 4: 정리한 전체 제목 + 대표 저자 + 정리한 출판사 (dry run이면 여기서 요약만 내고 끝)
  I->>P: COPY book · book_contributor · holding · catalog_library_snapshot, 끝나면 인덱스
  I->>P: catalog_import 기록
  I-->>O: 건수 요약, 종료
```

## 흐름 9: 첫 로그인과 동의, 다시 로그인 — 구현됨(사이클 05, 2026-10-04 retro 반영)

```mermaid
sequenceDiagram
  autonumber
  actor U as 사용자
  participant W as web
  participant A as auth
  participant P as 제공자
  U->>W: 로그인 버튼 클릭
  W->>W: 지금 주소를 sessionStorage에 저장
  W->>A: GET /api/v1/auth/oauth2/authorization/kakao
  A->>A: 임시 세션에 인가 요청(state) 저장
  A-->>U: 302 제공자 인가 화면
  U->>P: 로그인과 동의
  alt 취소 또는 제공자 오류
    P-->>A: GET 콜백 error=access_denied 등
    A-->>W: 302 /auth/complete?result=login_cancelled
  else 정상
    P-->>A: GET 콜백 code, state
    alt 저장된 요청 없음 또는 state 다름
      A-->>W: 302 /auth/complete?result=login_expired 또는 login_state_mismatch
    else state 일치
      A->>P: 토큰 교환, 프로필 조회
      A->>A: login_method(KAKAO, id) 찾기
      Note over A: 있음 (이미 가입, R3) → last_login_at 갱신, refresh_token 줄 생성(expires_at=지금+30일), 쿠키 둘 발급, 302 /auth/complete?result=login_success. 가입 때와 같은 발급 코드를 씀
      Note over A: 없음 (처음 온 계정) → 아래로
      A->>A: 임시 세션에 가입 대기 저장 (DB 쓰기 없음)
      A-->>W: 302 /signup
      W->>A: GET /api/v1/auth/signup
      A-->>W: 200 provider, 동의할 문서 버전
      U->>W: 확인란 셋 표시 후 가입
      W->>A: POST /api/v1/auth/signup (CSRF)
      alt 버전 불일치
        A-->>W: 409 document_version_mismatch
      else 가입 대기 만료
        A-->>W: 404 signup_not_found
      else 정상
        A->>A: 한 트랜잭션 account, login_method, account_consent x3, refresh_token
        A-->>W: 201 + Set-Cookie access_token, refresh_token
        W->>W: sessionStorage 주소로 이동
      end
    end
  end
  opt 동의 화면에서 취소
    W->>A: DELETE /api/v1/auth/signup (CSRF)
    A->>P: Kakao unlink(어드민 키) 또는 Naver revoke(대기 중 토큰)
    A-->>W: 204 (연결 끊기 실패도 204, 기록만)
  end
```

## 흐름 10: 토큰 갱신과 교체 — 구현됨(사이클 05, 2026-10-04 retro 반영)

```mermaid
sequenceDiagram
  autonumber
  participant W as web (탭)
  participant A as auth
  participant D as DB auth.refresh_token
  W->>A: GET /api/v1/me (access 쿠키 만료로 없음)
  A-->>W: 401 unauthorized
  W->>W: navigator.locks.request auth-refresh
  W->>A: GET /api/v1/me 다시 (다른 탭이 이미 갱신했는지)
  alt 이미 갱신됨
    A-->>W: 200
  else 아직 401
    W->>A: POST /api/v1/auth/refresh (refresh 쿠키, CSRF)
    A->>D: token_hash 또는 previous_token_hash로 줄 찾기 FOR UPDATE
    alt 줄 있음, expires_at 남음
      A->>D: previous=old, token=new, rotated_at=now (expires_at 그대로)
      A-->>W: 204 + Set-Cookie 둘
      W->>A: 원래 요청 다시
    else previous_token_hash와 같음 (재사용)
      A->>D: 그 줄 삭제 (그 로그인 끝)
      A-->>W: 401 unauthorized
    else 없음 또는 만료
      A-->>W: 401 unauthorized, 쿠키 지움
      W->>W: 로그인 전 상태로
    end
  end
```

- 여러 탭이 동시에 갱신하지 않게 웹이 Web Locks로 한 번에 한 탭만 갱신합니다(ADR-0038).

## 흐름 11: 탈퇴 (재인증) — 구현됨(사이클 05, 2026-10-04 retro 반영)

```mermaid
sequenceDiagram
  autonumber
  actor U as 사용자
  participant W as web
  participant A as auth
  participant P as 제공자
  participant R as event_publication
  U->>W: S7 계속
  W->>A: GET /api/v1/auth/oauth2/authorization/naver-reauth
  A-->>U: 302 auth_type=reauthenticate (카카오는 prompt=login)
  U->>P: 다시 로그인
  P-->>A: GET /api/v1/auth/login/oauth2/code/naver-reauth
  alt 취소 또는 제공자 오류
    A-->>W: 302 /auth/complete?result=withdraw_cancelled 또는 withdraw_provider_error
  else 정상
    A->>P: 토큰 교환, 프로필
    A->>A: refresh 쿠키로 현재 계정 찾기
    alt 리프레시 줄 없음 또는 만료
      A-->>W: 302 result=withdraw_login_expired
    else 돌아온 계정이 현재 계정과 다름
      A-->>W: 302 result=withdraw_account_mismatch
    else 같은 계정
      A->>A: 재인증 증명 저장 (accountId, verifiedAt, Naver 토큰)
      A-->>W: 302 result=withdraw_reauthenticated
      W->>A: DELETE /api/v1/me (access 쿠키, CSRF)
      alt 증명 없음 또는 5분 지남
        A-->>W: 403 reauthentication_required 또는 reauthentication_expired
      else 유효
        A->>P: Kakao unlink 또는 Naver revoke
        Note over A,P: 한 번만 요청. 실패해도 다시 요청하지 않고 다음으로, 서버 로그만
        A->>A: 트랜잭션 account 삭제 (cascade) + AccountDeleted 발행
        A->>R: listener 하나당 기록 1줄 (처리 끝나면 지워짐)
        A-->>W: 204 + 쿠키 두 개 만료
        W->>W: S1 + 탈퇴했습니다
      end
    end
  end
```

## 흐름 12: 제공자 쪽에서 연결을 끊음 — 구현됨(사이클 05, 2026-10-04 retro 반영)

```mermaid
sequenceDiagram
  autonumber
  participant K as 카카오
  participant N as 네이버
  participant A as auth
  participant R as event_publication
  K->>A: POST /api/v1/auth/webhooks/kakao-unlink (Authorization KakaoAK 키, app_id, user_id)
  alt 키 또는 app_id 다름
    A-->>K: 401 unauthorized, 삭제 없음
  else 확인됨
    A->>A: login_method(KAKAO, user_id) 삭제, 남은 수단 없으면 account 삭제 + AccountDeleted
    A->>R: 기록
    A-->>K: 200 (없는 사용자여도 200, 3초 안)
  end
  N->>A: POST /api/v1/auth/webhooks/naver-unlink (form clientId, encryptUniqueId, timestamp, signature)
  alt clientId 다름, 서명 틀림, timestamp가 허용 범위 밖
    A-->>N: 401 unauthorized, 삭제 없음
  else 확인됨
    A->>A: encryptUniqueId 복호화 후 같은 삭제 처리
    A-->>N: 204 본문 없음
  end
```

- 놓친 알림은 카카오 연결 대조(하루 한 번)와 1년 미로그인 계정 정리로 메웁니다.
