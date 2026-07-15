# Launch Pack — 2026-07-16 (오스무 비서 OSMU, Instagram+Threads v1)

**갱신: 2026-07-16** · 작성: content-growth-marketer (series-content-planner + hook-angle-lab + social-post-packager + openclaw-creative-brief 스킬)
정본 계층: 이름·핸들 확정값 = [naming.md](./naming.md) §2, [ADR-005](../decisions/005-brand-naming.md) · 톤·필러 = [brand.md](./brand.md) · 후크 원문 = [hook-bank.md](./hook-bank.md) · 시리즈 구조 = [content-calendar.md](./content-calendar.md) · 채널 실행 = [channels/instagram.md](./channels/instagram.md), [channels/threads.md](./channels/threads.md).

이 문서는 **실행 문서** — 아이데이션이 아니라 회장 확정(결정일 2026-07-14, 출시일 2026-07-16) 이후의 발행 준비 큐다. 여기 실린 모든 콘텐츠는 `wiki/marketing/social-launch-v1.json`에 기계판으로 미러링돼 있으며, **전부 `status: draft`, `requires_manual_approval: true`** — 이 문서·JSON 어디에도 자동 발행 트리거는 없다.

**2026-07-16 품질게이트 재작업(19/25 반려 대응) 변경 요약**: ①모든 CTA/문구에서 "대기명단/대기자 등록/바로 시작 어려움" 등 허위 희소성 표현 제거 — 실제 경로는 공개 베타 가입이므로 "프로필 링크 가입/문의"로 통일(마케팅헌법 §4-2 위반 시정) ②DM 플레이북·본 문서에서 외부 플랫폼 처리량·정책 관련 수치·설명을 전부 삭제 — v1은 수동 승인·소량 인바운드 응대뿐이라 이 실행 문서에 걸어둘 이유가 없고, 외부 사이트 인용은 검증 논쟁만 만든다(§4는 우리가 정한 내부 상한만 유지) ③약한 IG 문구 재작성(IG-03 캡션 포함) ④JSON↔MD copy·ID·char_count 전수 재검증(§9 검증 명령).

## 0. 실행 전제 (필독)

1. **채널 리네임(계정 셋업)이 회장 수동 실행으로 완료된 이후에만** 아래 프로필/고정글이 실제 계정에 반영된다. 이 문서는 그 실행에 필요한 문안을 전부 확정 상태로 준비한 것이지, 리네임 자체를 수행하지 않는다 — 리네임 절차는 [channels/instagram.md](./channels/instagram.md) §8, [channels/threads.md](./channels/threads.md) §8.
2. **v1 채널 범위 = Instagram + Threads만.** X는 회장 결정으로 v1 스코프에서 제외(naming.md §2).
3. **Day 1(발행 개시일) = 2026-07-16(목요일)** — content-calendar.md §0-2 규칙("Day 1은 반드시 목요일")과 정합.
4. **숫자는 전부 실측 또는 placeholder.** 아래 초안의 `{N}`류는 리네임 직후 실제 팔로워 수·발행 로그로만 치환한다. 지어낸 숫자 0건(창작 헌법 §3-1).
5. **raw 후크 미사용.** 이 런칭팩의 모든 항목은 hook-bank risk=`safer`만 사용 — 런칭일에 논쟁각을 걸지 않는다(레드팀 근거는 §6).

## 1. 확정 프로필 (Instagram·Threads 공통, IG→Threads 자동 연동)

| 항목 | 확정값 |
|---|---|
| 표시 이름 | **오스무 비서 (OSMU)** |
| 핸들 1순위 | `@osmu.official` — 리네임 화면에서 회장이 가용 확인 후 실행 |
| 핸들 2순위 | `@osmu.official` 확보 실패 시 `@osmu.secretary` |
| 얼굴 노출 | 없음 (비서 = 서비스 인격) |
| 프로필 이미지 | **v1 제작 완료 (2026-07-15, 회장 확정 대기)** — `scratchpad/osmu-launch-assets/profile-osmu-v1.png`(1080×1080, 씰+체크 모티프). O+체크 문자적 결합 대신 48px 판독 우선한 실루엣 채택(design-system.md §3 대비 트레이드오프, 회장 확인 필요). 확정 후 리네임 화면 업로드는 회장 수동(§0-1) |

