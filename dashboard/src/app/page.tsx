"use client";

import { useOverview, useCronStatus, useActivity, useAlerts, useWeeklySummary, useTokenStatus, useAgentLogs } from "@/hooks/useOverview";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { fmtAgo, fmtTime } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import Link from "next/link";

function card(title: string, value: string | number, sub?: string) {
  return (
    <div className="card p-4">
      <p className="text-[11px] text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const ALL_CHANNELS = [
  { key: "threads", label: "Threads", icon: "T", iconClass: "bg-gradient-to-br from-purple-500 to-pink-500 text-white" },
  { key: "x", label: "X", icon: "X" },
  { key: "instagram", label: "Instagram", icon: "IG" },
  { key: "facebook", label: "Facebook", icon: "F" },
  { key: "bluesky", label: "Bluesky", icon: "BS" },
  { key: "linkedin", label: "LinkedIn", icon: "LI" },
  { key: "tiktok", label: "TikTok", icon: "TK" },
  { key: "youtube", label: "YouTube", icon: "YT" },
  { key: "telegram", label: "Telegram", icon: "TG" },
  { key: "discord", label: "Discord", icon: "DC" },
  { key: "slack", label: "Slack", icon: "SL" },
  { key: "pinterest", label: "Pinterest", icon: "P" },
];

export default function HomePage() {
  const { data: overview } = useOverview();
  const { data: cronData } = useCronStatus();
  const { data: activityData } = useActivity();
  const { data: alertData } = useAlerts();
  const { data: weeklyData } = useWeeklySummary();
  const { data: tokenData } = useTokenStatus();
  const { data: agentLogData } = useAgentLogs();
  const { data: channelConfig } = useChannelConfig();
  const { dismissedOnboarding, dismissOnboarding } = useUIStore();

  const o = overview as Record<string, unknown> | undefined;
  const cfg = (channelConfig || {}) as unknown as Record<string, Record<string, unknown>>;
  const cronJobs = (((cronData as Record<string, unknown>)?.jobs || cronData || []) as Array<Record<string, unknown>>);
  const activity = (((activityData as Record<string, unknown>)?.events || []) as Array<Record<string, unknown>>);
  const alerts = (((alertData as Record<string, unknown>)?.alerts || []) as Array<Record<string, unknown>>);
  const weekly = weeklyData as Record<string, unknown> | undefined;
  const tokenStatus = tokenData as Record<string, unknown> | undefined;
  const agentLogs = (((agentLogData as Record<string, unknown>)?.logs || []) as Array<Record<string, unknown>>);

  if (!o) return <div className="px-8 py-6"><p className="text-gray-500">Loading...</p></div>;

  const sc = (o.statusCounts || {}) as Record<string, number>;
  const cc = (o.channelCounts || {}) as Record<string, number>;
  const totalPub = sc.published || 0;

  // Onboarding check
  const connectedCount = Object.values(cfg).filter((c) => c.connected || c.status === "live").length;

  if (connectedCount === 0 && !dismissedOnboarding) {
    return (
      <div className="px-8 py-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-3">마케팅 자동화를 시작하세요</h2>
          <p className="text-gray-400 mb-8">채널을 연결하면 AI가 콘텐츠를 자동 생성하고, 발행하고, 반응을 분석합니다.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/channels/threads" className="card p-6 hover:border-purple-500/50 transition text-left">
              <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold mb-3">T</span>
              <h3 className="text-sm font-medium text-white">Threads</h3>
              <p className="text-[10px] text-gray-500 mt-1">텍스트/이미지 SNS 발행</p>
            </Link>
            <Link href="/channels/x" className="card p-6 hover:border-gray-600 transition text-left">
              <span className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-white font-bold mb-3">X</span>
              <h3 className="text-sm font-medium text-white">X (Twitter)</h3>
              <p className="text-[10px] text-gray-500 mt-1">280자 트윗 자동 발행</p>
            </Link>
            <Link href="/channels/telegram" className="card p-6 hover:border-blue-500/50 transition text-left">
              <span className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold mb-3">TG</span>
              <h3 className="text-sm font-medium text-white">Telegram</h3>
              <p className="text-[10px] text-gray-500 mt-1">알림 + 양방향 명령</p>
            </Link>
          </div>
          <button onClick={dismissOnboarding} className="text-xs text-gray-600 hover:text-gray-400">
            나중에 설정하기
          </button>
        </div>
      </div>
    );
  }

  const claude = tokenStatus?.claude as Record<string, unknown> | undefined;

  return (
    <div className="px-8 py-6">
      {/* Channel Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Channels</h2>
          <span className="text-xs text-gray-600">{connectedCount} connected</span>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
          {ALL_CHANNELS.map((ch) => {
            const chCfg = cfg[ch.key] || {};
            const status = (chCfg.status as string) || (chCfg.connected ? "live" : "available");
            const isLive = status === "live" || !!chCfg.connected;
            return (
              <Link
                key={ch.key}
                href={`/channels/${ch.key}`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-800/50 transition group"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${ch.iconClass || (isLive ? "bg-gray-700 text-white" : "bg-gray-800/50 text-gray-600")} flex items-center justify-center text-xs font-bold ${isLive ? "ring-1 ring-green-800/50" : ""}`}
                >
                  {ch.icon}
                </div>
                <span className={`text-[10px] ${isLive ? "text-gray-300" : "text-gray-600"}`}>{ch.label}</span>
                {isLive && <div className="w-1 h-1 rounded-full bg-green-500" />}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {card("Published", totalPub, `T:${cc.threads || 0} X:${cc.x || 0}`)}
        {card("Followers", String(o.followers ?? "-"), o.weekDelta != null ? `${(o.weekDelta as number) >= 0 ? "+" : ""}${o.weekDelta} this week` : "")}
        {card("Viral", String((o.viralPosts as unknown[])?.length || 0), "")}
        {card("Queue", (sc.draft || 0) + (sc.approved || 0), `${sc.draft || 0} drafts`)}
        {card("Engagement", weekly?.engagementRate ? `${weekly.engagementRate}%` : "-", "this week")}
      </div>

      {/* Weekly Performance */}
      {weekly && (
        <div className="card p-5 mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">This Week</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <p className="text-[10px] text-gray-500">Published</p>
              <p className="text-xl font-bold text-white">{String(weekly.published)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Views</p>
              <p className="text-xl font-bold text-white">{(weekly.views as number)?.toLocaleString?.() || "0"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Likes</p>
              <p className="text-xl font-bold text-white">{String(weekly.likes)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Replies</p>
              <p className="text-xl font-bold text-white">{String(weekly.replies)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Eng. Rate</p>
              <p className={`text-xl font-bold ${(weekly.engagementRate as number) > 3 ? "text-green-400" : "text-white"}`}>
                {String(weekly.engagementRate)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Drafts</p>
              <p className="text-xl font-bold text-gray-400">{String(weekly.drafted)}</p>
            </div>
          </div>
          {(weekly.published as number) > 0 ? (
            <div className="mt-4 pt-3 border-t border-gray-800/50">
              <div className="flex items-center gap-6 text-xs">
                <span className="text-gray-500">Channel breakdown:</span>
                <span className="text-purple-400">Threads: {(weekly.channels as Record<string, number>)?.threads || 0}</span>
                <span className="text-gray-300">X: {(weekly.channels as Record<string, number>)?.x || 0}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-600 mt-3">
              이번 주 발행된 글이 없습니다. Queue에서 draft를 승인하면 자동 발행됩니다.
            </p>
          )}
        </div>
      )}

      {/* Cron + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Automation Status</h3>
          <div className="space-y-2.5">
            {cronJobs.map((j, i) => {
              const dot = j.lastStatus === "ok" ? "bg-green-500" : j.lastStatus === "error" ? "bg-red-500" : "bg-gray-600";
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <span className="text-xs text-gray-300">{String(j.name)}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {j.lastStatus === "error" ? (
                      <span className="text-red-400">error</span>
                    ) : (
                      j.nextRunAt ? fmtTime(j.nextRunAt) : ""
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card p-5 col-span-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {activity.length > 0
              ? activity.slice(0, 6).map((e, i) => {
                  const icons: Record<string, string> = {
                    publish: "bg-green-900/40 text-green-400",
                    draft: "bg-purple-900/40 text-purple-400",
                    viral: "bg-yellow-900/40 text-yellow-400",
                  };
                  const labels: Record<string, string> = {
                    publish: (e.channel as string) || "T",
                    draft: "AI",
                    viral: "!",
                  };
                  const type = e.type as string;
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div className={`mt-0.5 w-6 h-6 rounded ${icons[type] || "bg-gray-800 text-gray-400"} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-[9px]">{labels[type] || "?"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 truncate">
                          {String(e.text)}
                          {type === "viral" ? ` — ${e.views} views` : ""}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{fmtAgo(e.at)}</p>
                      </div>
                    </div>
                  );
                })
              : <p className="text-xs text-gray-600">No recent activity</p>}
          </div>
        </div>
      </div>

      {/* Alerts + Token Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {alerts.length > 0 && (
          <div className={`card p-5 ${alerts.some((a) => a.severity === "error") ? "border-red-900/50" : "border-yellow-900/50"}`}>
            <h3 className="text-xs font-medium text-red-400 uppercase tracking-wide mb-3">Alerts</h3>
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`text-[10px] ${a.severity === "error" ? "text-red-400" : "text-yellow-400"}`}>
                    {a.severity === "error" ? "\u25CF" : "\u25B2"}
                  </span>
                  <span className="text-xs text-gray-300">{String(a.message)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`card p-5 ${alerts.length ? "" : "col-span-1"}`}>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">AI Engine</h3>
          {claude ? (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Claude</span>
                  <span className={claude.healthy ? "text-green-400" : "text-red-400"}>
                    {claude.healthy ? "Healthy" : "Error"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Token</span>
                  <span className="text-gray-400 font-mono text-xs">{String(claude.tokenPreview || "...")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Errors</span>
                  <span className={(claude.errorCount as number) > 0 ? "text-red-400" : "text-gray-300"}>{String(claude.errorCount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last used</span>
                  <span className="text-gray-300">
                    {claude.lastUsed ? fmtAgo(new Date(claude.lastUsed as number).toISOString()) : "-"}
                  </span>
                </div>
              </div>
              {!claude.healthy && (
                <Link href="/settings" className="block mt-2 text-[10px] text-red-400 hover:text-red-300">
                  Settings에서 토큰 재등록 필요 &rarr;
                </Link>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-600">No data</p>
          )}
        </div>

        <div className={`card p-5 ${alerts.length ? "" : "col-span-1"}`}>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Channels Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Threads</span>
              <span className={tokenStatus?.threads && (tokenStatus.threads as Record<string, unknown>).connected ? "text-green-400" : "text-gray-600"}>
                {tokenStatus?.threads && (tokenStatus.threads as Record<string, unknown>).connected ? "Connected" : "Off"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">X (Twitter)</span>
              <span className={tokenStatus?.x && (tokenStatus.x as Record<string, unknown>).connected ? "text-green-400" : "text-yellow-400"}>
                {tokenStatus?.x && (tokenStatus.x as Record<string, unknown>).connected ? "Connected" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Blog</span>
              <span className="text-gray-300">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Activity Log */}
      {agentLogs.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Agent Activity</h3>
          <div className="space-y-3">
            {agentLogs.slice(0, 5).map((log, i) => {
              const messages = (log.messages || []) as Array<Record<string, string>>;
              return (
                <div key={i} className="p-2 rounded bg-gray-900/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          log.channel === "telegram"
                            ? "bg-blue-900/40 text-blue-400"
                            : log.channel
                            ? "bg-gray-800 text-gray-400"
                            : "bg-purple-900/40 text-purple-400"
                        }`}
                      >
                        {String(log.channel || "cron")}
                      </span>
                      <span className="text-[10px] text-gray-600">{String(log.sessionId)}</span>
                    </div>
                    <span className="text-[10px] text-gray-600">
                      {log.startedAt ? fmtAgo(log.startedAt) : ""}
                    </span>
                  </div>
                  {messages.map((m, j) => (
                    <div key={j} className="flex gap-2 mt-1">
                      <span className={`text-[9px] ${m.role === "user" ? "text-blue-400" : "text-green-400"} flex-shrink-0`}>
                        {m.role === "user" ? "\u2192" : "\u2190"}
                      </span>
                      <p className="text-[10px] text-gray-400 truncate">{m.text}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
