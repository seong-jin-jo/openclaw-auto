export interface NotificationEventConfig {
  enabled: boolean;
  channels: string[];
}

export interface NotificationSettings {
  onPublish: NotificationEventConfig;
  onViral: NotificationEventConfig;
  onError: NotificationEventConfig;
  weeklyReport: NotificationEventConfig;
}

export interface NotificationLogEntry {
  channel: string;
  message: string;
  success: boolean;
  error: string | null;
  timestamp: string;
}

export interface ChatChannelStatus {
  configured: boolean;
  botUsername?: string;
}

export type ChatChannelsMap = Record<string, ChatChannelStatus>;

export interface TenantInfo {
  id: string;
  name: string;
  plan: string;
  createdAt: string | null;
}
