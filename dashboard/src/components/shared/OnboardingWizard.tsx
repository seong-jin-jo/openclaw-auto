"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { apiPost } from "@/lib/api";
import type { CreateContentBranch } from "@/components/studio/StudioRooms";

const INDUSTRIES = [
  { key: "cafe", name: "카페", desc: "카페, 디저트, 음료" },
  { key: "beauty", name: "뷰티", desc: "미용실, 네일, 피부관리" },
  { key: "restaurant", name: "음식점", desc: "식당, 배달, 요식업" },
  { key: "fitness", name: "피트니스", desc: "헬스장, 운동 지도, 요가" },
  { key: "shopping", name: "쇼핑", desc: "의류, 잡화, 판매" },
  { key: "tech", name: "테크", desc: "정보기술, 소프트웨어, 기기" },
  { key: "education", name: "교육", desc: "학원, 강의, 자기계발" },
  { key: "general", name: "기타", desc: "직접 정하기" },
] as const;

const CONTENT_BRANCHES: { key: CreateContentBranch; name: string; desc: string }[] = [
  { key: "text_image", name: "글과 카드뉴스", desc: "글이나 여러 장의 이미지로 시작합니다" },
  { key: "video", name: "영상", desc: "짧은 영상의 장면 구성으로 시작합니다" },
];

const DRAFT_KEY = "osmu_onboarding_draft";
export const STUDIO_CONTENT_BRANCH_KEY = "studio_content_branch";

interface OnboardingWizardProps {
  onComplete: () => void;
  onDismiss: () => void;
}

interface OnboardingDraft {
  industry?: string;
  contentBranch?: CreateContentBranch;
}

export function OnboardingWizard({ onComplete, onDismiss }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState<string | null>(null);
  const [contentBranch, setContentBranch] = useState<CreateContentBranch | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as OnboardingDraft;
      if (draft.industry) setIndustry(draft.industry);
      if (draft.contentBranch === "text_image" || draft.contentBranch === "video") {
        setContentBranch(draft.contentBranch);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ industry, contentBranch }));
    } catch {
      return;
    }
  }, [industry, contentBranch]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      return;
    }
  };

  const handleNext = async () => {
    if (step === 1 && industry) {
      setStep(2);
      return;
    }
    if (step !== 2 || !contentBranch) return;

    setSaving(true);
    setError(null);
    try {
      await apiPost("/api/onboarding", { industry, contentBranch, channels: [] });
      setStep(3);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "저장하지 못했습니다");
    } finally {
      setSaving(false);
    }
  };

  const openStudio = () => {
    if (!contentBranch) return;
    try {
      sessionStorage.setItem(STUDIO_CONTENT_BRANCH_KEY, contentBranch);
    } catch {
      return;
    }
    clearDraft();
    onComplete();
    router.push("/studio?room=create");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-stack w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <header className="border-b border-border px-pad-inset py-stack-section">
          <div className="flex items-center justify-between gap-stack">
            <h2 className="text-heading font-bold text-text">첫 콘텐츠 만들기</h2>
            <div className="flex items-center gap-stack-tight" aria-label={`${step}단계, 전체 3단계`}>
              {[1, 2, 3].map((item) => (
                <span key={item} className={`h-1 w-8 rounded-full ${item <= step ? "bg-accent" : "bg-surface-2"}`} />
              ))}
            </div>
          </div>
          <p className="mt-stack-tight text-caption text-subtle">
            {step === 1 && "무슨 일을 알릴지 고르세요"}
            {step === 2 && "먼저 만들 갈래를 고르세요"}
            {step === 3 && "첫 콘텐츠를 만들 준비가 됐습니다"}
          </p>
        </header>

        <main className="max-h-[60vh] overflow-y-auto p-pad-inset">
          {step === 1 ? (
            <div className="grid grid-cols-2 gap-stack md:grid-cols-4">
              {INDUSTRIES.map((item) => (
                <Button key={item.key} variant={industry === item.key ? "primary" : "secondary"} aria-pressed={industry === item.key} onClick={() => setIndustry(item.key)} className="min-h-24 flex-col items-start text-left">
                  <span className="text-body font-semibold">{item.name}</span>
                  <span className="break-keep text-caption font-normal opacity-80">{item.desc}</span>
                </Button>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-stack md:grid-cols-2">
              {CONTENT_BRANCHES.map((item) => (
                <Button key={item.key} variant={contentBranch === item.key ? "primary" : "secondary"} aria-pressed={contentBranch === item.key} onClick={() => setContentBranch(item.key)} className="min-h-32 flex-col items-start text-left">
                  <span className="text-body font-semibold">{item.name}</span>
                  <span className="break-keep text-caption font-normal opacity-80">{item.desc}</span>
                </Button>
              ))}
              <p className="md:col-span-2 text-body-sm text-muted">채널은 발행 직전에 왼쪽 사이드바에서 연결합니다.</p>
              {error ? <p role="alert" className="md:col-span-2 text-caption text-danger">{error}</p> : null}
            </div>
          ) : null}

          {step === 3 ? (
            <section className="rounded-xl border border-border bg-surface-2 p-region text-center">
              <h3 className="text-subheading font-bold text-text">아직 만든 콘텐츠가 없습니다</h3>
              <p className="mx-auto mt-stack max-w-xl break-keep text-body-sm text-muted">고른 갈래로 첫 후보 세 장을 만듭니다. 채널 연결은 발행할 때 합니다.</p>
              <Button variant="primary" size="lg" onClick={openStudio} className="mt-pad-inset">생성실 열기</Button>
            </section>
          ) : null}
        </main>

        {step < 3 ? (
          <footer className="flex items-center justify-between border-t border-border px-pad-inset py-stack">
            <Button size="sm" onClick={step === 1 ? onDismiss : () => setStep(1)}>{step === 1 ? "나중에 하기" : "이전"}</Button>
            <Button variant="primary" onClick={handleNext} disabled={(step === 1 && !industry) || (step === 2 && !contentBranch) || saving}>{saving ? "저장 중" : "다음"}</Button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
