import { describe, it, expect } from "vitest";
import postgres from "postgres";
import { getDatabaseUrl } from "../isolation/_env";

// 발행 기록(published_posts)의 DB 라운드트립 — /api/publish가 쓰는 write 경로의
// 테이블·컬럼·RLS 계약을 실 Postgres에 대해 검증한다. (mock 분기는 publish-route.branch.test.ts.)
// 라이브 의존: DATABASE_URL 없으면 ctx.skip (하드실패 금지, rls.isolation 패턴과 동일).
// 트랜잭션 내에서 INSERT→SELECT 후 강제 롤백 — 실데이터를 남기지 않는다.

type Sql = ReturnType<typeof postgres>;

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

const ROLLBACK = "ROLLBACK_SENTINEL";

describe("발행 기록 published_posts 라운드트립 (라이브 Postgres)", () => {
  it("withTenant 컨텍스트에서 INSERT한 행이 같은 테넌트로 조회된다 (published 상태)", async (ctx) => {
    const sql = await tryConnect();
    if (!sql) return ctx.skip();
    try {
      const [t] = await sql<{ id: string }[]>`select id from tenants order by id limit 1`;
      if (!t) return ctx.skip();

      let seen = 0;
      let status = "";
      await sql
        .begin(async (tx) => {
          await tx`set local role osmu_service`;
          await tx`select set_config('app.tenant_id', ${t.id}, true)`;
          // /api/publish가 기록하는 컬럼 계약과 동일하게 INSERT
          await tx`
            insert into published_posts (tenant_id, platform, external_id, permalink, text, status, error)
            values (${t.id}, 'threads', 'harness-ext-1', 'https://example/p', 'harness-roundtrip', 'published', null)`;
          const r = await tx<{ c: number; status: string }[]>`
            select count(*)::int as c, max(status) as status from published_posts where text = 'harness-roundtrip'`;
          seen = r[0].c;
          status = r[0].status;
          throw new Error(ROLLBACK); // 실데이터 안 남기고 롤백
        })
        .catch((e: unknown) => {
          if (!(e instanceof Error) || e.message !== ROLLBACK) throw e;
        });

      expect(seen).toBeGreaterThan(0);
      expect(status).toBe("published");
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("실패 발행도 status='failed' + error로 기록되는 컬럼이 존재한다", async (ctx) => {
    const sql = await tryConnect();
    if (!sql) return ctx.skip();
    try {
      const [t] = await sql<{ id: string }[]>`select id from tenants order by id limit 1`;
      if (!t) return ctx.skip();

      let row: { status: string; error: string | null } | undefined;
      await sql
        .begin(async (tx) => {
          await tx`set local role osmu_service`;
          await tx`select set_config('app.tenant_id', ${t.id}, true)`;
          await tx`
            insert into published_posts (tenant_id, platform, text, status, error)
            values (${t.id}, 'x', 'harness-fail', 'failed', 'X tweet 실패(401)')`;
          const r = await tx<{ status: string; error: string | null }[]>`
            select status, error from published_posts where text = 'harness-fail' limit 1`;
          row = r[0];
          throw new Error(ROLLBACK);
        })
        .catch((e: unknown) => {
          if (!(e instanceof Error) || e.message !== ROLLBACK) throw e;
        });

      expect(row?.status).toBe("failed");
      expect(row?.error).toMatch(/실패/);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
