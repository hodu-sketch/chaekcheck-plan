# ADR-0145: 서울도서관 전자도서관 화면 종류 `SEOUL_ELIB_V1`

Status: Accepted (사후 기록)
Date: 2026-10-23
Cycle: 22-first-screen-usability 회고 (dev가 계획 밖에서 만든 것을 기록만 함)
Supersedes: 없음

## 배경

사이클 22는 "웹만"(AC-18)이었지만, 사용자가 운영 화면을 보며 dev에서 직접 고치는 동안(v1.2.0~v1.9.10, 2026-10-19~24) 아래 변경이 들어갔다. plan을 거치지 않았으므로 사이클 22 회고(`docs/cycles/22-first-screen-usability/retro.md`)에서 dev main `d3c2696`을 읽고 사실대로 적는다(사용자 2026-10-23 "전부 지금 맞춤"). 값은 모두 [확정] (dev 구현 확인, 2026-10-23).

## 결정 (구현된 것)

1. `PlatformType.SEOUL_ELIB_V1`, 어댑터 `availability.internal.adapter.SeoulElibV1Adapter`. `library-020-platform-seoul-elib`이 `library_platform_type_check`를 다시 만듦. 도서관 줄은 넣기 명령(`library-insert`)으로(수집 번호 102739, 서울 거주·재직·재학, 온라인)
2. 검색: `{base}/api/contents/search?…&contentType=EB&searchKeyword=…&searchOption=1|2|3&currentCount={쪽}&pageCount=10` JSON. TY01(소장) `b2bCopys`·`currentLoanCount`·`currentResvCount`, TY02 구독, TY03(오디오북)·OverDrive(`OV`) 뺌. 상세 `/contents/detail.do?no=` → `/api/contents/{no}`, 「도서관에서 보기」는 `{base}/main`
3. 수집기 `crawl_catalog.py` 분야 목록(`/api/contents/catesearch`, 100줄, 1.1초 간격), 가져오기 기록 14번 SUCCEEDED(24,332권, v1.8.0)

## 이유

- 사용자: 새 플랫폼을 "after this release" 만들기로 함(2026-10-20, 커밋 `b2b3311`). 원문 [이유 미확인]
