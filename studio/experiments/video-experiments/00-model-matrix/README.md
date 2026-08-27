# 잔액 0에서도 모델 지도를 잃지 않았다

Higgsfield CLI가 현재 노출하는 이미지·영상 항목 58개를 전수 조사했다. 프롬프트로 새 장면을 만드는 생성·생성편집 모델은 40개, 입력물을 변환하는 업스케일·배경 제거·디플리커 등 유틸리티는 18개다.

이 라인의 신규 생성 과금은 **0크레딧**이다. 조사 시작 시 계정 조회값은 266.92크레딧이었지만, 병렬 작업 중 선택된 workspace가 plus에서 free로 바뀌며 잔액이 0이 됐다. 거래 내역에는 194.62크레딧 `Subscription Cancelled` 차감이 관찰됐다. 공유 안전선 50크레딧 이하에서는 새 작업을 보내지 않는 규칙에 따라 100~130크레딧 실행 계획은 즉시 중단했다.

대신 이미 같은 계정에서 생성된 34개 성공 렌더를 작업 ID로 회수하고 로컬에 내려받았다. 같은 프롬프트를 사용한 달력 10개 모델, 종이 장면 4개 모델, 버튼 장면 4개 모델을 한 갤러리에서 재생할 수 있다. 사람 평가는 의도적으로 비워 두었다.

## 1. 산출물

- `models.json`: 현재 CLI 이미지 30개, 영상 28개의 전체 파라미터·enum·기본값·검증 규칙·분류·관찰 비용.
- `experiments.csv`: 79행. 성공 렌더, 비용 사전조회, CLI 검증 실패, 잔액 차단을 같은 스키마로 기록.
- `index.html`: 로컬 영상 34개를 통제 프롬프트와 모델로 필터링하는 단일 갤러리.
- `media/`: MP4 34개, poster JPG, 접촉 시트. CDN 만료와 무관하게 검토 가능.
- `raw/`: CLI 원응답. 모델 목록, 모델별 상세, 작업 상세, 거래 내역, 미디어 메타데이터.
- `logs/`: 모델별 비용 사전조회 성공과 실패 원문. 실패 파일을 삭제하지 않았다.
- `build_outputs.js`: 원자료에서 세 산출물을 재생성하는 빌더.

## 2. 모델 인벤토리 판정

### 실제 생성 또는 생성편집 40개

이미지 20개:

`flux_2`, `flux_kontext`, `gpt_image_2`, `grok_image`, `image_auto`, `kling_omni_image`, `nano_banana`, `nano_banana_2_lite`, `nano_banana_flash`, `nano_banana_pro`, `openai_hazel`, `recraft_v4_1`, `seedream_v4_5`, `seedream_v5_lite`, `seedream_v5_pro`, `soul_cast`, `soul_cinematic`, `soul_location`, `text2image_soul_v2`, `z_image`.

영상 20개:

`flux_3_video`, `gemini_omni`, `grok_video`, `grok_video_v15`, `happy_horse_video`, `kling2_6`, `kling3_0`, `kling3_0_turbo`, `minimax_h3`, `minimax_hailuo`, `seedance1_5`, `seedance_2_0`, `seedance_2_0_mini`, `seedance_2_5`, `veo3`, `veo3_1`, `veo3_1_lite`, `wan2_6`, `wan2_7`, `wan3_0`.

### 유틸리티 18개

- 이미지: `bytedance_image_upscale`, `flux_2_pro_outpaint`, `image_background_remover`, `nano_banana_2_ai_stylist`, `nano_banana_2_relight`, `nano_banana_2_shots`, `nano_banana_2_skin_enhancer`, `outpaint`, `topaz_image`, `topaz_image_generative`.
- 영상: `bytedance_video_upscale`, `clipify`, `llm_text`, `sam_3_video`, `topaz_video`, `video_background_remover`, `video_deflicker`, `video_upscale`.

`topaz_*`와 outpaint 계열은 생성형 연산을 포함할 수 있지만, 제로베이스 장면 생성기가 아니라 기존 입력을 개선·확장하는 변환 도구로 분류했다. `llm_text`는 CLI가 video 타입으로 반환하지만 실제 파라미터는 텍스트 생성이므로 유틸리티로 분리했다.

`cinematic_studio_3_0`은 성공 작업과 거래 내역에서는 발견됐지만 현재 `model list`에는 없다. `models.json`의 `legacy_observed`에 별도로 보존했다.

## 3. 관찰된 기본 비용

비용은 2026-08-14 KST에 CLI `generate cost`로 안전 프롬프트를 넣어 확인했다. 모델·해상도·길이·모드에 따라 달라지므로 가격표가 아니라 사전조회 스냅샷이다.

