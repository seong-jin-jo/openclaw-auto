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
  sidebarCollapsed: {}, showDetail: null, editingChannel: null,
  channelGuide: null, channelKeywords: null, notificationSettings: null, tenantInfo: null, chatChannels: null, communityPosts: [], r2Config: null, designTools: null, settingsTab: "channels",
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
  const [data, cronData, activity, chCfg, tokenData, alertData, weeklyData, llmData] = await Promise.all([
    API.get("/api/overview"), API.get("/api/cron-status"), API.get("/api/activity"), API.get("/api/channel-config"), API.get("/api/token-status"), API.get("/api/alerts"), API.get("/api/weekly-summary"), API.get("/api/llm-config"),
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
  if (llmData) S.llmConfig = llmData;
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
async function loadChannelGuideAndKeywords() {
  const ch = S.page === "threads" ? "threads" : S.page === "x" ? "x" : S.page;
  const [g, k] = await Promise.all([API.get(`/api/guide/${ch}`), API.get(`/api/keywords/${ch}`)]);
  if (g) S.channelGuide = g;
  if (k) S.channelKeywords = k;
  // Also load common for fallback
  if (!S.guide) { const cg = await API.get("/api/guide"); if (cg) S.guide = cg.guide || ""; }
  if (!S.keywords?.length) { const ck = await API.get("/api/keywords"); if (ck) S.keywords = ck.keywords || []; }
  render();
}
async function loadTenantAndChat() {
  const [t, c] = await Promise.all([API.get("/api/tenant-info"), API.get("/api/chat-channels")]);
  if (t) S.tenantInfo = t;
  if (c) S.chatChannels = c;
  render();
}
async function loadNotifSettings() { const d = await API.get("/api/notification-settings"); if (d) S.notificationSettings = d; render(); }
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
  else if (S.page === "instagram") app.innerHTML = renderChannelInstagram();
  else if (S.page === "images") app.innerHTML = renderImages();
  else if (S.page === "blog") app.innerHTML = renderBlog();
  else if (S.page === "zeroone_community") app.innerHTML = renderZeroOneCommunity();
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

const CH_LABELS = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", bluesky: "Bluesky", pinterest: "Pinterest", tumblr: "Tumblr", tiktok: "TikTok", youtube: "YouTube", telegram: "Telegram", discord: "Discord", slack: "Slack", line: "LINE", naver_blog: "Naver Blog", midjourney: "Midjourney", zeroone_community: "ZeroOne Community" };
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
  const liveCount = items.filter(i => i.status === "Live" || i.status === "Connected").length;
  const totalCount = items.length;
  // Auto-open: any live/connected channel → open. User toggle overrides.
  const collapsed = S.sidebarCollapsed[key] ?? (liveCount === 0);
  return `
    <div class="mt-4">
      <button data-sidebar-toggle="${key}" class="px-3 mb-1 w-full flex items-center justify-between cursor-pointer hover:opacity-80">
        <span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">${title}</span>
        <span class="flex items-center gap-1">
          ${totalCount > 0 ? `<span class="text-[9px] ${liveCount > 0 ? "text-green-600" : "text-gray-700"}">${liveCount}/${totalCount}</span>` : ""}
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

        ${sidebarGroup("blog", "Blog", [
          chSidebarItem("naver_blog"),
          { label: "Medium", icon: "M", soon: true },
          { label: "Substack", icon: "S", soon: true },
        ])}

        ${sidebarGroup("messaging", "Messaging", [
          ...["telegram", "discord", "slack", "line"].map(ch => chSidebarItem(ch)),
          { label: "Kakao Channel", icon: "K", soon: true },
          { label: "WhatsApp", icon: "W", soon: true },
        ])}

        ${sidebarGroup("data", "Data & SEO", [
          { label: "Google Analytics", icon: "GA", soon: true },
          { label: "Search Console", icon: "SC", soon: true },
          { label: "SEO Keywords", icon: "KW", soon: true },
          { label: "Google Business", icon: "GB", soon: true },
        ])}

        ${sidebarGroup("custom", "Custom Integration", [
          { key: "blog", label: "Blog", icon: "B", nav: true },
          { key: "zeroone_community", label: "ZeroOne Community", icon: "Z", nav: true },
          { label: "Custom API", icon: "+", soon: true },
          { label: "RSS Feed", icon: "R", soon: true },
        ])}

        <div class="px-3 mt-5 mb-2"><span class="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Assets & Tools</span></div>
        <button data-nav="images" class="sidebar-item ${S.page === "images" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Images
          <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500">${S.images.length}</span>
        </button>
        ${(() => { const mj = S.channelConfig.midjourney || {}; const mjStatus = mj.connected ? "text-green-400" : "text-gray-500"; return `
        <button data-nav="midjourney" class="sidebar-item ${S.page === "midjourney" ? "active" : ""} w-full text-left px-4 py-2 text-sm text-gray-300 flex items-center gap-3">
          <span class="w-4 h-4 rounded bg-indigo-900/50 flex items-center justify-center text-[8px] font-bold text-indigo-300">MJ</span>
          Midjourney
          <span class="ml-auto w-2 h-2 rounded-full ${mj.connected ? "bg-green-500" : "bg-gray-700"}"></span>
        </button>`; })()}

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
    { key: "telegram", label: "Telegram", icon: "TG" },
    { key: "discord", label: "Discord", icon: "DC" },
    { key: "slack", label: "Slack", icon: "SL" },
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
            <div class="flex justify-between"><span class="text-gray-500">Claude</span><span class="${S.tokenStatus.claude.healthy ? "text-green-400" : "text-red-400"}">${S.tokenStatus.claude.healthy ? "Healthy" : "Error"}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Token</span><span class="text-gray-400 font-mono text-xs">${S.tokenStatus.claude.tokenPreview || "..."}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Errors</span><span class="${S.tokenStatus.claude.errorCount > 0 ? "text-red-400" : "text-gray-300"}">${S.tokenStatus.claude.errorCount}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Last used</span><span class="text-gray-300">${S.tokenStatus.claude.lastUsed ? fmtAgo(new Date(S.tokenStatus.claude.lastUsed).toISOString()) : "-"}</span></div>
          </div>
          ${!S.tokenStatus.claude.healthy ? `<a data-nav="settings" class="block mt-2 text-[10px] text-red-400 hover:text-red-300 cursor-pointer">Settings에서 토큰 재등록 필요 →</a>` : ""}
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
          ${channelBadge("IG", ch.instagram)}
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
          ${["threads", "x", "instagram"].map(ch => {
            const chCfg = S.channelConfig[ch] || {};
            const enabled = chCfg.connected || chCfg.enabled;
            const checked = (p.channels?.[ch]?.status !== "skipped");
            const limit = ch === "x" ? 280 : ch === "instagram" ? 2200 : 500;
            const over = p.text.length > limit;
            const noImage = ch === "instagram" && !p.imageUrl;
            const chLabel = ch === "threads" ? "T" : ch === "x" ? "X" : "IG";
            return enabled ? `
              <label class="flex items-center gap-1 ${noImage ? "text-gray-600 line-through" : over ? "text-yellow-500" : "text-gray-400"}" ${noImage ? 'title="Instagram은 이미지 필수"' : ""}>
                <input type="checkbox" data-publish-channel="${p.id}:${ch}" ${checked && !noImage ? "checked" : ""} ${noImage ? "disabled" : ""} class="rounded border-gray-600 w-3 h-3">
                ${chLabel}${noImage ? " (no img)" : over ? ` (${p.text.length}/${limit})` : ""}
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
  // Check if cron is running
  const insightsCron = S.cronJobs.find(j => j.id === "threads-collect-insights" || j.name?.includes("반응"));
  const cronError = insightsCron && insightsCron.lastStatus === "error";
  const lastRun = insightsCron?.lastRunAt ? fmtAgo(new Date(insightsCron.lastRunAt).toISOString()) : null;
  return `
    ${cronError ? `<div class="p-3 rounded bg-yellow-900/20 border border-yellow-800/20 mb-4"><p class="text-[10px] text-yellow-400/80">자동화 일시 중단 — 데이터가 최신이 아닐 수 있습니다${lastRun ? ` (마지막 수집: ${lastRun})` : ""}</p></div>` : ""}
    ${s.totalPublished === 0 ? `<div class="p-3 rounded bg-gray-900/50 mb-4"><p class="text-xs text-gray-500">아직 발행된 글이 없습니다. Queue에서 draft를 승인하면 자동 발행됩니다.</p></div>` : ""}
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
    <div class="card p-5">${(() => {
      const tEditing = S.editingChannel === "threads";
      const tConnected = S.channelConfig.threads?.connected;
      const tEditable = tEditing || !tConnected;
      return `
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-300">Threads API Credentials</h3>
        <div class="flex items-center gap-2">
          <span class="text-[10px] px-2 py-0.5 rounded bg-purple-900/30 text-purple-400 border border-purple-800/30">Long-lived Token</span>
          ${tConnected && !tEditing ? `<button id="edit-ch-threads" class="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>` : ""}
        </div>
      </div>
      <div class="space-y-3 mb-3">
        ${credField("threads-accessToken", "Access Token", "", true, tk.accessToken, tEditable)}
        <div class="mt-2">${credField("threads-userId", "User ID", "", false, tk.userId, tEditable)}</div>
      </div>
      ${tEditable ? `
        <div class="flex gap-2">
          <button id="save-threads-config" class="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${tConnected ? "Update" : "Connect Threads"}</button>
          ${tConnected && tEditing ? `<button id="cancel-edit-ch-threads" class="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">Cancel</button>` : ""}
        </div>
      ` : ""}`;
    })()}</div>
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

  const featureToCronMap = {
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
  const featureToCron = featureToCronMap[channel] || featureToCronMap.threads;
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
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-300">Content Guide <span class="text-[10px] text-gray-600">(${channel})</span></h3>
          <div class="flex gap-2">
            <button id="copy-common-guide" class="px-2 py-1 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700">\uacf5\ud1b5\uc5d0\uc11c \ubcf5\uc0ac</button>
            <button id="save-guide" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
          </div>
        </div>
        <p class="text-[10px] text-gray-600 mb-2">${S.channelGuide?.channelGuide ? "\ucc44\ub110 \uc804\uc6a9 \uac00\uc774\ub4dc" : "\uacf5\ud1b5 \uac00\uc774\ub4dc \uc0ac\uc6a9 \uc911 \u2014 \uc218\uc815\ud558\uba74 \ucc44\ub110 \uc804\uc6a9\uc73c\ub85c \uc800\uc7a5"}</p>
        <textarea id="guide-textarea" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 font-mono" rows="10">${esc(S.channelGuide?.guide || S.guide)}</textarea>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-300">Keywords <span class="text-[10px] text-gray-600">(${channel})</span></h3>
          <div class="flex gap-2">
            <button id="copy-common-keywords" class="px-2 py-1 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700">\uacf5\ud1b5\uc5d0\uc11c \ubcf5\uc0ac</button>
            <button id="save-keywords" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
          </div>
        </div>
        <textarea id="keywords-textarea" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300" rows="6">${(S.channelKeywords?.keywords || S.keywords).join("\n")}</textarea>
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

function renderChannelInstagram() {
  const connected = S.channelConfig.instagram?.connected;
  const tabs = connected ? ["queue", "editor", "settings"] : ["settings"];
  const allPosts = S.queue || [];

  return `<div class="px-8 py-6">
    <button data-nav="overview" class="text-gray-500 hover:text-gray-300 text-sm mb-1">&larr; Back</button>
    <div class="flex items-center gap-3 mb-6">
      <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">IG</span>
      <div><h2 class="text-xl font-semibold text-white">Instagram</h2><p class="text-xs text-gray-500">${connected ? "Connected" : "Not connected"} ${S.channelConfig.instagram?.userId ? " &middot; ID: " + S.channelConfig.instagram.userId : ""}</p></div>
    </div>
    <div class="flex gap-1 mb-6 border-b border-gray-800/50 pb-3">
      ${tabs.map(t => `<button data-subtab="${t}" class="px-3 py-1.5 text-sm rounded ${S.subTab === t ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`).join("")}
    </div>
    ${S.subTab === "queue" && connected ? renderInstagramQueue(allPosts) : ""}
    ${S.subTab === "editor" && connected ? renderCardNewsEditor() : ""}
    ${S.subTab === "settings" ? renderInstagramSettings() : ""}
  </div>`;
}

function renderInstagramQueue(allPosts) {
  const filters = ["all", "draft", "approved", "published"];
  const igFilter = S.queueFilter || "all";

  let filtered = allPosts;
  if (igFilter === "draft") filtered = allPosts.filter(p => p.status === "draft");
  else if (igFilter === "approved") filtered = allPosts.filter(p => p.status === "approved");
  else if (igFilter === "published") filtered = allPosts.filter(p => p.status === "published" || p.channels?.instagram?.status === "published");

  const igPosts = filtered;
  const withImg = allPosts.filter(p => p.imageUrl).length;
  const igPublished = allPosts.filter(p => p.channels?.instagram?.status === "published").length;
  const igPending = allPosts.filter(p => p.imageUrl && p.status === "approved" && p.channels?.instagram?.status === "pending").length;

  return `
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="card p-3 text-center"><p class="text-lg font-bold text-white">${allPosts.length}</p><p class="text-[10px] text-gray-500">Total</p></div>
      <div class="card p-3 text-center"><p class="text-lg font-bold text-blue-400">${igPending}</p><p class="text-[10px] text-gray-500">Ready</p></div>
      <div class="card p-3 text-center"><p class="text-lg font-bold text-green-400">${igPublished}</p><p class="text-[10px] text-gray-500">Published</p></div>
    </div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex gap-1">${filters.map(f => {
        const label = f === "all" ? "All" : f === "with-image" ? "With Image" : f.charAt(0).toUpperCase() + f.slice(1);
        return `<button data-filter="${f}" class="px-3 py-1 text-xs rounded ${igFilter === f ? "bg-blue-600/30 text-blue-300 border border-blue-600/30" : "text-gray-500 hover:bg-gray-800"}">${label}</button>`;
      }).join("")}</div>
      <div class="flex gap-2 items-center">
        ${igPosts.filter(p => p.status === "draft" || p.status === "approved").length > 0 ? `<label class="flex items-center gap-1 text-xs text-gray-400 cursor-pointer"><input type="checkbox" id="ig-select-all" ${S.selectedIds.size > 0 ? "checked" : ""} class="rounded border-gray-600"> All</label>` : ""}
        ${S.selectedIds.size > 0 ? `
          <button id="ig-bulk-approve" class="px-3 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve (${S.selectedIds.size})</button>
          <button id="ig-bulk-delete" class="px-3 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600">Delete (${S.selectedIds.size})</button>
        ` : ""}
        <span class="text-xs text-gray-500">${igPosts.length} posts</span>
      </div>
    </div>
    <div class="space-y-3">
      ${igPosts.length === 0 ? `<div class="card p-8 text-center"><p class="text-gray-500 text-sm">No posts${igFilter === "with-image" ? " with images" : ""}</p></div>` : ""}
      ${igPosts.map(p => renderInstagramPost(p)).join("")}
    </div>`;
}

function renderInstagramPost(p) {
  const sc = { draft: "bg-yellow-900/50 text-yellow-300", approved: "bg-blue-900/50 text-blue-300", published: "bg-green-900/50 text-green-300", failed: "bg-red-900/50 text-red-300" };
  const igStatus = p.channels?.instagram?.status || "pending";
  const igBadge = { published: "bg-green-900/40 text-green-400", failed: "bg-red-900/40 text-red-400", pending: "bg-gray-800 text-gray-500", skipped: "bg-gray-800 text-gray-600" };
  const isEditing = S.editingPost === p.id;

  const slides = p.imageUrls || (p.imageUrl ? [p.imageUrl] : []);
  const isCard = slides.length > 1 || p.cardBatchId;

  return `
    <div class="card p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          ${p.status === "draft" || p.status === "approved" ? `<input type="checkbox" data-select="${p.id}" ${S.selectedIds.has(p.id) ? "checked" : ""} class="rounded border-gray-600 w-3.5 h-3.5">` : ""}
          <span class="text-[10px] px-2 py-0.5 rounded ${sc[p.status] || "bg-gray-700 text-gray-300"}">${p.status}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded ${igBadge[igStatus]}">IG: ${igStatus}</span>
          ${isCard ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300">Card ${slides.length} slides</span>` : ""}
        </div>
        <span class="text-[10px] text-gray-600">${esc((p.id || "").slice(0, 8))}</span>
      </div>

      ${slides.length > 0 ? `
        <div class="mb-3">
          <div class="flex gap-2 overflow-x-auto pb-2" style="scrollbar-width:thin; scrollbar-color:#374151 transparent">
            ${slides.map((s, i) => `<div class="flex-shrink-0 w-36 h-44 rounded-lg overflow-hidden border border-gray-800">
              <img src="${esc(s)}" alt="Slide ${i + 1}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\\'flex items-center justify-center w-full h-full bg-gray-900 text-[10px] text-gray-600\\'>Slide ${i + 1}</div>'">
            </div>`).join("")}
          </div>
        </div>
      ` : `
        <div class="mb-3 w-36 h-44 rounded-lg border border-dashed border-gray-700 bg-gray-900/30 flex items-center justify-center">
          <span class="text-gray-600 text-xs">No Image</span>
        </div>
      `}

      <!-- Topic -->
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-medium text-gray-300">${esc(p.topic || "general")}</span>
        ${p.model ? `<span class="text-[10px] text-gray-600">${esc(p.model)}</span>` : ""}
      </div>

      <!-- Caption text -->
      ${isEditing ? `
        <textarea id="edit-textarea" class="w-full bg-gray-800 text-gray-200 text-sm p-2 rounded border border-gray-700 mb-2" rows="4">${esc(p.text)}</textarea>
        <div class="flex gap-2">
          <button data-save="${p.id}" class="px-2 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
          <button data-cancel-edit class="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>
          <button data-pick-image="${p.id}" class="px-2 py-1 text-xs bg-purple-700 text-white rounded hover:bg-purple-600">${p.imageUrl ? "Change" : "Add"} Image</button>
        </div>
      ` : `<p class="text-sm text-gray-300 mb-2 whitespace-pre-wrap line-clamp-4">${esc(p.text)}</p>`}

      <!-- Hashtags -->
      ${p.hashtags?.length ? `<div class="flex flex-wrap gap-1 mb-3">${p.hashtags.map(h => `<span class="text-[10px] text-blue-400">#${h}</span>`).join("")}</div>` : ""}

      <!-- Actions -->
      ${!isEditing ? `
        <div class="flex gap-2 pt-2 border-t border-gray-800/50">
          ${p.status === "draft" ? `<button data-approve="${p.id}" class="px-3 py-1.5 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve</button>` : ""}
          ${p.status === "draft" || p.status === "approved" ? `<button data-edit-card="${p.id}" class="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Edit</button>` : ""}
          ${p.status === "draft" ? `<button data-delete="${p.id}" class="px-3 py-1.5 text-xs bg-red-900/40 text-red-300 rounded hover:bg-red-800">Delete</button>` : ""}
      ` : ""}
    </div>`;
}

function renderCardNewsEditor() {
  const ed = S.cardEditor || { title: "", slides: [""], style: "dark", ending: "", caption: "", hashtags: "", generating: false, result: null };
  if (!S.cardEditor) S.cardEditor = ed;
  const result = ed.result;

  return `
    ${ed.editingPostId ? `<button id="back-to-queue" class="text-gray-500 hover:text-gray-300 text-xs mb-3 block">← Queue로 돌아가기</button>` : ""}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Left: Editor -->
      <div class="space-y-4">
        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-4">카드뉴스 만들기</h3>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] text-gray-500 block mb-1">주제 입력</label>
              <div class="flex gap-2">
                <input id="card-title" type="text" value="${esc(ed.title)}" placeholder="예: AI 코딩 도구 비교 2026" class="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300">
                <button id="card-ai-outline" class="px-3 py-2 bg-purple-700 text-white text-xs rounded hover:bg-purple-600 flex-shrink-0 ${ed.outlining ? "opacity-50 cursor-wait" : ""}" ${ed.outlining ? "disabled" : ""}>${ed.outlining ? "생성중..." : "AI 초안"}</button>
              </div>
              <p class="text-[10px] text-gray-600 mt-1">주제 입력 후 "AI 초안" 클릭하면 슬라이드 내용을 자동 생성합니다</p>
            </div>
            <div>
              <label class="text-[10px] text-gray-500 block mb-1">스타일</label>
              <div class="flex gap-2">
                ${["dark", "light", "gradient", "tech", "warm"].map(s => `<button data-card-style="${s}" class="px-3 py-1.5 text-xs rounded ${ed.style === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}">${s}</button>`).join("")}
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-[10px] text-gray-500">슬라이드 (각 장의 텍스트)</label>
                <button id="card-add-slide" class="text-[10px] text-blue-400 hover:text-blue-300">+ 슬라이드 추가</button>
              </div>
              <div class="space-y-2" id="card-slides-editor">
                ${ed.slides.map((s, i) => `
                  <div class="flex gap-2">
                    <span class="text-[10px] text-gray-600 mt-2 w-4">${i + 1}</span>
                    <textarea data-card-slide="${i}" class="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300" rows="3" placeholder="슬라이드 ${i + 1} 내용">${esc(s)}</textarea>
                    ${ed.slides.length > 1 ? `<button data-card-remove-slide="${i}" class="text-red-400 hover:text-red-300 text-xs mt-2">✕</button>` : ""}
                  </div>
                `).join("")}
              </div>
            </div>
            <div>
              <label class="text-[10px] text-gray-500 block mb-1">엔딩 슬라이드</label>
              <input id="card-ending" type="text" value="${esc(ed.ending)}" placeholder="자세한 내용은 프로필 링크에서 확인하세요" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300">
            </div>
            <button id="card-generate-btn" class="w-full py-2.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 ${ed.generating ? "opacity-50 cursor-wait" : ""}" ${ed.generating ? "disabled" : ""}>${ed.generating ? "생성 중..." : "카드뉴스 생성"}</button>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-3">캡션 & 해시태그</h3>
          <textarea id="card-caption" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 mb-2" rows="4" placeholder="Instagram 캡션을 입력하세요">${esc(ed.caption)}</textarea>
          <input id="card-hashtags" type="text" value="${esc(ed.hashtags)}" placeholder="#AI #코딩 #개발 ..." class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300">
        </div>
      </div>

      <!-- Right: Preview -->
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">프리뷰</h3>
        ${result ? `
          <div class="mb-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[10px] text-gray-500">${result.slides.length} slides</p>
              <div class="flex gap-2">
                <button id="card-add-image" class="text-[10px] text-blue-400 hover:text-blue-300">+ 이미지 추가</button>
                <button id="card-download-slides" class="text-[10px] text-gray-500 hover:text-gray-400">다운로드</button>
              </div>
            </div>
            <div id="slides-container" class="flex gap-2 overflow-x-auto pb-2" style="scrollbar-width:thin">
              ${result.slides.map((s, i) => `
                <div class="flex-shrink-0 relative group" draggable="true" data-slide-idx="${i}" style="min-width:128px">
                  <div class="w-32 h-40 rounded-lg overflow-hidden border border-gray-700 cursor-pointer" data-preview-slide="${i}">
                    <img src="${esc(s)}" alt="Slide ${i + 1}" class="w-full h-full object-cover pointer-events-none">
                  </div>
                  <button data-remove-slide="${i}" class="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">✕</button>
                  <span class="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">${i + 1}</span>
                </div>
              `).join("")}
            </div>
          </div>
          <input type="file" id="card-upload-input" multiple accept="image/*" class="hidden">

          <div class="space-y-2 mb-3">
            <button id="card-save-draft" class="w-full py-2 bg-green-700 text-white text-sm rounded hover:bg-green-600">${ed.editingPostId ? "Draft 업데이트" : "큐에 Draft 저장"}</button>
            <div class="flex gap-2">
              ${S.designTools?.figma?.mcpAccessToken ? `<button id="card-figma-push" class="flex-1 py-1.5 bg-indigo-700 text-white text-xs rounded hover:bg-indigo-600">Figma에 올리기</button>` : ""}
              ${S.designTools?.figma?.mcpAccessToken ? `<button id="card-figma-pull" class="flex-1 py-1.5 bg-indigo-900 text-indigo-300 text-xs rounded hover:bg-indigo-800 border border-indigo-700">Figma에서 가져오기</button>` : ""}
            </div>
            <div class="flex gap-2">
              <button id="card-regenerate" class="flex-1 py-1.5 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600">카드 재생성</button>
            </div>
            <details class="text-[10px]">
              <summary class="text-gray-500 cursor-pointer hover:text-gray-400">미드저니 이미지 추가 (선택)</summary>
              <div class="mt-2 flex gap-2">
                <input id="mj-bg-prompt" type="text" placeholder="이미지 프롬프트 (영문 권장)" class="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300">
                <button id="mj-bg-generate" class="px-3 py-1.5 bg-amber-700 text-white text-xs rounded hover:bg-amber-600 flex-shrink-0">생성</button>
              </div>
            </details>
          </div>
        ` : `
          <div class="flex items-center justify-center h-64 text-gray-600">
            <div class="text-center">
              <p class="text-sm mb-1">카드뉴스를 생성하면 여기에 프리뷰가 표시됩니다</p>
              <p class="text-[10px]">제목 + 슬라이드 텍스트 입력 후 "카드뉴스 생성" 클릭</p>
            </div>
          </div>
        `}
      </div>
    </div>`;
}

function renderInstagramSettings() {
  const ch = S.channelConfig.instagram || {};
  const keys = ch.keys || {};
  const hasKeys = Object.values(keys).some(v => v);
  const cs = (S.channelSettings.settings || {}).instagram || {};
  const features = S.channelSettings.features || [];

  const igFeatures = ["content_generation", "auto_publish", "instagram_carousel", "image_generation"];
  const igFeatureToCron = {
    content_generation: "instagram-generate-drafts",
    auto_publish: "instagram-auto-publish",
  };

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">Credentials</h3>
        <div class="space-y-3">
          ${credField("ch-instagram-accessToken", "Graph API Access Token", "", true, keys.accessToken || "")}
          ${credField("ch-instagram-userId", "Instagram Business User ID", "", false, keys.userId || "")}
        </div>
        <button id="save-ch-instagram" class="w-full mt-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${hasKeys ? "Update" : "Connect"}</button>
        <div class="mt-4 card p-4 bg-gray-900/50">
          <h4 class="text-xs font-medium text-gray-400 mb-2">Setup Guide</h4>
          <ol class="text-[10px] text-gray-500 space-y-1 list-decimal list-inside">
            <li>Instagram을 Business/Creator 계정으로 전환</li>
            <li>Facebook Page 생성 후 Instagram 계정 연결</li>
            <li>developers.facebook.com > 앱 만들기</li>
            <li>Instagram Graph API + Content Publishing 제품 추가</li>
            <li>테스터 등록 후 Instagram 앱에서 수락</li>
            <li>Graph API Explorer에서 토큰 생성</li>
            <li>GET /me/accounts → 페이지 ID → GET /{페이지ID}?fields=instagram_business_account → id가 User ID</li>
          </ol>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">Automation</h3>
        <div id="channel-automation-instagram"></div>
      </div>
    </div>`;
}

function credField(id, label, desc, isSecret = false, fullValue = "", editable = true) {
  return `<div>
    <label class="text-xs text-gray-400 block mb-0.5">${label} ${desc ? `<span class="text-gray-600">${desc}</span>` : ""}</label>
    <div class="relative">
      <input id="${id}" type="${isSecret ? "password" : "text"}" value="${esc(fullValue)}" placeholder="${label}" ${editable ? "" : "readonly"} class="w-full ${editable ? "bg-gray-900" : "bg-gray-900/50 cursor-default"} border border-gray-700 rounded px-3 py-2 pr-16 text-[11px] text-gray-300 placeholder-gray-600 font-mono" title="${esc(fullValue)}">
      ${isSecret ? `<button type="button" data-toggle-vis="${id}" class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-300">Show</button>` : ""}
    </div>
  </div>`;
}

function renderXSettings() {
  const connected = S.channelConfig.x?.connected;
  const k = S.channelConfig.x?.keys || {};
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">${(() => {
        const xEditing = S.editingChannel === "x";
        const xEditable = xEditing || !connected;
        return `
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-300">OAuth 1.0 Keys</h3>
          <div class="flex items-center gap-2">
            <span class="text-[10px] px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-800/30">OAuth 1.0a</span>
            ${connected && !xEditing ? `<button id="edit-ch-x" class="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>` : ""}
          </div>
        </div>
        <div class="space-y-4">
          <div class="border-b border-gray-800/50 pb-3">
            <p class="text-[10px] text-gray-500 uppercase tracking-wide mb-2">\uc18c\ube44\uc790 \ud0a4 (Consumer Keys)</p>
            ${credField("x-apiKey", "\uc18c\ube44\uc790 \ud0a4 (API Key)", "", false, k.apiKey, xEditable)}
            <div class="mt-2">${credField("x-apiKeySecret", "\uc18c\ube44\uc790 \uc2dc\ud06c\ub9bf (API Key Secret)", "", true, k.apiKeySecret, xEditable)}</div>
          </div>
          <div>
            <p class="text-[10px] text-gray-500 uppercase tracking-wide mb-2">\uc561\uc138\uc2a4 \ud1a0\ud070 (Access Token)</p>
            ${credField("x-accessToken", "\uc561\uc138\uc2a4 \ud1a0\ud070 (Access Token)", "", false, k.accessToken, xEditable)}
            <div class="mt-2">${credField("x-accessTokenSecret", "\uc561\uc138\uc2a4 \ud1a0\ud070 \uc2dc\ud06c\ub9bf (Access Token Secret)", "", true, k.accessTokenSecret, xEditable)}</div>
          </div>
        </div>
        ${xEditable ? `
          <div class="flex gap-2 mt-4">
            <button id="save-x-config" class="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${connected ? "Update" : "Connect X Account"}</button>
            ${connected && xEditing ? `<button id="cancel-edit-ch-x" class="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">Cancel</button>` : ""}
          </div>
        ` : ""}`;
      })()}</div>
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

      <!-- Content Guide + Keywords (X) -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-300">Content Guide <span class="text-[10px] text-gray-600">(X)</span></h3>
          <div class="flex gap-2">
            <button id="copy-common-guide" class="px-2 py-1 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700">\uacf5\ud1b5\uc5d0\uc11c \ubcf5\uc0ac</button>
            <button id="save-guide" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
          </div>
        </div>
        <p class="text-[10px] text-gray-600 mb-2">${S.channelGuide?.channelGuide ? "X \uc804\uc6a9 \uac00\uc774\ub4dc" : "\uacf5\ud1b5 \uac00\uc774\ub4dc \uc0ac\uc6a9 \uc911 \u2014 \uc218\uc815\ud558\uba74 X \uc804\uc6a9\uc73c\ub85c \uc800\uc7a5"} (280\uc790 \uc81c\ud55c \uace0\ub824)</p>
        <textarea id="guide-textarea" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 font-mono" rows="10">${esc(S.channelGuide?.guide || S.guide)}</textarea>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-300">Search Keywords <span class="text-[10px] text-gray-600">(X)</span></h3>
          <div class="flex gap-2">
            <button id="copy-common-keywords" class="px-2 py-1 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700">\uacf5\ud1b5\uc5d0\uc11c \ubcf5\uc0ac</button>
            <button id="save-keywords" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
          </div>
        </div>
        <textarea id="keywords-textarea" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300" rows="6">${(S.channelKeywords?.keywords || S.keywords).join("\n")}</textarea>
      </div>
    </div>`;
}

// ── Settings Page ──
function renderSettings() {
  const stab = S.settingsTab || "channels";
  const settingsTabs = [
    { key: "channels", label: "Channels", desc: "발행 채널 연결" },
    { key: "ai", label: "AI Engine", desc: "LLM 모델 + 토큰" },
    { key: "storage", label: "Storage", desc: "이미지 저장소" },
    { key: "design", label: "Design Tools", desc: "Canva / Figma" },
    { key: "system", label: "System", desc: "크론 + 계정" },
  ];

  return `<div class="px-8 py-6">
    <h2 class="text-xl font-semibold text-white mb-1">Settings</h2>
    <p class="text-sm text-gray-500 mb-6">서비스 설정 — 각 항목이 어디에서 사용되는지 확인하세요</p>
    <div class="flex gap-1 mb-6 border-b border-gray-800/50 pb-3">
      ${settingsTabs.map(t => `<button data-settings-tab="${t.key}" class="px-3 py-1.5 text-sm rounded ${stab === t.key ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}">${t.label}</button>`).join("")}
    </div>

    ${(() => { try {
      if (stab === "channels") return renderSettingsChannels();
      if (stab === "ai") return renderSettingsAI();
      if (stab === "storage") return renderSettingsStorage();
      if (stab === "design") return renderSettingsDesign();
      if (stab === "system") return renderSettingsSystem();
      return "";
    } catch(e) { return `<div class="card p-5"><p class="text-red-400 text-sm">Render error: ${e.message}</p></div>`; } })()}
  </div>`;
}

function renderSettingsChannels() {
  const chRow = (key, icon, iconClass, label, sub) => {
    const ch = S.channelConfig[key] || {};
    const connected = ch.connected || ch.enabled;
    return `<div class="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 cursor-pointer hover:bg-gray-800/50" data-nav="${key}">
      <div class="flex items-center gap-3"><span class="w-6 h-6 rounded ${iconClass} flex items-center justify-center text-[8px] font-bold text-white">${icon}</span><div><p class="text-xs text-gray-300">${label}</p><p class="text-[10px] text-gray-600">${sub}</p></div></div>
      <span class="text-[10px] ${connected ? "text-green-400" : "text-gray-600"}">${connected ? "Connected" : ""}</span>
    </div>`;
  };
  return `
    <p class="text-[10px] text-gray-500 mb-4">콘텐츠를 발행할 SNS 채널. 클릭하면 해당 채널 설정으로 이동합니다.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-3">Social</h3>
        <div class="space-y-2">
          ${chRow("threads", "T", "bg-gradient-to-br from-purple-500 to-pink-500", "Threads", S.channelConfig.threads?.userId ? "ID: " + S.channelConfig.threads.userId : "")}
          ${chRow("x", "X", "bg-gray-700", "X (Twitter)", S.channelConfig.x?.connected ? "OAuth 1.0a" : "")}
          ${chRow("instagram", "IG", "bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600", "Instagram", S.channelConfig.instagram?.userId ? "ID: " + S.channelConfig.instagram.userId : "")}
        </div>
      </div>
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-3">Messaging & Others</h3>
        <div class="space-y-2">
          ${chRow("telegram", "TG", "bg-blue-500", "Telegram", "")}
          ${chRow("discord", "DC", "bg-indigo-600", "Discord", "")}
          ${chRow("slack", "SL", "bg-green-700", "Slack", "")}
        </div>
      </div>
    </div>`;
}

function renderSettingsAI() {
  return `
    <p class="text-[10px] text-gray-500 mb-4">모든 채널의 콘텐츠 자동 생성 + 트렌드 분석에 사용됩니다.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">LLM Model</h3>
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
            <div class="border-t border-gray-800/50 pt-3">
              <p class="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Per-Job Override</p>
              <div class="space-y-2">
                ${Object.entries(S.llmConfig.jobModels || {}).map(([job, model]) => `
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] text-gray-400 flex-shrink-0 w-40 truncate">${job}</span>
                    <select data-job-model="${job}" class="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-300">
                      <option value="" ${!model || model === S.llmConfig.primary ? "selected" : ""}>Default</option>
                      ${(S.llmConfig.available || []).filter(m => m !== S.llmConfig.primary).map(m => `<option value="${m}" ${m === model ? "selected" : ""}>${m.split("/").pop()}</option>`).join("")}
                    </select>
                  </div>
                `).join("")}
              </div>
            </div>
            <button id="save-llm-config" class="w-full mt-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">Save</button>
          </div>
        ` : `<p class="text-xs text-gray-600">Loading...</p>`}
      </div>
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">Claude Token</h3>
        ${S.tokenStatus?.claude ? `
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] px-2 py-0.5 rounded ${S.tokenStatus.claude.healthy ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}">${S.tokenStatus.claude.healthy ? "Healthy" : "Error"}</span>
            <span class="text-[10px] text-gray-600">${S.tokenStatus.claude.type || "token"}</span>
          </div>
          <div class="space-y-1 text-[10px] mb-3">
            <div class="flex justify-between"><span class="text-gray-500">Errors</span><span class="${S.tokenStatus.claude.errorCount > 0 ? "text-red-400" : "text-gray-400"}">${S.tokenStatus.claude.errorCount}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Last used</span><span class="text-gray-400">${S.tokenStatus.claude.lastUsed ? fmtAgo(new Date(S.tokenStatus.claude.lastUsed).toISOString()) : "-"}</span></div>
          </div>
        ` : ""}
        <div class="space-y-3">
          ${credField("claude-token-input", "Setup Token 또는 API Key", "", true, S.tokenStatus?.claude?.tokenPreview || "")}
          <details class="text-[10px]">
            <summary class="text-blue-400 hover:text-blue-300 cursor-pointer">Setup Guide</summary>
            <div class="mt-2 p-2 rounded bg-gray-900/50 text-gray-500 space-y-1">
              <p>1. 터미널에서 <code class="bg-gray-800 px-1 rounded">claude setup-token</code> 실행</p>
              <p>2. 브라우저에서 Anthropic 로그인</p>
              <p>3. 생성된 <code class="bg-gray-800 px-1 rounded">sk-ant-oat01-...</code> 토큰 복사</p>
              <p>4. 위 필드에 붙여넣기 → Update Token</p>
            </div>
          </details>
          <button id="save-claude-token" class="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${S.tokenStatus?.claude?.tokenPreview ? "Update Token" : "Connect"}</button>
        </div>
      </div>
    </div>`;
}

function renderSettingsStorage() {
  const r2 = S.r2Config || {};
  const r2Connected = !!(r2.bucket && r2.accessKeyId);
  const editing = S.editingChannel === "r2";
  const editable = editing || !r2Connected;
  return `
    <p class="text-[10px] text-gray-500 mb-4">Instagram, Threads 등 이미지 발행 시 공용 업로드 저장소. 모든 채널에서 사용됩니다.</p>
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-300">Cloudflare R2</h3>
        <span class="text-[10px] px-2 py-0.5 rounded ${r2Connected ? "bg-green-900/40 text-green-400" : "bg-yellow-900/40 text-yellow-400"}">${r2Connected ? "Connected" : "Not configured"}</span>
      </div>
      <details class="mb-3 text-[10px]">
        <summary class="text-blue-400 hover:text-blue-300 cursor-pointer">Setup Guide — R2 설정법</summary>
        <div class="mt-2 p-3 rounded bg-gray-900/50 text-gray-500 space-y-1.5">
          <p class="font-medium text-gray-400">1. 버킷 생성</p>
          <p class="pl-3">dash.cloudflare.com > R2 > Create bucket</p>
          <p class="font-medium text-gray-400">2. 퍼블릭 액세스</p>
          <p class="pl-3">버킷 > Settings > Public Development URL > Enable > <code class="bg-gray-800 px-1 rounded">allow</code> 입력</p>
          <p class="font-medium text-gray-400">3. API 토큰</p>
          <p class="pl-3">R2 Overview > Account Details > S3 API > Manage > Create Account API token</p>
          <p class="pl-3">Permission: Object Read & Write, Bucket 선택, TTL 기본값</p>
          <p class="pl-3 text-yellow-500">⚠ Secret Access Key는 생성 시 한 번만 표시됨</p>
          <p class="font-medium text-gray-400">4. 아래 입력</p>
          <p class="pl-3">Access Key ID, Secret, Bucket, S3 Endpoint, Public URL</p>
        </div>
      </details>
      <div class="flex items-center justify-between mb-3">
        <span class="text-[10px] text-gray-500">Credentials</span>
        ${r2Connected && !editing ? '<button id="edit-r2" class="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>' : ""}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${credField("r2-access-key", "Access Key ID", "", false, r2.accessKeyId || "", editable)}
        ${credField("r2-secret-key", "Secret Access Key", "", true, r2.secretAccessKey || "", editable)}
        ${credField("r2-bucket", "Bucket Name", "", false, r2.bucket || "", editable)}
        ${credField("r2-endpoint", "S3 Endpoint", "", false, r2.endpoint || "", editable)}
        ${credField("r2-public-url", "Public URL", "", false, r2.publicUrl || "", editable)}
      </div>
      ${editable ? `<div class="flex gap-2 mt-4">
        <button id="save-r2-config" class="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${r2Connected ? "Update" : "Connect"}</button>
        ${r2Connected && editing ? '<button id="cancel-edit-r2" class="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">Cancel</button>' : ""}
      </div>` : ""}
    </div>`;
}

function renderSettingsDesign() {
  const canva = S.designTools?.canva || {};
  const figma = S.designTools?.figma || {};
  const canvaConnected = !!canva.clientId;
  const figmaConnected = !!figma.accessToken;
  const canvaEditing = S.editingChannel === "canva";
  const figmaEditing = S.editingChannel === "figma";
  const canvaEditable = canvaEditing || !canvaConnected;
  const figmaEditable = figmaEditing || !figmaConnected;

  return `
    <p class="text-[10px] text-gray-500 mb-4">Instagram 카드뉴스를 전문 툴에서 리터치 후 가져오기. 연결하면 Create 탭에서 "편집" 버튼이 활성화됩니다.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded bg-[#00C4CC] flex items-center justify-center text-[9px] font-bold text-white">C</span>
            <h3 class="text-sm font-medium text-gray-300">Canva</h3>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded ${canvaConnected ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}">${canvaConnected ? "Connected" : "Not connected"}</span>
        </div>

        <div class="mb-3">
          <ol class="text-[10px] text-gray-400 space-y-1.5 list-decimal list-inside">
            <li><a href="https://www.canva.com/developers/" target="_blank" class="text-blue-400 hover:underline">canva.com/developers</a> 접속 → Canva 계정으로 로그인 (포털은 영어)</li>
            <li>좌측 메뉴에서 <strong class="text-gray-300">Your integrations</strong> (내 통합) 클릭</li>
            <li>우측 상단 <strong class="text-gray-300">Create an integration</strong> (통합 만들기) 버튼 클릭</li>
            <li>이름 입력 (예: marketing-hub) → Type: <strong class="text-gray-300">Private</strong> (비공개) 선택 → 약관 체크 → <strong class="text-gray-300">Create integration</strong></li>
            <li>생성된 앱의 설정 페이지 → <strong class="text-gray-300">Credentials</strong> (자격 증명) 섹션에서 <strong class="text-gray-300">Client ID</strong> 복사</li>
            <li><strong class="text-gray-300">Generate secret</strong> (시크릿 생성) 버튼 → 표시된 값 즉시 복사 (페이지 벗어나면 재확인 불가!)</li>
            <li>아래 폼에 Client ID + Secret 입력 → Connect</li>
          </ol>
          <details class="mt-2 text-[10px]">
            <summary class="text-blue-400 hover:text-blue-300 cursor-pointer">더 알아보기</summary>
            <div class="mt-2 p-3 rounded bg-gray-900/50 text-gray-500 space-y-1.5">
              <p>Canva Connect API로 에셋 업로드 → 템플릿 기반 디자인 생성 → 편집 → Export PNG 플로우를 자동화합니다.</p>
              <p class="font-medium text-gray-400 mt-2">Scopes 설정</p>
              <p>앱 설정 페이지 좌측 메뉴 <strong>Scopes</strong> 클릭 → <strong>Reading and writing</strong> 섹션에서 체크:</p>
              <p class="pl-2">✅ <code class="bg-gray-800 px-1 rounded">design:content</code> Read and Write — 디자인 생성/수정</p>
              <p class="pl-2">✅ <code class="bg-gray-800 px-1 rounded">design:meta</code> Read — 디자인 메타데이터</p>
              <p class="pl-2">✅ <code class="bg-gray-800 px-1 rounded">asset</code> Read and Write — 이미지 업로드</p>
              <p class="pl-2">✅ <code class="bg-gray-800 px-1 rounded">brandtemplate:meta</code> Read — 템플릿 읽기</p>
              <p class="pl-2">✅ <code class="bg-gray-800 px-1 rounded">brandtemplate:content</code> Read — 템플릿 내용</p>
              <p class="pl-2">✅ <code class="bg-gray-800 px-1 rounded">profile</code> Read — 프로필 정보</p>
              <p class="font-medium text-gray-400 mt-2">OAuth Redirect URL (앱 페이지 > Authentication 탭)</p>
              <p>URL 1 필드에 입력: <code class="bg-gray-800 px-1 rounded">https://대시보드주소/api/canva/callback</code></p>
              <p>Return navigation 스위치 ON → Return URL도 동일하게 설정</p>
              <p class="font-medium text-gray-400 mt-2">앱 유형</p>
              <p>Private: 내 팀만 사용. Public: Canva 마켓플레이스에 공개 (심사 필요).</p>
            </div>
          </details>
        </div>

        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] text-gray-500">Credentials</span>
          ${canvaConnected && !canvaEditing ? '<button id="edit-canva" class="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>' : ""}
        </div>
        <div class="space-y-3">
          ${credField("canva-client-id", "Client ID", "", false, canva.clientId || "", canvaEditable)}
          ${credField("canva-client-secret", "Client Secret", "", true, canva.clientSecret || "", canvaEditable)}
        </div>
        ${canvaEditable ? `<div class="flex gap-2 mt-4">
          <button id="save-canva" class="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${canvaConnected ? "Update" : "Connect"}</button>
          ${canvaConnected && canvaEditing ? '<button id="cancel-edit-canva" class="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">Cancel</button>' : ""}
        </div>` : ""}
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded bg-black border border-gray-700 flex items-center justify-center text-[10px] font-bold text-white">F</span>
            <h3 class="text-sm font-medium text-gray-300">Figma</h3>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded ${figmaConnected ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}">${figmaConnected ? "Connected" : "Not connected"}</span>
        </div>

        <div class="mb-3">
          <ol class="text-[10px] text-gray-400 space-y-1.5 list-decimal list-inside">
            <li><a href="https://www.figma.com" target="_blank" class="text-blue-400 hover:underline">figma.com</a> 접속 → 로그인 → 좌상단 계정 아이콘 → <strong class="text-gray-300">Settings</strong></li>
            <li><strong class="text-gray-300">Security</strong> 탭 → 아래로 스크롤 → <strong class="text-gray-300">Personal access tokens</strong></li>
            <li><strong class="text-gray-300">Generate new token</strong> → 이름 입력 → Scopes에서 <code class="bg-gray-800 px-1 rounded">file_content:read</code>, <code class="bg-gray-800 px-1 rounded">files:read</code> 체크</li>
            <li>Enter → 표시된 토큰 <strong class="text-red-400">즉시 복사</strong> (페이지 벗어나면 재확인 불가!) → 아래 폼에 입력 → Connect</li>
          </ol>

          <details class="mt-3 text-[10px]">
            <summary class="text-blue-400 hover:text-blue-300 cursor-pointer">MCP 서버 연결 (AI가 Figma에 직접 쓰기)</summary>
            <div class="mt-2 p-3 rounded bg-gray-900/50 text-gray-500 space-y-2">
              <p class="text-gray-300 font-medium">MCP란?</p>
              <p>AI Agent가 Figma 캔버스에 직접 프레임/텍스트/이미지를 생성하는 프로토콜. REST API는 읽기만 가능하지만, MCP는 <strong>쓰기</strong>가 됩니다.</p>

              <p class="text-gray-300 font-medium mt-3">Remote MCP 서버 (권장 — 설치 불필요)</p>
              <p>Figma가 호스팅하는 서버에 연결. 별도 프로그램 설치 없이 URL만 등록하면 됩니다.</p>

              <p class="text-gray-400 font-medium mt-2">연결 방법 — Claude Code에서:</p>
              <div class="p-2 rounded bg-gray-800 font-mono mt-1 space-y-1">
                <p class="text-green-400"># 방법 1: 플러그인 (가장 쉬움)</p>
                <p>claude plugin install figma@claude-plugins-official</p>
                <p class="text-green-400 mt-2"># 방법 2: 수동 등록</p>
                <p>claude mcp add --transport http figma https://mcp.figma.com/mcp</p>
              </div>
              <p class="mt-1">실행 후 브라우저에서 Figma 로그인 → <strong>Allow Access</strong> 클릭</p>

              <p class="text-gray-400 font-medium mt-2">VS Code에서:</p>
              <p>⌘+Shift+P → "MCP: Open User Configuration" → 아래 JSON 추가:</p>
              <div class="p-2 rounded bg-gray-800 font-mono mt-1">
                <p>"figma": { "url": "https://mcp.figma.com/mcp", "type": "http" }</p>
              </div>

              <p class="text-gray-400 font-medium mt-2">OpenClaw Gateway에서:</p>
              <p>config/openclaw.json에 MCP 서버 등록 (지원되는 경우):</p>
              <div class="p-2 rounded bg-gray-800 font-mono mt-1">
                <p>"mcp": { "figma": { "url": "https://mcp.figma.com/mcp" } }</p>
              </div>

              <p class="text-gray-300 font-medium mt-3">MCP로 할 수 있는 것</p>
              <p>✅ 프레임/텍스트/이미지 생성 및 수정</p>
              <p>✅ 컴포넌트, 변수, Auto Layout 활용</p>
              <p>✅ 디자인 시스템을 기반으로 일관된 디자인</p>
              <p>✅ 현재 Beta 무료 (이후 사용량 기반 유료)</p>

              <p class="text-gray-300 font-medium mt-3">REST API vs MCP 차이</p>
              <div class="mt-1 space-y-0.5">
                <p><strong>REST API</strong> (위에서 입력한 토큰): 파일 읽기 + PNG Export만 가능. 쓰기 불가.</p>
                <p><strong>MCP 서버</strong>: 읽기 + <strong>쓰기</strong>. AI가 직접 캔버스에 디자인 생성/수정.</p>
                <p>→ 둘 다 필요: MCP로 생성, REST API로 Export</p>
              </div>

              <p class="text-gray-300 font-medium mt-3">자동화 흐름</p>
              <p>1. 카드뉴스 텍스트 입력 (대시보드)</p>
              <p>2. AI Agent가 MCP로 Figma에 슬라이드 프레임 자동 생성</p>
              <p>3. 디자이너가 Figma에서 리터치</p>
              <p>4. REST API로 PNG Export → R2 업로드 → 큐 저장</p>
              <p>5. Instagram 캐러셀 발행</p>
            </div>
          </details>

          <details class="mt-2 text-[10px]">
            <summary class="text-blue-400 hover:text-blue-300 cursor-pointer">더 알아보기</summary>
            <div class="mt-2 p-3 rounded bg-gray-900/50 text-gray-500 space-y-1.5">
              <p class="font-medium text-gray-400">Personal Access Token 주의</p>
              <p>토큰 하나로 Figma 계정의 <strong>모든 파일</strong>에 접근 가능. 신뢰할 수 있는 환경에서만 사용. 통합당 토큰 1개 생성 권장.</p>
              <p class="font-medium text-gray-400 mt-2">Scopes (권한) 상세</p>
              <p><code class="bg-gray-800 px-1 rounded">file_content:read</code> — 파일 노드/레이어 읽기, PNG Export에 필수</p>
              <p><code class="bg-gray-800 px-1 rounded">files:read</code> — 파일 목록 접근</p>
              <p><code class="bg-gray-800 px-1 rounded">file_dev_resources:write</code> — 개발 리소스 쓰기 (선택)</p>
              <p class="font-medium text-gray-400 mt-2">지원 MCP 클라이언트</p>
              <p>Claude Code, VS Code (Copilot), Cursor, Codex — <a href="https://developers.figma.com/docs/figma-mcp-server/" target="_blank" class="text-blue-400 hover:underline">전체 목록</a></p>
            </div>
          </details>
        </div>

        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] text-gray-500">Credentials</span>
          ${figmaConnected && !figmaEditing ? '<button id="edit-figma" class="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>' : ""}
        </div>
        <div class="space-y-3">
          ${credField("figma-token", "Personal Access Token", "", true, figma.accessToken || "", figmaEditable)}
        </div>
        ${figmaEditable ? `<div class="flex gap-2 mt-4">
          <button id="save-figma" class="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${figmaConnected ? "Update" : "Connect"}</button>
          ${figmaConnected && figmaEditing ? '<button id="cancel-edit-figma" class="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">Cancel</button>' : ""}
        </div>` : ""}

        ${figmaConnected ? `
        <div class="mt-4 pt-4 border-t border-gray-800/50">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-xs text-gray-300">MCP 서버 (AI → Figma 쓰기)</p>
              <p class="text-[10px] text-gray-600">AI가 Figma에 카드뉴스 프레임을 자동 생성</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="figma-mcp-toggle" ${figma.mcpEnabled ? "checked" : ""} class="sr-only peer">
              <div class="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
          ${figma.mcpEnabled && !figma.mcpAccessToken ? `
            <div class="p-3 rounded bg-yellow-900/10 border border-yellow-800/30 space-y-3 text-[10px]">
              <p class="text-yellow-400 font-medium">MCP 연결 필요</p>
              <p class="text-gray-500">Figma 계정으로 로그인하여 MCP 접근을 허용합니다.</p>
              <button id="figma-mcp-oauth-btn" class="w-full py-2.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500 font-medium">Figma 계정으로 MCP 연결</button>
              <p class="text-gray-600">클릭하면 Figma 로그인 페이지가 새 탭으로 열립니다. Allow 클릭 후 자동 완료.</p>
            </div>
          ` : ""}
          ${figma.mcpEnabled && figma.mcpAccessToken ? `
            <div class="flex items-center justify-between mt-2">
              <p class="text-[10px] text-green-400">MCP 연결됨</p>
              <button id="restart-gateway-figma" class="px-3 py-1 text-[10px] bg-yellow-700 text-white rounded hover:bg-yellow-600">Gateway 재시작</button>
            </div>
          ` : ""}
        </div>
        ` : ""}
      </div>
    </div>`;
}

function renderSettingsSystem() {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-4">Cron Status</h3>
        <p class="text-[10px] text-gray-500 mb-3">자동화 작업 실행 현황</p>
          <div class="space-y-2.5">
            ${S.cronJobs.map(j => {
              const dot = j.lastStatus === "ok" ? "bg-green-500" : j.lastStatus === "error" ? "bg-red-500" : "bg-gray-600";
              return `<div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full ${dot}"></div><span class="text-xs text-gray-300">${esc(j.name)}</span></div><span class="text-[10px] text-gray-500">${j.lastStatus === "error" ? '<span class="text-red-400">error</span>' : fmtTime(j.nextRunAt)}</span></div>`;
            }).join("")}
          </div>
        </div>
      </div>
      <div class="space-y-4">
        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-4">Account</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Auth</span><span class="text-gray-300">${getAuthToken() ? "Token set" : "No auth"}</span></div>
          </div>
          ${getAuthToken() ? `
            <div class="flex gap-2 mt-4">
              <button id="btn-logout" class="px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">Logout</button>
              <button id="btn-change-pw" class="px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">Change Token</button>
            </div>
          ` : ""}
        </div>
        <div class="card p-5">
          <h3 class="text-sm font-medium text-gray-300 mb-4">Notifications</h3>
          ${S.notificationSettings ? `
            <div class="space-y-3">
              ${["onPublish", "onViral", "onError", "weeklyReport"].map(evt => {
                const labels = { onPublish: "글 발행 시", onViral: "바이럴 감지 시", onError: "크론 에러 시", weeklyReport: "주간 리포트" };
                const ns = S.notificationSettings[evt] || { enabled: false, channels: [] };
                return `
                  <div class="flex items-center justify-between p-2 rounded bg-gray-900/50">
                    <div class="flex items-center gap-2">
                      <input type="checkbox" data-notif-event="${evt}" ${ns.enabled ? "checked" : ""} class="rounded border-gray-600 w-3 h-3">
                      <span class="text-xs text-gray-300">${labels[evt]}</span>
                    </div>
                    <select data-notif-channel="${evt}" class="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-300">
                      <option value="">Off</option>
                      ${["telegram", "discord", "slack"].map(ch => `<option value="${ch}" ${ns.channels?.includes(ch) ? "selected" : ""}>${ch}</option>`).join("")}
                    </select>
                  </div>`;
              }).join("")}
            </div>
            <div class="flex gap-2 mt-3">
              <button id="save-notif-settings" class="flex-1 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">Save</button>
              <button id="test-notif" class="px-4 py-2 bg-gray-800 text-gray-300 text-xs rounded hover:bg-gray-700">Test</button>
            </div>
          ` : `<p class="text-xs text-gray-600">Loading...</p>`}
        </div>
      </div>
    </div>`;
}

// ── Event Binding ──
function bindEvents() {
  // Render channel automation sections
  ["instagram"].forEach(ch => {
    const container = document.getElementById(`channel-automation-${ch}`);
    if (container) container.innerHTML = renderChannelAutomation(ch);
  });

  // Load card news slides asynchronously
  document.querySelectorAll("[data-load-slides]").forEach(async el => {
    const batchId = el.dataset.loadSlides;
    if (!batchId || el.dataset.loaded) return;
    el.dataset.loaded = "1";
    try {
      const data = await API.get(`/api/card-slides/${batchId}`);
      if (data?.slides?.length > 0) {
        el.innerHTML = data.slides.map((s, i) => `
          <div class="flex-shrink-0 w-36 h-44 rounded-lg overflow-hidden border border-gray-800 snap-start">
            <img src="${esc(s.url)}" alt="Slide ${i + 1}" class="w-full h-full object-cover">
          </div>
        `).join("");
      }
    } catch (e) { /* keep loading placeholder */ }
  });

  document.querySelectorAll("[data-nav]").forEach(el => { el.onclick = () => navigate(el.dataset.nav); });
  document.querySelectorAll("[data-sidebar-toggle]").forEach(el => { el.onclick = () => { S.sidebarCollapsed[el.dataset.sidebarToggle] = !S.sidebarCollapsed[el.dataset.sidebarToggle]; render(); }; });
  // Claude token update
  const saveToken = document.getElementById("save-claude-token");
  if (saveToken) saveToken.onclick = async () => {
    const input = document.getElementById("claude-token-input");
    const token = input?.value?.trim();
    if (!token) { showToast("토큰을 입력하세요", "warning"); return; }
    if (!token.startsWith("sk-ant-")) { showToast("잘못된 토큰 형식 (sk-ant-...)", "error"); return; }
    saveToken.textContent = "Updating..."; saveToken.disabled = true;
    const r = await API.post("/api/claude-token", { token });
    saveToken.textContent = "Update Token"; saveToken.disabled = false;
    if (r?.ok) {
      showToast(`Claude 토큰 업데이트 완료 (${r.type})`, "success");
      input.value = "";
      loadOverview();
    } else {
      showToast(`토큰 업데이트 실패: ${r?.error || "Unknown error"}`, "error");
    }
  };

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

  // Notification settings
  const saveNotif = document.getElementById("save-notif-settings");
  if (saveNotif) saveNotif.onclick = async () => {
    const settings = {};
    ["onPublish", "onViral", "onError", "weeklyReport"].forEach(evt => {
      const checkbox = document.querySelector(`[data-notif-event="${evt}"]`);
      const select = document.querySelector(`[data-notif-channel="${evt}"]`);
      settings[evt] = { enabled: checkbox?.checked || false, channels: select?.value ? [select.value] : [] };
    });
    const r = await API.post("/api/notification-settings", settings);
    if (r) { showToast("알림 설정 저장됨", "success"); loadNotifSettings(); }
  };
  const testNotif = document.getElementById("test-notif");
  if (testNotif) testNotif.onclick = async () => {
    // Find first configured channel
    const ns = S.notificationSettings || {};
    let ch = "";
    for (const evt of ["onError", "onViral", "onPublish"]) {
      if (ns[evt]?.channels?.length) { ch = ns[evt].channels[0]; break; }
    }
    if (!ch) { showToast("알림 채널을 먼저 설정하세요", "warning"); return; }
    const r = await API.post("/api/send-notification", { channel: ch, message: "🔔 Marketing Hub 테스트 알림" });
    if (r?.ok) showToast(`테스트 알림 전송: ${ch}`, "success");
    else showToast(`전송 실패: ${r?.error || "unknown"}`, "error");
  };

  // Interactive Chat setup
  const setupTg = document.getElementById("setup-chat-telegram");
  if (setupTg) setupTg.onclick = async () => {
    const token = document.getElementById("chat-telegram-token")?.value?.trim();
    if (!token) { showToast("Bot Token을 입력하세요", "warning"); return; }
    setupTg.textContent = "Verifying..."; setupTg.disabled = true;
    const r = await API.post("/api/chat-channels/telegram", { token });
    setupTg.textContent = "Connect"; setupTg.disabled = false;
    if (r?.verified) {
      showToast(`Telegram 봇 연결: ${r.bot}. ${r.note}`, "success");
      loadTenantAndChat();
    } else {
      showToast(`연결 실패: ${r?.error || "unknown"}`, "error");
    }
  };

  // Weekly report send
  const sendReport = document.getElementById("send-weekly-report");
  if (sendReport) sendReport.onclick = async () => {
    sendReport.textContent = "발송 중..."; sendReport.disabled = true;
    const r = await API.post("/api/weekly-report/send", {});
    sendReport.textContent = "주간 리포트 발송"; sendReport.disabled = false;
    if (r?.ok) showToast("주간 리포트 발송 완료", "success");
    else showToast(`발송 실패: ${r?.error || "unknown"}`, "error");
  };

  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) logoutBtn.onclick = () => { localStorage.removeItem("dashboard_auth_token"); location.reload(); };
  const changePwBtn = document.getElementById("btn-change-pw");
  if (changePwBtn) changePwBtn.onclick = () => { localStorage.removeItem("dashboard_auth_token"); promptLogin(); };
  document.querySelectorAll("[data-subtab]").forEach(el => { el.onclick = () => { S.subTab = el.dataset.subtab; switchSubTab(el.dataset.subtab); }; });
  document.querySelectorAll("[data-filter]").forEach(el => { el.onclick = () => { S.queueFilter = el.dataset.filter; if (S.page === "instagram") { loadQueue("all"); } else { loadQueue(S.queueFilter); } }; });
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

  const ch = S.page === "threads" ? "threads" : S.page === "x" ? "x" : (CH_LABELS[S.page] ? S.page : null);
  const guideUrl = ch ? `/api/guide/${ch}` : "/api/guide";
  const kwUrl = ch ? `/api/keywords/${ch}` : "/api/keywords";

  const saveGd = document.getElementById("save-guide");
  if (saveGd) saveGd.onclick = async () => {
    const ta = document.getElementById("guide-textarea");
    if (ta) { const r = await API.post(guideUrl, { guide: ta.value }); if (r) { showToast(`가이드 저장됨 (${ch || "공통"})`, "success"); loadChannelGuideAndKeywords(); } }
  };
  const copyGuide = document.getElementById("copy-common-guide");
  if (copyGuide) copyGuide.onclick = () => {
    const ta = document.getElementById("guide-textarea");
    if (ta && S.channelGuide?.common) { ta.value = S.channelGuide.common; showToast("공통 가이드 복사됨", "info"); }
  };

  const saveKw = document.getElementById("save-keywords");
  if (saveKw) saveKw.onclick = async () => {
    const ta = document.getElementById("keywords-textarea");
    if (ta) { const kw = ta.value.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#")); const r = await API.post(kwUrl, { keywords: kw }); if (r) { showToast(`키워드 저장됨 (${ch || "공통"})`, "success"); loadChannelGuideAndKeywords(); } }
  };
  const copyKw = document.getElementById("copy-common-keywords");
  if (copyKw) copyKw.onclick = () => {
    const ta = document.getElementById("keywords-textarea");
    if (ta && S.channelKeywords?.common) { ta.value = S.channelKeywords.common.join("\n"); showToast("공통 키워드 복사됨", "info"); }
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
  document.querySelectorAll("[data-ig-toggle]").forEach(el => {
    el.onchange = async () => {
      const key = el.dataset.igToggle;
      const r = await API.post("/api/channel-settings/instagram", { [key]: el.checked });
      if (r) showToast(`Instagram ${key} ${el.checked ? "ON" : "OFF"}`, "success");
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
      if (r.verified) { showToast(`Threads 연결 완료${r.account ? " — " + r.account : ""}`, "success"); S.editingChannel = null; }
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
      if (r.verified) { showToast(`X 연결 완료${r.account ? " — " + r.account : ""}`, "success"); S.editingChannel = null; }
      else showToast(`연결 실패: ${r.error || "Invalid credentials"}`, "error");
      loadOverview();
    }
  };

  // Channel edit toggle (all channels including threads/x)
  [...Object.keys(CH_LABELS), "threads", "x"].forEach(key => {
    const editBtn = document.getElementById(`edit-ch-${key}`);
    if (editBtn) editBtn.onclick = () => { S.editingChannel = key; render(); };
    const cancelBtn = document.getElementById(`cancel-edit-ch-${key}`);
    if (cancelBtn) cancelBtn.onclick = () => { S.editingChannel = null; render(); };
  });

  // Messaging test send
  ["telegram", "discord", "slack", "line"].forEach(ch => {
    const btn = document.getElementById(`send-test-${ch}`);
    if (btn) btn.onclick = async () => {
      const msg = document.getElementById(`test-msg-${ch}`)?.value || "test";
      btn.textContent = "Sending..."; btn.disabled = true;
      const r = await API.post("/api/send-notification", { channel: ch, message: msg });
      btn.textContent = "Send"; btn.disabled = false;
      if (r?.ok) showToast(`${ch} 전송 완료`, "success");
      else showToast(`전송 실패: ${r?.error || "unknown"}`, "error");
    };
  });

  // Detail toggle
  document.querySelectorAll("[data-toggle-detail]").forEach(el => { el.onclick = () => { S.showDetail = S.showDetail === el.dataset.toggleDetail ? null : el.dataset.toggleDetail; render(); }; });

  // Generic channel credential save
  Object.keys(CH_LABELS).forEach(key => {
    const btn = document.getElementById(`save-ch-${key}`);
    if (btn) btn.onclick = async () => {
      const sg = { facebook: ["accessToken","pageId"], bluesky: ["handle","appPassword"], instagram: ["accessToken","userId"], linkedin: ["accessToken","personUrn"], pinterest: ["accessToken","boardId"], tumblr: ["consumerKey","consumerSecret","accessToken","accessTokenSecret","blogName"], tiktok: ["accessToken"], youtube: ["accessToken"], telegram: ["botToken","chatId"], discord: ["webhookUrl"], slack: ["webhookUrl"], line: ["channelAccessToken"], naver_blog: ["blogId","username","apiKey"], midjourney: ["discordToken","channelId","serverId"] };
      const fields = sg[key] || [];
      const data = {};
      fields.forEach(f => { const el = document.getElementById(`ch-${key}-${f}`); if (el?.value) data[f] = el.value; });
      const origText = btn.textContent;
      btn.textContent = "Verifying..."; btn.disabled = true;
      const r = await API.post(`/api/channel-config/${key}`, data);
      btn.textContent = origText; btn.disabled = false;
      if (r) {
        if (r.verified) { showToast(`${CH_LABELS[key]} 연결 완료${r.account ? " — " + r.account : ""}`, "success"); S.editingChannel = null; }
        else showToast(`연결 실패: ${r.error || "Invalid credentials"}`, "error");
        loadOverview();
      }
    };
  });

  // Settings tabs
  document.querySelectorAll("[data-settings-tab]").forEach(el => {
    el.onclick = () => {
      S.settingsTab = el.dataset.settingsTab;
      const loaders = {
        channels: () => loadOverview(),
        ai: () => { loadLlmConfig(); loadOverview(); },
        storage: () => loadR2Config(),
        design: () => loadDesignTools(),
        system: () => { loadOverview(); loadNotifSettings(); },
      };
      (loaders[el.dataset.settingsTab] || (() => {}))();
      render();
    };
  });

  // R2 Storage Config
  const editR2 = document.getElementById("edit-r2");
  if (editR2) editR2.onclick = () => { S.editingChannel = "r2"; render(); };
  const cancelR2 = document.getElementById("cancel-edit-r2");
  if (cancelR2) cancelR2.onclick = () => { S.editingChannel = null; render(); };
  const saveR2 = document.getElementById("save-r2-config");
  if (saveR2) saveR2.onclick = async () => {
    const data = {
      accessKeyId: document.getElementById("r2-access-key")?.value?.trim(),
      secretAccessKey: document.getElementById("r2-secret-key")?.value?.trim(),
      bucket: document.getElementById("r2-bucket")?.value?.trim(),
      endpoint: document.getElementById("r2-endpoint")?.value?.trim(),
      publicUrl: document.getElementById("r2-public-url")?.value?.trim(),
    };
    saveR2.textContent = "Saving..."; saveR2.disabled = true;
    const r = await API.post("/api/r2-config", data);
    saveR2.textContent = "Update"; saveR2.disabled = false;
    if (r?.ok) { showToast("R2 Storage 설정 저장됨", "success"); loadR2Config(); }
    else showToast(r?.error || "저장 실패", "error");
  };

  // Design Tools credentials
  const editCanva = document.getElementById("edit-canva");
  if (editCanva) editCanva.onclick = () => { S.editingChannel = "canva"; render(); };
  const cancelCanva = document.getElementById("cancel-edit-canva");
  if (cancelCanva) cancelCanva.onclick = () => { S.editingChannel = null; render(); };
  const saveCanva = document.getElementById("save-canva");
  if (saveCanva) saveCanva.onclick = async () => {
    const data = { clientId: document.getElementById("canva-client-id")?.value?.trim(), clientSecret: document.getElementById("canva-client-secret")?.value?.trim() };
    if (!data.clientId) { showToast("Client ID를 입력하세요", "warning"); return; }
    saveCanva.textContent = "Saving..."; saveCanva.disabled = true;
    const r = await API.post("/api/design-tools/canva", data);
    saveCanva.textContent = "Connect"; saveCanva.disabled = false;
    if (r?.ok) { showToast("Canva 설정 저장됨", "success"); S.editingChannel = null; loadDesignTools(); }
    else showToast(r?.error || "저장 실패", "error");
  };
  const editFigma = document.getElementById("edit-figma");
  if (editFigma) editFigma.onclick = () => { S.editingChannel = "figma"; render(); };
  const cancelFigma = document.getElementById("cancel-edit-figma");
  if (cancelFigma) cancelFigma.onclick = () => { S.editingChannel = null; render(); };
  const saveFigma = document.getElementById("save-figma");
  if (saveFigma) saveFigma.onclick = async () => {
    const data = { accessToken: document.getElementById("figma-token")?.value?.trim(), fileUrl: document.getElementById("figma-file-url")?.value?.trim() };
    if (!data.accessToken) { showToast("Access Token을 입력하세요", "warning"); return; }
    saveFigma.textContent = "Saving..."; saveFigma.disabled = true;
    const r = await API.post("/api/design-tools/figma", data);
    saveFigma.textContent = "Connect"; saveFigma.disabled = false;
    if (r?.ok) { showToast("Figma 설정 저장됨", "success"); S.editingChannel = null; loadDesignTools(); }
    else showToast(r?.error || "저장 실패", "error");
  };

  // Gateway restart
  document.querySelectorAll("[id^='restart-gateway']").forEach(el => {
    el.onclick = async () => {
      el.textContent = "재시작 중..."; el.disabled = true;
      const r = await API.post("/api/gateway/restart");
      el.textContent = "Gateway 재시작"; el.disabled = false;
      if (r?.ok) showToast("Gateway 재시작 완료. 15초 후 사용 가능.", "success");
      else showToast(r?.error || "재시작 실패", "error");
    };
  });

  // Figma MCP OAuth + toggle
  const figmaMcpOAuth = document.getElementById("figma-mcp-oauth-btn");
  if (figmaMcpOAuth) figmaMcpOAuth.onclick = async () => {
    figmaMcpOAuth.textContent = "연결 준비 중..."; figmaMcpOAuth.disabled = true;
    const r = await API.get("/api/figma-mcp/start-oauth");
    if (r?.authUrl) {
      window.open(r.authUrl, "_blank");
      showToast("Figma 로그인 페이지가 열렸습니다. Allow 클릭 후 자동 완료됩니다.", "info");
      // Poll for completion
      const poll = setInterval(async () => {
        const dt = await API.get("/api/design-tools");
        if (dt?.figma?.mcpAccessToken) {
          clearInterval(poll);
          showToast("Figma MCP 연결 완료! Gateway 재시작 필요.", "success");
          S.designTools = dt;
          render();
        }
      }, 3000);
      setTimeout(() => clearInterval(poll), 120000); // 2min timeout
    } else {
      showToast(r?.error || "OAuth 시작 실패", "error");
    }
    figmaMcpOAuth.textContent = "Figma 계정으로 MCP 연결"; figmaMcpOAuth.disabled = false;
  };
  const figmaMcpToggle = document.getElementById("figma-mcp-toggle");
  if (figmaMcpToggle) figmaMcpToggle.onchange = async () => {
    const r = await API.post("/api/design-tools/figma-mcp", { enabled: figmaMcpToggle.checked });
    if (r?.ok) {
      showToast(figmaMcpToggle.checked ? "Figma MCP 활성화 — gateway 재시작 필요" : "Figma MCP 비활성화", "success");
      loadDesignTools();
    } else showToast(r?.error || "설정 실패", "error");
  };

  // Instagram bulk actions
  const igSelectAll = document.getElementById("ig-select-all");
  if (igSelectAll) igSelectAll.onchange = () => {
    const posts = (S.queue || []).filter(p => (p.status === "draft" || p.status === "approved") && p.imageUrl);
    if (igSelectAll.checked) posts.forEach(p => S.selectedIds.add(p.id));
    else S.selectedIds.clear();
    render();
  };
  const igBulkApprove = document.getElementById("ig-bulk-approve");
  if (igBulkApprove) igBulkApprove.onclick = async () => {
    const ids = [...S.selectedIds];
    const r = await API.post("/api/queue/bulk-approve", { ids });
    if (r) { showToast(`${r.approved || ids.length}개 승인`, "success"); S.selectedIds.clear(); loadQueue("all"); }
  };
  const igBulkDelete = document.getElementById("ig-bulk-delete");
  if (igBulkDelete) igBulkDelete.onclick = async () => {
    if (!confirm(`${S.selectedIds.size}개 삭제?`)) return;
    const ids = [...S.selectedIds];
    const r = await API.post("/api/queue/bulk-delete", { ids });
    if (r) { showToast(`${r.deleted || ids.length}개 삭제`, "success"); S.selectedIds.clear(); loadQueue("all"); }
  };

  // Queue: Figma push/pull for draft posts
  document.querySelectorAll("[data-queue-figma-push]").forEach(el => {
    el.onclick = async () => {
      const post = (S.queue || []).find(p => p.id === el.dataset.queueFigmaPush);
      if (!post?.imageUrls?.length) { showToast("슬라이드가 없습니다", "warning"); return; }
      el.textContent = "올리는 중..."; el.disabled = true;
      const r = await API.post("/api/figma/create-slides", {
        title: post.topic || "", slides: [post.text?.substring(0, 50) || ""], style: "tech",
        imageUrls: post.imageUrls, batchId: post.cardBatchId || "",
      });
      el.textContent = "Figma에 올리기"; el.disabled = false;
      if (r?.success) {
        showToast("Figma에 올림", "success");
        if (r.figmaUrl) window.open(r.figmaUrl, "_blank");
      } else showToast(r?.error || "실패", "error");
    };
  });
  document.querySelectorAll("[data-queue-figma-pull]").forEach(el => {
    el.onclick = async () => {
      const postId = el.dataset.queueFigmaPull;
      const fileUrl = prompt("Figma 파일 URL:");
      if (!fileUrl) return;
      const match = fileUrl.match(/figma\.com\/(?:design|file)\/([^/]+)/);
      if (!match) { showToast("올바른 Figma URL이 아닙니다", "error"); return; }
      el.textContent = "가져오는 중..."; el.disabled = true;
      const r = await API.post("/api/figma/export-to-queue", { fileKey: match[1], postId });
      el.textContent = "Figma에서 가져오기"; el.disabled = false;
      if (r?.ok) { showToast(`${r.count}장 가져옴`, "success"); loadQueue("all"); }
      else showToast(r?.error || "실패", "error");
    };
  });

  // Queue: Midjourney add
  document.querySelectorAll("[data-queue-mj]").forEach(el => {
    el.onclick = async () => {
      const postId = el.dataset.queueMj;
      const prompt = window.prompt("미드저니 프롬프트 (영문 권장):");
      if (!prompt) return;
      el.textContent = "생성 중..."; el.disabled = true;
      const r = await API.post("/api/midjourney/generate", { prompt: prompt + " --ar 4:5" });
      el.textContent = "미드저니 추가"; el.disabled = false;
      if (r?.success && r.imagePath) {
        await API.post(`/api/queue/${postId}/add-image`, { imageUrl: r.imagePath });
        showToast("미드저니 이미지 추가됨", "success");
        loadQueue("all");
      } else showToast(r?.error || "미드저니 생성 실패", "error");
    };
  });

  // Queue: Image upload
  document.querySelectorAll("[data-queue-upload]").forEach(el => {
    el.onclick = () => {
      const postId = el.dataset.queueUpload;
      const input = document.createElement("input");
      input.type = "file"; input.multiple = true; input.accept = "image/*";
      input.onchange = async () => {
        for (const file of input.files) {
          const formData = new FormData();
          formData.append("file", file);
          try {
            const res = await fetch("/api/images/upload", { method: "POST", headers: authHeaders(), body: formData });
            const d = await res.json();
            if (d.url) await API.post(`/api/queue/${postId}/add-image`, { imageUrl: d.url });
          } catch(e) {}
        }
        showToast(`${input.files.length}장 추가됨`, "success");
        loadQueue("all");
      };
      input.click();
    };
  });

  // Edit Slides — load card into Create tab
  document.querySelectorAll("[data-edit-card]").forEach(el => {
    el.onclick = () => {
      const postId = el.dataset.editCard;
      const post = (S.queue || []).find(p => p.id === postId);
      if (!post) return;
      S.cardEditor = {
        title: post.topic?.replace("instagram-card", "").trim() || "",
        slides: [""], // will be loaded from images
        style: "dark",
        ending: "",
        caption: post.text || "",
        hashtags: (post.hashtags || []).map(h => "#" + h).join(" "),
        generating: false,
        result: post.imageUrls ? { slides: post.imageUrls, batchId: post.cardBatchId, totalSlides: post.imageUrls.length } : null,
        editingPostId: postId,
      };
      S.subTab = "editor";
      render();
    };
  });

  // Card News Editor — AI Outline
  const aiOutlineBtn = document.getElementById("card-ai-outline");
  if (aiOutlineBtn) aiOutlineBtn.onclick = async () => {
    const title = document.getElementById("card-title")?.value?.trim();
    if (!title) { showToast("주제를 입력하세요", "warning"); return; }
    if (!S.cardEditor) S.cardEditor = { title, slides: [""], style: "dark", ending: "", caption: "", hashtags: "", generating: false, result: null };
    S.cardEditor.title = title;
    S.cardEditor.outlining = true; render();
    const r = await API.post("/api/card-news/outline", { title });
    S.cardEditor.outlining = false;
    if (r?.success) {
      S.cardEditor.slides = r.slides || [""];
      S.cardEditor.caption = r.caption || "";
      S.cardEditor.hashtags = (r.hashtags || []).map(h => "#" + h).join(" ");
      showToast(`${r.slides?.length || 0}장 초안 생성 완료`, "success");
    } else { showToast(r?.error || "초안 생성 실패", "error"); }
    render();
  };

  // Card News Editor — Generate
  const cardGenBtn = document.getElementById("card-generate-btn");
  if (cardGenBtn) cardGenBtn.onclick = async () => {
    const ed = S.cardEditor || {};
    ed.title = document.getElementById("card-title")?.value || "";
    ed.ending = document.getElementById("card-ending")?.value || "";
    ed.caption = document.getElementById("card-caption")?.value || "";
    ed.hashtags = document.getElementById("card-hashtags")?.value || "";
    document.querySelectorAll("[data-card-slide]").forEach(el => { ed.slides[parseInt(el.dataset.cardSlide)] = el.value; });
    if (!ed.title) { showToast("제목을 입력하세요", "warning"); return; }
    if (!ed.slides.some(s => s.trim())) { showToast("슬라이드 내용을 입력하세요", "warning"); return; }
    ed.generating = true; S.cardEditor = ed; render();
    const r = await API.post("/api/card-news/generate", { title: ed.title, slides: ed.slides.filter(s => s.trim()), style: ed.style, ending: ed.ending || ed.title });
    ed.generating = false;
    if (r?.success) { ed.result = r; showToast(`카드뉴스 ${r.totalSlides}장 생성 완료`, "success"); }
    else showToast(r?.error || "생성 실패", "error");
    S.cardEditor = ed; render();
  };
  document.querySelectorAll("[data-card-style]").forEach(el => {
    el.onclick = () => { if (!S.cardEditor) S.cardEditor = { title: "", slides: [""], style: "dark", ending: "", caption: "", hashtags: "", generating: false, result: null }; S.cardEditor.style = el.dataset.cardStyle; render(); };
  });
  const addSlideBtn = document.getElementById("card-add-slide");
  if (addSlideBtn) addSlideBtn.onclick = () => {
    if (!S.cardEditor) return;
    document.querySelectorAll("[data-card-slide]").forEach(el => { S.cardEditor.slides[parseInt(el.dataset.cardSlide)] = el.value; });
    S.cardEditor.slides.push(""); render();
  };
  document.querySelectorAll("[data-card-remove-slide]").forEach(el => {
    el.onclick = () => {
      const idx = parseInt(el.dataset.cardRemoveSlide);
      document.querySelectorAll("[data-card-slide]").forEach(el2 => { S.cardEditor.slides[parseInt(el2.dataset.cardSlide)] = el2.value; });
      S.cardEditor.slides.splice(idx, 1); render();
    };
  });
  const saveDraftBtn = document.getElementById("card-save-draft");
  if (saveDraftBtn) saveDraftBtn.onclick = async () => {
    const ed = S.cardEditor;
    if (!ed?.result) return;
    const caption = document.getElementById("card-caption")?.value || ed.title;
    const hashStr = document.getElementById("card-hashtags")?.value || "";
    const hashtags = hashStr.split(/[#\s]+/).filter(h => h.trim());
    const r = await API.post("/api/queue/add", {
      text: caption, topic: "instagram-card", hashtags,
      imageUrl: ed.result.slides[0], imageUrls: ed.result.slides, cardBatchId: ed.result.batchId,
    });
    if (r?.success) { showToast("큐에 Draft 저장됨", "success"); ed.result = null; ed.title = ""; ed.slides = [""]; ed.caption = ""; ed.hashtags = ""; S.cardEditor = ed; loadQueue("all"); }
    else showToast(r?.error || "저장 실패", "error");
  };
  const regenBtn = document.getElementById("card-regenerate");
  if (regenBtn) regenBtn.onclick = () => { if (S.cardEditor) { S.cardEditor.result = null; render(); } };
  // Slide drag & drop reorder
  const slidesContainer = document.getElementById("slides-container");
  if (slidesContainer) {
    let dragIdx = null;
    slidesContainer.querySelectorAll("[data-slide-idx]").forEach(el => {
      el.addEventListener("dragstart", e => {
        dragIdx = parseInt(el.dataset.slideIdx);
        el.style.opacity = "0.4";
        e.dataTransfer.effectAllowed = "move";
      });
      el.addEventListener("dragend", () => { el.style.opacity = "1"; });
      el.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; });
      el.addEventListener("drop", e => {
        e.preventDefault();
        const dropIdx = parseInt(el.dataset.slideIdx);
        if (dragIdx !== null && dragIdx !== dropIdx && S.cardEditor?.result?.slides) {
          const slides = S.cardEditor.result.slides;
          const [moved] = slides.splice(dragIdx, 1);
          slides.splice(dropIdx, 0, moved);
          render();
        }
        dragIdx = null;
      });
    });
  }

  // Slide image preview (click to enlarge)
  document.querySelectorAll("[data-preview-slide]").forEach(el => {
    el.onclick = () => {
      const idx = parseInt(el.dataset.previewSlide);
      const src = S.cardEditor?.result?.slides?.[idx];
      if (!src) return;
      const overlay = document.createElement("div");
      overlay.className = "fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer";
      overlay.style.backdropFilter = "blur(4px)";
      overlay.innerHTML = `<img src="${src}" class="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl">`;
      overlay.onclick = () => overlay.remove();
      document.body.appendChild(overlay);
    };
  });

  // Back to queue from editor
  const backToQueue = document.getElementById("back-to-queue");
  if (backToQueue) backToQueue.onclick = () => { S.subTab = "queue"; S.cardEditor = null; loadQueue("all"); render(); };

  // Slide management
  document.querySelectorAll("[data-remove-slide]").forEach(el => {
    el.onclick = () => {
      if (S.cardEditor?._mjGenerating) { showToast("미드저니 생성 중 — 완료 후 삭제하세요", "warning"); return; }
      const idx = parseInt(el.dataset.removeSlide);
      if (S.cardEditor?.result?.slides) {
        S.cardEditor.result.slides.splice(idx, 1);
        S.cardEditor.result.totalSlides = S.cardEditor.result.slides.length;
        render();
      }
    };
  });
  // (drag & drop replaces arrow buttons for slide reorder)
  const addImageBtn = document.getElementById("card-add-image");
  if (addImageBtn) addImageBtn.onclick = () => document.getElementById("card-upload-input")?.click();

  // Figma pull
  const figmaPull = document.getElementById("card-figma-pull");
  if (figmaPull) figmaPull.onclick = async () => {
    const fileUrl = prompt("Figma 파일 URL을 입력하세요:");
    if (!fileUrl) return;
    const match = fileUrl.match(/figma\.com\/(?:design|file)\/([^/]+)/);
    if (!match) { showToast("올바른 Figma URL이 아닙니다", "error"); return; }
    figmaPull.textContent = "가져오는 중..."; figmaPull.disabled = true;
    const r = await API.post("/api/figma/export", { fileKey: match[1] });
    figmaPull.textContent = "Figma에서 가져오기"; figmaPull.disabled = false;
    if (r?.success && r.images) {
      const urls = Object.values(r.images).filter(u => u);
      if (urls.length && S.cardEditor?.result) {
        // Download and upload each image
        for (const imgUrl of urls) {
          try {
            const resp = await fetch(imgUrl);
            const blob = await resp.blob();
            const formData = new FormData();
            formData.append("file", blob, "figma-export.png");
            const upResp = await fetch("/api/images/upload", { method: "POST", headers: authHeaders(), body: formData });
            const upData = await upResp.json();
            if (upData.url) S.cardEditor.result.slides.push(upData.url);
          } catch(e) { /* skip */ }
        }
        S.cardEditor.result.totalSlides = S.cardEditor.result.slides.length;
        showToast(`Figma에서 ${urls.length}장 가져옴`, "success");
        render();
      } else showToast("Export할 프레임이 없습니다", "warning");
    } else showToast(r?.error || "Export 실패", "error");
  };

  // Midjourney background
  const mjBgGen = document.getElementById("mj-bg-generate");
  if (mjBgGen) mjBgGen.onclick = async () => {
    const prompt = document.getElementById("mj-bg-prompt")?.value?.trim();
    if (!prompt) { showToast("프롬프트를 입력하세요", "warning"); return; }
    mjBgGen.textContent = "생성 중 (1~2분)..."; mjBgGen.disabled = true;
    if (S.cardEditor) S.cardEditor._mjGenerating = true;
    const r = await API.post("/api/midjourney/generate", { prompt: prompt + " --ar 4:5" });
    mjBgGen.textContent = "생성"; mjBgGen.disabled = false;
    if (S.cardEditor) S.cardEditor._mjGenerating = false;
    if (r?.success && r.imagePath) {
      if (S.cardEditor?.result) {
        S.cardEditor.result.slides.push(r.imagePath);
        S.cardEditor.result.totalSlides = S.cardEditor.result.slides.length;
      }
      showToast("미드저니 이미지 추가됨", "success");
      render();
    } else showToast(r?.error || "미드저니 생성 실패", "error");
  };

  const figmaPush = document.getElementById("card-figma-push");
  if (figmaPush) figmaPush.onclick = async () => {
    const ed = S.cardEditor;
    if (!ed?.result?.slides?.length) return;
    figmaPush.textContent = "Figma 생성 중..."; figmaPush.disabled = true;
    const r = await API.post("/api/figma/create-slides", {
      title: ed.title, slides: ed.slides.filter(s => s.trim()), style: ed.style,
      imageUrls: ed.result.slides, batchId: ed.result.batchId,
    });
    figmaPush.textContent = "Figma에 올리기"; figmaPush.disabled = false;
    if (r?.success) {
      showToast("Figma에 슬라이드 생성 완료", "success");
      if (r.figmaUrl) window.open(r.figmaUrl, "_blank");
    } else showToast(r?.error || "Figma 생성 실패", "error");
  };
  const downloadBtn = document.getElementById("card-download-slides");
  if (downloadBtn) downloadBtn.onclick = () => {
    const slides = S.cardEditor?.result?.slides || [];
    slides.forEach((url, i) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `slide-${String(i + 1).padStart(2, "0")}.png`;
      a.click();
    });
    showToast(`${slides.length}장 다운로드`, "success");
  };
  const uploadFinished = document.getElementById("card-upload-finished");
  const uploadInput = document.getElementById("card-upload-input");
  if (uploadFinished && uploadInput) {
    uploadFinished.onclick = () => uploadInput.click();
    uploadInput.onchange = async () => {
      const files = [...uploadInput.files];
      if (!files.length) return;
      uploadFinished.textContent = "업로드 중..."; uploadFinished.disabled = true;
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetch("/api/images/upload", { method: "POST", headers: authHeaders(), body: formData });
          const d = await res.json();
          if (d.url) uploaded.push(d.url);
        } catch (e) { /* skip */ }
      }
      uploadFinished.textContent = "편집본 업로드"; uploadFinished.disabled = false;
      uploadInput.value = "";
      if (uploaded.length) {
        if (S.cardEditor?.result) {
          S.cardEditor.result.slides = [...S.cardEditor.result.slides, ...uploaded];
          S.cardEditor.result.totalSlides = S.cardEditor.result.slides.length;
        } else if (S.cardEditor) {
          S.cardEditor.result = { slides: uploaded, totalSlides: uploaded.length, batchId: "upload" };
        }
        showToast(`${uploaded.length}장 추가됨 (총 ${S.cardEditor?.result?.slides?.length || uploaded.length}장)`, "success");
        render();
      } else { showToast("업로드 실패", "error"); }
    };
  }

  // ZeroOne Community
  const fetchCommunity = document.getElementById("fetch-community");
  if (fetchCommunity) fetchCommunity.onclick = async () => {
    fetchCommunity.textContent = "수집 중..."; fetchCommunity.disabled = true;
    await loadCommunityPosts();
    fetchCommunity.textContent = "새 글 수집"; fetchCommunity.disabled = false;
  };
  document.querySelectorAll("[data-community-draft]").forEach(el => {
    el.onclick = async () => {
      const postId = el.dataset.communityDraft;
      const tone = el.dataset.tone;
      el.textContent = "생성중..."; el.disabled = true;
      const r = await API.post("/api/custom/zeroone-community/draft", { postId: parseInt(postId), tone });
      el.disabled = false; el.textContent = tone === "curate" ? "큐레이션" : tone === "summary" ? "요약" : "토론유도";
      if (r?.ok) showToast("Draft 생성 완료 — 큐에서 확인", "success");
      else showToast(r?.error || "Draft 생성 실패", "error");
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
  else if (page === "x") { S.subTab = S.channelConfig.x?.connected ? "queue" : "settings"; loadOverview(); loadChannelGuideAndKeywords(); }
  else if (page === "instagram") { loadOverview(); loadQueue("all"); loadChannelSettings(); loadCronRuns(); loadChannelGuideAndKeywords(); loadDesignTools(); }
  else if (page === "images") { loadImages(); loadR2Config(); }
  else if (page === "blog") loadBlogQueue();
  else if (page === "zeroone_community") { /* manual load via button */ }
  else if (CH_LABELS[page]) { loadOverview(); loadChannelGuideAndKeywords(); }
  else if (page === "settings") { loadSettings(); loadKeywords(); loadLlmConfig(); loadOverview(); loadNotifSettings(); loadTenantAndChat(); loadR2Config(); }
  render();
}

function switchSubTab(tab) {
  if (tab === "queue") { loadQueue(S.queueFilter); loadImages(); }
  else if (tab === "analytics") loadAnalytics();
  else if (tab === "growth") loadGrowth();
  else if (tab === "popular") loadPopular();
  else if (tab === "settings") { loadSettings(); loadChannelGuideAndKeywords(); loadChannelSettings(); loadCronRuns(); }
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
async function loadDesignTools() {
  const data = await API.get("/api/design-tools");
  if (data) { S.designTools = data; render(); }
}
async function loadR2Config() {
  const data = await API.get("/api/r2-config");
  if (data) { S.r2Config = data; render(); }
}

function fmtBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function renderImages() {
  const r2 = S.r2Config || {};
  const r2Connected = !!(r2.bucket && r2.accessKeyId);
  return `<div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-white">Images</h2>
        <p class="text-sm text-gray-500 mt-1">${S.images.length}개 이미지 — AI 생성 이미지 갤러리</p>
      </div>
      <span class="text-[10px] px-2 py-1 rounded ${r2Connected ? "bg-green-900/40 text-green-400" : "bg-yellow-900/40 text-yellow-400"}">${r2Connected ? "R2 Connected" : "R2 Not configured"}</span>
    </div>

    ${!r2Connected ? `<div class="card p-4 mb-6 border-yellow-800/30 bg-yellow-900/10">
      <p class="text-[10px] text-yellow-400">R2 Storage 미설정 — 이미지 발행이 안 됩니다. <a data-nav="settings" class="text-blue-400 hover:underline cursor-pointer">Settings > Storage</a>에서 설정하세요.</p>
    </div>` : ""}
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

