import { readJson, writeJson, dataPath } from "@/lib/file-io";

// Studio 초안/발행 이력 저장소. data/studio/drafts.json
interface Draft {
  id: string;
  idea: string;
  text: unknown;
  img?: { file: string; localPath: string } | null;
  vid?: { file: string } | null;
  includes: Record<string, boolean>;
  status: "draft" | "published" | "stopped";
  savedAt: string;
  publishedAt?: string;
}
const FILE = "studio/drafts.json";

export async function GET() {
  const drafts = readJson<Draft[]>(dataPath(FILE)) || [];
  return Response.json({ drafts: drafts.slice().reverse().slice(0, 50) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const drafts = readJson<Draft[]>(dataPath(FILE)) || [];
  const now = new Date().toISOString();
  let draft: Draft;
  if (body.id) {
    // 기존 갱신
    const idx = drafts.findIndex((d) => d.id === body.id);
    draft = { ...(idx >= 0 ? drafts[idx] : ({} as Draft)), ...body, savedAt: now };
    if (idx >= 0) drafts[idx] = draft; else drafts.push(draft);
  } else {
    draft = {
      id: `d_${Date.now()}`, idea: body.idea || "", text: body.text ?? null,
      img: body.img ?? null, vid: body.vid ?? null, includes: body.includes ?? {},
      status: body.status || "draft", savedAt: now, publishedAt: body.publishedAt,
    };
    drafts.push(draft);
  }
  writeJson(dataPath(FILE), drafts);
  return Response.json({ ok: true, id: draft.id, draft });
}
