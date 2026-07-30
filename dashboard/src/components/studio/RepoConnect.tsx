"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost, ApiResponseError } from "@/lib/api";
import { fmtAgo } from "@/lib/format";
import type { Workspace } from "@/store/ui-store";

// 레포 위키 연동 모달. 2모드:
//  ① 폴더 전체(wiki): 폴더 아래 .md 전부 인입(wiki_docs) → 생성 시 검색·참조(사실 기반).
//  ② 특정 파일(repo): 파일 몇 개 → 브랜드 톤만 증류(brand_guides). 기존 동작.
interface SourceRow { source?: string; source_repo?: string; source_path?: string; source_ref?: string; synced_at?: string }
interface WikiStat { count?: number }
type MessageTone = "ok" | "error" | null;

function syncErrorMessage(error: unknown): string {
  if (error instanceof ApiResponseError) {
    const payload = error.payload as { error?: unknown } | null;
    if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
    return error.message;
  }
  if (error instanceof TypeError) {
    return "네트워크 연결에 실패했습니다. 인터넷 연결을 확인한 뒤 다시 시도하세요.";
  }
  return "동기화 중 오류가 발생했습니다. 잠시 뒤 다시 시도하세요.";
}

export function RepoConnect({ workspace, onSynced, onClose }: { workspace: Workspace; onSynced?: () => void; onClose: () => void }) {
  const { data: srcData, mutate: mutateSrc } = useSWR<{ source?: SourceRow }>(`/api/brand/sync-repo?tenant_id=${workspace.id}`, fetcher);
  const { data: wikiData, mutate: mutateWiki } = useSWR<WikiStat>(`/api/brand/sync-wiki?tenant_id=${workspace.id}`, fetcher);
  const cur = srcData?.source;
  const wikiCount = wikiData?.count ?? 0;

  const [mode, setMode] = useState<"wiki" | "files">("wiki");
  const [repo, setRepo] = useState(cur?.source_repo || "");
  const [path, setPath] = useState(cur?.source_path || "");
  const [ref, setRef] = useState(cur?.source_ref || "main");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [tone, setTone] = useState<MessageTone>(null);

  const saveTokenIfAny = async () => {
    if (token.trim()) {
      await apiPost("/api/integrations", { tenant_id: workspace.id, kind: "repo_token", label: "github", secret: token.trim(), meta: {} });
      setToken("");
    }
  };

  const sync = async () => {
    if (!repo.trim() || busy) return;
    if (mode === "files" && !path.trim()) {
      setMsg("파일 경로를 입력하세요");
      setTone("error");
      return;
    }
    setBusy(true);
    setMsg("");
    setTone(null);
    try {
      await saveTokenIfAny();
      if (mode === "wiki") {
        const r = await apiPost<{ ok?: boolean; count?: number; changed?: number; removed?: number; error?: string }>(
          "/api/brand/sync-wiki", { tenant_id: workspace.id, repo: repo.trim(), folder: path.trim(), ref: ref.trim() || "main" });
        if (r?.ok) {
          await Promise.all([mutateWiki(), mutateSrc()]);
          setMsg(`✓ ${r.count}개 문서 인식됨 (변경 ${r.changed}, 삭제 ${r.removed})`);
          setTone("ok");
          onSynced?.();
        } else {
          setMsg(r?.error || "동기화 실패");
          setTone("error");
        }
      } else {
        const r = await apiPost<{ ok?: boolean; skipped?: boolean; reason?: string; error?: string }>(
          "/api/brand/sync-repo", { tenant_id: workspace.id, repo: repo.trim(), path: path.trim(), ref: ref.trim() || "main" });
        if (r?.ok) {
          await mutateSrc();
          setMsg(r.skipped ? `변경 없음 (${r.reason})` : "브랜드 톤 갱신됨 ✓");
          setTone("ok");
          onSynced?.();
        } else {
          setMsg(r?.error || "동기화 실패");
          setTone("error");
        }
      }
    } catch (error) {
      setMsg(syncErrorMessage(error));
      setTone("error");
    } finally {
      setBusy(false);
    }
  };

  const tab = (m: "wiki" | "files", label: string) => (
    <button onClick={() => setMode(m)} className={`flex-1 py-2 text-xs rounded-lg ${mode === m ? "bg-accent text-text" : "bg-surface-2 text-subtle hover:bg-surface-2"}`}>{label}</button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl p-6 w-[480px] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">📚 레포 위키 연동</h3>
          <button onClick={onClose} className="text-subtle hover:text-muted text-sm">✕</button>
        </div>
        <p className="text-xs text-subtle mb-3">GitHub 위키를 가져옵니다. <b className="text-muted">폴더 전체</b>=문서 다 저장→생성 시 사실 참조 / <b className="text-muted">특정 파일</b>=브랜드 톤만 증류.</p>

        <div className="flex gap-2 mb-3">{tab("wiki", "📚 폴더 전체 (위키)")}{tab("files", "📄 특정 파일 (톤)")}</div>

        {mode === "wiki" && wikiCount > 0 && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-accent-soft border border-accent text-xs text-muted">
            현재 <span className="text-accent">{wikiCount}개 문서</span> 인식됨{cur?.source_repo ? ` · ${cur.source_repo}/${cur.source_path || ""}` : ""}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-subtle">레포 (owner/name)</label>
            <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repo"
              className="w-full mt-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg text-muted focus:border-accent outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-subtle">{mode === "wiki" ? "위키 폴더 (예: wiki/ · 비우면 레포 전체)" : "파일 경로 (여러 개는 쉼표)"}</label>
            <input value={path} onChange={(e) => setPath(e.target.value)} placeholder={mode === "wiki" ? "wiki/" : "docs/brand.md, docs/marketing.md"}
              className="w-full mt-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg text-muted focus:border-accent outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-subtle">브랜치 (기본 main)</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="main"
              className="w-full mt-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg text-muted focus:border-accent outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-subtle">GitHub 토큰 (비공개 레포만 · 1회 저장)</label>
            <input value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="ghp_… (fine-grained, contents 읽기)"
              className="w-full mt-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg text-muted focus:border-accent outline-none" />
          </div>
        </div>

        {msg && <p className={`text-xs mt-3 ${tone === "ok" ? "text-success" : "text-danger"}`}>{msg}</p>}

        <button onClick={sync} disabled={busy || !repo.trim()}
          className="w-full mt-4 py-2.5 text-sm bg-accent text-text rounded-lg disabled:opacity-50">
          {busy ? "동기화 중… (claude)" : mode === "wiki" ? "📚 위키 폴더 전체 동기화" : "🔄 파일 가져와 톤 갱신"}
        </button>
        <p className="text-[10px] text-subtle mt-2">자동 동기화(cron/webhook)는 후속. pgvector 시맨틱 검색 업그레이드 여지.</p>
      </div>
    </div>
  );
}
