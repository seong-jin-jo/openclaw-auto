import { readText, writeText, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

export async function GET(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  // 테넌트 컨텍스트로 감싸 file-io가 data/tenants/{id}/ 로 격리되도록 함
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { channel } = await params;
    const common = readText(dataPath("prompt-guide.txt"));
    const channelGuide = readText(dataPath(`prompt-guide.${channel}.txt`));
    const guide = channelGuide || common;
    return Response.json({ guide, common, channelGuide: Boolean(channelGuide), channel });
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  // 테넌트 컨텍스트로 감싸 file-io가 data/tenants/{id}/ 로 격리되도록 함
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { channel } = await params;
    const data = await request.json();
    const guide = data.guide;
    if (typeof guide !== "string") {
      return Response.json({ error: "guide must be a string" }, { status: 400 });
    }
    writeText(dataPath(`prompt-guide.${channel}.txt`), guide);
    return Response.json({ ok: true, channel });
  });
}
