# session-state.studio — OSMU Studio 제작엔진 라인

> 라인명: `studio`. 이 repo의 다른 라인 = `pipeline-state.osmu.md`(마케팅 에이전트 제품, design 단계).
> 상태 파일 규약: `~/.claude/standards/state-file-convention.md`

## 2026-08-27 23:10 KST, Studio 생성 API build 인계

- 사용자 확정 기반: 이 세션에 주입된 Studio 생성 API 과제와 `docs/prototype/openclaw-auto-4room-v63.html`, 회장 확정 요구사항 R27, R37, R71, R104, R105, R132, R133, `docs/학습정보-층계-계약-v1.0.md`.
- live handoff 확인: tmux `openclaw-auto:0.0`은 OSMU UI 작업, `osmu-studio:0.0`은 이 Studio API worker로 확인했다. Studio 소스 중복 편집은 없었다.
- 구현: 7층 입력 검증, 후보 A/B/C, workspace 권한, idempotency, R27 무료 재생성과 과금 승인 거절. 서비스 중립 경계를 지켰고 provider 인증값은 받지 않는다.
- 커밋: `8ecb4525` Studio 생성 입력과 후보 세 장 API. 이후 실제 Next bundle에서 발견한 runtime·error 경계 보정은 후속 커밋 예정.
- 검증: Studio 테스트 15건, 전체 Vitest 144 files·1,166 passed·6 skipped, TypeScript, webpack production build, design lint 통과. 실제 로컬 HTTP 201, 422, 무료 재생성 201, 추가 재생성 409, 조회 200을 관찰했다.
- 미구현: 실제 미디어 provider 생성, production 회원·workspace·job·사용량 장부, R105 만료 다운로드. 전자는 이번 생성 API 수직 조각의 하류 연결이고, 후자 두 건은 신규 DB table 합의가 필요하다.
- 정확한 다음 실행: 후속 커밋을 완료한 뒤 QA는 `dashboard/tests/studio/generation-domain.test.ts`와 `generation-route.integration.test.ts`를 재실행하고, 신규 DB 계약 합의 후 PostgreSQL 실붙임·다중 instance 경합·만료 링크를 검증한다.

## 2026-08-15 08:50 KST, PRD v1.2.0 워커 인계

- 사용자 확정 기반: `docs/제품구조-결정-2026-08-15.md`, `studio/docs/prd-studio-service-v1.1.2-gpt-codex.md`, `docs/벤치마킹-참여형결정경험-2026-08-15-v3-gpt-codex.md`.
- live handoff 확인: tmux `openclaw-auto:0.1`. 부모 컨트롤러가 studio plan 산출물을 병렬 위임 중이며 이 세션은 PRD 개정만 소유한다.
- 생성 산출물: `studio/docs/prd-studio-service-v1.2.0-gpt-codex.md`.
- 반영: §3.7 질문 엔진, §3.8 생성·편집과 과금 화법, §3.9 입력 세 범주, §3.10 확률성 경계, §3.95 운영자 면, §9.5 회장 확정 5건, 경쟁 지형·빈자리, FR·NFR·AC·BM·리스크·KC·결정 원장 추적.
- 보존 검증: v1.1.2 124,686B·1,348줄·본장 23개에서 v1.2.0 179,374B·1,702줄·본장 23개로 확장. 상대 링크와 `git diff --check` 통과. Mermaid CLI 실제 SVG 렌더 통과.
- 미통과 게이트: plan-critic 독립 비평, PRD 문서리뷰, `wiki/product/studio.md`·구현현황 정합화, 회장 잔여 결정 범위 승인, `/approve plan`.
- 다음 실행: 부모 Stage Controller가 PRD 리뷰와 plan-critic 결과를 취합하고 `/approve plan` 증거를 재검증한다. design 진입은 아직 금지다.

## 2026-08-15 (haejo-danta 라인 → openclaw-auto 라인 인계)

### 지금 바로 읽을 것
**`studio/docs/인수인계-스튜디오-제품논의-2026-08-15.md`** 한 파일에 전부 있다.
회장과 나눈 제품 논의(2026-08-14~15) 전량. 결론뿐 아니라 기각안과 그 이유까지.

### 무슨 일이 있었나
haejo-danta 라인에서 힉스필드로 세로 영상 파일럿을 만들다가, 그 제작 공정 자체를 제품화하기로 했다.
openclaw-auto가 이미 발행 플랫폼(v3.0)이므로 그 위에 제작 엔진(studio)을 모듈로 얹는 방향(A안)으로 이관했다.

