// 소셜 채널 OAuth "연결" 헬퍼 (ADR-004 — 고객은 비번 없이 버튼만, 우리가 토큰 받아 저장).
// 고객이 "연결" 클릭 → provider OAuth 동의 → callback이 code를 토큰으로 교환 → integrations(per-tenant)
// 에 저장. 비번은 절대 우리를 거치지 않음(provider 공식 페이지에서만).
//
// 앱 자격증명은 플랫폼 env(우리 앱 하나). 고객별 발급이 아니라 우리 앱이 OAuth 주체.
//
// PKCE(Proof Key for Code Exchange, RFC 7636) — X·TikTok 필수.
//   code_verifier(32바이트 랜덤 → base64url) → SHA-256 → code_challenge(base64url)
//   verifier는 httpOnly 쿠키(10분)에 임시 저장 → callback에서 꺼내 검증.

export interface ProviderConfig {
  label: string;            // integrations.label
  authorizeUrl: string;
  scopes: string[];
  appIdEnv: string;
  appSecretEnv: string;
  tokenUrl: string;         // 단기 토큰 교환(POST form)
  longTokenUrl: string;     // 장기 토큰 교환(GET). "" = 표준 OAuth(단계 없음)
  longGrant: string;        // ig_exchange_token | th_exchange_token | "" (표준 OAuth)
  pkce?: boolean;           // PKCE(RFC 7636) 필수 여부 — X, TikTok
  scopeSeparator?: string;  // scope 구분자. 기본 "," (Meta계열). 표준 OAuth는 " "
  extraAuthParams?: Record<string, string>; // authorize URL 추가 파라미터(YouTube: access_type, prompt)
}

// ── PKCE 헬퍼(RFC 7636) ──────────────────────────────────────────────────────
// Web Crypto API 사용(Node.js 18+·Edge Runtime 모두 지원).

/** 32바이트 랜덤 base64url code_verifier (43자) */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

/** code_verifier → SHA-256 → base64url code_challenge */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlEncode(new Uint8Array(digest));
}

