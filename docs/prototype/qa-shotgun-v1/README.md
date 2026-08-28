# 정보구조 3안 비교판 v1 · QA 캡처와 자산 대장

> STAMP: created_at=2026-08-17 KST | model=claude-opus-5[1m] | agent=product-designer |
> 대상 산출물 `docs/prototype/openclaw-auto-ia-shotgun-v1-gpt-codex.html` | 상태=회장 선택 대기(확정 아님)

## 1. 캡처 목록

| 파일 | 화면 | 폭 | 사용자 |
|---|---|---|---|
| `home-390.png` | 첫 화면 | 390 (세 안 나란히) | 두 번째 이후 |
| `home-1024.png` | 첫 화면 | 1024 (세 안 위아래) | 두 번째 이후 |
| `home-390-first.png` | 첫 화면 | 390 | 처음 가입 |
| `make-390.png` | 제작 시작 | 390 | 두 번째 이후 |
| `make-1024.png` | 제작 시작 | 1024 | 두 번째 이후 |
| `pick-390.png` | 후보 고르기 | 390 | 두 번째 이후 |
| `pick-1024.png` | 후보 고르기 | 1024 | 두 번째 이후 |

## 2. 기존 자산 재사용 (재창조 금지 대장)

새로 그리기 전에 무엇이 이미 있었고, 무엇을 그대로 가져왔고, 무엇만 새로 만들었는지의 대장이다.

### 2.1 v26 프로토타입에서 그대로 상속한 토큰

출처: `docs/prototype/openclaw-auto-marketing-agent-magazine-v26-gpt-codex.html`

| 갈래 | 상속한 값 | 신규 |
|---|---|---:|
| 앱 화면 팔레트 (라이트) | `--bg #fbfbfc` · `--surface #fff` · `--surface-2 #f4f4f5` · `--border #e4e4e7` · `--text #18181b` · `--muted #52525b` · `--subtle #71717a` · `--accent #2563eb` · `--accent-soft #eff6ff` · `--success #15803d` · `--success-soft #f0fdf4` · `--warning #b45309` · `--warning-soft #fffbeb` · `--danger #b91c1c` · `--danger-soft #fef2f2` | 0 |
| 비교판 크롬 팔레트 (다크) | `--hub-bg #0A0A0B` · `--hub-panel #161618` · `--hub-panel2 #1F1F23` · `--hub-line #27272A` · `--hub-text #F4F4F5` · `--hub-dim #A1A1AA` · `--hub-meta #9496A0` · `--hub-accent #3B82F6` · `--hub-ok #22C55E` · `--hub-warn #F59E0B` | 0 |
| 글자 크기 7단 | `--fs-caption 12` · `--fs-body-sm 13` · `--fs-body 15` · `--fs-lead 17` · `--fs-h3 20` · `--fs-h2 24` · `--fs-h1 30` (px). 줄높이 5단 `--lh-caption 18` · `--lh-body-sm 20` · `--lh-body 24` · `--lh-lead 26` · `--lh-h3 28` | 0 |
| 간격 (8pt 스케일) | `--space-1 4` · `-2 8` · `-3 12` · `-4 16` · `-5 24` · `-6 32` · `-8 48` (px). 내부 여백 `--pad-inset 16`, 줄 사이 `--stack-tight 8`, 블록 사이 `--stack 12`, 부품 사이 `--stack-section 24` | 0 |
| 형태 | 카드 `--radius 12px` · 컨트롤 `--control 8px` · 칩 99px · 모바일 프레임 30px · 데스크톱 프레임 16px | 0 |
| 서체 | `Pretendard` → `Noto Sans KR` → `Apple SD Gothic Neo` → system-ui. 모노는 스탬프 줄 전용 | 0 |

**신규 색 0개, 신규 서체 0개, 신규 글자 크기 단 0개.**

특기: 글자 크기 7단은 v26에 있다가 **v27에서 사라졌던 토큰**이다(회장 반려 사유 중 하나). 이번 비교판이 이 7단을 되살렸고 `DESIGN.md`에 다시 박았다.

