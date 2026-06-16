import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { effectiveTenantId } from "@/lib/tenant-auth";

const execFileP = promisify(execFile);
// 프로비저너 스크립트(레포 scripts/). 컨테이너 배포 시 PROVISION_SCRIPT로 마운트 경로 지정.
const SCRIPT = process.env.PROVISION_SCRIPT || path.resolve(process.cwd(), "../scripts/provision-gateway.sh");

// POST /api/provision { action?: 'up'|'down'|'status' }
// 인증된 테넌트의 전용 게이트웨이를 띄움/내림/상태. tenantId는 effectiveTenantId가 서버측 확정
// (세션/토큰) → 클라가 남의 테넌트 못 건드림. execFile 인자는 UUID·고정문자열뿐(셸 인젝션 없음).
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tenantId = await effectiveTenantId(request, body.tenant_id);
  if (!tenantId) return Response.json({ error: "테넌트 확인 불가" }, { status: 400 });
  const action = ["up", "down", "status"].includes(body.action) ? body.action : "up";
  try {
    const { stdout } = await execFileP("bash", [SCRIPT, tenantId, action], {
      timeout: 120000,
      env: process.env, // DATABASE_URL / OSMU_SECRET_KEY 전달
    });
    return Response.json({ ok: true, action, result: stdout.trim() });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
