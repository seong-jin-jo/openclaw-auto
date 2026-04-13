"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { ChannelConfigMap, ChannelGuideData, ChannelKeywordsData } from "@/types/channel";
import type { NotificationSettings, ChatChannelsMap, TenantInfo } from "@/types/notification";

export function useChannelConfig() {
  return useSWR<ChannelConfigMap>("/api/channel-config", fetcher);
}

export function useChannelGuide(channel: string) {
  return useSWR<ChannelGuideData>(channel ? `/api/guide/${channel}` : null, fetcher);
}

export function useChannelKeywords(channel: string) {
  return useSWR<ChannelKeywordsData>(channel ? `/api/keywords/${channel}` : null, fetcher);
}

export function useNotifSettings() {
  return useSWR<NotificationSettings>("/api/notification-settings", fetcher);
}

export function useLlmConfig() {
  return useSWR("/api/llm-config", fetcher);
}

export function useChatChannels() {
  return useSWR<ChatChannelsMap>("/api/chat-channels", fetcher);
}

export function useTenantInfo() {
  return useSWR<TenantInfo>("/api/tenant-info", fetcher);
}
