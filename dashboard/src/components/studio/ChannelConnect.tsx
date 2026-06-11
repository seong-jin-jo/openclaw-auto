"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import type { Workspace } from "@/store/ui-store";

// 채널 토큰 연결 모달 → integrations 저장. 연결되면 실발행 가능.
const CHANNELS = [
  { key: "threads", label: "Threads", needUser: true, userLabel: "User ID", hint: "Meta 개발자 콘솔 → Threads access token(60일) + user id" },
  { key: "instagram", label: "Instagram", needUser: true, userLabel: "IG User ID", hint: "Instagram Graph API access token + ig user id" },
];

interface IntegrationRow { id: string; kind: string; label: string; has_secret: boolean }

export function ChannelConnect({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) {
  const { data, mutate } = useSWR<{ integrations?: IntegrationRow[] }>(`/api/integrations?tenant_id=${workspace.id}`, fetcher);
  const connected = new Set((data?.integrations || []).filter((i) => i.kind === "channel" && i.has_secret).map((i) => i.label));
  const [platform, setPlatform] = useState("threads");
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const ch = CHANNELS.find((c) => c.key === platform)!;

  const save = async () => {
    if (!token.trim() || busy) return;
    setBusy(true); setMsg("");
    try {
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/integrations", {
        tenant_id: workspace.id, kind: "channel", label: platform,
        secret: token.trim(), meta: ch.needUser ? { userId: userId.trim() } : {},
      });
      if (r?.ok) { await mutate(); setToken(""); setUserId(""); setMsg(`${ch.label} 연결됨 ✓`); }
      else setMsg(r?.error || "저장 실패");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-purple-500/20 bg-[#141414]/95 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">채널 연결</h2>
          <button onClick={onClose} className="text-gray-500 text-sm">✕</button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{workspace.name} · 토큰 연결 시 실제 발행됩니다</p>

        <div className="flex gap-2 mb-3">
          {CHANNELS.map((c) => (
            <button key={c.key} onClick={() => setPlatform(c.key)} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 ${platform === c.key ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-gray-800 text-gray-400"}`}>
              {c.label}{connected.has(c.key) && <span className="text-green-400">✓</span>}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder={`${ch.label} access token`} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
          {ch.needUser && <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder={ch.userLabel} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />}
          <p className="text-[10px] text-gray-600">{ch.hint}</p>
        </div>

        {msg && <p className={`text-xs mt-2 ${msg.includes("✓") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
        <div className="flex justify-end mt-4">
          <button onClick={save} disabled={busy} className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50">{busy ? "저장 중…" : "연결 저장"}</button>
        </div>
      </div>
    </div>
  );
}
