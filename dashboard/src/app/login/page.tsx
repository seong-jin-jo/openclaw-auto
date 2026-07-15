"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import { setAuthToken } from "@/lib/auth";
import { oauthErrorMessage } from "@/lib/oauth-errors";
import { trackEvent } from "@/lib/analytics/events";

// Non-PII marker set right before an OAuth redirect, consumed only once a session is confirmed
// on return. Needed because PKCE-flow returns (Supabase `?code=...` exchange) carry no hash
// token — the old hash-only detection silently missed PKCE logins (Codex review 2026-07-14 #5).
// sessionStorage (not localStorage) — scoped to this tab/redirect round-trip only, no identity.
const OAUTH_PENDING_KEY = "osmu_oauth_pending";

// 고객 셀프서브 로그인 = Google OAuth 단일 경로 (회장 확정 2026-07-16: 이메일/비밀번호 가입·로그인·
// 비밀번호 재설정 전부 제거, SMTP/Resend 도입 안 함). 성공 시 Supabase 세션의 access token을 저장 →
// 이후 API 호출이 Bearer로 첨부 → 서버가 검증해 그 고객 테넌트로 스코프.
export default function LoginPage() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  // OAuth login event de-dupe: enter() can be invoked twice (getSession() resolve +
  // onAuthStateChange SIGNED_IN) — this guards a single `login` fire per mount regardless.
  const oauthTrackedRef = useRef(false);

  // OAuth 복귀 감지: Supabase는 #access_token=...&refresh_token=... 또는 PKCE ?code=... 으로
  // 되돌아온다. 클라가 URL 해시를 파싱(detectSessionInUrl 기본 on)하므로 mount 시 세션을 거둬
  // 토큰 저장 후 진입.
  useEffect(() => {
    // supabase env 미설정 시 createBrowserSupabase가 throw → 페이지 死 방지(가드).
    let unsub: (() => void) | undefined;
    try {
      const sb = createBrowserSupabase();
      const hash = window.location.hash || "";
      const p = new URLSearchParams(window.location.search);
      const hadHashToken = hash.includes("access_token");
      const isOAuthCallbackError =
        hash.includes("error=") || hash.includes("error_code=") ||
        !!p.get("error") || !!p.get("error_code");
      if (isOAuthCallbackError) {
        // OAuth cancel/error (e.g. user closed the Google consent screen) — no session will ever
        // arrive for this attempt. Clear the marker now so it can't leak into and mislabel the
        // next unrelated auth attempt on this tab.
        try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch { /* ignore */ }
      }
      const enter = (accessToken: string) => {
        setAuthToken(accessToken);
        if (hadHashToken) history.replaceState(null, "", window.location.pathname);
        // OAuth 콜백으로 세션이 확정된 순간(백엔드 확인 후) — 신규/기존 구분 불가라 login으로 기록.
        // 분류 근거는 오직 osmu_oauth_pending 마커뿐(위 설명).
        // enter()가 getSession()+onAuthStateChange 양쪽에서 호출될 수 있어 ref로 1회만 발행.
        if (!oauthTrackedRef.current) {
          let oauthPending = false;
          try { oauthPending = sessionStorage.getItem(OAUTH_PENDING_KEY) === "1"; } catch { /* ignore */ }
          if (oauthPending) {
            oauthTrackedRef.current = true;
            trackEvent({ name: "login", params: { method: "oauth" } });
          }
        }
        try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch { /* ignore */ }
        window.location.href = "/";
      };
      sb.auth.getSession().then(({ data }) => {
        if (data.session) enter(data.session.access_token);
      }).catch(() => { /* ignore */ });
      // 다른 탭에서 로그인하면 이 탭도 자동 진입 — Supabase는 세션을 localStorage로 탭 간
      // 동기화하므로 onAuthStateChange가 SIGNED_IN을 받는다.
      const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) enter(session.access_token);
      });
      unsub = () => sub.subscription.unsubscribe();
    } catch (e) {
      if (typeof console !== "undefined") console.warn("[login] supabase init:", e);
    }
    return () => { unsub?.(); };
  }, []);

  const google = async () => {
    setMsg("");
    if (busy) return;
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/login`;
      const r = await fetch(`/api/auth/google?redirect_to=${encodeURIComponent(redirectTo)}`);
      const d = (await r.json()) as { authUrl?: string; error?: string };
      if (!r.ok || !d.authUrl) {
        setMsg(oauthErrorMessage(d.error || "Google 로그인 설정 확인 실패", "Google"));
        return;
      }
      // 리다이렉트 직전 마커 세팅 — 복귀 시(PKCE ?code= 또는 hash) 세션 확정 후에만 소비.
      try { sessionStorage.setItem(OAUTH_PENDING_KEY, "1"); } catch { /* ignore */ }
      window.location.href = d.authUrl;
    } catch (e) {
      setMsg(oauthErrorMessage(e instanceof Error ? e.message : String(e), "Google"));
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm p-6 rounded-2xl border border-border bg-surface/50">
        <h1 className="text-lg font-semibold text-text mb-1">OSMU 마케팅 자동화</h1>
        <p className="text-xs text-subtle mb-5">Google 계정으로 로그인하고 내 브랜드 콘텐츠를 자동 생성·발행하세요.</p>

        <div className="space-y-2">
          <button onClick={google} disabled={busy}
            className="w-full px-4 py-2 text-sm bg-accent text-accent-fg rounded-lg disabled:opacity-50">
            {busy ? "확인 중…" : "Google로 계속"}
          </button>
        </div>

        {msg && <p className="text-xs mt-3 text-amber-400">{msg}</p>}
      </div>
    </div>
  );
}
