"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { fmtAgo } from "@/lib/format";
import type { Workspace } from "@/store/ui-store";

// 레포 위키 연동 모달 → brand_guides에 인입(source='repo').
// public 레포 raw fetch → claude -p 증류 → 브랜드 가이드 자동 갱신.
interface SourceRow {
  source?: string; source_repo?: string; source_path?: string; source_ref?: string;
  synced_at?: string; prompt_guide?: string;
}

export function RepoConnect({ workspace, onSynced, onClose }: { workspace: Workspace; onSynced?: () => void; onClose: () => void }) {
  const { data, mutate } = useSWR<{ source?: SourceRow }>(`/api/brand/sync-repo?tenant_id=${workspace.id}`, fetcher);
  const cur = data?.source;
  const [repo, setRepo] = useState(cur?.source_repo || "");
  const [path, setPath] = useState(cur?.source_path || "");
  const [ref, setRef] = useState(cur?.source_ref || "main");
  const [token, setToken] = useState(""); // 비공개 레포 GitHub 토큰(선택)
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const sync = async () => {
    if (!repo.trim() || !path.trim() || busy) return;
    setBusy(true); setMsg("");
    try {
      // 비공개 레포 토큰 입력 시 먼저 integrations에 암호화 저장
      if (token.trim()) {
        await apiPost("/api/integrations", { tenant_id: workspace.id, kind: "repo_token", label: "github", secret: token.trim(), meta: {} });
        setToken("");
      }
      const r = await apiPost<{ ok?: boolean; skipped?: boolean; reason?: string; error?: string }>(
        "/api/brand/sync-repo", { tenant_id: workspace.id, repo: repo.trim(), path: path.trim(), ref: ref.trim() || "main" });
      if (r?.ok) {
        await mutate();
        setMsg(r.skipped ? `변경 없음 (${r.reason})` : "브랜드 가이드 갱신됨 ✓");
        onSynced?.();
      } else setMsg(r?.error || "동기화 실패");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 w-[480px] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">📚 레포 위키 연동</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm">✕</button>
        </div>
        <p className="text-xs text-gray-500 mb-4">GitHub 레포의 마케팅 위키를 가져와 브랜드 가이드로 자동 증류합니다. (현재 public 레포)</p>

        {cur?.source === "repo" && cur.source_repo && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-purple-900/15 border border-purple-800/30 text-xs text-gray-300">
            연동됨: <span className="text-purple-300">{cur.source_repo}/{cur.source_path}</span>
            <span className="text-gray-500"> @{cur.source_ref}</span>
            {cur.synced_at && <span className="text-gray-600"> · {fmtAgo(cur.synced_at)}</span>}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-gray-500">레포 (owner/name)</label>
            <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repo"
              className="w-full mt-1 px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:border-purple-500 outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500">파일 경로 (여러 개는 쉼표로)</label>
            <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="docs/brand.md, docs/marketing.md"
              className="w-full mt-1 px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:border-purple-500 outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500">브랜치 (기본 main)</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="main"
              className="w-full mt-1 px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:border-purple-500 outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500">GitHub 토큰 (비공개 레포만 · 한 번 저장하면 재입력 불필요)</label>
            <input value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="ghp_… (fine-grained, contents 읽기)"
              className="w-full mt-1 px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:border-purple-500 outline-none" />
          </div>
        </div>

        {msg && <p className={`text-xs mt-3 ${msg.includes("✓") || msg.includes("없음") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}

        <button onClick={sync} disabled={busy || !repo.trim() || !path.trim()}
          className="w-full mt-4 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50">
          {busy ? "동기화 중… (claude 증류)" : "🔄 위키 가져와 브랜드 갱신"}
        </button>
        <p className="text-[10px] text-gray-600 mt-2">private 레포 토큰 연동 · 자동 동기화(cron/webhook)는 후속 단계.</p>
      </div>
    </div>
  );
}
