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

export default function VideosPage() {
  const { data, mutate } = useSWR<{ videos: Video[] }>("/api/video/list", fetcher);
  const { data: ytStatus } = useSWR<{ connected: boolean }>("/api/youtube/status", fetcher);
  const { data: elConfig } = useSWR<{ configured: boolean }>("/api/elevenlabs-config", fetcher);
  const { showToast } = useToast();

  const [tab, setTab] = useState<"list" | "generate">("list");
  const [slides, setSlides] = useState<SlideInput[]>([
    { text: "", duration: 4, imageUrl: "" },
  ]);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishingFile, setPublishingFile] = useState<string | null>(null);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishDesc, setPublishDesc] = useState("");

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
          <h2 className="text-xl font-bold text-white">Videos</h2>
          <p className="text-xs text-gray-500 mt-1">Short-form video generation and publishing</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("list")}
            className={`px-3 py-1.5 text-xs rounded ${tab === "list" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}
          >
            Library ({videos.length})
          </button>
          <button
            onClick={() => setTab("generate")}
            className={`px-3 py-1.5 text-xs rounded ${tab === "generate" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}
          >
            + Generate
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">Videos</div>
          <div className="text-lg font-bold text-white">{videos.length}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">YouTube</div>
          <div className={`text-sm font-medium ${ytStatus?.connected ? "text-green-400" : "text-gray-500"}`}>
            {ytStatus?.connected ? "Connected" : "Not connected"}
          </div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">TTS (ElevenLabs)</div>
          <div className={`text-sm font-medium ${elConfig?.configured ? "text-green-400" : "text-gray-500"}`}>
            {elConfig?.configured ? "Configured" : "Not set"}
          </div>
        </div>
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
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">
                      Preview
                    </a>
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
