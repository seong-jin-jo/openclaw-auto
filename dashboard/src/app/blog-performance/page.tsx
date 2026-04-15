"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

interface Article {
  id: string;
  title: string;
  viewCount: number;
  tags: string[];
  regDate: string;
}

interface TagStat {
  tag: string;
  count: number;
  totalViews: number;
  avgViews: number;
}

interface BlogStats {
  totalArticles: number;
  totalViews: number;
  avgViews: number;
  dailyDelta: number;
  topArticle: Article | null;
  articles: Article[];
  topTags: TagStat[];
  history: { date: string; totalViews: number }[];
  error?: string;
}

export default function BlogPerformancePage() {
  const { data, isLoading } = useSWR<BlogStats>("/api/blog-stats", fetcher, { revalidateOnFocus: false });
  const [sortBy, setSortBy] = useState<"views" | "date">("views");

  const stats = data || { totalArticles: 0, totalViews: 0, avgViews: 0, dailyDelta: 0, topArticle: null, articles: [], topTags: [], history: [] };
  const articles = [...(stats.articles || [])].sort((a, b) =>
    sortBy === "views" ? b.viewCount - a.viewCount : (b.regDate || "").localeCompare(a.regDate || "")
  );

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Blog Performance</h2>
        <p className="text-xs text-gray-500 mt-1">블로그 게시물 조회수 및 성과 분석</p>
      </div>

      {data?.error && (
        <div className="card p-4 mb-4 border border-yellow-800/50">
          <p className="text-xs text-yellow-400">{data.error}</p>
          <p className="text-[10px] text-gray-500 mt-1">Settings → Channels → Blog에서 연결 설정을 확인하세요.</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">총 게시물</div>
          <div className="text-lg font-bold text-white">{stats.totalArticles}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">총 조회수</div>
          <div className="text-lg font-bold text-white">{stats.totalViews.toLocaleString()}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">평균 조회수</div>
          <div className="text-lg font-bold text-white">{stats.avgViews}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-gray-500 mb-1">일일 증감</div>
          <div className={`text-lg font-bold ${stats.dailyDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
            {stats.dailyDelta >= 0 ? "+" : ""}{stats.dailyDelta}
          </div>
        </div>
      </div>

      {/* Top article */}
      {stats.topArticle && (
        <div className="card p-4 mb-6 border border-yellow-800/30">
          <div className="text-[10px] text-yellow-500 mb-1">🏆 Top Article</div>
          <h3 className="text-sm font-medium text-gray-200">{stats.topArticle.title}</h3>
          <span className="text-xs text-gray-500">{stats.topArticle.viewCount.toLocaleString()} views</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articles list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">게시물 목록</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setSortBy("views")}
                className={`px-2 py-1 text-[10px] rounded ${sortBy === "views" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-800"}`}
              >조회순</button>
              <button
                onClick={() => setSortBy("date")}
                className={`px-2 py-1 text-[10px] rounded ${sortBy === "date" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-800"}`}
              >최신순</button>
            </div>
          </div>
          {isLoading ? (
            <div className="card p-8 text-center"><p className="text-gray-500 text-sm">로딩 중...</p></div>
          ) : articles.length === 0 ? (
            <div className="card p-8 text-center"><p className="text-gray-500 text-sm">게시물이 없습니다.</p></div>
          ) : (
            <div className="space-y-2">
              {articles.map((a) => (
                <div key={a.id} className="card p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <h4 className="text-sm text-gray-200 truncate">{a.title}</h4>
                    <div className="flex gap-1 mt-1">
                      {(a.tags || []).slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] text-cyan-400">#{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium text-white">{a.viewCount.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-600">{a.regDate?.split("T")[0] || ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tag stats + History */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">태그별 성과</h3>
            {(stats.topTags || []).length === 0 ? (
              <div className="card p-4 text-center"><p className="text-gray-500 text-xs">데이터 없음</p></div>
            ) : (
              <div className="space-y-1">
                {stats.topTags.map((t) => (
                  <div key={t.tag} className="card p-2 flex items-center justify-between">
                    <span className="text-xs text-cyan-400">#{t.tag}</span>
                    <div className="flex gap-3 text-[10px] text-gray-500">
                      <span>{t.count}편</span>
                      <span>평균 {t.avgViews}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">일별 조회수 추이</h3>
            {(stats.history || []).length === 0 ? (
              <div className="card p-4 text-center"><p className="text-gray-500 text-xs">히스토리 없음</p></div>
            ) : (
              <div className="space-y-1">
                {stats.history.map((h) => (
                  <div key={h.date} className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] text-gray-500">{h.date}</span>
                    <span className="text-xs text-gray-300">{h.totalViews.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
