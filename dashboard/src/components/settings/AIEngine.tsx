"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiPost, fetcher } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface RuntimeData {
  mode: "gateway" | "cli";
}

export function AIEngine() {
  const { data: runtimeData, mutate } = useSWR<RuntimeData>("/api/ai-runtime", fetcher);
  const { showToast } = useToast();
  const [switching, setSwitching] = useState(false);

  const mode = runtimeData?.mode || "gateway";

  const handleModeSwitch = async (newMode: string) => {
    if (newMode === mode) return;
    setSwitching(true);
    try {
      const r = await apiPost<{ ok: boolean; message: string; gateway: string }>("/api/ai-runtime", { action: "set-mode", mode: newMode });
      if (r?.ok) {
        showToast(r.message || "전환 완료", "success");
        if (r.gateway && r.gateway !== "ok") showToast(r.gateway, "warning");
      }
      mutate();
    } catch (e) { showToast(`전환 실패: ${(e as Error).message}`, "error"); }
    finally { setSwitching(false); }
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Runtime</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => handleModeSwitch("gateway")} disabled={switching} className={`p-3 rounded border text-left transition-colors disabled:opacity-50 ${mode === "gateway" ? "border-blue-600 bg-blue-950/30" : "border-gray-700 hover:border-gray-600"}`}>
          <div className="text-xs font-medium text-gray-200">OpenClaw Gateway</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Extra Usage 과금</div>
        </button>
        <button onClick={() => handleModeSwitch("cli")} disabled={switching} className={`p-3 rounded border text-left transition-colors disabled:opacity-50 ${mode === "cli" ? "border-green-600 bg-green-950/30" : "border-gray-700 hover:border-gray-600"}`}>
          <div className="text-xs font-medium text-gray-200">Claude CLI</div>
          <div className="text-[10px] text-green-500/70 mt-0.5">Plan Usage (Max Plan)</div>
        </button>
      </div>
      {switching && <p className="text-[10px] text-yellow-400 mt-2">전환 중... Gateway 재시작 포함 (~15초)</p>}
      <p className="text-[10px] text-gray-600 mt-3">전환 시 Gateway 자동 재시작. 크론잡 상태 자동 이관.</p>
    </div>
  );
}
