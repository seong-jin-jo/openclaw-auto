"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import {
  CH_LABELS,
  PUBLISH_CHANNEL_GROUPS,
  VIDEO_PUBLISH_PLATFORMS,
} from "@/lib/constants";
import { getChannelIcon } from "@/lib/channel-icons";
import { useUIStore, type Workspace } from "@/store/ui-store";
import { fetcher } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";

interface MeResponse {
  isOperator?: boolean;
  tenant?: Workspace | null;
  tenantError?: boolean;
}

/* ── Sidebar Group ── */
function SidebarGroup({
  groupKey,
  title,
  items,
}: {
  groupKey: string;
  title: string;
  items: Array<{
    key?: string;
    href?: string;
    label: string;
    icon: string;
    iconClass?: string;
    nav?: boolean;
    soon?: boolean;
    status?: string;
    statusClass?: string;
  }>;
}) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const liveCount = items.filter((i) => i.status === "Live" || i.status === "Connected").length;
  const totalCount = items.length;
  const collapsed = sidebarCollapsed[groupKey] ?? false; // 기본 펼침 (사용자가 접으면 그 상태 유지)

  return (
    <div className="mt-4">
      <button
        onClick={() => toggleSidebar(groupKey)}
        className="px-3 mb-1 w-full flex items-center justify-between cursor-pointer hover:opacity-80"
      >
        <span className="text-caption font-medium text-subtle uppercase tracking-wider">{title}</span>
        <span className="flex items-center gap-1">
          {totalCount > 0 && (
            <span className={`text-caption ${liveCount > 0 ? "text-green-600" : "text-subtle"}`}>
              {liveCount}/{totalCount}
            </span>
          )}
          <svg
            className={`w-3 h-3 text-subtle transition-transform ${collapsed ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {!collapsed &&
        items.map((i, idx) => {
          const href = i.href ?? (i.key === "blog" ? "/blog" : i.key ? `/channels/${i.key}` : "#");
          const hrefPath = href.split(/[?#]/, 1)[0];
          const isActive = pathname === hrefPath;
          const textColor = i.status === "Live" || i.status === "Connected" ? "text-muted" : "text-subtle";
          return (
            <Link
              key={i.key || `${i.label}-${idx}`}
              href={href}
              className={`sidebar-item ${isActive ? "active" : ""} w-full text-left px-4 py-1.5 text-sm ${textColor} flex items-center gap-3`}
            >
              <span
                className={`w-4 h-4 rounded ${i.iconClass || "text-subtle"} flex items-center justify-center`}
              >
                {i.key ? getChannelIcon(i.key) : <span className="text-caption font-bold">{i.icon}</span>}
              </span>
              {i.label}
              {i.status && (
                <span className={`ml-auto text-caption px-1.5 py-0.5 rounded-full ${i.statusClass || "bg-surface-2 text-subtle"}`}>
                  {i.status}
                </span>
              )}
            </Link>
          );
        })}
    </div>
  );
}

/* ── Helper: build sidebar item from channel config ── */
function chSidebarItem(key: string, channelConfig: Record<string, Record<string, unknown>>) {
  const ch = channelConfig[key] || {};
  const status = (ch.status as string) || "soon";
  const label = CH_LABELS[key] || key;

  if (status === "live") {
    return {
      key,
      label,
      icon: label[0],
      nav: true,
      status: "Live" as const,
      statusClass: "bg-success/15 text-success",
    };
  }
  if (status === "connected") {
    return {
      key,
      label,
      icon: label[0],
      nav: true,
      status: "Connected" as const,
      statusClass: "bg-accent/15 text-accent",
    };
  }
  // 미연결 — 클릭 가능, 흰 글씨
  return { key, label, icon: label[0], nav: true };
}

/* ── 고객 워크스페이스 identity (운영자 shell과 완전 분리) ── */
function CustomerWorkspaceIdentity({
  me,
  mutateMe,
}: {
  me: MeResponse;
  mutateMe: () => Promise<unknown>;
}) {
  const { activeWorkspace, setActiveWorkspace } = useUIStore();

  // 고객은 /api/me가 반환한 자기 테넌트만 활성화한다.
  // ⚠️ 반드시 "값이 실제로 바뀔 때만" set. 무조건 set하면 set→재렌더→effect→set 무한 루프(React 오류 185).
  // 로그아웃 직후에는 이전 /api/me 응답이 남아 있어도 workspace를 다시 persist하지 않는다.
  useEffect(() => {
    if (me.tenant && getAuthToken()) {
      if (activeWorkspace?.id !== me.tenant.id) setActiveWorkspace(me.tenant);
    }
  }, [me.tenant, activeWorkspace?.id, setActiveWorkspace]);

  // 테넌트 해석 실패(세션 만료/일시적 DB 오류 등) — 명시적 재시도 경로 제공.
  if (me.tenantError) {
    return (
      <button onClick={() => void mutateMe()} className="mt-1 text-xs text-subtle hover:text-muted">
        워크스페이스 연결 확인 중… <span className="underline">다시 시도</span>
      </button>
    );
  }

  return (
    <div className="mt-1 text-xs">
      <span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent font-medium">
        {me.tenant?.name || activeWorkspace?.name || "내 워크스페이스"}
      </span>
    </div>
  );
}

function SidebarFooter({ isOperator }: { isOperator: boolean }) {
  const setActiveWorkspace = useUIStore((state) => state.setActiveWorkspace);

  return (
    <div className="shrink-0 px-4 py-3 border-t border-border/50 space-y-2">
      <ThemeToggle />
      <button
        onClick={async () => {
          try {
            const { createBrowserSupabase } = await import("@/lib/supabase");
            await createBrowserSupabase().auth.signOut();
          } catch { /* env 미설정/세션 없음 무시 */ }
          clearAuthToken();
          setActiveWorkspace(null);
          window.location.href = isOperator ? "/operator" : "/login";
        }}
        className="w-full flex items-center gap-2 px-1 py-1 text-xs text-subtle hover:text-danger transition-colors"
        title="로그아웃"
      >
        <span>⎋</span> 로그아웃
      </button>
    </div>
  );
}

function OperatorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-border/50 bg-surface flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted shrink-0" aria-label="Admin">
            <rect x="3" y="3" width="18" height="18" rx="5" fill="var(--accent)" opacity="0.25" />
            <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h1 className="text-base font-semibold text-text tracking-tight">Admin</h1>
        </div>
        <p className="mt-1 text-xs text-subtle">운영자 콘솔</p>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto py-3">
        <div className="px-3 mb-2">
          <span className="text-caption font-medium text-subtle uppercase tracking-wider">Operator</span>
        </div>
        <Link
          href="/operator/customers"
          className={`sidebar-item ${pathname === "/operator/customers" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-muted flex items-center gap-3`}
        >
          <span className="text-accent" aria-hidden>◎</span>
          고객 관리
        </Link>
      </nav>

      <SidebarFooter isOperator />
    </aside>
  );
}

/* ── Customer Sidebar ── */
function CustomerSidebar({
  me,
  mutateMe,
}: {
  me: MeResponse;
  mutateMe: () => Promise<unknown>;
}) {
  const pathname = usePathname();
  const { data: channelConfig } = useChannelConfig();
  const { data: images } = useSWR<unknown[]>("/api/images", fetcher);

  const cfg = (channelConfig || {}) as unknown as Record<string, Record<string, unknown>>;
  const imageCount = Array.isArray(images) ? images.length : 0;

  // Build threads item specially
  const threadsItem = {
    key: "threads",
    label: "Threads",
    icon: "T",
    iconClass: "bg-accent text-text",
    nav: true,
    status: (cfg.threads?.connected ? "Live" : "Off") as string,
    statusClass: cfg.threads?.connected
      ? "bg-success/15 text-success"
      : "bg-surface-2 text-subtle",
  };

  // Build X item specially
  const xItem = {
    key: "x",
    label: "X (Twitter)",
    icon: "X",
    nav: true,
    status: cfg.x?.connected
      ? cfg.x?.enabled
        ? "Live"
        : "Connected"
      : ("" as string),
    statusClass: cfg.x?.connected
      ? cfg.x?.enabled
        ? "bg-success/15 text-success"
        : "bg-accent/15 text-accent"
      : "",
  };

  return (
    <aside className="w-56 border-r border-border/50 bg-surface flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-border/50">
        <div className="flex items-center gap-2">
          {/* 로고 — 스택형(채널 레이어) 마크. 실 로고는 public/logo.svg 교체. */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted shrink-0" aria-label="Marketing Hub">
            <rect x="3" y="3" width="13" height="13" rx="4.2" fill="currentColor" opacity="0.3" />
            <rect x="8" y="8" width="13" height="13" rx="4.2" fill="var(--accent)" />
          </svg>
          <h1 className="text-base font-semibold text-text tracking-tight">Marketing Hub</h1>
        </div>
        <CustomerWorkspaceIdentity me={me} mutateMe={mutateMe} />
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto py-3">
        <div className="px-3 mb-2">
          <span className="text-caption font-medium text-subtle uppercase tracking-wider">Overview</span>
        </div>
        <Link
          href="/"
          className={`sidebar-item ${pathname === "/" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-muted flex items-center gap-3`}
        >
          <span className="text-accent">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </span>
          성과
        </Link>


        <Link
          href="/studio"
          className={`sidebar-item ${pathname === "/studio" ? "active" : ""} w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${pathname === "/studio" ? "text-text" : "text-muted"}`}
        >
          <span className="text-accent">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L22 12l-6.714 2.143L13 21l-2.286-6.857L4 12l6.714-2.143L13 3z" />
            </svg>
          </span>
          OSMU Studio
          <span className="ml-auto text-caption px-1.5 py-0.5 rounded-full bg-accent-soft text-accent">NEW</span>
        </Link>

        <Link
          href="/inbox"
          className={`sidebar-item ${pathname === "/inbox" ? "active" : ""} w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${pathname === "/inbox" ? "text-text" : "text-muted"}`}
        >
          <span className="text-green-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
            </svg>
          </span>
          승인 인박스
          <span className="ml-auto text-caption px-1.5 py-0.5 rounded-full bg-success/15 text-success">NEW</span>
        </Link>

        <Link
          href="/calendar"
          className={`sidebar-item ${pathname === "/calendar" ? "active" : ""} w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${pathname === "/calendar" ? "text-text" : "text-muted"}`}
        >
          <span className="text-accent">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </span>
          발행 캘린더
        </Link>

        {/* 발행 채널 그룹 — constants의 PUBLISH_CHANNEL_GROUPS 단일 소스(Settings>Channels와 동일).
            threads/x는 연결상태 뱃지가 특수해 별도 아이템 유지. */}
        {PUBLISH_CHANNEL_GROUPS.map((g) => (
          <SidebarGroup
            key={g.key}
            groupKey={g.key}
            title={g.title}
            items={g.channels.map((ch) =>
              ch === "threads" ? threadsItem : ch === "x" ? xItem : chSidebarItem(ch, cfg),
            )}
          />
        ))}

        {/* 영상 채널 계정 관리는 provider별 독립 경로다.
            공용 영상 라이브러리/발행 작업실(/videos)과 SCHEDULABLE_PLATFORMS에는 섞지 않는다. */}
        <SidebarGroup
          groupKey="video"
          title="Video"
          items={VIDEO_PUBLISH_PLATFORMS.map((provider) => ({
            key: provider,
            href: `/channels/${provider}`,
            label: CH_LABELS[provider],
            icon: CH_LABELS[provider][0],
            nav: true,
          }))}
        />

        {/* "Data & SEO" 채널 그룹 제거 — /channels/* 빈 연결폼으로 가던 죽은 항목이었음.
            동작하는 읽기 대시보드는 아래 "Data & Analytics" 섹션이 제공(사이드바=연결가능 원칙). */}

        {/* ── Data & Analytics ── */}
        <div className="px-3 mt-5 mb-2">
          <span className="text-caption font-medium text-subtle uppercase tracking-wider">Data & Analytics</span>
        </div>
        {[
          { href: "/blog-performance", key: "blog_performance", label: "Blog Performance" },
        ].map((item) => (
          <Link key={item.key} href={item.href}
            className={`sidebar-item ${pathname === item.href ? "active" : ""} w-full text-left px-4 py-1.5 text-sm text-muted flex items-center gap-3`}>
            <span className="w-4 h-4 rounded text-subtle flex items-center justify-center">{getChannelIcon(item.key)}</span>
            {item.label}
          </Link>
        ))}

        {/* ── Keyword Research ── */}
        <div className="px-3 mt-5 mb-2">
          <span className="text-caption font-medium text-subtle uppercase tracking-wider">Keyword Research</span>
        </div>
        {[
          { href: "/keyword-planner", key: "keyword_planner", label: "Keyword Planner" },
          { href: "/naver-trends", key: "naver_trends", label: "Naver Trends" },
          { href: "/google-trends", key: "google_trends", label: "Google Trends" },
        ].map((item) => (
          <Link key={item.key} href={item.href}
            className={`sidebar-item ${pathname === item.href ? "active" : ""} w-full text-left px-4 py-1.5 text-sm text-muted flex items-center gap-3`}>
            <span className="w-4 h-4 rounded text-subtle flex items-center justify-center">{getChannelIcon(item.key)}</span>
            {item.label}
          </Link>
        ))}

        {/* Custom Integration: custom_api/rss는 연결 미구현(빈 페이지)이라 제거. Blog만 노출(→/blog 동작). */}
        <SidebarGroup
          groupKey="custom"
          title="Custom Integration"
          items={[
            { key: "blog", label: "Blog", icon: "B", nav: true },
          ]}
        />

        <div className="px-3 mt-5 mb-2">
          <span className="text-caption font-medium text-subtle uppercase tracking-wider">Assets & Tools</span>
        </div>
        <Link
          href="/images"
          className={`sidebar-item ${pathname === "/images" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-muted flex items-center gap-3`}
        >
          <svg className="w-4 h-4 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Images
          <span className="ml-auto text-caption px-1.5 py-0.5 rounded-full bg-surface-2 text-subtle">{imageCount}</span>
        </Link>
        <Link
          href="/videos"
          className={`sidebar-item ${pathname === "/videos" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-muted flex items-center gap-3`}
        >
          <svg className="w-4 h-4 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Videos
        </Link>
        {(() => {
          const mjCfg = cfg.midjourney || {};
          return (
            <Link
              href="/channels/midjourney"
              className={`sidebar-item ${pathname === "/channels/midjourney" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-muted flex items-center gap-3`}
            >
              <span className="w-4 h-4 rounded bg-indigo-900/50 flex items-center justify-center text-caption font-bold text-indigo-300">MJ</span>
              Midjourney
              <span className={`ml-auto w-2 h-2 rounded-full ${mjCfg.connected ? "bg-green-500" : "bg-surface-2"}`} />
            </Link>
          );
        })()}

        <div className="px-3 mt-5 mb-2">
          <span className="text-caption font-medium text-subtle uppercase tracking-wider">System</span>
        </div>
        <Link
          href="/settings"
          className={`sidebar-item ${pathname === "/settings" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-muted flex items-center gap-3`}
        >
          <svg className="w-4 h-4 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </Link>
      </nav>

      <SidebarFooter isOperator={false} />
    </aside>
  );
}

/* ── Identity-aware shell router ── */
export function Sidebar() {
  const { data: me, mutate } = useSWR<MeResponse>("/api/me", fetcher);
  const setActiveWorkspace = useUIStore((state) => state.setActiveWorkspace);

  // AuthGate가 operator identity를 확인할 때 먼저 지우지만, Sidebar도 직접 진입/identity 전환을
  // 방어한다. 운영자 shell은 어떤 customer workspace도 읽거나 표시하지 않는다.
  useEffect(() => {
    if (me?.isOperator) setActiveWorkspace(null);
  }, [me?.isOperator, setActiveWorkspace]);

  if (!me) return null;
  if (me.isOperator) return <OperatorSidebar />;
  return <CustomerSidebar me={me} mutateMe={mutate} />;
}
