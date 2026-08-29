-- 되돌릴 수 없는 외부 게시를 지키는 세 가지를 한 번에 넣는다.
--   1. draft_id 없는 발행도 멱등 키로 예약해 동시 두 건이 두 번 나가지 않게 한다.
--   2. 예약에 임차 시각을 둬 프로세스가 죽어도 그 작업이 영원히 막히지 않게 한다.
--   3. 게시 성공 뒤 응답만 끊긴 경우를 uncertain 으로 보존해 재발행을 막는다.
-- 본문과 첫 댓글 상태도 분리해 댓글만 실패한 게시물이 전체 성공으로 보이지 않게 한다.
BEGIN;

ALTER TABLE published_posts
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_comment_status TEXT,
  ADD COLUMN IF NOT EXISTS first_comment_error TEXT,
  ADD COLUMN IF NOT EXISTS first_comment_external_id TEXT;

-- first_comment_status 의미
--   NULL           옛 기록. 첫 댓글을 시도했는지 알 수 없다.
--   not_requested  이 발행은 첫 댓글을 요청하지 않았다.
--   published      첫 댓글까지 올라갔다.
--   failed         본문은 올라갔고 첫 댓글만 실패했다. 댓글만 멱등 복구한다.
--   uncertain      첫 댓글 결과를 확인하지 못했다. 재시도 금지, 외부 확인이 먼저다.
ALTER TABLE published_posts
  DROP CONSTRAINT IF EXISTS published_posts_first_comment_status_check;
ALTER TABLE published_posts
  ADD CONSTRAINT published_posts_first_comment_status_check
  CHECK (first_comment_status IS NULL OR first_comment_status IN
    ('not_requested', 'published', 'failed', 'uncertain'));

-- uncertain 도 "재발행하면 안 되는 상태"라 멱등 인덱스 대상에 넣는다.
-- 이걸 빼면 결과 미확인 게시물을 다시 올려 중복 게시가 난다.
DROP INDEX IF EXISTS uq_published_posts_idem;
CREATE UNIQUE INDEX IF NOT EXISTS uq_published_posts_idem
  ON published_posts (tenant_id, draft_id, platform, COALESCE(account_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE draft_id IS NOT NULL AND status IN ('published', 'in_progress', 'uncertain');

-- draft_id 가 없는 실발행은 클라이언트가 준 멱등 키로 같은 보호를 받는다.
-- 키 없이 오는 실발행은 애플리케이션이 400 으로 거절한다.
CREATE UNIQUE INDEX IF NOT EXISTS uq_published_posts_idem_key
  ON published_posts (tenant_id, platform, COALESCE(account_id, '00000000-0000-0000-0000-000000000000'::uuid), idempotency_key)
  WHERE idempotency_key IS NOT NULL AND status IN ('published', 'in_progress', 'uncertain');

-- 임차 만료 판정을 인덱스로 받친다.
CREATE INDEX IF NOT EXISTS idx_published_posts_in_progress_lease
  ON published_posts (tenant_id, reserved_at)
  WHERE status = 'in_progress';

COMMIT;
