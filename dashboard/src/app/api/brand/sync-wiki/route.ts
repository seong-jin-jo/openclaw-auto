import crypto from "node:crypto";
import { withTenant } from "@/lib/db";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { generateText, sharedGenerationQuotaErrorResponse, sharedAiApprovalErrorResponse } from "@/lib/anthropic";
import {
  RepoTokenDecryptionError,
  getRepoToken,
  getRepoInfo,
  fetchRepoFile,
  listWikiFiles,
  extractTitle,
} from "@/lib/github";

// 위키 폴더 전체 인입 → wiki_docs(테넌트별). 생성 시 pg_trgm으로 검색해 사실 기반 콘텐츠.
// 인입↔생성 분리: 여기선 저장만. 검색·주입은 lib/wiki-retrieve + studio/text.

interface WikiRow { path: string; hash: string }

// GET /api/brand/sync-wiki?tenant_id=... — 인식된 문서 수/경로/마지막 동기화
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  if (!tenantId) return Response.json({ count: 0, docs: [] });
  try {
    const rows = await withTenant(tenantId, (sql) => sql<{ path: string; title: string; updated_at: string }[]>`
      SELECT path, title, updated_at FROM wiki_docs WHERE tenant_id = ${tenantId} ORDER BY path`);
    return Response.json({ count: rows.length, docs: rows });
  } catch (e) {
    return Response.json({ count: 0, docs: [], error: String(e) }, { status: 500 });
  }
}

