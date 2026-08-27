#!/usr/bin/env bash
set -u

ROOT="/Users/sj/OSMU-archive/video-experiments/03-persona/disclosed-ai-influencer"
RUN="$ROOT/run-20260814-v2"
LOGS="$RUN/logs"
mkdir -p "$LOGS" "$RUN/renders" "$RUN/frames"

BASE='Vertical 9:16 creator-style video. An unmistakably adult fictional Korean virtual influencer in her late twenties, with no resemblance to any real person, sits in a softly lit modern creator studio. She wears a tasteful fitted red knit top with full coverage. Medium close-up, locked tripod, eye-level camera. She looks directly into the lens, taps her temple once as if acknowledging she is an AI character, then gives a candid amused smile. Mainstream SFW, realistic with a subtly stylized digital-human finish, natural skin texture, no readable text, no logos, no nudity, no transparent fabric, no sexual action.'
INTENSITY='Vertical 9:16 creator-style video. An unmistakably adult fictional Korean virtual influencer in her late twenties, with no resemblance to any real person, sits in a softly lit modern creator studio. She wears an elegant fully covering black satin evening dress with a tasteful neckline. Medium close-up, locked tripod, eye-level camera. She looks directly into the lens, taps her temple once as if acknowledging she is an AI character, then gives a candid amused smile. Sensual adult editorial mood, confident eye contact, fully clothed, realistic with a subtly stylized digital-human finish, natural skin texture, no readable text, no logos, no nudity, no transparent fabric, no sexual action.'
STYLE='Vertical 9:16 creator-style video. An unmistakably adult fictional Korean virtual influencer in her late twenties, with no resemblance to any real person, sits in a softly lit modern creator studio. She wears a tasteful fitted red knit top with full coverage. Medium close-up, locked tripod, eye-level camera. She looks directly into the lens, taps her temple once as if acknowledging she is an AI character, then gives a candid amused smile. Mainstream SFW, intentionally stylized premium 3D digital-human aesthetic with a graphic chin-length cobalt bob and subtle iridescent catchlights, no readable text, no logos, no nudity, no transparent fabric, no sexual action.'
CAMERA='Vertical 9:16 creator-style video. An unmistakably adult fictional Korean virtual influencer in her late twenties, with no resemblance to any real person, sits in a softly lit modern creator studio. She wears a tasteful fitted red knit top with full coverage. Medium close-up, slow handheld push-in from chest-up to face, eye-level camera with slight natural micro-movement. She looks directly into the lens, taps her temple once as if acknowledging she is an AI character, then gives a candid amused smile. Mainstream SFW, realistic with a subtly stylized digital-human finish, natural skin texture, no readable text, no logos, no nudity, no transparent fabric, no sexual action.'
HOOK='Vertical 9:16 creator-style video. An unmistakably adult fictional Korean virtual influencer in her late twenties, with no resemblance to any real person, sits in a softly lit modern creator studio. She wears a tasteful fitted red knit top with full coverage. Medium close-up, locked tripod, eye-level camera. In the first half-second she catches a small glowing translucent pixel heart tossed from off camera, looks directly into the lens, then opens her palm and the heart breaks into harmless digital particles as she gives a candid amused smile. Mainstream SFW, realistic with a subtly stylized digital-human finish, natural skin texture, no readable text, no logos, no nudity, no transparent fabric, no sexual action.'

status_json() {
  higgsfield account status --json
}

quote() {
  local model="$1" prompt="$2" duration="$3" resolution="$4" audio="$5"
  if [[ "$model" == "veo3_1_lite" ]]; then
    higgsfield generate cost "$model" --prompt "$prompt" --aspect_ratio 9:16 --duration "$duration" --generate_audio "$audio" --json
  elif [[ "$model" == "seedance_2_0_mini" ]]; then
    higgsfield generate cost "$model" --prompt "$prompt" --aspect_ratio 9:16 --duration "$duration" --resolution "$resolution" --generate_audio "$audio" --json
  else
    higgsfield generate cost "$model" --prompt "$prompt" --aspect_ratio 9:16 --duration "$duration" --resolution "$resolution" --json
  fi
}

