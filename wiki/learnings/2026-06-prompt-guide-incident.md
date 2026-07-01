# Learnings: prompt-guide 미독 사고 — 테넌트 마케팅 진실을 wiki에서만 찾다 3회 격노 (박제 2026-07-02)

**Date**: 2026-07-02 (사고 발생: 2026-06월 중, 3회 반복)
**Context**: wiki-track 전수감사에서 "교훈이 시스템에 박제되지 않은 채 사람 머릿속에만 있음"을 발견해 소급 기록.
**Category**: `[ssot-miss]` count:3 — 3-strike 도달, 규칙 승격 대상.

## 사고 요약

에이전트 세션이 테넌트 마케팅 콘텐츠(톤·브랜드 사실)를 생성할 때 **postAGI wiki 마케팅팀 문서만 읽고 `data-{tenant}/prompt-guide.txt`를 읽지 않아**, 실제 운영 톤과 어긋난 산출물이 나왔고 CEO가 같은 지적을 **3회 반복**했다.

## 근본 원인 (RCA)

1. 이 레포의 지식이 **3원 SSOT**로 나뉘어 있는데(아래 라우팅), 그 분할이 어디에도 명문화되지 않았음.
2. `prompt-guide.txt`는 wiki 어디에서도 "필독 진실"로 선언되지 않아 wiki만 읽은 세션에겐 투명인간.
3. 교훈이 반복돼도 learnings/에 기록·카운트되지 않아 규칙으로 승격될 경로 자체가 없었음.

## 3원 SSOT 라우팅 (이 사고의 교정 — 상세: `wiki/reference/ssot-routing.md`)

| 지식 | SSOT | 강제 |
|---|---|---|
| 빌드 스펙 (기능·API·UI 계약) | `docs/` (feature-spec, ui-rules, channel-ui-spec, USERFLOW) | PR 템플릿 + CODEOWNERS + CI |
| 사업 지식 (아키텍처·결정·교훈·운영) | `wiki/` | Stop hook 상기 |
| **테넌트 마케팅 진실 (톤·브랜드 사실)** | **`data-{tenant}/prompt-guide.txt`** (템플릿: `data/templates/`) | ← 이번 승격 대상 |

## 규칙 (즉시 적용)

**테넌트 콘텐츠 생성·검수·발행 작업은 시작 전에 해당 `data-{tenant}/prompt-guide.txt`를 반드시 읽는다.** postAGI wiki 마케팅 문서는 배경 맥락이지 런타임 진실이 아니다.

## 승격 경로 (3-strike)

count:3 도달 → 위키 트랙 Phase 2~3에서 pre-ship/콘텐츠 생성 훅("prompt-guide 읽음 확인")으로 이빨화 제안 예정. 이빨 부여는 회장 전결.
