"use client";

import { CH_STATUS_BADGE, CH_STATUS_LABEL } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const cls = CH_STATUS_BADGE[status] || "";
  const label = CH_STATUS_LABEL[status] || status;
  if (!label) return null;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] ${cls}`}>{label}</span>;
}
