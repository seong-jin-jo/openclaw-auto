"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useChannelConfig, useDesignTools } from "@/hooks/useChannelConfig";
import { useToast } from "@/components/layout/Toast";
import { useUIStore } from "@/store/ui-store";
import { AUTOMATION_FEATURES } from "@/lib/constants";
import { setupGuides } from "@/lib/setup-guides";
import { CredentialForm } from "@/components/shared/CredentialForm";
import { SetupGuide } from "@/components/shared/SetupGuide";
import { ContentGuide } from "./ContentGuide";
import { KeywordsEditor } from "./KeywordsEditor";
import { QueueList } from "@/components/queue/QueueList";
import { fmtAgo } from "@/lib/format";
import Link from "next/link";

/* ---------- Card News Editor ---------- */
interface CardEditorState {
  title: string;
  slides: string[];
  style: string;
  ending: string;
  caption: string;
  hashtags: string;
  generating: boolean;
  outlining: boolean;
  result: { slides: string[]; batchId?: string; totalSlides: number } | null;
}

function CardNewsEditor({ onReload, editingPostId, onBackToQueue }: { onReload: () => void; editingPostId?: string | null; onBackToQueue?: () => void }) {
  const { showToast } = useToast();
  const { data: designToolsData } = useDesignTools();
  const designTools = (designToolsData || {}) as Record<string, Record<string, unknown>>;
  const hasFigmaMcp = !!designTools.figma?.mcpAccessToken;
  const [mjGenerating, setMjGenerating] = useState(false);
  const [ed, setEd] = useState<CardEditorState>({
    title: "", slides: [""], style: "dark", ending: "", caption: "", hashtags: "",
    generating: false, outlining: false, result: null,
  });

  const aiOutline = async () => {
    const title = (document.getElementById("card-title") as HTMLInputElement)?.value?.trim();
    if (!title) { showToast("주제를 입력하세요", "warning"); return; }
    setEd(prev => ({ ...prev, title, outlining: true }));
    try {
      const r = await apiPost<{ success: boolean; slides?: string[]; caption?: string; hashtags?: string[] }>("/api/card-news/outline", { title });
      if (r?.success) {
        setEd(prev => ({
          ...prev,
          outlining: false,
          slides: r.slides || [""],
          caption: r.caption || "",
          hashtags: (r.hashtags || []).map(h => "#" + h).join(" "),
        }));
        showToast(`${r.slides?.length || 0}장 초안 생성 완료`, "success");
      } else { setEd(prev => ({ ...prev, outlining: false })); }
    } catch (e) { showToast((e as Error).message, "error"); setEd(prev => ({ ...prev, outlining: false })); }
  };

  const generate = async () => {
    const title = (document.getElementById("card-title") as HTMLInputElement)?.value || "";
    const ending = (document.getElementById("card-ending") as HTMLInputElement)?.value || "";
    // read slide textareas
    const slideEls = document.querySelectorAll<HTMLTextAreaElement>("[data-card-slide]");
    const slides = [...slideEls].map(el => el.value);
    if (!title) { showToast("제목을 입력하세요", "warning"); return; }
    if (!slides.some(s => s.trim())) { showToast("슬라이드 내용을 입력하세요", "warning"); return; }

    setEd(prev => ({ ...prev, title, ending, generating: true }));
    try {
      const r = await apiPost<{ success: boolean; batchId: string; slides: string[]; totalSlides: number }>(
        "/api/card-news/generate",
        { title, slides: slides.filter(s => s.trim()), style: ed.style, ending: ending || title },
      );
      if (r?.success) {
        setEd(prev => ({ ...prev, generating: false, result: r }));
        showToast(`카드뉴스 ${r.totalSlides}장 생성 완료`, "success");
      } else { setEd(prev => ({ ...prev, generating: false })); }
    } catch (e) { showToast((e as Error).message, "error"); setEd(prev => ({ ...prev, generating: false })); }
  };

  const saveDraft = async () => {
    if (!ed.result) return;
    const caption = (document.getElementById("card-caption") as HTMLTextAreaElement)?.value || ed.title;
    const hashStr = (document.getElementById("card-hashtags") as HTMLInputElement)?.value || "";
    const hashtags = hashStr.split(/[#\s]+/).filter(h => h.trim());
    try {
      if (editingPostId) {
        await apiPost(`/api/queue/${editingPostId}/update`, {
          text: caption, hashtags,
          imageUrl: ed.result.slides[0], imageUrls: ed.result.slides, cardBatchId: ed.result.batchId,
        });
        showToast("Draft 업데이트됨", "success");
      } else {
        const r = await apiPost<{ success: boolean }>("/api/queue/add", {
          text: caption, topic: "instagram-card", hashtags,
          imageUrl: ed.result.slides[0], imageUrls: ed.result.slides, cardBatchId: ed.result.batchId,
        });
        if (r?.success) showToast("큐에 Draft 저장됨", "success");
      }
      setEd({ title: "", slides: [""], style: "dark", ending: "", caption: "", hashtags: "", generating: false, outlining: false, result: null });
      onReload();
      if (editingPostId && onBackToQueue) onBackToQueue();
    } catch (e) { showToast((e as Error).message, "error"); }
  };

  const addSlide = () => {
    const slideEls = document.querySelectorAll<HTMLTextAreaElement>("[data-card-slide]");
    const updated = [...slideEls].map(el => el.value);
    updated.push("");
    setEd(prev => ({ ...prev, slides: updated }));
  };
  const removeSlide = (idx: number) => {
    const slideEls = document.querySelectorAll<HTMLTextAreaElement>("[data-card-slide]");
    const updated = [...slideEls].map(el => el.value);
    updated.splice(idx, 1);
    setEd(prev => ({ ...prev, slides: updated }));
  };
  const removeResultSlide = (idx: number) => {
    if (mjGenerating) { showToast("미드저니 생성 중 — 완료 후 삭제하세요", "warning"); return; }
    if (!ed.result) return;
    const newSlides = [...ed.result.slides];
    newSlides.splice(idx, 1);
    setEd(prev => ({ ...prev, result: prev.result ? { ...prev.result, slides: newSlides, totalSlides: newSlides.length } : null }));
  };
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const handleDrop = (dropIdx: number) => {
    if (dragIdx === null || dragIdx === dropIdx || !ed.result) return;
    const slides = [...ed.result.slides];
    const [moved] = slides.splice(dragIdx, 1);
    slides.splice(dropIdx, 0, moved);
    setEd(prev => ({ ...prev, result: prev.result ? { ...prev.result, slides } : null }));
    setDragIdx(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const uploaded: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/images/upload", { method: "POST", body: formData });
        const d = await res.json();
        if (d.url) uploaded.push(d.url);
      } catch { /* skip */ }
    }
    if (uploaded.length) {
      setEd(prev => {
        const currentSlides = prev.result?.slides || [];
        const newSlides = [...currentSlides, ...uploaded];
        return { ...prev, result: { slides: newSlides, totalSlides: newSlides.length, batchId: prev.result?.batchId || "upload" } };
      });
      showToast(`${uploaded.length}장 추가됨`, "success");
    }
    e.target.value = "";
  };

  return (
    <>
    {editingPostId && onBackToQueue && (
      <button onClick={onBackToQueue} className="text-gray-500 hover:text-gray-300 text-xs mb-3 block">← Queue로 돌아가기</button>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Editor */}
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">카드뉴스 만들기</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">주제 입력</label>
              <div className="flex gap-2">
                <input id="card-title" type="text" defaultValue={ed.title} placeholder="예: AI 코딩 도구 비교 2026" className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300" />
                <button onClick={aiOutline} disabled={ed.outlining} className={`px-3 py-2 bg-purple-700 text-white text-xs rounded hover:bg-purple-600 flex-shrink-0 ${ed.outlining ? "opacity-50 cursor-wait" : ""}`}>
                  {ed.outlining ? "생성중..." : "AI 초안"}
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">주제 입력 후 &quot;AI 초안&quot; 클릭하면 슬라이드 내용을 자동 생성합니다</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">스타일</label>
              <div className="flex gap-2">
                {["dark", "light", "gradient", "tech", "warm"].map(s => (
                  <button key={s} onClick={() => setEd(prev => ({ ...prev, style: s }))} className={`px-3 py-1.5 text-xs rounded ${ed.style === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-500">슬라이드 (각 장의 텍스트)</label>
                <button onClick={addSlide} className="text-[10px] text-blue-400 hover:text-blue-300">+ 슬라이드 추가</button>
              </div>
              <div className="space-y-2">
                {ed.slides.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-[10px] text-gray-600 mt-2 w-4">{i + 1}</span>
                    <textarea data-card-slide={i} className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300" rows={3} placeholder={`슬라이드 ${i + 1} 내용`} defaultValue={s} />
                    {ed.slides.length > 1 && <button onClick={() => removeSlide(i)} className="text-red-400 hover:text-red-300 text-xs mt-2">x</button>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">엔딩 슬라이드</label>
              <input id="card-ending" type="text" defaultValue={ed.ending} placeholder="자세한 내용은 프로필 링크에서 확인하세요" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300" />
            </div>
            <button onClick={generate} disabled={ed.generating} className={`w-full py-2.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 ${ed.generating ? "opacity-50 cursor-wait" : ""}`}>
              {ed.generating ? "생성 중..." : "카드뉴스 생성"}
            </button>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">캡션 &amp; 해시태그</h3>
          <textarea id="card-caption" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 mb-2" rows={4} placeholder="Instagram 캡션을 입력하세요" defaultValue={ed.caption} />
          <input id="card-hashtags" type="text" defaultValue={ed.hashtags} placeholder="#AI #코딩 #개발 ..." className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300" />
        </div>
      </div>

      {/* Right: Preview */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">프리뷰</h3>
        {ed.result ? (
          <>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-500">{ed.result.slides.length} slides</p>
                <div className="flex gap-2">
                  <label className="text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer">
                    + 이미지 추가
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
                  </label>
                  <button onClick={() => {
                    if (!ed.result) return;
                    ed.result.slides.forEach((url, i) => {
                      const a = document.createElement("a");
                      a.href = url; a.download = `slide-${i + 1}.png`; a.target = "_blank";
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    });
                  }} className="text-[10px] text-gray-500 hover:text-gray-400">다운로드</button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                {ed.result.slides.map((s, i) => (
                  <div
                    key={`${s}-${i}`}
                    className={`flex-shrink-0 relative group ${dragIdx === i ? "opacity-40" : ""}`}
                    style={{ minWidth: 128 }}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragEnd={() => setDragIdx(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(i)}
                  >
                    <div className="w-32 h-40 rounded-lg overflow-hidden border border-gray-700 cursor-pointer" onClick={() => setPreviewImg(s)}>
                      <img src={s} alt={`Slide ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                    </div>
                    <button onClick={() => removeResultSlide(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">✕</button>
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <button onClick={saveDraft} className="w-full py-2 bg-green-700 text-white text-sm rounded hover:bg-green-600">{editingPostId ? "Draft 업데이트" : "큐에 Draft 저장"}</button>
              {hasFigmaMcp && (
                <div className="flex gap-2">
                  <button onClick={async () => {
                    if (!ed.result) return;
                    try {
                      const r = await apiPost<{ ok: boolean }>("/api/figma/push-card", {
                        slides: ed.result.slides,
                        title: (document.getElementById("card-title") as HTMLInputElement)?.value || "",
                      });
                      if (r?.ok) showToast("Figma에 올리기 완료", "success");
                    } catch (e) { showToast((e as Error).message, "error"); }
                  }} className="flex-1 py-1.5 bg-indigo-700 text-white text-xs rounded hover:bg-indigo-600">Figma에 올리기</button>
                  <button onClick={async () => {
                    const url = window.prompt("Figma 파일 URL을 입력하세요:");
                    if (!url) return;
                    const match = url.match(/figma\.com\/(?:file|design)\/([^/]+)/);
                    if (!match) { showToast("올바른 Figma URL이 아닙니다", "error"); return; }
                    try {
                      const r = await apiPost<{ ok: boolean; slides?: string[]; count?: number }>("/api/figma/export-to-queue", { fileKey: match[1] });
                      if (r?.ok) {
                        if (r.slides) {
                          setEd(prev => ({ ...prev, result: { slides: r.slides!, totalSlides: r.slides!.length, batchId: prev.result?.batchId || "figma" } }));
                        }
                        showToast(`${r.count || 0}장 가져옴`, "success");
                      }
                    } catch (e) { showToast((e as Error).message, "error"); }
                  }} className="flex-1 py-1.5 bg-indigo-900 text-indigo-300 text-xs rounded hover:bg-indigo-800 border border-indigo-700">Figma에서 가져오기</button>
                </div>
              )}
              <button onClick={() => setEd(prev => ({ ...prev, result: null }))} className="w-full py-1.5 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600">카드 재생성</button>
              <details className="text-[10px]">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-400">미드저니 이미지 추가 (선택)</summary>
                <div className="mt-2 flex gap-2">
                  <input id="mj-bg-prompt" type="text" placeholder="이미지 프롬프트 (영문 권장)" className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300" />
                  <button onClick={async () => {
                    const prompt = (document.getElementById("mj-bg-prompt") as HTMLInputElement)?.value?.trim();
                    if (!prompt) { showToast("프롬프트를 입력하세요", "warning"); return; }
                    setMjGenerating(true);
                    try {
                      const r = await apiPost<{ success: boolean; imagePath?: string }>("/api/midjourney/generate", { prompt: prompt + " --ar 4:5" });
                      if (r?.success && r.imagePath) {
                        setEd(prev => {
                          const currentSlides = prev.result?.slides || [];
                          const newSlides = [...currentSlides, r.imagePath!];
                          return { ...prev, result: { slides: newSlides, totalSlides: newSlides.length, batchId: prev.result?.batchId || "mj" } };
                        });
                        showToast("미드저니 이미지 추가됨", "success");
                      } else { showToast("미드저니 생성 실패", "error"); }
                    } catch (e) { showToast((e as Error).message, "error"); }
                    finally { setMjGenerating(false); }
                  }} disabled={mjGenerating} className={`px-3 py-1.5 bg-amber-700 text-white text-xs rounded hover:bg-amber-600 flex-shrink-0 ${mjGenerating ? "opacity-50 cursor-wait" : ""}`}>
                    {mjGenerating ? "생성중..." : "생성"}
                  </button>
                </div>
              </details>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-600">
            <div className="text-center">
              <p className="text-sm mb-1">카드뉴스를 생성하면 여기에 프리뷰가 표시됩니다</p>
              <p className="text-[10px]">제목 + 슬라이드 텍스트 입력 후 &quot;카드뉴스 생성&quot; 클릭</p>
            </div>
          </div>
        )}
      </div>
      {previewImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer" style={{ backdropFilter: "blur(4px)" }} onClick={() => setPreviewImg(null)}>
          <img src={previewImg} className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl" alt="Preview" />
        </div>
      )}
    </div>
    </>
  );
}

/* ---------- Instagram Settings ---------- */
function InstagramSettings() {
  const { showToast } = useToast();
  const { data: channelConfig, mutate: mutateConfig } = useChannelConfig();
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const cfg = (channelConfig || {}) as Record<string, Record<string, unknown>>;
  const igCfg = cfg.instagram || {};
  const keys = (igCfg.keys || {}) as Record<string, string>;
  const connected = !!igCfg.connected;
  const sg = setupGuides.instagram || { fields: [], labels: [], quick: ["Setup guide 준비 중"], detail: "" };

  const handleCredSave = async (newKeys: Record<string, string>) => {
    const r = await apiPost<{ verified?: boolean; error?: string; account?: string }>("/api/channel-config/instagram", newKeys);
    if (r?.verified) {
      showToast(`Instagram 연결 완료${r.account ? " — " + r.account : ""}`, "success");
      mutateConfig();
    } else {
      showToast(`연결 실패: ${r?.error || "Invalid credentials"}`, "error");
      throw new Error(r?.error || "Verification failed");
    }
  };

  // Automation
  const { data: channelSettings, mutate: mutateSettings } = useSWR("/api/channel-settings/instagram", fetcher);
  const { data: cronJobs } = useSWR("/api/cron-status", fetcher);
  const { data: cronRunsData } = useSWR("/api/cron-runs", fetcher);
  const cs = (channelSettings as Record<string, unknown>) || {};
  const jobs = (((cronJobs as Record<string, unknown>)?.jobs || cronJobs || []) as Array<Record<string, unknown>>);
  const runs = ((((cronRunsData as Record<string, unknown>)?.runs || []) as Array<Record<string, unknown>>));

  const IG_FEATURE_CRON: Record<string, string> = {
    content_generation: "instagram-generate-drafts",
    auto_publish: "instagram-auto-publish",
  };

  const handleToggle = async (key: string, checked: boolean) => {
    try {
      await apiPost("/api/channel-settings/instagram", { [key]: checked });
      mutateSettings();
      showToast(`${key} ${checked ? "ON" : "OFF"}`, "success");
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const shownCronEditors = new Set<string>();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Credentials */}
      <div className="card p-5">
        <CredentialForm
          channelKey="instagram"
          fields={sg.fields}
          labels={sg.labels}
          currentKeys={keys}
          onSave={handleCredSave}
          title="Instagram Graph API"
          badge={{ text: "Graph API", color: "purple" }}
          connectLabel="Connect Instagram"
        />
      </div>

      {/* Channel Info + Setup Guide */}
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Channel Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={connected ? "text-green-400" : "text-yellow-400"}>
                {connected ? "Connected" : "Not connected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Character Limit</span>
              <span className="text-gray-300">2,200</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Image Format</span>
              <span className="text-gray-300">Carousel / Single</span>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <SetupGuide quick={sg.quick} detail={sg.detail} />
        </div>
      </div>

      {/* Automation */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Automation</h3>
        {AUTOMATION_FEATURES.map((f) => {
          const cronName = IG_FEATURE_CRON[f.key];
          const featureRuns = cronName ? runs.filter((r) => r.jobName === cronName) : [];
          const lastRun = featureRuns[0];
          const expanded = expandedFeature === f.key;
          const job = cronName ? jobs.find((j) => j.id === cronName) as Record<string, unknown> | undefined : undefined;
          const hours = job?.everyMs ? Math.round((job.everyMs as number) / 3600000) : null;
          const showInterval = cronName && !shownCronEditors.has(cronName);
          if (cronName) shownCronEditors.add(cronName);

          const isImplemented = (f as Record<string, unknown>).implemented !== false;
          const showComingSoon = !isImplemented || (!cronName && !["content_generation", "auto_publish"].includes(f.key));

          return (
            <div key={f.key} className="border-b border-gray-800/50 last:border-0">
              <div className="flex items-center gap-3 py-2.5 cursor-pointer" onClick={() => setExpandedFeature(expanded ? null : f.key)}>
                <label className={`relative inline-flex items-center shrink-0 ${showComingSoon ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={!!(cs[f.key])} onChange={(e) => !showComingSoon && handleToggle(f.key, e.target.checked)} disabled={showComingSoon} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${showComingSoon ? "text-gray-600" : "text-gray-300"}`}>{f.label}</span>
                    {showComingSoon && <span className="text-[9px] text-gray-700">Coming Soon</span>}
                    {hours && <span className="text-[10px] text-gray-600">{hours}h</span>}
                    {lastRun && (
                      <>
                        <span className={`text-[10px] ${lastRun.status === "ok" ? "text-green-400" : "text-red-400"}`}>
                          {lastRun.status === "ok" ? "\u2713" : "\u2717"}
                        </span>
                        <span className="text-[10px] text-gray-600">{lastRun.finishedAt ? fmtAgo(lastRun.finishedAt) : ""}</span>
                      </>
                    )}
                    {(featureRuns.length > 0 || hours) && (
                      <svg className={`w-3 h-3 text-gray-600 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600">{f.description}</p>
                </div>
              </div>
              {expanded && (
                <div className="ml-12 mb-3 space-y-1.5">
                  {showInterval && hours && (
                    <div className="flex items-center gap-2 py-1.5 px-2 bg-gray-900/50 rounded mb-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-gray-400">Interval</span>
                      <select
                        defaultValue={hours}
                        onChange={async (e) => {
                          const h = parseInt(e.target.value, 10);
                          if (confirm(`주기를 ${h}h으로 변경?`)) {
                            try {
                              await apiPost(`/api/cron/${cronName}/interval`, { hours: h });
                              showToast(`주기 변경: ${h}h`, "success");
                            } catch (err) { showToast(`실패: ${(err as Error).message}`, "error"); }
                          }
                        }}
                        className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-300"
                      >
                        {[1, 2, 3, 4, 6, 8, 12, 24, 48, 168].map((h) => (
                          <option key={h} value={h}>{h < 24 ? `${h}h` : h === 24 ? "1d" : h === 48 ? "2d" : "7d"}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {featureRuns.length > 0 ? (
                    featureRuns.slice(0, 10).map((r, i) => {
                      const ts = r.finishedAt ? new Date(r.finishedAt as string).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : "";
                      return (
                        <div key={i} className="flex items-start gap-2 py-1">
                          <span className={`text-[10px] mt-0.5 ${r.status === "ok" ? "text-green-400" : "text-red-400"}`}>
                            {r.status === "ok" ? "\u2713" : "\u2717"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500">{ts}</span>
                              <span className="text-[10px] text-gray-700">{String(r.model || "")}</span>
                              <span className="text-[10px] text-gray-700 ml-auto">{Math.round(Number(r.durationMs) / 1000)}s</span>
                            </div>
                            <p className="text-[10px] text-gray-500 break-words">{String(r.summary || "")}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[10px] text-gray-600">실행 이력 없음</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Content Guide + Keywords */}
      <ContentGuide channel="instagram" />
      <KeywordsEditor channel="instagram" />
    </div>
  );
}

/* ---------- Main Instagram Page ---------- */
export function InstagramPage() {
  const { data: channelConfig, mutate: mutateConfig } = useChannelConfig();
  const { subTab, setSubTab } = useUIStore();
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const cfg = (channelConfig || {}) as Record<string, Record<string, unknown>>;
  const igCfg = cfg.instagram || {};
  const connected = !!igCfg.connected;

  // Load queue for reload callback
  const { mutate: mutateQueue } = useSWR("/api/queue", fetcher);

  const tabs = ["queue", "editor", "settings"];

  useEffect(() => {
    if (!tabs.includes(subTab)) setSubTab("queue");
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => { mutateQueue(); mutateConfig(); }, [mutateQueue, mutateConfig]);

  return (
    <div className="px-8 py-6">
      <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm mb-1 inline-block">&larr; Back</Link>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">IG</span>
        <div>
          <h2 className="text-xl font-semibold text-white">Instagram</h2>
          <p className="text-xs text-gray-500">{connected ? "Connected" : "Not connected"} {igCfg.userId ? ` · ID: ${igCfg.userId}` : ""}</p>
        </div>
      </div>
      <div className="flex gap-1 mb-6 border-b border-gray-800/50 pb-3">
        {tabs.map(t => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-3 py-1.5 text-sm rounded ${subTab === t ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {subTab === "queue" && (
        connected ? (
          <QueueList
            variant="visual"
            charLimit={2200}
            onEditInEditor={(postId) => { setEditingPostId(postId); setSubTab("editor"); }}
          />
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500 text-sm mb-2">Instagram 계정을 연결하면 큐를 사용할 수 있습니다</p>
            <button onClick={() => setSubTab("settings")} className="text-xs text-blue-400 hover:text-blue-300">Settings에서 연결하기</button>
          </div>
        )
      )}
      {subTab === "editor" && (
        connected ? (
          <CardNewsEditor onReload={reload} editingPostId={editingPostId} onBackToQueue={() => { setEditingPostId(null); setSubTab("queue"); }} />
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500 text-sm mb-2">Instagram 계정을 연결하면 카드뉴스 에디터를 사용할 수 있습니다</p>
            <button onClick={() => setSubTab("settings")} className="text-xs text-blue-400 hover:text-blue-300">Settings에서 연결하기</button>
          </div>
        )
      )}
      {subTab === "settings" && <InstagramSettings />}
    </div>
  );
}
