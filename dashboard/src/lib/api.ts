"use client";

import { clearAuthToken, getAuthToken } from "./auth";

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

export function isAuthRequiredError(error: unknown): boolean {
  return error instanceof Error && error.name === "AuthRequiredError";
}

function requestAuth(): { token: string; headers: Record<string, string> } {
  const token = getAuthToken();
  return {
    token,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}

function handleUnauthorized(requestToken: string, clearToken: boolean): void {
  // A response belongs to the credential snapshot used when its request started.
  // If login refreshed/replaced that credential meanwhile, the old 401 must not
  // invalidate the newer identity or open the global login modal.
  if (getAuthToken() !== requestToken) return;
  if (clearToken) clearAuthToken();
  window.dispatchEvent(new CustomEvent("auth:required"));
}

/** SWR fetcher */
export async function fetcher<T>(url: string): Promise<T> {
  const auth = requestAuth();
  const res = await fetch(url, { headers: auth.headers });
  if (res.status === 401) {
    handleUnauthorized(auth.token, true);
    throw new AuthRequiredError();
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/** POST helper for mutations */
export async function apiPost<T = unknown>(url: string, body?: unknown): Promise<T | null> {
  try {
    const auth = requestAuth();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth.headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      handleUnauthorized(auth.token, false);
      return null;
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error((d as { error?: string }).error || `Request failed: ${res.status}`);
    }
    return res.json();
  } catch (e) {
    throw e;
  }
}

/** DELETE helper */
export async function apiDelete<T = unknown>(url: string): Promise<T | null> {
  const auth = requestAuth();
  const res = await fetch(url, {
    method: "DELETE",
    headers: auth.headers,
  });
  if (res.status === 401) {
    handleUnauthorized(auth.token, false);
    return null;
  }
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
}
