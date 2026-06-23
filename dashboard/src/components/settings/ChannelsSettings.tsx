"use client";

import { useChannelConfig } from "@/hooks/useChannelConfig";
import { CH_LABELS } from "@/lib/constants";
import { getChannelIcon } from "@/lib/channel-icons";
import Link from "next/link";

// OSMU가 가진 전 채널(extensions). 클릭 → 채널 연결 화면.
const GROUPS: { title: string; channels: string[] }[] = [
  { title: "Social", channels: ["threads", "x", "instagram", "facebook", "linkedin", "bluesky", "pinterest", "tumblr"] },
  { title: "Video", channels: ["tiktok", "youtube"] },
  { title: "Blog", channels: ["naver_blog"] },
  { title: "Messaging", channels: ["telegram", "discord", "slack", "line"] },
];

function ChRow({ channelKey, label, sub, connected }: {
  channelKey: string; label: string; sub: string; connected: boolean;
}) {
  return (
    <Link href={`/channels/${channelKey}`} className="flex items-center justify-between p-3 rounded-lg bg-surface/50 hover:bg-surface-2/50">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded bg-surface-2 flex items-center justify-center text-muted">{getChannelIcon(channelKey)}</span>
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="text-[10px] text-subtle">{sub}</p>
        </div>
      </div>
      <span className={`text-[10px] ${connected ? "text-green-500" : "text-accent"}`}>
        {connected ? "Connected" : "연결 →"}
      </span>
    </Link>
  );
}

export function ChannelsSettings() {
  const { data: channelConfig } = useChannelConfig();
  const cfg = (channelConfig || {}) as Record<string, { connected?: boolean; userId?: string }>;

  return (
    <>
      <p className="text-[10px] text-subtle mb-4">콘텐츠를 발행할 채널. 클릭하면 해당 채널 연결 화면으로 이동합니다.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GROUPS.map((g) => (
          <div key={g.title} className="card p-5">
            <h3 className="text-sm font-medium text-muted mb-3">{g.title}</h3>
            <div className="space-y-2">
              {g.channels.map((ch) => (
                <ChRow
                  key={ch}
                  channelKey={ch}
                  label={CH_LABELS[ch] || ch}
                  sub={cfg[ch]?.userId ? "ID: " + cfg[ch]?.userId : ""}
                  connected={!!cfg[ch]?.connected}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
