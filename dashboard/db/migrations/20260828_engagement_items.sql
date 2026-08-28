BEGIN;

CREATE TABLE IF NOT EXISTS engagement_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  published_post_id     UUID NOT NULL REFERENCES published_posts(id) ON DELETE CASCADE,
  platform              TEXT NOT NULL,
  provider_comment_id   TEXT NOT NULL,
  state                 TEXT NOT NULL DEFAULT 'unread'
                        CHECK (state IN ('unread', 'deferred', 'replying', 'replied', 'editor_handoff')),
  reply_request_key     TEXT,
  reply_text            TEXT,
  reply_external_id     TEXT,
  replied_at            TIMESTAMPTZ,
  liked_at              TIMESTAMPTZ,
  deferred_at           TIMESTAMPTZ,
  editor_handoff_at     TIMESTAMPTZ,
  editor_draft_id       UUID REFERENCES drafts(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, platform, provider_comment_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_published_posts_tenant_id
  ON published_posts(tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_drafts_tenant_id
  ON drafts(tenant_id, id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'engagement_items'::regclass
      AND conname = 'fk_engagement_items_tenant_published_post'
  ) THEN
    ALTER TABLE engagement_items
      ADD CONSTRAINT fk_engagement_items_tenant_published_post
      FOREIGN KEY (tenant_id, published_post_id)
      REFERENCES published_posts(tenant_id, id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'engagement_items'::regclass
      AND conname = 'fk_engagement_items_tenant_editor_draft'
  ) THEN
    ALTER TABLE engagement_items
      ADD CONSTRAINT fk_engagement_items_tenant_editor_draft
      FOREIGN KEY (tenant_id, editor_draft_id)
      REFERENCES drafts(tenant_id, id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_engagement_items_tenant_state
  ON engagement_items(tenant_id, state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_items_post
  ON engagement_items(tenant_id, published_post_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON engagement_items TO osmu_service;
ALTER TABLE engagement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_iso ON engagement_items;
CREATE POLICY tenant_iso ON engagement_items
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMIT;
