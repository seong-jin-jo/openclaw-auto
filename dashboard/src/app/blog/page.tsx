"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";

interface BlogPost {
  id: string;
  title: string;
  content?: string;
  body?: string;
  status: string;
  seoKeyword?: string;
  tags?: string[];
  blogPostUrl?: string;
  viewCount?: number;
  generatedAt?: string;
  approvedAt?: string;
}

interface KeywordBankItem {
  keyword: string;
  totalSearches?: number;
  competition?: string;
  used: boolean;
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-yellow-900/40 text-yellow-300",
  approved: "bg-blue-900/40 text-blue-300",
  published: "bg-green-900/40 text-green-300",
  failed: "bg-red-900/40 text-red-300",
};

export default function BlogPage() {
  const { data: queueData, mutate: mutateQueue } = useSWR<{ posts: BlogPost[] }>("/api/blog-queue", fetcher);
  const { data: guideData, mutate: mutateGuide } = useSWR<{ guide: string }>("/api/blog-guide", fetcher);
  const { data: kwData, mutate: mutateKw } = useSWR<{ keywords: string[] }>("/api/blog-keywords", fetcher);
  const { data: bankData } = useSWR<{ keywords: KeywordBankItem[] }>("/api/keyword-bank", fetcher);
  const { data: cronData } = useSWR("/api/cron-status", fetcher);
  const { showToast } = useToast();

  const [tab, setTab] = useState<"queue" | "editor" | "settings">("queue");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editSeoKw, setEditSeoKw] = useState("");
  const [guide, setGuide] = useState("");
  const [keywords, setKeywords] = useState("");
  const [guideLoaded, setGuideLoaded] = useState(false);

  const posts = queueData?.posts || [];
  const bank = (bankData?.keywords || []).filter((k) => !k.used);
  const cronJobs = ((cronData as Record<string, unknown>)?.jobs || cronData || []) as Array<Record<string, unknown>>;

  useEffect(() => {
    if (guideData?.guide && !guideLoaded) {
      setGuide(guideData.guide);
      setGuideLoaded(true);
    }
  }, [guideData, guideLoaded]);

  useEffect(() => {
    if (kwData?.keywords) {
      setKeywords(kwData.keywords.join("\n"));
    }
  }, [kwData]);

  const handleApprove = async (id: string) => {
    try {
      await apiPost("/api/blog-queue/approve", { id });
      showToast("블로그 글 승인", "success");
      mutateQueue();
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제?")) return;
    try {
      await apiPost("/api/blog-queue/delete", { id });
      showToast("삭제 완료", "success");
      mutateQueue();
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const openEditor = (p: BlogPost) => {
    setEditingPost(p);
    setEditTitle(p.title || "");
    setEditContent(p.content || p.body || "");
    setEditTags((p.tags || []).join(", "));
    setEditSeoKw(p.seoKeyword || "");
    setTab("editor");
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      await apiPost("/api/blog-queue/update", {
        id: editingPost.id,
        title: editTitle,
        content: editContent,
        tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
        seoKeyword: editSeoKw,
      });
      showToast("저장 완료", "success");
      mutateQueue();
      setEditingPost(null);
      setTab("queue");
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handleSaveGuide = async () => {
    try {
      await apiPost("/api/blog-guide", { guide });
      showToast("Content Guide 저장", "success");
      mutateGuide();
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handleSaveKeywords = async () => {
    try {
      const kws = keywords.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
      await apiPost("/api/blog-keywords", { keywords: kws });
      showToast(`${kws.length}개 키워드 저장`, "success");
      mutateKw();
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handleCronToggle = async (jobId: string, enabled: boolean) => {
    try {
      await apiPost(`/api/cron/toggle`, { jobId, enabled });
      showToast(`${jobId} ${enabled ? "ON" : "OFF"}`, "success");
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const addBankKeyword = (kw: string) => {
    const current = keywords.split("\n").map((l) => l.trim()).filter(Boolean);
    if (current.includes(kw)) { showToast("이미 추가됨", "warning"); return; }
    setKeywords(keywords + "\n" + kw);
    showToast(`"${kw}" 추가`, "success");
  };

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Blog</h2>
          <p className="text-xs text-gray-500 mt-1">학생/학부모 대상 SEO 칼럼 자동화</p>
        </div>
        <div className="flex gap-2">
          {(["queue", "editor", "settings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs rounded ${tab === t ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}
            >
              {t === "queue" ? `Queue (${posts.length})` : t === "editor" ? "Editor" : "Settings"}
            </button>
          ))}
        </div>
      </div>

      {/* SEO Flow Guide */}
      {tab === "queue" && (
        <>
          <details className="card p-4 mb-6">
            <summary className="text-sm font-medium text-gray-300 cursor-pointer">SEO 콘텐츠 자동화 플로우</summary>
            <div className="mt-3 text-[11px] text-gray-400 space-y-2">
              <div className="flex items-start gap-2"><span className="text-blue-400 font-bold">1.</span><div><strong className="text-gray-300">키워드 수집</strong> — Keyword Planner에서 검색량 높은 키워드를 찾아 Blog Keywords에 추가</div></div>
              <div className="flex items-start gap-2"><span className="text-blue-400 font-bold">2.</span><div><strong className="text-gray-300">트렌드 확인</strong> — Naver Trends에서 시즌 키워드 파악 (시험, 방학 등)</div></div>
              <div className="flex items-start gap-2"><span className="text-blue-400 font-bold">3.</span><div><strong className="text-gray-300">콘텐츠 생산</strong> — AI가 Blog Keywords + Content Guide 기반으로 칼럼 draft 자동 생성</div></div>
              <div className="flex items-start gap-2"><span className="text-blue-400 font-bold">4.</span><div><strong className="text-gray-300">검수 + 발행</strong> — Queue에서 draft 확인 → 클릭하여 수정 → Approve → 블로그에 자동 발행</div></div>
              <div className="flex items-start gap-2"><span className="text-blue-400 font-bold">5.</span><div><strong className="text-gray-300">검색 노출</strong> — Search Console에서 색인 요청 → 검색 노출</div></div>
              <div className="flex items-start gap-2"><span className="text-blue-400 font-bold">6.</span><div><strong className="text-gray-300">결과 분석</strong> — Blog Performance에서 조회수 + 검색 클릭 추적</div></div>
              <p className="text-[10px] text-gray-500 mt-2 border-t border-gray-800 pt-2">Settings 탭에서 Content Guide와 Keywords를 수정하세요.</p>
            </div>
          </details>

          {/* Keyword Bank suggestions */}
          {bank.length > 0 ? (
            <div className="card p-4 mb-4 border-l-2 border-purple-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">추천 키워드</span>
                <a href="/keyword-planner" className="text-[10px] text-blue-400 hover:text-blue-300">더 많은 키워드 찾기 →</a>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">Keyword Bank에서 수집된 미사용 키워드입니다.</p>
              <div className="flex flex-wrap gap-1.5">
                {bank.slice(0, 10).map((k) => (
                  <span key={k.keyword} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] border border-purple-800/30 bg-purple-900/20 text-purple-300">
                    {k.keyword}
                    {k.totalSearches ? <span className="text-gray-500">{k.totalSearches >= 1000 ? Math.round(k.totalSearches / 1000) + "K" : k.totalSearches}</span> : null}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-4 mb-4 border-l-2 border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500">아직 수집된 키워드가 없습니다.</p>
                <a href="/keyword-planner" className="text-[10px] text-blue-400 hover:text-blue-300 whitespace-nowrap">키워드 찾기 →</a>
              </div>
            </div>
          )}

          {/* Queue */}
          {posts.length === 0 ? (
            <div className="card p-8 text-center"><p className="text-gray-500 text-sm">블로그 글이 없습니다.</p></div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="card p-4 cursor-pointer hover:border-gray-600 transition-colors" onClick={() => openEditor(p)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_CLASS[p.status] || "bg-gray-700 text-gray-300"}`}>{p.status}</span>
                      {p.seoKeyword && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300">{p.seoKeyword}</span>}
                      {p.blogPostUrl && (
                        <a href={p.blogPostUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>View →</a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {p.viewCount != null && <span className="text-[10px] text-gray-500">views: {p.viewCount}</span>}
                      <span className="text-[10px] text-gray-600">{p.generatedAt?.split("T")[0] || ""}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-200 mb-1">{p.title || ""}</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {(p.content || p.body || "").replace(/<[^>]*>/g, "").slice(0, 150)}...
                  </p>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.tags.slice(0, 8).map((t) => (
                        <span key={t} className="text-[10px] text-cyan-400">#{t}</span>
                      ))}
                      {p.tags.length > 8 && <span className="text-[10px] text-gray-600">+{p.tags.length - 8}</span>}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    {p.status === "draft" && (
                      <button onClick={() => handleApprove(p.id)} className="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve</button>
                    )}
                    {p.status !== "published" && (
                      <button onClick={() => handleDelete(p.id)} className="px-2 py-1 text-xs bg-red-900/40 text-red-300 rounded hover:bg-red-800">Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Editor Tab */}
      {tab === "editor" && (
        editingPost ? (
          <div className="space-y-4">
            <button onClick={() => { setEditingPost(null); setTab("queue"); }} className="text-gray-500 hover:text-gray-300 text-xs">← Queue로 돌아가기</button>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_CLASS[editingPost.status] || "bg-gray-700 text-gray-300"}`}>{editingPost.status}</span>
              <span className="text-[10px] text-gray-600">{editingPost.id.slice(0, 8)}</span>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">SEO 키워드</label>
              <input value={editSeoKw} onChange={(e) => setEditSeoKw(e.target.value)} className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded border border-gray-700" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">제목</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded border border-gray-700" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">본문 (마크다운)</label>
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={20} className="w-full bg-gray-800 text-gray-200 text-xs p-3 rounded border border-gray-700 font-mono leading-relaxed" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">태그 (쉼표 구분)</label>
              <input value={editTags} onChange={(e) => setEditTags(e.target.value)} className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded border border-gray-700" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500">저장</button>
              {editingPost.status === "draft" && (
                <button onClick={async () => { await handleSaveEdit(); await handleApprove(editingPost.id); }} className="px-4 py-2 text-sm bg-green-700 text-white rounded hover:bg-green-600">저장 + Approve</button>
              )}
              <button onClick={() => { setEditingPost(null); setTab("queue"); }} className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded">취소</button>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500 text-sm">Queue에서 글을 클릭하여 편집하세요.</p>
            <button onClick={() => setTab("queue")} className="mt-3 px-4 py-2 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Queue로 가기</button>
          </div>
        )
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="space-y-6">
          {/* Automation toggles */}
          <div className="card p-4">
            <h3 className="text-sm font-medium text-white mb-3">Blog Automation</h3>
            <div className="space-y-3">
              {[
                { id: "blog-generate-drafts", label: "Content Generation", desc: "학생/학부모 대상 칼럼 자동 생성" },
                { id: "blog-auto-publish", label: "Auto Publish", desc: "승인된 글을 블로그에 자동 발행" },
              ].map((job) => {
                const cron = cronJobs.find((j) => j.id === job.id || j.name === job.id) as Record<string, unknown> | undefined;
                const enabled = cron?.enabled !== false;
                return (
                  <label key={job.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-300">{job.label}</span>
                      <p className="text-[10px] text-gray-600">{job.desc}</p>
                      {cron && (
                        <p className="text-[10px] text-gray-600">
                          Status: <span className={cron.lastStatus === "ok" ? "text-green-400" : cron.lastStatus === "error" ? "text-red-400" : "text-gray-500"}>{String(cron.lastStatus || "unknown")}</span>
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => handleCronToggle(job.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 cursor-pointer after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Content Guide */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Content Guide</span>
              <span className="text-[10px] text-gray-500">학생/학부모 대상 콘텐츠 전략</span>
            </div>
            <textarea
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
              rows={12}
              className="w-full bg-gray-800 text-gray-200 text-xs p-3 rounded border border-gray-700 font-mono leading-relaxed"
            />
            <button onClick={handleSaveGuide} className="mt-2 px-4 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save Guide</button>
          </div>

          {/* SEO Keywords */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Blog SEO Keywords</span>
              <span className="text-[10px] text-gray-500">학생/학부모 검색어</span>
            </div>
            {bank.length > 0 && (
              <div className="mb-3 p-3 rounded bg-purple-900/10 border border-purple-800/30">
                <p className="text-[10px] text-purple-300 mb-2">Keyword Bank ({bank.length}개) — 클릭하여 추가</p>
                <div className="flex flex-wrap gap-1">
                  {bank.map((k) => (
                    <button
                      key={k.keyword}
                      onClick={() => addBankKeyword(k.keyword)}
                      className="text-[10px] px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 hover:bg-purple-800/50 border border-purple-800/30"
                    >
                      {k.keyword} {k.totalSearches ? <span className="text-gray-500">{k.totalSearches.toLocaleString()}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={8}
              className="w-full bg-gray-800 text-gray-200 text-xs p-3 rounded border border-gray-700 font-mono"
            />
            <button onClick={handleSaveKeywords} className="mt-2 px-4 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save Keywords</button>
          </div>
        </div>
      )}
    </div>
  );
}
