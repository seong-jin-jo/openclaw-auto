# Wireframe 01: 공통 채널 IA

## 목적

Threads와 Instagram이 서로 다른 제품처럼 보이던 문제를 없애고, 고객이 어느 채널에서도 `연결 > 사실 > 초안 > 검수 > 발행`의 같은 위치를 이해하게 한다.

## 데스크톱 1024

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ OSMU                채널 관리                              김민서    설정   │
├──────────────┬──────────────────────────────────────────┬───────────────────┤
│ 채널         │ 채널 연결 > 브랜드 사실 > 초안 > 검수 > 발행              │
│              │                                          │ 이번 발행 근거    │
│ Threads      │ Threads                                   │ 계정: 미확인      │
│ 확인 필요    │ 사업용 계정을 확인하면 첫 글을 만들 수 있어요             │ 사실: 0개         │
│              │                                          │ 승인: 없음        │
│ Instagram    │ [Threads 계정 연결하기]                   │ 원문: 없음        │
│ 상태 확인    │                                          │                   │
│              │ Instagram                                │                   │
│              │ 연결 상태를 다시 확인해 주세요           │                   │
│              │ [Instagram 상태 확인하기]                 │                   │
├──────────────┴──────────────────────────────────────────┴───────────────────┤
│ 내 데이터는 이 작업공간 안에서만 보여요                         [확인 방법] │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 모바일 390

```text
┌──────────────────────────────┐
│ OSMU                 설정    │
│ Threads  Instagram           │
│ 연결 > 사실 > 초안 > 검수 > 발행 │
├──────────────────────────────┤
│ Threads                      │
│ 사업용 계정을 확인하면       │
│ 첫 글을 만들 수 있어요       │
│                              │
│ [Threads 계정 연결하기]      │
│                              │
│ 이번 발행 근거               │
│ 계정 미확인 · 사실 0 · 원문 없음 │
└──────────────────────────────┘
```

## 요소

- 채널 레일: provider 아이콘은 보조 식별자다. 채널명, account handle, 상태 텍스트가 항상 함께 있다.
- 단계 표시: 현재 1개, 완료, 잠김을 색과 텍스트로 구분한다.
- 작업 캔버스: 현재 결정의 제목, 결과 설명, 주 CTA 1개를 둔다.
- 증거 레일: 계정, 사실, 승인, 원문을 순서대로 누적한다.
- Settings 진입: `/settings/channels`에서도 같은 상태와 마지막 확인 시각을 보여야 한다.

## 상태

| 상태 | 캔버스 | 증거 레일 | CTA |
|---|---|---|---|
| empty | 연결 필요 설명 | 모두 미확인 | Threads 계정 연결하기 |
| loading | 채널 상태를 불러오는 skeleton | 기존 확인 증거는 유지 | disabled |
| error | 채널별 오류와 소유자 | 마지막 성공 증거와 현재 오류 병기 | 해당 채널 상태 다시 확인하기 |
| reconnect | 저장 handle과 확인 불가를 함께 표시 | handle stale 표시 | Threads 상태 다시 확인하기 |
| success | 다음 단계가 또렷함 | 확인된 증거 | 브랜드 사실 확인하기 |

## 인터랙션

- 채널 선택은 현재 단계와 초안을 보존한 채 context만 바꾼다.
- 잠긴 단계를 누르면 잠금 이유와 해소 CTA를 inline으로 보여준다.
- 증거 레일 항목을 누르면 그 증거를 만든 단계로 돌아간다.
- 모바일 증거 요약은 기본 접힘이지만 검수와 발행 단계에서는 자동으로 열린다.

---

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-02 21:26 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SOURCES: PRD v2.4.0, `DESIGN.md` §8, Buffer channel connection help, Postiz provider overview

MODEL: `gpt-codex/gpt-5.6-sol`

RUBRIC_SCORE: completeness=5/5 states=5/5 responsive=5/5 clarity=5/5 slop=5/5 total=25/25

WEAKEST_LINE: Instagram R1은 연결 상태까지만 포함돼 단계 표시의 이후 단계가 disabled 설명을 필요로 한다.

SKILLS_USED: design-consultation, design-shotgun, design-html, design-review / SKILLS_SKIPPED: 없음
