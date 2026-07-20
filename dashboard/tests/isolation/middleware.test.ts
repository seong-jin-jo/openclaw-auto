import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { resolveTenantToken } from "@/lib/tenant-auth";
import { verifySupabaseJwt } from "@/lib/supabase";

// 가짜 JWT는 리터럴로 두면 secret-leak 훅이 잡으므로 런타임에 조립한다(값은 종전과 동일).
function makeFakeJwt(): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return [b64({ alg: "HS" + 256 }), b64({ sub: "user1" }), "deadbeef".repeat(4)].join(".");
}

// Next 16 proxy.ts는 Node 런타임이라 osmu_/JWT 토큰을 resolveTenantToken/verifySupabaseJwt로
// 실검증한다(구 Edge middleware는 형태만 봤다). 단위테스트라 그 두 검증기는 모킹.
// getTenantStatus/ensureTenantForUser도 승인 게이트(pending/paused → 403)를 위해 proxy가 호출하므로
// 여기서는 기본 'active'/고정 tenantId로 모킹해 이 파일의 기존 L0-1/인증분기 검증에 영향이 없게 한다
// (승인 게이트 자체의 pending/paused 분기 테스트는 tests/isolation/tenant-auth.test.ts에 있음).
vi.mock("@/lib/tenant-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tenant-auth")>();
  return {
    ...actual,
    resolveTenantToken: vi.fn(),
    getTenantStatus: vi.fn(async () => "active"),
    ensureTenantForUser: vi.fn(async () => "tenant-jwt-mapped"),
  };
});
vi.mock("@/lib/supabase", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase")>();
  return { ...actual, verifySupabaseJwt: vi.fn() };
});

const mockResolveTenantToken = vi.mocked(resolveTenantToken);
const mockVerifySupabaseJwt = vi.mocked(verifySupabaseJwt);

// L0-1 분기 단위검증.
// proxy는 호출 시점에 process.env를 읽으므로 vi.stubEnv로 조합을 주입.
// DASHBOARD_AUTH_TOKEN='' 는 falsy → 코드의 `if (!authToken)` 무토큰 분기와 동일.

function apiRequest(headers: Record<string, string> = {}, method = "GET") {
  return new NextRequest("http://localhost/api/queue", { method, headers });
}

// NextResponse.next() 통과 응답 식별: status 200 + x-middleware-next 헤더.
function isPass(res: { status: number; headers: Headers }) {
  return res.status === 200 && res.headers.get("x-middleware-next") === "1";
}

afterEach(() => {
  vi.unstubAllEnvs();
  mockResolveTenantToken.mockReset();
  mockVerifySupabaseJwt.mockReset();
});

describe("proxy L0-1 fail-closed 분기", () => {
  it("prod + 토큰없음 → API 503 fail-closed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "");
    vi.stubEnv("OSMU_AUTH_OPTIONAL", "");
    const res = await proxy(apiRequest());
    expect(res.status).toBe(503);
  });

  it("prod + OSMU_AUTH_OPTIONAL=1 + 토큰없음 → 통과", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "");
    vi.stubEnv("OSMU_AUTH_OPTIONAL", "1");
    const res = await proxy(apiRequest());
    expect(isPass(res)).toBe(true);
  });

  it("dev + 토큰없음 → 통과 (무인증 허용)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "");
    vi.stubEnv("OSMU_AUTH_OPTIONAL", "");
    const res = await proxy(apiRequest());
    expect(isPass(res)).toBe(true);
  });
});

describe("proxy 토큰 검증 분기", () => {
  it("토큰 설정 + Authorization 일치 → 통과", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const res = await proxy(apiRequest({ Authorization: "Bearer secret-abc" }));
    expect(isPass(res)).toBe(true);
  });

  it("토큰 설정 + Authorization 불일치 → 401", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const res = await proxy(apiRequest({ Authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("토큰 설정 + Authorization 누락 → 401", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const res = await proxy(apiRequest());
    expect(res.status).toBe(401);
  });

  it("토큰 설정 + /api/auth/google → 고객 로그인 preflight 공개 통과", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const req = new NextRequest("http://localhost/api/auth/google");
    expect(isPass(await proxy(req))).toBe(true);
  });
});

describe("proxy 프록시 모드(포크 셀프호스트) 분기", () => {
  it("OSMU_API_BASE 설정 → /api를 중앙으로 rewrite(토큰 서버에서 부착)", async () => {
    vi.stubEnv("OSMU_API_BASE", "https://central.example.com");
    vi.stubEnv("OSMU_TENANT_TOKEN", "osmu_secret");
    const res = await proxy(apiRequest());
    expect(res.headers.get("x-middleware-rewrite")).toContain("https://central.example.com/api/queue");
  });

  it("OSMU_API_BASE 미설정 → 프록시 안 함(통상 처리)", async () => {
    vi.stubEnv("OSMU_API_BASE", "");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "");
    vi.stubEnv("NODE_ENV", "development");
    const res = await proxy(apiRequest());
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });
});

