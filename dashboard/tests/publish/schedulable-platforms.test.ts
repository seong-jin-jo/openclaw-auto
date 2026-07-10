import { describe, it, expect } from 'vitest';
import { SCHEDULABLE_PLATFORMS } from '@/lib/constants';
import { PROVIDERS, getProvider } from '@/lib/social-connect';

// "노출=발행가능" 원칙(wiki/reference/channel-status.md) 회귀 방지.
// OAuth "연결"은 12채널(threads/instagram/x/facebook + PROVIDERS 8종)까지 구현됐지만
// 대시보드 직접 "발행"(lib/publish.ts)은 SCHEDULABLE_PLATFORMS 4채널뿐이다.
// SocialConnectButton은 이 집합으로 "발행 준비 중" 배지 노출 여부를 판단한다 — SSOT가
// 여기서 흔들리면 그 UI 판단도 같이 흔들리므로, 두 소스(constants·social-connect)의
// 교차 상태를 이 테스트로 고정한다.
describe('발행 지원 채널 집합 SSOT (SCHEDULABLE_PLATFORMS)', () => {
  it('현재 발행 지원 4채널 — threads/x/facebook/instagram', () => {
    expect([...SCHEDULABLE_PLATFORMS].sort()).toEqual(['facebook', 'instagram', 'threads', 'x'].sort());
  });

  it('연결만 되고 발행 미지원인 채널(OAuth PROVIDERS 8종)은 SCHEDULABLE_PLATFORMS 밖 — UI가 정직 배지를 띄워야 하는 대상', () => {
    const connectOnlyProviders = Object.keys(PROVIDERS).filter(
      (name) => !(SCHEDULABLE_PLATFORMS as readonly string[]).includes(name),
    );
    // linkedin/youtube/naver_blog/pinterest/tumblr/tiktok/slack/line = 연결만 가능, 발행 미지원.
    expect(connectOnlyProviders.sort()).toEqual(
      ['linkedin', 'youtube', 'naver_blog', 'pinterest', 'tumblr', 'tiktok', 'slack', 'line'].sort(),
    );
    for (const name of connectOnlyProviders) {
      expect((SCHEDULABLE_PLATFORMS as readonly string[]).includes(name)).toBe(false);
    }
  });

  it('발행 지원 4채널은 모두 connect provider(getProvider)로도 조회 가능 — 연결 UI와 발행 UI가 어긋나지 않음', () => {
    for (const name of SCHEDULABLE_PLATFORMS) {
      expect(getProvider(name)).not.toBeNull();
    }
  });
});
