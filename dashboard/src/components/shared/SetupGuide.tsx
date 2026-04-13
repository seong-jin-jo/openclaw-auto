"use client";

import { useState } from "react";

interface SetupGuideProps {
  quick: string[];
  detail: string;
  warning?: string;
}

export function SetupGuide({ quick, detail, warning }: SetupGuideProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-3">Setup Guide</h3>
      <ol className="text-[10px] text-gray-400 space-y-1.5 list-decimal list-inside">
        {quick.map((step, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
        ))}
      </ol>
      {warning && (
        <p className="text-[10px] text-yellow-500/70 mt-2">{warning}</p>
      )}
      {detail && !warning && (
        <>
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="text-[10px] text-blue-400 hover:text-blue-300 mt-3 block"
          >
            {showDetail ? "접기" : "더 알아보기"}
          </button>
          {showDetail && (
            <div className="mt-2 p-3 rounded bg-gray-900/50">
              <p className="text-[10px] text-gray-500 leading-relaxed whitespace-pre-wrap">{detail}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
