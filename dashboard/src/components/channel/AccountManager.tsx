"use client";

import { useCallback, useEffect, useState } from "react";
import { useUIStore } from "@/store/ui-store";
import { authHeaders } from "@/lib/auth";

// SNS-007: provider당 여러 계정(예: Threads 개인+브랜드)을 목록/추가(Bluesky만 수동)/기본전환/삭제.
// OAuth provider(threads/x/instagram/facebook/youtube 등)는 이 컴포넌트가 아니라
// SocialConnectButton이 새 계정을 추가한다(연결=새 OAuth 왕복=새 channel_accounts 행) —
// 이 컴포넌트는 그렇게 쌓인 계정들을 "관리"만 한다. onAccountsChanged로 부모(연결 상태 카드 등)에
// 갱신을 알린다.

interface AccountRow {
  id: string;
  external_account_id: string;
  display_name: string | null;
  username: string | null;
  is_default: boolean;
  status: string;
  token_expires_at: string | null;
  created_at: string;
}

function accountLabel(a: AccountRow): string {
  if (a.display_name && a.username) return `${a.display_name} (@${a.username})`;
  if (a.display_name) return a.display_name;
  if (a.username) return `@${a.username}`;
  return a.external_account_id;
}

function statusBadge(status: string): { text: string; className: string } {
  if (status === "active") return { text: "정상", className: "text-success" };
  if (status === "expired") return { text: "만료됨 — 재연결 필요", className: "text-warning" };
  if (status === "revoked") return { text: "연결 해제됨", className: "text-danger" };
  return { text: status, className: "text-muted" };
}