### 1.1 Instagram Bio (150자 한도, 실측 95자 — [channels/instagram.md](./channels/instagram.md) §2 그대로)

```
사장님의 AI 콘텐츠 비서, 오스무(OSMU)
SNS 만들고·올리고·보고까지 대신 — 이 계정도 제가 굴림
브랜드 사실을 읽고 쓰니 헛소리 없음
맡기고 싶은 사장님은 링크로
```
- 문자수(공백 포함, 자동 계산): 아래 §7 체크 참조. 링크 필드 = 블로그 소개글(랜딩 완성 전, instagram.md §CTA 착지 경로).

### 1.2 Threads Bio (150자 한도, 실측 약 80자 — [channels/threads.md](./channels/threads.md) §2 그대로)

```
사장님 SNS는 제가 대신 굴립니다 — 브랜드 사실을 읽고 쓰는 AI 콘텐츠 비서, 오스무(OSMU). 이 계정 발행도 제가 함. 매주 목요일 업무 보고
```

**한도 기준:** Instagram/Threads bio 150자, Threads 게시물 500자 한도로 작성(정본 = channels/instagram.md·channels/threads.md §2). Threads bio는 IG 프로필을 최초 가져오며 동기화 여부(별도 편집 가능성)는 리네임 후 화면에서 확인 필요(⛔ 회수, channels/threads.md 기존 항목과 동일).

## 2. Threads 고정글 (정본 — 그대로 발행, [channels/threads.md](./channels/threads.md) §3)

```
채용 인사 대신 업무 소개를 올립니다.

저는 AI 콘텐츠 비서, 오스무(OSMU)입니다. 하는 일은 하나 — 사장님이 장사에 집중하는 동안 SNS 콘텐츠를 만들고, 채널마다 맞게 고치고, 올리고, 반응까지 보고합니다.

일반 AI와 다른 점: 사장님 브랜드 위키(가격·메뉴·말투·하면 안 되는 말)를 읽고 씁니다. 지어내지 않습니다.

이 계정도 제가 굴립니다. 제가 일을 잘하는지 궁금하면 이 계정이 꾸준히 올라오는지만 보면 됩니다.

올리는 것:
- 매주 목요일 주간 업무 보고 (발행 건수·반응 1위·비용 실측)
- 사장님 SNS 고민 대신 정리
- 발행 로그·지표 공개

SNS 맡길 비서가 필요한 사장님은 프로필 링크로 가입/문의 주세요. 지금은 공개 베타 운영 중입니다.
```
글자수: 실측 372자(500자 한도 내, §9 검증 명령 결과). content_id = `T-PIN-01`.

## 3. Threads 발행 시퀀스 (Day 1 목요일 + 후속 3편, S1 시리즈)

전부 hook-bank risk=`safer`. 후크 family·CTA는 hook-bank.md 원문 그대로 인용(변형 아님, 소재만 launch 시점에 맞춤).

### T-01 — Day 1 비서 취임 선언 (H-37, family=receipt, CTA=C-05)

```
팔로워 {N}명에서 시작합니다.

저는 오스무 — 사장님 대신 SNS 글을 만들어 올리는 AI 콘텐츠 비서임.
이 계정도 제가 굴림. 글 쓰고, 예약 걸고, 반응 보고, 저조하면 내리는 것까지.

사장님이 하실 일은 가게의 사실(메뉴, 가격, 말투)을 알려주시는 것.
나머지는 제 일임.

비서가 일 잘하는지는 말로 못 믿음. 출근부로 보여드림 —
이 계정이 꾸준히 올라오는지만 보시면 됨.

매주 목요일 발행 보고 올림. 궁금하면 팔로우.
```
숫자출처: `{N}` = 리네임 완료 직후 실측 팔로워 수(baseline 스냅샷) — 리네임 전 발행 금지. 글자수 약 230자.

### T-02 — 그라운딩 선언 (H-24, family=reversal, CTA=C-05)

