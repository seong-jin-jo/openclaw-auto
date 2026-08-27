# 경제 800선, 커머스, X 티저 생성 로그 v1

## STAMP

line: econ-commerce-batch
생성: 2026-08-14 03:42 KST
model: gpt-codex/gpt-5.6-sol
agent: content-growth-marketer
skills: viral-trend-research, hook-angle-lab, social-post-packager
근거: BRAIN 경제 800선, 숏폼 방송국, 릴스 운영, 스레드 신뢰 설계. Higgsfield CLI 1.1.23. YouTube 및 TikTok Shop, X 공식 자료.
고민: 실제 제품 없이 효능을 증명하는 커머스 영상을 만드는 유혹을 버리고, 손동작 재현성만 시험한 concept-only B-roll로 제한했다.

## 결론

- 실제 생성: 4편, 총 48 credits.
- 생성 모델: Kling v3.0 3편, Kling 3.0 Turbo 1편.
- 로컬 파생: X용 owned-content 무음 티저 2편. 추가 credits 0.
- 미실행 모델: Veo 3.1 Lite, Wan 2.7, Seedance 1.5 Pro. 6건 모두 동시 작업 상한으로 접수 거절됐고 과금 0이었다.
- 최초 확인 잔액: 577.92 credits.
- 마지막 확인 잔액: 0 credits, free plan으로 전환됨.
- 160~180 credits 목표는 달성하지 못했다. 공유 계정의 병렬 작업으로 잔액이 소진되어, `잔액 50 이하에서는 신규 제출 중단` 지시를 적용했다.
- 계정 거래 원장 18:37:24~18:37:55 UTC에서 본 트랙 job과 일치하는 `-12` 4건을 확인했다. 중간의 `-8.75` 2건은 다른 병렬 작업이라 본 트랙 비용에서 제외했다.

## 성공 작업

### 1. VF-ECO-RW-001 A1 grocery

- 가설: 급여 상승 숫자보다 긴 영수증과 빈 장바구니가 실질임금을 빠르게 이해시킨다.
- 조작변수: baseline visual metaphor.
- 모델 및 파라미터: `kling3_0`, 8초, 9:16, std, sound off, 720x1280.
- full prompt: `A vertical 9:16 editorial micro-documentary in a Korean grocery store. A fictional office worker in his early thirties receives a modest pay raise notification, smiles briefly, then compares a nearly empty shopping basket with a visibly longer receipt and becomes quietly concerned. Natural handheld camera, realistic fluorescent market lighting, restrained trustworthy economics-education tone, no readable text, no logos, no captions, no screens facing camera.`
- 사전 견적: 12 credits.
- 실제 청구: 12 credits.
- job id: `3ffc67aa-270a-4eb4-93c6-ffc115646354`.
- 생성 시작: 2026-08-14 03:37:24 KST.
- 완료 관찰: 2026-08-14 03:39 KST. CLI는 완료시각 필드를 제공하지 않아 분 단위 관찰값만 기록.
- 원격 URL: <https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183724_3ffc67aa-270a-4eb4-93c6-ffc115646354.mp4>
- 로컬: `renders/VF-ECO-RW-001-A1-grocery-kling3.mp4`.
- 권리 및 고지: owned prompt, fictional actor, AI-generated disclosure required.
- 평가: 프롬프트 4, 구도 5, 일관성 5, 결함 4, 사업 적합 5. 총 23/25.
- 판정: PASS. 긴 영수증과 장바구니는 즉시 읽힌다. 급여 인상 자체는 휴대폰 표정 변화로만 암시되어 후편집 내레이션이 필요하다.

### 2. VF-ECO-RW-001 B1 conveyor

