"use client";

import { getAuthToken, clearAuthToken } from "@/lib/auth";

export function Account() {
  const hasAuth = typeof window !== "undefined" && !!getAuthToken();

  const handleLogout = () => {
    clearAuthToken();
    window.location.reload();
  };

  const handleChangeToken = () => {
    clearAuthToken();
    window.location.reload();
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-muted mb-4">Account</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-subtle">Auth</span>
          <span className="text-muted">{hasAuth ? "Token set" : "No auth"}</span>
        </div>
      </div>
      {hasAuth ? (
        <div className="flex gap-2 mt-4">
          <button onClick={handleLogout} className="px-4 py-2 text-xs bg-surface-2 text-muted rounded hover:bg-surface-2">
            Logout
          </button>
          <button onClick={handleChangeToken} className="px-4 py-2 text-xs bg-surface-2 text-muted rounded hover:bg-surface-2">
            Change Token
          </button>
        </div>
      ) : null}
    </div>
  );
}
