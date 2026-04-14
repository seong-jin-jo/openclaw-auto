"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useChannelConfig, useNotifSettings, useChatChannels } from "@/hooks/useChannelConfig";
import { useToast } from "@/components/layout/Toast";
import { useUIStore } from "@/store/ui-store";
import { CH_LABELS, CH_STATUS_LABEL, AUTOMATION_FEATURES } from "@/lib/constants";
import { setupGuides } from "@/lib/setup-guides";
import { CredentialForm } from "@/components/shared/CredentialForm";
import { SetupGuide } from "@/components/shared/SetupGuide";
import { ContentGuide } from "./ContentGuide";
import { KeywordsEditor } from "./KeywordsEditor";
import { QueueList } from "@/components/queue/QueueList";
import { fmtAgo, fmtTime } from "@/lib/format";
import Link from "next/link";

interface ChannelPageProps {
  channel: string;
}

const TABS_FULL = ["queue", "analytics", "growth", "popular", "settings"];

export function ChannelPage({ channel }: ChannelPageProps) {
  const label = CH_LABELS[channel] || channel;
  const { data: channelConfig, mutate: mutateConfig } = useChannelConfig();
  const { showToast } = useToast();
  const { subTab, setSubTab, expandedFeature, setExpandedFeature, expandedPopular, setExpandedPopular } = useUIStore();

  const cfg = channelConfig?.[channel];
  const status = cfg?.status || "available";
  const keys = cfg?.keys || {};
  const connected = !!cfg?.connected;
  const sg = setupGuides[channel] || { fields: [], labels: [], quick: ["Setup guide 준비 중"], detail: "" };

  // Determine tabs based on channel type
  const isThreads = channel === "threads";
  const isX = channel === "x";

  const isGeneric = !isThreads && !isX;
  const isMessaging = ["telegram", "discord", "slack", "line", "kakao", "whatsapp"].includes(channel);

  let tabs: string[];
  if (isThreads) {
    tabs = TABS_FULL;
  } else if (isX) {
    tabs = connected ? ["queue", "analytics", "settings"] : ["settings"];
  } else {
    // Generic channels have no tabs — just show settings-like layout directly
    tabs = [];
  }

  // Reset subTab when channel changes
  useEffect(() => {
    if (isGeneric) {
      // Generic channels have no tabs
      return;
    }
    if (isX && !connected) {
      setSubTab("settings");
    } else {
      setSubTab("queue");
    }
  }, [channel, setSubTab, isX, isGeneric, connected]);

  const handleCredSave = async (newKeys: Record<string, string>) => {
    const r = await apiPost<{ verified?: boolean; error?: string; account?: string }>(`/api/channel-config/${channel}`, newKeys);
    if (r?.verified) {
      showToast(`${label} 연결 완료${r.account ? " — " + r.account : ""}`, "success");
      mutateConfig();
    } else {
      showToast(`연결 실패: ${r?.error || "Invalid credentials"}`, "error");
      throw new Error(r?.error || "Verification failed");
    }
  };

  // Channel-specific icon
  const iconClass = isThreads
    ? "bg-gradient-to-br from-purple-500 to-pink-500"
    : "bg-gray-800";

  // Growth data for threads header
  const { data: growthData } = useSWR(isThreads ? "/api/growth" : null, fetcher);
  const growth = (((growthData as Record<string, unknown>)?.records || []) as Array<Record<string, unknown>>);

  // Threads username (lazy load)
  const { data: threadsUsernameData } = useSWR(isThreads ? "/api/threads-username" : null, fetcher);
  const threadsUsername = (threadsUsernameData as Record<string, unknown>)?.username as string || "";

  return (
    <div className="px-8 py-6">
      <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm mb-1 inline-block">
        &larr; Back
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <span className={`w-8 h-8 rounded-lg ${iconClass} flex items-center justify-center text-sm font-bold text-white`}>
          {isThreads ? "T" : isX ? "X" : label[0]}
        </span>
        <div>
          <h2 className="text-xl font-semibold text-white">
            {isThreads ? "Threads" : isX ? "X (Twitter)" : label}
          </h2>
          <p className="text-xs text-gray-500">
            {isThreads
              ? `${cfg?.userId ? "ID: " + cfg.userId : ""} ${growth.length ? " \u00B7 " + (growth[growth.length - 1] as Record<string, unknown>).followers + " followers" : ""}`
              : isX
              ? connected ? "Connected" : "Not connected"
              : CH_STATUS_LABEL[status] || status}
          </p>
        </div>
      </div>

      {/* Tabs (only for Threads/X, generic channels have no tabs) */}
      {tabs.length > 0 && (
        <div className="flex gap-1 mb-6 border-b border-gray-800/50 pb-3">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setSubTab(t)}
              className={`px-3 py-1.5 text-sm rounded ${
                subTab === t ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}

      {subTab === "queue" && !isGeneric && (isX ? connected : true) && <QueueList />}
      {subTab === "analytics" && !isGeneric && (isX ? connected : true) && <AnalyticsTab />}
      {subTab === "growth" && isThreads && <GrowthTab />}
      {subTab === "popular" && isThreads && <PopularTab expandedPopular={expandedPopular} setExpandedPopular={setExpandedPopular} />}

      {/* Generic channel inline layout (no tabs) — matches Flask renderGenericChannel */}
      {isGeneric && (
        <GenericChannelLayout
          channel={channel}
          label={label}
          status={status}
          keys={keys}
          connected={connected}
          sg={sg}
          isMessaging={isMessaging}
          onSave={handleCredSave}
        />
      )}

      {/* Settings tab for Threads/X */}
      {subTab === "settings" && !isGeneric && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Credentials */}
          <div className="card p-5">
            <CredentialForm
              channelKey={channel}
              fields={sg.fields}
              labels={sg.labels}
              currentKeys={keys}
              onSave={handleCredSave}
              title={isThreads ? "Threads API Credentials" : isX ? "OAuth 1.0 Keys" : undefined}
              badge={isThreads ? { text: "Long-lived Token", color: "purple" } : isX ? { text: "OAuth 1.0a", color: "blue" } : undefined}
              connectLabel={isThreads ? "Connect Threads" : isX ? "Connect X Account" : undefined}
              fieldGroups={isX ? [
                { title: "소비자 키 (Consumer Keys)", fieldIndices: [0, 1] },
                { title: "액세스 토큰 (Access Token)", fieldIndices: [2, 3] },
              ] : undefined}
            />
          </div>

          {/* Channel Info + Setup Guide */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                {isThreads ? "Threads Channel Info" : "X Channel Info"}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={connected ? "text-green-400" : "text-yellow-400"}>
                    {connected ? "Connected" : "Not connected"}
                  </span>
                </div>
                {isThreads && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Username</span>
                      <span className="text-gray-300">{threadsUsername ? "@" + threadsUsername : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Character Limit</span>
                      <span className="text-gray-300">500</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Token Validity</span>
                      <span className="text-gray-300">60일 (갱신 필요)</span>
                    </div>
                  </>
                )}
                {isX && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Character Limit</span>
                      <span className="text-gray-300">280</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Auth Method</span>
                      <span className="text-gray-300">OAuth 1.0a (User Context)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Permission</span>
                      <span className="text-gray-300">Read and Write 필수</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Threads: NO setup guide. X: inline setup guide with warning */}
            {isX && (
              <div className="card p-5">
                <SetupGuide quick={sg.quick} detail={sg.detail} warning="* 권한 변경 후 반드시 액세스 토큰을 재생성해야 합니다" />
              </div>
            )}
          </div>

          {/* Automation (Threads only) */}
          {isThreads && <AutomationSection channel={channel} expandedFeature={expandedFeature} setExpandedFeature={setExpandedFeature} />}

          {/* Parameters (Threads only) */}
          {isThreads && <ParametersSection />}

          {/* Content Guide + Keywords */}
          <ContentGuide channel={channel} />
          <KeywordsEditor channel={channel} />
        </div>
      )}
    </div>
  );
}

/* ── Analytics Tab ── */
function AnalyticsTab() {
  const { data } = useSWR("/api/analytics", fetcher);
  const { data: cronData } = useSWR("/api/cron-status", fetcher);
  const a = data as Record<string, unknown> | undefined;
  if (!a) return <p className="text-gray-500">Loading...</p>;

  const s = (a.summary || {}) as Record<string, unknown>;
  const posts = ((a.posts || []) as Record<string, unknown>[]).sort(
    (a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""))
  );
  const topics = (a.topics || {}) as Record<string, { count: number; avgViews?: number; avgLikes?: number }>;
  const hashtags = (a.hashtags || {}) as Record<string, { count: number; avgViews?: number; avgLikes?: number }>;
  const vt = (s.viralThreshold as number) || 500;

  // Check cron status
  const cronJobs = (((cronData as Record<string, unknown>)?.jobs || cronData || []) as Array<Record<string, unknown>>);
  const insightsCron = cronJobs.find((j) => j.id === "threads-collect-insights" || (j.name as string)?.includes("반응"));
  const cronError = insightsCron && insightsCron.lastStatus === "error";
  const lastRun = insightsCron?.lastRunAt ? fmtAgo(new Date(insightsCron.lastRunAt as string).toISOString()) : null;

  return (
    <>
      {cronError && (
        <div className="p-3 rounded bg-yellow-900/20 border border-yellow-800/20 mb-4">
          <p className="text-[10px] text-yellow-400/80">
            자동화 일시 중단 — 데이터가 최신이 아닐 수 있습니다{lastRun ? ` (마지막 수집: ${lastRun})` : ""}
          </p>
        </div>
      )}
      {(s.totalPublished as number) === 0 && (
        <div className="p-3 rounded bg-gray-900/50 mb-4">
          <p className="text-xs text-gray-500">아직 발행된 글이 없습니다. Queue에서 draft를 승인하면 자동 발행됩니다.</p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ["Published", s.totalPublished],
          ["Views", s.totalViews],
          ["Avg Views", s.avgViews],
          ["Avg Likes", s.avgLikes],
        ].map(([label, val]) => (
          <div key={String(label)} className="card p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">{String(label)}</p>
            <p className="text-2xl font-bold text-white mt-1">{String(val ?? 0)}</p>
          </div>
        ))}
      </div>

      {Object.keys(topics).length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-xs font-medium text-gray-400 mb-3">Topic Performance</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase">
                <th className="text-left py-1">Topic</th>
                <th className="text-right py-1">Posts</th>
                <th className="text-right py-1">Avg Views</th>
                <th className="text-right py-1">Avg Likes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(topics).map(([t, stats]) => (
                <tr key={t} className="border-t border-gray-800/50">
                  <td className="text-gray-200 py-1">{t}</td>
                  <td className="text-gray-400 text-right py-1">{stats.count}</td>
                  <td className="text-gray-400 text-right py-1">{stats.avgViews || 0}</td>
                  <td className="text-gray-400 text-right py-1">{stats.avgLikes || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Object.keys(hashtags).length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-xs font-medium text-gray-400 mb-3">Hashtag Performance</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(hashtags)
              .sort((a, b) => (b[1].avgViews || 0) - (a[1].avgViews || 0))
              .map(([t, stats]) => (
                <span
                  key={t}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border border-gray-800 ${
                    (stats.avgViews || 0) >= vt
                      ? "bg-yellow-900/30 border-yellow-700/50 text-yellow-300"
                      : "bg-gray-900 text-gray-400"
                  }`}
                >
                  #{t}{" "}
                  <span className="text-[10px] text-gray-500">
                    {stats.count}posts {stats.avgViews || 0}v {stats.avgLikes || 0}l
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-medium text-gray-400 mb-3">Post Performance</h3>
          <div className="space-y-2">
            {posts.map((p, i) => {
              const views = (p.views as number) || 0;
              const isViral = views >= vt;
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-800/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 truncate" title={String(p.text || "")}>
                      {String(p.text || "")}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-600">{String(p.topic || "")}</span>
                      <span className="text-[10px] text-gray-600">{p.publishedAt ? fmtTime(p.publishedAt) : ""}</span>
                      {!!p.archived && <span className="text-[10px] text-gray-700">archived</span>}
                    </div>
                  </div>
                  <div className="flex gap-4 text-right shrink-0">
                    <div>
                      <p className={`text-xs ${isViral ? "text-yellow-400 font-medium" : "text-gray-300"}`}>{views}</p>
                      <p className="text-[10px] text-gray-600">views</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-300">{String(p.likes || 0)}</p>
                      <p className="text-[10px] text-gray-600">likes</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-300">{String(p.replies || 0)}</p>
                      <p className="text-[10px] text-gray-600">replies</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Growth Tab ── */
function GrowthTab() {
  const { data } = useSWR("/api/growth", fetcher);
  const records = (((data as Record<string, unknown>)?.records || []) as Array<{ date: string; followers: number; delta: number }>);
  if (!records.length) return <p className="text-gray-600 text-sm">No growth data</p>;

  return (
    <div className="card p-4">
      <h3 className="text-xs font-medium text-gray-400 mb-3">Follower History</h3>
      <div className="space-y-1">
        {records.slice(-14).map((r) => (
          <div key={r.date} className="flex justify-between text-xs border-b border-gray-800/50 py-1">
            <span className="text-gray-300">{r.date}</span>
            <span className="text-gray-200">{r.followers}</span>
            <span className={r.delta >= 0 ? "text-green-400" : "text-red-400"}>
              {r.delta >= 0 ? "+" : ""}{r.delta}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Popular Tab ── */
function PopularTab({ expandedPopular, setExpandedPopular }: { expandedPopular: number | null; setExpandedPopular: (idx: number | null) => void }) {
  const { data, mutate } = useSWR("/api/popular", fetcher);
  const { showToast } = useToast();
  const popular = (((data as Record<string, unknown>)?.posts || []) as Array<Record<string, unknown>>);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");

  const SOURCE_COLORS: Record<string, string> = {
    external: "bg-purple-900/50 text-purple-300",
    "own-viral": "bg-green-900/50 text-green-300",
    manual: "bg-gray-700 text-gray-300",
  };

  const handleAdd = async () => {
    if (!text.trim()) return;
    try {
      await apiPost("/api/popular/add", { text: text.trim(), url: url.trim(), topic: topic.trim() || "general" });
      showToast("인기글 추가됨", "success");
      setText(""); setUrl(""); setTopic("");
      mutate();
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handleDelete = async (i: number) => {
    if (!confirm("이 인기글을 삭제하시겠습니까?")) return;
    try {
      await apiPost("/api/popular/delete", { index: i });
      showToast("삭제됨", "success");
      setExpandedPopular(null);
      mutate();
    } catch (e) { showToast(`삭제 실패: ${(e as Error).message}`, "error"); }
  };

  return (
    <>
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs text-gray-300">Add External Post</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-gray-900 text-gray-200 text-xs p-2 rounded border border-gray-700 mb-2"
          rows={3}
          placeholder="인기글 텍스트를 붙여넣기"
        />
        <div className="flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} type="text" placeholder="Threads URL (선택)" className="flex-1 bg-gray-900 text-gray-200 text-xs p-2 rounded border border-gray-700" />
          <input value={topic} onChange={(e) => setTopic(e.target.value)} type="text" placeholder="키워드/주제" className="w-28 bg-gray-900 text-gray-200 text-xs p-2 rounded border border-gray-700" />
          <button onClick={handleAdd} className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 shrink-0">Add</button>
        </div>
      </div>
      <div className="space-y-2">
        {popular.length === 0 ? (
          <p className="text-gray-600 text-sm">No popular posts</p>
        ) : (
          popular.map((p, i) => {
            const open = expandedPopular === i;
            return (
              <div key={i} className="card overflow-hidden cursor-pointer hover:bg-gray-800/20 transition-colors" onClick={() => setExpandedPopular(open ? null : i)}>
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${SOURCE_COLORS[String(p.source)] || "bg-gray-700 text-gray-300"}`}>
                    {String(p.source || "?")}
                  </span>
                  {p.topic ? <span className="text-[10px] text-gray-500">{String(p.topic)}</span> : null}
                  {p.likes && String(p.likes) !== "0" ? <span className="text-[10px] text-yellow-500">{String(p.likes)} likes</span> : null}
                  {p.username ? <span className="text-[10px] text-gray-600">@{String(p.username)}</span> : null}
                  <span className="text-[10px] text-gray-700 ml-auto">{String(p.collected || "")}</span>
                  <svg className={`w-3 h-3 text-gray-600 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <p className={`text-xs text-gray-300 px-4 pb-3 ${open ? "whitespace-pre-wrap" : "truncate"}`}>
                  {String(p.text || "")}
                </p>
                {open && (
                  <div className="px-4 pb-3 flex items-center gap-3 border-t border-gray-800/50 pt-2">
                    {p.engagement ? <span className="text-[10px] text-gray-500">{String(p.engagement)}</span> : null}
                    {p.url ? (
                      <a href={String(p.url)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300" onClick={(e) => e.stopPropagation()}>
                        Threads에서 보기 &rarr;
                      </a>
                    ) : null}
                    <button className="text-[10px] text-red-400 hover:text-red-300 ml-auto" onClick={(e) => { e.stopPropagation(); handleDelete(i); }}>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

/* ── Automation Section ── */
function AutomationSection({ channel, expandedFeature, setExpandedFeature }: {
  channel: string;
  expandedFeature: string | null;
  setExpandedFeature: (key: string | null) => void;
}) {
  const { data: channelSettings } = useSWR(`/api/channel-settings/${channel}`, fetcher);
  const { data: cronJobs } = useSWR("/api/cron-status", fetcher);
  const { data: cronRuns } = useSWR("/api/cron-runs", fetcher);
  const { showToast } = useToast();

  const cs = (channelSettings as Record<string, unknown>) || {};
  const jobs = (((cronJobs as Record<string, unknown>)?.jobs || cronJobs || []) as Array<Record<string, unknown>>);
  const runs = ((((cronRuns as Record<string, unknown>)?.runs || []) as Array<Record<string, unknown>>));

  const FEATURE_CRON_MAP: Record<string, Record<string, string>> = {
    threads: {
      content_generation: "threads-generate-drafts",
      auto_publish: "threads-auto-publish",
      insights_collection: "threads-collect-insights",
      auto_like_replies: "threads-collect-insights",
      low_engagement_cleanup: "threads-collect-insights",
      trending_collection: "threads-fetch-trending",
      follower_tracking: "threads-track-growth",
      trending_rewrite: "threads-rewrite-trending",
    },
    instagram: {
      content_generation: "instagram-generate-drafts",
      auto_publish: "instagram-auto-publish",
    },
  };
  const FEATURE_CRON = FEATURE_CRON_MAP[channel] || FEATURE_CRON_MAP.threads;

  const shownCronEditors = new Set<string>();

  const handleToggle = async (key: string, checked: boolean) => {
    try {
      await apiPost(`/api/channel-settings/${channel}`, { [key]: checked });
      showToast(`${key} ${checked ? "ON" : "OFF"}`, "success");
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  const handleIntervalChange = async (jobName: string, hours: number) => {
    const label = hours < 24 ? `${hours}시간` : hours === 24 ? "1일" : hours === 48 ? "2일" : "7일";
    if (!confirm(`주기를 ${label}으로 변경하시겠습니까?`)) return;
    try {
      await apiPost(`/api/cron/${jobName}/interval`, { hours });
      showToast(`주기 변경: ${hours}h`, "success");
    } catch (e) { showToast(`실패: ${(e as Error).message}`, "error"); }
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Automation</h3>
      {AUTOMATION_FEATURES.map((f) => {
        const featureRuns = runs.filter((r) => r.jobName === FEATURE_CRON[f.key]);
        const lastRun = featureRuns[0];
        const expanded = expandedFeature === f.key;
        const cronName = FEATURE_CRON[f.key];
        const job = jobs.find((j) => j.id === cronName) as Record<string, unknown> | undefined;
        const hours = job?.everyMs ? Math.round((job.everyMs as number) / 3600000) : null;
        const showInterval = cronName && !shownCronEditors.has(cronName);
        if (cronName) shownCronEditors.add(cronName);

        return (
          <div key={f.key} className="border-b border-gray-800/50 last:border-0">
            <div className="flex items-center gap-3 py-2.5 cursor-pointer" onClick={() => setExpandedFeature(expanded ? null : f.key)}>
              <label className="relative inline-flex items-center cursor-pointer shrink-0" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={!!(cs[f.key])} onChange={(e) => handleToggle(f.key, e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">{f.label}</span>
                  {hours && <span className="text-[10px] text-gray-600">{hours}h</span>}
                  {lastRun && (
                    <>
                      <span className={`text-[10px] ${lastRun.status === "ok" ? "text-green-400" : "text-red-400"}`}>
                        {lastRun.status === "ok" ? "\u2713" : "\u2717"}
                      </span>
                      <span className="text-[10px] text-gray-600">{lastRun.finishedAt ? fmtAgo(lastRun.finishedAt) : ""}</span>
                    </>
                  )}
                  {(featureRuns.length > 0 || hours) && (
                    <svg className={`w-3 h-3 text-gray-600 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
                <p className="text-[10px] text-gray-600">{f.description}</p>
              </div>
            </div>
            {expanded && (
              <div className="ml-12 mb-3 space-y-1.5">
                {showInterval && hours && (
                  <div className="flex items-center gap-2 py-1.5 px-2 bg-gray-900/50 rounded mb-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-gray-400">Interval</span>
                    <select
                      defaultValue={hours}
                      onChange={(e) => handleIntervalChange(cronName!, parseInt(e.target.value, 10))}
                      className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-300"
                    >
                      {[1, 2, 3, 4, 6, 8, 12, 24, 48, 168].map((h) => (
                        <option key={h} value={h}>{h < 24 ? `${h}h` : h === 24 ? "1d" : h === 48 ? "2d" : "7d"}</option>
                      ))}
                    </select>
                  </div>
                )}
                {featureRuns.slice(0, 10).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <span className={`text-[10px] mt-0.5 ${r.status === "ok" ? "text-green-400" : "text-red-400"}`}>
                      {r.status === "ok" ? "\u2713" : "\u2717"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">
                          {r.finishedAt ? new Date(r.finishedAt as string).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : ""}
                        </span>
                        <span className="text-[10px] text-gray-700">{String(r.model || "")}</span>
                        <span className="text-[10px] text-gray-700 ml-auto">{r.durationMs ? `${Math.round((r.durationMs as number) / 1000)}s` : ""}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 break-words">{String(r.summary || "")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Parameters Section ── */
function ParametersSection() {
  const { data: settings, mutate } = useSWR("/api/settings", fetcher);
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const s = (settings || {}) as Record<string, number>;

  const PARAMS = [
    { key: "viralThreshold", label: "Viral Threshold", desc: "터진 글 기준 views" },
    { key: "draftsPerBatch", label: "Drafts per Batch", desc: "배치당 생성 개수" },
    { key: "imagePerBatch", label: "Images per Batch", desc: "배치당 이미지 첨부 수" },
    { key: "casualPerBatch", label: "Casual per Batch", desc: "배치당 일상 글 수" },
    { key: "quotePerBatch", label: "Quotes per Batch", desc: "배치당 인용 게시 수" },
    { key: "publishIntervalHours", label: "Publish Interval", desc: "발행 간격 (시간)" },
    { key: "insightsIntervalHours", label: "Insights Interval", desc: "반응 수집 간격 (시간)" },
    { key: "insightsMaxCollections", label: "Max Collections", desc: "최대 반응 수집 횟수" },
    { key: "minLikes", label: "Min Likes", desc: "외부 인기글 최소 좋아요" },
    { key: "searchDays", label: "Search Days", desc: "검색 기간 (일)" },
    { key: "maxPopularPosts", label: "Max Popular Posts", desc: "인기글 최대 보관 수" },
  ];

  const [vals, setVals] = useState<Record<string, string>>({});

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, number> = {};
      for (const p of PARAMS) {
        const v = vals[p.key];
        if (v !== undefined) payload[p.key] = parseInt(v, 10) || 0;
      }
      await apiPost("/api/settings", payload);
      showToast("설정 저장됨", "success");
      mutate();
    } catch (e) { showToast(`저장 실패: ${(e as Error).message}`, "error"); } finally { setSaving(false); }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">Parameters</h3>
        <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {PARAMS.map((p) => (
        <div key={p.key} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
          <div>
            <p className="text-xs text-gray-300">{p.label}</p>
            <p className="text-[10px] text-gray-600">{p.desc}</p>
          </div>
          <input
            type="number"
            value={vals[p.key] ?? (s[p.key] ?? "")}
            onChange={(e) => setVals((prev) => ({ ...prev, [p.key]: e.target.value }))}
            min={0}
            className="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 text-right"
          />
        </div>
      ))}
    </div>
  );
}

/* ── Generic Channel Layout (no tabs) — matches Flask renderGenericChannel ── */
function GenericChannelLayout({
  channel,
  label,
  status,
  keys,
  connected,
  sg,
  isMessaging,
  onSave,
}: {
  channel: string;
  label: string;
  status: string;
  keys: Record<string, string>;
  connected: boolean;
  sg: { fields: string[]; labels: string[]; quick: string[]; detail: string };
  isMessaging: boolean;
  onSave: (keys: Record<string, string>) => Promise<void>;
}) {
  const { data: notifSettings } = useNotifSettings();
  const { data: chatChannels } = useChatChannels();
  const { showToast } = useToast();
  const [testMsg, setTestMsg] = useState("Marketing Hub 테스트 메시지");
  const [sending, setSending] = useState(false);

  const handleTestSend = async () => {
    setSending(true);
    try {
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/send-notification", { channel, message: testMsg });
      if (r?.ok) showToast(`${channel} 전송 완료`, "success");
      else showToast(`전송 실패: ${r?.error || "unknown"}`, "error");
    } catch (e) { showToast(`전송 실패: ${(e as Error).message}`, "error"); }
    finally { setSending(false); }
  };

  const hasKeys = Object.values(keys).some((v) => v);
  const chatConfigured = chatChannels?.[channel]?.configured;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Credentials */}
      <div className="card p-5">
        <CredentialForm
          channelKey={channel}
          fields={sg.fields}
          labels={sg.labels}
          currentKeys={keys}
          onSave={onSave}
        />
      </div>

      {/* Channel Info + Setup Guide */}
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Channel Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={status === "live" ? "text-green-400" : status === "connected" ? "text-blue-400" : "text-gray-500"}>
                {status === "live" ? "Live" : status === "connected" ? "Connected" : "Not connected"}
              </span>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <SetupGuide quick={sg.quick} detail={sg.detail} />
        </div>
      </div>

      {/* Content Guide + Keywords (only for non-messaging channels) */}
      {!isMessaging && (
        <>
          <ContentGuide channel={channel} />
          <KeywordsEditor channel={channel} />
        </>
      )}

      {/* Messaging-specific sections */}
      {isMessaging && (
        <>
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-3">알림 발송</h3>
            <p className="text-[10px] text-gray-600 mb-3">이 채널로 마케팅 알림을 자동 발송할 수 있습니다.</p>
            <div className="space-y-2">
              {[
                { evt: "onPublish", label2: "글 발행 시" },
                { evt: "onViral", label2: "바이럴 감지 시" },
                { evt: "onError", label2: "크론 에러 시" },
                { evt: "weeklyReport", label2: "주간 리포트" },
              ].map(({ evt, label2 }) => {
                const enabled = (notifSettings as Record<string, { channels?: string[] }> | undefined)?.[evt]?.channels?.includes(channel);
                return (
                  <div key={evt} className="flex items-center justify-between p-2 rounded bg-gray-900/50">
                    <span className="text-xs text-gray-400">{label2}</span>
                    <span className={`text-[10px] ${enabled ? "text-green-400" : "text-gray-600"}`}>{enabled ? "ON" : "OFF"}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-600 mt-2">Settings &gt; Notifications에서 변경</p>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-3">테스트 발송</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
              />
              <button
                onClick={handleTestSend}
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
            {chatConfigured ? (
              <div className="mt-3 p-2 rounded bg-green-900/20 border border-green-800/20">
                <p className="text-[10px] text-green-400">Interactive Chat 연결됨 — 이 채널에서 Agent와 대화 가능</p>
              </div>
            ) : (
              <div className="mt-3 p-2 rounded bg-gray-900/50">
                <p className="text-[10px] text-gray-500">
                  Interactive Chat: Gateway에서 <code>openclaw channels setup {channel}</code>로 양방향 대화 활성화
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
