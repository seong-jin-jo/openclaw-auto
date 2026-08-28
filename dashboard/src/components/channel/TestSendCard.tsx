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
    <div className="card p-stack-section">
      <h3 className="text-body-sm font-medium text-muted mb-stack">테스트 발송</h3>
      <div className="flex gap-stack-tight">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-surface border border-border rounded-chip px-stack py-stack-tight text-body-sm text-subtle"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-pad-inset py-stack-tight bg-accent text-accent-fg text-caption rounded-chip hover:bg-accent-hover disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
      {chatConfigured ? (
        <div className="mt-stack p-stack-tight rounded-chip bg-success/10 border border-success/20">
          <p className="text-caption text-success">
            Interactive Chat 연결됨. 이 채널에서 Agent와 대화 가능
          </p>
        </div>
      ) : (
        <div className="mt-stack p-stack-tight rounded-chip bg-surface/50">
          <p className="text-caption text-subtle">
            Interactive Chat: Gateway에서 <code>openclaw channels setup {channel}</code>로 양방향 대화 활성화
          </p>
        </div>
      )}
    </div>
  );
}
