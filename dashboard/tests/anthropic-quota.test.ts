import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventEmitter } from "events";

// 공유 claude -p 폴백 월별 usage_quotas 원자적 reserve (lib/anthropic.ts) 검증.
// BYO Anthropic 키(HTTP API)와 tenantId=null(운영자 내부)은 quota 대상이 아니고,
// 테넌트 + 공유 CLI만 usage_quotas를 원자적으로 reserve한 뒤 실행돼야 한다.
//
// DB는 얕은 "SQL 문자열만 확인"이 아니라 상태 머신으로 mock한다 — usage_quotas 행을
// tenant_id 키로 메모리에 들고, INSERT..ON CONFLICT..WHERE..RETURNING의 실제 3분기
// (신규/같은월 증가/새월 리셋/한도초과로 미갱신)를 그대로 재현해 동시성·보상 시나리오를
// 결정적으로 검증한다.

const H = vi.hoisted(() => ({
  byoKey: null as string | null,
  quotas: new Map<string, { period: string; generations_used: number; generations_included: number }>(),
  events: [] as { tenantId: string; quantity: unknown; meta: unknown }[],
  active: 0,
  maxActive: 0,
  started: [] as { prompt: string; finish: (out: string) => void; fail: () => void }[],
  // 공유 AI 사용 승인 여부(tenants.shared_cli_approved_at) — 이 파일은 quota reserve/release
  // 로직만 검증하므로 기본은 "승인됨"(비 null 타임스탬프)으로 고정해 승인 게이트가 quota 테스트를
  // 방해하지 않게 한다. 승인 게이트 자체는 tests/anthropic-shared-ai-approval.test.ts에서 검증.
  sharedAiApprovedAt: "2026-07-01T00:00:00Z" as string | null,
}));

