import { withTenant } from "@/lib/db";
import { getChannelCred, publishThreads, publishInstagram, type PublishResult } from "@/lib/publish";

// POST /api/publish — 한 플랫폼 실발행 { tenant_id, platform, text, image_url?, draft_id? }
// 발행 후 published_posts에 기록(성과 수집 대상). 토큰 없으면 명확한 에러(크래시 X).
export async function POST(request: Request) {
  const { tenant_id, platform, text, image_url, draft_id } = await request.json();
  if (!tenant_id || !platform) {
    return Response.json({ error: "tenant_id, platform required" }, { status: 400 });
  }

  const cred = await getChannelCred(tenant_id, platform);
  if (!cred) {
    return Response.json({ ok: false, error: `${platform} 채널 미연결 — Settings에서 토큰 등록 필요` }, { status: 400 });
  }

  let result: PublishResult;
  if (platform === "threads") {
    result = await publishThreads(cred, text || "", image_url);
  } else if (platform === "instagram") {
    result = await publishInstagram(cred, text || "", image_url);
  } else if (platform === "x" || platform === "facebook") {
    // OAuth1.0a(X) / Graph(FB)는 게이트웨이 publish 익스텐션 재사용(P5). 직접발행 미구현.
    result = { ok: false, error: `${platform} 직접발행 미구현 — 게이트웨이 ${platform}_publish 경유(P5)` };
  } else {
    result = { ok: false, error: `${platform} 미지원` };
  }

  // published_posts 기록(성공/실패 모두)
  try {
    await withTenant(tenant_id, (sql) => sql`
      INSERT INTO published_posts (tenant_id, draft_id, platform, external_id, permalink, text, status, error)
      VALUES (${tenant_id}, ${draft_id ?? null}, ${platform}, ${result.externalId ?? null},
              ${result.permalink ?? null}, ${text ?? null},
              ${result.ok ? "published" : "failed"}, ${result.error ?? null})`);
  } catch (e) {
    // 기록 실패는 발행 결과에 영향 X (로그만)
    return Response.json({ ...result, recordError: String(e) });
  }
  return Response.json(result);
}
