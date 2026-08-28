import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve(__dirname, "../../db/schema.sql"), "utf8");
const migration = readFileSync(resolve(__dirname, "../../db/migrations/20260829_010_studio_generation_expand_contract.sql"), "utf8");

describe("Studio 생성 장부 배포 호환 계약", () => {
  it("M1-DEPLOY-01 정상: 구 앱과 신 앱의 ON CONFLICT 열 조합을 동시에 유지한다", () => {
    expect(schema).toContain("UNIQUE (tenant_id, member_id, operation, idempotency_key)");
    expect(schema).toContain("UNIQUE (member_id, operation, idempotency_key)");
    expect(migration).toContain("uq_studio_generation_idempotency_tenant_member_operation_key");
  });

  it("M2-DEPLOY-02 거절: 무료 몫 장부 외래키는 작업 공간과 생성 작업 삭제에 연쇄 삭제되지 않는다", () => {
    const freeLedger = schema.slice(schema.indexOf("CREATE TABLE IF NOT EXISTS studio_free_regeneration_uses"));
    expect(freeLedger).toContain("REFERENCES tenants(id) ON DELETE SET NULL");
    expect(freeLedger).toContain("REFERENCES studio_generation_jobs(tenant_id, id) ON DELETE SET NULL");
    expect(migration).not.toContain("studio_free_regeneration_uses_tenant_id_fkey\n    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE");
  });
});
