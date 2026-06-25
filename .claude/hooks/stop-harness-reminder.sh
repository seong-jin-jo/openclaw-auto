#!/bin/bash
# Remind agents once per stop attempt to satisfy the repo harness before final reporting/handoff.

set -euo pipefail

payload="$(cat || true)"

if printf '%s' "$payload" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  echo '{}'
  exit 0
fi

cat <<'JSON'
{
  "decision": "block",
  "reason": "OpenClaw harness checkpoint before final answer or handoff: 1) Session transfer can happen mid-task, not only at startup. If tmux pane context and wiki/ops/session-state.md are both possible, ask the user which handoff source to follow; do not choose by inference. 2) Update wiki/ops/session-state.md with the user-confirmed handoff basis, current task, files touched, verification state, blockers, deployment status, and exact next action. 3) Run and report the relevant test/E2E/build, or explicitly record why local verification is blocked and how it was verified elsewhere. 4) Update the relevant wiki page for any behavior/schema/channel/auth/publish change. Claude/Codex must be able to resume from session-state.md without this transcript. If all are already done, say so and finish."
}
JSON
