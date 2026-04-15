import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { readJson, dataPath } from "@/lib/file-io";

const VIDEO_OUTPUT_DIR = dataPath("videos");

interface ElevenLabsConfig {
  apiKey?: string;
  voiceId?: string;
}

interface Slide {
  text?: string;
  duration?: number;
  imageUrl?: string;
}

async function generateTts(text: string, outputPath: string): Promise<boolean> {
  const cfg = readJson<ElevenLabsConfig>(dataPath("elevenlabs-config.json")) || {};
  const apiKey = cfg.apiKey || "";
  const voiceId = cfg.voiceId || "iP95p4xoKVk53GoZ742B";
  if (!apiKey) return false;

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
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outputPath, buf);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const data = await request.json();
  const slides: Slide[] = data.slides || [];
  const ttsEnabled = data.ttsEnabled !== false;

  if (!slides.length) {
    return Response.json({ error: "slides required" }, { status: 400 });
  }

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

    // TTS merge
    let hasAudio = false;
    if (ttsEnabled) {
      const fullScript = slides.map((s) => s.text || "").filter(Boolean).join(". ");
      const ttsPath = path.join(tmp, "narration.mp3");
      if (await generateTts(fullScript, ttsPath)) {
        const finalPath = path.join(VIDEO_OUTPUT_DIR, `final_${Date.now()}.mp4`);
        try {
          execFileSync("ffmpeg", [
            "-y", "-i", outputPath, "-i", ttsPath,
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
            "-shortest", finalPath,
          ], { timeout: 60000 });
          fs.renameSync(finalPath, outputPath);
          hasAudio = true;
        } catch {
          // audio merge failed, keep video without audio
        }
      }
    }

    return Response.json({
      ok: true,
      filename: outputName,
      url: `/videos/${outputName}`,
      duration: totalDur,
      slides: slides.length,
      hasAudio,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  } finally {
    // cleanup tmp
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
