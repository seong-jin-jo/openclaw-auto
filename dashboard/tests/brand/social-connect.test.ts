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
