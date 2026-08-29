import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createTempDir, setupTestEnv, cleanupTestEnv } from '../helpers';

let tmpDir: string;

function writeQueue(tmpDir: string, posts: unknown[]) {
  fs.writeFileSync(path.join(tmpDir, 'queue.json'), JSON.stringify({ posts }, null, 2));
}

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
});

describe('GET /api/threads/low-engagement-candidates', () => {
  it('excludes posts younger than 24h even with low engagement', async () => {
    writeQueue(tmpDir, [
      {
        id: 'young-low',
        status: 'published',
        text: 'fresh post',
        channels: { threads: { status: 'published', mediaId: 'm1', publishedAt: new Date().toISOString() } },
        engagement: { views: 1, likes: 0 },
      },
    ]);
    const { GET } = await import('@/app/api/threads/low-engagement-candidates/route');
    const res = await GET(new Request('http://localhost/api/threads/low-engagement-candidates'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.candidates).toHaveLength(0);
  });

  it('excludes posts with engagement above threshold', async () => {
    const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    writeQueue(tmpDir, [
      {
        id: 'old-high',
        status: 'published',
        text: 'good post',
        channels: { threads: { status: 'published', mediaId: 'm2', publishedAt: oldDate } },
        engagement: { views: 5000, likes: 200 },
      },
    ]);
    const { GET } = await import('@/app/api/threads/low-engagement-candidates/route');
    const res = await GET(new Request('http://localhost/api/threads/low-engagement-candidates'));
    const body = await res.json();
    expect(body.candidates).toHaveLength(0);
  });

  it('includes old, low-engagement published posts as candidates', async () => {
    const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    writeQueue(tmpDir, [
      {
        id: 'old-low',
        status: 'published',
        text: 'quiet post',
        channels: { threads: { status: 'published', mediaId: 'm3', publishedAt: oldDate } },
        engagement: { views: 5, likes: 0 },
      },
    ]);
    const { GET } = await import('@/app/api/threads/low-engagement-candidates/route');
    const res = await GET(new Request('http://localhost/api/threads/low-engagement-candidates'));
    const body = await res.json();
    expect(body.candidates).toHaveLength(1);
    expect(body.candidates[0].id).toBe('old-low');
    expect(body.deleteSupportedChannels).toContain('threads');
  });
});
