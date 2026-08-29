## 2026-08-29 20:20 KST Claude 세션 (osmu 라인) 설계안 회수, 모델 고정 해제

핸드오프 기준: 이 파일(session-state.osmu.md).

★ 회장 지시 갱신: "어려운 것만 Opus에 두고 나머지를 내려 토큰을 아끼도록 해."
  ~/.claude/harness/chairman-model-pin 갱신해 고정 해제.
  배정 기준: opus=돈/격리/동시성/인증/아키텍처/교차리뷰/진단,
  sonnet=재현경로 있는 화면수리·E2E·문서, haiku=찾아바꾸기, fable=디자인 시안.
  ※ 지금 도는 두 조는 발주 시점이 고정 상태여서 opus 다. 다음 발주부터 적용.

★ PR #35 회장이 머지함(10:59 UTC = 19:59 KST). 배포는 workflow_dispatch 라
  아직 안 돌았다. 세션은 운영 배포 워크플로를 실행하지 않는다(회장 몫).

회수 완료: 구조 질문 6건 선택지 문서
- docs/design-docs/osmu-4room-구조질문-선택지-v1.0.0-opus-20260829.md (커밋 0f2b6c39)
- 렌더해서 회장께 띄웠다.
- 추천 요약: ①학습정보=첫 방문 세 걸음 카드 문답, 주관식 0개, 헤더에 진행 고리
  ②만들 종류=주 갈래 1 + 같이 만들 갈래 체크 ③챗봇=발행실·성과실 둘 다 두되 성과실 먼저
  ④경계=성과실은 콘텐츠 축, 채널 화면은 계정 축, 캘린더는 헤더 소속 유지
  ⑤영상 모델=이름 지우고 견본 도는 스타일 카드 6장 ⑥새로 시작=생성실만 항상 새 상태,
  아무것도 안 지움, 임시저장 대신 "여기까지를 판으로 고정"
- 관통 원칙: 고객에게 빈칸을 주지 않는다. 고른 것으로 배운다.
- 벤치마크 WebSearch 5회(Figma, Airtable, Canva Brand Voice, Buffer/Hootsuite,
  Higgsfield, Typefully, Opus Clip). Higgsfield 가 모델 이름 대신 프리셋을 앞세운 것이
  질문 5 추천의 직접 근거.
- verify-agent-quality FAIL(design-review 미호출). 화면 시안이 아니라 선택지 문서라
  적용되지 않는 축으로 판단하고 경고 라벨로 출고.

★ 오탐 하나 기록: 설계 조가 dashboard/src/lib/auth-attempt.ts 가 미추적인데
  LoginModal 이 import 한다며 "운영 빌드가 죽는다"고 보고했다. 확인 결과 그 파일은
  오늘 20:00 에 생겼고, 그 시각은 화면/문구 조를 발주한 시각이다. 즉 지금 도는 조의
  작업중 파일이지 운영 결함이 아니다. 커밋된 LoginModal 에는 그 import 가 없다.
  워커 주장을 그대로 릴레이하지 않고 확인한 사례.

아직 도는 조 (둘 다 opus):
- 돈/발행 code-builder: 무료 재생성 quota(R27), quota 복구시각, draft_id 없는 발행
  idempotency, reservation lease, indeterminate 소비, 첫 댓글 실패 published,
  shorts factory fencing.
- 화면/문구 code-builder: 편집실 목차 가림, 발행실 플랫폼별 미리보기, 성과실 헤더,
  버튼 정렬, 미연결 계정 연결 경로, LoginModal 한국어 복구, readiness 문구 우선순위,
  인증 경쟁 3건, 문구 6개, 주석 긴 대시 5곳.

막힌 것:
1. 운영 배포 실행. 회장이 GitHub Actions 에서 Deploy openclaw (marketing VM) 을
   수동 실행해야 한다. 세션은 실행하지 않는다.
2. 운영 로그인 최종 확정. Supabase 인증 복귀 주소 허용목록에 운영 도메인 /login 이
   있는지 회장 콘솔 확인 필요.
3. 교차 모델 리뷰 불가(codex 소진).

다음 액션:
1. 두 조 회수 후 verify 돌리고 릴레이.
2. 설계안 회장 선택 받으면 그 결과를 개발 판으로 만든다(sonnet 배정 가능).
3. 재검증 E2E(sonnet) + 교차 리뷰(opus).
4. codex 복귀하면 /tmp/osmu-supervisor.stop 삭제 후 감독 재기동.

