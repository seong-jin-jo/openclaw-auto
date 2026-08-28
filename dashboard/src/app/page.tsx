"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useOverview, useUsage } from "@/hooks/useOverview";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { useOnboardingStatus } from "@/hooks/useOnboarding";
import { useUIStore } from "@/store/ui-store";
import { OnboardingWizard } from "@/components/shared/OnboardingWizard";
import { ChannelConnectBanner } from "@/components/shared/ChannelConnectBanner";
import { OnboardingChecklist } from "@/components/shared/OnboardingChecklist";
import { PerformanceRoom, type PerformancePost } from "@/components/home/PerformanceRoom";

export default function HomePage() {
  const { dismissedOnboarding, dismissOnboarding, activeWorkspace } = useUIStore();
  const { data: overview } = useOverview();
  const { data: usageData } = useUsage(activeWorkspace?.id);
  const { data: channelConfig } = useChannelConfig();
  // 발행물 성과(성과 페이지 통합). 활성 워크스페이스의 published_posts
  const { data: metricsData, mutate: mutateMetrics } = useSWR<{ posts?: PerformancePost[] }>(
    activeWorkspace ? `/api/metrics?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const [collecting, setCollecting] = useState(false);
  const { data: onboardingData, mutate: mutateOnboarding } = useOnboardingStatus();
  const onboardingStatus = onboardingData as { completed?: boolean } | undefined;

  const o = overview as Record<string, unknown> | undefined;
  const cfg = (channelConfig || {}) as unknown as Record<string, Record<string, unknown>>;
  const usage = usageData as { 
    today?: Record<string, number>; 
    thisWeek?: Record<string, number>; 
    tier?: string; 
    quota?: any 
  } | undefined;

  if (!o) return <div className="px-region py-stack-section"><p className="text-subtle">Loading...</p></div>;

  const sc = (o.statusCounts || {}) as Record<string, number>;

  // Onboarding check
  const connectedCount = Object.values(cfg).filter((c) => c.connected || c.status === "live").length;
  const showOnboarding = onboardingStatus && !onboardingStatus.completed && connectedCount === 0 && !dismissedOnboarding;

  const posts = metricsData?.posts || [];
  const publishedPosts = posts.filter((p) => p.status === "published");
  const homeSummary = (o.summary || {}) as Record<string, number | null>;
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

      {showOnboarding ? (
        <div className="mb-region" data-onboarding-help="first-content">
          <OnboardingWizard
            embedded
            onComplete={() => {
              mutateOnboarding();
              dismissOnboarding();
            }}
            onDismiss={dismissOnboarding}
          />
        </div>
      ) : null}
    </div>
  );
}
