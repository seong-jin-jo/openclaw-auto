import crypto from "node:crypto";
import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { getDatabaseUrl } from "./_env";

const protectedTables = [
  "brand_guides",
  "integrations",
  "channel_accounts",
  "drafts",
  "studio_generation_jobs",
  "studio_generation_idempotency",
  "studio_free_regeneration_uses",
  "shorts_factory_runs",
  "shorts_factory_concept_runs",
  "published_posts",
  "engagement_items",
  "queue_posts",
  "schedules",
  "growth_metrics",
  "viral_signals",
  "wiki_docs",
  "usage_events",
  "subscriptions",
  "usage_quotas",
] as const;

async function connectRequired(ctx: { skip: () => void }) {
  const url = getDatabaseUrl();
  if (!url) {
    if (process.env.CI) throw new Error("CI requires DATABASE_URL for tenant RLS CRUD QA");
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

describe("작업 공간 RLS 읽기·수정·삭제 경계", () => {
  it("TENANT-RLS-01 한국어 설명: 모든 테넌트 테이블이 ENABLE·FORCE와 양방향 tenant_iso 정책을 가진다", async (ctx) => {
    const sql = await connectRequired(ctx);
    if (!sql) return;
    try {
      const tableRows = await sql<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }[]>`
        select relname, relrowsecurity, relforcerowsecurity
        from pg_class
        where relnamespace = 'public'::regnamespace and relname = any(${protectedTables as unknown as string[]}::text[])`;
      expect(tableRows.map((row) => row.relname).sort()).toEqual([...protectedTables].sort());
      expect(tableRows.every((row) => row.relrowsecurity && row.relforcerowsecurity)).toBe(true);

      const policies = await sql<{ tablename: string; qual: string; with_check: string }[]>`
        select tablename, qual, with_check from pg_policies
        where schemaname = 'public' and policyname = 'tenant_iso'
          and tablename = any(${protectedTables as unknown as string[]}::text[])`;
      expect(policies.map((row) => row.tablename).sort()).toEqual([...protectedTables].sort());
      for (const policy of policies) {
        expect(policy.qual).toContain("app.tenant_id");
        expect(policy.with_check).toContain("app.tenant_id");
      }
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("TENANT-RLS-02 한국어 설명: A 문맥은 A 정상 쓰기만 허용하고 B 읽기·수정·삭제·삽입을 거절한다", async (ctx) => {
    const sql = await connectRequired(ctx);
    if (!sql) return;
    const suffix = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    let tenantA: string | null = null;
    let tenantB: string | null = null;
    try {
      const [a, b] = await sql.begin(async (tx) => {
        const [createdA] = await tx<{ id: string }[]>`
          insert into tenants (slug, name, status) values (${`qa-rls-a-${suffix}`}, 'QA RLS A', 'active') returning id`;
        const [createdB] = await tx<{ id: string }[]>`
          insert into tenants (slug, name, status) values (${`qa-rls-b-${suffix}`}, 'QA RLS B', 'active') returning id`;
        return [createdA, createdB];
      });
      tenantA = a.id;
      tenantB = b.id;
      const draftB = crypto.randomUUID();
      await sql`insert into drafts (id, tenant_id, idea, status) values (${draftB}::uuid, ${tenantB}::uuid, 'B 원본', 'draft')`;

      const ownDraft = await sql.begin(async (tx) => {
        await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
        await tx`set local role osmu_service`;
        const [inserted] = await tx<{ id: string }[]>`
          insert into drafts (tenant_id, idea, status) values (${tenantA}::uuid, 'A 정상', 'draft') returning id`;
        const own = await tx<{ idea: string }[]>`select idea from drafts where id = ${inserted.id}::uuid`;
        const cross = await tx<{ id: string }[]>`select id from drafts where id = ${draftB}::uuid`;
        const updated = await tx<{ id: string }[]>`update drafts set idea = '공격 수정' where id = ${draftB}::uuid returning id`;
        const deleted = await tx<{ id: string }[]>`delete from drafts where id = ${draftB}::uuid returning id`;
        return { own, cross, updated, deleted };
      });
      expect(ownDraft.own).toEqual([{ idea: "A 정상" }]);
      expect(ownDraft.cross).toEqual([]);
      expect(ownDraft.updated).toEqual([]);
      expect(ownDraft.deleted).toEqual([]);

      await expect(sql.begin(async (tx) => {
        await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
        await tx`set local role osmu_service`;
        await tx`insert into drafts (tenant_id, idea, status) values (${tenantB}::uuid, '공격 삽입', 'draft')`;
      })).rejects.toThrow();

      const [bAfter] = await sql<{ idea: string }[]>`select idea from drafts where id = ${draftB}::uuid`;
      expect(bAfter.idea).toBe("B 원본");
    } finally {
      if (tenantA || tenantB) {
        await sql`delete from tenants where id in (${tenantA}::uuid, ${tenantB}::uuid)`.catch(() => {});
      }
      await sql.end({ timeout: 5 });
    }
  });
});
