"use client";

import { useState } from "react";
import { useNotifSettings } from "@/hooks/useChannelConfig";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

const EVENT_LABELS: Record<string, string> = {
  onPublish: "글 발행 시",
  onViral: "바이럴 감지 시",
  onError: "크론 에러 시",
  weeklyReport: "주간 리포트",
};

const MESSAGING_OPTIONS = ["telegram", "discord", "slack", "line"];

export function Notifications() {
  const { data: settings, mutate } = useNotifSettings();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, { enabled: boolean; channel: string }>>({});

  const getEvt = (evt: string) => {
    if (overrides[evt]) return overrides[evt];
    const ns = settings?.[evt as keyof typeof settings];
    return { enabled: ns?.enabled ?? false, channel: ns?.channels?.[0] || "" };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, { enabled: boolean; channels: string[] }> = {};
      for (const evt of Object.keys(EVENT_LABELS)) {
        const v = getEvt(evt);
        payload[evt] = { enabled: v.enabled, channels: v.channel ? [v.channel] : [] };
      }
      await apiPost("/api/notification-settings", payload);
      showToast("알림 설정 저장됨", "success");
      mutate();
    } catch (e) { showToast(`저장 실패: ${(e as Error).message}`, "error"); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    let ch = "";
    for (const evt of ["onError", "onViral", "onPublish"]) {
      const v = getEvt(evt);
      if (v.channel) { ch = v.channel; break; }
    }
    if (!ch) { showToast("알림 채널을 먼저 설정하세요", "warning"); return; }
    try {
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/send-notification", { channel: ch, message: "\uD83D\uDD14 Marketing Hub 테스트 알림" });
      if (r?.ok) showToast(`테스트 알림 전송: ${ch}`, "success");
      else showToast(`전송 실패: ${r?.error || "unknown"}`, "error");
    } catch (e) { showToast(`전송 실패: ${(e as Error).message}`, "error"); }
  };

  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/weekly-report/send", {});
      if (r?.ok) showToast("주간 리포트 발송 완료", "success");
      else showToast(`발송 실패: ${r?.error || "unknown"}`, "error");
    } catch (e) { showToast(`발송 실패: ${(e as Error).message}`, "error"); }
    finally { setSendingReport(false); }
  };

  if (!settings) return <div className="card p-5"><p className="text-xs text-gray-600">Loading...</p></div>;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Notifications</h3>
      <div className="space-y-3">
        {Object.entries(EVENT_LABELS).map(([evt, label]) => {
          const v = getEvt(evt);
          return (
            <div key={evt} className="flex items-center justify-between p-2 rounded bg-gray-900/50">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={v.enabled}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, [evt]: { ...v, enabled: e.target.checked } }))}
                  className="rounded border-gray-600 w-3 h-3"
                />
                <span className="text-xs text-gray-300">{label}</span>
              </div>
              <select
                value={v.channel}
                onChange={(e) => setOverrides((prev) => ({ ...prev, [evt]: { ...v, channel: e.target.value } }))}
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-300"
              >
                <option value="">Off</option>
                {MESSAGING_OPTIONS.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={handleTest} className="px-4 py-2 bg-gray-800 text-gray-300 text-xs rounded hover:bg-gray-700">
          Test
        </button>
        <button onClick={handleSendReport} disabled={sendingReport} className="px-4 py-2 bg-green-800 text-green-300 text-xs rounded hover:bg-green-700 disabled:opacity-50">
          {sendingReport ? "발송 중..." : "주간 리포트 발송"}
        </button>
      </div>
    </div>
  );
}
