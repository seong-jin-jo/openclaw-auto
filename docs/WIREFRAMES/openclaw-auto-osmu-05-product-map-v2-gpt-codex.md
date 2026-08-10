# OSMU 전체 제품 지도 wireframe v2

## Desktop 1024

```text
┌ OSMU 콘텐츠 운영                                      검색  알림  설정 ┐
├ 홈 │ 콘텐츠 │ 플랫폼별 초안 │ 캘린더 │ 채널 │ 발행 기록 │ 분석 │ 설정 ┤
├───────────────────────────────────────────────────────────────┤
│ 한 원문을 채널마다 맞는 글로 바꾸고, 발행까지 한곳에서 관리해요 │
│ [한 원문으로 채널별 글 만들기]                               │
│                                                               │
│ 콘텐츠 3  > 플랫폼별 초안 5 > Queue 2 > 게시됨 8              │
│                                                               │
│ 작업 중                                                       │
│ 8월 상담 일정    Threads 검수 중    Instagram 초안             │
│                                                               │
│ 이번 주 캘린더              채널 상태                          │
│ 월 Threads 예약              Threads 완전 사용 가능             │
│ 수 Instagram 초안            Instagram 연결됨, 다음 지원 범위    │
└───────────────────────────────────────────────────────────────┘
```

요소:

- persistent global nav 8개 영역
- 제품 흐름 `콘텐츠 > 플랫폼별 초안 > Queue와 예약 > 게시됨`
- 현재 작업 1개
- 이번 주 캘린더 축약
- 채널 capability 축약
- 첫 primary CTA는 `한 원문으로 채널별 글 만들기`

## Mobile 390

- 상단: 제품명, 현재 영역 `홈`, 메뉴 버튼.
- 첫 카드가 아니라 한 문장과 primary CTA가 anchor다.
- 제품 흐름은 가로 scroll 가능한 4단계 strip.
- 현재 작업 > 다음 예약 > 채널 상태 순으로 단일 column.
- global nav는 bottom sheet로 열리며 8개 영역명을 그대로 유지한다.

## 상태

- loading: 최근 발행 숫자 1개만 static skeleton. nav, 제목, CTA는 유지.
- empty: `첫 원문 만들기`, `Threads 연결하기`를 상황에 맞게 제공.
- error: 실패한 요약 영역만 원인과 복구 CTA 표시.
- reconnect: 채널 요약에 `다시 연결 필요`, 작업 초안은 보존.
- scheduled: 다음 예약 시각을 첫 보조 정보로 표시.
- published: 최근 게시물 링크를 발행 기록과 연결.

## 인터랙션

- 제품 흐름 각 단계는 해당 영역으로 이동.
- 현재 작업을 누르면 플랫폼별 변환 작업대로 이동.
- 예약 행은 캘린더 상세로 이동.
- 채널 capability를 누르면 채널 상세로 이동.

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-02 22:43 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SOURCES: https://support.buffer.com/article/656-saving-and-scheduling-draft-posts, https://support.sproutsocial.com/hc/en-us/articles/360000121343-How-do-I-use-the-Publishing-Calendar

MODEL: `gpt-codex/gpt-5.6-sol`

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=5/5 voice=5/5 slop=5/5 total=25/25

WEAKEST_LINE: 첫 화면은 전체 구조를 설명하지만 각 영역의 세부 기능을 모두 펼치지 않는다.

SKILLS_USED: design-consultation, design-shotgun, design-html, design-review

SKILLS_SKIPPED: 없음
