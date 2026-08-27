"use client";

import useSWR from "swr";
import { fetcher, isAuthRequiredError } from "@/lib/api";

interface OperationalIncident {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  category: string;
  source: string;
  reasonCode: string;
  severity: string;
  intervention: "human" | "automatic";
  status: "open" | "recovered";
  occurrences: number;
  lastSeenAt: string;
}

interface IncidentResponse {
  incidents: OperationalIncident[];
  summary: { humanOpen: number; automaticOpen: number; recovered: number };
}

const CATEGORY_LABEL: Record<string, string> = {
  publish_failed: "발행 실패",
  token_expired: "토큰 만료",
  generation_failed: "생성 실패",
  external_service_error: "외부 서비스 오류",
};

const SOURCE_LABEL: Record<string, string> = {
  threads: "스레드",
  instagram: "인스타그램",
  x: "엑스",
  facebook: "페이스북",
  bluesky: "블루스카이",
  telegram: "텔레그램",
  discord: "디스코드",
  slack: "슬랙",
  youtube: "유튜브",
  shared_ai: "공유 인공지능",
  studio: "스튜디오",
  unknown_platform: "확인 필요",
};

function formatSeenAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

export function OperationalIncidentPanel() {
  const { data, error, isLoading } = useSWR<IncidentResponse>("/api/operator/incidents", fetcher, {
    refreshInterval: 30_000,
  });
  const incidents = data?.incidents || [];
  const summary = data?.summary || { humanOpen: 0, automaticOpen: 0, recovered: 0 };
  const visibleError = !isAuthRequiredError(error) ? error?.message : null;

  return (
    <section className="mb-stack-section" aria-labelledby="operational-incidents-title" data-testid="operational-incidents">
      <div className="mb-stack flex items-end justify-between gap-stack">
        <div>
          <h3 id="operational-incidents-title" className="text-body-sm font-semibold text-text">운영 장애</h3>
          <p className="mt-micro text-caption text-subtle">작업 공간별 장애와 개입 필요 여부를 함께 봅니다. 자동 복구 대상은 알림을 보내지 않습니다.</p>
        </div>
        {isLoading && <span className="text-caption text-subtle">불러오는 중</span>}
      </div>

      {visibleError && <p role="alert" className="mb-stack rounded-control border border-danger/30 bg-danger/10 p-stack text-caption text-danger">운영 장애를 불러오지 못했습니다.</p>}

      <div className="mb-stack grid grid-cols-3 gap-stack" aria-label="운영 장애 요약">
        {[
          ["사람 확인 필요", summary.humanOpen, "text-danger"],
          ["자동 복구 대기", summary.automaticOpen, "text-warning"],
          ["최근 복구", summary.recovered, "text-success"],
        ].map(([label, count, tone]) => (
          <div key={label} className="card p-stack">
            <p className="text-caption text-subtle">{label}</p>
            <p className={`mt-micro text-subheading font-semibold ${tone}`}>{count}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {incidents.length === 0 ? (
          <p className="p-pad-inset text-body-sm text-subtle">열린 장애가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border" aria-live="polite">
            {incidents.map((incident) => (
              <li key={incident.id} className="grid gap-stack p-pad-inset lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-stack-tight">
                    <span className={`rounded-pill px-stack-tight py-micro text-caption font-semibold ${incident.status === "recovered" ? "bg-success/15 text-success" : incident.intervention === "human" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"}`}>
                      {incident.status === "recovered" ? "복구됨" : incident.intervention === "human" ? "사람 확인 필요" : "자동 복구 대기"}
                    </span>
                    <strong className="text-body-sm text-text">{CATEGORY_LABEL[incident.category] || "운영 장애"}</strong>
                  </div>
                  <p className="mt-micro truncate text-caption text-muted">{incident.workspaceName} ({incident.workspaceSlug})</p>
                </div>
                <div className="text-caption text-subtle">
                  <p>{SOURCE_LABEL[incident.source] || "외부 서비스"}</p>
                  <p className="mt-micro">발생 {incident.occurrences}회</p>
                </div>
                <time className="text-caption text-subtle" dateTime={incident.lastSeenAt}>{formatSeenAt(incident.lastSeenAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
