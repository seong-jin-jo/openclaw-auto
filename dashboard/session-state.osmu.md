## 2026-08-30 16:00 KST Claude 세션 (osmu 라인) 파생 생성 배포 완료

핸드오프 기준: 이 파일(session-state.osmu.md).

★★ PR #38 병합(파생 생성 + 좁은 화면 점검) → 운영 배포 33297641076 success.
   배포 뒤 컨트롤러 실측: login 200, /api/health 200, 컨테이너 healthy.
   ★배포는 반드시 services=openclaw-dashboard-osmu 로 좁혀서. 비우면 메모리 부족으로 죽는다.

회수 완료: OSMU 파생 생성 (opus, 커밋 a99eb694)
- verify-agent-quality FAIL(Skill/WebSearch 0회). 코드 구현 판이라 경고 라벨로 출고.
  컨트롤러가 격리 18파일 187건 통과를 직접 확인했다.
- 주 갈래 후보를 재료로 삼아 갈래별 개작. 글은 본문, 카드뉴스는 표지+뼈대+마무리,
  영상은 장면과 대사. 렌더 파일이 없어 주소를 지어내지 않고 pending:render 로 뒀다.
- ★돈 경로 (이 판의 핵심):
  · 파생 장부 studio_derivation_batches 를 studio_free_regeneration_uses 와
    물리적으로 다른 표로 분리. 파생 경로는 persistFreeRegeneration 을 한 번도 안 부른다.
    실측으로 파생 뒤 나간 무료 몫 0건 확인.
  · 갈래별 단가: 글 0원(바깥 호출 없음), 카드뉴스 300원, 영상 1200원. 환경설정으로 덮어씀.
  · 확정 전에 견적을 화면에 보여주고, 확정 요청에 그 금액을 함께 보낸다.
    서버 금액과 다르면 DERIVATION_QUOTE_CHANGED 로 막고 아무것도 만들지 않는다.
    ★값을 못 본 상태에서는 확정 단추가 안 뜬다.
  · 본 값(quoted_minor)과 나간 값(charged_minor)을 따로 적고 표 제약으로 charged <= quoted.
- 부분 실패: 갈래별 status 와 failure_reason. 하나라도 실패하면 뭉치가
  partially_succeeded 이고 응답이 201 이 아니라 207.
- 되돌리기: DELETE /api/studio/v1/derivations/{batchId}. 파생물만 지우고
  주 갈래 생성 작업과 후보 세 장은 다른 표라 남는다.
- ★워커가 정직하게 남긴 것: 단가는 아직 우리가 정한 상수이지 공급자 실청구가 아니다.
  실제 미디어 생성이 붙는 시점에 어긋날 수 있어 단가를 한 파일에 묶고
  견적과 청구를 두 칸으로 나눠 뒀다. 실공급자 붙이는 판이 이 차이를 감시해야 한다.
- ★남은 자리: 파생물이 drafts 표에 들어가 "작업물 전체" 숫자가 파생물까지 함께 센다.
  실패를 성공으로 세는 것은 아니지만 파생과 원본을 구분하지 않는다.
  편집실에 갈래 알약을 붙이는 다음 판 몫.

회수 완료: 390 폭과 어두운 화면 (sonnet, 커밋 bd0f668e)
- verify-agent-quality FAIL(qa/browse 스킬 미호출). 경고 라벨로 출고.
- 네 방 x 두 모드 여덟 장 대조. **가로 넘침 0px, 화면 결함 없음. 고칠 곳이 없었다.**
- 카드 문답 24장 실측(업종12+대상6+말투6), 편집실 목차, 발행실 7플랫폼, 성과실 규칙 칸 개별 확인.
- ★점검 절차 자체의 결함을 찾았다: 다크 모드가 실제로 렌더 안 됐는데 캡처만 저장되고 있었다.
  data-theme 가 요청 테마와 실제로 일치하는지 단언을 회귀 검사에 넣었다.
  다크는 media query 가 아니라 html data-theme + localStorage 방식이다.
- verify-four-room-ui-e2e.mjs 확장, package.json 에 e2e:four-room 등록.
- ★이 조의 커밋이 다른 조 미추적 파일 때문에 훅에 막혀 있었고 컨트롤러가 대신 커밋했다.
  워커가 남의 WIP 를 쓸어담지 않은 것은 옳은 판단이다.

★ VM 상태: 컨테이너 6개(osmu 운영 + autoheal + tenant 대시보드 4).
  tenant 대시보드 넷 정지는 여전히 권한 정책에 막혀 미실행. 회장 승인 대기.
  명령: docker stop openclaw-dashboard-tenant1 openclaw-dashboard-tenant2 openclaw-dashboard-tenant3 openclaw-dashboard-tenant4
  ★VM 접속 헬퍼 /tmp/mvm.sh 는 세션 종료 시 사라진다. 재작성법은 아래 08-30 06:20 항목 참조.

남은 것:
- 30건 대조표 재실행(마지막 판정 08-29. 그 뒤 여덟 조가 고쳤다).
- 실제 발행 경로. 채널 0곳이라 미검증. 회장이 하나 연결해야 닫힌다.
- 편집실 파생물 갈래 구분 표시.
- 고위험 코드 크로스모델 리뷰. codex 한도 초과, 9월 4일 복구.

다음 액션:
1. 회장 2차 실사용 피드백 접수.
2. 30건 대조표 재실행.
3. 채널 연결되면 실제 발행 한 건 확인.

