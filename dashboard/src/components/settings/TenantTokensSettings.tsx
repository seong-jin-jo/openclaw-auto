"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { fmtAgo } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";

// 테넌트 API 토큰 발급/폐기(운영자). 포크 프론트에 전달 → OSMU_TENANT_TOKEN으로 중앙 API 호출.
interface TokenRow {
  id: string; tenant_id: string; label?: string;
  last_used_at?: string; revoked: boolean; created_at: string;
}

export function TenantTokensSettings() {
  const { activeWorkspace } = useUIStore();
  const { data, mutate } = useSWR<{ tokens?: TokenRow[] }>(
    activeWorkspace ? `/api/tenant-tokens?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(""); // 발급 직후 원문(1회 표시)

  const tokens = data?.tokens || [];

  const issue = async () => {
    if (!activeWorkspace || busy) return;
    setBusy(true); setIssued("");
    try {
      const r = await apiPost<{ ok?: boolean; token?: string }>("/api/tenant-tokens", {
        tenant_id: activeWorkspace.id, label: label.trim() || null,
      });
      if (r?.token) { setIssued(r.token); setLabel(""); await mutate(); }
    } finally { setBusy(false); }
  };

  const revoke = async (id: string) => {
    await fetch(`/api/tenant-tokens?id=${id}`, { method: "DELETE" });
    await mutate();
  };

  if (!activeWorkspace) return <p className="text-sm text-gray-500">워크스페이스를 선택하세요.</p>;

  return (
    <div className="max-w-2xl">
      <h3 className="text-sm font-semibold text-white mb-1">API 토큰 · {activeWorkspace.name}</h3>
      <p className="text-xs text-gray-500 mb-4">포크(프론트만 띄우는 배포)가 중앙 API를 호출할 때 쓰는 토큰입니다. 발급 후 포크의 <code className="text-purple-300">OSMU_TENANT_TOKEN</code>에 넣으세요. 이 토큰은 해당 워크스페이스 데이터에만 접근합니다.</p>

      <div className="flex gap-2 mb-3">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="용도 메모 (예: marketing-team-frontend)"
          className="flex-1 px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:border-purple-500 outline-none" />
        <button onClick={issue} disabled={busy} className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50 whitespace-nowrap">{busy ? "발급 중…" : "토큰 발급"}</button>
      </div>

      {issued && (
        <div className="mb-4 p-3 rounded-lg bg-green-900/15 border border-green-800/40">
          <p className="text-[11px] text-green-300 mb-1">발급됨 — 지금만 표시됩니다. 복사해 안전히 보관하세요:</p>
          <code className="block text-xs text-gray-100 break-all bg-black/40 p-2 rounded select-all">{issued}</code>
        </div>
      )}

      <div className="border border-gray-800 rounded-lg divide-y divide-gray-900">
        {tokens.length === 0 && <p className="p-3 text-xs text-gray-600">발급된 토큰이 없습니다.</p>}
        {tokens.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 text-sm">
            <div className="min-w-0">
              <span className={`text-xs ${t.revoked ? "text-gray-600 line-through" : "text-gray-200"}`}>{t.label || "(메모 없음)"}</span>
              <span className="text-[10px] text-gray-600 ml-2">{fmtAgo(t.created_at)}{t.last_used_at ? ` · 최근사용 ${fmtAgo(t.last_used_at)}` : " · 미사용"}</span>
            </div>
            {t.revoked ? <span className="text-[10px] text-gray-600">폐기됨</span>
              : <button onClick={() => revoke(t.id)} className="text-[11px] text-red-400 hover:text-red-300 whitespace-nowrap">폐기</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
