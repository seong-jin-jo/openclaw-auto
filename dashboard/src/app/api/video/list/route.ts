import fs from "fs";
import path from "path";
import { dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { signMediaToken, isSafeMediaFilename } from "@/lib/media-token";

// SNS-015: 테넌트별로 자기 영상만 본다(운영자는 기존과 동일한 공유 루트 + /videos/ 정적 경로를
// 유지 — 운영자는 대시보드 인증(Bearer=DASHBOARD_AUTH_TOKEN)을 이미 통과한 신뢰 주체라 서명
// URL이 필요 없다. dataPath()는 반드시 runWithTenant(...) 컨텍스트 "안"에서 호출한다 — 모듈
// 스코프 상수로 두면 최초 로드 시점(테넌트 컨텍스트 없음)에 한 번만 평가되어 모든 테넌트가
// 같은 경로를 공유하게 된다(finding 6, video/publish/route.ts와 동일 함정).
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, null);

  return runWithTenant(tenantId, async () => {
    const dir = dataPath("videos");
    fs.mkdirSync(dir, { recursive: true });
    const videos: Array<{ filename: string; url: string; size: number; createdAt: number }> = [];

    try {
      const files = fs.readdirSync(dir);
      const entries = files
        .filter((f) => f.endsWith(".mp4") && isSafeMediaFilename(f))
        .map((f) => {
          const fp = path.join(dir, f);
          const stat = fs.statSync(fp);
          let url: string;
          if (tenantId) {
            // 단수명 HMAC 서명 미디어 URL. 경로 파라미터를 임의로 바꿔 다른 테넌트/파일을 열 수
            // 없다는 것(변조 불가 + 만료)이 보장이며, 기밀성은 아니다 — 토큰 payload는 base64url
            // 평문 JSON이라 디코드하면 파일명·테넌트가 보인다(media-token.ts 상단 주석 참조).
            // 서명 불가(비밀 미설정)면 그 파일은 목록에서 제외한다 — 열람 불가능한 링크를
            // 주느니 안 보이는 게 정직하다(fail closed).
            const token = signMediaToken(tenantId, f);
            if (!token) return null;
            url = `/api/media/${token}`;
          } else {
            // 운영자(공유 루트) — 기존 정적 경로 유지, 회귀 없음.
            url = `/videos/${f}`;
          }
          return { filename: f, url, size: stat.size, createdAt: stat.mtimeMs };
        })
        .filter((v): v is { filename: string; url: string; size: number; createdAt: number } => v !== null)
        .sort((a, b) => b.createdAt - a.createdAt);
      videos.push(...entries);
    } catch {
      // dir doesn't exist yet
    }

    return Response.json({ videos });
  });
}
