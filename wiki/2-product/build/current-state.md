---
title: 현재 제품·검증 상태
type: status
owner: "@sj"
policy: living
updated: 2026-08-28
source: ["../../../session-state.osmu.md", "../../../session-state.studio.md", "../../../pipeline-state.osmu.md", "../../../pipeline-state.studio.md", "../../../docs/releases/2026-08-28-osmu-네방.md", "../../../dashboard/src/"]
links: ["./_index.md", "../../3-operations/session-state.md", "../../5-hubs/hub-eng/architecture/data-model.md"]
visibility: private
---

# 현재 제품·검증 상태

## 2026-08-29 Studio 편집 형식값 서버 validation

- 승인 프로토타입 v63의 영상, 카드, 음악 편집 형식 허용값을 한 도메인 계약으로 고정했다.
- 편집실 선택값은 초안에 보존되고 발행 요청까지 전달된다. 초안 저장과 발행 서버는 잘못된 값을 DB와 외부 provider 부작용 전에 422로 거절한다.
- localhost에서 정상 형식 200, 잘못된 4:3 영상 비율 422, 카드 4:5 초안 저장과 재조회를 관찰했다.
- 전체 Vitest 1,388건, TypeScript, production build 174/174, 기본 흐름 11/11, Studio v1 12/12, design lint를 통과했다.
- 운영 배포와 공개 채널 발행, 실제 provider 렌더 결과는 미검증이다.

2026-08-28 코드, 웹 산출물, QA 기록, 상태 파일을 대조한 스냅샷이다. 저장소에 코드가 있다는 사실과 운영에서 동작한다는 사실을 구분한다.

## 현재 제품

- 대시보드 버전은 `0.2.0`이다. Next.js 화면 25개, API route 178개가 있다.
- 자체 extension은 30개이며 그중 발행 extension은 15개다.
- 사용자 핵심 흐름은 생성실, 편집실, 발행실, 성과실의 네 방이다.
- Studio 생성 작업, 멱등 응답, 무료 재생성 사용량은 PostgreSQL에 영속화된다. 편집 인계와 초안 큐 연결도 구현돼 있다.
- 승인 인박스와 발행 캘린더의 각 작업물은 발행실 복귀 문맥을 제공한다. 연결 초안이 있으면 그 상태를 복원하고, 본문 없는 편집 인계 초안은 queue 본문과 초안 메타데이터를 결합한다.

## 단계와 검증

| 라인 | 정식 단계 | 직접 관찰된 증거 | 아직 성립하지 않은 주장 |
|---|---|---|---|
| OSMU | QA | 기본 흐름 11/11, Studio 계약 12/12, inbox와 calendar 발행실 복귀, 네 방 4폭 16/16, Vitest 187파일 1,336건, TypeScript, production build 174경로 | v63 전체 디자인 정합, 운영 배포, 실채널 발행·provider 댓글 읽기 |
| Studio | 기술설계 | 생성 장부 재시작 영속화, 무료 몫 시간대 우회 차단, 편집 인계 API 동작 | 단독 상품용 운영 회원 인증 어댑터, 실 미디어 provider 생성, 운영 배포 |

OSMU 0.2.0 병합 요청은 열려 있다고 상태 파일에 기록돼 있다. 이 페이지는 원격 병합 여부를 독립 확인하지 않았으므로 병합·배포 완료로 표현하지 않는다.

## 현재 블로커

1. v63 시안과 개발 화면의 전역 탐색·담당 패널 구성이 달라 디자인 정합 판정이 NG다.
2. 실제 공개 채널 계정으로 발행과 댓글 읽기를 재현하지 못했다.
3. Studio는 운영 환경에서 개발용 신원을 차단하지만 이를 대체할 회원 인증 어댑터가 없다.
4. OSMU 설계 산출물 일부는 파이프라인 기준 미산출 또는 재작업 상태다. 구현 증거와 단계 승인 이력은 같은 뜻이 아니다.

## 갱신 규칙

수치와 상태는 코드, `docs/qa/qa-tracker.md`, 최신 `session-state.*.md`, `pipeline-state.*.md`를 다시 읽은 뒤에만 바꾼다. 실채널·운영 경로를 직접 보지 않았다면 `미검증`으로 남긴다.
