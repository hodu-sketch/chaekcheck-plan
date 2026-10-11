# 사이클 10 회고: 인기 도서 (분야별 판매 순위 → 검색하는 도서관 전자책)

- 작성: 2026-10-12. 근거: dev `docs/plan-feedback.md` "# 사이클 10"(2453행~, AC 확인표 2662~2686행, "plan에 넘길 요약 (사이클 10)" 2688~2707행), dev 코드 대조(아래 "docs/current에 반영할 차이"), 사용자 보고(2026-10-12: "지금 디자인 사소한 거라서 … 이거 먼저 해도 될 거 같은데 사이클 10회고해")
- 이유는 사용자의 말이 있는 것만 적고, 없으면 `[이유 미확인]`. 사용자 말은 dev가 `plan-feedback.md`에 옮긴 것
- dev가 마친 범위: 인계서 0~8단계 전부. 백엔드 `./gradlew build`(모듈 검증·문서 테스트 포함), 웹 Vitest, 8단계 받기 시험·측정·Playwright 4폭. 인기 도서 화면 디자인 다듬기(토스·네이버 참고 시안)는 진행 중이고, 사용자 판단으로 회고 범위 밖 [확정] (사용자: "지금 디자인 사소한 거라서", 2026-10-12)

## 계획대로 된 것

- 새 모듈 `popular`(스키마 `popular` 표 다섯 개: `fetch_run`, `ranking_month`, `ranking_category`, `ranking_entry`, `cover`), 받기·예약(시작 받기, 매일 05:00 판단)·표지·공용 캐시(10분)·REST 두 개
- `catalog.BookLookup.byIsbn13`, 소장 스트림 `holdingLimit`(S14 앞 3곳만)
- 웹 `/popular`(S13, S13c, S13i, S14, S15), 공용 아래 창 `BottomSheet`(끌어내리기 80px, ⓧ, 폰 뒤로 가기는 창만 닫음)
- 받기 시험(2026-10-12, 대상 2026-09): 요청 34건 모두 200, 가장 짧은 간격 2000ms, 순위 1분 32초 + 표지 약 27분. 분류 판매 부수가 조사 문서 2-1절 값과 같음
- 인기 도서 API p95 19.7~27.4ms(기준 1초), 응답 117KB / gzip 21KB
- 서비스 DB ISBN 일치율 34.6%(809개 중 280, 수집 DB 시안 27.8%보다 높음)
- 테스트는 진짜 사이트를 부르지 않음(가짜 전송·로컬 `HttpServer`)

## 완료 기준 결과 (dev AC 확인표, 2026-10-12)

- AC-1~AC-21 모두 통과. AC-3은 320×640 맨 아래로 바로 뛸 때만 고침, AC-7은 화면에서 S1 바꾸기는 보지 않고 API·Vitest와 측정(계획 셋의 `available` 265 / 254 / 248)으로 봄

## 달라진 것과 이유

