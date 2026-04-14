# Dashboard 기술 가이드

## Next.js 패턴

- App Router 사용 (pages/ 아님)
- API Route: `src/app/api/*/route.ts`
- 동적 params는 Promise: `{ params }: { params: Promise<{ id: string }> }` → `const { id } = await params;`
- 응답: `Response.json()` (NextResponse 아님)
- 파일 I/O: `readJson()`, `writeJson()`, `readText()`, `writeText()` from `@/lib/file-io`
- 인증: `src/middleware.ts`에서 Bearer 토큰 검증

## 코딩 규칙

- Tailwind 하드코딩 클래스 사용 (CSS 변수 미사용)
- 다크 테마 기본: `bg-[#0a0a0a]`, `text-gray-300`, `bg-gray-900`
- 한국어 UI 텍스트
- `"use client"` 모든 컴포넌트에 필수
- SWR로 서버 데이터, Zustand로 UI 상태
- Flask server.py와 동일한 API 응답 구조 유지

## 공통 유틸

| 파일 | 용도 |
|------|------|
| `lib/file-io.ts` | JSON/텍스트 파일 읽기/쓰기, dataPath(), configPath() |
| `lib/auth.ts` | 클라이언트 토큰 관리, authHeaders() |
| `lib/verify-channel.ts` | 채널 credential API 검증 |
| `lib/send-notification.ts` | Telegram/Slack/Discord/LINE 발송 |
| `lib/constants.ts` | CH_LABELS, AUTOMATION_FEATURES, 채널 목록 |
| `lib/setup-guides.ts` | 채널별 Setup Guide 데이터 |
| `lib/format.ts` | fmtTime(), fmtAgo(), esc() |

## 서비스 특정 코드 금지

이 대시보드는 공통 플랫폼입니다. 특정 서비스 URL, 브랜드명, API 키를 코드에 넣지 마세요.
Custom Integration은 fork에서 `src/custom/` 디렉토리에 추가하세요.
