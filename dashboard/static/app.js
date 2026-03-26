/* Threads 콘텐츠 대시보드 — Vanilla JS (Alpine.js 스타일) */

// ── Toast System ──
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
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

const API = {
  async get(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        showToast(`요청 실패: ${res.status}`, "error");
        return null;
      }
      return res.json();
    } catch (e) {
      showToast(`네트워크 오류: ${e.message}`, "error");
      return null;
    }
  },
  async post(url, body) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || `요청 실패: ${res.status}`, "error");
        return null;
      }
      return res.json();
    } catch (e) {
      showToast(`네트워크 오류: ${e.message}`, "error");
      return null;
    }
  },
};

// ── State ──
const state = {
  tab: "overview",
  overview: null,
  queue: [],
  queueFilter: "all",
  growth: [],
  popular: [],
  analytics: null,
  keywords: [],
  settings: null,
  cronJobs: [],
  loading: false,
  editingPost: null,
  editText: "",
  selectedIds: new Set(),
};

// ── Loading Helpers ──
function setLoading(on) {
  state.loading = on;
  render();
}

function loadingOverlay() {
  if (!state.loading) return "";
  return `<div class="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
    <span class="text-gray-300 text-sm">Loading...</span>
  </div>`;
}

// ── Data Loading ──
async function loadOverview() {
  const [data, cronData] = await Promise.all([
    API.get("/api/overview"),
    API.get("/api/cron-status"),
  ]);
  if (data) state.overview = data;
  if (cronData) state.cronJobs = cronData.jobs || [];
  render();
}

async function loadQueue(status) {
  const url = status && status !== "all" ? `/api/queue?status=${status}` : "/api/queue";
  const data = await API.get(url);
  if (data) {
    state.queue = (data.posts || []).sort((a, b) =>
      (b.generatedAt || "").localeCompare(a.generatedAt || "")
    );
  }
  render();
}

async function loadGrowth() {
  const data = await API.get("/api/growth");
  if (data) state.growth = data.records || [];
  render();
}

async function loadPopular() {
  const data = await API.get("/api/popular");
  if (data) state.popular = data.posts || [];
  render();
}

async function loadAnalytics() {
  const data = await API.get("/api/analytics");
  if (data) state.analytics = data;
  render();
}

async function loadKeywords() {
  const data = await API.get("/api/keywords");
  if (data) state.keywords = data.keywords || [];
  render();
}

async function loadSettings() {
  const settings = await API.get("/api/settings");
  if (settings) state.settings = settings;
  const guideData = await API.get("/api/guide");
  state.guide = guideData ? guideData.guide || "" : "";
  render();
}

async function saveSettings() {
  const fields = ["viralThreshold", "minLikes", "searchDays", "maxPopularPosts",
    "insightsIntervalHours", "insightsMaxCollections", "publishIntervalHours", "draftsPerBatch"];
  const updates = {};
  for (const f of fields) {
    const el = document.getElementById(`setting-${f}`);
    if (el) updates[f] = parseInt(el.value, 10) || 0;
  }
  setLoading(true);
  const result = await API.post("/api/settings", updates);
  setLoading(false);
  if (result) {
    showToast("설정이 저장되었습니다", "success");
    await loadSettings();
  }
}

// ── Actions ──
async function approvePost(id, hours = 2) {
  setLoading(true);
  const result = await API.post(`/api/queue/${id}/approve`, { hours });
  setLoading(false);
  if (result) {
    showToast("승인 완료", "success");
    await loadQueue(state.queueFilter);
    await loadOverview();
  }
}

async function updatePost(id, text) {
  setLoading(true);
  const result = await API.post(`/api/queue/${id}/update`, { text });
  setLoading(false);
  if (result) {
    showToast("수정 완료", "success");
    state.editingPost = null;
    await loadQueue(state.queueFilter);
  }
}

async function deletePost(id) {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  setLoading(true);
  const result = await API.post(`/api/queue/${id}/delete`);
  setLoading(false);
  if (result) {
    showToast("삭제 완료", "success");
    await loadQueue(state.queueFilter);
    await loadOverview();
  }
}

async function bulkApprove() {
  const ids = Array.from(state.selectedIds);
  if (ids.length === 0) return;
  if (!confirm(`${ids.length}개 글을 일괄 승인하시겠습니까?`)) return;
  setLoading(true);
  const result = await API.post("/api/queue/bulk-approve", { ids });
  setLoading(false);
  if (result) {
    showToast(`${result.approved || ids.length}개 승인 완료`, "success");
    state.selectedIds.clear();
    await loadQueue(state.queueFilter);
    await loadOverview();
  }
}

