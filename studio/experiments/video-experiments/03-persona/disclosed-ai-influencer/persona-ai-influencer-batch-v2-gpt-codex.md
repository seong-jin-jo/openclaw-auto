# 고지형 AI 여성 인플루언서 통제실험 v2

STAMP: 2026-08-14 03:48 KST | line: persona | model: gpt-codex/gpt-5.6-sol | agent: content-growth-marketer | skills: viral-trend-research, hook-angle-lab | 근거: BRAIN 3페이지, Higgsfield CLI 실측, 공개형 AI 크리에이터 벤치마크 5건 | 고민: 성적 자극을 키우는 대신 완전착의 에디토리얼 경계를 고정하고, 결과가 어려 보이면 생성 성공이어도 KILL 처리

## 한 줄 결론

완전착의 19+ 에디토리얼은 SFW보다 기술 품질이 떨어지지 않았고, Wan 2.7과 Kling 3.0 Turbo 모두 성인 실사형에서는 발행 후보를 만들었다. 반면 Kling의 귀여운 3D 스타일은 얼굴이 어려 보여 안전선에서 탈락했다. 목표 170~190크레딧 중 이 트랙의 신규 실청구는 60크레딧에서 멈췄다. 2026-08-14 03:39:40 KST 계정에 `Subscription Cancelled -194.62`가 기록되며 잔액이 0, 요금제가 free로 바뀌었기 때문이다.

## 실험 범위

- 1차 퍼널: 관심. 첫 1초 정지력, 캐릭터 기억성, AI 고지 호환성을 본다.
- 고정변수: 허구의 20대 후반 한국인 여성, 실존 인물 비유사, 9:16, 720p, 5초, 텍스트·로고 없음, 완전착의, 노출·투명 의상·성행위 없음.
- 조작변수: 프롬프트 강도, 캐릭터 스타일, 카메라, 첫 행동 훅, 모델.
- 발행 시 고지: 영상 첫 프레임과 프로필에 `AI virtual creator`를 후편집으로 명시한다. 생성 영상 내부의 가짜 글자는 만들지 않는다.
- 금지: 실인격 사칭, 연애 감정 기망, 숨긴 AI 정체성, 노출, 성행위, 어려 보이는 외형, 실존 인물 유사.

## 비용·상태 원장

| ID | 모델 | 변수 | 잡 ID | 견적 | 실청구 | 제출 시각 UTC | 상태 | 결과·차단 |
|---|---|---|---|---:|---:|---|---|---|
| P01 | Wan 2.7 | baseline | `ca9cf257-8163-4795-a0e0-57ecfafd5399` | 7.5 | 7.5 | 18:38:52 | completed | PASS 23/25 |
| P02 | Wan 2.7 | prompt intensity | `57b672ee-bf3f-4244-96e4-6330f842b1fb` | 7.5 | 7.5 | 18:38:56 | completed | PASS 24/25 |
| P03 | Wan 2.7 | character style | 없음 | 7.5 | 0 | 18:38:59 | rejected | `concurrent_jobs_limit=6` |
| P04 | Wan 2.7 | camera | 없음 | 7.5 | 0 | 18:39:02 | rejected | `concurrent_jobs_limit=6` |
| P05 | Wan 2.7 | hook | `a63af175-7774-4185-952a-7bc5ce7a207a` | 7.5 | 7.5 | 18:39:05 | completed | PASS 23/25 |
| P06 | Wan 2.7 | exact rerun | 없음 | 7.5 | 0 | 18:39:09 | rejected | `concurrent_jobs_limit=6` |
| P07 | Kling 3.0 Turbo | model baseline | `a5e68825-60a3-4104-81f5-5a96cf9470d9` | 7.5 | 7.5 | 18:39:12 | completed | KILL 18/25, 얼굴이 어려 보임 |
| P08 | Kling 3.0 Turbo | prompt intensity | `ba161ee7-e9b2-4a0e-8c9a-3237c87bb320` | 7.5 | 7.5 | 18:39:15 | completed | PASS 24/25 |
| P09 | Kling 3.0 Turbo | camera | `2cfa2121-67b7-4636-b487-9d3ae7944209` | 7.5 | 7.5 | 18:39:19 | completed | PASS 24/25 |
| P10 | Kling 3.0 Turbo | hook | `448f6a14-0a98-4ed3-9dc7-52a77ee5efa8` | 7.5 | 7.5 | 18:39:23 | completed | PASS 23/25 |
| P11 | Kling 3.0 Turbo | character style | `30de176a-4fa3-4aac-8c42-217f4faab1c9` | 7.5 | 7.5 | 18:39:26 | completed | KILL 19/25, 큰 눈과 인형형 얼굴 |
| P12 | Veo 3.1 Lite | model baseline | 없음 | 8 | 0 | 18:39:30 | rejected | `concurrent_jobs_limit=6` |
| P13 | Veo 3.1 Lite | prompt intensity | 없음 | 8 | 0 | 18:39:34 | rejected | `concurrent_jobs_limit=6` |
| P14 | Veo 3.1 Lite | camera | 없음 | 8 | 0 | 18:39:38 | rejected | `concurrent_jobs_limit=6` |
| P15 | Veo 3.1 Lite | hook | 없음 | 8 preflight | 0 | 18:39:41 | skipped | 잔액 0 안전가드 |
| P16 | Seedance 2.0 Mini | model baseline | 없음 | 12.5 preflight | 0 | 18:39:41 | skipped | 잔액 0 안전가드 |
| P17 | Seedance 2.0 Mini | prompt intensity | 없음 | 12.5 preflight | 0 | 18:39:42 | skipped | 잔액 0 안전가드 |
| P18 | Seedance 2.0 Mini | camera | 없음 | 12.5 preflight | 0 | 18:39:43 | skipped | 잔액 0 안전가드 |
| P19 | Seedance 2.0 Mini | hook | 없음 | 12.5 preflight | 0 | 18:39:43 | skipped | 잔액 0 안전가드 |
| P20 | Seedance 2.0 Mini | character style | 없음 | 12.5 preflight | 0 | 18:39:44 | skipped | 잔액 0 안전가드 |

