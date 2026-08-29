## 2026-08-29 20:40 KST Claude 세션 (osmu 라인) 화면/문구 조 회수

핸드오프 기준: 이 파일(session-state.osmu.md).

회수 완료: 화면/문구 수리 조 (커밋 b110d845, 56f11b5c)
- verify-agent-quality PASS(근거 있음, 경고 2건).
- 컨트롤러가 직접 재검증한 것: 커밋 실존, 캡처 3장 실존(/tmp/osmu-fixshots3, fixshots2),
  LoginModal 에 영어 라벨 잔존 0, 편집실 캡처 눈으로 확인해 목차 3줄 보이고 말줄임 정상.
- 근본 원인 두 가지(워커 실측):
  ① max-h-72 가 이 테마에서 max-height:0 으로 풀린다. nav clientHeight 32/scrollHeight 216
     이었다. max-h-[40vh] 로 바꿔 560/560. ★이게 목차 파탄의 진짜 원인.
  ② 공용 단추 min-w-max 와 .ds-label min-width:max-content 가 240px 칸에서 431px 요구.
     .ds-label-fill 추가로 207px.
- 고친 10건: 편집실 목차, 발행실 7플랫폼 개별 표시이름/캡션/해시태그/첫댓글,
  X 본문을 다시 짓지 않고 한도까지만 축약, 미리보기 5곳 머리줄 넘침 0px,
  성과실 RoomHeader 복원, 제안 단추 정렬(1291/44/342 동일, 수정전 68/68/44),
  미연결 4곳 연결 경로, LoginModal 한국어 복구(경쟁방지·focus trap 유지),
  readiness 사유 우선순위, 인증 경쟁 3건 useAuthAttempt 공용화, 문구 6개, 긴 대시 제거.
- 테스트 1,458 통과 / 5 실패. 실패는 전부 publish-route.branch·publish-alert·publish-f3-f4
  이고 돈/발행 조가 같은 시각에 그 파일들을 만지는 중이라 이 조 탓이 아니다.
  ★다음 세션은 돈/발행 조 회수 후 이 5건이 해소됐는지 반드시 확인해라.
- 미검증(워커 자기신고): 390 폭 실렌더와 다크 모드 대조 안 함.
  실제 SNS 화면과 미리보기 픽셀 대조 안 함(실계정 필요).
- 워커가 검증용 테넌트 토큰 1개 발급함(라벨 ui-fix-visual-check). 불필요하면 폐기.

새로 발주: 죽은 간격 유틸리티 전수 조사 (sonnet, 첫 저가 모델 배정 적용)
- 배경: 숫자 간격 유틸리티(max-h-80, bottom-24, w-40 등)가 이 테마에서 0 으로 풀린다.
  목차 사건이 그 한 사례일 뿐일 수 있다.
- 지시: 사실 확정 → 전수 조사 → 깨진 것과 안 깨진 것 분리 → 깨진 것만 수정 → 재발 검사 추가.
- 금지 파일: api/publish/route.ts, lib/publish.ts, shorts-factory, lib/studio/generation
  (돈/발행 조가 만지는 중)

아직 도는 조:
- 돈/발행 code-builder (opus). 커밋 e6be3c25 로 무료 재생성 R27 과 quota 복구 경계는
  이미 들어갔다. 나머지(발행 idempotency, reservation lease, indeterminate,
  첫 댓글 실패, shorts fencing) 진행중.
- 간격 유틸리티 조 (sonnet).

막힌 것:
1. 운영 배포 실행. 회장이 GitHub Actions 에서 Deploy openclaw (marketing VM) 수동 실행.
   PR #35 는 머지됨. 세션은 실행하지 않는다.
2. 구조 질문 6건 회장 선택 대기. 문서 렌더해 띄웠다.
3. Supabase 인증 복귀 주소 허용목록 회장 콘솔 확인.
4. 교차 모델 리뷰 불가(codex 소진).

다음 액션:
1. 돈/발행 조 회수 후 verify + publish 테스트 5건 해소 확인.
2. 간격 유틸리티 조 회수.
3. 전체 재검증 E2E(sonnet 배정) + 교차 리뷰(opus).
4. 회장 선택 오면 그 결과를 개발 판으로 발주.

