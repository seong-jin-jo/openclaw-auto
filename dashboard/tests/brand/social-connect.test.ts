import { describe, it, expect, beforeEach, vi } from "vitest";

// (B) 소셜 OAuth "연결" E2E — 고객이 비번 없이 버튼만 → 우리가 토큰 받아 테넌트별 저장(ADR-004).
// auth-url 구성 + callback 토큰교환·integrations 저장 분기를 박제. 라이브 OAuth는 Meta 앱 redirect URI
// 등록 + 배포 필요(미검증으로 명시) — 여기선 로직/저장 계약을 mock으로 검증.

const H = vi.hoisted(() => ({
  tenantId: "tenant-1" as string | null,
  inserts: [] as unknown[][],
  fetchSeq: [] as Array<{ status: number; body: unknown }>,
  fetchCalls: [] as string[],
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async (_r: Request, fb?: string | null) => H.tenantId ?? fb ?? null),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_t: string, cb: (sql: unknown) => unknown) => {
    const sql = Object.assign(
      (_s: TemplateStringsArray, ...vals: unknown[]) => { H.inserts.push(vals); return Promise.resolve([]); },
      { json: (v: unknown) => v },
    );
    return cb(sql);
  }),
}));

function params(provider: string) { return { params: Promise.resolve({ provider }) }; }

beforeEach(() => {
  vi.resetModules();
  H.tenantId = "tenant-1";
  H.inserts = [];
  H.fetchCalls = [];
  H.fetchSeq = [
    { status: 200, body: { access_token: "SHORT", user_id: 17841400000000001 } }, // 단기
    { status: 200, body: { access_token: "LONGLIVED60D" } },                       // 장기
  ];
  process.env.IG_APP_ID = "ig-app-123";
  process.env.IG_APP_SECRET = "ig-secret";
  process.env.THREADS_APP_ID = "th-app-456";
  process.env.THREADS_APP_SECRET = "th-secret";
  process.env.OSMU_SECRET_KEY = "enc-key";
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    H.fetchCalls.push(String(url));
    const n = H.fetchSeq.shift() || { status: 200, body: {} };
    return new Response(JSON.stringify(n.body), { status: n.status });
  }));
});

