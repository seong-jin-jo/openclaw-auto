"use client";

import { useEffect, useState, useCallback } from "react";
import { setAuthToken } from "@/lib/auth";
import { useToast } from "@/components/layout/Toast";

/**
 * Login modal — shown when a POST request returns 401.
 * Exact port of showLoginModal() from app.js lines 27-54.
 */
export function LoginModal() {
  const [show, setShow] = useState(false);
  const [token, setToken] = useState("");
  const { showToast } = useToast();

  const handleLogin = useCallback(() => {
    if (!token.trim()) return;
    setAuthToken(token.trim());
    setShow(false);
    setToken("");
    showToast("로그인 완료", "success");
  }, [token, showToast]);

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener("auth:required", handler);
    return () => window.removeEventListener("auth:required", handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="card p-6 w-80">
        <h2 className="text-sm font-medium text-white mb-1">Login Required</h2>
        <p className="text-[10px] text-gray-500 mb-3">이 작업을 수행하려면 로그인이 필요합니다.</p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="Auth Token"
          className="w-full bg-gray-900 text-gray-200 text-sm p-3 rounded border border-gray-700 mb-3"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={handleLogin} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">
            Login
          </button>
          <button onClick={() => setShow(false)} className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
