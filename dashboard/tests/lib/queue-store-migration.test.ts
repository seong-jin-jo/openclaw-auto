import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupTestEnv, createTempDir, setupTestEnv } from "../helpers";

const TENANT = "11111111-1111-1111-1111-111111111111";
const FIRST = "22222222-2222-2222-2222-222222222222";
const SECOND = "33333333-3333-3333-3333-333333333333";
const H = vi.hoisted(() => ({
  queries: [] as string[],
  fail: false,
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, callback: (sql: unknown) => unknown) => {
    if (H.fail) throw new Error("database offline");
    const sql = Object.assign(
      (strings: TemplateStringsArray, ...values: unknown[]) => {
        const query = Array.from(strings).join(" ").replace(/\s+/g, " ").trim();
        H.queries.push(query);
        const id = String(values[0]);
        return Promise.resolve(id === SECOND ? [] : [{ id }]);
      },
      { json: (value: unknown) => value },
    );
    return callback(sql);
  }),
}));

let tempDir: string;

beforeEach(() => {
  vi.resetModules();
  H.queries = [];
  H.fail = false;
  tempDir = createTempDir();
  setupTestEnv(tempDir);
  fs.writeFileSync(path.join(tempDir, "queue.json"), JSON.stringify({
    posts: [
      { id: FIRST, text: "첫 글", status: "draft", generatedAt: "2026-08-12T00:00:00Z" },
      { id: SECOND, text: "기존 글", status: "approved" },
      { id: "legacy-not-uuid", text: "건너뜀" },
    ],
  }));
});

afterEach(() => cleanupTestEnv(tempDir));

describe("queue.json에서 queue_posts로 안전 백필", () => {
  it("한 트랜잭션에서 ON CONFLICT DO NOTHING으로 멱등 백필하고 결과를 정확히 센다", async () => {
    const { backfillQueueToDb } = await import("@/lib/queue-store");
    await expect(backfillQueueToDb(TENANT)).resolves.toEqual({
      total: 3,
      mirrored: 1,
      alreadyPresent: 1,
      skipped: 1,
    });
    expect(H.queries).toHaveLength(2);
    expect(H.queries.every((query) => query.includes("ON CONFLICT (id) DO NOTHING"))).toBe(true);
  });

  it("DB 실패를 성공 건수로 삼키지 않고 호출자에게 전달한다", async () => {
    H.fail = true;
    const { backfillQueueToDb } = await import("@/lib/queue-store");
    await expect(backfillQueueToDb(TENANT)).rejects.toThrow("database offline");
  });
});
