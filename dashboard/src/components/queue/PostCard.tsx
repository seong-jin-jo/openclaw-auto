"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { useUIStore } from "@/store/ui-store";
import { fmtTime } from "@/lib/format";
import type { Post } from "@/types/queue";

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-yellow-900/50 text-yellow-300",
  approved: "bg-blue-900/50 text-blue-300",
  published: "bg-green-900/50 text-green-300",
  failed: "bg-red-900/50 text-red-300",
};

function channelBadge(label: string, ch: { status: string } | undefined) {
  if (!ch) return null;
  const c: Record<string, string> = {
    published: "bg-green-900/40 text-green-400",
    failed: "bg-red-900/40 text-red-400",
    pending: "bg-gray-800 text-gray-500",
    skipped: "bg-gray-800 text-gray-600",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${c[ch.status] || "bg-gray-700 text-gray-300"}`}>
      {label}: {ch.status}
    </span>
  );
}

interface PostCardProps {
  post: Post;
  channelConfig: Record<string, { connected?: boolean; enabled?: boolean; status?: string }>;
  onRefresh: () => void;
  onPickImage?: (postId: string) => void;
}

export function PostCard({ post, channelConfig, onRefresh, onPickImage }: PostCardProps) {
  const { showToast } = useToast();
  const { editingPost, setEditingPost, selectedIds, toggleSelect } = useUIStore();
  const [editText, setEditText] = useState(post.text);
  const isEditing = editingPost === post.id;
  const isSelected = selectedIds.has(post.id);
  const channels = post.channels || {};

  const handleApprove = async () => {
    try {
      await apiPost(`/api/queue/${post.id}/approve`, { hours: 2 });
      showToast("승인 완료", "success");
      onRefresh();
    } catch (e) { showToast(`승인 실패: ${(e as Error).message}`, "error"); }
  };

  const handleSave = async () => {
    try {
      await apiPost(`/api/queue/${post.id}/update`, { text: editText });
      showToast("수정 완료", "success");
      setEditingPost(null);
      onRefresh();
    } catch (e) { showToast(`수정 실패: ${(e as Error).message}`, "error"); }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제?")) return;
    try {
      await apiPost(`/api/queue/${post.id}/delete`);
      showToast("삭제 완료", "success");
      onRefresh();
    } catch (e) { showToast(`삭제 실패: ${(e as Error).message}`, "error"); }
  };

  const handleRemoveImage = async () => {
    try {
      await apiPost(`/api/queue/${post.id}/update`, { imageUrl: null });
      showToast("이미지 제거됨", "success");
      onRefresh();
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handleToggleChannel = async (ch: string, checked: boolean) => {
    try {
      const channelUpdate = {
        ...channels,
        [ch]: { ...(channels[ch] || {}), status: checked ? "pending" : "skipped" },
      };
      await apiPost(`/api/queue/${post.id}/update`, { channels: channelUpdate });
      onRefresh();
    } catch { /* ignore */ }
  };

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {(post.status === "draft" || post.status === "approved") && (
            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(post.id)} className="rounded border-gray-600" />
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_CLASS[post.status] || "bg-gray-700 text-gray-300"}`}>
            {post.status}
          </span>
          <span className="text-xs text-gray-500">{post.topic || ""}</span>
          {post.model && <span className="text-xs text-gray-600">{post.model}</span>}
        </div>
        <div className="flex gap-1">
          {channelBadge("T", channels.threads)}
          {channelBadge("X", channels.x)}
        </div>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="mb-2 relative group/img" style={{ maxWidth: 480 }}>
          <img src={post.imageUrl} alt="Post image" className="w-full rounded-lg border border-gray-800" style={{ display: "block" }} />
          {post.status === "draft" && (
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-900/80 rounded text-red-300 hover:text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
              title="이미지 제거"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Text / Edit */}
      {isEditing ? (
        <>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-gray-800 text-gray-200 text-sm p-2 rounded border border-gray-700 mb-2"
            rows={4}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
            <button onClick={() => setEditingPost(null)} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>
            {onPickImage && (
              <button onClick={() => onPickImage(post.id)} className="px-2 py-1 text-xs bg-purple-700 text-white rounded hover:bg-purple-600">
                {post.imageUrl ? "Change Image" : "Add Image"}
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-200 mb-2 whitespace-pre-wrap">{post.text}</p>
      )}

      {/* Channel publish toggles */}
      {(post.status === "draft" || post.status === "approved") && (
        <div className="flex items-center gap-3 mb-2 text-xs">
          <span className="text-gray-600">Publish to:</span>
          {["threads", "x"].map((ch) => {
            const chCfg = channelConfig[ch] || {};
            const enabled = chCfg.connected || chCfg.enabled;
            if (!enabled) return null;
            const checked = channels[ch]?.status !== "skipped";
            const limit = ch === "x" ? 280 : 500;
            const over = post.text.length > limit;
            return (
              <label key={ch} className={`flex items-center gap-1 ${over ? "text-yellow-500" : "text-gray-400"}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => handleToggleChannel(ch, e.target.checked)}
                  className="rounded border-gray-600 w-3 h-3"
                />
                {ch === "threads" ? "T" : "X"}
                {over && ` (${post.text.length}/${limit})`}
              </label>
            );
          })}
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex gap-1 mb-2">
          {post.hashtags.map((h) => (
            <span key={h} className="text-xs text-blue-400">#{h}</span>
          ))}
        </div>
      )}

      {/* Engagement */}
      {post.engagement?.views != null && (
        <div className="flex gap-4 text-xs text-gray-500">
          <span>views: {post.engagement.views}</span>
          <span>likes: {post.engagement.likes || 0}</span>
          <span>replies: {post.engagement.replies || 0}</span>
        </div>
      )}

      {/* Dates */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
        {post.generatedAt && <span>생성: {fmtTime(post.generatedAt)}</span>}
        {post.approvedAt && <span>승인: {fmtTime(post.approvedAt)}</span>}
        {post.scheduledAt && post.status === "approved" && (
          <span className="text-blue-400">발행예정: {fmtTime(post.scheduledAt)}</span>
        )}
        {post.publishedAt && (
          <span className="text-green-400">발행: {fmtTime(post.publishedAt)}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        {post.status === "draft" && (
          <>
            <button onClick={handleApprove} className="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve</button>
            <button onClick={() => { setEditText(post.text); setEditingPost(post.id); }} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Edit</button>
            {onPickImage && (
              <button onClick={() => onPickImage(post.id)} className="px-2 py-1 text-xs bg-purple-900/50 text-purple-300 rounded hover:bg-purple-800">Image</button>
            )}
          </>
        )}
        {post.status !== "published" && (
          <button onClick={handleDelete} className="px-2 py-1 text-xs bg-red-900/50 text-red-300 rounded hover:bg-red-800">Delete</button>
        )}
      </div>
    </div>
  );
}
