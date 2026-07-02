import { withTenant } from "@/lib/db";
import { getProvider, exchangeCode, exchangeFacebookCode, publicOrigin } from "@/lib/social-connect";

// GET /api/connect/{provider}/callback?code=...&state=<tenantId>
// provider OAuth 리다이렉트(인증 없음 — middleware 공개). state로 테넌트 식별 → code를 토큰 교환 →
// integrations(kind='channel', label=provider)에 암호화 저장. 비번은 우리를 거치지 않음(ADR-004).
function resultHtml(title: string, sub: string): Response {
  const html = `<html><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
    <div style="text-align:center"><h2>${title}</h2><p style="color:#888">${sub}</p>
    <script>setTimeout(()=>window.close(),2500)</script></div></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const { searchParams } = new URL(request.url);
  // 토큰 교환의 redirect_uri도 auth-url과 동일한 공개 origin이어야 한다(Meta가 일치 검증).
  const origin = publicOrigin(request);
  const code = searchParams.get("code") || "";
  const tenantId = searchParams.get("state") || ""; // auth-url에서 state=tenantId로 넣음
  const err = searchParams.get("error_description") || searchParams.get("error");

  const cfg = getProvider(provider);
  if (!cfg) return resultHtml("연결 실패", `지원하지 않는 provider: ${provider}`);
  if (err) return resultHtml("연결 취소됨", String(err).slice(0, 120));
  if (!code || !tenantId) return resultHtml("연결 실패", "code/state 누락");

  const key = process.env.OSMU_SECRET_KEY;
  if (!key) return resultHtml("연결 실패", "OSMU_SECRET_KEY 미설정 — 토큰 암호화 불가");

  try {
    const tok = provider === "facebook"
      ? await exchangeFacebookCode(code, origin)
      : await exchangeCode(provider, code, origin);
    if (!tok.accessToken) return resultHtml("연결 실패", tok.error || "토큰 교환 실패");

    // 테넌트별 채널 cred 저장(발행 경로 getChannelCred가 읽음). 토큰은 pgcrypto 암호화.
    await withTenant(tenantId, (sql) => sql`
      INSERT INTO integrations (tenant_id, kind, label, secret_enc, meta)
      VALUES (${tenantId}, 'channel', ${cfg.label},
              armor(pgp_sym_encrypt(${tok.accessToken}, ${key})),
              ${sql.json({ userId: tok.userId ?? null, connectedAt: null } as Parameters<typeof sql.json>[0])})
      ON CONFLICT (tenant_id, kind, label) DO UPDATE
        SET secret_enc = EXCLUDED.secret_enc, meta = EXCLUDED.meta`);

    return resultHtml(`${cfg.label} 연결 완료!`, "이 창을 닫고 대시보드로 돌아가세요.");
  } catch (e) {
    return resultHtml("연결 실패", (e instanceof Error ? e.message : String(e)).slice(0, 120));
  }
}
