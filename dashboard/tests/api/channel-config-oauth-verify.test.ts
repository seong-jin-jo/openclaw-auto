import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { createTempDir, setupTestEnv, cleanupTestEnv } from "../helpers";

// GET /api/channel-config — Instagram/Threads 라이브 OAuth 검증 (2026-07-16 P0 QA 정정).
// 회귀 대상: "secret_enc가 비어있지 않다"(has_secret)만으로 connected=true를 세우던 과거 로직이
// 실제로는 OAuth code 190(토큰 무효)인데도 "Connected"로 거짓 노출한 사고. 이제 GET이 매번
// graph.threads.net / graph.instagram.com read-only 계정 조회로 라이브 검증한다.

const H = vi.hoisted(() => ({
  rows: [] as Array<{ label: string; token: string | null; meta: Record<string, unknown> | null }>,
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_t: string, cb: (sql: unknown) => unknown) => {
    // route.ts의 단일 SELECT 템플릿 호출을 흉내 — 항상 H.rows를 반환.
    const sql = Object.assign(
      (_s: TemplateStringsArray, ..._vals: unknown[]) => Promise.resolve(H.rows),
      { json: (v: unknown) => v },
    );
    return cb(sql);
  }),
}));

let tmpDir: string;
let fetchMock: ReturnType<typeof vi.fn>;

function writeConfig() {
  const src = path.resolve(__dirname, "../fixtures/openclaw.json");
  fs.copyFileSync(src, path.join(tmpDir, "openclaw.json"));
}

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
  writeConfig();
  H.rows = [];
  process.env.OSMU_SECRET_KEY = "enc-key";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
  delete process.env.OSMU_SECRET_KEY;
  vi.unstubAllGlobals();
});