- 가설: 급여 봉투보다 생활필수품이 빨리 지나가는 컨베이어가 구매력 하락을 설명한다.
- 조작변수: grocery reality에서 conveyor metaphor로 은유만 변경. 모델은 A1과 동일.
- 모델 및 파라미터: `kling3_0`, 8초, 9:16, std, sound off, 720x1280.
- full prompt: `A vertical 9:16 editorial micro-documentary about real wages. A fictional Korean office worker receives a modest pay raise envelope, smiles briefly, then places it on a simple conveyor belt. Everyday groceries move past faster while the envelope visually falls behind, and his expression becomes quietly concerned. Natural handheld camera, realistic neutral studio lighting, restrained trustworthy economics-education tone, no readable text, no logos, no captions, no screens.`
- 사전 견적: 12 credits.
- 실제 청구: 12 credits.
- job id: `6376ed7e-a7bb-49cf-aebe-2d07d5e79a71`.
- 생성 시작: 2026-08-14 03:37:50 KST.
- 완료 관찰: 2026-08-14 03:39 KST.
- 원격 URL: <https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183750_6376ed7e-a7bb-49cf-aebe-2d07d5e79a71.mp4>
- 로컬: `renders/VF-ECO-RW-001-B1-conveyor-kling3.mp4`.
- 권리 및 고지: owned prompt, fictional actor, AI-generated disclosure required.
- 평가: 프롬프트 3, 구도 5, 일관성 4, 결함 5, 사업 적합 4. 총 21/25.
- 판정: ITERATE. 봉투와 생활필수품은 보이지만 정지 프레임만으로 `급여가 뒤처진다`는 상대 속도 관계가 약하다. A1보다 설명 의존도가 높다.

### 3. VF-ECO-BR-001 A1 ATM domino

- 가설: ATM 줄에서 도미노로 전환하면 뱅크런의 자기실현 구조를 공포몰이 없이 보여준다.
- 조작변수: baseline hook and metaphor.
- 모델 및 파라미터: `kling3_0_turbo`, 8초, 9:16, 720p. 이 모델에는 sound off 파라미터가 없어 원본에 AAC가 포함됐다.
- full prompt: `A vertical 9:16 tense but factual economics micro-documentary about a bank run. A calm line of fictional adults waits at an unbranded ATM. One person steps away worried, then the line rapidly grows as a row of plain wooden dominoes falls toward a small model bank but stops one piece before impact. Realistic city lighting, controlled camera push-in, educational not sensational, no cash shower, no readable text, no logos, no captions.`
- 사전 견적: 12 credits.
- 실제 청구: 12 credits.
- job id: `8983765a-90d6-4ad0-952a-2ee75e4cfd53`.
- 생성 시작: 2026-08-14 03:37:54 KST.
- 완료 관찰: 2026-08-14 03:39 KST.
- 원격 URL: <https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183754_8983765a-90d6-4ad0-952a-2ee75e4cfd53.mp4>
- 로컬: `renders/VF-ECO-BR-001-A1-atm-domino-kling3-turbo.mp4`.
- 권리 및 고지: owned prompt, fictional adults, unbranded environment, AI-generated disclosure required.
- 평가: 프롬프트 5, 구도 5, 일관성 4, 결함 5, 사업 적합 5. 총 24/25.
- 판정: PASS. ATM 줄과 은행 모형 앞 도미노가 두 장면으로 명확히 갈린다. 발행본은 원본 오디오를 버리고 내레이션을 별도로 붙여야 한다.

### 4. VF-COM-CABLE-001 A1 concept-only

- 가설: 제품 이름이나 효능 주장 없이 설치, 삽입, 회수 동작만으로 제품 데모 가능성을 판정할 수 있다.
- 조작변수: baseline product interaction.
- 모델 및 파라미터: `kling3_0`, 8초, 9:16, std, sound off, 720x1280.
- full prompt: `Vertical 9:16 concept-only product demonstration B-roll for a fictional generic silicone cable organizer with no brand. Start with three loose charging cables sliding behind a plain desk. Two hands place a small neutral-gray organizer on the desk edge, press each cable into a slot, then pull and return one cable smoothly. One continuous overhead-to-close-up camera move, realistic home-office light, exact hand-object interaction, no efficacy claim, no text, no logo, no packaging, no captions.`
- 사전 견적: 12 credits.
- 실제 청구: 12 credits.
- job id: `76b9bc13-8862-4cb5-84b5-79f4e45e059e`.
- 생성 시작: 2026-08-14 03:37:55 KST.
- 완료 관찰: 2026-08-14 03:40 KST.
- 원격 URL: <https://d8j0ntlcm91z4.cloudfront.net/user_3EqxC7Y2r6lyY2vR25cT5zA8Leh/hf_20260813_183755_76b9bc13-8862-4cb5-84b5-79f4e45e059e.mp4>
- 로컬: `../../04-commerce/coupang-proof-shorts/renders/VF-COM-CABLE-001-A1-kling3-CONCEPT-ONLY.mp4`.
- 권리 및 고지: fictional generic object, concept-only, AI-generated disclosure required, DO NOT PUBLISH or attach to a real affiliate link.
- 평가: 프롬프트 2, 구도 5, 일관성 3, 결함 4, 사업 적합 1. 총 15/25.
- 판정: HOLD, NO PUBLISH. 생성물이 요청한 데스크 가장자리 다중 슬롯 정리함보다 전원 액세서리 같은 긴 박스로 변형됐고, 케이블 3개 삽입 동작도 재현하지 못했다. 실제 상품과 매칭하면 기망 위험이 있다.

