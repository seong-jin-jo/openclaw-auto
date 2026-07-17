# Design System — 브랜드 비주얼 정본

**갱신: 2026-07-16 (워딩 전환: 비서→공장 "OSMU 팩토리").** 원출처: [proposals/2026-07-07-brand-kit.md](./proposals/2026-07-07-brand-kit.md) §5 → 얼굴 **비노출** 확정([naming.md](./naming.md) §2) + **콘텐츠 공장 컨셉**([ADR-005](../decisions/005-brand-naming.md), 2026-07-16 재개정)에 맞춰 조정. 팔레트·타이포·규격·파이프라인은 유지 — 로고 서술·태그라인·뱃지 의미 층만 공장 어휘로 교체 (씰+체크 비주얼 모티프 자체는 "출고 완료 도장"으로 공장 컨셉과 강정합, 재제작 불요).

**경계**: 이 문서 = **마케팅·브랜드 비주얼**(SNS 에셋·썸네일·배너·카드뉴스). 제품 대시보드 UI/UX 규칙은 [docs/ui-rules.md](../../docs/ui-rules.md)가 별도 정본 — 서로 침범하지 않는다. 겹치는 유일한 지점은 "대시보드 스크린샷을 마케팅 에셋에 쓸 때"이며, 그 경우도 본 문서의 팔레트·레이아웃 규칙을 따른다.

> 하위모델 규칙: 색은 아래 hex 외 사용 금지. 폰트는 아래 2종 외 금지. 판단이 필요하면 만들지 말고 `⛔ 회수 필요`로 중단.

## 1. 컬러 팔레트

| 역할 | hex | 용도 |
|---|---|---|
| Base (dark) | `#0B0F1A` | 배너·썸네일 기본 배경 (사장님 퇴근 후에도 돌아가는 "심야 가동 공장" 무드 — 프리미엄·신뢰) |
| Surface | `#151B2B` | 카드뉴스 배경, 썸네일 패널 |
| Accent primary | `#F59E0B` (amber) | 훅 텍스트, 숫자, 로고 포인트 — "가동 중인 불빛" |
| Accent sub | `#34D399` (mint) | 성공/지표 상승, 터미널 그린 |
| Text | `#F8FAFC` / `#94A3B8` | 본문 화이트 / 보조 그레이 |

규칙: **한 아트웍에 accent 1색만.** amber=훅/행동, mint=데이터. 라이트 변형은 카드뉴스에서만(`#F8FAFC` 배경 + `#0B0F1A` 텍스트).

## 2. 타이포

- KR: **Pretendard** — Bold/ExtraBold(훅), Regular(본문)
- 숫자·코드·로그: **JetBrains Mono** (지표, 파일명, 날짜에만)
- 무드: 기술적이되 차갑지 않게. 손글씨/세리프 금지. 자간 타이트, 좌측 정렬 기본.

## 3. 로고 (얼굴 비노출 + 공장 컨셉, 2026-07-16 서술 조정 — 회장 veto 가능)

> 구 "SJ 커서 블록 모노그램"·"`> sj` 워드마크"는 개발자 페르소나 유물 — 폐기. 씰+체크 모티프는 유지(비주얼 재제작 불요 — 의미 층만 공장으로 재서술).

1. **출고 완료 도장 모노그램** (프로필 아바타 정본): 원형 도장 형태 안에 "OSMU"의 O + 체크마크(✓), amber `#F59E0B` on `#0B0F1A` — "공장이 출고 완료 도장을 찍었다"는 은유(사장님 문화의 결재/도장 코드 + 제조 검수 코드). 전 플랫폼 동일 이미지. 원형 크롭·64px 축소에서 판독 생존 필수.
2. **`osmu ✓` 워드마크**: 워터마크·썸네일 코너 뱃지·카드뉴스 하단 서명("출고 검수 완료" 서명 기능). JetBrains Mono 소문자, 보조 그레이(`#94A3B8`) 기본, 강조 시 amber.

## 4. 플랫폼 이미지 규격 (2026-07 기준)

| 자산 | 규격 | 비고 |
|---|---|---|
| 프로필 (전 플랫폼 공통) | 1000×1000 원본 → 각 플랫폼 자동 축소 | 원형 크롭 안전권: 중앙 80% |
| YouTube 배너 | 2560×1440, **safe zone 1546×423 중앙** | 텍스트·로고는 safe zone 안에만 |
| YouTube 썸네일 | 1280×720 | §6 템플릿 규칙 |
| Instagram 피드/카드뉴스 | 1080×1350 (4:5) | 커버 슬라이드 = §6과 동일 문법 |
| Instagram 릴스/스토리 커버 | 1080×1920 | 중앙 1080×1350만 안전 |
| Threads/X 첨부 이미지 | 1200×675 (16:9) | 훅 텍스트 최대 2줄 |
| X 헤더 | 1500×500 | YouTube 배너 아트웍 변형 |

