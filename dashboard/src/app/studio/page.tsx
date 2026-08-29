"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  fetcher,
  apiPost,
  isExternalPublishPersistenceError,
  ApiResponseError,
  type ExternalPublishPersistenceFailure,
} from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { PlatformPreview, PREVIEW_PLATFORMS, type PreviewInlineEditor, type PreviewPlatform } from "@/components/studio/PlatformPreview";
import { CreateRoom, EditRoom, type CreateContentBranch, type EditContentKind } from "@/components/studio/StudioRooms";
import type { StudioGenerationCandidate } from "@/lib/studio/generation/client";
import { useUIStore, type StudioRoom } from "@/store/ui-store";
import { BrandSetupWizard } from "@/components/shared/BrandSetupWizard";
import { RepoConnect } from "@/components/studio/RepoConnect";
import { SchedulePanel } from "@/components/studio/SchedulePanel";
import { trackEvent, type AnalyticsChannel } from "@/lib/analytics/events";
import { authHeaders } from "@/lib/auth";
import { CHANNEL_TEXT_LIMITS, countTextCharacters } from "@/lib/channel-text-limits";
import { Button } from "@/components/shared/Button";
import { RoomHeader } from "@/components/shared/RoomHeader";
import { Field } from "@/components/shared/Field";
import { Stack } from "@/components/shared/Stack";
import { SCHEDULABLE_PLATFORMS } from "@/lib/constants";
import { StudioCommandPanel } from "@/components/studio/StudioCommandPanel";
import type { EditorHandoff } from "@/lib/studio/editor-handoff";
import { resolveStudioRoomFromSearch, shouldLoadPublishResources } from "@/lib/studio/room-routing";
import { buildPublishReturnWork, readPublishReturnRequest, resolvePublishReturnDraftId } from "@/lib/publish-return-context";
import {
  defaultContentEditFormat,
  validateContentEditFormat,
  type ContentEditFormat,
} from "@/lib/studio/content-edit-format";
import type { CurrentWork } from "@/lib/studio/current-work";

// SNS-007: /api/publish가 실제로 계정별 발행을 받는 4개 플랫폼(threads/x/facebook/instagram)만
// 계정 셀렉터를 노출한다. shorts/reels/tiktok은 /api/publish 미지원(실발행 분기 없음. 위
// ChannelConnect.tsx 주석과 동일 SSOT 판단)이라 대상에서 뺀다.
const PREVIEW_PLATFORM_KEYS = new Set<string>(PREVIEW_PLATFORMS.map((platform) => platform.key));
const PUBLISH_SUPPORTED = new Set<PreviewPlatform>(
  SCHEDULABLE_PLATFORMS.filter((platform) => PREVIEW_PLATFORM_KEYS.has(platform)) as PreviewPlatform[],
);
const ACCOUNT_SELECTABLE = PUBLISH_SUPPORTED;
interface AccountOption { id: string; label: string; is_default: boolean }
interface FirstCommentCapability { platform: PreviewPlatform; supported: boolean; reason: string | null }

// apiPost는 non-2xx에서 throw한다(ApiResponseError). 생성 함수들이 `r?.ok` 체크만 믿고
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
type PublishReconciliationMap = Record<string, PublishReconciliation>;

function normalizePublishReconciliations(value: unknown): PublishReconciliationMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const candidate = value as Record<string, unknown>;
  if (candidate.retryPublish === false && typeof candidate.platform === "string") {
    return { [candidate.platform]: candidate as PublishReconciliation };
  }
  return Object.fromEntries(Object.entries(candidate).filter((entry): entry is [string, PublishReconciliation] => {
    const reconciliation = entry[1] as Partial<PublishReconciliation> | null;
    return Boolean(reconciliation && reconciliation.retryPublish === false && reconciliation.platform === entry[0]);
  }));
}

function studioWorkStorageKey(workspaceId: string): string {
  return `studio_work:${workspaceId}`;
}

const GROUPS: { title: string; platforms: PreviewPlatform[] }[] = [
  { title: "텍스트", platforms: ["threads", "x", "facebook"] },
  { title: "세로 영상", platforms: ["shorts", "reels", "tiktok"] },
  { title: "카드뉴스", platforms: ["instagram"] },
];
const ALL: PreviewPlatform[] = PREVIEW_PLATFORMS.map((platform) => platform.key);

