## 2026-08-29 21:00 KST Claude 세션 (osmu 라인) 배포 교착 규명

핸드오프 기준: 이 파일(session-state.osmu.md).

★★ 배포 교착 발견 (실측). 이게 오늘 배포 세 번이 다 죽은 진짜 이유다.
  1) deploy-marketing.yml 의 DB preflight 가 exit 3.
     schema_fingerprint=S1|S2, readiness=false|true.
     런 33246210028, 33250383895 동일.
  2) readiness 를 true 로 만드는 것은 osmu-db-migrate.yml 의 expand-member
     (마이그레이션 20260829_030_member_unique_expand).
  3) 그 phase 를 컨트롤러가 돌렸더니(런 33251038676) 이렇게 죽었다.
     "running app commit label is not observable"
     돌고 있는 컨테이너에 org.opencontainers.image.revision 라벨이 없다.
     지금 떠 있는 것은 08-28 22:15 배포본이다.
  4) 그 라벨은 새 배포가 붙인다(Dockerfile:21, compose:40, deploy wf 의 OSMU_BUILD_COMMIT).
  ⇒ 배포는 마이그레이션을 기다리고 마이그레이션은 배포를 기다린다. 첫 바퀴가 안 돈다.
  ⇒ opus code-builder 에 교착 해소 발주함. 산출물
     docs/releases/2026-08-29-배포-교착-해소-순서.md 에 회장이 누를 순서를 적게 했다.
  ⇒ 리뷰 문서의 run-migrations.sh:123 지적이 같은 뿌리다. 함께 고치라고 지시함.

★ 인프라 구조 (deploy-marketing.yml 실독):
  - GitHub Actions self-hosted runner, 라벨 marketing_runner. 마케팅 VM 위에서 돈다.
  - docker compose -f docker-compose.postagi-4tenants.yml, 서비스는 gateway + dashboard.
  - 앱 컨테이너 openclaw-dashboard-osmu, 내부 포트 18789.
  - DB 는 Supabase Postgres. OSMU_DATABASE_URL 로 붙는다.
  - 인증도 Supabase. NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 는 빌드 시각 인라인이다.
    ★그래서 이 둘을 나중에 바꾸면 재빌드해야 반영된다.
  - 설정은 GitHub Secrets 에서 .env.osmu 로 렌더된다.
  - 워크플로 4개: ci.yml(테스트), deploy-marketing.yml(배포, 수동),
    osmu-db-migrate.yml(스키마 단계별 적용, 수동), osmu-health-monitor.yml(정기 점검).

회수 완료: 죽은 간격 유틸리티 전수 조사 (sonnet, 커밋 7ac8257e)
- ★내 앞선 보고가 틀렸다. "숫자 간격 유틸리티가 전역으로 죽는다"는 전제가 부정확했다.
  globals.css 는 Tailwind v4 기본 --spacing(.25rem)을 재정의하지 않는다.
  @theme inline 이 --spacing-micro 같은 하위 토큰만 추가한다.
- 실측: Playwright 격리 probe 로 w-40/h-64 를 재니 160px/256px 정확히 나온다.
- 전수조사 325건, 새로 깨진 자리 0건. 목차 사고는 이미 고쳐졌고 잔존 결함 없음.
- p-/m-/gap-/space- 계열은 이미 전부 이름 토큰 사용중. 남은 숫자는 치수·좌표라 토큰 대상 아님.
- 회귀 가드 2건 추가: globals.css 가 접두어 없는 --spacing 을 재정의하면 즉시 FAIL.
- 전체 테스트 1,469 통과 실패 0. ★앞 판에서 실패하던 publish 5건이 해소됐다
  (돈/발행 조 커밋이 들어간 것으로 보인다. 그 조 회수 시 재확인할 것).

★ 하네스 규칙 신설: ~/.claude/CLAUDE.md §5.5
  "화면·구조 선택지는 회장이 고르는 노동을 하지 않게 낸다."
  회장 2026-08-29 지적("일단 내가 번거롭게 대답하며 넘어갈게 이번엔") 근거.
  기본값은 추천안 자동 채택. 회장 승인은 돈·비가역·정체성 셋만.
  답해야 할 항목이 넷 넘으면 컨트롤러 실패. 위반 = [askload].

★ 회장 결정 접수: 구조 질문 6건 전부 추천대로 진행.
  단 5번(영상 모델)은 결과를 보고 고르되 "무슨 모델인지 설명"이 화면에 있어야 한다.
  즉 모델 이름을 1차에서 지우되 완전히 감추지는 말고, 고른 뒤 무엇으로 만들었는지
  알 수 있게 한다. 이건 "대충 만들어 준다"가 아니라는 증거이기도 하다.

★ 회장이 말한 제품 정체성 (이름 결정과 카피의 기준):
  1) 주된 강점 = 프롬프트 하네스 추상화 + 콘텐츠 eval + 라이프사이클 관리
  2) 부가 강점 = Claude Max 나 힉스필드 구독 없이 쓴 만큼만 내고 만들어 볼 수 있다
  3) 넘지 말 선 = 클릭으로 편하게 하되 "대충"이면 안 된다. 전문성·품질·임팩트가
     증명돼야 고객이 터미널 안 켜고 우리를 쓸 이유가 된다.
  4) 이름 후보로 marketify 를 던졌고 정체성이 살길 원한다.
  ⇒ fable content-growth-marketer 에 발주. 산출물
     docs/design-docs/제품이름-후보와-근거-v1.0.0-fable-20260829.md

아직 도는 조:
- 돈/발행 code-builder (opus)
- 배포 교착 해소 code-builder (opus)
- 제품 이름 content-growth-marketer (fable)

막힌 것:
1. 배포. 교착이라 회장이 눌러도 안 나간다. 해소 조 산출물 나오면 순서대로 진행.
2. Supabase 인증 복귀 주소 허용목록. 세션에 Supabase 관리 토큰이 없다
   (~/.sj-agent-harness/secrets 에 openclaw-auto-qa.env 의 QA 계정만 있고
    관리 API 토큰 없음). 회장 콘솔 조작이거나 관리 토큰 발급이 필요하다.
3. 교차 모델 리뷰 불가(codex 소진).

다음 액션:
1. 배포 교착 해소 조 회수 → 회장에게 누를 순서 제시.
2. 돈/발행 조 회수 → verify.
3. 제품 이름 회수 → 회장 결정.
4. 5번 영상 모델 "무슨 모델인지 설명" 요구를 개발 판으로 발주.
5. 전체 재검증 E2E(sonnet) + 교차 리뷰(opus).

