BEGIN;

ALTER TABLE shorts_factory_runs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Existing rows receive the ADD COLUMN timestamp. Do not rewrite queued/running
-- rows from started_at: updated_at is the live lease heartbeat and replaying a
-- historical migration must never move it backwards.

COMMIT;
