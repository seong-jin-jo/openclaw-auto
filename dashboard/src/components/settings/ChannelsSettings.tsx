"use client";

import { useChannelConfig } from "@/hooks/useChannelConfig";
import { CH_LABELS, PUBLISH_CHANNEL_GROUPS } from "@/lib/constants";
import { getChannelIcon } from "@/lib/channel-icons";
import Link from "next/link";

// 발행 채널 그룹은 constants의 PUBLISH_CHANNEL_GROUPS 단일 소스를 사용(사이드바와 동일).
const GROUPS = PUBLISH_CHANNEL_GROUPS;

function ChRow({ channelKey, label, sub, connected }: {
  channelKey: string; label: string; sub: string; connected: boolean;
}) {
  return (
    <Link href={`/channels/${channelKey}`} className="flex items-center justify-between p-3 rounded-lg bg-surface/50 hover:bg-surface-2/50">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded bg-surface-2 flex items-center justify-center text-muted">{getChannelIcon(channelKey)}</span>
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="text-caption text-subtle">{sub}</p>
        </div>
      </div>
      <span className={`text-caption ${connected ? "text-green-500" : "text-accent"}`}>
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
      <p className="text-caption text-subtle mb-4">콘텐츠를 발행할 채널. 클릭하면 해당 채널 연결 화면으로 이동합니다.</p>
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
