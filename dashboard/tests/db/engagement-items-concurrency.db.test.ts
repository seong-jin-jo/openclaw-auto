import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { describe, expect, it, vi } from "vitest";
import { getDatabaseUrl } from "../isolation/_env";

type Sql = ReturnType<typeof postgres>;

async function connectRequired(ctx: { skip: () => void }): Promise<Sql | null> {
  const url = getDatabaseUrl();
  if (!url) {
    if (process.env.CI) throw new Error("CI requires DATABASE_URL for engagement state tests");
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

describe("BE-V63-10 댓글 상태 tenant 격리와 답글 경합", () => {
  it("BE-V63-10 경합 경로: 같은 댓글의 동시 답글 claim은 하나만 얻고 다른 tenant에는 보이지 않는다", async (ctx) => {
    const sql = await connectRequired(ctx);
    if (!sql) return;
    const tenantA = randomUUID();
    const tenantB = randomUUID();
    const postId = randomUUID();
    const marker = `engagement-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const previousUrl = process.env.DATABASE_URL;
    let appDb: { end: (options: { timeout: number }) => Promise<void> } | null = null;
    try {
      await sql`INSERT INTO tenants (id, slug, name, status, tier) VALUES
        (${tenantA}::uuid, ${`${marker}-a`}, 'Engagement A', 'active', 'team'),
        (${tenantB}::uuid, ${`${marker}-b`}, 'Engagement B', 'active', 'team')`;
      await sql`INSERT INTO published_posts (id, tenant_id, platform, external_id, status)
        VALUES (${postId}::uuid, ${tenantA}::uuid, 'threads', 'provider-post-1', 'published')`;
      process.env.DATABASE_URL = getDatabaseUrl()!;
      vi.resetModules();
      const { claimReply, listEngagementStates } = await import("@/lib/engagement-store");
      const [first, second] = await Promise.all([
        claimReply({ tenantId: tenantA, postId, platform: "threads", commentId: "comment-1", requestKey: "request-a1", text: "답글 하나" }),
        claimReply({ tenantId: tenantA, postId, platform: "threads", commentId: "comment-1", requestKey: "request-b2", text: "답글 둘" }),
      ]);
      expect([first.status, second.status].sort()).toEqual(["claimed", "conflict"]);
      expect(await listEngagementStates(tenantB, postId)).toEqual([]);
      const { db } = await import("@/lib/db");
      appDb = db();
    } finally {
      await sql`DELETE FROM tenants WHERE id IN (${tenantA}::uuid, ${tenantB}::uuid)`;
      if (appDb) await appDb.end({ timeout: 5 });
      await sql.end({ timeout: 5 });
      if (previousUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousUrl;
      vi.resetModules();
    }
  });

  it("C3-BE-V63-10 회수 경로: 만료된 답글 청구는 새 요청이 회수하고 살아 있는 청구는 거절한다", async (ctx) => {
    const sql = await connectRequired(ctx);
    if (!sql) return;
    const tenantId = randomUUID();
    const postId = randomUUID();
    const marker = `engagement-stale-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const previousUrl = process.env.DATABASE_URL;
    const previousLease = process.env.ENGAGEMENT_REPLY_CLAIM_STALE_AFTER_MS;
    let appDb: { end: (options: { timeout: number }) => Promise<void> } | null = null;
    try {
      await sql`INSERT INTO tenants (id, slug, name, status, tier)
        VALUES (${tenantId}::uuid, ${marker}, 'Engagement stale', 'active', 'team')`;
      await sql`INSERT INTO published_posts (id, tenant_id, platform, external_id, status)
        VALUES (${postId}::uuid, ${tenantId}::uuid, 'threads', 'provider-post-stale', 'published')`;
      process.env.DATABASE_URL = getDatabaseUrl()!;
      process.env.ENGAGEMENT_REPLY_CLAIM_STALE_AFTER_MS = "1000";
      vi.resetModules();
      const { claimReply } = await import("@/lib/engagement-store");
      const first = await claimReply({ tenantId, postId, platform: "threads", commentId: "comment-stale", requestKey: "request-old", text: "이전 답글" });
      const liveConflict = await claimReply({ tenantId, postId, platform: "threads", commentId: "comment-stale", requestKey: "request-live", text: "성급한 답글" });
      expect(first.status).toBe("claimed");
      expect(liveConflict.status).toBe("conflict");

      await sql`UPDATE engagement_items SET updated_at = now() - interval '2 seconds'
        WHERE tenant_id = ${tenantId} AND provider_comment_id = 'comment-stale'`;
      const recovered = await claimReply({ tenantId, postId, platform: "threads", commentId: "comment-stale", requestKey: "request-new", text: "회수 답글" });
      expect(recovered.status).toBe("claimed");
      expect(recovered.row?.reply_request_key).toBe("request-new");
      const { db } = await import("@/lib/db");
      appDb = db();
    } finally {
      await sql`DELETE FROM tenants WHERE id = ${tenantId}::uuid`;
      if (appDb) await appDb.end({ timeout: 5 });
      await sql.end({ timeout: 5 });
      if (previousUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousUrl;
      if (previousLease === undefined) delete process.env.ENGAGEMENT_REPLY_CLAIM_STALE_AFTER_MS;
      else process.env.ENGAGEMENT_REPLY_CLAIM_STALE_AFTER_MS = previousLease;
      vi.resetModules();
    }
  });
});
