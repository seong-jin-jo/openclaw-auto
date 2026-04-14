"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useChannelConfig, useDesignTools } from "@/hooks/useChannelConfig";
import { useToast } from "@/components/layout/Toast";
import { useUIStore } from "@/store/ui-store";
import { AUTOMATION_FEATURES } from "@/lib/constants";
import { fmtAgo } from "@/lib/format";
import Link from "next/link";

/* ---------- Instagram Queue ---------- */
function InstagramQueue({ posts, filter, setFilter, selectedIds, setSelectedIds, onReload }: {
  posts: QueuePost[];
  filter: string;
  setFilter: (f: string) => void;
  selectedIds: Set<string>;
  setSelectedIds: (s: Set<string>) => void;
  onReload: () => void;
}) {
  const { showToast } = useToast();

  let filtered = posts;
  if (filter === "draft") filtered = posts.filter(p => p.status === "draft");
  else if (filter === "approved") filtered = posts.filter(p => p.status === "approved");
  else if (filter === "published") filtered = posts.filter(p => p.status === "published" || p.channels?.instagram?.status === "published");

  const igPublished = posts.filter(p => p.channels?.instagram?.status === "published").length;
  const igPending = posts.filter(p => p.imageUrl && p.status === "approved" && p.channels?.instagram?.status === "pending").length;
  const filters = ["all", "draft", "approved", "published"];

  const bulkApprove = async () => {
    const ids = [...selectedIds];
    const r = await apiPost<{ approved: number }>("/api/queue/bulk-approve", { ids });
    if (r) { showToast(`${r.approved || ids.length}개 승인`, "success"); setSelectedIds(new Set()); onReload(); }
  };
  const bulkDelete = async () => {
    if (!confirm(`${selectedIds.size}개 삭제?`)) return;
    const ids = [...selectedIds];
    const r = await apiPost<{ deleted: number }>("/api/queue/bulk-delete", { ids });
    if (r) { showToast(`${r.deleted || ids.length}개 삭제`, "success"); setSelectedIds(new Set()); onReload(); }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-3 text-center"><p className="text-lg font-bold text-white">{posts.length}</p><p className="text-[10px] text-gray-500">Total</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-bold text-blue-400">{igPending}</p><p className="text-[10px] text-gray-500">Ready</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-bold text-green-400">{igPublished}</p><p className="text-[10px] text-gray-500">Published</p></div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs rounded ${filter === f ? "bg-blue-600/30 text-blue-300 border border-blue-600/30" : "text-gray-500 hover:bg-gray-800"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          {filtered.filter(p => p.status === "draft" || p.status === "approved").length > 0 && (
            <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    const selectablePosts = filtered.filter(p => (p.status === "draft" || p.status === "approved") && p.imageUrl);
                    setSelectedIds(new Set(selectablePosts.map(p => p.id)));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
                className="rounded border-gray-600"
              />
              All
            </label>
          )}
          {selectedIds.size > 0 && (
            <>
              <button onClick={bulkApprove} className="px-3 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve ({selectedIds.size})</button>
              <button onClick={bulkDelete} className="px-3 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600">Delete ({selectedIds.size})</button>
            </>
          )}
          <span className="text-xs text-gray-500">{filtered.length} posts</span>
        </div>
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && <div className="card p-8 text-center"><p className="text-gray-500 text-sm">No posts</p></div>}
        {filtered.map(p => (
          <InstagramPostCard key={p.id} post={p} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onReload={onReload} />
        ))}
      </div>
    </>
  );
}

