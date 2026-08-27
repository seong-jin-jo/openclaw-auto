import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { describe, expect, it, vi } from "vitest";
import { getDatabaseUrl } from "../isolation/_env";

type Sql = ReturnType<typeof postgres>;

async function connectRequired(ctx: { skip: () => void }): Promise<Sql | null> {
  const url = getDatabaseUrl();
  if (!url) {
    if (process.env.CI) throw new Error("CI requires DATABASE_URL for operational incident concurrency tests");
    ctx.skip();
    return null;
  }
  const sql = postgres(url, { max: 3, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });
  try {
    await sql`select 1`;
    return sql;
  } catch (error) {
    await sql.end({ timeout: 5 });
    if (process.env.CI) throw error;
    ctx.skip();
    return null;
  }
}

describe("운영 장애 원장 동시 기록", () => {
  it("관측-13 경합: 같은 작업 공간의 동일 장애 여덟 건은 열린 한 행과 발생 횟수 여덟로 합친다", async (ctx) => {
    const sql = await connectRequired(ctx);
    if (!sql) return;

    const tenantId = randomUUID();
    const marker = `incident-concurrency-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const previousUrl = process.env.DATABASE_URL;
    let appDb: { end: (options: { timeout: number }) => Promise<void> } | null = null;
    try {
      await sql`INSERT INTO tenants (id, slug, name, status, tier)
        VALUES (${tenantId}::uuid, ${marker}, 'Incident Concurrency', 'active', 'team')`;
      process.env.DATABASE_URL = getDatabaseUrl()!;
      vi.resetModules();
      const { recordOperationalIncident } = await import("@/lib/observability/incidents");

      const results = await Promise.all(Array.from({ length: 8 }, () => recordOperationalIncident({
        workspaceId: tenantId,
        category: "external_service_error",
        source: "instagram",
        reasonCode: "http_5xx",
        severity: "warning",
        intervention: "automatic",
      })));

      expect(results).toEqual(Array(8).fill(true));
      const rows = await sql<{ row_count: number; occurrences: number }[]>`
        SELECT count(*)::int AS row_count, max(occurrences)::int AS occurrences
        FROM operational_incidents
        WHERE tenant_id = ${tenantId}::uuid AND status = 'open'`;
      expect(rows[0]).toEqual({ row_count: 1, occurrences: 8 });
      const { db } = await import("@/lib/db");
      appDb = db();
    } finally {
      await sql`DELETE FROM tenants WHERE id = ${tenantId}::uuid`;
      if (appDb) await appDb.end({ timeout: 5 });
      await sql.end({ timeout: 5 });
      if (previousUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousUrl;
      vi.resetModules();
    }
  });
});
