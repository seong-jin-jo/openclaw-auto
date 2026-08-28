---
STAMP
line: osmu-studio-infra
생성시각: 2026-08-14 18:55 KST
model: gpt-5 (Codex, 세부 배포 ID 미노출)
agent: content-growth-marketer
skills: 없음. 기존 생성 이미지 44장과 실험 원장을 품질 게이트로 증류한 기술 문서
근거: EC0147 이미지 모델 6종 통제 실험, 전편 소재 38장 전수 육안 검사, 실청구 원장
고민: 한 장 통제 실험의 우승 모델을 범용 1위로 과장하지 않고 경제 교육형 화면의 기본 라우팅으로만 고정했다.
---

# 이미지 생성 품질헌법

## 1. 적용 범위와 합격선

이 문서는 세로 숏폼과 카드뉴스에 들어갈 생성 이미지의 합격선을 정한다. 파일이 열리고 장면이 얼추 맞는 것은 생성 성공일 뿐이다. 다음 조건을 모두 만족해야 편집 투입 가능이다.

1. 대본의 핵심 사물, 행동, 인과가 첫눈에 읽힌다.
2. 화면 안에 의도하지 않은 문자, 숫자, 로고, UI가 없다.
3. 9:16에서 주 피사체가 잘리지 않고 후편집 텍스트 공간이 남는다.
4. 인물 손, 손가락, 얼굴, 사물 접합부에 치명적 오류가 없다.
5. 벤처의 팔레트, 사실성, 금지선과 맞는다.
6. 실제 원본을 100% 육안 검사했다. 접촉시트만 보고 개별 파일을 통과시키지 않는다.

하나라도 실패하면 `REJECT`, 크롭이나 인페인트로 복구 가능하면 `FIX`, 무수정 편집 투입 가능할 때만 `PASS`다.

## 2. 프롬프트 문법

### 2.1 기본 순서

프롬프트는 아래 순서로 쓴다.

```text
[매체와 화면비]
[주 피사체와 장소]
[한 프레임 안에서 보여야 할 행동 또는 인과]
[구도와 후편집 여백]
[조명, 재질, 화풍]
[브랜드 금지선]
[문자 금지 조항]
```

EC0147에서 검증된 골격은 다음과 같다.

```text
Vertical 9:16 editorial infographic scene.
Three blank economic documents represented by a factory, shopping basket, and worker icon slide together into one central blank index card.
Centered composition with clean negative space for local overlays.
Deep navy and warm cream palette, mint and amber accents, subtle paper grain.
No logos, no watermark, no stock ticker, no trading signal.
Absolutely no text, no letters, no numbers, no signage, no labels, no UI anywhere in the image.
```

### 2.2 텍스트 금지 규칙

문자 금지 문장은 프롬프트 맨 끝에 둔다. 하지만 부정형 지시만 믿으면 안 된다. EC0147 전편 38장에서는 지도, 달력, 신문이 있는 장면 3장에 금지 지시를 넣고도 문자가 생겼다. 실사 시험판의 Z Image는 8장 중 7장에 문자나 숫자를 만들었다.

따라서 문자 유발 소품은 다음처럼 바꾼다.

| 위험 소품 | 금지되는 요청 | 안전한 장면 설계 |
|---|---|---|
| 신문 | 한국어 헤드라인을 생성 이미지에 요청 | 제목과 본문 칸이 비어 있는 종이, 실제 문구는 PIL 합성 |
| 달력 | 날짜와 요일이 보이는 달력 | 빈 격자 또는 종이 넘김만 생성, 날짜와 도장은 로컬 합성 |
| 스마트폰 | 앱 화면, 매수 버튼, 검색 결과 | 무표기 표면이나 추상 패널, 버튼과 UI는 로컬 합성 |
| 지도 | 지역명과 지표가 있는 지도 | 무표기 대한민국 실루엣, 점과 라벨은 로컬 합성 |
| 계기판 | 숫자와 눈금이 있는 실제 계기판 | 무표기 곡선과 추상 게이지 |

문자를 정확히 보여야 하면 생성 모델을 쓰지 않는다. 로컬 PIL 합성을 기본값으로 한다.

## 3. 화풍 지시 방법

화풍은 장면 설명과 분리한 마지막 스타일 블록으로 고정한다. 같은 시리즈 안에서는 스타일 블록을 복사해 쓴다.

### 에디토리얼 일러스트

```text
Style: deep navy and warm cream palette, mint and amber accents, subtle paper grain, editorial infographic illustration, flat vector-like finish.
```

용도: 개념 정의, 구조 설명, 비교, 아이콘, 순서.

### 실사 다큐멘터리

```text
Style: photorealistic documentary photography, shot on 35mm, natural available light, real Korean interiors and objects, muted color grade.
```

용도: 훅, 생활 장면, 행동 인서트, 자기투영.

화풍은 크레딧을 움직이지 않았다. 같은 모델과 해상도에서는 실사와 일러스트의 단가가 같았다. 비용을 줄이려면 화풍이 아니라 모델, 해상도, 생성 횟수를 바꾼다.

## 4. 모델 선택 기준과 실측 단가

아래 단가는 2026-08-14 Higgsfield CLI 견적과 실청구가 일치한 EC0147 9:16 통제 실험 값이다. 서비스 가격 변경 시 재조회한다.

