"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, isAuthRequiredError } from "@/lib/api";
import { authHeaders } from "@/lib/auth";

interface Customer {
  id: string;
  slug: string;
  name: string;
  status: string;
  tier: string;
  owner_auth_id: string | null;
  created_at: string;
  shared_cli_approved_at: string | null;
  integrations: Array<{ kind: string; label: string | null; has_secret: boolean; connected_at?: string | null }>;
  channel_accounts?: Array<{ provider: string; account_count: number; default_username: string | null; last_connected_at: string | null }>;
  drafts_count: number;
  published_count: number;
  failed_count: number;
  usage_events_count: number;
  last_usage_at: string | null;
  shorts_used: number | null;
  generations_used: number | null;
}

interface OperatorSummary {
  authUsers: number;
  workspaces: number;
  activeWorkspaces: number;
  connectedAccounts: number;
  published: number;
  failed: number;
}

interface OAuthProviderStatus {
  provider: string;
  label: string;
  credentialsConfigured: boolean;
  missing: string[];
  requiredSecrets: string[];
  callbackUrl: string;
  consoleUrl: string;
  docsUrl: string;
  externalReview: "required" | "unknown";
}

interface AuthUser {
  id: string;
  email: string | null;
  provider: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  confirmation_sent_at: string | null;
  last_sign_in_at: string | null;
  tenant_id: string | null;
  tenant_slug: string | null;
  tenant_status: string | null;
  tenant_shared_ai_approved_at: string | null;
}

// OSMU v1.0.0: 계정(status) 게이트는 paused만(가입 즉시 active) — 레거시 pending도 방어적으로 라벨은 유지.
const STATUS_LABEL: Record<string, string> = { pending: "승인 대기(레거시)", active: "활성", paused: "정지" };
const STATUS_CLASS: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  active: "bg-success/15 text-success",
  paused: "bg-danger/15 text-danger",
};

function fmtDate(v: string | null | undefined): string {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v).slice(0, 16) : d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