function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...Array.from(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// ── Instagram·Threads (Meta LoginAPI — 단기→장기 2단계 교환) ─────────────────
// ── 표준 OAuth 2.0 채널 (longTokenUrl/longGrant = "" → 단일 교환) ────────────
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
  x: {
    label: "x",
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    appIdEnv: "X_CLIENT_ID",
    appSecretEnv: "X_CLIENT_SECRET",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    longTokenUrl: "",
    longGrant: "",
    pkce: true,
    scopeSeparator: " ",
  },
  linkedin: {
    label: "linkedin",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    scopes: ["openid", "profile", "w_member_social"],
    appIdEnv: "LINKEDIN_CLIENT_ID",
    appSecretEnv: "LINKEDIN_CLIENT_SECRET",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    longTokenUrl: "",
    longGrant: "",
    scopeSeparator: " ",
  },
  youtube: {
    label: "youtube",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
    appIdEnv: "YOUTUBE_CLIENT_ID",
    appSecretEnv: "YOUTUBE_CLIENT_SECRET",
    tokenUrl: "https://oauth2.googleapis.com/token",
    longTokenUrl: "",
    longGrant: "",
    scopeSeparator: " ",
    extraAuthParams: { access_type: "offline", prompt: "consent" },
  },
  naver_blog: {
    label: "naver_blog",
    authorizeUrl: "https://nid.naver.com/oauth2.0/authorize",
    scopes: ["blog"],
    appIdEnv: "NAVER_CLIENT_ID",
    appSecretEnv: "NAVER_CLIENT_SECRET",
    tokenUrl: "https://nid.naver.com/oauth2.0/token",
    longTokenUrl: "",
    longGrant: "",
    scopeSeparator: " ",
  },
  pinterest: {
    label: "pinterest",
    authorizeUrl: "https://www.pinterest.com/oauth/",
    scopes: ["boards:read", "pins:write"],
    appIdEnv: "PINTEREST_APP_ID",
    appSecretEnv: "PINTEREST_APP_SECRET",
    tokenUrl: "https://api.pinterest.com/v5/oauth/token",
    longTokenUrl: "",
    longGrant: "",
    scopeSeparator: " ",
  },
  tumblr: {
    label: "tumblr",
    authorizeUrl: "https://www.tumblr.com/oauth2/authorize",
    scopes: ["write", "basic"],
    appIdEnv: "TUMBLR_CONSUMER_KEY",
    appSecretEnv: "TUMBLR_CONSUMER_SECRET",
    tokenUrl: "https://api.tumblr.com/v2/oauth2/token",
    longTokenUrl: "",
    longGrant: "",
    scopeSeparator: " ",
  },
  tiktok: {
    label: "tiktok",
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scopes: ["user.info.basic", "video.publish"],
    appIdEnv: "TIKTOK_CLIENT_KEY",
    appSecretEnv: "TIKTOK_CLIENT_SECRET",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    longTokenUrl: "",
    longGrant: "",
    pkce: true,
    scopeSeparator: ",",
  },
  slack: {
    label: "slack",
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    scopes: ["chat:write"],
    appIdEnv: "SLACK_CLIENT_ID",
    appSecretEnv: "SLACK_CLIENT_SECRET",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    longTokenUrl: "",
    longGrant: "",
    scopeSeparator: " ",
  },
  line: {
    label: "line",
    authorizeUrl: "https://access.line.me/oauth2/v2.1/authorize",
    scopes: ["profile", "openid"],
    appIdEnv: "LINE_CLIENT_ID",
    appSecretEnv: "LINE_CLIENT_SECRET",
    tokenUrl: "https://api.line.me/oauth2/v2.1/token",
    longTokenUrl: "",
    longGrant: "",
    scopeSeparator: " ",
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

// OAuth 동의 URL.
// state = tenantId(콜백서 어느 테넌트인지 식별 — 위변조 방지는 짧은 수명+서명이 이상적이나
// 1차는 tenantId 그대로; 콜백서 effectiveTenantId와 교차검증 가능).
// extraParams: 라우터가 미리 계산한 PKCE code_challenge 등 추가 파라미터(선택).
export function buildAuthUrl(
  provider: ProviderConfig,
  origin: string,
  providerName: string,
  state: string,
  extraParams?: Record<string, string>,
): string | null {
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
    // scope: provider별 구분자 사용(기본 "," = Meta계열, " " = 표준 OAuth 2.0).
    const sep = provider.scopeSeparator ?? ",";
    params.scope = provider.scopes.join(sep);
  }
  // provider 고유 추가 파라미터(YouTube: access_type=offline, prompt=consent)
  if (provider.extraAuthParams) {
    Object.assign(params, provider.extraAuthParams);
  }
  // 라우터 주입 파라미터(PKCE: code_challenge, code_challenge_method 등) — 우선순위 최상
  if (extraParams) {
    Object.assign(params, extraParams);
  }
  return `${provider.authorizeUrl}?${new URLSearchParams(params).toString()}`;
}

export interface ExchangedToken {
  accessToken: string;
  userId?: string;
  refreshToken?: string; // YouTube offline.access — integrations meta.refreshToken에 저장
  error?: string;
}

// code → 토큰 교환. Instagram·Threads는 단기→장기 2단계. 표준 OAuth 채널은 단일 교환.
// options.codeVerifier: PKCE 채널(X, TikTok)은 callback이 쿠키에서 꺼내 전달.
// fetch 주입 가능(테스트).
export async function exchangeCode(
  providerName: string,
  code: string,
  origin: string,
  options: { codeVerifier?: string } = {},
  f: typeof fetch = fetch,
): Promise<ExchangedToken> {
  const p = getProvider(providerName);
  if (!p) return { accessToken: "", error: `unknown provider: ${providerName}` };
  const clientId = process.env[p.appIdEnv] || "";
  const clientSecret = process.env[p.appSecretEnv] || "";
  if (!clientId || !clientSecret) return { accessToken: "", error: `${p.appIdEnv}/${p.appSecretEnv} 미설정` };

  // Instagram 문서: 인가 code 끝의 "#_" 는 code가 아니므로 제거.
  const cleanCode = code.replace(/#_.*$/, "").replace(/#.*$/, "");
  const ru = redirectUri(origin, providerName);

  // ── 표준 OAuth 2.0 (단일 교환 — longTokenUrl 없음) ───────────────────────
  if (!p.longTokenUrl) {
    const bodyParams: Record<string, string> = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: ru,
      code: cleanCode,
    };
    // PKCE: callback이 쿠키에서 꺼낸 verifier를 주입(없으면 생략 — 비PKCE 채널)
    if (options.codeVerifier) {
      bodyParams.code_verifier = options.codeVerifier;
    }
    const res = await f(p.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(bodyParams).toString(),
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch { data = {}; }

    // Slack 특수 처리: bot token = 최상위 access_token, user token = authed_user.access_token
    let accessToken = (data.access_token as string) || "";
    if (providerName === "slack") {
      const slack = data as { access_token?: string; authed_user?: { access_token?: string } };
      accessToken = slack.access_token || slack.authed_user?.access_token || "";
    }
    if (!accessToken) {
      return { accessToken: "", error: ((data.error_description || data.error || "토큰 교환 실패") as string) };
    }
    return {
      accessToken,
      userId: data.user_id ? String(data.user_id) : undefined,
      refreshToken: (data.refresh_token as string) || undefined, // YouTube offline
    };
  }

  // ── Meta LoginAPI 계열 (단기→장기 2단계 교환) ─────────────────────────────
  // redirect_uri는 authorize와 동일값(단발). Instagram은 첫 exchange 시도에서 code를 소비하므로 재시도 금지.
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
