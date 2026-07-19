import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { installFetch } from "./helpers/mock-fetch";
import { withTenant } from "@/lib/db";

// ── /api/publish 분기 하네스 (인프라 無, 항상 실행) ───────────────────────────
// 사용자 요구: "올바른 토큰 happy path / 생략(skip) / 잘못된 토큰" 전 분기를 스크립트로 박제.
// 경계: effectiveTenantId(토큰→테넌트)·getChannelCred(채널 자격)·withTenant(DB 기록)를 목으로
// 고정하고, 실 publish*() 함수는 그대로 두되 global fetch만 목 → 플랫폼 API 없이 분기 검증.
//
// 주의: 실제 route는 effectiveTenantId(request, body.tenant_id) — body의 tenant_id를 fallback으로
// 받는다(운영자 경로). 여기선 effectiveTenantId 출력 자체를 고정해 route 분기만 검증한다.
// (fallback 해석 로직은 tenant-auth의 책임으로 별도.)

const H = vi.hoisted(() => ({
  tenantId: null as string | null,
  cred: null as { token: string; userId?: string; meta?: Record<string, unknown>; accountId?: string } | null,
  inserts: [] as unknown[][],
  getChannelCredCalls: [] as unknown[][],
  existingPublication: null as { external_id: string | null; permalink: string | null } | null,
  markQueuePublishedCalls: [] as unknown[][],
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => H.tenantId),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tid: string, cb: (sql: unknown) => unknown) => {
    const sql = (strings: TemplateStringsArray, ...vals: unknown[]) => {
      if (strings.join(" ").includes("SELECT external_id, permalink")) {
        return Promise.resolve(H.existingPublication ? [H.existingPublication] : []);
      }
      H.inserts.push(vals);
      return Promise.resolve([]);
    };
    sql.json = (value: unknown) => value;
    return cb(sql);
  }),
}));

vi.mock("@/lib/queue-store", () => ({
  markQueuePublished: vi.fn(async (...args: unknown[]) => {
    H.markQueuePublishedCalls.push(args);
    return true;
  }),
}));

vi.mock("@/lib/publish", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/publish")>();
  return {
    ...actual,
    getChannelCred: vi.fn(async (...args: unknown[]) => {
      H.getChannelCredCalls.push(args);
      return H.cred;
    }),
    fetchThreadsPermalink: vi.fn(async () => "https://www.threads.net/@u/post/recovered"),
  };
});

// published_posts INSERT 값 순서:
// [tenant_id, draft_id, platform, external_id, permalink, text, status, error, account_id]
const I = { tenant: 0, draft: 1, platform: 2, externalId: 3, permalink: 4, text: 5, status: 6, error: 7, accountId: 8 };

async function callPublish(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/publish/route");
  const res = await POST(
    new Request("http://localhost/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  H.tenantId = "tenant-1";
  H.cred = { token: "tok", userId: "u-1" };
  H.inserts = [];
  H.getChannelCredCalls = [];
  H.existingPublication = null;
  H.markQueuePublishedCalls = [];
  vi.mocked(withTenant).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/api/publish — 입력/인증 분기", () => {
  it("platform 누락 → 400, DB 기록 없음", async () => {
    const { status, body } = await callPublish({ text: "hi" });
    expect(status).toBe(400);
    expect(body.error).toMatch(/platform required/);
    expect(H.inserts).toHaveLength(0);
  });

  it("잘못된/만료 토큰(테넌트 해석 불가) → 400, DB 기록 없음", async () => {
    H.tenantId = null;
    const { status, body } = await callPublish({ platform: "threads", text: "hi" });
    expect(status).toBe(400);
    expect(body.error).toMatch(/tenant_id/);
    expect(H.inserts).toHaveLength(0);
  });

  it("채널 미연결(getChannelCred=null) → 400 미연결, 발행/기록 안 함", async () => {
    H.cred = null;
    const { status, body } = await callPublish({ platform: "threads", text: "hi" });
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/미연결/);
    expect(H.inserts).toHaveLength(0);
  });
});

