import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATIONS_DIR = resolve(__dirname, "../../db/migrations");
const releaseMigrations = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.startsWith("20260828_") && name.endsWith(".sql"))
  .sort();

describe("2026-08-28 릴리스 마이그레이션 실행 계약", () => {
  it("의존 대상이 참조 마이그레이션보다 먼저 실행된다", () => {
    expect(releaseMigrations).toEqual([
      "20260828_010_studio_generation.sql",
      "20260828_020_engagement_items.sql",
      "20260828_030_operational_incidents.sql",
      "20260828_040_shorts_factory_runs.sql",
      "20260828_050_shorts_factory_run_leases.sql",
      "20260828_060_code_review_tenant_fk.sql",
    ]);
  });

  it.each(releaseMigrations)("%s 전체를 트랜잭션으로 감싼다", (name) => {
    const sql = readFileSync(resolve(MIGRATIONS_DIR, name), "utf-8").trim();
    expect(sql).toMatch(/^(?:--[^\n]*\n)*BEGIN;/);
    expect(sql).toMatch(/COMMIT;$/);
  });
});
