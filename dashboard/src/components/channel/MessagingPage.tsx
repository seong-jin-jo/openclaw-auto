"use client";

import { useChannelConfig, useNotifSettings, useChatChannels } from "@/hooks/useChannelConfig";
import { apiPost, fetcher } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { useUIStore } from "@/store/ui-store";
import { CH_LABELS, CH_STATUS_LABEL } from "@/lib/constants";
import { setupGuides } from "@/lib/setup-guides";
import { CredentialForm } from "@/components/shared/CredentialForm";
import { SetupGuide } from "@/components/shared/SetupGuide";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";

interface MessagingPageProps {
  channel: string;
}

export function MessagingPage({ channel }: MessagingPageProps) {
  const label = CH_LABELS[channel] || channel;
  const { data: channelConfig, mutate: mutateConfig } = useChannelConfig();
  const { data: notifSettings } = useNotifSettings();
  const { data: chatChannels } = useChatChannels();
  const { showToast } = useToast();
  const { showDetail, setShowDetail } = useUIStore();
  const [testMsg, setTestMsg] = useState("Marketing Hub 테스트 메시지");
  const [sending, setSending] = useState(false);

  const cfg = channelConfig?.[channel];
  const status = cfg?.status || "available";
  const keys = cfg?.keys || {};
  const hasKeys = Object.values(keys).some((v) => v);
  const sg = setupGuides[channel] || { fields: [], labels: [], quick: ["Setup guide 준비 중"], detail: "" };

  const handleCredSave = async (newKeys: Record<string, string>) => {
    const r = await apiPost<{ verified?: boolean; error?: string; account?: string }>(`/api/channel-config/${channel}`, newKeys);
    if (r?.verified) {
      showToast(`${label} 연결 완료${r.account ? " — " + r.account : ""}`, "success");
      mutateConfig();
    } else {
      showToast(`연결 실패: ${r?.error || "Invalid credentials"}`, "error");
      throw new Error(r?.error || "Verification failed");
    }
  };

  const handleTestSend = async () => {
    setSending(true);
    try {
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/send-notification", { channel, message: testMsg });
      if (r?.ok) showToast(`${channel} 전송 완료`, "success");
      else showToast(`전송 실패: ${r?.error || "unknown"}`, "error");
    } catch (e) { showToast(`전송 실패: ${(e as Error).message}`, "error"); }
    finally { setSending(false); }
  };

  const chatConfigured = chatChannels?.[channel]?.configured;

  return (
    <div className="px-8 py-6">
      <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm mb-1 inline-block">
        &larr; Back
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-white">
          {label[0]}
        </span>
        <div>
          <h2 className="text-xl font-semibold text-white">{label}</h2>
          <p className="text-xs text-gray-500">{CH_STATUS_LABEL[status] || status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credentials */}
        <div className="card p-5">
          <CredentialForm
            channelKey={channel}
            fields={sg.fields}
            labels={sg.labels}
            currentKeys={keys}
            onSave={handleCredSave}
          />
        </div>

        {/* Channel Info + Setup Guide */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Channel Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={status === "live" ? "text-green-400" : status === "connected" ? "text-blue-400" : "text-gray-500"}>
                  {status === "live" ? "Live" : status === "connected" ? "Connected" : "Not connected"}
                </span>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <SetupGuide quick={sg.quick} detail={sg.detail} />
          </div>
        </div>

        {/* Notification status */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">알림 발송</h3>
          <p className="text-[10px] text-gray-600 mb-3">이 채널로 마케팅 알림을 자동 발송할 수 있습니다.</p>
          <div className="space-y-2">
            {[
              { evt: "onPublish", label2: "글 발행 시" },
              { evt: "onViral", label2: "바이럴 감지 시" },
              { evt: "onError", label2: "크론 에러 시" },
              { evt: "weeklyReport", label2: "주간 리포트" },
            ].map(({ evt, label2 }) => {
              const enabled = (notifSettings as Record<string, { channels?: string[] }> | undefined)?.[evt]?.channels?.includes(channel);
              return (
                <div key={evt} className="flex items-center justify-between p-2 rounded bg-gray-900/50">
                  <span className="text-xs text-gray-400">{label2}</span>
                  <span className={`text-[10px] ${enabled ? "text-green-400" : "text-gray-600"}`}>{enabled ? "ON" : "OFF"}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-600 mt-2">Settings &gt; Notifications에서 변경</p>
        </div>

        {/* Test send */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">테스트 발송</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
            />
            <button
              onClick={handleTestSend}
              disabled={sending}
              className="px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
          {chatConfigured ? (
            <div className="mt-3 p-2 rounded bg-green-900/20 border border-green-800/20">
              <p className="text-[10px] text-green-400">Interactive Chat 연결됨 — 이 채널에서 Agent와 대화 가능</p>
            </div>
          ) : (
            <div className="mt-3 p-2 rounded bg-gray-900/50">
              <p className="text-[10px] text-gray-500">
                Interactive Chat: Gateway에서 <code>openclaw channels setup {channel}</code>로 양방향 대화 활성화
              </p>
            </div>
          )}
        </div>

        {/* Slack-only: Weekly Report Template */}
        {channel === "slack" && <SlackReportSection />}
      </div>
    </div>
  );
}

/* ── Slack Report Template Section ── */
function SlackReportSection() {
  const { data: tmplData, mutate: mutateTmpl } = useSWR<{ template: string }>("/api/slack-template", fetcher);
  const { showToast } = useToast();
  const [template, setTemplate] = useState<string | null>(null);
  const [preview, setPreview] = useState("");
  const [sendingReport, setSendingReport] = useState(false);

  const tmplValue = template ?? tmplData?.template ?? "";

  const handleSave = async () => {
    try {
      await apiPost("/api/slack-template", { template: tmplValue });
      showToast("템플릿 저장 완료", "success");
      mutateTmpl();
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handlePreview = async () => {
    try {
      const res = await fetch("/api/slack-report-preview", { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}` } });
      const data = await res.json();
      if (data?.report) setPreview(data.report);
      else showToast(data?.error || "미리보기 실패", "error");
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      const res = await apiPost<{ ok?: boolean; error?: string }>("/api/slack-send-custom");
      if (res?.ok) showToast("리포트 발송 완료", "success");
      else showToast(res?.error || "발송 실패", "error");
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
    finally { setSendingReport(false); }
  };

  return (
    <div className="card p-5 md:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">주간 리포트 템플릿</h3>
        <button onClick={handlePreview} className="text-[10px] text-blue-400 hover:text-blue-300">Preview</button>
      </div>
      <textarea
        value={tmplValue}
        onChange={(e) => setTemplate(e.target.value)}
        rows={12}
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-gray-300 font-mono mb-2"
        placeholder="Loading..."
      />
      <div className="flex gap-2">
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">Save Template</button>
        <button onClick={handleSendReport} disabled={sendingReport} className="px-4 py-2 bg-purple-700 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50">
          {sendingReport ? "Sending..." : "Send Report"}
        </button>
      </div>
      <details className="mt-2">
        <summary className="text-[10px] text-blue-400 cursor-pointer">사용 가능한 변수</summary>
        <div className="text-[10px] text-gray-500 mt-1 font-mono space-y-0.5">
          <div>{"{blog_articles}"} {"{blog_views}"} {"{blog_delta}"} {"{blog_top}"}</div>
          <div>{"{gsc_clicks}"} {"{gsc_impressions}"} {"{gsc_ctr}"} {"{gsc_top_keywords}"}</div>
          <div>{"{ga_sessions}"} {"{ga_pageviews}"}</div>
          <div>{"{dashboard_url}"}</div>
        </div>
      </details>
      {preview && (
        <div className="mt-3 p-3 rounded bg-gray-900/80 border border-gray-800">
          <pre className="text-[10px] text-gray-300 whitespace-pre-wrap">{preview}</pre>
        </div>
      )}
    </div>
  );
}