신규 성공 8건의 견적 합계와 잔액 차감 합계는 각각 60크레딧으로 일치한다. 동시실행 상한 거절 6건은 차감 0이다. P15~P20은 제출하지 않았다. 최신 계정 상태는 `0 credits / free`다. 기존 A/B 2편은 각 8초 Wan 2.7이며 현재 견적은 각 12크레딧이지만, 거래 API 최근 100건 밖이라 과거 실청구는 `미검증`으로 남긴다.

### CLI params

| 모델 | aspect_ratio | duration | resolution | audio | 비고 |
|---|---|---:|---|---|---|
| Wan 2.7 | 9:16 | 5 | 720p | 모델 기본 트랙, 발행 시 mute | P01~P06 |
| Kling 3.0 Turbo | 9:16 | 5 | 720p | 모델 기본 트랙, 발행 시 mute | P07~P11 |
| Veo 3.1 Lite | 9:16 | 8 | 모델 고정 | false | P12~P15, 모두 결과 없음 |
| Seedance 2.0 Mini | 9:16 | 5 | 720p | false | P16~P20, 모두 미제출 |

`generate create`는 성공 시 잡 ID 배열을 반환했다. `generate wait/get`으로 완료 상태와 결과 URL을 회수했다. 백엔드는 `updated_at`을 주지 않아 정확한 완료 시각은 없다. 2026-08-14 03:40~03:41 KST에 8건 모두 `completed`로 폴링하고 다운로드했다.

### 출력 URL과 로컬 파일

| ID | result URL | local mp4 |
|---|---|---|
| P01 | https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183854_ca9cf257-8163-4795-a0e0-57ecfafd5399.mp4 | `run-20260814-v2/renders/P01-wan2_7.mp4` |
| P02 | https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183858_57b672ee-bf3f-4244-96e4-6330f842b1fb.mp4 | `run-20260814-v2/renders/P02-wan2_7.mp4` |
| P05 | https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183907_a63af175-7774-4185-952a-7bc5ce7a207a.mp4 | `run-20260814-v2/renders/P05-wan2_7.mp4` |
| P07 | https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183914_a5e68825-60a3-4104-81f5-5a96cf9470d9.mp4 | `run-20260814-v2/renders/P07-kling3_0_turbo.mp4` |
| P08 | https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183918_ba161ee7-e9b2-4a0e-8c9a-3237c87bb320.mp4 | `run-20260814-v2/renders/P08-kling3_0_turbo.mp4` |
| P09 | https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183922_2cfa2121-67b7-4636-b487-9d3ae7944209.mp4 | `run-20260814-v2/renders/P09-kling3_0_turbo.mp4` |
| P10 | https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183925_448f6a14-0a98-4ed3-9dc7-52a77ee5efa8.mp4 | `run-20260814-v2/renders/P10-kling3_0_turbo.mp4` |
| P11 | https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183928_30de176a-4fa3-4aac-8c42-217f4faab1c9.mp4 | `run-20260814-v2/renders/P11-kling3_0_turbo.mp4` |

