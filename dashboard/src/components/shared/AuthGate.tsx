"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAuthToken, setAuthToken } from "@/lib/auth";

/* ─── Pipeline step colors (Tailwind v4 can't do dynamic classes) ─── */
const PIPELINE_STEPS = [
  { num: "1", label: "Trend Collection", desc: "외부 인기글 자동 수집", bg: "rgba(147,51,234,0.15)", fg: "#a78bfa" },
  { num: "2", label: "AI Generation", desc: "Claude가 맞춤 콘텐츠 생성", bg: "rgba(59,130,246,0.15)", fg: "#60a5fa" },
  { num: "3", label: "Human Review", desc: "대시보드에서 검수·편집", bg: "rgba(234,179,8,0.15)", fg: "#facc15" },
  { num: "4", label: "Auto Publish", desc: "20+ 채널 동시 발행", bg: "rgba(34,197,94,0.15)", fg: "#4ade80" },
  { num: "5", label: "Feedback Loop", desc: "반응 분석 → 자동 학습", bg: "rgba(239,68,68,0.15)", fg: "#f87171" },
] as const;

const FEATURES = [
  {
    icon: "📡",
    title: "20+ 채널 동시 발행",
    desc: "Threads, X, Instagram, Facebook, LinkedIn, Bluesky, Telegram, Discord 등 20개 이상의 채널에 한 번에 발행합니다.",
    tags: ["Threads", "X", "IG", "FB", "LinkedIn", "Bluesky", "TG", "+14"],
  },
  {
    icon: "🤖",
    title: "AI 콘텐츠 생성",
    desc: "Content Guide 기반으로 Claude가 브랜드 톤에 맞는 콘텐츠를 자동 생성합니다. 채널별 맞춤 최적화 포함.",
    tags: ["Claude", "맞춤 톤", "채널별 최적화"],
  },
  {
    icon: "⏰",
    title: "크론 자동 발행",
    desc: "생성 → 검수 → 발행 파이프라인이 24시간 자동 운영됩니다. 승인만 누르면 나머지는 자동.",
    tags: ["24/7", "자동화", "크론잡"],
  },
  {
    icon: "📈",
    title: "AI 피드백 루프",
    desc: "터진 글을 자동 감지하여 스타일과 패턴을 학습합니다. 다음 콘텐츠 품질이 자동으로 개선됩니다.",
    tags: ["Viral 감지", "자동 학습", "품질 개선"],
  },
  {
    icon: "🎨",
    title: "카드뉴스 에디터",
    desc: "Instagram 카드뉴스를 AI가 자동 생성합니다. Midjourney 이미지 연동으로 비주얼 퀄리티를 높입니다.",
    tags: ["Instagram", "카드뉴스", "Midjourney"],
  },
  {
    icon: "📊",
    title: "실시간 대시보드",
    desc: "모든 채널의 성과를 한 화면에서 모니터링합니다. 팔로워 추이, 반응률, 터진 글 알림까지.",
    tags: ["통합 관제", "실시간", "알림"],
  },
] as const;

const CHANNEL_ICONS = [
  "Threads", "X", "Instagram", "Facebook", "LinkedIn", "Bluesky",
  "TikTok", "YouTube", "Telegram", "Discord", "Pinterest", "Tumblr",
  "Medium", "Substack", "Naver Blog", "LINE", "Kakao", "Slack",
  "RSS", "Custom API",
];

