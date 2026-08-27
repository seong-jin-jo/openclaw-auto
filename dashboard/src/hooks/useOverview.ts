"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";

export function deferredOverviewKey(path: string, enabled: boolean): string | null {
  return enabled ? path : null;
}

export function useOverview() {
  return useSWR("/api/overview", fetcher);
}

export function useCronStatus(enabled = true) {
  return useSWR(enabled ? "/api/cron-status" : null, fetcher);
}

export function useActivity(enabled = true) {
  return useSWR(deferredOverviewKey("/api/activity", enabled), fetcher);
}

export function useAlerts(enabled = true) {
  return useSWR(deferredOverviewKey("/api/alerts", enabled), fetcher);
}

export function useWeeklySummary() {
  return useSWR("/api/weekly-summary", fetcher);
}

export function useTokenStatus() {
  return useSWR("/api/token-status", fetcher);
}

export function useAgentLogs(enabled = true) {
  return useSWR(deferredOverviewKey("/api/agent-logs", enabled), fetcher);
}

export function useUsage(tenantId?: string) {
  return useSWR(tenantId ? `/api/usage?tenant_id=${tenantId}` : "/api/usage", fetcher);
}

export function useErrors(enabled = true) {
  return useSWR(deferredOverviewKey("/api/errors", enabled), fetcher);
}
