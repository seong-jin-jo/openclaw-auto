# OSMU Marketing Agent — BM v7.2.1

<!-- STAMP | created_at: 2026-08-06 18:44 KST | model: gpt-codex/gpt-5.6-sol | agent: prd-architect | skills: 없음 | evidence: PRD v7.2.1 §§13·21, v7.2 critic, Buffer official workflow | deliberation: 게시량이 아니라 검수 가능한 실행·증명·환류에 과금한다. -->

| 항목 | 값 |
|---|---|
| 버전·정본 | v7.2.1 · [PRD v7.2.1](openclaw-auto-marketing-agent-prd-v7.2.1-gpt-codex.md) |
| 상태 | 가격·WTP·원가는 pilot 전 가설 |
| 고객가치 | 근거→검수→중복 없는 실행→proof→다음 생성의 운영시간·불안 감소 |

## 목차

- [상품 가설](#상품-가설)
- [가치와 과금 경계](#가치와-과금-경계)
- [Pilot 판정](#pilot-판정)
- [운영 상한](#운영-상한)

## TL;DR

Starter·Growth·Managed 조합을 검증하되 post count만으로 과금하지 않는다. 신규 외부 pilot은 승인 필요를 기본으로 안전 증거를 만들고, 기존 workspace의 direct 정책은 명시 전환 전 유지한다.

## 상품 가설

| Tier | 포함 가치 | 아직 확정하지 않는 것 |
|---|---|---|
| Starter | workspace·account truth·grounded text root·Studio execution | 확정 가격 |
| Growth | video job·tenant API token·native8 truth·feedback lineage | usage bundle·margin |
| Managed | deployment·provider onboarding·support/SLA | enterprise SLA 수치 |

## 가치와 과금 경계

- 돈을 받는 대상은 생성 token이나 연결 로고 수가 아니라 검수 가능한 콘텐츠가 정확히 한 번 실행되고 proof·recovery·native truth로 회수되는 workflow다.
- Post count-only 과금은 spam incentive라 금지한다.
- Unsupported native metric은 숫자0으로 가치가 있는 척하지 않고 capability source·checked_at·reason·next action을 제공한다.
- Messaging은 기본 OFF인 post-review handoff이므로 원치 않는 destination 수를 과금량으로 부풀리지 않는다.

## Pilot 판정

| 지표 | Minimum/window | GO/Pivot |
|---|---|---|
| Repeat value | workspace3, 각 publication≥2/28d | ≥2/3가 loop2회; 아니면 composer/handoff 축소 |
| Terminalization | accepted≥20/28d | ≥95%; 미달이면 auto schedule OFF |
| Feedback | eligible publication≥20 | evidence-linked next change≥50% |
| Safety | continuous | prohibited event1이면 automation/cohort OFF |
| Support | workspace-week≥6/2주 | >60m이면 expansion 중단 |
| Text/video variable cost | roots≥20/jobs≥10 | text p95≤₩5k; video p95≤₩15k (unsourced hypothesis) |

신규 external cohort의 approval-required default로 첫 발행 이탈률과 support time이 악화되는지 별도 측정한다. 기존 direct workspace를 migration 실험 대상으로 조용히 전환하지 않는다.

## 운영 상한

OAuth support, factual correction, provider terminalization, metric dispute, video cost, provider-month를 기록한다. Social5 중 permanent unsupported≥3이면 “성과 환류”를 핵심 판매 문구에서 내린다. Connector 운영이 6사업 콘텐츠 시간을 잠식하면 provider expansion을 중단한다.

RUBRIC_SCORE: 완결성=5/5 정밀성=5/5 벤치마크=4/5 추적성=5/5 전문성=5/5 total=24/25
WEAKEST_LINE: 가격과 원가 상한은 외부 WTP·실원가 전 가설이다.
SKILLS_USED: 없음 — BM PRD view 전용 매칭 skill 없음
SKILLS_SKIPPED: 없음 — 매칭 skill 없음
PRESENTATION_CHECK: 툴 잔재0·목차/표 구조 확인; 최종 웹 렌더는 exit report에 기록
SOURCES: `openclaw-auto-marketing-agent-prd-v7.2.1-gpt-codex.md`; `tasks/marketing-agent-plan-critic-v7.2.output`; Buffer Scheduling/Agency; Sprout Approval.
MODEL: gpt-codex/gpt-5.6-sol
