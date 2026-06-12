import { execFile } from "child_process";
import { promisify } from "util";
import crypto from "node:crypto";
import { withTenant } from "@/lib/db";

const execFileP = promisify(execFile);
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";

// 레포 위키 → 브랜드 가이드 인입. 소스(repo,path,ref)는 brand_guides에 저장.
// 생성기는 brand_guides만 읽음 — 레포 직접 안 봄(인입↔생성 분리).

interface BrandRow {
  prompt_guide?: string; visual_rules?: unknown; source?: string;
  source_repo?: string; source_path?: string; source_ref?: string;
  source_hash?: string; synced_at?: string;
}

// GET /api/brand/sync-repo?tenant_id=... — 현재 레포 소스 정보
export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) return Response.json({ error: "tenant_id required" }, { status: 400 });
  try {
    const [row] = await withTenant(tenantId, (sql) => sql<BrandRow[]>`
      SELECT source, source_repo, source_path, source_ref, synced_at, prompt_guide
      FROM brand_guides WHERE tenant_id = ${tenantId}`);
    return Response.json({ source: row || null });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/brand/sync-repo — { tenant_id, repo:'owner/name', path, ref? }
// public 레포 raw fetch → claude -p 증류 → brand_guides upsert(source='repo').
export async function POST(request: Request) {
  const { tenant_id, repo, path, ref } = await request.json();
  if (!tenant_id || !repo || !path) {
    return Response.json({ error: "tenant_id, repo, path required" }, { status: 400 });
  }
  // 입력 검증: repo='owner/name', path에 .. 금지
  if (!/^[\w.-]+\/[\w.-]+$/.test(String(repo))) {
    return Response.json({ error: "repo 형식은 owner/name" }, { status: 400 });
  }
  const safePath = String(path).replace(/^\/+/, "");
  if (safePath.includes("..")) return Response.json({ error: "path에 .. 불가" }, { status: 400 });
  const branch = (ref && String(ref).trim()) || "main";

  // 1) public raw fetch
  const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${safePath}`;
  let markdown: string;
  try {
    const resp = await fetch(rawUrl, { headers: { "User-Agent": "osmu-sync" } });
    if (!resp.ok) {
      return Response.json({
        error: `레포 파일을 못 가져옴(${resp.status}). public 레포·경로·브랜치 확인 (private은 추후 토큰 지원)`,
        url: rawUrl,
      }, { status: 400 });
    }
    markdown = await resp.text();
  } catch (e) {
    return Response.json({ error: `fetch 실패: ${String(e).slice(0, 200)}` }, { status: 502 });
  }
  if (markdown.trim().length < 30) {
    return Response.json({ error: "문서가 너무 짧음(30자 미만)" }, { status: 400 });
  }

  // 2) 해시 비교 — 동일하면 재증류 skip(claude -p 비용 절감)
  const hash = crypto.createHash("sha256").update(markdown).digest("hex");
  const [existing] = await withTenant(tenant_id, (sql) => sql<BrandRow[]>`
    SELECT source_hash FROM brand_guides WHERE tenant_id = ${tenant_id}`);
  if (existing?.source_hash === hash) {
    return Response.json({ ok: true, skipped: true, reason: "원문 변경 없음", repo, path: safePath, ref: branch });
  }

  // 3) claude -p 증류 (위저드와 동일 출력 스키마 — brand_guides 정합)
  const input = markdown.slice(0, 20000); // 과대 프롬프트 방지
  const prompt = `너는 브랜드 전략가다. 아래 "마케팅 위키 문서"를 SNS 마케팅 콘텐츠 생성용 "브랜드 가이드"로 증류하라.

=== 마케팅 위키 문서 시작 ===
${input}
=== 마케팅 위키 문서 끝 ===

출력은 JSON만(다른 텍스트 없이):
{
 "prompt_guide": "콘텐츠 생성 시 주입할 브랜드 톤 가이드 (한국어, 5~10줄: 보이스·톤·페르소나·핵심 hook·금지표현 명시. 카피라이터가 바로 쓸 수 있게 구체적으로)",
 "visual_rules": {"colors": ["#hex 또는 색이름", ...], "typography": "서체/타이포 느낌", "forbidden": ["금지 비주얼 요소", ...]}
}`;
  try {
    const { stdout } = await execFileP(CLAUDE_BIN, ["-p", prompt], { timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
    const m = stdout.match(/\{[\s\S]*\}/);
    if (!m) return Response.json({ error: "JSON 추출 실패", raw: stdout.slice(-400) }, { status: 502 });
    const parsed = JSON.parse(m[0]) as { prompt_guide?: string; visual_rules?: Record<string, unknown> };

    // 4) brand_guides upsert (source='repo' + 소스 포인터 + 해시)
    await withTenant(tenant_id, (sql) => sql`
      INSERT INTO brand_guides (tenant_id, prompt_guide, visual_rules, source, source_repo, source_path, source_ref, source_hash, synced_at)
      VALUES (${tenant_id}, ${parsed.prompt_guide || ""}, ${sql.json((parsed.visual_rules ?? {}) as Parameters<typeof sql.json>[0])},
              'repo', ${repo}, ${safePath}, ${branch}, ${hash}, now())
      ON CONFLICT (tenant_id) DO UPDATE
        SET prompt_guide = EXCLUDED.prompt_guide, visual_rules = EXCLUDED.visual_rules,
            source = 'repo', source_repo = EXCLUDED.source_repo, source_path = EXCLUDED.source_path,
            source_ref = EXCLUDED.source_ref, source_hash = EXCLUDED.source_hash, synced_at = now()`);
    return Response.json({ ok: true, repo, path: safePath, ref: branch, guide: { prompt_guide: parsed.prompt_guide, visual_rules: parsed.visual_rules } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg.slice(0, 400) }, { status: 502 });
  }
}