describe("GET /api/connect/instagram — OAuth 동의 URL", () => {
  it("authUrl에 client_id·redirect_uri·scope·state(tenant) 포함", async () => {
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/instagram?tenant_id=tenant-1"), params("instagram"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.authUrl).toContain("instagram.com/oauth/authorize");
    expect(body.authUrl).toContain("client_id=ig-app-123");
    expect(body.authUrl).toContain("instagram_business_content_publish");
    expect(body.authUrl).toContain("state=tenant-1");
    expect(body.authUrl).toContain("api%2Fconnect%2Finstagram%2Fcallback");
  });

  // 리버스 프록시 뒤 "Invalid redirect_uri" 회귀 방지(2026-07-03 실측: request.url이 0.0.0.0:PORT).
  it("OSMU_PUBLIC_URL 설정 시 redirect_uri가 내부 request host가 아닌 공개 URL을 쓴다", async () => {
    process.env.OSMU_PUBLIC_URL = "https://live.example";
    const { GET } = await import("@/app/api/connect/[provider]/route");
    // request.url은 내부 bind처럼 0.0.0.0:18789 — 여기 새면 Meta 등록값과 불일치.
    const res = await GET(new Request("http://0.0.0.0:18789/api/connect/instagram?tenant_id=tenant-1"), params("instagram"));
    const body = await res.json();
    expect(body.authUrl).toContain(encodeURIComponent("https://live.example/api/connect/instagram/callback"));
    expect(body.authUrl).not.toContain("0.0.0.0");
    delete process.env.OSMU_PUBLIC_URL;
  });

  it("OSMU_PUBLIC_URL 없으면 x-forwarded-host/proto로 공개 origin 복원", async () => {
    delete process.env.OSMU_PUBLIC_URL;
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const req = new Request("http://0.0.0.0:18789/api/connect/instagram?tenant_id=tenant-1", {
      headers: { "x-forwarded-host": "live.example", "x-forwarded-proto": "https" },
    });
    const res = await GET(req, params("instagram"));
    const body = await res.json();
    expect(body.authUrl).toContain(encodeURIComponent("https://live.example/api/connect/instagram/callback"));
    expect(body.authUrl).not.toContain("0.0.0.0");
  });

  it("지원하지 않는 provider → 400", async () => {
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/myspace?tenant_id=tenant-1"), params("myspace"));
    expect(res.status).toBe(400);
  });

  it("IG_APP_ID 미설정 → 500", async () => {
    delete process.env.IG_APP_ID;
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/instagram?tenant_id=tenant-1"), params("instagram"));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/connect/instagram/callback — 토큰교환·저장", () => {
  it("code+state → 단기→장기 토큰 교환 후 integrations에 저장", async () => {
    const { GET } = await import("@/app/api/connect/[provider]/callback/route");
    const res = await GET(
      new Request("https://app.example/api/connect/instagram/callback?code=AUTHCODE&state=tenant-1"),
      params("instagram"),
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/연결 완료/);
    // 단기+장기 두 번 호출
    expect(H.fetchCalls.length).toBe(2);
    expect(H.fetchCalls[0]).toContain("api.instagram.com/oauth/access_token");
    expect(H.fetchCalls[1]).toContain("graph.instagram.com/access_token");
    // 장기토큰이 저장됨(단기 아님)
    expect(H.inserts).toHaveLength(1);
    expect(JSON.stringify(H.inserts[0])).toContain("LONGLIVED60D");
  });

  it("threads — graph.threads.net로 교환 후 저장(같은 코드 경로)", async () => {
    const { GET } = await import("@/app/api/connect/[provider]/callback/route");
    const res = await GET(
      new Request("https://app.example/api/connect/threads/callback?code=THCODE&state=tenant-1"),
      params("threads"),
    );
    expect(res.status).toBe(200);
    expect(H.fetchCalls[0]).toContain("graph.threads.net/oauth/access_token");
    expect(H.fetchCalls[1]).toContain("graph.threads.net/access_token");
    expect(JSON.stringify(H.inserts[0])).toContain("threads");
  });

  it("facebook — user→장기→/me/accounts 페이지 토큰 저장", async () => {
    H.fetchSeq = [
      { status: 200, body: { access_token: "FB_USER" } },               // user token
      { status: 200, body: { access_token: "FB_USER_LONG" } },          // 장기 user
      { status: 200, body: { data: [{ access_token: "PAGE_TOKEN", id: "990011" }] } }, // pages
    ];
    process.env.FB_APP_ID = "fb-app";
    process.env.FB_APP_SECRET = "fb-secret";
    const { GET } = await import("@/app/api/connect/[provider]/callback/route");
    const res = await GET(
      new Request("https://app.example/api/connect/facebook/callback?code=FBCODE&state=tenant-1"),
      params("facebook"),
    );
    expect(res.status).toBe(200);
    expect(H.fetchCalls[2]).toContain("/me/accounts");
    // 페이지 토큰이 저장됨(user 토큰 아님)
    expect(JSON.stringify(H.inserts[0])).toContain("PAGE_TOKEN");
    expect(JSON.stringify(H.inserts[0])).toContain("990011");
  });

  it("state(tenant) 누락 → 저장 안 함", async () => {
    const { GET } = await import("@/app/api/connect/[provider]/callback/route");
    const res = await GET(
      new Request("https://app.example/api/connect/instagram/callback?code=AUTHCODE"),
      params("instagram"),
    );
    const html = await res.text();
    expect(html).toMatch(/연결 실패/);
    expect(H.inserts).toHaveLength(0);
  });
});

// 비즈니스용 Facebook 로그인(Facebook Login for Business) = authorize에 scope 대신 config_id.
// 근거: developers.facebook.com/documentation/facebook-login/facebook-login-for-business
describe("Facebook Login for Business — config_id authorize URL", () => {
  it("buildAuthUrl(facebook)는 scope가 아니라 config_id를 넣는다", async () => {
    process.env.FB_APP_ID = "fb-app-1";
    process.env.FB_CONFIG_ID = "cfg-777";
    const { buildAuthUrl, getProvider } = await import("@/lib/social-connect");
    const cfg = getProvider("facebook")!;
    const url = buildAuthUrl(cfg, "https://live.example", "facebook", "tenant-1")!;
    expect(url).toContain("facebook.com/v21.0/dialog/oauth");
    expect(url).toContain("config_id=cfg-777");
    expect(url).toContain("response_type=code");
    expect(url).toContain("state=tenant-1");
    expect(url).toContain(encodeURIComponent("https://live.example/api/connect/facebook/callback"));
    // config_id 모델은 scope를 보내지 않는다
    expect(url).not.toContain("scope=");
    expect(url).not.toContain("pages_manage_posts");
    delete process.env.FB_CONFIG_ID;
  });

  it("FB_CONFIG_ID 없으면 buildAuthUrl(facebook)=null", async () => {
    process.env.FB_APP_ID = "fb-app-1";
    delete process.env.FB_CONFIG_ID;
    const { buildAuthUrl, getProvider } = await import("@/lib/social-connect");
    const cfg = getProvider("facebook")!;
    expect(buildAuthUrl(cfg, "https://live.example", "facebook", "tenant-1")).toBeNull();
  });

  it("GET /api/connect/facebook — FB_CONFIG_ID 미설정 시 500 + 안내 메시지", async () => {
    process.env.FB_APP_ID = "fb-app-1";
    delete process.env.FB_CONFIG_ID;
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/facebook?tenant_id=tenant-1"), params("facebook"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("FB_CONFIG_ID");
  });

  it("GET /api/connect/facebook — config_id 설정 시 authUrl 반환", async () => {
    process.env.FB_APP_ID = "fb-app-1";
    process.env.FB_CONFIG_ID = "cfg-777";
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/facebook?tenant_id=tenant-1"), params("facebook"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authUrl).toContain("config_id=cfg-777");
    expect(body.authUrl).not.toContain("scope=");
    delete process.env.FB_CONFIG_ID;
  });
});

// ── 새 채널 — OAuth authUrl 구조 검증 ──────────────────────────────────────

describe("GET /api/connect/linkedin — authUrl", () => {
  it("scope·state·redirect_uri 포함, space 구분자", async () => {
    process.env.LINKEDIN_CLIENT_ID = "li-client";
    process.env.LINKEDIN_CLIENT_SECRET = "li-secret";
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/linkedin?tenant_id=tenant-1"), params("linkedin"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.authUrl).toContain("linkedin.com/oauth/v2/authorization");
    expect(body.authUrl).toContain("state=tenant-1");
    // space-separated scopes
    expect(body.authUrl).toContain("w_member_social");
    expect(body.authUrl).toContain("openid");
    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;
  });

  it("LINKEDIN_CLIENT_ID 미설정 → 500", async () => {
    delete process.env.LINKEDIN_CLIENT_ID;
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/linkedin?tenant_id=tenant-1"), params("linkedin"));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/connect/youtube — access_type=offline", () => {
  it("access_type=offline·prompt=consent 포함(refresh_token 취득용)", async () => {
    process.env.YOUTUBE_CLIENT_ID = "yt-client";
    process.env.YOUTUBE_CLIENT_SECRET = "yt-secret";
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/youtube?tenant_id=tenant-1"), params("youtube"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.authUrl).toContain("accounts.google.com/o/oauth2/v2/auth");
    expect(body.authUrl).toContain("access_type=offline");
    expect(body.authUrl).toContain("prompt=consent");
    expect(body.authUrl).toContain("youtube.upload");
    delete process.env.YOUTUBE_CLIENT_ID;
    delete process.env.YOUTUBE_CLIENT_SECRET;
  });

  it("YOUTUBE_CLIENT_ID 미설정 → 500", async () => {
    delete process.env.YOUTUBE_CLIENT_ID;
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/youtube?tenant_id=tenant-1"), params("youtube"));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/connect/naver_blog — authUrl", () => {
  it("naver 인증 URL 반환", async () => {
    process.env.NAVER_CLIENT_ID = "nv-id";
    process.env.NAVER_CLIENT_SECRET = "nv-secret";
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/naver_blog?tenant_id=tenant-1"), params("naver_blog"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.authUrl).toContain("nid.naver.com/oauth2.0/authorize");
    delete process.env.NAVER_CLIENT_ID;
    delete process.env.NAVER_CLIENT_SECRET;
  });
});

// ── PKCE 채널 — X·TikTok ────────────────────────────────────────────────────

describe("GET /api/connect/x — PKCE", () => {
  it("authUrl에 code_challenge·code_challenge_method=S256 포함", async () => {
    process.env.X_CLIENT_ID = "x-client-123";
    process.env.X_CLIENT_SECRET = "x-secret";
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/x?tenant_id=tenant-1"), params("x"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.authUrl).toContain("twitter.com/i/oauth2/authorize");
    expect(body.authUrl).toContain("code_challenge=");
    expect(body.authUrl).toContain("code_challenge_method=S256");
    expect(body.authUrl).toContain("state=tenant-1");
    // X scopes: space-separated
    expect(body.authUrl).toContain("tweet.read");
    delete process.env.X_CLIENT_ID;
    delete process.env.X_CLIENT_SECRET;
  });

  it("응답 Set-Cookie 헤더에 pkce_x 쿠키 포함(httpOnly)", async () => {
    process.env.X_CLIENT_ID = "x-client-123";
    process.env.X_CLIENT_SECRET = "x-secret";
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/x?tenant_id=tenant-1"), params("x"));
    const cookie = res.headers.get("set-cookie") || "";
    expect(cookie).toMatch(/pkce_x=/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Max-Age=600");
    delete process.env.X_CLIENT_ID;
    delete process.env.X_CLIENT_SECRET;
  });

  it("X_CLIENT_ID 미설정 → 500", async () => {
    delete process.env.X_CLIENT_ID;
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/x?tenant_id=tenant-1"), params("x"));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/connect/tiktok — PKCE", () => {
  it("authUrl에 code_challenge 포함, Set-Cookie에 pkce_tiktok", async () => {
    process.env.TIKTOK_CLIENT_KEY = "tt-key";
    process.env.TIKTOK_CLIENT_SECRET = "tt-secret";
    const { GET } = await import("@/app/api/connect/[provider]/route");
    const res = await GET(new Request("https://app.example/api/connect/tiktok?tenant_id=tenant-1"), params("tiktok"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.authUrl).toContain("tiktok.com");
    expect(body.authUrl).toContain("code_challenge=");
    const cookie = res.headers.get("set-cookie") || "";
    expect(cookie).toMatch(/pkce_tiktok=/);
    delete process.env.TIKTOK_CLIENT_KEY;
    delete process.env.TIKTOK_CLIENT_SECRET;
  });
});

// ── exchangeCode — 표준 OAuth 채널 단위 테스트 ──────────────────────────────

describe("exchangeCode — PKCE (code_verifier POST body 포함)", () => {
  it("options.codeVerifier가 POST body에 code_verifier로 포함됨", async () => {
    process.env.X_CLIENT_ID = "x-client-id";
    process.env.X_CLIENT_SECRET = "x-secret";
    let capturedBody = "";
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      capturedBody = (init?.body as string) || "";
      return new Response(JSON.stringify({ access_token: "X_ACCESS_TOKEN" }), { status: 200 });
    }));
    const { exchangeCode } = await import("@/lib/social-connect");
    const result = await exchangeCode("x", "XCODE", "https://app.example", { codeVerifier: "MY_VERIFIER_VALUE" });
    expect(result.accessToken).toBe("X_ACCESS_TOKEN");
    expect(capturedBody).toContain("code_verifier=MY_VERIFIER_VALUE");
    delete process.env.X_CLIENT_ID;
    delete process.env.X_CLIENT_SECRET;
  });

  it("codeVerifier 없으면 code_verifier body에 포함 안 됨(비PKCE 채널 정합)", async () => {
    process.env.LINKEDIN_CLIENT_ID = "li-id";
    process.env.LINKEDIN_CLIENT_SECRET = "li-secret";
    let capturedBody = "";
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      capturedBody = (init?.body as string) || "";
      return new Response(JSON.stringify({ access_token: "LI_TOKEN" }), { status: 200 });
    }));
    const { exchangeCode } = await import("@/lib/social-connect");
    const result = await exchangeCode("linkedin", "LICODE", "https://app.example");
    expect(result.accessToken).toBe("LI_TOKEN");
    expect(capturedBody).not.toContain("code_verifier");
    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;
  });
});

describe("exchangeCode — YouTube refresh_token", () => {
  it("응답의 refresh_token을 ExchangedToken.refreshToken으로 반환", async () => {
    process.env.YOUTUBE_CLIENT_ID = "yt-client";
    process.env.YOUTUBE_CLIENT_SECRET = "yt-secret";
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ access_token: "YT_ACCESS", refresh_token: "YT_REFRESH" }), { status: 200 }),
    ));
    const { exchangeCode } = await import("@/lib/social-connect");
    const result = await exchangeCode("youtube", "YTCODE", "https://app.example");
    expect(result.accessToken).toBe("YT_ACCESS");
    expect(result.refreshToken).toBe("YT_REFRESH");
    delete process.env.YOUTUBE_CLIENT_ID;
    delete process.env.YOUTUBE_CLIENT_SECRET;
  });

  it("refresh_token 없으면 refreshToken=undefined", async () => {
    process.env.YOUTUBE_CLIENT_ID = "yt-client";
    process.env.YOUTUBE_CLIENT_SECRET = "yt-secret";
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ access_token: "YT_ACCESS_ONLY" }), { status: 200 }),
    ));
    const { exchangeCode } = await import("@/lib/social-connect");
    const result = await exchangeCode("youtube", "YTCODE", "https://app.example");
    expect(result.accessToken).toBe("YT_ACCESS_ONLY");
    expect(result.refreshToken).toBeUndefined();
    delete process.env.YOUTUBE_CLIENT_ID;
    delete process.env.YOUTUBE_CLIENT_SECRET;
  });
});

