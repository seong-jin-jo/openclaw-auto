## 2026-08-30 02:35 KST Claude 세션 (osmu 라인) 성과실 403 개방, 배포 준비 최종

핸드오프 기준: 이 파일(session-state.osmu.md).

★★ 회장 지시: "QA 꼼꼼히 안해도되니까 일단 나 컨텐츠생성 발행 하게좀"
   ⇒ 완결주의 중단. 회장 실사용이 최우선. 남은 미세 항목은 회장이 쓰면서 고친다.

★★ 배포 준비 끝. PR #36 회장 머지 대기(origin/main 대비 82커밋).
   순서: 머지 → audit → expand-guard → Deploy → expand-member.
   정본 docs/releases/2026-08-29-배포-교착-해소-순서.md.

성과실 403 개방 완료 (커밋 3977ab02)
- ★워커가 검증 대기 중 멈춰서 컨트롤러가 직접 마무리했다(§4.8).
  같은 프롬프트로 재발주하면 같은 자리에서 또 끊긴다.
- 무엇을 했나: proxy.ts 의 TENANT_AWARE_PATHS 에
  /api/performance/learned-rules 와 /api/threads/low-engagement-candidates 를 추가.
  ★/api/cron-status 는 일부러 안 열었다. config/cron/jobs.json 전역 파일을 통째로 읽어
   작업 공간으로 못 가르기 때문이다. 대신 화면 쪽에서 안 부르게 고쳤다.
- ★컨트롤러 직접 실행 증거:
  · npx tsc --noEmit → 0
  · npx vitest run tests/isolation/ → 17파일 175건 전부 통과 (연 뒤에도 격리 유지)
  · npm run test 전체 → 종료 코드 0, 실패 표시 0건
- 만진 파일: proxy.ts, app/page.tsx, components/home/AutomationRulesPanel.tsx, qa-tracker.md

이번 세션 누적 완료:
- 로그인 실패 원인 규명, 배포 교착 해소, 돈·외부 부작용 MAJOR 7건,
  회장 실사용 화면 고장 10건, 생성실 카드 문답(주관식 0개), 편집실 규격 미리보기·임시저장,
  발행실 대화창과 깊이(단추 5→20), 성과실 대화창·규칙 칸, 안 터진 글 정리 승낙형,
  격리 구멍, 승낙 없는 삭제 봉인, 성과실 403 개방.
- 하네스: §5.5 신설(선택지는 추천안 자동 채택), 모델 고정 해제(난이도별 배정),
  codex 감독 정지와 거짓 완료 기록 정정, 세션 라인 마커 osmu 선언.

★ 남은 것 (회장이 쓰면서 고칠 수준):
- "같이 만들기" 실제 파생 생성(lib/studio/generation). 화면·상태까지만 됐다.
- 390 폭과 다크 모드 대조. 아무도 안 봤다.
- 30건 대조표 재실행. 마지막 판정은 08-29 자다.
  ★재위임 시 프롬프트에 '~/.claude/standards/doc-review.md Read 필수' 명시.
- 실제 발행 경로와 기본 계정 토글 여러 개일 때 모습.
  ★이 작업 공간에 연결된 채널이 0곳이라 못 봤다. 회장이 하나 연결하면 닫힌다.

배포 후 할 것:
1. 각 단계 gh run 으로 실측.
2. 배포 주소에서 네 방 직접 열기.
3. 회장이 채널 연결하면 실제 발행 한 건 확인.

상품명: 회장 결정 대기. 추천 "OSMU 팩토리". 문서
docs/design-docs/제품이름-후보와-근거-v1.0.0-fable-20260829.md.

로컬 개발 서버: PORT=3456 로 띄워야 한다. 그냥 npm run dev 는 3000 으로 뜬다.