async function saveKeywords(text) {
  const keywords = text.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
  setLoading(true);
  const result = await API.post("/api/keywords", { keywords });
  setLoading(false);
  if (result) {
    showToast("키워드 저장 완료", "success");
    await loadKeywords();
  }
}

// ── Render ──
function render() {
  const app = document.getElementById("app");
  app.innerHTML = `
    ${loadingOverlay()}
    ${renderNav()}
    <main class="max-w-7xl mx-auto px-4 py-6">
      ${state.tab === "overview" ? renderOverview() : ""}
      ${state.tab === "queue" ? renderQueue() : ""}
      ${state.tab === "analytics" ? renderAnalytics() : ""}
      ${state.tab === "popular" ? renderPopular() : ""}
      ${state.tab === "settings" ? renderSettings() : ""}
    </main>
  `;
  bindEvents();
}

function renderNav() {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "queue", label: "Queue" },
    { id: "analytics", label: "Analytics" },
    { id: "popular", label: "Popular Posts" },
    { id: "settings", label: "Settings" },
  ];
  return `
    <nav class="bg-gray-900 border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-14">
          <h1 class="text-lg font-bold text-white">Threads Dashboard</h1>
          <div class="flex gap-1">
            ${tabs.map(t => `
              <button data-tab="${t.id}"
                class="px-3 py-2 text-sm rounded ${state.tab === t.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}">
                ${t.label}
              </button>
            `).join("")}
          </div>
        </div>
      </div>
    </nav>
  `;
}

