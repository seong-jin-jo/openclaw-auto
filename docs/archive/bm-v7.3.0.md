# OSMU Marketing Agent — BM v7.3.0

<!-- STAMP | created_at: 2026-08-07 12:58 KST | model: gpt-codex/gpt-5.6-sol | agent: prd-architect | skills: brand-positioning-kit, openclaw-creative-brief | evidence: PRD v7.3.0 §§8.5·13·21, v18 audits, HubSpot/Jasper/Buffer official workflows | deliberation: 게시량이 아니라 승인된 캠페인을 증명·보고·다음 실험까지 닫는 운영가치에 과금한다. -->

| 항목 | 값 |
|---|---|
| 버전·정본 | v7.3.0 · [PRD v7.3.0](openclaw-auto-marketing-agent-prd-v7.3.0-gpt-codex.md) |
| 상태 | 가격·WTP·원가는 pilot 전 가설 |
| 고객가치 | 업무위임→근거→승인 캠페인→중복 없는 실행→proof/report→다음 실험의 PM 시간·불안 감소 |

## 목차

- [상품 가설](#상품-가설)
- [가치와 과금 경계](#가치와-과금-경계)
- [Pilot 판정](#pilot-판정)
- [운영 상한](#운영-상한)

## TL;DR

Starter·Campaign·Managed 조합을 검증하되 post count만으로 과금하지 않는다. 돈을 받는 단위는 무한 생성이 아니라 승인된 캠페인이 납품·발행 증거·성과 보고·다음 실험까지 닫히는 운영 결과다.

## 상품 가설

| Tier | 포함 가치 | 아직 확정하지 않는 것 |
|---|---|---|
| Starter | workspace·source5·approved brand guide·빠른 1회 게시·account truth | 확정 가격 |
| Campaign | customer work order·research·approved brief·text/photo-card/video·revision·proof·report·next experiment | 캠페인 quota·WTP·margin |
| Managed | provider onboarding·운영자 지원·배포·SLA | enterprise SLA 수치 |

## 가치와 과금 경계

- 돈을 받는 대상은 생성 token이나 연결 로고 수가 아니라 검수 가능한 콘텐츠가 정확히 한 번 실행되고 proof·recovery·native truth로 회수되는 workflow다.
- Post count-only 과금은 spam incentive라 금지한다.
- Unsupported native metric은 숫자0으로 가치가 있는 척하지 않고 capability source·checked_at·reason·next action을 제공한다.
- Messaging은 기본 OFF인 post-review handoff이므로 원치 않는 destination 수를 과금량으로 부풀리지 않는다.
- `유료 집행 없음`은 정상 budget disposition이다. 제품이 광고비를 자동 집행하거나 budget 입력만으로 billing/ad API를 호출하지 않는다.
- 고객 원본·브랜드 자료·최종 결과물 권리를 가져가는 BM은 금지한다. workspace는 승인 version과 운영 이력만 정본 관리한다.

## Pilot 판정

| 지표 | Minimum/window | GO/Pivot |
|---|---|---|
| Repeat value | workspace3, 각 publication≥2/28d | ≥2/3가 loop2회; 아니면 composer/handoff 축소 |
| Terminalization | accepted≥20/28d | ≥95%; 미달이면 auto schedule OFF |
| Feedback | eligible publication≥20 | evidence-linked next change≥50% |
| Safety | continuous | prohibited event1이면 automation/cohort OFF |
| Support | workspace-week≥6/2주 | >60m이면 expansion 중단 |
| Text/video variable cost | roots≥20/jobs≥10 | text p95≤₩5k; video p95≤₩15k (unsourced hypothesis) |
| Campaign closure | approved campaign≥6 | ≥80%가 due date 내 proof/report/next decision까지 terminal; 미달이면 Managed 약속 축소 |
| Brief approval lead time | approved campaign≥6 | median≤2영업일; 반복 보완>2회면 intake/가격 재설계 |

신규 external cohort의 approval-required default로 첫 발행 이탈률과 support time이 악화되는지 별도 측정한다. 기존 direct workspace를 migration 실험 대상으로 조용히 전환하지 않는다.

## 운영 상한

OAuth support, source import/sync recovery, brand-guide 충돌, brief 보완, revision 회차, provider terminalization, metric dispute, video cost, provider-month를 기록한다. Support>60m/workspace-week, campaign 평균 revision>3, source conflict 미해결>1영업일이면 Managed capacity·가격·scope를 다시 정한다. Social5 중 permanent unsupported≥3이면 “성과 환류”를 핵심 판매 문구에서 내리고 connector expansion을 중단한다.

RUBRIC_SCORE: 완결성=5/5 정밀성=5/5 벤치마크=4/5 추적성=5/5 전문성=5/5 total=24/25
WEAKEST_LINE: 가격과 원가 상한은 외부 WTP·실원가 전 가설이다.
SKILLS_USED: brand-positioning-kit — 가치·금기·고객 소유권 / openclaw-creative-brief — campaign deliverable·운영 단위
SKILLS_SKIPPED: 없음
PRESENTATION_CHECK: 툴 잔재0·목차/표 구조 확인; 최종 웹 렌더는 exit report에 기록
SOURCES: `openclaw-auto-marketing-agent-prd-v7.3.0-gpt-codex.md`; v18 blueprint/completeness audit; HubSpot Campaigns; Jasper IQ/Brand Voice; Buffer Agency; Sprout Approval.
MODEL: gpt-codex/gpt-5.6-sol
