import fs from "fs";
import { dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

export async function POST(request: Request) {
  // 테넌트 컨텍스트로 감싸 파일 I/O를 data/tenants/{id}/ 로 격리
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const data = await request.json();
    const text = (data.text || "").trim();
    if (!text) return Response.json({ error: "text required" }, { status: 400 });

    const url = (data.url || "").trim();
    const topic = (data.topic || "general").trim();

    let username = "";
    if (url && url.includes("threads.net/@")) {
      try {
        username = url.split("threads.net/@")[1].split("/")[0];
      } catch { /* ignore */ }
    }

    const today = new Date().toISOString().split("T")[0];
    let entry = `\n---\ntopic: ${topic}\nengagement: unknown\nlikes: 0\nsource: external\ncollected: ${today}`;
    if (username) entry += `\nusername: ${username}`;
    if (url) entry += `\nurl: ${url}`;
    entry += `\ntext: ${text.replace(/\n/g, " ")}\n`;

    const filePath = dataPath("popular-posts.txt");
    fs.appendFileSync(filePath, entry, "utf-8");

    return Response.json({ ok: true });
  });
}
