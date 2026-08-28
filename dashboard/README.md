# Dashboard — Next.js + TypeScript

멀티채널 마케팅 자동화 대시보드.

## 개발

```bash
npm ci
npm run dev          # http://localhost:3000
```

환경변수:
- `DATA_DIR` — 데이터 디렉토리 (기본: ../data)
- `CONFIG_DIR` — 설정 디렉토리 (기본: ../config)
- `DASHBOARD_AUTH_TOKEN` — 인증 토큰 (미설정 시 인증 비활성화)
- `PORT` — 서버 포트

Studio v1 로컬 개발 인증은 대시보드 로그인과 독립된 아래 이름을 사용한다. 실제 값은 이 문서나 저장소에 기록하지 않는다. 아래 네 값은 개발 전용이다. 운영에는 모두 넣지 않으며, `STUDIO_IDENTITY_MODE=development`는 운영 시작 단계에서 거절된다.

- `STUDIO_IDENTITY_MODE` (`development`일 때만 개발 어댑터 활성)
- `STUDIO_DEV_BEARER_TOKEN`
- `STUDIO_DEV_MEMBER_ID`
- `STUDIO_DEV_WORKSPACE_IDS` (쉼표로 구분한 UUID 목록)

Studio v1의 비용 안내와 작업 회수 시간은 선택 설정이다. 값이 없거나 잘못돼도 서버 오류를 내지 않고 안전한 기본값 또는 비용 미표시 상태를 사용한다.

- `STUDIO_PREVIEW_COST_MIN_MINOR`, `STUDIO_PREVIEW_COST_MAX_MINOR`: 예상 비용의 최소값과 최대값. 둘 다 양의 정수이고 최소값이 최대값 이하여야 표시한다.
- `STUDIO_PAID_REGENERATION_MINOR`: 유료 재생성 안내 금액. 양의 정수가 아니면 유료 견적을 표시하지 않는다.
- `STUDIO_COST_CURRENCY`: 통화 코드. 미설정 기본값은 `KRW`다.
- `SHORTS_FACTORY_STALE_AFTER_MS`: 숏폼 공장 실행 회수 시간. 미설정 또는 1초 미만이면 15분이다.
- `ENGAGEMENT_REPLY_CLAIM_STALE_AFTER_MS`: 댓글 답글 청구 회수 시간. 미설정 또는 1초 미만이면 15분이다.
- `OSMU_ALERT_SLACK_WEBHOOK_URL`: 운영 장애 알림 주소. 미설정이면 원장 기록은 유지하고 외부 알림만 건너뛴다.

## 빌드 & 배포

PR CI는 로컬 환경파일 없이 Node.js 20과 PostgreSQL 16에서 TypeScript, production build, schema·seed·RLS, 전체 Vitest를 실행한다. 테스트는 개발 머신의 환경변수나 설치 명령에 기대지 않고 필요한 DB와 실행 도구를 자체 mock으로 제공해야 한다.

```bash
npm run build                    # .next/ 생성
node .next/standalone/server.js  # standalone 실행
```

Docker:
```bash
docker build -t dashboard .
docker run -v ./data:/app/data -v ./config:/app/config -e PORT=34560 dashboard
```

## 디렉토리 구조

```
src/
  app/
    api/          # API Routes (81개) — server.py 대체
    channels/     # 채널 페이지 ([channel] 동적 라우팅)
    settings/     # 설정 페이지
    blog/         # 블로그 큐
    images/       # 이미지 갤러리
    page.tsx      # Marketing Home
    layout.tsx    # 레이아웃 (AuthGate + Sidebar)
  components/
    layout/       # Sidebar, Toast, Providers
    shared/       # CredentialForm, SetupGuide, LoginModal
    channel/      # ChannelPage, MessagingPage, InstagramPage
    queue/        # QueueList, PostCard, ImagePickerModal
    settings/     # AIEngine, Notifications, DesignTools, ...
  lib/            # 유틸 (file-io, auth, verify-channel, format, constants)
  hooks/          # SWR 훅 (useQueue, useChannelConfig, ...)
  store/          # Zustand (ui-store)
  types/          # TypeScript 타입
  middleware.ts   # API 인증
legacy/           # Flask 호환용 (점진적 제거 예정)
  server.py       # Flask API 서버
  static/         # Vanilla JS SPA
```

## API 추가

```
src/app/api/my-endpoint/route.ts
```
```typescript
import { readJson, writeJson, dataPath } from "@/lib/file-io";

export async function GET() {
  const data = readJson(dataPath("my-data.json")) || {};
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  writeJson(dataPath("my-data.json"), body);
  return Response.json({ ok: true });
}
```

## 레거시

`server.py`와 `static/app.js`는 Flask 기반 대시보드입니다.
기존 Docker 환경과의 호환을 위해 유지하고 있으며, 점진적으로 제거 예정입니다.

새 기능 추가 시:
1. **Next.js (src/)에 구현** — 이것이 기준
2. server.py에도 동일 반영 (레거시 호환)
3. static/app.js에도 동일 반영 (레거시 호환)
