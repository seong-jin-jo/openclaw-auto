# WF-03 Account Truth in Existing Settings v6

## Purpose

Global Settings와 기존 Channel Settings가 같은 account truth를 보여주되 서로의 역할을 대체하지 않게 한다.

## Global Settings > Channels

```text
Settings
[Channels] [AI Engine] [Storage] [Design Tools] [Notifications]
[Fork 연동] [Keywords] [System]  [Video/TTS: operator only]

Channels
+------------------------------------------------------------------+
| Threads   @j.the.great.investor  연결됨  16:10 확인  [관리]      |
| Instagram @brand.account         재연결 필요         [다시 연결] |
| Facebook  연결된 계정 없음       연결 안 됨          [연결]      |
| X         credential 필요        플랫폼 준비 안 됨   [상세]      |
| ... existing schedule channels remain ...                         |
+------------------------------------------------------------------+
```

### Elements

- Existing settings tabs `9/9` retained.
- Existing channel grid retained, not reduced to six target platforms.
- Row additions: handle, default marker, localized status, last verified, action.
- Global row is summary only.

## Channel Settings detail

```text
Instagram Settings

연결 계정
@brand.account  기본  연결됨  마지막 확인 16:10
[다른 계정으로 연결] [연결 결과 다시 확인]

계정 관리
existing AccountManager list and default action

고급 복구  [펼치기]
  Graph API 직접 입력, 진단, token 재검증
```

### States

- 연결 안 됨: connect primary.
- 연결 확인 중: callback verification, repeated CTA disabled.
- 연결됨: identity and manage primary.
- 재연결 필요: previous identity remains visible, reconnect primary.
- 플랫폼 준비 안 됨: owner action and enable condition.
- 일시 장애: last known identity, retry time, result check.

### Wrong-account recovery

1. Before consent, show current browser identity category.
2. Offer `다른 계정으로 연결`.
3. After callback, show target identity confirmation.
4. If mismatch, do not show connected.
5. Keep Global Settings, Channel Settings, Studio selector consistent.

### Graph token rule

- Manual token is not deleted because it is an existing recovery capability.
- It is moved under collapsed `고급 복구` in target presentation.
- Empty manual field never changes OAuth status.

## Mobile 390

- Settings tabs horizontal scroll.
- Channel rows stack identity, status, timestamp, full-width action.
- Disclosure and buttons minimum 44px.

---

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-04 16:22 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer | skills: design-html, design-review, browse | evidence: ChannelsSettings.tsx, ChannelPage.tsx, InstagramPage.tsx | 고민: duplicate-looking credential UI를 삭제하지 않고 안전한 recovery로 재배치했다.

SKILLS_USED: design-html - settings hierarchy / design-review - consistency and accessibility review / browse - state QA method
SKILLS_SKIPPED: 없음
SOURCES: `dashboard/src/components/settings/ChannelsSettings.tsx`, `dashboard/src/components/channel/ChannelPage.tsx`, `dashboard/src/components/channel/InstagramPage.tsx`, `dashboard/src/components/channel/AccountManager.tsx`, `dashboard/src/components/channel/SocialConnectButton.tsx`
MODEL: gpt-codex/gpt-5.6-sol
