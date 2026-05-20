# postAGI Marketing Hub

> 정적 HTML 1 파일로 4+ openclaw 인스턴스를 탭으로 전환하며 통합 관제.
> 백엔드 인스턴스는 그대로 분리 운영 → 추후 서버 분리 자유.

## 구성

```
marketing-hub/
├── index.html       # 탭 UI + iframe (사이드바 tenant 리스트 + "+ 새 서비스" 모달)
├── tenants.json     # 서비스 목록 (slug/포트/도메인/상태)
└── README.md        # 본 파일
```

## 가동 방법 3가지

### 1) 로컬 파일로 즉시
브라우저에서 `file:///.../marketing-hub/index.html` 열기.
단점: iframe cross-origin 정책 / CORS — 일부 dashboard 기능 제한.

### 2) 정적 호스팅 (Cloudflare Pages / Vercel)
GitHub Pages 또는 Cloudflare Pages에 `marketing-hub/` 폴더 배포.
hub URL = `https://marketing.example.com` 같이 박힌 도메인.

### 3) nginx 컨테이너 (권장)
```yaml
# docker-compose.postagi-4tenants.yml 에 추가:
  marketing-hub:
    image: nginx:alpine
    container_name: openclaw-marketing-hub
    volumes:
      - ./marketing-hub:/usr/share/nginx/html:ro
    ports:
      - "127.0.0.1:34570:80"
    restart: unless-stopped
```
Cloudflare Tunnel 라우트: `marketing.example.com` → `localhost:34570`.

## 새 서비스 추가 워크플로우

1. hub 좌측 사이드바 "+ 새 서비스 추가" 클릭
2. 폼 입력 (slug / 표시명 / 이모지 / 채널 / 도메인)
3. "생성 명령 발행" → 클립보드에 명령 자동 복사
4. 터미널에 붙여넣기 → `add-tenant.sh`가 자동 처리:
   - data-{slug}/ + config-{slug}/ 디렉토리 생성
   - prompt-guide 템플릿 복사 (templates/ 에 있으면)
   - .env.{slug} 토큰 자동 생성
   - docker-compose에 service 2개 (gateway + dashboard) 자동 append
   - tenants.json 자동 갱신
5. Cloudflare Tunnel 라우트 추가
6. `docker-compose up -d openclaw-gateway-{slug} openclaw-dashboard-{slug} --build`
7. dashboard 접속 → Settings → 채널 credential 입력
8. hub 새로고침 → 새 탭 자동 노출

## tenants.json 스키마

```json
{
  "tenants": [
    {
      "slug": "tenant2",                    // 영문 소문자
      "name": "Tenant",              // 표시명
      "emoji": "緣",                     // 1-2자
      "dashboardPort": 34561,            // 호스트 포트
      "gatewayPort": 18790,
      "publicUrl": "https://...",        // 외부 접근 URL
      "channels": ["instagram"],         // 주 채널
      "status": "active"                 // active/pending/waiting-meta-review/waiting-legal-opinion
    }
  ]
}
```

## 상태 색상 (사이드바 표시)

- `active` 초록 → 운영 중
- `pending` 황색 → 가동 대기 (인스턴스만 떠 있음)
- `waiting-meta-review` / `waiting-legal-opinion` 회색 → 외부 의존성 대기

## 향후 v4.0 마이그레이션

openclaw upstream v4.0 (SaaS + 멀티테넌트) 출시 시 — hub HTML은 유지하되 백엔드 인스턴스 1개로 통합. tenants.json은 v4.0 dashboard API와 동기화.

## 관련

- `docker-compose.postagi-4tenants.yml` — 백엔드 인스턴스 정의
- `bootstrap-postagi-4tenants.sh` — 초기 4 서비스 셋업
- `add-tenant.sh` — 신규 tenant 동적 추가
- `docs/POSTAGI_4_TENANTS.md` — 전체 가이드
