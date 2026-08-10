"use client";

import { CH_STATUS_BADGE, CH_STATUS_LABEL } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const cls = CH_STATUS_BADGE[status] || "";
  const label = CH_STATUS_LABEL[status] || status;
  if (!label) return null;
  return <span className={`ds-label inline-flex items-center rounded-full px-stack-tight py-[2px] text-caption ${cls}`}>{label}</span>;
}
