import { NextRequest, NextResponse } from "next/server";

const AUTH_TOKEN = process.env.DASHBOARD_AUTH_TOKEN || "";
const AUTH_TOKEN_KEY = "dashboard_auth_token";
const AUTH_IDENTITY_KIND_KEY = "dashboard_auth_identity_kind";
const ACTIVE_WORKSPACE_KEY = "active_workspace";

export type AuthIdentityKind = "customer" | "operator";

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
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function isCustomerAuthToken(token: string | null | undefined): boolean {
  return !!token && token.split(".").length === 3 && token.length > 40;
}

export function getAuthIdentityKind(): AuthIdentityKind | null {
  if (typeof window === "undefined" || !getAuthToken()) return null;
  const stored = localStorage.getItem(AUTH_IDENTITY_KIND_KEY);
  if (stored === "customer" || stored === "operator") return stored;
  return isCustomerAuthToken(getAuthToken()) ? "customer" : null;
}

export function setAuthToken(token: string, kind?: AuthIdentityKind): void {
  if (typeof window === "undefined") return;
  const previous = localStorage.getItem(AUTH_TOKEN_KEY);
  if (previous !== token) {
    // 운영자↔고객 또는 고객 A↔고객 B identity 전환에서 이전 tenant 선택을 재사용하지 않는다.
    localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  const resolvedKind = kind ?? (isCustomerAuthToken(token) ? "customer" : null);
  if (resolvedKind) localStorage.setItem(AUTH_IDENTITY_KIND_KEY, resolvedKind);
  else localStorage.removeItem(AUTH_IDENTITY_KIND_KEY);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_IDENTITY_KIND_KEY);
  localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
}

export function authHeaders(): Record<string, string> {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Keep customer reauthentication on customer-owned routes only. */
export function safeCustomerReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return "/";
  try {
    const base = new URL("https://customer.local");
    const parsed = new URL(value, base);
    const decodedPath = decodeURIComponent(parsed.pathname);
    const deniedPath = decodedPath === "/login"
      || decodedPath.startsWith("/login/")
      || decodedPath === "/signup"
      || decodedPath.startsWith("/signup/")
      || decodedPath.startsWith("/operator")
      || decodedPath.startsWith("/api/auth/")
      || decodedPath === "/auth/callback"
      || decodedPath.startsWith("/auth/callback/");
    if (parsed.origin !== base.origin
      || deniedPath
      || decodedPath.startsWith("//")
      || /[\\\u0000-\u001f\u007f]/.test(decodedPath)) return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function customerLoginUrl(returnTo: string | null | undefined): string {
  return `/login?returnTo=${encodeURIComponent(safeCustomerReturnTo(returnTo))}`;
}
