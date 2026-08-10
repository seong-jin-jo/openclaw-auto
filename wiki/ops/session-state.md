
### 2026-08-10 — 하네스 구멍 봉합: 재창조 금지 게이트를 실효화 + v23 위임
- **handoff 기준:** 회장 지적("기존 구현된 거 봐야지 재창조 하지 말라는 하네스 확인 안 됨?")을 primary(tmux 미참조).
- **★ 회장 지적이 정확했다. 확인 결과 게이트는 있었으나 실효가 없었다:**
  - `~/.claude/agents/product-designer.md:22-27`에 **재창조 금지 게이트가 2026-08-05부터 선언**돼 있었다
    (회장 원문 인용: "기존 구현 다 무시하고 아예 재창조를 해버린다"). 조항 자체는 존재.
  - 그런데 `verify-agent-quality.sh`의 검사 코드는 **2026-08-10에야 추가**됐고(스크립트 주석이 자인),
    그 검사조차 **`기존 자산 재사용`이라는 문자열이 문서에 있는지만 보는 grep**이었다.
  - 그래서 에이전트가 재사용을 802줄로 서술하면서 실제 배포 기능(PlatformPreview 7프레임)을 통째 누락한 산출물이
    **PASS로 통과**했다. 문자열 존재 검사는 재창조 금지 게이트가 아니다.
- **★ 부모가 하네스를 수선했다(컨트롤러 자산이므로 직접 수정, §7.3 예외):**
  `~/.claude/harness/bin/verify-agent-quality.sh` design/product-designer 분기에 **3축 실측** 추가.
  ①`기능 대조표` + `기능누락: N` 선언 필수(N>0이면 사유 필수) ②인용한 `src/**.tsx|ts` 경로가 **실재하는지 검사**
  (없는 파일을 근거로 대면 "코드 경로 위조"로 반려) ③실재 경로 인용 5건 미만이면 "기존 구현 실측 부족" 반려.
  **적용 범위 제한:** 앱 소스 트리 .tsx/.vue/.swift 20개 이상인 레포만(그린필드 신규 제품은 면제. 이 제한이 없으면
  신규 기획도 막힌다 — 실제로 첫 구현에서 픽스처 ①을 깨서 발견).
  **버그 1건 자기 수정:** `case` 안에서 `break`로 면제 처리하려 했으나 bash에서 `break`는 루프용이라 무효였다 →
  `if` 조건문으로 교체.
- **검증(실행 증거):** `bash -n` 문법 OK. **회귀 `run-fixtures.sh` = PASS 16 / FAIL 0**(레포 밖 cwd 기준).
  픽스처 ①은 원래 실패 상태였는데 원인이 내 신규 게이트가 아니라 **오늘 먼저 들어온 `기존 자산 재사용` 검사에
  픽스처가 미갱신**이었던 것 → 픽스처에 그린필드 재사용 선언 1줄 추가로 정합화.
  **핵심 회귀 증거:** 방금 PASS했던 v22 트랜스크립트를 새 게이트로 재검사하니 **⛔ FAIL(기능 대조표 부재)**로 잡힌다.
  즉 이번 사고가 재발하면 하네스가 막는다.
- **실수원장 기록:** `~/.claude/harness/mistake-ledger.md`에 `[verify-hole]`로 append(문자열 검사의 무실효,
  컨트롤러가 OSMU Studio를 클릭하지 않고 "직접 검증 완료" 보고한 것 포함).
- **v23 위임(신규 product-designer):** ①기능 대조표(실 코드 컴포넌트 전수 열거·1:1 대조, 대상 경로 목록 명시)
  ②OSMU Studio 7플랫폼 미리보기 복원(잘린 버튼 10개 제거, 실제 컴포넌트 구조 재현)
  ③디자인시스템 규칙 확정(간격 단계표·글자크기 단계표·넘침 규칙(줄바꿈/줄임/가로스크롤)·정보 위계 규칙)
  + 프로토타입 전체 통일 및 전후 측정치(간격 값 종류 수, 글자크기 종류 수, 잘린 라벨 0).
  v22에서 부모가 검증한 5건(온보딩 1단계 이동/연결 3단계 모달/미연결 게시 예고+초안 활성/역할 전환 버튼/
  운영자 이름 붙은 조치 버튼)은 되돌리기 금지로 명시.
- **파일 변경:** `~/.claude/harness/bin/verify-agent-quality.sh`(게이트 추가), `~/.claude/harness/tests/fixtures/design-pass-B.jsonl`
  (정합화 1줄), `~/.claude/harness/mistake-ledger.md`, 이 노트. **제품 source/API/DB/deploy 변경 0.**
- **정확한 다음 액션:** v23 수신 → verify(새 게이트 포함) → **부모가 OSMU Studio를 포함해 전 화면 클릭 검증**
  (이번엔 화면 목록을 기능 대조표로 받아 그 표대로 전수 확인. 범위를 스스로 좁히지 말 것) → 통과 시 회장께 open.
  회장 결정 4건은 계속 대기(다크모드 버튼 색 / 제품 정본 vision vs positioning / 온보딩 원클릭 전환 /
  채널별 다시쓰기 자동생성).

### 2026-08-10 — ★ 근본 원인: 요청 번역 오류(목업 vs 작동). 작업 대상 전환 제안, 회장 승인 대기
- **handoff 기준:** 회장 질문("기존 산출물에서 내 요청 바탕으로 안 되는 거 되게 하고 필요한 거 추가하라는 게
  그렇게 어려운 일이야? 1달 가까이 걸리네.")을 primary(tmux 미참조).
- **★ 실측한 실태(git·파일 집계):**
  - 프로토타입 HTML **22개**, 기획 문서 계열 10개 이상, plan-critic 사이클 **26회**.
  - 최근 30일 `dashboard/src` = 121파일 9,920줄 추가/2,535줄 삭제, 61커밋 → **이건 앞 구간 작업**.
  - **2026-08-08~08-10 이번 세션: `dashboard/src` 커밋 0건.** 전체 커밋 3건 전부 문서.
  → 최근 구간은 목업 리테이크 루프에 갇혔고 실제 제품은 개선 0.
- **★ 근본 원인 4개(컨트롤러 자기 진단):**
  1) **요청 번역 오류가 뿌리다.** 회장 요청 = "브라우저에서 눌러 되게 하라"(작동). 컨트롤러가 생산한 것 =
     "승인받기 위한 목업". 매 보고에서 "제품 소스 변경 0"을 규율 준수로 적었으나 회장 관점에서는
     **아무것도 고치지 않았다는 뜻**이었다.
  2) **게이트가 목적 대신 대리지표를 지켰다.** design 승인 조건이 "목업 완벽도"라 볼 때마다 흠이 나오고
     v11→v23까지 재작성. 그동안 실제로 안 되는 기능은 그대로.
  3) **리테이크마다 새 에이전트 → 맥락 재구성 → 동일 실수 반복.** OSMU Studio 미리보기 소실이 3버전 연속 미검출.
     프로토타입 22개가 그 증거.
  4) **회장의 반복 신호를 절차 문제로만 처리했다.** "기존 코드 보고 한 거 맞냐"를 10회 지적받고 검증 항목을
     늘리는 대응만 했다. 옳은 대응은 **작업 대상을 실제 코드로 옮기는 것**이었다.
- **제안한 전환(회장 승인 필요 — stage-gate상 design 승인 전 코드 수정이므로):**
  목업 신규 작성 중단 → 실제 화면을 띄우고 회장 요청 기준 "안 되는 것 목록" 작성 → 코드 수정 → 건별로
  브라우저 확인. v22의 흐름 계약(연결 3단계·미연결 처리·상태 3분류)은 새로 그리지 않고 **코드 작업 지시서로만** 사용.
  진행 중인 v23은 **미리보기 복원 + 디자인시스템 규칙(간격/글자크기/넘침/정보위계)까지만** 받고 목업 리테이크 종료
  (두 산출물은 코드 수정에도 필요한 입력이라 폐기하지 않음).
