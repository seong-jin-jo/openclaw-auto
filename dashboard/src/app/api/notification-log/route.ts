import { readJson, dataPath } from "@/lib/file-io";

export async function GET() {
  const log = readJson<Record<string, unknown>>(dataPath("notification-log.json")) || { entries: [] };
  return Response.json(log);
}
