"use client";

import Link from "next/link";

interface PipelineTimelineProps {
  draft: number;
  approved: number;
  published: number;
  performing: number; // 성과 데이터(views)가 잡힌 발행물 수
}

const STAGES = [
  { key: "draft", label: "생성", desc: "초안", href: "/channels/threads", color: "from-warning/30 to-warning/10", text: "text-warning" },
  { key: "approved", label: "검수", desc: "승인 대기·완료", href: "/channels/threads", color: "from-accent/30 to-accent/10", text: "text-accent" },
  { key: "published", label: "배포", desc: "발행됨", href: "/channels/threads", color: "from-success/30 to-success/10", text: "text-success" },
  { key: "performing", label: "성과", desc: "반응 수집됨", href: "/", color: "from-accent/30 to-accent/10", text: "text-accent" },
] as const;

// 콘텐츠 파이프라인 퍼널: 생성 → 검수 → 배포 → 성과. per-item 조인이 아닌 단계별 카운트(가짜 조인 회피).
export function PipelineTimeline({ draft, approved, published, performing }: PipelineTimelineProps) {
  const counts: Record<string, number> = { draft, approved, published, performing };
  return (
    <div className="mb-stack-section">
      <h2 className="text-body-sm font-semibold text-muted mb-stack-tight">콘텐츠 파이프라인</h2>
      <div className="flex items-stretch gap-stack-tight">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-stretch flex-1">
            <Link href={s.href}
              className={`flex-1 rounded-surface border border-border bg-gradient-to-br ${s.color} px-pad-inset py-stack hover:border-border transition`}>
              <div className={`text-caption ${s.text}`}>{s.label}</div>
              <div className="text-heading font-bold text-text">{counts[s.key] ?? 0}</div>
              <div className="text-caption text-subtle">{s.desc}</div>
            </Link>
            {i < STAGES.length - 1 && <div className="flex items-center px-micro text-subtle">→</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
