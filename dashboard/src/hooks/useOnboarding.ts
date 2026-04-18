"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";

export function useOnboardingStatus() {
  return useSWR("/api/onboarding", fetcher);
}