export function AccountManager({
  provider,
  label,
  allowManualAdd = false,
  onAccountsChanged,
}: {
  provider: string;
  label: string;
  allowManualAdd?: boolean;
  onAccountsChanged?: () => void;
}) {
  const { activeWorkspace } = useUIStore();
  const [accounts, setAccounts] = useState<AccountRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [handle, setHandle] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  const refresh = useCallback(async () => {
    if (!activeWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/channels/${provider}/accounts?tenant_id=${activeWorkspace.id}`, {
        headers: authHeaders(),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `${r.status}`);
      setAccounts(d.accounts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "계정 목록을 불러오지 못했습니다.");
      setAccounts(null);
    } finally {
      setLoading(false);
    }
  }, [provider, activeWorkspace]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setDefault = async (id: string) => {
    if (!activeWorkspace || busyId) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/channels/${provider}/accounts/${id}/default?tenant_id=${activeWorkspace.id}`, {
        method: "POST",
        headers: authHeaders(),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `${r.status}`);
      await refresh();
      onAccountsChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "기본계정 전환에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!activeWorkspace || busyId) return;
    if (!window.confirm(`이 ${label} 계정 연결을 해제할까요? 이 계정으로 예약된 발행은 실패로 처리됩니다.`)) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/channels/${provider}/accounts/${id}?tenant_id=${activeWorkspace.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `${r.status}`);
      await refresh();
      onAccountsChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "계정 삭제에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const addManual = async () => {
    if (!activeWorkspace || addBusy) return;
    setAddBusy(true);
    setAddMsg("");
    try {
      const r = await fetch(`/api/channels/${provider}/accounts?tenant_id=${activeWorkspace.id}`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ handle, appPassword }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `${r.status}`);
      setAddMsg(`${d.account || handle} 연결 완료.`);
      setHandle("");
      setAppPassword("");
      setShowAdd(false);
      await refresh();
      onAccountsChanged?.();
    } catch (e) {
      setAddMsg(e instanceof Error ? e.message : "계정 추가에 실패했습니다.");
    } finally {
      setAddBusy(false);
    }
  };

  if (!activeWorkspace) return null;
  if (loading) {
    return <p className="text-caption text-subtle" data-testid={`account-manager-loading-${provider}`}>계정 목록 확인 중…</p>;
  }
  if (error) {
    return (
      <p className="text-caption text-danger" data-testid={`account-manager-error-${provider}`}>
        ⛔ {error}
      </p>
    );
  }
  if (!accounts || accounts.length === 0) {
    return allowManualAdd ? (
      <ManualAddBlock
        provider={provider}
        label={label}
        showAdd={showAdd}
        setShowAdd={setShowAdd}
        handle={handle}
        setHandle={setHandle}
        appPassword={appPassword}
        setAppPassword={setAppPassword}
        addBusy={addBusy}
        addMsg={addMsg}
        addManual={addManual}
      />
    ) : null;
  }

  return (
    <div className="mt-3" data-testid={`account-manager-${provider}`}>
      <p className="text-caption font-semibold text-muted mb-1">연결된 {label} 계정 ({accounts.length})</p>
      <ul className="space-y-1.5">
        {accounts.map((a) => {
          const badge = statusBadge(a.status);
          return (
            <li
              key={a.id}
              data-testid={`account-row-${provider}-${a.id}`}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-text">{accountLabel(a)}</span>
                  {a.is_default && (
                    <span
                      data-testid={`account-default-badge-${provider}-${a.id}`}
                      className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-caption text-accent"
                    >
                      기본
                    </span>
                  )}
                </div>
                <span className={`text-caption ${badge.className}`}>{badge.text}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {!a.is_default && (
                  <button
                    type="button"
                    onClick={() => setDefault(a.id)}
                    disabled={busyId === a.id}
                    data-testid={`account-set-default-${provider}-${a.id}`}
                    className="rounded px-2 py-1 text-caption text-accent hover:bg-accent/10 disabled:opacity-50"
                  >
                    기본으로
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  disabled={busyId === a.id}
                  data-testid={`account-delete-${provider}-${a.id}`}
                  className="rounded px-2 py-1 text-caption text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {allowManualAdd && (
        <div className="mt-2">
          <ManualAddBlock
            provider={provider}
            label={label}
            showAdd={showAdd}
            setShowAdd={setShowAdd}
            handle={handle}
            setHandle={setHandle}
            appPassword={appPassword}
            setAppPassword={setAppPassword}
            addBusy={addBusy}
            addMsg={addMsg}
            addManual={addManual}
          />
        </div>
      )}
    </div>
  );
}

function ManualAddBlock({
  provider,
  label,
  showAdd,
  setShowAdd,
  handle,
  setHandle,
  appPassword,
  setAppPassword,
  addBusy,
  addMsg,
  addManual,
}: {
  provider: string;
  label: string;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  handle: string;
  setHandle: (v: string) => void;
  appPassword: string;
  setAppPassword: (v: string) => void;
  addBusy: boolean;
  addMsg: string;
  addManual: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => setShowAdd(!showAdd)}
        data-testid={`account-add-toggle-${provider}`}
        className="text-caption text-accent underline underline-offset-2"
      >
        {showAdd ? "닫기" : `+ ${label} 계정 추가(App Password)`}
      </button>
      {showAdd && (
        <div className="mt-2 space-y-1.5 rounded-md border border-border bg-surface p-2.5">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="handle.bsky.social"
            data-testid={`account-add-handle-${provider}`}
            className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-xs text-text"
          />
          <input
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder="App Password"
            type="password"
            data-testid={`account-add-password-${provider}`}
            className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-xs text-text"
          />
          <button
            type="button"
            onClick={addManual}
            disabled={addBusy || !handle || !appPassword}
            data-testid={`account-add-submit-${provider}`}
            className="w-full rounded bg-accent px-2 py-1.5 text-xs text-accent-fg disabled:opacity-50"
          >
            {addBusy ? "연결 중…" : "계정 추가"}
          </button>
          {addMsg && <p className="text-caption text-subtle">{addMsg}</p>}
        </div>
      )}
    </div>
  );
}