function renderChannelAutomation(channel) {
  const cronMap = {
    instagram: { content_generation: "instagram-generate-drafts", auto_publish: "instagram-auto-publish" },
  };
  const cMap = cronMap[channel];
  if (!cMap) return "";
  const cs = (S.channelSettings.settings || {})[channel] || {};
  const features = (S.channelSettings.features || []).filter(f => cMap[f.key]);
  return features.map(f => {
    const cronName = cMap[f.key];
    const runs = S.cronRuns.filter(r => r.jobName === cronName);
    const run = runs[0] || null;
    const sc = run ? (run.status === "ok" ? "text-green-400" : "text-red-400") : "";
    const ago = run?.finishedAt ? fmtAgo(new Date(run.finishedAt).toISOString()) : "";
    const expanded = S.expandedFeature === f.key;
    let html = `<div class="border-b border-gray-800/50 last:border-0">
      <div class="flex items-center gap-3 py-2.5 cursor-pointer" onclick="toggleFeatureDetail('${f.key}')">
        <label class="relative inline-flex items-center cursor-pointer shrink-0" onclick="event.stopPropagation()">
          <input type="checkbox" data-feature-toggle="${f.key}" data-channel="${channel}" ${cs[f.key] ? "checked" : ""} class="sr-only peer">
          <div class="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
        </label>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-300">${f.label}</span>`;
    if (run) html += `<span class="text-[10px] ${sc}">${run.status === "ok" ? "&#10003;" : "&#10007;"}</span><span class="text-[10px] text-gray-600">${ago}</span>`;
    html += `<svg class="w-3 h-3 text-gray-600 ml-auto transition-transform ${expanded ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
          <p class="text-[10px] text-gray-600">${f.description}</p>
        </div>
      </div>`;
    if (expanded) {
      html += `<div class="ml-12 mb-3 space-y-1.5">`;
      if (runs.length) {
        runs.slice(0, 10).forEach(r => {
          const ts = r.finishedAt ? new Date(r.finishedAt).toLocaleString("ko-KR", {month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}) : "";
          html += `<div class="flex items-start gap-2 py-1">
            <span class="text-[10px] mt-0.5 ${r.status === "ok" ? "text-green-400" : "text-red-400"}">${r.status === "ok" ? "&#10003;" : "&#10007;"}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-gray-500">${ts}</span>
                <span class="text-[10px] text-gray-700">${r.model || ""}</span>
                <span class="text-[10px] text-gray-700 ml-auto">${Math.round(r.durationMs / 1000)}s</span>
              </div>
              <p class="text-[10px] text-gray-500 break-words">${esc(r.summary)}</p>
            </div>
          </div>`;
        });
      } else {
        html += `<p class="text-[10px] text-gray-600">실행 이력 없음</p>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  }).join("");
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
      quick: ["Instagram을 Business 또는 Creator 계정으로 전환 (프로필 > 설정 > 프로페셔널 계정)", "Facebook Page 생성 후 Instagram 계정과 연결", "developers.facebook.com > 앱 만들기 (비즈니스 유형)", "Instagram Graph API + Instagram Content Publishing 제품 추가", "테스터 등록: 앱 역할 > Instagram Testers에 자기 계정 추가 → Instagram 앱에서 수락", "Graph API Explorer에서 instagram_basic + instagram_content_publish 권한으로 토큰 생성", "⚠️ User ID 찾기: Graph API Explorer에서 GET /me/accounts → 페이지 ID 확인 → GET /{페이지ID}?fields=instagram_business_account → 그 안의 id가 User ID (앱 ID와 다름!)"],
      detail: "⚠️ 주의: 앱 ID ≠ User ID. 앱 ID(숫자)를 넣으면 에러 납니다. 반드시 instagram_business_account.id를 넣으세요.\n\n앱 시크릿(App Secret)은 대시보드에 입력 불필요 — 장기 토큰 교환 시에만 사용.\n\nAccess Token만 입력하면 됩니다. 테스터 모드에서는 App Review 없이 자기 계정에 발행 가능.\n\n토큰 유효기간: 단기 1시간, 장기 60일.\n\n지원: 단일 이미지, 캐러셀(카드뉴스 2~10장), 릴스(영상 URL)." },
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
    telegram: { fields: ["botToken", "chatId"], labels: ["Bot Token (@BotFather에서 발급)", "Chat ID (선택 — 알림 발송용)"],
      quick: ["Telegram에서 @BotFather 검색 > /newbot 명령", "봇 이름 + username 설정 > Bot Token 복사", "양방향 대화만 할 경우: Bot Token만 입력하면 완료", "알림도 받으려면: Chat ID 입력 (아래 '더 알아보기' 참고)"],
      detail: "Bot Token\n@BotFather에게 /newbot 하면 발급되는 봇 전용 비밀번호입니다. 무료.\n\nChat ID란?\n봇이 '알림'을 보낼 장소입니다.\n- 없으면: 내가 봇에게 먼저 말해야 대화 가능\n- 있으면: 봇이 먼저 알림을 보낼 수 있음 (바이럴 감지, 주간 리포트 등)\n\nChat ID 확인하는 법\n1. 봇에게 아무 메시지를 보냅니다\n2. 브라우저에서 아래 주소 접속:\n   https://api.telegram.org/bot여기에토큰/getUpdates\n3. 결과에서 \"chat\":{\"id\": 숫자} ← 이 숫자가 Chat ID\n\n또는 Telegram에서 @RawDataBot 에게 메시지 보내면 바로 Chat ID를 알려줍니다.\n\n양방향 대화\nSettings > Interactive Chat에서 Bot Token을 설정하면, 봇에게 '이번 주 성과 보여줘' 같은 명령을 보낼 수 있습니다." },
    discord: { fields: ["webhookUrl"], labels: ["Webhook URL"],
      quick: ["Discord 서버 > 채널 설정 > 연동", "웹후크 > 새 웹후크 만들기", "이름 설정 > URL 복사", "위 폼에 URL 붙여넣기"],
      detail: "Discord Webhook은 가장 간단한 연동 방식입니다. URL 하나만으로 메시지를 보낼 수 있으며, 별도 인증이 필요 없습니다. 보내기만 가능 (읽기 불가)." },
    slack: { fields: ["webhookUrl"], labels: ["Incoming Webhook URL"],
      quick: ["api.slack.com/apps 접속 (docs.slack.dev로 리디렉션 시 api.slack.com/apps 직접 입력)", "Create New App > From scratch > 이름 + Workspace 선택", "왼쪽 메뉴 Incoming Webhooks > 활성화 (ON)", "Add New Webhook to Workspace > 메시지 받을 채널 선택 > Allow", "생성된 Webhook URL 복사 (https://hooks.slack.com/...) > 위 폼에 붙여넣기"],
      detail: "Slack '앱'은 Workspace에 기능을 추가하는 단위입니다. 봇, Webhook, 슬래시 명령어 등을 묶어서 관리합니다. 여기서는 Incoming Webhook만 사용합니다 — 앱을 만들면 Webhook URL이 생성되고, 이 URL로 POST 요청을 보내면 지정 채널에 메시지가 표시됩니다. Slack mrkdwn 포맷 지원. 양방향 대화가 필요하면 Bot Token + App Token이 추가로 필요합니다 (Settings > Interactive Chat 참고)." },
    line: { fields: ["channelAccessToken"], labels: ["Channel Access Token (long-lived)"],
      quick: ["developers.line.biz > LINE Official Account 생성", "Messaging API 활성화", "Channel Access Token (long-lived) 발급", "위 폼에 입력"],
      detail: "LINE Messaging API는 브로드캐스트(전체 발송) 방식입니다. 무료 500건/월, 이후 건당 과금. Channel Access Token은 장기 유효 토큰." },
    naver_blog: { fields: ["blogId", "username", "apiKey"], labels: ["Blog ID", "네이버 Username", "API Key (XML-RPC)"],
      quick: ["네이버 블로그 관리 > 글쓰기 API 설정", "Blog ID, Username 확인", "XML-RPC API Key 발급", "위 폼에 입력"],
      detail: "네이버 블로그는 공식 REST API가 없습니다. 레거시 XML-RPC 방식으로 발행하며, 안정성이 보장되지 않습니다. 비공식 방식." },
    midjourney: { fields: ["discordToken", "channelId", "serverId"], labels: ["Discord Token (유저 토큰)", "Channel ID (미드저니 봇 채널)", "Server ID (Discord 서버)"],
      quick: ["<a href='https://midjourney.com/app' target='_blank' class='text-blue-400'>midjourney.com/app</a>에서 구독 확인 (Basic 이상)", "Discord 설정 > 고급 > <strong>개발자 모드</strong> ON", "미드저니 봇이 있는 서버 이름 우클릭 > <strong>서버 ID 복사</strong>", "미드저니 봇이 있는 채널 우클릭 > <strong>채널 ID 복사</strong>", "Discord Token 발급: <a href='https://discord.com/app' target='_blank' class='text-blue-400'>discord.com/app</a> 접속 (브라우저) > F12 > Console 탭 > 아래 코드 붙여넣기 후 Enter:<br><code class='bg-gray-800 px-1 rounded text-[9px] break-all'>(function(){const o=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.setRequestHeader=function(n,v){if(n.toLowerCase()==='authorization')console.log('[Token]',v);return o.apply(this,arguments)}})()</code><br>실행 후 Discord에서 아무 채널 클릭 → Console에 <code class='bg-gray-800 px-1 rounded'>[Token] MTxx...</code> 출력됨", "위 폼에 3개 값 입력 후 Connect"],
      detail: "Midjourney Discord 연동으로 /imagine 명령을 자동 전송하고 생성된 이미지를 수집합니다.\n\n⚠️ Discord 유저 토큰 사용 — Discord TOS 위반 리스크가 있습니다. 자동화 속도를 제한하여 사용하세요.\n\nDiscord Token이란?\n봇 토큰이 아닌 '유저 토큰'입니다. 브라우저에서 Discord에 로그인한 상태에서 개발자 콘솔로 추출합니다.\n\n다른 방법으로 Token 찾기:\n1. discord.com/app > F12 > Network 탭 > Fetch/XHR 필터 > 아무 요청 클릭 > Headers > Authorization 값\n2. F12 > Application > Local Storage > discord.com > 'token' 검색\n\nChannel ID / Server ID:\n개발자 모드를 ON하면 우클릭 메뉴에 'ID 복사' 항목이 생깁니다.\n\n이미지 생성 시간: 30~90초. 자동 업스케일 지원.\nMidjourney 구독 필요 (Basic $10/월, Standard $30/월)." },
  };

  const sg = setupGuides[key] || { fields: [], labels: [], quick: ["Setup guide가 아직 준비되지 않았습니다."], detail: "" };

  return `<div class="px-8 py-6">
    <button data-nav="overview" class="text-gray-500 hover:text-gray-300 text-sm mb-1">&larr; Back</button>
    <div class="flex items-center gap-3 mb-6">
      <span class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-white">${label[0]}</span>
      <div><h2 class="text-xl font-semibold text-white">${label}</h2><p class="text-xs text-gray-500">${CH_STATUS_LABEL[status] || status}</p></div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">${(() => {
        const editing = S.editingChannel === key;
        const editable = editing || !hasKeys;
        return `
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-300">Credentials</h3>
          ${hasKeys && !editing ? `<button id="edit-ch-${key}" class="text-[10px] text-blue-400 hover:text-blue-300">Edit Credentials</button>` : ""}
        </div>
        <div class="space-y-3">
          ${sg.fields.map((f, i) => credField(`ch-${key}-${f}`, sg.labels[i], "", f.toLowerCase().includes("secret") || f.toLowerCase().includes("password") || f.toLowerCase().includes("token"), keys[f] || "", editable)).join("")}
        </div>
        ${editable ? `
          <div class="flex gap-2 mt-4">
            <button id="save-ch-${key}" class="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">${hasKeys ? "Update" : "Connect"}</button>
            ${hasKeys && editing ? `<button id="cancel-edit-ch-${key}" class="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">Cancel</button>` : ""}
          </div>
        ` : ""}`;
      })()}</div>
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
            ${S.showDetail === key ? `<div class="mt-2 p-3 rounded bg-gray-900/50"><p class="text-[10px] text-gray-500 leading-relaxed whitespace-pre-wrap">${sg.detail}</p></div>` : ""}
          ` : ""}
        </div>
      </div>

      ${!["telegram", "discord", "slack", "line", "kakao", "whatsapp"].includes(key) ? `
      <!-- Content Guide + Keywords (콘텐츠 발행 채널만) -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-300">Content Guide <span class="text-[10px] text-gray-600">(${label})</span></h3>
          <div class="flex gap-2">
            <button id="copy-common-guide" class="px-2 py-1 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700">\uacf5\ud1b5\uc5d0\uc11c \ubcf5\uc0ac</button>
            <button id="save-guide" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
          </div>
        </div>
        <p class="text-[10px] text-gray-600 mb-2">${S.channelGuide?.channelGuide ? label + " \uc804\uc6a9 \uac00\uc774\ub4dc" : "\uacf5\ud1b5 \uac00\uc774\ub4dc \uc0ac\uc6a9 \uc911"}</p>
        <textarea id="guide-textarea" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 font-mono" rows="8">${esc(S.channelGuide?.guide || S.guide)}</textarea>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-300">Keywords <span class="text-[10px] text-gray-600">(${label})</span></h3>
          <div class="flex gap-2">
            <button id="copy-common-keywords" class="px-2 py-1 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700">\uacf5\ud1b5\uc5d0\uc11c \ubcf5\uc0ac</button>
            <button id="save-keywords" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
          </div>
        </div>
        <textarea id="keywords-textarea" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300" rows="5">${(S.channelKeywords?.keywords || S.keywords).join("\n")}</textarea>
      </div>
      ` : ""}

      ${["instagram"].includes(key) ? `
      <!-- Queue (이미지 콘텐츠) -->
      <div class="card p-5 md:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-300">Content Queue</h3>
          <span class="text-[10px] text-gray-500">${(S.queue || []).filter(p => p.imageUrl).length} with image / ${(S.queue || []).length} total</span>
        </div>
        <div class="space-y-3 max-h-[600px] overflow-y-auto">
          ${(S.queue || []).filter(p => p.imageUrl || p.imageUrls?.length).slice(0, 20).map(p => {
            const sc2 = { draft: "bg-yellow-900/50 text-yellow-300", approved: "bg-blue-900/50 text-blue-300", published: "bg-green-900/50 text-green-300" };
            const igSt = p.channels?.instagram?.status || "pending";
            const slides = p.imageUrls || (p.imageUrl ? [p.imageUrl] : []);
            const isCard = slides.length > 1 || p.cardBatchId;
            return `<div class="p-3 rounded-lg bg-gray-900/50 border border-gray-800/50">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] px-1.5 py-0.5 rounded ${sc2[p.status] || "bg-gray-800 text-gray-500"}">${p.status}</span>
                  ${isCard ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300">Card ' + slides.length + ' slides</span>' : ''}
                  <span class="text-[10px] text-gray-600">IG: ${igSt}</span>
                </div>
                <span class="text-[10px] text-gray-600">${p.topic || ""}</span>
              </div>
              <div class="flex gap-1.5 overflow-x-auto pb-2 mb-2" style="scrollbar-width:thin">
                ${slides.map((s,i) => `<img src="${esc(s)}" class="w-20 h-24 rounded object-cover flex-shrink-0 border border-gray-700" title="Slide ${i+1}">`).join("")}
              </div>
              <p class="text-xs text-gray-300 line-clamp-2">${esc(p.text.substring(0, 120))}</p>
              ${p.hashtags?.length ? '<div class="flex flex-wrap gap-1 mt-1">' + p.hashtags.slice(0,5).map(h => '<span class="text-[10px] text-blue-400">#' + h + '</span>').join("") + '</div>' : ''}
              <div class="flex gap-2 mt-2">
                ${p.status === "draft" ? '<button data-approve="' + p.id + '" class="px-2 py-1 text-[10px] bg-green-700 text-white rounded hover:bg-green-600">Approve</button>' : ''}
                ${p.status === "draft" ? '<button data-delete="' + p.id + '" class="px-2 py-1 text-[10px] bg-red-900/40 text-red-300 rounded hover:bg-red-800">Delete</button>' : ''}
              </div>
            </div>`;
          }).join("") || '<p class="text-[10px] text-gray-600">이미지 콘텐츠가 없습니다. Automation에서 Content Generation을 ON하세요.</p>'}
        </div>
      </div>

      <!-- Automation (크론잡이 있는 채널) -->
      <div class="card p-5 md:col-span-2">
        <h3 class="text-sm font-medium text-gray-300 mb-4">Automation</h3>
        <div id="channel-automation-${key}"></div>
      </div>
      ` : ""}

      ${["telegram", "discord", "slack", "line"].includes(key) ? `
      <!-- Messaging 전용 -->
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-3">알림 발송</h3>
        <p class="text-[10px] text-gray-600 mb-3">이 채널로 마케팅 알림을 자동 발송할 수 있습니다.</p>
        <div class="space-y-2">
          ${["onPublish:글 발행 시", "onViral:바이럴 감지 시", "onError:크론 에러 시", "weeklyReport:주간 리포트"].map(item => {
            const [evt, label2] = item.split(":");
            const enabled = S.notificationSettings?.[evt]?.channels?.includes(key);
            return `<div class="flex items-center justify-between p-2 rounded bg-gray-900/50">
              <span class="text-xs text-gray-400">${label2}</span>
              <span class="text-[10px] ${enabled ? "text-green-400" : "text-gray-600"}">${enabled ? "ON" : "OFF"}</span>
            </div>`;
          }).join("")}
        </div>
        <p class="text-[10px] text-gray-600 mt-2">Settings > Notifications에서 변경</p>
      </div>
      <div class="card p-5">
        <h3 class="text-sm font-medium text-gray-300 mb-3">테스트 발송</h3>
        <div class="flex gap-2">
          <input id="test-msg-${key}" type="text" value="Marketing Hub 테스트 메시지" class="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300">
          <button id="send-test-${key}" class="px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">Send</button>
        </div>
        ${S.chatChannels?.[key]?.configured ? `
          <div class="mt-3 p-2 rounded bg-green-900/20 border border-green-800/20">
            <p class="text-[10px] text-green-400">Interactive Chat 연결됨 — 이 채널에서 Agent와 대화 가능</p>
          </div>
        ` : `
          <div class="mt-3 p-2 rounded bg-gray-900/50">
            <p class="text-[10px] text-gray-500">Interactive Chat: Gateway에서 <code>openclaw channels setup ${key}</code>로 양방향 대화 활성화</p>
          </div>
        `}
      </div>
      ` : ""}
    </div>
  </div>`;
}

// ── ZeroOne Community ──
async function loadCommunityPosts() {
  const data = await API.get("/api/custom/zeroone-community");
  if (data) { S.communityPosts = [...(data.popularItems || []), ...(data.items || [])]; render(); }
}

function renderZeroOneCommunity() {
  const posts = S.communityPosts || [];
  return `<div class="px-8 py-6">
    <button data-nav="overview" class="text-gray-500 hover:text-gray-300 text-sm mb-1">&larr; Back</button>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-white">ZeroOne Community</h2>
        <p class="text-xs text-gray-500">커뮤니티 글 수집 → Threads/Instagram draft 생성</p>
      </div>
      <button id="fetch-community" class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">새 글 수집</button>
    </div>
    ${posts.length === 0 ? `<div class="card p-8 text-center"><p class="text-gray-500 text-sm">수집 버튼을 눌러 커뮤니티 글을 불러오세요</p></div>` : ""}
    <div class="space-y-3">
      ${posts.map(p => `
        <div class="card p-4">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300">${esc(p.board || "free")}</span>
              <span class="text-xs font-medium text-gray-200">${esc(p.title)}</span>
            </div>
            <a href="https://www.zeroone.it.kr/community/${p.postId}" target="_blank" class="text-[10px] text-blue-400 hover:underline">원문 &rarr;</a>
          </div>
          <p class="text-sm text-gray-400 mb-2 line-clamp-2">${esc(p.excerpt || "")}</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 text-[10px] text-gray-500">
              <span>${esc(p.author?.name || "")} (${esc(p.author?.role || "")})</span>
              <span>views: ${p.stats?.viewCount || 0}</span>
              <span>likes: ${p.stats?.likeCount || 0}</span>
              <span>comments: ${p.stats?.commentCount || 0}</span>
            </div>
            <div class="flex gap-1">
              <button data-community-draft="${p.postId}" data-tone="curate" class="px-2 py-1 text-[10px] bg-purple-700 text-white rounded hover:bg-purple-600">큐레이션</button>
              <button data-community-draft="${p.postId}" data-tone="summary" class="px-2 py-1 text-[10px] bg-blue-700 text-white rounded hover:bg-blue-600">요약</button>
              <button data-community-draft="${p.postId}" data-tone="discuss" class="px-2 py-1 text-[10px] bg-green-700 text-white rounded hover:bg-green-600">토론유도</button>
            </div>
          </div>
        </div>
      `).join("")}
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
