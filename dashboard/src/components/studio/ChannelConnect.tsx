"use client";

import { useState } from "react";
import { setupGuides } from "@/lib/setup-guides";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { authHeaders } from "@/lib/auth";
import { CredentialForm } from "@/components/shared/CredentialForm";
import { SetupGuide } from "@/components/shared/SetupGuide";
import { SocialConnectButton } from "@/components/channel/SocialConnectButton";
import type { Workspace } from "@/store/ui-store";

// 채널 연결 모달 — 검증 경로(/api/channel-config/{channel})로 통일.
// 저장 시 실제 API로 credential을 verify하고 계정(@username)을 echo. OnboardingWizard와 동일 경로.
// "연결 테스트"는 빈 body POST → 저장된 creds로 verify만 재실행(부작용 없음).
const CHANNELS = ["threads", "instagram", "x", "facebook", "linkedin", "youtube", "naver_blog", "pinterest", "tumblr", "tiktok", "slack", "line", "bluesky", "telegram", "discord"];
const LABELS: Record<string, string> = {
  threads: "Threads", instagram: "Instagram", x: "X", facebook: "Facebook",
  linkedin: "LinkedIn", youtube: "YouTube", naver_blog: "Naver Blog", pinterest: "Pinterest",
  tumblr: "Tumblr", tiktok: "TikTok", bluesky: "Bluesky", telegram: "Telegram", discord: "Discord", slack: "Slack", line: "LINE",
};
// Slack은 이번 출시에서 OAuth 앱(xoxb 봇 토큰)이 아니라 Incoming Webhook만 정직하게 지원한다
// (publishSlack이 meta.api==="slack_webhook"만 허용 — src/lib/publish.ts). 그래서 여기 목록에서
// 빼 CredentialForm(webhookUrl)이 기본으로 뜨게 한다 — OAuth 버튼을 남겨두면 연결은 되는데
// 발행은 거부되는 방식 충돌(설정 UI와 발행 로직 불일치)이 생긴다.
const OAUTH_LABELS: Record<string, string> = {
  threads: "Threads",
  instagram: "Instagram",
  x: "X (Twitter)",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  naver_blog: "Naver Blog",
  pinterest: "Pinterest",
  tumblr: "Tumblr",
  tiktok: "TikTok",
  line: "LINE",
};

interface VerifyResult { verified?: boolean; unverified?: boolean; reason?: string; account?: string; error?: string }

export function ChannelConnect({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) {
  const { data: cfg, mutate } = useChannelConfig();
  const [platform, setPlatform] = useState("threads");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [showManualCreds, setShowManualCreds] = useState(false);

  const guide = setupGuides[platform];
  const chCfg = (cfg?.[platform] as { connected?: boolean; keys?: Record<string, string> }) || {};
  const currentKeys = chCfg.keys || {};

  const post = async (body: Record<string, string>): Promise<VerifyResult> => {
    const res = await fetch(`/api/channel-config/${platform}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((d as { error?: string }).error || "저장 실패");
    return d as VerifyResult;
  };

  const handleSave = async (keys: Record<string, string>) => {
    setResult(null);
    const r = await post(keys);
    setResult(r);
    await mutate();
  };

  const testConnection = async () => {
    if (testing) return;
    setTesting(true); setResult(null);
    try {
      const r = await post({}); // 빈 body → 저장된 creds로 verify만 재실행
      setResult(r);
    } catch (e) {
      setResult({ error: (e as Error).message });
    } finally { setTesting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-accent bg-surface/95 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(168,85,247,0.15)] max-h-[88vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-bold bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">채널 연결</h2>
          <button onClick={onClose} className="text-subtle text-sm">✕</button>
        </div>
        <p className="text-xs text-subtle mb-4">{workspace.name} · 입력 후 저장하면 실제 API로 검증되고 계정이 확인됩니다</p>

        <div className="flex gap-2 mb-4 flex-wrap">
          {CHANNELS.map((c) => {
            const connected = Boolean((cfg?.[c] as { connected?: boolean })?.connected);
            return (
              <button key={c} onClick={() => { setPlatform(c); setResult(null); setShowManualCreds(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 ${platform === c ? "bg-accent text-text" : "bg-surface-2 text-subtle"}`}>
                {LABELS[c] || c}{connected && <span className="text-green-400">✓</span>}
              </button>
            );
          })}
        </div>

        {guide ? (
          <div className="grid md:grid-cols-2 gap-4">
            {/* 연결 중 인라인 가이드 — 따라만 하면 되도록 */}
            <div className="card p-4">
              <p className="text-xs font-medium text-muted mb-2">{LABELS[platform]} 연결 방법</p>
              <SetupGuide quick={guide.quick} detail={guide.detail} images={guide.images} />
            </div>
            <div className="card p-4">
              {OAUTH_LABELS[platform] && (
                <div className="mb-3">
                  <SocialConnectButton provider={platform} label={OAUTH_LABELS[platform]} />
                  <button
                    type="button"
                    onClick={() => setShowManualCreds((v) => !v)}
                    className="mt-2 text-[11px] text-accent"
                  >
                    {showManualCreds ? "수동 입력 닫기" : "고급: 토큰 직접 입력"}
                  </button>
                </div>
              )}
              {(!OAUTH_LABELS[platform] || showManualCreds) && (
                <>
                  <CredentialForm
                    channelKey={platform}
                    fields={guide.fields}
                    labels={guide.labels}
                    currentKeys={currentKeys}
                    onSave={handleSave}
                    connectLabel="수동 연결 + 검증"
                  />
                  <button onClick={testConnection} disabled={testing}
                    className="mt-3 w-full py-1.5 text-xs bg-surface-2 hover:bg-surface-2 text-muted rounded disabled:opacity-50">
                    {testing ? "테스트 중…" : "연결 테스트 (저장된 키 재검증)"}
                  </button>
                </>
              )}
              {OAUTH_LABELS[platform] && !showManualCreds && chCfg.connected && (
                <p className="mt-3 text-xs text-green-400">✓ OAuth 연결됨 — access token 원문은 화면에 표시하지 않습니다.</p>
              )}
              {result && (
                <div className="mt-3 text-xs">
                  {result.verified ? (
                    <p className="text-green-400">✓ 연결 완료{result.account ? ` — ${result.account}` : ""}</p>
                  ) : result.unverified ? (
                    <p className="text-amber-400">⚠ 저장됨 · 미검증{result.reason ? ` — ${result.reason}` : ""} (네트워크 복구 후 “연결 테스트”로 재확인)</p>
                  ) : (
                    <p className="text-red-400">✗ 검증 실패{result.error ? `: ${result.error}` : " — 키를 확인하세요"}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-subtle">이 채널은 아직 가이드가 준비되지 않았습니다.</p>
        )}
      </div>
    </div>
  );
}