export default function OperatorCustomersPage() {
  const { data, error, isLoading, mutate } = useSWR<{
    customers: Customer[];
    authUsers: AuthUser[];
    summary?: OperatorSummary;
    oauthProviders?: OAuthProviderStatus[];
    error?: string;
  }>("/api/operator/customers", fetcher);
  const customers = data?.customers || [];
  const authUsers = data?.authUsers || [];
  const summary = data?.summary;
  const oauthProviders = data?.oauthProviders || [];
  const visibleError = data?.error || (!isAuthRequiredError(error) ? error?.message : null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [userActionMsg, setUserActionMsg] = useState<Record<string, string>>({});
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  async function copySetupValue(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => setCopiedValue((current) => current === value ? null : current), 1500);
  }

  async function postCustomerAction(
    userId: string,
    action: "pause_user" | "resume_user" | "approve_shared_ai" | "revoke_shared_ai",
  ) {
    if (busyUserId) return;
    setBusyUserId(userId);
    setUserActionMsg((p) => ({ ...p, [userId]: "" }));
    try {
      const res = await fetch("/api/operator/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action, user_id: userId }),
      });
      const body = await res.json().catch(() => ({})) as { error?: string; status?: string; shared_ai_approved?: boolean };
      if (!res.ok) {
        setUserActionMsg((p) => ({ ...p, [userId]: body.error || `실패 ${res.status}` }));
        return;
      }
      const msg = body.status ? `상태 변경됨: ${body.status}` : `공유 AI 승인: ${body.shared_ai_approved ? "허용" : "회수"}`;
      setUserActionMsg((p) => ({ ...p, [userId]: msg }));
      mutate();
    } catch (e) {
      setUserActionMsg((p) => ({ ...p, [userId]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="px-8 py-6">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text mb-1">유저 관리자</h2>
          <p className="text-sm text-subtle">가입자, 워크스페이스, 연결 앱, 사용량, 생성·발행 현황을 봅니다.</p>
          <p className="text-[11px] text-subtle mt-1">고객 인증은 Google OAuth 전용입니다. 비밀번호 원문은 조회하지 않습니다.</p>
        </div>
        <a href="/operator" className="text-xs text-subtle hover:text-muted">운영자 토큰 재입력</a>
      </div>

      {isLoading && <p className="text-sm text-subtle">불러오는 중…</p>}
      {visibleError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger mb-4">
          {visibleError}
        </div>
      )}

      {summary && (
        <section className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6" aria-label="운영 요약">
          {[
            ["가입자", summary.authUsers],
            ["워크스페이스", summary.workspaces],
            ["활성", summary.activeWorkspaces],
            ["연결 계정", summary.connectedAccounts],
            ["발행", summary.published],
            ["실패", summary.failed],
          ].map(([label, value]) => (
            <div key={label} className="card p-3">
              <p className="text-[11px] text-subtle">{label}</p>
              <p className="mt-1 text-xl font-semibold text-text">{value}</p>
            </div>
          ))}
        </section>
      )}

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-text">중앙 OAuth 개발자 앱</h3>
            <p className="mt-1 text-[11px] text-subtle">원문 credential은 받거나 표시하지 않습니다. 아래 이름으로 운영 secret store에 등록하고, callback은 글자까지 동일하게 외부 콘솔에 입력하세요.</p>
          </div>
          <span className="text-[11px] text-subtle">{oauthProviders.filter((item) => item.credentialsConfigured).length}/{oauthProviders.length} 준비</span>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {oauthProviders.map((item) => (
            <div key={item.provider} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize text-text">{item.label}</p>
                  <p className="mt-1 break-words text-[11px] text-subtle">
                    {item.credentialsConfigured ? "운영 secret store 등록 확인됨" : `미설정: ${item.missing.join(", ")}`}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] px-2 py-1 rounded ${item.credentialsConfigured ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                  {item.credentialsConfigured ? "준비" : "차단"}
                </span>
              </div>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-subtle">Callback URL</p>
                  <div className="mt-1 flex items-start gap-2">
                    <code className="min-w-0 flex-1 break-all rounded bg-surface-2 px-2 py-1.5 text-[11px] text-muted">
                      {item.callbackUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copySetupValue(item.callbackUrl)}
                      className="shrink-0 rounded border border-border px-2 py-1.5 text-[10px] text-accent hover:bg-surface-2"
                    >
                      {copiedValue === item.callbackUrl ? "복사됨" : "복사"}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-subtle">Required secret names</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {item.requiredSecrets.map((secretName) => (
                      <button
                        key={secretName}
                        type="button"
                        onClick={() => void copySetupValue(secretName)}
                        className="rounded bg-surface-2 px-2 py-1 font-mono text-[10px] text-muted hover:text-accent"
                        title={`${secretName} 이름 복사`}
                      >
                        {secretName}{copiedValue === secretName ? " ✓" : ""}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px]">
                  <a href={item.consoleUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
                    개발자 콘솔 ↗
                  </a>
                  <a href={item.docsUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
                    공식 문서 ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text">Auth 가입자</h3>
          <span className="text-[11px] text-subtle">{authUsers.length}명</span>
        </div>
        <div className="grid gap-2">
          {authUsers.map((u) => {
            const confirmed = Boolean(u.email_confirmed_at);
            return (
              <div key={u.id} className="card p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-sm text-text">{u.email || "(email 없음)"}</b>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${confirmed ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                        {confirmed ? "이메일 확인됨" : "이메일 미확인"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-2 text-subtle">{u.provider || "provider 없음"}</span>
                      {u.tenant_status && (
                        <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_CLASS[u.tenant_status] || "bg-surface-2 text-subtle"}`}>
                          {STATUS_LABEL[u.tenant_status] || u.tenant_status}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded ${u.tenant_shared_ai_approved_at ? "bg-success/15 text-success" : "bg-surface-2 text-subtle"}`}>
                        공유 AI {u.tenant_shared_ai_approved_at ? "승인됨" : "미승인"}
                      </span>
                    </div>
                    <p className="text-[11px] text-subtle mt-1">auth {u.id}</p>
                    <p className="text-[11px] text-subtle">
                      tenant {u.tenant_slug || "없음"} · 가입 {fmtDate(u.created_at)} · 최근 로그인 {fmtDate(u.last_sign_in_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {u.tenant_shared_ai_approved_at ? (
                        <button
                          onClick={() => postCustomerAction(u.id, "revoke_shared_ai")}
                          disabled={busyUserId === u.id}
                          className="px-3 py-1.5 rounded bg-danger/15 text-xs text-danger hover:bg-danger/25 disabled:opacity-50"
                        >
                          {busyUserId === u.id ? "처리 중..." : "공유 AI 회수"}
                        </button>
                      ) : (
                        <button
                          onClick={() => postCustomerAction(u.id, "approve_shared_ai")}
                          disabled={busyUserId === u.id}
                          className="px-3 py-1.5 rounded bg-success/15 text-xs text-success hover:bg-success/25 disabled:opacity-50"
                        >
                          {busyUserId === u.id ? "처리 중..." : "✓ 공유 AI 승인"}
                        </button>
                      )}
                      {u.tenant_status === "paused" ? (
                        <button
                          onClick={() => postCustomerAction(u.id, "resume_user")}
                          disabled={busyUserId === u.id}
                          className="px-3 py-1.5 rounded bg-success/15 text-xs text-success hover:bg-success/25 disabled:opacity-50"
                        >
                          {busyUserId === u.id ? "처리 중..." : "▶ 재개"}
                        </button>
                      ) : (
                        <button
                          onClick={() => postCustomerAction(u.id, "pause_user")}
                          disabled={busyUserId === u.id}
                          className="px-3 py-1.5 rounded bg-danger/15 text-xs text-danger hover:bg-danger/25 disabled:opacity-50"
                        >
                          {busyUserId === u.id ? "처리 중..." : "⏸ 정지"}
                        </button>
                      )}
                    </div>
                    {userActionMsg[u.id] && <p className="mt-1 text-[11px] text-subtle">{userActionMsg[u.id]}</p>}
                  </div>
                </div>
              </div>
            );
          })}
          {!isLoading && authUsers.length === 0 && !data?.error && (
            <p className="text-sm text-subtle">가입자가 없습니다.</p>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">워크스페이스</h3>
        <span className="text-[11px] text-subtle">{customers.length}개</span>
      </div>
      <div className="grid gap-3">
        {customers.map((c) => {
          const channels = c.integrations.filter((i) => i.kind === "channel" && i.has_secret);
          const channelAccounts = c.channel_accounts || [];
          const anthropic = c.integrations.some((i) => i.kind === "anthropic" && i.has_secret);
          return (
            <div key={c.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text">{c.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface-2 text-subtle">{c.tier}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${c.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{c.status}</span>
                  </div>
                  <p className="text-[11px] text-subtle mt-1">{c.slug} · {c.id}</p>
                  <p className="text-[11px] text-subtle">가입 {fmtDate(c.created_at)} · auth {c.owner_auth_id || "-"}</p>
                </div>
                <div className="text-right text-[11px] text-subtle">
                  <p>최근 사용 {fmtDate(c.last_usage_at)}</p>
                  <p>이벤트 {c.usage_events_count} · 초안 {c.drafts_count} · 발행 {c.published_count} · 실패 {c.failed_count}</p>
                  <p>생성 {c.generations_used ?? 0} · 쇼츠 {c.shorts_used ?? 0}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`text-[10px] px-2 py-1 rounded ${anthropic ? "bg-success/15 text-success" : "bg-surface-2 text-subtle"}`}>
                  Anthropic {anthropic ? "연결" : "공유 엔진"}
                </span>
                {!anthropic && (
                  <span className={`text-[10px] px-2 py-1 rounded ${c.shared_cli_approved_at ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                    공유 AI {c.shared_cli_approved_at ? "승인됨" : "미승인"}
                  </span>
                )}
                {channelAccounts.length ? channelAccounts.map((account) => (
                  <span key={account.provider} className="text-[10px] px-2 py-1 rounded bg-accent-soft text-accent" title={`최근 연결 ${fmtDate(account.last_connected_at)}`}>
                    {account.provider} {account.account_count}개{account.default_username ? ` · 기본 @${account.default_username}` : ""}
                  </span>
                )) : channels.length ? channels.map((ch) => (
                  <span key={`${ch.kind}:${ch.label}`} className="text-[10px] px-2 py-1 rounded bg-accent-soft text-accent">
                    {ch.label} 연결(legacy)
                  </span>
                )) : (
                  <span className="text-[10px] px-2 py-1 rounded bg-surface-2 text-subtle">연결 앱 없음</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && customers.length === 0 && !data?.error && (
        <p className="text-sm text-subtle">등록된 워크스페이스가 없습니다.</p>
      )}
    </div>
  );
}
