import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const execFileP = promisify(execFile);
const DEFAULT_DATA_DIR = path.resolve(process.cwd(), "data");

type LongformConfig = {
  claudeBin?: string;
  model?: string;
  candidatesPath?: string;
  chunkChars?: number;
  maxCandidates?: number;
  perChunk?: number;
  timeoutMs?: number;
};

// 숏폼 후보 1개: 훅(0~3초) + 본문(3~30초) + 보조 메타.
type ShortCandidate = {
  hook: string;
  body: string;
  caption?: string;
  hashtags?: string[];
  source_quote?: string; // 후보가 나온 원문 근거 한 줄
};

function resolveConfig(api: OpenClawPluginApi) {
  const cfg = (api.pluginConfig ?? {}) as LongformConfig;
  const claudeBin =
    (typeof cfg.claudeBin === "string" && cfg.claudeBin.trim()) ||
    process.env.CLAUDE_BIN ||
    "claude";
  const model =
    (typeof cfg.model === "string" && cfg.model.trim()) ||
    process.env.LONGFORM_SHORTS_MODEL ||
    "";
  const candidatesPath =
    (typeof cfg.candidatesPath === "string" && cfg.candidatesPath.trim()) ||
    path.join(DEFAULT_DATA_DIR, "shorts-candidates.json");
  const chunkChars =
    (typeof cfg.chunkChars === "number" && cfg.chunkChars) ||
    Number(process.env.LONGFORM_CHUNK_CHARS) ||
    6000;
  const maxCandidates =
    (typeof cfg.maxCandidates === "number" && cfg.maxCandidates) ||
    Number(process.env.LONGFORM_MAX_CANDIDATES) ||
    8;
  const perChunk =
    (typeof cfg.perChunk === "number" && cfg.perChunk) ||
    Number(process.env.LONGFORM_PER_CHUNK) ||
    3;
  const timeoutMs =
    (typeof cfg.timeoutMs === "number" && cfg.timeoutMs) ||
    Number(process.env.LONGFORM_TIMEOUT_MS) ||
    120000;
  return { claudeBin, model, candidatesPath, chunkChars, maxCandidates, perChunk, timeoutMs };
}

// URL이면 본문 fetch 후 태그/스크립트 제거하여 텍스트만 추출(경량 정제).
async function resolveSourceText(text: string, url: string): Promise<string> {
  if (text && text.trim()) return text.trim();
  if (!url || !url.trim()) {
    throw new Error("text 또는 url 중 하나는 필수입니다.");
  }
  const resp = await fetch(url.trim(), {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; OpenClawBot/1.0)" },
  });
  if (!resp.ok) throw new Error(`URL fetch 실패: HTTP ${resp.status}`);
  const html = await resp.text();
  return stripHtml(html);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// 긴 텍스트를 chunkChars 단위로 쪼갠다. 문장 경계(마침표/줄바꿈) 우선으로 자연스럽게 분할.
function chunkText(text: string, chunkChars: number): string[] {
  if (text.length <= chunkChars) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + chunkChars, text.length);
    if (end < text.length) {
      // 청크 후반부에서 문장/줄바꿈 경계를 찾아 그 지점에서 끊는다.
      const slice = text.slice(start, end);
      const lastBreak = Math.max(
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("다. "),
      );
      if (lastBreak > chunkChars * 0.5) end = start + lastBreak + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks.filter((c) => c.length > 0);
}

// 청킹 프롬프트: 한 청크 → 숏폼 후보 perChunk개를 JSON 배열로만 출력.
function buildChunkPrompt(chunk: string, perChunk: number, idx: number, total: number): string {
  return `너는 롱폼 콘텐츠를 숏폼(릴스/쇼츠/틱톡)으로 쪼개는 편집자다.
아래는 긴 원문의 ${idx + 1}/${total}번째 조각이다. 이 조각에서 독립적으로 성립하는 숏폼 후보를 최대 ${perChunk}개 뽑아라.

규칙:
- 100% 한국어. AI가 쓴 티 금지. 첫 문장(훅)으로 손가락을 멈추게 할 것.
- 각 후보는 30초 안에 끝나는 단일 메시지. 원문에 없는 사실 지어내기 금지.
- 훅(hook): 0~3초, 궁금증/충격/공감 한 문장.
- 본문(body): 3~30초 분량, 핵심 1~3포인트.
- source_quote: 이 후보의 근거가 된 원문 문장 한 줄(요약 아님, 원문 발췌).

출력은 JSON 배열만(다른 텍스트/설명/마크다운 코드펜스 없이):
[
  {
    "hook": "0~3초 훅 한 문장",
    "body": "3~30초 본문",
    "caption": "게시물 캡션(짧게)",
    "hashtags": ["태그", "태그"],
    "source_quote": "원문 근거 발췌 한 줄"
  }
]

원문 조각:
"""
${chunk}
"""`;
}

