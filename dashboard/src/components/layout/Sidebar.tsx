"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { useCronStatus } from "@/hooks/useOverview";
import { CH_LABELS, IMPLEMENTED_PLUGINS } from "@/lib/constants";
import { getChannelIcon } from "@/lib/channel-icons";
import { useUIStore, type Workspace } from "@/store/ui-store";
import { fetcher, apiPost } from "@/lib/api";

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
        <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">{title}</span>
        <span className="flex items-center gap-1">
          {totalCount > 0 && (
            <span className={`text-[9px] ${liveCount > 0 ? "text-green-600" : "text-gray-700"}`}>
              {liveCount}/{totalCount}
            </span>
          )}
          <svg
            className={`w-3 h-3 text-gray-700 transition-transform ${collapsed ? "" : "rotate-180"}`}
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
          const href = i.key === "blog" ? "/blog" : i.key ? `/channels/${i.key}` : "#";
          const isActive = i.key === "blog" ? pathname === "/blog" : pathname === `/channels/${i.key}`;
          const textColor = i.status === "Live" || i.status === "Connected" ? "text-gray-300" : "text-gray-500";
          return (
            <Link
              key={i.key || `${i.label}-${idx}`}
              href={href}
              className={`sidebar-item ${isActive ? "active" : ""} w-full text-left px-4 py-1.5 text-sm ${textColor} flex items-center gap-3`}
            >
              <span
                className={`w-4 h-4 rounded ${i.iconClass || "text-gray-400"} flex items-center justify-center`}
              >
                {i.key ? getChannelIcon(i.key) : <span className="text-[9px] font-bold">{i.icon}</span>}
              </span>
              {i.label}
              {i.status && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${i.statusClass || "bg-gray-800 text-gray-500"}`}>
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
  const isImplemented = IMPLEMENTED_PLUGINS.includes(key);

  if (status === "live") {
    return {
      key,
      label,
      icon: label[0],
      nav: true,
      status: "Live" as const,
      statusClass: "bg-green-900/50 text-green-400",
    };
  }
  if (status === "connected") {
    return {
      key,
      label,
      icon: label[0],
      nav: true,
      status: "Connected" as const,
      statusClass: "bg-blue-900/50 text-blue-400",
    };
  }
  // 미연결 — 클릭 가능, 흰 글씨
  return { key, label, icon: label[0], nav: true };
}

/* ── 워크스페이스 전환 (멀티테넌트, 같은 인스턴스 내) ── */
function WorkspaceSwitcher() {
  // 고객/운영자 모드 판별: 고객은 자기 테넌트 1개만, 운영자만 전체 목록·전환·생성.
  const { data: me } = useSWR<{ isOperator?: boolean; tenant?: Workspace | null }>("/api/me", fetcher);
  const isOperator = me?.isOperator === true;
  // 운영자만 전체 워크스페이스 조회(고객은 호출 안 함 → 남의 서비스명 노출 0)
  const { data, mutate } = useSWR<{ workspaces?: Workspace[] }>(isOperator ? "/api/workspaces" : null, fetcher);
  const { activeWorkspace, setActiveWorkspace } = useUIStore();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  // data?.workspaces || [] 를 매 렌더 새 배열로 만들면 아래 useEffect dep가 매번 바뀌어
  // 무한 루프(React #185) 유발 → 메모이즈로 안정화.
  const workspaces = useMemo(() => data?.workspaces || [], [data]);

  // 활성 워크스페이스: 고객=자기 테넌트 고정 / 운영자=첫 워크스페이스 자동선택.
  // ⚠️ 반드시 "값이 실제로 바뀔 때만" set — 무조건 set하면 set→재렌더→effect→set 무한 루프(React #185).
  useEffect(() => {
    if (!isOperator && me?.tenant) {
      if (activeWorkspace?.id !== me.tenant.id) setActiveWorkspace(me.tenant);
      return;
    }
    if (isOperator && !activeWorkspace && workspaces.length > 0) setActiveWorkspace(workspaces[0]);
  }, [isOperator, me, activeWorkspace, workspaces, setActiveWorkspace]);

  // 고객 모드: 스위처·목록·생성 전부 숨기고 자기 워크스페이스명만 표시(남의 서비스명 0)
  if (!isOperator) {
    return (
      <div className="mt-1 text-xs">
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-medium">{me?.tenant?.name || activeWorkspace?.name || "내 워크스페이스"}</span>
      </div>
    );
  }

  const create = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const r = await apiPost<{ workspace?: Workspace }>("/api/workspaces", { slug, name: name.trim() });
      if (r?.workspace) { await mutate(); setActiveWorkspace(r.workspace); }
      setName(""); setAdding(false); setOpen(false);
    } finally { setBusy(false); }
  };

  return (
    <div className="relative mt-1">
      <button onClick={() => setOpen((v) => !v)} className="text-xs flex items-center gap-1 hover:opacity-80">
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-medium">{activeWorkspace?.name || "워크스페이스 선택"}</span>
        <span className="text-gray-600">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-50 w-52 rounded-lg border border-gray-800 bg-[#141414] p-1 shadow-xl">
          {workspaces.map((w) => (
            <button key={w.id} onClick={() => { setActiveWorkspace(w); setOpen(false); }} className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 ${activeWorkspace?.id === w.id ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"}`}>
              <span className="flex-1 truncate">{w.name}</span>
              {activeWorkspace?.id === w.id && <span className="text-[9px] text-green-500">●</span>}
            </button>
          ))}
          {workspaces.length === 0 && <div className="text-[10px] text-gray-600 px-2 py-1.5">워크스페이스 없음 — 등록하세요</div>}
          <div className="border-t border-gray-800 mt-1 pt-1">
            {adding ? (
              <div className="px-1 py-1 flex gap-1">
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder="워크스페이스 이름" className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 min-w-0" />
                <button onClick={create} disabled={busy} className="text-xs px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded disabled:opacity-50">{busy ? "..." : "생성"}</button>
              </div>
            ) : (
              <button onClick={() => setAdding(true)} className="w-full text-left px-2 py-1.5 text-xs text-purple-400 hover:bg-gray-800 rounded">+ 새 워크스페이스</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Sidebar ── */
export function Sidebar() {
  const pathname = usePathname();
  const { data: channelConfig } = useChannelConfig();
  const { data: cronData } = useCronStatus();
  const { data: images } = useSWR<unknown[]>("/api/images", fetcher);

  const cfg = (channelConfig || {}) as unknown as Record<string, Record<string, unknown>>;
  const cronJobs = (((cronData as Record<string, unknown>)?.jobs || cronData || []) as Array<Record<string, unknown>>);
  const cronOk = cronJobs.filter((j) => j.lastStatus === "ok").length;
  const cronTotal = cronJobs.length;
  const imageCount = Array.isArray(images) ? images.length : 0;

  // Build threads item specially
  const threadsItem = {
    key: "threads",
    label: "Threads",
    icon: "T",
    iconClass: "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
    nav: true,
    status: (cfg.threads?.connected ? "Live" : "Off") as string,
    statusClass: cfg.threads?.connected
      ? "bg-green-900/50 text-green-400"
      : "bg-gray-800 text-gray-500",
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
        ? "bg-green-900/50 text-green-400"
        : "bg-blue-900/50 text-blue-400"
      : "",
  };

  return (
    <aside className="w-56 border-r border-gray-800/50 flex flex-col h-screen sticky top-0" style={{ background: "#0e0e0e" }}>
      <div className="px-4 py-5 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          {/* 로고: 실제 로고로 교체하려면 public/logo.svg 추가 후 <img src="/logo.svg" .../>로 바꾸면 됨. (스레드 로고 제거) */}
          <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm select-none">O</span>
          <h1 className="text-base font-semibold text-white tracking-tight">Marketing Hub</h1>
        </div>
        <WorkspaceSwitcher />
      </div>

      <nav className="flex-1 py-3">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Overview</span>
        </div>
        <Link
          href="/"
          className={`sidebar-item ${pathname === "/" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3`}
        >
          <span className="text-pink-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </span>
          성과
        </Link>


        <Link
          href="/studio"
          className={`sidebar-item ${pathname === "/studio" ? "active" : ""} w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${pathname === "/studio" ? "text-white" : "text-gray-200"}`}
        >
          <span className="text-purple-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L22 12l-6.714 2.143L13 21l-2.286-6.857L4 12l6.714-2.143L13 3z" />
            </svg>
          </span>
          OSMU Studio
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-purple-900/50 text-purple-300">NEW</span>
        </Link>

        <Link
          href="/inbox"
          className={`sidebar-item ${pathname === "/inbox" ? "active" : ""} w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${pathname === "/inbox" ? "text-white" : "text-gray-200"}`}
        >
          <span className="text-green-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
            </svg>
          </span>
          승인 인박스
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-green-900/50 text-green-300">NEW</span>
        </Link>

        <Link
          href="/calendar"
          className={`sidebar-item ${pathname === "/calendar" ? "active" : ""} w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${pathname === "/calendar" ? "text-white" : "text-gray-200"}`}
        >
          <span className="text-blue-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </span>
          발행 캘린더
        </Link>

        <SidebarGroup
          groupKey="social"
          title="Social"
          items={[
            threadsItem,
            xItem,
            ...["instagram", "facebook", "linkedin", "bluesky", "pinterest", "tumblr"].map((ch) => chSidebarItem(ch, cfg)),
          ]}
        />

        <SidebarGroup
          groupKey="video"
          title="Video"
          items={["tiktok", "youtube"].map((ch) => chSidebarItem(ch, cfg))}
        />

        <SidebarGroup
          groupKey="blog"
          title="Blog"
          items={[
            chSidebarItem("naver_blog", cfg),
            { label: "Medium", icon: "M", soon: true },
            { label: "Substack", icon: "S", soon: true },
          ]}
        />

        <SidebarGroup
          groupKey="messaging"
          title="Messaging"
          items={[
            ...["telegram", "discord", "slack", "line"].map((ch) => chSidebarItem(ch, cfg)),
            { key: "kakao", label: "Kakao Channel", icon: "K", nav: true },
            { key: "whatsapp", label: "WhatsApp", icon: "W", nav: true },
          ]}
        />

        <SidebarGroup
          groupKey="data"
          title="Data & SEO"
          items={[
            { key: "google_analytics", label: "Google Analytics", icon: "GA", nav: true },
            { key: "search_console", label: "Search Console", icon: "SC", nav: true },
            { key: "seo_keywords", label: "SEO Keywords", icon: "KW", nav: true },
            { key: "google_business", label: "Google Business", icon: "GB", nav: true },
          ]}
        />

        {/* ── Data & Analytics ── */}
        <div className="px-3 mt-5 mb-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Data & Analytics</span>
        </div>
        {[
          { href: "/blog-performance", key: "blog_performance", label: "Blog Performance" },
          { href: "/search-console", key: "search_console", label: "Search Console" },
          { href: "/google-analytics", key: "google_analytics", label: "Google Analytics" },
        ].map((item) => (
          <Link key={item.key} href={item.href}
            className={`sidebar-item ${pathname === item.href ? "active" : ""} w-full text-left px-4 py-1.5 text-sm text-gray-300 flex items-center gap-3`}>
            <span className="w-4 h-4 rounded text-gray-400 flex items-center justify-center">{getChannelIcon(item.key)}</span>
            {item.label}
          </Link>
        ))}

        {/* ── Keyword Research ── */}
        <div className="px-3 mt-5 mb-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Keyword Research</span>
        </div>
        {[
          { href: "/keyword-planner", key: "keyword_planner", label: "Keyword Planner" },
          { href: "/search-advisor", key: "search_advisor", label: "Search Advisor" },
          { href: "/naver-trends", key: "naver_trends", label: "Naver Trends" },
          { href: "/google-trends", key: "google_trends", label: "Google Trends" },
        ].map((item) => (
          <Link key={item.key} href={item.href}
            className={`sidebar-item ${pathname === item.href ? "active" : ""} w-full text-left px-4 py-1.5 text-sm text-gray-300 flex items-center gap-3`}>
            <span className="w-4 h-4 rounded text-gray-400 flex items-center justify-center">{getChannelIcon(item.key)}</span>
            {item.label}
          </Link>
        ))}

        <SidebarGroup
          groupKey="custom"
          title="Custom Integration"
          items={[
            { key: "blog", label: "Blog", icon: "B", nav: true },
            { key: "custom_api", label: "Custom API", icon: "+", nav: true },
            { key: "rss", label: "RSS Feed", icon: "R", nav: true },
          ]}
        />

        <div className="px-3 mt-5 mb-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Assets & Tools</span>
        </div>
        <Link
          href="/images"
          className={`sidebar-item ${pathname === "/images" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3`}
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Images
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500">{imageCount}</span>
        </Link>
        <Link
          href="/videos"
          className={`sidebar-item ${pathname === "/videos" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3`}
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className={`sidebar-item ${pathname === "/channels/midjourney" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3`}
            >
              <span className="w-4 h-4 rounded bg-indigo-900/50 flex items-center justify-center text-[8px] font-bold text-indigo-300">MJ</span>
              Midjourney
              <span className={`ml-auto w-2 h-2 rounded-full ${mjCfg.connected ? "bg-green-500" : "bg-gray-700"}`} />
            </Link>
          );
        })()}

        <div className="px-3 mt-5 mb-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">System</span>
        </div>
        <Link
          href="/settings"
          className={`sidebar-item ${pathname === "/settings" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3`}
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <div className="px-4 py-3 border-t border-gray-800/50 space-y-2">
        <div className="flex items-center gap-2">
          <div className={`pulse-dot ${cronOk === cronTotal ? "bg-green-500" : "bg-yellow-500"}`} />
          <span className="text-xs text-gray-500">
            {cronOk}/{cronTotal} crons ok
          </span>
        </div>
      </div>
    </aside>
  );
}
