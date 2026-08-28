import { describe, it, expect } from "vitest";
import postgres from "postgres";
import { getDatabaseUrl } from "./_env";

// L1 RLS 라이브 검증 (Supabase). osmu_service role로 SET ROLE + set_config('app.tenant_id') 후
// 교차테넌트 조회=0, WITH CHECK 타테넌트 INSERT 거부, rolbypassrls=false 확인.
// 라이브 의존: DATABASE_URL/연결/데이터 없으면 ctx.skip (하드실패 금지).

type Sql = ReturnType<typeof postgres>;

// 연결 후 fn 실행. 연결 불가/URL없음 → null 반환(테스트가 skip).
async function tryConnect(): Promise<Sql | null> {
  const url = getDatabaseUrl();
  if (!url) return null;
  let sql: Sql | null = null;
  try {
    sql = postgres(url, { max: 2, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });
    await sql`select 1`;
    return sql;
  } catch {
    if (sql) await sql.end({ timeout: 5 });
    return null;
  }
}

describe("L1 RLS 교차테넌트 격리 (라이브 Supabase)", () => {
  it("TENANT-RLS-LEGACY-01 osmu_service + 타테넌트 컨텍스트에서 소유자 drafts 조회 0", async (ctx) => {
    const sql = await tryConnect();
    if (!sql) return ctx.skip();
    try {
      const tenants = await sql<{ id: string; slug: string }[]>`
        select id, slug from tenants order by slug`;
      if (tenants.length < 2) return ctx.skip();

      // drafts 소유 테넌트 탐색. 데이터 없으면 skip.
      const owners = await sql<{ tenant_id: string }[]>`
        select tenant_id from drafts group by tenant_id`;
      if (owners.length === 0) return ctx.skip();

      const ownerId = owners[0].tenant_id;
      const other = tenants.find((t) => t.id !== ownerId);
      if (!other) return ctx.skip();

      await sql.begin(async (tx) => {
        await tx`set local role osmu_service`;
        // 타테넌트(other) 컨텍스트: owner의 draft는 RLS로 숨겨져 0이어야 함.
        await tx`select set_config('app.tenant_id', ${other.id}, true)`;
        const cross = await tx<{ c: number }[]>`
          select count(*)::int as c from drafts where tenant_id = ${ownerId}`;
        expect(cross[0].c).toBe(0);
        // owner 컨텍스트: 자기 draft는 보여야 함(>0).
        await tx`select set_config('app.tenant_id', ${ownerId}, true)`;
        const own = await tx<{ c: number }[]>`
          select count(*)::int as c from drafts where tenant_id = ${ownerId}`;
        expect(own[0].c).toBeGreaterThan(0);
      });
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  // 새로 RLS-보호된 빌링 테이블도 동일하게 교차테넌트 0이어야 함(usage_events/usage_quotas/subscriptions).
  it("osmu_service + 타테넌트 컨텍스트 → 빌링 테이블 교차조회 0", async (ctx) => {
    const sql = await tryConnect();
    if (!sql) return ctx.skip();
    try {
      const tenants = await sql<{ id: string }[]>`select id from tenants order by id`;
      if (tenants.length < 2) return ctx.skip();

      let asserted = 0;
      for (const table of ["usage_events", "usage_quotas", "subscriptions"]) {
        // 해당 테이블에 데이터를 가진 테넌트 탐색. 없으면 그 테이블은 건너뜀.
        const owners = await sql<{ tenant_id: string }[]>`
          select tenant_id from ${sql(table)} group by tenant_id`;
        if (owners.length === 0) continue;
        const ownerId = owners[0].tenant_id;
        const other = tenants.find((t) => t.id !== ownerId);
        if (!other) continue;

        await sql.begin(async (tx) => {
          await tx`set local role osmu_service`;
          await tx`select set_config('app.tenant_id', ${other.id}, true)`;
          const cross = await tx<{ c: number }[]>`
            select count(*)::int as c from ${tx(table)} where tenant_id = ${ownerId}`;
          expect(cross[0].c, `${table} 교차테넌트 조회`).toBe(0);
          await tx`select set_config('app.tenant_id', ${ownerId}, true)`;
          const own = await tx<{ c: number }[]>`
            select count(*)::int as c from ${tx(table)} where tenant_id = ${ownerId}`;
          expect(own[0].c, `${table} 자기 조회`).toBeGreaterThan(0);
        });
        asserted++;
      }
      if (asserted === 0) return ctx.skip();
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("WITH CHECK: 타테넌트 tenant_id INSERT 거부 (롤백)", async (ctx) => {
    const sql = await tryConnect();
    if (!sql) return ctx.skip();
    try {
      const tenants = await sql<{ id: string }[]>`select id from tenants order by id`;
      if (tenants.length < 2) return ctx.skip();
      const [a, b] = tenants;

      // a 컨텍스트에서 b 소유로 INSERT 시도 → WITH CHECK 위반으로 reject. begin이 자동 롤백.
      await expect(
        sql.begin(async (tx) => {
          await tx`set local role osmu_service`;
          await tx`select set_config('app.tenant_id', ${a.id}, true)`;
          await tx`insert into drafts (tenant_id, idea) values (${b.id}, 'rls-cross-insert-test')`;
        }),
      ).rejects.toThrow();
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("WITH CHECK: usage_events 타테넌트 INSERT 거부 (롤백)", async (ctx) => {
    const sql = await tryConnect();
    if (!sql) return ctx.skip();
    try {
      const tenants = await sql<{ id: string }[]>`select id from tenants order by id`;
      if (tenants.length < 2) return ctx.skip();
      const [a, b] = tenants;
      await expect(
        sql.begin(async (tx) => {
          await tx`set local role osmu_service`;
          await tx`select set_config('app.tenant_id', ${a.id}, true)`;
          await tx`insert into usage_events (tenant_id, event_type, quantity) values (${b.id}, 'rls-cross-insert-test', 1)`;
        }),
      ).rejects.toThrow();
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("osmu_service role은 rolbypassrls=false (RLS 우회 불가)", async (ctx) => {
    const sql = await tryConnect();
    if (!sql) return ctx.skip();
    try {
      const r = await sql<{ rolbypassrls: boolean }[]>`
        select rolbypassrls from pg_roles where rolname = 'osmu_service'`;
      if (r.length === 0) return ctx.skip();
      expect(r[0].rolbypassrls).toBe(false);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
