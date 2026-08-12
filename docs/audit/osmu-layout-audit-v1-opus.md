# OSMU 대시보드 레이아웃 감사 v1

회장 2026-08-12 지시("design.md 표준 하네스 참고해서 다시 점검. 레이아웃 여백 등 다 박살났다") 대응. 실제 배포 후보 대시보드(localhost:3456, tenant 5edb6703 고객 진입)를 8개 주요 화면 실촬영해 품질헌법(`~/.claude/standards/design.md`)·`DESIGN.md`·`docs/notes/ui-rules.md` 기준으로 진단하고, 심한 화면부터 공통 부품·시맨틱 토큰으로 수정했다.

## 실측 방법

- 운영자 Bearer로 `POST /api/tenant-tokens` → osmu_ 토큰을 localStorage.dashboard_auth_token 주입해 고객 화면 진입.
- gstack browse로 8화면 데스크톱(1024) 촬영, Home은 모바일(390)도 촬영. 스크린샷: `docs/audit/shots/`.
- 근거 등급: 전 화면 관찰됨(직접 렌더). 수정 검증: tsc exit 0 + 회귀 테스트 통과 + 재촬영.

## 화면별 진단표

| 화면 | 상태 | 주요 결함 | design.md 근거 | 조치 |
|---|---|---|---|---|
| Home(성과) | 심각 | ①성과 지표 3중 중복(성과 종합 "—" / 발행물 성과 실수치 / 운영현황 Published / THIS WEEK 완전중복) ②하드코딩 다크 클래스 10건(`bg-green-900/50`·`bg-red-900/40`·`text-red-400`·`bg-blue-900/50` 등)이 라이트 모드에서 near-black 렌더 ③알림 없을 때 Channels Status 카드가 `col-span-1`로 반쪽 폭(정렬 붕괴) | §3 편집자("무엇을 뺄지"), §9 Color(시맨틱 토큰), §9 Layout(정렬선 일관), CLAUDE.md "하드코딩 다크 클래스 금지" | ②③ 수정 완료, ① 백로그(기능삭제 금지 판단) |
| Settings(Channels) | 양호 | 2열 Social/Messaging 그리드 정렬·여백 일관. `--`(엔대시성 기호) 서브카피 1건 | §안티슬롭 대시 금지 | 백로그(경미) |
| Studio | 중간 | 좌측 메인 empty state가 과대 여백으로 붕 뜨고, 우측 발행이력 rail만 길어 좌우 비대칭. 데이터량 정상인데 좌측 공백 과다 | §9 정보밀도, 여백=의도 | 백로그(레이아웃 재배치 필요, 별도 작업) |
| Channel(threads) | 양호 | 공통 부품 마이그레이션 완료분. 하드코딩 다크 2건 잔존 | CLAUDE.md 토큰 규칙 | 백로그 |
| Videos | 양호 | 카드 그리드 정렬 일관, empty state 존재. 하드코딩 다크 1건 | - | 백로그 |
| Blog | 양호 | empty state 3종("키워드 없음"·"글 없음") 명확. 하드코딩 다크 5건(조건부 상태) | §7 빈상태 | 백로그 |
| Calendar | 양호 | 월 그리드 정렬·범례 명확. 하드코딩 다크 1건 | - | 백로그 |
| Operator | 별개 | tenant 토큰으론 진입 불가(운영자 전용 로그인 게이트) — 정상 동작 | §신뢰(거부 경로) | 해당없음 |

주: 전 화면 좌하단에 뜨는 검은 "N" 원은 Next.js dev 오버레이 인디케이터(프로덕션 미표시)로 제품 결함 아님. 사이드바 하단 테마토글/로그아웃이 가려 보이는 것은 이 dev 아티팩트 탓.

## 정량 측정 — 라이트모드 파괴 클래스

`(bg|text|border)-(색)-(800~900)` 하드코딩(CLAUDE.md 금지: 라이트에서 깨짐) 전역 **78건 / 약 30개 파일**. 최다: `UnifiedPostCard.tsx`(10) · `PostCard.tsx`(8) · `page.tsx`(7, 이번 수정으로 0) · `blog/page.tsx`(5).

## 이번에 수정한 것 (Home, `dashboard/src/app/page.tsx`)

| 위치 | before | after |
|---|---|---|
| 발행물 성과 표 상태 뱃지 | `bg-green-900/50 text-green-400` / `bg-red-900/40 text-red-400` | `bg-success/15 text-success` / `bg-danger/15 text-danger` |
| 표 실패 에러문 | `text-red-400` | `text-danger` |
| 에러 인디케이터 배너 | `bg-red-900/20 border-red-900/40` · `bg-red-500 text-text` · `text-red-300` | `bg-danger/10 border-danger/30` · `bg-danger text-white` · `text-danger` |
| tier 뱃지 | `bg-blue-900/50` | `bg-accent-soft` |
| Alerts 카드 보더/텍스트 | `border-red-900/50`·`border-yellow-900/50`·`text-red-400`·`text-yellow-400` | `border-danger/40`·`border-warning/40`·`text-danger`·`text-warning` |
| Channels Status 상태색 | `text-green-400`·`text-yellow-400` | `text-success`·`text-warning` |
| **Channels Status 폭(정렬 버그)** | `${alerts.length ? "" : "col-span-1"}` (반쪽) | `${alerts.length ? "" : "md:col-span-2"}` (전체 폭) |
| Agent Activity 뱃지 3건 | `bg-green-900/40`·`bg-yellow-900/40`·`bg-blue-900/40` | `bg-success/15`·`bg-warning/15`·`bg-accent-soft` |

