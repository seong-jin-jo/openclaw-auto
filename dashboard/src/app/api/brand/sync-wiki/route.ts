import crypto from "node:crypto";
import { withTenant } from "@/lib/db";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { generateText } from "@/lib/anthropic";
import { getRepoToken, fetchRepoFile, listWikiFiles, extractTitle } from "@/lib/github";

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
  const repo = __b.repo;
  if (!tenant_id || !repo) return Response.json({ error: "tenant_id, repo required" }, { status: 400 });
  if (!/^[\w.-]+\/[\w.-]+$/.test(String(repo))) {
    return Response.json({ error: "repo 형식은 owner/name" }, { status: 400 });
  }
  const folder = (__b.folder ? String(__b.folder).trim() : "").replace(/^\/+/, "");
  if (folder.includes("..")) return Response.json({ error: "folder에 .. 불가" }, { status: 400 });
  const ref = (__b.ref && String(__b.ref).trim()) || "main";

  const token = await getRepoToken(tenant_id);

  // 1) 폴더 아래 .md 전부 나열
  const { paths, truncated, status } = await listWikiFiles(repo, folder, ref, token);
  if (paths.length === 0) {
    return Response.json({
      error: `위키 .md 파일을 못 찾음(트리 status ${status}). repo·folder·ref·${token ? "토큰권한" : "공개여부"} 확인`,
    }, { status: 400 });
  }

  // 2) 파일별 fetch → 내용/해시
  const docs: { path: string; title: string; content: string; hash: string }[] = [];
  const failed: string[] = [];
  for (const p of paths) {
    const r = await fetchRepoFile(repo, p, ref, token);
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
                'wiki', ${repo}, ${folder || "(repo root)"}, ${ref}, now())
        ON CONFLICT (tenant_id) DO UPDATE
          SET prompt_guide = EXCLUDED.prompt_guide, visual_rules = EXCLUDED.visual_rules,
              source = 'wiki', source_repo = EXCLUDED.source_repo, source_path = EXCLUDED.source_path,
              source_ref = EXCLUDED.source_ref, synced_at = now()`);
      toneUpdated = true;
    }
  } catch { /* 톤 증류 실패해도 문서 저장은 유지 */ }

  return Response.json({ ok: true, count: docs.length, changed, removed, toneUpdated, truncated, failed: failed.length });
}
