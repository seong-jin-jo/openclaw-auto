"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";
import { fmtAgo } from "@/lib/format";

interface PostRow {
  id: string; platform: string; external_id?: string; permalink?: string;
  text?: string; status: string; error?: string; published_at: string;
  views?: number; likes?: number; replies?: number; reposts?: number; metrics_at?: string;
}

export default function PerformancePage() {
  const { activeWorkspace } = useUIStore();
  const { data, mutate } = useSWR<{ posts?: PostRow[] }>(
    activeWorkspace ? `/api/metrics?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const [busy, setBusy] = useState(false);
  const posts = data?.posts || [];
  const published = posts.filter((p) => p.status === "published");
  const sum = (k: keyof PostRow) => published.reduce((a, p) => a + (Number(p[k]) || 0), 0);

  const collect = async () => {
    if (!activeWorkspace || busy) return;
    setBusy(true);
    try { await apiPost("/api/metrics", { tenant_id: activeWorkspace.id }); await mutate(); }
    finally { setBusy(false); }
  };

  if (!activeWorkspace) return <div className="px-8 py-6"><p className="text-gray-500">워크스페이스를 선택하세요.</p></div>;

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">성과</h1>
          <p className="text-xs text-gray-500">{activeWorkspace.name} · 발행물 성과(조회·좋아요·답글·리포스트)</p>
        </div>
        <button onClick={collect} disabled={busy} className="px-3 py-2 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50">{busy ? "수집 중…" : "🔄 성과 수집"}</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {card("발행물", published.length)}
        {card("조회", sum("views"))}
        {card("좋아요", sum("likes"))}
        {card("답글", sum("replies"))}
        {card("리포스트", sum("reposts"))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] text-gray-500 border-b border-gray-800">
            <th className="text-left p-3">플랫폼</th><th className="text-left p-3">내용</th>
            <th className="p-3">상태</th><th className="p-3">조회</th><th className="p-3">좋아요</th>
            <th className="p-3">답글</th><th className="p-3">발행</th>
          </tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-gray-900 text-gray-300">
                <td className="p-3 text-xs">{p.platform}</td>
                <td className="p-3 text-xs max-w-xs truncate">
                  {p.permalink ? <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="hover:underline text-purple-300">{p.text?.slice(0, 50) || "(게시물)"} ↗</a> : (p.text?.slice(0, 50) || "—")}
                  {p.status === "failed" && <span className="text-red-400 text-[10px] block">{p.error?.slice(0, 60)}</span>}
                </td>
                <td className="p-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "published" ? "bg-green-900/50 text-green-400" : "bg-red-900/40 text-red-400"}`}>{p.status}</span></td>
                <td className="p-3 text-center text-xs">{p.views ?? "—"}</td>
                <td className="p-3 text-center text-xs">{p.likes ?? "—"}</td>
                <td className="p-3 text-center text-xs">{p.replies ?? "—"}</td>
                <td className="p-3 text-center text-[10px] text-gray-500">{fmtAgo(p.published_at)}</td>
              </tr>
            ))}
            {posts.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-600 text-xs">아직 발행물이 없습니다. Studio에서 발행하세요.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function card(title: string, value: number) {
  return (
    <div className="card p-4">
      <div className="text-[11px] text-gray-500">{title}</div>
      <div className="text-xl font-bold text-white mt-1">{value.toLocaleString()}</div>
    </div>
  );
}
