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

## 빌드 & 배포

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
