"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useChatChannels } from "@/hooks/useChannelConfig";
import { useToast } from "@/components/layout/Toast";

interface TestSendCardProps {
  channel: string;
}

export function TestSendCard({ channel }: TestSendCardProps) {
  const { showToast } = useToast();
  const { data: chatChannels } = useChatChannels();
  const [message, setMessage] = useState("Marketing Hub 테스트 메시지");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/send-notification", {
        channel,
        message,
      });
      if (r?.ok) {
        showToast(`${channel} 전송 완료`, "success");
      } else {
        showToast(`전송 실패: ${r?.error || "unknown"}`, "error");
      }
    } catch (e) {
      showToast(`전송 실패: ${(e as Error).message}`, "error");
    } finally {
      setSending(false);
    }
  };

  const chatConfigured = chatChannels?.[channel]?.configured;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-gray-200 mb-3">테스트 발송</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-gray-900 border border-[#1e1e1e] rounded px-3 py-2 text-sm text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
      {chatConfigured ? (
        <div className="mt-3 p-2 rounded bg-green-900/20 border border-green-800/20">
          <p className="text-[10px] text-green-400">
            Interactive Chat 연결됨 — 이 채널에서 Agent와 대화 가능
          </p>
        </div>
      ) : (
        <div className="mt-3 p-2 rounded bg-gray-900/50">
          <p className="text-[10px] text-gray-600">
            Interactive Chat: Gateway에서 <code>openclaw channels setup {channel}</code>로 양방향 대화 활성화
          </p>
        </div>
      )}
    </div>
  );
}