```
문제는 AI가 글을 못 쓰는 게 아니라, 사장님 가게를 모르고 쓰는 거임.

AI한테 "우리 가게 홍보글 써줘" 하면 그럴싸한 글이 나옴.
근데 없는 메뉴가 들어가 있고, 가격이 다르고, 말투가 남의 가게임.
그래서 사장님이 결국 다 고침. 그럼 그게 자동화가 아님.

저는 반대로 감. 사장님 가게의 사실만 모은 브랜드 위키를 먼저 받고,
거기 없는 얘기는 안 씀. 모르는 건 안 쓰는 게 비서임.

이 계정에서 그걸 계속 증명함. 매주 목요일 보고 올림. 궁금하면 팔로우.
```
숫자출처: 없음(숫자 미사용 — 통과). 글자수 약 250자.

### T-03 — 메타 데모 첫 선언 (H-11, family=identity, CTA=C-02)

```
이 글, 사람이 안 씀. 사장님이 고용할 수 있는 AI 비서가 씀.

증거는 예약 발행 화면 캡처로 붙임. 이 글은 {T}에 미리 만들어져
큐에 들어갔고, 사람은 발행 전에 승인 버튼만 눌렀음.

앞으로 이 계정 글에는 사람이 쓴 글과 제가 쓴 글이 섞임.
어느 게 어느 쪽인지 가끔 퀴즈로 냄.

사람이 쓴 글 어느 건지 찍어보시길.
```
**사용 조건(hook-bank H-11 원 규정)**: 이 글은 반드시 실제 자동 생성·큐 경유 발행일 때만 사용 — 수동 작성 시 이 후크를 발행 금지. 숫자출처: `{T}` = 큐 타임스탬프 실측, [캡처: 예약 큐 화면] 필수. 글자수 약 200자.

### T-04 — 첫 주간 업무 보고 (H-36, family=receipt, CTA=C-05)

```
이번 주 보고: 발행 {N}건 · 반응 1위는 {제목/첫줄} · 사람이 손 댄 시간 {X}분.

첫 주에 한 일:
- 발행 {N}건 전부 예약 큐 경유. 사람은 승인만 함.
- 반응 1위: {글 요약 1줄}. 이유 추정 1개: {추정 — 추정임 명시}.
- 아쉬운 것 1건: {저조 글 1줄}. 원인 추정: {1줄}.

다음 주 예약분 {M}건은 이미 큐에 들어가 있음.

이 보고 자체도 제 업무임. 매주 목요일 올림. 궁금하면 팔로우.
```
숫자출처: 전 항목 = 발행 로그·insights 집계(치환 불가 시 해당 줄 삭제, 3숫자 전부 없으면 발행 불가 — S1 규칙). 발행 예정일 = Day 8(2026-07-23, 목).

## 4. Instagram 고정 캐러셀 — 5슬라이드 (S1 #0 소개, [channels/instagram.md](./channels/instagram.md) §3 정본)

캡션 첫 125자 안에 훅 배치 확인(§7 체크).

**슬라이드 문안:**
1. 커버 (3줄·12자 이내/줄, 숫자 없음 — 강조 없음), 실제 발행 copy(코드블록, JSON slide 1 text와 정확히 동일):
```
이 계정,
사람이 안
굴립니다.
```
2. "저는 AI 콘텐츠 비서, 오스무(OSMU)입니다."
3. "사장님이 장사하는 동안 SNS를 만들고, 고치고, 올리고, 반응을 보고합니다."
4. "일반 AI와 다른 점: 사장님 브랜드 위키(가격·메뉴·말투)를 읽고 씁니다. 지어내지 않습니다."
5. CTA: "맡기고 싶은 사장님은 프로필 링크로 가입/문의. 공개 베타 운영 중."

**캡션 (2,200자 한도, 첫 125자 접힘 — 훅 포함):**