### 2.2 v24 계보와 `dashboard/src`에서 이어받은 시각 어휘

프레임 안 앱 화면은 새 언어를 발명하지 않고 아래 부품 이름과 생김새를 그대로 이어 썼다.

| 부품 | 어디서 왔나 | 이번에 쓴 곳 |
|---|---|---|
| `panel` (흰 배경 + 1px 보더 + radius 12) | v24·v26 프로토타입, `dashboard/src` 카드 표면 | 아홉 화면 전부 |
| `list` / `list-row` (제목 굵게 + 아래 보조 한 줄 + 우측 상태) | v26 프로토타입, 채널 목록 실화면 | 채널 상태, 진행 중인 작업, 플랫폼 선택 |
| `status` 상태 배지 (기본·success·warning) | `Sidebar.tsx`의 `Live` / `Off` 배지, v26 상태 배지 | 연결됨·미연결, 초안·예약·발행 |
| `chip` / `chip.mini` (radius 99px 알약, blue·green·amber 톤) | v27 근거 칩 규격(11px/650) | 매체 종류 선택, 근거 표기 |
| `note` 좌측 3px 보더 고지 (기본·warn) | v27 정직 고지 규격 | 각 안의 대가·제약 문장 |
| `steps` 진행 표시 (높이 4px 바 n분할, gap 4px, done=accent) | v27 진행 표시 규격 | 2안 2단계, 3안 5단계 |
| `btn` / `btn.primary` / `btn.big` | v26·v24 버튼, `dashboard/src` 주 행동 | 아홉 화면 전부 |
| 224px 사이드바 + 그룹 헤더 + 항목 아이콘 사각 배지 | `dashboard/src/components/layout/Sidebar.tsx` 실물 | 1안 사이드바(실측 재현), 2·3안(같은 규격 위에서 항목만 변경) |
| `metric` 지표 카드 (라벨·값·증감 3줄) | 현행 개요(Marketing Home) 지표 카드 | 1안·2안 첫 화면 |

### 2.3 문서에서 이어받은 것

- 제작 순서(매체 종류 → 발행 플랫폼 → 결과 후보)와 판단 3갈래(이대로 올리기·다른 안 더 보기·품질 높여 다시 쓰기): `docs/requests/2026-08-16-회장-유저플로우-전면개정.md` 원문.
- 3안 사이드바 9항목(만들기·내 작업·성과·학습 정보·채널·소재·자료·설정·도움)과 "성과는 첫 발행 뒤에 등장": `docs/design-docs/user-flow-openclaw-service-v10.0-gpt-codex.md` §5.2.
- 학습 동의 문구("이 취향을 기억해둘까요"): 같은 문서 §7 L-04 계약.

### 2.4 이번에 새로 만든 것 (3개, 각각 사유 포함)

| 새로 만든 것 | 왜 기존 것으로 안 됐나 |
|---|---|
| `sumcard` 안 요약 카드 | 세 안을 나란히 비교하는 화면이 지금까지 없었다. 한 줄 요약 + 좋음 2줄 + 주의 2줄 구조. 좋음·주의를 색이 아니라 글자로 표시해 색만으로 뜻을 싣지 않는다 |
| `tradeoff` 아래 설명 블록 | "고르면 바뀌는 것 / 고르면 잃는 것"을 각 안 프레임 바로 아래 고정해야 회장이 화면과 대가를 한눈에 붙여 본다. 기존 프로토타입에는 이 짝이 없었다 |
| 비교판 셸 (3축 토글 + 화면 탭 + 프레임 3열) | v26 허브는 화면 하나를 여러 상태로 보는 구조였다. 이번은 **같은 화면을 세 안으로 동시에** 봐야 해서 열 구조가 다르다. 다만 토글 높이 32px·활성 accent 채움 등 규격은 v26 `matrix`를 그대로 따랐다 |

프레임 안 앱 화면에서 새로 만든 시각 부품은 **0개**다. 전부 위 2.2 어휘의 조합이다.

