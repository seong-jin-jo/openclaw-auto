# OSMU Marketing Agent — Risks v7.3.5

<!-- STAMP | created_at: 2026-08-07 15:12 KST | model: gpt-codex/gpt-5.6-sol | agent: prd-architect | skills: brand-positioning-kit, openclaw-creative-brief | evidence: PRD v7.3.5, critic v7.3.4, updated audit96 v1.2+independent H/E/F288, current credential/brand/Studio/analytics | deliberation: 행수/hash/critic 침묵 자기인증을 제거하고 exact observable assertion과 mutation teeth를 named kill gate로 둔다. -->

| 항목 | 값 |
|---|---|
| 버전·기반 | v7.3.5 · [역사적 PRD v7.3.5](../notes/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md) |
| 상태 | 역사적 plan 산출물. 현재 제품 정의 정본은 [PRD v8.2.1](../prd-openclaw-service-v8.2.1-gpt-codex.md)이며, 본문은 v8.2.1 기준으로 재검증되지 않음. provider production E2E M=0 |
| 최고위험 | brand truth overwrite·agency theater·wrong-account·unapproved/duplicate publish·fake learning |

## 목차

- [Risk register](#risk-register)
- [Hard stops](#hard-stops)
- [Steelman](#steelman)
- [Premortem](#premortem)
- [셀프심문](#셀프심문)

## TL;DR

제품 신뢰를 무너뜨리는 사건은 브랜드 근거 덮어쓰기, 대행처럼 보이지만 캠페인 책임이 없는 흐름, workspace·계정·승인·중복, 거짓 성과와 가짜 학습이다. v7.3.5는 source family5·adapter6→guide→brief→artifact→proof→metric→experiment의 version lineage를 hard gate로 둔다.

## Risk register

| Risk | Early signal | Prevention/evidence |
|---|---|---|
| wrong account | target/current mismatch | verified ladder+OAuth18 |
| unapproved publish | required tenant external before approval | owner policy+version binding |
| silent policy migration | 기존 direct 버튼 의미 변경 | explicit owner switch+audit |
| readiness/policy 혼용 | 미연결 때 `승인 요청`으로 변경 | policy copy 유지+disabled reason/action |
| duplicate | same intent two surfaces | canonical idempotency+dual-init external≤1 |
| fourth Messaging rail | Telegram/Discord/Slack 상시 preview | rail3 lock+default OFF post-review handoff |
| projection drift | Studio/Queue/Inbox/Calendar diff | parity100%+repair |
| fake unsupported metric | 0·가짜 collected_at/publication | capability source+checked_at+reason+action+N/A3 |
| rights/policy | license/consent/disclosure unknown | V24 approval/publish block |
| low demand/high cost | low repeat/high support | pilot kill+pivot |
| source overwrite/data loss | sync 뒤 approved fact 삭제·변경 | preview diff+human accept+last-good+rollback-as-new-version |
| guide/brief drift | 예전 artifact가 최신 guide를 쓴 것처럼 표시 | immutable generation snapshot+stale impact |
| agency theater | 초안은 많지만 목표·예산·마감·승인·report 없음 | campaign14 exact E2E+owner/due/evidence |
| fake learning | `다음 초안` 링크만 있고 input/diff 변화0 | metric evidence IDs+approved variable1+undo/hold |
| mobile occlusion | 390px sticky bar가 검토 카드/버튼을 가림 | VP75 overlap·operability evidence |
| dual knowledge truth | `wiki_docs`/`brand_guides`가 서로 다른 active 값 제공 | active knowledge1+guide1, legacy direct read0, KCONV24 |
| thin-data false eligible | sample1/불완전 window/권한 gap에도 adequate | approved threshold 전 hold+LEARN10 |
| composite PASS | campaign 한 단계 실패가 14/14에 묻힘 | CAMPAIGN-01~14+AUD96 unique cases |
| workspace stale context | 전환 뒤 이전 tenant draft/action 노출 | explicit switch+all-surface atomic transition+failure prior-state |
| paste-as-import fiction | 기존 wiki를 단일 paste로 완료 처리 | non-GitHub bundle exact counts/source pointers; paste completion0 |
| long-form false publish | export한 Naver/Medium/Substack 결과를 게시됨/발송됨으로 표시 | destination fields+capability truth+unverified adapter call0 |
| credential-class boundary leak | customer OAuth/BYOK 노출, tenant token 재노출, env HTTP 노출, operator reveal 무권한 실행 | Customer8/Operator9 exact owner/action/state + customer OAuth/BYOK/env raw0 + tenant issue1 thereafter0 + operator DB-source reauth/intent/no-store/30s |
| support impersonation | 지원모드에서 고객 대신 게시·승인·시크릿 열람 | owner approval+15/30/60m+reason/banner/audit+forbidden mutations0 |

## Hard stops

- tenant/private/raw-token leak, wrong-account, unapproved or duplicate publication **1건** → automation·신규 cohort 즉시 OFF.
- accepted≥20에서 24h terminalization<95% 또는 projection N≥30 parity<100% → 해당 automation release 차단.
- workspace3 중 <2가 28일 내 Studio→now/schedule→proof→next loop2회 → broad publisher를 grounded composer/handoff로 축소.
- eligible publication≥20에서 evidence-linked next change<50% 또는 Social5 permanent unsupported≥3 → 성과 환류 판매 문구 제거.
- source sync partial overwrite, approved guide history rewrite, unapproved brief fan-out, rights unknown publish 중 **1건** → 해당 automation 즉시 OFF·last-good 복구.
- campaign≥6 중 due date 내 proof/report/next decision closure<80% → “마케팅 대행” 약속을 내리고 publishing workbench로 축소.
- active knowledge/guide 이중 선택, hold fixture production mutation, false-eligible 또는 causal guarantee **1건** → 해당 knowledge/Measure-to-Create automation 즉시 OFF, 재측정·재승인.

## Steelman

가장 강한 반대안은 “14단계 campaign과 최소 wiki까지 넣으면 Buffer·Jasper·Canva의 열등한 합집합이 된다”는 것이다. 맞는 위험이라 전문 편집기·CRM·광고비 집행·general CMS는 만들지 않고, OSMU는 고객 목표·브랜드 version·승인 납품물·발행 증거·다음 실험의 계보만 소유한다. 한 번짜리 공지는 빠른 게시 shortcut을 유지하되 안전 계약을 우회하거나 campaign report에 섞지 않는다.

## Premortem

6개월 뒤 실패했다면 새 wiki를 만든 척했지만 edit/version/last-good가 없고, non-GitHub 자료를 붙여넣기 한 장으로 잃고, workspace 전환 뒤 이전 tenant 초안을 보거나 Substack export를 발송 완료로 오해했을 수 있다. 동시에 campaign이라는 이름으로 무관한 초안을 쌓고 `다음 실험` 링크가 실제 생성 입력을 바꾸지 않았을 가능성이 크다. KCONV24, audit96 semantic crosswalk, campaign14, learning10, Settings8/9와 bounded support fixtures가 이를 사전에 잡아야 한다.

## 셀프심문

**이 단계가 틀렸다면 왜?** 모든 고객이 campaign14를 원하지 않아 onboarding이 첫 가치 시간을 죽일 수 있다. 따라서 대행 캠페인과 빠른 1회 게시를 분리하고 선택률·완료시간·오류율을 측정한다. 새 wiki는 brand fact/source/tone/taboo/proof의 제한 작업만 둔다. 또 baseline-before-hold가 학습 기능을 오래 비워둘 수 있지만, 숫자를 발명해 잘못 바꾸는 것보다 판매 문구를 내리는 것이 안전하다.

RUBRIC_SCORE: 완결성=5/5 정밀성=5/5 벤치마크=4/5 추적성=5/5 전문성=5/5 total=24/25
WEAKEST_LINE: Provider app review·허용 scope·약관은 production 검증 전 외부 회수 필요다.
SKILLS_USED: brand-positioning-kit — brand truth·taboo·proof 위험 / openclaw-creative-brief — brief·rights·feedback·approval 위험
SKILLS_SKIPPED: 없음
PRESENTATION_CHECK: 툴 잔재0·목차/표 구조 확인; 최종 웹 렌더는 exit report에 기록
SOURCES: `openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md`; critic v7.3.4; updated audit96 v1.2; independent ABC/DE/FGH H/E/F288 manifest; mutation fixture; agency blueprint14; current credential/RepoConnect/sync-wiki/wiki-retrieve/Studio/analytics; Jasper/HubSpot/Buffer/Sprout; RFC9700.
MODEL: gpt-codex/gpt-5.6-sol
