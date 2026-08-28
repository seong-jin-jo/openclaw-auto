---
title: openclaw-auto 위키 스펙
type: meta
owner: "@sj"
policy: protected
updated: 2026-08-28
source: ["../../../d-edu/wiki/0-meta/wiki-spec.md"]
links: ["./_index.md", "../index.md"]
visibility: private
---

# openclaw-auto 위키 스펙

이 위키는 [D-EDU 위키 스펙](../../../d-edu/wiki/0-meta/wiki-spec.md)의 A안 구조를 따른다. 규칙이 충돌하면 D-EDU 정본이 우선한다.

## 고정 구조

- `0-meta`: 위키 자체의 규칙과 지도.
- `1-team-brand`: 왜 존재하는지, 어떤 이름과 목소리를 쓰는지.
- `2-product`: 무엇을 만들고 누구의 문제를 푸는지.
- `3-operations`: 어떻게 운영하고 결정하고 복구하는지.
- `4-reference`: 반복해서 찾는 사실, 환경, 학습 기록.
- `5-hubs`: PM·개발·디자인·마케팅·온보딩의 역할별 입구.

모든 카테고리는 `_index.md`를 갖는다. 한 사실은 한 곳만 정본으로 두며 다른 문서는 링크한다. 현재 구현·검증·배포 상태는 코드, `docs/` 증거, `session-state.*.md`, `pipeline-state.*.md` 순으로 교차 확인한다.
