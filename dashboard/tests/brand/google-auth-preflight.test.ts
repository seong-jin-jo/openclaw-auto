import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const H = vi.hoisted(() => ({
  fetchStatus: 302,
  fetchBody: "",
  fetchUrl: "",
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  H.fetchStatus = 302;
  H.fetchBody = "";
  H.fetchUrl = "";
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    H.fetchUrl = String(url);
    return new Response(H.fetchBody, { status: H.fetchStatus });
  }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/auth/google", () => {
  it("Supabase Google provider disabled raw JSON을 앱 에러로 변환한다", async () => {
    H.fetchStatus = 400;
    H.fetchBody = '{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}';
    const { GET } = await import("@/app/api/auth/google/route");
    const res = await GET(new Request("https://app.example/api/auth/google?redirect_to=https%3A%2F%2Fapp.example%2Flogin"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Google 로그인이 아직 설정되지 않았습니다");
    expect(body.error).not.toContain("Unsupported provider");
  });

  it("provider가 활성화되어 Supabase가 redirect를 주면 authUrl을 반환한다", async () => {
    H.fetchStatus = 302;
    const { GET } = await import("@/app/api/auth/google/route");
    const res = await GET(new Request("https://app.example/api/auth/google?redirect_to=https%3A%2F%2Fapp.example%2Flogin"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.authUrl).toContain("https://example.supabase.co/auth/v1/authorize");
    expect(body.authUrl).toContain("provider=google");
    expect(H.fetchUrl).toContain("redirect_to=https%3A%2F%2Fapp.example%2Flogin");
  });
});
