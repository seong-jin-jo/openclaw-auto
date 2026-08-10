# OSMU v5 Wireframe 01: Marketing Hub shell

## Desktop 1024+

```text
┌──────── 224 Sidebar ────────┬──────────────────────────────────────────────────┐
│ Marketing Hub               │ OSMU / Instagram / Feed        현재 운영 [전환] │
│ 내 워크스페이스             │ @zero_to_one_ai  연결됨  01:18 확인              │
│ 성과                        ├──────────────────────────────────────────────────┤
│ OSMU Studio                 │ Queue Editor Analytics Growth Popular Settings   │
│ 승인 인박스                 ├──────────────────────────────────────────────────┤
│ 발행 캘린더                 │ Surface: [Feed] [Reels]                           │
│ OSMU                        │                                                  │
│  Threads                    │ primary workspace                   context rail │
│  Instagram                  │                                                  │
│  Facebook                   │                                                  │
│  X                          │                                                  │
│  YouTube                    │                                                  │
│  TikTok                     │                                                  │
│ Global Settings             │                                                  │
└─────────────────────────────┴──────────────────────────────────────────────────┘
```

## Mobile 390

```text
┌──────────────────────────────┐
│ Marketing Hub   OSMU   Menu  │
│ Instagram  Feed  현재 운영   │
│ @zero_to_one_ai  연결됨      │
├──────────────────────────────┤
│ Queue Editor Analytics ...   │ horizontal scroll
├──────────────────────────────┤
│ primary workspace            │
│                              │
├──────────────────────────────┤
│ 선택한 항목 검수       4개   │ sticky action, 44px+
└──────────────────────────────┘
```

## 요소

- 6 provider는 항상 노출하며 접힌 메뉴에만 의존하지 않는다.
- OSMU 식별자, provider, surface, current/target 모드, default identity가 첫 화면에 있다.
- 공통 6탭은 provider마다 이름과 순서가 같다.
- Instagram과 Facebook은 Feed/Reels surface switcher를 별도 제공한다.

## 상태와 인터랙션

- provider 클릭: 같은 탭 위치를 유지한 채 해당 provider로 전환한다.
- surface 클릭: Editor preview, validation, Settings의 발행 준비도와 콘텐츠 규칙을 함께 전환한다.
- mode 클릭: `현재 운영`과 `목표 계약`을 바꾸되 가정 배지를 고정 노출한다.
- hard stop: 상단 danger banner와 닫힌 Now/Schedule을 표시한다.
- 모바일 Menu: 6 provider와 Global Settings를 44px row로 연다.

---
🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-04 01:28 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SKILLS_USED: design-html, design-review / SKILLS_SKIPPED: 없음
SOURCES: DESIGN.md, Marketing Hub Sidebar as-built, PRD v3.1 §2·6
MODEL: `gpt-codex/gpt-5.6-sol`
RUBRIC_SCORE: 25/25
WEAKEST_LINE: 모바일 6탭은 가로 스크롤이지만 첫 탭과 다음 탭 일부를 보여 탐색 가능성을 보존한다.
