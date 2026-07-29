import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupTestEnv, createTempDir, setupTestEnv } from "../helpers";

let tempDir: string;

function response(status: number, body: unknown, text = "") {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => body),
    text: vi.fn(async () => text),
  };
}

beforeEach(() => {
  tempDir = createTempDir();
  setupTestEnv(tempDir);
  fs.writeFileSync(
    path.join(tempDir, "openclaw.json"),
    JSON.stringify({
      plugins: {
        entries: {
          "telegram-publish": { config: { botToken: "TG_SECRET", chatId: "chat-1" } },
          "discord-publish": { config: { webhookUrl: "https://discord.example/webhook" } },
          "slack-publish": { config: { webhookUrl: "https://slack.example/webhook" } },
          "line-publish": { config: { channelAccessToken: "LINE_SECRET" } },
        },
      },
    }),
  );
  fs.writeFileSync(
    path.join(tempDir, "slack-config.json"),
    JSON.stringify({ webhookUrl: "https://slack.example/webhook" }),
  );
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanupTestEnv(tempDir);
});

describe("notification delivery fail-closed", () => {
  it("Telegram HTTP 200 with body ok:false is a failure and is logged as failed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(200, { ok: false, description: "chat not found" })));
    const { sendNotification } = await import("@/lib/send-notification");

    await expect(sendNotification("telegram", "hello")).resolves.toEqual(
      expect.objectContaining({ ok: false }),
    );
    const log = JSON.parse(fs.readFileSync(path.join(tempDir, "notification-log.json"), "utf8"));
    expect(log.at(-1)).toEqual(expect.objectContaining({ channel: "telegram", success: false }));
  });

  it("Telegram non-2xx is a failure even if the body says ok:true", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(500, { ok: true })));
    const { sendNotification } = await import("@/lib/send-notification");

    await expect(sendNotification("telegram", "hello")).resolves.toEqual(
      expect.objectContaining({ ok: false }),
    );
  });

  it.each(["discord", "slack", "line"])("%s non-2xx is a failure", async (channel) => {
    vi.stubGlobal("fetch", vi.fn(async () => response(503, {}, "unavailable")));
    const { sendNotification } = await import("@/lib/send-notification");

    await expect(sendNotification(channel, "hello")).resolves.toEqual(
      expect.objectContaining({ ok: false }),
    );
  });

  it("Slack test route returns failure when the webhook rejects the request", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(403, {}, "action_prohibited")));
    const { POST } = await import("@/app/api/slack-test/route");

    const res = await POST();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });

  it("Slack custom report route returns failure when webhook delivery is non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response(200, { report: "weekly report" }))
      .mockResolvedValueOnce(response(404, {}, "no_service")));
    const { POST } = await import("@/app/api/slack-send-custom/route");

    const res = await POST(new Request("http://localhost/api/slack-send-custom", { method: "POST" }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });
});
