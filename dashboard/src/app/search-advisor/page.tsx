"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface NsaData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  keywords: Array<{
    keyword: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  savedAt: string | null;
}

export default function SearchAdvisorPage() {
  const { data, mutate } = useSWR<NsaData>("/api/nsa-data", fetcher, { revalidateOnFocus: false });
  const { showToast } = useToast();
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  const stats = data || { clicks: 0, impressions: 0, ctr: 0, position: 0, keywords: [], savedAt: null };

  const handlePaste = async () => {
    try {
      const lines = pasteText.trim().split("\n").filter(Boolean);
      const keywords: NsaData["keywords"] = [];
      let totalClicks = 0;
      let totalImpressions = 0;

      for (const line of lines) {
        const parts = line.split("\t");
        if (parts.length >= 4) {
          const kw = {
            keyword: parts[0].trim(),
            clicks: parseInt(parts[1]) || 0,
            impressions: parseInt(parts[2]) || 0,
            ctr: parseFloat(parts[3]) || 0,
            position: parseFloat(parts[4] || "0") || 0,
          };
          totalClicks += kw.clicks;
          totalImpressions += kw.impressions;
          keywords.push(kw);
        }
      }

      if (!keywords.length) {
        showToast("데이터를 인식할 수 없습니다. 네이버 서치어드바이저에서 탭 구분 데이터를 붙여넣기 하세요.", "error");
        return;
      }

      const nsaData: NsaData = {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : 0,
        position: keywords.length > 0 ? Math.round(keywords.reduce((s, k) => s + k.position, 0) / keywords.length * 10) / 10 : 0,
        keywords,
        savedAt: new Date().toISOString(),
      };

      await apiPost("/api/nsa-data", nsaData);
      showToast(`${keywords.length}개 키워드 저장 완료`, "success");
      mutate();
      setShowPaste(false);
      setPasteText("");
    } catch (e) {
      showToast(`에러: ${(e as Error).message}`, "error");
    }
  };

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Search Advisor</h2>
          <p className="text-xs text-gray-500 mt-1">네이버 서치어드바이저 검색 성과 데이터</p>
        </div>
        <button
          onClick={() => setShowPaste(!showPaste)}
          className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
        >
          {showPaste ? "닫기" : "데이터 붙여넣기"}
        </button>
      </div>

      {showPaste && (
        <div className="card p-4 mb-6">
          <p className="text-xs text-gray-400 mb-2">
            네이버 서치어드바이저 → 검색 분석 → 표 데이터를 복사하여 붙여넣기 (탭 구분)
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="키워드(탭)클릭수(탭)노출수(탭)CTR(탭)순위&#10;중학생공부법&#9;12&#9;340&#9;3.5&#9;8.2"
            className="w-full bg-gray-800 text-gray-200 text-xs p-3 rounded border border-gray-700 mb-2"
            rows={6}
          />
          <button
            onClick={handlePaste}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
          >저장</button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">클릭수</div>
          <div className="text-lg font-bold text-white">{stats.clicks.toLocaleString()}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">노출수</div>
          <div className="text-lg font-bold text-white">{stats.impressions.toLocaleString()}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">CTR</div>
          <div className="text-lg font-bold text-white">{stats.ctr}%</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">평균 순위</div>
          <div className="text-lg font-bold text-white">{stats.position}</div>
        </div>
      </div>

      {stats.savedAt && (
        <p className="text-[10px] text-gray-600 mb-3">마지막 업데이트: {new Date(stats.savedAt).toLocaleString("ko-KR")}</p>
      )}

      {/* Keywords table */}
      {(stats.keywords || []).length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm">저장된 데이터가 없습니다.</p>
          <p className="text-[10px] text-gray-600 mt-1">네이버 서치어드바이저에서 데이터를 복사하여 붙여넣기 하세요.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-[10px]">
                <th className="text-left px-4 py-2">키워드</th>
                <th className="text-right px-4 py-2">클릭</th>
                <th className="text-right px-4 py-2">노출</th>
                <th className="text-right px-4 py-2">CTR</th>
                <th className="text-right px-4 py-2">순위</th>
              </tr>
            </thead>
            <tbody>
              {stats.keywords.map((kw) => (
                <tr key={kw.keyword} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                  <td className="px-4 py-2 text-gray-300 text-xs">{kw.keyword}</td>
                  <td className="px-4 py-2 text-right text-gray-300 text-xs">{kw.clicks}</td>
                  <td className="px-4 py-2 text-right text-gray-300 text-xs">{kw.impressions.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-gray-300 text-xs">{kw.ctr}%</td>
                  <td className="px-4 py-2 text-right text-gray-300 text-xs">{kw.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
