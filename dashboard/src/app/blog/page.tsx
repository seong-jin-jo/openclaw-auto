"use client";

import { useBlogQueue } from "@/hooks/useQueue";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import type { BlogPost } from "@/types/queue";

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-yellow-900/40 text-yellow-300",
  approved: "bg-blue-900/40 text-blue-300",
  published: "bg-green-900/40 text-green-300",
  failed: "bg-red-900/40 text-red-300",
};

export default function BlogPage() {
  const { data, mutate } = useBlogQueue();
  const { showToast } = useToast();

  const raw = data as { posts?: BlogPost[] } | BlogPost[] | undefined;
  const posts: BlogPost[] = Array.isArray(raw) ? raw : (raw?.posts || []);

  const handleApprove = async (id: string) => {
    try {
      await apiPost(`/api/blog-queue/${id}/approve`);
      showToast("블로그 글 승인", "success");
      mutate();
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제?")) return;
    try {
      await apiPost(`/api/blog-queue/${id}/delete`);
      showToast("삭제 완료", "success");
      mutate();
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Blog Queue</h2>
          <p className="text-xs text-gray-500 mt-1">SEO 블로그 글 자동 생성 파이프라인</p>
        </div>
        <span className="text-sm text-gray-500">{posts.length} posts</span>
      </div>

      {posts.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm">블로그 글이 없습니다.</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_CLASS[p.status] || "bg-gray-700 text-gray-300"}`}>
                  {p.status}
                </span>
                {p.seoKeyword && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300">{p.seoKeyword}</span>
                )}
                {p.blogPostUrl && (
                  <a href={p.blogPostUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline">
                    View &rarr;
                  </a>
                )}
              </div>
              <span className="text-[10px] text-gray-600">{(p.id || "").slice(0, 8)}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-200 mb-1">{p.title || ""}</h3>
            <p className="text-xs text-gray-500 mb-2">
              {(p.body || p.content || "").replace(/<[^>]*>/g, "").slice(0, 150)}...
            </p>
            {p.tags && p.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {p.tags.slice(0, 8).map((t) => (
                  <span key={t} className="text-[10px] text-cyan-400">#{t}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              {p.status === "draft" && (
                <button onClick={() => handleApprove(p.id)} className="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve</button>
              )}
              {p.status !== "published" && (
                <button onClick={() => handleDelete(p.id)} className="px-2 py-1 text-xs bg-red-900/40 text-red-300 rounded hover:bg-red-800">Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