// claude -p 1회 호출 → JSON 배열 파싱. 실패 시 빈 배열.
async function runClaudeChunk(
  config: ReturnType<typeof resolveConfig>,
  prompt: string,
): Promise<ShortCandidate[]> {
  const args = ["-p", prompt];
  if (config.model) args.push("--model", config.model);
  const { stdout } = await execFileP(config.claudeBin, args, {
    timeout: config.timeoutMs,
    maxBuffer: 8 * 1024 * 1024,
  });
  // 첫 '[' ~ 마지막 ']' 사이를 JSON 배열로 추출(코드펜스/잡설 방어).
  const m = stdout.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({
        hook: String(x.hook ?? "").trim(),
        body: String(x.body ?? "").trim(),
        caption: x.caption ? String(x.caption).trim() : undefined,
        hashtags: Array.isArray(x.hashtags) ? x.hashtags.map((h) => String(h)) : undefined,
        source_quote: x.source_quote ? String(x.source_quote).trim() : undefined,
      }))
      .filter((c) => c.hook && c.body);
  } catch {
    return [];
  }
}

async function writeCandidates(filePath: string, candidates: ShortCandidate[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const out = {
    generatedAt: new Date().toISOString(),
    count: candidates.length,
    candidates,
  };
  await fs.writeFile(filePath, JSON.stringify(out, null, 2), "utf-8");
}

const LongformToShortsSchema = Type.Object(
  {
    text: Type.Optional(Type.String({ description: "변환할 롱폼 텍스트(기사/대본/스크립트). url 미사용 시 필수." })),
    url: Type.Optional(Type.String({ description: "본문을 가져올 URL. text 미사용 시 필수." })),
    count: Type.Optional(Type.Number({ description: "원하는 총 숏폼 후보 수. 기본 8." })),
    save: Type.Optional(Type.Boolean({ description: "true면 결과를 shorts-candidates.json에 저장. 기본 true." })),
  },
  { additionalProperties: false },
);

export function createLongformToShortsTool(api: OpenClawPluginApi) {
  return {
    name: "longform_to_shorts",
    label: "Longform to Shorts",
    description:
      "Convert a long article/transcript/URL into N short-form candidates (hook + body). Chunks the text and runs claude -p per chunk, then merges and ranks. Optionally saves to shorts-candidates.json.",
    parameters: LongformToShortsSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const config = resolveConfig(api);
      const text = readStringParam(rawParams, "text") ?? "";
      const url = readStringParam(rawParams, "url") ?? "";
      const count =
        typeof rawParams.count === "number" && rawParams.count > 0
          ? Math.floor(rawParams.count)
          : config.maxCandidates;
      const save = rawParams.save !== false;

      let sourceText: string;
      try {
        sourceText = await resolveSourceText(text, url);
      } catch (e) {
        return jsonResult({ error: e instanceof Error ? e.message : String(e), candidates: [] });
      }
      if (sourceText.length < 50) {
        return jsonResult({ error: "원문이 너무 짧습니다(50자 미만).", candidates: [] });
      }

      const chunks = chunkText(sourceText, config.chunkChars);
      const all: ShortCandidate[] = [];
      const seenHooks = new Set<string>();
      const errors: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const prompt = buildChunkPrompt(chunks[i], config.perChunk, i, chunks.length);
        try {
          const cands = await runClaudeChunk(config, prompt);
          for (const c of cands) {
            const key = c.hook.slice(0, 40);
            if (seenHooks.has(key)) continue; // 청크 간 중복 훅 제거
            seenHooks.add(key);
            all.push(c);
          }
        } catch (e) {
          errors.push(`chunk ${i + 1}: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`);
        }
        if (all.length >= count) break; // 목표 수 도달 시 조기 종료(비용 절감)
      }

      const candidates = all.slice(0, count);

      if (save && candidates.length > 0) {
        try {
          await writeCandidates(config.candidatesPath, candidates);
        } catch (e) {
          errors.push(`save: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`);
        }
      }

      return jsonResult({
        message: `롱폼 ${sourceText.length}자 → ${chunks.length}청크 → 숏폼 후보 ${candidates.length}개`,
        sourceChars: sourceText.length,
        chunks: chunks.length,
        candidates,
        saved: save && candidates.length > 0 ? config.candidatesPath : null,
        errors: errors.length ? errors : undefined,
      });
    },
  };
}
