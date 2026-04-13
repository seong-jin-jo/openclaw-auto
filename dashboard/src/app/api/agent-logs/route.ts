import { readJson, configPath } from "@/lib/file-io";
import fs from "fs";
import path from "path";

export async function GET() {
  const sessionsDir = configPath("agents", "main", "sessions");
  const logs: Array<Record<string, unknown>> = [];

  if (!fs.existsSync(sessionsDir)) {
    return Response.json({ logs: [] });
  }

  try {
    const sessionsFile = path.join(sessionsDir, "sessions.json");
    const sessionsData = readJson<Record<string, Record<string, unknown>>>(sessionsFile) || {};
    const entries = Object.entries(sessionsData).slice(-20);

    for (const [sid, sinfo] of entries) {
      const entry: Record<string, unknown> = { sessionId: sid.slice(0, 8), type: "session" };

      if (sinfo && typeof sinfo === "object") {
        entry.channel = sinfo.channel || "";
        entry.startedAt = sinfo.startedAt || "";
        entry.status = sinfo.status || "";

        const jsonlPath = path.join(sessionsDir, `${sid}.jsonl`);
        if (fs.existsSync(jsonlPath)) {
          try {
            const content = fs.readFileSync(jsonlPath, "utf-8");
            const lastLines = content.split("\n").filter((l) => l.trim());
            const messages: Array<{ role: string; text: string }> = [];

            for (const line of lastLines.slice(-10)) {
              try {
                const d = JSON.parse(line);
                const role = d.role || "";
                let contentText = "";
                if (typeof d.content === "string") {
                  contentText = d.content.slice(0, 200);
                } else if (Array.isArray(d.content)) {
                  for (const c of d.content) {
                    if (c && typeof c === "object" && c.type === "text") {
                      contentText = (c.text || "").slice(0, 200);
                      break;
                    }
                  }
                }
                if (role && contentText) {
                  messages.push({ role, text: contentText });
                }
              } catch {
                // skip malformed
              }
            }
            entry.messages = messages.slice(-5);
          } catch {
            // ignore
          }
        }
      }

      logs.push(entry);
    }
  } catch {
    // ignore
  }

  logs.sort((a, b) => {
    const aAt = String(a.startedAt || "");
    const bAt = String(b.startedAt || "");
    return bAt.localeCompare(aAt);
  });

  return Response.json({ logs: logs.slice(0, 20) });
}
