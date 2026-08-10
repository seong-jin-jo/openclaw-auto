# OSMU 디자인 시스템 실제 코드 build — exit report

## 한 줄 결론

v23 디자인 시스템과 3개 핵심 화면 마이그레이션은 코드·단위·통합·전체 테스트·production build까지 통과했으나, 샌드박스의 로컬 포트 바인딩 차단으로 3폭 브라우저 증거는 미검증이다. 따라서 build 산출은 제출 가능하지만 QA 완료로 판정하지 않는다.

## 1. 기존 자산 재사용

| 구분 | 내용 |
|---|---|
| 이어받음 | `globals.css`의 라이트/다크 시맨틱 색상, 기존 `Card`, `StatusBadge`, `EmptyState`, 세 화면의 모든 상태·API handler·라벨·라우트, Studio `PlatformPreview` 2곳과 발행 이력 패널 |
| 새로 구현 | `Button(primary/secondary/danger, sm/md/lg, min-height 44px)`, `Stack(4/8/12/16/24/32만 허용)`, `Section`, `Field`, v23 간격·글자 토큰, 하한 안전망 |
| 정합화 | 기존 `Card` 본문 wrap, `StatusBadge` 라벨 non-shrink/non-truncate, `EmptyState` 토큰 간격·본문 단계 |
| 만들지 않음 | 새 route, 새 화면, 새 기능, 새 API, 새 라벨, 새 빈/오류 상태 |

## 2. 기능 대조표

| 화면 | 유지한 기존 기능 | 추가·변경한 것 | 기능 변경 |
|---|---|---|---|
| `app/page.tsx` | 온보딩 분기, 플랫폼 focus, 성과/아이디어/수집 API, 발행물·사용량·주간성과·활동·알림·채널·에이전트 패널 | 공통 Button/Stack/Section/Card와 v23 토큰으로 시각부품 교체 | 0 |
| `app/studio/page.tsx` | 브랜드/위키, OSMU·AI 생성, 저장, Publish, 예약, 취소, 계정선택, 7 preview, drawer 편집/재생성, draft 이력 | 상단/진행/drawer 제어를 Button/Stack/Field로 교체 | 0 |
| `components/channel/ChannelPage.tsx` | Queue/Analytics/Growth/Popular/Settings, OAuth/수동인증, 계정관리, 자동화, 파라미터, Guide/Keywords, 인기글 CRUD | 연결·탭·인기글·저장 제어를 Button/Stack/Section/Card로 교체 | 0 |
| 보호영역 | Studio `PlatformPreview` 호출 2곳, 발행 이력 패널 | 시작 commit과 추출 diff 0 | 0 |

기능누락: 0. 근거는 handler/API 인자 보존 diff와 아래 통합테스트다. 실제 브라우저 전수 클릭은 미검증이다.

## 3. 빌드·테스트 로그

| 증거 | 결과 |
|---|---|
| 공통부품 단위 + 핵심화면 통합 | 5 files, 23 passed |
| 전체 Vitest | 127 files passed, 1045 passed, 10 skipped |
| TypeScript | `npx tsc --noEmit` exit 0 |
| Production build | `npm run build -- --webpack`; compile 23.3s, TS 26.0s, static pages 166/166, route manifest 출력 |
| 브라우저 dev 기동 | 실패: `listen EPERM: operation not permitted 127.0.0.1:3456` (제품 코드 실행 전) |

빌드 로그: `/tmp/osmu-design-system-build.log`

전체 테스트 로그: `/tmp/osmu-design-system-all-tests.log`

브라우저 기동 로그: `/tmp/osmu-design-system-dev.log`

## 4. 스크린샷 실제 픽셀 폭

브라우저가 기동되지 않아 아래 파일은 만들지 않았다. 파일명만 390/1024/1440으로 꾸민 증거는 제출하지 않는다.

