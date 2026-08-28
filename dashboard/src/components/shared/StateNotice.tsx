"use client";

import { Button } from "./Button";

type StateNoticeTone = "empty" | "error";

const TONE_CLASSES: Record<StateNoticeTone, string> = {
  empty: "border-border bg-surface text-subtle",
  error: "border-danger bg-danger-soft text-danger",
};

export interface StateNoticeProps {
  tone: StateNoticeTone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function StateNotice({
  tone,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: StateNoticeProps) {
  return (
    <div
      className={`card flex flex-col items-center gap-stack border px-pad-inset py-region text-center ${TONE_CLASSES[tone]} ${className}`}
      data-state={tone}
      role={tone === "error" ? "alert" : "status"}
    >
      <strong className="ds-copy text-body font-semibold text-text">{title}</strong>
      {description ? <p className="ds-copy text-body-sm text-subtle">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button variant={tone === "error" ? "danger" : "secondary"} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
