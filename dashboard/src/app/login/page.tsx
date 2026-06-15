"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import { setAuthToken } from "@/lib/auth";

// 고객 셀프서브 로그인/가입. 성공 시 Supabase 세션의 access token을 저장 →
// 이후 API 호출이 Bearer로 첨부 → 서버가 검증해 그 고객 테넌트로 스코프.
export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !pw || busy) return;
    setBusy(true); setMsg("");
    try {
      const sb = createBrowserSupabase();
      if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password: pw });
        if (error) { setMsg(error.message); return; }
        if (data.session) { setAuthToken(data.session.access_token); window.location.href = "/"; }
        else setMsg("가입됨. 이메일 인증 후 로그인하세요.");
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) { setMsg(error.message); return; }
        if (data.session) { setAuthToken(data.session.access_token); window.location.href = "/"; }
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const google = async () => {
    const sb = createBrowserSupabase();
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm p-6 rounded-2xl border border-gray-800 bg-gray-900/50">
        <h1 className="text-lg font-semibold text-white mb-1">OSMU 마케팅 자동화</h1>
        <p className="text-xs text-gray-500 mb-5">{mode === "login" ? "로그인" : "가입"}하고 내 브랜드 콘텐츠를 자동 생성·발행하세요.</p>

        <div className="space-y-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일"
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:border-purple-500 outline-none" />
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:border-purple-500 outline-none" />
          <button onClick={submit} disabled={busy}
            className="w-full px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50">
            {busy ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
          </button>
          <button onClick={google} className="w-full px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg">
            Google로 계속
          </button>
        </div>

        {msg && <p className="text-xs mt-3 text-amber-400">{msg}</p>}

        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(""); }}
          className="mt-4 text-xs text-gray-500 hover:text-gray-300">
          {mode === "login" ? "계정이 없으신가요? 가입" : "이미 계정이 있으신가요? 로그인"}
        </button>
      </div>
    </div>
  );
}
