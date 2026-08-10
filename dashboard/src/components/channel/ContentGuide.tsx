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
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

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

  const handleAiSuggest = async () => {
    setSuggesting(true);
    setSuggestion(null);
    try {
      const r = await apiPost<{ success: boolean; guide: string }>("/api/ai-suggest/guide", {
        channel: label,
        currentGuide: displayText,
      });
      if (r?.success && r.guide) {
        setSuggestion(r.guide);
        showToast("AI 제안 생성 완료", "success");
      } else {
        showToast("제안 생성 실패", "error");
      }
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
    finally { setSuggesting(false); }
  };

  const handleApplySuggestion = () => {
    if (suggestion) {
      setText(suggestion);
      setSuggestion(null);
      showToast("제안 적용됨 — Save를 눌러 저장하세요", "info");
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted">
          Content Guide <span className="text-caption text-subtle">({label})</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleAiSuggest}
            disabled={suggesting}
            className="px-2 py-1 text-caption bg-accent text-text rounded hover:bg-accent-hover disabled:opacity-50"
          >
            {suggesting ? "생성중..." : "AI 제안"}
          </button>
          <button onClick={handleCopyCommon} className="px-2 py-1 text-caption bg-surface-2 text-subtle rounded hover:bg-surface-2">
            공통에서 복사
          </button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-xs bg-accent text-text rounded hover:bg-accent-hover disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <p className="text-caption text-subtle mb-2">
        {isChannelGuide ? `${label} 전용 가이드` : "공통 가이드 사용 중 — 수정하면 채널 전용으로 저장"}
        {channel === "x" ? " (280자 제한 고려)" : ""}
      </p>
      <textarea
        value={displayText}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-muted font-mono"
        rows={10}
      />

      {/* AI 제안 결과 */}
      {suggestion && (
        <div className="mt-3 border border-accent rounded-lg bg-accent-soft p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption text-accent font-medium">AI 제안</span>
            <div className="flex gap-2">
              <button onClick={handleApplySuggestion} className="px-2 py-1 text-caption bg-accent text-text rounded hover:bg-accent-hover">
                적용하기
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(suggestion); showToast("클립보드에 복사됨", "info"); }}
                className="px-2 py-1 text-caption bg-surface-2 text-subtle rounded hover:bg-surface-2"
              >
                복사
              </button>
              <button onClick={() => setSuggestion(null)} className="px-2 py-1 text-caption text-subtle hover:text-muted">
                닫기
              </button>
            </div>
          </div>
          <pre className="text-xs text-muted whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">{suggestion}</pre>
        </div>
      )}
    </div>
  );
}