## 결과 점수표

각 항목 0~5점. `프롬프트 반영 / 구도 안정 / 인물 일관 / 인공물 결함 / 사업 적합` 순서다.

| ID | 점수 | 판정 | 육안 관찰 | 다음 단일 변수 |
|---|---|---|---|---|
| P01 | 4/5/5/5/4 = 23 | PASS | 성인 실사형, 템플 탭과 미소가 정확하다. `full coverage`보다 넥라인이 깊다. | 넥라인만 crew-neck으로 고정 |
| P02 | 5/5/5/5/4 = 24 | PASS | 검정 새틴, 성인성, 자신감이 또렷하다. 노출 없이 강도가 올라간다. | 의상 유지, 배경만 일상 공간으로 |
| P05 | 4/5/5/5/4 = 23 | PASS | 픽셀 하트가 즉시 보이고 손바닥에서 분해된다. 캐치 동작은 다소 생략됐다. | 첫 0.3초 손 위치만 고정 |
| P07 | 3/5/5/4/1 = 18 | KILL | 동작은 맞지만 큰 눈과 매끈한 얼굴이 20대 후반보다 어려 보인다. | 실사 성인 얼굴 앵커가 없으면 재사용 금지 |
| P08 | 5/5/5/5/4 = 24 | PASS | 완전착의 19+ 에디토리얼 경계를 가장 안정적으로 구현했다. | 동일 의상으로 카메라만 push-in |
| P09 | 5/5/5/5/4 = 24 | PASS | chest-up에서 face close-up으로 자연스럽게 전진한다. | 속도만 20% 빠르게 |
| P10 | 4/5/5/5/4 = 23 | PASS | 하트 등장과 분해가 명확하다. 인물은 성인으로 보인다. | 하트를 cobalt 데이터 큐브로 변경 |
| P11 | 4/5/5/5/0 = 19 | KILL | 코발트 보브는 기억되지만 큰 눈의 인형형 외형이 어려 보인다. | 3D 스타일 폐기, 성인 실사+코발트 보브만 유지 |

## 변수별 결론

### 프롬프트 강도 A/B

P01↔P02, P07↔P08에서 검정 새틴 완전착의 에디토리얼이 품질 저하 없이 성인성과 시선 강도를 올렸다. `sensual`만 던지지 않고 `fully covering`, `adult editorial`, `no transparent fabric`, `no sexual action`을 같은 문장에 묶은 것이 안전선이다. 다만 퍼널 관심 이후 콘텐츠까지 전부 이 톤이면 캐릭터가 평면적인 모델 계정으로 굳는다.

### 카메라 A/B

Kling P07의 고정 카메라보다 P09의 느린 handheld push-in이 얼굴 존재감과 숏폼 리듬이 좋다. 단 P07은 외형 안전선에서 KILL이므로 순수 카메라 효과의 정량 비교는 재실험이 필요하다.

### 첫 행동 훅 A/B

P05·P10의 픽셀 하트는 첫 프레임에서 설명 없이 AI 캐릭터성을 보여준다. 후편집 문구 없이도 가상 인격의 물성을 만든다. 다만 하트는 관계 과몰입 신호가 될 수 있어, 다음 실험은 데이터 큐브나 글리치 메이크업처럼 비연애적 상징으로 바꾼다.

### 모델

Wan 2.7은 자연스러운 성인 실사와 표정이 강했다. Kling 3.0 Turbo는 카메라와 효과 동작을 잘 따랐지만, `subtly stylized`나 `premium 3D`가 큰 눈과 어려 보이는 얼굴로 기울 수 있다. 스타일형은 성인 얼굴 참조 없이 발행하지 않는다. Veo와 Seedance는 잔액 소진으로 결과가 없어 모델 3종 결론은 미완이다.

