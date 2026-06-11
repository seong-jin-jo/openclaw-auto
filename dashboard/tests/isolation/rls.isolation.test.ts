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
  it("osmu_service + 타테넌트 컨텍스트 → drafts 조회 0", async (ctx) => {
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
        const cross = await tx<{ c: number }[]>`select count(*)::int as c from drafts`;
        expect(cross[0].c).toBe(0);
        // owner 컨텍스트: 자기 draft는 보여야 함(>0).
        await tx`select set_config('app.tenant_id', ${ownerId}, true)`;
        const own = await tx<{ c: number }[]>`select count(*)::int as c from drafts`;
        expect(own[0].c).toBeGreaterThan(0);
      });
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
