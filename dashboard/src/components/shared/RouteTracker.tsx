"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { normalizePagePath, trackEvent } from "@/lib/analytics/events";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/analytics/ga";

// Manual page_view per App Router client-side navigation (GA4 config uses send_page_view:false
// — see ga.ts design note). Dedupes on identical consecutive normalized path via a ref so React
// 18 StrictMode's dev double-invoke of effects never double-fires, and never sends raw path text
// or query strings (may carry tokens/codes) — normalizePagePath() collapses to a finite template.
//
// 2026-07-14 Codex review hardening (#2): consent can be granted *without* a navigation (banner
// accept click on the page the user is already on) — the old version only fired on the next
// [pathname] change and silently missed that first page. We now also subscribe to ga.ts's
// consent-change event and fire the *current* page exactly once the instant consent flips to
// granted, and reset the dedupe guard on revoke so a later re-grant fires the current page again.
export function RouteTracker() {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const lastSent = useRef<string | null>(null);
  pathRef.current = pathname;

  const fireCurrentPage = () => {
    const p = pathRef.current;
    if (!p) return;
    const normalized = normalizePagePath(p);
    if (normalized === lastSent.current) return; // dedupe: same normalized page already sent
    lastSent.current = normalized;
    trackEvent({ name: "page_view", params: { page_path: normalized } });
  };

  // Navigation-triggered firing — covers every route change post-consent, and also covers the
  // "already granted from a previous session" case on first mount (hasAnalyticsConsent() reads
  // localStorage directly, independent of the consent-change subscription below).
  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    fireCurrentPage();
  }, [pathname]);

  // Consent-change-triggered firing — covers "grant without navigation" (banner accept on the
  // current page) and ensures the very first page is never missed regardless of effect order
  // between RouteTracker and ConsentBanner. `lastSent` is shared with the effect above, so
  // whichever fires first wins and the other is a safe no-op dedupe.
  useEffect(() => {
    return onConsentChange((value) => {
      if (value === "granted") {
        fireCurrentPage();
      } else {
        lastSent.current = null; // reset dedupe so a later re-grant re-fires the current page
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
