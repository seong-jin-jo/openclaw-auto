"use client";

import { useToast } from "@/components/layout/Toast";
import { Button } from "@/components/shared/Button";
import { Stack } from "@/components/shared/Stack";
import { getChannelTabs, type ChannelTab } from "@/lib/channel-capabilities";

interface ChannelTabsProps {
  channel: string;
  activeTab: string;
  onTabChange: (tab: ChannelTab) => void;
}

export function ChannelTabs({ channel, activeTab, onTabChange }: ChannelTabsProps) {
  const { showToast } = useToast();

  return (
    <Stack
      direction="horizontal"
      gap={4}
      scroll
      role="tablist"
      aria-label={`${channel} 채널 메뉴`}
      className="mb-stack-section border-b border-border/50 pb-stack"
    >
      {getChannelTabs(channel).map((tab) => (
        <Button
          key={tab.id}
          role="tab"
          size="sm"
          variant={activeTab === tab.id ? "primary" : "secondary"}
          aria-selected={activeTab === tab.id}
          aria-disabled={tab.disabled}
          data-testid={`channel-tab-${channel}-${tab.id}`}
          className={tab.disabled ? "opacity-60" : ""}
          onClick={() => {
            if (tab.disabled) {
              showToast("연동 예정입니다", "warning");
              return;
            }
            onTabChange(tab.id);
          }}
        >
          <span>{tab.label}</span>
          {tab.disabled && <span className="text-caption text-subtle">연동 예정</span>}
        </Button>
      ))}
    </Stack>
  );
}
