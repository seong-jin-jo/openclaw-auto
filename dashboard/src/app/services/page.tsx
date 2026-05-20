"use client";

import { useEffect, useState } from "react";

// Multi-Tenant Hub — 여러 openclaw 인스턴스를 탭으로 전환.
// tenants는 /api/tenants 에서 로드 (fork에서 data/tenants.json 박음).
//
// 디자인: 좌측 탭 + 우측 iframe + 우상단 "+ 새 서비스" 버튼.
// CLAUDE.md "서비스 중립" 정합: 브랜드/URL 하드코딩 X.

interface Tenant {
  slug: string;
  name: string;
  emoji?: string;
  dashboardPort: number;
  gatewayPort: number;
  publicUrl: string;
  channels?: string[];
  status?: "active" | "pending" | "waiting-meta-review" | "waiting-legal-opinion" | string;
}

const STATUS_LABEL: Record<string, string> = {
  active: "LIVE",
  pending: "대기",
  "waiting-meta-review": "Meta 검수",
  "waiting-legal-opinion": "Legal 자문",
};

const STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-400",
  pending: "text-amber-400",
  "waiting-meta-review": "text-gray-500",
  "waiting-legal-opinion": "text-gray-500",
};

export default function ServicesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((d) => {
        const list: Tenant[] = d.tenants || [];
        setTenants(list);
        if (list.length > 0) setActive(list[0].slug);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  const current = tenants.find((t) => t.slug === active);

  if (loading) {
    return (
      <div className="p-8 text-gray-400">tenants 로드 중...</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-gray-400">
        <h1 className="text-xl text-gray-200 mb-4">전체 서비스</h1>
        <p className="text-red-400 mb-2">tenants 로드 실패: {error}</p>
        <p className="text-sm">
          fork-only data 파일이 박혀있는지 확인 — <code className="text-amber-400">data/tenants.json</code>
        </p>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="p-8 text-gray-400">
        <h1 className="text-xl text-gray-200 mb-4">전체 서비스</h1>
        <p className="mb-3">등록된 tenants가 없습니다.</p>
        <p className="text-sm mb-2">fork에서 <code className="text-amber-400">data/tenants.json</code> 박기:</p>
        <pre className="bg-gray-900 p-3 text-xs text-gray-300 rounded">{`{
  "tenants": [
    {
      "slug": "service-a",
      "name": "Service A",
      "publicUrl": "https://dash-a.example.com",
      "dashboardPort": 34561,
      "gatewayPort": 18790,
      "status": "active"
    }
  ]
}`}</pre>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* 좌측 탭 */}
      <aside className="w-60 border-r border-gray-800 bg-[#0d0d0d] flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">전체 서비스</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="text-gray-500 hover:text-emerald-400 text-lg leading-none w-6 h-6 flex items-center justify-center"
            title="새 서비스 추가"
          >
            +
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto py-2">
          {tenants.map((t) => (
            <li key={t.slug}>
              <button
                onClick={() => setActive(t.slug)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-l-2 transition-colors ${
                  active === t.slug
                    ? "bg-gray-900 border-emerald-500 text-gray-100"
                    : "border-transparent text-gray-400 hover:bg-gray-900/50"
                }`}
              >
                <span className="text-lg w-6 text-center">{t.emoji || "•"}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm truncate">{t.name}</span>
                  <span
                    className={`block text-[10px] mt-0.5 tracking-wider ${STATUS_COLOR[t.status || "pending"] || "text-gray-500"}`}
                  >
                    {STATUS_LABEL[t.status || ""] || t.status || ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* 우측 iframe */}
      <main className="flex-1 bg-white relative">
        {current ? (
          <iframe
            key={current.slug}
            src={current.publicUrl}
            title={current.name}
            className="w-full h-full border-0"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            서비스를 선택하세요
          </div>
        )}
      </main>

      {/* 추가 모달 */}
      {showAdd && (
        <AddTenantModal onClose={() => setShowAdd(false)} tenants={tenants} />
      )}
    </div>
  );
}

function AddTenantModal({
  onClose,
  tenants,
}: {
  onClose: () => void;
  tenants: Tenant[];
}) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [channel, setChannel] = useState("instagram");
  const [domain, setDomain] = useState("");
  const [cmd, setCmd] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const maxDash = Math.max(34560, ...tenants.map((t) => t.dashboardPort));
    const maxGw = Math.max(18789, ...tenants.map((t) => t.gatewayPort));
    const newDash = maxDash + 1;
    const newGw = maxGw + 1;

    const c = `# postAGI: 새 tenant '${slug}' 자동 추가
cd ~/sj_code_master/postAGI/openclaw-auto
bash add-tenant.sh ${slug} ${newDash} ${newGw} ${channel}

# Cloudflare Tunnel 라우트:
#   hostname: ${domain}
#   service: http://localhost:${newDash}

# data/tenants.json 갱신 (add-tenant.sh가 자동 처리)
# 가동:
docker-compose -f docker-compose.postagi-4tenants.yml up -d openclaw-gateway-${slug} openclaw-dashboard-${slug} --build`;
    setCmd(c);

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(c).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-[#0d0d0d] border border-gray-800 rounded p-6 w-[480px] max-w-[90vw]">
        <h2 className="text-emerald-400 mb-4 text-base">새 서비스 추가</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              slug (영문 소문자)
            </label>
            <input
              required
              pattern="[a-z0-9]+"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-800 text-gray-200 rounded text-sm"
              placeholder="예: nova"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              표시명
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-800 text-gray-200 rounded text-sm"
              placeholder="예: Nova App"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                이모지
              </label>
              <input
                required
                maxLength={2}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-800 text-gray-200 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                주 채널
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-800 text-gray-200 rounded text-sm"
              >
                <option value="instagram">Instagram</option>
                <option value="x">X (Twitter)</option>
                <option value="threads">Threads</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              dashboard 도메인
            </label>
            <input
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-800 text-gray-200 rounded text-sm"
              placeholder="예: marketing-nova.example.com"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 text-sm hover:text-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 text-black text-sm font-semibold rounded"
            >
              생성 명령 발행
            </button>
          </div>
        </form>
        {cmd && (
          <pre className="mt-4 p-3 bg-black border border-gray-800 rounded text-xs text-emerald-400 whitespace-pre-wrap break-all">
            {cmd}
            {"\n\n"}✓ 클립보드 복사됨 — 터미널에 붙여넣기
          </pre>
        )}
      </div>
    </div>
  );
}
