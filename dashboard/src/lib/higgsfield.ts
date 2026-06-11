// Higgsfield CLI 래퍼 — 서버측 API route에서 사용.
// CLI(@higgsfield/cli)는 device-flow 토큰으로 인증된 main 계정의 크레딧을 사용한다.
// (cloud.higgsfield.ai API키 워크스페이스가 아니라) — `higgsfield auth login` 로 한 번 로그인 필요.
// 바이너리 경로는 환경마다 다르므로 HIGGSFIELD_BIN env로 주입(미설정 시 PATH의 `higgsfield`).
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { dataPath } from "@/lib/file-io";
import { MEDIA_ROOT, tenantMediaDir, assetUrl } from "@/lib/storage";

const execFileP = promisify(execFile);
export const HF_BIN = process.env.HIGGSFIELD_BIN || "higgsfield";
// 미디어 루트(data/studio) — 테넌트별 격리는 studioDir(tenantId)로. STUDIO_DIR 자체는 루트(genlog 등 비격리 메타용).
export const STUDIO_DIR = MEDIA_ROOT;

// 테넌트별 스튜디오 디렉토리(data/studio/{tenantId}/). 생성물은 이 경로에 저장해 테넌트 격리.
export function studioDir(tenantId: string): string {
  return tenantMediaDir(tenantId);
}

// 미디어 파일명 — 타임스탬프(Date.now) 대신 crypto.randomUUID로 열거 불가능하게.
export function mediaFilename(ext: string): string {
  const clean = String(ext || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
  return `${crypto.randomUUID()}.${clean}`;
}

// asset 라우트용 테넌트 에셋 URL 재노출(호출부 편의).
export { assetUrl };

// CLI는 진행로그를 stderr로, 결과 JSON을 stdout으로 — 단 섞일 수 있어 JSON 블록만 추출.
export function extractJson(stdout: string): unknown {
  const arr = stdout.indexOf("[");
  const obj = stdout.indexOf("{");
  const start = arr === -1 ? obj : obj === -1 ? arr : Math.min(arr, obj);
  if (start === -1) return null;
  try {
    return JSON.parse(stdout.slice(start));
  } catch {
    return null;
  }
}

export function findResultUrl(data: unknown, ext: RegExp): string | null {
  const txt = JSON.stringify(data ?? "");
  const m = txt.match(new RegExp(`https?://[^"'\\\\ ]+\\.(?:${ext.source})`, "i"));
  return m ? m[0] : null;
}

export async function hfRun(args: string[], timeoutMs = 480000): Promise<{ stdout: string; stderr: string }> {
  return execFileP(HF_BIN, args, { timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 });
}

// 생성 로그 — Higgsfield 거래내역(모델/시각만 줌)과 시간으로 매칭해 "어느 산출물인지" 표시용
export const GENLOG = dataPath(path.join("studio", "genlog.json"));
export function logGen(kind: "image" | "video", model: string, label: string): void {
  try {
    fs.mkdirSync(STUDIO_DIR, { recursive: true });
    let arr: unknown[] = [];
    try { arr = JSON.parse(fs.readFileSync(GENLOG, "utf8")); } catch { arr = []; }
    arr.push({ ts: Date.now(), kind, model, label: (label || "").slice(0, 80) });
    fs.writeFileSync(GENLOG, JSON.stringify((arr as unknown[]).slice(-300)));
  } catch { /* noop */ }
}
export function readGenLog(): Array<{ ts: number; kind: string; model: string; label: string }> {
  try { return JSON.parse(fs.readFileSync(GENLOG, "utf8")); } catch { return []; }
}

export const FFMPEG_BIN = process.env.FFMPEG_BIN || "ffmpeg";
export const SAY_BIN = process.env.SAY_BIN || "say"; // macOS TTS (로컬). prod linux는 ElevenLabs로 교체 예정.

// 무음 Higgsfield 클립에 내레이션 음성 입히기. 성공 시 outPath에 사운드 영상 생성, true.
// 영상을 내레이션 길이에 맞춰 루프(-stream_loop)하여 음성이 잘리지 않게.
export async function addNarration(videoPath: string, text: string, outPath: string): Promise<boolean> {
  if (!text || !text.trim()) return false;
  const aiff = `${outPath}.narr.aiff`;
  try {
    await execFileP(SAY_BIN, ["-v", "Yuna", "-r", "205", "-o", aiff, text.slice(0, 600)], { timeout: 60000 });
  } catch {
    return false; // say 미존재(비-macOS) → 무음 유지
  }
  try {
    await execFileP(FFMPEG_BIN, [
      "-y", "-stream_loop", "-1", "-i", videoPath, "-i", aiff,
      "-map", "0:v:0", "-map", "1:a:0",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
      "-shortest", outPath,
    ], { timeout: 120000 });
    return true;
  } catch {
    return false;
  } finally {
    try { fs.unlinkSync(aiff); } catch { /* noop */ }
  }
}

export async function downloadTo(url: string, outPath: string): Promise<number> {
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  return buf.length;
}
