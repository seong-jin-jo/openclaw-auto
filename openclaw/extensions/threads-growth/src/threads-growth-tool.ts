import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

type GrowthConfig = {
  accessToken?: string;
  userId?: string;
  growthPath?: string;
};

type GrowthRecord = {
  date: string;
  followers: number;
  delta: number;
  profileViews: number;
  collectedAt: string;
};

type GrowthData = {
  records: GrowthRecord[];
};

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), "data");

function resolveConfig(api: OpenClawPluginApi) {
  const cfg = (api.pluginConfig ?? {}) as GrowthConfig;
  const accessToken =
    (typeof cfg.accessToken === "string" && cfg.accessToken.trim()) ||
    process.env.THREADS_ACCESS_TOKEN ||
    "";
  const userId =
    (typeof cfg.userId === "string" && cfg.userId.trim()) ||
    process.env.THREADS_USER_ID ||
    "";
  if (!accessToken) {
    throw new Error("Threads access token not configured. Set THREADS_ACCESS_TOKEN env var or configure in plugin settings.");
  }
  if (!userId) {
    throw new Error("Threads user ID not configured. Set THREADS_USER_ID env var or configure in plugin settings.");
  }
  const growthPath =
    (typeof cfg.growthPath === "string" && cfg.growthPath.trim()) ||
    path.join(DEFAULT_DATA_DIR, "growth.json");
  return { accessToken, userId, growthPath };
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function extractMetricValue(data: { data?: Array<{ name: string; values?: Array<{ value: number }>; total_value?: { value: number } }> }, metric: string): number {
  const entry = data.data?.find((d) => d.name === metric);
  if (!entry) return 0;
  if (entry.total_value?.value !== undefined) return entry.total_value.value;
  if (entry.values && entry.values.length > 0) return entry.values[entry.values.length - 1].value;
  return 0;
}

const ThreadsGrowthToolSchema = Type.Object(
  {
    action: optionalStringEnum(["track"] as const, {
      description: 'Action: "track" — fetch follower count and profile views, update growth.json.',
    }),
  },
  { additionalProperties: false },
);

export function createThreadsGrowthTool(api: OpenClawPluginApi) {
  return {
    name: "threads_growth",
    label: "Threads Growth",
    description:
      "Track Threads follower count and profile views. Fetches from Threads Account Insights API and updates growth.json with daily records.",
    parameters: ThreadsGrowthToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action") ?? "track";
      if (action !== "track") {
        throw new Error(`Unknown action: ${action}. Use "track".`);
      }

      const config = resolveConfig(api);
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const sinceTs = Math.floor(now.getTime() / 1000) - 86400;
      const untilTs = Math.floor(now.getTime() / 1000);

      // Fetch followers_count
      const followersUrl = `${THREADS_API_BASE}/${config.userId}/threads_insights?metric=followers_count&since=${sinceTs}&until=${untilTs}&access_token=${config.accessToken}`;
      const followersResp = await fetch(followersUrl);
      if (!followersResp.ok) {
        const err = await followersResp.text();
        throw new Error(`Threads followers API failed (${followersResp.status}): ${err}`);
      }
      const followersData = await followersResp.json();
      const followers = extractMetricValue(followersData, "followers_count");

      // Fetch views (profile views)
      const viewsUrl = `${THREADS_API_BASE}/${config.userId}/threads_insights?metric=views&since=${sinceTs}&until=${untilTs}&access_token=${config.accessToken}`;
      const viewsResp = await fetch(viewsUrl);
      let profileViews = 0;
      if (viewsResp.ok) {
        const viewsData = await viewsResp.json();
        profileViews = extractMetricValue(viewsData, "views");
      }

      // Read and update growth.json
      const growthData = await readJson<GrowthData>(config.growthPath, { records: [] });

      // Find previous record for delta calculation
      const sortedRecords = [...growthData.records].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      const prevRecord = sortedRecords.find((r) => r.date !== todayStr);
      const delta = prevRecord ? followers - prevRecord.followers : 0;

      const newRecord: GrowthRecord = {
        date: todayStr,
        followers,
        delta,
        profileViews,
        collectedAt: now.toISOString(),
      };

      // Replace existing today's record or add new
      const existingIdx = growthData.records.findIndex((r) => r.date === todayStr);
      if (existingIdx >= 0) {
        growthData.records[existingIdx] = newRecord;
      } else {
        growthData.records.push(newRecord);
      }

      // Remove records older than 90 days
      const maxAgeMs = 90 * 24 * 60 * 60 * 1000;
      growthData.records = growthData.records.filter(
        (r) => now.getTime() - new Date(r.date).getTime() <= maxAgeMs,
      );

      await writeJson(config.growthPath, growthData);

      const sign = delta >= 0 ? "+" : "";
      return jsonResult({
        message: `Growth tracking complete: followers=${followers}, delta=${sign}${delta}`,
        date: todayStr,
        followers,
        delta,
        profileViews,
      });
    },
  };
}
