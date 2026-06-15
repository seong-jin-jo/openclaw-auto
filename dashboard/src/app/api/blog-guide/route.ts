import { readText, writeText, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

// 테넌트 컨텍스트로 감싸 파일을 data/tenants/{id}/ 로 격리(운영자=공유 루트).
export async function GET(request: Request) {
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const guide = readText(dataPath("blog-prompt-guide.txt"));
    return Response.json({ guide });
  });
}

export async function POST(request: Request) {
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const data = await request.json();
    const guide = data.guide;
    if (typeof guide !== "string") {
      return Response.json({ error: "guide must be a string" }, { status: 400 });
    }
    writeText(dataPath("blog-prompt-guide.txt"), guide);
    return Response.json({ ok: true });
  });
}
