"use client";

import { useState, useEffect } from "react";
import { useLlmConfig } from "@/hooks/useChannelConfig";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

export function LlmModel() {
  const { data: llmConfig, mutate } = useLlmConfig();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPrimary, setSelectedPrimary] = useState("");
  const [jobOverrides, setJobOverrides] = useState<Record<string, string>>({});

  const llm = llmConfig as Record<string, unknown> | undefined;
  const available = (llm?.available as string[]) || [];
  const primary = (llm?.primary as string) || "";
  const fallbacks = (llm?.fallbacks as string[]) || [];
  const jobModels = (llm?.jobModels as Record<string, string>) || {};

  useEffect(() => { setSelectedPrimary(primary); setJobOverrides({}); }, [primary]);

  const hasConfig = !!primary;
  const editable = editing || !hasConfig;

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await apiPost<{ primary: string }>("/api/llm-config", { primary: selectedPrimary, jobModels: { ...jobModels, ...jobOverrides } });
      if (r) { showToast(`LLM 저장: ${r.primary?.split("/").pop()}`, "success"); setEditing(false); mutate(); }
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
    finally { setSaving(false); }
  };

  if (!llm) return <div className="card p-5"><p className="text-xs text-subtle">Loading...</p></div>;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted">LLM Model</h3>
        <div className="flex items-center gap-2">
          {hasConfig && (
            <span className="text-caption px-1.5 py-0.5 rounded-full bg-success/15 text-success">{primary.split("/").pop()}</span>
          )}
          {hasConfig && !editing && <button onClick={() => setEditing(true)} className="text-caption text-accent hover:text-accent">Edit</button>}
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-caption text-subtle block mb-1">Primary Model</label>
          {editable ? (
            <select value={selectedPrimary} onChange={(e) => setSelectedPrimary(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-caption text-muted font-mono">
              {available.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <div className="w-full bg-surface/50 border border-border rounded px-3 py-2 text-caption text-muted font-mono cursor-default">{primary}</div>
          )}
        </div>
        <div>
          <label className="text-caption text-subtle block mb-1">Fallback Models</label>
          <p className="text-caption text-subtle font-mono">{fallbacks.join(" → ") || "none"}</p>
        </div>
        {Object.keys(jobModels).length > 0 && (
          <div className="border-t border-border/50 pt-3">
            <p className="text-caption text-subtle uppercase tracking-wide mb-2">Per-Job Override</p>
            <div className="space-y-2">
              {Object.entries(jobModels).map(([job, model]) => (
                <div key={job} className="flex items-center justify-between gap-2">
                  <span className="text-caption text-subtle flex-shrink-0 w-40 truncate">{job}</span>
                  {editable ? (
                    <select value={jobOverrides[job] ?? model ?? ""} onChange={(e) => setJobOverrides((prev) => ({ ...prev, [job]: e.target.value }))} className="flex-1 bg-surface border border-border rounded px-2 py-1 text-caption text-muted font-mono">
                      <option value="">Default ({selectedPrimary.split("/").pop()})</option>
                      {available.filter((m) => m !== selectedPrimary).map((m) => <option key={m} value={m}>{m.split("/").pop()}</option>)}
                    </select>
                  ) : (
                    <span className="text-caption text-subtle font-mono">{(model || primary).split("/").pop()}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {editable && (
          <div className="flex gap-2 mt-3">
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs bg-accent text-text rounded hover:bg-accent-hover disabled:opacity-50">{saving ? "Saving..." : hasConfig ? "Update" : "Save"}</button>
            {hasConfig && editing && <button onClick={() => { setEditing(false); setSelectedPrimary(primary); setJobOverrides({}); }} className="px-3 py-1.5 text-xs bg-surface-2 text-muted rounded">Cancel</button>}
          </div>
        )}
      </div>
    </div>
  );
}