결과: `page.tsx` 하드코딩 다크 클래스 **7→0**. tsc exit 0. `HomeDesignSystemIntegration`·`DesignSystem` 테스트 8건 통과. 재촬영 시 상태 뱃지가 소프트 그린/레드로 정상 렌더, Channels Status 전체 폭 정렬 확인. 콘솔 에러 0.

전후 스크린샷: `docs/audit/shots/home-1024-pre.png` → `home-1024-final.png`.

## Design Score (design-review 루브릭 적용, Home)

- **before: C+** — Color&Contrast D(라이트 파괴 뱃지 다수), Spacing&Layout C(폭 정렬 버그), Visual Hierarchy C(지표 3중 중복).
- **after: B** — Color&Contrast A-(전량 시맨틱 토큰), Spacing&Layout B+(폭 정합), Visual Hierarchy B(THIS WEEK 중복 1건 잔존→백로그). ≥B 합격선 통과.

AI Slop: B (앱 UI, 보라 그라디언트·3열 슬롭 없음. 랜딩 히어로의 블루 그라디언트 텍스트만 경미).

## 라운드 2 — 하드코딩 다크 전역 정합화 (완료, 2026-08-12)

회장 "사용하면서 수정" 방침으로 백로그 1번을 이어서 완수. 큐 카드부터 전 파일의 라이트모드 파괴 클래스를 `dashboard/CLAUDE.md` 명시 시맨틱 토큰(`text-success`·`text-danger`·`text-warning`·`bg-accent-soft`·`/15` 소프트 배경)으로 치환.

| 파일 | before | after | 대표 치환 |
|---|---:|---:|---|
| queue/UnifiedPostCard.tsx | 10 | 0 | 상태맵·채널뱃지·이미지제거·짧음/이미지필요·Delete |
| queue/PostCard.tsx | 8 | 0 | 상태맵·채널뱃지·이미지제거·Delete |
| queue/ImagePickerModal.tsx | 1 | 0 | 에러 배너 |
| app/blog/page.tsx | 5 | 0 | 상태맵·Delete |
| layout/Toast.tsx | 4 | 0 | success/error/warning/info → `bg-success text-white` 등 |
| settings/KwPlannerSettings.tsx | 4 | 0 | N/D 배지·configured 뱃지 |
| settings/DesignToolsSettings.tsx | 3 | 0 | connected 뱃지·경고 박스 |
| settings/AIEngine.tsx | 2 | 0 | 선택 카드 `border-accent bg-accent-soft`·`border-success bg-success/10` |
| channel/ChannelPage.tsx | 2 | 0 | 경고 배너·own-viral 뱃지 |
| blog-performance/page.tsx | 2 | 0 | 경고 카드 보더 |
| 그 외 14파일 (각 1건) | 14 | 0 | 뱃지·버튼·카드 보더·calendar 오늘 하이라이트 |
| **합계** | **68** | **0** | |

Home(라운드1) 7건 포함, **전역 하드코딩 다크 클래스 75 → 0**. 검증: tsc exit 0, `tests/components` 10파일 62건 통과, 채널 페이지 실렌더 콘솔 에러 0. 스샷: `docs/audit/shots/channel-queue-1024-post.png`.

### 추가 발견(제 수정 범위 밖 — 플래그만)
- **[Bug] 채널 Settings 상단 amber 알림에 원시 유니코드 노출**: `⚠재...` 형태로 디코딩 안 된 이스케이프 문자열이 그대로 렌더됨(콘텐츠/데이터 이슈, 색상 토큰과 무관). `verify-channel` 또는 알림 메시지 소스에서 `\u` 이스케이프를 실문자로 저장/디코드 필요.

## 남은 우선순위 백로그

1. **[Medium] Home 지표 중복 정리** — THIS WEEK 카드가 발행물 성과를 완전 중복. 제거 아닌 "기간 스코프 명확화(전체 vs 이번주)"로 통합 권장. 기능삭제 판단이라 회장/기획 확인 필요.
3. **[Medium] Studio 좌우 비대칭** — 메인 empty 여백 과다 + 우측 rail 편중. 메인/rail 비율·empty state 배치 재설계(별도 design loop).
4. **[Low] 엔대시/대시 기호 카피** — Settings 서브헤딩 등 `--` 잔재를 콜론/마침표로(design.md 안티슬롭 엠대시 금지).

## 재사용한 기존 자산

신규 시스템 발명 없음. `dashboard/src/components/shared/`의 `Stack`·`Section`·`Button`·`Card`·`Badge`와 `globals.css` 시맨틱 토큰(`--color-success/danger/warning`·`--accent-soft`·8pt spacing 유틸)만 사용. 수정은 전부 기존 토큰 치환.

---

🏷 STAMP | line: osmu | 생성: 2026-08-12 KST | model: claude-opus-4-8 | agent: product-designer
skills: design-review(Home 전후 채점·루브릭 적용), browse(8화면 실촬영) | SKILLS_SKIPPED: 없음
근거: ~/.claude/standards/design.md(Read) · DESIGN.md(Read) · docs/notes/ui-rules.md(Read) · dashboard/src 실코드 · 8화면 실렌더 캡처
고민: 지표 3중 중복은 명백한 R-09 결함이나 카드 제거는 "기능삭제 금지"에 걸려 회장 판단 백로그로 남기고, 확실히 안전한 토큰 위반·정렬 버그만 이번에 수정했다.

SOURCES: ~/.claude/standards/design.md · /DESIGN.md · docs/notes/ui-rules.md · dashboard/src/app/page.tsx · docs/audit/shots/*
MODEL: claude-opus-4-8 / product-designer
PRESENTATION_CHECK: 태그잔재 없음 확인 / 렌더 확인함(home-1024-final.png)