| 작업군 | 저비용 관찰값 | 중간 | 고비용 관찰값 |
|---|---:|---:|---:|
| 이미지 | Soul 계열 0.12, Z Image 0.15, Kling O1 0.5 | FLUX.2·Grok·Seedream 4.5 각 1, Nano Banana 2 1.5 | OpenAI Hazel 4, GPT Image 2 7 |
| 영상 | Seedance 1.5 Pro 4.8, MiniMax Hailuo 6, Wan 2.7·Grok·Kling Turbo 7.5 | Veo 3.1 Lite 8, Kling 2.6·3.0 10, Wan 3.0 12.5 | Seedance 2.5 32.5, FLUX 3 Video 27.5, Gemini Omni 24 |

같은 Kling 3.0도 5초 1080×1920 작업은 8.75, 8초 720×1280은 12, 10초 4K는 60크레딧으로 거래 내역이 달랐다. 모델명 하나만으로 비용을 비교하면 틀린다. 길이·해상도·mode를 항상 함께 기록해야 한다.

## 4. 통제 실험

### 회수된 실제 통제군

1. `CTRL-VIDEO-CALENDAR-V1`: 동일 달력·페이지 역재생·도장 프롬프트 10개 모델.
2. `CTRL-VIDEO-PAPER-V1`: 동일 종이 3장 병합 프롬프트 4개 모델.
3. `CTRL-VIDEO-BUTTON-V1`: 동일 손가락 정지 프롬프트 4개 모델.
4. `CTRL-PERSONA-STUDIO-V1`: 허구 성인 AI 캐릭터 스튜디오 장면 8개 렌더. 이 그룹 안에는 모델 외 변형도 섞여 있어 순수 모델 비교가 아니라 프롬프트 변형군이다.

달력군은 **프롬프트만 통제됐다**. 모델별 최소 길이·지원 해상도·오디오 기본값이 달라 5~10초, 720p~4K, sound on/off가 섞였다. 따라서 현재 데이터로는 최종 품질 순위를 단정할 수 없다. `experiments.csv`의 `all_params_json`을 기준으로 같은 출력비용 또는 같은 해상도 하위군을 다시 나눠 평가해야 한다.

### 잔액 복구 뒤 실행할 미완 통제군

- 이미지 인물: 동일 허구 성인 도예가와 cobalt vase. 1:1, 1K, reference 없음.
- 이미지 제품·텍스트 없는 장면: 동일 무브랜드 desk object. 4:5 또는 모델 공통 최인접 비율.
- 영상 액션: 동일 허구 성인 courier puddle jump. 9:16, 5초, 720p, audio off.
- 이미지→영상: 동일 권리보유 시작 이미지. 9:16, 5초 또는 모델 공통 최소 길이, audio off.

재개 우선순위는 저비용 미검증 모델이다. 이미지에서는 Z Image·Soul·Kling O1·FLUX.2를 먼저 돌리면 약 1.77크레딧으로 넓은 1차 판별이 가능하다. 영상에서는 Seedance 1.5·MiniMax Hailuo·Wan 2.7·Grok Video·Kling Turbo·Veo Lite 순으로 41.3크레딧 내외의 1차 sweep을 구성할 수 있다. 다만 사전조회 재실행 후에만 제출한다.

## 5. 실패 원장

| 실패 | 관찰 | 판정 |
|---|---|---|
| `soul_cast` 기본 조회 | required `aspect_ratio` 누락 | `16:9` 명시 후 0.12크레딧 조회 성공 |
| `minimax_hailuo` 기본 조회 | start/end image 요구로 오판, 해상도 숫자 타입 불일치 | `variant=minimax-2.3`, 기본 resolution 유지 후 6크레딧 조회 성공 |
| `wan3_0` 기본 조회 | CLI가 자체 validation CEL을 처리하지 못함 | `duration=5` 명시 후 12.5크레딧 조회 성공 |
| `veo3` 기본 조회 | start image 필수 | 권리보유 로컬 poster를 start image로 주면 22크레딧 조회 성공 |
| 계정 안전선 | 266.92에서 0으로 하락 | 신규 제출 0건. 차단 자체를 `BLOCK-ACCOUNT-000`으로 기록 |

모더레이션 차단과 rate limit은 이 라인에서 관찰되지 않았다. 없었던 실패를 만든 척 기록하지 않았다.

## 6. 평가 방법

각 카드의 placeholder를 사람이 채운다.

- prompt adherence: 요구한 사건 순서와 금지조건 준수.
- motion: 속도·접촉·관성·카메라의 물리 일관성.
- anatomy or geometry: 손가락·얼굴·종이·달력 구조 보존.
- artifacts: 텍스트 환각·물체 증식·프레임 튐·워터마크.
- reuse value: 수정 없이 게시, 편집 후 게시, 폐기 중 하나.

