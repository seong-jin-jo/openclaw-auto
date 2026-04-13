"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuthToken, setAuthToken } from "@/lib/auth";

/** Landing/Login page — exact 1:1 port of promptLogin() from app.js lines 56-132 */
function LandingPage() {
  const [token, setToken] = useState("");

  const doLogin = useCallback(() => {
    if (token.trim()) {
      setAuthToken(token.trim());
      window.location.reload();
    }
  }, [token]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-8 pt-20 pb-16 text-center">
        <div className="text-[10px] px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/30 mb-6">
          AI-Powered Marketing Automation
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">Marketing Hub</h1>
        <p className="text-lg text-gray-400 max-w-2xl mb-4">
          AI가 콘텐츠를 자동 생성하고, 20개+ 채널에 동시 발행하고, 반응을 분석하여 다음 콘텐츠에 자동 반영합니다.
        </p>
        <p className="text-sm text-gray-600 mb-10">검수만 하세요. 나머지는 자동입니다.</p>

        {/* Login Card */}
        <div className="card p-6 w-80 mb-16">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doLogin()}
            placeholder="Auth Token"
            className="w-full bg-gray-900 text-gray-200 text-sm p-3 rounded border border-gray-700 mb-3"
            autoFocus
          />
          <button
            onClick={doLogin}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-500"
          >
            Start Dashboard
          </button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="max-w-4xl mx-auto px-8 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-xl font-semibold text-white mb-2">Automated Pipeline</h2>
          <p className="text-sm text-gray-500">설정 한 번이면 24/7 자동 운영</p>
        </div>
        <div className="flex items-center justify-between gap-2 mb-4">
          {[
            { icon: "1", label: "Trend Collection", desc: "외부 인기글 수집", color: "purple" },
            { icon: "2", label: "AI Generation", desc: "Claude가 맞춤 생성", color: "blue" },
            { icon: "3", label: "Human Review", desc: "대시보드에서 검수", color: "yellow" },
            { icon: "4", label: "Auto Publish", desc: "멀티채널 발행", color: "green" },
            { icon: "5", label: "Feedback Loop", desc: "반응→학습→개선", color: "red" },
          ].map((s, i, arr) => (
            <span key={s.icon} className="contents">
              <div className="flex-1 text-center">
                <div className={`w-10 h-10 rounded-full bg-${s.color}-900/30 text-${s.color}-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold`}>
                  {s.icon}
                </div>
                <p className="text-xs font-medium text-white">{s.label}</p>
                <p className="text-[10px] text-gray-600">{s.desc}</p>
              </div>
              {i < arr.length - 1 && <div className="text-gray-700 text-lg">&rarr;</div>}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="text-sm font-medium text-white mb-2">20+ Channels</h3>
            <p className="text-xs text-gray-500 mb-3">
              Threads, X, Instagram, Facebook, LinkedIn, Blog, Telegram, Discord 등
            </p>
            <div className="flex flex-wrap gap-1">
              {["T", "X", "I", "F", "L", "B", "TG", "D"].map((c) => (
                <span key={c} className="text-[9px] w-5 h-5 rounded bg-gray-800 text-gray-500 flex items-center justify-center">
                  {c}
                </span>
              ))}
              <span className="text-[9px] text-gray-700">+12</span>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-medium text-white mb-2">AI Feedback Loop</h3>
            <p className="text-xs text-gray-500">
              터진 글을 자동 감지하여 스타일과 패턴을 학습. 다음 콘텐츠 품질이 자동으로 개선됩니다.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-medium text-white mb-2">Zero Maintenance</h3>
            <p className="text-xs text-gray-500">
              Cron이 생성/발행/수집을 24시간 자동 처리. 당신은 대시보드에서 승인만 하면 됩니다.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pb-12">
        <p className="text-[10px] text-gray-700">
          Powered by{" "}
          <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-400">
            OpenClaw
          </a>{" "}
          + Claude
        </p>
      </div>
    </div>
  );
}

/**
 * AuthGate — wraps the app.
 * If no token in localStorage, show full-page landing (no sidebar).
 * If token exists, render children (sidebar + content).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setHasToken(!!getAuthToken());
  }, []);

  // SSR: render nothing until we check localStorage
  if (hasToken === null) return null;

  if (!hasToken) return <LandingPage />;

  return <>{children}</>;
}
