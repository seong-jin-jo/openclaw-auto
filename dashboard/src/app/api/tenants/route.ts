import { readJson, dataPath } from "@/lib/file-io";

// GET /api/tenants — multi-instance tenants 목록
// fork에서 data/tenants.json 박으면 자동 로드. (data/*는 gitignore라 fork-local)
// CLAUDE.md "서비스 중립" 정합.
export async function GET() {
  try {
    const data = readJson<{ tenants: unknown[] }>(dataPath("tenants.json"));
    return Response.json(data || { tenants: [] });
  } catch (e) {
    return Response.json({ tenants: [], error: String(e) });
  }
}
