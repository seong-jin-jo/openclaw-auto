BEGIN;

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

COMMIT;
