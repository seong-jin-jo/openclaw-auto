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
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[] | null>(null);

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

  const handleAiSuggest = async () => {
    setSuggesting(true);
    setSuggestedKeywords(null);
    try {
      const currentKw = displayText.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
      const r = await apiPost<{ success: boolean; keywords: string[] }>("/api/ai-suggest/keywords", {
        channel: label,
        currentKeywords: currentKw,
      });
      if (r?.success && r.keywords) {
        setSuggestedKeywords(r.keywords);
        showToast(`${r.keywords.length}개 키워드 제안됨`, "success");
      } else {
        showToast("제안 생성 실패", "error");
      }
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
    finally { setSuggesting(false); }
  };

  const handleApplyAll = () => {
    if (suggestedKeywords) {
      const current = displayText.split("\n").map((l) => l.trim()).filter((l) => l);
      const merged = [...new Set([...current, ...suggestedKeywords])];
      setText(merged.join("\n"));
      setSuggestedKeywords(null);
      showToast("전체 적용됨 — Save를 눌러 저장하세요", "info");
    }
  };

  const handleApplyOne = (kw: string) => {
    const current = displayText.split("\n").map((l) => l.trim()).filter((l) => l);
    if (!current.includes(kw)) {
      setText([...current, kw].join("\n"));
      showToast(`"${kw}" 추가됨`, "info");
    } else {
      showToast("이미 포함된 키워드", "warning");
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">
          {channel === "x" ? "Search Keywords" : "Keywords"} <span className="text-[10px] text-gray-600">({label})</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleAiSuggest}
            disabled={suggesting}
            className="px-2 py-1 text-[10px] bg-purple-700 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {suggesting ? "생성중..." : "AI 제안"}
          </button>
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

      {/* AI 제안 결과 */}
      {suggestedKeywords && (
        <div className="mt-3 border border-purple-800/50 rounded-lg bg-purple-900/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-purple-400 font-medium">AI 제안 ({suggestedKeywords.length}개)</span>
            <div className="flex gap-2">
              <button onClick={handleApplyAll} className="px-2 py-1 text-[10px] bg-purple-700 text-white rounded hover:bg-purple-600">
                전체 추가
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(suggestedKeywords.join("\n")); showToast("클립보드에 복사됨", "info"); }}
                className="px-2 py-1 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700"
              >
                복사
              </button>
              <button onClick={() => setSuggestedKeywords(null)} className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300">
                닫기
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedKeywords.map((kw, i) => (
              <button
                key={i}
                onClick={() => handleApplyOne(kw)}
                className="px-2 py-1 text-[10px] bg-gray-800 text-gray-300 rounded hover:bg-purple-800 hover:text-purple-200 transition-colors"
                title="클릭하면 추가"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
