# 남성 익명 허구 사연 숏폼 통제실험 v1

STAMP: 2026-08-14 03:45 KST / gpt-codex/gpt-5.6-sol / content-growth-marketer / brand-positioning-kit + hook-angle-lab + viral-trend-research / BRAIN 4 pages + TikTok Creative Center + YouTube official / 고민: 실제 제보처럼 기망하지 않으면서도 8초 안에 관계의 배신과 돈의 손실을 읽히게 만들었다.

## 결론

Kling 3.0 결과물 1편을 실제 생성하고 내려받았다. 720×1280, 8.042초, H.264, 24fps다. 견적과 실청구는 12크레딧으로 일치했다.

열쇠를 빌려주는 손, 차를 가져가는 친구, 우편함의 위반 고지서라는 3비트가 구현됐다. 다만 고지서와 주차 구역에 읽을 수 있는 글자와 숫자가 생겼고, 마지막 감정 반응이 약하다. `ITERATE`다.

## 1. 포지셔닝

- 한 문장: 돈, 시간, 관계 경계를 망친 한 번의 선택을 8초 사건으로 보여주는 명시적 허구 사연 채널.
- 청중: 친구, 연인, 직장 관계에서 부탁을 거절하지 못해 비용을 떠안는 20~30대 남성.
- 반청중: 실존 인물을 찾아 공격하거나 성별 혐오의 증거를 원하는 시청자.
- 긴장: 주인공의 선의를 칭찬하지 않는다. 선의 뒤의 비용을 영수증처럼 보여준다.
- 금기: 실제 제보인 척하기, 신상 추정 단서, 여성·남성 집단 비하, 범죄 모사 조장, 타인 조종법.

## 2. 훅

- raw provocative version: `친구한테 차 빌려주고 딱지 세 장 대신 받은 남자.`
- safer publish version: `친구에게 차를 빌려줬다. 돌아온 건 차가 아니라 딱지 세 장이었다.`
- risk label: LOW-MEDIUM. 실제 피해 사례로 오인될 수 있어 게시물 첫 줄에 `허구 사연`을 고정한다.
- 장치: 결과 선공개 + 배신의 미해결 원인 + 손실회피.
- 화면 훅: 첫 1초 손바닥에 떨어지는 열쇠. 결과 선공개형 A/B는 고지서 세 장으로 시작한다.

## 3. 전체 프롬프트 원장

### ST-P-BASE

```text
Rights-clean original with two fictional anonymous 30-year-old Korean male friends, no resemblance to real people. Vertical 9:16, eight-second silent micro-story. Camera viewpoint: intimate third-person at eye level throughout. Visual treatment: realistic editorial drama, natural skin texture, muted rainy-day color, restrained acting. [0-2s HOOK] Macro close-up as a plain car key lands in an open palm; the receiving friend closes his fingers around it a beat too quickly. [2-5s] The owner gives a trusting nod while the friend drives the unbranded compact car away; the owner remains under the apartment awning. [5-8s] Days later, three red-stamped blank violation envelopes spill from the mailbox into the owner's hands; he looks toward the empty parking space and his smile disappears. Physically plausible motion, no readable text, no logos, no license plate detail, no subtitles, no captions, no watermark.
```

### ST-P-HOOK-REVERSE

ST-P-BASE에서 `[0-2s HOOK]`만 아래로 교체했다.

```text
[0-2s HOOK] Three red-stamped blank envelopes slap onto a kitchen table; a sharp match cut flashes back to the same hand receiving a plain car key.
```

### ST-P-HOOK-MIRROR

ST-P-BASE에서 `[0-2s HOOK]`만 아래로 교체했다.

```text
[0-2s HOOK] In the rear-view mirror, the borrowing friend avoids eye contact while his hand reaches back for the plain car key; the owner's trusting face stays blurred behind him.
```

### ST-P-POV

ST-P-BASE에서 시점 문장만 아래로 교체했다.

```text
Camera viewpoint: first-person POV from the car owner's eyes throughout.
```

### ST-P-ROTOSCOPE

ST-P-BASE에서 시각 처리 문장만 아래로 교체했다.

