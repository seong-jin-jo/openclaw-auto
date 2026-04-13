import { NextRequest, NextResponse } from "next/server";

const AUTH_TOKEN = process.env.DASHBOARD_AUTH_TOKEN || "";

/** Server-side: check Bearer token in API routes */
export function checkAuth(req: NextRequest): NextResponse | null {
  if (!AUTH_TOKEN) return null; // auth disabled
  if (req.method === "OPTIONS") return null;

  const token = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
  if (token !== AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Client-side auth helpers */
export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("dashboard_auth_token") || "";
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("dashboard_auth_token", token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("dashboard_auth_token");
}

export function authHeaders(): Record<string, string> {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