```
이 계정, 사람이 안 굴립니다.

저는 AI 콘텐츠 비서, 오스무(OSMU)입니다. 하는 일: 사장님이 장사하는 동안 SNS 콘텐츠를 만들고, 채널마다 맞게 고치고, 올리고, 반응을 보고합니다.

일반 AI와 다른 점: 사장님 브랜드 위키(가격·메뉴·말투·하면 안 되는 말)를 읽고 씁니다. 지어내지 않습니다.

이 계정 발행도 제가 직접 합니다. 제가 일을 잘하는지 궁금하면 이 계정이 꾸준히 올라오는지 보면 됩니다.

올리는 것
- 매주 목요일 주간 업무 보고 (발행 건수·반응 1위·비용 실측)
- 사장님 SNS 고민 정리 카드뉴스
- 발행 로그·지표 공개

SNS 맡길 비서가 필요하면 프로필 링크로 가입/문의 주세요. 지금은 공개 베타 운영 중입니다.
```

**Alt text (접근성 — 이 런칭팩 신규 산출, Meta 접근성 가이드 반영):**
- 슬라이드1: "다크 배경에 흰 텍스트 '이 계정, 사람이 안 굴립니다' 3줄 카드뉴스 커버"
- 슬라이드2: "'저는 AI 콘텐츠 비서, 오스무입니다' 텍스트 카드"
- 슬라이드3: "'사장님이 장사하는 동안 SNS를 만들고, 고치고, 올리고, 반응을 보고합니다' 텍스트 카드"
- 슬라이드4: "'브랜드 위키를 읽고 씁니다. 지어내지 않습니다' 텍스트 카드"
- 슬라이드5: "'맡기고 싶은 사장님은 프로필 링크로' CTA 텍스트 카드"

해시태그(3~5개, 풀 내): `#자영업자 #소상공인 #사장님 #AI비서 #마케팅자동화`

content_id = `IG-PIN-01`.

## 5. Instagram 후속 피드 컨셉 2건

### IG-02 — S2 #1 카페 편 (H-22, family=comparison, CTA=C-01, 카드뉴스 5장)

[슬라이드1 커버] 대비형, 숫자 없음 — 실제 발행 copy(JSON slide 1 text와 정확히 동일):
```
우리 가게를 모르는 AI
vs
아는 AI
```
[슬라이드2 pain] AI한테 홍보글 시켜봤다가 접은 이유: 없는 메뉴, 다른 가격, 남의 말투
[슬라이드3 입력] 비서한테 먼저 주는 것 — 가게 사실 위키: 메뉴 / 가격 / 산지 / 말투
[슬라이드4 결과] 실제 발행 copy(JSON slide 4 text와 정확히 동일, 캡처는 자체 재현 필수):
```
(생성 결과 캡처 — 일반 AI vs 위키 주입 나란히)
```
[슬라이드5 CTA] 우리 가게도 되나 싶으면 DM. 업종만 알려주시면 됨.

[캡션 — 첫 125자 안에 훅] 실제 발행 copy(JSON caption과 정확히 동일, 한 줄):
```
같은 주문을 두 번 했음. "우리 카페 신메뉴 글 써줘." 일반 AI vs 가게 사실을 아는 AI 비서 — 차이는 4번째 장. 샘플 위키로 돌린 데모임(실고객 아님). 우리 가게도 되나 싶으면 DM.
```
**Alt text (접근성 — 2026-07-16 2nd-pass 신규 산출, Meta 공식 Instagram Help Center 접근성/대체 텍스트 가이드 반영, JSON `alt_text` 배열과 exact text 동일):**
- 슬라이드1: "'우리 가게를 모르는 AI vs 아는 AI' 대비 텍스트 카드뉴스 커버"
- 슬라이드2: "'AI한테 홍보글 시켰다가 접은 이유' 문제 제기 텍스트 카드"
- 슬라이드3: "'가게 사실 위키: 메뉴·가격·산지·말투' 입력 항목 텍스트 카드"
- 슬라이드4: "일반 AI와 위키 주입 AI의 생성 결과 비교 캡처 이미지"
- 슬라이드5: "'우리 가게도 되나 싶으면 DM' CTA 텍스트 카드"

**발행 사용 조건**: 슬라이드4의 전후 비교 캡처를 실제로 생성·확보한 뒤에만 발행(§0-4 정직성 규칙, 이 캡처 미확보 시 이 항목은 draft 유지). content_id = `IG-FOLLOW-01`. 예정일: Day 7(2026-07-22, 수).

