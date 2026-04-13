import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = process.env.DASHBOARD_AUTH_TOKEN;
  if (!authToken) return NextResponse.next(); // auth disabled

  // Only protect API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  // Allow OPTIONS (CORS preflight)
  if (request.method === "OPTIONS") return NextResponse.next();

  const token = request.headers.get("Authorization")?.replace("Bearer ", "") || "";
  if (token !== authToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
