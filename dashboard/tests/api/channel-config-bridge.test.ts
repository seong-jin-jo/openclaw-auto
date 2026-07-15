import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { createTempDir, setupTestEnv, cleanupTestEnv } from "../helpers";

// 수동 입력 키(Settings CredentialForm) → /api/channel-config/[channel] → integrations 브리지 검증.
// 대시보드 직접 발행(publish.ts getChannelCred)이 읽는 곳은 integrations 테이블이므로,
// 수동 키가 openclaw.json(게이트웨이)뿐 아니라 integrations에도 저장돼야 발행 경로가 안 끊긴다.

const H = vi.hoisted(() => ({
  inserts: [] as unknown[][],
  verify: { verified: true, account: "@ok" } as { verified: boolean; unverified?: boolean; account?: string; error?: string },
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_t: string, cb: (sql: unknown) => unknown) => {
    const sql = Object.assign(
      (_s: TemplateStringsArray, ...vals: unknown[]) => { H.inserts.push(vals); return Promise.resolve([]); },
      { json: (v: unknown) => v },
    );
    return cb(sql);
  }),
}));

vi.mock("@/lib/verify-channel", () => ({
  verifyChannel: vi.fn(async () => H.verify),
}));

let tmpDir: string;

function post(channel: string, body: Record<string, string>) {
  return new Request(`http://localhost/api/channel-config/${channel}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
const params = (channel: string) => ({ params: Promise.resolve({ channel }) });

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
  // 라우트는 runWithTenant(tenant-1) 안에서 configPath("openclaw.json")를 tenants/tenant-1/ 아래로
  // 격리해 읽는다 — 픽스처를 그 경로에 둔다.
  const src = path.resolve(__dirname, "../fixtures/openclaw.json");
  const dir = path.join(tmpDir, "tenants", "tenant-1");
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, path.join(dir, "openclaw.json"));
  H.inserts = [];
  H.verify = { verified: true, account: "@ok" };
  process.env.OSMU_SECRET_KEY = "enc-key";
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
  delete process.env.OSMU_SECRET_KEY;
});

describe("POST /api/channel-config/[channel] — integrations 브리지", () => {
  it("X 4키 저장 시 integrations에 meta로 브리지(publishX가 읽는 형태)", async () => {
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const res = await POST(post("x", {
      apiKey: "AK", apiKeySecret: "AKS", accessToken: "AT", accessTokenSecret: "ATS",
    }), params("x"));
    expect(res.status).toBe(200);
    expect(H.inserts).toHaveLength(1);
    const s = JSON.stringify(H.inserts[0]);
    expect(s).toContain("AK");
    expect(s).toContain("AKS");
    expect(s).toContain("AT");
    expect(s).toContain("ATS");
    expect(s).toContain("tenant-1");
  });

  it("facebook 수동 키 → integrations(secret=token, meta.userId=pageId)", async () => {
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const res = await POST(post("facebook", { accessToken: "PAGE_TOKEN", pageId: "990011" }), params("facebook"));
    expect(res.status).toBe(200);
    expect(H.inserts).toHaveLength(1);
    const s = JSON.stringify(H.inserts[0]);
    expect(s).toContain("PAGE_TOKEN");
    expect(s).toContain("990011");
    expect(s).toContain("facebook_graph");
  });

  it("threads 수동 키 → integrations 브리지", async () => {
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const res = await POST(post("threads", { accessToken: "TH_TOKEN", userId: "1234" }), params("threads"));
    expect(res.status).toBe(200);
    expect(H.inserts).toHaveLength(1);
    expect(JSON.stringify(H.inserts[0])).toContain("TH_TOKEN");
  });

  it("bluesky 수동 키 → integrations(secret=appPassword, meta.handle)", async () => {
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const res = await POST(post("bluesky", { handle: "user.bsky.social", appPassword: "abcd-efgh-ijkl-mnop" }), params("bluesky"));
    expect(res.status).toBe(200);
    expect(H.inserts).toHaveLength(1);
    const s = JSON.stringify(H.inserts[0]);
    expect(s).toContain("abcd-efgh-ijkl-mnop");
    expect(s).toContain("user.bsky.social");
    expect(s).toContain("bluesky_app_password");
  });

  it("telegram 수동 키 → integrations(secret=botToken, meta.chatId) — 2026-07 직접발행 편입", async () => {
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const res = await POST(post("telegram", { botToken: "BOT", chatId: "1" }), params("telegram"));
    expect(res.status).toBe(200);
    expect(H.inserts).toHaveLength(1);
    const s = JSON.stringify(H.inserts[0]);
    expect(s).toContain("BOT");
    expect(s).toContain("telegram_bot");
  });

  it("discord 수동 키(webhookUrl) → integrations(secret=webhookUrl)", async () => {
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const res = await POST(post("discord", { webhookUrl: "https://discord.com/api/webhooks/1/abc" }), params("discord"));
    expect(res.status).toBe(200);
    expect(H.inserts).toHaveLength(1);
    const s = JSON.stringify(H.inserts[0]);
    expect(s).toContain("discord.com/api/webhooks");
    expect(s).toContain("discord_webhook");
  });

  it("slack 수동 키(webhookUrl) → integrations(secret=webhookUrl)", async () => {
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const res = await POST(post("slack", { webhookUrl: "https://hooks.slack.com/services/T1/B1/xyz" }), params("slack"));
    expect(res.status).toBe(200);
    expect(H.inserts).toHaveLength(1);
    const s = JSON.stringify(H.inserts[0]);
    expect(s).toContain("hooks.slack.com");
    expect(s).toContain("slack_webhook");
  });

  it("직접발행 없는 채널(pinterest)은 integrations 브리지 안 함(게이트웨이 전용)", async () => {
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const res = await POST(post("pinterest", { accessToken: "PIN", boardId: "1" }), params("pinterest"));
    expect(res.status).toBe(200);
    expect(H.inserts).toHaveLength(0);
  });

  it("검증 실패(키 미저장) 시 브리지 안 함", async () => {
    H.verify = { verified: false, error: "bad" };
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const res = await POST(post("x", { apiKey: "AK", apiKeySecret: "AKS", accessToken: "AT", accessTokenSecret: "ATS" }), params("x"));
    expect(res.status).toBe(200);
    expect(H.inserts).toHaveLength(0);
  });

  it("unverified(네트워크 확인 실패지만 키 저장됨)면 브리지함", async () => {
    H.verify = { verified: false, unverified: true };
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const res = await POST(post("x", { apiKey: "AK", apiKeySecret: "AKS", accessToken: "AT", accessTokenSecret: "ATS" }), params("x"));
    expect(res.status).toBe(200);
    expect(H.inserts).toHaveLength(1);
  });
});
