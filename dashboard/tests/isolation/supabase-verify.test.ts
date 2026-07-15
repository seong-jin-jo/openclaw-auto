import { describe, it, expect, afterEach, vi } from "vitest";

// verifySupabaseJwt tri-state 회귀. 2nd self-review에서 발견한 실결함:
// AuthRetryableFetchError(네트워크/DNS/연결거부로 fetch 자체가 실패)는 auth-js가
// throw가 아니라 { error, status: 0 } 형태로 반환한다(node_modules/@supabase/auth-js
// dist/main/lib/fetch.js: `new AuthRetryableFetchError(_getErrorMessage(error), 0)`,
// GoTrueClient._getUser가 AuthError를 catch해 { data:{user:null}, error }로 반환하며 rethrow 안 함).
// status>=500만 unavailable로 보는 구현은 status:0을 "invalid"(401)로 오분류해 Supabase
// 장애 시 정상 고객까지 위조 취급하는 스펙 위반이었다 — isAuthRetryableFetchError로 수정.

const H = vi.hoisted(() => ({
  getUserImpl: async (_jwt: string): Promise<{ data: { user: unknown }; error: unknown }> => ({
    data: { user: null },
    error: null,
  }),
}));

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  return {
    ...actual,
    createClient: vi.fn(() => ({ auth: { getUser: (jwt: string) => H.getUserImpl(jwt) } })),
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadVerify() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  const mod = await import("@/lib/supabase");
  return mod.verifySupabaseJwt;
}

describe("verifySupabaseJwt tri-state", () => {
  it("빈 토큰 → invalid", async () => {
    const verify = await loadVerify();
    expect(await verify("")).toEqual({ status: "invalid" });
  });

  it("env 미설정(URL/ANON 없음) → unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.resetModules();
    const mod = await import("@/lib/supabase");
    expect(await mod.verifySupabaseJwt("some.jwt.token")).toEqual({ status: "unavailable" });
  });

  it("정상 서명검증 통과 → valid + user", async () => {
    H.getUserImpl = async () => ({ data: { user: { id: "u1" } }, error: null });
    const verify = await loadVerify();
    expect(await verify("good.jwt.token")).toEqual({ status: "valid", user: { id: "u1" } });
  });

  it("AuthApiError 401(위조·만료) → invalid", async () => {
    const { AuthApiError } = await import("@supabase/supabase-js");
    H.getUserImpl = async () => ({ data: { user: null }, error: new AuthApiError("bad jwt", 401, "bad_jwt") });
    const verify = await loadVerify();
    expect(await verify("bad.jwt.token")).toEqual({ status: "invalid" });
  });

  it("AuthApiError 5xx(Supabase 서비스 장애) → unavailable", async () => {
    const { AuthApiError } = await import("@supabase/supabase-js");
    H.getUserImpl = async () => ({ data: { user: null }, error: new AuthApiError("service down", 503, undefined) });
    const verify = await loadVerify();
    expect(await verify("any.jwt.token")).toEqual({ status: "unavailable" });
  });

  it("AuthRetryableFetchError status:0(DNS/연결거부/타임아웃) → unavailable, invalid 아님 [회귀]", async () => {
    const { AuthRetryableFetchError } = await import("@supabase/supabase-js");
    H.getUserImpl = async () => ({ data: { user: null }, error: new AuthRetryableFetchError("fetch failed", 0) });
    const verify = await loadVerify();
    expect(await verify("any.jwt.token")).toEqual({ status: "unavailable" });
  });

  it("getUser 호출 자체가 throw(예상외 예외) → unavailable", async () => {
    H.getUserImpl = async () => {
      throw new Error("unexpected");
    };
    const verify = await loadVerify();
    expect(await verify("any.jwt.token")).toEqual({ status: "unavailable" });
  });
});
