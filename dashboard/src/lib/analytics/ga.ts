"use client";

// GA4 client tracking core — consent-gated, no-op-safe.
//
// Design decisions (see final report for cited official docs):
// - Consent Mode v2: gtag('consent','default',{...denied}) is called on mount BEFORE any
//   possible 'update'/script load — https://developers.google.com/tag-platform/security/guides/consent
//   "The order of the code here is vital. If your consent code is called out of order,
//   consent defaults won't work." We never load gtag.js at all until the user grants.
// - ad_storage / ad_user_data / ad_personalization always stay 'denied' — this product does
//   not run ads. Only analytics_storage flips to 'granted' on accept.
// - Manual page_view only: `config` is sent with send_page_view:false and we fire a single
//   manual `page_view` event per route change (see RouteTracker). This avoids the SPA
//   double-count risk called out in the GA4 SPA guidance
//   (https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
//   from GA4's own history-based auto-detection firing alongside a manual call.
// - Missing/invalid NEXT_PUBLIC_GA_MEASUREMENT_ID => gaEnabled=false => every exported
//   function becomes a safe no-op. No script tag, no network call, no localStorage write.

export const ANALYTICS_CONSENT_STORAGE_KEY = "osmu_analytics_consent";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// GA4 measurement IDs are always canonical uppercase "G-XXXXXXXXXX" — no case-insensitive
// matching (Codex review 2026-07-14: accepting lowercase "g-..." isn't a real GA4 ID shape).
function isValidMeasurementId(id: string | undefined): id is string {
  return !!id && /^G-[A-Z0-9]{6,}$/.test(id);
}

export const gaEnabled = isValidMeasurementId(GA_MEASUREMENT_ID);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function rawGtag() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // Google gtag.js recognizes command entries by the native Arguments shape used in its
  // official snippet. A plain rest-parameter Array is retained in dataLayer but not executed.
  window.dataLayer.push(arguments);
}

let scriptLoadStarted = false;
let bootstrapStarted = false;

/** Sets Consent Mode v2 defaults to fully denied. Safe to call multiple times. No-op if disabled. */
export function initConsentDefaults() {
  if (!gaEnabled || typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || rawGtag;
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
}

function loadGtagScript() {
  if (!gaEnabled || scriptLoadStarted || typeof document === "undefined") return;
  scriptLoadStarted = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  window.gtag?.("js", new Date());
  // send_page_view:false — page_view는 RouteTracker가 수동 단발 발행(위 설계결정 참고).
  window.gtag?.("config", GA_MEASUREMENT_ID, { send_page_view: false });
}

export type ConsentValue = "granted" | "denied";

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

// Consent-change pub/sub — lets RouteTracker (and any future consumer) react to a grant/revoke
// the instant it happens, instead of only on the next route navigation. Fixes Codex review
// 2026-07-14 #2: accepting consent previously only took effect on the *next* navigation.
type ConsentListener = (value: ConsentValue) => void;
const consentListeners = new Set<ConsentListener>();

export function onConsentChange(fn: ConsentListener): () => void {
  consentListeners.add(fn);
  return () => consentListeners.delete(fn);
}

/** Persist consent choice and (if granted) load gtag.js + fire consent update. No-op if disabled. */
export function setConsent(value: ConsentValue) {
  if (!gaEnabled || typeof window === "undefined") return;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
  } catch {
    /* ignore storage failures (private mode etc.) */
  }
  if (value === "granted") {
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    loadGtagScript();
  } else {
    window.gtag?.("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
  consentListeners.forEach((fn) => fn(value));
}

export function hasAnalyticsConsent(): boolean {
  return gaEnabled && getStoredConsent() === "granted";
}

/**
 * Call once on app mount (ConsentBanner does this). Sets Consent Mode v2 defaults to denied
 * FIRST (required ordering per official docs — see file header), then, if the user already
 * granted consent in a prior session, re-affirms the grant so gtag.js actually loads on this
 * reload too. Fixes Codex review 2026-07-14 #1: previously a reload only replayed the *denied*
 * defaults and never reloaded the script for a returning consenting user.
 */
export function bootstrapConsent() {
  if (!gaEnabled || typeof window === "undefined") return;
  if (bootstrapStarted) return;
  bootstrapStarted = true;
  initConsentDefaults();
  if (getStoredConsent() === "granted") setConsent("granted");
}

/** Low-level send — used by events.ts (typed/redacted) and RouteTracker (page_view). */
export function sendGaHit(name: string, params: Record<string, string>) {
  if (!hasAnalyticsConsent()) return;
  // Returning visitors can hit RouteTracker before ConsentBanner's mount effect runs.
  // Lazily bootstrap here so the first event is queued behind config instead of being
  // silently dropped while window.gtag is still undefined.
  if (!window.gtag) bootstrapConsent();
  window.gtag?.(("event" as const), name, params);
}
