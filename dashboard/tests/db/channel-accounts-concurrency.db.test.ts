import { afterEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import { upsertChannelAccount } from "@/lib/channel-accounts";
import { getDatabaseUrl } from "../isolation/_env";

type Sql = ReturnType<typeof postgres>;

const previousSecretKey = process.env.OSMU_SECRET_KEY;
const previousDatabaseUrl = process.env.DATABASE_URL;

async function tryConnect(): Promise<Sql | null> {
  const url = getDatabaseUrl();
  if (!url) return null;
  let sql: Sql | null = null;
  try {
    sql = postgres(url, { max: 3, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });
    await sql`select 1`;
    return sql;
  } catch {
    if (sql) await sql.end({ timeout: 5 });
    return null;
  }
}

afterEach(() => {
  if (previousSecretKey === undefined) delete process.env.OSMU_SECRET_KEY;
  else process.env.OSMU_SECRET_KEY = previousSecretKey;
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previousDatabaseUrl;
});

describe("channel_accounts first-account concurrency (live Postgres)", () => {
  it("serializes two first callbacks and leaves exactly one default account", async (ctx) => {
    const sql = await tryConnect();
    if (!sql) {
      if (process.env.CI) throw new Error("CI requires a reachable PostgreSQL service for concurrency QA");
      return ctx.skip();
    }

    const [tenant] = await sql<{ id: string }[]>`
      select id from tenants where slug = 'seed-a' limit 1`;
    if (!tenant) {
      await sql.end({ timeout: 5 });
      if (process.env.CI) throw new Error("CI requires the seed-a tenant for concurrency QA");
      return ctx.skip();
    }

    const provider = `qa-concurrency-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    process.env.DATABASE_URL = getDatabaseUrl()!;
    process.env.OSMU_SECRET_KEY = "qa-channel-account-concurrency-key";

    try {
      const results = await Promise.all([
        upsertChannelAccount({
          tenantId: tenant.id,
          provider,
          externalId: "account-a",
          accessToken: "token-a",
        }),
        upsertChannelAccount({
          tenantId: tenant.id,
          provider,
          externalId: "account-b",
          accessToken: "token-b",
        }),
      ]);

      expect(results.filter((result) => result.isDefault)).toHaveLength(1);

      const [counts] = await sql<{ total: number; defaults: number }[]>`
        select count(*)::int as total,
               count(*) filter (where is_default)::int as defaults
        from channel_accounts
        where tenant_id = ${tenant.id} and provider = ${provider}`;

      expect(counts).toEqual({ total: 2, defaults: 1 });
    } finally {
      await sql`
        delete from channel_accounts
        where tenant_id = ${tenant.id} and provider = ${provider}`;
      await sql.end({ timeout: 5 });
    }
  });
});
