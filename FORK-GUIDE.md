# Fork 셀프호스트 가이드 (Phase 1 — 프론트만 띄우기)

이 레포를 fork 해서 **자기 프론트(UI)만 띄우고, 데이터·DB는 중앙 인스턴스**를 쓰는 방법입니다.
n8n cloud 모델의 1단계 — 코드는 각자, 데이터는 중앙.

## 모델 한눈에

```
[포크 브라우저] --(토큰 없이)--> [포크 백엔드 = 얇은 프록시] --(토큰 부착)--> [중앙 인스턴스 API + DB]
                                       ↑ OSMU_TENANT_TOKEN은 여기 서버 env에만        ↑ DATABASE_URL·RLS는 중앙만
```

- 포크는 **DB를 갖지 않습니다.** `/api/*` 요청이 전부 중앙으로 프록시됩니다.
- 토큰은 **포크 서버 env**에만 — 브라우저 번들에 노출되지 않습니다.
- 토큰은 **그 워크스페이스 데이터에만** 접근(중앙이 RLS로 스코프). 남의 데이터 못 봄.

## 1. 토큰 발급받기 (운영자에게 요청)

운영자가 중앙 대시보드 **Settings → API 토큰** 탭에서 워크스페이스를 고르고 **토큰 발급** →
`osmu_...` 토큰을 1회 전달받습니다. (분실 시 재발급, 유출 시 폐기 버튼으로 즉시 무효화)

## 2. 환경변수 설정 (`.env`)

```bash
# 중앙으로 프록시(이 둘이 핵심)
OSMU_API_BASE=https://central-instance.example.com   # 중앙 인스턴스 주소
OSMU_TENANT_TOKEN=osmu_xxxxxxxxxxxxxxxx               # 발급받은 토큰 (서버 전용)

# 포크 자체 UI 보호(선택) — 본인 대시보드 접근 게이트
DASHBOARD_AUTH_TOKEN=your-own-ui-token
```

> ⚠️ `DATABASE_URL` / `OSMU_SECRET_KEY` 는 **설정하지 마세요.** 중앙 전용입니다.
> 프록시 모드에선 포크가 DB에 직접 붙지 않습니다.

## 3. 실행

```bash
cd dashboard
npm install
npm run build && npm run start   # 또는 npm run dev
```

`OSMU_API_BASE`가 설정돼 있으면 `dashboard/src/middleware.ts`가 모든 `/api` 요청을
중앙으로 토큰 붙여 전달합니다(rewrite). 별도 코드 수정 불필요.

## 4. 업데이트 받기 (우리가 수정 → 포크 pull)

```bash
git remote add upstream <원본 레포 URL>   # 최초 1회
git fetch upstream && git merge upstream/main
```

- **스키마/DB 변경은 중앙에서 처리** → 포크는 **코드만 pull**하면 됩니다. (마이그레이션 불필요)
- 충돌 없이 받으려면 **코어 파일을 직접 수정하지 마세요.** 커스터마이즈는 아래 규칙대로.

## 5. 커스터마이즈 규칙 (충돌 방지)

- 커스텀 코드는 **`dashboard/src/custom/`** 안에서. 코어 파일(`app/`, `lib/`, `components/`) 직접 편집 금지.
- 테넌트별 설정/런타임은 `.env` / `config-*/` / `data-*/` (모두 `.gitignore` 처리됨).
- 코어에 기능이 필요하면 원본(upstream)에 PR → 모두가 pull로 공유.

## 6. 보안 모델 요약

| | 포크가 가짐 | 비고 |
|---|---|---|
| `OSMU_TENANT_TOKEN` | ✅ (서버 env) | 그 워크스페이스 데이터만. 브라우저 노출 X |
| `DATABASE_URL` | ❌ | 중앙만. RLS 우회 가능 → 공유 금지 |
| `OSMU_SECRET_KEY` | ❌ | 중앙만 |
| 채널 토큰 / GitHub PAT | ❌ | 중앙 DB에 암호화 저장, 서버에서만 복호화 |

토큰을 잃어버려도 피해는 **그 워크스페이스 하나**로 한정되며, 운영자가 **Settings → API 토큰 → 폐기**로 즉시 무효화합니다.

## 7. 팀별 배포 예시 (sample / sample)

각 팀은 자기 도메인(`marketing.{team}.it.kr`)에 포크를 띄우고, `OSMU_API_BASE`만 공통 중앙으로.

| 팀 | 배포 도메인(예) | `.env` 서버 설정 |
|---|---|---|
| sample | `marketing.example.com` | `OSMU_API_BASE=<중앙 URL>` · `OSMU_TENANT_TOKEN=<sample 토큰>` |
| sample | `marketing.example.com` 등 | `OSMU_API_BASE=<중앙 URL>` · `OSMU_TENANT_TOKEN=<sample 토큰>` |

- **`<중앙 URL>`**: 운영자(중앙) 인스턴스의 고정 공개 주소(터널/도메인). 두 팀 공통.
- **토큰**: 운영자가 Settings → API 토큰에서 팀별 발급. 서버 env에만(브라우저 노출 X).
- 토큰은 자기 워크스페이스 데이터에만 접근 — 서로의 데이터 못 봄(검증됨).

## 8. 진화 단계 (참고)

- **Phase 1(지금)**: 포크가 프론트만 띄움(프록시), 데이터는 중앙. ← 이 문서
- **Phase 2**: 백엔드까지 중앙 호스팅 → 팀은 순수 client(도메인 유지). 데이터 계층 동일.
- **Phase 3**: 외부 고객 대상 결제 + 클라우드 호스팅 SaaS.

---

> 데이터 계층(중앙 Supabase + RLS)은 Phase 1~3 동일 → 단계 전환 시 재설계 없음.
