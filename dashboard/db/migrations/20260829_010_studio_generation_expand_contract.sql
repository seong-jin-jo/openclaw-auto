-- 구 앱과 신 앱의 멱등 충돌 대상을 함께 유지하고 무료 몫 장부를 작업 공간 삭제에서 분리한다.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'studio_generation_idempotency'::regclass
      AND contype = 'u'
      AND conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'studio_generation_idempotency'::regclass AND attname = 'tenant_id'),
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'studio_generation_idempotency'::regclass AND attname = 'member_id'),
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'studio_generation_idempotency'::regclass AND attname = 'operation'),
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'studio_generation_idempotency'::regclass AND attname = 'idempotency_key')
      ]::smallint[]
  ) THEN
    ALTER TABLE studio_generation_idempotency
      ADD CONSTRAINT uq_studio_generation_idempotency_tenant_member_operation_key
      UNIQUE (tenant_id, member_id, operation, idempotency_key);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'studio_free_regeneration_uses'::regclass
      AND contype = 'u'
      AND conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'studio_free_regeneration_uses'::regclass AND attname = 'tenant_id'),
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'studio_free_regeneration_uses'::regclass AND attname = 'member_id'),
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'studio_free_regeneration_uses'::regclass AND attname = 'local_date')
      ]::smallint[]
  ) THEN
    ALTER TABLE studio_free_regeneration_uses
      ADD CONSTRAINT uq_studio_free_regeneration_tenant_member_date
      UNIQUE (tenant_id, member_id, local_date);
  END IF;
END $$;

ALTER TABLE studio_free_regeneration_uses
  ALTER COLUMN tenant_id DROP NOT NULL,
  ALTER COLUMN original_job_id DROP NOT NULL,
  ALTER COLUMN replacement_job_id DROP NOT NULL;

ALTER TABLE studio_free_regeneration_uses
  DROP CONSTRAINT IF EXISTS studio_free_regeneration_uses_tenant_id_fkey,
  DROP CONSTRAINT IF EXISTS studio_free_regeneration_uses_tenant_id_original_job_id_fkey,
  DROP CONSTRAINT IF EXISTS studio_free_regeneration_uses_tenant_id_replacement_job_id_fkey;

ALTER TABLE studio_free_regeneration_uses
  ADD CONSTRAINT studio_free_regeneration_uses_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL NOT VALID,
  ADD CONSTRAINT studio_free_regeneration_uses_tenant_id_original_job_id_fkey
    FOREIGN KEY (tenant_id, original_job_id)
    REFERENCES studio_generation_jobs(tenant_id, id) ON DELETE SET NULL NOT VALID,
  ADD CONSTRAINT studio_free_regeneration_uses_tenant_id_replacement_job_id_fkey
    FOREIGN KEY (tenant_id, replacement_job_id)
    REFERENCES studio_generation_jobs(tenant_id, id)
    ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE studio_free_regeneration_uses
  VALIDATE CONSTRAINT studio_free_regeneration_uses_tenant_id_fkey;
ALTER TABLE studio_free_regeneration_uses
  VALIDATE CONSTRAINT studio_free_regeneration_uses_tenant_id_original_job_id_fkey;
ALTER TABLE studio_free_regeneration_uses
  VALIDATE CONSTRAINT studio_free_regeneration_uses_tenant_id_replacement_job_id_fkey;

COMMIT;
