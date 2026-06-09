import { Type } from "@sinclair/typebox";
import { jsonResult } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

type VideoGenerateConfig = {
  dashboardUrl?: string;
};

type Slide = { text?: string; duration?: number; imageUrl?: string };

// 게이트웨이는 ffmpeg를 직접 갖지 않는다. ffmpeg+TTS 렌더링은 대시보드(Next.js)에 있고,
// network_mode=host이므로 게이트웨이는 127.0.0.1:{DASHBOARD_PORT}로 대시보드를 호출한다.
function resolveDashboardUrl(api: OpenClawPluginApi): string {
  const pluginCfg = (api.pluginConfig ?? {}) as VideoGenerateConfig;
  const fromCfg = typeof pluginCfg.dashboardUrl === "string" && pluginCfg.dashboardUrl.trim();
  if (fromCfg) return fromCfg.replace(/\/+$/, "");
  if (process.env.VIDEO_DASHBOARD_URL) return process.env.VIDEO_DASHBOARD_URL.replace(/\/+$/, "");
  const port = process.env.DASHBOARD_PORT || "34560"; // tenant1 기본
  return `http://127.0.0.1:${port}`;
}

const SlideSchema = Type.Object(
  {
    text: Type.String({ description: "Slide caption/narration text. 자막+TTS 내레이션으로 사용." }),
    duration: Type.Optional(Type.Number({ description: "Seconds for this slide (default 4)." })),
    imageUrl: Type.Optional(
      Type.String({ description: "Background image URL or /images/{file} (card-generator 산출물 재사용 가능)." }),
    ),
  },
  { additionalProperties: false },
);

const VideoGenerateToolSchema = Type.Object(
  {
    slides: Type.Array(SlideSchema, {
      description:
        "Ordered slides → 세로 1080×1920 영상. prompt-guide [쇼츠 스크립트] 규칙(hook→3포인트→CTA, ≤30초)에 맞춰 구성.",
    }),
    ttsEnabled: Type.Optional(
      Type.Boolean({ description: "ElevenLabs TTS 내레이션 합성 (default true). 미설정 키 시 무음 영상." }),
    ),
    engine: Type.Optional(
      Type.Union([Type.Literal("ffmpeg"), Type.Literal("higgsfield")], {
        description:
          "ffmpeg=슬라이드형(현재 동작). higgsfield=AI 시네마틱 클립은 Higgsfield MCP `generate_video` 툴을 직접 호출하세요(이 툴 아님). default ffmpeg.",
      }),
    ),
    bgmUrl: Type.Optional(
      Type.String({
        description:
          "효과음/배경음 — 음원 URL(MyInstants 등) 또는 라이브러리 경로 `/sfx/{name}`. prompt-guide [효과음 무드] 참고. 저음량 루프로 내레이션과 믹스.",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createVideoGenerateTool(api: OpenClawPluginApi) {
  return {
    name: "video_generate",
    label: "Video Generate",
    description:
      "Render a short-form (Shorts/Reels/TikTok) vertical video (1080×1920) from slides via the dashboard ffmpeg+TTS pipeline. Returns the saved filename + /videos URL for review/publish.",
    parameters: VideoGenerateToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const slides = Array.isArray(rawParams.slides) ? (rawParams.slides as Slide[]) : [];
      if (!slides.length) {
        throw new Error("video_generate: slides required (최소 1장). prompt-guide [쇼츠 스크립트] 참고.");
      }
      const ttsEnabled = rawParams.ttsEnabled !== false;
      const engine = rawParams.engine === "higgsfield" ? "higgsfield" : "ffmpeg";
      const bgmUrl = typeof rawParams.bgmUrl === "string" ? rawParams.bgmUrl : undefined;

      if (engine === "higgsfield") {
        // Higgsfield는 MCP 툴(agent가 직접 호출)로 클립을 생성하는 경로.
        // 1-B(Higgsfield MCP 등록) 완료 전까지는 명확히 안내하고 중단.
        throw new Error(
          "engine=higgsfield는 Higgsfield MCP가 게이트웨이 config에 등록된 뒤 사용 가능합니다(작업 1-B). " +
            "현재는 (1) Higgsfield MCP 툴로 클립을 생성하거나 (2) engine=ffmpeg(슬라이드형)으로 진행하세요.",
        );
      }

      const dashboardUrl = resolveDashboardUrl(api);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (process.env.DASHBOARD_AUTH_TOKEN) {
        headers.Authorization = `Bearer ${process.env.DASHBOARD_AUTH_TOKEN}`;
      }

      const resp = await fetch(`${dashboardUrl}/api/video/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ slides, ttsEnabled, bgmUrl }),
        signal: AbortSignal.timeout(240000),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`video_generate: dashboard render 실패 (${resp.status}) @ ${dashboardUrl}: ${err}`);
      }

      const data = (await resp.json()) as {
        ok?: boolean;
        filename?: string;
        url?: string;
        duration?: number;
        slides?: number;
        hasAudio?: boolean;
        error?: string;
      };
      if (!data.ok || !data.filename) {
        throw new Error(`video_generate: render 응답 오류: ${data.error || JSON.stringify(data)}`);
      }

      return jsonResult({
        success: true,
        engine,
        filename: data.filename,
        url: data.url, // 대시보드 /videos/{filename} — 검수/발행에서 사용
        duration: data.duration ?? null,
        slides: data.slides ?? slides.length,
        hasAudio: data.hasAudio ?? false,
      });
    },
  };
}
