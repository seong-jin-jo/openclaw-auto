"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetcher, apiPost, handleUnauthorizedResponse } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { useToast } from "@/components/layout/Toast";
import { useUIStore } from "@/store/ui-store";
import { setupGuides } from "@/lib/setup-guides";
import { CredentialForm } from "@/components/shared/CredentialForm";
import { SocialConnectButton } from "@/components/channel/SocialConnectButton";
import { AccountManager } from "@/components/channel/AccountManager";
import { SetupGuide } from "@/components/shared/SetupGuide";
import { ContentGuide } from "./ContentGuide";
import { KeywordsEditor } from "./KeywordsEditor";
import { QueueList } from "@/components/queue/QueueList";
import { BackButton } from "@/components/shared/BackButton";
import { TenantAutomationSettings } from "./TenantAutomationSettings";

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
    const errors: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const requestToken = getAuthToken();
        const res = await fetch("/api/images/upload", {
          method: "POST",
          body: formData,
          headers: requestToken ? { Authorization: `Bearer ${requestToken}` } : {},
        });
        if (res.status === 401) {
          handleUnauthorizedResponse(requestToken, false);
          return;
        }
        const d = await res.json();
        if (res.ok && d.url) {
          uploaded.push(d.url);
        } else {
          errors.push(d.error || `${file.name}: 업로드 실패(${res.status})`);
        }
      } catch (err) {
        errors.push(`${file.name}: ${(err as Error).message}`);
      }
    }
    if (uploaded.length) {
      setEd(prev => {
        const currentSlides = prev.result?.slides || [];
        const newSlides = [...currentSlides, ...uploaded];
        return { ...prev, result: { slides: newSlides, totalSlides: newSlides.length, batchId: prev.result?.batchId || "upload" } };
      });
      showToast(`${uploaded.length}장 추가됨`, "success");
    }
    if (errors.length) {
      showToast(errors[0], "error");
    }
    e.target.value = "";
  };

  return (
    <>
    {editingPostId && onBackToQueue && (
      <button onClick={onBackToQueue} className="text-subtle hover:text-muted text-xs mb-3 block">← Queue로 돌아가기</button>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Editor */}
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-muted mb-4">카드뉴스 만들기</h3>
          <div className="space-y-3">
            <div>
              <label className="text-caption text-subtle block mb-1">주제 입력</label>
              <div className="flex gap-2">
                <input id="card-title" type="text" defaultValue={ed.title} placeholder="예: AI 코딩 도구 비교 2026" className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm text-muted" />
                <button onClick={aiOutline} disabled={ed.outlining} className={`px-3 py-2 bg-accent text-text text-xs rounded hover:bg-accent-hover flex-shrink-0 ${ed.outlining ? "opacity-50 cursor-wait" : ""}`}>
                  {ed.outlining ? "생성중..." : "AI 초안"}
                </button>
              </div>
              <p className="text-caption text-subtle mt-1">주제 입력 후 &quot;AI 초안&quot; 클릭하면 슬라이드 내용을 자동 생성합니다</p>
            </div>
            <div>
              <label className="text-caption text-subtle block mb-1">스타일</label>
              <div className="flex gap-2">
                {["dark", "light", "gradient", "tech", "warm"].map(s => (
                  <button key={s} onClick={() => setEd(prev => ({ ...prev, style: s }))} className={`px-3 py-1.5 text-xs rounded ${ed.style === s ? "bg-accent text-text" : "bg-surface-2 text-subtle hover:bg-surface-2"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-caption text-subtle">슬라이드 (각 장의 텍스트)</label>
                <button onClick={addSlide} className="text-caption text-accent hover:text-accent">+ 슬라이드 추가</button>
              </div>
              <div className="space-y-2">
                {ed.slides.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-caption text-subtle mt-2 w-4">{i + 1}</span>
                    <textarea data-card-slide={i} className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm text-muted" rows={3} placeholder={`슬라이드 ${i + 1} 내용`} defaultValue={s} />
                    {ed.slides.length > 1 && <button onClick={() => removeSlide(i)} className="text-danger hover:opacity-80 text-xs mt-2">x</button>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-caption text-subtle block mb-1">엔딩 슬라이드</label>
              <input id="card-ending" type="text" defaultValue={ed.ending} placeholder="자세한 내용은 프로필 링크에서 확인하세요" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-muted" />
            </div>
            <button onClick={generate} disabled={ed.generating} className={`w-full py-2.5 bg-accent text-text text-sm rounded hover:bg-accent-hover ${ed.generating ? "opacity-50 cursor-wait" : ""}`}>
              {ed.generating ? "생성 중..." : "카드뉴스 생성"}
            </button>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-medium text-muted mb-3">캡션 &amp; 해시태그</h3>
          <textarea id="card-caption" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-muted mb-2" rows={4} placeholder="Instagram 캡션을 입력하세요" defaultValue={ed.caption} />
          <input id="card-hashtags" type="text" defaultValue={ed.hashtags} placeholder="#AI #코딩 #개발 ..." className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-muted" />
        </div>
      </div>

      {/* Right: Preview */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-muted mb-4">프리뷰</h3>
        {ed.result ? (
          <>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-caption text-subtle">{ed.result.slides.length} slides</p>
                <div className="flex gap-2">
                  <label className="text-caption text-accent hover:text-accent cursor-pointer">
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
                  }} className="text-caption text-subtle hover:text-subtle">다운로드</button>
                </div>
              </div>
              <div className="scrollbar-semantic flex gap-2 overflow-x-auto pb-2">
                {ed.result.slides.map((s, i) => (
                  <div
                    key={`${s}-${i}`}
                    className={`min-w-32 flex-shrink-0 relative group ${dragIdx === i ? "opacity-40" : ""}`}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragEnd={() => setDragIdx(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(i)}
                  >
                    <div className="w-32 h-40 rounded-lg overflow-hidden border border-border cursor-pointer" onClick={() => setPreviewImg(s)}>
                      <img src={s} alt={`Slide ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                    </div>
                    <button onClick={() => removeResultSlide(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-text rounded-full text-caption opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">✕</button>
                    <span className="absolute bottom-1 left-1 text-caption bg-black/60 text-text px-1 rounded">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <button onClick={saveDraft} className="w-full py-2 bg-green-700 text-text text-sm rounded hover:bg-green-600">{editingPostId ? "Draft 업데이트" : "큐에 Draft 저장"}</button>
              <button onClick={() => setEd(prev => ({ ...prev, result: null }))} className="w-full py-1.5 bg-surface-2 text-muted text-xs rounded hover:bg-surface-2">카드 재생성</button>
              <details className="text-caption">
                <summary className="text-subtle cursor-pointer hover:text-subtle">미드저니 이미지 추가 (선택)</summary>
                <div className="mt-2 flex gap-2">
                  <input id="mj-bg-prompt" type="text" placeholder="이미지 프롬프트 (영문 권장)" className="flex-1 bg-surface border border-border rounded px-2 py-1.5 text-xs text-muted" />
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
                  }} disabled={mjGenerating} className={`px-3 py-1.5 bg-amber-700 text-text text-xs rounded hover:bg-amber-600 flex-shrink-0 ${mjGenerating ? "opacity-50 cursor-wait" : ""}`}>
                    {mjGenerating ? "생성중..." : "생성"}
                  </button>
                </div>
              </details>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-subtle">
            <div className="text-center">
              <p className="text-sm mb-1">카드뉴스를 생성하면 여기에 프리뷰가 표시됩니다</p>
              <p className="text-caption">제목 + 슬라이드 텍스트 입력 후 &quot;카드뉴스 생성&quot; 클릭</p>
            </div>
          </div>
        )}
      </div>
      {previewImg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center cursor-pointer" onClick={() => setPreviewImg(null)}>
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
  const [accountsRefreshTick, setAccountsRefreshTick] = useState(0);

  const cfg = (channelConfig || {}) as Record<string, Record<string, unknown>>;
  const igCfg = cfg.instagram || {};
  const keys = (igCfg.keys || {}) as Record<string, string>;
  const connected = !!igCfg.connected;
  // 저장된 토큰이 있어도 Instagram이 OAuth code 190(무효)을 리턴하면 connected=false +
  // reconnectRequired=true로 온다(GET /api/channel-config 라이브 검증, 2026-07-16 P0 QA 정정).
  const reconnectRequired = !!igCfg.reconnectRequired;
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Credentials */}
      <div className="card p-5">
        <div className="mb-4">
          <SocialConnectButton
            provider="instagram"
            label="Instagram"
            onConnected={() => {
              mutateConfig();
              setAccountsRefreshTick((n) => n + 1);
            }}
          />
          <AccountManager
            key={`instagram-${accountsRefreshTick}`}
            provider="instagram"
            label="Instagram"
            onAccountsChanged={mutateConfig}
          />
          <p className="text-caption text-subtle mt-2">또는 아래에서 토큰을 직접 입력(고급).</p>
        </div>
        <CredentialForm
          channelKey="instagram"
          fields={sg.fields}
          labels={sg.labels}
          currentKeys={keys}
          onSave={handleCredSave}
          connected={connected}
          title="Instagram Graph API"
          badge={{ text: "Graph API", color: "blue" }}
          connectLabel="Connect Instagram"
        />
        {reconnectRequired && (
          <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            ⚠ 재연결 필요 — 저장된 Instagram 토큰이 만료되었거나 무효합니다. 위 OAuth 버튼으로 다시 연결해주세요.
          </div>
        )}
      </div>

      {/* Channel Info + Setup Guide */}
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-muted mb-3">Channel Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-subtle">Status</span>
              <span className={connected ? "text-success" : "text-warning"}>
                {connected ? "Connected" : reconnectRequired ? "재연결 필요" : "Not connected"}
              </span>
            </div>
            {igCfg.userId ? (
              <div className="flex justify-between">
                <span className="text-subtle">User ID</span>
                <span className="text-muted font-mono">{String(igCfg.userId)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-subtle">Character Limit</span>
              <span className="text-muted">2,200</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle">Image Format</span>
              <span className="text-muted">Carousel / Single</span>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <SetupGuide quick={sg.quick} detail={sg.detail} images={sg.images} />
        </div>
      </div>

      <TenantAutomationSettings channel="instagram" />

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
  const reconnectRequired = !!igCfg.reconnectRequired;

  // Load queue for reload callback
  const { mutate: mutateQueue } = useSWR("/api/queue", fetcher);

  const tabs = ["queue", "editor", "settings"];

  useEffect(() => {
    if (!tabs.includes(subTab)) setSubTab("queue");
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => { mutateQueue(); mutateConfig(); }, [mutateQueue, mutateConfig]);

  return (
    <div className="px-8 py-6">
      <BackButton />
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-purple-600 flex items-center justify-center text-sm font-bold text-text">IG</span>
        <div>
          <h2 className="text-xl font-semibold text-text">Instagram</h2>
          <p className="text-xs text-subtle">{connected ? "Connected" : reconnectRequired ? "재연결 필요" : "Not connected"} {igCfg.userId ? ` · ID: ${igCfg.userId}` : ""}</p>
        </div>
      </div>
      <div className="flex gap-1 mb-6 border-b border-border/50 pb-3">
        {tabs.map(t => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-3 py-1.5 text-sm rounded ${subTab === t ? "bg-accent text-text" : "text-subtle hover:bg-surface-2"}`}>
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
            <p className="text-subtle text-sm mb-2">Instagram 계정을 연결하면 큐를 사용할 수 있습니다</p>
            <button onClick={() => setSubTab("settings")} className="text-xs text-accent hover:text-accent">Settings에서 연결하기</button>
          </div>
        )
      )}
      {subTab === "editor" && (
        connected ? (
          <CardNewsEditor onReload={reload} editingPostId={editingPostId} onBackToQueue={() => { setEditingPostId(null); setSubTab("queue"); }} />
        ) : (
          <div className="card p-8 text-center">
            <p className="text-subtle text-sm mb-2">Instagram 계정을 연결하면 카드뉴스 에디터를 사용할 수 있습니다</p>
            <button onClick={() => setSubTab("settings")} className="text-xs text-accent hover:text-accent">Settings에서 연결하기</button>
          </div>
        )
      )}
      {subTab === "settings" && <InstagramSettings />}
    </div>
  );
}
