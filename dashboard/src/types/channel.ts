export interface ChannelKeys {
  [key: string]: string;
}

export interface ChannelConfigEntry {
  status: "live" | "connected" | "available" | "soon";
  keys: ChannelKeys;
  enabled?: boolean;
  connected?: boolean;
  username?: string;
  userId?: string;
  [key: string]: unknown;
}

export type ChannelConfigMap = Record<string, ChannelConfigEntry>;

export interface SetupGuide {
  fields: string[];
  labels: string[];
  quick: string[];
  detail: string;
}

export interface ChannelGuideData {
  guide: string;
  common: string;
  channelGuide: boolean;
}

export interface ChannelKeywordsData {
  keywords: string[];
  common: string[];
  channelKeywords: boolean;
}
