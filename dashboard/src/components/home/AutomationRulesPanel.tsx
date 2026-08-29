"use client";

// "돌고 있는 규칙" 칸. 회장 지적: "자동 좋아요 댓글 관리나 안터진글 삭제 이런걸 여기서 하는게 맞겠지?"
// 구조질문 문서 질문4: 상시 규칙은 성과실 아래 "돌고 있는 규칙" 칸에서 켜고/끄고, 마지막 실행 시각을 보여준다.
// 서버 기능: /api/cron-status(잡 실행 상태) + /api/channel-settings/threads(auto_like_replies 토글) +
// /api/threads/low-engagement-candidates(읽기 전용 후보) + /api/threads/low-engagement-cleanup(승낙 후 삭제).
// 삭제는 정기 자동실행이 없다 — 사람이 후보를 보고 체크박스로 고른 뒤 확인 단계를 거쳐야만 지워진다.

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

interface LowEngagementCandidate {
  id: string;
  channel: string;
  text: string;
  views: number;
  likes: number;
  replies: number;
  publishedAt: string | null;
}

interface CandidatesResponse {
  candidates: LowEngagementCandidate[];
  total: number;
  threshold: { minViews: number; minLikes: number; minAgeMs: number };
  deleteSupportedChannels: string[];
}

interface CleanupResult {
  ok: boolean;
  deleted: number;
  failed: number;
  results: Array<{ postId: string; ok: boolean; error?: string }>;
}

export function AutomationRulesPanel({ workspaceId }: { workspaceId?: string }) {
  const { data: cronData } = useSWR<CronStatusResponse>("/api/cron-status", fetcher, { refreshInterval: 60000 });
  const { data: settings, mutate: mutateSettings } = useSWR<ChannelSettings>(
    workspaceId ? `/api/channel-settings/threads?tenant_id=${encodeURIComponent(workspaceId)}` : null,
    fetcher,
  );
  const { data: candidatesData, mutate: mutateCandidates } = useSWR<CandidatesResponse>(
    workspaceId ? `/api/threads/low-engagement-candidates?tenant_id=${encodeURIComponent(workspaceId)}` : null,
    fetcher,
    { refreshInterval: 120000 },
  );
  const [saving, setSaving] = useState(false);
  const [localAutoLike, setLocalAutoLike] = useState<boolean | null>(null);

  const [showCandidates, setShowCandidates] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lastResult, setLastResult] = useState<CleanupResult | null>(null);

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

  const candidates = candidatesData?.candidates ?? [];

  const openCandidates = () => {
    setSelectedIds(new Set());
    setConfirmingDelete(false);
    setLastResult(null);
    setShowCandidates(true);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const runDelete = async () => {
    if (!workspaceId || selectedIds.size === 0 || deleting) return;
    setDeleting(true);
    try {
      const result = await apiPost<CleanupResult>(
        `/api/threads/low-engagement-cleanup?tenant_id=${encodeURIComponent(workspaceId)}`,
        { postIds: Array.from(selectedIds) },
      );
      setLastResult(result);
      setSelectedIds(new Set());
      setConfirmingDelete(false);
      await mutateCandidates();
    } finally {
      setDeleting(false);
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
                <b className="text-body font-semibold text-text">안 터진 글 정리</b>
                <span className="rounded-pill bg-surface-2 px-stack-tight py-micro text-caption font-semibold text-subtle">
                  후보 {candidatesData ? candidatesData.total : "-"}건
                </span>
              </div>
              <p className="text-caption text-muted break-keep">
                발행 24시간 이상 지나고 반응이 저조한 글을 찾아둡니다. 삭제는 항상 여러분이 목록에서 직접 골라 승낙한 뒤에만 실행됩니다.
              </p>
              <p className="text-caption text-subtle">
                {lastResult
                  ? `방금 ${lastResult.deleted}건 삭제${lastResult.failed ? ` · ${lastResult.failed}건 실패` : ""}`
                  : "삭제 기록 없음"}
              </p>
              <Button size="sm" disabled={!workspaceId} onClick={openCandidates}>
                후보 보기
              </Button>
            </Stack>
          </Card>
        </div>

        <p className="text-caption text-subtle">댓글 답변은 상시 규칙이 아니라 그때그때 확인이 필요해 위 &ldquo;달린 반응&rdquo;에서 직접 합니다.</p>
      </Stack>

      {showCandidates ? (
        <div className="fixed inset-0 bg-player-surface/60 z-50 flex items-center justify-center p-stack">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="low-engagement-modal-title"
            className="card p-stack-section w-full max-w-lg max-h-[80vh] overflow-y-auto"
          >
            <Stack gap={12}>
              <div className="flex items-center justify-between gap-stack">
                <h3 id="low-engagement-modal-title" className="text-body font-semibold text-text">안 터진 글 후보</h3>
                <Button size="sm" onClick={() => setShowCandidates(false)}>닫기</Button>
              </div>

              {candidatesData ? (
                <p className="text-caption text-subtle">
                  기준: 발행 24시간 이상 · views {candidatesData.threshold.minViews} 미만 · likes {candidatesData.threshold.minLikes} 미만
                </p>
              ) : null}

              {candidates.length === 0 ? (
                <p className="text-caption text-muted">지금 후보가 없습니다.</p>
              ) : (
                <Stack gap={8}>
                  {candidates.map((c) => (
                    <label key={c.id} className="flex items-start gap-stack-tight rounded-chip border border-border p-stack-tight cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelected(c.id)}
                        className="mt-micro"
                        aria-label={`${c.text.slice(0, 20)} 선택`}
                      />
                      <Stack gap={4}>
                        <p className="text-body-sm text-text break-keep">{c.text || "(본문 없음)"}</p>
                        <p className="text-caption text-subtle">
                          views {c.views} · likes {c.likes} · replies {c.replies}
                          {c.publishedAt ? ` · 발행 ${fmtAgo(c.publishedAt)}` : ""}
                        </p>
                      </Stack>
                    </label>
                  ))}
                </Stack>
              )}

              {!confirmingDelete ? (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={selectedIds.size === 0}
                  onClick={() => setConfirmingDelete(true)}
                >
                  선택한 {selectedIds.size}건 삭제
                </Button>
              ) : (
                <Stack gap={8}>
                  <p className="text-caption text-danger break-keep">{selectedIds.size}건을 삭제합니다. 되돌릴 수 없습니다.</p>
                  <div className="flex gap-stack-tight">
                    <Button variant="danger" size="sm" disabled={deleting} onClick={() => void runDelete()}>
                      {deleting ? "삭제 중..." : "정말 삭제"}
                    </Button>
                    <Button size="sm" disabled={deleting} onClick={() => setConfirmingDelete(false)}>취소</Button>
                  </div>
                </Stack>
              )}
            </Stack>
          </div>
        </div>
      ) : null}
    </section>
  );
}