// prompt는 이제 argv가 아니라 stdin으로 전달된다(보안 하드닝) — mock도 stdin.end() 데이터를
// "그 호출의 prompt"로 관찰한다. stderr는 프로덕션이 stdio: ["pipe","pipe","ignore"]로 아예
// pipe하지 않으므로(child 진단 출력 캡처·노출 금지) 이 mock도 stderr 스트림을 만들지 않는다 —
// fail()은 close(code=1)만으로 실패를 표현하고, 에러 메시지는 exit code만 담긴다
// (`claude CLI exited with code 1`) — 하위 테스트는 그 고정 문자열로 검증한다.
vi.mock("child_process", () => ({
  spawn: (_bin: string, _args: string[], _opts: unknown) => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter; stdin: { end: (d: string) => void; on: () => void }; kill: () => void;
    };
    child.stdout = new EventEmitter();
    child.kill = () => {};
    let stdinData = "";
    child.stdin = { end: (data: string) => { stdinData = data; }, on: () => {} };

    H.active++;
    H.maxActive = Math.max(H.maxActive, H.active);
    H.started.push({
      get prompt() { return stdinData; },
      finish: (out: string) => { H.active--; child.stdout.emit("data", Buffer.from(out)); child.emit("close", 0); },
      fail: () => { H.active--; child.emit("close", 1); },
    });
    return child;
  },
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (tenantId: string, cb: (sql: unknown) => unknown) => {
    const sql = Object.assign(
      (strings: TemplateStringsArray, ...vals: unknown[]) => {
        const text = strings.join("?");

        if (text.includes("FROM integrations")) {
          return Promise.resolve([{ token: H.byoKey }]);
        }

        if (text.includes("INSERT INTO usage_quotas")) {
          // VALUES(tenant_id, period, limit, 1, now()) ... period, limit, period, period, limit
          const period = vals[1] as string;
          const limit = vals[2] as number;
          let row = H.quotas.get(tenantId);
          if (!row || row.period !== period) {
            row = { period, generations_used: 1, generations_included: limit };
            H.quotas.set(tenantId, row);
            return Promise.resolve([{ generations_used: row.generations_used }]);
          }
          if (row.generations_used < limit) {
            row.generations_used += 1;
            row.generations_included = limit;
            return Promise.resolve([{ generations_used: row.generations_used }]);
          }
          // WHERE 조건 false → UPDATE 스킵, RETURNING 0행(행 상태는 불변)
          return Promise.resolve([]);
        }

        if (text.includes("SELECT generations_used") && text.includes("FROM usage_quotas")) {
          const row = H.quotas.get(tenantId);
          return Promise.resolve(row ? [{ generations_used: row.generations_used, period: row.period }] : []);
        }

        if (text.includes("UPDATE usage_quotas")) {
          // WHERE tenant_id = ? AND period = ?
          const period = vals[1] as string;
          const row = H.quotas.get(tenantId);
          if (row && row.period === period) row.generations_used = Math.max(0, row.generations_used - 1);
          return Promise.resolve([]);
        }

        if (text.includes("INSERT INTO usage_events")) {
          // VALUES(${tenantId}, 'aiGeneration', 1, ${meta}) — 'aiGeneration'과 1은 SQL 리터럴이라
          // vals에는 안 잡힌다(vals = [tenantId, meta]). quantity는 스펙대로 항상 1로 기록.
          H.events.push({ tenantId, quantity: 1, meta: vals[1] });
          return Promise.resolve([]);
        }

        return Promise.resolve([]);
      },
      { json: (v: unknown) => v },
    );
    return cb(sql);
  }),
  // assertSharedAiApproved(lib/anthropic.ts)는 tenants가 RLS 제외 테이블이라 withTenant가 아니라
  // bare db()로 SELECT shared_cli_approved_at을 조회한다 — withTenant mock과 별개로 db()도 모킹해야 한다.
  db: vi.fn(() => (strings: TemplateStringsArray, ..._vals: unknown[]) => {
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

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

beforeEach(() => {
  vi.resetModules();
  H.byoKey = null;
  H.quotas = new Map();
  H.events = [];
  H.active = 0;
  H.maxActive = 0;
  H.started = [];
  process.env.OSMU_SECRET_KEY = "enc-key";
  delete process.env.OSMU_SHARED_GENERATIONS_INCLUDED;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("공유 claude -p 월별 quota — limit 파싱", () => {
  it("OSMU_SHARED_GENERATIONS_INCLUDED 미설정 → 기본 100", async () => {
    const { generateText } = await importAnthropic();
    const p = generateText("x", "tenant-1");
    await settle();
    H.started[0].finish("ok");
    await p;
    expect(H.quotas.get("tenant-1")?.generations_included).toBe(100);
  });

  it.each(["0", "-3", "abc", ""])("비정상 값(%s) → 기본 100으로 폴백", async (v) => {
    process.env.OSMU_SHARED_GENERATIONS_INCLUDED = v;
    const { generateText } = await importAnthropic();
    const p = generateText("x", "tenant-1");
    await settle();
    H.started[0].finish("ok");
    await p;
    expect(H.quotas.get("tenant-1")?.generations_included).toBe(100);
  });

  it("양의 정수 설정값을 그대로 사용", async () => {
    process.env.OSMU_SHARED_GENERATIONS_INCLUDED = "7";
    const { generateText } = await importAnthropic();
    const p = generateText("x", "tenant-1");
    await settle();
    H.started[0].finish("ok");
    await p;
    expect(H.quotas.get("tenant-1")?.generations_included).toBe(7);
  });
});

describe("공유 claude -p 월별 quota — bypass 경로", () => {
  it("BYO Anthropic 키 등록 테넌트는 quota를 소비하지 않는다", async () => {
    H.byoKey = "sk-byo";
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        content: [{ text: "byo-out" }],
        usage: { input_tokens: 123, output_tokens: 45 },
      }),
    })));
    const { generateText } = await importAnthropic();
    const out = await generateText("x", "tenant-byo");
    expect(out).toBe("byo-out");
    expect(H.quotas.has("tenant-byo")).toBe(false);
    expect(H.started).toHaveLength(0); // CLI 자체가 안 돎
    expect(H.events).toHaveLength(1);
    expect(H.events[0]).toMatchObject({
      tenantId: "tenant-byo",
      quantity: 1,
      meta: {
        source: "byo-anthropic-api",
        input_tokens: 123,
        output_tokens: 45,
        total_tokens: 168,
      },
    });
  });

  it("tenantId=null(운영자 내부 호출)은 quota 대상이 아니다 — CLI는 실행하되 usage_quotas 미접촉", async () => {
    const { generateText } = await importAnthropic();
    const p = generateText("internal", null);
    await settle();
    expect(H.started).toHaveLength(1);
    H.started[0].finish("internal-out");
    await expect(p).resolves.toBe("internal-out");
    expect(H.quotas.size).toBe(0);
  });
});

