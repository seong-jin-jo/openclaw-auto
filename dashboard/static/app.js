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
function showLoginModal() {
  const existing = document.getElementById("login-modal-overlay");
  if (existing) return;
  const overlay = document.createElement("div");
  overlay.id = "login-modal-overlay";
  overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center";
  overlay.innerHTML = `
    <div class="card p-6 w-80">
      <h2 class="text-sm font-medium text-white mb-1">Login Required</h2>
      <p class="text-[10px] text-gray-500 mb-3">이 작업을 수행하려면 로그인이 필요합니다.</p>
      <input id="modal-login-token" type="password" placeholder="Auth Token"
        class="w-full bg-gray-900 text-gray-200 text-sm p-3 rounded border border-gray-700 mb-3">
      <div class="flex gap-2">
        <button id="modal-login-btn" class="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">Login</button>
        <button id="modal-cancel-btn" class="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => {
    document.getElementById("modal-login-btn").onclick = () => {
      const token = document.getElementById("modal-login-token").value.trim();
      if (token) { setAuthToken(token); overlay.remove(); showToast("로그인 완료", "success"); }
    };
    document.getElementById("modal-cancel-btn").onclick = () => overlay.remove();
    document.getElementById("modal-login-token").focus();
    document.getElementById("modal-login-token").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("modal-login-btn").click(); });
  }, 50);
}

function promptLogin() {
  document.getElementById("app").innerHTML = `
    <div class="min-h-screen">
      <!-- Hero -->
      <div class="flex flex-col items-center justify-center px-8 pt-20 pb-16 text-center">
        <div class="text-[10px] px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/30 mb-6">AI-Powered Marketing Automation</div>
        <h1 class="text-5xl font-bold text-white mb-4 leading-tight">Marketing Hub</h1>
        <p class="text-lg text-gray-400 max-w-2xl mb-4">AI가 콘텐츠를 자동 생성하고, 20개+ 채널에 동시 발행하고, 반응을 분석하여 다음 콘텐츠에 자동 반영합니다.</p>
        <p class="text-sm text-gray-600 mb-10">검수만 하세요. 나머지는 자동입니다.</p>

        <!-- Login Card -->
        <div class="card p-6 w-80 mb-16">
          <input id="login-token" type="password" placeholder="Auth Token"
            class="w-full bg-gray-900 text-gray-200 text-sm p-3 rounded border border-gray-700 mb-3">
          <button id="login-btn" class="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-500">Start Dashboard</button>
        </div>
      </div>

      <!-- Pipeline -->
      <div class="max-w-4xl mx-auto px-8 pb-16">
        <div class="text-center mb-10">
          <h2 class="text-xl font-semibold text-white mb-2">Automated Pipeline</h2>
          <p class="text-sm text-gray-500">설정 한 번이면 24/7 자동 운영</p>
        </div>
        <div class="flex items-center justify-between gap-2 mb-4">
          ${[
            { icon: "1", label: "Trend Collection", desc: "외부 인기글 수집", color: "purple" },
            { icon: "2", label: "AI Generation", desc: "Claude가 맞춤 생성", color: "blue" },
            { icon: "3", label: "Human Review", desc: "대시보드에서 검수", color: "yellow" },
            { icon: "4", label: "Auto Publish", desc: "멀티채널 발행", color: "green" },
            { icon: "5", label: "Feedback Loop", desc: "반응→학습→개선", color: "red" },
          ].map(s => `
            <div class="flex-1 text-center">
              <div class="w-10 h-10 rounded-full bg-${s.color}-900/30 text-${s.color}-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">${s.icon}</div>
              <p class="text-xs font-medium text-white">${s.label}</p>
              <p class="text-[10px] text-gray-600">${s.desc}</p>
            </div>
          `).join(`<div class="text-gray-700 text-lg">&rarr;</div>`)}
        </div>
      </div>

      <!-- Features -->
      <div class="max-w-4xl mx-auto px-8 pb-16">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card p-6">
            <h3 class="text-sm font-medium text-white mb-2">20+ Channels</h3>
            <p class="text-xs text-gray-500 mb-3">Threads, X, Instagram, Facebook, LinkedIn, Blog, Telegram, Discord 등</p>
            <div class="flex flex-wrap gap-1">
              ${["T", "X", "I", "F", "L", "B", "TG", "D"].map(c => `<span class="text-[9px] w-5 h-5 rounded bg-gray-800 text-gray-500 flex items-center justify-center">${c}</span>`).join("")}
              <span class="text-[9px] text-gray-700">+12</span>
            </div>
          </div>
          <div class="card p-6">
            <h3 class="text-sm font-medium text-white mb-2">AI Feedback Loop</h3>
            <p class="text-xs text-gray-500">터진 글을 자동 감지하여 스타일과 패턴을 학습. 다음 콘텐츠 품질이 자동으로 개선됩니다.</p>
          </div>
          <div class="card p-6">
            <h3 class="text-sm font-medium text-white mb-2">Zero Maintenance</h3>
            <p class="text-xs text-gray-500">Cron이 생성/발행/수집을 24시간 자동 처리. 당신은 대시보드에서 승인만 하면 됩니다.</p>
          </div>
        </div>
      </div>

      <div class="text-center pb-12">
        <p class="text-[10px] text-gray-700">Powered by <a href="https://openclaw.ai" target="_blank" class="text-gray-600 hover:text-gray-400">OpenClaw</a> + Claude</p>
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
      if (res.status === 401) { showLoginModal(); return null; }
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
  tokenStatus: null, alerts: [], weekly: null, llmConfig: null,
  channelSettings: { features: [], settings: {} }, cronRuns: [],
  sidebarCollapsed: { social: false, video: true, blog: false, messaging: true, data: true, custom: true }, showDetail: null,
  queueFilter: "all", loading: false,
  editingPost: null, selectedIds: new Set(), imagePickerPostId: null, expandedFeature: null, expandedPopular: null,
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
  const [data, cronData, activity, chCfg, tokenData, alertData, weeklyData] = await Promise.all([
    API.get("/api/overview"), API.get("/api/cron-status"), API.get("/api/activity"), API.get("/api/channel-config"), API.get("/api/token-status"), API.get("/api/alerts"), API.get("/api/weekly-summary"),
  ]);
  if (data) S.overview = data;
  if (cronData) S.cronJobs = cronData.jobs || [];
  if (activity) S.activity = activity.events || [];
  if (chCfg) S.channelConfig = chCfg;
  // Lazy load threads username (don't block main render)
  if (S.channelConfig.threads?.connected && !S.channelConfig.threads?.username) {
    API.get("/api/threads-username").then(d => { if (d?.username) { S.channelConfig.threads.username = d.username; render(); } });
  }
  if (tokenData) S.tokenStatus = tokenData;
  if (alertData) S.alerts = alertData.alerts || [];
  if (weeklyData) S.weekly = weeklyData;
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
async function loadLlmConfig() { const d = await API.get("/api/llm-config"); if (d) S.llmConfig = d; render(); }
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
  const sidebarEl = document.getElementById("sidebar");
  const sidebarAside = sidebarEl?.querySelector("aside");
  const scrollTop = sidebarAside?.scrollTop || 0;
  sidebarEl.innerHTML = renderSidebar();
  const newAside = sidebarEl.querySelector("aside");
  if (newAside) newAside.scrollTop = scrollTop;
  const app = document.getElementById("app");
  if (S.page === "overview") app.innerHTML = renderOverview();
  else if (S.page === "threads") app.innerHTML = renderChannel("threads");
  else if (S.page === "x") app.innerHTML = renderChannelX();
  else if (S.page === "images") app.innerHTML = renderImages();
  else if (S.page === "blog") app.innerHTML = renderBlog();
  else if (CH_LABELS[S.page]) app.innerHTML = renderGenericChannel(S.page);
  else if (S.page === "settings") app.innerHTML = renderSettings();
  bindEvents();
  const oldModal = document.getElementById("image-picker-overlay");
  if (oldModal) oldModal.remove();
  if (S.imagePickerPostId) {
    app.insertAdjacentHTML("beforeend", renderImagePickerModal());
    bindImagePickerEvents();
  }
}

