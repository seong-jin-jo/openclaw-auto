"use client";

import Link from "next/link";
import { useOnboardingStatus } from "@/hooks/useOnboarding";

interface ChecklistData {
  checklist?: { created?: boolean; channel?: boolean; published?: boolean; analytics?: boolean };
}

const STEPS: { key: "created" | "channel" | "published" | "analytics"; label: string; href?: string }[] = [
  { key: "created", label: "첫 콘텐츠 만들기", href: "/studio" },
  { key: "channel", label: "발행할 때 왼쪽 채널에서 연결" },
  { key: "published", label: "첫 콘텐츠 발행", href: "/studio" },
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
    <div className="mb-pad-inset px-pad-inset py-stack rounded-surface border border-accent bg-accent-soft">
      <div className="flex items-center justify-between mb-stack-tight">
        <span className="text-body-sm text-accent">첫 콘텐츠부터 발행까지</span>
        <span className="text-caption text-accent/80">{done}/{STEPS.length}</span>
      </div>
      <div className="flex flex-wrap gap-stack-tight">
        {STEPS.map((s) => {
          const ok = !!checklist[s.key];
          const classes = `flex items-center gap-stack-tight rounded-control bg-surface-2 px-stack py-stack-tight text-caption ${
            ok ? "text-success" : "text-muted"
          }`;
          return s.href ? (
            <Link key={s.key} href={s.href}
              className={`${classes} transition-colors hover:text-text`}>
              <span>{ok ? "완료" : "할 일"}</span>{s.label}
            </Link>
          ) : (
            <span key={s.key} className={classes}>
              <span>{ok ? "완료" : "발행 전"}</span>{s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
