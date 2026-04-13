"use client";

import { useChannelConfig, useNotifSettings, useChatChannels } from "@/hooks/useChannelConfig";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { useUIStore } from "@/store/ui-store";
import { CH_LABELS, CH_STATUS_LABEL } from "@/lib/constants";
import { setupGuides } from "@/lib/setup-guides";
import { CredentialForm } from "@/components/shared/CredentialForm";
import { SetupGuide } from "@/components/shared/SetupGuide";
import { useState } from "react";
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
      </div>
    </div>
  );
}
