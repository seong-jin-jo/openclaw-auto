import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";

const WIDTH = 1080;
const HEIGHT = 1350; // 4:5 ratio for Instagram
const PADDING = 80;
const FONT_FAMILY = "WenQuanYi Zen Hei, sans-serif";

type Style = "dark" | "light" | "gradient";

const STYLES: Record<Style, { bg: string | string[]; text: string; accent: string; sub: string }> = {
  dark: { bg: "#0f0f0f", text: "#ffffff", accent: "#6366f1", sub: "#9ca3af" },
  light: { bg: "#fafafa", text: "#1a1a1a", accent: "#4f46e5", sub: "#6b7280" },
  gradient: { bg: ["#1e1b4b", "#312e81"], text: "#ffffff", accent: "#818cf8", sub: "#c7d2fe" },
};

function drawBackground(ctx: CanvasRenderingContext2D, style: Style) {
  const s = STYLES[style];
  if (Array.isArray(s.bg)) {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, s.bg[0]);
    grad.addColorStop(1, s.bg[1]);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = s.bg;
  }
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) { lines.push(""); continue; }
    const words = paragraph.split("");
    let line = "";
    for (const char of words) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function renderSlide(
  slideNum: number,
  totalSlides: number,
  title: string,
  body: string,
  style: Style,
  isTitle: boolean,
  isEnd: boolean,
): Canvas {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  const s = STYLES[style];

  drawBackground(ctx, style);

  if (isTitle) {
    // Title slide
    ctx.fillStyle = s.accent;
    ctx.fillRect(PADDING, 300, 60, 6);

    ctx.fillStyle = s.text;
    ctx.font = `bold 64px ${FONT_FAMILY}`;
    const titleLines = wrapText(ctx, title, WIDTH - PADDING * 2, 80);
    let y = 360;
    for (const line of titleLines) {
      ctx.fillText(line, PADDING, y);
      y += 80;
    }

    ctx.fillStyle = s.sub;
    ctx.font = `32px ${FONT_FAMILY}`;
    ctx.fillText(body || "IT 지식 카드뉴스", PADDING, y + 40);

    // Slide indicator
    ctx.fillStyle = s.sub;
    ctx.font = `24px ${FONT_FAMILY}`;
    ctx.fillText(`1 / ${totalSlides}`, WIDTH - PADDING - 60, HEIGHT - PADDING);
  } else if (isEnd) {
    // End slide
    ctx.fillStyle = s.accent;
    ctx.font = `bold 48px ${FONT_FAMILY}`;
    const endLines = wrapText(ctx, body || "읽어주셔서 감사합니다", WIDTH - PADDING * 2, 64);
    let y = HEIGHT / 2 - (endLines.length * 64) / 2;
    ctx.textAlign = "center";
    for (const line of endLines) {
      ctx.fillText(line, WIDTH / 2, y);
      y += 64;
    }
    ctx.textAlign = "left";

    ctx.fillStyle = s.sub;
    ctx.font = `28px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.fillText("@sample", WIDTH / 2, y + 60);
    ctx.textAlign = "left";

    ctx.fillStyle = s.sub;
    ctx.font = `24px ${FONT_FAMILY}`;
    ctx.fillText(`${totalSlides} / ${totalSlides}`, WIDTH - PADDING - 60, HEIGHT - PADDING);
  } else {
    // Content slide
    // Slide number accent bar
    ctx.fillStyle = s.accent;
    ctx.fillRect(PADDING, PADDING + 20, 40, 4);

    // Slide number
    ctx.fillStyle = s.sub;
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    ctx.fillText(`${slideNum}`, PADDING + 50, PADDING + 28);

    // Body text
    ctx.fillStyle = s.text;
    ctx.font = `36px ${FONT_FAMILY}`;
    const bodyLines = wrapText(ctx, body, WIDTH - PADDING * 2, 52);
    let y = PADDING + 100;
    for (const line of bodyLines) {
      if (y > HEIGHT - PADDING - 60) break;
      ctx.fillText(line, PADDING, y);
      y += 52;
    }

    // Slide indicator
    ctx.fillStyle = s.sub;
    ctx.font = `24px ${FONT_FAMILY}`;
    ctx.fillText(`${slideNum} / ${totalSlides}`, WIDTH - PADDING - 60, HEIGHT - PADDING);
  }

  return canvas;
}

const CardGeneratorToolSchema = Type.Object(
  {
    action: Type.String({
      description: 'Action: "generate" — create card news slides from title + body slides.',
      enum: ["generate"],
    }),
    title: Type.String({
      description: "Card news title (displayed on the first slide).",
    }),
    slides: Type.Array(Type.String(), {
      description: "Array of slide body texts (3-5 slides recommended). Each becomes one card.",
      minItems: 1,
      maxItems: 8,
    }),
    style: Type.Optional(
      Type.String({
        description: 'Visual style: "dark" (default), "light", or "gradient".',
        enum: ["dark", "light", "gradient"],
      }),
    ),
    ending: Type.Optional(
      Type.String({
        description: "Ending slide text (default: title recap).",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createCardGeneratorTool(api: OpenClawPluginApi) {
  return {
    name: "card_generate",
    label: "Card Generator",
    description:
      "Generate card news images (text-based slides) for Instagram carousel or Shorts. Provide a title and 3-5 slide texts. Returns file paths of generated PNG images.",
    parameters: CardGeneratorToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action", { required: true });
      if (action !== "generate") throw new Error(`Unknown action: ${action}`);

      const title = readStringParam(rawParams, "title", { required: true });
      const slides = rawParams.slides as string[];
      const style = (readStringParam(rawParams, "style") || "dark") as Style;
      const ending = readStringParam(rawParams, "ending") || title;

      if (!STYLES[style]) throw new Error(`Unknown style: ${style}. Use dark, light, or gradient.`);

      const dataDir = process.env.DATA_DIR || "/home/node/data";
      const imagesDir = join(dataDir, "images");
      await mkdir(imagesDir, { recursive: true });

      const totalSlides = slides.length + 2; // title + content slides + ending
      const batchId = randomUUID().substring(0, 8);
      const files: string[] = [];

      // Title slide
      const titleCanvas = renderSlide(1, totalSlides, title, "", style, true, false);
      const titlePath = join(imagesDir, `card-${batchId}-01-title.png`);
      await writeFile(titlePath, titleCanvas.toBuffer("image/png"));
      files.push(`/images/card-${batchId}-01-title.png`);

      // Content slides
      for (let i = 0; i < slides.length; i++) {
        const num = i + 2;
        const canvas = renderSlide(num, totalSlides, title, slides[i], style, false, false);
        const filePath = join(imagesDir, `card-${batchId}-${String(num).padStart(2, "0")}-content.png`);
        await writeFile(filePath, canvas.toBuffer("image/png"));
        files.push(`/images/card-${batchId}-${String(num).padStart(2, "0")}-content.png`);
      }

      // Ending slide
      const endCanvas = renderSlide(totalSlides, totalSlides, title, ending, style, false, true);
      const endPath = join(imagesDir, `card-${batchId}-${String(totalSlides).padStart(2, "0")}-end.png`);
      await writeFile(endPath, endCanvas.toBuffer("image/png"));
      files.push(`/images/card-${batchId}-${String(totalSlides).padStart(2, "0")}-end.png`);

      return jsonResult({
        success: true,
        batchId,
        totalSlides,
        style,
        files,
      });
    },
  };
}
