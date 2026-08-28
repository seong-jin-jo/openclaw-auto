#!/usr/bin/env bash
set -u

ROOT="/Users/sj/OSMU-archive/video-experiments/03-persona/disclosed-ai-influencer"
RUN="$ROOT/run-20260814-v2"
LOGS="$RUN/logs"
RENDERS="$RUN/renders"
mkdir -p "$RENDERS"

collect_one() {
  local id="$1" job_id="$2" model="$3"
  local rc url
  set +e
  higgsfield generate wait "$job_id" --json > "$LOGS/${id}-wait.json" 2> "$LOGS/${id}-wait.err"
  rc=$?
  higgsfield generate get "$job_id" --json > "$LOGS/${id}-result.json" 2> "$LOGS/${id}-result.err"
  set -e
  url="$(jq -r '.result_url // empty' "$LOGS/${id}-result.json" 2>/dev/null || true)"
  if [[ -n "$url" ]]; then
    curl -fL "$url" -o "$RENDERS/${id}-${model}.mp4" > "$LOGS/${id}-download.log" 2>&1 || true
  fi
  jq -n --arg experiment_id "$id" --arg job_id "$job_id" --arg model "$model" --arg result_url "$url" --arg local_path "$RENDERS/${id}-${model}.mp4" --argjson wait_exit_code "$rc" '{experiment_id:$experiment_id,job_id:$job_id,model:$model,result_url:$result_url,local_path:$local_path,wait_exit_code:$wait_exit_code}' > "$LOGS/${id}-collection.json"
}

collect_one P01 ca9cf257-8163-4795-a0e0-57ecfafd5399 wan2_7
collect_one P02 57b672ee-bf3f-4244-96e4-6330f842b1fb wan2_7
collect_one P05 a63af175-7774-4185-952a-7bc5ce7a207a wan2_7
collect_one P07 a5e68825-60a3-4104-81f5-5a96cf9470d9 kling3_0_turbo
collect_one P08 ba161ee7-e9b2-4a0e-8c9a-3237c87bb320 kling3_0_turbo
collect_one P09 2cfa2121-67b7-4636-b487-9d3ae7944209 kling3_0_turbo
collect_one P10 448f6a14-0a98-4ed3-9dc7-52a77ee5efa8 kling3_0_turbo
collect_one P11 30de176a-4fa3-4aac-8c42-217f4faab1c9 kling3_0_turbo