// 플랫폼마다 본문을 다르게 지어내지 않는다. 같은 본문을 그 플랫폼 한도까지만 줄여 보여준다.
// 한도를 넘으면 줄임표를 붙여 잘린 사실이 화면에서 보이게 한다.
function trimToChannelLimit(body: string, channel: keyof typeof CHANNEL_TEXT_LIMITS): string {
  const limit = CHANNEL_TEXT_LIMITS[channel];
  if (countTextCharacters(body) <= limit) return body;
  return `${body.slice(0, Math.max(0, limit - 1))}…`;
}
const DEFAULT_PUBLISH_TARGETS = new Set<PreviewPlatform>(["threads", "x", "instagram"]);
const normalizeIncludes = (saved?: Record<string, boolean>): Record<string, boolean> => (
  Object.fromEntries(ALL.map((platform) => [
    platform,
    PUBLISH_SUPPORTED.has(platform) && (saved?.[platform] ?? DEFAULT_PUBLISH_TARGETS.has(platform)),
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
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const { activeWorkspace, studioRoom: storedRoom, setStudioRoom: setActiveRoom } = useUIStore();
  const activeRoom = resolveStudioRoomFromSearch(
    `?${search}`,
    storedRoom,
  );
  const publishReturnRequest = readPublishReturnRequest(search);
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
  const { data: hist, mutate: mutateHist } = useSWR<{ drafts: Array<Record<string, unknown>>; currentWork?: CurrentWork | null }>(activeWorkspace ? `/api/studio/drafts?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const { data: publishReturnQueue } = useSWR<{ posts: Array<Record<string, unknown>> }>(
    activeWorkspace && publishReturnRequest
      ? `/api/queue?status=all&returnTo=${publishReturnRequest.sourceRoute}&tenant_id=${activeWorkspace.id}`
      : null,
    fetcher,
  );
  const { data: brandData, mutate: mutateBrand } = useSWR<{ guide: { prompt_guide?: string } | null }>(
    activeWorkspace ? `/api/studio/brand-setup?tenant_id=${activeWorkspace.id}` : null, fetcher);
  const { data: firstCommentData } = useSWR<{ capabilities: FirstCommentCapability[] }>(
    shouldLoadPublishResources(activeRoom) ? "/api/publish/first-comment-capabilities" : null,
    fetcher,
  );
  const [showWorks, setShowWorks] = useState(false);
  const [chatOpen, setChatOpen] = useState(true); // 좁은 화면에서도 대화창은 항상 손에 닿는다
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
  const [publishReconciliations, setPublishReconciliations] = useState<PublishReconciliationMap>({});
  const [editorHandoff, setEditorHandoff] = useState<EditorHandoff | null>(null);
  const [includes, setIncludes] = useState<Record<string, boolean>>(() => normalizeIncludes());
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [hashtags, setHashtags] = useState<Record<string, string>>({});
  const [firstComments, setFirstComments] = useState<Record<string, string>>({});
  // 플랫폼별 캡션 덮어쓰기. 세로영상 세 곳(Shorts, Reels, TikTok)은 원본 대본 하나를 공유하던
  // 탓에 한 곳을 고치면 나머지도 같이 바뀌었다. 여기에 플랫폼 키로 따로 담아 각자 편집한다.
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [reviewQueueId, setReviewQueueId] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [publishChatDraft, setPublishChatDraft] = useState("");
  const [editLines, setEditLines] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<StudioGenerationCandidate | null>(null);
  const [createBranch, setCreateBranch] = useState<CreateContentBranch>("video");
  const [editKind, setEditKind] = useState<EditContentKind>("video");
  const [editFormat, setEditFormat] = useState<ContentEditFormat>(() => defaultContentEditFormat("video"));
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
  // 기본계정으로 resolve(/api/publish 계약과 동일). 계정이 1개뿐이면 셀렉터 자체를 숨긴다.
  const [accountsByPlatform, setAccountsByPlatform] = useState<Record<string, AccountOption[]>>({});
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const publishTargets = selectedPublishTargets(includes).filter((platform) => (accountsByPlatform[platform] || []).length > 0);

  useEffect(() => {
    const requested = resolveStudioRoomFromSearch(`?${search}`, storedRoom);
    if (requested !== storedRoom) setActiveRoom(requested);
  }, [search, setActiveRoom, storedRoom]);

  const changeRoom = (room: StudioRoom) => {
    setActiveRoom(room);
    window.history.replaceState(null, "", `/studio?room=${room}`);
    setShowWorks(false);
  };

  useEffect(() => {
    setSelectedAccounts({});
    setAccountsLoaded(false);
    if (!shouldLoadPublishResources(activeRoom) || !activeWorkspace) { setAccountsByPlatform({}); return; }
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
      const nextAccounts = Object.fromEntries(entries);
      setAccountsByPlatform(nextAccounts);
      setIncludes((current) => Object.fromEntries(ALL.map((platform) => [
        platform,
        Boolean(current[platform]) && (nextAccounts[platform]?.length ?? 0) > 0,
      ])));
      setAccountsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [activeRoom, activeWorkspace]);
  const cancelRef = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);
  const onDrag = useCallback((event: MouseEvent) => {
    if (!dragRef.current || !drawerRef.current) return;
    const width = Math.min(window.innerWidth * 0.9, Math.max(320, window.innerWidth - event.clientX));
    drawerRef.current.style.width = `${width}px`;
  }, []);
  useEffect(() => {
    const up = () => (dragRef.current = false);
    window.addEventListener("mousemove", onDrag); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", onDrag); window.removeEventListener("mouseup", up); };
  }, [onDrag]);
  // ── 작업 데이터 유지 (나갔다 와도 복원) ──
  const [hydratedWorkspaceId, setHydratedWorkspaceId] = useState<string | null>(null);
  useEffect(() => {
    const workspaceId = activeWorkspace?.id ?? null;
    setHydratedWorkspaceId(null);
    setIdea(""); setText(null); setImg(null); setVid(null); setDraftId(null);
    setIncludes(normalizeIncludes()); setPublishReconciliations({}); setEditorHandoff(null);
    setDisplayNames({}); setTitles({}); setHashtags({}); setFirstComments({});
    setEditLines([]); setReviewQueueId(null); setSelectedCandidate(null);
    setCreateBranch("video"); setEditKind("video"); setEditFormat(defaultContentEditFormat("video"));
    setPub({ running: false, stopped: false, status: {}, urls: {}, errors: {} });
    if (!workspaceId) return;
    try {
      localStorage.removeItem("studio_work");
      const raw = localStorage.getItem(studioWorkStorageKey(workspaceId));
      if (raw) {
        const w = JSON.parse(raw);
        setIdea(w.idea || ""); setText(w.text || null); setImg(w.img || null); setVid(w.vid || null);
        if (w.includes) setIncludes(normalizeIncludes(w.includes)); setDraftId(w.draftId || null);
        setPublishReconciliations(normalizePublishReconciliations(w.publishReconciliations ?? w.publishReconciliation));
        setDisplayNames(w.displayNames || {}); setTitles(w.titles || {}); setHashtags(w.hashtags || {});
        setFirstComments(w.firstComments || {}); setCaptions(w.captions || {}); setEditLines(w.editLines || []); setReviewQueueId(w.reviewQueueId || null);
        if (w.createBranch === "video" || w.createBranch === "text_image") setCreateBranch(w.createBranch);
        if (w.editKind === "video" || w.editKind === "card" || w.editKind === "audio" || w.editKind === "text") {
          setEditKind(w.editKind);
          const formatKind = w.editKind === "text" ? "card" : w.editKind;
          const savedFormat = validateContentEditFormat(w.editFormat);
          setEditFormat(savedFormat.valid && savedFormat.value.kind === formatKind
            ? savedFormat.value
            : defaultContentEditFormat(formatKind));
        }
      }
    } catch { /* noop */ }
    setHydratedWorkspaceId(workspaceId);
  }, [activeWorkspace?.id]);
  useEffect(() => {
    const workspaceId = activeWorkspace?.id;
    if (!workspaceId || hydratedWorkspaceId !== workspaceId) return;
    try { localStorage.setItem(studioWorkStorageKey(workspaceId), JSON.stringify({ idea, text, img, vid, includes, draftId, publishReconciliations, displayNames, titles, hashtags, firstComments, captions, editLines, reviewQueueId, createBranch, editKind, editFormat })); } catch { /* noop */ }
  }, [activeWorkspace?.id, hydratedWorkspaceId, idea, text, img, vid, includes, draftId, publishReconciliations, displayNames, titles, hashtags, firstComments, captions, editLines, reviewQueueId, createBranch, editKind, editFormat]);

  const media = { imgUrl: img?.file, vidUrl: vid?.file };
  const upText = (patch: Partial<TextVariants>) => setText((p) => ({ ...(p || {}), ...patch }));
  const upIg = (patch: Partial<NonNullable<TextVariants["instagram"]>>) => setText((p) => ({ ...(p || {}), instagram: { ...(p?.instagram || {}), ...patch } }));

  async function genText() {
    setLastError(null);
    try {
      const r = await apiPost<TextVariants & { ok?: boolean; error?: string }>("/api/studio/text", { idea, guide, tenant_id: activeWorkspace?.id });
      if (!r?.ok) { const msg = r?.error || "텍스트 생성 실패"; setLastError(`텍스트: ${msg}`); showToast(msg, "error"); return null; }
      // API가 성공을 확인한 뒤에만 발행한다. 클릭 시점 아님.
      trackEvent({ name: "content_generate", params: { kind: "text" } });
      setText(r);
      setEditLines([r.shorts?.hook, r.shorts?.body, r.shorts?.cta].filter((line): line is string => Boolean(line)));
      return r;
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
    setText(null); setImg(null); setVid(null); setDraftId(null); setPublishReconciliations({}); setEditorHandoff(null);
    try {
      setBusy("텍스트 변형 생성 중..."); const t = await genText(); if (!t) return;
      if (canGenerate) {
        setBusy("히어로 이미지 생성 중..."); const image = await genImage(t.image_prompt || idea);
        if (image && withVideo) { setBusy("숏폼 영상 생성 중 (1~2분)..."); await genVideo(image.localPath); }
      }
      showToast(canGenerate ? "OSMU 생성 완료" : "텍스트 생성 완료", "success");
    } finally { setBusy(null); }
  }
  // P8: AI 자동초안. 브랜드 가이드 + 글감을 소스로 후보 초안 N개를 생성(status=draft).
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
      if (r?.ok) { showToast(`AI 자동초안 ${r.savedDrafts ?? 0}개 생성됨. 작업물 전체에서 확인`, "success"); mutateHist(); }
      else showToast(r?.error || "자동초안 생성 실패", "error");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "자동초안 생성 실패", "error");
    } finally { setAutoGen(false); }
  }
  async function save(
    status: "draft" | "published" | "partial" | "stopped" = "draft",
    reconciliations: PublishReconciliationMap = publishReconciliations,
    persistedDraftId: string | null = draftId,
  ) {
    const r = await apiPost<{ id?: string }>("/api/studio/drafts", {
      tenant_id: activeWorkspace?.id,
      id: persistedDraftId,
      idea,
      text,
      img,
      vid,
      includes,
      status,
      publishReconciliations: reconciliations,
      displayNames,
      titles,
      hashtags,
      firstComments,
      captions,
      editLines,
      editFormat,
      publishedAt: status === "published" ? new Date().toISOString() : undefined,
    });
    if (r?.id) setDraftId(r.id); mutateHist(); return r?.id;
  }
  // 플랫폼별 발행 텍스트 추출
  function platformText(p: PreviewPlatform): string {
    if (p === "shorts" || p === "reels" || p === "tiktok") {
      const override = captions[p];
      if (typeof override === "string") return override;
      if (!text) return "";
      return [text.shorts?.hook, text.shorts?.body, text.shorts?.cta].filter(Boolean).join("\n") || text.threads || "";
    }
    if (!text) return "";
    if (p === "threads") return text.threads || "";
    if (p === "facebook") return text.facebook || "";
    if (p === "x") return text.x || "";
    if (p === "instagram") return text.instagram?.caption || "";
    return "";
  }

  function publishText(p: PreviewPlatform): string {
    return [titles[p], platformText(p), hashtags[p]].filter((value) => value?.trim()).join("\n");
  }

  function capabilityFor(platform: PreviewPlatform): FirstCommentCapability {
    return firstCommentData?.capabilities.find((capability) => capability.platform === platform)
      ?? { platform, supported: false, reason: "백엔드 응답 확인 중" };
  }

  async function publish() {
    if (!text) return;
    if (!activeWorkspace) { showToast("워크스페이스를 선택하세요", "error"); return; }
    if (Object.keys(publishReconciliations).length > 0) {
      showToast("외부 게시가 이미 완료된 항목입니다. 재발행하지 말고 내부 기록을 먼저 복구하세요.", "error");
      return;
    }
    const did = await save("draft");
    if (!did) {
      showToast("발행할 초안을 저장하지 못했습니다", "error");
      return;
    }
    const targets = publishTargets;
    if (!targets.length) { showToast("연결된 발행 계정이 없습니다. 설정에서 채널을 먼저 연결하세요", "error"); return; }
    const status: Record<string, PubStatus> = {}; targets.forEach((p) => (status[p] = "wait"));
    const urls: Record<string, string> = {};
    const errors: Record<string, string> = {};
    const errs: string[] = [];
    const pendingReconciliations: PublishReconciliationMap = {};
    setPub({ running: true, stopped: false, status: { ...status }, urls: {}, errors: {} });
    await Promise.all(targets.map(async (p) => {
      status[p] = "doing";
      setPub({ running: true, stopped: false, status: { ...status }, urls: { ...urls }, errors: { ...errors } });
      let failureReason: string | null = null;
      try {
        // 실 발행: /api/publish (테넌트 채널 토큰). 토큰 없으면 graceful 에러.
        // publish_attempt = 실제 제출 시점(클릭 즉시가 아니라 이 루프 진입 시점). publish_success는
        // API가 ok:true를 반환한 뒤에만 처리한다. 낙관적 발행 금지.
        trackEvent({ name: "publish_attempt", params: { channel: p as AnalyticsChannel } });
        const r = await apiPost<{ ok?: boolean; partial?: boolean; permalink?: string; error?: string; firstComment?: { ok?: boolean; error?: string } }>("/api/publish", {
          tenant_id: activeWorkspace.id, platform: p, text: publishText(p), image_url: img?.url, draft_id: did,
          account_id: selectedAccounts[p] || undefined,
          first_comment: capabilityFor(p).supported && firstComments[p]?.trim() ? firstComments[p].trim() : undefined,
          edit_format: editFormat,
        });
        if (r?.ok && !r.partial) { urls[p] = r.permalink || POST_URL[p] || "#"; trackEvent({ name: "publish_success", params: { channel: p as AnalyticsChannel } }); }
        else {
          failureReason = r?.partial
            ? r.firstComment?.error || "본문은 올라갔지만 첫 댓글 발행에 실패했습니다"
            : r?.error || "실패";
          errs.push(`${LABEL[p]}: ${failureReason}`);
        }
      } catch (e) {
        if (isExternalPublishPersistenceError(e)) {
          const reconciliation = e.payload.persistence.reconciliation;
          pendingReconciliations[p] = reconciliation;
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
    }));
    setPub({
      running: false,
      stopped: false,
      status: { ...status },
      urls: { ...urls },
      errors: { ...errors },
    });
    if (Object.keys(pendingReconciliations).length > 0) {
      setPublishReconciliations(pendingReconciliations);
      try {
        await save("partial", pendingReconciliations, did);
      } catch {
        // The same storage incident can prevent the draft write too. The state was
        // already copied to localStorage-bound React state, so keep the no-republish
        // guard active and tell the operator that server-side recovery metadata is absent.
        errs.push("복구 정보 서버 저장 실패·현재 브라우저에만 보존됨");
      }
    } else {
      await save(errs.length ? "partial" : "published", {}, did);
      setPublishReconciliations({});
    }
    if (errs.length) showToast(`발행 결과: ${errs.join(" / ")}`.slice(0, 180), "error");
    else showToast("발행 완료", "success");
  }
  function loadDraft(d: Record<string, unknown>) {
    setIdea((d.idea as string) || ""); setText((d.text as TextVariants) || null);
    setImg((d.img as ImgResult) || null); setVid((d.vid as VidResult) || null);
    setIncludes(d.includes ? normalizeIncludes(d.includes as Record<string, boolean>) : includes); setDraftId(d.id as string);
    const savedReconciliations = normalizePublishReconciliations(d.publishReconciliations ?? d.publishReconciliation);
    setPublishReconciliations(savedReconciliations);
    setEditorHandoff((d.editorHandoff as EditorHandoff) || null);
    setDisplayNames((d.displayNames as Record<string, string>) || {});
    setTitles((d.titles as Record<string, string>) || {});
    setHashtags((d.hashtags as Record<string, string>) || {});
    setFirstComments((d.firstComments as Record<string, string>) || {});
    setCaptions((d.captions as Record<string, string>) || {});
    setEditLines((d.editLines as string[]) || []);
    const savedFormat = validateContentEditFormat(d.editFormat);
    if (savedFormat.valid) {
      setEditKind(savedFormat.value.kind);
      setEditFormat(savedFormat.value);
    }
    showToast(
      Object.keys(savedReconciliations).length > 0
        ? "외부 게시 완료·내부 기록 복구 필요. 재발행 금지"
        : "불러옴. 수정 후 재발행 가능",
      Object.keys(savedReconciliations).length > 0 ? "error" : "success",
    );
  }
  function resumeCurrentWork() {
    const current = hist?.currentWork;
    if (!current) return;
    const draft = hist.drafts.find((item) => item.id === current.draftId);
    if (!draft) return;
    loadDraft(draft);
    if (current.stage === "performance") {
      window.location.assign("/");
      return;
    }
    changeRoom(current.stage);
  }
  const commentHandoffLoaded = useRef<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedDraftId = params.get("draft_id");
    const sourceCommentId = params.get("comment_id");
    if (!requestedDraftId || !sourceCommentId || commentHandoffLoaded.current === requestedDraftId || !hist?.drafts) return;
    const requestedDraft = hist.drafts.find((draft) => draft.id === requestedDraftId);
    if (!requestedDraft) return;
    loadDraft(requestedDraft);
    setActiveRoom("edit");
    commentHandoffLoaded.current = requestedDraftId;
  }, [hist?.drafts, setActiveRoom]);
  const publishReturnLoaded = useRef<string | null>(null);
  useEffect(() => {
    if (!publishReturnRequest || !publishReturnQueue?.posts) return;
    const loadKey = `${publishReturnRequest.sourceRoute}:${publishReturnRequest.queuePostId}`;
    if (publishReturnLoaded.current === loadKey) return;
    const queuePost = publishReturnQueue.posts.find((post) => post.id === publishReturnRequest.queuePostId);
    if (!queuePost) {
      publishReturnLoaded.current = loadKey;
      showToast("돌아갈 작업물을 찾지 못했습니다", "error");
      return;
    }
    const draftResolution = resolvePublishReturnDraftId(publishReturnRequest, queuePost);
    if (!draftResolution.ok) {
      publishReturnLoaded.current = loadKey;
      showToast("주소의 초안과 작업물 연결 정보가 달라 불러오지 않았습니다", "error");
      return;
    }
    const linkedDraftId = draftResolution.draftId;
    if (linkedDraftId && !hist?.drafts) return;
    const linkedDraft = linkedDraftId
      ? hist?.drafts.find((draft) => draft.id === linkedDraftId)
      : null;
    const linkedDraftHasPublishText = linkedDraft?.text !== null
      && typeof linkedDraft?.text === "object";
    if (linkedDraft && linkedDraftHasPublishText) {
      loadDraft(linkedDraft);
    } else {
      const work = buildPublishReturnWork(queuePost);
      if (!work) {
        publishReturnLoaded.current = loadKey;
        showToast("작업물 본문이 없어 발행실로 가져오지 못했습니다", "error");
        return;
      }
      const tagText = work.hashtags.map((tag) => tag.replace(/^#/, "")).join(" ");
      setIdea((linkedDraft?.idea as string) || work.idea);
      setText({
        threads: work.body,
        x: work.body,
        facebook: work.body,
        instagram: { caption: work.body, hashtags: work.hashtags.map((tag) => tag.replace(/^#/, "")) },
        shorts: { hook: work.body, body: "", cta: "" },
      });
      setImg(work.imageUrl ? { url: work.imageUrl, file: work.imageUrl, localPath: work.imageUrl } : null);
      setVid(work.videoUrl ? { url: work.videoUrl, file: work.videoUrl, model: "기존 작업물" } : null);
      setIncludes(work.includedPlatforms.length
        ? normalizeIncludes(Object.fromEntries(ALL.map((platform) => [platform, work.includedPlatforms.includes(platform)])))
        : normalizeIncludes());
      setDisplayNames((linkedDraft?.displayNames as Record<string, string>) || {});
      setTitles((linkedDraft?.titles as Record<string, string>) || {});
      setHashtags((linkedDraft?.hashtags as Record<string, string>) || (tagText ? { instagram: tagText } : {}));
      setFirstComments((linkedDraft?.firstComments as Record<string, string>) || {});
      setCaptions((linkedDraft?.captions as Record<string, string>) || {});
      setEditLines((linkedDraft?.editLines as string[]) || []);
      setDraftId(linkedDraftId);
      setPublishReconciliations(normalizePublishReconciliations(linkedDraft?.publishReconciliations ?? linkedDraft?.publishReconciliation));
      setEditorHandoff((linkedDraft?.editorHandoff as EditorHandoff) || null);
    }
    setReviewQueueId(publishReturnRequest.queuePostId);
    setActiveRoom("publish");
    publishReturnLoaded.current = loadKey;
    showToast(publishReturnRequest.sourceRoute === "inbox" ? "승인 인박스 작업물을 불러왔습니다" : "발행 일정 작업물을 불러왔습니다", "success");
  }, [hist?.drafts, publishReturnQueue?.posts, publishReturnRequest, setActiveRoom, showToast]);
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

  function chooseCandidate(candidate: StudioGenerationCandidate) {
    setSelectedCandidate(candidate);
    const body = [candidate.title, candidate.rationale, ...candidate.format.outline].join("\n");
    setText({
      threads: body,
      x: trimToChannelLimit(body, "x"),
      facebook: body,
      instagram: { caption: candidate.rationale, slides: candidate.format.outline, hashtags: [] },
      shorts: { hook: candidate.title, body: candidate.format.outline.join("\n"), cta: candidate.rationale },
    });
    setEditLines([candidate.title, ...candidate.format.outline, candidate.rationale]);
    const nextKind = candidate.format.content_branch === "video" ? "video" : "card";
    setEditKind(nextKind);
    setEditFormat(defaultContentEditFormat(nextKind));
  }

  function updatePreviewCaption(platform: PreviewPlatform, value: string) {
    if (platform === "threads") upText({ threads: value });
    else if (platform === "x") upText({ x: value });
    else if (platform === "facebook") upText({ facebook: value });
    else if (platform === "instagram") upIg({ caption: value });
    else {
      setCaptions((current) => ({ ...current, [platform]: value }));
      // Shorts는 편집실 대본과 같은 원본을 쓰므로 저장 대상 본문에도 반영한다.
      if (platform === "shorts") upText({ shorts: { ...(text?.shorts || {}), hook: value } });
    }
  }

  function previewEditor(platform: PreviewPlatform): PreviewInlineEditor {
    const capability = capabilityFor(platform);
    return {
      displayName: displayNames[platform] || activeWorkspace?.name || "your_brand",
      title: titles[platform] || "",
      caption: platformText(platform),
      hashtags: hashtags[platform] || (platform === "instagram" ? (text?.instagram?.hashtags || []).join(" ") : ""),
      firstComment: firstComments[platform] || "",
      firstCommentSupported: capability.supported,
      firstCommentReason: capability.reason || undefined,
      onDisplayNameChange: (value) => setDisplayNames((current) => ({ ...current, [platform]: value })),
      onTitleChange: (value) => setTitles((current) => ({ ...current, [platform]: value })),
      onCaptionChange: (value) => updatePreviewCaption(platform, value),
      onHashtagsChange: (value) => {
        setHashtags((current) => ({ ...current, [platform]: value }));
        if (platform === "instagram") upIg({ hashtags: value.split(/[,\s]+/).map((item) => item.replace(/^#/, "")).filter(Boolean) });
      },
      onFirstCommentChange: (value) => setFirstComments((current) => ({ ...current, [platform]: value })),
    };
  }

  async function requestReview() {
    if (!text || !activeWorkspace) {
      showToast("검토할 작업물이 없습니다", "error");
      return;
    }
    setReviewBusy(true);
    try {
      let queueId = reviewQueueId;
      if (!queueId) {
        const linkedDraftId = draftId || await save("draft");
        if (!linkedDraftId) throw new Error("검토 요청용 초안을 저장하지 못했습니다");
        const added = await apiPost<{ post?: { id?: string } }>("/api/queue/add", {
          tenant_id: activeWorkspace.id,
          draftId: linkedDraftId,
          text: publishText(publishTargets[0] || "threads"),
          topic: idea || "Studio 작업물",
          hashtags: (hashtags.instagram || "").split(/[\s,]+/).map((value) => value.replace(/^#/, "")).filter(Boolean),
          imageUrl: img?.url || null,
          videoUrl: vid?.url || null,
        });
        queueId = added?.post?.id || null;
        if (!queueId) throw new Error("검토 요청용 초안을 만들지 못했습니다");
        setReviewQueueId(queueId);
      }
      const response = await apiPost<{ reused?: boolean }>(`/api/queue/${queueId}/request-review`, {
        tenant_id: activeWorkspace.id,
      });
      showToast(response?.reused ? "이미 검토 요청된 작업물입니다" : "승인 인박스로 검토 요청을 보냈습니다", "success");
    } catch (error) {
      showToast(extractApiErrorMessage(error, "검토 요청에 실패했습니다"), "error");
    } finally {
      setReviewBusy(false);
    }
  }

  async function submitPublishChat(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const command = publishChatDraft.trim();
    if (!command) return;
    setPublishChatDraft("");
    if (/검토/.test(command)) await requestReview();
    else if (/날짜|예약/.test(command)) setShowSchedule(true);
    else if (/저장|초안/.test(command)) await save("draft");
    else if (/발행|publish/i.test(command)) await publish();
    else showToast("임시 저장, 승인 인박스로 보내기, 지금 발행, 예약 발행 중 하나로 말씀해 주세요", "error");
  }

  const roomHeader = (
    <RoomHeader
      workspaceName={activeWorkspace?.name}
      subtitle="콘텐츠 작업실"
      roomLabel={activeRoom === "create" ? "생성실" : activeRoom === "edit" ? "편집실" : "발행실"}
      leading={
        <Button onClick={() => setShowWorks((value) => !value)} aria-expanded={showWorks} aria-controls="studio-work-overview">
          작업물 전체 <span className="ml-micro text-accent">{hist?.drafts.length ?? 0}</span>
        </Button>
      }
      trailing={
        <>
          {activeRoom === "create" || activeRoom === "edit" ? (
            <span className="rounded-pill border border-accent/30 bg-surface px-stack py-stack-tight text-caption font-semibold text-accent" data-kind-board>
              지금 만드는 것: {activeRoom === "create" ? createBranch === "video" ? "영상" : "글·카드뉴스" : editKind === "video" ? "영상" : editKind === "card" ? "카드뉴스" : editKind === "text" ? "글" : "음악"}
            </span>
          ) : null}
          <span className="rounded-control border border-border bg-surface-2 px-stack py-stack-tight text-caption text-subtle" title={engine?.error || engine?.model || ""}>AI {engine?.label || "확인 중"}</span>
        </>
      }
    >
      {showWorks ? (
        <div id="studio-work-overview" className="absolute left-0 right-0 top-full z-20 mt-stack space-y-stack rounded-surface border border-border bg-surface p-pad-inset shadow-lg">
          {hist?.currentWork && hist.drafts.some((draft) => draft.id === hist.currentWork?.draftId) ? (
            <div className="flex flex-wrap items-center gap-stack border-b border-border pb-stack" data-current-work={hist.currentWork.stage}>
              <div className="mr-auto min-w-0">
                <span className="block text-caption text-subtle">현재 작업 · {hist.currentWork.stageLabel}</span>
                <b className="block truncate text-body text-text">{hist.currentWork.idea}</b>
              </div>
              <Button variant="primary" onClick={resumeCurrentWork}>
                {hist.currentWork.stage === "create" ? "이어 생성하기" : hist.currentWork.stage === "edit" ? "이어 편집하기" : hist.currentWork.stage === "publish" ? "이어 발행하기" : "성과 보기"}
              </Button>
            </div>
          ) : null}
          <div className="grid gap-stack md:grid-cols-4">
            {(["create", "edit", "publish"] as StudioRoom[]).map((room) => (
              <Button key={room} variant={activeRoom === room ? "primary" : "secondary"} onClick={() => changeRoom(room)} className="min-w-0">
                {room === "create" ? "생성실" : room === "edit" ? "편집실" : "발행실"}
              </Button>
            ))}
            <Link href="/" className="inline-flex min-h-control-touch items-center justify-center rounded-control border border-border bg-surface-2 px-stack text-body-sm font-semibold text-muted hover:bg-surface">성과실</Link>
          </div>
        </div>
      ) : null}
    </RoomHeader>
  );

  if (activeWorkspace && hydratedWorkspaceId !== activeWorkspace.id) {
    return <div aria-busy="true" className="min-h-screen bg-bg" />;
  }

  if (activeRoom === "create") return (
    <div className="px-stack-section py-pad-inset">
      {showWizard && activeWorkspace ? <BrandSetupWizard workspace={activeWorkspace} onComplete={() => { setShowWizard(false); mutateBrand(); showToast("브랜드 가이드 저장됨"); }} onDismiss={() => setShowWizard(false)} /> : null}
      {roomHeader}
      <CreateRoom
        workspaceId={activeWorkspace?.id}
        workspaceName={activeWorkspace?.name}
        guide={guide}
        topic={idea}
        contentBranch={createBranch}
        onContentBranchChange={setCreateBranch}
        onTopicChange={setIdea}
        onOpenLearning={() => setShowWizard(true)}
        onCandidateSelect={chooseCandidate}
        onOpenEditor={() => changeRoom("edit")}
      />
    </div>
  );

  if (activeRoom === "edit") return (
    <div className="px-stack-section py-pad-inset">
      {roomHeader}
      <EditRoom
        lines={editLines.length ? editLines : [text?.shorts?.hook || "", text?.shorts?.body || "", text?.shorts?.cta || ""]}
        onLinesChange={setEditLines}
        kind={editKind}
        initialFormat={editFormat}
        onFormatChange={setEditFormat}
        previewReady={editKind === "video" ? Boolean(vid?.file) : editKind === "card" ? Boolean(img?.file) : false}
        commandPanel={activeWorkspace ? <StudioCommandPanel
          workspaceId={activeWorkspace.id}
          draftId={draftId}
          idea={idea}
          text={text}
          imageUrl={img?.file ?? null}
          videoUrl={vid?.file ?? null}
          editorLines={editLines}
          source={{ generationId: selectedCandidate?.generation_id, candidateId: selectedCandidate?.candidate_id }}
          initialHandoff={editorHandoff}
          preferredKind={editKind === "video" ? "video" : editKind === "audio" ? "audio" : editKind === "text" ? "text" : "card"}
          onKindSelect={(kind) => {
            const nextKind = kind === "video" ? "video" : kind === "audio" ? "audio" : kind === "text" ? "text" : "card";
            setEditKind(nextKind);
            setEditFormat(defaultContentEditFormat(nextKind === "text" ? "card" : nextKind));
          }}
          onDraftId={setDraftId}
          onHandoff={setEditorHandoff}
          onQueueChanged={() => mutateHist()}
        /> : undefined}
      />
    </div>
  );

  if (activeRoom === "publish") return (
    <div className="px-stack-section py-pad-inset">
      {showWizard && activeWorkspace ? <BrandSetupWizard workspace={activeWorkspace} onComplete={() => { setShowWizard(false); mutateBrand(); showToast("브랜드 가이드 저장됨"); }} onDismiss={() => setShowWizard(false)} /> : null}
      {showRepo && activeWorkspace ? <RepoConnect workspace={activeWorkspace} onSynced={() => { mutateBrand(); showToast("브랜드 가이드 갱신됨"); }} onClose={() => setShowRepo(false)} /> : null}
      {roomHeader}
      <section data-room="publish" className="grid gap-stack-section pb-wide lg:grid-cols-[minmax(0,1fr)_20rem] lg:pb-none">
        <div className="min-w-0 space-y-region">
          <section data-room-top="publish" aria-label="이 방에서 지금 알아야 할 것" className="flex min-h-control-touch items-center justify-between rounded-surface border border-border bg-surface px-pad-inset py-stack">
            <b className="text-lead text-accent">{publishTargets.length}곳</b>
            <span className="text-caption text-subtle">발행할 채널</span>
          </section>
          {lastError ? <div className="rounded-control border border-danger/30 bg-danger/10 p-stack text-caption text-danger">마지막 실패: {lastError}</div> : null}
          {vid?.narration?.message ? <div className="rounded-control border border-warning/30 bg-warning/10 p-stack text-caption text-warning">{vid.narration.message}</div> : null}
          {(pub.running || Object.keys(pub.status).length > 0) ? (
            <div className="card flex items-center gap-stack p-stack">
              <div className="w-12 shrink-0"><div className="text-center text-caption font-bold text-success">{pubPct}%</div><progress className="progress-semantic mt-micro h-micro w-full" max={100} value={pubPct} aria-label="발행 진행률" /></div>
              <div className="min-w-0 flex-1">
                <b className="text-body text-text">{pubResultLabel}</b>
                <div className="mt-stack-tight flex flex-wrap gap-stack-tight">{Object.entries(pub.status).map(([key, status]) => {
                  const cls = `rounded-pill border px-stack-tight py-micro text-caption ${status === "done" ? "border-success/30 bg-success/10 text-success" : status === "failed" ? "border-danger/30 bg-danger/10 text-danger" : status === "doing" ? "border-warning/30 bg-warning/10 text-warning" : "border-border bg-surface-2 text-subtle"}`;
                  const value = `${status === "done" ? "✓ " : status === "failed" ? "✕ " : status === "doing" ? "⟳ " : ""}${LABEL[key]}`;
                  return status === "done" && pub.urls[key] ? <a key={key} href={pub.urls[key]} target="_blank" rel="noopener noreferrer" className={cls} title="게시물 보기">{value} ↗</a> : <span key={key} className={cls}>{value}{status === "failed" && pub.errors[key] ? <span className="ml-micro"><span>{pub.errors[key]}</span></span> : null}</span>;
                })}</div>
              </div>
            </div>
          ) : null}
          {showSchedule && activeWorkspace ? <SchedulePanel tenantId={activeWorkspace.id} draftId={draftId} defaultPlatforms={publishTargets} /> : null}
          {accountsLoaded && publishTargets.length === 0 ? (
            <div className="rounded-control border border-warning/30 bg-warning/10 p-stack text-body-sm text-warning">
              연결된 발행 계정이 없습니다. <Link href="/settings" className="font-semibold underline">설정에서 채널 연결하기</Link>
            </div>
          ) : null}
          {text ? (
            <div className="card flex flex-wrap items-center gap-stack p-stack">
              <b className="mr-auto min-w-0 truncate text-body text-text">{idea || "현재 작업물"}</b>
              <Button onClick={() => save("draft")}>임시 저장하기</Button>
              <Button onClick={requestReview} disabled={reviewBusy}>{reviewBusy ? "보내는 중" : "승인 인박스로 보내기"}</Button>
              <Button variant="primary" onClick={publish} disabled={pub.running || !accountsLoaded || publishTargets.length === 0}>선택한 {publishTargets.length}곳에 지금 발행</Button>
              {activeWorkspace ? <Button variant={showSchedule ? "primary" : "secondary"} onClick={() => setShowSchedule((value) => !value)}>예약 발행</Button> : null}
            </div>
          ) : null}
          {GROUPS.map((group) => (
            <section key={group.title}>
              <div className="mb-stack flex items-center gap-stack-tight border-b border-border pb-stack"><b className="text-body text-text">{group.title}</b><span className="text-caption text-subtle">{group.platforms.map((platform) => LABEL[platform]).join(" · ")}</span></div>
              <div className="grid items-start gap-stack-section md:grid-cols-2 xl:grid-cols-3">
                {group.platforms.map((platform) => (
                  <div key={platform} data-room-preview={platform} className="min-w-0 rounded-surface border border-border bg-surface p-stack">
                    <PlatformPreview
                      platform={platform}
                      text={text || {}}
                      media={media}
                      editor={previewEditor(platform)}
                      headerRight={
                        <div className="flex flex-wrap items-center justify-end gap-stack-tight">
                          {PUBLISH_SUPPORTED.has(platform) ? (
                            <label className="flex items-center gap-micro text-caption text-muted">
                              <input aria-label={`${LABEL[platform]} 발행`} type="checkbox" checked={Boolean(includes[platform])} disabled={!accountsLoaded || (accountsByPlatform[platform] || []).length === 0} onChange={(event) => setIncludes((current) => ({ ...current, [platform]: event.target.checked }))} />
                              발행
                            </label>
                          ) : (
                            <label className="flex items-center gap-micro text-caption text-warning">
                              <input aria-label={`${LABEL[platform]} 발행 미지원`} type="checkbox" checked={false} disabled />
                              미지원
                            </label>
                          )}
                          {accountsLoaded && PUBLISH_SUPPORTED.has(platform) && (accountsByPlatform[platform] || []).length === 0 ? (
                            <Link
                              href={`/settings?tab=channels&channel=${platform}`}
                              data-testid={`publish-connect-link-${platform}`}
                              title={`${LABEL[platform]} 계정을 연결하러 갑니다`}
                              className="inline-flex min-h-control-touch items-center rounded-control border border-accent/40 bg-accent-soft px-stack-tight text-caption font-semibold text-accent hover:bg-surface"
                            >
                              계정 연결하기
                            </Link>
                          ) : null}
                          {ACCOUNT_SELECTABLE.has(platform) && (accountsByPlatform[platform] || []).length > 0 ? (
                            <select
                              aria-label={`${LABEL[platform]} 발행 계정`}
                              data-testid={`publish-account-select-${platform}`}
                              value={selectedAccounts[platform] ?? ""}
                              onChange={(event) => setSelectedAccounts((current) => ({ ...current, [platform]: event.target.value }))}
                              className="min-h-control-touch max-w-32 rounded-control border border-border bg-surface-2 px-stack-tight text-caption text-text"
                            >
                              <option value="">기본계정</option>
                              {(accountsByPlatform[platform] || []).map((account) => <option key={account.id} value={account.id}>{account.label}</option>)}
                            </select>
                          ) : null}
                        </div>
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside
          data-chat-dock="persistent"
          data-chat-always="true"
          aria-label="발행 담당 대화창"
          className={`card overflow-hidden lg:static lg:h-fit lg:max-h-none lg:translate-y-0 lg:rounded-surface lg:border lg:shadow-none lg:sticky lg:top-pad-inset fixed inset-x-0 bottom-0 z-40 max-h-[60vh] overflow-y-auto rounded-b-none shadow-lg transition-transform ${chatOpen ? "translate-y-0" : "translate-y-[calc(100%-3.5rem)]"}`}
        >
          <button
            type="button"
            onClick={() => setChatOpen((open) => !open)}
            aria-expanded={chatOpen}
            className="min-h-control-touch w-full border-b border-border px-stack text-left text-body-sm text-text-muted lg:hidden"
          >
            {chatOpen ? "대화창 접기" : "발행 담당에게 말하기"}
          </button>
          <div className="flex items-center gap-stack-tight border-b border-border p-stack">
            <div className="grid h-10 w-10 place-items-center rounded-pill bg-accent text-body font-bold text-accent-fg">O</div>
            <div><b className="block text-body text-text">발행 담당</b><span className="text-caption text-success">지금 대기 중</span></div>
          </div>
          <div className="space-y-stack bg-surface-2 p-stack">
            <div className="max-w-[90%] rounded-surface rounded-tl-chip border border-border bg-surface p-stack text-body-sm text-text" data-empty-next={!text ? "publish" : undefined}>
              {text ? `${publishTargets.length}곳이 선택되어 있습니다.` : "발행할 작업물을 먼저 가져와 주세요."}
            </div>
            {text ? (
              <div className="flex flex-wrap gap-stack-tight" aria-label="발행 담당 빠른 답장">
                <Button size="sm" onClick={publish} disabled={!accountsLoaded || publishTargets.length === 0}>지금 발행하기</Button>
                <Button size="sm" onClick={() => setShowSchedule(true)}>시간은 내가 골라 줘</Button>
                <Button size="sm" onClick={requestReview}>먼저 검토받기</Button>
              </div>
            ) : (
              <Button variant="primary" onClick={() => changeRoom("create")}>생성실 열기</Button>
            )}
          </div>
          <form onSubmit={submitPublishChat} className="flex gap-stack-tight border-t border-border p-stack">
            <input aria-label="발행 담당에게 명령" value={publishChatDraft} onChange={(event) => setPublishChatDraft(event.target.value)} placeholder="직접 쓰셔도 됩니다" className="min-h-control-touch min-w-0 flex-1 rounded-control border border-border bg-surface px-stack text-body-sm text-text" />
            <Button type="submit" variant="primary">보내기</Button>
          </form>
        </aside>
      </section>
    </div>
  );

  return null;
}
