#!/bin/bash
# Unified Claude CLI Cron Runner
# Reads config/cron/jobs.json (same as OpenClaw gateway)
# Only runs when ai-runtime.json mode = "cli"
# Uses cli-prompts.json for each job's prompt

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$BASE_DIR/data"
CONFIG_DIR="$BASE_DIR/config"
JOBS_FILE="$CONFIG_DIR/cron/jobs.json"
RUNTIME_FILE="$DATA_DIR/ai-runtime.json"
PROMPTS_FILE="$DATA_DIR/cli-prompts.json"
LOG_DIR="$DATA_DIR/cli-logs"
LOCK_DIR="/tmp/claude-cron-locks"

mkdir -p "$LOG_DIR" "$LOCK_DIR"

export PATH="$HOME/.local/bin:$PATH"

# Check mode
if [ ! -f "$RUNTIME_FILE" ]; then
  exit 0
fi

python3 - "$JOBS_FILE" "$RUNTIME_FILE" "$PROMPTS_FILE" "$LOG_DIR" "$LOCK_DIR" "$BASE_DIR" << 'PYTHON'
import json, sys, os, subprocess
from datetime import datetime
from pathlib import Path

jobs_file = sys.argv[1]
runtime_file = sys.argv[2]
prompts_file = sys.argv[3]
log_dir = sys.argv[4]
lock_dir = sys.argv[5]
base_dir = sys.argv[6]

# Check mode
try:
    with open(runtime_file) as f:
        runtime = json.load(f)
    if runtime.get("mode") != "cli":
        sys.exit(0)
except:
    sys.exit(0)

# Load jobs
try:
    with open(jobs_file) as f:
        jobs_data = json.load(f)
except:
    sys.exit(0)

# Load prompts
try:
    with open(prompts_file) as f:
        prompts = json.load(f)
except:
    prompts = {}

now = datetime.now()

def every_ms_to_hours(ms):
    return max(1, ms // 3600000)

def should_run(job):
    """Check if job is due based on everyMs schedule"""
    if not job.get("enabled"):
        return False
    sched = job.get("schedule", {})
    every_ms = sched.get("everyMs", 21600000)
    state = job.get("state", {})
    last_run = state.get("lastRunAtMs", 0)

    if last_run == 0:
        return True

    elapsed = (now.timestamp() * 1000) - last_run
    return elapsed >= every_ms

for job in jobs_data.get("jobs", []):
    name = job.get("name", "")
    if not should_run(job):
        continue

    # Get CLI prompt for this job
    prompt = prompts.get(name, "")
    if not prompt:
        continue

    lock_file = os.path.join(lock_dir, f"{name}.lock")

    # Skip if already running
    if os.path.exists(lock_file):
        try:
            pid = int(open(lock_file).read().strip())
            if os.path.exists(f"/proc/{pid}"):
                continue
        except:
            pass
        os.remove(lock_file)

    print(f"[{now.strftime('%H:%M')}] Running: {name}")

    with open(lock_file, "w") as f:
        f.write(str(os.getpid()))

    try:
        log_file = os.path.join(log_dir, f"{name}-{now.strftime('%Y%m%d-%H%M')}.log")

        result = subprocess.run(
            ["claude", "-p", prompt, "--allowedTools", "Read,Write,Bash", "--permission-mode", "auto", "--max-turns", "20"],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=base_dir,
        )

        output = result.stdout + ("\n--- STDERR ---\n" + result.stderr if result.stderr else "")
        status = "ok" if result.returncode == 0 else "error"

        with open(log_file, "w") as f:
            f.write(output)

        # Update job state in jobs.json
        state = job.get("state", {})
        state["lastRunAtMs"] = int(now.timestamp() * 1000)
        state["lastRunStatus"] = status
        state["lastStatus"] = status
        state["lastError"] = output[:500] if status == "error" else ""
        if status == "ok":
            state["consecutiveErrors"] = 0
        else:
            state["consecutiveErrors"] = state.get("consecutiveErrors", 0) + 1
        job["state"] = state

        # Keep only last 20 logs per job
        logs = sorted(Path(log_dir).glob(f"{name}-*.log"))
        for old in logs[:-20]:
            old.unlink()

        print(f"  → {status}")

    except subprocess.TimeoutExpired:
        state = job.get("state", {})
        state["lastRunAtMs"] = int(now.timestamp() * 1000)
        state["lastStatus"] = "error"
        state["lastError"] = "Timeout (5 minutes)"
        state["consecutiveErrors"] = state.get("consecutiveErrors", 0) + 1
        job["state"] = state
        print("  → timeout")
    except Exception as e:
        state = job.get("state", {})
        state["lastRunAtMs"] = int(now.timestamp() * 1000)
        state["lastStatus"] = "error"
        state["lastError"] = str(e)
        state["consecutiveErrors"] = state.get("consecutiveErrors", 0) + 1
        job["state"] = state
        print(f"  → error: {e}")
    finally:
        if os.path.exists(lock_file):
            os.remove(lock_file)

# Save updated states back to jobs.json
with open(jobs_file, "w") as f:
    json.dump(jobs_data, f, indent=2, ensure_ascii=False)

PYTHON
