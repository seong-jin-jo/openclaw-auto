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
      <h3 className="text-sm font-medium text-gray-300 mb-4">Account</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Auth</span>
          <span className="text-gray-300">{hasAuth ? "Token set" : "No auth"}</span>
        </div>
      </div>
      {hasAuth ? (
        <div className="flex gap-2 mt-4">
          <button onClick={handleLogout} className="px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">
            Logout
          </button>
          <button onClick={handleChangeToken} className="px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">
            Change Token
          </button>
        </div>
      ) : null}
    </div>
  );
}
