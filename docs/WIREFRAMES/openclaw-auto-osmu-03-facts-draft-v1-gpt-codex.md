# Wireframe 03: 브랜드 사실과 Threads 초안

## 목적

AI가 지어낸 주장과 고객이 확인한 사실을 섞지 않는다. 초안에서 어떤 사실과 출처가 사용됐는지 바로 확인한다.

## 브랜드 사실

```text
브랜드 사실을 확인해 주세요                          이번 발행 근거
글에 써도 되는 정보만 확인 상태로 바꿉니다.          계정 @minseo_money  확인됨

┌──────────────────────────────────────────────┐    사실 1개           확인 중
│ 1:1 상담은 50분입니다.                       │    승인 없음
│ 출처: 직접 입력 · 2026-08-02                 │    원문 없음
│ [확인한 사실로 사용] [수정] [제외]           │
└──────────────────────────────────────────────┘

[+ 브랜드 사실 직접 입력하기]
                                      [확인 사실로 Threads 초안 만들기]
```

### 사실 상태

- draft: 출처가 보이고 `확인한 사실로 사용` 가능
- confirmed: 초안 근거로 선택 가능
- rejected: 기본 목록에서 제외, 복구 가능
- stale: 수정돼 재확인 필요
- empty: `브랜드 사실 직접 입력하기`가 주 CTA
- save error: 입력 보존, `사실 다시 저장하기`, `입력 복사`

## 초안

```text
Threads 초안을 검토해 주세요                         이번 발행 근거
발행 대상 @minseo_money                              계정 @minseo_money

주제  8월 상담 일정 안내                            사용 사실 1개
                                                     1:1 상담은 50분입니다.
┌──────────────────────────────────────────────┐    출처 직접 입력
│ 8월 1:1 상담 일정을 열었습니다.              │
│ 한 번의 상담은 50분 동안 진행합니다.         │    승인 없음
│ 궁금했던 한 가지를 정리해 오시면             │    원문 없음
│ 더 깊게 이야기할 수 있어요.                  │
└──────────────────────────────────────────────┘
                                      73 / provider 상한

[초안 다시 만들기] [직접 수정]                 [사람 검수로 이동]
```

## Loading, empty, error

| 상태 | 본문 영역 | 증거 레일 | 행동 |
|---|---|---|---|
| loading | 최종 높이 skeleton, `초안을 만들고 있어요` | 목표 handle과 사용 예정 사실 유지 | 생성 취소 |
| empty | 빈 editor, 주제 입력 | 계정 확인, 사실 1개 | Threads 초안 만들기 |
| error | 입력과 사실 보존, 생성 실패 원인 | 기존 증거 유지 | 같은 내용으로 다시 만들기, 직접 쓰기 |
| over-limit | 초과 영역 표시, 현재/상한 | 사실 유지 | 초안 줄이기, 직접 수정 |
| stale fact | 본문 read-only 경고 | 변경 사실 stale | 사실 다시 확인하기 |

## 모바일 규칙

- `발행 대상 @handle`을 제목 바로 아래 고정한다.
- editor 뒤에 사용 사실을 두지 않는다. `사용 사실 1개` 요약을 editor 위에 둔다.
- 현재 글자수와 상한은 키보드가 열려도 editor 하단에 보인다.
- 생성과 검수 CTA를 동시에 primary로 만들지 않는다. ready일 때만 검수가 primary다.

## 인터랙션

- 사실 수정: confirmed를 stale로 바꾸고 그 사실을 사용한 승인과 초안을 무효화한다.
- 사실 제외: 사용 중이면 영향을 먼저 설명하고 확인받는다.
- 초안 다시 만들기: 기존 초안을 즉시 지우지 않고 새 버전이 준비되면 교체한다.
- 사람 검수로 이동: 상한 이내, 계정 확인, 확인 사실 1개 이상일 때만 활성화한다.

---

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-02 21:26 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SOURCES: PRD L-05/L-06/L-09/N-06, Jasper Knowledge Base benchmark, DESIGN.md §8

MODEL: `gpt-codex/gpt-5.6-sol`

RUBRIC_SCORE: completeness=5/5 evidence=5/5 states=5/5 clarity=5/5 slop=5/5 total=25/25

WEAKEST_LINE: provider 상한의 정확한 숫자는 API 계약 전 확정하지 않고 label만 설계했다.

SKILLS_USED: design-consultation, design-shotgun, design-html, design-review / SKILLS_SKIPPED: 없음
