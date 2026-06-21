import crypto from "crypto";
import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { withTenant } from "@/lib/db";
import { runWithTenant } from "@/lib/tenant-context";

// 소싱 DB-drafts → 파일 queue.json 단방향 브리지.
// 근거: approve→publish→metrics 파이프라인이 queue.json 기반(운영 저장소). drafts는 durable 분석 기록.
// 멱등성: 가져온 draft는 payload.imported_at 스탬프 → 재호출해도 중복 발행 안 됨.
// 테넌트 정확성: DB(withTenant)·파일(runWithTenant) 양쪽에 같은 tenantId를 적용(호출부에서 effectiveTenantId로 도출).

interface ShortDraftRow {
  id: string;
  idea: string | null;
  payload: {
    kind?: string;
    hook?: string;
    body?: string;
    caption?: string | null;
    hashtags?: string[];
  } | null;
}

export async function importShortDraftsToQueue(tenantId: string): Promise<{ imported: number }> {
  // 미import short draft 조회(payload.kind='short' AND imported_at 없음).
  const drafts = await withTenant(tenantId, (sql) => sql<ShortDraftRow[]>`
    SELECT id, idea, payload FROM drafts
    WHERE payload->>'kind' = 'short' AND NOT (payload ? 'imported_at')
    ORDER BY created_at ASC`);
  if (drafts.length === 0) return { imported: 0 };

  const now = new Date().toISOString().replace(/\.\d+Z$/, "");

  // 파일 쓰기는 runWithTenant로 감싸 테넌트 디렉터리에 격리.
  const importedIds = runWithTenant(tenantId, () => {
    const queue = readJson<{ version: number; posts: Record<string, unknown>[] }>(dataPath("queue.json"))
      || { version: 2, posts: [] };
    const ids: string[] = [];
    for (const d of drafts) {
      const p = d.payload || {};
      const text = (p.body || p.caption || p.hook || d.idea || "").toString().trim();
      if (!text) continue;
      queue.posts.push({
        id: crypto.randomUUID(),
        text,
        originalText: null,
        topic: "sourcing",
        hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
        status: "draft",
        generatedAt: now,
        approvedAt: null,
        scheduledAt: null,
        publishedAt: null,
        threadsMediaId: null,
        error: null,
        abVariant: "A",
        model: "sourcing",
        imageUrl: null,
        imageUrls: null,
        cardBatchId: null,
        videoFilename: null,
        videoUrl: null,
        videoThumbnail: null,
        engagement: null,
      });
      ids.push(d.id);
    }
    if (ids.length) writeJson(dataPath("queue.json"), queue);
    return ids;
  });

  // import 스탬프(멱등). 파일 쓰기 성공 후에만 마킹.
  if (importedIds.length) {
    await withTenant(tenantId, (sql) => sql`
      UPDATE drafts SET payload = payload || jsonb_build_object('imported_at', ${now}::text)
      WHERE id = ANY(${importedIds})`);
  }
  return { imported: importedIds.length };
}

// 미import short draft 개수(UI 배지용).
export async function countUnimportedShortDrafts(tenantId: string): Promise<number> {
  try {
    const [row] = await withTenant(tenantId, (sql) => sql<{ c: number }[]>`
      SELECT count(*)::int AS c FROM drafts
      WHERE payload->>'kind' = 'short' AND NOT (payload ? 'imported_at')`);
    return row?.c ?? 0;
  } catch {
    return 0;
  }
}
