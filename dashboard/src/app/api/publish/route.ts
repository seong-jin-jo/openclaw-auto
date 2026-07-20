import { withTenant } from "@/lib/db";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { markQueuePublished } from "@/lib/queue-store";
import { reportFailure, normalizePlatform, classifyPublishFailure } from "@/lib/observability";
import {
  getChannelCred,
  fetchInstagramPermalink,
  fetchThreadsPermalink,
  publishThreads,
  publishInstagram,
  publishX,
  publishFacebook,
  publishBluesky,
  publishTelegram,
  publishDiscord,
  publishSlack,
  type PublishResult,
} from "@/lib/publish";

// POST /api/publish — 한 플랫폼 실발행 { tenant_id, platform, text, image_url?, draft_id? }
// 발행 후 published_posts에 기록(성과 수집 대상). 토큰 없으면 명확한 에러(크래시 X).
export async function POST(request: Request) {
  const __b = await request.json();
  const { platform, text, image_url, draft_id, account_id } = __b;
  const tenant_id = await effectiveTenantId(request, __b.tenant_id);
  if (!tenant_id || !platform) {
    return Response.json({ error: "tenant_id, platform required" }, { status: 400 });
  }

  // SNS-007: account_id 지정 시 그 계정으로만 발행 — getChannelCred는 삭제/cross-tenant면 조용히
  // 기본계정으로 새지 않고 null을 반환하므로, 여기선 그 null을 "선택계정 미연결"로 그대로 노출한다.
  const cred = await getChannelCred(tenant_id, platform, account_id || undefined);
  if (!cred) {
    return Response.json(
      {
        ok: false,
        error: account_id
          ? `선택한 ${platform} 계정을 찾을 수 없음 — 삭제되었거나 다른 테넌트 소유`
          : `${platform} 채널 미연결 — Settings에서 토큰 등록 필요`,
      },
      { status: 400 },
    );
  }

  // 동일 초안·플랫폼·계정의 성공 발행을 순차 재시도에서 다시 외부 API로 보내지 않는다.
  // UUID가 아닌 legacy draft id는 기존 동작을 유지한다.
  const isDraftUuid = typeof draft_id === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draft_id);
  if (isDraftUuid) {
    const [existing] = await withTenant(tenant_id, (sql) => sql<{
      external_id: string | null;
      permalink: string | null;
    }[]>`
      SELECT external_id, permalink
        FROM published_posts
       WHERE tenant_id = ${tenant_id}::uuid
         AND draft_id = ${draft_id}::uuid
         AND platform = ${platform}
         AND status = 'published'
         AND account_id IS NOT DISTINCT FROM ${cred.accountId ?? null}::uuid
       ORDER BY published_at DESC
       LIMIT 1
    `);
    if (existing) {
      let permalink = existing.permalink ?? undefined;
      if (!permalink && existing.external_id && (platform === "threads" || platform === "instagram")) {
        const recoveredPermalink = platform === "threads"
          ? await fetchThreadsPermalink(cred.token, existing.external_id)
          : await fetchInstagramPermalink(cred, existing.external_id);
        if (recoveredPermalink) {
          permalink = recoveredPermalink;
          await withTenant(tenant_id, (sql) => sql`
            UPDATE published_posts SET permalink = ${recoveredPermalink}
             WHERE tenant_id = ${tenant_id}::uuid
               AND draft_id = ${draft_id}::uuid
               AND platform = ${platform}
               AND status = 'published'
               AND external_id = ${existing.external_id}
          `);
          await markQueuePublished(tenant_id, draft_id, {
            platform,
            externalId: existing.external_id,
            permalink: recoveredPermalink,
          });
        }
      }
      return Response.json({
        ok: true,
        externalId: existing.external_id ?? undefined,
        permalink,
        alreadyPublished: true,
      });
    }
  }

  let result: PublishResult;
  if (platform === "threads") {
    result = await publishThreads(cred, text || "", image_url);
  } else if (platform === "instagram") {
    result = await publishInstagram(cred, text || "", image_url);
  } else if (platform === "x") {
    // X API v2 + OAuth1.0a 직접발행(P5). text only, 280자 자동 절단.
    result = await publishX(cred, text || "");
  } else if (platform === "facebook") {
    // Facebook 페이지 Graph API 직접발행(P5). image_url 있으면 /photos, 없으면 /feed.
    result = await publishFacebook(cred, text || "", image_url);
  } else if (platform === "bluesky") {
    result = await publishBluesky(cred, text || "", image_url);
  } else if (platform === "telegram") {
    result = await publishTelegram(cred, text || "", image_url);
  } else if (platform === "discord") {
    result = await publishDiscord(cred, text || "", image_url);
  } else if (platform === "slack") {
    result = await publishSlack(cred, text || "", image_url);
  } else {
    result = { ok: false, error: `${platform} 미지원` };
  }

  // 실발행 실패 고위험 경계 — "채널 미연결"(설정 문제, 위에서 이미 400 반환)은 대상이 아니고,
  // 여기 도달한 !ok는 플랫폼 API 호출이 실제로 실패한 경우만. fire-and-forget — 응답/상태코드 불변.
  // platform(요청 바디 원문, 공격자 통제 가능)과 result.error(플랫폼 API 응답 본문 포함 가능한
  // 임의 외부 텍스트)를 절대 그대로 넘기지 않고 고정 코드로만 정규화한다(observability.ts 참고).
  if (!result.ok) {
    const { reason, httpStatus } = classifyPublishFailure(result.error);
    void reportFailure({
      event: "publish_failed",
      severity: "warning",
      context: { platform: normalizePlatform(platform), reason, httpStatus },
    });
  }

  // published_posts 기록(성공/실패 모두)
  try {
    await withTenant(tenant_id, (sql) => sql`
      INSERT INTO published_posts (tenant_id, draft_id, platform, external_id, permalink, text, status, error, account_id)
      VALUES (${tenant_id}, ${draft_id ?? null}, ${platform}, ${result.externalId ?? null},
              ${result.permalink ?? null}, ${text ?? null},
              ${result.ok ? "published" : "failed"}, ${result.error ?? null}, ${cred.accountId ?? null})`);
  } catch (e) {
    // 기록 실패는 발행 결과에 영향 X (로그만)
    return Response.json({ ...result, recordError: String(e) });
  }

  if (result.ok && isDraftUuid) {
    try {
      await markQueuePublished(tenant_id, draft_id, {
        platform,
        externalId: result.externalId,
        permalink: result.permalink,
      });
    } catch (e) {
      return Response.json({ ...result, queueRecordError: String(e) });
    }
  }
  return Response.json(result);
}
