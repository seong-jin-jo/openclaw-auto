# Agent Handoff Rules

This repository is shared by Claude, Codex, and human operators. Treat the
repository files as the durable handoff layer between sessions.

## Start / Resume / Take Over

1. Read `CLAUDE.md`.
2. Read `wiki/ops/session-state.md`.
3. Check `git status --short --untracked-files=no` and the relevant diffs.
4. Before starting or continuing a non-trivial task, check whether an existing
   tmux pane for this repo/task could be a live handoff source:
   `tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} active=#{pane_active} current=#{pane_current_command} cwd=#{pane_current_path} title=#{pane_title}'`
   then `tmux capture-pane -p -t <target-pane> -S -160`.
   If both tmux pane context and `wiki/ops/session-state.md` are possible, or
   the correct basis is unclear, ask the user which handoff source to follow
   before proceeding. Do not choose the basis by inference unless the user
   explicitly names it or only one source is available.
5. When working under a subdirectory, read any local `AGENTS.md` or `CLAUDE.md`
   there before editing.

## During Work

- Do not revert unrelated user changes.
- Keep edits scoped to the requested task and existing project patterns.
- Keep `wiki/ops/session-state.md` current enough that another agent can resume
  within 30 seconds even if control transfers mid-task.
- Update `wiki/ops/session-state.md` at every handoff boundary: before stopping,
  before switching to a new task, after materially changing direction, after a
  meaningful implementation chunk, and whenever you have created uncommitted
  changes that another agent may need to interpret.
- When Codex/Claude continues from tmux or from `session-state.md`, record the
  user-confirmed handoff basis, the pane id inspected if any, and the interpreted
  next action in `wiki/ops/session-state.md`.
- If implementation changes behavior, update the relevant `wiki/` page.

## Before Reporting Done

1. Run the relevant test, build, or E2E command for the touched surface.
2. Record verification, blockers, deployment status, and next steps in
   `wiki/ops/session-state.md`.
3. If handing control back to an existing tmux Claude/Codex session, make sure
   `wiki/ops/session-state.md` is sufficient for that session to resume without
   relying on this chat transcript.
4. If you started a fresh task in Codex and Claude may later continue it, record
   the current task, files touched, tests run or still needed, and the exact next
   action before reporting.
5. Report what changed, what was verified, and anything still blocked.
