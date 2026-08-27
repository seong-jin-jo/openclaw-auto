"use client";

import { StateNotice } from "./StateNotice";

export function EmptyState({ message }: { message: string }) {
  return <StateNotice tone="empty" title={message} />;
}
