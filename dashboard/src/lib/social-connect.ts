// 소셜 채널 OAuth "연결" 헬퍼 (ADR-004 — 고객은 비번 없이 버튼만, 우리가 토큰 받아 저장).
// 고객이 "연결" 클릭 → provider OAuth 동의 → callback이 code를 토큰으로 교환 → integrations(per-tenant)
// 에 저장. 비번은 절대 우리를 거치지 않음(provider 공식 페이지에서만).
//
// 앱 자격증명은 플랫폼 env(우리 Meta 앱 하나). 고객별 발급이 아니라 우리 앱이 OAuth 주체.
//   IG_APP_ID / IG_APP_SECRET (Instagram Login API)
// 향후 threads/facebook은 PROVIDERS에 추가(같은 shape).

export interface ProviderConfig {
  label: string; // integrations.label
  authorizeUrl: string;
  scopes: string[];
  appIdEnv: string;
  appSecretEnv: string;
  tokenUrl: string;      // 단기 토큰 교환(POST form)
  longTokenUrl: string;  // 장기 토큰 교환(GET)
  longGrant: string;     // ig_exchange_token | th_exchange_token
}

// Instagram·Threads는 같은 OAuth shape(단기→장기 교환). provider별 엔드포인트만 다름.
export const PROVIDERS: Record<string, ProviderConfig> = {
  instagram: {
    label: "instagram",
    authorizeUrl: "https://www.instagram.com/oauth/authorize",
    scopes: ["instagram_business_basic", "instagram_business_content_publish", "instagram_business_manage_insights", "instagram_business_manage_comments"],
    appIdEnv: "IG_APP_ID",
    appSecretEnv: "IG_APP_SECRET",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    longTokenUrl: "https://graph.instagram.com/access_token",
    longGrant: "ig_exchange_token",
  },
  threads: {
    label: "threads",
    authorizeUrl: "https://threads.net/oauth/authorize",
    scopes: ["threads_basic", "threads_content_publish", "threads_manage_insights"],
    appIdEnv: "THREADS_APP_ID",
    appSecretEnv: "THREADS_APP_SECRET",
    tokenUrl: "https://graph.threads.net/oauth/access_token",
    longTokenUrl: "https://graph.threads.net/access_token",
    longGrant: "th_exchange_token",
  },
};

// Facebook은 페이지 토큰 흐름이 다름(user token → /me/accounts → page token). 별도 config.
export const FACEBOOK = {
  label: "facebook",
  authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
  scopes: ["pages_show_list", "pages_manage_posts", "pages_read_engagement"],
  appIdEnv: "FB_APP_ID",
  appSecretEnv: "FB_APP_SECRET",
};

export function getProvider(name: string): ProviderConfig | null {
  if (name === "facebook") {
    // FACEBOOK는 별도 흐름이나 auth-url 구성은 동일 필드만 필요 — shim.
    return { ...FACEBOOK, tokenUrl: "", longTokenUrl: "", longGrant: "" } as ProviderConfig;
  }
  return PROVIDERS[name] || null;
}

export function redirectUri(origin: string, provider: string): string {
  return `${origin}/api/connect/${provider}/callback`;
}

// 공개 origin 확정 — OAuth redirect_uri는 Meta 콘솔 등록값과 "글자까지" 일치해야 한다.
// 리버스 프록시(Cloudflare 터널) 뒤에선 request.url이 컨테이너 내부 bind(0.0.0.0:PORT)를 가리켜
// redirect_uri가 어긋난다("Invalid redirect_uri" 실측 2026-07-03). 그래서:
//   1) OSMU_PUBLIC_URL (배포가 아는 정본 공개 URL) — 가장 확실, 애매함 0.
//   2) x-forwarded-proto/host (프록시가 넘긴 원 Host).
//   3) request.url.origin (로컬 dev fallback).
// 도메인은 env로만 — 공개 레포에 하드코딩 금지.
export function publicOrigin(request: Request): string {
  const env = process.env.OSMU_PUBLIC_URL;
  if (env) return env.replace(/\/+$/, "");
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

// OAuth 동의 URL. state = tenantId(콜백서 어느 테넌트인지 식별 — 위변조 방지는 짧은 수명+서명이 이상적이나
// 1차는 tenantId 그대로; 콜백서 effectiveTenantId와 교차검증 가능).
export function buildAuthUrl(provider: ProviderConfig, origin: string, providerName: string, state: string): string | null {
  const clientId = process.env[provider.appIdEnv];
  if (!clientId) return null;
  const p = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(origin, providerName),
    scope: provider.scopes.join(","),
    response_type: "code",
    state,
  });
  return `${provider.authorizeUrl}?${p.toString()}`;
}

export interface ExchangedToken {
  accessToken: string;
  userId?: string;
  error?: string;
}

