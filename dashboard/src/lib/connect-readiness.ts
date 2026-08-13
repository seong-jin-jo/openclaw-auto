import type { ChannelConnectionState } from "@/lib/channel-connection";

export type ConnectReadinessStatus =
  | "connected"
  | "not_connected"
  | "opening_soon"
  | "publish_pending"
  | "error";

export interface ConnectReadinessEntry {
  status: ConnectReadinessStatus;
  available: boolean;
  reason?: string;
}

interface ResolveConnectReadinessInput {
  credentialsComplete: boolean;
  credentialStoreError?: boolean;
  connectionState: ChannelConnectionState;
  connectionLookupError?: boolean;
  externalReviewPending?: boolean;
  reason?: string;
}

export const CONNECT_READINESS_LABELS: Record<ConnectReadinessStatus, string> = {
  connected: "연결됨",
  not_connected: "미연결",
  opening_soon: "오픈 준비중",
  publish_pending: "발행 준비중",
  error: "확인 필요",
};

export function resolveConnectReadiness({
  credentialsComplete,
  credentialStoreError = false,
  connectionState,
  connectionLookupError = false,
  externalReviewPending = false,
  reason,
}: ResolveConnectReadinessInput): ConnectReadinessEntry {
  if (credentialStoreError || connectionLookupError) {
    return { status: "error", available: false, reason };
  }

  if (connectionState === "connected" && externalReviewPending) {
    return { status: "publish_pending", available: false, reason };
  }

  if (!credentialsComplete || externalReviewPending) {
    return { status: "opening_soon", available: false, reason };
  }

  if (connectionState === "connected") {
    return { status: "connected", available: true, reason };
  }

  return { status: "not_connected", available: true, reason };
}
