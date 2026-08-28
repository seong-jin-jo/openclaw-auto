"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Stack } from "./Stack";

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  htmlFor?: string;
  help?: ReactNode;
  error?: ReactNode;
}

export function Field({
  label,
  htmlFor,
  help,
  error,
  children,
  className = "",
  ...props
}: FieldProps) {
  return (
    <div className={`ds-copy ${className}`} {...props}>
      <Stack gap={8}>
        <label htmlFor={htmlFor} className="ds-copy text-caption font-medium text-muted">
          {label}
        </label>
        <div className="ds-field-control ds-copy text-body text-text">{children}</div>
        {help ? <p className="ds-copy text-caption text-subtle">{help}</p> : null}
        {error ? <p className="ds-copy text-caption text-danger" role="alert">{error}</p> : null}
      </Stack>
    </div>
  );
}
