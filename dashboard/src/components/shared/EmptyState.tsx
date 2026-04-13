"use client";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-600">
      <p className="text-sm">{message}</p>
    </div>
  );
}