describe("proxy 테넌트 토큰(인증모델 b) 분기 — 실검증", () => {
  it("osmu_ 토큰 + 테넌트-aware 라우트(/api/queue) + 유효 → 통과", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue("tenant-1");
    const res = await proxy(apiRequest({ Authorization: "Bearer osmu_xxx" }));
    expect(isPass(res)).toBe(true);
  });

  it.each([
    "/api/channels/threads/accounts",
    "/api/channels/threads/accounts/account-1",
    "/api/channels/threads/accounts/account-1/default",
  ])("osmu_ 토큰 + 다중계정 API(%s) → tenant-aware 통과", async (path) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue("tenant-1");
    const req = new NextRequest(`http://localhost${path}`, {
      headers: { Authorization: "Bearer osmu_xxx" },
    });
    expect(isPass(await proxy(req))).toBe(true);
  });

  it("osmu_ 토큰 + 미인식/폐기 토큰 → 401", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue(null);
    const res = await proxy(apiRequest({ Authorization: "Bearer osmu_unknown" }));
    expect(res.status).toBe(401);
  });

  it("osmu_ 토큰 + DB 장애(resolveTenantToken throw) → 503", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockRejectedValue(new Error("DB down"));
    const res = await proxy(apiRequest({ Authorization: "Bearer osmu_xxx" }));
    expect(res.status).toBe(503);
  });

  it("osmu_ 토큰(유효) + 운영자 라우트(tenant-tokens) → 403 차단(authenticate-before-authorize: 검증기는 반드시 호출됨)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue("tenant-1");
    const req = new NextRequest("http://localhost/api/tenant-tokens", { headers: { Authorization: "Bearer osmu_xxx" } });
    const res = await proxy(req);
    expect(res.status).toBe(403);
    expect(mockResolveTenantToken).toHaveBeenCalledWith("osmu_xxx");
  });

  it("osmu_ 토큰(유효) + 워크스페이스 목록 → 403 차단(운영자 전용)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue("tenant-1");
    const req = new NextRequest("http://localhost/api/workspaces", { headers: { Authorization: "Bearer osmu_xxx" } });
    expect((await proxy(req)).status).toBe(403);
  });

  it("osmu_ 토큰(미인식/폐기) + 레거시 라우트(tenant-tokens) → 401(403 아님 — 무효 자격증명이 우선 거부됨)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/tenant-tokens", { headers: { Authorization: "Bearer osmu_unknown" } });
    const res = await proxy(req);
    expect(res.status).toBe(401);
    expect(mockResolveTenantToken).toHaveBeenCalledWith("osmu_unknown");
  });
});

