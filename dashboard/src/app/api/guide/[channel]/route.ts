import { readText, writeText, dataPath } from "@/lib/file-io";

export async function GET(_request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const common = readText(dataPath("prompt-guide.txt"));
  const channelGuide = readText(dataPath(`prompt-guide.${channel}.txt`));
  const guide = channelGuide || common;
  return Response.json({ guide, common, channelGuide: Boolean(channelGuide), channel });
}

export async function POST(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const data = await request.json();
  const guide = data.guide;
  if (typeof guide !== "string") {
    return Response.json({ error: "guide must be a string" }, { status: 400 });
  }
  writeText(dataPath(`prompt-guide.${channel}.txt`), guide);
  return Response.json({ ok: true, channel });
}
