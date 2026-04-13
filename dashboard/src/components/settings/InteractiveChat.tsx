"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface InteractiveChatProps {
  chatChannels?: Record<string, { configured: boolean; botUsername?: string }>;
}

export function InteractiveChat({ chatChannels }: InteractiveChatProps) {
  const { showToast } = useToast();
  const [tgToken, setTgToken] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleSetupTelegram = async () => {
    if (!tgToken.trim()) { showToast("Bot Token을 입력하세요", "warning"); return; }
    setConnecting(true);
    try {
      const r = await apiPost<{ verified?: boolean; bot?: string; note?: string; error?: string }>("/api/chat-channels/telegram", { token: tgToken.trim() });
      if (r?.verified) {
        showToast(`Telegram 봇 연결: ${r.bot}. ${r.note || ""}`, "success");
        setTgToken("");
      } else {
        showToast(`연결 실패: ${r?.error || "unknown"}`, "error");
      }
    } catch (e) { showToast(`연결 실패: ${(e as Error).message}`, "error"); }
    finally { setConnecting(false); }
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Interactive Chat</h3>
      <p className="text-[10px] text-gray-600 mb-3">
        봇으로 Agent와 대화 &mdash; &quot;이번 주 성과 보여줘&quot;, &quot;다음 글 승인해&quot;, &quot;X에 글 올려&quot;
      </p>

      {chatChannels ? (
        <div className="space-y-3">
          {/* Telegram */}
          <div className="p-3 rounded bg-gray-900/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-300">Telegram</span>
              <span className={`text-[10px] ${chatChannels.telegram?.configured ? "text-green-400" : "text-gray-600"}`}>
                {chatChannels.telegram?.configured ? "Connected" : ""}
              </span>
            </div>
            {chatChannels.telegram?.configured ? (
              <p className="text-[10px] text-green-400/70">양방향 대화 활성. Gateway 재시작 후 봇에게 메시지를 보내면 Agent가 응답합니다.</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tgToken}
                    onChange={(e) => setTgToken(e.target.value)}
                    placeholder="Bot Token (@BotFather)"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[11px] text-gray-300 font-mono"
                  />
                  <button
                    onClick={handleSetupTelegram}
                    disabled={connecting}
                    className="px-3 py-1 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-500 disabled:opacity-50"
                  >
                    {connecting ? "Verifying..." : "Connect"}
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-1">@BotFather &rarr; /newbot &rarr; 토큰 복사</p>
              </>
            )}
          </div>

          {/* Slack */}
          <div className="p-3 rounded bg-gray-900/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-300">
                Slack <span className="text-[10px] text-gray-600">(양방향은 Bot+App Token 필요)</span>
              </span>
              <span className={`text-[10px] ${chatChannels.slack?.configured ? "text-green-400" : "text-gray-600"}`}>
                {chatChannels.slack?.configured ? "Connected" : ""}
              </span>
            </div>
            {chatChannels.slack?.configured ? (
              <p className="text-[10px] text-green-400/70">양방향 대화 활성</p>
            ) : (
              <p className="text-[10px] text-gray-600">
                Slack 양방향은 Bot Token(xoxb-) + App Token(xapp-) 필요. 일방향 알림은 Webhook으로 가능.
              </p>
            )}
          </div>

          {/* Discord */}
          <div className="p-3 rounded bg-gray-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Discord</span>
              <span className={`text-[10px] ${chatChannels.discord?.configured ? "text-green-400" : "text-gray-600"}`}>
                {chatChannels.discord?.configured ? "Connected" : ""}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-600">Loading...</p>
      )}
    </div>
  );
}
