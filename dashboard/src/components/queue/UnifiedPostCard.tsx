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

const CHANNEL_BADGE_CLASS: Record<string, string> = {
  published: "bg-success/15 text-success",
  failed: "bg-danger/15 text-danger",
  pending: "bg-surface-2 text-subtle",
  skipped: "bg-surface-2 text-subtle",
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
    <span className={`text-caption px-1.5 py-0.5 rounded ${CHANNEL_BADGE_CLASS[status] || "bg-surface-2 text-muted"}`}>
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
  const [makingVariants, setMakingVariants] = useState(false);
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

  const handleMakeVariants = async () => {
    if (makingVariants) return;
    setMakingVariants(true);
    try {
      const r = await apiPost<{ created: number }>(`/api/queue/${post.id}/variants`, { count: 3 });
      showToast(`텍스트 변형 ${r?.created ?? 0}개 생성됨 (같은 영상)`, "success");
      onRefresh();
    } catch (e) { showToast(`변형 생성 실패: ${(e as Error).message}`, "error"); }
    finally { setMakingVariants(false); }
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
            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(post.id)} className="rounded border-border" />
          )}
          <span className={`text-caption px-2 py-0.5 rounded ${STATUS_CLASS[post.status] || "bg-surface-2 text-muted"}`}>
            {post.status}
          </span>
          {isCard && variant === "visual" && (
            <span className="text-caption px-1.5 py-0.5 rounded bg-accent-soft text-accent">
              Card {slides.length} slides
            </span>
          )}
          <span className="text-xs text-subtle">{post.topic || ""}</span>
          {post.model && <span className="text-xs text-subtle">{post.model}</span>}
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
            <div className="scrollbar-semantic flex gap-2 overflow-x-auto pb-2">
              {slides.map((s, i) => (
                <div key={i} className="flex-shrink-0 w-36 h-44 rounded-lg overflow-hidden border border-border">
                  <img src={s} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-3 w-36 h-44 rounded-lg border border-dashed border-border bg-surface/30 flex items-center justify-center">
            <span className="text-subtle text-xs">No Image</span>
          </div>
        )
      ) : variant === "blog" ? (
        /* Blog: small thumbnail */
        post.imageUrl ? (
          <div className="mb-2 float-right ml-3 max-w-30">
            <img src={post.imageUrl} alt="Thumbnail" className="w-full rounded border border-border" />
          </div>
        ) : null
      ) : (
        /* Text: medium image */
        post.imageUrl ? (
          <div className="mb-2 relative group/img max-w-lg">
            <img src={post.imageUrl} alt="Post image" className="block w-full rounded-lg border border-border" />
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
        ) : null
      )}

      {/* Video for repurposed clips */}
      {(post.videoFilename || post.videoUrl) && (
        <div className="mb-2">
          <video
            src={post.videoUrl || `/videos/${post.videoFilename}`}
            poster={post.videoThumbnail || undefined}
            controls
            preload="none"
            className="max-h-52 w-full rounded border border-border"
          />
          {post.status === "draft" && (
            <button
              onClick={handleMakeVariants}
              disabled={makingVariants}
              className="mt-1.5 px-2 py-1 text-xs bg-accent-soft text-accent rounded hover:bg-accent-hover disabled:opacity-50"
              title="이 클립을 그대로 두고 텍스트(캡션)만 다르게 한 변형을 큐에 추가"
            >
              {makingVariants ? "변형 생성 중…" : "이 클립으로 텍스트 변형 3개 생성"}
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
          {charLimit && (
            <p className={`text-caption mb-1 ${editText.length > charLimit ? "text-red-400" : "text-subtle"}`}>
              {editText.length}/{charLimit}
            </p>
          )}
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
        <>
          <p className={`text-sm text-muted mb-2 whitespace-pre-wrap ${variant === "visual" ? "line-clamp-4" : ""}`}>{post.text}</p>
          {charWarning && (
            <p className="text-caption text-red-400 mb-1">{post.text.length}/{charLimit} 글자 초과</p>
          )}
        </>
      )}

      {/* Quality indicators */}
      {post.status === "draft" && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {post.text.length < 30 && <span className="text-caption px-1.5 py-0.5 rounded bg-warning/15 text-warning">짧음</span>}
          {(!post.hashtags || post.hashtags.length === 0) && <span className="text-caption px-1.5 py-0.5 rounded bg-surface-2 text-subtle">해시태그 없음</span>}
          {variant === "visual" && !post.imageUrl && <span className="text-caption px-1.5 py-0.5 rounded bg-danger/15 text-danger">이미지 필요</span>}
        </div>
      )}

      {/* SEO keyword badge (blog only) */}
      {showSeo && post.seoKeyword && (
        <div className="mb-2">
          <span className="text-caption px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300">SEO: {post.seoKeyword}</span>
        </div>
      )}

      {/* Hashtags / Tags */}
      {((post.hashtags && post.hashtags.length > 0) || (post.tags && post.tags.length > 0)) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {(post.hashtags || []).map((h) => (
            <span key={h} className="text-xs text-accent">#{h}</span>
          ))}
          {(post.tags || []).map((t) => (
            <span key={t} className="text-caption px-1.5 py-0.5 rounded bg-surface-2 text-subtle">{t}</span>
          ))}
        </div>
      )}

      {/* Engagement (published only) */}
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
      {!isEditing && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
          {post.status === "draft" && (
            <button onClick={handleApprove} className="px-2 py-1 text-xs bg-green-700 text-text rounded hover:bg-green-600">Approve</button>
          )}
          {onEditInEditor ? (
            <button onClick={() => onEditInEditor(post.id)} className="px-2 py-1 text-xs bg-surface-2 text-muted rounded hover:bg-surface-2">Edit</button>
          ) : (
            <button onClick={() => { setEditText(post.text); setEditingPost(post.id); }} className="px-2 py-1 text-xs bg-surface-2 text-muted rounded hover:bg-surface-2">Edit</button>
          )}
          {onPickImage && post.status === "draft" && !onEditInEditor && (
            <button onClick={() => onPickImage(post.id)} className="px-2 py-1 text-xs bg-accent-soft text-accent rounded hover:bg-accent-hover">Image</button>
          )}
          {post.status !== "published" && (
            <button onClick={handleDelete} className="px-2 py-1 text-xs bg-danger/15 text-danger rounded hover:bg-danger/25">Delete</button>
          )}
          {post.status === "published" && (
            <a href="/" className="px-2 py-1 text-xs bg-accent-soft text-accent rounded hover:bg-accent-hover">성과 보기 →</a>
          )}
        </div>
      )}
    </div>
  );
}
