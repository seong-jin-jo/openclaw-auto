# 실제 코드 작업 목록 (Codex 교차감사 → 작업 전환)

> 출처: `docs/audit/v23-codex-crosscheck.md` (Codex 제3자 감사, 2026-08-10, ❌ 불통과 판정).
> 회장 승인 2026-08-10: 프로토타입 리테이크 중단, 실제 코드 수정으로 전환.
> 브랜치: `feat/design-system-and-missing-features`
> 규율: 기능 추가·삭제·이름 변경으로 기존 구현을 망치지 않는다. 감사가 지적한 **누락 복원**과
> **재창조 되돌리기**가 목표다. 각 항목은 브라우저에서 되는 것을 확인한 뒤에만 완료로 표시한다.

## ★ 2026-08 재검증 발견 — 감사 맹종 금지 (실제 코드 우선)

Opus가 우선순위 1 착수 전 샘플 3화면 실측:
- **#6 images**: URL 복사(`handleCopyUrl`)·삭제(`handleDelete`) **이미 완전 구현**. 감사의 "copy/delete 누락"은 오판.
- **#9 signup**: `/login` redirect 정상(Google 단일 인증). 고칠 것 없음. 감사의 "재창조"는 프로토타입 문제.

결론: `v23-codex-crosscheck.md`의 "누락·재창조"는 **프로토타입 기준이라 실제 코드엔 이미 있는 항목이 다수**(허수). 이 worklist 10개를 그대로 code-builder에 위임하면 **이미 있는 기능을 재창조**해 회장이 금지한 파괴를 반복한다.

**진짜 다음 액션 (session-state 근본원인 진단과 일치):** 실제 앱을 로컬 기동(`next dev` :3456 + `scripts/seed-local-demo.sql`)하고, 브라우저로 회장 요청 R-01~R-13(`docs/requests/2026-08-08_2026-08-10-chairman-requests.md`) 기준 **실제로 안 되는 것만** 실측한다. 그 목록만 코드 수정 대상으로 삼는다. 아래 우선순위 1 표는 "실측으로 확인된 것만" 착수로 강등.

## 우선순위 0 — 뿌리 (진행 중)

- [ ] 디자인 시스템을 공통 부품으로 구현 (Button/Stack/Section/Field, 간격 6단·글자 7단 토큰화, 넘침 규칙 내장)
      → Codex `code-builder` 작업 중. 대상 화면 3개 마이그레이션(studio, home, ChannelPage). 기능 변경 0 조건.

## 우선순위 1 — 감사가 지적한 화면별 항목

| # | 감사 지적 (실제 코드 경로와 빠진 액션) | 상태 |
|---|---|---|
| 1 | `dashboard/src/app/page.tsx:48,111,141-209,216-429` — 온보딩, 성과 필터, 아이디어 생성, metric 수집, activity/alerts/weekly/agent/usage/errors | 미착수 |
| 2 | `dashboard/src/app/studio/page.tsx:68,190-320,390-573` — brand, repo, OSMU, AI draft, save/history, publish/cancel/reconcile, schedule, preview/edit | 미착수 |
| 3 | `dashboard/src/app/inbox/page.tsx:33,112-127,166-229,273-296` — product source, tone, seed, approve/reject, 예약시간 | 미착수 |
| 4 | `dashboard/src/app/calendar/page.tsx:37,80-148` — 월 이동, 오늘, 날짜 선택, 해당일 read-only 목록 | 미착수 |
| 5 | `dashboard/src/app/blog/page.tsx:36,69-129,145-332` — queue approve/delete, editor save, guide, keyword bank | 미착수 |
| 6 | `dashboard/src/app/images/page.tsx:15,20-28,66-76` — 이미지 URL 복사·삭제 | 미착수 |
| 7 | `dashboard/src/app/operator/customers/page.tsx:120,199-302,326-657` — OAuth credential CRUD/reveal, customer pause/resume, shared AI approve/revoke, workspace metrics | 미착수 |
| 8 | `dashboard/src/app/settings/page.tsx:23-35,37,53-108` — 9탭·15개 설정 컴포넌트 mount | 미착수 |
| 9 | `dashboard/src/app/signup/page.tsx:3-5` — login redirect | 미착수 |
| 10 | `dashboard/src/app/videos/page.tsx:72,213-440,489-889` — library/generate, provider status, clip repurpose/refine/fan-out, publish 3종, delete, slide/TTS/BGM | 미착수 |

## 규율 (매 항목 공통)

1. 착수 전 해당 실제 코드 파일을 Read한다. 감사 지적이 현재 코드와 다르면 코드가 정본이다.
2. 기존 라벨·경로·구조를 바꾸지 않는다. 빠진 것을 채우고, 새로 만든 것은 되돌린다.
3. 완료 조건 = 브라우저에서 직접 확인 + 관련 시험 통과. 스크린샷은 **파일 실제 픽셀 폭**이 주장한 폭과 일치해야 한다.
4. 회장 요청 원문 정본: `docs/requests/2026-08-08_2026-08-10-chairman-requests.md`.