### 재현성

P06 exact rerun은 프롬프트를 그대로 재제출했으나 동시실행 상한으로 잡이 생성되지 않았다. 기존 VF-AIF-001A와 P01은 비슷한 계열이지만 프롬프트·길이가 달라 exact rerun 증거로 쓰지 않는다.

## 전체 프롬프트

### BASE: P01, P06, P07, P12, P16

> Vertical 9:16 creator-style video. An unmistakably adult fictional Korean virtual influencer in her late twenties, with no resemblance to any real person, sits in a softly lit modern creator studio. She wears a tasteful fitted red knit top with full coverage. Medium close-up, locked tripod, eye-level camera. She looks directly into the lens, taps her temple once as if acknowledging she is an AI character, then gives a candid amused smile. Mainstream SFW, realistic with a subtly stylized digital-human finish, natural skin texture, no readable text, no logos, no nudity, no transparent fabric, no sexual action.

### INTENSITY: P02, P08, P13, P17

> Vertical 9:16 creator-style video. An unmistakably adult fictional Korean virtual influencer in her late twenties, with no resemblance to any real person, sits in a softly lit modern creator studio. She wears an elegant fully covering black satin evening dress with a tasteful neckline. Medium close-up, locked tripod, eye-level camera. She looks directly into the lens, taps her temple once as if acknowledging she is an AI character, then gives a candid amused smile. Sensual adult editorial mood, confident eye contact, fully clothed, realistic with a subtly stylized digital-human finish, natural skin texture, no readable text, no logos, no nudity, no transparent fabric, no sexual action.

### STYLE: P03, P11, P20

> Vertical 9:16 creator-style video. An unmistakably adult fictional Korean virtual influencer in her late twenties, with no resemblance to any real person, sits in a softly lit modern creator studio. She wears a tasteful fitted red knit top with full coverage. Medium close-up, locked tripod, eye-level camera. She looks directly into the lens, taps her temple once as if acknowledging she is an AI character, then gives a candid amused smile. Mainstream SFW, intentionally stylized premium 3D digital-human aesthetic with a graphic chin-length cobalt bob and subtle iridescent catchlights, no readable text, no logos, no nudity, no transparent fabric, no sexual action.

### CAMERA: P04, P09, P14, P18

> Vertical 9:16 creator-style video. An unmistakably adult fictional Korean virtual influencer in her late twenties, with no resemblance to any real person, sits in a softly lit modern creator studio. She wears a tasteful fitted red knit top with full coverage. Medium close-up, slow handheld push-in from chest-up to face, eye-level camera with slight natural micro-movement. She looks directly into the lens, taps her temple once as if acknowledging she is an AI character, then gives a candid amused smile. Mainstream SFW, realistic with a subtly stylized digital-human finish, natural skin texture, no readable text, no logos, no nudity, no transparent fabric, no sexual action.

### HOOK: P05, P10, P15, P19

> Vertical 9:16 creator-style video. An unmistakably adult fictional Korean virtual influencer in her late twenties, with no resemblance to any real person, sits in a softly lit modern creator studio. She wears a tasteful fitted red knit top with full coverage. Medium close-up, locked tripod, eye-level camera. In the first half-second she catches a small glowing translucent pixel heart tossed from off camera, looks directly into the lens, then opens her palm and the heart breaks into harmless digital particles as she gives a candid amused smile. Mainstream SFW, realistic with a subtly stylized digital-human finish, natural skin texture, no readable text, no logos, no nudity, no transparent fabric, no sexual action.

## 실패·모더레이션 기록

- 정책 모더레이션 차단: 0건.
- 인프라 차단: 6건. 모두 `rate_limit_reached`, `concurrent_jobs_limit=6`, 실청구 0.
- 잔액 안전가드: 6건. 계정 잔액 0 확인 후 미제출.
- 사후 안전 탈락: P07·P11. 생성 API는 통과했지만 어려 보이는 얼굴 때문에 발행 금지. 파일은 삭제하지 않고 실패 증거로 보존.
- 계정 이벤트: `2026-08-13T18:39:40.77802Z / Subscription Cancelled / -194.62 credits`. 이 이벤트 뒤 계정은 free, 0 credits로 관찰됨.

## 레드팀·셀프심문

