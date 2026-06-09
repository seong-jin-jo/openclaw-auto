import path from "path";
import fs from "fs";
import { hfRun, extractJson, findResultUrl, downloadTo, addNarration, logGen, STUDIO_DIR } from "@/lib/higgsfield";

// POST /api/higgsfield/video — image→video. body: { localPath, prompt, model?, narration? }
// localPath = /api/higgsfield/image 가 반환한 서버측 절대경로(CLI가 자동 업로드).
// model 기본 minimax_hailuo(6cr) — 무음. narration 주면 생성 후 TTS 음성 ffmpeg 합성(소리 추가).
export async function POST(request: Request) {
  const { localPath, prompt, model = "minimax_hailuo", narration = "", label = "" } = await request.json();
  if (!localPath || !fs.existsSync(localPath)) {
    return Response.json({ error: "valid localPath required (먼저 /api/higgsfield/image 호출)" }, { status: 400 });
  }
  const motion = prompt || "subtle idle motion, gentle sway and glow, fixed camera, smooth";
  // Marketing Studio(UGC/제품광고)는 mode·aspect_ratio 파라미터 필요 → 모델별 분기
  const extra = model.startsWith("marketing_studio")
    ? ["--mode", "ugc", "--aspect_ratio", "9:16"]
    : [];
  try {
    const { stdout } = await hfRun([
      "generate", "create", model,
      "--image", localPath, "--prompt", motion, ...extra,
      "--wait", "--wait-timeout", "10m", "--json",
    ]);
    const data = extractJson(stdout);
    const status = JSON.stringify(data ?? "").match(/"status"\s*:\s*"([^"]+)"/)?.[1] || "";
    if (/nsfw/i.test(status)) {
      return Response.json({ error: "Higgsfield NSFW 필터 차단(과금0). 종교/인물 이미지 회피 필요", nsfw: true }, { status: 502 });
    }
    const url = findResultUrl(data, /mp4|webm|mov/);
    if (!url) return Response.json({ error: "no video url", status, raw: stdout.slice(-400) }, { status: 502 });

    const ts = Date.now();
    const silentPath = path.join(STUDIO_DIR, `vidsilent_${ts}.mp4`);
    await downloadTo(url, silentPath);

    // 무음 클립에 내레이션 음성 합성 (성공 시 사운드 영상, 실패/비-mac이면 무음 유지)
    let finalName = `vidsilent_${ts}.mp4`;
    let hasAudio = false;
    if (narration && String(narration).trim()) {
      const soundName = `vid_${ts}.mp4`;
      const ok = await addNarration(silentPath, String(narration), path.join(STUDIO_DIR, soundName));
      if (ok) { finalName = soundName; hasAudio = true; }
    }
    logGen("video", model, label);
    return Response.json({ ok: true, url, file: `/api/higgsfield/asset/${finalName}`, model, hasAudio });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg.slice(0, 400), nsfw: /nsfw/i.test(msg), credits: /not enough credits/i.test(msg) }, { status: 502 });
  }
}
