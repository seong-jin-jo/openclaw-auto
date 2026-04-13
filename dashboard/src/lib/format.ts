/** HTML escape for XSS prevention */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Format timestamp (ms or ISO string) to localized date — matches Flask's fmtTime(ms) */
export function fmtTime(ms: unknown): string {
  if (!ms) return "-";
  const d = new Date(typeof ms === "number" ? ms : String(ms));
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Relative time — matches Flask's fmtAgo(iso) */
export function fmtAgo(iso: unknown): string {
  if (!iso) return "";
  const d = new Date(typeof iso === "number" ? iso : String(iso));
  if (isNaN(d.getTime())) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Format bytes to human-readable */
export function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
