"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { Logo, PREVIEW_PLATFORMS, type PreviewPlatform } from "@/components/studio/PlatformPreview";
import { useOverview, useActivity, useAlerts, useWeeklySummary, useAgentLogs, useUsage, useErrors } from "@/hooks/useOverview";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { useOnboardingStatus } from "@/hooks/useOnboarding";
import { fmtAgo, fmtTime } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import { OnboardingWizard } from "@/components/shared/OnboardingWizard";
import { ChannelConnectBanner } from "@/components/shared/ChannelConnectBanner";
import { OnboardingChecklist } from "@/components/shared/OnboardingChecklist";
import { PipelineTimeline } from "@/components/home/PipelineTimeline";
import { trackEvent } from "@/lib/analytics/events";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Section } from "@/components/shared/Section";
import { Stack } from "@/components/shared/Stack";

interface PostRow {
  id: string; platform: string; permalink?: string; text?: string; status: string; error?: string;
  published_at: string; views?: number; likes?: number; replies?: number; reposts?: number;
}

function card(title: string, value: string | number, sub?: string) {
  return (
    <Card className="p-pad-inset">
      <Stack gap={8}>
        <p className="text-caption text-subtle uppercase tracking-wide">{title}</p>
        <p className="text-heading font-bold text-text">{value}</p>
        {sub && <p className="text-caption text-subtle">{sub}</p>}
      </Stack>
    </Card>
  );
}

