import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

const H = vi.hoisted(() => ({
  tenantId: "11111111-1111-1111-1111-111111111111" as string | null,
  cred: { token: "tik-token", accountId: "22222222-2222-2222-2222-222222222222" } as { token: string; accountId: string } | null,
  creator: {
    username: "creator",
    nickname: "Creator",
    avatarUrl: "",
    privacyLevels: ["SELF_ONLY", "PUBLIC_TO_EVERYONE"],
    commentDisabled: false,
    duetDisabled: true,
    stitchDisabled: false,
    maxVideoDurationSec: 180,
  } as Record<string, unknown> | null,
  started: { ok: true, publishId: "pub-1" } as Record<string, unknown>,
  status: { status: "PUBLISH_COMPLETE", postId: "987" } as Record<string, unknown> | null,
  getCredCalls: [] as unknown[][],
  startCalls: [] as unknown[],
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => H.tenantId),
  AuthError: class AuthError extends Error {},
}));
vi.mock("@/lib/db", () => ({ withTenant: vi.fn() }));
vi.mock("@/lib/publish", () => ({
  getChannelCred: vi.fn(async (...args: unknown[]) => { H.getCredCalls.push(args); return H.cred; }),
  publishInstagramReels: vi.fn(),
}));
vi.mock("@/lib/tiktok", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/tiktok")>();
  return {
    ...actual,
    queryTikTokCreatorInfo: vi.fn(async () => H.creator),
    startTikTokVideoPost: vi.fn(async (input: unknown) => { H.startCalls.push(input); return H.started; }),
    fetchTikTokPostStatus: vi.fn(async () => H.status),
  };
});

let root: string;

async function publish(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/video/publish/route");
  const response = await POST(new Request("http://localhost/api/video/publish", {
    method: "POST",
    body: JSON.stringify(body),
  }));
  return { response, body: await response.json() as Record<string, unknown> };
}

describe("/api/video/publish — TikTok", () => {
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "osmu-tiktok-"));
    process.env.DATA_DIR = root;
    process.env.OSMU_PUBLIC_URL = "https://public.example.com";
    process.env.MEDIA_SIGNING_SECRET = "test-media-signing-secret-0123456789";
    const dir = path.join(root, "tenants", H.tenantId as string, "videos");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "clip.mp4"), Buffer.alloc(2048));
    H.cred = { token: "tik-token", accountId: "22222222-2222-2222-2222-222222222222" };
    H.creator = {
      username: "creator", nickname: "Creator", avatarUrl: "",
      privacyLevels: ["SELF_ONLY", "PUBLIC_TO_EVERYONE"],
      commentDisabled: false, duetDisabled: true, stitchDisabled: false, maxVideoDurationSec: 180,
    };
    H.started = { ok: true, publishId: "pub-1" };
    H.status = { status: "PUBLISH_COMPLETE", postId: "987" };
    H.getCredCalls = [];
    H.startCalls = [];
    vi.resetModules();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    delete process.env.DATA_DIR;
    delete process.env.OSMU_PUBLIC_URL;
    delete process.env.MEDIA_SIGNING_SECRET;
  });

  it("uses the selected account, creator options and a signed pull URL", async () => {
    const { response, body } = await publish({
      filename: "clip.mp4", platform: "tiktok", account_id: "33333333-3333-3333-3333-333333333333",
      title: "제목", description: "본문", privacy_level: "SELF_ONLY",
      disable_comment: false, disable_duet: false, disable_stitch: false, is_ai_generated: true,
    });
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, platform: "tiktok", videoId: "987" });
    expect(H.getCredCalls[0]).toEqual([H.tenantId, "tiktok", "33333333-3333-3333-3333-333333333333"]);
    expect(H.startCalls[0]).toMatchObject({
      accessToken: "tik-token", privacyLevel: "SELF_ONLY", disableDuet: true, isAiGenerated: true,
    });
    const videoUrl = String((H.startCalls[0] as { videoUrl: string }).videoUrl);
    expect(videoUrl).toMatch(/^https:\/\/public\.example\.com\/api\/media\//);
    expect(videoUrl).not.toContain("tik-token");
  });

  it("requires an explicit privacy choice before provider calls", async () => {
    const { response, body } = await publish({
      filename: "clip.mp4", platform: "tiktok",
      disable_comment: false, disable_duet: false, disable_stitch: false, is_ai_generated: true,
    });
    expect(response.status).toBe(400);
    expect(body.error).toContain("공개 범위");
    expect(H.startCalls).toHaveLength(0);
  });

  it("does not expose provider error details", async () => {
    H.started = { ok: false, reason: "access_token=secret-provider-detail" };
    const { response, body } = await publish({
      filename: "clip.mp4", platform: "tiktok", privacy_level: "SELF_ONLY",
      disable_comment: false, disable_duet: false, disable_stitch: false, is_ai_generated: false,
    });
    expect(response.status).toBe(502);
    expect(JSON.stringify(body)).not.toContain("secret-provider-detail");
  });
});