### 이관 결과
- `studio/` (2.6MB, git 추적) = standards 품질헌법 4종 / pipelines / ventures 인테이크 / experiments 실험보고서 + 라인 레지스트리 / docs 벤치마킹·인수인계
- `studio-assets/` (614MB, gitignore 등록됨) = 영상·이미지·음성뱅크·Soul 레퍼런스
- 원본 `~/OSMU-archive`는 미삭제. 새 경로 정상 확인 후 회장 승인받아 정리.

### 핵심 결정 3줄
1. 차별점은 생성이 아니라 **사용자가 A/B/C를 골라 취향을 학습시키는 eval 루프**. 경쟁사 14종 조사 결과 이걸 하는 곳이 없다.
2. LLM은 픽셀을 그리지 않는다. **편집 지시서(JSON)** 를 쓰고 ffmpeg+PIL 로컬 코드가 렌더한다. 이 스키마가 제품의 진짜 자산.
3. 경계는 **"창작 결정이냐 채널 적응이냐"**. studio=무엇을 어떻게 만들까 / openclaw=어디에 언제 올리고 성과를 어떻게 걷을까.

### 최대 병목
나레이션 목소리 최종 선택. 회장 청취 대기.
- 파일: `studio-assets/haejo-danta/generated/EC0147-voicebank-훅-2026-08-14-elevenlabs_minimax-40종.wav` (9분 30초)
- 순서표: `studio/experiments/음성뱅크-수집-2026-08-14.md`
- 풀리면 EC0147 전편 완성 → 마케팅 소재의 증거물이 됨

### 회장 미결정 3건
1. 아키텍처 A/B/C (세션 추천 A. 이관은 A 전제로 실행됨)
2. 취향학습을 PRD v7.3.5 개정으로 넣을지 (개정 시 design 단계 재오픈)
3. 키 방식: 유저 자기 키 vs 우리 키 충전식 (세션 추천 = 우리 키 충전식)

### 최우선 경쟁사
시그마인(sigmine.ai). 우리와 거의 같은 제품, 이미 매출·정부지원 있음. 월 15만~75만원.
우리 킥 = 취향 학습(그쪽은 AI가 알아서) / 편당 밀도(그쪽은 월 300건 볼륨) / 벤처 내부 지식 인테이크(그쪽은 홈페이지 크롤링).
반론: 속도에서 압도적으로 뒤진다. 좁은 시장(교육·금융)으로 가야 한다.

### 진행 중인 위임
Codex 위임 G: 포지셔닝·해자 등급 + 메타증명 마케팅 소재. 로그 /tmp/codex-marketing.log
산출 예정: `studio/docs/포지셔닝-해자-정리-2026-08-15.md`, `studio/docs/마케팅-소재-메타증명-2026-08-15.md`
(현재 `~/OSMU-archive/docs/`에 떨어질 수 있으니 완료 후 studio/docs로 옮길 것)

### 이어받아 바로 할 수 있는 작업: EC0147 전편 재조립

작업셋 전량이 `studio-assets/haejo-danta/build-workspace/` 에 회수돼 있다(108파일, 76MB).
- `vo1~vo11.wav` 나레이션 11트랙 (현재 qwen_audio_tts Arthur, 회장이 "글자 읽는 느낌"으로 기각한 버전)
- `im*.png` 장면 이미지 18장 (에디토리얼 일러스트)
- `L_tag.png` `L_disc.png` 상시 레이어
- `build.py` 조립 스크립트 (컷 정의·자막 렌더·ffmpeg 합성 전부 포함)
- `c_*.mp3` 목소리 후보 비교 원본

**회장이 음성 번호를 고르면**: 그 목소리로 `text2speech_v2`(variant=elevenlabs 또는 minimax, voice_id 고정) 나레이션 11건만 재생성 → `vo*.wav` 교체 → `python3 build.py` → concat. 이미지는 재생성 불필요.
**주의**: 힉스필드 크레딧이 `free plan, 0 credits`이다. 결제 상태부터 확인해야 나레이션 재생성이 가능하다.

### 주의
- `studio/`는 `extensions/`(채널 코드)를 import하지 않는다. 발행 쪽은 브랜드킷·금지선을 소유하지 않는다. 의존 방향이 경계를 지킨다.
- API 계약·DB 스키마는 회장 합의 전 확정 금지(하네스 §6.3.5). 인수인계 문서의 DB 스키마는 초안이다.
