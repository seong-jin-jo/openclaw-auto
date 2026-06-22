// LLM이 돌려준 텍스트에서 초안 배열만 안전 추출. 코드펜스/설명문/잡텍스트 섞여도 견고하게.
export interface SeedDraft {
  text: string;
  hashtags: string[];
  topic: string;
}

export function parseDrafts(raw: string): SeedDraft[] {
  if (typeof raw !== "string") return [];
  const s = raw.indexOf("[");
  const e = raw.lastIndexOf("]");
  if (s === -1 || e === -1 || e <= s) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw.slice(s, e + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((d): SeedDraft => {
      const o = (d ?? {}) as Record<string, unknown>;
      return {
        text: typeof o.text === "string" ? o.text.trim() : "",
        hashtags: Array.isArray(o.hashtags) ? o.hashtags.filter((h): h is string => typeof h === "string") : [],
        topic: typeof o.topic === "string" && o.topic ? o.topic : "ai-seed",
      };
    })
    .filter((d) => d.text.length > 0);
}