| 모델 | job_type | 실청구/장 | 실측 규격 | EC0147 판정 | 기본 용도 |
|---|---|---:|---|---|---|
| Z Image | `z_image` | 0.15 | 1152x2048 | 저렴하지만 문자 금지와 장면 인과가 약함 | 폐기 가능한 러프, 단순 배경 |
| Nano Banana 2 Lite | `nano_banana_2_lite` | 1.00 | 768x1376 | 통제 장면 재현과 텍스트 배제 모두 상 | 저비용 러프와 대량 시안 |
| Nano Banana 2 | `nano_banana_flash` | 1.50 | 768x1376 | EC0147 교육 화면 1위 | 경제 교육형 기본 모델 |
| GPT Image 2 | `gpt_image_2` | 7.00 | 1520x2688 | 재질은 정교했지만 지시를 수묵 두루마리로 변형 | 정교한 재질, 제품, 별도 벤치 후 사용 |
| Recraft V4.1 | `recraft_v4_1` | 1.25 | 768x1344 | 깨끗하지만 핵심 인과와 아이콘이 소실 | 단순 그래픽, 별도 벤치 후 사용 |
| Seedream 5.0 Lite | `seedream_v5_lite` | 1.00 | 1600x2848 | 정돈감은 좋으나 도장 문양과 타격감이 약함 | 고해상도 정적 장면 후보 |

선택 순서는 다음과 같다.

1. 조곤경제형 사물, 아이콘, 신문, 달력 설명 화면은 Nano Banana 2에서 시작한다.
2. 초저비용 러프는 Nano Banana 2 Lite를 쓴다.
3. 인물 피부, 제품 광고, 정확한 외국어 타이포그래피는 이 표를 재사용하지 말고 별도 통제 벤치를 연다.
4. 한 장 비교 결과를 다른 벤처와 다른 장면 유형으로 일반화하지 않는다.

## 5. 실패 패턴과 방지 규칙

| 실패 | 직접 관찰 | 방지 규칙 |
|---|---|---|
| 문자 자동생성 | 전편 38장 중 3장, 실사 Z Image 8장 중 7장 | 문자 소품 제거, 빈 표면 생성, 100% 확대 검사, 로컬 합성 |
| 숫자와 UI 생성 | 폰 촬영 비유가 녹화 버튼과 타이머로 변환 | `phone recording` 같은 비유 금지, UI 없는 장면을 긍정형으로 기술 |
| 손 오류 | 버튼과 손이 가까운 장면은 접촉과 해부 오류 위험 | 손 전체보다 손가락 인서트, 끝 프레임 검사, 결함 시 영상이나 스톡 전환 |
| 장면 인과 소실 | Recraft가 달력을 영수증 롤로 바꾸고 그래프 정보를 잃음 | 반드시 보여야 할 사물을 3개 이하로 제한, 각 사물의 관계를 동사로 씀 |
| 과도한 한국성 연출 | 전통 소품을 억지로 넣으면 실제 한국 생활과 멀어짐 | `real Korean interiors and objects`로 생활 공간만 지정, 전통 기호 남용 금지 |
| 생성 성공 과장 | 38장 생성 성공이어도 3장은 무수정 발행 불가 | `generated`, `fix`, `approved` 상태 분리 |

## 6. 검수 체크리스트

### 생성 전

- [ ] 대본의 한 컷과 프롬프트의 한 장면이 1:1로 대응한다.
- [ ] 핵심 사물과 행동이 3개 이하로 압축됐다.
- [ ] 9:16과 피사체 위치, 후편집 여백이 명시됐다.
- [ ] 문자 유발 소품을 빈 표면이나 추상 사물로 바꿨다.
- [ ] 마지막 줄에 문자, 숫자, 간판, 로고, UI 금지 조항이 있다.
- [ ] 생성 전 견적을 기록했다.

### 생성 후

- [ ] 원본 파일을 100% 배율 이상으로 열어 문자와 숫자를 전수 확인했다.
- [ ] 손가락 수, 손목 접합, 얼굴 대칭, 사물 경계를 확인했다.
- [ ] 핵심 인과가 설명 없이 읽힌다.
- [ ] 크롭 뒤에도 피사체와 후편집 여백이 남는다.
- [ ] 팔레트와 화풍이 같은 시리즈의 기준 컷과 맞는다.
- [ ] `PASS`, `FIX`, `REJECT` 중 하나를 기록했다.
- [ ] 견적과 실청구를 대조했다.

## 7. 증거 등급

- 관찰됨: 6모델 6장, Nano Banana 2 전편 38장, Z Image 실사 8장.
- 테스트됨: 44장 PNG 판독과 해상도 확인, 접촉시트와 원본 육안 검사.
- 미검증: 다른 벤처 인물 중심 컷, 제품 광고, 정확한 다국어 타이포그래피.

RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=4/5 slop=5/5 total=22/25
WEAKEST_LINE: "화풍은 장면 설명과 분리한 마지막 스타일 블록으로 고정한다." 기술적으로 정확하지만 왜 그런지가 다음 문장까지 가야 드러난다.

SKILLS_USED: 없음. 실험 증거를 기술 품질 게이트로 증류하는 과업이라 콘텐츠 생성 스킬을 쓰지 않음.
SKILLS_SKIPPED: viral-trend-research. 최신 경쟁 조사에는 사용했지만 이 내부 이미지 품질헌법은 외부 트렌드보다 자사 실측이 진실원이라 스킵.

SOURCES/MODEL:
- `/Users/sj/OSMU-archive/haejo-danta/_experiment/이미지모델-비교와-전편소재-2026-08-14.md`
- `/Users/sj/OSMU-archive/haejo-danta/_experiment/실사숏폼-시험판-2026-08-14.md`
- `/Users/sj/OSMU-archive/haejo-danta/_experiment/실험로그-힉스필드.md`
- `/Users/sj/OSMU-archive/README.md`

MODEL: gpt-5 (Codex). 런타임의 더 세부적인 배포 ID는 환경에 노출되지 않음.