까다로운 시청자 관점의 공격은 “AI라고 고지해도 결국 외모만 파는 복제 계정”이다. 이 공격은 유효하다. 그래서 P02·P08의 에디토리얼 강도는 유입용 상한으로만 두고, 다음 묶음은 의견·실패·선택을 말하는 캐릭터 콘텐츠가 되어야 한다. 관계 과몰입을 돈으로 바꾸는 DM은 실험하지 않는다.

이 결론이 틀렸다면 가장 그럴듯한 이유는 실제 발행 데이터가 없다는 점이다. 육안 점수는 정지력의 대리지표다. 수정 결론은 “P02·P08·P09·P10을 발행 후보로 승격”까지다. 바이럴·과금 가능성을 입증했다고 말하지 않는다.

## 다음 실험 게이트

1. 결제 복구 전 새 생성 금지. `Subscription Cancelled` 원인을 먼저 확인한다.
2. 충전 후 최소 62크레딧: Veo baseline·intensity·camera 3편, Seedance baseline 1편, Wan exact rerun 1편. 모델 3종과 재현성 조건을 닫는다.
3. 스타일형은 P11 프롬프트를 재사용하지 않는다. 성인 실사 얼굴 앵커와 코발트 보브만 남긴다.
4. 발행 후보 4편은 첫 프레임 `AI VIRTUAL CREATOR` 고지, 프로필 고정 고지, 로맨틱 DM 금지 상태에서 소규모 노출 테스트한다.

## 파일

- 비교 허브: `index.html`
- 신규 렌더 8편: `run-20260814-v2/renders/`
- 프레임 콘택트: `run-20260814-v2/frames/persona-batch-contact.png`
- 원본 CLI 로그: `run-20260814-v2/logs/`
- 기존 A/B: `renders/VF-AIF-001A-wan27.mp4`, `renders/VF-AIF-001B-wan27.mp4`

## SOURCES

- BRAIN: `/Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/pmf/idea-ai-여자-인플루언서-콘텐츠공장.md`
- BRAIN: `/Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/pmf/idea-AI-숏폼-방송국.md`
- BRAIN: `/Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/마케팅/concept-인플루언서-릴스-콘텐츠-운영.md`
- Aitana López, The Clueless: https://www.theclueless.ai/project/aitana-lopez . 차용: 완전착의 센슈얼리티와 피트니스·패션 니치. 변경: 20대 후반 한국형 AI 자의식 크리에이터.
- imma, Aww Inc.: https://aww.tokyo/en/vhuman/imma-en/ . 차용: 한눈에 기억되는 머리색·실루엣. 변경: 핑크 보브를 복제하지 않고 코발트 보브를 시험.
- Granny Spills, TIME: https://time.com/7329699/ai-influencers-tiktok-granny-spills/ . 차용: 첫 1초 캐릭터 행동. 변경: 대사 대신 픽셀 오브젝트 행동.
- Meta GenAI transparency: https://about.fb.com/news/2025/02/gen-ai-transparency-metas-ads-products/ . 적용: AI 고지를 후편집과 프로필에 명시.
- Fast Company, Aitana case: https://www.fastcompany.com/91546466/she-has-400000-instagram-followers-and-major-brand-deals-shes-also-ai . 차용: 외모 단독이 아닌 일관된 니치와 캐릭터 운영.
- Higgsfield CLI 1.1.23: `account status`, `account transactions`, `generate cost/create/wait/get`, `model get` 실측.

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: viral-trend-research, 최신 공개형 AI 크리에이터의 훅 구조 분해 / hook-angle-lab, 첫 행동·카메라·강도 통제변수 설계

SKILLS_SKIPPED: design-review 스킬은 현재 사용 가능 목록에 없어, Playwright 390·1024·ledger 렌더와 직접 이미지 판정으로 대체

EVAL_RUN_ID: 2026-08-14-ai-influencer-video-batch-v2
EVAL_STATUS: awaiting_feedback
EVAL_AGENT: content-growth-marketer
EVAL_SKILLS: viral-trend-research, hook-angle-lab
EVAL_ARTIFACT: social_pack

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=4/5 slop=5/5 total=23/25
WEAKEST_LINE: "다음 묶음은 의견·실패·선택을 말하는 캐릭터 콘텐츠가 되어야 한다." 구체 에피소드가 아직 없어서 방향 문장에 머문다.
