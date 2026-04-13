import { readText, writeText, dataPath } from "@/lib/file-io";

export async function GET() {
  const guide = readText(dataPath("prompt-guide.txt"));
  return Response.json({ guide });
}

export async function POST(request: Request) {
  const data = await request.json();
  const guide = data.guide;
  if (typeof guide !== "string") {
    return Response.json({ error: "guide must be a string" }, { status: 400 });
  }
  writeText(dataPath("prompt-guide.txt"), guide);
  return Response.json({ ok: true });
}
