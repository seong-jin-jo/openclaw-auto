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
const FONT_FAMILY = "Noto Sans CJK KR, WenQuanYi Zen Hei, sans-serif";
const FONT_BOLD = `bold`;
const FONT_REGULAR = ``;

type Style = "dark" | "light" | "gradient" | "tech" | "warm";

const STYLES: Record<Style, { bg: string | string[]; text: string; accent: string; sub: string; badge: string }> = {
  dark: { bg: "#0f0f0f", text: "#f5f5f5", accent: "#6366f1", sub: "#9ca3af", badge: "#1e1b4b" },
  light: { bg: "#fafafa", text: "#1a1a1a", accent: "#4f46e5", sub: "#6b7280", badge: "#eef2ff" },
  gradient: { bg: ["#1e1b4b", "#312e81"], text: "#f5f5f5", accent: "#a5b4fc", sub: "#c7d2fe", badge: "#312e81" },
  tech: { bg: ["#0c0a09", "#1c1917"], text: "#fafaf9", accent: "#22d3ee", sub: "#a8a29e", badge: "#164e63" },
  warm: { bg: ["#1a1a2e", "#16213e"], text: "#f8fafc", accent: "#f59e0b", sub: "#94a3b8", badge: "#78350f" },
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

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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

  // Common: bottom bar with account + page indicator
  const drawFooter = () => {
    // Thin line
    ctx.fillStyle = s.sub;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(PADDING, HEIGHT - PADDING - 30, WIDTH - PADDING * 2, 1);
    ctx.globalAlpha = 1;
    // Account
    ctx.fillStyle = s.sub;
    ctx.font = `22px ${FONT_FAMILY}`;
    ctx.fillText("@sample", PADDING, HEIGHT - PADDING);
    // Page
    ctx.textAlign = "right";
    ctx.fillText(`${slideNum} / ${totalSlides}`, WIDTH - PADDING, HEIGHT - PADDING);
    ctx.textAlign = "left";
  };

  if (isTitle) {
    // Badge
    ctx.fillStyle = s.badge;
    drawRoundRect(ctx, PADDING, 280, 160, 36, 18);
    ctx.fill();
    ctx.fillStyle = s.accent;
    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillText("CARD NEWS", PADDING + 20, 304);

    // Title
    ctx.fillStyle = s.text;
    ctx.font = `bold 56px ${FONT_FAMILY}`;
    const titleLines = wrapText(ctx, title, WIDTH - PADDING * 2, 72);
    let y = 380;
    for (const line of titleLines) {
      ctx.fillText(line, PADDING, y);
      y += 72;
    }

    // Accent underline
    ctx.fillStyle = s.accent;
    ctx.fillRect(PADDING, y + 10, 80, 4);

    // Subtitle
    ctx.fillStyle = s.sub;
    ctx.font = `30px ${FONT_FAMILY}`;
    ctx.fillText(body || "스와이프하여 확인하세요 →", PADDING, y + 60);

    drawFooter();
  } else if (isEnd) {
    // CTA card
    ctx.fillStyle = s.accent;
    ctx.globalAlpha = 0.1;
    drawRoundRect(ctx, PADDING, HEIGHT / 2 - 140, WIDTH - PADDING * 2, 280, 24);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = s.accent;
    ctx.font = `bold 44px ${FONT_FAMILY}`;
    const endLines = wrapText(ctx, body || "더 알고 싶다면?", WIDTH - PADDING * 2 - 60, 56);
    let y = HEIGHT / 2 - (endLines.length * 56) / 2;
    ctx.textAlign = "center";
    for (const line of endLines) {
      ctx.fillText(line, WIDTH / 2, y);
      y += 56;
    }

    ctx.fillStyle = s.sub;
    ctx.font = `28px ${FONT_FAMILY}`;
    ctx.fillText("프로필 링크에서 확인하세요", WIDTH / 2, y + 40);
    ctx.textAlign = "left";

    drawFooter();
  } else {
    // Content slide — number badge + body
    // Number circle
    ctx.fillStyle = s.accent;
    ctx.beginPath();
    ctx.arc(PADDING + 28, PADDING + 28, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 24px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.fillText(`${slideNum - 1}`, PADDING + 28, PADDING + 36);
    ctx.textAlign = "left";

    // Body text with better line height
    ctx.fillStyle = s.text;
    ctx.font = `34px ${FONT_FAMILY}`;
    const bodyLines = wrapText(ctx, body, WIDTH - PADDING * 2, 50);
    let y = PADDING + 100;
    for (const line of bodyLines) {
      if (y > HEIGHT - PADDING - 80) break;
      ctx.fillText(line, PADDING, y);
      y += 50;
    }

    drawFooter();
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
        description: 'Visual style: "dark" (default), "light", "gradient", "tech", or "warm".',
        enum: ["dark", "light", "gradient", "tech", "warm"],
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
