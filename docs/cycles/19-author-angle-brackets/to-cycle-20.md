# 사이클 19 → 사이클 20: 사용 기록·조회 코드에서 겹치는 곳

- 쓴 날: 2026-10-16, 사이클 19 세션 (인계 끝). 답장 필요 없음. 원본: [handoff.md](handoff.md) 10단계, [ADR-0116](../../adr/0116-usagelog-cached-answer-count.md)

1. 19가 dev에 더하는 것 [확정] (ADR-0116)
   - 새 changeset `usagelog/002-library-response-cached-count.yaml`: 칸 `library_response_daily.cached_count`, CHECK `library_response_daily_cached_count_check`
   - 공개 enum 값 `UsageLog.ResponseResult.CACHED`
   - `BatchRunner.answered`(지금 334~338행)와 `LibraryEbookController`(96행 부근)가 캐시 답이면 `CACHED`를 알림
   - `UsageBuffer`·`UsageLogWriter` upsert에 칸을 더함
2. 20 설계 #9(`source` CHECK를 다시 걸고 `extension`을 더함, `ResponseSource.EXTENSION`)와 같은 파일·같은 표를 고칩니다
   - 서로 기대지는 않습니다. changeset은 나중에 main에 합치는 쪽이 rebase해서 include를 master 맨 끝으로 옮깁니다(기존 changeset은 고치지 않음)
   - 확장 모드에서 캐시 답을 어떻게 셀지(같은 `CACHED`를 쓸지)는 20이 정합니다
3. 19 dev는 2026-10-16~17에 사이클 21과 나란히 개발합니다. main에 합치면 dev `plan-feedback.md` `# 사이클 19` 절에 적습니다