## 접수 실패, 과금 0

아래 6건은 모두 Higgsfield Plus의 `concurrent_jobs_limit=6` 오류로 접수되지 않았다. 각 full prompt와 파라미터는 생성 매니페스트에 보존했다.

| 실험 | 모델 | 사전 견적 | 실제 청구 | full prompt 위치 | 실패 |
|---|---|---:|---:|---|---|
| VF-ECO-RW-001 A2 | veo3_1_lite | 8 | 0 | `econ800-generation-manifest-v1-gpt-codex.tsv` A2 | rate_limit_reached |
| VF-ECO-RW-001 B2 | wan2_7 | 12 | 0 | `econ800-generation-manifest-v1-gpt-codex.tsv` B2 | rate_limit_reached |
| VF-ECO-DSR-001 A1 | seedance1_5 | 9.6 | 0 | `econ800-generation-manifest-v1-gpt-codex.tsv` DSR A1 | rate_limit_reached |
| VF-ECO-DSR-001 B1 | seedance1_5 | 9.6 | 0 | `econ800-generation-manifest-v1-gpt-codex.tsv` DSR B1 | rate_limit_reached |
| VF-COM-CABLE-001 A2 | veo3_1_lite | 8 | 0 | `../../04-commerce/coupang-proof-shorts/commerce-generation-manifest-v1-gpt-codex.tsv` A2 | rate_limit_reached |
| VF-COM-DRAWER-001 A1 | seedance1_5 | 9.6 | 0 | `../../04-commerce/coupang-proof-shorts/commerce-generation-manifest-v1-gpt-codex.tsv` drawer A1 | rate_limit_reached |

재시도 전에 잔액이 0이 되어 신규 제출을 중단했다. 따라서 4개 모델 비교와 반복성 테스트는 설계와 견적까지만 있고 실제 영상 증거는 없다.

## X owned-content 파생물

- `../../05-distribution/x-owned-content/renders/VF-X-ECO-RW-001-owned-teaser-loop.mp4`: A1 grocery의 2~8초를 무음 6초 티저로 재인코딩. 추가 credits 0.
- `../../05-distribution/x-owned-content/renders/VF-X-ECO-BR-001-owned-teaser-loop.mp4`: bank run의 2~8초를 무음 6초 티저로 재인코딩. 추가 credits 0.
- 자동화 범위: 원본 발행 후 예약, UTM, 24시간 성과 회수만 허용.
- 금지: 자동 DM, 자동 팔로우, 자동 답글, 무관 멘션, 중복 도배, 트렌드 키워드 납치.

## 산출 검증

- ffprobe: 생성본 4편 모두 H.264, 720×1280, 8.041667초. X 파생본 2편 모두 H.264, 720×1280, 6초.
- 오디오: 경제 A1, B1, 커머스 A1은 무음. 뱅크런 원본만 AAC 포함. X 파생본은 모두 무음.
- contact sheet: 각 생성본에서 2초 간격 4프레임을 추출하고 직접 판정했다.
- 허브 렌더: Chrome headless로 데스크톱과 모바일 캡처를 생성했다. macOS headless 환경의 `CVDisplayLink` 경고는 있었지만 스크린샷 파일은 생성됐다.
- HTTP smoke: 임시 로컬 서버에서 `index.html`과 대표 영상 5개를 각각 요청해 모두 200 응답과 실제 바이트 수신을 확인했다.
- 해시: 원본 생성본 4편과 X 파생본 2편의 SHA-256을 산출해 파일별 비어 있지 않음과 서로 다른 바이너리를 확인했다.

## 벤치마크에서 차용하고 바꾼 것

