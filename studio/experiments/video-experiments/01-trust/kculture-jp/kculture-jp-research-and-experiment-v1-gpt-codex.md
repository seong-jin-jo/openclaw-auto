# K-컬처 일본·영어 숏폼 통제실험

🏷 STAMP | line: kculture-jp | 생성: 2026-08-14 03:44 KST | model: gpt-5.6-sol | agent: content-growth-marketer
skills: viral-trend-research | 근거: BRAIN 다국어·AI 숏폼·Higgsfield 3페이지, YouTube·TikTok 공식자료, 일본 포맷 관찰 1건
고민: 편의점 음식 소개보다 말 한마디에 멈추는 장면을 택했다. 먹방은 감각 자극은 강하지만 언어 학습과 문화 해석을 한 컷에 묶기 어렵다.

## 한 줄 결론

일본어·영어, 장면 먼저·설명 먼저, Veo·Kling·Seedance, 동일 조건 재생성을 176크레딧 10편으로 분리했다. 실제 생성은 공유 계정이 Plus에서 free로 바뀌며 잔액이 0이 되어 한 건도 접수되지 못했다.

## 1. 목적과 퍼널

- 확산 단계: 관심 → 반응.
- 시청자 JTBD: 한국 여행에서 나도 겪을 작은 순간을 8초 안에 미리 보고, 한국어 한 문장을 기억한다.
- 1차 지표: 첫 1초 유지율, 완주율, 저장률.
- 2차 지표: 댓글의 의미 회상률. 예: `봉투가 bag이라는 걸 이제 앎`.
- 성공 판정은 발행 후에만 한다. 생성 영상의 미학 점수만으로 바이럴을 주장하지 않는다.

## 2. BRAIN 기반

1. `idea-일본-글로벌-다국어-콘텐츠`: 같은 소재를 일본어·영어로 확장해 외화 수익과 어학 학습을 같이 노린다.
2. `idea-AI-숏폼-방송국`: 해외 영상 복제가 아니라 문제·훅·구도·편집 리듬만 연구하고, 한국 사례와 자체 대본으로 다시 만든다.
3. `idea-Higgsfield-MCP-store-visual-자동화`: 생성 전 비용 상한과 실제 청구 기록이 필수다.

## 3. 벤치마크에서 차용한 구조

| 출처 | 관찰 | 차용 | 변경·차별화 |
|---|---|---|---|
| YouTube Shorts deep dive | 첫 1초에 shock, intrigue, satisfy가 필요 | 계산대에서 여행자가 멈추는 행동을 첫 컷에 배치 | 과장 표정 대신 1박 정지와 종이봉투 포인팅으로 해결 |
| TikTok Next 2026 일본 | 완벽하게 가공된 광고보다 자연스러운 이야기·BTS 순간을 선호한다는 플랫폼 신호 | 실제 여행 중 생길 법한 작은 마찰 | 브랜드·상품 자랑을 빼고 무상표 소품만 사용 |
| TikTok 일본 경제효과 2026 | 주 1회 이상 사용자 중 33.5%가 소개된 관광지·장소 방문 경험을 응답 | 저장 가능한 여행 상황을 소재로 채택 | 특정 상점 홍보 대신 어디서나 재현되는 표현 학습으로 전환 |
| 일본 `1분韓国友達話` 편의점 오해 에피소드 | 2024-08-02 집계 기준 64.5만 조회, 1.85만 좋아요. 생활 오해 자체가 서사 엔진 | 오해 → 단서 → 이해의 3박자 | 해당 영상·대사·인물·장면은 전혀 쓰지 않고, `봉투 필요하세요?`라는 별도 원작 대본 제작 |

## 4. 통제 매트릭스

| 비교 | 고정 | 한 개만 바꾸는 변수 | 실험 ID |
|---|---|---|---|
| 일본어 대 영어 | Veo, 장면 먼저, 8초, 9:16, 같은 인물·행동 | 보이스오버 언어 | JP-001a ↔ JP-001b |
| 장면 먼저 대 설명 먼저 | Veo, 일본어, 8초, 같은 사건 | 첫 컷 순서 | JP-001a ↔ JP-001c |
| 모델 차이 | 일본어, 장면 먼저, 8초, 동일 의미 프롬프트 | 생성 모델 | JP-001a ↔ JP-001d ↔ JP-001f |
| 반복성 | 모델·프롬프트·파라미터 전부 동일 | 생성 호출만 반복 | JP-001a ↔ JP-001e |

계획 비용은 JP 100크레딧, 한국 포맷 리메이크 76크레딧, 총 176크레딧이다. 각 모델 견적은 Higgsfield CLI 1.1.23 `generate cost`로 관찰했다.

## 5. 실제 실행 결과

| 시각 | 대상 | 사전 잔액 | 견적 | 결과 | job ID | 실제 청구 | URL·MP4 |
|---|---:|---:|---:|---|---|---:|---|
| 03:37 KST | JP-001a Veo | 332.42 | 12 | 동시 작업 한도 6로 접수 전 거절 | 없음 | 0 | 없음 |
| 03:37 KST | KR-001a Veo | 332.42 | 12 | 동시 작업 한도 6로 접수 전 거절 | 없음 | 0 | 없음 |
| 03:40 KST | 나머지 8편 | 0, free | 152 | 저잔액 중단. 제출하지 않음 | 없음 | 0 | 없음 |

