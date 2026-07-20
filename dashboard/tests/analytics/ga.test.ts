import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ga.ts reads process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID + window/document at module load and
// call time. We stub a minimal window/document/localStorage (no jsdom dep in this package —
// matches the existing `environment: 'node'` vitest.config.ts) and use vi.resetModules() +
// dynamic import per test so each test gets a fresh module with its own env var value.

interface FakeWindow {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

function installFakeDom(): { win: FakeWindow; appended: HTMLElementStub[]; storage: Map<string, string> } {
  const appended: HTMLElementStub[] = [];
  const storage = new Map<string, string>();
  const win: FakeWindow = {};

  const fakeLocalStorage = {
    getItem: (k: string) => (storage.has(k) ? (storage.get(k) as string) : null),
    setItem: (k: string, v: string) => { storage.set(k, v); },
    removeItem: (k: string) => { storage.delete(k); },
  };

  const fakeDocument = {
    createElement: (_tag: string) => {
      const el: HTMLElementStub = { src: "", async: false };
      return el;
    },
    head: {
      appendChild: (el: HTMLElementStub) => { appended.push(el); },
    },
  };

  vi.stubGlobal("window", win);
  vi.stubGlobal("document", fakeDocument);
  vi.stubGlobal("localStorage", fakeLocalStorage);
  return { win, appended, storage };
}

interface HTMLElementStub {
  src: string;
  async: boolean;
}

async function loadGa(measurementId: string | undefined) {
  vi.resetModules();
  if (measurementId === undefined) {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  } else {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = measurementId;
  }
  return import("@/lib/analytics/ga");
}

describe("analytics/ga — consent-gated GA4 core", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  });

  it("missing measurement ID => gaEnabled=false, everything is a safe no-op", async () => {
    const { appended } = installFakeDom();
    const ga = await loadGa(undefined);
    expect(ga.gaEnabled).toBe(false);
    ga.initConsentDefaults();
    ga.setConsent("granted");
    ga.sendGaHit("cta_click", { cta_id: "x" });
    expect(appended.length).toBe(0); // no script tag
    expect(localStorage.getItem(ga.ANALYTICS_CONSENT_STORAGE_KEY)).toBeNull(); // no storage write
  });

  it("invalid measurement ID shape => gaEnabled=false", async () => {
    installFakeDom();
    const ga = await loadGa("not-a-valid-id");
    expect(ga.gaEnabled).toBe(false);
  });

  it("valid ID + pre-consent: no script tag, no gtag call, no localStorage write", async () => {
    const { win, appended } = installFakeDom();
    const ga = await loadGa("G-ABC1234567");
    expect(ga.gaEnabled).toBe(true);
    ga.initConsentDefaults(); // only sets consent defaults, must not load script or write storage
    expect(appended.length).toBe(0);
    expect(win.gtag).toBeTypeOf("function");
    expect(ga.getStoredConsent()).toBeNull();
    ga.sendGaHit("page_view", { page_path: "/" }); // no consent yet => must not send
  });

  it("reject: persists denied, still no script load, gtag stays no-op for hits", async () => {
    const { appended } = installFakeDom();
    const ga = await loadGa("G-ABC1234567");
    ga.initConsentDefaults();
    ga.setConsent("denied");
    expect(ga.getStoredConsent()).toBe("denied");
    expect(appended.length).toBe(0);
    expect(ga.hasAnalyticsConsent()).toBe(false);
  });

  it("accept: consent update fires (analytics granted, ad_* denied), then script loads", async () => {
    const { win, appended } = installFakeDom();
    const ga = await loadGa("G-ABC1234567");
    ga.initConsentDefaults();
    win.dataLayer = [];
    const pushed: unknown[][] = [];
    const originalPush = win.dataLayer.push.bind(win.dataLayer);
    win.dataLayer.push = (...args: unknown[]) => {
      pushed.push(Array.from(args[0] as ArrayLike<unknown>));
      return originalPush(...(args as never[]));
    };
    ga.setConsent("granted");
    expect(ga.getStoredConsent()).toBe("granted");
    expect(appended.length).toBe(1); // gtag.js script loaded exactly once
    expect(appended[0].src).toContain("googletagmanager.com/gtag/js?id=G-ABC1234567");
    const consentUpdateCall = pushed.find((args) => args[0] === "consent" && args[1] === "update");
    expect(consentUpdateCall?.[2]).toMatchObject({ analytics_storage: "granted" });
    expect(ga.hasAnalyticsConsent()).toBe(true);
  });

  it("accept does not reload the script twice across repeated setConsent('granted') calls", async () => {
    const { appended } = installFakeDom();
    const ga = await loadGa("G-ABC1234567");
    ga.initConsentDefaults();
    ga.setConsent("granted");
    ga.setConsent("granted");
    expect(appended.length).toBe(1);
  });

  it("bootstrapConsent(): a fresh visitor (no stored consent) gets denied defaults, no script load", async () => {
    const { appended } = installFakeDom();
    const ga = await loadGa("G-ABC1234567");
    ga.bootstrapConsent();
    expect(appended.length).toBe(0);
    expect(ga.getStoredConsent()).toBeNull();
  });

  it("bootstrapConsent(): persisted 'granted' consent from a prior session reloads gtag.js on this page load (Codex review #1)", async () => {
    const { appended } = installFakeDom();
    const ga = await loadGa("G-ABC1234567");
    // Simulate a returning visitor: consent was already granted+persisted in a prior session,
    // before this module (and its in-memory scriptLoadStarted flag) was ever loaded this time.
    localStorage.setItem(ga.ANALYTICS_CONSENT_STORAGE_KEY, "granted");
    ga.bootstrapConsent();
    expect(appended.length).toBe(1); // script actually loads on reload, not just consent defaults
    expect(appended[0].src).toContain("googletagmanager.com/gtag/js?id=G-ABC1234567");
    expect(ga.hasAnalyticsConsent()).toBe(true);
  });

  it("sendGaHit(): persisted consent lazily bootstraps before the first returning-visitor event", async () => {
    const { win, appended } = installFakeDom();
    const ga = await loadGa("G-ABC1234567");
    localStorage.setItem(ga.ANALYTICS_CONSENT_STORAGE_KEY, "granted");

    ga.sendGaHit("page_view", { page_path: "/login" });

    expect(appended).toHaveLength(1);
    const commands = win.dataLayer?.map((entry) => Array.from(entry as ArrayLike<unknown>));
    expect(commands?.map((entry) => entry[0])).toEqual([
      "consent", "consent", "js", "config", "event",
    ]);
    expect(commands?.[3]).toEqual(["config", "G-ABC1234567", { send_page_view: false }]);
    expect(commands?.[4]).toEqual(["event", "page_view", { page_path: "/login" }]);
    expect(Array.isArray(win.dataLayer?.[4])).toBe(false);

    ga.bootstrapConsent();
    expect(appended).toHaveLength(1);
    expect(win.dataLayer).toHaveLength(5);
  });

  it("bootstrapConsent(): persisted 'denied' consent stays denied, no script load", async () => {
    const { appended } = installFakeDom();
    const ga = await loadGa("G-ABC1234567");
    localStorage.setItem(ga.ANALYTICS_CONSENT_STORAGE_KEY, "denied");
    ga.bootstrapConsent();
    expect(appended.length).toBe(0);
    expect(ga.hasAnalyticsConsent()).toBe(false);
  });

  it("onConsentChange(): listener is notified with 'granted' and 'denied' as setConsent is called", async () => {
    installFakeDom();
    const ga = await loadGa("G-ABC1234567");
    ga.initConsentDefaults();
    const seen: string[] = [];
    const unsub = ga.onConsentChange((v: string) => seen.push(v));
    ga.setConsent("granted");
    ga.setConsent("denied");
    expect(seen).toEqual(["granted", "denied"]);
    unsub();
    ga.setConsent("granted");
    expect(seen).toEqual(["granted", "denied"]); // unsubscribed — no further notifications
  });

  it("sendGaHit only sends after consent granted", async () => {
    const { win } = installFakeDom();
    const ga = await loadGa("G-ABC1234567");
    ga.initConsentDefaults();
    const calls: unknown[][] = [];
    win.gtag = (...args: unknown[]) => calls.push(args);
    ga.sendGaHit("page_view", { page_path: "/x" });
    expect(calls.length).toBe(0);
    ga.setConsent("granted");
    win.gtag = (...args: unknown[]) => calls.push(args); // re-wrap after loadGtagScript overwrote gtag usage
    ga.sendGaHit("page_view", { page_path: "/x" });
    expect(calls.some((c) => c[0] === "event" && c[1] === "page_view")).toBe(true);
  });
});
