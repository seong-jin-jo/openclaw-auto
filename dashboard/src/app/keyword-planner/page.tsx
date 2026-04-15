"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface KwResult {
  keyword: string;
  pcSearches: number;
  mobileSearches: number;
  totalSearches: number;
  competition: string;
}

interface KeywordBankItem {
  keyword: string;
  source: string;
  addedAt: string;
  used: boolean;
}

export default function KeywordPlannerPage() {
  const [inputKws, setInputKws] = useState("");
  const [results, setResults] = useState<KwResult[]>([]);
  const [searching, setSearching] = useState(false);
  const { showToast } = useToast();

  const { data: bankData, mutate: mutateBank } = useSWR<{ keywords: KeywordBankItem[] }>("/api/keyword-bank", fetcher);
  const bank = bankData?.keywords || [];

  const handleSearch = async () => {
    const kws = inputKws.split(/[,\n]/).map((k) => k.trim().replace(/\s+/g, "")).filter(Boolean);
    if (!kws.length) return;
    setSearching(true);
    try {
      const res = await apiPost<{ results: KwResult[]; error?: string }>("/api/keyword-research", { keywords: kws.slice(0, 5) });
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

  const handleAddToBank = async (keyword: string) => {
    try {
      await apiPost("/api/keyword-bank/add", { keyword, source: "planner" });
      showToast(`"${keyword}" 뱅크에 추가`, "success");
      mutateBank();
    } catch (e) {
      showToast(`실패: ${(e as Error).message}`, "error");
    }
  };

  const bankSet = new Set(bank.map((b) => b.keyword));

  const compColor = (comp: string) => {
    if (comp === "높음" || comp === "high") return "text-red-400";
    if (comp === "중간" || comp === "medium") return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Keyword Planner</h2>
        <p className="text-xs text-gray-500 mt-1">네이버 검색광고 API 기반 키워드 검색량 조회</p>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="flex gap-2">
          <input
            value={inputKws}
            onChange={(e) => setInputKws(e.target.value)}
            placeholder="키워드 입력 (쉼표 또는 줄바꿈 구분, 최대 5개)"
            className="flex-1 bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded border border-gray-700"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
          >
            {searching ? "조회 중..." : "조회"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            검색 결과 {results.length > 0 && `(${results.length})`}
          </h3>
          {results.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500 text-sm">키워드를 입력하고 조회하세요.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-[10px]">
                    <th className="text-left px-4 py-2">키워드</th>
                    <th className="text-right px-4 py-2">PC</th>
                    <th className="text-right px-4 py-2">모바일</th>
                    <th className="text-right px-4 py-2">합계</th>
                    <th className="text-right px-4 py-2">경쟁도</th>
                    <th className="text-right px-4 py-2">Bank</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.keyword} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                      <td className="px-4 py-2 text-gray-300 text-xs">{r.keyword}</td>
                      <td className="px-4 py-2 text-right text-gray-300 text-xs">{r.pcSearches.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-gray-300 text-xs">{r.mobileSearches.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-white text-xs font-medium">{r.totalSearches.toLocaleString()}</td>
                      <td className={`px-4 py-2 text-right text-xs ${compColor(r.competition)}`}>{r.competition || "-"}</td>
                      <td className="px-4 py-2 text-right">
                        {bankSet.has(r.keyword) ? (
                          <span className="text-[10px] text-green-400">저장됨</span>
                        ) : (
                          <button
                            onClick={() => handleAddToBank(r.keyword)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300"
                          >+ Bank</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Keyword Bank */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Keyword Bank ({bank.filter((b) => !b.used).length})
          </h3>
          {bank.length === 0 ? (
            <div className="card p-4 text-center"><p className="text-gray-500 text-xs">키워드 뱅크가 비어 있습니다.</p></div>
          ) : (
            <div className="space-y-1">
              {bank.filter((b) => !b.used).slice(0, 20).map((b) => (
                <div key={b.keyword} className="card p-2 flex items-center justify-between">
                  <span className="text-xs text-gray-300">{b.keyword}</span>
                  <span className="text-[10px] text-gray-600">{b.source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
