import { oauthErrorMessage } from "@/lib/oauth-errors";
import { publicOrigin } from "@/lib/social-connect";

function supabaseBase(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
}

function safeRedirectTo(request: Request): string {
  const origin = publicOrigin(request);
  const raw = new URL(request.url).searchParams.get("redirect_to");
  if (!raw) return `${origin}/login`;
  try {
    const url = new URL(raw);
    if (url.origin !== origin) return `${origin}/login`;
    return url.href;
  } catch {
    return `${origin}/login`;
  }
}

export async function GET(request: Request) {
  const base = supabaseBase();
  if (!base) {
    // 설정이 없는 것은 서버 고장이 아니라 아직 준비되지 않은 상태다.
    // 500 으로 답하면 감시 도구가 영원히 장애로 읽는다.
    return Response.json({ error: oauthErrorMessage("supabaseUrl is required", "Google") }, { status: 503 });
  }

  const redirectTo = safeRedirectTo(request);
  const authUrl = new URL(`${base}/auth/v1/authorize`);
  authUrl.searchParams.set("provider", "google");
  authUrl.searchParams.set("redirect_to", redirectTo);
  // Supabase forwards provider query params to Google. Always show Google's account chooser so
  // signing out of OSMU and returning does not silently reuse the browser's previous Google user.
  authUrl.searchParams.set("prompt", "select_account");

  try {
    // Supabase provider disabled 상태는 브라우저가 Supabase JSON 페이지로 이동하기 전에 서버에서 잡는다.
    const res = await fetch(authUrl.href, { redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      return Response.json({ authUrl: authUrl.href });
    }

    const text = await res.text();
    if (!res.ok) {
      return Response.json({ error: oauthErrorMessage(text || `HTTP ${res.status}`, "Google") }, { status: 400 });
    }

    return Response.json({ authUrl: authUrl.href });
  } catch (e) {
    return Response.json({
      error: oauthErrorMessage(e instanceof Error ? e.message : String(e), "Google"),
    }, { status: 502 });
  }
}