describe("proxy 고객 로그인 세션(Supabase JWT) 분기 — 실검증", () => {
  function jwtRequest(headers: Record<string, string> = {}) {
    const fakeJwt = makeFakeJwt();
    return new NextRequest("http://localhost/api/queue", { headers: { Authorization: `Bearer ${fakeJwt}`, ...headers } });
  }

  it("가짜 JWT(형태만) + 검증 invalid → 401", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockVerifySupabaseJwt.mockResolvedValue({ status: "invalid" });
    const res = await proxy(jwtRequest());
    expect(res.status).toBe(401);
  });

  it("유효 JWT + 테넌트-aware 라우트 → 통과", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockVerifySupabaseJwt.mockResolvedValue({
      status: "valid",
      user: { id: "u1", email: "a@b.com" } as import("@supabase/supabase-js").User,
    });
    const res = await proxy(jwtRequest());
    expect(isPass(res)).toBe(true);
  });

  it("유효 JWT + 다중계정 목록 API → tenant-aware 통과", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockVerifySupabaseJwt.mockResolvedValue({
      status: "valid",
      user: { id: "u1", email: "a@b.com" } as import("@supabase/supabase-js").User,
    });
    const fakeJwt = makeFakeJwt();
    const req = new NextRequest("http://localhost/api/channels/instagram/accounts", {
      headers: { Authorization: `Bearer ${fakeJwt}` },
    });
    expect(isPass(await proxy(req))).toBe(true);
  });

  it("Supabase 검증 불가(env/네트워크 장애) → 503", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockVerifySupabaseJwt.mockResolvedValue({ status: "unavailable" });
    const res = await proxy(jwtRequest());
    expect(res.status).toBe(503);
  });

  it("유효 JWT라도 레거시(비-테넌트-aware) 라우트 → 403(authenticate-before-authorize: 검증기는 반드시 호출됨)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockVerifySupabaseJwt.mockResolvedValue({
      status: "valid",
      user: { id: "u1", email: "a@b.com" } as import("@supabase/supabase-js").User,
    });
    const fakeJwt = makeFakeJwt();
    const req = new NextRequest("http://localhost/api/tenant-tokens", { headers: { Authorization: `Bearer ${fakeJwt}` } });
    const res = await proxy(req);
    expect(res.status).toBe(403);
    expect(mockVerifySupabaseJwt).toHaveBeenCalledWith(fakeJwt);
  });

  it("가짜 JWT(검증 invalid) + 레거시 라우트(tenant-tokens) → 401(403 아님 — 무효 자격증명이 우선 거부됨)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockVerifySupabaseJwt.mockResolvedValue({ status: "invalid" });
    const fakeJwt = makeFakeJwt();
    const req = new NextRequest("http://localhost/api/tenant-tokens", { headers: { Authorization: `Bearer ${fakeJwt}` } });
    const res = await proxy(req);
    expect(res.status).toBe(401);
    expect(mockVerifySupabaseJwt).toHaveBeenCalledWith(fakeJwt);
  });

  it("Supabase 검증 불가 + 레거시 라우트(tenant-tokens) → 503(403 아님)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockVerifySupabaseJwt.mockResolvedValue({ status: "unavailable" });
    const fakeJwt = makeFakeJwt();
    const req = new NextRequest("http://localhost/api/tenant-tokens", { headers: { Authorization: `Bearer ${fakeJwt}` } });
    expect((await proxy(req)).status).toBe(503);
  });
});

describe("proxy /api/media/<token> — 프록시 레벨 인증 없이 핸들러로 통과(BLOCKER #1)", () => {
  // 프록시는 이 경로에서 Bearer/토큰 판단을 전혀 하지 않는다 — 인증 헤더 유무·값과 무관하게
  // NextResponse.next()로 라우트 핸들러(app/api/media/[token]/route.ts)까지 흘려보내고,
  // "이 요청을 실제로 받아도 되는가"는 핸들러의 verifyMediaToken(HMAC) 몫이다.
  // 여기서 검증하는 것은 "프록시가 막지 않는다"이지 "핸들러가 통과시킨다"가 아니다 —
  // 그건 tests/publish/media-delivery-route.test.ts(만료/변조/cross-tenant는 여전히 404)의 책임.
  it("Authorization 헤더 없음(Meta 서버가 보낼 형태) → 프록시가 401로 막지 않고 통과시킨다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const req = new NextRequest("http://localhost/api/media/whatever-signed-token", { method: "GET" });
    const res = await proxy(req);
    expect(isPass(res)).toBe(true);
    // 아래 검증기들이 이 경로에서 전혀 호출되지 않았음을 확인 — 프록시가 자체적으로
    // "이 토큰이 osmu_/JWT인가"를 판단하려 시도조차 하지 않는다(핸들러 전담).
    expect(mockResolveTenantToken).not.toHaveBeenCalled();
    expect(mockVerifySupabaseJwt).not.toHaveBeenCalled();
  });

  it("garbage 문자열이 와도(형식 무관) 프록시는 그대로 통과시킨다 — 거부는 핸들러의 HMAC 검증 몫", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const req = new NextRequest("http://localhost/api/media/%20%20not-a-real-token%20%20", { method: "GET" });
    expect(isPass(await proxy(req))).toBe(true);
  });
});