function renderOverview() {
  const o = state.overview;
  if (!o) return `<p class="text-gray-500">Loading...</p>`;

  const sc = o.statusCounts || {};
  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      ${card("Followers", o.followers ?? "N/A", o.weekDelta != null ? `${o.weekDelta >= 0 ? "+" : ""}${o.weekDelta} this week` : "")}
      ${card("Published", sc.published || 0, `${sc.draft || 0} drafts, ${sc.approved || 0} approved`)}
      ${card("Viral Posts", o.viralPosts?.length || 0, `>= ${state.analytics?.summary?.viralThreshold || 500} views`)}
      ${card("Popular Refs", o.popularPostsCount || 0, Object.entries(o.popularSourceCounts || {}).map(([k, v]) => `${k}: ${v}`).join(", "))}
    </div>

    ${state.cronJobs.length ? `
      <div class="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 class="text-sm font-medium text-gray-400 mb-3">Cron 현황</h3>
        <div class="space-y-1">
          ${state.cronJobs.map(j => {
            const statusIcon = j.lastStatus === "ok" ? "text-green-400" : j.lastStatus === "error" ? "text-red-400" : "text-gray-500";
            const fmtTime = (ms) => ms ? new Date(ms).toLocaleString("ko-KR", {month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}) : "-";
            return `<div class="flex items-center justify-between text-sm py-1 border-b border-gray-800 last:border-0">
              <span class="text-gray-300">${esc(j.name)}</span>
              <div class="flex gap-4 text-xs">
                <span class="text-gray-500">마지막: <span class="${statusIcon}">${fmtTime(j.lastRunAt)}</span></span>
                <span class="text-gray-500">다음: <span class="text-blue-400">${fmtTime(j.nextRunAt)}</span></span>
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>
    ` : ""}

    ${o.viralPosts?.length ? `
      <div class="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 class="text-sm font-medium text-gray-400 mb-3">Viral Posts</h3>
        ${o.viralPosts.map(p => `
          <div class="flex justify-between items-start py-2 border-b border-gray-800 last:border-0">
            <span class="text-gray-200 text-sm flex-1">${esc(p.text)}</span>
            <span class="text-green-400 text-sm ml-4 whitespace-nowrap">${p.views} views / ${p.likes} likes</span>
          </div>
        `).join("")}
      </div>
    ` : ""}
  `;
}

function card(title, value, sub) {
  return `
    <div class="bg-gray-900 rounded-lg p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide">${title}</p>
      <p class="text-2xl font-bold text-white mt-1">${value}</p>
      ${sub ? `<p class="text-xs text-gray-400 mt-1">${sub}</p>` : ""}
    </div>
  `;
}

function renderQueue() {
  const filters = ["all", "draft", "approved", "published", "failed"];
  const drafts = state.queue.filter(p => p.status === "draft");

  return `
    <div class="flex items-center justify-between mb-4">
      <div class="flex gap-1">
        ${filters.map(f => `
          <button data-filter="${f}"
            class="px-3 py-1 text-sm rounded ${state.queueFilter === f ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}">
            ${f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        `).join("")}
      </div>
      ${drafts.length > 0 ? `
        <button id="bulk-approve" class="px-3 py-1 text-sm bg-green-700 text-white rounded hover:bg-green-600 disabled:opacity-50"
          ${state.selectedIds.size === 0 ? "disabled" : ""}>
          Approve Selected (${state.selectedIds.size})
        </button>
      ` : ""}
    </div>

    <div class="space-y-3">
      ${state.queue.length === 0 ? `<p class="text-gray-500 text-sm">No posts</p>` : ""}
      ${state.queue.map(p => renderPost(p)).join("")}
    </div>
  `;
}

function renderPost(p) {
  const eng = p.engagement || {};
  const isEditing = state.editingPost === p.id;
  const statusColors = {
    draft: "bg-yellow-900 text-yellow-300",
    approved: "bg-blue-900 text-blue-300",
    published: "bg-green-900 text-green-300",
    failed: "bg-red-900 text-red-300",
  };

  return `
    <div class="bg-gray-900 rounded-lg p-4">
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center gap-2">
          ${p.status === "draft" ? `
            <input type="checkbox" data-select="${p.id}" ${state.selectedIds.has(p.id) ? "checked" : ""}
              class="rounded border-gray-600">
          ` : ""}
          <span class="text-xs px-2 py-0.5 rounded ${statusColors[p.status] || "bg-gray-700 text-gray-300"}">${p.status}</span>
          <span class="text-xs text-gray-500">${p.topic || ""}</span>
          ${p.abVariant && p.abVariant !== "A" ? `<span class="text-xs px-1.5 py-0.5 rounded bg-purple-900 text-purple-300">${p.abVariant}</span>` : ""}
          ${p.model ? `<span class="text-xs text-gray-600">${p.model}</span>` : ""}
        </div>
        <span class="text-xs text-gray-600">${p.id.slice(0, 8)}</span>
      </div>

      ${isEditing ? `
        <textarea id="edit-textarea" class="w-full bg-gray-800 text-gray-200 text-sm p-2 rounded border border-gray-700 mb-2" rows="4">${esc(p.text)}</textarea>
        <div class="flex gap-2">
          <button data-save="${p.id}" class="px-2 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
          <button data-cancel-edit class="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">Cancel</button>
        </div>
      ` : `
        <p class="text-gray-200 text-sm mb-2 whitespace-pre-wrap">${esc(p.text)}</p>
      `}

      ${p.imageUrl ? `
        <div class="mb-2">
          <img src="${esc(p.imageUrl)}" alt="post image" class="rounded max-h-48 object-cover" onerror="this.style.display='none'">
        </div>
      ` : ""}

      ${p.hashtags?.length ? `
        <div class="flex gap-1 mb-2">
          ${p.hashtags.map(h => `<span class="text-xs text-blue-400">#${h}</span>`).join("")}
        </div>
      ` : ""}

      ${p.status === "published" && eng.views != null ? `
        <div class="flex gap-4 text-xs text-gray-500">
          <span>views: ${eng.views}</span>
          <span>likes: ${eng.likes || 0}</span>
          <span>replies: ${eng.replies || 0}</span>
          <span>reposts: ${eng.reposts || 0}</span>
        </div>
      ` : ""}

      ${p.scheduledAt ? `<p class="text-xs text-gray-600 mt-1">Scheduled: ${new Date(p.scheduledAt).toLocaleString()}</p>` : ""}

      <div class="flex gap-2 mt-2">
        ${p.status === "draft" ? `
          <button data-approve="${p.id}" class="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Approve</button>
          <button data-edit="${p.id}" class="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Edit</button>
        ` : ""}
        ${p.status !== "published" ? `
          <button data-delete="${p.id}" class="px-2 py-1 text-xs bg-red-900 text-red-300 rounded hover:bg-red-800">Delete</button>
        ` : ""}
      </div>
    </div>
  `;
}

function renderAnalytics() {
  const a = state.analytics;
  if (!a) return `<p class="text-gray-500">Loading...</p>`;

  const s = a.summary || {};
  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      ${card("Total Published", s.totalPublished)}
      ${card("Total Views", s.totalViews)}
      ${card("Avg Views", s.avgViews)}
      ${card("Avg Likes", s.avgLikes)}
    </div>

    ${Object.keys(a.topics || {}).length ? `
      <div class="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 class="text-sm font-medium text-gray-400 mb-3">Topic Performance</h3>
        <table class="w-full text-sm">
          <thead><tr class="text-gray-500 text-xs">
            <th class="text-left py-1">Topic</th>
            <th class="text-right py-1">Posts</th>
            <th class="text-right py-1">Avg Views</th>
            <th class="text-right py-1">Avg Likes</th>
          </tr></thead>
          <tbody>
            ${Object.entries(a.topics).map(([topic, s]) => `
              <tr class="border-t border-gray-800">
                <td class="text-gray-200 py-1">${esc(topic)}</td>
                <td class="text-gray-400 text-right py-1">${s.count}</td>
                <td class="text-gray-400 text-right py-1">${s.avgViews || 0}</td>
                <td class="text-gray-400 text-right py-1">${s.avgLikes || 0}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}

    <div class="bg-gray-900 rounded-lg p-4">
      <h3 class="text-sm font-medium text-gray-400 mb-3">Published Posts</h3>
      ${(a.posts || []).length === 0 ? `<p class="text-gray-500 text-sm">No published posts yet</p>` : ""}
      ${(a.posts || []).map(p => `
        <div class="flex justify-between items-start py-2 border-b border-gray-800 last:border-0">
          <div class="flex-1 mr-4">
            <span class="text-gray-200 text-sm">${esc(p.text)}</span>
            <span class="text-gray-600 text-xs ml-2">${p.topic}</span>
          </div>
          <div class="text-right text-xs text-gray-500 whitespace-nowrap">
            <div>${p.views} views</div>
            <div>${p.likes} likes</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPopular() {
  const sources = ["all", "manual", "external", "own-viral"];
  return `
    <div class="flex gap-1 mb-4">
      ${sources.map(s => `
        <button data-popular-filter="${s}"
          class="px-3 py-1 text-sm rounded ${s === "all" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}">
          ${s === "all" ? "All" : s}
        </button>
      `).join("")}
    </div>

    <div class="space-y-3">
      ${state.popular.map(p => `
        <div class="bg-gray-900 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs px-2 py-0.5 rounded bg-purple-900 text-purple-300">${p.source || "unknown"}</span>
            ${p.type ? `<span class="text-xs px-2 py-0.5 rounded bg-cyan-900 text-cyan-300">${p.type}</span>` : ""}
            <span class="text-xs text-gray-500">${p.topic || ""}</span>
            ${p.likes && p.likes !== "0" ? `<span class="text-xs text-yellow-500">${p.likes} likes</span>` : ""}
            ${p.collected ? `<span class="text-xs text-gray-600">${p.collected}</span>` : ""}
          </div>
          <p class="text-gray-200 text-sm whitespace-pre-wrap">${esc(p.text || "")}</p>
        </div>
      `).join("")}
      ${state.popular.length === 0 ? `<p class="text-gray-500 text-sm">No popular posts</p>` : ""}
    </div>
  `;
}

function renderSettings() {
  const s = state.settings || {};
  const settingRow = (key, label, desc) => `
    <div class="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div>
        <p class="text-sm text-gray-200">${label}</p>
        <p class="text-xs text-gray-500">${desc}</p>
      </div>
      <input id="setting-${key}" type="number" value="${s[key] ?? ""}" min="0"
        class="w-24 bg-gray-800 text-gray-200 text-sm p-1.5 rounded border border-gray-700 text-right">
    </div>
  `;

  return `
    <div class="bg-gray-900 rounded-lg p-4 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-400">Thresholds & Limits</h3>
        <button id="save-settings" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
      </div>
      ${settingRow("viralThreshold", "Viral Threshold", "터진 글 기준 views")}
      ${settingRow("minLikes", "Min Likes", "외부 인기글 최소 좋아요")}
      ${settingRow("searchDays", "Search Days", "외부 인기글 검색 기간 (일)")}
      ${settingRow("maxPopularPosts", "Max Popular Posts", "popular-posts.txt 최대 보관 수")}
      ${settingRow("insightsIntervalHours", "Insights Interval", "반응 수집 간격 (시간)")}
      ${settingRow("insightsMaxCollections", "Max Collections", "최대 반응 수집 횟수")}
      ${settingRow("publishIntervalHours", "Publish Interval", "발행 간격 (시간)")}
      ${settingRow("draftsPerBatch", "Drafts per Batch", "배치당 생성 개수")}
    </div>

    <div class="bg-gray-900 rounded-lg p-4 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-400">Content Guide</h3>
        <button id="save-guide" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
      </div>
      <p class="text-xs text-gray-500 mb-2">AI가 글 생성할 때 참고하는 톤/타겟/유형 가이드. 수정하면 다음 생성부터 반영됨.</p>
      <textarea id="guide-textarea" class="w-full bg-gray-800 text-gray-200 text-sm p-2 rounded border border-gray-700 mb-2 font-mono" rows="16">${esc(state.guide || "")}</textarea>
    </div>

    <div class="bg-gray-900 rounded-lg p-4 mb-6">
      <h3 class="text-sm font-medium text-gray-400 mb-3">Search Keywords</h3>
      <textarea id="keywords-textarea" class="w-full bg-gray-800 text-gray-200 text-sm p-2 rounded border border-gray-700 mb-2" rows="10">${state.keywords.join("\n")}</textarea>
      <button id="save-keywords" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500">Save Keywords</button>
    </div>
  `;
}

// ── Event Binding ──
function bindEvents() {
  // Tab navigation
  document.querySelectorAll("[data-tab]").forEach(el => {
    el.onclick = () => switchTab(el.dataset.tab);
  });

  // Queue filters
  document.querySelectorAll("[data-filter]").forEach(el => {
    el.onclick = () => {
      state.queueFilter = el.dataset.filter;
      loadQueue(state.queueFilter);
    };
  });

  // Post actions
  document.querySelectorAll("[data-approve]").forEach(el => {
    el.onclick = () => approvePost(el.dataset.approve);
  });
  document.querySelectorAll("[data-edit]").forEach(el => {
    el.onclick = () => { state.editingPost = el.dataset.edit; render(); };
  });
  document.querySelectorAll("[data-save]").forEach(el => {
    el.onclick = () => {
      const textarea = document.getElementById("edit-textarea");
      if (textarea) updatePost(el.dataset.save, textarea.value);
    };
  });
  document.querySelectorAll("[data-cancel-edit]").forEach(el => {
    el.onclick = () => { state.editingPost = null; render(); };
  });
  document.querySelectorAll("[data-delete]").forEach(el => {
    el.onclick = () => deletePost(el.dataset.delete);
  });

  // Checkboxes
  document.querySelectorAll("[data-select]").forEach(el => {
    el.onchange = () => {
      if (el.checked) state.selectedIds.add(el.dataset.select);
      else state.selectedIds.delete(el.dataset.select);
      render();
    };
  });

  // Bulk approve
  const bulkBtn = document.getElementById("bulk-approve");
  if (bulkBtn) bulkBtn.onclick = bulkApprove;

  // Keywords save
  const saveKw = document.getElementById("save-keywords");
  if (saveKw) {
    saveKw.onclick = () => {
      const ta = document.getElementById("keywords-textarea");
      if (ta) saveKeywords(ta.value);
    };
  }

  // Settings save
  const saveSt = document.getElementById("save-settings");
  if (saveSt) saveSt.onclick = saveSettings;

  // Guide save
  const saveGd = document.getElementById("save-guide");
  if (saveGd) {
    saveGd.onclick = async () => {
      const ta = document.getElementById("guide-textarea");
      if (ta) {
        setLoading(true);
        const result = await API.post("/api/guide", { guide: ta.value });
        setLoading(false);
        if (result) {
          showToast("가이드 저장 완료", "success");
          await loadSettings();
        }
      }
    };
  }

  // Popular filters
  document.querySelectorAll("[data-popular-filter]").forEach(el => {
    el.onclick = async () => {
      const src = el.dataset.popularFilter;
      const data = await API.get(src === "all" ? "/api/popular" : `/api/popular?source=${src}`);
      if (data) state.popular = data.posts || [];
      render();
    };
  });
}

function switchTab(tab) {
  state.tab = tab;
  if (tab === "overview") loadOverview();
  else if (tab === "queue") loadQueue(state.queueFilter);
  else if (tab === "analytics") loadAnalytics();
  else if (tab === "popular") loadPopular();
  else if (tab === "settings") { loadKeywords(); loadSettings(); }
  render();
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  loadOverview();
  loadQueue("all");
  render();
});
