# Contributing & Development Workflow

> 현재 기본 절차: 기획 → 디자인 → 기술설계 → 개발 → QA → 배포. `/pipeline`으로 단계를 확인하고 `/approve`가 증거를 재검증한 뒤에만 다음 게이트로 넘어간다. 아래 gstack 명령은 승인된 단계 안의 보조 도구다.

## Golden Rule (gstack-enforced)
**Before touching any code or major docs**:
1. `wiki/index.md`, 해당 라인의 `session-state.*.md`, `pipeline-state.*.md`를 읽는다.
2. 관련 승인 산출물과 직무 허브를 읽는다.
3. 현재 단계 안에서 필요한 리뷰·구현·QA 절차를 실행한다.

## Getting Started
1. Clone with submodules: `git clone --recurse-submodules ...`
2. Copy examples: `.env.example`, `config/*.example`, `data/*.example`.
3. `cd dashboard && npm ci && npm run build`
4. Copy extensions to openclaw/extensions/.
5. `docker compose up -d --build`

## gstack Team Mode (already active)
- .claude/ hooks enforce gstack for AI sessions in this repo.
- Run `~/.claude/skills/gstack/bin/gstack-team-init` if needed after clone.
- Every developer: `cd ~/.claude/skills/gstack && ./setup --team`

## Code Organization
- `extensions/`: pure tool plugins (TypeScript + plugin.json). Add new channel by creating 4 files + registering.
- `dashboard/src/`: Next.js (App Router). New APIs in app/api/. UI components in components/.
- `data/`: runtime only (gitignored).
- `wiki/`: this knowledge base. Update when architecture or process changes.

## Adding a New Channel (example of gstack process)
1. /office-hours on the channel needs.
2. Plan reviews (eng for API, design for UI).
3. /autoplan.
4. Implement extension + verify-channel + guide setup + constants.
5. /review + /qa (test credential flow + publish in studio).
6. Update wiki/2-product/build/ and reference/.
7. /ship.

## Wiki Maintenance
- [Wiki maintenance](./wiki-maintenance.md)를 따른다.
- 주요 결정은 [의사결정 기록](../decisions/_index.md)에 남긴다.
- 반복 결함과 교훈은 [학습 기록](../../4-reference/learnings/_index.md)에 남긴다.

## Pull Requests & Review
- Follow gstack procedures.
- All medium+ changes require plan artifacts in decisions/ or attached to PR.
- Use gstack /review on the diff.
- For UI: gstack /qa or /design-review.

## Service Neutrality
Never commit service-specific names, URLs, or keys. Use examples and .example files.

This process lets a small team (or solo founder + AI) ship at the velocity needed to reach 1,000+ paying subscribers.
