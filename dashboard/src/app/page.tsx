"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useOverview, useActivity, useAlerts, useAgentLogs, useUsage, useErrors } from "@/hooks/useOverview";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { useOnboardingStatus } from "@/hooks/useOnboarding";
import { fmtAgo } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import { OnboardingWizard } from "@/components/shared/OnboardingWizard";
import { ChannelConnectBanner } from "@/components/shared/ChannelConnectBanner";
import { OnboardingChecklist } from "@/components/shared/OnboardingChecklist";
import { PipelineTimeline } from "@/components/home/PipelineTimeline";
import { PerformanceRoom, type PerformancePost } from "@/components/home/PerformanceRoom";

const ALL_CHANNELS = [
  { key: "threads", label: "Threads", icon: "T", iconClass: "bg-accent text-accent-fg" },
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
  const { dismissedOnboarding, dismissOnboarding, activeWorkspace } = useUIStore();
  const { data: overview } = useOverview();
  const { data: activityData } = useActivity();
  const { data: alertData } = useAlerts();
  const { data: agentLogData } = useAgentLogs();
  const { data: usageData } = useUsage(activeWorkspace?.id);
  const { data: errorData } = useErrors();
  const { data: channelConfig } = useChannelConfig();
  // 발행물 성과(성과 페이지 통합). 활성 워크스페이스의 published_posts
  const { data: metricsData, mutate: mutateMetrics } = useSWR<{ posts?: PerformancePost[] }>(
    activeWorkspace ? `/api/metrics?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const [collecting, setCollecting] = useState(false);
  const { data: onboardingData, mutate: mutateOnboarding } = useOnboardingStatus();
  const onboardingStatus = onboardingData as { completed?: boolean } | undefined;

  const o = overview as Record<string, unknown> | undefined;
  const cfg = (channelConfig || {}) as unknown as Record<string, Record<string, unknown>>;
  const activity = (((activityData as Record<string, unknown>)?.events || []) as Array<Record<string, unknown>>);
  const alerts = (((alertData as Record<string, unknown>)?.alerts || []) as Array<Record<string, unknown>>);
  const agentLogs = (((agentLogData as Record<string, unknown>)?.logs || []) as Array<Record<string, unknown>>);
  const usage = usageData as { 
    today?: Record<string, number>; 
    thisWeek?: Record<string, number>; 
    tier?: string; 
    quota?: any 
  } | undefined;
  const errInfo = errorData as { last24h?: number } | undefined;
  const errorCount24h = errInfo?.last24h || 0;

  if (!o) return <div className="px-region py-stack-section"><p className="text-subtle">Loading...</p></div>;

  const sc = (o.statusCounts || {}) as Record<string, number>;

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

  const posts = metricsData?.posts || [];
  const publishedPosts = posts.filter((p) => p.status === "published");
  const homeSummary = (o.summary || {}) as Record<string, number | null>;
  const activityView: Array<Record<string, unknown>> = activity;
  const collectMetrics = async () => {
    if (!activeWorkspace || collecting) return;
    setCollecting(true);
    try { await apiPost("/api/metrics", { tenant_id: activeWorkspace.id }); await mutateMetrics(); }
    finally { setCollecting(false); }
  };

  return (
    <div className="px-region py-stack-section">
      {/* 미연결 채널 알림. 발행 전 연결 유도 */}
      <ChannelConnectBanner />
      {/* 시작 체크리스트. 가치 체감까지 4단계 */}
      <OnboardingChecklist />
      <PerformanceRoom
        workspaceId={activeWorkspace?.id}
        workspaceName={activeWorkspace?.name}
        metricsLoaded={metricsData !== undefined}
        posts={posts}
        publishedCount={Number(homeSummary.published ?? publishedPosts.length)}
        followers={String(o.followers ?? "")}
        followerDelta={o.weekDelta == null ? undefined : Number(o.weekDelta)}
        engagementRate={homeSummary.engagementRate}
        queuedCount={(sc.draft || 0) + (sc.approved || 0)}
        viralCount={(o.viralPosts as unknown[])?.length || 0}
        usage={usage}
        collecting={collecting}
        onCollectMetrics={collectMetrics}
      />

      {/* 기존 콘텐츠 파이프라인은 성과실 원자료 아래로 이동해 보존한다. */}
      <PipelineTimeline
        draft={sc.draft || 0}
        approved={sc.approved || 0}
        published={publishedPosts.length}
        performing={publishedPosts.filter((p) => p.views != null).length}
      />

      {/* Error Indicator */}
      {errorCount24h > 0 && (
        <div className="mb-pad-inset px-pad-inset py-stack rounded-surface bg-danger/10 border border-danger/30 flex items-center gap-stack">
          <span className="flex-shrink-0 w-6 h-6 rounded-pill bg-danger text-status-fg text-caption font-bold flex items-center justify-center">
            {errorCount24h}
          </span>
          <span className="text-body text-danger">
            최근 24시간 에러 {errorCount24h}건 발생
          </span>
        </div>
      )}

      {/* 최근 활동. 성과요약(위)에서 발행/조회/큐/사용량을 이미 다뤘으므로 여기는 시간순 이벤트만. */}
      <div className="mb-stack-section">
        <div className="card p-pad-inset">
          <h3 className="text-caption font-medium text-subtle uppercase tracking-wide mb-stack">최근 활동</h3>
          <div className="space-y-stack">
            {activityView.length > 0
              ? activityView.slice(0, 6).map((e, i) => {
                  const icons: Record<string, string> = {
                    publish: "bg-success/15 text-success",
                    draft: "bg-accent-soft text-accent",
                    viral: "bg-warning/15 text-warning",
                  };
                  const labels: Record<string, string> = {
                    publish: (e.channel as string) || "T",
                    draft: "AI",
                    viral: "!",
                  };
                  const type = e.type as string;
                  return (
                    <div key={i} className="flex gap-stack items-start">
                      <div className={`mt-micro w-6 h-6 rounded-chip ${icons[type] || "bg-surface-2 text-subtle"} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-caption">{labels[type] || "?"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-caption text-muted truncate">
                          {String(e.text)}
                          {type === "viral" ? ` · ${e.views} views` : ""}
                        </p>
                        <p className="text-caption text-subtle mt-micro">{fmtAgo(e.at)}</p>
                      </div>
                    </div>
                  );
                })
              : <p className="text-caption text-subtle">No recent activity</p>}
          </div>
        </div>
      </div>

      {/* Tenant alerts + connected-channel state. Global token/secret health stays operator-only. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-pad-inset mb-stack-section">
        {alerts.length > 0 && (
          <div className={`card p-pad-inset ${alerts.some((a) => a.severity === "error") ? "border-danger/40" : "border-warning/40"}`}>
            <h3 className="text-caption font-medium text-danger uppercase tracking-wide mb-stack">Alerts</h3>
            <div className="space-y-stack-tight">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-stack-tight">
                  <span className={`text-caption ${a.severity === "error" ? "text-danger" : "text-warning"}`}>
                    {a.severity === "error" ? "\u25CF" : "\u25B2"}
                  </span>
                  <span className="text-caption text-muted">{String(a.message)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`card p-pad-inset ${alerts.length ? "" : "md:col-span-2"}`}>
          <h3 className="text-caption font-medium text-subtle uppercase tracking-wide mb-stack">Channels Status</h3>
          <div className="space-y-stack-tight text-body">
            <div className="flex justify-between">
              <span className="text-subtle">Threads</span>
              <span className={cfg.threads?.connected ? "text-success" : "text-subtle"}>
                {cfg.threads?.connected ? "Connected" : "Off"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle">X (Twitter)</span>
              <span className={cfg.x?.connected ? "text-success" : "text-warning"}>
                {cfg.x?.connected ? "Connected" : "Off"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle">Blog</span>
              <span className="text-muted">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Activity Log */}
      {agentLogs.length > 0 && (
        <div className="card p-pad-inset mb-stack-section">
          <h3 className="text-caption font-medium text-subtle uppercase tracking-wide mb-stack">Agent Activity</h3>
          <div className="space-y-stack">
            {agentLogs.slice(0, 5).map((log, i) => {
              const messages = (log.messages || []) as Array<Record<string, string>>;
              return (
                <div key={i} className="p-stack-tight rounded-chip bg-surface/50">
                  <div className="flex items-center justify-between mb-micro">
                    <div className="flex items-center gap-stack-tight">
                      <span
                        className={`rounded-chip px-stack-tight py-micro text-caption ${
                          log.channel === "telegram"
                            ? "bg-accent-soft text-accent"
                            : log.channel
                            ? "bg-surface-2 text-subtle"
                            : "bg-accent-soft text-accent"
                        }`}
                      >
                        {String(log.channel || "cron")}
                      </span>
                      <span className="text-caption text-subtle">{String(log.sessionId)}</span>
                    </div>
                    <span className="text-caption text-subtle">
                      {log.startedAt ? fmtAgo(log.startedAt) : ""}
                    </span>
                  </div>
                  {messages.map((m, j) => (
                    <div key={j} className="flex gap-stack-tight mt-micro">
                      <span className={`flex-shrink-0 text-caption ${m.role === "user" ? "text-accent" : "text-success"}`}>
                        {m.role === "user" ? "\u2192" : "\u2190"}
                      </span>
                      <p className="text-caption text-subtle truncate">{m.text}</p>
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
