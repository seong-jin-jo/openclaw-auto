# OSMU v9 Wireframe 02: Drafts and Final Review

> STAMP: created_at=2026-08-05 05:28 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=https://support.buffer.com/article/961-using-post-groups-in-buffer, https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows | deliberation=자동 생성의 속도와 채널별 통제권을 함께 보이는 초안 검수 구조

## 생성

화면당 loading indicator는 하나다.

```text
세 채널 초안을 만들고 있어요                           62%
원문의 핵심 메시지는 그대로 두고 채널 문법에 맞춥니다
[다른 화면으로 이동해도 계속 만들어요]
```

## 초안 1024

```text
원문 요약: 실패 시 돌아올 지점을 먼저 만든다            [원문 보기]

Threads               Instagram Feed              X
대화형 첫 문장         4:5 이미지                  187/280
본문과 링크            캡션과 해시태그             핵심 한 문장
[수정] [미리보기]      [수정] [미리보기]           [수정] [미리보기]

[계정으로]                                           [최종 검수로]
```

### 편집 상태

- Threads: 첫 문장, 본문, 링크
- Instagram Feed: 캡션, 해시태그, 이미지
- X: 본문, 링크, 280자 count
- 원문으로 되돌리기는 해당 카드만 변경
- validation 오류는 해당 카드만 차단

## 최종 검수

```text
발행 전 마지막으로 확인해 주세요

✓ 계정    @openclaw_lab · @openclaw.official · @openclaw_ops   [수정]
✓ 내용    초안 3개 · 이미지 1개                                [미리보기]
✓ 공개    링크 2개 · 태그 4개 · 민감 정보 없음                 [수정]
○ 시간    지금 발행                                             [변경]

[초안으로]                 [예약하기] [3개 계정에 지금 발행]
```

- 4개 확인 전 primary disabled
- 수정은 해당 단계로 돌아가며 다른 확인은 보존
- 예약 선택 시 날짜/KST/계정 요약

## 390

- 초안 카드 1열
- 원문 요약 sticky 아님, 상단 한 줄
- 검수 4개는 accordion 대신 compact rows
- bottom CTA는 화면 흐름 안에 배치

## Red-team과 셀프심문

**공격:** 초안 3개를 병렬 카드로 놓으면 읽기 순서가 불명확하다.

**수정:** 선택 계정 순서와 동일하게 Threads, Instagram Feed, X로 고정한다.

**이게 틀렸다면 가장 그럴듯한 이유는?** 4개 검수 항목이 체크박스 노동처럼 보일 수 있다. 각 항목에 실제 요약을 보여 단순 동의가 아니라 오류 발견 도구로 만든다.

SOURCES: DESIGN.md | docs/user-flow.md | https://support.buffer.com/article/961-using-post-groups-in-buffer | https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, draft editor and responsive review | design-review, loading and error clarity

SKILLS_SKIPPED: 없음