create_job() {
  local id="$1" model="$2" variable="$3" prompt="$4" duration="$5" resolution="$6" audio="$7"
  local start end before after rc job_id
  start="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  before="$(status_json)"
  printf '%s\n' "$before" > "$LOGS/${id}-balance-before.json"
  if awk -v c="$(printf '%s' "$before" | jq -r '.credits')" 'BEGIN { exit !(c <= 50) }'; then
    jq -n --arg experiment_id "$id" --arg model "$model" --arg variable "$variable" --arg prompt "$prompt" --arg started_at "$start" --argjson balance_before "$(printf '%s' "$before" | jq -r '.credits')" '{experiment_id:$experiment_id,model:$model,variable:$variable,prompt:$prompt,started_at:$started_at,status:"skipped_balance_guard",balance_before:$balance_before}' > "$LOGS/${id}-submission.json"
    return 0
  fi
  printf '%s\n' "$prompt" > "$LOGS/${id}-prompt.txt"
  quote "$model" "$prompt" "$duration" "$resolution" "$audio" > "$LOGS/${id}-quote.json" 2> "$LOGS/${id}-quote.err"

  set +e
  if [[ "$model" == "veo3_1_lite" ]]; then
    higgsfield generate create "$model" --prompt "$prompt" --aspect_ratio 9:16 --duration "$duration" --generate_audio "$audio" --json > "$LOGS/${id}-create.json" 2> "$LOGS/${id}-create.err"
  elif [[ "$model" == "seedance_2_0_mini" ]]; then
    higgsfield generate create "$model" --prompt "$prompt" --aspect_ratio 9:16 --duration "$duration" --resolution "$resolution" --generate_audio "$audio" --json > "$LOGS/${id}-create.json" 2> "$LOGS/${id}-create.err"
  else
    higgsfield generate create "$model" --prompt "$prompt" --aspect_ratio 9:16 --duration "$duration" --resolution "$resolution" --json > "$LOGS/${id}-create.json" 2> "$LOGS/${id}-create.err"
  fi
  rc=$?
  set -e

  end="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  after="$(status_json)"
  printf '%s\n' "$after" > "$LOGS/${id}-balance-after.json"
  higgsfield account transactions --size 10 --json > "$LOGS/${id}-transactions-after.json"
  job_id="$(jq -r '.[0] // .id // empty' "$LOGS/${id}-create.json" 2>/dev/null || true)"
  jq -n \
    --arg experiment_id "$id" \
    --arg model "$model" \
    --arg variable "$variable" \
    --arg prompt "$prompt" \
    --arg started_at "$start" \
    --arg ended_at "$end" \
    --arg job_id "$job_id" \
    --argjson exit_code "$rc" \
    --argjson quoted_cost "$(jq -r '.credits // 0' "$LOGS/${id}-quote.json" 2>/dev/null || echo 0)" \
    --argjson balance_before "$(printf '%s' "$before" | jq -r '.credits')" \
    --argjson balance_after "$(printf '%s' "$after" | jq -r '.credits')" \
    '{experiment_id:$experiment_id,model:$model,variable:$variable,prompt:$prompt,started_at:$started_at,ended_at:$ended_at,job_id:$job_id,exit_code:$exit_code,quoted_cost:$quoted_cost,balance_before:$balance_before,balance_after:$balance_after,observed_balance_delta:($balance_before-$balance_after)}' \
    > "$LOGS/${id}-submission.json"
}

set -e
status_json > "$LOGS/batch-balance-before.json"

create_job P01 wan2_7 baseline "$BASE" 5 720p false
create_job P02 wan2_7 prompt_intensity "$INTENSITY" 5 720p false
create_job P03 wan2_7 character_style "$STYLE" 5 720p false
create_job P04 wan2_7 camera "$CAMERA" 5 720p false
create_job P05 wan2_7 hook "$HOOK" 5 720p false
create_job P06 wan2_7 repeatability_rerun "$BASE" 5 720p false

create_job P07 kling3_0_turbo model_baseline "$BASE" 5 720p false
create_job P08 kling3_0_turbo prompt_intensity "$INTENSITY" 5 720p false
create_job P09 kling3_0_turbo camera "$CAMERA" 5 720p false
create_job P10 kling3_0_turbo hook "$HOOK" 5 720p false
create_job P11 kling3_0_turbo character_style "$STYLE" 5 720p false

create_job P12 veo3_1_lite model_baseline "$BASE" 8 720p false
create_job P13 veo3_1_lite prompt_intensity "$INTENSITY" 8 720p false
create_job P14 veo3_1_lite camera "$CAMERA" 8 720p false
create_job P15 veo3_1_lite hook "$HOOK" 8 720p false

create_job P16 seedance_2_0_mini model_baseline "$BASE" 5 720p false
create_job P17 seedance_2_0_mini prompt_intensity "$INTENSITY" 5 720p false
create_job P18 seedance_2_0_mini camera "$CAMERA" 5 720p false
create_job P19 seedance_2_0_mini hook "$HOOK" 5 720p false
create_job P20 seedance_2_0_mini character_style "$STYLE" 5 720p false

status_json > "$LOGS/batch-balance-after-submission.json"
