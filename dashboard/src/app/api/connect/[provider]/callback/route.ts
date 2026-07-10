import { withTenant } from "@/lib/db";
import { getProvider, exchangeCode, exchangeFacebookCode, publicOrigin, verifyState } from "@/lib/social-connect";
import { escapeHtml, oauthErrorMessage } from "@/lib/oauth-errors";

// GET /api/connect/{provider}/callback?code=...&state=<tenantId>
// provider OAuth 리다이렉트(인증 없음 — middleware 공개). state로 테넌트 식별 → code를 토큰 교환 →
// integrations(kind='channel', label=provider)에 암호화 저장. 비번은 우리를 거치지 않음(ADR-004).
//
// PKCE 채널(X, TikTok): httpOnly 쿠키 pkce_{provider}에서 code_verifier 꺼내 토큰 교환 body에 포함.
// YouTube: refresh_token을 meta.refreshToken에 추가 저장(offline.access 갱신용).
// Slack: access_token 또는 authed_user.access_token 자동 처리(exchangeCode 내부).

function resultHtml(title: string, sub: string): Response {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
  <body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
    <div style="text-align:center;max-width:520px;padding:24px"><h2>${escapeHtml(title)}</h2><p style="color:#aaa;line-height:1.5">${escapeHtml(sub)}</p>
    <script>setTimeout(()=>window.close(),2500)</script></div></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const { searchParams } = new URL(request.url);
  // 토큰 교환의 redirect_uri도 auth-url과 동일한 공개 origin이어야 한다(Meta가 일치 검증).
  const origin = publicOrigin(request);
  const code = searchParams.get("code") || "";
  const rawState = searchParams.get("state") || ""; // auth-url에서 signState()로 서명해 넣음(CSRF 방지)
  const err = searchParams.get("error_description") || searchParams.get("error");

  const cfg = getProvider(provider);
  if (!cfg) return resultHtml("연결 실패", `지원하지 않는 provider: ${provider}`);
  if (err) return resultHtml("연결 실패", oauthErrorMessage(String(err), cfg.label).slice(0, 240));
  if (!code || !rawState) return resultHtml("연결 실패", "code/state 누락");

  // state 서명·provider 바인딩·만료(10분) 검증 — 위조/재사용된(다른 provider용 포함) state로
  // 남의 테넌트에 연결되는 것을 차단.
  const stateCheck = await verifyState(rawState, provider);
  if (!stateCheck.valid) return resultHtml("연결 실패", stateCheck.reason || "state 검증 실패");
  const tenantId = stateCheck.tenantId;
  if (!tenantId) return resultHtml("연결 실패", "code/state 누락");

  const key = process.env.OSMU_SECRET_KEY;
  if (!key) return resultHtml("연결 실패", "OSMU_SECRET_KEY 미설정 — 토큰 암호화 불가");

  try {
    // PKCE 채널: 쿠키에서 code_verifier 꺼내기
    let codeVerifier: string | undefined;
    if (cfg.pkce) {
      const cookieStr = request.headers.get("cookie") || "";
      const cookieName = `pkce_${provider}=`;
      const match = cookieStr.split(";").map(c => c.trim()).find(c => c.startsWith(cookieName));
      if (match) {
        codeVerifier = decodeURIComponent(match.slice(cookieName.length));
      }
    }

    const tok = provider === "facebook"
      ? await exchangeFacebookCode(code, origin)
      : await exchangeCode(provider, code, origin, { codeVerifier });
    if (!tok.accessToken) return resultHtml("연결 실패", oauthErrorMessage(tok.error || "토큰 교환 실패", cfg.label).slice(0, 240));

    // api 플래그: 발행 라우터가 어느 API 경로를 써야 할지 판별하는 힌트.
    // Meta 계열은 구분자 유지, 표준 OAuth 채널은 provider 라벨 그대로.
    const apiFlag = provider === "instagram"
      ? "instagram_login"
      : provider === "threads"
      ? "threads_login"
      : provider === "facebook"
      ? "facebook_graph"
      : provider;

    // meta 구성: YouTube는 refresh_token 추가 저장(access_token 만료 시 갱신용).
    const meta: Record<string, unknown> = { userId: tok.userId ?? null, api: apiFlag, connectedAt: new Date().toISOString() };
    if (tok.refreshToken) meta.refreshToken = tok.refreshToken;

    // 테넌트별 채널 cred 저장(발행 경로 getChannelCred가 읽음). 토큰은 pgcrypto 암호화.
    await withTenant(tenantId, (sql) => sql`
      INSERT INTO integrations (tenant_id, kind, label, secret_enc, meta)
      VALUES (${tenantId}, 'channel', ${cfg.label},
              armor(pgp_sym_encrypt(${tok.accessToken}, ${key})),
              ${sql.json(meta as Parameters<typeof sql.json>[0])})
      ON CONFLICT (tenant_id, kind, label) DO UPDATE
        SET secret_enc = EXCLUDED.secret_enc, meta = EXCLUDED.meta`);

    return resultHtml(`${cfg.label} 연결 완료!`, "이 창을 닫고 대시보드로 돌아가세요.");
  } catch (e) {
    return resultHtml("연결 실패", oauthErrorMessage(e instanceof Error ? e.message : String(e), cfg.label).slice(0, 240));
  }
}