/* ---------- Instagram Post Card ---------- */
function InstagramPostCard({ post: p, selectedIds, setSelectedIds, onReload }: {
  post: QueuePost; selectedIds: Set<string>; setSelectedIds: (s: Set<string>) => void; onReload: () => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const sc: Record<string, string> = { draft: "bg-yellow-900/50 text-yellow-300", approved: "bg-blue-900/50 text-blue-300", published: "bg-green-900/50 text-green-300", failed: "bg-red-900/50 text-red-300" };
  const igStatus = p.channels?.instagram?.status || "pending";
  const igBadge: Record<string, string> = { published: "bg-green-900/40 text-green-400", failed: "bg-red-900/40 text-red-400", pending: "bg-gray-800 text-gray-500", skipped: "bg-gray-800 text-gray-600" };
  const slides = p.imageUrls || (p.imageUrl ? [p.imageUrl] : []);
  const isCard = slides.length > 1 || !!p.cardBatchId;

  const approve = async () => {
    await apiPost(`/api/queue/${p.id}/approve`, { hours: 2 });
    showToast("승인 완료", "success");
    onReload();
  };
  const del = async () => {
    if (!confirm("정말 삭제?")) return;
    await apiPost(`/api/queue/${p.id}/delete`);
    showToast("삭제 완료", "success");
    onReload();
  };
  const save = async (text: string) => {
    await apiPost(`/api/queue/${p.id}/update`, { text });
    showToast("수정 완료", "success");
    setEditing(false);
    onReload();
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {(p.status === "draft" || p.status === "approved") && (
            <input
              type="checkbox"
              checked={selectedIds.has(p.id)}
              onChange={(e) => {
                const next = new Set(selectedIds);
                if (e.target.checked) next.add(p.id); else next.delete(p.id);
                setSelectedIds(next);
              }}
              className="rounded border-gray-600 w-3.5 h-3.5"
            />
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded ${sc[p.status] || "bg-gray-700 text-gray-300"}`}>{p.status}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${igBadge[igStatus] || "bg-gray-800 text-gray-500"}`}>IG: {igStatus}</span>
          {isCard && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300">Card {slides.length} slides</span>}
        </div>
        <span className="text-[10px] text-gray-600">{p.id.slice(0, 8)}</span>
      </div>

      {slides.length > 0 ? (
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#374151 transparent" }}>
            {slides.map((s, i) => (
              <div key={i} className="flex-shrink-0 w-36 h-44 rounded-lg overflow-hidden border border-gray-800">
                <img src={s} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-3 w-36 h-44 rounded-lg border border-dashed border-gray-700 bg-gray-900/30 flex items-center justify-center">
          <span className="text-gray-600 text-xs">No Image</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-300">{p.topic || "general"}</span>
        {p.model && <span className="text-[10px] text-gray-600">{p.model}</span>}
      </div>

      {editing ? (
        <>
          <textarea id="ig-edit-textarea" className="w-full bg-gray-800 text-gray-200 text-sm p-2 rounded border border-gray-700 mb-2" rows={4} defaultValue={p.text} />
          <div className="flex gap-2">
            <button onClick={() => { const ta = document.getElementById("ig-edit-textarea") as HTMLTextAreaElement; if (ta) save(ta.value); }} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
            <button onClick={() => setEditing(false)} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap line-clamp-4">{p.text}</p>
      )}

      {(p.hashtags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(p.hashtags ?? []).map((h, i) => <span key={i} className="text-[10px] text-blue-400">#{h}</span>)}
        </div>
      )}

      {!editing && (
        <div className="flex gap-2 pt-2 border-t border-gray-800/50">
          {p.status === "draft" && <button onClick={approve} className="px-3 py-1.5 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve</button>}
          {(p.status === "draft" || p.status === "approved") && <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Edit</button>}
          {p.status === "draft" && <button onClick={del} className="px-3 py-1.5 text-xs bg-red-900/40 text-red-300 rounded hover:bg-red-800">Delete</button>}
        </div>
      )}
    </div>
  );
}

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

function CardNewsEditor({ onReload }: { onReload: () => void }) {
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
      const r = await apiPost<{ success: boolean }>("/api/queue/add", {
        text: caption, topic: "instagram-card", hashtags,
        imageUrl: ed.result.slides[0], imageUrls: ed.result.slides, cardBatchId: ed.result.batchId,
      });
      if (r?.success) {
        showToast("큐에 Draft 저장됨", "success");
        setEd({ title: "", slides: [""], style: "dark", ending: "", caption: "", hashtags: "", generating: false, outlining: false, result: null });
        onReload();
      }
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
    if (!ed.result) return;
    const newSlides = [...ed.result.slides];
    newSlides.splice(idx, 1);
    setEd(prev => ({ ...prev, result: prev.result ? { ...prev.result, slides: newSlides, totalSlides: newSlides.length } : null }));
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
                  <div key={i} className="flex-shrink-0 relative group" style={{ minWidth: 128 }}>
                    <div className="w-32 h-40 rounded-lg overflow-hidden border border-gray-700">
                      <img src={s} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => removeResultSlide(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">x</button>
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <button onClick={saveDraft} className="w-full py-2 bg-green-700 text-white text-sm rounded hover:bg-green-600">큐에 Draft 저장</button>
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
    </div>
  );
}

/* ---------- Instagram Settings ---------- */
function InstagramSettings({ channelConfig, channelSettings }: {
  channelConfig: Record<string, unknown>;
  channelSettings: Record<string, unknown>;
}) {
  const { showToast } = useToast();
  const [showToken, setShowToken] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const ch = channelConfig as { keys?: Record<string, string>; connected?: boolean };
  const keys = ch.keys || {};
  const hasKeys = Object.values(keys).some(v => v);

  const cs = (channelSettings as Record<string, Record<string, boolean>>)?.instagram || {};
  const features = ((channelSettings as Record<string, unknown>)?.features || []) as Array<{ key: string; label: string; description: string }>;
  const igFeatures = ["content_generation", "auto_publish", "instagram_carousel", "image_generation"];

  // Cron run history for Instagram automation
  const { data: cronRunsData } = useSWR("/api/cron-runs", fetcher);
  const cronRuns = ((((cronRunsData as Record<string, unknown>)?.runs || []) as Array<Record<string, unknown>>));

  const IG_FEATURE_CRON: Record<string, string> = {
    content_generation: "instagram-generate-drafts",
    auto_publish: "instagram-auto-publish",
  };

  const handleSave = async () => {
    const token = (document.getElementById("ch-instagram-accessToken") as HTMLInputElement)?.value?.trim();
    const userId = (document.getElementById("ch-instagram-userId") as HTMLInputElement)?.value?.trim();
    const data: Record<string, string> = {};
    if (token) data.accessToken = token;
    if (userId) data.userId = userId;
    const r = await apiPost<{ verified?: boolean; error?: string; account?: string }>("/api/channel-config/instagram", data);
    if (r?.verified) showToast(`Instagram 연결 완료${r.account ? " -- " + r.account : ""}`, "success");
    else showToast(`연결 실패: ${r?.error || "Invalid credentials"}`, "error");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Credentials</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Graph API Access Token</label>
            <div className="relative">
              <input id="ch-instagram-accessToken" type={showToken ? "text" : "password"} defaultValue={keys.accessToken || ""} placeholder="Graph API Access Token" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 pr-16 text-[11px] text-gray-300 placeholder-gray-600 font-mono" />
              <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-300">{showToken ? "Hide" : "Show"}</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Instagram Business User ID</label>
            <input id="ch-instagram-userId" type="text" defaultValue={keys.userId || ""} placeholder="Instagram Business User ID" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-[11px] text-gray-300 placeholder-gray-600 font-mono" />
          </div>
        </div>
        <button onClick={handleSave} className="w-full mt-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">
          {hasKeys ? "Update" : "Connect"}
        </button>
        <div className="mt-4 card p-4 bg-gray-900/50">
          <h4 className="text-xs font-medium text-gray-400 mb-2">Setup Guide</h4>
          <ol className="text-[10px] text-gray-500 space-y-1 list-decimal list-inside">
            <li>Instagram을 Business/Creator 계정으로 전환</li>
            <li>Facebook Page 생성 후 Instagram 계정 연결</li>
            <li>developers.facebook.com &gt; 앱 만들기</li>
            <li>Instagram Graph API + Content Publishing 제품 추가</li>
            <li>테스터 등록 후 Instagram 앱에서 수락</li>
            <li>Graph API Explorer에서 토큰 생성</li>
            <li>{`GET /me/accounts -> 페이지 ID -> GET /{페이지ID}?fields=instagram_business_account -> id가 User ID`}</li>
          </ol>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Automation</h3>
        <div className="space-y-0">
          {features.filter(f => igFeatures.includes(f.key)).map(f => {
            const cronName = IG_FEATURE_CRON[f.key];
            const featureRuns = cronName ? cronRuns.filter((r) => r.jobName === cronName) : [];
            const lastRun = featureRuns[0] as Record<string, unknown> | undefined;
            const expanded = expandedFeature === f.key;
            const sc = lastRun ? (lastRun.status === "ok" ? "text-green-400" : "text-red-400") : "";
            const ago = lastRun?.finishedAt ? fmtAgo(new Date(lastRun.finishedAt as string).toISOString()) : "";

            return (
              <div key={f.key} className="border-b border-gray-800/50 last:border-0">
                <div
                  className="flex items-center gap-3 py-2.5 cursor-pointer"
                  onClick={() => setExpandedFeature(expanded ? null : f.key)}
                >
                  <label className="relative inline-flex items-center cursor-pointer shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      defaultChecked={!!cs[f.key]}
                      onChange={async (e) => {
                        const r = await apiPost(`/api/channel-settings/instagram`, { [f.key]: e.target.checked });
                        if (r) showToast(`Instagram ${f.key} ${e.target.checked ? "ON" : "OFF"}`, "success");
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">{f.label}</span>
                      {lastRun && (
                        <>
                          <span className={`text-[10px] ${sc}`}>{lastRun.status === "ok" ? "\u2713" : "\u2717"}</span>
                          <span className="text-[10px] text-gray-600">{ago}</span>
                        </>
                      )}
                      {featureRuns.length > 0 && (
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
      </div>
    </div>
  );
}

/* ---------- Types ---------- */
interface QueuePost {
  id: string;
  text: string;
  status: string;
  topic?: string;
  model?: string;
  hashtags?: string[];
  imageUrl?: string;
  imageUrls?: string[];
  cardBatchId?: string;
  channels?: Record<string, { status?: string }>;
  generatedAt?: string;
}

/* ---------- Main Instagram Page ---------- */
export function InstagramPage() {
  const { data: channelConfig, mutate: mutateConfig } = useChannelConfig();
  const { subTab, setSubTab } = useUIStore();
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const cfg = (channelConfig || {}) as Record<string, Record<string, unknown>>;
  const igCfg = cfg.instagram || {};
  const connected = !!igCfg.connected;

  // Load queue
  const { data: queueData, mutate: mutateQueue } = useSWR("/api/queue", fetcher);
  const posts = (((queueData as Record<string, unknown>)?.posts || []) as QueuePost[]);

  // Load channel settings
  const { data: channelSettingsData } = useSWR("/api/channel-settings", fetcher);
  const channelSettings = (channelSettingsData || { features: AUTOMATION_FEATURES, settings: {} }) as Record<string, unknown>;

  const tabs = connected ? ["queue", "editor", "settings"] : ["settings"];

  useEffect(() => {
    if (!connected) setSubTab("settings");
    else if (!tabs.includes(subTab)) setSubTab("queue");
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

      {subTab === "queue" && connected && (
        <InstagramQueue
          posts={posts}
          filter={filter}
          setFilter={setFilter}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onReload={reload}
        />
      )}
      {subTab === "editor" && connected && <CardNewsEditor onReload={reload} />}
      {subTab === "settings" && <InstagramSettings channelConfig={igCfg} channelSettings={channelSettings} />}
    </div>
  );
}