// code → 단기 토큰(+user_id) → 장기 토큰 교환. Instagram·Threads 공통(provider 엔드포인트만 다름).
// fetch 주입 가능(테스트).
export async function exchangeCode(
  providerName: string,
  code: string,
  origin: string,
  f: typeof fetch = fetch,
): Promise<ExchangedToken> {
  const p = getProvider(providerName);
  if (!p) return { accessToken: "", error: `unknown provider: ${providerName}` };
  const clientId = process.env[p.appIdEnv] || "";
  const clientSecret = process.env[p.appSecretEnv] || "";
  if (!clientId || !clientSecret) return { accessToken: "", error: `${p.appIdEnv}/${p.appSecretEnv} 미설정` };
  // 1) 단기 토큰. Instagram 문서: 인가 code 끝의 "#_" 는 code가 아니므로 제거.
  // 또 Meta 대시보드가 redirect_uri에 trailing slash 를 붙여 저장하는 경우가 있어(공식 문서 경고),
  // slash 없는 값이 "redirect_uri identical" 에러를 내면 slash 붙은 값으로 자동 재시도한다.
  const cleanCode = code.replace(/#_.*$/, "").replace(/#.*$/, "");
  const ruBase = redirectUri(origin, providerName);
  // 중요: Instagram은 첫 exchange 시도에서 code를 "소비"한다. 그리고 Meta 대시보드가 redirect_uri를
  // trailing-slash canonical 로 저장하므로(라이브 실측: slash 없는 값→"redirect_uri identical" 에러+code소비),
  // slash 붙은 값을 "먼저" 보내야 첫 시도에서 매칭·성공한다. 후보 = [slash, no-slash] 순.
  const slashed = ruBase.endsWith("/") ? ruBase : ruBase + "/";
  const bare = ruBase.endsWith("/") ? ruBase.slice(0, -1) : ruBase;
  const candidates = [slashed, bare];
  let short: { access_token?: string; user_id?: string; error_message?: string } = {};
  let lastText = "";
  let usedRu = "";
  for (const ru of candidates) {
    const res = await f(p.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: ru,
        code: cleanCode,
      }).toString(),
    });
    lastText = await res.text();
    try { short = JSON.parse(lastText); } catch { short = {}; }
    usedRu = ru;
    if (short.access_token) break;
    // redirect_uri 관련 에러가 아니면(예: 만료/무효 code) 재시도 무의미 → 중단.
    if (!/redirect_uri|verification code/i.test(lastText)) break;
    console.error("[connect] redirect_uri 후보 실패, 다음 후보 시도", { tried: ru });
  }
  if (!short.access_token) {
    console.error("[connect] short-token 실패", { triedRu: usedRu, status: 400, body: lastText.slice(0, 300) });
    return { accessToken: "", error: `${short.error_message || "단기 토큰 교환 실패"} | sent_redirect_uri=${usedRu} | ig=${lastText.slice(0, 160)}` };
  }
  // 2) 장기 토큰(60일)
  const longRes = await f(
    `${p.longTokenUrl}?grant_type=${p.longGrant}&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(short.access_token)}`,
  );
  const long = (await longRes.json()) as { access_token?: string };
  return { accessToken: long.access_token || short.access_token, userId: short.user_id ? String(short.user_id) : undefined };
}

// Facebook: code → user token → 장기 user token → /me/accounts → 첫 페이지 토큰+id.
// 저장값 = 페이지 토큰(발행용) + meta.pageId. (다중 페이지면 첫 번째 — 향후 선택 UI.)
const FB_V = "https://graph.facebook.com/v21.0";
export async function exchangeFacebookCode(code: string, origin: string, f: typeof fetch = fetch): Promise<ExchangedToken> {
  const clientId = process.env.FB_APP_ID || "";
  const clientSecret = process.env.FB_APP_SECRET || "";
  if (!clientId || !clientSecret) return { accessToken: "", error: "FB_APP_ID/SECRET 미설정" };
  const cb = redirectUri(origin, "facebook");
  // 1) user token
  const tRes = await f(`${FB_V}/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(cb)}&code=${encodeURIComponent(code)}`);
  const t = (await tRes.json()) as { access_token?: string; error?: { message?: string } };
  if (!t.access_token) return { accessToken: "", error: t.error?.message || "user 토큰 교환 실패" };
  // 2) 장기 user token
  const lRes = await f(`${FB_V}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${encodeURIComponent(t.access_token)}`);
  const l = (await lRes.json()) as { access_token?: string };
  const userToken = l.access_token || t.access_token;
  // 3) 페이지 토큰
  const pRes = await f(`${FB_V}/me/accounts?access_token=${encodeURIComponent(userToken)}`);
  const p = (await pRes.json()) as { data?: Array<{ access_token?: string; id?: string }> };
  const page = p.data?.[0];
  if (!page?.access_token) return { accessToken: "", error: "연결된 Facebook 페이지가 없음(페이지 권한 확인)" };
  return { accessToken: page.access_token, userId: page.id };
}