거래 내역에서 03:39:40 KST에 `Subscription Cancelled`, `-194.62`가 관찰됐다. 이것은 이 트랙의 생성 청구가 아니며, 공유 계정 상태 변화다. 타 작업의 job을 이 실험에 귀속시키지 않았다.

## 6. 권리 세탁이 아닌 원본 현지화 규칙

1. 원본 영상·음원·자막 파일을 다운로드하거나 생성 모델 reference로 넣지 않는다.
2. 벤치마크에서 가져오는 것은 `일상 마찰 → 물건 단서 → 사회적 복구` 같은 추상 구조뿐이다.
3. 배경, 인물, 소품, 대사, 컷 순서, 음향을 새로 쓴다. 이번 원작은 무상표 편의점, 종이봉투, 자체 대사다.
4. 일본어와 영어는 직역이 아니라 같은 감정 강도의 현지 문장으로 맞춘다.
5. 생성 영상에는 자막을 맡기지 않는다. 발행본에서 로컬 폰트로 자막과 `AI生成映像` 또는 `AI-generated video` 고지를 추가한다.
6. 음악은 넣지 않는다. 추후 플랫폼 음원 라이브러리를 쓰면 플랫폼별 사용 범위와 수익 배분을 별도 기록한다.
7. 프롬프트, 모델, 파라미터, job ID, URL, 로컬 파일을 편별로 보존한다. 원본성 심사에서 제작 과정을 설명할 수 있어야 한다.

## 7. 평가 루브릭

- 첫 1초: 행동이 설명보다 먼저 보이는가.
- 이야기: 8초 안에 오해, 단서, 이해가 모두 보이는가.
- 언어: 일본어·영어 발음이 자연스럽고 한국어 질문이 식별되는가.
- 기술: 세로 화면, 손·종이봉투·입 모양, 로고·깨진 글자·워터마크.
- 권리: 제3자 영상·음원·고유 캐릭터 0건.
- 반복성: 동일 Veo 2회에서 인물·컷·언어 준수 편차.

현재 영상이 없으므로 위 항목은 모두 `미평가`다. 생성하지 않은 영상을 PASS 처리하지 않는다.

## 8. 레드팀과 셀프심문

경쟁자 공격: `편의점 문화차이는 이미 흔하다.` 맞다. 그래서 상품 추천이 아니라 여행자가 특정 한국어 한 문장에 멈추는 미세 행동을 시리즈 단위로 삼았다. 다음 편의 구조는 같아도 표현과 해결은 매번 달라야 한다.

이 결론이 틀렸다면 가장 그럴듯한 이유: 일본 시청자가 한국어 학습보다 음식의 시각 자극을 더 원할 수 있다. 이를 숨기지 않고, 첫 발행 4편에서 생활 대화 2편과 감각 음식 2편의 저장률을 별도 비교해야 한다.

## 9. 재개 조건

- 계정 크레딧이 최소 226 이상이고 Plus 동시 한도가 비었을 때 두 라인 합계 176을 실행한다. 226은 실행 후 50크레딧 중단선을 남기는 수치다.
- `generate-batch.sh`는 매 제출 전 잔액을 재검사하고, 제출 전 attempt 행을 기록하고, 완료 후 URL과 MP4를 저장한다.
- 생성 순서: JP-001a → JP-001b → JP-001c → JP-001d → JP-001e → JP-001f → KR 4편. 동일 Veo 반복은 같은 실행 창 안에서 유지한다.

SKILLS_USED: viral-trend-research(일본·영어권 숏폼 구조, 플랫폼 문법, 권리 클린 각색 규칙) / SKILLS_SKIPPED: hook-angle-lab(이번 과업은 훅 뱅크보다 생성 통제실험이 중심이라 스킵)

EVAL_RUN_ID: 2026-08-14-kculture-jp-web-content-01
EVAL_STATUS: awaiting_feedback
EVAL_AGENT: content-growth-marketer
EVAL_SKILLS: viral-trend-research
EVAL_ARTIFACT: web_content
평가 요청: 좋음/애매/별로 중 하나랑 이유 한 줄만 줘. 예: "애매, 설계는 좋은데 실제 영상이 없어 판단 불가."

RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=4/5 slop=5/5 total=22/25
WEAKEST_LINE: "다음 편의 구조는 같아도 표현과 해결은 매번 달라야 한다." : 맞는 방향이지만 발행 데이터 전에는 차별화 효과가 미검증이다.

DESIGN_SCORE: B (정적 실험 허브, 모바일·데스크톱 반응형, 오류·미생성·오버플로 상태 표시. 영상 부재로 시각 비교 기능은 미검증)

SOURCES: https://blog.youtube/creator-and-artist-stories/youtube-shorts-deep-dive/ ; https://ads.tiktok.com/business/ja/next ; https://ads.tiktok.com/business/ja/blog/tiktok-socio-economic-impact-report-2026?redirected=1 ; https://yutura.net/channel/97438/video/cHoeSQb56WM/ ; https://support.google.com/youtube/answer/1311392?hl=en ; https://support.google.com/youtube/answer/12504220?hl=en ; https://support.google.com/youtube/answer/9783148?hl=en ; /Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/pmf/idea-일본-글로벌-다국어-콘텐츠.md ; /Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/pmf/idea-AI-숏폼-방송국.md ; /Users/sj/Documents/SJ_BRAIN_wiki/wiki/cto/ai/idea-Higgsfield-MCP-store-visual-자동화.md ; Higgsfield CLI 1.1.23 account/model/cost/create 출력
MODEL: gpt-codex/gpt-5.6-sol