| 출처 | 관찰 구조 | 차용 | 변경 |
|---|---|---|---|
| Daniel Iles `Compound Interest Explained`, YouTube 3,300만+ 조회 | 한 영상 한 금융 개념, 설명란의 투자 조언 및 제휴 고지 | 한 클립 한 개념 | 투자 행동 권유를 없애고 생활 장면으로 끝냄 |
| TikTok Shop Promotional Content 공식 | 실시간 사용, 여러 각도, 제품 세부를 정확히 보여줌 | 설치, 삽입, 회수 순서 | 실물 상품이 없으므로 전환 카피와 효능 주장을 제거하고 concept-only로 격리 |
| TikTok Shop Misleading Content 공식 | PDP와 속성 일치, 과장과 필터 금지 | 제품 일치 여부를 발행 게이트로 사용 | 생성물이 실물을 대신할 수 없다고 명시하고 케이블 영상 발행 보류 |
| TikTok Creative Center Home & Lifestyle | 문제 장면, 시연, 결과 장면 | loose cables, install, retrieve | 생성된 결과가 프롬프트를 못 따라 HOLD 판정 |
| X Automation Rules, Authenticity | 유용한 소유 정보 자동 발행은 가능. 중복, 무단 DM, 공격적 팔로우 금지 | 예약과 성과 회수 | 상호작용 자동화를 전부 제외 |

## 레드팀과 셀프심문

까다로운 고객의 공격: `이 케이블 정리함이 실제 쿠팡 상품처럼 보이는데, 왜 링크를 못 붙이나?` 생성물은 실물의 형상, 슬롯 수, 설치 방식과 일치한다는 증거가 없다. 링크를 붙이면 데모가 아니라 허위 증거가 된다. 그래서 HOLD, NO PUBLISH로 내렸다.

경쟁 경제 채널의 공격: `장면은 예쁘지만 용어를 설명하지 못한다.` 맞다. 8초 생성물은 훅 B-roll이지 완성 강의가 아니다. 발행본은 한국은행 용어 정의를 근거로 15~30초 내레이션과 자막을 별도 제작해야 한다.

이 결론이 틀렸다면 가장 그럴듯한 이유: contact sheet가 프레임 사이의 속도와 손동작을 충분히 보여주지 못했을 수 있다. 그래서 PASS는 장면 구조와 생성 품질에만 한정했고, 실제 시청 유지율과 개념 이해도는 미검증으로 남겼다.

## SOURCES/MODEL

- BRAIN: `/Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/마케팅/idea-경제용어-800선-숏폼.md`
- BRAIN: `/Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/마케팅/plan-경제금융용어-800선-쇼츠.md`
- BRAIN: `/Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/pmf/idea-AI-숏폼-방송국.md`
- BRAIN: `/Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/마케팅/concept-인플루언서-릴스-콘텐츠-운영.md`
- BRAIN: `/Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/마케팅/concept-스레드-신뢰-콘텐츠-설계.md`
- YouTube benchmark: <https://www.youtube.com/watch?v=gKdoU3xa2_Q>
- TikTok promotional content: <https://seller-us.tiktok.com/university/essay?default_language=en&knowledge_id=5769635937191681>
- TikTok misleading content: <https://seller-us.tiktok.com/university/essay?default_language=en&knowledge_id=4581457528194817>
- TikTok creative tips: <https://ads.tiktok.com/business/creativecenter/quicktok/online/creative-tips-for-home-and-lifestyle/pc/en>
- X automation: <https://help.x.com/en/rules-and-policies/x-automation?lang=browser>
- X authenticity: <https://help.x.com/en/rules-and-policies/authenticity>
- MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: viral-trend-research, 금융·커머스·X 공식 포맷 조사 / hook-angle-lab, 손실 장면과 증거형 훅 분리 / social-post-packager, X owned-content 티저 변환
SKILLS_SKIPPED: series-content-planner, 이번 산출물은 시리즈 백로그가 아니라 생성 통제실험이라 제외

RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=23/25
WEAKEST_LINE: "완료 관찰: 2026-08-14 03:39 KST." CLI가 완료시각을 노출하지 않아 정확한 생성 초 단위 시간을 남기지 못했다.

EVAL_RUN_ID: 2026-08-14-econ800-video-experiment-01
EVAL_STATUS: awaiting_feedback
EVAL_AGENT: content-growth-marketer
EVAL_SKILLS: viral-trend-research, hook-angle-lab, social-post-packager
EVAL_ARTIFACT: social_pack
평가 요청: 좋음/애매/별로 중 하나랑 이유 한 줄만 줘. 예: "좋음, 경제 은유는 좋은데 제품 손동작 재현이 약함."