describe("공유 claude -p 월별 quota — 같은 월 증가 / 새 월 리셋", () => {
  it("같은 월 반복 호출 → generations_used가 1씩 누적", async () => {
    const { generateText } = await importAnthropic();
    for (let i = 0; i < 3; i++) {
      const p = generateText(`p${i}`, "tenant-1");
      await settle();
      H.started[H.started.length - 1].finish(`r${i}`);
      await p;
    }
    const row = H.quotas.get("tenant-1")!;
    expect(row.generations_used).toBe(3);
    expect(row.period).toBe(currentPeriod());
  });

  it("월이 바뀐 기존 행 → period·generations_used가 원자적으로 1로 리셋", async () => {
    H.quotas.set("tenant-1", { period: "2020-01", generations_used: 87, generations_included: 100 });
    const { generateText } = await importAnthropic();
    const p = generateText("x", "tenant-1");
    await settle();
    H.started[0].finish("ok");
    await p;
    const row = H.quotas.get("tenant-1")!;
    expect(row.period).toBe(currentPeriod());
    expect(row.generations_used).toBe(1);
  });
});

describe("공유 claude -p 월별 quota — 동시 한도 초과", () => {
  it("limit=1인 테넌트가 2건 연속 요청 → 첫 건만 성공, 둘째는 SharedGenerationQuotaError(카운트 불변)", async () => {
    process.env.OSMU_SHARED_GENERATIONS_INCLUDED = "1";
    const { generateText, SharedGenerationQuotaError } = await importAnthropic();

    const p1 = generateText("first", "tenant-1");
    await settle();
    H.started[0].finish("ok1");
    await expect(p1).resolves.toBe("ok1");
    expect(H.quotas.get("tenant-1")?.generations_used).toBe(1);

    // 두 번째 요청은 큐 진입 시점(실제 실행 직전) reserve에서 즉시 거절돼야 한다 — CLI를 아예 태우지 않음.
    await expect(generateText("second", "tenant-1")).rejects.toBeInstanceOf(SharedGenerationQuotaError);
    expect(H.started).toHaveLength(1); // 두 번째는 execFile까지 못 감
    expect(H.quotas.get("tenant-1")?.generations_used).toBe(1); // 카운트 불변(과다과금 없음)
  });

  it("동시에 발사된 2건(limit=1) → FIFO 큐 덕에 순차 reserve, 둘째는 한도초과로 거절되고 첫째만 카운트", async () => {
    process.env.OSMU_SHARED_GENERATIONS_INCLUDED = "1";
    const { generateText, SharedGenerationQuotaError } = await importAnthropic();

    const p1 = generateText("a", "tenant-1");
    const p2 = generateText("b", "tenant-1");
    await settle();

    // 큐가 FIFO라 이 시점엔 첫 번째만 시작돼 있어야 한다(대기 중인 둘째가 quota를 미리 선점하지 않음).
    expect(H.started.map((s) => s.prompt)).toEqual(["a"]);
    expect(H.quotas.get("tenant-1")?.generations_used).toBe(1);

    H.started[0].finish("ra");
    await expect(p1).resolves.toBe("ra");
    await expect(p2).rejects.toBeInstanceOf(SharedGenerationQuotaError);
    // 둘째는 reserve에서 막혀 CLI가 추가로 시작되지 않았다
    expect(H.started).toHaveLength(1);
    expect(H.quotas.get("tenant-1")?.generations_used).toBe(1);
  });

  it("서로 다른 테넌트는 독립적으로 카운트(한 테넌트의 한도초과가 다른 테넌트를 막지 않음)", async () => {
    process.env.OSMU_SHARED_GENERATIONS_INCLUDED = "1";
    const { generateText } = await importAnthropic();

    const pA = generateText("a", "tenant-A");
    await settle();
    H.started[0].finish("ra");
    await expect(pA).resolves.toBe("ra");

    const pB = generateText("b", "tenant-B");
    await settle();
    H.started[1].finish("rb");
    await expect(pB).resolves.toBe("rb");

    expect(H.quotas.get("tenant-A")?.generations_used).toBe(1);
    expect(H.quotas.get("tenant-B")?.generations_used).toBe(1);
  });
});

