"use client";

import { use } from "react";
import { MESSAGING_CHANNELS, DATA_CHANNELS, CH_LABELS } from "@/lib/constants";
import { ChannelPage } from "@/components/channel/ChannelPage";
import { MessagingPage } from "@/components/channel/MessagingPage";
import { DataChannelPage } from "@/components/channel/DataChannelPage";

export default function ChannelRoute({ params }: { params: Promise<{ channel: string }> }) {
  const { channel } = use(params);

  // Validate channel exists
  if (!CH_LABELS[channel]) {
    return (
      <div className="px-8 py-6">
        <p className="text-[var(--text-muted)]">Unknown channel: {channel}</p>
      </div>
    );
  }

  if (DATA_CHANNELS.includes(channel)) {
    return <DataChannelPage channel={channel} />;
  }

  if (MESSAGING_CHANNELS.includes(channel)) {
    return <MessagingPage channel={channel} />;
  }

  return <ChannelPage channel={channel} />;
}
