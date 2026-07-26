"use client";

import { authHeaders, clearAuthToken } from "./auth";

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

export function isAuthRequiredError(error: unknown): boolean {
  return error instanceof Error && error.name === "AuthRequiredError";
}

/** SWR fetcher */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new CustomEvent("auth:required"));
    throw new AuthRequiredError();
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/** POST helper for mutations */
export async function apiPost<T = unknown>(url: string, body?: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      // trigger login modal via event
      window.dispatchEvent(new CustomEvent("auth:required"));
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
  const res = await fetch(url, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:required"));
    return null;
  }
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
}
