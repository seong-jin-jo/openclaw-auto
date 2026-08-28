import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dbRoot = resolve(__dirname, "../../db");
const manifest = readFileSync(resolve(dbRoot, "migration-manifest.tsv"), "utf8");
const runner = readFileSync(resolve(dbRoot, "run-migrations.sh"), "utf8");
const deployWorkflow = readFileSync(resolve(__dirname, "../../../.github/workflows/deploy-marketing.yml"), "utf8");
const migrationWorkflow = readFileSync(resolve(__dirname, "../../../.github/workflows/osmu-db-migrate.yml"), "utf8");
const rollbackWriter = readFileSync(resolve(dbRoot, "write-rollback-manifest.sh"), "utf8");
const rollbackRunner = readFileSync(resolve(dbRoot, "rollback-migration.sh"), "utf8");
const memberMigration = readFileSync(resolve(dbRoot, "migrations/20260829_030_member_unique_expand.sql"), "utf8");

function manifestRows(): string[][] {
  return manifest.split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("\t"));
}

describe("OSMU explicit migration runner 계약", () => {
  it("GEN-MIG-01 정상: manifest의 모든 SQL checksum이 실제 파일과 일치한다", () => {
    for (const [id, phase, file, expected] of manifestRows()) {
      expect(id).toBeTruthy();
      expect(["baseline", "legacy", "expand-fk", "expand-guard", "expand-member", "contract-generation", "contract-quota", "cleanup"]).toContain(phase);
      const actual = crypto.createHash("sha256").update(readFileSync(resolve(dbRoot, file))).digest("hex");
      expect(actual, `${id} checksum`).toBe(expected);
    }
  });

  it("GEN-MIG-02 거절: 일반 배포는 historical wildcard나 schema replay 없이 read-only preflight만 실행한다", () => {
    expect(deployWorkflow).toContain("bash /db/run-migrations.sh preflight");
    expect(deployWorkflow).not.toMatch(/for migration in \/db\/migrations\/\*\.sql/);
    const preflightStep = deployWorkflow.slice(
      deployWorkflow.indexOf("OSMU DB 스키마 read-only preflight"),
      deployWorkflow.indexOf("이미지 빌드", deployWorkflow.indexOf("OSMU DB 스키마 read-only preflight")),
    );
    expect(preflightStep).not.toContain("schema.sql");
    expect(preflightStep).not.toContain("migrations/*.sql");
  });

  it("GEN-MIG-03 거절: 20260828_010은 baselined로만 기록하고 SQL을 replay하지 않는다", () => {
    expect(manifest).toContain("baseline-20260828-generation\tbaseline\tmigrations/20260828_010_studio_generation.sql");
    expect(runner).toContain('{"historical_sql_executed":false}');
    expect(runner).not.toContain("apply_phase baseline");
  });

  it("GEN-MIG-04 경계: checksum drift, advisory lock, running/failed 재진입을 강제한다", () => {
    expect(runner).toContain("manifest checksum mismatch");
    expect(runner).toContain("ledger checksum mismatch");
    expect(runner).toContain("pg_advisory_lock(hashtext('osmu-schema-migration-v1'))");
    expect(runner).toContain("state='running'");
    expect(runner).toContain("state='failed'");
    expect(runner).toContain("catalog state must be re-evaluated before retry");
  });

  it("GEN-MIG-05 거절: 일반 앱 preflight는 S1 guard 또는 member UNIQUE가 없는 DB를 통과시키지 않는다", () => {
    expect(runner).toContain("assert_compatibility_ready");
    expect(runner).toContain("generation_member_unique OR generation_guard");
    expect(runner).toContain("quota_member_unique OR quota_guard");
    expect(runner).toContain("compatibility app requires member UNIQUE or enabled E1 guard");
    const preflightCase = runner.slice(runner.indexOf("  preflight)"), runner.indexOf("  bootstrap)"));
    expect(preflightCase).toContain("assert_fingerprint");
    expect(preflightCase).toContain("assert_compatibility_ready");
  });

  it("GEN-MIG-06 거절: E3와 C1은 체크박스가 아니라 모든 실행 image digest와 commit을 직접 검증한다", () => {
    expect(migrationWorkflow).not.toContain("compatibility_app_digest_verified");
    expect(migrationWorkflow).toContain("docker ps --filter label=com.docker.compose.service=openclaw-dashboard-osmu");
    expect(migrationWorkflow).toContain("docker container inspect --format '{{.Image}}'");
    expect(migrationWorkflow).toContain("org.opencontainers.image.revision");
    expect(migrationWorkflow).toContain("git merge-base --is-ancestor");
    expect(runner).toContain("VERIFIED_APP_IMAGE_DIGEST");
    expect(runner).toContain("VERIFIED_APP_COMMIT");
  });

  it("GEN-MIG-07 거절: generation과 quota contract는 별도 manifest ID와 workflow phase다", () => {
    expect(manifest).toContain("contract-generation\tmigrations/20260829_040_tenant_unique_contract.sql");
    expect(manifest).toContain("contract-quota\tmigrations/20260829_045_quota_tenant_unique_contract.sql");
    expect(migrationWorkflow).toContain("- contract-generation");
    expect(migrationWorkflow).toContain("- contract-quota");
  });

  it("GEN-MIG-08 거절: FK 수명 migration과 기존 필수 migration은 explicit manifest로만 적용한다", () => {
    expect(manifest).toContain("20260829_010_studio_generation_expand_contract\texpand-fk");
    for (const id of ["20260828_020", "20260828_030", "20260828_040", "20260828_050", "20260828_060"]) {
      expect(manifest).toContain(`${id}_`);
    }
    expect(runner).toContain("apply_legacy_manifest");
    expect(runner).toContain('require_applied "20260829_010_studio_generation_expand_contract"');
  });

  it("GEN-MIG-09 경계: invalid concurrent index는 제거·재생성하고 definition drift는 중단한다", () => {
    expect(memberMigration).toContain("NOT i.indisvalid OR NOT i.indisready");
    expect(memberMigration).toContain("DROP INDEX CONCURRENTLY");
    expect(memberMigration).toContain("member unique index definition drift requires manual recovery");
  });

  it("GEN-MIG-10 거절: fingerprint 정의·index validity·duplicate·mixed state를 baseline 전에 검사한다", () => {
    expect(runner).toContain("pg_get_constraintdef");
    expect(runner).toContain("i.indisunique AND i.indisvalid AND i.indisready");
    expect(runner).toContain("mixed generation/quota schema fingerprint");
    expect(runner).toContain("assert_no_duplicates");
    expect(runner.indexOf("assert_no_duplicates", runner.indexOf("  baseline|"))).toBeGreaterThan(-1);
  });

  it("GEN-MIG-11 거절: C1 rollback manifest 원본·checksum과 승인 script, cleanup phase를 강제한다", () => {
    expect(migrationWorkflow).toContain("rollback_manifest_run_id");
    expect(migrationWorkflow).toContain("gh run download");
    expect(rollbackWriter).toContain("rollback_deadline_utc");
    expect(rollbackRunner).toContain("rollback-generation");
    expect(rollbackRunner).toContain("UNIQUE USING INDEX");
    expect(manifest).toContain("20260905_010_guard_cleanup\tcleanup");
    expect(runner).toContain("validate_cleanup_deadline");
  });

  it("GEN-MIG-12 거절: credential URI는 psql process argv에 전달하지 않는다", () => {
    expect(runner).not.toMatch(/psql\s+"\$DB_URL/);
    expect(runner).toContain("PGPASSWORD");
    expect(runner).toContain("psql -X");
  });
});
