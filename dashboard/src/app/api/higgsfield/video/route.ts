import path from "path";
import fs from "fs";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { hfRun, extractJson, findResultUrl, downloadTo, addNarration, logGen, recordMediaGenerationEvent, HiggsfieldUnavailableError, HiggsfieldUnauthenticatedError, assertHiggsfieldReady, STUDIO_DIR } from "@/lib/higgsfield";

// POST /api/higgsfield/video — image→video. body: { localPath, prompt, model?, narration? }
// localPath = /api/higgsfield/image 가 반환한 서버측 절대경로(CLI가 자동 업로드).
// model 기본 minimax_hailuo(6cr) — 무음. narration 주면 생성 후 TTS 음성 ffmpeg 합성(소리 추가).
export async function POST(request: Request) {
  const body = await request.json();
  const { localPath, prompt, model = "minimax_hailuo", narration = "", label = "" } = body;
  if (!localPath || !fs.existsSync(localPath)) {
    return Response.json({ error: "valid localPath required (먼저 /api/higgsfield/image 호출)" }, { status: 400 });
  }
  // 이미지와 같은 이유로 작업 공간을 남긴다(2026-09-06 고객 개방).
  const tenantId = await effectiveTenantId(request, body.tenant_id);
  if (!tenantId) return Response.json({ error: "테넌트를 식별할 수 없습니다." }, { status: 401 });
  const motion = prompt || "subtle idle motion, gentle sway and glow, fixed camera, smooth";
  // Marketing Studio(UGC/제품광고)는 mode·aspect_ratio 파라미터 필요 → 모델별 분기
  const extra = model.startsWith("marketing_studio")
    ? ["--mode", "ugc", "--aspect_ratio", "9:16"]
    : [];
  try {
    await assertHiggsfieldReady();
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
    const narrationRequested = Boolean(narration && String(narration).trim());
    let narrationReason: "server_tts_unavailable" | "audio_mix_failed" | undefined;
    if (narration && String(narration).trim()) {
      const soundName = `vid_${ts}.mp4`;
      const narrationResult = await addNarration(silentPath, String(narration), path.join(STUDIO_DIR, soundName));
      if (narrationResult.ok) {
        finalName = soundName;
        hasAudio = true;
      } else if (narrationResult.reason !== "narration_empty") {
        narrationReason = narrationResult.reason;
      }
    }
    runWithTenant(tenantId, () => logGen("video", model, label));
    await recordMediaGenerationEvent(tenantId, "video", model, label);
    const narrationMessage = narrationReason === "server_tts_unavailable"
      ? "내레이션 없이 생성됨 (서버에 TTS 실행기가 없음)"
      : narrationReason === "audio_mix_failed"
        ? "내레이션 없이 생성됨 (TTS 오디오 합성 실패)"
        : undefined;
    return Response.json({
      ok: true,
      url,
      file: `/api/higgsfield/asset/${finalName}`,
      model,
      hasAudio,
      narration: {
        requested: narrationRequested,
        included: hasAudio,
        ...(narrationReason ? { reason: narrationReason } : {}),
        ...(narrationMessage ? { message: narrationMessage } : {}),
      },
    });
  } catch (e) {
    if (e instanceof HiggsfieldUnauthenticatedError) {
      return Response.json({
        error: "영상 생성기에 로그인되어 있지 않습니다. 서버에서 생성기 로그인을 한 번 해 주시면 바로 쓰실 수 있습니다.",
        code: "GENERATOR_UNAUTHENTICATED",
      }, { status: 503 });
    }
    if (e instanceof HiggsfieldUnavailableError) {
      return Response.json({
        error: "영상 생성기가 아직 이 서버에 준비되지 않았습니다. 준비되면 바로 쓰실 수 있습니다.",
        code: "GENERATOR_UNAVAILABLE",
      }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg.slice(0, 400), nsfw: /nsfw/i.test(msg), credits: /not enough credits/i.test(msg) }, { status: 502 });
  }
}