describe("exchangeCode — Slack authed_user.access_token fallback", () => {
  it("top-level access_token 우선", async () => {
    process.env.SLACK_CLIENT_ID = "sl-id";
    process.env.SLACK_CLIENT_SECRET = "sl-secret";
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ access_token: "SLACK_BOT_TOKEN" }), { status: 200 }),
    ));
    const { exchangeCode } = await import("@/lib/social-connect");
    const result = await exchangeCode("slack", "SLCODE", "https://app.example");
    expect(result.accessToken).toBe("SLACK_BOT_TOKEN");
    delete process.env.SLACK_CLIENT_ID;
    delete process.env.SLACK_CLIENT_SECRET;
  });

  it("top-level 없으면 authed_user.access_token fallback", async () => {
    process.env.SLACK_CLIENT_ID = "sl-id";
    process.env.SLACK_CLIENT_SECRET = "sl-secret";
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ authed_user: { access_token: "SLACK_USER_TOKEN" } }), { status: 200 }),
    ));
    const { exchangeCode } = await import("@/lib/social-connect");
    const result = await exchangeCode("slack", "SLCODE", "https://app.example");
    expect(result.accessToken).toBe("SLACK_USER_TOKEN");
    delete process.env.SLACK_CLIENT_ID;
    delete process.env.SLACK_CLIENT_SECRET;
  });

  it("SLACK_CLIENT_ID 미설정 → error 반환", async () => {
    delete process.env.SLACK_CLIENT_ID;
    const { exchangeCode } = await import("@/lib/social-connect");
    const result = await exchangeCode("slack", "SLCODE", "https://app.example");
    expect(result.accessToken).toBe("");
    expect(result.error).toContain("SLACK_CLIENT_ID");
    delete process.env.SLACK_CLIENT_SECRET;
  });
});

