import { withTenant } from "@/lib/db";

// 대시보드 직접 발행(게이트웨이 docker 불필요). 토큰=integrations 테이블(테넌트별) → env 폴백(dev).
// 게이트웨이 extensions/{ch}-publish 로직 포팅. 실발행은 실 토큰 필요.

const THREADS_API = "https://graph.threads.net/v1.0";
const IG_API = "https://graph.facebook.com/v21.0";

export interface PublishResult {
  ok: boolean;
  externalId?: string;
  permalink?: string;
  error?: string;
}

interface ChannelCred { token: string; userId?: string }

// 테넌트 채널 자격증명 resolve: integrations(kind=channel,label=platform) → env 폴백
export async function getChannelCred(tenantId: string, platform: string): Promise<ChannelCred | null> {
  const key = process.env.OSMU_SECRET_KEY;
  // L1+L2: withTenant 트랜잭션(RLS) 안에서 암호화 secret 복호화. 토큰은 메모리에만.
  const [row] = await withTenant(tenantId, (sql) => sql<{ token: string | null; meta: { userId?: string } | null }[]>`
    SELECT CASE WHEN secret_enc <> '' AND ${key ?? ""} <> ''
             THEN pgp_sym_decrypt(dearmor(secret_enc), ${key ?? ""}) ELSE NULL END AS token, meta
    FROM integrations
    WHERE tenant_id = ${tenantId} AND kind = 'channel' AND label = ${platform}`);
  if (row?.token) return { token: row.token, userId: row.meta?.userId };
  // dev 폴백(단일 env — 중앙 대시보드엔 테넌트별 env 없음)
  if (platform === "threads" && process.env.THREADS_ACCESS_TOKEN) {
    return { token: process.env.THREADS_ACCESS_TOKEN, userId: process.env.THREADS_USER_ID };
  }
  if (platform === "instagram" && process.env.INSTAGRAM_ACCESSTOKEN) {
    return { token: process.env.INSTAGRAM_ACCESSTOKEN, userId: process.env.INSTAGRAM_USERID };
  }
  return null;
}

// Threads 발행 (text + 선택 image). 2-step container→publish.
export async function publishThreads(cred: ChannelCred, text: string, imageUrl?: string): Promise<PublishResult> {
  if (!cred.userId) return { ok: false, error: "THREADS_USER_ID(meta.userId) 없음" };
  const params: Record<string, string> = {
    media_type: imageUrl ? "IMAGE" : "TEXT", text, access_token: cred.token,
  };
  if (imageUrl) params.image_url = imageUrl;
  const create = await fetch(`${THREADS_API}/${cred.userId}/threads`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  if (!create.ok) return { ok: false, error: `container 실패(${create.status}): ${(await create.text()).slice(0, 200)}` };
  const { id: containerId } = (await create.json()) as { id: string };
  const pub = await fetch(`${THREADS_API}/${cred.userId}/threads_publish`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: containerId, access_token: cred.token }),
  });
  if (!pub.ok) return { ok: false, error: `publish 실패(${pub.status}): ${(await pub.text()).slice(0, 200)}` };
  const { id: mediaId } = (await pub.json()) as { id: string };
  // permalink 조회
  let permalink: string | undefined;
  try {
    const pl = await fetch(`${THREADS_API}/${mediaId}?fields=permalink&access_token=${cred.token}`);
    if (pl.ok) permalink = ((await pl.json()) as { permalink?: string }).permalink;
  } catch { /* permalink 실패 무시 */ }
  return { ok: true, externalId: mediaId, permalink };
}

// Instagram 발행 (caption + 단일 image, Graph API). image_url은 공개 URL 필요.
export async function publishInstagram(cred: ChannelCred, caption: string, imageUrl?: string): Promise<PublishResult> {
  if (!cred.userId) return { ok: false, error: "INSTAGRAM_USERID(meta.userId) 없음" };
  if (!imageUrl) return { ok: false, error: "Instagram은 이미지 필수" };
  const create = await fetch(`${IG_API}/${cred.userId}/media`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ image_url: imageUrl, caption, access_token: cred.token }),
  });
  if (!create.ok) return { ok: false, error: `IG container 실패(${create.status}): ${(await create.text()).slice(0, 200)}` };
  const { id: creationId } = (await create.json()) as { id: string };
  const pub = await fetch(`${IG_API}/${cred.userId}/media_publish`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: creationId, access_token: cred.token }),
  });
  if (!pub.ok) return { ok: false, error: `IG publish 실패(${pub.status}): ${(await pub.text()).slice(0, 200)}` };
  const { id: mediaId } = (await pub.json()) as { id: string };
  return { ok: true, externalId: mediaId };
}
