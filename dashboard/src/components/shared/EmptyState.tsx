"use client";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-pad-inset py-region text-center text-subtle">
      <p className="ds-copy text-body">{message}</p>
    </div>
  );
}
