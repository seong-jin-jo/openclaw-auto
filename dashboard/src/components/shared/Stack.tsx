"use client";

import type { HTMLAttributes } from "react";

export type StackGap = 4 | 8 | 12 | 16 | 24 | 32;

const GAP_CLASSES: Record<StackGap, string> = {
  4: "gap-micro",
  8: "gap-stack-tight",
  12: "gap-stack",
  16: "gap-pad-inset",
  24: "gap-stack-section",
  32: "gap-region",
};

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "vertical" | "horizontal";
  gap?: StackGap;
  wrap?: boolean;
  scroll?: boolean;
}

export function Stack({
  direction = "vertical",
  gap = 12,
  wrap = false,
  scroll = false,
  className = "",
  ...props
}: StackProps) {
  const directionClass = direction === "horizontal" ? "flex-row" : "flex-col";
  return (
    <div
      className={`flex ${directionClass} ${GAP_CLASSES[gap]} ${wrap ? "flex-wrap" : ""} ${scroll ? "overflow-x-auto" : ""} ${className}`}
      {...props}
    />
  );
}
