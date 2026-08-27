"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

interface Post {
  id: string;
  text?: string;
  status?: string;
  scheduledAt?: string | null;
  approvedAt?: string | null;
  generatedAt?: string | null;
  publishedAt?: string | null;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-surface-2",
  approved: "bg-accent",
  scheduled: "bg-accent",
  published: "bg-success",
  failed: "bg-danger",
};

// 게시물의 대표 날짜: 예약>발행>승인>생성 순.
function postDate(p: Post): string | null {
  const raw = p.scheduledAt || p.publishedAt || p.approvedAt || p.generatedAt;
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  // 로컬 날짜 키 YYYY-MM-DD
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const { data } = useSWR<{ posts: Post[] }>("/api/queue?status=all", fetcher);
  const posts = useMemo(() => data?.posts || [], [data]);

  // 표시 기준 연/월(0-index month)
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const k = postDate(p);
      if (!k) continue;
      (map.get(k) || map.set(k, []).get(k)!).push(p);
    }
    return map;
  }, [posts]);

  const first = new Date(ym.y, ym.m, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const keyOf = (day: number) => `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const move = (delta: number) => {
    const d = new Date(ym.y, ym.m + delta, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(null);
  };

  const selectedPosts = selected ? byDate.get(selected) || [] : [];

  return (
    <div className="px-pad-inset sm:px-region py-stack-section">
      <div className="flex items-center justify-between mb-pad-inset">
        <div>
          <h2 className="text-subheading font-bold text-text">발행 캘린더</h2>
          <p className="text-caption text-subtle mt-micro">예약·발행된 글을 한눈에. 큐와 같은 데이터, 다른 뷰.</p>
        </div>
        <div className="flex items-center gap-stack-tight text-body-sm">
          <button onClick={() => move(-1)} className="px-stack-tight py-micro rounded-chip bg-surface-2 hover:bg-surface-2 text-muted">←</button>
          <span className="text-text font-medium w-28 text-center">{ym.y}년 {ym.m + 1}월</span>
          <button onClick={() => move(1)} className="px-stack-tight py-micro rounded-chip bg-surface-2 hover:bg-surface-2 text-muted">→</button>
          <button onClick={() => { setYm({ y: today.getFullYear(), m: today.getMonth() }); setSelected(null); }} className="ml-micro px-stack-tight py-micro rounded-chip bg-surface-2 hover:bg-surface-2 text-subtle text-caption">오늘</button>
        </div>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 gap-micro mb-micro">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`text-caption text-center py-micro ${i === 0 ? "text-danger" : i === 6 ? "text-accent" : "text-subtle"}`}>{w}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-micro">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} className="aspect-square sm:aspect-[4/3]" />;
          const k = keyOf(day);
          const dayPosts = byDate.get(k) || [];
          const isToday = k === todayKey;
          return (
            <button
              key={k}
              onClick={() => setSelected(selected === k ? null : k)}
              className={`aspect-square sm:aspect-[4/3] rounded-chip p-micro text-left flex flex-col border ${selected === k ? "border-accent" : "border-transparent"} ${isToday ? "bg-accent-soft" : "bg-surface/40"} hover:bg-surface-2/60`}
            >
              <span className={`text-caption ${isToday ? "text-accent font-bold" : "text-subtle"}`}>{day}</span>
              <div className="flex-1 overflow-hidden mt-micro space-y-micro">
                {dayPosts.slice(0, 2).map((p) => (
                  <div key={p.id} className="flex items-center gap-micro">
                    <span className={`w-1.5 h-1.5 rounded-pill shrink-0 ${STATUS_COLOR[p.status || "draft"] || "bg-surface-2"}`} />
                    <span className="text-caption text-subtle truncate">{(p.text || "").slice(0, 18) || "글"}</span>
                  </div>
                ))}
                {dayPosts.length > 2 && <div className="text-caption text-subtle">+{dayPosts.length - 2}</div>}
              </div>
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-stack mt-stack text-caption text-subtle">
        <span><span className="inline-block w-2 h-2 rounded-pill bg-surface-2 mr-micro" />초안</span>
        <span><span className="inline-block w-2 h-2 rounded-pill bg-accent mr-micro" />예약/승인</span>
        <span><span className="inline-block w-2 h-2 rounded-pill bg-success mr-micro" />발행</span>
        <span><span className="inline-block w-2 h-2 rounded-pill bg-danger mr-micro" />실패</span>
      </div>

      {/* 선택 날짜 목록 */}
      {selected && (
        <div className="mt-stack-section">
          <h3 className="text-body-sm text-muted mb-stack-tight">{selected} · {selectedPosts.length}건</h3>
          {selectedPosts.length === 0 ? (
            <p className="text-caption text-subtle">이 날짜에 글이 없습니다.</p>
          ) : (
            <div className="space-y-stack-tight">
              {selectedPosts.map((p) => (
                <div key={p.id} className="card p-stack text-caption flex items-start gap-stack-tight">
                  <span className={`w-2 h-2 rounded-pill mt-micro shrink-0 ${STATUS_COLOR[p.status || "draft"] || "bg-surface-2"}`} />
                  <div className="flex-1">
                    <p className="text-muted line-clamp-2 whitespace-pre-wrap">{p.text || "(내용 없음)"}</p>
                    <p className="text-caption text-subtle mt-micro">{p.status || "draft"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
