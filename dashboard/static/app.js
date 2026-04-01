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

// ── Auth ──
function getAuthToken() { return localStorage.getItem("dashboard_auth_token") || ""; }
function setAuthToken(t) { localStorage.setItem("dashboard_auth_token", t); }
function authHeaders() {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
function promptLogin() {
  document.getElementById("app").innerHTML = `
    <div class="flex items-center justify-center min-h-screen">
      <div class="card p-8 w-80">
        <h2 class="text-lg font-bold text-white mb-4">Dashboard Login</h2>
        <input id="login-token" type="password" placeholder="Auth Token"
          class="w-full bg-gray-800 text-gray-200 text-sm p-3 rounded border border-gray-700 mb-3">
        <button id="login-btn" class="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">Login</button>
      </div>
    </div>`;
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.innerHTML = "";
  setTimeout(() => {
    const input = document.getElementById("login-token");
    const btn = document.getElementById("login-btn");
    const doLogin = () => { if (input.value.trim()) { setAuthToken(input.value.trim()); location.reload(); } };
    if (btn) btn.onclick = doLogin;
    if (input) { input.focus(); input.onkeydown = (e) => { if (e.key === "Enter") doLogin(); }; }
  }, 0);
}

const API = {
  async get(url) {
    try {
      const res = await fetch(url, { headers: authHeaders() });
      if (res.status === 401) { localStorage.removeItem("dashboard_auth_token"); promptLogin(); return null; }
      if (!res.ok) { showToast(`요청 실패: ${res.status}`, "error"); return null; }
      return res.json();
    } catch (e) { showToast(`네트워크 오류: ${e.message}`, "error"); return null; }
  },
  async post(url, body) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) });
      if (res.status === 401) { localStorage.removeItem("dashboard_auth_token"); promptLogin(); return null; }
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
  channelConfig: { threads: {}, x: {} }, images: [], blogQueue: [],
  tokenStatus: null,
  channelSettings: { features: [], settings: {} }, cronRuns: [],
  queueFilter: "all", loading: false,
  editingPost: null, selectedIds: new Set(), imagePickerPostId: null, expandedFeature: null,
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
async function updatePost(id, payload) { const r = await API.post(`/api/queue/${id}/update`, payload); if (r) { showToast("수정 완료", "success"); S.editingPost = null; loadQueue(S.queueFilter); } }
async function updatePostImage(id, imageUrl) { const r = await API.post(`/api/queue/${id}/update`, { imageUrl }); if (r) { showToast(imageUrl ? "이미지 첨부됨" : "이미지 제거됨", "success"); S.imagePickerPostId = null; loadQueue(S.queueFilter); } }
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
  else if (S.page === "images") app.innerHTML = renderImages();
  else if (S.page === "blog") app.innerHTML = renderBlog();
  else if (S.page === "settings") app.innerHTML = renderSettings();
  bindEvents();
  const oldModal = document.getElementById("image-picker-overlay");
  if (oldModal) oldModal.remove();
  if (S.imagePickerPostId) {
    app.insertAdjacentHTML("beforeend", renderImagePickerModal());
    bindImagePickerEvents();
  }
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
        <div class="flex items-center gap-2">
          <h1 class="text-base font-semibold text-white tracking-tight">Marketing Hub</h1>
          <a href="https://www.threads.net/@code_zero_to_one" target="_blank" rel="noopener" class="text-gray-500 hover:text-white transition-colors" title="Threads">
            <svg width="14" height="14" viewBox="0 0 192 192" fill="currentColor"><path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.398c-15.09 0-27.701 6.494-35.174 18.033l12.626 8.657c5.58-8.432 14.39-11.18 22.55-11.18h.27c8.736.054 15.322 2.593 19.58 7.543 3.098 3.603 5.17 8.564 6.207 14.88a84.463 84.463 0 0 0-24.478-2.26c-28.04 1.588-46.072 17.2-44.828 38.823.636 11.06 6.348 20.587 16.087 26.834 8.235 5.286 18.852 7.87 29.884 7.273 14.566-.787 25.993-6.395 33.99-16.672 6.075-7.806 9.977-17.782 11.756-30.168 7.057 4.26 12.3 9.848 15.287 16.7 5.07 11.637 5.367 30.735-10.4 46.483-13.836 13.81-30.477 19.782-52.477 19.958-24.416-.195-42.862-7.988-54.83-23.16C39.32 152.595 32.87 132.376 32.66 108c.21-24.376 6.66-44.595 19.176-60.082C63.795 32.633 82.24 24.84 106.657 24.645c24.584.2 43.285 8.028 55.573 23.273 6.028 7.482 10.575 16.644 13.584 27.283l14.868-3.936c-3.538-12.496-8.96-23.379-16.234-32.409C159.396 20.263 137.058 10.812 106.717 10.6h-.078C76.322 10.812 54.282 20.316 39.52 39.13 23.478 59.546 15.375 86.757 15.13 108l.002.283c.245 21.243 8.348 48.454 24.39 68.87 14.762 18.814 36.802 28.318 67.143 28.53h.078c26.006-.2 46.643-8.082 63.29-24.163 22.095-21.358 21.478-47.567 14.568-63.42-4.954-11.377-14.452-20.548-27.064-26.112z"/></svg>
          </a>
        </div>
        <p class="text-xs text-gray-500 mt-0.5">openclaw-auto</p>
      </div>
      <nav class="flex-1 py-3">
        <div class="px-3 mb-2"><span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Overview</span></div>
        ${items.map(i => `
          <button data-nav="${i.page}" class="sidebar-item ${S.page === i.page ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3">
            <span class="text-gray-500">${i.icon}</span> ${i.label}
          </button>
        `).join("")}

        <div class="px-3 mt-5 mb-2"><span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Social</span></div>
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
        ${["Instagram", "Facebook", "LinkedIn", "Bluesky", "TikTok"].map(ch => `
          <div class="px-4 py-1.5 text-sm text-gray-700 flex items-center gap-3 opacity-40">
            <span class="w-4 h-4 rounded bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-600">${ch[0]}</span>
            ${ch} <span class="ml-auto text-[9px] text-gray-800">Soon</span>
          </div>`).join("")}

        <div class="px-3 mt-4 mb-2"><span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Blog & SEO</span></div>
        <button data-nav="blog" class="sidebar-item ${S.page === "blog" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3">
          <span class="w-4 h-4 rounded bg-gray-800 flex items-center justify-center text-[9px] font-bold text-gray-400">B</span>
          Blog
        </button>
        ${["Naver Blog", "Medium"].map(ch => `
          <div class="px-4 py-1.5 text-sm text-gray-700 flex items-center gap-3 opacity-40">
            <span class="w-4 h-4 rounded bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-600">${ch[0]}</span>
            ${ch} <span class="ml-auto text-[9px] text-gray-800">Soon</span>
          </div>`).join("")}

        <div class="px-3 mt-4 mb-2"><span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Messaging</span></div>
        ${["Kakao Channel", "Telegram", "LINE", "Discord", "WhatsApp"].map(ch => `
          <div class="px-4 py-1.5 text-sm text-gray-700 flex items-center gap-3 opacity-40">
            <span class="w-4 h-4 rounded bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-600">${ch[0]}</span>
            ${ch} <span class="ml-auto text-[9px] text-gray-800">Soon</span>
          </div>`).join("")}

        <div class="px-3 mt-4 mb-2"><span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Local & Business</span></div>
        ${["Google Business", "Pinterest", "YouTube", "Tumblr"].map(ch => `
          <div class="px-4 py-1.5 text-sm text-gray-700 flex items-center gap-3 opacity-40">
            <span class="w-4 h-4 rounded bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-600">${ch[0]}</span>
            ${ch} <span class="ml-auto text-[9px] text-gray-800">Soon</span>
          </div>`).join("")}

        <div class="px-3 mt-5 mb-2"><span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Assets</span></div>
        <button data-nav="images" class="sidebar-item ${S.page === "images" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Images
          <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500">${S.images.length}</span>
        </button>

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
      ${p.imageUrl ? `
        <div class="mb-2 relative group/img" style="max-width:480px">
          <img src="${esc(p.imageUrl)}" alt="Post image" class="w-full rounded-lg border border-gray-800" style="display:block">
          ${p.status === "draft" ? `<button data-remove-image="${p.id}" class="absolute top-2 right-2 p-1 bg-red-900/80 rounded text-red-300 hover:text-white opacity-0 group-hover/img:opacity-100 transition-opacity" title="이미지 제거">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>` : ""}
        </div>
      ` : ""}
      ${isEditing ? `
        <textarea id="edit-textarea" class="w-full bg-gray-800 text-gray-200 text-sm p-2 rounded border border-gray-700 mb-2" rows="4">${esc(p.text)}</textarea>
        <div class="flex gap-2">
          <button data-save="${p.id}" class="px-2 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
          <button data-cancel-edit class="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>
          <button data-pick-image="${p.id}" class="px-2 py-1 text-xs bg-purple-700 text-white rounded hover:bg-purple-600">${p.imageUrl ? "Change Image" : "Add Image"}</button>
        </div>
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
        ${p.status === "draft" ? `<button data-approve="${p.id}" class="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve</button><button data-edit="${p.id}" class="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Edit</button><button data-pick-image="${p.id}" class="px-2 py-1 text-xs bg-purple-900/50 text-purple-300 rounded hover:bg-purple-800">Image</button>` : ""}
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
function renderThreadsCredentials() {
  const tk = S.channelConfig.threads?.keys || {};
  return `
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-300">Threads API Credentials</h3>
        <span class="text-[10px] px-2 py-0.5 rounded bg-purple-900/30 text-purple-400 border border-purple-800/30">Long-lived Token</span>
      </div>
      <div class="space-y-3 mb-3">
        ${credField("threads-accessToken", "Access Token", "", true, tk.accessToken)}
        <div class="mt-2">${credField("threads-userId", "User ID", "", false, tk.userId)}</div>
      </div>
      <button id="save-threads-config" class="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${S.channelConfig.threads?.connected ? "Update Credentials" : "Connect Threads"}</button>
    </div>
    <div class="card p-5">
      <h3 class="text-sm font-medium text-gray-300 mb-3">Threads Channel Info</h3>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-gray-500">Status</span><span class="${S.channelConfig.threads?.connected ? "text-green-400" : "text-yellow-400"}">${S.channelConfig.threads?.connected ? "Connected" : "Not connected"}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Username</span><span class="text-gray-300">${S.channelConfig.threads?.username ? "@" + S.channelConfig.threads.username : "-"}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Character Limit</span><span class="text-gray-300">500</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Token Validity</span><span class="text-gray-300">60\uc77c (\uac31\uc2e0 \ud544\uc694)</span></div>
      </div>
    </div>`;
}

function renderChannelSettings(channel) {
  const s = S.settings || {};
  const cs = (S.channelSettings.settings || {})[channel] || {};
  const features = S.channelSettings.features || [];
  const row = (key, label, desc) => `
    <div class="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
      <div><p class="text-xs text-gray-300">${label}</p><p class="text-[10px] text-gray-600">${desc}</p></div>
      <input id="setting-${key}" type="number" value="${s[key] ?? ""}" min="0" class="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 text-right">
    </div>`;

  const featureToCron = {
    content_generation: "threads-generate-drafts",
    auto_publish: "threads-auto-publish",
    insights_collection: "threads-collect-insights",
    auto_like_replies: "threads-collect-insights",
    low_engagement_cleanup: "threads-collect-insights",
    trending_collection: "threads-fetch-trending",
    follower_tracking: "threads-track-growth",
    trending_rewrite: "threads-rewrite-trending",
  };
  function runsFor(featureKey) {
    const cronName = featureToCron[featureKey];
    if (!cronName) return [];
    return S.cronRuns.filter(r => r.jobName === cronName);
  }
  function cronInterval(featureKey) {
    const cronName = featureToCron[featureKey];
    if (!cronName) return null;
    const job = S.cronJobs.find(j => j.id === cronName);
    return job?.everyMs ? Math.round(job.everyMs / 3600000) : null;
  }
  // features that share a cron — only first one shows interval editor
  const shownCronEditors = new Set();

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${channel === "threads" ? renderThreadsCredentials() : ""}
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">Automation</h3>
        ${features.map(f => {
          const runs = runsFor(f.key);
          const run = runs[0] || null;
          const sc = run ? (run.status === "ok" ? "text-green-400" : "text-red-400") : "";
          const ago = run?.finishedAt ? fmtAgo(new Date(run.finishedAt).toISOString()) : "";
          const expanded = S.expandedFeature === f.key;
          const hours = cronInterval(f.key);
          const cronName = featureToCron[f.key];
          const showInterval = cronName && !shownCronEditors.has(cronName);
          if (cronName) shownCronEditors.add(cronName);
          return `
          <div class="border-b border-gray-800/50 last:border-0">
            <div class="flex items-center gap-3 py-2.5 cursor-pointer" onclick="toggleFeatureDetail('${f.key}')">
              <label class="relative inline-flex items-center cursor-pointer shrink-0" onclick="event.stopPropagation()">
                <input type="checkbox" data-feature-toggle="${f.key}" data-channel="${channel}" ${cs[f.key] ? "checked" : ""} class="sr-only peer">
                <div class="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-300">${f.label}</span>
                  ${hours ? `<span class="text-[10px] text-gray-600">${hours}h</span>` : ""}
                  ${run ? `<span class="text-[10px] ${sc}">${run.status === "ok" ? "&#10003;" : "&#10007;"}</span><span class="text-[10px] text-gray-600">${ago}</span>` : ""}
                  ${runs.length || hours ? `<svg class="w-3 h-3 text-gray-600 ml-auto transition-transform ${expanded ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>` : ""}
                </div>
                <p class="text-[10px] text-gray-600">${f.description}</p>
              </div>
            </div>
            ${expanded ? `
              <div class="ml-12 mb-3 space-y-1.5">
                ${showInterval && hours ? `
                  <div class="flex items-center gap-2 py-1.5 px-2 bg-gray-900/50 rounded mb-2" onclick="event.stopPropagation()">
                    <span class="text-[10px] text-gray-400">Interval</span>
                    <select data-cron-interval="${cronName}" class="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-300">
                      ${[1,2,3,4,6,8,12,24,48,168].map(h => `<option value="${h}" ${h === hours ? "selected" : ""}>${h < 24 ? h + "h" : h === 24 ? "1d" : h === 48 ? "2d" : "7d"}</option>`).join("")}
                    </select>
                  </div>
                ` : ""}
                ${runs.slice(0, 10).map(r => `
                  <div class="flex items-start gap-2 py-1">
                    <span class="text-[10px] mt-0.5 ${r.status === "ok" ? "text-green-400" : "text-red-400"}">${r.status === "ok" ? "&#10003;" : "&#10007;"}</span>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] text-gray-500">${r.finishedAt ? new Date(r.finishedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : ""}</span>
                        <span class="text-[10px] text-gray-700">${r.model || ""}</span>
                        <span class="text-[10px] text-gray-700 ml-auto">${Math.round(r.durationMs / 1000)}s</span>
                      </div>
                      <p class="text-[10px] text-gray-500 break-words">${esc(r.summary)}</p>
                    </div>
                  </div>
                `).join("")}
              </div>
            ` : ""}
          </div>`;
        }).join("")}
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4"><h3 class="text-sm font-medium text-gray-300">Parameters</h3><button id="save-settings" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button></div>
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

function credField(id, label, desc, isSecret = false, fullValue = "") {
  return `<div>
    <label class="text-xs text-gray-400 block mb-0.5">${label} ${desc ? `<span class="text-gray-600">${desc}</span>` : ""}</label>
    <div class="relative">
      <input id="${id}" type="${isSecret ? "password" : "text"}" value="${esc(fullValue)}" placeholder="${label}" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 pr-16 text-sm text-gray-300 placeholder-gray-600 font-mono">
      ${isSecret ? `<button type="button" data-toggle-vis="${id}" class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-300">Show</button>` : ""}
    </div>
  </div>`;
}

function renderXSettings() {
  const connected = S.channelConfig.x?.connected;
  const k = S.channelConfig.x?.keys || {};
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-300">OAuth 1.0 Keys</h3>
          <span class="text-[10px] px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-800/30">OAuth 1.0a</span>
        </div>
        <div class="p-2 rounded bg-yellow-900/20 border border-yellow-800/20 mb-4">
          <p class="text-[10px] text-yellow-400/80">X Developer Portal > <strong>Keys and tokens</strong> > OAuth 1.0 \uc139\uc158. OAuth 2.0 Client ID/Secret\uc740 \uc0ac\uc6a9\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.</p>
        </div>
        <div class="space-y-4">
          <div class="border-b border-gray-800/50 pb-3">
            <p class="text-[10px] text-gray-500 uppercase tracking-wide mb-2">\uc18c\ube44\uc790 \ud0a4 (Consumer Keys)</p>
            ${credField("x-apiKey", "\uc18c\ube44\uc790 \ud0a4 (API Key)", "", false, k.apiKey)}
            <div class="mt-2">${credField("x-apiKeySecret", "\uc18c\ube44\uc790 \uc2dc\ud06c\ub9bf (API Key Secret)", "", true, k.apiKeySecret)}</div>
          </div>
          <div>
            <p class="text-[10px] text-gray-500 uppercase tracking-wide mb-2">\uc561\uc138\uc2a4 \ud1a0\ud070 (Access Token)</p>
            ${credField("x-accessToken", "\uc561\uc138\uc2a4 \ud1a0\ud070 (Access Token)", "", false, k.accessToken)}
            <div class="mt-2">${credField("x-accessTokenSecret", "\uc561\uc138\uc2a4 \ud1a0\ud070 \uc2dc\ud06c\ub9bf (Access Token Secret)", "", true, k.accessTokenSecret)}</div>
          </div>
        </div>
        <button id="save-x-config" class="w-full mt-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${connected ? "Update Credentials" : "Connect X Account"}</button>
      </div>
      <div class="space-y-4">
        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-3">X Channel Info</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Status</span><span class="${connected ? "text-green-400" : "text-yellow-400"}">${connected ? "Connected" : "Not connected"}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Character Limit</span><span class="text-gray-300">280</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Auth Method</span><span class="text-gray-300">OAuth 1.0a (User Context)</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Permission</span><span class="text-gray-300">Read and Write \ud544\uc218</span></div>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-3">Setup Guide</h3>
          <ol class="text-[10px] text-gray-400 space-y-1.5 list-decimal list-inside">
            <li><a href="https://developer.x.com" target="_blank" class="text-blue-400 hover:underline">developer.x.com</a> > Dashboard > Create App</li>
            <li>App Settings > <strong class="text-gray-300">User authentication settings</strong> > Edit
              <div class="ml-4 mt-0.5 text-gray-500">- App permissions: <strong class="text-gray-300">Read and write</strong><br>- Type of App: Web App<br>- Website URL: https://example.com<br>- Callback URL: https://example.com/callback</div>
            </li>
            <li>Keys and tokens > <strong class="text-gray-300">\uc18c\ube44\uc790 \ud0a4</strong> > \uc7ac\uc0dd\uc131 > Key + Secret \ubcf5\uc0ac</li>
            <li>Keys and tokens > <strong class="text-gray-300">\uc561\uc138\uc2a4 \ud1a0\ud070</strong> > \uc0dd\uc131 (Read+Write) > Token + Secret \ubcf5\uc0ac</li>
            <li>\uc67c\ucabd \ud3fc\uc5d0 4\uac1c \ud0a4 \uc785\ub825 > Connect</li>
          </ol>
          <p class="text-[10px] text-yellow-500/70 mt-2">* \uad8c\ud55c \ubcc0\uacbd \ud6c4 \ubc18\ub4dc\uc2dc \uc561\uc138\uc2a4 \ud1a0\ud070\uc744 \uc7ac\uc0dd\uc131\ud574\uc57c \ud569\ub2c8\ub2e4</p>
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
  document.querySelectorAll("[data-save]").forEach(el => { el.onclick = () => { const ta = document.getElementById("edit-textarea"); if (ta) updatePost(el.dataset.save, { text: ta.value }); }; });
  document.querySelectorAll("[data-cancel-edit]").forEach(el => { el.onclick = () => { S.editingPost = null; render(); }; });
  document.querySelectorAll("[data-delete]").forEach(el => { el.onclick = () => deletePost(el.dataset.delete); });
  document.querySelectorAll("[data-pick-image]").forEach(el => { el.onclick = (e) => { e.stopPropagation(); S.imagePickerPostId = el.dataset.pickImage; render(); }; });
  document.querySelectorAll("[data-remove-image]").forEach(el => { el.onclick = () => updatePostImage(el.dataset.removeImage, null); });
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

  document.querySelectorAll("[data-feature-toggle]").forEach(el => {
    el.onchange = async () => {
      const key = el.dataset.featureToggle;
      const channel = el.dataset.channel;
      const r = await API.post(`/api/channel-settings/${channel}`, { [key]: el.checked });
      if (r) showToast(`${key} ${el.checked ? "ON" : "OFF"}`, "success");
    };
  });
  document.querySelectorAll("[data-cron-interval]").forEach(el => {
    el.onchange = async () => {
      const jobName = el.dataset.cronInterval;
      const hours = parseInt(el.value, 10);
      if (!confirm(`주기를 ${hours < 24 ? hours + "시간" : hours === 24 ? "1일" : hours === 48 ? "2일" : "7일"}으로 변경하시겠습니까?`)) { el.value = el.dataset.prevValue || el.value; return; }
      const r = await API.post(`/api/cron/${jobName}/interval`, { hours });
      if (r) { showToast(`주기 변경: ${hours}h`, "success"); loadOverview(); }
      else el.value = el.dataset.prevValue || el.value;
    };
    el.dataset.prevValue = el.value;
  });

  // Show/Hide toggle for credential fields
  document.querySelectorAll("[data-toggle-vis]").forEach(el => {
    el.onclick = () => {
      const input = document.getElementById(el.dataset.toggleVis);
      if (input) { const show = input.type === "password"; input.type = show ? "text" : "password"; el.textContent = show ? "Hide" : "Show"; }
    };
  });

  // Threads credential save
  const saveThreads = document.getElementById("save-threads-config");
  if (saveThreads) saveThreads.onclick = async () => {
    const data = {};
    const at = document.getElementById("threads-accessToken");
    const uid = document.getElementById("threads-userId");
    if (at?.value) data.accessToken = at.value;
    if (uid?.value) data.userId = uid.value;
    const r = await API.post("/api/channel-config/threads", data);
    if (r) { showToast("Threads 설정 저장됨", "success"); loadOverview(); }
  };

  const saveX = document.getElementById("save-x-config");
  if (saveX) saveX.onclick = async () => {
    const data = {};
    ["apiKey", "apiKeySecret", "accessToken", "accessTokenSecret"].forEach(k => { const el = document.getElementById("x-" + k); if (el?.value) data[k] = el.value; });
    const r = await API.post("/api/channel-config/x", data);
    if (r) { showToast(r.enabled ? "X 연결 완료!" : "저장됨", "success"); loadOverview(); }
  };

  // Blog actions
  document.querySelectorAll("[data-blog-approve]").forEach(el => { el.onclick = () => approveBlogPost(el.dataset.blogApprove); });
  document.querySelectorAll("[data-blog-delete]").forEach(el => { el.onclick = () => deleteBlogPost(el.dataset.blogDelete); });
}

function navigate(page) {
  S.page = page;
  if (page === "overview") loadOverview();
  else if (page === "threads") { S.subTab = "queue"; loadQueue(S.queueFilter); loadGrowth(); loadImages(); }
  else if (page === "x") { S.subTab = S.channelConfig.x?.connected ? "queue" : "settings"; loadOverview(); }
  else if (page === "images") loadImages();
  else if (page === "blog") loadBlogQueue();
  else if (page === "settings") { loadSettings(); loadKeywords(); }
  render();
}

function switchSubTab(tab) {
  if (tab === "queue") { loadQueue(S.queueFilter); loadImages(); }
  else if (tab === "analytics") loadAnalytics();
  else if (tab === "growth") loadGrowth();
  else if (tab === "popular") loadPopular();
  else if (tab === "settings") { loadSettings(); loadKeywords(); loadChannelSettings(); loadCronRuns(); }
  render();
}

// ── Channel Settings & Cron Runs ──
function toggleFeatureDetail(key) { S.expandedFeature = S.expandedFeature === key ? null : key; render(); }
async function loadChannelSettings() {
  const data = await API.get("/api/channel-settings");
  if (data) { S.channelSettings = data; render(); }
}
async function loadCronRuns() {
  const data = await API.get("/api/cron-runs");
  if (data) { S.cronRuns = data.runs || []; render(); }
}

// ── Image Picker Modal ──
function renderImagePickerModal() {
  if (!S.imagePickerPostId) return "";
  const post = S.queue.find(p => p.id === S.imagePickerPostId);
  return `
    <div id="image-picker-overlay" class="fixed inset-0 z-40 bg-black/70 flex items-center justify-center" style="backdrop-filter:blur(4px)">
      <div class="card p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Select Image</h3>
          <button id="close-image-picker" class="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>
        <div class="mb-4 p-3 rounded-lg border border-gray-800 bg-gray-900/50">
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span class="text-xs text-gray-300">Generate New</span>
          </div>
          <div class="flex gap-2">
            <input id="image-gen-prompt" type="text" placeholder="이미지 설명 (예: AI와 협업하는 개발자 일러스트)" class="flex-1 bg-gray-800 text-gray-200 text-xs p-2 rounded border border-gray-700">
            <button id="image-gen-btn" class="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 shrink-0">Generate</button>
          </div>
          <div id="image-gen-status" class="hidden mt-2 text-[10px] text-gray-500"></div>
        </div>
        ${post?.imageUrl ? `<button data-select-image="__remove__" class="w-full mb-4 p-3 rounded-lg border border-red-800/50 bg-red-900/20 text-red-300 text-sm hover:bg-red-900/40">Remove current image</button>` : ""}
        ${S.images.length === 0 ? `<p class="text-gray-500 text-sm text-center py-8">No images available. Generate one above or upload images to data/images/</p>` : `
          <div class="grid grid-cols-3 gap-3">
            ${S.images.map(img => `
              <div data-select-image="${esc(img.url)}" class="cursor-pointer rounded-lg border overflow-hidden transition-colors ${post?.imageUrl === img.url ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-800 hover:border-blue-500"}">
                <div class="aspect-square bg-gray-900"><img src="${esc(img.url)}" class="w-full h-full object-cover" loading="lazy"></div>
                <div class="p-2"><p class="text-[10px] text-gray-400 truncate">${esc(img.filename)}</p></div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    </div>`;
}

function bindImagePickerEvents() {
  const close = document.getElementById("close-image-picker");
  if (close) close.onclick = () => { S.imagePickerPostId = null; render(); };
  const overlay = document.getElementById("image-picker-overlay");
  if (overlay) overlay.onclick = (e) => { if (e.target === overlay) { S.imagePickerPostId = null; render(); } };
  document.querySelectorAll("[data-select-image]").forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const url = el.dataset.selectImage;
      updatePostImage(S.imagePickerPostId, url === "__remove__" ? null : url);
    };
  });
  const genBtn = document.getElementById("image-gen-btn");
  const genInput = document.getElementById("image-gen-prompt");
  const genStatus = document.getElementById("image-gen-status");
  if (genBtn && genInput) {
    const doGenerate = async () => {
      const prompt = genInput.value.trim();
      if (!prompt) { genInput.focus(); return; }
      genBtn.disabled = true;
      genBtn.textContent = "Generating...";
      if (genStatus) { genStatus.classList.remove("hidden"); genStatus.textContent = "AI 이미지 생성 중... (최대 2분 소요)"; }
      try {
        const res = await fetch("/api/generate-image", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ prompt }) });
        const data = await res.json();
        if (data.success && data.image) {
          showToast("이미지 생성 완료", "success");
          await loadImages();
          updatePostImage(S.imagePickerPostId, data.image.url);
        } else {
          showToast(data.error || "이미지 생성 실패", "error");
          genBtn.disabled = false; genBtn.textContent = "Generate";
          if (genStatus) genStatus.textContent = data.error || "실패";
        }
      } catch (e) {
        showToast("이미지 생성 실패: " + e.message, "error");
        genBtn.disabled = false; genBtn.textContent = "Generate";
        if (genStatus) genStatus.textContent = e.message;
      }
    };
    genBtn.onclick = doGenerate;
    genInput.onkeydown = (e) => { if (e.key === "Enter") doGenerate(); };
  }
}

// ── Images ──
async function loadImages() {
  const data = await API.get("/api/images");
  if (data) S.images = data;
}

function fmtBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function renderImages() {
  return `<div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-white">Images</h2>
        <p class="text-sm text-gray-500 mt-1">${S.images.length}개 이미지 — AI 생성 이미지 갤러리</p>
      </div>
    </div>
    ${S.images.length === 0 ? `
      <div class="card p-12 text-center">
        <svg class="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        <p class="text-gray-500">아직 생성된 이미지가 없습니다</p>
        <p class="text-xs text-gray-600 mt-1">image_generate tool로 이미지를 생성하면 여기에 표시됩니다</p>
      </div>
    ` : `
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        ${S.images.map(img => `
          <div class="card overflow-hidden group relative">
            <div class="aspect-square bg-gray-900 flex items-center justify-center">
              <img src="${esc(img.url)}" alt="${esc(img.filename)}" class="w-full h-full object-cover" loading="lazy">
            </div>
            <div class="p-3">
              <p class="text-xs text-gray-300 truncate" title="${esc(img.filename)}">${esc(img.filename)}</p>
              <div class="flex items-center justify-between mt-1">
                <span class="text-[10px] text-gray-500">${fmtBytes(img.size)}</span>
                <span class="text-[10px] text-gray-500">${fmtTime(img.createdAt)}</span>
              </div>
            </div>
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onclick="copyImageUrl('${esc(img.url)}')" class="p-1.5 bg-gray-900/80 rounded text-gray-300 hover:text-white" title="URL 복사">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </button>
              <button onclick="deleteImage('${esc(img.filename)}')" class="p-1.5 bg-gray-900/80 rounded text-red-400 hover:text-red-300" title="삭제">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    `}
  </div>`;
}