| 달라진 것 | 이유 (사용자 말) | 처리 |
|---|---|---|
| 분류: 언어·기술·공학도 뺌 → "전체" + 14분류, 한 달 요청 30건, 책 750권 | "'언어' 랑 '기술공학'도 빼주라" (까닭 [이유 미확인]) | ADR-0080 초안(ADR-0077을 대체) |
| 표지: 받은 그대로가 아니라 폭 200px JPEG로 줄여 저장·게시 | "나는 표지 크기를 일원화했으면 하는데 받는 크기가 여러개여도", "좀 작아도 괜찮아 오히려 최대한 작은게 좋아 서비스되는 표지의 크기가 그렇게 안 크자나" | ADR-0081 초안(ADR-0075를 대체) |
| 표지 응답 본문 상한 50MB(화면·POST는 1MB) | "상한 없애고 받아줘", 이어서 "상한 여유롭게 50MB로 하던가" | ADR-0081 |
| 표지 경로 규칙을 `/files/isbn/`에서 `/files/<영문 소문자 폴더>/…/s_<이름>`으로 넓힘 | 사용자가 "넓힌 규칙 그대로"를 고름(안대로면 약 1/4이 제목 글자) | ADR-0081 |
| 풀었을 때 1,600만 화소 넘는 그림은 실패로 셈 | dev 제안 [이유 미확인] | 회고 결정 페이지에서 확인 |
| User-Agent `chaekcheck (+<서비스 주소>)` → `book search service` | "chaekcheck 빼고 '도서 검색 서비스'라고만 해주라", 자바 `HttpClient`가 한글 헤더 값을 거절해 영어를 고름. 배포 때 `(+<서비스 주소>)`를 붙임 | `docs/current` 값 고침, 배포 백로그 |
| 문구 "내 도서관" → "검색하는 도서관"(S15 두 줄, S13i) | 로그인 전이나 "전체 도서관"으로 검색할 때 "내 도서관"이 맞지 않음. S15 줄바꿈: "'아직 내 도서관에 전자책이 없어요.' 이런 설명 다음에 '이용하는 전자도서관 사이트에서 희망도서로 신청해 보세요.' 이건 개행했으면 해" | `docs/current` 문구 고침 |
| ⓘ 말풍선을 앱 전체에서 밝은 둥근 네모로, ◀ ▶를 둥근 네모로 | "이거 왜 박스 까매 다른 것이랑 똑같이 해", "테마 유지해 줘 둥근 네모 다른 것들처럼", "이거 왼쪽도 그렇고.. 그리고 테마 유지해 줘 둥근 네모 다른 것들처럼" | `docs/current` 웹 절 고침 |
| S14 대출 조회 스트림 통째 실패 문구 "대출 정보를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요." | 정해지지 않았던 것, 사용자가 "이대로"를 고름 | `docs/current` 문구 |
| 머리 "인기 도서" 링크는 로고 바로 옆 | 사용자가 "로고 바로 옆 (지금 구현)"을 고름 | 그대로 |
| 세션 GET 1번, `CoverGrid`를 `CategorySection`에 합침, 테스트 문맥 정리 | dev 결정 [이유 미확인] (이름·구조 [안] 범위) | `docs/current` 이름 고침 |
| `display_order` CHECK 0..16 그대로(dev 제안) → **0..14로, 기존 changeset을 고침** | "아직 실제 서비스로 배포 안 되었으니까 liquibase 기존 changeset고치고 너가 알아서 changelog-sync든 아니면 새로 설치하든 뭐든 해" | ADR-0080, dev 후속(사이클 11 인계서 0단계) |

## [확인 필요] 결과 (인계서 표)

- 작은 표지 경로: `img`의 `src`가 바로 작은 그림(`s_`), `data-originalsrc`가 큰 그림 → `src` 그대로 씀 [확정: dev 확인]
- 분류 링크 ID: 화면의 22개 이름·ID가 조사 문서 2절과 같음 [확정]
- 판매량 POST `Referer` = 판매량 화면 주소로 통함 [확정]
- "전체" 순위 POST 7.2~7.3초: 읽기 시간 제한 10초에 가까움 → 지켜볼 것(백로그)
- 남은 것: 공용 캐시 메모리·새로 고침 한 번 시간(재지 않음), 받기를 켠 채 다시 켜서 "같은 달이 있으면 요청 0건"(권한 판단으로 실제로는 못 봄, `FetchDecisionTests`로만), 줄인 표지 응답 시간, 지난달 값이 들어온 뒤 고쳐지는지(11-03 vs 11-10)

## 새로 알게 된 제약

- 사이트의 "작은 표지"가 꼭 작지 않음(폭 458~600px, 최대 1.25MB PNG), 작은 표지 폴더가 여럿(`isbn`, `onix`, `old`, `trans`)
- 자바 `HttpClient`는 한글 헤더 값을 거절함(`IllegalArgumentException: invalid header value`)
- db-test 연결 한도 100에 테스트 문맥 수가 걸림(문맥마다 4개) → 새 테스트는 기존 문맥을 쓰거나 `@DirtiesContext` (사이클 11 인계서에 넣음)
- 로컬 `.env`에 `CHAEKCHECK_POPULAR_FETCH_ENABLED=false`가 있어야 함(기본 true라 켜지면 진짜 사이트를 부름). `collection-import` 프로필에서는 꺼짐
- 표지 하나를 받는 동안 원본(최대 50MB)이 서비스 힙에 올라옴 → 배포 때 힙 다시 재기에 포함(backlog)

## docs/current에 반영할 차이

dev 코드 대조(2026-10-12, Read·Grep만, dev `git log`는 이 세션 규칙상 못 봄). 모듈 관계는 설계 그대로: `popular` → `catalog`·`library`만(`popular/package-info.java` 16행, `backend/build/spring-modulith-docs/module-popular.puml` 28-29행), 이벤트 없음.

