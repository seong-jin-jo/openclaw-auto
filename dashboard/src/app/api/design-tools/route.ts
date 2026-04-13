import { readJson, dataPath } from "@/lib/file-io";

export async function GET() {
  const data = readJson(dataPath("design-tools.json")) || {};
  return Response.json(data);
}