describe("GET /api/channel-config — Instagram/Threads 라이브 OAuth 검증", () => {
  it("유효한 토큰(200 OK)이면 connected=true, connectionStatus=valid", async () => {
    H.rows = [
      { label: "instagram", token: "IG_TOKEN", meta: { userId: "1784" } },
      { label: "threads", token: "TH_TOKEN", meta: { userId: "999" } },
    ];
    fetchMock.mockImplementation(async (url: string) => new Response(JSON.stringify(
      url.includes("graph.threads.net") ? { id: "999", username: "sj" } : { username: "sj" },
    ), { status: 200 }));

    const { GET } = await import("@/app/api/channel-config/route");
    const res = await GET(new Request("http://localhost/api/channel-config"));
    const data = await res.json();

    expect(data.instagram.connected).toBe(true);
    expect(data.instagram.connectionStatus).toBe("valid");
    expect(data.instagram.reconnectRequired).toBe(false);
    expect(data.threads.connected).toBe(true);
    expect(data.threads.connectionStatus).toBe("valid");

    // 토큰 원문이 응답에 새면 안 됨
    expect(JSON.stringify(data)).not.toContain("IG_TOKEN");
    expect(JSON.stringify(data)).not.toContain("TH_TOKEN");
  });

  it("Threads 저장 userId와 live id가 다르면 invalid + 재연결 필요", async () => {
    H.rows = [{ label: "threads", token: "TH_TOKEN", meta: { userId: "stored-999" } }];
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: "live-888", username: "sj" }), { status: 200 }));

    const { GET } = await import("@/app/api/channel-config/route");
    const data = await (await GET(new Request("http://localhost/api/channel-config"))).json();

    expect(data.threads.connected).toBe(false);
    expect(data.threads.connectionStatus).toBe("invalid");
    expect(data.threads.connectionError).toBe("identity_mismatch");
    expect(data.threads.reconnectRequired).toBe(true);
  });

  it("Threads 응답이 200이어도 live id가 없으면 valid로 통과시키지 않는다", async () => {
    H.rows = [{ label: "threads", token: "TH_TOKEN", meta: { userId: "stored-999" } }];
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ username: "sj" }), { status: 200 }));

    const { GET } = await import("@/app/api/channel-config/route");
    const data = await (await GET(new Request("http://localhost/api/channel-config"))).json();

    expect(data.threads.connected).toBe(false);
    expect(data.threads.connectionStatus).toBe("unverified");
    expect(data.threads.connectionError).toBe("identity_unavailable");
    expect(data.threads.reconnectRequired).toBe(false);
  });

  it("OAuth code 190(무효 토큰)이면 connected=false, status=available, reconnectRequired=true", async () => {
    H.rows = [
      { label: "instagram", token: "IG_EXPIRED", meta: { userId: "1784" } },
    ];
    fetchMock.mockResolvedValue(new Response(
      JSON.stringify({ error: { message: "Error validating access token", type: "OAuthException", code: 190 } }),
      { status: 400 },
    ));

    const { GET } = await import("@/app/api/channel-config/route");
    const res = await GET(new Request("http://localhost/api/channel-config"));
    const data = await res.json();

    expect(data.instagram.connected).toBe(false);
    expect(data.instagram.status).toBe("available");
    expect(data.instagram.reconnectRequired).toBe(true);
    expect(data.instagram.connectionStatus).toBe("invalid");
    expect(data.instagram.connectionError).toBe("oauth_token_invalid");
    // "인증 필요" 원문 노출 금지 — 코드로만 분류돼야 함
    expect(JSON.stringify(data)).not.toContain("Error validating access token");
    expect(JSON.stringify(data)).not.toContain("IG_EXPIRED");
  });

  it("401도 무효 토큰으로 분류한다", async () => {
    H.rows = [{ label: "threads", token: "TH_BAD", meta: {} }];
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: "x" } }), { status: 401 }));

    const { GET } = await import("@/app/api/channel-config/route");
    const res = await GET(new Request("http://localhost/api/channel-config"));
    const data = await res.json();

    expect(data.threads.connected).toBe(false);
    expect(data.threads.reconnectRequired).toBe(true);
    expect(data.threads.connectionError).toBe("oauth_token_invalid");
  });

  it("네트워크/타임아웃 실패면 토큰을 지우거나 무효 판정하지 않고 unverified만 세운다", async () => {
    H.rows = [{ label: "instagram", token: "IG_TOKEN", meta: { userId: "1784" } }];
    fetchMock.mockRejectedValue(new Error("fetch failed"));

    const { GET } = await import("@/app/api/channel-config/route");
    const res = await GET(new Request("http://localhost/api/channel-config"));
    const data = await res.json();

    expect(data.instagram.connected).toBe(false);
    expect(data.instagram.connectionStatus).toBe("unverified");
    expect(data.instagram.connectionError).toBe("provider_unreachable");
    // 네트워크 실패는 "무효 재연결 필요"가 아니다 — reconnectRequired를 세우면 안 됨(false 유지).
    expect(data.instagram.reconnectRequired).not.toBe(true);
  });

  it("5xx도 unverified로 분류하고 무효 단정하지 않는다", async () => {
    H.rows = [{ label: "threads", token: "TH_TOKEN", meta: {} }];
    fetchMock.mockResolvedValue(new Response("upstream error", { status: 503 }));

    const { GET } = await import("@/app/api/channel-config/route");
    const res = await GET(new Request("http://localhost/api/channel-config"));
    const data = await res.json();

    expect(data.threads.connected).toBe(false);
    expect(data.threads.connectionStatus).toBe("unverified");
    expect(data.threads.connectionError).toBe("provider_unreachable");
  });

  it("OSMU_SECRET_KEY 미설정이면 복호화 없이 unverified로만 마킹(throw/leak 없음)", async () => {
    delete process.env.OSMU_SECRET_KEY;
    H.rows = [{ label: "instagram", token: null, meta: { userId: "1784" } }];

    const { GET } = await import("@/app/api/channel-config/route");
    const res = await GET(new Request("http://localhost/api/channel-config"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.instagram.connected).toBe(false);
    expect(data.instagram.connectionStatus).toBe("unverified");
    expect(data.instagram.connectionError).toBe("server_key_missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("integrations row가 아예 없으면(미연결) 파일에 남은 과거 accessToken이 있어도 connected=false로 리셋된다", async () => {
    // openclaw.json 픽스처에 threads accessToken이 있어도(레거시 파일 기반) DB row가 없으면
    // "Connected"로 새지 않아야 한다 — 이번 P0 QA의 핵심 회귀 시나리오.
    H.rows = [];

    const { GET } = await import("@/app/api/channel-config/route");
    const res = await GET(new Request("http://localhost/api/channel-config"));
    const data = await res.json();

    expect(data.instagram.connected).toBe(false);
    expect(data.threads.connected).toBe(false);
  });

  it("instagram/threads 외 채널(facebook)은 기존 stored-credential 동작을 유지한다", async () => {
    H.rows = [{ label: "facebook", token: "FB_TOKEN", meta: { userId: "pg1" } }];

    const { GET } = await import("@/app/api/channel-config/route");
    const res = await GET(new Request("http://localhost/api/channel-config"));
    const data = await res.json();

    expect(data.facebook.connected).toBe(true);
    // facebook은 이번 패치 대상이 아니므로 read-only 라이브 호출을 하지 않는다.
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
