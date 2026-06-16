"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";

// 고객 Anthropic(Claude) 키 등록. 저장 시 콘텐츠 생성이 이 키로 호출(고객 과금·격리).
// 미등록이면 운영자 공유 엔진(claude -p) 사용. integrations(kind='anthropic')에 암호화 저장.
interface Integration { id: string; kind: string; label: string; has_secret: boolean }

export function AiKeySettings() {
  const { activeWorkspace } = useUIStore();
  const { data, mutate } = useSWR<{ integrations?: Integration[] }>(
    activeWorkspace ? `/api/integrations?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const hasKey = (data?.integrations || []).some((i) => i.kind === "anthropic" && i.has_secret);

  const save = async () => {
    if (!activeWorkspace || !key.trim() || busy) return;
    setBusy(true); setMsg("");
    try {
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/integrations", {
        tenant_id: activeWorkspace.id, kind: "anthropic", label: "claude", secret: key.trim(),
      });
      if (r?.ok) { setKey(""); setMsg("✓ Claude 키 저장됨 — 이제 생성이 이 키로 동작합니다."); await mutate(); }
      else setMsg(r?.error || "저장 실패");
    } finally { setBusy(false); }
  };

  if (!activeWorkspace) return <p className="text-sm text-gray-500">워크스페이스를 선택하세요.</p>;

  return (
    <div className="max-w-2xl p-4 rounded-xl border border-gray-800 bg-gray-900/40">
      <h3 className="text-sm font-semibold text-white mb-1">내 Claude(Anthropic) 키 · {activeWorkspace.name}</h3>
      <p className="text-xs text-gray-500 mb-3">
        내 Anthropic API 키를 등록하면 콘텐츠 생성이 <b className="text-gray-300">내 키·내 과금</b>으로 동작합니다(미등록 시 공유 엔진).
        키는 암호화 저장되며 발급은 <span className="text-purple-300">console.anthropic.com → API Keys</span>.
        현재: <span className={hasKey ? "text-green-400" : "text-gray-500"}>{hasKey ? "등록됨" : "미등록(공유 엔진 사용)"}</span>
      </p>
      <div className="flex gap-2">
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-..."
          className="flex-1 px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:border-purple-500 outline-none" />
        <button onClick={save} disabled={busy} className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50 whitespace-nowrap">
          {busy ? "저장 중…" : "키 저장"}
        </button>
      </div>
      {msg && <p className={`text-xs mt-2 ${msg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
    </div>
  );
}
