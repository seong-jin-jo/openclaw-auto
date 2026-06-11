import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = process.env.DASHBOARD_AUTH_TOKEN;
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  // L0-1: AUTH_TOKEN 미설정 시 전 API 공개 = 격리 근본구멍. prod는 fail-closed(503).
  // dev(NODE_ENV!=production) 또는 명시적 OSMU_AUTH_OPTIONAL=1 일 때만 무인증 허용.
  if (!authToken) {
    const devOptOut = process.env.NODE_ENV !== "production" || process.env.OSMU_AUTH_OPTIONAL === "1";
    if (isApi && !devOptOut) {
      return NextResponse.json(
        { error: "DASHBOARD_AUTH_TOKEN 미설정 — prod 무인증 차단. dev는 OSMU_AUTH_OPTIONAL=1로 우회." },
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  // Only protect API routes
  if (!isApi) return NextResponse.next();

  // Allow OPTIONS (CORS preflight)
  if (request.method === "OPTIONS") return NextResponse.next();

  // Allow Figma OAuth callback without auth
  if (request.nextUrl.pathname === "/api/figma-mcp/callback") return NextResponse.next();

  const token = request.headers.get("Authorization")?.replace("Bearer ", "") || "";
  if (token !== authToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
