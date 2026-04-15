"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

interface GscRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscData {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  rows: GscRow[];
  cached?: boolean;
  error?: string;
}

export default function SearchConsolePage() {
  const [days, setDays] = useState(28);
  const [dimension, setDimension] = useState<"query" | "page">("query");
  const [siteUrl, setSiteUrl] = useState("");

  const { data, isLoading } = useSWR<GscData>(
    siteUrl ? `/api/gsc-analytics?site=${encodeURIComponent(siteUrl)}&days=${days}&dimension=${dimension}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const stats = data || { totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0, rows: [] };

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Search Console</h2>
          <p className="text-xs text-gray-500 mt-1">Google 검색 성과</p>
        </div>
        <div className="flex gap-2">
          <input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="sc-domain:example.com"
            className="bg-gray-800 text-gray-300 text-[10px] px-2 py-1 rounded border border-gray-700 w-48"
          />
          {[7, 28, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2 py-1 text-[10px] rounded ${days === d ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-800"}`}
            >{d}일</button>
          ))}
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value as "query" | "page")}
            className="bg-gray-800 text-gray-300 text-[10px] px-2 py-1 rounded border border-gray-700"
          >
            <option value="query">검색어</option>
            <option value="page">페이지</option>
          </select>
        </div>
      </div>

      {data?.error && (
        <div className="card p-4 mb-4 border border-yellow-800/50">
          <p className="text-xs text-yellow-400">{data.error}</p>
          <p className="text-[10px] text-gray-500 mt-1">Settings → Channels → Search Console에서 서비스 계정을 설정하세요.</p>
        </div>
      )}

      {data?.cached && (
        <div className="card p-2 mb-4 border border-gray-700">
          <p className="text-[10px] text-gray-500">캐시된 데이터 표시 중 (API 호출 실패)</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">클릭수</div>
          <div className="text-lg font-bold text-white">{stats.totalClicks.toLocaleString()}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">노출수</div>
          <div className="text-lg font-bold text-white">{stats.totalImpressions.toLocaleString()}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">평균 CTR</div>
          <div className="text-lg font-bold text-white">{stats.avgCtr}%</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">평균 순위</div>
          <div className="text-lg font-bold text-white">{stats.avgPosition}</div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card p-8 text-center"><p className="text-gray-500 text-sm">로딩 중...</p></div>
      ) : (stats.rows || []).length === 0 ? (
        <div className="card p-8 text-center"><p className="text-gray-500 text-sm">데이터가 없습니다.</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-[10px]">
                <th className="text-left px-4 py-2">{dimension === "query" ? "검색어" : "페이지"}</th>
                <th className="text-right px-4 py-2">클릭</th>
                <th className="text-right px-4 py-2">노출</th>
                <th className="text-right px-4 py-2">CTR</th>
                <th className="text-right px-4 py-2">순위</th>
              </tr>
            </thead>
            <tbody>
              {stats.rows.map((r) => (
                <tr key={r.key} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                  <td className="px-4 py-2 text-gray-300 text-xs truncate max-w-xs">{r.key}</td>
                  <td className="px-4 py-2 text-right text-gray-300 text-xs">{r.clicks}</td>
                  <td className="px-4 py-2 text-right text-gray-300 text-xs">{r.impressions.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-gray-300 text-xs">{r.ctr}%</td>
                  <td className="px-4 py-2 text-right text-gray-300 text-xs">{r.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
