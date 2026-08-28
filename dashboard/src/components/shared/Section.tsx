"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Stack } from "./Stack";

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  supplement?: ReactNode;
  headingLevel?: 2 | 3;
}

export function Section({
  title,
  supplement,
  headingLevel = 2,
  children,
  className = "",
  ...props
}: SectionProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section className={`ds-copy ${className}`} {...props}>
      <Stack gap={12}>
        <Stack gap={8}>
          <Heading className={headingLevel === 2 ? "text-heading font-semibold text-text" : "text-subheading font-semibold text-text"}>
            {title}
          </Heading>
          {supplement ? <div className="ds-copy text-caption text-subtle">{supplement}</div> : null}
        </Stack>
        <div className="ds-copy text-body text-muted">{children}</div>
      </Stack>
    </section>
  );
}