```text
Visual treatment: high-contrast graphic-novel rotoscope with original ink shapes, rough paper texture, muted rainy-day color, restrained acting.
```

## 4. 실제 결과 판정

| 항목 | 점수 | 관찰 |
|---|---:|---|
| 프롬프트 반영 | 4/5 | 열쇠, 차, 고지서의 3비트가 순서대로 보임 |
| 구도 안정성 | 4/5 | 손과 주차장 중심의 세로 화면이 안정적 |
| 인물·사물 일관성 | 3/5 | 친구 둘은 구분되나 소유자 시점과 대상이 중간에 모호함 |
| 인공물 결함 | 2/5 | 고지서와 배경에 작은 글자·숫자 생성. 금지 지시 위반 |
| 사업 적합성 | 4/5 | 무음으로도 부탁, 이탈, 비용의 방향은 읽힘. 마지막 표정 변화는 약함 |
| 합계 | 17/25 | ITERATE |

다음 단일 변수는 결과 선공개 훅이다. 첫 1초 고지서 세 장, 다음 5초 열쇠 회상, 마지막 2초 빈 주차칸으로 재배열한다.

## 5. 비용·실패

- 이 폴더 실제 지출: 12크레딧.
- 최초 제출 전 관찰 잔액: 356.42크레딧.
- ST-01~05 Veo: 계정 전체 동시작업 한도 6건 때문에 잡 ID 없이 거절, 실청구 0.
- 두 폴더 합계 실제 지출: 24크레딧.
- 최신 CLI 잔액: free plan 0크레딧. 계정 거래 원장의 `Subscription Cancelled -194.62 deduct` 뒤 신규 생성 중단.

## 6. 벤치마크 적용

- TikTok Top Ads의 `공통적이고 불편한 상황으로 시작` 구조를 차량 열쇠 대여로 각색했다.
- TikTok 공식 가이드의 사람 중심, 빠른 감정, 10~20초 가치 전달을 8초 3비트 사건으로 축소했다.
- YouTube Shorts의 첫 1초 `shock, intrigue, satisfy` 중 이번 원본은 intrigue가 작동하지만 satisfy가 약했다. 다음 A/B는 결과를 첫 프레임에 둔다.

## 7. 레드팀·셀프심문

- 경쟁 채널 공격: `고지서 몇 장으로는 썰이 아니라 광고 스톡 영상이다.` 수정: 결과 선공개 A/B를 다음 우선 실험으로 지정하고, 게시 시 `허구 사연` 표기를 고정한다.
- 이 결론이 틀렸다면 가장 그럴듯한 이유: 고지서의 의미는 한국 교통 문법을 아는 시청자에게만 즉시 읽힌다. 따라서 글로벌 확장 전에는 보편적 손실 물체로 교체해야 한다.

SKILLS_USED: brand-positioning-kit(익명 허구 사연의 윤리 경계) / hook-angle-lab(raw·publish 훅과 위험 라벨) / viral-trend-research(2026 공식 숏폼 문법 조사)
SKILLS_SKIPPED: 없음

SOURCES: BRAIN `wiki/philosophy/idea-조곤-인터뷰-콘텐츠.md`; BRAIN `wiki/philosophy/인생철학/synthesis-남성성-thesis.md`; BRAIN `wiki/foundation/synthesis-시간-자본-thesis.md`; BRAIN `wiki/business/pmf/idea-단타-에이전트-경제채널.md`; https://ads.tiktok.com/help/article/top-ads?lang=en&redirected=1; https://ads.tiktok.com/business/en/guides/what-is-ad-creative-guide?redirected=1; https://blog.youtube/creator-and-artist-stories/youtube-shorts-deep-dive/; Higgsfield CLI 1.1.23 cost/create/get/account outputs; local ffprobe and contact-sheet inspection.
MODEL: gpt-codex/gpt-5.6-sol
RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=4/5 slop=5/5 total=22/25
WEAKEST_LINE: "주인공의 선의를 칭찬하지 않는다." 태도는 선명하지만 시청자가 얻는 이득을 그 문장 하나만으로는 설명하지 못한다.