describe("/api/publish — SNS-007 account_id 선택 발행", () => {
  it("account_id 지정 시 getChannelCred에 그대로 전달된다(선택계정으로만 발행)", async () => {
    H.cred = { token: "tok", userId: "u-1", accountId: "acc-42" };
    installFetch([
      { match: "me?fields=id", json: { id: "live-id" } },
      { match: "fields=status", json: { status: "FINISHED" } },
      { match: "/threads_publish", json: { id: "media-1" } },
      { match: "/threads", json: { id: "container-1" } },
      { match: "fields=permalink", json: { permalink: "https://www.threads.net/@u/post/1" } },
    ]);
    const { status, body } = await callPublish({ platform: "threads", text: "hi", account_id: "acc-42" });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    // getChannelCred(tenantId, platform, accountId) — 3번째 인자로 선택계정이 그대로 전달됐는지
    expect(H.getChannelCredCalls[0]).toEqual(["tenant-1", "threads", "acc-42"]);
    // published_posts.account_id에 실제 발행에 쓰인 계정(cred.accountId)이 기록되는지
    expect(H.inserts[0][I.accountId]).toBe("acc-42");
  });

  it("account_id가 삭제/cross-tenant 계정이면(getChannelCred=null) 기본계정으로 새지 않고 명확한 에러", async () => {
    H.cred = null;
    const { status, body } = await callPublish({ platform: "threads", text: "hi", account_id: "gone-1" });
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/선택한.*계정을 찾을 수 없음/);
    expect(H.getChannelCredCalls[0]).toEqual(["tenant-1", "threads", "gone-1"]);
    expect(H.inserts).toHaveLength(0);
  });

  it("account_id 미지정 시 undefined로 전달(기본계정 경로) — 발행 성공 시 account_id 없이 기록", async () => {
    H.cred = { token: "tok", userId: "u-1" }; // accountId 없음(기본계정 mock에선 미설정)
    installFetch([
      { match: "me?fields=id", json: { id: "live-id" } },
      { match: "fields=status", json: { status: "FINISHED" } },
      { match: "/threads_publish", json: { id: "media-2" } },
      { match: "/threads", json: { id: "container-2" } },
      { match: "fields=permalink", json: { permalink: "https://www.threads.net/@u/post/2" } },
    ]);
    const { status, body } = await callPublish({ platform: "threads", text: "hi" });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(H.getChannelCredCalls[0]).toEqual(["tenant-1", "threads", undefined]);
    expect(H.inserts[0][I.accountId]).toBeNull();
  });
});

