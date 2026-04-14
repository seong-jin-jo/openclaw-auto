"use client";

import { useState } from "react";
import { useLlmConfig } from "@/hooks/useChannelConfig";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

export function AIEngine() {
  const { data: llmConfig, mutate } = useLlmConfig();
  // tokenStatus unused – Claude token card is separate
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const llm = llmConfig as Record<string, unknown> | undefined;
  const available = (llm?.available as string[]) || [];
  const primary = (llm?.primary as string) || "";
  const fallbacks = (llm?.fallbacks as string[]) || [];
  const jobModels = (llm?.jobModels as Record<string, string>) || {};
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [jobOverrides, setJobOverrides] = useState<Record<string, string>>({});

  const activePrimary = selectedPrimary ?? primary;

  const handleSave = async () => {
    setSaving(true);
    try {
      const mergedJobModels = { ...jobModels, ...jobOverrides };
      const r = await apiPost<{ primary: string }>("/api/llm-config", {
        primary: activePrimary,
        jobModels: mergedJobModels,
      });
      if (r) {
        showToast(`LLM 설정 저장: ${r.primary?.split("/").pop()}`, "success");
        mutate();
      }
    } catch (e) { showToast(`저장 실패: ${(e as Error).message}`, "error"); }
    finally { setSaving(false); }
  };

  if (!llm) return <div className="card p-5"><p className="text-xs text-gray-600">Loading...</p></div>;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-4">LLM Model</h3>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Primary Model</label>
          <select
            value={activePrimary}
            onChange={(e) => setSelectedPrimary(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
          >
            {available.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Fallback Models</label>
          <p className="text-xs text-gray-400">{fallbacks.join(" \u2192 ") || "none"}</p>
        </div>
        <div className="border-t border-gray-800/50 pt-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Per-Job Override</p>
          <div className="space-y-2">
            {Object.entries(jobModels).map(([job, model]) => (
              <div key={job} className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-400 flex-shrink-0 w-40 truncate">{job}</span>
                <select
                  value={jobOverrides[job] ?? model ?? ""}
                  onChange={(e) => setJobOverrides((prev) => ({ ...prev, [job]: e.target.value }))}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-300"
                >
                  <option value="">Default ({activePrimary.split("/").pop()})</option>
                  {available
                    .filter((m) => m !== activePrimary)
                    .map((m) => (
                      <option key={m} value={m}>{m.split("/").pop()}</option>
                    ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