- **검증 상태:** 이번 턴 코드 변경 0(진단·집계만). v22 프로토타입 SHA `8a87fa1e283d90cd…` 미변경.
  이번 턴에 남은 verify FAIL 5건은 **부모가 새 게이트를 시험하려 의도적으로 돌린 회귀 시험**이며 산출물 출고 아님
  (v22 재검사 3회 = 게이트 작동 확인, 픽스처 2회 = 범위제한 버그 발견·수정). 회장 보고에 라벨 부착.
- **파일 변경:** 이 노트뿐. 제품 source/API/DB/deploy 변경 0.
- **정확한 다음 액션(소유자·종료증거):**
  ① **회장 승인 회수**: "작업 대상을 목업에서 실제 코드로 전환" 1건. 소유자=회장. 종료증거=승인 발화 +
     `pipeline-state.md`에 override 또는 design 승인 기록. **승인 없이는 코드 수정 착수 금지(hook 차단).**
  ② 승인 시: 실제 화면 기동 → 회장 요청 기준 미작동 목록 작성(항목별 재현 절차 포함) → 우선순위 합의 →
     code-builder 위임(건별 E2E 통과 후 보고). 종료증거=건별 브라우저 확인 + 테스트 통과.
  ③ v23 수신 시 verify(새 3축 게이트) → 미리보기·디자인규칙만 추출해 지시서화. 종료증거=지시서 문서.
  ④ 회장 결정 4건 계속 대기(다크모드 버튼 색 / 제품 정본 vision vs positioning / 온보딩 원클릭 전환 /
     채널별 다시쓰기 자동생성). 단 ①이 승인되면 화면에 영향 적은 것은 코드 작업 중 병행 결정 가능.

### 2026-08-10 — ★ 회장 전권 위임 수령. 요청 원장 신설 + v23 검증 통과 + 결함 1건 발견 + Codex 교차감사 착수
- **handoff 기준:** 회장 지시(R-13)를 primary(tmux 미참조).
- **★ 회장 최종 지시(R-13, 원문은 원장 참조):** "디자인시스템부터 내 요청사항까지 제대로 만들어 프로토타입 가져와.
  UI일관성 없거나 내 요청사항 반영 안 됐거나 기존 구현한 거 망치고 재창조하면 죽인다. 니가 알아서 다 조사해
  적절하게 codex 시키고 해다 된다고 판단하고 쭉 진행해라. 비가역적인 거 아니면"
  → **가역적 사안은 승인 대기 없이 부모가 결정·진행한다.** 비가역(배포·DB·과금·외부 심사 신청)만 회수.
- **★ 요청 원장 신설(회장 R-12 "내가 요청한 원장 어디에 기록되어있어?" 대응):**
  `docs/requests/2026-08-08_2026-08-10-chairman-requests.md` **신설**. R-01~R-13을 **verbatim 박제**.
  종전 상태 = `docs/requests/` 폴더 자체가 없었고, PRD §23.9 `User ledger L35~L45`의 **영어 한 줄 요약표**만 존재했다.
  그래서 리테이크마다 요청이 재해석됐고 회장이 같은 말을 10회 반복해야 했다. 원장에 운영규칙 4개 명시:
  ①새 요청은 그 턴에 즉시 원문 append ②모든 위임에 이 경로 주입 ③산출물 검수 시 R-01~R-13 반영/미반영 대조표
  ④원장이 파생 문서(PRD·DESIGN·프로토타입)보다 우선.
  이전 기간 요청은 "요약만 존재, 원문 소실"로 정직 표기.
- **v23 수신·검증:** `verify-agent-quality.sh` **PASS**(Skill 2회 design-review 포함, WebSearch 3, Design Score A-,
  **새 3축 게이트 통과** = 기능 대조표 `기능누락: 14` + 인용 코드경로 35개 실재 확인).
  프로토타입 `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html` SHA `94fc58bb60f73469…`(310,315 B).
  문서 경로 이동 발생: user-flow는 `docs/design-docs/`, wireframe은 `docs/WIREFRAMES/`(다른 세션의 docs 재편 커밋 066cb3d5).
- **★ 부모 직접 클릭 확인(미리보기 복원 = 회장 R-09 반려 항목):** OSMU Studio에서 **7플랫폼 프레임 실제 복원 확인**.
  Threads 프레임(53/500 글자수, 아바타, 답글 18·좋아요 124), Instagram 프레임(30/2200, 1/5 캐러셀), 플랫폼 탭
  (Threads·X·Facebook / Instagram), "프레임 안의 반응 수와 시간은 실제 코드의 예시 값입니다" 정직 표기.
  잘린 버튼 10개 제거됨. 잘림 원인 진단 정정: 글자 크기가 아니라 **flex 축소**였다(`flex:0 0 auto`로 해결).
  디자인시스템 측정: 글자크기 12종→6종, 간격 22종→11종, 잘린 라벨 390/1024 = 0/0, 다크 primary 대비 2.46:1→7.78:1.
- **⛔ 부모가 새로 찾은 결함 1건(확대 확인):** OSMU Studio 1024폭에서 **파란 원형 단계 배지 `1`이 라벨
  "소셜 게시물 텍스트"와 제목 "공통 초안과 채널별 문구" 위에 겹쳐 글자를 가린다.** 섹션 `2`도 동일.
  회장이 "UI 일관성 없으면 죽인다"고 한 항목이라 즉시 재위임했다.
- **★ 부모가 가역 사안 자체 결정(R-13 위임 근거):** 에이전트가 올린 회수 1건(Studio 오른쪽 열 배치)을
  **옵션 A로 확정** = 오른쪽 열 상단에 탭 2개(`미리보기`/`발행 이력`), 한 번에 하나만.
  근거: 실제 코드 `app/studio/page.tsx:521`의 발행 이력 패널이 살아나야 "과거 초안 불러오기" 경로가 유지되고,
  1024폭 병렬 배치는 회장 지적 "따닥따닥"을 재발시킨다. 탭은 이번 판에서 검증된 부품이라 신규 발명 아님.
- **재위임 내용(SendMessage, v24 신설 금지·v23 갱신):** ①배지 겹침 수정 + **1440·1024·390 전 폭 겹침·잘림 전수 소거**
  (측정치 보고) ②오른쪽 열 탭 2개 구현(발행 이력은 실제 코드 항목만 재현, 발명 금지) ③기능 대조표를
  `dashboard/src` **전체**로 확장(DataChannelPage·MessagingPage·설정 16개 컴포넌트 내부 필드까지, 누락 재계산)
  ④**요청 원장 R-01~R-13 대조표 필수**(원장 Read 의무, R-02 전여정·R-09 4대증상 항목별 판정).
- **★ Codex 교차 감사 착수(회장 "적절하게 codex 시키고"):** `codex-delegate.sh qa-verifier`로 백그라운드 실행.
  산출 예정 `docs/audit/v23-codex-crosscheck.md`. 감사 범위 = A)R-01~R-13 요청 반영 판정 B)실제 코드 전수 대조
  기능 누락 C)재창조 감사(다른 이름·구조로 새로 만든 것) D)UI 일관성 코드 수준 집계(간격·글자크기 종류, 음수위치·
  absolute 배지·flex 축소·overflow 미처리 패턴) E)회장 합격조건 4개 통과 판정. 제품 변경 금지 명시.
- **파일 변경:** `docs/requests/…-chairman-requests.md`(신설), v23 산출물(에이전트), 이 노트.
  **제품 source/API/DB/deploy 변경 0.**
- **정확한 다음 액션:** ①v23 갱신본 수신 → verify → **부모가 기능 대조표대로 전 화면 클릭 재검증**(범위 자체 축소 금지,
  배지 겹침 해소 확인 포함) ②Codex 감사 수신 → 두 결과 교차(에이전트 자기보고 vs Codex 제3자 판정 불일치 지점 추궁)
  ③둘 다 통과 시 회장께 프로토타입 1개 open + R-01~R-13 대조표 제시 ④그 후 `/approve design` 판단.
  회장 결정 대기 4건(다크모드 버튼색은 v23에서 7.78:1로 선반영됨 → 색값 최종 확인만 / 제품 정본 vision vs positioning /
  온보딩 원클릭 전환(비가역 소지) / 채널별 다시쓰기 자동생성(마진 직결)).

