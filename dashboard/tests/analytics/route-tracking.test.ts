import { afterEach, describe, expect, it, vi } from "vitest";

// RouteTracker itself is a "use client" component that calls next/navigation's usePathname —
// mounting it needs jsdom + React Testing Library, neither of which this package has installed
// (vitest.config.ts uses environment: 'node'; see tests/setup.ts for the existing convention of
// testing at the module/logic boundary rather than full DOM mounts). We instead unit-test the
// exact dedupe + consent-gating + consent-change-subscription logic RouteTracker relies on,
// mirrored 1:1 from src/components/shared/RouteTracker.tsx.

const sendGaHitMock = vi.fn();
let consentGranted = false;
type Listener = (v: "granted" | "denied") => void;
let listeners: Listener[] = [];

vi.mock("@/lib/analytics/ga", () => ({
  sendGaHit: (...args: unknown[]) => sendGaHitMock(...args),
  hasAnalyticsConsent: () => consentGranted,
  onConsentChange: (fn: Listener) => {
    listeners.push(fn);
    return () => { listeners = listeners.filter((l) => l !== fn); };
  },
}));

function emitConsentChange(value: "granted" | "denied") {
  listeners.forEach((fn) => fn(value));
}

// Mirrors RouteTracker.tsx 1:1: navigation effect + consent-change subscription sharing one
// `lastSent` dedupe ref, normalized via the real normalizePagePath() (imported for real — only
// ga.ts is mocked, events.ts runs its actual normalization/validation logic).
function makeTracker() {
  const lastSent = { current: null as string | null };
  let currentPath: string | null = null;

  async function fireCurrentPage() {
    const { normalizePagePath, trackEvent } = await import("@/lib/analytics/events");
    if (!currentPath) return;
    const normalized = normalizePagePath(currentPath);
    if (normalized === lastSent.current) return;
    lastSent.current = normalized;
    trackEvent({ name: "page_view", params: { page_path: normalized as never } });
  }

  return {
    async navigate(path: string) {
      currentPath = path;
      if (!consentGranted) return;
      await fireCurrentPage();
    },
    async triggerConsentChange(value: "granted" | "denied") {
      if (value === "granted") {
        await fireCurrentPage();
      } else {
        lastSent.current = null;
      }
    },
    lastSent,
  };
}

describe("route-change page_view — dedupe + consent gating + consent-change firing", () => {
  afterEach(() => {
    sendGaHitMock.mockClear();
    consentGranted = false;
    listeners = [];
  });

  it("fires zero page_view calls pre-consent", async () => {
    const t = makeTracker();
    consentGranted = false;
    await t.navigate("/blog");
    await t.navigate("/settings");
    expect(sendGaHitMock).not.toHaveBeenCalled();
  });

  it("fires exactly one page_view per distinct navigation post-consent", async () => {
    const t = makeTracker();
    consentGranted = true;
    await t.navigate("/blog");
    await t.navigate("/settings");
    expect(sendGaHitMock).toHaveBeenCalledTimes(2);
    expect(sendGaHitMock).toHaveBeenNthCalledWith(1, "page_view", { page_path: "/blog" });
    expect(sendGaHitMock).toHaveBeenNthCalledWith(2, "page_view", { page_path: "/settings" });
  });

  it("does not double-fire on the same path (React 18 StrictMode dev double-invoke of effects)", async () => {
    const t = makeTracker();
    consentGranted = true;
    await t.navigate("/blog");
    await t.navigate("/blog"); // StrictMode-style re-run, same path
    expect(sendGaHitMock).toHaveBeenCalledTimes(1);
  });

  it("Codex review #2: consent granted WITHOUT a navigation still fires the current page exactly once", async () => {
    const t = makeTracker();
    consentGranted = false;
    await t.navigate("/studio"); // user lands on /studio pre-consent — no fire yet
    expect(sendGaHitMock).not.toHaveBeenCalled();
    consentGranted = true;
    await t.triggerConsentChange("granted"); // banner accept click, no route change
    expect(sendGaHitMock).toHaveBeenCalledTimes(1);
    expect(sendGaHitMock).toHaveBeenCalledWith("page_view", { page_path: "/studio" });
  });

  it("grant-triggered fire and a same-path navigation effect never double-count (shared dedupe ref)", async () => {
    const t = makeTracker();
    consentGranted = true;
    await t.navigate("/studio"); // pathname already known when consent flips (realistic mount order)
    await t.triggerConsentChange("granted"); // bootstrapConsent() re-grant on reload, same page
    expect(sendGaHitMock).toHaveBeenCalledTimes(1); // dedupe ref prevents the second source from re-firing
  });

  it("revoke resets the dedupe guard so a later re-grant re-fires the current page", async () => {
    const t = makeTracker();
    consentGranted = true;
    await t.navigate("/studio");
    expect(sendGaHitMock).toHaveBeenCalledTimes(1);
    consentGranted = false;
    await t.triggerConsentChange("denied"); // user revokes via "개인정보 설정"
    consentGranted = true;
    await t.triggerConsentChange("granted"); // user re-grants later, still on /studio
    expect(sendGaHitMock).toHaveBeenCalledTimes(2);
    expect(sendGaHitMock).toHaveBeenNthCalledWith(2, "page_view", { page_path: "/studio" });
  });
});
