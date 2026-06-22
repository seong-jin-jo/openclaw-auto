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
  draft: "bg-gray-600",
  approved: "bg-blue-600",
  scheduled: "bg-blue-600",
  published: "bg-green-600",
  failed: "bg-red-600",
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
    <div className="px-4 sm:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">발행 캘린더</h2>
          <p className="text-xs text-gray-500 mt-1">예약·발행된 글을 한눈에. 큐와 같은 데이터, 다른 뷰.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => move(-1)} className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">←</button>
          <span className="text-white font-medium w-28 text-center">{ym.y}년 {ym.m + 1}월</span>
          <button onClick={() => move(1)} className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">→</button>
          <button onClick={() => { setYm({ y: today.getFullYear(), m: today.getMonth() }); setSelected(null); }} className="ml-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs">오늘</button>
        </div>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`text-[10px] text-center py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"}`}>{w}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} className="aspect-square sm:aspect-[4/3]" />;
          const k = keyOf(day);
          const dayPosts = byDate.get(k) || [];
          const isToday = k === todayKey;
          return (
            <button
              key={k}
              onClick={() => setSelected(selected === k ? null : k)}
              className={`aspect-square sm:aspect-[4/3] rounded p-1 text-left flex flex-col border ${selected === k ? "border-blue-500" : "border-transparent"} ${isToday ? "bg-blue-900/20" : "bg-gray-900/40"} hover:bg-gray-800/60`}
            >
              <span className={`text-[10px] ${isToday ? "text-blue-300 font-bold" : "text-gray-400"}`}>{day}</span>
              <div className="flex-1 overflow-hidden mt-0.5 space-y-0.5">
                {dayPosts.slice(0, 2).map((p) => (
                  <div key={p.id} className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLOR[p.status || "draft"] || "bg-gray-600"}`} />
                    <span className="text-[9px] text-gray-400 truncate">{(p.text || "").slice(0, 18) || "글"}</span>
                  </div>
                ))}
                {dayPosts.length > 2 && <div className="text-[9px] text-gray-500">+{dayPosts.length - 2}</div>}
              </div>
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-gray-500">
        <span><span className="inline-block w-2 h-2 rounded-full bg-gray-600 mr-1" />초안</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-1" />예약/승인</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-1" />발행</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-1" />실패</span>
      </div>

      {/* 선택 날짜 목록 */}
      {selected && (
        <div className="mt-5">
          <h3 className="text-sm text-gray-300 mb-2">{selected} · {selectedPosts.length}건</h3>
          {selectedPosts.length === 0 ? (
            <p className="text-xs text-gray-600">이 날짜에 글이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {selectedPosts.map((p) => (
                <div key={p.id} className="card p-3 text-xs flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${STATUS_COLOR[p.status || "draft"] || "bg-gray-600"}`} />
                  <div className="flex-1">
                    <p className="text-gray-200 line-clamp-2 whitespace-pre-wrap">{p.text || "(내용 없음)"}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{p.status || "draft"}</p>
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
