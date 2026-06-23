"use client";

import { useState } from "react";

interface SetupGuideProps {
  quick: string[];
  detail: string;
  warning?: string;
  images?: { src: string; alt: string }[];
}

export function SetupGuide({ quick, detail, warning, images }: SetupGuideProps) {
  const [showDetail, setShowDetail] = useState(false);
  // 에셋이 아직 없을 수 있으므로 깨진 이미지는 조용히 숨김(앱 경험 비훼손).
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  return (
    <div>
      <h3 className="text-sm font-medium text-muted mb-3">연결 가이드</h3>
      <ol className="text-[10px] text-subtle space-y-1.5 list-decimal list-inside">
        {quick.map((step, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
        ))}
      </ol>
      {images && images.length > 0 && (
        <div className="mt-3 space-y-2">
          {images.filter((img) => !hidden[img.src]).map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              loading="lazy"
              onError={() => setHidden((h) => ({ ...h, [img.src]: true }))}
              className="w-full rounded border border-border"
            />
          ))}
        </div>
      )}
      {warning && (
        <p className="text-[10px] text-yellow-500/70 mt-2">{warning}</p>
      )}
      {detail && !warning && (
        <>
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="text-[10px] text-accent hover:text-accent mt-3 block"
          >
            {showDetail ? "접기" : "더 알아보기"}
          </button>
          {showDetail && (
            <div className="mt-2 p-3 rounded bg-surface/50">
              <p className="text-[10px] text-subtle leading-relaxed whitespace-pre-wrap">{detail}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