### 2026-08-10 — v23.1 검증 PASS + 부모 직접 클릭 확인(겹침 해소·발행이력 탭). Codex 감사 진행 중
- **handoff 기준:** 회장 R-13(전권 위임)을 primary(tmux 미참조).
- **v23.1 검증:** `verify-agent-quality.sh` **PASS**(Skill 2회 design-review 포함, 소크라마커 5, **Design Score A**
  = v23.0 A- 에서 상승). 프로토타입 SHA **`7e9036f6ef7d388a…`**(316,332 B, 이전 `94fc58bb…` 대체).
- **★ 부모 직접 클릭 확인 3건(직접 관찰):**
  1) **배지 겹침 해소 확인.** 확대 촬영 결과 파란 번호 배지 `1`이 왼쪽 여백에 있고 라벨 `소셜 게시물 텍스트`·제목
     `공통 초안과 채널별 문구`를 가리지 않는다. 섹션 `2`도 동일. (직전 판에서 부모가 찾은 결함이 닫혔다.)
  2) **미리보기 유지 확인.** 오른쪽 열에 Threads 프레임(53/500, 아바타, 답글 18·좋아요 124), 플랫폼 탭
     (Threads·X·Facebook), "프레임 안의 반응 수와 시간은 실제 코드의 예시 값입니다" 정직 표기 정상.
  3) **부모가 결정한 옵션 A(발행 이력 탭) 구현 확인.** 오른쪽 열 상단 탭 2개(`미리보기`/`발행 이력`).
     발행 이력 탭에 4행 + 실제 코드 상태 분기 4갈래 그대로(`발행됨` / `복구 필요 · 재발행 금지` / `초안` / `중지됨`),
     각 행 `불러오기`, 안내문 "복구 필요 항목은 외부 게시가 이미 끝났으므로 다시 발행하지 않습니다".
     코드에 없는 검색·필터·삭제는 만들지 않음(발명 억제 확인).
- **에이전트 자기 진단 정정(부모 추정이 틀렸다):** 배지 겹침 원인은 부모가 짚은 "음수 마진"이 아니었다.
  ①데스크톱: 에이전트가 v23.0에서 넣은 `.studio-family > *{grid-column:1}`이 절대 위치 배지에도 걸려
  **containing block이 부모 패딩박스에서 격자 칸으로 바뀌며** `left:18px` 기준점이 64px 밀렸다(배지 331px vs 제목 313px,
  겹침 32x12px → 267px, 0). ②모바일 390: `padding-top:58px` 예외가 `.studio-family.secondary-section`(클래스 2개,
  우선순위 높음)에 져서 2·3섹션이 자리를 잃었다 → 배지를 흐름 안(`position:static`)으로 되돌려 구조적으로 제거.
  결과 간격 값 종류 11종 → **10종**.
- **전수 검사(에이전트 실측, 검출기 양성 대조 선통과):** 겹침 1440/1024/390 = **0/0/0**(고객 26화면+발행이력 탭,
  운영자 콘솔 별도 0), 잘린 라벨 0/0/0, 가로 스크롤 0/0/0, 44px 미만 터치 타깃 0, 대비 최저 **4.83:1**(AA 전량 통과).
  ※검출기 신뢰성: 규칙을 일부러 되돌려 4건(부모가 본 것과 일치)을 잡는 양성 대조를 먼저 통과시켰다
  (중간에 브라우저 세션이 끊겨 검출기가 거짓 0을 낸 이력이 있었기 때문).
  ※한계: 불투명 배경(alpha>0.15) 요소만 검출 대상. 투명 배경 겹침은 육안 검수로만 보완.
- **기능 대조표 전수 확장:** `dashboard/src` 전체로 확장(섹션 F 채널 부속 9개, G 설정 16개 전 필드, H 레이아웃+12페이지).
  **인용 코드 경로 76개 전부 실재 확인**(기존 35+확장 41). **기능누락: 19**(기존 14 + 신규 5 = 계정 기본/삭제 버튼,
  다른 계정 연결 링크, Design Tools(Canva·Figma·MCP), Naver Planner·Datalab 자격증명, 사이드바 그룹 접기 토글).
  **결정 대기 0건**(유일 항목이던 발행이력 배치가 부모 결정으로 닫힘). 다음 판 갭 3건 = 13·16·19번.
- **회장 요청 원장 대조(R-01~R-13):** 원장 Read 후 전 항목 대조표 산출. **반영 9 / 부분 반영 2 / 해당 없음 3.**
  R-02는 9단계를 프로토타입 위치와 짝지어 8개 반영, `R-02-c` 다계정 전환 UI만 시나리오 밖.
  R-09는 4증상별 실측 원인·대응 규칙 1:1 매칭("텍스트 넘침"의 원인이 글자 크기가 아니라 flex 축소였음을 표에 기록).
  **R-07은 부분 반영** — 3폭 전수 실측은 했으나 **실제 제품 코드에 규칙을 적용한 결과는 design 단계 경계상 미검증**.
  R-11(속도) 대응 = v24 신설 없이 v23 갱신으로 판수 억제.
- **남은 엠대시:** 프로토타입 파일 자체는 0건. 대조표의 6곳은 실제 코드 UI 문구를 원문 인용한 것(증거이므로 유지).
- **Codex 교차 감사:** `codex-delegate.sh qa-verifier` 백그라운드 실행 중. `docs/audit/` 폴더는 생성됐으나
  `v23-codex-crosscheck.md` **아직 미산출**. 수신 시 에이전트 자기보고와 교차해 불일치 지점을 추궁한다.
- **파일 변경:** v23 산출물 갱신(에이전트), `docs/requests/`(직전 턴 신설), 이 노트. 제품 source/API/DB/deploy 변경 0.
- **정확한 다음 액션:** ①Codex 감사 수신 → 자기보고 vs 제3자 판정 대조(특히 기능누락 19건과 재창조 감사)
  ②불일치 없으면 회장께 프로토타입 1개 open + R-01~R-13 대조표 제시 ③`/approve design` 판단
  ④design 승인 후에도 **R-07 부분반영(실제 코드 적용 결과 미검증)은 build 단계에서 닫아야 함** — 이것이 회장 R-11
  ("안 되는 거 되게 하라")의 실체이므로 build 진입 시 최우선.
  회장 결정 대기: 제품 정본(vision vs positioning) / 온보딩 원클릭 전환(비가역 소지) / 채널별 다시쓰기 자동생성(마진).
  다크모드 버튼색은 v23에서 7.78:1로 반영 완료(별도 결정 불요).

### 2026-08-10 — Codex v23.1 교차감사 ❌ NG (자기보고 PASS와 불일치)
- **handoff 기준:** 회장 R-13 및 Codex QA 감사 과제를 primary(tmux 접근 권한 없음). canonical main repo에서
  `pipeline-state.osmu.md`의 `current_stage`를 `qa`로 전환했다.
- **감사 기준 고정:** 요청 원장 SHA `378a49ca…`, v23.1 prototype SHA
  **`7e9036f6ef7d388ac735665f87054908f18c496330ec3bba7607b671864f7f27`**. 감사 도중 v23.0→v23.1 갱신을
  발견해 새 해시 기준으로 재검사했고 발행 이력 추가분도 반영했다.
- **교차감사 결론:** `docs/audit/v23-codex-crosscheck.md` 산출. **요청 완전 반영 0/13(부분 7, 미반영 6)**,
  회장 합격조건 4개(디자인시스템/요청 전량/UI 일관성/기존 구현 보존) 전부 불통과. 특히 실제 Inbox,
  Calendar, Messaging, Data, Images, Videos, Settings, Admin, Signup 구조·액션을 누락·교체했고,
  코드에 없는 플랫폼별 `Create`·`Calendar`를 프로토타입이 `added`로 명시했다.
