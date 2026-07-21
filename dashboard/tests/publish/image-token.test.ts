import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { signImageToken, verifyImageToken, imageSigningConfigured, refreshImageDeliveryUrl } from "@/lib/image-token";
import { signMediaToken, verifyMediaToken } from "@/lib/media-token";

// SNS-016: 서명 이미지 배달 토큰 — 만료·변조·purpose 분리(영상 토큰과 교차 재생 불가) 계약.
const SECRET = "test-media-signing-secret-0123456789";

describe("image-token", () => {
  beforeEach(() => {
    process.env.MEDIA_SIGNING_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.MEDIA_SIGNING_SECRET;
    vi.restoreAllMocks();
  });

  it("서명 후 검증하면 같은 테넌트/파일명을 돌려준다", () => {
    const t = signImageToken("tenantA", "photo.png")!;
    expect(t).toBeTruthy();
    expect(verifyImageToken(t)).toMatchObject({ tenantId: "tenantA", filename: "photo.png" });
  });

  it("만료된 토큰은 거부한다", () => {
    const t = signImageToken("tenantA", "photo.png", 1000, 1_000_000)!;
    expect(verifyImageToken(t, 1_000_500)).not.toBeNull();
    expect(verifyImageToken(t, 1_002_000)).toBeNull();
  });

  it("변조된 payload/서명은 거부한다", () => {
    const t = signImageToken("tenantA", "photo.png")!;
    const [body, sig] = t.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ v: 1, t: "tenantB", f: "photo.png", e: Date.now() + 60000 }))
      .toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(verifyImageToken(`${forgedBody}.${sig}`)).toBeNull();
    expect(verifyImageToken(`${body}.${sig.slice(0, -2)}AA`)).toBeNull();
    expect(verifyImageToken(body)).toBeNull();
  });

  it("경로 traversal 파일명과 불량 테넌트는 서명 자체를 거부한다", () => {
    expect(signImageToken("tenantA", "../../etc/passwd")).toBeNull();
    expect(signImageToken("tenantA", "a/b.png")).toBeNull();
    expect(signImageToken("../x", "photo.png")).toBeNull();
  });

  it("비밀 미설정이면 서명 불가", () => {
    delete process.env.MEDIA_SIGNING_SECRET;
    const prev = process.env.DASHBOARD_AUTH_TOKEN;
    delete process.env.DASHBOARD_AUTH_TOKEN;
    expect(imageSigningConfigured()).toBe(false);
    expect(signImageToken("tenantA", "photo.png")).toBeNull();
    if (prev !== undefined) process.env.DASHBOARD_AUTH_TOKEN = prev;
  });

  it("purpose 분리: 영상 토큰(media-token)은 이미지 검증기를 통과하지 못하고, 그 반대도 마찬가지다", () => {
    const videoToken = signMediaToken("tenantA", "clip.mp4")!;
    expect(videoToken).toBeTruthy();
    expect(verifyImageToken(videoToken)).toBeNull();

    const imageToken = signImageToken("tenantA", "photo.png")!;
    expect(imageToken).toBeTruthy();
    expect(verifyMediaToken(imageToken)).toBeNull();
  });

  it("만료된 자사 이미지 URL도 같은 테넌트만 발행 직전에 새 URL로 갱신한다", () => {
    process.env.OSMU_PUBLIC_URL = "https://new.example.com";
    const expired = signImageToken("tenantA", "photo.png", 1000, 1)!;
    const oldUrl = `https://old.example.com/api/images/deliver/${expired}`;

    const refreshed = refreshImageDeliveryUrl("tenantA", oldUrl);
    expect(refreshed).toMatch(/^https:\/\/new\.example\.com\/api\/images\/deliver\//);
    const renewedToken = refreshed!.split("/api/images/deliver/")[1];
    expect(verifyImageToken(renewedToken)).toMatchObject({ tenantId: "tenantA", filename: "photo.png" });
    expect(refreshImageDeliveryUrl("tenantB", oldUrl)).toBeNull();
    delete process.env.OSMU_PUBLIC_URL;
  });

  it("외부 HTTPS 이미지는 그대로 두고 자사 형식의 위조 토큰은 거부한다", () => {
    process.env.OSMU_PUBLIC_URL = "https://app.example.com";
    expect(refreshImageDeliveryUrl("tenantA", "https://cdn.example.com/photo.png")).toBe("https://cdn.example.com/photo.png");
    expect(refreshImageDeliveryUrl("tenantA", "https://app.example.com/api/images/deliver/forged.token")).toBeNull();
    expect(refreshImageDeliveryUrl("tenantA", "http://app.example.com/photo.png")).toBeNull();
    delete process.env.OSMU_PUBLIC_URL;
  });
});
