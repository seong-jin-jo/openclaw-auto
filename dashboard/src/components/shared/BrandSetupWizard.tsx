"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import type { Workspace } from "@/store/ui-store";

// 6문항 브랜드 셋업 위저드 → claude -p 증류 → brand_guides 저장
const FIELDS: { key: string; label: string; ph: string }[] = [
  { key: "service", label: "서비스 한 줄 소개", ph: "강남 진지한 만남 프리미엄 매칭 앱" },
  { key: "target", label: "타겟 고객", ph: "20-30대, 진지한 연애를 원하는 직장인" },
  { key: "tone", label: "톤 / 보이스", ph: "세련되고 따뜻함, 에디토리얼 매거진 톤" },
  { key: "banned", label: "금지어 / 금지 표현", ph: "'AI', 저렴, 과장 광고체" },
  { key: "hooks", label: "핵심 hook / 메시지", ph: "매일 정오 단 한 분, 큐피드가 고른 인연" },
  { key: "visual", label: "비주얼 (색·서체·분위기)", ph: "와인레드+골드, serif, 고급 스피크이지" },
];

export function BrandSetupWizard({
  workspace,
  onComplete,
  onDismiss,
}: {
  workspace: Workspace;
  onComplete: () => void;
  onDismiss: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/studio/brand-setup", {
        tenant_id: workspace.id,
        answers,
      });
      if (r?.ok) onComplete();
      else setErr(r?.error || "생성 실패");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-accent bg-surface/95 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(168,85,247,0.15)] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
          {workspace.name} 브랜드 설정
        </h2>
        <p className="text-xs text-subtle mb-4">6문항 → AI가 브랜드 톤 가이드로 증류 → 생성에 자동 반영</p>
        <div className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-subtle">{f.label}</label>
              <textarea
                value={answers[f.key] || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
                placeholder={f.ph}
                rows={2}
                className="mt-1 w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-muted resize-none focus:border-accent outline-none"
              />
            </div>
          ))}
        </div>
        {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
        <div className="flex items-center justify-between mt-5">
          <button onClick={onDismiss} className="text-xs text-subtle hover:text-muted">나중에</button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-2 text-sm bg-accent hover:from-accent hover:to-accent-hover text-text rounded-lg shadow-lg shadow-purple-900/30 disabled:opacity-50"
          >
            {busy ? "AI 증류 중…" : "브랜드 가이드 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}