const CH_LABELS = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", bluesky: "Bluesky", pinterest: "Pinterest", tumblr: "Tumblr", tiktok: "TikTok", youtube: "YouTube", telegram: "Telegram", discord: "Discord", line: "LINE", naver_blog: "Naver Blog" };
const CH_STATUS_BADGE = { live: "bg-green-900/50 text-green-400", connected: "bg-blue-900/50 text-blue-400", available: "", soon: "" };
const CH_STATUS_LABEL = { live: "Live", connected: "Connected", available: "", soon: "" };

function chSidebarItem(key) {
  const ch = S.channelConfig[key] || {};
  const status = ch.status || "soon";
  const label = CH_LABELS[key] || key;
  if (status === "live") {
    return { key, label, icon: label[0], nav: true, status: "Live", statusClass: CH_STATUS_BADGE.live };
  }
  if (status === "connected") {
    return { key, label, icon: label[0], nav: true, status: "Connected", statusClass: CH_STATUS_BADGE.connected };
  }
  if (status === "available") {
    return { key, label, icon: label[0], nav: true }; // no badge
  }
  return { label, icon: label[0], soon: true };
}

function sidebarGroup(key, title, items) {
  const collapsed = S.sidebarCollapsed[key];
  const activeCount = items.filter(i => i.nav && !i.soon).length;
  const soonCount = items.filter(i => i.soon).length;
  return `
    <div class="mt-4">
      <button data-sidebar-toggle="${key}" class="px-3 mb-1 w-full flex items-center justify-between cursor-pointer hover:opacity-80">
        <span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">${title}</span>
        <span class="flex items-center gap-1">
          ${soonCount ? `<span class="text-[9px] text-gray-700">${activeCount}/${activeCount + soonCount}</span>` : ""}
          <svg class="w-3 h-3 text-gray-700 transition-transform ${collapsed ? "" : "rotate-180"}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </span>
      </button>
      ${collapsed ? "" : items.map(i => {
        if (i.nav && !i.soon) {
          return `<button data-nav="${i.key}" class="sidebar-item ${S.page === i.key ? "active" : ""} w-full text-left px-4 py-1.5 text-sm text-gray-300 flex items-center gap-3">
            <span class="w-4 h-4 rounded ${i.iconClass || "bg-gray-800 text-gray-400"} flex items-center justify-center text-[9px] font-bold">${i.icon}</span>
            ${i.label}
            ${i.status ? `<span class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${i.statusClass || "bg-gray-800 text-gray-500"}">${i.status}</span>` : ""}
          </button>`;
        }
        return `<div class="px-4 py-1 text-[12px] text-gray-700 flex items-center gap-3 opacity-40">
          <span class="w-4 h-4 rounded bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-600">${i.icon}</span>
          ${i.label} <span class="ml-auto text-[9px] text-gray-800">Soon</span>
        </div>`;
      }).join("")}
    </div>`;
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

        ${sidebarGroup("social", "Social", [
          { key: "threads", label: "Threads", icon: "T", iconClass: "bg-gradient-to-br from-purple-500 to-pink-500 text-white", nav: true, status: S.channelConfig.threads?.connected ? "Live" : "Off", statusClass: S.channelConfig.threads?.connected ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500" },
          { key: "x", label: "X (Twitter)", icon: "X", nav: true, status: S.channelConfig.x?.connected ? (S.channelConfig.x?.enabled ? "Live" : "Connected") : "", statusClass: S.channelConfig.x?.connected ? (S.channelConfig.x?.enabled ? CH_STATUS_BADGE.live : CH_STATUS_BADGE.connected) : "" },
          ...["instagram", "facebook", "linkedin", "bluesky", "pinterest", "tumblr"].map(ch => chSidebarItem(ch)),
        ])}

        ${sidebarGroup("video", "Video", [
          ...["tiktok", "youtube"].map(ch => chSidebarItem(ch)),
        ])}

        ${sidebarGroup("blog", "Blog & SEO", [
          { key: "blog", label: "Blog", icon: "B", nav: true },
          chSidebarItem("naver_blog"),
          { label: "Medium", icon: "M", soon: true },
        ])}

        ${sidebarGroup("messaging", "Messaging", [
          ...["telegram", "discord", "line"].map(ch => chSidebarItem(ch)),
          { label: "Kakao Channel", icon: "K", soon: true },
          { label: "WhatsApp", icon: "W", soon: true },
        ])}

        ${sidebarGroup("data", "Data & Analytics", [
          { label: "Google Analytics", icon: "G", soon: true },
          { label: "Search Console", icon: "S", soon: true },
          { label: "Google Business", icon: "G", soon: true },
        ])}

        ${sidebarGroup("custom", "Custom", [
          { label: "Custom API", icon: "+", soon: true },
          { label: "Webhook", icon: "W", soon: true },
        ])}

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
      <div class="px-4 py-3 border-t border-gray-800/50 space-y-2">
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

  // Build channel grid data
  const allChannels = [
    { key: "threads", label: "Threads", icon: "T", iconClass: "bg-gradient-to-br from-purple-500 to-pink-500 text-white" },
    { key: "x", label: "X", icon: "X" },
    { key: "instagram", label: "Instagram", icon: "IG" },
    { key: "facebook", label: "Facebook", icon: "F" },
    { key: "bluesky", label: "Bluesky", icon: "BS" },
    { key: "linkedin", label: "LinkedIn", icon: "LI" },
    { key: "tiktok", label: "TikTok", icon: "TK" },
    { key: "youtube", label: "YouTube", icon: "YT" },
    { key: "blog", label: "Blog", icon: "B", nav: "blog" },
    { key: "telegram", label: "Telegram", icon: "TG" },
    { key: "discord", label: "Discord", icon: "DC" },
    { key: "pinterest", label: "Pinterest", icon: "P" },
  ];

  return `<div class="px-8 py-6">
    <!-- Channel Grid (Genspark style) -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">Channels</h2>
        <span class="text-xs text-gray-600">${Object.values(S.channelConfig).filter(c => c.connected || c.status === "live").length} connected</span>
      </div>
      <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
        ${allChannels.map(ch => {
          const cfg = S.channelConfig[ch.key] || {};
          const status = cfg.status || (cfg.connected ? "live" : "available");
          const isLive = status === "live" || cfg.connected;
          const navTarget = ch.nav || ch.key;
          return `
            <button data-nav="${navTarget}" class="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-800/50 transition group">
              <div class="w-10 h-10 rounded-xl ${ch.iconClass || (isLive ? "bg-gray-700 text-white" : "bg-gray-800/50 text-gray-600")} flex items-center justify-center text-xs font-bold ${isLive ? "ring-1 ring-green-800/50" : ""}">${ch.icon}</div>
              <span class="text-[10px] ${isLive ? "text-gray-300" : "text-gray-600"}">${ch.label}</span>
              ${isLive ? '<div class="w-1 h-1 rounded-full bg-green-500"></div>' : ""}
            </button>`;
        }).join("")}
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      ${card("Published", totalPub, `T:${cc.threads || 0} X:${cc.x || 0}`)}
      ${card("Followers", o.followers ?? "-", o.weekDelta != null ? `${o.weekDelta >= 0 ? "+" : ""}${o.weekDelta} this week` : "")}
      ${card("Viral", o.viralPosts?.length || 0, "")}
      ${card("Queue", (sc.draft || 0) + (sc.approved || 0), `${sc.draft || 0} drafts`)}
      ${card("Engagement", S.weekly?.engagementRate ? S.weekly.engagementRate + "%" : "-", "this week")}
    </div>

    <!-- Weekly Performance -->
    ${S.weekly ? `
    <div class="card p-5 mb-6">
      <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">This Week</h3>
      <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div><p class="text-[10px] text-gray-500">Published</p><p class="text-xl font-bold text-white">${S.weekly.published}</p></div>
        <div><p class="text-[10px] text-gray-500">Views</p><p class="text-xl font-bold text-white">${S.weekly.views.toLocaleString()}</p></div>
        <div><p class="text-[10px] text-gray-500">Likes</p><p class="text-xl font-bold text-white">${S.weekly.likes}</p></div>
        <div><p class="text-[10px] text-gray-500">Replies</p><p class="text-xl font-bold text-white">${S.weekly.replies}</p></div>
        <div><p class="text-[10px] text-gray-500">Eng. Rate</p><p class="text-xl font-bold ${S.weekly.engagementRate > 3 ? "text-green-400" : "text-white"}">${S.weekly.engagementRate}%</p></div>
        <div><p class="text-[10px] text-gray-500">Drafts</p><p class="text-xl font-bold text-gray-400">${S.weekly.drafted}</p></div>
      </div>
      ${S.weekly.published > 0 ? `
        <div class="mt-4 pt-3 border-t border-gray-800/50">
          <div class="flex items-center gap-6 text-xs">
            <span class="text-gray-500">Channel breakdown:</span>
            <span class="text-purple-400">Threads: ${S.weekly.channels?.threads || 0}</span>
            <span class="text-gray-300">X: ${S.weekly.channels?.x || 0}</span>
          </div>
        </div>
      ` : `
        <p class="text-xs text-gray-600 mt-3">이번 주 발행된 글이 없습니다. Queue에서 draft를 승인하면 자동 발행됩니다.</p>
      `}
    </div>
    ` : ""}

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

    <!-- Alerts + Token Status -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      ${S.alerts?.length ? `
        <div class="card p-5 ${S.alerts.some(a => a.severity === "error") ? "border-red-900/50" : "border-yellow-900/50"}">
          <h3 class="text-xs font-medium text-red-400 uppercase tracking-wide mb-3">Alerts</h3>
          <div class="space-y-2">
            ${S.alerts.map(a => `
              <div class="flex items-center gap-2">
                <span class="text-[10px] ${a.severity === "error" ? "text-red-400" : "text-yellow-400"}">${a.severity === "error" ? "●" : "▲"}</span>
                <span class="text-xs text-gray-300">${esc(a.message)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <div class="card p-5 ${S.alerts?.length ? "" : "col-span-1"}">
        <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">AI Engine</h3>
        ${S.tokenStatus?.claude ? `
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Claude</span><span class="${S.tokenStatus.claude.healthy ? "text-green-400" : "text-red-400"}">${S.tokenStatus.claude.healthy ? "Healthy" : "Expiring"}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Token</span><span class="text-gray-300">${S.tokenStatus.claude.remainingHours}h remaining</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Errors</span><span class="text-gray-300">${S.tokenStatus.claude.errorCount}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Last used</span><span class="text-gray-300">${S.tokenStatus.claude.lastUsed ? fmtAgo(new Date(S.tokenStatus.claude.lastUsed).toISOString()) : "-"}</span></div>
          </div>
        ` : `<p class="text-xs text-gray-600">No data</p>`}
      </div>

      <div class="card p-5 ${S.alerts?.length ? "" : "col-span-1"}">
        <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Channels Status</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">Threads</span><span class="${S.tokenStatus?.threads?.connected ? "text-green-400" : "text-gray-600"}">${S.tokenStatus?.threads?.connected ? "Connected" : "Off"}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">X (Twitter)</span><span class="${S.tokenStatus?.x?.connected ? "text-green-400" : "text-yellow-400"}">${S.tokenStatus?.x?.connected ? "Connected" : ""}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Blog</span><span class="text-gray-300">Active</span></div>
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
      ${p.status === "draft" || p.status === "approved" ? `
        <div class="flex items-center gap-3 mb-2 text-xs">
          <span class="text-gray-600">Publish to:</span>
          ${["threads", "x"].map(ch => {
            const chCfg = S.channelConfig[ch] || {};
            const enabled = chCfg.connected || chCfg.enabled;
            const checked = (p.channels?.[ch]?.status !== "skipped");
            const limit = ch === "x" ? 280 : 500;
            const over = p.text.length > limit;
            return enabled ? `
              <label class="flex items-center gap-1 ${over ? "text-yellow-500" : "text-gray-400"}">
                <input type="checkbox" data-publish-channel="${p.id}:${ch}" ${checked ? "checked" : ""} class="rounded border-gray-600 w-3 h-3">
                ${ch === "threads" ? "T" : "X"}${over ? ` (${p.text.length}/${limit})` : ""}
              </label>` : "";
          }).join("")}
        </div>
      ` : ""}
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
  const posts = (a.posts || []).sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">${card("Published", s.totalPublished)}${card("Views", s.totalViews)}${card("Avg Views", s.avgViews)}${card("Avg Likes", s.avgLikes)}</div>
    ${Object.keys(a.topics || {}).length ? `<div class="card p-4 mb-6"><h3 class="text-xs font-medium text-gray-400 mb-3">Topic Performance</h3>
      <table class="w-full text-sm"><thead><tr class="text-[10px] text-gray-500 uppercase"><th class="text-left py-1">Topic</th><th class="text-right py-1">Posts</th><th class="text-right py-1">Avg Views</th><th class="text-right py-1">Avg Likes</th></tr></thead>
      <tbody>${Object.entries(a.topics).map(([t, s]) => `<tr class="border-t border-gray-800/50"><td class="text-gray-200 py-1">${esc(t)}</td><td class="text-gray-400 text-right py-1">${s.count}</td><td class="text-gray-400 text-right py-1">${s.avgViews || 0}</td><td class="text-gray-400 text-right py-1">${s.avgLikes || 0}</td></tr>`).join("")}</tbody></table></div>` : ""}
    ${Object.keys(a.hashtags || {}).length ? `<div class="card p-4 mb-6"><h3 class="text-xs font-medium text-gray-400 mb-3">Hashtag Performance</h3>
      <div class="flex flex-wrap gap-2">${Object.entries(a.hashtags).sort((a, b) => (b[1].avgViews || 0) - (a[1].avgViews || 0)).map(([t, s]) => `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border border-gray-800 ${s.avgViews >= (a.summary?.viralThreshold || 500) ? "bg-yellow-900/30 border-yellow-700/50 text-yellow-300" : "bg-gray-900 text-gray-400"}">#${esc(t)} <span class="text-[10px] text-gray-500">${s.count}posts ${s.avgViews || 0}v ${s.avgLikes || 0}l</span></span>`).join("")}</div></div>` : ""}
    ${posts.length ? `<div class="card p-4"><h3 class="text-xs font-medium text-gray-400 mb-3">Post Performance</h3>
      <div class="space-y-2">
        ${posts.map(p => {
          const vt = s.viralThreshold || 500;
          const isViral = p.views >= vt;
          return `<div class="flex items-start gap-3 py-2 border-b border-gray-800/50 last:border-0">
            <div class="flex-1 min-w-0">
              <p class="text-xs text-gray-200 truncate" title="${esc(p.text)}">${esc(p.text)}</p>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-[10px] text-gray-600">${p.topic || ""}</span>
                <span class="text-[10px] text-gray-600">${p.publishedAt ? fmtTime(p.publishedAt) : ""}</span>
                ${p.archived ? '<span class="text-[10px] text-gray-700">archived</span>' : ""}
              </div>
            </div>
            <div class="flex gap-4 text-right shrink-0">
              <div><p class="text-xs ${isViral ? "text-yellow-400 font-medium" : "text-gray-300"}">${p.views}</p><p class="text-[10px] text-gray-600">views</p></div>
              <div><p class="text-xs text-gray-300">${p.likes}</p><p class="text-[10px] text-gray-600">likes</p></div>
              <div><p class="text-xs text-gray-300">${p.replies}</p><p class="text-[10px] text-gray-600">replies</p></div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>` : ""}`;
}

function renderGrowth() {
  if (!S.growth.length) return `<p class="text-gray-600 text-sm">No growth data</p>`;
  return `<div class="card p-4"><h3 class="text-xs font-medium text-gray-400 mb-3">Follower History</h3>
    <div class="space-y-1">${S.growth.slice(-14).map(r => `<div class="flex justify-between text-xs border-b border-gray-800/50 py-1"><span class="text-gray-300">${r.date}</span><span class="text-gray-200">${r.followers}</span><span class="${r.delta >= 0 ? "text-green-400" : "text-red-400"}">${r.delta >= 0 ? "+" : ""}${r.delta}</span></div>`).join("")}</div></div>`;
}

function renderPopular() {
  const sourceColors = { external: "bg-purple-900/50 text-purple-300", "own-viral": "bg-green-900/50 text-green-300", manual: "bg-gray-700 text-gray-300" };
  return `
    <div class="card p-4 mb-4">
      <div class="flex items-center gap-2 mb-3">
        <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        <span class="text-xs text-gray-300">Add External Post</span>
      </div>
      <textarea id="ext-post-text" class="w-full bg-gray-900 text-gray-200 text-xs p-2 rounded border border-gray-700 mb-2" rows="3" placeholder="인기글 텍스트를 붙여넣기"></textarea>
      <div class="flex gap-2">
        <input id="ext-post-url" type="text" placeholder="Threads URL (선택)" class="flex-1 bg-gray-900 text-gray-200 text-xs p-2 rounded border border-gray-700">
        <input id="ext-post-topic" type="text" placeholder="키워드/주제" class="w-28 bg-gray-900 text-gray-200 text-xs p-2 rounded border border-gray-700">
        <button id="ext-post-add" class="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 shrink-0">Add</button>
      </div>
    </div>
    <div class="space-y-2">${S.popular.map((p, i) => {
      const open = S.expandedPopular === i;
      return `
    <div class="card overflow-hidden cursor-pointer hover:bg-gray-800/20 transition-colors" onclick="togglePopularDetail(${i})">
      <div class="flex items-center gap-2 px-4 pt-3 pb-1">
        <span class="text-xs px-2 py-0.5 rounded ${sourceColors[p.source] || "bg-gray-700 text-gray-300"}">${p.source || "?"}</span>
        ${p.topic ? `<span class="text-[10px] text-gray-500">${esc(p.topic)}</span>` : ""}
        ${p.likes && p.likes !== "0" ? `<span class="text-[10px] text-yellow-500">${p.likes} likes</span>` : ""}
        ${p.username ? `<span class="text-[10px] text-gray-600">@${esc(p.username)}</span>` : ""}
        <span class="text-[10px] text-gray-700 ml-auto">${p.collected || ""}</span>
        <svg class="w-3 h-3 text-gray-600 transition-transform ${open ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </div>
      <p class="text-xs text-gray-300 px-4 pb-3 ${open ? "whitespace-pre-wrap" : "truncate"}">${esc(p.text || "")}</p>
      ${open ? `
        <div class="px-4 pb-3 flex items-center gap-3 border-t border-gray-800/50 pt-2">
          ${p.engagement ? `<span class="text-[10px] text-gray-500">${esc(p.engagement)}</span>` : ""}
          ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener" class="text-[10px] text-blue-400 hover:text-blue-300" onclick="event.stopPropagation()">Threads에서 보기 &rarr;</a>` : ""}
          <button class="text-[10px] text-red-400 hover:text-red-300 ml-auto" onclick="event.stopPropagation(); deletePopularPost(${i})">삭제</button>
        </div>
      ` : ""}
    </div>`;
    }).join("") || `<p class="text-gray-600 text-sm">No popular posts</p>`}</div>`;
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
                ${f.detail ? `<p class="text-[10px] text-gray-500 py-1 mb-1">${f.detail}</p>` : ""}
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
        ${row("imagePerBatch", "Images per Batch", "배치당 이미지 첨부 수")}
        ${row("casualPerBatch", "Casual per Batch", "배치당 일상 글 수")}
        ${row("quotePerBatch", "Quotes per Batch", "배치당 인용 게시 수")}
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
            <div class="flex items-center gap-3"><span class="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[9px] font-bold text-white">X</span><div><p class="text-xs text-gray-300">X (Twitter)</p><p class="text-[10px] text-gray-600">${S.channelConfig.x?.connected ? "OAuth 1.0a" : ""}</p></div></div>
            <span class="text-[10px] ${S.channelConfig.x?.connected ? "text-blue-400" : "text-gray-600"}">${S.channelConfig.x?.connected ? "Connected" : ""}</span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 opacity-50">
            <div class="flex items-center gap-3"><span class="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-500">IG</span><div><p class="text-xs text-gray-500">Instagram</p></div></div>
            <span class="text-[10px] text-gray-700">Coming soon</span>
          </div>
        </div>
        <p class="text-[10px] text-gray-600 mt-4">Click a channel to manage its settings</p>
      </div>
      <div class="space-y-4">
        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-4">System Status</h3>
          <div class="space-y-2.5">
            ${S.cronJobs.map(j => {
              const dot = j.lastStatus === "ok" ? "bg-green-500" : j.lastStatus === "error" ? "bg-red-500" : "bg-gray-600";
              return `<div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full ${dot}"></div><span class="text-xs text-gray-300">${esc(j.name)}</span></div><span class="text-[10px] text-gray-500">${j.lastStatus === "error" ? '<span class="text-red-400">error</span>' : fmtTime(j.nextRunAt)}</span></div>`;
            }).join("")}
          </div>
        </div>
        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-4">AI Engine (LLM)</h3>
          ${S.llmConfig ? `
            <div class="space-y-3">
              <div>
                <label class="text-[10px] text-gray-500 block mb-1">Primary Model</label>
                <select id="llm-primary" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300">
                  ${(S.llmConfig.available || []).map(m => `<option value="${m}" ${m === S.llmConfig.primary ? "selected" : ""}>${m}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="text-[10px] text-gray-500 block mb-1">Fallback Models</label>
                <p class="text-xs text-gray-400">${(S.llmConfig.fallbacks || []).join(" → ") || "none"}</p>
              </div>
              ${S.tokenStatus?.claude ? `
                <div class="flex justify-between text-sm"><span class="text-gray-500">Token</span><span class="${S.tokenStatus.claude.healthy ? "text-green-400" : "text-red-400"}">${S.tokenStatus.claude.remainingHours}h remaining</span></div>
              ` : ""}

              <div class="border-t border-gray-800/50 pt-3 mt-3">
                <p class="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Per-Job Model Override</p>
                <div class="space-y-2">
                  ${Object.entries(S.llmConfig.jobModels || {}).map(([job, model]) => `
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[10px] text-gray-400 flex-shrink-0 w-40 truncate">${job}</span>
                      <select data-job-model="${job}" class="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-300">
                        <option value="" ${!model || model === S.llmConfig.primary ? "selected" : ""}>Default (${(S.llmConfig.primary || "").split("/").pop()})</option>
                        ${(S.llmConfig.available || []).filter(m => m !== S.llmConfig.primary).map(m => `<option value="${m}" ${m === model ? "selected" : ""}>${m.split("/").pop()}</option>`).join("")}
                      </select>
                    </div>
                  `).join("")}
                </div>
              </div>

              <button id="save-llm-config" class="w-full mt-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">Save LLM Config</button>
            </div>
          ` : `<p class="text-xs text-gray-600">Loading...</p>`}
        </div>
        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-4">Account</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Auth</span><span class="text-gray-300">${getAuthToken() ? "Token (localStorage)" : "No auth"}</span></div>
          </div>
          ${getAuthToken() ? `
            <div class="flex gap-2 mt-4">
              <button id="btn-logout" class="px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">Logout</button>
              <button id="btn-change-pw" class="px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">Change Token</button>
            </div>
          ` : `<p class="text-[10px] text-gray-600 mt-3">DASHBOARD_AUTH_TOKEN 환경변수 설정 시 로그인 활성화</p>`}
        </div>
      </div>
    </div>
  </div>`;
}

// ── Event Binding ──
function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach(el => { el.onclick = () => navigate(el.dataset.nav); });
  document.querySelectorAll("[data-sidebar-toggle]").forEach(el => { el.onclick = () => { S.sidebarCollapsed[el.dataset.sidebarToggle] = !S.sidebarCollapsed[el.dataset.sidebarToggle]; render(); }; });
  // LLM config save
  const saveLlm = document.getElementById("save-llm-config");
  if (saveLlm) saveLlm.onclick = async () => {
    const primary = document.getElementById("llm-primary")?.value;
    const jobModels = {};
    document.querySelectorAll("[data-job-model]").forEach(el => {
      jobModels[el.dataset.jobModel] = el.value;
    });
    const r = await API.post("/api/llm-config", { primary, jobModels });
    if (r) { showToast(`LLM 설정 저장: ${r.primary?.split("/").pop()}`, "success"); loadLlmConfig(); loadOverview(); }
  };

  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) logoutBtn.onclick = () => { localStorage.removeItem("dashboard_auth_token"); location.reload(); };
  const changePwBtn = document.getElementById("btn-change-pw");
  if (changePwBtn) changePwBtn.onclick = () => { localStorage.removeItem("dashboard_auth_token"); promptLogin(); };
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

  const extPostBtn = document.getElementById("ext-post-add");
  if (extPostBtn) extPostBtn.onclick = async () => {
    const text = document.getElementById("ext-post-text")?.value?.trim();
    if (!text) { showToast("텍스트를 입력하세요", "warning"); return; }
    const url = document.getElementById("ext-post-url")?.value?.trim() || "";
    const topic = document.getElementById("ext-post-topic")?.value?.trim() || "general";
    const r = await API.post("/api/popular/add", { text, url, topic });
    if (r) { showToast("인기글 추가됨", "success"); loadPopular(); }
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
    if (r) {
      if (r.verified) showToast(`Threads 연결 완료${r.account ? " — " + r.account : ""}`, "success");
      else showToast(`연결 실패: ${r.error || "Invalid credentials"}`, "error");
      loadOverview();
    }
  };

  const saveX = document.getElementById("save-x-config");
  if (saveX) saveX.onclick = async () => {
    const data = {};
    ["apiKey", "apiKeySecret", "accessToken", "accessTokenSecret"].forEach(k => { const el = document.getElementById("x-" + k); if (el?.value) data[k] = el.value; });
    const r = await API.post("/api/channel-config/x", data);
    if (r) {
      if (r.verified) showToast(`X 연결 완료${r.account ? " — " + r.account : ""}`, "success");
      else showToast(`연결 실패: ${r.error || "Invalid credentials"}`, "error");
      loadOverview();
    }
  };

  // Detail toggle
  document.querySelectorAll("[data-toggle-detail]").forEach(el => { el.onclick = () => { S.showDetail = S.showDetail === el.dataset.toggleDetail ? null : el.dataset.toggleDetail; render(); }; });

  // Generic channel credential save
  Object.keys(CH_LABELS).forEach(key => {
    const btn = document.getElementById(`save-ch-${key}`);
    if (btn) btn.onclick = async () => {
      const sg = { facebook: ["accessToken","pageId"], bluesky: ["handle","appPassword"], instagram: ["accessToken","userId"], linkedin: ["accessToken","personUrn"], pinterest: ["accessToken","boardId"], tumblr: ["consumerKey","consumerSecret","accessToken","accessTokenSecret","blogName"], tiktok: ["accessToken"], youtube: ["accessToken"], telegram: ["botToken","chatId"], discord: ["webhookUrl"], line: ["channelAccessToken"], naver_blog: ["blogId","username","apiKey"] };
      const fields = sg[key] || [];
      const data = {};
      fields.forEach(f => { const el = document.getElementById(`ch-${key}-${f}`); if (el?.value) data[f] = el.value; });
      btn.textContent = "Verifying..."; btn.disabled = true;
      const r = await API.post(`/api/channel-config/${key}`, data);
      btn.textContent = hasKeys ? "Update" : "Connect"; btn.disabled = false;
      if (r) {
        if (r.verified) showToast(`${CH_LABELS[key]} 연결 완료${r.account ? " — " + r.account : ""}`, "success");
        else showToast(`연결 실패: ${r.error || "Invalid credentials"}`, "error");
        loadOverview();
      }
    };
  });

  // Blog actions
  document.querySelectorAll("[data-blog-approve]").forEach(el => { el.onclick = () => approveBlogPost(el.dataset.blogApprove); });
  document.querySelectorAll("[data-blog-delete]").forEach(el => { el.onclick = () => deleteBlogPost(el.dataset.blogDelete); });
}

function navigate(page) {
  S.page = page;
  window.location.hash = page;
  if (page === "overview") loadOverview();
  else if (page === "threads") { S.subTab = "queue"; loadQueue(S.queueFilter); loadGrowth(); loadImages(); }
  else if (page === "x") { S.subTab = S.channelConfig.x?.connected ? "queue" : "settings"; loadOverview(); }
  else if (page === "images") loadImages();
  else if (page === "blog") loadBlogQueue();
  else if (CH_LABELS[page]) loadOverview(); // generic channels use overview data
  else if (page === "settings") { loadSettings(); loadKeywords(); loadLlmConfig(); }
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
function togglePopularDetail(i) { S.expandedPopular = S.expandedPopular === i ? null : i; render(); }
async function deletePopularPost(i) {
  if (!confirm("이 인기글을 삭제하시겠습니까?")) return;
  const r = await API.post("/api/popular/delete", { index: i });
  if (r) { showToast("삭제됨", "success"); S.expandedPopular = null; loadPopular(); }
}
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

// ── Generic Channel Page ──
function renderGenericChannel(key) {
  const label = CH_LABELS[key] || key;
  const ch = S.channelConfig[key] || {};
  const status = ch.status || "soon";
  const keys = ch.keys || {};
  const hasKeys = Object.values(keys).some(v => v);

  const setupGuides = {
    facebook: { fields: ["accessToken", "pageId"], labels: ["Page Access Token", "Page ID"],
      quick: ["developers.facebook.com 접속 > 앱 만들기", "Use cases > Facebook Login 추가", "Settings > Page Access Token 발급", "Page ID 확인 (페이지 정보에서)", "위 폼에 입력 후 Connect"],
      detail: "Access Token으로 Facebook Page에 글을 발행합니다. Page Access Token은 페이지 관리자 권한이 필요하며, 60일 유효 (long-lived). Page ID는 페이지 고유 번호입니다." },
    bluesky: { fields: ["handle", "appPassword"], labels: ["Handle (예: user.bsky.social)", "App Password"],
      quick: ["bsky.app 로그인", "Settings > App Passwords", "새 비밀번호 생성 > 이름 입력 > 생성", "Handle과 생성된 비밀번호를 위 폼에 입력"],
      detail: "Bluesky는 AT Protocol 기반 오픈 소셜 네트워크입니다. App Password는 계정 비밀번호 대신 사용하는 앱 전용 비밀번호로, 언제든 폐기 가능합니다. API 사용은 무료이며 승인 불필요." },
    instagram: { fields: ["accessToken", "userId"], labels: ["Graph API Access Token", "Instagram Business User ID"],
      quick: ["developers.facebook.com > 앱 만들기", "Use cases > Instagram Graph API 추가", "Business/Creator 계정 필요 (개인 계정 불가)", "Access Token 발급 + User ID 확인", "App Review 제출 (2-4주 소요)"],
      detail: "Instagram은 Meta Graph API를 통해 발행합니다. 이미지가 필수이며, Business 또는 Creator 계정이 Facebook Page에 연결되어 있어야 합니다. App Review를 통과해야 프로덕션 사용 가능." },
    linkedin: { fields: ["accessToken", "personUrn"], labels: ["OAuth 2.0 Access Token", "Person URN (urn:li:person:xxx)"],
      quick: ["LinkedIn Partner Program 신청 (learn.microsoft.com/linkedin)", "승인 후 앱 생성 > OAuth 2.0 설정", "Access Token 발급", "Person URN 확인 (API /v2/me 호출)"],
      detail: "LinkedIn은 Partner Program 승인이 필요합니다. 자가 신청 후 승인 기간이 불확실합니다. Person URN은 urn:li:person:xxxx 형태의 사용자 고유 식별자." },
    pinterest: { fields: ["accessToken", "boardId"], labels: ["OAuth 2.0 Access Token", "Board ID"],
      quick: ["developers.pinterest.com > 앱 생성", "OAuth 2.0 토큰 발급", "대상 Board의 ID 확인", "위 폼에 입력"],
      detail: "Pinterest Content API v5는 오픈 액세스 (승인 불필요). Pin 생성 시 이미지가 필수입니다. Board ID는 핀을 저장할 보드의 고유 번호." },
    tumblr: { fields: ["consumerKey", "consumerSecret", "accessToken", "accessTokenSecret", "blogName"], labels: ["Consumer Key", "Consumer Secret", "Access Token", "Access Token Secret", "Blog Name"],
      quick: ["tumblr.com/oauth/apps > 앱 등록", "OAuth Consumer Key/Secret 발급", "Access Token 발급 (OAuth 1.0a)", "Blog Name 입력 (예: myblog.tumblr.com)"],
      detail: "Tumblr는 X(Twitter)와 같은 OAuth 1.0a 방식입니다. Consumer Key는 앱 식별, Consumer Secret은 요청 서명, Access Token/Secret은 사용자 인증에 사용됩니다." },
    tiktok: { fields: ["accessToken"], labels: ["OAuth Access Token"],
      quick: ["developers.tiktok.com > 앱 생성", "Content Posting API 권한 신청", "앱 심사 제출 (심사 전 비공개 포스트만 가능)", "심사 통과 후 Access Token 발급"],
      detail: "TikTok은 앱 심사가 필수입니다. 심사 전에는 모든 포스트가 비공개로만 생성됩니다. 영상/사진 콘텐츠 위주이며, 15건/일 제한." },
    youtube: { fields: ["accessToken"], labels: ["Google OAuth 2.0 Access Token"],
      quick: ["console.cloud.google.com > YouTube Data API v3 활성화", "OAuth 2.0 클라이언트 생성 > Access Token 발급", "영상 업로드만 가능 (커뮤니티 글 API 미지원)"],
      detail: "YouTube Data API는 영상 업로드에 사용됩니다. 커뮤니티 글 작성 API는 공식적으로 존재하지 않습니다. 일일 10,000 quota units 제한." },
    telegram: { fields: ["botToken", "chatId"], labels: ["Bot Token (@BotFather에서 발급)", "Chat/Channel ID (@채널명 또는 -100xxx)"],
      quick: ["Telegram에서 @BotFather 검색 > /newbot 명령", "봇 이름 + username 설정 > Token 발급", "봇을 채널/그룹에 관리자로 추가", "채널 ID 확인 (@채널명 또는 숫자 ID)"],
      detail: "Bot Token은 @BotFather가 발급하는 고유 키입니다. 봇이 채널에 글을 쓰려면 해당 채널의 관리자 권한이 필요합니다. API 사용은 완전 무료." },
    discord: { fields: ["webhookUrl"], labels: ["Webhook URL"],
      quick: ["Discord 서버 > 채널 설정 > 연동", "웹후크 > 새 웹후크 만들기", "이름 설정 > URL 복사", "위 폼에 URL 붙여넣기"],
      detail: "Discord Webhook은 가장 간단한 연동 방식입니다. URL 하나만으로 메시지를 보낼 수 있으며, 별도 인증이 필요 없습니다. 보내기만 가능 (읽기 불가)." },
    line: { fields: ["channelAccessToken"], labels: ["Channel Access Token (long-lived)"],
      quick: ["developers.line.biz > LINE Official Account 생성", "Messaging API 활성화", "Channel Access Token (long-lived) 발급", "위 폼에 입력"],
      detail: "LINE Messaging API는 브로드캐스트(전체 발송) 방식입니다. 무료 500건/월, 이후 건당 과금. Channel Access Token은 장기 유효 토큰." },
    naver_blog: { fields: ["blogId", "username", "apiKey"], labels: ["Blog ID", "네이버 Username", "API Key (XML-RPC)"],
      quick: ["네이버 블로그 관리 > 글쓰기 API 설정", "Blog ID, Username 확인", "XML-RPC API Key 발급", "위 폼에 입력"],
      detail: "네이버 블로그는 공식 REST API가 없습니다. 레거시 XML-RPC 방식으로 발행하며, 안정성이 보장되지 않습니다. 비공식 방식." },
  };

  const sg = setupGuides[key] || { fields: [], labels: [], quick: ["Setup guide가 아직 준비되지 않았습니다."], detail: "" };

  return `<div class="px-8 py-6">
    <button data-nav="overview" class="text-gray-500 hover:text-gray-300 text-sm mb-1">&larr; Back</button>
    <div class="flex items-center gap-3 mb-6">
      <span class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-white">${label[0]}</span>
      <div><h2 class="text-xl font-semibold text-white">${label}</h2><p class="text-xs text-gray-500">${CH_STATUS_LABEL[status] || status}</p></div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">Credentials</h3>
        <div class="space-y-3">
          ${sg.fields.map((f, i) => credField(`ch-${key}-${f}`, sg.labels[i], "", f.toLowerCase().includes("secret") || f.toLowerCase().includes("password") || f.toLowerCase().includes("token"), keys[f] || "")).join("")}
        </div>
        <button id="save-ch-${key}" class="w-full mt-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${hasKeys ? "Update" : "Connect"}</button>
      </div>
      <div class="space-y-4">
        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-3">Channel Info</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Status</span><span class="${status === "live" ? "text-green-400" : status === "connected" ? "text-blue-400" : "text-gray-500"}">${status === "live" ? "Live" : status === "connected" ? "Connected" : "Not connected"}</span></div>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-3">Setup Guide</h3>
          <ol class="text-[10px] text-gray-400 space-y-1.5 list-decimal list-inside">
            ${(sg.quick || []).map(step => `<li>${step}</li>`).join("")}
          </ol>
          ${sg.detail ? `
            <button data-toggle-detail="${key}" class="text-[10px] text-blue-400 hover:text-blue-300 mt-3 block">${S.showDetail === key ? "접기" : "더 알아보기"}</button>
            ${S.showDetail === key ? `<div class="mt-2 p-3 rounded bg-gray-900/50"><p class="text-[10px] text-gray-500 leading-relaxed">${sg.detail}</p></div>` : ""}
          ` : ""}
        </div>
      </div>
    </div>
  </div>`;
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
  const hash = window.location.hash.replace("#", "");
  if (hash) S.page = hash;
  // Test auth — if 401, show landing page with login
  const test = await fetch("/api/overview", { headers: authHeaders() });
  if (test.status === 401) { promptLogin(); return; }
  loadOverview();
  loadImages();
  render();
});

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash && hash !== S.page) { S.page = hash; render(); }
});
