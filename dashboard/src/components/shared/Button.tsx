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
  return (
    <button
      type={type}
      className={`ds-label inline-flex min-h-control-touch min-w-max items-center justify-center gap-micro rounded-control font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}