## 3. 현행 사이드바 항목 수: 코드 판정

**판정: 23줄이 맞다. 유저플로우 v10.0 문서의 "합계 21"은 오기다.**

근거는 `dashboard/src/components/layout/Sidebar.tsx`의 `CustomerSidebar`가 실제로 그리는 `<Link>`이며, 조건부 렌더는 하나도 없다(전부 무조건 렌더).

| 묶음 | 항목 | 수 | 출처 |
|---|---|---:|---|
| Overview | 개요, 스튜디오, 승인함, 발행 캘린더 | 4 | `Sidebar.tsx` 직접 작성 |
| Social | threads, x, instagram, facebook, bluesky | 5 | `channel-capabilities.ts` `CHANNEL_GROUP_DEFINITIONS` |
| Messaging | telegram, discord, slack | 3 | 같은 곳 |
| Video | youtube, tiktok | 2 | 같은 곳 |
| Data & Analytics | Blog Performance | 1 | `Sidebar.tsx` 배열 리터럴 |
| Keyword Research | Keyword Planner, Naver Trends, Google Trends | 3 | 같은 곳 |
| Custom Integration | Blog | 1 | `SidebarGroup` items |
| Assets & Tools | Images, Videos, Midjourney | 3 | `Sidebar.tsx` 직접 작성. Midjourney는 즉시실행 함수로 감싸여 있으나 **조건이 없어 항상 렌더된다** |
| System | Settings | 1 | `Sidebar.tsx` 직접 작성 |
| **합계** | | **23** | |

그중 채널 성격 묶음(Social 5 + Messaging 3 + Video 2 + Data 1 + Keyword 3 + Custom 1) = **15줄**, 나머지 8줄(개요·스튜디오·승인함·발행 캘린더·이미지·영상·미드저니·설정)이 채널이 아니다. 15 + 8 = 23.

**2줄 차이의 원인**: 유저플로우 v10.0 §5.1의 표는 위와 **같은 항목을 같은 순서로 나열해 놓고** 합계만 21로 적었다. 즉 항목 누락이 아니라 표 아래 합계의 산술 오기다(표의 행을 더하면 23이 된다). 비교판 화면 하단에도 이 수치를 근거와 함께 적어 두었다.

후속: 유저플로우 v10.0 §5.1의 "합계 21항목"을 23으로 고치고, `wiki/product/marketing-hub-surface-map.md`의 26항목 기술(더 낡음)도 함께 갱신해야 한다. 문서 수정은 그 라인 세션 소유라 여기서는 지적만 남긴다.

## 4. 실측 QA (browse 실렌더, 화면 3 × 폭 2 × 사용자 2 = 12조합 전수)

| 항목 | 값 |
|---|---|
| 내부 코드 노출 | 0 |
| 빈 화면 | 0 |
| 브라우저 대화상자 / 외부 링크 / `a` 태그 | 0 / 0 / 0 |
| 프레임 안 가로 넘침 | 0 |
| 내용 잘림 | 0 |
| 콘솔 오류 | 0 |
| 터치 타깃 미달 버튼 (390에서 44px, 1024에서 36px) | 0 |
| em dash / 이모지 / 그라디언트 | 0 / 0 / 0 |
| Design Score / AI Slop Score | B+ / A |

리테이크 3건: `container-name` 누락으로 컨테이너쿼리 무효 / 1024에서 3안 열 잘림 / 프레임 고정 높이로 후보 카드 잘림. 셋 다 실렌더 측정으로 잡아 수정 후 재측정했다.

SOURCES: `dashboard/src/components/layout/Sidebar.tsx` · `dashboard/src/lib/channel-capabilities.ts` · `docs/prototype/openclaw-auto-marketing-agent-magazine-v26-gpt-codex.html` · `docs/prototype/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html` · `docs/design-docs/user-flow-openclaw-service-v10.0-gpt-codex.md` · `docs/requests/2026-08-16-회장-유저플로우-전면개정.md` · `DESIGN.md`

MODEL: claude-opus-5[1m]
