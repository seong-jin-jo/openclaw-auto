import { execFile } from "node:child_process";
import { promisify } from "node:util";
import postgres from "postgres";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

// P8 자동초안 생성 플러그인.
// brand_guides(톤) + viral_signals(최근 시그널)를 소비 → claude -p로 자동초안 N개 생성
// → drafts(status='draft') 적재. 게이트웨이 크론(generate-drafts)이 주기 호출.
// 모든 DB 접근은 withTenantTx(set_config app.tenant_id + SET LOCAL ROLE osmu_service) 경유 = L1 RLS.
// 비용: 기본 Haiku 모델(생성=저가). 하드코딩 금지(서비스 중립) — 연결/테넌트/모델 모두 config·env.

const execFileP = promisify(execFile);

type GenConfig = {
  databaseUrl?: string;
  tenantId?: string;
  claudeBin?: string;
  model?: string;      // claude CLI --model (기본 Haiku)
  count?: number;      // 1회 생성 초안 수
  signalLimit?: number; // 영감으로 쓸 최근 viral_signals 수
};

function resolveConfig(api: OpenClawPluginApi) {
  const cfg = (api.pluginConfig ?? {}) as GenConfig;
  const databaseUrl =
    (typeof cfg.databaseUrl === "string" && cfg.databaseUrl.trim()) ||
    process.env.DATABASE_URL ||
    "";
  const tenantId =
    (typeof cfg.tenantId === "string" && cfg.tenantId.trim()) ||
    process.env.OSMU_TENANT_ID ||
    "";
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 미설정 — Supabase 연결 불가. env DATABASE_URL 또는 플러그인 databaseUrl 설정.");
  }
  if (!tenantId) {
    throw new Error("tenant_id 미설정 — env OSMU_TENANT_ID 또는 플러그인 tenantId 설정.");
  }
  const claudeBin =
    (typeof cfg.claudeBin === "string" && cfg.claudeBin.trim()) ||
    process.env.CLAUDE_BIN ||
    "claude";
  const model =
    (typeof cfg.model === "string" && cfg.model.trim()) ||
    process.env.GENERATE_DRAFTS_MODEL ||
    "claude-haiku-4-5"; // 발행/생성 배치는 Haiku(비용 절감) — 품질 필요 시 config로 상향.
  const count = Number.isFinite(cfg.count) && Number(cfg.count) > 0 ? Math.floor(Number(cfg.count)) : 5;
  const signalLimit =
    Number.isFinite(cfg.signalLimit) && Number(cfg.signalLimit) > 0 ? Math.floor(Number(cfg.signalLimit)) : 8;
  return { databaseUrl, tenantId, claudeBin, model, count, signalLimit };
}

