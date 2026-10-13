# 사이클 16 글 초안

운영 DB 첫 판에 넣을 글입니다. 다섯 개 모두 사용자 승인 (2026-10-13, [결정 페이지](../easy/2026-10-13-drafts-review.html)), "최소한의 정보만 노출 카카오/리디 참고"로 줄인 판. 각 파일의 맨 위 주석은 설명이고, 주석 아래가 DB에 들어갈 본문입니다.

| 파일 | 글 | `document_key` |
|---|---|---|
| [privacy-policy.md](privacy-policy.md) | 개인정보 처리방침 | `PRIVACY_POLICY` |
| [privacy-collection.md](privacy-collection.md) | 가입 화면의 개인정보 수집·이용 동의문 (4항목 + 한 줄) | `PRIVACY_COLLECTION` |
| [terms-of-service.md](terms-of-service.md) | 이용약관 | `TERMS_OF_SERVICE` |
| [about.md](about.md) | 서비스 안내 (13·14 회고 때 실제 문장과 맞춤) | `ABOUT` |
| [notice-first.md](notice-first.md) | 첫 공지 "책첵을 시작했어요" | 공지 (`notice`) |

- 공개 전에 채울 값([확인 필요]): 보호 담당 표기(실명 대신 "책첵 운영자" [안]), AWS 계약 법인, Cloudflare 연락처·보유 기간·쿠키 여부, 공개일 — [spec.md](../spec.md) 확인 필요 8
- 근거: 법정 항목·지침 [research.md](../research.md) 2·5·6·8절, 다른 사이클에서 받은 값 [privacy-inputs.md](../privacy-inputs.md), 서비스 안내 문구 [ADR-0059](../../../adr/0059-library-logos.md), 약관 변경 [ADR-0101](../../../adr/0101-terms-change-notice-or-reconsent.md)
- 시행일 `{{공개일}}` = 모르는 사람에게도 공개하는 날 (spec R2-3)
