import { getChannelCred } from "@/lib/publish";
import { withTenant } from "@/lib/db";
import { syncLegacyIntegration } from "@/lib/channel-accounts";

// finding 5: YouTube access_token 갱신 로직의 단일 SSOT. /api/youtube/refresh(수동 갱신)와
// /api/video/publish(401 발생 시 자동 1회 재시도)가 이 헬퍼 하나만 호출한다 — 과거처럼 두 곳에
// 갱신 로직을 복붙하면 한쪽만 고치는 드리프트가 난다. 테넌트 격리: refreshToken은 항상
// getChannelCred(tenantId, "youtube")로 그 테넌트의 DB row에서만 읽고, UPDATE도
// withTenant(tenantId, ...) RLS 컨텍스트 안에서만 수행 — 다른 테넌트의 row를 건드릴 수 없다.
export interface RefreshResult {
  ok: boolean;
  accessToken?: string;
  error?: string;
  status?: number;
}

export async function refreshYoutubeAccessToken(tenantId: string, accountId?: string): Promise<RefreshResult> {
  const cred = await getChannelCred(tenantId, "youtube", accountId);
  const refreshToken = cred?.refreshToken;
  if (!refreshToken) {
    return { ok: false, error: "저장된 refresh token이 없습니다. YouTube를 다시 연결해주세요.", status: 400 };
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID || "";
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) {
    return { ok: false, error: "서버에 YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET이 설정되지 않았습니다.", status: 500 };
  }

  const key = process.env.OSMU_SECRET_KEY;
  if (!key) {
    return { ok: false, error: "OSMU_SECRET_KEY 미설정 — 토큰 암호화 불가", status: 500 };
  }

  try {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    });
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });
    const newTokens = await res.json();
    if (!res.ok || !newTokens.access_token) {
      return { ok: false, error: `YouTube 토큰 갱신 실패 (오류 코드 ${res.status}). 다시 연결이 필요할 수 있습니다.`, status: 502 };
    }
    const expiresInSeconds = Number(newTokens.expires_in);
    if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
      return { ok: false, error: "YouTube 토큰 갱신 응답의 만료시각을 확인할 수 없습니다.", status: 502 };
    }
    const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const resolvedAccountId = cred?.accountId;
    if (resolvedAccountId) {
      const refresh = refreshToken;
      const [updated] = await withTenant(tenantId, async (sql) => {
        const rows = await sql<{ is_default: boolean }[]>`
          UPDATE channel_accounts
          SET secret_enc = armor(pgp_sym_encrypt(${newTokens.access_token as string}, ${key})),
              refresh_enc = armor(pgp_sym_encrypt(${refresh}, ${key})),
              meta = COALESCE(meta, '{}'::jsonb) - 'refreshToken',
              status = 'active',
              token_expires_at = ${tokenExpiresAt},
              updated_at = now()
          WHERE tenant_id = ${tenantId} AND provider = 'youtube' AND id = ${resolvedAccountId}
          RETURNING is_default`;
        return rows;
      });
      if (!updated) return { ok: false, error: "선택한 YouTube 계정을 찾을 수 없습니다.", status: 400 };
      if (updated.is_default) await syncLegacyIntegration(tenantId, "youtube", resolvedAccountId);
    } else {
      // 마이그레이션 전 legacy row 폴백. 기존 meta.refreshToken은 읽기만 하고 새로 쓰지 않는다.
      await withTenant(tenantId, (sql) => sql`
        UPDATE integrations
        SET secret_enc = armor(pgp_sym_encrypt(${newTokens.access_token as string}, ${key}))
        WHERE tenant_id = ${tenantId} AND kind = 'channel' AND label = 'youtube'`);
    }

    return { ok: true, accessToken: newTokens.access_token as string };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "YouTube 토큰 갱신 중 오류가 발생했습니다.", status: 500 };
  }
}
