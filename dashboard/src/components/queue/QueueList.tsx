"use client";

import useSWR from "swr";
import { useQueue } from "@/hooks/useQueue";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { useUIStore } from "@/store/ui-store";
import { useToast } from "@/components/layout/Toast";
import { apiPost, fetcher } from "@/lib/api";
import { UnifiedPostCard } from "./UnifiedPostCard";
import type { UnifiedPostCardProps } from "./UnifiedPostCard";

const FILTERS = ["all", "draft", "approved", "published", "failed"];
const FILTER_LABELS: Record<string, string> = {
  all: "전체", draft: "초안", approved: "승인됨", published: "발행됨", failed: "실패",
};

interface QueueListProps {
  variant?: UnifiedPostCardProps["variant"];
  charLimit?: number;
  showSeo?: boolean;
  onEditInEditor?: (postId: string) => void;
}

export function QueueList({ variant = "text", charLimit, showSeo, onEditInEditor }: QueueListProps) {
  const { queueFilter, setQueueFilter, selectedIds, selectAll, clearSelection, setImagePickerPostId } = useUIStore();
  const { data, mutate } = useQueue(queueFilter);
  const { data: channelConfig } = useChannelConfig();
  const { showToast } = useToast();
  // 소싱(롱폼→숏폼) DB drafts 중 아직 큐로 안 가져온 개수.
  const { data: srcPending, mutate: mutatePending } = useSWR<{ pending: number }>("/api/sourcing/import-to-queue", fetcher);

  const handleImportFromSourcing = async () => {
    try {
      const r = await apiPost<{ imported: number }>("/api/sourcing/import-to-queue");
      showToast(`소싱 후보 ${r?.imported ?? 0}개를 큐로 가져왔습니다`, "success");
      mutate(); mutatePending();
    } catch (e) { showToast(`가져오기 실패: ${(e as Error).message}`, "error"); }
  };

  const posts = data?.posts || [];

  // Already sorted by generatedAt descending from the API
  const sorted = posts;
  const selectableIds = sorted.filter((p) => p.status === "draft" || p.status === "approved").map((p) => p.id);

  const handleSelectAll = () => {
    if (selectedIds.size > 0) clearSelection();
    else selectAll(selectableIds);
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || !confirm(`${ids.length}개 일괄 승인?`)) return;
    try {
      const r = await apiPost<{ approved: number }>("/api/queue/bulk-approve", { ids });
      if (r) { showToast(`${r.approved}개 승인`, "success"); clearSelection(); mutate(); }
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || !confirm(`${ids.length}개 일괄 삭제?`)) return;
    try {
      const r = await apiPost<{ deleted: number }>("/api/queue/bulk-delete", { ids });
      if (r) { showToast(`${r.deleted}개 삭제`, "success"); clearSelection(); mutate(); }
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const cfg = (channelConfig || {}) as Record<string, Record<string, unknown>>;

  return (
    <div>
      {/* Filters + Bulk actions — 모바일에서 줄바꿈 */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setQueueFilter(f)}
              className={`px-3 py-1 text-xs rounded ${
                queueFilter === f
                  ? "bg-blue-600/30 text-blue-300 border border-blue-600/30"
                  : "text-gray-500 hover:bg-gray-800"
              }`}
            >
              {FILTER_LABELS[f] || f}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {(srcPending?.pending ?? 0) > 0 && (
            <button onClick={handleImportFromSourcing} className="px-3 py-1 text-xs bg-indigo-700/60 text-indigo-200 rounded hover:bg-indigo-600">
              소싱에서 가져오기 ({srcPending!.pending})
            </button>
          )}
          {selectableIds.length > 0 && (
            <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
              <input type="checkbox" checked={selectedIds.size > 0} onChange={handleSelectAll} className="rounded border-gray-600" />
              전체
            </label>
          )}
          {selectedIds.size > 0 && (
            <>
              <button onClick={handleBulkApprove} className="px-3 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">
                승인 ({selectedIds.size})
              </button>
              <button onClick={handleBulkDelete} className="px-3 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600">
                삭제 ({selectedIds.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-gray-600 text-sm">글이 없습니다</p>
        ) : (
          sorted.map((p) => (
            <UnifiedPostCard
              key={p.id}
              post={p}
              channelConfig={cfg}
              variant={variant}
              charLimit={charLimit}
              showSeo={showSeo}
              onRefresh={() => mutate()}
              onEditInEditor={onEditInEditor}
              onPickImage={(postId) => setImagePickerPostId(postId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
