# OSMU v9 Wireframe 01: Home, Source, Accounts

> STAMP: created_at=2026-08-05 05:28 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=https://support.buffer.com/article/961-using-post-groups-in-buffer | deliberation=첫 viewport에서 가치와 첫 행동을 이해하고 원문과 정확한 계정까지 자연스럽게 이어지는 구조

## 홈 1024

```text
┌───────────────┬──────────────────────────────────────────────────────────────┐
│ Marketing Hub │ 원문 하나로 세 채널 발행을 끝내세요                        │
│ 성과          │ Threads, Instagram Feed, X 초안을 만들고 검수해             │
│ OSMU Studio   │ 계정마다 한 번씩 발행합니다                                 │
│ 승인 인박스   │                                                              │
│ 발행 캘린더   │ [새 OSMU 작업] [최근 결과 보기]                             │
│ ...           ├──────────────────────────────────────────────────────────────┤
│ Settings      │ 1 원문  ->  3 초안  ->  최종 검수  ->  한곳에서 결과        │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

- H1, 설명, primary CTA가 첫 viewport에 있음
- Sidebar 26개 구조 보존
- 새 메뉴 그룹 0
- 최근 작업 카드에는 제목, 채널 수, 상태, 결과 보기

## 원문

```text
1 원문  2 계정  3 초안  4 검수  5 발행

[직접 작성] [가져오기]
제목        팀 운영 자동화 체크리스트
원문        반복 업무를 자동화하기 전에...
핵심 메시지 실패 시 돌아올 지점을 먼저 만든다
링크        선택
이미지      선택

[홈으로]                                      [계정 선택으로]
```

- 50자 미만은 다음 단계 disabled
- URL/문서/붙여넣기 가져오기
- 자동 저장 문구
- 로딩 indicator 없음

## 계정

```text
Threads          @openclaw_lab          준비됨
Instagram Feed   @openclaw.official     준비됨
X                @openclaw_ops          준비 확인 필요
                                         [설정에서 확인]

[원문으로]                         [준비된 2개 계정 초안 만들기]
```

- exact account name 우선
- X disabled, 제외하면 count 2로 변경
- wrong-account는 expected/connected 병치

## 390

- Sidebar는 상단 가로 메뉴
- H1, 설명, CTA는 첫 viewport
- account cards 1열
- 모든 CTA 44px 이상

## Red-team과 셀프심문

**공격:** 홈에서 단계 수가 많아 보이면 어렵게 느낀다.

**수정:** 4개 결과 중심 요약만 보이고 상세 stepper는 작업 시작 뒤 표시한다.

**이게 틀렸다면 가장 그럴듯한 이유는?** 첫 화면의 `한 번씩`이 기술적 표현처럼 들릴 수 있다. `중복 없이`보다 사용자가 이해하기 쉬운 `계정마다 한 번씩`을 유지한다.

SOURCES: DESIGN.md | docs/user-flow.md | https://support.buffer.com/article/961-using-post-groups-in-buffer

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, responsive first-action layout | design-review, value clarity and account safety

SKILLS_SKIPPED: 없음
