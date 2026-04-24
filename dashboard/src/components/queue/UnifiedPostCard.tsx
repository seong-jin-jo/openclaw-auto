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

const CHANNEL_BADGE_CLASS: Record<string, string> = {
  published: "bg-green-900/40 text-green-400",
  failed: "bg-red-900/40 text-red-400",
  pending: "bg-gray-800 text-gray-500",
  skipped: "bg-gray-800 text-gray-600",
};

const CHANNEL_BADGE_LABELS: Record<string, string> = {
  threads: "T",
  x: "X",
  instagram: "IG",
  facebook: "FB",
  linkedin: "LI",
  bluesky: "BS",
  pinterest: "PIN",
  tumblr: "TUM",
  tiktok: "TT",
  youtube: "YT",
  naver_blog: "NB",
  medium: "MD",
  substack: "SS",
};

function channelBadge(channelKey: string, ch: { status?: string } | undefined) {
  if (!ch) return null;
  const label = CHANNEL_BADGE_LABELS[channelKey] || channelKey.toUpperCase().slice(0, 3);
  const status = ch.status || "pending";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${CHANNEL_BADGE_CLASS[status] || "bg-gray-700 text-gray-300"}`}>
      {label}: {status}
    </span>
  );
}

export interface UnifiedPostCardProps {
  post: Post;
  channelConfig?: Record<string, Record<string, unknown>>;
  variant?: "text" | "visual" | "blog";
  charLimit?: number;
  showSeo?: boolean;
  onRefresh: () => void;
  onEditInEditor?: (postId: string) => void;
  onPickImage?: (postId: string) => void;
}

export function UnifiedPostCard({
  post,
  channelConfig,
  variant = "text",
  charLimit,
  showSeo = false,
  onRefresh,
  onEditInEditor,
  onPickImage,
}: UnifiedPostCardProps) {
  const { showToast } = useToast();
  const { editingPost, setEditingPost, selectedIds, toggleSelect } = useUIStore();
  const [editText, setEditText] = useState(post.text);
  const isEditing = editingPost === post.id;
  const isSelected = selectedIds.has(post.id);
  const channels = post.channels || {};

  const slides = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
  const isCard = slides.length > 1 || !!post.cardBatchId;

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

  const charWarning = charLimit && post.text.length > charLimit;

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
          {isCard && variant === "visual" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300">
              Card {slides.length} slides
            </span>
          )}
          <span className="text-xs text-gray-500">{post.topic || ""}</span>
          {post.model && <span className="text-xs text-gray-600">{post.model}</span>}
        </div>
        <div className="flex gap-1 flex-wrap justify-end">
          {Object.entries(channels).map(([key, ch]) => (
            <span key={key}>{channelBadge(key, ch)}</span>
          ))}
        </div>
      </div>

      {/* Image — variant controls layout */}
      {variant === "visual" ? (
        /* Visual: large carousel slides */
        slides.length > 0 ? (
          <div className="mb-3">
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#374151 transparent" }}>
              {slides.map((s, i) => (
                <div key={i} className="flex-shrink-0 w-36 h-44 rounded-lg overflow-hidden border border-gray-800">
                  <img src={s} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-3 w-36 h-44 rounded-lg border border-dashed border-gray-700 bg-gray-900/30 flex items-center justify-center">
            <span className="text-gray-600 text-xs">No Image</span>
          </div>
        )
      ) : variant === "blog" ? (
        /* Blog: small thumbnail */
        post.imageUrl ? (
          <div className="mb-2 float-right ml-3" style={{ maxWidth: 120 }}>
            <img src={post.imageUrl} alt="Thumbnail" className="w-full rounded border border-gray-800" />
          </div>
        ) : null
      ) : (
        /* Text: medium image */
        post.imageUrl ? (
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
        ) : null
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
          {charLimit && (
            <p className={`text-[10px] mb-1 ${editText.length > charLimit ? "text-red-400" : "text-gray-600"}`}>
              {editText.length}/{charLimit}
            </p>
          )}
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
        <>
          <p className={`text-sm text-gray-200 mb-2 whitespace-pre-wrap ${variant === "visual" ? "line-clamp-4" : ""}`}>{post.text}</p>
          {charWarning && (
            <p className="text-[10px] text-red-400 mb-1">{post.text.length}/{charLimit} 글자 초과</p>
          )}
        </>
      )}

      {/* SEO keyword badge (blog only) */}
      {showSeo && post.seoKeyword && (
        <div className="mb-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300">SEO: {post.seoKeyword}</span>
        </div>
      )}

      {/* Hashtags / Tags */}
      {((post.hashtags && post.hashtags.length > 0) || (post.tags && post.tags.length > 0)) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {(post.hashtags || []).map((h) => (
            <span key={h} className="text-xs text-blue-400">#{h}</span>
          ))}
          {(post.tags || []).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{t}</span>
          ))}
        </div>
      )}

      {/* Engagement (published only) */}
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
      {!isEditing && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-800/50">
          {post.status === "draft" && (
            <button onClick={handleApprove} className="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve</button>
          )}
          {onEditInEditor ? (
            <button onClick={() => onEditInEditor(post.id)} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Edit</button>
          ) : (
            <button onClick={() => { setEditText(post.text); setEditingPost(post.id); }} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Edit</button>
          )}
          {onPickImage && post.status === "draft" && !onEditInEditor && (
            <button onClick={() => onPickImage(post.id)} className="px-2 py-1 text-xs bg-purple-900/50 text-purple-300 rounded hover:bg-purple-800">Image</button>
          )}
          {post.status !== "published" && (
            <button onClick={handleDelete} className="px-2 py-1 text-xs bg-red-900/50 text-red-300 rounded hover:bg-red-800">Delete</button>
          )}
        </div>
      )}
    </div>
  );
}
