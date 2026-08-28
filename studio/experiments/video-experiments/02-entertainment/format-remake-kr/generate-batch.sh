#!/bin/zsh
set -u

SCRIPT_DIR=${0:A:h}
LOG_DIR="$SCRIPT_DIR/logs"
PROMPT_DIR="$SCRIPT_DIR/prompts"
OUTPUT_DIR="$SCRIPT_DIR/outputs"
ATTEMPTS="$LOG_DIR/attempts.tsv"
RUN_ID=$(date '+%Y%m%dT%H%M%S%z')
RUN_DIR="$LOG_DIR/runs/$RUN_ID"
mkdir -p "$LOG_DIR" "$OUTPUT_DIR" "$RUN_DIR"

if [[ ! -f "$ATTEMPTS" ]]; then
  print -r -- $'attempted_at\texperiment_id\tphase\tstatus\tjob_id\tcredits_before\tcredits_quote\tmodel\tprompt_file\tmessage' > "$ATTEMPTS"
fi

credits_now() {
  higgsfield account status --json | jq -r '.credits'
}

run_one() {
  local id=$1
  local model=$2
  local quote=$3
  local prompt_file=$4
  shift 4
  local before attempted create_rc job_id result_url ext
  before=$(credits_now)
  attempted=$(date -Iseconds)

  if (( ${before%.*} <= 50 )); then
    print -r -- "$attempted\t$id\tpreflight\tSTOPPED_LOW_BALANCE\t\t$before\t$quote\t$model\t$prompt_file\tstop threshold 50" >> "$ATTEMPTS"
    return 2
  fi

  print -r -- "$attempted\t$id\tcreate\tATTEMPTED\t\t$before\t$quote\t$model\t$prompt_file\tlogged before submission" >> "$ATTEMPTS"
  higgsfield generate cost "$model" "$@" --prompt "$(<"$prompt_file")" --json > "$RUN_DIR/$id.cost.json" 2> "$RUN_DIR/$id.cost.stderr.log"
  higgsfield generate create "$model" "$@" --prompt "$(<"$prompt_file")" --json > "$RUN_DIR/$id.create.json" 2> "$RUN_DIR/$id.create.stderr.log"
  create_rc=$?
  if (( create_rc != 0 )); then
    print -r -- "$(date -Iseconds)\t$id\tcreate\tREJECTED_BEFORE_JOB\t\t$before\t$quote\t$model\t$prompt_file\texit $create_rc" >> "$ATTEMPTS"
    return 1
  fi

  job_id=$(jq -r 'if type=="array" then (.[0].id // empty) else (.id // empty) end' "$RUN_DIR/$id.create.json")
  if [[ -z "$job_id" ]]; then
    print -r -- "$(date -Iseconds)\t$id\tcreate\tFAILED_NO_JOB_ID\t\t$before\t$quote\t$model\t$prompt_file\tcreate returned no id" >> "$ATTEMPTS"
    return 1
  fi
  print -r -- "$(date -Iseconds)\t$id\tcreate\tJOB_ACCEPTED\t$job_id\t$before\t$quote\t$model\t$prompt_file\twaiting" >> "$ATTEMPTS"
  higgsfield generate wait "$job_id" --timeout 30m --interval 5s --quiet --json > "$RUN_DIR/$id.final.json" 2> "$RUN_DIR/$id.wait.stderr.log"
  result_url=$(jq -r 'if type=="array" then (.[0].result_url // empty) else (.result_url // empty) end' "$RUN_DIR/$id.final.json")
  if [[ -z "$result_url" ]]; then
    print -r -- "$(date -Iseconds)\t$id\twait\tFAILED_NO_URL\t$job_id\t$before\t$quote\t$model\t$prompt_file\tsee final json" >> "$ATTEMPTS"
    return 1
  fi
  ext=${result_url##*.}
  [[ "$ext" == "mp4" ]] || ext=mp4
  curl -fL "$result_url" -o "$OUTPUT_DIR/format-remake-kr-$id-v1-gpt-codex.$ext"
  print -r -- "$(date -Iseconds)\t$id\tdownload\tCOMPLETED\t$job_id\t$before\t$quote\t$model\t$prompt_file\t$result_url" >> "$ATTEMPTS"
}

run_one vf-kr-001a veo3_1_lite 12 "$PROMPT_DIR/format-remake-kr-vf-kr-001a-scene-veo-v1-gpt-codex.txt" --aspect_ratio 9:16 --duration 8 --generate_audio true || exit $?
run_one vf-kr-001b veo3_1_lite 12 "$PROMPT_DIR/format-remake-kr-vf-kr-001b-explain-veo-v1-gpt-codex.txt" --aspect_ratio 9:16 --duration 8 --generate_audio true || exit $?
run_one vf-kr-001c kling3_0 16 "$PROMPT_DIR/format-remake-kr-vf-kr-001c-scene-kling-v1-gpt-codex.txt" --aspect_ratio 9:16 --duration 8 --mode std --sound on || exit $?
run_one vf-kr-001d seedance_2_0 36 "$PROMPT_DIR/format-remake-kr-vf-kr-001d-scene-seedance-v1-gpt-codex.txt" --aspect_ratio 9:16 --duration 8 --mode std --resolution 720p --bitrate_mode standard --generate_audio true --genre auto || exit $?
