import { effectiveTenantId } from "@/lib/tenant-auth";
import { getChannelCred } from "@/lib/publish";

// GET /api/youtube/status — SNS-006 SSOT 통일: YouTube 연결 상태는 DB integrations
// (getChannelCred, tenant별 암호화 토큰)만 본다. 과거엔 이 라우트가 공유 파일
// data/youtube-token.json을 읽어 ①테넌트 격리가 전혀 안 됐고(모든 테넌트가 같은 파일을
// 공유 — 토큰 유출 위험) ②/channels/youtube의 OAuth "연결" 버튼(→DB 저장)과 상태가 서로
// 어긋났다(연결해도 /videos엔 "미연결"로 보임). 이제 연결 버튼이 쓰는 저장소와 동일 소스를 읽는다.
//
// finding 4: DB에 암호화 토큰 문자열이 "있다"는 사실만으론 실제 유효성을 보장하지 않는다
// (만료·revoke될 수 있음). 그래서 bounded read-only provider check(YouTube Data API
// channels.list mine=true)를 실제로 호출해 valid/invalid/unverified 3상태로 분류한다.
// - Google 401/400 → invalid(재연결/refresh 필요) — fail하되 "명확히 무효"로 분류.
// - 네트워크 오류/5xx → unverified — "확인 불가"일 뿐 유효하다고 fail-open하지 않는다.
// raw 토큰이나 Google 응답 바디는 절대 클라이언트로 되돌리지 않는다(finding 4 leak 금지).
const GOOGLE_TIMEOUT_MS = 5000;

async function checkYouTubeToken(accessToken: string): Promise<"valid" | "invalid" | "unverified"> {
  try {
    const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    });
    if (res.status === 401 || res.status === 400) return "invalid";
    if (res.ok) return "valid";
    // 그 외(429/5xx 등) — provider 쪽 일시 장애로 간주, fail-closed(유효 단정 금지)
    return "unverified";
  } catch {
    // 타임아웃/네트워크 오류 — fail-closed
    return "unverified";
  }
}

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  if (!tenantId) return Response.json({ connected: false });

  const cred = await getChannelCred(tenantId, "youtube");
  if (!cred || !cred.token) return Response.json({ connected: false, status: "invalid" });

  const hasRefreshToken = Boolean(cred.refreshToken);
  const status = await checkYouTubeToken(cred.token);

  return Response.json({ connected: status === "valid", status, hasRefreshToken });
}