// ── callback route — 새 채널 저장 검증 ─────────────────────────────────────

describe("GET /api/connect/youtube/callback — refresh_token meta 저장", () => {
  it("refresh_token이 integrations meta에 포함됨", async () => {
    process.env.YOUTUBE_CLIENT_ID = "yt-client";
    process.env.YOUTUBE_CLIENT_SECRET = "yt-secret";
    H.fetchSeq = [{ status: 200, body: { access_token: "YT_ACCESS", refresh_token: "YT_REFRESH" } }];
    const { GET } = await import("@/app/api/connect/[provider]/callback/route");
    const res = await GET(
      new Request("https://app.example/api/connect/youtube/callback?code=YTCODE&state=tenant-1"),
      params("youtube"),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/연결 완료/);
    expect(H.inserts).toHaveLength(1);
    expect(JSON.stringify(H.inserts[0])).toContain("YT_REFRESH");
    expect(JSON.stringify(H.inserts[0])).toContain("youtube");
    delete process.env.YOUTUBE_CLIENT_ID;
    delete process.env.YOUTUBE_CLIENT_SECRET;
  });
});

describe("GET /api/connect/x/callback — PKCE code_verifier 쿠키 처리", () => {
  it("pkce_x 쿠키 있으면 code_verifier 포함해 토큰 교환, 저장 성공", async () => {
    process.env.X_CLIENT_ID = "x-client-id";
    process.env.X_CLIENT_SECRET = "x-secret";
    H.fetchSeq = [{ status: 200, body: { access_token: "X_ACCESS_TOKEN" } }];
    let capturedBody = "";
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      capturedBody = (init?.body as string) || "";
      const n = H.fetchSeq.shift() || { status: 200, body: {} };
      return new Response(JSON.stringify(n.body), { status: n.status });
    }));
    const { GET } = await import("@/app/api/connect/[provider]/callback/route");
    const res = await GET(
      new Request("https://app.example/api/connect/x/callback?code=XCODE&state=tenant-1", {
        headers: { cookie: "pkce_x=MY_VERIFIER_VALUE" },
      }),
      params("x"),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/연결 완료/);
    expect(capturedBody).toContain("code_verifier=MY_VERIFIER_VALUE");
    expect(JSON.stringify(H.inserts[0])).toContain("X_ACCESS_TOKEN");
    delete process.env.X_CLIENT_ID;
    delete process.env.X_CLIENT_SECRET;
  });
});

describe("GET /api/connect/linkedin/callback — 표준 OAuth 저장", () => {
  it("code → access_token 단일 교환 후 integrations 저장", async () => {
    process.env.LINKEDIN_CLIENT_ID = "li-id";
    process.env.LINKEDIN_CLIENT_SECRET = "li-secret";
    H.fetchSeq = [{ status: 200, body: { access_token: "LI_ACCESS" } }];
    const { GET } = await import("@/app/api/connect/[provider]/callback/route");
    const res = await GET(
      new Request("https://app.example/api/connect/linkedin/callback?code=LICODE&state=tenant-1"),
      params("linkedin"),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/연결 완료/);
    // 표준 OAuth는 fetch 1회만(단기→장기 2단계 없음 — Instagram은 2회)
    expect(H.fetchCalls.length).toBe(1);
    expect(H.inserts).toHaveLength(1);
    expect(JSON.stringify(H.inserts[0])).toContain("LI_ACCESS");
    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;
  });
});
