"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface KeywordEntry {
  keyword: string;
  source?: string;
  addedAt?: string;
  used?: boolean;
  usedAt?: string;
}

interface KeywordBank {
  keywords: KeywordEntry[];
}

export function KeywordBankSettings() {
  const { data, mutate } = useSWR<KeywordBank>("/api/keyword-bank", fetcher);
  const { showToast } = useToast();
  const [newKeywords, setNewKeywords] = useState("");
  const [filter, setFilter] = useState<"all" | "unused" | "used">("all");

  const keywords = data?.keywords || [];
  const filtered = filter === "all" ? keywords : keywords.filter((k) => (filter === "used" ? k.used : !k.used));

  const handleAdd = async () => {
    const kws = newKeywords.split("\n").map((k) => k.trim()).filter(Boolean);
    if (!kws.length) return;
    try {
      const res = await apiPost<{ added: number }>("/api/keyword-bank/add", { keywords: kws, source: "manual" });
      showToast(`${res?.added || 0} keywords added`, "success");
      setNewKeywords("");
      mutate();
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  const handleRemove = async (keyword: string) => {
    try {
      await apiPost("/api/keyword-bank/remove", { keyword });
      mutate();
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  const handleMarkUsed = async (keyword: string) => {
    try {
      await apiPost("/api/keyword-bank/mark-used", { keyword });
      mutate();
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">Keyword Bank</h3>
        <span className="text-[10px] text-subtle">{keywords.length} total | {keywords.filter((k) => !k.used).length} unused</span>
      </div>

      {/* Add keywords */}
      <div className="card p-4">
        <label className="text-[10px] text-subtle block mb-1">Add keywords (one per line)</label>
        <textarea
          value={newKeywords}
          onChange={(e) => setNewKeywords(e.target.value)}
          rows={3}
          className="w-full bg-surface-2 text-muted text-xs p-2 rounded border border-border font-mono mb-2"
          placeholder="keyword 1&#10;keyword 2&#10;keyword 3"
        />
        <button onClick={handleAdd} className="px-3 py-1.5 text-xs bg-accent text-text rounded hover:bg-accent-hover">Add</button>
      </div>

      {/* Filter */}
      <div className="flex gap-1">
        {(["all", "unused", "used"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 text-[10px] rounded ${filter === f ? "bg-accent text-text" : "text-subtle hover:bg-surface-2"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Keyword list */}
      <div className="card p-4 max-h-80 overflow-auto">
        {filtered.length === 0 ? (
          <p className="text-subtle text-xs text-center">No keywords</p>
        ) : (
          <div className="space-y-1">
            {filtered.map((k) => (
              <div key={k.keyword} className="flex items-center justify-between py-1 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${k.used ? "text-subtle line-through" : "text-muted"}`}>{k.keyword}</span>
                  <span className="text-[9px] text-subtle">{k.source}</span>
                </div>
                <div className="flex gap-1">
                  {!k.used && (
                    <button onClick={() => handleMarkUsed(k.keyword)} className="text-[9px] text-green-400 hover:text-green-300">Used</button>
                  )}
                  <button onClick={() => handleRemove(k.keyword)} className="text-[9px] text-red-400 hover:text-red-300">x</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
