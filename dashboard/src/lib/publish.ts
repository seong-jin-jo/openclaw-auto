import crypto from "node:crypto";
import { withTenant } from "@/lib/db";

// 대시보드 직접 발행(게이트웨이 docker 불필요). 토큰=integrations 테이블(테넌트별) → env 폴백(dev).
// 게이트웨이 extensions/{ch}-publish 로직 포팅. 실발행은 실 토큰 필요.

const THREADS_API = "https://graph.threads.net/v1.0";
const IG_API = "https://graph.facebook.com/v21.0";
const FB_API = "https://graph.facebook.com/v21.0";
const X_API = "https://api.twitter.com/2";

export interface PublishResult {
  ok: boolean;
  externalId?: string;
  permalink?: string;
  error?: string;
}

// meta = 채널별 부가 자격증명. userId(threads/ig user, fb pageId) + X는 4키(OAuth1.0a)를 meta에 저장.
interface ChannelCred { token: string; userId?: string; meta?: Record<string, unknown> }

// 테넌트 채널 자격증명 resolve: integrations(kind=channel,label=platform) → env 폴백
export async function getChannelCred(tenantId: string, platform: string): Promise<ChannelCred | null> {
  const key = process.env.OSMU_SECRET_KEY;
  // L1+L2: withTenant 트랜잭션(RLS) 안에서 암호화 secret 복호화. 토큰은 메모리에만.
  const [row] = await withTenant(tenantId, (sql) => sql<{ token: string | null; meta: Record<string, unknown> | null }[]>`
    SELECT CASE WHEN secret_enc <> '' AND ${key ?? ""} <> ''
             THEN pgp_sym_decrypt(dearmor(secret_enc), ${key ?? ""}) ELSE NULL END AS token, meta
    FROM integrations
    WHERE tenant_id = ${tenantId} AND kind = 'channel' AND label = ${platform}`);
  if (row) {
    const meta = (row.meta ?? {}) as Record<string, unknown>;
    const userId = typeof meta.userId === "string" ? meta.userId : undefined;
    // X는 token 컬럼 미사용 가능 — 4키가 meta에 적재되면 cred 인정
    if (platform === "x" && (meta.apiKey || meta.accessToken)) {
      return { token: row.token ?? "", userId, meta };
    }
    if (row.token) return { token: row.token, userId, meta };
  }
  // dev 폴백(단일 env — 중앙 대시보드엔 테넌트별 env 없음)
  if (platform === "threads" && process.env.THREADS_ACCESS_TOKEN) {
    return { token: process.env.THREADS_ACCESS_TOKEN, userId: process.env.THREADS_USER_ID };
  }
  if (platform === "instagram" && process.env.INSTAGRAM_ACCESSTOKEN) {
    return { token: process.env.INSTAGRAM_ACCESSTOKEN, userId: process.env.INSTAGRAM_USERID };
  }
  if (platform === "facebook" && process.env.FACEBOOK_ACCESSTOKEN) {
    return { token: process.env.FACEBOOK_ACCESSTOKEN, userId: process.env.FACEBOOK_PAGEID };
  }
  if (platform === "x" && process.env.X_API_KEY) {
    // 4키 OAuth1.0a — env 폴백은 meta에 담아 publishX가 동일 경로로 소비
    return {
      token: "",
      meta: {
        apiKey: process.env.X_API_KEY,
        apiSecret: process.env.X_API_KEY_SECRET,
        accessToken: process.env.X_ACCESS_TOKEN,
        accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
      },
    };
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

// ── X(Twitter) OAuth1.0a 서명 ─────────────────────────────────────────────
// RFC5849: 서명베이스 = METHOD&percentEnc(URL)&percentEnc(정렬파라미터).
// POST /2/tweets는 본문이 JSON이라 서명 대상 파라미터 = oauth_* 만(쿼리·폼 없음).
// 서명키 = percentEnc(consumerSecret)&percentEnc(tokenSecret), HMAC-SHA1 → base64.

// OAuth 전용 퍼센트 인코딩(예약문자 !'()* 추가 인코딩 — encodeURIComponent 미처리분)
function xPercentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export interface XKeys { apiKey: string; apiSecret: string; accessToken: string; accessSecret: string }

// X 자격 실검증(OAuth1 서명된 read-only GET). 발행 없이 키 유효성·계정 확인.
// ok=true면 @screen_name. networkError면 네트워크로 확인 불가(키는 보존). status로 인증 실패 구분.
export async function verifyXCredentials(
  k: XKeys,
): Promise<{ ok: boolean; account?: string; status?: number; networkError?: boolean }> {
  const url = "https://api.twitter.com/1.1/account/verify_credentials.json";
  const auth = buildXOAuthHeader("GET", url, k);
  try {
    const resp = await fetch(url, { method: "GET", headers: { Authorization: auth }, signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const d = (await resp.json()) as { screen_name?: string };
      return { ok: true, account: d.screen_name ? `@${d.screen_name}` : "(X 연결됨)" };
    }
    return { ok: false, status: resp.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/fetch failed|ENOTFOUND|name resolution|timeout|aborted|abort/i.test(msg)) return { ok: false, networkError: true };
    return { ok: false };
  }
}

function buildXOAuthHeader(method: string, url: string, k: XKeys): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: k.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: k.accessToken,
    oauth_version: "1.0",
  };
  // 1) 파라미터 정렬 후 직렬화 → 서명베이스 구성
  const sorted = Object.keys(oauth)
    .sort()
    .map((key) => `${xPercentEncode(key)}=${xPercentEncode(oauth[key])}`)
    .join("&");
  const base = `${method.toUpperCase()}&${xPercentEncode(url)}&${xPercentEncode(sorted)}`;
  // 2) 서명키 = consumerSecret&tokenSecret, HMAC-SHA1 → base64
  const signingKey = `${xPercentEncode(k.apiSecret)}&${xPercentEncode(k.accessSecret)}`;
  oauth.oauth_signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");
  // 3) Authorization 헤더 직렬화(oauth_signature 포함, 정렬)
  const headerParts = Object.keys(oauth)
    .sort()
    .map((key) => `${xPercentEncode(key)}="${xPercentEncode(oauth[key])}"`)
    .join(", ");
  return `OAuth ${headerParts}`;
}

// X 발행 (text only, API v2). 4키 OAuth1.0a 서명. 280자 초과 시 자르기.
export async function publishX(cred: ChannelCred, text: string): Promise<PublishResult> {
  const meta = (cred.meta ?? {}) as Record<string, unknown>;
  // apiSecret/accessSecret은 게이트웨이 표기(apiKeySecret/accessTokenSecret)도 허용
  const keys: XKeys = {
    apiKey: String(meta.apiKey ?? ""),
    apiSecret: String(meta.apiSecret ?? meta.apiKeySecret ?? ""),
    accessToken: String(meta.accessToken ?? ""),
    accessSecret: String(meta.accessSecret ?? meta.accessTokenSecret ?? ""),
  };
  if (!keys.apiKey || !keys.apiSecret || !keys.accessToken || !keys.accessSecret) {
    return { ok: false, error: "X 4키(apiKey/apiSecret/accessToken/accessSecret) 누락" };
  }
  // 280자 초과 시 자르기(멀티바이트 안전 — 코드포인트 단위)
  const body = [...(text ?? "")].slice(0, 280).join("");
  const url = `${X_API}/tweets`;
  const auth = buildXOAuthHeader("POST", url, keys);
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ text: body }),
  });
  if (!resp.ok) return { ok: false, error: `X tweet 실패(${resp.status}): ${(await resp.text()).slice(0, 200)}` };
  const data = (await resp.json()) as { data?: { id?: string } };
  const tweetId = data.data?.id;
  return { ok: true, externalId: tweetId, permalink: tweetId ? `https://x.com/i/web/status/${tweetId}` : undefined };
}

// Facebook 페이지 발행 (Graph API). imageUrl 있으면 /photos(caption), 없으면 /feed(message).
export async function publishFacebook(cred: ChannelCred, message: string, imageUrl?: string): Promise<PublishResult> {
  const pageId = cred.userId;
  if (!pageId) return { ok: false, error: "Facebook pageId(meta.userId) 없음" };
  if (!cred.token) return { ok: false, error: "Facebook access token 없음" };
  const endpoint = imageUrl ? "photos" : "feed";
  const params: Record<string, string> = { access_token: cred.token };
  if (imageUrl) {
    params.url = imageUrl;
    if (message) params.caption = message;
  } else {
    params.message = message ?? "";
  }
  const resp = await fetch(`${FB_API}/${pageId}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  if (!resp.ok) return { ok: false, error: `Facebook ${endpoint} 실패(${resp.status}): ${(await resp.text()).slice(0, 200)}` };
  // photos → { id, post_id }, feed → { id }
  const data = (await resp.json()) as { id?: string; post_id?: string };
  return { ok: true, externalId: data.post_id ?? data.id };
}
