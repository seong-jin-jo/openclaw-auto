# OSMU v8 Wireframe 03: Repo Evidence, Preservation Appendix, AC28 RTM

> STAMP: created_at=2026-08-05 04:51 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code | deliberation=local code fidelity는 지키되 운영 IA로 승격하지 않고 AC28을 3층 provenance에 결선하는 방법

## Repo evidence screen

```text
REPO IMPLEMENTED · PROD UNVERIFIED
local HEAD a7b2b435e7ea · deployed revision unknown

Feature             File/line                     Commit          Prod
OSMU generation     studio/page.tsx:190-231       a10b2145b       unverified
AI auto draft       studio/page.tsx:233-249       e570442e        unverified
Save                studio/page.tsx:250-266,413   0a50063c/aa...  unverified
Publish             studio/page.tsx:278-330,414   aa.../ea...     unverified
Schedule            studio/page.tsx:415,469-475   aa.../e570...   unverified
```

commit `aa368e67`은 2026-06-23 snapshot에 control이 존재한다는 증거다. 배포 증거가 아니다.

## Local code preservation appendix

| Local inventory | Count | Evidence layer |
|---|---:|---|
| Sidebar items | 26 | REPO · PROD UNVERIFIED |
| App routes | 24 | REPO · PROD UNVERIFIED |
| Threads tabs | 5 | REPO · PROD UNVERIFIED |
| Instagram tabs | 3 | REPO · PROD UNVERIFIED |
| Settings tabs | 9 | REPO · PROD UNVERIFIED |
| Text providers | 8 | REPO · PROD UNVERIFIED |
| Studio direct targets | 4 | REPO · PROD UNVERIFIED |
| Studio preview targets | 7 | REPO · PROD UNVERIFIED |
| Video routes | 3 | REPO · PROD UNVERIFIED |
| Root extensions | 15 | REPO · PROD UNVERIFIED |

이 appendix는 build orphan 방지용이다. 고객이 본 IA나 기능 습관의 근거가 아니다.

## AC28 provenance RTM

| AC | View/state | Layer |
|---:|---|---|
| 01 | repo inventory counts | REPO |
| 02 | local preservation appendix | REPO |
| 03 | Initial 3 readiness contract | TARGET |
| 04 | extension15 inventory | REPO |
| 05 | OAuth concurrent20 | TARGET |
| 06 | exact identity | TARGET |
| 07 | wrong-account block | TARGET |
| 08 | source provenance | TARGET |
| 09 | integration entry/bridge | PROD missing + TARGET |
| 10 | migration M0-M8 | TARGET |
| 11 | reverse replay | TARGET |
| 12 | independent variants | TARGET |
| 13 | dispatch concurrency20 | TARGET |
| 14 | persistence repair | TARGET |
| 15 | reconciliation | TARGET |
| 16 | result group | TARGET |
| 17 | failed-only retry | TARGET |
| 18 | fake permalink 0 | TARGET |
| 19 | video processing code inventory | REPO |
| 20 | video result parity gap | REPO + TARGET gap |
| 21 | video readiness | TARGET boundary |
| 22 | extension disposition | TARGET boundary |
| 23 | revoke/incident | TARGET |
| 24 | isolation/privacy | TARGET |
| 25 | F4 cohort | TARGET blocked |
| 26 | artifact RTM | DESIGN QA |
| 27 | F4 data rights | TARGET gap |
| 28 | circuit breaker 1679/1680/1681 | TARGET |

RTM_COUNTS: AC=28 | mapped=28 | orphan=0 | prod-claim-without-evidence=0

## Prototype selector plan

| Selector | Expected |
|---|---:|
| `[data-layer="prod"]` | 1+ |
| `[data-prod-observation]` | 0 |
| `[data-repo-feature]` | 5 |
| `[data-local-sidebar]` | 26 |
| `[data-local-route]` | 24 |
| `[data-local-settings-tab]` | 9 |
| `[data-ac]` | 28 |
| `[data-live-claim]` | 0 |
| touch target below 44px | 0 |
| console errors | 0 |

## Red-team과 셀프심문

**공격:** local preservation counts가 크고 화려하면 PROD NONE보다 더 강한 인상을 준다.

**수정:** Appendix에만 배치하고 모든 count cell에 PROD UNVERIFIED label을 반복한다.

**이게 틀렸다면 가장 그럴듯한 이유는?** AC를 TARGET에 매핑했지만 implementation test evidence로 오인할 수 있다. 이 RTM은 design view/state coverage이며 build/QA evidence가 아니다.

SOURCES: DESIGN.md | docs/user-flow.md | docs/openclaw-auto-osmu-prd-v4.1.2-gpt-codex.md | dashboard/src/app/studio/page.tsx:190-330,398-475 | dashboard/src/components/layout/Sidebar.tsx:293-483 | dashboard/src/app/settings/page.tsx:23-43 | git commits aa368e67,a10b2145b,e570442e,0a50063c,ea88094e | https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, selector-driven evidence hub | design-review, provenance and RTM audit

SKILLS_SKIPPED: 없음
