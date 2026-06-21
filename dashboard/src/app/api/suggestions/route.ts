import { execFile } from "child_process";
import { promisify } from "util";
import { withTenant } from "@/lib/db";
import { effectiveTenantId } from "@/lib/tenant-auth";

// 성과 기반 다음 아이디어. GET: 상위 성과 발행물·시그널(빠름, claude 없음).
// POST: 상위 성과를 claude -p에 넣어 다음 콘텐츠 아이디어 N개 생성(별도 버튼, 자동발화 금지).
// 0차 유사도는 임베딩 대신 views/score 랭킹. tenant는 effectiveTenantId로만.

const execFileP = promisify(execFile);
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";

interface TopPost { id: string; text: string | null; views: number | null; likes: number | null; platform: string | null }
interface TopSignal { content: string | null; score: string | null }

async function loadTop(tenantId: string): Promise<{ posts: TopPost[]; signals: TopSignal[] }> {
  return withTenant(tenantId, async (sql) => {
    const posts = await sql<TopPost[]>`
      SELECT id, text, views, likes, platform FROM published_posts
      WHERE tenant_id = ${tenantId} AND views IS NOT NULL
      ORDER BY views DESC NULLS LAST LIMIT 5`;
    const signals = await sql<TopSignal[]>`
      SELECT content, score FROM viral_signals
      WHERE tenant_id = ${tenantId}
      ORDER BY score DESC NULLS LAST LIMIT 5`;
    return { posts, signals };
  });
}

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  if (!tenantId) return Response.json({ posts: [], signals: [] });
  try {
    const top = await loadTop(tenantId);
    return Response.json(top);
  } catch {
    return Response.json({ posts: [], signals: [] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  if (!tenantId) return Response.json({ error: "no-tenant" }, { status: 401 });

  let top: { posts: TopPost[]; signals: TopSignal[] };
  try {
    top = await loadTop(tenantId);
  } catch {
    return Response.json({ error: "db-unavailable" }, { status: 503 });
  }
  if (top.posts.length === 0 && top.signals.length === 0) {
    return Response.json({ ideas: [], note: "성과 데이터가 아직 없습니다 — 발행·수집 후 다시 시도하세요." });
  }

  const winners = top.posts
    .map((p) => `- (views ${p.views ?? 0}) ${(p.text || "").slice(0, 120)}`)
    .join("\n");
  const prompt = `너는 성과 데이터 기반 콘텐츠 전략가다. 아래는 이 브랜드에서 가장 반응이 좋았던 글들이다.
이 패턴(주제·훅·어조)을 분석해 다음에 만들면 좋을 숏폼/포스트 아이디어 5개를 제안하라.
출력은 JSON 배열만(설명 없이): ["아이디어1", ...]

성과 상위 글:
${winners || "(없음)"}`;

  try {
    const { stdout } = await execFileP(CLAUDE_BIN, ["-p", prompt], { timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
    const m = stdout.match(/\[[\s\S]*\]/);
    const ideas = m ? (JSON.parse(m[0]) as unknown[]).map((x) => String(x).trim()).filter(Boolean).slice(0, 5) : [];
    return Response.json({ ideas, basedOn: top.posts.length });
  } catch (e) {
    return Response.json({ error: `아이디어 생성 실패: ${(e as Error).message.slice(0, 160)}` }, { status: 502 });
  }
}
