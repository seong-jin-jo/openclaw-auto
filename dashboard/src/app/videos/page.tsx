"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface Video {
  filename: string;
  url: string;
  size: number;
  createdAt: number;
}

interface SlideInput {
  text: string;
  duration: number;
  imageUrl: string;
}

// 같은 출처(/videos/...) 영상에서 첫 프레임을 캡처해 썸네일 data URL 생성. best-effort.
// 교차출처(provider http url)는 canvas가 taint되어 toDataURL이 throw → null 반환.
function captureThumbnail(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.preload = "metadata";
      video.src = src;
      const done = (val: string | null) => { video.src = ""; resolve(val); };
      const timer = setTimeout(() => done(null), 6000);
      video.addEventListener("loadeddata", () => {
        try { video.currentTime = Math.min(1, (video.duration || 2) / 2); } catch { /* ignore */ }
      });
      video.addEventListener("seeked", () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 360;
          canvas.height = video.videoHeight || 640;
          const ctx = canvas.getContext("2d");
          if (!ctx) { clearTimeout(timer); return done(null); }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          clearTimeout(timer);
          done(canvas.toDataURL("image/jpeg", 0.6));
        } catch { clearTimeout(timer); done(null); }
      });
      video.addEventListener("error", () => { clearTimeout(timer); done(null); });
    } catch { resolve(null); }
  });
}

