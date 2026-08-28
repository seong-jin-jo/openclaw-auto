# Wiki Maintenance Guide

## 현행 운영 규칙

- 행동 변경 뒤 관련 `wiki/` 문서를 같은 작업에서 갱신한다.
- 현재 세션 인계는 라인별 `session-state.osmu.md`와 `session-state.studio.md`에 최신순으로 기록한다. `wiki/3-operations/session-state.md`는 과거 장기 이력이다.
- 제품 산출물 승인과 위키 갱신은 Stage Controller 단계·게이트를 따른다.
- `/document-generate`와 `/learn`은 선택 도구이며 필수 진입점이 아니다.

This wiki/ is the living knowledge base for the project. Treat it with the same rigor as production code.

## Daily / Per-Session Habits (gstack)
- Before any work: `Load gstack. Read relevant sections of wiki/`.
- After any significant change: update the corresponding wiki page + add to learnings/ if it's a pattern/pitfall.
- Use `/document-generate` (gstack) when creating new reference material.

## When to Create / Update
- 새 아키텍처 결정: `3-operations/decisions/`.
- 새 기능 영역: `2-product/build/`과 `5-hubs/hub-eng/architecture/`.
- 절차 변경: `3-operations/guides/`과 이 문서.
- 배포·사고에서 얻은 교훈: `4-reference/learnings/`.
- 환경·명령 변경: `4-reference/`과 `3-operations/runbooks/`.

## Structure Rules
- 모든 카테고리 폴더는 `_index.md`를 가진다. 루트만 `index.md`다.
- 1단 구조는 `0-meta / 1-team-brand / 2-product / 3-operations / 4-reference / 5-hubs`로 고정한다.
- Link aggressively (relative paths).
- Keep service-neutral.

## Migration from Legacy
- CLAUDE.md and docs/ are being consolidated here.
- Keep short "see wiki/xxx" pointers in legacy files during transition.
- Goal: CLAUDE.md becomes thin pointer + high-level architecture; details live in wiki/.

## Quality Bar
- Accurate (every claim traceable to code or decision).
- Discoverable (index + links).
- gstack-readable (clear headings, code blocks, lists).

## Tools
- gstack /learn → learnings/
- gstack /document-generate → new pages
- grep + editor for search

Maintaining this wiki is how we scale knowledge alongside the product to support 1,000+ paying startup customers.
