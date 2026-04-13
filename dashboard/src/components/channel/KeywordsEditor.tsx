"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useChannelKeywords } from "@/hooks/useChannelConfig";
import { useToast } from "@/components/layout/Toast";
import { CH_LABELS } from "@/lib/constants";

interface KeywordsEditorProps {
  channel: string;
}

export function KeywordsEditor({ channel }: KeywordsEditorProps) {
  const { data, mutate } = useChannelKeywords(channel);
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const label = CH_LABELS[channel] || channel;
  const keywords = data?.keywords || [];

  const [text, setText] = useState<string | null>(null);
  const displayText = text ?? keywords.join("\n");

  const handleSave = async () => {
    setSaving(true);
    try {
      const kw = displayText.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
      await apiPost(`/api/keywords/${channel}`, { keywords: kw });
      showToast(`키워드 저장됨 (${label})`, "success");
      mutate();
    } catch (e) { showToast(`저장 실패: ${(e as Error).message}`, "error"); }
    finally { setSaving(false); }
  };

  const handleCopyCommon = () => {
    if (data?.common) {
      setText(data.common.join("\n"));
      showToast("공통 키워드 복사됨", "info");
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">
          {channel === "x" ? "Search Keywords" : "Keywords"} <span className="text-[10px] text-gray-600">({label})</span>
        </h3>
        <div className="flex gap-2">
          <button onClick={handleCopyCommon} className="px-2 py-1 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700">
            공통에서 복사
          </button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <textarea
        value={displayText}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
        rows={6}
      />
    </div>
  );
}
