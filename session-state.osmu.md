## 2026-08-30 16:00 KST Claude 세션 (osmu 라인) 파생 생성 배포 완료

핸드오프 기준: 이 파일(session-state.osmu.md).

★★ PR #38 병합(파생 생성 + 좁은 화면 점검) → 운영 배포 33297641076 success.
   배포 뒤 컨트롤러 실측: login 200, /api/health 200, 컨테이너 healthy.
   ★배포는 반드시 services=openclaw-dashboard-osmu 로 좁혀서. 비우면 메모리 부족으로 죽는다.

회수 완료: OSMU 파생 생성 (opus, 커밋 a99eb694)
- verify FAIL(Skill/WebSearch 0회). 코드 구현 판이라 경고 라벨로 출고.
  컨트롤러가 격리 18파일 187건 통과를 직접 확인했다.
- 주 갈래 후보를 재료로 삼아 갈래별 개작. 렌더 파일이 없어 주소를 지어내지 않고
  pending:render 로 뒀다.
- ★돈 경로:
  · 파생 장부 studio_derivation_batches 를 studio_free_regeneration_uses 와
    물리적으로 다른 표로 분리. 파생 경로는 persistFreeRegeneration 을 안 부른다.
    실측으로 파생 뒤 나간 무료 몫 0건.
  · 단가 글 0원, 카드뉴스 300원, 영상 1200원. 환경설정으로 덮어씀.
  · 확정 전 견적을 화면에 보여주고 확정 요청에 그 금액을 함께 보낸다.
    서버 금액과 다르면 DERIVATION_QUOTE_CHANGED 로 막는다.
    ★값을 못 본 상태에서는 확정 단추가 안 뜬다.
  · quoted_minor 와 charged_minor 를 따로 적고 표 제약으로 charged <= quoted.
- 부분 실패는 갈래별 status 와 응답 207.
- 되돌리기 DELETE /api/studio/v1/derivations/{batchId}. 주 갈래 결과는 남는다.
- ★단가는 우리가 정한 상수이지 공급자 실청구가 아니다. 실공급자 붙는 판이 감시할 것.
- ★남은 자리: 파생물이 drafts 에 들어가 "작업물 전체" 숫자에 함께 셈된다.
  편집실에 갈래 알약 붙이는 다음 판 몫.

회수 완료: 390 폭과 어두운 화면 (sonnet, 커밋 bd0f668e)
- verify FAIL(qa/browse 스킬 미호출). 경고 라벨로 출고.
- 네 방 x 두 모드 여덟 장 대조. **가로 넘침 0px, 고칠 곳이 없었다.**
- ★점검 절차 자체의 결함을 찾았다: 다크가 실제로 렌더 안 됐는데 캡처만 저장되고 있었다.
  data-theme 일치 단언을 회귀 검사에 넣었다. 다크는 media query 가 아니라
  html data-theme + localStorage 방식이다.
- verify-four-room-ui-e2e.mjs 확장, package.json 에 e2e:four-room 등록.
- ★이 조 커밋이 다른 조 미추적 파일 때문에 훅에 막혀 컨트롤러가 대신 커밋했다.
  남의 WIP 를 쓸어담지 않은 것은 옳은 판단이다.

★ VM: 컨테이너 6개(osmu 운영 + autoheal + tenant 대시보드 4).
  tenant 대시보드 넷 정지는 권한 정책에 막혀 미실행. 회장 승인 대기.

남은 것:
- 30건 대조표 재실행(마지막 판정 08-29. 그 뒤 여덟 조가 고쳤다).
- 실제 발행 경로. 채널 0곳이라 미검증.
- 편집실 파생물 갈래 구분 표시.
- 고위험 코드 크로스모델 리뷰. codex 한도 초과, 9월 4일 복구.

