"use client";

import { useState, useEffect } from "react";
import { useTokenStatus } from "@/hooks/useOverview";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { fmtAgo } from "@/lib/format";

export function ClaudeToken() {
  const { data: tokenStatus, mutate } = useTokenStatus();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tokenValue, setTokenValue] = useState("");

  const claude = (tokenStatus as Record<string, unknown>)?.claude as Record<string, unknown> | undefined;
  const currentToken = (claude?.token as string) || "";
  const hasToken = !!currentToken;

  useEffect(() => {
    setTokenValue(currentToken);
  }, [currentToken]);

  const handleSave = async () => {
    const token = tokenValue.trim();
    if (!token) { showToast("토큰을 입력하세요", "warning"); return; }
    if (!token.startsWith("sk-ant-")) { showToast("잘못된 토큰 형식 (sk-ant-...)", "error"); return; }
    setSaving(true);
    try {
      const r = await apiPost<{ ok: boolean; type: string }>("/api/claude-token", { token });
      if (r?.ok) {
        showToast(`Claude 토큰 업데이트 완료 (${r.type})`, "success");
        // 저장한 값 유지 — mutate 전에 tokenValue를 보존
        const savedToken = token;
        setEditing(false);
        await mutate();
        setTokenValue(savedToken);
      }
    } catch (e) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  const editable = editing || !hasToken;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">Claude Token</h3>
        <div className="flex items-center gap-2">
          {claude && (
            <span className={`text-[10px] px-2 py-0.5 rounded ${claude.healthy ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
              {claude.healthy ? "Healthy" : "Error"}
            </span>
          )}
          {claude && <span className="text-[10px] text-gray-600">{String(claude.type || "token")}</span>}
          {hasToken && !editing && (
            <button onClick={() => setEditing(true)} className="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
          )}
        </div>
      </div>

      {claude && (
        <div className="space-y-1 text-[10px] mb-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Errors</span>
            <span className={Number(claude.errorCount) > 0 ? "text-red-400" : "text-gray-400"}>{String(claude.errorCount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Last used</span>
            <span className="text-gray-400">{claude.lastUsed ? fmtAgo(claude.lastUsed) : "-"}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Setup Token 또는 API Key</label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={tokenValue}
              onChange={(e) => setTokenValue(e.target.value)}
              readOnly={!editable}
              title={tokenValue}
              placeholder="sk-ant-oat01-... or sk-ant-api..."
              className={`w-full ${editable ? "bg-gray-900" : "bg-gray-900/50 cursor-default"} border border-gray-700 rounded px-3 py-2 pr-16 text-[11px] text-gray-300 placeholder-gray-600 font-mono`}
            />
            {tokenValue && (
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-300"
              >
                {showToken ? "Hide" : "Show"}
              </button>
            )}
          </div>
        </div>
        <details className="text-[10px]">
          <summary className="text-blue-400 hover:text-blue-300 cursor-pointer">Setup Guide</summary>
          <div className="mt-2 p-2 rounded bg-gray-900/50 text-gray-500 space-y-1">
            <p>1. 터미널에서 <code className="bg-gray-800 px-1 rounded">claude setup-token</code> 실행</p>
            <p>2. 브라우저에서 Anthropic 로그인</p>
            <p>3. 생성된 <code className="bg-gray-800 px-1 rounded">sk-ant-oat01-...</code> 토큰 복사</p>
            <p>4. 위 필드에 붙여넣기 → Update Token</p>
          </div>
        </details>
        {editable && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Updating..." : hasToken ? "Update Token" : "Connect"}
            </button>
            {hasToken && editing && (
              <button
                onClick={() => { setEditing(false); setTokenValue(currentToken); }}
                className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