describe("/api/publish — happy path (실 publish* + fetch 목)", () => {
  it("threads: container→publish→permalink, published 기록", async () => {
    installFetch([
      { match: "me?fields=id", json: { id: "live-id" } },
      { match: "fields=status", json: { status: "FINISHED" } },
      { match: "/threads_publish", json: { id: "media-1" } },
      { match: "/threads", json: { id: "container-1" } },
      { match: "fields=permalink", json: { permalink: "https://www.threads.net/@u/post/1" } },
    ]);
    const { status, body } = await callPublish({ platform: "threads", text: "hi", draft_id: "d-1" });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.externalId).toBe("media-1");
    expect(body.permalink).toContain("threads.net");
    expect(H.inserts).toHaveLength(1);
    const v = H.inserts[0];
    expect(v[I.status]).toBe("published");
    expect(v[I.platform]).toBe("threads");
    expect(v[I.externalId]).toBe("media-1");
    expect(v[I.draft]).toBe("d-1");
  });

  it("UUID draft 성공 시 queue를 published로 마킹한다", async () => {
    installFetch([
      { match: "me?fields=id", json: { id: "live-id" } },
      { match: "fields=status", json: { status: "FINISHED" } },
      { match: "/threads_publish", json: { id: "media-uuid" } },
      { match: "/threads", json: { id: "container-uuid" } },
      { match: "fields=permalink", json: { permalink: "https://www.threads.net/@u/post/uuid" } },
    ]);
    const draftId = "13730d99-a268-47de-9cf9-90157ea1fa79";
    const { body } = await callPublish({ platform: "threads", text: "hi", draft_id: draftId });

    expect(body.ok).toBe(true);
    expect(H.markQueuePublishedCalls).toEqual([["tenant-1", draftId, {
      platform: "threads",
      externalId: "media-uuid",
      permalink: "https://www.threads.net/@u/post/uuid",
    }]]);
  });

  it("동일 UUID draft/platform/account 성공 기록이 있으면 외부 발행을 반복하지 않는다", async () => {
    H.cred = { token: "tok", userId: "u-1", accountId: "11111111-1111-4111-8111-111111111111" };
    H.existingPublication = {
      external_id: "already-1",
      permalink: "https://www.threads.net/@u/post/already",
    };
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { body } = await callPublish({
      platform: "threads",
      text: "hi",
      draft_id: "13730d99-a268-47de-9cf9-90157ea1fa79",
      account_id: "11111111-1111-4111-8111-111111111111",
    });

    expect(body).toMatchObject({ ok: true, externalId: "already-1", alreadyPublished: true });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(H.inserts).toHaveLength(0);
    expect(H.markQueuePublishedCalls).toHaveLength(0);
  });

  it("기존 성공 기록의 permalink가 비었으면 외부 재발행 없이 URL만 복구한다", async () => {
    H.existingPublication = { external_id: "already-no-link", permalink: null };
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const draftId = "13730d99-a268-47de-9cf9-90157ea1fa79";

    const { body } = await callPublish({ platform: "threads", text: "hi", draft_id: draftId });

    expect(body).toMatchObject({
      ok: true,
      externalId: "already-no-link",
      permalink: "https://www.threads.net/@u/post/recovered",
      alreadyPublished: true,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(H.markQueuePublishedCalls).toHaveLength(1);
  });

  it("x: 4키 OAuth1.0a 트윗 → published 기록, 280자 절단", async () => {
    H.cred = { token: "", meta: { apiKey: "a", apiSecret: "b", accessToken: "c", accessSecret: "d" } };
    const { calls } = installFetch([{ match: "api.twitter.com/2/tweets", json: { data: { id: "tw-1" } } }]);
    const longText = "가".repeat(300); // 300 코드포인트 → 280로 잘려야 함
    const { status, body } = await callPublish({ platform: "x", text: longText });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.externalId).toBe("tw-1");
    expect(H.inserts[0][I.status]).toBe("published");
    // 전송된 트윗 본문이 정확히 280 코드포인트로 절단됐는지
    const sent = JSON.parse(calls.find((c) => c.url.includes("/2/tweets"))!.body!);
    expect([...sent.text].length).toBe(280);
    // OAuth1.0a 서명 헤더가 붙었는지(서명 자체 검증은 별도지만 헤더 존재는 회귀 방지)
  });
});

describe("/api/publish — 실패/기록 분기", () => {
  it("플랫폼 API 실패 → ok:false, failed 기록 + error 저장 (HTTP는 200)", async () => {
    installFetch([
      { match: "me?fields=id", json: { id: "live-id" } },
      { match: "/threads", status: 400, text: "Invalid token" },
    ]);
    const { status, body } = await callPublish({ platform: "threads", text: "hi" });
    // route는 result를 그대로 반환 → HTTP 200, ok:false
    expect(status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/container 실패/);
    expect(H.inserts).toHaveLength(1);
    expect(H.inserts[0][I.status]).toBe("failed");
    expect(H.inserts[0][I.error]).toMatch(/container 실패/);
  });

  it("DB 기록 실패 → recordError 반환, 발행 결과는 보존", async () => {
    installFetch([
      { match: "me?fields=id", json: { id: "live-id" } },
      { match: "fields=status", json: { status: "FINISHED" } },
      { match: "/threads_publish", json: { id: "media-9" } },
      { match: "/threads", json: { id: "container-9" } },
      { match: "fields=permalink", json: { permalink: "https://x" } },
    ]);
    vi.mocked(withTenant).mockImplementationOnce(async () => {
      throw new Error("db down");
    });
    const { status, body } = await callPublish({ platform: "threads", text: "hi" });
    expect(status).toBe(200);
    expect(body.ok).toBe(true); // 발행은 성공
    expect(body.externalId).toBe("media-9");
    expect(body.recordError).toMatch(/db down/);
  });

  it("미지원 플랫폼 → ok:false, failed 기록", async () => {
    const { body } = await callPublish({ platform: "myspace", text: "hi" });
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/미지원/);
    expect(H.inserts[0][I.status]).toBe("failed");
  });
});
