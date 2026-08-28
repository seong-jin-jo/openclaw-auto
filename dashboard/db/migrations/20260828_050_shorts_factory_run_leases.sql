BEGIN;

ALTER TABLE shorts_factory_runs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE shorts_factory_runs
SET updated_at = COALESCE(finished_at, started_at, created_at)
WHERE status IN ('queued', 'running');

COMMIT;
