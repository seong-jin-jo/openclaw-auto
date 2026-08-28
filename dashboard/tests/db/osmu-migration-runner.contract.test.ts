import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dbRoot = resolve(__dirname, "../../db");
const manifest = readFileSync(resolve(dbRoot, "migration-manifest.tsv"), "utf8");
const runner = readFileSync(resolve(dbRoot, "run-migrations.sh"), "utf8");
const deployWorkflow = readFileSync(resolve(__dirname, "../../../.github/workflows/deploy-marketing.yml"), "utf8");

function manifestRows(): string[][] {
  return manifest.split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("\t"));
}

describe("OSMU explicit migration runner 계약", () => {
  it("GEN-MIG-01 정상: manifest의 모든 SQL checksum이 실제 파일과 일치한다", () => {
    for (const [id, phase, file, expected] of manifestRows()) {
      expect(id).toBeTruthy();
      expect(["baseline", "expand-guard", "expand-member", "contract"]).toContain(phase);
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
});