const ALL_CHANNELS = [
  { key: "threads", label: "Threads", icon: "T", iconClass: "bg-accent text-text" },
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
  const { data: weeklyData } = useWeeklySummary();
  const { data: agentLogData } = useAgentLogs();
  const { data: usageData } = useUsage(activeWorkspace?.id);
  const { data: errorData } = useErrors();
  const { data: channelConfig } = useChannelConfig();
  const [focus, setFocus] = useState<PreviewPlatform | "all">("all");
  // 발행물 성과(성과 페이지 통합) — 활성 워크스페이스의 published_posts
  const { data: metricsData, mutate: mutateMetrics } = useSWR<{ posts?: PostRow[] }>(
    activeWorkspace ? `/api/metrics?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const [collecting, setCollecting] = useState(false);
  const [ideas, setIdeas] = useState<string[] | null>(null);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const { data: onboardingData, mutate: mutateOnboarding } = useOnboardingStatus();
  const onboardingStatus = onboardingData as { completed?: boolean } | undefined;

  const o = overview as Record<string, unknown> | undefined;
  const cfg = (channelConfig || {}) as unknown as Record<string, Record<string, unknown>>;
  const activity = (((activityData as Record<string, unknown>)?.events || []) as Array<Record<string, unknown>>);
  const alerts = (((alertData as Record<string, unknown>)?.alerts || []) as Array<Record<string, unknown>>);
  const weekly = weeklyData as Record<string, unknown> | undefined;
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

  const posts = metricsData?.posts || [];
  const publishedPosts = posts.filter((p) => p.status === "published");
  const sumMetric = (k: keyof PostRow) => publishedPosts.reduce((a, p) => a + (Number(p[k]) || 0), 0);
  const collectMetrics = async () => {
    if (!activeWorkspace || collecting) return;
    setCollecting(true);
    try { await apiPost("/api/metrics", { tenant_id: activeWorkspace.id }); await mutateMetrics(); }
    finally { setCollecting(false); }
  };
  const generateIdeas = async () => {
    if (loadingIdeas) return;
    trackEvent({ name: "cta_click", params: { cta_id: "generate_ideas" } });
    setLoadingIdeas(true); setIdeas(null);
    try {
      const r = await apiPost<{ ideas?: string[]; note?: string }>("/api/suggestions");
      setIdeas(r?.ideas?.length ? r.ideas : (r?.note ? [r.note] : ["아이디어를 생성하지 못했습니다."]));
    } catch (e) { setIdeas([`실패: ${(e as Error).message}`]); }
    finally { setLoadingIdeas(false); }
  };

  return (
    <div className="px-region py-stack-section">
      {/* 미연결 채널 알림 — 발행 전 연결 유도 */}
      <ChannelConnectBanner />
      {/* 시작 체크리스트 — 가치 체감까지 4단계 */}
      <OnboardingChecklist />
      {/* 콘텐츠 파이프라인 퍼널 — 생성→검수→배포→성과 */}
      <PipelineTimeline
        draft={sc.draft || 0}
        approved={sc.approved || 0}
        published={publishedPosts.length}
        performing={publishedPosts.filter((p) => p.views != null).length}
      />
      {/* Marketing Home — 전 플랫폼 종합 + 로고 클릭 시 플랫폼 집중 */}
      <Section
        className="mb-stack-section"
        title={<span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">성과</span>}
        supplement={`${activeWorkspace?.name ? `${activeWorkspace.name} · ` : ""}전 플랫폼 종합 + 발행물별 성과 · 로고 클릭 시 플랫폼 집중`}
      >
        <Stack direction="horizontal" gap={8} wrap className="mb-pad-inset">
          <Button variant={focus === "all" ? "primary" : "secondary"} size="sm" aria-pressed={focus === "all"} onClick={() => setFocus("all")}>전체</Button>
          {PREVIEW_PLATFORMS.map((p) => (
            <Button key={p.key} variant={focus === p.key ? "primary" : "secondary"} size="sm" aria-pressed={focus === p.key} onClick={() => setFocus(p.key)} title={p.label}>
              <Logo p={p.key} /><span>{p.label}</span>
            </Button>
          ))}
        </Stack>
        {/* 종합/플랫폼 지표 — 실 성과데이터는 채널 insights(게이트웨이) 연동 시 채움 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-stack">
          {card(focus === "all" ? "총 발행" : `${PREVIEW_PLATFORMS.find((p) => p.key === focus)?.label} 발행`, totalPub)}
          {card("도달(Reach)", "—", "insights 연동 시")}
          {card("참여(Engagement)", "—", "insights 연동 시")}
          {card("팔로워 증감", "—", "insights 연동 시")}
        </div>
        {focus !== "all" && <p className="text-caption text-subtle mt-stack-tight">📊 {PREVIEW_PLATFORMS.find((p) => p.key === focus)?.label} 집중 분석 — 채널 연결 후 실데이터 표시</p>}
      </Section>

      {/* 발행물 성과 — 실제 발행물별 조회·좋아요 (성과 페이지 통합) */}
      <div className="mb-stack-section">
        <div className="flex items-center justify-between mb-stack">
          <h3 className="text-caption font-medium text-subtle uppercase tracking-wide">📈 발행물 성과</h3>
          <Stack direction="horizontal" gap={8} wrap>
            <Button size="sm" onClick={generateIdeas} disabled={loadingIdeas}>{loadingIdeas ? "분석 중…" : "💡 성과 기반 다음 아이디어"}</Button>
            <Button variant="primary" size="sm" onClick={collectMetrics} disabled={collecting || !activeWorkspace}>{collecting ? "수집 중…" : "🔄 성과 수집"}</Button>
          </Stack>
        </div>
        {ideas && (
          <div className="mb-stack p-stack rounded-xl border border-border bg-surface/40">
            <p className="text-caption text-subtle mb-stack-tight">성과 상위 글 패턴 기반 추천</p>
            <ul className="space-y-micro">
              {ideas.map((idea, i) => (
                <li key={i} className="text-caption text-muted">• {idea}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-stack mb-stack">
          {card("발행물", publishedPosts.length)}
          {card("조회", sumMetric("views"))}
          {card("좋아요", sumMetric("likes"))}
          {card("답글", sumMetric("replies"))}
          {card("리포스트", sumMetric("reposts"))}
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-body">
            <thead><tr className="text-caption text-subtle border-b border-border">
              <th className="text-left p-stack">플랫폼</th><th className="text-left p-stack">내용</th>
              <th className="p-stack">상태</th><th className="p-stack">조회</th><th className="p-stack">좋아요</th>
              <th className="p-stack">답글</th><th className="p-stack">발행</th>
            </tr></thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-border text-muted">
                  <td className="p-stack text-caption">{p.platform}</td>
                  <td className="p-stack text-caption max-w-xs truncate">
                    {p.permalink ? <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="hover:underline text-accent">{p.text?.slice(0, 50) || "(게시물)"} ↗</a> : (p.text?.slice(0, 50) || "—")}
                    {p.status === "failed" && <span className="text-red-400 text-caption block">{p.error?.slice(0, 60)}</span>}
                  </td>
                  <td className="p-stack text-center"><span className={`text-caption px-stack-tight py-[2px] rounded-full ${p.status === "published" ? "bg-green-900/50 text-green-400" : "bg-red-900/40 text-red-400"}`}>{p.status}</span></td>
                  <td className="p-stack text-center text-caption">{p.views ?? "—"}</td>
                  <td className="p-stack text-center text-caption">{p.likes ?? "—"}</td>
                  <td className="p-stack text-center text-caption">{p.replies ?? "—"}</td>
                  <td className="p-stack text-center text-caption text-subtle">{fmtAgo(p.published_at)}</td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={7} className="p-stack-section text-center text-subtle text-caption">아직 발행물이 없습니다. Studio에서 발행하세요.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* 운영 현황 — 큐·팔로워·바이럴·자동화·채널 */}
      <h3 className="text-caption font-medium text-subtle uppercase tracking-wide mb-stack">운영 현황</h3>

      {/* Error Indicator */}
      {errorCount24h > 0 && (
        <div className="mb-pad-inset px-pad-inset py-stack rounded-xl bg-red-900/20 border border-red-900/40 flex items-center gap-stack">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-text text-caption font-bold flex items-center justify-center">
            {errorCount24h}
          </span>
          <span className="text-body text-red-300">
            최근 24시간 에러 {errorCount24h}건 발생
          </span>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-stack mb-stack-section">
        {card("Published", totalPub, `T:${cc.threads || 0} X:${cc.x || 0}`)}
        {card("Followers", String(o.followers ?? "-"), o.weekDelta != null ? `${(o.weekDelta as number) >= 0 ? "+" : ""}${o.weekDelta} this week` : "")}
        {card("Viral", String((o.viralPosts as unknown[])?.length || 0), "")}
        {card("Queue", (sc.draft || 0) + (sc.approved || 0), `${sc.draft || 0} drafts`)}
        {card("Engagement", weekly?.engagementRate ? `${weekly.engagementRate}%` : "-", "this week")}
      </div>

      {/* Usage (hybrid pricing aligned - ADR-003) */}
      {usage && (
        <div className="card p-pad-inset mb-stack-section">
          <div className="flex justify-between items-center mb-pad-inset">
            <h3 className="text-caption font-medium text-subtle uppercase tracking-wide">사용량</h3>
            {usage.tier && (
              <span className="text-caption px-stack-tight py-[2px] bg-blue-900/50 rounded text-accent">
                {usage.tier} tier
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-section">
            <div>
              <p className="text-caption text-subtle mb-stack-tight">오늘</p>
              <div className="flex items-center gap-pad-inset">
                <div>
                  <p className="text-subheading font-bold text-text">{usage.today?.aiGenerations || 0}</p>
                  <p className="text-caption text-subtle">generations / shorts</p>
                </div>
                <div>
                  <p className="text-subheading font-bold text-text">{usage.today?.publications || 0}</p>
                  <p className="text-caption text-subtle">publications</p>
                </div>
                <div>
                  <p className="text-subheading font-bold text-subtle">{usage.today?.cronRuns || 0}</p>
                  <p className="text-caption text-subtle">cron runs</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-caption text-subtle mb-stack-tight">이번 주</p>
              <div className="flex items-center gap-pad-inset">
                <div>
                  <p className="text-subheading font-bold text-text">{usage.thisWeek?.aiGenerations || 0}</p>
                  <p className="text-caption text-subtle">generations / shorts</p>
                </div>
                <div>
                  <p className="text-subheading font-bold text-text">{usage.thisWeek?.publications || 0}</p>
                  <p className="text-caption text-subtle">publications</p>
                </div>
                <div>
                  <p className="text-subheading font-bold text-subtle">{usage.thisWeek?.cronRuns || 0}</p>
                  <p className="text-caption text-subtle">cron runs</p>
                </div>
              </div>
            </div>
          </div>
          {usage.quota && (
            <p className="text-caption text-subtle mt-stack-tight">
              Quota (this month): shorts {usage.quota.shorts_used}/{usage.quota.shorts_included} · gens {usage.quota.generations_used}/{usage.quota.generations_included}
            </p>
          )}
          <p className="text-caption text-subtle mt-micro">Base subscription + usage add-ons (see Settings for upgrade)</p>
        </div>
      )}

      {/* Weekly Performance */}
      {weekly && (
        <div className="card p-pad-inset mb-stack-section">
          <h3 className="text-caption font-medium text-subtle uppercase tracking-wide mb-pad-inset">This Week</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-pad-inset">
            <div>
              <p className="text-caption text-subtle">Published</p>
              <p className="text-subheading font-bold text-text">{String(weekly.published)}</p>
            </div>
            <div>
              <p className="text-caption text-subtle">Views</p>
              <p className="text-subheading font-bold text-text">{(weekly.views as number)?.toLocaleString?.() || "0"}</p>
            </div>
            <div>
              <p className="text-caption text-subtle">Likes</p>
              <p className="text-subheading font-bold text-text">{String(weekly.likes)}</p>
            </div>
            <div>
              <p className="text-caption text-subtle">Replies</p>
              <p className="text-subheading font-bold text-text">{String(weekly.replies)}</p>
            </div>
            <div>
              <p className="text-caption text-subtle">Eng. Rate</p>
              <p className={`text-subheading font-bold ${(weekly.engagementRate as number) > 3 ? "text-green-400" : "text-text"}`}>
                {String(weekly.engagementRate)}%
              </p>
            </div>
            <div>
              <p className="text-caption text-subtle">Drafts</p>
              <p className="text-subheading font-bold text-subtle">{String(weekly.drafted)}</p>
            </div>
          </div>
          {(weekly.published as number) > 0 ? (
            <div className="mt-pad-inset pt-stack border-t border-border/50">
              <div className="flex items-center gap-stack-section text-caption">
                <span className="text-subtle">Channel breakdown:</span>
                <span className="text-accent">Threads: {(weekly.channels as Record<string, number>)?.threads || 0}</span>
                <span className="text-muted">X: {(weekly.channels as Record<string, number>)?.x || 0}</span>
              </div>
            </div>
          ) : (
            <p className="text-caption text-subtle mt-stack">
              이번 주 발행된 글이 없습니다. Queue에서 draft를 승인하면 자동 발행됩니다.
            </p>
          )}
        </div>
      )}

      {/* Tenant-scoped activity. Global cron controls remain operator-only. */}
      <div className="mb-stack-section">
        <div className="card p-pad-inset">
          <h3 className="text-caption font-medium text-subtle uppercase tracking-wide mb-stack">Recent Activity</h3>
          <div className="space-y-stack">
            {activity.length > 0
              ? activity.slice(0, 6).map((e, i) => {
                  const icons: Record<string, string> = {
                    publish: "bg-green-900/40 text-green-400",
                    draft: "bg-accent-soft text-accent",
                    viral: "bg-yellow-900/40 text-yellow-400",
                  };
                  const labels: Record<string, string> = {
                    publish: (e.channel as string) || "T",
                    draft: "AI",
                    viral: "!",
                  };
                  const type = e.type as string;
                  return (
                    <div key={i} className="flex gap-stack items-start">
                      <div className={`mt-micro w-6 h-6 rounded ${icons[type] || "bg-surface-2 text-subtle"} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-caption">{labels[type] || "?"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-caption text-muted truncate">
                          {String(e.text)}
                          {type === "viral" ? ` — ${e.views} views` : ""}
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
          <div className={`card p-pad-inset ${alerts.some((a) => a.severity === "error") ? "border-red-900/50" : "border-yellow-900/50"}`}>
            <h3 className="text-caption font-medium text-red-400 uppercase tracking-wide mb-stack">Alerts</h3>
            <div className="space-y-stack-tight">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-stack-tight">
                  <span className={`text-caption ${a.severity === "error" ? "text-red-400" : "text-yellow-400"}`}>
                    {a.severity === "error" ? "\u25CF" : "\u25B2"}
                  </span>
                  <span className="text-caption text-muted">{String(a.message)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`card p-pad-inset ${alerts.length ? "" : "col-span-1"}`}>
          <h3 className="text-caption font-medium text-subtle uppercase tracking-wide mb-stack">Channels Status</h3>
          <div className="space-y-stack-tight text-body">
            <div className="flex justify-between">
              <span className="text-subtle">Threads</span>
              <span className={cfg.threads?.connected ? "text-green-400" : "text-subtle"}>
                {cfg.threads?.connected ? "Connected" : "Off"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle">X (Twitter)</span>
              <span className={cfg.x?.connected ? "text-green-400" : "text-yellow-400"}>
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
                <div key={i} className="p-stack-tight rounded bg-surface/50">
                  <div className="flex items-center justify-between mb-micro">
                    <div className="flex items-center gap-stack-tight">
                      <span
                        className={`text-caption px-stack-tight py-[2px] rounded ${
                          log.channel === "telegram"
                            ? "bg-blue-900/40 text-accent"
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
                      <span className={`text-caption ${m.role === "user" ? "text-accent" : "text-green-400"} flex-shrink-0`}>
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