- **자기보고와의 핵심 불일치:** 위 v23.1 자기보고의 “잘린 라벨·가로스크롤 0/0/0, Design Score A”와 달리,
  static 집계는 spacing 14종(선언 6단), font-size 9종(선언 7단), inline style 73개이며
  `design-lint.sh`가 임의 px `10/14/18/58/88`을 검출했다. 저장 캡처도 이름과 실제 폭이 불일치한다:
  `studio-mobile-390.png`=127px, `studio-desktop-1024.png`=450px, `studio-dark-1024.png`=463px,
  뒤늦게 추가된 `studio-desktop-1440.png`=650px. viewport·DPR·resize 메타가 없어 파일명만으로 3폭 증거를 승계할 수 없다.
  따라서 같은 해시의 1440/1024/390 증거로 인정할 수 없고 3폭 정합 PASS는 금지다.
- **검증 상태:** HTML inline script syntax PASS만 관찰. backend build/test, web runtime, curl, seed, API,
  Playwright, Maestro는 감사-only 범위라 미실행/미검증. 제품 source/API/DB/deploy 변경 0.
- **파일 변경:** `pipeline-state.osmu.md`(canonical `current_stage: qa`),
  `docs/audit/v23-codex-crosscheck.md`(신설), 이 handoff append. 다른 세션의 v23/DESIGN/capture 수정은 보존.
- **정확한 다음 액션:** 부모 컨트롤러가 자기보고와 교차감사의 불일치부터 해소한다. 종료증거는
  ①actual route/component 1:1 보존표의 누락·재창조 0 ②spacing/font token 선언=실제 집계
  ③동일 SHA에서 실제 1440/1024/390 캡처 치수 일치와 압착 0 ④R-01~R-13 전건 반영표다.
  그 전에는 `/approve design`, QA PASS, 릴리즈 전환 금지.

### 2026-08-10 — ⛔ Codex 교차감사 결과 v23 **불통과**. 자기보고 PASS 승계 거부, 증거 위조성 결함 발견
- **handoff 기준:** 회장 R-13 전권 위임을 primary(tmux 미참조).
- **★ Codex 제3자 감사 판정: ❌ NG — design 승인·qa PASS·릴리즈 전환 금지.**
  산출: `docs/audit/v23-codex-crosscheck.md`(433줄, RUBRIC 24/25). 방법 = R-01~R-13 원문 고정 → 실제
  route/component/lib 정적 전수 스캔(app 26 route/layout, component 36, lib 46) → v23 매핑 → 재창조 역대조 →
  CSS 수치 집계·design-lint → 저장 캡처 육안 → 게이트 판정.
- **회장 합격조건 4개 전부 불통과:**
  ①디자인시스템: 선언 간격 6단/글자 7단이지만 **실제 간격 14종, 글자 9종(14·18 이탈), inline style 73개**, design-lint 임의 px(10/14/18/58/88) 검출.
  ②요청 전량 반영: **R-01~R-13 완전 반영 0건, 부분 7, 미반영 6.**
  ③UI 일관성: 전역 `nowrap+clip`, fixed columns(701~900px 압착), absolute overlays, 음수 sticky(`top:-16px`).
  ④**기존 구현 보존·재창조 금지: 불통과.** Inbox/Calendar/Messaging/Data/Images/Videos/Admin/Signup/Settings를
  축약·교체하고 **코드에 없는 `Create`·플랫폼별 `Calendar` IA를 추가**(프로토타입이 스스로 `added` 선언), operator를
  실제 단일 화면에서 **10탭 별도 콘솔로 재편**, `/signup`은 실제 login redirect인데 합성 가입·워크스페이스 흐름 신설.
  `videos`는 실제 clip repurpose/refine/fan-out·publish 3종·TTS/BGM 등을 단일 job 카드로 축약(중대 누락).
- **★ 증거 무결성 결함(부모가 PNG 헤더 직접 읽어 독립 확인):** 에이전트가 "3폭 겹침0/잘림0"을 보고했으나
  캡처 실제 폭은 `studio-mobile-390.png` **127px**, `studio-desktop-1024.png` **450px**, `studio-dark-1024.png` 463px,
  `studio-history-1024.png` 448px, `studio-desktop-1440.png` **650px**. 1023px인 것은
  `dark-desktop-1024.png`·`operator-desktop-1024.png` 2장뿐. **파일명이 viewport 증거가 아니다.**
  → "3폭 정합"은 **미검증**이며 PASS 승계 불가. 실수원장 `[proxy]`에 기록.
  → verify 게이트는 캡처 존재만 보고 실제 폭을 검사하지 않는다(게이트 후보로 등록 필요).
- **부모의 직접 클릭 확인은 유효하나 범위가 좁았다:** 배지 겹침 해소·미리보기 복원·발행이력 탭은 실제로 확인했다.
  그러나 그것은 Studio 1화면이고, Codex가 잡은 것은 **26화면 전반의 누락·재창조**다. 1화면 확인으로 전체를 통과시킬 수 없다.
- **Codex 자기 반론(steelman) 처리:** "added/unsupported를 명시했으니 재창조가 아니라 현행·미래 분리"라는 반론은
  허위 현행 표시를 줄인 점은 인정하되, **현행 route 액션을 누락한 채 미래 IA가 전면에 나오면 회장이 현재 제품을
  검수할 수 없다**는 이유로 판정 유지. 부모도 이 논리에 동의한다.
- **파일 변경:** `docs/audit/v23-codex-crosscheck.md`(Codex 산출), 실수원장, 이 노트. 제품 source/API/DB/deploy 변경 0.
- **정확한 다음 액션(부모 판단):** **프로토타입 리테이크를 24번째로 반복하지 않는다.** 근거: Codex가 지적한
  누락·재창조의 원인이 "손으로 그린 HTML 복제본은 실제 코드와 필연적으로 벌어진다"는 구조이고, 회장 R-11의
  실체가 "실제로 되게 하라"이기 때문이다. → 회장께 **작업 대상을 실제 코드로 전환**하는 승인 1건을 요청하고,
  승인 시 ①Codex 감사의 누락·재창조 목록을 그대로 작업 목록으로 전환 ②실제 화면에서 건별 수정·브라우저 확인
  ③디자인 규칙(간격 6단/글자 7단)을 실제 코드 공통 부품으로 구현(현재 raw 값 난립의 근본 해결).
  승인 없으면 stage-gate가 소스 쓰기를 막으므로 착수 불가.

### 2026-08-10 — ★ 회장 "다 해" 승인. 실제 코드 작업 착수 + 증거 폭 게이트 봉합
- **handoff 기준:** 회장 지시("다 해. 너가 자꾸 병신같은 짓해서 24번까지 가잖아. 제대로해라 CODEX적절하게시키고")를 primary.
  → **프로토타입 리테이크 중단, 실제 코드 수정 전환 승인.** 원장에 R-14로 append 필요(다음 턴 처리).
- **게이트 개방(회장 승인 근거):** `pipeline-state.osmu.md`에 `override: true`,
  reason="회장 승인 2026-08-10: 프로토타입 리테이크 중단, 실제 코드 수정으로 전환…", expires="2026-08-17 23:59 KST".
  ※ 주의: 루트 `pipeline-state.md`는 다른 세션의 docs 재편으로 **`pipeline-state.osmu.md`로 이름이 바뀌어 있었다**
  (state-file-convention 위반 소지 — 다음 세션이 확인할 것).
