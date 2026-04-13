"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { Post } from "@/types/queue";

export function useQueue(filter: string = "all") {
  const url = filter && filter !== "all" ? `/api/queue?status=${filter}` : "/api/queue";
  return useSWR<{ posts: Post[]; total: number }>(url, fetcher);
}

export function useBlogQueue() {
  return useSWR("/api/blog-queue", fetcher);
}
