"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

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
  const scrollToLogin = useCallback(() => {
    // 고객 가입/로그인 페이지로 (이메일·비번·구글). 운영자 진입은 /operator로 분리.
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen bg-bg">

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

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-text leading-tight mb-6 tracking-tight">
            AI가 SNS 마케팅을
            <br />
            <span className="bg-gradient-to-r from-accent via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              자동화합니다
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-subtle max-w-2xl mb-3 leading-relaxed">
            검수만 하세요. 콘텐츠 생성부터 발행, 반응 분석까지
            <br className="hidden sm:block" />
            AI가 처리합니다.
          </p>
          <p className="text-sm text-subtle mb-10">
            20+ 채널 · 24/7 자동 운영 · 피드백 루프
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={scrollToLogin}
              className="px-8 py-3 rounded-lg text-text font-semibold text-sm transition-all"
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
              className="px-8 py-3 rounded-lg text-muted font-medium text-sm border border-border hover:border-border hover:text-text transition-all"
            >
              GitHub에서 보기
            </a>
          </div>
        </div>
      </section>

      {/* ────── Channel Marquee ────── */}
      <section className="py-8 border-t border-b border-border/50">
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto px-6">
          {CHANNEL_ICONS.map((ch) => (
            <span key={ch} className="px-3 py-1 text-xs rounded-full bg-surface-2/60 text-subtle border border-border">
              {ch}
            </span>
          ))}
        </div>
      </section>

      {/* ────── Pipeline ────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-3">How It Works</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">완전 자동화 파이프라인</h2>
          <p className="text-sm text-subtle">설정 한 번이면 24/7 자동 운영</p>
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
                <p className="text-sm font-semibold text-text mb-1">{s.label}</p>
                <p className="text-xs text-subtle">{s.desc}</p>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="flex items-center pt-5 text-subtle text-xl select-none">&rarr;</div>
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
                  <p className="text-sm font-semibold text-text">{s.label}</p>
                  <p className="text-xs text-subtle">{s.desc}</p>
                </div>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="ml-6 h-4 border-l border-border" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ────── Features ────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-3">Features</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">마케팅에 필요한 모든 것</h2>
          <p className="text-sm text-subtle">채널 관리부터 콘텐츠 생성, 분석까지 한 곳에서</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 hover:border-border transition-colors group">
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="text-sm font-semibold text-text mb-2 group-hover:text-accent transition-colors">
                {f.title}
              </h3>
              <p className="text-xs text-subtle leading-relaxed mb-4">{f.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {f.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-surface-2/80 text-subtle">
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
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">심플한 요금제</h2>
          <p className="text-sm text-subtle">지금은 모든 기능이 무료입니다</p>
        </div>

        <div className="card p-8 max-w-md mx-auto text-center relative overflow-hidden">
          {/* Glow accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #4ade80, transparent)" }} />

          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
            모든 기능 무료
          </div>

          <h3 className="text-3xl font-bold text-text mb-1">Free</h3>
          <p className="text-sm text-subtle mb-8">₩0 / 월</p>

          <ul className="text-left space-y-3 mb-8">
            {[
              "무제한 채널 연결",
              "AI 콘텐츠 자동 생성",
              "크론 자동 발행",
              "피드백 루프 · 반응 분석",
              "카드뉴스 에디터",
              "실시간 대시보드",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-muted">
                <span className="text-green-400 text-base">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={scrollToLogin}
            className="w-full py-3 rounded-lg text-text font-semibold text-sm transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            무료로 시작하기
          </button>

          <p className="text-[10px] text-subtle mt-4">추후 Pro / Business 플랜 추가 예정</p>
        </div>
      </section>

      {/* ────── Login ────── */}
      <section className="max-w-md mx-auto px-6 py-20">
        <div className="card p-8 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #7c3aed, #3b82f6, transparent)" }} />

          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-text mb-2">시작하기</h3>
            <p className="text-xs text-subtle">이메일로 가입하고 내 브랜드 콘텐츠를 자동 생성·발행하세요</p>
          </div>

          {/* 고객 가입/로그인 — 이메일·비번·구글 (중앙정렬된 /login 페이지) */}
          <a
            href="/login"
            className="block w-full py-3 rounded-lg text-text font-semibold text-sm text-center transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)" }}
          >
            로그인 / 회원가입 →
          </a>

          {/* 운영자 진입은 /operator로 분리 — 고객 화면엔 비번 박스 노출 안 함 */}
          <a
            href="/operator"
            className="block w-full mt-3 text-center text-[11px] text-subtle hover:text-muted transition-colors"
          >
            운영자세요? 운영자 콘솔로 →
          </a>
        </div>
      </section>

      {/* ────── Footer ────── */}
      <footer className="border-t border-border/50 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-subtle">
            Powered by{" "}
            <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer"
              className="text-subtle hover:text-muted transition-colors">
              OpenClaw
            </a>
            {" "}+ Claude
          </p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/openclaw" target="_blank" rel="noopener noreferrer"
              className="text-xs text-subtle hover:text-muted transition-colors">
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
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setHasToken(!!getAuthToken());
  }, []);

  // Supabase 세션 ↔ localStorage 토큰 스냅샷 동기화.
  // 수동 스냅샷은 자동갱신이 안 돼 만료(~1h) 후에도 "로그인됨"으로 보여 전 API가 401이 된다.
  // getSession으로 갱신된 토큰을 스냅샷에 반영하고, onAuthStateChange로 계속 동기화.
  // SIGNED_OUT이면 스냅샷 제거 → 랜딩으로.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    // 운영자 토큰(DASHBOARD_AUTH_TOKEN, 비-JWT)이 저장돼 있으면 Supabase 세션 동기화에서 제외한다.
    // 같은 localStorage 키를 공유하므로, 남아있던 고객 세션으로 운영자 토큰을 덮어쓰면
    // 운영자가 그 고객 테넌트로 스코프되는 교차계정 권한 혼동이 생긴다.
    const isJwt = (t: string) => t.split(".").length === 3 && t.length > 40;
    const operatorActive = () => { const t = getAuthToken(); return !!t && !isJwt(t); };
    (async () => {
      try {
        const { createBrowserSupabase } = await import("@/lib/supabase");
        const sb = createBrowserSupabase();
        const { data: { session } } = await sb.auth.getSession();
        if (session?.access_token && !operatorActive()) {
          setAuthToken(session.access_token);
          setHasToken(true);
        }
        const { data } = sb.auth.onAuthStateChange((event, sess) => {
          if (operatorActive()) return; // 운영자 세션엔 관여하지 않음
          if (sess?.access_token) {
            setAuthToken(sess.access_token);
            setHasToken(true);
          } else if (event === "SIGNED_OUT") {
            clearAuthToken();
            setHasToken(false);
          }
        });
        unsub = () => data.subscription.unsubscribe();
      } catch {
        /* supabase env 미설정/dev — 무시(운영자 토큰 경로는 영향 없음) */
      }
    })();
    return () => unsub?.();
  }, []);

  // 로그인/가입/운영자 콘솔은 인증 없이 풀스크린으로(진입점) — 사이드바·게이트 없이.
  if (pathname === "/login" || pathname === "/signup" || pathname === "/operator") {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  // SSR: localStorage 확인 전엔 아무것도 안 그림
  if (hasToken === null) return null;

  // 미인증: 랜딩(마케팅 + 로그인/회원가입 CTA → /login)
  if (!hasToken) return <LandingPage />;

  // 인증됨: 사이드바 + 콘텐츠
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-y-auto">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
