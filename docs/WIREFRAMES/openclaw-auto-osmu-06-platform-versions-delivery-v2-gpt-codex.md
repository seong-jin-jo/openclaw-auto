# 플랫폼별 버전과 발행 분기 wireframe v2

## Desktop 1024

```text
┌ 플랫폼별 초안 / 8월 1:1 상담 일정                          저장됨 ┐
├ 원문과 작성 기준 ────────┬ 플랫폼별 버전 ────────────────────┤
│ 원문                      │ Threads @minseo_money  사용 가능    │
│ 8월 상담 일정을 열었어요   │ [본문 편집]  73 / 500               │
│                           │ [검수하기]                           │
│ 내 브랜드 정보            ├─────────────────────────────────────┤
│ 상담은 50분               │ Instagram @minseo_studio 연결됨     │
│                           │ 피드 초안과 미리보기                 │
│ 콘텐츠 작성 기준          │ 이미지 자동 발행은 다음 지원 범위    │
│ 차분하고 구체적으로        │ [초안 저장]                          │
└───────────────────────────┴─────────────────────────────────────┘

검수 후 delivery sheet:

┌ 어떻게 보낼까요? ─────────────────────────────────────────────┐
│ 지금 발행                                                     │
│ 검수한 Threads 버전을 바로 보냅니다. [지금 발행하기]           │
│                                                               │
│ 예약                                                          │
│ 2026-08-03 20:00 KST [예약 확정하기]                           │
│ Queue와 캘린더에 표시됩니다.                                   │
└───────────────────────────────────────────────────────────────┘
```

## Mobile 390

- 원문과 작성 기준은 접히지 않고 요약 3줄로 먼저 표시.
- Threads가 첫 platform lane이며 편집과 검수 CTA를 화면 하단에 둔다.
- Instagram은 다음 lane으로 이어지고 `연결됨`, `초안 가능`, `자동 발행 준비 중`을 분리 표시.
- delivery는 bottom sheet가 아니라 별도 화면으로 열어 지금 발행과 예약을 같은 무게로 비교.

## 상태와 복구

| 상태 | 표시 | 행동 |
|---|---|---|
| loading | 선택한 platform preview만 skeleton | 생성 취소, 원문 보기 |
| empty | 원문과 플랫폼 선택 유지 | Threads 버전 만들기 |
| error | 실패한 플랫폼 lane만 오류 | 같은 원문으로 다시 만들기, 직접 쓰기 |
| reconnect | draft 보존, 발행 잠금 | Threads 다시 연결하기 |
| wrong-account | 승인 계정과 반환 계정 비교 | 계정 변경 후 재검수 |
| 502 | 결과 확인 중, 승인본 보존 | 기존 게시 결과 확인하기 |
| scheduled | Queue 위치와 예약 시각 | 시간 변경, 지금 발행, 초안으로 |
| published | 게시물 링크와 시각 | 게시물 열기, 발행 기록, 분석 |

## Capability 표현

- Threads: 텍스트, 검수, 지금 발행, 예약, Queue, 게시물 링크, 분석.
- Instagram: 연결 상태, 이미지 초안, 피드 미리보기. 자동 발행과 게시물 링크는 다음 지원 범위.
- X: 텍스트 초안 가능, 연결 필요.
- Facebook과 YouTube: 지원 상태와 필요한 media type 표시.

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-02 22:43 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SOURCES: https://docs.postiz.com/public-api/posts/create, https://help.later.com/hc/en-us/articles/8843980454295-About-Draft-Posts, https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows

MODEL: `gpt-codex/gpt-5.6-sol`

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=5/5 voice=5/5 slop=5/5 total=25/25

WEAKEST_LINE: Instagram 미리보기는 실제 provider 렌더와 완전히 같다고 보장하지 않는다.

SKILLS_USED: design-consultation, design-shotgun, design-html, design-review

SKILLS_SKIPPED: 없음
