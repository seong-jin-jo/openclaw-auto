import { readJson, dataPath } from "@/lib/file-io";

export async function GET() {
  const growth = readJson(dataPath("growth.json"));
  if (!growth) return Response.json({ records: [] });
  return Response.json(growth);
}
