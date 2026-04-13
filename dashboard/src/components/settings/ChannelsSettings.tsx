"use client";

import { useChannelConfig } from "@/hooks/useChannelConfig";
import Link from "next/link";

function ChRow({ channelKey, icon, iconClass, label, sub, connected }: {
  channelKey: string; icon: string; iconClass: string; label: string; sub: string; connected: boolean;
}) {
  return (
    <Link href={`/channels/${channelKey}`} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 cursor-pointer hover:bg-gray-800/50 block">
      <div className="flex items-center gap-3">
        <span className={`w-6 h-6 rounded ${iconClass} flex items-center justify-center text-[8px] font-bold text-white`}>{icon}</span>
        <div>
          <p className="text-xs text-gray-300">{label}</p>
          <p className="text-[10px] text-gray-600">{sub}</p>
        </div>
      </div>
      <span className={`text-[10px] ${connected ? "text-green-400" : "text-gray-600"}`}>
        {connected ? "Connected" : ""}
      </span>
    </Link>
  );
}

export function ChannelsSettings() {
  const { data: channelConfig } = useChannelConfig();
  const cfg = (channelConfig || {}) as Record<string, { connected?: boolean; userId?: string; keys?: Record<string, string> }>;

  return (
    <>
      <p className="text-[10px] text-gray-500 mb-4">콘텐츠를 발행할 SNS 채널. 클릭하면 해당 채널 설정으로 이동합니다.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Social</h3>
          <div className="space-y-2">
            <ChRow channelKey="threads" icon="T" iconClass="bg-gradient-to-br from-purple-500 to-pink-500" label="Threads" sub={cfg.threads?.userId ? "ID: " + cfg.threads.userId : ""} connected={!!cfg.threads?.connected} />
            <ChRow channelKey="x" icon="X" iconClass="bg-gray-700" label="X (Twitter)" sub={cfg.x?.connected ? "OAuth 1.0a" : ""} connected={!!cfg.x?.connected} />
            <ChRow channelKey="instagram" icon="IG" iconClass="bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600" label="Instagram" sub={cfg.instagram?.userId ? "ID: " + cfg.instagram.userId : ""} connected={!!cfg.instagram?.connected} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Messaging &amp; Others</h3>
          <div className="space-y-2">
            <ChRow channelKey="telegram" icon="TG" iconClass="bg-blue-500" label="Telegram" sub="" connected={!!cfg.telegram?.connected} />
            <ChRow channelKey="discord" icon="DC" iconClass="bg-indigo-600" label="Discord" sub="" connected={!!cfg.discord?.connected} />
            <ChRow channelKey="slack" icon="SL" iconClass="bg-green-700" label="Slack" sub="" connected={!!cfg.slack?.connected} />
          </div>
        </div>
      </div>
    </>
  );
}