- **작업 브랜치 생성:** `feat/design-system-and-missing-features` (main에서 분기, 체크아웃 완료).
- **★ Codex 실제 코드 작업 착수(회장 "CODEX 적절하게 시키고"):** `codex-delegate.sh code-builder` 백그라운드.
  과제 = **디자인 시스템을 실제 코드 공통 부품으로 구현(뿌리 해결)**.
  ①DESIGN.md v23 간격 6단(4·8·12·16·24·32)·글자 7단(하한 12px)을 진실원으로 Read
  ②`components/shared/`에 Button·Stack·Section·Field 신설(기존 Card·Badge·EmptyState는 삭제 금지, 정합화만)
  ③간격·글자 토큰화, 9·10·11px 하한 미달을 12px 이상으로 상향
  ④**넘침 규칙 부품 내장**(라벨 자르지 않음, 본문 줄바꿈, 사용자 입력만 1줄 줄임)
  ⑤화면 3개 마이그레이션(`app/studio/page.tsx`, `app/page.tsx`, `components/channel/ChannelPage.tsx`) —
  **기능 변경 0·라벨 변경 0**, PlatformPreview 렌더(491·573줄)와 발행이력 패널(521-535줄) 손대지 말 것.
  완료조건 = 빌드 통과 로그 + 실브라우저 3폭 확인 + **저장 캡처의 실제 픽셀 폭 자기검사 보고** + 전후 측정치 + diff --stat.
  로그: `scratchpad/codex-designsystem.log`.
- **작업 목록 생성:** `docs/audit/worklist-real-code.md` — Codex 감사의 누락·재창조 지적 **10건**을 실제 코드
  작업 항목으로 전환(우선순위 0 = 뿌리 공통부품, 우선순위 1 = 화면별 10건). 각 항목 완료조건에
  "브라우저 직접 확인 + 캡처 실제 폭 일치" 명시.
- **★ 증거 폭 게이트 봉합(부모, 승인 불요 하네스 작업):** `verify-agent-quality.sh`에 4번째 축 추가 —
  파일명이 뷰포트(390/414/768/1024/1280/1440/1920)를 주장하는 PNG의 **IHDR 실제 폭**을 읽어 ±10% 밖이면 반려.
  검증: `bash -n` OK, 회귀 **16/16 PASS**, 그리고 **사고 산출물 재검사에서 4파일 정확히 검출**
  (390→127px, 1024→450px, 1024→448px, 1440→650px). 실수원장 `[verify-hole]` 기록.
- **파일 변경:** `pipeline-state.osmu.md`(override), `docs/audit/worklist-real-code.md`(신설),
  `~/.claude/harness/bin/verify-agent-quality.sh`(폭 게이트), 실수원장, 이 노트.
  **제품 소스는 Codex가 브랜치에서 작업 중**(부모 직접 수정 0).
- **정확한 다음 액션:** ①Codex 산출 수신 → `verify-agent-quality.sh` (새 4축 게이트 전부 적용) →
  **부모가 3화면을 직접 브라우저 확인**(잘린 라벨·겹침 0, 기능·라벨 변경 0을 diff로 대조)
  ②통과 시 커밋 → 작업목록 우선순위 1의 10건을 Codex에 순차 위임(화면별 누락 복원·재창조 되돌리기)
  ③각 건 완료마다 브라우저 확인 후 커밋. ④회장 회수 대기(비가역): 온보딩 원클릭 전환 / 제품 정본 확정 /
  채널별 다시쓰기 자동생성 / 플랫폼 심사·유튜브 사용량 증량 신청(회장 계정 필요).

### 2026-08-10 — 디자인 시스템 실제 코드 build 증거·브라우저 차단
- **handoff 기준:** 회장이 직접 지정한 `feat/design-system-and-missing-features` 과제와 `pipeline-state.osmu.md override:true`를 primary로 사용했다. tmux는 샌드박스가 `/private/tmp/tmux-501/default` 접근을 막아 미참조했다.
- **구현:** `globals.css`에 v23 간격 6단·글자 7단·44px 터치·overflow 계약을 토큰화했다. shared에 `Button/Stack/Section/Field`를 만들고 기존 `Card/StatusBadge/EmptyState`를 정합화했다. Home/Studio/ChannelPage 3화면을 공통부품으로 마이그레이션했다.
- **보존:** Studio `PlatformPreview` 호출 2곳과 발행 이력 패널은 작업 시작 commit `066cb3d5`와 추출 diff 0. 새 route/API/DB/기능/라벨 변경 0.
- **커밋:** `a40f1185`(공통부품), `5d36654f`(12px 하한), `1adbc114`(3화면), `60021986`(현황·exit report·하한 계약테스트). 후속 report 수치 보정은 아직 미커밋.
- **검증:** focused 5 files 23/23, 전체 Vitest 127 files 1045 PASS/10 skip, `tsc --noEmit` exit 0, webpack production build 166/166와 route manifest 출력. build log=`/tmp/osmu-design-system-build.log`.
- **브라우저 차단:** 실제 Next dev가 코드 실행 전 `listen EPERM 127.0.0.1:3456`으로 실패. 1440/1024/390 PNG는 생성하지 않았고 잘림0·겹침0·실제 폭은 **미검증**. 제품 결함이 아니라 sandbox port bind 차단이지만 QA gate는 닫지 않는다.
- **문서:** `docs/구현현황.md`, `docs/reports/osmu-design-system-build-v1-gpt-codex.md`.
- **정확한 다음 액션:** 포트 허용 QA 환경에서 Home/Studio/`/channels/threads`를 1440·1024·390으로 실제 캡처 → PNG IHDR 폭 검사 → DOM/육안 잘림·겹침 0 확인. 그 증거 전에는 QA PASS·ship 전환·완료 주장 금지.

### 2026-08-10 19:2x KST — Codex 디자인시스템 구현 완료(코드 커밋 4건). 로컬 시각 QA는 인증 게이트로 막힘
- **handoff 기준:** 회장 지시("다 해 … CODEX 적절하게시키고")를 primary.
- **★ 실제 제품 코드가 처음으로 움직였다(이번 세션 최초):** 브랜치 `feat/design-system-and-missing-features`에
  Codex 커밋 4건.
  - `a40f1185 feat(dashboard): add v23 design system primitives` — `components/shared/`에 **Button/Stack/Section/Field 신설**,
    `globals.css` 토큰 65줄 추가, Badge·Card·EmptyState 정합화, `tests/components/DesignSystem.test.tsx` 72줄 신설.
  - `5d36654f refactor(dashboard): enforce 12px minimum type` — 9·10·11px 글자 상향(잔존 4건, 확인 필요).
  - `1adbc114 refactor(dashboard): migrate key screens to shared primitives` — studio/page.tsx, app/page.tsx,
    ChannelPage.tsx 외 blog·calendar·images·inbox·operator/customers·videos·settings·AccountManager·ContentGuide·
    InstagramPage·KeywordsEditor 등 다수 마이그레이션.
  - `60021986`, `c7f41941` — 증거 문서 `docs/reports/osmu-design-system-build-v1-gpt-codex.md`, `docs/구현현황.md`.
- **Codex 자기보고 검증치:** Vitest **1,045 PASS**, TypeScript exit 0, webpack build **166/166**,
  기능·라벨 변경 **0**, 보호 지정한 Studio 영역(PlatformPreview 렌더·발행이력 패널) diff **0**.
  Codex가 스스로 **미통과로 신고한 것**: 1440·1024·390 시각 QA(포트 바인딩 차단으로 실행 불가).
- **★ 부모가 로컬 실행 환경을 직접 구축(회장 위임 범위, 가역):**
  - `npm run dev` 기동 성공(Next.js 16.2.2, localhost:3000). 최초에는 `DATABASE_URL` 부재로 화면이 안 떴다.
  - **docker로 로컬 Postgres 기동**(`osmu-pg`, 포트 55432) → `dashboard/db/schema.sql` + `db/rls.sql` 적재 →
    `scripts/seed-test-tenants.sql` 시드(INSERT 3건) → `dashboard/.env.local`에 DATABASE_URL 작성 → dev 재기동.
  - `/studio` HTTP **200**, `/api/me` = `{"isOperator":true,"tenant":null}`(dev 인증 비활성 정상 응답).
