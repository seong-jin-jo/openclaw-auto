import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

// ── 설정 ──
type SyncConfig = {
  databaseUrl?: string;
  tenantId?: string;
  queuePath?: string;
  historyPath?: string;
  growthPath?: string;
};

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), "data");

function resolveConfig(api: OpenClawPluginApi) {
  const cfg = (api.pluginConfig ?? {}) as SyncConfig;
  const databaseUrl =
    (typeof cfg.databaseUrl === "string" && cfg.databaseUrl.trim()) ||
    process.env.DATABASE_URL ||
    "";
  const tenantId =
    (typeof cfg.tenantId === "string" && cfg.tenantId.trim()) ||
    process.env.OSMU_TENANT_ID ||
    "";
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 미설정 — Supabase 연결 불가. env DATABASE_URL 또는 플러그인 databaseUrl 설정.");
  }
  if (!tenantId) {
    throw new Error("tenant_id 미설정 — env OSMU_TENANT_ID 또는 플러그인 tenantId 설정.");
  }
  const queuePath =
    (typeof cfg.queuePath === "string" && cfg.queuePath.trim()) ||
    process.env.THREADS_QUEUE_PATH ||
    path.join(DEFAULT_DATA_DIR, "queue.json");
  const historyPath =
    (typeof cfg.historyPath === "string" && cfg.historyPath.trim()) ||
    path.join(DEFAULT_DATA_DIR, "analytics-history.json");
  const growthPath =
    (typeof cfg.growthPath === "string" && cfg.growthPath.trim()) ||
    path.join(DEFAULT_DATA_DIR, "growth.json");
  return { databaseUrl, tenantId, queuePath, historyPath, growthPath };
}

// ── 로컬 게이트웨이 데이터 형태 (threads-queue / threads-growth와 동일 스키마) ──
type Engagement = {
  views?: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  quotes?: number;
};

type ChannelStatus = {
  status: "pending" | "published" | "failed" | "skipped";
  mediaId?: string | null;
  tweetId?: string | null;
  publishedAt?: string | null;
  error?: string | null;
};

type Channels = Record<string, ChannelStatus>;

type Post = {
  id: string;
  text?: string;
  status?: string;
  publishedAt?: string | null;
  threadsMediaId?: string | null;
  permalink?: string | null;
  engagement?: Engagement | null;
  channels?: Channels;
};

type QueueData = { version?: number; posts?: Post[] };
type HistoryData = { posts?: Post[] };

type GrowthRecord = {
  date?: string;
  followers?: number;
  following?: number;
  collectedAt?: string;
};
type GrowthData = { channel?: string; records?: GrowthRecord[] };

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ── 발행 채널 추출: v2 channels 객체 우선, 없으면 레거시 단일 threads ──
type ResolvedChannel = {
  channel: string; // platform
  externalId: string;
  publishedAt: string | null;
};

function extractChannels(post: Post): ResolvedChannel[] {
  const out: ResolvedChannel[] = [];
  if (post.channels && typeof post.channels === "object") {
    for (const [channel, cs] of Object.entries(post.channels)) {
      if (!cs || cs.status !== "published") continue;
      const externalId = (cs.mediaId || cs.tweetId || "").trim();
      if (!externalId) continue;
      out.push({ channel, externalId, publishedAt: cs.publishedAt ?? post.publishedAt ?? null });
    }
    return out;
  }
  // 레거시: threadsMediaId만 있는 단일 채널
  if (post.status === "published" && post.threadsMediaId) {
    out.push({ channel: "threads", externalId: post.threadsMediaId, publishedAt: post.publishedAt ?? null });
  }
  return out;
}

