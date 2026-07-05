import { effectiveTenantId } from "@/lib/tenant-auth";
import { getProvider, buildAuthUrl, publicOrigin, generateCodeVerifier, generateCodeChallenge } from "@/lib/social-connect";

// GET /api/connect/{provider}?tenant_id=... — OAuth "연결" 동의 URL 반환.
// 프론트의 "연결" 버튼이 호출 → 받은 authUrl을 팝업으로 연다 → 사용자가 provider 공식 페이지에서
// 로그인/동의(비번은 거기서만) → callback이 토큰을 받아 테넌트별 저장. (ADR-004)
//
// PKCE 채널(X, TikTok): code_verifier 생성 → httpOnly 쿠키(10분) 저장,
//   code_challenge(SHA-256) → authUrl에 첨부. callback에서 쿠키 꺼내 검증.
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const cfg = getProvider(provider);
  if (!cfg) return Response.json({ error: `지원하지 않는 provider: ${provider}` }, { status: 400 });

  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  if (!tenantId) return Response.json({ error: "tenant_id required" }, { status: 400 });

  // 비즈니스용 Facebook 로그인은 config_id가 필수 — 없으면 authorize URL을 만들 수 없다(명확히 안내).
  if (provider === "facebook" && !process.env.FB_CONFIG_ID) {
    return Response.json(
      { error: "FB_CONFIG_ID 미설정 — 비즈니스용 Facebook 로그인 구성 ID 필요(App Dashboard에서 login configuration 생성 시 발급)" },
      { status: 500 },
    );
  }

  const origin = publicOrigin(request);

  // PKCE 채널: code_verifier 생성 → SHA-256 challenge 계산 → 쿠키에 verifier 저장
  let extraParams: Record<string, string> | undefined;
  let cookieHeader: string | undefined;

  if (cfg.pkce) {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    extraParams = { code_challenge: challenge, code_challenge_method: "S256" };
    // httpOnly 쿠키(10분) — callback GET 요청에 자동 첨부(SameSite=Lax: OAuth 리다이렉트는 top-level GET이므로 OK)
    const isSecure = origin.startsWith("https://");
    cookieHeader = [
      `pkce_${provider}=${encodeURIComponent(verifier)}`,
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=600",
      `Path=/api/connect/${provider}/callback`,
      ...(isSecure ? ["Secure"] : []),
    ].join("; ");
  }

  const authUrl = buildAuthUrl(cfg, origin, provider, tenantId, extraParams);
  if (!authUrl) return Response.json({ error: `${cfg.appIdEnv} 미설정 — 플랫폼 OAuth 앱 자격증명 필요` }, { status: 500 });

  const headers: Record<string, string> = {};
  if (cookieHeader) headers["Set-Cookie"] = cookieHeader;
  return Response.json({ authUrl }, { headers });
}
