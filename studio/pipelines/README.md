---
STAMP
line: osmu-studio-infra
생성시각: 2026-08-14 18:55 KST
model: gpt-5 (Codex, 세부 배포 ID 미노출)
agent: content-growth-marketer
skills: 없음. 기존 build.py와 EC0147 제작 메커니즘을 재사용 인프라 문서로 정리
근거: tmp full/build.py 131줄 원문, EC0147 영상 제작 메커니즘, 변수별 실험 보고서
고민: 하드코딩된 실험 스크립트를 일반화 완료라고 포장하지 않고 현재 입력 계약과 다음 리팩터 경계를 분리했다.
---

# OSMU Studio 재사용 파이프라인

## 1. 현재 상태

`build.py`는 EC0147 전편을 조립한 실험 스크립트의 원문 복사본이다. 대사, 이미지 파일명, 컷 분할, 자막, 오버레이, 폰트 경로가 코드에 하드코딩돼 있다. 현재 그대로 다른 벤처에 투입할 수 있는 범용 CLI는 아니다.

- 원본: `/private/tmp/claude-501/-Users-sj-sj-code-master-haejo-danta/8aed44c9-646d-4c62-8d0d-27a964e06e11/scratchpad/full/build.py`
- 보존본: `/Users/sj/OSMU-archive/pipelines/build.py`
- 복사 방식: 원문 131줄을 수정 없이 보존.

## 2. 전체 제작 단계

| 단계 | 책임 | 입력 | 출력 | 크레딧 |
|---|---|---|---|---:|
| 1. 인테이크 | 벤처와 스튜디오 | 브랜드 가이드, 주제, 대본, 금지선, 채널 | 승인된 제작 브리프 | 0 |
| 2. 컷 분해 | 로컬 | 대본 | 컷별 음성, 이미지, 자막, 오버레이 명세 | 0 |
| 3. 음성 생성 | 외부 생성기 | 컷별 대사, 고정 voice_id | `vo1.wav` 계열 | 외부 모델별 |
| 4. 이미지 생성 | 외부 생성기 | 글자 없는 장면 프롬프트 | `im1a.png` 계열 | 외부 모델별 |
| 5. 한글 레이어 | `build.py`, PIL | 자막, 태그, 용어칩, 고지 | 투명 PNG 레이어 | 0 |
| 6. 컷 조립 | `build.py`, FFmpeg | 이미지, 음성, 투명 PNG | `part01.mp4` 계열 | 0 |
| 7. 최종 연결 | FFmpeg concat | 컷 mp4와 `list.txt` | 최종 1080x1920 mp4 | 0 |
| 8. 검수 | ffprobe와 육안 | 최종 mp4 | 규격, 자막, 오디오, 프레임 판정 | 0 |

외부 생성기는 원재료만 만든다. 한글 자막, 용어칩, 고지, 레이아웃, 타이밍, 줌, 컷 연결, 최종 인코딩은 로컬 파이프라인의 책임이다.

## 3. `build.py` 실행 계약

### 3.1 의존성

```text
Python 3
Pillow
ffmpeg
ffprobe
Pretendard Bold
Pretendard SemiBold
```

폰트 탐색 순서:

1. `/Users/sj/Library/Fonts/Pretendard-Bold.ttf`
2. `/Users/sj/Library/Fonts/Pretendard-SemiBold.ttf`
3. 없으면 `/System/Library/Fonts/AppleSDGothicNeo.ttc`

### 3.2 작업 디렉터리

스크립트는 자신의 파일이 있는 디렉터리로 `chdir`한다. 따라서 현재 버전은 입력 파일을 `pipelines/`에 같이 두어야 실행된다. 자산과 출력이 코드 폴더에 섞이는 구조다.

### 3.3 입력 파일 형식

음성:

```text
vo1.wav
vo2.wav
...
vo11.wav
```