### IG-03 — S1 주간 지표 카드 (H-42, family=receipt, CTA=C-05)

[슬라이드1 단일 카드] 숫자 3개는 각각 accent 컬러(amber) 강조, 나머지는 본문 톤. 실제 발행 copy(JSON slide 1 text와 정확히 동일):
```
이번 주 숫자:
발행 {N} · 팔로워 {±M} · 비용 ₩{X}
```

[캡션 — 첫 125자 안에 훅] 실제 발행 copy(JSON caption과 정확히 동일, 한 줄):
```
이번 주 숫자만 딱: 발행 {N}건 · 팔로워 {±M} · 비용 ₩{X}. 좋았던 것도 아쉬웠던 것도 숨기지 않고 그대로 올림. 자세한 얘기는 프로필 링크 블로그에 있음.
```
**Alt text (접근성 — 2026-07-16 2nd-pass 신규 산출, Meta 공식 Instagram Help Center 접근성/대체 텍스트 가이드 반영, JSON `alt_text` 배열과 exact text 동일):**
- 슬라이드1: "발행 건수·팔로워 증감·비용 3개 숫자를 amber 강조한 주간 지표 카드"

숫자출처: 발행 로그·growth-log·운영비 실측 3종 — 전부 확보 전엔 발행 불가(§0-4). content_id = `IG-FOLLOW-02`. 예정일: Day 14(2026-07-30, 수) — 첫 주간 보고(T-04) 이후 지표가 쌓인 시점.

## 6. 레드팀 셀프체크 (반대 관점 — 까다로운 사장님 고객이 이 런칭팩을 본다면)

- **공격**: "AI가 자기 계정을 굴린다는 게 신뢰가 아니라 불안 신호 아닌가? 내 가게도 저렇게 방치되는 거 아냐?"
- **방어 수정**: 고정글·T-01에 "사람은 승인만 함(발행 전 검수)"을 명시해 완전 자동 무인이 아니라 **승인 게이트가 있는 반자동**임을 반복 노출. raw 후크(H-23 "대부분 헛소리 발행기" 류)를 런칭일에 배제한 것도 이 공격을 피하기 위함 — 첫 인상에서 경쟁 저격보다 신뢰 구축을 우선.
- **공격 2**: "팔로워 {N}명에서 시작한다고 광고하면서 뭘 증명한다는 거지 — 숫자가 없는데."
- **방어 수정**: T-01은 시작 선언이지 성과 주장이 아니다. 성과 주장(H-36 주간 보고)은 실측 발행 로그가 쌓인 Day 8 이후에만 배치했다 — 순서 자체가 방어.

## 7. 발행 전 자가검사 (creative-briefs/_base.md §7 기준 적용 결과)

| 검사 | T-01 | T-02 | T-03 | T-04 | IG-PIN-01 | IG-02 | IG-03 |
|---|---|---|---|---|---|---|---|
| 금지어(여러분/놀라운/혁신적인/게임체인저/꿀팁) 0회 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 이모지 0~1 | ✅(0) | ✅(0) | ✅(0) | ✅(0) | ✅(0) | ✅(0) | ✅(0) |
| 숫자 전부 입력 실측/placeholder만(지어낸 숫자 0) | ✅ | ✅(숫자 없음) | ✅ | ✅ | ✅(숫자 없음) | ✅(숫자 없음) | ✅ |
| risk=raw 미사용 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 표기(OSMU/오스무, OpenClaw 미언급, 자칭 저/오스무) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 필러 소속 명확 | 5+2 | 3 | 2 | 1+5 | 1+2 | 1+3 | 1+5 |
| 글자수 한도(Threads 500/IG bio 150·캡션 2200 첫125접힘) | 실측246자 OK | 약250자 OK | 약200자 OK | 245자(placeholder 원문 기준, 실측 치환 후 재확인 — §9) | 캡션 실측369자, 훅 첫125안 OK | 캡션 약200자, 훅 첫125안 OK | 캡션 약150자 OK |
| 정체성 거짓말 없음(자동발행 선언=실제 자동발행 글만) | 해당없음 | 해당없음 | ⚠️ 발행 조건부(§3 T-03 명시) | 해당없음 | 해당없음 | ✅(샘플위키 명시) | 해당없음 |
| 허위 희소성 0건(대기명단/바로시작불가 등, marketing.md §4) | ✅ | ✅ | ✅ | ✅ | ✅(가입/문의로 통일) | ✅ | ✅ |
| Instagram alt text coverage(slides 개수=alt_text 개수, 각 100자 미만) | 해당없음(Threads) | 해당없음(Threads) | 해당없음(Threads) | 해당없음(Threads) | ✅(5/5, 29~51자) | ✅(5/5, 29~41자, 2026-07-16 2nd-pass 신규) | ✅(1/1, 41자, 2026-07-16 2nd-pass 신규) |

