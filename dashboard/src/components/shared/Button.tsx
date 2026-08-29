"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "border border-border bg-surface-2 text-text hover:border-subtle hover:bg-surface",
  danger: "bg-danger text-status-fg hover:opacity-90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-stack-tight text-caption",
  md: "px-stack text-body-sm",
  lg: "px-pad-inset text-body",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  // 기본값은 라벨이 줄바꿈되지 않도록 min-w-max다. 다만 좁은 칸(목차, 카드) 안에서는 이 값이
  // 칸을 밀어내 글자를 가린다. 호출부가 min-w-를 직접 주면 그 값을 존중한다.
  const minWidthClass = /(^|\s)min-w-/.test(className) ? "" : "min-w-max";

  return (
    <button
      type={type}
      className={`ds-label inline-flex min-h-control-touch ${minWidthClass} items-center justify-center gap-micro rounded-control font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}
