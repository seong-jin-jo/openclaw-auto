"use client";

// "돌고 있는 규칙" 칸. 회장 지적: "자동 좋아요 댓글 관리나 안터진글 삭제 이런걸 여기서 하는게 맞겠지?"
// 구조질문 문서 질문4: 상시 규칙은 성과실 아래 "돌고 있는 규칙" 칸에서 켜고/끄고, 마지막 실행 시각을 보여준다.
// 서버 기능은 이미 있다: /api/cron-status(잡 실행 상태) + /api/channel-settings/threads(auto_like_replies 토글).
// low_engagement_cleanup은 constants.ts에 implemented:false로 표시돼 있어(자동 삭제 실행 자체가 없음) 토글을 준비 중으로만 보여준다 — 없는 기능을 있는 척하지 않는다.

import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiPost, fetcher } from "@/lib/api";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Stack } from "@/components/shared/Stack";
import { fmtAgo } from "@/lib/format";

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  lastRunAt: number | null;
  lastStatus: string;
}

interface CronStatusResponse {
  jobs: CronJob[];
}

interface ChannelSettings {
  auto_like_replies?: boolean;
  low_engagement_cleanup?: boolean;
}

export function AutomationRulesPanel({ workspaceId }: { workspaceId?: string }) {
  const { data: cronData } = useSWR<CronStatusResponse>("/api/cron-status", fetcher, { refreshInterval: 60000 });
  const { data: settings, mutate: mutateSettings } = useSWR<ChannelSettings>(
    workspaceId ? `/api/channel-settings/threads?tenant_id=${encodeURIComponent(workspaceId)}` : null,
    fetcher,
  );
  const [saving, setSaving] = useState(false);
  const [localAutoLike, setLocalAutoLike] = useState<boolean | null>(null);

  useEffect(() => setLocalAutoLike(null), [settings?.auto_like_replies]);

  const insightsJob = cronData?.jobs?.find((job) => job.id === "threads-collect-insights") || null;
  const autoLikeOn = localAutoLike ?? Boolean(settings?.auto_like_replies);

  const toggleAutoLike = async () => {
    if (!workspaceId || saving) return;
    const next = !autoLikeOn;
    setLocalAutoLike(next);
    setSaving(true);
    try {
      await apiPost(`/api/channel-settings/threads?tenant_id=${encodeURIComponent(workspaceId)}`, { auto_like_replies: next });
      await mutateSettings();
    } catch {
      setLocalAutoLike(!next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border-t border-border pt-stack-section" data-perf-automation>
      <Stack gap={16}>
        <Stack gap={4}>
          <h2 className="text-subheading font-bold text-text">
            <span aria-hidden="true" className="mr-stack-tight inline-grid size-stack-section place-items-center rounded-pill bg-accent text-caption text-accent-fg">4</span>
            돌고 있는 규칙
          </h2>
          <p className="text-caption text-subtle break-keep">발행과 무관하게 계속 도는 상시 규칙입니다. 여기서 켜고 끕니다.</p>
        </Stack>

        <div className="grid gap-stack sm:grid-cols-2">
          <Card className="p-pad-inset">
            <Stack gap={8}>
              <div className="flex items-center justify-between gap-stack">
                <b className="text-body font-semibold text-text">자동 좋아요</b>
                <Button size="sm" variant={autoLikeOn ? "primary" : "secondary"} aria-pressed={autoLikeOn} disabled={!workspaceId || saving} onClick={() => void toggleAutoLike()}>
                  {autoLikeOn ? "켜짐" : "꺼짐"}
                </Button>
              </div>
              <p className="text-caption text-muted break-keep">내 글에 달린 댓글에 자동으로 좋아요를 남깁니다.</p>
              <p className="text-caption text-subtle">
                {insightsJob
                  ? `마지막 실행 ${insightsJob.lastRunAt ? fmtAgo(new Date(insightsJob.lastRunAt).toISOString()) : "아직 없음"} · ${insightsJob.enabled ? "잡 실행 중" : "잡 꺼짐"}`
                  : "실행 기록 불러오는 중"}
              </p>
            </Stack>
          </Card>

          <Card className="p-pad-inset">
            <Stack gap={8}>
              <div className="flex items-center justify-between gap-stack">
                <b className="text-body font-semibold text-text">안 터진 글 자동 삭제</b>
                <span className="rounded-pill bg-surface-2 px-stack-tight py-micro text-caption font-semibold text-subtle">준비 중</span>
              </div>
              <p className="text-caption text-muted break-keep">자동 삭제는 아직 없습니다. 대신 성과실 담당에게 &ldquo;안 터진 글 정리해줘&rdquo;라고 하면 후보를 목록으로 보여드립니다. 지우는 것은 항상 승낙 뒤에만 합니다.</p>
            </Stack>
          </Card>
        </div>

        <p className="text-caption text-subtle">댓글 답변은 상시 규칙이 아니라 그때그때 확인이 필요해 위 &ldquo;달린 반응&rdquo;에서 직접 합니다.</p>
      </Stack>
    </section>
  );
}
