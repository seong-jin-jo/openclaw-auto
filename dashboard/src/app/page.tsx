"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { Logo, PREVIEW_PLATFORMS, type PreviewPlatform } from "@/components/studio/PlatformPreview";
import { useOverview, useCronStatus, useActivity, useAlerts, useWeeklySummary, useTokenStatus, useAgentLogs, useUsage, useErrors } from "@/hooks/useOverview";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { useOnboardingStatus } from "@/hooks/useOnboarding";
import { fmtAgo, fmtTime } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import { OnboardingWizard } from "@/components/shared/OnboardingWizard";
import { ChannelConnectBanner } from "@/components/shared/ChannelConnectBanner";
import Link from "next/link";

interface PostRow {
  id: string; platform: string; permalink?: string; text?: string; status: string; error?: string;
  published_at: string; views?: number; likes?: number; replies?: number; reposts?: number;
}

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
  const { data: usageData } = useUsage();
  const { data: errorData } = useErrors();
  const { data: channelConfig } = useChannelConfig();
  const { dismissedOnboarding, dismissOnboarding, activeWorkspace } = useUIStore();
  const [focus, setFocus] = useState<PreviewPlatform | "all">("all");
  // 발행물 성과(성과 페이지 통합) — 활성 워크스페이스의 published_posts
  const { data: metricsData, mutate: mutateMetrics } = useSWR<{ posts?: PostRow[] }>(
    activeWorkspace ? `/api/metrics?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const [collecting, setCollecting] = useState(false);
  const { data: onboardingData, mutate: mutateOnboarding } = useOnboardingStatus();
  const onboardingStatus = onboardingData as { completed?: boolean } | undefined;

  const o = overview as Record<string, unknown> | undefined;
  const cfg = (channelConfig || {}) as unknown as Record<string, Record<string, unknown>>;
  const cronJobs = (((cronData as Record<string, unknown>)?.jobs || cronData || []) as Array<Record<string, unknown>>);
  const activity = (((activityData as Record<string, unknown>)?.events || []) as Array<Record<string, unknown>>);
  const alerts = (((alertData as Record<string, unknown>)?.alerts || []) as Array<Record<string, unknown>>);
  const weekly = weeklyData as Record<string, unknown> | undefined;
  const tokenStatus = tokenData as Record<string, unknown> | undefined;
  const agentLogs = (((agentLogData as Record<string, unknown>)?.logs || []) as Array<Record<string, unknown>>);
  const usage = usageData as { today?: Record<string, number>; thisWeek?: Record<string, number> } | undefined;
  const errInfo = errorData as { last24h?: number } | undefined;
  const errorCount24h = errInfo?.last24h || 0;

  if (!o) return <div className="px-8 py-6"><p className="text-gray-500">Loading...</p></div>;

  const sc = (o.statusCounts || {}) as Record<string, number>;
  const cc = (o.channelCounts || {}) as Record<string, number>;
  const totalPub = sc.published || 0;

  // Onboarding check
  const connectedCount = Object.values(cfg).filter((c) => c.connected || c.status === "live").length;
  const showOnboarding = onboardingStatus && !onboardingStatus.completed && connectedCount === 0 && !dismissedOnboarding;

  if (showOnboarding) {
    return (
      <OnboardingWizard
        onComplete={() => {
          mutateOnboarding();
          dismissOnboarding();
        }}
        onDismiss={dismissOnboarding}
      />
    );
  }

  const claude = tokenStatus?.claude as Record<string, unknown> | undefined;

  const posts = metricsData?.posts || [];
  const publishedPosts = posts.filter((p) => p.status === "published");
  const sumMetric = (k: keyof PostRow) => publishedPosts.reduce((a, p) => a + (Number(p[k]) || 0), 0);
  const collectMetrics = async () => {
    if (!activeWorkspace || collecting) return;
    setCollecting(true);
    try { await apiPost("/api/metrics", { tenant_id: activeWorkspace.id }); await mutateMetrics(); }
    finally { setCollecting(false); }
  };

  return (
    <div className="px-8 py-6">
      {/* 미연결 채널 알림 — 발행 전 연결 유도 */}
      <ChannelConnectBanner />
      {/* Marketing Home — 전 플랫폼 종합 + 로고 클릭 시 플랫폼 집중 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div><h2 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">성과</h2><p className="text-xs text-gray-500">{activeWorkspace?.name ? `${activeWorkspace.name} · ` : ""}전 플랫폼 종합 + 발행물별 성과 · 로고 클릭 시 플랫폼 집중</p></div>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          <button onClick={() => setFocus("all")} className={`px-3 py-2 rounded-lg text-xs font-medium ${focus === "all" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>전체</button>
          {PREVIEW_PLATFORMS.map((p) => (
            <button key={p.key} onClick={() => setFocus(p.key)} title={p.label} className={`px-3 py-2 rounded-lg flex items-center gap-1.5 ${focus === p.key ? "bg-gradient-to-r from-purple-600 to-pink-600 ring-1 ring-pink-400" : "bg-gray-800 hover:bg-gray-700"}`}>
              <Logo p={p.key} /><span className="text-xs text-gray-300">{p.label}</span>
            </button>
          ))}
        </div>
        {/* 종합/플랫폼 지표 — 실 성과데이터는 채널 insights(게이트웨이) 연동 시 채움 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {card(focus === "all" ? "총 발행" : `${PREVIEW_PLATFORMS.find((p) => p.key === focus)?.label} 발행`, totalPub)}
          {card("도달(Reach)", "—", "insights 연동 시")}
          {card("참여(Engagement)", "—", "insights 연동 시")}
          {card("팔로워 증감", "—", "insights 연동 시")}
        </div>
        {focus !== "all" && <p className="text-[11px] text-gray-600 mt-2">📊 {PREVIEW_PLATFORMS.find((p) => p.key === focus)?.label} 집중 분석 — 채널 연결 후 실데이터 표시</p>}
      </div>

      {/* 발행물 성과 — 실제 발행물별 조회·좋아요 (성과 페이지 통합) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">📈 발행물 성과</h3>
          <button onClick={collectMetrics} disabled={collecting || !activeWorkspace} className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50">{collecting ? "수집 중…" : "🔄 성과 수집"}</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          {card("발행물", publishedPosts.length)}
          {card("조회", sumMetric("views"))}
          {card("좋아요", sumMetric("likes"))}
          {card("답글", sumMetric("replies"))}
          {card("리포스트", sumMetric("reposts"))}
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] text-gray-500 border-b border-gray-800">
              <th className="text-left p-3">플랫폼</th><th className="text-left p-3">내용</th>
              <th className="p-3">상태</th><th className="p-3">조회</th><th className="p-3">좋아요</th>
              <th className="p-3">답글</th><th className="p-3">발행</th>
            </tr></thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-gray-900 text-gray-300">
                  <td className="p-3 text-xs">{p.platform}</td>
                  <td className="p-3 text-xs max-w-xs truncate">
                    {p.permalink ? <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="hover:underline text-purple-300">{p.text?.slice(0, 50) || "(게시물)"} ↗</a> : (p.text?.slice(0, 50) || "—")}
                    {p.status === "failed" && <span className="text-red-400 text-[10px] block">{p.error?.slice(0, 60)}</span>}
                  </td>
                  <td className="p-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "published" ? "bg-green-900/50 text-green-400" : "bg-red-900/40 text-red-400"}`}>{p.status}</span></td>
                  <td className="p-3 text-center text-xs">{p.views ?? "—"}</td>
                  <td className="p-3 text-center text-xs">{p.likes ?? "—"}</td>
                  <td className="p-3 text-center text-xs">{p.replies ?? "—"}</td>
                  <td className="p-3 text-center text-[10px] text-gray-500">{fmtAgo(p.published_at)}</td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-600 text-xs">아직 발행물이 없습니다. Studio에서 발행하세요.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* 운영 현황 — 큐·팔로워·바이럴·자동화·채널 */}
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">운영 현황</h3>

      {/* Error Indicator */}
      {errorCount24h > 0 && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-900/20 border border-red-900/40 flex items-center gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {errorCount24h}
          </span>
          <span className="text-sm text-red-300">
            최근 24시간 에러 {errorCount24h}건 발생
          </span>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {card("Published", totalPub, `T:${cc.threads || 0} X:${cc.x || 0}`)}
        {card("Followers", String(o.followers ?? "-"), o.weekDelta != null ? `${(o.weekDelta as number) >= 0 ? "+" : ""}${o.weekDelta} this week` : "")}
        {card("Viral", String((o.viralPosts as unknown[])?.length || 0), "")}
        {card("Queue", (sc.draft || 0) + (sc.approved || 0), `${sc.draft || 0} drafts`)}
        {card("Engagement", weekly?.engagementRate ? `${weekly.engagementRate}%` : "-", "this week")}
      </div>

      {/* Usage */}
      {usage && (
        <div className="card p-5 mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Usage</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] text-gray-500 mb-2">Today</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xl font-bold text-white">{usage.today?.aiGenerations || 0}</p>
                  <p className="text-[10px] text-gray-500">generations</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{usage.today?.publications || 0}</p>
                  <p className="text-[10px] text-gray-500">publications</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-400">{usage.today?.cronRuns || 0}</p>
                  <p className="text-[10px] text-gray-500">cron runs</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-2">This Week</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xl font-bold text-white">{usage.thisWeek?.aiGenerations || 0}</p>
                  <p className="text-[10px] text-gray-500">generations</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{usage.thisWeek?.publications || 0}</p>
                  <p className="text-[10px] text-gray-500">publications</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-400">{usage.thisWeek?.cronRuns || 0}</p>
                  <p className="text-[10px] text-gray-500">cron runs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
