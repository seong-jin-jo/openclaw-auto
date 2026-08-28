# OSMU v7 Wireframe 02: Initial Bet Studio to Result

> STAMP: created_at=2026-08-05 02:04 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=https://support.buffer.com/article/961-using-post-groups-in-buffer, https://support.buffer.com/article/665-managing-and-approving-draft-posts | deliberation=원본 1건과 세 계정 결과를 가장 적은 조작으로 연결하되 현재 구현처럼 보이지 않게 하는 방법

## 목적

Threads, Instagram Feed, X만 대상으로 승인 원본 1건, 계정별 변형, dispatch reservation, 실제 외부 결과를 연결한다.

## Studio: Desktop 1024

```text
┌──────────────┬───────────────────────────────────────────────────────────────┐
│ Sidebar      │ Studio                                      현재 구현         │
│ 26 links     │ queue JSON과 source는 아직 자동 연결되지 않습니다             │
│              ├───────────────────────────────────────────────────────────────┤
│              │ 승인 원본                                                   │
│              │ "이번 주 팀 운영 자동화 체크리스트"                        │
│              │ provenance: Inbox import · approved by SJ                    │
│              ├───────────────────────────────────────────────────────────────┤
│              │ 마이그레이션 후 · Initial 3                                 │
│              │ [✓] Threads @openclaw_lab        READY                       │
│              │     변형: 대화형 첫 문장과 링크                              │
│              │ [✓] Instagram Feed @openclaw.official READY                  │
│              │     변형: 4:5 이미지와 짧은 캡션                             │
│              │ [ ] X @openclaw_ops               PROBE BLOCKED              │
│              │     [Settings에서 복구]                                      │
│              ├───────────────────────────────────────────────────────────────┤
│              │ [예약]                         [준비된 2개 계정에 발행]       │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

### 요소

- current TruthBoundaryBanner
- SourceCard: 본문, provenance, 승인자, 현재 authority
- AccountTargetRow 3개: exact account identity, readiness, variant summary
- X probe blocked 상태와 Settings 복구
- secondary `예약`, primary `N개 계정에 발행`

### 발행 상태 전환

```text
ready
  -> reservation-checking
  -> reserved per provider/account
  -> in-progress
  -> result group
       -> all-success
       -> partial
       -> reconciling
       -> retry-failed-only
```

- `reservation-checking`: CTA 잠금, spinner, `중복 요청을 확인하고 있습니다`
- `reserved`: reservation ID를 meta로 표시, 성공으로 색칠하지 않음
- `partial`: 성공 2, 확인 필요 1을 숫자로 표시
- `reconciling`: 외부 lookup 중, 재발행 CTA 없음
- `retry-failed-only`: 성공 row 잠금, 실패 row만 선택

## Result group

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ 결과 그룹 · source src_0241                           부분 성공              │
│ 3개 중 2개 확인 · 1개 reconciliation 중                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ Threads · @openclaw_lab                 발행됨                               │
│ 실제 permalink                                  [게시물 열기]                │
├──────────────────────────────────────────────────────────────────────────────┤
│ Instagram Feed · @openclaw.official     발행됨                               │
│ external ID ig_981 · 링크 없음                   [ID 복사] [다시 확인]       │
├──────────────────────────────────────────────────────────────────────────────┤
│ X · @openclaw_ops                       결과 확인 중                         │
│ 응답 timeout · 외부 side effect 확인 전            [reconciliation 보기]    │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Calendar로]                         [실패 항목만 재시도 · 현재 비활성]      │
│ 보편 retry primitive가 연결된 뒤 사용할 수 있습니다                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### permalink 규칙

- 실제 permalink가 있으면 `게시물 열기`
- external ID만 있으면 ID와 `링크 없음`
- 처리 중이면 link area 자체를 만들지 않음
- provider 홈 링크 fallback 금지

## Mobile 390

- SourceCard 뒤에 AccountTargetRow를 세로로 배치한다.
- account identity를 provider보다 먼저 읽게 한다.
- 하단 CTA는 sticky가 아니라 본문 흐름 안에 두며 각 48px 높이다.
- Result row마다 status, account, actual result, actions 순으로 쌓는다.

## Empty/error/loading

| 상태 | 화면 | 탈출 |
|---|---|---|
| source empty | 새 원본 작성, Inbox에서 가져오기 | Studio compose, Inbox |
| account loading | readiness 확인 중 | 취소, Settings |
| variant invalid | 해당 row만 오류 | 수정, provider 제외 |
| reservation timeout | 결과 확인 중 | Calendar, 다시 확인 |
| partial | 성공 row 잠금 | reconciliation, failed-only retry |
| no retry primitive | CTA 비활성 | 운영 복구, Settings |

## 레드팀과 셀프심문

**공격:** `준비된 2개 계정에 발행`은 사용자가 원래 선택한 3개 중 X가 빠졌다는 사실을 놓치게 한다.

**수정:** CTA 바로 위에 제외된 계정과 이유를 한 줄로 반복하고, 카운트가 변경되면 사용자 확인을 다시 받는다.

**이게 틀렸다면 가장 그럴듯한 이유는?** provider별 UI 차이를 카드 3개로 단순화해 Instagram의 미디어 조건이나 X의 제약을 충분히 드러내지 못했을 수 있다. 이를 막기 위해 variant validation을 row 단위로 두고, 공통 원본과 provider constraints를 분리했다.

## 회수 필요

- 회수 필요: atomic reservation API와 schema
- 회수 필요: 실제 result group persistence와 retry contract

SOURCES: DESIGN.md | docs/user-flow.md | docs/openclaw-auto-osmu-prd-v4.1.2-gpt-codex.md | dashboard/src/app/studio/page.tsx | dashboard/src/components/channels/SchedulePanel.tsx | dashboard/src/app/api/publish/route.ts | dashboard/src/app/api/schedule/publish-due/route.ts | https://support.buffer.com/article/961-using-post-groups-in-buffer | https://support.buffer.com/article/665-managing-and-approving-draft-posts

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, source-variant-result 화면 구조 | design-review, 상태 명료성 및 모바일 타깃 검수

SKILLS_SKIPPED: 없음
