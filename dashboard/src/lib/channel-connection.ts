// F2(fdd-r02): 채널 "연결됨" 판정의 단일 소스. 사이드바/배너/Settings/Admin이 모두 이 함수(또는
// 이를 감싼 /api/channel-config 응답)를 통해서만 연결 여부를 판정한다. 레거시 integrations와
// openclaw.json config는 판정에서 배제(발행 폴백 미러링만 별도 유지, schema.sql:259~).
//
// 판정 = channel_accounts에서 해당 (tenant, provider)의 기본(is_default) 계정 status:
//   'active'  → connected
//   'expired' | 'revoked' → reconnect (연결됨으로 오판 금지)
//   행 없음   → disconnected
import { withTenant } from "@/lib/db";

export type ChannelConnectionState = "connected" | "reconnect" | "disconnected";

export async function isChannelConnected(tenantId: string, provider: string): Promise<ChannelConnectionState> {
  if (!tenantId) return "disconnected";
  const [row] = await withTenant(tenantId, (sql) => sql<{ status: string }[]>`
    SELECT status FROM channel_accounts
    WHERE tenant_id = ${tenantId} AND provider = ${provider} AND is_default = true
    ORDER BY created_at DESC LIMIT 1`);
  if (!row) return "disconnected";
  if (row.status === "active") return "connected";
  return "reconnect"; // expired | revoked | 그 외 비활성 상태
}

// 여러 provider를 한 번에 판정(사이드바/배너/Settings 벌크 조회용).
export async function getChannelConnectionStates(
  tenantId: string,
  providers: string[],
): Promise<Record<string, ChannelConnectionState>> {
  if (!tenantId || providers.length === 0) return {};
  const rows = await withTenant(tenantId, (sql) => sql<{ provider: string; status: string }[]>`
    SELECT DISTINCT ON (provider) provider, status
    FROM channel_accounts
    WHERE tenant_id = ${tenantId} AND provider = ANY(${providers})
    ORDER BY provider, is_default DESC, created_at DESC`);
  const out: Record<string, ChannelConnectionState> = {};
  for (const p of providers) out[p] = "disconnected";
  for (const r of rows) out[r.provider] = r.status === "active" ? "connected" : "reconnect";
  return out;
}
