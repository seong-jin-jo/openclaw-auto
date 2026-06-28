"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import { setAuthToken } from "@/lib/auth";

// 고객 셀프서브 로그인/가입. 성공 시 Supabase 세션의 access token을 저장 →
// 이후 API 호출이 Bearer로 첨부 → 서버가 검증해 그 고객 테넌트로 스코프.
export default function LoginPage() {
  // support /signup or ?mode=signup to default to signup mode
  const [mode, setMode] = useState<"login" | "signup">(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('mode') === 'signup' || window.location.pathname === '/signup') return 'signup';
    }
    return 'login';
  });
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  // 가입 후 이메일 확인 대기 상태(Confirm email ON). 세션이 안 와도 막다른 골목 대신 안내.
  const [pending, setPending] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 이메일 확인/OAuth 복귀 감지: Supabase는 #access_token=...&refresh_token=... 으로 되돌아온다.
  // 클라가 URL 해시를 파싱(detectSessionInUrl 기본 on)하므로 mount 시 세션을 거둬 토큰 저장 후 진입.
  useEffect(() => {
    // supabase env 미설정 시 createBrowserSupabase가 throw → 페이지 死 방지(가드).
    let unsub: (() => void) | undefined;
    try {
      const sb = createBrowserSupabase();
      const hash = window.location.hash || "";
      const hadHashToken = hash.includes("access_token");
      const enter = (accessToken: string) => {
        setAuthToken(accessToken);
        if (hadHashToken) history.replaceState(null, "", window.location.pathname);
        window.location.href = "/";
      };
      sb.auth.getSession().then(({ data }) => {
        if (data.session) enter(data.session.access_token);
      }).catch(() => { /* ignore */ });
      // 다른 탭에서 이메일 확인/로그인하면 이 탭도 자동 진입 — "이메일 확인" pending 화면이
      // 막다른 골목이 되지 않게(가입 confirm 후 원본 탭도 로그인 처리). Supabase는 세션을
      // localStorage로 탭 간 동기화하므로 onAuthStateChange가 SIGNED_IN을 받는다.
      const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) enter(session.access_token);
      });
      unsub = () => sub.subscription.unsubscribe();
    } catch (e) {
      if (typeof console !== "undefined") console.error("[login] supabase init:", e);
    }
    return () => { unsub?.(); if (cooldownTimer.current) clearInterval(cooldownTimer.current); };
  }, []);

  const startCooldown = (secs: number) => {
    setResendCooldown(secs);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1 && cooldownTimer.current) { clearInterval(cooldownTimer.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const submit = async () => {
    if (!email || !pw || busy) {
      setMsg("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setBusy(true); setMsg("");
    try {
      const sb = createBrowserSupabase();
      if (mode === "signup") {
        // 이메일 확인 후 반드시 이 앱(현재 origin)의 /login으로 복귀 — Supabase Site URL 기본값에 의존 금지.
        // (Supabase Auth > URL Configuration > Redirect URLs 허용목록에 이 origin이 등록돼 있어야 적용됨)
        const { data, error } = await sb.auth.signUp({
          email,
          password: pw,
          options: { emailRedirectTo: `${window.location.origin}/login` },
        });
        if (error) { setMsg(error.message); return; }
        if (data.session) { setAuthToken(data.session.access_token); window.location.href = "/"; }
        else { setPending(email); startCooldown(60); }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) { setMsg(error.message); return; }
        if (data.session) { setAuthToken(data.session.access_token); window.location.href = "/"; }
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const resend = async () => {
    if (!pending || resendCooldown > 0 || busy) return;
    setBusy(true); setMsg("");
    try {
      const sb = createBrowserSupabase();
      const { error } = await sb.auth.resend({ type: "signup", email: pending, options: { emailRedirectTo: `${window.location.origin}/login` } });
      if (error) { setMsg(error.message); startCooldown(60); return; }
      setMsg("인증 메일을 다시 보냈습니다. 받은편지함을 확인해주세요.");
      startCooldown(60);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const google = async () => {
    setMsg("");
    try {
      const sb = createBrowserSupabase();
      // Use current origin so it works in prod (tunnel) and local dev
      const redirectTo = `${window.location.origin}/login`;
      const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
      if (error) {
        setMsg(
          /provider is not enabled|Unsupported provider/i.test(error.message)
            ? "Google 로그인이 아직 설정되지 않았습니다. 이메일로 가입해주세요."
            : error.message,
        );
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  };

  // 가입 후 확인 대기 화면 — 막다른 골목 대신 재전송 + 명확한 다음 단계 안내.
  if (pending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-border bg-surface/50">
          <h1 className="text-lg font-semibold text-text mb-1">이메일을 확인해주세요</h1>
          <p className="text-xs text-subtle mb-1"><span className="text-muted">{pending}</span> 으로 인증 메일을 보냈습니다.</p>
          <p className="text-xs text-subtle mb-5">메일의 링크를 클릭하면 자동으로 로그인되어 대시보드로 이동합니다. (스팸함도 확인해주세요)</p>

          <button onClick={resend} disabled={busy || resendCooldown > 0}
            className="w-full px-4 py-2 text-sm bg-surface-2 hover:bg-surface-2 text-muted rounded-lg disabled:opacity-50">
            {resendCooldown > 0 ? `인증 메일 재전송 (${resendCooldown}s)` : "인증 메일 재전송"}
          </button>

          {msg && <p className="text-xs mt-3 text-amber-400">{msg}</p>}

          <button onClick={() => { setPending(null); setMode("login"); setMsg(""); }}
            className="mt-4 text-xs text-subtle hover:text-muted">
            ← 로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm p-6 rounded-2xl border border-border bg-surface/50">
        <h1 className="text-lg font-semibold text-text mb-1">OSMU 마케팅 자동화</h1>
        <p className="text-xs text-subtle mb-5">{mode === "login" ? "로그인" : "가입"}하고 내 브랜드 콘텐츠를 자동 생성·발행하세요.</p>

        <div className="space-y-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-muted focus:border-accent outline-none" />
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-muted focus:border-accent outline-none" />
          <button onClick={submit} disabled={busy}
            className="w-full px-4 py-2 text-sm bg-accent text-text rounded-lg disabled:opacity-50">
            {busy ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
          </button>
          <button onClick={google} className="w-full px-4 py-2 text-sm bg-surface-2 hover:bg-surface-2 text-muted rounded-lg">
            Google로 계속
          </button>
        </div>

        {msg && <p className="text-xs mt-3 text-amber-400">{msg}</p>}

        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(""); }}
          className="mt-4 text-xs text-subtle hover:text-muted">
          {mode === "login" ? "계정이 없으신가요? 가입" : "이미 계정이 있으신가요? 로그인"}
        </button>
      </div>
    </div>
  );
}
