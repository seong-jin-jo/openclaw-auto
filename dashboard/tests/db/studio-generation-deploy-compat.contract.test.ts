import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve(__dirname, "../../db/schema.sql"), "utf8");
const guardMigration = readFileSync(resolve(__dirname, "../../db/migrations/20260829_020_generation_guard_expand.sql"), "utf8");
const memberMigration = readFileSync(resolve(__dirname, "../../db/migrations/20260829_030_member_unique_expand.sql"), "utf8");
const contractMigration = readFileSync(resolve(__dirname, "../../db/migrations/20260829_040_tenant_unique_contract.sql"), "utf8");
const repository = readFileSync(resolve(__dirname, "../../src/lib/studio/generation/repository.ts"), "utf8");

describe("Studio 생성 장부 배포 호환 계약", () => {
  it("M1-DEPLOY-01 정상: fresh schema와 contract는 회원 전역 UNIQUE로 수렴한다", () => {
    expect(schema).not.toContain("UNIQUE (tenant_id, member_id, operation, idempotency_key)");
    expect(schema).toContain("UNIQUE (member_id, operation, idempotency_key)");
    expect(schema).toContain("UNIQUE (member_id, local_date)");
    expect(memberMigration).toContain("CREATE UNIQUE INDEX CONCURRENTLY");
    expect(contractMigration).toContain("DROP CONSTRAINT IF EXISTS uq_studio_generation_idempotency_tenant_member_operation_key");
    expect(repository).toContain("ON CONFLICT DO NOTHING");
    expect(repository).not.toContain("ON CONFLICT (member_id, local_date) DO NOTHING");
  });

  it("M1-DEPLOY-02 거절: S1 guard는 권한·RLS·대기 시간을 명시한다", () => {
    expect(guardMigration).toContain("SECURITY DEFINER");
    expect(guardMigration).toContain("OWNER TO osmu_generation_guard_owner");
    expect(guardMigration).toContain("NOLOGIN BYPASSRLS NOSUPERUSER");
    expect(guardMigration).toContain("SET search_path TO pg_catalog, pg_temp");
    expect(guardMigration).toContain("set_config('lock_timeout', '1500ms', true)");
    expect(guardMigration).toContain("REVOKE ALL ON FUNCTION");
    expect(repository).toContain("SET LOCAL statement_timeout = '5000ms'");
    expect(repository).toContain("SET LOCAL lock_timeout = '1500ms'");
  });

  it("M2-DEPLOY-02 거절: 무료 몫 장부 외래키는 작업 공간과 생성 작업 삭제에 연쇄 삭제되지 않는다", () => {
    const start = schema.indexOf("CREATE TABLE IF NOT EXISTS studio_free_regeneration_uses");
    const end = schema.indexOf("CREATE INDEX IF NOT EXISTS idx_studio_free_regeneration_jobs", start);
    const freeLedger = schema.slice(start, end);
    expect(freeLedger).toContain("REFERENCES tenants(id) ON DELETE SET NULL");
    expect(freeLedger).toContain("REFERENCES studio_generation_jobs(tenant_id, id) ON DELETE SET NULL");
    expect(freeLedger).not.toContain("ON DELETE CASCADE");
  });
});
