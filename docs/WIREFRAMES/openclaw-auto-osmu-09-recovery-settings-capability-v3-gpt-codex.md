# 발행 복구 · 설정 · 지원 범위 wireframe v3

## 502: `/studio` 발행 결과 또는 기존 발행 기록

```text
발행 결과를 확인하고 있어요                         상태 확인 불가

같은 글을 다시 보내지 않습니다.
추적 번호  OSMU-20260803-7F2A           [문제 신고 정보 복사]

1  검수한 버전 확인          완료
2  외부 게시물 결과 조회     진행 중
3  게시물 링크 기록          대기

[기존 발행 결과 확인하기] [발행 기록 보기]
```

외부 링크 발견:

```text
외부 게시물은 확인됐어요                            부분 성공
게시물 링크 https://www.threads.net/@.../post/...
내부 발행 기록을 정리하는 동안 같은 글의 재발행을 막았습니다.
[게시물 먼저 열기] [기록 상태 다시 확인]
```

외부 미발행 확인:

```text
미발행 확인됨 · 2026-08-03 17:04 KST
외부 게시물이 만들어지지 않은 것을 확인했습니다.
[안전하게 다시 발행하기] [초안으로 돌아가기]
```

`미발행 확인됨` 전에는 안전 재발행 CTA를 렌더하지 않는다. trace ID는 고객이 운영자에게 전달할 수 있는 추적 번호로 설명한다.

## `/settings` Channels와 채널 Settings

```text
채널 계정
Threads    @j.the.great.investor   연결됨       16:42 확인  [관리]
Instagram  @j.the.great.investor   재연결 필요  15:18 확인  [다시 연결]

지원 기능
Threads    TEXT · IMAGE            구현됨
Instagram  IMAGE · Reels           구현됨
TikTok     직접 게시               외부 승인 필요
X          TEXT                     연결 필요
Facebook   게시                     외부 승인 필요
YouTube    영상 업로드              외부 승인 필요
```

채널 상세와 전역 설정의 handle/status/last checked가 다르면 `상태 확인 불가` 하나로 수렴시킨다. 두 값을 동시에 맞다고 표시하지 않는다.

## Instagram 고급 복구

기본 Settings:

```text
Instagram @j.the.great.investor · 재연결 필요
[Instagram 다시 연결하기]
[고급 복구 열기]
```

명시적으로 연 뒤:

```text
고급 연결 복구
위험       잘못된 값은 현재 Instagram 게시를 중단시킬 수 있습니다.
적용 범위  이 작업공간의 Instagram 연결에만 적용됩니다.
권장       먼저 Instagram 다시 연결하기를 사용하세요.

Graph API access value    ••••••••••••  [보기]
[값 저장 후 상태 확인] [취소]
```

취소하면 입력을 저장하지 않고 Instagram Settings로 돌아간다. 고급 복구가 OAuth보다 같은 무게의 기본 선택처럼 보이면 실패다.

## 지원 분류 인터랙션

| 분류 | 고객 설명 | CTA |
|---|---|---|
| 구현됨 | 제품과 운영 증거가 있고 연결되면 사용할 수 있음 | 글 만들기 또는 채널 관리 |
| 연결 필요 | 제품 기능은 있으나 이 작업공간 계정 연결이 없음 | 계정 연결하기 |
| 외부 자격·검토 필요 | 외부 서비스의 자격 정보나 앱 검토가 남음 | 필요한 조건 보기 |
| 미구현 | 현재 제품 동작 없음 | 사용 가능한 채널 보기 |

## Mobile 390

- 502 진행 단계는 세로 3행, 추적 번호는 복사 가능하게 줄바꿈한다.
- 지원 범위 표는 카드 1열로 전환하고 채널명·기능·분류를 모두 텍스트로 남긴다.
- 고급 복구 입력은 위험과 적용 범위 아래에 두며, 취소를 화면 하단에서 항상 보이게 한다.

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-03 02:56 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SOURCES:

- `tasks/osmu-stabilize-live.output`
- `docs/qa-tracker.md` REQUEST-OSMU-001, SNS-001~018
- `dashboard/src/components/settings/ChannelsSettings.tsx`
- `dashboard/src/components/channel/InstagramPage.tsx`
- `dashboard/src/components/shared/CredentialForm.tsx`
- https://docs.postiz.com/public-api/posts/create

MODEL: `gpt-codex/gpt-5.6-sol`

RUBRIC_SCORE: hierarchy=5/5 recovery=5/5 trust=5/5 accessibility=5/5 slop=5/5 total=25/25

WEAKEST_LINE: 고급 복구 값의 정확한 권한·수명·저장 범위는 보안 및 eng-design에서 확정해야 한다.

SKILLS_USED: design-consultation, design-shotgun(외부 생성 실패 후 구조 비교 대체), design-html, design-review

SKILLS_SKIPPED: 없음

---

## DESIGN-004 additive correction

Settings 성공 화면을 먼저 정의한다.

```text
Threads
@j.the.great.investor     연결됨     2026-08-03 14:42 확인
[다른 계정 연결] [상태 다시 확인]
```

연결됨 상태에서는 기본 OAuth CTA가 없다. Instagram도 같은 구조다. invalid/reconnect 상태에서만 `Instagram 다시 연결`을 primary로 보인다.

양쪽 channel page는 동일 탭을 쓴다.

`Queue / Editor / Analytics / Growth / Popular / Settings`

Instagram Growth와 Popular:

- Growth: 실제 follower snapshot을 기간별로 비교한다. 없으면 `성과 데이터 수집하기`.
- Popular: 실제 published post insights로 상위 글, 게시물 링크, `이 형식으로 새 글 만들기`.
- 데이터 계약은 신규 구현 범위이며 UI에는 내부 API 이름을 표시하지 않는다.

502는 `기존 결과 조회 → 링크 발견` 또는 `미발행 확인 → 안전 재발행 → 링크`로 끝난다. 제거 0.

MODEL: `gpt-codex/gpt-5.6-sol`

SKILLS_USED: design-consultation, design-html, design-review

SKILLS_SKIPPED: 없음
