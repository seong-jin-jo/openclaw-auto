"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/layout/Toast";
import { authHeaders } from "@/lib/auth";
import { SCHEDULABLE_PLATFORMS, SCHEDULABLE_PLATFORM_LABELS } from "@/lib/constants";

interface AccountOption { id: string; label: string }

// P6 예약 발행 패널 — Studio 발행 영역에 토글로 노출.
// 날짜/시간 picker + 플랫폼 체크 → POST /api/schedule, 예약 목록은 SWR로 표시.
// draftId가 있으면 그 초안을 예약(없으면 현 작업물을 먼저 저장해야 함을 안내).

interface ScheduleItem {
  id: string;
  draftId: string | null;
  platforms: string[];
  scheduledAt: string;
  status: string;
}

// 예약 가능한 플랫폼은 constants.ts의 SSOT를 그대로 쓴다(백엔드 publish-due와 단일 소스).
// 과거 shorts/reels/tiktok을 노출했으나 백엔드가 못 받아 "미지원"으로 영영 미발행되던
// 정직성 버그를 SSOT로 제거했다.
const PLATFORMS = SCHEDULABLE_PLATFORMS;
const LABEL: Record<string, string> = SCHEDULABLE_PLATFORM_LABELS;

function statusLabel(status: string): string {
  if (status === "published") return "발행됨";
  if (status === "partial") return "일부 실패";
  if (status === "failed") return "실패";
  if (status === "processing") return "처리 중";
  if (status === "canceled") return "취소";
  return "예약됨";
}

function statusClass(status: string): string {
  if (status === "published") return "bg-success/15 text-success";
  if (status === "partial") return "bg-warning/15 text-warning";
  if (status === "failed") return "bg-danger/15 text-danger";
  if (status === "processing") return "bg-accent/15 text-accent";
  if (status === "canceled") return "bg-surface-2 text-subtle";
  return "bg-warning/15 text-warning";
}

