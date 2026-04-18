"use client";

import { useState } from "react";
import { setupGuides } from "@/lib/setup-guides";
import { CredentialForm } from "./CredentialForm";
import { SetupGuide } from "./SetupGuide";
import { apiPost } from "@/lib/api";

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
  { key: "threads", label: "Threads", icon: "T", iconClass: "bg-gradient-to-br from-purple-500 to-pink-500 text-white" },
  { key: "x", label: "X", icon: "X", iconClass: "bg-gray-700 text-white" },
  { key: "instagram", label: "Instagram", icon: "IG", iconClass: "bg-gradient-to-br from-pink-500 to-orange-400 text-white" },
  { key: "facebook", label: "Facebook", icon: "F", iconClass: "bg-blue-600 text-white" },
  { key: "telegram", label: "Telegram", icon: "TG", iconClass: "bg-blue-500 text-white" },
];

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
      onComplete();
    }
  };

  const handleCredentialSave = async (keys: Record<string, string>) => {
    const firstChannel = selectedChannels[0];
    const res = await fetch("/api/channel-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: firstChannel, keys }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error((d as { error?: string }).error || "저장 실패");
    }
    setCredentialsSaved(true);
  };

  const firstChannel = selectedChannels[0];
  const guide = firstChannel ? setupGuides[firstChannel] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">마케팅 자동화 시작하기</h2>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-1 rounded-full transition-colors ${
                    s <= step ? "bg-purple-500" : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {step === 1 && "업종을 선택하면 맞춤 콘텐츠 가이드가 자동 설정됩니다"}
            {step === 2 && "콘텐츠를 발행할 채널을 선택하세요"}
            {step === 3 && "첫 번째 채널을 연결하세요"}
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
                      ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30"
                      : "border-gray-800 bg-gray-900/50 hover:border-gray-600"
                  }`}
                >
                  <span className="text-2xl block mb-2">{ind.icon}</span>
                  <p className="text-sm font-medium text-white">{ind.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{ind.desc}</p>
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
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-gray-800 bg-gray-900/50 hover:border-gray-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${ch.iconClass} flex items-center justify-center text-sm font-bold flex-shrink-0`}
                  >
                    {ch.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white">{ch.label}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedChannels.includes(ch.key)
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-600"
                    }`}
                  >
                    {selectedChannels.includes(ch.key) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                <SetupGuide quick={guide.quick} detail={guide.detail} />
              </div>
              {!credentialsSaved && (
                <div className="card p-4">
                  <CredentialForm
                    channelKey={firstChannel}
                    fields={guide.fields}
                    labels={guide.labels}
                    currentKeys={{}}
                    onSave={handleCredentialSave}
                    connectLabel="연결하기"
                  />
                </div>
              )}
              {credentialsSaved && (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-green-400 font-medium">채널이 연결되었습니다</p>
                  <p className="text-xs text-gray-500 mt-1">완료를 눌러 대시보드로 이동하세요</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800/50 flex items-center justify-between">
          <button
            onClick={step === 3 ? onComplete : onDismiss}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            나중에 설정하기
          </button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
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
              className="px-6 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "저장 중..." : step === 3 ? "완료" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
