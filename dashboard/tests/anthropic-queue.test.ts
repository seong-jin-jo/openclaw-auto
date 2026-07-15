import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventEmitter } from "events";

// 공유 claude -p 폴백 직렬화 큐(lib/anthropic.ts runSerializedCli) 검증.
// 여러 테넌트가 프로세스 1개의 공유 CLI 프로필을 쓰므로 CLI 폴백은 동시 1개(FIFO)여야 하고,
// 테넌트 BYO 키(HTTP API) 경로는 큐를 타지 않아야 한다(테넌트별 격리 — 동시 실행 유지).
// 실제 시간/프로세스 없이 결정적으로 검증: spawn을 수동 완료(deferred) EventEmitter mock으로 대체.
// prompt는 이제 argv가 아니라 stdin으로 전달되므로(보안 하드닝), mock도 stdin.end() 데이터를
// "그 호출의 prompt"로 관찰한다 — 세부 플래그/argv/timeout/출력상한 경계는
// tests/anthropic-cli-safety.test.ts에서 별도로 검증한다.

const H = vi.hoisted(() => ({
  active: 0, // 현재 "실행 중" CLI 수 — 큐가 새면 2 이상으로 관찰됨
  maxActive: 0,
  started: [] as { prompt: string; finish: (out: string) => void; fail: () => void }[],
  byoKey: null as string | null,
}));

vi.mock("child_process", () => ({
  // runClaudeCli는 spawn(bin, args, opts)를 호출하고 child.stdin.end(prompt)로 프롬프트를 넘긴다.
  // stderr는 프로덕션이 stdio: ["pipe","pipe","ignore"]로 아예 pipe하지 않으므로(보안 하드닝 —
  // child 진단 출력을 캡처·노출하지 않음) 이 mock도 stderr 스트림을 만들지 않는다 — 실패는
  // close(code!=0)만으로 표현한다.
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

// getAnthropicKey의 SELECT 1회를 대체 — byoKey 설정 시 해당 테넌트가 BYO 키 보유.
// db()는 assertSharedAiApproved(공유 AI 승인 게이트)가 bare db()로 SELECT shared_cli_approved_at을
// 조회하는 경로 — 이 파일은 FIFO 큐 동작만 검증하므로 항상 "승인됨"으로 고정한다(게이트 자체 검증은
// tests/anthropic-shared-ai-approval.test.ts).
vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async () => [{ token: H.byoKey }]),
  db: vi.fn(() => () => Promise.resolve([{ shared_cli_approved_at: "2026-07-01T00:00:00Z" }])),
}));

// 마이크로태스크/매크로태스크 큐를 비워 "지금 시작 가능했던 작업"만 시작된 상태로 만든다.
const settle = () => new Promise((r) => setImmediate(r));

async function importGenerateText() {
  // 모듈-로컬 큐 상태(cliQueueTail)를 테스트마다 초기화하기 위해 매번 새로 import.
  const mod = await import("@/lib/anthropic");
  return mod.generateText;
}

beforeEach(() => {
  vi.resetModules();
  H.active = 0;
  H.maxActive = 0;
  H.started = [];
  H.byoKey = null;
  process.env.OSMU_SECRET_KEY = "enc-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("claude -p 공유 CLI 폴백 — FIFO 직렬화 큐", () => {
  it("동시 3건 요청 → CLI는 항상 1개만 실행, 요청 순서(FIFO)대로 처리", async () => {
    const generateText = await importGenerateText();
    const p1 = generateText("one", null);
    const p2 = generateText("two", null);
    const p3 = generateText("three", null);
    await settle();

    // 3건 enqueue됐지만 시작된 CLI는 첫 번째 하나뿐
    expect(H.started.map((s) => s.prompt)).toEqual(["one"]);
    expect(H.active).toBe(1);

    H.started[0].finish("r1");
    await expect(p1).resolves.toBe("r1");
    await settle();
    expect(H.started.map((s) => s.prompt)).toEqual(["one", "two"]);

    H.started[1].finish("r2");
    await expect(p2).resolves.toBe("r2");
    await settle();
    expect(H.started.map((s) => s.prompt)).toEqual(["one", "two", "three"]);

    H.started[2].finish("r3");
    await expect(p3).resolves.toBe("r3");

    // 전 구간에서 동시 실행이 1을 넘은 적 없음
    expect(H.maxActive).toBe(1);
  });

  it("앞 CLI가 실패(타임아웃 등 reject)해도 큐가 풀리고 다음 대기자가 FIFO로 진행", async () => {
    const generateText = await importGenerateText();
    const p1 = generateText("boom", null);
    const p2 = generateText("next", null);
    await settle();
    expect(H.started.map((s) => s.prompt)).toEqual(["boom"]);

    H.started[0].fail();
    await expect(p1).rejects.toThrow("claude CLI exited with code 1");
    await settle();

    // 실패가 큐를 잠그지 않음 — 다음 작업이 시작됨
    expect(H.started.map((s) => s.prompt)).toEqual(["boom", "next"]);
    H.started[1].finish("ok");
    await expect(p2).resolves.toBe("ok");
    expect(H.maxActive).toBe(1);
  });

  it("BYO Anthropic 키 경로(HTTP API)는 큐를 우회 — CLI가 점유 중이어도 즉시 완료", async () => {
    H.byoKey = "sk-byo-tenant";
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ content: [{ text: "byo-result" }] }),
    })));
    const generateText = await importGenerateText();

    // 큐를 CLI 작업으로 점유(완료시키지 않음)
    const pCli = generateText("cli-job", null);
    await settle();
    expect(H.started.map((s) => s.prompt)).toEqual(["cli-job"]);

    // CLI가 잡혀 있는 동안 BYO 호출이 대기 없이 완료돼야 한다
    const pByo = generateText("byo-job", "tenant-1");
    await expect(pByo).resolves.toBe("byo-result");
    expect(H.active).toBe(1); // CLI는 여전히 실행 중(=BYO가 큐를 안 탔다는 관찰)
    expect(H.started).toHaveLength(1); // BYO는 spawn(CLI)로 가지 않음
    expect(fetch).toHaveBeenCalledTimes(1);

    H.started[0].finish("cli-out");
    await expect(pCli).resolves.toBe("cli-out");
  });

  it("테넌트여도 BYO 키가 없으면 CLI 폴백 — 역시 큐를 탄다", async () => {
    H.byoKey = null;
    const generateText = await importGenerateText();
    const p1 = generateText("a", "tenant-1");
    const p2 = generateText("b", "tenant-1");
    await settle();
    expect(H.started.map((s) => s.prompt)).toEqual(["a"]); // 둘째는 대기
    H.started[0].finish("ra");
    await expect(p1).resolves.toBe("ra");
    await settle();
    H.started[1].finish("rb");
    await expect(p2).resolves.toBe("rb");
    expect(H.maxActive).toBe(1);
  });
});
