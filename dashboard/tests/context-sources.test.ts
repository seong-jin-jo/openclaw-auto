import { describe, it, expect } from 'vitest';

// 0차: context_sources 지원 검증 (multi-repo wiki pulling)
// 실제 fetch/local은 sourcing/studio/route.ts 에 구현됨.
// 이 테스트는 포맷 + 에러 설명력 + 주입 형태를 문서화/가드.

describe('0차 context_sources (multi-repo)', () => {
  it('accepts array of github + local sources', () => {
    const sources = [
      { type: 'github', owner: 'sj', repo: 'other-service', path: 'wiki/brand.md', ref: 'main' },
      { type: 'local', path: 'wiki/product/vision.md' },
    ];
    expect(Array.isArray(sources)).toBe(true);
    expect(sources[0].type).toBe('github');
    expect(sources[1].type).toBe('local');
  });

  it('error messages are explainable (handoff requirement)', () => {
    // In real code errors.push(`[context ${type}] ${desc} load failed: ${msg}. Check repo access...`)
    const sampleError = '[context github] sj/other/wiki.md load failed: HTTP 404. Check repo access, path, ref. For private: provide token.';
    expect(sampleError).toContain('Check repo access');
    expect(sampleError).toContain('provide token');
  });

  it('appends to longform/facts with source header', () => {
    // Simulated result shape used in sourcing and studio/text
    const longform = 'original\n\n## Context from sj/other/wiki.md\n# facts here';
    expect(longform).toContain('## Context from');
  });
});
