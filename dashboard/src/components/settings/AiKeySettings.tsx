"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";
import { FreeEventBanner } from "@/components/shared/FreeEventBanner";

// 고객 Anthropic(Claude) 키 등록. 저장 시 콘텐츠 생성이 이 키로 호출(고객 과금·격리).
// 미등록이면 운영자 공유 엔진(claude -p) 사용. integrations(kind='anthropic')에 암호화 저장.
interface Integration { id: string; kind: string; label: string; has_secret: boolean }

export function AiKeySettings() {
  const { activeWorkspace } = useUIStore();
  const { data, mutate } = useSWR<{ integrations?: Integration[] }>(
    activeWorkspace ? `/api/integrations?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const hasKey = (data?.integrations || []).some((i) => i.kind === "anthropic" && i.has_secret);

  const save = async () => {
    if (!activeWorkspace || !key.trim() || busy) return;
    setBusy(true); setMsg("");
    try {
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/integrations", {
        tenant_id: activeWorkspace.id, kind: "anthropic", label: "claude", secret: key.trim(),
      });
      if (r?.ok) { setKey(""); setMsg("✓ Claude 키 저장됨. 이제 생성이 이 키로 동작합니다."); await mutate(); }
      else setMsg(r?.error || "저장 실패");
    } finally { setBusy(false); }
  };

  if (!activeWorkspace) return <p className="text-body-sm text-subtle">워크스페이스를 선택하세요.</p>;

  return (
    <div className="max-w-2xl p-pad-inset rounded-surface border border-border bg-surface/40">
      <div className="mb-stack"><FreeEventBanner /></div>
      <h3 className="text-body-sm font-semibold text-text mb-micro">내 Claude(Anthropic) 키 · {activeWorkspace.name}</h3>
      <p className="text-caption text-subtle mb-stack">
        내 Anthropic API 키를 등록하면 콘텐츠 생성이 <b className="text-muted">내 키·내 과금</b>으로 동작합니다(미등록 시 공유 엔진).
        키는 암호화 저장되며 발급은 <span className="text-accent">console.anthropic.com → API Keys</span>.
        현재: <span className={hasKey ? "text-success" : "text-subtle"}>{hasKey ? "등록됨(내 과금)" : "미등록(무료 이벤트. 운영자 부담)"}</span>
      </p>
      <div className="flex gap-stack-tight">
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-..."
          className="flex-1 px-stack py-stack-tight text-body-sm bg-surface border border-border rounded-control text-muted focus:border-accent outline-none" />
        <button onClick={save} disabled={busy} className="px-pad-inset py-stack-tight text-body-sm bg-accent text-accent-fg rounded-control disabled:opacity-50 whitespace-nowrap">
          {busy ? "저장 중…" : "키 저장"}
        </button>
      </div>
      {msg && <p className={`text-caption mt-stack-tight ${msg.startsWith("✓") ? "text-success" : "text-danger"}`}>{msg}</p>}
    </div>
  );
}
