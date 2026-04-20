import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTempDir, setupTestEnv, cleanupTestEnv, copyFixture } from '../helpers';

let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
  copyFixture(tmpDir, 'queue.json');
  copyFixture(tmpDir, 'growth.json');
  copyFixture(tmpDir, 'settings.json');
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
});

describe('GET /api/overview', () => {
  it('returns statusCounts, followers, and channel data', async () => {
    const { GET } = await import('@/app/api/overview/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Status counts
    expect(body.statusCounts.draft).toBe(1);
    expect(body.statusCounts.approved).toBe(1);
    expect(body.statusCounts.published).toBe(1);
    expect(body.statusCounts.failed).toBe(0);

    // Followers from growth.json
    expect(body.followers).toBe(1080);
    expect(body.weekDelta).toBe(80); // 1080 - 1000

    // Viral posts (views >= 500)
    expect(body.viralPosts).toHaveLength(1);
    expect(body.viralPosts[0].views).toBe(1200);

    // Channel counts
    expect(body.channelCounts.threads).toBe(1);
    expect(body.channelCounts.x).toBe(1);
  });

  it('handles empty data gracefully', async () => {
    // Remove all fixtures to test empty state
    const fs = await import('fs');
    const path = await import('path');
    fs.unlinkSync(path.join(tmpDir, 'queue.json'));
    fs.unlinkSync(path.join(tmpDir, 'growth.json'));
    fs.unlinkSync(path.join(tmpDir, 'settings.json'));

    const { GET } = await import('@/app/api/overview/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.statusCounts.draft).toBe(0);
    expect(body.followers).toBeNull();
  });
});
