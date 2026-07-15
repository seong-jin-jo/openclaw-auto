"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { PlatformPreview, type PreviewPlatform } from "@/components/studio/PlatformPreview";
import { useUIStore } from "@/store/ui-store";
import { BrandSetupWizard } from "@/components/shared/BrandSetupWizard";
import { RepoConnect } from "@/components/studio/RepoConnect";
import { SchedulePanel } from "@/components/studio/SchedulePanel";
import { trackEvent, type AnalyticsChannel } from "@/lib/analytics/events";

interface TextVariants {
  threads?: string; x?: string;
  instagram?: { caption?: string; hashtags?: string[]; slides?: string[] };
  shorts?: { hook?: string; body?: string; cta?: string };
  image_prompt?: string;
}
interface ImgResult { url: string; file: string; localPath: string }
interface VidResult { url: string; file: string; model: string }
type PubStatus = "wait" | "doing" | "done";

const GROUPS: { title: string; platforms: PreviewPlatform[] }[] = [
  { title: "✍️ 텍스트", platforms: ["threads", "x", "facebook"] },
  { title: "🎬 영상 9:16", platforms: ["shorts", "reels", "tiktok"] },
  { title: "🖼️ 카드뉴스", platforms: ["instagram"] },
];
const ALL: PreviewPlatform[] = ["threads", "x", "facebook", "instagram", "shorts", "reels", "tiktok"];
// 발행 완료 뱃지 클릭 시 이동할 URL (시뮬: 플랫폼 위치. 실 발행 연동 시 게시물 permalink로 대체)
const POST_URL: Record<string, string> = {
  threads: "https://www.threads.net", x: "https://x.com", facebook: "https://www.facebook.com",
  instagram: "https://www.instagram.com", shorts: "https://www.youtube.com/shorts",
  reels: "https://www.instagram.com/reels", tiktok: "https://www.tiktok.com",
};
const isVideo = (p: PreviewPlatform) => p === "shorts" || p === "reels" || p === "tiktok";

