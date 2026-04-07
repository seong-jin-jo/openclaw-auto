import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  sendImagine,
  pollForResult,
  clickUpscale,
  pollForUpscale,
  downloadImage,
  type MidjourneyConfig,
} from "./discord-client.js";

type PluginConfig = {
  discordToken?: string;
  channelId?: string;
  serverId?: string;
};

function resolveConfig(api: OpenClawPluginApi): MidjourneyConfig {
  const cfg = (api.pluginConfig ?? {}) as PluginConfig;

  const discordToken =
    (typeof cfg.discordToken === "string" && cfg.discordToken.trim()) ||
    process.env.MIDJOURNEY_DISCORD_TOKEN ||
    "";
  const channelId =
    (typeof cfg.channelId === "string" && cfg.channelId.trim()) ||
    process.env.MIDJOURNEY_CHANNEL_ID ||
    "";
  const serverId =
    (typeof cfg.serverId === "string" && cfg.serverId.trim()) ||
    process.env.MIDJOURNEY_SERVER_ID ||
    "";

  if (!discordToken) throw new Error("Midjourney Discord token not configured. Set MIDJOURNEY_DISCORD_TOKEN env var.");
  if (!channelId) throw new Error("Midjourney channel ID not configured. Set MIDJOURNEY_CHANNEL_ID env var.");
  if (!serverId) throw new Error("Midjourney server ID not configured. Set MIDJOURNEY_SERVER_ID env var.");

  const pollIntervalMs = parseInt(process.env.MIDJOURNEY_POLL_INTERVAL_MS || "5000", 10);
  const timeoutMs = parseInt(process.env.MIDJOURNEY_TIMEOUT_MS || "300000", 10);

  return { discordToken, channelId, serverId, pollIntervalMs, timeoutMs };
}

const ToolSchema = Type.Object(
  {
    action: optionalStringEnum(
      ["imagine", "upscale"] as const,
      {
        description:
          'Action: "imagine" to generate a new image from prompt, "upscale" to upscale one of the 4 grid images.',
      },
    ),
    prompt: Type.Optional(
      Type.String({
        description:
          "Image prompt for imagine action. Use Midjourney syntax: descriptive text, --ar 4:5, --style raw, etc.",
      }),
    ),
    message_id: Type.Optional(
      Type.String({
        description: "Discord message ID of the grid result (for upscale action).",
      }),
    ),
    image_index: Type.Optional(
      Type.Number({
        description: "Image index 1-4 to upscale from the grid (for upscale action). Default: 1.",
        minimum: 1,
        maximum: 4,
      }),
    ),
    aspect_ratio: Type.Optional(
      Type.String({
        description: 'Aspect ratio override. E.g. "1:1", "4:5", "9:16", "16:9". Appended to prompt as --ar.',
      }),
    ),
    style: Type.Optional(
      Type.String({
        description: 'Midjourney style parameter. E.g. "raw" for photorealistic. Appended as --style.',
      }),
    ),
    auto_upscale: Type.Optional(
      Type.Boolean({
        description: "If true, automatically upscale image_index (default 1) after imagine completes. Default: true.",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createMidjourneyImageTool(api: OpenClawPluginApi) {
  return {
    name: "midjourney_image",
    label: "Midjourney Image",
    description:
      "Generate high-quality images using Midjourney via Discord. Use 'imagine' with a descriptive prompt to create images. Supports aspect ratios (--ar), styles (--style raw), and auto-upscaling. Images are saved locally to /images/ directory.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action", { required: true });
      const config = resolveConfig(api);
      const dataDir = process.env.DATA_DIR || "/home/node/data";
      const imagesDir = resolve(dataDir, "images");
      await mkdir(imagesDir, { recursive: true });

      switch (action) {
        case "imagine": {
          const promptBase = readStringParam(rawParams, "prompt", { required: true });
          const aspectRatio = readStringParam(rawParams, "aspect_ratio");
          const style = readStringParam(rawParams, "style");
          const autoUpscale = rawParams.auto_upscale !== false; // default true
          const imageIndex = typeof rawParams.image_index === "number" ? rawParams.image_index : 1;

          // Build full Midjourney prompt with parameters
          let fullPrompt = promptBase;
          if (aspectRatio && !fullPrompt.includes("--ar")) {
            fullPrompt += ` --ar ${aspectRatio}`;
          }
          if (style && !fullPrompt.includes("--style")) {
            fullPrompt += ` --style ${style}`;
          }

          const beforeTime = new Date().toISOString();

          // Step 1: Send /imagine
          await sendImagine(config, fullPrompt);

          // Step 2: Poll for grid result
          const gridResult = await pollForResult(config, fullPrompt, beforeTime);

          if (!autoUpscale) {
            // Return grid image without upscaling
            const imgBuffer = await downloadImage(gridResult.imageUrl);
            const filename = `mj-grid-${randomUUID()}.png`;
            const filePath = join(imagesDir, filename);
            await writeFile(filePath, imgBuffer);

            return jsonResult({
              success: true,
              action: "imagine",
              prompt: fullPrompt,
              messageId: gridResult.messageId,
              imagePath: `/images/${filename}`,
              type: "grid",
              hint: "Use upscale action with message_id and image_index (1-4) to get high-res version.",
            });
          }

          // Step 3: Auto-upscale
          const upscaleBeforeTime = new Date().toISOString();
          await clickUpscale(config, gridResult.messageId, imageIndex);
          const upscaleResult = await pollForUpscale(config, fullPrompt, upscaleBeforeTime, imageIndex);

          const imgBuffer = await downloadImage(upscaleResult.imageUrl);
          const filename = `mj-${randomUUID()}.png`;
          const filePath = join(imagesDir, filename);
          await writeFile(filePath, imgBuffer);

          return jsonResult({
            success: true,
            action: "imagine+upscale",
            prompt: fullPrompt,
            messageId: upscaleResult.messageId,
            gridMessageId: gridResult.messageId,
            imagePath: `/images/${filename}`,
            imageIndex,
            type: "upscaled",
          });
        }

        case "upscale": {
          const messageId = readStringParam(rawParams, "message_id", { required: true });
          const imageIndex = typeof rawParams.image_index === "number" ? rawParams.image_index : 1;
          const prompt = readStringParam(rawParams, "prompt") ?? "";

          const beforeTime = new Date().toISOString();
          await clickUpscale(config, messageId, imageIndex);
          const result = await pollForUpscale(config, prompt, beforeTime, imageIndex);

          const imgBuffer = await downloadImage(result.imageUrl);
          const filename = `mj-${randomUUID()}.png`;
          const filePath = join(imagesDir, filename);
          await writeFile(filePath, imgBuffer);

          return jsonResult({
            success: true,
            action: "upscale",
            messageId: result.messageId,
            imagePath: `/images/${filename}`,
            imageIndex,
            type: "upscaled",
          });
        }

        default:
          throw new Error(`Unknown action: ${action}. Use "imagine" or "upscale".`);
      }
    },
  };
}