- WAV 파일.
- 컷 id와 번호가 같아야 한다.
- ffprobe가 읽을 수 있어야 한다.
- 음성 길이가 해당 컷의 전체 길이를 결정한다.

이미지:

```text
im1a.png
im1b.png
im2.png
im3a.png
...
im10.png
```

- PNG 파일.
- CUTS의 `imgs` 배열과 이름이 정확히 같아야 한다.
- 소스는 9:16이 권장된다.
- 스크립트가 1242x2208로 확대 후 1080x1920 `zoompan`을 적용한다.

컷 명세는 Python의 `CUTS` 리스트다.

```python
dict(
    id=1,
    imgs=["im1a.png", "im1b.png"],
    split=[0.66],
    subs=[
        ("첫 줄|둘째 줄", 0.00, 0.36),
        ("다음 자막", 0.36, 1.00),
    ],
    overs=[
        ([('32', 'big', (505, 955))], 0.02, 0.64),
    ],
)
```

필드 의미:

| 필드 | 형식 | 의미 |
|---|---|---|
| `id` | 정수 | 컷 번호와 `vo{id}.wav` 연결 |
| `imgs` | 파일명 배열 | 컷 안에서 순서대로 사용할 이미지 |
| `split` | 0부터 1 사이 소수 배열 | 이미지 전환 경계. 이미지가 2장이면 경계 1개 |
| `subs` | `(문구, 시작비율, 종료비율)` 배열 | 음성 전체 길이에 대한 자막 노출 비율 |
| `overs` | `(요소배열, 시작비율, 종료비율)` 배열 | 숫자, 미니설명, 칩, 도장 레이어 |

자막 문자열의 `|`는 강제 줄바꿈이다. 비율은 초가 아니라 컷 전체 음성 길이의 0부터 1 사이 값이다.

오버레이 스타일:

| style | 크기 | 용도 |
|---|---:|---|
| `big` | 190px | 대형 숫자 |
| `red` | 110px | 경고와 불황 강조 |
| `mini` | 52px | 보조 설명 |
| `chip` | 60px | 용어칩 |
| `stamp` | 110px | 판정 도장 |

### 3.4 출력

스크립트가 직접 만드는 파일:

```text
L_tag.png
L_disc.png
O_<컷>_<순번>.png
S_<컷>_<순번>.png
part01.mp4 ... part11.mp4
list.txt
```

현재 `build.py`는 `list.txt`를 만든 뒤 `PARTS OK`를 출력하고 끝난다. 최종 concat은 자동 실행하지 않는다.

## 4. 재사용 방법

현재 버전을 재현용으로 쓸 때:

1. 별도 작업 폴더에 `build.py`를 복사한다.
2. `vo*.wav`와 `im*.png`를 같은 폴더에 둔다.
3. `CUTS`의 이미지, 자막, 오버레이, 분할 비율을 새 대본에 맞게 바꾼다.
4. Pillow, ffmpeg, ffprobe가 있는지 확인한다.
5. 끝나는 명령으로 스크립트를 실행한다.

```bash
python3 build.py
```

6. 컷 파일이 모두 생성되면 같은 규격인지 ffprobe로 확인한다.
7. 최종 연결을 실행한다.

```bash
ffmpeg -y -f concat -safe 0 -i list.txt -c copy final-9x16.mp4
```

컷의 코덱, 해상도, fps, 오디오 규격이 다르면 concat 전에 1080x1920, 25fps, H.264와 AAC로 정규화한다.

## 5. 현재 코드가 보존하는 기능

- 음성 길이에 맞춘 컷 길이 결정.
- 여러 이미지의 비율 기반 분할.
- Ken Burns형 `zoompan`.
- PIL 기반 한글 자막.
- 상단 용어 태그.
- 컷4 이후 투자 비추천 고지.
- 대형 숫자, 경고, 미니설명, 용어칩, 판정 도장.
- 자막과 오버레이의 정규화 시간비율.
- 컷별 H.264와 AAC 인코딩.
- concat용 `list.txt` 생성.

