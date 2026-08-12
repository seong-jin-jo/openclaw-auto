"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { useUIStore } from "@/store/ui-store";
import { fmtTime } from "@/lib/format";
import type { Post } from "@/types/queue";

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-warning/15 text-warning",
  approved: "bg-accent-soft text-accent",
  published: "bg-success/15 text-success",
  failed: "bg-danger/15 text-danger",
};

function channelBadge(label: string, ch: { status: string } | undefined) {
  if (!ch) return null;
  const c: Record<string, string> = {
    published: "bg-success/15 text-success",
    failed: "bg-danger/15 text-danger",
    pending: "bg-surface-2 text-subtle",
    skipped: "bg-surface-2 text-subtle",
  };
  return (
    <span className={`text-caption px-1.5 py-0.5 rounded ${c[ch.status] || "bg-surface-2 text-muted"}`}>
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

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {(post.status === "draft" || post.status === "approved") && (
            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(post.id)} className="rounded border-border" />
          )}
          <span className={`text-caption px-2 py-0.5 rounded ${STATUS_CLASS[post.status] || "bg-surface-2 text-muted"}`}>
            {post.status}
          </span>
          <span className="text-xs text-subtle">{post.topic || ""}</span>
          {post.model && <span className="text-xs text-subtle">{post.model}</span>}
        </div>
        <div className="flex gap-1">
          {channelBadge("T", channels.threads)}
        </div>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="mb-2 relative group/img" style={{ maxWidth: 480 }}>
          <img src={post.imageUrl} alt="Post image" className="w-full rounded-lg border border-border" style={{ display: "block" }} />
          {post.status === "draft" && (
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-danger rounded text-white hover:opacity-80 opacity-0 group-hover/img:opacity-100 transition-opacity"
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
            className="w-full bg-surface-2 text-muted text-sm p-2 rounded border border-border mb-2"
            rows={4}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-2 py-1 text-xs bg-accent text-text rounded">Save</button>
            <button onClick={() => setEditingPost(null)} className="px-2 py-1 text-xs bg-surface-2 text-muted rounded">Cancel</button>
            {onPickImage && (
              <button onClick={() => onPickImage(post.id)} className="px-2 py-1 text-xs bg-accent text-text rounded hover:bg-accent-hover">
                {post.imageUrl ? "Change Image" : "Add Image"}
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted mb-2 whitespace-pre-wrap">{post.text}</p>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex gap-1 mb-2">
          {post.hashtags.map((h) => (
            <span key={h} className="text-xs text-accent">#{h}</span>
          ))}
        </div>
      )}

      {/* Engagement */}
      {post.engagement?.views != null && (
        <div className="flex gap-4 text-xs text-subtle">
          <span>views: {post.engagement.views}</span>
          <span>likes: {post.engagement.likes || 0}</span>
          <span>replies: {post.engagement.replies || 0}</span>
        </div>
      )}

      {/* Dates */}
      <div className="flex flex-wrap gap-3 text-xs text-subtle mt-1">
        {post.generatedAt && <span>생성: {fmtTime(post.generatedAt)}</span>}
        {post.approvedAt && <span>승인: {fmtTime(post.approvedAt)}</span>}
        {post.scheduledAt && post.status === "approved" && (
          <span className="text-accent">발행예정: {fmtTime(post.scheduledAt)}</span>
        )}
        {post.publishedAt && (
          <span className="text-green-400">발행: {fmtTime(post.publishedAt)}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        {post.status === "draft" && (
          <>
            <button onClick={handleApprove} className="px-2 py-1 text-xs bg-green-700 text-text rounded hover:bg-green-600">Approve</button>
            <button onClick={() => { setEditText(post.text); setEditingPost(post.id); }} className="px-2 py-1 text-xs bg-surface-2 text-muted rounded hover:bg-surface-2">Edit</button>
            {onPickImage && (
              <button onClick={() => onPickImage(post.id)} className="px-2 py-1 text-xs bg-accent-soft text-accent rounded hover:bg-accent-hover">Image</button>
            )}
          </>
        )}
        {post.status !== "published" && (
          <button onClick={handleDelete} className="px-2 py-1 text-xs bg-danger/15 text-danger rounded hover:bg-danger/25">Delete</button>
        )}
      </div>
    </div>
  );
}
