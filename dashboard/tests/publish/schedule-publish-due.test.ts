import { describe, it, expect, beforeEach, vi } from "vitest";
import { withTenant } from "@/lib/db";
import { getChannelCred, publishThreads, publishX } from "@/lib/publish";

const H = vi.hoisted(() => ({
  tenantId: "tenant-1" as string | null,
  rows: [] as Array<{
    id: string;
    draft_id: string | null;
    platforms: string[] | null;
    payload: Record<string, unknown> | null;
    draft_payload: Record<string, unknown> | null;
  }>,
  inserts: [] as unknown[][],
  updates: [] as unknown[][],
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => H.tenantId),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, cb: (sql: unknown) => unknown) => {
    const sql = Object.assign(
      (strings: TemplateStringsArray, ...vals: unknown[]) => {
        const text = strings.join("?");
        if (/WITH\s+due\s+AS/i.test(text)) return Promise.resolve(H.rows);
        if (/INSERT\s+INTO\s+published_posts/i.test(text)) {
          H.inserts.push(vals);
          return Promise.resolve([]);
        }
        if (/UPDATE\s+schedules\s+SET\s+status/i.test(text)) {
          H.updates.push(vals);
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      },
      { json: (value: unknown) => value },
    );
    return cb(sql);
  }),
}));

vi.mock("@/lib/publish", () => ({
  getChannelCred: vi.fn(async () => ({ token: "tok", userId: "u-1" })),
  publishThreads: vi.fn(async () => ({ ok: true, externalId: "th-1", permalink: "https://threads/1" })),
  publishX: vi.fn(async () => ({ ok: true, externalId: "tw-1", permalink: "https://x/1" })),
  publishInstagram: vi.fn(async () => ({ ok: true, externalId: "ig-1" })),
  publishFacebook: vi.fn(async () => ({ ok: true, externalId: "fb-1" })),
}));

async function publishDue(body: Record<string, unknown> = {}) {
  const { POST } = await import("@/app/api/schedule/publish-due/route");
  const res = await POST(
    new Request("http://localhost/api/schedule/publish-due", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  vi.resetModules();
  H.tenantId = "tenant-1";
  H.rows = [];
  H.inserts = [];
  H.updates = [];
});

describe("POST /api/schedule/publish-due — 예약 실발행 루프", () => {
  it("테넌트 해석 불가 → 400, DB 접근 없음", async () => {
    H.tenantId = null;
    const { status, body } = await publishDue();
    expect(status).toBe(400);
    expect(body.error).toMatch(/tenant_id/);
    expect(withTenant).not.toHaveBeenCalled();
  });

  it("due schedule 없음 → processed=0", async () => {
    const { status, body } = await publishDue({ tenant_id: "tenant-1" });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(0);
    expect(H.inserts).toHaveLength(0);
    expect(H.updates).toHaveLength(0);
  });

  it("due schedule을 claim하고 플랫폼별 발행/기록 후 published로 닫는다", async () => {
    H.rows = [
      {
        id: "sched-1",
        draft_id: "draft-1",
        platforms: ["threads", "x"],
        payload: null,
        draft_payload: {
          text: { threads: "threads body", x: "x body" },
          img: { url: "https://cdn/image.png" },
        },
      },
    ];

    const { status, body } = await publishDue({ tenant_id: "tenant-1", limit: 10 });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(1);
    expect(body.schedules[0].status).toBe("published");
    expect(getChannelCred).toHaveBeenCalledTimes(2);
    expect(publishThreads).toHaveBeenCalledWith({ token: "tok", userId: "u-1" }, "threads body", "https://cdn/image.png");
    expect(publishX).toHaveBeenCalledWith({ token: "tok", userId: "u-1" }, "x body");
    expect(H.inserts).toHaveLength(2);
    expect(H.updates).toHaveLength(1);
    expect(H.updates[0]).toContain("published");
  });

  it("일부 플랫폼 실패 시 published_posts에 실패 기록을 남기고 partial로 닫는다", async () => {
    H.rows = [
      {
        id: "sched-2",
        draft_id: "draft-2",
        platforms: ["threads", "myspace"],
        payload: { text: "shared body" },
        draft_payload: null,
      },
    ];

    const { body } = await publishDue({ tenant_id: "tenant-1" });

    expect(body.schedules[0].status).toBe("partial");
    expect(H.inserts).toHaveLength(2);
    expect(H.updates[0]).toContain("partial");
  });
});
