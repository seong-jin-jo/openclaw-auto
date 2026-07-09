"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { authHeaders } from "@/lib/auth";

interface Customer {
  id: string;
  slug: string;
  name: string;
  status: string;
  tier: string;
  owner_auth_id: string | null;
  created_at: string;
  integrations: Array<{ kind: string; label: string | null; has_secret: boolean; connected_at?: string | null }>;
  drafts_count: number;
  published_count: number;
  failed_count: number;
  usage_events_count: number;
  last_usage_at: string | null;
  shorts_used: number | null;
  generations_used: number | null;
}

interface AuthUser {
  id: string;
  email: string | null;
  provider: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  confirmation_sent_at: string | null;
  recovery_sent_at: string | null;
  last_sign_in_at: string | null;
  tenant_id: string | null;
  tenant_slug: string | null;
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v).slice(0, 16) : d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

export default function OperatorCustomersPage() {
  const { data, error, isLoading, mutate } = useSWR<{ customers: Customer[]; authUsers: AuthUser[]; error?: string }>("/api/operator/customers", fetcher);
  const customers = data?.customers || [];
  const authUsers = data?.authUsers || [];
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  async function sendReset(email: string | null) {
    if (!email || busyEmail) return;
    setBusyEmail(email);
    setActionMsg((p) => ({ ...p, [email]: "" }));
    try {
      const res = await fetch("/api/operator/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "send_password_reset", email }),
      });
      const body = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setActionMsg((p) => ({ ...p, [email]: body.error || `실패 ${res.status}` }));
        return;
      }
      setActionMsg((p) => ({ ...p, [email]: "재설정 메일 발송됨" }));
      mutate();
    } catch (e) {
      setActionMsg((p) => ({ ...p, [email]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusyEmail(null);
    }
  }

  return (
    <div className="px-8 py-6">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text mb-1">유저 관리자</h2>
          <p className="text-sm text-subtle">가입자, 워크스페이스, 연결 앱, 사용량, 생성·발행 현황을 봅니다.</p>
          <p className="text-[11px] text-subtle mt-1">비밀번호 원문은 조회하지 않습니다. 필요한 경우 재설정 메일만 발송합니다.</p>
        </div>
        <a href="/operator" className="text-xs text-subtle hover:text-muted">운영자 토큰 재입력</a>
      </div>

      {isLoading && <p className="text-sm text-subtle">불러오는 중…</p>}
      {(error || data?.error) && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger mb-4">
          {data?.error || error?.message || "조회 실패"}
        </div>
      )}

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
                    </div>
                    <p className="text-[11px] text-subtle mt-1">auth {u.id}</p>
                    <p className="text-[11px] text-subtle">
                      tenant {u.tenant_slug || "없음"} · 가입 {fmtDate(u.created_at)} · 최근 로그인 {fmtDate(u.last_sign_in_at)}
                    </p>
                    {u.recovery_sent_at && <p className="text-[11px] text-subtle">최근 재설정 메일 {fmtDate(u.recovery_sent_at)}</p>}
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => sendReset(u.email)}
                      disabled={!u.email || busyEmail === u.email}
                      className="px-3 py-1.5 rounded bg-surface-2 text-xs text-muted hover:bg-surface disabled:opacity-50"
                    >
                      {busyEmail === u.email ? "발송 중..." : "비밀번호 재설정 메일"}
                    </button>
                    {u.email && actionMsg[u.email] && <p className="mt-1 text-[11px] text-subtle">{actionMsg[u.email]}</p>}
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
                {channels.length ? channels.map((ch) => (
                  <span key={`${ch.kind}:${ch.label}`} className="text-[10px] px-2 py-1 rounded bg-accent-soft text-accent">
                    {ch.label} 연결
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
