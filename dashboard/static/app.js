/* Marketing Hub Dashboard — Vanilla JS */

// ── Toast ──
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const colors = {
    success: "bg-green-800 text-green-200 border-green-600",
    error: "bg-red-800 text-red-200 border-red-600",
    warning: "bg-yellow-800 text-yellow-200 border-yellow-600",
    info: "bg-blue-800 text-blue-200 border-blue-600",
  };
  const el = document.createElement("div");
  el.className = `px-4 py-2 rounded border text-sm shadow-lg transition-opacity duration-300 ${colors[type] || colors.info}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 3000);
}

const API = {
  async get(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) { showToast(`요청 실패: ${res.status}`, "error"); return null; }
      return res.json();
    } catch (e) { showToast(`네트워크 오류: ${e.message}`, "error"); return null; }
  },
  async post(url, body) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || `요청 실패: ${res.status}`, "error"); return null; }
      return res.json();
    } catch (e) { showToast(`네트워크 오류: ${e.message}`, "error"); return null; }
  },
};

// ── State ──
const S = {
  page: "overview", subTab: "queue",
  overview: null, queue: [], growth: [], popular: [], analytics: null,
  keywords: [], settings: null, guide: "", cronJobs: [], activity: [],
  channelConfig: { threads: {}, x: {} },
  queueFilter: "all", loading: false,
  editingPost: null, selectedIds: new Set(),
};

function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function fmtTime(ms) { return ms ? new Date(ms).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : "-"; }
function fmtAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Data Loading ──
async function loadOverview() {
  const [data, cronData, activity, chCfg] = await Promise.all([
    API.get("/api/overview"), API.get("/api/cron-status"), API.get("/api/activity"), API.get("/api/channel-config"),
  ]);
  if (data) S.overview = data;
  if (cronData) S.cronJobs = cronData.jobs || [];
  if (activity) S.activity = activity.events || [];
  if (chCfg) S.channelConfig = chCfg;
  render();
}
async function loadQueue(status) {
  const url = status && status !== "all" ? `/api/queue?status=${status}` : "/api/queue";
  const data = await API.get(url);
  if (data) S.queue = (data.posts || []).sort((a, b) => (b.generatedAt || "").localeCompare(a.generatedAt || ""));
  render();
}
async function loadGrowth() { const d = await API.get("/api/growth"); if (d) S.growth = d.records || []; render(); }
async function loadPopular() { const d = await API.get("/api/popular"); if (d) S.popular = d.posts || []; render(); }
async function loadAnalytics() { const d = await API.get("/api/analytics"); if (d) S.analytics = d; render(); }
async function loadKeywords() { const d = await API.get("/api/keywords"); if (d) S.keywords = d.keywords || []; render(); }
async function loadSettings() {
  const [s, g] = await Promise.all([API.get("/api/settings"), API.get("/api/guide")]);
  if (s) S.settings = s;
  S.guide = g ? g.guide || "" : "";
  render();
}

// ── Actions ──
async function approvePost(id, hours = 2) { const r = await API.post(`/api/queue/${id}/approve`, { hours }); if (r) { showToast("승인 완료", "success"); loadQueue(S.queueFilter); } }
async function updatePost(id, text) { const r = await API.post(`/api/queue/${id}/update`, { text }); if (r) { showToast("수정 완료", "success"); S.editingPost = null; loadQueue(S.queueFilter); } }
async function deletePost(id) { if (!confirm("정말 삭제?")) return; const r = await API.post(`/api/queue/${id}/delete`); if (r) { showToast("삭제 완료", "success"); loadQueue(S.queueFilter); } }
async function bulkApprove() {
  const ids = Array.from(S.selectedIds); if (!ids.length) return;
  if (!confirm(`${ids.length}개 일괄 승인?`)) return;
  const r = await API.post("/api/queue/bulk-approve", { ids });
  if (r) { showToast(`${r.approved}개 승인`, "success"); S.selectedIds.clear(); loadQueue(S.queueFilter); }
}
async function bulkDelete() {
  const ids = Array.from(S.selectedIds); if (!ids.length) return;
  if (!confirm(`${ids.length}개 일괄 삭제?`)) return;
  const r = await API.post("/api/queue/bulk-delete", { ids });
  if (r) { showToast(`${r.deleted}개 삭제`, "success"); S.selectedIds.clear(); loadQueue(S.queueFilter); }
}
function toggleSelectAll() {
  const selectable = S.queue.filter(p => p.status === "draft" || p.status === "approved");
  if (S.selectedIds.size === selectable.length && selectable.length > 0) S.selectedIds.clear();
  else selectable.forEach(p => S.selectedIds.add(p.id));
  render();
}
function fmtDate(iso) { return iso ? new Date(iso).toLocaleString("ko-KR", {month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}) : ""; }

// ── Render ──
function render() {
  document.getElementById("sidebar").innerHTML = renderSidebar();
  const app = document.getElementById("app");
  if (S.page === "overview") app.innerHTML = renderOverview();
  else if (S.page === "threads") app.innerHTML = renderChannel("threads");
  else if (S.page === "x") app.innerHTML = renderChannelX();
  else if (S.page === "settings") app.innerHTML = renderSettings();
  bindEvents();
}

function renderSidebar() {
  const items = [
    { page: "overview", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`, label: "Marketing Home" },
  ];
  const cronOk = S.cronJobs.filter(j => j.lastStatus === "ok").length;
  const cronTotal = S.cronJobs.length;

  return `
    <aside class="w-56 border-r border-gray-800/50 flex flex-col h-screen sticky top-0" style="background:#0e0e0e">
      <div class="px-4 py-5 border-b border-gray-800/50">
        <h1 class="text-base font-semibold text-white tracking-tight">Marketing Hub</h1>
        <p class="text-xs text-gray-500 mt-0.5">openclaw-auto</p>
      </div>
      <nav class="flex-1 py-3">
        <div class="px-3 mb-2"><span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Overview</span></div>
        ${items.map(i => `
          <button data-nav="${i.page}" class="sidebar-item ${S.page === i.page ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3">
            <span class="text-gray-500">${i.icon}</span> ${i.label}
          </button>
        `).join("")}

        <div class="px-3 mt-5 mb-2"><span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Channels</span></div>
        <button data-nav="threads" class="sidebar-item ${S.page === "threads" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3">
          <span class="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[9px] font-bold text-white">T</span>
          Threads
          <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${S.channelConfig.threads?.connected ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}">${S.channelConfig.threads?.connected ? "Live" : "Off"}</span>
        </button>
        <button data-nav="x" class="sidebar-item ${S.page === "x" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3">
          <span class="w-4 h-4 rounded bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white">X</span>
          X (Twitter)
          <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${S.channelConfig.x?.connected ? "bg-green-900/50 text-green-400" : "bg-yellow-900/50 text-yellow-400"}">${S.channelConfig.x?.connected ? "Live" : "Setup"}</span>
        </button>
        <div class="px-4 py-2 text-sm text-gray-600 flex items-center gap-3 opacity-50">
          <span class="w-4 h-4 rounded bg-gray-800 flex items-center justify-center text-[9px] font-bold text-gray-500">IG</span>
          Instagram <span class="ml-auto text-[10px] text-gray-700">Soon</span>
        </div>

        <div class="px-3 mt-5 mb-2"><span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">System</span></div>
        <button data-nav="settings" class="sidebar-item ${S.page === "settings" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Settings
        </button>
      </nav>
      <div class="px-4 py-3 border-t border-gray-800/50">
        <div class="flex items-center gap-2">
          <div class="pulse-dot ${cronOk === cronTotal ? "bg-green-500" : "bg-yellow-500"}"></div>
          <span class="text-xs text-gray-500">${cronOk}/${cronTotal} crons ok</span>
        </div>
      </div>
    </aside>`;
}

