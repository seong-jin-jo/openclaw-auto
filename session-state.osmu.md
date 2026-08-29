## 2026-08-30 03:00 KST Claude 세션 (osmu 라인) 병합 완료, 배포는 러너 다운으로 중단

핸드오프 기준: 이 파일(session-state.osmu.md).

★★★ 지금 막고 있는 것 딱 하나: **마케팅 VM 의 GitHub Actions 러너가 offline 이다.**
   확인: gh api repos/seong-jin-jo/openclaw-auto/actions/runners
        → marketing-vm offline busy=false
   원인 추정: 배포 실행 33277118330 의 이미지 빌드가 메모리 부족으로 죽었다(exit 137,
   "failed to execute bake: signal: killed"). 그 여파로 러너 프로세스나 VM 이 죽은 것으로 보인다.
   대기중 실행 33277724271(대시보드만 빌드하도록 좁힌 배포)이 러너를 기다리며 20분째 queued.
   ⇒ 러너를 되살리면 그 실행이 바로 이어진다. 세션은 VM 접속이 차단돼 있어 못 한다.

★★ 좋은 소식: **배포 교착은 실제로 풀렸다.** 실행 33277118330 에서
   OSMU DB 스키마 read-only preflight 가 **통과**했다. 이전에는 여기서 exit 3 으로 죽었다.
   이제 막히는 자리는 그 다음의 이미지 빌드 메모리다. 성격이 완전히 다른 문제다.

★ 병합 완료:
- PR #36 병합됨(72086e40). 84커밋. 회장 지시 "너가 머지해" 에 따라 세션이 병합.
  ★충돌 18건이 있었고 opus 조가 풀었다(2030346e). 화면은 이 가지가 뒤,
   DB 는 main 이 뒤라는 기준으로 갈랐고, main 판 화면 커밋이 편집실 소리 도구를
   떨어뜨린 것을 발견해 살렸다.
- PR #37 병합됨(2b8e784c). 배포 교착 재발 해소 + 순서 문서 정정.

★ 운영 DB 에 실제로 돌린 것 (전부 실측):
- audit 성공(33273870691). duplicate 0|0|0, readiness=false|true,
  studio_generation_candidate_rejections missing-relation, 20260829_010 applied.
- apply-legacy 성공(33274470699). 빠졌던 표들 적용됨.
- expand-guard 실패. "permission denied to alter role ... BYPASSRLS".
  ★운영 Supabase 계정 권한으로 이 길은 영구히 불가능하다. 순서 문서에서 뺐다.
- expand-member 실패. "running app commit label is not observable". 배포 뒤에 해야 한다.
- Deploy 33277118330: preflight 통과, 이미지 빌드에서 메모리 부족으로 실패.

★ 코드 수리 (전부 CI green 으로 병합됨):
- 5eeab8a5 성과실 무한 렌더. app/page.tsx 의 학습 정보 효과가 작업 공간 **객체**를
  의존성으로 써서 렌더마다 새 객체로 보여 끝없이 갱신됐다. 원시값 id 로 바꿔 해소.
  ★시험 2건이 180초 무출력으로 멈추던 원인이고 CI 를 막던 것이다.
  워커가 브라우저에서 첫 사용자 상태로 성과실을 열어 확인했다:
  metricsCallsIn10s=1, maxUpdateDepthWarnings=0, frameLatencyMs=14, consoleErrors 0.
- 24e86aaa 배포 preflight 를 assert_deploy_compatible 로 분리.
  회원 전역 강제는 expand-member 의 사후 조건으로 옮겼다. 게이트를 끈 것이 아니라
  제자리로 옮긴 것이다. 중복 0, 필수 표 21개, 접근 정책 강제, 권한 우회 검사는 그대로.
- 912c06be 장부 단조성 검사 추가. 컨트롤러가 "올라갔다가 내려간 상태와 아직 안 올라간
  상태는 다르다"를 지적했고 워커가 인정해 assert_ledger_monotonic 을 넣었다.
  20260829_030 이 applied 인데 회원 전역 UNIQUE 가 없으면 되돌림으로 판정해 막는다.
  ★스키마가 완전히 같고 장부만 다른 두 사례를 시험에 넣어 증명했다.

★★ 회장이 누를 순서 (문서 docs/releases/2026-08-29-배포-교착-해소-순서.md 재작성됨):
   audit → apply-legacy → audit 재확인 → Deploy → expand-member.
   ★expand-guard 는 절대 누르지 마라. 운영 권한으로 불가능하다.
   ★내일 아침 콘텐츠 제작에 필요한 것은 Deploy 까지다.

★ 배포 시 주의: 전체 서비스를 한 번에 빌드하면 메모리 부족으로 죽는다(exit 137).
   services 입력에 openclaw-dashboard-osmu 만 넣어 좁혀서 돌려라.
   대기중인 33277724271 이 이미 그 형태다.

남은 것(회장이 쓰면서 고칠 수준):
- "같이 만들기" 실제 파생 생성(lib/studio/generation). 화면·상태까지만.
- 390 폭과 다크 모드.
- 30건 대조표 재실행.
- 실제 발행 경로. 이 작업 공간에 연결된 채널이 0곳이라 아무도 못 봤다.
  회장이 채널 하나 연결하면 닫힌다. 기본 계정 토글이 세 채널 다 안 뜨는 것도
  계정 0개가 원인이라 같이 닫힌다.
- 고위험 코드 크로스모델 리뷰 미실행. codex 한도 초과, 9월 4일 복구 예정.

다음 액션:
1. 러너가 살아나면 33277724271 이 자동으로 이어진다. 아니면 다시 dispatch.
   services=openclaw-dashboard-osmu 로 좁혀서.
2. 배포 성공 뒤 expand-member 실행(이제 표식이 붙어 통과할 것).
3. 배포 주소에서 네 방 직접 열어 확인.
4. 회장이 채널 연결하면 실제 발행 한 건 확인.

로컬: 개발 서버는 PORT=3456 로 띄워야 한다. matrix 스크립트는 TZ=UTC PGTZ=UTC 필요.

