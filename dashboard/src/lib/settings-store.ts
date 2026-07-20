import { dataPath, readJson } from "@/lib/file-io";

export const DEFAULT_SETTINGS: Record<string, number> = {
  viralThreshold: 500,
  minLikes: 10,
  searchDays: 7,
  maxPopularPosts: 30,
  insightsIntervalHours: 24,
  insightsMaxCollections: 3,
  publishIntervalHours: 2,
  draftsPerBatch: 5,
  imagePerBatch: 1,
  casualPerBatch: 1,
  quotePerBatch: 0,
};

export function readSettings(): Record<string, number> {
  const saved = readJson<Record<string, number>>(dataPath("settings.json")) || {};
  return { ...DEFAULT_SETTINGS, ...saved };
}
