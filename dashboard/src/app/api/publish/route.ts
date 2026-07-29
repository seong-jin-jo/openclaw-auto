import { withTenant } from "@/lib/db";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { markQueuePublished } from "@/lib/queue-store";
import { reportFailure, normalizePlatform, classifyPublishFailure } from "@/lib/observability";
import { refreshImageDeliveryUrl } from "@/lib/image-token";
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

type PersistenceStage = "publication_record" | "queue_record";

function partialPersistenceFailure(
  result: PublishResult,
  input: {
    stage: PersistenceStage;
    draftId: unknown;
    platform: string;
    accountId?: string;
  },
): Response {
  const publicationRecorded = input.stage === "queue_record";
  const code = input.stage === "publication_record"
    ? "PUBLICATION_RECORD_FAILED"
    : "QUEUE_RECORD_FAILED";
  const message = input.stage === "publication_record"
    ? "외부 게시에는 성공했지만 발행 기록 저장에 실패했습니다."
    : "외부 게시와 발행 기록 저장에는 성공했지만 queue 상태 저장에 실패했습니다.";

  return Response.json(
    {
      ok: false,
      externalPublished: true,
      externalId: result.externalId,
      permalink: result.permalink,
      error: `${message} 같은 콘텐츠를 다시 게시하지 말고 내부 기록만 복구하세요.`,
      persistence: {
        ok: false,
        stage: input.stage,
        publicationRecorded,
        queueRecorded: false,
        error: {
          code,
          message,
        },
        reconciliation: {
          required: true,
          action: "repair_persistence_only",
          retryPublish: false,
          draftId: typeof input.draftId === "string" ? input.draftId : null,
          platform: input.platform,
          accountId: input.accountId ?? null,
          externalId: result.externalId ?? null,
          permalink: result.permalink ?? null,
        },
      },
    },
    {
      // RFC 9110 §15.6.1: the provider fulfilled its side effect, but this server
      // could not fulfill the complete request because its own persistence failed.
      // 502 would be incorrect because the upstream response was valid and successful.
      status: 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

// POST /api/publish — 한 플랫폼 실발행 { tenant_id, platform, text, image_url?, draft_id? }
// 발행 후 published_posts에 기록(성과 수집 대상). 토큰 없으면 명확한 에러(크래시 X).
export async function POST(request: Request) {
  const __b = await request.json();
  const { platform, text, image_url, draft_id, account_id } = __b;
  const tenant_id = await effectiveTenantId(request, __b.tenant_id);
  if (!tenant_id || !platform) {
    return Response.json({ error: "tenant_id, platform required" }, { status: 400 });
  }

  let publishImageUrl: string | undefined;
  if (image_url) {
    const refreshed = refreshImageDeliveryUrl(tenant_id, image_url);
    if (!refreshed) {
      return Response.json({ ok: false, error: "이미지 URL이 만료되었거나 유효하지 않습니다. 이미지를 다시 선택해주세요." }, { status: 400 });
    }
    publishImageUrl = refreshed;
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
          try {
            await withTenant(tenant_id, (sql) => sql`
              UPDATE published_posts SET permalink = ${recoveredPermalink}
               WHERE tenant_id = ${tenant_id}::uuid
                 AND draft_id = ${draft_id}::uuid
                 AND platform = ${platform}
                 AND status = 'published'
                 AND external_id = ${existing.external_id}
            `);
          } catch {
            return partialPersistenceFailure(
              { ok: true, externalId: existing.external_id ?? undefined, permalink },
              {
                stage: "publication_record",
                draftId: draft_id,
                platform,
                accountId: cred.accountId,
              },
            );
          }
        }
      }
      const existingResult: PublishResult = {
        ok: true,
        externalId: existing.external_id ?? undefined,
        permalink,
      };
      try {
        const queueRecorded = await markQueuePublished(tenant_id, draft_id, {
          platform,
          externalId: existing.external_id ?? undefined,
          permalink,
        });
        if (!queueRecorded) {
          return partialPersistenceFailure(existingResult, {
            stage: "queue_record",
            draftId: draft_id,
            platform,
            accountId: cred.accountId,
          });
        }
      } catch {
        return partialPersistenceFailure(existingResult, {
          stage: "queue_record",
          draftId: draft_id,
          platform,
          accountId: cred.accountId,
        });
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
    result = await publishThreads(cred, text || "", publishImageUrl);
  } else if (platform === "instagram") {
    result = await publishInstagram(cred, text || "", publishImageUrl);
  } else if (platform === "x") {
    // X API v2 + OAuth1.0a 직접발행(P5). text only, 280자 자동 절단.
    result = await publishX(cred, text || "");
  } else if (platform === "facebook") {
    // Facebook 페이지 Graph API 직접발행(P5). image_url 있으면 /photos, 없으면 /feed.
    result = await publishFacebook(cred, text || "", publishImageUrl);
  } else if (platform === "bluesky") {
    result = await publishBluesky(cred, text || "", publishImageUrl);
  } else if (platform === "telegram") {
    result = await publishTelegram(cred, text || "", publishImageUrl);
  } else if (platform === "discord") {
    result = await publishDiscord(cred, text || "", publishImageUrl);
  } else if (platform === "slack") {
    result = await publishSlack(cred, text || "", publishImageUrl);
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
  } catch {
    if (result.ok) {
      return partialPersistenceFailure(result, {
        stage: "publication_record",
        draftId: draft_id,
        platform,
        accountId: cred.accountId,
      });
    }
    return Response.json(
      {
        ...result,
        persistence: {
          ok: false,
          stage: "publication_record",
          error: { code: "PUBLICATION_RECORD_FAILED", message: "실패한 발행 시도 기록 저장에 실패했습니다." },
        },
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (result.ok && isDraftUuid) {
    try {
      const queueRecorded = await markQueuePublished(tenant_id, draft_id, {
        platform,
        externalId: result.externalId,
        permalink: result.permalink,
      });
      if (!queueRecorded) {
        return partialPersistenceFailure(result, {
          stage: "queue_record",
          draftId: draft_id,
          platform,
          accountId: cred.accountId,
        });
      }
    } catch {
      return partialPersistenceFailure(result, {
        stage: "queue_record",
        draftId: draft_id,
        platform,
        accountId: cred.accountId,
      });
    }
  }
  return Response.json(result);
}
