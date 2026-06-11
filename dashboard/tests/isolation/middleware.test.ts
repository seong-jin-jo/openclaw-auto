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
