"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface TrendData {
  period: string;
  ratio: number;
}

interface TrendResult {
  title: string;
  data: TrendData[];
}

export default function NaverTrendsPage() {
  const [inputKws, setInputKws] = useState("");
  const [results, setResults] = useState<TrendResult[]>([]);
  const [searching, setSearching] = useState(false);
  const { showToast } = useToast();

  const { data: config } = useSWR<{ naverClientId?: string }>("/api/naver-datalab-config", fetcher);
  const configured = !!config?.naverClientId;

  const handleSearch = async () => {
    const kws = inputKws.split(/[,\n]/).map((k) => k.trim()).filter(Boolean);
    if (!kws.length) return;
    setSearching(true);
    try {
      const res = await apiPost<{ results: TrendResult[]; error?: string }>("/api/naver-trend", { keywords: kws.slice(0, 5) });
      if (res?.error) {
        showToast(res.error, "error");
      }
      setResults(res?.results || []);
    } catch (e) {
      showToast(`에러: ${(e as Error).message}`, "error");
    } finally {
      setSearching(false);
    }
  };

  const maxRatio = Math.max(...results.flatMap((r) => r.data.map((d) => d.ratio)), 1);

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Naver Trends</h2>
        <p className="text-xs text-gray-500 mt-1">네이버 데이터랩 검색어 트렌드 (최근 90일)</p>
      </div>

      {!configured && (
        <div className="card p-4 mb-4 border border-yellow-800/50">
          <p className="text-xs text-yellow-400">네이버 개발자센터 API 키가 필요합니다.</p>
          <p className="text-[10px] text-gray-500 mt-1">.env에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET를 추가하세요.</p>
        </div>
      )}

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="flex gap-2">
          <input
            value={inputKws}
            onChange={(e) => setInputKws(e.target.value)}
            placeholder="키워드 입력 (쉼표 구분, 최대 5개)"
            className="flex-1 bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded border border-gray-700"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
          >
            {searching ? "조회 중..." : "트렌드 조회"}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm">키워드를 입력하고 트렌드를 조회하세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((r) => (
            <div key={r.title} className="card p-4">
              <h3 className="text-sm font-medium text-gray-200 mb-3">{r.title}</h3>
              <div className="flex items-end gap-1 h-24">
                {r.data.map((d) => (
                  <div key={d.period} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-cyan-600/60 rounded-t"
                      style={{ height: `${(d.ratio / maxRatio) * 80}px` }}
                      title={`${d.period}: ${d.ratio}`}
                    />
                    <span className="text-[8px] text-gray-600 truncate w-full text-center">
                      {d.period.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