export default function StudioPage() {
  const { showToast } = useToast();
  const { activeWorkspace } = useUIStore();
  const { data: acct, mutate: mutateAcct } = useSWR<{ credits?: number; needsLogin?: boolean }>("/api/higgsfield/status", fetcher);
  const { data: engine } = useSWR<{ mode?: string; label?: string; model?: string; error?: string }>(
    activeWorkspace ? `/api/studio/engine-status?tenant_id=${activeWorkspace.id}` : "/api/studio/engine-status",
    fetcher,
  );
  const { data: hist, mutate: mutateHist } = useSWR<{ drafts: Array<Record<string, unknown>> }>(activeWorkspace ? `/api/studio/drafts?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const { data: brandData, mutate: mutateBrand } = useSWR<{ guide: { prompt_guide?: string } | null }>(
    activeWorkspace ? `/api/studio/brand-setup?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const [showWizard, setShowWizard] = useState(false);
  const [showRepo, setShowRepo] = useState(false); // 레포 위키 연동 모달
  const [showSchedule, setShowSchedule] = useState(false); // P6 예약 발행 패널 토글
  const [autoGen, setAutoGen] = useState(false);           // P8 AI 자동초안 진행중

  const [idea, setIdea] = useState("");
  const [guide, setGuide] = useState("");
  // 활성 워크스페이스 브랜드 가이드 → 생성에 자동 주입(P3)
  useEffect(() => { if (brandData?.guide?.prompt_guide) setGuide(brandData.guide.prompt_guide); }, [brandData]);
  // 온보딩 위저드에서 "브랜드 설정하기"(/studio?setup=brand)로 오면 브랜드 위저드 자동 오픈.
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("setup") === "brand") {
      setShowWizard(true);
    }
  }, []);
  const [withVideo, setWithVideo] = useState(true);
  const [videoModel, setVideoModel] = useState("minimax_hailuo");
  const [busy, setBusy] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [text, setText] = useState<TextVariants | null>(null);
  const [img, setImg] = useState<ImgResult | null>(null);
  const [vid, setVid] = useState<VidResult | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [includes, setIncludes] = useState<Record<string, boolean>>(Object.fromEntries(ALL.map((p) => [p, true])));
  const [editing, setEditing] = useState<PreviewPlatform | null>(null);
  const [showTx, setShowTx] = useState(false);
  const { data: tx } = useSWR<{ items?: Array<{ display_name?: string; credits?: number; action?: string; created_at?: string; output?: string | null; outputKind?: string | null }> }>(showTx ? "/api/higgsfield/transactions?size=25" : null, fetcher);

  const [pub, setPub] = useState<{ running: boolean; status: Record<string, PubStatus>; urls: Record<string, string> }>({ running: false, status: {}, urls: {} });
  const cancelRef = useRef(false);

  // ── 드로어 리사이즈 ──
  const [drawerW, setDrawerW] = useState(480);
  const dragRef = useRef(false);
  const onDrag = useCallback((e: MouseEvent) => { if (dragRef.current) setDrawerW(Math.min(900, Math.max(340, window.innerWidth - e.clientX))); }, []);
  useEffect(() => {
    const up = () => (dragRef.current = false);
    window.addEventListener("mousemove", onDrag); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", onDrag); window.removeEventListener("mouseup", up); };
  }, [onDrag]);

  // ── 작업 데이터 유지 (나갔다 와도 복원) ──
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("studio_work");
      if (raw) {
        const w = JSON.parse(raw);
        setIdea(w.idea || ""); setText(w.text || null); setImg(w.img || null); setVid(w.vid || null);
        if (w.includes) setIncludes(w.includes); setDraftId(w.draftId || null);
      }
    } catch { /* noop */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return; // 첫 렌더(복원 전) 빈 상태로 덮어쓰기 방지
    try { localStorage.setItem("studio_work", JSON.stringify({ idea, text, img, vid, includes, draftId })); } catch { /* noop */ }
  }, [hydrated, idea, text, img, vid, includes, draftId]);

  const media = { imgUrl: img?.file, vidUrl: vid?.file };
  const upText = (patch: Partial<TextVariants>) => setText((p) => ({ ...(p || {}), ...patch }));
  const upIg = (patch: Partial<NonNullable<TextVariants["instagram"]>>) => setText((p) => ({ ...(p || {}), instagram: { ...(p?.instagram || {}), ...patch } }));

  async function genText() {
    setLastError(null);
    const r = await apiPost<TextVariants & { ok?: boolean; error?: string }>("/api/studio/text", { idea, guide, tenant_id: activeWorkspace?.id });
    if (!r?.ok) { const msg = r?.error || "텍스트 생성 실패"; setLastError(`텍스트: ${msg}`); showToast(msg, "error"); return null; }
    // API가 성공을 확인한 뒤에만 발행 — 클릭 시점 아님.
    trackEvent({ name: "content_generate", params: { kind: "text" } });
    setText(r); return r;
  }
  async function genImage(prompt: string) {
    setLastError(null);
    const r = await apiPost<ImgResult & { ok?: boolean; error?: string; nsfw?: boolean; credits?: boolean }>("/api/higgsfield/image", { prompt, aspectRatio: "9:16", label: idea });
    if (!r?.ok) { const msg = r?.credits ? "Higgsfield 크레딧 부족" : r?.nsfw ? "Higgsfield NSFW 차단" : (r?.error || "이미지 실패"); setLastError(`이미지: ${msg}`); showToast(msg, "error"); return null; }
    setImg(r); mutateAcct(); return r;
  }
  async function genVideo(localPath: string) {
    setLastError(null);
    const s = text?.shorts;
    const narration = [s?.hook, s?.body, s?.cta].filter(Boolean).join(". ");
    const r = await apiPost<VidResult & { ok?: boolean; error?: string; nsfw?: boolean; credits?: boolean }>("/api/higgsfield/video", { localPath, prompt: "subtle idle motion, gentle glow, fixed camera", model: videoModel, narration, label: idea });
    if (!r?.ok) { const msg = r?.nsfw ? "Higgsfield NSFW 차단" : r?.credits ? "Higgsfield 크레딧 부족" : (r?.error || "영상 실패"); setLastError(`영상: ${msg}`); showToast(msg, "error"); return null; }
    setVid(r); mutateAcct(); return r;
  }
  async function runOSMU() {
    if (!idea.trim()) { showToast("글감을 입력하세요", "error"); return; }
    setLastError(null);
    setText(null); setImg(null); setVid(null); setDraftId(null);
    try {
      setBusy("텍스트 변형 생성 중..."); const t = await genText(); if (!t) return;
      setBusy("히어로 이미지 생성 중..."); const image = await genImage(t.image_prompt || idea);
      if (image && withVideo) { setBusy("숏폼 영상 생성 중 (1~2분)..."); await genVideo(image.localPath); }
      showToast("OSMU 생성 완료", "success");
    } finally { setBusy(null); }
  }
  // P8: AI 자동초안 — 브랜드 가이드 + 글감을 소스로 후보 초안 N개를 생성(status=draft).
  // 게이트웨이 크론(generate-drafts)의 수동 대응. /api/sourcing 재사용(longform→후보 청킹).
  async function autoGenerate() {
    if (!activeWorkspace) { showToast("워크스페이스를 선택하세요", "error"); return; }
    const seed = [guide, idea].filter(Boolean).join("\n\n").trim();
    if (seed.length < 50) { showToast("브랜드 가이드 설정 또는 글감을 더 입력하세요 (최소 50자)", "error"); return; }
    setAutoGen(true);
    try {
      const r = await apiPost<{ ok?: boolean; savedDrafts?: number; error?: string }>("/api/sourcing", {
        tenant_id: activeWorkspace.id, longform_text: seed, count: 5,
      });
      if (r?.ok) { showToast(`AI 자동초안 ${r.savedDrafts ?? 0}개 생성됨 — 발행 이력에서 확인`, "success"); mutateHist(); }
      else showToast(r?.error || "자동초안 생성 실패", "error");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "자동초안 생성 실패", "error");
    } finally { setAutoGen(false); }
  }
  async function save(status: "draft" | "published" | "stopped" = "draft") {
    const r = await apiPost<{ id?: string }>("/api/studio/drafts", { tenant_id: activeWorkspace?.id, id: draftId, idea, text, img, vid, includes, status, publishedAt: status === "published" ? new Date().toISOString() : undefined });
    if (r?.id) setDraftId(r.id); mutateHist(); return r?.id;
  }
  // 플랫폼별 발행 텍스트 추출
  function platformText(p: PreviewPlatform): string {
    if (!text) return "";
    if (p === "threads" || p === "facebook") return text.threads || "";
    if (p === "x") return text.x || "";
    if (p === "instagram") return text.instagram?.caption || "";
    return [text.shorts?.hook, text.shorts?.body, text.shorts?.cta].filter(Boolean).join("\n") || text.threads || "";
  }

  async function publish() {
    if (!text) return;
    if (!activeWorkspace) { showToast("워크스페이스를 선택하세요", "error"); return; }
    const did = await save("draft");
    const targets = ALL.filter((p) => includes[p]);
    if (!targets.length) { showToast("발행할 플랫폼을 선택하세요", "error"); return; }
    cancelRef.current = false;
    const status: Record<string, PubStatus> = {}; targets.forEach((p) => (status[p] = "wait"));
    const urls: Record<string, string> = {};
    const errs: string[] = [];
    setPub({ running: true, status: { ...status }, urls: {} });
    for (const p of targets) {
      if (cancelRef.current) break;
      status[p] = "doing"; setPub({ running: true, status: { ...status }, urls: { ...urls } });
      try {
        // 실 발행: /api/publish (테넌트 채널 토큰). 토큰 없으면 graceful 에러.
        // publish_attempt = 실제 제출 시점(클릭 즉시가 아니라 이 루프 진입 시점). publish_success는
        // API가 ok:true를 반환한 뒤에만 — 낙관적 발행 금지.
        trackEvent({ name: "publish_attempt", params: { channel: p as AnalyticsChannel } });
        const r = await apiPost<{ ok?: boolean; permalink?: string; error?: string }>("/api/publish", {
          tenant_id: activeWorkspace.id, platform: p, text: platformText(p), image_url: img?.url, draft_id: did,
        });
        if (r?.ok) { urls[p] = r.permalink || POST_URL[p] || "#"; trackEvent({ name: "publish_success", params: { channel: p as AnalyticsChannel } }); }
        else errs.push(`${LABEL[p]}: ${r?.error || "실패"}`);
      } catch (e) { errs.push(`${LABEL[p]}: ${e instanceof Error ? e.message : "오류"}`); }
      status[p] = "done"; setPub({ running: true, status: { ...status }, urls: { ...urls } });
    }
    const stopped = cancelRef.current; setPub({ running: false, status: { ...status }, urls: { ...urls } });
    await save(stopped ? "stopped" : "published");
    if (stopped) showToast("발행 중지됨", "error");
    else if (errs.length) showToast(`발행 결과 — ${errs.join(" / ")}`.slice(0, 180), "error");
    else showToast("발행 완료 ✓", "success");
  }
  function loadDraft(d: Record<string, unknown>) {
    setIdea((d.idea as string) || ""); setText((d.text as TextVariants) || null);
    setImg((d.img as ImgResult) || null); setVid((d.vid as VidResult) || null);
    setIncludes((d.includes as Record<string, boolean>) || includes); setDraftId(d.id as string);
    showToast("불러옴 — 수정 후 재발행 가능", "success");
  }
  const pubPct = (() => { const v = Object.values(pub.status); return v.length ? Math.round((v.filter((s) => s === "done").length / v.length) * 100) : 0; })();
  const LABEL: Record<string, string> = { threads: "Threads", x: "X", facebook: "Facebook", instagram: "Instagram", shorts: "Shorts", reels: "Reels", tiktok: "TikTok" };

  return (
    <div className="px-6 py-5">
      {showWizard && activeWorkspace && (
        <BrandSetupWizard
          workspace={activeWorkspace}
          onComplete={() => { setShowWizard(false); mutateBrand(); showToast("브랜드 가이드 저장됨"); }}
          onDismiss={() => setShowWizard(false)}
        />
      )}
      {showRepo && activeWorkspace && <RepoConnect workspace={activeWorkspace} onSynced={() => { mutateBrand(); showToast("브랜드 가이드 갱신됨"); }} onClose={() => setShowRepo(false)} />}
      {/* 상단 바 */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="mr-1">
          <b className="text-lg text-text">OSMU Studio</b>
          <p className="text-[10px] text-subtle leading-tight">직접 저작 · 생성→즉시 발행/예약</p>
        </div>
        <div className="text-[10px] px-2 py-1 rounded border border-border bg-surface-2 text-subtle" title={engine?.error || engine?.model || ""}>
          AI <b className="text-muted">{engine?.label || "확인 중"}</b>{engine?.mode === "claude-p" ? " · claude -p" : ""}{engine?.mode === "unknown" ? " · 확인 실패" : ""}
        </div>
        <input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="글감 / 콘텐츠 주제 입력" className="flex-1 min-w-[260px] bg-surface-2 text-text text-sm p-2.5 rounded border border-border" />
        <select value={videoModel} onChange={(e) => setVideoModel(e.target.value)} className="bg-surface-2 text-muted text-xs p-2 rounded border border-border"><option value="minimax_hailuo">Minimax 6cr</option><option value="veo3_1_lite">Veo3.1 8cr</option><option value="kling3_0">Kling3 10cr</option><option value="marketing_studio_video">MS UGC광고 ~40cr</option></select>
        <label className="flex items-center gap-1.5 text-xs text-subtle"><input type="checkbox" checked={withVideo} onChange={(e) => setWithVideo(e.target.checked)} />영상</label>
        {activeWorkspace && <button onClick={() => setShowWizard(true)} className="text-xs px-2.5 py-2 rounded border border-accent text-accent hover:bg-accent-soft" title="브랜드 톤 설정">{brandData?.guide?.prompt_guide ? "🎨 브랜드 ✓" : "🎨 브랜드 설정"}</button>}
        {activeWorkspace && <button onClick={() => setShowRepo(true)} className="text-xs px-2.5 py-2 rounded border border-accent text-accent hover:bg-accent-soft" title="GitHub 레포 위키 연동 → 브랜드 가이드">📚 위키</button>}
        <button onClick={runOSMU} disabled={!!busy} className="px-4 py-2 text-sm bg-accent hover:from-accent hover:to-accent-hover text-text rounded-lg shadow-lg shadow-purple-900/30 disabled:opacity-50">{busy || "OSMU 생성"}</button>
        {activeWorkspace && <button onClick={autoGenerate} disabled={autoGen} className="px-3 py-2 text-sm rounded border border-accent text-accent hover:bg-accent-soft disabled:opacity-50" title="브랜드 가이드 기반 자동초안 생성">{autoGen ? "생성 중…" : "✨ AI 자동초안"}</button>}
        {text && <button onClick={() => save("draft")} className="px-3 py-2 text-sm bg-surface-2 text-text rounded">💾 Save</button>}
        {text && <button onClick={publish} disabled={pub.running} className="px-3 py-2 text-sm bg-green-600 text-text rounded disabled:opacity-50">🚀 Publish ({ALL.filter((p) => includes[p]).length})</button>}
        {text && activeWorkspace && <button onClick={() => setShowSchedule((v) => !v)} className={`px-3 py-2 text-sm rounded border ${showSchedule ? "border-accent text-accent bg-accent-soft" : "border-accent text-accent hover:bg-accent-soft"}`} title="예약 발행">🗓️ 예약</button>}
        <div className="relative">
          <button onClick={() => setShowTx((v) => !v)} className="text-xs text-subtle hover:text-muted" title="사용 이력 보기">
            크레딧 <b className={acct?.needsLogin ? "text-red-400" : "text-green-400"}>{acct?.needsLogin ? "로그인필요" : acct?.credits?.toFixed(2) ?? "..."}</b> ▾
          </button>
          {showTx && (
            <div className="absolute right-0 top-7 z-50 w-72 max-h-80 overflow-y-auto card p-3 shadow-xl">
              <div className="flex justify-between items-center mb-2"><b className="text-xs text-muted">크레딧 사용 이력</b><button onClick={() => setShowTx(false)} className="text-subtle text-xs">✕</button></div>
              {!tx ? <p className="text-[11px] text-subtle">불러오는 중…</p>
                : (tx.items || []).length === 0 ? <p className="text-[11px] text-subtle">내역 없음</p>
                : (tx.items || []).map((t, i) => (
                  <div key={i} className="flex justify-between items-center border-t border-border py-1.5 text-[11px]">
                    <div className="min-w-0 pr-2"><div className="text-muted">{t.display_name}</div>
                      {t.output && <div className="text-accent truncate">{t.outputKind === "video" ? "🎬" : "🖼️"} {t.output}</div>}
                      <div className="text-subtle">{String(t.created_at || "").slice(5, 16).replace("T", " ")}</div></div>
                    <span className={Number(t.credits) < 0 ? "text-red-400" : "text-green-400"}>{Number(t.credits) > 0 ? "+" : ""}{t.credits}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      {lastError && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          마지막 실패: {lastError}
        </div>
      )}

      {/* 발행 진행 */}
      {(pub.running || pubPct > 0) && (
        <div className="card p-3 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full grid place-items-center shrink-0" style={{ background: `conic-gradient(#16a34a ${pubPct}%, #333 ${pubPct}%)` }}><div className="w-9 h-9 rounded-full bg-bg grid place-items-center text-[11px] font-bold text-green-400">{pubPct}%</div></div>
          <div className="flex-1"><div className="flex justify-between"><b className="text-sm text-text">{pub.running ? "발행 중…" : pubPct === 100 ? "발행 완료" : "중지됨"}</b>{pub.running && <button onClick={() => (cancelRef.current = true)} className="px-3 py-1 text-xs bg-red-700 text-text rounded">■ 중지</button>}</div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">{Object.entries(pub.status).map(([k, s]) => {
              const cls = `text-[10px] px-2 py-0.5 rounded-full ${s === "done" ? "bg-green-900/50 text-green-400" : s === "doing" ? "bg-yellow-900/40 text-yellow-300" : "bg-surface-2 text-subtle"}`;
              const txt = `${s === "done" ? "✓ " : s === "doing" ? "⟳ " : ""}${LABEL[k]}`;
              return s === "done" && pub.urls[k]
                ? <a key={k} href={pub.urls[k]} target="_blank" rel="noopener noreferrer" className={`${cls} hover:underline`} title="게시물 보기">{txt} ↗</a>
                : <span key={k} className={cls}>{txt}</span>;
            })}</div>
          </div>
        </div>
      )}

      {/* 예약 발행 패널 (P6) — 토글 시 노출. 현 작업물의 선택 플랫폼 + 저장된 draftId 사용. */}
      {showSchedule && activeWorkspace && (
        <SchedulePanel
          tenantId={activeWorkspace.id}
          draftId={draftId}
          defaultPlatforms={ALL.filter((p) => includes[p])}
        />
      )}

      <div className="flex gap-6">
        {/* 본문: 유형별 세로 분류 (생성 전엔 안내) */}
        <div className="flex-1 min-w-0 space-y-7">
          {!text ? (
            <div className="text-sm text-subtle py-12 text-center">글감을 입력하고 OSMU 생성을 누르거나, 오른쪽 발행 이력에서 불러오세요.</div>
          ) : (
            GROUPS.map((g) => (
              <div key={g.title}>
                <div className="flex items-center gap-2 mb-3"><span className="text-sm font-bold bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">{g.title}</span><span className="text-[10px] text-subtle">{g.platforms.map((p) => LABEL[p]).join(" · ")} · 클릭해서 편집</span><div className="flex-1 h-px bg-gradient-to-r from-accent/40 to-transparent" /></div>
                <div className="flex gap-5 flex-nowrap overflow-x-auto items-start pb-2">
                  {g.platforms.map((p) => (
                    <div key={p} className="group cursor-pointer" onClick={() => setEditing(p)}>
                      <div className={`rounded-2xl transition ${editing === p ? "ring-2 ring-accent shadow-[0_0_24px_rgba(236,72,153,0.35)]" : "group-hover:ring-1 group-hover:ring-accent/50"}`}>
                        <PlatformPreview platform={p} text={text} media={media} headerRight={
                          <label onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[10px] text-subtle cursor-default">
                            <input type="checkbox" checked={!!includes[p]} onChange={(e) => setIncludes((x) => ({ ...x, [p]: e.target.checked }))} />발행
                          </label>
                        } />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 발행 이력 */}
          <div className="w-52 shrink-0 card p-3 h-fit">
            <b className="text-sm text-text">📜 발행 이력</b>
            <p className="text-[10px] text-subtle mt-1 mb-2">클릭→수정 후 재발행</p>
            {(hist?.drafts || []).length === 0 && <p className="text-xs text-subtle">없음</p>}
            {(hist?.drafts || []).map((d) => (
              <div key={String(d.id)} className="border-t border-border py-2">
                <div className="text-xs text-muted truncate">{String(d.idea || "(없음)")}</div>
                <div className="text-[10px] text-subtle">{String(d.savedAt || "").slice(5, 16).replace("T", " ")} · {d.status === "published" ? "✅" : d.status === "stopped" ? "⏸" : "📝"}</div>
                <button onClick={() => loadDraft(d)} className="mt-1 text-[10px] px-2 py-0.5 bg-surface-2 text-muted rounded">불러오기</button>
              </div>
            ))}
          </div>
        </div>

      {/* 편집 드로어 (클릭 시, 리사이즈 가능) */}
      {editing && text && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setEditing(null)} />
          <div className="fixed top-0 right-0 h-screen bg-surface/95 backdrop-blur-xl border-l border-accent z-40 flex shadow-[0_0_40px_rgba(168,85,247,0.15)]" style={{ width: drawerW }}>
            <div onMouseDown={() => (dragRef.current = true)} className="w-1.5 h-full cursor-ew-resize bg-gradient-to-b from-accent to-accent-hover opacity-40 hover:opacity-100 shrink-0" title="드래그해서 크기 조절" />
            <div className="flex-1 overflow-auto p-5">
              <div className="flex items-center justify-between mb-4"><b className="text-base text-text">{LABEL[editing]} 편집</b><button onClick={() => setEditing(null)} className="text-subtle text-lg">✕</button></div>

              {/* 편집 필드 */}
              <div className="space-y-3 mb-5">
                {(editing === "threads" || editing === "facebook") && <textarea value={text.threads || ""} onChange={(e) => upText({ threads: e.target.value })} className="w-full bg-surface-2 text-text text-sm p-3 rounded border border-border" rows={6} />}
                {editing === "x" && <div><textarea value={text.x || ""} onChange={(e) => upText({ x: e.target.value })} className="w-full bg-surface-2 text-text text-sm p-3 rounded border border-border" rows={5} /><span className={`text-[11px] ${(text.x || "").length > 280 ? "text-red-400" : "text-subtle"}`}>{(text.x || "").length}/280</span></div>}
                {editing === "instagram" && <>
                  <textarea value={text.instagram?.caption || ""} onChange={(e) => upIg({ caption: e.target.value })} placeholder="캡션" className="w-full bg-surface-2 text-text text-sm p-3 rounded border border-border" rows={3} />
                  <div><label className="text-[11px] text-subtle">해시태그 (쉼표)</label><input value={(text.instagram?.hashtags || []).join(", ")} onChange={(e) => upIg({ hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="w-full bg-surface-2 text-accent text-xs p-2 rounded border border-border" /></div>
                  <div><label className="text-[11px] text-subtle">카드 슬라이드</label>{(text.instagram?.slides || []).map((s, i) => <input key={i} value={s} onChange={(e) => { const sl = [...(text.instagram?.slides || [])]; sl[i] = e.target.value; upIg({ slides: sl }); }} className="w-full mt-1 bg-surface-2 text-muted text-xs p-2 rounded border border-border" />)}</div>
                </>}
                {isVideo(editing) && <>
                  {(["hook", "body", "cta"] as const).map((kk) => <div key={kk}><label className="text-[11px] text-subtle">{kk.toUpperCase()}</label><input value={text.shorts?.[kk] || ""} onChange={(e) => upText({ shorts: { ...(text.shorts || {}), [kk]: e.target.value } })} className="w-full bg-surface-2 text-muted text-sm p-2 rounded border border-border" /></div>)}
                  <div className="flex gap-2 items-center"><select value={videoModel} onChange={(e) => setVideoModel(e.target.value)} className="bg-surface-2 text-muted text-xs p-1.5 rounded border border-border"><option value="minimax_hailuo">Minimax 6cr</option><option value="veo3_1_lite">Veo3.1 8cr</option><option value="marketing_studio_video">MS UGC광고 ~40cr</option></select>{img && <button onClick={() => genVideo(img.localPath)} disabled={!!busy} className="text-xs px-2 py-1.5 bg-surface-2 text-muted rounded disabled:opacity-50">{vid ? "영상 재생성" : "영상 생성"}</button>}</div>
                </>}

                {/* 비주얼 프롬프트 — 어떤 프롬프트로 생성됐는지 */}
                {!isVideo(editing) && <div>
                  <label className="text-[11px] text-accent">🎨 비주얼 프롬프트 <span className="text-subtle">— 이 프롬프트로 이미지 생성됨</span></label>
                  <textarea value={text.image_prompt || ""} onChange={(e) => upText({ image_prompt: e.target.value })} className="w-full bg-surface-2 text-muted text-xs p-2 rounded border border-border" rows={3} />
                  <button onClick={() => genImage(text.image_prompt || idea)} disabled={!!busy} className="mt-1 text-xs px-2 py-1 bg-surface-2 text-muted rounded disabled:opacity-50">이미지 재생성</button>
                </div>}
                <button onClick={() => genText()} disabled={!!busy} className="text-xs px-2 py-1 bg-surface-2 text-muted rounded disabled:opacity-50">텍스트 전체 재생성</button>
              </div>

              {/* 큰 미리보기 */}
              <div><div className="text-[11px] text-subtle mb-2">미리보기</div><div className="bg-bg rounded-lg p-4 flex justify-center"><PlatformPreview platform={editing} text={text} media={media} /></div></div>
            </div>
          </div>
        </>
      )}

      <div className="mt-6 text-[11px] text-subtle">⚠️ 실 발행: 채널 토큰 연결 시 실제 게시(Threads/Instagram 직접 / X·영상은 게이트웨이 P5). 성과는 발행 후 수집. 🛣️ 시나리오2 트렌드 대기 · 시나리오3 롱폼분할 조사중</div>
    </div>
  );
}