사람 평가 전에는 승자를 지정하지 않는다. poster 한 프레임은 모션 품질 증거가 아니다. 현재 `render_seconds`는 CLI가 완료시각을 노출하지 않아 `not_exposed_by_CLI`로 남겼다.

## 7. 벤치마크와 차용

- [Higgsfield 공식 홈](https://higgsfield.ai/): 이미지·영상·음성 생성과 편집·업스케일을 한 제품에 함께 노출하는 구조를 확인했다. 여기서는 같은 메뉴에 섞인 도구를 생성기와 변환 유틸리티로 다시 분리했다.
- Higgsfield CLI `model list/get`: 웹 카드명이 아니라 실제 호출 가능한 `job_type`, required, enum, rule을 정본으로 사용했다.
- Higgsfield CLI `generate cost/get/list`와 `account transactions`: 마케팅 설명이 아니라 계정에서 관찰된 비용·작업 ID·결과 URL을 증거로 사용했다.

벤치마크에서 차용한 것은 “모델을 한곳에서 선택한다”는 접근이다. 바꾼 것은 선택 기준이다. 이 매트릭스는 홍보 순서 대신 입력형태, 실제 비용, 통제 프롬프트, 실패 원인을 우선한다.

## 8. 레드팀과 셀프심문

**까다로운 구매자 공격:** “같은 프롬프트라도 해상도와 길이가 다르면 모델 비교가 아니다.” 맞다. 그래서 달력군을 parameter-controlled라고 부르지 않고 prompt-controlled라고 낮춰 표기했다. 실제 순위는 공통 해상도·길이 하위군 또는 크레딧당 품질로 다시 계산해야 한다.

**경쟁자 공격:** “이 라인은 자기 돈을 한 푼도 쓰지 않고 남이 만든 결과를 자기 실험처럼 포장했다.” 그래서 CSV의 `source`를 `shared_account_completed_job_recovered_by_this_line`과 `this_line_cli_preflight`로 분리했다. 이 라인의 실제 과금은 0이라고 문서 첫 화면에 고정했다.

**이 결론이 틀렸다면 가장 그럴듯한 이유:** CLI 목록이 웹 UI의 모든 workflow·preset을 포함하지 않을 수 있다. 실제로 `cinematic_studio_3_0`이 작업 이력에는 있지만 현재 model list에는 없다. 따라서 “Higgsfield 전체 제품 기능 58개”가 아니라 “현재 CLI가 노출한 이미지·영상 모델 항목 58개”가 정확한 결론이다.

## 9. 검증 증거

- `models.json`: `jq empty` 통과. 현재 항목 58개, image 30, video 28.
- `experiments.csv`: Python `csv.DictReader`로 79행·27열 파싱. 상태 4종이 보존됨.
- `index.html`: Node 빌더 syntax check 통과. 로컬 MP4 34개와 poster가 실제 존재함.
- `media/contact-sheet.jpg`: 내려받은 첫 프레임 20개를 직접 확인. 갤러리의 모션 평가는 미검증.
- 최신 계정 상태: free workspace, 0크레딧. 신규 제출 없음.

SKILLS_USED: 없음. 현재 제공된 스킬 중 CLI 모델 인벤토리·실험 원장 구축에 직접 매칭되는 스킬이 없음.
SKILLS_SKIPPED: imagegen. 기존 Higgsfield 실험물을 생성·검증하는 작업이므로 별도 이미지 생성은 범위 밖.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=4/5 slop=5/5 total=23/25
WEAKEST_LINE: "재개 우선순위는 저비용 미검증 모델이다." · 사람 품질평가가 없어서 비용 외 효용을 아직 반영하지 못했다.

SOURCES: https://higgsfield.ai/ · Higgsfield CLI `model list/get`, `generate cost/get/list`, `account status/transactions`, `workspace list` · `/Users/sj/.claude/standards/benchmarks.md` · `/Users/sj/.claude/standards/writing.md` · `/Users/sj/.claude/standards/marketing.md` · `/Users/sj/.claude/standards/dev.md` · `/Users/sj/.claude/standards/artifact-stamp.md`
MODEL: gpt-5.6-sol

🏷 STAMP | line: 00-model-matrix | 생성: 2026-08-14 04:02 KST | model: gpt-5.6-sol | agent: higgsfield_model_matrix
skills: 없음 | 근거: Higgsfield CLI 전수조회 · 계정 거래 원장 · https://higgsfield.ai/
고민: 100~130크레딧 소비 목표보다 공유계정 50크레딧 안전선을 우선하고, 미실행을 숨기지 않은 채 회수 가능한 비교 증거를 최대화했다.
