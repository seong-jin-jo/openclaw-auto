# OSMU v8 Wireframe 01: Provenance Gate

> STAMP: created_at=2026-08-05 04:51 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=https://support.buffer.com/article/961-using-post-groups-in-buffer | deliberation=운영 화면을 보지 못한 세션이 local code를 live product로 승격하지 못하게 하는 첫 화면

## Desktop 1024

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ OSMU v8 DESIGN QA        [PROD] [REPO] [TARGET] [RECOVERY] [LOCAL APPENDIX]  │
├──────────────────────────────────────────────────────────────────────────────┤
│ PROD OBSERVED                                                  NONE          │
│ 운영 화면을 직접 관찰한 증거가 없습니다                                      │
│ Studio, Publish, Sidebar, route 노출을 운영 사실로 주장하지 않습니다          │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ 필요한 evidence bundle       │ 이번 세션                                    │
│ deployment URL               │ missing                                      │
│ customer identity            │ missing                                      │
│ timestamp                    │ missing                                      │
│ 1024 screenshot/DOM route    │ missing                                      │
│ 390 screenshot/DOM route     │ missing                                      │
│ deployed revision            │ missing                                      │
├───────────────────────────────┴──────────────────────────────────────────────┤
│ [로컬 코드 증거 보기] [목표 계약 미리보기] [증거 요건 보기]                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 요소

- 제품 내비게이션과 분리된 DESIGN QA toolbar
- PROD OBSERVED layer badge
- claim blocker: `NONE · UNVERIFIED`
- evidence bundle 6필드
- repo evidence와 target preview의 안전한 exit
- 운영 기능 CTA 0

### 상태

- `missing`: 모든 운영 claim 차단
- `checking`: 승인 URL/identity를 관찰 중, claim 차단 유지
- `complete`: URL/identity/timestamp/viewport/deployed revision이 모두 있을 때만 mapping 허용
- `stale`: timestamp/deploy mismatch, 재관찰

### Interactions

- `로컬 코드 증거 보기`: REPO screen, side effect 0
- `목표 계약 미리보기`: TARGET screen, screen strip 유지
- `증거 요건 보기`: 각 필드의 accepted evidence 설명
- product route를 열거나 흉내 내는 action 없음

## Mobile 390

```text
┌──────────────────────────────┐
│ DESIGN QA: PROD/REPO/TARGET  │
├──────────────────────────────┤
│ PROD OBSERVED                │
│ NONE · UNVERIFIED            │
│ 운영 화면 증거 없음          │
├──────────────────────────────┤
│ URL                 missing  │
│ identity            missing  │
│ timestamp           missing  │
│ 1024/390             missing  │
│ deploy revision      missing  │
├──────────────────────────────┤
│ [로컬 코드 증거]             │
│ [목표 계약 미리보기]         │
└──────────────────────────────┘
```

## Red-team과 셀프심문

**공격:** empty evidence screen은 아무 일도 못 하는 오류 화면처럼 보인다.

**수정:** 증거 없이 가능한 두 작업인 local code audit와 target contract review를 명확히 열었다.

**이게 틀렸다면 가장 그럴듯한 이유는?** 운영 담당자가 이미 URL을 알고 있는데 입력 friction이 과할 수 있다. 하지만 배포 주장은 비용이 크므로 evidence bundle을 생략하지 않는다.

SOURCES: DESIGN.md | docs/user-flow.md | dashboard/src/app/studio/page.tsx | https://support.buffer.com/article/961-using-post-groups-in-buffer

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, responsive evidence gate | design-review, claim integrity and empty/error paths

SKILLS_SKIPPED: 없음
