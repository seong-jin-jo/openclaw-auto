"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

interface GaSource {
  source: string;
  sessions: number;
  pageviews: number;
}

interface GaPage {
  path: string;
  views: number;
  avgDuration: number;
}

interface GaData {
  totalSessions: number;
  totalPageviews: number;
  avgDuration: string;
  bounceRate: string;
  sources: GaSource[];
  pages: GaPage[];
  days: number;
  error?: string;
}

export default function GoogleAnalyticsPage() {
  const [days, setDays] = useState(28);
  const { data, isLoading } = useSWR<GaData>(
    `/api/ga-analytics?days=${days}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const stats = data || { totalSessions: 0, totalPageviews: 0, avgDuration: "0", bounceRate: "0", sources: [], pages: [] };

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Google Analytics</h2>
          <p className="text-xs text-gray-500 mt-1">GA4 사이트 트래픽 분석</p>
        </div>
        <div className="flex gap-2">
          {[7, 28, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2 py-1 text-[10px] rounded ${days === d ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-800"}`}
            >{d}일</button>
          ))}
        </div>
      </div>

      {data?.error && (
        <div className="card p-4 mb-4 border border-yellow-800/50">
          <p className="text-xs text-yellow-400">{data.error}</p>
          <p className="text-[10px] text-gray-500 mt-1">Settings → Channels → Google Analytics에서 서비스 계정과 Property ID를 설정하세요.</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">세션</div>
          <div className="text-lg font-bold text-white">{stats.totalSessions.toLocaleString()}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">페이지뷰</div>
          <div className="text-lg font-bold text-white">{stats.totalPageviews.toLocaleString()}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">평균 세션 시간</div>
          <div className="text-lg font-bold text-white">{stats.avgDuration}s</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">이탈률</div>
          <div className="text-lg font-bold text-white">{stats.bounceRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic sources */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">트래픽 소스</h3>
          {isLoading ? (
            <div className="card p-8 text-center"><p className="text-gray-500 text-sm">로딩 중...</p></div>
          ) : (stats.sources || []).length === 0 ? (
            <div className="card p-8 text-center"><p className="text-gray-500 text-sm">데이터 없음</p></div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-[10px]">
                    <th className="text-left px-4 py-2">소스</th>
                    <th className="text-right px-4 py-2">세션</th>
                    <th className="text-right px-4 py-2">페이지뷰</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sources.map((s) => (
                    <tr key={s.source} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                      <td className="px-4 py-2 text-gray-300 text-xs">{s.source}</td>
                      <td className="px-4 py-2 text-right text-gray-300 text-xs">{s.sessions.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-gray-300 text-xs">{s.pageviews.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top pages */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">인기 페이지 (칼럼)</h3>
          {isLoading ? (
            <div className="card p-8 text-center"><p className="text-gray-500 text-sm">로딩 중...</p></div>
          ) : (stats.pages || []).length === 0 ? (
            <div className="card p-8 text-center"><p className="text-gray-500 text-sm">데이터 없음</p></div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-[10px]">
                    <th className="text-left px-4 py-2">경로</th>
                    <th className="text-right px-4 py-2">뷰</th>
                    <th className="text-right px-4 py-2">평균 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pages.map((p) => (
                    <tr key={p.path} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                      <td className="px-4 py-2 text-gray-300 text-xs truncate max-w-xs">{p.path}</td>
                      <td className="px-4 py-2 text-right text-gray-300 text-xs">{p.views.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-gray-300 text-xs">{p.avgDuration}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