- **⛔ 현재 막힌 지점(미검증, 다음 세션 최우선):** 브라우저에서 `/studio`가 **"서비스 확인 실패"** 게이트 화면으로 막힌다.
  `/api/me`는 200인데 `AuthGate.tsx:513-525`가 `getAuthToken()`으로 **브라우저 localStorage의 이전 세션 토큰**을 실어
  보내 401/4xx가 나면 fail-closed로 이 화면을 띄우는 구조다. 즉 서버가 아니라 **브라우저에 남은 낡은 토큰**이 원인으로
  추정된다(미확인). 해소 후보: 해당 탭 localStorage 비우기 / 시크릿 창 / `/login` 경유 / dev용 토큰 정리.
  **이것이 풀려야 회장이 요구한 "실제 화면에서 되는 것" 확인이 가능하다.**
- **파일 변경:** 제품 코드 = Codex 커밋 3건(위), 문서 2건, 부모가 `dashboard/.env.local` 생성(로컬 전용, git 미추적 확인 필요).
  로컬 인프라 = docker 컨테이너 `osmu-pg`(포트 55432).
- **정확한 다음 액션:** ①브라우저 낡은 토큰 제거해 `/studio`·`/`·채널 화면 렌더 확보 ②**부모가 1440/1024/390에서
  직접 확인**(잘린 라벨·겹침 0, 기능·라벨 변경 0을 `git diff`로 대조) — 캡처는 **실제 픽셀 폭 검사 통과** 필수
  (새 게이트가 강제) ③통과 시 커밋·보고 ④`docs/audit/worklist-real-code.md` 우선순위 1의 10건을 Codex에 순차 위임
  ⑤잔존 9·10·11px 4건 확인·정리.

### 2026-08-10 19:4x KST — ★ 실제 제품이 로컬에서 렌더됨(운영자 콘솔 확인). 고객 화면은 세션 필요
- **막힘 해소(부모 직접):** "서비스 확인 실패"의 원인은 서버가 아니라 **브라우저 localStorage에 남은 타 프로젝트/
  이전 세션 토큰 21개**였다(accessToken·token·auth-storage·dashboard_auth_token 등). 전량 clear 후 게이트 해제 →
  로그인 전 랜딩("AI가 SNS 마케팅을 자동화합니다")이 정상 렌더됨.
- **개발용 로그인 경로 확보:** `dashboard/.env.local`에 `DASHBOARD_AUTH_TOKEN=devlocaltoken` 추가 후 dev 재기동,
  브라우저 localStorage에 같은 값 주입 → **운영자로 로그인 성공**. `.env.local`은 `git check-ignore`로 **미추적 확인**.
- **★ 실제 화면 렌더 확인(직접 관찰):** `/operator/customers` = **유저 관리자** 콘솔이 실제로 뜬다.
  좌측 `Admin / 운영자 콘솔 / 고객 관리`, 본문에 중앙 OAuth 개발자 앱(0/0 준비), Auth 가입자 0명,
  워크스페이스 0개, 하단 다크 모드·로그아웃. **프로토타입이 아니라 진짜 제품 화면이다.**
- **관찰된 결함 1건:** 화면 상단에 **`API error: 500`** 배너. 로컬 DB에 해당 테이블 데이터/스키마 일부가 없어서로
  추정(미확인). 어느 API인지 특정 필요 → 다음 세션 첫 작업.
- **고객 화면(`/studio` 등)은 아직 못 봄:** 운영자 토큰으로 들어가면 운영자 콘솔로 라우팅된다.
  고객 화면을 보려면 **테넌트 세션**이 필요하다(Google OAuth 전용 로그인 경로라 로컬에서 우회 방법 확인 필요).
  seed-test-tenants.sql로 tenants 행 3건은 심었으나 세션 연결은 미해결. **미검증.**
- **현재 미검증:** 고객 화면 3폭 시각 QA(스튜디오·홈·채널), 잘린 라벨·겹침 0 실측, 기능·라벨 변경 0의 육안 대조.
  Codex 자기보고(테스트 1045 PASS·빌드 166/166·기능변경 0)는 정적 증거이고 시각 증거는 아직 없다.
- **로컬 환경 정보(다음 세션 재현용):** docker 컨테이너 `osmu-pg`(postgres:16, 5432→55432, DB osmu, user postgres,
  pw osmu), 스키마 `dashboard/db/schema.sql`+`rls.sql` 적재, 시드 `dashboard/scripts/seed-test-tenants.sql`,
  dev 서버 `cd dashboard && npm run dev`(localhost:3000), 로그 `/tmp/osmu-dev.log`.
  브라우저 진입 = localStorage `dashboard_auth_token`=`devlocaltoken`.
- **정확한 다음 액션:** ①`API error: 500`의 원인 API 특정·수정(네트워크 탭 또는 dev 로그) ②고객 테넌트 세션 확보
  경로 마련(로컬 전용, 프로덕션 인증 로직 변경 금지) ③확보되면 **부모가 1440/1024/390에서 스튜디오·홈·채널 직접 확인**
  (캡처 실제 폭 검사 통과 필수) ④통과 시 커밋 후 `docs/audit/worklist-real-code.md` 10건 순차 진행.

### 2026-08-10 21:2x KST — 운영자 화면 정상 렌더 확인(500 해소). 로컬 인증 스키마 보완
> ⚠️ 이 파일은 2026-08-10 회장 지시(운영카드 ⑩)부터 **최신순(역순) append**다. 최신이 위, 과거가 아래.
> 이 항목 아래의 과거 기록들은 예전 규칙(오래된 것이 위)대로 쌓여 있다. 읽을 때 주의.

- **handoff 기준:** 회장 "뭐하고 있냐? 21:18" 질의를 primary(tmux 미참조).
- **정직한 상태:** 19:45 턴 종료 후 21:18까지 **자동으로 진행된 작업은 없다.** 세션은 턴 사이에 돌지 않고,
  띄워둔 dev 서버도 그 사이 죽어 있었다(`ps`로 확인, 0개). 이번 턴에 재기동하고 이어서 작업했다.
- **★ 500 원인 규명·해소(직접 관찰):** `/api/operator/customers`가 500이던 원인은
  **`relation "auth.users" does not exist`** — 이 제품은 Supabase의 `auth.users`를 직접 조회하는데
  (`app/api/operator/customers/route.ts:131` `FROM auth.users u`), 내가 띄운 순정 Postgres에는 그 스키마가 없었다.
  → **로컬 전용 보완**: `CREATE SCHEMA auth` + `auth.users` 스텁 테이블 생성, 실제 쿼리가 요구하는 컬럼을
  오류 메시지 기반으로 순차 추가(raw_app_meta_data, email_confirmed_at, confirmation_sent_at, banned_until,
  deleted_at, phone, confirmed_at, invited_at, updated_at, is_sso_user, role), 시험 사용자 2명 삽입.
  **제품 코드는 한 줄도 바꾸지 않았다**(로컬 DB 구성만).
- **★ 실제 화면 확인(직접 관찰, 프로토타입 아님):** `/operator/customers` 정상 렌더.
  상단 지표 카드 6개(가입자 2 / 워크스페이스 2 / 활성 2 / 연결 계정 0 / 발행 0 / 실패 0),
  **중앙 OAuth 개발자 앱 12개 provider 카드**(Instagram·Threads·X·LinkedIn 등)에 Callback URL·복사 버튼·
  필수 필드(App ID/App Secret, 미설정 표시)·콘솔 설정 3단계·개발자 콘솔/공식 문서 링크. **오류 배너 사라짐.**
- **새로 관찰된 결함 1건:** 각 provider 카드에 **`저장소 장애`** 배지 + "자격증명 저장소 장애입니다. 기존 값을 다시
  입력하지 마세요. DB 복구 후 새로고침하세요." → `oauth_app_credentials` 암호화(pgcrypto/키) 관련으로 추정, **미확인**.
  다음 세션 첫 작업 후보.
