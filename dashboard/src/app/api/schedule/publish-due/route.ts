import { withTenant } from "@/lib/db";
import { effectiveTenantId } from "@/lib/tenant-auth";
import {
  getChannelCred,
  publishFacebook,
  publishInstagram,
  publishThreads,
  publishX,
  type PublishResult,
} from "@/lib/publish";

// POST /api/schedule/publish-due — cron/gateway용 예약 실발행 루프.
// 테넌트별 due schedules를 processing으로 claim해 중복 발행을 막고, 플랫폼별 결과를
// published_posts에 기록한 뒤 schedule 상태를 published/partial/failed로 닫는다.

interface PublishDueBody {
  tenant_id?: string;
  limit?: number;
}

interface DueScheduleRow {
  id: string;
  draft_id: string | null;
  platforms: string[] | null;
  payload: Record<string, unknown> | null;
  draft_payload: Record<string, unknown> | null;
}

interface PlatformPublishResult extends PublishResult {
  platform: string;
}

const SUPPORTED_PLATFORMS = new Set(["threads", "x", "instagram", "facebook"]);
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PublishDueBody;
  const tenantId = await effectiveTenantId(request, body.tenant_id);
  if (!tenantId) return Response.json({ error: "tenant_id required" }, { status: 400 });

  const limit = clampLimit(body.limit);
  const rows = await claimDueSchedules(tenantId, limit);
  if (rows.length === 0) {
    return Response.json({ ok: true, processed: 0, schedules: [] });
  }

  const schedules = [];
  for (const row of rows) {
    const platforms = Array.isArray(row.platforms) ? row.platforms : [];
    const results: PlatformPublishResult[] = [];

    if (platforms.length === 0) {
      results.push({ platform: "(none)", ok: false, error: "platforms 없음" });
    } else {
      for (const platform of platforms) {
        const result = await publishOne(tenantId, row, platform);
        results.push({ platform, ...result });
        await recordPublishedPost(tenantId, row, platform, result);
      }
    }

    const status = scheduleStatus(results);
    await finishSchedule(tenantId, row.id, status, results);
    schedules.push({ id: row.id, status, results });
  }

  return Response.json({ ok: true, processed: schedules.length, schedules });
}

function clampLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(value)));
}

async function claimDueSchedules(tenantId: string, limit: number): Promise<DueScheduleRow[]> {
  return withTenant(tenantId, (sql) => sql<DueScheduleRow[]>`
    WITH due AS (
      SELECT id
      FROM schedules
      WHERE tenant_id = ${tenantId}
        AND status = 'scheduled'
        AND scheduled_at <= now()
      ORDER BY scheduled_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    ),
    claimed AS (
      UPDATE schedules
      SET status = 'processing'
      WHERE id IN (SELECT id FROM due)
      RETURNING id, tenant_id, draft_id, platforms, payload
    )
    SELECT
      claimed.id,
      claimed.draft_id,
      claimed.platforms,
      claimed.payload,
      drafts.payload AS draft_payload
    FROM claimed
    LEFT JOIN drafts
      ON drafts.id = claimed.draft_id
     AND drafts.tenant_id = ${tenantId}
  `);
}

async function publishOne(tenantId: string, row: DueScheduleRow, platform: string): Promise<PublishResult> {
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    return { ok: false, error: `${platform} 미지원` };
  }

  const cred = await getChannelCred(tenantId, platform);
  if (!cred) {
    return { ok: false, error: `${platform} 채널 미연결 — Settings에서 토큰 등록 필요` };
  }

  const text = textForPlatform(platform, row.payload, row.draft_payload);
  const imageUrl = imageUrlFromPayload(row.payload, row.draft_payload);

  try {
    if (platform === "threads") return await publishThreads(cred, text, imageUrl);
    if (platform === "instagram") return await publishInstagram(cred, text, imageUrl);
    if (platform === "x") return await publishX(cred, text);
    if (platform === "facebook") return await publishFacebook(cred, text, imageUrl);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return { ok: false, error: `${platform} 미지원` };
}

function textForPlatform(
  platform: string,
  schedulePayload: Record<string, unknown> | null,
  draftPayload: Record<string, unknown> | null,
): string {
  const raw = schedulePayload?.text ?? draftPayload?.text ?? "";
  if (typeof raw === "string") return raw;
  if (!raw || typeof raw !== "object") return "";

  const text = raw as Record<string, unknown>;
  if (platform === "threads" || platform === "facebook") return stringValue(text.threads);
  if (platform === "x") return stringValue(text.x);
  if (platform === "instagram") {
    const ig = text.instagram;
    if (ig && typeof ig === "object") return stringValue((ig as Record<string, unknown>).caption);
    return stringValue(ig);
  }

  const shorts = text.shorts;
  if (shorts && typeof shorts === "object") {
    const parts = ["hook", "body", "cta"]
      .map((key) => stringValue((shorts as Record<string, unknown>)[key]))
      .filter(Boolean);
    if (parts.length > 0) return parts.join("\n");
  }
  return stringValue(text.threads);
}

function imageUrlFromPayload(
  schedulePayload: Record<string, unknown> | null,
  draftPayload: Record<string, unknown> | null,
): string | undefined {
  const direct =
    schedulePayload?.image_url ??
    schedulePayload?.imageUrl ??
    draftPayload?.image_url ??
    draftPayload?.imageUrl;
  const directValue = stringValue(direct);
  if (directValue) return directValue;

  const img = schedulePayload?.img ?? draftPayload?.img;
  if (typeof img === "string") return img;
  if (img && typeof img === "object") {
    const url = stringValue((img as Record<string, unknown>).url);
    if (url) return url;
  }
  return undefined;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function recordPublishedPost(
  tenantId: string,
  row: DueScheduleRow,
  platform: string,
  result: PublishResult,
) {
  const text = textForPlatform(platform, row.payload, row.draft_payload);
  await withTenant(tenantId, (sql) => sql`
    INSERT INTO published_posts (tenant_id, draft_id, platform, external_id, permalink, text, status, error)
    VALUES (${tenantId}, ${row.draft_id ?? null}, ${platform}, ${result.externalId ?? null},
            ${result.permalink ?? null}, ${text || null},
            ${result.ok ? "published" : "failed"}, ${result.error ?? null})
  `);
}

function scheduleStatus(results: PlatformPublishResult[]): "published" | "partial" | "failed" {
  const ok = results.filter((r) => r.ok).length;
  if (ok === results.length && results.length > 0) return "published";
  if (ok > 0) return "partial";
  return "failed";
}

async function finishSchedule(
  tenantId: string,
  scheduleId: string,
  status: "published" | "partial" | "failed",
  results: PlatformPublishResult[],
) {
  const publishResultPayload = {
    publishResults: results,
    processedAt: new Date().toISOString(),
  };
  await withTenant(tenantId, (sql) => sql`
    UPDATE schedules
    SET status = ${status},
        payload = COALESCE(payload, '{}'::jsonb) || ${sql.json(publishResultPayload as never)}::jsonb
    WHERE id = ${scheduleId}
      AND tenant_id = ${tenantId}
  `);
}