export default function VideosPage() {
  const { data, mutate } = useSWR<{ videos: Video[] }>("/api/video/list", fetcher);
  const { data: ytStatus } = useSWR<{ connected: boolean }>("/api/youtube/status", fetcher);
  const { data: elConfig } = useSWR<{ configured: boolean }>("/api/elevenlabs-config", fetcher);
  const { data: clipConfig } = useSWR<{ configured: boolean; provider?: string }>("/api/clipping-config", fetcher);
  const { showToast } = useToast();

  const [tab, setTab] = useState<"list" | "generate">("list");
  const [slides, setSlides] = useState<SlideInput[]>([
    { text: "", duration: 4, imageUrl: "" },
  ]);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [bgmUrl, setBgmUrl] = useState(""); // 효과음/배경음 URL 또는 /sfx/{name}
  const [generating, setGenerating] = useState(false);
  const [publishingFile, setPublishingFile] = useState<string | null>(null);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishDesc, setPublishDesc] = useState("");
  const [previewFile, setPreviewFile] = useState<string | null>(null); // 인라인 임베드 플레이어 (발행 전 미리보기)

  // 0차 Long Video Repurpose (external clipper + OSMU refine)
  const [repurposeUrl, setRepurposeUrl] = useState("");
  const [repurposeFile, setRepurposeFile] = useState<File | null>(null);
  const [repurposing, setRepurposing] = useState(false);
  const [repurposeClips, setRepurposeClips] = useState<any[]>([]);
  const [refiningClip, setRefiningClip] = useState<string | null>(null);
  const [clipProvider, setClipProvider] = useState("reap");
  const [clipKey, setClipKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  const videos = data?.videos || [];

  const handleGenerate = async () => {
    const validSlides = slides.filter((s) => s.text.trim());
    if (!validSlides.length) {
      showToast("At least one slide with text required", "error");
      return;
    }
    setGenerating(true);
    try {
      const res = await apiPost<{ ok: boolean; filename: string; error?: string }>("/api/video/generate", {
        slides: validSlides,
        ttsEnabled,
        bgmUrl: bgmUrl.trim() || undefined,
      });
      if (res?.ok) {
        showToast(`Video generated: ${res.filename}`, "success");
        setTab("list");
        mutate();
      } else {
        showToast(res?.error || "Generation failed", "error");
      }
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm("Delete this video?")) return;
    try {
      await apiPost("/api/video/delete", { filename });
      showToast("Deleted", "success");
      mutate();
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  const handlePublish = async (filename: string) => {
    try {
      const res = await apiPost<{ ok: boolean; url?: string; error?: string }>("/api/video/publish", {
        filename,
        title: publishTitle || filename,
        description: publishDesc,
        platform: "youtube",
      });
      if (res?.ok) {
        showToast(`Published to YouTube: ${res.url}`, "success");
        setPublishingFile(null);
      } else {
        showToast(res?.error || "Publish failed", "error");
      }
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    }
  };

  // 0차: Repurpose long video via external + OSMU refine
  const handleRepurpose = async () => {
    setRepurposing(true);
    try {
      let payload: any = {};
      if (repurposeUrl) {
        payload.videoUrl = repurposeUrl;
      } else if (repurposeFile) {
        // upload first
        const form = new FormData();
        form.append("file", repurposeFile);
        const up = await fetch("/api/video/upload", { method: "POST", body: form }).then(r => r.json());
        if (!up?.filename) throw new Error("upload failed");
        payload.uploadRef = up.filename;
      } else {
        showToast("URL 또는 파일을 입력하세요", "error");
        return;
      }

      const r = await apiPost<{ ok?: boolean; clips?: any[]; provider?: string; error?: string }>("/api/video/repurpose", payload);
      if (r?.ok) {
        setRepurposeClips(r.clips || []);
        showToast(`${r.clips?.length || 0} clips received from ${r.provider}`, "success");
      } else {
        showToast(r?.error || "Repurpose failed", "error");
      }
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`, "error");
    } finally {
      setRepurposing(false);
    }
  };

  const refineClip = async (idx: number) => {
    const clip = repurposeClips[idx];
    if (!clip) return;
    setRefiningClip(clip.id);
    try {
      const r = await apiPost<{ ok?: boolean; refinedCaption?: string; refinedHook?: string; error?: string }>("/api/video/refine-clip", {
        caption: clip.caption || clip.title,
        hook: clip.title,
        // tenant_id handled server side via auth if needed
      });
      if (r?.ok) {
        const next = [...repurposeClips];
        next[idx] = {
          ...clip,
          caption: r.refinedCaption || clip.caption,
          title: r.refinedHook || clip.title,
        };
        setRepurposeClips(next);
        showToast("Refined with wiki/brand tone", "success");
      }
    } catch (e) {
      showToast(`Refine error: ${(e as Error).message}`, "error");
    } finally {
      setRefiningClip(null);
    }
  };

  // 클립을 로컬에 적재 + Queue 항목 생성. 썸네일(첫프레임)도 best-effort 캡처해 같이 저장.
  // opts.silent: 배치 추가 시 클립별 토스트 억제. 성공 여부 반환.
  const addClipToLibrary = async (clip: any, opts?: { silent?: boolean }): Promise<boolean> => {
    try {
      let filename = clip.id || `clip-${Date.now()}`;
      const isLocalFilename = clip.url && !clip.url.startsWith('http') && !clip.url.startsWith('/');
      if (isLocalFilename) {
        filename = clip.url;
      } else {
        try {
          const res = await fetch(clip.url);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            const upForm = new FormData();
            upForm.append("file", new Blob([buf], { type: "video/mp4" }), `${filename}.mp4`);
            const up = await fetch("/api/video/upload", { method: "POST", body: upForm }).then(r => r.json());
            if (up?.filename) filename = up.filename;
          }
        } catch {}
      }

      // 로컬 파일이면 same-origin이라 썸네일 캡처 가능(교차출처면 null).
      const localUrl = `/videos/${filename}`;
      const thumb = await captureThumbnail(localUrl);

      // Also create a queue entry with video + basic text (refined caption as base)
      await apiPost("/api/queue/add", {
        text: clip.caption || clip.title || "Shorts clip",
        topic: "video-repurpose",
        videoFilename: filename,
        videoUrl: clip.url,
        videoThumbnail: thumb,
        hashtags: [],
      });

      if (!opts?.silent) { showToast(`Clip + entry added. Check Queue.`, "success"); mutate(); }
      return true;
    } catch (e) {
      if (!opts?.silent) showToast(`Added reference: ${clip.url}`, "success");
      return false;
    }
  };

  const [addingAll, setAddingAll] = useState(false);
  // 원클릭: 모든 클립을 동시성 3으로 Queue에 추가. 부분 실패 허용(성공 카운트 토스트).
  const addAllClipsToQueue = async () => {
    if (addingAll || repurposeClips.length === 0) return;
    setAddingAll(true);
    let ok = 0;
    try {
      const clips = [...repurposeClips];
      const CONCURRENCY = 3;
      for (let i = 0; i < clips.length; i += CONCURRENCY) {
        const batch = clips.slice(i, i + CONCURRENCY);
        const results = await Promise.all(batch.map((c) => addClipToLibrary(c, { silent: true })));
        ok += results.filter(Boolean).length;
      }
      showToast(`${ok}/${clips.length}개 클립을 Queue에 추가했습니다. Queue 확인.`, ok > 0 ? "success" : "error");
      mutate();
    } finally {
      setAddingAll(false);
    }
  };

  const addSlide = () => setSlides([...slides, { text: "", duration: 4, imageUrl: "" }]);
  const removeSlide = (i: number) => setSlides(slides.filter((_, idx) => idx !== i));
  const updateSlide = (i: number, field: keyof SlideInput, value: string | number) => {
    const next = [...slides];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (next[i] as any)[field] = value;
    setSlides(next);
  };

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">영상</h2>
          <p className="text-xs text-gray-500 mt-1">숏폼 영상 생성·발행</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("list")}
            className={`px-3 py-1.5 text-xs rounded ${tab === "list" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}
          >
            라이브러리 ({videos.length})
          </button>
          <button
            onClick={() => setTab("generate")}
            className={`px-3 py-1.5 text-xs rounded ${tab === "generate" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}
          >
            + 생성
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">영상</div>
          <div className="text-lg font-bold text-white">{videos.length}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">YouTube</div>
          <div className={`text-sm font-medium ${ytStatus?.connected ? "text-green-400" : "text-gray-500"}`}>
            {ytStatus?.connected ? "연결됨" : "미연결"}
          </div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">TTS (ElevenLabs)</div>
          <div className={`text-sm font-medium ${elConfig?.configured ? "text-green-400" : "text-gray-500"}`}>
            {elConfig?.configured ? "설정됨" : "미설정"}
          </div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">영상 클리퍼 (0차)</div>
          <div className={`text-sm font-medium ${clipConfig?.configured ? "text-green-400" : "text-gray-500"}`}>
            {clipConfig?.configured ? (clipConfig.provider || "준비됨") : "미설정 (mock 모드)"}
          </div>
        </div>
      </div>

      {/* 0차: Long Video Repurpose (external clipper + OSMU brand/wiki refine) */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium">Repurpose Long Video (0차)</span>
          <span className="text-[10px] text-gray-500">External (Reap/Ssemble) → OSMU refine + publish</span>
        </div>
        <div className="mb-2 text-[10px] flex flex-wrap items-center gap-1">
          <span>클리핑 API 키 설정 (최초 1회):</span>
          <input value={clipProvider} onChange={(e) => setClipProvider(e.target.value)} placeholder="reap 또는 ssemble" className="bg-gray-800 p-1 w-24" />
          <input value={clipKey} onChange={(e) => setClipKey(e.target.value)} placeholder="API 키" className="bg-gray-800 p-1 w-48" />
          <button
            disabled={savingKey || !clipKey.trim()}
            onClick={async () => {
              setSavingKey(true);
              try {
                await apiPost('/api/clipping-config', { provider: clipProvider.trim(), apiKey: clipKey.trim() });
                showToast('키 저장됨. 이제 클립을 만드세요.', 'success');
                setClipKey('');
              } catch (e) {
                showToast(`키 저장 실패: ${(e as Error).message}`, 'error');
              } finally { setSavingKey(false); }
            }}
            className="px-2 py-0.5 text-xs bg-gray-700 rounded disabled:opacity-50"
          >
            {savingKey ? '저장 중…' : '키 저장'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <input
            value={repurposeUrl}
            onChange={(e) => { setRepurposeUrl(e.target.value); setRepurposeFile(null); }}
            placeholder="YouTube long URL (e.g. https://youtube.com/watch?v=...)"
            className="flex-1 min-w-[280px] bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700"
          />
          <button onClick={handleRepurpose} disabled={repurposing} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50">
            {repurposing ? "Clipping..." : "Clip"}
          </button>
        </div>
        <div className="text-[10px] text-gray-500 mb-2">Local long video: upload to YT first or use public URL (local file support for input limited; output clips saved locally)</div>

        {repurposeClips.length > 0 && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">Clips ({repurposeClips.length}) — preview, edit, refine with wiki, then add to flow</div>
              <button onClick={addAllClipsToQueue} disabled={addingAll} className="text-[10px] px-3 py-1 bg-green-700 hover:bg-green-600 rounded disabled:opacity-50">
                {addingAll ? "추가 중…" : `전체 큐에 추가 (${repurposeClips.length})`}
              </button>
            </div>
            {repurposeClips.map((c, i) => (
              <div key={c.id || i} className="bg-gray-800 rounded p-3 text-xs flex gap-3 items-start">
                <div className="w-40">
                  {c.url && <video src={c.url.startsWith('http') ? c.url : `/videos/${c.url}`} controls className="w-full rounded bg-black" style={{ maxHeight: 120 }} />}
                </div>
                <div className="flex-1 space-y-1">
                  <input className="w-full bg-gray-900 p-1 rounded" value={c.title || ""} onChange={e => {
                    const next = [...repurposeClips]; next[i].title = e.target.value; setRepurposeClips(next);
                  }} />
                  <textarea className="w-full bg-gray-900 p-1 rounded" rows={2} value={c.caption || ""} onChange={e => {
                    const next = [...repurposeClips]; next[i].caption = e.target.value; setRepurposeClips(next);
                  }} />
                  <div className="flex gap-2">
                    <button onClick={() => refineClip(i)} disabled={refiningClip === c.id} className="text-[10px] px-2 py-0.5 bg-purple-700 rounded">
                      {refiningClip === c.id ? "Refining..." : "Refine with Wiki/Brand"}
                    </button>
                    <button onClick={() => addClipToLibrary(c)} className="text-[10px] px-2 py-0.5 bg-green-700 rounded">Add to Queue / Publish</button>
                    {c.viralScore && <span className="text-[10px] text-gray-500 self-center">score: {c.viralScore}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tab === "list" && (
        <div className="space-y-3">
          {videos.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500 text-sm">No videos yet. Generate one to get started.</p>
            </div>
          ) : (
            videos.map((v) => (
              <div key={v.filename} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-200">{v.filename}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {(v.size / 1024 / 1024).toFixed(1)} MB
                      {" | "}
                      {new Date(v.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewFile(previewFile === v.filename ? null : v.filename)}
                      className={`px-2 py-1 text-xs rounded ${previewFile === v.filename ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                    >
                      {previewFile === v.filename ? "Hide" : "미리보기"}
                    </button>
                    {ytStatus?.connected && (
                      publishingFile === v.filename ? (
                        <div className="flex gap-1 items-center">
                          <input
                            value={publishTitle}
                            onChange={(e) => setPublishTitle(e.target.value)}
                            placeholder="Title"
                            className="px-2 py-1 text-xs bg-gray-800 text-white rounded border border-gray-700 w-32"
                          />
                          <button onClick={() => handlePublish(v.filename)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500">Upload</button>
                          <button onClick={() => setPublishingFile(null)} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setPublishingFile(v.filename); setPublishTitle(v.filename.replace(".mp4", "")); }} className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600">
                          YouTube
                        </button>
                      )
                    )}
                    <button onClick={() => handleDelete(v.filename)} className="px-2 py-1 text-xs bg-red-900/40 text-red-300 rounded hover:bg-red-800">
                      Delete
                    </button>
                  </div>
                </div>
                {previewFile === v.filename && (
                  <div className="mt-3 flex justify-center">
                    {/* 세로 쇼츠/릴스 임베드 플레이어 — 발행 전 검수용 */}
                    <video
                      key={v.url}
                      src={v.url}
                      controls
                      playsInline
                      className="rounded-lg bg-black w-full max-w-[260px] aspect-[9/16] object-contain"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "generate" && (
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Slide Editor</h3>
          <div className="space-y-3 mb-4">
            {slides.map((s, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-[10px] text-gray-600 mt-2 w-5">{i + 1}</span>
                <textarea
                  value={s.text}
                  onChange={(e) => updateSlide(i, "text", e.target.value)}
                  placeholder="Slide text..."
                  className="flex-1 bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700"
                  rows={2}
                />
                <input
                  type="number"
                  value={s.duration}
                  onChange={(e) => updateSlide(i, "duration", Number(e.target.value))}
                  className="w-14 bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700"
                  min={1}
                  max={30}
                  title="Duration (seconds)"
                />
                <input
                  value={s.imageUrl}
                  onChange={(e) => updateSlide(i, "imageUrl", e.target.value)}
                  placeholder="Image URL (optional)"
                  className="w-40 bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700"
                />
                {slides.length > 1 && (
                  <button onClick={() => removeSlide(i)} className="text-red-400 hover:text-red-300 text-sm mt-1">x</button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mb-4">
            <button onClick={addSlide} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">
              + Add Slide
            </button>
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={ttsEnabled}
                onChange={(e) => setTtsEnabled(e.target.checked)}
                className="rounded"
              />
              TTS Narration {!elConfig?.configured && "(not configured)"}
            </label>
            <span className="text-[10px] text-gray-600">
              Total: {slides.reduce((s, sl) => s + sl.duration, 0)}s
            </span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-xs text-gray-400 w-20">효과음/BGM</label>
            <input
              value={bgmUrl}
              onChange={(e) => setBgmUrl(e.target.value)}
              placeholder="음원 URL 또는 /sfx/whoosh.mp3 (선택)"
              className="flex-1 bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Video"}
          </button>
        </div>
      )}
    </div>
  );
}
