import { describe, it, expect, beforeEach, vi } from "vitest";

// SNS-007: POST /api/schedule가 account_ids(플랫폼→계정)를 받아 payload.account_ids로 저장하고,
// 단일 플랫폼 예약이면 schedules.account_id 컬럼에도 감사용으로 채우는지 검증.
// withTenant를 목으로 고정해 실제 INSERT 값 순서를 그대로 캡처한다.

const H = vi.hoisted(() => ({
  tenantId: "tenant-1" as string | null,
  insertValues: null as unknown[] | null,
  insertedPayload: null as Record<string, unknown> | null,
  validAccounts: new Set(["threads:acc-threads-1", "x:acc-x-1"]),
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => H.tenantId),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tid: string, cb: (sql: unknown) => unknown) => {
    const sql = Object.assign(
      (_s: TemplateStringsArray, ...vals: unknown[]) => {
        H.insertValues = vals;
        return Promise.resolve([{ id: "sched-1" }]);
      },
      { json: (v: Record<string, unknown>) => { H.insertedPayload = v; return v; } },
    );
    return cb(sql);
  }),
}));

vi.mock("@/lib/channel-accounts", () => ({
  channelAccountBelongsToProvider: vi.fn(async (_tenantId: string, provider: string, accountId: string) =>
    H.validAccounts.has(`${provider}:${accountId}`)),
}));

async function schedule(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/schedule/route");
  const res = await POST(
    new Request("http://localhost/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  H.tenantId = "tenant-1";
  H.insertValues = null;
  H.insertedPayload = null;
  H.validAccounts = new Set(["threads:acc-threads-1", "x:acc-x-1"]);
});

function future(): string {
  return new Date(Date.now() + 3600000).toISOString();
}

describe("POST /api/schedule — SNS-007 account_ids", () => {
  it("단일 플랫폼 + account_ids → payload.account_ids 저장 + schedules.account_id 컬럼도 채움", async () => {
    const { status, body } = await schedule({
      platforms: ["threads"],
      scheduled_at: future(),
      account_ids: { threads: "acc-threads-1" },
    });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(H.insertedPayload?.account_ids).toEqual({ threads: "acc-threads-1" });
    // INSERT INTO schedules (tenant_id, draft_id, platforms, scheduled_at, status, payload, account_id)
    // account_id는 마지막 바인딩 값(단일 플랫폼이라 acc-threads-1로 채워짐)
    expect(H.insertValues?.[H.insertValues.length - 1]).toBe("acc-threads-1");
  });

  it("다중 플랫폼 + account_ids → payload에는 전체 맵 저장되지만 schedules.account_id 컬럼은 null(플랫폼마다 다를 수 있어 단일컬럼 표현 불가)", async () => {
    const { status } = await schedule({
      platforms: ["threads", "x"],
      scheduled_at: future(),
      account_ids: { threads: "acc-threads-1", x: "acc-x-1" },
    });
    expect(status).toBe(200);
    expect(H.insertedPayload?.account_ids).toEqual({ threads: "acc-threads-1", x: "acc-x-1" });
    expect(H.insertValues?.[H.insertValues.length - 1]).toBeNull();
  });

  it("account_ids 미지정 → payload에 account_ids 키 자체가 없고, account_id 컬럼 null(기본계정 경로)", async () => {
    const { status } = await schedule({ platforms: ["threads"], scheduled_at: future() });
    expect(status).toBe(200);
    expect(H.insertedPayload?.account_ids).toBeUndefined();
    expect(H.insertValues?.[H.insertValues.length - 1]).toBeNull();
  });

  it("다른 provider 계정 id는 저장 전에 400으로 거부한다", async () => {
    const { status } = await schedule({
      platforms: ["threads"],
      scheduled_at: future(),
      account_ids: { threads: "acc-x-1" },
    });
    expect(status).toBe(400);
    expect(H.insertValues).toBeNull();
  });

  it("예약 플랫폼에 없는 account_ids 키는 400으로 거부한다", async () => {
    const { status } = await schedule({
      platforms: ["threads"],
      scheduled_at: future(),
      account_ids: { x: "acc-x-1" },
    });
    expect(status).toBe(400);
    expect(H.insertValues).toBeNull();
  });
});
