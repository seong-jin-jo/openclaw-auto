# 해외 숏폼 구조의 권리 클린 한국 현지화 실험

🏷 STAMP | line: format-remake-kr | 생성: 2026-08-14 03:44 KST | model: gpt-5.6-sol | agent: content-growth-marketer
skills: viral-trend-research | 근거: BRAIN AI 숏폼 방송국, YouTube 원본성·재사용·저작권 정책, 일본 생활 오해 숏폼 관찰
고민: 특정 해외 영상을 번안하면 권리와 수익화가 모두 흐려진다. 그래서 표현을 가져오지 않고 `오해 → 물건 단서 → 관계 복구`라는 추상 서사 엔진만 남겼다.

## 한 줄 결론

외국 영상 재업로드가 아니라 완전 원작인 `비 오는 카페의 우산 착각`을 만들고, 장면 순서와 모델만 바꾸는 4편·76크레딧 실험을 설계했다. 공유 Higgsfield 계정이 0크레딧·free로 전환되어 실제 job은 생성되지 않았다.

## 실험 설계

| 비교 | 고정 | 변수 | 실험 ID |
|---|---|---|---|
| 도입 순서 | Veo, 한국어, 같은 인물·우산·결말 | 장면 먼저 vs 설명 먼저 | KR-001a ↔ KR-001b |
| 모델 | 한국어, 장면 먼저, 같은 원작 대본 | Veo vs Kling vs Seedance | KR-001a ↔ KR-001c ↔ KR-001d |

- 장면: 카페 우산꽂이의 검은 우산 두 개.
- 긴장: 회사원이 남의 우산을 잡는다.
- 단서: 상대가 손잡이의 빨간 실을 돌려 보여준다.
- 복구: 회사원이 깨닫고 목례한 뒤 다른 우산을 가져간다.
- 모든 인물·공간은 허구다. 타사 영상, 음원, 로고, 고유 캐릭터를 쓰지 않는다.

## 왜 이 정도로 갈아엎는가

YouTube는 다른 플랫폼 영상의 재업로드, 최소 수정, 대량 템플릿을 수익화 부적격 예시로 든다. 허락을 받았더라도 재사용 콘텐츠 심사는 저작권 심사와 별개다. 또한 아이디어·사실·과정과 달리 구체적인 영상 표현, 대사, 음원은 저작권 대상이 될 수 있다.

따라서 이 라인은 다음을 금지한다.

1. 원본 파일 다운로드와 자막만 교체.
2. 원본 영상을 video-to-video reference로 업로드.
3. 원 대사의 번역 낭독.
4. 고유 캐릭터, 반복 개그, 음악, 썸네일 구도 복제.
5. `출처 표기했으니 괜찮다`는 면책 문구 의존.

허용하는 것은 추상 패턴의 연구다. `첫 1초의 실수`, `시각 단서`, `짧은 사회적 복구`를 가져오되, 모든 표현을 새로 만든다.

## 실행 증거

- KR-001a 사전 견적: 12크레딧.
- 2026-08-14 03:37 KST 제출: 동시 작업 한도 6로 job ID 발급 전 거절. 실제 청구 0.
- 03:40 KST 계정: 0크레딧, free. 나머지 3편은 `PREPARED_NOT_RUN`.
- 로컬 MP4와 결과 URL: 없음. 생성되지 않은 값을 채우지 않았다.
- 준비 총액: 76크레딧. 전체 두 라인 합계 176크레딧.

## 생성 후 평가 기준

- 빨간 실이 첫 시청에 단서로 읽히는가.
- 손가락·우산 손잡이·목례가 물리적으로 자연스러운가.
- 설명 먼저 버전이 장면의 긴장을 죽이는가.
- 세 모델의 세로 안정성, 컷 준수, 한국어 음성, 깨진 글자 발생률.
- 동일 구조가 다른 소품으로 바뀌어도 새 이야기처럼 느껴지는가. 아니면 대량 템플릿처럼 보이는가.

## 레드팀과 셀프심문

권리자 공격: `소재만 바꾼 표절 아닌가.` 방어선은 문구가 아니라 제작 기록이다. 특정 원작을 입력하지 않았고, 대사·인물·소품·공간·컷·음향을 독립 제작했으며 프롬프트와 job 기록을 보존한다.

이 결론이 틀렸다면 가장 그럴듯한 이유: 추상 구조가 너무 일반적이라 바이럴 차별성이 없다. 발행 전 해결책은 자극을 더하는 것이 아니라, 빨간 실처럼 한 컷에 기억되는 물리 단서를 매편 새로 발명하는 것이다.

SKILLS_USED: viral-trend-research(플랫폼 원본성 정책, 생활 오해 포맷 분해, 권리 클린 현지화 규칙) / SKILLS_SKIPPED: social-post-packager(실제 렌더가 없어 발행용 패키징 단계가 아님)

EVAL_RUN_ID: 2026-08-14-format-remake-kr-web-content-01
EVAL_STATUS: awaiting_feedback
EVAL_AGENT: content-growth-marketer
EVAL_SKILLS: viral-trend-research
EVAL_ARTIFACT: web_content
평가 요청: 좋음/애매/별로 중 하나랑 이유 한 줄만 줘. 예: "좋음, 권리 기준은 선명하지만 소재 훅이 약함."

RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=4/5 slop=5/5 total=22/25
WEAKEST_LINE: "허용하는 것은 추상 패턴의 연구다." : 원칙은 정확하지만 실제 렌더와 유사도 검토 전에는 방어력이 완결되지 않는다.

SOURCES: https://support.google.com/youtube/answer/1311392?hl=en ; https://support.google.com/youtube/answer/12504220?hl=en ; https://support.google.com/youtube/answer/9783148?hl=en ; https://support.google.com/youtube/answer/2797466?hl=en ; https://blog.youtube/creator-and-artist-stories/youtube-shorts-deep-dive/ ; https://yutura.net/channel/97438/video/cHoeSQb56WM/ ; /Users/sj/Documents/SJ_BRAIN_wiki/wiki/business/pmf/idea-AI-숏폼-방송국.md ; Higgsfield CLI 1.1.23 account/model/cost/create 출력
MODEL: gpt-codex/gpt-5.6-sol
