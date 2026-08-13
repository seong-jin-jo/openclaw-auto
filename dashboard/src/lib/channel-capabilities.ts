export const BASE_CHANNEL_TABS = ["queue", "analytics", "growth", "popular", "settings"] as const;
export const SPECIAL_CHANNEL_TABS = ["editor"] as const;

export type BaseChannelTab = (typeof BASE_CHANNEL_TABS)[number];
export type SpecialChannelTab = (typeof SPECIAL_CHANNEL_TABS)[number];
export type ChannelTab = BaseChannelTab | SpecialChannelTab;

export interface ChannelCapability {
  tabs: readonly BaseChannelTab[];
  specialTabs: readonly SpecialChannelTab[];
  disabledTabs: readonly BaseChannelTab[];
  removedTabs: readonly BaseChannelTab[];
}

export interface ResolvedChannelTab {
  id: ChannelTab;
  label: string;
  disabled: boolean;
  special: boolean;
}

const STANDARD_TEXT_CAPABILITY: ChannelCapability = {
  tabs: BASE_CHANNEL_TABS,
  specialTabs: [],
  disabledTabs: ["growth", "popular"],
  removedTabs: [],
};

const THREADS_CAPABILITY: ChannelCapability = {
  tabs: BASE_CHANNEL_TABS,
  specialTabs: [],
  disabledTabs: [],
  removedTabs: [],
};

const INSTAGRAM_CAPABILITY: ChannelCapability = {
  tabs: BASE_CHANNEL_TABS,
  specialTabs: ["editor"],
  disabledTabs: ["growth", "popular"],
  removedTabs: [],
};

const VIDEO_CAPABILITY: ChannelCapability = {
  tabs: BASE_CHANNEL_TABS,
  specialTabs: [],
  disabledTabs: ["growth", "popular"],
  removedTabs: [],
};

const MESSAGING_CAPABILITY: ChannelCapability = {
  tabs: BASE_CHANNEL_TABS,
  specialTabs: [],
  disabledTabs: [],
  removedTabs: ["queue", "analytics", "growth", "popular"],
};

export const CHANNEL_CAPABILITIES: Record<string, ChannelCapability> = {
  threads: THREADS_CAPABILITY,
  x: STANDARD_TEXT_CAPABILITY,
  facebook: STANDARD_TEXT_CAPABILITY,
  bluesky: STANDARD_TEXT_CAPABILITY,
  linkedin: STANDARD_TEXT_CAPABILITY,
  pinterest: STANDARD_TEXT_CAPABILITY,
  tumblr: STANDARD_TEXT_CAPABILITY,
  naver_blog: STANDARD_TEXT_CAPABILITY,
  medium: STANDARD_TEXT_CAPABILITY,
  substack: STANDARD_TEXT_CAPABILITY,
  instagram: INSTAGRAM_CAPABILITY,
  youtube: VIDEO_CAPABILITY,
  tiktok: VIDEO_CAPABILITY,
  telegram: MESSAGING_CAPABILITY,
  discord: MESSAGING_CAPABILITY,
  slack: MESSAGING_CAPABILITY,
  line: MESSAGING_CAPABILITY,
  kakao: MESSAGING_CAPABILITY,
  whatsapp: MESSAGING_CAPABILITY,
};

export const CHANNEL_TAB_LABELS: Record<ChannelTab, string> = {
  queue: "Queue",
  analytics: "Analytics",
  growth: "Growth",
  popular: "Popular",
  settings: "Settings",
  editor: "Editor",
};

const CHANNEL_GROUP_DEFINITIONS = [
  {
    key: "social",
    title: "Social",
    channels: ["threads", "x", "instagram", "facebook", "bluesky"],
    studioPublish: true,
  },
  {
    key: "messaging",
    title: "Messaging",
    channels: ["telegram", "discord", "slack"],
    studioPublish: true,
  },
  {
    key: "video",
    title: "Video",
    channels: ["youtube", "tiktok"],
    studioPublish: false,
  },
] as const;

export const CHANNEL_GROUPS = CHANNEL_GROUP_DEFINITIONS.map(({ key, title, channels }) => ({
  key,
  title,
  channels,
}));

// Studio의 텍스트 예약/즉시 발행은 기존 8채널만 유지한다. 영상은 /videos가 owner다.
export const PUBLISH_CHANNEL_GROUPS = CHANNEL_GROUP_DEFINITIONS
  .filter((group) => group.studioPublish)
  .map(({ key, title, channels }) => ({ key, title, channels }));

export const VIDEO_PUBLISH_PLATFORMS = ["youtube", "tiktok"] as const;

export function getChannelCapability(channel: string): ChannelCapability {
  return CHANNEL_CAPABILITIES[channel] || STANDARD_TEXT_CAPABILITY;
}

export function getChannelTabs(channel: string): ResolvedChannelTab[] {
  const capability = getChannelCapability(channel);
  const removed = new Set<ChannelTab>(capability.removedTabs);
  const disabled = new Set<ChannelTab>(capability.disabledTabs);
  const special = new Set<ChannelTab>(capability.specialTabs);
  const resolved: ResolvedChannelTab[] = [];

  for (const tab of capability.tabs) {
    if (removed.has(tab)) continue;
    resolved.push({ id: tab, label: CHANNEL_TAB_LABELS[tab], disabled: disabled.has(tab), special: false });
    if (tab === "queue") {
      for (const specialTab of capability.specialTabs) {
        resolved.push({
          id: specialTab,
          label: CHANNEL_TAB_LABELS[specialTab],
          disabled: false,
          special: special.has(specialTab),
        });
      }
    }
  }

  return resolved;
}

export function isChannelTabEnabled(channel: string, tab: string): tab is ChannelTab {
  return getChannelTabs(channel).some((candidate) => candidate.id === tab && !candidate.disabled);
}
