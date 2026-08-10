"use client";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ds-copy ${className}`}>{children}</div>;
}