// datetime-local 입력값(로컬 시각, "YYYY-MM-DDTHH:mm") → ISO-8601 문자열.
function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// 기본값: 1시간 뒤(로컬), datetime-local 포맷.
function defaultLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SchedulePanel({
  tenantId,
  draftId,
  defaultPlatforms,
}: {
  tenantId: string;
  draftId: string | null;
  defaultPlatforms?: string[];
}) {
  const { showToast } = useToast();
  const { data, mutate } = useSWR<{ schedules: ScheduleItem[] }>(
    tenantId ? `/api/schedule?tenant_id=${tenantId}` : null,
    fetcher,
  );
  const [when, setWhen] = useState<string>(defaultLocal());
  const [sel, setSel] = useState<Record<string, boolean>>(() => {
    const base = defaultPlatforms && defaultPlatforms.length ? defaultPlatforms : ["threads"];
    return Object.fromEntries(PLATFORMS.map((p) => [p, base.includes(p)]));
  });
  const [saving, setSaving] = useState(false);
  // SNS-007: 플랫폼별 다중계정 중 이 예약에 쓸 계정 — 미선택이면 publish-due가 기본계정 사용.
  const [accountsByPlatform, setAccountsByPlatform] = useState<Record<string, AccountOption[]>>({});
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelectedAccounts({});
    if (!tenantId) { setAccountsByPlatform({}); return; }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        PLATFORMS.map(async (p) => {
          try {
            const r = await fetch(`/api/channels/${p}/accounts?tenant_id=${tenantId}`, { headers: authHeaders() });
            const d = await r.json();
            if (!r.ok) return [p, []] as const;
            const opts: AccountOption[] = (d.accounts ?? []).map((a: { id: string; display_name: string | null; username: string | null }) => ({
              id: a.id,
              label: a.display_name || (a.username ? `@${a.username}` : a.id.slice(0, 8)),
            }));
            return [p, opts] as const;
          } catch {
            return [p, []] as const;
          }
        }),
      );
      if (!cancelled) setAccountsByPlatform(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  async function submit() {
    const platforms = PLATFORMS.filter((p) => sel[p]);
    if (!platforms.length) { showToast("예약할 플랫폼을 선택하세요", "error"); return; }
    const iso = toIso(when);
    if (!iso) { showToast("예약 시각을 입력하세요", "error"); return; }
    if (Date.parse(iso) <= Date.now()) { showToast("예약 시각은 미래여야 합니다", "error"); return; }
    if (!draftId) { showToast("먼저 💾 Save로 초안을 저장한 뒤 예약하세요", "error"); return; }
    setSaving(true);
    try {
      const accountIds = Object.fromEntries(
        platforms.filter((p) => selectedAccounts[p]).map((p) => [p, selectedAccounts[p]]),
      );
      const r = await apiPost<{ ok?: boolean; error?: string }>("/api/schedule", {
        tenant_id: tenantId, draft_id: draftId, platforms, scheduled_at: iso,
        account_ids: Object.keys(accountIds).length ? accountIds : undefined,
      });
      if (r?.ok) { showToast("예약 등록됨 ✓", "success"); mutate(); }
      else showToast(r?.error || "예약 실패", "error");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "예약 실패", "error");
    } finally {
      setSaving(false);
    }
  }

  const schedules = data?.schedules || [];

  return (
    <div className="card p-4 mb-4 border border-accent">
      <div className="flex items-center gap-2 mb-1">
        <b className="text-sm text-text">🗓️ 예약 발행</b>
        <span className="text-caption text-subtle">미래 시각에 멀티채널 자동 발행</span>
      </div>
      {/* 정직 표기: 예약은 DB에 적재되고, 실제 게시는 자동화 파이프라인(크론)이 수행한다.
          파이프라인 미연결 시 '예약됨' 상태로 대기 — 가짜 '발행됨' 표시 안 함. */}
      <p className="text-caption text-subtle mb-3">
        예약은 저장되고, 자동화 파이프라인이 예약 시각에 발행합니다. 파이프라인 미연결 시 <b className="text-warning">예약됨</b>으로 대기합니다.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div>
          <label className="block text-caption text-subtle mb-1">예약 시각</label>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="bg-surface-2 text-text text-sm p-2 rounded border border-border"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="block text-caption text-subtle mb-1">플랫폼</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <div key={p} className="flex items-center gap-1">
                <label className="flex items-center gap-1 text-caption text-muted bg-surface-2 px-2 py-1 rounded border border-border cursor-pointer">
                  <input type="checkbox" checked={!!sel[p]} onChange={(e) => setSel((x) => ({ ...x, [p]: e.target.checked }))} />
                  {LABEL[p]}
                </label>
                {sel[p] && (accountsByPlatform[p]?.length ?? 0) > 1 && (
                  <select
                    data-testid={`schedule-account-select-${p}`}
                    value={selectedAccounts[p] ?? ""}
                    onChange={(e) => setSelectedAccounts((x) => ({ ...x, [p]: e.target.value }))}
                    className="text-caption bg-surface-2 border border-border rounded px-1 py-1 text-text max-w-[90px]"
                  >
                    <option value="">기본계정</option>
                    {accountsByPlatform[p].map((a) => (
                      <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-text rounded-lg disabled:opacity-50"
        >
          {saving ? "예약 중…" : "예약"}
        </button>
      </div>

      {/* 예약 목록 */}
      <div className="border-t border-border pt-2">
        <div className="text-caption text-subtle mb-1.5">예약 목록 ({schedules.length})</div>
        {schedules.length === 0 ? (
          <p className="text-xs text-subtle">예약 없음</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-surface/60 rounded px-2.5 py-1.5">
                <div className="min-w-0">
                  <div className="text-xs text-muted">{new Date(s.scheduledAt).toLocaleString("ko-KR")}</div>
                  <div className="text-caption text-subtle truncate">{(s.platforms || []).map((p) => LABEL[p] || p).join(" · ")}</div>
                </div>
                <span className={`text-caption px-2 py-0.5 rounded-full shrink-0 ${statusClass(s.status)}`}>
                  {statusLabel(s.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