describe("공유 claude -p 월별 quota — 실패 보상", () => {
  it("claude -p 실패(reject) → 방금 reserve한 카운트를 GREATEST(0,used-1)로 보상", async () => {
    const { generateText } = await importAnthropic();
    const p = generateText("boom", "tenant-1");
    await settle();
    expect(H.quotas.get("tenant-1")?.generations_used).toBe(1); // reserve는 이미 반영됨
    H.started[0].fail();
    await expect(p).rejects.toThrow("claude CLI exited with code 1");
    expect(H.quotas.get("tenant-1")?.generations_used).toBe(0); // 보상 완료
  });

  it("보상 후 다음 요청은 정상적으로 다시 reserve(한도 소진 상태로 남지 않음)", async () => {
    process.env.OSMU_SHARED_GENERATIONS_INCLUDED = "1";
    const { generateText } = await importAnthropic();
    const p1 = generateText("boom", "tenant-1");
    await settle();
    H.started[0].fail();
    await expect(p1).rejects.toThrow("claude CLI exited with code 1");

    const p2 = generateText("retry", "tenant-1");
    await settle();
    expect(H.started).toHaveLength(2); // 보상 덕에 두 번째도 CLI까지 도달
    H.started[1].finish("ok");
    await expect(p2).resolves.toBe("ok");
  });

  it("이미 0인데 중복 보상 시도해도 음수로 내려가지 않는다(GREATEST 0 하한)", async () => {
    H.quotas.set("tenant-1", { period: currentPeriod(), generations_used: 0, generations_included: 100 });
    // reserve가 0→1로 올린 뒤 실패 보상 1→0. 그 상태에서 다시 실패해도 0 밑으로 안 내려감(정의상 불가하지만 방어 확인).
    const { generateText } = await importAnthropic();
    const p = generateText("boom", "tenant-1");
    await settle();
    H.started[0].fail();
    await expect(p).rejects.toThrow("claude CLI exited with code 1");
    expect(H.quotas.get("tenant-1")?.generations_used).toBe(0);
  });
});

describe("공유 claude -p 월별 quota — 성공 이벤트 기록", () => {
  it("성공 시 usage_events에 aiGeneration quantity=1, source=shared-claude-cli 기록", async () => {
    const { generateText } = await importAnthropic();
    const p = generateText("hello", "tenant-1");
    await settle();
    H.started[0].finish("output-text");
    await expect(p).resolves.toBe("output-text");

    expect(H.events).toHaveLength(1);
    expect(H.events[0].tenantId).toBe("tenant-1");
    expect(H.events[0].quantity).toBe(1);
    expect(H.events[0].meta).toMatchObject({ source: "shared-claude-cli" });
  });

  it("BYO 키 경로는 shared-claude-cli가 아니라 byo-anthropic-api 이벤트를 남긴다", async () => {
    H.byoKey = "sk-byo";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ content: [{ text: "byo" }] }) })));
    const { generateText } = await importAnthropic();
    await generateText("x", "tenant-1");
    expect(H.events).toHaveLength(1);
    expect(H.events[0].meta).toMatchObject({ source: "byo-anthropic-api" });
    expect(H.events[0].meta).not.toMatchObject({ source: "shared-claude-cli" });
  });
});
