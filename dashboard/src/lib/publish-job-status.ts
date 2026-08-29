export const PUBLISH_STATUS_TARGETS = [
  "threads",
  "x",
  "instagram",
  "facebook",
  "shorts",
  "reels",
  "tiktok",
] as const;

export type PublishStatusTarget = (typeof PUBLISH_STATUS_TARGETS)[number];
// uncertain 은 "외부 결과를 확인하지 못한 상태"다. 통합 상태에서는 아직 끝나지 않은
// processing 으로 보여 재발행을 유도하지 않고, 진짜 상태는 providerStatus 로 그대로 알린다.
export type UnifiedTargetStatus = "queued" | "processing" | "published" | "failed";

export interface PublishedPostStatusRow {
  platform: string;
  status: string;
  external_id: string | null;
  provider_post_id: string | null;
  permalink: string | null;
  error: string | null;
  published_at: string;
  first_comment_status?: string | null;
  first_comment_error?: string | null;
}

const STORAGE_PLATFORM: Record<PublishStatusTarget, readonly string[]> = {
  threads: ["threads"],
  x: ["x"],
  instagram: ["instagram"],
  facebook: ["facebook"],
  shorts: ["youtube", "shorts"],
  reels: ["instagram_reels", "reels"],
  tiktok: ["tiktok"],
};

function normalizeStatus(status: string | undefined): UnifiedTargetStatus {
  if (status === "published") return "published";
  if (status === "failed") return "failed";
  if (status === "in_progress" || status === "processing" || status === "uncertain") return "processing";
  return "queued";
}

export function isPublishStatusTarget(value: string): value is PublishStatusTarget {
  return PUBLISH_STATUS_TARGETS.includes(value as PublishStatusTarget);
}

export function buildUnifiedPublishStatus(
  draftId: string,
  rows: PublishedPostStatusRow[],
  requestedTargets: readonly PublishStatusTarget[] = PUBLISH_STATUS_TARGETS,
) {
  const targets = requestedTargets.map((platform) => {
    const aliases = STORAGE_PLATFORM[platform];
    const row = rows
      .filter((candidate) => aliases.includes(candidate.platform))
      .sort((a, b) => b.published_at.localeCompare(a.published_at))[0];
    return {
      platform,
      status: normalizeStatus(row?.status),
      providerStatus: row?.status ?? null,
      externalId: row?.provider_post_id ?? row?.external_id ?? null,
      permalink: row?.permalink ?? null,
      error: row?.error ?? null,
      updatedAt: row?.published_at ?? null,
      // 본문 성공 + 첫 댓글 실패를 화면이 전체 성공으로 읽지 않게 따로 알린다.
      firstComment: {
        status: row?.first_comment_status ?? null,
        error: row?.first_comment_error ?? null,
      },
      stop: {
        supported: false,
        reason: "현재 provider adapter는 시작된 발행을 안전하게 중지하는 계약을 제공하지 않습니다.",
      },
    };
  });

  const statuses = targets.map((target) => target.status);
  const terminal = statuses.every((status) => status === "published" || status === "failed");
  let overall: "not_started" | "in_progress" | "published" | "failed" | "partial_failed";
  if (statuses.every((status) => status === "queued")) overall = "not_started";
  else if (statuses.every((status) => status === "published")) overall = "published";
  else if (terminal && statuses.every((status) => status === "failed")) overall = "failed";
  else if (terminal) overall = "partial_failed";
  else overall = "in_progress";

  return {
    draftId,
    overall,
    stopSupported: false,
    targets,
    summary: {
      total: targets.length,
      queued: statuses.filter((status) => status === "queued").length,
      processing: statuses.filter((status) => status === "processing").length,
      published: statuses.filter((status) => status === "published").length,
      failed: statuses.filter((status) => status === "failed").length,
    },
  };
}
