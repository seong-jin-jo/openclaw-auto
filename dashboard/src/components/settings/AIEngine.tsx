"use client";

import useSWR from "swr";
import { apiPost, fetcher } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface RuntimeData {
  mode: "gateway" | "cli";
}

export function AIEngine() {
  const { data: runtimeData, mutate } = useSWR<RuntimeData>("/api/ai-runtime", fetcher);
  const { showToast } = useToast();

  const mode = runtimeData?.mode || "gateway";

  const handleModeSwitch = async (newMode: string) => {
    try {
      await apiPost("/api/ai-runtime", { action: "set-mode", mode: newMode });
      showToast(newMode === "cli" ? "Claude CLI (Plan Usage)" : "OpenClaw Gateway", "success");
      mutate();
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Runtime</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => handleModeSwitch("gateway")} className={`p-3 rounded border text-left transition-colors ${mode === "gateway" ? "border-blue-600 bg-blue-950/30" : "border-gray-700 hover:border-gray-600"}`}>
          <div className="text-xs font-medium text-gray-200">OpenClaw Gateway</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Extra Usage 과금</div>
        </button>
        <button onClick={() => handleModeSwitch("cli")} className={`p-3 rounded border text-left transition-colors ${mode === "cli" ? "border-green-600 bg-green-950/30" : "border-gray-700 hover:border-gray-600"}`}>
          <div className="text-xs font-medium text-gray-200">Claude CLI</div>
          <div className="text-[10px] text-green-500/70 mt-0.5">Plan Usage (Max Plan)</div>
        </button>
      </div>
      <p className="text-[10px] text-gray-600 mt-3">각 크론잡의 On/Off는 채널별 설정에서 관리합니다.</p>
    </div>
  );
}
