import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { readJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { signMediaToken } from "@/lib/media-token";

// 0차: Shorts Factory stabilization - support wiki context injection (from sourcing/studio), explainable errors.
// Respect handoff: no PORT changes, build constraints. See wiki/learnings/2026-06-19-openclaw-osmu-handoff.md
// Multi-channel with text+video for operator's services.
//
// SNS-015: dataPath("videos")는 절대 모듈 스코프에서 평가하지 않는다(finding 6 — 요청/테넌트
// 컨텍스트 밖에서 평가되면 모든 테넌트가 같은 공유 경로를 쓰게 되는 구멍). 이 파일의 모든
// dataPath() 호출은 POST 핸들러 안, runWithTenant(tenantId, ...) 콜백 "안"에서만 일어난다.

interface ElevenLabsConfig {
  apiKey?: string;
  voiceId?: string;
}

interface Slide {
  text?: string;
  duration?: number;
  imageUrl?: string;
}

type ElevenLabsTtsResult =
  | { ok: true }
  | { ok: false; reason: "elevenlabs_key_missing" | "elevenlabs_request_failed" };

async function generateTts(text: string, outputPath: string): Promise<ElevenLabsTtsResult> {
  const cfg = readJson<ElevenLabsConfig>(dataPath("elevenlabs-config.json")) || {};
  const apiKey = cfg.apiKey || "";
  const voiceId = cfg.voiceId || "iP95p4xoKVk53GoZ742B";
  if (!apiKey) return { ok: false, reason: "elevenlabs_key_missing" };

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return { ok: false, reason: "elevenlabs_request_failed" };
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outputPath, buf);
    return { ok: true };
  } catch (e) {
    // 0차: explainable error
    console.error("[0차 video] TTS error:", e);
    return { ok: false, reason: "elevenlabs_request_failed" };
  }
}

// 효과음/배경음(BGM) 다운로드 — MyInstants 등 직접 URL 또는 data/sfx/ 로컬 파일 경로
async function resolveAudioInput(src: string, tmpDir: string): Promise<string | null> {
  if (!src) return null;
  // 로컬 라이브러리: /sfx/{name} → data/sfx/{name}
  if (src.startsWith("/sfx/")) {
    const local = dataPath(path.join("sfx", src.replace("/sfx/", "")));
    return fs.existsSync(local) ? local : null;
  }
  if (/^https?:\/\//.test(src)) {
    try {
      const res = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const out = path.join(tmpDir, "bgm_src");
      fs.writeFileSync(out, buf);
      return out;
    } catch {
      return null;
    }
  }
  return null;
}

export async function POST(request: Request) {
  const data = await request.json();
  const slides: Slide[] = data.slides || [];
  const ttsEnabled = data.ttsEnabled !== false;
  const bgmUrl: string = data.bgmUrl || ""; // 효과음/배경음 URL 또는 /sfx/{name}
  const bgmVolume: number =
    typeof data.bgmVolume === "number" && data.bgmVolume >= 0 && data.bgmVolume <= 1 ? data.bgmVolume : 0.25;

  if (!slides.length) {
    return Response.json({ error: "slides required" }, { status: 400 });
  }

  const tenantId = await effectiveTenantId(request, null);
  return runWithTenant(tenantId, () => generateVideo({ slides, ttsEnabled, bgmUrl, bgmVolume, tenantId }));
}

