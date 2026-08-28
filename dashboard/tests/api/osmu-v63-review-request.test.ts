import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  tenantId: "11111111-1111-4111-8111-111111111111",
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => H.tenantId),
}));

vi.mock("@/lib/queue-store", () => ({
  mirrorQueuePost: vi.fn(async () => true),
}));

describe("BE-V63-05 검토 요청 단일 전환", () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "osmu-review-"));
    process.env.DATA_DIR = dataDir;
    vi.resetModules();
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
    delete process.env.DATA_DIR;
  });

  async function seed(status: string) {
    const dir = path.join(dataDir, "tenants", H.tenantId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "queue.json"), JSON.stringify({
      posts: [{ id: "queue-1", draftId: "draft-1", text: "검토할 초안", status }],
    }));
  }

  async function requestReview() {
    const { POST } = await import("@/app/api/queue/[postId]/request-review/route");
    return POST(new Request("http://localhost/api/queue/queue-1/request-review", {
      method: "POST",
      body: JSON.stringify({ tenant_id: H.tenantId }),
    }), { params: Promise.resolve({ postId: "queue-1" }) });
  }

  it("BE-V63-05 정상 경로: draft를 한 번의 요청으로 승인 인박스 검토 상태로 전환한다", async () => {
    await seed("draft");
    const response = await requestReview();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviewRequest).toMatchObject({
      status: "requested",
      sourceRoom: "studio",
      inboxUrl: "/inbox",
      publishContext: {
        sourceRoute: "inbox",
        queuePostId: "queue-1",
        draftId: "draft-1",
      },
    });
    expect(body.reviewRequest.publishContext.returnUrl).toContain("from=inbox");
  });

  it("BE-V63-05 거절 경로: 이미 승인된 항목은 검토 요청으로 되돌리지 않는다", async () => {
    await seed("approved");
    const response = await requestReview();
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe("not_reviewable");
  });

  it("BE-V63-05 경합 경로: 같은 요청을 동시에 보내도 요청 상태 하나를 재사용한다", async () => {
    await seed("draft");
    const [first, second] = await Promise.all([requestReview(), requestReview()]);
    const bodies = await Promise.all([first.json(), second.json()]);

    expect([first.status, second.status]).toEqual([200, 200]);
    expect(bodies.filter((body) => body.reused)).toHaveLength(1);
    expect(bodies[0].reviewRequest.requestedAt).toBe(bodies[1].reviewRequest.requestedAt);
  });
});
