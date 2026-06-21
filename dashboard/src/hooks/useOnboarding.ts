"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";

export function useOnboardingStatus() {
  // GET이 DB count 2회를 도므로 포커스마다 재검증 금지 + 60s dedupe(체크리스트는 실시간일 필요 없음).
  return useSWR("/api/onboarding", fetcher, { dedupingInterval: 60000, revalidateOnFocus: false });
}
