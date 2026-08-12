"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { fmtAgo } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";

// 테넌트 API 토큰 발급/폐기(운영자). 포크 프론트에 전달 → OSMU_TENANT_TOKEN으로 중앙 API 호출.
interface TokenRow {
  id: string; tenant_id: string; label?: string;
  last_used_at?: string; revoked: boolean; created_at: string;
}

interface WsRow { id: string; slug: string; name: string; domain?: string | null }

export function TenantTokensSettings() {
  const { activeWorkspace } = useUIStore();
  const { data, mutate } = useSWR<{ tokens?: TokenRow[] }>(
    activeWorkspace ? `/api/tenant-tokens?tenant_id=${activeWorkspace.id}` : null, fetcher);
  // 커스텀 도메인(CNAME) — 워크스페이스 목록에서 현재 domain 조회
  const { data: wsData, mutate: mutateWs } = useSWR<{ workspaces?: WsRow[] }>("/api/workspaces", fetcher);
  const curWs = (wsData?.workspaces || []).find((w) => w.id === activeWorkspace?.id);
  const [domain, setDomain] = useState("");
  const [domainMsg, setDomainMsg] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(""); // 발급 직후 원문(1회 표시)

  const tokens = data?.tokens || [];

  const saveDomain = async () => {
    if (!activeWorkspace || !curWs) return;
    setDomainMsg("");
    const r = await apiPost<{ workspace?: WsRow; error?: string }>("/api/workspaces", {
      slug: curWs.slug, name: curWs.name, domain: domain.trim(),
    });
    if (r?.workspace) { await mutateWs(); setDomain(""); setDomainMsg(`✓ 도메인 설정됨: ${r.workspace.domain || "(없음)"}`); }
    else setDomainMsg(r?.error || "설정 실패");
  };

  const issue = async () => {
    if (!activeWorkspace || busy) return;
    setBusy(true); setIssued("");
    try {
      const r = await apiPost<{ ok?: boolean; token?: string }>("/api/tenant-tokens", {
        tenant_id: activeWorkspace.id, label: label.trim() || null,
      });
      if (r?.token) { setIssued(r.token); setLabel(""); await mutate(); }
    } finally { setBusy(false); }
  };

  const revoke = async (id: string) => {
    await fetch(`/api/tenant-tokens?id=${id}`, { method: "DELETE" });
    await mutate();
  };

  if (!activeWorkspace) return <p className="text-sm text-subtle">워크스페이스를 선택하세요.</p>;

  return (
    <div className="max-w-2xl">
      {/* 커스텀 도메인(CNAME) — 이 도메인으로 접속 시 Host로 이 워크스페이스 자동 판별 */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-surface/40">
        <h3 className="text-sm font-semibold text-text mb-1">커스텀 도메인 (CNAME) · {activeWorkspace.name}</h3>
        <p className="text-xs text-subtle mb-3">이 도메인을 중앙 인스턴스로 CNAME하면, 그 도메인 접속이 <b className="text-muted">Host 헤더</b>로 이 워크스페이스로 자동 매핑됩니다(토큰 없이도 스코프). 현재: <span className="text-accent">{curWs?.domain || "(미설정)"}</span></p>
        <div className="flex gap-2">
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder={curWs?.domain || "marketing.example.com"}
            className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg text-muted focus:border-accent outline-none" />
          <button onClick={saveDomain} className="px-4 py-2 text-sm bg-surface-2 hover:bg-surface-2 text-text rounded-lg whitespace-nowrap">도메인 저장</button>
        </div>
        {domainMsg && <p className={`text-xs mt-2 ${domainMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{domainMsg}</p>}
      </div>

      <h3 className="text-sm font-semibold text-text mb-1">API 토큰 · {activeWorkspace.name}</h3>
      <p className="text-xs text-subtle mb-4">포크(프론트만 띄우는 배포)가 중앙 API를 호출할 때 쓰는 토큰입니다. 발급 후 포크의 <code className="text-accent">OSMU_TENANT_TOKEN</code>에 넣으세요. 이 토큰은 해당 워크스페이스 데이터에만 접근합니다.</p>

      <div className="flex gap-2 mb-3">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="용도 메모 (예: marketing-team-frontend)"
          className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg text-muted focus:border-accent outline-none" />
        <button onClick={issue} disabled={busy} className="px-4 py-2 text-sm bg-accent text-text rounded-lg disabled:opacity-50 whitespace-nowrap">{busy ? "발급 중…" : "토큰 발급"}</button>
      </div>

      {issued && (
        <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/30">
          <p className="text-caption text-green-300 mb-1">발급됨 — 지금만 표시됩니다. 복사해 안전히 보관하세요:</p>
          <code className="block text-xs text-text break-all bg-black/40 p-2 rounded select-all">{issued}</code>
        </div>
      )}

      <div className="border border-border rounded-lg divide-y divide-gray-900">
        {tokens.length === 0 && <p className="p-3 text-xs text-subtle">발급된 토큰이 없습니다.</p>}
        {tokens.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 text-sm">
            <div className="min-w-0">
              <span className={`text-xs ${t.revoked ? "text-subtle line-through" : "text-muted"}`}>{t.label || "(메모 없음)"}</span>
              <span className="text-caption text-subtle ml-2">{fmtAgo(t.created_at)}{t.last_used_at ? ` · 최근사용 ${fmtAgo(t.last_used_at)}` : " · 미사용"}</span>
            </div>
            {t.revoked ? <span className="text-caption text-subtle">폐기됨</span>
              : <button onClick={() => revoke(t.id)} className="text-caption text-red-400 hover:text-red-300 whitespace-nowrap">폐기</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