## 5. 배너 레이아웃 (YouTube 정본, 타 플랫폼 변형)

- safe zone 안: 좌측 60% = 태그라인(7~12단어, Pretendard ExtraBold, 2줄 이내) + 업로드 요일 1줄(JetBrains Mono, mint — "매주 목요일 주간 리포트").
- 우측 40% = OSMU 대시보드(발행 큐/리포트 화면) 스크린샷 15° 기울여 배치.
- 배경: `#0B0F1A` + 미세 그리드 패턴(불투명도 2%). 이모지·장식 아이콘 금지.
- 확정 태그라인: **"사장님 콘텐츠, 만들어서 출고합니다 — 매주 목요일 주간 리포트"** (naming.md §2 공장 워딩 정합, 2026-07-16)

## 6. 썸네일 템플릿 규칙 (YouTube·카드뉴스 커버 공통)

1. 배경 `#0B0F1A` 고정, 좌측 정렬 훅 텍스트 최대 3줄·12자/줄.
2. 숫자는 amber + JetBrains Mono로만 강조 ("11시간 날림", "월 4만원").
3. 우측 1/3 = 화면 캡처 또는 로고 아트 (얼굴 비노출 — 실사진 사용 금지).
4. 하단 좌측 코너 `osmu ✓` 뱃지 고정 (시리즈 인지 + "출고 검수 완료" 서명).
5. 시리즈 컬러바(상단): [content-calendar.md](./content-calendar.md) 시리즈 정의에 매핑 — 보고형=amber / 사례·데이터형=mint / 논쟁형=화이트.
6. **통과 기준**: 텍스트-배경 대비 4.5:1 이상 + 모바일 168px 축소에서 훅 판독 가능. 미달 시 반려.

## 7. AI 생성 프롬프트 스타일 가이드 (Higgsfield/이미지 생성용 — 복붙용 원문)

공통 스타일 블록 (모든 프롬프트 뒤에 붙인다):
```
dark navy background (#0B0F1A), amber accent lighting (#F59E0B), minimal tech aesthetic,
late-night workspace mood, clean composition, no text, no watermark, no human face,
high contrast, professional product-brand photography style
```

금지(네거티브): 사람 얼굴, 손글씨체, 세리프, 무지개색, 스톡사진 느낌의 웃는 모델, 클리셰 로봇/뇌 일러스트, "AI" 글자 장식.

용도별 베이스 프롬프트:
- **아바타 배경/브랜드 텍스처**: `abstract circular seal stamp motif with a glowing amber checkmark on dark navy, subtle grid pattern, macro depth` + 공통 블록
- **배너 배경**: `wide cinematic empty desk scene with a single monitor glow, amber rim light on dark navy, negative space on left 60% for text` + 공통 블록
- **썸네일/카드뉴스 배경**: `dark navy gradient panel with faint circuit-like grid, one amber light streak, large empty area for headline text` + 공통 블록

규칙: 텍스트는 AI 생성 이미지에 넣지 않는다 — 텍스트·로고·뱃지는 생성 후 HTML/디자인 툴로 얹는다(`no text` 필수). 생성물은 §6 통과 기준 + design-review 통과분만 채택.

## 8. 자산 파이프라인

```
프롬프트(§7) → Higgsfield 생성 → design-review QA(§6 기준) → assets/brand/ 저장
→ assets.md 인벤토리에 경로+용도+재생성 프롬프트 기록
```
기존 목업 21개(안 1 기준, `scratchpad/brand-visuals/`)는 레이아웃 참고용 — 최종 자산은 위 파이프라인 통과분만.

SOURCES/MODEL: [Fable 5] · 원출처 brand-kit §5(WebSearch 벤치마크 7건 기반: snappa/b2w/adobe 배너 규격 등) · 조정 이력 = 얼굴 비노출 확정(ADR-005) 반영, AI 프롬프트 가이드 신규(§7 — store-visual 스킬 파이프라인 규율 계승) · 2026-07-11 = 로고("SJ 커서"→씰+체크 스탬프)·태그라인·모티프를 비서 컨셉으로 교체(이력 각주) · **2026-07-16 = 워딩 전환(비서→공장): 로고 의미("발행 스탬프"→"출고 완료 도장")·배너 태그라인·뱃지 서명("출고 검수 완료")·§1 무드 서술만 공장 어휘로 재서술 — 팔레트 hex·타이포·규격·§7 프롬프트 구조 무변경** (naming.md 2026-07-16 확정판 정합, 회장 veto 가능)
