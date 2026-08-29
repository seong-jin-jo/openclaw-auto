"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { setAuthToken } from "@/lib/auth";
import { isAbortError, useAuthAttempt } from "@/lib/auth-attempt";
import { useToast } from "@/components/layout/Toast";
import { Button } from "@/components/shared/Button";

/** Operator 401 recovery. Tokens are persisted only after /api/me proves isOperator. */
export function LoginModal() {
  const [show, setShow] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { begin: beginAttempt, invalidate: invalidateAttempt } = useAuthAttempt();
  const { showToast } = useToast();

  const handleLogin = useCallback(async () => {
    const candidate = token.trim();
    if (!candidate) return;
    const attempt = beginAttempt();
    const ownsValidation = attempt.owns;
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${candidate}` },
        signal: attempt.signal,
      });
      const identity = response.ok ? await response.json().catch(() => null) : null;
      if (!ownsValidation()) return;
      if (!response.ok || identity?.isOperator !== true) {
        setError("운영자 토큰이 유효하지 않습니다. 다시 확인해주세요.");
        return;
      }
      setAuthToken(candidate, "operator");
      setShow(false);
      setToken("");
      showToast("로그인 완료", "success");
      previousFocusRef.current?.focus();
    } catch (requestError) {
      if (ownsValidation() && !isAbortError(requestError)) {
        setError("토큰 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      if (ownsValidation()) setBusy(false);
    }
  }, [beginAttempt, showToast, token]);

  const cancel = useCallback(() => {
    invalidateAttempt();
    setBusy(false);
    setShow(false);
    setToken("");
    setError("");
    previousFocusRef.current?.focus();
  }, [invalidateAttempt]);

  useEffect(() => {
    const handler = () => {
      invalidateAttempt();
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setError("");
      setBusy(false);
      setShow(true);
    };
    window.addEventListener("auth:required", handler);
    return () => {
      window.removeEventListener("auth:required", handler);
      invalidateAttempt();
    };
  }, [invalidateAttempt]);

  useEffect(() => {
    if (show) inputRef.current?.focus();
  }, [show]);

  const handleDialogKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, [cancel]);

  if (!show) return null;

  return (
    <div data-login-modal className="fixed inset-0 bg-player-surface/60 z-50 flex items-center justify-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        aria-busy={busy}
        onKeyDown={handleDialogKeyDown}
        className="v56-loginmodal card p-stack-section w-80"
      >
        <h2 id="login-modal-title" className="text-body-sm font-medium text-text mb-micro">로그인이 필요합니다</h2>
        <p className="text-caption text-subtle mb-stack">이 작업을 수행하려면 로그인이 필요합니다.</p>
        <input
          ref={inputRef}
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && void handleLogin()}
          placeholder="운영자 토큰"
          aria-label="운영자 토큰"
          className="w-full min-h-control-touch bg-surface text-muted text-body-sm p-stack rounded-chip border border-border mb-stack"
        />
        {error ? <p className="text-caption text-danger mb-stack">{error}</p> : null}
        <div className="flex gap-stack-tight">
          <Button
            variant="primary"
            onClick={() => void handleLogin()}
            className="flex-1"
          >
            로그인
          </Button>
          <Button onClick={cancel}>취소</Button>
        </div>
      </div>
    </div>
  );
}