// ── RLS-safe 트랜잭션 (대시보드 withTenant와 동일 규약) ──
// set_config('app.tenant_id') + SET LOCAL ROLE osmu_service → RLS 정책이 해당 테넌트 행만 허용.
async function withTenantTx<T>(
  sql: ReturnType<typeof postgres>,
  tenantId: string,
  fn: (tx: ReturnType<typeof postgres>) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SET LOCAL ROLE osmu_service`;
    return fn(tx as unknown as ReturnType<typeof postgres>);
  }) as Promise<T>;
}

// published_posts 멱등 upsert — 키(tenant_id, platform, external_id) 존재 시 UPDATE, 없으면 INSERT.
// (schema에 해당 유니크 제약이 없어 ON CONFLICT 대신 수동 upsert. P4 소유 schema 변경 회피.)
async function upsertPublished(
  tx: ReturnType<typeof postgres>,
  tenantId: string,
  row: {
    platform: string;
    externalId: string;
    text: string | null;
    permalink: string | null;
    publishedAt: string | null;
    views: number;
    likes: number;
    replies: number;
    reposts: number;
  },
): Promise<"inserted" | "updated"> {
  const existing = await tx<{ id: string }[]>`
    SELECT id FROM published_posts
    WHERE tenant_id = ${tenantId} AND platform = ${row.platform} AND external_id = ${row.externalId}
    LIMIT 1`;
  if (existing.length > 0) {
    await tx`
      UPDATE published_posts
      SET views = ${row.views}, likes = ${row.likes}, replies = ${row.replies},
          reposts = ${row.reposts}, metrics_at = now(),
          permalink = COALESCE(${row.permalink}, permalink),
          text = COALESCE(${row.text}, text)
      WHERE id = ${existing[0].id}`;
    return "updated";
  }
  await tx`
    INSERT INTO published_posts
      (tenant_id, platform, external_id, permalink, text, status, published_at,
       views, likes, replies, reposts, metrics_at)
    VALUES
      (${tenantId}, ${row.platform}, ${row.externalId}, ${row.permalink}, ${row.text}, 'published',
       ${row.publishedAt ?? null}, ${row.views}, ${row.likes}, ${row.replies}, ${row.reposts}, now())`;
  return "inserted";
}

// growth_metrics 멱등 insert — 동일 (channel, recorded_at) 스냅샷 중복 방지.
async function insertGrowth(
  tx: ReturnType<typeof postgres>,
  tenantId: string,
  channel: string,
  followers: number,
  following: number,
  recordedAt: string,
): Promise<"inserted" | "skipped"> {
  const dup = await tx<{ id: string }[]>`
    SELECT id FROM growth_metrics
    WHERE tenant_id = ${tenantId} AND channel = ${channel} AND recorded_at = ${recordedAt}
    LIMIT 1`;
  if (dup.length > 0) return "skipped";
  await tx`
    INSERT INTO growth_metrics (tenant_id, channel, followers, following, recorded_at)
    VALUES (${tenantId}, ${channel}, ${followers}, ${following}, ${recordedAt})`;
  return "inserted";
}

const SyncInsightsToolSchema = Type.Object(
  {
    action: optionalStringEnum(["sync_up"] as const, {
      description: 'Action: "sync_up" — 로컬 insights(queue/history engagement + growth)를 Supabase로 단방향 멱등 upsert.',
    }),
  },
  { additionalProperties: false },
);

export function createSyncInsightsTool(api: OpenClawPluginApi) {
  return {
    name: "sync_insights",
    label: "Sync Insights",
    description:
      "로컬 게이트웨이 insights를 Supabase published_posts/growth_metrics로 단방향 멱등 upsert. 키=tenant_id+channel+external_post_id. Action: sync_up.",
    parameters: SyncInsightsToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action") ?? "sync_up";
      if (action !== "sync_up") {
        throw new Error(`Unknown action: ${action}. Use "sync_up".`);
      }

      const config = resolveConfig(api);
      const sql = postgres(config.databaseUrl, { max: 3, idle_timeout: 20 });

      let posts = 0;
      let inserted = 0;
      let updated = 0;
      let growthInserted = 0;
      let skipped = 0;
      const errors: string[] = [];

      try {
        // 발행물 소스: queue.json(현재) + analytics-history.json(아카이브) 병합
        const queue = await readJson<QueueData>(config.queuePath, { posts: [] });
        const history = await readJson<HistoryData>(config.historyPath, { posts: [] });
        const allPosts: Post[] = [...(queue.posts ?? []), ...(history.posts ?? [])];

        await withTenantTx(sql, config.tenantId, async (tx) => {
          for (const post of allPosts) {
            const channels = extractChannels(post);
            if (channels.length === 0) continue;
            const eng = post.engagement ?? {};
            for (const ch of channels) {
              try {
                const res = await upsertPublished(tx, config.tenantId, {
                  platform: ch.channel,
                  externalId: ch.externalId,
                  text: post.text ?? null,
                  permalink: post.permalink ?? null,
                  publishedAt: ch.publishedAt,
                  views: Number(eng.views ?? 0),
                  likes: Number(eng.likes ?? 0),
                  replies: Number(eng.replies ?? 0),
                  reposts: Number(eng.reposts ?? 0),
                });
                posts++;
                if (res === "inserted") inserted++;
                else updated++;
              } catch (err) {
                errors.push(`post ${post.id}/${ch.channel}: ${String(err)}`);
              }
            }
          }

          // 팔로워 성장: growth.json 최근 스냅샷 → growth_metrics
          const growth = await readJson<GrowthData>(config.growthPath, { records: [] });
          const channel = (growth.channel || "threads").trim();
          for (const rec of growth.records ?? []) {
            const recordedAt = rec.collectedAt || rec.date;
            if (!recordedAt || typeof rec.followers !== "number") continue;
            try {
              const res = await insertGrowth(
                tx,
                config.tenantId,
                channel,
                Number(rec.followers ?? 0),
                Number(rec.following ?? 0),
                recordedAt,
              );
              if (res === "inserted") growthInserted++;
              else skipped++;
            } catch (err) {
              errors.push(`growth ${recordedAt}: ${String(err)}`);
            }
          }
        });
      } finally {
        await sql.end({ timeout: 5 });
      }

      return jsonResult({
        message: `sync_up 완료: posts=${posts} (inserted=${inserted}, updated=${updated}), growth=${growthInserted} (skipped=${skipped}), errors=${errors.length}`,
        posts,
        inserted,
        updated,
        growthInserted,
        growthSkipped: skipped,
        errors,
      });
    },
  };
}
