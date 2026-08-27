"use client";

import { useState, useEffect } from "react";
import { setupGuides } from "@/lib/setup-guides";
import { CredentialForm } from "./CredentialForm";
import { SetupGuide } from "./SetupGuide";
import { FreeEventBanner } from "./FreeEventBanner";
import { apiPost } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { SocialConnectButton } from "@/components/channel/SocialConnectButton";

const INDUSTRIES = [
  { key: "cafe", icon: "\u2615", name: "\uCE74\uD398", desc: "\uCE74\uD398 \xB7 \uB514\uC800\uD2B8 \xB7 \uC74C\uB8CC" },
  { key: "beauty", icon: "\u2728", name: "\uBDF0\uD2F0", desc: "\uBBF8\uC6A9\uC2E4 \xB7 \uB124\uC77C \xB7 \uD53C\uBD80\uAD00\uB9AC" },
  { key: "restaurant", icon: "\uD83C\uDF7D\uFE0F", name: "\uC74C\uC2DD\uC810", desc: "\uC2DD\uB2F9 \xB7 \uBC30\uB2EC \xB7 \uC694\uC2DD\uC5C5" },
  { key: "fitness", icon: "\uD83C\uDFCB\uFE0F", name: "\uD53C\uD2B8\uB2C8\uC2A4", desc: "\uD5EC\uC2A4\uC7A5 \xB7 PT \xB7 \uC694\uAC00" },
  { key: "shopping", icon: "\uD83D\uDECD\uFE0F", name: "\uC1FC\uD551", desc: "\uC758\uB958 \xB7 \uC7A1\uD654 \xB7 \uB9AC\uD14C\uC77C" },
  { key: "tech", icon: "\uD83D\uDCBB", name: "\uD14C\uD06C", desc: "IT \xB7 \uC18C\uD504\uD2B8\uC6E8\uC5B4 \xB7 \uAC00\uC82F" },
  { key: "education", icon: "\uD83D\uDCDA", name: "\uAD50\uC721", desc: "\uD559\uC6D0 \xB7 \uAC15\uC758 \xB7 \uC790\uAE30\uACC4\uBC1C" },
  { key: "general", icon: "\uD83D\uDE80", name: "\uAE30\uD0C0", desc: "\uBC94\uC6A9 \xB7 \uC9C1\uC811 \uC124\uC815" },
];

const CHANNELS = [
  { key: "threads", label: "Threads", icon: "T", iconClass: "bg-accent text-text" },
  { key: "x", label: "X", icon: "X", iconClass: "bg-surface-2 text-text" },
  { key: "instagram", label: "Instagram", icon: "IG", iconClass: "bg-gradient-to-br from-pink-500 to-orange-400 text-text" },
  { key: "facebook", label: "Facebook", icon: "F", iconClass: "bg-accent text-text" },
  { key: "telegram", label: "Telegram", icon: "TG", iconClass: "bg-blue-500 text-text" },
];
const OAUTH_LABELS: Record<string, string> = {
  threads: "Threads",
  x: "X (Twitter)",
  instagram: "Instagram",
  facebook: "Facebook",
};

interface OnboardingWizardProps {
  onComplete: () => void;
  onDismiss: () => void;
}

