## 2026-08-29 19:35 KST Claude 세션 (osmu 라인) 배차 재편성

핸드오프 기준: 이 파일(session-state.osmu.md).

현재 작업: codex 사용량 소진으로 전 작업을 Claude 서브에이전트로 재편성.

★ 중대 발견: codex 워커가 08-29 12:34 이후 사망. 그런데 감독은 계속 판을 던져
  1~3분 만에 '끝남'으로 기록했다. 거짓 완료다. 12:40 이후 커밋 0건이 증거.
  (osmu-backlog-state.tsv 의 sweep082913/flowcheck082918/gapfill082919/fixfeedback082919
   전부 1~3분 종료, 커밋 없음.)

조치:
- /tmp/osmu-supervisor.stop 생성 + pkill 로 감독 정지. cron guard 가 되살리지 못한다.
- 감독은 codex 전용이다(osmu-supervisor.sh:156 codex-in-pane.sh 단일 경로).
  codex 가 돌아올 때까지 배차는 메인 세션이 직접 한다.
- fixfeedback082919 상태를 '미실행(codex 소진)' 으로 정정.

만진 파일:
- docs/plan/osmu-backlog-state.tsv (거짓 완료 정정)
- docs/plan/backlog-prompts/fixfeedback082919.txt (앞 턴 신규)
- docs/plan/osmu-backlog.tsv (앞 턴 2줄 추가)

배차 계획(모델 배정, 회장 승인 대기):
- 1조 로그인 실패 진단: Opus 5. 진행중(서브에이전트 가동). 산출물
  docs/audit/osmu-login-failure-diagnosis-2026-08-29-opus.md. 코드 수정 금지, 진단만.
- 2조 돈/격리/동시성 MAJOR 수리: Opus 5. 무료 재생성 quota, 발행 idempotency,
  첫 댓글 실패 published 저장, shorts factory fencing.
- 3조 화면 고장 수리: Sonnet 5. 편집실 목차 가림, 발행실 플랫폼별 미리보기,
  성과실 헤더, 버튼 정렬, 미연결 계정 연결 경로.
- 4조 확정요구 위반 일괄: Haiku 4.5. LoginModal 영어 버튼 한국어 복구,
  주석 em dash 5곳, 뜻 안 통하는 문구 6개.
- 5조 구조 질문 5건 설계안: Fable 5. 회장 판단용 선택지+트레이드오프 문서.
- 소스 쓰는 조는 서로 다른 git worktree 로 격리한다(오늘 리뷰 MAJOR 지적 반영).

검증 상태: 이 턴은 배차 재편성이라 E2E 미실행. 로컬 앱은 여전히 죽어 있다
(curl localhost:3456/api/health 응답 코드 000). 1조가 되살리기를 시도한다.

막힌 것:
1. 배포: PR #35 회장 머지 대기. deploy preflight 가 schema hash S1|S2 로 거절중.
2. 모델 배정 회장 승인 대기.
3. 교차 모델 리뷰 불가. codex 부재로 Claude 가 Claude 를 리뷰한다.
   완화책은 빌더와 리뷰어의 모델 티어를 다르게 두는 것뿐이다. 진짜 교차가 아니다.
   codex 복귀 시 고위험 코드(돈/격리) 재리뷰 권장.

다음 액션:
1. 1조 진단 회수 후 그 결과를 2조 발주 프롬프트에 주입.
2. 5조 Fable 발주(1조와 병렬, 소스 안 건드림).
3. 3조/4조는 worktree 격리해 병렬.
4. 마지막에 재검증 E2E + Opus 교차 리뷰.
5. codex 복귀하면 /tmp/osmu-supervisor.stop 삭제 후 감독 재기동.

