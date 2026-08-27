"use client";

import Link from "next/link";
import { useOnboardingStatus } from "@/hooks/useOnboarding";

interface ChecklistData {
  checklist?: { channel?: boolean; wiki?: boolean; published?: boolean; analytics?: boolean };
}

const STEPS: { key: "channel" | "wiki" | "published" | "analytics"; label: string; href: string }[] = [
  { key: "channel", label: "채널 1개 연결", href: "/settings?tab=channels" },
  { key: "wiki", label: "브랜드 위키 작성", href: "/studio" },
  { key: "published", label: "콘텐츠 1개 발행", href: "/channels/threads" },
  { key: "analytics", label: "성과 확인", href: "/" },
];

// 첫 로그인 이후 "가치 체감"까지의 4단계 체크리스트. 모두 완료되면 사라진다.
export function OnboardingChecklist() {
  const { data } = useOnboardingStatus();
  const checklist = (data as ChecklistData | undefined)?.checklist;
  if (!checklist) return null;

  const done = STEPS.filter((s) => checklist[s.key]).length;
  if (done >= STEPS.length) return null; // 전부 완료 → 숨김

  return (
    <div className="mb-4 px-4 py-3 rounded-xl border border-accent bg-accent-soft">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-accent">🚀 시작 체크리스트. 여기까지 하면 혼자서도 가치를 체감합니다</span>
        <span className="text-xs text-accent/80">{done}/{STEPS.length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s) => {
          const ok = !!checklist[s.key];
          return (
            <Link key={s.key} href={s.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
                ok ? "bg-success/15 text-success" : "bg-surface-2 text-muted hover:bg-surface-2"
              }`}>
              <span>{ok ? "✓" : "○"}</span>{s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