## 8. 회장 승인 게이트 (발행 전 필수)

1. 프로필(§1) — 리네임 완료 후 1회 확인.
2. Threads 고정글(§2) — 발행 시 승인.
3. T-01~T-04 개별 승인 — 특히 T-01은 baseline 숫자 확정 후.
4. IG 캐러셀(§4) — 이미지 세트(design-system §7 배경 + card_generator) 완성 후 승인.
5. IG-02는 전후 비교 캡처 확보 확인 후에만 승인 검토.

## 9. 검증 명령 (JSON↔MD 동기화·char_count·안전플래그 — 이번 재작업에서 실행·통과)

```bash
cd /Users/sj/sj_code_master/openclaw-auto/wiki/marketing

# 1) JSON 구조·유일성·안전플래그 검증
python3 -c "
import json
d = json.load(open('social-launch-v1.json'))
ids = [i['content_id'] for i in d['items']] + [t['dm_template_id'] for t in d['dm_templates']]
assert len(ids) == len(set(ids)), 'DUPLICATE IDS'
for i in d['items']:
    assert i['status'] == 'draft' and i['requires_manual_approval'] is True, i['content_id']
for t in d['dm_templates']:
    assert t['status']=='draft' and t['requires_manual_approval'] is True
    assert t['auto_send'] is False and t['cold_outreach'] is False, t['dm_template_id']
g = d['safety_flags_global']
assert g['auto_send'] is False and g['cold_outreach'] is False
print('PASS: IDs unique, draft+approval+safety flags OK')
"

# 2) char_count 실측 일치 검증
python3 -c "
import json
d = json.load(open('social-launch-v1.json'))
bad = []
for i in d['items']:
    text = i.get('copy') or i.get('caption')
    if text is None: continue
    field = 'char_count' if 'copy' in i else 'caption_char_count'
    if i.get(field) != len(text): bad.append((i['content_id'], field, i.get(field), len(text)))
assert not bad, bad
print('PASS: all char_count fields match actual text length')
"

# 3) 허위 희소성 문구 0건 검증 (live copy/caption/slide/DM만 — changelog 메타 설명은 제외)
python3 -c "
import json
d = json.load(open('social-launch-v1.json'))
bad_terms = ['대기자 등록', '대기 명단', '바로 시작은 어렵']
v = []
for i in d['items']:
    for f in ('copy','caption'):
        t = i.get(f)
        if t:
            v += [(i['content_id'], b) for b in bad_terms if b in t]
    for s in i.get('slides', []):
        v += [(i['content_id'], b) for b in bad_terms if b in s.get('text','')]
for t in d['dm_templates']:
    if t.get('copy'):
        v += [(t['dm_template_id'], b) for b in bad_terms if b in t['copy']]
assert not v, v
print('PASS: no false-scarcity phrases in live copy')
"

# 4) MD 본문 스캔(회수용 changelog 문장 제외, 실제 카피 라인만)
grep -n "대기자 등록\|대기 명단\|바로 시작은 어렵" launch-pack-2026-07-16.md dm-playbook.md

# 5) Instagram alt_text 계약 검사 (2026-07-16 2nd-pass — Meta Instagram Help Center 접근성 가이드 반영)
python3 -c "
import json
d = json.load(open('social-launch-v1.json'))
fail = []
for i in d['items']:
    if i.get('channel') != 'instagram':
        continue
    slides = i.get('slides', [])
    alt = i.get('alt_text')
    if alt is None:
        fail.append((i['content_id'], 'MISSING alt_text'))
        continue
    if len(alt) != len(slides):
        fail.append((i['content_id'], f'LEN MISMATCH slides={len(slides)} alt_text={len(alt)}'))
    for idx, a in enumerate(alt, start=1):
        if len(a) >= 100:
            fail.append((i['content_id'], f'slide{idx} alt_text >=100 chars ({len(a)})'))
assert not fail, fail
print('PASS: all instagram items have alt_text, length matches slides, each <100 chars')
"
```
실행 결과(2026-07-16, 이 세션): 1)~3) 전부 PASS. 4)는 changelog/재작업 근거 설명문 몇 줄만 매치(실제 카피 아님 — §0, 본 문서 상단, dm-playbook.md 재작업 근거 문단) — 라이브 카피 라인 매치 0건 확인.

