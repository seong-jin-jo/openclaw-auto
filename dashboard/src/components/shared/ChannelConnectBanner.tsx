"use client";

import Link from "next/link";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { IMPLEMENTED_PLUGINS, CH_LABELS } from "@/lib/constants";

// 미연결 채널을 직관적으로 알리고 연결 화면으로 유도. 구현된 채널 중 status가 live/connected가
// 아닌 것 = 연결 필요. 0개면 안 보임. 클릭 → Settings 채널 탭.
export function ChannelConnectBanner() {
  const { data } = useChannelConfig();
  if (!data) return null;

  const unconnected = IMPLEMENTED_PLUGINS.filter((k) => k !== "midjourney").filter((k) => {
    const s = (data[k]?.status as string) || "";
    return s !== "live" && s !== "connected";
  });
  if (unconnected.length === 0) return null;

  const names = unconnected.slice(0, 3).map((k) => CH_LABELS[k] || k).join(", ");
  return (
    <Link
      href="/settings?tab=channels"
      className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl border border-warning/40 bg-warning/10 hover:bg-warning/15 transition"
    >
      <div className="text-sm text-text">
        🔌 발행하려면 채널 연결이 필요해요. <b>{unconnected.length}개 미연결</b>
        <span className="text-muted text-xs ml-1">
          ({names}{unconnected.length > 3 ? " 외" : ""})
        </span>
      </div>
      <span className="text-xs px-3 py-1.5 rounded-lg bg-accent text-accent-fg whitespace-nowrap">연결하기 →</span>
    </Link>
  );
}
