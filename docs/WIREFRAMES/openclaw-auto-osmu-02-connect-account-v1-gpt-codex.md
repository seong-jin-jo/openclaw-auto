# Wireframe 02: Threads 연결과 계정 확인

## 목적

OAuth callback을 성공으로 오인하지 않고, 반환된 실제 handle을 고객이 확인한 뒤에만 연결을 완료한다.

## 기본 화면

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1 채널 연결  >  2 브랜드 사실  >  3 초안  >  4 검수  >  5 발행          │
├──────────────────────────────────────────────────┬──────────────────────────┤
│ Threads 계정을 연결할게요                        │ 연결 전에 확인해 주세요  │
│                                                  │                          │
│ 현재 브라우저에서 로그인한 Threads 계정이        │ 1. Threads와 Instagram   │
│ 연결됩니다. 사업용 계정으로 로그인했는지         │    에서 로그아웃          │
│ 먼저 확인해 주세요.                              │ 2. 사업용 Instagram 로그인│
│                                                  │ 3. Threads에서 Instagram │
│ [Threads 계정 연결하기]                          │    으로 로그인            │
│ [계정 변경 방법 보기]                            │                          │
└──────────────────────────────────────────────────┴──────────────────────────┘
```

## callback loading

- 제목: `Threads 계정을 확인하고 있어요`
- 설명: `연결 완료로 표시하기 전에 실제 계정 정보를 확인합니다.`
- 동일 높이 skeleton: avatar, handle, 확인 시각
- 10초 뒤 행동: `상태 다시 확인하기`, `채널 관리로 돌아가기`

## 반환 handle 확인

```text
Threads에서 확인한 계정

  @minseo_money
  민서의 돈 공부 · Threads 공개 프로필
  방금 확인

이 계정이 사업용 Threads 계정이 맞나요?

[이 계정이 맞아요]  [다른 계정으로 바꾸기]
```

## wrong-account

```text
연결된 계정이 목표와 달라요

현재 반환     @zero_to_one_ai
사용하려는 계정 @minseo_money

OSMU는 Meta 계정 목록을 직접 보여줄 수 없어요. Threads와 Instagram에서
현재 계정을 로그아웃한 뒤 사업용 계정으로 로그인하고 다시 연결해 주세요.

[계정 변경 방법 보기]  [다시 연결하기]  [채널 관리로 돌아가기]
```

## reconnect와 error

| 상태 | 제목 | 보존 정보 | CTA |
|---|---|---|---|
| reconnect | 계정 상태를 다시 확인해야 해요 | 저장 handle, 마지막 성공 확인 시각 | Threads 상태 다시 확인하기 |
| provider 5xx | Threads 응답을 기다리고 있어요 | 기존 저장 handle, 초안 | 상태 다시 확인하기 |
| OAuth 거절 | Threads 연결이 취소됐어요 | 기존 데이터 | 다시 연결하기 |
| identity 불일치 | 연결된 계정이 목표와 달라요 | 현재 반환, 목표 handle | 계정 변경 방법 보기 |

## 모바일 규칙

- 현재 반환 handle과 주 CTA는 390x844 첫 화면 안에 둔다.
- 계정 변경 도움말은 bottom sheet로 연다. 닫기와 다시 연결하기를 모두 제공한다.
- avatar만으로 계정을 식별하지 않는다.
- `이 계정이 맞아요`의 터치 영역은 최소 44x44다.

## 인터랙션

- `Threads 계정 연결하기`: 제약 확인 뒤 provider OAuth로 이동한다.
- `이 계정이 맞아요`: 증거 레일에 provider, handle, 확인 시각을 고정하고 브랜드 사실로 이동한다.
- `다른 계정으로 바꾸기`: wrong-account 도움말을 연다. 현재 계정을 자동 삭제하지 않는다.
- `다시 연결하기`: 새 OAuth를 시작한다. 새 callback 전까지 기존 확인 상태를 유지하지 않는다.

---

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-02 21:26 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SOURCES: https://support.buffer.com/article/857-using-threads-with-buffer, https://support.buffer.com/article/568-connecting-your-instagram-business-or-creator-account-to-buffer, PRD L-12/N-02-A

MODEL: `gpt-codex/gpt-5.6-sol`

RUBRIC_SCORE: completeness=5/5 states=5/5 recovery=5/5 clarity=5/5 slop=5/5 total=25/25

WEAKEST_LINE: Meta의 실제 로그인 화면은 OSMU가 통제하지 못하므로 도움말은 provider 변경에 맞춰 유지해야 한다.

SKILLS_USED: design-consultation, design-shotgun, design-html, design-review / SKILLS_SKIPPED: 없음
