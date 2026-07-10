"use client";

import { useState } from "react";
import { useUIStore } from "@/store/ui-store";
import { authHeaders } from "@/lib/auth";
import { oauthErrorMessage } from "@/lib/oauth-errors";
import { SCHEDULABLE_PLATFORMS } from "@/lib/constants";

// 소셜 OAuth "연결" 버튼 (ADR-004) — 고객은 비번/토큰 개념 없이 이 버튼만.
// 클릭 → /api/connect/{provider}로 동의 URL 받아 팝업으로 열기 → provider 공식 페이지에서 로그인/동의 →
// callback이 토큰을 받아 테넌트별 저장. 팝업이 닫히면 부모가 채널 설정을 새로고침하면 됨.
export function SocialConnectButton({ provider, label }: { provider: string; label: string }) {
  const { activeWorkspace } = useUIStore();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  // "노출=발행가능" 원칙(wiki/reference/channel-status.md) — 연결 UI는 12채널이지만
  // 대시보드 직접 발행은 SCHEDULABLE_PLATFORMS(threads/x/instagram/facebook)뿐이다.
  // 연결만 되고 발행이 안 되는 채널은 과장 없이 정직하게 안내한다.
  const publishReady = (SCHEDULABLE_PLATFORMS as readonly string[]).includes(provider);

  const connect = async () => {
    if (!activeWorkspace) {
      setMsg("워크스페이스를 먼저 선택하세요.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/connect/${provider}?tenant_id=${activeWorkspace.id}`, { headers: authHeaders() });
      const d = (await r.json()) as { authUrl?: string; error?: string };
      if (d.authUrl) {
        window.open(d.authUrl, "_blank", "width=620,height=760");
        setMsg("새 창에서 로그인·동의를 완료하면 연결됩니다.");
      } else {
        setMsg(oauthErrorMessage(d.error || "OAuth 앱 자격증명이 아직 설정되지 않았습니다.", label));
      }
    } catch (e) {
      setMsg(oauthErrorMessage(e instanceof Error ? e.message : "연결 실패", label));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-accent/40 bg-accent/10 p-3">
      <p className="text-xs text-muted mb-2">
        <b className="text-text">{label} OAuth 연결</b> — 버튼 한 번이면 끝. 비밀번호·토큰 입력 없이
        {label} 공식 로그인으로 안전하게 연결됩니다.
      </p>
      <button
        onClick={connect}
        disabled={busy}
        className="px-4 py-2 text-sm bg-accent text-text rounded-lg hover:bg-accent-hover disabled:opacity-50"
      >
        {busy ? "여는 중…" : `${label} OAuth 연결`}
      </button>
      {!publishReady && (
        <p className="text-[11px] text-warning mt-2" data-testid="publish-not-ready-badge">
          ⚠ 발행 준비 중 — 지금은 {label} 연결만 미리 가능하고, 대시보드에서 직접 발행은 아직
          지원하지 않습니다.
        </p>
      )}
      {msg && <p className="text-[11px] text-subtle mt-2">{msg}</p>}
    </div>
  );
}
