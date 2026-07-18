# Assets — 마케팅 자산 인벤토리

**갱신: 2026-07-18 (R4 Higgsfield 출시용 v1 선별).** 자산이 생기거나 위치가 바뀌면 이 표를 갱신한다.

| 자산 | 상태 | 위치 | 비고 |
|---|---|---|---|
| 계정 브랜드킷 (이름/bio/비주얼 브리프) | 이력 보존 (확정 승격 완료 — 현행 정본은 brand.md·naming.md) | [proposals/2026-07-07-brand-kit.md](./proposals/2026-07-07-brand-kit.md) | 3안 + 추천 (구판) |
| 계정 비주얼 목업 (로고·배너·썸네일·하이라이트) — **구 빌드로그 컨셉, 폐기 대상** | ⛔ 폐기 대상 (2026-07-11 컨셉 전환으로 무효 — naming.md/brand.md 참조) | [showcase.html](../../scratchpad/brand-visuals/showcase.html) + `scratchpad/brand-visuals/*.png/html` | 안 1(SJ 커서 모노그램) 기준 목업, 21 files/3.1M. **현행 공장 컨셉("OSMU 팩토리")과 불일치 — 재생성 필요, 재생성 전까지 사용 금지** |
| 공장 컨셉 배너 배경 v1 | 🟡 출시용 선별·직접 관찰 B- / 실제 플랫폼 crop 미검증 | `assets/brand/osmu-factory-banner-background-v1-claude-sonnet.png` | Higgsfield R4 `banner-02`, 좌측 텍스트 여백. 자동 design-review는 세션 한도로 미완료 |
| 공장 컨셉 썸네일 배경 v1 | 🟡 출시용 선별·직접 관찰 B- / 카피 합성 미검증 | `assets/brand/osmu-factory-thumbnail-background-v1-claude-sonnet.png` | Higgsfield R4 `thumb-02`, 넓은 헤드라인 여백 |
| 프로필 이미지 v1 (씰+체크 = "출고 완료 도장") | 🟡 출시용 선별 / 실제 Instagram crop 미검증 | `assets/brand/osmu-factory-profile-v1-claude-sonnet.png` | R4 avatar 후보는 O 모노그램 약화로 탈락, 기존 검증본 유지 |
| R4 후보 검토 허브 | 관찰됨 | `assets/brand/osmu-factory-r4-review-hub-v1-claude-sonnet.png` | 최종 공개 허브 1개. 후보 6개와 축소 시뮬레이션 포함 |
| Waitlist 랜딩 | 미존재 | — | playbook 우선순위 4 |
| "Made with" 워터마크/서명 | 미구현 | — | playbook 우선순위 2 (approve 통과 글만, 기본 off) |
| 공개 성과 페이지 (open metrics) | 미존재 | — | playbook 우선순위 3 (insights 데이터 재노출) |
| 채널 셋업 공개 가이드 (pSEO 시드) | 내부만 존재 | `dashboard/src/lib/setup-guides.ts` | playbook 우선순위 5 |

## 2026-07-12 시도 로그 — 브랜드 텍스처 생성 (실패, 크레딧 고갈 — 당시 컨셉 표기는 구 비서 워딩, 이력)

**결과: 이미지 0장 생산. `assets/brand/`는 빈 채로 남음.**

### 무엇을 하려 했나
design-system.md §7 프롬프트 가이드 기준으로 3종 배경 텍스처를 Higgsfield `product-photoshoot` CLI(`--mode moodboard_pin`/`hero_banner`, 모델 `gpt_image_2`)로 생성 시도:
1. 아바타 배경(원형 결재도장 모티프, 1:1)
2. 배너 배경(좌측 60% 네거티브 스페이스, 16:9)
3. 썸네일/카드뉴스 배경(헤드라인 자리 비운 다크 패널)

