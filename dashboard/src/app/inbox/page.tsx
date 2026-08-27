"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import type { VoiceTone } from "@/lib/voice-tone";

const TONE_SLIDERS: { key: keyof VoiceTone; left: string; right: string }[] = [
  { key: "formal", left: "격식", right: "구어" },
  { key: "humor", left: "진지", right: "유머" },
  { key: "energy", left: "담백", right: "열정" },
  { key: "length", left: "짧게", right: "길게" },
];

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
interface ProductSource { type?: string; owner?: string; repo?: string; path?: string; ref?: string; token?: string }

export default function InboxPage() {
  const { data, mutate, isLoading } = useSWR<{ posts: Post[] }>("/api/queue?status=draft", fetcher);
  const { data: psData, mutate: mutatePsrc } = useSWR<{ source: ProductSource | null }>("/api/product-source", fetcher);
  const { showToast } = useToast();

  const posts = data?.posts || [];
  const [idx, setIdx] = useState(0);
  const [scheduleHours, setScheduleHours] = useState(0);
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(0);
  const [seeding, setSeeding] = useState(false);

  // 제품 소스(제품-grounded 생성): repo changelog/README를 근거로 seed가 글 생성.
  const psrc = psData?.source || null;
  const [showSrc, setShowSrc] = useState(false);
  const [srcForm, setSrcForm] = useState({ owner: "", repo: "", path: "CHANGELOG.md", ref: "main", token: "" });
  const [savingSrc, setSavingSrc] = useState(false);
  const saveSrc = async () => {
    if (!srcForm.owner.trim() || !srcForm.repo.trim() || !srcForm.path.trim()) {
      showToast("owner/repo/path를 입력하세요", "error");
      return;
    }
    setSavingSrc(true);
    try {
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/product-source", { type: "github", ...srcForm });
      if (r?.ok) { showToast("제품 소스 연결됨. 이제 생성하면 제품 기반으로 작성됩니다.", "success"); setShowSrc(false); await mutatePsrc(); }
      else showToast(r?.error || "저장 실패", "error");
    } catch (e) {
      showToast(`오류: ${(e as Error).message}`, "error");
    } finally { setSavingSrc(false); }
  };

  // 브랜드 보이스 슬라이더(제품-grounded와 함께 생성 톤 제어).
  const { data: toneData, mutate: mutateTone } = useSWR<{ tone: VoiceTone }>("/api/voice-tone", fetcher);
  const [showTone, setShowTone] = useState(false);
  const [tone, setTone] = useState<VoiceTone | null>(null);
  useEffect(() => { if (toneData?.tone && !tone) setTone(toneData.tone); }, [toneData, tone]);
  const [savingTone, setSavingTone] = useState(false);
  const saveTone = async () => {
    if (!tone) return;
    setSavingTone(true);
    try {
      const r = await apiPost<{ ok?: boolean }>("/api/voice-tone", tone);
      if (r?.ok) { showToast("보이스 톤 저장됨. 다음 생성부터 반영됩니다.", "success"); await mutateTone(); }
    } catch (e) {
      showToast(`오류: ${(e as Error).message}`, "error");
    } finally { setSavingTone(false); }
  };

  // 빈 화면 박멸: 브랜드 톤 기반 초안 한 묶음 생성 → 인박스 즉시 채움.
  const seedDrafts = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const r = await apiPost<{ ok?: boolean; added?: number; error?: string }>("/api/queue/seed", { count: 7 });
      if (r?.ok) { showToast(`${r.added}개 초안 생성됨`, "success"); setIdx(0); await mutate(); }
      else showToast(r?.error || "생성 실패", "error");
    } catch (e) {
      showToast(`오류: ${(e as Error).message}`, "error");
    } finally {
      setSeeding(false);
    }
  };

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
    <div className="px-pad-inset sm:px-region py-stack-section max-w-lg mx-auto">
      <div className="mb-pad-inset">
        <h2 className="text-subheading font-bold text-text">승인 인박스</h2>
        <p className="text-caption text-subtle mt-micro">검수 승인 · AI·크론·Studio가 만든 초안을 승인·거절. 승인하면 예약 시각에 자동 발행 파이프라인이 게시합니다.</p>
      </div>

      {/* 제품 소스(제품-grounded): repo를 연결하면 "방금 만든 것"을 자동 홍보하는 글이 생성됨 */}
      <div className="mb-pad-inset text-caption">
        <button onClick={() => setShowSrc((v) => !v)} className="text-subtle hover:text-muted">
          {psrc?.owner ? `제품 소스: ${psrc.owner}/${psrc.repo}/${psrc.path}` : "제품 소스 연결 (선택. 저장소 기반 생성)"}
          <span className="ml-micro text-subtle">{showSrc ? "▲" : "▼"}</span>
        </button>
        {showSrc && (
          <div className="mt-stack-tight card p-stack grid grid-cols-2 gap-stack-tight">
            <input value={srcForm.owner} onChange={(e) => setSrcForm({ ...srcForm, owner: e.target.value })} placeholder="owner (예: my-gh-id)" className="bg-surface-2 p-stack-tight rounded-chip border border-border" />
            <input value={srcForm.repo} onChange={(e) => setSrcForm({ ...srcForm, repo: e.target.value })} placeholder="repo (예: my-product)" className="bg-surface-2 p-stack-tight rounded-chip border border-border" />
            <input value={srcForm.path} onChange={(e) => setSrcForm({ ...srcForm, path: e.target.value })} placeholder="path (예: CHANGELOG.md)" className="bg-surface-2 p-stack-tight rounded-chip border border-border" />
            <input value={srcForm.ref} onChange={(e) => setSrcForm({ ...srcForm, ref: e.target.value })} placeholder="ref (main)" className="bg-surface-2 p-stack-tight rounded-chip border border-border" />
            <input value={srcForm.token} onChange={(e) => setSrcForm({ ...srcForm, token: e.target.value })} placeholder="token (비공개 repo만)" type="password" className="bg-surface-2 p-stack-tight rounded-chip border border-border col-span-2" />
            <button onClick={saveSrc} disabled={savingSrc} className="col-span-2 py-stack-tight bg-accent hover:bg-accent-hover rounded-chip disabled:opacity-50">
              {savingSrc ? "저장 중…" : "연결 저장"}
            </button>
          </div>
        )}
      </div>

      {/* 브랜드 보이스 슬라이더: 보이고 조절 가능해 신뢰. 생성 톤 제어 */}
      <div className="mb-pad-inset text-caption">
        <button onClick={() => setShowTone((v) => !v)} className="text-subtle hover:text-muted">
          보이스 톤 {tone ? `(격식${100 - tone.formal}·유머${tone.humor}·열정${tone.energy})` : ""}
          <span className="ml-micro text-subtle">{showTone ? "▲" : "▼"}</span>
        </button>
        {showTone && tone && (
          <div className="mt-stack-tight card p-stack space-y-stack">
            {TONE_SLIDERS.map(({ key, left, right }) => (
              <div key={key}>
                <div className="flex justify-between text-caption text-subtle mb-micro">
                  <span>{left}</span><span>{right}</span>
                </div>
                <input
                  type="range" min={0} max={100} value={tone[key]}
                  onChange={(e) => setTone({ ...tone, [key]: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
              </div>
            ))}
            <button onClick={saveTone} disabled={savingTone} className="w-full py-stack-tight bg-accent hover:bg-accent-hover rounded-chip disabled:opacity-50">
              {savingTone ? "저장 중…" : "톤 저장"}
            </button>
          </div>
        )}
      </div>

      {/* 진행률 */}
      <div className="flex items-center justify-between mb-stack text-caption">
        <span className="text-subtle">
          {posts.length > 0 ? `${idx + 1} / ${posts.length}` : "0 / 0"} 검토 중
        </span>
        <span className="text-success">{approved}건 승인됨</span>
      </div>
      <progress
        className="progress-semantic mb-stack-section h-1 w-full"
        max={Math.max(posts.length, 1)}
        value={posts.length ? idx : 0}
        aria-label="승인 검토 진행률"
      />

      {isLoading ? (
        <div className="card p-region text-center text-subtle text-body-sm">불러오는 중…</div>
      ) : posts.length === 0 ? (
        <div className="card p-region text-center">
          <p className="text-muted text-body-sm">검토할 초안이 없습니다</p>
          <p className="text-caption text-subtle mt-stack-tight">AI가 브랜드 톤으로 한 묶음 만들어 드릴게요. 검토만 하면 됩니다.</p>
          <button
            onClick={seedDrafts}
            disabled={seeding}
            className="mt-pad-inset px-pad-inset py-stack-tight text-body-sm bg-success text-status-fg rounded-control hover:bg-success disabled:opacity-50"
          >
            {seeding ? "생성 중…" : "AI로 한 주치 초안 생성"}
          </button>
          <p className="text-caption text-subtle mt-stack">크론·Studio·영상에서 만든 글도 여기로 모입니다.</p>
        </div>
      ) : !current ? (
        <div className="card p-region text-center text-subtle text-body-sm">모두 검토 완료.</div>
      ) : (
        <div className="card p-pad-inset">
          {/* 채널 칩 */}
          {channels.length > 0 && (
            <div className="flex flex-wrap gap-micro mb-stack">
              {channels.map((ch) => (
                <span key={ch} className="text-caption px-stack-tight py-micro rounded-pill bg-surface-2 text-muted">{ch}</span>
              ))}
            </div>
          )}

          {/* 영상 프리뷰(있으면) */}
          {videoSrc && (
            <div className="flex justify-center mb-stack">
              <video src={videoSrc} controls playsInline className="rounded-control bg-player-surface w-full max-w-[240px] aspect-[9/16] object-contain" />
            </div>
          )}

          {/* 본문 */}
          <p className="text-body-sm text-text whitespace-pre-wrap leading-relaxed min-h-[80px]">{current.text || "(내용 없음)"}</p>

          {/* 해시태그 */}
          {current.hashtags && current.hashtags.length > 0 && (
            <p className="text-caption text-accent mt-stack-tight">{current.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</p>
          )}

          <div className="mt-stack text-caption text-subtle flex items-center justify-between">
            <span>{current.topic || "post"}</span>
            <span>{current.generatedAt ? new Date(current.generatedAt).toLocaleString("ko-KR") : ""}</span>
          </div>

          {/* 예약 시점 */}
          <div className="mt-pad-inset flex items-center gap-stack-tight text-caption">
            <label className="text-subtle">발행 시점</label>
            <select
              value={scheduleHours}
              onChange={(e) => setScheduleHours(Number(e.target.value))}
              className="bg-surface-2 text-muted text-caption p-stack-tight rounded-chip border border-border"
            >
              <option value={0}>지금(다음 발행 주기)</option>
              <option value={2}>2시간 뒤</option>
              <option value={6}>6시간 뒤</option>
              <option value={24}>내일</option>
              <option value={72}>3일 뒤</option>
            </select>
          </div>

          {/* 액션 */}
          <div className="mt-stack-section grid grid-cols-2 gap-stack">
            <button
              onClick={reject}
              disabled={busy}
              className="py-stack rounded-control bg-danger/15 text-danger hover:bg-danger/25 text-body-sm font-medium disabled:opacity-50"
            >
              거절 <span className="text-caption opacity-60">(R)</span>
            </button>
            <button
              onClick={approve}
              disabled={busy}
              className="py-stack rounded-control bg-success text-status-fg hover:bg-success text-body-sm font-medium disabled:opacity-50"
            >
              승인 <span className="text-caption opacity-80">(A)</span>
            </button>
          </div>
          <p className="text-caption text-subtle text-center mt-stack-tight">단축키: A 승인 · R 거절 · ← → 이동</p>
        </div>
      )}
    </div>
  );
}
