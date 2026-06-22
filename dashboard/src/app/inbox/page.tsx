"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface Post {
  id: string;
  text?: string;
  topic?: string;
  status?: string;
  generatedAt?: string;
  hashtags?: string[];
  videoUrl?: string;
  videoFilename?: string;
  videoThumbnail?: string;
  channels?: Record<string, unknown>;
}

// "Approve, don't author" — AI가 쓰고 사람은 승인만. 한 주치 초안을 90초에 스와이프 승인하는 모바일 우선 인박스.
// 검토 대상 = status=draft. 승인 → /approve, 거절 → /delete. 액션 후 다음 카드로.
export default function InboxPage() {
  const { data, mutate, isLoading } = useSWR<{ posts: Post[] }>("/api/queue?status=draft", fetcher);
  const { showToast } = useToast();

  const posts = data?.posts || [];
  const [idx, setIdx] = useState(0);
  const [scheduleHours, setScheduleHours] = useState(0);
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(0);

  // posts가 줄어들면 idx 보정
  useEffect(() => {
    if (idx >= posts.length && posts.length > 0) setIdx(posts.length - 1);
  }, [posts.length, idx]);

  const current = posts[idx];

  const advance = useCallback(() => {
    setIdx((i) => (i + 1 < posts.length ? i + 1 : i));
  }, [posts.length]);

  const approve = useCallback(async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      await apiPost(`/api/queue/${current.id}/approve`, { hours: scheduleHours });
      setApproved((n) => n + 1);
      await mutate();
      advance();
    } catch (e) {
      showToast(`승인 실패: ${(e as Error).message}`, "error");
    } finally {
      setBusy(false);
    }
  }, [current, busy, scheduleHours, mutate, advance, showToast]);

  const reject = useCallback(async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      await apiPost(`/api/queue/${current.id}/delete`, {});
      await mutate();
      advance();
    } catch (e) {
      showToast(`거절 실패: ${(e as Error).message}`, "error");
    } finally {
      setBusy(false);
    }
  }, [current, busy, mutate, advance, showToast]);

  // 데스크톱 단축키: A=승인, R=거절, ←/→ 이동
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "a" || e.key === "A") approve();
      else if (e.key === "r" || e.key === "R") reject();
      else if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, posts.length - 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [approve, reject, posts.length]);

  const channels = current?.channels ? Object.keys(current.channels) : [];
  const videoSrc = current?.videoUrl
    ? (current.videoUrl.startsWith("http") ? current.videoUrl : `/videos/${current.videoUrl}`)
    : current?.videoFilename
      ? `/videos/${current.videoFilename}`
      : "";

  return (
    <div className="px-4 sm:px-8 py-6 max-w-lg mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">승인 인박스</h2>
        <p className="text-xs text-gray-500 mt-1">AI가 쓴 초안을 빠르게 승인하세요. 승인한 글만 발행됩니다.</p>
      </div>

      {/* 진행률 */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-gray-400">
          {posts.length > 0 ? `${idx + 1} / ${posts.length}` : "0 / 0"} 검토 중
        </span>
        <span className="text-green-400">{approved}건 승인됨</span>
      </div>
      <div className="h-1 bg-gray-800 rounded mb-5 overflow-hidden">
        <div className="h-full bg-green-600 transition-all" style={{ width: posts.length ? `${(idx / posts.length) * 100}%` : "0%" }} />
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-500 text-sm">불러오는 중…</div>
      ) : posts.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-300 text-sm">검토할 초안이 없습니다 🎉</p>
          <p className="text-[11px] text-gray-500 mt-2">크론이 새 초안을 생성하거나, Studio/영상에서 만든 글이 여기로 모입니다.</p>
        </div>
      ) : !current ? (
        <div className="card p-8 text-center text-gray-500 text-sm">모두 검토 완료.</div>
      ) : (
        <div className="card p-4">
          {/* 채널 칩 */}
          {channels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {channels.map((ch) => (
                <span key={ch} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{ch}</span>
              ))}
            </div>
          )}

          {/* 영상 프리뷰(있으면) */}
          {videoSrc && (
            <div className="flex justify-center mb-3">
              <video src={videoSrc} controls playsInline className="rounded-lg bg-black w-full max-w-[240px] aspect-[9/16] object-contain" />
            </div>
          )}

          {/* 본문 */}
          <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed min-h-[80px]">{current.text || "(내용 없음)"}</p>

          {/* 해시태그 */}
          {current.hashtags && current.hashtags.length > 0 && (
            <p className="text-[11px] text-blue-400 mt-2">{current.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</p>
          )}

          <div className="mt-3 text-[10px] text-gray-600 flex items-center justify-between">
            <span>{current.topic || "post"}</span>
            <span>{current.generatedAt ? new Date(current.generatedAt).toLocaleString("ko-KR") : ""}</span>
          </div>

          {/* 예약 시점 */}
          <div className="mt-4 flex items-center gap-2 text-xs">
            <label className="text-gray-400">발행 시점</label>
            <select
              value={scheduleHours}
              onChange={(e) => setScheduleHours(Number(e.target.value))}
              className="bg-gray-800 text-gray-200 text-xs p-1.5 rounded border border-gray-700"
            >
              <option value={0}>지금(다음 발행 주기)</option>
              <option value={2}>2시간 뒤</option>
              <option value={6}>6시간 뒤</option>
              <option value={24}>내일</option>
              <option value={72}>3일 뒤</option>
            </select>
          </div>

          {/* 액션 */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={reject}
              disabled={busy}
              className="py-3 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800/60 text-sm font-medium disabled:opacity-50"
            >
              거절 <span className="text-[10px] opacity-60">(R)</span>
            </button>
            <button
              onClick={approve}
              disabled={busy}
              className="py-3 rounded-lg bg-green-600 text-white hover:bg-green-500 text-sm font-medium disabled:opacity-50"
            >
              승인 <span className="text-[10px] opacity-80">(A)</span>
            </button>
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-2">단축키: A 승인 · R 거절 · ← → 이동</p>
        </div>
      )}
    </div>
  );
}
