"use client";

import useSWR from "swr";
import { fetcher, apiDelete } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { fmtTime, fmtBytes } from "@/lib/format";

interface ImageItem {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

export default function ImagesPage() {
  const { data, mutate } = useSWR<ImageItem[]>("/api/images", fetcher);
  const { data: r2Data } = useSWR("/api/r2-config", fetcher);
  const { showToast } = useToast();
  const images = data || [];
  const r2 = (r2Data || {}) as Record<string, string>;
  const r2Connected = !!(r2.bucket && r2.accessKeyId);

  const handleCopyUrl = (url: string) => {
    const full = window.location.origin + url;
    navigator.clipboard.writeText(full).then(() => showToast("URL 복사됨", "success"));
  };

  const handleDelete = async (filename: string) => {
    if (!confirm("이미지를 삭제하시겠습니까?")) return;
    try {
      await apiDelete(`/api/images/${encodeURIComponent(filename)}`);
      showToast("삭제됨", "success");
      mutate();
    } catch (e) { showToast(`삭제 실패: ${(e as Error).message}`, "error"); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Images</h2>
          <p className="text-sm text-gray-500 mt-1">{images.length}개 이미지 — AI 생성 이미지 갤러리</p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded ${r2Connected ? "bg-green-900/40 text-green-400" : "bg-yellow-900/40 text-yellow-400"}`}>
          {r2Connected ? "R2 Connected" : "R2 Not configured"}
        </span>
      </div>

      {!r2Connected && (
        <div className="card p-4 mb-6 border-yellow-800/30 bg-yellow-900/10">
          <p className="text-[10px] text-yellow-400">
            R2 Storage 미설정 — 이미지 발행이 안 됩니다.{" "}
            <a href="/settings" className="text-blue-400 hover:underline cursor-pointer">Settings &gt; Storage</a>에서 설정하세요.
          </p>
        </div>
      )}

      {images.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">아직 생성된 이미지가 없습니다</p>
          <p className="text-xs text-gray-600 mt-1">image_generate tool로 이미지를 생성하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.filename} className="card overflow-hidden group relative">
              <div className="aspect-square bg-gray-900 flex items-center justify-center">
                <img src={img.url} alt={img.filename} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-300 truncate" title={img.filename}>{img.filename}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500">{fmtBytes(img.size)}</span>
                  <span className="text-[10px] text-gray-500">{fmtTime(img.createdAt)}</span>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => handleCopyUrl(img.url)}
                  className="p-1.5 bg-gray-900/80 rounded text-gray-300 hover:text-white"
                  title="URL 복사"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(img.filename)}
                  className="p-1.5 bg-gray-900/80 rounded text-red-400 hover:text-red-300"
                  title="삭제"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