- **여전히 미검증:** 고객 화면(스튜디오·홈·채널) 3폭 시각 QA. 고객 로그인이 Google 전용이라 로컬 진입 경로가 없다.
  Codex의 디자인시스템 마이그레이션 결과를 **눈으로 본 증거가 아직 없다**(정적 증거만: 테스트 1045 PASS, 빌드 166/166).
- **로컬 재현 정보 갱신:** docker `osmu-pg`(5432→55432, db osmu, pw osmu) + `auth` 스키마 스텁,
  `dashboard/.env.local`(DATABASE_URL + DASHBOARD_AUTH_TOKEN=devlocaltoken, git 미추적 확인),
  dev = `cd dashboard && npm run dev`(3000, 턴 사이에 죽으므로 매 세션 재기동 필요),
  브라우저 진입 = localStorage `dashboard_auth_token`=`devlocaltoken`.
- **정확한 다음 액션:** ①`저장소 장애` 원인 규명(pgcrypto 확장·암호화 키 env 확인) ②고객 테넌트 세션 로컬 진입로 확보
  (제품 인증 로직 변경 금지, 로컬 전용) ③확보 즉시 **부모가 1440/1024/390 직접 확인**(캡처 실제 폭 검사 통과 필수)
  ④통과 시 커밋 → `docs/audit/worklist-real-code.md` 10건 순차.

### 2026-08-10 21:4x KST — ★ 실제 고객 화면(OSMU Studio) 로컬 렌더 성공. 저장소 장애 해소
- **handoff 기준:** 회장 "계속 진행하고 있는거 맞냐?" 질의를 primary(tmux 미참조).
- **정직한 답:** **메시지 사이에는 안 돈다.** 세션은 회장 발화 턴에서만 실행되고 dev 서버도 턴 사이에 죽는다.
  이 턴에서 재기동하고 아래 작업을 실제로 진행했다.
- **★ 자격증명 저장소 장애 해소(원인 규명 완료):** `/api/operator/oauth-credentials`가
  `"암호화 키 또는 데이터베이스 연결이 설정되지 않았습니다"`를 반환했다. 원인 2개 —
  ①로컬 DB에 `pgcrypto` 확장 없음 ②`OSMU_SECRET_KEY` env 미설정(`lib/oauth-app-credentials.ts:286` 등에서 요구).
  → `CREATE EXTENSION pgcrypto` + `.env.local`에 `OSMU_SECRET_KEY` 추가 → API가 12 provider 정상 반환.
  **제품 코드 변경 0**(로컬 환경 구성만).
- **★ 고객 세션 로컬 진입로 확보(제품 인증 로직 불변):** `lib/tenant-auth.ts:142`가 **`osmu_` 접두 토큰**을
  `tenant_tokens` 테이블의 sha256 해시로 조회하는 정식 경로를 이미 갖고 있다. 우회·해킹이 아니라 **제품이 지원하는
  기능**을 쓴 것이다. → 토큰 원문 `osmu_devtenant`의 sha256을 `tenant_tokens`에 삽입(tenant=seed-a).
  `/api/me` = `{"isOperator":false,"tenant":{"slug":"seed-a","name":"Seed A","status":"active"}}` 확인.
- **★ 실제 OSMU Studio 화면 렌더 확인(직접 관찰, 프로토타입 아님):**
  좌측 사이드바 = Marketing Hub / Seed A / OVERVIEW(성과·OSMU Studio[NEW]·승인 인박스[NEW]·발행 캘린더) /
  SOCIAL 0/5(Threads[Off]·X·Instagram·Facebook·Bluesky) / MESSAGING 0/3 / VIDEO 0/2 /
  DATA & ANALYTICS(Blog Performance·Search Console·Google Analytics) / KEYWORD RESEARCH(Keyword Planner·
  Search Advisor·Naver Trends·Google Trends) / 다크 모드·로그아웃.
  상단 = `OSMU Studio · 직접 저작·생성→즉시 발행/예약`, AI 공유 Claude CLI 표시, 글감 입력창,
  브랜드 설정·위키·**OSMU 생성**·AI 자동초안 버튼.
  **우측에 `발행 이력` 패널이 실제로 존재**("클릭→수정 후 재발행", seed idea 항목, `불러오기` 버튼)
  → 내가 프로토타입에서 결정했던 "오른쪽 열 발행 이력"이 **실제 코드에 원래 있던 것과 일치**함을 확인.
  하단 안내 = 실 발행 조건(채널 토큰 연결 시 실제 게시), 이미지·영상 생성은 운영자 전용 기능 표시.
- **미검증(다음 작업):** 1440/1024/390 3폭 시각 QA는 아직. 현재 확인은 브라우저 기본 폭 1회뿐이다.
  Codex 디자인시스템 마이그레이션의 시각 결과(잘린 라벨·겹침 0)는 **여전히 눈으로 검증 안 됨**.
- **로컬 재현 정보(갱신):** docker `osmu-pg`(55432) + `auth` 스키마 스텁 + `pgcrypto`,
  `dashboard/.env.local` = DATABASE_URL / DASHBOARD_AUTH_TOKEN=devlocaltoken / OSMU_SECRET_KEY=devlocalsecret0123456789,
  고객 진입 = localStorage `dashboard_auth_token`=`osmu_devtenant`(운영자로 보려면 `devlocaltoken`),
  dev = `cd dashboard && npm run dev`(턴마다 재기동 필요).
- **정확한 다음 액션:** ①창 폭을 1440·1024·390으로 바꿔 스튜디오·성과·채널 화면 직접 확인, 캡처는 **실제 픽셀 폭
  일치**로 저장(새 게이트 강제) ②`git diff`로 기능·라벨 변경 0 대조 ③통과 시 커밋
  ④`docs/audit/worklist-real-code.md` 10건 순차 진행.

### 2026-08-10 22:0x KST — ★ 예시 데이터 넣어 실제 화면 채움. 신규 유저 온보딩 4단계 완주
- **handoff 기준:** 회장 지시("예시 데이터 넣어서 안 보여주냐")를 primary. 정당한 지적 — 빈 화면은 검수 불가.
- **★ 데모 데이터 시드(로컬 전용, 파일로 재사용 가능):** `dashboard/scripts/seed-local-demo.sql` 신설.
  tenant 이름을 `모노스튜디오`로, 연결 채널 4개(threads·instagram·x active / facebook expired),
  integrations 4행(사이드바 연결수), 브랜드 위키 3문서(포지셔닝·톤·가격혜택), brand_guides 1행,
  초안 5건(published/partial/draft/stopped), 승인 큐 3건(approved 1·pending 2),
  발행물 5건(threads·x·instagram published + facebook failed, permalink·조회·좋아요·댓글·리포스트 실값),
  팔로워 추이 28행(threads·instagram 14일). ※`queue_posts.id`에 default가 없어 `gen_random_uuid()` 명시 필요(함정).
- **★ 신규 유저 온보딩 4단계를 부모가 직접 완주(직접 관찰):** `마케팅 자동화 시작하기`
  ①업종 선택 8종(카페·뷰티·음식점·피트니스·쇼핑·테크·교육·기타) → 테크 선택
  ②발행 채널 선택(Threads·X·Instagram·Facebook·Telegram) → 3개 선택
  ③첫 채널 연결 = **`Threads OAuth 연결` 버튼 한 번. "비밀번호·토큰 입력 없이 Threads 공식 로그인으로 안전하게 연결"**
    + 연결 가이드 3단계 + `다른 계정으로 연결하고 싶어요` + 고급(토큰 직접 입력) 접힘
  ④브랜드 설정하기 / 바로 콘텐츠 만들기 선택 + 무료 서비스 이벤트 안내 → 완료.
  → **회장 요청(R-02-b "OAuth 연결만 하면 API키 저장")과 (R-05 3분류 중 우리 사유)가 실제 코드에 이미 구현돼 있음을
    화면으로 확인.** ③단계에 **"서버에 threads OAuth 앱 자격증명(THREADS_APP_ID/THREADS_APP_SECRET)이 아직
    설정되지 않았습니다. 관리자에게 문의해주세요."**가 실제로 뜬다 = 내가 프로토타입에서 설계한 "오픈 준비중(우리 쪽 사유)"의
    실제 구현체다. 프로토타입이 발명한 게 아니었다.