function copyImageUrl(url) {
  const full = window.location.origin + url;
  navigator.clipboard.writeText(full).then(() => showToast("URL 복사됨", "success"));
}

async function deleteImage(filename) {
  if (!confirm("이미지를 삭제하시겠습니까?")) return;
  try {
    const res = await fetch("/api/images/" + encodeURIComponent(filename), { method: "DELETE", headers: authHeaders() });
    if (res.ok) { showToast("삭제됨", "success"); await loadImages(); render(); }
    else showToast("삭제 실패", "error");
  } catch (e) { showToast("삭제 실패: " + e.message, "error"); }
}

// ── Blog ──
async function loadBlogQueue() { const d = await API.get("/api/blog-queue"); if (d) S.blogQueue = d.posts || []; render(); }
async function approveBlogPost(id) { const r = await API.post("/api/blog-queue/" + id + "/approve"); if (r) { showToast("블로그 글 승인", "success"); loadBlogQueue(); } }
async function deleteBlogPost(id) { if (!confirm("삭제?")) return; const r = await API.post("/api/blog-queue/" + id + "/delete"); if (r) { showToast("삭제 완료", "success"); loadBlogQueue(); } }

function renderBlog() {
  const posts = S.blogQueue || [];
  const sc = { draft: "bg-yellow-900/40 text-yellow-300", approved: "bg-blue-900/40 text-blue-300", published: "bg-green-900/40 text-green-300", failed: "bg-red-900/40 text-red-300" };
  return `<div class="px-8 py-6">
    <div class="flex items-center justify-between mb-6">
      <div><h2 class="text-xl font-bold text-white">Blog Queue</h2><p class="text-xs text-gray-500 mt-1">SEO 블로그 글 자동 생성 파이프라인</p></div>
      <span class="text-sm text-gray-500">${posts.length} posts</span>
    </div>
    ${posts.length === 0 ? `<div class="card p-8 text-center"><p class="text-gray-500 text-sm">블로그 글이 없습니다.</p></div>` : ""}
    <div class="space-y-3">
    ${posts.map(p => `
      <div class="card p-4">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-[10px] px-1.5 py-0.5 rounded ${sc[p.status] || "bg-gray-700 text-gray-300"}">${esc(p.status)}</span>
            ${p.seoKeyword ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300">${esc(p.seoKeyword)}</span>` : ""}
            ${p.blogPostUrl ? `<a href="${esc(p.blogPostUrl)}" target="_blank" class="text-[10px] text-blue-400 hover:underline">View &rarr;</a>` : ""}
          </div>
          <span class="text-[10px] text-gray-600">${esc((p.id || "").slice(0, 8))}</span>
        </div>
        <h3 class="text-sm font-medium text-gray-200 mb-1">${esc(p.title || "")}</h3>
        <p class="text-xs text-gray-500 mb-2">${esc((p.content || "").replace(/<[^>]*>/g, "").slice(0, 150))}...</p>
        ${p.tags?.length ? `<div class="flex flex-wrap gap-1 mb-2">${p.tags.slice(0, 8).map(t => `<span class="text-[10px] text-cyan-400">#${esc(t)}</span>`).join("")}</div>` : ""}
        <div class="flex gap-2 mt-2">
          ${p.status === "draft" ? `<button data-blog-approve="${p.id}" class="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve</button>` : ""}
          ${p.status !== "published" ? `<button data-blog-delete="${p.id}" class="px-2 py-1 text-xs bg-red-900/40 text-red-300 rounded hover:bg-red-800">Delete</button>` : ""}
        </div>
      </div>
    `).join("")}
    </div>
  </div>`;
}

// ── Init ──
document.addEventListener("DOMContentLoaded", async () => {
  // Try API first — if no auth required, skip login
  const test = await fetch("/api/overview", { headers: authHeaders() });
  if (test.status === 401 && !getAuthToken()) { promptLogin(); return; }
  loadOverview();
  loadImages();
  render();
});
