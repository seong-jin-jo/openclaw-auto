# OSMU v9 Wireframe 03: Publish, Results, Recovery

> STAMP: created_at=2026-08-05 05:28 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code | deliberation=부분 성공과 연결 문제에서도 중복 발행 없이 다음 행동을 보여주는 결과 화면

## 진행

```text
3개 계정에 발행하고 있어요
이 화면을 닫아도 결과에서 이어서 확인할 수 있어요

Threads          처리 중
Instagram Feed   발행됨       [게시물 보기]
X                대기

[홈으로] [결과 화면에서 보기]
```

- 발행 버튼 연속 클릭: `같은 발행 요청을 이미 처리하고 있어요`
- 새 작업을 만들지 않고 진행 화면으로 이동
- loading indicator 1개

## 부분 성공 결과

```text
3개 중 2개 발행됐어요 · 1개 확인 필요

Threads          발행됨       실제 게시물 보기
Instagram Feed   발행됨       실제 게시물 보기
X                실패         연결이 만료됐어요
                               [다시 연결] [X만 다시 시도]

[새 OSMU 작업] [발행 캘린더] [홈]
```

- 성공 계정 잠금
- 실패 계정만 retry
- timeout은 `게시 여부 확인 중`
- external ID만 있으면 `링크 확인 중`

## Recovery states

| State | 안내 | 행동 |
|---|---|---|
| wrong account | 선택 계정과 연결 계정이 다름 | 다시 연결, 다른 계정 |
| X not ready | X 발행 준비 필요 | 설정, X 제외 |
| duplicate | 같은 요청 처리 중 | 진행 보기 |
| timeout | 게시 여부 확인 중 | 자동 확인, 결과 |
| partial | 2개 발행, 1개 확인 | 실패 계정만 retry |
| expired token | 연결 만료 | 다시 연결, 이어서 retry |

## Settings 지원 요약

```text
지금 지원: Threads · Instagram Feed · X
추후 지원: 영상, Facebook, Bluesky, Telegram 외
```

추후 지원 항목에는 CTA가 없다.

## Red-team과 셀프심문

**공격:** 실패 계정 retry가 primary처럼 보이면 성공보다 실패에 시선이 쏠린다.

**수정:** 결과 요약과 성공 링크를 먼저 보여주고 retry는 실패 row 안의 contextual action으로 둔다.

**이게 틀렸다면 가장 그럴듯한 이유는?** timeout과 실패를 구분해도 사용자는 기다리는 시간을 모른다. 다음 자동 확인 시각을 함께 보여준다.

SOURCES: DESIGN.md | docs/user-flow.md | https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, progress/result/recovery interactions | design-review, duplicate and dead-end audit

SKILLS_SKIPPED: 없음
