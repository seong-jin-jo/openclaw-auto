"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";

export function useOverview() {
  return useSWR("/api/overview", fetcher);
}

export function useCronStatus() {
  return useSWR("/api/cron-status", fetcher);
}

export function useActivity() {
  return useSWR("/api/activity", fetcher);
}

export function useAlerts() {
  return useSWR("/api/alerts", fetcher);
}

export function useWeeklySummary() {
  return useSWR("/api/weekly-summary", fetcher);
}

export function useTokenStatus() {
  return useSWR("/api/token-status", fetcher);
}

export function useAgentLogs() {
  return useSWR("/api/agent-logs", fetcher);
}

export function useUsage() {
  return useSWR("/api/usage", fetcher);
}

export function useErrors() {
  return useSWR("/api/errors", fetcher);
}
