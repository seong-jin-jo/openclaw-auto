# 남성 전략 숏폼 통제실험 v1

STAMP: 2026-08-14 03:45 KST / gpt-codex/gpt-5.6-sol / content-growth-marketer / brand-positioning-kit + hook-angle-lab + viral-trend-research / BRAIN 4 pages + TikTok Creative Center + YouTube official / 고민: 남성의 불안을 자극하되 타인 통제나 여성 비난으로 흐르지 않도록 자기 시간 회계 한 장면으로 압축했다.

## 결론

Kling 3.0 결과물 1편을 실제 생성하고 내려받았다. 720×1280, 8.042초, H.264, 24fps다. 견적과 실청구는 12크레딧으로 일치했다.

결과물은 휴대폰, 노트북, 운동화의 대비와 마지막 결심 동작을 구현했다. 그러나 프롬프트가 금지한 읽을 수 있는 휴대폰 UI 문자를 첫 4초 내내 생성했다. 발행 후보가 아니라 `ITERATE`다.

## 1. 포지셔닝

- 한 문장: 남성성을 타인 지배가 아니라 자기 약속, 시간 자본, 보호 가능한 안정성으로 번역하는 자기진단 채널.
- 청중: 스크롤, 관계 비용, 소득 정체가 연결돼 있다고 느끼는 20~30대 남성.
- 반청중: 여성을 공략 대상으로만 보거나, 피해의식을 팔아 즉효성 우월감을 얻으려는 시청자.
- 긴장: 위로보다 회계를 먼저 한다. 다만 수치심을 남성 전체의 결함으로 일반화하지 않는다.
- 금기: 여성 비하, 연애 조종술, 근거 없는 소득 약속, 가짜 통계, 실제 개인 사생활 재연.
- 톤: 직설적이되 모욕적이지 않음, 건조하되 냉소적이지 않음, 행동 중심이되 성공 신화를 팔지 않음.

## 2. 훅

- raw provocative version: `휴대폰을 내려놓지 못하는 남자는 가난해지는 중이다.`
- safer publish version: `스크롤 10분이 사라진 게 아니다. 네 미래에서 빠져나간 거다.`
- risk label: MEDIUM. 빈곤을 개인 의지 하나로 환원할 위험이 있어 본문에서 시간 선택의 한 장면으로만 제한한다.
- 장치: 손실회피 + 자기진단 + 대상 대비.
- 화면 훅: 손가락의 반복 스와이프 뒤에 닫힌 노트북과 신지 않은 운동화를 노출한다.

## 3. 전체 프롬프트 원장

### MS-P-BASE

```text
Rights-clean original with a fictional 29-year-old Korean man. Vertical 9:16, eight-second silent sequence. Camera viewpoint: intimate third-person at eye level throughout. Visual treatment: realistic editorial documentary, natural skin texture, cold blue evening light shifting to warm practical light. [0-2s HOOK] Macro close-up of his thumb endlessly scrolling a generic blank smartphone interface; blue light pulses across his tired face. [2-5s] The camera pulls back to reveal untouched running shoes and a closed laptop beside the sofa while he keeps scrolling. [5-8s] He stops, turns the phone face down, opens the laptop, and places the running shoes by the door with one calm decisive breath. Restrained acting, physically plausible motion, no readable text, no logos, no subtitles, no captions, no watermark.
```

### MS-P-HOOK-SLIP

MS-P-BASE에서 `[0-2s HOOK]`만 아래로 교체했다.

```text
[0-2s HOOK] The smartphone suddenly slips from his hand and lands face-down between the untouched running shoes and closed laptop; he stares at the three objects, startled by the contrast.
```

### MS-P-HOOK-EYE

MS-P-BASE에서 `[0-2s HOOK]`만 아래로 교체했다.

```text
[0-2s HOOK] Extreme close-up of his exhausted eye reflecting rapid anonymous vertical swipes; the reflected motion stops abruptly when he blinks.
```

### MS-P-POV

MS-P-BASE에서 시점 문장만 아래로 교체했다.

```text
Camera viewpoint: first-person over-hands POV throughout, as if the viewer is the man.
```

### MS-P-STOPMOTION

MS-P-BASE에서 시각 처리 문장만 아래로 교체했다.

