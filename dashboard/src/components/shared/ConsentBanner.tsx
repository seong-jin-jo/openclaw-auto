"use client";

import { useEffect, useState } from "react";
import { bootstrapConsent, gaEnabled, getStoredConsent, setConsent } from "@/lib/analytics/ga";

const OPEN_EVENT = "osmu:analytics-consent-open";

/** Reopens the consent banner (used by the "개인정보 설정" link). No-op if GA disabled. */
export function openConsentSettings() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}

// SSR-safe: renders null until mounted client-side (no hydration mismatch, no CLS — the
// banner only ever appears after mount via a state flip, same as any client-only overlay).
export function ConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!gaEnabled) return;
    // Consent Mode v2 default-denied must be set before any possible 'update' — do this on
    // mount regardless of whether the banner is shown (covers the "already decided" case too).
    // bootstrapConsent() also re-affirms a previously-granted consent so gtag.js actually
    // reloads on a page refresh (Codex review 2026-07-14 #1 — initConsentDefaults() alone never
    // re-triggered the script load for a returning consenting user).
    bootstrapConsent();
    if (getStoredConsent() === null) setVisible(true);
    const onOpen = () => setVisible(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  if (!mounted || !gaEnabled || !visible) return null;

  const accept = () => { setConsent("granted"); setVisible(false); };
  const reject = () => { setConsent("denied"); setVisible(false); };

  return (
    <div
      role="dialog"
      aria-label="분석 쿠키 동의"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 card p-4 border border-border shadow-lg bg-surface"
    >
      <p className="text-sm text-text mb-1 font-medium">쿠키/분석 사용 동의</p>
      <p className="text-xs text-subtle mb-3">
        서비스 개선을 위해 방문 통계를 익명으로 수집합니다. 광고 목적으로는 사용하지 않으며, 동의는
        언제든 아래 &ldquo;개인정보 설정&rdquo;에서 변경할 수 있습니다.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={reject}
          className="px-3 py-1.5 text-xs rounded border border-border text-muted hover:bg-surface-2"
        >
          거부
        </button>
        <button
          onClick={accept}
          className="px-3 py-1.5 text-xs rounded bg-accent text-accent-fg"
        >
          동의
        </button>
      </div>
    </div>
  );
}

/** Small persistent link to reopen consent settings later. Renders nothing if GA disabled. */
export function PrivacySettingsLink() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !gaEnabled) return null;
  return (
    <button
      onClick={openConsentSettings}
      className="fixed bottom-1 left-1 text-[10px] text-subtle underline z-40 opacity-70 hover:opacity-100"
    >
      개인정보 설정
    </button>
  );
}
