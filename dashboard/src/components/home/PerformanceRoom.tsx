"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiPost } from "@/lib/api";
import { Logo, PREVIEW_PLATFORMS, type PreviewPlatform } from "@/components/studio/PlatformPreview";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Stack } from "@/components/shared/Stack";
import { fmtAgo } from "@/lib/format";

export interface PerformancePost {
  id: string;
  platform: string;
  permalink?: string;
  text?: string;
  status: string;
  error?: string;
  published_at: string;
  views?: number;
  likes?: number;
  replies?: number;
  reposts?: number;
}

interface PerformanceSampleAssessment {
  count: number;
  threshold: number;
  thresholdMet: boolean;
}

interface SuggestionEvidence {
  postIds: string[];
  signalIds: string[];
  sampleCount: number;
  sampleThreshold: number;
  sampleThresholdMet: boolean;
  brandContextAvailable: boolean;
  marketTrendAvailable: boolean;
}

interface PerformanceSuggestion {
  id: string;
  text: string;
  basis: "hypothesis" | "performance" | "trend";
  label: string;
  verified: boolean;
  evidence: SuggestionEvidence;
}

interface SuggestionResponse {
  suggestions?: PerformanceSuggestion[];
  sampleAssessment?: PerformanceSampleAssessment;
  note?: string;
}

interface QueueResponse {
  ok?: boolean;
  id?: string;
  reused?: boolean;
}

interface UsageSummary {
  today?: Record<string, number>;
  thisWeek?: Record<string, number>;
  tier?: string;
  quota?: Record<string, number>;
}

interface PerformanceRoomProps {
  workspaceId?: string;
  workspaceName?: string;
  metricsLoaded: boolean;
  posts: PerformancePost[];
  publishedCount: number;
  followers: string;
  followerDelta?: number;
  engagementRate?: number | null;
  queuedCount: number;
  viralCount: number;
  usage?: UsageSummary;
  collecting: boolean;
  onCollectMetrics: () => Promise<void>;
}

const SAMPLE_THRESHOLD = 5;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function metricValue(value: string | number | null | undefined, empty: boolean): string {
  if (empty || value === null || value === undefined || value === "") return "미수집";
  return typeof value === "number" ? value.toLocaleString() : value;
}

function platformLabel(platform: string): string {
  return PREVIEW_PLATFORMS.find((item) => item.key === platform)?.label ?? platform;
}

function platformPreviewKey(platform: string): PreviewPlatform | null {
  return PREVIEW_PLATFORMS.some((item) => item.key === platform)
    ? platform as PreviewPlatform
    : null;
}

