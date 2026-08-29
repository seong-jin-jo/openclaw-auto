## 2026-08-30 01:15 KST Claude 세션 (osmu 라인) 격리·안터진글 조 회수

핸드오프 기준: 이 파일(session-state.osmu.md).

★★ 승낙 없이 글을 지우는 옛 경로가 아직 살아 있다. 조 발주함(ab7cac87).
  extensions/threads-insights/src/threads-insights-tool.ts:311 cleanupLowEngagement()
  가 승낙 없이 즉시 삭제하고 376행에서 도구 동작으로 노출돼 있다.
  CLAUDE.md 크론 표의 threads-collect-insights 가 "저조 삭제"를 한다고 적혀 있다.
  ★크론 정의(jobs.json)가 이 레포에 없다. OpenClaw 런타임 설정 쪽으로 보인다.
   컨트롤러가 레포 안에서 찾았으나 못 찾았다. 조에게 "레포 밖이면 확인 불가라고 정확히 적어라,
   추측으로 안전하다고 쓰지 마라"고 지시했다.
  ⇒ 옛 경로를 지우지 말고 승낙 없이는 실제 삭제가 안 일어나게 막으라고 지시.
    회귀 테스트 필수. CLAUDE.md 크론 설명도 실제와 맞는지 확인시킴.

회수 완료: 격리 구멍 (sonnet, 커밋 881d8cf9 에 섞여 들어감 + bf1e9ee9)
- ★실제 유출은 없었다. 목록 등록 누락만이었다.
- 워커가 목록에 넣기 전에 실공격을 먼저 쐈다(테넌트 A/B 발급, B로 쓰고 A로 읽기).
  learned-rules 는 proxy.ts 의 TENANT_AWARE_PATHS 에 없어 고객·테넌트 토큰이
  라우트 도달 전 403 으로 막힌다. 운영자 전용이라 fail-closed 였다.
  데이터는 data/tenants/{tenantId}/performance-learned-rules.json 로 물리 격리.
- 같은 밤 신규 API 9개를 전수 대조해 low-engagement-candidates 1건을 추가로 발견해 등록.
- ★워커 경고: 지금 안전한 이유는 "운영자 전용"이기 때문이지 구조 때문이 아니다.
  이 경로가 나중에 TENANT_AWARE_PATHS 로 옮겨져 고객 토큰이 직접 부르게 되면 재검증 필요.
- ★컨트롤러 직접 실행: npx vitest run tests/isolation/ → 17파일 175건 전부 통과.

회수 완료: 안 터진 글 정리 실행 (sonnet, 커밋 881d8cf9, 96cdff44)
- verify-agent-quality FAIL(Skill/WebSearch 0회). 코드 구현 판이라 경고 라벨로 출고.
- GET /api/threads/low-engagement-candidates (읽기 전용, 24시간 경과 + 기준 미달만)
  POST /api/threads/low-engagement-cleanup (postId 배열 필수, 빈 배열·누락은 400)
  성과실 카드가 "준비 중" 배지에서 후보 건수 + 목록 모달 + 2단계 확인 삭제로 바뀜.
- ★승낙 없는 삭제 경로는 새로 안 만들었다. 사람이 고른 postId 만 처리한다.
- 삭제 기록은 data/low-engagement-cleanup-log.json 에 append.
- 워커 증거: tsc 0, 신규 테스트 8/8, curl 실측(무인증 401, 후보 GET 200,
  본문 없는 삭제 400, 없는 postId 200 삭제0 실패1).
- low_engagement_cleanup.implemented 는 의도적으로 false 유지.
  정기 자동삭제가 아니라 승낙형이라 true 로 바꾸면 "자동 실행"으로 오인된다는 판단. 타당하다.

아직 도는 조:
- 발행실 대화창과 깊이 (opus, ae325754)
- 승낙 없는 삭제 경로 차단 (sonnet, ab7cac87)

★ 아직 아무도 안 맡은 것:
- 성과실 머리줄 학습 정보(다른 세 방에는 붙었다)
- "같이 만들기" 실제 파생 생성(lib/studio/generation)
- 390 폭과 다크 모드
- 브라우저 콘솔 403 두 건 출처(발행실 조에 함께 지시함)
- 실계정 로그인 완주
- 30건 대조표 재실행

배포: PR #36 회장 머지 대기. 순서는 docs/releases/2026-08-29-배포-교착-해소-순서.md.
상품명: 회장 결정 대기. 추천 "OSMU 팩토리".

다음 액션:
1. 두 조 회수 → verify.
2. 성과실 머리줄 학습 정보 + 파생 생성 발주(발행실 조 회수 후, 파일 충돌 회피).
3. 30건 대조표 재실행. ★프롬프트에 '~/.claude/standards/doc-review.md Read 필수' 명시.
4. 390 폭·다크 모드 점검 발주.

