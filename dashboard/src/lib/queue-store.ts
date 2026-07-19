import { withTenant } from "./db";
import { mutateJson, readJson, dataPath } from "./file-io";
import { runWithTenant } from "./tenant-context";

// P4 expand/contract — 1단계: queue.json 쓰기를 DB queue_posts에 "그림자 복제"(dual-write).
//
// 설계 원칙(무중단):
//  - queue.json이 여전히 진실의 원천(source of truth). 읽기·cron·extension은 전부 json 그대로.
//  - 이 함수는 best-effort 미러일 뿐 — 어떤 경우에도 throw하지 않는다(DB 미설정/RLS 미적용/UUID 불일치 등).
//    따라서 이 호출이 실패해도 기존 queue.json 쓰기 경로는 절대 깨지지 않는다.
//  - 이후 단계: read 전환 → cron/extension 전환(cross-repo) → backfill → contract(json 제거).

// 필드는 unknown으로 느슨하게(호출부의 QueuePost / Record<string,unknown> 모두 수용). id만 string 강제.
export interface QueueMirrorPost {
  id: string;
  text?: unknown;
  topic?: unknown;
  status?: unknown;
  hashtags?: unknown;
  channels?: unknown;
  generatedAt?: unknown;
  approvedAt?: unknown;
  scheduledAt?: unknown;
  publishedAt?: unknown;
  [k: string]: unknown;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: unknown): s is string => typeof s === "string" && UUID_RE.test(s);
const ts = (s: unknown): string | null => (typeof s === "string" && s.trim() ? s : null);

// 단일 항목 upsert(생성/수정 공용). queue.json 쓰기 직후 호출.
export async function mirrorQueuePost(tenantId: string | null, post: QueueMirrorPost): Promise<void> {
  // DB는 tenant_id·id 모두 UUID 필요. 아니면(운영자 모드/레거시 id 등) 조용히 skip → 무중단.
  if (!isUuid(tenantId) || !isUuid(post?.id)) return;
  const text = (typeof post.text === "string" ? post.text : null);
  const topic = (typeof post.topic === "string" ? post.topic : null);
  const status = (typeof post.status === "string" ? post.status : "draft");
  const hashtags = (Array.isArray(post.hashtags) ? post.hashtags : []) as string[];
  try {
    await withTenant(tenantId, async (sql) => {
      await sql`
        INSERT INTO queue_posts
          (id, tenant_id, text, topic, status, hashtags, channels, payload,
           generated_at, approved_at, scheduled_at, published_at)
        VALUES
          (${post.id}::uuid, ${tenantId}::uuid, ${text}, ${topic},
           ${status}, ${hashtags}, ${sql.json((post.channels ?? null) as never)},
           ${sql.json(post as never)}, ${ts(post.generatedAt)}, ${ts(post.approvedAt)},
           ${ts(post.scheduledAt)}, ${ts(post.publishedAt)})
        ON CONFLICT (id) DO UPDATE SET
          text = EXCLUDED.text, topic = EXCLUDED.topic, status = EXCLUDED.status,
          hashtags = EXCLUDED.hashtags, channels = EXCLUDED.channels, payload = EXCLUDED.payload,
          approved_at = EXCLUDED.approved_at, scheduled_at = EXCLUDED.scheduled_at,
          published_at = EXCLUDED.published_at, updated_at = now()
      `;
    });
  } catch (e) {
    if (process.env.OSMU_DEBUG) console.error("[queue-store] mirror skip:", (e as Error).message);
  }
}

// P4 backfill: 현 queue.json 전체를 DB로 미러(멱등 upsert). read-switch 전 DB를 완전한 그림자로.
// runWithTenant 컨텍스트 안에서 호출(테넌트별 queue.json). best-effort 합산 결과 반환.
export async function backfillQueueToDb(tenantId: string | null): Promise<{ total: number; mirrored: number; skipped: number }> {
  const q = readJson<{ posts: Array<Record<string, unknown>> }>(dataPath("queue.json")) || { posts: [] };
  const posts = q.posts || [];
  let mirrored = 0;
  let skipped = 0;
  for (const p of posts) {
    const id = p?.id;
    if (!isUuid(tenantId) || !isUuid(id)) { skipped++; continue; }
    try {
      await mirrorQueuePost(tenantId, p as { id: string; [k: string]: unknown });
      mirrored++;
    } catch {
      skipped++;
    }
  }
  return { total: posts.length, mirrored, skipped };
}

// 삭제 미러(거절/삭제 시). best-effort.
export async function mirrorQueueDelete(tenantId: string | null, postId: string): Promise<void> {
  if (!isUuid(tenantId) || !isUuid(postId)) return;
  try {
    await withTenant(tenantId, async (sql) => {
      await sql`DELETE FROM queue_posts WHERE id = ${postId}::uuid`;
    });
  } catch (e) {
    if (process.env.OSMU_DEBUG) console.error("[queue-store] delete-mirror skip:", (e as Error).message);
  }
}

export async function markQueuePublished(
  tenantId: string,
  postId: string,
  result: { platform: string; externalId?: string; permalink?: string },
): Promise<boolean> {
  if (!isUuid(tenantId) || !isUuid(postId)) return false;

  let found: QueueMirrorPost | null = null;
  const publishedAt = new Date().toISOString();
  await runWithTenant(tenantId, () => mutateJson<{ version?: number; posts: QueueMirrorPost[] }>(
    dataPath("queue.json"),
    (queue) => {
      for (const post of queue.posts || []) {
        if (post.id !== postId) continue;
        post.status = "published";
        post.publishedAt = publishedAt;
        post.publishedPlatform = result.platform;
        post.externalId = result.externalId ?? null;
        post.permalink = result.permalink ?? null;
        found = post;
      }
      return queue;
    },
    { version: 2, posts: [] },
  ));

  await withTenant(tenantId, (sql) => sql`
    UPDATE queue_posts
       SET status = 'published', published_at = ${publishedAt},
           payload = COALESCE(payload, '{}'::jsonb) || ${sql.json({
             status: "published",
             publishedAt,
             publishedPlatform: result.platform,
             externalId: result.externalId ?? null,
             permalink: result.permalink ?? null,
           } as never)},
           updated_at = now()
     WHERE id = ${postId}::uuid
  `);
  return found !== null;
}
