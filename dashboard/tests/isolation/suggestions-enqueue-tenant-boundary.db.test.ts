import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import postgres from "postgres";
import { describe, expect, it, vi } from "vitest";
import { getDatabaseUrl } from "./_env";

type Sql = ReturnType<typeof postgres>;

async function connectRequired(ctx: { skip: () => void }): Promise<Sql | null> {
  const url = getDatabaseUrl();
  if (!url) {
    if (process.env.CI) throw new Error("CI requires DATABASE_URL for suggestion tenant isolation");
    ctx.skip();
    return null;
  }
  const sql = postgres(url, { max: 2, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });
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

describe("BE-V63-02 제안 큐 인계 tenant 경계", () => {
  it("BE-V63-02 격리 경로: A 토큰에 B tenant_id를 넣어도 A 큐에만 저장한다", async (ctx) => {
    const sql = await connectRequired(ctx);
    if (!sql) return;

    const previousDatabaseUrl = process.env.DATABASE_URL;
    const previousDataDir = process.env.DATA_DIR;
    const previousNodeEnv = process.env.NODE_ENV;
    const previousDashboardToken = process.env.DASHBOARD_AUTH_TOKEN;
    const dataRoot = mkdtempSync(path.join(tmpdir(), "osmu-suggestion-boundary-"));
    const tenantA = randomUUID();
    const tenantB = randomUUID();
    const marker = `suggestion-boundary-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let appDb: { end: (options: { timeout: number }) => Promise<void> } | null = null;

    try {
      await sql`
        insert into tenants (id, slug, name, status, tier)
        values
          (${tenantA}::uuid, ${`${marker}-a`}, 'Suggestion A', 'active', 'team'),
          (${tenantB}::uuid, ${`${marker}-b`}, 'Suggestion B', 'active', 'team')`;

      process.env.DATABASE_URL = getDatabaseUrl()!;
      process.env.DATA_DIR = dataRoot;
      Reflect.set(process.env, "NODE_ENV", "production");
      process.env.DASHBOARD_AUTH_TOKEN = "operator-token-for-suggestion-boundary";
      vi.resetModules();

      const { issueTenantToken } = await import("@/lib/tenant-auth");
      const { db } = await import("@/lib/db");
      const { proxy } = await import("@/proxy");
      const { POST } = await import("@/app/api/suggestions/enqueue/route");
      const issued = await issueTenantToken(tenantA, "suggestion-boundary");
      const suggestion = {
        id: "hyp_cross_tenant",
        text: "A 토큰의 제안",
        basis: "hypothesis",
        label: "가설 · 우리 검증 기록 아님",
        verified: false,
        evidence: { postIds: [], signalIds: [], sampleCount: 0 },
      };
      const requestInit = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${issued.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenant_id: tenantB, suggestion }),
      };

      const proxyResponse = await proxy(new NextRequest("http://localhost/api/suggestions/enqueue", requestInit));
      expect(proxyResponse.status).toBe(200);
      expect(proxyResponse.headers.get("x-middleware-next")).toBe("1");

      const response = await POST(new Request("http://localhost/api/suggestions/enqueue", requestInit));
      const body = await response.json();
      expect(response.status).toBe(201);
      expect(body.post.sourceContext.suggestionId).toBe("hyp_cross_tenant");

      const [counts] = await sql<{ a: number; b: number }[]>`
        select
          count(*) filter (where tenant_id = ${tenantA}::uuid)::int as a,
          count(*) filter (where tenant_id = ${tenantB}::uuid)::int as b
        from queue_posts
        where id = ${body.post.id}::uuid`;
      expect(counts).toEqual({ a: 1, b: 0 });
      expect(existsSync(path.join(dataRoot, "tenants", tenantA, "queue.json"))).toBe(true);
      expect(existsSync(path.join(dataRoot, "tenants", tenantB, "queue.json"))).toBe(false);

      appDb = db();
    } finally {
      await sql`delete from tenants where id in (${tenantA}::uuid, ${tenantB}::uuid)`;
      if (appDb) await appDb.end({ timeout: 5 });
      await sql.end({ timeout: 5 });
      rmSync(dataRoot, { recursive: true, force: true });
      if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousDatabaseUrl;
      if (previousDataDir === undefined) delete process.env.DATA_DIR;
      else process.env.DATA_DIR = previousDataDir;
      if (previousNodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
      else Reflect.set(process.env, "NODE_ENV", previousNodeEnv);
      if (previousDashboardToken === undefined) delete process.env.DASHBOARD_AUTH_TOKEN;
      else process.env.DASHBOARD_AUTH_TOKEN = previousDashboardToken;
      vi.resetModules();
    }
  });
});
