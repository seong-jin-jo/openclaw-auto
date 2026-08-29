"use client";

import { useState, useCallback } from "react";
import { setAuthToken } from "@/lib/auth";
import { isAbortError, useAuthAttempt } from "@/lib/auth-attempt";

// 운영자 콘솔 진입 — DASHBOARD_AUTH_TOKEN으로 전체 접근. 고객 랜딩과 분리(비번 박스 노출 0).
// 고객 셀프서브는 /login(Supabase)이 유일 진입. 여기는 운영자만.
export default function OperatorPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { begin: beginAttempt } = useAuthAttempt();

  const doLogin = useCallback(async () => {
    const t = token.trim();
    if (!t || busy) return;
    // 이 화면을 떠난 뒤 늦게 온 응답이 그 사이 확정된 다른 신원을 덮지 못하게 한다.
    const attempt = beginAttempt();
    setError("");
    setBusy(true);
    try {
      // 잘못된 토큰이 깨진 UI를 여는 걸 막기 위해 신뢰 전 검증.
      const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${t}` }, signal: attempt.signal });
      const data = res.ok ? await res.json().catch(() => null) : null;
      if (!attempt.owns()) return;
      if (!res.ok) {
        setError("운영자 토큰이 유효하지 않습니다. 다시 확인해주세요.");
        return;
      }
      if (!data?.isOperator) {
        setError("이 토큰은 운영자 모드가 아닙니다.");
        return;
      }
      setAuthToken(t, "operator");
      window.location.href = "/operator/customers";
    } catch (cause) {
      if (attempt.owns() && !isAbortError(cause)) setError("토큰 확인 중 오류가 발생했습니다.");
    } finally {
      if (attempt.owns()) setBusy(false);
    }
  }, [beginAttempt, token, busy]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-stack-section">
      <div className="card p-region w-full max-w-sm relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-0.5 bg-accent"
        />
        <div className="text-center mb-stack-section">
          <h1 className="text-lead font-bold text-text mb-stack-tight">운영자 콘솔</h1>
          <p className="text-caption text-subtle">DASHBOARD_AUTH_TOKEN으로 접속하세요</p>
        </div>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doLogin()}
          placeholder="운영자 Auth Token"
          className="w-full bg-surface text-text text-body-sm p-stack rounded-control border border-border focus:border-accent focus:outline-none transition-colors mb-stack-tight"
          autoFocus
        />
        <button
          onClick={doLogin}
          disabled={busy}
          className="w-full py-stack rounded-control text-accent-fg font-semibold text-body-sm bg-accent hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {busy ? "확인 중…" : "접속"}
        </button>
        {error && <p className="mt-stack-tight text-caption text-danger">{error}</p>}
        <a href="/login" className="block w-full mt-pad-inset text-center text-caption text-subtle hover:text-muted transition-colors">
          ← 고객 로그인으로
        </a>
      </div>
    </div>
  );
}
