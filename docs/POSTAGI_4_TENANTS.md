# postAGI 4 서비스 멀티 인스턴스 운영 가이드

> Tenant는 기존 `docker-compose.yml` 인스턴스 1개 그대로.
> Tenant / Tenant / Tenant / tenant 4 서비스는 본 가이드로 **별도 인스턴스 4개**로 운영.
> 각 서비스 = 별도 인스타/X 본계정 + 별도 채널 credential + 별도 cron 일정.

## 왜 인스턴스 4개인가

openclaw v3.0 설계는 **1 인스턴스 = 1 서비스** (멀티 테넌트는 v4.0 예정).
4 서비스 동시 운영 + 각자 다른 본계정 = 4 컨테이너 분리가 정합.

| 서비스 | 본계정 | 주 채널 | Dashboard 포트 | Gateway 포트 |
|---|---|---|---|---|
| Tenant (기존) | @tenant | 기존 박힘 | 34560 | 18789 |
| **Tenant** (신규) | @tenant | IG + Threads | **34561** | 18790 |
| **DC** (신규) | @tenant_official | X (Twitter) | **34562** | 18791 |
| **Tenant** (신규) | @tenant | IG | **34563** | 18792 |
| **폴리** (신규) | @tenant | X | **34564** | 18793 |

## 1회 셋업 (~5분)

```bash
cd ~/sj_code_master/postAGI/openclaw-auto

# 1. data/config 디렉토리 + templates 복사 + .env.{slug} 자동 생성
bash bootstrap-postagi-4tenants.sh

# 2. 4 인스턴스 가동 (build 1회 + 8 컨테이너 시작, ~5분)
docker-compose -f docker-compose.postagi-4tenants.yml up -d --build

# 3. 컨테이너 상태 확인
docker-compose -f docker-compose.postagi-4tenants.yml ps
```

## Cloudflare Tunnel 라우트 추가 (4건)

`cloudflared` config 또는 dashboard에서:

```yaml
ingress:
  - hostname: marketing-tenant2.example.com
    service: http://localhost:34561
  - hostname: marketing-dc.example.com
    service: http://localhost:34562
  - hostname: marketing-tenant3.example.com
    service: http://localhost:34563
  - hostname: marketing-tenant4.example.com
    service: http://localhost:34564
```

(또는 임시 — `ssh -L 34561:localhost:34561 user@server` 로컬 포워딩만으로도 가능)

## 채널 credential 입력 (서비스별)

각 dashboard 접속 → Settings → Channels:

| 서비스 | 입력할 것 |
|---|---|
| Tenant | Instagram Graph API access token (`@tenant`) + Threads access token |
| DC | X API key/secret + Bearer token (`@tenant_official`) |
| Tenant | Instagram Graph API access token (`@tenant`) |
| 폴리 | X API key/secret + Bearer token (`@tenant`) |

> Meta App Review 통과 전이면 Tenant은 채널 미연결 — dashboard에서 manual 콘텐츠 생성만 가능.

## prompt-guide 활성화

각 서비스 dashboard → Settings → Content Guide:
- 이미 `data-{slug}/prompt-guide.txt`에 박혀 있음 (bootstrap 스크립트가 자동 복사)
- 채널별 오버라이드 필요하면 dashboard에서 직접 편집 (예: Tenant Threads는 살짝 다른 톤)

## Cron 자동화 ON

각 dashboard → Settings → Automation:
- 콘텐츠 생성: 6시간 주기 (기본)
- 발행: 2시간 주기 (승인된 글)
- 반응 수집: 6시간 주기

서비스별로 Tenant만 ON / DC는 수동 / Tenant은 Meta 통과 후 ON / 폴리는 Legal Opinion 후 ON.

## 메모리 / 디스크 예상

| 항목 | 1 인스턴스 | 4 인스턴스 |
|---|---|---|
| RAM | ~500MB | ~2GB |
| 디스크 (data/config) | ~50MB | ~200MB |
| 빌드 시간 | 5분 | 5분 (image 공유) |

WSL2 런너에서 충분 (16GB+ 권장).

## 운영 단계별 권장

| 단계 | 인스턴스 |
|---|---|
| 이번 주 | **Tenant만 ON** (Meta 검수/Legal 대기 중인 Tenant/폴리는 컨테이너만 떠있게) |
| 3주 후 | Tenant ON (Meta 검수 통과 시) |
| 4-8주 후 | 폴리 ON (Legal Opinion 통과 시) |
| DC | 인플루언서 funnel은 1:1 DM이라 **수동 권장** — openclaw는 일상 게시만 |

## 트러블슈팅

- **dashboard 접근 불가** — Cloudflare Tunnel 라우트 + 포트 매핑 확인
- **콘텐츠 생성 실패** — AI Engine 설정에서 Claude/GPT API 키 입력 확인
- **발행 실패** — Settings → Channels의 access token 만료 여부 확인 (보통 60일)
- **포트 충돌** — Tenant(34560)과 겹치지 않게 34561~34564 사용

## 관련 commits

- `df55158` — postAGI 4 서비스 prompt-guide templates 추가
- (본 작업) `docker-compose.postagi-4tenants.yml` + `bootstrap-postagi-4tenants.sh` + 본 docs