export function OnboardingWizard({ onComplete, onDismiss }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [showManualCreds, setShowManualCreds] = useState(false);

  // 입력 자동저장: 새로고침/이탈해도 업종·채널 선택 복원(온보딩 마찰 감소). 완료 시 클리어.
  const DRAFT_KEY = "osmu_onboarding_draft";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { industry?: string; channels?: string[] };
        if (d.industry) setIndustry(d.industry);
        if (Array.isArray(d.channels)) setSelectedChannels(d.channels);
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ industry, channels: selectedChannels })); } catch { /* ignore */ }
  }, [industry, selectedChannels]);
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } };

  const toggleChannel = (key: string) => {
    setSelectedChannels((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleNext = async () => {
    if (step === 1 && industry) {
      setStep(2);
    } else if (step === 2 && selectedChannels.length > 0) {
      setSaving(true);
      setError(null);
      try {
        const result = await apiPost("/api/onboarding", {
          industry,
          channels: selectedChannels,
        });
        if (result) {
          setStep(3);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다");
      } finally {
        setSaving(false);
      }
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      clearDraft();
      onComplete();
    }
  };

  const handleCredentialSave = async (keys: Record<string, string>) => {
    const firstChannel = selectedChannels[0];
    // 검증 경로: /api/channel-config/{channel} 에 flat keys 전송 → 실제 API verify + 계정 echo.
    const res = await fetch(`/api/channel-config/${firstChannel}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(keys),
    });
    const d = await res.json().catch(() => ({})) as { verified?: boolean; unverified?: boolean; reason?: string; account?: string; error?: string };
    if (!res.ok) {
      throw new Error(d.error || "저장 실패");
    }
    // 검증 실패(네트워크 아님)면 진행 막기 — 잘못된 키로 온보딩 통과 방지.
    if (!d.verified && !d.unverified) {
      throw new Error(d.error || "검증 실패. 키를 확인하세요");
    }
    setConnectedAccount(d.account || (d.unverified ? `저장됨 · 미검증${d.reason ? ". " + d.reason : ""}` : null));
    setCredentialsSaved(true);
  };

  const firstChannel = selectedChannels[0];
  const guide = firstChannel ? setupGuides[firstChannel] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-text">마케팅 자동화 시작하기</h2>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-1 rounded-full transition-colors ${
                    s <= step ? "bg-accent" : "bg-surface-2"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-subtle">
            {step === 1 && "업종을 선택하면 맞춤 콘텐츠 가이드가 자동 설정됩니다"}
            {step === 2 && "콘텐츠를 발행할 채널을 선택하세요"}
            {step === 3 && "첫 번째 채널을 연결하세요"}
            {step === 4 && "이제 콘텐츠를 만들 차례예요. 바로 시작할 수 있어요"}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Industry */}
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.key}
                  onClick={() => setIndustry(ind.key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    industry === ind.key
                      ? "border-accent bg-accent-soft ring-1 ring-accent/30"
                      : "border-border bg-surface/50 hover:border-border"
                  }`}
                >
                  <span className="text-2xl block mb-2">{ind.icon}</span>
                  <p className="text-sm font-medium text-text">{ind.name}</p>
                  <p className="text-caption text-subtle mt-0.5">{ind.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Channel selection */}
          {step === 2 && (
            <div className="space-y-3">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => toggleChannel(ch.key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    selectedChannels.includes(ch.key)
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-surface/50 hover:border-border"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${ch.iconClass} flex items-center justify-center text-sm font-bold flex-shrink-0`}
                  >
                    {ch.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-text">{ch.label}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedChannels.includes(ch.key)
                        ? "border-accent bg-accent"
                        : "border-border"
                    }`}
                  >
                    {selectedChannels.includes(ch.key) && (
                      <svg className="w-3 h-3 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
              {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
              )}
            </div>
          )}

          {/* Step 3: First channel setup */}
          {step === 3 && guide && (
            <div className="space-y-6">
              <div className="card p-4">
                <SetupGuide quick={guide.quick} detail={guide.detail} images={guide.images} />
              </div>
              {OAUTH_LABELS[firstChannel] && !credentialsSaved && (
                <div className="card p-4">
                  <SocialConnectButton provider={firstChannel} label={OAUTH_LABELS[firstChannel]} />
                  <p className="text-caption text-subtle mt-2">새 창에서 공식 로그인·동의를 마치면 연결됩니다. 필요할 때만 아래 수동 입력을 여세요.</p>
                  <button
                    type="button"
                    onClick={() => setShowManualCreds((v) => !v)}
                    className="mt-2 text-caption text-accent"
                  >
                    {showManualCreds ? "수동 입력 닫기" : "고급: 토큰 직접 입력"}
                  </button>
                </div>
              )}
              {!credentialsSaved && (!OAUTH_LABELS[firstChannel] || showManualCreds) && (
                <div className="card p-4">
                  <CredentialForm
                    channelKey={firstChannel}
                    fields={guide.fields}
                    labels={guide.labels}
                    currentKeys={{}}
                    onSave={handleCredentialSave}
                    connectLabel="수동 연결 + 검증"
                  />
                </div>
              )}
              {credentialsSaved && (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-success font-medium">채널이 연결되었습니다{connectedAccount ? `. ${connectedAccount}` : ""}</p>
                  <p className="text-xs text-subtle mt-1">다음을 눌러 콘텐츠 만들 준비로 넘어가세요</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: 콘텐츠 만들 준비 — 무료 이벤트 안내 + 다음 할 일(브랜드/생성) */}
          {step === 4 && (
            <div className="space-y-4">
              <FreeEventBanner />
              <p className="text-sm text-text">
                준비 끝! 이제 <b>브랜드를 알려주면</b> 그 톤·사실에 맞는 콘텐츠가 자동으로 만들어져요.
                지금 바로 해보거나, 나중에 스튜디오에서 해도 됩니다.
              </p>
              <div className="grid gap-2">
                <a href="/studio?setup=brand" onClick={clearDraft}
                  className="flex items-center gap-3 p-3 rounded-xl border border-accent bg-accent-soft hover:bg-accent/15 transition-colors">
                  <span className="text-xl">🎨</span>
                  <div>
                    <p className="text-sm font-medium text-text">브랜드 설정하기</p>
                    <p className="text-caption text-subtle">6가지만 답하면 끝나요. 내 위키나 홈페이지를 연결해도 됩니다</p>
                  </div>
                </a>
                <a href="/studio" onClick={clearDraft}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/50 hover:border-accent transition-colors">
                  <span className="text-xl">✍️</span>
                  <div>
                    <p className="text-sm font-medium text-text">바로 콘텐츠 만들기</p>
                    <p className="text-caption text-subtle">주제만 적으면 초안이 나와요</p>
                  </div>
                </a>
              </div>
              <p className="text-caption text-subtle">
                내 Claude(Anthropic) 키가 있으면 설정 → AI Engine에서 등록할 수 있어요(선택).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
          <button
            onClick={step >= 3 ? () => { clearDraft(); onComplete(); } : onDismiss}
            className="text-xs text-subtle hover:text-subtle transition-colors"
          >
            나중에 설정하기
          </button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm text-subtle hover:text-text transition-colors"
              >
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && !industry) ||
                (step === 2 && selectedChannels.length === 0) ||
                saving
              }
              className="px-6 py-2 bg-accent text-text text-sm rounded-lg hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "저장 중..." : step === 4 ? "완료" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
