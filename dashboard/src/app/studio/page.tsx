"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import {
  fetcher,
  apiPost,
  isExternalPublishPersistenceError,
  ApiResponseError,
  type ExternalPublishPersistenceFailure,
} from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { PlatformPreview, PREVIEW_PLATFORMS, type PreviewPlatform } from "@/components/studio/PlatformPreview";
import { useUIStore } from "@/store/ui-store";
import { BrandSetupWizard } from "@/components/shared/BrandSetupWizard";
import { RepoConnect } from "@/components/studio/RepoConnect";
import { SchedulePanel } from "@/components/studio/SchedulePanel";
import { trackEvent, type AnalyticsChannel } from "@/lib/analytics/events";
import { authHeaders } from "@/lib/auth";
import { CHANNEL_TEXT_LIMITS, countTextCharacters } from "@/lib/channel-text-limits";
import { Button } from "@/components/shared/Button";
import { Field } from "@/components/shared/Field";
import { Stack } from "@/components/shared/Stack";
import { SCHEDULABLE_PLATFORMS } from "@/lib/constants";

// SNS-007: /api/publish가 실제로 계정별 발행을 받는 4개 플랫폼(threads/x/facebook/instagram)만
// 계정 셀렉터를 노출한다. shorts/reels/tiktok은 /api/publish 미지원(실발행 분기 없음 — 위
// ChannelConnect.tsx 주석과 동일 SSOT 판단)이라 대상에서 뺀다.
const PREVIEW_PLATFORM_KEYS = new Set<string>(PREVIEW_PLATFORMS.map((platform) => platform.key));
const PUBLISH_SUPPORTED = new Set<PreviewPlatform>(
  SCHEDULABLE_PLATFORMS.filter((platform) => PREVIEW_PLATFORM_KEYS.has(platform)) as PreviewPlatform[],
);
const ACCOUNT_SELECTABLE = PUBLISH_SUPPORTED;
interface AccountOption { id: string; label: string; is_default: boolean }

// apiPost는 non-2xx에서 throw한다(ApiResponseError) — 생성 함수들이 `r?.ok` 체크만 믿고
// try/catch를 안 하면 403(shared_ai_approval_required) 같은 실패가 콘솔에만 찍히고 화면엔
// 조용히 죽는다(결함 실측: /studio 생성 실패 시 lastError/toast 미표시). 여기서 공통 추출.
function extractApiErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiResponseError) {
    const payload = e.payload as { error?: string } | null;
    return payload?.error || e.message || fallback;
  }
  if (e instanceof Error) return e.message || fallback;
  return fallback;
}

interface TextVariants {
  threads?: string; facebook?: string; x?: string;
  instagram?: { caption?: string; hashtags?: string[]; slides?: string[] };
  shorts?: { hook?: string; body?: string; cta?: string };
  image_prompt?: string;
}
interface ImgResult { url: string; file: string; localPath: string }
interface VidResult {
  url: string;
  file: string;
  model: string;
  hasAudio?: boolean;
  narration?: { requested: boolean; included: boolean; reason?: string; message?: string };
}
type PubStatus = "wait" | "doing" | "done" | "failed";
type PublishReconciliation = ExternalPublishPersistenceFailure["persistence"]["reconciliation"];