일반화 과정에서 이 기능을 삭제하면 회귀다.

## 6. 일반화 방향

코드 전면 재작성은 이번 범위가 아니다. 다음 순서로 분리한다.

### 6.1 1단계: 입력 명세 외부화

- `CUTS`를 JSON 또는 YAML manifest로 이동.
- 대사, 이미지, 자막, 오버레이, split을 코드 밖에서 받기.
- 인테이크의 venture slug와 brand kit 경로를 manifest에 연결.

### 6.2 2단계: 브랜드 테마 분리

- 폰트, 팔레트, 상단 태그, 고지, 용어칩을 `theme.json`으로 이동.
- 벤처별 `assets/brand-kits/<venture>/`에서 로고와 팔레트 로드.
- 고지 원문은 자동 생성하지 않고 인테이크 값만 사용.

### 6.3 3단계: 실행 경계 분리

- `--manifest`, `--assets-dir`, `--output-dir` CLI 인자 추가.
- 코드 폴더와 자산, 임시 레이어, 최종 출력을 분리.
- 재실행 시 기존 승인 자산을 덮어쓰지 않도록 run id 부여.

### 6.4 4단계: 사전 검증

- 누락된 음성, 이미지, 폰트, 잘못된 split을 렌더 전 검사.
- 자막 비율이 겹치거나 0부터 1을 벗어나면 실패.
- 이미지 수와 split 수가 `N` 대 `N-1`인지 검사.
- 모든 컷의 오디오 길이와 출력 예상 길이를 dry run으로 표시.

### 6.5 5단계: 최종 조립과 증거 자동화

- concat까지 스크립트가 수행.
- ffprobe 결과를 JSON으로 저장.
- 8%, 27%, 50%, 73%, 92% 프레임을 자동 추출.
- 견적, 실청구, 모델, 생성 자산 provenance를 run manifest에 결합.

## 7. 미해결과 금지선

- 현재는 하드코딩된 EC0147 전용 스크립트다. 범용화 완료가 아니다.
- 입력 자산의 라이선스와 AI 고지 원장은 아직 연결되지 않았다.
- 음성 생성과 이미지 생성은 이 스크립트가 하지 않는다.
- 힉스필드 크레딧 0 지시 때문에 이번 작업에서는 신규 생성이나 비용 조회 후 생성이 없었다.
- 임의로 외부 생성기를 호출하는 자동 폴백을 넣지 않는다.

RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=4/5 slop=5/5 total=22/25
WEAKEST_LINE: "현재 그대로 다른 벤처에 투입할 수 있는 범용 CLI는 아니다." 냉정한 현황이지만 다음 절을 읽기 전에는 재사용 가치가 낮게만 보일 수 있다.

SKILLS_USED: 없음. 기존 Python과 FFmpeg 파이프라인의 재사용 계약을 문서화한 기술 작업.
SKILLS_SKIPPED: openclaw-creative-brief. 자동 생성 에이전트 프롬프트가 아니라 현재 로컬 실행 계약과 일반화 경계를 기록하는 문서라 스킵.

SOURCES/MODEL:
- `/private/tmp/claude-501/-Users-sj-sj-code-master-haejo-danta/8aed44c9-646d-4c62-8d0d-27a964e06e11/scratchpad/full/build.py`
- `/Users/sj/OSMU-archive/haejo-danta/_experiment/영상제작-메커니즘-플로우-2026-08-14.md`
- `/Users/sj/OSMU-archive/haejo-danta/_experiment/실험보고서-변수별-평가-2026-08-14.md`
- `/Users/sj/OSMU-archive/haejo-danta/_experiment/실사숏폼-시험판-2026-08-14.md`

MODEL: gpt-5 (Codex). 런타임의 더 세부적인 배포 ID는 환경에 노출되지 않음.
