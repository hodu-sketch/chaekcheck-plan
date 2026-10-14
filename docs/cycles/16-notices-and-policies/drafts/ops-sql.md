# 운영 예시 SQL 초안 [안]

공지·서비스 안내·약관 글을 운영 DB에 넣고 고칠 때 Claude가 따라 하는 SQL입니다. 운영자 화면이 없어서 이 SQL로 씁니다 ([spec.md](../spec.md) R8-1·R8-2). 인계서에 옮길 초안이며, 표·칸 이름은 [design-delta.md](../design-delta.md)를 따릅니다. 설계가 아직 Proposed라서 12·13·14 회고 뒤 설계를 확정할 때 이름이 바뀌면 함께 고칩니다.

시험함 (dev 사이클 16, 2026-10-14): 1~6절 모두 개발 DB에서 돎, 고친 문장 없음. dev가 더한 것: psql 한 번 실행 안에서 `\gset` + `\if`로 "1줄일 때만 COMMIT". 시퀀스 이름 `sitecontent.notice_id_seq`. 실제로 쓰는 판은 dev `docs/maintenance/5-sitecontent.md` (dev `docs/plan-feedback.md` "# 사이클 16")

## 지키는 것

- **사용자 확인 뒤에 넣는다**: Claude가 글과 바뀐 점을 먼저 보여 주고, 사용자가 확인하면 넣는다 ([design-decisions 2번 답](../easy/2026-10-13-design-decisions.html))
- **한 번에 한 트랜잭션**: `BEGIN; … COMMIT;`. 결과 줄 수를 보고 기대와 다르면 `ROLLBACK;`
- **판은 고치지 않고 새로 넣는다**: `notice_version`, `document_version`은 `UPDATE`·`DELETE`하지 않는다. 바꾸는 것은 `notice`의 `pinned`·`hidden`뿐 ([ADR-0098](../../../adr/0098-sitecontent-module-versioned-documents.md))
- **날짜 순서**: 새 판의 날짜는 그 글의 마지막 판 날짜보다 이르면 안 된다 (설계 결정 8, DB 검사 장치 없이 아래 조건으로 지킴)
- **"오늘"은 한국 날짜**: `(now() AT TIME ZONE 'Asia/Seoul')::date`
- **표를 쓰지 않는다**: 화면은 마크다운 표를 그리지 않음(`|`가 그대로 보임). 처리방침·바뀐 점도 목록으로 [확정] (사용자 승인, 2026-10-15, 사이클 16 회고 결정 #7)
- **본문은 `$$ … $$`로 감싼다**: 글 안의 따옴표·세미콜론이 SQL을 깨지 않게
- **다시 동의가 필요한 변경은 넣지 않는다**: 중요하거나 불리한 이용약관 변경, 동의문의 항목·목적·기간 변경은 다시 동의 화면이 생기기 전까지 넣지 않는다 ([ADR-0101](../../../adr/0101-terms-change-notice-or-reconsent.md), spec R7-3)
- **약관·동의문·처리방침을 바꾸면 공지도 함께**: 같은 트랜잭션에 공지 하나 (spec R7-1)

## 1. 새 공지 올리기

```sql
BEGIN;
WITH n AS (
  INSERT INTO sitecontent.notice (pinned) VALUES (false)
  RETURNING id
)
INSERT INTO sitecontent.notice_version (notice_id, version_no, effective_on, title, body)
SELECT n.id, 1, DATE '2026-11-03', $$점검 안내$$, $$11월 3일 새벽 2시~4시에 점검해요.$$
FROM n
RETURNING notice_id;   -- 공지 번호(/notices/{번호}), 1줄이어야 함
COMMIT;
```

- 게시일을 앞날로 넣으면 그날부터 목록에 나온다
- 고정 공지로 올리려면 `VALUES (true)`

## 2. 공지 고치기 (새 판)

```sql
BEGIN;
INSERT INTO sitecontent.notice_version (notice_id, version_no, effective_on, title, body)
SELECT v.notice_id, max(v.version_no) + 1, DATE '2026-11-04', $$점검 안내(시간 바뀜)$$, $$새벽 3시~5시로 바뀌었어요.$$
FROM sitecontent.notice_version v
WHERE v.notice_id = 7
GROUP BY v.notice_id
HAVING DATE '2026-11-04' >= max(v.effective_on);
-- 1줄이어야 함. 0줄이면 공지 번호가 틀렸거나 날짜가 마지막 판보다 이름 → ROLLBACK
COMMIT;
```

## 3. 공지 숨기기·다시 보이기, 고정·풀기

```sql
UPDATE sitecontent.notice SET hidden = true  WHERE id = 7;   -- 숨김 (목록·주소에서 사라짐, DB에는 남음)
UPDATE sitecontent.notice SET hidden = false WHERE id = 7;   -- 다시 보이기
UPDATE sitecontent.notice SET pinned = true  WHERE id = 7;   -- 1쪽 맨 위에 고정
UPDATE sitecontent.notice SET pinned = false WHERE id = 7;   -- 고정 풀기
-- 각각 1줄이어야 함
```

## 4. 서비스 안내·이용약관·처리방침 새 판

첫 판은 seed로 들어가 있다는 전제입니다(판이 하나도 없으면 판 번호가 비어 넣기가 실패함).

`document_key`: `ABOUT`, `TERMS_OF_SERVICE`, `PRIVACY_POLICY`. 바뀐 점(`change_summary`)은 이용약관·처리방침에만 넣고, 서비스 안내는 `NULL`.

```sql
BEGIN;
INSERT INTO sitecontent.document_version (document_key, version_no, effective_on, body, change_summary)
SELECT 'PRIVACY_POLICY', max(d.version_no) + 1, DATE '2026-12-01',
       $$## 1. 수집 항목, 목적, 보유 기간
…(새 본문 전체)…$$,
       $$○○ 항목을 더했어요.$$
FROM sitecontent.document_version d
WHERE d.document_key = 'PRIVACY_POLICY'
HAVING DATE '2026-12-01' >= max(d.effective_on);
-- 1줄이어야 함

-- 알리는 공지 (1번과 같은 방법, 게시일은 시행일보다 앞)
WITH n AS (INSERT INTO sitecontent.notice (pinned) VALUES (false) RETURNING id)
INSERT INTO sitecontent.notice_version (notice_id, version_no, effective_on, title, body)
SELECT n.id, 1, DATE '2026-11-24', $$개인정보 처리방침이 12월 1일에 바뀌어요$$,
       $$바뀐 점: ○○ 항목을 더했어요. 바뀌기 전 방침은 처리방침 화면의 날짜 고르기 칸에서 볼 수 있어요.$$
FROM n;
COMMIT;
```

## 5. 가입 동의문 새 판

동의문은 4항목(`consent_items`)이 반드시 있어야 한다(DB가 검사). 항목·목적·기간을 바꾸는 변경은 다시 동의가 필요하므로 지금은 넣지 않는다(위 "지키는 것"). 문장만 다듬는 변경에만 쓴다.

```sql
BEGIN;
INSERT INTO sitecontent.document_version (document_key, version_no, effective_on, body, change_summary, consent_items)
SELECT 'PRIVACY_COLLECTION', max(d.version_no) + 1, DATE '2026-12-01',
       $$위 정보만 받으며, 탈퇴하면 바로 지웁니다.$$,
       $$문장을 다듬었어요.$$,
       $$[{"label":"목적","text":"로그인 유지, 내 지역 도서관 찾기"},
          {"label":"항목","text":"카카오 회원 식별 번호, 거주·직장 지역, 직접 추가한 도서관"},
          {"label":"보유 기간","text":"탈퇴 또는 마지막 로그인 뒤 1년"},
          {"label":"거부할 권리","text":"동의하지 않으면 가입할 수 없지만, 검색은 그대로 쓸 수 있어요"}]$$::jsonb
FROM sitecontent.document_version d
WHERE d.document_key = 'PRIVACY_COLLECTION'
HAVING DATE '2026-12-01' >= max(d.effective_on);
COMMIT;
```

## 6. 확인하기

```sql
-- 문서마다 지금 판 (오늘 한국 날짜 기준)
SELECT DISTINCT ON (document_key) document_key, version_no, effective_on
FROM sitecontent.document_version
WHERE effective_on <= (now() AT TIME ZONE 'Asia/Seoul')::date
ORDER BY document_key, version_no DESC;

-- 한 문서의 모든 판과 적용 기간 (앞날 판 포함)
SELECT version_no, effective_on,
       lead(effective_on) OVER (ORDER BY version_no) AS next_effective_on
FROM sitecontent.document_version
WHERE document_key = 'TERMS_OF_SERVICE'
ORDER BY version_no;

-- 공지 목록 (숨김 포함, 마지막으로 넣은 판 — 앞날 판일 수 있음)
SELECT n.id, n.pinned, n.hidden, v.version_no, v.effective_on, v.title
FROM sitecontent.notice n
JOIN LATERAL (
  SELECT version_no, effective_on, title FROM sitecontent.notice_version
  WHERE notice_id = n.id ORDER BY version_no DESC LIMIT 1
) v ON true
ORDER BY n.id DESC;
```

## 7. 공개일에 할 것

- 운영 DB 첫 판은 [drafts/](README.md)의 승인된 글이 Liquibase seed로 들어간다. 시행일·게시일 = 공개일 ([design-delta.md](../design-delta.md) "운영 첫 판", spec R2-3)
- 첫 공지 [notice-first.md](notice-first.md)는 1번 SQL로 공개일 게시
- 서버를 AWS에서 노트북으로 옮기는 날: 4번 SQL로 처리방침 새 판(위탁 목록에서 AWS 줄 빼기, 안전 조치 문구 맞추기) + 알리는 공지
