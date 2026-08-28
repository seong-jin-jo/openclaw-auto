# OSMU v8 Wireframe 02: Target Contract Journey

> STAMP: created_at=2026-08-05 04:51 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=https://support.buffer.com/article/961-using-post-groups-in-buffer, https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows | deliberation=integration entry는 잠그되 source부터 actual result까지 target interaction은 검토 가능하게 하는 법

## Screen-level boundary

모든 target screen 상단에 다음 strip을 고정한다.

```text
TARGET CONTRACT · PRD v4.1.2 · 운영 증거 아님 · integration entry 미확인
```

## Desktop 1024

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ TARGET CONTRACT                                                NOT LIVE      │
│ 관찰된 운영 진입점: 미확인                                                   │
│ URL/identity/route evidence가 들어오면 실제 entry label로 교체됩니다          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Approved source src_target_0241                                              │
│ provenance · approval snapshot · target sample data                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Threads          @openclaw_lab            READY CONTRACT                     │
│ Instagram Feed   @openclaw.official       READY CONTRACT                     │
│ X                @openclaw_ops            PROBE BLOCKED                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Reservation 확인] [Partial 결과] [OAuth 안전 상태]                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Target interaction states

| State | Visible contract | Not claimed |
|---|---|---|
| source approved | approved snapshot and provenance | 운영 DB row 존재 |
| account ready | exact identity and readiness criteria | token valid |
| reservation checking | 20 requests collapse target | atomic primitive 구현 |
| reserved | accepted1/rejected19 target | 외부 API 호출됨 |
| partial | success2/unknown1 target sample | 실제 게시물 존재 |
| reconciliation | lookup before retry | provider adapter live |
| permalink | actual URL only rule | sample URL을 actual로 표현 |

## Result group

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ TARGET SAMPLE RESULT · 외부 side effect 없음                    PARTIAL      │
│ Threads         permalink contract                         success locked    │
│ Instagram Feed  external ID only · permalink 미확인          success locked    │
│ X               timeout · side effect unknown               reconcile       │
│ [reconciliation 계약 보기] [failed-only retry · primitive 전 disabled]       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile 390

- entry blocker, source, account rows, result rows를 stack한다.
- account identity를 provider보다 먼저 읽게 한다.
- 44px target buttons
- screen strip은 두 줄까지 허용하되 숨기지 않는다.

## Red-team과 셀프심문

**공격:** target sample의 realistic account name이 실제 연결 계정처럼 보일 수 있다.

**수정:** 모든 sample identity에 `TARGET SAMPLE` prefix를 붙이고 screen strip을 sticky하게 유지한다.

**이게 틀렸다면 가장 그럴듯한 이유는?** target flow가 integration entry와 분리되어 실제 IA 판단을 못 할 수 있다. 운영 evidence 확보 즉시 entry mapping loop를 다시 열어야 한다.

## 회수 필요

- 회수 필요: 운영 entry mapping
- 회수 필요: source/result/retry API/schema
- 회수 필요: atomic reservation

SOURCES: DESIGN.md | docs/user-flow.md | docs/openclaw-auto-osmu-prd-v4.1.2-gpt-codex.md | https://support.buffer.com/article/961-using-post-groups-in-buffer | https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, target journey and mobile stack | design-review, not-live clarity and recovery actions

SKILLS_SKIPPED: 없음
