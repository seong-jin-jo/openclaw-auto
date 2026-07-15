import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventEmitter } from "events";

// 공유 AI(claude -p) 사용 승인 게이트(lib/anthropic.ts assertSharedAiApproved) 전용 검증.
// OSMU v1.0.0 공개 대시보드: 계정 자체(tenants.status)는 가입 즉시 active라 대시보드 진입을 막지
// 않지만, 운영자 자격증명/비용을 쓰는 공유 claude -p는 tenants.shared_cli_approved_at(null=미승인)로
// 별도 게이트한다. BYO Anthropic 키 경로와 tenantId=null(운영자 내부 호출)은 이 게이트 대상이 아니다.
//
// 검증 순서 계약: 미승인이면 quota reserve(usage_quotas INSERT)와 CLI spawn 둘 다 발생하지 않아야
// 한다("before quota reserve/queue/spawn") — 그래서 spawn 호출 여부와 usage_quotas 상태를 직접 관찰한다.

const H = vi.hoisted(() => ({
  byoKey: null as string | null,
  sharedAiApprovedAt: null as string | null,
  dbThrows: false,
  quotaInsertCalls: 0,
  started: [] as { prompt: string; finish: (out: string) => void }[],
}));

vi.mock("child_process", () => ({
  spawn: (_bin: string, _args: string[], _opts: unknown) => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter; stdin: { end: (d: string) => void; on: () => void }; kill: () => void;
    };
    child.stdout = new EventEmitter();
    child.kill = () => {};
    let stdinData = "";
    child.stdin = { end: (data: string) => { stdinData = data; }, on: () => {} };
    H.started.push({
      get prompt() { return stdinData; },
      finish: (out: string) => { child.stdout.emit("data", Buffer.from(out)); child.emit("close", 0); },
    });
    return child;
  },
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, cb: (sql: unknown) => unknown) => {
    const sql = Object.assign(
      (strings: TemplateStringsArray, ..._vals: unknown[]) => {
        const text = strings.join("?");
        if (text.includes("FROM integrations")) return Promise.resolve([{ token: H.byoKey }]);
        if (text.includes("INSERT INTO usage_quotas")) {
          H.quotaInsertCalls++;
          return Promise.resolve([{ generations_used: 1 }]);
        }
        if (text.includes("INSERT INTO usage_events")) return Promise.resolve([]);
        return Promise.resolve([]);
      },
      { json: (v: unknown) => v },
    );
    return cb(sql);
  }),
  db: vi.fn(() => (strings: TemplateStringsArray, ..._vals: unknown[]) => {
    if (H.dbThrows) return Promise.reject(new Error("DB down"));
    const text = strings.join("?");
    if (text.includes("SELECT shared_cli_approved_at")) {
      return Promise.resolve([{ shared_cli_approved_at: H.sharedAiApprovedAt }]);
    }
    return Promise.resolve([]);
  }),
}));

const settle = () => new Promise((r) => setImmediate(r));

async function importAnthropic() {
  return import("@/lib/anthropic");
}

beforeEach(() => {
  vi.resetModules();
  H.byoKey = null;
  H.sharedAiApprovedAt = null;
  H.dbThrows = false;
  H.quotaInsertCalls = 0;
  H.started = [];
  process.env.OSMU_SECRET_KEY = "enc-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("공유 AI 사용 승인 게이트 — 미승인 테넌트(shared_cli_approved_at=null)", () => {
  it("BYO 키 없는 테넌트 + 미승인 → SharedAiApprovalRequiredError, quota reserve/CLI spawn 둘 다 0회", async () => {
    const { generateText, SharedAiApprovalRequiredError } = await importAnthropic();
    await expect(generateText("hello", "tenant-unapproved")).rejects.toBeInstanceOf(SharedAiApprovalRequiredError);
    expect(H.quotaInsertCalls).toBe(0);
    expect(H.started).toHaveLength(0);
  });

  it("에러 메시지는 운영자 승인 또는 BYO 키 등록을 안내한다(빈 메시지 아님)", async () => {
    const { generateText } = await importAnthropic();
    await expect(generateText("hello", "tenant-unapproved")).rejects.toThrow(/승인|Anthropic/);
  });
});

describe("공유 AI 사용 승인 게이트 — 승인된 테넌트(shared_cli_approved_at 존재)", () => {
  it("승인된 테넌트는 정상적으로 quota reserve 후 CLI까지 도달", async () => {
    H.sharedAiApprovedAt = "2026-07-01T00:00:00Z";
    const { generateText } = await importAnthropic();
    const p = generateText("hello", "tenant-approved");
    await settle();
    expect(H.started).toHaveLength(1);
    expect(H.quotaInsertCalls).toBe(1);
    H.started[0].finish("ok");
    await expect(p).resolves.toBe("ok");
  });
});

describe("공유 AI 사용 승인 게이트 — 우회 경로(BYO 키 / tenantId=null)", () => {
  it("BYO Anthropic 키가 있으면 미승인이어도 즉시 허용(게이트 무관)", async () => {
    H.byoKey = "sk-byo";
    H.sharedAiApprovedAt = null;
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ content: [{ text: "byo-out" }] }) })));
    const { generateText } = await importAnthropic();
    await expect(generateText("x", "tenant-byo-unapproved")).resolves.toBe("byo-out");
    expect(H.started).toHaveLength(0);
    expect(H.quotaInsertCalls).toBe(0);
  });

  it("tenantId=null(운영자 내부 호출)은 승인 게이트를 아예 타지 않는다 — db() shared_cli_approved_at 조회 없이 CLI 직행", async () => {
    const { generateText } = await importAnthropic();
    const p = generateText("internal", null);
    await settle();
    expect(H.started).toHaveLength(1);
    H.started[0].finish("internal-out");
    await expect(p).resolves.toBe("internal-out");
    expect(H.quotaInsertCalls).toBe(0); // tenantId=null은 quota도 미대상
  });
});

describe("공유 AI 사용 승인 게이트 — DB 장애", () => {
  it("shared_cli_approved_at 조회 자체가 실패하면 fail-closed로 reject한다(승인됨으로 오해석 금지) — quota/CLI 미실행", async () => {
    H.dbThrows = true;
    const { generateText } = await importAnthropic();
    await expect(generateText("x", "tenant-db-down")).rejects.toThrow();
    expect(H.quotaInsertCalls).toBe(0);
    expect(H.started).toHaveLength(0);
  });
});

describe("sharedAiApprovalErrorResponse — 라우트 헬퍼 매핑 계약", () => {
  it("SharedAiApprovalRequiredError → 403 + code=shared_ai_approval_required", async () => {
    const { SharedAiApprovalRequiredError, sharedAiApprovalErrorResponse } = await importAnthropic();
    const res = sharedAiApprovalErrorResponse(new SharedAiApprovalRequiredError());
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = await res!.json();
    expect(body.code).toBe("shared_ai_approval_required");
  });

  it("그 외 에러는 null을 반환(호출부가 기존 에러 처리를 그대로 쓰게)", async () => {
    const { sharedAiApprovalErrorResponse } = await importAnthropic();
    expect(sharedAiApprovalErrorResponse(new Error("아무 에러"))).toBeNull();
  });
});