export function PerformanceRoom({
  workspaceId,
  workspaceName,
  metricsLoaded,
  posts,
  publishedCount,
  followers,
  followerDelta,
  engagementRate,
  queuedCount,
  viralCount,
  usage,
  collecting,
  onCollectMetrics,
}: PerformanceRoomProps) {
  const [focus, setFocus] = useState<PreviewPlatform | "all">("all");
  const [suggestions, setSuggestions] = useState<PerformanceSuggestion[]>([]);
  const [sampleAssessment, setSampleAssessment] = useState<PerformanceSampleAssessment | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");
  const [queueState, setQueueState] = useState<Record<string, "loading" | "queued" | "reused" | "error">>({});
  const autoRequested = useRef(new Set<string>());

  const publishedPosts = useMemo(
    () => posts.filter((post) => post.status === "published"),
    [posts],
  );
  const measuredPosts = useMemo(
    () => publishedPosts.filter((post) => post.views !== null && post.views !== undefined),
    [publishedPosts],
  );
  const focusedPosts = useMemo(
    () => focus === "all" ? publishedPosts : publishedPosts.filter((post) => post.platform === focus),
    [focus, publishedPosts],
  );
  const focusedMeasuredPosts = useMemo(
    () => focusedPosts.filter((post) => post.views !== null && post.views !== undefined),
    [focusedPosts],
  );
  const rankedPosts = useMemo(
    () => [...focusedMeasuredPosts].sort((a, b) => Number(b.views || 0) - Number(a.views || 0)),
    [focusedMeasuredPosts],
  );

  const focusedAssessment: PerformanceSampleAssessment = {
    count: focusedMeasuredPosts.length,
    threshold: SAMPLE_THRESHOLD,
    thresholdMet: focusedMeasuredPosts.length >= SAMPLE_THRESHOLD,
  };
  const assessment = focus === "all" ? sampleAssessment ?? focusedAssessment : focusedAssessment;
  const empty = focusedMeasuredPosts.length === 0;

  const winnerCount = rankedPosts.length >= SAMPLE_THRESHOLD ? 2 : Math.min(1, rankedPosts.length);
  const winnerAverage = average(rankedPosts.slice(0, winnerCount).map((post) => Number(post.views || 0)));
  const remainingAverage = average(rankedPosts.slice(winnerCount).map((post) => Number(post.views || 0)));
  const comparisonMax = Math.max(winnerAverage, remainingAverage, 1);
  const ratio = remainingAverage > 0 ? winnerAverage / remainingAverage : null;
  const verdict = empty
    ? "아직 판정할 표본이 없습니다"
    : !assessment.thresholdMet
      ? "아직 무엇이 통했는지 단정할 수 없습니다"
      : ratio
        ? `조회 상위 ${winnerCount}편이 나머지보다 ${ratio.toFixed(1)}배 멀리 갔습니다`
        : `조회 상위 ${winnerCount}편이 현재 성과를 이끌고 있습니다`;

  const totalViews = focusedPosts.reduce((sum, post) => sum + Number(post.views || 0), 0);
  const totalReplies = focusedPosts.reduce((sum, post) => sum + Number(post.replies || 0), 0);
  const topPosts = rankedPosts.slice(0, 3);
  const reactionPosts = focusedPosts.filter((post) => Number(post.replies || 0) > 0);

  const loadSuggestions = useCallback(async () => {
    if (!workspaceId || loadingSuggestions) return;
    setLoadingSuggestions(true);
    setSuggestionError("");
    try {
      const response = await apiPost<SuggestionResponse>("/api/suggestions", { tenant_id: workspaceId });
      setSuggestions(response?.suggestions ?? []);
      setSampleAssessment(response?.sampleAssessment ?? null);
      if (!response?.suggestions?.length) {
        setSuggestionError(response?.note || "제안을 만들지 못했어요. 잠시 후 다시 받아 주세요.");
      }
    } catch {
      setSuggestionError("제안을 불러오지 못했어요. 잠시 후 다시 받아 주세요.");
    } finally {
      setLoadingSuggestions(false);
    }
  }, [loadingSuggestions, workspaceId]);

  useEffect(() => {
    if (!metricsLoaded || measuredPosts.length !== 0 || !workspaceId || autoRequested.current.has(workspaceId)) return;
    autoRequested.current.add(workspaceId);
    void loadSuggestions();
  }, [loadSuggestions, measuredPosts.length, metricsLoaded, workspaceId]);

  const enqueueSuggestion = async (suggestion: PerformanceSuggestion) => {
    if (!workspaceId || queueState[suggestion.id] === "loading") return;
    setQueueState((current) => ({ ...current, [suggestion.id]: "loading" }));
    try {
      const response = await apiPost<QueueResponse>("/api/suggestions/enqueue", {
        tenant_id: workspaceId,
        suggestion,
      });
      setQueueState((current) => ({
        ...current,
        [suggestion.id]: response?.reused ? "reused" : "queued",
      }));
    } catch {
      setQueueState((current) => ({ ...current, [suggestion.id]: "error" }));
    }
  };

  const coreMetrics = [
    { label: "조회", value: metricValue(totalViews, empty), detail: empty ? "발행 뒤부터 집계" : "선택한 플랫폼 합계" },
    { label: "저장", value: "미수집", detail: "채널 제공 뒤부터 집계" },
    { label: "답글", value: metricValue(totalReplies, empty), detail: empty ? "발행 뒤부터 집계" : "선택한 플랫폼 합계" },
    { label: "팔로워", value: metricValue(followers, empty), detail: empty ? "발행 뒤부터 집계" : followerDelta === undefined ? "지난 기간 비교 미수집" : `이번 주 ${followerDelta >= 0 ? "+" : ""}${followerDelta}` },
  ];
  const secondaryMetrics = [
    { label: "총 발행", value: metricValue(focus === "all" ? publishedCount : focusedPosts.length, empty) },
    { label: "참여율", value: metricValue(focus === "all" && engagementRate != null ? `${engagementRate}%` : null, empty) },
    { label: "대기 큐", value: metricValue(queuedCount, empty) },
    { label: "터진 글", value: metricValue(viralCount, empty) },
    { label: "도달", value: "미수집" },
    { label: "참여", value: "미수집" },
  ];

  return (
    <div className="mb-region space-y-region" data-room-top="performance">
      <section className="card p-region" data-perf-verdict={assessment.thresholdMet ? "ready" : "thin"} data-perf-sample={assessment.count}>
        <Stack gap={16}>
          <Stack gap={8}>
            <p className="text-caption font-semibold text-subtle">성과 요약 · {workspaceName || "작업 공간"} · 최근 30일</p>
            <h1 className="text-display font-bold text-text break-keep">{verdict}</h1>
            <p className="text-body-sm text-muted break-keep">
              {!assessment.thresholdMet && <span className="mr-stack-tight inline-flex rounded-full bg-warning/15 px-stack-tight py-micro font-semibold text-warning">근거 부족</span>}
              성과 표본 {assessment.count}건입니다. {assessment.threshold}건부터 판정합니다.
            </p>
          </Stack>

          {!empty && (
            <div className="rounded-xl border border-border bg-surface-2 p-stack" data-perf-proof="2">
              <Stack gap={8}>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-stack">
                  <span className="text-caption font-semibold text-text break-keep">조회 상위 {winnerCount}편 평균</span>
                  <progress className="progress-semantic h-stack-tight w-full" max={comparisonMax} value={winnerAverage} aria-label={`조회 상위 ${winnerCount}편 평균 ${winnerAverage.toLocaleString()}`} />
                  <b className="text-body-sm tabular-nums text-text">{winnerAverage.toLocaleString()} 조회</b>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-stack">
                  <span className="text-caption font-semibold text-text break-keep">나머지 글 평균</span>
                  <progress className="progress-semantic h-stack-tight w-full opacity-60" max={comparisonMax} value={remainingAverage} aria-label={`나머지 글 평균 ${remainingAverage.toLocaleString()}`} />
                  <b className="text-body-sm tabular-nums text-text">{remainingAverage.toLocaleString()} 조회</b>
                </div>
              </Stack>
            </div>
          )}

          <Stack direction="horizontal" gap={4} scroll className="scrollbar-semantic pb-micro" role="group" aria-label="플랫폼 집중">
            <Button variant={focus === "all" ? "primary" : "secondary"} size="sm" aria-pressed={focus === "all"} onClick={() => setFocus("all")}>전체</Button>
            {PREVIEW_PLATFORMS.map((platform) => (
              <Button key={platform.key} variant={focus === platform.key ? "primary" : "secondary"} size="sm" aria-pressed={focus === platform.key} onClick={() => setFocus(platform.key)}>
                <Logo p={platform.key} />
                <span>{platform.label}</span>
              </Button>
            ))}
          </Stack>

          <div className="grid grid-cols-2 gap-stack-tight lg:grid-cols-4" data-perf-tier="core">
            {coreMetrics.map((metric) => (
              <Card key={metric.label} className={`p-pad-inset ${empty ? "bg-surface-2" : ""}`}>
                <Stack gap={4}>
                  <span className="text-caption text-muted">{metric.label}</span>
                  <b className="text-heading font-bold tabular-nums text-text">{metric.value}</b>
                  <small className="text-caption text-subtle break-keep">{metric.detail}</small>
                </Stack>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-stack-section gap-y-micro border-t border-border pt-stack" data-perf-tier="rest">
            {secondaryMetrics.map((metric) => (
              <span key={metric.label} className="inline-flex items-baseline gap-stack-tight">
                <small className="text-caption text-muted">{metric.label}</small>
                <b className="text-body font-bold tabular-nums text-text">{metric.value}</b>
              </span>
            ))}
          </div>

          {usage && (
            <div className="flex flex-wrap items-center gap-x-stack-section gap-y-micro border-t border-border pt-stack text-caption text-muted">
              {usage.tier && <span className="rounded-full bg-accent-soft px-stack-tight py-micro font-semibold text-accent">{usage.tier} 요금제</span>}
              <span>오늘 생성 {usage.today?.aiGenerations || 0} · 발행 {usage.today?.publications || 0} · 크론 {usage.today?.cronRuns || 0}</span>
              <span>이번 주 생성 {usage.thisWeek?.aiGenerations || 0} · 발행 {usage.thisWeek?.publications || 0} · 크론 {usage.thisWeek?.cronRuns || 0}</span>
            </div>
          )}
        </Stack>
      </section>

      <section className="border-t border-border pt-stack-section" data-perf-loop={topPosts.length}>
        <Stack gap={16}>
          <Stack gap={4}>
            <h2 className="text-subheading font-bold text-text"><span className="mr-stack-tight inline-grid size-stack-section place-items-center rounded-full bg-accent text-caption text-accent-fg">2</span>무엇이 통했나</h2>
          </Stack>
          {topPosts.length > 0 ? (
            <div className="grid gap-stack lg:grid-cols-3">
              {topPosts.map((post, index) => {
                const previewKey = platformPreviewKey(post.platform);
                return (
                  <Card key={post.id} className={`p-pad-inset ${index === 0 ? "border-accent ring-4 ring-accent-soft" : ""}`}>
                    <Stack gap={12}>
                      <div className="min-h-control-touch rounded-lg border border-border bg-surface-2 p-stack">
                        <Stack gap={8}>
                          <div className="flex items-center gap-stack-tight text-caption font-semibold text-text">
                            {previewKey && <Logo p={previewKey} />}
                            <span>{platformLabel(post.platform)}</span>
                          </div>
                          <p className="line-clamp-3 text-body-sm text-muted break-keep">{post.text || "게시물 본문 미수집"}</p>
                        </Stack>
                      </div>
                      <span className="text-caption font-semibold text-accent">{index === 0 ? "가장 멀리 간 글" : `조회 ${index + 1}위`}</span>
                      <b className="line-clamp-2 text-body font-bold text-text break-keep">{post.text || "제목 미수집"}</b>
                      <div className="flex flex-wrap gap-stack-section text-caption text-muted">
                        <span>조회 <b className="text-text">{Number(post.views || 0).toLocaleString()}</b></span>
                        <span>좋아요 <b className="text-text">{Number(post.likes || 0).toLocaleString()}</b></span>
                        <span>답글 <b className="text-text">{Number(post.replies || 0).toLocaleString()}</b></span>
                      </div>
                      {post.permalink && <a className="text-caption font-semibold text-accent hover:underline" href={post.permalink} target="_blank" rel="noopener noreferrer">실제 게시물 보기</a>}
                    </Stack>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-pad-inset text-body-sm text-muted break-keep">
              아직 통한 글을 판정할 수 없습니다. 첫 편이 나가면 실제 모습과 성과가 이 자리에 쌓입니다.
            </div>
          )}
        </Stack>
      </section>

      <section className="border-t border-border pt-stack-section" data-perf-suggestions={suggestions.length}>
        <Stack gap={16}>
          <div className="flex flex-wrap items-center justify-between gap-stack">
            <Stack gap={4}>
              <h2 className="text-subheading font-bold text-text">성과에서 제안으로</h2>
            </Stack>
            <Button onClick={() => void loadSuggestions()} disabled={loadingSuggestions || !workspaceId}>
              {loadingSuggestions ? "제안 불러오는 중" : suggestions.length ? "제안 새로 받기" : "성과에서 제안 받기"}
            </Button>
          </div>
          {suggestionError && <p role="alert" className="rounded-lg bg-danger/10 p-stack text-body-sm text-danger break-keep">{suggestionError}</p>}
          {suggestions.length > 0 && (
            <div className="grid gap-stack lg:grid-cols-3">
              {suggestions.map((suggestion) => {
                const state = queueState[suggestion.id];
                return (
                  <Card key={suggestion.id} className={suggestion.verified ? "p-pad-inset" : "border-dashed p-pad-inset"}>
                    <Stack gap={12}>
                      <span className={`self-start rounded-full px-stack-tight py-micro text-caption font-semibold ${suggestion.verified ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{suggestion.label}</span>
                      <p className="text-body font-semibold text-text break-keep">{suggestion.text}</p>
                      <Button variant="primary" className="w-full" disabled={state === "loading" || state === "queued" || state === "reused"} onClick={() => void enqueueSuggestion(suggestion)}>
                        {state === "loading" ? "생성 큐에 넣는 중" : state === "queued" ? "생성 큐에 넣었어요" : state === "reused" ? "이미 생성 큐에 있어요" : "이 제안을 생성 큐에 넣기"}
                      </Button>
                      {state === "error" && <p role="alert" className="text-caption text-danger break-keep">생성 큐에 넣지 못했어요. 잠시 후 다시 눌러 주세요.</p>}
                    </Stack>
                  </Card>
                );
              })}
            </div>
          )}
        </Stack>
      </section>

      <section className="border-t border-border pt-stack-section" data-perf-comments={reactionPosts.length}>
        <Stack gap={16}>
          <Stack gap={4}>
            <h2 className="text-subheading font-bold text-text"><span className="mr-stack-tight inline-grid size-stack-section place-items-center rounded-full bg-accent text-caption text-accent-fg">3</span>달린 반응</h2>
          </Stack>
          {reactionPosts.length > 0 ? (
            <div className="divide-y divide-border border-y border-border">
              {reactionPosts.map((post) => (
                <div key={post.id} className="flex flex-wrap items-center gap-stack py-pad-inset">
                  <div className="min-w-0 flex-1">
                    <p className="text-caption font-semibold text-muted">{platformLabel(post.platform)} · 답글 {Number(post.replies || 0).toLocaleString()}개</p>
                    <p className="truncate text-body text-text">{post.text || "게시물 본문 미수집"}</p>
                  </div>
                  {post.permalink
                    ? <a className="ds-label inline-flex min-h-control-touch items-center rounded-lg border border-border bg-surface-2 px-stack text-body-sm font-semibold text-text hover:border-subtle" href={post.permalink} target="_blank" rel="noopener noreferrer">게시물에서 답하기</a>
                    : <span className="text-caption text-subtle">원문 링크 미수집</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-pad-inset text-body-sm text-muted break-keep">
              아직 달린 반응이 없습니다. 첫 편이 나가면 댓글과 반응이 이 자리에 모입니다.
            </div>
          )}
        </Stack>
      </section>

      <section className="border-t border-border pt-stack-section" data-perf-inherit="app/page.tsx">
        <details>
          <summary className="flex min-h-control-touch cursor-pointer items-center gap-stack text-body font-bold text-text">
            <span>올린 글별 성적</span>
            <span className="text-caption font-normal text-muted">{posts.length}건</span>
          </summary>
          <div className="scrollbar-semantic overflow-x-auto pt-stack">
            <table className="w-full min-w-max text-body">
              <thead>
                <tr className="border-b border-border text-caption text-subtle">
                  <th className="p-stack text-left">플랫폼</th>
                  <th className="p-stack text-left">내용</th>
                  <th className="p-stack">상태</th>
                  <th className="p-stack">조회</th>
                  <th className="p-stack">좋아요</th>
                  <th className="p-stack">답글</th>
                  <th className="p-stack">발행</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-border text-muted">
                    <td className="p-stack text-caption">{platformLabel(post.platform)}</td>
                    <td className="max-w-xs p-stack text-caption">
                      <span className="line-clamp-2">{post.text || "게시물 본문 미수집"}</span>
                      {post.status === "failed" && <span className="block text-caption text-danger">{post.error?.slice(0, 60)}</span>}
                    </td>
                    <td className="p-stack text-center"><span className={`rounded-full px-stack-tight py-micro text-caption ${post.status === "published" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>{post.status}</span></td>
                    <td className="p-stack text-center text-caption">{post.views ?? "미수집"}</td>
                    <td className="p-stack text-center text-caption">{post.likes ?? "미수집"}</td>
                    <td className="p-stack text-center text-caption">{post.replies ?? "미수집"}</td>
                    <td className="p-stack text-center text-caption text-subtle">{fmtAgo(post.published_at)}</td>
                  </tr>
                ))}
                {posts.length === 0 && <tr><td colSpan={7} className="p-stack-section text-center text-caption text-subtle">아직 나간 글이 없습니다. 발행실에서 올리면 여기에 쌓입니다.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-stack flex flex-wrap gap-stack">
            <Button onClick={() => void onCollectMetrics()} disabled={collecting || !workspaceId}>{collecting ? "성과 수집 중" : "성과 다시 수집하기"}</Button>
          </div>
        </details>
      </section>
    </div>
  );
}
