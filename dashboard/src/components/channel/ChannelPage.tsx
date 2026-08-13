"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useChannelConfig } from "@/hooks/useChannelConfig";
import { useToast } from "@/components/layout/Toast";
import { useUIStore } from "@/store/ui-store";
import { CH_LABELS, CH_STATUS_LABEL } from "@/lib/constants";
import { setupGuides } from "@/lib/setup-guides";
import { CredentialForm } from "@/components/shared/CredentialForm";
import { SocialConnectButton } from "@/components/channel/SocialConnectButton";
import { AccountManager } from "@/components/channel/AccountManager";
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
import { fmtTime } from "@/lib/format";
import { BackButton } from "@/components/shared/BackButton";
import { TenantAutomationSettings } from "./TenantAutomationSettings";
import { channelTextLimit } from "@/lib/channel-text-limits";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Section } from "@/components/shared/Section";
import { Stack } from "@/components/shared/Stack";
import { ChannelTabs } from "@/components/channel/ChannelTabs";
import { isChannelTabEnabled } from "@/lib/channel-capabilities";

interface ChannelPageProps {
  channel: string;
  variant?: "text" | "blog" | "video";
}

// 미연결 채널 탭 — 콘텐츠를 살짝 블러(모자이크)로 가리고 연결 유도 모달을 띄운다.
// 빈 화면 대신 "여기 뭔가 있다 → 연결하면 보인다"를 보여줘 연결 전환을 높인다.
function ConnectGate({ label, onConnect }: { label: string; onConnect: () => void }) {
  return (
    <div className="relative min-h-[260px]">
      {/* 블러 미리보기(실데이터 아님 — 모자이크 느낌의 자리표시) */}
      <div className="blur-sm select-none pointer-events-none opacity-60" aria-hidden>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-pad-inset mb-pad-inset">
          {["Published", "Views", "Avg Views", "Avg Likes"].map((l) => (
            <div key={l} className="card p-pad-inset">
              <p className="text-caption text-subtle uppercase tracking-wide">{l}</p>
              <p className="text-heading font-bold text-text mt-micro">—</p>
            </div>
          ))}
        </div>
        <div className="card p-pad-inset space-y-stack-tight">
          {["w-4/5", "w-3/5", "w-2/3"].map((widthClass, i) => (
            <div key={i} className={`h-3 rounded bg-surface-2 ${widthClass}`} />
          ))}
        </div>
      </div>
      {/* 연결 유도 모달 */}
      <div className="absolute inset-0 flex items-center justify-center p-pad-inset">
        <Card className="p-stack-section text-center max-w-xs border border-accent/40 bg-surface shadow-xl">
          <div className="text-display mb-stack-tight">🔗</div>
          <p className="text-body font-medium text-text mb-micro">{label} 아직 연결 안 됨</p>
          <p className="text-caption text-subtle mb-pad-inset">연결하면 이 채널의 발행·분석을 바로 쓸 수 있어요.</p>
          <Button variant="primary" onClick={onConnect}>
            연결하기
          </Button>
        </Card>
      </div>
    </div>
  );
}

