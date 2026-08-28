BEGIN;

CREATE TABLE IF NOT EXISTS operational_incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fingerprint     TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN (
                    'publish_failed',
                    'token_expired',
                    'generation_failed',
                    'external_service_error'
                  )),
  source          TEXT NOT NULL,
  reason_code     TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('critical', 'error', 'warning')),
  intervention    TEXT NOT NULL CHECK (intervention IN ('human', 'automatic')),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'recovered')),
  occurrences     INTEGER NOT NULL DEFAULT 1 CHECK (occurrences > 0),
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  recovered_at    TIMESTAMPTZ,
  notified_at     TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_operational_incidents_open_fingerprint
  ON operational_incidents(tenant_id, fingerprint)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_operational_incidents_tenant_status
  ON operational_incidents(tenant_id, status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_operational_incidents_human_notification
  ON operational_incidents(intervention, notified_at, last_seen_at DESC)
  WHERE status = 'open' AND intervention = 'human';

GRANT SELECT, INSERT, UPDATE, DELETE ON operational_incidents TO osmu_service;
ALTER TABLE operational_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_incidents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_iso ON operational_incidents;
CREATE POLICY tenant_iso ON operational_incidents
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMIT;
