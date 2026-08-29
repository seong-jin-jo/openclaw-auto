import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createTempDir, setupTestEnv, cleanupTestEnv, readTempJson } from '../helpers';

let tmpDir: string;

function writeQueue(tmpDir: string, posts: unknown[]) {
  fs.writeFileSync(path.join(tmpDir, 'queue.json'), JSON.stringify({ posts }, null, 2));
}

vi.mock('@/lib/publish', () => ({
  getChannelCred: vi.fn(async () => ({ token: 'fake-token' })),
}));

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
  vi.unstubAllGlobals();
});

describe('POST /api/threads/low-engagement-cleanup', () => {
  it('rejects when no postIds are given', async () => {
    const { POST } = await import('@/app/api/threads/low-engagement-cleanup/route');
    const res = await POST(new Request('http://localhost/api/threads/low-engagement-cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });

  it('rejects an unsupported channel postId with a clear error, without deleting', async () => {
    writeQueue(tmpDir, [
      { id: 'ig-post', status: 'published', text: 'ig only', channels: { instagram: { status: 'published' } } },
    ]);
    vi.stubGlobal('fetch', vi.fn());
    const { POST } = await import('@/app/api/threads/low-engagement-cleanup/route');
    const res = await POST(new Request('http://localhost/api/threads/low-engagement-cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postIds: ['ig-post'], tenant_id: 'test-tenant' }),
    }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.results[0].ok).toBe(false);
    expect(body.results[0].error).toBeTruthy();
    const saved = readTempJson<{ posts: Array<{ id: string; status: string }> }>(tmpDir, 'queue.json');
    expect(saved!.posts[0].status).toBe('published');
  });

  it('deletes only the approved postIds and leaves other posts untouched', async () => {
    writeQueue(tmpDir, [
      { id: 'target', status: 'published', text: 'quiet', channels: { threads: { status: 'published', mediaId: 'media-1' } } },
      { id: 'untouched', status: 'published', text: 'other', channels: { threads: { status: 'published', mediaId: 'media-2' } } },
    ]);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })));

    const { POST } = await import('@/app/api/threads/low-engagement-cleanup/route');
    const res = await POST(new Request('http://localhost/api/threads/low-engagement-cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postIds: ['target'], tenant_id: 'test-tenant' }),
    }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.deleted).toBe(1);

    const saved = readTempJson<{ posts: Array<{ id: string; status: string }> }>(tmpDir, 'queue.json');
    const target = saved!.posts.find((p) => p.id === 'target')!;
    const untouched = saved!.posts.find((p) => p.id === 'untouched')!;
    expect(target.status).toBe('failed');
    expect(untouched.status).toBe('published');

    const log = readTempJson<{ entries: Array<{ postId: string; ok: boolean }> }>(tmpDir, 'low-engagement-cleanup-log.json');
    expect(log!.entries.some((e) => e.postId === 'target' && e.ok)).toBe(true);
  });
});
