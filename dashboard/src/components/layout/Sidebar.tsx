"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { useCronStatus } from "@/hooks/useOverview";
import { CH_LABELS, IMPLEMENTED_PLUGINS } from "@/lib/constants";
import { useUIStore } from "@/store/ui-store";
import { fetcher } from "@/lib/api";

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
  const collapsed = sidebarCollapsed[groupKey] ?? liveCount === 0;

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
          if (i.nav && !i.soon && i.key) {
            const href = i.key === "blog" ? "/blog" : `/channels/${i.key}`;
            const isActive = i.key === "blog" ? pathname === "/blog" : pathname === `/channels/${i.key}`;
            return (
              <Link
                key={i.key}
                href={href}
                className={`sidebar-item ${isActive ? "active" : ""} w-full text-left px-4 py-1.5 text-sm text-gray-300 flex items-center gap-3`}
              >
                <span
                  className={`w-4 h-4 rounded ${i.iconClass || "bg-gray-800 text-gray-400"} flex items-center justify-center text-[9px] font-bold`}
                >
                  {i.icon}
                </span>
                {i.label}
                {i.status && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${i.statusClass || "bg-gray-800 text-gray-500"}`}>
                    {i.status}
                  </span>
                )}
              </Link>
            );
          }
          return (
            <div key={`${i.label}-${idx}`} className="px-4 py-1 text-[12px] text-gray-700 flex items-center gap-3 opacity-40">
              <span className="w-4 h-4 rounded bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-600">
                {i.icon}
              </span>
              {i.label} <span className="ml-auto text-[9px] text-gray-800">Soon</span>
            </div>
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

  if (!isImplemented) {
    return { label, icon: label[0], soon: true };
  }

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
  if (status === "available" || isImplemented) {
    return { key, label, icon: label[0], nav: true };
  }
  return { label, icon: label[0], soon: true };
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
          <h1 className="text-base font-semibold text-white tracking-tight">Marketing Hub</h1>
          <a
            href="https://www.threads.net/@code_zero_to_one"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-white transition-colors"
            title="Threads"
          >
            <svg width="14" height="14" viewBox="0 0 192 192" fill="currentColor">
              <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.398c-15.09 0-27.701 6.494-35.174 18.033l12.626 8.657c5.58-8.432 14.39-11.18 22.55-11.18h.27c8.736.054 15.322 2.593 19.58 7.543 3.098 3.603 5.17 8.564 6.207 14.88a84.463 84.463 0 0 0-24.478-2.26c-28.04 1.588-46.072 17.2-44.828 38.823.636 11.06 6.348 20.587 16.087 26.834 8.235 5.286 18.852 7.87 29.884 7.273 14.566-.787 25.993-6.395 33.99-16.672 6.075-7.806 9.977-17.782 11.756-30.168 7.057 4.26 12.3 9.848 15.287 16.7 5.07 11.637 5.367 30.735-10.4 46.483-13.836 13.81-30.477 19.782-52.477 19.958-24.416-.195-42.862-7.988-54.83-23.16C39.32 152.595 32.87 132.376 32.66 108c.21-24.376 6.66-44.595 19.176-60.082C63.795 32.633 82.24 24.84 106.657 24.645c24.584.2 43.285 8.028 55.573 23.273 6.028 7.482 10.575 16.644 13.584 27.283l14.868-3.936c-3.538-12.496-8.96-23.379-16.234-32.409C159.396 20.263 137.058 10.812 106.717 10.6h-.078C76.322 10.812 54.282 20.316 39.52 39.13 23.478 59.546 15.375 86.757 15.13 108l.002.283c.245 21.243 8.348 48.454 24.39 68.87 14.762 18.814 36.802 28.318 67.143 28.53h.078c26.006-.2 46.643-8.082 63.29-24.163 22.095-21.358 21.478-47.567 14.568-63.42-4.954-11.377-14.452-20.548-27.064-26.112z" />
            </svg>
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">openclaw-auto</p>
      </div>

      <nav className="flex-1 py-3">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Overview</span>
        </div>
        <Link
          href="/"
          className={`sidebar-item ${pathname === "/" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3`}
        >
          <span className="text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </span>
          Marketing Home
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
            { label: "Kakao Channel", icon: "K", soon: true },
            { label: "WhatsApp", icon: "W", soon: true },
          ]}
        />

        <SidebarGroup
          groupKey="data"
          title="Data & SEO"
          items={[
            { label: "Google Analytics", icon: "GA", soon: true },
            { label: "Search Console", icon: "SC", soon: true },
            { label: "SEO Keywords", icon: "KW", soon: true },
            { label: "Google Business", icon: "GB", soon: true },
          ]}
        />

        <SidebarGroup
          groupKey="custom"
          title="Custom Integration"
          items={[
            { key: "blog", label: "Blog", icon: "B", nav: true },
            { label: "Custom API", icon: "+", soon: true },
            { label: "Webhook", icon: "W", soon: true },
            { label: "RSS Feed", icon: "R", soon: true },
          ]}
        />

        <div className="px-3 mt-5 mb-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Assets</span>
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
