-- Studio 생성 멱등 범위를 active tenant 안으로 단일화한다.
-- 기존 행과 tenant 포함 유일 제약은 보존하고, 중복된 회원 전역 제약만 제거한다.
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

  ALTER TABLE studio_generation_idempotency
    DROP CONSTRAINT IF EXISTS uq_studio_generation_idempotency_member_operation_key;
END $$;

COMMIT;