// POST /api/brand/sync-wiki — { tenant_id, repo:'owner/name', folder?, ref? }
// 폴더 아래 .md 전부 fetch → wiki_docs upsert(hash 증분) + 트리에서 사라진 문서 삭제 → 톤 재증류.
export async function POST(request: Request) {
  const __b = await request.json().catch(() => ({}));
  const tenant_id = await effectiveTenantId(request, __b.tenant_id);
  const repo = typeof __b.repo === "string" ? __b.repo.trim() : "";
  if (!tenant_id || !repo) return Response.json({ error: "tenant_id, repo required" }, { status: 400 });
  if (/\.wiki(?:\.git)?$/i.test(repo)) {
    return Response.json({
      error: "GitHub Wiki(repo.wiki.git)는 지원하지 않습니다. 위키 문서를 일반 레포의 .md 폴더로 옮긴 뒤 owner/name과 폴더 경로를 입력하세요.",
    }, { status: 400 });
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(String(repo))) {
    return Response.json({ error: "repo 형식은 owner/name" }, { status: 400 });
  }
  const folder = (__b.folder ? String(__b.folder).trim() : "").replace(/^\/+/, "");
  if (folder.includes("..")) return Response.json({ error: "folder에 .. 불가" }, { status: 400 });
  const requestedRef = (__b.ref && String(__b.ref).trim()) || "";
  const encryptionKeyConfigured = Boolean(process.env.OSMU_SECRET_KEY);

  let token: string | null;
  try {
    token = await getRepoToken(tenant_id);
  } catch (error) {
    if (error instanceof RepoTokenDecryptionError) {
      return Response.json({
        error: "저장된 GitHub 토큰을 복호화하지 못했습니다. 관리자에게 토큰을 다시 저장해 달라고 요청하세요.",
      }, { status: 400 });
    }
    throw error;
  }

  // 1) 기본 브랜치 조회. 조회 자체가 실패하면 관례 브랜치 main → master 순서로 안전하게 폴백한다.
  const repoInfo = await getRepoInfo(repo, token);
  const refs = requestedRef
    ? [requestedRef]
    : repoInfo.ok && repoInfo.defaultBranch
      ? [repoInfo.defaultBranch]
      : ["main", "master"];
  let selectedRef = refs[0];
  let tree = { paths: [] as string[], truncated: false, status: 404, markdownCount: 0 };
  for (const candidateRef of refs) {
    const result = await listWikiFiles(repo, folder, candidateRef, token);
    tree = { ...result, markdownCount: result.markdownCount ?? result.paths.length };
    if (result.status === 200) {
      selectedRef = candidateRef;
      break;
    }
  }

  const { paths, truncated, status, markdownCount } = tree;
  if (paths.length === 0) {
    if (status === 0 || repoInfo.status === 0) {
      return Response.json({
        error: "GitHub 연결에 실패했습니다. 서버 네트워크 상태를 확인한 뒤 다시 동기화하세요.",
      }, { status: 400 });
    }
    if (status !== 200) {
      if (!encryptionKeyConfigured) {
        return Response.json({
          error: "서버 암호화 키가 설정되지 않아 저장된 GitHub 토큰을 읽을 수 없습니다. 관리자에게 OSMU_SECRET_KEY 설정을 요청하세요.",
        }, { status: 400 });
      }
      if (token && !repoInfo.ok) {
        return Response.json({
          error: "비공개 레포 권한이 없습니다. Fine-grained PAT의 대상 레포와 Contents: read 권한을 확인한 뒤 토큰을 다시 저장하세요.",
        }, { status: 400 });
      }
      if (repoInfo.ok) {
        return Response.json({
          error: `브랜치 '${selectedRef}'를 찾지 못했습니다. GitHub의 실제 브랜치 이름을 확인하거나 브랜치 입력을 비워 기본 브랜치를 사용하세요.`,
        }, { status: 400 });
      }
      return Response.json({
        error: "레포 또는 브랜치를 찾지 못했습니다. owner/name과 브랜치 이름을 확인하세요. 비공개 레포라면 Contents: read 토큰도 저장해야 합니다.",
      }, { status: 400 });
    }
    if (markdownCount > 0 && folder) {
      return Response.json({
        error: `폴더 경로 '${folder}' 아래에 .md 파일이 없습니다. 레포 안의 실제 문서 폴더 경로를 입력하세요.`,
      }, { status: 400 });
    }
    return Response.json({
      error: "레포에 .md 파일이 없습니다. 동기화할 Markdown 문서를 레포 안에 추가한 뒤 다시 시도하세요.",
    }, { status: 400 });
  }

  // 2) 파일별 fetch → 내용/해시
  const docs: { path: string; title: string; content: string; hash: string }[] = [];
  const failed: string[] = [];
  for (const p of paths) {
    const r = await fetchRepoFile(repo, p, selectedRef, token);
    if (r.ok && r.text && r.text.trim().length > 0) {
      docs.push({ path: p, title: extractTitle(r.text, p), content: r.text, hash: crypto.createHash("sha256").update(r.text).digest("hex") });
    } else failed.push(`${p}(${r.status})`);
  }
  if (docs.length === 0) return Response.json({ error: `파일 fetch 실패: ${failed.slice(0, 5).join(", ")}` }, { status: 400 });

  // 3) wiki_docs upsert(hash 증분) + 트리에서 사라진 문서 삭제 (withTenant=RLS)
  let changed = 0;
  const removed = await withTenant(tenant_id, async (sql) => {
    const existing = await sql<WikiRow[]>`SELECT path, hash FROM wiki_docs WHERE tenant_id = ${tenant_id}`;
    const byPath = new Map(existing.map((e) => [e.path, e.hash]));
    for (const d of docs) {
      if (byPath.get(d.path) === d.hash) continue; // 변경 없음 → skip
      changed++;
      await sql`
        INSERT INTO wiki_docs (tenant_id, path, title, content, hash, updated_at)
        VALUES (${tenant_id}, ${d.path}, ${d.title}, ${d.content}, ${d.hash}, now())
        ON CONFLICT (tenant_id, path) DO UPDATE
          SET title = EXCLUDED.title, content = EXCLUDED.content, hash = EXCLUDED.hash, updated_at = now()`;
    }
    // ⚠️ 트리가 truncated(초대형 레포)면 일부 .md만 받은 것 → DELETE 시 트리에 안 잡힌
    // 기존 문서가 삭제됨(데이터 손실). truncated면 삭제 skip(부분 동기화만).
    if (truncated) return 0;
    const keepPaths = docs.map((d) => d.path);
    const del = await sql`DELETE FROM wiki_docs WHERE tenant_id = ${tenant_id} AND path <> ALL(${keepPaths}) RETURNING path`;
    return del.length;
  });

  // 4) 톤 재증류(best-effort) — 전체 문서 제목+선두 발췌 다이제스트 → generateText → brand_guides
  //    (테넌트 Anthropic 키 우선, 없으면 claude -p 폴백. 실패해도 wiki_docs 저장은 유지.)
  let toneUpdated = false;
  try {
    const digest = docs.map((d) => `## ${d.title}\n${d.content.slice(0, 400)}`).join("\n\n").slice(0, 16000);
    const prompt = `너는 브랜드 전략가다. 아래 "마케팅 위키 문서 모음"을 SNS 콘텐츠 생성용 "브랜드 가이드"로 증류하라.
=== 위키 문서 모음 시작 ===
${digest}
=== 위키 문서 모음 끝 ===
출력은 JSON만:
{ "prompt_guide": "콘텐츠 생성 시 주입할 브랜드 톤 가이드(한국어 5~10줄: 보이스·톤·페르소나·핵심 hook·금지표현)", "visual_rules": {"colors": [], "typography": "", "forbidden": []} }`;
    const stdout = await generateText(prompt, tenant_id);
    const m = stdout.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]) as { prompt_guide?: string; visual_rules?: Record<string, unknown> };
      await withTenant(tenant_id, (sql) => sql`
        INSERT INTO brand_guides (tenant_id, prompt_guide, visual_rules, source, source_repo, source_path, source_ref, synced_at)
        VALUES (${tenant_id}, ${parsed.prompt_guide || ""}, ${sql.json((parsed.visual_rules ?? {}) as Parameters<typeof sql.json>[0])},
                'wiki', ${repo}, ${folder || "(repo root)"}, ${selectedRef}, now())
        ON CONFLICT (tenant_id) DO UPDATE
          SET prompt_guide = EXCLUDED.prompt_guide, visual_rules = EXCLUDED.visual_rules,
              source = 'wiki', source_repo = EXCLUDED.source_repo, source_path = EXCLUDED.source_path,
              source_ref = EXCLUDED.source_ref, synced_at = now()`);
      toneUpdated = true;
    }
  } catch (e) {
    // 톤 증류는 best-effort라 대부분의 에러는 삼키고 문서 저장 결과만 반환한다.
    // 단, quota 초과(SharedGenerationQuotaError)/미승인(SharedAiApprovalRequiredError)은 "성공"으로
    // 위장하면 안 되는 과금성/권한 신호라 여기서만 예외적으로 표면화한다(요구사항: 6개 라우트 모두
    // quota는 429, 미승인은 403).
    const approvalResponse = sharedAiApprovalErrorResponse(e);
    if (approvalResponse) return approvalResponse;
    const quotaResponse = sharedGenerationQuotaErrorResponse(e);
    if (quotaResponse) return quotaResponse;
  }

  return Response.json({
    ok: true,
    count: docs.length,
    changed,
    removed,
    toneUpdated,
    truncated,
    failed: failed.length,
    ref: selectedRef,
  });
}
