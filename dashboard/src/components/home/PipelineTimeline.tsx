"use client";

import Link from "next/link";

interface PipelineTimelineProps {
  draft: number;
  approved: number;
  published: number;
  performing: number; // 성과 데이터(views)가 잡힌 발행물 수
}

const STAGES = [
  { key: "draft", label: "생성", desc: "초안", href: "/channels/threads", color: "from-yellow-600/30 to-yellow-700/10", text: "text-yellow-300" },
  { key: "approved", label: "검수", desc: "승인 대기·완료", href: "/channels/threads", color: "from-blue-600/30 to-blue-700/10", text: "text-accent" },
  { key: "published", label: "배포", desc: "발행됨", href: "/channels/threads", color: "from-green-600/30 to-green-700/10", text: "text-green-300" },
  { key: "performing", label: "성과", desc: "반응 수집됨", href: "/", color: "from-accent/30 to-purple-700/10", text: "text-accent" },
] as const;

// 콘텐츠 파이프라인 퍼널: 생성 → 검수 → 배포 → 성과. per-item 조인이 아닌 단계별 카운트(가짜 조인 회피).
export function PipelineTimeline({ draft, approved, published, performing }: PipelineTimelineProps) {
  const counts: Record<string, number> = { draft, approved, published, performing };
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted mb-2">콘텐츠 파이프라인</h2>
      <div className="flex items-stretch gap-2">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-stretch flex-1">
            <Link href={s.href}
              className={`flex-1 rounded-xl border border-border bg-gradient-to-br ${s.color} px-4 py-3 hover:border-border transition`}>
              <div className={`text-xs ${s.text}`}>{s.label}</div>
              <div className="text-2xl font-bold text-text">{counts[s.key] ?? 0}</div>
              <div className="text-[10px] text-subtle">{s.desc}</div>
            </Link>
            {i < STAGES.length - 1 && <div className="flex items-center px-1 text-subtle">→</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