### 무슨 일이 있었나 (관찰됨)
- 세션 시작 시 `higgsfield account status` = **27 크레딧** (인증 정상).
- 아바타 배경 1차 시도(`--count 5`, `moodboard_pin`, `gpt_image_2`) → `Error: Cannot reach https://fnf.higgsfield.ai/agents/product-photoshoot/enhance.` 반복 4회(재시도 포함).
- 재확인 중 크레딧이 **27 → 6 → 4로 순차 하락**(내가 어떤 이미지도 생성 중이 아닐 때도 하락 관찰).
- `higgsfield generate list`로 최근 작업 21건 확인 → **전부 이 세션과 무관한 타 벤처 프롬프트**(한국 고3 수험생 책상, 신문 삽화, 한국 도심 야경 등, `gpt_image_2`/`seedream_v5_pro`). 내 프롬프트("seal stamp"/"checkmark"/"osmu") 매칭 작업은 0건.
- 진단: 이 Higgsfield 계정(`code0to1@gmail.com`, starter 플랜)은 **여러 벤처/세션이 동시 공유하는 크레딧 풀**이며, 이번 세션 작업 중 다른 세션이 실시간으로 크레딧을 소진함. 내 "Cannot reach" 에러 자체는 네트워크 블립으로 보이고(내 프롬프트로 생성된 job이 목록에 전혀 없음 = 과금 안 됨), 27→4 하락의 실제 원인은 **동시 사용 컨텍션**이지 내 실패 호출의 과금이 아님(job 21건 = 크레딧 손실 21과 정확히 일치).
- 추가 확인: `product-photoshoot`의 `gpt_image_2` 모드는 CLI 플래그로 해상도/퀄리티 조정 불가 — 내부 기본값 **2k/high = 7크레딧/장**(`higgsfield generate cost gpt_image_2 --resolution 2k --quality high` 실측). `--count 5` 요청 1건 = 35크레딧 필요 → 애초에 초기 27크레딧으로도 브리프가 가정한 "flux_2 1크레딧/이미지" 기준으로는 불가능한 예산이었음(브리프의 flux_2 가정과 실제 파이프라인의 `product-photoshoot`=`gpt_image_2` 모델 간 불일치, `(unsourced)`였던 원 브리프 가정을 실측으로 정정).
- 최종 확인 시점 잔여 4크레딧 — `gpt_image_2`(7cr/장) 기준 1장도 생성 불가. `flux_2` 직접 호출(1cr/장) 경로는 가능하나, 공유 풀이 실시간으로 계속 줄고 있어(관찰됨: 상태 조회만 했는데도 27→6→4) 지금 시도해도 완료 전 잔액 소진 위험이 높음. 후보군 선별(§7 파이프라인 "4~6장 생성→선별")이 구조적으로 불가능한 예산이라 강행하지 않고 중단.

### 재시도 전 필요 조치 (⛔ 회장 결정 필요)
1. **크레딧 확보**: 이 워크스페이스(`code0to1@gmail.com` starter)에 OSMU 브랜드 자산 생성용 크레딧을 별도 확보/충전하거나, 다른 벤처와 겹치지 않는 시간대에 예약 실행.
2. **모델 선택 재확인**: `product-photoshoot`(브랜드급 프롬프트 강화, `gpt_image_2` 2k/high 고정 7cr/장) vs `generate create flux_2`(직접 호출, 1cr/장, 프롬프트 강화 없음 — 수동 프롬프트 품질에 전적으로 의존). 브리프가 가정한 60크레딧 예산 기준으로도 `product-photoshoot` 경로는 3종×4~6장 후보군에 63~126크레딧 필요(60 초과) — flux_2 직접 경로 또는 후보 수 축소(카테고리당 2~3장) 재설계 필요.
3. Higgsfield 대시보드에서 이번 세션 무관 21건(21크레딧)의 정당성 확인 — 계정 공유 정책 재검토 여지.

SOURCES/MODEL: [Sonnet 5] · 실측 = `higgsfield account status`(3회 관찰: 27→6→4) · `higgsfield generate list --json`(21건 전수 확인, 프롬프트 무관 확인) · `higgsfield generate cost gpt_image_2`(7cr @ 2k/high, 0.5cr @ 1k/low) · `higgsfield generate cost flux_2`(1cr) · `higgsfield product-photoshoot create --help`(플래그 목록, 해상도/퀄리티 오버라이드 불가 확인) · design-system.md §7-8, naming.md, brand.md(2026-07-11 개정본)
