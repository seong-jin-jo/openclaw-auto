import { db, withTenant } from "@/lib/db";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { reportFailure, normalizePlatform, classifyPublishFailure } from "@/lib/observability";
import { SCHEDULABLE_PLATFORMS } from "@/lib/constants";
import {
  getChannelCred,
  publishFacebook,
  publishInstagram,
  publishThreads,
  publishX,
  publishBluesky,
  publishTelegram,
  publishDiscord,
  publishSlack,
  type PublishResult,
} from "@/lib/publish";

// POST /api/schedule/publish-due — cron/gateway용 예약 실발행 루프.
// 두 가지 호출 방식:
//   ① 테넌트 스코프: 로그인 세션/테넌트 토큰/tenant_id로 한 테넌트의 due를 처리(고객/포크).
//   ② 운영자 전체 스윕: tenant_id 없이 운영자 토큰(DASHBOARD_AUTH_TOKEN)으로 호출하면
//      due schedule이 있는 모든 테넌트를 순회한다 — 단일 크론(curl)이 전 테넌트를 발행하는 진입점.
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

// 발행 가능한 플랫폼은 constants.ts SSOT(SchedulePanel UI와 단일 소스). 여기 없는 platform은
// "미지원"으로 떨궈 정직하게 실패 기록한다(UI에선 애초에 노출 안 됨).
const SUPPORTED_PLATFORMS = new Set<string>(SCHEDULABLE_PLATFORMS);
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PublishDueBody;
  const limit = clampLimit(body.limit);

  const tenantId = await effectiveTenantId(request, body.tenant_id);
  if (tenantId) {
    const schedules = await processTenant(tenantId, limit);
    return Response.json({ ok: true, processed: schedules.length, schedules });
  }

  // 테넌트 미해석 — 운영자 토큰이면 전체 테넌트 스윕(단일 크론 진입점), 아니면 400.
  const raw = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";
  if (operatorToken && raw === operatorToken) {
    const tenantIds = await dueTenantIds();
    const tenants = [];
    let processed = 0;
    for (const tid of tenantIds) {
      const schedules = await processTenant(tid, limit);
      processed += schedules.length;
      tenants.push({ tenantId: tid, processed: schedules.length, schedules });
    }
    return Response.json({ ok: true, mode: "all-tenants", tenantCount: tenants.length, processed, tenants });
  }

  return Response.json({ error: "tenant_id required" }, { status: 400 });
}

// 한 테넌트의 due schedule을 claim→발행→기록→마감. 반환: 처리한 스케줄 요약 목록.
async function processTenant(tenantId: string, limit: number) {
  const rows = await claimDueSchedules(tenantId, limit);
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
        // /api/publish/route.ts와 동일한 경계: "채널 미연결"(설정 문제)은 알림 대상이 아니고,
        // 그 외 !ok(플랫폼 API 실발행 실패·미지원 플랫폼)만 fire-and-forget으로 보고한다.
        // 응답/스케줄 상태는 이 보고와 무관 — reportFailure는 아래 로직에 어떤 영향도 주지 않는다.
        if (!result.ok && !isConnectionMissing(result.error)) {
          // platform(schedules.platforms 저장값)과 result.error(플랫폼 API 응답 본문 포함 가능한
          // 임의 외부 텍스트)를 절대 그대로 넘기지 않고 고정 코드로만 정규화한다(observability.ts).
          const { reason, httpStatus } = classifyPublishFailure(result.error);
          void reportFailure({
            event: "publish_failed",
            severity: "warning",
            context: { platform: normalizePlatform(platform), reason, httpStatus },
          });
        }
        await recordPublishedPost(tenantId, row, platform, result);
      }
    }

    const status = scheduleStatus(results);
    await finishSchedule(tenantId, row.id, status, results);
    schedules.push({ id: row.id, status, results });
  }
  return schedules;
}

// due schedule이 하나라도 있는 테넌트 id 목록. RLS 우회 service-role(db())로 전 테넌트 스캔 —
// 운영자 전체 스윕 전용(테넌트 스코프 쿼리가 아니므로 withTenant 미사용).
async function dueTenantIds(): Promise<string[]> {
  const sql = db();
  const rows = await sql<{ tenant_id: string }[]>`
    SELECT DISTINCT tenant_id FROM schedules
    WHERE status = 'scheduled' AND scheduled_at <= now()`;
  return rows.map((r) => r.tenant_id);
}

// "PLATFORM 채널 미연결 — Settings에서 토큰 등록 필요"(getChannelCred null) — 고객 설정 문제일 뿐
// 인프라 장애가 아니므로 publish_failed 알림 대상에서 제외한다(/api/publish/route.ts와 동일 규칙).
function isConnectionMissing(error?: string | null): boolean {
  return typeof error === "string" && error.includes("채널 미연결");
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
    if (platform === "bluesky") return await publishBluesky(cred, text, imageUrl);
    if (platform === "telegram") return await publishTelegram(cred, text, imageUrl);
    if (platform === "discord") return await publishDiscord(cred, text, imageUrl);
    if (platform === "slack") return await publishSlack(cred, text, imageUrl);
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
  // bluesky/telegram/discord/slack은 플랫폼 전용 본문 필드가 없다 — threads 본문(공용 소셜 텍스트)을 그대로 사용.
  if (platform === "threads" || platform === "facebook" || platform === "bluesky" || platform === "telegram" || platform === "discord" || platform === "slack") {
    return stringValue(text.threads);
  }
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
