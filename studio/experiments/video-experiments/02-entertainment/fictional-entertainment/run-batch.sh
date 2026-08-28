#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FOOTBALL_JSON="$ROOT_DIR/fictional-football/experiments.json"
ENTERTAINMENT_JSON="$ROOT_DIR/fictional-entertainment/experiments.json"
RUN_DIR="$ROOT_DIR/fictional-entertainment/run-evidence"
mkdir -p "$RUN_DIR"

for manifest in "$FOOTBALL_JSON" "$ENTERTAINMENT_JSON"; do
  jq -c '.[]' "$manifest"
done | while IFS= read -r experiment; do
  experiment_id="$(jq -r '.id' <<<"$experiment")"
  model="$(jq -r '.model' <<<"$experiment")"
  prompt="$(jq -r '.prompt' <<<"$experiment")"
  duration="$(jq -r '.duration' <<<"$experiment")"
  resolution="$(jq -r '.resolution' <<<"$experiment")"

  extra_args=()
  if [[ "$model" == "seedance_2_0_mini" || "$model" == "wan3_0" ]]; then
    extra_args+=(--generate-audio false)
  fi
  if [[ "$model" == "kling2_6" ]]; then
    extra_args+=(--sound false)
  fi

  before_status="$(higgsfield account status --json)"
  before_balance="$(jq -r '.credits' <<<"$before_status")"
  if awk "BEGIN {exit !($before_balance <= 50)}"; then
    jq -n --arg id "$experiment_id" --argjson balance "$before_balance" \
      '{experiment_id:$id,status:"NOT_SUBMITTED_BALANCE_GUARD",balance:$balance}'
    break
  fi

  higgsfield generate cost "$model" \
    --prompt "$prompt" \
    --aspect-ratio 9:16 \
    --duration "$duration" \
    --resolution "$resolution" \
    "${extra_args[@]}" \
    --json > "$RUN_DIR/$experiment_id.cost.json"

  started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  higgsfield generate create "$model" \
    --prompt "$prompt" \
    --aspect-ratio 9:16 \
    --duration "$duration" \
    --resolution "$resolution" \
    "${extra_args[@]}" \
    --json > "$RUN_DIR/$experiment_id.submit.json"
  submitted_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  after_status="$(higgsfield account status --json)"
  after_balance="$(jq -r '.credits' <<<"$after_status")"

  jq -n \
    --arg experiment_id "$experiment_id" \
    --arg model "$model" \
    --argjson cost "$(jq '.credits' "$RUN_DIR/$experiment_id.cost.json")" \
    --argjson submit "$(jq '.' "$RUN_DIR/$experiment_id.submit.json")" \
    --arg started_at "$started_at" \
    --arg submitted_at "$submitted_at" \
    --argjson before_balance "$before_balance" \
    --argjson after_balance "$after_balance" \
    '{experiment_id:$experiment_id, model:$model, preview_credits:$cost, balance_before:$before_balance, balance_after:$after_balance, started_at:$started_at, submitted_at:$submitted_at, submission:$submit}'
done
