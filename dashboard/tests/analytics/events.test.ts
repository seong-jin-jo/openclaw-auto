import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Tests the closed event allowlist + runtime redaction (defense in depth even if TS types are
// bypassed). We mock the underlying ga.ts send function and assert what actually reaches it —
// per task spec: "test at the boundary you control (mock the underlying gtag/send fn)".

const sendGaHitMock = vi.fn();

vi.mock("@/lib/analytics/ga", () => ({
  sendGaHit: (...args: unknown[]) => sendGaHitMock(...args),
  hasAnalyticsConsent: () => true,
}));

describe("analytics/events — typed allowlist + redaction boundary", () => {
  beforeEach(() => {
    sendGaHitMock.mockClear();
  });

  it("sends only allowlisted keys for a well-formed event", async () => {
    const { trackEvent } = await import("@/lib/analytics/events");
    trackEvent({ name: "cta_click", params: { cta_id: "generate_ideas" } });
    expect(sendGaHitMock).toHaveBeenCalledWith("cta_click", { cta_id: "generate_ideas" });
  });

  it("strips forbidden extra keys even if the caller bypasses TS (as any)", async () => {
    const { __internal } = await import("@/lib/analytics/events");
    const forbidden = {
      cta_id: "safe_slug",
      email: "user@example.com",
      user_id: "abc123",
      tenant_id: "tenant-9",
      token: "secret-token-value",
      password: "hunter2",
      prompt: "raw generated content text",
      stack: "Error: boom\n at foo.js:1:1",
      error_message: "Detailed internal error with a stack trace",
    };
    const out = __internal.redactParams("cta_click", forbidden as unknown as Record<string, unknown>);
    expect(out).toEqual({ cta_id: "safe_slug" });
    expect(out).not.toHaveProperty("email");
    expect(out).not.toHaveProperty("token");
    expect(out).not.toHaveProperty("password");
    expect(out).not.toHaveProperty("prompt");
    expect(out).not.toHaveProperty("stack");
  });

  it("drops a value that itself contains an email even under an allowlisted key", async () => {
    const { __internal } = await import("@/lib/analytics/events");
    const out = __internal.redactParams("login", { method: "user@example.com" } as unknown as Record<string, unknown>);
    expect(out).not.toHaveProperty("method");
  });

  it("strips query strings from URL-shaped values (may carry tokens/codes)", async () => {
    const { __internal } = await import("@/lib/analytics/events");
    const out = __internal.redactParams("cta_click", {
      cta_id: "https://example.com/callback?token=abc123&code=xyz",
    } as unknown as Record<string, unknown>);
    expect(out.cta_id).toBe("https://example.com/callback");
    expect(out.cta_id).not.toContain("token");
  });

  it("truncates overly long free-text values", async () => {
    const { __internal } = await import("@/lib/analytics/events");
    const longText = "x".repeat(500);
    const out = __internal.redactParams("content_generate", { kind: longText } as unknown as Record<string, unknown>);
    expect(out.kind.length).toBeLessThanOrEqual(100);
  });

  it("drops a raw error object spread into an event (non-string/number/boolean values rejected)", async () => {
    const { __internal } = await import("@/lib/analytics/events");
    const err = new Error("something broke");
    const out = __internal.redactParams("publish_attempt", {
      channel: "threads",
      error: err, // not in allowlist AND not a primitive
    } as unknown as Record<string, unknown>);
    expect(out).toEqual({ channel: "threads" });
  });

  it("Codex review #3: an unknown/arbitrary event name is dropped completely — zero calls reach sendGaHit", async () => {
    const { trackEvent } = await import("@/lib/analytics/events");
    const malicious = {
      name: "delete_all_data", // not a member of AnalyticsEvent["name"]
      params: { anything: "goes" },
    } as unknown as Parameters<typeof trackEvent>[0];
    trackEvent(malicious);
    expect(sendGaHitMock).not.toHaveBeenCalled();
  });

  it("Codex review #3: arbitrary cta_id (not in the closed enum) is dropped completely", async () => {
    const { trackEvent } = await import("@/lib/analytics/events");
    trackEvent({
      name: "cta_click",
      params: { cta_id: "javascript:alert(1)//" },
    } as unknown as Parameters<typeof trackEvent>[0]);
    expect(sendGaHitMock).not.toHaveBeenCalled();
  });

  it("Codex review #3: arbitrary content_generate kind (100-char free text) is dropped completely, not truncated-and-sent", async () => {
    const { trackEvent } = await import("@/lib/analytics/events");
    trackEvent({
      name: "content_generate",
      params: { kind: "x".repeat(100) },
    } as unknown as Parameters<typeof trackEvent>[0]);
    expect(sendGaHitMock).not.toHaveBeenCalled();
  });

  it("Codex review #3: arbitrary/malicious-unicode channel value is dropped completely", async () => {
    const { trackEvent } = await import("@/lib/analytics/events");
    trackEvent({
      name: "publish_attempt",
      params: { channel: "threads\u202e\u0000<script>alert(1)</script>" },
    } as unknown as Parameters<typeof trackEvent>[0]);
    expect(sendGaHitMock).not.toHaveBeenCalled();
  });

  it("Codex review #3: a secret-looking cta_id string is still dropped (not a closed enum member)", async () => {
    const { trackEvent } = await import("@/lib/analytics/events");
    trackEvent({
      name: "cta_click",
      params: { cta_id: "sk-live-4242424242424242abcdefgh" },
    } as unknown as Parameters<typeof trackEvent>[0]);
    expect(sendGaHitMock).not.toHaveBeenCalled();
  });

  it("well-formed closed-enum events still pass through for every event type", async () => {
    const { trackEvent } = await import("@/lib/analytics/events");
    trackEvent({ name: "sign_up", params: { method: "oauth" } });
    trackEvent({ name: "login", params: { method: "email" } });
    trackEvent({ name: "content_generate", params: { kind: "image" } });
    trackEvent({ name: "publish_attempt", params: { channel: "x" } });
    trackEvent({ name: "publish_success", params: { channel: "instagram" } });
    expect(sendGaHitMock).toHaveBeenCalledTimes(5);
    expect(sendGaHitMock).toHaveBeenNthCalledWith(1, "sign_up", { method: "oauth" });
    expect(sendGaHitMock).toHaveBeenNthCalledWith(5, "publish_success", { channel: "instagram" });
  });

  it("trackEvent() end-to-end applies redaction before calling sendGaHit", async () => {
    const { trackEvent } = await import("@/lib/analytics/events");
    // Deliberately bypass the closed type (`as any`) to prove runtime redaction still holds
    // even if a caller works around the TypeScript compile-time guard.
    const bypassed = {
      name: "publish_success",
      params: { channel: "threads", tenant_id: "should-not-leak" },
    } as unknown as Parameters<typeof trackEvent>[0];
    trackEvent(bypassed);
    expect(sendGaHitMock).toHaveBeenCalledWith("publish_success", { channel: "threads" });
  });
});

describe("normalizePagePath — finite route-template allowlist, never forwards raw path text", () => {
  it("passes through exact known static routes unchanged", async () => {
    const { normalizePagePath } = await import("@/lib/analytics/events");
    expect(normalizePagePath("/")).toBe("/");
    expect(normalizePagePath("/studio")).toBe("/studio");
    expect(normalizePagePath("/settings")).toBe("/settings");
    expect(normalizePagePath("/operator/customers")).toBe("/operator/customers");
  });

  it("collapses the one known dynamic route to its template, never the raw channel value", async () => {
    const { normalizePagePath } = await import("@/lib/analytics/events");
    expect(normalizePagePath("/channels/threads")).toBe("/channels/:channel");
    expect(normalizePagePath("/channels/anything-at-all")).toBe("/channels/:channel");
  });

  it("strips query strings and hashes before matching (may carry tokens/codes)", async () => {
    const { normalizePagePath } = await import("@/lib/analytics/events");
    expect(normalizePagePath("/studio?draft_id=abc&token=secret")).toBe("/studio");
    expect(normalizePagePath("/settings#section=danger")).toBe("/settings");
  });

  it("Codex review #3: an unknown/dynamic path maps to /other, never forwarding raw text", async () => {
    const { normalizePagePath } = await import("@/lib/analytics/events");
    expect(normalizePagePath("/reset-password/abc123token")).toBe("/other");
    expect(normalizePagePath("/users/user@example.com")).toBe("/other");
  });

  it("Codex review #3: malicious unicode / secret-like / arbitrary path text maps to /other", async () => {
    const { normalizePagePath } = await import("@/lib/analytics/events");
    expect(normalizePagePath("/‮gnp.exe/etc/passwd")).toBe("/other");
    expect(normalizePagePath("/api/internal?key=sk-live-4242424242424242")).toBe("/other");
    expect(normalizePagePath("/<script>alert(1)</script>")).toBe("/other");
  });

  it("end-to-end via trackEvent: page_view for a malicious/unknown path still only ever sends /other", async () => {
    const { trackEvent } = await import("@/lib/analytics/events");
    trackEvent({
      name: "page_view",
      params: { page_path: "/users/leaked@example.com?token=abc" as never },
    });
    expect(sendGaHitMock).toHaveBeenCalledWith("page_view", { page_path: "/other" });
  });
});
