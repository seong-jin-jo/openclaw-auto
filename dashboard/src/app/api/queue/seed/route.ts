import crypto from "crypto";
import { mutateJson, readText, readJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { generateText } from "@/lib/anthropic";
import { getWikiContext } from "@/lib/wiki-retrieve";
import { mirrorQueuePost } from "@/lib/queue-store";
import { parseDrafts } from "@/lib/seed-parse";
import { fetchSourceText, type ContextSource } from "@/lib/context-source";

// POST /api/queue/seed — "빈 화면 박멸": 브랜드 톤 기반 초안 N개를 한 번에 생성해 draft 큐에 적재.
// 연결 직후 인박스가 비어있지 않게 → approve-don't-author 루프의 첫 콘텐츠.
// body: { count?: number }  (기본 7 = 한 주치)

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const count = Math.min(Math.max(Number(body?.count) || 7, 1), 14);
  const tenantId = await effectiveTenantId(request, null);

  return runWithTenant(tenantId, async () => {
    const guide = readText(dataPath("prompt-guide.txt")) || "";
    const { text: wiki } = tenantId ? await getWikiContext(tenantId, "콘텐츠 아이디어 주제") : { text: "" };

    // 제품-grounded: 설정된 제품 소스(repo changelog/README/docs)를 사실 근거로 주입.
    let product = "";
    const psrc = readJson<ContextSource>(dataPath("product-source.json")) || null;
    if (psrc) {
      const { text, error } = await fetchSourceText(psrc, 1500);
      if (text) product = text;
      else if (error && process.env.OSMU_DEBUG) console.error("[seed] product-source:", error);
    }

    const prompt = `너는 이 브랜드의 SNS 마케터다. 바로 검토·발행 가능한 짧은 초안 ${count}개를 만들어라.
${guide ? `브랜드 톤 가이드:\n${guide}\n` : ""}${wiki ? `\n=== 위키 참조(사실 근거, 없는 내용 지어내기 금지) ===\n${wiki}\n===\n` : ""}${product ? `\n=== 제품 문서/변경(README·changelog 등 — 이 사실에 근거해 "방금 만든 것/업데이트"를 자연스럽게 홍보) ===\n${product}\n===\n` : ""}
규칙:
- 100% 한국어, AI가 쓴 티 절대 금지(~죠?/여러분! 금지), 구어체 OK, 첫 줄 훅.
- 콘텐츠 유형 섞기: 정보성 / 일상 / 질문형(반응유도) / 통찰 / 가벼운 논쟁. 서로 다른 주제.
- 이모지 최대 1개. 각 글 200~400자.

출력은 JSON 배열만(다른 텍스트 없이):
[{"text":"본문","hashtags":["태그1","태그2"],"topic":"info|daily|question|insight|debate"}]`;

    let raw = "";
    try {
      raw = await generateText(prompt, tenantId);
    } catch (e) {
      return Response.json(
        { error: `AI 생성 실패: ${(e as Error).message}. Settings에서 Claude 키를 확인하세요.` },
        { status: 502 },
      );
    }

    const drafts = parseDrafts(raw);
    if (drafts.length === 0) {
      return Response.json({ error: "초안 파싱 실패(빈 결과). 다시 시도하세요." }, { status: 502 });
    }

    const created: Array<{ id: string; text: string }> = [];
    await mutateJson<{ version: number; posts: Array<Record<string, unknown>> }>(
      dataPath("queue.json"),
      (queue) => {
        for (const d of drafts) {
          const post = {
            id: crypto.randomUUID(),
            text: d.text,
            originalText: null,
            topic: d.topic || "ai-seed",
            hashtags: d.hashtags || [],
            status: "draft",
            generatedAt: new Date().toISOString().replace(/\.\d+Z$/, ""),
            approvedAt: null,
            scheduledAt: null,
            publishedAt: null,
            threadsMediaId: null,
            error: null,
            abVariant: "A",
            model: "ai-seed",
            imageUrl: null,
            engagement: null,
          };
          queue.posts.push(post);
          created.push({ id: post.id, text: post.text });
        }
        return queue;
      },
      { version: 2, posts: [] },
    );

    // P4 dual-write: 생성 초안들 DB 미러(best-effort, 무중단)
    for (const c of created) {
      await mirrorQueuePost(tenantId, { id: c.id, text: c.text, status: "draft", topic: "ai-seed" });
    }

    return Response.json({ ok: true, added: created.length });
  });
}
