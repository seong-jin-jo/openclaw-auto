# v48 디자인 셀프 리뷰

> 한 줄 결론: v47의 Design Score C 원인이던 모바일 대화, 12px 미만 글자, 40px 터치 영역을 모두 실렌더에서 제거했다. 셀프 판정은 Design Score B이며 독립 재채점은 아직 필요하다.

## 1. 판정

**DESIGN_SCORE: B (셀프 리뷰)**

v48은 새 화면을 만들지 않고 v47의 통과한 1024 구조와 131개 화면을 그대로 승계했다. 수정 범위는 390 대화 세로 배분, 제품 글자 하한, 모바일 터치 하한, 선택지 스크롤 마감, transition 속성 제한이다.

독립 `design-review` 스킬은 현재 Codex 설치 목록에 없어 셀프 리뷰로 대체했다. 따라서 B는 출고 주장보다 독립 재채점의 입력값이다.

## 2. 수용기준 실측

| 수용기준 | 1440 | 1024 | 390 | 판정 |
|---|---:|---:|---:|---|
| 보이는 제품 UI 글자 12px 미만 | 0건 | 0건 | 0건 | 통과 |
| 대화 본문 `clientHeight` | 360px | 360px | 152px | 통과 |
| 첫 선택지 가시율 | 100% | 100% | 100% | 통과 |
| 입력과 보이는 선택지 겹침 | 없음 | 없음 | 없음 | 통과 |
| 390 보이는 버튼·탭·입력 44px 미만 | 해당 없음 | 해당 없음 | 0건 | 통과 |
| 활성 `transition-property: all` | 0건 | 0건 | 0건 | 통과 |

측정 정본은 [qa-results.json](./qa-results.json)이다. 390 대화 패널은 y=475~795, 대화 본문은 y=584~736, 입력은 y=736~801이다. 서로 같은 경계에서 이어지고 면적 겹침은 없다.

## 3. 픽셀 직접 확인

| 폭 | 직접 본 화면 | 판정 |
|---|---|---|
| 1440 | [캡처](./openclaw-auto-v48-1440.png) | 224px 탐색, 넓은 본문, 304px 담당의 기존 구조 유지. 카드와 대화가 잘리지 않음 |
| 1024 | [캡처](./openclaw-auto-v48-1024.png) | 56px 아이콘 줄과 담당 비율 0.290 유지. 글자 단위 분절, 딱지 잘림, 가로 넘침 0 |
| 390 | [캡처](./openclaw-auto-v48-390.png) | 첫 선택지와 두 번째 선택지, 44px 이상 입력과 보내기 단추가 같은 첫 화면에 보임 |

카드 여백 A와 B 토글, 화면 담기·저장·미리보기·복사, 다섯 상태, 라이트·다크, 131개 화면 정의가 유지됨을 자동 검사로 확인했다. v47은 987,753바이트, v48은 992,457바이트로 원본보다 줄지 않았다.

## 4. 범주별 채점

| 범주 | 등급 | 근거 |
|---|---|---|
| 시각 위계 | B | 세 폭에서 현재 흐름, 작업물, 담당의 순서가 유지됨 |
| 타이포그래피 | B | 보이는 제품 UI 12px 미만 0건. 예외 없음 |
| 간격과 레이아웃 | B | 8pt 계열 유지, 세 폭 가로 넘침 0 |
| 상호작용 | B | 모바일 44px 미만 조작 0건, 첫 선택지 100% 노출 |
| 반응형 | B | 1024 통과안을 보존하고 390 대화 본문을 152px로 회복 |
| 콘텐츠 | B | 방 이름 본문 재노출 0, 내부 코드 노출 0 |
| 모션 | B | 활성 `all` 0건, 실제 변화 속성만 열거 |
| 출고 준비 | B | 세 폭 실렌더, 계산 스타일, 콘솔 오류 0 |

## 5. 레드팀과 셀프심문

**RED_TEAM.** 까다로운 고객은 390에서 본문을 줄여 대화만 살린 눈속임이라고 공격할 수 있다. 화면을 직접 확인하면 현재 작업물, 받아온 묶음, 다음 묶음, 읽고 쌓는 정보, 학습 고리는 남아 있다. 자동 측정도 흐름 가로 넘침, 딱지 잘림, 글자 단위 분절을 모두 0으로 기록했다.

**SELF_QUESTION.** 이 결론이 틀렸다면 가장 그럴듯한 이유는 첫 선택지를 보이게 하려고 질문 맥락이나 입력을 화면 밖으로 밀었기 때문이다. 390 캡처에는 질문, 첫 선택지, 두 번째 선택지, 입력, 보내기 단추가 함께 보인다. 대화 본문 152px과 입력 65px의 좌표도 겹치지 않는다. 이 확인 뒤 모바일 본문 높이를 272px, 담당 최대 높이를 320px로 DESIGN.md v26에 고정했다.

## 6. 다음 단계

**독립 디자인 재채점: 가능.** 필수 수용기준과 시각 검수 증거가 준비됐다.

**기술설계 진입: 독립 Design Score B 이상 확인 뒤 가능.** 현재 B는 셀프 리뷰라 게이트 승인 증거로 단독 사용하지 않는다.

---

🏷 STAMP | line: openclaw-auto | 생성: 2026-08-24 17:03 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

고민: 모바일 대화 높이를 늘리면서 입력을 화면 밖으로 밀지 않도록 본문과 담당의 세로 예산을 함께 재배분했다.

SKILLS_USED: qa. headless 실렌더 캡처, computed style, 좌표, overflow, 콘솔 오류 검증에 사용

SKILLS_SKIPPED: 독립 design-review는 현재 Codex 설치 목록에 없어 실행하지 못함. design.md와 doc-review.md의 리뷰 절차를 적용

SOURCES: `docs/prototype/openclaw-auto-4room-v47.html` · `docs/prototype/qa-v47/design-review-v47.md` · `DESIGN.md` v26 · `docs/구현현황.md` · `docs/WIREFRAMES/openclaw-auto-content-loop-v47-gpt-codex.md` · `docs/user-flow.md` · `wiki/product/marketing-hub-surface-map.md` · `/Users/sj/.claude/standards/design.md` · `/Users/sj/.claude/standards/doc-review.md` · <https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced> · <https://www.w3.org/WAI/WCAG22/Techniques/css/C43> · <https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-padding-bottom>

MODEL: gpt-codex/gpt-5.6-sol

STATUS: READY_FOR_INDEPENDENT_REVIEW