// RLS-safe 트랜잭션 (대시보드 withTenant / sync-insights와 동일 규약).
async function withTenantTx<T>(
  sql: ReturnType<typeof postgres>,
  tenantId: string,
  fn: (tx: ReturnType<typeof postgres>) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SET LOCAL ROLE osmu_service`;
    return fn(tx as unknown as ReturnType<typeof postgres>);
  }) as Promise<T>;
}

interface GeneratedDraft {
  idea: string;
  threads: string;
  x: string;
}

// 자동초안 생성 프롬프트: 브랜드 톤 + 최근 시그널 → 독립 초안 N개를 JSON 배열로만.
function buildPrompt(promptGuide: string, signals: string[], count: number): string {
  const guideBlock = promptGuide.trim()
    ? `브랜드 톤/가이드:\n"""\n${promptGuide.slice(0, 4000)}\n"""`
    : "브랜드 가이드 없음 — 일반적인 SNS 마케팅 톤으로.";
  const signalBlock = signals.length
    ? `최근 화제 시그널(영감용, 그대로 베끼지 말 것):\n${signals.map((s, i) => `${i + 1}. ${s.slice(0, 300)}`).join("\n")}`
    : "최근 시그널 없음 — 브랜드 핵심 메시지로 발산.";
  return `너는 SNS 마케팅 카피라이터다. 아래 브랜드 톤과 최근 시그널을 참고해 서로 다른 주제의 독립 초안 ${count}개를 만들어라.

${guideBlock}

${signalBlock}

규칙:
- 100% 한국어. AI가 쓴 티 금지. 첫 문장으로 손가락을 멈추게 할 것.
- 각 초안은 독립적으로 성립. 사실 지어내기 금지.
- threads: Threads/Facebook용 본문(최대 500자).
- x: 같은 메시지의 X(트위터)용 압축본(최대 280자).
- idea: 이 초안의 한 줄 주제(목록 표시용).

출력은 JSON 배열만(설명/마크다운 코드펜스 없이):
[
  { "idea": "한 줄 주제", "threads": "Threads 본문", "x": "X 압축본" }
]`;
}

// claude -p 1회 호출 → JSON 배열 파싱. 실패 시 빈 배열.
async function runClaude(bin: string, model: string, prompt: string): Promise<GeneratedDraft[]> {
  const { stdout } = await execFileP(bin, ["-p", prompt, "--model", model], {
    timeout: 180000,
    maxBuffer: 8 * 1024 * 1024,
  });
  const m = stdout.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({
        idea: String(x.idea ?? "").trim(),
        threads: String(x.threads ?? "").trim(),
        x: String(x.x ?? "").trim(),
      }))
      .filter((d) => d.threads || d.x);
  } catch {
    return [];
  }
}

const GenerateDraftsToolSchema = Type.Object(
  {
    action: optionalStringEnum(["generate"] as const, {
      description: 'Action: "generate" — 브랜드 가이드 + 최근 시그널 기반 자동초안 N개 생성하여 drafts(status=draft) 적재.',
    }),
  },
  { additionalProperties: false },
);

export function createGenerateDraftsTool(api: OpenClawPluginApi) {
  return {
    name: "generate_drafts",
    label: "Generate Drafts",
    description:
      "brand_guides(톤) + viral_signals(최근 시그널)를 소비해 claude -p로 자동초안 N개를 생성하고 drafts(status=draft)에 적재. Action: generate.",
    parameters: GenerateDraftsToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action") ?? "generate";
      if (action !== "generate") {
        throw new Error(`Unknown action: ${action}. Use "generate".`);
      }

      const config = resolveConfig(api);
      const sql = postgres(config.databaseUrl, { max: 3, idle_timeout: 20 });

      let saved = 0;
      const errors: string[] = [];
      try {
        // 1) 컨텍스트 로드: 브랜드 가이드 + 최근 시그널 (RLS 트랜잭션 내).
        const ctx = await withTenantTx(sql, config.tenantId, async (tx) => {
          const guideRows = await tx<{ prompt_guide: string | null }[]>`
            SELECT prompt_guide FROM brand_guides WHERE tenant_id = ${config.tenantId} LIMIT 1`;
          const signalRows = await tx<{ content: string | null }[]>`
            SELECT content FROM viral_signals WHERE tenant_id = ${config.tenantId}
            ORDER BY captured_at DESC LIMIT ${config.signalLimit}`;
          return {
            promptGuide: guideRows[0]?.prompt_guide ?? "",
            signals: signalRows.map((r) => r.content ?? "").filter(Boolean),
          };
        });

        // 2) claude -p로 초안 생성.
        const drafts = await runClaude(
          config.claudeBin,
          config.model,
          buildPrompt(ctx.promptGuide, ctx.signals, config.count),
        );
        if (drafts.length === 0) {
          return jsonResult({
            ok: false,
            message: "자동초안 생성 실패 — claude 출력에서 후보를 파싱하지 못함",
            saved: 0,
          });
        }

        // 3) drafts 적재 (RLS 트랜잭션 내, 후보별 payload jsonb).
        await withTenantTx(sql, config.tenantId, async (tx) => {
          for (const d of drafts) {
            try {
              const payload = {
                text: { threads: d.threads, x: d.x },
                source: "generate-drafts",
                auto: true,
              };
              await tx`
                INSERT INTO drafts (tenant_id, idea, payload, status)
                VALUES (${config.tenantId}, ${d.idea || d.threads.slice(0, 40)}, ${tx.json(payload)}, 'draft')`;
              saved++;
            } catch (err) {
              errors.push(`draft "${d.idea.slice(0, 30)}": ${String(err)}`);
            }
          }
        });
      } finally {
        await sql.end({ timeout: 5 });
      }

      return jsonResult({
        ok: saved > 0,
        message: `generate 완료: 자동초안 ${saved}개 적재, errors=${errors.length}`,
        saved,
        model: config.model,
        errors,
      });
    },
  };
}