| 문서 | 고칠 곳 | 근거 (dev) |
|---|---|---|
| 모두 | "설계됨(미구현, 사이클 10)" → "구현됨 (사이클 10)" | 코드 있음, AC 통과 |
| `module-map.md` | 분류 17개(언어·기술·공학 포함)·1~16 → "전체" + 14분류, `display_order` 0~14(옛 달은 빈칸 가능), 도메인 모델 `"1" -- "17"` → 15 | `PopularCategory.java` 17-31행, `CategoryOrder.java` 11-33행, `PopularCache.java` 102행 |
| `module-map.md` 웹 | S15 두 줄 "아직 검색하는 도서관에 전자책이 없어요." / "이용하는 전자도서관 사이트에서 희망도서로 신청해 보세요.", S13i "흐린 책은 검색하는 도서관에 전자책이 없어요", S14 "검색하는 도서관 중 앞의 3곳"·통째 실패 문구, 제목 줄(위 작은 줄 "2026년 9월 판매 순위" + h1 "인기 도서", 디자인 다듬는 중), InfoTip 앱 전체 밝은 둥근 네모·`text` ReactNode, ◀ ▶ 둥근 네모, 공용 `BottomSheet`(`closeButton`, `closeOnBack`, 80px)·`useBackToClose`, `CoverGrid` → `CategorySection` | `popularText.ts` 12-20행, `PopularBookDialog.tsx` 145·159행, `PopularPage.tsx` 192-207행, `InfoTip.module.css` 39-47행 |
| `data-model.md` | `cover.content_type` 늘 `image/jpeg`, `cover.image` 폭 200px JPEG(실측 808장 11MB, 중간 14KB), `byte_size`는 줄인 뒤 크기, `ranking_entry.cover_path` 코드 규칙 `/files/<소문자 폴더>/…/s_<이름>`(DB CHECK는 "`/`로 시작" 그대로), 한 달 15줄·750권, 제약·색인·changeSet 이름 확정, `display_order` CHECK 0..16 그대로(값은 0~14), 확인 필요 표의 일치율(34.6%)·표 크기 닫기 | `001-popular-schema.yaml`, `FetchJob.java` 131행, `RankPageParser.java` 29·79행 |
| `api.md` | 분류 14개, 응답 117KB / gzip 21KB·p95 19.7~27.4ms, 표지 200px JPEG `image/jpeg`·`Cache-Control: public, max-age=2592000, immutable`, `holdingLimit` 이름·검증 순서 확정(1~20, `invalid_format`·`duplicate`, 지역 형식 뒤·계획 422 앞) | `PopularBooksController.java`, `BookAvailabilityStreamController.java` 69-147행 |
| `flows.md` 24~26 | 세션 GET 1번(판매량 화면 GET 없음), 한 달 요청 30건(1+15+14), User-Agent `book search service`, 표지 경로 폴더 여럿, 표지마다 200px JPEG로 줄이고 못 읽거나 화소 상한 넘으면 실패, 첫 달 최대 750장, 흐름 25 분류 15개 | `FetchJob.java` 112-141행, `FetchScheduler.java`, `application.yml` 186-218행 |
| 설정 | `chaekcheck.popular.fetch.*`(`max-body-size` 1MB, `cover-max-body-size` 50MB, `cover.width` 200·`jpeg-quality` 0.8·`max-pixels` 16000000), `cache.refresh-interval` 10m | `application.yml` 186-218행 |
| 설계에 없던 것 | `CoverResizer`, `BodyLimit`(availability 것 복사), `RankingChanged`, 요청마다 INFO 로그, 시험용 `LocalCoverResizeRunner`, 운영 메모 dev `docs/maintenance/4-popular.md` | dev 코드 |

## 다음 사이클 후보

- 사이클 11 가져오기 따로 하기 + 힙 줄이기 → 이 회고 뒤 `docs/current/handoff.md`로 바꿔 넣음 [확정] (사용자 승인, 2026-10-12, 회고 결정 #5)
- 인기 도서 디자인 다듬기(dev 세션에서 진행 중, 사이클 밖)
- 사이클 12 책 묶기 기준 다시 보기(사이클 11 뒤), 사이클 13 수집기 dev로 옮기기(초안, 다른 세션)
- 배포 사이클: User-Agent에 서비스 주소 붙이기, 서비스 힙 다시 재기(인기 도서 캐시·표지 포함)
