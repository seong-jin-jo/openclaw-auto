"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getAuthToken, setAuthToken, clearAuthToken, authHeaders } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

type GateStatus = "checking" | "ok" | "access_paused" | "account_unavailable" | "auth_error" | "service_error";

function isJwtToken(t: string | null | undefined): boolean {
  return !!t && t.split(".").length === 3 && t.length > 40;
}

/* ─── 정지/이용불가 풀스크린 — 로그아웃 후 랜딩(로그인 CTA)으로 보내는 게 misleading해서
   여기서는 새로고침(재확인)과 로그아웃 두 액션만 제공 ─── */
function GateBlockScreen({
  title,
  desc,
  onRefresh,
  onLogout,
}: {
  title: string;
  desc: string;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen w-full bg-bg flex items-center justify-center px-6">
      <div className="card p-8 w-full max-w-sm text-center">
        <h1 className="text-lg font-bold text-text mb-2">{title}</h1>
        <p className="text-sm text-subtle mb-6">{desc}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onRefresh}
            className="w-full py-2.5 rounded-lg text-text font-semibold text-sm bg-accent hover:bg-accent-hover transition-all"
          >
            새로고침
          </button>
          <button
            onClick={onLogout}
            className="w-full py-2.5 rounded-lg text-xs text-subtle hover:text-muted transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Pipeline step colors (Tailwind v4 can't do dynamic classes) ─── */
const PIPELINE_STEPS = [
  { num: "1", label: "Trend Collection", desc: "외부 인기글 자동 수집", bg: "rgba(147,51,234,0.15)", fg: "#a78bfa" },
  { num: "2", label: "AI Generation", desc: "Claude가 맞춤 콘텐츠 생성", bg: "rgba(59,130,246,0.15)", fg: "#60a5fa" },
  { num: "3", label: "Human Review", desc: "대시보드에서 검수·편집", bg: "rgba(234,179,8,0.15)", fg: "#facc15" },
  { num: "4", label: "Auto Publish", desc: "주요 채널 동시 발행", bg: "rgba(34,197,94,0.15)", fg: "#4ade80" },
  { num: "5", label: "Feedback Loop", desc: "반응 분석 → 자동 학습", bg: "rgba(239,68,68,0.15)", fg: "#f87171" },
] as const;

const FEATURES = [
  {
    icon: "📡",
    title: "주요 채널 동시 발행",
    desc: "Threads, X, Facebook, Instagram, Bluesky, Telegram, Discord, Slack에 한 번에 예약 발행합니다.",
    tags: ["Threads", "X", "Facebook", "Instagram", "Bluesky", "Telegram", "Discord", "Slack"],
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

// SCHEDULABLE_PLATFORMS(lib/constants.ts)의 SSOT와 1:1 — "예약 발행이 실제 지원하는 채널"만 나열한다.
// (PUBLISH_CHANNEL_GROUPS는 연결 UI 범위일 뿐 발행 지원 목록이 아님 — LinkedIn/Pinterest/Tumblr/TikTok/
//  YouTube/Naver Blog/LINE은 연결만 가능하고 예약 발행 미지원이라 랜딩 나열에서 제외, 지원범위 과장 방지.
//  authgate-contract.test.ts가 이 목록을 SCHEDULABLE_PLATFORMS와 교차검증한다.)
const CHANNEL_ICONS = [
  "Threads", "X", "Facebook", "Instagram",
  "Bluesky", "Telegram", "Discord", "Slack",
];

/* ─── Landing Page ─── */
function LandingPage() {
  const scrollToLogin = useCallback(() => {
    // 고객 가입/로그인 페이지로 (Google OAuth 전용). 운영자 진입은 /operator로 분리.
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
            베타 운영 중 · 가입 즉시 이용
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
            주요 채널 통합 발행 · 24/7 자동 운영 · 피드백 루프
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={scrollToLogin}
              className="px-8 py-3 rounded-lg text-text font-semibold text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              베타 신청하기
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
          <p className="text-sm text-subtle">베타 기간 월 기본 제공량 내 무료입니다</p>
        </div>

        <div className="card p-8 max-w-md mx-auto text-center relative overflow-hidden">
          {/* Glow accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #4ade80, transparent)" }} />

          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
            베타 무료 제공
          </div>

          <h3 className="text-3xl font-bold text-text mb-1">Free</h3>
          <p className="text-sm text-subtle mb-8">₩0 / 월</p>

          <ul className="text-left space-y-3 mb-8">
            {[
              "주요 채널 연결",
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
            베타 신청하기
          </button>

          <p className="text-[10px] text-subtle mt-4">가입 즉시 대시보드 이용 가능 · 공유 AI 생성은 운영자 승인 또는 자체 Anthropic 키 등록 후 · 추후 Pro / Business 플랜 추가 예정</p>
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
            <p className="text-xs text-subtle">Google 계정으로 시작하고 내 브랜드 콘텐츠를 자동 생성·발행하세요</p>
          </div>

          {/* 고객 가입/로그인 — Google OAuth 전용 (중앙정렬된 /login 페이지) */}
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
            <a href="/privacy" className="text-xs text-subtle hover:text-muted transition-colors">
              개인정보처리방침
            </a>
            <a href="/terms" className="text-xs text-subtle hover:text-muted transition-colors">
              이용약관
            </a>
            <a href="/data-deletion" className="text-xs text-subtle hover:text-muted transition-colors">
              데이터 삭제
            </a>
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
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const isPublicPath = ["/login", "/signup", "/operator", "/privacy", "/terms", "/data-deletion"].includes(pathname);

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
    const operatorActive = () => { const t = getAuthToken(); return !!t && !isJwtToken(t); };
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

  // 계정 게이트: /api/me를 15초마다 폴링해 paused(정지)/accountUnavailable(알수없는 상태)만 화면분기.
  // OSMU v1.0.0부터 active 계정은 승인 대기 없이 즉시 대시보드에 진입한다(공유 AI 사용 승인은
  // 별도 entitlement — sharedAiApproved 플래그로 화면 내 quota 안내에만 쓰인다).
  // 운영자가 정지를 해제하면 수동 새로고침 없이 이 폴링으로 자동 해제된다.
  useEffect(() => {
    if (isPublicPath || !hasToken) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/me", { headers: authHeaders() });
        if (cancelled) return;
        if (res.status === 401) {
          // 세션 만료/무효 — fail-open으로 앱을 그냥 보여주면 승인/정지 게이트를 우회할 수 있으므로
          // 반드시 차단 화면으로 막고 안전한 로그아웃을 유도한다.
          setGateStatus("auth_error");
          return;
        }
        if (!res.ok) {
          // 403/5xx/기타 — 상태를 신뢰할 수 없으니 fail-closed. 재시도 가능한 서비스 확인 실패 화면.
          setGateStatus("service_error");
          return;
        }
        const data = await res.json().catch(() => null);
        if (!data) {
          setGateStatus("service_error");
          return;
        }
        if (data.accessPaused) setGateStatus("access_paused");
        else if (data.accountUnavailable) setGateStatus("account_unavailable");
        else setGateStatus("ok");
      } catch {
        if (!cancelled) setGateStatus("service_error");
      }
    }

    poll();
    const id = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isPublicPath, hasToken]);

  const doLogout = useCallback(async () => {
    const t = getAuthToken();
    // 고객(JWT) 세션은 Supabase 서버 세션도 함께 끊어야 안전한 로그아웃이다 — localStorage만
    // 지우면 refresh token이 남아 다른 탭/재접속에서 세션이 되살아날 수 있다. 운영자(비-JWT)
    // 토큰은 Supabase auth와 무관하므로 signOut을 호출하지 않는다.
    if (isJwtToken(t)) {
      try {
        const { createBrowserSupabase } = await import("@/lib/supabase");
        await createBrowserSupabase().auth.signOut();
      } catch {
        /* Supabase 세션 종료 실패해도 로컬 토큰은 반드시 지운다 */
      }
    }
    clearAuthToken();
    window.location.href = "/login";
  }, []);

  const doRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // 로그인/가입/운영자 콘솔은 인증 없이 풀스크린으로(진입점) — 사이드바·게이트 없이.
  if (isPublicPath) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  // SSR: localStorage 확인 전엔 아무것도 안 그림
  if (hasToken === null) return null;

  // 미인증: 랜딩(마케팅 + 로그인/회원가입 CTA → /login)
  if (!hasToken) return <LandingPage />;

  // 승인/정지 상태 확인 전에는 children을 절대 mount하지 않는다(fail-open 방지) — 확인 중 화면만 표시.
  if (gateStatus === "checking") {
    return (
      <div className="min-h-screen w-full bg-bg flex items-center justify-center px-6">
        <p className="text-sm text-subtle">확인 중...</p>
      </div>
    );
  }

  if (gateStatus === "auth_error") {
    return (
      <GateBlockScreen
        title="세션이 만료되었습니다"
        desc="보안을 위해 다시 로그인해주세요."
        onRefresh={doRefresh}
        onLogout={doLogout}
      />
    );
  }

  if (gateStatus === "service_error") {
    return (
      <GateBlockScreen
        title="서비스 확인 실패"
        desc="계정 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요."
        onRefresh={doRefresh}
        onLogout={doLogout}
      />
    );
  }

  if (gateStatus === "access_paused") {
    return (
      <GateBlockScreen
        title="계정 이용이 중지되었습니다"
        desc="문의사항은 운영팀에 연락해주세요."
        onRefresh={doRefresh}
        onLogout={doLogout}
      />
    );
  }

  if (gateStatus === "account_unavailable") {
    return (
      <GateBlockScreen
        title="계정 상태를 확인할 수 없습니다"
        desc="일시적인 문제일 수 있습니다. 잠시 후 다시 시도하거나 운영팀에 문의해주세요."
        onRefresh={doRefresh}
        onLogout={doLogout}
      />
    );
  }

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
