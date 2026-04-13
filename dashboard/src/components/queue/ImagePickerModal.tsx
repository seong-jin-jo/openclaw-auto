"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";
import { useToast } from "@/components/layout/Toast";
import { esc } from "@/lib/format";

interface ImageItem {
  url: string;
  filename: string;
}

export function ImagePickerModal() {
  const { imagePickerPostId, setImagePickerPostId } = useUIStore();
  const { showToast } = useToast();
  const { data: images, mutate: mutateImages } = useSWR<ImageItem[]>("/api/images", fetcher);
  const { data: queueData } = useSWR<{ posts: Array<Record<string, unknown>> }>("/api/queue", fetcher);
  const [genPrompt, setGenPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");

  if (!imagePickerPostId) return null;

  const post = (queueData?.posts || []).find((p) => p.id === imagePickerPostId);
  const currentImage = post?.imageUrl as string | undefined;
  const imgList = images || [];

  const handleSelect = async (url: string | null) => {
    await apiPost(`/api/queue/${imagePickerPostId}/update`, { imageUrl: url });
    setImagePickerPostId(null);
    showToast(url ? "이미지 첨부됨" : "이미지 제거됨", "success");
  };

  const handleGenerate = async () => {
    const prompt = genPrompt.trim();
    if (!prompt) return;
    setGenerating(true);
    setGenStatus("AI 이미지 생성 중... (최대 2분 소요)");
    try {
      const res = await apiPost<{ success?: boolean; image?: { url: string }; error?: string }>("/api/generate-image", { prompt });
      if (res?.success && res.image) {
        showToast("이미지 생성 완료", "success");
        mutateImages();
        handleSelect(res.image.url);
      } else {
        showToast(res?.error || "이미지 생성 실패", "error");
        setGenStatus(res?.error || "실패");
        setGenerating(false);
      }
    } catch (e) {
      showToast("이미지 생성 실패: " + (e instanceof Error ? e.message : ""), "error");
      setGenStatus(e instanceof Error ? e.message : "실패");
      setGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setImagePickerPostId(null); }}
    >
      <div className="card p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Select Image</h3>
          <button onClick={() => setImagePickerPostId(null)} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        {/* Generate New */}
        <div className="mb-4 p-3 rounded-lg border border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-gray-300">Generate New</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="이미지 설명 (예: AI와 협업하는 개발자 일러스트)"
              className="flex-1 bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700"
            />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 shrink-0 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
          {genStatus && <div className="mt-2 text-[10px] text-gray-500">{genStatus}</div>}
        </div>

        {/* Remove current */}
        {currentImage && (
          <button
            onClick={() => handleSelect(null)}
            className="w-full mb-4 p-3 rounded-lg border border-red-800/50 bg-red-900/20 text-red-300 text-sm hover:bg-red-900/40"
          >
            Remove current image
          </button>
        )}

        {/* Image grid */}
        {imgList.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No images available. Generate one above or upload images to data/images/
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {imgList.map((img) => (
              <div
                key={img.filename}
                onClick={(e) => { e.stopPropagation(); handleSelect(img.url); }}
                className={`cursor-pointer rounded-lg border overflow-hidden transition-colors ${
                  currentImage === img.url
                    ? "border-blue-500 ring-2 ring-blue-500/30"
                    : "border-gray-800 hover:border-blue-500"
                }`}
              >
                <div className="aspect-square bg-gray-900">
                  <img src={img.url} className="w-full h-full object-cover" loading="lazy" alt={img.filename} />
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-gray-400 truncate" title={img.filename}>{img.filename}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