| 화면 | 목표 폭 | 파일 | 실제 픽셀 폭 |
|---|---:|---|---|
| Home | 1440 | `osmu-home-1440-v1-gpt-codex.png` | 미생성·미검증 |
| Home | 1024 | `osmu-home-1024-v1-gpt-codex.png` | 미생성·미검증 |
| Home | 390 | `osmu-home-390-v1-gpt-codex.png` | 미생성·미검증 |
| Studio | 1440 | `osmu-studio-1440-v1-gpt-codex.png` | 미생성·미검증 |
| Studio | 1024 | `osmu-studio-1024-v1-gpt-codex.png` | 미생성·미검증 |
| Studio | 390 | `osmu-studio-390-v1-gpt-codex.png` | 미생성·미검증 |
| Channel | 1440 | `osmu-channel-1440-v1-gpt-codex.png` | 미생성·미검증 |
| Channel | 1024 | `osmu-channel-1024-v1-gpt-codex.png` | 미생성·미검증 |
| Channel | 390 | `osmu-channel-390-v1-gpt-codex.png` | 미생성·미검증 |

## 5. 측정치 전후

측정 기준은 작업 시작 commit `066cb3d5` 대비 지정 3화면의 실제 px 값이다.

| 지표 | 전 | 후 | 판정 |
|---|---:|---:|---|
| 간격 값 종류 | 12종(2·4·6·8·10·12·16·20·24·28·32·48) | 7종(허용 4·8·12·16·24·32 + 알약 2px 예외) | 정합 |
| 통제 영역 글자 크기 종류 | 10종(9·10·11·12·14·16·18·20·24·30) | v23 7종(12·13·15·17·20·24·30) | 정합 |
| dashboard raw 12px 미만 클래스 | 451 | 4 | 4곳은 명시적 no-touch 영역 |
| 실제 CSS상 12px 미만 | 451 | 0 | 4곳도 global 안전망이 caption 12/18로 override; 브라우저 computed-style 관찰은 미검증 |

## 6. Git diff 요약

- 제품 코드·테스트: 67 files. 구현현황·exit report까지 포함하면 총 69 files, 1,274 insertions, 688 deletions(작업 시작 commit 대비).
- 중간 커밋: `a40f1185` 공통부품, `5d36654f` 12px 하한, `1adbc114` 3화면 마이그레이션.
- 시크릿·API·DB·route·배포 변경: 0.

## 7. 미통과 gate와 다음 QA 명령

- 미통과: 브라우저 시각 QA(1440·1024·390 잘린 라벨 0, 겹침 0, PNG 실제 폭).
- 미통과: pipeline QA/ship, stage/prod 배포.
- 다음 QA 명령: `cd /Users/sj/sj_code_master/openclaw-auto/dashboard && npm run dev -- --hostname 127.0.0.1 --port 3456` 후 Home·Studio·`/channels/threads` 3폭 캡처와 PNG 헤더 폭 검사. 이 샌드박스 밖의 포트 허용 환경에서 실행해야 한다.

## 레드팀·셀프심문

- 레드팀: “테스트가 통과했어도 공통 Button이 이벤트를 끊거나 라벨을 자를 수 있다.” → Home/Studio/Channel의 클릭→상태/API 호출 통합테스트와 `min-w-max`, non-shrink 계약을 추가했다.
- 셀프심문: “이 결론이 틀렸다면 가장 그럴듯한 이유는?” → 실제 CSS cascade·responsive layout은 브라우저에서만 확정된다. dev 서버가 EPERM으로 막힌 이상 잘림·겹침 0을 주장하지 않고 QA gate를 열어뒀다.

## 벤치마크 적용

- W3C WCAG 2.5.5의 44×44 CSS px 강화 기준을 Button 터치 하한으로 적용했다.
- Tailwind v4 공식 theme-variable 방식을 v23 고정값의 utility 노출에만 사용했다. 외부 spacing/type 값은 차용하지 않았다.

---

🏷 STAMP | line: osmu | 생성: 2026-08-10 18:10 KST | model: gpt-5.6-codex | agent: code-builder
skills: SKILLS_SKIPPED(매칭되는 설치 스킬 없음) | 근거: DESIGN.md v23 · pipeline-state.osmu.md override · W3C · Tailwind CSS
고민: 보호영역 보존과 전역 12px 하한의 충돌을 source 무변경 + CSS 안전망 + 계약테스트로 해소했다.

SKILLS_USED: 없음

SKILLS_SKIPPED: 매칭되는 설치 스킬 없음

SOURCES: `DESIGN.md` §v23 · `pipeline-state.osmu.md` · dashboard 실제 코드/테스트 · https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced · https://tailwindcss.com/docs/padding

MODEL: gpt-5.6-codex / code-builder