/* ─── Landing Page ─── */
function LandingPage() {
  const [token, setToken] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  const doLogin = useCallback(() => {
    if (token.trim()) {
      setAuthToken(token.trim());
      window.location.reload();
    }
  }, [token]);

  const scrollToLogin = useCallback(() => {
    setShowLogin(true);
    setTimeout(() => loginRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ────── Hero ────── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, rgba(59,130,246,0.06) 50%, transparent 70%)" }} />
        </div>

        <div className="relative flex flex-col items-center px-6 pt-24 pb-20 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            100% 무료 — 모든 기능 제한 없음
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            AI가 SNS 마케팅을
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              자동화합니다
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mb-3 leading-relaxed">
            검수만 하세요. 콘텐츠 생성부터 발행, 반응 분석까지
            <br className="hidden sm:block" />
            AI가 처리합니다.
          </p>
          <p className="text-sm text-gray-600 mb-10">
            20+ 채널 · 24/7 자동 운영 · 피드백 루프
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={scrollToLogin}
              className="px-8 py-3 rounded-lg text-white font-semibold text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              무료로 시작하기
            </button>
            <a
              href="https://github.com/openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-lg text-gray-300 font-medium text-sm border border-gray-700 hover:border-gray-500 hover:text-white transition-all"
            >
              GitHub에서 보기
            </a>
          </div>
        </div>
      </section>

      {/* ────── Channel Marquee ────── */}
      <section className="py-8 border-t border-b border-gray-800/50">
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto px-6">
          {CHANNEL_ICONS.map((ch) => (
            <span key={ch} className="px-3 py-1 text-xs rounded-full bg-gray-800/60 text-gray-500 border border-gray-800">
              {ch}
            </span>
          ))}
        </div>
      </section>

      {/* ────── Pipeline ────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-purple-400 mb-3">How It Works</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">완전 자동화 파이프라인</h2>
          <p className="text-sm text-gray-500">설정 한 번이면 24/7 자동 운영</p>
        </div>

        {/* Desktop: horizontal */}
        <div className="hidden md:flex items-start justify-between gap-3">
          {PIPELINE_STEPS.map((s, i) => (
            <div key={s.num} className="contents">
              <div className="flex-1 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-lg font-bold"
                  style={{ background: s.bg, color: s.fg }}
                >
                  {s.num}
                </div>
                <p className="text-sm font-semibold text-white mb-1">{s.label}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="flex items-center pt-5 text-gray-700 text-xl select-none">&rarr;</div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical */}
        <div className="flex md:hidden flex-col gap-4">
          {PIPELINE_STEPS.map((s, i) => (
            <div key={s.num}>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
                  style={{ background: s.bg, color: s.fg }}
                >
                  {s.num}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="ml-6 h-4 border-l border-gray-800" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ────── Features ────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-3">Features</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">마케팅에 필요한 모든 것</h2>
          <p className="text-sm text-gray-500">채널 관리부터 콘텐츠 생성, 분석까지 한 곳에서</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 hover:border-gray-700 transition-colors group">
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                {f.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{f.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {f.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-gray-800/80 text-gray-500">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────── Pricing ────── */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-green-400 mb-3">Pricing</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">심플한 요금제</h2>
          <p className="text-sm text-gray-500">지금은 모든 기능이 무료입니다</p>
        </div>

        <div className="card p-8 max-w-md mx-auto text-center relative overflow-hidden">
          {/* Glow accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #4ade80, transparent)" }} />

          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
            모든 기능 무료
          </div>

          <h3 className="text-3xl font-bold text-white mb-1">Free</h3>
          <p className="text-sm text-gray-500 mb-8">₩0 / 월</p>

          <ul className="text-left space-y-3 mb-8">
            {[
              "무제한 채널 연결",
              "AI 콘텐츠 자동 생성",
              "크론 자동 발행",
              "피드백 루프 · 반응 분석",
              "카드뉴스 에디터",
              "실시간 대시보드",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                <span className="text-green-400 text-base">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={scrollToLogin}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            무료로 시작하기
          </button>

          <p className="text-[10px] text-gray-600 mt-4">추후 Pro / Business 플랜 추가 예정</p>
        </div>
      </section>

      {/* ────── Login ────── */}
      <section ref={loginRef} className="max-w-md mx-auto px-6 py-20">
        <div className="card p-8 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #7c3aed, #3b82f6, transparent)" }} />

          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-white mb-2">시작하기</h3>
            <p className="text-xs text-gray-500">Auth Token을 입력하여 대시보드에 접속하세요</p>
          </div>

          {showLogin ? (
            <div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doLogin()}
                placeholder="Auth Token"
                className="w-full bg-gray-900 text-gray-200 text-sm p-3.5 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none transition-colors mb-4"
                autoFocus
              />
              <button
                onClick={doLogin}
                className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                무료로 시작하기
              </button>
              <p className="text-[10px] text-gray-600 text-center mt-3">
                DASHBOARD_AUTH_TOKEN 환경 변수에 설정한 토큰을 입력하세요
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              무료로 시작하기
            </button>
          )}
        </div>
      </section>

      {/* ────── Footer ────── */}
      <footer className="border-t border-gray-800/50 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            Powered by{" "}
            <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors">
              OpenClaw
            </a>
            {" "}+ Claude
          </p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/openclaw" target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-gray-300 transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
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
