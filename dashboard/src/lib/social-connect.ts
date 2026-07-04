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

// Facebook은 "비즈니스용 Facebook 로그인"(Facebook Login for Business) 앱이다.
// classic Facebook Login과 달리 authorize dialog에서 scope 대신 config_id를 넘긴다:
//   "config_id has replaced scope ... we recommend that you do not use [scope]"
//   — https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business
// config_id는 사람이 App Dashboard에서 login configuration을 만들면 발급되는 값으로,
// 그 configuration에 pages_manage_posts / pages_show_list 등 권한·asset이 묶인다.
// 코드는 이 값을 env FB_CONFIG_ID 로 "소비"만 한다(콘솔서 생성 → 여기서 사용).
// 토큰 교환(exchangeFacebookCode)은 classic manual-flow와 동일 엔드포인트를 쓴다:
//   GET graph.facebook.com/v21.0/oauth/access_token?client_id&client_secret&redirect_uri&code
//   — https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/
// 페이지 토큰 흐름(user token → /me/accounts → page token)은 그대로 유효.
export const FACEBOOK = {
  label: "facebook",
  authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
  // scope는 config_id 모델에서 미사용(참고용으로만 남김 — buildAuthUrl은 config_id를 보낸다).
  scopes: ["pages_show_list", "pages_manage_posts", "pages_read_engagement"],
  appIdEnv: "FB_APP_ID",
  appSecretEnv: "FB_APP_SECRET",
  configIdEnv: "FB_CONFIG_ID",
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
  const params: Record<string, string> = {
    client_id: clientId,
    redirect_uri: redirectUri(origin, providerName),
    response_type: "code",
    state,
  };
  if (providerName === "facebook") {
    // 비즈니스용 Facebook 로그인 = scope 대신 config_id. 없으면 authorize 불가(콘솔서 발급 필요).
    const configId = process.env[FACEBOOK.configIdEnv];
    if (!configId) return null;
    params.config_id = configId;
  } else {
    // Instagram·Threads(Instagram Login API 계열) = scope 콤마구분.
    params.scope = provider.scopes.join(",");
  }
  return `${provider.authorizeUrl}?${new URLSearchParams(params).toString()}`;
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
  // Instagram 문서: 인가 code 끝의 "#_" 는 code가 아니므로 제거. redirect_uri는 authorize와 동일값(단발).
  // (Instagram은 첫 exchange 시도에서 code를 소비하므로 재시도 금지 — 단발로 정확히 보낸다.)
  const cleanCode = code.replace(/#_.*$/, "").replace(/#.*$/, "");
  const ru = redirectUri(origin, providerName);
  const shortRes = await f(p.tokenUrl, {
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
  const lastText = await shortRes.text();
  let short: { access_token?: string; user_id?: string; error_message?: string } = {};
  try { short = JSON.parse(lastText); } catch { short = {}; }
  if (!short.access_token) {
    return { accessToken: "", error: short.error_message || "단기 토큰 교환 실패" };
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
// config_id는 authorize 단계에서만 필요하고, 토큰 교환은 classic manual-flow와 동일 엔드포인트다
// (graph.facebook.com/v21.0/oauth/access_token, client_id+client_secret+redirect_uri+code).
// FB_APP_SECRET가 반드시 필요(교환·장기토큰 서명). redirect_uri는 authorize와 글자까지 동일해야 한다.
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
