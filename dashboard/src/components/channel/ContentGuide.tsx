"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useChannelGuide } from "@/hooks/useChannelConfig";
import { useToast } from "@/components/layout/Toast";
import { CH_LABELS } from "@/lib/constants";

interface ContentGuideProps {
  channel: string;
}

export function ContentGuide({ channel }: ContentGuideProps) {
  const { data, mutate } = useChannelGuide(channel);
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const label = CH_LABELS[channel] || channel;
  const guide = data?.guide || "";
  const isChannelGuide = data?.channelGuide ?? false;

  const [text, setText] = useState<string | null>(null);
  const displayText = text ?? guide;

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPost(`/api/guide/${channel}`, { guide: displayText });
      showToast(`가이드 저장됨 (${label})`, "success");
      mutate();
    } catch (e) { showToast(`저장 실패: ${(e as Error).message}`, "error"); }
    finally { setSaving(false); }
  };

  const handleCopyCommon = () => {
    if (data?.common) {
      setText(data.common);
      showToast("공통 가이드 복사됨", "info");
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">
          Content Guide <span className="text-[10px] text-gray-600">({label})</span>
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
      <p className="text-[10px] text-gray-600 mb-2">
        {isChannelGuide ? `${label} 전용 가이드` : "공통 가이드 사용 중 — 수정하면 채널 전용으로 저장"}
        {channel === "x" ? " (280자 제한 고려)" : ""}
      </p>
      <textarea
        value={displayText}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 font-mono"
        rows={10}
      />
    </div>
  );
}
