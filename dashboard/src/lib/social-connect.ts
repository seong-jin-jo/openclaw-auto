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
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  instagram: {
    label: "instagram",
    authorizeUrl: "https://www.instagram.com/oauth/authorize",
    scopes: [
      "instagram_business_basic",
      "instagram_business_content_publish",
      "instagram_business_manage_insights",
      "instagram_business_manage_comments",
    ],
    appIdEnv: "IG_APP_ID",
    appSecretEnv: "IG_APP_SECRET",
  },
};

export function getProvider(name: string): ProviderConfig | null {
  return PROVIDERS[name] || null;
}

export function redirectUri(origin: string, provider: string): string {
  return `${origin}/api/connect/${provider}/callback`;
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

// code → 단기 토큰(+user_id) → 장기 토큰 교환(Instagram). fetch 주입 가능(테스트).
export async function exchangeInstagramCode(
  code: string,
  origin: string,
  f: typeof fetch = fetch,
): Promise<ExchangedToken> {
  const clientId = process.env.IG_APP_ID || "";
  const clientSecret = process.env.IG_APP_SECRET || "";
  if (!clientId || !clientSecret) return { accessToken: "", error: "IG_APP_ID/SECRET 미설정" };
  // 1) 단기 토큰
  const shortRes = await f("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(origin, "instagram"),
      code,
    }).toString(),
  });
  const short = (await shortRes.json()) as { access_token?: string; user_id?: string; error_message?: string };
  if (!short.access_token) return { accessToken: "", error: short.error_message || "단기 토큰 교환 실패" };
  // 2) 장기 토큰(60일)
  const longRes = await f(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(short.access_token)}`,
  );
  const long = (await longRes.json()) as { access_token?: string };
  return { accessToken: long.access_token || short.access_token, userId: short.user_id ? String(short.user_id) : undefined };
}
