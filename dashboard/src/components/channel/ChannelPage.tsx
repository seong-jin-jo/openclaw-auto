"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { useToast } from "@/components/layout/Toast";
import { useUIStore } from "@/store/ui-store";
import { CH_LABELS, CH_STATUS_LABEL, AUTOMATION_FEATURES } from "@/lib/constants";
import { setupGuides } from "@/lib/setup-guides";
import { CredentialForm } from "@/components/shared/CredentialForm";
import { SocialConnectButton } from "@/components/channel/SocialConnectButton";
import { SetupGuide } from "@/components/shared/SetupGuide";

// OAuth "연결" 버튼을 제공하는 채널(ADR-004 — 비번/토큰 없이 버튼만). 점진 확장.
const OAUTH_CONNECT: Record<string, string> = {
  instagram: "Instagram",
  threads: "Threads",
  facebook: "Facebook",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  naver_blog: "Naver Blog",
  pinterest: "Pinterest",
  tumblr: "Tumblr",
  tiktok: "TikTok",
  slack: "Slack",
  line: "LINE",
};
import { ContentGuide } from "./ContentGuide";
import { KeywordsEditor } from "./KeywordsEditor";
import { QueueList } from "@/components/queue/QueueList";
import { fmtAgo, fmtTime } from "@/lib/format";
import { BackButton } from "@/components/shared/BackButton";

interface ChannelPageProps {
  channel: string;
  variant?: "text" | "blog" | "video";
}

const CHAR_LIMITS: Record<string, number> = {
  x: 280,
  threads: 500,
  facebook: 63206,
  linkedin: 3000,
  bluesky: 300,
  pinterest: 500,
  tumblr: 4096,
  instagram: 2200,
};