async function generateVideo(opts: {
  slides: Slide[];
  ttsEnabled: boolean;
  bgmUrl: string;
  bgmVolume: number;
  tenantId: string | null;
}): Promise<Response> {
  const { slides, ttsEnabled, bgmUrl, bgmVolume, tenantId } = opts;
  const VIDEO_OUTPUT_DIR = dataPath("videos"); // runWithTenant 컨텍스트 안 — 테넌트별 격리.
  fs.mkdirSync(VIDEO_OUTPUT_DIR, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "video-"));

  try {
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const duration = slide.duration || 4;
      const text = (slide.text || "")
        .replace(/'/g, "\u2019")
        .replace(/"/g, '\\"')
        .replace(/:/g, "\\:")
        .replace(/%/g, "%%");
      const imageUrl = slide.imageUrl || "";
      let imgPath: string | null = null;

      if (imageUrl) {
        try {
          const res = await fetch(imageUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(10000),
          });
          const buf = Buffer.from(await res.arrayBuffer());
          imgPath = path.join(tmp, `img_${i}.jpg`);
          fs.writeFileSync(imgPath, buf);
        } catch {
          imgPath = null;
        }
      }

      const slidePath = path.join(tmp, `slide_${i}.mp4`);
      if (imgPath) {
        execFileSync("ffmpeg", [
          "-y", "-loop", "1", "-t", String(duration), "-i", imgPath,
          "-vf", `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,drawtext=text='${text}':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=h-250:borderw=3:bordercolor=black`,
          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", slidePath,
        ], { timeout: 30000 });
      } else {
        execFileSync("ffmpeg", [
          "-y", "-f", "lavfi", "-t", String(duration),
          "-i", `color=c=black:s=1080x1920:d=${duration}`,
          "-vf", `drawtext=text='${text}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:borderw=3:bordercolor=black`,
          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", slidePath,
        ], { timeout: 30000 });
      }
    }

    const totalDur = slides.reduce((s, sl) => s + (sl.duration || 4), 0);
    const outputName = `video_${Date.now()}.mp4`;
    const outputPath = path.join(VIDEO_OUTPUT_DIR, outputName);

    // concat list
    const concatList = path.join(tmp, "concat.txt");
    const concatContent = slides.map((_, i) => `file '${path.join(tmp, `slide_${i}.mp4`)}'`).join("\n");
    fs.writeFileSync(concatList, concatContent);

    execFileSync("ffmpeg", [
      "-y", "-f", "concat", "-safe", "0", "-i", concatList,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", outputPath,
    ], { timeout: 120000 });

    // ── 오디오 스테이지: 내레이션(TTS) + 효과음/배경음(BGM) 믹스 ──
    let hasAudio = false;
    let hasNarration = false;
    let hasBgm = false;
    let narrationReason: "elevenlabs_key_missing" | "elevenlabs_request_failed" | undefined;

    // 1) TTS 내레이션
    let ttsPath: string | null = null;
    if (ttsEnabled) {
      const fullScript = slides.map((s) => s.text || "").filter(Boolean).join(". ");
      const candidate = path.join(tmp, "narration.mp3");
      if (fullScript) {
        const ttsResult = await generateTts(fullScript, candidate);
        if (ttsResult.ok) {
          ttsPath = candidate;
          hasNarration = true;
        } else {
          narrationReason = ttsResult.reason;
        }
      }
    }

    // 2) 효과음/배경음
    const bgmPath = await resolveAudioInput(bgmUrl, tmp);
    hasBgm = !!bgmPath;

    if (ttsPath || bgmPath) {
      const finalPath = path.join(VIDEO_OUTPUT_DIR, `final_${Date.now()}.mp4`);
      try {
        if (ttsPath && bgmPath) {
          // 내레이션 + BGM(저음량 루프) 동시 믹스 → 영상 길이에 맞춤
          execFileSync("ffmpeg", [
            "-y", "-i", outputPath, "-i", ttsPath, "-stream_loop", "-1", "-i", bgmPath,
            "-filter_complex", `[2:a]volume=${bgmVolume}[bg];[1:a][bg]amix=inputs=2:duration=first:dropout_transition=0[a]`,
            "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", finalPath,
          ], { timeout: 90000 });
        } else if (ttsPath) {
          execFileSync("ffmpeg", [
            "-y", "-i", outputPath, "-i", ttsPath,
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", finalPath,
          ], { timeout: 60000 });
        } else if (bgmPath) {
          // BGM/효과음만 (저음량 루프)
          execFileSync("ffmpeg", [
            "-y", "-i", outputPath, "-stream_loop", "-1", "-i", bgmPath,
            "-filter_complex", `[1:a]volume=${bgmVolume}[a]`,
            "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", finalPath,
          ], { timeout: 60000 });
        }
        fs.renameSync(finalPath, outputPath);
        hasAudio = true;
      } catch {
        // 오디오 믹스 실패 → 무음 영상 유지
      }
    }

    let url = `/videos/${outputName}`; // 운영자(공유 루트) — 기존 정적 경로 유지.
    if (tenantId) {
      const token = signMediaToken(tenantId, outputName);
      if (!token) {
        return Response.json(
          { error: "미디어 서명 비밀이 설정되지 않아 결과 URL을 발급할 수 없습니다(MEDIA_SIGNING_SECRET 필요)." },
          { status: 400 },
        );
      }
      url = `/api/media/${token}`;
    }

    const narrationMessage = narrationReason === "elevenlabs_key_missing"
      ? "내레이션 없이 생성됨 (ElevenLabs 키 미설정)"
      : narrationReason === "elevenlabs_request_failed"
        ? "내레이션 없이 생성됨 (ElevenLabs TTS 요청 실패)"
        : undefined;
    return Response.json({
      ok: true,
      filename: outputName,
      url,
      duration: totalDur,
      slides: slides.length,
      hasAudio,
      hasNarration,
      hasBgm,
      narration: {
        requested: ttsEnabled,
        included: hasNarration,
        ...(narrationReason ? { reason: narrationReason } : {}),
        ...(narrationMessage ? { message: narrationMessage } : {}),
      },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  } finally {
    // cleanup tmp
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