const GROUPS: { title: string; platforms: PreviewPlatform[] }[] = [
  { title: "✍️ 텍스트", platforms: ["threads", "x", "facebook"] },
  { title: "🎬 영상 9:16", platforms: ["shorts", "reels", "tiktok"] },
  { title: "🖼️ 카드뉴스", platforms: ["instagram"] },
];
const ALL: PreviewPlatform[] = PREVIEW_PLATFORMS.map((platform) => platform.key);
const normalizeIncludes = (saved?: Record<string, boolean>): Record<string, boolean> => (
  Object.fromEntries(ALL.map((platform) => [
    platform,
    PUBLISH_SUPPORTED.has(platform) && (saved?.[platform] ?? true),
  ]))
);
const selectedPublishTargets = (includes: Record<string, boolean>): PreviewPlatform[] => (
  ALL.filter((platform) => PUBLISH_SUPPORTED.has(platform) && includes[platform])
);
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
  const { data: me } = useSWR<{ isOperator?: boolean }>("/api/me", fetcher);
  const canGenerate = me?.isOperator === true;
  const { data: acct, mutate: mutateAcct } = useSWR<{ credits?: number; needsLogin?: boolean }>(
    canGenerate ? "/api/higgsfield/status" : null,
    fetcher,
  );
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
  const [publishReconciliation, setPublishReconciliation] = useState<PublishReconciliation | null>(null);
  const [includes, setIncludes] = useState<Record<string, boolean>>(() => normalizeIncludes());
  const [editing, setEditing] = useState<PreviewPlatform | null>(null);
  const [showTx, setShowTx] = useState(false);
  const { data: tx } = useSWR<{ items?: Array<{ display_name?: string; credits?: number; action?: string; created_at?: string; output?: string | null; outputKind?: string | null }> }>(
    canGenerate && showTx ? "/api/higgsfield/transactions?size=25" : null,
    fetcher,
  );

  const [pub, setPub] = useState<{
    running: boolean;
    stopped: boolean;
    status: Record<string, PubStatus>;
    urls: Record<string, string>;
    errors: Record<string, string>;
  }>({ running: false, stopped: false, status: {}, urls: {}, errors: {} });
  // SNS-007: 플랫폼별 다중계정 중 이번 발행에 쓸 계정. 미선택(undefined)이면 getChannelCred가
  // 기본계정으로 resolve(/api/publish 계약과 동일) — 계정이 1개뿐이면 셀렉터 자체를 숨긴다.
  const [accountsByPlatform, setAccountsByPlatform] = useState<Record<string, AccountOption[]>>({});
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelectedAccounts({});
    if (!activeWorkspace) { setAccountsByPlatform({}); return; }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        Array.from(ACCOUNT_SELECTABLE).map(async (p) => {
          try {
            const r = await fetch(`/api/channels/${p}/accounts?tenant_id=${activeWorkspace.id}`, { headers: authHeaders() });
            const d = await r.json();
            if (!r.ok) return [p, []] as const;
            const opts: AccountOption[] = (d.accounts ?? []).map((a: { id: string; display_name: string | null; username: string | null; is_default: boolean }) => ({
              id: a.id,
              label: a.display_name || (a.username ? `@${a.username}` : a.id.slice(0, 8)),
              is_default: a.is_default,
            }));
            return [p, opts] as const;
          } catch {
            return [p, []] as const;
          }
        }),
      );
      if (cancelled) return;
      setAccountsByPlatform(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [activeWorkspace]);
  const cancelRef = useRef(false);

  // ── 드로어 리사이즈 ──
  const drawerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);
  const onDrag = useCallback((e: MouseEvent) => {
    if (!dragRef.current || !drawerRef.current) return;
    const width = Math.min(window.innerWidth * 0.9, Math.max(320, window.innerWidth - e.clientX));
    drawerRef.current.style.width = `${width}px`;
  }, []);
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
        if (w.includes) setIncludes(normalizeIncludes(w.includes)); setDraftId(w.draftId || null);
        setPublishReconciliation(w.publishReconciliation || null);
      }
    } catch { /* noop */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return; // 첫 렌더(복원 전) 빈 상태로 덮어쓰기 방지
    try { localStorage.setItem("studio_work", JSON.stringify({ idea, text, img, vid, includes, draftId, publishReconciliation })); } catch { /* noop */ }
  }, [hydrated, idea, text, img, vid, includes, draftId, publishReconciliation]);

  const media = { imgUrl: img?.file, vidUrl: vid?.file };
  const upText = (patch: Partial<TextVariants>) => setText((p) => ({ ...(p || {}), ...patch }));
  const upIg = (patch: Partial<NonNullable<TextVariants["instagram"]>>) => setText((p) => ({ ...(p || {}), instagram: { ...(p?.instagram || {}), ...patch } }));

  async function genText() {
    setLastError(null);
    try {
      const r = await apiPost<TextVariants & { ok?: boolean; error?: string }>("/api/studio/text", { idea, guide, tenant_id: activeWorkspace?.id });
      if (!r?.ok) { const msg = r?.error || "텍스트 생성 실패"; setLastError(`텍스트: ${msg}`); showToast(msg, "error"); return null; }
      // API가 성공을 확인한 뒤에만 발행 — 클릭 시점 아님.
      trackEvent({ name: "content_generate", params: { kind: "text" } });
      setText(r); return r;
    } catch (e) {
      const msg = extractApiErrorMessage(e, "텍스트 생성 실패");
      setLastError(`텍스트: ${msg}`); showToast(msg, "error"); return null;
    }
  }
  async function genImage(prompt: string) {
    if (!canGenerate) {
      showToast("이미지 생성은 운영자 전용 기능입니다.", "error");
      return null;
    }
    setLastError(null);
    try {
      const r = await apiPost<ImgResult & { ok?: boolean; error?: string; nsfw?: boolean; credits?: boolean }>("/api/higgsfield/image", { prompt, aspectRatio: "9:16", label: idea });
      if (!r?.ok) { const msg = r?.credits ? "Higgsfield 크레딧 부족" : r?.nsfw ? "Higgsfield NSFW 차단" : (r?.error || "이미지 실패"); setLastError(`이미지: ${msg}`); showToast(msg, "error"); return null; }
      setImg(r); mutateAcct(); return r;
    } catch (e) {
      const msg = extractApiErrorMessage(e, "이미지 생성 실패");
      setLastError(`이미지: ${msg}`); showToast(msg, "error"); return null;
    }
  }
  async function genVideo(localPath: string) {
    if (!canGenerate) {
      showToast("영상 생성은 운영자 전용 기능입니다.", "error");
      return null;
    }
    setLastError(null);
    const s = text?.shorts;
    const narration = [s?.hook, s?.body, s?.cta].filter(Boolean).join(". ");
    try {
      const r = await apiPost<VidResult & { ok?: boolean; error?: string; nsfw?: boolean; credits?: boolean }>("/api/higgsfield/video", { localPath, prompt: "subtle idle motion, gentle glow, fixed camera", model: videoModel, narration, label: idea });
      if (!r?.ok) { const msg = r?.nsfw ? "Higgsfield NSFW 차단" : r?.credits ? "Higgsfield 크레딧 부족" : (r?.error || "영상 실패"); setLastError(`영상: ${msg}`); showToast(msg, "error"); return null; }
      setVid(r); mutateAcct(); return r;
    } catch (e) {
      const msg = extractApiErrorMessage(e, "영상 생성 실패");
      setLastError(`영상: ${msg}`); showToast(msg, "error"); return null;
    }
  }
  async function runOSMU() {
    if (!idea.trim()) { showToast("글감을 입력하세요", "error"); return; }
    setLastError(null);
    setText(null); setImg(null); setVid(null); setDraftId(null); setPublishReconciliation(null);
    try {
      setBusy("텍스트 변형 생성 중..."); const t = await genText(); if (!t) return;
      if (canGenerate) {
        setBusy("히어로 이미지 생성 중..."); const image = await genImage(t.image_prompt || idea);
        if (image && withVideo) { setBusy("숏폼 영상 생성 중 (1~2분)..."); await genVideo(image.localPath); }
      }
      showToast(canGenerate ? "OSMU 생성 완료" : "텍스트 생성 완료", "success");
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
  async function save(
    status: "draft" | "published" | "partial" | "stopped" = "draft",
    reconciliation: PublishReconciliation | null = publishReconciliation,
  ) {
    const r = await apiPost<{ id?: string }>("/api/studio/drafts", {
      tenant_id: activeWorkspace?.id,
      id: draftId,
      idea,
      text,
      img,
      vid,
      includes,
      status,
      publishReconciliation: reconciliation,
      publishedAt: status === "published" ? new Date().toISOString() : undefined,
    });
    if (r?.id) setDraftId(r.id); mutateHist(); return r?.id;
  }
  // 플랫폼별 발행 텍스트 추출
  function platformText(p: PreviewPlatform): string {
    if (!text) return "";
    if (p === "threads") return text.threads || "";
    if (p === "facebook") return text.facebook || "";
    if (p === "x") return text.x || "";
    if (p === "instagram") return text.instagram?.caption || "";
    return [text.shorts?.hook, text.shorts?.body, text.shorts?.cta].filter(Boolean).join("\n") || text.threads || "";
  }

  async function publish() {
    if (!text) return;
    if (!activeWorkspace) { showToast("워크스페이스를 선택하세요", "error"); return; }
    if (publishReconciliation?.retryPublish === false) {
      showToast("외부 게시가 이미 완료된 항목입니다. 재발행하지 말고 내부 기록을 먼저 복구하세요.", "error");
      return;
    }
    const did = await save("draft");
    const targets = selectedPublishTargets(includes);
    if (!targets.length) { showToast("발행할 플랫폼을 선택하세요", "error"); return; }
    cancelRef.current = false;
    const status: Record<string, PubStatus> = {}; targets.forEach((p) => (status[p] = "wait"));
    const urls: Record<string, string> = {};
    const errors: Record<string, string> = {};
    const errs: string[] = [];
    let pendingReconciliation: PublishReconciliation | null = null;
    setPub({ running: true, stopped: false, status: { ...status }, urls: {}, errors: {} });
    for (const p of targets) {
      if (cancelRef.current) break;
      status[p] = "doing";
      setPub({ running: true, stopped: false, status: { ...status }, urls: { ...urls }, errors: { ...errors } });
      let failureReason: string | null = null;
      try {
        // 실 발행: /api/publish (테넌트 채널 토큰). 토큰 없으면 graceful 에러.
        // publish_attempt = 실제 제출 시점(클릭 즉시가 아니라 이 루프 진입 시점). publish_success는
        // API가 ok:true를 반환한 뒤에만 — 낙관적 발행 금지.
        trackEvent({ name: "publish_attempt", params: { channel: p as AnalyticsChannel } });
        const r = await apiPost<{ ok?: boolean; permalink?: string; error?: string }>("/api/publish", {
          tenant_id: activeWorkspace.id, platform: p, text: platformText(p), image_url: img?.url, draft_id: did,
          account_id: selectedAccounts[p] || undefined,
        });
        if (r?.ok) { urls[p] = r.permalink || POST_URL[p] || "#"; trackEvent({ name: "publish_success", params: { channel: p as AnalyticsChannel } }); }
        else {
          failureReason = r?.error || "실패";
          errs.push(`${LABEL[p]}: ${failureReason}`);
        }
      } catch (e) {
        if (isExternalPublishPersistenceError(e)) {
          pendingReconciliation = e.payload.persistence.reconciliation;
          setPublishReconciliation(pendingReconciliation);
          if (e.payload.permalink) urls[p] = e.payload.permalink;
          failureReason = "외부 게시 완료·내부 기록 복구 필요 (재발행 금지)";
          errs.push(`${LABEL[p]}: ${failureReason}`);
        } else {
          failureReason = e instanceof Error ? e.message : "오류";
          errs.push(`${LABEL[p]}: ${failureReason}`);
        }
      }
      status[p] = failureReason ? "failed" : "done";
      if (failureReason) errors[p] = failureReason;
      setPub({
        running: true,
        stopped: false,
        status: { ...status },
        urls: { ...urls },
        errors: { ...errors },
      });
      if (pendingReconciliation) break;
    }
    const stopped = cancelRef.current;
    setPub({
      running: false,
      stopped,
      status: { ...status },
      urls: { ...urls },
      errors: { ...errors },
    });
    if (pendingReconciliation) {
      try {
        await save("partial", pendingReconciliation);
      } catch {
        // The same storage incident can prevent the draft write too. The state was
        // already copied to localStorage-bound React state, so keep the no-republish
        // guard active and tell the operator that server-side recovery metadata is absent.
        errs.push("복구 정보 서버 저장 실패·현재 브라우저에만 보존됨");
      }
    } else {
      await save(stopped ? "stopped" : errs.length ? "partial" : "published", null);
      if (!stopped) setPublishReconciliation(null);
    }
    if (stopped) showToast("발행 중지됨", "error");
    else if (errs.length) showToast(`발행 결과 — ${errs.join(" / ")}`.slice(0, 180), "error");
    else showToast("발행 완료 ✓", "success");
  }
  function loadDraft(d: Record<string, unknown>) {
    setIdea((d.idea as string) || ""); setText((d.text as TextVariants) || null);
    setImg((d.img as ImgResult) || null); setVid((d.vid as VidResult) || null);
    setIncludes(d.includes ? normalizeIncludes(d.includes as Record<string, boolean>) : includes); setDraftId(d.id as string);
    setPublishReconciliation((d.publishReconciliation as PublishReconciliation) || null);
    showToast(
      d.publishReconciliation
        ? "외부 게시 완료·내부 기록 복구 필요 — 재발행 금지"
        : "불러옴 — 수정 후 재발행 가능",
      d.publishReconciliation ? "error" : "success",
    );
  }
  const pubPct = (() => { const v = Object.values(pub.status); return v.length ? Math.round((v.filter((s) => s === "done").length / v.length) * 100) : 0; })();
  const pubFailed = Object.values(pub.status).filter((s) => s === "failed").length;
  const pubResultLabel = pub.running
    ? "발행 중…"
    : pub.stopped
      ? "발행 중지됨"
      : pubFailed > 0 && pubPct > 0
        ? "일부 발행 실패"
        : pubFailed > 0
          ? "발행 실패"
          : "발행 완료";
  const LABEL: Record<string, string> = { threads: "Threads", x: "X", facebook: "Facebook", instagram: "Instagram", shorts: "Shorts", reels: "Reels", tiktok: "TikTok" };

  return (
    <div className="px-stack-section py-pad-inset">
      {showWizard && activeWorkspace && (
        <BrandSetupWizard
          workspace={activeWorkspace}
          onComplete={() => { setShowWizard(false); mutateBrand(); showToast("브랜드 가이드 저장됨"); }}
          onDismiss={() => setShowWizard(false)}
        />
      )}
      {showRepo && activeWorkspace && <RepoConnect workspace={activeWorkspace} onSynced={() => { mutateBrand(); showToast("브랜드 가이드 갱신됨"); }} onClose={() => setShowRepo(false)} />}
      {/* 상단 바 */}
      <Stack direction="horizontal" gap={12} wrap className="items-center mb-pad-inset">
        <div className="mr-micro">
          <b className="text-lead text-text">OSMU Studio</b>
          <p className="text-caption text-subtle leading-tight">직접 저작 · 생성→즉시 발행/예약</p>
        </div>
        <div className="text-caption px-stack-tight py-micro rounded border border-border bg-surface-2 text-subtle" title={engine?.error || engine?.model || ""}>
          AI <b className="text-muted">{engine?.label || "확인 중"}</b>{engine?.mode === "claude-p" ? " · claude -p" : ""}{engine?.mode === "unknown" ? " · 확인 실패" : ""}
        </div>
        <input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="글감 / 콘텐츠 주제 입력" className="flex-1 min-w-[260px] bg-surface-2 text-text text-body p-stack rounded border border-border" />
        {canGenerate && <select value={videoModel} onChange={(e) => setVideoModel(e.target.value)} className="bg-surface-2 text-muted text-caption p-stack-tight rounded border border-border"><option value="minimax_hailuo">Minimax 6cr</option><option value="veo3_1_lite">Veo3.1 8cr</option><option value="kling3_0">Kling3 10cr</option><option value="marketing_studio_video">MS UGC광고 ~40cr</option></select>}
        {canGenerate && <label className="flex items-center gap-stack-tight text-caption text-subtle"><input type="checkbox" checked={withVideo} onChange={(e) => setWithVideo(e.target.checked)} />영상</label>}
        {activeWorkspace && <Button size="sm" onClick={() => setShowWizard(true)} title="브랜드 톤 설정">{brandData?.guide?.prompt_guide ? "🎨 브랜드 ✓" : "🎨 브랜드 설정"}</Button>}
        {activeWorkspace && <Button size="sm" onClick={() => setShowRepo(true)} title="GitHub 레포 위키 연동 → 브랜드 가이드">📚 위키</Button>}
        <Button variant="primary" onClick={runOSMU} disabled={!!busy}>{busy || "OSMU 생성"}</Button>
        {activeWorkspace && <Button onClick={autoGenerate} disabled={autoGen} title="브랜드 가이드 기반 자동초안 생성">{autoGen ? "생성 중…" : "✨ AI 자동초안"}</Button>}
        {text && <Button onClick={() => save("draft")}>💾 Save</Button>}
        {text && <Button variant="primary" onClick={publish} disabled={pub.running}>🚀 Publish ({selectedPublishTargets(includes).length})</Button>}
        {text && activeWorkspace && <Button variant={showSchedule ? "primary" : "secondary"} onClick={() => setShowSchedule((v) => !v)} title="예약 발행">🗓️ 예약</Button>}
        {canGenerate && <div className="relative">
          <Button size="sm" onClick={() => setShowTx((v) => !v)} title="사용 이력 보기">
            크레딧 <b className={acct?.needsLogin ? "text-danger" : "text-success"}>{acct?.needsLogin ? "로그인필요" : acct?.credits?.toFixed(2) ?? "..."}</b> ▾
          </Button>
          {showTx && (
            <div className="absolute right-0 top-7 z-50 w-72 max-h-80 overflow-y-auto card p-stack shadow-xl">
              <div className="flex justify-between items-center mb-stack-tight"><b className="text-caption text-muted">크레딧 사용 이력</b><Button size="sm" onClick={() => setShowTx(false)} aria-label="크레딧 사용 이력 닫기">✕</Button></div>
              {!tx ? <p className="text-caption text-subtle">불러오는 중…</p>
                : (tx.items || []).length === 0 ? <p className="text-caption text-subtle">내역 없음</p>
                : (tx.items || []).map((t, i) => (
                  <div key={i} className="flex justify-between items-center border-t border-border py-stack-tight text-caption">
                    <div className="min-w-0 pr-stack-tight"><div className="text-muted">{t.display_name}</div>
                      {t.output && <div className="text-accent truncate">{t.outputKind === "video" ? "🎬" : "🖼️"} {t.output}</div>}
                      <div className="text-subtle">{String(t.created_at || "").slice(5, 16).replace("T", " ")}</div></div>
                    <span className={Number(t.credits) < 0 ? "text-danger" : "text-success"}>{Number(t.credits) > 0 ? "+" : ""}{t.credits}</span>
                  </div>
                ))}
            </div>
          )}
        </div>}
      </Stack>
      {!canGenerate && me && (
        <div className="mb-pad-inset rounded-lg border border-warning/30 bg-warning/10 px-stack py-stack-tight text-caption text-warning">
          이미지·영상 생성과 Higgsfield 크레딧은 운영자 전용 기능입니다.
        </div>
      )}
      {lastError && (
        <div className="mb-pad-inset rounded-lg border border-danger/30 bg-danger/10 px-stack py-stack-tight text-caption text-danger">
          마지막 실패: {lastError}
        </div>
      )}
      {vid?.narration?.message && (
        <div className="mb-pad-inset rounded-lg border border-warning/30 bg-warning/10 px-stack py-stack-tight text-caption text-warning">
          {vid.narration.message}
        </div>
      )}

      {/* 발행 진행 */}
      {(pub.running || Object.keys(pub.status).length > 0) && (
        <div className="card p-stack mb-pad-inset flex items-center gap-stack">
          <div className="w-12 shrink-0">
            <div className="text-center text-caption font-bold text-success">{pubPct}%</div>
            <progress className="progress-semantic mt-micro h-micro w-full" max={100} value={pubPct} aria-label="발행 진행률" />
          </div>
          <div className="flex-1"><div className="flex justify-between"><b className="text-body text-text">{pubResultLabel}</b>{pub.running && <Button variant="danger" size="sm" onClick={() => (cancelRef.current = true)}>■ 중지</Button>}</div>
            <div className="flex gap-stack-tight mt-stack-tight flex-wrap">{Object.entries(pub.status).map(([k, s]) => {
              const cls = `text-caption px-stack-tight py-[2px] rounded-full border ${s === "done" ? "bg-success/10 text-success border-success/30" : s === "failed" ? "bg-danger/10 text-danger border-danger/30" : s === "doing" ? "bg-warning/10 text-warning border-warning/30" : "bg-surface-2 text-subtle border-border"}`;
              const txt = `${s === "done" ? "✓ " : s === "failed" ? "✕ " : s === "doing" ? "⟳ " : ""}${LABEL[k]}`;
              return s === "done" && pub.urls[k]
                ? <a key={k} href={pub.urls[k]} target="_blank" rel="noopener noreferrer" className={`${cls} hover:underline`} title="게시물 보기">{txt} ↗</a>
                : <span key={k} className={cls}>{txt}{s === "failed" && pub.errors[k] && <span className="ml-micro">· <span>{pub.errors[k]}</span></span>}</span>;
            })}</div>
          </div>
        </div>
      )}

      {/* 예약 발행 패널 (P6) — 토글 시 노출. 현 작업물의 선택 플랫폼 + 저장된 draftId 사용. */}
      {showSchedule && activeWorkspace && (
        <SchedulePanel
          tenantId={activeWorkspace.id}
          draftId={draftId}
          defaultPlatforms={selectedPublishTargets(includes)}
        />
      )}

      <div className="flex gap-stack-section">
        {/* 본문: 유형별 세로 분류 (생성 전엔 안내) */}
        <div className="flex-1 min-w-0 space-y-region">
          {!text ? (
            <div className="text-body text-subtle py-region text-center">글감을 입력하고 OSMU 생성을 누르거나, 오른쪽 발행 이력에서 불러오세요.</div>
          ) : (
            GROUPS.filter((g) => canGenerate || !g.platforms.some(isVideo)).map((g) => (
              <div key={g.title}>
                <div className="flex items-center gap-stack-tight mb-stack"><span className="text-body font-bold bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">{g.title}</span><span className="text-caption text-subtle">{g.platforms.map((p) => LABEL[p]).join(" · ")} · 클릭해서 편집</span><div className="flex-1 h-px bg-gradient-to-r from-accent/40 to-transparent" /></div>
                <div className="flex gap-stack-section flex-nowrap overflow-x-auto items-start pb-stack-tight">
                  {g.platforms.map((p) => (
                    <div key={p} className="group cursor-pointer" onClick={() => setEditing(p)}>
                      <div className={`rounded-2xl transition ${editing === p ? "ring-2 ring-accent shadow-[0_0_24px_rgba(236,72,153,0.35)]" : "group-hover:ring-1 group-hover:ring-accent/50"}`}>
                        <PlatformPreview platform={p} text={text} media={media} headerRight={
                          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-stack-tight">
                            {PUBLISH_SUPPORTED.has(p) ? (
                              <label className="flex items-center gap-micro text-caption text-subtle cursor-default">
                                <input type="checkbox" checked={!!includes[p]} onChange={(e) => setIncludes((x) => ({ ...x, [p]: e.target.checked }))} />발행
                              </label>
                            ) : (
                              <span className="text-caption text-warning">발행 미지원(생성 전용)</span>
                            )}
                            {ACCOUNT_SELECTABLE.has(p) && (accountsByPlatform[p]?.length ?? 0) > 1 && (
                              <select
                                data-testid={`publish-account-select-${p}`}
                                value={selectedAccounts[p] ?? ""}
                                onChange={(e) => setSelectedAccounts((x) => ({ ...x, [p]: e.target.value }))}
                                className="text-caption bg-surface-2 border border-border rounded px-micro py-[2px] text-text max-w-[90px]"
                              >
                                <option value="">기본계정</option>
                                {accountsByPlatform[p].map((a) => (
                                  <option key={a.id} value={a.id}>{a.label}</option>
                                ))}
                              </select>
                            )}
                          </div>
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
          <div className="w-52 shrink-0 card p-stack h-fit">
            <b className="text-body-sm text-text">📜 발행 이력</b>
            <p className="text-caption text-subtle mt-micro mb-stack-tight">클릭→수정 후 재발행</p>
            {(hist?.drafts || []).length === 0 && <p className="text-caption text-subtle">없음</p>}
            {(hist?.drafts || []).map((d) => (
              <div key={String(d.id)} className="border-t border-border py-stack-tight">
                <div className="text-caption text-muted truncate">{String(d.idea || "(없음)")}</div>
                <div className="text-caption text-subtle">{String(d.savedAt || "").slice(5, 16).replace("T", " ")} · {d.status === "published" ? "✅" : d.status === "partial" ? "⚠️ 복구 필요·재발행 금지" : d.status === "stopped" ? "⏸" : "📝"}</div>
                {!d.text && <div className="text-caption text-warning mt-micro">본문 없음 · 재생성 필요</div>}
                <Button onClick={() => loadDraft(d)} className="mt-micro" size="sm">불러오기</Button>
              </div>
            ))}
          </div>
        </div>

      {/* 편집 드로어 (클릭 시, 리사이즈 가능) */}
      {editing && text && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setEditing(null)} />
          <div ref={drawerRef} className="fixed top-0 right-0 h-screen w-1/2 min-w-80 max-w-screen-lg bg-surface/95 backdrop-blur-xl border-l border-accent z-40 flex shadow-xl">
            <div onMouseDown={() => (dragRef.current = true)} className="w-1.5 h-full cursor-ew-resize bg-gradient-to-b from-accent to-accent-hover opacity-40 hover:opacity-100 shrink-0" title="드래그해서 크기 조절" />
            <div className="flex-1 overflow-auto p-pad-inset">
              <div className="flex items-center justify-between mb-pad-inset"><b className="text-lead text-text">{LABEL[editing]} 편집</b><Button size="sm" onClick={() => setEditing(null)} aria-label={`${LABEL[editing]} 편집 닫기`}>✕</Button></div>

              {/* 편집 필드 */}
              <div className="space-y-stack mb-pad-inset">
                {editing === "threads" && <textarea value={text.threads || ""} onChange={(e) => upText({ threads: e.target.value })} className="w-full bg-surface-2 text-text text-body p-stack rounded border border-border" rows={6} />}
                {editing === "facebook" && <textarea value={text.facebook || ""} onChange={(e) => upText({ facebook: e.target.value })} className="w-full bg-surface-2 text-text text-body p-stack rounded border border-border" rows={6} />}
                {editing === "x" && <div><textarea value={text.x || ""} onChange={(e) => upText({ x: e.target.value })} className="w-full bg-surface-2 text-text text-body p-stack rounded border border-border" rows={5} /><span className={`text-caption ${countTextCharacters(text.x || "") > CHANNEL_TEXT_LIMITS.x ? "text-danger" : "text-subtle"}`}>{countTextCharacters(text.x || "")}/{CHANNEL_TEXT_LIMITS.x}</span></div>}
                {editing === "instagram" && <>
                  <textarea value={text.instagram?.caption || ""} onChange={(e) => upIg({ caption: e.target.value })} placeholder="캡션" className="w-full bg-surface-2 text-text text-body p-stack rounded border border-border" rows={3} />
                  <Field label="해시태그 (쉼표)"><input value={(text.instagram?.hashtags || []).join(", ")} onChange={(e) => upIg({ hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="w-full bg-surface-2 text-accent text-body-sm p-stack-tight rounded border border-border" /></Field>
                  <Field label="카드 슬라이드">{(text.instagram?.slides || []).map((s, i) => <input key={i} value={s} onChange={(e) => { const sl = [...(text.instagram?.slides || [])]; sl[i] = e.target.value; upIg({ slides: sl }); }} className="w-full mt-micro bg-surface-2 text-muted text-body-sm p-stack-tight rounded border border-border" />)}</Field>
                </>}
                {isVideo(editing) && <>
                  {(["hook", "body", "cta"] as const).map((kk) => <Field key={kk} label={kk.toUpperCase()}><input value={text.shorts?.[kk] || ""} onChange={(e) => upText({ shorts: { ...(text.shorts || {}), [kk]: e.target.value } })} className="w-full bg-surface-2 text-muted text-body p-stack-tight rounded border border-border" /></Field>)}
                  {canGenerate && <div className="flex gap-stack-tight items-center"><select value={videoModel} onChange={(e) => setVideoModel(e.target.value)} className="bg-surface-2 text-muted text-caption p-stack-tight rounded border border-border"><option value="minimax_hailuo">Minimax 6cr</option><option value="veo3_1_lite">Veo3.1 8cr</option><option value="marketing_studio_video">MS UGC광고 ~40cr</option></select>{img && <Button size="sm" onClick={() => genVideo(img.localPath)} disabled={!!busy}>{vid ? "영상 재생성" : "영상 생성"}</Button>}</div>}
                </>}

                {/* 비주얼 프롬프트 — 어떤 프롬프트로 생성됐는지 */}
                {canGenerate && !isVideo(editing) && <div>
                  <label className="text-caption text-accent">🎨 비주얼 프롬프트 <span className="text-subtle">— 이 프롬프트로 이미지 생성됨</span></label>
                  <textarea value={text.image_prompt || ""} onChange={(e) => upText({ image_prompt: e.target.value })} className="w-full bg-surface-2 text-muted text-caption p-stack-tight rounded border border-border" rows={3} />
                  <Button size="sm" className="mt-micro" onClick={() => genImage(text.image_prompt || idea)} disabled={!!busy}>이미지 재생성</Button>
                </div>}
                <Button size="sm" onClick={() => genText()} disabled={!!busy}>텍스트 전체 재생성</Button>
              </div>

              {/* 큰 미리보기 */}
              <div><div className="text-[11px] text-subtle mb-2">미리보기</div><div className="bg-bg rounded-lg p-4 flex justify-center"><PlatformPreview platform={editing} text={text} media={media} /></div></div>
            </div>
          </div>
        </>
      )}

      <div className="mt-stack-section text-caption text-subtle">⚠️ 실 발행: 채널 토큰 연결 시 실제 게시(Threads/Instagram 직접 / X·영상은 게이트웨이 P5). 성과는 발행 후 수집. 🛣️ 시나리오2 트렌드 대기 · 시나리오3 롱폼분할 조사중</div>
    </div>
  );
}
