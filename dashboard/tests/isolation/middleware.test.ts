import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

// L0-1 분기 단위검증.
// middleware는 호출 시점에 process.env를 읽으므로 vi.stubEnv로 조합을 주입.
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
});

describe("middleware L0-1 fail-closed 분기", () => {
  it("prod + 토큰없음 → API 503 fail-closed", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "");
    vi.stubEnv("OSMU_AUTH_OPTIONAL", "");
    const res = middleware(apiRequest());
    expect(res.status).toBe(503);
  });

  it("prod + OSMU_AUTH_OPTIONAL=1 + 토큰없음 → 통과", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "");
    vi.stubEnv("OSMU_AUTH_OPTIONAL", "1");
    const res = middleware(apiRequest());
    expect(isPass(res)).toBe(true);
  });

  it("dev + 토큰없음 → 통과 (무인증 허용)", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "");
    vi.stubEnv("OSMU_AUTH_OPTIONAL", "");
    const res = middleware(apiRequest());
    expect(isPass(res)).toBe(true);
  });
});

describe("middleware 토큰 검증 분기", () => {
  it("토큰 설정 + Authorization 일치 → 통과", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const res = middleware(apiRequest({ Authorization: "Bearer secret-abc" }));
    expect(isPass(res)).toBe(true);
  });

  it("토큰 설정 + Authorization 불일치 → 401", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const res = middleware(apiRequest({ Authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("토큰 설정 + Authorization 누락 → 401", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const res = middleware(apiRequest());
    expect(res.status).toBe(401);
  });
});

describe("middleware 프록시 모드(포크 셀프호스트) 분기", () => {
  it("OSMU_API_BASE 설정 → /api를 중앙으로 rewrite(토큰 서버에서 부착)", () => {
    vi.stubEnv("OSMU_API_BASE", "https://central.example.com");
    vi.stubEnv("OSMU_TENANT_TOKEN", "osmu_secret");
    const res = middleware(apiRequest());
    expect(res.headers.get("x-middleware-rewrite")).toContain("https://central.example.com/api/queue");
  });

  it("OSMU_API_BASE 미설정 → 프록시 안 함(통상 처리)", () => {
    vi.stubEnv("OSMU_API_BASE", "");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "");
    vi.stubEnv("NODE_ENV", "development");
    const res = middleware(apiRequest());
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });
});

describe("middleware 테넌트 토큰(인증모델 b) 분기", () => {
  it("osmu_ 토큰 + 데이터 라우트 → 통과(라우트가 resolveTenantToken으로 검증)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const res = middleware(apiRequest({ Authorization: "Bearer osmu_xxx" }));
    expect(isPass(res)).toBe(true);
  });

  it("osmu_ 토큰 + 운영자 라우트(tenant-tokens) → 401 차단", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const req = new NextRequest("http://localhost/api/tenant-tokens", { headers: { Authorization: "Bearer osmu_xxx" } });
    expect(middleware(req).status).toBe(401);
  });

  it("osmu_ 토큰 + 워크스페이스 목록 → 401 차단(운영자 전용)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_AUTH_TOKEN", "secret-abc");
    const req = new NextRequest("http://localhost/api/workspaces", { headers: { Authorization: "Bearer osmu_xxx" } });
    expect(middleware(req).status).toBe(401);
  });
});