```text
Visual treatment: tactile stop-motion editorial made from unbranded paper and fabric miniatures, cold blue evening light shifting to warm practical light.
```

## 4. 실제 결과 판정

| 항목 | 점수 | 관찰 |
|---|---:|---|
| 프롬프트 반영 | 4/5 | 휴대폰, 노트북, 운동화, 결심 동작이 순서대로 보임 |
| 구도 안정성 | 4/5 | 세로 구도 안정. 초반 손가락이 크지만 의도한 매크로 범위 |
| 인물·사물 일관성 | 4/5 | 한 인물과 동일 방이 유지됨 |
| 인공물 결함 | 2/5 | 휴대폰 UI에 읽을 수 있는 한글과 앱 형태를 생성. `no readable text` 위반 |
| 사업 적합성 | 3/5 | 자기진단은 전달되나 첫 4초가 일반적인 폰 클로즈업이고 자막 없이는 메시지가 약함 |
| 합계 | 17/25 | ITERATE |

다음 단일 변수는 `스마트폰 화면을 카메라 반대편으로 돌린 손등 클로즈업`이다. 화면 자체를 없애야 텍스트 결함이 사라지는지 검증한다.

## 5. 비용·실패

- 이 폴더 실제 지출: 12크레딧.
- 최초 제출 전 관찰 잔액: 356.42크레딧.
- MS-01~05 Veo: 계정 전체 동시작업 한도 6건 때문에 잡 ID 없이 거절, 실청구 0.
- MS-07 Seedance: 제출 직전 CLI가 free plan 0크레딧을 반환해 하한 게이트에서 차단. 잡 ID와 청구 없음.
- 계정 거래 원장에는 2026-08-14 03:39 KST경 `Subscription Cancelled -194.62 deduct`가 기록됐다. 본 실험이 실행한 동작이 아니며 이후 신규 생성은 중단했다.

## 6. 벤치마크 적용

- TikTok Top Ads의 초 단위 성과 분석과 문제 장면 개봉 구조를 차용했다. 특정 문구나 인물을 복제하지 않았다.
- TikTok 공식 가이드의 10~20초 단일 가치, 사람 중심, 자막 고려를 8초 무음 원본과 후편집 자막 분리로 바꿨다.
- YouTube Shorts 공식 인터뷰의 첫 1초 `shock, intrigue, satisfy`를 휴대폰, 운동화, 노트북의 물체 대비로 각색했다.

## 7. 레드팀·셀프심문

- 까다로운 시청자 공격: `또 남자에게 열심히 살라고 죄책감 파는 영상이다.` 수정: 사람의 가치가 아니라 한 번의 시간 선택을 진단하고, 여성이나 타인을 빌런으로 두지 않았다.
- 이 결론이 틀렸다면 가장 그럴듯한 이유: 시청자는 텍스트 없이 운동화와 노트북을 자기계발 강박의 상징으로 읽지 못한다. 따라서 현재 결과는 발행 통과가 아니라 후편집 카피를 붙이기 전의 장면 적합성만 증명한다.

SKILLS_USED: brand-positioning-kit(남성성의 윤리적 포지셔닝) / hook-angle-lab(raw·publish 훅과 위험 라벨) / viral-trend-research(2026 공식 숏폼 문법 조사)
SKILLS_SKIPPED: 없음

SOURCES: BRAIN `wiki/philosophy/인생철학/synthesis-남성성-thesis.md`; BRAIN `wiki/foundation/synthesis-시간-자본-thesis.md`; BRAIN `wiki/business/pmf/idea-단타-에이전트-경제채널.md`; BRAIN `wiki/business/synthesis-4페르소나-사업-OS.md`; https://ads.tiktok.com/help/article/top-ads?lang=en&redirected=1; https://ads.tiktok.com/business/en/guides/what-is-ad-creative-guide?redirected=1; https://blog.youtube/creator-and-artist-stories/youtube-shorts-deep-dive/; Higgsfield CLI 1.1.23 cost/create/get/account outputs; local ffprobe and contact-sheet inspection.
MODEL: gpt-codex/gpt-5.6-sol
RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=4/5 slop=5/5 total=22/25
WEAKEST_LINE: "다음 단일 변수는 스마트폰 화면을 카메라 반대편으로 돌린 손등 클로즈업이다." 구체적이지만 실제 잔액 소진으로 아직 검증하지 못했다.
