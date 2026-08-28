# Wireframe 04: 사람 검수, 발행 증거, 복구

## 목적

발행 전에 대상 계정, 최종 본문, 사용 사실을 한 화면에서 확인한다. 성공은 실제 permalink가 있을 때만 표시하고 502에서는 중복 없는 결과 조회를 먼저 한다.

## 사람 검수

```text
마지막으로 확인해 주세요                            발행 체크

발행 대상                                           계정 확인됨
@minseo_money · Threads                              사실 1개 확인됨

최종 본문                                           글자수 상한 이내
┌──────────────────────────────────────────────┐    사람 승인 대기
│ 8월 1:1 상담 일정을 열었습니다.              │
│ 한 번의 상담은 50분 동안 진행합니다.         │
│ 궁금했던 한 가지를 정리해 오시면             │
│ 더 깊게 이야기할 수 있어요.                  │
└──────────────────────────────────────────────┘

사용한 사실
1:1 상담은 50분입니다. · 직접 입력 · 확인됨

[초안 수정하기]                     [@minseo_money에 지금 발행하기]
```

계정 또는 사실이 검수 화면을 연 뒤 변경되면 CTA를 disabled하고 `발행 근거가 변경됐어요`를 표시한다. `사실과 초안 다시 확인하기`로 돌아간다.

## 발행 loading

```text
@minseo_money에 발행하고 있어요

✓ 승인 버전 고정
● Threads에 요청
○ 외부 원문 확인
○ permalink 회수

같은 버튼을 다시 눌러도 글을 하나 더 만들지 않습니다.
```

## 502와 timeout

```text
발행 결과를 확인하는 중이에요

Threads 응답이 늦어 발행 여부를 바로 확인하지 못했습니다.
같은 글을 다시 올리지 않습니다. 외부 원문이 생겼는지 먼저 조회합니다.

사건 시각  2026-08-02 21:18 KST
대상 계정  @minseo_money
승인 버전  #A-018

[기존 발행 결과 확인하기]
[문제 신고 정보 복사]  [채널 관리로 돌아가기]
```

`기존 발행 결과 확인하기` 결과:

- permalink 발견: success 또는 partial로 이동
- 아직 미확인: 같은 화면에서 확인 시각 갱신, 다음 조회 안내
- 미발행 확정: `안전하게 다시 발행하기` CTA를 새로 연다

## 부분성공

```text
외부 게시물은 확인됐어요

Threads 원문은 생겼지만 OSMU 기록을 정리하는 중입니다.
자동 재발행을 막았습니다.

[@minseo_money 원문 먼저 열기]
[상태 다시 확인하기]  [채널 관리로 돌아가기]
```

## 성공

```text
@minseo_money에 발행됐어요

발행 시각  2026-08-02 21:18 KST
사용 사실  1:1 상담은 50분입니다.
실제 원문  threads.net/@minseo_money/post/DJ8x...

[Threads 원문 열기]
[같은 사실로 다음 글 만들기]  [채널 관리로 돌아가기]
```

## Error 상태

| 오류 | 성공 표시 | 주 행동 | 보존 |
|---|---|---|---|
| provider 4xx | 금지 | 내용 수정 또는 계정 다시 확인 | 초안, 승인 전 내용 |
| provider 5xx | 금지 | 기존 발행 결과 확인 | 승인 버전, 사건 시각 |
| 내부 기록 실패 | 부분성공 | 원문 먼저 열기 | permalink, external result |
| permalink 없음 | 금지 | 원문 다시 확인하기 | external ID hash, 승인 버전 |
| cross-tenant 의심 | 금지, 전체 발행 중단 | 채널 관리로 돌아가기 | 고객 원문 비노출 사건 정보 |

## 모바일 규칙

- 검수에서 handle, 본문 첫 줄, 사실 요약, 발행 CTA가 한 번의 세로 흐름으로 이어진다.
- 발행 CTA는 sticky일 수 있지만 handle을 버튼 안에 포함한다.
- 502에서 주 CTA는 결과 확인뿐이다. `다시 발행`을 같은 화면에 두지 않는다.
- success에서 permalink는 한 줄 말줄임과 도메인을 보여주고, 전체 URL은 접근 가능한 링크 label로 제공한다.

## 인터랙션

- 발행 CTA: 첫 클릭 뒤 disabled, 현재 publication 조회로 화면을 전환한다.
- 원문 열기: 새 탭. 현재 receipt 화면은 유지한다.
- 채널 관리로 돌아가기: receipt 상태를 보존한다.
- 다음 글 만들기: 확인 사실은 유지하되 새 초안과 새 승인 버전을 만든다.

---

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-02 21:26 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SOURCES: PRD L-11/N-06/N-09-A, https://docs.postiz.com/public-api/posts/list, https://docs.postiz.com/cli/managing-posts

MODEL: `gpt-codex/gpt-5.6-sol`

RUBRIC_SCORE: completeness=5/5 recovery=5/5 evidence=5/5 clarity=5/5 slop=5/5 total=25/25

WEAKEST_LINE: `안전하게 다시 발행하기`를 여는 미발행 확정 기준은 eng-design에서 합의해야 한다.

SKILLS_USED: design-consultation, design-shotgun, design-html, design-review / SKILLS_SKIPPED: 없음