function card(title, value, sub) {
  return `<div class="card p-4"><p class="text-[11px] text-gray-500 uppercase tracking-wide">${title}</p><p class="text-2xl font-bold text-white mt-1">${value}</p>${sub ? `<p class="text-xs text-gray-400 mt-1">${sub}</p>` : ""}</div>`;
}

function channelBadge(label, ch) {
  if (!ch) return "";
  const c = { published: "bg-green-900/40 text-green-400", failed: "bg-red-900/40 text-red-400", pending: "bg-gray-800 text-gray-500", skipped: "bg-gray-800 text-gray-600" };
  return `<span class="text-[10px] px-1.5 py-0.5 rounded ${c[ch.status] || "bg-gray-700 text-gray-300"}">${label}: ${ch.status}</span>`;
}

// ── Overview Page ──
function renderOverview() {
  const o = S.overview;
  if (!o) return `<div class="px-8 py-6"><p class="text-gray-500">Loading...</p></div>`;
  const sc = o.statusCounts || {};
  const cc = o.channelCounts || {};
  const totalPub = sc.published || 0;

  return `<div class="px-8 py-6">
    <div class="flex items-center justify-between mb-6">
      <div><h2 class="text-xl font-semibold text-white">Marketing Overview</h2><p class="text-sm text-gray-500 mt-0.5">All channels at a glance</p></div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      ${card("Published", totalPub, `T:${cc.threads || 0} X:${cc.x || 0}`)}
      ${card("Followers", o.followers ?? "N/A", o.weekDelta != null ? `${o.weekDelta >= 0 ? "+" : ""}${o.weekDelta} this week` : "")}
      ${card("Viral", o.viralPosts?.length || 0, `>= ${S.settings?.viralThreshold || 500} views`)}
      ${card("Queue", (sc.draft || 0) + (sc.approved || 0), `${sc.draft || 0} drafts, ${sc.approved || 0} approved`)}
      ${card("Popular Refs", o.popularPostsCount || 0, Object.entries(o.popularSourceCounts || {}).map(([k, v]) => `${k}:${v}`).join(" "))}
    </div>

    <!-- Channel Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="channel-card card p-5" data-nav="threads">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">T</span>
            <div><h3 class="text-sm font-medium text-white">Threads</h3><p class="text-xs text-gray-500">${S.channelConfig.threads?.userId ? "ID: " + S.channelConfig.threads.userId : ""}</p></div>
          </div>
          <span class="text-[10px] px-2 py-1 rounded-full ${S.channelConfig.threads?.connected ? "bg-green-900/40 text-green-400 border border-green-800/30" : "bg-gray-800 text-gray-500"}">${S.channelConfig.threads?.connected ? "Connected" : "Not connected"}</span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><p class="text-[10px] text-gray-500">Published</p><p class="text-lg font-semibold text-white">${cc.threads || 0}</p></div>
          <div><p class="text-[10px] text-gray-500">Followers</p><p class="text-lg font-semibold text-white">${o.followers ?? "-"}</p></div>
          <div><p class="text-[10px] text-gray-500">Growth</p><p class="text-lg font-semibold ${(o.weekDelta || 0) >= 0 ? "text-green-400" : "text-red-400"}">${o.weekDelta != null ? (o.weekDelta >= 0 ? "+" : "") + o.weekDelta : "-"}</p></div>
        </div>
        <div class="mt-3 pt-3 border-t border-gray-800/50 flex justify-between text-xs"><span class="text-gray-600">View details</span><span class="text-blue-400">&rarr;</span></div>
      </div>

      <div class="channel-card card p-5" data-nav="x">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-white">X</span>
            <div><h3 class="text-sm font-medium text-white">X (Twitter)</h3><p class="text-xs text-gray-500">${S.channelConfig.x?.connected ? "Connected" : "Not connected"}</p></div>
          </div>
          <span class="text-[10px] px-2 py-1 rounded-full ${S.channelConfig.x?.connected ? "bg-green-900/40 text-green-400 border border-green-800/30" : "bg-yellow-900/40 text-yellow-400 border border-yellow-800/30"}">${S.channelConfig.x?.connected ? "Connected" : "Setup Required"}</span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><p class="text-[10px] text-gray-500">Published</p><p class="text-lg font-semibold ${cc.x ? "text-white" : "text-gray-600"}">${cc.x || 0}</p></div>
          <div><p class="text-[10px] text-gray-500">Impressions</p><p class="text-lg font-semibold text-gray-600">-</p></div>
          <div><p class="text-[10px] text-gray-500">Followers</p><p class="text-lg font-semibold text-gray-600">-</p></div>
        </div>
        <div class="mt-3 pt-3 border-t border-gray-800/50 flex justify-between text-xs"><span class="text-gray-600">${S.channelConfig.x?.connected ? "View details" : "Setup credentials"}</span><span class="text-${S.channelConfig.x?.connected ? "blue" : "yellow"}-400">&rarr;</span></div>
      </div>
    </div>

    <!-- Cron + Activity -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card p-5">
        <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Automation Status</h3>
        <div class="space-y-2.5">
          ${S.cronJobs.map(j => {
            const dot = j.lastStatus === "ok" ? "bg-green-500" : j.lastStatus === "error" ? "bg-red-500" : "bg-gray-600";
            const info = j.lastStatus === "error" ? `<span class="text-red-400">error</span>` : `<span>${fmtTime(j.nextRunAt)}</span>`;
            return `<div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full ${dot}"></div><span class="text-xs text-gray-300">${esc(j.name)}</span></div><span class="text-[10px] text-gray-500">${info}</span></div>`;
          }).join("")}
        </div>
      </div>
      <div class="card p-5 col-span-2">
        <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Recent Activity</h3>
        <div class="space-y-3">
          ${S.activity.slice(0, 6).map(e => {
            const icons = { publish: "bg-green-900/40 text-green-400", draft: "bg-purple-900/40 text-purple-400", viral: "bg-yellow-900/40 text-yellow-400" };
            const labels = { publish: e.channel || "T", draft: "AI", viral: "!" };
            return `<div class="flex gap-3 items-start">
              <div class="mt-0.5 w-6 h-6 rounded ${icons[e.type] || "bg-gray-800 text-gray-400"} flex items-center justify-center flex-shrink-0"><span class="text-[9px]">${labels[e.type] || "?"}</span></div>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-gray-300 truncate">${esc(e.text)}${e.type === "viral" ? ` — ${e.views} views` : ""}</p>
                <p class="text-[10px] text-gray-600 mt-0.5">${fmtAgo(e.at)}</p>
              </div>
            </div>`;
          }).join("") || `<p class="text-xs text-gray-600">No recent activity</p>`}
        </div>
      </div>
    </div>
  </div>`;
}

// ── Channel Page (Threads) ──
function renderChannel() {
  const tabs = ["queue", "analytics", "growth", "popular", "settings"];
  return `<div class="px-8 py-6">
    <button data-nav="overview" class="text-gray-500 hover:text-gray-300 text-sm mb-1">&larr; Back</button>
    <div class="flex items-center gap-3 mb-6">
      <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">T</span>
      <div><h2 class="text-xl font-semibold text-white">Threads</h2><p class="text-xs text-gray-500">${S.channelConfig.threads?.userId ? "ID: " + S.channelConfig.threads.userId : ""} ${S.growth.length ? " &middot; " + S.growth[S.growth.length - 1].followers + " followers" : ""}</p></div>
    </div>
    <div class="flex gap-1 mb-6 border-b border-gray-800/50 pb-3">
      ${tabs.map(t => `<button data-subtab="${t}" class="px-3 py-1.5 text-sm rounded ${S.subTab === t ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`).join("")}
    </div>
    ${S.subTab === "queue" ? renderQueue() : ""}
    ${S.subTab === "analytics" ? renderAnalytics() : ""}
    ${S.subTab === "growth" ? renderGrowth() : ""}
    ${S.subTab === "popular" ? renderPopular() : ""}
    ${S.subTab === "settings" ? renderChannelSettings("threads") : ""}
  </div>`;
}

function renderQueue() {
  const filters = ["all", "draft", "approved", "published", "failed"];
  return `
    <div class="flex items-center justify-between mb-4">
      <div class="flex gap-1">${filters.map(f => `<button data-filter="${f}" class="px-3 py-1 text-xs rounded ${S.queueFilter === f ? "bg-blue-600/30 text-blue-300 border border-blue-600/30" : "text-gray-500 hover:bg-gray-800"}">${f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join("")}</div>
      <div class="flex gap-2 items-center">
        ${S.queue.filter(p => p.status === "draft" || p.status === "approved").length > 0 ? `<label class="flex items-center gap-1 text-xs text-gray-400 cursor-pointer"><input type="checkbox" id="select-all" ${S.selectedIds.size > 0 ? "checked" : ""} class="rounded border-gray-600"> All</label>` : ""}
        ${S.selectedIds.size > 0 ? `
          <button id="bulk-approve" class="px-3 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve (${S.selectedIds.size})</button>
          <button id="bulk-delete" class="px-3 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600">Delete (${S.selectedIds.size})</button>
        ` : ""}
      </div>
    </div>
    <div class="space-y-3">
      ${S.queue.length === 0 ? `<p class="text-gray-600 text-sm">No posts</p>` : S.queue.map(renderPost).join("")}
    </div>`;
}

function renderPost(p) {
  const isEditing = S.editingPost === p.id;
  const sc = { draft: "bg-yellow-900/50 text-yellow-300", approved: "bg-blue-900/50 text-blue-300", published: "bg-green-900/50 text-green-300", failed: "bg-red-900/50 text-red-300" };
  const ch = p.channels || {};
  return `
    <div class="card p-4">
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center gap-2">
          ${p.status === "draft" || p.status === "approved" ? `<input type="checkbox" data-select="${p.id}" ${S.selectedIds.has(p.id) ? "checked" : ""} class="rounded border-gray-600">` : ""}
          <span class="text-[10px] px-2 py-0.5 rounded ${sc[p.status] || "bg-gray-700 text-gray-300"}">${p.status}</span>
          <span class="text-xs text-gray-500">${p.topic || ""}</span>
          ${p.model ? `<span class="text-xs text-gray-600">${p.model}</span>` : ""}
        </div>
        <div class="flex gap-1">
          ${channelBadge("T", ch.threads)}
          ${channelBadge("X", ch.x)}
        </div>
      </div>
      ${isEditing ? `
        <textarea id="edit-textarea" class="w-full bg-gray-800 text-gray-200 text-sm p-2 rounded border border-gray-700 mb-2" rows="4">${esc(p.text)}</textarea>
        <div class="flex gap-2"><button data-save="${p.id}" class="px-2 py-1 text-xs bg-blue-600 text-white rounded">Save</button><button data-cancel-edit class="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button></div>
      ` : `<p class="text-sm text-gray-200 mb-2 whitespace-pre-wrap">${esc(p.text)}</p>`}
      ${p.hashtags?.length ? `<div class="flex gap-1 mb-2">${p.hashtags.map(h => `<span class="text-xs text-blue-400">#${h}</span>`).join("")}</div>` : ""}
      ${p.engagement?.views != null ? `<div class="flex gap-4 text-xs text-gray-500"><span>views: ${p.engagement.views}</span><span>likes: ${p.engagement.likes || 0}</span><span>replies: ${p.engagement.replies || 0}</span></div>` : ""}
      <div class="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
        ${p.generatedAt ? `<span>생성: ${fmtDate(p.generatedAt)}</span>` : ""}
        ${p.approvedAt ? `<span>승인: ${fmtDate(p.approvedAt)}</span>` : ""}
        ${p.scheduledAt && p.status === "approved" ? `<span class="text-blue-400">발행예정: ${fmtDate(p.scheduledAt)}</span>` : ""}
        ${p.publishedAt ? `<span class="text-green-400">발행: ${fmtDate(p.publishedAt)}</span>` : ""}
      </div>
      <div class="flex gap-2 mt-2">
        ${p.status === "draft" ? `<button data-approve="${p.id}" class="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve</button><button data-edit="${p.id}" class="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Edit</button>` : ""}
        ${p.status !== "published" ? `<button data-delete="${p.id}" class="px-2 py-1 text-xs bg-red-900/50 text-red-300 rounded hover:bg-red-800">Delete</button>` : ""}
      </div>
    </div>`;
}

function renderAnalytics() {
  const a = S.analytics;
  if (!a) return `<p class="text-gray-500">Loading...</p>`;
  const s = a.summary || {};
  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">${card("Published", s.totalPublished)}${card("Views", s.totalViews)}${card("Avg Views", s.avgViews)}${card("Avg Likes", s.avgLikes)}</div>
    ${Object.keys(a.topics || {}).length ? `<div class="card p-4 mb-6"><h3 class="text-xs font-medium text-gray-400 mb-3">Topic Performance</h3>
      <table class="w-full text-sm"><thead><tr class="text-[10px] text-gray-500 uppercase"><th class="text-left py-1">Topic</th><th class="text-right py-1">Posts</th><th class="text-right py-1">Avg Views</th><th class="text-right py-1">Avg Likes</th></tr></thead>
      <tbody>${Object.entries(a.topics).map(([t, s]) => `<tr class="border-t border-gray-800/50"><td class="text-gray-200 py-1">${esc(t)}</td><td class="text-gray-400 text-right py-1">${s.count}</td><td class="text-gray-400 text-right py-1">${s.avgViews || 0}</td><td class="text-gray-400 text-right py-1">${s.avgLikes || 0}</td></tr>`).join("")}</tbody></table></div>` : ""}`;
}

function renderGrowth() {
  if (!S.growth.length) return `<p class="text-gray-600 text-sm">No growth data</p>`;
  return `<div class="card p-4"><h3 class="text-xs font-medium text-gray-400 mb-3">Follower History</h3>
    <div class="space-y-1">${S.growth.slice(-14).map(r => `<div class="flex justify-between text-xs border-b border-gray-800/50 py-1"><span class="text-gray-300">${r.date}</span><span class="text-gray-200">${r.followers}</span><span class="${r.delta >= 0 ? "text-green-400" : "text-red-400"}">${r.delta >= 0 ? "+" : ""}${r.delta}</span></div>`).join("")}</div></div>`;
}

function renderPopular() {
  return `<div class="space-y-3">${S.popular.map(p => `
    <div class="card p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs px-2 py-0.5 rounded bg-purple-900/50 text-purple-300">${p.source || "unknown"}</span>
        ${p.type ? `<span class="text-xs px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300">${p.type}</span>` : ""}
        ${p.likes && p.likes !== "0" ? `<span class="text-xs text-yellow-500">${p.likes} likes</span>` : ""}
      </div>
      <p class="text-sm text-gray-200 whitespace-pre-wrap">${esc(p.text || "")}</p>
    </div>
  `).join("") || `<p class="text-gray-600 text-sm">No popular posts</p>`}</div>`;
}

// ── Per-Channel Settings ──
function renderChannelSettings(channel) {
  const s = S.settings || {};
  const row = (key, label, desc) => `
    <div class="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
      <div><p class="text-xs text-gray-300">${label}</p><p class="text-[10px] text-gray-600">${desc}</p></div>
      <input id="setting-${key}" type="number" value="${s[key] ?? ""}" min="0" class="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 text-right">
    </div>`;

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4"><h3 class="text-sm font-medium text-gray-300">Automation</h3><button id="save-settings" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button></div>
        ${row("viralThreshold", "Viral Threshold", "터진 글 기준 views")}
        ${row("draftsPerBatch", "Drafts per Batch", "배치당 생성 개수")}
        ${row("publishIntervalHours", "Publish Interval", "발행 간격 (시간)")}
        ${row("insightsIntervalHours", "Insights Interval", "반응 수집 간격 (시간)")}
        ${row("insightsMaxCollections", "Max Collections", "최대 반응 수집 횟수")}
        ${row("minLikes", "Min Likes", "외부 인기글 최소 좋아요")}
        ${row("searchDays", "Search Days", "검색 기간 (일)")}
        ${row("maxPopularPosts", "Max Popular Posts", "인기글 최대 보관 수")}
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3"><h3 class="text-sm font-medium text-gray-300">Content Guide</h3><button id="save-guide" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button></div>
        <p class="text-[10px] text-gray-600 mb-2">AI가 글 생성할 때 참고하는 톤/타겟/유형 가이드</p>
        <textarea id="guide-textarea" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 font-mono" rows="12">${esc(S.guide)}</textarea>
      </div>
      <div class="card p-5 col-span-2">
        <div class="flex items-center justify-between mb-3"><h3 class="text-sm font-medium text-gray-300">Search Keywords</h3><button id="save-keywords" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button></div>
        <textarea id="keywords-textarea" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300" rows="6">${S.keywords.join("\n")}</textarea>
      </div>
    </div>`;
}

// ── X Channel Page ──
function renderChannelX() {
  const connected = S.channelConfig.x?.connected;
  const tabs = connected ? ["queue", "analytics", "settings"] : ["settings"];
  return `<div class="px-8 py-6">
    <button data-nav="overview" class="text-gray-500 hover:text-gray-300 text-sm mb-1">&larr; Back</button>
    <div class="flex items-center gap-3 mb-6">
      <span class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-white">X</span>
      <div><h2 class="text-xl font-semibold text-white">X (Twitter)</h2><p class="text-xs text-gray-500">${connected ? "Connected" : "Not connected"}</p></div>
    </div>
    <div class="flex gap-1 mb-6 border-b border-gray-800/50 pb-3">
      ${tabs.map(t => `<button data-subtab="${t}" class="px-3 py-1.5 text-sm rounded ${S.subTab === t ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`).join("")}
    </div>
    ${S.subTab === "queue" && connected ? renderQueue() : ""}
    ${S.subTab === "analytics" && connected ? renderAnalytics() : ""}
    ${S.subTab === "settings" ? renderXSettings() : ""}
  </div>`;
}

function renderXSettings() {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">X API Credentials</h3>
        <div class="space-y-3">
          <div><label class="text-xs text-gray-500 block mb-1">API Key</label><input id="x-apiKey" type="text" placeholder="Enter API Key" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600"></div>
          <div><label class="text-xs text-gray-500 block mb-1">API Key Secret</label><input id="x-apiKeySecret" type="password" placeholder="Enter API Key Secret" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600"></div>
          <div><label class="text-xs text-gray-500 block mb-1">Access Token</label><input id="x-accessToken" type="text" placeholder="Enter Access Token" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600"></div>
          <div><label class="text-xs text-gray-500 block mb-1">Access Token Secret</label><input id="x-accessTokenSecret" type="password" placeholder="Enter Access Token Secret" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600"></div>
        </div>
        <button id="save-x-config" class="w-full mt-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${S.channelConfig.x?.connected ? "Update Credentials" : "Connect X Account"}</button>
        <p class="text-[10px] text-gray-600 mt-3 text-center">Get credentials at developer.x.com</p>
      </div>
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">X Channel Info</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">Status</span><span class="${S.channelConfig.x?.connected ? "text-green-400" : "text-yellow-400"}">${S.channelConfig.x?.connected ? "Connected" : "Not connected"}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Character Limit</span><span class="text-gray-300">280</span></div>
          <div class="flex justify-between"><span class="text-gray-500">API Plan</span><span class="text-gray-300">Basic ($100/mo) required</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Auth Method</span><span class="text-gray-300">OAuth 1.0a</span></div>
        </div>
      </div>
    </div>`;
}

// ── Settings Page (Channel Connections) ──
function renderSettings() {
  return `<div class="px-8 py-6">
    <h2 class="text-xl font-semibold text-white mb-1">Settings</h2>
    <p class="text-sm text-gray-500 mb-6">Channel connections & system status</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">Connected Channels</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 cursor-pointer hover:bg-gray-800/50" data-nav="threads">
            <div class="flex items-center gap-3"><span class="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[8px] font-bold text-white">T</span><div><p class="text-xs text-gray-300">Threads</p><p class="text-[10px] text-gray-600">${S.channelConfig.threads?.userId ? "ID: " + S.channelConfig.threads.userId : ""}</p></div></div>
            <span class="text-[10px] ${S.channelConfig.threads?.connected ? "text-green-400" : "text-gray-600"}">${S.channelConfig.threads?.connected ? "Connected" : "Not connected"}</span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 cursor-pointer hover:bg-gray-800/50" data-nav="x">
            <div class="flex items-center gap-3"><span class="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[9px] font-bold text-white">X</span><div><p class="text-xs text-gray-300">X (Twitter)</p><p class="text-[10px] text-gray-600">${S.channelConfig.x?.connected ? "OAuth 1.0a" : "Setup required"}</p></div></div>
            <span class="text-[10px] ${S.channelConfig.x?.connected ? "text-green-400" : "text-yellow-400"}">${S.channelConfig.x?.connected ? "Connected" : "Setup"}</span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 opacity-50">
            <div class="flex items-center gap-3"><span class="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-500">IG</span><div><p class="text-xs text-gray-500">Instagram</p></div></div>
            <span class="text-[10px] text-gray-700">Coming soon</span>
          </div>
        </div>
        <p class="text-[10px] text-gray-600 mt-4">Click a channel to manage its settings</p>
      </div>
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">System Status</h3>
        <div class="space-y-2.5">
          ${S.cronJobs.map(j => {
            const dot = j.lastStatus === "ok" ? "bg-green-500" : j.lastStatus === "error" ? "bg-red-500" : "bg-gray-600";
            return `<div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full ${dot}"></div><span class="text-xs text-gray-300">${esc(j.name)}</span></div><span class="text-[10px] text-gray-500">${j.lastStatus === "error" ? '<span class="text-red-400">error</span>' : fmtTime(j.nextRunAt)}</span></div>`;
          }).join("")}
        </div>
      </div>
    </div>
  </div>`;
}

// ── Event Binding ──
function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach(el => { el.onclick = () => navigate(el.dataset.nav); });
  document.querySelectorAll("[data-subtab]").forEach(el => { el.onclick = () => { S.subTab = el.dataset.subtab; switchSubTab(el.dataset.subtab); }; });
  document.querySelectorAll("[data-filter]").forEach(el => { el.onclick = () => { S.queueFilter = el.dataset.filter; loadQueue(S.queueFilter); }; });
  document.querySelectorAll("[data-approve]").forEach(el => { el.onclick = () => approvePost(el.dataset.approve); });
  document.querySelectorAll("[data-edit]").forEach(el => { el.onclick = () => { S.editingPost = el.dataset.edit; render(); }; });
  document.querySelectorAll("[data-save]").forEach(el => { el.onclick = () => { const ta = document.getElementById("edit-textarea"); if (ta) updatePost(el.dataset.save, ta.value); }; });
  document.querySelectorAll("[data-cancel-edit]").forEach(el => { el.onclick = () => { S.editingPost = null; render(); }; });
  document.querySelectorAll("[data-delete]").forEach(el => { el.onclick = () => deletePost(el.dataset.delete); });
  document.querySelectorAll("[data-select]").forEach(el => { el.onchange = () => { if (el.checked) S.selectedIds.add(el.dataset.select); else S.selectedIds.delete(el.dataset.select); render(); }; });

  const selectAllBtn = document.getElementById("select-all");
  if (selectAllBtn) selectAllBtn.onchange = toggleSelectAll;
  const bulkBtn = document.getElementById("bulk-approve");
  if (bulkBtn) bulkBtn.onclick = bulkApprove;
  const bulkDelBtn = document.getElementById("bulk-delete");
  if (bulkDelBtn) bulkDelBtn.onclick = bulkDelete;

  const saveSt = document.getElementById("save-settings");
  if (saveSt) saveSt.onclick = async () => {
    const fields = ["viralThreshold", "minLikes", "searchDays", "draftsPerBatch", "publishIntervalHours"];
    const u = {}; fields.forEach(f => { const el = document.getElementById(`setting-${f}`); if (el) u[f] = parseInt(el.value, 10) || 0; });
    const r = await API.post("/api/settings", u);
    if (r) { showToast("설정 저장됨", "success"); loadSettings(); }
  };

  const saveGd = document.getElementById("save-guide");
  if (saveGd) saveGd.onclick = async () => {
    const ta = document.getElementById("guide-textarea");
    if (ta) { const r = await API.post("/api/guide", { guide: ta.value }); if (r) showToast("가이드 저장됨", "success"); }
  };

  const saveKw = document.getElementById("save-keywords");
  if (saveKw) saveKw.onclick = async () => {
    const ta = document.getElementById("keywords-textarea");
    if (ta) { const kw = ta.value.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#")); const r = await API.post("/api/keywords", { keywords: kw }); if (r) showToast("키워드 저장됨", "success"); }
  };

  const saveX = document.getElementById("save-x-config");
  if (saveX) saveX.onclick = async () => {
    const data = {};
    ["apiKey", "apiKeySecret", "accessToken", "accessTokenSecret"].forEach(k => { const el = document.getElementById("x-" + k); if (el?.value) data[k] = el.value; });
    const r = await API.post("/api/channel-config/x", data);
    if (r) { showToast(r.enabled ? "X 연결 완료!" : "저장됨", "success"); loadOverview(); }
  };
}

function navigate(page) {
  S.page = page;
  if (page === "overview") loadOverview();
  else if (page === "threads") { S.subTab = "queue"; loadQueue(S.queueFilter); loadGrowth(); }
  else if (page === "x") { S.subTab = S.channelConfig.x?.connected ? "queue" : "settings"; loadOverview(); }
  else if (page === "settings") { loadSettings(); loadKeywords(); }
  render();
}

function switchSubTab(tab) {
  if (tab === "queue") loadQueue(S.queueFilter);
  else if (tab === "analytics") loadAnalytics();
  else if (tab === "growth") loadGrowth();
  else if (tab === "popular") loadPopular();
  else if (tab === "settings") { loadSettings(); loadKeywords(); }
  render();
}

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  loadOverview();
  render();
});