export function ChannelPage({ channel, variant = "text" }: ChannelPageProps) {
  const label = CH_LABELS[channel] || channel;
  const { data: channelConfig, mutate: mutateConfig } = useChannelConfig();
  const { showToast } = useToast();
  const { subTab, setSubTab, expandedPopular, setExpandedPopular } = useUIStore();
  const [showManualCreds, setShowManualCreds] = useState(false);
  // SNS-007: OAuth 연결 성공 시 AccountManager를 강제 리마운트해 목록을 갱신(key bump — refresh()를
  // 부모가 직접 호출하려면 ref forwarding이 필요한데, remount가 더 단순하고 목록 API 자체가 가벼움).
  const [accountsRefreshTick, setAccountsRefreshTick] = useState(0);

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

  // 채널 진입 시 기본 탭: 미연결이면 '연결(설정)' 탭으로 보내 키를 바로 입력하게(연결됨이면 큐).
  // 예전엔 무조건 queue로 빠져 채널 세팅 자체가 불가능했음.
  useEffect(() => {
    setSubTab(connected ? "queue" : "settings");
  }, [channel]); // eslint-disable-line react-hooks/exhaustive-deps
  // 연결 상태가 뒤늦게 로드돼 현재 탭이 채널에 없으면 보정
  useEffect(() => {
    if (!isChannelTabEnabled(channel, subTab)) setSubTab(connected ? "queue" : "settings");
  }, [channel, subTab, connected, setSubTab]);

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

  const charLimit = channelTextLimit(channel);
  const postVariant = variant === "blog" ? "blog" as const : "text" as const;

  return (
    <div className="px-region py-stack-section">
      <BackButton />
      <div className="flex items-center gap-stack mb-stack-section">
        <span className={`w-8 h-8 rounded-lg ${isThreads ? "bg-accent" : "bg-surface-2"} flex items-center justify-center text-body font-bold text-text`}>
          {label[0]}
        </span>
        <div>
          <h2 className="text-subheading font-semibold text-text">{label}</h2>
          <p className="text-caption text-subtle">
            {isThreads
              ? `${cfg?.userId ? "ID: " + cfg.userId : ""} ${growth.length ? " · " + (growth[growth.length - 1] as Record<string, unknown>).followers + " followers" : ""}`
              : connected ? "Connected" : CH_STATUS_LABEL[status] || status}
          </p>
        </div>
      </div>

      {reconnectRequired && (
        <div className="mb-stack-section rounded-lg border border-warning/40 bg-warning/10 p-stack text-caption text-warning">
          ⚠ 재연결 필요. 저장된 인증 정보가 만료됐거나 무효합니다. 아래에서 OAuth로 다시 연결해주세요.
        </div>
      )}
      {providerUnreachable && (
        <div className="mb-stack-section rounded-lg border border-border/60 bg-surface-2 p-stack text-caption text-subtle">
          ⚠ 연결 상태 확인 불가. {label} 서버에 일시적으로 연결할 수 없습니다. 저장된 인증 정보는 유지됩니다. 잠시 후 새로고침해 다시 확인하세요.
        </div>
      )}

      <ChannelTabs channel={channel} activeTab={subTab} onTabChange={setSubTab} />

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-section">
          {/* Credentials */}
          <div className="card p-pad-inset">
            {oauthLabel && (
              <div className="mb-pad-inset">
                <SocialConnectButton
                  provider={channel}
                  label={oauthLabel}
                  onConnected={() => {
                    mutateConfig();
                    setAccountsRefreshTick((n) => n + 1);
                  }}
                />
                <AccountManager
                  key={`${channel}-${accountsRefreshTick}`}
                  provider={channel}
                  label={oauthLabel}
                  onAccountsChanged={mutateConfig}
                />
                <p className="text-caption text-subtle mt-stack-tight">공식 OAuth가 기본 경로입니다. 토큰 직접 입력은 고급/비상용으로만 사용하세요.</p>
                <Button
                  size="sm"
                  onClick={() => setShowManualCreds((v) => !v)}
                  className="mt-stack-tight"
                >
                  {showManualCreds ? "수동 토큰 입력 닫기" : "고급: 토큰 직접 입력"}
                </Button>
              </div>
            )}
            {!oauthLabel && channel === "bluesky" && (
              <div className="mb-pad-inset">
                <AccountManager
                  key={`bluesky-${accountsRefreshTick}`}
                  provider="bluesky"
                  label="Bluesky"
                  allowManualAdd
                  onAccountsChanged={() => {
                    mutateConfig();
                    setAccountsRefreshTick((n) => n + 1);
                  }}
                />
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
              <div className="rounded-lg border border-success/30 bg-success/10 p-stack text-caption text-success">
                OAuth 연결 상태입니다. 원문 access token은 화면에 표시하지 않고 서버에 암호화 저장합니다.
              </div>
            )}
            {oauthLabel && !showManualCreds && reconnectRequired && (
              <div className="mt-stack rounded-lg border border-warning/40 bg-warning/10 p-stack text-caption text-warning">
                ⚠ 재연결 필요 — 저장된 토큰이 만료되었거나 무효합니다({label} 측 거부). 위 OAuth 버튼으로 다시 연결해주세요.
              </div>
            )}
          </div>

          {/* Channel Info + Setup Guide */}
          <div className="space-y-pad-inset">
            <Section title="Channel Info" headingLevel={3} className="card p-pad-inset">
              <div className="space-y-stack-tight text-body">
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
            </Section>
            <div className="card p-pad-inset">
              <SetupGuide
                quick={sg.quick}
                detail={sg.detail}
                images={sg.images}
                warning={channel === "x" ? "* 권한 변경 후 반드시 액세스 토큰을 재생성해야 합니다" : undefined}
              />
            </div>
          </div>

          {/* Tenant-scoped automation — no global cron status/run access. */}
          <TenantAutomationSettings channel={channel} />

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
export function AnalyticsTab() {
  const { data } = useSWR("/api/analytics", fetcher);
  const a = data as Record<string, unknown> | undefined;
  if (!a) return <p className="text-subtle">Loading...</p>;

  const s = (a.summary || {}) as Record<string, unknown>;
  const posts = ((a.posts || []) as Record<string, unknown>[]).sort(
    (a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""))
  );
  const topics = (a.topics || {}) as Record<string, { count: number; avgViews?: number; avgLikes?: number }>;
  const hashtags = (a.hashtags || {}) as Record<string, { count: number; avgViews?: number; avgLikes?: number }>;
  const vt = (s.viralThreshold as number) || 500;

  return (
    <>
      {(s.totalPublished as number) === 0 && (
        <div className="p-stack rounded bg-surface/50 mb-pad-inset">
          <p className="text-caption text-subtle">아직 발행된 글이 없습니다. Queue에서 draft를 승인하면 자동 발행됩니다.</p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-pad-inset mb-stack-section">
        {[
          ["Published", s.totalPublished],
          ["Views", s.totalViews],
          ["Avg Views", s.avgViews],
          ["Avg Likes", s.avgLikes],
        ].map(([label, val]) => (
          <div key={String(label)} className="card p-pad-inset">
            <p className="text-caption text-subtle uppercase tracking-wide">{String(label)}</p>
            <p className="text-heading font-bold text-text mt-micro">{String(val ?? 0)}</p>
          </div>
        ))}
      </div>

      {Object.keys(topics).length > 0 && (
        <div className="card p-pad-inset mb-stack-section">
          <h3 className="text-caption font-medium text-subtle mb-stack">Topic Performance</h3>
          <table className="w-full text-body">
            <thead>
              <tr className="text-caption text-subtle uppercase">
                <th className="text-left py-micro">Topic</th>
                <th className="text-right py-micro">Posts</th>
                <th className="text-right py-micro">Avg Views</th>
                <th className="text-right py-micro">Avg Likes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(topics).map(([t, stats]) => (
                <tr key={t} className="border-t border-border/50">
                  <td className="text-muted py-micro">{t}</td>
                  <td className="text-subtle text-right py-micro">{stats.count}</td>
                  <td className="text-subtle text-right py-micro">{stats.avgViews || 0}</td>
                  <td className="text-subtle text-right py-micro">{stats.avgLikes || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Object.keys(hashtags).length > 0 && (
        <div className="card p-pad-inset mb-stack-section">
          <h3 className="text-caption font-medium text-subtle mb-stack">Hashtag Performance</h3>
          <div className="flex flex-wrap gap-stack-tight">
            {Object.entries(hashtags)
              .sort((a, b) => (b[1].avgViews || 0) - (a[1].avgViews || 0))
              .map(([t, stats]) => (
                <span
                  key={t}
                  className={`inline-flex items-center gap-micro px-stack-tight py-micro rounded-full text-caption border border-border ${
                    (stats.avgViews || 0) >= vt
                      ? "bg-warning/15 border-warning/40 text-warning"
                      : "bg-surface text-subtle"
                  }`}
                >
                  #{t}{" "}
                  <span className="text-caption text-subtle">
                    {stats.count}posts {stats.avgViews || 0}v {stats.avgLikes || 0}l
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div className="card p-pad-inset">
          <h3 className="text-caption font-medium text-subtle mb-stack">Post Performance</h3>
          <div className="space-y-stack-tight">
            {posts.map((p, i) => {
              const views = (p.views as number) || 0;
              const isViral = views >= vt;
              return (
                <div key={i} className="flex items-start gap-stack py-stack-tight border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-caption text-muted truncate" title={String(p.text || "")}>
                      {String(p.text || "")}
                    </p>
                    <div className="flex items-center gap-stack mt-micro">
                      <span className="text-caption text-subtle">{String(p.topic || "")}</span>
                      <span className="text-caption text-subtle">{p.publishedAt ? fmtTime(p.publishedAt) : ""}</span>
                      {!!p.archived && <span className="text-caption text-subtle">archived</span>}
                    </div>
                  </div>
                  <div className="flex gap-pad-inset text-right shrink-0">
                    <div>
                      <p className={`text-caption ${isViral ? "text-yellow-400 font-medium" : "text-muted"}`}>{views}</p>
                      <p className="text-caption text-subtle">views</p>
                    </div>
                    <div>
                      <p className="text-caption text-muted">{String(p.likes || 0)}</p>
                      <p className="text-caption text-subtle">likes</p>
                    </div>
                    <div>
                      <p className="text-caption text-muted">{String(p.replies || 0)}</p>
                      <p className="text-caption text-subtle">replies</p>
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
  if (!records.length) return <p className="text-subtle text-body">No growth data</p>;

  return (
    <div className="card p-pad-inset">
      <h3 className="text-caption font-medium text-subtle mb-stack">Follower History</h3>
      <div className="space-y-micro">
        {records.slice(-14).map((r) => (
          <div key={r.date} className="flex justify-between text-caption border-b border-border/50 py-micro">
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
    "own-viral": "bg-success/15 text-success",
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
      <div className="card p-pad-inset mb-pad-inset">
        <div className="flex items-center gap-stack-tight mb-stack">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-caption text-muted">Add External Post</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-surface text-muted text-caption p-stack-tight rounded border border-border mb-stack-tight"
          rows={3}
          placeholder="인기글 텍스트를 붙여넣기"
        />
        <div className="flex gap-stack-tight">
          <input value={url} onChange={(e) => setUrl(e.target.value)} type="text" placeholder="URL (선택)" className="flex-1 bg-surface text-muted text-caption p-stack-tight rounded border border-border" />
          <input value={topic} onChange={(e) => setTopic(e.target.value)} type="text" placeholder="키워드/주제" className="w-28 bg-surface text-muted text-caption p-stack-tight rounded border border-border" />
          <Button variant="primary" size="sm" onClick={handleAdd}>Add</Button>
        </div>
      </div>
      <div className="space-y-stack-tight">
        {popular.length === 0 ? (
          <p className="text-subtle text-body">No popular posts</p>
        ) : (
          popular.map((p, i) => {
            const open = expandedPopular === i;
            return (
              <div key={i} className="card overflow-hidden cursor-pointer hover:bg-surface-2/20 transition-colors" onClick={() => setExpandedPopular(open ? null : i)}>
                <div className="flex items-center gap-stack-tight px-pad-inset pt-stack pb-micro">
                  <span className={`text-caption px-stack-tight py-[2px] rounded ${SOURCE_COLORS[String(p.source)] || "bg-surface-2 text-muted"}`}>
                    {String(p.source || "?")}
                  </span>
                  {p.topic ? <span className="text-caption text-subtle">{String(p.topic)}</span> : null}
                  {p.likes && String(p.likes) !== "0" ? <span className="text-caption text-yellow-500">{String(p.likes)} likes</span> : null}
                  {p.username ? <span className="text-caption text-subtle">@{String(p.username)}</span> : null}
                  <span className="text-caption text-subtle ml-auto">{String(p.collected || "")}</span>
                  <svg className={`w-3 h-3 text-subtle transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <p className={`text-caption text-muted px-pad-inset pb-stack ${open ? "whitespace-pre-wrap" : "truncate"}`}>
                  {String(p.text || "")}
                </p>
                {open && (
                  <div className="px-pad-inset pb-stack flex items-center gap-stack border-t border-border/50 pt-stack-tight">
                    {p.engagement ? <span className="text-caption text-subtle">{String(p.engagement)}</span> : null}
                    {p.url ? (
                      <a href={String(p.url)} target="_blank" rel="noopener noreferrer" className="text-caption text-accent hover:text-accent" onClick={(e) => e.stopPropagation()}>
                        원본 보기 &rarr;
                      </a>
                    ) : null}
                    <Button variant="danger" size="sm" className="ml-auto" onClick={(e) => { e.stopPropagation(); handleDelete(i); }}>
                      삭제
                    </Button>
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
    <div className="card p-pad-inset">
      <div className="flex items-center justify-between mb-pad-inset">
        <h3 className="text-body font-medium text-muted">Parameters</h3>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      {PARAMS.map((p) => (
        <div key={p.key} className="flex items-center justify-between py-stack-tight border-b border-border/50 last:border-0">
          <div>
            <p className="text-caption text-muted">{p.label}</p>
            <p className="text-caption text-subtle">{p.desc}</p>
          </div>
          <input
            type="number"
            value={vals[p.key] ?? (s[p.key] ?? "")}
            onChange={(e) => setVals((prev) => ({ ...prev, [p.key]: e.target.value }))}
            min={0}
            className="w-20 bg-surface border border-border rounded px-stack-tight py-micro text-body text-muted text-right"
          />
        </div>
      ))}
    </div>
  );
}
