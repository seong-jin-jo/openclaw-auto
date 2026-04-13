import { readJson, dataPath } from "@/lib/file-io";

export async function GET() {
  const report = readJson(dataPath("trend-report.json"));
  if (!report) {
    return Response.json({ generatedAt: null, keywords: {}, rewriteCandidates: [] });
  }
  return Response.json(report);
}