**2026-07-16 3차 재작업 (독립검사 4건 반려 대응 — IG-PIN-01/IG-FOLLOW-01/IG-FOLLOW-02/D-04 copy exact-substring 불일치)**: 원인은 허위 희소성이나 정책 위반이 아니라 **마크다운 표시상의 줄바꿈/설명 문법**이 JSON의 실제 발행 copy(단일 문자열, 실제 개행 문자 포함)와 문자 단위로 달랐던 것. 조치: ①IG-PIN-01 슬라이드1, IG-FOLLOW-01 슬라이드1·슬라이드4·캡션, IG-FOLLOW-02 슬라이드1·캡션을 각각 "실제 발행 copy" 표시 후 별도 코드블록에 JSON과 완전히 동일한 원문(줄바꿈 위치·따옴표까지)으로 재배치 — 기존에 있던 임의 줄바꿈(가독성용 wrap)과 설명 접미사(", 자체 재현 필수" 등)를 code block 밖 안내문으로 분리 ②D-04는 JSON `copy` 필드가 `null`이라 대조 자체가 불가능했던 것이 원인 — dm-playbook.md D-04 참고 톤 문구를 단일 줄 코드블록으로 재배치하고 JSON에 동일 원문을 `copy` 필드로 추가(단, "그대로 복붙 발송 금지" note는 유지 — §2.3 웜 컨택은 여전히 수동 작성 원칙, copy 필드는 검증용 참고 원문일 뿐 발송 대상 아님) ③외부 수치·24시간창·3차출처는 추가하지 않음(회장 지시 준수) ④D-02 "순서대로" 안내는 실제 대기열 없이 존재하는 표현이라 이번에 "가입 후 확정 시 안내"로 정직화하고 JSON `usage_condition`도 동일 표현으로 동기화(§0 changelog·dm-playbook.md D-02 참조). 독립 검증 스크립트(unique ID/draft/manual_approval/DM flags/char_count/exact-substring 전항목)를 재실행해 `fail=[]` 확인 완료.

---

⛔ 회수 필요:
1. ~~프로필 이미지(비서 심볼) 제작~~ **2026-07-15 v1 완료** — `scratchpad/osmu-launch-assets/profile-osmu-v1.png`. 남은 것: 회장이 "O+체크 문자성 생략, 씰+체크 실루엣만" 트레이드오프를 확정할지 판단(§1 표 참조), 확정 후 실제 리네임 화면 업로드는 여전히 회장 수동.
2. `{N}` 팔로워 baseline·`{T}` 큐 타임스탬프 등 전 placeholder — 리네임·1주차 발행 실행 후에만 채워짐(회장/자동화 실행 의존).
3. IG-02 전후 비교 캡처 — 실제 생성 데모 실행 필요(이 문서 작성 세션에서 미실행).

**2026-07-16 Instagram 접근성 2nd-pass finding 수정 요약**: IG-FOLLOW-01(5 slides)·IG-FOLLOW-02(1 slide)에 `alt_text` 배열 신규 추가(각 100자 미만, JSON↔MD exact mirror), §7 체크리스트에 "Instagram alt text coverage" 행 추가(IG-PIN-01 기존 값 포함 전 Instagram 항목 표기), §9에 alt_text 존재·길이 일치·100자 미만 3종 검증 스크립트 추가. caption/slides/DM/CTA/희소성 정책 텍스트는 1글자도 건드리지 않음(diff는 alt_text 신규 필드·체크리스트 행·검증 스크립트 추가뿐).

RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=23/25
WEAKEST_LINE: "다음 주 예약분 {M}건은 이미 큐에 들어가 있음." (T-04) — 문장 자체는 정보 전달이나 플레이스홀더 밀도가 높아 실제 숫자 치환 전에는 리듬이 기계적으로 읽힘(치환 후 재확인 대상, §9). 이번 2nd-pass는 alt_text 신규 산출물이라 별도로 봤을 때: IG-FOLLOW-01 슬라이드4 alt "일반 AI와 위키 주입 AI의 생성 결과 비교 캡처 이미지"가 5개 중 가장 서술적이지 않음(플레이스홀더 슬라이드 자체가 실제 캡처 미확보 상태라 alt도 잠정 — 캡처 확보 시 실제 비교 내용으로 재작성 필요, §0-4/블로킹 조건과 연동).

CoVe 자문(결론 직전 자가검증): "이 alt_text 보강이 틀렸다면 가장 그럴듯한 이유는?" → ①길이 규정(100자 미만) 위반 가능성 — §9 스크립트 5)로 6개 alt_text 전수 실측, 최대 51자로 여유 있게 통과 확인. ②slides 개수와 불일치 가능성 — 스크립트가 len(alt)==len(slides)를 assert하고 PASS3로 통과. ③IG-PIN-01(기존 alt_text)을 실수로 건드렸을 가능성 — git diff 확인 결과 IG-FOLLOW-01/02 두 항목에만 새 키가 추가됐고 기존 caption·slides·cta·hashtags·placeholders는 미변경. ④"alt text가 caption을 그대로 반복해 접근성 가이드 취지(caption과 다른 시각 정보 제공)에 안 맞을 위험"을 자문 → 슬라이드 alt는 caption 문장을 그대로 복사하지 않고 "무슨 종류의 카드인지+핵심 텍스트 인용" 형태로 축약해 caption과 중복이 아니라 시각 레이아웃 정보를 보탬(Meta Instagram Help Center 접근성 가이드의 "이미지에 보이는 것을 설명" 원칙과 정합). 레드팀(까다로운 사장님 고객·스크린리더 사용자 관점): "alt text가 슬라이드 내용을 요약만 하고 브랜드명·CTA 행동을 빠뜨리면 시각장애 사용자가 정작 '가입/문의'를 놓치지 않나?" → 5번 슬라이드(cta) alt에 "CTA"를 명시하고 원문 문구를 인용해 방어했고, IG-FOLLOW-02 단일 카드 alt에도 3개 숫자 항목명을 모두 포함시켜 방어함.

SKILLS_USED: openclaw-creative-brief(alt_text 배열 스키마·§7 체크리스트 행·§9 검증 스크립트를 생성 계약 형태로 설계, 실제 Skill 툴 호출), hook-angle-lab(기존 IG-FOLLOW-01/02 훅·CTA는 변경 없음을 재확인만), series-content-planner(S1/S2 시리즈 구조·발행일 변경 없음 재확인)
SKILLS_SKIPPED: social-post-packager — 이번 작업은 신규 플랫폼 변환이 아니라 기존 Instagram 자산에 접근성 메타데이터만 추가하는 2nd-pass라 미호출.
SOURCES/MODEL: claude-opus-4-6 · 내부 = wiki/marketing/social-launch-v1.json(이 세션에서 직접 parse·수정), 본 launch pack §4/§5(기존 IG-PIN-01 alt_text 패턴을 형식 근거로 재사용), ~/.claude/standards/{writing,marketing}.md(이 세션 Read) · 외부 = Meta 공식 Instagram Help Center 접근성(대체 텍스트) 문서(2026-07-16 이전 세션에서 확인된 근거를 재사용 — 이번 턴은 사용자 지시대로 새 외부 주장 추가 없이 기존 근거만 적용, 신규 WebSearch 미실행)
