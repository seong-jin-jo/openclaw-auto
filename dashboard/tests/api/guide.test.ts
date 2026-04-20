import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createTempDir, setupTestEnv, cleanupTestEnv } from '../helpers';

let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
  // Create a common prompt guide
  fs.writeFileSync(path.join(tmpDir, 'prompt-guide.txt'), 'Common guide content');
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
});

describe('GET /api/guide', () => {
  it('returns the common guide', async () => {
    const { GET } = await import('@/app/api/guide/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.guide).toBe('Common guide content');
  });
});

describe('GET /api/guide/[channel]', () => {
  it('returns common guide when no channel-specific guide exists', async () => {
    const { GET } = await import('@/app/api/guide/[channel]/route');
    const res = await GET(
      new Request('http://localhost/api/guide/threads'),
      { params: Promise.resolve({ channel: 'threads' }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.guide).toBe('Common guide content');
    expect(body.channelGuide).toBe(false);
    expect(body.channel).toBe('threads');
  });

  it('returns channel-specific guide when it exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'prompt-guide.threads.txt'), 'Threads specific guide');
    const { GET } = await import('@/app/api/guide/[channel]/route');
    const res = await GET(
      new Request('http://localhost/api/guide/threads'),
      { params: Promise.resolve({ channel: 'threads' }) }
    );
    const body = await res.json();
    expect(body.guide).toBe('Threads specific guide');
    expect(body.channelGuide).toBe(true);
  });
});

describe('POST /api/guide/[channel]', () => {
  it('saves a channel-specific guide', async () => {
    const { POST } = await import('@/app/api/guide/[channel]/route');
    const res = await POST(
      new Request('http://localhost/api/guide/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guide: 'New threads guide' }),
      }),
      { params: Promise.resolve({ channel: 'threads' }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.channel).toBe('threads');

    const saved = fs.readFileSync(path.join(tmpDir, 'prompt-guide.threads.txt'), 'utf-8');
    expect(saved).toBe('New threads guide');
  });
});