- **★ 데이터 채워진 실제 성과 화면 확인(직접 관찰):**
  상단 미연결 경고 배너(`15개 미연결` + `연결하기`), `시작 체크리스트 2/4`(채널 1개 연결·브랜드 위키 작성✓·
  콘텐츠 1개 발행✓·성과 확인), **콘텐츠 파이프라인**(초안 0 → 검수 0 → 발행 4 → 성과 4),
  플랫폼 필터 탭 7개(전체·Threads·X·Instagram·Facebook·Shorts·Reels·TikTok),
  **발행물 성과** 발행물 4 / 조회 **6,520** / 좋아요 **491** / 댓글 **60** / 리포스트 **20**,
  발행물 표 5행(플랫폼·내용+permalink 링크·상태 배지 published/failed·조회·좋아요·댓글·발행시각),
  `성과 기반 다음 아이디어`·`성과 수집` 버튼, 하단 운영 현황(PUBLISHED·FOLLOWERS·VIRAL·QUEUE·ENGAGEMENT).
  도달·참여·팔로워 증강은 `insights 연동 시`로 정직 표시(값 없는 것을 0으로 안 세는 규칙이 실제 코드에 있음).
- **미검증:** 1440·1024·390 3폭 캡처 증거는 아직(현재 브라우저 기본 폭 1회 관찰). Codex 디자인시스템의
  3폭 시각 결과는 여전히 미검증.
- **정확한 다음 액션:** ①창 폭 1440·1024·390으로 바꿔 성과·스튜디오·채널 화면 캡처(**파일 실제 폭 일치 필수**)
  ②`git diff`로 기능·라벨 변경 0 대조 ③통과 시 커밋 ④`docs/audit/worklist-real-code.md` 10건 순차.

### 2026-08-10 22:2x KST — 회장 질의 3건 답변 + 실측으로 "뿌리 절반만 팠음" 확인
- **handoff 기준:** 회장 질의("대체 어디에 열어놨음? 프로토타입인데 서버를 띄우고 앉아있노? 그리고 작업한거 최선이야?")를 primary.
- **①어디에 열렸나:** 회장 Chrome의 단일 탭 `Marketing Hub` = `http://localhost:3000/`(탭 목록으로 확인).
  창이 여러 개면 별도 창일 수 있어 주소 직접 입력 안내. **부모 응답 종료 시 dev 서버가 죽는다**는 구조적 한계도 고지.
- **②"프로토타입인데 왜 서버냐"에 대한 답(입장 유지):** 지금 열린 것은 **프로토타입이 아니라 실제 제품**
  (`dashboard/src` 코드 렌더). 회장 "다 해" 승인으로 프로토타입 리테이크를 중단하고 실제 코드 수정으로 전환했기 때문이다.
  단 회장이 "프로토타입 가져와"라고 한 것도 사실이므로 **둘 관계를 명확히 정리하지 않은 것은 부모 잘못**으로 인정.
  정리된 규칙: 프로토타입은 더 그리지 않고, 그 안의 설계(연결 3단계·상태 3분류·발행이력 배치)는
  **실제 코드 수정의 지시서로만** 쓴다.
- **③"최선이냐" → 아니다. 실측 근거:**
  - **간격 클래스 종류 60가지 잔존**(`dashboard/src` .tsx 실측). 목표는 6단계인데 Codex가 화면 일부만 옮겨
    **뿌리 해결이 절반**이다. 나머지 화면엔 손으로 박은 값이 그대로다.
  - **12px 미만 글자 4곳 잔존.**
  - **`docs/audit/worklist-real-code.md` 빠진 기능 10건 착수 0건**(영상 클립 재활용·확산·발행 3종,
    승인함 설정·거절 흐름, 캘린더 월 그리드 등).
  - **재창조 되돌리기 착수 0건.**
  - **3폭(1440/1024/390) 시각 확인 미실시** — 기본 폭 1회 관찰뿐.
- **파일 변경:** 이 노트뿐(이번 턴은 사실 확인·실측·답변). 제품 코드 변경 0.
- **정확한 다음 액션(지시 없으면 1번부터):**
  ① **간격·글자 정리를 전 화면으로 확장**(Codex 위임). 60종 → 6단계, 12px 미만 0. 종료증거 = 종류 수 실측 + 빌드·시험 통과.
  ② 3폭 확인(캡처 실제 폭 일치 필수). ③ 빠진 기능 10건 순차(건별 브라우저 확인 후 커밋).
  ④ 회장 회수(비가역): 플랫폼 심사·유튜브 사용량 증량 신청.
  ※1번을 먼저 하는 이유 = 뿌리를 절반만 파놓으면 이후 화면 작업이 계속 어긋난다.

### 2026-08-11 — 대시보드 결함 2건 수정 (code-builder 위임 실행, 브라우저 확인 완료)
- **기반:** 회장 실측 결함 리포트(스튜디오 생성 실패 무피드백, 홈 패널 모순) — override 승인(만료 8/17).
- **결함1 (studio 생성 실패 무피드백):** `dashboard/src/lib/api.ts`의 `apiPost`가 non-2xx에서 throw하는데
  `dashboard/src/app/studio/page.tsx`의 `genText/genImage/genVideo`가 `try/catch` 없이 `r?.ok` 체크만 해서
  403(shared_ai_approval_required) 등 실패가 콘솔에만 찍히고 화면(lastError 배너·토스트)엔 안 뜨던 버그.
  세 함수에 try/catch + `extractApiErrorMessage()` 헬퍼 추가, 기존 lastError/toast 메커니즘 재사용(신규 컴포넌트 없음).
  브라우저 확인: `/studio`에서 생성 클릭 → 빨간 배너 "마지막 실패: 텍스트: 공유 AI 생성은 아직 승인되지
  않았습니다..." 노출 확인. 스크린샷 `docs/audit/qa-2026-08-11/defect1-fixed-studio-error-banner.jpg`.
- **결함2 (홈 패널 모순):** 원인 = 시드 갭 아님, **구조적 dual-datastore**. `/api/overview`,
  `/api/weekly-summary`, `/api/activity`가 레거시 Flask 파일(`data/tenants/{id}/queue.json`, Phase-1
  미마이그레이션 — CLAUDE.md 로드맵 문서화됨)을 읽는데 DB로 시드한 이 테넌트는 그 파일이 없어 전부 0/빈배열.
  반면 `/api/metrics`는 Postgres `published_posts`(실 시드데이터)를 읽어 실데이터 표시 — 같은 화면에
  두 소스가 모순 병기(R-09). queue.json에 중복 데이터를 억지로 채우지 않고, `dashboard/src/app/page.tsx`에서
  레거시 큐가 비어있을 때만 DB 실데이터(`publishedPosts`)로 폴백하는 `totalPub`/`weeklyView`/`activityView`
  파생값을 추가(컴포넌트·API 삭제 없음, 표시 소스만 정합화). 브라우저 확인: Published 4/This Week
  4·6520·491·60/Recent Activity에 실제 발행 4건 표기, 모순 해소. 스크린샷
  `docs/audit/qa-2026-08-11/defect2-fixed-home-recent-activity.jpg`.
- **검증:** `npx tsc --noEmit` PASS. `npm run test:publish` = 26 files / 222 tests 전부 PASS(무변경 회귀 없음).
- **미해결 남긴 것:** 4개 legacy 파일기반 라우트(overview/activity/weekly-summary/agent-logs)를 DB로
  완전 마이그레이션하는 것은 스코프 밖(Phase 2 로드맵 항목) — 이번엔 프런트 폴백으로 화면 모순만 제거.