// 미연결 채널 탭 — 콘텐츠를 살짝 블러(모자이크)로 가리고 연결 유도 모달을 띄운다.
// 빈 화면 대신 "여기 뭔가 있다 → 연결하면 보인다"를 보여줘 연결 전환을 높인다.
function ConnectGate({ label, onConnect }: { label: string; onConnect: () => void }) {
  return (
    <div className="relative min-h-[260px]">
      {/* 블러 미리보기(실데이터 아님 — 모자이크 느낌의 자리표시) */}
      <div className="blur-sm select-none pointer-events-none opacity-60" aria-hidden>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {["Published", "Views", "Avg Views", "Avg Likes"].map((l) => (
            <div key={l} className="card p-4">
              <p className="text-[11px] text-subtle uppercase tracking-wide">{l}</p>
              <p className="text-2xl font-bold text-text mt-1">—</p>
            </div>
          ))}
        </div>
        <div className="card p-4 space-y-2">
          {[80, 60, 70].map((w, i) => (
            <div key={i} className="h-3 rounded bg-surface-2" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      {/* 연결 유도 모달 */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="card p-6 text-center max-w-xs border border-accent/40 bg-surface shadow-xl">
          <div className="text-3xl mb-2">🔗</div>
          <p className="text-sm font-medium text-text mb-1">{label} 아직 연결 안 됨</p>
          <p className="text-xs text-subtle mb-4">연결하면 이 채널의 발행·분석을 바로 쓸 수 있어요.</p>
          <button onClick={onConnect} className="px-4 py-2 text-sm bg-accent text-text rounded-lg hover:bg-accent-hover">
            연결하기
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChannelPage({ channel, variant = "text" }: ChannelPageProps) {
  const label = CH_LABELS[channel] || channel;
  const { data: channelConfig, mutate: mutateConfig } = useChannelConfig();
  const { showToast } = useToast();
  const { subTab, setSubTab, expandedFeature, setExpandedFeature, expandedPopular, setExpandedPopular } = useUIStore();
  const [showManualCreds, setShowManualCreds] = useState(false);

  const cfg = channelConfig?.[channel];
  const status = cfg?.status || "available";
  const keys = cfg?.keys || {};
  const connected = !!cfg?.connected;
  // instagram/threads는 저장된 토큰이 있어도 OAuth code 190(무효)이면 connected=false + reconnectRequired=true로
  // 온다(GET /api/channel-config 라이브 검증). "인증 필요" raw 노출 대신 명확한 한국어 재연결 CTA로 안내.
  const reconnectRequired = !!cfg?.reconnectRequired;
  const providerUnreachable = cfg?.connectionStatus === "unverified" && cfg?.connectionError === "provider_unreachable";
  const sg = setupGuides[channel] || { fields: [], labels: [], quick: ["Setup guide 준비 중"], detail: "" };

  const isThreads = channel === "threads";
  const oauthLabel = OAUTH_CONNECT[channel];

  // Build tabs: all channels get queue/analytics/settings. Threads also gets growth/popular.
  const baseTabs = ["queue", "analytics", "settings"];
  let tabs: string[];
  if (isThreads) {
    tabs = ["queue", "analytics", "growth", "popular", "settings"];
  } else {
    tabs = baseTabs;
  }

  // 채널 진입 시 기본 탭: 미연결이면 '연결(설정)' 탭으로 보내 키를 바로 입력하게(연결됨이면 큐).
  // 예전엔 무조건 queue로 빠져 채널 세팅 자체가 불가능했음.
  useEffect(() => {
    setSubTab(connected ? "queue" : "settings");
  }, [channel]); // eslint-disable-line react-hooks/exhaustive-deps
  // 연결 상태가 뒤늦게 로드돼 현재 탭이 채널에 없으면 보정
  useEffect(() => {
    if (!tabs.includes(subTab)) setSubTab(connected ? "queue" : "settings");
  }, [tabs, subTab, connected, setSubTab]);

  const handleCredSave = async (newKeys: Record<string, string>) => {
    const r = await apiPost<{ verified?: boolean; unverified?: boolean; reason?: string; error?: string; account?: string }>(`/api/channel-config/${channel}`, newKeys);
    if (r?.verified) {
      showToast(`${label} 연결 완료${r.account ? " — " + r.account : ""}`, "success");
      mutateConfig();
    } else if (r?.unverified) {
      // 네트워크 등으로 확인 불가 — 키는 저장됐으나 검증 미완(자동화는 비활성 유지가 안전).
      showToast(`${label} 저장됨 · 미검증${r.reason ? " — " + r.reason : ""}`, "warning");
      mutateConfig();
    } else {
      showToast(`연결 실패: ${r?.error || "Invalid credentials"}`, "error");
      throw new Error(r?.error || "Verification failed");
    }
  };

  // Growth data for threads header
  const { data: growthData } = useSWR(isThreads ? "/api/growth" : null, fetcher);
  const growth = (((growthData as Record<string, unknown>)?.records || []) as Array<Record<string, unknown>>);

  // Threads username (lazy load)
  const { data: threadsUsernameData } = useSWR(isThreads ? "/api/threads-username" : null, fetcher);
  const threadsUsername = (threadsUsernameData as Record<string, unknown>)?.username as string || "";

  const charLimit = CHAR_LIMITS[channel];
  const postVariant = variant === "blog" ? "blog" as const : "text" as const;

  return (
    <div className="px-8 py-6">
      <BackButton />
      <div className="flex items-center gap-3 mb-6">
        <span className={`w-8 h-8 rounded-lg ${isThreads ? "bg-accent" : "bg-surface-2"} flex items-center justify-center text-sm font-bold text-text`}>
          {label[0]}
        </span>
        <div>
          <h2 className="text-xl font-semibold text-text">{label}</h2>
          <p className="text-xs text-subtle">
            {isThreads
              ? `${cfg?.userId ? "ID: " + cfg.userId : ""} ${growth.length ? " \u00B7 " + (growth[growth.length - 1] as Record<string, unknown>).followers + " followers" : ""}`
              : connected ? "Connected" : CH_STATUS_LABEL[status] || status}
          </p>
        </div>
      </div>

      {reconnectRequired && (
        <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          \u26A0 \uC7AC\uC5F0\uACB0 \uD544\uC694 \u2014 \uC800\uC7A5\uB41C \uC778\uC99D \uC815\uBCF4\uAC00 \uB9CC\uB8CC\uB418\uC5C8\uAC70\uB098 \uBB34\uD6A8\uD569\uB2C8\uB2E4. \uC544\uB798\uC5D0\uC11C OAuth\uB85C \uB2E4\uC2DC \uC5F0\uACB0\uD574\uC8FC\uC138\uC694.
        </div>
      )}
      {providerUnreachable && (
        <div className="mb-6 rounded-lg border border-border/60 bg-surface-2 p-3 text-xs text-subtle">
          \u26A0 \uC5F0\uACB0 \uC0C1\uD0DC \uD655\uC778 \uBD88\uAC00 \u2014 {label} \uC11C\uBC84\uC5D0 \uC77C\uC2DC\uC801\uC73C\uB85C \uC5F0\uACB0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC800\uC7A5\uB41C \uC778\uC99D \uC815\uBCF4\uB294 \uC720\uC9C0\uB429\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uC0C8\uB85C\uACE0\uCE68\uD574 \uB2E4\uC2DC \uD655\uC778\uD558\uC138\uC694.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border/50 pb-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-3 py-1.5 text-sm rounded ${
              subTab === t ? "bg-accent text-text" : "text-subtle hover:bg-surface-2"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Queue Tab */}
      {subTab === "queue" && (
        connected || isThreads ? (
          <QueueList variant={postVariant} charLimit={charLimit} showSeo={variant === "blog"} />
        ) : (
          <ConnectGate label={label} onConnect={() => setSubTab("settings")} />
        )
      )}

      {/* Analytics Tab */}
      {subTab === "analytics" && (
        connected || isThreads ? <AnalyticsTab /> : (
          <ConnectGate label={label} onConnect={() => setSubTab("settings")} />
        )
      )}

      {/* Growth Tab (Threads only) */}
      {subTab === "growth" && isThreads && <GrowthTab />}

      {/* Popular Tab (Threads only) */}
      {subTab === "popular" && isThreads && <PopularTab expandedPopular={expandedPopular} setExpandedPopular={setExpandedPopular} />}

      {/* Settings Tab */}
      {subTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Credentials */}
          <div className="card p-5">
            {oauthLabel && (
              <div className="mb-4">
                <SocialConnectButton provider={channel} label={oauthLabel} />
                <p className="text-[10px] text-subtle mt-2">공식 OAuth가 기본 경로입니다. 토큰 직접 입력은 고급/비상용으로만 사용하세요.</p>
                <button
                  type="button"
                  onClick={() => setShowManualCreds((v) => !v)}
                  className="mt-2 text-[11px] text-accent hover:text-accent"
                >
                  {showManualCreds ? "수동 토큰 입력 닫기" : "고급: 토큰 직접 입력"}
                </button>
              </div>
            )}
            {(!oauthLabel || showManualCreds) && (
              <CredentialForm
                channelKey={channel}
                fields={sg.fields}
                labels={sg.labels}
                currentKeys={keys}
                onSave={handleCredSave}
                connected={connected}
                title={isThreads ? "수동 Threads 토큰" : channel === "x" ? "수동 OAuth 1.0 Keys" : "수동 Credentials"}
                badge={isThreads ? { text: "Long-lived Token", color: "blue" } : channel === "x" ? { text: "OAuth 1.0a", color: "blue" } : undefined}
                connectLabel={isThreads ? "Connect Threads" : channel === "x" ? "Connect X Account" : undefined}
                fieldGroups={channel === "x" ? [
                  { title: "소비자 키 (Consumer Keys)", fieldIndices: [0, 1] },
                  { title: "액세스 토큰 (Access Token)", fieldIndices: [2, 3] },
                ] : undefined}
              />
            )}
            {oauthLabel && !showManualCreds && connected && (
              <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success">
                OAuth 연결 상태입니다. 원문 access token은 화면에 표시하지 않고 서버에 암호화 저장합니다.
              </div>
            )}
            {oauthLabel && !showManualCreds && reconnectRequired && (
              <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
                ⚠ 재연결 필요 — 저장된 토큰이 만료되었거나 무효합니다({label} 측 거부). 위 OAuth 버튼으로 다시 연결해주세요.
              </div>
            )}
          </div>

          {/* Channel Info + Setup Guide */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-medium text-muted mb-3">Channel Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-subtle">Status</span>
                  <span className={connected ? "text-success" : status === "connected" ? "text-accent" : "text-warning"}>
                    {connected ? "Connected" : reconnectRequired ? "재연결 필요" : CH_STATUS_LABEL[status] || "Not connected"}
                  </span>
                </div>
                {isThreads && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-subtle">Username</span>
                      <span className="text-muted">{threadsUsername ? "@" + threadsUsername : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-subtle">Token Validity</span>
                      <span className="text-muted">60일 (갱신 필요)</span>
                    </div>
                  </>
                )}
                {channel === "x" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-subtle">Auth Method</span>
                      <span className="text-muted">OAuth 1.0a (User Context)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-subtle">Permission</span>
                      <span className="text-muted">Read and Write 필수</span>
                    </div>
                  </>
                )}
                {charLimit && (
                  <div className="flex justify-between">
                    <span className="text-subtle">Character Limit</span>
                    <span className="text-muted">{charLimit}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="card p-5">
              <SetupGuide
                quick={sg.quick}
                detail={sg.detail}
                images={sg.images}
                warning={channel === "x" ? "* 권한 변경 후 반드시 액세스 토큰을 재생성해야 합니다" : undefined}
              />
            </div>
          </div>

          {/* Automation */}
          <AutomationSection channel={channel} expandedFeature={expandedFeature} setExpandedFeature={setExpandedFeature} />

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
  if (!a) return <p className="text-subtle">Loading...</p>;

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
        <div className="p-3 rounded bg-surface/50 mb-4">
          <p className="text-xs text-subtle">아직 발행된 글이 없습니다. Queue에서 draft를 승인하면 자동 발행됩니다.</p>
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
            <p className="text-[11px] text-subtle uppercase tracking-wide">{String(label)}</p>
            <p className="text-2xl font-bold text-text mt-1">{String(val ?? 0)}</p>
          </div>
        ))}
      </div>

      {Object.keys(topics).length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-xs font-medium text-subtle mb-3">Topic Performance</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-subtle uppercase">
                <th className="text-left py-1">Topic</th>
                <th className="text-right py-1">Posts</th>
                <th className="text-right py-1">Avg Views</th>
                <th className="text-right py-1">Avg Likes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(topics).map(([t, stats]) => (
                <tr key={t} className="border-t border-border/50">
                  <td className="text-muted py-1">{t}</td>
                  <td className="text-subtle text-right py-1">{stats.count}</td>
                  <td className="text-subtle text-right py-1">{stats.avgViews || 0}</td>
                  <td className="text-subtle text-right py-1">{stats.avgLikes || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Object.keys(hashtags).length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-xs font-medium text-subtle mb-3">Hashtag Performance</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(hashtags)
              .sort((a, b) => (b[1].avgViews || 0) - (a[1].avgViews || 0))
              .map(([t, stats]) => (
                <span
                  key={t}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border border-border ${
                    (stats.avgViews || 0) >= vt
                      ? "bg-yellow-900/30 border-yellow-700/50 text-yellow-300"
                      : "bg-surface text-subtle"
                  }`}
                >
                  #{t}{" "}
                  <span className="text-[10px] text-subtle">
                    {stats.count}posts {stats.avgViews || 0}v {stats.avgLikes || 0}l
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-medium text-subtle mb-3">Post Performance</h3>
          <div className="space-y-2">
            {posts.map((p, i) => {
              const views = (p.views as number) || 0;
              const isViral = views >= vt;
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted truncate" title={String(p.text || "")}>
                      {String(p.text || "")}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-subtle">{String(p.topic || "")}</span>
                      <span className="text-[10px] text-subtle">{p.publishedAt ? fmtTime(p.publishedAt) : ""}</span>
                      {!!p.archived && <span className="text-[10px] text-subtle">archived</span>}
                    </div>
                  </div>
                  <div className="flex gap-4 text-right shrink-0">
                    <div>
                      <p className={`text-xs ${isViral ? "text-yellow-400 font-medium" : "text-muted"}`}>{views}</p>
                      <p className="text-[10px] text-subtle">views</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">{String(p.likes || 0)}</p>
                      <p className="text-[10px] text-subtle">likes</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">{String(p.replies || 0)}</p>
                      <p className="text-[10px] text-subtle">replies</p>
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
  if (!records.length) return <p className="text-subtle text-sm">No growth data</p>;

  return (
    <div className="card p-4">
      <h3 className="text-xs font-medium text-subtle mb-3">Follower History</h3>
      <div className="space-y-1">
        {records.slice(-14).map((r) => (
          <div key={r.date} className="flex justify-between text-xs border-b border-border/50 py-1">
            <span className="text-muted">{r.date}</span>
            <span className="text-muted">{r.followers}</span>
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
    external: "bg-accent-soft text-accent",
    "own-viral": "bg-green-900/50 text-green-300",
    manual: "bg-surface-2 text-muted",
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
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs text-muted">Add External Post</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-surface text-muted text-xs p-2 rounded border border-border mb-2"
          rows={3}
          placeholder="인기글 텍스트를 붙여넣기"
        />
        <div className="flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} type="text" placeholder="URL (선택)" className="flex-1 bg-surface text-muted text-xs p-2 rounded border border-border" />
          <input value={topic} onChange={(e) => setTopic(e.target.value)} type="text" placeholder="키워드/주제" className="w-28 bg-surface text-muted text-xs p-2 rounded border border-border" />
          <button onClick={handleAdd} className="px-3 py-1.5 text-xs bg-accent text-text rounded hover:bg-accent-hover shrink-0">Add</button>
        </div>
      </div>
      <div className="space-y-2">
        {popular.length === 0 ? (
          <p className="text-subtle text-sm">No popular posts</p>
        ) : (
          popular.map((p, i) => {
            const open = expandedPopular === i;
            return (
              <div key={i} className="card overflow-hidden cursor-pointer hover:bg-surface-2/20 transition-colors" onClick={() => setExpandedPopular(open ? null : i)}>
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${SOURCE_COLORS[String(p.source)] || "bg-surface-2 text-muted"}`}>
                    {String(p.source || "?")}
                  </span>
                  {p.topic ? <span className="text-[10px] text-subtle">{String(p.topic)}</span> : null}
                  {p.likes && String(p.likes) !== "0" ? <span className="text-[10px] text-yellow-500">{String(p.likes)} likes</span> : null}
                  {p.username ? <span className="text-[10px] text-subtle">@{String(p.username)}</span> : null}
                  <span className="text-[10px] text-subtle ml-auto">{String(p.collected || "")}</span>
                  <svg className={`w-3 h-3 text-subtle transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <p className={`text-xs text-muted px-4 pb-3 ${open ? "whitespace-pre-wrap" : "truncate"}`}>
                  {String(p.text || "")}
                </p>
                {open && (
                  <div className="px-4 pb-3 flex items-center gap-3 border-t border-border/50 pt-2">
                    {p.engagement ? <span className="text-[10px] text-subtle">{String(p.engagement)}</span> : null}
                    {p.url ? (
                      <a href={String(p.url)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent hover:text-accent" onClick={(e) => e.stopPropagation()}>
                        원본 보기 &rarr;
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
  const { data: channelSettings, mutate: mutateSettings } = useSWR(`/api/channel-settings/${channel}`, fetcher);
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
  const FEATURE_CRON = FEATURE_CRON_MAP[channel] || {};

  const shownCronEditors = new Set<string>();

  const handleToggle = async (key: string, checked: boolean) => {
    try {
      await apiPost(`/api/channel-settings/${channel}`, { [key]: checked });
      mutateSettings();
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
      <h3 className="text-sm font-medium text-muted mb-4">Automation</h3>
      {AUTOMATION_FEATURES.map((f) => {
        const featureRuns = runs.filter((r) => r.jobName === FEATURE_CRON[f.key]);
        const lastRun = featureRuns[0];
        const expanded = expandedFeature === f.key;
        const cronName = FEATURE_CRON[f.key];
        const job = jobs.find((j) => j.id === cronName) as Record<string, unknown> | undefined;
        const hours = job?.everyMs ? Math.round((job.everyMs as number) / 3600000) : null;
        const showInterval = cronName && !shownCronEditors.has(cronName);
        if (cronName) shownCronEditors.add(cronName);

        // For channels without cron mapping, show as "Coming Soon"
        const hasCronMapping = !!FEATURE_CRON[f.key];
        const isImplemented = (f as Record<string, unknown>).implemented !== false;
        const showComingSoon = !isImplemented || (!hasCronMapping && !["content_generation", "auto_publish"].includes(f.key));

        return (
          <div key={f.key} className="border-b border-border/50 last:border-0">
            <div className="flex items-center gap-3 py-2.5 cursor-pointer" onClick={() => setExpandedFeature(expanded ? null : f.key)}>
              <label className={`relative inline-flex items-center shrink-0 ${showComingSoon ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`} onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={!!(cs[f.key])} onChange={(e) => !showComingSoon && handleToggle(f.key, e.target.checked)} disabled={showComingSoon} className="sr-only peer" />
                <div className="w-9 h-5 bg-surface-2 rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${showComingSoon ? "text-subtle" : "text-muted"}`}>{f.label}</span>
                  {showComingSoon && <span className="text-[9px] text-subtle">Coming Soon</span>}
                  {hours && <span className="text-[10px] text-subtle">{hours}h</span>}
                  {lastRun && (
                    <>
                      <span className={`text-[10px] ${lastRun.status === "ok" ? "text-success" : "text-danger"}`}>
                        {lastRun.status === "ok" ? "\u2713" : "\u2717"}
                      </span>
                      <span className="text-[10px] text-subtle">{lastRun.finishedAt ? fmtAgo(lastRun.finishedAt) : ""}</span>
                    </>
                  )}
                  {(featureRuns.length > 0 || hours) && (
                    <svg className={`w-3 h-3 text-subtle ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
                <p className="text-[10px] text-subtle">{f.description}</p>
              </div>
            </div>
            {expanded && (
              <div className="ml-12 mb-3 space-y-1.5">
                {showInterval && hours && (
                  <div className="flex items-center gap-2 py-1.5 px-2 bg-surface/50 rounded mb-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-subtle">Interval</span>
                    <select
                      defaultValue={hours}
                      onChange={(e) => handleIntervalChange(cronName!, parseInt(e.target.value, 10))}
                      className="bg-surface-2 border border-border rounded px-1.5 py-0.5 text-[10px] text-muted"
                    >
                      {[1, 2, 3, 4, 6, 8, 12, 24, 48, 168].map((h) => (
                        <option key={h} value={h}>{h < 24 ? `${h}h` : h === 24 ? "1d" : h === 48 ? "2d" : "7d"}</option>
                      ))}
                    </select>
                  </div>
                )}
                {featureRuns.slice(0, 10).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <span className={`text-[10px] mt-0.5 ${r.status === "ok" ? "text-success" : "text-danger"}`}>
                      {r.status === "ok" ? "\u2713" : "\u2717"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-subtle">
                          {r.finishedAt ? new Date(r.finishedAt as string).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : ""}
                        </span>
                        <span className="text-[10px] text-subtle">{String(r.model || "")}</span>
                        <span className="text-[10px] text-subtle ml-auto">{r.durationMs ? `${Math.round((r.durationMs as number) / 1000)}s` : ""}</span>
                      </div>
                      <p className="text-[10px] text-subtle break-words">{String(r.summary || "")}</p>
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
        <h3 className="text-sm font-medium text-muted">Parameters</h3>
        <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-xs bg-accent text-text rounded hover:bg-accent-hover disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {PARAMS.map((p) => (
        <div key={p.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <div>
            <p className="text-xs text-muted">{p.label}</p>
            <p className="text-[10px] text-subtle">{p.desc}</p>
          </div>
          <input
            type="number"
            value={vals[p.key] ?? (s[p.key] ?? "")}
            onChange={(e) => setVals((prev) => ({ ...prev, [p.key]: e.target.value }))}
            min={0}
            className="w-20 bg-surface border border-border rounded px-2 py-1 text-sm text-muted text-right"
          />
        </div>
      ))}
    </div>
  );
}
