import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

type StyleEntry = {
  original: string;
  edited: string;
  editType: string;
  timestamp: string;
};

type StyleData = {
  version: number;
  entries: StyleEntry[];
};

type StyleConfig = {
  stylePath?: string;
};

const DEFAULT_STYLE_DIR = path.resolve(process.cwd(), "data");
const DEFAULT_STYLE_PATH = path.join(DEFAULT_STYLE_DIR, "style-data.json");

function resolveStylePath(api: OpenClawPluginApi): string {
  const pluginCfg = (api.pluginConfig ?? {}) as StyleConfig;
  return (
    (typeof pluginCfg.stylePath === "string" && pluginCfg.stylePath.trim()) ||
    process.env.THREADS_STYLE_PATH ||
    DEFAULT_STYLE_PATH
  );
}

async function readStyleData(stylePath: string): Promise<StyleData> {
  try {
    const raw = await fs.readFile(stylePath, "utf-8");
    return JSON.parse(raw) as StyleData;
  } catch {
    return { version: 1, entries: [] };
  }
}

async function writeStyleData(stylePath: string, data: StyleData): Promise<void> {
  await fs.mkdir(path.dirname(stylePath), { recursive: true });
  await fs.writeFile(stylePath, JSON.stringify(data, null, 2), "utf-8");
}

const ThreadsStyleToolSchema = Type.Object(
  {
    action: optionalStringEnum(["read", "add", "summary"] as const, {
      description:
        'Action: "read" (get all style entries for RAG prompt), "add" (record a new edit pair), "summary" (get edit pattern statistics).',
    }),
    original: Type.Optional(
      Type.String({ description: "Original text before user edit (for add)." }),
    ),
    edited: Type.Optional(
      Type.String({ description: "Edited text after user modification (for add)." }),
    ),
    editType: optionalStringEnum(
      ["tone_change", "length_adjust", "style_rewrite", "content_fix", "format_change"] as const,
      { description: "Type of edit (for add)." },
    ),
  },
  { additionalProperties: false },
);

export function createThreadsStyleTool(api: OpenClawPluginApi) {
  return {
    name: "threads_style",
    label: "Threads Style",
    description:
      "Manage style learning data. Read edit history for RAG prompts, add new edit pairs, or get edit pattern summaries.",
    parameters: ThreadsStyleToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action", { required: true });
      const stylePath = resolveStylePath(api);
      const data = await readStyleData(stylePath);

      switch (action) {
        case "read": {
          const recentEntries = data.entries.slice(-20);
          return jsonResult({
            totalEntries: data.entries.length,
            recentEntries,
            ragPromptHint:
              recentEntries.length > 0
                ? "Use these original->edited pairs to match the user's preferred writing style."
                : "No style data yet. Generate content in a natural, conversational tone.",
          });
        }

        case "add": {
          const original = readStringParam(rawParams, "original", { required: true });
          const edited = readStringParam(rawParams, "edited", { required: true });
          const editType = readStringParam(rawParams, "editType") ?? "style_rewrite";

          const entry: StyleEntry = {
            original,
            edited,
            editType,
            timestamp: new Date().toISOString(),
          };

          data.entries.push(entry);
          await writeStyleData(stylePath, data);
          return jsonResult({
            success: true,
            totalEntries: data.entries.length,
            entry,
          });
        }

        case "summary": {
          const typeCounts: Record<string, number> = {};
          for (const entry of data.entries) {
            typeCounts[entry.editType] = (typeCounts[entry.editType] ?? 0) + 1;
          }
          const avgOriginalLen =
            data.entries.length > 0
              ? Math.round(
                  data.entries.reduce((sum, e) => sum + e.original.length, 0) /
                    data.entries.length,
                )
              : 0;
          const avgEditedLen =
            data.entries.length > 0
              ? Math.round(
                  data.entries.reduce((sum, e) => sum + e.edited.length, 0) /
                    data.entries.length,
                )
              : 0;

          return jsonResult({
            totalEntries: data.entries.length,
            editTypeCounts: typeCounts,
            averageOriginalLength: avgOriginalLen,
            averageEditedLength: avgEditedLen,
            lengthTrend:
              avgEditedLen < avgOriginalLen
                ? "User prefers shorter content"
                : avgEditedLen > avgOriginalLen
                  ? "User prefers longer content"
                  : "No clear length preference",
          });
        }

        default:
          throw new Error(`Unknown action: ${action}. Use read, add, or summary.`);
      }
    },
  };
}