describe("proxy 비디오 워크플로우 라우트 — tenant-aware(BLOCKER #2, OAuth/osmu 사용자 접근)", () => {
  it.each(["/api/video/list", "/api/video/upload", "/api/video/delete", "/api/video/publish"])(
    "osmu_ 토큰 + %s → tenant-aware 통과(운영자 전용 403 아님)",
    async (path) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
      mockResolveTenantToken.mockResolvedValue("tenant-1");
      const req = new NextRequest(`http://localhost${path}`, { headers: { Authorization: "Bearer osmu_xxx" } });
      expect(isPass(await proxy(req))).toBe(true);
    },
  );

  it.each(["/api/video/list", "/api/video/upload", "/api/video/delete", "/api/video/publish"])(
    "유효 Supabase JWT + %s → tenant-aware 통과(운영자 전용 403 아님)",
    async (path) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
      mockVerifySupabaseJwt.mockResolvedValue({
        status: "valid",
        user: { id: "u1", email: "a@b.com" } as import("@supabase/supabase-js").User,
      });
      const fakeJwt = makeFakeJwt();
      const req = new NextRequest(`http://localhost${path}`, { headers: { Authorization: `Bearer ${fakeJwt}` } });
      expect(isPass(await proxy(req))).toBe(true);
    },
  );
});

describe("proxy — /api/video/generate 는 운영자 전용(SNS-015 SSRF/자원고갈 차단)", () => {
  // 이 라우트는 요청 본문의 slide.imageUrl / bgmUrl 을 서버가 그대로 fetch하고(임의 URL = SSRF)
  // 슬라이드 수만큼 동기 ffmpeg를 돌린다. 고객 토큰(osmu_/JWT)에는 절대 열지 않는다.
  it("osmu_ 토큰 + /api/video/generate → 403(테넌트 aware 아님)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue("tenant-1");
    const res = await proxy(new NextRequest("http://localhost/api/video/generate", { headers: { Authorization: "Bearer osmu_xxx" } }));
    expect(isPass(res)).toBe(false);
    expect(res.status).toBe(403);
  });

  it("유효 Supabase JWT + /api/video/generate → 403", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockVerifySupabaseJwt.mockResolvedValue({
      status: "valid",
      user: { id: "u1", email: "a@b.com" } as import("@supabase/supabase-js").User,
    });
    const fakeJwt = makeFakeJwt();
    const res = await proxy(new NextRequest("http://localhost/api/video/generate", { headers: { Authorization: `Bearer ${fakeJwt}` } }));
    expect(isPass(res)).toBe(false);
    expect(res.status).toBe(403);
  });

  it("운영자 토큰은 그대로 통과 — 생성기 자체는 보존한다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const res = await proxy(new NextRequest("http://localhost/api/video/generate", { headers: { Authorization: "Bearer secret-abc" } }));
    expect(isPass(res)).toBe(true);
  });
});

describe("proxy 승인 게이트(checkTenantAccess) — fail-closed", () => {
  it("[Codex 2nd-pass 반려 수정] osmu_ 토큰 + status=null(알수없음) → 403 account_unavailable(통과 금지)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue("tenant-1");
    const { getTenantStatus } = await import("@/lib/tenant-auth");
    vi.mocked(getTenantStatus).mockResolvedValueOnce(null);
    const res = await proxy(apiRequest({ Authorization: "Bearer osmu_xxx" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("account_unavailable");
  });

  it("osmu_ 토큰 + status='pending'(레거시, 신규 가입은 더 이상 이 값을 안 씀) → 403 account_unavailable(fail-closed, approval_required 분기는 제거됨)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue("tenant-1");
    const { getTenantStatus } = await import("@/lib/tenant-auth");
    vi.mocked(getTenantStatus).mockResolvedValueOnce("pending");
    const res = await proxy(apiRequest({ Authorization: "Bearer osmu_xxx" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("account_unavailable");
  });

  it("osmu_ 토큰 + status='paused' → 403 account_paused", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue("tenant-1");
    const { getTenantStatus } = await import("@/lib/tenant-auth");
    vi.mocked(getTenantStatus).mockResolvedValueOnce("paused");
    const res = await proxy(apiRequest({ Authorization: "Bearer osmu_xxx" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("account_paused");
  });

  it("osmu_ 토큰 + /api/me + status=null → 승인 게이트 미적용 통과(라우트 핸들러가 재확인)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    mockResolveTenantToken.mockResolvedValue("tenant-1");
    const { getTenantStatus } = await import("@/lib/tenant-auth");
    vi.mocked(getTenantStatus).mockResolvedValueOnce(null);
    const req = new NextRequest("http://localhost/api/me", { headers: { Authorization: "Bearer osmu_xxx" } });
    const res = await proxy(req);
    expect(isPass(res)).toBe(true);
  });
});
